#!/usr/bin/env node

/**
 * @fileoverview Install Zoom.
 * @module installs/zoom
 *
 * Zoom is a video conferencing and collaboration platform that provides video
 * meetings, webinars, chat, and phone services. It enables teams and individuals
 * to connect through high-quality video and audio across desktop and mobile devices.
 *
 * This installer provides:
 * - Zoom Desktop App for macOS via Homebrew cask
 * - Zoom Desktop App for Windows via Chocolatey
 * - Zoom Desktop App for Ubuntu/Debian via direct .deb download
 * - Zoom Desktop App for Amazon Linux/RHEL via direct RPM download
 * - Instructions for WSL and Git Bash (uses Windows installation)
 *
 * IMPORTANT PLATFORM NOTES:
 * - Raspberry Pi OS: Zoom does not provide native ARM packages. Users should
 *   use the Zoom web application at https://zoom.us/wc instead.
 * - Linux requires 64-bit x86_64 architecture - ARM is not supported.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Indicates whether this installer requires a desktop environment.
 * Zoom is a GUI video conferencing application and requires a display.
 * @type {boolean}
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for Zoom on macOS.
 * This installs the full desktop application to /Applications.
 */
const HOMEBREW_CASK_NAME = 'zoom';

/**
 * The Chocolatey package name for Zoom on Windows.
 */
const CHOCO_PACKAGE_NAME = 'zoom';

/**
 * The download URL for Zoom's .deb package (Ubuntu/Debian).
 * This downloads the latest 64-bit x86_64 version directly from Zoom.
 */
const ZOOM_DEB_URL = 'https://zoom.us/client/latest/zoom_amd64.deb';

/**
 * The download URL for Zoom's RPM package (Amazon Linux/RHEL).
 * This downloads the latest 64-bit x86_64 version directly from Zoom.
 */
const ZOOM_RPM_URL = 'https://zoom.us/client/latest/zoom_x86_64.rpm';

/**
 * Temporary file path for the downloaded Zoom .deb package.
 */
const ZOOM_DEB_TEMP_PATH = '/tmp/zoom_amd64.deb';

/**
 * Check if Zoom Desktop application is installed on macOS.
 *
 * Looks for zoom.us.app in /Applications or ~/Applications.
 * Zoom uses "zoom.us.app" as its bundle name, not "Zoom.app".
 *
 * @returns {boolean} True if zoom.us.app exists, false otherwise
 */
function isZoomInstalledMacOS() {
  return macosApps.isAppInstalled('zoom.us');
}

/**
 * Check if the Zoom command is available in PATH on Linux systems.
 *
 * After installation, the 'zoom' command should be available.
 *
 * @returns {boolean} True if zoom command exists, false otherwise
 */
function isZoomCommandAvailable() {
  return shell.commandExists('zoom');
}

/**
 * Check if Zoom is installed on Linux via dpkg.
 *
 * Queries the dpkg database to see if the 'zoom' package is installed.
 * This is more reliable than checking for the zoom command since the
 * command might not be in PATH in all scenarios.
 *
 * @returns {Promise<boolean>} True if Zoom package is installed, false otherwise
 */
async function isZoomInstalledDpkg() {
  const result = await shell.exec('dpkg -l | grep -i "^ii.*zoom"');
  return result.code === 0 && result.stdout.trim().length > 0;
}

/**
 * Check if Zoom is installed on RPM-based systems.
 *
 * Queries the rpm database to see if any zoom package is installed.
 *
 * @returns {Promise<boolean>} True if Zoom package is installed, false otherwise
 */
async function isZoomInstalledRpm() {
  const result = await shell.exec('rpm -qa | grep -i "^zoom"');
  return result.code === 0 && result.stdout.trim().length > 0;
}

