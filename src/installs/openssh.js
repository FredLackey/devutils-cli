#!/usr/bin/env node

/**
 * @fileoverview Install OpenSSH (provides ssh-keygen).
 * @module installs/openssh
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');

/**
 * Check if ssh-keygen is installed
 * @returns {boolean}
 */
function isInstalled() {
  return shell.commandExists('ssh-keygen');
}

/**
 * Install OpenSSH on macOS
 * @returns {Promise<boolean>}
 */
async function install_macos() {
  // ssh-keygen is built-in on macOS, nothing to install
  console.log('ssh-keygen is built-in on macOS.');
  return true;
}

/**
 * Install OpenSSH on Ubuntu/Debian
 * @returns {Promise<boolean>}
 */
async function install_debian() {
  console.log('Installing openssh-client...');
  const result = await shell.exec('sudo apt-get update && sudo apt-get install -y openssh-client');
  return result.code === 0;
}

/**
 * Install OpenSSH on Raspberry Pi
 * @returns {Promise<boolean>}
 */
async function install_raspbian() {
  return install_debian();
}

/**
 * Install OpenSSH on Amazon Linux/RHEL/Fedora
 * @returns {Promise<boolean>}
 */
async function install_rhel() {
  const platform = os.detect();
  const pm = platform.packageManager || 'yum';
  console.log('Installing openssh-clients...');
  const result = await shell.exec(`sudo ${pm} install -y openssh-clients`);
  return result.code === 0;
}

/**
 * Install OpenSSH on Windows
 * @returns {Promise<boolean>}
 */
async function install_windows() {
  console.log('Installing OpenSSH via winget...');
  const result = await shell.exec('winget install -e --id Microsoft.OpenSSH.Beta --accept-source-agreements --accept-package-agreements');
  if (result.code !== 0) {
    console.log('Trying chocolatey...');
    const chocoResult = await shell.exec('choco install openssh -y');
    return chocoResult.code === 0;
  }
  return true;
}

/**
 * Install OpenSSH on WSL
 * @returns {Promise<boolean>}
 */
async function install_wsl() {
  return install_debian();
}

/**
 * Install OpenSSH across supported platforms.
 * @returns {Promise<boolean>}
 */
async function install() {
  if (isInstalled()) {
    console.log('ssh-keygen is already installed.');
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
    console.log('OpenSSH installed successfully.');
  } else {
    console.error('Failed to install OpenSSH.');
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
