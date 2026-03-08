#!/usr/bin/env node

/**
 * rename-files-with-date - Rename files containing dates to a standardized format
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   rename-files-with-date-in-name() (
 *       rename_file() (
 *           filePath=$(dirname "${1%/}")
 *           fileName=$(basename "$1")
 *           newFilePath="${filePath}/$(printf "%s" "$fileName" | sed 's/[^0-9]*\([0-9]\{4\}\)[_-]\{0,1\}\([0-9]\{2\}\)[_-]\{0,1\}\([0-9]\{2\}\)[_-]\{0,1\}\( at \)\{0,1\}\([0-9]\{2\}\)[_.-]\{0,1\}\([0-9]\{2\}\)[_.-]\{0,1\}\([0-9]\{2\}\).*\(\..*\)$/\1-\2-\3 \5.\6.\7\8/')"
 *           if [ "$newFilePath" != "$1" ]; then
 *              mv -f "$1" "$newFilePath"
 *           fi
 *       )
 *       for filePath in "${@:-.}"; do
 *           if [ -d "$filePath" ]; then
 *               find "${filePath%/}" -type f -depth 1 -print | while read -r f; do
 *                   rename_file "$f"
 *               done
 *           elif [ -f "$filePath" ]; then
 *               rename_file "$filePath"
 *           fi
 *       done
 *   )
 *
 * This script renames files containing dates in their filenames to a standardized
 * format: "YYYY-MM-DD HH.MM.SS.ext". It handles various input formats commonly
 * produced by cameras, screenshots, and messaging apps.
 *
 * Supported input formats:
 *   - 20200505_050505.dng         -> 2020-05-05 05.05.05.dng
 *   - Screenshot 2020-01-02 at 03.04.05.png -> 2020-01-02 03.04.05.png
 *   - Screenshot_20201010-101010_Something.jpg -> 2020-10-10 10.10.10.jpg
 *   - signal-2020-05-06-07-08-09-123.mp4 -> 2020-05-06 07.08.09.mp4
 *   - IMG_20201231_235959.jpg     -> 2020-12-31 23.59.59.jpg
 *   - VID_20201231_235959.mp4     -> 2020-12-31 23.59.59.mp4
 *
 * Usage:
 *   rename-files-with-date                           # Process current directory
 *   rename-files-with-date ./photos                  # Process specific directory
 *   rename-files-with-date file1.jpg file2.png      # Process specific files
 *   rename-files-with-date ./photos ./videos file.jpg  # Mix of directories and files
 *
 * @module scripts/rename-files-with-date
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');

/**
 * Regular expression pattern to extract date and time components from filenames.
 *
 * This pattern matches various date/time formats found in filenames:
 * - Prefix: Any non-digit characters (captured to be discarded)
 * - Year: 4 digits (YYYY)
 * - Optional separator: - or _
 * - Month: 2 digits (MM)
 * - Optional separator: - or _
 * - Day: 2 digits (DD)
 * - Optional separator: - or _ or space or space followed by "at "
 * - Hour: 2 digits (HH)
 * - Optional separator: . or - or _
 * - Minute: 2 digits (MM)
 * - Optional separator: . or - or _
 * - Second: 2 digits (SS)
 * - Suffix: Any remaining characters before extension
 * - Extension: .xxx (file extension)
 *
 * Groups:
 *   1: Year (YYYY)
 *   2: Month (MM)
 *   3: Day (DD)
 *   4: Hour (HH)
 *   5: Minute (MM)
 *   6: Second (SS)
 *   7: Extension (including the dot)
 */
const DATE_PATTERN = /^[^0-9]*(\d{4})[_-]?(\d{2})[_-]?(\d{2})(?:[_-]|\s?at\s|\s)?(\d{2})[._-]?(\d{2})[._-]?(\d{2}).*(\.[^.]+)$/i;

