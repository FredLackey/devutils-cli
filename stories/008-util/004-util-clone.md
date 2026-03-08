# Story 004: Clone Utility

## Goal
Create the built-in `clone` utility at `src/utils/clone/`. This utility clones a git repository and automatically detects the right package manager to install dependencies. It checks for lock files in a specific order -- `yarn.lock`, `pnpm-lock.yaml`, `package-lock.json` -- and runs the matching install command. It supports both SSH and HTTPS URLs and handles the common case of cloning into a specific directory name. This was one of the most practical scripts in v0.0.18, and it saves developers from the repetitive three-step process of clone, cd, install.

## Prerequisites
- 008-util/001 (utility framework -- `dev util run`, `list`, and `show` must be working)

## Background
Every time a developer clones a Node.js project, they do the same sequence: `git clone <url>`, `cd <dir>`, `npm install` (or yarn, or pnpm). The `clone` utility collapses that into one step. It also solves a subtle annoyance: figuring out which package manager the project uses. If you run `npm install` on a project that uses pnpm, you create an unwanted `package-lock.json` alongside the existing `pnpm-lock.yaml`. The clone utility looks at the lock files to pick the right one.

The legacy implementation is at `_rebuild/src/scripts/clone.js`. The new version uses the same detection logic but restructures it as a utility with the standard `{ meta, run }` interface. Because `git clone` works identically across all platforms, this utility is implemented entirely in JavaScript -- no platform-specific shell scripts needed.

Reference: `_rebuild/src/scripts/clone.js` for the lock file detection and repo name extraction logic.

## Technique

### Step 1: Create the directory and index.js

Create `src/utils/clone/index.js` with the standard utility exports:

```javascript
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const meta = {
  name: 'clone',
  description: 'Clone a git repo and auto-install dependencies using the detected package manager',
  platforms: ['macos', 'ubuntu', 'raspbian', 'amazon-linux', 'windows', 'gitbash'],
  arguments: [
    { name: 'url', required: true, description: 'Git repository URL (SSH or HTTPS)' },
    { name: 'directory', required: false, description: 'Target directory name (defaults to repo name)' }
  ],
  flags: []
};
```

### Step 2: Implement the repo name extractor

Write a function that extracts the directory name from a git URL. It needs to handle several formats:

- `https://github.com/user/repo.git` -> `repo`
- `git@github.com:user/repo.git` -> `repo`
- `https://github.com/user/repo` (no .git suffix) -> `repo`
- `git@github.com:user/repo` (no .git suffix) -> `repo`

```javascript
/**
 * Extract the repository name from a git URL.
 * Handles HTTPS, SSH, and bare path formats.
 *
 * @param {string} url - The git repository URL
 * @returns {string} The extracted repo name
 */
function extractRepoName(url) {
  // Remove trailing slashes
  let cleaned = url.replace(/\/+$/, '');

  // Remove .git suffix if present
  cleaned = cleaned.replace(/\.git$/, '');

  // For SSH format (git@host:user/repo), take the part after the last /
  // For HTTPS format (https://host/user/repo), same approach
  const lastSegment = cleaned.split('/').pop() || '';

  // If the segment still has a colon (e.g., from git@host:repo with no slash),
  // take the part after the colon
  if (lastSegment.includes(':')) {
    return lastSegment.split(':').pop() || 'cloned-repo';
  }

  return lastSegment || 'cloned-repo';
}
```

### Step 3: Implement the package manager detector

Write a function that checks for lock files in order and returns the matching package manager. The detection order matters: check `yarn.lock` first, then `pnpm-lock.yaml`, then fall back to `npm` if `package-lock.json` exists or if no lock file exists but `package.json` is present.

