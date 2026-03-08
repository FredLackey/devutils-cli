# Story 002: Alias List and Sync

## Goal
Implement the `dev alias list` and `dev alias sync` commands. `list` reads `aliases.json` and displays all registered aliases alongside what they map to. `sync` regenerates every wrapper script in `~/.devutils/bin/` from `aliases.json`, cleaning up orphaned scripts that are no longer in the alias registry. This command is critical for the config import workflow: after pulling config from a backup on a new machine, `sync` rebuilds all the wrapper scripts so the aliases actually work.

## Prerequisites
- 009-alias/001 (alias add/remove -- `aliases.json` format and wrapper script generation must be working)

## Background
The `list` command is straightforward: read a JSON file, format it, display it. But `sync` is where the real value is. When a user sets up a new machine, they run `dev config import` to pull their configuration from a backup. That import brings over `aliases.json`, but the wrapper scripts in `~/.devutils/bin/` do not come with it (they are generated files, not config data). The `sync` command takes the imported `aliases.json` and generates all the matching wrapper scripts.

Sync also handles cleanup. If a user manually deletes an entry from `aliases.json` or if an import brings in a smaller set of aliases than the machine previously had, `sync` removes the orphaned wrapper scripts that no longer have a matching entry in `aliases.json`. This keeps the bin directory clean and prevents ghost commands.

Reference: `research/proposed/proposed-command-structure.md` lines 143-146 for `sync` description. `research/proposed/config-backup-sync.md` lines 206-215 for the restore flow (step 7: `dev alias sync` runs to rebuild symlinks).

## Technique

### Step 1: Implement `src/commands/alias/list.js`

Fill in the `meta` object:

```javascript
const meta = {
  description: 'List all registered aliases and the commands they map to.',
  arguments: [],
  flags: []
};
```

The `run` function:

1. **Load aliases.json.** Use the shared helpers from `helpers.js` (created in the previous story) or read the file directly.

```javascript
const path = require('path');
const fs = require('fs');
const os = require('os');

const aliasesPath = path.join(os.homedir(), '.devutils', 'aliases.json');

let aliases = {};
if (fs.existsSync(aliasesPath)) {
  aliases = JSON.parse(fs.readFileSync(aliasesPath, 'utf8'));
}
```

2. **Handle the empty case.** If there are no aliases, tell the user how to create one.

```javascript
const entries = Object.entries(aliases);

if (entries.length === 0) {
  context.output.print('No aliases registered.');
  context.output.print('');
  context.output.print('Create one with: dev alias add <name> "<command>"');
  context.output.print('Example: dev alias add gs "dev util run git-status"');
  return;
}
```

3. **Display the aliases.** Sort them alphabetically by name. For human-readable output, format as a padded table. For JSON output (when `--format json` is used or in non-interactive mode), return the raw object.

```javascript
// Sort by name
entries.sort((a, b) => a[0].localeCompare(b[0]));

// Check if the wrapper script exists for each alias
const binDir = path.join(os.homedir(), '.devutils', 'bin');

console.log(`Aliases (${entries.length}):\n`);

for (const [name, command] of entries) {
  const scriptExists = fs.existsSync(path.join(binDir, name))
    || fs.existsSync(path.join(binDir, name + '.cmd'));
  const status = scriptExists ? '' : ' (no script -- run dev alias sync)';
  const nameCol = name.padEnd(25);
  console.log(`  ${nameCol} -> ${command}${status}`);
}

console.log('');
```

The status indicator is helpful: if `aliases.json` has an entry but the wrapper script is missing (because the user imported config but has not run sync yet), the list shows that context.

4. **Structured output for JSON mode.** If the output format is JSON (detected via `context.detect` or similar), return the data as an array of objects.

```javascript
// If structured output is needed:
const result = entries.map(([name, command]) => ({
  name,
  command,
  scriptExists: fs.existsSync(path.join(binDir, name))
    || fs.existsSync(path.join(binDir, name + '.cmd'))
}));

context.output.print(result);
```

### Step 2: Implement `src/commands/alias/sync.js`

Fill in the `meta` object:

