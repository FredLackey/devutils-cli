#!/usr/bin/env node

/**
 * @fileoverview Install Microsoft Office 365 (Microsoft 365).
 * @module installs/microsoft-office
 *
 * Microsoft Office 365 (now branded as Microsoft 365) is a subscription-based
 * productivity suite that includes Word, Excel, PowerPoint, Outlook, OneNote,
 * and OneDrive for document creation, collaboration, and communication.
 *
 * IMPORTANT PLATFORM LIMITATION:
 * Microsoft Office 365 is officially supported ONLY on macOS and Windows.
 * There is NO native Linux support from Microsoft, which affects Ubuntu, Debian,
 * Raspberry Pi OS, Amazon Linux, and other Linux distributions.
 *
 * For unsupported platforms, this installer will display a simple message
 * and return gracefully without error.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const choco = require('../utils/windows/choco');
const windowsShell = require('../utils/windows/shell');
const fs = require('fs');

/**
 * Application names to check for on macOS after installation.
 * Microsoft Office installs multiple applications to /Applications/.
 */
const MACOS_OFFICE_APPS = [
  'Microsoft Word.app',
  'Microsoft Excel.app',
  'Microsoft PowerPoint.app',
  'Microsoft Outlook.app',
  'Microsoft OneNote.app'
];

/**
 * The Homebrew cask name for Microsoft Office suite.
 */
const HOMEBREW_CASK_NAME = 'microsoft-office';

/**
 * The Chocolatey package name for Microsoft 365 Apps.
 */
const CHOCO_PACKAGE_NAME = 'office365proplus';

/**
 * Windows installation path where Microsoft Office may be installed.
 * This is the primary executable used to verify installation.
 */
const WINDOWS_OFFICE_PATH = 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE';

/**
 * Check if Microsoft Office is installed on macOS.
 *
 * Microsoft Office installs multiple applications (Word, Excel, PowerPoint, etc.)
 * to /Applications/. We check for the presence of Microsoft Word as the primary
 * indicator since all Office apps are installed together via the cask.
 *
 * @returns {boolean} True if Microsoft Office is installed, false otherwise
 */
function isInstalledMacOS() {
  // Check for Microsoft Word as the primary indicator
  // The macosApps.isAppInstalled function checks /Applications/ and ~/Applications/
  return macosApps.isAppInstalled('Microsoft Word');
}

/**
 * Check if Microsoft Office is installed on Windows.
 *
 * Checks the standard installation path for Microsoft Office. This provides
 * a reliable and fast way to verify installation without relying on slower
 * package manager list commands.
 *
 * @returns {Promise<boolean>} True if Microsoft Office is installed, false otherwise
 */
async function isInstalledWindows() {
  // Check if the Word executable exists in the standard location
  const result = await windowsShell.execPowerShell(`Test-Path '${WINDOWS_OFFICE_PATH}'`);
  if (result.success && result.stdout.trim().toLowerCase() === 'true') {
    return true;
  }

  // Fallback: check via Chocolatey if the path check fails
  // (in case of non-standard installation location)
  const isPackageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  return isPackageInstalled;
}

