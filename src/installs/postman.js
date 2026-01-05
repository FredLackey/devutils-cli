#!/usr/bin/env node

/**
 * @fileoverview Install Postman API Development Environment.
 * @module installs/postman
 *
 * Postman is a collaboration platform for API development that simplifies
 * building and testing APIs. It provides request builders, collections,
 * environment variables, automated testing, and documentation generation.
 *
 * This installer provides:
 * - Postman Desktop for GUI platforms (macOS, Windows, Ubuntu, Raspberry Pi)
 * - Snap-based installation for Ubuntu/Debian and WSL
 * - Manual tarball installation for Raspberry Pi OS (ARM64)
 * - Chocolatey-based installation for Windows
 *
 * IMPORTANT PLATFORM NOTES:
 * - macOS: Installs Postman via Homebrew cask
 * - Windows: Installs Postman via Chocolatey
 * - Ubuntu/Debian: Installs Postman via Snap (official recommended method)
 * - Raspberry Pi OS: Manual ARM64 tarball installation (limited support)
 * - Amazon Linux: Not officially supported (headless server environment)
 * - WSL: Installs via Snap (requires WSLg for GUI)
 * - Git Bash: Installs on Windows host via Chocolatey
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const snap = require('../utils/ubuntu/snap');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew cask name for Postman on macOS.
 */
const HOMEBREW_CASK_NAME = 'postman';

/**
 * The Chocolatey package name for Postman on Windows.
 */
const CHOCO_PACKAGE_NAME = 'postman';

/**
 * The Snap package name for Postman on Ubuntu/Debian.
 */
const SNAP_PACKAGE_NAME = 'postman';

/**
 * The macOS application name (as it appears in /Applications).
 */
const MACOS_APP_NAME = 'Postman';

/**
 * The download URL for the ARM64 Linux tarball (Raspberry Pi).
 */
const ARM64_TARBALL_URL = 'https://dl.pstmn.io/download/latest/linux_arm64';

/**
 * The installation directory for Postman on Linux (tarball method).
 */
const LINUX_INSTALL_DIR = '/opt/Postman';

/**
 * Check if Postman CLI command is available in PATH.
 *
 * Note: On most platforms, Postman is a GUI application and may not have
 * a command-line entry point. This check is most useful for Snap installations
 * on Linux where 'postman' is added to PATH.
 *
 * @returns {boolean} True if the postman command is available, false otherwise
 */
function isPostmanCommandAvailable() {
  return shell.commandExists('postman');
}

/**
 * Check if Postman is installed on macOS by looking for the .app bundle.
 *
 * This is more reliable than checking for a CLI command since Postman
 * on macOS is a GUI application without a command-line entry point.
 *
 * @returns {boolean} True if Postman.app exists, false otherwise
 */
function isPostmanInstalledMacOS() {
  return macosApps.isAppInstalled(MACOS_APP_NAME);
}

/**
 * Check if Postman is installed on Linux via the manual tarball method.
 *
 * Looks for the Postman executable in /opt/Postman/ which is where
 * the tarball installation extracts to.
 *
 * @returns {Promise<boolean>} True if Postman executable exists, false otherwise
 */
async function isPostmanInstalledLinuxTarball() {
  const result = await shell.exec(`test -f "${LINUX_INSTALL_DIR}/Postman"`);
  return result.code === 0;
}

