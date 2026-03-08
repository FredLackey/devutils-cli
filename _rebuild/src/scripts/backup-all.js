#!/usr/bin/env node

/**
 * backup-all - Backup multiple user directories using rsync
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   backup-all(){
 *       excludes=".terraform,.android,.atom,.bash_sessions,bower_components,.cache,.cups,.dropbox,.DS_Store,.git,_gsdata_,.idea,node_modules,.next,.npm,.nvm,\$RECYCLE.BIN,System\ Volume\ Information,.TemporaryItems,.Trash,.Trashes,.tmp,.viminfo"
 *
 *       backupdir="$*"
 *       backupcmd="rsync -arv --progress --no-links --exclude={$excludes} ~/Downloads $backupdir"
 *       eval "$backupcmd"
 *
 *       backupdir="$*$(date +"%Y%m%d%H%M%S")/"
 *       backupcmd="rsync -arv --progress --no-links --exclude={$excludes} ~/Backups ~/Desktop ~/Documents ~/Microsoft ~/Movies ~/Music ~/Pictures ~/Public ~/Source ~/Templates ~/Temporary ~/Videos $backupdir"
 *       mkdir -p "$backupdir"
 *       eval "$backupcmd"
 *
 *       cd "$backupdir"
 *       ls -la
 *   }
 *
 * @module scripts/backup-all
 */

const fs = require('fs');
const path = require('path');
const os = require('../utils/common/os');
const shell = require('../utils/common/shell');

/**
 * Directories and files to exclude from backup.
 * These are common development artifacts, caches, and system files
 * that should not be included in user backups.
 */
const EXCLUDES = [
  '.terraform',
  '.android',
  '.atom',
  '.bash_sessions',
  'bower_components',
  '.cache',
  '.cups',
  '.dropbox',
  '.DS_Store',
  '.git',
  '_gsdata_',
  '.idea',
  'node_modules',
  '.next',
  '.npm',
  '.nvm',
  '$RECYCLE.BIN',
  'System Volume Information',
  '.TemporaryItems',
  '.Trash',
  '.Trashes',
  '.tmp',
  '.viminfo'
];

/**
 * User directories to back up with a timestamp.
 * These are common user folders that typically contain important data.
 * Only directories that exist will be backed up.
 */
const TIMESTAMPED_DIRECTORIES = [
  'Backups',
  'Desktop',
  'Documents',
  'Microsoft',
  'Movies',
  'Music',
  'Pictures',
  'Public',
  'Source',
  'Templates',
  'Temporary',
  'Videos'
];

