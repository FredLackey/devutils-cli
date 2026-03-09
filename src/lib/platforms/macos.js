'use strict';

const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

/**
 * Platform name identifier.
 * @type {string}
 */
const name = 'macos';

/**
 * Default package manager for macOS.
 * @type {string}
 */
const packageManager = 'brew';

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
 * Returns common application directories for macOS.
 * @returns {string[]} Array of directory paths where applications are typically installed.
 */
function getAppPaths() {
  return [
    '/Applications',
    '/usr/local/bin',
    path.join(os.homedir(), 'Applications'),
  ];
}

module.exports = { name, packageManager, isInstalled, getAppPaths };
