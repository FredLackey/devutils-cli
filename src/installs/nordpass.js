#!/usr/bin/env node

/**
 * @fileoverview Install NordPass password manager.
 * @module installs/nordpass
 *
 * NordPass is a password manager developed by Nord Security that provides
 * secure storage for passwords, credit card information, secure notes, and
 * other sensitive data. It uses XChaCha20 encryption and operates on a
 * zero-knowledge architecture.
 *
 * IMPORTANT PLATFORM NOTES:
 * - macOS: Installs NordPass Desktop via Homebrew cask
 * - Windows: Installs NordPass Desktop via Chocolatey
 * - Ubuntu/Debian: Installs NordPass Desktop via Snap (x86_64 only)
 * - WSL: Recommends using Windows NordPass or opens web vault
 * - Raspberry Pi OS: NOT SUPPORTED (ARM architecture not supported by NordPass)
 * - Amazon Linux: NOT SUPPORTED (no Snap/Flatpak; browser extension recommended)
 * - Git Bash: Installs NordPass on Windows host via Chocolatey
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const snap = require('../utils/ubuntu/snap');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew cask name for NordPass on macOS.
 * This installs the full desktop application from Nord Security.
 */
const HOMEBREW_CASK_NAME = 'nordpass';

/**
 * The Chocolatey package name for NordPass on Windows.
 */
const CHOCO_PACKAGE_NAME = 'nordpass';

/**
 * The Snap package name for NordPass on Ubuntu/Debian.
 * This is the official NordPass package maintained by Nord Security.
 */
const SNAP_PACKAGE_NAME = 'nordpass';

/**
 * The macOS application name as it appears in /Applications.
 */
const MACOS_APP_NAME = 'NordPass';

/**
 * The Windows executable path for NordPass.
 */
const WINDOWS_EXE_PATH = 'C:\\Program Files\\NordPass\\NordPass.exe';

/**
 * Check if NordPass is installed on macOS by looking for the app bundle.
 *
 * This function checks both /Applications and ~/Applications for the
 * NordPass.app bundle, which is the standard installation location
 * for Homebrew cask installations.
 *
 * @returns {boolean} True if NordPass.app exists, false otherwise
 */
function isNordPassInstalledMacOS() {
  return macosApps.isAppInstalled(MACOS_APP_NAME);
}

/**
 * Get the installed version of NordPass on macOS.
 *
 * Reads the version from the app's Info.plist file using the
 * CFBundleShortVersionString key.
 *
 * @returns {string|null} The version string if installed, null otherwise
 */
function getNordPassVersionMacOS() {
  return macosApps.getAppVersion(MACOS_APP_NAME);
}

/**
 * Check if NordPass is installed via Snap on Linux.
 *
 * Queries the snap list to determine if the nordpass package is installed.
 *
 * @returns {Promise<boolean>} True if NordPass snap is installed
 */
async function isNordPassInstalledSnap() {
  return await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
}

/**
 * Get the installed version of NordPass from Snap.
 *
 * @returns {Promise<string|null>} The version string if installed, null otherwise
 */
async function getNordPassVersionSnap() {
  return await snap.getSnapVersion(SNAP_PACKAGE_NAME);
}

/**
 * Check if NordPass is installed via Chocolatey on Windows.
 *
 * Queries the Chocolatey local package list to determine if NordPass
 * is installed.
 *
 * @returns {Promise<boolean>} True if NordPass is installed via Chocolatey
 */
async function isNordPassInstalledChoco() {
  return await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
}

/**
 * Ensure snapd is installed and running on the system.
 *
 * On Ubuntu 16.04+, snapd is pre-installed. On Debian or other systems,
 * this function will attempt to install it via apt-get.
 *
 * @returns {Promise<boolean>} True if snapd is available, false otherwise
 */
async function ensureSnapdInstalled() {
  // Check if snap command is already available
  if (snap.isInstalled()) {
    return true;
  }

  console.log('snapd is not installed. Installing snapd...');

  // Update package lists first
  const updateResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y'
  );
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists.');
  }

  // Install snapd
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd'
  );

  if (installResult.code !== 0) {
    console.log('Failed to install snapd.');
    console.log('Output: ' + (installResult.stderr || installResult.stdout));
    return false;
  }

  console.log('snapd installed. You may need to log out and log back in');
  console.log('for snap paths to be updated correctly.');

  return true;
}

/**
 * Check if the system architecture supports NordPass Snap package.
 *
 * NordPass Snap only supports amd64 (x86_64) architecture. ARM architectures
 * (aarch64, armv7l) are not supported.
 *
 * @returns {Promise<{ supported: boolean, architecture: string }>}
 */
