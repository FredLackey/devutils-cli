#!/usr/bin/env node

/**
 * APT Package Manager Utilities
 *
 * Ubuntu/Debian-specific utilities for interacting with APT.
 */

const shell = require('../common/shell');

/**
 * Checks if apt is available
 * @returns {boolean}
 */
function isInstalled() {
  return shell.commandExists('apt-get');
}

/**
 * Installs a package via apt-get
 * @param {string} packageName - The package name to install
 * @param {Object} [options] - Installation options
 * @param {boolean} [options.autoConfirm=true] - Automatically confirm installation
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function install(packageName, options = {}) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'apt-get is not available'
    };
  }

  const autoConfirm = options.autoConfirm !== false ? '-y' : '';
  const result = await shell.exec(`sudo apt-get install ${autoConfirm} ${packageName}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Removes an installed package
 * @param {string} packageName - The package name to remove
 * @param {Object} [options] - Removal options
 * @param {boolean} [options.purge=false] - Also remove configuration files
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function remove(packageName, options = {}) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'apt-get is not available'
    };
  }

  const command = options.purge ? 'purge' : 'remove';
  const result = await shell.exec(`sudo apt-get ${command} -y ${packageName}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Runs apt-get update to refresh package lists
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function update() {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'apt-get is not available'
    };
  }

  const result = await shell.exec('sudo apt-get update');
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Upgrades a specific package or all packages
 * @param {string} [packageName] - The package to upgrade (all if omitted)
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function upgrade(packageName) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'apt-get is not available'
    };
  }

  const command = packageName
    ? `sudo apt-get install -y --only-upgrade ${packageName}`
    : 'sudo apt-get upgrade -y';

  const result = await shell.exec(command);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Queries dpkg to check if a package is installed
 * @param {string} packageName - The package name to check
 * @returns {Promise<boolean>}
 */
async function isPackageInstalled(packageName) {
  const result = await shell.exec(`dpkg -l ${packageName} 2>/dev/null | grep -q "^ii"`);
  return result.code === 0;
}

/**
 * Returns the installed version of a package
 * @param {string} packageName - The package name
 * @returns {Promise<string|null>}
 */
async function getPackageVersion(packageName) {
  const result = await shell.exec(
    `dpkg -l ${packageName} 2>/dev/null | grep "^ii" | awk '{print $3}'`
  );
  if (result.code === 0 && result.stdout.trim()) {
    return result.stdout.trim();
  }
  return null;
}

/**
 * Adds an APT repository to sources
 * @param {string} repo - The repository specification
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function addRepository(repo) {
  if (!shell.commandExists('add-apt-repository')) {
    // Try to install software-properties-common first
    const installResult = await shell.exec('sudo apt-get install -y software-properties-common');
    if (installResult.code !== 0) {
      return {
        success: false,
        output: 'add-apt-repository is not available and could not be installed'
      };
    }
  }

  const result = await shell.exec(`sudo add-apt-repository -y "${repo}"`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Removes an APT repository
 * @param {string} repo - The repository specification
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function removeRepository(repo) {
  if (!shell.commandExists('add-apt-repository')) {
    return {
      success: false,
      output: 'add-apt-repository is not available'
    };
  }

  const result = await shell.exec(`sudo add-apt-repository --remove -y "${repo}"`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Imports a GPG key for package verification from a URL
 * @param {string} keyUrl - The URL of the GPG key
 * @param {string} [keyringPath] - Optional path for the keyring file
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function addKey(keyUrl, keyringPath) {
  // Modern method using signed-by (recommended for Ubuntu 22.04+)
  if (keyringPath) {
    const result = await shell.exec(
      `curl -fsSL "${keyUrl}" | sudo gpg --dearmor -o "${keyringPath}"`
    );
    return {
      success: result.code === 0,
      output: result.stdout || result.stderr
    };
  }

  // Legacy method using apt-key (deprecated but still works)
  const result = await shell.exec(
    `curl -fsSL "${keyUrl}" | sudo apt-key add -`
  );
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Imports a GPG key from a keyserver
 * @param {string} keyId - The GPG key ID
 * @param {string} [keyserver='keyserver.ubuntu.com'] - The keyserver to use
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function addKeyFromKeyserver(keyId, keyserver = 'keyserver.ubuntu.com') {
  const result = await shell.exec(
    `sudo apt-key adv --keyserver ${keyserver} --recv-keys ${keyId}`
  );
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Searches apt cache for packages
 * @param {string} query - The search query
 * @returns {Promise<string[]>}
 */
async function search(query) {
  const result = await shell.exec(`apt-cache search "${query}"`);
  if (result.code !== 0) {
    return [];
  }

  return result.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      // Format: "package-name - description"
      const match = line.match(/^(\S+)\s+-\s+/);
      return match ? match[1] : line.split(' ')[0];
    })
    .filter(Boolean);
}

/**
 * Gets detailed information about a package
 * @param {string} packageName - The package name
 * @returns {Promise<string|null>}
 */
async function info(packageName) {
  const result = await shell.exec(`apt-cache show ${packageName}`);
  if (result.code === 0) {
    return result.stdout;
  }
  return null;
}

/**
 * Lists all installed packages
 * @returns {Promise<string[]>}
 */
async function listInstalled() {
  const result = await shell.exec('dpkg --get-selections | grep -v deinstall');
  if (result.code !== 0) {
    return [];
  }

  return result.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t')[0])
    .filter(Boolean);
}

/**
 * Cleans up apt cache
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function clean() {
  const result = await shell.exec('sudo apt-get clean && sudo apt-get autoremove -y');
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

module.exports = {
  isInstalled,
  install,
  remove,
  update,
  upgrade,
  isPackageInstalled,
  getPackageVersion,
  addRepository,
  removeRepository,
  addKey,
  addKeyFromKeyserver,
  search,
  info,
  listInstalled,
  clean
};
