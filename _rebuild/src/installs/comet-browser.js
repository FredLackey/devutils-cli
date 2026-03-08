#!/usr/bin/env node

/**
 * @fileoverview Install Comet Browser - Perplexity AI's AI-native web browser.
 * @module installs/comet-browser
 *
 * Comet Browser is an AI-native web browser developed by Perplexity AI. Built on
 * the Chromium engine, Comet integrates advanced AI capabilities directly into
 * the browsing experience. Key features include:
 * - Built-in AI assistant powered by GPT-4o, Claude, and Perplexity Sonar models
 * - Agentic search capabilities for complex tasks (reservations, shopping, etc.)
 * - Smart tab organization and multilingual content translation
 * - Built-in ad blocker and Chrome extension support
 *
 * PLATFORM SUPPORT:
 * - macOS: Official app via Homebrew cask (Apple Silicon and Intel supported)
 * - Windows: Official app via winget from Perplexity
 * - Ubuntu/Debian: NOT SUPPORTED (no Linux builds available)
 * - Raspberry Pi OS: NOT SUPPORTED (no ARM Linux builds available)
 * - Amazon Linux/RHEL: NOT SUPPORTED (no Linux builds available)
 * - WSL: NOT SUPPORTED (install on Windows host instead)
 * - Git Bash: Installs on Windows host via winget
 *
 * IMPORTANT: Comet Browser is currently only available for macOS and Windows.
 * Linux support (including Ubuntu, Raspberry Pi OS, Amazon Linux, and WSL) is
 * not yet available. Perplexity has indicated future support is planned but
 * no release dates have been announced.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const winget = require('../utils/windows/winget');
const fs = require('fs');

/**
 * Indicates whether this installer requires a desktop environment.
 * Comet Browser is a GUI web browser and requires a display.
 * @type {boolean}
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for Comet Browser on macOS.
 * Using the cask (not formula) because Comet is a GUI application.
 */
const HOMEBREW_CASK_NAME = 'comet';

/**
 * The winget package ID for Comet Browser on Windows.
 * This is the official Perplexity package in the winget repository.
 */
const WINGET_PACKAGE_ID = 'Perplexity.Comet';

/**
 * Path to Comet Browser application on macOS.
 * Used to verify installation succeeded.
 */
const MACOS_APP_PATH = '/Applications/Comet.app';

/**
 * Path to Comet Browser executable on Windows (per-user installation).
 * Comet typically installs to the user's LocalAppData folder.
 */
const WINDOWS_COMET_PATH_USER = process.env.LOCALAPPDATA
  ? `${process.env.LOCALAPPDATA}\\Comet\\Comet.exe`
  : null;

/**
 * Path to Comet Browser executable on Windows (system-wide installation).
 * Used when installed with --scope machine flag.
 */
const WINDOWS_COMET_PATH_SYSTEM = 'C:\\Program Files\\Comet\\Comet.exe';

/**
 * Check if Comet Browser is installed on macOS by verifying the app bundle exists.
 *
 * On macOS, GUI applications are typically installed as .app bundles in /Applications.
 * We check for the bundle's existence rather than relying on PATH because Comet
 * is a GUI application that does not add itself to the shell PATH.
 *
 * @returns {boolean} True if Comet.app exists in /Applications, false otherwise
 */
function isCometInstalledMacOS() {
  return fs.existsSync(MACOS_APP_PATH);
}

/**
 * Get the installed version of Comet Browser on macOS.
 *
 * Executes the Comet binary within the app bundle with --version flag.
 * The output format is typically: "Comet 143.2.7499.37648"
 *
 * @returns {Promise<string|null>} Version string (e.g., "143.2.7499.37648") or null if not installed
 */
