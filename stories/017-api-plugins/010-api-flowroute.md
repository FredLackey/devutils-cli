# Story 010: Build the Flowroute API Plugin

## Goal
Build the Flowroute plugin as a separate git repo and npm package (`@fredlackey/devutils-api-flowroute`). It wraps the Flowroute API into 6 commands across 3 resources: sms (send/list), mms (send/list), and numbers (list/get). Auth service: `flowroute`. This is one of the smaller plugins, making it a quick build.

## Prerequisites
- 017-api-plugins/001 (plugin template)
- 011-auth/001 (auth service)

## Background
Flowroute is a cloud communications platform for SMS, MMS, and voice. The plugin covers messaging and number management. Flowroute uses a standard REST API at `https://api.flowroute.com/v2.1/` (for messaging) and `https://api.flowroute.com/v2/` (for numbers). Authentication is HTTP Basic Auth using the tech prefix (access key) and secret key.

The core CLI's auth system stores `{ accessKey, secretKey }`. The plugin reads them from `context.auth` and builds the Basic Auth header.

Command signatures are defined in `research/proposed/proposed-command-syntax.md` lines 1096-1130.

### Flowroute API Endpoint Mapping

| Command | HTTP Method | Endpoint | API Version |
|---------|-----------|----------|-------------|
| sms send | POST | /v2.1/messages | v2.1 |
| sms list | GET | /v2.1/messages | v2.1 |
| mms send | POST | /v2.1/messages | v2.1 (with media_urls) |
| mms list | GET | /v2.1/messages | v2.1 (filter by is_mms) |
| numbers list | GET | /v2/numbers | v2 |
| numbers get | GET | /v2/numbers/{number} | v2 |

Note: SMS and MMS use the same endpoint. MMS messages include a `media_urls` array in the request body. The list endpoint can be filtered to show only MMS messages.

## Technique

### Step 1: Create the repo and scaffold

1. Create the repo at `git@github.com:FredLackey/devutils-api-flowroute.git`.
2. Copy and customize the plugin template: `<service>` -> `flowroute`, auth -> `flowroute`.
3. No SDK dependencies.

### Step 2: Set up `index.js`

```javascript
module.exports = {
  name: 'flowroute',
  description: 'Flowroute (SMS, MMS, phone numbers)',
  version: '1.0.0',
  auth: 'flowroute',
  resources: {
    sms: {
      description: 'SMS text messages',
      commands: {
        send: () => require('./commands/sms/send'),
        list: () => require('./commands/sms/list'),
      }
    },
    mms: {
      description: 'MMS media messages',
      commands: {
        send: () => require('./commands/mms/send'),
        list: () => require('./commands/mms/list'),
      }
    },
    numbers: {
      description: 'Phone numbers',
      commands: {
        list: () => require('./commands/numbers/list'),
        get:  () => require('./commands/numbers/get'),
      }
    }
  }
};
```

### Step 3: Create the shared helper

Create `commands/_helpers.js`:

```javascript
const https = require('https');

/**
 * Make a request to the Flowroute API.
 * Uses HTTP Basic Auth with accessKey:secretKey.
 */
function request(method, path, context, body, queryParams) {
  return new Promise((resolve, reject) => {
    const baseUrl = path.startsWith('/v2/')
      ? 'https://api.flowroute.com'
      : 'https://api.flowroute.com';

    let url = `${baseUrl}${path}`;

    if (queryParams) {
      const qs = new URLSearchParams(queryParams).toString();
      if (qs) url += `?${qs}`;
    }

    const parsed = new URL(url);
    const auth = Buffer.from(
      `${context.auth.accessKey}:${context.auth.secretKey}`
    ).toString('base64');

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Basic ${auth}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, data });
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
├── sms/
│   ├── send.js        # --to, --from, --body flags (all required)
│   └── list.js        # --limit, --start-date flags
├── mms/
│   ├── send.js        # --to, --from, --body flags (required), --media flag
│   └── list.js        # --limit, --start-date flags
└── numbers/
    ├── list.js        # --limit flag
    └── get.js         # <number> argument
```

Key implementation details:

