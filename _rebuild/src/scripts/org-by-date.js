#!/usr/bin/env node

/**
 * org-by-date - Organize files into date-based folder structure
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   org-by-date(){
 *       ls -A1 | grep -E '[0-9]{4}-[0-9]{2}-[0-9]{2}' | while read -r line; do
 *           DNAME="$(echo $line | grep -Eo '[[:digit:]]{4}-[[:digit:]]{2}-[[:digit:]]{2}' | sed 's#-#/#g')"
 *           mkdir -p "./$DNAME"
 *           mv "$line" "./$DNAME/"
 *       done
 *   }
 *
 * This script scans files in a directory and moves any file containing a date
 * in the format YYYY-MM-DD in its filename into a nested folder structure:
 * YYYY/MM/DD/filename
 *
 * For example:
 *   - "2024-01-15-meeting-notes.txt" moves to "./2024/01/15/2024-01-15-meeting-notes.txt"
 *   - "photo_2023-12-25_holiday.jpg" moves to "./2023/12/25/photo_2023-12-25_holiday.jpg"
 *
 * @module scripts/org-by-date
 */

const fs = require('fs');
const path = require('path');
const os = require('../utils/common/os');

/**
 * Regular expression to match date patterns in filenames.
 * Matches YYYY-MM-DD format anywhere in the filename.
 *
 * Examples of matches:
 *   - "2024-01-15-notes.txt" matches "2024-01-15"
 *   - "photo_2023-12-25.jpg" matches "2023-12-25"
 *   - "backup-2022-06-30-final.zip" matches "2022-06-30"
 */
