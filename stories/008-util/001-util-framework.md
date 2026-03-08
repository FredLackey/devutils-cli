# Story 001: Utility Framework

## Goal
Build the core framework that lets users discover, inspect, and run utility functions through the `dev util` command. This means implementing three command files -- `run.js`, `list.js`, and `show.js` -- inside `src/commands/util/`, and defining the schema for `src/utils/registry.json` so that every utility (built-in or user-added) has a consistent metadata record. The framework needs to handle two kinds of utilities: simple single-file scripts (just an `index.js`) and folder-based utilities that include platform-specific shell scripts alongside their JavaScript entry point. Without this framework, none of the individual utilities (git-status, clone, git-push, etc.) have anywhere to live or any way to be invoked.

## Prerequisites
- 001-foundation/008 (CLI router -- context object, argument parsing, and command dispatch must be working)

## Background
In the old version (v0.0.18), utilities like `git-status` and `clone` were standalone scripts registered directly in `package.json` bin mappings. That created 84 symlinks in the user's PATH, which caused collisions and gave users no control over what was installed. The rebuild replaces that with a library approach: utilities live in `src/utils/` (built-in) or `~/.devutils/utils/` (user-added), and users run them through `dev util run <name>`.

Every utility folder has an `index.js` that exports two things: a `meta` object describing the utility, and a `run(args, context)` function that does the work. The `meta` object contains the name, description, supported platforms, and accepted arguments. The `run` function receives the same `args` and `context` objects that all commands get from the CLI router.

The `registry.json` file in `src/utils/` is a catalog of all built-in utilities and their metadata. The `list` and `show` commands read from this registry (and from `~/.devutils/utils/` for custom utilities) so they can display information without loading every utility's code.

Reference: `research/proposed/proposed-package-structure.md` lines 293-353 for the utility directory layout. `research/proposed/proposed-command-structure.md` lines 109-127 for how `util` and `alias` work together.

## Technique

### Step 1: Define the registry.json schema

Update `src/utils/registry.json` to have a clear structure. Each entry in the `utilities` array describes one utility:

```javascript
{
  "utilities": [
    {
      "name": "git-status",
      "description": "Scan directories for git repos and show color-coded status summary",
      "type": "built-in",
      "platforms": ["macos", "ubuntu", "raspbian", "amazon-linux", "windows", "gitbash"],
      "arguments": [
        { "name": "path", "required": false, "description": "Directory to scan (defaults to current directory)" }
      ],
      "flags": [
        { "name": "depth", "type": "number", "description": "How many levels deep to scan for repos" }
      ]
    }
  ]
}
```

For now, leave the `utilities` array empty. Individual utility stories will add entries as they are built. The schema is what matters here.

The `type` field is either `"built-in"` (ships with the package, lives in `src/utils/`) or `"custom"` (user-added, lives in `~/.devutils/utils/`). Built-in utilities use this file as their registry. Custom utilities use a separate `~/.devutils/utils/registry.json` with the same schema.

### Step 2: Implement `src/commands/util/run.js`

This is the command users call with `dev util run <name> [args...]`. It finds the named utility, loads its `index.js`, and calls `run()`.

Fill in the `meta` object:

```javascript
const meta = {
  description: 'Execute a utility by name. Extra arguments are passed through to the utility.',
  arguments: [
    { name: 'name', required: true, description: 'Name of the utility to run' }
  ],
  flags: []
};
```

The `run` function needs to do these things in order:

1. **Extract the utility name from args.** The first positional argument is the utility name. Everything after it is passed through to the utility.

```javascript
const name = args.positional[0];
if (!name) {
  context.output.error('Usage: dev util run <name> [args...]');
  return;
}
const utilArgs = args.positional.slice(1);
```

2. **Search for the utility in both locations.** Check built-in first (`src/utils/<name>/index.js` or `src/utils/<name>.js`), then custom (`~/.devutils/utils/<name>/index.js` or `~/.devutils/utils/<name>.js`). Use `path.join` and `fs.existsSync` to check each location.

```javascript
const path = require('path');
const fs = require('fs');
const os = require('os');

const builtInDir = path.join(__dirname, '..', '..', 'utils');
const customDir = path.join(os.homedir(), '.devutils', 'utils');

function findUtility(name) {
  // Check built-in: folder with index.js
  const builtInFolder = path.join(builtInDir, name, 'index.js');
  if (fs.existsSync(builtInFolder)) {
    return { path: builtInFolder, type: 'built-in' };
  }

  // Check built-in: single file
  const builtInFile = path.join(builtInDir, name + '.js');
  if (fs.existsSync(builtInFile)) {
    return { path: builtInFile, type: 'built-in' };
  }

  // Check custom: folder with index.js
  const customFolder = path.join(customDir, name, 'index.js');
  if (fs.existsSync(customFolder)) {
    return { path: customFolder, type: 'custom' };
  }

  // Check custom: single file
  const customFile = path.join(customDir, name + '.js');
  if (fs.existsSync(customFile)) {
    return { path: customFile, type: 'custom' };
  }

  return null;
}
```

