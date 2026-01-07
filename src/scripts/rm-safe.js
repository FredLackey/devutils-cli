#!/usr/bin/env node

/**
 * rm-safe - Safe wrapper for rm preventing dangerous operations
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   rm_safe() {
 *       # Iterate over the arguments
 *       for arg in "$@"; do
 *           # Check if the argument is the root directory "/"
 *           if [ "$arg" = "/" ]; then
 *               echo "Error: Attempt to remove the root directory is forbidden!"
 *               return 1
 *           fi
 *
 *           # Check if the argument is any single directory in the root (e.g., "/bin", "/etc")
 *           if [[ "$arg" =~ ^/[^/]+$ ]]; then
 *               echo "Error: Attempt to remove a top-level directory is forbidden!"
 *               return 1
 *           fi
 *
 *           # Check if the argument is the wildcard pattern "/*"
 *           if [ "$arg" = "/*" ]; then
 *               echo "Error: Attempt to remove all files and directories in the root is forbidden!"
 *               return 1
 *           fi
 *       done
 *
 *       # Check if the arguments contain "--no-preserve-root"
 *       for arg in "$@"; do
 *           if [ "$arg" = "--no-preserve-root" ]; then
 *               echo "Error: Use of --no-preserve-root is forbidden!"
 *               return 1
 *           fi
 *       done
 *
 *       # Run the actual rm command with the original arguments
 *       command rm "$@"
 *   }
 *
 * This script wraps the system's rm command with safety checks to prevent
 * accidental removal of critical system directories. It blocks:
 * - The root directory "/"
 * - Top-level system directories like "/bin", "/etc", "/home"
 * - Wildcard patterns targeting root "/*"
 * - The dangerous "--no-preserve-root" flag
 *
 * @module scripts/rm-safe
 */

const os = require('../utils/common/os');
const { spawn } = require('child_process');
const path = require('path');

/**
 * List of dangerous paths that should never be removed.
 * These are top-level system directories common across Unix-like systems
 * and Windows. Removing any of these could make the system unbootable.
 */
const DANGEROUS_PATHS = [
  // Unix/Linux/macOS root and top-level directories
  '/',
  '/bin',
  '/boot',
  '/dev',
  '/etc',
  '/home',
  '/lib',
  '/lib32',
  '/lib64',
  '/libx32',
  '/media',
  '/mnt',
  '/opt',
  '/proc',
  '/root',
  '/run',
  '/sbin',
  '/srv',
  '/sys',
  '/tmp',
  '/usr',
  '/var',
  // macOS specific
  '/Applications',
  '/Library',
  '/System',
  '/Users',
  '/Volumes',
  '/cores',
  '/private',
  // Windows top-level paths (for Git Bash compatibility)
  'C:/',
  'C:\\',
  'C:/Windows',
  'C:\\Windows',
  'C:/Program Files',
  'C:\\Program Files',
  'C:/Program Files (x86)',
  'C:\\Program Files (x86)',
  'C:/Users',
  'C:\\Users'
];

/**
 * Dangerous flags that should never be passed to rm.
 * --no-preserve-root tells rm to not treat "/" specially,
 * which would allow recursive deletion of the entire filesystem.
 */
const DANGEROUS_FLAGS = [
  '--no-preserve-root'
];

/**
 * Dangerous wildcard patterns that could delete system files.
 */
const DANGEROUS_WILDCARDS = [
  '/*',
  '/.',
  '/..',
  'C:/*',
  'C:\\*'
];

/**
 * Normalizes a path for comparison by removing trailing slashes
 * and converting backslashes to forward slashes (for Windows paths).
 *
 * This function helps catch dangerous paths regardless of how they
 * are formatted (e.g., "/home/" vs "/home", "C:\" vs "C:/").
 *
 * @param {string} inputPath - The path to normalize
 * @returns {string} The normalized path
 */
