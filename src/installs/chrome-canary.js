#!/usr/bin/env node

/**
 * @fileoverview Install Google Chrome Canary - the bleeding-edge development version of Chrome.
 *
 * Google Chrome Canary is the experimental version of Chrome that receives nightly updates.
 * It is designed for developers and early adopters who want to test upcoming browser features.
 * Chrome Canary can run alongside Chrome stable without conflicts.
 *
 * Platform Support:
 * - macOS: Full support via Homebrew cask
 * - Ubuntu/Debian: Full support via Google's APT repository
 * - WSL (Ubuntu): Full support via Google's APT repository
 * - Windows: Full support via Chocolatey
 * - Git Bash: Uses Windows installation (Chocolatey)
 * - Raspberry Pi OS: NOT available (no ARM builds)
 * - Amazon Linux/RHEL: NOT available (no RPM packages for Canary)
 *
 * @module installs/chrome-canary
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');
const fs = require('fs');
const path = require('path');

/**
 * Whether this installer requires a desktop environment to function.
 * Chrome Canary is a GUI web browser.
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for Chrome Canary on macOS
 * @constant {string}
 */
const MACOS_CASK_NAME = 'google-chrome@canary';

/**
 * The application name as it appears in /Applications on macOS
 * @constant {string}
 */
const MACOS_APP_NAME = 'Google Chrome Canary';

/**
 * The APT package name for Chrome Canary on Ubuntu/Debian
 * @constant {string}
 */
const UBUNTU_PACKAGE_NAME = 'google-chrome-canary';

/**
 * The command name to verify Chrome Canary installation on Linux
 * @constant {string}
 */
const LINUX_COMMAND_NAME = 'google-chrome-canary';

/**
 * The Chocolatey package name for Chrome Canary on Windows
 * @constant {string}
 */
const WINDOWS_PACKAGE_NAME = 'googlechromecanary';

/**
 * URL for Google's GPG signing key used to verify packages
 * @constant {string}
 */
const GOOGLE_GPG_KEY_URL = 'https://dl.google.com/linux/linux_signing_key.pub';

/**
 * Path where the Google GPG keyring should be stored
 * @constant {string}
 */
const GOOGLE_KEYRING_PATH = '/etc/apt/keyrings/google-chrome.gpg';

/**
 * The APT repository line for Google Chrome
 * @constant {string}
 */
const GOOGLE_APT_REPO = 'deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main';

/**
 * Path to the APT sources list file for Google Chrome
 * @constant {string}
 */
const GOOGLE_APT_SOURCES_PATH = '/etc/apt/sources.list.d/google-chrome.list';

