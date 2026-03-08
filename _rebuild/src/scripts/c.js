#!/usr/bin/env node

/**
 * c - Clear the terminal screen
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias c="clear"
 *
 * This script clears the terminal screen, providing a clean workspace.
 * It uses pure Node.js ANSI escape sequences which work across all platforms,
 * making the implementation identical on macOS, Linux, and Windows.
 *
 * @module scripts/c
 */

const os = require('../utils/common/os');

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function clears the terminal screen using ANSI escape sequences.
 * These sequences are understood by virtually all modern terminal emulators:
 *
 * - ESC[2J  : Clears the entire screen
 * - ESC[H   : Moves the cursor to the home position (top-left corner)
 *
 * This approach is preferred over shelling out to `clear` or `cls` because:
 * 1. It works identically on all platforms
 * 2. It requires no external commands
 * 3. It's faster (no process spawn overhead)
 * 4. It's more reliable (no dependency on external tools)
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_c_nodejs(args) {
  // ANSI escape sequence to clear screen and move cursor to home position
  // \x1b is the escape character (ESC)
  // [2J clears the entire screen
  // [H moves the cursor to row 1, column 1 (home position)
  //
  // Note: Some terminals also support \x1b[3J to clear the scrollback buffer,
  // but we only clear the visible screen to match the behavior of `clear` on Unix.
  process.stdout.write('\x1b[2J\x1b[H');
}

/**
 * Clear the terminal screen on macOS.
 *
 * Uses the pure Node.js implementation since ANSI escape sequences
 * work perfectly in Terminal.app, iTerm2, and all other macOS terminals.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_c_macos(args) {
  return do_c_nodejs(args);
}

/**
 * Clear the terminal screen on Ubuntu.
 *
 * Uses the pure Node.js implementation since ANSI escape sequences
 * work in all Ubuntu terminal emulators (GNOME Terminal, Konsole, xterm, etc.).
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_c_ubuntu(args) {
  return do_c_nodejs(args);
}

/**
 * Clear the terminal screen on Raspberry Pi OS.
 *
 * Uses the pure Node.js implementation since ANSI escape sequences
 * work in Raspberry Pi OS terminals (LXTerminal, xterm, etc.).
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_c_raspbian(args) {
  return do_c_nodejs(args);
}

/**
 * Clear the terminal screen on Amazon Linux.
 *
 * Uses the pure Node.js implementation since ANSI escape sequences
 * work in all Linux terminals, including those used with Amazon Linux.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_c_amazon_linux(args) {
  return do_c_nodejs(args);
}

/**
 * Clear the terminal screen in Windows Command Prompt.
 *
 * Uses the pure Node.js implementation. Windows 10 and later support
 * ANSI escape sequences natively in CMD when virtual terminal processing
 * is enabled (which is the default in modern Windows).
 *
 * For older Windows versions, Node.js handles this automatically through
 * its terminal handling layer.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_c_cmd(args) {
  return do_c_nodejs(args);
}

/**
 * Clear the terminal screen in Windows PowerShell.
 *
 * Uses the pure Node.js implementation. PowerShell on Windows 10 and later
 * fully supports ANSI escape sequences.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_c_powershell(args) {
  return do_c_nodejs(args);
}

/**
 * Clear the terminal screen in Git Bash.
 *
 * Uses the pure Node.js implementation. Git Bash uses MinTTY or Windows Terminal,
 * both of which fully support ANSI escape sequences.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_c_gitbash(args) {
  return do_c_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "c" command clears the terminal screen, providing a clean workspace.
 * This is a common developer shortcut that replaces the longer `clear` command
 * (or `cls` on Windows) with a single character.
 *
 * The implementation uses ANSI escape sequences which work identically on all
 * platforms, making this one of the simplest cross-platform scripts: every
 * platform function simply delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_c(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_c_macos,
    'ubuntu': do_c_ubuntu,
    'debian': do_c_ubuntu,
    'raspbian': do_c_raspbian,
    'amazon_linux': do_c_amazon_linux,
    'rhel': do_c_amazon_linux,
    'fedora': do_c_ubuntu,
    'linux': do_c_ubuntu,
    'wsl': do_c_ubuntu,
    'cmd': do_c_cmd,
    'windows': do_c_cmd,
    'powershell': do_c_powershell,
    'gitbash': do_c_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    // Fallback: ANSI escape sequences work on most terminals, so try anyway
    console.error(`Note: Platform '${platform.type}' not explicitly supported, attempting to clear...`);
    await do_c_nodejs(args);
    return;
  }

  await handler(args);
}

module.exports = {
  main: do_c,
  do_c,
  do_c_nodejs,
  do_c_macos,
  do_c_ubuntu,
  do_c_raspbian,
  do_c_amazon_linux,
  do_c_cmd,
  do_c_powershell,
  do_c_gitbash
};

if (require.main === module) {
  do_c(process.argv.slice(2));
}