```javascript
const meta = {
  description: 'Rebuild all alias wrapper scripts from aliases.json. Cleans up orphaned scripts.',
  arguments: [],
  flags: [
    { name: 'dry-run', type: 'boolean', description: 'Show what would be done without doing it' }
  ]
};
```

The `run` function needs to do three things: generate scripts for all aliases, remove scripts that are not in `aliases.json`, and report what happened.

1. **Load aliases.json.**

```javascript
const aliasesPath = path.join(os.homedir(), '.devutils', 'aliases.json');
let aliases = {};

if (fs.existsSync(aliasesPath)) {
  aliases = JSON.parse(fs.readFileSync(aliasesPath, 'utf8'));
}
```

2. **Ensure the bin directory exists.**

```javascript
const binDir = path.join(os.homedir(), '.devutils', 'bin');
fs.mkdirSync(binDir, { recursive: true });
```

3. **Scan existing scripts in the bin directory.** Read all files in `~/.devutils/bin/` to find which wrapper scripts currently exist.

```javascript
const existingFiles = fs.readdirSync(binDir);
```

4. **Determine what to create and what to remove.** Build two lists:
   - Scripts to create: aliases in `aliases.json` that do not have a matching script
   - Scripts to remove: files in the bin directory that do not have a matching entry in `aliases.json`

```javascript
const platform = require('../../lib/platform').detect();

// Build a set of expected script filenames
const expectedNames = new Set();
for (const name of Object.keys(aliases)) {
  if (platform.type === 'windows') {
    expectedNames.add(name + '.cmd');
  } else {
    expectedNames.add(name);
  }
}

// Find orphans: files in bin/ that are not in aliases.json
const orphans = existingFiles.filter(file => {
  // Strip .cmd extension for comparison
  const baseName = file.endsWith('.cmd') ? file.slice(0, -4) : file;
  return !aliases[baseName];
});

// Find missing: aliases that do not have a script
const missing = Object.keys(aliases).filter(name => {
  return !fs.existsSync(path.join(binDir, name))
    && !fs.existsSync(path.join(binDir, name + '.cmd'));
});
```

5. **Handle dry-run mode.** If `--dry-run` is set, show what would happen and exit.

```javascript
if (args.flags['dry-run']) {
  if (missing.length === 0 && orphans.length === 0) {
    console.log('Everything is in sync. Nothing to do.');
    return;
  }

  if (missing.length > 0) {
    console.log(`Would create ${missing.length} wrapper script(s):`);
    for (const name of missing) {
      console.log(`  + ${name} -> ${aliases[name]}`);
    }
  }

  if (orphans.length > 0) {
    console.log(`Would remove ${orphans.length} orphaned script(s):`);
    for (const file of orphans) {
      console.log(`  - ${file}`);
    }
  }
  return;
}
```

6. **Generate all wrapper scripts.** Regenerate every script (not just the missing ones) to ensure they are all up to date. This handles cases where the command mapping changed.

```javascript
// Use the same generateWrapper function from helpers.js
const { generateWrapper, deleteWrapper } = require('./helpers');

let created = 0;
for (const [name, command] of Object.entries(aliases)) {
  generateWrapper(name, command, binDir, platform.type);
  created++;
}
```

7. **Remove orphaned scripts.**

```javascript
let removed = 0;
for (const file of orphans) {
  const filePath = path.join(binDir, file);
  fs.unlinkSync(filePath);
  removed++;
}
```

8. **Report results.**

```javascript
console.log(`Alias sync complete.`);
console.log(`  ${created} script(s) generated`);
if (removed > 0) {
  console.log(`  ${removed} orphaned script(s) removed`);
}
console.log('');

if (created > 0) {
  console.log('Make sure ~/.devutils/bin is in your PATH.');
}
```

### Step 3: Ensure the helpers.js module is complete

The `helpers.js` module (from story 009-alias/001) should export at minimum:

```javascript
module.exports = {
  generateWrapper,   // (name, command, binDir, platformType) -> void
  deleteWrapper,     // (name, binDir) -> void
  loadAliases,       // () -> object
  saveAliases        // (aliases) -> void
};
```

If it was not created in the previous story, create it now. Both `add.js`, `remove.js`, `list.js`, and `sync.js` should import from it to avoid duplicated logic.

