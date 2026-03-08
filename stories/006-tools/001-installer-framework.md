# Story 001: Installer Framework

## Goal
Build the installer framework that all individual tool installers plug into. This is the backbone of the `dev tools` service. Every tool that DevUtils can install (git, node, docker, etc.) follows the same pattern and registers itself in a central registry. The framework handles the boring parts so each installer only needs to worry about the actual install commands for each platform.

## Prerequisites
- 001-foundation/001 (platform detection -- needed to know which OS we're on)
- 001-foundation/002 (shell execution -- needed to run install commands and check if tools exist)

## Background
DevUtils supports installing developer tools across six platforms. Rather than having each installer figure out platform detection, dependency resolution, and "is it already installed?" checks on its own, we build a shared framework that handles all of that.

The framework has three pieces:

1. **Registry** (`src/installers/registry.json`) -- A JSON file that lists every tool DevUtils knows about. Each entry has metadata: name, description, which platforms it supports, what other tools it depends on, and whether it's a desktop app or CLI tool. This file is the single source of truth for "what can DevUtils install?"

2. **Base installer pattern** -- Every installer file (like `src/installers/git.js`) follows the same shape. It exports `isInstalled()`, `install()`, and one `install_<platform>()` function per supported platform. The framework loads these files dynamically based on the registry.

3. **Framework module** (`src/lib/installer.js`) -- The glue code. It reads the registry, validates that an installer exists before trying to run it, checks if the tool is already installed, resolves dependency chains (e.g., nvm depends on git), and calls the right installer. Commands in `src/commands/tools/` use this module instead of talking to installer files directly.

## Technique

### Step 1: Define the registry schema

Open `src/installers/registry.json` and replace the empty tools array with a schema that has a few initial entries. Here's the shape for each tool:

```json
{
  "tools": [
    {
      "name": "git",
      "description": "Distributed version control system",
      "platforms": ["macos", "ubuntu", "raspbian", "amazon-linux", "windows", "gitbash"],
      "dependencies": [],
      "desktop": false,
      "installer": "git.js"
    },
    {
      "name": "node",
      "description": "JavaScript runtime (installed via nvm on Unix)",
      "platforms": ["macos", "ubuntu", "raspbian", "amazon-linux", "windows", "gitbash"],
      "dependencies": ["git"],
      "desktop": false,
      "installer": "node.js"
    },
    {
      "name": "homebrew",
      "description": "Package manager for macOS",
      "platforms": ["macos"],
      "dependencies": [],
      "desktop": false,
      "installer": "homebrew.js"
    }
  ]
}
```

Field definitions:
- `name` -- The tool's name, used as the lookup key (e.g., `dev tools install git`).
- `description` -- One-line description shown in `dev tools list` and `dev tools search`.
- `platforms` -- Array of platform type strings where this tool can be installed. Must match the values from `platform.detect().type`.
- `dependencies` -- Array of tool names that must be installed first. The framework resolves these recursively.
- `desktop` -- Boolean. `true` for GUI apps (VS Code, Docker Desktop), `false` for CLI tools. Useful for filtering in list/search.
- `installer` -- Filename in `src/installers/` that contains the install logic.

Start with just the three entries above (git, node, homebrew). More will be added in later stories.

### Step 2: Create the installer template

Write a reference template at `src/installers/_template.js`. This file is not an actual installer -- it's a copy-paste starting point for developers creating new ones. It should look like this:

```javascript
#!/usr/bin/env node
'use strict';

/**
 * Installer: <TOOL_NAME>
 *
 * Installs <TOOL_NAME> on supported platforms.
 * See registry.json for platform support and dependencies.
 */

/**
 * Check if <TOOL_NAME> is already installed.
 * @param {object} context - The CLI context object (has platform, shell, output, etc.)
 * @returns {Promise<boolean>} true if the tool is available on the system
 */
async function isInstalled(context) {
  // Use context.shell to check if the binary exists on the PATH.
  // Example: return context.shell.commandExists('<binary-name>');
  return false;
}

/**
 * Install on macOS using Homebrew.
 * @param {object} context - The CLI context object
 */
async function install_macos(context) {
  // Example: await context.shell.exec('brew install <tool>');
  throw new Error('install_macos not implemented');
}

/**
 * Install on Ubuntu using apt.
 * @param {object} context - The CLI context object
 */
async function install_ubuntu(context) {
  throw new Error('install_ubuntu not implemented');
}

/**
 * Install on Raspberry Pi OS using apt.
 * @param {object} context - The CLI context object
 */
async function install_raspbian(context) {
  throw new Error('install_raspbian not implemented');
}

/**
 * Install on Amazon Linux using dnf/yum.
 * @param {object} context - The CLI context object
 */
async function install_amazon_linux(context) {
  throw new Error('install_amazon_linux not implemented');
}

/**
 * Install on Windows using Chocolatey or winget.
 * @param {object} context - The CLI context object
 */
async function install_windows(context) {
  throw new Error('install_windows not implemented');
}

/**
 * Install in Git Bash (manual or portable install).
 * @param {object} context - The CLI context object
 */
async function install_gitbash(context) {
  throw new Error('install_gitbash not implemented');
}

/**
 * Main install dispatcher. Detects the platform and calls the right function.
 * The framework calls this -- you don't need to call it directly.
 * @param {object} context - The CLI context object
 */
async function install(context) {
  const platformType = context.platform.detect().type;
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'raspbian': install_raspbian,
    'amazon-linux': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  const fn = installers[platformType];
  if (!fn) {
    throw new Error(`No installer for platform: ${platformType}`);
  }

  await fn(context);
}

module.exports = {
  isInstalled,
  install,
  install_macos,
  install_ubuntu,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash,
};
```

Key things to notice:
- Every function takes `context` as its argument. This is the same context object the CLI router passes to commands. It has `context.platform`, `context.shell`, `context.output`, `context.config`, etc.
- `isInstalled()` is async and returns a boolean. Even if the check itself is synchronous (like `which`), we keep it async for consistency.
- The `install()` dispatcher uses the same platform type strings that `platform.detect()` returns.
- Each `install_<platform>()` function throws a "not implemented" error by default. When you create a real installer, you replace these with actual logic and delete the platforms you don't support.

### Step 3: Build the framework module

Create `src/lib/installer.js`. This is the module that commands use to interact with installers. It exports these functions:

**`loadRegistry()`** -- Reads and parses `src/installers/registry.json`. Returns the tools array. Cache the result after the first call (the registry doesn't change during a CLI run). Use `path.join(__dirname, '..', 'installers', 'registry.json')` to build the path.

**`findTool(name)`** -- Looks up a tool by name in the registry. Returns the tool object or `null` if not found. Case-insensitive comparison (convert both sides to lowercase).

**`loadInstaller(toolEntry)`** -- Takes a tool entry from the registry and `require()`s its installer file. Returns the module (which has `isInstalled`, `install`, etc.). Validates that the file exists and exports the required functions. If the file is missing or doesn't export `isInstalled` and `install`, throw a clear error.

**`resolveDependencies(toolName)`** -- Takes a tool name and returns a flat, ordered array of tool names that need to be installed, including the tool itself. If tool A depends on B, and B depends on C, this returns `['C', 'B', 'A']`. Must detect circular dependencies and throw an error if found. Here's the algorithm:

```javascript
function resolveDependencies(toolName, visited = new Set(), chain = []) {
  if (chain.includes(toolName)) {
    throw new Error(`Circular dependency detected: ${chain.join(' -> ')} -> ${toolName}`);
  }
  if (visited.has(toolName)) {
    return [];
  }

  const tool = findTool(toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  chain.push(toolName);
  visited.add(toolName);

  const result = [];
  for (const dep of tool.dependencies) {
    result.push(...resolveDependencies(dep, visited, [...chain]));
  }
  result.push(toolName);
  return result;
}
```

**`checkInstalled(toolName, context)`** -- Takes a tool name and context, loads the installer, and calls its `isInstalled()`. Returns `true` or `false`.

**`installTool(toolName, context)`** -- The main function commands will call. It:
1. Looks up the tool in the registry. Throws if not found.
2. Checks if the current platform is in the tool's `platforms` array. Throws if not supported.
3. Resolves the dependency chain.
4. For each tool in the chain (in order), checks if it's already installed. If not, loads the installer and calls `install(context)`.
5. Returns an object summarizing what happened: `{ tool, alreadyInstalled, dependenciesInstalled, installed }`.

### Step 4: Code style

- CommonJS modules (`require` / `module.exports`)
- 2-space indentation, LF line endings
- `'use strict';` at the top of every file
- JSDoc comments on every exported function
- No external dependencies -- only Node.js built-ins and other `src/lib/` modules

## Files to Create or Modify
- `src/installers/registry.json` -- Populate with schema and initial entries (git, node, homebrew)
- `src/installers/_template.js` -- Reference installer template for copy-paste
- `src/lib/installer.js` -- Framework module with registry loading, dependency resolution, and install orchestration

## Acceptance Criteria
- [ ] `registry.json` contains valid JSON with at least three tool entries (git, node, homebrew)
- [ ] Each registry entry has all required fields: name, description, platforms, dependencies, desktop, installer
- [ ] `_template.js` exports `isInstalled`, `install`, and all six `install_<platform>` functions
- [ ] `loadRegistry()` returns the tools array from `registry.json`
- [ ] `findTool('git')` returns the git entry; `findTool('nonexistent')` returns `null`
- [ ] `findTool()` is case-insensitive (`findTool('Git')` works)
- [ ] `loadInstaller()` throws a clear error if the installer file is missing
- [ ] `loadInstaller()` throws if the file doesn't export `isInstalled` or `install`
- [ ] `resolveDependencies('node')` returns `['git', 'node']` (since node depends on git)
- [ ] `resolveDependencies('git')` returns `['git']` (no dependencies)
- [ ] Circular dependencies throw an error with the chain listed
- [ ] `installTool()` checks the platform before attempting install
- [ ] `installTool()` skips tools that are already installed (idempotent)
- [ ] `installTool()` installs dependencies in the correct order before the requested tool

## Testing

Run from the project root:

```bash
# Test registry loading
node -e "const i = require('./src/lib/installer'); console.log(i.loadRegistry().length)"
# Expected: 3

# Test tool lookup
node -e "const i = require('./src/lib/installer'); console.log(i.findTool('git').name)"
# Expected: git

# Test case-insensitive lookup
node -e "const i = require('./src/lib/installer'); console.log(i.findTool('Git').name)"
# Expected: git

# Test unknown tool returns null
node -e "const i = require('./src/lib/installer'); console.log(i.findTool('doesnotexist'))"
# Expected: null

# Test dependency resolution
node -e "const i = require('./src/lib/installer'); console.log(i.resolveDependencies('node'))"
# Expected: [ 'git', 'node' ]

node -e "const i = require('./src/lib/installer'); console.log(i.resolveDependencies('git'))"
# Expected: [ 'git' ]

# Test that loadInstaller throws for missing files (git.js doesn't exist yet)
node -e "const i = require('./src/lib/installer'); try { i.loadInstaller(i.findTool('git')); } catch(e) { console.log(e.message); }"
# Expected: error message about missing installer file
```

## Notes
- The `installer` field in registry.json is a filename, not a path. The framework always looks in `src/installers/` for the file. Don't put paths or subdirectories in this field.
- Platform strings in the registry must exactly match what `platform.detect().type` returns. Use `'amazon-linux'` (hyphen), not `'amazon_linux'` (underscore).
- The `_template.js` file starts with an underscore so it sorts to the top of the directory and is obviously not a real installer. Don't register it in `registry.json`.
- Dependency resolution is recursive, but our tool set is small enough that deep chains won't be a problem. Still, the circular dependency check is important because it's easy to accidentally create one when editing `registry.json`.
- The `context` parameter flows through the entire chain. This is the same context object the CLI router builds. Installers never create their own platform or shell instances -- they always use what's on context.
