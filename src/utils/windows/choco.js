#!/usr/bin/env node

/**
 * Chocolatey Package Manager Utilities
 *
 * Windows-specific utilities for interacting with Chocolatey.
 */

const shell = require('../common/shell');
const fs = require('fs');

/**
 * Well-known path where Chocolatey is typically installed on Windows.
 * This path is used as a fallback when choco is not found in PATH,
 * which can happen when Chocolatey was just installed and the current
 * process still has the old PATH environment variable.
 */
const CHOCO_KNOWN_PATH = 'C:\\ProgramData\\chocolatey\\bin\\choco.exe';

/**
 * Well-known directory where Chocolatey installs command binaries.
 * All Chocolatey-installed commands get shims placed here.
 */
const CHOCO_BIN_DIR = 'C:\\ProgramData\\chocolatey\\bin';

/**
 * Adds Chocolatey's bin directory to the current process's PATH.
 *
 * This is necessary after installing Chocolatey because the PATH environment
 * variable in the current Node.js process won't be updated until a new terminal
 * is opened. By manually adding the bin directory, subsequent child processes
 * spawned by this process will be able to find Chocolatey-installed commands.
 *
 * This function is idempotent - it won't add the path if it's already present.
 *
 * @returns {boolean} True if PATH was modified, false if already present
 */
function addBinToPath() {
  const currentPath = process.env.PATH || '';
  const pathSeparator = ';';

  // Check if already in PATH (case-insensitive on Windows)
  const paths = currentPath.split(pathSeparator);
  const alreadyInPath = paths.some(p =>
    p.toLowerCase() === CHOCO_BIN_DIR.toLowerCase()
  );

  if (alreadyInPath) {
    return false;
  }

  // Prepend Chocolatey bin directory to PATH
  process.env.PATH = `${CHOCO_BIN_DIR}${pathSeparator}${currentPath}`;
  return true;
}

/**
 * Checks if Chocolatey is installed.
 *
 * First checks PATH, then falls back to checking the well-known
 * installation path. This handles the case where Chocolatey was just
 * installed and PATH hasn't been updated in the current process.
 *
 * @returns {boolean}
 */
function isInstalled() {
  return getExecutablePath() !== null;
}

/**
 * Gets the path to the Chocolatey executable.
 *
 * First checks if choco is in PATH, then falls back to the well-known
 * installation path. This handles the case where Chocolatey was just
 * installed and PATH hasn't been updated in the current process.
 *
 * @returns {string|null} The path to choco executable, or null if not found
 */
function getExecutablePath() {
  // First check if choco is in PATH
  if (shell.commandExists('choco')) {
    return 'choco';
  }

  // Fall back to checking the well-known installation path
  // This handles cases where Chocolatey was just installed and PATH
  // hasn't been updated in the current Node.js process
  try {
    if (fs.existsSync(CHOCO_KNOWN_PATH)) {
      return CHOCO_KNOWN_PATH;
    }
  } catch {
    // Ignore errors checking the path
  }

  return null;
}

/**
 * Checks if a command binary exists in Chocolatey's bin directory.
 *
 * This is useful for verifying installations when the PATH hasn't been
 * updated yet. Chocolatey creates shims (small .exe files) in its bin
 * directory for all installed commands.
 *
 * @param {string} commandName - The command name (without .exe extension)
 * @returns {boolean} True if the binary exists in Chocolatey's bin directory
 */
function commandBinaryExists(commandName) {
  const path = require('path');
  const binaryPath = path.join(CHOCO_BIN_DIR, `${commandName}.exe`);

  try {
    return fs.existsSync(binaryPath);
  } catch {
    return false;
  }
}

/**
 * Gets the full path to a command's binary in Chocolatey's bin directory.
 *
 * @param {string} commandName - The command name (without .exe extension)
 * @returns {string|null} Full path to the binary, or null if not found
 */
function getCommandBinaryPath(commandName) {
  const path = require('path');
  const binaryPath = path.join(CHOCO_BIN_DIR, `${commandName}.exe`);

  try {
    if (fs.existsSync(binaryPath)) {
      return binaryPath;
    }
  } catch {
    // Ignore errors
  }

  return null;
}

/**
 * Returns the installed Chocolatey version
 * @returns {Promise<string|null>}
 */
async function getVersion() {
  const chocoPath = getExecutablePath();
  if (!chocoPath) {
    return null;
  }

  const result = await shell.exec(`"${chocoPath}" --version`);
  if (result.code === 0) {
    return result.stdout.trim();
  }
  return null;
}

/**
 * Installs a Chocolatey package
 * @param {string} packageName - The package name to install
 * @param {Object} [options] - Installation options
 * @param {boolean} [options.force=false] - Force reinstall if already installed
 * @param {string} [options.version] - Specific version to install
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function install(packageName, options = {}) {
  const chocoPath = getExecutablePath();
  if (!chocoPath) {
    return {
      success: false,
      output: 'Chocolatey is not installed'
    };
  }

  let command = `"${chocoPath}" install ${packageName} -y`;

  if (options.force) {
    command += ' --force';
  }

  if (options.version) {
    command += ` --version=${options.version}`;
  }

  const result = await shell.exec(command);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Removes a Chocolatey package
 * @param {string} packageName - The package name to remove
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function uninstall(packageName) {
  const chocoPath = getExecutablePath();
  if (!chocoPath) {
    return {
      success: false,
      output: 'Chocolatey is not installed'
    };
  }

  const result = await shell.exec(`"${chocoPath}" uninstall ${packageName} -y`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Checks if a package is installed via Chocolatey
 * @param {string} packageName - The package name to check
 * @returns {Promise<boolean>}
 */