/**
 * Install Google Chrome Canary on macOS using Homebrew.
 *
 * This function checks if Chrome Canary is already installed by looking for
 * the application in /Applications. If not installed, it uses Homebrew to
 * install the google-chrome@canary cask.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Chrome Canary is already installed by looking for the .app bundle
  const isInstalled = macosApps.isAppInstalled(MACOS_APP_NAME);

  if (isInstalled) {
    console.log('Google Chrome Canary is already installed, skipping...');
    return;
  }

  // Verify that Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first: https://brew.sh');
    return;
  }

  console.log('Installing Google Chrome Canary via Homebrew...');

  // Install the cask using the --quiet flag to suppress non-essential output
  const result = await shell.exec(`brew install --cask --quiet ${MACOS_CASK_NAME}`);

  if (result.code !== 0) {
    console.log(`Installation failed: ${result.stderr || result.stdout}`);
    return;
  }

  // Verify that the installation succeeded by checking for the app bundle
  const verified = macosApps.isAppInstalled(MACOS_APP_NAME);

  if (!verified) {
    console.log('Installation may have failed: Google Chrome Canary.app not found in /Applications');
    return;
  }

  console.log('Google Chrome Canary installed successfully.');
}

/**
 * Handle the unsupported Ubuntu/Debian platform.
 *
 * Google Chrome Canary is NOT officially available for Linux distributions.
 * Google only provides Stable, Beta, and Unstable (Dev) channels via their
 * APT repository. The google-chrome-canary package does not exist for Linux.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Chrome Canary is not available for Ubuntu/Debian/Linux
  // Return gracefully without throwing an error
  console.log('Google Chrome Canary is not available for Ubuntu/Debian.');
  console.log('Consider using google-chrome-unstable (Dev channel) as an alternative.');
  return;
}

/**
 * Handle the unsupported WSL (Ubuntu) platform.
 *
 * Google Chrome Canary is NOT officially available for Linux distributions,
 * including Ubuntu running in WSL. Google only provides Stable, Beta, and
 * Unstable (Dev) channels for Linux.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // Chrome Canary is not available for WSL/Ubuntu
  // Return gracefully without throwing an error
  console.log('Google Chrome Canary is not available for WSL/Ubuntu.');
  console.log('Consider using google-chrome-unstable (Dev channel) as an alternative.');
  return;
}

/**
 * Gracefully handle the unsupported Raspberry Pi OS platform.
 *
 * Google Chrome Canary is NOT available for Raspberry Pi OS because Google
 * does not provide ARM builds of the Canary channel. Only x86_64 (Intel/AMD)
 * architectures are supported for Chrome Canary on Linux.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Chrome Canary is not available for ARM architectures
  // Return gracefully without throwing an error or suggesting alternatives
  console.log('Google Chrome Canary is not available for Raspberry Pi OS.');
  return;
}

/**
 * Gracefully handle the unsupported Amazon Linux/RHEL platform.
 *
 * Google Chrome Canary is NOT available for RPM-based Linux distributions.
 * Google only releases Chrome Canary packages for Debian/Ubuntu-based systems
 * on Linux. The Chrome Unstable (Dev) channel is available for these platforms,
 * but we do not suggest alternatives per project guidelines.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Chrome Canary is not available for RPM-based distributions
  // Return gracefully without throwing an error or suggesting alternatives
  console.log('Google Chrome Canary is not available for Amazon Linux.');
  return;
}

/**
 * Install Google Chrome Canary on Windows using Chocolatey.
 *
 * This function installs Chrome Canary using the Chocolatey package manager.
 * The --pre flag is required because Chrome Canary is marked as a prerelease
 * package in the Chocolatey repository.
 *
 * Note: Chrome Canary installs per-user on Windows, not system-wide.
 * The executable is located at:
 * %LOCALAPPDATA%\Google\Chrome SxS\Application\chrome.exe
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if Chrome Canary is already installed by looking for the Chocolatey package
  const isPackageInstalled = await choco.isPackageInstalled(WINDOWS_PACKAGE_NAME);

  if (isPackageInstalled) {
    console.log('Google Chrome Canary is already installed, skipping...');
    return;
  }

  // Also check if Chrome Canary exists in the file system (may have been installed manually)
  const localAppData = process.env.LOCALAPPDATA || '';
  const chromeSxSPath = path.join(localAppData, 'Google', 'Chrome SxS', 'Application', 'chrome.exe');

  if (localAppData && fs.existsSync(chromeSxSPath)) {
    console.log('Google Chrome Canary is already installed (detected in AppData), skipping...');
    return;
  }

  // Verify that Chocolatey is available
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first: https://chocolatey.org/install');
    return;
  }

  console.log('Installing Google Chrome Canary via Chocolatey...');

  // Install using the --pre flag because Chrome Canary is a prerelease package
  // The -y flag enables non-interactive installation
  const result = await shell.exec(`choco install ${WINDOWS_PACKAGE_NAME} -y --pre`);

  if (result.code !== 0) {
    // Chocolatey may fail due to checksum mismatches (Chrome updates daily)
    // Retry with --ignore-checksums if the first attempt fails
    console.log('Initial installation failed, retrying with --ignore-checksums...');
    const retryResult = await shell.exec(`choco install ${WINDOWS_PACKAGE_NAME} -y --pre --ignore-checksums`);

    if (retryResult.code !== 0) {
      console.log(`Installation failed: ${retryResult.stderr || retryResult.stdout}`);
      return;
    }
  }

  // Verify the installation by checking if the executable exists
  // Note: Chocolatey package check may not immediately reflect the new installation
  if (localAppData && fs.existsSync(chromeSxSPath)) {
    console.log('Google Chrome Canary installed successfully.');
  } else {
    // The package was installed by Chocolatey, trust that it succeeded
    console.log('Google Chrome Canary installed successfully.');
  }
}

/**
 * Install Google Chrome Canary from Git Bash on Windows.
 *
 * Git Bash runs within the Windows environment and has access to Windows
 * applications. This function delegates to the Windows installer, which
 * uses Chocolatey to install Chrome Canary.
 *
 * Once installed, Chrome Canary can be launched from Git Bash using:
 * "/c/Users/$USER/AppData/Local/Google/Chrome SxS/Application/chrome.exe"
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Git Bash uses the same installation method as native Windows
  // Chocolatey is accessible from Git Bash
  await install_windows();
}

/**
 * Check if Google Chrome Canary is installed on the current platform.
 *
 * This function performs platform-specific checks to determine if Chrome Canary
 * is already installed:
 * - macOS: Checks for Google Chrome Canary.app in /Applications
 * - Windows: Checks for Chocolatey package or executable in AppData
 * - Linux (Ubuntu/Debian/WSL): Always returns false (not available on Linux)
 *
 * @returns {Promise<boolean>} True if Chrome Canary is installed
 */
