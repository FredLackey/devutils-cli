# Story 006: Build the AWS API Plugin

## Goal
Build the AWS plugin as a separate git repo and npm package (`@fredlackey/devutils-api-aws`). It wraps core AWS services into 15 commands across 6 resources: compute (list/get/start/stop/status), buckets (list), objects (list/upload/download), functions (list/invoke/logs), and groups (list/status/start/stop). Auth service: `aws`. This is the first non-Google plugin and uses the AWS SDK instead of `googleapis`.

## Prerequisites
- 017-api-plugins/001 (plugin template)
- 011-auth/001 (auth service)

## Background
The AWS plugin is structurally different from the Google plugins. Instead of a single SDK that covers all services, AWS has individual SDK packages for each service: `@aws-sdk/client-ec2` for compute, `@aws-sdk/client-s3` for storage, `@aws-sdk/client-lambda` for functions, and `@aws-sdk/client-resource-groups-tagging-api` for groups.

Auth is also different. Instead of OAuth tokens, AWS uses access key pairs (access key ID + secret access key) and optional session tokens. The core CLI's auth system stores these credentials, and the plugin reads them from `context.auth`. The AWS SDK clients accept credentials through their constructor.

Most AWS commands take an optional `--region` flag because AWS resources are region-specific.

This plugin uses flat resource names (`buckets`, `objects`) instead of nesting them under a parent `storage` resource. This avoids sub-resource routing complexity in the plugin loader -- the loader's `resolveCommand(pluginName, resourceName, commandName)` expects exactly three segments, and flat resource names keep every CLI path at 4 segments (e.g., `dev api aws buckets list` instead of `dev api aws storage buckets list`). See 012-api-system/001-plugin-loader.md Step 5b for the rationale.

Command signatures are defined in `research/proposed/proposed-command-syntax.md` lines 833-916.

### AWS API Mapping

| Command | AWS Service | SDK Client |
|---------|-----------|------------|
| compute list/get/start/stop/status | EC2 | @aws-sdk/client-ec2 |
| buckets list | S3 | @aws-sdk/client-s3 |
| objects list/upload/download | S3 | @aws-sdk/client-s3 |
| functions list/invoke/logs | Lambda + CloudWatch | @aws-sdk/client-lambda, @aws-sdk/client-cloudwatch-logs |
| groups list/status/start/stop | Resource Groups + EC2 | @aws-sdk/client-resource-groups-tagging-api, @aws-sdk/client-ec2 |

## Technique

### Step 1: Create the repo and scaffold

1. Create the repo at `git@github.com:FredLackey/devutils-api-aws.git`.
2. Copy and customize the plugin template: `<service>` -> `aws`, auth -> `aws`.
3. Add AWS SDK dependencies:
   ```json
   "dependencies": {
     "@aws-sdk/client-ec2": "^3.0.0",
     "@aws-sdk/client-s3": "^3.0.0",
     "@aws-sdk/client-lambda": "^3.0.0",
     "@aws-sdk/client-cloudwatch-logs": "^3.0.0",
     "@aws-sdk/client-resource-groups-tagging-api": "^3.0.0"
   }
   ```

### Step 2: Set up `index.js`

```javascript
module.exports = {
  name: 'aws',
  description: 'Amazon Web Services (compute, buckets, objects, functions, groups)',
  version: '1.0.0',
  auth: 'aws',
  resources: {
    compute: {
      description: 'EC2 instances',
      commands: {
        list:   () => require('./commands/compute/list'),
        get:    () => require('./commands/compute/get'),
        start:  () => require('./commands/compute/start'),
        stop:   () => require('./commands/compute/stop'),
        status: () => require('./commands/compute/status'),
      }
    },
    buckets: {
      description: 'S3 buckets',
      commands: {
        list:   () => require('./commands/buckets/list'),
      }
    },
    objects: {
      description: 'S3 objects',
      commands: {
        list:     () => require('./commands/objects/list'),
        upload:   () => require('./commands/objects/upload'),
        download: () => require('./commands/objects/download'),
      }
    },
    functions: {
      description: 'Lambda functions',
      commands: {
        list:   () => require('./commands/functions/list'),
        invoke: () => require('./commands/functions/invoke'),
        logs:   () => require('./commands/functions/logs'),
      }
    },
    groups: {
      description: 'Resource groups (tag-based)',
      commands: {
        list:   () => require('./commands/groups/list'),
        status: () => require('./commands/groups/status'),
        start:  () => require('./commands/groups/start'),
        stop:   () => require('./commands/groups/stop'),
      }
    }
  }
};
```