/**
 * Install Microsoft Office 365 on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 13 (Ventura) or later (Microsoft 365 supports current and two previous releases)
 * - Homebrew package manager installed
 * - At least 10 GB free disk space
 * - Administrator privileges (may prompt for password)
 *
 * The installation uses the Homebrew cask 'microsoft-office' which downloads
 * and installs the complete Microsoft Office suite including Word, Excel,
 * PowerPoint, Outlook, OneNote, and OneDrive.
 *
 * NOTE: After installation, the user must sign in with their Microsoft account
 * to activate the license. This sign-in step requires user interaction and
 * cannot be automated.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Microsoft Office is already installed...');

  // Check if already installed using direct app check
  if (isInstalledMacOS()) {
    console.log('Microsoft Office is already installed, skipping installation.');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Microsoft Office.'
    );
  }

  console.log('Installing Microsoft Office via Homebrew...');
  console.log('This may take several minutes due to the large download size.');

  // Install the cask - this installs the complete Office suite
  // Note: This may prompt for administrator password for system components
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Microsoft Office via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. If installation conflicts exist, remove individual Office apps first:\n` +
      `     brew uninstall --cask microsoft-word microsoft-excel microsoft-powerpoint microsoft-outlook microsoft-onenote 2>/dev/null || true\n` +
      `  3. Ensure you have at least 10 GB free disk space\n` +
      `  4. Check macOS version - Microsoft Office requires macOS 13 (Ventura) or later`
    );
  }

  // Verify the installation succeeded by checking if Word exists
  if (!isInstalledMacOS()) {
    throw new Error(
      'Installation appeared to complete but Microsoft Office was not found.\n' +
      'Expected applications in /Applications/ (e.g., Microsoft Word.app)\n\n' +
      'Please try reinstalling manually: brew reinstall --cask microsoft-office'
    );
  }

  console.log('Microsoft Office installed successfully.');
  console.log('');
  console.log('Installed applications:');
  console.log('  - Microsoft Word');
  console.log('  - Microsoft Excel');
  console.log('  - Microsoft PowerPoint');
  console.log('  - Microsoft Outlook');
  console.log('  - Microsoft OneNote');
  console.log('  - OneDrive');
  console.log('');
  console.log('IMPORTANT: Please launch any Office application and sign in with your');
  console.log('Microsoft account to activate your Microsoft 365 subscription.');
}

/**
 * Install Microsoft Office 365 on Ubuntu/Debian.
 *
 * IMPORTANT: Microsoft Office 365 is NOT officially supported on Ubuntu or Debian.
 * Microsoft does not provide native Linux packages, and there is no APT or Snap package.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Microsoft Office 365 is not available for Ubuntu/Debian.');
}

/**
 * Install Microsoft Office 365 on Raspberry Pi OS.
 *
 * IMPORTANT: Microsoft Office 365 is NOT supported on Raspberry Pi OS.
 * Microsoft Office is designed for x86/x64 architectures (Intel/AMD processors),
 * not ARM architecture. Even with Wine, Office would not function properly due
 * to the ARM architecture.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Microsoft Office 365 is not available for Raspberry Pi OS.');
}

/**
 * Install Microsoft Office 365 on Amazon Linux/RHEL.
 *
 * IMPORTANT: Microsoft Office 365 is NOT officially supported on Amazon Linux or RHEL.
 * Microsoft does not provide packages for any Linux distribution.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Microsoft Office 365 is not available for Amazon Linux/RHEL.');
}

/**
 * Install Microsoft Office 365 on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 1903 or later (64-bit), or Windows 11
 * - Chocolatey package manager installed
 * - At least 4 GB RAM and 10 GB free disk space
 * - Administrator privileges
 * - Valid Microsoft 365 subscription (required after installation for activation)
 *
 * The installation uses the Chocolatey package 'office365proplus' which downloads
 * and installs Microsoft 365 Apps including Word, Excel, PowerPoint, Outlook,
 * OneNote, Access, and Publisher.
 *
 * NOTE: After installation, the user must sign in with their Microsoft account.
 * This sign-in step cannot be automated without enterprise deployment tools.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Microsoft Office is already installed...');

  // Check if already installed
  const alreadyInstalled = await isInstalledWindows();
  if (alreadyInstalled) {
    console.log('Microsoft Office is already installed, skipping installation.');
    return;
  }

  // Verify Chocolatey is available
  if (!choco.isInstalled()) {
    throw new Error(
      'Chocolatey is not installed.\n\n' +
      'To install Chocolatey, open an Administrator PowerShell and run:\n' +
      '  Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))\n\n' +
      'Then retry installing Microsoft Office.'
    );
  }

  console.log('Installing Microsoft Office via Chocolatey...');
  console.log('This may take several minutes due to the large download size.');

  // Install using Chocolatey with auto-confirm flag
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Microsoft Office via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. If a previous installation exists, remove it first using:\n` +
      `     choco uninstall office365proplus -y\n` +
      `  3. Ensure you have at least 10 GB free disk space\n` +
      `  4. Check for conflicting Office installations in Control Panel`
    );
  }

  // Verify installation succeeded
  const verified = await isInstalledWindows();
  if (!verified) {
    throw new Error(
      'Installation appeared to complete but Microsoft Office was not found.\n' +
      `Expected: ${WINDOWS_OFFICE_PATH}\n\n` +
      'A system restart may be required. Please restart your computer and check\n' +
      'if Microsoft Office appears in the Start menu.'
    );
  }

  console.log('Microsoft Office installed successfully.');
  console.log('');
  console.log('Installed applications:');
  console.log('  - Microsoft Word');
  console.log('  - Microsoft Excel');
  console.log('  - Microsoft PowerPoint');
  console.log('  - Microsoft Outlook');
  console.log('  - Microsoft OneNote');
  console.log('  - Microsoft Access');
  console.log('  - Microsoft Publisher');
  console.log('');
  console.log('IMPORTANT: Please launch any Office application and sign in with your');
  console.log('Microsoft account to activate your Microsoft 365 subscription.');
}

/**
 * Install Microsoft Office 365 from Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * IMPORTANT: Microsoft Office 365 cannot be installed or run inside WSL because WSL
 * runs a Linux environment and Microsoft does not support Office on Linux.
 *
 * This function installs Microsoft Office on the Windows HOST instead, which is the
 * recommended approach. After installation, Office applications can be launched from
 * WSL using Windows interop, and files can be accessed via /mnt/c/.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not available on Windows host or installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Microsoft Office 365 cannot run inside WSL because WSL runs a Linux');
  console.log('environment and Microsoft does not support Office on Linux.');
  console.log('');
  console.log('Installing Microsoft Office on the Windows HOST instead...');
  console.log('');

  // Check if already installed on Windows host via PowerShell interop
  console.log('Checking if Microsoft Office is already installed on Windows host...');

  const checkResult = await shell.exec(
    `powershell.exe -NoProfile -Command "Test-Path '${WINDOWS_OFFICE_PATH.replace(/\\/g, '\\\\')}'"`
  );

  if (checkResult.code === 0 && checkResult.stdout.trim().toLowerCase() === 'true') {
    console.log('Microsoft Office is already installed on the Windows host, skipping installation.');
    console.log('');
    console.log('You can launch Office applications from WSL using:');
    console.log('  "/mnt/c/Program Files/Microsoft Office/root/Office16/WINWORD.EXE" &');
    console.log('  "/mnt/c/Program Files/Microsoft Office/root/Office16/EXCEL.EXE" &');
    console.log('  "/mnt/c/Program Files/Microsoft Office/root/Office16/POWERPNT.EXE" &');
    return;
  }

  // Install via PowerShell interop using Chocolatey on the Windows host
  console.log('Installing Microsoft Office on Windows host via Chocolatey...');
  console.log('This may take several minutes due to the large download size.');

  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "choco install ${CHOCO_PACKAGE_NAME} -y"`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Microsoft Office on the Windows host.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Open a Windows PowerShell as Administrator and run:\n` +
      `     choco install office365proplus -y\n` +
      `  3. Check if you have administrator privileges`
    );
  }

  // Verify installation succeeded
  const verifyResult = await shell.exec(
    `powershell.exe -NoProfile -Command "Test-Path '${WINDOWS_OFFICE_PATH.replace(/\\/g, '\\\\')}'"`
  );

  if (verifyResult.code !== 0 || verifyResult.stdout.trim().toLowerCase() !== 'true') {
    throw new Error(
      'Installation appeared to complete but Microsoft Office was not found on the Windows host.\n\n' +
      'A system restart may be required. Please restart Windows and check\n' +
      'if Microsoft Office appears in the Start menu.\n\n' +
      'To install manually from Windows PowerShell (as Administrator):\n' +
      '  choco install office365proplus -y'
    );
  }

  console.log('Microsoft Office installed successfully on the Windows host.');
  console.log('');
  console.log('You can launch Office applications from WSL using:');
  console.log('  "/mnt/c/Program Files/Microsoft Office/root/Office16/WINWORD.EXE" &');
  console.log('  "/mnt/c/Program Files/Microsoft Office/root/Office16/EXCEL.EXE" &');
  console.log('  "/mnt/c/Program Files/Microsoft Office/root/Office16/POWERPNT.EXE" &');
  console.log('');
  console.log('IMPORTANT: Please launch any Office application from Windows and sign in');
  console.log('with your Microsoft account to activate your Microsoft 365 subscription.');
}

/**
 * Install Microsoft Office 365 from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Microsoft Office
 * on the Windows host using Chocolatey via PowerShell interop.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not available or installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Microsoft Office on the Windows host...');
  console.log('');

  // Check if already installed on Windows host via PowerShell
  console.log('Checking if Microsoft Office is already installed...');

  const checkResult = await shell.exec(
    `powershell.exe -NoProfile -Command "Test-Path '${WINDOWS_OFFICE_PATH.replace(/\\/g, '\\\\')}'"`
  );

  if (checkResult.code === 0 && checkResult.stdout.trim().toLowerCase() === 'true') {
    console.log('Microsoft Office is already installed, skipping installation.');
    return;
  }

  // Install via PowerShell using Chocolatey
  console.log('Installing Microsoft Office via Chocolatey...');
  console.log('This may take several minutes due to the large download size.');

  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "choco install ${CHOCO_PACKAGE_NAME} -y"`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Microsoft Office.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing from PowerShell directly:\n` +
      `     choco install office365proplus -y`
    );
  }

  // Verify installation
  const verifyResult = await shell.exec(
    `powershell.exe -NoProfile -Command "Test-Path '${WINDOWS_OFFICE_PATH.replace(/\\/g, '\\\\')}'"`
  );

  if (verifyResult.code !== 0 || verifyResult.stdout.trim().toLowerCase() !== 'true') {
    throw new Error(
      'Installation appeared to complete but Microsoft Office was not found.\n\n' +
      'A system restart may be required. Please restart Windows and check\n' +
      'if Microsoft Office appears in the Start menu.\n\n' +
      'To install manually from PowerShell (as Administrator):\n' +
      '  choco install office365proplus -y'
    );
  }

  console.log('Microsoft Office installed successfully.');
  console.log('');
  console.log('IMPORTANT: Please launch any Office application and sign in with your');
  console.log('Microsoft account to activate your Microsoft 365 subscription.');
}

/**
 * Check if Microsoft Office is installed on the current platform.
 *
 * On macOS, checks if Microsoft Word.app exists.
 * On Windows/Git Bash, checks if Office is installed via Chocolatey or file path.
 * On Linux, Microsoft Office is not available (returns false).
 *
 * @returns {Promise<boolean>} True if installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    return isInstalledMacOS();
  }

  if (platform.type === 'windows' || platform.type === 'gitbash' || platform.type === 'wsl') {
    return isInstalledWindows();
  }

  // Linux: Microsoft Office is not available
  return false;
}

/**
 * Check if this installer is supported on the current platform.
 * Microsoft Office is only available on macOS, Windows, and WSL (via Windows host).
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  // Microsoft Office is only available on macOS and Windows platforms
  return ['macos', 'wsl', 'windows', 'gitbash'].includes(platform.type);
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
 * - Windows: Full support via Chocolatey
 * - Git Bash: Full support via PowerShell interop to Chocolatey
 * - WSL (Ubuntu): Installs on Windows host via PowerShell interop
 *
 * Unsupported platforms (returns gracefully with message):
 * - Ubuntu/Debian: Microsoft does not provide Linux packages
 * - Raspberry Pi OS: ARM architecture + no Linux support
 * - Amazon Linux/RHEL: No Linux support from Microsoft
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases (e.g., debian maps to ubuntu installer)
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
    console.log(`Microsoft Office 365 is not available for ${platform.type}.`);
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

// Allow direct execution: node microsoft-office.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
