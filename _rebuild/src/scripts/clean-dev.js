#!/usr/bin/env node

/**
 * clean-dev - Remove node_modules and bower_components directories recursively
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   clean-dev() {
 *       sudo find . -name "node_modules" -exec rm -rf '{}' +
 *       find . -name "bower_components" -exec rm -rf '{}' +
 *   }
 *
 * This script recursively finds and removes all node_modules and bower_components
 * directories to free up disk space. This is useful for:
 * - Cleaning up old projects that are no longer being actively developed
 * - Reducing disk space usage from accumulated dependencies
 * - Preparing a directory for archival or backup
 *
 * Unlike the original bash version, this Node.js implementation:
 * - Does NOT require sudo (handles permission errors gracefully)
 * - Works identically across all platforms (macOS, Linux, Windows)
 * - Shows progress as directories are found and removed
 * - Provides a summary of space freed
 *
 * @module scripts/clean-dev
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');

/**
 * Directory names to search for and remove.
 * These are common development artifact directories that can be safely deleted
 * and recreated by running package manager install commands.
 */
const TARGET_DIRECTORIES = ['node_modules', 'bower_components'];

/**
 * Calculate the total size of a directory in bytes.
 * This is used to show how much space was freed.
 *
 * @param {string} dirPath - Absolute path to the directory
 * @returns {number} Total size in bytes, or 0 if directory cannot be read
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      try {
        if (entry.isDirectory()) {
          // Recursively calculate size of subdirectories
          totalSize += getDirectorySize(fullPath);
        } else if (entry.isFile()) {
          // Add file size
          const stats = fs.statSync(fullPath);
          totalSize += stats.size;
        }
      } catch (err) {
        // Skip files/directories we cannot access
        // This handles permission errors and symlink issues
      }
    }
  } catch (err) {
    // Cannot read directory, return 0
  }

  return totalSize;
}

/**
 * Format bytes into a human-readable string (KB, MB, GB).
 *
 * @param {number} bytes - Size in bytes
 * @returns {string} Human-readable size string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = (bytes / Math.pow(k, i)).toFixed(2);

  return `${size} ${units[i]}`;
}

/**
 * Recursively remove a directory and all its contents.
 * This is the equivalent of 'rm -rf' in bash.
 *
 * @param {string} dirPath - Absolute path to the directory to remove
 * @returns {boolean} True if successfully removed, false otherwise
 */
function removeDirectory(dirPath) {
  try {
    // Node.js 14.14+ supports recursive removal with fs.rmSync
    // We use this instead of shell commands for cross-platform compatibility
    fs.rmSync(dirPath, { recursive: true, force: true });
    return true;
  } catch (err) {
    // Permission denied or other error
    return false;
  }
}

/**
 * Recursively find directories with a specific name.
 * This walks the directory tree and collects paths to matching directories.
 *
 * IMPORTANT: When we find a target directory (like node_modules), we do NOT
 * recurse into it. This is because:
 * 1. node_modules can contain nested node_modules (from hoisting)
 * 2. We want to delete the top-level directory, which will delete all contents
 * 3. Recursing into these massive directories would be slow and wasteful
 *
 * @param {string} rootDir - Starting directory for the search
 * @param {string[]} targetNames - Names of directories to find
 * @returns {string[]} Array of absolute paths to found directories
 */
