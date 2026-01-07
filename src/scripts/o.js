#!/usr/bin/env node

/**
 * o - Open file or folder in system's default application
 *
 * Migrated from legacy dotfiles alias.
 * Original aliases:
 *   macOS:  alias o="open"
 *   Ubuntu: alias o="xdg-open"
 *
 * This script opens a file or folder using the operating system's default
 * application. For directories, this typically opens the file manager
 * (Finder on macOS, Nautilus/Files on Ubuntu, Explorer on Windows).
 * For files, it opens the associated application based on file type.
 *
 * If no path is specified, opens the current directory in the file manager.
 *
 * @module scripts/o
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to detect which open command is available on Linux.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists, false otherwise
 */
function isCommandAvailable(cmd) {
  try {
    // Use 'which' on Unix-like systems, 'where' on Windows
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Pure Node.js implementation - NOT APPLICABLE for this script.
 *
 * Opening files/folders in the system's default application requires
 * OS-level integration that cannot be done in pure Node.js. Each platform
 * has its own mechanism:
 * - macOS: 'open' command (part of macOS)
 * - Linux: 'xdg-open' or desktop-specific commands
 * - Windows: 'start' command or 'explorer.exe'
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_o_nodejs(args) {
  // Opening files/folders with the system's default application is inherently
  // platform-specific and cannot be implemented in pure Node.js.
  // Each platform function contains the appropriate system call.
  throw new Error(
    'do_o_nodejs should not be called directly. ' +
    'Opening files requires OS-specific commands.'
  );
}

/**
 * Validates and resolves the target path to open.
 * Returns the resolved path or prints an error and exits.
 *
 * @param {string} targetPath - The path provided by the user
 * @returns {string} The resolved absolute path
 */
function validatePath(targetPath) {
  // Resolve to absolute path
  const absolutePath = path.resolve(targetPath);

  // Check if the path exists
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: '${targetPath}' does not exist.`);
    process.exit(1);
  }

  return absolutePath;
}

/**
 * Open file or folder on macOS using the 'open' command.
 *
 * The 'open' command is built into macOS and opens files/folders with the
 * default application. For directories, it opens Finder. For files, it
 * opens the associated application based on the file's type and extension.
 *
 * Additional arguments supported by 'open' are passed through, allowing
 * users to specify specific applications with -a, reveal in Finder with -R, etc.
 *
 * Usage examples:
 *   o                 # Open current directory in Finder
 *   o ~/Documents     # Open Documents folder in Finder
 *   o file.pdf        # Open PDF in default viewer
 *   o -a Safari url   # Open URL in Safari specifically
 *   o -R file.txt     # Reveal file in Finder without opening
 *
 * @param {string[]} args - Command line arguments passed to 'open'
 * @returns {Promise<void>}
 */
async function do_o_macos(args) {
  // If no arguments provided, open the current directory
  const target = args.length > 0 ? args.join(' ') : '.';

  // If it's just a path (not flags), validate it exists
  if (args.length === 0 || (args.length === 1 && !args[0].startsWith('-'))) {
    const pathToOpen = args.length === 0 ? '.' : args[0];
    validatePath(pathToOpen);
  }

  try {
    // Use the native 'open' command
    // Pass all arguments through to support flags like -a, -R, etc.
    execSync(`open ${target}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error: Could not open '${target}'.`);
    process.exit(1);
  }
}

/**
 * Open file or folder on Ubuntu using xdg-open or available alternatives.
 *
 * On Linux, 'xdg-open' is the standard cross-desktop way to open files/URLs
 * with the default application. It's part of the xdg-utils package and works
 * with GNOME, KDE, XFCE, and other desktop environments.
 *
 * If xdg-open is not available, falls back to desktop-specific commands:
 * - GNOME: gnome-open (deprecated), nautilus, gio open
 * - KDE: kde-open, kde-open5, kioclient5
 * - Others: sensible-browser (for URLs), exo-open (XFCE)
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Path to open (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_o_ubuntu(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('This command requires a graphical environment to open files.');
    console.log('');
    console.log('On a headless server, consider using:');
    console.log('  - cat, less, or vim to view file contents');
    console.log('  - ls to list directory contents');
    return;
  }

  // Get the target path (default to current directory)
  const targetPath = args[0] || '.';
  const absolutePath = validatePath(targetPath);

  // List of open commands to try, in order of preference
  const openCommands = [
    { cmd: 'xdg-open', check: 'xdg-open' },
    { cmd: 'gio', args: 'open', check: 'gio' },
    { cmd: 'gnome-open', check: 'gnome-open' },
    { cmd: 'kde-open5', check: 'kde-open5' },
    { cmd: 'kde-open', check: 'kde-open' },
    { cmd: 'exo-open', check: 'exo-open' },
    // For directories specifically, try file managers
    { cmd: 'nautilus', check: 'nautilus', dirOnly: true },
    { cmd: 'dolphin', check: 'dolphin', dirOnly: true },
    { cmd: 'thunar', check: 'thunar', dirOnly: true },
    { cmd: 'pcmanfm', check: 'pcmanfm', dirOnly: true }
  ];

  const isDirectory = fs.statSync(absolutePath).isDirectory();

  for (const openMethod of openCommands) {
    // Skip directory-only commands for files
    if (openMethod.dirOnly && !isDirectory) {
      continue;
    }

    if (isCommandAvailable(openMethod.check)) {
      try {
        const fullCommand = openMethod.args
          ? `${openMethod.cmd} ${openMethod.args} "${absolutePath}"`
          : `${openMethod.cmd} "${absolutePath}"`;

        // Use exec (non-blocking) so the GUI app can open without blocking the terminal
        // Redirect stderr to /dev/null to suppress GTK warnings that don't affect functionality
        exec(`${fullCommand} 2>/dev/null`, (error) => {
          // Don't report errors - the command may return non-zero but still work
        });
        return; // Success, exit
      } catch {
        // This method failed, try the next one
        continue;
      }
    }
  }

  // No open method worked
  console.error('Error: Could not find a command to open files.');
  console.error('');
  console.error('Install xdg-utils for standard file opening support:');
  console.error('  sudo apt install xdg-utils');
  process.exit(1);
}

/**
 * Open file or folder on Raspberry Pi OS.
 *
 * Raspberry Pi OS is Debian-based and typically uses LXDE or PIXEL desktop.
 * The behavior is similar to Ubuntu, using xdg-open or desktop-specific
 * commands as fallbacks.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Path to open (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_o_raspbian(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('This command requires a graphical environment to open files.');
    console.log('');
    console.log('On a headless Raspberry Pi, consider using:');
    console.log('  - cat, less, or vim to view file contents');
    console.log('  - ls to list directory contents');
    return;
  }

  // Get the target path (default to current directory)
  const targetPath = args[0] || '.';
  const absolutePath = validatePath(targetPath);

  // List of open commands to try, in order of preference for Raspberry Pi
  const openCommands = [
    { cmd: 'xdg-open', check: 'xdg-open' },
    // PCManFM is the default file manager on Raspberry Pi OS with LXDE
    { cmd: 'pcmanfm', check: 'pcmanfm', dirOnly: true },
    { cmd: 'gio', args: 'open', check: 'gio' },
    { cmd: 'exo-open', check: 'exo-open' },
    { cmd: 'thunar', check: 'thunar', dirOnly: true }
  ];

  const isDirectory = fs.statSync(absolutePath).isDirectory();

  for (const openMethod of openCommands) {
    // Skip directory-only commands for files
    if (openMethod.dirOnly && !isDirectory) {
      continue;
    }

    if (isCommandAvailable(openMethod.check)) {
      try {
        const fullCommand = openMethod.args
          ? `${openMethod.cmd} ${openMethod.args} "${absolutePath}"`
          : `${openMethod.cmd} "${absolutePath}"`;

        // Use exec (non-blocking) so the GUI app can open without blocking the terminal
        exec(`${fullCommand} 2>/dev/null`, (error) => {
          // Don't report errors - the command may return non-zero but still work
        });
        return; // Success, exit
      } catch {
        // This method failed, try the next one
        continue;
      }
    }
  }

  // No open method worked
  console.error('Error: Could not find a command to open files.');
  console.error('');
  console.error('Install xdg-utils for standard file opening support:');
  console.error('  sudo apt install xdg-utils');
  process.exit(1);
}

/**
 * Open file or folder on Amazon Linux.
 *
 * Amazon Linux is typically used in server environments without a desktop.
 * If a desktop is present, it attempts to use xdg-open or available alternatives.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Path to open (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_o_amazon_linux(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('Amazon Linux is typically used in server environments.');
    console.log('');
    console.log('On a headless server, consider using:');
    console.log('  - cat, less, or vim to view file contents');
    console.log('  - ls to list directory contents');
    return;
  }

  // Get the target path (default to current directory)
  const targetPath = args[0] || '.';
  const absolutePath = validatePath(targetPath);

  // Try available open commands
  const openCommands = [
    { cmd: 'xdg-open', check: 'xdg-open' },
    { cmd: 'gio', args: 'open', check: 'gio' }
  ];

  for (const openMethod of openCommands) {
    if (isCommandAvailable(openMethod.check)) {
      try {
        const fullCommand = openMethod.args
          ? `${openMethod.cmd} ${openMethod.args} "${absolutePath}"`
          : `${openMethod.cmd} "${absolutePath}"`;

        exec(`${fullCommand} 2>/dev/null`, (error) => {
          // Don't report errors
        });
        return;
      } catch {
        continue;
      }
    }
  }

  console.error('Error: Could not find a command to open files.');
  console.error('');
  console.error('Install xdg-utils for standard file opening support:');
  console.error('  sudo dnf install xdg-utils');
  process.exit(1);
}

/**
 * Open file or folder in Windows Command Prompt using 'start' command.
 *
 * The 'start' command is built into Windows CMD and opens files/folders with
 * the default application. For directories, it opens Explorer. For files, it
 * opens the associated application.
 *
 * Note: The 'start' command has special quoting requirements. When the path
 * contains spaces and is quoted, 'start' interprets it as a window title.
 * We use an empty title ("") to avoid this issue.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Path to open (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_o_cmd(args) {
  // Get the target path (default to current directory)
  const targetPath = args[0] || '.';
  const absolutePath = validatePath(targetPath);

  try {
    // The 'start' command needs an empty title ("") before the path if the path contains spaces
    // Otherwise it interprets the quoted path as a window title
    // Use cmd /c to run the command properly
    execSync(`cmd /c start "" "${absolutePath}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error: Could not open '${targetPath}'.`);
    process.exit(1);
  }
}

/**
 * Open file or folder in Windows PowerShell using Start-Process or Invoke-Item.
 *
 * PowerShell provides several ways to open files:
 * - Invoke-Item: Opens items with the default application
 * - Start-Process: More control over how the process is started
 * - explorer.exe: Directly calls Windows Explorer
 *
 * We use Invoke-Item as it's the most natural PowerShell equivalent of 'open'.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Path to open (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_o_powershell(args) {
  // Get the target path (default to current directory)
  const targetPath = args[0] || '.';
  const absolutePath = validatePath(targetPath);

  try {
    // Invoke-Item opens the item with its default application
    // Escape the path for PowerShell
    const escapedPath = absolutePath.replace(/'/g, "''");
    execSync(`powershell -Command "Invoke-Item -Path '${escapedPath}'"`, { stdio: 'inherit' });
  } catch (error) {
    // Fallback to explorer.exe if Invoke-Item fails
    try {
      execSync(`explorer.exe "${absolutePath}"`, { stdio: 'inherit' });
    } catch {
      console.error(`Error: Could not open '${targetPath}'.`);
      process.exit(1);
    }
  }
}

/**
 * Open file or folder from Git Bash on Windows.
 *
 * Git Bash runs on Windows, so we can use Windows commands to open files.
 * The 'start' command is available in Git Bash through MSYS2/MinGW.
 * Alternatively, we can call explorer.exe directly.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Path to open (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_o_gitbash(args) {
  // Get the target path (default to current directory)
  const targetPath = args[0] || '.';
  const absolutePath = validatePath(targetPath);

  try {
    // Use start command which is available in Git Bash
    // Convert path to Windows format if needed
    execSync(`start "" "${absolutePath}"`, { stdio: 'inherit' });
  } catch {
    // Fallback to explorer.exe
    try {
      execSync(`explorer.exe "${absolutePath}"`, { stdio: 'inherit' });
    } catch {
      console.error(`Error: Could not open '${targetPath}'.`);
      process.exit(1);
    }
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "o" (open) command opens a file or folder using the operating system's
 * default application. This is a quick shortcut for opening things from the
 * command line without typing the full command name:
 *
 * - On macOS: Opens with Finder for directories, default app for files
 * - On Linux: Uses xdg-open or desktop-specific commands
 * - On Windows: Uses start/explorer to open with default application
 *
 * Usage:
 *   o                 # Open current directory in file manager
 *   o ~/Documents     # Open Documents folder
 *   o file.pdf        # Open PDF in default viewer
 *   o image.png       # Open image in default viewer
 *   o http://example.com  # Open URL in default browser (macOS/Linux)
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_o(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_o_macos,
    'ubuntu': do_o_ubuntu,
    'debian': do_o_ubuntu,
    'raspbian': do_o_raspbian,
    'amazon_linux': do_o_amazon_linux,
    'rhel': do_o_amazon_linux,
    'fedora': do_o_ubuntu,
    'linux': do_o_ubuntu,
    'wsl': do_o_ubuntu,
    'cmd': do_o_cmd,
    'windows': do_o_cmd,
    'powershell': do_o_powershell,
    'gitbash': do_o_gitbash
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
  main: do_o,
  do_o,
  do_o_nodejs,
  do_o_macos,
  do_o_ubuntu,
  do_o_raspbian,
  do_o_amazon_linux,
  do_o_cmd,
  do_o_powershell,
  do_o_gitbash
};

if (require.main === module) {
  do_o(process.argv.slice(2));
}