3. **Load and run the utility.** Use `require()` to load the utility module, check that it exports a `run` function, and call it with the remaining args and the context object.

```javascript
const util = findUtility(name);
if (!util) {
  context.output.error(`Utility "${name}" not found.`);
  context.output.error('Run "dev util list" to see available utilities.');
  return;
}

const utilModule = require(util.path);

if (typeof utilModule.run !== 'function') {
  context.output.error(`Utility "${name}" does not export a run() function.`);
  return;
}

await utilModule.run(utilArgs, context);
```

4. **Make `findUtility` a shared helper.** Export it from this file or put it in a small helper file within the util command folder. The `show` command will also need to find utilities by name.

### Step 3: Implement `src/commands/util/list.js`

This command shows all available utilities. It reads from the built-in registry and scans the custom directory.

Fill in the `meta` object:

```javascript
const meta = {
  description: 'List available utilities. Use flags to filter by source.',
  arguments: [],
  flags: [
    { name: 'built-in', type: 'boolean', description: 'Show only built-in utilities' },
    { name: 'custom', type: 'boolean', description: 'Show only user-added utilities' }
  ]
};
```

The `run` function:

1. **Load the built-in registry.** Read `src/utils/registry.json` and parse it. Each entry has a `name`, `description`, and `platforms` array.

```javascript
const builtInRegistry = require('../../utils/registry.json');
```

2. **Scan the custom directory.** Check if `~/.devutils/utils/` exists. If it does, look for a `registry.json` in there too. If there is no registry file, scan subdirectories and try to load each one's `index.js` to get its `meta` export.

```javascript
function loadCustomUtilities() {
  const customDir = path.join(os.homedir(), '.devutils', 'utils');
  if (!fs.existsSync(customDir)) {
    return [];
  }

  const registryPath = path.join(customDir, 'registry.json');
  if (fs.existsSync(registryPath)) {
    const data = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    return data.utilities || [];
  }

  // Fallback: scan directories for index.js with meta exports
  const entries = fs.readdirSync(customDir, { withFileTypes: true });
  const utilities = [];

  for (const entry of entries) {
    if (entry.name === 'registry.json') continue;

    let indexPath;
    if (entry.isDirectory()) {
      indexPath = path.join(customDir, entry.name, 'index.js');
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      indexPath = path.join(customDir, entry.name);
    }

    if (indexPath && fs.existsSync(indexPath)) {
      try {
        const mod = require(indexPath);
        if (mod.meta) {
          utilities.push({ ...mod.meta, type: 'custom' });
        }
      } catch (err) {
        // Skip utilities that fail to load
      }
    }
  }

  return utilities;
}
```

3. **Apply filters.** If `--built-in` is set, show only built-in utilities. If `--custom` is set, show only custom ones. If neither is set, show both.

4. **Format and output.** Use `context.output` to display the list. For human-readable output, show a simple table with name, description, and type. For JSON output, return the full array.

```javascript
const results = [];

if (!args.flags.custom) {
  for (const util of builtInRegistry.utilities) {
    results.push({ name: util.name, description: util.description, type: 'built-in' });
  }
}

if (!args.flags['built-in']) {
  const custom = loadCustomUtilities();
  for (const util of custom) {
    results.push({ name: util.name, description: util.description, type: 'custom' });
  }
}

context.output.print(results);
```

### Step 4: Implement `src/commands/util/show.js`

This command displays the full metadata for a single utility.

Fill in the `meta` object:

```javascript
const meta = {
  description: 'Show details, description, supported platforms, and accepted arguments for a utility.',
  arguments: [
    { name: 'name', required: true, description: 'Name of the utility to inspect' }
  ],
  flags: []
};
```

The `run` function:

1. Find the utility using the same `findUtility` helper from `run.js`.
2. Load its module and read the `meta` export.
3. Also look up the utility in `registry.json` for any additional metadata (like platform support).
4. Display everything: name, description, type (built-in or custom), supported platforms, arguments, and flags.

```javascript
const util = findUtility(name);
if (!util) {
  context.output.error(`Utility "${name}" not found.`);
  return;
}

const utilModule = require(util.path);
const meta = utilModule.meta || {};

const info = {
  name: meta.name || name,
  description: meta.description || '(no description)',
  type: util.type,
  platforms: meta.platforms || [],
  arguments: meta.arguments || [],
  flags: meta.flags || []
};

context.output.print(info);
```

