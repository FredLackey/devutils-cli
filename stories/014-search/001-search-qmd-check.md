# Story 001: QMD Availability Check, Status, and Collections

## Goal
Build the shared QMD availability check that all search commands depend on, then implement `dev search status` and `dev search collections`. The QMD check is a small utility function that verifies the `qmd` binary is installed and available on the system PATH. Every `dev search` command calls this check before doing anything else. If QMD isn't found, the command returns a consistent error message with install instructions instead of a confusing "command not found" failure. `status` shows the health of the search index (collection count, document count, index freshness). `collections` manages the directories that QMD indexes, with `add`, `remove`, and `list` sub-commands. These two commands plus the shared check establish the foundation for all search commands.

## Prerequisites
- 001-foundation/008 (CLI router)

## Background
QMD (Query Markup Documents) is an external tool that provides local document search with three modes: BM25 keyword search, vector similarity search, and hybrid search combining both with LLM re-ranking. It's not part of DevUtils. It's installed separately via `bun install -g @tobilu/qmd`.

DevUtils wraps QMD commands to give them a consistent `dev search` interface, handle output formatting, and provide a smooth experience when QMD isn't installed. The wrapping is thin. DevUtils doesn't reimplement any search logic. It shells out to the `qmd` binary and captures the output.

The QMD availability check is the gatekeeper. Every search command calls it first. If QMD isn't installed, the user gets a clear message instead of a broken experience. This pattern is similar to how the AI commands check for the AI tool binary before trying to launch it.

QMD organizes searchable content into **collections**. A collection is a named pointer to a directory on disk, optionally filtered by a glob mask (like `"**/*.md"` to only index Markdown files). Collections are managed through QMD's own CLI, and DevUtils wraps those commands.

Reference: `research/proposed/proposed-command-syntax.md` lines 509-565 for the search syntax. `research/proposed/proposed-command-structure.md` lines 88-98 for the service overview.

## Technique

### Step 1: Build the shared QMD check

Create a helper module at `src/commands/search/qmd.js` that every search command imports. It exports a single function:

```javascript
// src/commands/search/qmd.js
'use strict';

/**
 * Check if QMD is installed and available on PATH.
 * Returns { available: true } if found, or { available: false, message: '...' } if not.
 *
 * @param {object} context - The CLI context object (needs context.shell)
 * @returns {object} Availability result
 */
function checkQmd(context) {
  const isInstalled = context.shell.commandExists('qmd');

  if (!isInstalled) {
    return {
      available: false,
      message: 'QMD is not installed. Install it with: bun install -g @tobilu/qmd'
    };
  }

  return { available: true };
}

module.exports = { checkQmd };
```

Every search command uses it at the top of its `run` function:

```javascript
const { checkQmd } = require('./qmd');

async function run(args, context) {
  const qmd = checkQmd(context);
  if (!qmd.available) {
    context.errors.throw(1, qmd.message);
    return;
  }
  // ... rest of command
}
```

This is simple on purpose. A junior developer should look at any search command and immediately see the QMD check happening first.

### Step 2: Implement status.js

Fill in the meta:

```javascript
const meta = {
  description: 'Show search index health, collection count, and document count',
  arguments: [],
  flags: []
};
```

In the `run` function:

1. Run the QMD check. Exit if not available.
2. Shell out to `qmd status` and capture the output:

```javascript
const result = await context.shell.exec('qmd status');
```

3. Parse the output. QMD's status command returns information about the index state. The exact format depends on QMD's version, but typically includes:
   - Number of collections
   - Number of indexed documents
   - Index size or health indicator
   - Last index update timestamp

4. Build a structured result object:

```javascript
{
  collections: numberOfCollections,
  documents: numberOfDocuments,
  lastUpdated: lastUpdateTimestamp,
  healthy: true  // based on whether QMD reports any issues
}
```

5. Pass to `context.output.render()`.

For human-readable output:

```
Search Index Status:
  Collections:    3
  Documents:      847
  Last updated:   2026-03-08T10:30:00Z
  Health:         OK
```

If `qmd status` fails (returns a non-zero exit code), capture the error output and display it. Don't try to parse failed output.

### Step 3: Implement collections.js

This command handles three sub-commands: `add`, `remove`, and `list`. The first positional argument determines which sub-command to run.

Fill in the meta:

```javascript
const meta = {
  description: 'Manage searchable collections (add, remove, list)',
  arguments: [
    { name: 'action', description: 'Sub-command: add, remove, or list', required: true },
    { name: 'target', description: 'Directory path (for add) or collection name (for remove)', required: false }
  ],
  flags: [
    { name: 'name', type: 'string', description: 'Collection name (required for add)' },
    { name: 'mask', type: 'string', description: 'Glob pattern to filter indexed files (e.g., "**/*.md")' },
    { name: 'confirm', type: 'boolean', description: 'Skip confirmation prompt (for remove)' }
  ]
};
```

In the `run` function:

1. Run the QMD check.
2. Branch on the action argument:

**`list`** — Show all registered collections.

```javascript
const result = await context.shell.exec('qmd collections list');
```

Parse the output into an array of collection objects:

```javascript
[
  { name: 'notes', path: '/Users/me/notes', mask: '**/*.md', documents: 142 },
  { name: 'source', path: '/Users/me/Source', mask: '**/*.md', documents: 705 }
]
```

Pass to `context.output.render()`.

**`add`** — Register a new directory as a collection.

Validate that both `target` (the directory path) and `--name` are provided. If the directory doesn't exist, print an error and exit.

