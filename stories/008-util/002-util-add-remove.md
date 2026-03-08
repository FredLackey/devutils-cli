# Story 002: Utility Add and Remove

## Goal
Implement the `dev util add` and `dev util remove` commands so that users can register their own custom utilities and unregister them later. `add` takes a name and a path to a script or directory, copies (or symlinks) it into `~/.devutils/utils/`, and records it in the custom utility registry. `remove` deletes the utility from the custom directory and removes its registry entry. Only user-added (custom) utilities can be removed -- built-in utilities that ship with the package are read-only and cannot be deleted through this command.

## Prerequisites
- 008-util/001 (utility framework -- `findUtility`, registry schema, and the `list`/`show`/`run` commands must be working)

## Background
DevUtils ships with a set of built-in utilities (git-status, clone, git-push, etc.), but users often have their own scripts they want to call through the same `dev util run <name>` interface. The `add` command makes this possible. Instead of asking users to manually copy files into `~/.devutils/utils/` and edit a JSON file, this command handles both steps.

The custom utility directory (`~/.devutils/utils/`) mirrors the structure of the built-in utility directory (`src/utils/`). Each utility is either a single `.js` file or a folder with an `index.js`. The custom registry (`~/.devutils/utils/registry.json`) tracks metadata for user-added utilities, using the same schema as the built-in `src/utils/registry.json`.

Reference: `research/proposed/proposed-command-syntax.md` lines 404-413 for the syntax. `research/proposed/proposed-package-structure.md` lines 348-353 for user-added utility storage.

## Technique

### Step 1: Implement `src/commands/util/add.js`

Fill in the `meta` object:

```javascript
const meta = {
  description: 'Register a custom utility by name and source path. Copies the script into ~/.devutils/utils/.',
  arguments: [
    { name: 'name', required: true, description: 'Name for the utility (used in dev util run <name>)' },
    { name: 'path', required: true, description: 'Path to the script file or directory to register' }
  ],
  flags: [
    { name: 'link', type: 'boolean', description: 'Create a symlink instead of copying (for active development)' }
  ]
};
```

The `run` function needs to do these things:

1. **Validate the name.** The name must be a simple identifier: lowercase letters, numbers, and hyphens only. No spaces, no dots, no slashes. Reject names that match built-in utilities.

```javascript
const name = args.positional[0];
const sourcePath = args.positional[1];

if (!name || !sourcePath) {
  context.output.error('Usage: dev util add <name> <path>');
  return;
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
  context.output.error('Utility names must be lowercase letters, numbers, and hyphens only.');
  context.output.error('Example: my-script, git-helper, deploy-2');
  return;
}
```

2. **Check for name conflicts.** Look in the built-in registry to make sure the name does not collide with a shipped utility. Also check if a custom utility with the same name already exists.

```javascript
const builtInRegistry = require('../../utils/registry.json');
const isBuiltIn = builtInRegistry.utilities.some(u => u.name === name);
if (isBuiltIn) {
  context.output.error(`"${name}" is a built-in utility and cannot be overridden.`);
  return;
}

const customDir = path.join(os.homedir(), '.devutils', 'utils');
const existingFolder = path.join(customDir, name);
const existingFile = path.join(customDir, name + '.js');
if (fs.existsSync(existingFolder) || fs.existsSync(existingFile)) {
  context.output.error(`A custom utility named "${name}" already exists.`);
  context.output.error('Remove it first with: dev util remove ' + name);
  return;
}
```

3. **Validate the source path.** Make sure the file or directory actually exists and contains a valid utility (has an `index.js` with a `run` export, or is a `.js` file with a `run` export).

```javascript
const resolvedSource = path.resolve(sourcePath);
if (!fs.existsSync(resolvedSource)) {
  context.output.error(`Source path not found: ${resolvedSource}`);
  return;
}

// Determine if it is a file or directory
const stat = fs.statSync(resolvedSource);
let entryPoint;

if (stat.isDirectory()) {
  entryPoint = path.join(resolvedSource, 'index.js');
  if (!fs.existsSync(entryPoint)) {
    context.output.error('Directory does not contain an index.js file.');
    return;
  }
} else if (stat.isFile() && resolvedSource.endsWith('.js')) {
  entryPoint = resolvedSource;
} else {
  context.output.error('Source must be a .js file or a directory containing index.js.');
  return;
}

// Verify it exports a run function
try {
  const mod = require(entryPoint);
  if (typeof mod.run !== 'function') {
    context.output.error('The source file must export a run() function.');
    return;
  }
} catch (err) {
  context.output.error(`Failed to load source file: ${err.message}`);
  return;
}
```

