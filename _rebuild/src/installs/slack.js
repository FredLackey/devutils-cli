#!/usr/bin/env node

/**
 * @fileoverview Install Slack.
 * @module installs/slack
 *
 * Slack is a team communication and collaboration platform that provides
 * messaging, file sharing, and integrations with thousands of productivity tools.
 * It enables teams to communicate through channels, direct messages, and huddles
 * (audio/video calls).
 *
 * This installer provides:
 * - Slack Desktop App for macOS via Homebrew cask
 * - Slack Desktop App for Windows via Chocolatey
 * - Slack Desktop App for Ubuntu/Debian via Snap (x86_64 only)
 * - Slack Desktop App for Amazon Linux/RHEL via RPM repository
 * - Instructions to launch Windows Slack from WSL/Git Bash
 *
 * IMPORTANT PLATFORM NOTES:
 * - Raspberry Pi OS: Slack does not provide native ARM packages. Users should
 *   use the Slack web application at https://app.slack.com instead.
 * - Linux is officially in beta and requires 64-bit x86_64 architecture.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const snap = require('../utils/ubuntu/snap');
const choco = require('../utils/windows/choco');

/**
 * Indicates whether this installer requires a desktop environment.
 * Slack is a GUI application and requires a display.
 * @type {boolean}
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for Slack on macOS.
 * This installs the full desktop application to /Applications.
 */
const HOMEBREW_CASK_NAME = 'slack';

/**
 * The Chocolatey package name for Slack on Windows.
 */
const CHOCO_PACKAGE_NAME = 'slack';

/**
 * The Snap package name for Slack on Ubuntu/Debian.
 */
const SNAP_PACKAGE_NAME = 'slack';

/**
 * Check if Slack Desktop application is installed on macOS.
 *
 * Looks for Slack.app in /Applications or ~/Applications.
 *
 * @returns {boolean} True if Slack.app exists, false otherwise
 */
function isSlackInstalledMacOS() {
  return macosApps.isAppInstalled('Slack');
}

/**
 * Check if the Slack command is available in PATH on Linux systems.
 *
 * After Snap installation, the 'slack' command should be available.
 *
 * @returns {boolean} True if slack command exists, false otherwise
 */
function isSlackCommandAvailable() {
  return shell.commandExists('slack');
}

/**
 * Install Slack Desktop on macOS using Homebrew cask.
 *
 * Prerequisites:
 * - macOS 11 (Big Sur) or later
 * - Homebrew package manager installed
 * - At least 500 MB free disk space
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * The installation uses the Homebrew cask 'slack' which downloads and installs
 * the Slack desktop application to /Applications/Slack.app.
 *
 * NOTE: After installation, Slack must be launched manually. On first launch,
 * it will prompt you to sign in with your workspace URL or email address.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Slack is already installed...');

  // Check if Slack.app already exists in Applications
  if (isSlackInstalledMacOS()) {
    console.log('Slack is already installed, skipping installation.');
    return;
  }

  // Also check if the cask is installed via Homebrew
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Slack is already installed via Homebrew, skipping installation.');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Slack.'
    );
  }

  console.log('Installing Slack via Homebrew...');

  // Install Slack cask with quiet flag for cleaner output
  const result = await shell.exec('brew install --quiet --cask slack');

  if (result.code !== 0) {
    throw new Error(
      `Failed to install Slack via Homebrew.\n` +
      `Output: ${result.stderr || result.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Check if macOS version is 11 (Big Sur) or later\n` +
      `  3. Try manual installation: brew reinstall --cask slack`
    );
  }

  // Verify installation succeeded
  if (!isSlackInstalledMacOS()) {
    throw new Error(
      'Installation command completed but Slack.app was not found in Applications.\n\n' +
      'Please try:\n' +
      '  1. Check /Applications for Slack.app\n' +
      '  2. Run: brew reinstall --cask slack'
    );
  }

  console.log('Slack installed successfully.');
  console.log('');
  console.log('To launch Slack:');
  console.log('  - Open from Applications folder, or');
  console.log('  - Run: open -a Slack');
  console.log('');
  console.log('On first launch, you will be prompted to sign in with your');
  console.log('workspace URL or email address.');
}

/**
 * Install Slack on Ubuntu/Debian using Snap.
 *
 * Prerequisites:
 * - Ubuntu 16.04 LTS or later, or Debian 10 (Buster) or later
 * - 64-bit x86_64 architecture (ARM is not supported)
 * - sudo privileges
 * - Snap package manager (pre-installed on Ubuntu 16.04+)
 * - At least 500 MB free disk space
 *
 * The installation uses the Snap package which provides automatic updates
 * and sandboxed execution. The --classic flag is required to allow Slack
 * access to system resources for features like file access and system tray.
 *
 * IMPORTANT: Slack Snap is only available for x86_64 architecture. ARM-based
 * systems (including Raspberry Pi) are not supported.
 *
 * @returns {Promise<void>}
 * @throws {Error} If architecture is not supported or installation fails
 */
