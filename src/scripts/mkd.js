#!/usr/bin/env node

/**
 * mkd - Create a new directory and display navigation instructions
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   mkd() {
 *       mkdir -p "$@" && cd "$@"
 *   }
 *
 * This script creates a new directory (including all necessary parent directories)
 * and outputs instructions for navigating into it. The original shell function could
 * change the working directory directly, but since Node.js scripts run in a subprocess,
 * they cannot modify the parent shell's working directory.
 *
 * Usage:
 *   mkd my-project                    # Creates ./my-project
 *   mkd path/to/nested/directory      # Creates all parent directories as needed
 *   mkd ~/projects/new-app            # Works with home directory paths
 *
 * @module scripts/mkd
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');

/**
 * Expands a path that starts with ~ to the user's home directory.
 *
 * Node.js doesn't automatically expand tilde in paths like shells do,
 * so we need to handle this manually for user convenience.
 *
 * @param {string} inputPath - The path that may contain a leading ~
 * @returns {string} The expanded path with ~ replaced by home directory
 */
function expandTilde(inputPath) {
  // If the path starts with ~, replace it with the home directory
  if (inputPath.startsWith('~')) {
    const homeDir = os.getHomeDir();
    // Handle both ~/path and ~ alone
    return inputPath.replace(/^~/, homeDir);
  }
  return inputPath;
}

/**
 * Pure Node.js implementation for creating directories.
 *
 * Uses the Node.js fs module to create directories recursively,
 * equivalent to the shell's `mkdir -p` command. This approach is:
 * - Cross-platform (works identically on all OSes)
 * - Native to Node.js (no shell commands needed)
 * - Idempotent (safe to run multiple times)
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args.0 - Directory path to create
 * @returns {Promise<void>}
 */
