#!/usr/bin/env node

/**
 * install-dependencies-from - Install dependencies from another package.json
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   install-dependencies-from() {
 *       local package_json_path="$1"
 *       local dependency_type_prefix="${2:-dependencies}"
 *       local dependencies
 *       local npm_flag=""
 *       # ... maps prefix to npm flag
 *       dependencies=$(get-dependencies "$package_json_path" "$dependency_type_prefix")
 *       for dependency in $dependencies; do
 *           npm install "$dependency@latest" $npm_flag
 *       done
 *   }
 *
 * This script reads dependencies from a source package.json file and installs
 * them into the current project at their latest versions. This is useful when
 * you want to synchronize dependencies between projects or migrate dependencies
 * from one project to another.
 *
 * Why Node.js is used instead of shell commands:
 * - JSON parsing is native to Node.js (no need for jq)
 * - npm is always available where this script runs (Node.js is required)
 * - Cross-platform path handling using the path module
 * - Better error messages and validation
 *
 * @module scripts/install-dependencies-from
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('../utils/common/os');

/**
 * Maps dependency type prefixes to their full names in package.json.
 * This matches the original bash implementation's case statement.
 */
const DEPENDENCY_TYPE_MAP = {
  'dependencies': 'dependencies',
  'dev': 'devDependencies',
  'peer': 'peerDependencies',
  'opt': 'optionalDependencies',
  'bundle': 'bundledDependencies'
};

/**
 * Maps dependency type prefixes to npm install flags.
 * These flags tell npm where to save the dependency in package.json.
 */
const NPM_FLAG_MAP = {
  'dependencies': '--save',
  'dev': '--save-dev',
  'peer': '--save-peer',
  'opt': '--save-optional',
  'bundle': '--save-bundled'
};

/**
 * Checks if npm is available on the system.
 * Since this script is run with Node.js, npm should typically be available,
 * but we check anyway to provide a helpful error message if it's not.
 *
 * @returns {boolean} True if npm is available, false otherwise
 */
