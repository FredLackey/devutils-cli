#!/usr/bin/env node

/**
 * refresh-files - Copy matching files from source to target directory
 *
 * Migrated from legacy dotfiles alias.
 * Original bash function (see research/dotfiles/src/shell/bash_functions):
 *
 *   refresh-files SOURCE_FOLDER [TARGET_FOLDER]
 *
 *   Compares files in the target directory with a source directory and copies
 *   over files that exist in both locations from the source. Skips node_modules
 *   and bower_components directories.
 *
 * This script compares files in a target directory with a source directory
 * and copies over files that exist in BOTH locations from the source.
 * This is useful for:
 * - Refreshing vendor source files from a stable/reference project
 * - Syncing configuration files with a known-good copy
 * - Keeping critical files in sync with a master copy
 *
 * The script does NOT add new files to the target. It only updates files
 * that already exist in the target directory if they also exist in the source.
 *
 * @module scripts/refresh-files
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');

/**
 * Directories to skip when walking the target directory tree.
 * These are typically large dependency directories that should not be refreshed.
 */
const SKIP_DIRECTORIES = ['node_modules', 'bower_components', '.git'];

/**
 * Recursively find all files in a directory, skipping certain directories.
 * Returns absolute paths to all files found.
 *
 * @param {string} dirPath - Absolute path to the directory to search
 * @param {string[]} skipDirs - Array of directory names to skip
 * @returns {string[]} Array of absolute file paths
 */
function findFilesRecursively(dirPath, skipDirs) {
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
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip directories in our skip list
        if (skipDirs.includes(entry.name)) {
          continue;
        }
        // Recurse into other directories
        walk(fullPath);
      } else if (entry.isFile()) {
        // Add file to results
        results.push(fullPath);
      }
      // Skip symlinks and other special entries
    }
  }

  walk(dirPath);
  return results;
}

/**
 * Copy a file from source to destination, creating parent directories if needed.
 * This function overwrites the destination file if it exists.
 *
 * @param {string} sourcePath - Absolute path to the source file
 * @param {string} destPath - Absolute path to the destination file
 * @returns {boolean} True if copy succeeded, false otherwise
 */