- **sms send**: POST to `/v2.1/messages`. Body follows JSON:API format:
  ```json
  {
    "data": {
      "type": "message",
      "attributes": {
        "to": "12065551234",
        "from": "12065555678",
        "body": "Hello!"
      }
    }
  }
  ```
  Phone numbers should be in E.164 format (digits only, with country code). If the user provides formatting like `(206) 555-1234`, strip everything except digits.

- **mms send**: Same as sms send but with an additional `media_urls` array in the attributes:
  ```json
  {
    "data": {
      "type": "message",
      "attributes": {
        "to": "12065551234",
        "from": "12065555678",
        "body": "Check this out!",
        "media_urls": ["https://example.com/image.jpg"]
      }
    }
  }
  ```

- **sms/mms list**: GET `/v2.1/messages` with query params for pagination. The `--start-date` flag filters by date (ISO 8601 format). For MMS-only listing, filter responses where `is_mms` is true.

- **numbers list**: GET `/v2/numbers`. Returns the account's phone numbers with their capabilities and routes.

- **numbers get**: GET `/v2/numbers/{number}`. Returns details for a specific number.

### Step 5: Publish

Verify with `npm pack --dry-run`, then `npm publish --access public`.

## Files to Create or Modify
- `package.json` -- New file. Package metadata.
- `index.js` -- New file. Plugin contract with 3 resources and 6 command loaders.
- `commands/_helpers.js` -- New file. HTTP client with Basic Auth for Flowroute API.
- `commands/sms/send.js` -- New file.
- `commands/sms/list.js` -- New file.
- `commands/mms/send.js` -- New file.
- `commands/mms/list.js` -- New file.
- `commands/numbers/list.js` -- New file.
- `commands/numbers/get.js` -- New file.
- `README.md` -- New file.
- `.gitignore` -- New file.

## Acceptance Criteria
- [ ] The plugin repo exists at `git@github.com:FredLackey/devutils-api-flowroute.git`
- [ ] `index.js` exports the correct contract with `name: 'flowroute'`, `auth: 'flowroute'`
- [ ] All 6 command files exist and export `{ meta, run }`
- [ ] `dev api enable flowroute` installs the plugin
- [ ] `dev api flowroute sms send --to 12065551234 --from 12065555678 --body "Hello"` sends an SMS
- [ ] `dev api flowroute sms list` lists messages
- [ ] `dev api flowroute mms send --to ... --from ... --body ... --media https://...` sends an MMS
- [ ] `dev api flowroute numbers list` lists phone numbers
- [ ] `dev api flowroute numbers get 12065551234` returns number details
- [ ] `dev schema api.flowroute` lists all 3 resources
- [ ] API errors are caught and returned as structured errors
- [ ] The plugin has zero runtime dependencies
- [ ] The npm package publishes successfully

## Testing
```bash
# Install and verify
dev api enable flowroute
dev api list
dev schema api.flowroute

# Test operations (requires flowroute auth)
dev auth login flowroute
dev api flowroute numbers list --format json
dev api flowroute numbers get 12065551234 --format json

# Send a test SMS
dev api flowroute sms send --to 12065551234 --from 12065555678 --body "Test message" --format json

# List recent messages
dev api flowroute sms list --limit 10 --format json
```

## Notes
- Flowroute uses the JSON:API specification for its message endpoints. This means request and response bodies follow the `{ data: { type, attributes } }` structure. Don't flatten this in the helper -- let each command handle its own response transformation so the user sees clean output.
- Phone numbers must be in E.164 format (just digits with country code, e.g., `12065551234`). Add a small helper to strip non-digit characters from phone number inputs. This makes the commands friendlier since users often type numbers with dashes or parentheses.
- The `--media` flag on MMS send accepts a URL, not a local file path. The media must be hosted somewhere accessible by Flowroute's servers. If someone passes a local path, show an error explaining that a URL is required.
- Flowroute rate limits are relatively generous, but the `sms list` and `mms list` commands should respect the `limit` parameter to avoid pulling thousands of records.
- The `Content-Type` header for Flowroute is `application/vnd.api+json` (JSON:API content type), not plain `application/json`. Using the wrong content type will cause 415 errors.
