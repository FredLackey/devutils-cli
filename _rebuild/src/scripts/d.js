#!/usr/bin/env node

/**
 * d - Navigate to the Desktop directory
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias d="cd ~/Desktop"
 *
 * This script outputs the path to the user's Desktop folder, which can be used
 * with shell integration (e.g., `cd $(d)`). The Desktop folder location varies
 * by operating system:
 * - macOS: ~/Desktop
 * - Linux: ~/Desktop (XDG standard)
 * - Windows: %USERPROFILE%\Desktop
 *
 * @module scripts/d
 */

const os = require('../utils/common/os');
const path = require('path');
const fs = require('fs');

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function determines the Desktop folder path using Node.js APIs.
 * The Desktop folder is typically in the user's home directory, but the
 * exact location can vary. We check for the folder's existence and provide
 * helpful feedback if it doesn't exist.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_d_nodejs(args) {
  // Get the user's home directory using Node.js built-in os module
  const homeDir = os.getHomeDir();

  // Construct the path to the Desktop folder
  // On all major platforms, the Desktop folder is named "Desktop" in the home directory
  const desktopPath = path.join(homeDir, 'Desktop');

  // Check if the Desktop folder exists
  if (!fs.existsSync(desktopPath)) {
    // The Desktop folder doesn't exist - this is unusual but can happen
    // on headless servers or minimal installations
    console.error(`Error: Desktop folder not found at ${desktopPath}`);
    console.error('');
    console.error('This might happen if:');
    console.error('  - You are on a headless server without a desktop environment');
    console.error('  - The Desktop folder was deleted or renamed');
    console.error('  - Your system uses a non-standard Desktop location');
    console.error('');
    console.error(`You can create it with: mkdir -p "${desktopPath}"`);
    process.exit(1);
  }

  // Output the path so it can be used with shell integration
  // Example usage: cd $(d)
  console.log(desktopPath);
}

/**
 * Navigate to the Desktop folder on macOS.
 *
 * On macOS, the Desktop folder is always at ~/Desktop.
 * This function delegates to the pure Node.js implementation since
 * the logic is identical across platforms.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_d_macos(args) {
  return do_d_nodejs(args);
}

/**
 * Navigate to the Desktop folder on Ubuntu.
 *
 * On Ubuntu and other Linux distributions following the XDG Base Directory
 * Specification, the Desktop folder is typically at ~/Desktop.
 * This function delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_d_ubuntu(args) {
  return do_d_nodejs(args);
}

/**
 * Navigate to the Desktop folder on Raspberry Pi OS.
 *
 * Raspberry Pi OS follows the same convention as other Debian-based systems.
 * The Desktop folder is at ~/Desktop.
 * This function delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_d_raspbian(args) {
  return do_d_nodejs(args);
}

/**
 * Navigate to the Desktop folder on Amazon Linux.
 *
 * On Amazon Linux (typically used in server environments), a Desktop folder
 * may not exist. This function delegates to the pure Node.js implementation,
 * which will provide helpful feedback if the folder doesn't exist.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_d_amazon_linux(args) {
  return do_d_nodejs(args);
}

/**
 * Navigate to the Desktop folder on Windows Command Prompt.
 *
 * On Windows, the Desktop folder is at %USERPROFILE%\Desktop.
 * Node.js's os.homedir() correctly returns the USERPROFILE path on Windows,
 * so the pure Node.js implementation works correctly.
 * This function delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_d_cmd(args) {
  return do_d_nodejs(args);
}

/**
 * Navigate to the Desktop folder on Windows PowerShell.
 *
 * On Windows, the Desktop folder is at %USERPROFILE%\Desktop.
 * This function delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_d_powershell(args) {
  return do_d_nodejs(args);
}

/**
 * Navigate to the Desktop folder on Git Bash (Windows).
 *
 * Git Bash runs on Windows, so the Desktop folder is at %USERPROFILE%\Desktop.
 * This function delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_d_gitbash(args) {
  return do_d_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "d" command outputs the path to the user's Desktop folder.
 * This is designed to be used with shell integration:
 *
 *   cd $(d)     # Change to Desktop folder
 *   ls $(d)     # List Desktop contents
 *   cp file $(d)  # Copy file to Desktop
 *
 * The original alias "cd ~/Desktop" directly changed directories, but since
 * Node.js scripts run in a subprocess, they cannot change the parent shell's
 * working directory. Instead, this script outputs the path for the shell to use.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_d(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_d_macos,
    'ubuntu': do_d_ubuntu,
    'debian': do_d_ubuntu,
    'raspbian': do_d_raspbian,
    'amazon_linux': do_d_amazon_linux,
    'rhel': do_d_amazon_linux,
    'fedora': do_d_ubuntu,
    'linux': do_d_ubuntu,
    'wsl': do_d_ubuntu,
    'cmd': do_d_cmd,
    'windows': do_d_cmd,
    'powershell': do_d_powershell,
    'gitbash': do_d_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_d,
  do_d,
  do_d_nodejs,
  do_d_macos,
  do_d_ubuntu,
  do_d_raspbian,
  do_d_amazon_linux,
  do_d_cmd,
  do_d_powershell,
  do_d_gitbash
};

if (require.main === module) {
  do_d(process.argv.slice(2));
}