async function getCometVersionMacOS() {
  if (!isCometInstalledMacOS()) {
    return null;
  }

  const cometPath = `${MACOS_APP_PATH}/Contents/MacOS/Comet`;
  const result = await shell.exec(`"${cometPath}" --version`);

  if (result.code === 0 && result.stdout) {
    // Output format: "Comet 143.2.7499.37648"
    const match = result.stdout.match(/Comet\s+([\d.]+)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Check if Comet Browser is installed on Windows.
 *
 * Checks for the Comet executable at the default installation paths.
 * Comet is typically installed to LocalAppData for per-user installation
 * or to Program Files for system-wide installation.
 *
 * @returns {boolean} True if Comet executable exists, false otherwise
 */
function isCometInstalledWindows() {
  // Check per-user installation path (most common)
  if (WINDOWS_COMET_PATH_USER && fs.existsSync(WINDOWS_COMET_PATH_USER)) {
    return true;
  }

  // Check system-wide installation path
  if (fs.existsSync(WINDOWS_COMET_PATH_SYSTEM)) {
    return true;
  }

  return false;
}

/**
 * Get the installed version of Comet Browser on Windows.
 *
 * Uses winget to query the installed package version. This is more reliable
 * than trying to execute the Comet binary with --version.
 *
 * @returns {Promise<string|null>} Version string or null if not installed
 */
async function getCometVersionWindows() {
  const version = await winget.getPackageVersion(WINGET_PACKAGE_ID);
  return version;
}

/**
 * Install Comet Browser on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later
 * - Both Apple Silicon (M1/M2/M3) and Intel processors are supported
 * - Homebrew package manager installed
 * - Terminal access
 *
 * The installation uses the Homebrew cask 'comet' which downloads
 * and installs Comet to /Applications/Comet.app.
 *
 * This function is idempotent - it checks if Comet is already installed
 * before attempting installation and skips if already present.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if Comet Browser is already installed...');

  // Check if Comet is already installed via file system check
  if (isCometInstalledMacOS()) {
    const version = await getCometVersionMacOS();
    if (version) {
      console.log(`Comet Browser ${version} is already installed, skipping installation.`);
    } else {
      console.log('Comet Browser is already installed, skipping installation.');
    }
    return;
  }

  // Also check if the Homebrew cask is installed (Comet may be installed but not detected)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Comet Browser is already installed via Homebrew, skipping installation.');
    return;
  }

  // Verify Homebrew is available before proceeding
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  console.log('Installing Comet Browser via Homebrew...');

  // Install Comet Browser cask
  // The --cask flag specifies a graphical application
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    console.log('Failed to install Comet Browser via Homebrew.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "brew update && brew cleanup" and retry');
    console.log('  2. Try manual installation: brew reinstall --cask comet');
    console.log('  3. Check if macOS Gatekeeper is blocking the app:');
    console.log('     xattr -cr /Applications/Comet.app');
    return;
  }

  // Verify the installation succeeded
  if (!isCometInstalledMacOS()) {
    console.log('Installation may have failed: Comet Browser was not found.');
    console.log('Please check /Applications folder for Comet.app');
    return;
  }

  const installedVersion = await getCometVersionMacOS();
  console.log(`Comet Browser ${installedVersion || ''} installed successfully.`);
  console.log('');
  console.log('You can launch Comet from Applications or run:');
  console.log('  open -a "Comet"');
  console.log('');
  console.log('NOTE: On first launch, you may need to sign in to your Perplexity account');
  console.log('to access all AI features.');
}

/**
 * Install Comet Browser on Ubuntu/Debian.
 *
 * IMPORTANT: Comet Browser does NOT support Linux. Perplexity has not released
 * Linux builds for Comet Browser. This limitation applies to all Linux
 * distributions, including Ubuntu, Debian, and their derivatives.
 *
 * This function returns gracefully with an informational message per the
 * project's policy of not throwing errors for unsupported platforms.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Comet Browser is not available for Ubuntu.');
  return;
}

/**
 * Install Comet Browser on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * IMPORTANT: Comet Browser does NOT support Linux, including WSL environments.
 * Since WSL runs a Linux environment, Comet Browser cannot be installed directly
 * within WSL.
 *
 * For WSL users who want to use Comet Browser, the recommended approach is to
 * install it on the Windows host using the Windows installation method.
 *
 * This function returns gracefully with an informational message.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Comet Browser is not available for WSL.');
  return;
}

/**
 * Install Comet Browser on Raspberry Pi OS.
 *
 * IMPORTANT: Comet Browser does NOT support ARM architecture or Linux.
 * Perplexity only provides builds for x86/x64 Windows and macOS (both Intel
 * and Apple Silicon). This means Comet Browser cannot be installed on any
 * Raspberry Pi device.
 *
 * This function returns gracefully with an informational message.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Comet Browser is not available for Raspberry Pi OS.');
  return;
}

/**
 * Install Comet Browser on Amazon Linux/RHEL.
 *
 * IMPORTANT: Comet Browser does NOT support Linux. Amazon Linux, RHEL,
 * Fedora, Rocky Linux, and AlmaLinux are all unsupported platforms.
 *
 * This function returns gracefully with an informational message.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Comet Browser is not available for Amazon Linux.');
  return;
}

/**
 * Install Comet Browser on Windows using winget.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later, or Windows 11
 * - winget package manager (included in Windows 10 2004+ and Windows 11)
 * - Administrator privileges may be required for system-wide installation
 *
 * The winget package 'Perplexity.Comet' installs the official Comet Browser
 * from Perplexity. This function performs a per-user installation by default.
 *
 * This function is idempotent - it checks if Comet is already installed
 * before attempting installation and skips if already present.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if Comet Browser is already installed...');

  // Check if Comet is already installed via file system check
  if (isCometInstalledWindows()) {
    const version = await getCometVersionWindows();
    if (version) {
      console.log(`Comet Browser ${version} is already installed, skipping installation.`);
    } else {
      console.log('Comet Browser is already installed, skipping installation.');
    }
    return;
  }

  // Also check if winget has the package installed
  const isWingetInstalled = await winget.isPackageInstalled(WINGET_PACKAGE_ID);
  if (isWingetInstalled) {
    console.log('Comet Browser is already installed via winget, skipping installation.');
    return;
  }

  // Verify winget is available
  if (!winget.isInstalled()) {
    console.log('winget is not available. Please install App Installer from the Microsoft Store.');
    console.log('');
    console.log('To install App Installer:');
    console.log('  1. Open Microsoft Store');
    console.log('  2. Search for "App Installer"');
    console.log('  3. Install or update the app');
    return;
  }

  console.log('Installing Comet Browser via winget...');
  console.log('This may take a few minutes...');

  // Install Comet Browser using winget
  // The --silent flag suppresses the installer UI
  // The --accept-* flags prevent license agreement prompts
  const result = await winget.install(WINGET_PACKAGE_ID, {
    silent: true,
    source: 'winget'  // Explicitly use winget source, not msstore
  });

  if (!result.success) {
    console.log('Failed to install Comet Browser via winget.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have a stable internet connection');
    console.log('  2. Try running as Administrator if installation fails');
    console.log('  3. Try manual installation:');
    console.log('     winget install --id Perplexity.Comet --silent --accept-package-agreements --accept-source-agreements');
    return;
  }

  // Verify the installation succeeded
  // Note: winget installation may complete before files are fully written
  // so we check both winget registry and file system
  const verified = await winget.isPackageInstalled(WINGET_PACKAGE_ID);
  if (!verified && !isCometInstalledWindows()) {
    console.log('Installation may have failed: Comet Browser package not found after install.');
    return;
  }

  const installedVersion = await getCometVersionWindows();
  console.log(`Comet Browser ${installedVersion || ''} installed successfully.`);
  console.log('');
  console.log('Comet Browser is now available in your Start Menu.');
  console.log('You may need to open a new terminal to use it from the command line.');
  console.log('');
  console.log('NOTE: On first launch, you may need to sign in to your Perplexity account');
  console.log('to access all AI features.');
}

/**
 * Install Comet Browser from Git Bash on Windows.
 *
 * Git Bash runs within the Windows environment and can access Windows
 * executables including winget.exe. This function installs Comet Browser
 * on the Windows host using winget via PowerShell interop.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11
 * - Git Bash installed (comes with Git for Windows)
 * - winget package manager available on Windows
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Comet Browser on the Windows host...');
  console.log('');

  // Check if Comet is already installed by checking Windows paths
  // Git Bash path format uses forward slashes with drive letter prefix
  const userPath = '/c/Users/' + process.env.USERNAME + '/AppData/Local/Comet/Comet.exe';
  const systemPath = '/c/Program Files/Comet/Comet.exe';

  if (fs.existsSync(userPath) || fs.existsSync(systemPath)) {
    console.log('Comet Browser is already installed, skipping installation.');
    console.log('');
    console.log('To launch Comet from Git Bash:');
    console.log('  start "" "Comet"');
    return;
  }

  // Try winget via PowerShell
  console.log('Attempting installation via winget...');
  const wingetResult = await shell.exec(
    'powershell.exe -NoProfile -Command "winget install --id Perplexity.Comet --silent --accept-package-agreements --accept-source-agreements"'
  );

  if (wingetResult.code === 0) {
    console.log('Comet Browser installed successfully via winget.');
    console.log('');
    console.log('To launch Comet from Git Bash:');
    console.log('  start "" "Comet"');
    console.log('');
    console.log('NOTE: On first launch, you may need to sign in to your Perplexity account');
    console.log('to access all AI features.');
    return;
  }

  // winget failed
  console.log('Failed to install Comet Browser.');
  console.log(wingetResult.stdout || wingetResult.stderr);
  console.log('');
  console.log('Troubleshooting:');
  console.log('  1. Ensure winget is available on your Windows system');
  console.log('  2. Try running Git Bash as Administrator and retry');
  console.log('  3. Try installing directly from PowerShell:');
  console.log('     winget install --id Perplexity.Comet --silent --accept-package-agreements --accept-source-agreements');
}

/**
 * Check if Comet Browser is currently installed on the system.
 *
 * This function checks for Comet Browser installation across all supported platforms:
 * - macOS: Checks for Comet.app via Homebrew cask or application bundle
 * - Windows: Checks for Comet.exe at standard installation paths
 * - Git Bash: Checks Windows installation paths
 * - Other platforms: Returns false (not supported)
 *
 * @returns {Promise<boolean>} True if Comet Browser is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  // macOS: Check if Comet.app exists
  if (platform.type === 'macos') {
    // Check if Comet Browser app bundle exists
    if (isCometInstalledMacOS()) {
      return true;
    }
    // Also check via Homebrew cask
    return await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  }

  // Windows: Check via winget or file system
  if (platform.type === 'windows') {
    // Check file system first (faster)
    if (isCometInstalledWindows()) {
      return true;
    }
    // Fall back to winget check
    return await winget.isPackageInstalled(WINGET_PACKAGE_ID);
  }

  // Git Bash: Check Windows paths
  if (platform.type === 'gitbash') {
    const userPath = '/c/Users/' + process.env.USERNAME + '/AppData/Local/Comet/Comet.exe';
    const systemPath = '/c/Program Files/Comet/Comet.exe';
    return fs.existsSync(userPath) || fs.existsSync(systemPath);
  }

  // Other platforms (Linux, WSL, Raspberry Pi, Amazon Linux) are not supported
  return false;
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Comet Browser is ONLY supported on macOS and Windows. All Linux platforms
 * (including Ubuntu, Debian, Raspberry Pi OS, Amazon Linux, RHEL, Fedora,
 * and WSL) are NOT supported because Perplexity does not provide Linux builds.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();

  // Only macOS and Windows (including Git Bash) are supported
  const supportedPlatforms = ['macos', 'windows', 'gitbash'];
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
 * Detects the current platform using os.detect() and routes to the appropriate
 * platform-specific installer function. For unsupported platforms, returns
 * gracefully with an informational message (no errors thrown).
 *
 * Supported platforms:
 * - macOS: Comet Browser via Homebrew cask
 * - Windows: Comet Browser via winget
 * - Git Bash: Comet Browser on Windows host
 *
 * Unsupported platforms (return gracefully):
 * - Ubuntu/Debian
 * - Raspberry Pi OS
 * - Amazon Linux/RHEL/Fedora
 * - WSL
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases (e.g., debian uses the same installer as ubuntu)
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
    // Gracefully handle unsupported platforms without throwing an error
    console.log(`Comet Browser is not available for ${platform.type}.`);
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

// Allow direct execution: node comet-browser.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
