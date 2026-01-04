#!/usr/bin/env node

/**
 * @fileoverview Install Safari Technology Preview.
 * @module installs/safari-tech-preview
 *
 * Safari Technology Preview is Apple's experimental browser for developers,
 * providing early access to upcoming WebKit features, web APIs, and developer
 * tools before they reach the stable Safari release. It updates approximately
 * every two weeks and runs alongside your existing Safari installation.
 *
 * CRITICAL PLATFORM LIMITATION:
 * Safari Technology Preview is EXCLUSIVELY available for macOS. Apple does not
 * release Safari (or Safari Technology Preview) for Windows, Linux, or any
 * other operating system. This is a fundamental platform restriction, not a
 * packaging limitation.
 *
 * Supported Platforms:
 * - macOS (Sequoia 15.0 or later) via Homebrew Cask
 *
 * Not Available On:
 * - Ubuntu/Debian (Apple does not release Safari for Linux)
 * - Raspberry Pi OS (Apple does not release Safari for Linux)
 * - Amazon Linux/RHEL (Apple does not release Safari for Linux)
 * - Windows (Safari for Windows was discontinued in 2012)
 * - WSL (Linux environment on Windows, Safari unavailable)
 * - Git Bash (Windows environment, Safari unavailable)
 */

const os = require('../utils/common/os');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');

/**
 * The Homebrew cask name for Safari Technology Preview.
 * This cask downloads the application directly from Apple's servers.
 */
const HOMEBREW_CASK_NAME = 'safari-technology-preview';

/**
 * The application name as it appears in /Applications.
 * Used for checking if the application is already installed.
 */
const APP_NAME = 'Safari Technology Preview';

/**
 * Check if Safari Technology Preview is already installed.
 *
 * This function checks for the existence of the Safari Technology Preview
 * application bundle in /Applications. This is more reliable than checking
 * for a command-line tool since Safari Technology Preview is a GUI application.
 *
 * @returns {boolean} True if Safari Technology Preview.app exists in /Applications
 */
function isAlreadyInstalled() {
  return macosApps.isAppInstalled(APP_NAME);
}

/**
 * Get the installed version of Safari Technology Preview.
 *
 * Reads the version from the application's Info.plist file. The version
 * is typically formatted as "Release XX" where XX is the release number.
 *
 * @returns {string|null} The installed version, or null if not installed
 */
function getInstalledVersion() {
  return macosApps.getAppVersion(APP_NAME);
}

