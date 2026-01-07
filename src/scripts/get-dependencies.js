#!/usr/bin/env node

/**
 * get-dependencies - Extract dependency names from package.json
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   get-dependencies() {
 *       local package_json_path="$1"
 *       local dependency_type_prefix="${2:-dependencies}"
 *       ...
 *       dependencies=$(jq -r --arg depType "$dependency_type" '.[$depType] | keys[]?' "$package_json_path")
 *       echo "$dependencies"
 *   }
 *
 * This script reads a package.json file and extracts the names of dependencies
 * from a specified dependency type (dependencies, devDependencies, etc.).
 * Unlike the original bash implementation that required jq, this Node.js version
 * uses native JSON parsing and works on all platforms without external tools.
 *
 * @module scripts/get-dependencies
 */

const fs = require('fs');
const path = require('path');
const os = require('../utils/common/os');

/**
 * Pure Node.js implementation that extracts dependency names from package.json.
 *
 * This function reads a package.json file and outputs the names of packages
 * from the specified dependency type. It works identically on all platforms
 * because it only uses Node.js built-in modules (fs for file reading and
 * JSON.parse for parsing).
 *
 * Why this is better than the original bash implementation:
 * - No external dependency on jq (which must be installed separately)
 * - Consistent behavior across all operating systems
 * - Better error messages with specific file/JSON parsing details
 * - Native JSON parsing is more reliable than command-line jq
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args[0] - Path to package.json file (required)
 * @param {string} [args[1]] - Dependency type prefix: "dev", "peer", "opt", "bundle", or "dependencies" (default: "dependencies")
 * @returns {Promise<void>}
 */