/**
 * Install Zoom Desktop on macOS using Homebrew cask.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - At least 500 MB free disk space
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * The installation uses the Homebrew cask 'zoom' which downloads and installs
 * the Zoom desktop application to /Applications/zoom.us.app.
 *
 * NOTE: After installation, Zoom must be launched manually. On first launch,
 * it will prompt you to sign in or join a meeting.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Zoom is already installed...');

  // Check if zoom.us.app already exists in Applications
  if (isZoomInstalledMacOS()) {
    console.log('Zoom is already installed, skipping installation.');
    return;
  }

  // Also check if the cask is installed via Homebrew
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Zoom is already installed via Homebrew, skipping installation.');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Zoom.'
    );
  }

  console.log('Installing Zoom via Homebrew...');

  // Install Zoom cask with quiet flag for cleaner output
  const result = await shell.exec('brew install --quiet --cask zoom');

  if (result.code !== 0) {
    throw new Error(
      `Failed to install Zoom via Homebrew.\n` +
      `Output: ${result.stderr || result.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Check if macOS version is 10.15 (Catalina) or later\n` +
      `  3. Try manual installation: brew reinstall --cask zoom`
    );
  }

  // Verify installation succeeded
  if (!isZoomInstalledMacOS()) {
    throw new Error(
      'Installation command completed but zoom.us.app was not found in Applications.\n\n' +
      'Please try:\n' +
      '  1. Check /Applications for zoom.us.app\n' +
      '  2. Run: brew reinstall --cask zoom'
    );
  }

  console.log('Zoom installed successfully.');
  console.log('');
  console.log('To launch Zoom:');
  console.log('  - Open from Applications folder, or');
  console.log('  - Run: open -a "zoom.us"');
  console.log('');
  console.log('On first launch, you will be prompted to sign in or join a meeting.');
}

/**
 * Install Zoom on Ubuntu/Debian by downloading the .deb package.
 *
 * Prerequisites:
 * - Ubuntu 18.04 or later, or Debian 10 (Buster) or later (64-bit x86_64)
 * - sudo privileges
 * - At least 500 MB free disk space
 *
 * IMPORTANT: Zoom only provides 64-bit x86_64 packages for Debian/Ubuntu.
 * ARM-based systems are not supported with native packages.
 *
 * This function:
 * 1. Downloads the latest Zoom .deb package from zoom.us
 * 2. Installs it using apt-get (which handles dependencies)
 * 3. Cleans up the downloaded file
 *
 * @returns {Promise<void>}
 * @throws {Error} If architecture is not supported or installation fails
 */
