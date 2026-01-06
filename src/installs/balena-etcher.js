#!/usr/bin/env node

/**
 * @fileoverview Install Balena Etcher - a powerful OS image flasher for SD cards and USB drives.
 * @module installs/balena-etcher
 *
 * Balena Etcher is a GUI application that safely flashes OS images to SD cards and USB drives.
 * It validates writes to ensure data integrity and includes safeguards against accidental
 * overwrites of system drives.
 *
 * Supported platforms:
 * - macOS: Homebrew cask
 * - Ubuntu/Debian: Direct .deb download from GitHub
 * - Raspberry Pi OS: Pi-Apps (requires 64-bit)
 * - Amazon Linux/RHEL: Direct .rpm download from GitHub
 * - Windows: Chocolatey or winget
 * - WSL: Direct .deb download (requires WSLg for GUI)
 * - Git Bash: Uses Windows Chocolatey
 */

const fs = require('fs');
const path = require('path');
const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');
const winget = require('../utils/windows/winget');
const macosApps = require('../utils/macos/apps');

/**
 * Whether this installer requires a desktop environment to function.
 * Balena Etcher is a GUI application for flashing OS images.
 */
const REQUIRES_DESKTOP = true;

/**
 * The current version of Balena Etcher to install when downloading directly.
 * Update this value when a new version is released.
 */
const ETCHER_VERSION = '2.1.4';

/**
 * Download URLs for direct installation methods (non-package-manager installs).
 */
const DOWNLOAD_URLS = {
  deb: `https://github.com/balena-io/etcher/releases/download/v${ETCHER_VERSION}/balena-etcher_${ETCHER_VERSION}_amd64.deb`,
  rpm: `https://github.com/balena-io/etcher/releases/download/v${ETCHER_VERSION}/balena-etcher-${ETCHER_VERSION}-1.x86_64.rpm`
};

/**
 * Checks if Balena Etcher is already installed on macOS by looking for the application bundle.
 * @returns {boolean} True if balenaEtcher.app exists in /Applications
 */
function isInstalledOnMacOS() {
  return macosApps.isAppInstalled('balenaEtcher');
}

/**
 * Checks if Balena Etcher is already installed on Debian-based systems.
 * Uses dpkg to query the package database.
 * @returns {Promise<boolean>} True if the balena-etcher package is installed
 */
async function isInstalledOnDebian() {
  return apt.isPackageInstalled('balena-etcher');
}

/**
 * Checks if Balena Etcher is already installed on RPM-based systems.
 * Uses rpm to query the package database.
 * @returns {Promise<boolean>} True if the balena-etcher package is installed
 */
async function isInstalledOnRPM() {
  const result = await shell.exec('rpm -q balena-etcher 2>/dev/null');
  return result.code === 0;
}

/**
 * Checks if Balena Etcher is already installed on Windows.
 * Checks the standard installation directory.
 * @returns {Promise<boolean>} True if balenaEtcher.exe exists in Program Files
 */
async function isInstalledOnWindows() {
  // Check common installation paths
  const result = await shell.exec('powershell -Command "Test-Path \'C:\\Program Files\\balenaEtcher\\balenaEtcher.exe\'"');
  return result.stdout.trim().toLowerCase() === 'true';
}

/**
 * Checks if Balena Etcher is installed on Raspberry Pi via Pi-Apps.
 * Looks for the balena-etcher-electron binary.
 * @returns {Promise<boolean>} True if the binary exists
 */
async function isInstalledOnRaspbian() {
  // Pi-Apps installs to /usr/bin/balena-etcher-electron
  return shell.commandExists('balena-etcher-electron') || shell.commandExists('balena-etcher');
}

