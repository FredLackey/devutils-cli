#!/usr/bin/env node

/**
 * @fileoverview Install apt-transport-https - HTTPS transport for APT package manager.
 *
 * apt-transport-https is a package that historically enabled the APT package manager
 * on Debian-based Linux distributions to download packages over HTTPS connections.
 *
 * IMPORTANT: As of APT version 1.5 (included in Ubuntu 18.04+ and Debian 10+), HTTPS
 * support is built directly into APT. The apt-transport-https package now exists only
 * as a "dummy transitional package" for backward compatibility with older scripts.
 *
 * This installer:
 * - On modern systems (APT 1.5+): Reports that HTTPS is already supported
 * - On legacy systems (APT < 1.5): Installs the apt-transport-https package
 * - On non-APT platforms: Gracefully reports the package is not applicable
 *
 * @module installs/apt-transport-https
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const apt = require('../utils/ubuntu/apt');

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/**
 * Minimum APT version that has built-in HTTPS support.
 * APT 1.5 introduced native HTTPS transport, making apt-transport-https unnecessary.
 */
const APT_HTTPS_BUILTIN_VERSION = 1.5;

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Gets the installed APT version number.
 *
 * Parses the output of `apt --version` to extract the major.minor version number.
 * Example output: "apt 2.4.8 (amd64)" -> returns 2.4
 *
 * @returns {Promise<number|null>} The APT version as a float (e.g., 2.4), or null if unavailable
 */
async function getAptVersion() {
  // Execute apt --version to get version information
  const result = await shell.exec('apt --version 2>/dev/null');

  // If the command failed, APT is not available
  if (result.code !== 0 || !result.stdout) {
    return null;
  }

  // Parse the version number from output like "apt 2.4.8 (amd64)"
  // We use a regex to capture the major.minor portion of the version
  const versionMatch = result.stdout.match(/apt\s+(\d+\.\d+)/i);

  if (!versionMatch) {
    return null;
  }

  // Convert the version string to a float for numeric comparison
  return parseFloat(versionMatch[1]);
}

/**
 * Checks if the installed APT version has built-in HTTPS support.
 *
 * APT version 1.5 and later include native HTTPS transport, meaning the
 * apt-transport-https package is unnecessary on these systems.
 *
 * @returns {Promise<boolean>} True if APT has built-in HTTPS support
 */
async function hasBuiltInHttpsSupport() {
  const aptVersion = await getAptVersion();

  // If we cannot determine the APT version, assume we need the package
  // (conservative approach for compatibility)
  if (aptVersion === null) {
    return false;
  }

  // APT 1.5+ has built-in HTTPS support
  return aptVersion >= APT_HTTPS_BUILTIN_VERSION;
}

/**
 * Checks if the HTTPS transport method is available in APT.
 *
 * This function verifies that APT can use HTTPS by checking for the
 * presence of the https method in /usr/lib/apt/methods/.
 *
 * @returns {Promise<boolean>} True if HTTPS transport is available
 */
async function isHttpsTransportAvailable() {
  // Check if the https method file exists in APT's methods directory
  const result = await shell.exec('ls /usr/lib/apt/methods/https 2>/dev/null');
  return result.code === 0;
}

// -----------------------------------------------------------------------------
// Platform-Specific Installation Functions
// -----------------------------------------------------------------------------