/**
 * Attempts to parse a filename and extract date/time components.
 *
 * This function analyzes the filename to find embedded date and time information.
 * If found, it constructs a new standardized filename in the format:
 * "YYYY-MM-DD HH.MM.SS.ext"
 *
 * The function handles various input formats commonly produced by:
 * - Digital cameras (IMG_20201231_235959.jpg)
 * - macOS screenshots (Screenshot 2020-01-02 at 03.04.05.png)
 * - Android screenshots (Screenshot_20201010-101010_App.jpg)
 * - Signal/WhatsApp media (signal-2020-05-06-07-08-09-123.mp4)
 * - Video recordings (VID_20201231_235959.mp4)
 *
 * @param {string} fileName - The original filename (without directory path)
 * @returns {string|null} The new filename if pattern matches, null otherwise
 *
 * @example
 * parseFileName("IMG_20201231_235959.jpg");
 * // Returns: "2020-12-31 23.59.59.jpg"
 *
 * @example
 * parseFileName("readme.txt");
 * // Returns: null (no date pattern found)
 */
function parseFileName(fileName) {
  const match = fileName.match(DATE_PATTERN);

  if (!match) {
    // No date pattern found in filename
    return null;
  }

  // Extract captured groups
  const [, year, month, day, hour, minute, second, extension] = match;

  // Basic validation of date/time values to catch false positives
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  const hourNum = parseInt(hour, 10);
  const minuteNum = parseInt(minute, 10);
  const secondNum = parseInt(second, 10);

  // Validate ranges (loose validation - we don't check days per month)
  if (monthNum < 1 || monthNum > 12) return null;
  if (dayNum < 1 || dayNum > 31) return null;
  if (hourNum > 23) return null;
  if (minuteNum > 59) return null;
  if (secondNum > 59) return null;

  // Construct the standardized filename
  // Format: YYYY-MM-DD HH.MM.SS.ext
  const newFileName = `${year}-${month}-${day} ${hour}.${minute}.${second}${extension.toLowerCase()}`;

  return newFileName;
}

/**
 * Renames a single file if it contains a date pattern in its filename.
 *
 * This function:
 * 1. Extracts the directory and filename from the path
 * 2. Attempts to parse the filename for date components
 * 3. If a date is found, renames the file to the standardized format
 * 4. If the new filename already exists, it skips to avoid overwriting
 * 5. Reports the action taken (renamed, skipped, or no date found)
 *
 * The function is idempotent - running it multiple times on the same file
 * produces the same result. Already-renamed files won't be renamed again.
 *
 * @param {string} filePath - Absolute path to the file to process
 * @returns {{ status: 'renamed'|'skipped'|'exists'|'no-date', oldName: string, newName: string|null }}
 *
 * @example
 * renameFile('/photos/IMG_20201231_235959.jpg');
 * // Returns: { status: 'renamed', oldName: 'IMG_20201231_235959.jpg', newName: '2020-12-31 23.59.59.jpg' }
 */
function renameFile(filePath) {
  const dirPath = path.dirname(filePath);
  const fileName = path.basename(filePath);

  // Attempt to parse the filename for date components
  const newFileName = parseFileName(fileName);

  // If no date pattern found, nothing to do
  if (!newFileName) {
    return {
      status: 'no-date',
      oldName: fileName,
      newName: null
    };
  }

  // If the filename is already in the correct format, skip it
  if (newFileName === fileName) {
    return {
      status: 'skipped',
      oldName: fileName,
      newName: newFileName
    };
  }

  // Construct the new full path
  const newFilePath = path.join(dirPath, newFileName);

  // Check if a file with the new name already exists
  // This prevents accidental data loss from overwriting
  if (fs.existsSync(newFilePath)) {
    return {
      status: 'exists',
      oldName: fileName,
      newName: newFileName
    };
  }

  // Perform the rename operation
  try {
    fs.renameSync(filePath, newFilePath);
    return {
      status: 'renamed',
      oldName: fileName,
      newName: newFileName
    };
  } catch (error) {
    // Handle rename errors (permission denied, file locked, etc.)
    console.error(`  Error renaming "${fileName}": ${error.message}`);
    return {
      status: 'error',
      oldName: fileName,
      newName: newFileName,
      error: error.message
    };
  }
}

