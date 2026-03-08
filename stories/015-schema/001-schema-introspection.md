# Story 001: Implement Schema Introspection

## Goal
Implement `src/commands/schema.js` and flesh out `src/lib/schema.js` so that `dev schema <path>` lets anyone (human or AI agent) inspect a command's interface before calling it. You give it a dot-notation path like `config.set` or `api.gmail.messages.list`, and it returns the command's description, accepted arguments, flags, and output shape as structured JSON. The lib module builds a registry by walking all service `index.js` files and their command `meta` exports, including commands from installed API plugins. This is the backbone of programmatic discoverability -- without it, an AI agent has to guess what arguments a command accepts.

## Prerequisites
- All service implementations (001-foundation through 014-search)

## Background
The `dev schema` command is inspired by the Google Workspace CLI's `gws schema` command (see `research/proposed/cli-structure-reference.md` lines 209-253). The idea is simple: every command in the system already exports a `meta` object describing its interface. The schema system just collects those `meta` objects into a single registry and makes them queryable.

There are two pieces to build:

1. **`src/lib/schema.js`** -- A library module that builds the registry. It walks all service `index.js` files under `src/commands/`, loads each command's `meta` export, and organizes them into a nested map keyed by dot-notation paths. For API plugins, it also reads `~/.devutils/plugins.json`, loads each installed plugin's contract, and adds its resource/command entries to the registry under the `api.<service>` namespace.

2. **`src/commands/schema.js`** -- The command handler. It takes a dot-notation path from the user, looks it up in the registry, and returns the result. If the path points to a service (e.g., `config`), it lists all commands in that service. If it points to a specific command (e.g., `config.set`), it returns the full `meta` for that command. If it points to an API plugin resource (e.g., `api.gmail.messages`), it lists the commands in that resource.

The registry is built lazily on first access and cached for the duration of the process. You don't want to load every command module at startup -- that would slow down the entire CLI. The registry only gets built when someone runs `dev schema`.

## Technique

### Part 1: `src/lib/schema.js`

1. Open `src/lib/schema.js`. It currently has a TODO stub.

2. Define the list of known service names. These are the folder names under `src/commands/` that have an `index.js`:
   ```javascript
   const SERVICE_NAMES = [
     'config', 'machine', 'identity', 'tools',
     'ignore', 'util', 'alias', 'auth', 'api', 'ai', 'search'
   ];
   ```

