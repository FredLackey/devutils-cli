#!/usr/bin/env node

/**
 * ll - Long listing of directory contents
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias ll="ls -l"
 *
 * This script displays a detailed listing of files and directories,
 * showing permissions, ownership, size, modification date, and names.
 * On Unix-like systems, it delegates to the native `ls -l` command for
 * optimal output (colors, proper column alignment, etc.). On Windows,
 * it uses a pure Node.js implementation to provide equivalent information.
 *
 * @module scripts/ll
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Converts numeric file mode to Unix-style permission string (e.g., "drwxr-xr-x").
 *
 * This function translates the numeric mode returned by fs.statSync() into the
 * human-readable permission string format that users expect from ls -l output.
 *
 * @param {number} mode - The numeric file mode from fs.Stats
 * @param {boolean} isDirectory - Whether the entry is a directory
 * @param {boolean} isSymlink - Whether the entry is a symbolic link
 * @returns {string} Permission string like "drwxr-xr-x" or "-rw-r--r--"
 */
function formatPermissions(mode, isDirectory, isSymlink) {
  // First character: file type
  // 'd' for directory, 'l' for symlink, '-' for regular file
  let result = isSymlink ? 'l' : (isDirectory ? 'd' : '-');

  // Owner permissions (bits 8, 7, 6)
  result += (mode & 0o400) ? 'r' : '-';  // Owner read
  result += (mode & 0o200) ? 'w' : '-';  // Owner write
  result += (mode & 0o100) ? 'x' : '-';  // Owner execute

  // Group permissions (bits 5, 4, 3)
  result += (mode & 0o040) ? 'r' : '-';  // Group read
  result += (mode & 0o020) ? 'w' : '-';  // Group write
  result += (mode & 0o010) ? 'x' : '-';  // Group execute

  // Other permissions (bits 2, 1, 0)
  result += (mode & 0o004) ? 'r' : '-';  // Other read
  result += (mode & 0o002) ? 'w' : '-';  // Other write
  result += (mode & 0o001) ? 'x' : '-';  // Other execute

  return result;
}

/**
 * Formats a file size into a human-readable string.
 * For consistency with ls -l, this returns the raw byte count.
 *
 * @param {number} size - File size in bytes
 * @returns {string} Formatted size string
 */
function formatSize(size) {
  return size.toString();
}

/**
 * Formats a date into ls -l style format (e.g., "Jan  7 14:30" or "Jan  7  2024").
 *
 * The format varies based on how recent the file is:
 * - Files modified in the last 6 months: "Mon DD HH:MM"
 * - Older files: "Mon DD  YYYY"
 *
 * @param {Date} date - The modification date
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));

  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, ' ');

  // If the file was modified within the last 6 months, show time
  // Otherwise, show the year
  if (date > sixMonthsAgo) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month} ${day} ${hours}:${minutes}`;
  } else {
    const year = date.getFullYear().toString().padStart(5, ' ');
    return `${month} ${day} ${year}`;
  }
}

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This creates an ls -l style output using only Node.js APIs. While it cannot
 * perfectly replicate the native ls command (no color support, owner/group names
 * not available on Windows), it provides the essential information in a similar format.
 *
 * The output includes:
 * - File permissions (Unix-style, e.g., "drwxr-xr-x")
 * - Number of hard links (approximated as 1 for files, 2+ for directories)
 * - Owner (username on Unix, "owner" placeholder on Windows)
 * - Group (group name on Unix, "group" placeholder on Windows)
 * - File size in bytes
 * - Modification date
 * - File name
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Optional path to list (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_ll_nodejs(args) {
  // Get the target directory from arguments, defaulting to current directory
  const targetDir = args[0] || '.';

  // Resolve to absolute path for clearer error messages
  const absolutePath = path.resolve(targetDir);

  // Check if the path exists
  if (!fs.existsSync(absolutePath)) {
    console.error(`ls: cannot access '${targetDir}': No such file or directory`);
    process.exit(1);
  }

  // Get stats of the target to determine if it's a file or directory
  let targetStats;
  try {
    targetStats = fs.lstatSync(absolutePath);
  } catch (error) {
    console.error(`ls: cannot access '${targetDir}': ${error.message}`);
    process.exit(1);
  }

  // If the target is a file, just show that file's info
  if (!targetStats.isDirectory()) {
    const entry = {
      name: path.basename(absolutePath),
      stats: targetStats,
      isDirectory: targetStats.isDirectory(),
      isSymlink: targetStats.isSymbolicLink()
    };
    printEntry(entry, 0, 0, 0);
    return;
  }

  // Read directory contents
  let entries;
  try {
    const dirents = fs.readdirSync(absolutePath, { withFileTypes: true });
    entries = [];

    for (const dirent of dirents) {
      const fullPath = path.join(absolutePath, dirent.name);
      let stats;
      let isSymlink = dirent.isSymbolicLink();

      try {
        // Use lstat to get symlink info, not the target info
        stats = fs.lstatSync(fullPath);
      } catch (err) {
        // Skip entries we can't stat (permission denied, etc.)
        continue;
      }

      entries.push({
        name: dirent.name,
        stats: stats,
        isDirectory: dirent.isDirectory(),
        isSymlink: isSymlink,
        fullPath: fullPath
      });
    }
  } catch (error) {
    console.error(`ls: cannot open directory '${targetDir}': ${error.message}`);
    process.exit(1);
  }

  // Sort entries alphabetically (case-insensitive, like ls)
  entries.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  // Calculate column widths for alignment
  let maxSizeWidth = 0;
  let maxLinksWidth = 0;
  let totalBlocks = 0;

  for (const entry of entries) {
    const sizeStr = formatSize(entry.stats.size);
    if (sizeStr.length > maxSizeWidth) {
      maxSizeWidth = sizeStr.length;
    }

    // nlink is the number of hard links
    const linksStr = entry.stats.nlink.toString();
    if (linksStr.length > maxLinksWidth) {
      maxLinksWidth = linksStr.length;
    }

    // Calculate total blocks (512-byte blocks, like ls)
    totalBlocks += Math.ceil(entry.stats.blocks || (entry.stats.size / 512));
  }

  // Print total blocks (like ls -l does)
  console.log(`total ${Math.floor(totalBlocks / 2)}`);

  // Print each entry
  for (const entry of entries) {
    printEntry(entry, maxSizeWidth, maxLinksWidth);
  }
}

/**
 * Prints a single directory entry in ls -l format.
 *
 * @param {Object} entry - The directory entry object
 * @param {string} entry.name - File name
 * @param {fs.Stats} entry.stats - File statistics
 * @param {boolean} entry.isDirectory - Whether it's a directory
 * @param {boolean} entry.isSymlink - Whether it's a symbolic link
 * @param {string} [entry.fullPath] - Full path (for resolving symlinks)
 * @param {number} maxSizeWidth - Maximum width for size column
 * @param {number} maxLinksWidth - Maximum width for links column
 */
