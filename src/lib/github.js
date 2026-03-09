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
 * If there are no changes, returns success without committing.
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

/**
 * Create a new GitHub gist.
 * Writes temp files to disk because gh gist create expects file paths.
 * Temp files are cleaned up even if the command fails.
 * @param {Object<string, string>} files - Object mapping filename to content
 * @param {string} [description] - Gist description
 * @param {boolean} [secret] - Whether the gist should be secret (default: true)
 * @returns {Promise<{ success: boolean, id: string|null, url: string|null, error: string|null }>}
 */
async function createGist(files, description = '', secret = true) {
  requireGh();

  const fs = require('fs');
  const path = require('path');
  const nodeOs = require('os');

  const tempDir = fs.mkdtempSync(path.join(nodeOs.tmpdir(), 'devutils-gist-'));
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
 * Uses gh api with a jq filter to extract file contents as structured JSON.
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
 * Updates each file sequentially using gh gist edit --add.
 * @param {string} id - The gist ID
 * @param {Object<string, string>} files - Object mapping filename to new content
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
async function updateGist(id, files) {
  requireGh();

  const fs = require('fs');
  const path = require('path');
  const nodeOs = require('os');

  const tempDir = fs.mkdtempSync(path.join(nodeOs.tmpdir(), 'devutils-gist-'));

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
 * Parses tab-separated output from gh gist list.
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