async function isPackageInstalled(packageName) {
  const chocoPath = getExecutablePath();
  if (!chocoPath) {
    return false;
  }

  const result = await shell.exec(`"${chocoPath}" list --local-only --exact ${packageName}`);
  // Output contains the package name if installed
  return result.code === 0 && result.stdout.toLowerCase().includes(packageName.toLowerCase());
}

/**
 * Returns the installed version of a package
 * @param {string} packageName - The package name
 * @returns {Promise<string|null>}
 */
async function getPackageVersion(packageName) {
  const chocoPath = getExecutablePath();
  if (!chocoPath) {
    return null;
  }

  const result = await shell.exec(`"${chocoPath}" list --local-only --exact ${packageName}`);
  if (result.code !== 0) {
    return null;
  }

  // Output format: "packageName version"
  const lines = result.stdout.split('\n').filter(Boolean);
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] && parts[0].toLowerCase() === packageName.toLowerCase()) {
      return parts[1] || null;
    }
  }

  return null;
}

/**
 * Upgrades a package or all packages
 * @param {string} [packageName] - The package to upgrade (all if omitted)
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function upgrade(packageName) {
  const chocoPath = getExecutablePath();
  if (!chocoPath) {
    return {
      success: false,
      output: 'Chocolatey is not installed'
    };
  }

  const target = packageName || 'all';
  const result = await shell.exec(`"${chocoPath}" upgrade ${target} -y`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Searches the Chocolatey repository
 * @param {string} query - The search query
 * @returns {Promise<Array<{ name: string, version: string }>>}
 */
async function search(query) {
  const chocoPath = getExecutablePath();
  if (!chocoPath) {
    return [];
  }

  const result = await shell.exec(`"${chocoPath}" search "${query}"`);
  if (result.code !== 0) {
    return [];
  }

  const packages = [];
  const lines = result.stdout.split('\n').filter(Boolean);

  for (const line of lines) {
    // Skip header and summary lines
    if (line.includes('packages found') || line.includes('Chocolatey')) {
      continue;
    }

    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2 && !parts[0].includes('=')) {
      packages.push({
        name: parts[0],
        version: parts[1]
      });
    }
  }

  return packages;
}

/**
 * Gets information about a package
 * @param {string} packageName - The package name
 * @returns {Promise<string|null>}
 */
async function info(packageName) {
  const chocoPath = getExecutablePath();
  if (!chocoPath) {
    return null;
  }

  const result = await shell.exec(`"${chocoPath}" info ${packageName}`);
  if (result.code === 0) {
    return result.stdout;
  }
  return null;
}

/**
 * Lists all locally installed packages
 * @returns {Promise<Array<{ name: string, version: string }>>}
 */
async function listInstalled() {
  const chocoPath = getExecutablePath();
  if (!chocoPath) {
    return [];
  }

  const result = await shell.exec(`"${chocoPath}" list --local-only`);
  if (result.code !== 0) {
    return [];
  }

  const packages = [];
  const lines = result.stdout.split('\n').filter(Boolean);

  for (const line of lines) {
    // Skip summary line
    if (line.includes('packages installed')) {
      continue;
    }

    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      packages.push({
        name: parts[0],
        version: parts[1]
      });
    }
  }

  return packages;
}

/**
 * Lists outdated packages
 * @returns {Promise<Array<{ name: string, currentVersion: string, availableVersion: string }>>}
 */
async function listOutdated() {
  const chocoPath = getExecutablePath();
  if (!chocoPath) {
    return [];
  }

  const result = await shell.exec(`"${chocoPath}" outdated`);
  if (result.code !== 0) {
    return [];
  }

  const packages = [];
  const lines = result.stdout.split('\n').filter(Boolean);

  for (const line of lines) {
    // Lines with outdated packages have format: "name|currentVer|availableVer|pinned"
    if (line.includes('|')) {
      const parts = line.split('|');
      if (parts.length >= 3) {
        packages.push({
          name: parts[0].trim(),
          currentVersion: parts[1].trim(),
          availableVersion: parts[2].trim()
        });
      }
    }
  }

  return packages;
}

/**
 * Pins a package to prevent upgrades
 * @param {string} packageName - The package name
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function pin(packageName) {
  const chocoPath = getExecutablePath();
  if (!chocoPath) {
    return {
      success: false,
      output: 'Chocolatey is not installed'
    };
  }

  const result = await shell.exec(`"${chocoPath}" pin add -n="${packageName}"`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Unpins a package to allow upgrades
 * @param {string} packageName - The package name
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function unpin(packageName) {
  const chocoPath = getExecutablePath();
  if (!chocoPath) {
    return {
      success: false,
      output: 'Chocolatey is not installed'
    };
  }

  const result = await shell.exec(`"${chocoPath}" pin remove -n="${packageName}"`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

module.exports = {
  isInstalled,
  getExecutablePath,
  addBinToPath,
  commandBinaryExists,
  getCommandBinaryPath,
  getVersion,
  install,
  uninstall,
  isPackageInstalled,
  getPackageVersion,
  upgrade,
  search,
  info,
  listInstalled,
  listOutdated,
  pin,
  unpin
};
