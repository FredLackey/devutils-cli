#!/usr/bin/env node

/**
 * git-push - Add, commit, and push in one command
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   git-push() {
 *       local usage="git-push \"commit message\""
 *       local message="$1"
 *       local current_branch
 *       local has_changes
 *
 *       if [ -z "$message" ]; then
 *           echo "Error: Commit message is required"
 *           echo "Usage: $usage"
 *           return 1
 *       fi
 *
 *       if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
 *           echo "Error: Not in a git repository"
 *           return 1
 *       fi
 *
 *       has_changes=$(git status --porcelain)
 *       if [ -z "$has_changes" ]; then
 *           echo "No changes detected in repository"
 *           return 0
 *       fi
 *
 *       current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)
 *       if [ -z "$current_branch" ]; then
 *           echo "Error: Could not determine current branch"
 *           return 1
 *       fi
 *
 *       echo "Changes detected, proceeding with commit and push..."
 *       git add -A && \
 *       git commit -m "$message" && \
 *       git push origin "$current_branch"
 *   }
 *
 * This script stages all changes, commits them with the provided message,
 * and pushes to the current branch's remote. It provides a convenient
 * one-liner for the common "add, commit, push" workflow.
 *
 * @module scripts/git-push
 */

const os = require('../utils/common/os');
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
 * Pure Node.js implementation for git-push.
 *
 * This function uses git commands which are available on all platforms.
 * Git is a cross-platform tool, so the same commands work identically
 * on macOS, Linux, and Windows.
 *
 * The workflow is:
 * 1. Validate commit message is provided
 * 2. Verify we're in a git repository
 * 3. Check for changes (skip if nothing to commit)
 * 4. Get current branch name
 * 5. Stage all changes (git add -A)
 * 6. Commit with the provided message
 * 7. Push to origin on the current branch
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args.0 - The commit message (required)
 * @returns {Promise<void>}
 */
async function do_git_push_nodejs(args) {
  const usage = 'git-push "commit message"';

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

  // Get commit message from arguments
  // Join all arguments to support messages without quotes
  const message = args.join(' ').trim();

  // Validate commit message is provided
  if (!message) {
    console.error('Error: Commit message is required');
    console.error(`Usage: ${usage}`);
    process.exit(1);
  }

  // Check if we're in a git repository
  if (!isInsideGitRepo()) {
    console.error('Error: Not in a git repository');
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
  console.log('Changes detected, proceeding with commit and push...');

  try {
    // Stage all changes (including new files, modifications, and deletions)
    console.log('Staging all changes...');
    execSync('git add -A', { stdio: 'inherit' });

    // Commit with the provided message
    console.log(`Committing with message: "${message}"`);
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });

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
 * Add, commit, and push on macOS.
 *
 * Git works identically on macOS as on other platforms, so this function
 * simply delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_push_macos(args) {
  return do_git_push_nodejs(args);
}

/**
 * Add, commit, and push on Ubuntu.
 *
 * Git works identically on Ubuntu as on other platforms, so this function
 * simply delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_push_ubuntu(args) {
  return do_git_push_nodejs(args);
}

/**
 * Add, commit, and push on Raspberry Pi OS.
 *
 * Git works identically on Raspberry Pi OS as on other platforms, so this
 * function simply delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_push_raspbian(args) {
  return do_git_push_nodejs(args);
}

/**
 * Add, commit, and push on Amazon Linux.
 *
 * Git works identically on Amazon Linux as on other platforms, so this
 * function simply delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_push_amazon_linux(args) {
  return do_git_push_nodejs(args);
}

/**
 * Add, commit, and push in Windows Command Prompt.
 *
 * Git works identically on Windows as on other platforms when installed
 * via Git for Windows, winget, or Chocolatey. This function simply
 * delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_push_cmd(args) {
  return do_git_push_nodejs(args);
}

/**
 * Add, commit, and push in Windows PowerShell.
 *
 * Git works identically in PowerShell as in other shells, so this function
 * simply delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_push_powershell(args) {
  return do_git_push_nodejs(args);
}

/**
 * Add, commit, and push in Git Bash on Windows.
 *
 * Git Bash is the native environment for Git on Windows, so git commands
 * work identically to other platforms. This function simply delegates
 * to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_push_gitbash(args) {
  return do_git_push_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "git-push" command provides a convenient one-liner for the common
 * developer workflow of adding all changes, committing with a message,
 * and pushing to the remote repository.
 *
 * This is especially useful for:
 * - Quick commits during active development
 * - Saving work at the end of a coding session
 * - Simple single-change commits
 *
 * For more complex git workflows (multiple commits, selective staging,
 * rebasing, etc.), use the standard git commands directly.
 *
 * Usage:
 *   git-push "Your commit message here"
 *   git-push Fix typo in README
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_push(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_git_push_macos,
    'ubuntu': do_git_push_ubuntu,
    'debian': do_git_push_ubuntu,
    'raspbian': do_git_push_raspbian,
    'amazon_linux': do_git_push_amazon_linux,
    'rhel': do_git_push_amazon_linux,
    'fedora': do_git_push_ubuntu,
    'linux': do_git_push_ubuntu,
    'wsl': do_git_push_ubuntu,
    'cmd': do_git_push_cmd,
    'windows': do_git_push_cmd,
    'powershell': do_git_push_powershell,
    'gitbash': do_git_push_gitbash
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
  main: do_git_push,
  do_git_push,
  do_git_push_nodejs,
  do_git_push_macos,
  do_git_push_ubuntu,
  do_git_push_raspbian,
  do_git_push_amazon_linux,
  do_git_push_cmd,
  do_git_push_powershell,
  do_git_push_gitbash
};

if (require.main === module) {
  do_git_push(process.argv.slice(2));
}
