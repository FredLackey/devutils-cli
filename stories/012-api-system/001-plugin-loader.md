# Story 001: Plugin Loader

## Goal
Build the plugin discovery and loading engine at `src/api/loader.js`. This is the heart of the API plugin system. When someone runs `dev api gmail messages list`, the loader is what finds the gmail plugin on disk, validates it, and hands back the right command file so the CLI router can call it. The loader also builds the `context` object that every plugin command receives, giving plugins access to auth, output formatting, error handling, config, shell utilities, and platform info. If a plugin isn't installed, the loader returns a clear error with the install command. This module has no user-facing commands of its own; it's internal plumbing used by the `src/commands/api/index.js` router and the commands built in the next story.

## Prerequisites
- 001-foundation/008 (CLI router)
- 011-auth/001 (auth login/logout, so auth credentials exist for plugins to use)

## Background
The API plugin architecture is documented in `research/proposed/proposed-api-plugin-architecture.md`. The key ideas:

- Plugins are npm packages installed into `~/.devutils/plugins/node_modules/`.
- `~/.devutils/plugins.json` tracks which plugins are installed (name, package, version, source, installedAt).
- Each plugin exports a contract: `name`, `description`, `version`, `auth`, and `resources`.
- Each resource has a `commands` map where each value is a lazy-loader function: `() => require('./commands/messages/list')`.
- Command files inside plugins follow the same `{ meta, run }` pattern as core CLI commands.
- The core CLI passes a `context` object to every plugin command's `run(args, context)` call.

The loader needs to do two distinct jobs:

**Job 1: Resolve a command.** Given arguments like `['gmail', 'messages', 'list']`, figure out which plugin, which resource, and which command the user wants, then return the command module.

**Job 2: Build the plugin context.** Assemble the `context` object that gives the plugin access to core CLI services without the plugin needing to know anything about how those services work internally.

Reference: `research/proposed/proposed-api-plugin-architecture.md` for the full plugin contract, context object, and discovery flow.

## Technique

### Step 1: Understand the resolution path

When the CLI router sees `dev api gmail messages list`, it passes `['gmail', 'messages', 'list']` to the api service's index.js. That index.js calls the loader. The loader then:

1. Reads `plugins.json` to check if `gmail` is installed.
2. Resolves the package path: `~/.devutils/plugins/node_modules/@fredlackey/devutils-api-gmail`.
3. Requires the package's main export (the plugin contract).
4. Walks the contract: `resources.messages.commands.list`.
5. Calls the lazy-loader function to get the command module.
6. Returns the command module (which has `{ meta, run }`).

If any step fails, the loader returns a structured error instead of a command module.

### Step 2: Implement readPluginsJson()

This function reads and parses `~/.devutils/plugins.json`. If the file doesn't exist, return an empty object (not an error). This is the normal state for a fresh install with no plugins.

```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');

const DEVUTILS_DIR = path.join(os.homedir(), '.devutils');
const PLUGINS_FILE = path.join(DEVUTILS_DIR, 'plugins.json');
const PLUGINS_DIR = path.join(DEVUTILS_DIR, 'plugins');

function readPluginsJson() {
  try {
    const raw = fs.readFileSync(PLUGINS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}
```

### Step 3: Implement loadPlugin(pluginName)

This function takes a plugin name (like `'gmail'`), looks it up in `plugins.json`, requires the package, and validates the contract.

```javascript
function loadPlugin(pluginName) {
  const plugins = readPluginsJson();
  const entry = plugins[pluginName];

  if (!entry) {
    return {
      error: true,
      code: 'NOT_INSTALLED',
      message: `API plugin "${pluginName}" is not installed.\nRun "dev api enable ${pluginName}" to install it.`
    };
  }

  const packagePath = path.join(PLUGINS_DIR, 'node_modules', entry.package);

  let pluginModule;
  try {
    pluginModule = require(packagePath);
  } catch (err) {
    return {
      error: true,
      code: 'LOAD_FAILED',
      message: `Failed to load plugin "${pluginName}" from ${packagePath}.\nThe package may be corrupted. Try "dev api disable ${pluginName}" then "dev api enable ${pluginName}".`
    };
  }

  // Validate the plugin contract
  const validation = validateContract(pluginModule, pluginName);
  if (validation) {
    return validation; // returns an error object
  }

  return { error: false, plugin: pluginModule };
}
```

### Step 4: Implement validateContract(pluginModule, pluginName)

Check that the plugin exports the required fields. Return `null` if valid, or an error object if something is missing.

```javascript
function validateContract(pluginModule, pluginName) {
  const required = ['name', 'description', 'version', 'auth', 'resources'];
  const missing = required.filter(field => !pluginModule[field]);

  if (missing.length > 0) {
    return {
      error: true,
      code: 'INVALID_CONTRACT',
      message: `Plugin "${pluginName}" is missing required fields: ${missing.join(', ')}.\nThe plugin may be outdated or incorrectly built.`
    };
  }

  if (typeof pluginModule.resources !== 'object') {
    return {
      error: true,
      code: 'INVALID_CONTRACT',
      message: `Plugin "${pluginName}" has an invalid resources export. Expected an object.`
    };
  }

  return null;
}
```

