#!/usr/bin/env node

/**
 * delete-files - Delete files matching a pattern from the current directory
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   delete-files() {
 *       local q="${1:-*.DS_Store}"
 *       find . -type f -name "$q" -ls -delete
 *   }
 *
 * This script recursively searches the current directory for files matching
 * the specified glob pattern and deletes them. By default, it removes .DS_Store
 * files, which are macOS metadata files that often clutter repositories.
 *
 * Usage:
 *   delete-files              # Delete all .DS_Store files (default)
 *   delete-files "*.log"      # Delete all .log files
 *   delete-files "*.tmp"      # Delete all .tmp files
 *   delete-files ".thumbs.db" # Delete specific filename
 *
 * @module scripts/delete-files
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');

/**
 * Converts a simple glob pattern to a regular expression.
 *
 * This handles basic glob patterns commonly used in file matching:
 * - * matches any characters (except path separators)
 * - ? matches a single character
 * - Other special regex characters are escaped
 *
 * @param {string} pattern - The glob pattern (e.g., "*.log", "test?.txt")
 * @returns {RegExp} A regular expression that matches the pattern
 *
 * @example
 * const regex = globToRegex("*.log");
 * regex.test("debug.log");  // true
 * regex.test("file.txt");   // false
 */
function globToRegex(pattern) {
  // Escape special regex characters, then convert glob wildcards to regex
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // Escape regex special chars
    .replace(/\*/g, '.*')                    // * becomes .*
    .replace(/\?/g, '.');                    // ? becomes .
  return new RegExp(`^${escaped}$`);
}

/**
 * Recursively finds all files in a directory that match a given pattern.
 *
 * This function walks the directory tree starting from the given directory
 * and collects all files whose names match the specified glob pattern.
 * It handles errors gracefully (e.g., permission denied) and continues
 * processing other directories.
 *
 * @param {string} dir - The directory to search in (absolute path)
 * @param {RegExp} pattern - The regex pattern to match filenames against
 * @returns {string[]} Array of absolute paths to matching files
 */
function findMatchingFiles(dir, pattern) {
  const matches = [];

  /**
   * Inner recursive function that walks the directory tree.
   * @param {string} currentDir - The current directory being processed
   */
  function walkDir(currentDir) {
    let entries;

    try {
      // Read directory contents with file type information
      // withFileTypes is more efficient than calling stat() for each entry
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (error) {
      // Handle permission errors or other read failures gracefully
      // Common reasons: permission denied, directory deleted during scan
      if (error.code !== 'ENOENT' && error.code !== 'EACCES') {
        console.error(`Warning: Could not read directory ${currentDir}: ${error.message}`);
      }
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        // Skip common directories that should not be searched
        // (e.g., node_modules, .git) to improve performance
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          walkDir(fullPath);
        }
      } else if (entry.isFile()) {
        // Check if the filename matches the pattern
        if (pattern.test(entry.name)) {
          matches.push(fullPath);
        }
      }
      // Note: Symlinks, sockets, and other special files are ignored
    }
  }

  walkDir(dir);
  return matches;
}

/**
 * Formats file size for human-readable output.
 *
 * Converts bytes to a human-readable string with appropriate units
 * (B, KB, MB, GB). This mimics the size display from `ls -l`.
 *
 * @param {number} bytes - The size in bytes
 * @returns {string} Human-readable size string
 *
 * @example
 * formatSize(1024);     // "1.0 KB"
 * formatSize(1048576);  // "1.0 MB"
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function uses only Node.js built-in modules (fs, path) to:
 * 1. Parse the glob pattern from arguments
 * 2. Recursively find matching files
 * 3. Display what will be deleted (like find -ls)
 * 4. Delete each matching file
 *
 * This approach is preferred over shelling out to `find` because:
 * - It works identically on all platforms (macOS, Linux, Windows)
 * - Node.js fs operations are fast and reliable
 * - We avoid shell escaping and quoting issues with special characters
 * - Better error handling and reporting
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Glob pattern to match (defaults to "*.DS_Store")
 * @returns {Promise<void>}
 */