async function do_get_dependencies_nodejs(args) {
  const packageJsonPath = args[0];
  const dependencyTypePrefix = args[1] || 'dependencies';

  // Validate that a path was provided
  if (!packageJsonPath) {
    console.error('Usage: get-dependencies /path/to/package.json [dependency_type]');
    console.error('');
    console.error('Dependency types:');
    console.error('  dependencies   - Production dependencies (default)');
    console.error('  dev            - Development dependencies');
    console.error('  peer           - Peer dependencies');
    console.error('  opt            - Optional dependencies');
    console.error('  bundle         - Bundled dependencies');
    console.error('');
    console.error('Examples:');
    console.error('  get-dependencies ./package.json');
    console.error('  get-dependencies ./package.json dev');
    console.error('  get-dependencies ../other/package.json peer');
    process.exit(1);
  }

  // Resolve the path (handle relative and absolute paths)
  // Use process.cwd() to resolve relative paths from where the command is run
  const resolvedPath = path.isAbsolute(packageJsonPath)
    ? packageJsonPath
    : path.resolve(process.cwd(), packageJsonPath);

  // Check if the file exists
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: File not found: ${resolvedPath}`);
    process.exit(1);
  }

  // Map the prefix to the full dependency type name
  // This matches the original bash implementation's case statement
  const dependencyTypeMap = {
    'dependencies': 'dependencies',
    'dev': 'devDependencies',
    'peer': 'peerDependencies',
    'opt': 'optionalDependencies',
    'bundle': 'bundledDependencies'
  };

  const dependencyType = dependencyTypeMap[dependencyTypePrefix];

  // Validate the dependency type prefix
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

  // Read and parse the package.json file
  let packageJson;
  try {
    const fileContents = fs.readFileSync(resolvedPath, 'utf8');
    packageJson = JSON.parse(fileContents);
  } catch (error) {
    // Distinguish between read errors and parse errors for better debugging
    if (error.code === 'ENOENT') {
      console.error(`Error: File not found: ${resolvedPath}`);
    } else if (error.code === 'EACCES') {
      console.error(`Error: Permission denied reading: ${resolvedPath}`);
    } else if (error instanceof SyntaxError) {
      console.error(`Error: Invalid JSON in ${resolvedPath}`);
      console.error(`  ${error.message}`);
    } else {
      console.error(`Error reading file: ${error.message}`);
    }
    process.exit(1);
  }

  // Check if the dependency type exists in the package.json
  // If it doesn't exist or is null/undefined, silently exit with success
  // This matches the original bash behavior: return 0 if node doesn't exist
  const dependencies = packageJson[dependencyType];
  if (!dependencies || typeof dependencies !== 'object') {
    // No dependencies of this type - this is not an error, just empty output
    return;
  }

  // Extract and output the dependency names (keys of the dependencies object)
  // Each name is printed on its own line, matching the original jq output format
  const dependencyNames = Object.keys(dependencies);

  // If there are no dependencies, silently exit (matches original behavior)
  if (dependencyNames.length === 0) {
    return;
  }

  // Print each dependency name on its own line
  // This format matches the original: jq -r '.[$depType] | keys[]?'
  for (const name of dependencyNames) {
    console.log(name);
  }
}

/**
 * Extract dependency names on macOS.
 *
 * Delegates to the pure Node.js implementation since JSON parsing
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_dependencies_macos(args) {
  return do_get_dependencies_nodejs(args);
}

/**
 * Extract dependency names on Ubuntu.
 *
 * Delegates to the pure Node.js implementation since JSON parsing
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_dependencies_ubuntu(args) {
  return do_get_dependencies_nodejs(args);
}

/**
 * Extract dependency names on Raspberry Pi OS.
 *
 * Delegates to the pure Node.js implementation since JSON parsing
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_dependencies_raspbian(args) {
  return do_get_dependencies_nodejs(args);
}

/**
 * Extract dependency names on Amazon Linux.
 *
 * Delegates to the pure Node.js implementation since JSON parsing
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_dependencies_amazon_linux(args) {
  return do_get_dependencies_nodejs(args);
}

/**
 * Extract dependency names on Windows Command Prompt.
 *
 * Delegates to the pure Node.js implementation since JSON parsing
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_dependencies_cmd(args) {
  return do_get_dependencies_nodejs(args);
}

/**
 * Extract dependency names on Windows PowerShell.
 *
 * Delegates to the pure Node.js implementation since JSON parsing
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_dependencies_powershell(args) {
  return do_get_dependencies_nodejs(args);
}

/**
 * Extract dependency names in Git Bash on Windows.
 *
 * Delegates to the pure Node.js implementation since JSON parsing
 * works identically on all platforms.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_dependencies_gitbash(args) {
  return do_get_dependencies_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Extracts and lists dependency names from a package.json file. The output
 * is a list of package names (one per line), which can be piped to other
 * commands or used in scripts.
 *
 * This is useful for:
 * - Auditing what packages are installed
 * - Copying dependencies from one project to another
 * - Comparing dependencies between projects
 * - Scripting package installation workflows
 *
 * Examples:
 *   get-dependencies ./package.json          # List production dependencies
 *   get-dependencies ./package.json dev      # List devDependencies
 *   get-dependencies ../lib/package.json peer # List peerDependencies
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_dependencies(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_get_dependencies_macos,
    'ubuntu': do_get_dependencies_ubuntu,
    'debian': do_get_dependencies_ubuntu,
    'raspbian': do_get_dependencies_raspbian,
    'amazon_linux': do_get_dependencies_amazon_linux,
    'rhel': do_get_dependencies_amazon_linux,
    'fedora': do_get_dependencies_ubuntu,
    'linux': do_get_dependencies_ubuntu,
    'wsl': do_get_dependencies_ubuntu,
    'cmd': do_get_dependencies_cmd,
    'windows': do_get_dependencies_cmd,
    'powershell': do_get_dependencies_powershell,
    'gitbash': do_get_dependencies_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_get_dependencies,
  do_get_dependencies,
  do_get_dependencies_nodejs,
  do_get_dependencies_macos,
  do_get_dependencies_ubuntu,
  do_get_dependencies_raspbian,
  do_get_dependencies_amazon_linux,
  do_get_dependencies_cmd,
  do_get_dependencies_powershell,
  do_get_dependencies_gitbash
};

if (require.main === module) {
  do_get_dependencies(process.argv.slice(2));
}