/**
 * Gets all files in a directory (non-recursive, depth 1 only).
 *
 * This function mirrors the original bash behavior which used:
 *   find "${filePath%/}" -type f -depth 1 -print
 *
 * The -depth 1 means only immediate children, not files in subdirectories.
 * This is intentional to give users control over which directories to process.
 *
 * @param {string} dirPath - Absolute path to the directory
 * @returns {string[]} Array of absolute paths to files in the directory
 */
function getFilesInDirectory(dirPath) {
  const files = [];

  try {
    // Read directory contents with file type information
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Only include regular files (not directories, symlinks, etc.)
      if (entry.isFile()) {
        files.push(path.join(dirPath, entry.name));
      }
    }
  } catch (error) {
    console.error(`Warning: Could not read directory "${dirPath}": ${error.message}`);
  }

  return files;
}

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function processes the given paths (files or directories) and renames
 * files containing date patterns to a standardized format. It uses only
 * Node.js built-in modules (fs, path) for full cross-platform compatibility.
 *
 * Why Node.js instead of shell commands:
 * - Works identically on macOS, Linux, and Windows
 * - No shell escaping issues with special characters in filenames
 * - Better error handling and reporting
 * - The regex-based date parsing is more readable than sed
 *
 * @param {string[]} args - Command line arguments (paths to process)
 * @returns {Promise<void>}
 */
async function do_rename_files_with_date_nodejs(args) {
  // Default to current directory if no arguments provided
  // This matches the original: for filePath in "${@:-.}"
  const paths = args.length > 0 ? args : ['.'];

  // Counters for summary
  let totalFiles = 0;
  let renamedCount = 0;
  let skippedCount = 0;
  let existsCount = 0;
  let noDateCount = 0;
  let errorCount = 0;

  console.log('Scanning for files with dates in filenames...');
  console.log('');

  // Process each provided path
  for (const inputPath of paths) {
    // Resolve to absolute path
    const absolutePath = path.resolve(inputPath);

    // Check if the path exists
    if (!fs.existsSync(absolutePath)) {
      console.error(`Warning: Path does not exist: ${inputPath}`);
      continue;
    }

    // Get file stats to determine if it's a file or directory
    const stats = fs.statSync(absolutePath);

    let filesToProcess = [];

    if (stats.isDirectory()) {
      // Process all files in the directory (non-recursive)
      console.log(`Processing directory: ${inputPath}`);
      filesToProcess = getFilesInDirectory(absolutePath);
    } else if (stats.isFile()) {
      // Process a single file
      filesToProcess = [absolutePath];
    } else {
      // Skip non-file/non-directory entries (symlinks, etc.)
      console.log(`Skipping: ${inputPath} (not a file or directory)`);
      continue;
    }

    // Process each file
    for (const filePath of filesToProcess) {
      totalFiles++;
      const result = renameFile(filePath);

      switch (result.status) {
        case 'renamed':
          console.log(`  Renamed: "${result.oldName}" -> "${result.newName}"`);
          renamedCount++;
          break;
        case 'skipped':
          // Already in correct format - silently skip
          skippedCount++;
          break;
        case 'exists':
          console.log(`  Skipped: "${result.oldName}" (target "${result.newName}" already exists)`);
          existsCount++;
          break;
        case 'no-date':
          // No date pattern - silently skip
          noDateCount++;
          break;
        case 'error':
          errorCount++;
          break;
      }
    }
  }

  // Print summary
  console.log('');
  console.log('---');
  console.log(`Total files scanned: ${totalFiles}`);
  console.log(`Renamed:             ${renamedCount}`);

  // Only show these counts if they're non-zero and relevant
  if (existsCount > 0) {
    console.log(`Skipped (exists):    ${existsCount}`);
  }
  if (skippedCount > 0) {
    console.log(`Already formatted:   ${skippedCount}`);
  }
  if (errorCount > 0) {
    console.log(`Errors:              ${errorCount}`);
  }

  // Show count of files without dates only if user might expect them
  const processedCount = renamedCount + existsCount + skippedCount + errorCount;
  if (processedCount === 0 && noDateCount > 0) {
    console.log(`No files with date patterns found.`);
  }
}