/**
 * Install Balena Etcher on macOS using Homebrew Cask.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Homebrew is available
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first:');
    console.log('  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    return;
  }

  // Check if already installed (idempotency check)
  if (isInstalledOnMacOS()) {
    console.log('Balena Etcher is already installed.');
    return;
  }

  console.log('Installing Balena Etcher via Homebrew Cask...');

  // Install using the brew cask command
  // Using --quiet to suppress non-essential output for cleaner automation
  const result = await brew.installCask('balenaetcher');

  if (!result.success) {
    console.error('Failed to install Balena Etcher:', result.output);
    return;
  }

  // Verify installation succeeded
  if (isInstalledOnMacOS()) {
    console.log('Balena Etcher installed successfully.');
    console.log('Location: /Applications/balenaEtcher.app');
  } else {
    console.error('Installation completed but Balena Etcher was not found in /Applications.');
  }
}

/**
 * Install Balena Etcher on Ubuntu/Debian using direct .deb download.
 *
 * The official APT repository is deprecated, so we download the .deb package
 * directly from GitHub releases.
 *
 * Prerequisites:
 * - Ubuntu 18.04+ or Debian 10+ (64-bit)
 * - sudo privileges
 * - wget installed
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check architecture FIRST - Balena Etcher only provides AMD64 packages for Linux
  // This must be checked before attempting any installations
  const arch = os.getArch();
  if (arch !== 'x64') {
    console.log(`Balena Etcher does not provide official ${arch} packages for Ubuntu/Debian.`);
    console.log('');
    console.log('Note: Official Balena Etcher releases only support x64 (AMD64) architecture.');
    console.log('For ARM64 systems:');
    console.log('  - Raspberry Pi: Use Pi-Apps (community ARM build)');
    console.log('  - Other ARM64 Linux: Community builds available at:');
    console.log('    https://github.com/Itai-Nelken/BalenaEtcher-arm');
    console.log('');
    console.log('Alternatively, consider using Raspberry Pi Imager (official ARM support):');
    console.log('  sudo apt-get install -y rpi-imager');
    return;
  }

  // Check if already installed (idempotency check)
  const alreadyInstalled = await isInstalledOnDebian();
  if (alreadyInstalled) {
    console.log('Balena Etcher is already installed.');
    return;
  }

  // Ensure wget is available for downloading
  if (!shell.commandExists('wget')) {
    console.log('Installing wget (required for download)...');
    const wgetResult = await apt.install('wget');
    if (!wgetResult.success) {
      console.error('Failed to install wget:', wgetResult.output);
      return;
    }
  }

  console.log('Downloading Balena Etcher .deb package...');

  // Download the .deb package to /tmp
  const downloadResult = await shell.exec(
    `wget -q -O /tmp/balena-etcher.deb "${DOWNLOAD_URLS.deb}"`
  );

  if (downloadResult.code !== 0) {
    console.error('Failed to download Balena Etcher:', downloadResult.stderr);
    return;
  }

  console.log('Installing Balena Etcher...');

  // Install the .deb package using apt-get
  // DEBIAN_FRONTEND=noninteractive ensures no interactive prompts
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/balena-etcher.deb'
  );

  // Clean up the downloaded file regardless of installation outcome
  await shell.exec('rm -f /tmp/balena-etcher.deb');

  if (installResult.code !== 0) {
    console.error('Failed to install Balena Etcher:', installResult.stderr);
    // Attempt to fix broken dependencies
    console.log('Attempting to fix broken dependencies...');
    await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -f -y');
    return;
  }

  // Verify installation succeeded
  const verifyInstalled = await isInstalledOnDebian();
  if (verifyInstalled) {
    console.log('Balena Etcher installed successfully.');
    console.log('Launch with: balena-etcher');
  } else {
    console.error('Installation completed but Balena Etcher package was not found.');
  }
}

/**
 * Install Balena Etcher on Raspberry Pi OS using Pi-Apps.
 *
 * IMPORTANT: Balena Etcher does NOT have an official ARM installer.
 * Pi-Apps provides a community-compiled ARM64 version.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit only - aarch64)
 * - Raspberry Pi 3, 4, or 5
 * - Desktop environment
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if already installed (idempotency check)
  const alreadyInstalled = await isInstalledOnRaspbian();
  if (alreadyInstalled) {
    console.log('Balena Etcher is already installed.');
    return;
  }

  // Verify we are running on 64-bit Raspberry Pi OS
  // Balena Etcher ARM builds only support aarch64
  const archResult = await shell.exec('uname -m');
  const architecture = archResult.stdout.trim();

  if (architecture !== 'aarch64') {
    console.log('Balena Etcher requires 64-bit Raspberry Pi OS (aarch64).');
    console.log(`Current architecture: ${architecture}`);
    console.log('Please install 64-bit Raspberry Pi OS from:');
    console.log('  https://www.raspberrypi.com/software/operating-systems/');
    return;
  }

  // Check if Pi-Apps is already installed
  const homeDir = os.getHomeDir();
  const piAppsPath = path.join(homeDir, 'pi-apps', 'manage');
  const piAppsInstalled = fs.existsSync(piAppsPath);

  if (!piAppsInstalled) {
    console.log('Installing Pi-Apps (required for Balena Etcher on Raspberry Pi)...');

    // Install Pi-Apps from the official repository
    const piAppsResult = await shell.exec(
      'wget -qO- https://raw.githubusercontent.com/Botspot/pi-apps/master/install | bash'
    );

    if (piAppsResult.code !== 0) {
      console.error('Failed to install Pi-Apps:', piAppsResult.stderr);
      console.log('You may need to install required dependencies first:');
      console.log('  sudo apt-get update && sudo apt-get install -y yad curl wget');
      return;
    }
  }

  console.log('Installing Balena Etcher via Pi-Apps...');

  // Install Balena Etcher using Pi-Apps CLI
  // Note: The app name in Pi-Apps is 'BalenaEtcher' (case-sensitive)
  const installResult = await shell.exec(
    `"${piAppsPath}" install 'BalenaEtcher'`
  );

  if (installResult.code !== 0) {
    console.error('Failed to install Balena Etcher via Pi-Apps:', installResult.stderr);
    return;
  }

  // Verify installation succeeded
  const verifyInstalled = await isInstalledOnRaspbian();
  if (verifyInstalled) {
    console.log('Balena Etcher installed successfully.');
    console.log('Launch with: balena-etcher-electron');
  } else {
    console.error('Installation completed but Balena Etcher was not found.');
  }
}

/**
 * Install Balena Etcher on Amazon Linux/RHEL using direct .rpm download.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, RHEL 8+, or Fedora 35+
 * - 64-bit (x86_64) architecture
 * - sudo privileges
 * - Desktop environment (for GUI operation)
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check architecture FIRST - Balena Etcher only provides x86_64 packages for Linux
  // This must be checked before attempting any installations
  const arch = os.getArch();
  if (arch !== 'x64') {
    console.log(`Balena Etcher does not provide official ${arch} packages for RHEL/Fedora/Amazon Linux.`);
    console.log('');
    console.log('Note: Official Balena Etcher releases only support x64 (x86_64) architecture.');
    console.log('For ARM64 systems, community builds may be available at:');
    console.log('  https://github.com/Itai-Nelken/BalenaEtcher-arm');
    console.log('');
    console.log('Alternatively, consider using other image writing tools with ARM support.');
    return;
  }

  // Check if already installed (idempotency check)
  const alreadyInstalled = await isInstalledOnRPM();
  if (alreadyInstalled) {
    console.log('Balena Etcher is already installed.');
    return;
  }

  // Ensure wget is available for downloading
  if (!shell.commandExists('wget')) {
    console.log('Installing wget (required for download)...');
    // Detect whether to use dnf or yum
    const packageManager = shell.commandExists('dnf') ? 'dnf' : 'yum';
    const wgetResult = await shell.exec(`sudo ${packageManager} install -y wget`);
    if (wgetResult.code !== 0) {
      console.error('Failed to install wget:', wgetResult.stderr);
      return;
    }
  }

  console.log('Downloading Balena Etcher .rpm package...');

  // Download the .rpm package to /tmp
  const downloadResult = await shell.exec(
    `wget -q -O /tmp/balena-etcher.rpm "${DOWNLOAD_URLS.rpm}"`
  );

  if (downloadResult.code !== 0) {
    console.error('Failed to download Balena Etcher:', downloadResult.stderr);
    return;
  }

  console.log('Installing Balena Etcher...');

  // Determine which package manager to use (dnf preferred over yum)
  const packageManager = shell.commandExists('dnf') ? 'dnf' : 'yum';

  // Install the .rpm package
  const installResult = await shell.exec(
    `sudo ${packageManager} install -y /tmp/balena-etcher.rpm`
  );

  // Clean up the downloaded file regardless of installation outcome
  await shell.exec('rm -f /tmp/balena-etcher.rpm');

  if (installResult.code !== 0) {
    console.error('Failed to install Balena Etcher:', installResult.stderr);
    console.log('You may need to install missing dependencies:');
    console.log('  sudo dnf install -y libXScrnSaver gtk3 nss alsa-lib');
    return;
  }

  // Verify installation succeeded
  const verifyInstalled = await isInstalledOnRPM();
  if (verifyInstalled) {
    console.log('Balena Etcher installed successfully.');
    console.log('Launch with: balena-etcher');
  } else {
    console.error('Installation completed but Balena Etcher package was not found.');
  }
}

/**
 * Install Balena Etcher on Windows using Chocolatey or winget.
 *
 * Prefers winget if available, falls back to Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Chocolatey or winget package manager
 * - Administrator privileges
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if already installed (idempotency check)
  const alreadyInstalled = await isInstalledOnWindows();
  if (alreadyInstalled) {
    console.log('Balena Etcher is already installed.');
    return;
  }

  // Try winget first (preferred on modern Windows)
  if (winget.isInstalled()) {
    console.log('Installing Balena Etcher via winget...');

    const result = await winget.install('Balena.Etcher');

    if (result.success) {
      // Verify installation succeeded
      const verifyInstalled = await isInstalledOnWindows();
      if (verifyInstalled) {
        console.log('Balena Etcher installed successfully.');
        console.log('Location: C:\\Program Files\\balenaEtcher\\balenaEtcher.exe');
        return;
      }
    }

    // If winget failed, fall through to try Chocolatey
    console.log('winget installation was not successful, trying Chocolatey...');
  }

  // Fall back to Chocolatey
  if (choco.isInstalled()) {
    console.log('Installing Balena Etcher via Chocolatey...');

    // Chocolatey package name is 'etcher'
    const result = await choco.install('etcher');

    if (!result.success) {
      console.error('Failed to install Balena Etcher:', result.output);
      return;
    }

    // Verify installation succeeded
    const verifyInstalled = await isInstalledOnWindows();
    if (verifyInstalled) {
      console.log('Balena Etcher installed successfully.');
      console.log('Location: C:\\Program Files\\balenaEtcher\\balenaEtcher.exe');
    } else {
      console.error('Installation completed but Balena Etcher was not found.');
    }
    return;
  }

  // Neither package manager is available
  console.log('Neither winget nor Chocolatey is installed.');
  console.log('Please install one of them first:');
  console.log('');
  console.log('For Chocolatey (PowerShell as Administrator):');
  console.log('  Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))');
}

/**
 * Install Balena Etcher on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Uses the same installation method as Ubuntu, but notes that WSLg is required
 * for GUI support and that USB device access is limited in WSL.
 *
 * Prerequisites:
 * - WSL 2 with Ubuntu
 * - Windows 11 or Windows 10 with WSLg enabled
 * - sudo privileges
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // Check architecture FIRST - Balena Etcher only provides AMD64 packages for Linux
  // This must be checked before attempting any installations
  const arch = os.getArch();
  if (arch !== 'x64') {
    console.log(`Balena Etcher does not provide official ${arch} packages for WSL.`);
    console.log('');
    console.log('Note: Official Balena Etcher releases only support x64 (AMD64) architecture.');
    console.log('For ARM64 WSL, consider installing Balena Etcher on Windows directly instead.');
    return;
  }

  // Check if already installed (idempotency check)
  const alreadyInstalled = await isInstalledOnDebian();
  if (alreadyInstalled) {
    console.log('Balena Etcher is already installed.');
    return;
  }

  // WSL-specific note about USB limitations
  console.log('Note: Balena Etcher in WSL has limited USB device access.');
  console.log('For full USB support, consider installing on Windows directly.');
  console.log('');

  // Ensure wget is available for downloading
  if (!shell.commandExists('wget')) {
    console.log('Installing wget (required for download)...');
    // Update apt cache first for WSL
    await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
    const wgetResult = await apt.install('wget');
    if (!wgetResult.success) {
      console.error('Failed to install wget:', wgetResult.output);
      return;
    }
  }

  console.log('Downloading Balena Etcher .deb package...');

  // Download the .deb package to /tmp
  const downloadResult = await shell.exec(
    `wget -q -O /tmp/balena-etcher.deb "${DOWNLOAD_URLS.deb}"`
  );

  if (downloadResult.code !== 0) {
    console.error('Failed to download Balena Etcher:', downloadResult.stderr);
    return;
  }

  console.log('Installing Balena Etcher...');

  // Update package list first (important for fresh WSL instances)
  await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');

  // Install the .deb package using apt-get
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/balena-etcher.deb'
  );

  // Clean up the downloaded file regardless of installation outcome
  await shell.exec('rm -f /tmp/balena-etcher.deb');

  if (installResult.code !== 0) {
    console.error('Failed to install Balena Etcher:', installResult.stderr);
    // Attempt to fix broken dependencies
    console.log('Attempting to fix broken dependencies...');
    await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -f -y');
    return;
  }

  // Verify installation succeeded
  const verifyInstalled = await isInstalledOnDebian();
  if (verifyInstalled) {
    console.log('Balena Etcher installed successfully.');
    console.log('Launch with: balena-etcher');
    console.log('');
    console.log('Note: Requires WSLg for GUI support. If you encounter display errors:');
    console.log('  1. Ensure you are using WSL 2');
    console.log('  2. Run: wsl --update (in PowerShell)');
    console.log('  3. Restart WSL: wsl --shutdown && wsl');
  } else {
    console.error('Installation completed but Balena Etcher package was not found.');
  }
}

/**
 * Install Balena Etcher from Git Bash on Windows.
 *
 * Git Bash runs on Windows, so this function delegates to the Windows
 * installation method using Chocolatey.
 *
 * Prerequisites:
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey installed on Windows
 * - Administrator privileges
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Git Bash runs on Windows and can access Windows package managers
  // Delegate to Windows installation
  console.log('Installing Balena Etcher for Windows from Git Bash...');
  await install_windows();
}

/**
 * Check if Balena Etcher is installed on the current platform.
 *
 * Uses platform-appropriate verification:
 * - macOS: Checks for application bundle in /Applications
 * - Ubuntu/Debian/WSL: Checks dpkg package database
 * - Raspberry Pi OS: Checks for balena-etcher-electron command
 * - Amazon Linux/RHEL/Fedora: Checks rpm package database
 * - Windows: Checks for executable in Program Files
 *
 * @returns {Promise<boolean>} True if Balena Etcher is installed
 */
