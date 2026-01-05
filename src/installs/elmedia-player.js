#!/usr/bin/env node

/**
 * @fileoverview Install Elmedia Player.
 * @module installs/elmedia-player
 *
 * Elmedia Player is a premium media player developed by Electronic Team, Inc.
 * exclusively for macOS. It supports virtually all video and audio formats
 * including AVI, MP4, FLV, WMV, MKV, MP3, M4V, MOV, and many others without
 * requiring additional codecs.
 *
 * IMPORTANT PLATFORM LIMITATION:
 * Elmedia Player is ONLY available on macOS. It is not available for Windows,
 * Linux, or any other operating system. For unsupported platforms, this
 * installer will display a simple message and return gracefully without error.
 */

const fs = require('fs');
const os = require('../utils/common/os');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');

/**
 * The Homebrew cask name for Elmedia Player.
 * This is the identifier used by Homebrew to install the application.
 */
const HOMEBREW_CASK_NAME = 'elmedia-player';

/**
 * The application bundle name as it appears in /Applications.
 * Elmedia Player uses a space in its name when installed.
 */
const MACOS_APP_NAME = 'Elmedia Player';

/**
 * The full path to the Elmedia Player application bundle.
 * This is where Homebrew installs the application.
 */
const MACOS_APP_PATH = '/Applications/Elmedia Player.app';

/**
 * Check if Elmedia Player is already installed on macOS.
 *
 * Checks both the standard /Applications folder and ~/Applications
 * for the Elmedia Player.app bundle.
 *
 * @returns {boolean} True if Elmedia Player is installed, false otherwise
 */
function isInstalledMacOS() {
  // Check if the application bundle exists in the standard location
  if (fs.existsSync(MACOS_APP_PATH)) {
    return true;
  }

  // Also check using the macOS apps utility which handles ~/Applications
  return macosApps.isAppInstalled(MACOS_APP_NAME);
}

