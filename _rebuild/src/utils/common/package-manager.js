#!/usr/bin/env node

/**
 * Package Manager Abstraction Utilities
 *
 * Cross-platform abstraction layer for package managers.
 * Provides a unified interface for installing packages across different platforms.
 */

const osUtils = require('./os');
const shell = require('./shell');

/**
 * Returns list of available package managers on current system
 * @returns {Promise<string[]>}
 */
async function getAvailable() {
  const available = [];
  const platform = osUtils.detect();

  switch (platform.type) {
    case 'macos':
      if (shell.commandExists('brew')) {
        available.push('brew');
      }
      break;

    case 'ubuntu':
    case 'debian':
    case 'raspbian':
      if (shell.commandExists('apt-get')) {
        available.push('apt');
      }
      if (shell.commandExists('snap')) {
        available.push('snap');
      }
      break;

    case 'amazon_linux':
    case 'rhel':
    case 'fedora':
      if (shell.commandExists('dnf')) {
        available.push('dnf');
      }
      if (shell.commandExists('yum')) {
        available.push('yum');
      }
      break;

    case 'windows':
      if (shell.commandExists('winget')) {
        available.push('winget');
      }
      if (shell.commandExists('choco')) {
        available.push('choco');
      }
      break;
  }

  // Universal package managers
  if (shell.commandExists('npm')) {
    available.push('npm');
  }
  if (shell.commandExists('pip') || shell.commandExists('pip3')) {
    available.push('pip');
  }

  return available;
}

/**
 * Returns the preferred/recommended package manager for current platform
 * @returns {string|null}
 */
function getPreferred() {
  const platform = osUtils.detect();

  switch (platform.type) {
    case 'macos':
      return 'brew';
    case 'ubuntu':
    case 'debian':
    case 'raspbian':
      return 'apt';
    case 'amazon_linux':
    case 'rhel':
    case 'fedora':
      return platform.packageManager; // dnf or yum
    case 'windows':
      return shell.commandExists('winget') ? 'winget' : 'choco';
    default:
      return null;
  }
}

/**
 * Installs a package using the best available package manager
 * @param {string} packageName - The package to install
 * @param {Object} [options] - Installation options
 * @param {string} [options.manager] - Force a specific package manager
 * @param {boolean} [options.global] - Install globally (for npm/pip)
 * @param {boolean} [options.cask] - Install as cask (macOS only)
 * @param {boolean} [options.classic] - Use classic confinement (snap only)
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function install(packageName, options = {}) {
  const manager = options.manager || getPreferred();

  if (!manager) {
    return {
      success: false,
      output: 'No package manager available'
    };
  }

  let command;

  switch (manager) {
    case 'brew':
      if (options.cask) {
        command = `brew install --cask ${packageName}`;
      } else {
        command = `brew install ${packageName}`;
      }
      break;

    case 'apt':
      command = `sudo apt-get install -y ${packageName}`;
      break;

    case 'snap':
      if (options.classic) {
        command = `sudo snap install ${packageName} --classic`;
      } else {
        command = `sudo snap install ${packageName}`;
      }
      break;

    case 'dnf':
      command = `sudo dnf install -y ${packageName}`;
      break;

    case 'yum':
      command = `sudo yum install -y ${packageName}`;
      break;

    case 'winget':
      command = `winget install --accept-package-agreements --accept-source-agreements ${packageName}`;
      break;

    case 'choco':
      command = `choco install -y ${packageName}`;
      break;

    case 'npm':
      if (options.global) {
        command = `npm install -g ${packageName}`;
      } else {
        command = `npm install ${packageName}`;
      }
      break;

    case 'pip':
      const pip = shell.commandExists('pip3') ? 'pip3' : 'pip';
      if (options.global) {
        command = `${pip} install ${packageName}`;
      } else {
        command = `${pip} install --user ${packageName}`;
      }
      break;

    default:
      return {
        success: false,
        output: `Unknown package manager: ${manager}`
      };
  }

  const result = await shell.exec(command);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Uninstalls a package
 * @param {string} packageName - The package to uninstall
 * @param {Object} [options] - Uninstallation options
 * @param {string} [options.manager] - Force a specific package manager
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function uninstall(packageName, options = {}) {
  const manager = options.manager || getPreferred();

  if (!manager) {
    return {
      success: false,
      output: 'No package manager available'
    };
  }

  let command;

  switch (manager) {
    case 'brew':
      command = `brew uninstall ${packageName}`;
      break;

    case 'apt':
      command = `sudo apt-get remove -y ${packageName}`;
      break;

    case 'snap':
      command = `sudo snap remove ${packageName}`;
      break;

    case 'dnf':
      command = `sudo dnf remove -y ${packageName}`;
      break;

    case 'yum':
      command = `sudo yum remove -y ${packageName}`;
      break;

    case 'winget':
      command = `winget uninstall ${packageName}`;
      break;

    case 'choco':
      command = `choco uninstall -y ${packageName}`;
      break;

    default:
      return {
        success: false,
        output: `Unknown package manager: ${manager}`
      };
  }

  const result = await shell.exec(command);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Updates package lists
 * @param {string} [manager] - Specific package manager to update
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function update(manager) {
  const pm = manager || getPreferred();

  let command;

  switch (pm) {
    case 'brew':
      command = 'brew update';
      break;

    case 'apt':
      command = 'sudo apt-get update';
      break;

    case 'dnf':
      command = 'sudo dnf check-update';
      break;

    case 'yum':
      command = 'sudo yum check-update';
      break;

    case 'choco':
      command = 'choco upgrade chocolatey -y';
      break;

    default:
      return {
        success: false,
        output: `Update not supported for: ${pm}`
      };
  }

  const result = await shell.exec(command);
  // dnf/yum check-update returns 100 if updates are available, not an error
  const success = result.code === 0 || (pm === 'dnf' || pm === 'yum') && result.code === 100;
  return {
    success,
    output: result.stdout || result.stderr
  };
}

module.exports = {
  getAvailable,
  getPreferred,
  install,
  uninstall,
  update
};
