#!/usr/bin/env node

/**
 * h - Search command history
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   h() {
 *     grep --color=always "$*" "$HISTFILE" \
 *       | less --no-init --raw-control-chars
 *   }
 *
 * This script searches the shell command history file for entries matching
 * the specified pattern and displays results with highlighting. The history
 * file location varies by platform and shell:
 * - Bash: ~/.bash_history
 * - Zsh: ~/.zsh_history
 * - PowerShell: (Get-PSReadlineOption).HistorySavePath
 * - CMD: doskey /history (no persistent file)
 *
 * @module scripts/h
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to detect which pager (less, more) is available.
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
 * Get the path to the shell history file based on common locations.
 * Checks environment variables first, then falls back to default locations.
 *
 * @returns {string|null} Path to history file, or null if not found
 */
function getHistoryFilePath() {
  const homeDir = os.getHomeDir();

  // Check HISTFILE environment variable first (bash/zsh set this)
  if (process.env.HISTFILE && fs.existsSync(process.env.HISTFILE)) {
    return process.env.HISTFILE;
  }

  // Common history file locations in order of preference
  const historyFiles = [
    // Zsh history
    path.join(homeDir, '.zsh_history'),
    // Bash history
    path.join(homeDir, '.bash_history'),
    // Fish history
    path.join(homeDir, '.local', 'share', 'fish', 'fish_history'),
    // Alternative zsh locations
    path.join(homeDir, '.zhistory'),
    path.join(homeDir, '.histfile')
  ];

  // Return the first history file that exists
  for (const histFile of historyFiles) {
    if (fs.existsSync(histFile)) {
      return histFile;
    }
  }

  return null;
}

/**
 * Escape special regex characters in the search pattern.
 * This allows users to search for literal strings containing special characters.
 *
 * @param {string} pattern - The raw search pattern
 * @returns {string} Pattern with regex special characters escaped
 */
