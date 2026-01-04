#!/usr/bin/env node

/**
 * @fileoverview Install Microsoft Teams.
 * @module installs/microsoft-teams
 *
 * Microsoft Teams is a collaboration and communication platform developed by Microsoft.
 * It provides chat, video meetings, file storage, and application integration for teams
 * and organizations.
 *
 * IMPORTANT PLATFORM NOTES:
 * - macOS: Installs Microsoft Teams via Homebrew cask (native client)
 * - Windows: Installs Microsoft Teams via Chocolatey (native client)
 * - Ubuntu/Debian: Installs unofficial "Teams for Linux" via APT repository (Electron wrapper)
 * - Raspberry Pi OS: Installs "Teams for Linux" via Snap (ARM support)
 * - Amazon Linux/RHEL: Installs "Teams for Linux" via RPM repository
 * - WSL: Installs on Windows host via Chocolatey (accessed from WSL)
 * - Git Bash: Installs on Windows host via Chocolatey
 *
 * NOTE: Microsoft discontinued native Linux desktop applications for Teams at the end of 2022.
 * Linux platforms use the unofficial "Teams for Linux" Electron-based client which wraps
 * the Teams web application.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const snap = require('../utils/ubuntu/snap');
const choco = require('../utils/windows/choco');
const fs = require('fs');

/**
 * The Homebrew cask name for Microsoft Teams on macOS.
 */
const HOMEBREW_CASK_NAME = 'microsoft-teams';

/**
 * The Chocolatey package name for Microsoft Teams on Windows.
 * Uses the new Teams client bootstrapper which downloads the latest MSIX package.
 */
const CHOCO_PACKAGE_NAME = 'microsoft-teams-new-bootstrapper';

/**
 * The Snap package name for Teams for Linux.
 * This is an unofficial Electron wrapper that supports ARM architectures.
 */
const SNAP_PACKAGE_NAME = 'teams-for-linux';

/**
 * The APT package name for Teams for Linux.
 * This is installed from the unofficial teamsforlinux.de repository.
 */
const APT_PACKAGE_NAME = 'teams-for-linux';

/**
 * Check if Microsoft Teams is installed on macOS.
 *
 * Looks for the Microsoft Teams.app in the Applications folder.
 * This is the standard installation location for the Homebrew cask.
 *
 * @returns {boolean} True if Teams is installed, false otherwise
 */
function isTeamsInstalledMacOS() {
  try {
    return fs.existsSync('/Applications/Microsoft Teams.app');
  } catch {
    return false;
  }
}

/**
 * Check if Teams for Linux command is available.
 *
 * Checks if the teams-for-linux command exists in PATH, which works
 * for both APT and Snap installations.
 *
 * @returns {boolean} True if teams-for-linux command exists, false otherwise
 */
function isTeamsForLinuxInstalled() {
  return shell.commandExists('teams-for-linux');
}

/**
 * Set up the Teams for Linux APT repository on Ubuntu/Debian.
 *
 * This function:
 * 1. Creates the keyrings directory
 * 2. Downloads and installs the Teams for Linux GPG key
 * 3. Adds the Teams for Linux APT repository to sources
 * 4. Updates the package cache
 *
 * @returns {Promise<void>}
 * @throws {Error} If any step fails
 */