/**
 * Install Postman on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 11 (Big Sur) or later
 * - Homebrew package manager installed
 * - At least 4 GB RAM
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * The installation uses the Homebrew cask 'postman' which downloads and
 * installs Postman to /Applications/Postman.app.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Postman is already installed...');

  // Check if Postman is already installed via the app bundle
  if (isPostmanInstalledMacOS()) {
    const version = macosApps.getAppVersion(MACOS_APP_NAME);
    if (version) {
      console.log(`Postman ${version} is already installed, skipping installation.`);
    } else {
      console.log('Postman is already installed, skipping installation.');
    }
    return;
  }

  // Also check if the cask is installed (Postman may be installed but in a different location)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Postman is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('You can launch Postman from Applications or run: open -a Postman');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Postman.'
    );
  }

  console.log('Installing Postman via Homebrew...');

  // Install Postman cask
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Postman via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Try manual installation: brew install --cask postman`
    );
  }

  // Verify installation succeeded
  if (!isPostmanInstalledMacOS()) {
    throw new Error(
      'Installation appeared to complete but Postman.app was not found in /Applications.\n' +
      'Please try reinstalling: brew reinstall --cask postman'
    );
  }

  console.log('Postman installed successfully.');
  console.log('');
  console.log('You can launch Postman from:');
  console.log('  - Applications folder');
  console.log('  - Command line: open -a Postman');
  console.log('');
  console.log('NOTE: On first launch, Postman will prompt you to sign in or create an account.');
  console.log('You can skip this and use Postman in "Lightweight API Client" mode.');
}

/**
 * Install Postman on Ubuntu/Debian using Snap.
 *
 * Prerequisites:
 * - Ubuntu 16.04 LTS or later, or Debian 10 (Buster) or later (64-bit)
 * - sudo privileges
 * - Snap package manager (pre-installed on Ubuntu 16.04+)
 * - X11 or Wayland display server for GUI
 *
 * Snap is the official recommended installation method for Postman on Linux.
 * It automatically handles all dependencies and bundles required libraries.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Snap is not available or installation fails
 */