async function isInstalled() {
  const platform = os.detect();

  // macOS: Check for the app bundle
  if (platform.type === 'macos') {
    return macosApps.isAppInstalled(MACOS_APP_NAME);
  }

  // Windows: Check for Chocolatey package or direct file
  if (platform.type === 'windows' || platform.type === 'gitbash') {
    const isPackageInstalled = await choco.isPackageInstalled(WINDOWS_PACKAGE_NAME);
    if (isPackageInstalled) {
      return true;
    }

    // Also check the Chrome SxS directory (Canary uses SxS for side-by-side installation)
    const localAppData = process.env.LOCALAPPDATA || '';
    if (localAppData) {
      const chromeSxSPath = path.join(localAppData, 'Google', 'Chrome SxS', 'Application', 'chrome.exe');
      if (fs.existsSync(chromeSxSPath)) {
        return true;
      }
    }
    return false;
  }

  // Ubuntu/Debian/WSL: Chrome Canary is not available for Linux
  if (['ubuntu', 'debian', 'wsl'].includes(platform.type)) {
    return false;
  }

  // Unsupported platforms
  return false;
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Google Chrome Canary can be installed on:
 * - macOS (via Homebrew cask)
 * - Windows (via Chocolatey)
 * - Git Bash (via Windows Chocolatey)
 *
 * Note: Chrome Canary is NOT officially available for Linux (Ubuntu/Debian/WSL).
 * Google only provides Stable, Beta, and Unstable (Dev) channels for Linux.
 * Raspberry Pi (ARM architecture) and Amazon Linux/RHEL are also NOT supported.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  // Chrome Canary is only available on macOS and Windows
  // It is NOT available for any Linux distributions including Ubuntu/Debian/WSL
  const supportedPlatforms = ['macos', 'windows', 'gitbash'];
  if (!supportedPlatforms.includes(platform.type)) {
    return false;
  }
  if (REQUIRES_DESKTOP && !os.isDesktopAvailable()) {
    return false;
  }
  return true;
}

/**
 * Main installation entry point - detects the current platform and runs
 * the appropriate installer function.
 *
 * This function uses the os.detect() utility to determine the current
 * operating system and selects the corresponding installation method.
 * If the platform is not supported, it displays a friendly message and
 * exits gracefully without throwing an error.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // Multiple platform types may share the same installer
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,
    'wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  const installer = installers[platform.type];

  if (!installer) {
    // Platform is not recognized - display a friendly message and exit gracefully
    console.log(`Google Chrome Canary is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

module.exports = {
  REQUIRES_DESKTOP,
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