async function install_ubuntu() {
  console.log('Checking if Slack is already installed...');

  // Check if Slack is already installed via Snap
  const isInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (isInstalled) {
    console.log('Slack is already installed, skipping installation.');
    return;
  }

  // Also check if slack command exists (could be installed another way)
  if (isSlackCommandAvailable()) {
    console.log('Slack is already installed, skipping installation.');
    return;
  }

  // Verify architecture - Slack Snap only supports x86_64
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  if (arch !== 'x86_64') {
    console.log(`Slack is not available for ${arch} architecture.`);
    console.log('');
    console.log('Slack requires 64-bit x86_64 architecture for the native desktop app.');
    console.log('You can use the Slack web application at https://app.slack.com instead.');
    return;
  }

  // Verify Snap is available
  if (!snap.isInstalled()) {
    throw new Error(
      'Snap package manager is not installed.\n\n' +
      'On Ubuntu, Snap should be pre-installed. If not, install it with:\n' +
      '  sudo apt-get update && sudo apt-get install -y snapd\n' +
      '  sudo systemctl enable --now snapd.socket\n\n' +
      'Then log out and back in, and retry installing Slack.'
    );
  }

  console.log('Installing Slack via Snap...');
  console.log('This may take a few minutes...');

  // Install Slack with classic confinement for full system access
  const result = await snap.install(SNAP_PACKAGE_NAME, { classic: true });

  if (!result.success) {
    throw new Error(
      `Failed to install Slack via Snap.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure snapd is running: sudo systemctl start snapd\n` +
      `  2. Check architecture: uname -m (must be x86_64)\n` +
      `  3. Try manual installation: sudo snap install slack --classic`
    );
  }

  // Verify installation succeeded
  const verifyInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but Slack was not found.\n\n' +
      'Please try:\n' +
      '  1. Run: snap list slack\n' +
      '  2. Retry: sudo snap install slack --classic'
    );
  }

  console.log('Slack installed successfully.');
  console.log('');
  console.log('To launch Slack:');
  console.log('  - Run: slack &');
  console.log('  - Or find Slack in your application menu');
  console.log('');
  console.log('On first launch, you will be prompted to sign in with your');
  console.log('workspace URL or email address.');
}

