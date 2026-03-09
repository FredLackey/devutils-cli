'use strict';

const { exec: cpExec, execSync: cpExecSync } = require('child_process');

/**
 * Runs a shell command asynchronously.
 * Always resolves (never rejects). The caller checks exitCode to determine success.
 *
 * @param {string} cmd - The command to run.
 * @param {object} [opts] - Options passed through to child_process.exec (cwd, env, timeout, etc.).
 * @returns {Promise<{ stdout: string, stderr: string, exitCode: number }>}
 */
async function exec(cmd, opts = {}) {
  return new Promise((resolve) => {
    cpExec(cmd, opts, (error, stdout, stderr) => {
      resolve({
        stdout: stdout ? stdout.toString().trim() : '',
        stderr: stderr ? stderr.toString().trim() : '',
        exitCode: error ? error.code || 1 : 0,
      });
    });
  });
}

/**
 * Runs a shell command synchronously.
 * Returns the trimmed stdout string on success, or null on failure.
 *
 * An empty string means "command ran but produced no output."
 * Null means "command failed."
 *
 * @param {string} cmd - The command to run.
 * @param {object} [opts] - Options passed through to child_process.execSync.
 * @returns {string|null}
 */
function execSync(cmd, opts = {}) {
  try {
    const result = cpExecSync(cmd, { ...opts, encoding: 'utf8' });
    return result ? result.trim() : '';
  } catch {
    return null;
  }
}

/**
 * Finds the full path to a binary on the system PATH.
 * Uses "which" on unix-like systems and "where" on native Windows.
 * Git Bash provides its own "which", so it uses the unix path.
 *
 * @param {string} binary - The name of the binary to find (e.g. 'node', 'git').
 * @returns {string|null} The full path to the binary, or null if not found.
 */
function which(binary) {
  const platform = require('./platform').detect();
  const cmd = platform.type === 'windows' ? `where ${binary}` : `which ${binary}`;
  const result = execSync(cmd);
  if (result === null) {
    return null;
  }
  // 'where' on Windows can return multiple lines; take the first one
  return result.split('\n')[0].trim();
}

/**
 * Checks if a binary exists on the system PATH.
 * A boolean wrapper around which().
 *
 * @param {string} binary - The name of the binary to check.
 * @returns {boolean} True if the binary exists, false otherwise.
 */
function commandExists(binary) {
  return which(binary) !== null;
}

module.exports = { exec, execSync, which, commandExists };
