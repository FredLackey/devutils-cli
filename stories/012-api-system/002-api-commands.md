# Story 002: API Management Commands

## Goal
Build the four user-facing API plugin management commands: `dev api list`, `dev api enable`, `dev api disable`, and `dev api update`. These are how users discover, install, remove, and update API plugins. `list` shows what's installed and what's available from the registry. `enable` downloads and installs a plugin package into `~/.devutils/plugins/`. `disable` removes a plugin and cleans up. `update` pulls the latest version of an installed plugin. Together with the loader from the previous story, these commands complete the core plugin infrastructure. After this, the system is ready for actual plugins to be built and published.

## Prerequisites
- 012-api-system/001 (plugin loader — provides `getInstalledPlugins()`, `getRegistryPlugins()`, `readPluginsJson()`, `PLUGINS_FILE`, `PLUGINS_DIR`)

## Background
The plugin system stores everything under `~/.devutils/plugins/`. This directory acts as a self-contained npm project. It has its own `package.json` and `node_modules/`. Plugin packages are installed into this directory using standard `npm install`, which means npm handles dependency resolution, version locking, and deduplication automatically.

`plugins.json` (one level up, at `~/.devutils/plugins.json`) is the CLI's own tracking file. It records which plugins are installed, their version, where they came from (npm or git), and when they were installed. The loader reads this file to discover plugins at runtime.

The `registry.json` file bundled with the core CLI (`src/api/registry.json`) lists all known first-party plugins. This is used by `list` to show available plugins and by `enable` to resolve short names (like `gmail`) to full npm package names (like `@fredlackey/devutils-api-gmail`).

Users can also install plugins that aren't in the registry by providing the full package name or a git URL using the `--source` and `--url` flags (e.g., `--source git --url git@github.com:user/repo.git`).

Reference: `research/proposed/proposed-api-plugin-architecture.md` for the plugin directory layout, plugins.json format, and install/remove flow. `research/proposed/proposed-command-syntax.md` lines 569-596 for the exact command syntax.

## Technique

### Step 1: Implement list.js

Fill in the meta:

```javascript
const meta = {
  description: 'List installed and available API plugins',
  arguments: [],
  flags: [
    { name: 'installed', type: 'boolean', description: 'Show only installed plugins' },
    { name: 'available', type: 'boolean', description: 'Show only available (not installed) plugins' }
  ]
};
```

In the `run` function:

1. Import the loader: `const loader = require('../../api/loader');`
2. Get installed plugins: `const installed = loader.getInstalledPlugins();`
3. Get registry plugins: `const registry = loader.getRegistryPlugins();`
4. Build two lists:
   - **Installed**: Loop through the keys of `installed`. For each, include the name, package, version, source, and installedAt.
   - **Available**: Loop through `registry`. For each entry, check if it's already in `installed` (by name). If not, include it with its name, package, and description.
5. Apply filters: If `--installed` is set, only return the installed list. If `--available` is set, only return the available list. If neither flag is set, return both.
6. Pass to `context.output.render()`.

For human-readable output, format as two sections:

```
Installed:
  gmail        @fredlackey/devutils-api-gmail       1.2.0    npm
  cloudflare   @fredlackey/devutils-api-cloudflare   0.5.0    git

Available:
  drive        Google Drive (files, folders, permissions)
  sheets       Google Sheets (spreadsheets, values, sheets)
  docs         Google Docs (documents)
  aws          Amazon Web Services (compute, storage, functions, groups)
  ...
```

If nothing is installed and the user asked for `--installed`, print: "No API plugins installed. Run `dev api enable <name>` to install one."

### Step 2: Implement enable.js

Fill in the meta:

```javascript
const meta = {
  description: 'Install an API plugin from npm or a git repository',
  arguments: [
    { name: 'name', description: 'Plugin name or full package name', required: true }
  ],
  flags: [
    { name: 'source', type: 'string', description: 'Install source type: "npm" or "git" (default: npm)' },
    { name: 'url', type: 'string', description: 'Package name or git URL when using a non-registry plugin (e.g., @myorg/my-plugin or git@github.com:user/repo.git)' }
  ]
};
```

In the `run` function:

1. **Resolve the package name.** If the user typed a short name like `gmail`, look it up in the registry to get the full package name (`@fredlackey/devutils-api-gmail`). If it's not in the registry and no `--url` was given, check if the name looks like a scoped npm package (starts with `@`). If so, use it directly. Otherwise, return an error: "Plugin '<name>' not found in the registry. Use --source git --url <git-url> to install from a git repository, or --url <package-name> to install a non-registry npm package."

