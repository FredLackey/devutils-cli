#!/usr/bin/env node

/**
 * backup-source - Backup ~/Source directory using rsync or robocopy.
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   backup-source(){
 *       backupdir="$*$(date +"%Y%m%d%H%M%S")/"
 *       backupcmd="rsync -arv --progress --no-links --exclude={.Trash,.android,.atom,...} ~/Source $backupdir"
 *       mkdir -p "$backupdir"
 *       eval "$backupcmd"
 *       cd "$backupdir"
 *   }
 *
 * @module scripts/backup-source
 */

const fs = require('fs');
const path = require('path');
const os = require('../utils/common/os');
const shell = require('../utils/common/shell');

/**
 * Directories and files to exclude from backup.
 * These are common development artifacts, caches, and system directories
 * that should not be backed up.
 */
const EXCLUDE_PATTERNS = [
  '.Trash',
  '.android',
  '.atom',
  '.bash_sessions',
  '.cache',
  '.cups',
  '.dropbox',
  '.git',
  '.next',
  '.npm',
  '.nvm',
  '.viminfo',
  'bower_components',
  'node_modules',
  '.tmp',
  '.idea',
  '.DS_Store',
  '.terraform'
];

/**
 * Generates a timestamp string in YYYYMMDDHHmmss format.
 * This format is used to create unique backup directory names.
 *
 * @returns {string} Timestamp in YYYYMMDDHHmmss format (e.g., "20240115143022")
 */
function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Gets the path to the user's Source directory.
 * This is typically ~/Source on all platforms.
 *
 * @returns {string} Absolute path to ~/Source
 */
function getSourceDirectory() {
  return path.join(os.getHomeDir(), 'Source');
}

/**
 * Validates that the Source directory exists.
 *
 * @returns {boolean} True if ~/Source exists and is a directory
 */
