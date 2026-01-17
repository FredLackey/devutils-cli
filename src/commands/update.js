#!/usr/bin/env node

/**
 * @fileoverview Update command - Update this package to the latest version.
 * Queries the NPM registry and installs the latest version globally.
 */

const { Command } = require('commander');
const { execSync, spawn } = require('child_process');
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
 * Install the latest version of this package globally
 * @returns {Promise<boolean>} True if installation succeeded
 */
function installLatestVersion() {
  return new Promise((resolve) => {
    console.log(`\nInstalling ${PACKAGE_NAME}@latest globally...`);
    console.log('─'.repeat(40));

    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(npmCommand, ['install', '-g', `${PACKAGE_NAME}@latest`], {
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    child.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Check for updates and install if available
 * @param {object} options - Command options
 */
async function runUpdate(options) {
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

  console.log(`Latest version:  ${latestVersion}`);

  if (!isNewerVersion(currentVersion, latestVersion)) {
    console.log('\nYou are already running the latest version.');
    console.log('');
    return;
  }

  console.log(`\nUpdate available: ${currentVersion} -> ${latestVersion}`);

  // Perform the update
  const success = await installLatestVersion();

  if (success) {
    console.log('─'.repeat(40));
    console.log(`\nSuccessfully updated to version ${latestVersion}`);
    console.log('');
  } else {
    console.log('─'.repeat(40));
    console.log('\nUpdate failed. Try running manually:');
    console.log(`  npm install -g ${PACKAGE_NAME}@latest`);
    console.log('');
    process.exit(1);
  }
}

// Create and configure the command
const update = new Command('update')
  .description('Update this package to the latest version')
  .action(runUpdate);

module.exports = update;
