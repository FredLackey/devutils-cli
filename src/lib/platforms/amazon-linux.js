'use strict';

const fs = require('fs');
const { execFileSync } = require('child_process');

/**
 * Platform name identifier.
 * @type {string}
 */
const name = 'amazon-linux';

/**
 * Default package manager for Amazon Linux.
 * Uses dnf on newer versions (AL2023+), falls back to yum on older versions.
 * @type {string}
 */
const packageManager = fs.existsSync('/usr/bin/dnf') ? 'dnf' : 'yum';

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
 * Returns common application directories for Amazon Linux.
 * @returns {string[]} Array of directory paths where applications are typically installed.
 */
function getAppPaths() {
  return ['/usr/bin', '/usr/local/bin'];
}

module.exports = { name, packageManager, isInstalled, getAppPaths };
