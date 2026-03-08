#!/usr/bin/env node

/**
 * path - Display PATH entries one per line
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias path='printf "%b\n" "${PATH//:/\\n}"'
 *
 * This script displays each directory in the system PATH environment variable
 * on a separate line for easier reading. The PATH variable is typically a
 * long, colon-separated (Unix) or semicolon-separated (Windows) string that
 * is difficult to read in its raw form.
 *
 * This is implemented in pure Node.js because:
 * - process.env.PATH provides the PATH variable on all platforms
 * - path.delimiter gives us the platform-specific separator (: or ;)
 * - Simple string splitting and output require no shell commands
 *
 * @module scripts/path
 */

const path = require('path');
const os = require('../utils/common/os');

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function handles the core logic of parsing and displaying the PATH:
 * 1. Gets the PATH environment variable from process.env.PATH
 * 2. Splits it using the platform-appropriate delimiter (: on Unix, ; on Windows)
 * 3. Prints each path entry on its own line
 *
 * The path.delimiter constant automatically uses the correct separator for
 * the current platform, making this truly cross-platform without any
 * conditional logic.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_path_nodejs(args) {
  // Get the PATH environment variable
  // On Unix: /usr/bin:/usr/local/bin:/home/user/bin
  // On Windows: C:\Windows\system32;C:\Windows;C:\Program Files\node
  const pathEnv = process.env.PATH;

  // Handle edge case: PATH is not set or empty
  if (!pathEnv) {
    console.log('PATH environment variable is not set or empty.');
    return;
  }

  // Split by the platform-specific delimiter
  // path.delimiter is ':' on Unix/macOS and ';' on Windows
  const pathEntries = pathEnv.split(path.delimiter);

  // Print each path entry on its own line
  // Filter out empty strings that might result from double delimiters (e.g., "::")
  for (const entry of pathEntries) {
    if (entry) {
      console.log(entry);
    }
  }
}

/**
 * Display PATH entries on macOS.
 *
 * macOS uses colon-separated paths like other Unix systems.
 * Example PATH: /usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_path_macos(args) {
  // Pure Node.js handles this perfectly - no macOS-specific code needed
  return do_path_nodejs(args);
}

/**
 * Display PATH entries on Ubuntu.
 *
 * Ubuntu uses colon-separated paths like other Unix systems.
 * Example PATH: /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_path_ubuntu(args) {
  // Pure Node.js handles this perfectly - no Ubuntu-specific code needed
  return do_path_nodejs(args);
}

/**
 * Display PATH entries on Raspberry Pi OS.
 *
 * Raspberry Pi OS (Raspbian) uses colon-separated paths like other Unix systems.
 * Example PATH: /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_path_raspbian(args) {
  // Pure Node.js handles this perfectly - no Raspbian-specific code needed
  return do_path_nodejs(args);
}

/**
 * Display PATH entries on Amazon Linux.
 *
 * Amazon Linux uses colon-separated paths like other Unix systems.
 * Example PATH: /usr/local/bin:/usr/bin:/usr/local/sbin:/usr/sbin
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_path_amazon_linux(args) {
  // Pure Node.js handles this perfectly - no Amazon Linux-specific code needed
  return do_path_nodejs(args);
}

/**
 * Display PATH entries on Windows Command Prompt.
 *
 * Windows uses semicolon-separated paths.
 * Example PATH: C:\Windows\system32;C:\Windows;C:\Program Files\nodejs
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_path_cmd(args) {
  // Pure Node.js handles this perfectly - path.delimiter is ';' on Windows
  return do_path_nodejs(args);
}

/**
 * Display PATH entries on Windows PowerShell.
 *
 * Windows PowerShell uses the same PATH as Command Prompt (semicolon-separated).
 * Example PATH: C:\Windows\system32;C:\Windows;C:\Program Files\nodejs
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_path_powershell(args) {
  // Pure Node.js handles this perfectly - path.delimiter is ';' on Windows
  return do_path_nodejs(args);
}

/**
 * Display PATH entries in Git Bash.
 *
 * Git Bash on Windows uses Unix-style colon-separated paths internally,
 * but process.env.PATH and path.delimiter handle this automatically.
 * The Node.js path module correctly detects the environment.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_path_gitbash(args) {
  // Pure Node.js handles this perfectly - works in Git Bash environment
  return do_path_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "path" command displays each directory in the PATH environment variable
 * on its own line, making it easy to see all locations where the shell searches
 * for executable programs.
 *
 * This is useful for:
 * - Debugging PATH issues (e.g., "why isn't my command found?")
 * - Understanding the order executables are searched
 * - Quickly viewing all directories without manual string parsing
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_path(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_path_macos,
    'ubuntu': do_path_ubuntu,
    'debian': do_path_ubuntu,
    'raspbian': do_path_raspbian,
    'amazon_linux': do_path_amazon_linux,
    'rhel': do_path_amazon_linux,
    'fedora': do_path_ubuntu,
    'linux': do_path_ubuntu,
    'wsl': do_path_ubuntu,
    'cmd': do_path_cmd,
    'windows': do_path_cmd,
    'powershell': do_path_powershell,
    'gitbash': do_path_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    // Even for unknown platforms, the Node.js implementation will work
    // because path.delimiter is available on all Node.js platforms
    console.log(`Note: Platform '${platform.type}' is not explicitly supported, using default implementation.`);
    await do_path_nodejs(args);
    return;
  }

  await handler(args);
}

module.exports = {
  main: do_path,
  do_path,
  do_path_nodejs,
  do_path_macos,
  do_path_ubuntu,
  do_path_raspbian,
  do_path_amazon_linux,
  do_path_cmd,
  do_path_powershell,
  do_path_gitbash
};

if (require.main === module) {
  do_path(process.argv.slice(2));
}
