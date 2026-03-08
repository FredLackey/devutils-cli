# API Plugin Architecture

How API wrappers are packaged, distributed, and discovered as standalone plugins
rather than being bundled into the core DevUtils CLI.

---

## The Problem

The `dev api` surface is designed to grow over time. Gmail, Drive, Sheets, Docs, AWS,
Cloudflare, Dokploy, Namecheap, Flowroute, Mailu — that's already ten services, and the
future candidates list keeps growing. Bundling all of them in the core CLI means:

- Every user installs every API wrapper, even if they only use one or two.
- Each service pulls in its own SDK or HTTP dependencies, bloating `node_modules`.
- Adding a new service requires publishing a new version of the entire CLI.
- Users can't add their own API wrappers without forking the project.

---

## The Solution

API wrappers ship as separate packages. The core CLI ships with zero API wrappers
built in. Each service is its own npm package that follows a standard plugin contract.
The CLI discovers installed plugins at runtime and registers their commands under
`dev api <service>`.

---

## How It Works

### Installing a plugin

```
dev api enable gmail
```

This does three things:

1. Resolves the package name. By convention, the package is
   `@fredlackey/devutils-api-gmail` on npm, but the user just types `gmail`.
2. Installs the package into a managed plugin directory at `~/.devutils/plugins/`.
   This is a standard `npm install` into that directory, not a global install.
3. Records the plugin in `~/.devutils/plugins.json` so the CLI knows what's
   installed without scanning the filesystem every time.

After this, `dev api gmail messages list` works.

### Removing a plugin

```
dev api disable gmail
```

Removes the package from `~/.devutils/plugins/` and deletes the entry from
`plugins.json`.

### Updating a plugin

```
dev api update gmail
```

Runs `npm update` for that specific plugin package in the plugins directory.

### Listing plugins

```
dev api list
```

Shows two sections:

- **Installed**: Plugins currently installed on this machine, with version numbers.
- **Available**: All known plugins in the registry that aren't installed yet.

The available list comes from a registry file bundled with the core CLI. It contains
the plugin name, npm package name, description, and required auth service. This file
is updated with each CLI release, but the plugins themselves are installed independently.

### Alternative install sources

The default source is npm, but plugins can also come from git repos:

```
dev api enable gmail                              # npm (default)
dev api enable gmail --source npm                 # explicit npm
dev api enable gmail --source git@github.com:FredLackey/devutils-api-gmail.git   # git repo
```

Git-sourced plugins are cloned into `~/.devutils/plugins/` and their dependencies
are installed via `npm install` in the cloned directory. This is useful for private
plugins or plugins under development.

---

## Plugin Contract

Every API plugin is a Node.js package that exports a specific shape. The core CLI
imports the package and uses this shape to register commands, validate input, and
format output.

### Required exports

```javascript
module.exports = {

  // Service identity
  name: 'gmail',
  description: 'Google Gmail (messages, labels, drafts, threads)',
  version: '1.0.0',

  // What auth service this plugin needs (maps to dev auth login <service>)
  auth: 'google',

  // Resource and command definitions
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

### Command file shape

Each command file uses the same `meta` + `run` pattern as core CLI commands:

```javascript
const meta = {
  description: 'List email messages',
  arguments: [],
  flags: [
    { name: 'limit', type: 'number', description: 'Max results to return' },
    { name: 'label', type: 'string', description: 'Filter by label name' },
    { name: 'query', type: 'string', description: 'Gmail search query' },
  ]
};

async function run(args, context) {
  // context.auth provides the authenticated client
  // context.output handles format detection and rendering
  // context.config provides user preferences
}

