#!/usr/bin/env node

/**
 * @fileoverview Install Google Chrome.
 * @module installs/google-chrome
 *
 * Google Chrome is a fast, secure, and free web browser built by Google.
 * It is the most widely used web browser globally, featuring automatic updates,
 * built-in PDF viewer, password manager, and powerful developer tools.
 *
 * This installer provides:
 * - Google Chrome via Homebrew cask on macOS
 * - Google Chrome via official .deb package on Ubuntu/Debian
 * - Google Chrome via official .rpm package on Amazon Linux/RHEL
 * - Google Chrome via Chocolatey or winget on Windows
 * - Google Chrome within WSL (same as Ubuntu installation)
 * - Google Chrome on Windows host from Git Bash
 *
 * IMPORTANT PLATFORM NOTES:
 * - Raspberry Pi OS: Google Chrome does NOT support ARM architecture.
 *   Google only provides x86/x64 builds. The installer will display
 *   a graceful message for unsupported platforms.
 * - ARM-based systems: Chrome is only available for x86_64 architecture.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const choco = require('../utils/windows/choco');
const winget = require('../utils/windows/winget');

/**
 * Indicates whether this installer requires a desktop environment.
 * Google Chrome is a GUI web browser and requires a display.
 * @type {boolean}
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for Google Chrome on macOS.
 * Using the cask (not formula) because Chrome is a GUI application.
 */
const HOMEBREW_CASK_NAME = 'google-chrome';

/**
 * The Chocolatey package name for Google Chrome on Windows.
 */
const CHOCO_PACKAGE_NAME = 'googlechrome';

/**
 * The winget package ID for Google Chrome on Windows.
 * Using the full ID ensures we get the correct package.
 */
const WINGET_PACKAGE_ID = 'Google.Chrome';

/**
 * Path to Google Chrome application on macOS.
 * Used to verify installation succeeded.
 */
const MACOS_APP_PATH = '/Applications/Google Chrome.app';

/**
 * Path to Google Chrome executable on Windows (system-wide installation).
 * Used to verify installation and check version.
 */
const WINDOWS_CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

/**
 * URL to download the official Google Chrome .deb package.
 * This package also sets up the Google repository for automatic updates.
 */
const CHROME_DEB_URL = 'https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb';

/**
 * URL to download the official Google Chrome .rpm package.
 * Used for Amazon Linux and RHEL installations.
 */
const CHROME_RPM_URL = 'https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm';

/**
 * Check if Google Chrome is installed on macOS by verifying the app bundle exists.
 *
 * On macOS, GUI applications are typically installed as .app bundles in /Applications.
 * We check for the bundle's existence rather than relying on PATH because Chrome
 * is a GUI application that may not add itself to the shell PATH.
 *
 * @returns {boolean} True if Google Chrome.app exists in /Applications, false otherwise
 */
function isChromeInstalledMacOS() {
  const fs = require('fs');
  return fs.existsSync(MACOS_APP_PATH);
}

/**
 * Get the installed version of Google Chrome on macOS.
 *
 * Executes the Chrome binary within the app bundle with --version flag.
 * The output format is: "Google Chrome 143.0.7499.170"
 *
 * @returns {Promise<string|null>} Version string (e.g., "143.0.7499.170") or null if not installed
 */
