#!/usr/bin/env node

/**
 * @fileoverview Install Cursor - AI-powered code editor built on VS Code.
 * @module installs/cursor
 *
 * Cursor is available for macOS, Windows, and Linux (including Raspberry Pi OS
 * and Amazon Linux/RHEL). This installer handles platform detection and uses
 * the appropriate package manager or direct download for each platform.
 *
 * Supported platforms:
 * - macOS: Homebrew cask
 * - Ubuntu/Debian: Direct .deb download from cursor.com
 * - Raspberry Pi OS: Direct .deb download (ARM64 only, requires 64-bit OS)
 * - Amazon Linux/RHEL: Direct .rpm download from cursor.com
 * - Windows: winget (preferred) or Chocolatey
 * - WSL: Installs on Windows host via winget
 * - Git Bash: Installs on Windows host via winget
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const winget = require('../utils/windows/winget');
const macosApps = require('../utils/macos/apps');

/**
 * The name of the Cursor application bundle on macOS
 * Used for checking if Cursor is already installed
 */
const MACOS_APP_NAME = 'Cursor';

/**
 * The Homebrew cask name for Cursor
 */
const HOMEBREW_CASK_NAME = 'cursor';

/**
 * The winget package ID for Cursor
 */
const WINGET_PACKAGE_ID = 'Anysphere.Cursor';

/**
 * Download URLs for Cursor packages by platform
 * These URLs redirect to the latest stable release
 */
const DOWNLOAD_URLS = {
  'deb-x64': 'https://www.cursor.com/api/download?platform=linux-deb-x64&releaseTrack=stable',
  'deb-arm64': 'https://www.cursor.com/api/download?platform=linux-deb-arm64&releaseTrack=stable',
  'rpm-x64': 'https://www.cursor.com/api/download?platform=linux-rpm-x64&releaseTrack=stable',
  'rpm-arm64': 'https://www.cursor.com/api/download?platform=linux-rpm-arm64&releaseTrack=stable'
};