function normalizePath(inputPath) {
  // Convert backslashes to forward slashes for consistent comparison
  let normalized = inputPath.replace(/\\/g, '/');

  // Remove trailing slash (unless it's just "/")
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Checks if a given argument is a dangerous path that should not be removed.
 *
 * This function checks against a list of known dangerous paths (system directories),
 * as well as patterns like top-level directories (e.g., "/anything").
 *
 * @param {string} arg - The argument to check
 * @returns {{ dangerous: boolean, reason: string }} Object indicating if dangerous and why
 */
function checkDangerousPath(arg) {
  const normalized = normalizePath(arg);

  // Check for exact match against dangerous paths
  for (const dangerousPath of DANGEROUS_PATHS) {
    const normalizedDangerous = normalizePath(dangerousPath);
    if (normalized === normalizedDangerous) {
      return {
        dangerous: true,
        reason: `Attempt to remove '${arg}' is forbidden! This is a critical system directory.`
      };
    }
  }

  // Check for root directory
  if (normalized === '/') {
    return {
      dangerous: true,
      reason: 'Attempt to remove the root directory is forbidden!'
    };
  }

  // Check for top-level directory pattern (e.g., "/bin", "/etc", "/anything")
  // This regex matches paths like "/something" but not "/something/else"
  const topLevelUnixPattern = /^\/[^/]+$/;
  if (topLevelUnixPattern.test(normalized)) {
    return {
      dangerous: true,
      reason: `Attempt to remove a top-level directory '${arg}' is forbidden!`
    };
  }

  // Check for dangerous wildcard patterns
  for (const pattern of DANGEROUS_WILDCARDS) {
    if (normalized === normalizePath(pattern)) {
      return {
        dangerous: true,
        reason: `Attempt to remove all files and directories in the root '${arg}' is forbidden!`
      };
    }
  }

  return { dangerous: false, reason: '' };
}

/**
 * Checks if a given argument is a dangerous flag.
 *
 * @param {string} arg - The argument to check
 * @returns {{ dangerous: boolean, reason: string }} Object indicating if dangerous and why
 */
function checkDangerousFlag(arg) {
  for (const flag of DANGEROUS_FLAGS) {
    if (arg === flag || arg.startsWith(flag + '=')) {
      return {
        dangerous: true,
        reason: `Use of '${flag}' is forbidden!`
      };
    }
  }

  return { dangerous: false, reason: '' };
}

/**
 * Validates all arguments passed to rm-safe.
 *
 * This function iterates through all arguments and checks each one
 * for dangerous paths and flags. If any dangerous argument is found,
 * it returns an error immediately.
 *
 * @param {string[]} args - The command line arguments
 * @returns {{ valid: boolean, error: string }} Validation result
 */
function validateArguments(args) {
  for (const arg of args) {
    // Skip empty arguments
    if (!arg || arg.trim() === '') {
      continue;
    }

    // Check for dangerous flags first (flags start with -)
    if (arg.startsWith('-')) {
      const flagCheck = checkDangerousFlag(arg);
      if (flagCheck.dangerous) {
        return { valid: false, error: flagCheck.reason };
      }
      // Skip further path checks for flags
      continue;
    }

    // Check for dangerous paths
    const pathCheck = checkDangerousPath(arg);
    if (pathCheck.dangerous) {
      return { valid: false, error: pathCheck.reason };
    }
  }

  return { valid: true, error: '' };
}

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function validates the arguments for dangerous operations and then
 * executes the appropriate rm command for the platform. On Unix-like systems,
 * it calls the system 'rm' command. On Windows, it uses the appropriate
 * deletion commands.
 *
 * The validation logic is entirely in Node.js and works cross-platform.
 * Only the actual file deletion delegates to system commands because:
 * 1. The native rm command handles complex recursive deletion edge cases
 * 2. It respects filesystem-specific behaviors (permissions, links, etc.)
 * 3. Users expect rm-like behavior and flags (-r, -f, -i, etc.)
 *
 * @param {string[]} args - Command line arguments (passed to rm)
 * @returns {Promise<void>}
 */
async function do_rm_safe_nodejs(args) {
  // If no arguments provided, show usage
  if (args.length === 0) {
    console.log('Usage: rm-safe [OPTIONS] [FILES/DIRECTORIES]');
    console.log('');
    console.log('A safer version of rm that prevents accidental removal of');
    console.log('critical system directories and dangerous operations.');
    console.log('');
    console.log('Blocked operations:');
    console.log('  - Removing the root directory "/"');
    console.log('  - Removing top-level directories like "/bin", "/etc", "/home"');
    console.log('  - Using "/*" wildcard pattern');
    console.log('  - Using --no-preserve-root flag');
    console.log('');
    console.log('All other rm arguments are passed through to the system rm command.');
    return;
  }

  // Validate the arguments
  const validation = validateArguments(args);
  if (!validation.valid) {
    console.error('Error: ' + validation.error);
    process.exit(1);
  }

  // Arguments are safe, execute rm
  // We need to use the platform-specific rm command
  // This will be handled by the platform-specific functions
  throw new Error('do_rm_safe_nodejs should not be called directly for execution. Use platform-specific function.');
}

/**
 * Execute the rm command on Unix-like systems (macOS, Linux).
 *
 * Uses the system 'rm' command after validating arguments.
 * The rm command is used directly because:
 * - It handles all the complex flags (-r, -f, -i, -v, etc.)
 * - It properly handles symbolic links, permissions, and edge cases
 * - Users expect exactly the same behavior as native rm
 *
 * @param {string[]} args - Command line arguments (passed to rm)
 * @returns {Promise<void>}
 */
async function executeUnixRm(args) {
  return new Promise((resolve, reject) => {
    // Spawn the rm command with inherited stdio so user sees output
    const child = spawn('rm', args, {
      stdio: 'inherit',
      shell: false
    });

    child.on('close', (code) => {
      if (code !== 0 && code !== null) {
        process.exit(code);
      }
      resolve();
    });

    child.on('error', (error) => {
      console.error('Error: Failed to execute rm command.');
      console.error(error.message);
      process.exit(1);
    });
  });
}

/**
 * Execute the rm command on Windows using PowerShell's Remove-Item.
 *
 * Windows doesn't have a native 'rm' command in CMD, so we use
 * PowerShell's Remove-Item which provides similar functionality.
 * Git Bash has rm, so it can use the Unix implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function executeWindowsRm(args) {
  return new Promise((resolve, reject) => {
    // Convert rm flags to PowerShell Remove-Item equivalents
    // -r (recursive) -> -Recurse
    // -f (force) -> -Force
    // Other flags may not have direct equivalents

    let recurse = false;
    let force = false;
    const paths = [];

    for (const arg of args) {
      if (arg === '-r' || arg === '-R' || arg === '--recursive') {
        recurse = true;
      } else if (arg === '-f' || arg === '--force') {
        force = true;
      } else if (arg === '-rf' || arg === '-fr') {
        recurse = true;
        force = true;
      } else if (!arg.startsWith('-')) {
        paths.push(arg);
      }
      // Other flags are ignored as they may not have PowerShell equivalents
    }

    if (paths.length === 0) {
      console.error('Error: No files or directories specified.');
      process.exit(1);
    }

    // Build PowerShell command
    // Quote paths properly for PowerShell
    const quotedPaths = paths.map(p => `"${p}"`).join(', ');
    let psArgs = ['-Command', `Remove-Item -Path ${quotedPaths}`];

    if (recurse) {
      psArgs[1] += ' -Recurse';
    }
    if (force) {
      psArgs[1] += ' -Force';
    }

    const child = spawn('powershell.exe', psArgs, {
      stdio: 'inherit',
      shell: false
    });

    child.on('close', (code) => {
      if (code !== 0 && code !== null) {
        process.exit(code);
      }
      resolve();
    });

    child.on('error', (error) => {
      console.error('Error: Failed to execute PowerShell Remove-Item command.');
      console.error(error.message);
      process.exit(1);
    });
  });
}

/**
 * Safe rm wrapper for macOS.
 *
 * Validates arguments for dangerous operations, then delegates to
 * the system rm command for actual file removal.
 *
 * @param {string[]} args - Command line arguments (passed to rm)
 * @returns {Promise<void>}
 */
async function do_rm_safe_macos(args) {
  // Handle help case with pure Node.js
  if (args.length === 0) {
    return do_rm_safe_nodejs(args);
  }

  // Validate the arguments
  const validation = validateArguments(args);
  if (!validation.valid) {
    console.error('Error: ' + validation.error);
    process.exit(1);
  }

  // Execute rm
  return executeUnixRm(args);
}

/**
 * Safe rm wrapper for Ubuntu.
 *
 * Validates arguments for dangerous operations, then delegates to
 * the system rm command for actual file removal.
 *
 * @param {string[]} args - Command line arguments (passed to rm)
 * @returns {Promise<void>}
 */
async function do_rm_safe_ubuntu(args) {
  // Handle help case with pure Node.js
  if (args.length === 0) {
    return do_rm_safe_nodejs(args);
  }

  // Validate the arguments
  const validation = validateArguments(args);
  if (!validation.valid) {
    console.error('Error: ' + validation.error);
    process.exit(1);
  }

  // Execute rm
  return executeUnixRm(args);
}

/**
 * Safe rm wrapper for Raspberry Pi OS.
 *
 * Validates arguments for dangerous operations, then delegates to
 * the system rm command for actual file removal.
 *
 * @param {string[]} args - Command line arguments (passed to rm)
 * @returns {Promise<void>}
 */
async function do_rm_safe_raspbian(args) {
  // Handle help case with pure Node.js
  if (args.length === 0) {
    return do_rm_safe_nodejs(args);
  }

  // Validate the arguments
  const validation = validateArguments(args);
  if (!validation.valid) {
    console.error('Error: ' + validation.error);
    process.exit(1);
  }

  // Execute rm
  return executeUnixRm(args);
}

/**
 * Safe rm wrapper for Amazon Linux.
 *
 * Validates arguments for dangerous operations, then delegates to
 * the system rm command for actual file removal.
 *
 * @param {string[]} args - Command line arguments (passed to rm)
 * @returns {Promise<void>}
 */
async function do_rm_safe_amazon_linux(args) {
  // Handle help case with pure Node.js
  if (args.length === 0) {
    return do_rm_safe_nodejs(args);
  }

  // Validate the arguments
  const validation = validateArguments(args);
  if (!validation.valid) {
    console.error('Error: ' + validation.error);
    process.exit(1);
  }

  // Execute rm
  return executeUnixRm(args);
}

/**
 * Safe rm wrapper for Windows Command Prompt.
 *
 * Validates arguments for dangerous operations, then uses
 * PowerShell's Remove-Item for file removal since CMD doesn't
 * have a native rm command.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_rm_safe_cmd(args) {
  // Handle help case with pure Node.js
  if (args.length === 0) {
    return do_rm_safe_nodejs(args);
  }

  // Validate the arguments
  const validation = validateArguments(args);
  if (!validation.valid) {
    console.error('Error: ' + validation.error);
    process.exit(1);
  }

  // Execute using PowerShell
  return executeWindowsRm(args);
}

/**
 * Safe rm wrapper for Windows PowerShell.
 *
 * Validates arguments for dangerous operations, then uses
 * PowerShell's Remove-Item for file removal.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_rm_safe_powershell(args) {
  // Handle help case with pure Node.js
  if (args.length === 0) {
    return do_rm_safe_nodejs(args);
  }

  // Validate the arguments
  const validation = validateArguments(args);
  if (!validation.valid) {
    console.error('Error: ' + validation.error);
    process.exit(1);
  }

  // Execute using PowerShell
  return executeWindowsRm(args);
}

/**
 * Safe rm wrapper for Git Bash.
 *
 * Git Bash provides a Unix-like rm command, so we can use the
 * same implementation as other Unix systems.
 *
 * @param {string[]} args - Command line arguments (passed to rm)
 * @returns {Promise<void>}
 */
async function do_rm_safe_gitbash(args) {
  // Handle help case with pure Node.js
  if (args.length === 0) {
    return do_rm_safe_nodejs(args);
  }

  // Validate the arguments
  const validation = validateArguments(args);
  if (!validation.valid) {
    console.error('Error: ' + validation.error);
    process.exit(1);
  }

  // Git Bash has rm, use Unix implementation
  return executeUnixRm(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "rm-safe" command is a safer version of rm that prevents accidental
 * removal of critical system directories. It validates all arguments before
 * passing them to the underlying rm command.
 *
 * Blocked operations:
 * - Removing "/" (root directory)
 * - Removing top-level directories like "/bin", "/etc", "/home"
 * - Using "/*" wildcard pattern
 * - Using the "--no-preserve-root" flag
 *
 * All other arguments are passed through to the system rm command unchanged.
 *
 * @param {string[]} args - Command line arguments (passed to rm)
 * @returns {Promise<void>}
 */
async function do_rm_safe(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_rm_safe_macos,
    'ubuntu': do_rm_safe_ubuntu,
    'debian': do_rm_safe_ubuntu,
    'raspbian': do_rm_safe_raspbian,
    'amazon_linux': do_rm_safe_amazon_linux,
    'rhel': do_rm_safe_amazon_linux,
    'fedora': do_rm_safe_ubuntu,
    'linux': do_rm_safe_ubuntu,
    'wsl': do_rm_safe_ubuntu,
    'cmd': do_rm_safe_cmd,
    'windows': do_rm_safe_cmd,
    'powershell': do_rm_safe_powershell,
    'gitbash': do_rm_safe_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS');
    console.error('  - Ubuntu, Debian, and other Linux distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - Amazon Linux');
    console.error('  - Windows (CMD, PowerShell, Git Bash)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_rm_safe,
  do_rm_safe,
  do_rm_safe_nodejs,
  do_rm_safe_macos,
  do_rm_safe_ubuntu,
  do_rm_safe_raspbian,
  do_rm_safe_amazon_linux,
  do_rm_safe_cmd,
  do_rm_safe_powershell,
  do_rm_safe_gitbash,
  // Export helpers for testing
  validateArguments,
  checkDangerousPath,
  checkDangerousFlag,
  normalizePath
};

if (require.main === module) {
  do_rm_safe(process.argv.slice(2));
}
