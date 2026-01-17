#!/usr/bin/env node

/**
 * @fileoverview Install Moom - a powerful window management utility for macOS.
 * @module installs/moom
 *
 * Moom is a window management application developed by Many Tricks that enables
 * users to move, resize, and arrange application windows with precision using
 * mouse interactions, keyboard shortcuts, or custom-defined layouts.
 *
 * Key features include:
 * - Mouse-based control via the green zoom button pop-up palette
 * - Snap windows to screen edges for quick positioning
 * - Custom grids for precise window placement
 * - Saved layouts for multi-monitor setups
 * - Comprehensive keyboard shortcuts for window management
 * - Multi-display support with display-aware features
 *
 * IMPORTANT PLATFORM LIMITATION:
 * Moom is a macOS-ONLY application. Many Tricks develops Moom exclusively for
 * macOS, and there is NO version for Windows, Linux, or any other operating
 * system. Moom 4 (the current version) is available only from the Many Tricks
 * website; it is NOT available on the Mac App Store due to sandboxing requirements.
 *
 * For other platforms, this installer will display a simple message and return
 * gracefully without error (no alternatives are suggested per project guidelines).
 */

const os = require('../utils/common/os');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');

/**
 * Whether this installer requires a desktop environment to function.
 * Moom is a GUI window management application that requires a desktop.
 */
const REQUIRES_DESKTOP = true;

/**
 * The name of the application bundle on macOS.
 * Moom installs to /Applications/Moom.app
 */
const MACOS_APP_NAME = 'Moom';

/**
 * The full path to the macOS application bundle.
 */
const MACOS_APP_PATH = '/Applications/Moom.app';

/**
 * The Homebrew cask name for Moom.
 * This is the official cask maintained by Homebrew.
 */
const HOMEBREW_CASK_NAME = 'moom';

/**
 * Install Moom on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - 64-bit processor (Intel or Apple Silicon natively supported)
 * - Valid license for full functionality (trial available)
 *
 * The installation uses the Homebrew cask 'moom' which downloads and installs
 * Moom to /Applications/Moom.app.
 *
 * NOTE: After installation, the user must:
 * 1. Grant Accessibility permissions in System Settings > Privacy & Security
 * 2. Purchase a license (US$15) or use the trial version
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if Moom is already installed...');

  // Check if Moom.app is already installed in /Applications
  // This handles cases where Moom was installed manually or via other methods
  const isAlreadyInstalled = macosApps.isAppInstalled(MACOS_APP_NAME);
  if (isAlreadyInstalled) {
    console.log('Moom is already installed, skipping...');
    return;
  }

  // Also check if the cask is installed via Homebrew
  // This handles cases where the app might have been moved or renamed
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Moom is already installed via Homebrew, skipping...');
    console.log('');
    console.log('NOTE: If Moom is not in Applications, check:');
    console.log('  brew info --cask moom');
    return;
  }

  // Verify Homebrew is available before attempting installation
  // Homebrew is required to install Moom via the cask system
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  console.log('Installing Moom via Homebrew...');

  // Install the Moom cask (GUI application)
  // The installCask function handles the --cask flag automatically
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    console.log('Failed to install Moom:', result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "brew update && brew cleanup" and retry');
    console.log('  2. If blocked by Gatekeeper, run: xattr -cr "/Applications/Moom.app"');
    console.log('  3. Try manual installation: brew install --cask moom');
    return;
  }

  // Verify the installation succeeded by checking for the app bundle
  const isInstalled = macosApps.isAppInstalled(MACOS_APP_NAME);
  if (!isInstalled) {
    console.log('Installation completed but Moom.app was not found in /Applications.');
    console.log('Please check: brew info --cask moom');
    return;
  }

  console.log('Moom installed successfully.');
  console.log('');
  console.log('IMPORTANT POST-INSTALLATION STEPS:');
  console.log('1. Launch Moom from /Applications or Spotlight (Cmd+Space)');
  console.log('2. Grant Accessibility permissions when prompted:');
  console.log('   System Settings > Privacy & Security > Accessibility');
  console.log('3. Purchase a license (US$15) or use the trial version');
  console.log('');
  console.log('Moom runs as a menu bar application. Click the Moom icon to configure.');
}

/**
 * Handle installation request for Ubuntu/Debian.
 *
 * Moom is a macOS-only application and is NOT available for Ubuntu or Debian.
 * This function returns gracefully with a message as per project guidelines.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Moom is not available for Ubuntu.');
}

/**
 * Handle installation request for Ubuntu running in WSL.
 *
 * Moom is a macOS-only application and cannot run in WSL or Windows.
 * This function returns gracefully with a message as per project guidelines.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Moom is not available for WSL.');
}

/**
 * Handle installation request for Raspberry Pi OS.
 *
 * Moom is a macOS-only application and is NOT available for Raspberry Pi OS.
 * This function returns gracefully with a message as per project guidelines.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Moom is not available for Raspberry Pi OS.');
}

/**
 * Handle installation request for Amazon Linux/RHEL.
 *
 * Moom is a macOS-only application and is NOT available for Amazon Linux or RHEL.
 * Additionally, these are server operating systems that typically do not have
 * desktop environments where window management tools would be applicable.
 * This function returns gracefully with a message as per project guidelines.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Moom is not available for Amazon Linux.');
}

/**
 * Handle installation request for Windows.
 *
 * Moom is a macOS-only application and is NOT available for Windows.
 * This function returns gracefully with a message as per project guidelines.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Moom is not available for Windows.');
}

/**
 * Handle installation request for Git Bash on Windows.
 *
 * Git Bash runs on Windows where Moom is not available.
 * Moom is a macOS-only application developed by Many Tricks.
 * This function returns gracefully with a message as per project guidelines.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Moom is not available for Windows.');
}

/**
 * Check if Moom is installed on the current platform.
 *
 * On macOS, checks if the Moom cask is installed via Homebrew or if
 * Moom.app exists in /Applications.
 * On all other platforms, returns false since Moom is macOS-only.
 *
 * @returns {Promise<boolean>} True if Moom is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  // Moom is only available on macOS
  if (platform.type !== 'macos') {
    return false;
  }

  // Check if Moom.app exists in /Applications
  if (macosApps.isAppInstalled(MACOS_APP_NAME)) {
    return true;
  }

  // Fallback: check via Homebrew cask
  return await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Moom is ONLY supported on macOS. All other platforms (Windows, Linux,
 * WSL, Raspberry Pi OS, Amazon Linux) are NOT supported.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();

  // Moom is only available on macOS
  if (platform.type !== 'macos') {
    return false;
  }

  // Moom requires a desktop environment (which macOS always has)
  if (REQUIRES_DESKTOP && !os.isDesktopAvailable()) {
    return false;
  }

  return true;
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically detects the current operating system and distribution,
 * then invokes the corresponding platform-specific installation function.
 *
 * Since Moom is macOS-only, non-macOS platforms will receive a simple message
 * indicating that Moom is not available for their platform.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // All non-macOS platforms gracefully return with a message
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
    'gitbash': install_gitbash,
  };

  const installer = installers[platform.type];

  // If no installer exists for this platform, exit gracefully without error
  if (!installer) {
    console.log(`Moom is not available for ${platform.type}.`);
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

// Allow direct execution of this script
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
