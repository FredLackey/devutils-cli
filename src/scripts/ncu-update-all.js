#!/usr/bin/env node

/**
 * ncu-update-all - Update all package.json dependencies using npm-check-updates
 *
 * Migrated from legacy dotfiles alias.
 * Original (bash):
 *   ncu-update-all(){
 *     if ! cmd_exists "ncu"; then
 *         printf "ncu is required, please install it!\n"
 *         exit 1
 *     fi
 *     for file in $(find . -type f -name "package.json" -not -path "star/node_modules/star" -not -path "star/bower_components/star"); do
 *       if [ -f "$file"  ]; then
 *         eval "ncu -a -u --packageFile $file"
 *       fi
 *     done
 *     for file in $(find . -type f -name "bower.json" -not -path "star/node_modules/star" -not -path "star/bower_components/star"); do
 *       if [ -f "$file"  ]; then
 *         eval "ncu -a -u -m bower --packageFile $file"
 *       fi
 *     done
 *   }
 *   (Note: "star" represents asterisk in the original find command paths)
 *
 * This script recursively finds all package.json and bower.json files and updates
 * their dependencies to the latest versions using npm-check-updates (ncu).
 *
 * Why use ncu (npm-check-updates)?
 * - It understands semver and package versioning semantics
 * - It queries the npm registry for the latest versions
 * - It preserves the version range format (^, ~, etc.)
 * - It handles peer dependencies and optional dependencies correctly
 *
 * This is a case where using the native tool (ncu) is superior to reimplementing
 * in Node.js because ncu is specifically designed for this task and handles
 * many edge cases.
 *
 * @module scripts/ncu-update-all
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

/**
 * Directory names to exclude from the search.
 * These directories typically contain dependencies or build artifacts
 * and should not be searched for package.json/bower.json files.
 */
const EXCLUDED_DIRECTORIES = [
  'node_modules',
  'bower_components',
  '.git',
  'dist',
  'build',
  'coverage'
];

/**
 * Check if a command is available in the system PATH.
 *
 * @param {string} command - The command name to check
 * @returns {boolean} True if the command exists, false otherwise
 */
