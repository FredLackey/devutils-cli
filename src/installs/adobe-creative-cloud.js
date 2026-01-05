#!/usr/bin/env node

/**
 * @fileoverview Install Adobe Creative Cloud.
 * @module installs/adobe-creative-cloud
 *
 * Adobe Creative Cloud is a subscription-based service that provides access to
 * Adobe's suite of creative applications including Photoshop, Illustrator,
 * Premiere Pro, After Effects, Lightroom, InDesign, and many others.
 *
 * IMPORTANT PLATFORM LIMITATION:
 * Adobe Creative Cloud is officially supported ONLY on macOS and Windows.
 * There is NO native Linux support from Adobe, which affects Ubuntu, Debian,
 * Raspberry Pi OS, Amazon Linux, and other Linux distributions.
 *
 * For unsupported platforms, this installer will display a simple message
 * and return gracefully without error.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const winget = require('../utils/windows/winget');
const windowsShell = require('../utils/windows/shell');
const fs = require('fs');
const path = require('path');

/**
 * The name of the application bundle on macOS.
 * Adobe Creative Cloud installs into a subfolder structure.
 */
const MACOS_APP_PATH = '/Applications/Adobe Creative Cloud/Adobe Creative Cloud.app';

/**
 * The Homebrew cask name for Adobe Creative Cloud.
 */
const HOMEBREW_CASK_NAME = 'adobe-creative-cloud';

/**
 * The winget package ID for Adobe Creative Cloud.
 */
const WINGET_PACKAGE_ID = 'Adobe.CreativeCloud';

/**
 * Windows installation paths where Creative Cloud may be installed.
 * We check both 64-bit and 32-bit Program Files locations.
 */
const WINDOWS_INSTALL_PATHS = [
  'C:\\Program Files\\Adobe\\Adobe Creative Cloud\\ACC\\Creative Cloud.exe',
  'C:\\Program Files (x86)\\Adobe\\Adobe Creative Cloud\\ACC\\Creative Cloud.exe'
];

/**
 * Check if Adobe Creative Cloud is installed on macOS.
 *
 * Adobe Creative Cloud installs to a non-standard location
 * (/Applications/Adobe Creative Cloud/Adobe Creative Cloud.app)
 * so we need to check the path directly rather than using
 * the standard macosApps.isAppInstalled() function.
 *
 * @returns {boolean} True if Adobe Creative Cloud is installed, false otherwise
 */
function isInstalledMacOS() {
  return fs.existsSync(MACOS_APP_PATH);
}

/**
 * Check if Adobe Creative Cloud is installed on Windows.
 *
 * Checks both standard installation paths (64-bit and 32-bit Program Files).
 * This provides a reliable way to verify installation without relying on
 * winget's list command which can be slow.
 *
 * @returns {Promise<boolean>} True if Adobe Creative Cloud is installed, false otherwise
 */
async function isInstalledWindows() {
  // First, check if the executable exists in known locations
  for (const installPath of WINDOWS_INSTALL_PATHS) {
    const result = await windowsShell.execPowerShell(`Test-Path '${installPath}'`);
    if (result.success && result.stdout.trim().toLowerCase() === 'true') {
      return true;
    }
  }

  // Fallback: check via winget if the above checks fail
  // (in case of non-standard installation location)
  const isPackageInstalled = await winget.isPackageInstalled(WINGET_PACKAGE_ID);
  return isPackageInstalled;
}

