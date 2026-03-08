# Story 002: Build the Gmail API Plugin

## Goal
Build the Gmail API plugin as the first real plugin. This is a separate git repo and npm package (`@fredlackey/devutils-api-gmail`) that wraps the Gmail API into 15 CLI commands across 4 resources: messages (list/get/send/search/trash/delete), labels (list/get), drafts (list/create/update/send), and threads (list/get/trash). This is the reference implementation that proves the plugin architecture works end to end. Every subsequent plugin follows the same pattern.

## Prerequisites
- 017-api-plugins/001 (plugin template)
- 011-auth/001 (auth service)

## Background
The plugin template from story 017-api-plugins/001 provides the starting structure. This story copies it, fills in the Gmail-specific details, and implements all 15 commands.

The Gmail API is a Google REST API. The plugin uses Google's `googleapis` npm package (specifically the `google.gmail('v1')` client) to make authenticated requests. Authentication is handled by the core CLI's auth system -- the plugin declares `auth: 'google'` and receives an authenticated client via `context.auth`.

Command signatures are defined in `research/proposed/proposed-command-syntax.md` lines 598-677. Each command maps to a specific Gmail API endpoint.

### Gmail API Endpoint Mapping

| Command | API Method | Endpoint |
|---------|-----------|----------|
| messages list | users.messages.list | GET /gmail/v1/users/me/messages |
| messages get | users.messages.get | GET /gmail/v1/users/me/messages/{id} |
| messages send | users.messages.send | POST /gmail/v1/users/me/messages/send |
| messages search | users.messages.list (with q param) | GET /gmail/v1/users/me/messages?q=... |
| messages trash | users.messages.trash | POST /gmail/v1/users/me/messages/{id}/trash |
| messages delete | users.messages.delete | DELETE /gmail/v1/users/me/messages/{id} |
| labels list | users.labels.list | GET /gmail/v1/users/me/labels |
| labels get | users.labels.get | GET /gmail/v1/users/me/labels/{id} |
| drafts list | users.drafts.list | GET /gmail/v1/users/me/drafts |
| drafts create | users.drafts.create | POST /gmail/v1/users/me/drafts |
| drafts update | users.drafts.update | PUT /gmail/v1/users/me/drafts/{id} |
| drafts send | users.drafts.send | POST /gmail/v1/users/me/drafts/send |
| threads list | users.threads.list | GET /gmail/v1/users/me/threads |
| threads get | users.threads.get | GET /gmail/v1/users/me/threads/{id} |
| threads trash | users.threads.trash | POST /gmail/v1/users/me/threads/{id}/trash |

## Technique

### Step 1: Create the repo

1. Create a new directory for the plugin (outside the main CLI repo):
   ```bash
   mkdir devutils-api-gmail
   cd devutils-api-gmail
   git init
   ```

2. Create the repo on GitHub:
   ```bash
   gh repo create FredLackey/devutils-api-gmail --private --source . --remote origin
   ```
   Make sure the remote uses SSH: `git@github.com:FredLackey/devutils-api-gmail.git`

### Step 2: Scaffold from the plugin template

1. Copy the template files:
   ```bash
   cp -r /path/to/devutils-cli/research/plugin-template/* .
   ```

2. Find-and-replace all placeholders:
   - `<service>` -> `gmail`
   - `<Service display name>` -> `Google Gmail`
   - `<auth-service>` -> `google`
   - `<resource1>, <resource2>, ...` -> `messages, labels, drafts, threads`

3. Delete the `commands/sample/` directory. You'll create the real resource directories next.

### Step 3: Set up `package.json`

Update the template `package.json`:
```json
{
  "name": "@fredlackey/devutils-api-gmail",
  "version": "1.0.0",
  "description": "Google Gmail plugin for DevUtils CLI",
  "main": "index.js",
  "files": ["index.js", "commands/"],
  "dependencies": {
    "googleapis": "^140.0.0"
  },
  "repository": {
    "type": "git",
    "url": "git+ssh://git@github.com/FredLackey/devutils-api-gmail.git"
  },
  "author": {
    "name": "Fred Lackey",
    "email": "fred.lackey@gmail.com",
    "url": "https://fredlackey.com"
  },
  "license": "Apache-2.0",
  "publishConfig": { "access": "public" },
  "keywords": ["devutils", "devutils-plugin", "gmail"],
  "peerDependencies": { "@fredlackey/devutils": ">=0.1.0" }
}
```

Run `npm install` to install the `googleapis` dependency.

### Step 4: Create `index.js`

