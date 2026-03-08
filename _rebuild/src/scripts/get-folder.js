#!/usr/bin/env node

/**
 * get-folder - Copy files from source to target directory with size comparison.
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   get-folder() {
 *       source="${1%/}/"
 *       target="${2%/}/"
 *       if command -v rsync &> /dev/null; then
 *           for file in "$source"*; do
 *               filename=$(basename "$file")
 *               if [ -f "$target$filename" ]; then
 *                   source_size=$(stat -c %s "$file")
 *                   target_size=$(stat -c %s "$target$filename")
 *                   if [ "$source_size" -eq "$target_size" ]; then
 *                       echo "Skipping $filename as it already exists and has the same size."
 *                   else
 *                       rsync -avP "$file" "$target"
 *                   fi
 *               else
 *                   rsync -avP "$file" "$target"
 *               fi
 *           done
 *       elif command -v robocopy &> /dev/null; then
 *           robocopy "$source" "$target" /E /Z /W:1 /R:3
 *       else
 *           echo "Error: Neither rsync nor robocopy command found."
 *           return 1
 *       fi
 *   }
 *
 * @module scripts/get-folder
 */

const fs = require('fs');
const path = require('path');
const os = require('../utils/common/os');
const shell = require('../utils/common/shell');

/**
 * Normalizes a directory path by ensuring it ends with a path separator.
 * This is important because rsync treats paths differently based on trailing slashes.
 *
 * @param {string} dirPath - The directory path to normalize
 * @returns {string} The path with a trailing separator
 */
function ensureTrailingSlash(dirPath) {
  const separator = path.sep;
  const normalizedPath = dirPath.replace(/[\/\\]+$/, '');  // Remove existing trailing slashes
  return normalizedPath + separator;
}

/**
 * Validates that a directory path exists and is actually a directory.
 *
 * @param {string} dirPath - The path to validate
 * @returns {{ valid: boolean, error: string|null }} Validation result
 */
function validateDirectory(dirPath) {
  try {
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return { valid: false, error: `Path exists but is not a directory: ${dirPath}` };
    }
    return { valid: true, error: null };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { valid: false, error: `Directory does not exist: ${dirPath}` };
    }
    return { valid: false, error: `Cannot access directory: ${dirPath} (${err.message})` };
  }
}

/**
 * Gets the size of a file in bytes.
 *
 * @param {string} filePath - The path to the file
 * @returns {number|null} The file size in bytes, or null if file doesn't exist
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return null;
  }
}

/**
 * Lists all files (not directories) in a directory.
 * Returns only top-level files, not recursive.
 *
 * @param {string} dirPath - The directory to list
 * @returns {string[]} Array of filenames (not full paths)
 */
function listFiles(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isFile())
      .map(entry => entry.name);
  } catch (err) {
    console.error(`Error reading directory: ${err.message}`);
    return [];
  }
}

/**
 * Checks if rsync is available on the system.
 *
 * @returns {boolean} True if rsync command is available
 */
function isRsyncAvailable() {
  return shell.commandExists('rsync');
}

/**
 * Checks if robocopy is available on the system.
 *
 * @returns {boolean} True if robocopy command is available
 */
function isRobocopyAvailable() {
  return shell.commandExists('robocopy');
}

/**
 * Displays usage information and examples.
 */
function showUsage() {
  console.error('Usage: get-folder <source-folder> <target-folder>');
  console.error('');
  console.error('Copies files from source to target directory, skipping files that');
  console.error('already exist in the target with the same size.');
  console.error('');
  console.error('Examples:');
  console.error('  get-folder /path/to/source/ /path/to/target/');
  console.error('  get-folder ~/Downloads/photos/ ~/Pictures/');
}

/**
 * Node.js implementation note:
 *
 * This script intentionally uses rsync (macOS/Linux) or robocopy (Windows)
 * instead of a pure Node.js implementation because:
 *
 * 1. rsync is battle-tested for decades with excellent file copying
 * 2. rsync handles edge cases (permissions, timestamps, partial transfers)
 * 3. rsync has progress reporting with -P (--progress --partial)
 * 4. robocopy is the Windows equivalent with similar reliability
 *
 * A pure Node.js implementation could be written using fs.copyFile() and
 * fs.stat(), but it would lack the robustness and progress reporting of
 * these dedicated tools.
 *
 * @param {string[]} args - Command line arguments (unused - this is a note)
 * @returns {Promise<void>}
 */
