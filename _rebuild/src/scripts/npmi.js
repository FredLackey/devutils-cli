#!/usr/bin/env node

/**
 * npmi - Remove node_modules and reinstall dependencies
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   npmi() {
 *       if [ ! -f "$PWD/package.json" ]; then
 *           echo "Not an NPM package folder."
 *           return 1
 *       fi
 *       if [ -e "$PWD/node_modules" ]; then
 *           echo "Removing old node_modules folder..."
 *           eval "rm -rf $PWD/node_modules"
 *           if [ -e "$PWD/node_modules" ]; then
 *               echo "... failure!"
 *               return 1
 *           else
 *               echo "... done."
 *           fi
 *       fi
 *       echo "Setting Node v18 and installing..."
 *       export NVM_DIR=$HOME/.nvm;
 *       source $NVM_DIR/nvm.sh;
 *       eval "nvm use 18 && npm i"
 *       if [ -e "$PWD/node_modules" ]; then
 *           echo "... done."
 *       else
 *           echo "... failure!"
 *           return 1
 *       fi
 *   }
 *
 * This script provides a clean reinstall of npm dependencies by:
 * 1. Verifying the current directory contains a package.json
 * 2. Removing the existing node_modules folder if present
 * 3. Running npm install to reinstall all dependencies
 *
 * Note: The original script used nvm to set Node v18, but since this script
 * runs in Node.js 22+, we skip the nvm step and use the current Node version.
 * If you need a specific Node version, use nvm manually before running this.
 *
 * @module scripts/npmi
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

/**
 * Recursively removes a directory and all its contents.
 * This is a pure Node.js implementation that works on all platforms.
 *
 * We use fs.rmSync with recursive option (available in Node.js 14.14+).
 * This is more reliable than shelling out to 'rm -rf' because:
 * - Works identically on all platforms (macOS, Linux, Windows)
 * - Handles permission issues with better error messages
 * - No shell injection vulnerabilities
 *
 * @param {string} dirPath - Absolute path to the directory to remove
 * @returns {boolean} True if removal succeeded or directory didn't exist
 */
function removeDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      // Directory doesn't exist, nothing to remove
      return true;
    }

    // Use recursive removal - works on all platforms
    fs.rmSync(dirPath, { recursive: true, force: true });

    // Verify removal succeeded
    return !fs.existsSync(dirPath);
  } catch (error) {
    console.error(`Error removing directory: ${error.message}`);
    return false;
  }
}

/**
 * Detects the package manager to use based on lock files in the project.
 * This allows the script to work with npm, yarn, or pnpm projects.
 *
 * Detection order (first found wins):
 * 1. pnpm-lock.yaml -> pnpm
 * 2. yarn.lock -> yarn
 * 3. package-lock.json or none -> npm (default)
 *
 * @param {string} projectDir - Path to the project directory
 * @returns {string} The package manager command to use ('npm', 'yarn', or 'pnpm')
 */