/**
 * Generates a timestamp string in YYYYMMDDHHmmss format.
 * This format is sortable and filesystem-safe.
 *
 * @returns {string} Timestamp string like "20250107143052"
 */
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hour}${minute}${second}`;
}

/**
 * Checks if rsync is available on the system.
 *
 * @returns {boolean} True if rsync command exists, false otherwise
 */
function isRsyncAvailable() {
  return shell.commandExists('rsync');
}

/**
 * Checks if robocopy is available on the system (Windows).
 *
 * @returns {boolean} True if robocopy command exists, false otherwise
 */
function isRobocopyAvailable() {
  return shell.commandExists('robocopy');
}

/**
 * Lists the contents of a directory and prints to console.
 * Uses Node.js fs module for cross-platform compatibility.
 *
 * @param {string} dirPath - The directory to list
 * @returns {void}
 */
function listDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    console.log(`\nContents of ${dirPath}:`);
    console.log('-'.repeat(60));

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const stats = fs.statSync(fullPath);
        const type = entry.isDirectory() ? 'd' : '-';
        const size = entry.isDirectory() ? '<DIR>' : formatBytes(stats.size);
        const mtime = stats.mtime.toISOString().slice(0, 19).replace('T', ' ');
        console.log(`${type}  ${mtime}  ${size.padStart(12)}  ${entry.name}`);
      } catch {
        console.log(`?  ${'?'.padStart(19)}  ${'?'.padStart(12)}  ${entry.name}`);
      }
    }
  } catch (err) {
    console.error(`Could not list directory: ${err.message}`);
  }
}

/**
 * Formats bytes into human-readable size.
 *
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted size string like "1.5 MB"
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Gets the list of existing directories from the home folder.
 * Only returns directories that actually exist on the system.
 *
 * @param {string[]} dirNames - Array of directory names to check
 * @returns {string[]} Array of full paths to existing directories
 */
function getExistingDirectories(dirNames) {
  const homeDir = os.getHomeDir();
  const existing = [];

  for (const dirName of dirNames) {
    const fullPath = path.join(homeDir, dirName);
    try {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        existing.push(fullPath);
      }
    } catch {
      // Directory doesn't exist, skip it
    }
  }

  return existing;
}

/**
 * Builds rsync exclude arguments from the EXCLUDES array.
 *
 * @returns {string} String of --exclude arguments for rsync
 */
function buildRsyncExcludes() {
  return EXCLUDES.map(e => `--exclude='${e}'`).join(' ');
}

/**
 * Builds robocopy exclude arguments from the EXCLUDES array.
 * Robocopy uses /XD for directories and /XF for files.
 *
 * @returns {string} String of /XD and /XF arguments for robocopy
 */
function buildRobocopyExcludes() {
  // Robocopy needs separate /XD for directories and /XF for files
  // Most of our excludes are directories
  const dirExcludes = EXCLUDES.map(e => `"${e}"`).join(' ');
  return `/XD ${dirExcludes}`;
}

/**
 * Backs up directories using rsync (Unix/macOS/Linux).
 * Uses rsync with archive mode, verbose output, progress display,
 * and excludes symbolic links.
 *
 * @param {string[]} sourceDirs - Array of source directory paths
 * @param {string} destDir - Destination directory path
 * @returns {Promise<boolean>} True if backup succeeded, false otherwise
 */
async function backupWithRsync(sourceDirs, destDir) {
  const excludes = buildRsyncExcludes();
  const sources = sourceDirs.map(d => `"${d}"`).join(' ');

  // Create destination directory if it doesn't exist
  try {
    fs.mkdirSync(destDir, { recursive: true });
  } catch (err) {
    console.error(`Failed to create destination directory: ${err.message}`);
    return false;
  }

  const cmd = `rsync -arv --progress --no-links ${excludes} ${sources} "${destDir}"`;

  console.log(`\nBacking up to: ${destDir}`);
  console.log('Running rsync... (this may take a while)\n');

  const result = await shell.exec(cmd, { timeout: 0 }); // No timeout for large backups

  if (result.code !== 0) {
    console.error(`rsync failed with code ${result.code}`);
    if (result.stderr) {
      console.error(result.stderr);
    }
    return false;
  }

  // Print rsync output (includes file list and summary)
  if (result.stdout) {
    console.log(result.stdout);
  }

  return true;
}

/**
 * Backs up directories using robocopy (Windows).
 * Uses robocopy with mirror mode and progress display.
 *
 * @param {string[]} sourceDirs - Array of source directory paths
 * @param {string} destDir - Destination directory path
 * @returns {Promise<boolean>} True if backup succeeded, false otherwise
 */
async function backupWithRobocopy(sourceDirs, destDir) {
  const excludes = buildRobocopyExcludes();

  // Create destination directory if it doesn't exist
  try {
    fs.mkdirSync(destDir, { recursive: true });
  } catch (err) {
    console.error(`Failed to create destination directory: ${err.message}`);
    return false;
  }

  console.log(`\nBacking up to: ${destDir}`);
  console.log('Running robocopy... (this may take a while)\n');

  // Robocopy needs to be called for each source directory
  for (const sourceDir of sourceDirs) {
    const dirName = path.basename(sourceDir);
    const targetDir = path.join(destDir, dirName);

    // /E = copy subdirectories including empty ones
    // /R:3 = retry 3 times on failed copies
    // /W:5 = wait 5 seconds between retries
    // /NP = no progress (percentage) - can cause issues with output
    // /XJ = exclude junction points (similar to --no-links in rsync)
    const cmd = `robocopy "${sourceDir}" "${targetDir}" /E /R:3 /W:5 /XJ ${excludes}`;

    console.log(`Copying: ${sourceDir} -> ${targetDir}`);

    const result = await shell.exec(cmd, { timeout: 0 });

    // Robocopy uses exit codes differently:
    // 0 = No files copied, no errors
    // 1 = Files copied successfully
    // 2 = Extra files or directories detected
    // 4 = Some mismatched files detected
    // 8+ = Errors occurred
    if (result.code >= 8) {
      console.error(`robocopy failed for ${sourceDir} with code ${result.code}`);
      if (result.stderr) {
        console.error(result.stderr);
      }
      // Continue with other directories instead of failing completely
    }
  }

  return true;
}

/**
 * Pure Node.js backup implementation (fallback when no system tools available).
 * This is a simple recursive copy that respects the exclude list.
 * Note: This is significantly slower than rsync/robocopy for large directories.
 *
 * @param {string[]} sourceDirs - Array of source directory paths
 * @param {string} destDir - Destination directory path
 * @returns {Promise<boolean>} True if backup succeeded, false otherwise
 */
async function backupWithNodeJS(sourceDirs, destDir) {
  console.log(`\nBacking up to: ${destDir}`);
  console.log('Using Node.js copy (no rsync/robocopy available)...');
  console.log('Note: This may be slower than native backup tools.\n');

  // Create destination directory
  try {
    fs.mkdirSync(destDir, { recursive: true });
  } catch (err) {
    console.error(`Failed to create destination directory: ${err.message}`);
    return false;
  }

  let totalFiles = 0;
  let copiedFiles = 0;

  /**
   * Recursively copies a directory while respecting excludes.
   *
   * @param {string} src - Source path
   * @param {string} dest - Destination path
   */
  function copyRecursive(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      // Check if this entry should be excluded
      if (EXCLUDES.includes(entry.name)) {
        continue;
      }

      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      try {
        if (entry.isDirectory()) {
          // Skip symbolic links (equivalent to rsync --no-links)
          const stats = fs.lstatSync(srcPath);
          if (stats.isSymbolicLink()) {
            continue;
          }

          fs.mkdirSync(destPath, { recursive: true });
          copyRecursive(srcPath, destPath);
        } else if (entry.isFile()) {
          // Skip symbolic links
          const stats = fs.lstatSync(srcPath);
          if (stats.isSymbolicLink()) {
            continue;
          }

          totalFiles++;
          fs.copyFileSync(srcPath, destPath);
          copiedFiles++;

          // Show progress every 100 files
          if (copiedFiles % 100 === 0) {
            console.log(`Copied ${copiedFiles} files...`);
          }
        }
      } catch (err) {
        console.error(`Warning: Could not copy ${srcPath}: ${err.message}`);
      }
    }
  }

  for (const sourceDir of sourceDirs) {
    const dirName = path.basename(sourceDir);
    const targetDir = path.join(destDir, dirName);

    console.log(`Copying: ${sourceDir}`);

    try {
      fs.mkdirSync(targetDir, { recursive: true });
      copyRecursive(sourceDir, targetDir);
    } catch (err) {
      console.error(`Warning: Could not backup ${sourceDir}: ${err.message}`);
    }
  }

  console.log(`\nBackup complete: ${copiedFiles} files copied.`);
  return true;
}

/**
 * Backs up user directories on macOS using rsync.
 * Rsync is pre-installed on macOS and provides efficient incremental backups.
 *
 * @param {string[]} args - Command line arguments (destination path)
 * @returns {Promise<void>}
 */
async function do_backup_all_macos(args) {
  if (!isRsyncAvailable()) {
    console.error('Error: rsync is not available.');
    console.error('rsync should be pre-installed on macOS.');
    console.error('If missing, install with: brew install rsync');
    process.exit(1);
  }

  await do_backup_all_rsync(args);
}

/**
 * Backs up user directories on Ubuntu using rsync.
 * Rsync is typically pre-installed on Ubuntu.
 *
 * @param {string[]} args - Command line arguments (destination path)
 * @returns {Promise<void>}
 */
async function do_backup_all_ubuntu(args) {
  if (!isRsyncAvailable()) {
    console.error('Error: rsync is not available.');
    console.error('Install it with: sudo apt-get install rsync');
    process.exit(1);
  }

  await do_backup_all_rsync(args);
}

/**
 * Backs up user directories on Raspberry Pi OS using rsync.
 * Rsync is typically pre-installed on Raspberry Pi OS.
 *
 * @param {string[]} args - Command line arguments (destination path)
 * @returns {Promise<void>}
 */
async function do_backup_all_raspbian(args) {
  if (!isRsyncAvailable()) {
    console.error('Error: rsync is not available.');
    console.error('Install it with: sudo apt-get install rsync');
    process.exit(1);
  }

  await do_backup_all_rsync(args);
}

/**
 * Backs up user directories on Amazon Linux using rsync.
 * Rsync is typically pre-installed on Amazon Linux.
 *
 * @param {string[]} args - Command line arguments (destination path)
 * @returns {Promise<void>}
 */
async function do_backup_all_amazon_linux(args) {
  if (!isRsyncAvailable()) {
    console.error('Error: rsync is not available.');
    console.error('Install it with: sudo yum install rsync');
    console.error('Or on Amazon Linux 2023: sudo dnf install rsync');
    process.exit(1);
  }

  await do_backup_all_rsync(args);
}

/**
 * Backs up user directories on Windows using robocopy.
 * Robocopy is built into Windows and provides robust file copying.
 *
 * @param {string[]} args - Command line arguments (destination path)
 * @returns {Promise<void>}
 */
async function do_backup_all_cmd(args) {
  await do_backup_all_windows(args);
}

/**
 * Backs up user directories on Windows PowerShell using robocopy.
 * Robocopy is built into Windows and provides robust file copying.
 *
 * @param {string[]} args - Command line arguments (destination path)
 * @returns {Promise<void>}
 */
async function do_backup_all_powershell(args) {
  await do_backup_all_windows(args);
}

/**
 * Backs up user directories in Git Bash using rsync if available,
 * otherwise falls back to robocopy via PowerShell.
 *
 * @param {string[]} args - Command line arguments (destination path)
 * @returns {Promise<void>}
 */
async function do_backup_all_gitbash(args) {
  // Git Bash may have rsync if installed via pacman/mingw
  if (isRsyncAvailable()) {
    await do_backup_all_rsync(args);
    return;
  }

  // Fall back to Windows robocopy
  await do_backup_all_windows(args);
}

/**
 * Core rsync-based backup implementation used by Unix-like systems.
 * This function handles the two-phase backup:
 * 1. Downloads folder backed up without timestamp
 * 2. Other user directories backed up to timestamped folder
 *
 * @param {string[]} args - Command line arguments (destination path)
 * @returns {Promise<void>}
 */
async function do_backup_all_rsync(args) {
  if (args.length === 0) {
    console.error('Usage: backup-all <destination-directory>');
    console.error('');
    console.error('Example: backup-all /Volumes/Backup/');
    console.error('         backup-all /mnt/backup/');
    process.exit(1);
  }

  const destBase = args.join(' '); // Handle paths with spaces
  const homeDir = os.getHomeDir();

  // Phase 1: Backup Downloads to destination (no timestamp)
  // This allows Downloads to be overwritten/updated on each backup
  const downloadsPath = path.join(homeDir, 'Downloads');
  if (fs.existsSync(downloadsPath)) {
    console.log('='.repeat(60));
    console.log('Phase 1: Backing up Downloads (no timestamp)');
    console.log('='.repeat(60));
    await backupWithRsync([downloadsPath], destBase);
  } else {
    console.log('Skipping Downloads (directory not found)');
  }

  // Phase 2: Backup other directories to timestamped folder
  const timestamp = getTimestamp();
  const timestampedDest = path.join(destBase, timestamp);
  const existingDirs = getExistingDirectories(TIMESTAMPED_DIRECTORIES);

  if (existingDirs.length === 0) {
    console.log('\nNo user directories found to backup.');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Phase 2: Backing up ${existingDirs.length} directories (with timestamp)`);
  console.log('='.repeat(60));
  console.log(`Directories: ${existingDirs.map(d => path.basename(d)).join(', ')}`);

  const success = await backupWithRsync(existingDirs, timestampedDest);

  if (success) {
    console.log('\n' + '='.repeat(60));
    console.log('Backup completed successfully!');
    console.log('='.repeat(60));
    listDirectory(timestampedDest);
  }
}

