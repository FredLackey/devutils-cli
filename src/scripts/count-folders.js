#!/usr/bin/env node

/**
 * count-folders - Count only directories (not files) in the current or specified directory
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias count-folders="find . -mindepth 1 -maxdepth 1 -type d | wc -l"
 *
 * This script counts only directories in a directory, excluding regular files.
 * It reads the directory contents and filters for directories only, then prints the count.
 * Unlike the original shell alias, this uses pure Node.js for cross-platform support.
 *
 * @module scripts/count-folders
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');

/**
 * Pure Node.js implementation that works on any platform.
 * Counts the number of directories (not files) in the specified directory.
 *
 * This approach uses fs.readdirSync with the { withFileTypes: true } option,
 * which returns Dirent objects that include file type information. This is
 * more efficient than calling stat() on each entry individually.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Optional path to count (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_count_folders_nodejs(args) {
  // Get the target directory from arguments, defaulting to current directory
  const targetDir = args[0] || '.';

  // Resolve to absolute path for clearer error messages
  const absolutePath = path.resolve(targetDir);

  // Check if the path exists
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: Directory not found: ${absolutePath}`);
    process.exit(1);
  }

  // Check if the path is a directory
  const stats = fs.statSync(absolutePath);
  if (!stats.isDirectory()) {
    console.error(`Error: Not a directory: ${absolutePath}`);
    process.exit(1);
  }

  try {
    // Read directory contents with file type information included
    // The { withFileTypes: true } option returns Dirent objects instead of strings
    const entries = fs.readdirSync(absolutePath, { withFileTypes: true });

    // Filter for directories only (not files, symlinks to files, etc.)
    // dirent.isDirectory() returns true only for directories
    const folders = entries.filter(dirent => dirent.isDirectory());

    // Print the count (matching original alias output: just the number)
    console.log(folders.length);
  } catch (error) {
    // Handle permission errors or other filesystem issues
    console.error(`Error reading directory: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Count folders on macOS.
 * Uses the pure Node.js implementation since folder counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_folders_macos(args) {
  return do_count_folders_nodejs(args);
}

/**
 * Count folders on Ubuntu.
 * Uses the pure Node.js implementation since folder counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_folders_ubuntu(args) {
  return do_count_folders_nodejs(args);
}

/**
 * Count folders on Raspberry Pi OS.
 * Uses the pure Node.js implementation since folder counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_folders_raspbian(args) {
  return do_count_folders_nodejs(args);
}

/**
 * Count folders on Amazon Linux.
 * Uses the pure Node.js implementation since folder counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_folders_amazon_linux(args) {
  return do_count_folders_nodejs(args);
}

/**
 * Count folders in Windows Command Prompt.
 * Uses the pure Node.js implementation since folder counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_folders_cmd(args) {
  return do_count_folders_nodejs(args);
}

/**
 * Count folders in Windows PowerShell.
 * Uses the pure Node.js implementation since folder counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_folders_powershell(args) {
  return do_count_folders_nodejs(args);
}

/**
 * Count folders in Git Bash on Windows.
 * Uses the pure Node.js implementation since folder counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_folders_gitbash(args) {
  return do_count_folders_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Counts the number of directories (not files) in the current or specified
 * directory. This is useful for quickly checking how many subdirectories exist
 * in a folder without counting regular files.
 *
 * Usage:
 *   count-folders           # Count folders in current directory
 *   count-folders /path     # Count folders in specified directory
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_folders(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_count_folders_macos,
    'ubuntu': do_count_folders_ubuntu,
    'debian': do_count_folders_ubuntu,
    'raspbian': do_count_folders_raspbian,
    'amazon_linux': do_count_folders_amazon_linux,
    'rhel': do_count_folders_amazon_linux,
    'fedora': do_count_folders_ubuntu,
    'linux': do_count_folders_ubuntu,
    'wsl': do_count_folders_ubuntu,
    'cmd': do_count_folders_cmd,
    'windows': do_count_folders_cmd,
    'powershell': do_count_folders_powershell,
    'gitbash': do_count_folders_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_count_folders,
  do_count_folders,
  do_count_folders_nodejs,
  do_count_folders_macos,
  do_count_folders_ubuntu,
  do_count_folders_raspbian,
  do_count_folders_amazon_linux,
  do_count_folders_cmd,
  do_count_folders_powershell,
  do_count_folders_gitbash
};

if (require.main === module) {
  do_count_folders(process.argv.slice(2));
}
