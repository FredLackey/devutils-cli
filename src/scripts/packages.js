#!/usr/bin/env node

/**
 * packages - Find all package.json files with modification dates
 *
 * Migrated from legacy dotfiles alias.
 * Original aliases:
 *   macOS:  find ./ -type f -name "package.json" -exec stat -f "%Sm %N" -t "%Y-%m-%d %H:%M:%S" {} + | grep -v "node_modules" | sort -n
 *   Ubuntu: find ./ -type f -name "package.json" -exec stat --format="%Y %n" {} + | grep -v "node_modules" sort -n | awk '{print strftime("%Y-%m-%d %H:%M:%S", $1), $2}'
 *
 * This script finds all package.json files recursively in a directory,
 * excludes those inside node_modules folders, and displays them with their
 * modification timestamps sorted chronologically. This is useful for:
 * - Finding when projects were last modified
 * - Discovering nested projects in a monorepo
 * - Auditing package.json files across a codebase
 *
 * @module scripts/packages
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');

/**
 * Recursively finds all files matching a pattern in a directory.
 * This is a pure Node.js implementation that avoids shell commands.
 *
 * @param {string} dir - The directory to search in
 * @param {string} filename - The filename to look for (e.g., 'package.json')
 * @param {string[]} excludePaths - Array of path segments to exclude (e.g., ['node_modules'])
 * @returns {string[]} Array of absolute file paths found
 */
function findFilesRecursive(dir, filename, excludePaths = []) {
  const results = [];

  /**
   * Internal recursive function that traverses directories.
   * @param {string} currentDir - Current directory being searched
   */
  function traverse(currentDir) {
    let entries;
    try {
      // Read all entries in the current directory
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (err) {
      // Skip directories we cannot read (permission denied, etc.)
      // This is common when traversing large file trees
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      // Check if this path should be excluded
      // We check if any segment of the path matches our exclude list
      const shouldExclude = excludePaths.some(excludeSegment =>
        fullPath.split(path.sep).includes(excludeSegment)
      );

      if (shouldExclude) {
        continue; // Skip this entry entirely
      }

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        traverse(fullPath);
      } else if (entry.isFile() && entry.name === filename) {
        // Found a matching file
        results.push(fullPath);
      }
    }
  }

  traverse(dir);
  return results;
}

/**
 * Gets the modification time of a file.
 *
 * @param {string} filePath - Path to the file
 * @returns {{ path: string, mtime: Date }|null} Object with path and modification time, or null if error
 */
function getFileModTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      mtime: stats.mtime
    };
  } catch (err) {
    // File might have been deleted between finding it and stat'ing it
    return null;
  }
}

