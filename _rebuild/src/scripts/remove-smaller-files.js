#!/usr/bin/env node

/**
 * remove-smaller-files - Compare directories and remove smaller duplicates
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   remove_smaller_files(){
 *       LEFT_DIR="$PWD"
 *       RIGHT_DIR="$*"
 *       echo "LEFT : $LEFT_DIR"
 *       echo "RIGHT: $RIGHT_DIR"
 *       files="$(find -L "$LEFT_DIR" -type f)"
 *       echo "$files" | while read file; do
 *           FILE_NAME=${file#$LEFT_DIR}
 *           LEFT_FILE="$file"
 *           RIGHT_FILE="$RIGHT_DIR""$FILE_NAME"
 *           if [ -f "$LEFT_FILE" ]; then
 *               if [ -f "$RIGHT_FILE" ]; then
 *                   LEFT_SIZE=( $( ls -Lon "$LEFT_FILE" ) )
 *                   LEFT_BYTES=${LEFT_SIZE[3]}
 *                   RIGHT_SIZE=( $( ls -Lon "$RIGHT_FILE" ) )
 *                   RIGHT_BYTES=${RIGHT_SIZE[3]}
 *                   if [ "$LEFT_BYTES" -gt "$RIGHT_BYTES" ]; then
 *                       echo "REMOVED: $RIGHT_FILE"
 *                       eval "rm \"$RIGHT_FILE\""
 *                   elif [ "$RIGHT_BYTES" -gt "$LEFT_BYTES" ]; then
 *                       echo "REMOVED: $LEFT_FILE"
 *                       eval "rm \"$LEFT_FILE\""
 *                   else
 *                       echo "SKIPPED: $FILE_NAME (same size)"
 *                   fi
 *               fi
 *           fi
 *       done
 *   }
 *
 * This script compares files between two directories (the current directory
 * and a comparison directory). For each file that exists in both locations,
 * it removes the smaller version, keeping the larger one. If both files are
 * the same size, neither is removed.
 *
 * Use cases:
 * - Deduplicating backups where you want to keep the most complete version
 * - Cleaning up after partial file transfers
 * - Comparing original vs compressed versions and removing the smaller one
 *
 * Usage:
 *   remove-smaller-files /path/to/comparison/directory
 *
 * The script will:
 * 1. Scan all files in the current directory (recursively)
 * 2. For each file, check if a matching file exists in the comparison directory
 * 3. If both exist, compare sizes and remove the smaller one
 * 4. If sizes are equal, skip (no removal)
 *
 * @module scripts/remove-smaller-files
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');

/**
 * Recursively collects all files in a directory.
 *
 * This function walks the entire directory tree and returns the paths
 * of all regular files found. Symbolic links are followed (like the
 * original bash function using `find -L`).
 *
 * @param {string} dir - The directory to scan (absolute path)
 * @param {string} baseDir - The base directory for computing relative paths
 * @returns {string[]} Array of relative file paths from the base directory
 *
 * @example
 * const files = getAllFiles('/home/user/project', '/home/user/project');
 * // Returns: ['README.md', 'src/index.js', 'src/utils/helper.js']
 */