4. **Copy or link the utility into `~/.devutils/utils/`.** Create the custom directory if it does not exist. If the source is a directory, copy the whole directory. If it is a single file, copy it. If `--link` is set, create a symlink instead.

```javascript
fs.mkdirSync(customDir, { recursive: true });

if (args.flags.link) {
  // Create a symlink
  const linkTarget = stat.isDirectory()
    ? path.join(customDir, name)
    : path.join(customDir, name + '.js');
  fs.symlinkSync(resolvedSource, linkTarget);
} else {
  // Copy the files
  if (stat.isDirectory()) {
    copyDirectorySync(resolvedSource, path.join(customDir, name));
  } else {
    fs.copyFileSync(resolvedSource, path.join(customDir, name + '.js'));
  }
}
```

You will need a simple `copyDirectorySync` helper that recursively copies a directory. Use `fs.mkdirSync`, `fs.readdirSync`, and `fs.copyFileSync` in a recursive function. Keep it simple -- no need for a third-party library.

5. **Update the custom registry.** Read `~/.devutils/utils/registry.json` (create it if it does not exist), add the new utility's metadata, and write it back.

```javascript
const registryPath = path.join(customDir, 'registry.json');
let registry = { utilities: [] };

if (fs.existsSync(registryPath)) {
  registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
}

// Read meta from the utility if available
const mod = require(entryPoint);
const utilMeta = mod.meta || {};

registry.utilities.push({
  name: name,
  description: utilMeta.description || '',
  type: 'custom',
  platforms: utilMeta.platforms || [],
  arguments: utilMeta.arguments || [],
  flags: utilMeta.flags || [],
  source: resolvedSource,
  linked: !!args.flags.link
});

fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
```

6. **Print a confirmation message.**

```javascript
context.output.print(`Utility "${name}" registered successfully.`);
context.output.print(`Run it with: dev util run ${name}`);
```

### Step 2: Implement `src/commands/util/remove.js`

Fill in the `meta` object:

```javascript
const meta = {
  description: 'Unregister a custom utility. Built-in utilities cannot be removed.',
  arguments: [
    { name: 'name', required: true, description: 'Name of the custom utility to remove' }
  ],
  flags: [
    { name: 'confirm', type: 'boolean', description: 'Skip the confirmation prompt' }
  ]
};
```

The `run` function:

1. **Validate the name and check it is not built-in.** Built-in utilities cannot be removed.

```javascript
const name = args.positional[0];
if (!name) {
  context.output.error('Usage: dev util remove <name>');
  return;
}

const builtInRegistry = require('../../utils/registry.json');
const isBuiltIn = builtInRegistry.utilities.some(u => u.name === name);
if (isBuiltIn) {
  context.output.error(`"${name}" is a built-in utility and cannot be removed.`);
  return;
}
```

2. **Check that the custom utility exists.** Look in `~/.devutils/utils/` for a folder or file matching the name.

```javascript
const customDir = path.join(os.homedir(), '.devutils', 'utils');
const folderPath = path.join(customDir, name);
const filePath = path.join(customDir, name + '.js');

const exists = fs.existsSync(folderPath) || fs.existsSync(filePath);
if (!exists) {
  context.output.error(`Custom utility "${name}" not found.`);
  return;
}
```

3. **Ask for confirmation.** Unless `--confirm` is passed, use `context.prompt.confirm()` to ask the user. In non-interactive environments, default to false (do not delete without explicit confirmation).

```javascript
if (!args.flags.confirm) {
  const ok = await context.prompt.confirm(
    `Remove custom utility "${name}"? This will delete the files.`,
    { default: false }
  );
  if (!ok) {
    context.output.print('Cancelled.');
    return;
  }
}
```

4. **Delete the files.** Remove the folder or file. Use `fs.rmSync` with `{ recursive: true, force: true }` for directories.

