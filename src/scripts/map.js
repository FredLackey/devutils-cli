#!/usr/bin/env node

/**
 * map - Execute a command for each line of input
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias map="xargs -n1"
 *
 * This script reads lines from stdin and executes the specified command
 * for each line, similar to `xargs -n1`. It allows you to "map" a command
 * over a list of inputs.
 *
 * Usage examples:
 *   echo -e "file1.txt\nfile2.txt" | map cat
 *   ls *.js | map wc -l
 *   git branch | map git log -1 --oneline
 *
 * The input line is passed as the last argument to the command. For example:
 *   echo "hello" | map echo "Processing:"
 *   # Executes: echo "Processing:" "hello"
 *
 * @module scripts/map
 */

const os = require('../utils/common/os');
const { spawn } = require('child_process');
const readline = require('readline');

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function reads lines from stdin and executes the specified command
 * for each line. The input line is appended as the last argument to the command.
 *
 * Why this works cross-platform:
 * - readline module handles stdin consistently across all platforms
 * - spawn works identically on macOS, Linux, and Windows
 * - No platform-specific shell features are used
 *
 * @param {string[]} args - Command and its arguments. The first element is the
 *                          command to run, remaining elements are arguments.
 *                          The input line is appended as the final argument.
 * @returns {Promise<void>}
 */
async function do_map_nodejs(args) {
  // If no command provided, show usage information
  if (args.length === 0) {
    console.log('Usage: map <command> [arguments...]');
    console.log('');
    console.log('Reads lines from stdin and executes the command for each line.');
    console.log('The input line is passed as the last argument to the command.');
    console.log('');
    console.log('Examples:');
    console.log('  echo -e "file1.txt\\nfile2.txt" | map cat');
    console.log('  ls *.js | map wc -l');
    console.log('  find . -name "*.txt" | map head -1');
    console.log('');
    console.log('Similar to: xargs -n1');
    return;
  }

  // Extract the command (first argument) and its base arguments (remaining arguments)
  const command = args[0];
  const baseArgs = args.slice(1);

  // Create readline interface to read lines from stdin
  const rl = readline.createInterface({
    input: process.stdin,
    // Don't output to terminal - we're reading piped data
    terminal: false
  });

  // Collect all lines first, then process them sequentially
  // This ensures commands complete in order and errors are handled properly
  const lines = [];

  for await (const line of rl) {
    // Skip empty lines to avoid passing empty arguments
    const trimmedLine = line.trim();
    if (trimmedLine !== '') {
      lines.push(trimmedLine);
    }
  }

  // If no input was provided (empty stdin), inform the user
  if (lines.length === 0) {
    console.error('No input received. Pipe data to this command:');
    console.error('  echo "item1\\nitem2" | map <command>');
    return;
  }

  // Process each line sequentially
  // Sequential processing ensures output is predictable and ordered
  for (const inputLine of lines) {
    // Build the full argument list: base args + the input line
    const fullArgs = [...baseArgs, inputLine];

    try {
      // Execute the command and wait for it to complete
      await executeCommand(command, fullArgs);
    } catch (error) {
      // Continue processing remaining lines even if one fails
      // This matches xargs behavior by default
      console.error(`Error processing "${inputLine}": ${error.message}`);
    }
  }
}

/**
 * Execute a command with given arguments and return a promise.
 *
 * Uses spawn instead of exec to:
 * - Handle large output without buffer limits
 * - Stream output in real-time
 * - Better handle signals and process lifecycle
 *
 * @param {string} command - The command to execute
 * @param {string[]} args - Arguments to pass to the command
 * @returns {Promise<void>} Resolves when command completes, rejects on error
 */
function executeCommand(command, args) {
  return new Promise((resolve, reject) => {
    // Determine if we're on Windows to set appropriate shell option
    const isWindows = process.platform === 'win32';

    // Spawn the child process
    // - shell: true allows running shell built-ins and handles PATH lookup
    // - stdio: 'inherit' connects child's stdin/stdout/stderr to parent
    const child = spawn(command, args, {
      shell: true,
      stdio: 'inherit',
      // On Windows, use cmd.exe; on Unix, use default shell
      ...(isWindows && { windowsHide: true })
    });

    // Handle process completion
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        // Non-zero exit code indicates command failed
        reject(new Error(`Command exited with code ${code}`));
      }
    });

    // Handle spawn errors (command not found, permission denied, etc.)
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Execute a command for each line of input on macOS.
 *
 * macOS can use the pure Node.js implementation since no platform-specific
 * features are required for this functionality.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_map_macos(args) {
  return do_map_nodejs(args);
}

/**
 * Execute a command for each line of input on Ubuntu.
 *
 * Ubuntu can use the pure Node.js implementation since no platform-specific
 * features are required for this functionality.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_map_ubuntu(args) {
  return do_map_nodejs(args);
}

/**
 * Execute a command for each line of input on Raspberry Pi OS.
 *
 * Raspberry Pi OS can use the pure Node.js implementation since no
 * platform-specific features are required for this functionality.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_map_raspbian(args) {
  return do_map_nodejs(args);
}

/**
 * Execute a command for each line of input on Amazon Linux.
 *
 * Amazon Linux can use the pure Node.js implementation since no
 * platform-specific features are required for this functionality.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_map_amazon_linux(args) {
  return do_map_nodejs(args);
}

/**
 * Execute a command for each line of input in Windows Command Prompt.
 *
 * Windows CMD can use the pure Node.js implementation. The spawn command
 * with shell: true automatically uses cmd.exe on Windows.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_map_cmd(args) {
  return do_map_nodejs(args);
}

/**
 * Execute a command for each line of input in Windows PowerShell.
 *
 * Windows PowerShell can use the pure Node.js implementation. The spawn
 * command with shell: true works correctly from PowerShell.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_map_powershell(args) {
  return do_map_nodejs(args);
}

/**
 * Execute a command for each line of input in Git Bash.
 *
 * Git Bash can use the pure Node.js implementation since no platform-specific
 * features are required for this functionality.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_map_gitbash(args) {
  return do_map_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "map" command reads lines from stdin and executes a command for each line,
 * similar to `xargs -n1`. This is useful for applying a command to each item in
 * a list, such as:
 *
 *   - Processing each file from a directory listing
 *   - Applying a git command to multiple branches
 *   - Running a script on each item from a search result
 *
 * @param {string[]} args - Command line arguments. First argument is the command
 *                          to run, remaining arguments are passed to that command.
 * @returns {Promise<void>}
 */
async function do_map(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_map_macos,
    'ubuntu': do_map_ubuntu,
    'debian': do_map_ubuntu,
    'raspbian': do_map_raspbian,
    'amazon_linux': do_map_amazon_linux,
    'rhel': do_map_amazon_linux,
    'fedora': do_map_ubuntu,
    'linux': do_map_ubuntu,
    'wsl': do_map_ubuntu,
    'cmd': do_map_cmd,
    'windows': do_map_cmd,
    'powershell': do_map_powershell,
    'gitbash': do_map_gitbash
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
  main: do_map,
  do_map,
  do_map_nodejs,
  do_map_macos,
  do_map_ubuntu,
  do_map_raspbian,
  do_map_amazon_linux,
  do_map_cmd,
  do_map_powershell,
  do_map_gitbash
};

if (require.main === module) {
  do_map(process.argv.slice(2));
}
