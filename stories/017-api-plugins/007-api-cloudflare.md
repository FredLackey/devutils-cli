# Story 007: Build the Cloudflare API Plugin

## Goal
Build the Cloudflare plugin as a separate git repo and npm package (`@fredlackey/devutils-api-cloudflare`). It wraps the Cloudflare API into 10 commands across 3 resources: zones (list/get/create), dns (list/get/create/update/delete), and tokens (list/verify). Auth service: `cloudflare`. This plugin uses Cloudflare's REST API directly with Node.js built-in `https` or a lightweight HTTP client -- no SDK dependency needed.

## Prerequisites
- 017-api-plugins/001 (plugin template)
- 011-auth/001 (auth service)

## Background
Cloudflare provides a REST API at `https://api.cloudflare.com/client/v4/`. Authentication is done via API tokens or API keys. An API token is passed in the `Authorization: Bearer <token>` header. An API key is passed in the `X-Auth-Key` header along with `X-Auth-Email`.

The core CLI's auth system stores the Cloudflare credentials. The plugin reads them from `context.auth` which should provide either `{ token }` (for API token auth) or `{ apiKey, email }` (for API key auth).

Unlike the Google and AWS plugins, this one doesn't need an SDK. Cloudflare's API is clean REST with JSON bodies, so direct HTTP calls are simpler and avoid an extra dependency.

Command signatures are defined in `research/proposed/proposed-command-syntax.md` lines 918-972.

### Cloudflare API Endpoint Mapping

| Command | HTTP Method | Endpoint |
|---------|-----------|----------|
| zones list | GET | /client/v4/zones |
| zones get | GET | /client/v4/zones/{zone_id} |
| zones create | POST | /client/v4/zones |
| dns list | GET | /client/v4/zones/{zone_id}/dns_records |
| dns get | GET | /client/v4/zones/{zone_id}/dns_records/{record_id} |
| dns create | POST | /client/v4/zones/{zone_id}/dns_records |
| dns update | PATCH | /client/v4/zones/{zone_id}/dns_records/{record_id} |
| dns delete | DELETE | /client/v4/zones/{zone_id}/dns_records/{record_id} |
| tokens list | GET | /client/v4/user/tokens |
| tokens verify | GET | /client/v4/user/tokens/verify |

## Technique

### Step 1: Create the repo and scaffold

1. Create the repo at `git@github.com:FredLackey/devutils-api-cloudflare.git`.
2. Copy and customize the plugin template: `<service>` -> `cloudflare`, auth -> `cloudflare`.
3. No SDK dependencies needed. The `dependencies` in `package.json` can be empty.

### Step 2: Set up `index.js`

```javascript
module.exports = {
  name: 'cloudflare',
  description: 'Cloudflare (zones, DNS records, API tokens)',
  version: '1.0.0',
  auth: 'cloudflare',
  resources: {
    zones: {
      description: 'DNS zones (domains)',
      commands: {
        list:   () => require('./commands/zones/list'),
        get:    () => require('./commands/zones/get'),
        create: () => require('./commands/zones/create'),
      }
    },
    dns: {
      description: 'DNS records',
      commands: {
        list:   () => require('./commands/dns/list'),
        get:    () => require('./commands/dns/get'),
        create: () => require('./commands/dns/create'),
        update: () => require('./commands/dns/update'),
        delete: () => require('./commands/dns/delete'),
      }
    },
    tokens: {
      description: 'API tokens',
      commands: {
        list:   () => require('./commands/tokens/list'),
        verify: () => require('./commands/tokens/verify'),
      }
    }
  }
};
```

### Step 3: Create the shared helper

Create `commands/_helpers.js`. This is the HTTP client for the Cloudflare API:

```javascript
const https = require('https');

const BASE_URL = 'https://api.cloudflare.com/client/v4';

/**
 * Build authorization headers from context.auth.
 * Supports both API token and API key auth.
 */
function getHeaders(context) {
  const headers = { 'Content-Type': 'application/json' };
  if (context.auth.token) {
    headers['Authorization'] = `Bearer ${context.auth.token}`;
  } else if (context.auth.apiKey && context.auth.email) {
    headers['X-Auth-Key'] = context.auth.apiKey;
    headers['X-Auth-Email'] = context.auth.email;
  }
  return headers;
}

/**
 * Make an HTTP request to the Cloudflare API.
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
 * @param {string} path - API path (e.g., /zones)
 * @param {object} context - Core CLI context
 * @param {object} [body] - Request body for POST/PATCH
 * @param {object} [queryParams] - Query string parameters
 * @returns {Promise<object>} Parsed JSON response
 */
function request(method, path, context, body, queryParams) {
  return new Promise((resolve, reject) => {
    let url = `${BASE_URL}${path}`;

    if (queryParams) {
      const qs = new URLSearchParams(queryParams).toString();
      if (qs) url += `?${qs}`;
    }

    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: getHeaders(context)
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

module.exports = { request };
```

### Step 4: Implement each command

Create the directory structure:
```
commands/
├── _helpers.js
├── zones/
│   ├── list.js        # --limit flag
│   ├── get.js         # <zone-id> argument
│   └── create.js      # <domain> argument
├── dns/
│   ├── list.js        # <zone-id> argument, --type, --name flags
│   ├── get.js         # <zone-id> and <record-id> arguments
│   ├── create.js      # <zone-id> argument, --type, --name, --content, --ttl, --proxied flags
│   ├── update.js      # <zone-id> and <record-id> arguments, optional --type, --name, --content, --ttl, --proxied
│   └── delete.js      # <zone-id> and <record-id> arguments, --confirm flag
└── tokens/
    ├── list.js        # No arguments
    └── verify.js      # --token flag (optional, uses stored token by default)
```

