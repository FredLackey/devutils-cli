#!/usr/bin/env node

/**
 * @fileoverview Install Beyond Compare across supported platforms.
 *
 * Beyond Compare is a powerful file and folder comparison utility developed by
 * Scooter Software. It enables users to compare files, folders, and even entire
 * drives with detailed side-by-side visualization of differences.
 *
 * IMPORTANT: Beyond Compare is commercial software requiring a license for
 * continued use after the 30-day trial period.
 *
 * PLATFORM SUPPORT:
 * - macOS: Supported via Homebrew Cask (Intel and Apple Silicon via Rosetta 2)
 * - Ubuntu/Debian: Supported via official .deb package
 * - Amazon Linux/RHEL: Supported via official .rpm package
 * - Windows: Supported via Chocolatey
 * - WSL (Ubuntu): Supported via official .deb package
 * - Git Bash: Uses Windows installation (inherits Windows PATH)
 * - Raspberry Pi OS: NOT SUPPORTED (ARM architecture not supported)
 *
 * @module installs/beyond-compare
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * The current version of Beyond Compare to install.
 * Update this when new versions are released.
 * @constant {string}
 */
const BEYOND_COMPARE_VERSION = '5.1.7.31736';

/**
 * Download URLs for platform-specific packages.
 * @constant {Object}
 */
const DOWNLOAD_URLS = {
  deb: `https://www.scootersoftware.com/files/bcompare-${BEYOND_COMPARE_VERSION}_amd64.deb`,
  rpm: `https://www.scootersoftware.com/files/bcompare-${BEYOND_COMPARE_VERSION.replace('.31736', '')}.31736.x86_64.rpm`
};