2. **Check if already installed.** Read `plugins.json`. If the plugin name is already there, print "Plugin '<name>' is already installed (version X.Y.Z). Use `dev api update <name>` to update." and exit.

3. **Ensure the plugins directory exists.** If `~/.devutils/plugins/` doesn't exist, create it and write a minimal `package.json`:

```javascript
const pluginsDir = loader.PLUGINS_DIR;
const pkgJsonPath = path.join(pluginsDir, 'package.json');

if (!fs.existsSync(pkgJsonPath)) {
  fs.mkdirSync(pluginsDir, { recursive: true });
  fs.writeFileSync(pkgJsonPath, JSON.stringify({
    name: 'devutils-plugins',
    version: '1.0.0',
    private: true,
    description: 'DevUtils CLI plugin packages'
  }, null, 2) + '\n');
}
```

4. **Install the package.** Determine the install target based on `--source` and `--url`:
   - Default (no flags, or `--source npm`): `npm install <package-name>` in the plugins directory (package name comes from registry lookup or `--url`)
   - `--source git --url <git-url>`: `npm install <git-url>` in the plugins directory

   Use `context.shell.exec()` to run the install command with the `cwd` set to `~/.devutils/plugins/`.

   ```javascript
   const installTarget = args.flags.url || packageName;
   const result = await context.shell.exec(`npm install ${installTarget}`, { cwd: pluginsDir });
   ```

   If the install fails, print the error output and exit. Don't update plugins.json.

5. **Read the installed version.** After a successful install, read the plugin's `package.json` from `node_modules/<package-name>/package.json` to get the actual installed version.

6. **Update plugins.json.** Add the new plugin entry:

```javascript
const plugins = loader.readPluginsJson();
const sourceType = args.flags.source || 'npm';
plugins[pluginName] = {
  package: packageName,
  version: installedVersion,
  source: sourceType,
  url: args.flags.url || undefined,
  installedAt: new Date().toISOString()
};
fs.writeFileSync(loader.PLUGINS_FILE, JSON.stringify(plugins, null, 2) + '\n');
```

7. **Validate the plugin.** After install, try loading it to make sure it follows the contract. Use `loader.loadPlugin(pluginName)`. If validation fails, warn the user but don't remove it (they might want to fix it).

