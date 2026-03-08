#!/usr/bin/env node

/**
 * q - Exit the current shell session (quick exit)
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias q="exit"
 *
 * IMPORTANT LIMITATION:
 * The original `q` alias worked because shell aliases run in the same process
 * as the shell itself. When you type `q` and it runs `exit`, the shell exits.
 *
 * However, this Node.js script runs as a CHILD PROCESS of your shell. When we
 * call `process.exit()` here, it only exits THIS script's process - not your
 * parent shell. There is no cross-platform way for a child process to force
 * its parent process to terminate.
 *
 * WORKAROUND OPTIONS:
 *
 * 1. Use the native shell command directly:
 *    Just type `exit` in your terminal.
 *
 * 2. Create a shell alias (recommended for true `q` behavior):
 *    In your ~/.bashrc or ~/.zshrc:
 *      alias q="exit"
 *
 *    In PowerShell $PROFILE:
 *      function q { exit }
 *
 * 3. Source this script's output (advanced):
 *    eval "$(q)"  # This would work if the script printed "exit"
 *
 * This script provides informative guidance to users about this limitation.
 *
 * @module scripts/q
 */

const os = require('../utils/common/os');

/**
 * Pure Node.js implementation that explains the exit limitation.
 *
 * Since exiting the parent shell is not possible from a child process,
 * this function prints helpful information to the user.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_q_nodejs(args) {
  // Check if user passed --help or -h
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  // Check if user wants shell-sourceable output (--eval or -e flag)
  // Usage: eval "$(q --eval)" or eval "$(q -e)"
  if (args.includes('--eval') || args.includes('-e')) {
    // Print the exit command so it can be sourced/evaled by the parent shell
    console.log('exit');
    return;
  }

  // Default behavior: inform the user about the limitation
  console.log('To exit your shell, type: exit');
  console.log('');
  console.log('Note: The `q` command cannot exit your shell directly because');
  console.log('it runs as a child process. For true `q` behavior, add this');
  console.log('alias to your shell config:');
  console.log('');

  const platform = os.detect();

  // Provide shell-specific guidance
  if (platform.type === 'windows' || platform.type === 'powershell') {
    console.log('  PowerShell (add to $PROFILE):');
    console.log('    function q { exit }');
  } else if (platform.type === 'cmd') {
    console.log('  CMD (create a doskey alias or batch file):');
    console.log('    doskey q=exit');
  } else {
    // Unix-like systems (macOS, Linux, Git Bash)
    console.log('  Bash/Zsh (add to ~/.bashrc or ~/.zshrc):');
    console.log('    alias q="exit"');
  }

  console.log('');
  console.log('Alternatively, use: eval "$(q --eval)" to exit immediately.');
}

/**
 * Prints help information about the q command.
 *
 * @returns {void}
 */
function printHelp() {
  console.log('q - Quick exit command');
  console.log('');
  console.log('Usage:');
  console.log('  q              Show exit instructions');
  console.log('  q --eval       Print "exit" for shell sourcing');
  console.log('  q -e           Same as --eval');
  console.log('  q --help       Show this help message');
  console.log('  q -h           Same as --help');
  console.log('');
  console.log('Examples:');
  console.log('  # Show instructions');
  console.log('  q');
  console.log('');
  console.log('  # Exit shell immediately (Bash/Zsh):');
  console.log('  eval "$(q --eval)"');
  console.log('');
  console.log('  # Exit shell immediately (PowerShell):');
  console.log('  Invoke-Expression (q --eval)');
  console.log('');
  console.log('Note: For true `q` behavior, create a shell alias instead.');
  console.log('This script cannot exit the parent shell directly because');
  console.log('it runs as a child process.');
}

/**
 * Exit guidance on macOS.
 *
 * On macOS, the default shell is Zsh (since Catalina) or Bash (older versions).
 * Both support the `alias q="exit"` syntax.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_q_macos(args) {
  return do_q_nodejs(args);
}

/**
 * Exit guidance on Ubuntu.
 *
 * Ubuntu uses Bash by default. The `alias q="exit"` syntax works.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_q_ubuntu(args) {
  return do_q_nodejs(args);
}

/**
 * Exit guidance on Raspberry Pi OS.
 *
 * Raspberry Pi OS uses Bash by default. The `alias q="exit"` syntax works.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_q_raspbian(args) {
  return do_q_nodejs(args);
}

/**
 * Exit guidance on Amazon Linux.
 *
 * Amazon Linux uses Bash by default. The `alias q="exit"` syntax works.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_q_amazon_linux(args) {
  return do_q_nodejs(args);
}

/**
 * Exit guidance in Windows Command Prompt.
 *
 * CMD supports doskey macros or batch files for creating aliases.
 * The `exit` command itself works directly in CMD.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_q_cmd(args) {
  // Check for --eval flag
  if (args.includes('--eval') || args.includes('-e')) {
    console.log('exit');
    return;
  }

  // Check for --help flag
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  console.log('To exit your shell, type: exit');
  console.log('');
  console.log('Note: The `q` command cannot exit your shell directly because');
  console.log('it runs as a child process. For true `q` behavior, you can:');
  console.log('');
  console.log('  Create a doskey macro (temporary, for current session):');
  console.log('    doskey q=exit');
  console.log('');
  console.log('  Or create a q.bat file in a PATH directory:');
  console.log('    @echo off');
  console.log('    exit');
}

/**
 * Exit guidance in Windows PowerShell.
 *
 * PowerShell supports functions for creating aliases to commands with arguments.
 * The `exit` command works directly in PowerShell.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_q_powershell(args) {
  // Check for --eval flag
  if (args.includes('--eval') || args.includes('-e')) {
    console.log('exit');
    return;
  }

  // Check for --help flag
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  console.log('To exit your shell, type: exit');
  console.log('');
  console.log('Note: The `q` command cannot exit your shell directly because');
  console.log('it runs as a child process. For true `q` behavior, add this');
  console.log('to your PowerShell profile ($PROFILE):');
  console.log('');
  console.log('  function q { exit }');
  console.log('');
  console.log('Alternatively, use: Invoke-Expression (q --eval)');
}

/**
 * Exit guidance in Git Bash.
 *
 * Git Bash is a Bash shell on Windows, so `alias q="exit"` works.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_q_gitbash(args) {
  return do_q_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "q" command is a quick shorthand for "exit" to leave the current shell.
 * Due to process isolation, this script cannot directly exit the parent shell,
 * so it provides guidance on how to achieve the desired behavior.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_q(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_q_macos,
    'ubuntu': do_q_ubuntu,
    'debian': do_q_ubuntu,
    'raspbian': do_q_raspbian,
    'amazon_linux': do_q_amazon_linux,
    'rhel': do_q_amazon_linux,
    'fedora': do_q_ubuntu,
    'linux': do_q_ubuntu,
    'wsl': do_q_ubuntu,
    'cmd': do_q_cmd,
    'windows': do_q_cmd,
    'powershell': do_q_powershell,
    'gitbash': do_q_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    // Fallback to generic Node.js implementation
    // This ensures the script works on unknown platforms too
    await do_q_nodejs(args);
    return;
  }

  await handler(args);
}

module.exports = {
  main: do_q,
  do_q,
  do_q_nodejs,
  do_q_macos,
  do_q_ubuntu,
  do_q_raspbian,
  do_q_amazon_linux,
  do_q_cmd,
  do_q_powershell,
  do_q_gitbash
};

if (require.main === module) {
  do_q(process.argv.slice(2));
}
