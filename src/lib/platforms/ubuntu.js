'use strict';

const { execFileSync } = require('child_process');

/**
 * Platform name identifier.
 * @type {string}
 */
const name = 'ubuntu';

/**
 * Default package manager for Ubuntu.
 * @type {string}
 */
const packageManager = 'apt';

/**
 * Checks if a binary is available on the system PATH.
 * @param {string} binary - The name of the binary to look for (e.g. 'node', 'git').
 * @returns {boolean} True if the binary exists on the PATH, false otherwise.
 */
function isInstalled(binary) {
  try {
    execFileSync('which', [binary], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns common application directories for Ubuntu.
 * @returns {string[]} Array of directory paths where applications are typically installed.
 */
function getAppPaths() {
  return ['/usr/bin', '/usr/local/bin', '/snap/bin'];
}

module.exports = { name, packageManager, isInstalled, getAppPaths };