async function do_delete_files_nodejs(args) {
  // Get the pattern from arguments, default to *.DS_Store (the original behavior)
  // The original bash function used: local q="${1:-*.DS_Store}"
  const pattern = args[0] || '*.DS_Store';

  // Start from the current working directory (like the original: find .)
  const startDir = process.cwd();

  // Convert the glob pattern to a regular expression for matching
  const regex = globToRegex(pattern);

  console.log(`Searching for files matching "${pattern}" in ${startDir}...`);
  console.log('');

  // Find all files matching the pattern
  const matchingFiles = findMatchingFiles(startDir, regex);

  // Check if any files were found
  if (matchingFiles.length === 0) {
    console.log(`No files matching "${pattern}" found.`);
    return;
  }

  console.log(`Found ${matchingFiles.length} file(s) to delete:`);
  console.log('');

  // Track statistics
  let deletedCount = 0;
  let failedCount = 0;
  let totalBytes = 0;

  // Process each matching file
  for (const filePath of matchingFiles) {
    try {
      // Get file stats for display (like find -ls shows file details)
      const stats = fs.statSync(filePath);
      const size = formatSize(stats.size);
      totalBytes += stats.size;

      // Display the file being deleted (mimics find -ls output)
      // Show relative path for cleaner output
      const relativePath = path.relative(startDir, filePath);
      console.log(`  ${size.padStart(10)}  ${relativePath}`);

      // Delete the file
      fs.unlinkSync(filePath);
      deletedCount++;
    } catch (error) {
      // Handle deletion failures (permission denied, file locked, etc.)
      const relativePath = path.relative(startDir, filePath);
      console.error(`  Error deleting ${relativePath}: ${error.message}`);
      failedCount++;
    }
  }

  // Print summary
  console.log('');
  console.log('---');
  console.log(`Deleted: ${deletedCount} file(s) (${formatSize(totalBytes)})`);
  if (failedCount > 0) {
    console.log(`Failed:  ${failedCount} file(s)`);
  }
}

/**
 * Deletes files matching a pattern on macOS.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on macOS. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_delete_files_macos(args) {
  return do_delete_files_nodejs(args);
}

/**
 * Deletes files matching a pattern on Ubuntu.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Linux. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_delete_files_ubuntu(args) {
  return do_delete_files_nodejs(args);
}

/**
 * Deletes files matching a pattern on Raspberry Pi OS.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Linux. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_delete_files_raspbian(args) {
  return do_delete_files_nodejs(args);
}

/**
 * Deletes files matching a pattern on Amazon Linux.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Linux. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_delete_files_amazon_linux(args) {
  return do_delete_files_nodejs(args);
}

/**
 * Deletes files matching a pattern on Windows (Command Prompt).
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Windows. No platform-specific code is needed.
 *
 * Note: On Windows, .DS_Store files are less common (they're macOS-specific),
 * but users may want to clean them up after receiving files from Mac users.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_delete_files_cmd(args) {
  return do_delete_files_nodejs(args);
}

/**
 * Deletes files matching a pattern on Windows (PowerShell).
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Windows. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_delete_files_powershell(args) {
  return do_delete_files_nodejs(args);
}

/**
 * Deletes files matching a pattern in Git Bash on Windows.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically regardless of the shell being used. No platform-specific
 * code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_delete_files_gitbash(args) {
  return do_delete_files_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "delete-files" command recursively finds and deletes files matching a
 * glob pattern. This is commonly used to clean up unwanted files like:
 * - .DS_Store (macOS metadata files)
 * - *.log (log files)
 * - *.tmp (temporary files)
 * - Thumbs.db (Windows thumbnail cache)
 *
 * The command is idempotent - running it multiple times produces the same
 * result (no files matching the pattern exist). If no files match, it
 * simply reports that no files were found.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Glob pattern (defaults to "*.DS_Store")
 * @returns {Promise<void>}
 */
async function do_delete_files(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_delete_files_macos,
    'ubuntu': do_delete_files_ubuntu,
    'debian': do_delete_files_ubuntu,
    'raspbian': do_delete_files_raspbian,
    'amazon_linux': do_delete_files_amazon_linux,
    'rhel': do_delete_files_amazon_linux,
    'fedora': do_delete_files_ubuntu,
    'linux': do_delete_files_ubuntu,
    'wsl': do_delete_files_ubuntu,
    'cmd': do_delete_files_cmd,
    'windows': do_delete_files_cmd,
    'powershell': do_delete_files_powershell,
    'gitbash': do_delete_files_gitbash
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
  main: do_delete_files,
  do_delete_files,
  do_delete_files_nodejs,
  do_delete_files_macos,
  do_delete_files_ubuntu,
  do_delete_files_raspbian,
  do_delete_files_amazon_linux,
  do_delete_files_cmd,
  do_delete_files_powershell,
  do_delete_files_gitbash
};

if (require.main === module) {
  do_delete_files(process.argv.slice(2));
}
