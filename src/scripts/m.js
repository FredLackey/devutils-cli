#!/usr/bin/env node

/**
 * m - Display manual pages for commands
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias m="man"
 *
 * This script displays the manual (man) page for a given command or topic.
 * Man pages are the traditional documentation system on Unix-like operating
 * systems. They provide detailed information about commands, system calls,
 * library functions, and configuration files.
 *
 * Usage: m <command>
 * Example: m ls       - Shows the manual page for the 'ls' command
 *          m git      - Shows the manual page for 'git'
 *          m 5 passwd - Shows section 5 (file formats) of 'passwd'
 *
 * @module scripts/m
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
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
 * Viewing man pages requires the system's man command or a pager.
 * This cannot be implemented in pure Node.js because:
 * - Man pages are stored in compressed format (gzip) with special formatting (groff/troff)
 * - The man command handles page navigation, searching, and proper terminal rendering
 * - Different platforms store man pages in different locations
 *
 * @param {string[]} args - Command line arguments (the command to look up)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_m_nodejs(args) {
  // Man page viewing is inherently platform-specific and requires the man command
  // or an equivalent tool. Each platform function contains the appropriate system call.
  throw new Error(
    'do_m_nodejs should not be called directly. ' +
    'Man page viewing requires OS-specific commands.'
  );
}

/**
 * Display man page on macOS using the native man command.
 *
 * macOS has a full man page system pre-installed. The man command
 * is available in /usr/bin/man and supports all standard options.
 *
 * @param {string[]} args - Command line arguments (passed directly to man)
 * @returns {Promise<void>}
 */
async function do_m_macos(args) {
  // Check if any arguments were provided
  if (args.length === 0) {
    console.log('Usage: m <command>');
    console.log('');
    console.log('Display the manual page for a command.');
    console.log('');
    console.log('Examples:');
    console.log('  m ls        Show the manual for the ls command');
    console.log('  m git       Show the manual for git');
    console.log('  m 5 passwd  Show section 5 (file formats) of passwd');
    console.log('');
    console.log('Sections:');
    console.log('  1  User commands');
    console.log('  2  System calls');
    console.log('  3  Library functions');
    console.log('  4  Special files');
    console.log('  5  File formats');
    console.log('  6  Games');
    console.log('  7  Miscellaneous');
    console.log('  8  System administration');
    return;
  }

  // Use spawnSync to properly handle interactive terminal (pager)
  // This allows the user to scroll through the man page with less/more
  const result = spawnSync('man', args, {
    stdio: 'inherit',  // Connect stdin/stdout/stderr to parent process
    shell: false       // No shell needed, man is a direct command
  });

  // Check if man command failed (e.g., no manual entry found)
  if (result.status !== 0) {
    // Man command already prints its own error message like "No manual entry for xyz"
    process.exit(result.status || 1);
  }
}

/**
 * Display man page on Ubuntu using the native man command.
 *
 * Ubuntu/Debian systems have man pre-installed. Additional man pages
 * can be installed via packages like 'manpages' and 'manpages-dev'.
 *
 * @param {string[]} args - Command line arguments (passed directly to man)
 * @returns {Promise<void>}
 */