function sourceDirectoryExists() {
  const sourcePath = getSourceDirectory();
  try {
    const stats = fs.statSync(sourcePath);
    return stats.isDirectory();
  } catch {
    return false;
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
 * Node.js implementation note:
 *
 * This script intentionally uses rsync (macOS/Linux) or robocopy (Windows)
 * instead of a pure Node.js implementation because:
 *
 * 1. rsync is battle-tested for decades with excellent file synchronization
 * 2. rsync handles edge cases (symlinks, permissions, sparse files) that
 *    would be complex to implement correctly in Node.js
 * 3. rsync has progress reporting and resumable transfers
 * 4. robocopy is the Windows equivalent with similar benefits
 *
 * A pure Node.js implementation would not be appropriate for this use case.
 *
 * @param {string[]} args - Command line arguments (unused - this is a note)
 * @returns {Promise<void>}
 */
async function do_backup_source_nodejs(args) {
  // This function documents why we don't use pure Node.js for this task.
  // The platform-specific functions use rsync or robocopy because those tools
  // are superior for file synchronization compared to implementing the same
  // functionality in Node.js.
  throw new Error(
    'do_backup_source_nodejs should not be called directly. ' +
    'This script requires platform-specific tools (rsync or robocopy).'
  );
}

/**
 * Backs up ~/Source directory on macOS using rsync.
 *
 * Creates a timestamped backup directory at the specified destination and
 * uses rsync to copy all files while excluding common development artifacts.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Destination backup directory path (required)
 * @returns {Promise<void>}
 */
async function do_backup_source_macos(args) {
  // Validate destination argument
  if (!args || args.length === 0 || !args[0]) {
    console.error('Error: Destination backup directory is required.');
    console.error('');
    console.error('Usage: backup-source /path/to/backups/');
    console.error('');
    console.error('Example:');
    console.error('  backup-source /Volumes/ExternalDrive/backups/');
    console.error('  backup-source ~/Backups/');
    process.exit(1);
  }

  // Validate Source directory exists
  if (!sourceDirectoryExists()) {
    console.error('Error: Source directory does not exist.');
    console.error(`Expected path: ${getSourceDirectory()}`);
    console.error('');
    console.error('Create the directory first or check if it exists at a different location.');
    process.exit(1);
  }

  // Check if rsync is available
  if (!isRsyncAvailable()) {
    console.error('Error: rsync is required but not installed.');
    console.error('Install it with: brew install rsync');
    process.exit(1);
  }

  // Build the backup directory path with timestamp
  const destBase = args.join(' ').replace(/\/+$/, ''); // Remove trailing slashes
  const timestamp = generateTimestamp();
  const backupDir = `${destBase}${timestamp}/`;

  // Create the backup directory
  console.log(`Creating backup directory: ${backupDir}`);
  try {
    fs.mkdirSync(backupDir, { recursive: true });
  } catch (err) {
    console.error(`Error: Failed to create backup directory: ${err.message}`);
    process.exit(1);
  }

  // Build rsync command with exclude patterns
  const excludeArgs = EXCLUDE_PATTERNS.map(pattern => `--exclude="${pattern}"`).join(' ');
  const sourcePath = getSourceDirectory();
  const rsyncCmd = `rsync -arv --progress --no-links ${excludeArgs} "${sourcePath}" "${backupDir}"`;

  console.log('');
  console.log('Starting backup of ~/Source...');
  console.log(`Source: ${sourcePath}`);
  console.log(`Destination: ${backupDir}`);
  console.log('');

  // Execute rsync with live output
  const result = await shell.spawnAsync('rsync', [
    '-arv',
    '--progress',
    '--no-links',
    ...EXCLUDE_PATTERNS.map(p => `--exclude=${p}`),
    sourcePath,
    backupDir
  ], {
    onStdout: (data) => process.stdout.write(data),
    onStderr: (data) => process.stderr.write(data)
  });

  if (result.code !== 0) {
    console.error('');
    console.error('Error: Backup failed.');
    console.error(result.stderr);
    process.exit(1);
  }

  console.log('');
  console.log('Backup completed successfully!');
  console.log(`Backup location: ${backupDir}`);
}

/**
 * Backs up ~/Source directory on Ubuntu using rsync.
 *
 * Creates a timestamped backup directory at the specified destination and
 * uses rsync to copy all files while excluding common development artifacts.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Destination backup directory path (required)
 * @returns {Promise<void>}
 */
async function do_backup_source_ubuntu(args) {
  // Validate destination argument
  if (!args || args.length === 0 || !args[0]) {
    console.error('Error: Destination backup directory is required.');
    console.error('');
    console.error('Usage: backup-source /path/to/backups/');
    console.error('');
    console.error('Example:');
    console.error('  backup-source /mnt/backup/');
    console.error('  backup-source ~/Backups/');
    process.exit(1);
  }

  // Validate Source directory exists
  if (!sourceDirectoryExists()) {
    console.error('Error: Source directory does not exist.');
    console.error(`Expected path: ${getSourceDirectory()}`);
    console.error('');
    console.error('Create the directory first or check if it exists at a different location.');
    process.exit(1);
  }

  // Check if rsync is available
  if (!isRsyncAvailable()) {
    console.error('Error: rsync is required but not installed.');
    console.error('Install it with: sudo apt-get install rsync');
    process.exit(1);
  }

  // Build the backup directory path with timestamp
  const destBase = args.join(' ').replace(/\/+$/, ''); // Remove trailing slashes
  const timestamp = generateTimestamp();
  const backupDir = `${destBase}${timestamp}/`;

  // Create the backup directory
  console.log(`Creating backup directory: ${backupDir}`);
  try {
    fs.mkdirSync(backupDir, { recursive: true });
  } catch (err) {
    console.error(`Error: Failed to create backup directory: ${err.message}`);
    process.exit(1);
  }

  // Get source path
  const sourcePath = getSourceDirectory();

  console.log('');
  console.log('Starting backup of ~/Source...');
  console.log(`Source: ${sourcePath}`);
  console.log(`Destination: ${backupDir}`);
  console.log('');

  // Execute rsync with live output
  const result = await shell.spawnAsync('rsync', [
    '-arv',
    '--progress',
    '--no-links',
    ...EXCLUDE_PATTERNS.map(p => `--exclude=${p}`),
    sourcePath,
    backupDir
  ], {
    onStdout: (data) => process.stdout.write(data),
    onStderr: (data) => process.stderr.write(data)
  });

  if (result.code !== 0) {
    console.error('');
    console.error('Error: Backup failed.');
    console.error(result.stderr);
    process.exit(1);
  }

  console.log('');
  console.log('Backup completed successfully!');
  console.log(`Backup location: ${backupDir}`);
}

/**
 * Backs up ~/Source directory on Raspberry Pi OS using rsync.
 *
 * Creates a timestamped backup directory at the specified destination and
 * uses rsync to copy all files while excluding common development artifacts.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Destination backup directory path (required)
 * @returns {Promise<void>}
 */
async function do_backup_source_raspbian(args) {
  // Raspbian uses the same rsync approach as Ubuntu
  return do_backup_source_ubuntu(args);
}

/**
 * Backs up ~/Source directory on Amazon Linux using rsync.
 *
 * Creates a timestamped backup directory at the specified destination and
 * uses rsync to copy all files while excluding common development artifacts.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Destination backup directory path (required)
 * @returns {Promise<void>}
 */
async function do_backup_source_amazon_linux(args) {
  // Validate destination argument
  if (!args || args.length === 0 || !args[0]) {
    console.error('Error: Destination backup directory is required.');
    console.error('');
    console.error('Usage: backup-source /path/to/backups/');
    console.error('');
    console.error('Example:');
    console.error('  backup-source /mnt/efs/backups/');
    console.error('  backup-source ~/Backups/');
    process.exit(1);
  }

  // Validate Source directory exists
  if (!sourceDirectoryExists()) {
    console.error('Error: Source directory does not exist.');
    console.error(`Expected path: ${getSourceDirectory()}`);
    console.error('');
    console.error('Create the directory first or check if it exists at a different location.');
    process.exit(1);
  }

  // Check if rsync is available
  if (!isRsyncAvailable()) {
    console.error('Error: rsync is required but not installed.');
    console.error('Install it with: sudo dnf install rsync   (or: sudo yum install rsync)');
    process.exit(1);
  }

  // Build the backup directory path with timestamp
  const destBase = args.join(' ').replace(/\/+$/, ''); // Remove trailing slashes
  const timestamp = generateTimestamp();
  const backupDir = `${destBase}${timestamp}/`;

  // Create the backup directory
  console.log(`Creating backup directory: ${backupDir}`);
  try {
    fs.mkdirSync(backupDir, { recursive: true });
  } catch (err) {
    console.error(`Error: Failed to create backup directory: ${err.message}`);
    process.exit(1);
  }

  // Get source path
  const sourcePath = getSourceDirectory();

  console.log('');
  console.log('Starting backup of ~/Source...');
  console.log(`Source: ${sourcePath}`);
  console.log(`Destination: ${backupDir}`);
  console.log('');

  // Execute rsync with live output
  const result = await shell.spawnAsync('rsync', [
    '-arv',
    '--progress',
    '--no-links',
    ...EXCLUDE_PATTERNS.map(p => `--exclude=${p}`),
    sourcePath,
    backupDir
  ], {
    onStdout: (data) => process.stdout.write(data),
    onStderr: (data) => process.stderr.write(data)
  });

  if (result.code !== 0) {
    console.error('');
    console.error('Error: Backup failed.');
    console.error(result.stderr);
    process.exit(1);
  }

  console.log('');
  console.log('Backup completed successfully!');
  console.log(`Backup location: ${backupDir}`);
}

/**
 * Backs up ~/Source directory on Windows Command Prompt using robocopy.
 *
 * Creates a timestamped backup directory at the specified destination and
 * uses robocopy (built into Windows) to copy all files while excluding
 * common development artifacts.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Destination backup directory path (required)
 * @returns {Promise<void>}
 */
async function do_backup_source_cmd(args) {
  // Validate destination argument
  if (!args || args.length === 0 || !args[0]) {
    console.error('Error: Destination backup directory is required.');
    console.error('');
    console.error('Usage: backup-source C:\\path\\to\\backups\\');
    console.error('');
    console.error('Example:');
    console.error('  backup-source D:\\Backups\\');
    console.error('  backup-source %USERPROFILE%\\Backups\\');
    process.exit(1);
  }

  // Validate Source directory exists
  if (!sourceDirectoryExists()) {
    console.error('Error: Source directory does not exist.');
    console.error(`Expected path: ${getSourceDirectory()}`);
    console.error('');
    console.error('Create the directory first or check if it exists at a different location.');
    process.exit(1);
  }

  // Build the backup directory path with timestamp
  const destBase = args.join(' ').replace(/\\+$/, '').replace(/\/+$/, ''); // Remove trailing slashes
  const timestamp = generateTimestamp();
  const backupDir = path.join(destBase + timestamp);

  // Create the backup directory
  console.log(`Creating backup directory: ${backupDir}`);
  try {
    fs.mkdirSync(backupDir, { recursive: true });
  } catch (err) {
    console.error(`Error: Failed to create backup directory: ${err.message}`);
    process.exit(1);
  }

  // Get source path
  const sourcePath = getSourceDirectory();
  const sourceBasename = path.basename(sourcePath);
  const destPath = path.join(backupDir, sourceBasename);

  console.log('');
  console.log('Starting backup of ~/Source...');
  console.log(`Source: ${sourcePath}`);
  console.log(`Destination: ${destPath}`);
  console.log('');

  // Build robocopy command with exclude patterns
  // robocopy uses /XD for directories and /XF for files
  const excludeDirs = EXCLUDE_PATTERNS.filter(p => !p.includes('.')).map(p => `/XD "${p}"`).join(' ');
  const excludeFiles = EXCLUDE_PATTERNS.filter(p => p.includes('.')).map(p => `/XF "${p}"`).join(' ');

  // Execute robocopy
  // /E = copy subdirectories including empty ones
  // /R:3 = retry 3 times on failed copies
  // /W:5 = wait 5 seconds between retries
  // /NP = no progress (we'll use /V for verbose instead)
  // /XJ = exclude junction points (similar to --no-links)
  const robocopyArgs = [
    sourcePath,
    destPath,
    '/E',
    '/R:3',
    '/W:5',
    '/XJ',
    ...EXCLUDE_PATTERNS.map(p => `/XD ${p}`),
    ...EXCLUDE_PATTERNS.map(p => `/XF ${p}`)
  ];

  const result = await shell.spawnAsync('robocopy', robocopyArgs, {
    onStdout: (data) => process.stdout.write(data),
    onStderr: (data) => process.stderr.write(data)
  });

  // robocopy exit codes: 0-7 are success (0=no files copied, 1=files copied, etc.)
  // Exit code 8+ indicates errors
  if (result.code >= 8) {
    console.error('');
    console.error('Error: Backup failed.');
    console.error(result.stderr);
    process.exit(1);
  }

  console.log('');
  console.log('Backup completed successfully!');
  console.log(`Backup location: ${backupDir}`);
}

/**
 * Backs up ~/Source directory on Windows PowerShell using robocopy.
 *
 * Creates a timestamped backup directory at the specified destination and
 * uses robocopy (built into Windows) to copy all files while excluding
 * common development artifacts.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Destination backup directory path (required)
 * @returns {Promise<void>}
 */
async function do_backup_source_powershell(args) {
  // PowerShell uses the same robocopy approach as CMD
  return do_backup_source_cmd(args);
}

/**
 * Backs up ~/Source directory in Git Bash using rsync (if available) or robocopy.
 *
 * Git Bash runs on Windows but can use rsync if it's installed via MSYS2.
 * Falls back to robocopy via PowerShell if rsync is not available.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Destination backup directory path (required)
 * @returns {Promise<void>}
 */
async function do_backup_source_gitbash(args) {
  // Validate destination argument
  if (!args || args.length === 0 || !args[0]) {
    console.error('Error: Destination backup directory is required.');
    console.error('');
    console.error('Usage: backup-source /path/to/backups/');
    console.error('');
    console.error('Example:');
    console.error('  backup-source /d/Backups/');
    console.error('  backup-source ~/Backups/');
    process.exit(1);
  }

  // Validate Source directory exists
  if (!sourceDirectoryExists()) {
    console.error('Error: Source directory does not exist.');
    console.error(`Expected path: ${getSourceDirectory()}`);
    console.error('');
    console.error('Create the directory first or check if it exists at a different location.');
    process.exit(1);
  }

  // Check if rsync is available in Git Bash
  if (isRsyncAvailable()) {
    // Build the backup directory path with timestamp
    const destBase = args.join(' ').replace(/\/+$/, ''); // Remove trailing slashes
    const timestamp = generateTimestamp();
    const backupDir = `${destBase}${timestamp}/`;

    // Create the backup directory
    console.log(`Creating backup directory: ${backupDir}`);
    try {
      fs.mkdirSync(backupDir, { recursive: true });
    } catch (err) {
      console.error(`Error: Failed to create backup directory: ${err.message}`);
      process.exit(1);
    }

    // Get source path
    const sourcePath = getSourceDirectory();

    console.log('');
    console.log('Starting backup of ~/Source using rsync...');
    console.log(`Source: ${sourcePath}`);
    console.log(`Destination: ${backupDir}`);
    console.log('');

    // Execute rsync with live output
    const result = await shell.spawnAsync('rsync', [
      '-arv',
      '--progress',
      '--no-links',
      ...EXCLUDE_PATTERNS.map(p => `--exclude=${p}`),
      sourcePath,
      backupDir
    ], {
      onStdout: (data) => process.stdout.write(data),
      onStderr: (data) => process.stderr.write(data)
    });

    if (result.code !== 0) {
      console.error('');
      console.error('Error: Backup failed.');
      console.error(result.stderr);
      process.exit(1);
    }

    console.log('');
    console.log('Backup completed successfully!');
    console.log(`Backup location: ${backupDir}`);
  } else {
    // Fall back to robocopy via PowerShell
    console.log('rsync not found in Git Bash, using robocopy via PowerShell...');
    console.log('');

    // Convert Git Bash paths to Windows paths for robocopy
    const destBase = args.join(' ').replace(/\/+$/, '');
    const timestamp = generateTimestamp();

    // Convert /c/Users/... to C:\Users\... for PowerShell
    let windowsDestBase = destBase;
    if (destBase.match(/^\/[a-zA-Z]\//)) {
      // Git Bash style path like /c/Users/...
      windowsDestBase = destBase.replace(/^\/([a-zA-Z])\//, '$1:\\').replace(/\//g, '\\');
    }

    const backupDir = windowsDestBase + timestamp;

    // Create the backup directory
    console.log(`Creating backup directory: ${backupDir}`);
    try {
      fs.mkdirSync(backupDir, { recursive: true });
    } catch (err) {
      console.error(`Error: Failed to create backup directory: ${err.message}`);
      process.exit(1);
    }

    // Get source path and convert to Windows format
    const sourcePath = getSourceDirectory();
    let windowsSourcePath = sourcePath;
    if (sourcePath.match(/^\/[a-zA-Z]\//)) {
      windowsSourcePath = sourcePath.replace(/^\/([a-zA-Z])\//, '$1:\\').replace(/\//g, '\\');
    }

    const sourceBasename = path.basename(sourcePath);
    const destPath = path.join(backupDir, sourceBasename);

    console.log('');
    console.log('Starting backup of ~/Source using robocopy...');
    console.log(`Source: ${windowsSourcePath}`);
    console.log(`Destination: ${destPath}`);
    console.log('');

    // Build robocopy command for PowerShell
    const excludeArgs = EXCLUDE_PATTERNS.map(p => `/XD "${p}" /XF "${p}"`).join(' ');
    const robocopyCmd = `robocopy "${windowsSourcePath}" "${destPath}" /E /R:3 /W:5 /XJ ${excludeArgs}`;

    const result = await shell.exec(`powershell.exe -NoProfile -Command "${robocopyCmd}"`);

    // robocopy exit codes: 0-7 are success
    // Note: shell.exec returns the exit code differently than spawnAsync
    // We check stderr for errors since robocopy outputs to stdout
    if (result.code >= 8) {
      console.error('');
      console.error('Error: Backup failed.');
      console.error(result.stderr || result.stdout);
      process.exit(1);
    }

    console.log(result.stdout);
    console.log('');
    console.log('Backup completed successfully!');
    console.log(`Backup location: ${backupDir}`);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Creates a timestamped backup of the ~/Source directory to the specified
 * destination. Uses rsync on macOS/Linux (superior for file synchronization)
 * and robocopy on Windows (built-in equivalent).
 *
 * The backup excludes common development artifacts like node_modules, .git,
 * cache directories, and IDE-specific folders to reduce backup size and time.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Destination backup directory path (required)
 * @returns {Promise<void>}
 */
async function do_backup_source(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_backup_source_macos,
    'ubuntu': do_backup_source_ubuntu,
    'debian': do_backup_source_ubuntu,
    'raspbian': do_backup_source_raspbian,
    'amazon_linux': do_backup_source_amazon_linux,
    'rhel': do_backup_source_amazon_linux,
    'fedora': do_backup_source_amazon_linux,
    'cmd': do_backup_source_cmd,
    'windows': do_backup_source_cmd,
    'powershell': do_backup_source_powershell,
    'gitbash': do_backup_source_gitbash,
    'wsl': do_backup_source_ubuntu
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
  main: do_backup_source,
  do_backup_source,
  do_backup_source_nodejs,
  do_backup_source_macos,
  do_backup_source_ubuntu,
  do_backup_source_raspbian,
  do_backup_source_amazon_linux,
  do_backup_source_cmd,
  do_backup_source_powershell,
  do_backup_source_gitbash
};

if (require.main === module) {
  do_backup_source(process.argv.slice(2));
}
