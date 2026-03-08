#!/usr/bin/env node

/**
 * Windows Package Manager (winget) Utilities
 *
 * Windows-specific utilities for interacting with winget.
 */

const shell = require('../common/shell');
const fs = require('fs');
const path = require('path');

/**
 * Well-known path where winget is typically installed on Windows.
 * This path is used as a fallback when winget is not found in PATH,
 * which can happen when winget was just installed and the current
 * process still has the old PATH environment variable.
 */
const WINGET_KNOWN_PATH = path.join(
  process.env.LOCALAPPDATA || '',
  'Microsoft',
  'WindowsApps',
  'winget.exe'
);

/**
 * The WindowsApps directory containing Microsoft Store app aliases.
 */
const WINDOWS_APPS_DIR = path.join(
  process.env.LOCALAPPDATA || '',
  'Microsoft',
  'WindowsApps'
);

/**
 * Adds the WindowsApps directory to the current process's PATH.
 *
 * This ensures that winget and other Microsoft Store apps are accessible
 * to child processes spawned by this Node.js process. Normally this directory
 * is in PATH, but in some environments (like fresh installations or CI) it may
 * not be.
 *
 * This function is idempotent - it won't add the path if it's already present.
 *
 * @returns {boolean} True if PATH was modified, false if already present
 */
function addBinToPath() {
  if (!WINDOWS_APPS_DIR) {
    return false;
  }

  const currentPath = process.env.PATH || '';
  const pathSeparator = ';';

  // Check if already in PATH (case-insensitive on Windows)
  const paths = currentPath.split(pathSeparator);
  const alreadyInPath = paths.some(p =>
    p.toLowerCase() === WINDOWS_APPS_DIR.toLowerCase()
  );

  if (alreadyInPath) {
    return false;
  }

  // Prepend WindowsApps directory to PATH
  process.env.PATH = `${WINDOWS_APPS_DIR}${pathSeparator}${currentPath}`;
  return true;
}

/**
 * Checks if winget is available.
 *
 * First checks PATH, then falls back to checking the well-known
 * installation path. This handles the case where winget was just
 * installed and PATH hasn't been updated in the current process.
 *
 * @returns {boolean}
 */
function isInstalled() {
  return getExecutablePath() !== null;
}

/**
 * Gets the path to the winget executable.
 *
 * First checks if winget is in PATH, then falls back to the well-known
 * installation path. This handles the case where winget was just
 * installed and PATH hasn't been updated in the current process.
 *
 * @returns {string|null} The path to winget executable, or null if not found
 */
function getExecutablePath() {
  // First check if winget is in PATH
  if (shell.commandExists('winget')) {
    return 'winget';
  }

  // Fall back to checking the well-known installation path
  // This handles cases where winget was just installed and PATH
  // hasn't been updated in the current Node.js process
  try {
    if (WINGET_KNOWN_PATH && fs.existsSync(WINGET_KNOWN_PATH)) {
      return WINGET_KNOWN_PATH;
    }
  } catch {
    // Ignore errors checking the path
  }

  return null;
}

/**
 * Returns the installed winget version
 * @returns {Promise<string|null>}
 */
async function getVersion() {
  const wingetPath = getExecutablePath();
  if (!wingetPath) {
    return null;
  }

  const result = await shell.exec(`"${wingetPath}" --version`);
  if (result.code === 0) {
    // Output: "v1.6.2771"
    return result.stdout.trim().replace(/^v/, '');
  }
  return null;
}

/**
 * Installs a package via winget
 * @param {string} packageName - The package name or ID to install
 * @param {Object} [options] - Installation options
 * @param {boolean} [options.silent=true] - Silent installation
 * @param {string} [options.version] - Specific version to install
 * @param {string} [options.source='winget'] - Package source (winget, msstore). Defaults to 'winget'
 *   to avoid issues with msstore certificate errors and source ambiguity.
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function install(packageName, options = {}) {
  const wingetPath = getExecutablePath();
  if (!wingetPath) {
    return {
      success: false,
      output: 'winget is not available'
    };
  }

  let command = `"${wingetPath}" install "${packageName}" --accept-package-agreements --accept-source-agreements`;

  if (options.silent !== false) {
    command += ' --silent';
  }

  if (options.version) {
    command += ` --version "${options.version}"`;
  }

  // Default to 'winget' source to avoid msstore certificate errors and
  // source ambiguity when packages exist in multiple sources
  const source = options.source !== undefined ? options.source : 'winget';
  if (source) {
    command += ` --source ${source}`;
  }

  const result = await shell.exec(command);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Removes a package via winget
 * @param {string} packageName - The package name or ID to remove
 * @param {Object} [options] - Removal options
 * @param {boolean} [options.silent=true] - Silent uninstallation
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function uninstall(packageName, options = {}) {
  const wingetPath = getExecutablePath();
  if (!wingetPath) {
    return {
      success: false,
      output: 'winget is not available'
    };
  }

  let command = `"${wingetPath}" uninstall "${packageName}"`;

  if (options.silent !== false) {
    command += ' --silent';
  }

  const result = await shell.exec(command);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Checks if a package is installed
 * @param {string} packageName - The package name or ID to check
 * @returns {Promise<boolean>}
 */
async function isPackageInstalled(packageName) {
  const wingetPath = getExecutablePath();
  if (!wingetPath) {
    return false;
  }

  const result = await shell.exec(`"${wingetPath}" list --exact --id "${packageName}"`);
  // Check if the output contains the package
  if (result.code === 0 && result.stdout.includes(packageName)) {
    return true;
  }

  // Try by name if ID didn't match
  const nameResult = await shell.exec(`"${wingetPath}" list --exact --name "${packageName}"`);
  return nameResult.code === 0 && nameResult.stdout.includes(packageName);
}

