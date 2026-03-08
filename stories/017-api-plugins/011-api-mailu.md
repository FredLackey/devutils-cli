# Story 011: Build the Mailu API Plugin

## Goal
Build the Mailu plugin as a separate git repo and npm package (`@fredlackey/devutils-api-mailu`). It wraps the Mailu admin API into 9 commands across 3 resources: users (list/get/create/delete), aliases (list/create/delete), and domains (list/add). Auth service: `mailu`. Like Dokploy, this is a self-hosted service, so the API base URL varies per installation.

## Prerequisites
- 017-api-plugins/001 (plugin template)
- 011-auth/001 (auth service)

## Background
Mailu is a self-hosted email server suite. It provides an admin API for managing users, aliases, and domains. The API is at `https://<host>/api/v1/`. Authentication is done via an API key passed in the `Authorization` header.

Since Mailu is self-hosted, the API base URL depends on the user's installation. The auth system stores `{ apiKey, host }`. The plugin reads them from `context.auth`.

Command signatures are defined in `research/proposed/proposed-command-syntax.md` lines 1132-1180.

### Mailu API Endpoint Mapping

| Command | HTTP Method | Endpoint |
|---------|-----------|----------|
| users list | GET | /api/v1/user |
| users get | GET | /api/v1/user/{email} |
| users create | POST | /api/v1/user |
| users delete | DELETE | /api/v1/user/{email} |
| aliases list | GET | /api/v1/alias |
| aliases create | POST | /api/v1/alias |
| aliases delete | DELETE | /api/v1/alias/{alias} |
| domains list | GET | /api/v1/domain |
| domains add | POST | /api/v1/domain |

## Technique

### Step 1: Create the repo and scaffold

1. Create the repo at `git@github.com:FredLackey/devutils-api-mailu.git`.
2. Copy and customize the plugin template: `<service>` -> `mailu`, auth -> `mailu`.
3. No SDK dependencies.

### Step 2: Set up `index.js`

```javascript
module.exports = {
  name: 'mailu',
  description: 'Mailu (email users, aliases, domains)',
  version: '1.0.0',
  auth: 'mailu',
  resources: {
    users: {
      description: 'Email user accounts',
      commands: {
        list:   () => require('./commands/users/list'),
        get:    () => require('./commands/users/get'),
        create: () => require('./commands/users/create'),
        delete: () => require('./commands/users/delete'),
      }
    },
    aliases: {
      description: 'Email aliases',
      commands: {
        list:   () => require('./commands/aliases/list'),
        create: () => require('./commands/aliases/create'),
        delete: () => require('./commands/aliases/delete'),
      }
    },
    domains: {
      description: 'Email domains',
      commands: {
        list: () => require('./commands/domains/list'),
        add:  () => require('./commands/domains/add'),
      }
    }
  }
};
```

### Step 3: Create the shared helper

Create `commands/_helpers.js`:

```javascript
const https = require('https');
const http = require('http');

/**
 * Make a request to the Mailu admin API.
 * Base URL comes from context.auth.host (e.g., "https://mail.example.com").
 */
function request(method, path, context, body) {
  return new Promise((resolve, reject) => {
    const host = context.auth.host;
    if (!host) {
      return reject(new Error('Mailu host not configured. Run "dev auth login mailu" first.'));
    }

    const url = `${host.replace(/\/$/, '')}/api/v1${path}`;
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': context.auth.apiKey
      }
    };

    const req = transport.request(options, (res) => {
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

Note: Mailu's API key is passed directly in the Authorization header (not as a Bearer token). The exact format depends on the Mailu version -- some use just the key, others use `Bearer <key>`. Check the Mailu docs for your version.

### Step 4: Implement each command

Create the directory structure:
```
commands/
├── _helpers.js
├── users/
│   ├── list.js        # --domain flag (optional, filters by domain)
│   ├── get.js         # <email> argument
│   ├── create.js      # <email> argument, --password (required), --display-name flag
│   └── delete.js      # <email> argument, --confirm flag
├── aliases/
│   ├── list.js        # --domain flag (optional)
│   ├── create.js      # <alias> argument, --destination flag (required)
│   └── delete.js      # <alias> argument, --confirm flag
└── domains/
    ├── list.js        # No arguments
    └── add.js         # <domain> argument