function getAllFiles(dir, baseDir) {
  const results = [];

  /**
   * Inner recursive function that walks the directory tree.
   * @param {string} currentDir - The current directory being processed
   */
  function walk(currentDir) {
    let entries;

    try {
      // Read directory contents with file type information
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

      try {
        // Use stat (not lstat) to follow symbolic links like `find -L`
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          // Recursively walk subdirectories
          walk(fullPath);
        } else if (stats.isFile()) {
          // Compute the relative path from the base directory
          const relativePath = path.relative(baseDir, fullPath);
          results.push(relativePath);
        }
      } catch (error) {
        // Skip files we cannot stat (broken symlinks, permission issues)
        if (error.code !== 'ENOENT' && error.code !== 'EACCES') {
          console.error(`Warning: Could not access ${fullPath}: ${error.message}`);
        }
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Gets the size of a file in bytes.
 *
 * @param {string} filePath - Absolute path to the file
 * @returns {number|null} Size in bytes, or null if file cannot be accessed
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return null;
  }
}

/**
 * Formats file size for human-readable output.
 *
 * Converts bytes to a human-readable string with appropriate units
 * (B, KB, MB, GB).
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
 * Safely removes a file.
 *
 * @param {string} filePath - Absolute path to the file to remove
 * @returns {boolean} True if successfully removed, false otherwise
 */
function removeFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function uses only Node.js built-in modules (fs, path) to:
 * 1. Scan all files in the current directory (left directory)
 * 2. For each file, check if it exists in the comparison directory (right directory)
 * 3. Compare file sizes and remove the smaller version
 * 4. Report statistics about what was removed
 *
 * This approach is preferred over shelling out to `find` and `ls` because:
 * - It works identically on all platforms (macOS, Linux, Windows)
 * - Node.js fs operations are fast and reliable
 * - We avoid shell escaping and quoting issues with special characters in filenames
 * - Better error handling and reporting
 *
 * The algorithm:
 * - LEFT directory = current working directory
 * - RIGHT directory = the comparison directory provided as argument
 * - For each file in LEFT that also exists in RIGHT:
 *   - If LEFT is larger: remove RIGHT
 *   - If RIGHT is larger: remove LEFT
 *   - If same size: skip (no removal)
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Path to the comparison directory (required)
 * @returns {Promise<void>}
 */
async function do_remove_smaller_files_nodejs(args) {
  // The comparison directory is required as the first argument
  const rightDirArg = args[0];

  if (!rightDirArg) {
    console.error('Error: Comparison directory path is required.');
    console.error('');
    console.error('Usage: remove-smaller-files /path/to/comparison/directory');
    console.error('');
    console.error('This command compares files in the current directory with files');
    console.error('in the comparison directory. For each file that exists in both');
    console.error('locations, it removes the smaller version.');
    process.exit(1);
  }

  // Resolve paths to absolute paths
  const leftDir = process.cwd();
  const rightDir = path.resolve(rightDirArg);

  // Verify the comparison directory exists
  try {
    const stats = fs.statSync(rightDir);
    if (!stats.isDirectory()) {
      console.error(`Error: '${rightDir}' is not a directory.`);
      process.exit(1);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: Comparison directory '${rightDir}' does not exist.`);
    } else {
      console.error(`Error: Cannot access comparison directory '${rightDir}': ${error.message}`);
    }
    process.exit(1);
  }

  // Print the directories being compared (like the original)
  console.log(`LEFT : ${leftDir}`);
  console.log(`RIGHT: ${rightDir}`);
  console.log('');

  // Scan all files in the left directory
  console.log('Scanning for files...');
  const leftFiles = getAllFiles(leftDir, leftDir);

  if (leftFiles.length === 0) {
    console.log('No files found in the current directory.');
    return;
  }

  console.log(`Found ${leftFiles.length} file(s) in left directory.`);
  console.log('');
  console.log('Comparing files and removing smaller versions...');
  console.log('');

  // Statistics tracking
  let comparedCount = 0;
  let skippedSameSizeCount = 0;
  let removedFromLeftCount = 0;
  let removedFromRightCount = 0;
  let removedFromLeftBytes = 0;
  let removedFromRightBytes = 0;
  let onlyInLeftCount = 0;
  let errorCount = 0;

  // Process each file
  for (const relativePath of leftFiles) {
    const leftFile = path.join(leftDir, relativePath);
    const rightFile = path.join(rightDir, relativePath);

    // Check if the file exists in the right directory
    const rightSize = getFileSize(rightFile);
    if (rightSize === null) {
      // File only exists in left directory - nothing to compare
      onlyInLeftCount++;
      continue;
    }

    // Get the size of the left file
    const leftSize = getFileSize(leftFile);
    if (leftSize === null) {
      // Left file disappeared during processing (rare)
      errorCount++;
      continue;
    }

    comparedCount++;

    // Compare sizes and decide which to remove
    if (leftSize > rightSize) {
      // Left is larger - remove the smaller right file
      const success = removeFile(rightFile);
      if (success) {
        console.log(`REMOVED: ${rightFile} (${formatSize(rightSize)} < ${formatSize(leftSize)})`);
        removedFromRightCount++;
        removedFromRightBytes += rightSize;
      } else {
        console.error(`ERROR: Could not remove ${rightFile}`);
        errorCount++;
      }
    } else if (rightSize > leftSize) {
      // Right is larger - remove the smaller left file
      const success = removeFile(leftFile);
      if (success) {
        console.log(`REMOVED: ${leftFile} (${formatSize(leftSize)} < ${formatSize(rightSize)})`);
        removedFromLeftCount++;
        removedFromLeftBytes += leftSize;
      } else {
        console.error(`ERROR: Could not remove ${leftFile}`);
        errorCount++;
      }
    } else {
      // Same size - skip (like the original)
      console.log(`SKIPPED: ${relativePath} (same size: ${formatSize(leftSize)})`);
      skippedSameSizeCount++;
    }
  }

  // Print summary
  console.log('');
  console.log('--- Summary ---');
  console.log(`Files compared: ${comparedCount}`);
  console.log(`Files only in left directory: ${onlyInLeftCount}`);
  console.log(`Skipped (same size): ${skippedSameSizeCount}`);
  console.log(`Removed from LEFT:  ${removedFromLeftCount} (${formatSize(removedFromLeftBytes)})`);
  console.log(`Removed from RIGHT: ${removedFromRightCount} (${formatSize(removedFromRightBytes)})`);
  const totalRemoved = removedFromLeftCount + removedFromRightCount;
  const totalBytes = removedFromLeftBytes + removedFromRightBytes;
  console.log(`Total removed: ${totalRemoved} file(s) (${formatSize(totalBytes)})`);

  if (errorCount > 0) {
    console.log(`Errors: ${errorCount}`);
  }
}

/**
 * Compares files between current directory and a comparison directory on macOS,
 * removing the smaller version of each duplicate file pair.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on macOS. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_remove_smaller_files_macos(args) {
  return do_remove_smaller_files_nodejs(args);
}

/**
 * Compares files between current directory and a comparison directory on Ubuntu,
 * removing the smaller version of each duplicate file pair.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Linux. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_remove_smaller_files_ubuntu(args) {
  return do_remove_smaller_files_nodejs(args);
}

/**
 * Compares files between current directory and a comparison directory on Raspberry Pi OS,
 * removing the smaller version of each duplicate file pair.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Linux. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_remove_smaller_files_raspbian(args) {
  return do_remove_smaller_files_nodejs(args);
}

/**
 * Compares files between current directory and a comparison directory on Amazon Linux,
 * removing the smaller version of each duplicate file pair.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Linux. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_remove_smaller_files_amazon_linux(args) {
  return do_remove_smaller_files_nodejs(args);
}

/**
 * Compares files between current directory and a comparison directory on Windows (CMD),
 * removing the smaller version of each duplicate file pair.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Windows. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_remove_smaller_files_cmd(args) {
  return do_remove_smaller_files_nodejs(args);
}

/**
 * Compares files between current directory and a comparison directory on Windows PowerShell,
 * removing the smaller version of each duplicate file pair.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Windows. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_remove_smaller_files_powershell(args) {
  return do_remove_smaller_files_nodejs(args);
}

/**
 * Compares files between current directory and a comparison directory on Git Bash,
 * removing the smaller version of each duplicate file pair.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically regardless of the shell being used. No platform-specific
 * code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_remove_smaller_files_gitbash(args) {
  return do_remove_smaller_files_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "remove-smaller-files" command compares files between the current directory
 * and a comparison directory. For each file that exists in both locations, it
 * removes the smaller version, keeping the larger one. If both files are the
 * same size, neither is removed.
 *
 * This is useful for:
 * - Deduplicating backups where you want to keep the most complete version
 * - Cleaning up after partial file transfers
 * - Comparing original vs compressed versions and removing the smaller one
 *
 * Usage:
 *   remove-smaller-files /path/to/comparison/directory
 *
 * The command is idempotent - running it multiple times produces the same
 * result (files of equal size are never removed, and once a smaller file
 * is removed, subsequent runs will have nothing to compare).
 *
 * WARNING: This command permanently deletes files. Use with caution and
 * consider backing up important data before running.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Path to the comparison directory (required)
 * @returns {Promise<void>}
 */
async function do_remove_smaller_files(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_remove_smaller_files_macos,
    'ubuntu': do_remove_smaller_files_ubuntu,
    'debian': do_remove_smaller_files_ubuntu,
    'raspbian': do_remove_smaller_files_raspbian,
    'amazon_linux': do_remove_smaller_files_amazon_linux,
    'rhel': do_remove_smaller_files_amazon_linux,
    'fedora': do_remove_smaller_files_ubuntu,
    'linux': do_remove_smaller_files_ubuntu,
    'wsl': do_remove_smaller_files_ubuntu,
    'cmd': do_remove_smaller_files_cmd,
    'windows': do_remove_smaller_files_cmd,
    'powershell': do_remove_smaller_files_powershell,
    'gitbash': do_remove_smaller_files_gitbash
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
  main: do_remove_smaller_files,
  do_remove_smaller_files,
  do_remove_smaller_files_nodejs,
  do_remove_smaller_files_macos,
  do_remove_smaller_files_ubuntu,
  do_remove_smaller_files_raspbian,
  do_remove_smaller_files_amazon_linux,
  do_remove_smaller_files_cmd,
  do_remove_smaller_files_powershell,
  do_remove_smaller_files_gitbash
};

if (require.main === module) {
  do_remove_smaller_files(process.argv.slice(2));
}
