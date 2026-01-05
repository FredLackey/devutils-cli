#!/usr/bin/env node

/**
 * @fileoverview Install software-properties-common - repository management utilities for Debian/Ubuntu.
 *
 * software-properties-common provides utilities for managing software repositories on
 * Debian-based Linux distributions. The most important utility it provides is
 * `add-apt-repository`, which simplifies adding PPAs (Personal Package Archives) and
 * third-party repositories to your system.
 *
 * Key functionality:
 * - add-apt-repository: Command to add PPAs and custom APT repositories
 * - D-Bus backend: System service for managing software sources programmatically
 * - Repository management scripts: Python utilities for modifying sources.list
 *
 * Platform availability:
 * - Ubuntu/Debian/Raspbian: Full support via APT
 * - Ubuntu on WSL: Full support via APT (same as native Ubuntu)
 * - macOS: Not available (Homebrew uses 'brew tap' for equivalent functionality)
 * - Amazon Linux: Not available (use 'dnf config-manager' from dnf-plugins-core)
 * - Windows: Not available (use Chocolatey 'choco source' or winget 'winget source')
 * - Git Bash: Not available (terminal emulator, no Linux package management)
 *
 * @module installs/software-properties-common
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const apt = require('../utils/ubuntu/apt');

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Checks if add-apt-repository command is available in the system PATH.
 * This is the primary indicator that software-properties-common is installed.
 *
 * @returns {boolean} - True if add-apt-repository command exists
 */
function isAddAptRepositoryInstalled() {
  return shell.commandExists('add-apt-repository');
}

// -----------------------------------------------------------------------------
// Platform-Specific Installation Functions
// -----------------------------------------------------------------------------