```javascript
if (fs.existsSync(folderPath)) {
  fs.rmSync(folderPath, { recursive: true, force: true });
} else if (fs.existsSync(filePath)) {
  fs.unlinkSync(filePath);
}
```

5. **Update the custom registry.** Remove the entry from `~/.devutils/utils/registry.json`.

```javascript
const registryPath = path.join(customDir, 'registry.json');
if (fs.existsSync(registryPath)) {
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  registry.utilities = registry.utilities.filter(u => u.name !== name);
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
}
```

6. **Print a confirmation.**

```javascript
context.output.print(`Utility "${name}" removed.`);
```

## Files to Create or Modify
- `src/commands/util/add.js` -- Replace the stub with the full add logic (validate, copy/link, register)
- `src/commands/util/remove.js` -- Replace the stub with the full remove logic (validate, delete, unregister)

## Acceptance Criteria
- [ ] `dev util add my-tool ./path/to/script.js` copies the script into `~/.devutils/utils/my-tool.js`
- [ ] `dev util add my-tool ./path/to/folder/` copies the folder into `~/.devutils/utils/my-tool/`
- [ ] `dev util add my-tool ./path --link` creates a symlink instead of copying
- [ ] After adding, `dev util run my-tool` works
- [ ] After adding, `dev util list --custom` shows the new utility
- [ ] `dev util add` validates the source path exists and has a `run()` export
- [ ] `dev util add` rejects names that conflict with built-in utilities
- [ ] `dev util add` rejects duplicate names (custom utility already exists)
- [ ] `dev util add` rejects invalid names (uppercase, spaces, dots)
- [ ] `dev util remove my-tool` deletes the files and removes the registry entry
- [ ] `dev util remove` prompts for confirmation in interactive mode
- [ ] `dev util remove --confirm` skips the confirmation prompt
- [ ] `dev util remove` refuses to remove built-in utilities
- [ ] `dev util remove nonexistent` prints a clear error
- [ ] The custom registry file (`~/.devutils/utils/registry.json`) is created if missing and updated correctly

## Testing

```bash
# Create a test script to add
mkdir /tmp/my-test-util
cat > /tmp/my-test-util/index.js << 'SCRIPT'
const meta = {
  name: 'my-test-util',
  description: 'Test utility for add/remove',
  platforms: ['macos'],
  arguments: [],
  flags: []
};

async function run(args, context) {
  console.log('My test utility ran!');
}

module.exports = { meta, run };
SCRIPT

# Add it
dev util add my-test-util /tmp/my-test-util
# Expected: Utility "my-test-util" registered successfully.

# Verify it works
dev util run my-test-util
# Expected: My test utility ran!

# Verify it shows in the list
dev util list --custom
# Expected: Shows my-test-util

# Try adding it again (should fail)
dev util add my-test-util /tmp/my-test-util
# Expected: Error -- already exists

# Remove it
dev util remove my-test-util --confirm
# Expected: Utility "my-test-util" removed.

# Verify it's gone
dev util list --custom
# Expected: my-test-util is no longer listed

dev util run my-test-util
# Expected: Error -- not found

# Try removing a built-in utility (once one exists)
dev util remove git-status
# Expected: Error -- built-in utilities cannot be removed

# Clean up
rm -rf /tmp/my-test-util
```

## Notes
- The `--link` flag is useful during development. If a user is actively working on a utility script and wants changes to take effect immediately (without re-running `dev util add`), they can link instead of copy. The registry records whether the utility was linked so that `remove` knows to delete a symlink rather than a copied directory.
- The `copyDirectorySync` helper should handle nested directories, but utility folders are typically flat (index.js plus a couple of script files). Do not over-engineer it.
- When removing a symlink, `fs.rmSync` on the symlink itself is correct -- it removes the link, not the target. But it is worth being explicit about this in the code with a comment, so a future developer does not get confused.
- The `require()` call in the validation step (checking for a `run` export) will execute the module's top-level code. This should be fine for well-written utilities that only define functions at the top level. If a utility has side effects on load, the validation will trigger them -- but that is the utility's bug, not ours.
- Name validation uses the pattern `^[a-z0-9][a-z0-9-]*$`. This means names must start with a letter or number and can only contain lowercase letters, numbers, and hyphens. This keeps things compatible with filesystem paths and URL slugs.
