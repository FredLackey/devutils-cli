#!/usr/bin/env node

/**
 * s - Recursively search for text in the current directory
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   s() {
 *       grep --color=always "$*" \
 *            --exclude-dir=".git" \
 *            --exclude-dir="node_modules" \
 *            --ignore-case \
 *            --recursive \
 *            . \
 *           | less --no-init --raw-control-chars
 *   }
 *
 * This script provides a quick way to search for text patterns recursively
 * in the current directory. It automatically excludes common directories
 * like .git and node_modules that typically contain files you don't want
 * to search through.
 *
 * Usage:
 *   s "search pattern"
 *   s my_variable
 *   s "function.*async"    # regex patterns work
 *
 * The search is case-insensitive and results are displayed with color
 * highlighting, piped through a pager for easy navigation.
 *
 * @module scripts/s
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');

/**
 * Directories to exclude from search.
 * These are common directories that contain generated or dependency files
 * that are usually not relevant when searching source code.
 */
const EXCLUDE_DIRS = [
  '.git',
  'node_modules',
  '.next',
  'dist',
  'build',
  '.cache',
  'coverage',
  '__pycache__',
  '.pytest_cache',
  'vendor',
  'target'
];

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
 * Pure Node.js implementation - NOT RECOMMENDED for this script.
 *
 * While we could implement text search in pure Node.js using fs.readdir,
 * fs.readFile, and regex matching, the native grep command is:
 * - Much faster for large directory trees
 * - Better at handling binary files gracefully
 * - Optimized for streaming large files
 * - Already handles edge cases (symlinks, permissions, etc.)
 *
 * This function exists for environments where grep is not available,
 * but it may be slower for large searches.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_s_nodejs(args) {
  const fs = require('fs');
  const path = require('path');

  if (args.length === 0) {
    console.error('Usage: s <search-pattern>');
    console.error('');
    console.error('Recursively searches for text matching the pattern');
    console.error('in the current directory, excluding .git and node_modules.');
    console.error('');
    console.error('Examples:');
    console.error('  s "my_variable"');
    console.error('  s "TODO"');
    console.error('  s "function.*async"');
    process.exit(1);
  }

  // Join all arguments into a single search pattern
  // This matches the bash behavior of "$*"
  const pattern = args.join(' ');
  const regex = new RegExp(pattern, 'i'); // case-insensitive

  // Track results for output
  const results = [];

  /**
   * Recursively walk a directory and search files for the pattern.
   *
   * @param {string} dir - Directory to search
   */
  function walkDir(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      // Skip directories we can't read (permissions, etc.)
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip excluded directories
        if (EXCLUDE_DIRS.includes(entry.name)) {
          continue;
        }
        // Recurse into subdirectory
        walkDir(fullPath);
      } else if (entry.isFile()) {
        // Search file for pattern
        searchFile(fullPath);
      }
    }
  }

  /**
   * Search a single file for the pattern and add matches to results.
   *
   * @param {string} filePath - Path to the file to search
   */
  function searchFile(filePath) {
    let content;
    try {
      // Read file as UTF-8 text
      content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      // Skip files we can't read (binary, permissions, etc.)
      return;
    }

    // Check if file appears to be binary (contains null bytes)
    if (content.includes('\0')) {
      return;
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        // Format: filename:linenum:content (like grep)
        const relativePath = path.relative(process.cwd(), filePath);
        results.push({
          file: relativePath,
          line: i + 1,
          content: lines[i]
        });
      }
    }
  }

  // Start the search from current directory
  walkDir(process.cwd());

  // Output results
  if (results.length === 0) {
    console.log('No matches found.');
    return;
  }

  // Output in grep-like format with color highlighting
  for (const result of results) {
    // Highlight the matching portion
    const highlighted = result.content.replace(
      regex,
      (match) => `\x1b[1;31m${match}\x1b[0m` // Red and bold
    );
    console.log(`\x1b[35m${result.file}\x1b[0m:\x1b[32m${result.line}\x1b[0m:${highlighted}`);
  }
}