```

Key implementation details:

- **users list**: GET `/api/v1/user`. If `--domain` is provided, filter the results client-side (filter where the email address ends with `@<domain>`).

- **users get**: GET `/api/v1/user/{email}`. The email address is the identifier.

- **users create**: POST `/api/v1/user` with body:
  ```json
  {
    "email": "user@example.com",
    "raw_password": "secretpassword",
    "displayed_name": "John Doe"
  }
  ```
  The `--password` flag is required. Warn in the command's description that the password will be visible in shell history. For production use, consider reading from stdin or a file.

- **users delete**: DELETE `/api/v1/user/{email}`. Requires `--confirm`. This permanently removes the user and all their data.

- **aliases list**: GET `/api/v1/alias`. Optional `--domain` filter.

- **aliases create**: POST `/api/v1/alias` with body:
  ```json
  {
    "localpart": "info",
    "domain": "example.com",
    "destination": ["user@example.com"]
  }
  ```
  The `<alias>` argument is the full alias address (e.g., `info@example.com`). Parse it to extract the `localpart` and `domain`. The `--destination` flag is the target email address. Mailu supports multiple destinations -- if needed, accept comma-separated values and split them.

- **aliases delete**: DELETE `/api/v1/alias/{alias}`. Requires `--confirm`.

- **domains list**: GET `/api/v1/domain`. Returns all configured email domains.

- **domains add**: POST `/api/v1/domain` with body `{ "name": "example.com" }`.

### Step 5: Publish

Verify with `npm pack --dry-run`, then `npm publish --access public`.

## Files to Create or Modify
- `package.json` -- New file. Package metadata.
- `index.js` -- New file. Plugin contract with 3 resources and 9 command loaders.
- `commands/_helpers.js` -- New file. HTTP client for Mailu API.
- `commands/users/list.js` -- New file.
- `commands/users/get.js` -- New file.
- `commands/users/create.js` -- New file.
- `commands/users/delete.js` -- New file.
- `commands/aliases/list.js` -- New file.
- `commands/aliases/create.js` -- New file.
- `commands/aliases/delete.js` -- New file.
- `commands/domains/list.js` -- New file.
- `commands/domains/add.js` -- New file.
- `README.md` -- New file.
- `.gitignore` -- New file.

## Acceptance Criteria
- [ ] The plugin repo exists at `git@github.com:FredLackey/devutils-api-mailu.git`
- [ ] `index.js` exports the correct contract with `name: 'mailu'`, `auth: 'mailu'`
- [ ] All 9 command files exist and export `{ meta, run }`
- [ ] `dev api enable mailu` installs the plugin
- [ ] `dev api mailu users list` lists email users
- [ ] `dev api mailu users create user@example.com --password secret` creates a user
- [ ] `dev api mailu aliases list` lists aliases
- [ ] `dev api mailu aliases create info@example.com --destination user@example.com` creates an alias
- [ ] `dev api mailu domains list` lists domains
- [ ] `dev api mailu domains add example.com` adds a domain
- [ ] `dev schema api.mailu` lists all 3 resources
- [ ] API errors are caught and returned as structured errors
- [ ] The plugin has zero runtime dependencies
- [ ] The npm package publishes successfully

## Testing
```bash
# Install and verify
dev api enable mailu
dev api list
dev schema api.mailu

# Test operations (requires mailu auth)
dev auth login mailu
dev api mailu domains list --format json
dev api mailu users list --format json
dev api mailu aliases list --format json

# Create a user
dev api mailu users create newuser@example.com --password "temppass123" --display-name "New User" --format json

# Create an alias
dev api mailu aliases create info@example.com --destination admin@example.com --format json

# Clean up
dev api mailu users delete newuser@example.com --confirm --format json
dev api mailu aliases delete info@example.com --confirm --format json
```

## Notes
- The `users create` command takes a `--password` flag. This means the password is visible in the shell history. Document this limitation and suggest alternatives for production use: read from an environment variable, pipe from a password manager, or use `--json` with a file reference.
- Mailu's API key format varies across versions. In Mailu 1.9+, it's typically set via the `API_TOKEN` environment variable in the Mailu configuration. The plugin should accept whatever string the user provides and pass it in the Authorization header.
- Like Dokploy, Mailu is self-hosted, so the base URL is user-specific. The helper supports both HTTP and HTTPS.
- The `aliases create` command needs to parse the alias email address into `localpart` and `domain` components. Use `alias.split('@')` -- the part before `@` is the localpart, the part after is the domain. Validate that both parts are present.
- Mailu's API may return 404 for endpoints that aren't enabled (e.g., if the admin API is disabled in the Mailu config). If this happens, surface a helpful error message suggesting the user check their Mailu configuration.
- The `domains add` command only registers the domain in Mailu. DNS records (MX, SPF, DKIM, DMARC) must be configured separately at the domain registrar. The command output should mention this.
