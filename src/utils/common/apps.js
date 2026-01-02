#!/usr/bin/env node

/**
 * Generic Application Detection Utilities
 *
 * Cross-platform utilities for detecting installed applications.
 * Delegates to OS-specific implementations for actual detection.
 */

const osUtils = require('./os');
const shell = require('./shell');

/**
 * Cross-platform check if an application is installed
 * Delegates to OS-specific implementations
 * @param {string} appName - The application name to check
 * @returns {Promise<boolean>}
 */
async function isInstalled(appName) {
  const platform = osUtils.detect();

  switch (platform.type) {
    case 'macos': {
      const macosApps = require('../macos/apps');
      return macosApps.isAppInstalled(appName);
    }
    case 'ubuntu':
    case 'debian':
    case 'raspbian': {
      const apt = require('../ubuntu/apt');
      const snap = require('../ubuntu/snap');
      // Check both apt and snap
      const aptInstalled = await apt.isPackageInstalled(appName);
      if (aptInstalled) return true;
      const snapInstalled = await snap.isSnapInstalled(appName);
      return snapInstalled;
    }
    case 'windows': {
      const registry = require('../windows/registry');
      return registry.isAppInstalled(appName);
    }
    default:
      // Fallback: check if command exists in PATH
      return shell.commandExists(appName);
  }
}

/**
 * Retrieves the installed version of an application
 * @param {string} appName - The application name
 * @returns {Promise<string|null>}
 */
async function getVersion(appName) {
  const platform = osUtils.detect();

  switch (platform.type) {
    case 'macos': {
      const macosApps = require('../macos/apps');
      return macosApps.getAppVersion(appName);
    }
    case 'ubuntu':
    case 'debian':
    case 'raspbian': {
      const apt = require('../ubuntu/apt');
      const snap = require('../ubuntu/snap');
      // Check apt first
      const aptVersion = await apt.getPackageVersion(appName);
      if (aptVersion) return aptVersion;
      // Then snap
      const snapVersion = await snap.getSnapVersion(appName);
      return snapVersion;
    }
    case 'windows': {
      const registry = require('../windows/registry');
      return registry.getAppVersion(appName);
    }
    default:
      // Fallback: try running appName --version
      return getVersionFromCommand(appName);
  }
}

/**
 * Returns the installation path of an application
 * @param {string} appName - The application name
 * @returns {Promise<string|null>}
 */
async function getInstallPath(appName) {
  const platform = osUtils.detect();

  switch (platform.type) {
    case 'macos': {
      const macosApps = require('../macos/apps');
      return macosApps.getAppBundlePath(appName);
    }
    case 'windows': {
      const registry = require('../windows/registry');
      return registry.getInstallPath(appName);
    }
    default:
      // Fallback: try to find the executable
      return shell.which(appName);
  }
}

/**
 * Tries to get version by running the command with --version flag
 * @param {string} command - The command to check
 * @returns {Promise<string|null>}
 */
async function getVersionFromCommand(command) {
  const versionFlags = ['--version', '-v', '-V', 'version'];

  for (const flag of versionFlags) {
    const result = await shell.exec(`${command} ${flag}`);
    if (result.code === 0 && result.stdout) {
      // Try to extract version number from output
      const versionMatch = result.stdout.match(/(\d+\.\d+\.?\d*)/);
      if (versionMatch) {
        return versionMatch[1];
      }
    }
  }

  return null;
}

/**
 * Checks if a command-line tool is available
 * @param {string} command - The command to check
 * @returns {boolean}
 */
function isCommandAvailable(command) {
  return shell.commandExists(command);
}

module.exports = {
  isInstalled,
  getVersion,
  getInstallPath,
  getVersionFromCommand,
  isCommandAvailable
};