/**
 * Install Slack on Raspberry Pi OS.
 *
 * PLATFORM LIMITATION: Slack does not provide native ARM packages. The official
 * Slack desktop application and Snap package are only available for x86_64
 * architecture. Raspberry Pi devices use ARM processors, which are not supported.
 *
 * This function gracefully informs the user that Slack is not available for
 * Raspberry Pi and suggests using the web application instead.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Slack is not available for Raspberry Pi OS.');
  console.log('');
  console.log('The Slack desktop application requires x86_64 architecture.');
  console.log('Raspberry Pi uses ARM processors which are not supported.');
  console.log('');
  console.log('You can access Slack via the web application at:');
  console.log('  https://app.slack.com');
  return;
}

/**
 * Install Slack on Amazon Linux/RHEL using the official RPM repository.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, RHEL 8/9, or Fedora (64-bit x86_64)
 * - sudo privileges
 * - Graphical desktop environment (required for Slack GUI)
 * - At least 500 MB free disk space
 *
 * IMPORTANT: Amazon Linux EC2 instances typically run headless (no GUI).
 * If you are running a headless server, use the Slack web application at
 * https://app.slack.com or the Slack API for automation.
 *
 * This function:
 * 1. Imports the Slack GPG key for package verification
 * 2. Creates the Slack YUM/DNF repository configuration
 * 3. Installs Slack via the package manager
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('Checking if Slack is already installed...');

  // Check if Slack is already installed
  if (isSlackCommandAvailable()) {
    console.log('Slack is already installed, skipping installation.');
    return;
  }

  // Also check via rpm
  const rpmCheck = await shell.exec('rpm -qa | grep -i "^slack"');
  if (rpmCheck.code === 0 && rpmCheck.stdout.trim()) {
    console.log('Slack is already installed, skipping installation.');
    return;
  }

  // Verify architecture - Slack only supports x86_64
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  if (arch !== 'x86_64') {
    console.log(`Slack is not available for ${arch} architecture.`);
    console.log('');
    console.log('Slack requires 64-bit x86_64 architecture for the native desktop app.');
    console.log('You can use the Slack web application at https://app.slack.com instead.');
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

  // Step 1: Import the Slack GPG key
  console.log('Importing Slack GPG key...');
  const gpgResult = await shell.exec(
    'sudo rpm --import https://packagecloud.io/slacktechnologies/slack/gpgkey'
  );
  if (gpgResult.code !== 0) {
    throw new Error(
      `Failed to import Slack GPG key.\n` +
      `Output: ${gpgResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure curl is installed: sudo ${packageManager} install -y curl ca-certificates\n` +
      `  2. Check network connectivity\n` +
      `  3. Retry: sudo rpm --import https://packagecloud.io/slacktechnologies/slack/gpgkey`
    );
  }

  // Step 2: Create the Slack repository configuration
  console.log('Adding Slack repository...');
  const repoContent = `[slack]
name=Slack
baseurl=https://packagecloud.io/slacktechnologies/slack/fedora/21/x86_64
enabled=1
gpgcheck=1
gpgkey=https://packagecloud.io/slacktechnologies/slack/gpgkey
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
metadata_expire=300
`;

  // Write the repository file using tee to handle sudo
  const repoResult = await shell.exec(
    `echo '${repoContent}' | sudo tee /etc/yum.repos.d/slack.repo > /dev/null`
  );
  if (repoResult.code !== 0) {
    throw new Error(
      `Failed to create Slack repository file.\n` +
      `Output: ${repoResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check sudo permissions\n` +
      `  2. Verify /etc/yum.repos.d/ exists and is writable`
    );
  }

  // Step 3: Install Slack
  console.log('Installing Slack...');
  console.log('This may take a few minutes...');

  const installResult = await shell.exec(`sudo ${packageManager} install -y slack`);

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Slack.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Verify the repository file: cat /etc/yum.repos.d/slack.repo\n` +
      `  2. Update package cache: sudo ${packageManager} clean all && sudo ${packageManager} makecache\n` +
      `  3. Retry: sudo ${packageManager} install -y slack`
    );
  }

  // Verify installation
  if (!isSlackCommandAvailable()) {
    throw new Error(
      'Installation command completed but Slack was not found.\n\n' +
      'Please try:\n' +
      '  1. Check: rpm -qa | grep slack\n' +
      '  2. Retry: sudo ' + packageManager + ' install -y slack'
    );
  }

  console.log('Slack installed successfully.');
  console.log('');
  console.log('To launch Slack:');
  console.log('  - Run: slack &');
  console.log('  - Or find Slack in your application menu');
  console.log('');
  console.log('NOTE: Slack requires a graphical desktop environment.');
  console.log('If running on a headless server, use the web application at:');
  console.log('  https://app.slack.com');
}

/**
 * Install Slack on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 1903 or later, or Windows 11 (64-bit)
 * - At least 500 MB free disk space
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * The installation uses Chocolatey's 'slack' package which downloads and
 * installs the official Slack desktop application.
 *
 * NOTE: After installation, Slack can be launched from the Start Menu or
 * via the 'slack:' protocol handler.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Slack is already installed...');

  // Check if Slack is already installed via Chocolatey
  const isInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (isInstalled) {
    console.log('Slack is already installed, skipping installation.');
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
      'Then retry installing Slack.'
    );
  }

  console.log('Installing Slack via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install Slack
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Slack via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Run 'choco list slack' to check availability\n` +
      `  3. Try manual installation: choco install slack -y --force`
    );
  }

  // Verify installation
  const verifyInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but Slack was not found.\n\n' +
      'Please try:\n' +
      '  1. Run: choco list slack\n' +
      '  2. Retry: choco install slack -y'
    );
  }

  console.log('Slack installed successfully.');
  console.log('');
  console.log('To launch Slack:');
  console.log('  - Open from Start Menu, or');
  console.log('  - Run: Start-Process slack:');
  console.log('');
  console.log('On first launch, you will be prompted to sign in with your');
  console.log('workspace URL or email address.');
}

/**
 * Install Slack when running from Ubuntu on WSL (Windows Subsystem for Linux).
 *
 * PLATFORM APPROACH: Slack is installed on the Windows host and accessed from
 * WSL. While WSL with WSLg can technically run Linux GUI applications, the
 * recommended approach is to install Slack on Windows and launch it from WSL
 * using Windows interoperability.
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - Chocolatey installed on Windows for Slack installation
 *
 * This function installs Slack on the Windows host via PowerShell/Chocolatey.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation on Windows host fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Installing Slack on the Windows host...');
  console.log('');

  // Check if Slack is already available (can test via Windows interop)
  const slackCheck = await shell.exec('cmd.exe /c "choco list slack --local-only" 2>/dev/null');
  if (slackCheck.code === 0 && slackCheck.stdout.toLowerCase().includes('slack')) {
    console.log('Slack is already installed on Windows, skipping installation.');
    console.log('');
    console.log('To launch Slack from WSL:');
    console.log('  cmd.exe /c start slack:');
    return;
  }

  console.log('Installing Slack via Chocolatey on Windows...');
  console.log('This may take a few minutes...');

  // Install via PowerShell using Chocolatey
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install slack -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Slack on Windows host.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Open an Administrator PowerShell on Windows and run:\n` +
      `     choco install slack -y\n` +
      `  3. Then launch from WSL with: cmd.exe /c start slack:`
    );
  }

  console.log('Slack installed successfully on Windows.');
  console.log('');
  console.log('To launch Slack from WSL:');
  console.log('  cmd.exe /c start slack:');
  console.log('');
  console.log('Alternative - open Slack web in browser:');
  console.log('  cmd.exe /c start https://app.slack.com');
  console.log('');
  console.log('TIP: Add an alias to ~/.bashrc for convenience:');
  console.log('  echo \'alias slack="cmd.exe /c start slack:"\' >> ~/.bashrc');
}

/**
 * Install Slack from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Slack on the
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
  console.log('Installing Slack on the Windows host...');
  console.log('');

  // Check if Slack is already installed
  const slackCheck = await shell.exec('choco list slack --local-only 2>/dev/null');
  if (slackCheck.code === 0 && slackCheck.stdout.toLowerCase().includes('slack')) {
    console.log('Slack is already installed, skipping installation.');
    console.log('');
    console.log('To launch Slack:');
    console.log('  start slack:');
    return;
  }

  console.log('Installing Slack via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install via PowerShell using Chocolatey
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install slack -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Slack.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell:\n` +
      `     choco install slack -y`
    );
  }

  console.log('Slack installed successfully.');
  console.log('');
  console.log('To launch Slack from Git Bash:');
  console.log('  start slack:');
  console.log('');
  console.log('Or use the explicit Windows command:');
  console.log('  cmd //c "start slack:"');
}

/**
 * Check if Slack is installed on the current platform.
 *
 * This function performs platform-specific checks to determine if Slack
 * is already installed on the system.
 *
 * @returns {Promise<boolean>} True if Slack is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    return isSlackInstalledMacOS();
  }

  if (platform.type === 'windows' || platform.type === 'gitbash') {
    return choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  }

  if (['ubuntu', 'debian', 'wsl'].includes(platform.type)) {
    return snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  }

  // For other platforms (Amazon Linux, etc.), check for command
  return isSlackCommandAvailable();
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Slack is NOT available on ARM platforms (Raspberry Pi) and requires
 * a desktop environment since it is a GUI application.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();

  // First check if the platform is supported
  // Slack does NOT provide native ARM packages for Raspberry Pi
  const supportedPlatforms = ['macos', 'ubuntu', 'debian', 'wsl', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'];
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
 * - macOS: Slack Desktop via Homebrew cask
 * - Ubuntu/Debian: Slack Desktop via Snap (x86_64 only)
 * - Raspberry Pi OS: Not supported (graceful message with web app alternative)
 * - Amazon Linux/RHEL: Slack Desktop via RPM repository (x86_64 only)
 * - Windows: Slack Desktop via Chocolatey
 * - WSL (Ubuntu): Installs Slack on Windows host
 * - Git Bash: Installs Slack on Windows host
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
    console.log(`Slack is not available for ${platform.type}.`);
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

// Allow direct execution: node slack.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
