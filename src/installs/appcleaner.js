#!/usr/bin/env node

/**
 * @fileoverview Install AppCleaner (macOS) or equivalent application uninstaller tools.
 *
 * AppCleaner by FreeMacSoft is a macOS-only application for thoroughly uninstalling
 * unwanted applications. On Windows, Bulk Crap Uninstaller (BCUninstaller) serves
 * as an equivalent tool. On Linux platforms, built-in package manager commands
 * (apt purge, apt autoremove) provide similar functionality.
 *
 * @module installs/appcleaner
 */

const os = require('../utils/common/os');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const winget = require('../utils/windows/winget');
const choco = require('../utils/windows/choco');

/**
 * Install AppCleaner on macOS using Homebrew.
 *
 * AppCleaner is installed as a Homebrew cask (GUI application) and will be
 * placed in /Applications/AppCleaner.app after installation.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if AppCleaner is already installed by looking for the .app bundle
  const isAlreadyInstalled = macosApps.isAppInstalled('AppCleaner');
  if (isAlreadyInstalled) {
    console.log('AppCleaner is already installed, skipping...');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is required to install AppCleaner. Please install Homebrew first using: dev install homebrew');
    return;
  }

  // Install AppCleaner via Homebrew cask
  console.log('Installing AppCleaner via Homebrew...');
  const result = await brew.installCask('appcleaner');

  if (!result.success) {
    console.log('Failed to install AppCleaner: ' + result.output);
    return;
  }

  // Verify installation succeeded by checking for the .app bundle
  const verified = macosApps.isAppInstalled('AppCleaner');
  if (!verified) {
    console.log('Installation may have failed: AppCleaner.app not found in /Applications');
    return;
  }

  console.log('AppCleaner installed successfully.');
}

/**
 * Handle AppCleaner installation request on Ubuntu/Debian.
 *
 * AppCleaner is NOT available on Ubuntu/Debian. This function returns gracefully
 * with an informational message. Ubuntu/Debian users can use built-in APT commands
 * (apt purge, apt autoremove) for application removal.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('AppCleaner is not available for Ubuntu.');
  return;
}

/**
 * Handle AppCleaner installation request on Ubuntu running in WSL.
 *
 * AppCleaner cannot run in WSL since it is a macOS application. This function
 * returns gracefully with an informational message.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('AppCleaner is not available for WSL.');
  return;
}

/**
 * Handle AppCleaner installation request on Raspberry Pi OS.
 *
 * AppCleaner is NOT available on Raspberry Pi OS. This function returns gracefully
 * with an informational message. Raspberry Pi users can use built-in APT commands
 * (apt purge, apt autoremove) for application removal.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('AppCleaner is not available for Raspberry Pi OS.');
  return;
}

/**
 * Handle AppCleaner installation request on Amazon Linux/RHEL.
 *
 * AppCleaner is NOT available on Amazon Linux or RHEL. This function returns
 * gracefully with an informational message. These platforms can use built-in
 * DNF/YUM commands (dnf remove, dnf autoremove) for application removal.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('AppCleaner is not available for Amazon Linux.');
  return;
}

/**
 * Install Bulk Crap Uninstaller on Windows as the AppCleaner equivalent.
 *
 * Since AppCleaner is macOS-only, this installs Bulk Crap Uninstaller (BCUninstaller)
 * which provides similar functionality on Windows. Installation is attempted first
 * via winget (preferred), then falls back to Chocolatey if winget is unavailable.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // BCUninstaller package identifiers for different package managers
  const WINGET_PACKAGE_ID = 'Klocman.BulkCrapUninstaller';
  const CHOCO_PACKAGE_NAME = 'bulk-crap-uninstaller';

  // Check if BCUninstaller is already installed via winget
  if (winget.isInstalled()) {
    const isInstalledViaWinget = await winget.isPackageInstalled(WINGET_PACKAGE_ID);
    if (isInstalledViaWinget) {
      console.log('Bulk Crap Uninstaller is already installed, skipping...');
      return;
    }
  }

  // Check if BCUninstaller is already installed via Chocolatey
  if (choco.isInstalled()) {
    const isInstalledViaChoco = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
    if (isInstalledViaChoco) {
      console.log('Bulk Crap Uninstaller is already installed, skipping...');
      return;
    }
  }

  // Prefer winget for installation (modern Windows package manager)
  if (winget.isInstalled()) {
    console.log('Installing Bulk Crap Uninstaller via winget...');
    const result = await winget.install(WINGET_PACKAGE_ID);

    if (result.success) {
      console.log('Bulk Crap Uninstaller installed successfully.');
      return;
    }

    // winget installation failed, will try Chocolatey as fallback
    console.log('winget installation failed, attempting Chocolatey...');
  }

  // Fallback to Chocolatey installation
  if (choco.isInstalled()) {
    console.log('Installing Bulk Crap Uninstaller via Chocolatey...');
    const result = await choco.install(CHOCO_PACKAGE_NAME);

    if (result.success) {
      console.log('Bulk Crap Uninstaller installed successfully.');
      return;
    }

    console.log('Failed to install Bulk Crap Uninstaller: ' + result.output);
    return;
  }

  // Neither package manager is available
  console.log('Neither winget nor Chocolatey is available. Please install one of these package managers first.');
  return;
}

/**
 * Handle AppCleaner installation request on Git Bash.
 *
 * Git Bash runs within Windows, so the portable version of Bulk Crap Uninstaller
 * would be the appropriate solution. However, this requires manual download and
 * extraction. This function returns gracefully with an informational message.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('AppCleaner is not available for Git Bash.');
  return;
}

/**
 * Check if AppCleaner (or equivalent) is installed on the current platform.
 *
 * This function performs platform-specific checks to determine if AppCleaner
 * (macOS) or Bulk Crap Uninstaller (Windows) is already installed.
 *
 * @returns {Promise<boolean>} True if AppCleaner/equivalent is installed
 */
async function isInstalled() {
  const platform = os.detect();

  // macOS: Check for AppCleaner.app
  if (platform.type === 'macos') {
    return macosApps.isAppInstalled('AppCleaner');
  }

  // Windows: Check for Bulk Crap Uninstaller via winget or Chocolatey
  if (platform.type === 'windows') {
    const WINGET_PACKAGE_ID = 'Klocman.BulkCrapUninstaller';
    const CHOCO_PACKAGE_NAME = 'bulk-crap-uninstaller';

    if (winget.isInstalled()) {
      const isInstalledViaWinget = await winget.isPackageInstalled(WINGET_PACKAGE_ID);
      if (isInstalledViaWinget) {
        return true;
      }
    }

    if (choco.isInstalled()) {
      const isInstalledViaChoco = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
      if (isInstalledViaChoco) {
        return true;
      }
    }

    return false;
  }

  // Other platforms: Not supported
  return false;
}

/**
 * Check if this installer is supported on the current platform.
 *
 * AppCleaner/equivalent can be installed on:
 * - macOS (AppCleaner via Homebrew cask)
 * - Windows (Bulk Crap Uninstaller via winget/Chocolatey)
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'windows'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically detects the current operating system and invokes
 * the corresponding platform-specific installation function. On unsupported
 * platforms, it displays an informational message and returns gracefully.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their corresponding installer functions
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,
    'ubuntu-wsl': install_ubuntu_wsl,
    'wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  const installer = installers[platform.type];

  // Handle unsupported platforms gracefully without throwing an error
  if (!installer) {
    console.log(`AppCleaner is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

module.exports = {
  install,
  isInstalled,
  isEligible,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash,
};

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
