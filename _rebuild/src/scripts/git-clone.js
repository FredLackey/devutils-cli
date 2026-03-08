#!/usr/bin/env node

/**
 * git-clone - Copy repository structure without .git folder and common excludes
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   git-clone(){
 *     eval "rsync -av --progress $* ./ --exclude .git --exclude README.md --exclude LICENSE --exclude node_modules --exclude bower_components"
 *   }
 *
 * This script copies files from a source directory (typically a git repository)
 * to the current directory, excluding common files and folders that should not
 * be copied when using a repo as a template:
 *   - .git (version control history)
 *   - README.md (documentation specific to the source)
 *   - LICENSE (license specific to the source)
 *   - node_modules (dependencies that should be reinstalled)
 *   - bower_components (legacy dependencies that should be reinstalled)
 *
 * Use case: You want to use an existing repository as a starting template for
 * a new project without carrying over the git history or generated files.
 *
 * @module scripts/git-clone
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Default list of files and directories to exclude when copying.
 * These are common items that should not be copied when using a repo as a template.
 */
const DEFAULT_EXCLUDES = [
  '.git',
  'README.md',
  'LICENSE',
  'node_modules',
  'bower_components'
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
 * Check if a path should be excluded from copying.
 *
 * @param {string} relativePath - The path relative to the source directory
 * @param {string[]} excludes - Array of patterns to exclude
 * @returns {boolean} True if the path should be excluded
 */
function shouldExclude(relativePath, excludes) {
  // Normalize path separators for cross-platform compatibility
  const normalizedPath = relativePath.replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/');

  for (const exclude of excludes) {
    // Check if any part of the path matches the exclude pattern
    // This handles both files and directories at any depth
    if (pathParts.includes(exclude)) {
      return true;
    }
    // Also check if the relative path starts with the exclude (for top-level matches)
    if (normalizedPath === exclude || normalizedPath.startsWith(exclude + '/')) {
      return true;
    }
  }
  return false;
}

/**
 * Recursively copy a directory, excluding specified patterns.
 * This is a pure Node.js implementation that works on all platforms.
 *
 * @param {string} srcDir - Source directory path
 * @param {string} destDir - Destination directory path
 * @param {string[]} excludes - Array of patterns to exclude
 * @param {string} [relativePath=''] - Current relative path (used for recursion)
 * @param {boolean} [verbose=true] - Whether to show progress
 * @returns {number} Number of files copied
 */
function copyDirectoryRecursive(srcDir, destDir, excludes, relativePath = '', verbose = true) {
  let filesCopied = 0;

  // Read all entries in the source directory
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryRelativePath = relativePath ? path.join(relativePath, entry.name) : entry.name;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    // Check if this entry should be excluded
    if (shouldExclude(entryRelativePath, excludes)) {
      if (verbose) {
        console.log(`Skipping: ${entryRelativePath}`);
      }
      continue;
    }

    if (entry.isDirectory()) {
      // Create the directory if it doesn't exist
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      // Recursively copy contents
      filesCopied += copyDirectoryRecursive(srcPath, destPath, excludes, entryRelativePath, verbose);
    } else if (entry.isFile()) {
      // Copy the file
      fs.copyFileSync(srcPath, destPath);
      if (verbose) {
        console.log(`Copying: ${entryRelativePath}`);
      }
      filesCopied++;
    } else if (entry.isSymbolicLink()) {
      // Handle symbolic links - read the link target and recreate it
      try {
        const linkTarget = fs.readlinkSync(srcPath);
        // Remove existing symlink if it exists
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }
        fs.symlinkSync(linkTarget, destPath);
        if (verbose) {
          console.log(`Linking: ${entryRelativePath} -> ${linkTarget}`);
        }
        filesCopied++;
      } catch (err) {
        console.warn(`Warning: Could not copy symbolic link ${entryRelativePath}: ${err.message}`);
      }
    }
  }

  return filesCopied;
}

/**
 * Pure Node.js implementation for copying repository structure.
 * Uses Node.js fs module to recursively copy files while excluding
 * specified patterns. This works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Source directory path
 * @returns {Promise<void>}
 */