```javascript
module.exports = {
  name: 'gmail',
  description: 'Google Gmail (messages, labels, drafts, threads)',
  version: '1.0.0',
  auth: 'google',
  resources: {
    messages: {
      description: 'Email messages',
      commands: {
        list:   () => require('./commands/messages/list'),
        get:    () => require('./commands/messages/get'),
        send:   () => require('./commands/messages/send'),
        search: () => require('./commands/messages/search'),
        trash:  () => require('./commands/messages/trash'),
        delete: () => require('./commands/messages/delete'),
      }
    },
    labels: {
      description: 'Gmail labels',
      commands: {
        list: () => require('./commands/labels/list'),
        get:  () => require('./commands/labels/get'),
      }
    },
    drafts: {
      description: 'Email drafts',
      commands: {
        list:   () => require('./commands/drafts/list'),
        create: () => require('./commands/drafts/create'),
        update: () => require('./commands/drafts/update'),
        send:   () => require('./commands/drafts/send'),
      }
    },
    threads: {
      description: 'Email threads',
      commands: {
        list:  () => require('./commands/threads/list'),
        get:   () => require('./commands/threads/get'),
        trash: () => require('./commands/threads/trash'),
      }
    }
  }
};
```

### Step 5: Create a shared helper

Create `commands/_helpers.js` for logic shared across commands:

```javascript
const { google } = require('googleapis');

/**
 * Build an authenticated Gmail client from the context.
 * @param {object} context - The context object from the core CLI
 * @returns {object} Gmail API client (google.gmail v1)
 */
function getClient(context) {
  const auth = context.auth;
  return google.gmail({ version: 'v1', auth });
}

module.exports = { getClient };
```

### Step 6: Implement each command

Create the directory structure:
```
commands/
├── _helpers.js
├── messages/
│   ├── list.js
│   ├── get.js
│   ├── send.js
│   ├── search.js
│   ├── trash.js
│   └── delete.js
├── labels/
│   ├── list.js
│   └── get.js
├── drafts/
│   ├── list.js
│   ├── create.js
│   ├── update.js
│   └── send.js
└── threads/
    ├── list.js
    ├── get.js
    └── trash.js
```

Each command follows the same pattern. Here is `commands/messages/list.js` as the reference:

```javascript
const { getClient } = require('../_helpers');

const meta = {
  description: 'List email messages',
  arguments: [],
  flags: [
    { name: 'limit', type: 'number', description: 'Maximum number of results to return' },
    { name: 'label', type: 'string', description: 'Filter by label name' },
    { name: 'query', type: 'string', description: 'Gmail search query' }
  ]
};

async function run(args, context) {
  const gmail = getClient(context);

  const params = { userId: 'me' };
  if (args.limit)  params.maxResults = args.limit;
  if (args.label)  params.labelIds = [args.label];
  if (args.query)  params.q = args.query;

  try {
    const res = await gmail.users.messages.list(params);
    const messages = res.data.messages || [];
    return context.output.render({
      messages,
      resultSizeEstimate: res.data.resultSizeEstimate
    });
  } catch (err) {
    return context.errors.throw(
      err.code || 500,
      err.message || 'Failed to list messages'
    );
  }
}

module.exports = { meta, run };
```

For each remaining command, follow the same structure. The key differences per command:
- **messages get**: Takes `<id>` argument. Calls `gmail.users.messages.get({ userId: 'me', id: args.id })`.
- **messages send**: Takes `--to`, `--subject`, `--body` flags (all required), plus optional `--cc` and `--bcc`. Builds an RFC 2822 email string, Base64url-encodes it, and calls `gmail.users.messages.send`.
- **messages search**: Takes `<query>` argument. Calls `gmail.users.messages.list({ userId: 'me', q: args.query })`.
- **messages trash**: Takes `<id>` argument. Calls `gmail.users.messages.trash({ userId: 'me', id: args.id })`.
- **messages delete**: Takes `<id>` argument and `--confirm` flag. Calls `gmail.users.messages.delete({ userId: 'me', id: args.id })`. This is permanent -- prompt if `--confirm` is not set.
- **labels list**: No arguments. Calls `gmail.users.labels.list({ userId: 'me' })`.
- **labels get**: Takes `<id>` argument. Calls `gmail.users.labels.get({ userId: 'me', id: args.id })`.
- **drafts list**: Takes optional `--limit`. Calls `gmail.users.drafts.list`.
- **drafts create**: Takes `--to`, `--subject`, `--body`. Builds a draft message and calls `gmail.users.drafts.create`.
- **drafts update**: Takes `<id>` argument plus optional `--to`, `--subject`, `--body`. Calls `gmail.users.drafts.update`.
- **drafts send**: Takes `<id>` argument. Calls `gmail.users.drafts.send`.
- **threads list**: Takes optional `--limit`, `--query`. Calls `gmail.users.threads.list`.
- **threads get**: Takes `<id>` argument. Calls `gmail.users.threads.get`.
- **threads trash**: Takes `<id>` argument. Calls `gmail.users.threads.trash`.

