#!/usr/bin/env node

/**
 * Windows Environment Variables Utilities
 *
 * Windows-specific utilities for managing environment variables.
 */

const shell = require('../common/shell');
const path = require('path');

/**
 * Returns the system PATH as an array
 * @returns {string[]}
 */
function getPath() {
  const pathEnv = process.env.PATH || process.env.Path || '';
  return pathEnv.split(';').filter(Boolean);
}

/**
 * Adds a directory to the user PATH
 * Note: Changes take effect in new processes, not the current one
 * @param {string} directory - The directory to add to PATH
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function addToPath(directory) {
  // Normalize the path
  const normalizedDir = path.resolve(directory);

  // Check if already in PATH
  const currentPath = getPath();
  if (currentPath.some((p) => path.resolve(p).toLowerCase() === normalizedDir.toLowerCase())) {
    return {
      success: true,
      output: 'Directory is already in PATH'
    };
  }

  // Use PowerShell to modify user PATH
  const command = `
    $currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $newPath = "$currentPath;${normalizedDir}"
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
  `.replace(/\n/g, ' ');

  const result = await shell.exec(`powershell -NoProfile -Command "${command}"`);
  return {
    success: result.code === 0,
    output: result.code === 0
      ? `Added ${normalizedDir} to user PATH. Restart your terminal for changes to take effect.`
      : result.stderr
  };
}

/**
 * Removes a directory from the user PATH
 * @param {string} directory - The directory to remove from PATH
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function removeFromPath(directory) {
  const normalizedDir = path.resolve(directory);

  // Use PowerShell to modify user PATH
  const command = `
    $currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $paths = $currentPath -split ';' | Where-Object { $_.Trim() -ne '' -and [System.IO.Path]::GetFullPath($_).ToLower() -ne '${normalizedDir.toLowerCase().replace(/\\/g, '\\\\')}' }
    $newPath = $paths -join ';'
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
  `.replace(/\n/g, ' ');

  const result = await shell.exec(`powershell -NoProfile -Command "${command}"`);
  return {
    success: result.code === 0,
    output: result.code === 0
      ? `Removed ${normalizedDir} from user PATH. Restart your terminal for changes to take effect.`
      : result.stderr
  };
}

/**
 * Gets an environment variable value
 * @param {string} varName - The variable name
 * @param {'User'|'Machine'|'Process'} [scope='Process'] - The scope to check
 * @returns {Promise<string|null>}
 */
async function get(varName, scope = 'Process') {
  if (scope === 'Process') {
    return process.env[varName] || null;
  }

  const command = `[Environment]::GetEnvironmentVariable('${varName}', '${scope}')`;
  const result = await shell.exec(`powershell -NoProfile -Command "${command}"`);

  if (result.code === 0 && result.stdout.trim()) {
    return result.stdout.trim();
  }
  return null;
}

/**
 * Sets a user environment variable
 * @param {string} varName - The variable name
 * @param {string} value - The value to set
 * @param {'User'|'Machine'} [scope='User'] - The scope (Machine requires admin)
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function set(varName, value, scope = 'User') {
  const command = `[Environment]::SetEnvironmentVariable('${varName}', '${value}', '${scope}')`;
  const result = await shell.exec(`powershell -NoProfile -Command "${command}"`);

  return {
    success: result.code === 0,
    output: result.code === 0
      ? `Set ${varName}=${value} in ${scope} scope. Restart your terminal for changes to take effect.`
      : result.stderr
  };
}

/**
 * Removes a user environment variable
 * @param {string} varName - The variable name
 * @param {'User'|'Machine'} [scope='User'] - The scope
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function remove(varName, scope = 'User') {
  const command = `[Environment]::SetEnvironmentVariable('${varName}', $null, '${scope}')`;
  const result = await shell.exec(`powershell -NoProfile -Command "${command}"`);

  return {
    success: result.code === 0,
    output: result.code === 0
      ? `Removed ${varName} from ${scope} scope. Restart your terminal for changes to take effect.`
      : result.stderr
  };
}

/**
 * Gets all user environment variables
 * @returns {Promise<Object<string, string>>}
 */
async function getUserVariables() {
  const command = '[Environment]::GetEnvironmentVariables("User") | ConvertTo-Json';
  const result = await shell.exec(`powershell -NoProfile -Command "${command}"`);

  if (result.code === 0 && result.stdout.trim()) {
    try {
      return JSON.parse(result.stdout);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Gets all machine (system) environment variables
 * @returns {Promise<Object<string, string>>}
 */
async function getMachineVariables() {
  const command = '[Environment]::GetEnvironmentVariables("Machine") | ConvertTo-Json';
  const result = await shell.exec(`powershell -NoProfile -Command "${command}"`);

  if (result.code === 0 && result.stdout.trim()) {
    try {
      return JSON.parse(result.stdout);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Expands environment variables in a string
 * @param {string} str - The string containing variables like %VAR%
 * @returns {string}
 */
function expand(str) {
  return str.replace(/%([^%]+)%/g, (_, varName) => {
    return process.env[varName] || `%${varName}%`;
  });
}

/**
 * Broadcasts a WM_SETTINGCHANGE message to notify other applications
 * of environment variable changes
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function broadcastChange() {
  const command = `
    Add-Type -TypeDefinition @"
    using System;
    using System.Runtime.InteropServices;
    public class Win32 {
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern IntPtr SendMessageTimeout(
            IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam,
            uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);
    }
"@
    $HWND_BROADCAST = [IntPtr]0xffff
    $WM_SETTINGCHANGE = 0x1a
    $result = [UIntPtr]::Zero
    [Win32]::SendMessageTimeout($HWND_BROADCAST, $WM_SETTINGCHANGE, [UIntPtr]::Zero, "Environment", 2, 5000, [ref]$result)
  `.replace(/\n/g, ' ');

  const result = await shell.exec(`powershell -NoProfile -Command "${command}"`);
  return {
    success: result.code === 0,
    output: result.code === 0
      ? 'Broadcasted environment change notification'
      : result.stderr
  };
}

/**
 * Refreshes the current process's environment from the registry
 * Note: This only affects the current Node.js process
 * @returns {Promise<void>}
 */
async function refresh() {
  // Get updated PATH from both User and Machine scopes
  const userPath = await get('Path', 'User');
  const machinePath = await get('Path', 'Machine');

  if (userPath || machinePath) {
    const combined = [machinePath, userPath].filter(Boolean).join(';');
    process.env.PATH = combined;
    process.env.Path = combined;
  }
}

module.exports = {
  getPath,
  addToPath,
  removeFromPath,
  get,
  set,
  remove,
  getUserVariables,
  getMachineVariables,
  expand,
  broadcastChange,
  refresh
};
