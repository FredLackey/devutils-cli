# Story 008: Build the Dokploy API Plugin

## Goal
Build the Dokploy plugin as a separate git repo and npm package (`@fredlackey/devutils-api-dokploy`). It wraps the Dokploy API into 14 commands across 4 resources: applications (list/get/create/start/stop/delete), projects (list/get/create), domains (list/add/remove), and servers (list/get). Auth service: `dokploy`. Like the Cloudflare plugin, this one uses direct REST API calls with no SDK dependency.

## Prerequisites
- 017-api-plugins/001 (plugin template)
- 011-auth/001 (auth service)

## Background
Dokploy is a self-hosted PaaS (Platform as a Service) for deploying applications. It exposes a REST API at `https://<host>/api/`. Authentication is done via an API token passed in the `Authorization: Bearer <token>` header.

Since Dokploy is self-hosted, the API base URL is not fixed -- it depends on where the user's Dokploy instance is running. The auth system stores both the token and the host URL. The plugin reads them from `context.auth` which should provide `{ token, host }`.

Command signatures are defined in `research/proposed/proposed-command-syntax.md` lines 974-1049.

### Dokploy API Endpoint Mapping

| Command | HTTP Method | Endpoint |
|---------|-----------|----------|
| applications list | GET | /api/application.all |
| applications get | GET | /api/application.one?appId={id} |
| applications create | POST | /api/application.create |
| applications start | POST | /api/application.start |
| applications stop | POST | /api/application.stop |
| applications delete | POST | /api/application.delete |
| projects list | GET | /api/project.all |
| projects get | GET | /api/project.one?projectId={id} |
| projects create | POST | /api/project.create |
| domains list | GET | /api/domain.byAppId?appId={id} |
| domains add | POST | /api/domain.create |
| domains remove | POST | /api/domain.delete |
| servers list | GET | /api/server.all |
| servers get | GET | /api/server.one?serverId={id} |

Note: Dokploy uses a tRPC-style API where endpoints look like function calls rather than REST resources. GET requests use query parameters, POST requests use JSON bodies.

## Technique

### Step 1: Create the repo and scaffold

1. Create the repo at `git@github.com:FredLackey/devutils-api-dokploy.git`.
2. Copy and customize the plugin template: `<service>` -> `dokploy`, auth -> `dokploy`.
3. No SDK dependencies.

### Step 2: Set up `index.js`

```javascript
module.exports = {
  name: 'dokploy',
  description: 'Dokploy (applications, projects, domains, servers)',
  version: '1.0.0',
  auth: 'dokploy',
  resources: {
    applications: {
      description: 'Deployed applications',
      commands: {
        list:   () => require('./commands/applications/list'),
        get:    () => require('./commands/applications/get'),
        create: () => require('./commands/applications/create'),
        start:  () => require('./commands/applications/start'),
        stop:   () => require('./commands/applications/stop'),
        delete: () => require('./commands/applications/delete'),
      }
    },
    projects: {
      description: 'Projects (groups of applications)',
      commands: {
        list:   () => require('./commands/projects/list'),
        get:    () => require('./commands/projects/get'),
        create: () => require('./commands/projects/create'),
      }
    },
    domains: {
      description: 'Custom domains',
      commands: {
        list:   () => require('./commands/domains/list'),
        add:    () => require('./commands/domains/add'),
        remove: () => require('./commands/domains/remove'),
      }
    },
    servers: {
      description: 'Connected servers',
      commands: {
        list: () => require('./commands/servers/list'),
        get:  () => require('./commands/servers/get'),
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
 * Make a request to the Dokploy API.
 * The base URL comes from context.auth.host (e.g., "https://dokploy.example.com").
 */
function request(method, path, context, body, queryParams) {
  return new Promise((resolve, reject) => {
    const host = context.auth.host;
    if (!host) {
      return reject(new Error('Dokploy host not configured. Run "dev auth login dokploy" first.'));
    }

    let url = `${host.replace(/\/$/, '')}${path}`;

    if (queryParams) {
      const qs = new URLSearchParams(queryParams).toString();
      if (qs) url += `?${qs}`;
    }

    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.auth.token}`
      }
    };

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, data: data });
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

Note: the helper supports both `http` and `https` because Dokploy instances might run on either, especially in local/development environments.

### Step 4: Implement each command

Create the directory structure:
```
commands/
├── _helpers.js
├── applications/
│   ├── list.js        # --project flag (optional, filters by project)
│   ├── get.js         # <app-id> argument
│   ├── create.js      # <name> argument, --project (required), --type flags
│   ├── start.js       # <app-id> argument
│   ├── stop.js        # <app-id> argument
│   └── delete.js      # <app-id> argument, --confirm flag
├── projects/
│   ├── list.js        # No arguments
│   ├── get.js         # <project-id> argument
│   └── create.js      # <name> argument
├── domains/
│   ├── list.js        # <app-id> argument
│   ├── add.js         # <app-id> argument, --host (required), --https flag
│   └── remove.js      # <app-id> and <domain-id> arguments, --confirm flag
└── servers/
    ├── list.js        # No arguments
    └── get.js         # <server-id> argument
```