async function setupTeamsForLinuxAptRepository() {
  console.log('Setting up Teams for Linux APT repository...');

  // Ensure prerequisites are installed (wget, ca-certificates)
  console.log('Installing prerequisites (wget, ca-certificates)...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget ca-certificates'
  );
  if (prereqResult.code !== 0) {
    throw new Error(`Failed to install prerequisites: ${prereqResult.stderr}`);
  }

  // Create keyrings directory
  console.log('Setting up GPG keyring...');
  const keyringResult = await shell.exec('sudo mkdir -p /etc/apt/keyrings');
  if (keyringResult.code !== 0) {
    throw new Error(`Failed to create keyring directory: ${keyringResult.stderr}`);
  }

  // Download and install the GPG key
  const gpgResult = await shell.exec(
    'sudo wget -qO /etc/apt/keyrings/teams-for-linux.asc https://repo.teamsforlinux.de/teams-for-linux.asc'
  );
  if (gpgResult.code !== 0) {
    throw new Error(`Failed to add Teams for Linux GPG key: ${gpgResult.stderr}`);
  }

  // Add the repository source using the modern DEB822 format
  console.log('Adding Teams for Linux repository...');
  const repoContent = `Types: deb
URIs: https://repo.teamsforlinux.de/debian/
Suites: stable
Components: main
Signed-By: /etc/apt/keyrings/teams-for-linux.asc
Architectures: amd64`;

  const repoResult = await shell.exec(
    `echo "${repoContent}" | sudo tee /etc/apt/sources.list.d/teams-for-linux-packages.sources > /dev/null`
  );
  if (repoResult.code !== 0) {
    throw new Error(`Failed to add Teams for Linux repository: ${repoResult.stderr}`);
  }

  // Update package cache
  console.log('Updating package cache...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package cache: ${updateResult.stderr}`);
  }
}

/**
 * Set up the Teams for Linux RPM repository on Amazon Linux/RHEL/Fedora.
 *
 * This function:
 * 1. Downloads and imports the GPG key
 * 2. Adds the Teams for Linux RPM repository
 *
 * @returns {Promise<void>}
 * @throws {Error} If any step fails
 */
async function setupTeamsForLinuxRpmRepository() {
  console.log('Setting up Teams for Linux RPM repository...');

  // Download and import the GPG key
  console.log('Importing GPG key...');
  const gpgDownloadResult = await shell.exec(
    'curl -1sLf -o /tmp/teams-for-linux.asc https://repo.teamsforlinux.de/teams-for-linux.asc'
  );
  if (gpgDownloadResult.code !== 0) {
    throw new Error(`Failed to download GPG key: ${gpgDownloadResult.stderr}`);
  }

  const gpgImportResult = await shell.exec('sudo rpm --import /tmp/teams-for-linux.asc');
  if (gpgImportResult.code !== 0) {
    throw new Error(`Failed to import GPG key: ${gpgImportResult.stderr}`);
  }

  // Add the repository
  console.log('Adding Teams for Linux repository...');
  const repoResult = await shell.exec(
    'sudo curl -1sLf -o /etc/yum.repos.d/teams-for-linux.repo https://repo.teamsforlinux.de/rpm/teams-for-linux.repo'
  );
  if (repoResult.code !== 0) {
    throw new Error(`Failed to add Teams for Linux repository: ${repoResult.stderr}`);
  }
}

