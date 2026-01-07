#!/usr/bin/env node

/**
 * evm - Execute Vim macro on multiple files
 *
 * Migrated from legacy dotfiles bash function.
 * Original:
 *   evm() {
 *       local numberOfTimes="${*: -1}"
 *       local files
 *       if [[ "$numberOfTimes" =~ ^[0-9]+$ ]]; then
 *           files=("${@:1:$#-1}")
 *       else
 *           numberOfTimes="1"
 *           files=("$@")
 *       fi
 *       for file in "${files[@]}"; do
 *           printf "* %s\n" "$file"
 *           vim \
 *               -c "norm! $numberOfTimes@q" \
 *               -c "wq" \
 *               "$file"
 *       done
 *   }
 *
 * This script executes a Vim macro stored in register 'q' on one or more files.
 * The macro must be pre-recorded in your ~/.vimrc or saved in a session.
 * Optionally, you can specify how many times to run the macro on each file.
 *
 * Usage:
 *   evm file1.txt file2.txt        # Run macro once on each file
 *   evm file1.txt file2.txt 3      # Run macro 3 times on each file
 *
 * @module scripts/evm
 */

const os = require('../utils/common/os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Helper function to check if a command exists on the system.
 * Used to verify vim is installed before attempting to run macros.
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
 * Parse command line arguments to separate files from repeat count.
 *
 * The last argument may be a number indicating how many times to run the macro.
 * If the last argument is a number (and there's more than one argument), it's
 * used as the repeat count and removed from the file list.
 *
 * Examples:
 *   ['file1.txt']                    -> { files: ['file1.txt'], count: 1 }
 *   ['file1.txt', 'file2.txt']       -> { files: ['file1.txt', 'file2.txt'], count: 1 }
 *   ['file1.txt', '3']               -> { files: ['file1.txt'], count: 3 }
 *   ['file1.txt', 'file2.txt', '5']  -> { files: ['file1.txt', 'file2.txt'], count: 5 }
 *
 * @param {string[]} args - Command line arguments
 * @returns {{ files: string[], count: number }} Parsed files and repeat count
 */
function parseArgs(args) {
  // No arguments provided
  if (args.length === 0) {
    return { files: [], count: 1 };
  }

  // Check if the last argument is a positive integer (repeat count)
  const lastArg = args[args.length - 1];
  const isLastArgNumber = /^[0-9]+$/.test(lastArg) && parseInt(lastArg, 10) > 0;

  // If there's only one argument, it must be a file (even if it looks like a number)
  // because we need at least one file to process
  if (args.length === 1) {
    return { files: args, count: 1 };
  }

  // If last argument is a number, use it as repeat count
  if (isLastArgNumber) {
    return {
      files: args.slice(0, -1),
      count: parseInt(lastArg, 10)
    };
  }

  // Otherwise, all arguments are files
  return { files: args, count: 1 };
}

/**
 * Display usage information when no files are provided.
 */
function showUsage() {
  console.log('Usage: evm <file1> [file2 ...] [count]');
  console.log('');
  console.log('Execute a Vim macro (stored in register q) on one or more files.');
  console.log('');
  console.log('Arguments:');
  console.log('  file1, file2, ...  Files to process (at least one required)');
  console.log('  count              Number of times to run the macro (default: 1)');
  console.log('');
  console.log('Examples:');
  console.log('  evm file.txt             # Run macro @q once on file.txt');
  console.log('  evm *.js                 # Run macro @q once on all .js files');
  console.log('  evm file1.txt file2.txt 3  # Run macro @q 3 times on each file');
  console.log('');
  console.log('Note: The macro must be pre-recorded in register q. You can:');
  console.log('  1. Record it interactively: qq<commands>q');
  console.log('  2. Define it in ~/.vimrc:  let @q = "commands"');
}

/**
 * Core implementation for executing Vim macro on files.
 *
 * This is a shell-based implementation because vim is a native tool that:
 * - Provides better reliability than any Node.js reimplementation
 * - Is the actual tool the user wants to use (they have macros set up for vim)
 * - Works identically across all Unix-like platforms and Windows with vim installed
 *
 * The implementation runs vim in "ex" mode with two commands:
 * - "norm! <count>@q" executes the macro in register q <count> times
 * - "wq" writes the file and quits vim
 *
 * @param {string[]} args - Command line arguments
 * @param {string} vimCommand - The vim command to use (vim, vim.exe, etc.)
 * @returns {Promise<void>}
 */
async function executeVimMacro(args, vimCommand) {
  const { files, count } = parseArgs(args);

  // No files provided - show usage
  if (files.length === 0) {
    showUsage();
    return;
  }

  // Validate that all files exist before processing
  const missingFiles = [];
  for (const file of files) {
    const absolutePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
    if (!fs.existsSync(absolutePath)) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    console.error('Error: The following files do not exist:');
    for (const file of missingFiles) {
      console.error(`  - ${file}`);
    }
    process.exit(1);
  }

  // Process each file
  console.log(`Running macro @q ${count} time(s) on ${files.length} file(s)...`);
  console.log('');

  for (const file of files) {
    const absolutePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
    console.log(`* ${file}`);

    try {
      // The vim command:
      // -c "norm! <count>@q" - Execute normal mode command: run macro @q <count> times
      // -c "wq" - Write and quit
      // The ! after norm ensures mappings don't interfere
      execSync(
        `${vimCommand} -c "norm! ${count}@q" -c "wq" "${absolutePath}"`,
        {
          stdio: 'inherit',
          // Run in the current working directory
          cwd: process.cwd()
        }
      );
    } catch (error) {
      console.error(`  Error processing ${file}: ${error.message}`);
      // Continue with other files even if one fails
    }
  }

  console.log('');
  console.log('Done.');
}

/**
 * Pure Node.js implementation - NOT APPLICABLE for this script.
 *
 * Executing Vim macros requires the vim editor itself. While we could theoretically
 * parse vim macros and reimplement their behavior in Node.js, this would be:
 * - Extremely complex (vim has thousands of commands)
 * - Error-prone (subtle behavioral differences)
 * - Pointless (the user has vim installed and configured)
 *
 * The correct approach is to use vim directly, which is what we do in all
 * platform-specific functions.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_evm_nodejs(args) {
  throw new Error(
    'do_evm_nodejs should not be called directly. ' +
    'Vim macro execution requires the vim editor.'
  );
}

/**
 * Execute Vim macro on files on macOS.
 *
 * macOS typically has vim pre-installed or available via Homebrew.
 * Uses the standard 'vim' command.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_evm_macos(args) {
  if (!isCommandAvailable('vim')) {
    console.error('Error: vim is not installed.');
    console.error('');
    console.error('Install vim using Homebrew:');
    console.error('  brew install vim');
    process.exit(1);
  }

  await executeVimMacro(args, 'vim');
}

/**
 * Execute Vim macro on files on Ubuntu.
 *
 * Ubuntu may have vim-tiny (which is actually 'vi') or full vim installed.
 * We check for 'vim' specifically, not 'vi', because we need full vim features.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_evm_ubuntu(args) {
  if (!isCommandAvailable('vim')) {
    console.error('Error: vim is not installed.');
    console.error('');
    console.error('Install vim using apt:');
    console.error('  sudo apt update && sudo apt install vim');
    process.exit(1);
  }

  await executeVimMacro(args, 'vim');
}

/**
 * Execute Vim macro on files on Raspberry Pi OS.
 *
 * Raspberry Pi OS is Debian-based and typically has vim available.
 * The installation instructions are the same as Ubuntu.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_evm_raspbian(args) {
  if (!isCommandAvailable('vim')) {
    console.error('Error: vim is not installed.');
    console.error('');
    console.error('Install vim using apt:');
    console.error('  sudo apt update && sudo apt install vim');
    process.exit(1);
  }

  await executeVimMacro(args, 'vim');
}

/**
 * Execute Vim macro on files on Amazon Linux.
 *
 * Amazon Linux uses dnf or yum for package management.
 * vim is typically available in the default repositories.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_evm_amazon_linux(args) {
  if (!isCommandAvailable('vim')) {
    console.error('Error: vim is not installed.');
    console.error('');
    console.error('Install vim using dnf or yum:');
    console.error('  sudo dnf install vim');
    console.error('  # or');
    console.error('  sudo yum install vim');
    process.exit(1);
  }

  await executeVimMacro(args, 'vim');
}

/**
 * Execute Vim macro on files in Windows Command Prompt.
 *
 * Windows doesn't have vim by default, but it can be installed via:
 * - Chocolatey: choco install vim
 * - Scoop: scoop install vim
 * - winget: winget install vim.vim
 * - Direct download from vim.org
 *
 * On Windows, the vim executable might be 'vim.exe' or 'vim'.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_evm_cmd(args) {
  // Check for vim or vim.exe
  const vimCmd = isCommandAvailable('vim') ? 'vim' :
                 isCommandAvailable('vim.exe') ? 'vim.exe' : null;

  if (!vimCmd) {
    console.error('Error: vim is not installed.');
    console.error('');
    console.error('Install vim using one of these methods:');
    console.error('  winget: winget install vim.vim');
    console.error('  choco:  choco install vim');
    console.error('  scoop:  scoop install vim');
    console.error('  Or download from: https://www.vim.org/download.php');
    process.exit(1);
  }

  await executeVimMacro(args, vimCmd);
}

/**
 * Execute Vim macro on files in Windows PowerShell.
 *
 * Uses the same vim detection and execution as CMD.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_evm_powershell(args) {
  // PowerShell uses the same vim installation as CMD
  return do_evm_cmd(args);
}

/**
 * Execute Vim macro on files in Git Bash.
 *
 * Git Bash may have vim bundled, or it can use Windows-installed vim.
 * Git for Windows includes a minimal vim by default.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_evm_gitbash(args) {
  if (!isCommandAvailable('vim')) {
    console.error('Error: vim is not installed.');
    console.error('');
    console.error('Git Bash should include vim by default.');
    console.error('If not available, install vim for Windows:');
    console.error('  winget: winget install vim.vim');
    console.error('  choco:  choco install vim');
    console.error('  Or download from: https://www.vim.org/download.php');
    process.exit(1);
  }

  await executeVimMacro(args, 'vim');
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "evm" (Execute Vim Macro) command runs a pre-recorded Vim macro on one or
 * more files. This is useful for batch text transformations that you've already
 * figured out how to do in Vim.
 *
 * The macro must be stored in register 'q'. You can:
 * 1. Record it interactively: qq<your-commands>q
 * 2. Define it in ~/.vimrc: let @q = "your-commands"
 *
 * After running, the files are saved automatically (via :wq).
 *
 * @param {string[]} args - Command line arguments (files and optional count)
 * @returns {Promise<void>}
 */
async function do_evm(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_evm_macos,
    'ubuntu': do_evm_ubuntu,
    'debian': do_evm_ubuntu,
    'raspbian': do_evm_raspbian,
    'amazon_linux': do_evm_amazon_linux,
    'rhel': do_evm_amazon_linux,
    'fedora': do_evm_ubuntu,
    'linux': do_evm_ubuntu,
    'wsl': do_evm_ubuntu,
    'cmd': do_evm_cmd,
    'windows': do_evm_cmd,
    'powershell': do_evm_powershell,
    'gitbash': do_evm_gitbash
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
  main: do_evm,
  do_evm,
  do_evm_nodejs,
  do_evm_macos,
  do_evm_ubuntu,
  do_evm_raspbian,
  do_evm_amazon_linux,
  do_evm_cmd,
  do_evm_powershell,
  do_evm_gitbash
};

if (require.main === module) {
  do_evm(process.argv.slice(2));
}
