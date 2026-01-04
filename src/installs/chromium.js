#!/usr/bin/env node

/**
 * @fileoverview Install Chromium - the open-source web browser.
 *
 * Chromium is the free and open-source browser project that forms the
 * foundation for Google Chrome and many other browsers. This installer
 * provides idempotent installation across macOS, Ubuntu/Debian, Raspberry Pi OS,
 * Amazon Linux, Windows, WSL, and Git Bash.
 *
 * @module installs/chromium
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const fs = require('fs');
const path = require('path');

// Platform-specific utilities are loaded dynamically to avoid loading
// unnecessary modules on platforms where they are not needed

/**
 * Checks if Chromium is already installed on macOS by looking for the
 * application bundle in /Applications or ~/Applications.
 *
 * @returns {boolean} True if Chromium.app exists, false otherwise
 */
function isChromiumInstalledOnMacOS() {
  const appPaths = [
    '/Applications/Chromium.app',
    path.join(os.getHomeDir(), 'Applications', 'Chromium.app')
  ];

  for (const appPath of appPaths) {
    if (fs.existsSync(appPath)) {
      return true;
    }
  }

  return false;
}

/**
 * Install Chromium on macOS using Homebrew.
 *
 * Chromium is installed as a cask (GUI application) via Homebrew.
 * The --no-quarantine flag is used to prevent macOS Gatekeeper from
 * blocking the unsigned application.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  const brew = require('../utils/macos/brew');

  // Step 1: Check if Chromium is already installed
  // We check for the .app bundle directly since that's more reliable
  // than checking the cask status for GUI applications
  if (isChromiumInstalledOnMacOS()) {
    console.log('Chromium is already installed, skipping...');
    return;
  }

  // Step 2: Verify Homebrew is available
  if (!brew.isInstalled()) {
    console.log('Homebrew is required to install Chromium on macOS.');
    console.log('Please install Homebrew first: https://brew.sh');
    return;
  }

  // Step 3: Install Chromium via Homebrew cask with --no-quarantine
  // The --no-quarantine flag prevents Gatekeeper from blocking the app
  // since Chromium is not signed by an Apple Developer certificate
  console.log('Installing Chromium via Homebrew...');
  const result = await shell.exec('brew install --cask --quiet chromium --no-quarantine');

  if (result.code !== 0) {
    console.log('Failed to install Chromium.');
    console.log(result.stderr || result.stdout);
    return;
  }

  // Step 4: Verify installation succeeded
  if (!isChromiumInstalledOnMacOS()) {
    console.log('Installation completed but Chromium.app was not found.');
    return;
  }

  console.log('Chromium installed successfully.');
}

/**
 * Install Chromium on Ubuntu/Debian using Snap.
 *
 * Since Ubuntu 20.04, the APT chromium-browser package is a transitional
 * package that installs the Snap version. We use Snap directly for
 * consistent behavior across Ubuntu and Debian systems.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  const snap = require('../utils/ubuntu/snap');

  // Step 1: Check if Chromium is already installed via Snap
  const isInstalled = await snap.isSnapInstalled('chromium');
  if (isInstalled) {
    console.log('Chromium is already installed, skipping...');
    return;
  }

  // Step 2: Verify Snap is available
  if (!snap.isInstalled()) {
    console.log('Snap is required to install Chromium on Ubuntu/Debian.');
    console.log('Installing snapd...');

    // Attempt to install snapd via apt
    const aptResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd');

    if (aptResult.code !== 0 || !snap.isInstalled()) {
      console.log('Failed to install snapd. Please install it manually.');
      return;
    }
  }

  // Step 3: Install Chromium via Snap
  console.log('Installing Chromium via Snap...');
  const result = await snap.install('chromium');

  if (!result.success) {
    console.log('Failed to install Chromium.');
    console.log(result.output);
    return;
  }

  // Step 4: Verify installation succeeded
  const verifyInstalled = await snap.isSnapInstalled('chromium');
  if (!verifyInstalled) {
    console.log('Installation completed but Chromium was not found.');
    return;
  }

  console.log('Chromium installed successfully.');
  console.log('Note: You may need to log out and log back in for Chromium to appear in your application menu.');
}

/**
 * Install Chromium on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Running GUI applications in WSL requires WSLg (Windows 11 or Windows 10 21H2+)
 * or an X server on Windows. This function installs Chromium using Snap,
 * similar to native Ubuntu installation.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  const snap = require('../utils/ubuntu/snap');
  const apt = require('../utils/ubuntu/apt');

  // Step 1: Check if Chromium is already installed
  // In WSL, we check both snap and apt since the user might have installed via either
  const snapInstalled = await snap.isSnapInstalled('chromium');
  if (snapInstalled) {
    console.log('Chromium is already installed via Snap, skipping...');
    return;
  }

  // Also check if installed via APT (chromium-browser package)
  const aptInstalled = await apt.isPackageInstalled('chromium-browser');
  if (aptInstalled) {
    console.log('Chromium is already installed via APT, skipping...');
    return;
  }

  // Step 2: Try Snap first (preferred method)
  if (snap.isInstalled()) {
    console.log('Installing Chromium via Snap...');
    const result = await snap.install('chromium');

    if (result.success) {
      const verifyInstalled = await snap.isSnapInstalled('chromium');
      if (verifyInstalled) {
        console.log('Chromium installed successfully.');
        console.log('Note: WSLg (Windows 11 or Windows 10 21H2+) or an X server is required to run GUI applications.');
        return;
      }
    }

    // If Snap installation fails (common in WSL due to systemd issues),
    // fall back to APT
    console.log('Snap installation failed, trying APT...');
  }

  // Step 3: Fall back to APT if Snap is not available or fails
  console.log('Installing Chromium via APT...');

  // Update package lists first
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: apt-get update failed, continuing anyway...');
  }

  // Install chromium-browser package
  const result = await apt.install('chromium-browser');

  if (!result.success) {
    console.log('Failed to install Chromium.');
    console.log(result.output);
    return;
  }

  // Step 4: Verify installation
  const verifyInstalled = await apt.isPackageInstalled('chromium-browser');
  if (!verifyInstalled) {
    console.log('Installation completed but Chromium was not found.');
    return;
  }

  console.log('Chromium installed successfully.');
  console.log('Note: WSLg (Windows 11 or Windows 10 21H2+) or an X server is required to run GUI applications.');
}

/**
 * Install Chromium on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS includes Chromium in its official repositories with
 * ARM-specific optimizations. APT is the preferred installation method
 * for best performance on Raspberry Pi hardware.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  const apt = require('../utils/ubuntu/apt');

  // Step 1: Check if Chromium is already installed
  // Raspberry Pi OS uses 'chromium-browser' as the package name
  const isInstalled = await apt.isPackageInstalled('chromium-browser');
  if (isInstalled) {
    console.log('Chromium is already installed, skipping...');
    return;
  }

  // Step 2: Update package lists to ensure we get the latest version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: apt-get update failed, continuing anyway...');
  }

  // Step 3: Install chromium-browser package
  console.log('Installing Chromium via APT...');
  const result = await apt.install('chromium-browser');

  if (!result.success) {
    console.log('Failed to install Chromium.');
    console.log(result.output);
    return;
  }

  // Step 4: Verify installation succeeded
  const verifyInstalled = await apt.isPackageInstalled('chromium-browser');
  if (!verifyInstalled) {
    console.log('Installation completed but Chromium was not found.');
    return;
  }

  console.log('Chromium installed successfully.');
}

/**
 * Install Chromium on Amazon Linux using DNF/YUM.
 *
 * Chromium is not available in the default Amazon Linux repositories.
 * On Amazon Linux 2023, we install Google Chrome (based on Chromium)
 * using the direct RPM download. On Amazon Linux 2, we use EPEL.
 *
 * Note: This installs Google Chrome Stable as a Chromium alternative
 * since pure Chromium packages are not readily available for Amazon Linux.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Step 1: Check if Chrome/Chromium is already installed
  // Check for google-chrome-stable first (AL2023 method)
  const chromeExists = shell.commandExists('google-chrome-stable');
  if (chromeExists) {
    console.log('Google Chrome (Chromium-based) is already installed, skipping...');
    return;
  }

  // Also check for chromium-browser (AL2 EPEL method)
  const chromiumExists = shell.commandExists('chromium-browser');
  if (chromiumExists) {
    console.log('Chromium is already installed, skipping...');
    return;
  }

  // Step 2: Determine which Amazon Linux version we're on
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const hasDnf = shell.commandExists('dnf');

  if (hasDnf) {
    // Amazon Linux 2023: Install Google Chrome via direct RPM
    console.log('Installing Google Chrome (Chromium-based) via DNF...');

    // First, install required dependencies
    const depsResult = await shell.exec('sudo dnf install -y libXcomposite libXdamage libXrandr libgbm libxkbcommon pango alsa-lib atk at-spi2-atk cups-libs libdrm');
    if (depsResult.code !== 0) {
      console.log('Warning: Some dependencies may not have installed correctly.');
    }

    // Install Chrome from Google's RPM repository
    const result = await shell.exec('sudo dnf install -y https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm');

    if (result.code !== 0) {
      console.log('Failed to install Google Chrome.');
      console.log(result.stderr || result.stdout);
      return;
    }

    // Verify installation
    const verifyInstalled = shell.commandExists('google-chrome-stable');
    if (!verifyInstalled) {
      console.log('Installation completed but Google Chrome was not found.');
      return;
    }

    console.log('Google Chrome (Chromium-based) installed successfully.');
    console.log('Run with: google-chrome-stable');

  } else {
    // Amazon Linux 2: Install via EPEL repository
    console.log('Installing Chromium via YUM (EPEL)...');

    // Enable EPEL repository
    const epelResult = await shell.exec('sudo amazon-linux-extras install -y epel');
    if (epelResult.code !== 0) {
      console.log('Failed to enable EPEL repository.');
      console.log(epelResult.stderr || epelResult.stdout);
      return;
    }

    // Install Chromium
    const result = await shell.exec('sudo yum install -y chromium');

    if (result.code !== 0) {
      console.log('Failed to install Chromium.');
      console.log(result.stderr || result.stdout);
      return;
    }

    // Verify installation
    const verifyInstalled = shell.commandExists('chromium-browser');
    if (!verifyInstalled) {
      console.log('Installation completed but Chromium was not found.');
      return;
    }

    console.log('Chromium installed successfully.');
    console.log('Note: Amazon Linux 2 reached end of standard support on June 30, 2025.');
  }
}

/**
 * Install Chromium on Windows using Chocolatey.
 *
 * The Chocolatey 'chromium' package installs development snapshot builds.
 * For a more stable Chromium-based browser, consider using 'ungoogled-chromium'.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  const choco = require('../utils/windows/choco');

  // Step 1: Check if Chromium is already installed via Chocolatey
  const isInstalled = await choco.isPackageInstalled('chromium');
  if (isInstalled) {
    console.log('Chromium is already installed, skipping...');
    return;
  }

  // Also check if the chromium command exists (might be installed via other means)
  if (shell.commandExists('chromium')) {
    console.log('Chromium is already installed, skipping...');
    return;
  }

  // Step 2: Verify Chocolatey is available
  if (!choco.isInstalled()) {
    console.log('Chocolatey is required to install Chromium on Windows.');
    console.log('Please install Chocolatey first: https://chocolatey.org/install');
    return;
  }

  // Step 3: Install Chromium via Chocolatey
  console.log('Installing Chromium via Chocolatey...');
  const result = await choco.install('chromium');

  if (!result.success) {
    console.log('Failed to install Chromium.');
    console.log(result.output);
    return;
  }

  // Step 4: Verify installation succeeded
  const verifyInstalled = await choco.isPackageInstalled('chromium');
  if (!verifyInstalled) {
    console.log('Installation completed but Chromium was not found.');
    return;
  }

  console.log('Chromium installed successfully.');
  console.log('Note: You may need to open a new terminal window for the chromium command to be available.');
}

/**
 * Install Chromium on Git Bash (Windows) using Chocolatey.
 *
 * Git Bash runs in a Windows environment, so we use the same Chocolatey
 * installation method as native Windows. The portable installation method
 * is available as an alternative for environments without package managers.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Git Bash runs on Windows, so we can use Chocolatey if available
  const chocoPath = '/c/ProgramData/chocolatey/bin/choco.exe';

  // Step 1: Check if Chromium is already accessible
  if (shell.commandExists('chromium')) {
    console.log('Chromium is already installed, skipping...');
    return;
  }

  // Check for Chromium in common portable installation location
  const portablePath = path.join(os.getHomeDir(), 'Applications', 'Chromium', 'chromium.exe');
  if (fs.existsSync(portablePath)) {
    console.log('Chromium is already installed (portable), skipping...');
    return;
  }

  // Step 2: Try Chocolatey installation first
  const chocoExists = fs.existsSync(chocoPath) || shell.commandExists('choco');

  if (chocoExists) {
    console.log('Installing Chromium via Chocolatey...');
    const result = await shell.exec('choco install chromium -y');

    if (result.code === 0) {
      console.log('Chromium installed successfully.');
      console.log('Note: You may need to open a new terminal window for the chromium command to be available.');
      return;
    }

    console.log('Chocolatey installation failed, attempting portable installation...');
  }

  // Step 3: Fall back to portable installation using chrlauncher
  console.log('Installing Chromium (portable) via chrlauncher...');

  // Create installation directory
  const installDir = path.join(os.getHomeDir(), 'Applications', 'Chromium');
  if (!fs.existsSync(installDir)) {
    fs.mkdirSync(installDir, { recursive: true });
  }

  // Download chrlauncher
  const zipPath = path.join(installDir, 'chrlauncher.zip');
  const downloadUrl = 'https://github.com/niclaslson/niclaslson.github.io/raw/refs/heads/main/files/chrlauncher_v3.4.7_64.zip';

  const downloadResult = await shell.exec(`curl -L -o "${zipPath}" "${downloadUrl}"`);
  if (downloadResult.code !== 0) {
    console.log('Failed to download chrlauncher.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    return;
  }

  // Extract the launcher
  const unzipResult = await shell.exec(`unzip -o -q "${zipPath}" -d "${installDir}"`);
  if (unzipResult.code !== 0) {
    console.log('Failed to extract chrlauncher.');
    console.log(unzipResult.stderr || unzipResult.stdout);
    return;
  }

  // Clean up zip file
  try {
    fs.unlinkSync(zipPath);
  } catch (err) {
    // Ignore cleanup errors
  }

  console.log('Chromium portable installation prepared successfully.');
  console.log(`Run the launcher to download Chromium: ${path.join(installDir, 'chrlauncher.exe')}`);
  console.log('Add the following to your ~/.bashrc to include Chromium in PATH:');
  console.log(`  export PATH="$HOME/Applications/Chromium:$PATH"`);
}

/**
 * Main installation entry point - detects the current platform and
 * runs the appropriate installer function.
 *
 * Supported platforms:
 * - macOS: Homebrew cask
 * - Ubuntu/Debian: Snap
 * - Ubuntu on WSL: Snap or APT
 * - Raspberry Pi OS: APT
 * - Amazon Linux/RHEL: DNF (Chrome) or YUM (EPEL)
 * - Windows: Chocolatey
 * - Git Bash: Chocolatey or portable
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
    'gitbash': install_gitbash,
  };

  const installer = installers[platform.type];

  if (!installer) {
    // Gracefully handle unsupported platforms without throwing errors
    console.log(`Chromium is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

// Export all functions for testing and programmatic use
module.exports = {
  install,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash,
};

// Allow running directly from command line: node chromium.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