```javascript
/**
 * Detect which package manager to use based on lock files in the directory.
 * Checks lock files in order: yarn.lock, pnpm-lock.yaml, package-lock.json.
 * Falls back to npm if no lock file is found but package.json exists.
 *
 * @param {string} dir - The directory to check
 * @returns {{ name: string, installCmd: string } | null} Package manager info, or null if not a JS project
 */
function detectPackageManager(dir) {
  const hasPackageJson = fs.existsSync(path.join(dir, 'package.json'));
  if (!hasPackageJson) {
    return null;
  }

  // Check lock files in priority order
  if (fs.existsSync(path.join(dir, 'yarn.lock'))) {
    return { name: 'yarn', installCmd: 'yarn install' };
  }

  if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) {
    return { name: 'pnpm', installCmd: 'pnpm install' };
  }

  if (fs.existsSync(path.join(dir, 'package-lock.json'))) {
    return { name: 'npm', installCmd: 'npm install' };
  }

  // package.json exists but no lock file -- default to npm
  return { name: 'npm', installCmd: 'npm install' };
}
```

Also check that the detected package manager is actually installed on the machine. Use `lib/shell.js` to verify:

```javascript
/**
 * Check if a command is available on this machine.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists on PATH
 */
function isAvailable(cmd) {
  const shell = require('../../lib/shell');
  return shell.commandExists(cmd);
}
```

### Step 4: Implement the run function

The `run` function brings everything together:

1. Validate that git is installed.
2. Extract the URL and optional target directory from args.
3. Extract the repo name from the URL if no target directory was given.
4. Check that the target directory does not already exist.
5. Run `git clone` using `spawnSync` with `stdio: 'inherit'` so the user sees git's progress output.
6. If clone succeeds, check for `package.json` in the cloned directory.
7. If `package.json` exists, detect the package manager and run install.

```javascript
async function run(args, context) {
  const shell = require('../../lib/shell');

  // Validate git is installed
  if (!shell.commandExists('git')) {
    console.error('Error: git is not installed.');
    console.error('Install git first, then try again.');
    return;
  }

  // Parse arguments
  const url = args[0];
  if (!url) {
    console.error('Usage: dev util run clone <url> [directory]');
    console.error('');
    console.error('Examples:');
    console.error('  dev util run clone git@github.com:user/repo.git');
    console.error('  dev util run clone https://github.com/user/repo.git');
    console.error('  dev util run clone git@github.com:user/repo.git my-project');
    return;
  }

  const targetDir = args[1] || extractRepoName(url);
  const fullPath = path.resolve(process.cwd(), targetDir);

  // Check if target already exists
  if (fs.existsSync(fullPath)) {
    console.error(`Error: Directory "${targetDir}" already exists.`);
    return;
  }

  // Clone the repository
  console.log(`Cloning ${url} into ${targetDir}...`);
  console.log('');

  const cloneResult = spawnSync('git', ['clone', url, targetDir], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  if (cloneResult.status !== 0) {
    console.error('');
    console.error('git clone failed.');
    return;
  }

  // Check if the directory was actually created
  if (!fs.existsSync(fullPath)) {
    console.error('Clone appeared to succeed but the directory was not created.');
    return;
  }

  // Detect package manager and install dependencies
  const pm = detectPackageManager(fullPath);

  if (!pm) {
    console.log('');
    console.log(`Cloned into "${targetDir}".`);
    console.log('No package.json found -- skipping dependency installation.');
    return;
  }

  if (!isAvailable(pm.name)) {
    console.log('');
    console.log(`Cloned into "${targetDir}".`);
    console.log(`package.json found, but ${pm.name} is not installed.`);
    console.log(`Install ${pm.name} and run: ${pm.installCmd}`);
    return;
  }

  console.log('');
  console.log(`Installing dependencies with ${pm.name}...`);
  console.log('');

  const installResult = spawnSync(pm.name, ['install'], {
    stdio: 'inherit',
    cwd: fullPath,
    shell: true
  });

  if (installResult.status !== 0) {
    console.error('');
    console.error(`${pm.name} install finished with errors. Check the output above.`);
  } else {
    console.log('');
    console.log('Dependencies installed.');
  }

  console.log('');
  console.log(`Done. To enter the project: cd ${targetDir}`);
}
```

