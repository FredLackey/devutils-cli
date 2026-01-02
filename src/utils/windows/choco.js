#!/usr/bin/env node

/**
 * Chocolatey Package Manager Utilities
 *
 * Windows-specific utilities for interacting with Chocolatey.
 */

const shell = require('../common/shell');

/**
 * Checks if Chocolatey is installed
 * @returns {boolean}
 */
function isInstalled() {
  return shell.commandExists('choco');
}

/**
 * Returns the installed Chocolatey version
 * @returns {Promise<string|null>}
 */
async function getVersion() {
  if (!isInstalled()) {
    return null;
  }

  const result = await shell.exec('choco --version');
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
  if (!isInstalled()) {
    return {
      success: false,
      output: 'Chocolatey is not installed'
    };
  }

  let command = `choco install ${packageName} -y`;

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
  if (!isInstalled()) {
    return {
      success: false,
      output: 'Chocolatey is not installed'
    };
  }

  const result = await shell.exec(`choco uninstall ${packageName} -y`);
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
  if (!isInstalled()) {
    return false;
  }

  const result = await shell.exec(`choco list --local-only --exact ${packageName}`);
  // Output contains the package name if installed
  return result.code === 0 && result.stdout.toLowerCase().includes(packageName.toLowerCase());
}

/**
 * Returns the installed version of a package
 * @param {string} packageName - The package name
 * @returns {Promise<string|null>}
 */
async function getPackageVersion(packageName) {
  if (!isInstalled()) {
    return null;
  }

  const result = await shell.exec(`choco list --local-only --exact ${packageName}`);
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
  if (!isInstalled()) {
    return {
      success: false,
      output: 'Chocolatey is not installed'
    };
  }

  const target = packageName || 'all';
  const result = await shell.exec(`choco upgrade ${target} -y`);
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
  if (!isInstalled()) {
    return [];
  }

  const result = await shell.exec(`choco search "${query}"`);
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
  if (!isInstalled()) {
    return null;
  }

  const result = await shell.exec(`choco info ${packageName}`);
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
  if (!isInstalled()) {
    return [];
  }

  const result = await shell.exec('choco list --local-only');
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
  if (!isInstalled()) {
    return [];
  }

  const result = await shell.exec('choco outdated');
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
  if (!isInstalled()) {
    return {
      success: false,
      output: 'Chocolatey is not installed'
    };
  }

  const result = await shell.exec(`choco pin add -n="${packageName}"`);
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
  if (!isInstalled()) {
    return {
      success: false,
      output: 'Chocolatey is not installed'
    };
  }

  const result = await shell.exec(`choco pin remove -n="${packageName}"`);
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
  search,
  info,
  listInstalled,
  listOutdated,
  pin,
  unpin
};