### Step 5: Implement resolveCommand(pluginName, resourceName, commandName)

This is the main function the CLI router calls. It combines loading the plugin with walking the resource/command tree.

```javascript
function resolveCommand(pluginName, resourceName, commandName) {
  const result = loadPlugin(pluginName);
  if (result.error) return result;

  const plugin = result.plugin;
  const resource = plugin.resources[resourceName];

  if (!resource) {
    const available = Object.keys(plugin.resources).join(', ');
    return {
      error: true,
      code: 'UNKNOWN_RESOURCE',
      message: `Plugin "${pluginName}" has no resource "${resourceName}".\nAvailable resources: ${available}`
    };
  }

  const commandLoader = resource.commands[commandName];
  if (!commandLoader) {
    const available = Object.keys(resource.commands).join(', ');
    return {
      error: true,
      code: 'UNKNOWN_COMMAND',
      message: `Resource "${resourceName}" in plugin "${pluginName}" has no command "${commandName}".\nAvailable commands: ${available}`
    };
  }

  let commandModule;
  try {
    commandModule = typeof commandLoader === 'function' ? commandLoader() : commandLoader;
  } catch (err) {
    return {
      error: true,
      code: 'COMMAND_LOAD_FAILED',
      message: `Failed to load command "${commandName}" from plugin "${pluginName}": ${err.message}`
    };
  }

  return {
    error: false,
    command: commandModule,
    plugin: plugin
  };
}
```

### Step 5b: Sub-resource routing note

Some plugins (like AWS) have resources that feel like two levels deep. For example, S3 has both "buckets" and "objects" operations, which could be modeled as a single `storage` resource with dot-notation command keys like `buckets.list`, or as separate flat resources like `storage-buckets` and `storage-objects`.

**Recommended approach: flat resource names.** Instead of nesting sub-resources under a parent, use hyphenated resource names at the top level. For example, the AWS plugin should declare `buckets` and `objects` (or `storage-buckets` and `storage-objects`) as separate resources, each with their own simple command names (`list`, `upload`, `download`). This keeps the CLI path to 4 segments (`dev api aws buckets list`) and avoids any special routing logic in the loader.

This approach works cleanly with the existing `resolveCommand(pluginName, resourceName, commandName)` signature and requires no changes to the loader. The alternative -- supporting 5-segment paths like `dev api aws storage buckets list` -- would require `resolveCommand` to handle variable-length argument lists, either by:

1. **Combining segments:** If `resourceName` doesn't match a resource, try concatenating it with the next argument (e.g., `storage` + `buckets` -> look for `resources['storage-buckets']`).
2. **Dot-notation commands:** Treat the extra segment as a command prefix (e.g., look for `resources.storage.commands['buckets.list']`).

Both alternatives add complexity to the loader and the CLI router. The flat resource naming approach avoids this entirely, so it is the recommended pattern. Plugin authors should use flat resource names whenever possible.

### Step 6: Implement buildPluginContext(plugin, coreContext)

This function takes the plugin's contract and the core CLI context, then builds the enriched context object that plugin commands receive. The core context already has `output`, `errors`, `config`, `shell`, and `platform`. The plugin context adds `auth`.

**Important: credential unwrapping.** The raw credential files stored by the auth system (e.g., `~/.devutils/auth/aws.json`) are envelope objects that contain metadata alongside the actual credentials. For example, an API key file looks like `{ service: 'aws', type: 'api-key', credentials: { accessKeyId: '...', secretAccessKey: '...', region: '...' } }`, and an OAuth file looks like `{ service: 'google', type: 'oauth', credentials: { access_token: '...', refresh_token: '...', expiry_date: ... } }`. Plugins should not have to dig through this envelope. The loader unwraps it so that `context.auth` contains the flat credential data directly.

For API key services (like AWS), `context.auth` will be the `credentials` object itself, e.g. `{ accessKeyId, secretAccessKey, region }`. For OAuth services (like Google), `context.auth` will be the `credentials` object, e.g. `{ access_token, refresh_token, expiry_date }`. This means plugin code can reference `context.auth.accessKeyId` or `context.auth.access_token` directly, without navigating through `context.auth.credentials`.

```javascript
function buildPluginContext(plugin, coreContext) {
  const authService = plugin.auth;

  // Read the auth credential for this plugin's declared service
  const authFilePath = path.join(DEVUTILS_DIR, 'auth', `${authService}.json`);
  let authCredential = null;
  try {
    const raw = fs.readFileSync(authFilePath, 'utf8');
    const credentialFile = JSON.parse(raw);

    // Unwrap the credential envelope. The auth system stores files as:
    //   { service, type, credentials: { ... } }
    // Plugins expect flat access (e.g., context.auth.accessKeyId), so we
    // pass credentialFile.credentials directly instead of the full envelope.
    authCredential = credentialFile.credentials || credentialFile;
  } catch (err) {
    // Auth not available - plugin commands will get null
  }

  return {
    auth: authCredential,
    output: coreContext.output,
    errors: coreContext.errors,
    config: coreContext.config,
    shell: coreContext.shell,
    platform: coreContext.platform
  };
}
```