/**
 * Formats a Date object into YYYY-MM-DD HH:MM:SS format.
 * This matches the format used in the original shell aliases.
 *
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const year = date.getFullYear();
  // Months are 0-indexed in JavaScript, so add 1
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function finds all package.json files, excludes node_modules,
 * and displays them sorted by modification time. Because file system
 * operations are platform-agnostic in Node.js, this single implementation
 * works identically on macOS, Linux, and Windows.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path to search (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_packages_nodejs(args) {
  // Get the search directory from args, or use current working directory
  const searchDir = args[0] ? path.resolve(args[0]) : process.cwd();

  // Verify the directory exists
  if (!fs.existsSync(searchDir)) {
    console.error(`Error: Directory does not exist: ${searchDir}`);
    process.exit(1);
  }

  // Verify it's actually a directory
  const searchDirStats = fs.statSync(searchDir);
  if (!searchDirStats.isDirectory()) {
    console.error(`Error: Not a directory: ${searchDir}`);
    process.exit(1);
  }

  // Find all package.json files, excluding node_modules directories
  // This mirrors the original alias behavior: grep -v "node_modules"
  const packageFiles = findFilesRecursive(searchDir, 'package.json', ['node_modules']);

  if (packageFiles.length === 0) {
    console.log('No package.json files found.');
    return;
  }

  // Get modification times for all found files
  const filesWithTimes = packageFiles
    .map(getFileModTime)
    .filter(item => item !== null); // Remove any files that couldn't be stat'd

  // Sort by modification time (oldest first, like the original 'sort -n')
  filesWithTimes.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

  // Display results in the format: "YYYY-MM-DD HH:MM:SS /path/to/package.json"
  // This matches the original shell alias output format
  for (const file of filesWithTimes) {
    const formattedDate = formatDate(file.mtime);
    // Use relative path from search directory for cleaner output
    const relativePath = path.relative(searchDir, file.path);
    // Add ./ prefix to match original alias output
    const displayPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
    console.log(`${formattedDate} ${displayPath}`);
  }
}

/**
 * Find package.json files on macOS.
 * Delegates to the pure Node.js implementation since no macOS-specific
 * functionality is needed for file searching and listing.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_packages_macos(args) {
  return do_packages_nodejs(args);
}

/**
 * Find package.json files on Ubuntu.
 * Delegates to the pure Node.js implementation since no Ubuntu-specific
 * functionality is needed for file searching and listing.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_packages_ubuntu(args) {
  return do_packages_nodejs(args);
}

/**
 * Find package.json files on Raspberry Pi OS.
 * Delegates to the pure Node.js implementation since no Raspbian-specific
 * functionality is needed for file searching and listing.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_packages_raspbian(args) {
  return do_packages_nodejs(args);
}

/**
 * Find package.json files on Amazon Linux.
 * Delegates to the pure Node.js implementation since no Amazon Linux-specific
 * functionality is needed for file searching and listing.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_packages_amazon_linux(args) {
  return do_packages_nodejs(args);
}

/**
 * Find package.json files on Windows Command Prompt.
 * Delegates to the pure Node.js implementation since Node.js fs module
 * handles Windows paths and file operations transparently.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_packages_cmd(args) {
  return do_packages_nodejs(args);
}

/**
 * Find package.json files on Windows PowerShell.
 * Delegates to the pure Node.js implementation since Node.js fs module
 * handles Windows paths and file operations transparently.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_packages_powershell(args) {
  return do_packages_nodejs(args);
}

/**
 * Find package.json files in Git Bash.
 * Delegates to the pure Node.js implementation since Node.js fs module
 * works correctly in Git Bash on Windows.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_packages_gitbash(args) {
  return do_packages_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "packages" command finds all package.json files in a directory tree,
 * excluding those inside node_modules directories, and displays them sorted
 * by modification time. This helps developers quickly see:
 *   - Which projects exist in a directory
 *   - When each project was last modified
 *   - Discover nested packages in monorepos
 *
 * Usage:
 *   packages              # Search current directory
 *   packages /path/to/dir # Search specified directory
 *
 * Output format:
 *   YYYY-MM-DD HH:MM:SS ./path/to/package.json
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path to search
 * @returns {Promise<void>}
 */
async function do_packages(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_packages_macos,
    'ubuntu': do_packages_ubuntu,
    'debian': do_packages_ubuntu,
    'raspbian': do_packages_raspbian,
    'amazon_linux': do_packages_amazon_linux,
    'rhel': do_packages_amazon_linux,
    'fedora': do_packages_ubuntu,
    'linux': do_packages_ubuntu,
    'wsl': do_packages_ubuntu,
    'cmd': do_packages_cmd,
    'windows': do_packages_cmd,
    'powershell': do_packages_powershell,
    'gitbash': do_packages_gitbash
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
  main: do_packages,
  do_packages,
  do_packages_nodejs,
  do_packages_macos,
  do_packages_ubuntu,
  do_packages_raspbian,
  do_packages_amazon_linux,
  do_packages_cmd,
  do_packages_powershell,
  do_packages_gitbash
};

if (require.main === module) {
  do_packages(process.argv.slice(2));
}
