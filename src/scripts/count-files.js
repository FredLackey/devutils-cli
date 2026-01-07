#!/usr/bin/env node

/**
 * count-files - Count only files (not directories) in the current or specified directory
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias count-files="find . -maxdepth 1 -type f | wc -l"
 *
 * This script counts only regular files in a directory, excluding subdirectories.
 * It reads the directory contents and filters for files only, then prints the count.
 * Unlike the original shell alias, this uses pure Node.js for cross-platform support.
 *
 * @module scripts/count-files
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');

/**
 * Pure Node.js implementation that works on any platform.
 * Counts the number of files (not directories) in the specified directory.
 *
 * This approach uses fs.readdirSync with the { withFileTypes: true } option,
 * which returns Dirent objects that include file type information. This is
 * more efficient than calling stat() on each entry individually.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Optional path to count (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_count_files_nodejs(args) {
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

    // Filter for files only (not directories, symlinks to directories, etc.)
    // dirent.isFile() returns true only for regular files
    const files = entries.filter(dirent => dirent.isFile());

    // Print the count (matching original alias output: just the number)
    console.log(files.length);
  } catch (error) {
    // Handle permission errors or other filesystem issues
    console.error(`Error reading directory: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Count files on macOS.
 * Uses the pure Node.js implementation since file counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_files_macos(args) {
  return do_count_files_nodejs(args);
}

/**
 * Count files on Ubuntu.
 * Uses the pure Node.js implementation since file counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_files_ubuntu(args) {
  return do_count_files_nodejs(args);
}

/**
 * Count files on Raspberry Pi OS.
 * Uses the pure Node.js implementation since file counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_files_raspbian(args) {
  return do_count_files_nodejs(args);
}

/**
 * Count files on Amazon Linux.
 * Uses the pure Node.js implementation since file counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_files_amazon_linux(args) {
  return do_count_files_nodejs(args);
}

/**
 * Count files in Windows Command Prompt.
 * Uses the pure Node.js implementation since file counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_files_cmd(args) {
  return do_count_files_nodejs(args);
}

/**
 * Count files in Windows PowerShell.
 * Uses the pure Node.js implementation since file counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_files_powershell(args) {
  return do_count_files_nodejs(args);
}

/**
 * Count files in Git Bash on Windows.
 * Uses the pure Node.js implementation since file counting works identically
 * across all platforms using the fs module.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_files_gitbash(args) {
  return do_count_files_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Counts the number of regular files (not directories) in the current or specified
 * directory. This is useful for quickly checking how many files exist in a folder
 * without counting subdirectories.
 *
 * Usage:
 *   count-files           # Count files in current directory
 *   count-files /path     # Count files in specified directory
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_files(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_count_files_macos,
    'ubuntu': do_count_files_ubuntu,
    'debian': do_count_files_ubuntu,
    'raspbian': do_count_files_raspbian,
    'amazon_linux': do_count_files_amazon_linux,
    'rhel': do_count_files_amazon_linux,
    'fedora': do_count_files_ubuntu,
    'linux': do_count_files_ubuntu,
    'wsl': do_count_files_ubuntu,
    'cmd': do_count_files_cmd,
    'windows': do_count_files_cmd,
    'powershell': do_count_files_powershell,
    'gitbash': do_count_files_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_count_files,
  do_count_files,
  do_count_files_nodejs,
  do_count_files_macos,
  do_count_files_ubuntu,
  do_count_files_raspbian,
  do_count_files_amazon_linux,
  do_count_files_cmd,
  do_count_files_powershell,
  do_count_files_gitbash
};

if (require.main === module) {
  do_count_files(process.argv.slice(2));
}