### Step 5: Code style

- CommonJS modules (`require` / `module.exports`)
- 2-space indentation, LF line endings
- JSDoc comments on every exported function and on the `findUtility` helper
- `'use strict';` at the top of every file
- No external dependencies

## Files to Create or Modify
- `src/commands/util/run.js` -- Replace the stub with the full lookup-and-execute logic
- `src/commands/util/list.js` -- Replace the stub with registry reading and output formatting
- `src/commands/util/show.js` -- Replace the stub with single-utility detail display
- `src/utils/registry.json` -- Update with the schema structure (keep the utilities array empty for now)

## Acceptance Criteria
- [ ] `dev util run <name>` finds a utility in `src/utils/` and executes its `run()` function
- [ ] `dev util run <name>` also finds utilities in `~/.devutils/utils/` (custom directory)
- [ ] `dev util run nonexistent` prints a clear error message suggesting `dev util list`
- [ ] `dev util run <name> arg1 arg2` passes extra arguments through to the utility
- [ ] `dev util list` shows both built-in and custom utilities with name and description
- [ ] `dev util list --built-in` shows only built-in utilities
- [ ] `dev util list --custom` shows only user-added utilities
- [ ] `dev util show <name>` displays the full metadata for a utility (description, platforms, arguments)
- [ ] `dev util show nonexistent` prints a clear error message
- [ ] `registry.json` has a well-defined schema with `utilities` array containing `name`, `description`, `type`, `platforms`, `arguments`, and `flags` fields
- [ ] Both single-file utilities (`name.js`) and folder-based utilities (`name/index.js`) are supported
- [ ] No external dependencies are added to package.json

## Testing

After building the framework, create a minimal test utility to verify everything works:

```bash
# Create a test utility
mkdir -p src/utils/hello-world
cat > src/utils/hello-world/index.js << 'SCRIPT'
const meta = {
  name: 'hello-world',
  description: 'A simple test utility that prints a greeting',
  platforms: ['macos', 'ubuntu', 'raspbian', 'amazon-linux', 'windows', 'gitbash'],
  arguments: [
    { name: 'name', required: false, description: 'Name to greet (defaults to World)' }
  ],
  flags: []
};

async function run(args, context) {
  const name = args[0] || 'World';
  console.log(`Hello, ${name}!`);
}

module.exports = { meta, run };
SCRIPT

# Add it to registry.json
# (manually add the entry to the utilities array)

# Test run
dev util run hello-world
# Expected: Hello, World!

dev util run hello-world Fred
# Expected: Hello, Fred!

# Test list
dev util list
# Expected: Shows hello-world with its description

# Test show
dev util show hello-world
# Expected: Full metadata including description, platforms, arguments

# Test error handling
dev util run nonexistent-utility
# Expected: Error message with suggestion to run dev util list

# Clean up the test utility after verifying
rm -rf src/utils/hello-world
```

Test custom utilities (user-added):

```bash
# Create a custom utility
mkdir -p ~/.devutils/utils/my-test
cat > ~/.devutils/utils/my-test/index.js << 'SCRIPT'
const meta = {
  name: 'my-test',
  description: 'A custom user-added test utility',
  platforms: ['macos'],
  arguments: [],
  flags: []
};

async function run(args, context) {
  console.log('Custom utility works!');
}

module.exports = { meta, run };
SCRIPT

# Test that it shows up
dev util list --custom
# Expected: Shows my-test

dev util run my-test
# Expected: Custom utility works!

# Clean up
rm -rf ~/.devutils/utils/my-test
```

## Notes
- The `findUtility` function checks built-in utilities before custom ones. This means a user cannot override a built-in utility by creating a custom one with the same name. That is intentional -- built-in utilities are maintained and tested, and shadowing them would cause confusion. If this becomes a requested feature, it can be changed later by reversing the lookup order.
- The `registry.json` file is read synchronously. This is fine because it is a small file and is only read once per command invocation. Do not try to optimize this with async file reads.
- When scanning `~/.devutils/utils/` for custom utilities without a registry file, the code uses `require()` to load each module. If a module has side effects on require (which it shouldn't, but might), this could cause unexpected behavior. The `try/catch` around the require handles this gracefully.
- The `run.js` command passes `utilArgs` as a plain array to the utility's `run()` function, not as the same parsed args object that commands get. This is because utilities may have their own argument parsing logic, especially if they delegate to shell scripts. The utility receives the raw positional arguments after its name.
- Do not remove the test utility (`hello-world`) from the codebase after testing. Later stories will replace it with real utilities, but it is useful to keep around during development.