/**
 * Install Adobe Creative Cloud on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - Administrator privileges (may prompt for password)
 *
 * The installation uses the Homebrew cask 'adobe-creative-cloud' which downloads
 * and installs the Creative Cloud Desktop App to /Applications/Adobe Creative Cloud/.
 *
 * NOTE: After installation, the user must sign in with their Adobe ID.
 * This sign-in step requires user interaction and cannot be automated.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Adobe Creative Cloud is already installed...');

  // Check if already installed using direct path check
  if (isInstalledMacOS()) {
    console.log('Adobe Creative Cloud is already installed, skipping installation.');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Adobe Creative Cloud.'
    );
  }

  console.log('Installing Adobe Creative Cloud via Homebrew...');

  // Install the cask with quiet mode to reduce output noise
  // Note: This may prompt for administrator password for system components
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Adobe Creative Cloud via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. If on Apple Silicon, try 'brew reinstall --cask adobe-creative-cloud'\n` +
      `  3. Clear Adobe preferences: rm -rf ~/Library/Preferences/com.adobe.AdobeCreativeCloud.plist`
    );
  }

  // Verify the installation succeeded by checking if the app exists
  if (!isInstalledMacOS()) {
    throw new Error(
      'Installation appeared to complete but Adobe Creative Cloud was not found at:\n' +
      `  ${MACOS_APP_PATH}\n\n` +
      'Please try reinstalling manually: brew reinstall --cask adobe-creative-cloud'
    );
  }

  console.log('Adobe Creative Cloud installed successfully.');
  console.log('');
  console.log('IMPORTANT: Please launch the Creative Cloud Desktop App and sign in');
  console.log('with your Adobe ID to complete setup. This step requires user interaction.');
}

/**
 * Install Adobe Creative Cloud on Ubuntu/Debian.
 *
 * IMPORTANT: Adobe Creative Cloud is NOT officially supported on Ubuntu or Debian.
 * Adobe does not provide native Linux packages, and there is no APT or Snap package.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Adobe Creative Cloud is not available for Ubuntu/Debian.');
}

/**
 * Install Adobe Creative Cloud on Raspberry Pi OS.
 *
 * IMPORTANT: Adobe Creative Cloud is NOT supported on Raspberry Pi OS.
 * Adobe only supports macOS and Windows, and does not provide ARM-compiled
 * versions for Linux.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Adobe Creative Cloud is not available for Raspberry Pi OS.');
}

/**
 * Install Adobe Creative Cloud on Amazon Linux/RHEL.
 *
 * IMPORTANT: Adobe Creative Cloud is NOT officially supported on Amazon Linux or RHEL.
 * Adobe does not provide packages for any Linux distribution.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Adobe Creative Cloud is not available for Amazon Linux/RHEL.');
}

/**
 * Install Adobe Creative Cloud on Windows using winget.
 *
 * Prerequisites:
 * - Windows 10 version 1903 or later (64-bit recommended)
 * - winget (Windows Package Manager) installed
 * - Administrator privileges
 *
 * The installation uses winget with silent flags to minimize user interaction.
 * However, after installation, the user must sign in with their Adobe ID.
 * This sign-in step cannot be automated without enterprise deployment tools.
 *
 * @returns {Promise<void>}
 * @throws {Error} If winget is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Adobe Creative Cloud is already installed...');

  // Check if already installed
  const alreadyInstalled = await isInstalledWindows();
  if (alreadyInstalled) {
    console.log('Adobe Creative Cloud is already installed, skipping installation.');
    return;
  }

  // Verify winget is available
  if (!winget.isInstalled()) {
    throw new Error(
      'winget (Windows Package Manager) is not available.\n\n' +
      'To install winget:\n' +
      '  1. Install "App Installer" from the Microsoft Store, or\n' +
      '  2. Run: dev install winget\n\n' +
      'Then retry installing Adobe Creative Cloud.'
    );
  }

  console.log('Installing Adobe Creative Cloud via winget...');

  // Install using winget with silent mode and auto-accept agreements
  const result = await winget.install(WINGET_PACKAGE_ID, {
    silent: true
  });

  if (!result.success) {
    throw new Error(
      `Failed to install Adobe Creative Cloud via winget.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'winget source reset --force' and retry\n` +
      `  2. Run with verbose output: winget install --id Adobe.CreativeCloud --verbose\n` +
      `  3. If conflicts exist, use Adobe's Creative Cloud Cleaner Tool\n` +
      `  4. Ensure you have administrator privileges`
    );
  }

  // Verify installation succeeded
  const verified = await isInstalledWindows();
  if (!verified) {
    throw new Error(
      'Installation appeared to complete but Adobe Creative Cloud was not found.\n\n' +
      'Please try reinstalling manually:\n' +
      '  winget uninstall --id Adobe.CreativeCloud --silent\n' +
      '  winget install --id Adobe.CreativeCloud --silent --accept-package-agreements --accept-source-agreements'
    );
  }

  console.log('Adobe Creative Cloud installed successfully.');
  console.log('');
  console.log('IMPORTANT: Please launch the Creative Cloud Desktop App and sign in');
  console.log('with your Adobe ID to complete setup. This step requires user interaction.');
}

/**
 * Install Adobe Creative Cloud from Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * IMPORTANT: Adobe Creative Cloud cannot run inside WSL because WSL runs a Linux
 * environment and Adobe does not support Linux.
 *
 * This function installs Adobe Creative Cloud on the Windows HOST instead, which
 * is the recommended approach. WSL applications can still interact with files
 * that Creative Cloud applications modify via /mnt/c/.
 *
 * @returns {Promise<void>}
 * @throws {Error} If winget is not available on Windows host or installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Adobe Creative Cloud cannot run inside WSL because WSL runs a Linux');
  console.log('environment and Adobe does not support Linux.');
  console.log('');
  console.log('Installing Adobe Creative Cloud on the Windows HOST instead...');
  console.log('');

  // Check if already installed on Windows host via PowerShell interop
  console.log('Checking if Adobe Creative Cloud is already installed on Windows host...');

  const checkResult = await shell.exec(
    `powershell.exe -NoProfile -Command "Test-Path 'C:\\Program Files\\Adobe\\Adobe Creative Cloud\\ACC\\Creative Cloud.exe'"`
  );

  if (checkResult.code === 0 && checkResult.stdout.trim().toLowerCase() === 'true') {
    console.log('Adobe Creative Cloud is already installed on the Windows host, skipping installation.');
    console.log('');
    console.log('You can access Windows Creative Cloud files from WSL at:');
    console.log('  /mnt/c/Users/<your-username>/Creative Cloud Files/');
    return;
  }

  // Install via PowerShell interop using winget on the Windows host
  console.log('Installing Adobe Creative Cloud on Windows host via winget...');

  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "winget install --id Adobe.CreativeCloud --silent --accept-package-agreements --accept-source-agreements"`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Adobe Creative Cloud on the Windows host.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure winget is installed on Windows\n` +
      `  2. Open a Windows PowerShell as Administrator and run:\n` +
      `     winget install --id Adobe.CreativeCloud --silent --accept-package-agreements --accept-source-agreements\n` +
      `  3. Check if you have administrator privileges`
    );
  }

  // Verify installation succeeded
  const verifyResult = await shell.exec(
    `powershell.exe -NoProfile -Command "Test-Path 'C:\\Program Files\\Adobe\\Adobe Creative Cloud\\ACC\\Creative Cloud.exe'"`
  );

  if (verifyResult.code !== 0 || verifyResult.stdout.trim().toLowerCase() !== 'true') {
    throw new Error(
      'Installation appeared to complete but Adobe Creative Cloud was not found on the Windows host.\n\n' +
      'Please install manually from Windows PowerShell:\n' +
      '  winget install --id Adobe.CreativeCloud --silent --accept-package-agreements --accept-source-agreements'
    );
  }

  console.log('Adobe Creative Cloud installed successfully on the Windows host.');
  console.log('');
  console.log('IMPORTANT: Please launch the Creative Cloud Desktop App from Windows');
  console.log('and sign in with your Adobe ID to complete setup.');
  console.log('');
  console.log('You can access Windows Creative Cloud files from WSL at:');
  console.log('  /mnt/c/Users/<your-username>/Creative Cloud Files/');
}

/**
 * Install Adobe Creative Cloud from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Adobe Creative Cloud
 * on the Windows host using winget via PowerShell interop.
 *
 * @returns {Promise<void>}
 * @throws {Error} If winget is not available or installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Adobe Creative Cloud on the Windows host...');
  console.log('');

  // Check if already installed on Windows host via PowerShell
  console.log('Checking if Adobe Creative Cloud is already installed...');

  const checkResult = await shell.exec(
    `powershell.exe -NoProfile -Command "Test-Path 'C:\\Program Files\\Adobe\\Adobe Creative Cloud\\ACC\\Creative Cloud.exe'"`
  );

  if (checkResult.code === 0 && checkResult.stdout.trim().toLowerCase() === 'true') {
    console.log('Adobe Creative Cloud is already installed, skipping installation.');
    return;
  }

  // Install via PowerShell using winget
  console.log('Installing Adobe Creative Cloud via winget...');

  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "winget install --id Adobe.CreativeCloud --silent --accept-package-agreements --accept-source-agreements"`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Adobe Creative Cloud.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure winget is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try using the full PowerShell path:\n` +
      `     /c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -Command "winget install --id Adobe.CreativeCloud --silent --accept-package-agreements --accept-source-agreements"`
    );
  }

  // Verify installation
  const verifyResult = await shell.exec(
    `powershell.exe -NoProfile -Command "Test-Path 'C:\\Program Files\\Adobe\\Adobe Creative Cloud\\ACC\\Creative Cloud.exe'"`
  );

  if (verifyResult.code !== 0 || verifyResult.stdout.trim().toLowerCase() !== 'true') {
    throw new Error(
      'Installation appeared to complete but Adobe Creative Cloud was not found.\n\n' +
      'Please try installing manually from PowerShell:\n' +
      '  winget install --id Adobe.CreativeCloud --silent --accept-package-agreements --accept-source-agreements'
    );
  }

  console.log('Adobe Creative Cloud installed successfully.');
  console.log('');
  console.log('IMPORTANT: Please launch the Creative Cloud Desktop App and sign in');
  console.log('with your Adobe ID to complete setup. This step requires user interaction.');
}

/**
 * Check if Adobe Creative Cloud is installed on the current platform.
 *
 * This function performs platform-specific checks to determine if Adobe
 * Creative Cloud is already installed:
 * - macOS: Checks for the app bundle in /Applications
 * - Windows: Checks installation paths and winget
 * - WSL/Git Bash: Checks Windows host via PowerShell
 *
 * @returns {Promise<boolean>} True if Adobe Creative Cloud is installed
 */