async function install_ubuntu() {
  console.log('Checking if Zoom is already installed...');

  // Check if Zoom is already installed
  const isInstalled = await isZoomInstalledDpkg();
  if (isInstalled) {
    console.log('Zoom is already installed, skipping installation.');
    return;
  }

  // Also check if zoom command exists (could be installed another way)
  if (isZoomCommandAvailable()) {
    console.log('Zoom is already installed, skipping installation.');
    return;
  }

  // Verify architecture - Zoom only provides x86_64 packages
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  if (arch !== 'x86_64') {
    console.log(`Zoom is not available for ${arch} architecture.`);
    console.log('');
    console.log('Zoom requires 64-bit x86_64 architecture for the native desktop app.');
    console.log('You can use the Zoom web application at https://zoom.us/wc instead.');
    return;
  }

  console.log('Downloading Zoom .deb package...');

  // Step 1: Download the Zoom .deb package
  const downloadResult = await shell.exec(
    `wget -q "${ZOOM_DEB_URL}" -O "${ZOOM_DEB_TEMP_PATH}"`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      `Failed to download Zoom package.\n` +
      `Output: ${downloadResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check your internet connection\n` +
      `  2. Ensure wget is installed: sudo apt-get install -y wget\n` +
      `  3. Try manual download: wget "${ZOOM_DEB_URL}"`
    );
  }

  console.log('Updating package lists...');

  // Update apt package lists first
  const updateResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y'
  );
  if (updateResult.code !== 0) {
    console.log('Warning: apt-get update had issues, continuing with installation...');
  }

  console.log('Installing Zoom...');

  // Step 2: Install the .deb package using apt-get (handles dependencies)
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y "${ZOOM_DEB_TEMP_PATH}"`
  );

  // Step 3: Clean up the downloaded file regardless of install result
  await shell.exec(`rm -f "${ZOOM_DEB_TEMP_PATH}"`);

  if (installResult.code !== 0) {
    // Try to fix broken dependencies and retry
    console.log('Attempting to fix dependencies...');
    const fixResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get --fix-broken install -y'
    );

    if (fixResult.code !== 0) {
      throw new Error(
        `Failed to install Zoom.\n` +
        `Output: ${installResult.stderr}\n\n` +
        `Troubleshooting:\n` +
        `  1. Run: sudo apt-get --fix-broken install -y\n` +
        `  2. Install missing dependencies:\n` +
        `     sudo apt-get install -y libgl1-mesa-glx libegl1-mesa libxcb-xtest0 libxcb-xinerama0\n` +
        `  3. Retry installation`
      );
    }
  }

  // Verify installation succeeded
  const verifyInstalled = await isZoomInstalledDpkg();
  if (!verifyInstalled && !isZoomCommandAvailable()) {
    throw new Error(
      'Installation command completed but Zoom was not found.\n\n' +
      'Please try:\n' +
      '  1. Run: dpkg -l | grep zoom\n' +
      '  2. Download manually from https://zoom.us/download'
    );
  }

  console.log('Zoom installed successfully.');
  console.log('');
  console.log('To launch Zoom:');
  console.log('  - Run: zoom &');
  console.log('  - Or find Zoom in your application menu');
  console.log('');
  console.log('On first launch, you will be prompted to sign in or join a meeting.');
}

/**
 * Install Zoom on Raspberry Pi OS.
 *
 * PLATFORM LIMITATION: Zoom does not provide native ARM packages. The official
 * Zoom desktop application is only available for x86_64 architecture. Raspberry
 * Pi devices use ARM processors, which are not supported.
 *
 * This function gracefully informs the user that Zoom is not available for
 * Raspberry Pi and suggests using the web application instead.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Zoom is not available for Raspberry Pi OS.');
  return;
}

/**
 * Install Zoom on Amazon Linux/RHEL using DNF/YUM with direct RPM download.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, RHEL 8/9, or Fedora (64-bit x86_64)
 * - sudo privileges
 * - Graphical desktop environment (required for Zoom GUI)
 * - At least 500 MB free disk space
 *
 * IMPORTANT: Amazon Linux EC2 instances typically run headless (no GUI).
 * If you are running a headless server, use the Zoom web application at
 * https://zoom.us/wc or the Zoom API for automation.
 *
 * This function:
 * 1. Imports the Zoom GPG key for package verification
 * 2. Installs Zoom directly from the RPM URL using dnf/yum
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('Checking if Zoom is already installed...');

  // Check if Zoom is already installed
  const isInstalled = await isZoomInstalledRpm();
  if (isInstalled) {
    console.log('Zoom is already installed, skipping installation.');
    return;
  }

  // Also check if zoom command exists (could be installed another way)
  if (isZoomCommandAvailable()) {
    console.log('Zoom is already installed, skipping installation.');
    return;
  }

  // Verify architecture - Zoom only provides x86_64 packages
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  if (arch !== 'x86_64') {
    console.log(`Zoom is not available for ${arch} architecture.`);
    console.log('');
    console.log('Zoom requires 64-bit x86_64 architecture for the native desktop app.');
    console.log('You can use the Zoom web application at https://zoom.us/wc instead.');
    return;
  }

  // Detect package manager (dnf for AL2023/RHEL8+, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    throw new Error(
      'Neither dnf nor yum package manager found.\n' +
      'This installer supports Amazon Linux 2023 (dnf) and Amazon Linux 2 (yum).'
    );
  }

  console.log(`Detected package manager: ${packageManager}`);

  // Step 1: Import the Zoom GPG key for package verification
  console.log('Importing Zoom GPG key...');
  const gpgResult = await shell.exec(
    'sudo rpm --import "https://zoom.us/linux/download/pubkey?version=6-3-10"'
  );
  if (gpgResult.code !== 0) {
    // GPG key import failure is not always fatal - continue with installation
    console.log('Warning: Could not import GPG key. Continuing with installation...');
  }

  // Step 2: Install Zoom directly from the RPM URL
  console.log('Installing Zoom...');
  console.log('This may take a few minutes...');

  const installResult = await shell.exec(
    `sudo ${packageManager} install -y "${ZOOM_RPM_URL}"`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Zoom.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Update system packages: sudo ${packageManager} update -y\n` +
      `  2. Retry: sudo ${packageManager} install -y ${ZOOM_RPM_URL}\n` +
      `  3. Check network connectivity`
    );
  }

  // Verify installation succeeded
  const verifyInstalled = await isZoomInstalledRpm();
  if (!verifyInstalled && !isZoomCommandAvailable()) {
    throw new Error(
      'Installation command completed but Zoom was not found.\n\n' +
      'Please try:\n' +
      '  1. Run: rpm -qa | grep zoom\n' +
      '  2. Download manually from https://zoom.us/download'
    );
  }

  console.log('Zoom installed successfully.');
  console.log('');
  console.log('To launch Zoom:');
  console.log('  - Run: zoom &');
  console.log('  - Or find Zoom in your application menu');
  console.log('');
  console.log('NOTE: Zoom requires a graphical desktop environment.');
  console.log('If running on a headless server, use the web application at:');
  console.log('  https://zoom.us/wc');
}