/**
 * Search for text on macOS using grep and less.
 *
 * macOS ships with BSD grep by default, but if the user has installed
 * GNU grep via Homebrew (as ggrep), we'll use that for better compatibility.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_s_macos(args) {
  if (args.length === 0) {
    console.error('Usage: s <search-pattern>');
    console.error('');
    console.error('Recursively searches for text matching the pattern');
    console.error('in the current directory, excluding .git and node_modules.');
    process.exit(1);
  }

  // Build the search pattern (join all args like bash "$*")
  const pattern = args.join(' ');

  // Build exclude-dir flags for grep
  const excludeFlags = EXCLUDE_DIRS.map(d => `--exclude-dir="${d}"`).join(' ');

  // Use ggrep (GNU grep) if available, otherwise BSD grep
  // GNU grep has better regex support and color handling
  const grepCmd = isCommandAvailable('ggrep') ? 'ggrep' : 'grep';

  // Build the full command matching the original alias behavior
  const command = `${grepCmd} --color=always "${pattern}" ${excludeFlags} --ignore-case --recursive . 2>/dev/null | less --no-init --raw-control-chars`;

  try {
    // Use spawnSync with shell:true and inherit stdio to handle piping and less
    spawnSync('sh', ['-c', command], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    // grep returns exit code 1 if no matches found, which is not an error
    // Only report errors that are actual failures
    if (error.status && error.status > 1) {
      console.error('Error: Search failed.');
      process.exit(1);
    }
  }
}

/**
 * Search for text on Ubuntu using grep and less.
 *
 * Ubuntu includes GNU grep and less by default, so we can use
 * the exact same command as the original dotfiles alias.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_s_ubuntu(args) {
  if (args.length === 0) {
    console.error('Usage: s <search-pattern>');
    console.error('');
    console.error('Recursively searches for text matching the pattern');
    console.error('in the current directory, excluding .git and node_modules.');
    process.exit(1);
  }

  // Build the search pattern
  const pattern = args.join(' ');

  // Build exclude-dir flags
  const excludeFlags = EXCLUDE_DIRS.map(d => `--exclude-dir="${d}"`).join(' ');

  // Build the command exactly like the original alias
  const command = `grep --color=always "${pattern}" ${excludeFlags} --ignore-case --recursive . 2>/dev/null | less --no-init --raw-control-chars`;

  try {
    spawnSync('sh', ['-c', command], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    if (error.status && error.status > 1) {
      console.error('Error: Search failed.');
      process.exit(1);
    }
  }
}

/**
 * Search for text on Raspberry Pi OS using grep and less.
 *
 * Raspberry Pi OS is Debian-based and includes grep and less.
 * Uses the same implementation as Ubuntu.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_s_raspbian(args) {
  // Raspberry Pi OS has the same tools as Ubuntu
  return do_s_ubuntu(args);
}

/**
 * Search for text on Amazon Linux using grep and less.
 *
 * Amazon Linux includes GNU grep and less by default.
 * Uses the same implementation as Ubuntu.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_s_amazon_linux(args) {
  // Amazon Linux has the same tools as Ubuntu
  return do_s_ubuntu(args);
}

/**
 * Search for text on Windows Command Prompt.
 *
 * Windows CMD doesn't have grep or less by default. We check for:
 * 1. Git's grep (included with Git for Windows)
 * 2. findstr (native Windows command, limited functionality)
 *
 * If neither is suitable, we fall back to the Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_s_cmd(args) {
  if (args.length === 0) {
    console.error('Usage: s <search-pattern>');
    console.error('');
    console.error('Recursively searches for text matching the pattern');
    console.error('in the current directory, excluding .git and node_modules.');
    process.exit(1);
  }

  // Check if Git for Windows is installed (includes grep)
  // Git's grep is available at Git/usr/bin/grep.exe
  if (isCommandAvailable('grep')) {
    const pattern = args.join(' ');
    const excludeFlags = EXCLUDE_DIRS.map(d => `--exclude-dir="${d}"`).join(' ');

    // Use grep with less if available, otherwise just grep
    let command;
    if (isCommandAvailable('less')) {
      command = `grep --color=always "${pattern}" ${excludeFlags} --ignore-case --recursive . 2>nul | less --no-init --raw-control-chars`;
    } else {
      // Without less, just output directly (may be a lot of output)
      command = `grep --color=always "${pattern}" ${excludeFlags} --ignore-case --recursive . 2>nul`;
    }

    try {
      spawnSync('cmd', ['/c', command], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      return;
    } catch (error) {
      // Fall through to Node.js implementation
    }
  }

  // Fallback: use findstr (native Windows, but limited)
  // findstr doesn't support excluding directories, so use Node.js instead
  console.log('Note: Using Node.js search (install Git for Windows for faster grep-based search)');
  return do_s_nodejs(args);
}

/**
 * Search for text on Windows PowerShell.
 *
 * PowerShell has Select-String which is similar to grep, but we prefer
 * grep if available (from Git for Windows) for consistency.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_s_powershell(args) {
  if (args.length === 0) {
    console.error('Usage: s <search-pattern>');
    console.error('');
    console.error('Recursively searches for text matching the pattern');
    console.error('in the current directory, excluding .git and node_modules.');
    process.exit(1);
  }

  // Check if grep is available (from Git for Windows)
  if (isCommandAvailable('grep')) {
    const pattern = args.join(' ');
    const excludeFlags = EXCLUDE_DIRS.map(d => `--exclude-dir="${d}"`).join(' ');

    let command;
    if (isCommandAvailable('less')) {
      command = `grep --color=always "${pattern}" ${excludeFlags} --ignore-case --recursive . 2>$null | less --no-init --raw-control-chars`;
    } else {
      command = `grep --color=always "${pattern}" ${excludeFlags} --ignore-case --recursive . 2>$null`;
    }

    try {
      spawnSync('powershell', ['-Command', command], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      return;
    } catch (error) {
      // Fall through to Select-String or Node.js
    }
  }

  // Use PowerShell's Select-String as fallback
  // Select-String is similar to grep but with different syntax
  const pattern = args.join(' ');

  // Build the exclude pattern for Where-Object
  const excludePattern = EXCLUDE_DIRS.map(d => `'*\\${d}\\*'`).join(',');

  // PowerShell command using Select-String
  // Note: We use single quotes and escape sequences that PowerShell understands
  const excludeRegex = EXCLUDE_DIRS.join('|');
  const psCommand = [
    'Get-ChildItem -Recurse -File |',
    `Where-Object { $_.FullName -notmatch '(${excludeRegex})' } |`,
    `Select-String -Pattern '${pattern}' -CaseSensitive:$false |`,
    'ForEach-Object {',
    '  $relativePath = $_.Path.Replace((Get-Location).Path + "\\", "")',
    '  $lineNum = $_.LineNumber',
    '  $lineText = $_.Line',
    '  Write-Host "$relativePath`:$lineNum`:$lineText"',
    '} |',
    'Out-Host -Paging'
  ].join(' ');

  try {
    spawnSync('powershell', ['-Command', psCommand], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    // Fall back to Node.js if PowerShell command fails
    console.log('Note: Using Node.js search implementation');
    return do_s_nodejs(args);
  }
}

/**
 * Search for text in Git Bash on Windows.
 *
 * Git Bash includes GNU grep and less, so we can use the same
 * command as on Linux/macOS.
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_s_gitbash(args) {
  if (args.length === 0) {
    console.error('Usage: s <search-pattern>');
    console.error('');
    console.error('Recursively searches for text matching the pattern');
    console.error('in the current directory, excluding .git and node_modules.');
    process.exit(1);
  }

  // Git Bash has grep and less
  const pattern = args.join(' ');
  const excludeFlags = EXCLUDE_DIRS.map(d => `--exclude-dir="${d}"`).join(' ');

  const command = `grep --color=always "${pattern}" ${excludeFlags} --ignore-case --recursive . 2>/dev/null | less --no-init --raw-control-chars`;

  try {
    spawnSync('sh', ['-c', command], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    if (error.status && error.status > 1) {
      console.error('Error: Search failed.');
      process.exit(1);
    }
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "s" command provides a quick way to search for text patterns recursively
 * in the current directory. It's designed to be a faster, more ergonomic
 * alternative to typing out the full grep command with exclude flags.
 *
 * Features:
 * - Recursive search through all subdirectories
 * - Excludes common directories (.git, node_modules, etc.)
 * - Case-insensitive matching
 * - Color-highlighted results
 * - Paged output through less (on supported platforms)
 *
 * @param {string[]} args - Command line arguments (search pattern)
 * @returns {Promise<void>}
 */
async function do_s(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_s_macos,
    'ubuntu': do_s_ubuntu,
    'debian': do_s_ubuntu,
    'raspbian': do_s_raspbian,
    'amazon_linux': do_s_amazon_linux,
    'rhel': do_s_amazon_linux,
    'fedora': do_s_ubuntu,
    'linux': do_s_ubuntu,
    'wsl': do_s_ubuntu,
    'cmd': do_s_cmd,
    'windows': do_s_cmd,
    'powershell': do_s_powershell,
    'gitbash': do_s_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    // For unknown platforms, try the Node.js implementation
    console.log(`Note: Platform '${platform.type}' using Node.js search implementation`);
    return do_s_nodejs(args);
  }

  await handler(args);
}

module.exports = {
  main: do_s,
  do_s,
  do_s_nodejs,
  do_s_macos,
  do_s_ubuntu,
  do_s_raspbian,
  do_s_amazon_linux,
  do_s_cmd,
  do_s_powershell,
  do_s_gitbash
};

if (require.main === module) {
  do_s(process.argv.slice(2));
}
