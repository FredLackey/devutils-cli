#!/usr/bin/env node

/**
 * @fileoverview Install Parallels Desktop.
 * @module installs/parallels-desktop
 *
 * Parallels Desktop is a desktop virtualization software exclusively designed
 * for macOS. It enables Mac users to run Windows, Linux, and other operating
 * systems as virtual machines (VMs) alongside macOS without rebooting.
 *
 * Key features include:
 * - Seamless Integration: Run Windows applications directly from the macOS Dock
 * - Coherence Mode: Windows applications appear as native macOS windows
 * - Apple Silicon Support: Full native support for M-series Macs
 * - Performance Optimization: Hardware-accelerated graphics and USB passthrough
 * - Developer Tools: CLI for managing VMs programmatically
 *
 * IMPORTANT PLATFORM LIMITATION:
 * Parallels Desktop is officially supported ONLY on macOS.
 * There is NO support for Linux, Windows, or any other operating system as the HOST.
 *
 * For unsupported platforms, this installer will display a simple message
 * and return gracefully without error.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const fs = require('fs');

/**
 * Whether this installer requires a desktop environment to function.
 * Parallels Desktop is a GUI virtualization application for macOS.
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for Parallels Desktop.
 * Note: The cask is named 'parallels' not 'parallels-desktop'.
 */
const HOMEBREW_CASK_NAME = 'parallels';

/**
 * The path where the Parallels Desktop application is installed on macOS.
 * This is the standard installation location via Homebrew cask.
 */
const MACOS_APP_PATH = '/Applications/Parallels Desktop.app';

/**
 * Check if Parallels Desktop is installed on macOS.
 *
 * Checks for the application bundle at the standard installation location.
 * This is more reliable than checking if the cask is listed because the
 * app could have been installed manually or moved.
 *
 * @returns {boolean} True if Parallels Desktop is installed, false otherwise
 */
function isInstalledMacOS() {
  return fs.existsSync(MACOS_APP_PATH);
}

/**
 * Check if the prlctl command-line tool is available.
 *
 * prlctl is the Parallels Desktop command-line interface for managing
 * virtual machines. It is installed as part of Parallels Desktop.
 *
 * @returns {boolean} True if prlctl is available in PATH, false otherwise
 */
function isPrlctlAvailable() {
  return shell.commandExists('prlctl');
}

/**
 * Get the installed Parallels Desktop version.
 *
 * Uses the prlctl command-line tool to query the version. Returns null
 * if prlctl is not available or the version cannot be determined.
 *
 * @returns {Promise<string|null>} Version string (e.g., "26.2.1"), or null if not available
 */