### Step 3: Create the shared helper

Create `commands/_helpers.js`:
```javascript
const { EC2Client } = require('@aws-sdk/client-ec2');
const { S3Client } = require('@aws-sdk/client-s3');
const { LambdaClient } = require('@aws-sdk/client-lambda');
const { CloudWatchLogsClient } = require('@aws-sdk/client-cloudwatch-logs');
const { ResourceGroupsTaggingAPIClient } = require('@aws-sdk/client-resource-groups-tagging-api');

/**
 * Build AWS client credentials from the context.
 * context.auth should provide { accessKeyId, secretAccessKey, sessionToken? }
 */
function getCredentials(context) {
  return {
    accessKeyId: context.auth.accessKeyId,
    secretAccessKey: context.auth.secretAccessKey,
    ...(context.auth.sessionToken && { sessionToken: context.auth.sessionToken })
  };
}

function getEC2(context, region) {
  return new EC2Client({
    region: region || context.auth.region || 'us-east-1',
    credentials: getCredentials(context)
  });
}

function getS3(context, region) {
  return new S3Client({
    region: region || context.auth.region || 'us-east-1',
    credentials: getCredentials(context)
  });
}

function getLambda(context, region) {
  return new LambdaClient({
    region: region || context.auth.region || 'us-east-1',
    credentials: getCredentials(context)
  });
}

function getCloudWatchLogs(context, region) {
  return new CloudWatchLogsClient({
    region: region || context.auth.region || 'us-east-1',
    credentials: getCredentials(context)
  });
}

function getTagging(context, region) {
  return new ResourceGroupsTaggingAPIClient({
    region: region || context.auth.region || 'us-east-1',
    credentials: getCredentials(context)
  });
}

module.exports = { getEC2, getS3, getLambda, getCloudWatchLogs, getTagging };
```

### Step 4: Implement each command

Create the directory structure:
```
commands/
├── _helpers.js
├── compute/
│   ├── list.js        # --region, --state, --tag flags
│   ├── get.js         # <instance-id> argument, --region flag
│   ├── start.js       # <instance-id> argument, --region flag
│   ├── stop.js        # <instance-id> argument, --region flag
│   └── status.js      # <instance-id> argument, --region flag
├── buckets/
│   └── list.js        # --region flag
├── objects/
│   ├── list.js        # <bucket> argument, --prefix, --limit flags
│   ├── upload.js      # <path> <bucket> <key> arguments, --region flag
│   └── download.js    # <bucket> <key> arguments, --output, --region flags
├── functions/
│   ├── list.js        # --region flag
│   ├── invoke.js      # <name> argument, --payload, --region flags
│   └── logs.js        # <name> argument, --limit, --since, --region flags
└── groups/
    ├── list.js        # --tag, --region flags
    ├── status.js      # <tag-key> <tag-value> arguments, --region flag
    ├── start.js       # <tag-key> <tag-value> arguments, --region flag
    └── stop.js        # <tag-key> <tag-value> arguments, --region flag
```

Key implementation details:

- **compute list**: Use `DescribeInstancesCommand`. If `--state` is provided, add a filter: `{ Name: 'instance-state-name', Values: [args.state] }`. If `--tag` is provided, parse the `key=value` format and add a filter: `{ Name: 'tag:${key}', Values: [value] }`.

- **compute start/stop**: Use `StartInstancesCommand` / `StopInstancesCommand` with `{ InstanceIds: [args.instanceId] }`.

- **objects upload**: Use `PutObjectCommand`. Read the local file with `fs.createReadStream(args.path)` and pass it as the `Body`.

- **objects download**: Use `GetObjectCommand`. The response body is a stream. Pipe it to `fs.createWriteStream(args.output)`.

- **functions invoke**: Use `InvokeCommand`. The `--payload` flag (or `--json` global flag) provides the input. The response body needs to be decoded from a Uint8Array: `JSON.parse(Buffer.from(response.Payload).toString())`.

- **functions logs**: Use CloudWatch Logs. First resolve the log group name (`/aws/lambda/${functionName}`), then use `FilterLogEventsCommand` to get recent events. The `--since` flag accepts durations like `1h`, `30m`, `7d` -- parse these into a timestamp.