async function do_mkd_nodejs(args) {
  // Validate arguments
  if (args.length === 0) {
    console.error('Usage: mkd <directory>');
    console.error('');
    console.error('Creates a new directory, including parent directories if needed.');
    console.error('');
    console.error('Examples:');
    console.error('  mkd my-project');
    console.error('  mkd path/to/nested/directory');
    console.error('  mkd ~/projects/new-app');
    process.exit(1);
  }

  // Get the directory path from arguments
  // The original bash function used "$@" which takes all arguments,
  // but typically mkd is used with a single directory path
  const rawPath = args.join(' ');

  // Expand tilde if present (shells do this automatically, Node.js doesn't)
  const expandedPath = expandTilde(rawPath);

  // Resolve to absolute path for clearer output
  const absolutePath = path.resolve(expandedPath);

  // Check if the path already exists
  if (fs.existsSync(absolutePath)) {
    // Check if it's a directory or a file
    const stats = fs.statSync(absolutePath);
    if (stats.isDirectory()) {
      // Directory already exists - this is fine (idempotent behavior)
      console.log(`Directory already exists: ${absolutePath}`);
      console.log('');
      console.log(`To navigate there, run: cd "${absolutePath}"`);
      return;
    } else {
      // A file with the same name exists - this is an error
      console.error(`Error: A file with this name already exists: ${absolutePath}`);
      console.error('Cannot create a directory with the same name as an existing file.');
      process.exit(1);
    }
  }

  // Create the directory (and all parent directories)
  // fs.mkdirSync with recursive:true is equivalent to mkdir -p
  try {
    fs.mkdirSync(absolutePath, { recursive: true });
  } catch (error) {
    // Handle permission errors and other filesystem errors
    if (error.code === 'EACCES') {
      console.error(`Error: Permission denied. Cannot create directory: ${absolutePath}`);
      console.error('You may need to run this command with elevated privileges.');
    } else if (error.code === 'ENOENT') {
      console.error(`Error: Invalid path: ${absolutePath}`);
    } else if (error.code === 'ENOTDIR') {
      console.error(`Error: A component of the path is not a directory: ${absolutePath}`);
    } else {
      console.error(`Error: Failed to create directory: ${error.message}`);
    }
    process.exit(1);
  }

  // Verify the directory was created
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: Directory creation appeared to succeed but directory does not exist.`);
    process.exit(1);
  }

  // Success! Print the result
  // Note: Unlike the original shell function, we cannot change the parent shell's
  // working directory. We provide instructions instead.
  console.log(`Created directory: ${absolutePath}`);
  console.log('');
  console.log(`To navigate there, run: cd "${absolutePath}"`);
}

/**
 * Create directory on macOS.
 *
 * Uses the pure Node.js implementation since fs.mkdirSync works
 * identically on macOS as on other platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_mkd_macos(args) {
  return do_mkd_nodejs(args);
}

/**
 * Create directory on Ubuntu.
 *
 * Uses the pure Node.js implementation since fs.mkdirSync works
 * identically on Linux as on other platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_mkd_ubuntu(args) {
  return do_mkd_nodejs(args);
}

/**
 * Create directory on Raspberry Pi OS.
 *
 * Uses the pure Node.js implementation since fs.mkdirSync works
 * identically on Raspberry Pi OS as on other platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_mkd_raspbian(args) {
  return do_mkd_nodejs(args);
}

/**
 * Create directory on Amazon Linux.
 *
 * Uses the pure Node.js implementation since fs.mkdirSync works
 * identically on Amazon Linux as on other platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_mkd_amazon_linux(args) {
  return do_mkd_nodejs(args);
}

/**
 * Create directory in Windows Command Prompt.
 *
 * Uses the pure Node.js implementation since fs.mkdirSync works
 * identically on Windows as on other platforms. The Node.js fs module
 * handles Windows path separators automatically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_mkd_cmd(args) {
  return do_mkd_nodejs(args);
}

/**
 * Create directory in Windows PowerShell.
 *
 * Uses the pure Node.js implementation since fs.mkdirSync works
 * identically across all platforms and shells.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_mkd_powershell(args) {
  return do_mkd_nodejs(args);
}

/**
 * Create directory in Git Bash on Windows.
 *
 * Uses the pure Node.js implementation. Git Bash understands both
 * Unix-style and Windows-style paths, and Node.js handles the conversion.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_mkd_gitbash(args) {
  return do_mkd_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "mkd" (make directory) command is a developer convenience tool that:
 * 1. Creates a new directory, including all parent directories if needed
 * 2. Provides the cd command to navigate to the new directory
 *
 * This replicates the shell function pattern of creating a directory and
 * immediately entering it, common in developer workflows when starting
 * new projects or organizing files.
 *
 * Note: Unlike the original shell function, this script cannot change the
 * parent shell's working directory. Node.js scripts run in a subprocess and
 * cannot affect the parent process's environment. The script outputs the
 * cd command for the user to run.
 *
 * For a true "mkdir and cd" experience, users can use a shell alias:
 *   alias mkd='function _mkd(){ mkd "$1" && cd "$1"; }; _mkd'
 * Or use command substitution:
 *   cd $(mkd --quiet my-dir)  # If --quiet flag were implemented
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args.0 - Directory path to create
 * @returns {Promise<void>}
 */
async function do_mkd(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_mkd_macos,
    'ubuntu': do_mkd_ubuntu,
    'debian': do_mkd_ubuntu,
    'raspbian': do_mkd_raspbian,
    'amazon_linux': do_mkd_amazon_linux,
    'rhel': do_mkd_amazon_linux,
    'fedora': do_mkd_ubuntu,
    'linux': do_mkd_ubuntu,
    'wsl': do_mkd_ubuntu,
    'cmd': do_mkd_cmd,
    'windows': do_mkd_cmd,
    'powershell': do_mkd_powershell,
    'gitbash': do_mkd_gitbash
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
  main: do_mkd,
  do_mkd,
  do_mkd_nodejs,
  do_mkd_macos,
  do_mkd_ubuntu,
  do_mkd_raspbian,
  do_mkd_amazon_linux,
  do_mkd_cmd,
  do_mkd_powershell,
  do_mkd_gitbash
};

if (require.main === module) {
  do_mkd(process.argv.slice(2));
}