async function do_git_clone_nodejs(args) {
  // Validate arguments
  if (args.length === 0) {
    console.error('Usage: git-clone <source-directory> [destination-directory]');
    console.error('');
    console.error('Copies files from source to destination (default: current directory),');
    console.error('excluding: .git, README.md, LICENSE, node_modules, bower_components');
    console.error('');
    console.error('Examples:');
    console.error('  git-clone /path/to/template-repo');
    console.error('  git-clone ../my-template ./new-project');
    process.exit(1);
  }

  // Parse source path - remove trailing slash for consistency
  const sourcePath = path.resolve(args[0].replace(/\/+$/, ''));

  // Parse destination path - default to current directory
  const destPath = args[1] ? path.resolve(args[1]) : process.cwd();

  // Validate source directory exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Source directory does not exist: ${sourcePath}`);
    process.exit(1);
  }

  // Validate source is a directory
  const sourceStats = fs.statSync(sourcePath);
  if (!sourceStats.isDirectory()) {
    console.error(`Error: Source path is not a directory: ${sourcePath}`);
    process.exit(1);
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destPath)) {
    console.log(`Creating destination directory: ${destPath}`);
    fs.mkdirSync(destPath, { recursive: true });
  }

  // Validate destination is a directory
  const destStats = fs.statSync(destPath);
  if (!destStats.isDirectory()) {
    console.error(`Error: Destination path is not a directory: ${destPath}`);
    process.exit(1);
  }

  // Prevent copying a directory into itself
  const resolvedSource = fs.realpathSync(sourcePath);
  const resolvedDest = fs.realpathSync(destPath);
  if (resolvedDest.startsWith(resolvedSource + path.sep) || resolvedSource === resolvedDest) {
    console.error('Error: Cannot copy a directory into itself or a subdirectory of itself.');
    process.exit(1);
  }

  console.log(`Copying from: ${sourcePath}`);
  console.log(`Copying to:   ${destPath}`);
  console.log(`Excluding:    ${DEFAULT_EXCLUDES.join(', ')}`);
  console.log('');

  // Perform the copy
  const filesCopied = copyDirectoryRecursive(sourcePath, destPath, DEFAULT_EXCLUDES, '', true);

  console.log('');
  console.log(`Done! Copied ${filesCopied} file(s).`);
}

