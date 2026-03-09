'use strict';

const { execFileSync } = require('child_process');

/**
 * Platform name identifier.
 * @type {string}
 */
const name = 'gitbash';

/**
 * Package manager for Git Bash.
 * Git Bash doesn't have its own package manager, so this is 'manual'.
 * @type {string}
 */
const packageManager = 'manual';

/**
 * Checks if a binary is available on the system PATH.
 * Git Bash provides a "which" command, so we use that instead of "where".
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
 * Returns common application directories for Git Bash.
 * Git Bash runs on top of Windows, so the paths are the same as Windows.
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
