#!/usr/bin/env node

/**
 * Windows Package Manager (winget) Utilities
 *
 * Windows-specific utilities for interacting with winget.
 */

const shell = require('../common/shell');

/**
 * Checks if winget is available
 * @returns {boolean}
 */
function isInstalled() {
  return shell.commandExists('winget');
}

/**
 * Returns the installed winget version
 * @returns {Promise<string|null>}
 */
async function getVersion() {
  if (!isInstalled()) {
    return null;
  }

  const result = await shell.exec('winget --version');
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
 * @param {string} [options.source] - Package source (winget, msstore)
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function install(packageName, options = {}) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'winget is not available'
    };
  }

  let command = `winget install "${packageName}" --accept-package-agreements --accept-source-agreements`;

  if (options.silent !== false) {
    command += ' --silent';
  }

  if (options.version) {
    command += ` --version "${options.version}"`;
  }

  if (options.source) {
    command += ` --source ${options.source}`;
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
  if (!isInstalled()) {
    return {
      success: false,
      output: 'winget is not available'
    };
  }

  let command = `winget uninstall "${packageName}"`;

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
  if (!isInstalled()) {
    return false;
  }

  const result = await shell.exec(`winget list --exact --id "${packageName}"`);
  // Check if the output contains the package
  if (result.code === 0 && result.stdout.includes(packageName)) {
    return true;
  }

  // Try by name if ID didn't match
  const nameResult = await shell.exec(`winget list --exact --name "${packageName}"`);
  return nameResult.code === 0 && nameResult.stdout.includes(packageName);
}

/**
 * Returns the installed version of a package
 * @param {string} packageName - The package name or ID
 * @returns {Promise<string|null>}
 */
async function getPackageVersion(packageName) {
  if (!isInstalled()) {
    return null;
  }

  const result = await shell.exec(`winget list --exact --id "${packageName}"`);
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
  if (!isInstalled()) {
    return {
      success: false,
      output: 'winget is not available'
    };
  }

  let command = `winget upgrade "${packageName}" --accept-package-agreements --accept-source-agreements`;

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
  if (!isInstalled()) {
    return {
      success: false,
      output: 'winget is not available'
    };
  }

  const result = await shell.exec('winget upgrade --all --accept-package-agreements --accept-source-agreements');
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
  if (!isInstalled()) {
    return [];
  }

  const result = await shell.exec(`winget search "${query}"`);
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
  if (!isInstalled()) {
    return [];
  }

  const result = await shell.exec('winget list');
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
  if (!isInstalled()) {
    return null;
  }

  const result = await shell.exec(`winget show "${packageName}"`);
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
  if (!isInstalled()) {
    return [];
  }

  const result = await shell.exec('winget upgrade');
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
  if (!isInstalled()) {
    return {
      success: false,
      output: 'winget is not available'
    };
  }

  const result = await shell.exec('winget source update');
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

module.exports = {
  isInstalled,
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