- **groups list/status/start/stop**: The groups resource uses tag-based grouping. `groups list` uses `GetResourcesCommand` from the Tagging API. `groups status` finds all EC2 instances with the given tag and reports their states. `groups start` and `groups stop` find tagged EC2 instances and call `StartInstancesCommand` / `StopInstancesCommand` on them.

### Step 5: Publish

Verify with `npm pack --dry-run`, then `npm publish --access public`.

## Files to Create or Modify
- `package.json` -- New file. Package metadata with AWS SDK dependencies.
- `index.js` -- New file. Plugin contract with 6 resources and 15 command loaders.
- `commands/_helpers.js` -- New file. AWS client builders for all services.
- `commands/compute/list.js` -- New file.
- `commands/compute/get.js` -- New file.
- `commands/compute/start.js` -- New file.
- `commands/compute/stop.js` -- New file.
- `commands/compute/status.js` -- New file.
- `commands/buckets/list.js` -- New file.
- `commands/objects/list.js` -- New file.
- `commands/objects/upload.js` -- New file.
- `commands/objects/download.js` -- New file.
- `commands/functions/list.js` -- New file.
- `commands/functions/invoke.js` -- New file.
- `commands/functions/logs.js` -- New file.
- `commands/groups/list.js` -- New file.
- `commands/groups/status.js` -- New file.
- `commands/groups/start.js` -- New file.
- `commands/groups/stop.js` -- New file.
- `README.md` -- New file.
- `.gitignore` -- New file.

## Acceptance Criteria
- [ ] The plugin repo exists at `git@github.com:FredLackey/devutils-api-aws.git`
- [ ] `index.js` exports the correct contract with `name: 'aws'`, `auth: 'aws'`
- [ ] All 15 command files exist and export `{ meta, run }`
- [ ] Every command accepts a `--region` flag
- [ ] `dev api enable aws` installs the plugin
- [ ] `dev api aws compute list` lists EC2 instances
- [ ] `dev api aws compute start <id>` starts an instance
- [ ] `dev api aws buckets list` lists S3 buckets
- [ ] `dev api aws objects upload ./file.txt mybucket mykey` uploads a file
- [ ] `dev api aws functions list` lists Lambda functions
- [ ] `dev api aws functions invoke myFunc --payload '{"key":"value"}'` invokes a function
- [ ] `dev api aws groups list --tag "env=prod"` lists resources by tag
- [ ] `dev schema api.aws` lists all 6 resources
- [ ] AWS API errors are caught and returned as structured errors
- [ ] The npm package publishes successfully

## Testing
```bash
# Install and verify
dev api enable aws
dev api list
dev schema api.aws

# Test compute (requires AWS auth)
dev auth login aws
dev api aws compute list --region us-east-1 --format json
dev api aws compute list --state running --format json
dev api aws compute status <instance-id> --format json

# Test storage (buckets and objects are separate resources)
dev api aws buckets list --format json
dev api aws objects list mybucket --prefix "logs/" --format json

# Test functions
dev api aws functions list --format json
dev api aws functions invoke myFunc --payload '{"test": true}' --format json

# Test groups
dev api aws groups list --tag "env=prod" --format json
```

## Notes
- The AWS SDK v3 uses individual packages per service. This adds more `dependencies` entries but keeps the install size reasonable because each package only pulls in what it needs.
- Every command should accept `--region`. If not provided, fall back to `context.auth.region`, then to `us-east-1` as the final default. Document this in each command's `meta` flags.
- The `groups` resource is the most complex. It's not a native AWS service -- it's a pattern where you use tags to group resources and then operate on them together. The implementation involves cross-service calls (Tagging API to find resources, EC2 to start/stop them). Keep each step clear and handle partial failures (some instances might start while others fail).
- AWS errors have a different structure than Google errors. They typically include `$metadata.httpStatusCode`, `Code`, and `message` fields. Map these to the standard `context.errors.throw(code, message)` format.
- The `functions logs` command parses durations like `1h`, `30m`, `7d` into timestamps. Write a small helper for this -- don't pull in a date library. Multiply the numeric part by the unit in milliseconds, subtract from `Date.now()`.
- S3 operations are split into two flat resources (`buckets` and `objects`) instead of being nested under a `storage` parent. This keeps all CLI paths at 4 segments (e.g., `dev api aws buckets list`) and avoids sub-resource routing complexity in the plugin loader. See 012-api-system/001-plugin-loader.md Step 5b for the rationale behind this pattern.