### Step 7: Publish

1. Run `npm pack` to inspect the tarball. Verify only `index.js` and `commands/` are included.
2. Run `npm publish --access public`.
3. Verify: `npm view @fredlackey/devutils-api-gmail`.

## Files to Create or Modify
- `package.json` -- New file (in the plugin repo). Package metadata with `googleapis` dependency.
- `index.js` -- New file. Plugin contract with all 4 resources and 15 command loaders.
- `commands/_helpers.js` -- New file. Shared Gmail client builder.
- `commands/messages/list.js` -- New file. List messages command.
- `commands/messages/get.js` -- New file. Get a message command.
- `commands/messages/send.js` -- New file. Send a message command.
- `commands/messages/search.js` -- New file. Search messages command.
- `commands/messages/trash.js` -- New file. Trash a message command.
- `commands/messages/delete.js` -- New file. Delete a message command.
- `commands/labels/list.js` -- New file. List labels command.
- `commands/labels/get.js` -- New file. Get a label command.
- `commands/drafts/list.js` -- New file. List drafts command.
- `commands/drafts/create.js` -- New file. Create a draft command.
- `commands/drafts/update.js` -- New file. Update a draft command.
- `commands/drafts/send.js` -- New file. Send a draft command.
- `commands/threads/list.js` -- New file. List threads command.
- `commands/threads/get.js` -- New file. Get a thread command.
- `commands/threads/trash.js` -- New file. Trash a thread command.
- `README.md` -- New file. Plugin documentation.
- `.gitignore` -- New file. Ignore `node_modules/`.

## Acceptance Criteria
- [ ] The plugin repo exists at `git@github.com:FredLackey/devutils-api-gmail.git`
- [ ] `index.js` exports the correct plugin contract shape with `name: 'gmail'`, `auth: 'google'`
- [ ] All 15 command files exist and export `{ meta, run }`
- [ ] Every `meta` object has accurate `description`, `arguments`, and `flags`
- [ ] `dev api enable gmail` installs the plugin successfully
- [ ] `dev api gmail messages list` returns a list of messages (with valid auth)
- [ ] `dev api gmail messages get <id>` returns a single message
- [ ] `dev api gmail messages send --to ... --subject ... --body ...` sends an email
- [ ] `dev api gmail labels list` returns all labels
- [ ] `dev api gmail drafts list` returns drafts
- [ ] `dev api gmail threads list` returns threads
- [ ] `dev schema api.gmail` lists all 4 resources
- [ ] `dev schema api.gmail.messages.list` returns the command's meta
- [ ] API errors are caught and returned as structured errors via `context.errors`
- [ ] The npm package publishes successfully with `npm publish --access public`

## Testing
```bash
# Install the plugin
dev api enable gmail

# Verify it appears in the plugin list
dev api list
# Expected: gmail listed as installed

# Verify schema introspection
dev schema api.gmail
# Expected: 4 resources listed (messages, labels, drafts, threads)

# Test messages (requires google auth)
dev auth login google
dev api gmail messages list --limit 5 --format json
dev api gmail labels list --format json

# Test with missing auth
dev auth logout google
dev api gmail messages list
# Expected: Error directing user to run "dev auth login google"

# Verify package contents before publish
npm pack --dry-run
# Expected: Only index.js, commands/, package.json, README.md
```

## Notes
- The `messages send` command needs to build an RFC 2822 email. The format is: `From`, `To`, `Subject` headers separated by newlines, then a blank line, then the body. The whole thing gets Base64url-encoded before sending. Use `Buffer.from(raw).toString('base64url')`.
- The `messages search` command is functionally identical to `messages list` with a `--query` flag. The difference is that `search` takes the query as a positional argument for convenience: `dev api gmail messages search "from:boss subject:urgent"` vs `dev api gmail messages list --query "from:boss"`.
- The `messages delete` command permanently deletes a message (not trash, actually gone). Always require `--confirm` unless the user explicitly passes it.
- Google's `googleapis` package handles token refresh automatically when given an OAuth2 client. The `context.auth` object from the core CLI should be a configured OAuth2 client. If it's not, the plugin will get auth errors and should surface them clearly.
- Some Gmail API responses return only message IDs without full content. To get full message details, you need a separate `get` call with `format: 'full'`. The `list` command should document this in its output (e.g., return IDs and thread IDs, but not full message bodies).
- All 15 commands share the same error handling pattern: catch the error from the API call, extract the HTTP status code and message, and pass them to `context.errors.throw()`.