module.exports = { meta, run };
```

### What the core CLI provides to plugins

Plugins don't need to handle auth, output formatting, error handling, or config
access on their own. The core CLI passes a `context` object to every command's
`run` function that includes:

- `context.auth` — An authenticated client for the plugin's declared auth service.
  The core CLI handles token refresh automatically. If auth is missing, the command
  fails with a message pointing to `dev auth login <service>` before the plugin
  code ever runs.

- `context.output` — Output formatting utilities. Respects `--format`, detects
  AI/CI/TTY callers, handles JSON serialization. The plugin just passes data to
  `context.output.render(data)` and the right thing happens.

- `context.errors` — Structured error creation. `context.errors.throw(404, 'Not found')`
  produces the standard `{ error: { code, message, service } }` JSON on stderr.

- `context.config` — Read-only access to user config values relevant to the plugin.

- `context.shell` — Shell execution utilities (`exec`, `which`, `commandExists`).

- `context.platform` — Current OS, architecture, and package manager info.

This means plugins are thin. They handle the API-specific logic (building requests,
parsing responses, mapping to simplified output shapes) and the core CLI handles
everything else.

---

## Plugin Directory Structure

A plugin package looks like this:

```
devutils-api-gmail/
├── package.json
├── index.js                          # Exports the plugin contract
└── commands/
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

### On the user's machine

```
~/.devutils/
├── config.json
├── aliases.json
├── ai.json
├── plugins.json                      # Registry of installed plugins
├── plugins/
│   ├── node_modules/
│   │   ├── @fredlackey/devutils-api-gmail/
│   │   ├── @fredlackey/devutils-api-drive/
│   │   └── @fredlackey/devutils-api-cloudflare/
│   └── package.json                  # Managed by the CLI, not edited by hand
├── machines/
└── auth/
```

`plugins.json` tracks what's installed and where it came from:

```json
{
  "gmail": {
    "package": "@fredlackey/devutils-api-gmail",
    "version": "1.2.0",
    "source": "npm",
    "installedAt": "2026-03-01T12:00:00Z"
  },
  "cloudflare": {
    "package": "@fredlackey/devutils-api-cloudflare",
    "version": "0.5.0",
    "source": "git",
    "url": "git@github.com:FredLackey/devutils-api-cloudflare.git",
    "installedAt": "2026-03-05T08:30:00Z"
  }
}
```

---

## Plugin Discovery at Runtime

When the CLI starts and the user runs any `dev api` command, it needs to know
which plugins are installed. This happens in two steps:

1. **Read `plugins.json`** — This is fast. It's a small JSON file listing installed
   plugins by name. No filesystem scanning needed.

2. **Lazy-load the plugin** — When the user runs `dev api gmail messages list`,
   the CLI reads `plugins.json`, finds `gmail`, resolves the package path in
   `~/.devutils/plugins/node_modules/`, and requires it. The plugin's `resources`
   export tells the CLI how to route to the right command file.

If the user runs `dev api gmail` and gmail isn't installed, the CLI returns:

```
Error: API plugin "gmail" is not installed.
Run "dev api enable gmail" to install it.
```

If the user runs `dev api list`, no plugins are loaded. The CLI reads `plugins.json`
for installed plugins and the bundled registry file for available ones.

---

## Bundled Registry

The core CLI ships with a registry file that lists all known plugins. This is a
static JSON file checked into the core CLI repo:

```
src/api/registry.json
```

```json
[
  {
    "name": "gmail",
    "package": "@fredlackey/devutils-api-gmail",
    "description": "Google Gmail (messages, labels, drafts, threads)",
    "auth": "google"
  },
  {
    "name": "drive",
    "package": "@fredlackey/devutils-api-drive",
    "description": "Google Drive (files, folders, permissions)",
    "auth": "google"
  },
  {
    "name": "cloudflare",
    "package": "@fredlackey/devutils-api-cloudflare",
    "description": "Cloudflare (zones, DNS records, API tokens)",
    "auth": "cloudflare"
  }
]
```

This registry is used by `dev api list` to show available plugins and by
`dev api enable` to resolve short names to package names. It's updated with each
CLI release, but doesn't affect already-installed plugins.