function escapeRegex(pattern) {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlight matching text in a line using ANSI color codes.
 * Wraps matches in red/bold for visibility.
 *
 * @param {string} line - The line of text to highlight
 * @param {RegExp} regex - The regex pattern to match
 * @returns {string} Line with ANSI color codes for matches
 */
function highlightMatches(line, regex) {
  // ANSI codes: \x1b[1;31m = bold red, \x1b[0m = reset
  return line.replace(regex, '\x1b[1;31m$&\x1b[0m');
}

/**
 * Parse zsh history format which includes timestamps.
 * Zsh extended history format: ": timestamp:0;command"
 *
 * @param {string} line - A line from the zsh history file
 * @returns {string} The actual command without metadata
 */
function parseZshHistoryLine(line) {
  // Zsh extended history format: ": 1234567890:0;command"
  const match = line.match(/^:\s*\d+:\d+;(.*)$/);
  if (match) {
    return match[1];
  }
  return line;
}

/**
 * Determine if the history file appears to be zsh format.
 * Zsh extended history has lines starting with ": timestamp:0;"
 *
 * @param {string} content - The history file content
 * @returns {boolean} True if zsh format is detected
 */
function isZshHistoryFormat(content) {
  const lines = content.split('\n').slice(0, 10);
  for (const line of lines) {
    if (line.match(/^:\s*\d+:\d+;/)) {
      return true;
    }
  }
  return false;
}

/**
 * Pure Node.js implementation that works on any platform.
 *
 * Searches the shell history file for lines matching the given pattern
 * and outputs matching lines with the search term highlighted. This
 * implementation works across all platforms where a history file exists.
 *
 * Since there's no interactive pager in pure Node.js, this version
 * prints all results directly. Platform-specific functions may pipe
 * to 'less' or 'more' for better user experience.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_h_nodejs(args) {
  // Combine all arguments into a single search pattern
  // This matches the original behavior: h "git commit" or h git commit
  const searchPattern = args.join(' ');

  if (!searchPattern) {
    console.error('Usage: h <search-pattern>');
    console.error('');
    console.error('Search your shell command history for matching entries.');
    console.error('');
    console.error('Examples:');
    console.error('  h git commit    - Find all git commit commands');
    console.error('  h npm install   - Find npm install commands');
    console.error('  h docker        - Find all docker-related commands');
    process.exit(1);
  }

  // Find the history file
  const historyFile = getHistoryFilePath();

  if (!historyFile) {
    console.error('Error: Could not find shell history file.');
    console.error('');
    console.error('Searched for:');
    console.error('  - $HISTFILE environment variable');
    console.error('  - ~/.zsh_history');
    console.error('  - ~/.bash_history');
    console.error('  - ~/.local/share/fish/fish_history');
    console.error('');
    console.error('Make sure your shell is configured to save history.');
    process.exit(1);
  }

  // Read the history file
  let content;
  try {
    content = fs.readFileSync(historyFile, 'utf8');
  } catch (error) {
    console.error(`Error: Could not read history file: ${historyFile}`);
    console.error(error.message);
    process.exit(1);
  }

  // Detect if this is zsh format
  const isZsh = isZshHistoryFormat(content);

  // Create a case-insensitive regex for matching
  // Use the escaped pattern for literal string matching (safer)
  const escapedPattern = escapeRegex(searchPattern);
  const regex = new RegExp(escapedPattern, 'gi');

  // Process each line and collect matches
  const lines = content.split('\n');
  const matches = [];

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Parse the command from the line (handles zsh timestamp format)
    const command = isZsh ? parseZshHistoryLine(line) : line;

    // Check if this line matches the pattern
    if (regex.test(command)) {
      // Reset regex lastIndex for the highlight step
      regex.lastIndex = 0;
      // Add the highlighted line to our matches
      matches.push(highlightMatches(command, regex));
    }

    // Reset regex lastIndex for next iteration
    regex.lastIndex = 0;
  }

  if (matches.length === 0) {
    console.log(`No matches found for: ${searchPattern}`);
    return;
  }

  // Output all matching lines
  for (const match of matches) {
    console.log(match);
  }
}

/**
 * Search history on macOS using grep and less.
 *
 * Uses the native grep for pattern matching and less for paging,
 * matching the original dotfiles behavior. Falls back to pure Node.js
 * if grep or less are not available.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_h_macos(args) {
  const searchPattern = args.join(' ');

  if (!searchPattern) {
    // Delegate to nodejs for help message
    return do_h_nodejs(args);
  }

  const historyFile = getHistoryFilePath();

  if (!historyFile) {
    return do_h_nodejs(args);
  }

  // Check if grep and less are available (they should be on macOS)
  if (!isCommandAvailable('grep') || !isCommandAvailable('less')) {
    // Fall back to Node.js implementation
    return do_h_nodejs(args);
  }

  try {
    // Use the original approach: grep with colors piped to less
    // --color=always: Enable colors even when piping
    // less --no-init: Don't clear screen after quitting
    // less --raw-control-chars: Display ANSI color codes
    const grepCmd = spawn('grep', ['--color=always', '-i', searchPattern, historyFile], {
      stdio: ['inherit', 'pipe', 'inherit']
    });

    const lessCmd = spawn('less', ['--no-init', '--raw-control-chars'], {
      stdio: ['pipe', 'inherit', 'inherit']
    });

    // Pipe grep output to less
    grepCmd.stdout.pipe(lessCmd.stdin);

    // Handle grep exit (no matches = exit code 1)
    grepCmd.on('close', (code) => {
      if (code === 1) {
        // No matches found - grep returns 1 when no matches
        lessCmd.stdin.end();
        console.log(`No matches found for: ${searchPattern}`);
      }
    });

    // Wait for less to close
    await new Promise((resolve) => {
      lessCmd.on('close', resolve);
    });
  } catch (error) {
    // Fall back to Node.js implementation
    return do_h_nodejs(args);
  }
}

/**
 * Search history on Ubuntu using grep and less.
 *
 * Uses the native grep for pattern matching and less for paging,
 * matching the original dotfiles behavior.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_h_ubuntu(args) {
  const searchPattern = args.join(' ');

  if (!searchPattern) {
    return do_h_nodejs(args);
  }

  const historyFile = getHistoryFilePath();

  if (!historyFile) {
    return do_h_nodejs(args);
  }

  // Check if grep and less are available
  if (!isCommandAvailable('grep') || !isCommandAvailable('less')) {
    return do_h_nodejs(args);
  }

  try {
    const grepCmd = spawn('grep', ['--color=always', '-i', searchPattern, historyFile], {
      stdio: ['inherit', 'pipe', 'inherit']
    });

    const lessCmd = spawn('less', ['--no-init', '--raw-control-chars'], {
      stdio: ['pipe', 'inherit', 'inherit']
    });

    grepCmd.stdout.pipe(lessCmd.stdin);

    grepCmd.on('close', (code) => {
      if (code === 1) {
        lessCmd.stdin.end();
        console.log(`No matches found for: ${searchPattern}`);
      }
    });

    await new Promise((resolve) => {
      lessCmd.on('close', resolve);
    });
  } catch (error) {
    return do_h_nodejs(args);
  }
}

/**
 * Search history on Raspberry Pi OS.
 *
 * Same approach as Ubuntu since Raspberry Pi OS is Debian-based.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_h_raspbian(args) {
  // Raspberry Pi OS is Debian-based, same approach as Ubuntu
  return do_h_ubuntu(args);
}

/**
 * Search history on Amazon Linux.
 *
 * Amazon Linux has grep and less available by default.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_h_amazon_linux(args) {
  // Amazon Linux has grep and less, use same approach
  return do_h_ubuntu(args);
}

/**
 * Search history on Windows Command Prompt.
 *
 * CMD doesn't have a persistent history file by default.
 * This function explains the limitation and suggests alternatives.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_h_cmd(args) {
  console.log('Note: Windows Command Prompt does not maintain a persistent history file.');
  console.log('');
  console.log('Alternatives:');
  console.log('  - Use PowerShell instead, which has persistent history');
  console.log('  - Press F7 in CMD to see recent commands');
  console.log('  - Use doskey /history to see current session history');
  console.log('');

  // Try to show current session history using doskey
  if (args.length === 0) {
    console.log('Current session history (doskey /history):');
    try {
      execSync('doskey /history', { stdio: 'inherit' });
    } catch {
      console.log('Could not retrieve doskey history.');
    }
  } else {
    // Try to filter doskey output
    const searchPattern = args.join(' ');
    console.log(`Searching current session for: ${searchPattern}`);
    try {
      execSync(`doskey /history | findstr /i "${searchPattern}"`, { stdio: 'inherit' });
    } catch {
      console.log('No matches found or doskey history unavailable.');
    }
  }
}

/**
 * Search history on Windows PowerShell.
 *
 * PowerShell maintains history in a file specified by PSReadLine.
 * Default location: %APPDATA%\\Microsoft\\Windows\\PowerShell\\PSReadline\\ConsoleHost_history.txt
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_h_powershell(args) {
  const searchPattern = args.join(' ');

  if (!searchPattern) {
    console.error('Usage: h <search-pattern>');
    console.error('');
    console.error('Search your PowerShell command history for matching entries.');
    console.error('');
    console.error('Examples:');
    console.error('  h git commit    - Find all git commit commands');
    console.error('  h npm install   - Find npm install commands');
    process.exit(1);
  }

  // PowerShell history file location
  const appData = process.env.APPDATA;
  if (!appData) {
    console.error('Error: APPDATA environment variable not set.');
    return do_h_nodejs(args);
  }

  const psHistoryFile = path.join(
    appData,
    'Microsoft',
    'Windows',
    'PowerShell',
    'PSReadLine',
    'ConsoleHost_history.txt'
  );

  if (!fs.existsSync(psHistoryFile)) {
    console.error('Error: PowerShell history file not found.');
    console.error(`Expected location: ${psHistoryFile}`);
    console.error('');
    console.error('Make sure PSReadLine is installed and configured.');
    console.error('Run in PowerShell: Get-PSReadLineOption');
    process.exit(1);
  }

  // Read and search the history file
  let content;
  try {
    content = fs.readFileSync(psHistoryFile, 'utf8');
  } catch (error) {
    console.error(`Error: Could not read history file: ${psHistoryFile}`);
    console.error(error.message);
    process.exit(1);
  }

  const escapedPattern = escapeRegex(searchPattern);
  const regex = new RegExp(escapedPattern, 'gi');

  const lines = content.split('\n');
  const matches = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    if (regex.test(line)) {
      regex.lastIndex = 0;
      matches.push(highlightMatches(line, regex));
    }
    regex.lastIndex = 0;
  }

  if (matches.length === 0) {
    console.log(`No matches found for: ${searchPattern}`);
    return;
  }

  // Output matches (no pager in Windows, just print)
  for (const match of matches) {
    console.log(match);
  }
}

/**
 * Search history from Git Bash on Windows.
 *
 * Git Bash uses bash, so it has ~/.bash_history.
 * This uses the same grep/less approach as Unix systems.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_h_gitbash(args) {
  const searchPattern = args.join(' ');

  if (!searchPattern) {
    return do_h_nodejs(args);
  }

  const historyFile = getHistoryFilePath();

  if (!historyFile) {
    return do_h_nodejs(args);
  }

  // Git Bash has grep and less available
  if (!isCommandAvailable('grep') || !isCommandAvailable('less')) {
    return do_h_nodejs(args);
  }

  try {
    const grepCmd = spawn('grep', ['--color=always', '-i', searchPattern, historyFile], {
      stdio: ['inherit', 'pipe', 'inherit']
    });

    const lessCmd = spawn('less', ['--no-init', '--raw-control-chars'], {
      stdio: ['pipe', 'inherit', 'inherit']
    });

    grepCmd.stdout.pipe(lessCmd.stdin);

    grepCmd.on('close', (code) => {
      if (code === 1) {
        lessCmd.stdin.end();
        console.log(`No matches found for: ${searchPattern}`);
      }
    });

    await new Promise((resolve) => {
      lessCmd.on('close', resolve);
    });
  } catch (error) {
    return do_h_nodejs(args);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "h" command searches shell command history for entries matching the
 * specified pattern. This is a common developer workflow: quickly finding
 * previously executed commands without scrolling through history manually.
 *
 * The behavior varies slightly by platform:
 * - macOS/Linux: Uses grep with highlighting piped to less for paging
 * - Windows PowerShell: Searches PSReadLine history file
 * - Windows CMD: Limited to current session (doskey)
 * - Git Bash: Uses grep/less like Linux
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_h(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_h_macos,
    'ubuntu': do_h_ubuntu,
    'debian': do_h_ubuntu,
    'raspbian': do_h_raspbian,
    'amazon_linux': do_h_amazon_linux,
    'rhel': do_h_amazon_linux,
    'fedora': do_h_ubuntu,
    'linux': do_h_ubuntu,
    'wsl': do_h_ubuntu,
    'cmd': do_h_cmd,
    'windows': do_h_powershell,
    'powershell': do_h_powershell,
    'gitbash': do_h_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Falling back to Node.js implementation...');
    console.error('');
    return do_h_nodejs(args);
  }

  await handler(args);
}

module.exports = {
  main: do_h,
  do_h,
  do_h_nodejs,
  do_h_macos,
  do_h_ubuntu,
  do_h_raspbian,
  do_h_amazon_linux,
  do_h_cmd,
  do_h_powershell,
  do_h_gitbash
};

if (require.main === module) {
  do_h(process.argv.slice(2));
}
