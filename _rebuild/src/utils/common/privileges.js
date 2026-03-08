#!/usr/bin/env node

/**
 * Permission and Elevation Checking Utilities
 *
 * Platform-agnostic utilities for checking elevated privileges.
 * Handles root on Unix and Administrator on Windows internally.
 */

const os = require('os');

/**
 * Checks if running with elevated privileges
 * On Unix: checks if running as root (uid 0)
 * On Windows: checks if running as Administrator
 * @returns {boolean}
 */
function isElevated() {
  if (process.platform === 'win32') {
    return isWindowsAdmin();
  }
  return isUnixRoot();
}

/**
 * Checks if running as root on Unix systems
 * @returns {boolean}
 */
function isUnixRoot() {
  if (process.platform === 'win32') {
    return false;
  }
  return process.getuid && process.getuid() === 0;
}

/**
 * Checks if running as Administrator on Windows
 * Uses a heuristic since Node.js doesn't have direct API for this
 * @returns {boolean}
 */
function isWindowsAdmin() {
  if (process.platform !== 'win32') {
    return false;
  }

  // Method 1: Try to read a system-protected location
  const fs = require('fs');
  try {
    // Try to list the Windows system config directory
    // Only administrators can access this
    fs.readdirSync('C:\\Windows\\System32\\config');
    return true;
  } catch {
    // Not admin or access denied
  }

  // Method 2: Check for common admin environment indicators
  // This is less reliable but can be a fallback
  if (process.env.ADMIN_MODE === 'true') {
    return true;
  }

  return false;
}

/**
 * Determines if a given operation type requires elevation
 * @param {string} operation - The operation type
 * @returns {boolean}
 */
function requiresElevation(operation) {
  const elevatedOperations = [
    'install_system_package',
    'modify_system_config',
    'start_system_service',
    'modify_hosts_file',
    'install_global_npm',
    'modify_registry',
    'add_apt_repository',
    'enable_systemd_service'
  ];

  return elevatedOperations.includes(operation);
}

/**
 * Gets the username of the current user
 * @returns {string}
 */
function getCurrentUser() {
  return os.userInfo().username;
}

/**
 * Checks if the current user can write to a directory
 * @param {string} dirPath - The directory path to check
 * @returns {boolean}
 */
function canWriteToDirectory(dirPath) {
  const fs = require('fs');
  const path = require('path');

  try {
    // Try to create a temporary file
    const testFile = path.join(dirPath, `.write-test-${Date.now()}`);
    fs.writeFileSync(testFile, '');
    fs.unlinkSync(testFile);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if the current user can execute a file
 * @param {string} filePath - The file path to check
 * @returns {boolean}
 */
function canExecute(filePath) {
  const fs = require('fs');

  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  isElevated,
  isUnixRoot,
  isWindowsAdmin,
  requiresElevation,
  getCurrentUser,
  canWriteToDirectory,
  canExecute
};
