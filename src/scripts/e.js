#!/usr/bin/env node

/**
 * e - Open files in vim editor
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias e="vim --"
 *
 * This script opens the specified file(s) in the vim editor. The "--" ensures
 * that any arguments starting with "-" are treated as file names rather than
 * vim options. This is a common developer shortcut for quickly editing files.
 *
 * @module scripts/e
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to detect which editor is available.
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
 * Launching an interactive terminal editor like vim requires OS-level terminal
 * control and cannot be done in pure Node.js. Each platform must spawn the
 * editor process with proper terminal inheritance.
 *
 * @param {string[]} args - Command line arguments (file paths to open)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_e_nodejs(args) {
  // Launching an interactive editor requires terminal integration that cannot
  // be implemented in pure Node.js. Each platform function spawns the editor
  // with inherited stdio to maintain proper terminal control.
  throw new Error(
    'do_e_nodejs should not be called directly. ' +
    'Launching an interactive editor requires OS-specific terminal handling.'
  );
}

/**
 * Open files in vim on macOS.
 *
 * macOS comes with vim pre-installed. This function spawns vim with the
 * provided file arguments, using "--" to prevent arguments starting with
 * "-" from being interpreted as vim options.
 *
 * @param {string[]} args - Command line arguments (file paths to open)
 * @returns {Promise<void>}
 */