Key implementation details:

- **applications list**: GET `/api/application.all`. If `--project` is provided, filter the results client-side or pass the project ID as a query parameter if the API supports it.
- **applications create**: POST `/api/application.create` with body `{ name, projectId, applicationType: args.type || 'application' }`.
- **applications start/stop**: POST with body `{ appId }`.
- **applications delete**: POST with body `{ appId }`. Requires `--confirm`.
- **domains add**: POST `/api/domain.create` with body `{ appId, host, https: args.https || false }`.
- **domains remove**: POST `/api/domain.delete` with body `{ domainId }`. Requires `--confirm`.

Error handling: Dokploy returns standard HTTP status codes. Check `statusCode` in the response. Non-2xx codes should be passed to `context.errors.throw()` with the status code and the response body's error message.

### Step 5: Publish

Verify with `npm pack --dry-run`, then `npm publish --access public`.

## Files to Create or Modify
- `package.json` -- New file. Package metadata.
- `index.js` -- New file. Plugin contract with 4 resources and 14 command loaders.
- `commands/_helpers.js` -- New file. HTTP client for Dokploy API.
- `commands/applications/list.js` -- New file.
- `commands/applications/get.js` -- New file.
- `commands/applications/create.js` -- New file.
- `commands/applications/start.js` -- New file.
- `commands/applications/stop.js` -- New file.
- `commands/applications/delete.js` -- New file.
- `commands/projects/list.js` -- New file.
- `commands/projects/get.js` -- New file.
- `commands/projects/create.js` -- New file.
- `commands/domains/list.js` -- New file.
- `commands/domains/add.js` -- New file.
- `commands/domains/remove.js` -- New file.
- `commands/servers/list.js` -- New file.
- `commands/servers/get.js` -- New file.
- `README.md` -- New file.
- `.gitignore` -- New file.

## Acceptance Criteria
- [ ] The plugin repo exists at `git@github.com:FredLackey/devutils-api-dokploy.git`
- [ ] `index.js` exports the correct contract with `name: 'dokploy'`, `auth: 'dokploy'`
- [ ] All 14 command files exist and export `{ meta, run }`
- [ ] `dev api enable dokploy` installs the plugin
- [ ] `dev api dokploy applications list` lists applications
- [ ] `dev api dokploy applications start <app-id>` starts an application
- [ ] `dev api dokploy projects list` lists projects
- [ ] `dev api dokploy domains list <app-id>` lists domains
- [ ] `dev api dokploy domains add <app-id> --host test.example.com` adds a domain
- [ ] `dev api dokploy servers list` lists servers
- [ ] `dev schema api.dokploy` lists all 4 resources
- [ ] API errors are caught and returned as structured errors
- [ ] The plugin has zero runtime dependencies
- [ ] The npm package publishes successfully

## Testing
```bash
# Install and verify
dev api enable dokploy
dev api list
dev schema api.dokploy

# Test operations (requires dokploy auth)
dev auth login dokploy
dev api dokploy applications list --format json
dev api dokploy projects list --format json
dev api dokploy servers list --format json

# Create a project and application
dev api dokploy projects create "Test Project" --format json
dev api dokploy applications create "Test App" --project <project-id> --format json

# Domain management
dev api dokploy domains list <app-id> --format json
dev api dokploy domains add <app-id> --host test.example.com --https --format json
```

## Notes
- Dokploy uses a tRPC-style API, not traditional REST. Endpoints look like function names (`application.all`, `project.create`) rather than resource paths (`/applications`, `/projects`). This is just a cosmetic difference -- the HTTP mechanics are the same.
- The API base URL is user-specific. Every Dokploy installation has its own URL. This means the helper's `request` function must read the host from `context.auth` every time, unlike the Google or Cloudflare plugins where the API URL is fixed.
- Dokploy instances might use HTTP in local/dev environments or HTTPS in production. The helper supports both by choosing `http` or `https` based on the URL protocol.
- The `applications delete` command is destructive and irreversible. Require `--confirm` and make the confirmation message clear about what will be deleted (the application and all its data).
- Self-signed TLS certificates are common with self-hosted Dokploy instances. If HTTPS requests fail with certificate errors, the user may need to set `NODE_TLS_REJECT_UNAUTHORIZED=0` in their environment. Don't set this in the plugin code -- it's a security risk. Instead, document it as a troubleshooting step in the README.
