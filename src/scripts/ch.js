#!/usr/bin/env node

/**
 * ch - Clear shell command history
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias ch="history -c && > ~/.bash_history"
 *
 * This script clears the shell command history by:
 * 1. Truncating the history file on disk (removes saved history)
 * 2. Informing the user that in-memory history requires shell restart or manual clear
 *
 * Note: The original alias used `history -c` to clear in-memory history, but that
 * is a shell built-in that only works within the shell process itself. A Node.js
 * script cannot clear the parent shell's in-memory history. However, we CAN clear
 * the history file, which means history won't persist across sessions.
 *
 * @module scripts/ch
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');

/**
 * Get the home directory path.
 * Uses Node.js built-in os module for cross-platform compatibility.
 *
 * @returns {string} The user's home directory path
 */
function getHomeDir() {
  return require('os').homedir();
}

/**
 * Detect which shell history files exist and should be cleared.
 * Different shells store history in different locations:
 * - Bash: ~/.bash_history (or $HISTFILE)
 * - Zsh: ~/.zsh_history (or $HISTFILE)
 * - Fish: ~/.local/share/fish/fish_history
 *
 * @returns {string[]} Array of history file paths that exist
 */
function findHistoryFiles() {
  const home = getHomeDir();
  const historyFiles = [];

  // Common history file locations
  const possibleFiles = [
    // Bash history
    path.join(home, '.bash_history'),
    // Zsh history
    path.join(home, '.zsh_history'),
    // Fish history (less common but worth checking)
    path.join(home, '.local', 'share', 'fish', 'fish_history'),
    // Some systems use .history
    path.join(home, '.history'),
    // Ksh history
    path.join(home, '.sh_history')
  ];

  // Check $HISTFILE environment variable for custom locations
  if (process.env.HISTFILE) {
    possibleFiles.unshift(process.env.HISTFILE);
  }

  // Filter to only files that exist
  for (const filePath of possibleFiles) {
    try {
      if (fs.existsSync(filePath)) {
        historyFiles.push(filePath);
      }
    } catch {
      // Ignore errors checking for files
    }
  }

  return historyFiles;
}

/**
 * Truncate a file to zero bytes.
 * This is equivalent to `> filename` in bash.
 *
 * @param {string} filePath - Path to the file to truncate
 * @returns {boolean} True if successful, false otherwise
 */