const DATE_PATTERN = /(\d{4})-(\d{2})-(\d{2})/;

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function is the core logic for organizing files by date. It:
 * 1. Reads all files from the target directory
 * 2. Finds files with date patterns in their names (YYYY-MM-DD)
 * 3. Creates the necessary folder structure (YYYY/MM/DD)
 * 4. Moves files into their corresponding date folders
 *
 * The implementation uses only Node.js built-in modules (fs, path) and works
 * identically on all platforms (macOS, Linux, Windows).
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path to organize (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_org_by_date_nodejs(args) {
  // Determine the target directory: use first argument or current working directory
  const targetDir = args[0] ? path.resolve(args[0]) : process.cwd();

  // Verify the target directory exists and is actually a directory
  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  const stats = fs.statSync(targetDir);
  if (!stats.isDirectory()) {
    console.error(`Error: Path is not a directory: ${targetDir}`);
    process.exit(1);
  }

  // Read all entries in the directory (files and subdirectories)
  // We use withFileTypes to efficiently check if each entry is a file
  let entries;
  try {
    entries = fs.readdirSync(targetDir, { withFileTypes: true });
  } catch (error) {
    console.error(`Error: Cannot read directory: ${targetDir}`);
    console.error(`  ${error.message}`);
    process.exit(1);
  }

  // Track how many files we moved for user feedback
  let movedCount = 0;
  let skippedCount = 0;

  // Process each file in the directory
  for (const entry of entries) {
    // Skip directories - we only process files
    if (!entry.isFile()) {
      continue;
    }

    const filename = entry.name;

    // Check if the filename contains a date pattern (YYYY-MM-DD)
    const match = filename.match(DATE_PATTERN);
    if (!match) {
      // No date found in filename, skip this file
      continue;
    }

    // Extract the date components from the regex match
    // match[0] is the full match "YYYY-MM-DD"
    // match[1] is the year "YYYY"
    // match[2] is the month "MM"
    // match[3] is the day "DD"
    const year = match[1];
    const month = match[2];
    const day = match[3];

    // Build the destination folder path: targetDir/YYYY/MM/DD
    const destFolder = path.join(targetDir, year, month, day);

    // Create the destination folder structure if it doesn't exist
    // recursive: true creates all parent directories as needed (like mkdir -p)
    try {
      fs.mkdirSync(destFolder, { recursive: true });
    } catch (error) {
      console.error(`Error: Cannot create directory: ${destFolder}`);
      console.error(`  ${error.message}`);
      skippedCount++;
      continue;
    }

    // Build the full source and destination paths
    const sourcePath = path.join(targetDir, filename);
    const destPath = path.join(destFolder, filename);

    // Check if a file with the same name already exists at the destination
    if (fs.existsSync(destPath)) {
      console.log(`Skipped: ${filename} (already exists at destination)`);
      skippedCount++;
      continue;
    }

    // Move the file to the destination folder
    // fs.renameSync is the cross-platform way to move files
    try {
      fs.renameSync(sourcePath, destPath);
      console.log(`Moved: ${filename} -> ${year}/${month}/${day}/`);
      movedCount++;
    } catch (error) {
      // renameSync can fail if source and dest are on different filesystems
      // In that case, we need to copy then delete
      if (error.code === 'EXDEV') {
        try {
          fs.copyFileSync(sourcePath, destPath);
          fs.unlinkSync(sourcePath);
          console.log(`Moved: ${filename} -> ${year}/${month}/${day}/`);
          movedCount++;
        } catch (copyError) {
          console.error(`Error: Cannot move file: ${filename}`);
          console.error(`  ${copyError.message}`);
          skippedCount++;
        }
      } else {
        console.error(`Error: Cannot move file: ${filename}`);
        console.error(`  ${error.message}`);
        skippedCount++;
      }
    }
  }

  // Print summary
  console.log('');
  console.log(`Organization complete:`);
  console.log(`  Files moved: ${movedCount}`);
  if (skippedCount > 0) {
    console.log(`  Files skipped: ${skippedCount}`);
  }
}

/**
 * Organize files by date on macOS.
 *
 * Delegates to the pure Node.js implementation since file operations
 * work identically across all platforms using Node.js built-in modules.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path to organize (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_org_by_date_macos(args) {
  return do_org_by_date_nodejs(args);
}

/**
 * Organize files by date on Ubuntu.
 *
 * Delegates to the pure Node.js implementation since file operations
 * work identically across all platforms using Node.js built-in modules.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path to organize (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_org_by_date_ubuntu(args) {
  return do_org_by_date_nodejs(args);
}

/**
 * Organize files by date on Raspberry Pi OS.
 *
 * Delegates to the pure Node.js implementation since file operations
 * work identically across all platforms using Node.js built-in modules.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path to organize (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_org_by_date_raspbian(args) {
  return do_org_by_date_nodejs(args);
}

/**
 * Organize files by date on Amazon Linux.
 *
 * Delegates to the pure Node.js implementation since file operations
 * work identically across all platforms using Node.js built-in modules.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path to organize (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_org_by_date_amazon_linux(args) {
  return do_org_by_date_nodejs(args);
}

/**
 * Organize files by date in Windows Command Prompt.
 *
 * Delegates to the pure Node.js implementation since file operations
 * work identically across all platforms using Node.js built-in modules.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path to organize (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_org_by_date_cmd(args) {
  return do_org_by_date_nodejs(args);
}

/**
 * Organize files by date in Windows PowerShell.
 *
 * Delegates to the pure Node.js implementation since file operations
 * work identically across all platforms using Node.js built-in modules.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path to organize (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_org_by_date_powershell(args) {
  return do_org_by_date_nodejs(args);
}

/**
 * Organize files by date in Git Bash on Windows.
 *
 * Delegates to the pure Node.js implementation since file operations
 * work identically across all platforms using Node.js built-in modules.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path to organize (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_org_by_date_gitbash(args) {
  return do_org_by_date_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Organizes files in a directory into subdirectories based on dates found in
 * their filenames. Files containing a date in the format YYYY-MM-DD anywhere
 * in their filename will be moved into a nested folder structure: YYYY/MM/DD/
 *
 * This is useful for organizing:
 * - Photos with date-stamped names
 * - Log files with dates
 * - Backup files
 * - Any files following a date naming convention
 *
 * Usage:
 *   org-by-date              # Organize files in current directory
 *   org-by-date /path/to/dir # Organize files in specified directory
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path to organize (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_org_by_date(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_org_by_date_macos,
    'ubuntu': do_org_by_date_ubuntu,
    'debian': do_org_by_date_ubuntu,
    'raspbian': do_org_by_date_raspbian,
    'amazon_linux': do_org_by_date_amazon_linux,
    'rhel': do_org_by_date_amazon_linux,
    'fedora': do_org_by_date_ubuntu,
    'linux': do_org_by_date_ubuntu,
    'wsl': do_org_by_date_ubuntu,
    'cmd': do_org_by_date_cmd,
    'windows': do_org_by_date_cmd,
    'powershell': do_org_by_date_powershell,
    'gitbash': do_org_by_date_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_org_by_date,
  do_org_by_date,
  do_org_by_date_nodejs,
  do_org_by_date_macos,
  do_org_by_date_ubuntu,
  do_org_by_date_raspbian,
  do_org_by_date_amazon_linux,
  do_org_by_date_cmd,
  do_org_by_date_powershell,
  do_org_by_date_gitbash
};

if (require.main === module) {
  do_org_by_date(process.argv.slice(2));
}
