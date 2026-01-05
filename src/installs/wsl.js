#!/usr/bin/env node

/**
 * @fileoverview Install WSL 2 (Windows Subsystem for Linux 2).
 * @module installs/wsl
 *
 * WSL 2 (Windows Subsystem for Linux 2) is Microsoft's virtualization technology
 * that allows developers to run a full Linux kernel and Linux distributions
 * natively on Windows 10 and Windows 11. Unlike WSL 1, which used a translation
 * layer, WSL 2 runs an actual Linux kernel in a lightweight virtual machine.
 *
 * Key features of WSL 2:
 * - Full Linux kernel compatibility for running any Linux software
 * - Significantly faster file system performance than WSL 1
 * - Full system call compatibility for all Linux applications
 * - Seamless Windows integration (access Windows files from Linux and vice versa)
 *
 * IMPORTANT: WSL 2 is a Windows-only technology. It cannot be installed on:
 * - macOS (use Docker Desktop, UTM, or Parallels for Linux environments)
 * - Native Linux distributions (they are already Linux)
 * - Raspberry Pi OS (it is already Linux)
 * - Amazon Linux (it is already Linux)
 *
 * This installer only supports Windows and Git Bash on Windows.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const choco = require('../utils/windows/choco');
const windowsShell = require('../utils/windows/shell');

/**
 * The Chocolatey package name for WSL 2.
 * This package installs the WSL 2 infrastructure and kernel.
 */
const CHOCO_PACKAGE_NAME = 'wsl2';

/**
 * Minimum Windows build number required for WSL 2 on x64 systems.
 * Windows 10 version 1903 (Build 18362) is the minimum for x64.
 */
const MIN_BUILD_X64 = 18362;

/**
 * Minimum Windows build number required for WSL 2 on ARM64 systems.
 * Windows 10 version 2004 (Build 19041) is the minimum for ARM64.
 */
const MIN_BUILD_ARM64 = 19041;

/**
 * Check if WSL is installed by verifying the 'wsl' command exists.
 *
 * This is a quick check that works on Windows. The presence of the wsl
 * command indicates that WSL infrastructure is installed, though it does
 * not guarantee a distribution is configured.
 *
 * @returns {boolean} True if the wsl command is available, false otherwise
 */
function isWslCommandAvailable() {
  return shell.commandExists('wsl');
}

/**
 * Check if WSL 2 is installed and get the version information.
 *
 * Executes 'wsl --version' to verify WSL 2 is properly installed.
 * This command only works on Windows 10 Build 19041+ or Windows 11.
 * On older builds, 'wsl --status' is used as a fallback.
 *
 * @returns {Promise<string|null>} WSL version string, or null if not installed
 */
async function getWslVersion() {
  if (!isWslCommandAvailable()) {
    return null;
  }

  // Try 'wsl --version' first (Windows 10 Build 19041+ or Windows 11)
  const versionResult = await shell.exec('wsl --version');
  if (versionResult.code === 0 && versionResult.stdout) {
    // Look for WSL version line: "WSL version: 2.3.26.0"
    const match = versionResult.stdout.match(/WSL version:\s*([\d.]+)/i);
    if (match) {
      return match[1];
    }
    // If we got output but couldn't parse version, WSL is installed
    return 'installed';
  }

  // Fallback: try 'wsl --status' for older Windows versions
  const statusResult = await shell.exec('wsl --status');
  if (statusResult.code === 0 && statusResult.stdout) {
    // If status returns successfully, WSL is installed
    return 'installed';
  }

  return null;
}

/**
 * Check if any WSL distribution is installed.
 *
 * Executes 'wsl --list' to see if any Linux distributions are installed.
 * This helps determine if WSL needs post-installation setup.
 *
 * @returns {Promise<boolean>} True if at least one distribution is installed
 */
async function hasInstalledDistribution() {
  if (!isWslCommandAvailable()) {
    return false;
  }

  const result = await shell.exec('wsl --list --quiet');
  if (result.code === 0 && result.stdout) {
    // Filter out empty lines and check if any distributions exist
    const distros = result.stdout.split('\n').filter(line => line.trim().length > 0);
    return distros.length > 0;
  }

  return false;
}