/**
 * Install Cursor on macOS using Homebrew
 *
 * This function checks if Cursor is already installed by looking for
 * /Applications/Cursor.app. If not installed, it uses Homebrew to install
 * the Cursor cask.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Cursor is already installed by looking for the .app bundle
  const isInstalled = macosApps.isAppInstalled(MACOS_APP_NAME);
  if (isInstalled) {
    console.log('Cursor is already installed.');
    return;
  }

  // Verify Homebrew is available before proceeding
  if (!brew.isInstalled()) {
    console.log('Homebrew is required to install Cursor on macOS.');
    console.log('Please install Homebrew first: https://brew.sh');
    return;
  }

  console.log('Installing Cursor via Homebrew...');

  // Install using the Homebrew cask
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    console.log('Failed to install Cursor.');
    console.log(result.output);
    return;
  }

  // Verify installation succeeded by checking for the app bundle
  const verifyInstalled = macosApps.isAppInstalled(MACOS_APP_NAME);
  if (verifyInstalled) {
    console.log('Cursor installed successfully.');
  } else {
    console.log('Installation completed but Cursor.app was not found in /Applications.');
    console.log('You may need to run the installer again or install manually.');
  }
}

/**
 * Install Cursor on Ubuntu/Debian using direct .deb download
 *
 * This function downloads the latest Cursor .deb package from the official
 * download URL and installs it using apt-get. It automatically detects
 * whether the system is x64 or ARM64 and downloads the appropriate package.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if Cursor is already installed by checking for the cursor command
  const isInstalled = shell.commandExists('cursor');
  if (isInstalled) {
    console.log('Cursor is already installed.');
    return;
  }

  // Determine the correct package URL based on system architecture
  const arch = os.getArch();
  let downloadUrl;

  if (arch === 'arm64') {
    downloadUrl = DOWNLOAD_URLS['deb-arm64'];
  } else if (arch === 'x64') {
    downloadUrl = DOWNLOAD_URLS['deb-x64'];
  } else {
    console.log(`Cursor is not available for ${arch} architecture on Ubuntu/Debian.`);
    return;
  }

  console.log('Downloading Cursor .deb package...');

  // Download the .deb package to a temporary location
  const downloadResult = await shell.exec(
    `curl -fsSL "${downloadUrl}" -o /tmp/cursor.deb`
  );

  if (downloadResult.code !== 0) {
    console.log('Failed to download Cursor package.');
    console.log(downloadResult.stderr);
    return;
  }

  console.log('Installing Cursor...');

  // Install the downloaded package using apt-get
  // DEBIAN_FRONTEND=noninteractive ensures no prompts during installation
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/cursor.deb'
  );

  // Clean up the downloaded package regardless of installation result
  await shell.exec('rm -f /tmp/cursor.deb');

  if (installResult.code !== 0) {
    console.log('Failed to install Cursor.');
    console.log(installResult.stderr);
    return;
  }

  // Verify installation succeeded
  const verifyInstalled = shell.commandExists('cursor');
  if (verifyInstalled) {
    console.log('Cursor installed successfully.');
  } else {
    console.log('Installation completed but cursor command was not found.');
    console.log('You may need to restart your terminal or install the shell command from within Cursor.');
  }
}

/**
 * Install Cursor on Raspberry Pi OS using direct .deb download
 *
 * This function is similar to install_ubuntu but specifically handles
 * Raspberry Pi OS. It requires a 64-bit ARM64 system - Cursor does not
 * support 32-bit ARM (armv7l) systems.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if Cursor is already installed
  const isInstalled = shell.commandExists('cursor');
  if (isInstalled) {
    console.log('Cursor is already installed.');
    return;
  }

  // Raspberry Pi requires 64-bit ARM64 architecture
  // 32-bit Raspberry Pi OS (armv7l) is not supported
  const arch = os.getArch();
  if (arch !== 'arm64') {
    console.log('Cursor requires 64-bit Raspberry Pi OS (ARM64/aarch64).');
    console.log(`Your system architecture is ${arch}.`);
    console.log('Please install 64-bit Raspberry Pi OS to use Cursor.');
    return;
  }

  console.log('Downloading Cursor .deb package for ARM64...');

  // Download the ARM64 .deb package
  const downloadResult = await shell.exec(
    `curl -fsSL "${DOWNLOAD_URLS['deb-arm64']}" -o /tmp/cursor.deb`
  );

  if (downloadResult.code !== 0) {
    console.log('Failed to download Cursor package.');
    console.log(downloadResult.stderr);
    return;
  }

  console.log('Installing Cursor...');

  // Install the downloaded package
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/cursor.deb'
  );

  // Clean up the downloaded package
  await shell.exec('rm -f /tmp/cursor.deb');

  if (installResult.code !== 0) {
    console.log('Failed to install Cursor.');
    console.log(installResult.stderr);
    return;
  }

  // Verify installation
  const verifyInstalled = shell.commandExists('cursor');
  if (verifyInstalled) {
    console.log('Cursor installed successfully.');
  } else {
    console.log('Installation completed but cursor command was not found.');
    console.log('You may need to restart your terminal or install the shell command from within Cursor.');
  }
}

/**
 * Install Cursor on Amazon Linux/RHEL using direct .rpm download
 *
 * This function downloads the latest Cursor .rpm package and installs it
 * using dnf (preferred) or yum. It supports both x64 and ARM64 architectures.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if Cursor is already installed
  const isInstalled = shell.commandExists('cursor');
  if (isInstalled) {
    console.log('Cursor is already installed.');
    return;
  }

  // Determine the correct package URL based on system architecture
  const arch = os.getArch();
  let downloadUrl;

  if (arch === 'arm64') {
    downloadUrl = DOWNLOAD_URLS['rpm-arm64'];
  } else if (arch === 'x64') {
    downloadUrl = DOWNLOAD_URLS['rpm-x64'];
  } else {
    console.log(`Cursor is not available for ${arch} architecture on Amazon Linux/RHEL.`);
    return;
  }

  console.log('Downloading Cursor .rpm package...');

  // Download the .rpm package
  const downloadResult = await shell.exec(
    `curl -fsSL "${downloadUrl}" -o /tmp/cursor.rpm`
  );

  if (downloadResult.code !== 0) {
    console.log('Failed to download Cursor package.');
    console.log(downloadResult.stderr);
    return;
  }

  console.log('Installing Cursor...');

  // Detect package manager: prefer dnf over yum
  // dnf is the default on Amazon Linux 2023, RHEL 8+, and Fedora
  // yum is used on Amazon Linux 2 and older RHEL versions
  const useDnf = shell.commandExists('dnf');
  const packageManager = useDnf ? 'dnf' : 'yum';

  const installResult = await shell.exec(
    `sudo ${packageManager} install -y /tmp/cursor.rpm`
  );

  // Clean up the downloaded package
  await shell.exec('rm -f /tmp/cursor.rpm');

  if (installResult.code !== 0) {
    console.log('Failed to install Cursor.');
    console.log(installResult.stderr);
    return;
  }

  // Verify installation
  const verifyInstalled = shell.commandExists('cursor');
  if (verifyInstalled) {
    console.log('Cursor installed successfully.');
  } else {
    console.log('Installation completed but cursor command was not found.');
    console.log('You may need to restart your terminal or install the shell command from within Cursor.');
  }
}

/**
 * Install Cursor on Windows using winget (preferred) or Chocolatey
 *
 * This function uses winget to install Cursor on Windows. Winget is the
 * preferred package manager as it is built into Windows 10 1809+ and
 * Windows 11. If winget is not available, it will inform the user.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if Cursor is already installed via winget
  const isInstalledViaWinget = await winget.isPackageInstalled(WINGET_PACKAGE_ID);
  if (isInstalledViaWinget) {
    console.log('Cursor is already installed.');
    return;
  }

  // Also check if cursor command exists (may have been installed manually)
  const cursorCommandExists = shell.commandExists('cursor');
  if (cursorCommandExists) {
    console.log('Cursor is already installed.');
    return;
  }

  // Verify winget is available
  if (!winget.isInstalled()) {
    console.log('winget is required to install Cursor on Windows.');
    console.log('winget is included with Windows 10 version 1809 and later.');
    console.log('You can also install it from the Microsoft Store (App Installer).');
    return;
  }

  console.log('Installing Cursor via winget...');

  // Install Cursor using winget with silent flags and auto-accept agreements
  const result = await winget.install(WINGET_PACKAGE_ID);

  if (!result.success) {
    console.log('Failed to install Cursor.');
    console.log(result.output);
    return;
  }

  console.log('Cursor installed successfully.');
  console.log('You may need to restart your terminal for the cursor command to be available.');
}

/**
 * Install Cursor on Ubuntu running in WSL (Windows Subsystem for Linux)
 *
 * For WSL, Cursor should be installed on the Windows host and then connected
 * to WSL using Cursor's remote development capabilities. This function installs
 * Cursor on the Windows host via winget.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // Check if Cursor is already installed on Windows host
  // We use winget.exe to query from within WSL
  const checkResult = await shell.exec(
    `winget.exe list --exact --id "${WINGET_PACKAGE_ID}" 2>/dev/null`
  );

  if (checkResult.code === 0 && checkResult.stdout.includes(WINGET_PACKAGE_ID)) {
    console.log('Cursor is already installed on Windows.');
    console.log('To connect to WSL, open Cursor on Windows and use "Connect to WSL" from the Remote menu.');
    return;
  }

  // Verify winget is accessible from WSL
  const wingetExists = shell.commandExists('winget.exe');
  if (!wingetExists) {
    console.log('winget is required to install Cursor from WSL.');
    console.log('winget should be available if you are running Windows 10 1809+ or Windows 11.');
    return;
  }

  console.log('Installing Cursor on Windows host via winget...');

  // Install Cursor on Windows using winget.exe from within WSL
  const installResult = await shell.exec(
    `winget.exe install --id "${WINGET_PACKAGE_ID}" --silent --accept-package-agreements --accept-source-agreements`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Cursor.');
    console.log(installResult.stderr);
    return;
  }

  console.log('Cursor installed successfully on Windows.');
  console.log('To use Cursor with WSL:');
  console.log('  1. Open Cursor on Windows');
  console.log('  2. Click the Remote icon in the bottom-left corner');
  console.log('  3. Select "Connect to WSL" and choose your distribution');
}

/**
 * Install Cursor on Windows via Git Bash
 *
 * Git Bash runs on Windows, so we install Cursor as a Windows application
 * using winget. The cursor command will then be available in Git Bash.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if Cursor is already installed
  // Try winget first (works in Git Bash as winget.exe)
  const checkResult = await shell.exec(
    `winget.exe list --exact --id "${WINGET_PACKAGE_ID}" 2>/dev/null`
  );

  if (checkResult.code === 0 && checkResult.stdout.includes(WINGET_PACKAGE_ID)) {
    console.log('Cursor is already installed.');
    return;
  }

  // Verify winget is accessible
  const wingetExists = shell.commandExists('winget.exe');
  if (!wingetExists) {
    console.log('winget is required to install Cursor.');
    console.log('winget should be available if you are running Windows 10 1809+ or Windows 11.');
    return;
  }

  console.log('Installing Cursor via winget...');

  // Install Cursor using winget.exe
  const installResult = await shell.exec(
    `winget.exe install --id "${WINGET_PACKAGE_ID}" --silent --accept-package-agreements --accept-source-agreements`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Cursor.');
    console.log(installResult.stderr);
    return;
  }

  console.log('Cursor installed successfully.');
  console.log('You may need to restart Git Bash for the cursor command to be available.');
}

/**
 * Check if Cursor is installed on the current platform.
 *
 * This function performs platform-specific checks to determine if Cursor
 * is already installed:
 * - macOS: Checks for Cursor.app in /Applications
 * - Windows/Git Bash/WSL: Checks for winget package
 * - Ubuntu/Debian/Raspberry Pi/Amazon Linux: Checks for cursor command
 *
 * @returns {Promise<boolean>} True if Cursor is installed
 */