/**
 * Install apt-transport-https on macOS.
 *
 * This package is not applicable to macOS. macOS uses Homebrew for package
 * management, which natively supports HTTPS repositories without any
 * additional configuration.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // macOS uses Homebrew, not APT - this package is not applicable
  console.log('apt-transport-https is not available for macOS.');
  return;
}

/**
 * Install apt-transport-https on Ubuntu/Debian using APT.
 *
 * On modern Ubuntu (18.04+) and Debian (10+) systems, HTTPS support is built
 * into APT itself, making this package unnecessary. This function checks the
 * APT version and either:
 * - Reports that HTTPS is already supported (APT 1.5+)
 * - Installs the transitional package (APT < 1.5)
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // First, check if APT is available on this system
  if (!apt.isInstalled()) {
    console.log('APT is not available on this system.');
    return;
  }

  // Check if this system has built-in HTTPS support (APT 1.5+)
  const hasBuiltIn = await hasBuiltInHttpsSupport();

  if (hasBuiltIn) {
    // Modern system - HTTPS is built into APT
    console.log('HTTPS transport is already built into APT on this system.');
    console.log('The apt-transport-https package is not required.');

    // Verify HTTPS transport is actually working
    const httpsAvailable = await isHttpsTransportAvailable();
    if (httpsAvailable) {
      console.log('Verified: HTTPS transport is available and working.');
    }
    return;
  }

  // Legacy system - check if apt-transport-https is already installed
  const isInstalled = await apt.isPackageInstalled('apt-transport-https');
  if (isInstalled) {
    console.log('apt-transport-https is already installed, skipping...');
    return;
  }

  // Update package lists before installing
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install apt-transport-https on this legacy system
  console.log('Installing apt-transport-https via APT...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y apt-transport-https');

  if (installResult.code !== 0) {
    console.log('Failed to install apt-transport-https.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify the installation succeeded
  const verified = await isHttpsTransportAvailable();
  if (!verified) {
    console.log('Installation may have failed: HTTPS transport not found after install.');
    return;
  }

  console.log('apt-transport-https installed successfully.');
}

/**
 * Install apt-transport-https on Ubuntu running in WSL.
 *
 * WSL Ubuntu installations follow the same process as native Ubuntu using APT.
 * Modern WSL distributions include APT 1.5+ with built-in HTTPS support.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();
}

/**
 * Install apt-transport-https on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so the installation follows the same
 * process as Ubuntu/Debian. Modern Raspberry Pi OS (Buster and later) includes
 * APT 1.5+ with built-in HTTPS support.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install apt-transport-https on Amazon Linux.
 *
 * This package is not applicable to Amazon Linux. Amazon Linux uses DNF
 * (Amazon Linux 2023) or YUM (Amazon Linux 2) as its package manager,
 * not APT. Both DNF and YUM natively support HTTPS repositories.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Amazon Linux uses DNF/YUM, not APT - this package is not applicable
  console.log('apt-transport-https is not available for Amazon Linux.');
  return;
}

/**
 * Install apt-transport-https on Windows.
 *
 * This package is not applicable to Windows. Windows uses Chocolatey or
 * winget for command-line package management, not APT. Both package managers
 * natively support HTTPS for all operations.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Windows uses Chocolatey/winget, not APT - this package is not applicable
  console.log('apt-transport-https is not available for Windows.');
  return;
}

/**
 * Install apt-transport-https on Git Bash.
 *
 * This package is not applicable to Git Bash. Git Bash is a terminal emulator
 * for Windows that provides a Unix-like command-line environment but does not
 * include or use APT for package management.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Git Bash does not use APT - this package is not applicable
  console.log('apt-transport-https is not available for Git Bash.');
  return;
}

// -----------------------------------------------------------------------------
// Main Installation Entry Point
// -----------------------------------------------------------------------------

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. apt-transport-https is only
 * applicable to Debian-based systems (Ubuntu, Debian, Raspberry Pi OS, WSL).
 *
 * Supported platforms:
 * - Ubuntu/Debian (APT) - installs package on legacy systems, reports built-in on modern
 * - Raspberry Pi OS (APT) - same as Ubuntu
 * - Ubuntu on WSL (APT) - same as Ubuntu
 *
 * Not applicable platforms (returns gracefully):
 * - macOS (uses Homebrew)
 * - Amazon Linux/RHEL (uses DNF/YUM)
 * - Windows (uses Chocolatey/winget)
 * - Git Bash (no package manager)
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their corresponding installer functions
  // Multiple platform types can map to the same installer (e.g., debian and ubuntu)
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
    console.log(`apt-transport-https is not available for ${platform.type}.`);
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
