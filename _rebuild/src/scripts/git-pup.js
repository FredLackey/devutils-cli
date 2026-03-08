#!/usr/bin/env node

/**
 * git-pup - Pull changes and update git submodules
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   git-pup(){
 *       git pull && git submodule init && git submodule update && git submodule status
 *   }
 *
 * This script performs a complete "pull and update" workflow for repositories
 * that use git submodules. It:
 * 1. Pulls the latest changes from the remote (git pull)
 * 2. Initializes any new submodules that were added (git submodule init)
 * 3. Updates all submodules to the committed versions (git submodule update)
 * 4. Shows the status of all submodules (git submodule status)
 *
 * This is useful when working with projects that have dependencies managed as
 * git submodules. Running "git pull" alone does not update submodules, so this
 * command ensures everything is in sync after pulling.
 *
 * @module scripts/git-pup
 */

const os = require('../utils/common/os');
const { execSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to verify git is installed before running git commands.
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
 * Helper function to check if the current directory is inside a git repository.
 * We use git's own detection mechanism rather than just looking for .git folder,
 * because the .git folder might be in a parent directory or be a gitdir file.
 *
 * @returns {boolean} True if inside a git repository, false otherwise
 */
function isInsideGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Pure Node.js implementation that uses git CLI commands.
 *
 * Since git is a native tool that provides:
 * - Battle-tested reliability for repository operations
 * - Consistent behavior across all platforms
 * - Complex functionality that would be error-prone to reimplement
 *
 * We use the git CLI rather than trying to reimplement git logic in Node.js.
 * Git works identically on macOS, Linux, and Windows, so all platform
 * functions delegate to this implementation.
 *
 * The function runs these commands in sequence:
 * 1. git pull - Fetches and merges changes from the remote
 * 2. git submodule init - Initializes local config for submodules
 * 3. git submodule update - Checks out the correct commit for each submodule
 * 4. git submodule status - Shows the current state of all submodules
 *
 * @param {string[]} args - Command line arguments (unused for this script)
 * @returns {Promise<void>}
 */
async function do_git_pup_nodejs(args) {
  // Step 1: Verify git is installed
  // Git is not part of Node.js, so we must check for it
  if (!isCommandAvailable('git')) {
    console.error('Error: git is required but not installed.');
    console.error('');
    console.error('Install git for your platform:');
    console.error('  macOS:   brew install git');
    console.error('  Ubuntu:  sudo apt install git');
    console.error('  Windows: Download from https://git-scm.com/download/win');
    process.exit(1);
  }

  // Step 2: Verify we're in a git repository
  // Running git commands outside a repo gives confusing errors
  if (!isInsideGitRepo()) {
    console.error('Error: Not in a git repository.');
    console.error('');
    console.error('This command must be run from inside a git repository.');
    console.error('Navigate to a git repository and try again.');
    process.exit(1);
  }

  // Step 3: Pull changes from the remote
  // This fetches and merges changes from the tracked remote branch
  console.log('Pulling latest changes...');
  try {
    execSync('git pull', { stdio: 'inherit' });
  } catch (error) {
    console.error('');
    console.error('Error: git pull failed.');
    console.error('Check the error message above for details.');
    process.exit(1);
  }

  // Step 4: Initialize any new submodules
  // This sets up the local config for submodules that were added upstream
  // If no new submodules, this is a no-op (idempotent)
  console.log('');
  console.log('Initializing submodules...');
  try {
    execSync('git submodule init', { stdio: 'inherit' });
  } catch (error) {
    console.error('');
    console.error('Error: git submodule init failed.');
    console.error('Check the error message above for details.');
    process.exit(1);
  }

  // Step 5: Update submodules to the committed versions
  // This checks out the specific commit that the parent repo expects
  console.log('');
  console.log('Updating submodules...');
  try {
    execSync('git submodule update', { stdio: 'inherit' });
  } catch (error) {
    console.error('');
    console.error('Error: git submodule update failed.');
    console.error('Check the error message above for details.');
    process.exit(1);
  }

  // Step 6: Show submodule status
  // This helps the user see what submodules exist and their current state
  console.log('');
  console.log('Submodule status:');
  try {
    execSync('git submodule status', { stdio: 'inherit' });
  } catch (error) {
    // Status failing is not critical - the main work is done
    console.error('Warning: Could not retrieve submodule status.');
  }

  console.log('');
  console.log('Done! Repository and submodules are up to date.');
}

/**
 * Pull and update git submodules on macOS.
 *
 * Git works identically on macOS as other platforms, so this function
 * delegates to the shared Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_git_pup_macos(args) {
  return do_git_pup_nodejs(args);
}

/**
 * Pull and update git submodules on Ubuntu.
 *
 * Git works identically on Ubuntu as other platforms, so this function
 * delegates to the shared Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_git_pup_ubuntu(args) {
  return do_git_pup_nodejs(args);
}

/**
 * Pull and update git submodules on Raspberry Pi OS.
 *
 * Git works identically on Raspberry Pi OS as other platforms, so this
 * function delegates to the shared Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_git_pup_raspbian(args) {
  return do_git_pup_nodejs(args);
}

/**
 * Pull and update git submodules on Amazon Linux.
 *
 * Git works identically on Amazon Linux as other platforms, so this
 * function delegates to the shared Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_git_pup_amazon_linux(args) {
  return do_git_pup_nodejs(args);
}

/**
 * Pull and update git submodules on Windows Command Prompt.
 *
 * Git works identically on Windows as other platforms (when git is installed),
 * so this function delegates to the shared Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_git_pup_cmd(args) {
  return do_git_pup_nodejs(args);
}

/**
 * Pull and update git submodules on Windows PowerShell.
 *
 * Git works identically on Windows as other platforms (when git is installed),
 * so this function delegates to the shared Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_git_pup_powershell(args) {
  return do_git_pup_nodejs(args);
}

/**
 * Pull and update git submodules in Git Bash.
 *
 * Git Bash comes with git built-in, so this command will always work.
 * This function delegates to the shared Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_git_pup_gitbash(args) {
  return do_git_pup_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "git-pup" (git Pull and UPdate) command is a convenience wrapper that
 * performs a complete pull and submodule update in one step. This is essential
 * for projects that use git submodules, because:
 *
 * 1. "git pull" alone does NOT update submodules
 * 2. After pulling, submodule references may point to new commits
 * 3. Running submodule init/update ensures your working tree matches the repo
 *
 * This command is idempotent - running it multiple times has no negative effects.
 * If there are no changes to pull or no submodules, it simply completes successfully.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_git_pup(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_git_pup_macos,
    'ubuntu': do_git_pup_ubuntu,
    'debian': do_git_pup_ubuntu,
    'raspbian': do_git_pup_raspbian,
    'amazon_linux': do_git_pup_amazon_linux,
    'rhel': do_git_pup_amazon_linux,
    'fedora': do_git_pup_ubuntu,
    'linux': do_git_pup_ubuntu,
    'wsl': do_git_pup_ubuntu,
    'cmd': do_git_pup_cmd,
    'windows': do_git_pup_cmd,
    'powershell': do_git_pup_powershell,
    'gitbash': do_git_pup_gitbash
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
  main: do_git_pup,
  do_git_pup,
  do_git_pup_nodejs,
  do_git_pup_macos,
  do_git_pup_ubuntu,
  do_git_pup_raspbian,
  do_git_pup_amazon_linux,
  do_git_pup_cmd,
  do_git_pup_powershell,
  do_git_pup_gitbash
};

if (require.main === module) {
  do_git_pup(process.argv.slice(2));
}
