#!/usr/bin/env node

/**
 * clone - Clone a repository and install its dependencies
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   clone() {
 *       git clone "$1" || return
 *       cd "$(basename "${1%.*}")" || return
 *       if [ ! -f "package.json" ]; then return; fi
 *       if [ -f "yarn.lock" ] && command -v "yarn" > /dev/null; then
 *           printf "\n"
 *           yarn install
 *           return
 *       fi
 *       if command -v "npm" > /dev/null; then
 *           printf "\n"
 *           npm install
 *       fi
 *   }
 *
 * This script clones a git repository, changes into the directory, and
 * automatically installs JavaScript dependencies if a package.json is found.
 * It intelligently detects whether to use yarn, pnpm, or npm based on
 * the presence of lock files.
 *
 * @module scripts/clone
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Helper function to check if a command exists on the system.
 * Used to detect which package managers and git are available.
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
 * Extracts the directory name from a git repository URL.
 *
 * Handles various URL formats:
 * - https://github.com/user/repo.git -> repo
 * - git@github.com:user/repo.git -> repo
 * - https://github.com/user/repo -> repo
 * - /path/to/local/repo -> repo
 *
 * @param {string} repoUrl - The repository URL or path
 * @returns {string} The extracted directory name
 */
function extractRepoName(repoUrl) {
  // Remove trailing slashes
  let cleaned = repoUrl.replace(/\/+$/, '');

  // Get the last segment of the path
  const lastSegment = cleaned.split('/').pop() || '';

  // Remove .git extension if present
  const repoName = lastSegment.replace(/\.git$/, '');

  // Handle SSH format (git@github.com:user/repo.git)
  if (repoName.includes(':')) {
    const afterColon = repoName.split(':').pop() || '';
    return afterColon.replace(/\.git$/, '');
  }

  return repoName || 'cloned-repo';
}

/**
 * Detects which package manager to use based on lock files.
 *
 * Priority order:
 * 1. pnpm (if pnpm-lock.yaml exists and pnpm is installed)
 * 2. yarn (if yarn.lock exists and yarn is installed)
 * 3. npm (if npm is installed)
 * 4. null (no package manager available)
 *
 * @param {string} directory - The directory to check for lock files
 * @returns {{ name: string, command: string } | null} Package manager info or null
 */
function detectPackageManager(directory) {
  // Check for pnpm first (it's becoming popular and uses pnpm-lock.yaml)
  const pnpmLockPath = path.join(directory, 'pnpm-lock.yaml');
  if (fs.existsSync(pnpmLockPath) && isCommandAvailable('pnpm')) {
    return { name: 'pnpm', command: 'pnpm install' };
  }

  // Check for yarn (uses yarn.lock)
  const yarnLockPath = path.join(directory, 'yarn.lock');
  if (fs.existsSync(yarnLockPath) && isCommandAvailable('yarn')) {
    return { name: 'yarn', command: 'yarn install' };
  }

  // Default to npm if available
  if (isCommandAvailable('npm')) {
    return { name: 'npm', command: 'npm install' };
  }

  // No package manager found
  return null;
}

/**
 * Pure Node.js implementation for cloning a repository and installing dependencies.
 *
 * This function handles the core logic:
 * 1. Validates that git is available
 * 2. Clones the repository using git (external tool - git is superior for this)
 * 3. Changes to the cloned directory (updates process.cwd)
 * 4. Detects if package.json exists (Node.js fs module)
 * 5. Detects the appropriate package manager based on lock files
 * 6. Installs dependencies
 *
 * Note: While we prefer pure Node.js, git is the right tool for cloning repositories.
 * Reimplementing git clone in Node.js would be complex and inferior.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args.0 - Repository URL to clone
 * @param {string} [args.1] - Optional target directory name
 * @returns {Promise<void>}
 */
