#!/usr/bin/env node

/**
 * @fileoverview Install lsb-release - the Linux Standard Base release utility.
 *
 * The lsb-release utility provides information about the Linux Standard Base (LSB)
 * and distribution-specific information. It is a command-line tool that displays
 * details about your Linux distribution, including:
 * - Distributor ID (e.g., Ubuntu, Debian, Raspbian)
 * - Description (human-readable description of the distribution)
 * - Release version number
 * - Codename (e.g., jammy, bookworm)
 *
 * IMPORTANT: lsb-release is a Linux-specific utility. It is NOT available on:
 * - macOS (use sw_vers instead)
 * - Windows (use PowerShell Get-ComputerInfo instead)
 * - Amazon Linux 2023 (use /etc/os-release instead)
 * - Git Bash (runs on Windows, not a Linux environment)
 *
 * On supported platforms (Ubuntu, Debian, Raspberry Pi OS, WSL), the package
 * is often pre-installed but may be missing in minimal or container images.
 *
 * @module installs/lsb-release
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const apt = require('../utils/ubuntu/apt');

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Checks if the lsb_release command is available in the system PATH.
 *
 * Note: The package name uses a hyphen (lsb-release) but the command uses
 * an underscore (lsb_release). This function checks for the command.
 *
 * @returns {boolean} - True if the lsb_release command exists
 */
function isLsbReleaseInstalled() {
  return shell.commandExists('lsb_release');
}

// -----------------------------------------------------------------------------
// Platform-Specific Installation Functions
// -----------------------------------------------------------------------------

/**
 * Install lsb-release on macOS.
 *
 * lsb-release is NOT available on macOS because macOS is not a Linux distribution
 * and does not implement the Linux Standard Base. This function gracefully
 * returns without error, informing the user that the tool is not available.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // lsb-release is a Linux-only utility and is not available on macOS
  // Return gracefully without throwing an error
  console.log('lsb-release is not available for macOS.');
  return;
}

/**
 * Install lsb-release on Ubuntu/Debian using APT.
 *
 * On most Ubuntu and Debian installations, lsb-release is pre-installed.
 * However, minimal installations or container images may not include it.
 * This function uses APT to install the lsb-release package, which provides
 * the lsb_release command.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if lsb_release command is already available
  // The command uses an underscore, not a hyphen
  if (isLsbReleaseInstalled()) {
    console.log('lsb-release is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest version
  // Using DEBIAN_FRONTEND=noninteractive prevents interactive prompts
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    // Log a warning but continue with installation attempt
    // The package may still install successfully from cached lists
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install lsb-release using APT
  // The -y flag automatically confirms the installation prompt
  console.log('Installing lsb-release via APT...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y lsb-release');

  if (installResult.code !== 0) {
    console.log('Failed to install lsb-release via APT.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  const verified = isLsbReleaseInstalled();
  if (!verified) {
    console.log('Installation may have failed: lsb_release command not found after install.');
    return;
  }

  console.log('lsb-release installed successfully.');
}

/**
 * Install lsb-release on Ubuntu running in WSL.
 *
 * WSL runs a real Linux distribution (typically Ubuntu), so lsb-release
 * is available and works exactly as it does on native Ubuntu. The installation
 * process is identical to native Ubuntu using APT.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  // The lsb-release package works identically in WSL
  await install_ubuntu();
}

/**
 * Install lsb-release on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so lsb-release installation follows
 * the same process as Ubuntu/Debian. On most Raspberry Pi OS installations,
 * lsb-release is pre-installed by default, but this function handles cases
 * where it may be missing.
 *
 * Note: On 64-bit Raspberry Pi OS, the Distributor ID may show "Debian"
 * instead of "Raspbian" - this is expected behavior.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if lsb_release command is already available
  if (isLsbReleaseInstalled()) {
    console.log('lsb-release is already installed, skipping...');
    return;
  }

  // Update package lists before installing
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install lsb-release using APT
  // Installation may take slightly longer on Raspberry Pi due to slower I/O
  console.log('Installing lsb-release via APT...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y lsb-release');

  if (installResult.code !== 0) {
    console.log('Failed to install lsb-release via APT.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify the installation succeeded
  const verified = isLsbReleaseInstalled();
  if (!verified) {
    console.log('Installation may have failed: lsb_release command not found after install.');
    return;
  }

  console.log('lsb-release installed successfully.');
}

/**
 * Install lsb-release on Amazon Linux.
 *
 * lsb-release is NOT available on Amazon Linux 2023 (AL2023). Amazon Linux
 * has transitioned to the /etc/os-release standard, which is the modern
 * replacement for LSB-based distribution identification. This function
 * gracefully returns without error, informing the user that the tool is
 * not available on this platform.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // lsb-release is not available on Amazon Linux 2023
  // Amazon Linux uses /etc/os-release for distribution information instead
  // Return gracefully without throwing an error
  console.log('lsb-release is not available for Amazon Linux.');
  return;
}

/**
 * Install lsb-release on Windows.
 *
 * lsb-release is NOT available on Windows because Windows is not a Linux
 * distribution and does not implement the Linux Standard Base. This function
 * gracefully returns without error, informing the user that the tool is
 * not available on this platform.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // lsb-release is a Linux-only utility and is not available on Windows
  // Return gracefully without throwing an error
  console.log('lsb-release is not available for Windows.');
  return;
}

/**
 * Install lsb-release on Git Bash.
 *
 * lsb-release is NOT available in Git Bash. Git Bash is a terminal emulator
 * that runs on Windows and provides a Bash shell environment, but it is not
 * a full Linux environment and does not include Linux-specific system utilities
 * like lsb_release. This function gracefully returns without error.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // lsb-release is a Linux-only utility and is not available in Git Bash
  // Git Bash runs on Windows and does not support Linux-specific utilities
  // Return gracefully without throwing an error
  console.log('lsb-release is not available for Git Bash.');
  return;
}

// -----------------------------------------------------------------------------
// Main Installation Entry Point
// -----------------------------------------------------------------------------

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically detects the current platform using the os.detect()
 * utility and dispatches to the appropriate platform-specific installation function.
 *
 * Supported platforms (where lsb-release can be installed):
 * - Ubuntu/Debian (APT)
 * - Ubuntu on WSL (APT)
 * - Raspberry Pi OS (APT)
 *
 * Unsupported platforms (gracefully returns with informational message):
 * - macOS (not a Linux distribution)
 * - Windows (not a Linux distribution)
 * - Amazon Linux (uses /etc/os-release instead)
 * - Git Bash (runs on Windows, not a Linux environment)
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their corresponding installer functions
  // Each platform has a dedicated function that either installs lsb-release
  // or returns gracefully with an informational message if not supported
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
  // Do not throw an error - just log a message and return
  if (!installer) {
    console.log(`lsb-release is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
  await installer();
}

// -----------------------------------------------------------------------------
// Module Exports
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Direct Execution Handler
// -----------------------------------------------------------------------------

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
