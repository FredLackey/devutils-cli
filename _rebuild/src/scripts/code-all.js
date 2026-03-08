#!/usr/bin/env node

/**
 * code-all - Open all subdirectories in VS Code
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias code-all="find . -type d -depth 1 -exec code {} \;"
 *
 * This script opens each immediate subdirectory of the specified directory
 * (or current directory) as a separate VS Code window. This is useful when
 * you have a folder containing multiple projects and want to open them all
 * at once.
 *
 * Example usage:
 *   code-all           # Opens all subdirs of current directory
 *   code-all ~/Source  # Opens all subdirs of ~/Source
 *
 * @module scripts/code-all
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to verify VS Code CLI is available before attempting to use it.
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
 * Get all immediate subdirectories of a given path.
 * Uses pure Node.js file system APIs for cross-platform compatibility.
 *
 * @param {string} targetPath - The directory to scan for subdirectories
 * @returns {string[]} Array of absolute paths to subdirectories
 */
function getSubdirectories(targetPath) {
  const absolutePath = path.resolve(targetPath);

  // Verify the path exists and is a directory
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: Path does not exist: ${absolutePath}`);
    process.exit(1);
  }

  const stats = fs.statSync(absolutePath);
  if (!stats.isDirectory()) {
    console.error(`Error: Path is not a directory: ${absolutePath}`);
    process.exit(1);
  }

  // Read directory contents and filter to only directories
  const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
  const subdirs = entries
    .filter(entry => entry.isDirectory())
    .filter(entry => !entry.name.startsWith('.'))  // Skip hidden directories
    .map(entry => path.join(absolutePath, entry.name))
    .sort();  // Sort alphabetically for consistent ordering

  return subdirs;
}

/**
 * Open a directory in VS Code.
 * Uses spawn with 'detached' to allow VS Code windows to stay open after script exits.
 *
 * @param {string} dirPath - Absolute path to the directory to open
 * @param {string} codeCommand - The VS Code command to use ('code', 'code-insiders', etc.)
 * @returns {void}
 */
function openInVSCode(dirPath, codeCommand) {
  // Spawn VS Code in detached mode so it stays open after script exits
  // Using stdio: 'ignore' and unref() to fully detach the process
  const child = spawn(codeCommand, [dirPath], {
    detached: true,
    stdio: 'ignore',
    shell: process.platform === 'win32'  // Use shell on Windows for better PATH resolution
  });

  // Unref allows the parent process to exit while VS Code stays running
  child.unref();
}

/**
 * Pure Node.js implementation for opening subdirectories in VS Code.
 *
 * This function uses:
 * - fs.readdirSync() to list directories (pure Node.js)
 * - spawn() to launch VS Code (requires 'code' command in PATH)
 *
 * The 'code' command must be installed and available in PATH. On most platforms,
 * VS Code adds this automatically during installation, but on macOS you may need
 * to run "Shell Command: Install 'code' command in PATH" from the Command Palette.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path (defaults to current directory)
 * @param {string} codeCommand - The VS Code command to use
 * @returns {Promise<void>}
 */
async function do_code_all_nodejs(args, codeCommand = 'code') {
  // Determine target directory: use provided arg or current directory
  const targetPath = args[0] || process.cwd();

  // Get all subdirectories
  const subdirs = getSubdirectories(targetPath);

  if (subdirs.length === 0) {
    console.log(`No subdirectories found in: ${path.resolve(targetPath)}`);
    console.log('');
    console.log('This command opens each immediate subdirectory as a VS Code window.');
    console.log('Make sure the target directory contains subdirectories (not just files).');
    return;
  }

  console.log(`Opening ${subdirs.length} subdirectories in VS Code...`);
  console.log('');

  // Open each subdirectory in VS Code
  for (const dir of subdirs) {
    const dirName = path.basename(dir);
    console.log(`  Opening: ${dirName}`);
    openInVSCode(dir, codeCommand);
  }

  console.log('');
  console.log('Done! All directories have been opened in VS Code.');
}

/**
 * Open all subdirectories in VS Code on macOS.
 *
 * On macOS, VS Code installs the 'code' command via the Command Palette:
 * "Shell Command: Install 'code' command in PATH"
 *
 * If VS Code is not in PATH, this function provides helpful instructions.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_code_all_macos(args) {
  // Check for VS Code command availability
  // Try 'code' first, then 'code-insiders' for Insiders edition
  let codeCommand = null;

  if (isCommandAvailable('code')) {
    codeCommand = 'code';
  } else if (isCommandAvailable('code-insiders')) {
    codeCommand = 'code-insiders';
  }

  if (!codeCommand) {
    console.error('Error: VS Code command not found in PATH.');
    console.error('');
    console.error('To fix this:');
    console.error('1. Open VS Code');
    console.error('2. Press Cmd+Shift+P to open Command Palette');
    console.error('3. Type "Shell Command: Install \'code\' command in PATH"');
    console.error('4. Press Enter');
    console.error('');
    console.error('Alternatively, install VS Code via Homebrew:');
    console.error('  brew install --cask visual-studio-code');
    process.exit(1);
  }

  return do_code_all_nodejs(args, codeCommand);
}

/**
 * Open all subdirectories in VS Code on Ubuntu.
 *
 * On Ubuntu, VS Code can be installed via:
 * - Snap: sudo snap install code --classic
 * - APT: From Microsoft's repository
 * - DEB package: Downloaded from code.visualstudio.com
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_code_all_ubuntu(args) {
  let codeCommand = null;

  if (isCommandAvailable('code')) {
    codeCommand = 'code';
  } else if (isCommandAvailable('code-insiders')) {
    codeCommand = 'code-insiders';
  }

  if (!codeCommand) {
    console.error('Error: VS Code command not found in PATH.');
    console.error('');
    console.error('Install VS Code using one of these methods:');
    console.error('');
    console.error('  Via Snap (recommended):');
    console.error('    sudo snap install code --classic');
    console.error('');
    console.error('  Via APT:');
    console.error('    wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg');
    console.error('    sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg');
    console.error('    echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list');
    console.error('    sudo apt update && sudo apt install code');
    process.exit(1);
  }

  return do_code_all_nodejs(args, codeCommand);
}

/**
 * Open all subdirectories in VS Code on Raspberry Pi OS.
 *
 * VS Code has ARM builds that work on Raspberry Pi 4 and newer.
 * Installation is similar to Ubuntu/Debian.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_code_all_raspbian(args) {
  let codeCommand = null;

  if (isCommandAvailable('code')) {
    codeCommand = 'code';
  } else if (isCommandAvailable('code-insiders')) {
    codeCommand = 'code-insiders';
  } else if (isCommandAvailable('code-oss')) {
    // Raspberry Pi OS sometimes has the open-source version
    codeCommand = 'code-oss';
  }

  if (!codeCommand) {
    console.error('Error: VS Code command not found in PATH.');
    console.error('');
    console.error('Install VS Code on Raspberry Pi:');
    console.error('');
    console.error('  Via APT (Raspberry Pi 4/5 - 64-bit):');
    console.error('    sudo apt update');
    console.error('    sudo apt install code');
    console.error('');
    console.error('  Or download from: https://code.visualstudio.com/download');
    console.error('  (Choose the ARM64 .deb package)');
    process.exit(1);
  }

  return do_code_all_nodejs(args, codeCommand);
}

/**
 * Open all subdirectories in VS Code on Amazon Linux.
 *
 * Amazon Linux is typically used for servers, but VS Code can be installed
 * if a desktop environment is present.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_code_all_amazon_linux(args) {
  // Check if desktop environment is available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.error('Error: No desktop environment detected.');
    console.error('');
    console.error('VS Code requires a graphical environment.');
    console.error('Amazon Linux is typically used for servers without a desktop.');
    console.error('');
    console.error('Consider using VS Code Remote-SSH instead:');
    console.error('1. Install VS Code on your local machine');
    console.error('2. Install the "Remote - SSH" extension');
    console.error('3. Connect to this server remotely');
    process.exit(1);
  }

  let codeCommand = null;

  if (isCommandAvailable('code')) {
    codeCommand = 'code';
  } else if (isCommandAvailable('code-insiders')) {
    codeCommand = 'code-insiders';
  }

  if (!codeCommand) {
    console.error('Error: VS Code command not found in PATH.');
    console.error('');
    console.error('Download VS Code from: https://code.visualstudio.com/download');
    console.error('Choose the RPM package for Amazon Linux.');
    process.exit(1);
  }

  return do_code_all_nodejs(args, codeCommand);
}

/**
 * Open all subdirectories in VS Code on Windows (Command Prompt).
 *
 * On Windows, VS Code installer typically adds 'code' to the PATH.
 * If not found, user may need to restart their terminal or reinstall.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_code_all_cmd(args) {
  let codeCommand = null;

  // On Windows, use 'where' to check for command availability
  if (isCommandAvailable('code')) {
    codeCommand = 'code';
  } else if (isCommandAvailable('code-insiders')) {
    codeCommand = 'code-insiders';
  }

  if (!codeCommand) {
    console.error('Error: VS Code command not found in PATH.');
    console.error('');
    console.error('Possible solutions:');
    console.error('');
    console.error('1. If VS Code is installed, restart your terminal to refresh PATH');
    console.error('');
    console.error('2. Install VS Code via winget:');
    console.error('   winget install Microsoft.VisualStudioCode');
    console.error('');
    console.error('3. Install via Chocolatey:');
    console.error('   choco install vscode');
    console.error('');
    console.error('4. Download from: https://code.visualstudio.com/download');
    console.error('   Make sure to check "Add to PATH" during installation');
    process.exit(1);
  }

  return do_code_all_nodejs(args, codeCommand);
}

/**
 * Open all subdirectories in VS Code on Windows (PowerShell).
 *
 * PowerShell uses the same mechanism as CMD for running VS Code.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_code_all_powershell(args) {
  // PowerShell uses the same PATH as CMD, so same detection works
  return do_code_all_cmd(args);
}

/**
 * Open all subdirectories in VS Code on Git Bash.
 *
 * Git Bash on Windows can access the Windows 'code' command.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_code_all_gitbash(args) {
  // Git Bash runs on Windows and can access Windows PATH
  return do_code_all_cmd(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Opens each immediate subdirectory of the target directory (or current directory
 * if not specified) in a separate VS Code window. This is useful for quickly
 * opening multiple projects at once.
 *
 * The script:
 * 1. Validates the target directory exists
 * 2. Finds all immediate subdirectories (excluding hidden ones)
 * 3. Opens each one in VS Code as a separate window
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_code_all(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_code_all_macos,
    'ubuntu': do_code_all_ubuntu,
    'debian': do_code_all_ubuntu,
    'raspbian': do_code_all_raspbian,
    'amazon_linux': do_code_all_amazon_linux,
    'rhel': do_code_all_amazon_linux,
    'fedora': do_code_all_ubuntu,
    'linux': do_code_all_ubuntu,
    'wsl': do_code_all_ubuntu,
    'cmd': do_code_all_cmd,
    'windows': do_code_all_cmd,
    'powershell': do_code_all_powershell,
    'gitbash': do_code_all_gitbash
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
    console.error('  - Windows Subsystem for Linux (WSL)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_code_all,
  do_code_all,
  do_code_all_nodejs,
  do_code_all_macos,
  do_code_all_ubuntu,
  do_code_all_raspbian,
  do_code_all_amazon_linux,
  do_code_all_cmd,
  do_code_all_powershell,
  do_code_all_gitbash
};

if (require.main === module) {
  do_code_all(process.argv.slice(2));
}