/**
 * Install Beyond Compare on macOS using Homebrew Cask.
 *
 * Beyond Compare is available as a Homebrew Cask. On Apple Silicon Macs,
 * Rosetta 2 is used automatically since Beyond Compare is Intel-only.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Homebrew is available
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Visit https://brew.sh for installation instructions.');
    return;
  }

  // Check if Beyond Compare is already installed by looking for the app bundle
  const isInstalled = macosApps.isAppInstalled('Beyond Compare');
  if (isInstalled) {
    const version = macosApps.getAppVersion('Beyond Compare');
    console.log(`Beyond Compare is already installed${version ? ` (version ${version})` : ''}, skipping...`);
    return;
  }

  // Also check via Homebrew cask list for completeness
  const isCaskInstalled = await brew.isCaskInstalled('beyond-compare');
  if (isCaskInstalled) {
    console.log('Beyond Compare is already installed via Homebrew, skipping...');
    return;
  }

  console.log('Installing Beyond Compare via Homebrew Cask...');

  // Install Beyond Compare using Homebrew Cask
  const result = await brew.installCask('beyond-compare');

  if (!result.success) {
    console.log('Failed to install Beyond Compare.');
    console.log(result.output);
    return;
  }

  // Verify installation by checking for the app bundle
  const verified = macosApps.isAppInstalled('Beyond Compare');
  if (!verified) {
    console.log('Installation may have failed: Beyond Compare.app not found in /Applications.');
    return;
  }

  console.log('Beyond Compare installed successfully.');
  console.log('');
  console.log('To enable command-line tools, open Beyond Compare and select:');
  console.log('  Beyond Compare menu > Install Command Line Tools');
}

/**
 * Install Beyond Compare on Ubuntu/Debian using the official .deb package.
 *
 * The installation downloads the .deb package directly from Scooter Software
 * and installs it using apt-get. This also configures the Scooter Software
 * repository for future updates.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if Beyond Compare is already installed
  const isInstalled = shell.commandExists('bcompare');
  if (isInstalled) {
    // Get version for display
    const versionResult = await shell.exec('bcompare --version 2>/dev/null | head -1');
    const version = versionResult.stdout.trim();
    console.log(`Beyond Compare is already installed${version ? ` (${version})` : ''}, skipping...`);
    return;
  }

  // Check if wget is available for downloading the package
  if (!shell.commandExists('wget')) {
    console.log('wget is not available. Installing wget first...');
    const wgetResult = await apt.install('wget');
    if (!wgetResult.success) {
      console.log('Failed to install wget. Cannot proceed with Beyond Compare installation.');
      return;
    }
  }

  console.log('Installing Beyond Compare...');

  // Download the .deb package to a temporary location
  const downloadResult = await shell.exec(
    `wget -q -O /tmp/bcompare.deb "${DOWNLOAD_URLS.deb}"`
  );

  if (downloadResult.code !== 0) {
    console.log('Failed to download Beyond Compare package.');
    console.log(downloadResult.stderr);
    return;
  }

  // Update apt package lists
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: apt-get update failed, continuing anyway...');
  }

  // Install the downloaded .deb package
  console.log('Installing Beyond Compare package...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/bcompare.deb'
  );

  // Clean up the downloaded package
  await shell.exec('rm -f /tmp/bcompare.deb');

  if (installResult.code !== 0) {
    console.log('Failed to install Beyond Compare.');
    console.log(installResult.stderr);
    return;
  }

  // Verify installation
  const verified = shell.commandExists('bcompare');
  if (!verified) {
    console.log('Installation may have failed: bcompare command not found.');
    return;
  }

  console.log('Beyond Compare installed successfully.');
}

/**
 * Install Beyond Compare on Ubuntu running in WSL.
 *
 * WSL Ubuntu follows the same installation process as native Ubuntu since
 * Beyond Compare runs as a Linux application. Requires WSLg (Windows 11)
 * or an X server (Windows 10) for GUI support.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same installation as native Ubuntu
  await install_ubuntu();

  // Provide additional guidance for WSL-specific setup
  console.log('');
  console.log('Note: Beyond Compare requires a graphical display to run.');
  console.log('  - Windows 11: WSLg provides built-in GUI support.');
  console.log('  - Windows 10: Install an X server (e.g., VcXsrv) and set DISPLAY.');
}

/**
 * Install Beyond Compare on Raspberry Pi OS.
 *
 * IMPORTANT: Beyond Compare does NOT support ARM architecture. This function
 * gracefully informs the user that the software is not available rather than
 * failing with an error.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Beyond Compare does not support ARM architecture
  // Return gracefully without throwing an error
  console.log('Beyond Compare is not available for Raspberry Pi OS.');
  return;
}

/**
 * Install Beyond Compare on Amazon Linux or RHEL using the official .rpm package.
 *
 * The installation downloads the .rpm package directly from Scooter Software
 * and installs it using dnf (or yum on older systems). This also configures
 * the Scooter Software repository for future updates.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if Beyond Compare is already installed
  const isInstalled = shell.commandExists('bcompare');
  if (isInstalled) {
    // Get version for display
    const versionResult = await shell.exec('bcompare --version 2>/dev/null | head -1');
    const version = versionResult.stdout.trim();
    console.log(`Beyond Compare is already installed${version ? ` (${version})` : ''}, skipping...`);
    return;
  }

  // Determine which package manager to use (dnf preferred over yum)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : hasYum ? 'yum' : null;

  if (!packageManager) {
    console.log('Neither dnf nor yum package manager found. Cannot install Beyond Compare.');
    return;
  }

  // Check if wget is available for downloading the package
  if (!shell.commandExists('wget')) {
    console.log('wget is not available. Installing wget first...');
    const wgetResult = await shell.exec(`sudo ${packageManager} install -y wget`);
    if (wgetResult.code !== 0) {
      console.log('Failed to install wget. Cannot proceed with Beyond Compare installation.');
      return;
    }
  }

  console.log('Installing Beyond Compare...');

  // Download the .rpm package to a temporary location
  const downloadResult = await shell.exec(
    `wget -q -O /tmp/bcompare.rpm "${DOWNLOAD_URLS.rpm}"`
  );

  if (downloadResult.code !== 0) {
    console.log('Failed to download Beyond Compare package.');
    console.log(downloadResult.stderr);
    return;
  }

  // Install the downloaded .rpm package
  console.log('Installing Beyond Compare package...');
  const installResult = await shell.exec(
    `sudo ${packageManager} install -y /tmp/bcompare.rpm`
  );

  // Clean up the downloaded package
  await shell.exec('rm -f /tmp/bcompare.rpm');

  if (installResult.code !== 0) {
    console.log('Failed to install Beyond Compare.');
    console.log(installResult.stderr);
    return;
  }

  // Verify installation
  const verified = shell.commandExists('bcompare');
  if (!verified) {
    console.log('Installation may have failed: bcompare command not found.');
    return;
  }

  console.log('Beyond Compare installed successfully.');
}

/**
 * Install Beyond Compare on Windows using Chocolatey.
 *
 * The Chocolatey package automatically detects the system locale and installs
 * the appropriate language version. The bcompare command is added to the
 * system PATH during installation.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if Chocolatey is available
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('Visit https://chocolatey.org/install for installation instructions.');
    return;
  }

  // Check if Beyond Compare is already installed via Chocolatey
  const isChocoInstalled = await choco.isPackageInstalled('beyondcompare');
  if (isChocoInstalled) {
    const version = await choco.getPackageVersion('beyondcompare');
    console.log(`Beyond Compare is already installed${version ? ` (version ${version})` : ''}, skipping...`);
    return;
  }

  // Also check if bcompare command exists (may be installed via other means)
  const isCommandAvailable = shell.commandExists('bcompare');
  if (isCommandAvailable) {
    console.log('Beyond Compare is already installed, skipping...');
    return;
  }

  console.log('Installing Beyond Compare via Chocolatey...');

  // Install Beyond Compare using Chocolatey
  const result = await choco.install('beyondcompare');

  if (!result.success) {
    console.log('Failed to install Beyond Compare.');
    console.log(result.output);
    return;
  }

  console.log('Beyond Compare installed successfully.');
  console.log('');
  console.log('Note: You may need to open a new terminal window for the bcompare');
  console.log('command to be available in your PATH.');
}

/**
 * Install Beyond Compare on Git Bash (Windows).
 *
 * Git Bash on Windows inherits the Windows PATH, so once Beyond Compare is
 * installed on Windows via Chocolatey or the official installer, it is
 * automatically available in Git Bash. This function delegates to the
 * Windows installer.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Git Bash inherits the Windows PATH, so we use the Windows installer
  // Beyond Compare installed on Windows will be available in Git Bash
  console.log('Git Bash uses the Windows installation of Beyond Compare.');
  console.log('');

  // Check if bcompare is already available via Windows PATH
  const isAvailable = shell.commandExists('bcompare');
  if (isAvailable) {
    console.log('Beyond Compare is already available in Git Bash, skipping...');
    return;
  }

  // Attempt to install via Chocolatey if available
  if (choco.isInstalled()) {
    await install_windows();
    console.log('');
    console.log('Close and reopen Git Bash for PATH changes to take effect.');
  } else {
    console.log('Beyond Compare is not installed on Windows.');
    console.log('Please install Beyond Compare using Chocolatey or the official installer.');
    console.log('Once installed, it will be available in Git Bash.');
  }
}

/**
 * Check if Beyond Compare is installed on macOS.
 *
 * Beyond Compare can be installed via Homebrew Cask or manually. This function
 * checks for the application bundle in /Applications first, then falls back
 * to checking if it's listed in Homebrew casks.
 *
 * @returns {Promise<boolean>}
 */