async function do_get_folder_nodejs(args) {
  // This function documents why we don't use pure Node.js for this task.
  // The platform-specific functions use rsync or robocopy because those tools
  // are superior for file copying with size comparison.
  throw new Error(
    'do_get_folder_nodejs should not be called directly. ' +
    'This script requires platform-specific tools (rsync or robocopy).'
  );
}

/**
 * Copies files from source to target on macOS using rsync.
 *
 * Iterates through each file in the source directory and:
 * - Skips files that exist in target with the same size
 * - Copies files using rsync with progress output for new/changed files
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Source folder path (required)
 * @param {string} args[1] - Target folder path (required)
 * @returns {Promise<void>}
 */
async function do_get_folder_macos(args) {
  // Validate arguments
  if (!args || args.length < 2) {
    console.error('Error: Both source and target folders are required.');
    console.error('');
    showUsage();
    process.exit(1);
  }

  const sourcePath = ensureTrailingSlash(args[0]);
  const targetPath = ensureTrailingSlash(args[1]);

  // Validate source directory exists
  const sourceValidation = validateDirectory(sourcePath.slice(0, -1));  // Remove trailing slash for validation
  if (!sourceValidation.valid) {
    console.error(`Error: ${sourceValidation.error}`);
    process.exit(1);
  }

  // Validate target directory exists
  const targetValidation = validateDirectory(targetPath.slice(0, -1));
  if (!targetValidation.valid) {
    console.error(`Error: ${targetValidation.error}`);
    process.exit(1);
  }

  // Check if rsync is available
  if (!isRsyncAvailable()) {
    console.error('Error: rsync is required but not installed.');
    console.error('Install it with: brew install rsync');
    process.exit(1);
  }

  console.log(`Source: ${sourcePath}`);
  console.log(`Target: ${targetPath}`);
  console.log('');

  // Get list of files in source directory
  const files = listFiles(sourcePath.slice(0, -1));

  if (files.length === 0) {
    console.log('No files found in source directory.');
    return;
  }

  let copiedCount = 0;
  let skippedCount = 0;

  // Process each file
  for (const filename of files) {
    const sourceFile = path.join(sourcePath, filename);
    const targetFile = path.join(targetPath, filename);

    // Check if target file exists
    const targetSize = getFileSize(targetFile);

    if (targetSize !== null) {
      // Target file exists - compare sizes
      const sourceSize = getFileSize(sourceFile);

      if (sourceSize === targetSize) {
        console.log(`Skipping ${filename} as it already exists and has the same size.`);
        skippedCount++;
        continue;
      }
    }

    // Copy file using rsync with progress
    console.log(`Copying ${filename}...`);
    const result = await shell.spawnAsync('rsync', [
      '-avP',
      sourceFile,
      targetPath
    ], {
      onStdout: (data) => process.stdout.write(data),
      onStderr: (data) => process.stderr.write(data)
    });

    if (result.code !== 0) {
      console.error(`Warning: Failed to copy ${filename}`);
    } else {
      copiedCount++;
    }
  }

  console.log('');
  console.log(`Done. Copied: ${copiedCount}, Skipped: ${skippedCount}`);
}

/**
 * Copies files from source to target on Ubuntu using rsync.
 *
 * Iterates through each file in the source directory and:
 * - Skips files that exist in target with the same size
 * - Copies files using rsync with progress output for new/changed files
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Source folder path (required)
 * @param {string} args[1] - Target folder path (required)
 * @returns {Promise<void>}
 */
async function do_get_folder_ubuntu(args) {
  // Validate arguments
  if (!args || args.length < 2) {
    console.error('Error: Both source and target folders are required.');
    console.error('');
    showUsage();
    process.exit(1);
  }

  const sourcePath = ensureTrailingSlash(args[0]);
  const targetPath = ensureTrailingSlash(args[1]);

  // Validate source directory exists
  const sourceValidation = validateDirectory(sourcePath.slice(0, -1));
  if (!sourceValidation.valid) {
    console.error(`Error: ${sourceValidation.error}`);
    process.exit(1);
  }

  // Validate target directory exists
  const targetValidation = validateDirectory(targetPath.slice(0, -1));
  if (!targetValidation.valid) {
    console.error(`Error: ${targetValidation.error}`);
    process.exit(1);
  }

  // Check if rsync is available
  if (!isRsyncAvailable()) {
    console.error('Error: rsync is required but not installed.');
    console.error('Install it with: sudo apt-get install rsync');
    process.exit(1);
  }

  console.log(`Source: ${sourcePath}`);
  console.log(`Target: ${targetPath}`);
  console.log('');

  // Get list of files in source directory
  const files = listFiles(sourcePath.slice(0, -1));

  if (files.length === 0) {
    console.log('No files found in source directory.');
    return;
  }

  let copiedCount = 0;
  let skippedCount = 0;

  // Process each file
  for (const filename of files) {
    const sourceFile = path.join(sourcePath, filename);
    const targetFile = path.join(targetPath, filename);

    // Check if target file exists
    const targetSize = getFileSize(targetFile);

    if (targetSize !== null) {
      // Target file exists - compare sizes
      const sourceSize = getFileSize(sourceFile);

      if (sourceSize === targetSize) {
        console.log(`Skipping ${filename} as it already exists and has the same size.`);
        skippedCount++;
        continue;
      }
    }

    // Copy file using rsync with progress
    console.log(`Copying ${filename}...`);
    const result = await shell.spawnAsync('rsync', [
      '-avP',
      sourceFile,
      targetPath
    ], {
      onStdout: (data) => process.stdout.write(data),
      onStderr: (data) => process.stderr.write(data)
    });

    if (result.code !== 0) {
      console.error(`Warning: Failed to copy ${filename}`);
    } else {
      copiedCount++;
    }
  }

  console.log('');
  console.log(`Done. Copied: ${copiedCount}, Skipped: ${skippedCount}`);
}