/**
 * Verify the Windows version meets minimum requirements for WSL 2.
 *
 * WSL 2 requires:
 * - Windows 10 version 1903 (Build 18362+) for x64 systems
 * - Windows 10 version 2004 (Build 19041+) for ARM64 systems
 * - Windows 11 (any version)
 *
 * @returns {Promise<{ supported: boolean, message: string }>}
 */
async function checkWindowsVersion() {
  const buildNumber = await windowsShell.getWindowsBuild();

  if (buildNumber === null) {
    return {
      supported: false,
      message: 'Could not determine Windows build number. Please verify you are running Windows 10 1903+ or Windows 11.'
    };
  }

  // Get architecture
  const arch = os.getArch();
  const minBuild = arch === 'arm64' ? MIN_BUILD_ARM64 : MIN_BUILD_X64;

  if (buildNumber < minBuild) {
    return {
      supported: false,
      message: `Windows build ${buildNumber} does not meet minimum requirements.\n` +
               `WSL 2 requires Windows 10 Build ${minBuild}+ for ${arch} systems.\n` +
               `Please update Windows via Settings > Update & Security > Windows Update.`
    };
  }

  return {
    supported: true,
    message: `Windows build ${buildNumber} meets WSL 2 requirements.`
  };
}

/**
 * Install WSL 2 on macOS.
 *
 * WSL 2 is a Windows-only technology and cannot be installed on macOS.
 * This function returns gracefully with an informational message.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('WSL 2 is not available for macOS.');
  return;
}

/**
 * Install WSL 2 on Ubuntu/Debian.
 *
 * WSL 2 is a Windows-only technology designed to run Linux on Windows.
 * Ubuntu and Debian are native Linux distributions and do not support WSL 2.
 * This function returns gracefully with an informational message.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('WSL 2 is not available for Ubuntu.');
  return;
}

/**
 * Install WSL 2 on Ubuntu running in WSL.
 *
 * If the user is already running Ubuntu inside WSL, they are already using
 * WSL 2 (or WSL 1). WSL is managed from the Windows host system, not from
 * within the Linux distribution. This function returns gracefully.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('You are already running inside WSL.');
  console.log('');
  console.log('WSL 2 is managed from the Windows host system, not from within Linux.');
  console.log('To manage WSL settings, open a Windows PowerShell or Command Prompt and use:');
  console.log('  wsl --version     (check WSL version)');
  console.log('  wsl --update      (update WSL)');
  console.log('  wsl --status      (view WSL configuration)');
  return;
}

/**
 * Install WSL 2 on Raspberry Pi OS.
 *
 * WSL 2 is a Windows-only technology. Raspberry Pi OS is a Linux distribution
 * that runs natively on Raspberry Pi hardware. This function returns gracefully
 * with an informational message.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('WSL 2 is not available for Raspberry Pi OS.');
  return;
}

/**
 * Install WSL 2 on Amazon Linux.
 *
 * WSL 2 is a Windows-only technology. Amazon Linux is a native Linux
 * distribution running on AWS infrastructure. This function returns gracefully
 * with an informational message.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('WSL 2 is not available for Amazon Linux.');
  return;
}

/**
 * Install WSL 2 on Windows using the native wsl --install command.
 *
 * This is the preferred installation method for Windows 10 Build 19041+ and
 * Windows 11. The 'wsl --install' command automatically:
 * - Enables the Virtual Machine Platform Windows feature
 * - Enables the Windows Subsystem for Linux Windows feature
 * - Downloads and installs the WSL 2 Linux kernel
 * - Downloads and installs Ubuntu as the default distribution
 * - Sets WSL 2 as the default version
 *
 * Prerequisites:
 * - Windows 10 version 1903+ (x64) or version 2004+ (ARM64), or Windows 11
 * - Administrator privileges
 * - Virtualization enabled in BIOS/UEFI
 * - Internet connectivity
 *
 * IMPORTANT: A system restart is required after installation.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if WSL 2 is already installed...');

  // Check if WSL is already installed
  const existingVersion = await getWslVersion();
  if (existingVersion) {
    console.log(`WSL 2 is already installed (version: ${existingVersion}), skipping installation.`);

    // Check if a distribution is installed
    const hasDistro = await hasInstalledDistribution();
    if (!hasDistro) {
      console.log('');
      console.log('NOTE: No Linux distribution is installed. To install Ubuntu, run:');
      console.log('  wsl --install -d Ubuntu');
    }
    return;
  }

  // Verify Windows version meets requirements
  console.log('Checking Windows version requirements...');
  const versionCheck = await checkWindowsVersion();
  if (!versionCheck.supported) {
    console.log('');
    console.log('ERROR: ' + versionCheck.message);
    return;
  }
  console.log(versionCheck.message);

  // Check if we have Chocolatey available (preferred method for consistency)
  const hasChoco = choco.isInstalled();

  if (hasChoco) {
    // Use Chocolatey for installation
    console.log('');
    console.log('Installing WSL 2 via Chocolatey...');
    console.log('This may take several minutes...');

    const chocoResult = await choco.install(CHOCO_PACKAGE_NAME, {
      // Chocolatey wsl2 package accepts parameters
      // /Version:2 ensures WSL 2, /Retry:true auto-retries after reboot
    });

    if (!chocoResult.success) {
      // Fall back to native installation if Chocolatey fails
      console.log('');
      console.log('Chocolatey installation encountered an issue. Trying native installation...');
      await installWslNative();
      return;
    }

    console.log('');
    console.log('WSL 2 installation initiated via Chocolatey.');
  } else {
    // Use native wsl --install command
    await installWslNative();
  }

  // Display post-installation instructions
  displayPostInstallInstructions();
}

/**
 * Install WSL 2 using the native 'wsl --install' command.
 *
 * This is a helper function that performs the actual installation using
 * PowerShell to run the 'wsl --install' command with administrator privileges.
 *
 * @returns {Promise<void>}
 */