```javascript
const dirPath = path.resolve(args.arguments.target);
if (!fs.existsSync(dirPath)) {
  context.errors.throw(1, `Directory does not exist: ${dirPath}`);
  return;
}

const name = args.flags.name;
if (!name) {
  context.errors.throw(1, 'The --name flag is required when adding a collection.');
  return;
}

let cmd = `qmd collections add "${dirPath}" --name "${name}"`;
if (args.flags.mask) {
  cmd += ` --mask "${args.flags.mask}"`;
}

const result = await context.shell.exec(cmd);
context.output.print(`Collection "${name}" added: ${dirPath}`);
```

**`remove`** — Remove a collection.

The `target` argument is the collection name to remove. Ask for confirmation unless `--confirm` is passed.

```javascript
const name = args.arguments.target;
if (!name) {
  context.errors.throw(1, 'Provide the collection name to remove.');
  return;
}

const ok = args.flags.confirm || await context.prompt.confirm(
  `Remove collection "${name}"?`,
  { default: false }
);
if (!ok) {
  context.output.print('Cancelled.');
  return;
}

await context.shell.exec(`qmd collections remove "${name}"`);
context.output.print(`Collection "${name}" removed.`);
```

3. If the action is none of `add`, `remove`, or `list`, print usage:

```javascript
context.output.print('Usage: dev search collections <add|remove|list>');
```

### Step 4: Code style

- CommonJS modules
- 2-space indentation, LF line endings
- JSDoc comments on exported functions
- `'use strict';` at the top
- Use `context.shell.exec()` for running qmd commands
- Use `context.shell.commandExists()` for the QMD check
- Always quote paths and names in shell commands (they might contain spaces)

## Files to Create or Modify
- `src/commands/search/qmd.js` — New file. Shared QMD availability check.
- `src/commands/search/status.js` — Replace the stub with the status implementation.
- `src/commands/search/collections.js` — Replace the stub with the collections implementation.

## Acceptance Criteria
- [ ] The `checkQmd()` function returns `{ available: true }` when `qmd` is on PATH
- [ ] The `checkQmd()` function returns `{ available: false, message: 'QMD is not installed. Install it with: bun install -g @tobilu/qmd' }` when `qmd` is not on PATH
- [ ] `dev search status` shows collection count, document count, and last update time
- [ ] `dev search status` when QMD is not installed prints the install instructions
- [ ] `dev search status` when QMD is installed but no index exists shows zeros or an appropriate message
- [ ] `dev search collections list` shows all registered collections
- [ ] `dev search collections add /path/to/dir --name docs` registers a new collection
- [ ] `dev search collections add /path/to/dir --name docs --mask "**/*.md"` adds a collection with a file filter
- [ ] `dev search collections add` without `--name` prints a helpful error
- [ ] `dev search collections add /nonexistent --name foo` prints "Directory does not exist"
- [ ] `dev search collections remove docs` asks for confirmation then removes the collection
- [ ] `dev search collections remove docs --confirm` removes without asking
- [ ] `dev search collections badaction` prints usage information
- [ ] All search commands call `checkQmd()` before doing anything else
- [ ] Both commands export `{ meta, run }`

## Testing

```bash
# Test QMD check when QMD is not installed
# (Temporarily rename the qmd binary or test on a machine without it)
dev search status
# Expected: "QMD is not installed. Install it with: bun install -g @tobilu/qmd"

# Test with QMD installed
dev search status
# Expected: Collection count, document count, last updated, health status

# Collections - list (empty at first)
dev search collections list
# Expected: Empty list or "No collections registered"

# Collections - add
dev search collections add ~/Source/Personal --name personal-source --mask "**/*.md"
# Expected: "Collection 'personal-source' added: /Users/<you>/Source/Personal"

# Collections - list after adding
dev search collections list
# Expected: Shows the personal-source collection

# Collections - add with missing name
dev search collections add ~/Source/Personal
# Expected: "The --name flag is required when adding a collection."

# Collections - add with nonexistent directory
dev search collections add /nonexistent/path --name test
# Expected: "Directory does not exist: /nonexistent/path"

# Collections - remove
dev search collections remove personal-source
# Expected: Asks "Remove collection 'personal-source'?" then removes

# Collections - remove with --confirm
dev search collections remove personal-source --confirm
# Expected: Removes without asking

# Collections - unknown action
dev search collections foobar
# Expected: "Usage: dev search collections <add|remove|list>"
```

## Notes
- The QMD check uses `context.shell.commandExists()` which internally runs `which qmd` (or `where qmd` on Windows). This is a sync check and is fast. Don't cache the result — run it fresh every time. The user might install QMD between command runs.
- The exact output format of `qmd status` and `qmd collections list` may vary by QMD version. The parsing logic should be resilient. If the output format doesn't match what we expect, print the raw output rather than crashing on a parse error. Include a note like "(output format may vary by QMD version)" in comments.
- When building shell commands for `qmd`, always quote the directory paths and collection names with double quotes. Paths with spaces are common, especially on macOS (e.g., `/Users/Fred Lackey/Documents`). Collection names should not have spaces, but quote them defensively anyway.
- The `collections add` command resolves the directory path to an absolute path using `path.resolve()`. This ensures QMD gets a consistent, absolute path regardless of whether the user typed a relative path.
- The `collections` command handles sub-commands (add/remove/list) through a single command file with branching logic. This is simpler than creating three separate files for what is essentially one concept. The CLI route is `dev search collections add`, where `add` is parsed as the first argument to the collections command.
- If `qmd` returns a non-zero exit code, capture both stdout and stderr from the exec result and display them. QMD might return useful error messages that should be passed through to the user.