function isNpmAvailable() {
  try {
    execSync('npm --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts dependency names from a package.json file.
 * This is the same logic as get-dependencies.js but inlined here
 * to avoid inter-script dependencies.
 *
 * @param {string} packageJsonPath - Path to the package.json file
 * @param {string} dependencyType - The full dependency type name (e.g., 'devDependencies')
 * @returns {string[]} Array of dependency package names
 */
function extractDependencies(packageJsonPath, dependencyType) {
  // Resolve the path (handle relative and absolute paths)
  const resolvedPath = path.isAbsolute(packageJsonPath)
    ? packageJsonPath
    : path.resolve(process.cwd(), packageJsonPath);

  // Check if the file exists
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  // Read and parse the package.json file
  let packageJson;
  try {
    const fileContents = fs.readFileSync(resolvedPath, 'utf8');
    packageJson = JSON.parse(fileContents);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${resolvedPath}`);
    } else if (error.code === 'EACCES') {
      throw new Error(`Permission denied reading: ${resolvedPath}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${resolvedPath}: ${error.message}`);
    } else {
      throw new Error(`Error reading file: ${error.message}`);
    }
  }

  // Check if the dependency type exists in the package.json
  const dependencies = packageJson[dependencyType];
  if (!dependencies || typeof dependencies !== 'object') {
    // No dependencies of this type - return empty array
    return [];
  }

  // Return the dependency names (keys of the dependencies object)
  return Object.keys(dependencies);
}

/**
 * Installs a single dependency using npm.
 * This function spawns npm as a child process to provide real-time output
 * to the user, matching the original bash behavior.
 *
 * @param {string} packageName - The npm package name to install
 * @param {string} npmFlag - The npm flag (e.g., '--save-dev')
 * @returns {Promise<boolean>} Resolves to true if successful, false if failed
 */
function installDependency(packageName, npmFlag) {
  return new Promise((resolve) => {
    console.log(`Installing ${packageName}...`);

    // Build the npm install command arguments
    // We install @latest to get the latest version, matching the original behavior
    const args = ['install', `${packageName}@latest`, npmFlag];

    // Spawn npm as a child process
    // Using spawn instead of execSync allows real-time output streaming
    const npmProcess = spawn('npm', args, {
      stdio: 'inherit',  // Pipe output directly to parent process
      shell: true        // Use shell to handle cross-platform differences
    });

    npmProcess.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        console.error(`Failed to install ${packageName} (exit code: ${code})`);
        resolve(false);
      }
    });

    npmProcess.on('error', (error) => {
      console.error(`Error installing ${packageName}: ${error.message}`);
      resolve(false);
    });
  });
}

/**
 * Displays usage information for the script.
 */
function showUsage() {
  console.error('Usage: install-dependencies-from /path/to/package.json [dependency_type]');
  console.error('');
  console.error('Reads dependencies from a source package.json and installs them');
  console.error('into the current project at their latest versions.');
  console.error('');
  console.error('Dependency types:');
  console.error('  dependencies   - Production dependencies (default)');
  console.error('  dev            - Development dependencies');
  console.error('  peer           - Peer dependencies');
  console.error('  opt            - Optional dependencies');
  console.error('  bundle         - Bundled dependencies');
  console.error('');
  console.error('Examples:');
  console.error('  install-dependencies-from ../source/package.json');
  console.error('  install-dependencies-from ../source/package.json dev');
  console.error('  install-dependencies-from /path/to/project/package.json peer');
}

/**
 * Pure Node.js implementation that installs dependencies from another package.json.
 *
 * This function:
 * 1. Validates the input arguments
 * 2. Reads the source package.json to extract dependency names
 * 3. Installs each dependency into the current project at its latest version
 *
 * The implementation uses Node.js for JSON parsing and npm for package installation.
 * This works identically on all platforms because:
 * - fs and path modules handle platform differences in file paths
 * - npm is available wherever Node.js is installed
 * - Child process spawning works the same across platforms
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Path to source package.json file (required)
 * @param {string} [args[1]] - Dependency type prefix: "dev", "peer", "opt", "bundle", or "dependencies" (default: "dependencies")
 * @returns {Promise<void>}
 */
async function do_install_dependencies_from_nodejs(args) {
  const packageJsonPath = args[0];
  const dependencyTypePrefix = args[1] || 'dependencies';

  // Validate that a path was provided
  if (!packageJsonPath) {
    showUsage();
    process.exit(1);
  }

  // Validate the dependency type prefix
  const dependencyType = DEPENDENCY_TYPE_MAP[dependencyTypePrefix];
  if (!dependencyType) {
    console.error(`Error: Invalid dependency type prefix: ${dependencyTypePrefix}`);
    console.error('');
    console.error('Valid prefixes are:');
    console.error('  dependencies - Production dependencies');
    console.error('  dev          - Development dependencies');
    console.error('  peer         - Peer dependencies');
    console.error('  opt          - Optional dependencies');
    console.error('  bundle       - Bundled dependencies');
    process.exit(1);
  }

  // Get the npm flag for this dependency type
  const npmFlag = NPM_FLAG_MAP[dependencyTypePrefix];

  // Check if npm is available
  if (!isNpmAvailable()) {
    console.error('Error: npm is not installed or not in PATH.');
    console.error('Please install Node.js and npm to use this command.');
    process.exit(1);
  }

  // Check if we're in a directory with a package.json (npm project)
  const currentPackageJson = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(currentPackageJson)) {
    console.error('Error: No package.json found in current directory.');
    console.error('Please run this command from an npm project directory.');
    process.exit(1);
  }

  // Extract dependencies from the source package.json
  let dependencies;
  try {
    dependencies = extractDependencies(packageJsonPath, dependencyType);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  // Check if there are any dependencies to install
  if (dependencies.length === 0) {
    console.log('No dependencies to install.');
    return;
  }

  // Display what we're about to do
  const resolvedPath = path.isAbsolute(packageJsonPath)
    ? packageJsonPath
    : path.resolve(process.cwd(), packageJsonPath);
  console.log(`Installing ${dependencyType} from: ${resolvedPath}`);
  console.log(`Found ${dependencies.length} package(s) to install.`);
  console.log('');

  // Install each dependency
  let successCount = 0;
  let failCount = 0;

  for (const dependency of dependencies) {
    const success = await installDependency(dependency, npmFlag);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Print summary
  console.log('');
  console.log('Installation complete.');
  console.log(`  Succeeded: ${successCount}`);
  if (failCount > 0) {
    console.log(`  Failed: ${failCount}`);
  }

  // Exit with error code if any installations failed
  if (failCount > 0) {
    process.exit(1);
  }
}

/**
 * Install dependencies from another package.json on macOS.
 *
 * Delegates to the pure Node.js implementation since npm installation
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_install_dependencies_from_macos(args) {
  return do_install_dependencies_from_nodejs(args);
}

/**
 * Install dependencies from another package.json on Ubuntu.
 *
 * Delegates to the pure Node.js implementation since npm installation
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_install_dependencies_from_ubuntu(args) {
  return do_install_dependencies_from_nodejs(args);
}

/**
 * Install dependencies from another package.json on Raspberry Pi OS.
 *
 * Delegates to the pure Node.js implementation since npm installation
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_install_dependencies_from_raspbian(args) {
  return do_install_dependencies_from_nodejs(args);
}

/**
 * Install dependencies from another package.json on Amazon Linux.
 *
 * Delegates to the pure Node.js implementation since npm installation
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_install_dependencies_from_amazon_linux(args) {
  return do_install_dependencies_from_nodejs(args);
}

/**
 * Install dependencies from another package.json on Windows Command Prompt.
 *
 * Delegates to the pure Node.js implementation since npm installation
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_install_dependencies_from_cmd(args) {
  return do_install_dependencies_from_nodejs(args);
}

/**
 * Install dependencies from another package.json on Windows PowerShell.
 *
 * Delegates to the pure Node.js implementation since npm installation
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_install_dependencies_from_powershell(args) {
  return do_install_dependencies_from_nodejs(args);
}

/**
 * Install dependencies from another package.json in Git Bash on Windows.
 *
 * Delegates to the pure Node.js implementation since npm installation
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_install_dependencies_from_gitbash(args) {
  return do_install_dependencies_from_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Reads dependencies from a specified package.json file and installs them
 * into the current project at their latest versions. This is useful for:
 *
 * - Migrating dependencies from an old project to a new one
 * - Synchronizing dependencies across multiple projects
 * - Starting a new project with dependencies from a template
 * - Copying only specific dependency types (dev, peer, etc.)
 *
 * The script installs packages with @latest to ensure you get the most recent
 * version, even if the source package.json specifies an older version.
 *
 * Examples:
 *   install-dependencies-from ../source/package.json
 *   install-dependencies-from ../source/package.json dev
 *   install-dependencies-from /path/to/project/package.json peer
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_install_dependencies_from(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_install_dependencies_from_macos,
    'ubuntu': do_install_dependencies_from_ubuntu,
    'debian': do_install_dependencies_from_ubuntu,
    'raspbian': do_install_dependencies_from_raspbian,
    'amazon_linux': do_install_dependencies_from_amazon_linux,
    'rhel': do_install_dependencies_from_amazon_linux,
    'fedora': do_install_dependencies_from_ubuntu,
    'linux': do_install_dependencies_from_ubuntu,
    'wsl': do_install_dependencies_from_ubuntu,
    'cmd': do_install_dependencies_from_cmd,
    'windows': do_install_dependencies_from_cmd,
    'powershell': do_install_dependencies_from_powershell,
    'gitbash': do_install_dependencies_from_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_install_dependencies_from,
  do_install_dependencies_from,
  do_install_dependencies_from_nodejs,
  do_install_dependencies_from_macos,
  do_install_dependencies_from_ubuntu,
  do_install_dependencies_from_raspbian,
  do_install_dependencies_from_amazon_linux,
  do_install_dependencies_from_cmd,
  do_install_dependencies_from_powershell,
  do_install_dependencies_from_gitbash
};

if (require.main === module) {
  do_install_dependencies_from(process.argv.slice(2));
}