/**
 * Copy repository structure on macOS.
 *
 * Uses rsync if available (the original implementation approach) for better
 * performance with large directories. Falls back to pure Node.js if rsync
 * is not installed.
 *
 * rsync advantages:
 * - Shows progress for large files
 * - Preserves permissions and timestamps more reliably
 * - Handles edge cases with special files
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_clone_macos(args) {
  // rsync is installed by default on macOS, so use it for better performance
  if (isCommandAvailable('rsync')) {
    return do_git_clone_rsync(args);
  }
  // Fallback to pure Node.js implementation
  return do_git_clone_nodejs(args);
}

/**
 * Copy repository structure on Ubuntu.
 *
 * Uses rsync if available for better performance. rsync is commonly
 * installed on Ubuntu systems. Falls back to pure Node.js if not available.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_clone_ubuntu(args) {
  if (isCommandAvailable('rsync')) {
    return do_git_clone_rsync(args);
  }
  // Fallback to pure Node.js implementation
  return do_git_clone_nodejs(args);
}

/**
 * Copy repository structure on Raspberry Pi OS.
 *
 * Uses rsync if available for better performance. Falls back to
 * pure Node.js implementation if rsync is not installed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_clone_raspbian(args) {
  if (isCommandAvailable('rsync')) {
    return do_git_clone_rsync(args);
  }
  return do_git_clone_nodejs(args);
}

/**
 * Copy repository structure on Amazon Linux.
 *
 * Uses rsync if available for better performance. Falls back to
 * pure Node.js implementation if rsync is not installed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_clone_amazon_linux(args) {
  if (isCommandAvailable('rsync')) {
    return do_git_clone_rsync(args);
  }
  return do_git_clone_nodejs(args);
}

/**
 * Copy repository structure on Windows Command Prompt.
 *
 * Windows does not have rsync by default, so this uses the pure Node.js
 * implementation which works reliably on Windows.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_clone_cmd(args) {
  // Windows doesn't have rsync by default, use pure Node.js
  return do_git_clone_nodejs(args);
}

/**
 * Copy repository structure on Windows PowerShell.
 *
 * Uses the pure Node.js implementation for reliable cross-platform behavior.
 * PowerShell's Copy-Item doesn't have the same exclude capabilities as rsync.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_clone_powershell(args) {
  // Use pure Node.js for consistent behavior
  return do_git_clone_nodejs(args);
}

/**
 * Copy repository structure from Git Bash on Windows.
 *
 * Git Bash may have rsync available if installed separately (e.g., via MSYS2).
 * Falls back to pure Node.js if rsync is not available.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_clone_gitbash(args) {
  // Git Bash might have rsync if user installed it
  if (isCommandAvailable('rsync')) {
    return do_git_clone_rsync(args);
  }
  return do_git_clone_nodejs(args);
}

/**
 * Implementation using rsync for Unix-like systems.
 *
 * This matches the original bash function behavior exactly:
 *   rsync -av --progress $* ./ --exclude .git --exclude README.md ...
 *
 * rsync provides:
 * - Progress indication for large transfers
 * - Efficient incremental updates
 * - Proper handling of permissions and special files
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_clone_rsync(args) {
  // Validate arguments
  if (args.length === 0) {
    console.error('Usage: git-clone <source-directory> [destination-directory]');
    console.error('');
    console.error('Copies files from source to destination (default: current directory),');
    console.error('excluding: .git, README.md, LICENSE, node_modules, bower_components');
    console.error('');
    console.error('Examples:');
    console.error('  git-clone /path/to/template-repo');
    console.error('  git-clone ../my-template ./new-project');
    process.exit(1);
  }

  // Parse source path - ensure it ends with / for rsync directory behavior
  let sourcePath = path.resolve(args[0]);
  if (!sourcePath.endsWith('/')) {
    sourcePath += '/';
  }

  // Parse destination path - default to current directory
  let destPath = args[1] ? path.resolve(args[1]) : process.cwd();
  if (!destPath.endsWith('/')) {
    destPath += '/';
  }

  // Validate source directory exists
  const sourceDir = sourcePath.replace(/\/+$/, '');
  if (!fs.existsSync(sourceDir)) {
    console.error(`Error: Source directory does not exist: ${sourceDir}`);
    process.exit(1);
  }

  // Validate source is a directory
  const sourceStats = fs.statSync(sourceDir);
  if (!sourceStats.isDirectory()) {
    console.error(`Error: Source path is not a directory: ${sourceDir}`);
    process.exit(1);
  }

  // Create destination directory if it doesn't exist
  const destDir = destPath.replace(/\/+$/, '');
  if (!fs.existsSync(destDir)) {
    console.log(`Creating destination directory: ${destDir}`);
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Build the rsync command matching the original behavior
  // Original: rsync -av --progress $* ./ --exclude .git --exclude README.md ...
  const excludeArgs = DEFAULT_EXCLUDES.map(exc => `--exclude "${exc}"`).join(' ');
  const rsyncCmd = `rsync -av --progress "${sourcePath}" "${destPath}" ${excludeArgs}`;

  console.log(`Executing: ${rsyncCmd}`);
  console.log('');

  try {
    execSync(rsyncCmd, { stdio: 'inherit' });
    console.log('');
    console.log('Done!');
  } catch (error) {
    console.error('Error: rsync command failed.');
    console.error('Falling back to Node.js implementation...');
    console.log('');
    // Fall back to Node.js implementation
    return do_git_clone_nodejs(args);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "git-clone" command copies files from a source directory (typically a
 * git repository) to the current directory or a specified destination,
 * excluding common files that should not be copied when using a repo as
 * a template.
 *
 * This is useful when you want to:
 * - Use an existing repository as a starting point for a new project
 * - Copy project structure without git history
 * - Skip dependency folders that should be reinstalled fresh
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_clone(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_git_clone_macos,
    'ubuntu': do_git_clone_ubuntu,
    'debian': do_git_clone_ubuntu,
    'raspbian': do_git_clone_raspbian,
    'amazon_linux': do_git_clone_amazon_linux,
    'rhel': do_git_clone_amazon_linux,
    'fedora': do_git_clone_ubuntu,
    'linux': do_git_clone_ubuntu,
    'wsl': do_git_clone_ubuntu,
    'cmd': do_git_clone_cmd,
    'windows': do_git_clone_cmd,
    'powershell': do_git_clone_powershell,
    'gitbash': do_git_clone_gitbash
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
  main: do_git_clone,
  do_git_clone,
  do_git_clone_nodejs,
  do_git_clone_macos,
  do_git_clone_ubuntu,
  do_git_clone_raspbian,
  do_git_clone_amazon_linux,
  do_git_clone_cmd,
  do_git_clone_powershell,
  do_git_clone_gitbash
};

if (require.main === module) {
  do_git_clone(process.argv.slice(2));
}
