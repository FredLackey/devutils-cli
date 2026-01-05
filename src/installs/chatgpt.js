#!/usr/bin/env node

/**
 * @fileoverview Install ChatGPT desktop application.
 *
 * ChatGPT is OpenAI's AI assistant available as a desktop application.
 *
 * Platform Support:
 * - macOS: Official OpenAI app via Homebrew (Apple Silicon only)
 * - Windows: Official OpenAI app via winget from Microsoft Store
 * - Ubuntu/Debian: Third-party Snap wrapper (chatgpt-desktop)
 * - WSL: Uses Windows host app or wslu web browser integration
 * - Raspberry Pi OS: Not supported (ARM64 Snap packages not available)
 * - Amazon Linux: Not supported (typically server environment without GUI)
 * - Git Bash: Delegates to Windows installation via winget
 *
 * @module installs/chatgpt
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const snap = require('../utils/ubuntu/snap');
const winget = require('../utils/windows/winget');

/**
 * The Microsoft Store ID for the official ChatGPT Windows app.
 * This ID is used to install and verify the app via winget.
 */
const WINDOWS_STORE_ID = '9NT1R1C2HH7J';

/**
 * The Homebrew cask name for the official ChatGPT macOS app.
 */
const HOMEBREW_CASK_NAME = 'chatgpt';

/**
 * The Snap package name for the third-party ChatGPT desktop wrapper on Linux.
 * Note: This is NOT an official OpenAI product.
 */
const SNAP_PACKAGE_NAME = 'chatgpt-desktop';