function printEntry(entry, maxSizeWidth, maxLinksWidth) {
  const perms = formatPermissions(entry.stats.mode, entry.isDirectory, entry.isSymlink);
  const links = entry.stats.nlink.toString().padStart(maxLinksWidth || 1, ' ');
  const size = formatSize(entry.stats.size).padStart(maxSizeWidth || 1, ' ');
  const date = formatDate(entry.stats.mtime);

  // On Unix, we could get owner/group from stats.uid/gid, but that requires
  // additional system calls. For simplicity, we use placeholders.
  // The native ls command will be used on Unix systems anyway.
  const owner = process.platform === 'win32' ? 'owner' : (process.getuid ? process.getuid().toString() : 'owner');
  const group = process.platform === 'win32' ? 'group' : (process.getgid ? process.getgid().toString() : 'group');

  let name = entry.name;

  // For symlinks, show the link target
  if (entry.isSymlink && entry.fullPath) {
    try {
      const linkTarget = fs.readlinkSync(entry.fullPath);
      name = `${entry.name} -> ${linkTarget}`;
    } catch {
      // If we can't read the link, just show the name
    }
  }

  console.log(`${perms} ${links} ${owner.padEnd(8)} ${group.padEnd(8)} ${size} ${date} ${name}`);
}

/**
 * Long listing on macOS using native ls command.
 *
 * Uses the native ls -l command for optimal output including:
 * - Colorized output (if terminal supports it)
 * - Proper owner/group names
 * - Accurate hard link counts
 * - Extended attributes indicator (@)
 *
 * @param {string[]} args - Command line arguments passed to ls
 * @returns {Promise<void>}
 */
async function do_ll_macos(args) {
  try {
    // Use native ls -l for best output
    // -G enables colors on macOS
    const lsArgs = ['-l', ...args].join(' ');
    execSync(`ls ${lsArgs}`, { stdio: 'inherit' });
  } catch (error) {
    // ls will print its own error message, just exit with error code
    process.exit(error.status || 1);
  }
}

/**
 * Long listing on Ubuntu using native ls command.
 *
 * Uses the native ls -l command for optimal output including:
 * - Colorized output via --color=auto
 * - Proper owner/group names
 * - SELinux context (if applicable)
 * - Accurate hard link counts
 *
 * @param {string[]} args - Command line arguments passed to ls
 * @returns {Promise<void>}
 */