### Step 5: Register in registry.json

Add the clone entry to `src/utils/registry.json`:

```json
{
  "name": "clone",
  "description": "Clone a git repo and auto-install dependencies using the detected package manager",
  "type": "built-in",
  "platforms": ["macos", "ubuntu", "raspbian", "amazon-linux", "windows", "gitbash"],
  "arguments": [
    { "name": "url", "required": true, "description": "Git repository URL (SSH or HTTPS)" },
    { "name": "directory", "required": false, "description": "Target directory name (defaults to repo name)" }
  ],
  "flags": []
}
```

## Files to Create or Modify
- `src/utils/clone/index.js` -- Full implementation with meta, repo name extraction, package manager detection, and clone logic
- `src/utils/registry.json` -- Add the clone entry to the utilities array

## Acceptance Criteria
- [ ] `dev util run clone git@github.com:user/repo.git` clones the repo into `./repo/`
- [ ] `dev util run clone https://github.com/user/repo.git` clones the repo into `./repo/`
- [ ] `dev util run clone git@github.com:user/repo.git my-project` clones into `./my-project/`
- [ ] After cloning a repo with `yarn.lock`, dependencies are installed with `yarn`
- [ ] After cloning a repo with `pnpm-lock.yaml`, dependencies are installed with `pnpm`
- [ ] After cloning a repo with `package-lock.json`, dependencies are installed with `npm`
- [ ] After cloning a repo with `package.json` but no lock file, defaults to `npm install`
- [ ] Cloning a non-JS project (no `package.json`) skips dependency installation
- [ ] If the target directory already exists, an error is shown
- [ ] If git is not installed, a clear error is shown
- [ ] If the detected package manager is not installed, a clear message tells the user what to install
- [ ] `dev util list` shows clone in the output
- [ ] `dev util show clone` shows the full metadata

## Testing

```bash
# Clone a public repo with HTTPS
dev util run clone https://github.com/expressjs/express.git /tmp/test-express
# Expected: Clones, detects npm, runs npm install

# Clone with SSH (requires SSH key)
dev util run clone git@github.com:expressjs/express.git /tmp/test-express-ssh
# Expected: Same behavior

# Clone into a custom directory name
dev util run clone https://github.com/expressjs/express.git /tmp/my-custom-name
# Expected: Directory is named my-custom-name

# Clone a repo that already exists
dev util run clone https://github.com/expressjs/express.git /tmp/test-express
# Expected: Error about directory already existing

# Clone without args
dev util run clone
# Expected: Usage message with examples

# Verify it appears in the list
dev util list
# Expected: clone shows up

# Clean up
rm -rf /tmp/test-express /tmp/test-express-ssh /tmp/my-custom-name
```

## Notes
- The lock file detection order is `yarn.lock`, `pnpm-lock.yaml`, `package-lock.json`. This matches what most developers expect. If a project has both `yarn.lock` and `package-lock.json` (which happens when someone accidentally ran npm in a yarn project), yarn takes priority because the yarn lock file was presumably the intentional one.
- The `spawnSync` call uses `stdio: 'inherit'` so that git's clone progress and any authentication prompts (like SSH passphrase) flow through to the user's terminal. Do not capture this output in a variable -- it needs to be interactive.
- The `shell: true` option on the install `spawnSync` call is needed for Windows, where npm/yarn/pnpm might be `.cmd` files rather than native executables. On Unix, `shell: true` is harmless.
- The utility cannot `cd` into the cloned directory for the user. That is a shell limitation -- a child process cannot change the parent's working directory. The utility prints a message telling the user to `cd` into the directory. This is the same limitation the legacy version had, and it is documented in `_rebuild/src/scripts/clone.js`.
- URL parsing does not validate that the URL is a valid git URL. If someone passes garbage, `git clone` will fail and the error will be shown. No need to duplicate git's validation logic.