/**
 * Install ChatGPT on macOS using Homebrew.
 *
 * The official ChatGPT desktop app from OpenAI requires:
 * - macOS 14 (Sonoma) or later
 * - Apple Silicon processor (M1, M2, M3, or later)
 *
 * Intel Macs are not supported by the official app.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Step 1: Check if ChatGPT is already installed in /Applications
  const isAlreadyInstalled = macosApps.isAppInstalled('ChatGPT');
  if (isAlreadyInstalled) {
    console.log('ChatGPT is already installed, skipping...');
    return;
  }

  // Step 2: Check if Homebrew is available
  if (!brew.isInstalled()) {
    console.error('Homebrew is not installed. Please install Homebrew first.');
    console.error('Run: dev install homebrew');
    return;
  }

  // Step 3: Check processor architecture (Apple Silicon required)
  const architecture = os.getArch();
  if (architecture !== 'arm64') {
    console.log('ChatGPT desktop app requires Apple Silicon (M1/M2/M3).');
    console.log('Intel Macs are not supported by the official OpenAI app.');
    return;
  }

  // Step 4: Install ChatGPT via Homebrew cask
  console.log('Installing ChatGPT via Homebrew...');
  const installResult = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!installResult.success) {
    console.error('Failed to install ChatGPT.');
    console.error(installResult.output);
    return;
  }

  // Step 5: Verify the installation succeeded
  const isNowInstalled = macosApps.isAppInstalled('ChatGPT');
  if (!isNowInstalled) {
    console.error('Installation completed but ChatGPT.app was not found in /Applications.');
    return;
  }

  console.log('ChatGPT installed successfully.');
  console.log('Launch it from Applications or press Option+Space after first launch.');
}

/**
 * Install ChatGPT on Ubuntu/Debian using Snap.
 *
 * Note: OpenAI does not provide an official ChatGPT desktop app for Linux.
 * This installs a third-party Electron wrapper (chatgpt-desktop) that provides
 * a native window for the ChatGPT web interface.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Step 1: Check if chatgpt-desktop is already installed via Snap
  const isAlreadyInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (isAlreadyInstalled) {
    console.log('ChatGPT Desktop is already installed, skipping...');
    return;
  }

  // Step 2: Check if snapd is available
  if (!snap.isInstalled()) {
    console.error('Snap is not installed. Please install snapd first.');
    console.error('Run: sudo apt-get update && sudo apt-get install -y snapd');
    return;
  }

  // Step 3: Inform user this is a third-party wrapper
  console.log('Note: This installs a third-party ChatGPT desktop wrapper, not an official OpenAI app.');
  console.log('Installing ChatGPT Desktop via Snap...');

  // Step 4: Install the Snap package
  const installResult = await snap.install(SNAP_PACKAGE_NAME);

  if (!installResult.success) {
    console.error('Failed to install ChatGPT Desktop.');
    console.error(installResult.output);
    return;
  }

  // Step 5: Verify the installation succeeded
  const isNowInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (!isNowInstalled) {
    console.error('Installation completed but chatgpt-desktop was not found.');
    return;
  }

  console.log('ChatGPT Desktop installed successfully.');
  console.log('You may need to log out and log back in for the app to appear in your menu.');
  console.log('Or launch directly with: chatgpt-desktop');
}

/**
 * Install ChatGPT on Ubuntu running in WSL.
 *
 * For WSL environments, the recommended approach is to:
 * 1. Install the Windows ChatGPT app (if not already installed)
 * 2. Use wslu (wslview) to open the ChatGPT web interface
 *
 * Running Linux GUI apps in WSL requires WSL 2 with WSLg (Windows 11+).
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // Step 1: Check if wslu is installed for web browser integration
  const hasWslview = shell.commandExists('wslview');

  if (!hasWslview) {
    // Install wslu utilities which provide wslview for opening Windows browser
    console.log('Installing wslu utilities for Windows integration...');
    const aptResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wslu');

    if (aptResult.code !== 0) {
      console.error('Failed to install wslu utilities.');
      console.error(aptResult.stderr);
      return;
    }
  }

  // Step 2: Try to install the Windows ChatGPT app via winget (if accessible)
  // Check if winget.exe is accessible from WSL
  const hasWinget = shell.commandExists('winget.exe');

  if (hasWinget) {
    // Check if ChatGPT is already installed on Windows
    const listResult = await shell.exec(`winget.exe list --id ${WINDOWS_STORE_ID}`);
    const isWindowsAppInstalled = listResult.code === 0 && listResult.stdout.includes(WINDOWS_STORE_ID);

    if (!isWindowsAppInstalled) {
      console.log('Installing ChatGPT Windows app via winget...');
      const installResult = await shell.exec(
        `winget.exe install --id ${WINDOWS_STORE_ID} --source msstore --silent --accept-package-agreements --accept-source-agreements`
      );

      if (installResult.code === 0) {
        console.log('ChatGPT Windows app installed successfully.');
      } else {
        console.log('Could not install Windows app. You can use the web interface instead.');
      }
    } else {
      console.log('ChatGPT Windows app is already installed.');
    }
  }

  console.log('');
  console.log('WSL ChatGPT setup complete.');
  console.log('Access ChatGPT using: wslview https://chat.openai.com');
  console.log('Or launch the Windows app from the Start Menu.');
}

/**
 * Install ChatGPT on Raspberry Pi OS.
 *
 * OpenAI does not provide an official ChatGPT desktop app for Raspberry Pi.
 * Third-party Snap packages typically only support x86_64 (amd64) architecture,
 * not ARM64 (aarch64) used by Raspberry Pi.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('ChatGPT desktop app is not available for Raspberry Pi OS.');
  console.log('The Raspberry Pi uses ARM64 architecture which is not supported by available packages.');
  return;
}

/**
 * Install ChatGPT on Amazon Linux/RHEL.
 *
 * OpenAI does not provide an official ChatGPT desktop app for Amazon Linux.
 * Amazon Linux is typically used as a server operating system without a
 * desktop environment, making GUI applications impractical.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('ChatGPT desktop app is not available for Amazon Linux.');
  return;
}

/**
 * Install ChatGPT on Windows using winget.
 *
 * Installs the official OpenAI ChatGPT app from the Microsoft Store.
 * Requires Windows 10 version 17763.0 or later, or Windows 11.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Step 1: Check if winget is available
  if (!winget.isInstalled()) {
    console.error('winget is not available. Please install App Installer from the Microsoft Store.');
    return;
  }

  // Step 2: Check if ChatGPT is already installed
  // For Microsoft Store apps, we check by the store ID
  const listResult = await shell.exec(`winget list --id ${WINDOWS_STORE_ID}`);
  const isAlreadyInstalled = listResult.code === 0 && listResult.stdout.includes(WINDOWS_STORE_ID);

  if (isAlreadyInstalled) {
    console.log('ChatGPT is already installed, skipping...');
    return;
  }

  // Step 3: Install from Microsoft Store
  console.log('Installing ChatGPT from Microsoft Store...');
  const installResult = await shell.exec(
    `winget install --id ${WINDOWS_STORE_ID} --source msstore --silent --accept-package-agreements --accept-source-agreements`
  );

  if (installResult.code !== 0) {
    console.error('Failed to install ChatGPT.');
    console.error(installResult.stderr || installResult.stdout);
    return;
  }

  // Step 4: Verify installation
  const verifyResult = await shell.exec(`winget list --id ${WINDOWS_STORE_ID}`);
  const isNowInstalled = verifyResult.code === 0 && verifyResult.stdout.includes(WINDOWS_STORE_ID);

  if (!isNowInstalled) {
    console.error('Installation completed but ChatGPT was not found.');
    return;
  }

  console.log('ChatGPT installed successfully.');
  console.log('Launch it from the Start Menu or press Alt+Space after first launch.');
}

/**
 * Install ChatGPT on Git Bash (Windows).
 *
 * Git Bash runs within the Windows environment and can use winget.exe
 * to install Windows applications. This function delegates to the
 * Windows installation process.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Git Bash can run Windows commands, so we use winget.exe directly

  // Step 1: Check if winget.exe is accessible
  const hasWinget = shell.commandExists('winget.exe');
  if (!hasWinget) {
    console.error('winget.exe is not available in PATH.');
    console.error('Please install App Installer from the Microsoft Store.');
    return;
  }

  // Step 2: Check if ChatGPT is already installed
  const listResult = await shell.exec(`winget.exe list --id ${WINDOWS_STORE_ID}`);
  const isAlreadyInstalled = listResult.code === 0 && listResult.stdout.includes(WINDOWS_STORE_ID);

  if (isAlreadyInstalled) {
    console.log('ChatGPT is already installed, skipping...');
    return;
  }

  // Step 3: Install from Microsoft Store
  console.log('Installing ChatGPT from Microsoft Store...');
  const installResult = await shell.exec(
    `winget.exe install --id ${WINDOWS_STORE_ID} --source msstore --silent --accept-package-agreements --accept-source-agreements`
  );

  if (installResult.code !== 0) {
    console.error('Failed to install ChatGPT.');
    console.error(installResult.stderr || installResult.stdout);
    return;
  }

  // Step 4: Verify installation
  const verifyResult = await shell.exec(`winget.exe list --id ${WINDOWS_STORE_ID}`);
  const isNowInstalled = verifyResult.code === 0 && verifyResult.stdout.includes(WINDOWS_STORE_ID);

  if (!isNowInstalled) {
    console.error('Installation completed but ChatGPT was not found.');
    return;
  }

  console.log('ChatGPT installed successfully.');
  console.log('Launch it from the Start Menu or press Alt+Space after first launch.');
}

/**
 * Check if this installer is supported on the current platform.
 *
 * ChatGPT desktop app can be installed on:
 * - macOS (official OpenAI app via Homebrew, Apple Silicon only)
 * - Windows (official OpenAI app via winget from Microsoft Store)
 * - Ubuntu/Debian (third-party Snap wrapper)
 * - WSL (Windows host app or wslu web browser integration)
 * - Git Bash (Windows app via winget)
 *
 * Note: Raspberry Pi and Amazon Linux are NOT supported.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically detects the current operating system and
 * delegates to the appropriate platform-specific installation function.
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
    // Gracefully handle unsupported platforms without throwing an error
    console.log(`ChatGPT desktop app is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

module.exports = {
  install,
  isEligible,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash,
};

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