async function isInstalled() {
  const platform = os.detect();

  // macOS: Check for Cursor.app
  if (platform.type === 'macos') {
    return macosApps.isAppInstalled(MACOS_APP_NAME);
  }

  // Windows: Check via winget
  if (platform.type === 'windows') {
    return await winget.isPackageInstalled(WINGET_PACKAGE_ID);
  }

  // WSL and Git Bash: Check via winget.exe
  if (platform.type === 'wsl' || platform.type === 'gitbash') {
    const checkResult = await shell.exec(
      `winget.exe list --exact --id "${WINGET_PACKAGE_ID}" 2>/dev/null`
    );
    return checkResult.code === 0 && checkResult.stdout.includes(WINGET_PACKAGE_ID);
  }

  // Ubuntu/Debian/Raspberry Pi/Amazon Linux: Check for cursor command
  if (['ubuntu', 'debian', 'raspbian', 'amazon_linux', 'rhel', 'fedora'].includes(platform.type)) {
    return shell.commandExists('cursor');
  }

  return false;
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Cursor can be installed on:
 * - macOS (via Homebrew cask)
 * - Ubuntu/Debian (via direct .deb download)
 * - Raspberry Pi OS (via direct .deb download, ARM64 only)
 * - Amazon Linux/RHEL/Fedora (via direct .rpm download)
 * - Windows (via winget)
 * - WSL (installs on Windows host via winget)
 * - Git Bash (installs on Windows host via winget)
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer
 *
 * This function uses os.detect() to determine the current platform and
 * delegates to the appropriate platform-specific installation function.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // Some platforms share installers (e.g., debian uses ubuntu installer)
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
    // For unsupported platforms, log a friendly message and return gracefully
    // Do NOT throw an error - per project requirements
    console.log(`Cursor is not available for ${platform.type}.`);
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
  install_gitbash
};

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