async function installWslNative() {
  console.log('');
  console.log('Installing WSL 2 using native Windows installation...');
  console.log('This may take several minutes...');

  // Use PowerShell to run the wsl --install command
  // The command needs to run in an elevated context, which the user should have
  const installResult = await windowsShell.execPowerShell('wsl --install');

  if (!installResult.success) {
    console.log('');
    console.log('WSL 2 installation may require administrator privileges.');
    console.log('');
    console.log('Please try one of the following:');
    console.log('');
    console.log('Option 1: Run this installer as Administrator');
    console.log('  1. Right-click on PowerShell or Command Prompt');
    console.log('  2. Select "Run as administrator"');
    console.log('  3. Run the installer again');
    console.log('');
    console.log('Option 2: Manual installation');
    console.log('  1. Open PowerShell as Administrator');
    console.log('  2. Run: wsl --install');
    console.log('  3. Restart your computer when prompted');
    return;
  }

  // Show the output from the installation
  if (installResult.stdout) {
    console.log('');
    console.log(installResult.stdout);
  }
}

/**
 * Display post-installation instructions for WSL 2.
 *
 * After WSL 2 is installed, the user needs to restart their computer
 * and complete the Ubuntu setup. This function displays the necessary
 * steps clearly.
 */
function displayPostInstallInstructions() {
  console.log('');
  console.log('='.repeat(70));
  console.log('WSL 2 INSTALLATION INITIATED');
  console.log('='.repeat(70));
  console.log('');
  console.log('IMPORTANT: A system restart is REQUIRED to complete the installation.');
  console.log('');
  console.log('After restarting:');
  console.log('');
  console.log('  1. Ubuntu will automatically open and complete its setup.');
  console.log('     You will be prompted to create a Linux username and password.');
  console.log('');
  console.log('  2. To verify the installation, open PowerShell and run:');
  console.log('       wsl --version');
  console.log('       wsl --list --verbose');
  console.log('');
  console.log('  3. To test WSL, run:');
  console.log('       wsl echo "WSL 2 is working correctly"');
  console.log('');
  console.log('TROUBLESHOOTING:');
  console.log('');
  console.log('  - If you see "Virtualization is not enabled" error:');
  console.log('    Restart and enter BIOS/UEFI settings (usually F2, F10, or Del)');
  console.log('    Enable Intel VT-x (Intel) or AMD-V/SVM (AMD)');
  console.log('');
  console.log('  - If you see "WSL 2 requires an update" error:');
  console.log('    Run: wsl --update');
  console.log('');
  console.log('  - If your distribution shows VERSION 1 instead of 2:');
  console.log('    Run: wsl --set-version Ubuntu 2');
  console.log('');
  console.log('For more information, visit:');
  console.log('  https://learn.microsoft.com/en-us/windows/wsl/install');
  console.log('');
}

