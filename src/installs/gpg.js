#!/usr/bin/env node

/**
 * @fileoverview Install GPG.
 * @module installs/gpg
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');

/**
 * Check if gpg is installed
 * @returns {boolean}
 */
function isInstalled() {
  return shell.commandExists('gpg');
}

/**
 * Install GPG on macOS
 * @returns {Promise<boolean>}
 */
async function install_macos() {
  console.log('Installing gnupg via Homebrew...');
  const result = await shell.exec('brew install gnupg');
  if (result.code !== 0) {
    console.error('Failed to install gnupg.');
    return false;
  }
  // Also install pinentry-mac for GUI passphrase prompts
  console.log('Installing pinentry-mac...');
  await shell.exec('brew install pinentry-mac');
  return true;
}

/**
 * Install GPG on Ubuntu/Debian
 * @returns {Promise<boolean>}
 */
async function install_debian() {
  console.log('Installing gnupg...');
  const result = await shell.exec('sudo apt-get update && sudo apt-get install -y gnupg');
  return result.code === 0;
}

/**
 * Install GPG on Raspberry Pi
 * @returns {Promise<boolean>}
 */
async function install_raspbian() {
  return install_debian();
}

/**
 * Install GPG on Amazon Linux/RHEL/Fedora
 * @returns {Promise<boolean>}
 */
async function install_rhel() {
  const platform = os.detect();
  const pm = platform.packageManager || 'yum';
  console.log('Installing gnupg2...');
  const result = await shell.exec(`sudo ${pm} install -y gnupg2`);
  return result.code === 0;
}

/**
 * Install GPG on Windows
 * @returns {Promise<boolean>}
 */
async function install_windows() {
  console.log('Installing Gpg4win via winget...');
  const result = await shell.exec('winget install -e --id GnuPG.Gpg4win --accept-source-agreements --accept-package-agreements');
  if (result.code !== 0) {
    console.log('Trying chocolatey...');
    const chocoResult = await shell.exec('choco install gpg4win -y');
    return chocoResult.code === 0;
  }
  return true;
}

/**
 * Install GPG on WSL
 * @returns {Promise<boolean>}
 */
async function install_wsl() {
  return install_debian();
}

/**
 * Install GPG across supported platforms.
 * @returns {Promise<boolean>}
 */
async function install() {
  if (isInstalled()) {
    console.log('gpg is already installed.');
    return true;
  }

  const platform = os.detect();

  const installers = {
    'macos': install_macos,
    'ubuntu': install_debian,
    'debian': install_debian,
    'raspbian': install_raspbian,
    'amazon_linux': install_rhel,
    'fedora': install_rhel,
    'rhel': install_rhel,
    'windows': install_windows,
    'wsl': install_wsl
  };

  const installer = installers[platform.type];
  if (!installer) {
    console.error(`Unsupported platform: ${platform.type}`);
    return false;
  }

  const success = await installer();
  if (success) {
    console.log('GPG installed successfully.');
  } else {
    console.error('Failed to install GPG.');
  }
  return success;
}

module.exports = {
  install,
  isInstalled,
  install_macos,
  install_debian,
  install_raspbian,
  install_rhel,
  install_windows,
  install_wsl
};

if (require.main === module) {
  install();
}
