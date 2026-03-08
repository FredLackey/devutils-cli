#!/usr/bin/env node

/**
 * vpush - Commit and push using package.json version as the commit message
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   vpush() {
 *       # Ensure JQ is installed
 *       if ! cmd_exists "jq"; then
 *           printf "jq is required, please install it!\n"
 *           exit 1
 *       fi
 *
 *       pkg_ver=$(jq '.version' package.json)
 *       pkg_ver=${pkg_ver//\"/}
 *       git add -A
 *       git commit -a -S -m $pkg_ver
 *       git push origin master
 *   }
 *
 * This script reads the version from package.json, stages all changes,
 * commits with the version as the commit message, and pushes to the
 * current branch's remote. Unlike the original, this version:
 * - Uses native Node.js JSON parsing (no jq dependency required)
 * - Pushes to the current branch instead of hardcoding 'master'
 * - Optionally supports GPG signing via --sign flag
 *
 * @module scripts/vpush
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to verify git is installed before proceeding.
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
 * Execute a git command and return stdout as a string.
 * Trims whitespace from the output for cleaner processing.
 *
 * @param {string} command - The git command to execute (without 'git' prefix)
 * @param {boolean} [ignoreErrors=false] - Whether to suppress error output
 * @returns {string} The command output, trimmed of whitespace
 * @throws {Error} If the command fails and ignoreErrors is false
 */
function gitCommand(command, ignoreErrors = false) {
  try {
    const output = execSync(`git ${command}`, {
      encoding: 'utf8',
      stdio: ignoreErrors ? ['pipe', 'pipe', 'ignore'] : ['pipe', 'pipe', 'pipe']
    });
    return output.trim();
  } catch (error) {
    if (ignoreErrors) {
      return '';
    }
    throw error;
  }
}

/**
 * Check if the current directory is inside a git repository.
 * Uses 'git rev-parse --is-inside-work-tree' which returns 'true' if inside a repo.
 *
 * @returns {boolean} True if inside a git repository, false otherwise
 */
function isInsideGitRepo() {
  try {
    const result = gitCommand('rev-parse --is-inside-work-tree', true);
    return result === 'true';
  } catch {
    return false;
  }
}

/**
 * Check if there are any changes in the repository.
 * Uses 'git status --porcelain' which outputs nothing if there are no changes.
 *
 * @returns {boolean} True if there are staged, unstaged, or untracked changes
 */
function hasChanges() {
  try {
    const status = gitCommand('status --porcelain', true);
    return status.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get the current git branch name.
 * Uses 'git symbolic-ref --short HEAD' to get the branch name without full ref path.
 *
 * @returns {string|null} The current branch name, or null if not on a branch (detached HEAD)
 */
function getCurrentBranch() {
  try {
    const branch = gitCommand('symbolic-ref --short HEAD', true);
    return branch || null;
  } catch {
    return null;
  }
}

/**
 * Read and parse package.json from the current working directory.
 * Returns the parsed JSON object or null if the file doesn't exist or is invalid.
 *
 * This function uses pure Node.js (fs and JSON.parse) instead of requiring
 * external tools like jq, making it work on any platform with Node.js installed.
 *
 * @returns {{ version: string } | null} The parsed package.json object, or null on error
 */
function readPackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  // Check if package.json exists in the current directory
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    // Read and parse the file using Node.js native capabilities
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(content);
    return packageJson;
  } catch (error) {
    // File exists but couldn't be read or parsed
    return null;
  }
}

/**
 * Pure Node.js implementation for vpush.
 *
 * This function reads the version from package.json using native Node.js
 * (no external dependencies like jq), then stages all changes, commits
 * with the version as the message, and pushes to the current branch.
 *
 * The workflow is:
 * 1. Verify git is installed
 * 2. Verify we're in a git repository
 * 3. Read and validate package.json exists and has a version field
 * 4. Check for changes (skip if nothing to commit)
 * 5. Get current branch name
 * 6. Stage all changes (git add -A)
 * 7. Commit with the version as the message
 * 8. Push to origin on the current branch
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional '--sign' or '-S' flag to enable GPG signing
 * @returns {Promise<void>}
 */