async function getVersion() {
  // First check if prlctl exists before trying to run it
  if (!isPrlctlAvailable()) {
    return null;
  }

  const result = await shell.exec('prlctl --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "prlctl version 26.2.1 (57371)"
    const match = result.stdout.match(/prlctl version ([\d.]+)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Install Parallels Desktop on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 13 (Ventura) or later (for Parallels Desktop 26)
 * - Apple Silicon (M-series) or Intel processor
 * - Homebrew package manager installed
 * - At least 4 GB RAM (16 GB recommended)
 * - At least 600 MB disk space for the app, plus space for VMs
 * - Administrator privileges (may prompt for password)
 *
 * The installation uses the Homebrew cask 'parallels' which downloads and
 * installs Parallels Desktop to /Applications/Parallels Desktop.app.
 *
 * IMPORTANT: After installation, the user must:
 * 1. Launch Parallels Desktop (may prompt for system extension approval)
 * 2. Sign in or create a Parallels account
 * 3. Activate a license or start a trial
 *
 * Parallels Desktop is commercial software requiring a paid license for
 * continued use after the trial period.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Parallels Desktop is already installed...');

  // Check if the application is already installed by looking for the app bundle
  if (isInstalledMacOS()) {
    console.log('Parallels Desktop is already installed, skipping installation.');

    // Optionally show version if prlctl is available
    const version = await getVersion();
    if (version) {
      console.log(`Installed version: ${version}`);
    }
    return;
  }

  // Also check if the cask is installed (covers edge case where app was removed but cask still listed)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Parallels Desktop cask is installed but application is missing.');
    console.log('Reinstalling via Homebrew...');

    // Reinstall the cask
    const reinstallResult = await shell.exec(`brew reinstall --cask ${HOMEBREW_CASK_NAME}`);
    if (reinstallResult.code !== 0) {
      throw new Error(
        `Failed to reinstall Parallels Desktop.\n` +
        `Output: ${reinstallResult.stderr}\n\n` +
        `Please try manually: brew reinstall --cask parallels`
      );
    }

    console.log('Parallels Desktop reinstalled successfully.');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Parallels Desktop.'
    );
  }

  console.log('Installing Parallels Desktop via Homebrew...');
  console.log('This may take a few minutes as the download is approximately 600 MB...');

  // Install the cask with quiet mode to reduce output noise
  // Note: This may prompt for administrator password to install system extensions
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Parallels Desktop via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Ensure you have sufficient disk space (at least 1 GB free)\n` +
      `  3. Try manual installation: brew reinstall --cask parallels\n` +
      `  4. If on macOS 14+, you may need to approve system extensions in System Settings`
    );
  }

  // Verify the installation succeeded by checking if the app exists
  if (!isInstalledMacOS()) {
    throw new Error(
      'Installation appeared to complete but Parallels Desktop was not found at:\n' +
      `  ${MACOS_APP_PATH}\n\n` +
      'Please try reinstalling manually: brew reinstall --cask parallels'
    );
  }

  console.log('Parallels Desktop installed successfully.');
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Launch Parallels Desktop from Applications or run: open -a "Parallels Desktop"');
  console.log('  2. On first launch, you may be prompted to allow system extensions');
  console.log('     Go to System Settings > Privacy & Security and click "Allow"');
  console.log('  3. Sign in or create a Parallels account');
  console.log('  4. Activate your license or start a trial');
  console.log('');
  console.log('Note: Parallels Desktop is commercial software. A paid license is required');
  console.log('for continued use after the trial period.');
  console.log('');
  console.log('To verify installation, run: prlctl --version');
}

/**
 * Install Parallels Desktop on Ubuntu/Debian.
 *
 * IMPORTANT: Parallels Desktop is NOT supported on Ubuntu or Debian.
 * Parallels Desktop is exclusively developed for macOS and cannot be installed
 * on any Linux distribution as a host operating system.
 *
 * This function returns gracefully without error to maintain consistent
 * behavior across all installers.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Parallels Desktop is not available for Ubuntu/Debian.');
}

/**
 * Install Parallels Desktop on Raspberry Pi OS.
 *
 * IMPORTANT: Parallels Desktop is NOT supported on Raspberry Pi OS.
 * Parallels Desktop is exclusively developed for macOS. The ARM architecture
 * of Raspberry Pi is not a limiting factor - Parallels simply does not develop
 * software for any Linux distribution.
 *
 * This function returns gracefully without error to maintain consistent
 * behavior across all installers.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Parallels Desktop is not available for Raspberry Pi OS.');
}

/**
 * Install Parallels Desktop on Amazon Linux/RHEL.
 *
 * IMPORTANT: Parallels Desktop is NOT supported on Amazon Linux or RHEL.
 * Parallels Desktop is exclusively developed for macOS and cannot be installed
 * on any Linux distribution.
 *
 * This function returns gracefully without error to maintain consistent
 * behavior across all installers.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Parallels Desktop is not available for Amazon Linux/RHEL.');
}

/**
 * Install Parallels Desktop on Windows.
 *
 * IMPORTANT: Parallels Desktop is NOT supported on Windows.
 * Parallels Desktop is exclusively developed for macOS.
 *
 * Historical Note: Parallels previously offered "Parallels Workstation" for
 * Windows and Linux hosts, but this product was discontinued in 2013.
 * There is no current Parallels product for Windows.
 *
 * This function returns gracefully without error to maintain consistent
 * behavior across all installers.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Parallels Desktop is not available for Windows.');
}

/**
 * Install Parallels Desktop on Ubuntu running in WSL.
 *
 * IMPORTANT: Parallels Desktop cannot be installed within WSL.
 * WSL is a Linux compatibility layer running on Windows, and Parallels Desktop
 * only runs on macOS as the host operating system.
 *
 * Note: Running virtualization software within WSL would require nested
 * virtualization, which is not supported in WSL. Additionally, Parallels
 * does not support any Linux distribution.
 *
 * This function returns gracefully without error to maintain consistent
 * behavior across all installers.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Parallels Desktop is not available for WSL (Windows Subsystem for Linux).');
}

/**
 * Install Parallels Desktop from Git Bash on Windows.
 *
 * IMPORTANT: Parallels Desktop is NOT supported on Windows.
 * Git Bash runs within Windows, and Parallels Desktop is exclusively
 * developed for macOS.
 *
 * This function returns gracefully without error to maintain consistent
 * behavior across all installers.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Parallels Desktop is not available for Windows.');
}

/**
 * Check if Parallels Desktop is installed on the current platform.
 *
 * This function performs platform-specific checks to determine if Parallels
 * Desktop is already installed:
 * - macOS: Checks for the app bundle in /Applications
 * - Other platforms: Always returns false (not supported)
 *
 * @returns {Promise<boolean>} True if Parallels Desktop is installed
 */
async function isInstalled() {
  const platform = os.detect();

  // macOS: Check for the app bundle
  if (platform.type === 'macos') {
    return isInstalledMacOS();
  }

  // All other platforms: Not supported, return false
  return false;
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Parallels Desktop can ONLY be installed on:
 * - macOS (via Homebrew cask)
 *
 * All other platforms are explicitly not supported and will return false.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();

  // Parallels Desktop is only available on macOS
  if (platform.type !== 'macos') {
    return false;
  }

  // Also check if a desktop environment is available
  // (always true on macOS, but included for consistency)
  if (REQUIRES_DESKTOP && !os.isDesktopAvailable()) {
    return false;
  }

  return true;
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all platforms have appropriate
 * installation logic (or graceful messaging for unsupported platforms).
 *
 * Supported platforms:
 * - macOS: Full support via Homebrew cask
 *
 * Unsupported platforms (returns gracefully with message):
 * - Ubuntu/Debian: Parallels is macOS-only
 * - Raspberry Pi OS: Parallels is macOS-only
 * - Amazon Linux/RHEL: Parallels is macOS-only
 * - Windows: Parallels is macOS-only (Parallels Workstation discontinued in 2013)
 * - WSL: Parallels is macOS-only
 * - Git Bash: Parallels is macOS-only
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // Only macOS has a real installer; all others return graceful messages
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
    'gitbash': install_gitbash
  };

  const installer = installers[platform.type];

  if (!installer) {
    console.log(`Parallels Desktop is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

// Export all functions for use as a module and for testing
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
  install_gitbash
};

// Allow direct execution: node parallels-desktop.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