> **Note for plugin authors:** `context.auth` contains the unwrapped credential data, not the raw credential file. For API key services, this is the `credentials` object (e.g., `{ accessKeyId, secretAccessKey, region }` for AWS). For OAuth services, this is the token data (e.g., `{ access_token, refresh_token, expiry_date }` for Google). If the user hasn't authenticated, `context.auth` will be `null`. Always check for `null` before accessing properties.

### Step 7: Implement getInstalledPlugins() and getRegistryPlugins()

These are convenience functions for the list, enable, and disable commands in the next story.

```javascript
function getInstalledPlugins() {
  return readPluginsJson();
}

function getRegistryPlugins() {
  try {
    return require('./registry.json');
  } catch (err) {
    return [];
  }
}
```

### Step 8: Export everything

```javascript
module.exports = {
  resolveCommand,
  loadPlugin,
  buildPluginContext,
  getInstalledPlugins,
  getRegistryPlugins,
  readPluginsJson,
  PLUGINS_FILE,
  PLUGINS_DIR
};
```

### Step 9: Code style

- CommonJS modules
- 2-space indentation, LF line endings
- JSDoc comments on every exported function
- `'use strict';` at the top
- No external dependencies — only Node.js built-ins (`fs`, `path`, `os`)
- Every function that can fail returns a structured result object with an `error` boolean, never throws

## Files to Create or Modify
- `src/api/loader.js` — Replace the stub with the full implementation

## Acceptance Criteria
- [ ] `resolveCommand('gmail', 'messages', 'list')` returns the command module when the gmail plugin is installed and valid
- [ ] `resolveCommand('gmail', 'messages', 'list')` returns `{ error: true, code: 'NOT_INSTALLED' }` when gmail isn't in plugins.json
- [ ] `resolveCommand('gmail', 'nonexistent', 'list')` returns `{ error: true, code: 'UNKNOWN_RESOURCE' }` with the list of available resources
- [ ] `resolveCommand('gmail', 'messages', 'nonexistent')` returns `{ error: true, code: 'UNKNOWN_COMMAND' }` with the list of available commands
- [ ] `validateContract()` catches plugins missing required fields (name, description, version, auth, resources)
- [ ] `buildPluginContext()` reads the auth credential matching the plugin's `auth` field
- [ ] `buildPluginContext()` returns `auth: null` when the user hasn't logged into the required service (doesn't crash)
- [ ] `getInstalledPlugins()` returns the contents of plugins.json or an empty object if the file doesn't exist
- [ ] `getRegistryPlugins()` returns the contents of `src/api/registry.json`
- [ ] No functions throw exceptions — all failures are returned as structured error objects
- [ ] The module exports all listed functions and constants

## Testing

```bash
# Test with no plugins installed (fresh state)
node -e "
  const loader = require('./src/api/loader');
  console.log(loader.getInstalledPlugins());
"
# Expected: {} (empty object)

node -e "
  const loader = require('./src/api/loader');
  console.log(loader.getRegistryPlugins().length);
"
# Expected: 10 (the number of entries in registry.json)

# Test resolving a missing plugin
node -e "
  const loader = require('./src/api/loader');
  const result = loader.resolveCommand('gmail', 'messages', 'list');
  console.log(result.error, result.code);
"
# Expected: true NOT_INSTALLED

# Test reading plugins.json path
node -e "
  const loader = require('./src/api/loader');
  console.log(loader.PLUGINS_FILE);
"
# Expected: /Users/<you>/.devutils/plugins.json

# After installing a plugin (done in the next story), test the full flow:
# node -e "const loader = require('./src/api/loader'); console.log(loader.resolveCommand('gmail', 'messages', 'list'));"
# Expected: { error: false, command: { meta: {...}, run: [Function] }, plugin: { name: 'gmail', ... } }
```

## Notes
- The loader uses `require()` to load plugin packages. This means plugins are loaded once and cached by Node's module system. If a plugin is updated on disk (via `dev api update`), the CLI process would need to be restarted to pick up changes. This is fine because CLI commands are short-lived processes.
- The `resolveCommand` function is intentionally strict about the three-part path (plugin, resource, command). If someone types `dev api gmail` without a resource and command, the CLI router should show the plugin's available resources. That logic lives in `commands/api/index.js`, not in the loader. The loader just resolves specific commands.
- Error objects always include a human-readable `message` that the CLI can print directly. The `code` field is for programmatic use (AI agents, CI scripts, etc.).
- The `buildPluginContext` function reads the auth file synchronously. This is fine for a CLI tool where commands run one at a time. Don't over-engineer with async reads here.
- If `plugins.json` is missing, the loader returns an empty object, not an error. An empty plugin list is a valid state. However, if `plugins.json` exists but contains invalid JSON, log a warning to stderr so the user knows something is wrong. Don't crash.
- The `auth` value in the plugin context might be `null` if the user hasn't authenticated with the required service. Individual plugin commands should check for this and return a helpful message like "Not authenticated with google. Run `dev auth login google` first." The loader doesn't enforce auth — it just passes what's available.