/**
 * Install software-properties-common on macOS.
 *
 * software-properties-common is a Debian/Ubuntu-specific package and is not
 * available on macOS. Homebrew provides equivalent repository management
 * functionality through its built-in 'brew tap' command.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // software-properties-common is a Debian/Ubuntu-specific package
  // macOS uses Homebrew's 'brew tap' for equivalent functionality
  console.log('software-properties-common is not available for macOS.');
  return;
}

/**
 * Install software-properties-common on Ubuntu/Debian using APT.
 *
 * software-properties-common is a meta-package that installs:
 * - add-apt-repository: Command-line tool for adding PPAs and repositories
 * - python3-software-properties: Python bindings for software-properties
 * - Related D-Bus services and management utilities
 *
 * This is commonly needed before adding third-party repositories or PPAs to
 * an Ubuntu/Debian system.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if software-properties-common is already installed by verifying
  // the add-apt-repository command exists
  if (isAddAptRepositoryInstalled()) {
    // Double-check by querying dpkg for the package to be thorough
    const packageInstalled = await apt.isPackageInstalled('software-properties-common');
    if (packageInstalled) {
      console.log('software-properties-common is already installed, skipping...');
      return;
    }
  }

  console.log('Installing software-properties-common via APT...');

  // Update package lists first to ensure we have the latest package information
  // This is important because the package may not be in the local cache
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package lists: ${updateResult.stderr}`);
  }

  // Install software-properties-common with non-interactive mode and auto-confirm
  // DEBIAN_FRONTEND=noninteractive prevents any interactive prompts
  console.log('Installing software-properties-common package...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common');
  if (installResult.code !== 0) {
    throw new Error(`Failed to install software-properties-common: ${installResult.stderr}`);
  }

  // Verify installation succeeded by checking if add-apt-repository is now available
  if (!isAddAptRepositoryInstalled()) {
    throw new Error('Installation completed but add-apt-repository not found in PATH.');
  }

  console.log('software-properties-common installed successfully.');
}

/**
 * Install software-properties-common on Ubuntu running in WSL.
 *
 * WSL Ubuntu installations follow the same process as native Ubuntu using APT.
 * The package provides full functionality within the WSL environment.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  // Check if software-properties-common is already installed by verifying
  // the add-apt-repository command exists
  if (isAddAptRepositoryInstalled()) {
    // Double-check by querying dpkg for the package to be thorough
    const packageInstalled = await apt.isPackageInstalled('software-properties-common');
    if (packageInstalled) {
      console.log('software-properties-common is already installed, skipping...');
      return;
    }
  }

  console.log('Installing software-properties-common via APT (WSL)...');

  // Update package lists first to ensure we have the latest package information
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package lists: ${updateResult.stderr}`);
  }

  // Install software-properties-common with non-interactive mode and auto-confirm
  console.log('Installing software-properties-common package...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common');
  if (installResult.code !== 0) {
    throw new Error(`Failed to install software-properties-common: ${installResult.stderr}`);
  }

  // Verify installation succeeded by checking if add-apt-repository is now available
  if (!isAddAptRepositoryInstalled()) {
    throw new Error('Installation completed but add-apt-repository not found in PATH.');
  }

  console.log('software-properties-common installed successfully.');
}

/**
 * Install software-properties-common on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so software-properties-common installation
 * follows the same process as Ubuntu/Debian. However, note that Ubuntu PPAs may
 * not work on Raspberry Pi OS since PPAs are specifically built for Ubuntu.
 *
 * Note: Installation may take longer on Raspberry Pi due to slower I/O and
 * processor speeds (2-5 minutes on older Pi models).
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if software-properties-common is already installed by verifying
  // the add-apt-repository command exists
  if (isAddAptRepositoryInstalled()) {
    // Double-check by querying dpkg for the package to be thorough
    const packageInstalled = await apt.isPackageInstalled('software-properties-common');
    if (packageInstalled) {
      console.log('software-properties-common is already installed, skipping...');
      return;
    }
  }

  console.log('Installing software-properties-common via APT...');
  console.log('Note: Installation may take 2-5 minutes on Raspberry Pi.');

  // Update package lists first to ensure we have the latest package information
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package lists: ${updateResult.stderr}`);
  }

  // Install software-properties-common with non-interactive mode and auto-confirm
  console.log('Installing software-properties-common package...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common');
  if (installResult.code !== 0) {
    throw new Error(`Failed to install software-properties-common: ${installResult.stderr}`);
  }

  // Verify installation succeeded by checking if add-apt-repository is now available
  if (!isAddAptRepositoryInstalled()) {
    throw new Error('Installation completed but add-apt-repository not found in PATH.');
  }

  console.log('software-properties-common installed successfully.');
  console.log('');
  console.log('Note: Ubuntu PPAs may not work on Raspberry Pi OS since PPAs are');
  console.log('built for Ubuntu. Consider using Raspberry Pi OS-specific repositories');
  console.log('or official Debian packages instead.');
}

/**
 * Install software-properties-common on Amazon Linux/RHEL.
 *
 * software-properties-common is a Debian/Ubuntu-specific package and is not
 * available on Amazon Linux or RHEL. Amazon Linux uses dnf-plugins-core which
 * provides 'dnf config-manager' for equivalent repository management functionality.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // software-properties-common is a Debian/Ubuntu-specific package
  // Amazon Linux uses 'dnf config-manager' from dnf-plugins-core for equivalent functionality
  console.log('software-properties-common is not available for Amazon Linux.');
  return;
}

/**
 * Install software-properties-common on Windows.
 *
 * software-properties-common is a Debian/Ubuntu-specific package and is not
 * available on Windows. Windows uses Chocolatey ('choco source') or winget
 * ('winget source') for equivalent repository management functionality.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // software-properties-common is a Debian/Ubuntu-specific package
  // Windows uses 'choco source' or 'winget source' for equivalent functionality
  console.log('software-properties-common is not available for Windows.');
  return;
}

/**
 * Install software-properties-common on Git Bash.
 *
 * Git Bash is a terminal emulator on Windows that does not support Debian
 * package management. software-properties-common cannot be installed in Git Bash.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Git Bash is a terminal emulator that does not include Linux package management
  console.log('software-properties-common is not available for Git Bash.');
  return;
}

// -----------------------------------------------------------------------------
// Eligibility Check
// -----------------------------------------------------------------------------

/**
 * Check if this installer is supported on the current platform.
 * software-properties-common is only available on Debian-based Linux distributions.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['ubuntu', 'debian', 'wsl', 'raspbian'].includes(platform.type);
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
 * Supported platforms:
 * - ubuntu/debian: Full support via APT
 * - raspbian: Full support via APT (with PPA compatibility notes)
 * - wsl: Full support via APT (same as native Ubuntu)
 *
 * Unsupported platforms (graceful message, no error):
 * - macos: Not available (use 'brew tap' for equivalent functionality)
 * - amazon_linux/rhel/fedora: Not available (use 'dnf config-manager')
 * - windows: Not available (use 'choco source' or 'winget source')
 * - gitbash: Not available (terminal emulator only)
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installation functions
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

  // Find the appropriate installer for this platform
  const installer = installers[platform.type];

  // Handle truly unknown platforms gracefully (no error, just a message)
  if (!installer) {
    console.log(`software-properties-common is not available for ${platform.type}.`);
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
  isEligible,
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