3. Define the list of top-level commands (files directly in `src/commands/` that aren't service folders):
   ```javascript
   const TOP_LEVEL_COMMANDS = ['status', 'update', 'version', 'schema', 'help'];
   ```

4. Create a `buildRegistry()` function. This is the core of the module. It returns a nested object where each key is a dot-notation path segment:
   ```javascript
   function buildRegistry() {
     const registry = {};

     // Load services
     for (const name of SERVICE_NAMES) {
       const service = require(`../commands/${name}/index`);
       const entry = {
         type: 'service',
         name: service.name,
         description: service.description,
         commands: {}
       };

       for (const [cmdName, loader] of Object.entries(service.commands)) {
         const cmd = loader();
         entry.commands[cmdName] = {
           type: 'command',
           name: cmdName,
           description: cmd.meta.description,
           arguments: cmd.meta.arguments || [],
           flags: cmd.meta.flags || []
         };
       }

       registry[name] = entry;
     }

     // Load top-level commands
     for (const name of TOP_LEVEL_COMMANDS) {
       const cmd = require(`../commands/${name}`);
       registry[name] = {
         type: 'command',
         name,
         description: cmd.meta.description,
         arguments: cmd.meta.arguments || [],
         flags: cmd.meta.flags || []
       };
     }

     // Load API plugins
     loadPlugins(registry);

     return registry;
   }
   ```

5. Create a `loadPlugins(registry)` helper function. This reads `~/.devutils/plugins.json`, and for each installed plugin, loads its package and adds entries under `registry.api.commands`:
   ```javascript
   function loadPlugins(registry) {
     const path = require('path');
     const fs = require('fs');
     const pluginsFile = path.join(
       require('os').homedir(), '.devutils', 'plugins.json'
     );

     if (!fs.existsSync(pluginsFile)) {
       return;
     }

     let plugins;
     try {
       plugins = JSON.parse(fs.readFileSync(pluginsFile, 'utf8'));
     } catch {
       return; // Corrupt file, skip plugins
     }

     const pluginsDir = path.join(
       require('os').homedir(), '.devutils', 'plugins'
     );

     for (const [serviceName, info] of Object.entries(plugins)) {
       try {
         const pluginPath = path.join(
           pluginsDir, 'node_modules', info.package
         );
         const plugin = require(pluginPath);

         const serviceEntry = {
           type: 'plugin',
           name: plugin.name,
           description: plugin.description,
           version: plugin.version,
           auth: plugin.auth,
           resources: {}
         };

         for (const [resName, resource] of Object.entries(plugin.resources)) {
           const resEntry = {
             type: 'resource',
             name: resName,
             description: resource.description,
             commands: {}
           };

           for (const [cmdName, loader] of Object.entries(resource.commands)) {
             const cmd = loader();
             resEntry.commands[cmdName] = {
               type: 'command',
               name: cmdName,
               description: cmd.meta.description,
               arguments: cmd.meta.arguments || [],
               flags: cmd.meta.flags || []
             };
           }

           serviceEntry.resources[resName] = resEntry;
         }

         // Nest under api in the registry
         if (!registry.api.plugins) {
           registry.api.plugins = {};
         }
         registry.api.plugins[serviceName] = serviceEntry;
       } catch {
         // Plugin failed to load, skip it
       }
     }
   }
   ```

6. Add a caching layer so the registry is only built once per process:
   ```javascript
   let _registry = null;

   function getRegistry() {
     if (!_registry) {
       _registry = buildRegistry();
     }
     return _registry;
   }
   ```

7. Create a `resolve(dotPath)` function. This takes a dot-notation string and walks the registry to find the matching entry:
   ```javascript
   function resolve(dotPath) {
     const registry = getRegistry();
     const parts = dotPath.split('.');

     // Handle top-level (e.g., "config" or "version")
     if (parts.length === 1) {
       return registry[parts[0]] || null;
     }

     // Handle service.command (e.g., "config.set")
     if (parts.length === 2) {
       const service = registry[parts[0]];
       if (!service) return null;
       if (service.type === 'service' && service.commands[parts[1]]) {
         return service.commands[parts[1]];
       }
       return null;
     }

     // Handle api.plugin.resource (e.g., "api.gmail.messages")
     if (parts.length === 3 && parts[0] === 'api') {
       const plugins = registry.api.plugins || {};
       const plugin = plugins[parts[1]];
       if (!plugin) return null;
       if (plugin.resources[parts[2]]) {
         return plugin.resources[parts[2]];
       }
       return null;
     }

     // Handle api.plugin.resource.command (e.g., "api.gmail.messages.list")
     if (parts.length === 4 && parts[0] === 'api') {
       const plugins = registry.api.plugins || {};
       const plugin = plugins[parts[1]];
       if (!plugin) return null;
       const resource = plugin.resources[parts[2]];
       if (!resource) return null;
       return resource.commands[parts[3]] || null;
     }

     return null;
   }
   ```

8. Export the public API:
   ```javascript
   module.exports = { getRegistry, resolve };
   ```

### Part 2: `src/commands/schema.js`

1. Open `src/commands/schema.js`.

2. Fill in the `meta` object:
   ```javascript
   const meta = {
     description: 'Introspect a command by dot-notation path',
     arguments: [
       {
         name: 'path',
         description: 'Dot-notation path (e.g., config.set, api.gmail.messages.list)',
         required: false
       }
     ],
     flags: []
   };
   ```

3. In the `run` function:
   - If no path argument is given, return the full registry as a top-level listing (service names with descriptions, plus top-level command names).
   - If a path is given, call `schema.resolve(path)` and return the result.
   - If the path doesn't match anything, use `context.errors` to report it and list nearby valid paths as suggestions.

4. The suggestion logic: when a path is not found, split it by dots, and check if the parent path resolves. If it does, list the valid children. For example, if the user types `config.sett`, resolve `config` and show its command list so the user can see `set` is the right name.

5. Pass the result through `context.output` for format-aware rendering.

## Files to Create or Modify
- `src/lib/schema.js` -- Rewrite from stub. The registry builder and resolver.
- `src/commands/schema.js` -- Modify existing stub. The command handler.

## Acceptance Criteria
- [ ] `dev schema` (no arguments) lists all services and top-level commands with descriptions
- [ ] `dev schema config` lists all commands in the config service with descriptions
- [ ] `dev schema config.set` returns the full meta for `config set` (description, arguments, flags)
- [ ] `dev schema api.gmail.messages.list` returns the full meta for the gmail messages list command (when the gmail plugin is installed)
- [ ] `dev schema api.gmail` lists all resources in the gmail plugin (when installed)
- [ ] `dev schema nonexistent` returns an error with suggestions
- [ ] `dev schema --format json` outputs structured JSON
- [ ] The schema registry is built lazily (not at CLI startup)
- [ ] The schema registry includes installed API plugins
- [ ] Missing or corrupt `plugins.json` does not crash the command
- [ ] Both `src/lib/schema.js` and `src/commands/schema.js` export the expected interfaces

## Testing
```bash
# No arguments -- list everything
dev schema
# Expected: List of services (config, machine, identity, ...) and top-level commands (status, version, ...)

# Service-level introspection
dev schema config
# Expected: List of config commands (init, show, get, set, reset, export, import) with descriptions

# Command-level introspection
dev schema config.set
# Expected: { description: "Write a config value", arguments: [...], flags: [...] }

# JSON output
dev schema config.set --format json
# Expected: Structured JSON with description, arguments array, flags array

# API plugin introspection (requires gmail plugin installed)
dev schema api.gmail
# Expected: List of resources (messages, labels, drafts, threads) with descriptions

dev schema api.gmail.messages.list
# Expected: Full meta for the list command (description, arguments, flags)

# Unknown path
dev schema foo.bar
# Expected: Error with message like 'No command found at "foo.bar"'
```

## Notes
- The `resolve()` function handles up to 4 levels of nesting (api.service.resource.command). That's the deepest the CLI goes. If the project ever adds sub-resources, this function needs an update.
- Plugin loading in the registry can fail for lots of reasons: the package isn't installed, the package has a syntax error, the package doesn't follow the plugin contract. Wrap every plugin load in a try/catch and skip failures silently. The schema command should never crash because one plugin is broken.
- Don't confuse `src/lib/schema.js` (the library) with `src/commands/schema.js` (the command). The library builds and queries the registry. The command uses the library and handles user interaction (arguments, output, errors).
- The `meta` objects in each command file are the source of truth. If a command's `meta` is incomplete or missing fields, the schema will reflect that. This is intentional -- it creates pressure to keep `meta` objects accurate.
- AI agents will rely heavily on this command. The JSON output needs to be stable and predictable. Don't add decorative fields or change the shape between versions without good reason.