async function do_m_ubuntu(args) {
  // Check if man command is available (it should be, but let's verify)
  if (!isCommandAvailable('man')) {
    console.error('Error: The "man" command is not installed.');
    console.error('');
    console.error('Install it with:');
    console.error('  sudo apt install man-db');
    console.error('');
    console.error('For development documentation, also install:');
    console.error('  sudo apt install manpages manpages-dev');
    process.exit(1);
  }

  // Show usage if no arguments provided
  if (args.length === 0) {
    console.log('Usage: m <command>');
    console.log('');
    console.log('Display the manual page for a command.');
    console.log('');
    console.log('Examples:');
    console.log('  m ls        Show the manual for the ls command');
    console.log('  m git       Show the manual for git');
    console.log('  m 5 passwd  Show section 5 (file formats) of passwd');
    return;
  }

  // Execute man with interactive terminal support
  const result = spawnSync('man', args, {
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

/**
 * Display man page on Raspberry Pi OS.
 *
 * Raspberry Pi OS (Raspbian) is Debian-based and has man pre-installed.
 * The implementation is identical to Ubuntu.
 *
 * @param {string[]} args - Command line arguments (passed directly to man)
 * @returns {Promise<void>}
 */
async function do_m_raspbian(args) {
  // Raspbian is Debian-based, same as Ubuntu
  if (!isCommandAvailable('man')) {
    console.error('Error: The "man" command is not installed.');
    console.error('');
    console.error('Install it with:');
    console.error('  sudo apt install man-db');
    process.exit(1);
  }

  if (args.length === 0) {
    console.log('Usage: m <command>');
    console.log('');
    console.log('Display the manual page for a command.');
    console.log('');
    console.log('Examples:');
    console.log('  m ls        Show the manual for the ls command');
    console.log('  m git       Show the manual for git');
    return;
  }

  const result = spawnSync('man', args, {
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

/**
 * Display man page on Amazon Linux.
 *
 * Amazon Linux is RHEL-based and includes man. Additional man pages
 * can be installed via 'man-pages' package.
 *
 * @param {string[]} args - Command line arguments (passed directly to man)
 * @returns {Promise<void>}
 */
async function do_m_amazon_linux(args) {
  if (!isCommandAvailable('man')) {
    console.error('Error: The "man" command is not installed.');
    console.error('');
    console.error('Install it with:');
    console.error('  sudo dnf install man-db man-pages');
    console.error('  # Or on older systems:');
    console.error('  sudo yum install man-db man-pages');
    process.exit(1);
  }

  if (args.length === 0) {
    console.log('Usage: m <command>');
    console.log('');
    console.log('Display the manual page for a command.');
    console.log('');
    console.log('Examples:');
    console.log('  m ls        Show the manual for the ls command');
    console.log('  m git       Show the manual for git');
    return;
  }

  const result = spawnSync('man', args, {
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

/**
 * Display help/manual information on Windows Command Prompt.
 *
 * Windows does not have a native man command. This function provides
 * alternatives:
 * - For built-in Windows commands: Use 'help <command>' or '<command> /?'
 * - For third-party tools: Suggests using --help flag
 * - If Git for Windows is installed: Can use its bundled man command
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_m_cmd(args) {
  if (args.length === 0) {
    console.log('Usage: m <command>');
    console.log('');
    console.log('Windows does not have a native "man" command.');
    console.log('');
    console.log('Alternatives for getting help on Windows:');
    console.log('  help <command>     For built-in CMD commands (e.g., help dir)');
    console.log('  <command> /?       Many commands support /? for help');
    console.log('  <command> --help   For Unix-style tools');
    console.log('');
    console.log('Examples:');
    console.log('  help dir           Get help for the dir command');
    console.log('  git --help         Get help for git');
    console.log('  node --help        Get help for node');
    return;
  }

  const command = args[0];

  // Check if Git for Windows provides man (it includes man pages for git commands)
  if (isCommandAvailable('man')) {
    const result = spawnSync('man', args, {
      stdio: 'inherit',
      shell: true
    });
    if (result.status === 0) {
      return;
    }
  }

  // Try 'help' command for built-in Windows commands
  const windowsBuiltins = [
    'assoc', 'break', 'call', 'cd', 'chdir', 'cls', 'color', 'copy', 'date',
    'del', 'dir', 'echo', 'endlocal', 'erase', 'exit', 'for', 'ftype', 'goto',
    'if', 'md', 'mkdir', 'mklink', 'move', 'path', 'pause', 'popd', 'prompt',
    'pushd', 'rd', 'rem', 'ren', 'rename', 'rmdir', 'set', 'setlocal', 'shift',
    'start', 'time', 'title', 'type', 'ver', 'verify', 'vol'
  ];

  if (windowsBuiltins.includes(command.toLowerCase())) {
    console.log(`Showing help for built-in command: ${command}`);
    console.log('');
    const result = spawnSync('help', [command], {
      stdio: 'inherit',
      shell: true
    });
    if (result.status !== 0) {
      process.exit(result.status || 1);
    }
    return;
  }

  // Try running the command with /? or --help
  console.log(`Windows does not have man pages. Trying "${command} --help"...`);
  console.log('');

  // Try --help first (more universal for cross-platform tools)
  let result = spawnSync(command, ['--help'], {
    stdio: 'inherit',
    shell: true
  });

  if (result.status !== 0) {
    // Try /? as fallback (Windows-style)
    console.log('');
    console.log(`Trying "${command} /?"...`);
    console.log('');
    result = spawnSync(command, ['/?'], {
      stdio: 'inherit',
      shell: true
    });
  }

  if (result.status !== 0 && result.error) {
    console.error(`Could not find help for: ${command}`);
    console.error('');
    console.error('Try:');
    console.error(`  ${command} --help`);
    console.error(`  ${command} /?`);
    console.error('  Or search online documentation');
    process.exit(1);
  }
}

/**
 * Display help/manual information on Windows PowerShell.
 *
 * PowerShell has its own help system using Get-Help cmdlet.
 * This function uses Get-Help for PowerShell commands and falls back
 * to traditional help methods for other commands.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_m_powershell(args) {
  if (args.length === 0) {
    console.log('Usage: m <command>');
    console.log('');
    console.log('Display help for a command.');
    console.log('');
    console.log('PowerShell alternatives:');
    console.log('  Get-Help <cmdlet>         PowerShell help system');
    console.log('  Get-Help <cmdlet> -Full   Detailed help');
    console.log('  <command> --help          For Unix-style tools');
    console.log('');
    console.log('Examples:');
    console.log('  m Get-Process    Show help for Get-Process cmdlet');
    console.log('  m git            Show help for git');
    return;
  }

  const command = args[0];

  // Check if Git for Windows provides man
  if (isCommandAvailable('man')) {
    const result = spawnSync('man', args, {
      stdio: 'inherit',
      shell: true
    });
    if (result.status === 0) {
      return;
    }
  }

  // Try PowerShell Get-Help for the command
  // This works for PowerShell cmdlets and some installed programs
  console.log(`Trying PowerShell Get-Help for: ${command}`);
  console.log('');

  let result = spawnSync('powershell', ['-Command', `Get-Help ${command}`], {
    stdio: 'inherit',
    shell: false
  });

  // If Get-Help worked, we're done
  if (result.status === 0) {
    return;
  }

  // Try --help flag
  console.log('');
  console.log(`Trying "${command} --help"...`);
  console.log('');

  result = spawnSync(command, ['--help'], {
    stdio: 'inherit',
    shell: true
  });

  if (result.status !== 0 && result.error) {
    console.error(`Could not find help for: ${command}`);
    console.error('');
    console.error('Try:');
    console.error(`  Get-Help ${command}`);
    console.error(`  ${command} --help`);
    console.error('  Or search online documentation');
    process.exit(1);
  }
}

/**
 * Display man page in Git Bash on Windows.
 *
 * Git Bash includes a subset of Unix utilities including man.
 * Man pages are available for Git commands and some core utilities.
 *
 * @param {string[]} args - Command line arguments (passed directly to man)
 * @returns {Promise<void>}
 */
async function do_m_gitbash(args) {
  if (args.length === 0) {
    console.log('Usage: m <command>');
    console.log('');
    console.log('Display the manual page for a command.');
    console.log('');
    console.log('Git Bash includes man pages for:');
    console.log('  - Git commands (git, git-log, git-commit, etc.)');
    console.log('  - Core utilities bundled with Git for Windows');
    console.log('');
    console.log('Examples:');
    console.log('  m git       Show the manual for git');
    console.log('  m git-log   Show the manual for git log');
    return;
  }

  // Git Bash should have man available
  if (!isCommandAvailable('man')) {
    console.error('Error: The "man" command is not available.');
    console.error('');
    console.error('This command requires Git Bash with man pages installed.');
    console.error('Try reinstalling Git for Windows with full components.');
    console.error('');
    console.error('Alternatively, use:');
    console.error(`  ${args[0]} --help`);
    process.exit(1);
  }

  const result = spawnSync('man', args, {
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    // If man fails, suggest --help as alternative
    console.log('');
    console.log(`No man page found. Try: ${args[0]} --help`);
    process.exit(result.status || 1);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "m" command is a shortcut for viewing manual pages. Manual pages (man pages)
 * are the traditional Unix documentation system, providing detailed information
 * about commands, system calls, and configuration files.
 *
 * On Unix-like systems (macOS, Linux), this invokes the native man command.
 * On Windows, alternatives are provided since man is not natively available.
 *
 * @param {string[]} args - Command line arguments (passed to man command)
 * @returns {Promise<void>}
 */
async function do_m(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_m_macos,
    'ubuntu': do_m_ubuntu,
    'debian': do_m_ubuntu,
    'raspbian': do_m_raspbian,
    'amazon_linux': do_m_amazon_linux,
    'rhel': do_m_amazon_linux,
    'fedora': do_m_ubuntu,
    'linux': do_m_ubuntu,
    'wsl': do_m_ubuntu,
    'cmd': do_m_cmd,
    'windows': do_m_cmd,
    'powershell': do_m_powershell,
    'gitbash': do_m_gitbash
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
  main: do_m,
  do_m,
  do_m_nodejs,
  do_m_macos,
  do_m_ubuntu,
  do_m_raspbian,
  do_m_amazon_linux,
  do_m_cmd,
  do_m_powershell,
  do_m_gitbash
};

if (require.main === module) {
  do_m(process.argv.slice(2));
}