function detectPackageManager(projectDir) {
  // Check for pnpm
  if (fs.existsSync(path.join(projectDir, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }

  // Check for yarn
  if (fs.existsSync(path.join(projectDir, 'yarn.lock'))) {
    return 'yarn';
  }

  // Default to npm (includes package-lock.json or no lock file)
  return 'npm';
}

/**
 * Checks if a command is available in the system PATH.
 *
 * @param {string} cmd - The command to check
 * @returns {boolean} True if the command exists
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
 * Pure Node.js implementation that works on any platform.
 *
 * This function handles the core logic of npmi:
 * 1. Validate that package.json exists
 * 2. Remove node_modules if it exists
 * 3. Run the appropriate package manager install command
 * 4. Verify that node_modules was created
 *
 * All file operations use Node.js native APIs (fs module).
 * Only the package manager execution requires spawning a child process,
 * which is unavoidable since we need to run npm/yarn/pnpm.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_npmi_nodejs(args) {
  const cwd = process.cwd();
  const packageJsonPath = path.join(cwd, 'package.json');
  const nodeModulesPath = path.join(cwd, 'node_modules');

  // Step 1: Check if package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    console.error('Not an NPM package folder.');
    console.error('No package.json found in the current directory.');
    process.exit(1);
  }

  // Step 2: Remove node_modules if it exists
  if (fs.existsSync(nodeModulesPath)) {
    console.log('Removing old node_modules folder...');

    const removed = removeDirectory(nodeModulesPath);
    if (!removed) {
      console.error('... failure!');
      console.error('Could not remove node_modules folder.');
      console.error('');
      console.error('Try closing any editors or processes that may have files open,');
      console.error('then run the command again.');
      process.exit(1);
    }
    console.log('... done.');
  }

  // Step 3: Detect package manager and install dependencies
  const packageManager = detectPackageManager(cwd);

  // Verify the package manager is available
  if (!isCommandAvailable(packageManager)) {
    console.error(`Error: ${packageManager} is not installed or not in PATH.`);
    console.error('');
    if (packageManager === 'pnpm') {
      console.error('Install pnpm with: npm install -g pnpm');
    } else if (packageManager === 'yarn') {
      console.error('Install yarn with: npm install -g yarn');
    } else {
      console.error('npm should be installed with Node.js. Check your Node installation.');
    }
    process.exit(1);
  }

  console.log(`Installing dependencies with ${packageManager}...`);

  // Run the install command
  // We use spawnSync with stdio: 'inherit' to show real-time output
  const installResult = spawnSync(packageManager, ['install'], {
    cwd: cwd,
    stdio: 'inherit',
    shell: true // Required for Windows to find npm/yarn/pnpm
  });

  if (installResult.error) {
    console.error(`... failure!`);
    console.error(`Error running ${packageManager} install: ${installResult.error.message}`);
    process.exit(1);
  }

  if (installResult.status !== 0) {
    console.error(`... failure!`);
    console.error(`${packageManager} install exited with code ${installResult.status}`);
    process.exit(1);
  }

  // Step 4: Verify node_modules was created
  if (fs.existsSync(nodeModulesPath)) {
    console.log('... done.');
  } else {
    // This can happen if there are no dependencies in package.json
    // which is valid, so we just note it rather than failing
    console.log('... done (note: no node_modules created, package.json may have no dependencies).');
  }
}

/**
 * Remove node_modules and reinstall dependencies on macOS.
 *
 * macOS uses the same Node.js implementation as all other platforms.
 * File operations and npm/yarn/pnpm work identically.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_npmi_macos(args) {
  return do_npmi_nodejs(args);
}

/**
 * Remove node_modules and reinstall dependencies on Ubuntu.
 *
 * Ubuntu uses the same Node.js implementation as all other platforms.
 * File operations and npm/yarn/pnpm work identically.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_npmi_ubuntu(args) {
  return do_npmi_nodejs(args);
}

/**
 * Remove node_modules and reinstall dependencies on Raspberry Pi OS.
 *
 * Raspberry Pi OS uses the same Node.js implementation as all other platforms.
 * File operations and npm/yarn/pnpm work identically.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_npmi_raspbian(args) {
  return do_npmi_nodejs(args);
}

/**
 * Remove node_modules and reinstall dependencies on Amazon Linux.
 *
 * Amazon Linux uses the same Node.js implementation as all other platforms.
 * File operations and npm/yarn/pnpm work identically.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_npmi_amazon_linux(args) {
  return do_npmi_nodejs(args);
}

/**
 * Remove node_modules and reinstall dependencies on Windows (CMD).
 *
 * Windows CMD uses the same Node.js implementation as all other platforms.
 * The fs.rmSync function handles Windows-specific path separators and
 * file locking issues automatically.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_npmi_cmd(args) {
  return do_npmi_nodejs(args);
}

/**
 * Remove node_modules and reinstall dependencies on Windows (PowerShell).
 *
 * Windows PowerShell uses the same Node.js implementation as all other platforms.
 * The fs.rmSync function handles Windows-specific path separators and
 * file locking issues automatically.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_npmi_powershell(args) {
  return do_npmi_nodejs(args);
}

/**
 * Remove node_modules and reinstall dependencies on Windows (Git Bash).
 *
 * Git Bash uses the same Node.js implementation as all other platforms.
 * The fs.rmSync function handles Windows-specific path separators and
 * file locking issues automatically.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_npmi_gitbash(args) {
  return do_npmi_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "npmi" command provides a clean reinstall of npm dependencies:
 * 1. Verifies the current directory is a Node.js project (has package.json)
 * 2. Removes the node_modules folder if it exists
 * 3. Detects the package manager (npm, yarn, or pnpm) from lock files
 * 4. Runs the install command
 * 5. Verifies dependencies were installed
 *
 * This is useful when:
 * - You want to ensure a fresh install of all dependencies
 * - You're experiencing issues with corrupted or outdated packages
 * - You've made significant changes to package.json
 * - You want to verify the project installs correctly from scratch
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_npmi(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_npmi_macos,
    'ubuntu': do_npmi_ubuntu,
    'debian': do_npmi_ubuntu,
    'raspbian': do_npmi_raspbian,
    'amazon_linux': do_npmi_amazon_linux,
    'rhel': do_npmi_amazon_linux,
    'fedora': do_npmi_ubuntu,
    'linux': do_npmi_ubuntu,
    'wsl': do_npmi_ubuntu,
    'cmd': do_npmi_cmd,
    'windows': do_npmi_cmd,
    'powershell': do_npmi_powershell,
    'gitbash': do_npmi_gitbash
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
  main: do_npmi,
  do_npmi,
  do_npmi_nodejs,
  do_npmi_macos,
  do_npmi_ubuntu,
  do_npmi_raspbian,
  do_npmi_amazon_linux,
  do_npmi_cmd,
  do_npmi_powershell,
  do_npmi_gitbash
};

if (require.main === module) {
  do_npmi(process.argv.slice(2));
}