/**
 * Copies files from source to target on Raspberry Pi OS using rsync.
 *
 * Uses the same rsync approach as Ubuntu since Raspberry Pi OS is Debian-based.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Source folder path (required)
 * @param {string} args[1] - Target folder path (required)
 * @returns {Promise<void>}
 */
async function do_get_folder_raspbian(args) {
  // Raspbian uses the same rsync approach as Ubuntu
  return do_get_folder_ubuntu(args);
}

/**
 * Copies files from source to target on Amazon Linux using rsync.
 *
 * Uses rsync for reliable file copying with size comparison.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Source folder path (required)
 * @param {string} args[1] - Target folder path (required)
 * @returns {Promise<void>}
 */
async function do_get_folder_amazon_linux(args) {
  // Validate arguments
  if (!args || args.length < 2) {
    console.error('Error: Both source and target folders are required.');
    console.error('');
    showUsage();
    process.exit(1);
  }

  const sourcePath = ensureTrailingSlash(args[0]);
  const targetPath = ensureTrailingSlash(args[1]);

  // Validate source directory exists
  const sourceValidation = validateDirectory(sourcePath.slice(0, -1));
  if (!sourceValidation.valid) {
    console.error(`Error: ${sourceValidation.error}`);
    process.exit(1);
  }

  // Validate target directory exists
  const targetValidation = validateDirectory(targetPath.slice(0, -1));
  if (!targetValidation.valid) {
    console.error(`Error: ${targetValidation.error}`);
    process.exit(1);
  }

  // Check if rsync is available
  if (!isRsyncAvailable()) {
    console.error('Error: rsync is required but not installed.');
    console.error('Install it with: sudo dnf install rsync   (or: sudo yum install rsync)');
    process.exit(1);
  }

  console.log(`Source: ${sourcePath}`);
  console.log(`Target: ${targetPath}`);
  console.log('');

  // Get list of files in source directory
  const files = listFiles(sourcePath.slice(0, -1));

  if (files.length === 0) {
    console.log('No files found in source directory.');
    return;
  }

  let copiedCount = 0;
  let skippedCount = 0;

  // Process each file
  for (const filename of files) {
    const sourceFile = path.join(sourcePath, filename);
    const targetFile = path.join(targetPath, filename);

    // Check if target file exists
    const targetSize = getFileSize(targetFile);

    if (targetSize !== null) {
      // Target file exists - compare sizes
      const sourceSize = getFileSize(sourceFile);

      if (sourceSize === targetSize) {
        console.log(`Skipping ${filename} as it already exists and has the same size.`);
        skippedCount++;
        continue;
      }
    }

    // Copy file using rsync with progress
    console.log(`Copying ${filename}...`);
    const result = await shell.spawnAsync('rsync', [
      '-avP',
      sourceFile,
      targetPath
    ], {
      onStdout: (data) => process.stdout.write(data),
      onStderr: (data) => process.stderr.write(data)
    });

    if (result.code !== 0) {
      console.error(`Warning: Failed to copy ${filename}`);
    } else {
      copiedCount++;
    }
  }

  console.log('');
  console.log(`Done. Copied: ${copiedCount}, Skipped: ${skippedCount}`);
}

/**
 * Copies files from source to target on Windows Command Prompt using robocopy.
 *
 * Uses robocopy which is built into Windows. Robocopy has built-in logic to
 * skip files that haven't changed, similar to rsync.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Source folder path (required)
 * @param {string} args[1] - Target folder path (required)
 * @returns {Promise<void>}
 */