async function do_e_macos(args) {
  // Check if vim is available (it should be on macOS, but be safe)
  if (!isCommandAvailable('vim')) {
    console.error('Error: vim is not installed.');
    console.error('vim should be pre-installed on macOS. If missing, install via:');
    console.error('  brew install vim');
    process.exit(1);
  }

  // Spawn vim with inherited stdio so the terminal stays interactive
  // The "--" separates vim options from file arguments, ensuring files
  // that start with "-" are not treated as options
  const result = spawnSync('vim', ['--', ...args], {
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    console.error('Error: Failed to launch vim.');
    console.error(result.error.message);
    process.exit(1);
  }

  // Exit with vim's exit code
  process.exit(result.status || 0);
}

/**
 * Open files in vim on Ubuntu.
 *
 * Ubuntu typically has vim or vim-tiny installed. If vim is not available,
 * the function tries vi as a fallback and provides installation instructions.
 *
 * @param {string[]} args - Command line arguments (file paths to open)
 * @returns {Promise<void>}
 */
async function do_e_ubuntu(args) {
  // Try vim first, then fall back to vi
  let editor = null;
  if (isCommandAvailable('vim')) {
    editor = 'vim';
  } else if (isCommandAvailable('vi')) {
    editor = 'vi';
  }

  if (!editor) {
    console.error('Error: vim is not installed.');
    console.error('Install vim with:');
    console.error('  sudo apt update && sudo apt install vim');
    process.exit(1);
  }

  // Spawn the editor with inherited stdio for interactive terminal control
  const result = spawnSync(editor, ['--', ...args], {
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    console.error(`Error: Failed to launch ${editor}.`);
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status || 0);
}

/**
 * Open files in vim on Raspberry Pi OS.
 *
 * Raspberry Pi OS (Raspbian) is Debian-based and typically has vim-tiny
 * pre-installed. Falls back to vi if vim is not available.
 *
 * @param {string[]} args - Command line arguments (file paths to open)
 * @returns {Promise<void>}
 */
async function do_e_raspbian(args) {
  // Try vim first, then fall back to vi
  let editor = null;
  if (isCommandAvailable('vim')) {
    editor = 'vim';
  } else if (isCommandAvailable('vi')) {
    editor = 'vi';
  }

  if (!editor) {
    console.error('Error: vim is not installed.');
    console.error('Install vim with:');
    console.error('  sudo apt update && sudo apt install vim');
    process.exit(1);
  }

  const result = spawnSync(editor, ['--', ...args], {
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    console.error(`Error: Failed to launch ${editor}.`);
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status || 0);
}

/**
 * Open files in vim on Amazon Linux.
 *
 * Amazon Linux typically has vim-minimal installed. Falls back to vi
 * if the full vim is not available.
 *
 * @param {string[]} args - Command line arguments (file paths to open)
 * @returns {Promise<void>}
 */
async function do_e_amazon_linux(args) {
  // Try vim first, then fall back to vi
  let editor = null;
  if (isCommandAvailable('vim')) {
    editor = 'vim';
  } else if (isCommandAvailable('vi')) {
    editor = 'vi';
  }

  if (!editor) {
    console.error('Error: vim is not installed.');
    console.error('Install vim with:');
    console.error('  sudo dnf install vim-enhanced');
    console.error('  or');
    console.error('  sudo yum install vim-enhanced');
    process.exit(1);
  }

  const result = spawnSync(editor, ['--', ...args], {
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    console.error(`Error: Failed to launch ${editor}.`);
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status || 0);
}

/**
 * Open files in vim on Windows Command Prompt.
 *
 * vim is not installed by default on Windows. This function checks for
 * common locations where vim might be installed (Git Bash, Chocolatey,
 * or standalone installation) and provides installation guidance.
 *
 * @param {string[]} args - Command line arguments (file paths to open)
 * @returns {Promise<void>}
 */
async function do_e_cmd(args) {
  // Check if vim is available
  if (!isCommandAvailable('vim')) {
    console.error('Error: vim is not installed or not in PATH.');
    console.error('');
    console.error('Install vim on Windows using one of these methods:');
    console.error('  choco install vim       # Using Chocolatey');
    console.error('  winget install vim.vim  # Using winget');
    console.error('  scoop install vim       # Using Scoop');
    console.error('');
    console.error('Or download from: https://www.vim.org/download.php');
    process.exit(1);
  }

  // Spawn vim with inherited stdio
  const result = spawnSync('vim', ['--', ...args], {
    stdio: 'inherit',
    shell: true  // Use shell on Windows for proper PATH resolution
  });

  if (result.error) {
    console.error('Error: Failed to launch vim.');
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status || 0);
}

/**
 * Open files in vim on Windows PowerShell.
 *
 * Same as CMD - vim is not installed by default. Provides installation
 * instructions for Windows package managers.
 *
 * @param {string[]} args - Command line arguments (file paths to open)
 * @returns {Promise<void>}
 */
async function do_e_powershell(args) {
  // Check if vim is available
  if (!isCommandAvailable('vim')) {
    console.error('Error: vim is not installed or not in PATH.');
    console.error('');
    console.error('Install vim on Windows using one of these methods:');
    console.error('  choco install vim       # Using Chocolatey');
    console.error('  winget install vim.vim  # Using winget');
    console.error('  scoop install vim       # Using Scoop');
    console.error('');
    console.error('Or download from: https://www.vim.org/download.php');
    process.exit(1);
  }

  const result = spawnSync('vim', ['--', ...args], {
    stdio: 'inherit',
    shell: true
  });

  if (result.error) {
    console.error('Error: Failed to launch vim.');
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status || 0);
}

/**
 * Open files in vim on Git Bash.
 *
 * Git Bash on Windows comes with vim included as part of the Git for Windows
 * installation. This is the most reliable way to use vim on Windows.
 *
 * @param {string[]} args - Command line arguments (file paths to open)
 * @returns {Promise<void>}
 */
async function do_e_gitbash(args) {
  // Git Bash typically includes vim
  if (!isCommandAvailable('vim')) {
    console.error('Error: vim is not found.');
    console.error('Git Bash usually includes vim. If missing, try:');
    console.error('  - Reinstalling Git for Windows with vim option enabled');
    console.error('  - Installing vim separately: choco install vim');
    process.exit(1);
  }

  const result = spawnSync('vim', ['--', ...args], {
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    console.error('Error: Failed to launch vim.');
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status || 0);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "e" command opens files in the vim editor. This is a common developer
 * shortcut that provides quick access to vim without typing the full command.
 * The "--" separator ensures that file names starting with "-" are handled
 * correctly and not interpreted as vim options.
 *
 * Usage:
 *   e file.txt           # Open file.txt in vim
 *   e file1.js file2.js  # Open multiple files
 *   e -strange-name.txt  # Open file with "-" prefix (handled correctly)
 *
 * @param {string[]} args - Command line arguments (file paths to open)
 * @returns {Promise<void>}
 */
async function do_e(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_e_macos,
    'ubuntu': do_e_ubuntu,
    'debian': do_e_ubuntu,
    'raspbian': do_e_raspbian,
    'amazon_linux': do_e_amazon_linux,
    'rhel': do_e_amazon_linux,
    'fedora': do_e_ubuntu,
    'linux': do_e_ubuntu,
    'wsl': do_e_ubuntu,
    'cmd': do_e_cmd,
    'windows': do_e_cmd,
    'powershell': do_e_powershell,
    'gitbash': do_e_gitbash
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
  main: do_e,
  do_e,
  do_e_nodejs,
  do_e_macos,
  do_e_ubuntu,
  do_e_raspbian,
  do_e_amazon_linux,
  do_e_cmd,
  do_e_powershell,
  do_e_gitbash
};

if (require.main === module) {
  do_e(process.argv.slice(2));
}
