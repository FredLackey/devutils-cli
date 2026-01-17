#!/usr/bin/env node

/**
 * @fileoverview Version command - Display current version and check for updates.
 * Queries the NPM registry to determine if a newer version is available.
 */

const { Command } = require('commander');
const { execSync } = require('child_process');
const pkg = require('../../package.json');

/**
 * The name of this package on NPM
 */
const PACKAGE_NAME = pkg.name;

/**
 * Get the latest version of this package from the NPM registry
 * @returns {string|null} The latest version string, or null if unable to fetch
 */
function getLatestVersion() {
  try {
    const result = execSync(`npm view ${PACKAGE_NAME} version`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result.trim();
  } catch {
    return null;
  }
}

/**
 * Compare two semantic version strings
 * @param {string} current - Current version (e.g., "1.2.3")
 * @param {string} latest - Latest version (e.g., "1.2.4")
 * @returns {boolean} True if latest is newer than current
 */
function isNewerVersion(current, latest) {
  if (!current || !latest) {
    return false;
  }

  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) {
      return true;
    }
    if (latestPart < currentPart) {
      return false;
    }
  }

  return false;
}

/**
 * Display version information and check for updates
 * @param {object} options - Command options
 */
async function runVersion(options) {
  const currentVersion = pkg.version;

  console.log(`\n${pkg.name}`);
  console.log('─'.repeat(40));
  console.log(`Current version: ${currentVersion}`);

  // Check for updates
  console.log('\nChecking for updates...');
  const latestVersion = getLatestVersion();

  if (!latestVersion) {
    console.log('Unable to check for updates (NPM registry unreachable)');
    console.log('');
    return;
  }

  if (isNewerVersion(currentVersion, latestVersion)) {
    console.log(`\nUpdate available: ${currentVersion} -> ${latestVersion}`);
    console.log('\nTo update, run:');
    console.log('  dev update');
    console.log('');
  } else {
    console.log(`Latest version:  ${latestVersion}`);
    console.log('\nYou are running the latest version.');
    console.log('');
  }
}

// Create and configure the command
const version = new Command('version')
  .description('Display current version and check for updates')
  .action(runVersion);

module.exports = version;