8. **Print success.** Show the plugin name, version, and a hint about what auth service it requires (from the registry entry's `auth` field): "Run `dev auth login <service>` if you haven't already."

### Step 3: Implement disable.js

Fill in the meta:

```javascript
const meta = {
  description: 'Remove an installed API plugin',
  arguments: [
    { name: 'name', description: 'Plugin name to remove', required: true }
  ],
  flags: [
    { name: 'confirm', type: 'boolean', description: 'Skip confirmation prompt' }
  ]
};
```

In the `run` function:

1. Check if the plugin is installed by reading `plugins.json`. If not found, print "Plugin '<name>' is not installed." and exit.

2. Unless `--confirm` is passed, ask for confirmation using `context.prompt.confirm()`:

```javascript
const ok = args.flags.confirm || await context.prompt.confirm(
  `Remove plugin "${pluginName}" (${entry.package})?`,
  { default: false }
);
if (!ok) {
  context.output.print('Cancelled.');
  return;
}
```

3. Run `npm uninstall <package-name>` in the plugins directory:

```javascript
await context.shell.exec(`npm uninstall ${entry.package}`, { cwd: loader.PLUGINS_DIR });
```

4. Remove the entry from `plugins.json` and write the file.

5. Print a confirmation message.

### Step 4: Implement update.js

Fill in the meta:

```javascript
const meta = {
  description: 'Update an installed API plugin to the latest version',
  arguments: [
    { name: 'name', description: 'Plugin name to update', required: true }
  ],
  flags: []
};
```

In the `run` function:

1. Check if the plugin is installed. If not, print "Plugin '<name>' is not installed." and exit.

2. Read the current version from `plugins.json`.

3. Run `npm update <package-name>` in the plugins directory:

```javascript
await context.shell.exec(`npm update ${entry.package}`, { cwd: loader.PLUGINS_DIR });
```

4. Read the new version from the plugin's `package.json` in `node_modules/`.

5. Update the version in `plugins.json` and write the file.

6. If the version changed, print "Updated <name> from X.Y.Z to A.B.C". If the version is the same, print "<name> is already at the latest version (X.Y.Z)".

### Step 5: Code style

- CommonJS modules
- 2-space indentation, LF line endings
- JSDoc comments on every exported function
- `'use strict';` at the top
- Use `context.shell.exec()` for npm commands — never call `child_process` directly
- Use `context.prompt` for user confirmation
- All JSON file writes should use `JSON.stringify(data, null, 2) + '\n'` for consistent formatting

## Files to Create or Modify
- `src/commands/api/list.js` — Replace the stub with the list implementation
- `src/commands/api/enable.js` — Replace the stub with the enable implementation
- `src/commands/api/disable.js` — Replace the stub with the disable implementation
- `src/commands/api/update.js` — Replace the stub with the update implementation

## Acceptance Criteria
- [ ] `dev api list` shows both installed plugins and available plugins from the registry
- [ ] `dev api list --installed` shows only installed plugins
- [ ] `dev api list --available` shows only plugins from the registry that aren't installed
- [ ] `dev api list` outputs structured JSON when `--format json` is used
- [ ] `dev api enable gmail` installs `@fredlackey/devutils-api-gmail` into `~/.devutils/plugins/node_modules/`
- [ ] `dev api enable gmail` creates `~/.devutils/plugins/package.json` if it doesn't exist
- [ ] `dev api enable gmail` adds an entry to `~/.devutils/plugins.json`
- [ ] `dev api enable gmail` when already installed prints a message and does nothing
- [ ] `dev api enable custom --source git --url git@github.com:FredLackey/devutils-api-custom.git` installs from git
- [ ] `dev api enable nonexistent` prints an error with suggestions when the name isn't in the registry
- [ ] `dev api disable gmail` removes the package and the plugins.json entry
- [ ] `dev api disable gmail` asks for confirmation unless `--confirm` is passed
- [ ] `dev api disable nonexistent` prints "not installed" and exits
- [ ] `dev api update gmail` runs npm update and reports the version change
- [ ] `dev api update gmail` when already at latest says "already at the latest version"
- [ ] All four commands export `{ meta, run }`

## Testing

```bash
# List with no plugins installed
dev api list
# Expected: No installed plugins, full list of available plugins from registry

# Enable a plugin (this will actually hit npm, so only test if the package exists)
# For manual testing without a published package, create a mock:
mkdir -p ~/.devutils/plugins
echo '{ "name": "devutils-plugins", "version": "1.0.0", "private": true }' > ~/.devutils/plugins/package.json

# Simulate enable by checking the pre-install validation
dev api enable nonexistent
# Expected: "Plugin 'nonexistent' not found in the registry..."

# List after installing
# (After a real enable succeeds)
dev api list --installed
# Expected: Shows the installed plugin with name, version, source

dev api list --available
# Expected: Shows registry entries that aren't installed

# Disable
dev api disable gmail --confirm
# Expected: Removes the plugin, updates plugins.json

# Update
dev api update gmail
# Expected: Runs npm update, reports version
```

## Notes
- The `enable` command runs `npm install` in a subprocess. This means npm must be available on the user's PATH. Since DevUtils is itself a Node.js package installed via npm, this is a safe assumption. But if npm isn't found, print a clear error rather than a cryptic child process failure.
- When resolving short names, check the registry first. If someone types `dev api enable @myorg/some-package`, skip the registry lookup and use the name directly. You can detect this by checking if the name starts with `@` or contains `/`.
- The `--source` and `--url` flags on `enable` work together. `--source` specifies the install method (`npm` or `git`, defaults to `npm`). `--url` provides the package name or git URL. When `--source git` is used, `--url` should be a git URL (starting with `git@` or `https://` and ending with `.git`). When `--source npm` is used (or no `--source`), `--url` should be a full npm package name. Record the source type in `plugins.json` so `update` knows how to update it later.
- For git-sourced plugins, `npm update` may not work the same way as for npm-sourced ones. If the plugin was installed from a git URL, `update` should run `npm install <git-url>` again (which npm treats as a reinstall to the latest commit). Check the `source` field in `plugins.json` to determine the update strategy.
- The `disable` command runs `npm uninstall` which removes the package from `node_modules` and updates the plugins directory's `package.json`. The separate `plugins.json` deletion is DevUtils-specific bookkeeping.
- If `~/.devutils/plugins.json` doesn't exist when `enable` writes to it, create it fresh. Don't assume it already exists just because the previous stories created `~/.devutils/`.
- After `enable` installs a plugin, loading it via `loader.loadPlugin()` validates the contract. If validation fails, print a warning like "Plugin installed but does not follow the expected contract. It may not work correctly." Don't roll back the install — the plugin might just need an update.