Users can also install plugins that aren't in the registry by providing the full
package name or git URL directly:

```
dev api enable --source npm @someone/devutils-api-custom
dev api enable --source git git@github.com:someone/devutils-api-custom.git
```

These still need to follow the plugin contract to work.

---

## Plugin Sync with Config Backup

The `plugins.json` file is included in config backup and restore. When a user
runs `dev config import` on a new machine, their plugin list comes with it.
The restore flow can then prompt:

```
The following API plugins are configured but not installed:
  - gmail (Google Gmail)
  - cloudflare (Cloudflare)
  - dokploy (Dokploy)

Install all now? [Y/n]
```

This keeps the plugin list portable across machines without shipping the actual
plugin code in the config backup.

---

## Auth Integration

Each plugin declares which auth service it needs via the `auth` field in its
contract. The core CLI maps this to the `dev auth` service:

| Plugin auth value | Auth command |
|---|---|
| `google` | `dev auth login google` |
| `aws` | `dev auth login aws` |
| `cloudflare` | `dev auth login cloudflare` |
| `namecheap` | `dev auth login namecheap` |
| `flowroute` | `dev auth login flowroute` |
| `mailu` | `dev auth login mailu` |
| `dokploy` | `dev auth login dokploy` |

Multiple plugins can share the same auth service. Gmail, Drive, Sheets, and Docs
all use `google`. The auth service handles scopes — when a new plugin needs
additional scopes, the CLI detects this and prompts for re-authorization.

---

## What Changes in the Core CLI

### Commands that change

`dev api list` — Now shows installed vs. available plugins instead of a static
list of services.

`dev api enable <name>` — New command. Installs a plugin.

`dev api disable <name>` — New command. Removes a plugin.

`dev api update <name>` — New command. Updates a plugin.

### Commands that move out

Every `dev api <service> ...` command moves from the core CLI into its own
plugin package. The core CLI's `src/api/` directory shrinks to:

```
src/api/
├── registry.json                     # Known plugins list
├── list.js                           # dev api list
├── enable.js                         # dev api enable
├── disable.js                        # dev api disable
├── update.js                         # dev api update
└── loader.js                         # Plugin discovery and loading
```

No service-specific code lives in the core CLI.

### What stays in the core CLI

- The plugin loader and registry
- The `dev auth` service (shared across all plugins)
- The context object that plugins receive (output, errors, config, shell, platform)
- Global flags and output format detection

---

## Naming Convention

### npm packages

```
@fredlackey/devutils-api-<service>
```

Examples:
- `@fredlackey/devutils-api-gmail`
- `@fredlackey/devutils-api-cloudflare`
- `@fredlackey/devutils-api-dokploy`

### git repos

```
git@github.com:FredLackey/devutils-api-<service>.git
```

The short name used in `dev api enable <name>` always matches the service name
used in commands: `dev api <name> <resource> <method>`.

---

## Implementation Priority

The plugin system itself is part of the core CLI and should be built before
any individual API wrapper. The build order:

1. **Plugin loader** — Discovery, loading, and command registration from
   `plugins.json` and installed packages.
2. **`dev api list`** — Registry display.
3. **`dev api enable` / `dev api disable`** — Install and remove plugins.
4. **`dev api update`** — Update installed plugins.
5. **First plugin** — Pick one service (probably gmail, since there's already
   a sandbox repo) and build it as the reference plugin.
6. **Remaining plugins** — Each follows the same pattern.

---

## Third-Party Plugins

Because the plugin contract is a simple Node.js module export, anyone can create
a DevUtils API plugin. They publish it to npm, and users install it with:

```
dev api enable --source npm @theirorg/devutils-api-whatever
```

The CLI doesn't need to know about it in advance. As long as the package exports
the right shape, it works. The bundled registry is just a convenience for
first-party plugins — it's not a gatekeeper.