function findDirectories(rootDir, targetNames) {
  const results = [];

  /**
   * Inner recursive function to walk the directory tree.
   * @param {string} currentDir - Current directory being examined
   */
  function walk(currentDir) {
    let entries;

    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (err) {
      // Cannot read directory (permission denied, etc.) - skip it
      return;
    }

    for (const entry of entries) {
      // Only process directories
      if (!entry.isDirectory()) {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);

      // Check if this directory matches one of our target names
      if (targetNames.includes(entry.name)) {
        // Found a match! Add to results
        results.push(fullPath);
        // Do NOT recurse into this directory - we'll delete it entirely
        // This also prevents us from finding nested node_modules inside
      } else {
        // Not a match, recurse into this directory to keep searching
        walk(fullPath);
      }
    }
  }

  // Start the walk from the root directory
  walk(rootDir);

  return results;
}

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This implementation uses only Node.js fs module operations:
 * - fs.readdirSync to walk directory trees
 * - fs.rmSync to remove directories recursively
 * - fs.statSync to calculate directory sizes
 *
 * No shell commands are needed because this is pure file system manipulation,
 * which Node.js handles well across all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Optional path to clean (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_clean_dev_nodejs(args) {
  // Determine the starting directory
  // If a path is provided as an argument, use it; otherwise use current working directory
  const startPath = args[0] ? path.resolve(args[0]) : process.cwd();

  // Verify the starting path exists and is a directory
  try {
    const stats = fs.statSync(startPath);
    if (!stats.isDirectory()) {
      console.error(`Error: '${startPath}' is not a directory.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`Error: Cannot access '${startPath}'.`);
    console.error(err.message);
    process.exit(1);
  }

  console.log(`Scanning for development artifact directories in: ${startPath}`);
  console.log(`Looking for: ${TARGET_DIRECTORIES.join(', ')}`);
  console.log('');

  // Find all target directories
  const foundDirs = findDirectories(startPath, TARGET_DIRECTORIES);

  if (foundDirs.length === 0) {
    console.log('No node_modules or bower_components directories found.');
    return;
  }

  console.log(`Found ${foundDirs.length} director${foundDirs.length === 1 ? 'y' : 'ies'} to remove:`);
  console.log('');

  let totalSize = 0;
  let removedCount = 0;
  let failedCount = 0;
  const failedDirs = [];

  // Process each found directory
  for (const dirPath of foundDirs) {
    // Calculate size before removal (for reporting)
    const size = getDirectorySize(dirPath);

    // Show which directory we're removing
    const relativePath = path.relative(startPath, dirPath) || '.';
    process.stdout.write(`  Removing: ${relativePath} (${formatBytes(size)})... `);

    // Attempt to remove the directory
    const success = removeDirectory(dirPath);

    if (success) {
      console.log('done');
      totalSize += size;
      removedCount++;
    } else {
      console.log('FAILED (permission denied)');
      failedCount++;
      failedDirs.push(relativePath);
    }
  }

  // Print summary
  console.log('');
  console.log('--- Summary ---');
  console.log(`Directories removed: ${removedCount}`);
  console.log(`Space freed: ${formatBytes(totalSize)}`);

  if (failedCount > 0) {
    console.log('');
    console.log(`Failed to remove ${failedCount} director${failedCount === 1 ? 'y' : 'ies'}:`);
    for (const dir of failedDirs) {
      console.log(`  - ${dir}`);
    }
    console.log('');
    console.log('Tip: You may need to run with elevated privileges to remove these directories.');
    console.log('     On macOS/Linux: sudo clean-dev');
    console.log('     On Windows: Run as Administrator');
  }
}

/**
 * Remove node_modules and bower_components on macOS.
 *
 * Uses the pure Node.js implementation since file system operations
 * work identically across platforms. The original bash version used sudo,
 * but our Node.js version handles permission errors gracefully instead.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clean_dev_macos(args) {
  // macOS uses the same Node.js file operations as all other platforms
  return do_clean_dev_nodejs(args);
}

/**
 * Remove node_modules and bower_components on Ubuntu.
 *
 * Uses the pure Node.js implementation since file system operations
 * work identically across platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clean_dev_ubuntu(args) {
  // Ubuntu uses the same Node.js file operations as all other platforms
  return do_clean_dev_nodejs(args);
}

/**
 * Remove node_modules and bower_components on Raspberry Pi OS.
 *
 * Uses the pure Node.js implementation since file system operations
 * work identically across platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clean_dev_raspbian(args) {
  // Raspbian uses the same Node.js file operations as all other platforms
  return do_clean_dev_nodejs(args);
}

/**
 * Remove node_modules and bower_components on Amazon Linux.
 *
 * Uses the pure Node.js implementation since file system operations
 * work identically across platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clean_dev_amazon_linux(args) {
  // Amazon Linux uses the same Node.js file operations as all other platforms
  return do_clean_dev_nodejs(args);
}

/**
 * Remove node_modules and bower_components on Windows Command Prompt.
 *
 * Uses the pure Node.js implementation since fs.rmSync with recursive: true
 * works correctly on Windows for deep directory trees.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clean_dev_cmd(args) {
  // Windows CMD uses the same Node.js file operations as all other platforms
  return do_clean_dev_nodejs(args);
}

/**
 * Remove node_modules and bower_components on Windows PowerShell.
 *
 * Uses the pure Node.js implementation since fs.rmSync with recursive: true
 * works correctly on Windows for deep directory trees.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clean_dev_powershell(args) {
  // Windows PowerShell uses the same Node.js file operations as all other platforms
  return do_clean_dev_nodejs(args);
}

/**
 * Remove node_modules and bower_components on Git Bash.
 *
 * Uses the pure Node.js implementation since fs.rmSync with recursive: true
 * works correctly on Windows (which Git Bash runs on) for deep directory trees.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clean_dev_gitbash(args) {
  // Git Bash uses the same Node.js file operations as all other platforms
  return do_clean_dev_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Recursively finds and removes all node_modules and bower_components directories
 * to free up disk space. This is a common cleanup operation for developers who
 * work on many Node.js projects.
 *
 * Usage:
 *   clean-dev           # Clean current directory
 *   clean-dev ~/projects # Clean a specific directory
 *
 * What gets removed:
 *   - node_modules/     # npm/yarn/pnpm dependencies
 *   - bower_components/ # Bower dependencies (legacy)
 *
 * This is safe because these directories can always be recreated by running
 * 'npm install', 'yarn install', or 'bower install' in the project directory.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clean_dev(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_clean_dev_macos,
    'ubuntu': do_clean_dev_ubuntu,
    'debian': do_clean_dev_ubuntu,
    'raspbian': do_clean_dev_raspbian,
    'amazon_linux': do_clean_dev_amazon_linux,
    'rhel': do_clean_dev_amazon_linux,
    'fedora': do_clean_dev_ubuntu,
    'linux': do_clean_dev_ubuntu,
    'wsl': do_clean_dev_ubuntu,
    'cmd': do_clean_dev_cmd,
    'windows': do_clean_dev_cmd,
    'powershell': do_clean_dev_powershell,
    'gitbash': do_clean_dev_gitbash
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
  main: do_clean_dev,
  do_clean_dev,
  do_clean_dev_nodejs,
  do_clean_dev_macos,
  do_clean_dev_ubuntu,
  do_clean_dev_raspbian,
  do_clean_dev_amazon_linux,
  do_clean_dev_cmd,
  do_clean_dev_powershell,
  do_clean_dev_gitbash
};

if (require.main === module) {
  do_clean_dev(process.argv.slice(2));
}
