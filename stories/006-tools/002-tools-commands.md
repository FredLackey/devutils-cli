# Story 002: Tools Commands

## Goal
Implement the four user-facing commands for the tools service: `install`, `check`, `list`, and `search`. These are how developers actually interact with the installer framework from story 001. Without these commands, the framework exists but nobody can use it. After this story, a developer can type `dev tools install git` and have it just work.

## Prerequisites
- 006-tools/001 (installer framework -- provides the registry, dependency resolution, and install orchestration)
- 001-foundation/008 (CLI router -- commands need to be routable via `dev tools <method>`)

## Background
The stub files already exist at `src/commands/tools/install.js`, `check.js`, `list.js`, and `search.js`. Each exports `{ meta, run }` with empty implementations. The service registration at `src/commands/tools/index.js` already wires these files into the CLI router.

Every command receives two arguments: `args` (the parsed arguments array) and `context`. The context object has everything a command needs:
- `context.platform` -- platform detection (from `src/lib/platform.js`)
- `context.shell` -- shell execution (from `src/lib/shell.js`)
- `context.output` -- output formatting (from `src/lib/output.js`)
- `context.config` -- config read/write (from `src/lib/config.js`)
- `context.errors` -- error formatting (from `src/lib/errors.js`)
- `context.prompt` -- interactive prompts (from `src/lib/prompt.js`)

The installer framework module at `src/lib/installer.js` (from story 001) provides the functions these commands call: `loadRegistry()`, `findTool()`, `checkInstalled()`, `installTool()`, etc.

## Technique

### Step 1: Implement `src/commands/tools/install.js`

This is the main command: `dev tools install <tool-name>`.

Fill in the `meta` object:

```javascript
const meta = {
  description: 'Install a development tool',
  arguments: [
    { name: 'tool', description: 'Name of the tool to install', required: true }
  ],
  flags: [
    { name: '--dry-run', description: 'Show what would be installed without doing it' },
    { name: '--skip-deps', description: 'Skip dependency installation' }
  ]
};
```

The `run` function should:

1. Pull the tool name from `args[0]`. If missing, call `context.errors.missingArgument('tool')` and return.
2. Load the installer framework: `const installer = require('../../lib/installer');`
3. Look up the tool: `const tool = installer.findTool(toolName)`. If null, print an error with `context.output.error()` saying the tool isn't in the registry, and suggest running `dev tools search <name>` to find it.
4. Check if the current platform is supported: compare `context.platform.detect().type` against `tool.platforms`. If not supported, print an error and return.
5. If `--dry-run` is set, resolve dependencies and print what would be installed (tool names and order), then return without installing anything.
6. Call `installer.installTool(toolName, context)` and capture the result.
7. Print a summary using `context.output`:
   - If it was already installed: "git is already installed."
   - If dependencies were installed: list them.
   - If the tool was installed: "git installed successfully."
8. Wrap the whole thing in try/catch. On error, use `context.errors.handleError(err)`.

### Step 2: Implement `src/commands/tools/check.js`

This command reports whether a tool is installed: `dev tools check <tool-name>`.

```javascript
const meta = {
  description: 'Check if a tool is installed and show its version',
  arguments: [
    { name: 'tool', description: 'Name of the tool to check', required: true }
  ],
  flags: []
};
```

The `run` function should:

1. Get the tool name from `args[0]`. Error if missing.
2. Look up the tool in the registry. Error if not found.
3. Load the installer and call `isInstalled(context)`.
4. If installed, try to get the version by running `<binary> --version` through `context.shell.exec()`. Some tools use `-v` or `version` instead, so wrap this in a try/catch and report "version unknown" if it fails.
5. Print the result: "git: installed (version 2.43.0)" or "git: not installed".

### Step 3: Implement `src/commands/tools/list.js`

Shows tools from the registry: `dev tools list`.

```javascript
const meta = {
  description: 'List available tools',
  arguments: [],
  flags: [
    { name: '--installed', description: 'Show only installed tools' },
    { name: '--available', description: 'Show only tools not yet installed' },
    { name: '--platform', description: 'Filter by platform (default: current)' }
  ]
};
```

The `run` function should:

