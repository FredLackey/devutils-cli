#!/usr/bin/env node

/**
 * empty-trash - Empty all trash and system logs to free disk space
 *
 * Migrated from legacy dotfiles alias.
 * Original aliases:
 *   macOS:  alias empty-trash="sudo rm -frv /Volumes/\*\/.Trashes; \
 *                              sudo rm -frv ~/.Trash; \
 *                              sudo rm -frv /private/var/log/asl/\*.asl; \
 *                              sqlite3 ~/Library/Preferences/com.apple.LaunchServices.QuarantineEventsV\* 'delete from LSQuarantineEvent'"
 *   Ubuntu: alias empty-trash="rm -rf ~/.local/share/Trash/files/\*"
 *
 * This script empties the user's trash folder(s) and clears system logs
 * to free up disk space. The exact behavior varies by platform:
 * - macOS: Clears user trash, mounted volume trash, system logs, and quarantine database
 * - Linux: Clears the XDG trash directory (~/.local/share/Trash/)
 * - Windows: Empties the Recycle Bin
 *
 * @module scripts/empty-trash
 */

const os = require('../utils/common/os');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Helper function to check if a command exists on the system.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists, false otherwise
 */
function isCommandAvailable(cmd) {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively delete all contents of a directory using pure Node.js.
 * The directory itself is preserved, only its contents are removed.
 *
 * This is a helper function that handles the core logic of emptying
 * a trash folder without needing to shell out to rm -rf.
 *
 * @param {string} dirPath - Absolute path to the directory to empty
 * @param {boolean} verbose - If true, print each file/folder being deleted
 * @returns {{ deleted: number, errors: string[] }} Count of deleted items and any errors
 */
function emptyDirectory(dirPath, verbose = false) {
  const result = { deleted: 0, errors: [] };

  // Check if directory exists
  if (!fs.existsSync(dirPath)) {
    return result;
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          // Recursively remove directory and all its contents
          fs.rmSync(fullPath, { recursive: true, force: true });
          if (verbose) {
            console.log(`Removed: ${fullPath}`);
          }
        } else {
          // Remove file
          fs.unlinkSync(fullPath);
          if (verbose) {
            console.log(`Removed: ${fullPath}`);
          }
        }
        result.deleted++;
      } catch (err) {
        // Record error but continue with other files
        result.errors.push(`${fullPath}: ${err.message}`);
      }
    }
  } catch (err) {
    result.errors.push(`${dirPath}: ${err.message}`);
  }

  return result;
}