function truncateFile(filePath) {
  try {
    // Open the file with 'w' flag which truncates it to zero length
    fs.writeFileSync(filePath, '', { encoding: 'utf8' });
    return true;
  } catch (error) {
    console.error(`Warning: Could not clear ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Pure Node.js implementation that works on Unix-like systems.
 *
 * This function finds and clears shell history files using the Node.js fs module.
 * It's the core implementation used by macOS, Linux, and Git Bash platforms.
 *
 * Important limitation: We cannot clear the in-memory history of the parent shell
 * from within a child process. The user must either:
 * - Start a new shell session, or
 * - Run `history -c` manually in their current shell
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_ch_nodejs(args) {
  const historyFiles = findHistoryFiles();

  if (historyFiles.length === 0) {
    console.log('No shell history files found.');
    console.log('');
    console.log('Checked locations:');
    console.log('  ~/.bash_history');
    console.log('  ~/.zsh_history');
    console.log('  ~/.local/share/fish/fish_history');
    console.log('  $HISTFILE (if set)');
    return;
  }

  let clearedCount = 0;

  for (const filePath of historyFiles) {
    if (truncateFile(filePath)) {
      console.log(`Cleared: ${filePath}`);
      clearedCount++;
    }
  }

  if (clearedCount > 0) {
    console.log('');
    console.log('History file(s) cleared successfully.');
    console.log('');
    console.log('Note: To clear in-memory history for your current shell session:');
    console.log('  Bash: Run "history -c" or start a new terminal');
    console.log('  Zsh:  Run "fc -p" or start a new terminal');
  }
}

/**
 * Clear shell history on macOS.
 *
 * macOS may use either bash (older versions) or zsh (Catalina and later).
 * This function uses the pure Node.js implementation to clear all found
 * history files.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_ch_macos(args) {
  return do_ch_nodejs(args);
}

/**
 * Clear shell history on Ubuntu.
 *
 * Ubuntu typically uses bash by default, but users may have installed
 * and configured other shells like zsh or fish. This function clears
 * all found history files.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_ch_ubuntu(args) {
  return do_ch_nodejs(args);
}

/**
 * Clear shell history on Raspberry Pi OS.
 *
 * Raspberry Pi OS uses bash by default. This function clears all found
 * history files using the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_ch_raspbian(args) {
  return do_ch_nodejs(args);
}

/**
 * Clear shell history on Amazon Linux.
 *
 * Amazon Linux uses bash by default. This function clears all found
 * history files using the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_ch_amazon_linux(args) {
  return do_ch_nodejs(args);
}

/**
 * Clear command history in Windows Command Prompt.
 *
 * Windows CMD does not persist command history to a file by default.
 * The history only exists in memory for the current session and is lost
 * when the CMD window is closed.
 *
 * To clear the current session's history, the user would need to use
 * `doskey /reinstall` from within CMD, but that cannot be done from
 * a child process.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_ch_cmd(args) {
  console.log('Windows Command Prompt does not persist history to a file.');
  console.log('');
  console.log('CMD history only exists in memory for the current session.');
  console.log('');
  console.log('To clear the current session history:');
  console.log('  - Close and reopen the CMD window, or');
  console.log('  - Run: doskey /reinstall');
  console.log('');
  console.log('Note: History is automatically lost when you close CMD.');
}

/**
 * Clear command history in Windows PowerShell.
 *
 * PowerShell stores history in a file managed by PSReadLine module.
 * The file location is determined by (Get-PSReadLineOption).HistorySavePath
 * which is typically at:
 * - %APPDATA%\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_ch_powershell(args) {
  // Default PSReadLine history location
  const appData = process.env.APPDATA;

  if (!appData) {
    console.error('Error: APPDATA environment variable not found.');
    console.log('');
    console.log('To clear PowerShell history manually:');
    console.log('  Remove-Item (Get-PSReadLineOption).HistorySavePath');
    return;
  }

  // PowerShell history file path
  const historyPath = path.join(
    appData,
    'Microsoft',
    'Windows',
    'PowerShell',
    'PSReadLine',
    'ConsoleHost_history.txt'
  );

  if (!fs.existsSync(historyPath)) {
    console.log('No PowerShell history file found.');
    console.log('');
    console.log('Expected location:');
    console.log(`  ${historyPath}`);
    console.log('');
    console.log('History may not be saved yet, or PSReadLine is not enabled.');
    return;
  }

  if (truncateFile(historyPath)) {
    console.log(`Cleared: ${historyPath}`);
    console.log('');
    console.log('PowerShell history file cleared successfully.');
    console.log('');
    console.log('Note: To clear in-memory history for your current session:');
    console.log('  [Microsoft.PowerShell.PSConsoleReadLine]::ClearHistory()');
    console.log('  Or simply close and reopen PowerShell.');
  }
}

/**
 * Clear shell history in Git Bash on Windows.
 *
 * Git Bash uses bash, so the history is stored in ~/.bash_history
 * just like on Unix systems. We use the standard Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_ch_gitbash(args) {
  return do_ch_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "ch" (clear history) command clears the shell command history.
 * This is useful for:
 * - Privacy: Remove sensitive commands from history
 * - Cleanup: Start fresh with a clean history
 * - Security: Ensure no passwords/tokens are saved in history
 *
 * Important: This command clears the history FILE, but cannot clear the
 * in-memory history of the parent shell process. The user should either
 * start a new shell session or run the appropriate shell command to clear
 * in-memory history (e.g., `history -c` for bash).
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_ch(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_ch_macos,
    'ubuntu': do_ch_ubuntu,
    'debian': do_ch_ubuntu,
    'raspbian': do_ch_raspbian,
    'amazon_linux': do_ch_amazon_linux,
    'rhel': do_ch_amazon_linux,
    'fedora': do_ch_ubuntu,
    'linux': do_ch_ubuntu,
    'wsl': do_ch_ubuntu,
    'cmd': do_ch_cmd,
    'windows': do_ch_cmd,
    'powershell': do_ch_powershell,
    'gitbash': do_ch_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    // Fallback: Try the Node.js implementation for unknown Unix-like systems
    console.error(`Note: Platform '${platform.type}' not explicitly supported, attempting to clear history files...`);
    await do_ch_nodejs(args);
    return;
  }

  await handler(args);
}

module.exports = {
  main: do_ch,
  do_ch,
  do_ch_nodejs,
  do_ch_macos,
  do_ch_ubuntu,
  do_ch_raspbian,
  do_ch_amazon_linux,
  do_ch_cmd,
  do_ch_powershell,
  do_ch_gitbash
};

if (require.main === module) {
  do_ch(process.argv.slice(2));
}