1. Load the full registry with `installer.loadRegistry()`.
2. Determine the platform filter. Default is `context.platform.detect().type`. If `--platform` is provided, use that instead.
3. Filter the tools list to only those supporting the target platform.
4. If `--installed` or `--available` is set, check each tool's install status (using the installer's `isInstalled()`) and filter accordingly.
5. Format the output as a table with columns: Name, Description, Installed (yes/no). Use `context.output.table()`.
6. If no tools match the filters, print a message saying so.

### Step 4: Implement `src/commands/tools/search.js`

Finds tools by name or keyword: `dev tools search <query>`.

```javascript
const meta = {
  description: 'Search for tools by name or keyword',
  arguments: [
    { name: 'query', description: 'Search term (matches name and description)', required: true }
  ],
  flags: []
};
```

The `run` function should:

1. Get the query from `args[0]`. Error if missing.
2. Load the registry.
3. Convert the query to lowercase.
4. Filter tools where the name or description (lowercased) includes the query string.
5. Print results as a table: Name, Description, Platforms (comma-separated).
6. If no results, print "No tools found matching '<query>'."

### Step 5: Code style

- CommonJS modules, 2-space indentation, LF line endings
- `'use strict';` at the top
- JSDoc comments on `meta` and `run`
- Each command is a small, focused file. Don't put shared logic in command files -- that belongs in `src/lib/installer.js`.

## Files to Create or Modify
- `src/commands/tools/install.js` -- Implement the install command
- `src/commands/tools/check.js` -- Implement the check command
- `src/commands/tools/list.js` -- Implement the list command
- `src/commands/tools/search.js` -- Implement the search command

## Acceptance Criteria
- [ ] `dev tools install git` installs git (or reports it's already installed)
- [ ] `dev tools install git --dry-run` prints what would happen without installing
- [ ] `dev tools install nonexistent` prints a clear error and suggests `dev tools search`
- [ ] `dev tools install <tool>` on an unsupported platform prints a platform error
- [ ] `dev tools install node` installs git first (dependency), then node
- [ ] `dev tools check git` reports installed/not-installed with version info
- [ ] `dev tools check git` with no tool name prints a usage error
- [ ] `dev tools list` shows all tools for the current platform as a table
- [ ] `dev tools list --installed` shows only installed tools
- [ ] `dev tools list --available` shows only tools not yet installed
- [ ] `dev tools search git` finds git and any tool with "git" in the description
- [ ] `dev tools search nonexistent` prints "No tools found" message
- [ ] All commands use `context.output` for formatting (no raw `console.log`)
- [ ] All commands use `context.errors` for error reporting

## Testing

```bash
# Install command - dry run (safe to test anywhere)
dev tools install git --dry-run
# Expected: Shows "Would install: git" (or "git is already installed")

# Install command - missing argument
dev tools install
# Expected: Error message about missing tool name

# Install command - unknown tool
dev tools install foobar
# Expected: Error "Tool 'foobar' not found in registry" with search suggestion

# Check command
dev tools check git
# Expected: "git: installed (version X.Y.Z)" (on a machine with git)

# List command - all tools
dev tools list
# Expected: Table with Name, Description, Installed columns

# List command - installed only
dev tools list --installed
# Expected: Only tools that are currently installed

# Search command
dev tools search git
# Expected: Table showing git entry (and anything else matching "git")

# Search command - no results
dev tools search zzzzz
# Expected: "No tools found matching 'zzzzz'"
```

## Notes
- The `list` command with `--installed` or `--available` needs to call `isInstalled()` for every tool in the registry. If the registry gets large, this could be slow because each check may spawn a subprocess. For now, with just a few tools, it's fine. If it becomes a problem later, we can add caching.
- The `check` command tries `--version` to get the version string. Not every tool uses that flag. Some use `-v`, some use `version` as a subcommand. For the initial implementation, just try `--version` and fall back to "version unknown." Individual installers can override this in later stories if needed.
- Don't import the installer framework at the top of the file. Use `require('../../lib/installer')` inside the `run` function. This keeps the module loading lazy -- the framework only gets loaded when someone actually runs a tools command.
- The `--skip-deps` flag on install is a safety valve. Sometimes a dependency is already installed through a different method (like the OS came with git preinstalled) but our `isInstalled()` check doesn't detect it. `--skip-deps` lets the user bypass that.