async function do_get_folder_cmd(args) {
  // Validate arguments
  if (!args || args.length < 2) {
    console.error('Error: Both source and target folders are required.');
    console.error('');
    console.error('Usage: get-folder <source-folder> <target-folder>');
    console.error('');
    console.error('Examples:');
    console.error('  get-folder C:\\source\\ D:\\target\\');
    console.error('  get-folder %USERPROFILE%\\Downloads\\ D:\\Backup\\');
    process.exit(1);
  }

  // Normalize paths - remove trailing slashes and convert to Windows format
  const sourcePath = args[0].replace(/[\/\\]+$/, '');
  const targetPath = args[1].replace(/[\/\\]+$/, '');

  // Validate source directory exists
  const sourceValidation = validateDirectory(sourcePath);
  if (!sourceValidation.valid) {
    console.error(`Error: ${sourceValidation.error}`);
    process.exit(1);
  }

  // Validate target directory exists
  const targetValidation = validateDirectory(targetPath);
  if (!targetValidation.valid) {
    console.error(`Error: ${targetValidation.error}`);
    process.exit(1);
  }

  console.log(`Source: ${sourcePath}`);
  console.log(`Target: ${targetPath}`);
  console.log('');

  // Use robocopy with options to skip unchanged files
  // /E = copy subdirectories including empty ones
  // /Z = copy files in restartable mode (useful for large files/network)
  // /W:1 = wait 1 second between retries
  // /R:3 = retry 3 times on failed copies
  // /XO = exclude older files (skips if target is same or newer)
  // /XX = exclude extra files (don't delete files that don't exist in source)
  const result = await shell.spawnAsync('robocopy', [
    sourcePath,
    targetPath,
    '/E',
    '/Z',
    '/W:1',
    '/R:3',
    '/XO'
  ], {
    onStdout: (data) => process.stdout.write(data),
    onStderr: (data) => process.stderr.write(data)
  });

  // robocopy exit codes: 0-7 are success (0=no files copied, 1=files copied, etc.)
  // Exit code 8+ indicates errors
  if (result.code >= 8) {
    console.error('');
    console.error('Error: Copy failed.');
    process.exit(1);
  }

  console.log('');
  console.log('Done.');
}

/**
 * Copies files from source to target on Windows PowerShell using robocopy.
 *
 * Uses the same robocopy approach as Windows CMD.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Source folder path (required)
 * @param {string} args[1] - Target folder path (required)
 * @returns {Promise<void>}
 */
async function do_get_folder_powershell(args) {
  // PowerShell uses the same robocopy approach as CMD
  return do_get_folder_cmd(args);
}

/**
 * Copies files from source to target in Git Bash using rsync or robocopy.
 *
 * Git Bash runs on Windows but can use rsync if it's installed via MSYS2.
 * Falls back to robocopy via PowerShell if rsync is not available.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Source folder path (required)
 * @param {string} args[1] - Target folder path (required)
 * @returns {Promise<void>}
 */