async function isInstalled_macos() {
  // Option 1: Check for the application bundle (works for any installation method)
  const isAppPresent = macosApps.isAppInstalled('Beyond Compare');
  if (isAppPresent) {
    return true;
  }

  // Option 2: Check if installed via Homebrew cask
  const isCaskPresent = await brew.isCaskInstalled('beyond-compare');
  if (isCaskPresent) {
    return true;
  }

  // Option 3: Check if bcompare command exists (if CLI tools installed)
  return shell.commandExists('bcompare');
}

/**
 * Check if Beyond Compare is installed on Ubuntu/Debian.
 *
 * Beyond Compare installs the bcompare command to /usr/bin/bcompare.
 * This is the most reliable way to verify installation.
 *
 * @returns {Promise<boolean>}
 */
async function isInstalled_ubuntu() {
  // Check if the bcompare command is available
  return shell.commandExists('bcompare');
}

/**
 * Check if Beyond Compare is installed on Raspberry Pi OS.
 *
 * Beyond Compare does NOT support ARM architecture, so this always returns false.
 * Raspberry Pi devices use ARM processors which Beyond Compare does not support.
 *
 * @returns {Promise<boolean>}
 */
async function isInstalled_raspbian() {
  // Beyond Compare does not support ARM architecture
  // Always return false as it cannot be installed on Raspberry Pi
  return false;
}