async function do_vpush_nodejs(args) {
  // Parse arguments for optional flags
  const useSign = args.includes('--sign') || args.includes('-S');

  // Check if git is installed
  if (!isCommandAvailable('git')) {
    console.error('Error: git is required but not installed.');
    console.error('');
    console.error('Install git:');
    console.error('  macOS:   brew install git');
    console.error('  Ubuntu:  sudo apt install git');
    console.error('  Windows: winget install Git.Git');
    process.exit(1);
  }

  // Check if we're in a git repository
  if (!isInsideGitRepo()) {
    console.error('Error: Not in a git repository');
    process.exit(1);
  }

  // Read package.json from the current directory
  // This uses native Node.js fs and JSON.parse - no jq needed!
  const packageJson = readPackageJson();

  if (!packageJson) {
    console.error('Error: package.json not found in current directory');
    console.error('');
    console.error('This command must be run from a Node.js project directory');
    console.error('containing a valid package.json file.');
    process.exit(1);
  }

  // Validate that package.json has a version field
  const version = packageJson.version;

  if (!version) {
    console.error('Error: package.json does not contain a "version" field');
    console.error('');
    console.error('Add a version to your package.json:');
    console.error('  {');
    console.error('    "name": "your-package",');
    console.error('    "version": "1.0.0",');
    console.error('    ...');
    console.error('  }');
    process.exit(1);
  }

  // Validate version format (should be a non-empty string)
  if (typeof version !== 'string' || version.trim() === '') {
    console.error('Error: package.json "version" field is empty or invalid');
    process.exit(1);
  }

  // Check for any changes (staged, unstaged, or untracked files)
  if (!hasChanges()) {
    console.log('No changes detected in repository');
    return;
  }

  // Get current branch name
  const currentBranch = getCurrentBranch();
  if (!currentBranch) {
    console.error('Error: Could not determine current branch');
    console.error('You may be in a detached HEAD state.');
    console.error('Checkout a branch first: git checkout <branch-name>');
    process.exit(1);
  }

  // Proceed with add, commit, and push
  console.log(`Committing with version: ${version}`);
  if (useSign) {
    console.log('GPG signing enabled');
  }

  try {
    // Stage all changes (including new files, modifications, and deletions)
    console.log('Staging all changes...');
    execSync('git add -A', { stdio: 'inherit' });

    // Commit with the version as the message
    // The original used -a -S, but -a is redundant after git add -A
    // We support optional GPG signing via --sign flag
    const signFlag = useSign ? '-S ' : '';
    console.log(`Committing...`);
    execSync(`git commit ${signFlag}-m "${version}"`, { stdio: 'inherit' });

    // Push to origin on the current branch
    console.log(`Pushing to origin/${currentBranch}...`);
    execSync(`git push origin "${currentBranch}"`, { stdio: 'inherit' });

    console.log('Done!');
  } catch (error) {
    // Git commands will output their own error messages to stderr
    // Just exit with an error code
    process.exit(1);
  }
}

/**
 * Commit and push with package version on macOS.
 *
 * Git and Node.js file operations work identically on macOS as on other
 * platforms, so this function simply delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_vpush_macos(args) {
  return do_vpush_nodejs(args);
}

/**
 * Commit and push with package version on Ubuntu.
 *
 * Git and Node.js file operations work identically on Ubuntu as on other
 * platforms, so this function simply delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_vpush_ubuntu(args) {
  return do_vpush_nodejs(args);
}

/**
 * Commit and push with package version on Raspberry Pi OS.
 *
 * Git and Node.js file operations work identically on Raspberry Pi OS as on
 * other platforms, so this function simply delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_vpush_raspbian(args) {
  return do_vpush_nodejs(args);
}

/**
 * Commit and push with package version on Amazon Linux.
 *
 * Git and Node.js file operations work identically on Amazon Linux as on
 * other platforms, so this function simply delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_vpush_amazon_linux(args) {
  return do_vpush_nodejs(args);
}

/**
 * Commit and push with package version in Windows Command Prompt.
 *
 * Git and Node.js file operations work identically on Windows as on other
 * platforms when installed via Git for Windows, winget, or Chocolatey.
 * This function simply delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_vpush_cmd(args) {
  return do_vpush_nodejs(args);
}

/**
 * Commit and push with package version in Windows PowerShell.
 *
 * Git and Node.js file operations work identically in PowerShell as in
 * other shells, so this function simply delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_vpush_powershell(args) {
  return do_vpush_nodejs(args);
}

/**
 * Commit and push with package version in Git Bash on Windows.
 *
 * Git Bash is the native environment for Git on Windows, so git commands
 * work identically to other platforms. This function simply delegates
 * to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_vpush_gitbash(args) {
  return do_vpush_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "vpush" command provides a convenient way to commit and push a
 * Node.js package using its version number as the commit message.
 * This is especially useful when releasing new versions, ensuring the
 * commit message matches the package version.
 *
 * Unlike the original bash version, this implementation:
 * - Uses native Node.js to read package.json (no jq dependency)
 * - Pushes to the current branch instead of hardcoding 'master'
 * - Supports optional GPG signing via --sign or -S flag
 *
 * Usage:
 *   vpush           # Commit with version, no GPG signing
 *   vpush --sign    # Commit with version, GPG signing enabled
 *   vpush -S        # Same as --sign
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_vpush(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_vpush_macos,
    'ubuntu': do_vpush_ubuntu,
    'debian': do_vpush_ubuntu,
    'raspbian': do_vpush_raspbian,
    'amazon_linux': do_vpush_amazon_linux,
    'rhel': do_vpush_amazon_linux,
    'fedora': do_vpush_ubuntu,
    'linux': do_vpush_ubuntu,
    'wsl': do_vpush_ubuntu,
    'cmd': do_vpush_cmd,
    'windows': do_vpush_cmd,
    'powershell': do_vpush_powershell,
    'gitbash': do_vpush_gitbash
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
    console.error('  - WSL (Windows Subsystem for Linux)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_vpush,
  do_vpush,
  do_vpush_nodejs,
  do_vpush_macos,
  do_vpush_ubuntu,
  do_vpush_raspbian,
  do_vpush_amazon_linux,
  do_vpush_cmd,
  do_vpush_powershell,
  do_vpush_gitbash
};

if (require.main === module) {
  do_vpush(process.argv.slice(2));
}
