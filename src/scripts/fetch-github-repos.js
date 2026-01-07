#!/usr/bin/env node

/**
 * fetch-github-repos - Clone all repositories from a GitHub organization
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   fetch-github-repos() {
 *     local org="$1"
 *     local dest_dir="$2"
 *     if [[ -z "$org" || -z "$dest_dir" ]]; then
 *       echo "Usage: fetch-github-repos <organization> <destination-folder>"
 *       return 1
 *     fi
 *     if ! command -v jq >/dev/null 2>&1; then
 *       echo "Error: 'jq' is required but not installed."
 *       return 1
 *     fi
 *     mkdir -p "$dest_dir"
 *     echo "Fetching repositories for organization '$org'..."
 *     local repos=$(curl -s "https://api.github.com/orgs/$org/repos?per_page=100" | jq -r '.[].ssh_url')
 *     if [[ -z "$repos" ]]; then
 *       echo "No repositories found or failed to fetch from GitHub."
 *       return 1
 *     fi
 *     for repo in $repos; do
 *       echo "Cloning $repo into $dest_dir..."
 *       git clone "$repo" "$dest_dir/$(basename -s .git "$repo")"
 *     done
 *     echo "All repositories have been cloned."
 *   }
 *
 * This script fetches the list of repositories from a GitHub organization
 * using the GitHub API and clones each one into a specified destination folder.
 * Unlike the original bash version, this uses Node.js native fetch() instead of
 * curl+jq, making it cross-platform without additional dependencies.
 *
 * @module scripts/fetch-github-repos
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to verify git is available before attempting to clone.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists, false otherwise
 */