async function do_clone_nodejs(args) {
  // Validate arguments
  if (args.length === 0) {
    console.error('Usage: clone <repository-url> [directory]');
    console.error('');
    console.error('Examples:');
    console.error('  clone https://github.com/user/repo.git');
    console.error('  clone git@github.com:user/repo.git');
    console.error('  clone https://github.com/user/repo.git my-project');
    process.exit(1);
  }

  const repoUrl = args[0];
  const targetDir = args[1] || extractRepoName(repoUrl);

  // Check if git is installed
  // Git is a native tool that's superior for repository operations - we use it rather than
  // trying to reimplement git clone in Node.js
  if (!isCommandAvailable('git')) {
    console.error('Error: git is required but not installed.');
    console.error('');
    if (process.platform === 'darwin') {
      console.error('Install it with: xcode-select --install');
      console.error('           or: brew install git');
    } else if (process.platform === 'win32') {
      console.error('Install it from: https://git-scm.com/download/win');
      console.error('           or: winget install Git.Git');
    } else {
      console.error('Install it with: sudo apt install git');
      console.error('           or: sudo dnf install git');
    }
    process.exit(1);
  }

  // Check if target directory already exists
  const fullTargetPath = path.resolve(process.cwd(), targetDir);
  if (fs.existsSync(fullTargetPath)) {
    console.error(`Error: Directory '${targetDir}' already exists.`);
    console.error('Please remove it or choose a different directory name.');
    process.exit(1);
  }

  // Clone the repository
  // Using git directly because it's the proper tool for this job - it handles:
  // - SSH authentication, HTTP/HTTPS protocols
  // - Shallow clones, submodules, LFS
  // - Progress output, error handling
  console.log(`Cloning ${repoUrl}...`);
  console.log('');

  try {
    // Use spawnSync for better output handling
    const cloneResult = spawnSync('git', ['clone', repoUrl, targetDir], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    if (cloneResult.status !== 0) {
      console.error('');
      console.error('Error: git clone failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error(`Error: Failed to clone repository: ${error.message}`);
    process.exit(1);
  }

  // Verify the directory was created
  if (!fs.existsSync(fullTargetPath)) {
    console.error('');
    console.error('Error: Clone appeared to succeed but directory was not created.');
    process.exit(1);
  }

  // Check for package.json - using Node.js fs module (native solution)
  const packageJsonPath = path.join(fullTargetPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    // No package.json, we're done
    console.log('');
    console.log(`Successfully cloned into '${targetDir}'.`);
    console.log('No package.json found - skipping dependency installation.');
    console.log('');
    console.log(`To enter the directory, run: cd ${targetDir}`);
    return;
  }

  // Detect and run the appropriate package manager
  const packageManager = detectPackageManager(fullTargetPath);

  if (!packageManager) {
    console.log('');
    console.log(`Successfully cloned into '${targetDir}'.`);
    console.log('package.json found but no package manager (npm, yarn, pnpm) is installed.');
    console.log('Install a package manager and run: npm install');
    console.log('');
    console.log(`To enter the directory, run: cd ${targetDir}`);
    return;
  }

  // Install dependencies
  console.log('');
  console.log(`Found package.json. Installing dependencies with ${packageManager.name}...`);
  console.log('');

  try {
    const installResult = spawnSync(packageManager.name, ['install'], {
      stdio: 'inherit',
      cwd: fullTargetPath,
      shell: true
    });

    if (installResult.status !== 0) {
      console.error('');
      console.error(`Warning: ${packageManager.name} install completed with errors.`);
      console.error('You may need to resolve dependency issues manually.');
    } else {
      console.log('');
      console.log('Dependencies installed successfully.');
    }
  } catch (error) {
    console.error('');
    console.error(`Warning: Failed to install dependencies: ${error.message}`);
    console.error(`You can try manually: cd ${targetDir} && ${packageManager.command}`);
  }

  console.log('');
  console.log(`Successfully cloned and set up '${targetDir}'.`);
  console.log(`To enter the directory, run: cd ${targetDir}`);
}

/**
 * Clone a repository and install dependencies on macOS.
 *
 * macOS typically has git pre-installed via Xcode Command Line Tools.
 * Uses the common Node.js implementation since git works the same way.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clone_macos(args) {
  return do_clone_nodejs(args);
}

/**
 * Clone a repository and install dependencies on Ubuntu.
 *
 * Ubuntu requires git to be installed via apt. The implementation
 * is identical to the Node.js version since git is cross-platform.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clone_ubuntu(args) {
  return do_clone_nodejs(args);
}

/**
 * Clone a repository and install dependencies on Raspberry Pi OS.
 *
 * Raspberry Pi OS is Debian-based and uses the same git package.
 * Uses the common Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clone_raspbian(args) {
  return do_clone_nodejs(args);
}

/**
 * Clone a repository and install dependencies on Amazon Linux.
 *
 * Amazon Linux uses dnf/yum for package management but git works
 * the same way. Uses the common Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clone_amazon_linux(args) {
  return do_clone_nodejs(args);
}

/**
 * Clone a repository and install dependencies in Windows Command Prompt.
 *
 * Windows requires Git for Windows to be installed. The git command
 * works the same way across all platforms, so we use the common implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clone_cmd(args) {
  return do_clone_nodejs(args);
}

/**
 * Clone a repository and install dependencies in Windows PowerShell.
 *
 * PowerShell can use the same git commands as CMD. Uses the common
 * Node.js implementation for consistency.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clone_powershell(args) {
  return do_clone_nodejs(args);
}

/**
 * Clone a repository and install dependencies in Git Bash on Windows.
 *
 * Git Bash comes with git pre-installed, making it ideal for this command.
 * Uses the common Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_clone_gitbash(args) {
  return do_clone_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "clone" command is a developer productivity tool that streamlines the
 * process of starting work on a new project:
 *
 * 1. Clones the repository to the current directory
 * 2. Automatically detects if it's a Node.js project (has package.json)
 * 3. Detects the correct package manager (pnpm, yarn, or npm) by lock files
 * 4. Installs dependencies automatically
 *
 * This saves developers from the repetitive sequence of:
 *   git clone <url>
 *   cd <directory>
 *   npm install  # or yarn install, pnpm install
 *
 * Note: Unlike the original shell function, this script cannot change the
 * parent shell's working directory. After running, the user must manually
 * cd into the cloned directory.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args.0 - Repository URL to clone
 * @param {string} [args.1] - Optional target directory name
 * @returns {Promise<void>}
 */
async function do_clone(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_clone_macos,
    'ubuntu': do_clone_ubuntu,
    'debian': do_clone_ubuntu,
    'raspbian': do_clone_raspbian,
    'amazon_linux': do_clone_amazon_linux,
    'rhel': do_clone_amazon_linux,
    'fedora': do_clone_ubuntu,
    'linux': do_clone_ubuntu,
    'wsl': do_clone_ubuntu,
    'cmd': do_clone_cmd,
    'windows': do_clone_cmd,
    'powershell': do_clone_powershell,
    'gitbash': do_clone_gitbash
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
  main: do_clone,
  do_clone,
  do_clone_nodejs,
  do_clone_macos,
  do_clone_ubuntu,
  do_clone_raspbian,
  do_clone_amazon_linux,
  do_clone_cmd,
  do_clone_powershell,
  do_clone_gitbash
};

if (require.main === module) {
  do_clone(process.argv.slice(2));
}