function isCommandAvailable(command) {
  try {
    // Use 'where' on Windows, 'which' on Unix-like systems
    const checkCommand = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${checkCommand} ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively find files matching a specific name.
 * This walks the directory tree and collects paths to matching files,
 * skipping excluded directories like node_modules.
 *
 * Uses pure Node.js file system operations for cross-platform compatibility.
 *
 * @param {string} rootDir - Starting directory for the search
 * @param {string} targetName - Name of the file to find (e.g., 'package.json')
 * @returns {string[]} Array of absolute paths to found files
 */
function findFiles(rootDir, targetName) {
  const results = [];

  /**
   * Inner recursive function to walk the directory tree.
   * @param {string} currentDir - Current directory being examined
   */
  function walk(currentDir) {
    let entries;

    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (err) {
      // Cannot read directory (permission denied, etc.) - skip it
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip excluded directories
        if (EXCLUDED_DIRECTORIES.includes(entry.name)) {
          continue;
        }
        // Recurse into non-excluded directories
        walk(fullPath);
      } else if (entry.isFile() && entry.name === targetName) {
        // Found a matching file
        results.push(fullPath);
      }
    }
  }

  // Start the walk from the root directory
  walk(rootDir);

  return results;
}

/**
 * Run npm-check-updates on a single package file.
 *
 * @param {string} filePath - Absolute path to the package.json or bower.json file
 * @param {boolean} isBower - True if this is a bower.json file
 * @param {string} startPath - The root path (used for relative path display)
 * @returns {boolean} True if the update succeeded, false otherwise
 */
function updatePackageFile(filePath, isBower, startPath) {
  const relativePath = path.relative(startPath, filePath) || filePath;

  console.log('');
  console.log(`Updating: ${relativePath}`);
  console.log('-'.repeat(50));

  try {
    // Build the ncu command arguments
    // -a: upgrade all dependencies (including semver-incompatible)
    // -u: update package.json file (not just display)
    // --packageFile: specify the path to the package file
    const args = ['-a', '-u', '--packageFile', filePath];

    // For bower.json files, add the bower package manager flag
    if (isBower) {
      args.push('-m', 'bower');
    }

    // Execute ncu with the arguments
    // Using spawnSync to show output in real-time
    const result = spawnSync('ncu', args, {
      stdio: 'inherit',  // Show output directly to user
      shell: true        // Required for Windows compatibility
    });

    if (result.status !== 0) {
      console.log(`Warning: ncu exited with status ${result.status} for ${relativePath}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Error updating ${relativePath}: ${err.message}`);
    return false;
  }
}

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This implementation:
 * - Uses Node.js fs module to find package files (cross-platform)
 * - Delegates to ncu command for the actual update logic
 *
 * We use ncu (npm-check-updates) because it's the best tool for this job:
 * - Queries npm registry for latest versions
 * - Understands semver version ranges
 * - Handles workspace configurations
 * - Supports many package managers (npm, yarn, pnpm, bower)
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Optional path to search (defaults to current directory)
 * @returns {Promise<void>}
 */
async function do_ncu_update_all_nodejs(args) {
  // Check if ncu is installed
  if (!isCommandAvailable('ncu')) {
    console.error('Error: npm-check-updates (ncu) is required but not installed.');
    console.error('');
    console.error('To install ncu globally, run:');
    console.error('  npm install -g npm-check-updates');
    console.error('');
    console.error('Or with yarn:');
    console.error('  yarn global add npm-check-updates');
    process.exit(1);
  }

  // Determine the starting directory
  // If a path is provided as an argument, use it; otherwise use current working directory
  const startPath = args[0] ? path.resolve(args[0]) : process.cwd();

  // Verify the starting path exists and is a directory
  try {
    const stats = fs.statSync(startPath);
    if (!stats.isDirectory()) {
      console.error(`Error: '${startPath}' is not a directory.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`Error: Cannot access '${startPath}'.`);
    console.error(err.message);
    process.exit(1);
  }

  console.log('npm-check-updates: Update All Dependencies');
  console.log('==========================================');
  console.log(`Scanning directory: ${startPath}`);
  console.log(`Excluding: ${EXCLUDED_DIRECTORIES.join(', ')}`);
  console.log('');

  // Find all package.json files
  console.log('Searching for package.json files...');
  const packageJsonFiles = findFiles(startPath, 'package.json');
  console.log(`Found ${packageJsonFiles.length} package.json file(s)`);

  // Find all bower.json files
  console.log('Searching for bower.json files...');
  const bowerJsonFiles = findFiles(startPath, 'bower.json');
  console.log(`Found ${bowerJsonFiles.length} bower.json file(s)`);

  const totalFiles = packageJsonFiles.length + bowerJsonFiles.length;

  if (totalFiles === 0) {
    console.log('');
    console.log('No package.json or bower.json files found in this directory.');
    return;
  }

  // Track results
  let successCount = 0;
  let failCount = 0;

  // Process all package.json files
  for (const filePath of packageJsonFiles) {
    const success = updatePackageFile(filePath, false, startPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Process all bower.json files
  for (const filePath of bowerJsonFiles) {
    const success = updatePackageFile(filePath, true, startPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Print summary
  console.log('');
  console.log('==========================================');
  console.log('Summary');
  console.log('==========================================');
  console.log(`Total files processed: ${totalFiles}`);
  console.log(`Successful updates: ${successCount}`);
  if (failCount > 0) {
    console.log(`Failed updates: ${failCount}`);
  }
  console.log('');
  console.log('Note: To install the updated dependencies, run:');
  console.log('  npm install   (for npm projects)');
  console.log('  yarn install  (for yarn projects)');
  console.log('  bower install (for bower projects)');
}

/**
 * Update npm and bower dependencies on macOS.
 *
 * Uses the pure Node.js implementation since the logic is identical
 * across platforms - we use Node.js to find files and delegate to ncu
 * for the actual updates.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ncu_update_all_macos(args) {
  return do_ncu_update_all_nodejs(args);
}

/**
 * Update npm and bower dependencies on Ubuntu.
 *
 * Uses the pure Node.js implementation since the logic is identical
 * across platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ncu_update_all_ubuntu(args) {
  return do_ncu_update_all_nodejs(args);
}

/**
 * Update npm and bower dependencies on Raspberry Pi OS.
 *
 * Uses the pure Node.js implementation since the logic is identical
 * across platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ncu_update_all_raspbian(args) {
  return do_ncu_update_all_nodejs(args);
}

/**
 * Update npm and bower dependencies on Amazon Linux.
 *
 * Uses the pure Node.js implementation since the logic is identical
 * across platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ncu_update_all_amazon_linux(args) {
  return do_ncu_update_all_nodejs(args);
}

/**
 * Update npm and bower dependencies on Windows Command Prompt.
 *
 * Uses the pure Node.js implementation since the logic is identical
 * across platforms. The shell: true option in spawnSync handles
 * Windows command execution properly.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ncu_update_all_cmd(args) {
  return do_ncu_update_all_nodejs(args);
}

/**
 * Update npm and bower dependencies on Windows PowerShell.
 *
 * Uses the pure Node.js implementation since the logic is identical
 * across platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ncu_update_all_powershell(args) {
  return do_ncu_update_all_nodejs(args);
}

/**
 * Update npm and bower dependencies on Git Bash.
 *
 * Uses the pure Node.js implementation since the logic is identical
 * across platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ncu_update_all_gitbash(args) {
  return do_ncu_update_all_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Recursively finds all package.json and bower.json files in the specified
 * directory (or current directory) and updates their dependencies to the
 * latest versions using npm-check-updates (ncu).
 *
 * Usage:
 *   ncu-update-all              # Update all packages in current directory
 *   ncu-update-all ~/projects   # Update all packages in specified directory
 *
 * Requirements:
 *   - npm-check-updates must be installed globally
 *   - Install with: npm install -g npm-check-updates
 *
 * What it does:
 *   1. Finds all package.json files (excluding node_modules, etc.)
 *   2. Runs 'ncu -a -u' on each package.json to update versions
 *   3. Finds all bower.json files (for legacy projects)
 *   4. Runs 'ncu -a -u -m bower' on each bower.json
 *
 * After running this script, you'll need to run npm/yarn/bower install
 * in each project to actually install the updated dependencies.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ncu_update_all(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_ncu_update_all_macos,
    'ubuntu': do_ncu_update_all_ubuntu,
    'debian': do_ncu_update_all_ubuntu,
    'raspbian': do_ncu_update_all_raspbian,
    'amazon_linux': do_ncu_update_all_amazon_linux,
    'rhel': do_ncu_update_all_amazon_linux,
    'fedora': do_ncu_update_all_ubuntu,
    'linux': do_ncu_update_all_ubuntu,
    'wsl': do_ncu_update_all_ubuntu,
    'cmd': do_ncu_update_all_cmd,
    'windows': do_ncu_update_all_cmd,
    'powershell': do_ncu_update_all_powershell,
    'gitbash': do_ncu_update_all_gitbash
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
  main: do_ncu_update_all,
  do_ncu_update_all,
  do_ncu_update_all_nodejs,
  do_ncu_update_all_macos,
  do_ncu_update_all_ubuntu,
  do_ncu_update_all_raspbian,
  do_ncu_update_all_amazon_linux,
  do_ncu_update_all_cmd,
  do_ncu_update_all_powershell,
  do_ncu_update_all_gitbash
};

if (require.main === module) {
  do_ncu_update_all(process.argv.slice(2));
}