/**
 * Returns the installed version of a package
 * @param {string} packageName - The package name or ID
 * @returns {Promise<string|null>}
 */
async function getPackageVersion(packageName) {
  const wingetPath = getExecutablePath();
  if (!wingetPath) {
    return null;
  }

  const result = await shell.exec(`"${wingetPath}" list --exact --id "${packageName}"`);
  if (result.code !== 0) {
    return null;
  }

  // Parse the output to find the version
  // Output format is a table with columns: Name, Id, Version, Available, Source
  const lines = result.stdout.split('\n').filter(Boolean);
  for (const line of lines) {
    if (line.includes(packageName)) {
      // Find version column (typically after the ID)
      const parts = line.split(/\s{2,}/);
      if (parts.length >= 3) {
        return parts[2].trim();
      }
    }
  }

  return null;
}

/**
 * Upgrades a package
 * @param {string} packageName - The package name or ID to upgrade
 * @param {Object} [options] - Upgrade options
 * @param {boolean} [options.silent=true] - Silent upgrade
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function upgrade(packageName, options = {}) {
  const wingetPath = getExecutablePath();
  if (!wingetPath) {
    return {
      success: false,
      output: 'winget is not available'
    };
  }

  let command = `"${wingetPath}" upgrade "${packageName}" --accept-package-agreements --accept-source-agreements`;

  if (options.silent !== false) {
    command += ' --silent';
  }

  const result = await shell.exec(command);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Upgrades all packages
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function upgradeAll() {
  const wingetPath = getExecutablePath();
  if (!wingetPath) {
    return {
      success: false,
      output: 'winget is not available'
    };
  }

  const result = await shell.exec(`"${wingetPath}" upgrade --all --accept-package-agreements --accept-source-agreements`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Searches the winget repository
 * @param {string} query - The search query
 * @returns {Promise<Array<{ name: string, id: string, version: string }>>}
 */
async function search(query) {
  const wingetPath = getExecutablePath();
  if (!wingetPath) {
    return [];
  }

  const result = await shell.exec(`"${wingetPath}" search "${query}"`);
  if (result.code !== 0) {
    return [];
  }

  const packages = [];
  const lines = result.stdout.split('\n').filter(Boolean);

  // Skip header lines (usually first 2)
  let dataStarted = false;
  for (const line of lines) {
    // Look for separator line to know when data starts
    if (line.includes('---')) {
      dataStarted = true;
      continue;
    }

    if (!dataStarted) continue;

    // Parse columns (separated by multiple spaces)
    const parts = line.split(/\s{2,}/).filter(Boolean);
    if (parts.length >= 2) {
      packages.push({
        name: parts[0].trim(),
        id: parts[1].trim(),
        version: parts[2] ? parts[2].trim() : ''
      });
    }
  }

  return packages;
}

/**
 * Lists installed packages
 * @returns {Promise<Array<{ name: string, id: string, version: string }>>}
 */
async function list() {
  const wingetPath = getExecutablePath();
  if (!wingetPath) {
    return [];
  }

  const result = await shell.exec(`"${wingetPath}" list`);
  if (result.code !== 0) {
    return [];
  }

  const packages = [];
  const lines = result.stdout.split('\n').filter(Boolean);

  let dataStarted = false;
  for (const line of lines) {
    if (line.includes('---')) {
      dataStarted = true;
      continue;
    }

    if (!dataStarted) continue;

    const parts = line.split(/\s{2,}/).filter(Boolean);
    if (parts.length >= 2) {
      packages.push({
        name: parts[0].trim(),
        id: parts[1].trim(),
        version: parts[2] ? parts[2].trim() : ''
      });
    }
  }

  return packages;
}

/**
 * Gets information about a package
 * @param {string} packageName - The package name or ID
 * @returns {Promise<string|null>}
 */
async function info(packageName) {
  const wingetPath = getExecutablePath();
  if (!wingetPath) {
    return null;
  }

  const result = await shell.exec(`"${wingetPath}" show "${packageName}"`);
  if (result.code === 0) {
    return result.stdout;
  }
  return null;
}

/**
 * Lists packages with available upgrades
 * @returns {Promise<Array<{ name: string, id: string, currentVersion: string, availableVersion: string }>>}
 */
async function listUpgradable() {
  const wingetPath = getExecutablePath();
  if (!wingetPath) {
    return [];
  }

  const result = await shell.exec(`"${wingetPath}" upgrade`);
  if (result.code !== 0) {
    return [];
  }

  const packages = [];
  const lines = result.stdout.split('\n').filter(Boolean);

  let dataStarted = false;
  for (const line of lines) {
    if (line.includes('---')) {
      dataStarted = true;
      continue;
    }

    if (!dataStarted) continue;

    // Skip summary lines
    if (line.includes('upgrades available') || line.includes('winget upgrade')) {
      continue;
    }

    const parts = line.split(/\s{2,}/).filter(Boolean);
    if (parts.length >= 4) {
      packages.push({
        name: parts[0].trim(),
        id: parts[1].trim(),
        currentVersion: parts[2].trim(),
        availableVersion: parts[3].trim()
      });
    }
  }

  return packages;
}

/**
 * Updates winget sources
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function updateSources() {
  const wingetPath = getExecutablePath();
  if (!wingetPath) {
    return {
      success: false,
      output: 'winget is not available'
    };
  }

  const result = await shell.exec(`"${wingetPath}" source update`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

module.exports = {
  isInstalled,
  getExecutablePath,
  addBinToPath,
  getVersion,
  install,
  uninstall,
  isPackageInstalled,
  getPackageVersion,
  upgrade,
  upgradeAll,
  search,
  list,
  info,
  listUpgradable,
  updateSources
};