async function do_get_folder_gitbash(args) {
  // Validate arguments
  if (!args || args.length < 2) {
    console.error('Error: Both source and target folders are required.');
    console.error('');
    showUsage();
    process.exit(1);
  }

  // Check if rsync is available in Git Bash
  if (isRsyncAvailable()) {
    const sourcePath = ensureTrailingSlash(args[0]);
    const targetPath = ensureTrailingSlash(args[1]);

    // Validate source directory exists
    const sourceValidation = validateDirectory(sourcePath.slice(0, -1));
    if (!sourceValidation.valid) {
      console.error(`Error: ${sourceValidation.error}`);
      process.exit(1);
    }

    // Validate target directory exists
    const targetValidation = validateDirectory(targetPath.slice(0, -1));
    if (!targetValidation.valid) {
      console.error(`Error: ${targetValidation.error}`);
      process.exit(1);
    }

    console.log(`Source: ${sourcePath}`);
    console.log(`Target: ${targetPath}`);
    console.log('');

    // Get list of files in source directory
    const files = listFiles(sourcePath.slice(0, -1));

    if (files.length === 0) {
      console.log('No files found in source directory.');
      return;
    }

    let copiedCount = 0;
    let skippedCount = 0;

    // Process each file
    for (const filename of files) {
      const sourceFile = path.join(sourcePath, filename);
      const targetFile = path.join(targetPath, filename);

      // Check if target file exists
      const targetSize = getFileSize(targetFile);

      if (targetSize !== null) {
        // Target file exists - compare sizes
        const sourceSize = getFileSize(sourceFile);

        if (sourceSize === targetSize) {
          console.log(`Skipping ${filename} as it already exists and has the same size.`);
          skippedCount++;
          continue;
        }
      }

      // Copy file using rsync with progress
      console.log(`Copying ${filename}...`);
      const result = await shell.spawnAsync('rsync', [
        '-avP',
        sourceFile,
        targetPath
      ], {
        onStdout: (data) => process.stdout.write(data),
        onStderr: (data) => process.stderr.write(data)
      });

      if (result.code !== 0) {
        console.error(`Warning: Failed to copy ${filename}`);
      } else {
        copiedCount++;
      }
    }

    console.log('');
    console.log(`Done. Copied: ${copiedCount}, Skipped: ${skippedCount}`);
  } else if (isRobocopyAvailable()) {
    // Fall back to robocopy
    console.log('rsync not found, using robocopy...');
    console.log('');

    // Convert Git Bash paths to Windows paths for robocopy
    let sourcePath = args[0].replace(/[\/\\]+$/, '');
    let targetPath = args[1].replace(/[\/\\]+$/, '');

    // Convert /c/Users/... to C:\Users\... for robocopy
    if (sourcePath.match(/^\/[a-zA-Z]\//)) {
      sourcePath = sourcePath.replace(/^\/([a-zA-Z])\//, '$1:\\').replace(/\//g, '\\');
    }
    if (targetPath.match(/^\/[a-zA-Z]\//)) {
      targetPath = targetPath.replace(/^\/([a-zA-Z])\//, '$1:\\').replace(/\//g, '\\');
    }

    // Validate directories
    const sourceValidation = validateDirectory(sourcePath);
    if (!sourceValidation.valid) {
      console.error(`Error: ${sourceValidation.error}`);
      process.exit(1);
    }

    const targetValidation = validateDirectory(targetPath);
    if (!targetValidation.valid) {
      console.error(`Error: ${targetValidation.error}`);
      process.exit(1);
    }

    console.log(`Source: ${sourcePath}`);
    console.log(`Target: ${targetPath}`);
    console.log('');

    // Use robocopy
    const result = await shell.spawnAsync('robocopy', [
      sourcePath,
      targetPath,
      '/E',
      '/Z',
      '/W:1',
      '/R:3',
      '/XO'
    ], {
      onStdout: (data) => process.stdout.write(data),
      onStderr: (data) => process.stderr.write(data)
    });

    if (result.code >= 8) {
      console.error('');
      console.error('Error: Copy failed.');
      process.exit(1);
    }

    console.log('');
    console.log('Done.');
  } else {
    console.error('Error: Neither rsync nor robocopy command found.');
    console.error('');
    console.error('To use rsync in Git Bash, install it via MSYS2 packages.');
    console.error('Alternatively, robocopy should be available on Windows systems.');
    process.exit(1);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Copies files from a source directory to a target directory, skipping files
 * that already exist in the target with the same size. Uses rsync on Unix-like
 * systems (macOS, Linux) and robocopy on Windows.
 *
 * This is useful for:
 * - Syncing folders without copying unchanged files
 * - Incremental backups where only changed files need to be copied
 * - Copying large folders where some files already exist at the destination
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Source folder path (required)
 * @param {string} args[1] - Target folder path (required)
 * @returns {Promise<void>}
 */
async function do_get_folder(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_get_folder_macos,
    'ubuntu': do_get_folder_ubuntu,
    'debian': do_get_folder_ubuntu,
    'raspbian': do_get_folder_raspbian,
    'amazon_linux': do_get_folder_amazon_linux,
    'rhel': do_get_folder_amazon_linux,
    'fedora': do_get_folder_amazon_linux,
    'cmd': do_get_folder_cmd,
    'windows': do_get_folder_cmd,
    'powershell': do_get_folder_powershell,
    'gitbash': do_get_folder_gitbash,
    'wsl': do_get_folder_ubuntu
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms: macOS, Ubuntu, Debian, Raspberry Pi OS,');
    console.error('Amazon Linux, RHEL, Fedora, Windows, Git Bash, WSL');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_get_folder,
  do_get_folder,
  do_get_folder_nodejs,
  do_get_folder_macos,
  do_get_folder_ubuntu,
  do_get_folder_raspbian,
  do_get_folder_amazon_linux,
  do_get_folder_cmd,
  do_get_folder_powershell,
  do_get_folder_gitbash
};

if (require.main === module) {
  do_get_folder(process.argv.slice(2));
}