Here is `commands/zones/list.js` as the reference pattern:

```javascript
const { request } = require('../_helpers');

const meta = {
  description: 'List all zones (domains) in the account',
  arguments: [],
  flags: [
    { name: 'limit', type: 'number', description: 'Maximum number of results to return' }
  ]
};

async function run(args, context) {
  try {
    const params = {};
    if (args.limit) params.per_page = args.limit;

    const res = await request('GET', '/zones', context, null, params);

    if (!res.success) {
      const err = (res.errors && res.errors[0]) || {};
      return context.errors.throw(err.code || 400, err.message || 'Request failed');
    }

    return context.output.render({
      zones: res.result,
      totalCount: res.result_info ? res.result_info.total_count : res.result.length
    });
  } catch (err) {
    return context.errors.throw(500, err.message || 'Failed to list zones');
  }
}

module.exports = { meta, run };
```

Key implementation details per command:

- **dns create**: The `--type`, `--name`, and `--content` flags are required. `--ttl` defaults to `1` (automatic). `--proxied` is a boolean flag, defaults to `false`. Post body: `{ type, name, content, ttl, proxied }`.
- **dns update**: Uses PATCH. Only sends the fields the user provided -- don't overwrite fields with `undefined`.
- **dns delete**: Requires `--confirm`. Uses DELETE method.
- **tokens verify**: Calls the verify endpoint. If `--token` is provided, temporarily override the auth header for this one call. Otherwise, verify the stored token.

### Step 5: Publish

Verify with `npm pack --dry-run`, then `npm publish --access public`.

## Files to Create or Modify
- `package.json` -- New file. Package metadata (no dependencies beyond peerDependencies).
- `index.js` -- New file. Plugin contract with 3 resources and 10 command loaders.
- `commands/_helpers.js` -- New file. HTTP client for Cloudflare API.
- `commands/zones/list.js` -- New file.
- `commands/zones/get.js` -- New file.
- `commands/zones/create.js` -- New file.
- `commands/dns/list.js` -- New file.
- `commands/dns/get.js` -- New file.
- `commands/dns/create.js` -- New file.
- `commands/dns/update.js` -- New file.
- `commands/dns/delete.js` -- New file.
- `commands/tokens/list.js` -- New file.
- `commands/tokens/verify.js` -- New file.
- `README.md` -- New file.
- `.gitignore` -- New file.

## Acceptance Criteria
- [ ] The plugin repo exists at `git@github.com:FredLackey/devutils-api-cloudflare.git`
- [ ] `index.js` exports the correct contract with `name: 'cloudflare'`, `auth: 'cloudflare'`
- [ ] All 10 command files exist and export `{ meta, run }`
- [ ] `dev api enable cloudflare` installs the plugin
- [ ] `dev api cloudflare zones list` lists zones
- [ ] `dev api cloudflare dns list <zone-id>` lists DNS records
- [ ] `dev api cloudflare dns create <zone-id> --type A --name test --content 1.2.3.4` creates a record
- [ ] `dev api cloudflare dns delete <zone-id> <record-id> --confirm` deletes a record
- [ ] `dev api cloudflare tokens verify` verifies the stored token
- [ ] `dev schema api.cloudflare` lists all 3 resources
- [ ] API errors from Cloudflare are mapped to structured errors
- [ ] The plugin has zero runtime dependencies (uses Node.js built-in `https`)
- [ ] The npm package publishes successfully

## Testing
```bash
# Install and verify
dev api enable cloudflare
dev api list
dev schema api.cloudflare

# Test zone operations (requires cloudflare auth)
dev auth login cloudflare
dev api cloudflare zones list --format json
dev api cloudflare zones get <zone-id> --format json

# Test DNS operations
dev api cloudflare dns list <zone-id> --format json
dev api cloudflare dns list <zone-id> --type A --format json
dev api cloudflare dns create <zone-id> --type A --name test.example.com --content 1.2.3.4 --format json

# Token verification
dev api cloudflare tokens verify --format json
dev api cloudflare tokens list --format json
```

## Notes
- Cloudflare's API wraps every response in a standard envelope: `{ success: bool, errors: [], messages: [], result: ... }`. Always check `success` first. If it's `false`, the `errors` array contains the error details.
- The `result_info` field on list responses contains pagination metadata: `{ page, per_page, total_count, total_pages }`. Return this in the output so users know if there are more results.
- This plugin has zero runtime dependencies. It uses Node.js built-in `https` for HTTP requests. This keeps the install size tiny and avoids supply chain risk. The trade-off is more boilerplate in the helper file, but it's a good trade-off for a simple REST API.
- DNS record types include: `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `SRV`, `NS`, `CAA`. The `--type` filter should accept any string (don't validate against a fixed list -- Cloudflare may add new types).
- The `--proxied` flag on DNS create/update enables Cloudflare's proxy (orange cloud). It only works on `A` and `AAAA` records. If used on other record types, Cloudflare will return an error. Don't try to validate this client-side -- let the API handle it and surface the error.