async function install_ubuntu() {
  console.log('Checking if Postman is already installed...');

  // Check if Postman is installed via Snap
  const snapInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (snapInstalled) {
    const version = await snap.getSnapVersion(SNAP_PACKAGE_NAME);
    if (version) {
      console.log(`Postman ${version} is already installed via Snap, skipping installation.`);
    } else {
      console.log('Postman is already installed via Snap, skipping installation.');
    }
    return;
  }

  // Check if postman command is available (could be installed via other methods)
  if (isPostmanCommandAvailable()) {
    console.log('Postman is already installed, skipping installation.');
    return;
  }

  // Verify Snap is available
  if (!snap.isInstalled()) {
    throw new Error(
      'Snap package manager is not available.\n\n' +
      'Install snapd with:\n' +
      '  sudo apt-get update && sudo apt-get install -y snapd\n\n' +
      'Then retry installing Postman.'
    );
  }

  console.log('Installing Postman via Snap...');
  console.log('This may take a few minutes...');

  // Install Postman via Snap
  const result = await snap.install(SNAP_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Postman via Snap.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure snapd service is running: sudo systemctl start snapd\n` +
      `  2. Check architecture (must be 64-bit): uname -m\n` +
      `  3. Try manual installation: sudo snap install postman`
    );
  }

  // Verify installation
  const installed = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (!installed) {
    throw new Error(
      'Installation appeared to complete but Postman was not found.\n' +
      'Please try: sudo snap install postman'
    );
  }

  const version = await snap.getSnapVersion(SNAP_PACKAGE_NAME);
  console.log(`Postman ${version || ''} installed successfully.`);
  console.log('');
  console.log('Launch Postman with:');
  console.log('  postman &');
  console.log('');
  console.log('NOTE: On first launch, Postman will prompt you to sign in or create an account.');
  console.log('You can skip this and use Postman in "Lightweight API Client" mode.');
}

/**
 * Install Postman on Raspberry Pi OS using the ARM64 tarball.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit strongly recommended) - Bookworm or later
 * - Raspberry Pi 4 or later with at least 4 GB RAM
 * - 64-bit operating system (aarch64/arm64 architecture)
 * - sudo privileges
 * - X11 display server for GUI
 *
 * IMPORTANT: Postman's native desktop application has limited official support
 * for ARM64 Linux. Users may experience installation and runtime issues.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails or architecture is unsupported
 */
async function install_raspbian() {
  console.log('Checking if Postman is already installed...');

  // Check if already installed via tarball method
  const tarballInstalled = await isPostmanInstalledLinuxTarball();
  if (tarballInstalled) {
    console.log('Postman is already installed in /opt/Postman, skipping installation.');
    return;
  }

  // Check if postman command is available (could be in PATH)
  if (isPostmanCommandAvailable()) {
    console.log('Postman is already installed, skipping installation.');
    return;
  }

  // Check architecture - Postman requires 64-bit ARM
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();

  if (arch !== 'aarch64') {
    console.log(`Postman desktop application requires 64-bit ARM (aarch64).`);
    console.log(`Your architecture is: ${arch}`);
    console.log('');
    console.log('Postman is not available for 32-bit Raspberry Pi OS.');
    return;
  }

  console.log('Installing Postman for ARM64 (Raspberry Pi)...');
  console.log('');
  console.log('NOTE: ARM64 support is limited. If you experience issues,');
  console.log('consider using the Postman web application at https://go.postman.co');
  console.log('');

  // Create /opt directory if it does not exist
  console.log('Creating installation directory...');
  const mkdirResult = await shell.exec('sudo mkdir -p /opt');
  if (mkdirResult.code !== 0) {
    throw new Error(`Failed to create /opt directory: ${mkdirResult.stderr}`);
  }

  // Download the ARM64 tarball
  console.log('Downloading Postman ARM64 tarball...');
  const downloadResult = await shell.exec(
    `wget -q "${ARM64_TARBALL_URL}" -O /tmp/postman-linux-arm64.tar.gz`
  );
  if (downloadResult.code !== 0) {
    throw new Error(
      `Failed to download Postman.\n` +
      `Error: ${downloadResult.stderr}\n\n` +
      `The ARM64 build may not be available. Check:\n` +
      `  https://www.postman.com/downloads/`
    );
  }

  // Remove any existing installation
  console.log('Removing any existing installation...');
  await shell.exec(`sudo rm -rf "${LINUX_INSTALL_DIR}"`);

  // Extract to /opt
  console.log('Extracting Postman...');
  const extractResult = await shell.exec(
    'sudo tar -xzf /tmp/postman-linux-arm64.tar.gz -C /opt/'
  );
  if (extractResult.code !== 0) {
    throw new Error(`Failed to extract Postman: ${extractResult.stderr}`);
  }

  // Create symbolic link for command-line access
  console.log('Creating symbolic link...');
  const linkResult = await shell.exec(
    `sudo ln -sf "${LINUX_INSTALL_DIR}/Postman" /usr/local/bin/postman`
  );
  if (linkResult.code !== 0) {
    console.log('Warning: Could not create symbolic link. You can run Postman directly from /opt/Postman/Postman');
  }

  // Clean up downloaded file
  console.log('Cleaning up...');
  await shell.exec('rm -f /tmp/postman-linux-arm64.tar.gz');

  // Create desktop entry for application launcher
  console.log('Creating desktop entry...');
  const desktopEntry = `[Desktop Entry]
Encoding=UTF-8
Name=Postman
Exec=${LINUX_INSTALL_DIR}/Postman %U
Icon=${LINUX_INSTALL_DIR}/app/resources/app/assets/icon.png
Terminal=false
Type=Application
Categories=Development;
Comment=API Development Environment`;

  const desktopResult = await shell.exec(
    `echo '${desktopEntry}' | sudo tee /usr/share/applications/postman.desktop > /dev/null`
  );
  if (desktopResult.code !== 0) {
    console.log('Warning: Could not create desktop entry. Postman can still be launched from the command line.');
  }

  // Verify installation
  const installed = await isPostmanInstalledLinuxTarball();
  if (!installed) {
    throw new Error(
      'Installation appeared to complete but Postman was not found.\n' +
      'Please check /opt/Postman/ for the installation.'
    );
  }

  console.log('Postman installed successfully.');
  console.log('');
  console.log('Launch Postman with:');
  console.log('  postman &');
  console.log('  OR');
  console.log('  /opt/Postman/Postman &');
  console.log('');
  console.log('If you encounter shared library errors, install dependencies with:');
  console.log('  sudo apt-get install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libsecret-1-0');
}

