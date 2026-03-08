#!/usr/bin/env node

/**
 * count - Count files and folders in current directory
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias count='echo "Files  : $(find . -maxdepth 1 -type f | wc -l)" && echo "Folders: $(find . -mindepth 1 -maxdepth 1 -type d | wc -l)"'
 *
 * This script counts the number of files and folders in the current (or specified)
 * directory. It only counts items at the top level (non-recursive) and displays
 * separate counts for files and directories.
 *
 * Usage:
 *   count              # Count in current directory
 *   count /some/path   # Count in specified directory
 *
 * @module scripts/count
 */

const fs = require('fs');
const path = require('path');
const os = require('../utils/common/os');

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function reads the directory entries and counts files and folders separately.
 * It uses the Node.js fs module which works identically on all platforms, so all
 * platform-specific functions simply delegate to this implementation.
 *
 * Why Node.js instead of shell commands?
 * - The original alias used `find` and `wc` which are Unix-specific
 * - Node.js fs.readdirSync with withFileTypes works on macOS, Linux, AND Windows
 * - No external dependencies needed - pure Node.js
 * - Consistent behavior across all platforms
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Optional path to count (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_count_nodejs(args) {
  // Determine which directory to count
  // If the user provides a path, use it; otherwise use current working directory
  const targetDir = args[0] || process.cwd();

  // Resolve to absolute path for clarity in error messages
  const absolutePath = path.resolve(targetDir);

  // Check if the path exists and is a directory
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: Path does not exist: ${absolutePath}`);
    process.exit(1);
  }

  // Get stats to verify it's a directory
  let stats;
  try {
    stats = fs.statSync(absolutePath);
  } catch (error) {
    console.error(`Error: Cannot access path: ${absolutePath}`);
    console.error(error.message);
    process.exit(1);
  }

  if (!stats.isDirectory()) {
    console.error(`Error: Path is not a directory: ${absolutePath}`);
    process.exit(1);
  }

  // Read directory contents with file type information
  // withFileTypes: true returns Dirent objects which include isFile() and isDirectory() methods
  let entries;
  try {
    entries = fs.readdirSync(absolutePath, { withFileTypes: true });
  } catch (error) {
    console.error(`Error: Cannot read directory: ${absolutePath}`);
    console.error(error.message);
    process.exit(1);
  }

  // Count files and folders separately
  // We iterate once through all entries and categorize each one
  let fileCount = 0;
  let folderCount = 0;

  for (const entry of entries) {
    if (entry.isFile()) {
      // Regular files (not directories, not symlinks to directories)
      fileCount++;
    } else if (entry.isDirectory()) {
      // Directories (folders)
      folderCount++;
    }
    // Note: symlinks, block devices, character devices, etc. are not counted
    // This matches the original alias behavior which only counted -type f and -type d
  }

  // Display results in the same format as the original alias
  // The original output was:
  //   Files  : 42
  //   Folders: 7
  console.log(`Files  : ${fileCount}`);
  console.log(`Folders: ${folderCount}`);
}

/**
 * Count files and folders on macOS.
 *
 * macOS supports the Node.js fs module fully, so we delegate to the pure
 * Node.js implementation. This provides the same result as the original
 * bash alias but without requiring find or wc commands.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_macos(args) {
  return do_count_nodejs(args);
}

/**
 * Count files and folders on Ubuntu.
 *
 * Ubuntu supports the Node.js fs module fully, so we delegate to the pure
 * Node.js implementation. This provides consistent behavior whether on
 * desktop or server Ubuntu.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_ubuntu(args) {
  return do_count_nodejs(args);
}

/**
 * Count files and folders on Raspberry Pi OS.
 *
 * Raspberry Pi OS (Raspbian) is Debian-based and supports the Node.js fs
 * module fully. We delegate to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_raspbian(args) {
  return do_count_nodejs(args);
}

/**
 * Count files and folders on Amazon Linux.
 *
 * Amazon Linux supports the Node.js fs module fully, so we delegate to the
 * pure Node.js implementation. This works on both Amazon Linux 2 and 2023.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_amazon_linux(args) {
  return do_count_nodejs(args);
}

/**
 * Count files and folders in Windows Command Prompt.
 *
 * Windows supports the Node.js fs module fully, so we delegate to the pure
 * Node.js implementation. This avoids the complexity of using dir commands
 * or PowerShell from CMD.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_cmd(args) {
  return do_count_nodejs(args);
}

/**
 * Count files and folders in Windows PowerShell.
 *
 * Windows supports the Node.js fs module fully, so we delegate to the pure
 * Node.js implementation. This provides consistent output formatting that
 * matches the original Unix alias.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_powershell(args) {
  return do_count_nodejs(args);
}

/**
 * Count files and folders in Git Bash.
 *
 * Git Bash runs on Windows, and Node.js fs module works correctly here.
 * We delegate to the pure Node.js implementation for consistent behavior.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_count_gitbash(args) {
  return do_count_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "count" command displays the number of files and folders in a directory.
 * This is useful for quickly understanding the contents of a directory without
 * having to manually count or use complex shell commands.
 *
 * All platforms use the same pure Node.js implementation because file system
 * operations are fully abstracted by Node.js. The platform detection is still
 * performed to maintain consistency with other scripts in this project.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Optional path to count (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_count(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_count_macos,
    'ubuntu': do_count_ubuntu,
    'debian': do_count_ubuntu,
    'raspbian': do_count_raspbian,
    'amazon_linux': do_count_amazon_linux,
    'rhel': do_count_amazon_linux,
    'fedora': do_count_ubuntu,
    'linux': do_count_ubuntu,
    'wsl': do_count_ubuntu,
    'cmd': do_count_cmd,
    'windows': do_count_cmd,
    'powershell': do_count_powershell,
    'gitbash': do_count_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    // For unknown platforms, try the Node.js implementation directly
    // since it should work anywhere Node.js runs
    console.error(`Warning: Platform '${platform.type}' is not explicitly supported.`);
    console.error('Attempting to run with generic Node.js implementation...');
    console.error('');
    await do_count_nodejs(args);
    return;
  }

  await handler(args);
}

module.exports = {
  main: do_count,
  do_count,
  do_count_nodejs,
  do_count_macos,
  do_count_ubuntu,
  do_count_raspbian,
  do_count_amazon_linux,
  do_count_cmd,
  do_count_powershell,
  do_count_gitbash
};

if (require.main === module) {
  do_count(process.argv.slice(2));
}
