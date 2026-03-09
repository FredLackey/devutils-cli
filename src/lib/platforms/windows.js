'use strict';

const { execFileSync } = require('child_process');

/**
 * Platform name identifier.
 * @type {string}
 */
const name = 'windows';

/**
 * Default package manager for Windows.
 * @type {string}
 */
const packageManager = 'choco';

/**
 * Checks if a binary is available on the system PATH.
 * Windows uses "where" instead of "which" for binary lookup.
 * @param {string} binary - The name of the binary to look for (e.g. 'node', 'git').
 * @returns {boolean} True if the binary exists on the PATH, false otherwise.
 */
function isInstalled(binary) {
  try {
    execFileSync('where', [binary], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns common application directories for Windows.
 * Filters out undefined entries in case environment variables aren't set.
 * @returns {string[]} Array of directory paths where applications are typically installed.
 */
function getAppPaths() {
  return [
    process.env.ProgramFiles,
    process.env['ProgramFiles(x86)'],
    process.env.LOCALAPPDATA,
  ].filter(Boolean);
}

module.exports = { name, packageManager, isInstalled, getAppPaths };