async function isInstalled() {
  const platform = os.detect();

  // macOS: Check for the app bundle
  if (platform.type === 'macos') {
    return isInstalledMacOS();
  }

  // Windows: Check installation paths
  if (platform.type === 'windows') {
    return await isInstalledWindows();
  }

  // WSL and Git Bash: Check Windows host installation via PowerShell
  if (platform.type === 'wsl' || platform.type === 'gitbash') {
    const checkResult = await shell.exec(
      `powershell.exe -NoProfile -Command "Test-Path 'C:\\Program Files\\Adobe\\Adobe Creative Cloud\\ACC\\Creative Cloud.exe'"`
    );
    return checkResult.code === 0 && checkResult.stdout.trim().toLowerCase() === 'true';
  }

  // Linux platforms: Not supported, return false
  return false;
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Adobe Creative Cloud can be installed on:
 * - macOS (via Homebrew cask)
 * - Windows (via winget)
 * - WSL (installs on Windows host via PowerShell)
 * - Git Bash (installs on Windows host via PowerShell)
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'windows', 'wsl', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported (and unsupported)
 * platforms have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Full support via Homebrew cask
 * - Windows: Full support via winget
 * - Git Bash: Full support via PowerShell interop to winget
 * - WSL (Ubuntu): Installs on Windows host via PowerShell interop
 *
 * Unsupported platforms (returns gracefully with message):
 * - Ubuntu/Debian: Adobe does not provide Linux packages
 * - Raspberry Pi OS: ARM architecture + no Linux support
 * - Amazon Linux/RHEL: No Linux support from Adobe
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases (e.g., debian maps to ubuntu)
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

  if (!installer) {
    console.log(`Adobe Creative Cloud is not available for ${platform.type}.`);
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

// Allow direct execution: node adobe-creative-cloud.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