function isCommandAvailable(cmd) {
  try {
    // Use 'which' on Unix-like systems, 'where' on Windows
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetches the list of repositories from a GitHub organization.
 *
 * Uses the GitHub API to get all public repositories for an organization.
 * The API returns up to 100 repositories per page. For organizations with
 * more than 100 repos, pagination would be needed (not implemented here
 * to match original behavior).
 *
 * @param {string} org - The GitHub organization name
 * @returns {Promise<Array<{name: string, ssh_url: string, clone_url: string}>>} Array of repo objects
 * @throws {Error} If the API request fails
 */
async function fetchRepositories(org) {
  // Use Node.js native fetch() - available in Node.js 18+
  // This replaces the original curl + jq approach
  const apiUrl = `https://api.github.com/orgs/${org}/repos?per_page=100`;

  const response = await fetch(apiUrl, {
    headers: {
      // GitHub recommends setting a User-Agent header
      'User-Agent': 'devutils-cli',
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Organization '${org}' not found on GitHub.`);
    }
    if (response.status === 403) {
      throw new Error(
        'GitHub API rate limit exceeded. ' +
        'Try again later or use a GitHub token for higher limits.'
      );
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  // Parse JSON response - this replaces the jq parsing in the original
  const repos = await response.json();

  if (!Array.isArray(repos)) {
    throw new Error('Unexpected response format from GitHub API.');
  }

  return repos;
}

/**
 * Clones a single repository into the destination directory.
 *
 * Uses git clone to download the repository. The repository is cloned
 * using the SSH URL by default (matching original behavior), but falls
 * back to HTTPS if SSH fails.
 *
 * @param {string} repoUrl - The SSH or HTTPS URL of the repository
 * @param {string} destPath - The full path where the repo should be cloned
 * @returns {boolean} True if clone succeeded, false otherwise
 */
function cloneRepository(repoUrl, destPath) {
  // Check if destination already exists (idempotency)
  if (fs.existsSync(destPath)) {
    console.log(`  Skipping: ${path.basename(destPath)} (already exists)`);
    return true;
  }

  try {
    // Use spawnSync for better output control
    const result = spawnSync('git', ['clone', repoUrl, destPath], {
      stdio: 'inherit',
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      console.error(`  Failed to clone: ${path.basename(destPath)}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`  Error cloning ${path.basename(destPath)}: ${error.message}`);
    return false;
  }
}

/**
 * Pure Node.js implementation for fetching and cloning GitHub organization repos.
 *
 * This function uses pure Node.js for:
 * - HTTP requests (native fetch())
 * - JSON parsing (JSON.parse via response.json())
 * - Directory creation (fs.mkdirSync)
 * - Path manipulation (path.join, path.basename)
 *
 * The only external command required is 'git' for cloning, which is
 * necessary because reimplementing git clone in Node.js would be
 * impractical and inferior to the native tool.
 *
 * @param {string[]} args - Command line arguments [org, destDir]
 * @returns {Promise<void>}
 */
async function do_fetch_github_repos_nodejs(args) {
  const org = args[0];
  const destDir = args[1];

  // Validate arguments
  if (!org || !destDir) {
    console.log('Usage: fetch-github-repos <organization> <destination-folder>');
    console.log('');
    console.log('Arguments:');
    console.log('  organization       The GitHub organization name');
    console.log('  destination-folder The folder where repos will be cloned');
    console.log('');
    console.log('Example:');
    console.log('  fetch-github-repos nodejs ./nodejs-repos');
    process.exit(1);
  }

  // Check if git is available (required for cloning)
  if (!isCommandAvailable('git')) {
    console.error('Error: git is required but not installed.');
    console.error('');
    console.error('Install git:');
    console.error('  macOS:   brew install git');
    console.error('  Ubuntu:  sudo apt install git');
    console.error('  Windows: https://git-scm.com/download/win');
    process.exit(1);
  }

  // Resolve the destination directory to an absolute path
  const absoluteDestDir = path.resolve(destDir);

  // Create destination directory if it doesn't exist (pure Node.js)
  // Using recursive: true makes this idempotent - it won't fail if dir exists
  if (!fs.existsSync(absoluteDestDir)) {
    fs.mkdirSync(absoluteDestDir, { recursive: true });
    console.log(`Created directory: ${absoluteDestDir}`);
  }

  console.log(`Fetching repositories for organization '${org}'...`);
  console.log('');

  // Fetch the list of repositories from GitHub API
  let repos;
  try {
    repos = await fetchRepositories(org);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  // Check if any repositories were found
  if (repos.length === 0) {
    console.log('No repositories found for this organization.');
    console.log('');
    console.log('This could mean:');
    console.log('  - The organization has no public repositories');
    console.log('  - The organization name is incorrect');
    console.log('  - Private repositories require authentication');
    return;
  }

  console.log(`Found ${repos.length} repositories.`);
  console.log('');

  // Clone each repository
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const repo of repos) {
    // Extract repository name from the SSH URL (e.g., "git@github.com:org/repo.git" -> "repo")
    const repoName = repo.name || path.basename(repo.ssh_url, '.git');
    const destPath = path.join(absoluteDestDir, repoName);

    // Check if already cloned (idempotency)
    if (fs.existsSync(destPath)) {
      console.log(`Skipping: ${repoName} (already exists)`);
      skipCount++;
      continue;
    }

    console.log(`Cloning: ${repoName}...`);

    // Try SSH URL first (original behavior), fall back to HTTPS
    const sshUrl = repo.ssh_url;
    const httpsUrl = repo.clone_url;

    let cloneSuccess = cloneRepository(sshUrl, destPath);

    // If SSH fails, try HTTPS
    if (!cloneSuccess && httpsUrl) {
      console.log(`  SSH clone failed, trying HTTPS...`);
      cloneSuccess = cloneRepository(httpsUrl, destPath);
    }

    if (cloneSuccess) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Print summary
  console.log('');
  console.log('--- Summary ---');
  console.log(`Successfully cloned: ${successCount}`);
  if (skipCount > 0) {
    console.log(`Already existed (skipped): ${skipCount}`);
  }
  if (failCount > 0) {
    console.log(`Failed to clone: ${failCount}`);
  }
  console.log(`Total repositories: ${repos.length}`);
  console.log(`Destination: ${absoluteDestDir}`);
}

/**
 * Clone all repositories from a GitHub organization on macOS.
 *
 * Uses the pure Node.js implementation since all required functionality
 * (HTTP requests, JSON parsing, file operations) works identically on macOS.
 * The only external dependency is git, which is required on all platforms.
 *
 * @param {string[]} args - Command line arguments [org, destDir]
 * @returns {Promise<void>}
 */
async function do_fetch_github_repos_macos(args) {
  // macOS can use the pure Node.js implementation
  return do_fetch_github_repos_nodejs(args);
}

/**
 * Clone all repositories from a GitHub organization on Ubuntu.
 *
 * Uses the pure Node.js implementation since all required functionality
 * (HTTP requests, JSON parsing, file operations) works identically on Ubuntu.
 * The only external dependency is git, which is required on all platforms.
 *
 * @param {string[]} args - Command line arguments [org, destDir]
 * @returns {Promise<void>}
 */
async function do_fetch_github_repos_ubuntu(args) {
  // Ubuntu can use the pure Node.js implementation
  return do_fetch_github_repos_nodejs(args);
}

/**
 * Clone all repositories from a GitHub organization on Raspberry Pi OS.
 *
 * Uses the pure Node.js implementation since all required functionality
 * (HTTP requests, JSON parsing, file operations) works identically on Raspbian.
 * The only external dependency is git, which is required on all platforms.
 *
 * @param {string[]} args - Command line arguments [org, destDir]
 * @returns {Promise<void>}
 */
async function do_fetch_github_repos_raspbian(args) {
  // Raspbian can use the pure Node.js implementation
  return do_fetch_github_repos_nodejs(args);
}

/**
 * Clone all repositories from a GitHub organization on Amazon Linux.
 *
 * Uses the pure Node.js implementation since all required functionality
 * (HTTP requests, JSON parsing, file operations) works identically on Amazon Linux.
 * The only external dependency is git, which is required on all platforms.
 *
 * @param {string[]} args - Command line arguments [org, destDir]
 * @returns {Promise<void>}
 */
async function do_fetch_github_repos_amazon_linux(args) {
  // Amazon Linux can use the pure Node.js implementation
  return do_fetch_github_repos_nodejs(args);
}

/**
 * Clone all repositories from a GitHub organization on Windows Command Prompt.
 *
 * Uses the pure Node.js implementation since all required functionality
 * (HTTP requests, JSON parsing, file operations) works identically on Windows.
 * The only external dependency is git, which must be installed and in PATH.
 *
 * @param {string[]} args - Command line arguments [org, destDir]
 * @returns {Promise<void>}
 */
async function do_fetch_github_repos_cmd(args) {
  // Windows CMD can use the pure Node.js implementation
  return do_fetch_github_repos_nodejs(args);
}

/**
 * Clone all repositories from a GitHub organization on Windows PowerShell.
 *
 * Uses the pure Node.js implementation since all required functionality
 * (HTTP requests, JSON parsing, file operations) works identically on Windows.
 * The only external dependency is git, which must be installed and in PATH.
 *
 * @param {string[]} args - Command line arguments [org, destDir]
 * @returns {Promise<void>}
 */
async function do_fetch_github_repos_powershell(args) {
  // Windows PowerShell can use the pure Node.js implementation
  return do_fetch_github_repos_nodejs(args);
}

/**
 * Clone all repositories from a GitHub organization on Git Bash.
 *
 * Uses the pure Node.js implementation since all required functionality
 * (HTTP requests, JSON parsing, file operations) works identically on Git Bash.
 * Git is guaranteed to be available since we're running in Git Bash.
 *
 * @param {string[]} args - Command line arguments [org, destDir]
 * @returns {Promise<void>}
 */
async function do_fetch_github_repos_gitbash(args) {
  // Git Bash can use the pure Node.js implementation
  // Bonus: git is guaranteed to be available in Git Bash
  return do_fetch_github_repos_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * This script clones all repositories from a GitHub organization into a
 * destination folder. It's useful for:
 * - Backing up all repos from an organization
 * - Setting up a development environment with multiple related repos
 * - Migrating repositories between systems
 *
 * The script is idempotent: running it multiple times will skip repos that
 * have already been cloned, making it safe to re-run to catch new repos.
 *
 * Unlike the original bash version that required curl and jq, this Node.js
 * implementation uses native fetch() and JSON.parse(), requiring only git
 * as an external dependency.
 *
 * @param {string[]} args - Command line arguments [org, destDir]
 * @returns {Promise<void>}
 */
async function do_fetch_github_repos(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_fetch_github_repos_macos,
    'ubuntu': do_fetch_github_repos_ubuntu,
    'debian': do_fetch_github_repos_ubuntu,
    'raspbian': do_fetch_github_repos_raspbian,
    'amazon_linux': do_fetch_github_repos_amazon_linux,
    'rhel': do_fetch_github_repos_amazon_linux,
    'fedora': do_fetch_github_repos_ubuntu,
    'linux': do_fetch_github_repos_ubuntu,
    'wsl': do_fetch_github_repos_ubuntu,
    'cmd': do_fetch_github_repos_cmd,
    'windows': do_fetch_github_repos_cmd,
    'powershell': do_fetch_github_repos_powershell,
    'gitbash': do_fetch_github_repos_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS');
    console.error('  - Ubuntu, Debian, and other Linux distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - Amazon Linux, RHEL, Fedora');
    console.error('  - Windows (CMD, PowerShell, Git Bash)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_fetch_github_repos,
  do_fetch_github_repos,
  do_fetch_github_repos_nodejs,
  do_fetch_github_repos_macos,
  do_fetch_github_repos_ubuntu,
  do_fetch_github_repos_raspbian,
  do_fetch_github_repos_amazon_linux,
  do_fetch_github_repos_cmd,
  do_fetch_github_repos_powershell,
  do_fetch_github_repos_gitbash
};

if (require.main === module) {
  do_fetch_github_repos(process.argv.slice(2));
}
