# Story 001: GitHub Helpers

## Goal
Implement `src/lib/github.js`, a thin wrapper around the GitHub CLI (`gh`). This module provides a clean JavaScript API for common GitHub operations: checking authentication, creating and managing repos, creating and managing gists, and cloning/pushing repos. Every function shells out to `gh` through `lib/shell.js` rather than calling the GitHub REST API directly. This keeps things simple (no OAuth token management, no HTTP client) and reuses the authentication that the user already has set up in `gh`. The config backup and import system depends on this module.

## Prerequisites
- 001-foundation/002 (shell utilities -- `shell.exec`, `shell.execSync`, `shell.commandExists` must be working)

## Background
The `gh` CLI is GitHub's official command-line tool. Most developers who use GitHub already have it installed and authenticated. By wrapping `gh` instead of calling the GitHub API directly, DevUtils avoids storing GitHub tokens, handling OAuth flows, or adding an HTTP client dependency. The user authenticates once with `gh auth login`, and every `gh` command after that uses the stored credentials.

DevUtils uses GitHub for config backup in two ways: private repos (for users who want version history and true privacy) and secret gists (for users who want something lightweight). Both are accessed through `gh` commands.

The functions in this module are used by `dev config export`, `dev config import`, and the initial backup setup flow in `dev config init`. They are also available to other parts of the codebase that need to interact with GitHub.

Reference: `research/proposed/proposed-package-structure.md` lines 410-412 for the github.js description. `research/proposed/config-backup-sync.md` lines 142-163 for how the backup system uses repos and gists.

## Technique

### Step 1: Check that `gh` is installed

Every function in this module needs `gh` to be available. Create a shared check function that runs before any `gh` command:

```javascript
'use strict';

const shell = require('./shell');

/**
 * Check if the GitHub CLI (gh) is installed on the system.
 * @returns {boolean} True if gh is available on PATH
 */
function isInstalled() {
  return shell.commandExists('gh');
}

/**
 * Throw a clear error if gh is not installed.
 * Call this at the top of any function that needs gh.
 */
function requireGh() {
  if (!isInstalled()) {
    throw new Error(
      'GitHub CLI (gh) is not installed.\n' +
      'Install it from: https://cli.github.com/\n' +
      'Or with Homebrew: brew install gh'
    );
  }
}
```

### Step 2: Implement authentication check

```javascript
/**
 * Check if the user is authenticated with GitHub via gh.
 * @returns {Promise<boolean>} True if authenticated
 */
async function isAuthenticated() {
  requireGh();
  const result = await shell.exec('gh auth status');
  return result.exitCode === 0;
}

/**
 * Get the authenticated username.
 * @returns {Promise<string|null>} The GitHub username, or null if not authenticated
 */
async function getUsername() {
  requireGh();
  const result = await shell.exec('gh api user --jq .login');
  if (result.exitCode !== 0) return null;
  return result.stdout.trim() || null;
}
```

### Step 3: Implement repo operations

```javascript
/**
 * Create a new GitHub repository.
 * @param {string} name - Repository name
 * @param {boolean} isPrivate - Whether the repo should be private
 * @returns {Promise<{ success: boolean, url: string|null, error: string|null }>}
 */
async function createRepo(name, isPrivate = true) {
  requireGh();
  const visibility = isPrivate ? '--private' : '--public';
  const result = await shell.exec(`gh repo create "${name}" ${visibility} --yes`);

  if (result.exitCode !== 0) {
    return { success: false, url: null, error: result.stderr };
  }

  // gh repo create outputs the repo URL
  return { success: true, url: result.stdout.trim(), error: null };
}

/**
 * Clone a GitHub repository to a local directory.
 * @param {string} url - Repository URL or owner/name
 * @param {string} dest - Local destination directory
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
async function cloneRepo(url, dest) {
  requireGh();
  const result = await shell.exec(`gh repo clone "${url}" "${dest}"`);

  if (result.exitCode !== 0) {
    return { success: false, error: result.stderr };
  }

  return { success: true, error: null };
}

/**
 * Push local changes to the remote repository.
 * Runs git add, commit, and push inside the given directory.
 * @param {string} dest - Local repository directory
 * @param {string} [message] - Commit message (defaults to 'DevUtils config update')
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
async function pushRepo(dest, message = 'DevUtils config update') {
  const escapedMessage = message.replace(/"/g, '\\"');

  // Stage all changes
  let result = await shell.exec('git add -A', { cwd: dest });
  if (result.exitCode !== 0) {
    return { success: false, error: 'git add failed: ' + result.stderr };
  }

  // Check if there is anything to commit
  const status = await shell.exec('git status --porcelain', { cwd: dest });
  if (!status.stdout.trim()) {
    // Nothing to commit -- still a success, just nothing changed
    return { success: true, error: null };
  }

  // Commit
  result = await shell.exec(`git commit -m "${escapedMessage}"`, { cwd: dest });
  if (result.exitCode !== 0) {
    return { success: false, error: 'git commit failed: ' + result.stderr };
  }

  // Push
  result = await shell.exec('git push', { cwd: dest });
  if (result.exitCode !== 0) {
    return { success: false, error: 'git push failed: ' + result.stderr };
  }

  return { success: true, error: null };
}

/**
 * Pull the latest changes from the remote repository.
 * @param {string} dest - Local repository directory
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
async function pullRepo(dest) {
  const result = await shell.exec('git pull', { cwd: dest });

  if (result.exitCode !== 0) {
    return { success: false, error: result.stderr };
  }

  return { success: true, error: null };
}

/**
 * List the authenticated user's repositories.
 * @param {number} [limit] - Maximum number of repos to return (default: 100)
 * @returns {Promise<Array<{ name: string, url: string, private: boolean }>>}
 */
async function listRepos(limit = 100) {
  requireGh();
  const result = await shell.exec(
    `gh repo list --json name,url,isPrivate --limit ${limit}`
  );

  if (result.exitCode !== 0) return [];

  try {
    const repos = JSON.parse(result.stdout);
    return repos.map(r => ({
      name: r.name,
      url: r.url,
      private: r.isPrivate
    }));
  } catch {
    return [];
  }
}
```