function copyFile(sourcePath, destPath) {
  try {
    // Read the source file
    const content = fs.readFileSync(sourcePath);
    // Write to the destination (this overwrites if exists)
    fs.writeFileSync(destPath, content);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Check if a file exists at the given path.
 *
 * @param {string} filePath - Absolute path to check
 * @returns {boolean} True if file exists and is a regular file
 */
function fileExists(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile();
  } catch (err) {
    return false;
  }
}

/**
 * Check if a directory exists at the given path.
 *
 * @param {string} dirPath - Absolute path to check
 * @returns {boolean} True if directory exists
 */
function directoryExists(dirPath) {
  try {
    const stats = fs.statSync(dirPath);
    return stats.isDirectory();
  } catch (err) {
    return false;
  }
}

/**
 * Pure Node.js implementation that works on any platform.
 * This function contains the cross-platform logic using only Node.js APIs.
 *
 * The function walks through all files in the target directory, and for each
 * file it checks if a corresponding file exists in the source directory
 * (at the same relative path). If it does, the source file is copied over
 * the target file, effectively "refreshing" it.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Source folder path (required)
 * @param {string} [args[1]] - Target folder path (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_refresh_files_nodejs(args) {
  // Parse arguments
  const sourceArg = args[0];
  const targetArg = args[1];

  // Validate source argument is provided
  if (!sourceArg) {
    console.error('Error: Source folder not supplied.');
    console.error('');
    console.error('USAGE: refresh-files SOURCE_FOLDER [TARGET_FOLDER]');
    console.error('');
    console.error('This command compares files in the target directory with the source');
    console.error('directory and copies over files that exist in both locations from');
    console.error('the source. Files are only updated, never added or removed.');
    console.error('');
    console.error('Arguments:');
    console.error('  SOURCE_FOLDER  Path to the reference/stable project');
    console.error('  TARGET_FOLDER  Path to update (defaults to current directory)');
    process.exit(1);
  }

  // Resolve paths to absolute paths
  const sourcePath = path.resolve(sourceArg);
  const targetPath = targetArg ? path.resolve(targetArg) : process.cwd();

  // Validate source directory exists
  if (!directoryExists(sourcePath)) {
    console.error(`Error: Source folder does not exist: ${sourcePath}`);
    process.exit(1);
  }

  // Validate target directory exists
  if (!directoryExists(targetPath)) {
    console.error(`Error: Target folder does not exist: ${targetPath}`);
    process.exit(1);
  }

  // Print operation header
  console.log('Refreshing files...');
  console.log(`FROM: ${sourcePath}`);
  console.log(`TO  : ${targetPath}`);
  console.log('-----');

  // Find all files in the target directory (excluding node_modules, etc.)
  const targetFiles = findFilesRecursively(targetPath, SKIP_DIRECTORIES);

  // Track statistics
  let refreshedCount = 0;
  let failedCount = 0;
  const failedFiles = [];

  // For each file in target, check if it exists in source and copy if so
  for (const targetFile of targetFiles) {
    // Calculate the relative path from target root
    const relativePath = path.relative(targetPath, targetFile);

    // Construct the corresponding source file path
    const sourceFile = path.join(sourcePath, relativePath);

    // Check if this file exists in the source directory
    if (fileExists(sourceFile)) {
      // File exists in both locations - copy from source to target
      const success = copyFile(sourceFile, targetFile);

      if (success) {
        // Use forward slashes for display (matches original bash output)
        const displayPath = relativePath.split(path.sep).join('/');
        console.log(displayPath);
        refreshedCount++;
      } else {
        failedCount++;
        failedFiles.push(relativePath);
      }
    }
    // If file doesn't exist in source, we simply skip it (no output)
  }

  // Print summary
  console.log('-----');
  console.log(`Files refreshed: ${refreshedCount}`);

  // Report any failures
  if (failedCount > 0) {
    console.log('');
    console.log(`Failed to refresh ${failedCount} file${failedCount === 1 ? '' : 's'}:`);
    for (const file of failedFiles) {
      console.log(`  - ${file}`);
    }
    console.log('');
    console.log('Tip: Check file permissions on the above files.');
  }
}

/**
 * Refresh files from source to target directory on macOS.
 * Uses the pure Node.js implementation since file operations work identically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_refresh_files_macos(args) {
  return do_refresh_files_nodejs(args);
}

/**
 * Refresh files from source to target directory on Ubuntu.
 * Uses the pure Node.js implementation since file operations work identically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_refresh_files_ubuntu(args) {
  return do_refresh_files_nodejs(args);
}

/**
 * Refresh files from source to target directory on Raspberry Pi OS.
 * Uses the pure Node.js implementation since file operations work identically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_refresh_files_raspbian(args) {
  return do_refresh_files_nodejs(args);
}

/**
 * Refresh files from source to target directory on Amazon Linux.
 * Uses the pure Node.js implementation since file operations work identically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_refresh_files_amazon_linux(args) {
  return do_refresh_files_nodejs(args);
}

/**
 * Refresh files from source to target directory on Windows Command Prompt.
 * Uses the pure Node.js implementation since file operations work identically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_refresh_files_cmd(args) {
  return do_refresh_files_nodejs(args);
}

/**
 * Refresh files from source to target directory on Windows PowerShell.
 * Uses the pure Node.js implementation since file operations work identically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_refresh_files_powershell(args) {
  return do_refresh_files_nodejs(args);
}

/**
 * Refresh files from source to target directory on Git Bash.
 * Uses the pure Node.js implementation since file operations work identically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_refresh_files_gitbash(args) {
  return do_refresh_files_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Compares files in the target directory with a source directory and copies
 * over files that exist in BOTH locations from the source. This is useful for
 * refreshing project files from a stable/reference copy.
 *
 * Key behavior:
 * - Only updates files that already exist in the target
 * - Does NOT add new files to the target
 * - Does NOT remove files from the target
 * - Skips node_modules, bower_components, and .git directories
 *
 * Usage:
 *   refresh-files /path/to/source               # Refresh current directory
 *   refresh-files /path/to/source /path/to/target  # Refresh specific directory
 *
 * Example scenario:
 *   You have a "golden" project with known-good configuration files.
 *   You want to update your working project with those configurations.
 *   Running refresh-files will copy only files that exist in both places.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_refresh_files(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_refresh_files_macos,
    'ubuntu': do_refresh_files_ubuntu,
    'debian': do_refresh_files_ubuntu,
    'raspbian': do_refresh_files_raspbian,
    'amazon_linux': do_refresh_files_amazon_linux,
    'rhel': do_refresh_files_amazon_linux,
    'fedora': do_refresh_files_ubuntu,
    'linux': do_refresh_files_ubuntu,
    'wsl': do_refresh_files_ubuntu,
    'cmd': do_refresh_files_cmd,
    'windows': do_refresh_files_cmd,
    'powershell': do_refresh_files_powershell,
    'gitbash': do_refresh_files_gitbash
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
  main: do_refresh_files,
  do_refresh_files,
  do_refresh_files_nodejs,
  do_refresh_files_macos,
  do_refresh_files_ubuntu,
  do_refresh_files_raspbian,
  do_refresh_files_amazon_linux,
  do_refresh_files_cmd,
  do_refresh_files_powershell,
  do_refresh_files_gitbash
};

if (require.main === module) {
  do_refresh_files(process.argv.slice(2));
}