/**
 * Install Microsoft Teams on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 11 (Big Sur) or later
 * - Homebrew package manager installed
 * - At least 2 GB free disk space
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * The installation uses the Homebrew cask 'microsoft-teams' which downloads
 * and installs Microsoft Teams to /Applications/Microsoft Teams.app.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Microsoft Teams is already installed...');

  // Check if Teams is already installed via the app bundle
  if (isTeamsInstalledMacOS()) {
    console.log('Microsoft Teams is already installed, skipping installation.');
    return;
  }

  // Also check if the cask is installed
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Microsoft Teams is already installed via Homebrew, skipping installation.');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Microsoft Teams.'
    );
  }

  console.log('Installing Microsoft Teams via Homebrew...');

  // Install Microsoft Teams cask
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Microsoft Teams via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. If on Apple Silicon, ensure you have Rosetta 2: softwareupdate --install-rosetta\n` +
      `  3. Try manual installation: brew reinstall --cask microsoft-teams`
    );
  }

  console.log('Microsoft Teams installed successfully.');
  console.log('');
  console.log('To launch Microsoft Teams:');
  console.log('  - Open from Applications folder, or');
  console.log('  - Run: open -a "Microsoft Teams"');
  console.log('');
  console.log('On first launch, sign in with your Microsoft account (personal, work, or school).');
}

/**
 * Install Teams for Linux on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 20.04, 22.04, 24.04 or later, or Debian 11, 12 or later (64-bit)
 * - sudo privileges
 * - At least 1 GB free disk space
 *
 * NOTE: Microsoft discontinued native Linux support. This installs the unofficial
 * "Teams for Linux" Electron-based client from https://github.com/IsmaelMartinez/teams-for-linux
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu() {
  console.log('Checking if Teams for Linux is already installed...');

  // Check if already installed
  if (isTeamsForLinuxInstalled()) {
    console.log('Teams for Linux is already installed, skipping installation.');
    return;
  }

  // Also check via Snap as a fallback
  const snapInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (snapInstalled) {
    console.log('Teams for Linux is already installed via Snap, skipping installation.');
    return;
  }

  console.log('');
  console.log('NOTE: Microsoft discontinued native Linux support for Teams.');
  console.log('Installing the unofficial "Teams for Linux" client (Electron wrapper).');
  console.log('');

  // Set up the APT repository
  await setupTeamsForLinuxAptRepository();

  // Install Teams for Linux
  console.log('Installing Teams for Linux...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Teams for Linux.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'sudo apt-get update' and retry\n` +
      `  2. Verify the repository was added: cat /etc/apt/sources.list.d/teams-for-linux-packages.sources\n` +
      `  3. Alternative: Try installing via Snap: sudo snap install teams-for-linux`
    );
  }

  // Verify installation
  if (!isTeamsForLinuxInstalled()) {
    throw new Error(
      'Installation appeared to complete but Teams for Linux was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: teams-for-linux --version'
    );
  }

  console.log('Teams for Linux installed successfully.');
  console.log('');
  console.log('To launch Teams for Linux:');
  console.log('  - Run: teams-for-linux');
  console.log('  - Or launch from your application menu');
  console.log('');
  console.log('NOTE: Some features like screen sharing may have limitations on Linux.');
}

/**
 * Install Teams for Linux on Raspberry Pi OS using Snap.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
 * - Raspberry Pi 3B+ or later (arm64 or armhf architecture)
 * - At least 2 GB RAM (4 GB recommended for video calls)
 * - sudo privileges
 * - snapd installed
 *
 * NOTE: The APT repository only provides amd64 packages. Snap is required for ARM.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_raspbian() {
  console.log('Checking if Teams for Linux is already installed...');

  // Check if already installed via Snap
  const snapInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (snapInstalled) {
    console.log('Teams for Linux is already installed via Snap, skipping installation.');
    return;
  }

  // Also check if command exists (from another installation method)
  if (isTeamsForLinuxInstalled()) {
    console.log('Teams for Linux is already installed, skipping installation.');
    return;
  }

  console.log('');
  console.log('NOTE: Microsoft discontinued native Linux support for Teams.');
  console.log('Installing the unofficial "Teams for Linux" client via Snap.');
  console.log('Snap is required for Raspberry Pi as the APT repository only supports amd64.');
  console.log('');

  // Ensure snapd is installed
  if (!snap.isInstalled()) {
    console.log('Installing snapd...');
    const snapdResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd'
    );
    if (snapdResult.code !== 0) {
      throw new Error(
        `Failed to install snapd.\n` +
        `Output: ${snapdResult.stderr}\n\n` +
        `Please install snapd manually and retry:\n` +
        `  sudo apt-get install snapd\n` +
        `  sudo reboot`
      );
    }
    console.log('');
    console.log('IMPORTANT: snapd was just installed. You may need to reboot');
    console.log('and run this installer again for Snap to work properly.');
    console.log('');
  }

  // Install Teams for Linux via Snap
  console.log('Installing Teams for Linux via Snap...');
  const result = await snap.install(SNAP_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Teams for Linux via Snap.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. If snapd was just installed, try rebooting first\n` +
      `  2. Ensure snapd socket is running: sudo systemctl enable --now snapd.socket\n` +
      `  3. Try manual installation: sudo snap install teams-for-linux`
    );
  }

  console.log('Teams for Linux installed successfully.');
  console.log('');
  console.log('To launch Teams for Linux:');
  console.log('  - Run: teams-for-linux');
  console.log('  - Or launch from your application menu');
  console.log('');
  console.log('PERFORMANCE NOTES for Raspberry Pi:');
  console.log('  - Use a Raspberry Pi 4 or 5 with at least 4 GB RAM for video calls');
  console.log('  - Close other applications during video calls');
  console.log('  - Screen sharing may have limited support on ARM devices');
}

/**
 * Install Teams for Linux on Amazon Linux/RHEL using DNF/YUM.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, RHEL 8, RHEL 9, or Fedora
 * - sudo privileges
 * - At least 1 GB free disk space
 *
 * NOTE: Microsoft discontinued native Linux support. This installs the unofficial
 * "Teams for Linux" client from the teamsforlinux.de RPM repository.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('Checking if Teams for Linux is already installed...');

  // Check if already installed
  if (isTeamsForLinuxInstalled()) {
    console.log('Teams for Linux is already installed, skipping installation.');
    return;
  }

  console.log('');
  console.log('NOTE: Microsoft discontinued native Linux support for Teams.');
  console.log('Installing the unofficial "Teams for Linux" client.');
  console.log('');

  // Detect package manager (dnf for AL2023/RHEL 8+/Fedora, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    throw new Error(
      'Neither dnf nor yum package manager found.\n' +
      'This installer supports Amazon Linux 2023 (dnf), Amazon Linux 2 (yum),\n' +
      'RHEL 8/9 (dnf), and Fedora (dnf).'
    );
  }

  console.log(`Detected package manager: ${packageManager}`);

  // Set up the RPM repository
  await setupTeamsForLinuxRpmRepository();

  // Install Teams for Linux
  console.log('Installing Teams for Linux...');
  const installResult = await shell.exec(`sudo ${packageManager} install -y ${APT_PACKAGE_NAME}`);

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Teams for Linux.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Verify the repository was added: cat /etc/yum.repos.d/teams-for-linux.repo\n` +
      `  2. Update system packages: sudo ${packageManager} update -y\n` +
      `  3. Retry installation: sudo ${packageManager} install -y teams-for-linux`
    );
  }

  // Verify installation
  if (!isTeamsForLinuxInstalled()) {
    throw new Error(
      'Installation appeared to complete but Teams for Linux was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: teams-for-linux --version'
    );
  }

  console.log('Teams for Linux installed successfully.');
  console.log('');
  console.log('To launch Teams for Linux:');
  console.log('  - Run: teams-for-linux');
  console.log('  - Or launch from your application menu');
  console.log('');
  console.log('NOTE: If running on a headless EC2 instance, Teams cannot be used directly.');
  console.log('Consider accessing Teams via a browser on a machine with GUI access.');
}

/**
 * Install Microsoft Teams on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 20H1 (10.0.19041) or later, or Windows 11
 * - At least 2 GB RAM and 3 GB free disk space
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * The installation uses the new Microsoft Teams client (version 2.x) via the
 * official Microsoft bootstrapper, which downloads and installs the latest
 * Teams MSIX package.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Microsoft Teams is already installed...');

  // Check if Teams package is installed via Chocolatey
  const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (packageInstalled) {
    console.log('Microsoft Teams is already installed via Chocolatey, skipping installation.');
    return;
  }

  // Also check for the older package name
  const oldPackageInstalled = await choco.isPackageInstalled('microsoft-teams');
  if (oldPackageInstalled) {
    console.log('Microsoft Teams (classic) is already installed, skipping installation.');
    console.log('');
    console.log('NOTE: To upgrade to the new Teams client, run:');
    console.log('  choco uninstall microsoft-teams -y');
    console.log('  choco install microsoft-teams-new-bootstrapper -y');
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
      'Then retry installing Microsoft Teams.'
    );
  }

  console.log('Installing Microsoft Teams via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install Microsoft Teams
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Microsoft Teams via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Update Chocolatey: choco upgrade chocolatey -y\n` +
      `  3. Try manual installation: choco install microsoft-teams-new-bootstrapper -y --force`
    );
  }

  console.log('Microsoft Teams installed successfully.');
  console.log('');
  console.log('To launch Microsoft Teams:');
  console.log('  - Search for "Microsoft Teams" in the Start Menu');
  console.log('  - Or run: Start-Process ms-teams:');
  console.log('');
  console.log('On first launch, sign in with your Microsoft account (personal, work, or school).');
}

/**
 * Install Microsoft Teams for WSL (Windows Subsystem for Linux).
 *
 * WSL runs a Linux environment, but the recommended approach is to install
 * Teams on the Windows host and launch it from WSL. This provides better
 * audio/video support and system integration.
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - Administrator access on Windows for installation
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Installing Microsoft Teams on the Windows host...');
  console.log('This is the recommended approach for better audio/video support.');
  console.log('');

  // Install Teams on Windows host via PowerShell
  console.log('Installing Microsoft Teams via Chocolatey on Windows...');
  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "choco install ${CHOCO_PACKAGE_NAME} -y"`
  );

  if (installResult.code !== 0) {
    // Check if Chocolatey is not installed
    if (installResult.stderr && installResult.stderr.includes('not recognized')) {
      throw new Error(
        'Chocolatey is not installed on Windows. Please install it first:\n\n' +
        'Run the following in an Administrator PowerShell on Windows:\n' +
        '  Set-ExecutionPolicy Bypass -Scope Process -Force; ' +
        '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; ' +
        'iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))\n\n' +
        'Then retry installing Microsoft Teams from WSL.'
      );
    }

    throw new Error(
      `Failed to install Microsoft Teams.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run the installer from an Administrator terminal\n` +
      `  3. Try installing directly from PowerShell:\n` +
      `     choco install microsoft-teams-new-bootstrapper -y`
    );
  }

  console.log('Microsoft Teams installed successfully on Windows.');
  console.log('');
  console.log('To launch Teams from WSL:');
  console.log('  cmd.exe /c start ms-teams:');
  console.log('');
  console.log('On first launch, sign in with your Microsoft account.');
}

/**
 * Install Microsoft Teams from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Microsoft Teams
 * on the Windows host using Chocolatey via PowerShell interop.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey package manager installed on Windows
 * - Administrator privileges
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Microsoft Teams on the Windows host...');
  console.log('');

  // Install via PowerShell using Chocolatey
  console.log('Installing Microsoft Teams via Chocolatey...');
  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "choco install ${CHOCO_PACKAGE_NAME} -y"`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Microsoft Teams.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell:\n` +
      `     choco install microsoft-teams-new-bootstrapper -y`
    );
  }

  console.log('Microsoft Teams installed successfully.');
  console.log('');
  console.log('To launch Teams from Git Bash:');
  console.log('  start ms-teams:');
  console.log('  OR');
  console.log('  cmd //c "start ms-teams:"');
  console.log('');
  console.log('On first launch, sign in with your Microsoft account.');
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Microsoft Teams via Homebrew cask
 * - Ubuntu/Debian: Teams for Linux via APT repository
 * - Raspberry Pi OS: Teams for Linux via Snap (ARM support)
 * - Amazon Linux/RHEL/Fedora: Teams for Linux via RPM repository
 * - Windows: Microsoft Teams via Chocolatey
 * - WSL (Ubuntu): Microsoft Teams on Windows host
 * - Git Bash: Microsoft Teams on Windows host
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases and variant platforms
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
    console.log(`Microsoft Teams is not available for ${platform.type}.`);
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

// Allow direct execution: node microsoft-teams.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