async function getChromeVersionMacOS() {
  if (!isChromeInstalledMacOS()) {
    return null;
  }

  const chromePath = `${MACOS_APP_PATH}/Contents/MacOS/Google Chrome`;
  const result = await shell.exec(`"${chromePath}" --version`);

  if (result.code === 0 && result.stdout) {
    // Output format: "Google Chrome 143.0.7499.170"
    const match = result.stdout.match(/Google Chrome\s+([\d.]+)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Check if Google Chrome is installed on Linux by verifying the google-chrome command exists.
 *
 * When installed from Google's official .deb or .rpm package, Chrome adds the
 * 'google-chrome' or 'google-chrome-stable' command to /usr/bin.
 *
 * @returns {boolean} True if the google-chrome command is available, false otherwise
 */
function isChromeInstalledLinux() {
  return shell.commandExists('google-chrome') || shell.commandExists('google-chrome-stable');
}

/**
 * Get the installed version of Google Chrome on Linux.
 *
 * Tries both 'google-chrome' and 'google-chrome-stable' commands since
 * the command name varies between distributions.
 *
 * @returns {Promise<string|null>} Version string or null if not installed
 */
async function getChromeVersionLinux() {
  // Try google-chrome first (common symlink name)
  if (shell.commandExists('google-chrome')) {
    const result = await shell.exec('google-chrome --version');
    if (result.code === 0 && result.stdout) {
      const match = result.stdout.match(/Google Chrome\s+([\d.]+)/);
      return match ? match[1] : null;
    }
  }

  // Fall back to google-chrome-stable (actual binary name)
  if (shell.commandExists('google-chrome-stable')) {
    const result = await shell.exec('google-chrome-stable --version');
    if (result.code === 0 && result.stdout) {
      const match = result.stdout.match(/Google Chrome\s+([\d.]+)/);
      return match ? match[1] : null;
    }
  }

  return null;
}

/**
 * Check if Google Chrome is installed on Windows.
 *
 * Checks for the Chrome executable at the default installation path.
 * Chrome is typically installed to Program Files for system-wide installation
 * or to LocalAppData for per-user installation.
 *
 * @returns {boolean} True if Chrome executable exists, false otherwise
 */
function isChromeInstalledWindows() {
  const fs = require('fs');

  // Check system-wide installation path
  if (fs.existsSync(WINDOWS_CHROME_PATH)) {
    return true;
  }

  // Check per-user installation path
  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    const userPath = `${localAppData}\\Google\\Chrome\\Application\\chrome.exe`;
    if (fs.existsSync(userPath)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the installed version of Google Chrome on Windows.
 *
 * Executes the Chrome executable with --version flag to retrieve the version.
 *
 * @returns {Promise<string|null>} Version string or null if not installed
 */
async function getChromeVersionWindows() {
  const fs = require('fs');

  // Determine which path has Chrome installed
  let chromePath = null;
  if (fs.existsSync(WINDOWS_CHROME_PATH)) {
    chromePath = WINDOWS_CHROME_PATH;
  } else {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const userPath = `${localAppData}\\Google\\Chrome\\Application\\chrome.exe`;
      if (fs.existsSync(userPath)) {
        chromePath = userPath;
      }
    }
  }

  if (!chromePath) {
    return null;
  }

  const result = await shell.exec(`"${chromePath}" --version`);
  if (result.code === 0 && result.stdout) {
    const match = result.stdout.match(/Google Chrome\s+([\d.]+)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Install Google Chrome on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later
 * - Homebrew package manager installed
 * - Terminal access
 *
 * The installation uses the Homebrew cask 'google-chrome' which downloads
 * and installs Chrome to /Applications/Google Chrome.app.
 *
 * This function is idempotent - it checks if Chrome is already installed
 * before attempting installation and skips if already present.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Google Chrome is already installed...');

  // Check if Chrome is already installed via file system check
  if (isChromeInstalledMacOS()) {
    const version = await getChromeVersionMacOS();
    if (version) {
      console.log(`Google Chrome ${version} is already installed, skipping installation.`);
    } else {
      console.log('Google Chrome is already installed, skipping installation.');
    }
    return;
  }

  // Also check if the Homebrew cask is installed (Chrome may be installed but not detected)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Google Chrome is already installed via Homebrew, skipping installation.');
    return;
  }

  // Verify Homebrew is available before proceeding
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Google Chrome.'
    );
  }

  console.log('Installing Google Chrome via Homebrew...');

  // Install Google Chrome cask using the --quiet flag for cleaner output
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Google Chrome via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Try manual installation: brew reinstall --cask google-chrome\n` +
      `  3. Check if macOS Gatekeeper is blocking the app:\n` +
      `     xattr -cr /Applications/Google\\ Chrome.app`
    );
  }

  // Verify the installation succeeded
  if (!isChromeInstalledMacOS()) {
    throw new Error(
      'Installation appeared to complete but Google Chrome was not found.\n\n' +
      'Please check /Applications folder for Google Chrome.app'
    );
  }

  const installedVersion = await getChromeVersionMacOS();
  console.log(`Google Chrome ${installedVersion || ''} installed successfully.`);
  console.log('');
  console.log('You can launch Chrome from Applications or run:');
  console.log('  open -a "Google Chrome"');
}

/**
 * Install Google Chrome on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 18.04 or later, or Debian 10 or later (64-bit only)
 * - sudo privileges
 * - wget installed (used to download the .deb package)
 *
 * This function downloads Google's official .deb package and installs it.
 * The .deb package automatically adds Google's APT repository for future updates.
 *
 * IMPORTANT: Google Chrome is NOT available in Ubuntu's default repositories.
 * Always use Google's official package to ensure you get the latest version
 * with security updates.
 *
 * This function is idempotent - it checks if Chrome is already installed
 * before attempting installation.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu() {
  console.log('Checking if Google Chrome is already installed...');

  // Check if Chrome is already installed
  if (isChromeInstalledLinux()) {
    const version = await getChromeVersionLinux();
    if (version) {
      console.log(`Google Chrome ${version} is already installed, skipping installation.`);
    } else {
      console.log('Google Chrome is already installed, skipping installation.');
    }
    return;
  }

  console.log('Installing Google Chrome from Google\'s official repository...');

  // Step 1: Download the .deb package
  // Using wget with -q for quiet mode (suitable for automation)
  console.log('Downloading Google Chrome package...');
  const downloadResult = await shell.exec(
    `wget -q ${CHROME_DEB_URL} -O /tmp/google-chrome-stable_current_amd64.deb`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      `Failed to download Google Chrome package.\n` +
      `Error: ${downloadResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check your internet connection\n` +
      `  2. Ensure wget is installed: sudo apt-get install wget\n` +
      `  3. Try downloading manually: wget ${CHROME_DEB_URL}`
    );
  }

  // Step 2: Install the package using apt-get
  // DEBIAN_FRONTEND=noninteractive prevents interactive prompts during installation
  console.log('Installing Google Chrome...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/google-chrome-stable_current_amd64.deb'
  );

  // Clean up the downloaded .deb file regardless of installation result
  await shell.exec('rm -f /tmp/google-chrome-stable_current_amd64.deb');

  if (installResult.code !== 0) {
    // Try to fix broken dependencies and retry
    console.log('Attempting to fix broken dependencies...');
    const fixResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -f');

    if (fixResult.code !== 0) {
      throw new Error(
        `Failed to install Google Chrome.\n` +
        `Error: ${installResult.stderr}\n\n` +
        `Troubleshooting:\n` +
        `  1. Run: sudo apt-get update\n` +
        `  2. Install missing dependencies: sudo apt-get install -y -f\n` +
        `  3. Try again: sudo apt-get install -y ./google-chrome-stable_current_amd64.deb`
      );
    }
  }

  // Verify installation
  if (!isChromeInstalledLinux()) {
    throw new Error(
      'Installation appeared to complete but Google Chrome was not found.\n\n' +
      'Please try running: google-chrome --version'
    );
  }

  const installedVersion = await getChromeVersionLinux();
  console.log(`Google Chrome ${installedVersion || ''} installed successfully.`);
  console.log('');
  console.log('Launch Chrome with:');
  console.log('  google-chrome &');
  console.log('');
  console.log('NOTE: Chrome will automatically update via apt-get upgrade.');
}

/**
 * Install Google Chrome on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 with Ubuntu distribution installed
 * - WSLg enabled (included by default in Windows 11 and Windows 10 21H2+)
 * - sudo privileges within WSL
 *
 * This function installs Chrome using the same method as Ubuntu since
 * WSL Ubuntu is functionally identical to native Ubuntu for package management.
 * However, running Chrome requires WSLg for GUI support.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Use the same installation process as Ubuntu
  await install_ubuntu();

  // Add WSL-specific post-installation notes
  console.log('');
  console.log('WSL-SPECIFIC NOTES:');
  console.log('');
  console.log('1. Running GUI apps in WSL requires WSLg (Windows 11 / Windows 10 21H2+).');
  console.log('   If Chrome fails to launch, ensure WSLg is enabled.');
  console.log('');
  console.log('2. If you see sandbox errors, try:');
  console.log('   google-chrome --no-sandbox');
  console.log('');
  console.log('3. For headless automation in WSL:');
  console.log('   google-chrome --headless --disable-gpu --dump-dom https://example.com');
}

/**
 * Install Google Chrome on Raspberry Pi OS.
 *
 * IMPORTANT: Google Chrome does NOT support ARM architecture.
 * Google only provides x86/x64 builds of Chrome, and Raspberry Pi uses ARM processors.
 * This means Google Chrome cannot be installed natively on any Raspberry Pi device.
 *
 * This function gracefully informs the user that Chrome is not available
 * on this platform without throwing an error or suggesting alternatives.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Google Chrome is not available for Raspberry Pi OS.');
  return;
}

/**
 * Install Google Chrome on Amazon Linux using DNF/YUM.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) recommended
 * - Amazon Linux 2 is supported but reached end of standard support
 * - sudo privileges
 * - x86_64 architecture (ARM/Graviton instances are not supported)
 *
 * This function downloads and installs Google's official RPM package.
 * Amazon Linux 2023 uses DNF, while Amazon Linux 2 uses YUM.
 *
 * NOTE: Google does not officially support Chrome on Amazon Linux, but the
 * Chrome RPM package installs successfully on both AL2023 and AL2.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('Checking if Google Chrome is already installed...');

  // Check if Chrome is already installed
  if (isChromeInstalledLinux()) {
    const version = await getChromeVersionLinux();
    if (version) {
      console.log(`Google Chrome ${version} is already installed, skipping installation.`);
    } else {
      console.log('Google Chrome is already installed, skipping installation.');
    }
    return;
  }

  // Detect package manager (dnf for AL2023, yum for AL2)
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
  console.log('Installing Google Chrome from Google\'s official RPM package...');

  // Install Chrome directly from Google's RPM URL
  // This method also installs required dependencies automatically
  const installResult = await shell.exec(
    `sudo ${packageManager} install -y ${CHROME_RPM_URL}`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Google Chrome.\n` +
      `Error: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Install common dependencies first:\n` +
      `     sudo ${packageManager} install -y libXcomposite libXdamage libXrandr libgbm libxkbcommon pango alsa-lib atk at-spi2-atk cups-libs libdrm mesa-libgbm\n` +
      `  2. Then retry: sudo ${packageManager} install -y ${CHROME_RPM_URL}`
    );
  }

  // Verify installation
  if (!isChromeInstalledLinux()) {
    throw new Error(
      'Installation appeared to complete but Google Chrome was not found.\n\n' +
      'Please try running: google-chrome-stable --version'
    );
  }

  const installedVersion = await getChromeVersionLinux();
  console.log(`Google Chrome ${installedVersion || ''} installed successfully.`);
  console.log('');
  console.log('NOTE: On EC2 instances, you may need to run Chrome with additional flags:');
  console.log('  google-chrome-stable --no-sandbox --headless');
}

/**
 * Install Google Chrome on Windows using Chocolatey or winget.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later, or Windows 11
 * - Administrator privileges
 * - Chocolatey or winget package manager installed
 *
 * This function prefers winget if available (built into modern Windows),
 * falling back to Chocolatey if winget is not present.
 *
 * @returns {Promise<void>}
 * @throws {Error} If no package manager is available or installation fails
 */
async function install_windows() {
  console.log('Checking if Google Chrome is already installed...');

  // Check if Chrome is already installed
  if (isChromeInstalledWindows()) {
    const version = await getChromeVersionWindows();
    if (version) {
      console.log(`Google Chrome ${version} is already installed, skipping installation.`);
    } else {
      console.log('Google Chrome is already installed, skipping installation.');
    }
    return;
  }

  // Prefer winget if available (modern Windows includes it by default)
  if (winget.isInstalled()) {
    console.log('Installing Google Chrome via winget...');

    const result = await winget.install(WINGET_PACKAGE_ID, {
      silent: true,
      source: 'winget'
    });

    if (result.success) {
      console.log('Google Chrome installed successfully via winget.');
      console.log('');
      console.log('NOTE: Chrome is now available in your Start Menu.');
      console.log('You may need to open a new terminal to use it from the command line.');
      return;
    }

    // winget failed - check if it's a "already installed" scenario
    // winget returns non-zero even when the app is already installed
    if (result.output && result.output.includes('already installed')) {
      console.log('Google Chrome is already installed.');
      return;
    }

    // winget failed, log the error and try Chocolatey as fallback
    console.log('winget installation failed:');
    if (result.output) {
      console.log(result.output);
    }
    console.log('');
    console.log('Trying Chocolatey as fallback...');
  }

  // Try Chocolatey if available
  if (choco.isInstalled()) {
    console.log('Installing Google Chrome via Chocolatey...');

    const result = await choco.install(CHOCO_PACKAGE_NAME);

    if (!result.success) {
      throw new Error(
        `Failed to install Google Chrome via Chocolatey.\n` +
        `Output: ${result.output}\n\n` +
        `Troubleshooting:\n` +
        `  1. Ensure you are running as Administrator\n` +
        `  2. Try manual installation: choco install googlechrome -y --force`
      );
    }

    console.log('Google Chrome installed successfully via Chocolatey.');
    console.log('');
    console.log('NOTE: Chrome is now available in your Start Menu.');
    console.log('You may need to open a new terminal to use it from the command line.');
    return;
  }

  // Neither package manager is available
  throw new Error(
    'Neither winget nor Chocolatey package manager is available.\n\n' +
    'Please install one of the following:\n' +
    '  - winget: Included in Windows 10 (2004+) and Windows 11\n' +
    '  - Chocolatey: https://chocolatey.org/install\n\n' +
    'After installing a package manager, retry: dev install google-chrome'
  );
}

/**
 * Install Google Chrome from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Google Chrome
 * on the Windows host using PowerShell interop with Chocolatey or winget.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey or winget available on Windows
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Google Chrome on the Windows host...');
  console.log('');

  // Check if Chrome is already installed by checking the Windows path
  const fs = require('fs');

  // Git Bash path format uses forward slashes with drive letter prefix
  const windowsPath = '/c/Program Files/Google/Chrome/Application/chrome.exe';
  const exists = fs.existsSync(windowsPath);

  if (exists) {
    console.log('Google Chrome is already installed, skipping installation.');
    console.log('');
    console.log('To use Chrome from Git Bash:');
    console.log('  "/c/Program Files/Google/Chrome/Application/chrome.exe" --version');
    return;
  }

  // Try winget first via PowerShell
  console.log('Attempting installation via winget...');
  const wingetResult = await shell.exec(
    'powershell.exe -NoProfile -Command "winget install --id Google.Chrome --silent --accept-package-agreements --accept-source-agreements"'
  );

  if (wingetResult.code === 0) {
    console.log('Google Chrome installed successfully via winget.');
    console.log('');
    console.log('To use Chrome from Git Bash:');
    console.log('  "/c/Program Files/Google/Chrome/Application/chrome.exe" --version');
    return;
  }

  // Fall back to Chocolatey
  console.log('winget installation failed, trying Chocolatey...');
  const chocoResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install googlechrome -y"'
  );

  if (chocoResult.code !== 0) {
    throw new Error(
      `Failed to install Google Chrome.\n` +
      `Output: ${chocoResult.stdout || chocoResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure winget or Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell:\n` +
      `     winget install --id Google.Chrome --silent`
    );
  }

  console.log('Google Chrome installed successfully via Chocolatey.');
  console.log('');
  console.log('To use Chrome from Git Bash:');
  console.log('  "/c/Program Files/Google/Chrome/Application/chrome.exe" --version');
}

/**
 * Check if Google Chrome is currently installed on the system.
 *
 * This function checks for Google Chrome installation across all supported platforms:
 * - macOS: Checks for Google Chrome.app via Homebrew cask or application bundle
 * - Windows: Checks for Chrome.exe at standard installation paths
 * - Linux: Checks if google-chrome or google-chrome-stable command exists
 *
 * @returns {Promise<boolean>} True if Google Chrome is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    // Check if Google Chrome app bundle exists
    if (isChromeInstalledMacOS()) {
      return true;
    }
    // Also check via Homebrew cask
    return await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  }

  if (platform.type === 'windows' || platform.type === 'gitbash') {
    return isChromeInstalledWindows();
  }

  if (platform.type === 'raspbian') {
    // Chrome is not available for Raspberry Pi
    return false;
  }

  // Linux platforms: Check if google-chrome command exists
  return isChromeInstalledLinux();
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Google Chrome is NOT supported on ARM-based platforms (Raspberry Pi)
 * and requires a desktop environment since it is a GUI application.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();

  // First check if the platform is supported
  // Chrome is NOT available for Raspberry Pi (ARM architecture)
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
 * Detects the current platform using os.detect() and routes to the appropriate
 * platform-specific installer function. Handles platform aliases to ensure
 * all supported distributions use the correct installation method.
 *
 * Supported platforms:
 * - macOS: Google Chrome via Homebrew cask
 * - Ubuntu/Debian: Google Chrome via official .deb package
 * - Amazon Linux/RHEL: Google Chrome via official .rpm package
 * - Windows: Google Chrome via winget or Chocolatey
 * - WSL (Ubuntu): Google Chrome within WSL environment
 * - Git Bash: Google Chrome on Windows host
 *
 * Unsupported platforms:
 * - Raspberry Pi OS (ARM architecture not supported by Chrome)
 * - Any other ARM-based Linux distributions
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
    console.log(`Google Chrome is not available for ${platform.type}.`);
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

// Allow direct execution: node google-chrome.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
