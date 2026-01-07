#!/usr/bin/env node

/**
 * set-git-public - Set git user to the "public" identity from ~/.devutils
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   set-git-public(){
 *       git config user.email "fred.lackey@gmail.com"
 *       git config user.name "Fred Lackey"
 *   }
 *
 * This script configures the local git repository to use the "public" identity
 * stored in the ~/.devutils configuration file. It sets both user.name and
 * user.email in the local (repository-level) git configuration.
 *
 * Prerequisites:
 *   1. Must be run inside a git repository
 *   2. Must have a "public" identity configured in ~/.devutils
 *      (Use `dev identity add public --name "Your Name" --email "you@example.com"`)
 *
 * The script is idempotent - running it multiple times produces the same result.
 * It uses `git config` (without --global) to set repository-local configuration.
 *
 * @module scripts/set-git-public
 */

const os = require('../utils/common/os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Path to the devutils configuration file.
 * This file stores user identities and other settings.
 */
const HOME_DIR = process.env.HOME || process.env.USERPROFILE;
const CONFIG_FILE = path.join(HOME_DIR, '.devutils');

/**
 * Load the devutils configuration from ~/.devutils
 *
 * @returns {object|null} The parsed configuration object, or null if not found/invalid
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    // File doesn't exist or contains invalid JSON
  }
  return null;
}

/**
 * Check if the current directory is inside a git repository.
 * Works on all platforms using `git rev-parse`.
 *
 * @returns {boolean} True if inside a git repository, false otherwise
 */
function isGitRepository() {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      stdio: 'ignore',
      // Use shell: true on Windows to handle command properly
      shell: process.platform === 'win32'
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Set a local git configuration value.
 * Uses `git config` without --global to set repository-level config.
 *
 * @param {string} key - The git config key (e.g., "user.email")
 * @param {string} value - The value to set
 * @throws {Error} If the git config command fails
 */
function setGitConfig(key, value) {
  // Quote the value to handle special characters and spaces
  const quotedValue = `"${value.replace(/"/g, '\\"')}"`;
  execSync(`git config ${key} ${quotedValue}`, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
}

/**
 * Get the current value of a local git configuration.
 *
 * @param {string} key - The git config key to read
 * @returns {string|null} The current value, or null if not set
 */
function getGitConfig(key) {
  try {
    const result = execSync(`git config --get ${key}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      shell: process.platform === 'win32'
    });
    return result.trim();
  } catch {
    // Key not set or error reading
    return null;
  }
}

/**
 * Pure Node.js implementation for setting git public identity.
 *
 * This function contains the cross-platform logic that works on any platform.
 * It reads the "public" identity from ~/.devutils and applies it to the
 * local git repository configuration.
 *
 * The git commands are identical across all platforms, so all platform-specific
 * functions delegate to this implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_set_git_public_nodejs(args) {
  // Step 1: Check if we're inside a git repository
  if (!isGitRepository()) {
    console.error('Error: Not inside a git repository.');
    console.error('');
    console.error('Please navigate to a git repository and try again.');
    console.error('You can initialize a new repository with: git init');
    process.exit(1);
  }

  // Step 2: Load the devutils configuration
  const config = loadConfig();
  if (!config) {
    console.error('Error: No configuration file found at ~/.devutils');
    console.error('');
    console.error('Please run `dev configure` first to set up your profile,');
    console.error('then run `dev identity add public` to create a public identity.');
    process.exit(1);
  }

  // Step 3: Look for the "public" identity
  const identities = config.identities || {};
  const publicIdentity = identities['public'];

  if (!publicIdentity) {
    console.error('Error: No "public" identity found in ~/.devutils');
    console.error('');
    console.error('Available identities:', Object.keys(identities).join(', ') || '(none)');
    console.error('');
    console.error('To create a public identity, run:');
    console.error('  dev identity add public --name "Your Name" --email "you@example.com"');
    process.exit(1);
  }

  // Step 4: Validate the identity has required fields
  if (!publicIdentity.name || !publicIdentity.email) {
    console.error('Error: The "public" identity is missing required fields.');
    console.error('');
    console.error('Current values:');
    console.error(`  Name:  ${publicIdentity.name || '(not set)'}`);
    console.error(`  Email: ${publicIdentity.email || '(not set)'}`);
    console.error('');
    console.error('To update the public identity, run:');
    console.error('  dev identity add public --name "Your Name" --email "you@example.com" --force');
    process.exit(1);
  }

  // Step 5: Get current values to check if update is needed (for idempotency reporting)
  const currentName = getGitConfig('user.name');
  const currentEmail = getGitConfig('user.email');

  // Step 6: Set the git configuration values
  try {
    setGitConfig('user.name', publicIdentity.name);
    setGitConfig('user.email', publicIdentity.email);

    // Report what was done
    console.log('Git identity set to public:');
    console.log(`  user.name:  ${publicIdentity.name}`);
    console.log(`  user.email: ${publicIdentity.email}`);

    // Note if values changed
    if (currentName !== publicIdentity.name || currentEmail !== publicIdentity.email) {
      if (currentName || currentEmail) {
        console.log('');
        console.log('Previous values:');
        if (currentName) console.log(`  user.name:  ${currentName}`);
        if (currentEmail) console.log(`  user.email: ${currentEmail}`);
      }
    } else {
      console.log('');
      console.log('(values were already set to public identity)');
    }
  } catch (error) {
    console.error('Error: Failed to set git configuration.');
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Set git user to public identity on macOS.
 *
 * macOS uses the same git commands as other Unix-like systems.
 * This delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_set_git_public_macos(args) {
  return do_set_git_public_nodejs(args);
}

/**
 * Set git user to public identity on Ubuntu.
 *
 * Ubuntu uses the same git commands as other Unix-like systems.
 * This delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_set_git_public_ubuntu(args) {
  return do_set_git_public_nodejs(args);
}

/**
 * Set git user to public identity on Raspberry Pi OS.
 *
 * Raspberry Pi OS (Raspbian) uses the same git commands as other Debian-based systems.
 * This delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_set_git_public_raspbian(args) {
  return do_set_git_public_nodejs(args);
}

/**
 * Set git user to public identity on Amazon Linux.
 *
 * Amazon Linux uses the same git commands as other Linux systems.
 * This delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_set_git_public_amazon_linux(args) {
  return do_set_git_public_nodejs(args);
}

/**
 * Set git user to public identity on Windows Command Prompt.
 *
 * Windows uses the same git commands when git is installed.
 * The shell: true option in execSync handles Windows-specific command execution.
 * This delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_set_git_public_cmd(args) {
  return do_set_git_public_nodejs(args);
}

/**
 * Set git user to public identity on Windows PowerShell.
 *
 * PowerShell can execute git commands the same way as CMD.
 * This delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_set_git_public_powershell(args) {
  return do_set_git_public_nodejs(args);
}

/**
 * Set git user to public identity in Git Bash on Windows.
 *
 * Git Bash provides a Unix-like environment on Windows with git pre-installed.
 * This delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_set_git_public_gitbash(args) {
  return do_set_git_public_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "set-git-public" command configures the current git repository to use
 * the "public" identity from the ~/.devutils configuration file. This is useful
 * when working on open-source projects where you want to use your public
 * email address for commits.
 *
 * For example, you might have:
 *   - A "work" identity with your company email
 *   - A "public" identity with your personal/public email
 *
 * Use `set-git-public` when cloning or starting work on public repositories.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_set_git_public(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_set_git_public_macos,
    'ubuntu': do_set_git_public_ubuntu,
    'debian': do_set_git_public_ubuntu,
    'raspbian': do_set_git_public_raspbian,
    'amazon_linux': do_set_git_public_amazon_linux,
    'rhel': do_set_git_public_amazon_linux,
    'fedora': do_set_git_public_ubuntu,
    'linux': do_set_git_public_ubuntu,
    'wsl': do_set_git_public_ubuntu,
    'cmd': do_set_git_public_cmd,
    'windows': do_set_git_public_cmd,
    'powershell': do_set_git_public_powershell,
    'gitbash': do_set_git_public_gitbash
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
  main: do_set_git_public,
  do_set_git_public,
  do_set_git_public_nodejs,
  do_set_git_public_macos,
  do_set_git_public_ubuntu,
  do_set_git_public_raspbian,
  do_set_git_public_amazon_linux,
  do_set_git_public_cmd,
  do_set_git_public_powershell,
  do_set_git_public_gitbash
};

if (require.main === module) {
  do_set_git_public(process.argv.slice(2));
}