/**
 * Pure Node.js implementation for emptying trash.
 *
 * This handles the common case of emptying the XDG trash directory
 * which is used on most Linux systems. It can be used on any platform
 * that follows the XDG trash specification.
 *
 * Note: This does NOT handle:
 * - macOS system logs and quarantine database (requires shell commands)
 * - Windows Recycle Bin (requires PowerShell/COM)
 * - Mounted volume trash directories (requires sudo on macOS)
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_empty_trash_nodejs(args) {
  const homeDir = os.getHomeDir();
  const verbose = args.includes('-v') || args.includes('--verbose');

  // XDG Trash specification directories
  // See: https://specifications.freedesktop.org/trash-spec/trashspec-latest.html
  const trashPaths = [
    path.join(homeDir, '.local', 'share', 'Trash', 'files'),
    path.join(homeDir, '.local', 'share', 'Trash', 'info'),
    path.join(homeDir, '.local', 'share', 'Trash', 'expunged')
  ];

  let totalDeleted = 0;
  const allErrors = [];

  for (const trashPath of trashPaths) {
    if (fs.existsSync(trashPath)) {
      if (verbose) {
        console.log(`Emptying: ${trashPath}`);
      }
      const result = emptyDirectory(trashPath, verbose);
      totalDeleted += result.deleted;
      allErrors.push(...result.errors);
    }
  }

  if (totalDeleted > 0) {
    console.log(`Trash emptied. Removed ${totalDeleted} item(s).`);
  } else if (allErrors.length === 0) {
    console.log('Trash is already empty.');
  }

  if (allErrors.length > 0) {
    console.error('');
    console.error('Some items could not be removed:');
    for (const err of allErrors) {
      console.error(`  ${err}`);
    }
  }
}

/**
 * Empty trash on macOS.
 *
 * This replicates the original dotfiles alias which does four things:
 * 1. Remove .Trashes folders from all mounted volumes (requires sudo)
 * 2. Remove the user's ~/.Trash folder contents (requires sudo)
 * 3. Remove ASL (Apple System Log) files to improve shell startup speed
 * 4. Clear the quarantine events database (download history)
 *
 * Note: Some operations require sudo/admin privileges. The script will
 * attempt each operation and report any failures.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_empty_trash_macos(args) {
  const homeDir = os.getHomeDir();
  const verbose = args.includes('-v') || args.includes('--verbose');
  const results = [];

  console.log('Emptying trash and clearing system logs...');

  // 1. Empty user's Trash folder using Node.js (no sudo needed for user's own trash)
  const userTrash = path.join(homeDir, '.Trash');
  if (fs.existsSync(userTrash)) {
    if (verbose) {
      console.log(`\nEmptying user trash: ${userTrash}`);
    }
    const userTrashResult = emptyDirectory(userTrash, verbose);
    if (userTrashResult.deleted > 0) {
      results.push(`User trash: ${userTrashResult.deleted} item(s) removed`);
    }
    if (userTrashResult.errors.length > 0) {
      console.error('Some files in user trash could not be removed (may need sudo).');
    }
  }

  // 2. Try to empty mounted volumes' .Trashes folders
  // This typically requires sudo, so we'll use shell command
  try {
    // First, find mounted volumes with .Trashes folders
    if (fs.existsSync('/Volumes')) {
      const volumes = fs.readdirSync('/Volumes');
      for (const volume of volumes) {
        const trashPath = path.join('/Volumes', volume, '.Trashes');
        if (fs.existsSync(trashPath)) {
          if (verbose) {
            console.log(`\nFound volume trash: ${trashPath}`);
          }
          try {
            // Try without sudo first (may work for user-owned files)
            const result = emptyDirectory(trashPath, verbose);
            if (result.deleted > 0) {
              results.push(`${volume} trash: ${result.deleted} item(s) removed`);
            }
          } catch (err) {
            // May need elevated privileges
            if (verbose) {
              console.log(`Could not empty ${trashPath} without sudo.`);
            }
          }
        }
      }
    }
  } catch (err) {
    // Continue even if volume trash emptying fails
    if (verbose) {
      console.log('Could not access some volume trash folders.');
    }
  }

  // 3. Clear ASL (Apple System Log) files to improve shell startup speed
  // This requires sudo for system logs
  const aslPath = '/private/var/log/asl';
  if (fs.existsSync(aslPath)) {
    try {
      // Try to remove ASL files - this typically needs sudo
      const aslFiles = fs.readdirSync(aslPath).filter(f => f.endsWith('.asl'));
      if (aslFiles.length > 0) {
        if (verbose) {
          console.log(`\nFound ${aslFiles.length} ASL log file(s) to clear.`);
          console.log('Note: Clearing system logs typically requires sudo.');
        }
        // Attempt to remove (will likely fail without sudo)
        let removed = 0;
        for (const file of aslFiles) {
          try {
            fs.unlinkSync(path.join(aslPath, file));
            removed++;
          } catch {
            // Expected to fail without sudo
          }
        }
        if (removed > 0) {
          results.push(`ASL logs: ${removed} file(s) cleared`);
        }
      }
    } catch {
      // Cannot access ASL directory without privileges
    }
  }

  // 4. Clear quarantine events database (download history)
  // This is a SQLite database tracking downloaded files
  const quarantinePath = path.join(homeDir, 'Library', 'Preferences');
  if (fs.existsSync(quarantinePath) && isCommandAvailable('sqlite3')) {
    try {
      const files = fs.readdirSync(quarantinePath);
      const quarantineFiles = files.filter(f => f.startsWith('com.apple.LaunchServices.QuarantineEventsV'));

      for (const file of quarantineFiles) {
        const dbPath = path.join(quarantinePath, file);
        try {
          execSync(`sqlite3 "${dbPath}" 'delete from LSQuarantineEvent'`, {
            stdio: verbose ? 'inherit' : 'ignore'
          });
          results.push('Quarantine database: cleared');
        } catch {
          // Database may be locked or empty
          if (verbose) {
            console.log(`Could not clear quarantine database: ${dbPath}`);
          }
        }
      }
    } catch {
      // Cannot access quarantine database
    }
  }

  // Print summary
  console.log('');
  if (results.length > 0) {
    console.log('Summary:');
    for (const result of results) {
      console.log(`  - ${result}`);
    }
  } else {
    console.log('Trash is already empty (or requires sudo for remaining items).');
  }

  console.log('');
  console.log('Tip: For complete cleanup including system files, run with sudo:');
  console.log('  sudo rm -rf /Volumes/*/.Trashes ~/.Trash /private/var/log/asl/*.asl');
}

/**
 * Empty trash on Ubuntu.
 *
 * Ubuntu uses the XDG Trash specification, which stores deleted files in
 * ~/.local/share/Trash/. This directory has three subdirectories:
 * - files/: The actual deleted files
 * - info/: Metadata about each deleted file (original path, deletion time)
 * - expunged/: Files that were permanently deleted from trash
 *
 * The original alias only cleared the files/ directory, but for a complete
 * empty we also clear info/ and expunged/.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_empty_trash_ubuntu(args) {
  // Ubuntu uses XDG trash, which the nodejs implementation handles
  return do_empty_trash_nodejs(args);
}

/**
 * Empty trash on Raspberry Pi OS.
 *
 * Raspberry Pi OS is Debian-based and uses the same XDG Trash specification
 * as Ubuntu. The trash location is ~/.local/share/Trash/.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_empty_trash_raspbian(args) {
  // Raspbian uses XDG trash, same as Ubuntu
  return do_empty_trash_nodejs(args);
}

/**
 * Empty trash on Amazon Linux.
 *
 * Amazon Linux is typically used in server environments where a trash
 * folder may not exist. If a desktop environment is installed, it would
 * use the XDG Trash specification.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_empty_trash_amazon_linux(args) {
  const homeDir = os.getHomeDir();
  const trashPath = path.join(homeDir, '.local', 'share', 'Trash', 'files');

  // Check if trash directory exists
  if (!fs.existsSync(trashPath)) {
    console.log('No trash folder found.');
    console.log('');
    console.log('On server environments, files deleted with rm are permanently removed.');
    console.log('A trash folder is only created when using a desktop file manager.');
    return;
  }

  // If trash exists, use the Node.js implementation
  return do_empty_trash_nodejs(args);
}

/**
 * Empty Recycle Bin on Windows using Command Prompt.
 *
 * Windows stores deleted files in the Recycle Bin, which is located at
 * C:\\$Recycle.Bin\\ (a hidden system folder). Each user has their own
 * subfolder identified by their SID.
 *
 * We use PowerShell's Clear-RecycleBin cmdlet, which is the official way
 * to empty the Recycle Bin programmatically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_empty_trash_cmd(args) {
  const verbose = args.includes('-v') || args.includes('--verbose');

  console.log('Emptying Recycle Bin...');

  try {
    // Use PowerShell's Clear-RecycleBin cmdlet
    // The -Force flag skips the confirmation prompt
    // The -ErrorAction SilentlyContinue prevents errors if bin is empty
    execSync(
      'powershell.exe -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"',
      { stdio: verbose ? 'inherit' : 'ignore' }
    );
    console.log('Recycle Bin emptied successfully.');
  } catch (error) {
    // Try alternative method using Shell.Application COM object
    try {
      execSync(
        'powershell.exe -NoProfile -Command "$shell = New-Object -ComObject Shell.Application; $shell.NameSpace(10).Items() | ForEach-Object { Remove-Item $_.Path -Force -Recurse -ErrorAction SilentlyContinue }"',
        { stdio: verbose ? 'inherit' : 'ignore' }
      );
      console.log('Recycle Bin emptied successfully.');
    } catch (altError) {
      console.error('Error: Could not empty the Recycle Bin.');
      console.error('You may need to run this command as Administrator.');
      process.exit(1);
    }
  }
}

/**
 * Empty Recycle Bin on Windows using PowerShell.
 *
 * Uses the native Clear-RecycleBin cmdlet which is available in
 * PowerShell 5.0+ (included in Windows 10 and later).
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_empty_trash_powershell(args) {
  const verbose = args.includes('-v') || args.includes('--verbose');

  console.log('Emptying Recycle Bin...');

  try {
    // Clear-RecycleBin is a native PowerShell cmdlet
    // -Force skips confirmation, -ErrorAction handles empty bin gracefully
    execSync(
      'Clear-RecycleBin -Force -ErrorAction SilentlyContinue',
      {
        stdio: verbose ? 'inherit' : 'ignore',
        shell: 'powershell.exe'
      }
    );
    console.log('Recycle Bin emptied successfully.');
  } catch (error) {
    console.error('Error: Could not empty the Recycle Bin.');
    console.error('You may need to run PowerShell as Administrator.');
    process.exit(1);
  }
}

/**
 * Empty Recycle Bin from Git Bash on Windows.
 *
 * Git Bash runs on Windows, so we use the Windows Recycle Bin mechanism.
 * We call PowerShell from Git Bash to use the Clear-RecycleBin cmdlet.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_empty_trash_gitbash(args) {
  // Git Bash runs on Windows, use the CMD implementation
  return do_empty_trash_cmd(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "empty-trash" command empties the system trash/recycle bin and optionally
 * clears system logs to free disk space. This is useful for:
 * - Freeing disk space by permanently deleting trashed files
 * - Clearing download history (macOS quarantine database)
 * - Improving shell startup speed by clearing old system logs
 *
 * Usage:
 *   empty-trash           # Empty trash with summary output
 *   empty-trash -v        # Verbose output showing each deleted file
 *   empty-trash --verbose # Same as -v
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_empty_trash(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_empty_trash_macos,
    'ubuntu': do_empty_trash_ubuntu,
    'debian': do_empty_trash_ubuntu,
    'raspbian': do_empty_trash_raspbian,
    'amazon_linux': do_empty_trash_amazon_linux,
    'rhel': do_empty_trash_amazon_linux,
    'fedora': do_empty_trash_ubuntu,
    'linux': do_empty_trash_nodejs,
    'wsl': do_empty_trash_ubuntu,
    'cmd': do_empty_trash_cmd,
    'windows': do_empty_trash_cmd,
    'powershell': do_empty_trash_powershell,
    'gitbash': do_empty_trash_gitbash
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
  main: do_empty_trash,
  do_empty_trash,
  do_empty_trash_nodejs,
  do_empty_trash_macos,
  do_empty_trash_ubuntu,
  do_empty_trash_raspbian,
  do_empty_trash_amazon_linux,
  do_empty_trash_cmd,
  do_empty_trash_powershell,
  do_empty_trash_gitbash
};

if (require.main === module) {
  do_empty_trash(process.argv.slice(2));
}