/**
 * Install Zoom on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 1903 or later, or Windows 11 (64-bit)
 * - At least 500 MB free disk space
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * The installation uses Chocolatey's 'zoom' package which downloads and
 * installs the official Zoom desktop application.
 *
 * NOTE: After installation, Zoom can be launched from the Start Menu or
 * via the 'zoom' command.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Zoom is already installed...');

  // Check if Zoom is already installed via Chocolatey
  const isInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (isInstalled) {
    console.log('Zoom is already installed, skipping installation.');
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
      'Then retry installing Zoom.'
    );
  }

  console.log('Installing Zoom via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install Zoom
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Zoom via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Run 'choco list zoom' to check availability\n` +
      `  3. Try manual installation: choco install zoom -y --force`
    );
  }

  // Verify installation
  const verifyInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but Zoom was not found.\n\n' +
      'Please try:\n' +
      '  1. Run: choco list zoom\n' +
      '  2. Retry: choco install zoom -y'
    );
  }

  console.log('Zoom installed successfully.');
  console.log('');
  console.log('To launch Zoom:');
  console.log('  - Open from Start Menu, or');
  console.log('  - Run: Start-Process zoom');
  console.log('');
  console.log('On first launch, you will be prompted to sign in or join a meeting.');
}

/**
 * Install Zoom when running from Ubuntu on WSL (Windows Subsystem for Linux).
 *
 * PLATFORM APPROACH: Zoom is installed on the Windows host and accessed from
 * WSL. While WSL with WSLg can technically run Linux GUI applications, the
 * recommended approach is to install Zoom on Windows and launch it from WSL
 * using Windows interoperability.
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - Chocolatey installed on Windows for Zoom installation
 *
 * This function installs Zoom on the Windows host via PowerShell/Chocolatey.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation on Windows host fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Installing Zoom on the Windows host...');
  console.log('');

  // Check if Zoom is already available on Windows (via Chocolatey)
  const slackCheck = await shell.exec('cmd.exe /c "choco list zoom --local-only" 2>/dev/null');
  if (slackCheck.code === 0 && slackCheck.stdout.toLowerCase().includes('zoom')) {
    console.log('Zoom is already installed on Windows, skipping installation.');
    console.log('');
    console.log('To launch Zoom from WSL:');
    console.log('  cmd.exe /c start zoom');
    return;
  }

  console.log('Installing Zoom via Chocolatey on Windows...');
  console.log('This may take a few minutes...');

  // Install via PowerShell using Chocolatey
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install zoom -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Zoom on Windows host.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Open an Administrator PowerShell on Windows and run:\n` +
      `     choco install zoom -y\n` +
      `  3. Then launch from WSL with: cmd.exe /c start zoom`
    );
  }

  console.log('Zoom installed successfully on Windows.');
  console.log('');
  console.log('To launch Zoom from WSL:');
  console.log('  cmd.exe /c start zoom');
  console.log('');
  console.log('Alternative - open Zoom web in browser:');
  console.log('  cmd.exe /c start https://zoom.us/wc');
  console.log('');
  console.log('TIP: Add an alias to ~/.bashrc for convenience:');
  console.log('  echo \'alias zoom="cmd.exe /c start zoom"\' >> ~/.bashrc');
}

/**
 * Install Zoom from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Zoom on the
 * Windows host using Chocolatey via PowerShell interop.
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
  console.log('Installing Zoom on the Windows host...');
  console.log('');

  // Check if Zoom is already installed
  const zoomCheck = await shell.exec('choco list zoom --local-only 2>/dev/null');
  if (zoomCheck.code === 0 && zoomCheck.stdout.toLowerCase().includes('zoom')) {
    console.log('Zoom is already installed, skipping installation.');
    console.log('');
    console.log('To launch Zoom:');
    console.log('  start zoom');
    return;
  }

  console.log('Installing Zoom via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install via PowerShell using Chocolatey
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install zoom -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Zoom.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell:\n` +
      `     choco install zoom -y`
    );
  }

  console.log('Zoom installed successfully.');
  console.log('');
  console.log('To launch Zoom from Git Bash:');
  console.log('  start zoom');
  console.log('');
  console.log('Or use the explicit Windows command:');
  console.log('  cmd //c "start zoom"');
}

/**
 * Check if Zoom is installed on the current system.
 * @returns {Promise<boolean>} True if Zoom is installed
 */
