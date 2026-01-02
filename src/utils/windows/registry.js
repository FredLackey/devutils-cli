#!/usr/bin/env node

/**
 * Windows Registry Access Utilities
 *
 * Windows-specific utilities for reading the Windows registry.
 * Used for detecting installed applications and their properties.
 */

const shell = require('../common/shell');

/**
 * Common registry paths for installed applications
 */
const UNINSTALL_PATHS = [
  'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
];

/**
 * Checks Windows registry uninstall keys for an application
 * @param {string} appName - The application name to check
 * @returns {Promise<boolean>}
 */
async function isAppInstalled(appName) {
  const appInfo = await findAppInRegistry(appName);
  return appInfo !== null;
}

/**
 * Retrieves installation path from registry
 * @param {string} appName - The application name
 * @returns {Promise<string|null>}
 */
async function getInstallPath(appName) {
  const appInfo = await findAppInRegistry(appName);
  return appInfo ? appInfo.installLocation : null;
}

/**
 * Retrieves version from registry
 * @param {string} appName - The application name
 * @returns {Promise<string|null>}
 */
async function getAppVersion(appName) {
  const appInfo = await findAppInRegistry(appName);
  return appInfo ? appInfo.version : null;
}

/**
 * Finds an application in the registry and returns its info
 * @param {string} appName - The application name to find
 * @returns {Promise<{ displayName: string, version: string, installLocation: string, publisher: string }|null>}
 */
async function findAppInRegistry(appName) {
  const normalizedName = appName.toLowerCase();

  for (const basePath of UNINSTALL_PATHS) {
    // List all subkeys
    const listResult = await shell.exec(
      `reg query "${basePath}" 2>nul`
    );

    if (listResult.code !== 0) {
      continue;
    }

    const subkeys = listResult.stdout
      .split('\n')
      .filter((line) => line.trim().startsWith(basePath))
      .map((line) => line.trim());

    for (const subkey of subkeys) {
      const displayName = await getValue(subkey, 'DisplayName');
      if (!displayName) continue;

      // Check if this is the app we're looking for
      if (displayName.toLowerCase().includes(normalizedName)) {
        return {
          displayName,
          version: await getValue(subkey, 'DisplayVersion'),
          installLocation: await getValue(subkey, 'InstallLocation'),
          publisher: await getValue(subkey, 'Publisher')
        };
      }
    }
  }

  return null;
}

/**
 * Checks if a registry key exists
 * @param {string} keyPath - The full registry key path
 * @returns {Promise<boolean>}
 */
async function keyExists(keyPath) {
  const result = await shell.exec(`reg query "${keyPath}" 2>nul`);
  return result.code === 0;
}

/**
 * Reads a value from the registry
 * @param {string} keyPath - The full registry key path
 * @param {string} valueName - The value name to read
 * @returns {Promise<string|null>}
 */
async function getValue(keyPath, valueName) {
  const result = await shell.exec(
    `reg query "${keyPath}" /v "${valueName}" 2>nul`
  );

  if (result.code !== 0) {
    return null;
  }

  // Parse the output
  // Format: "    ValueName    REG_SZ    Value"
  const lines = result.stdout.split('\n');
  for (const line of lines) {
    if (line.includes(valueName)) {
      // Split by registry type (REG_SZ, REG_DWORD, etc.)
      const match = line.match(/REG_\w+\s+(.+)$/);
      if (match) {
        return match[1].trim();
      }
    }
  }

  return null;
}

/**
 * Lists all values in a registry key
 * @param {string} keyPath - The full registry key path
 * @returns {Promise<Array<{ name: string, type: string, value: string }>>}
 */
async function listValues(keyPath) {
  const result = await shell.exec(`reg query "${keyPath}" 2>nul`);

  if (result.code !== 0) {
    return [];
  }

  const values = [];
  const lines = result.stdout.split('\n');

  for (const line of lines) {
    // Skip empty lines and the key path line
    if (!line.trim() || line.trim().startsWith('HK')) {
      continue;
    }

    // Parse "    Name    REG_TYPE    Value"
    const match = line.match(/^\s+(\S+)\s+(REG_\w+)\s+(.*)$/);
    if (match) {
      values.push({
        name: match[1],
        type: match[2],
        value: match[3].trim()
      });
    }
  }

  return values;
}

/**
 * Lists all subkeys of a registry key
 * @param {string} keyPath - The full registry key path
 * @returns {Promise<string[]>}
 */
async function listSubkeys(keyPath) {
  const result = await shell.exec(`reg query "${keyPath}" 2>nul`);

  if (result.code !== 0) {
    return [];
  }

  return result.stdout
    .split('\n')
    .filter((line) => line.trim().startsWith('HK'))
    .map((line) => line.trim())
    .filter((line) => line !== keyPath);
}

/**
 * Gets all installed applications from the registry
 * @returns {Promise<Array<{ name: string, version: string, publisher: string, installLocation: string }>>}
 */
async function listInstalledApps() {
  const apps = [];

  for (const basePath of UNINSTALL_PATHS) {
    const subkeys = await listSubkeys(basePath);

    for (const subkey of subkeys) {
      const displayName = await getValue(subkey, 'DisplayName');
      if (!displayName) continue;

      // Skip system components and updates
      const systemComponent = await getValue(subkey, 'SystemComponent');
      if (systemComponent === '1') continue;

      apps.push({
        name: displayName,
        version: await getValue(subkey, 'DisplayVersion') || '',
        publisher: await getValue(subkey, 'Publisher') || '',
        installLocation: await getValue(subkey, 'InstallLocation') || ''
      });
    }
  }

  // Remove duplicates by name
  const seen = new Set();
  return apps.filter((app) => {
    if (seen.has(app.name)) {
      return false;
    }
    seen.add(app.name);
    return true;
  });
}

/**
 * Gets the uninstall command for an application
 * @param {string} appName - The application name
 * @returns {Promise<string|null>}
 */
async function getUninstallCommand(appName) {
  const normalizedName = appName.toLowerCase();

  for (const basePath of UNINSTALL_PATHS) {
    const subkeys = await listSubkeys(basePath);

    for (const subkey of subkeys) {
      const displayName = await getValue(subkey, 'DisplayName');
      if (!displayName) continue;

      if (displayName.toLowerCase().includes(normalizedName)) {
        // Try QuietUninstallString first (silent uninstall)
        const quietUninstall = await getValue(subkey, 'QuietUninstallString');
        if (quietUninstall) {
          return quietUninstall;
        }

        // Fall back to UninstallString
        const uninstall = await getValue(subkey, 'UninstallString');
        return uninstall;
      }
    }
  }

  return null;
}

module.exports = {
  isAppInstalled,
  getInstallPath,
  getAppVersion,
  findAppInRegistry,
  keyExists,
  getValue,
  listValues,
  listSubkeys,
  listInstalledApps,
  getUninstallCommand
};