async function do_ll_ubuntu(args) {
  try {
    // Use native ls -l for best output
    // --color=auto enables colors when output is a terminal
    const lsArgs = ['-l', '--color=auto', ...args].join(' ');
    execSync(`ls ${lsArgs}`, { stdio: 'inherit' });
  } catch (error) {
    process.exit(error.status || 1);
  }
}

/**
 * Long listing on Raspberry Pi OS using native ls command.
 *
 * Uses the native ls -l command. Raspberry Pi OS is Debian-based,
 * so it uses the same ls options as Ubuntu.
 *
 * @param {string[]} args - Command line arguments passed to ls
 * @returns {Promise<void>}
 */
async function do_ll_raspbian(args) {
  try {
    const lsArgs = ['-l', '--color=auto', ...args].join(' ');
    execSync(`ls ${lsArgs}`, { stdio: 'inherit' });
  } catch (error) {
    process.exit(error.status || 1);
  }
}

/**
 * Long listing on Amazon Linux using native ls command.
 *
 * Uses the native ls -l command. Amazon Linux is RHEL-based,
 * so it uses the same GNU ls as other Linux distributions.
 *
 * @param {string[]} args - Command line arguments passed to ls
 * @returns {Promise<void>}
 */
async function do_ll_amazon_linux(args) {
  try {
    const lsArgs = ['-l', '--color=auto', ...args].join(' ');
    execSync(`ls ${lsArgs}`, { stdio: 'inherit' });
  } catch (error) {
    process.exit(error.status || 1);
  }
}

/**
 * Long listing in Windows Command Prompt.
 *
 * Windows CMD doesn't have a native ls command. This uses the pure Node.js
 * implementation to provide ls -l style output. Alternatively, users could
 * use 'dir' but the output format is very different from Unix ls.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ll_cmd(args) {
  // Windows CMD doesn't have ls, use Node.js implementation
  return do_ll_nodejs(args);
}

/**
 * Long listing in Windows PowerShell.
 *
 * PowerShell has 'ls' as an alias for Get-ChildItem, but the output format
 * is different from Unix ls -l. For consistency with the Unix experience,
 * we use the Node.js implementation which provides familiar ls -l style output.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ll_powershell(args) {
  // PowerShell's ls (Get-ChildItem) has different output format
  // Use Node.js implementation for consistent Unix-like output
  return do_ll_nodejs(args);
}

/**
 * Long listing in Git Bash on Windows.
 *
 * Git Bash includes a Unix-like ls command from MSYS2/MinGW, so we can
 * use the native ls -l command for proper colorized output.
 *
 * @param {string[]} args - Command line arguments passed to ls
 * @returns {Promise<void>}
 */
async function do_ll_gitbash(args) {
  try {
    // Git Bash has ls from MSYS2, use it directly
    const lsArgs = ['-l', '--color=auto', ...args].join(' ');
    execSync(`ls ${lsArgs}`, { stdio: 'inherit' });
  } catch (error) {
    process.exit(error.status || 1);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "ll" command displays a long listing of directory contents, showing
 * detailed information about each file and directory:
 * - File type and permissions (e.g., drwxr-xr-x)
 * - Number of hard links
 * - Owner name
 * - Group name
 * - File size in bytes
 * - Last modification date
 * - File name (with symlink target if applicable)
 *
 * Usage:
 *   ll              # List current directory
 *   ll /path/to/dir # List specified directory
 *   ll -a           # Include hidden files (on Unix)
 *   ll *.js         # List matching files (on Unix)
 *
 * On Unix-like systems (macOS, Linux), this delegates to the native ls command
 * for optimal output with colors and proper formatting. On Windows (CMD/PowerShell),
 * it uses a pure Node.js implementation that mimics ls -l output.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ll(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_ll_macos,
    'ubuntu': do_ll_ubuntu,
    'debian': do_ll_ubuntu,
    'raspbian': do_ll_raspbian,
    'amazon_linux': do_ll_amazon_linux,
    'rhel': do_ll_amazon_linux,
    'fedora': do_ll_ubuntu,
    'linux': do_ll_ubuntu,
    'wsl': do_ll_ubuntu,
    'cmd': do_ll_cmd,
    'windows': do_ll_cmd,
    'powershell': do_ll_powershell,
    'gitbash': do_ll_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS');
    console.error('  - Ubuntu, Debian, and other Linux distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - Amazon Linux');
    console.error('  - Windows (CMD, PowerShell, Git Bash)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_ll,
  do_ll,
  do_ll_nodejs,
  do_ll_macos,
  do_ll_ubuntu,
  do_ll_raspbian,
  do_ll_amazon_linux,
  do_ll_cmd,
  do_ll_powershell,
  do_ll_gitbash
};

if (require.main === module) {
  do_ll(process.argv.slice(2));
}