async function isInstalled() {
  const platform = os.detect();
  if (platform.type === 'macos') {
    return isZoomInstalledMacOS();
  }
  if (platform.type === 'windows') {
    return choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  }
  if (['ubuntu', 'debian'].includes(platform.type)) {
    return isZoomInstalledDpkg();
  }
  if (['amazon_linux', 'fedora', 'rhel'].includes(platform.type)) {
    return isZoomInstalledRpm();
  }
  return isZoomCommandAvailable();
}

/**
 * Check if this installer is supported on the current platform.
 * Zoom is supported on all major platforms except Raspberry Pi OS
 * (ARM architecture not supported by Zoom).
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();

  // First check if the platform is supported
  const supportedPlatforms = ['macos', 'ubuntu', 'debian', 'wsl', 'amazon_linux', 'fedora', 'rhel', 'windows', 'gitbash'];
  if (!supportedPlatforms.includes(platform.type)) {
    return false;
  }

  // This installer requires a desktop environment
  if (REQUIRES_DESKTOP && !os.isDesktopAvailable()) {
    return false;
  }

  return true;
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Zoom Desktop via Homebrew cask
 * - Ubuntu/Debian: Zoom Desktop via .deb package download (x86_64 only)
 * - Raspberry Pi OS: Not supported (graceful message)
 * - Amazon Linux/RHEL: Zoom Desktop via RPM download (x86_64 only)
 * - Windows: Zoom Desktop via Chocolatey
 * - WSL (Ubuntu): Installs Zoom on Windows host
 * - Git Bash: Installs Zoom on Windows host
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases and variations
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
    console.log(`Zoom is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

// Export all functions for use as a module and for testing
module.exports = {
  REQUIRES_DESKTOP,
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

// Allow direct execution: node zoom.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