async function checkArchitectureSupport() {
  const archResult = await shell.exec('uname -m');
  const architecture = archResult.stdout.trim();

  // NordPass Snap only supports x86_64/amd64
  const supportedArchitectures = ['x86_64', 'amd64'];
  const supported = supportedArchitectures.includes(architecture);

  return { supported, architecture };
}

/**
 * Install NordPass on macOS using Homebrew cask.
 *
 * Prerequisites:
 * - macOS 11 (Big Sur) or later
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 * - At least 200 MB free disk space
 *
 * The installation uses Homebrew's cask system which downloads the official
 * NordPass.dmg from Nord Security and installs it to /Applications.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if NordPass is already installed...');

  // Check if NordPass is already installed by looking for the app
  if (isNordPassInstalledMacOS()) {
    const version = getNordPassVersionMacOS();
    const versionInfo = version ? ` (version ${version})` : '';
    console.log(`NordPass is already installed${versionInfo}, skipping installation.`);
    return;
  }

  // Also check if the cask is installed via Homebrew
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('NordPass is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('To launch NordPass, run: open -a NordPass');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing NordPass.'
    );
  }

  console.log('Installing NordPass via Homebrew...');

  // Install NordPass using Homebrew cask
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    throw new Error(
      'Failed to install NordPass via Homebrew.\n' +
      'Output: ' + result.output + '\n\n' +
      'Troubleshooting:\n' +
      '  1. Run "brew update && brew cleanup" and retry\n' +
      '  2. Check for cask availability: brew info --cask nordpass\n' +
      '  3. Try manual download from https://nordpass.com/download/macos/'
    );
  }

  // Verify installation succeeded
  if (!isNordPassInstalledMacOS()) {
    throw new Error(
      'Installation appeared to complete but NordPass.app was not found.\n' +
      'Please check /Applications for NordPass.app'
    );
  }

  const installedVersion = getNordPassVersionMacOS();
  const versionInfo = installedVersion ? ` (version ${installedVersion})` : '';

  console.log('NordPass installed successfully' + versionInfo + '.');
  console.log('');
  console.log('To get started:');
  console.log('  1. Launch NordPass from Applications or run: open -a NordPass');
  console.log('  2. Sign in with your NordPass account or create a new one');
  console.log('  3. Install the browser extension for autofill functionality');
  console.log('');
  console.log('Browser extension links:');
  console.log('  Chrome: https://chrome.google.com/webstore/detail/nordpass-password-manager/fooolghllnmhmmndgjiamiiodkpenpbb');
  console.log('  Firefox: https://addons.mozilla.org/en-US/firefox/addon/nordpass-password-manager-b2b/');
  console.log('  Safari: Available in the Mac App Store');
}

/**
 * Install NordPass on Ubuntu/Debian using Snap.
 *
 * Prerequisites:
 * - Ubuntu 18.04+ or Debian 10+ (64-bit x86_64/amd64 only)
 * - snapd service installed and running
 * - sudo privileges
 * - Active internet connection
 *
 * IMPORTANT: NordPass Snap only supports amd64 (x86_64) architecture.
 * ARM-based systems (aarch64, armv7l) are not supported.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking system architecture...');

  // Check architecture compatibility - NordPass Snap only supports x86_64
  const { supported, architecture } = await checkArchitectureSupport();
  if (!supported) {
    console.log('NordPass is not available for ' + architecture + ' architecture.');
    console.log('');
    console.log('NordPass Snap only supports x86_64/amd64 systems.');
    console.log('');
    console.log('Alternative options:');
    console.log('  - Use the NordPass browser extension');
    console.log('  - Access the web vault at https://app.nordpass.com');
    return;
  }

  console.log('Checking if NordPass is already installed...');

  // Check if NordPass is already installed via Snap
  const isInstalled = await isNordPassInstalledSnap();
  if (isInstalled) {
    const version = await getNordPassVersionSnap();
    const versionInfo = version ? ` (version ${version})` : '';
    console.log('NordPass is already installed' + versionInfo + ', skipping installation.');
    return;
  }

  // Ensure snapd is installed
  const snapdAvailable = await ensureSnapdInstalled();
  if (!snapdAvailable) {
    throw new Error(
      'snapd is required but could not be installed.\n\n' +
      'Please install snapd manually:\n' +
      '  sudo apt-get update\n' +
      '  sudo apt-get install -y snapd\n' +
      'Then log out and log back in, and retry.'
    );
  }

  console.log('Installing NordPass via Snap...');

  // Install NordPass from Snap Store
  const result = await snap.install(SNAP_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      'Failed to install NordPass via Snap.\n' +
      'Output: ' + result.output + '\n\n' +
      'Troubleshooting:\n' +
      '  1. Ensure snapd service is running: sudo systemctl status snapd\n' +
      '  2. Try starting the service: sudo systemctl enable --now snapd.socket\n' +
      '  3. Check your internet connection\n' +
      '  4. Try manual installation: sudo snap install nordpass'
    );
  }

  // Verify installation
  const installedVersion = await getNordPassVersionSnap();
  const versionInfo = installedVersion ? ` (version ${installedVersion})` : '';

  console.log('NordPass installed successfully' + versionInfo + '.');
  console.log('');
  console.log('To get started:');
  console.log('  1. Launch NordPass from your application menu or run: nordpass');
  console.log('  2. Sign in with your NordPass account or create a new one');
  console.log('  3. Install the browser extension for autofill functionality');
  console.log('');
  console.log('Browser extension links:');
  console.log('  Chrome: https://chrome.google.com/webstore/detail/nordpass-password-manager/fooolghllnmhmmndgjiamiiodkpenpbb');
  console.log('  Firefox: https://addons.mozilla.org/en-US/firefox/addon/nordpass-password-manager-b2b/');
}

/**
 * Install NordPass on Raspberry Pi OS.
 *
 * IMPORTANT: NordPass does NOT provide a native desktop application for
 * ARM architecture. The NordPass Snap package only supports amd64 (x86_64).
 *
 * This function gracefully informs the user that NordPass is not available
 * on Raspberry Pi and exits without error.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('NordPass is not available for Raspberry Pi OS.');
  return;
}

/**
 * Install NordPass on Amazon Linux/RHEL.
 *
 * IMPORTANT: NordPass does NOT provide a native desktop application for
 * Amazon Linux. Amazon Linux does not natively support Snap or Flatpak,
 * which are the primary distribution methods for NordPass on Linux.
 *
 * This function gracefully informs the user that NordPass is not available
 * on Amazon Linux and exits without error.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('NordPass is not available for Amazon Linux.');
  return;
}

/**
 * Install NordPass on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 or later, or Windows Server 2016 or later (64-bit)
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 * - Active internet connection
 *
 * The installation uses Chocolatey's silent installation mode which
 * downloads and installs NordPass without user interaction.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if NordPass is already installed...');

  // Check if NordPass is installed via Chocolatey
  const chocoInstalled = await isNordPassInstalledChoco();
  if (chocoInstalled) {
    console.log('NordPass is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('Launch NordPass from the Start Menu.');
    return;
  }

  // Also check if the executable exists (may have been installed manually)
  const exeResult = await shell.exec('if exist "' + WINDOWS_EXE_PATH + '" (echo exists)');
  if (exeResult.stdout && exeResult.stdout.includes('exists')) {
    console.log('NordPass is already installed, skipping installation.');
    console.log('');
    console.log('Launch NordPass from the Start Menu.');
    return;
  }

  // Verify Chocolatey is available
  if (!choco.isInstalled()) {
    throw new Error(
      'Chocolatey is not installed. Please install Chocolatey first:\n\n' +
      'Run the following in an Administrator PowerShell:\n' +
      '  Set-ExecutionPolicy Bypass -Scope Process -Force; ' +
      '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; ' +
      'iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))\n\n' +
      'Then retry installing NordPass.'
    );
  }

  console.log('Installing NordPass via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install NordPass using Chocolatey
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      'Failed to install NordPass via Chocolatey.\n' +
      'Output: ' + result.output + '\n\n' +
      'Troubleshooting:\n' +
      '  1. Ensure you are running as Administrator\n' +
      '  2. Try: choco install nordpass -y --force\n' +
      '  3. If checksum errors occur: choco install nordpass -y --ignore-checksums\n' +
      '  4. Try manual download from https://nordpass.com/download/windows/'
    );
  }

  console.log('NordPass installed successfully.');
  console.log('');
  console.log('To get started:');
  console.log('  1. Launch NordPass from the Start Menu');
  console.log('  2. Sign in with your NordPass account or create a new one');
  console.log('  3. Install the browser extension for autofill functionality');
  console.log('');
  console.log('Browser extension links:');
  console.log('  Chrome: https://chrome.google.com/webstore/detail/nordpass-password-manager/fooolghllnmhmmndgjiamiiodkpenpbb');
  console.log('  Firefox: https://addons.mozilla.org/en-US/firefox/addon/nordpass-password-manager-b2b/');
  console.log('  Edge: https://microsoftedge.microsoft.com/addons/detail/nordpass-password-manage/njgnlkhcjgmjfnfahjgppcefghdkflml');
}

/**
 * Install NordPass on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL users have two options:
 * 1. Recommended: Use NordPass installed on the Windows host
 * 2. Alternative: Install via Snap within WSL (requires WSL 2 + systemd + WSLg)
 *
 * This function recommends using the Windows installation and provides
 * instructions for accessing NordPass from within WSL.
 *
 * Prerequisites for Snap installation:
 * - WSL 2 with systemd enabled
 * - WSLg for GUI support (Windows 11) or X server (Windows 10)
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Check architecture compatibility first
  const { supported, architecture } = await checkArchitectureSupport();
  if (!supported) {
    console.log('NordPass is not available for ' + architecture + ' architecture in WSL.');
    console.log('');
    console.log('Use the NordPass web vault instead:');
    console.log('  wslview https://app.nordpass.com');
    return;
  }

  // Check if NordPass is already installed via Snap
  const isInstalled = await isNordPassInstalledSnap();
  if (isInstalled) {
    const version = await getNordPassVersionSnap();
    const versionInfo = version ? ` (version ${version})` : '';
    console.log('NordPass is already installed in WSL' + versionInfo + ', skipping installation.');
    return;
  }

  console.log('RECOMMENDED: Install NordPass on your Windows host for the best experience.');
  console.log('Then use the NordPass browser extension in your Windows browser.');
  console.log('');
  console.log('To access NordPass web vault from WSL, you can install wslu:');
  console.log('  sudo apt-get update && sudo apt-get install -y wslu');
  console.log('  wslview https://app.nordpass.com');
  console.log('');
  console.log('ALTERNATIVE: To install NordPass directly in WSL (requires WSL 2 + systemd):');
  console.log('');
  console.log('1. Enable systemd in WSL by adding to /etc/wsl.conf:');
  console.log('   [boot]');
  console.log('   systemd=true');
  console.log('');
  console.log('2. Restart WSL from PowerShell: wsl --shutdown');
  console.log('');
  console.log('3. Then install via Snap:');
  console.log('   sudo apt-get update && sudo apt-get install -y snapd');
  console.log('   sudo snap install nordpass');
  console.log('');
  console.log('Note: GUI support requires WSLg (Windows 11) or an X server (Windows 10).');
  return;
}

/**
 * Install NordPass from Git Bash on Windows.
 *
 * Git Bash runs within the Windows environment, so this function installs
 * NordPass on the Windows host using Chocolatey via PowerShell.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey package manager installed on Windows
 * - Administrator privileges
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing NordPass on the Windows host...');
  console.log('');

  // Check if NordPass is already installed by checking for the executable
  const checkResult = await shell.exec('powershell.exe -NoProfile -Command "Test-Path \'C:\\Program Files\\NordPass\\NordPass.exe\'"');
  if (checkResult.stdout && checkResult.stdout.trim() === 'True') {
    console.log('NordPass is already installed, skipping installation.');
    console.log('');
    console.log('To launch NordPass:');
    console.log('  start "" "C:\\Program Files\\NordPass\\NordPass.exe"');
    return;
  }

  // Check if Chocolatey is available
  const chocoCheck = await shell.exec('choco.exe --version 2>/dev/null || powershell.exe -NoProfile -Command "choco --version"');
  if (chocoCheck.code !== 0) {
    throw new Error(
      'Chocolatey is not installed on Windows.\n\n' +
      'Please install Chocolatey first by running in an Administrator PowerShell:\n' +
      '  Set-ExecutionPolicy Bypass -Scope Process -Force; ' +
      '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; ' +
      'iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))\n\n' +
      'Then retry installing NordPass.'
    );
  }

  console.log('Installing NordPass via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install via PowerShell using Chocolatey
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install nordpass -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      'Failed to install NordPass.\n' +
      'Output: ' + (installResult.stdout || installResult.stderr) + '\n\n' +
      'Troubleshooting:\n' +
      '  1. Run Git Bash as Administrator and retry\n' +
      '  2. Try: powershell.exe -Command "choco install nordpass -y --force"\n' +
      '  3. Try manual download from https://nordpass.com/download/windows/'
    );
  }

  console.log('NordPass installed successfully.');
  console.log('');
  console.log('To get started:');
  console.log('  1. Launch NordPass from the Start Menu');
  console.log('  2. Or from Git Bash: start "" "C:\\Program Files\\NordPass\\NordPass.exe"');
  console.log('  3. Sign in with your NordPass account or create a new one');
  console.log('  4. Install the browser extension for autofill functionality');
  console.log('');
  console.log('Web vault access from Git Bash:');
  console.log('  start https://app.nordpass.com');
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: NordPass Desktop via Homebrew cask
 * - Ubuntu/Debian: NordPass Desktop via Snap (x86_64 only)
 * - Windows: NordPass Desktop via Chocolatey
 * - WSL (Ubuntu): Recommends Windows installation or provides Snap instructions
 * - Git Bash: NordPass Desktop on Windows host via Chocolatey
 *
 * Unsupported platforms (graceful exit):
 * - Raspberry Pi OS: ARM architecture not supported
 * - Amazon Linux/RHEL: No Snap/Flatpak support
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases and ensures all detected platforms have handlers
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
    console.log('NordPass is not available for ' + platform.type + '.');
    return;
  }

  await installer();
}

// Export all functions for use as a module and for testing
module.exports = {
  install,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash
};

// Allow direct execution: node nordpass.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
