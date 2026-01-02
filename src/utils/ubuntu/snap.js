#!/usr/bin/env node

/**
 * Snap Package Manager Utilities
 *
 * Ubuntu-specific utilities for interacting with Snap packages.
 */

const shell = require('../common/shell');

/**
 * Checks if snapd is installed and running
 * @returns {boolean}
 */
function isInstalled() {
  return shell.commandExists('snap');
}

/**
 * Installs a snap package
 * @param {string} snapName - The snap name to install
 * @param {Object} [options] - Installation options
 * @param {boolean} [options.classic=false] - Use classic confinement
 * @param {string} [options.channel] - The channel to install from (stable, edge, etc.)
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function install(snapName, options = {}) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'snap is not available'
    };
  }

  let command = `sudo snap install ${snapName}`;

  if (options.classic) {
    command += ' --classic';
  }

  if (options.channel) {
    command += ` --channel=${options.channel}`;
  }

  const result = await shell.exec(command);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Removes an installed snap
 * @param {string} snapName - The snap name to remove
 * @param {Object} [options] - Removal options
 * @param {boolean} [options.purge=false] - Remove all data
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function remove(snapName, options = {}) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'snap is not available'
    };
  }

  let command = `sudo snap remove ${snapName}`;

  if (options.purge) {
    command += ' --purge';
  }

  const result = await shell.exec(command);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Checks if a specific snap is installed
 * @param {string} snapName - The snap name to check
 * @returns {Promise<boolean>}
 */
async function isSnapInstalled(snapName) {
  if (!isInstalled()) {
    return false;
  }

  const result = await shell.exec(`snap list ${snapName} 2>/dev/null`);
  return result.code === 0;
}

/**
 * Returns the installed version of a snap
 * @param {string} snapName - The snap name
 * @returns {Promise<string|null>}
 */
async function getSnapVersion(snapName) {
  if (!isInstalled()) {
    return null;
  }

  const result = await shell.exec(`snap list ${snapName} 2>/dev/null`);
  if (result.code !== 0) {
    return null;
  }

  // Output format:
  // Name    Version   Rev    Tracking       Publisher   Notes
  // code    1.85.0    151    latest/stable  vscode      classic
  const lines = result.stdout.split('\n').filter(Boolean);
  if (lines.length >= 2) {
    const parts = lines[1].split(/\s+/);
    if (parts.length >= 2) {
      return parts[1]; // Version is the second column
    }
  }

  return null;
}

/**
 * Updates a snap to the latest version
 * @param {string} [snapName] - The snap to refresh (all if omitted)
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function refresh(snapName) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'snap is not available'
    };
  }

  const command = snapName ? `sudo snap refresh ${snapName}` : 'sudo snap refresh';
  const result = await shell.exec(command);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Lists all installed snaps
 * @returns {Promise<Array<{ name: string, version: string, rev: string, tracking: string }>>}
 */
async function list() {
  if (!isInstalled()) {
    return [];
  }

  const result = await shell.exec('snap list');
  if (result.code !== 0) {
    return [];
  }

  const lines = result.stdout.split('\n').filter(Boolean);
  // Skip header line
  if (lines.length <= 1) {
    return [];
  }

  return lines.slice(1).map((line) => {
    const parts = line.split(/\s+/);
    return {
      name: parts[0] || '',
      version: parts[1] || '',
      rev: parts[2] || '',
      tracking: parts[3] || ''
    };
  });
}

/**
 * Searches for snaps in the store
 * @param {string} query - The search query
 * @returns {Promise<Array<{ name: string, version: string, publisher: string, summary: string }>>}
 */
async function search(query) {
  if (!isInstalled()) {
    return [];
  }

  const result = await shell.exec(`snap find "${query}"`);
  if (result.code !== 0) {
    return [];
  }

  const lines = result.stdout.split('\n').filter(Boolean);
  // Skip header line
  if (lines.length <= 1) {
    return [];
  }

  return lines.slice(1).map((line) => {
    const parts = line.split(/\s+/);
    return {
      name: parts[0] || '',
      version: parts[1] || '',
      publisher: parts[2] || '',
      summary: parts.slice(3).join(' ') || ''
    };
  });
}

/**
 * Gets detailed information about a snap
 * @param {string} snapName - The snap name
 * @returns {Promise<string|null>}
 */
async function info(snapName) {
  if (!isInstalled()) {
    return null;
  }

  const result = await shell.exec(`snap info ${snapName}`);
  if (result.code === 0) {
    return result.stdout;
  }
  return null;
}

/**
 * Enables a disabled snap
 * @param {string} snapName - The snap name
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function enable(snapName) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'snap is not available'
    };
  }

  const result = await shell.exec(`sudo snap enable ${snapName}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Disables a snap without removing it
 * @param {string} snapName - The snap name
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function disable(snapName) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'snap is not available'
    };
  }

  const result = await shell.exec(`sudo snap disable ${snapName}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Connects a snap interface
 * @param {string} plug - The plug (e.g., 'snap-name:plug-name')
 * @param {string} [slot] - The slot to connect to
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function connect(plug, slot) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'snap is not available'
    };
  }

  const command = slot
    ? `sudo snap connect ${plug} ${slot}`
    : `sudo snap connect ${plug}`;

  const result = await shell.exec(command);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

module.exports = {
  isInstalled,
  install,
  remove,
  isSnapInstalled,
  getSnapVersion,
  refresh,
  list,
  search,
  info,
  enable,
  disable,
  connect
};