/**
 * Renames files containing dates on macOS.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on macOS. No platform-specific code is needed.
 *
 * Common macOS filename formats handled:
 * - Screenshot 2020-01-02 at 03.04.05.png (macOS screenshots)
 * - IMG_1234.HEIC (iPhone photos - note: these don't have dates in filename)
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_rename_files_with_date_macos(args) {
  return do_rename_files_with_date_nodejs(args);
}

/**
 * Renames files containing dates on Ubuntu.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Linux. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_rename_files_with_date_ubuntu(args) {
  return do_rename_files_with_date_nodejs(args);
}

/**
 * Renames files containing dates on Raspberry Pi OS.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Linux. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_rename_files_with_date_raspbian(args) {
  return do_rename_files_with_date_nodejs(args);
}

/**
 * Renames files containing dates on Amazon Linux.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Linux. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_rename_files_with_date_amazon_linux(args) {
  return do_rename_files_with_date_nodejs(args);
}

/**
 * Renames files containing dates on Windows (Command Prompt).
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Windows. No platform-specific code is needed.
 *
 * Note: Windows filenames cannot contain certain characters (: ? " < > |),
 * but our output format (YYYY-MM-DD HH.MM.SS.ext) uses only safe characters.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_rename_files_with_date_cmd(args) {
  return do_rename_files_with_date_nodejs(args);
}

/**
 * Renames files containing dates on Windows (PowerShell).
 *
 * Uses the pure Node.js implementation since file operations work
 * identically on Windows. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_rename_files_with_date_powershell(args) {
  return do_rename_files_with_date_nodejs(args);
}

/**
 * Renames files containing dates in Git Bash on Windows.
 *
 * Uses the pure Node.js implementation since file operations work
 * identically regardless of the shell being used.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_rename_files_with_date_gitbash(args) {
  return do_rename_files_with_date_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "rename-files-with-date" command standardizes filenames that contain date
 * and time information. This is useful for organizing media files from various
 * sources (cameras, phones, screenshots) into a consistent naming scheme.
 *
 * Output format: YYYY-MM-DD HH.MM.SS.ext
 *
 * This format is:
 * - Human-readable
 * - Sorts chronologically in file browsers
 * - Uses only characters safe for all operating systems
 * - Preserves the original file extension
 *
 * The command is idempotent - running it multiple times produces the same
 * result. Files already in the target format are skipped.
 *
 * @param {string[]} args - Command line arguments (paths to process)
 * @returns {Promise<void>}
 */
async function do_rename_files_with_date(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_rename_files_with_date_macos,
    'ubuntu': do_rename_files_with_date_ubuntu,
    'debian': do_rename_files_with_date_ubuntu,
    'raspbian': do_rename_files_with_date_raspbian,
    'amazon_linux': do_rename_files_with_date_amazon_linux,
    'rhel': do_rename_files_with_date_amazon_linux,
    'fedora': do_rename_files_with_date_ubuntu,
    'linux': do_rename_files_with_date_ubuntu,
    'wsl': do_rename_files_with_date_ubuntu,
    'cmd': do_rename_files_with_date_cmd,
    'windows': do_rename_files_with_date_cmd,
    'powershell': do_rename_files_with_date_powershell,
    'gitbash': do_rename_files_with_date_gitbash
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
  main: do_rename_files_with_date,
  do_rename_files_with_date,
  do_rename_files_with_date_nodejs,
  do_rename_files_with_date_macos,
  do_rename_files_with_date_ubuntu,
  do_rename_files_with_date_raspbian,
  do_rename_files_with_date_amazon_linux,
  do_rename_files_with_date_cmd,
  do_rename_files_with_date_powershell,
  do_rename_files_with_date_gitbash
};

if (require.main === module) {
  do_rename_files_with_date(process.argv.slice(2));
}
