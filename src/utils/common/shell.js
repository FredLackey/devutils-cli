#!/usr/bin/env node

/**
 * Shell Command Execution Utilities
 *
 * Platform-agnostic utilities for executing shell commands. Uses Node.js
 * child_process APIs that work identically on all platforms. Note that while
 * these utilities are cross-platform, the commands passed to them may be
 * platform-specific.
 */

const { exec: cpExec, execSync: cpExecSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Executes a shell command asynchronously
 * @param {string} command - The command to execute
 * @param {Object} [options] - Options for child_process.exec
 * @param {string} [options.cwd] - Working directory
 * @param {Object} [options.env] - Environment variables
 * @param {number} [options.timeout] - Timeout in milliseconds
 * @param {string} [options.encoding] - Output encoding (default: 'utf8')
 * @returns {Promise<{ stdout: string, stderr: string, code: number }>}
 */
async function exec(command, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      encoding: options.encoding || 'utf8',
      cwd: options.cwd,
      env: options.env || process.env,
      timeout: options.timeout,
      maxBuffer: options.maxBuffer || 10 * 1024 * 1024 // 10MB default
    };

    cpExec(command, opts, (error, stdout, stderr) => {
      if (error) {
        resolve({
          stdout: stdout || '',
          stderr: stderr || error.message,
          code: error.code || 1
        });
      } else {
        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          code: 0
        });
      }
    });
  });
}

/**
 * Executes a shell command synchronously
 * @param {string} command - The command to execute
 * @param {Object} [options] - Options for child_process.execSync
 * @param {string} [options.cwd] - Working directory
 * @param {Object} [options.env] - Environment variables
 * @param {number} [options.timeout] - Timeout in milliseconds
 * @param {string} [options.encoding] - Output encoding (default: 'utf8')
 * @returns {string} - stdout as string, or empty string on error
 */
function execSync(command, options = {}) {
  try {
    const opts = {
      encoding: options.encoding || 'utf8',
      cwd: options.cwd,
      env: options.env || process.env,
      timeout: options.timeout,
      maxBuffer: options.maxBuffer || 10 * 1024 * 1024, // 10MB default
      stdio: ['pipe', 'pipe', 'pipe']
    };

    return cpExecSync(command, opts).toString().trim();
  } catch (err) {
    return '';
  }
}

/**
 * Locates an executable in PATH (pure Node.js implementation)
 * @param {string} executable - The executable name to find
 * @returns {string|null} - Full path to executable, or null if not found
 */
function which(executable) {
  const isWindows = process.platform === 'win32';
  const pathSeparator = isWindows ? ';' : ':';
  const pathEnv = process.env.PATH || '';
  const paths = pathEnv.split(pathSeparator);

  // On Windows, also check PATHEXT for executable extensions
  const pathExt = isWindows
    ? (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';')
    : [''];

  for (const dir of paths) {
    if (!dir) continue;

    for (const ext of pathExt) {
      const fullPath = path.join(dir, executable + ext);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          // On Unix, check if file is executable
          if (!isWindows) {
            try {
              fs.accessSync(fullPath, fs.constants.X_OK);
              return fullPath;
            } catch {
              continue;
            }
          }
          return fullPath;
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

/**
 * Checks if a command is available in PATH
 * @param {string} command - The command to check
 * @returns {boolean}
 */
function commandExists(command) {
  return which(command) !== null;
}

/**
 * Spawns a process with streaming output
 * @param {string} command - The command to run
 * @param {string[]} [args] - Arguments array
 * @param {Object} [options] - Spawn options
 * @returns {Promise<{ stdout: string, stderr: string, code: number }>}
 */
async function spawnAsync(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      cwd: options.cwd,
      env: options.env || process.env,
      shell: options.shell !== false
    };

    const child = spawn(command, args, opts);
    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (options.onStdout) {
          options.onStdout(data.toString());
        }
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
        if (options.onStderr) {
          options.onStderr(data.toString());
        }
      });
    }

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        code: code || 0
      });
    });

    child.on('error', (err) => {
      resolve({
        stdout,
        stderr: stderr || err.message,
        code: 1
      });
    });
  });
}

module.exports = {
  exec,
  execSync,
  which,
  commandExists,
  spawnAsync
};