/**
 * Install Elmedia Player on macOS using Homebrew.
 *
 * This function performs an idempotent installation of Elmedia Player:
 * 1. Checks if Elmedia Player is already installed (skips if yes)
 * 2. Verifies Homebrew is available
 * 3. Installs via Homebrew cask
 * 4. Verifies the installation succeeded
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later (Homebrew cask requirement)
 * - Homebrew package manager installed
 * - A graphical desktop session (not SSH-only)
 *
 * NOTE: This installs the free version of Elmedia Player. The Pro version
 * with additional features (streaming, playlist management, video tuning)
 * requires a separate license purchase from the Electronic Team website.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Elmedia Player is already installed...');

  // Idempotency check: skip installation if already present
  if (isInstalledMacOS()) {
    console.log('Elmedia Player is already installed, skipping installation.');
    return;
  }

  // Verify Homebrew is available before attempting installation
  // Homebrew is required to install cask applications
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Elmedia Player.'
    );
  }

  console.log('Installing Elmedia Player via Homebrew...');

  // Install the cask using the Homebrew utility
  // The brew.installCask function handles the --cask flag automatically
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  // Check if the installation command succeeded
  if (!result.success) {
    throw new Error(
      `Failed to install Elmedia Player via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. If using Apple Silicon, ensure Homebrew is properly configured\n` +
      `  3. Try reinstalling: brew reinstall --cask elmedia-player\n` +
      `  4. Check for Gatekeeper issues: xattr -dr com.apple.quarantine /Applications/Elmedia\\ Player.app`
    );
  }

  // Verify the installation succeeded by checking if the app bundle exists
  // This catches cases where Homebrew reports success but the app was not installed
  if (!isInstalledMacOS()) {
    throw new Error(
      'Installation appeared to complete but Elmedia Player was not found at:\n' +
      `  ${MACOS_APP_PATH}\n\n` +
      'Please try reinstalling manually: brew reinstall --cask elmedia-player'
    );
  }

  console.log('Elmedia Player installed successfully.');
  console.log('');
  console.log('You can launch Elmedia Player from your Applications folder');
  console.log('or by searching for "Elmedia" in Spotlight (Cmd+Space).');
}

/**
 * Install Elmedia Player on Ubuntu/Debian.
 *
 * IMPORTANT: Elmedia Player is NOT available for Ubuntu or Debian.
 * It is a macOS-exclusive application developed by Electronic Team, Inc.
 * and has no Linux version.
 *
 * This function returns gracefully with a message rather than throwing
 * an error, following the project's pattern for unsupported platforms.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Elmedia Player is not available for Ubuntu/Debian.');
}

/**
 * Install Elmedia Player on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * IMPORTANT: Elmedia Player is NOT available for WSL. It is a macOS-exclusive
 * application. Neither WSL (Linux environment) nor the Windows host can run
 * Elmedia Player because it only exists for macOS.
 *
 * This function returns gracefully with a message rather than throwing
 * an error, following the project's pattern for unsupported platforms.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Elmedia Player is not available for WSL.');
}

/**
 * Install Elmedia Player on Raspberry Pi OS.
 *
 * IMPORTANT: Elmedia Player is NOT available for Raspberry Pi OS.
 * It is a macOS-exclusive application and has no ARM Linux version.
 *
 * This function returns gracefully with a message rather than throwing
 * an error, following the project's pattern for unsupported platforms.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Elmedia Player is not available for Raspberry Pi OS.');
}

/**
 * Install Elmedia Player on Amazon Linux/RHEL.
 *
 * IMPORTANT: Elmedia Player is NOT available for Amazon Linux or RHEL.
 * It is a macOS-exclusive application and has no Linux version.
 *
 * This function returns gracefully with a message rather than throwing
 * an error, following the project's pattern for unsupported platforms.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Elmedia Player is not available for Amazon Linux/RHEL.');
}

/**
 * Install Elmedia Player on Windows.
 *
 * IMPORTANT: Elmedia Player is NOT available for Windows.
 * It is a macOS-exclusive application developed by Electronic Team, Inc.
 * and has no Windows version.
 *
 * This function returns gracefully with a message rather than throwing
 * an error, following the project's pattern for unsupported platforms.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Elmedia Player is not available for Windows.');
}

/**
 * Install Elmedia Player from Git Bash on Windows.
 *
 * IMPORTANT: Elmedia Player is NOT available for Windows.
 * Git Bash runs on Windows, and Elmedia Player is a macOS-exclusive
 * application with no Windows version.
 *
 * This function returns gracefully with a message rather than throwing
 * an error, following the project's pattern for unsupported platforms.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Elmedia Player is not available for Windows.');
}

/**
 * Check if Elmedia Player is currently installed on the system.
 *
 * Elmedia Player is ONLY available on macOS. This function checks for the
 * application bundle in /Applications or ~/Applications.
 *
 * @returns {Promise<boolean>} True if Elmedia Player is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    // Check if Elmedia Player app bundle exists
    if (isInstalledMacOS()) {
      return true;
    }
    // Also check via Homebrew cask
    return await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  }

  // Elmedia Player is not available on any other platform
  return false;
}

/**
 * Check if this installer is supported on the current platform.
 * Elmedia Player is ONLY available on macOS.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return platform.type === 'macos';
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * For Elmedia Player, only macOS is supported. All other platforms will
 * receive a friendly message and return gracefully without error.
 *
 * Supported platforms:
 * - macOS: Full support via Homebrew cask
 *
 * Unsupported platforms (returns gracefully with message):
 * - Ubuntu/Debian: macOS-exclusive application
 * - Raspberry Pi OS: macOS-exclusive application
 * - Amazon Linux/RHEL: macOS-exclusive application
 * - Windows: macOS-exclusive application
 * - WSL: macOS-exclusive application
 * - Git Bash: macOS-exclusive application
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles platform aliases (e.g., debian maps to ubuntu)
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,
    'ubuntu-wsl': install_ubuntu_wsl,
    'wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'amazon-linux': install_amazon_linux,
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash
  };

  const installer = installers[platform.type];

  // If the platform is not in our mapping, display a friendly message
  // and return without error
  if (!installer) {
    console.log(`Elmedia Player is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

// Export all functions for use as a module and for testing
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
  install_gitbash
};

// Allow direct execution: node elmedia-player.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