### Step 4: Implement gist operations

```javascript
/**
 * Create a new GitHub gist.
 * @param {Object<string, string>} files - Object mapping filename to content
 * @param {string} [description] - Gist description
 * @param {boolean} [secret] - Whether the gist should be secret (default: true)
 * @returns {Promise<{ success: boolean, id: string|null, url: string|null, error: string|null }>}
 */
async function createGist(files, description = '', secret = true) {
  requireGh();

  // gh gist create needs files on disk, so write temp files
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devutils-gist-'));
  const tempFiles = [];

  try {
    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, content);
      tempFiles.push(filePath);
    }

    const secretFlag = secret ? '' : '--public';
    const descFlag = description ? `--desc "${description.replace(/"/g, '\\"')}"` : '';
    const fileArgs = tempFiles.map(f => `"${f}"`).join(' ');

    const result = await shell.exec(
      `gh gist create ${fileArgs} ${secretFlag} ${descFlag}`
    );

    if (result.exitCode !== 0) {
      return { success: false, id: null, url: null, error: result.stderr };
    }

    // gh gist create outputs the gist URL
    const url = result.stdout.trim();
    // Extract the gist ID from the URL (last path segment)
    const id = url.split('/').pop();

    return { success: true, id, url, error: null };
  } finally {
    // Clean up temp files
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Get the contents of a gist by ID.
 * @param {string} id - The gist ID
 * @returns {Promise<{ success: boolean, files: Object<string, string>|null, error: string|null }>}
 */
async function getGist(id) {
  requireGh();
  const result = await shell.exec(
    `gh api gists/${id} --jq '.files | to_entries | map({key: .key, value: .value.content}) | from_entries'`
  );

  if (result.exitCode !== 0) {
    return { success: false, files: null, error: result.stderr };
  }

  try {
    const files = JSON.parse(result.stdout);
    return { success: true, files, error: null };
  } catch {
    return { success: false, files: null, error: 'Failed to parse gist content' };
  }
}

/**
 * Update an existing gist with new file contents.
 * @param {string} id - The gist ID
 * @param {Object<string, string>} files - Object mapping filename to new content
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
async function updateGist(id, files) {
  requireGh();

  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devutils-gist-'));

  try {
    // Write each file to disk and update via gh gist edit
    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, content);

      const result = await shell.exec(
        `gh gist edit ${id} --add "${filePath}"`
      );

      if (result.exitCode !== 0) {
        return { success: false, error: `Failed to update ${filename}: ${result.stderr}` };
      }
    }

    return { success: true, error: null };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * List the authenticated user's gists.
 * @param {number} [limit] - Maximum number of gists to return (default: 30)
 * @returns {Promise<Array<{ id: string, description: string, public: boolean, files: string[] }>>}
 */
async function listGists(limit = 30) {
  requireGh();
  const result = await shell.exec(
    `gh gist list --limit ${limit}`
  );

  if (result.exitCode !== 0) return [];

  // gh gist list outputs a tab-separated table
  // Columns: ID, Description, Files, Visibility, Updated
  const lines = result.stdout.split('\n').filter(Boolean);
  return lines.map(line => {
    const parts = line.split('\t');
    return {
      id: parts[0] || '',
      description: parts[1] || '',
      public: (parts[3] || '').trim() === 'public',
      files: (parts[2] || '').split(',').map(f => f.trim()).filter(Boolean)
    };
  });
}
```

### Step 5: Export everything

```javascript
module.exports = {
  isInstalled,
  isAuthenticated,
  getUsername,
  createRepo,
  cloneRepo,
  pushRepo,
  pullRepo,
  listRepos,
  createGist,
  getGist,
  updateGist,
  listGists
};
```

## Files to Create or Modify
- `src/lib/github.js` -- Replace the stub with the full implementation of all GitHub helper functions

## Acceptance Criteria
- [ ] `isInstalled()` returns `true` when `gh` is on the PATH, `false` otherwise
- [ ] `isAuthenticated()` returns `true` when `gh auth status` succeeds
- [ ] `getUsername()` returns the authenticated GitHub username
- [ ] `createRepo(name, true)` creates a private GitHub repo via `gh`
- [ ] `cloneRepo(url, dest)` clones a repo into the specified directory
- [ ] `pushRepo(dest)` stages, commits, and pushes changes in the given directory
- [ ] `pushRepo(dest)` succeeds without error when there are no changes to commit
- [ ] `pullRepo(dest)` pulls the latest changes into the given directory
- [ ] `listRepos()` returns an array of repo objects with name, url, and private fields
- [ ] `createGist(files, description, true)` creates a secret gist and returns its ID and URL
- [ ] `getGist(id)` retrieves the file contents of a gist
- [ ] `updateGist(id, files)` updates existing gist files
- [ ] `listGists()` returns an array of gist objects with id, description, and public fields
- [ ] Every function throws a clear error when `gh` is not installed
- [ ] No function ever rejects with an unhandled error -- failures are returned as structured results
- [ ] Temporary files created for gist operations are cleaned up even if the operation fails

## Testing

```bash
# Test gh installation check
node -e "const gh = require('./src/lib/github'); console.log(gh.isInstalled())"
# Expected: true (if gh is installed)

# Test authentication check
node -e "const gh = require('./src/lib/github'); gh.isAuthenticated().then(console.log)"
# Expected: true (if authenticated)

# Test username
node -e "const gh = require('./src/lib/github'); gh.getUsername().then(console.log)"
# Expected: Your GitHub username

# Test repo listing
node -e "const gh = require('./src/lib/github'); gh.listRepos(5).then(r => console.log(JSON.stringify(r, null, 2)))"
# Expected: Array of up to 5 repo objects

# Test gist listing
node -e "const gh = require('./src/lib/github'); gh.listGists(5).then(r => console.log(JSON.stringify(r, null, 2)))"
# Expected: Array of up to 5 gist objects

# Test creating and reading a gist (creates a real gist -- clean up after)
node -e "
const gh = require('./src/lib/github');
(async () => {
  const result = await gh.createGist(
    { 'test.txt': 'hello from devutils' },
    'DevUtils test gist',
    true
  );
  console.log('Created:', result);
  if (result.success) {
    const read = await gh.getGist(result.id);
    console.log('Read:', read);
  }
})();
"
# Expected: Creates a gist, reads it back, shows content

# Test error when gh is not installed (simulate by using a bad PATH)
node -e "
const shell = require('./src/lib/shell');
const orig = shell.commandExists;
shell.commandExists = () => false;
const gh = require('./src/lib/github');
try { gh.isInstalled(); } catch(e) { console.log(e.message); }
shell.commandExists = orig;
"
# Expected: Error message about gh not being installed
```

## Notes
- Every function uses `shell.exec` (the async version) because `gh` commands can take a few seconds, especially for network operations. Do not use `shell.execSync` for these -- it would block the Node.js event loop.
- The `pushRepo` function checks for changes before committing. If there are no changes (the working tree is clean), it returns success without error. This makes the function idempotent -- calling it multiple times when nothing has changed is harmless.
- The `createGist` function writes files to a temp directory because `gh gist create` expects file paths as arguments, not piped content. The `finally` block ensures cleanup happens even if the `gh` command fails.
- The `getGist` function uses `gh api` with a `--jq` filter to extract file contents directly. This is more reliable than `gh gist view` because the output format is structured JSON rather than rendered text.
- The `updateGist` function uses `gh gist edit --add` for each file. This is sequential, which is fine for the small number of config files DevUtils manages (typically 3-4 files). If performance becomes a concern, the files could be batched.
- The `listGists` function parses tab-separated output from `gh gist list`. This format is not documented and could change in future `gh` versions. If it breaks, switch to `gh api gists --jq` for structured JSON output instead.
- The `requireGh` function throws synchronously. Callers that want to handle a missing `gh` gracefully should use `isInstalled()` first rather than wrapping every call in try/catch.
- The `--yes` flag on `gh repo create` is important. Without it, `gh` prompts interactively for confirmation, which does not work in automated scripts.