/**
 * Install Postman on Amazon Linux/RHEL.
 *
 * Amazon Linux EC2 instances typically run headless (no GUI). Postman is
 * a graphical application and requires a display. This function informs
 * the user that Postman is not suitable for headless environments.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Postman is not available for Amazon Linux.');
  console.log('');
  console.log('Postman is a graphical application that requires a display.');
  console.log('Amazon Linux servers typically run headless without a GUI.');
}

/**
 * Install Postman on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 21H2 or higher (64-bit), or Windows 11
 * - At least 4 GB RAM
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Postman is already installed...');

  // Check if Postman is installed via Chocolatey
  const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (packageInstalled) {
    const version = await choco.getPackageVersion(CHOCO_PACKAGE_NAME);
    if (version) {
      console.log(`Postman ${version} is already installed via Chocolatey, skipping installation.`);
    } else {
      console.log('Postman is already installed via Chocolatey, skipping installation.');
    }
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
      'Then retry installing Postman.'
    );
  }

  console.log('Installing Postman via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install Postman
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Postman via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Try: choco install postman -y\n` +
      `  3. Check Windows Defender is not blocking the installation`
    );
  }

  // Verify installation
  const installed = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!installed) {
    throw new Error(
      'Installation appeared to complete but Postman was not found.\n' +
      'Please try: choco install postman -y'
    );
  }

  const version = await choco.getPackageVersion(CHOCO_PACKAGE_NAME);
  console.log(`Postman ${version || ''} installed successfully.`);
  console.log('');
  console.log('Launch Postman from:');
  console.log('  - Start Menu');
  console.log('  - Command line: postman');
  console.log('');
  console.log('NOTE: On first launch, Postman will prompt you to sign in or create an account.');
  console.log('You can skip this and use Postman in "Lightweight API Client" mode.');
}

/**
 * Install Postman on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - WSLg enabled (Windows 11 or Windows 10 build 21364+) for GUI application support
 * - sudo privileges within WSL
 *
 * NOTE: Running GUI applications in WSL requires WSLg. Without WSLg,
 * you cannot run Postman's graphical interface in WSL.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Check if Postman is already installed via Snap
  const snapInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (snapInstalled) {
    const version = await snap.getSnapVersion(SNAP_PACKAGE_NAME);
    if (version) {
      console.log(`Postman ${version} is already installed via Snap, skipping installation.`);
    } else {
      console.log('Postman is already installed via Snap, skipping installation.');
    }
    return;
  }

  // Check if postman command is available
  if (isPostmanCommandAvailable()) {
    console.log('Postman is already installed, skipping installation.');
    return;
  }

  // Check if WSLg is available (DISPLAY environment variable)
  const display = process.env.DISPLAY;
  if (!display) {
    console.log('WARNING: WSLg does not appear to be available ($DISPLAY is not set).');
    console.log('Postman requires a graphical display to run.');
    console.log('');
    console.log('Options:');
    console.log('  1. Update Windows to a version that supports WSLg');
    console.log('  2. Install Postman on Windows and use it directly');
    console.log('  3. Use the Postman web application at https://go.postman.co');
    console.log('');
  }

  // Verify Snap is available
  if (!snap.isInstalled()) {
    // Try to install snapd
    console.log('Snap is not available. Installing snapd...');
    const snapdResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd'
    );
    if (snapdResult.code !== 0) {
      throw new Error(
        'Failed to install snapd.\n' +
        'Please install manually: sudo apt-get install -y snapd'
      );
    }
  }

  console.log('Installing Postman via Snap...');
  console.log('This may take a few minutes...');

  // Install Postman via Snap
  const result = await snap.install(SNAP_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Postman via Snap.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Start the snap daemon: sudo service snapd start\n` +
      `  2. Try manual installation: sudo snap install postman`
    );
  }

  // Verify installation
  const installed = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (!installed) {
    throw new Error(
      'Installation appeared to complete but Postman was not found.\n' +
      'Please try: sudo snap install postman'
    );
  }

  const version = await snap.getSnapVersion(SNAP_PACKAGE_NAME);
  console.log(`Postman ${version || ''} installed successfully.`);
  console.log('');
  console.log('Launch Postman with:');
  console.log('  postman &');
  console.log('');
  console.log('IMPORTANT for WSL users:');
  console.log('  - Postman requires WSLg for GUI support');
  console.log('  - If you see display errors, check that $DISPLAY is set');
  console.log('  - For rendering issues, try: postman --disable-gpu &');
}

/**
 * Install Postman from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Postman
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
  console.log('Installing Postman on the Windows host...');
  console.log('');

  // Check if Postman is already available
  // Note: In Git Bash, we check via PowerShell to see if Chocolatey has it installed
  const checkResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco list --local-only --exact postman"'
  );
  if (checkResult.code === 0 && checkResult.stdout.toLowerCase().includes('postman')) {
    console.log('Postman is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('Launch Postman from the Windows Start Menu.');
    return;
  }

  // Check if Chocolatey is available
  const chocoCheck = await shell.exec('powershell.exe -NoProfile -Command "choco --version"');
  if (chocoCheck.code !== 0) {
    throw new Error(
      'Chocolatey is not installed on Windows.\n\n' +
      'Install Chocolatey by running the following in an Administrator PowerShell:\n' +
      '  Set-ExecutionPolicy Bypass -Scope Process -Force; ' +
      '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; ' +
      'iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))\n\n' +
      'Then retry installing Postman.'
    );
  }

  console.log('Installing Postman via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install via PowerShell using Chocolatey
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install postman -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Postman.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell: choco install postman -y`
    );
  }

  console.log('Postman installed successfully.');
  console.log('');
  console.log('Launch Postman from:');
  console.log('  - Windows Start Menu');
  console.log('  - Git Bash: start postman');
}

/**
 * Check if Postman is already installed on the system.
 *
 * This function checks for Postman installation using platform-appropriate methods:
 * - macOS: Checks if Postman.app exists in /Applications
 * - Windows: Checks if Chocolatey package 'postman' is installed
 * - Linux: Checks if Snap package 'postman' is installed or command exists
 *
 * @returns {Promise<boolean>} True if Postman is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    return isPostmanInstalledMacOS();
  }

  if (platform.type === 'windows' || platform.type === 'gitbash') {
    return choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  }

  // Ubuntu/Debian/WSL: Check Snap installation
  if (['ubuntu', 'debian', 'wsl'].includes(platform.type)) {
    return snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  }

  // Raspberry Pi: Check tarball installation
  if (platform.type === 'raspbian') {
    return isPostmanInstalledLinuxTarball();
  }

  // Other Linux: Check if command exists
  return isPostmanCommandAvailable();
}

/**
 * Check if this installer is supported on the current platform.
 * Postman is NOT available on headless server platforms (Amazon Linux, RHEL, Fedora).
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  // Postman is a GUI application, NOT available on headless server platforms
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Postman via Homebrew cask
 * - Ubuntu/Debian: Postman via Snap
 * - Raspberry Pi OS: Postman via ARM64 tarball
 * - Windows: Postman via Chocolatey
 * - WSL (Ubuntu): Postman via Snap (requires WSLg)
 * - Git Bash: Postman on Windows host via Chocolatey
 *
 * Unsupported platforms:
 * - Amazon Linux/RHEL: Headless server environment, no GUI
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
    'windows': install_windows,
    'gitbash': install_gitbash
  };

  const installer = installers[platform.type];

  if (!installer) {
    console.log(`Postman is not available for ${platform.type}.`);
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

// Allow direct execution: node postman.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