/**
 * Check if Beyond Compare is installed on Amazon Linux/RHEL.
 *
 * Beyond Compare installs the bcompare command to /usr/bin/bcompare.
 * This is the most reliable way to verify installation across RHEL-based systems.
 *
 * @returns {Promise<boolean>}
 */
async function isInstalled_amazon_linux() {
  // Check if the bcompare command is available
  return shell.commandExists('bcompare');
}

/**
 * Check if Beyond Compare is installed on Windows.
 *
 * Beyond Compare can be installed via Chocolatey or the official installer.
 * This function checks both Chocolatey package status and the bcompare command.
 *
 * @returns {Promise<boolean>}
 */
async function isInstalled_windows() {
  // Option 1: Check if installed via Chocolatey
  const isChocoInstalled = await choco.isPackageInstalled('beyondcompare');
  if (isChocoInstalled) {
    return true;
  }

  // Option 2: Check if bcompare command exists (works for manual installations)
  return shell.commandExists('bcompare');
}

/**
 * Check if Beyond Compare is installed on Git Bash (Windows).
 *
 * Git Bash inherits the Windows PATH, so we check if the bcompare command
 * is available. This works whether Beyond Compare was installed via Chocolatey
 * or the official installer.
 *
 * @returns {Promise<boolean>}
 */
async function isInstalled_gitbash() {
  // Git Bash inherits Windows PATH, so check for bcompare command
  return shell.commandExists('bcompare');
}

/**
 * Check if Beyond Compare is installed on the current platform.
 *
 * This function detects the current operating system and delegates to the
 * appropriate platform-specific installation checker.
 *
 * @returns {Promise<boolean>}
 */
async function isInstalled() {
  const platform = os.detect();

  const checkers = {
    'macos': isInstalled_macos,
    'ubuntu': isInstalled_ubuntu,
    'debian': isInstalled_ubuntu,
    'wsl': isInstalled_ubuntu,
    'raspbian': isInstalled_raspbian,
    'amazon_linux': isInstalled_amazon_linux,
    'rhel': isInstalled_amazon_linux,
    'fedora': isInstalled_amazon_linux,
    'windows': isInstalled_windows,
    'gitbash': isInstalled_gitbash
  };

  const checker = checkers[platform.type];

  if (!checker) {
    // Unsupported platform
    return false;
  }

  return await checker();
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and delegates to the
 * appropriate platform-specific installer. On unsupported platforms (like
 * Raspberry Pi OS), it displays a friendly message and returns gracefully.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,
    'wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'windows': install_windows
  };

  const installer = installers[platform.type];

  if (!installer) {
    // Handle unsupported platforms gracefully without throwing an error
    console.log(`Beyond Compare is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

module.exports = {
  install,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash,
  isInstalled,
  isInstalled_macos,
  isInstalled_ubuntu,
  isInstalled_raspbian,
  isInstalled_amazon_linux,
  isInstalled_windows,
  isInstalled_gitbash
};

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