async function isInstalled() {
  const platform = os.detect();

  const checks = {
    'macos': isInstalledOnMacOS,
    'ubuntu': isInstalledOnDebian,
    'debian': isInstalledOnDebian,
    'wsl': isInstalledOnDebian,
    'raspbian': isInstalledOnRaspbian,
    'amazon_linux': isInstalledOnRPM,
    'fedora': isInstalledOnRPM,
    'rhel': isInstalledOnRPM,
    'windows': isInstalledOnWindows,
    'gitbash': isInstalledOnWindows,
  };

  const checker = checks[platform.type];
  if (!checker) {
    return false;
  }

  // Handle both sync and async checkers
  const result = checker();
  return result instanceof Promise ? await result : result;
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Balena Etcher can be installed on all supported platforms:
 * - macOS (via Homebrew cask)
 * - Ubuntu/Debian (via direct .deb download)
 * - Raspberry Pi OS (via Pi-Apps, 64-bit only)
 * - Amazon Linux/RHEL/Fedora (via direct .rpm download)
 * - Windows (via Chocolatey or winget)
 * - WSL (via direct .deb download)
 * - Git Bash (via Windows Chocolatey)
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  const supportedPlatforms = ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel', 'windows', 'gitbash'];
  if (!supportedPlatforms.includes(platform.type)) {
    return false;
  }
  if (REQUIRES_DESKTOP && !os.isDesktopAvailable()) {
    return false;
  }
  return true;
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically determines the current operating system and
 * invokes the correct platform-specific installation function.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their respective installer functions
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
    'gitbash': install_gitbash
  };

  const installer = installers[platform.type];

  // Handle unsupported platforms gracefully (no errors, no alternatives)
  if (!installer) {
    console.log(`Balena Etcher is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

module.exports = {
  REQUIRES_DESKTOP,
  install,
  isEligible,
  isInstalled,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash
};

// Allow direct execution of this script
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