/**
 * Core Windows backup implementation using robocopy.
 * Handles the two-phase backup process using robocopy instead of rsync.
 *
 * @param {string[]} args - Command line arguments (destination path)
 * @returns {Promise<void>}
 */
async function do_backup_all_windows(args) {
  if (args.length === 0) {
    console.error('Usage: backup-all <destination-directory>');
    console.error('');
    console.error('Example: backup-all D:\\Backup');
    console.error('         backup-all "E:\\My Backups"');
    process.exit(1);
  }

  const destBase = args.join(' ');
  const homeDir = os.getHomeDir();

  // Check for robocopy
  if (!isRobocopyAvailable()) {
    console.log('Warning: robocopy not found. Using Node.js fallback (slower).');
    await do_backup_all_nodejs(args);
    return;
  }

  // Phase 1: Backup Downloads to destination (no timestamp)
  const downloadsPath = path.join(homeDir, 'Downloads');
  if (fs.existsSync(downloadsPath)) {
    console.log('='.repeat(60));
    console.log('Phase 1: Backing up Downloads (no timestamp)');
    console.log('='.repeat(60));
    await backupWithRobocopy([downloadsPath], destBase);
  } else {
    console.log('Skipping Downloads (directory not found)');
  }

  // Phase 2: Backup other directories to timestamped folder
  const timestamp = getTimestamp();
  const timestampedDest = path.join(destBase, timestamp);
  const existingDirs = getExistingDirectories(TIMESTAMPED_DIRECTORIES);

  if (existingDirs.length === 0) {
    console.log('\nNo user directories found to backup.');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Phase 2: Backing up ${existingDirs.length} directories (with timestamp)`);
  console.log('='.repeat(60));
  console.log(`Directories: ${existingDirs.map(d => path.basename(d)).join(', ')}`);

  const success = await backupWithRobocopy(existingDirs, timestampedDest);

  if (success) {
    console.log('\n' + '='.repeat(60));
    console.log('Backup completed successfully!');
    console.log('='.repeat(60));
    listDirectory(timestampedDest);
  }
}

/**
 * Pure Node.js backup implementation for when no native tools are available.
 * This is a fallback that works on any platform but may be slower.
 *
 * @param {string[]} args - Command line arguments (destination path)
 * @returns {Promise<void>}
 */
async function do_backup_all_nodejs(args) {
  if (args.length === 0) {
    console.error('Usage: backup-all <destination-directory>');
    console.error('');
    console.error('Example: backup-all /path/to/backup');
    process.exit(1);
  }

  const destBase = args.join(' ');
  const homeDir = os.getHomeDir();

  // Phase 1: Backup Downloads
  const downloadsPath = path.join(homeDir, 'Downloads');
  if (fs.existsSync(downloadsPath)) {
    console.log('='.repeat(60));
    console.log('Phase 1: Backing up Downloads (no timestamp)');
    console.log('='.repeat(60));
    await backupWithNodeJS([downloadsPath], destBase);
  }

  // Phase 2: Backup other directories to timestamped folder
  const timestamp = getTimestamp();
  const timestampedDest = path.join(destBase, timestamp);
  const existingDirs = getExistingDirectories(TIMESTAMPED_DIRECTORIES);

  if (existingDirs.length === 0) {
    console.log('\nNo user directories found to backup.');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Phase 2: Backing up ${existingDirs.length} directories (with timestamp)`);
  console.log('='.repeat(60));

  const success = await backupWithNodeJS(existingDirs, timestampedDest);

  if (success) {
    console.log('\n' + '='.repeat(60));
    console.log('Backup completed successfully!');
    console.log('='.repeat(60));
    listDirectory(timestampedDest);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Creates a backup of multiple user directories to the specified destination.
 * The backup runs in two phases:
 * 1. Downloads folder is backed up directly to the destination (no timestamp)
 * 2. All other user directories are backed up to a timestamped subdirectory
 *
 * This allows Downloads to be continuously updated while maintaining
 * historical snapshots of other important directories.
 *
 * @param {string[]} args - Command line arguments (destination path)
 * @returns {Promise<void>}
 */
async function do_backup_all(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_backup_all_macos,
    'ubuntu': do_backup_all_ubuntu,
    'debian': do_backup_all_ubuntu,
    'raspbian': do_backup_all_raspbian,
    'amazon_linux': do_backup_all_amazon_linux,
    'rhel': do_backup_all_amazon_linux,
    'fedora': do_backup_all_amazon_linux,
    'wsl': do_backup_all_ubuntu,
    'windows': do_backup_all_cmd,
    'cmd': do_backup_all_cmd,
    'powershell': do_backup_all_powershell,
    'gitbash': do_backup_all_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('Attempting fallback with Node.js implementation...');
    await do_backup_all_nodejs(args);
    return;
  }

  await handler(args);
}

module.exports = {
  main: do_backup_all,
  do_backup_all,
  do_backup_all_nodejs,
  do_backup_all_macos,
  do_backup_all_ubuntu,
  do_backup_all_raspbian,
  do_backup_all_amazon_linux,
  do_backup_all_cmd,
  do_backup_all_powershell,
  do_backup_all_gitbash
};

if (require.main === module) {
  do_backup_all(process.argv.slice(2)).catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