/**
 * Install Safari Technology Preview on macOS using Homebrew.
 *
 * This function installs Safari Technology Preview via the Homebrew cask
 * 'safari-technology-preview'. The cask downloads the application directly
 * from Apple's servers and installs it to /Applications.
 *
 * Prerequisites:
 * - macOS Sequoia (15.0) or later
 * - Homebrew package manager installed
 * - Administrative privileges (for Homebrew cask installation)
 * - Approximately 200 MB disk space
 *
 * The installation is idempotent:
 * - If already installed via the app bundle, it will skip installation
 * - If already installed via Homebrew cask, it will skip installation
 *
 * After installation, Safari Technology Preview will be available:
 * - In /Applications/Safari Technology Preview.app
 * - In Launchpad
 * - Via Spotlight search
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if Safari Technology Preview is already installed...');

  // First check: Is the application bundle already present?
  // This catches installations done manually or via Mac App Store
  if (isAlreadyInstalled()) {
    const version = getInstalledVersion();
    if (version) {
      console.log(`Safari Technology Preview ${version} is already installed, skipping installation.`);
    } else {
      console.log('Safari Technology Preview is already installed, skipping installation.');
    }
    return;
  }

  // Second check: Is the Homebrew cask already installed?
  // This catches cases where the app might have been moved or renamed
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Safari Technology Preview is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('NOTE: If the application is not visible, check /Applications or reinstall:');
    console.log('  brew reinstall --cask safari-technology-preview');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  console.log('Installing Safari Technology Preview via Homebrew...');
  console.log('');
  console.log('NOTE: Safari Technology Preview requires macOS 15.0 (Sequoia) or later.');
  console.log('');

  // Install Safari Technology Preview using Homebrew cask
  // The --cask flag is handled by the brew.installCask() function
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    // Check for the specific macOS version requirement error
    if (result.output && result.output.includes('requires macOS')) {
      console.log('Installation failed: Safari Technology Preview requires macOS 15.0 (Sequoia) or later.');
      console.log('');
      console.log('Your macOS version does not meet the minimum requirement.');
      console.log('Please upgrade macOS before installing Safari Technology Preview.');
      return;
    }

    console.log('Failed to install Safari Technology Preview via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify installation succeeded by checking if the app now exists
  const verified = isAlreadyInstalled();
  if (!verified) {
    console.log('Installation may have completed, but the application was not found.');
    console.log('Check /Applications for Safari Technology Preview.app');
    return;
  }

  const installedVersion = getInstalledVersion();
  if (installedVersion) {
    console.log(`Safari Technology Preview ${installedVersion} installed successfully.`);
  } else {
    console.log('Safari Technology Preview installed successfully.');
  }
  console.log('');
  console.log('To get started:');
  console.log('  1. Launch Safari Technology Preview from /Applications or Spotlight');
  console.log('  2. Enable the Develop menu: Settings > Advanced > Show features for web developers');
  console.log('  3. Access experimental features via Develop > Experimental Features');
  console.log('');
  console.log('Safari Technology Preview runs alongside your existing Safari installation');
  console.log('and syncs bookmarks via iCloud.');
}

/**
 * Handle Safari Technology Preview installation request on Ubuntu/Debian.
 *
 * Safari Technology Preview is not available for Ubuntu, Debian, or any
 * Linux distribution. Apple develops Safari exclusively for macOS and iOS.
 * This function gracefully informs the user of the platform limitation.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Safari Technology Preview is not available for Ubuntu.');
  return;
}

/**
 * Handle Safari Technology Preview installation request on Ubuntu WSL.
 *
 * Safari Technology Preview is not available for WSL. WSL runs a Linux
 * environment, and Safari has never been released for any Linux distribution.
 * This function gracefully informs the user of the platform limitation.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Safari Technology Preview is not available for WSL.');
  return;
}

/**
 * Handle Safari Technology Preview installation request on Raspberry Pi OS.
 *
 * Safari Technology Preview is not available for Raspberry Pi OS. Apple
 * does not release Safari for any Linux distribution, and Raspberry Pi
 * devices run Linux-based operating systems. This function gracefully
 * informs the user of the platform limitation.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Safari Technology Preview is not available for Raspberry Pi OS.');
  return;
}

/**
 * Handle Safari Technology Preview installation request on Amazon Linux/RHEL.
 *
 * Safari Technology Preview is not available for Amazon Linux, RHEL, CentOS,
 * Fedora, or any RPM-based Linux distribution. Apple develops Safari
 * exclusively for macOS. This function gracefully informs the user of the
 * platform limitation.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Safari Technology Preview is not available for Amazon Linux.');
  return;
}

/**
 * Handle Safari Technology Preview installation request on Windows.
 *
 * Safari Technology Preview is not available for Windows. Apple discontinued
 * Safari for Windows in 2012 with Safari 5.1.7, and Safari Technology Preview
 * has never been released for Windows. This function gracefully informs the
 * user of the platform limitation.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Safari Technology Preview is not available for Windows.');
  return;
}

/**
 * Handle Safari Technology Preview installation request on Git Bash.
 *
 * Safari Technology Preview is not available for Windows (Git Bash runs
 * on Windows). Apple discontinued Safari for Windows in 2012, and Safari
 * Technology Preview has only ever been available for macOS. This function
 * gracefully informs the user of the platform limitation.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Safari Technology Preview is not available for Windows.');
  return;
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. Safari Technology Preview
 * is only available on macOS; all other platforms will receive a graceful
 * message indicating the software is not available.
 *
 * Platform Support:
 * - macOS: Full installation via Homebrew Cask
 * - All other platforms: Graceful "not available" message
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their corresponding installer functions
  // Safari Technology Preview is macOS-only, but we provide graceful
  // handlers for all platforms to avoid errors
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,
    'wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'fedora': install_amazon_linux,
    'rhel': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  // Look up the installer for the detected platform
  const installer = installers[platform.type];

  // If no installer exists for this platform, inform the user gracefully
  if (!installer) {
    console.log(`Safari Technology Preview is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
  await installer();
}

// Export all functions for use as a module and for testing
module.exports = {
  install,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash,
};

// Allow direct execution: node safari-tech-preview.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