## Files to Create or Modify
- `src/commands/alias/list.js` -- Replace the stub with the alias listing logic
- `src/commands/alias/sync.js` -- Replace the stub with the full sync and cleanup logic
- `src/commands/alias/helpers.js` -- Shared helper module (if not created in the previous story, create it now)

## Acceptance Criteria
- [ ] `dev alias list` shows all aliases from `aliases.json` sorted alphabetically
- [ ] `dev alias list` shows which aliases are missing their wrapper scripts
- [ ] `dev alias list` with no aliases shows a helpful message about how to create one
- [ ] `dev alias sync` regenerates all wrapper scripts in `~/.devutils/bin/` from `aliases.json`
- [ ] `dev alias sync` removes scripts in `~/.devutils/bin/` that are not in `aliases.json`
- [ ] `dev alias sync --dry-run` shows what would happen without doing it
- [ ] After `sync`, every alias in `aliases.json` has a matching executable wrapper script
- [ ] After `sync`, no orphaned scripts remain in `~/.devutils/bin/`
- [ ] `sync` creates the bin directory if it does not exist
- [ ] `sync` reports how many scripts were generated and how many orphans were removed
- [ ] `sync` handles an empty `aliases.json` by removing all scripts in the bin directory

## Testing

```bash
# Set up some test aliases
dev alias add gs "dev util run git-status"
dev alias add gp "dev util run git-push"

# List them
dev alias list
# Expected:
#   Aliases (2):
#     gp                        -> dev util run git-push
#     gs                        -> dev util run git-status

# Manually delete one wrapper script to test sync
rm ~/.devutils/bin/gs

# List should show missing script
dev alias list
# Expected: gs shows "(no script -- run dev alias sync)"

# Run sync
dev alias sync
# Expected: 2 script(s) generated

# Verify gs was recreated
ls -la ~/.devutils/bin/gs
# Expected: File exists with execute permission

# Test orphan cleanup: manually create a script that is not in aliases.json
echo '#!/bin/sh\necho orphan' > ~/.devutils/bin/old-alias
chmod +x ~/.devutils/bin/old-alias

dev alias sync
# Expected: 2 script(s) generated, 1 orphaned script(s) removed

ls ~/.devutils/bin/old-alias
# Expected: No such file

# Test dry-run
echo '#!/bin/sh\necho orphan' > ~/.devutils/bin/another-orphan
chmod +x ~/.devutils/bin/another-orphan

dev alias sync --dry-run
# Expected: Would remove 1 orphaned script(s): another-orphan
# (but the file is NOT actually deleted)

ls ~/.devutils/bin/another-orphan
# Expected: File still exists

# Actually sync
dev alias sync
# Expected: Removes the orphan

# Test empty aliases
echo '{}' > ~/.devutils/aliases.json
dev alias sync
# Expected: 0 script(s) generated, 2 orphaned script(s) removed

# Clean up
dev alias add gs "dev util run git-status"
```

## Notes
- The `sync` command regenerates ALL scripts, not just missing ones. This is intentional. If a user edits `aliases.json` to change the command for an existing alias, `sync` picks up the change. Regenerating is fast (just writing small text files) and guarantees consistency.
- The orphan detection compares files in the bin directory against entries in `aliases.json`. It strips the `.cmd` extension when comparing so that a Windows `.cmd` file is matched against its Unix counterpart. This handles the case where a user switches platforms (e.g., working in Git Bash after previously generating `.cmd` files).
- The `list` command checks for script existence per alias. This is slightly more work than just dumping the JSON, but it gives the user valuable feedback about whether their aliases are actually functional. If someone just imported config but has not run `sync`, they will see "(no script)" next to each alias.
- Be careful about what counts as an "orphan." Only files in `~/.devutils/bin/` should be removed. Do not accidentally delete other files or subdirectories that might be in that folder. The current approach reads all files from the directory, which is fine since only wrapper scripts should be there. If other tools start using this directory, add a naming convention or a marker comment in the scripts to identify DevUtils-generated files.
- The `--dry-run` flag on `sync` is useful for users who want to see what will happen before committing. It is especially reassuring for the orphan cleanup behavior, since deleting files from a PATH directory could be alarming.