/**
 * Install WSL 2 from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so WSL 2 installation is performed on the
 * Windows host. This function uses PowerShell interop to run the WSL
 * installation commands.
 *
 * Prerequisites:
 * - Windows 10 version 1903+ (x64) or version 2004+ (ARM64), or Windows 11
 * - Git Bash installed (comes with Git for Windows)
 * - Administrator privileges
 * - Virtualization enabled in BIOS/UEFI
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing WSL 2 on the Windows host...');
  console.log('');

  // Check if WSL is already available from Git Bash
  const existingVersion = await getWslVersion();
  if (existingVersion) {
    console.log(`WSL 2 is already installed (version: ${existingVersion}), skipping installation.`);

    // Check if a distribution is installed
    const hasDistro = await hasInstalledDistribution();
    if (!hasDistro) {
      console.log('');
      console.log('NOTE: No Linux distribution is installed. To install Ubuntu, run:');
      console.log('  wsl --install -d Ubuntu');
    }
    return;
  }

  // Verify Windows version meets requirements
  console.log('Checking Windows version requirements...');
  const versionCheck = await checkWindowsVersion();
  if (!versionCheck.supported) {
    console.log('');
    console.log('ERROR: ' + versionCheck.message);
    return;
  }
  console.log(versionCheck.message);

  // Install using PowerShell from Git Bash
  console.log('');
  console.log('Installing WSL 2 via PowerShell...');
  console.log('This may take several minutes...');

  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "wsl --install"'
  );

  if (installResult.code !== 0) {
    console.log('');
    console.log('WSL 2 installation may require administrator privileges.');
    console.log('');
    console.log('Please try:');
    console.log('  1. Open Git Bash as Administrator (right-click > Run as administrator)');
    console.log('  2. Run the installer again');
    console.log('');
    console.log('Or install directly from PowerShell:');
    console.log('  1. Open PowerShell as Administrator');
    console.log('  2. Run: wsl --install');
    return;
  }

  // Show output
  if (installResult.stdout) {
    console.log('');
    console.log(installResult.stdout);
  }

  // Display post-installation instructions
  displayPostInstallInstructions();
}

/**
 * Check if this installer is supported on the current platform.
 * WSL 2 is a Windows-only technology and can only be installed on Windows.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * WSL 2 is a Windows-only technology, so most platforms will receive an
 * informational message that WSL 2 is not available.
 *
 * Supported platforms:
 * - Windows: Full installation via Chocolatey or native wsl --install
 * - Git Bash: Installation on Windows host via PowerShell
 *
 * Unsupported platforms (graceful return with message):
 * - macOS
 * - Ubuntu/Debian (native Linux)
 * - Raspberry Pi OS
 * - Amazon Linux
 * - WSL (already inside WSL)
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // WSL 2 is Windows-only, but we provide graceful messages for other platforms
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
    console.log(`WSL 2 is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

// Export all functions for use as a module and for testing
module.exports = {
  install,
  isEligible,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash
};

// Allow direct execution: node wsl.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
