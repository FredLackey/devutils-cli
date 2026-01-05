#!/usr/bin/env node

/**
 * @fileoverview Install Tidal.
 * @module installs/tidal
 *
 * Tidal is a high-fidelity music streaming service that provides access to over
 * 100 million songs and 650,000+ music videos. Known for its lossless audio quality,
 * Tidal offers HiFi (lossless CD quality at 16-bit/44.1kHz) and HiFi Plus
 * (Master Quality Authenticated/MQA and HiRes FLAC up to 24-bit/192kHz) streaming tiers.
 *
 * This installer provides:
 * - Tidal Desktop App for macOS via Homebrew cask
 * - Tidal Desktop App for Windows via Chocolatey
 * - tidal-hifi (third-party client) for Ubuntu/Debian via Flatpak (x86_64 only)
 * - tidal-hifi for Amazon Linux/RHEL via Flatpak (x86_64 only)
 * - Instructions to launch Windows Tidal from WSL/Git Bash
 *
 * IMPORTANT PLATFORM NOTES:
 * - Raspberry Pi OS: Tidal does not provide native ARM packages, and tidal-hifi
 *   is only available for x86_64 architecture. Raspberry Pi devices use ARM
 *   processors, which are not supported. Users can use Tidal Connect via Docker.
 * - Linux: Tidal does not provide an official desktop application for Linux.
 *   This installer uses tidal-hifi, an open-source Electron-based wrapper for
 *   the Tidal web player with native desktop features.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew cask name for Tidal on macOS.
 * This installs the full desktop application to /Applications.
 */
const HOMEBREW_CASK_NAME = 'tidal';

/**
 * The Chocolatey package name for Tidal on Windows.
 */
const CHOCO_PACKAGE_NAME = 'tidal';

/**
 * The Flatpak application ID for tidal-hifi on Linux.
 * tidal-hifi is a third-party open-source client that wraps the Tidal web player
 * in an Electron shell with added features like media key support and MPRIS.
 */
const FLATPAK_APP_ID = 'com.mastermindzh.tidal-hifi';

/**
 * Check if Tidal Desktop application is installed on macOS.
 *
 * Looks for TIDAL.app in /Applications or ~/Applications using the
 * macosApps utility which handles common variations of app names.
 *
 * @returns {boolean} True if TIDAL.app exists, false otherwise
 */
function isTidalInstalledMacOS() {
  return macosApps.isAppInstalled('TIDAL');
}

/**
 * Check if tidal-hifi is installed via Flatpak on Linux systems.
 *
 * Queries the Flatpak database to determine if the tidal-hifi application
 * is present in the system or user installation.
 *
 * @returns {Promise<boolean>} True if tidal-hifi is installed via Flatpak, false otherwise
 */
async function isTidalHifiInstalledFlatpak() {
  const result = await shell.exec(`flatpak list | grep -i "${FLATPAK_APP_ID}"`);
  return result.code === 0 && result.stdout.includes(FLATPAK_APP_ID);
}

/**
 * Check if Flatpak is installed and available on the system.
 *
 * @returns {boolean} True if flatpak command exists in PATH, false otherwise
 */
function isFlatpakInstalled() {
  return shell.commandExists('flatpak');
}

/**
 * Install Tidal Desktop on macOS using Homebrew cask.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later
 * - Homebrew package manager installed
 * - At least 200 MB free disk space
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * The installation uses the Homebrew cask 'tidal' which downloads and installs
 * the Tidal desktop application to /Applications/TIDAL.app.
 *
 * NOTE: After installation, Tidal must be launched manually. On first launch,
 * it will prompt you to sign in with your Tidal account credentials.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Tidal is already installed...');

  // Check if TIDAL.app already exists in Applications
  if (isTidalInstalledMacOS()) {
    console.log('Tidal is already installed, skipping installation.');
    return;
  }

  // Also check if the cask is installed via Homebrew
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Tidal is already installed via Homebrew, skipping installation.');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Tidal.'
    );
  }

  console.log('Installing Tidal via Homebrew...');

  // Install Tidal cask with quiet flag for cleaner output
  // The --quiet flag suppresses non-essential output for automation-friendly installation
  const result = await shell.exec('brew install --quiet --cask tidal');

  if (result.code !== 0) {
    throw new Error(
      `Failed to install Tidal via Homebrew.\n` +
      `Output: ${result.stderr || result.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Check if macOS version is 12 (Monterey) or later\n` +
      `  3. Try manual installation: brew reinstall --cask tidal`
    );
  }

  // Verify installation succeeded by checking if app now exists
  if (!isTidalInstalledMacOS()) {
    throw new Error(
      'Installation command completed but TIDAL.app was not found in Applications.\n\n' +
      'Please try:\n' +
      '  1. Check /Applications for TIDAL.app\n' +
      '  2. Run: brew reinstall --cask tidal'
    );
  }

  console.log('Tidal installed successfully.');
  console.log('');
  console.log('To launch Tidal:');
  console.log('  - Open from Applications folder, or');
  console.log('  - Run: open -a TIDAL');
  console.log('');
  console.log('On first launch, you will be prompted to sign in with your');
  console.log('Tidal account credentials.');
}

/**
 * Install tidal-hifi on Ubuntu/Debian using Flatpak.
 *
 * PLATFORM NOTE: Tidal does not provide an official desktop application for Linux.
 * This function installs tidal-hifi, an open-source Electron-based application
 * that wraps the Tidal web player with native desktop features including:
 * - HiFi audio quality support via Widevine
 * - Media key integration
 * - MPRIS support for desktop audio controls
 * - Discord Rich Presence integration
 * - ListenBrainz scrobbling
 *
 * Prerequisites:
 * - Ubuntu 18.04 LTS or later, or Debian 10 (Buster) or later
 * - 64-bit x86_64 architecture (ARM is not supported)
 * - sudo privileges
 * - Flatpak installed
 * - At least 500 MB free disk space
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails on supported architecture
 */
async function install_ubuntu() {
  console.log('Checking if tidal-hifi is already installed...');

  // Check if tidal-hifi is already installed via Flatpak
  if (isFlatpakInstalled()) {
    const isInstalled = await isTidalHifiInstalledFlatpak();
    if (isInstalled) {
      console.log('tidal-hifi is already installed, skipping installation.');
      return;
    }
  }

  // Verify architecture - tidal-hifi Flatpak only supports x86_64
  // ARM systems should use the web player at https://listen.tidal.com
  const archResult = await shell.exec('uname -m');
  const architecture = archResult.stdout.trim();
  if (architecture !== 'x86_64') {
    console.log(`Tidal is not available for ${architecture} architecture.`);
    console.log('');
    console.log('tidal-hifi requires 64-bit x86_64 architecture.');
    console.log('You can use the Tidal web player at https://listen.tidal.com instead.');
    return;
  }

  console.log('');
  console.log('NOTE: Tidal does not provide an official desktop app for Linux.');
  console.log('Installing tidal-hifi - a third-party open-source client.');
  console.log('');

  // Step 1: Ensure Flatpak is installed
  if (!isFlatpakInstalled()) {
    console.log('Installing Flatpak...');
    const flatpakInstallResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y flatpak'
    );

    if (flatpakInstallResult.code !== 0) {
      throw new Error(
        'Failed to install Flatpak.\n' +
        `Output: ${flatpakInstallResult.stderr}\n\n` +
        'Please try:\n' +
        '  sudo apt-get update && sudo apt-get install -y flatpak'
      );
    }
  }

  // Step 2: Add Flathub repository if not already added
  console.log('Adding Flathub repository...');
  const flathubResult = await shell.exec(
    'flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo'
  );

  if (flathubResult.code !== 0) {
    throw new Error(
      'Failed to add Flathub repository.\n' +
      `Output: ${flathubResult.stderr}\n\n` +
      'Please try:\n' +
      '  flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo'
    );
  }

  // Step 3: Install tidal-hifi via Flatpak
  console.log('Installing tidal-hifi via Flatpak...');
  console.log('This may take a few minutes...');

  const installResult = await shell.exec(`flatpak install -y flathub ${FLATPAK_APP_ID}`);

  if (installResult.code !== 0) {
    throw new Error(
      'Failed to install tidal-hifi via Flatpak.\n' +
      `Output: ${installResult.stderr || installResult.stdout}\n\n` +
      'Troubleshooting:\n' +
      '  1. Ensure Flatpak is properly installed\n' +
      '  2. Log out and log back in if Flatpak was just installed\n' +
      `  3. Try manual installation: flatpak install -y flathub ${FLATPAK_APP_ID}`
    );
  }

  // Verify installation succeeded
  const verifyInstalled = await isTidalHifiInstalledFlatpak();
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but tidal-hifi was not found.\n\n' +
      'Please try:\n' +
      '  1. Run: flatpak list | grep tidal\n' +
      `  2. Retry: flatpak install -y flathub ${FLATPAK_APP_ID}`
    );
  }

  console.log('tidal-hifi installed successfully.');
  console.log('');
  console.log('To launch tidal-hifi:');
  console.log(`  - Run: flatpak run ${FLATPAK_APP_ID} &`);
  console.log('  - Or find "TIDAL Hi-Fi" in your application menu');
  console.log('');
  console.log('On first launch, you will be prompted to sign in with your');
  console.log('Tidal account credentials.');
  console.log('');
  console.log('NOTE: You may need to log out and log back in for the');
  console.log('application to appear in your application menu.');
}

/**
 * Install Tidal on Raspberry Pi OS.
 *
 * PLATFORM LIMITATION: Tidal does not provide native ARM packages, and tidal-hifi
 * is only available for x86_64 architecture. Raspberry Pi devices use ARM
 * processors, which are not supported by the official Tidal client or tidal-hifi.
 *
 * This function gracefully informs the user that Tidal is not available for
 * Raspberry Pi and provides information about Tidal Connect as an alternative.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Tidal is not available for Raspberry Pi OS.');
  console.log('');
  console.log('The Tidal desktop application and tidal-hifi require x86_64 architecture.');
  console.log('Raspberry Pi uses ARM processors which are not supported.');
  console.log('');
  console.log('Alternative: You can set up Tidal Connect using Docker to turn your');
  console.log('Raspberry Pi into a Tidal streaming endpoint. Control playback from');
  console.log('your phone, tablet, or computer, and audio plays through the Pi.');
  console.log('');
  console.log('For Tidal Connect setup instructions, see:');
  console.log('  https://github.com/GioF71/tidal-connect');
  return;
}

/**
 * Install tidal-hifi on Amazon Linux/RHEL using Flatpak.
 *
 * PLATFORM NOTE: Tidal does not provide an official desktop application for Linux.
 * This function installs tidal-hifi via Flatpak on RHEL-based distributions.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, RHEL 8/9, or Fedora (64-bit x86_64)
 * - sudo privileges
 * - Graphical desktop environment (required for tidal-hifi GUI)
 * - At least 500 MB free disk space
 *
 * IMPORTANT: Amazon Linux EC2 instances typically run headless (no GUI).
 * If you are running a headless server, use the Tidal web player at
 * https://listen.tidal.com instead.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails on supported architecture
 */
async function install_amazon_linux() {
  console.log('Checking if tidal-hifi is already installed...');

  // Check if tidal-hifi is already installed via Flatpak
  if (isFlatpakInstalled()) {
    const isInstalled = await isTidalHifiInstalledFlatpak();
    if (isInstalled) {
      console.log('tidal-hifi is already installed, skipping installation.');
      return;
    }
  }

  // Verify architecture - tidal-hifi only supports x86_64
  const archResult = await shell.exec('uname -m');
  const architecture = archResult.stdout.trim();
  if (architecture !== 'x86_64') {
    console.log(`Tidal is not available for ${architecture} architecture.`);
    console.log('');
    console.log('tidal-hifi requires 64-bit x86_64 architecture.');
    console.log('You can use the Tidal web player at https://listen.tidal.com instead.');
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
  console.log('');
  console.log('NOTE: Tidal does not provide an official desktop app for Linux.');
  console.log('Installing tidal-hifi - a third-party open-source client.');
  console.log('');

  // Step 1: Install Flatpak if not already installed
  if (!isFlatpakInstalled()) {
    console.log('Installing Flatpak...');
    const flatpakInstallResult = await shell.exec(`sudo ${packageManager} install -y flatpak`);

    if (flatpakInstallResult.code !== 0) {
      throw new Error(
        'Failed to install Flatpak.\n' +
        `Output: ${flatpakInstallResult.stderr}\n\n` +
        'Troubleshooting:\n' +
        `  1. Try: sudo ${packageManager} install -y flatpak\n` +
        '  2. Ensure EPEL repository is enabled for RHEL-based systems'
      );
    }
  }

  // Step 2: Add Flathub repository if not already added
  console.log('Adding Flathub repository...');
  const flathubResult = await shell.exec(
    'flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo'
  );

  if (flathubResult.code !== 0) {
    throw new Error(
      'Failed to add Flathub repository.\n' +
      `Output: ${flathubResult.stderr}\n\n` +
      'Please try:\n' +
      '  flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo'
    );
  }

  // Step 3: Install tidal-hifi via Flatpak
  console.log('Installing tidal-hifi via Flatpak...');
  console.log('This may take a few minutes...');

  const installResult = await shell.exec(`flatpak install -y flathub ${FLATPAK_APP_ID}`);

  if (installResult.code !== 0) {
    throw new Error(
      'Failed to install tidal-hifi via Flatpak.\n' +
      `Output: ${installResult.stderr || installResult.stdout}\n\n` +
      'Troubleshooting:\n' +
      '  1. You may need to log out and back in after installing Flatpak\n' +
      `  2. Try manual installation: flatpak install -y flathub ${FLATPAK_APP_ID}`
    );
  }

  // Verify installation
  const verifyInstalled = await isTidalHifiInstalledFlatpak();
  if (!verifyInstalled) {
    // Flatpak might not be fully in PATH yet
    console.log('');
    console.log('tidal-hifi installation completed.');
    console.log('');
    console.log('IMPORTANT: You may need to log out and log back in for the');
    console.log('flatpak command to become available in your PATH.');
    console.log('');
    console.log('After logging back in:');
    console.log(`  - Run: flatpak run ${FLATPAK_APP_ID} &`);
    console.log('  - Or find "TIDAL Hi-Fi" in your application menu');
    return;
  }

  console.log('tidal-hifi installed successfully.');
  console.log('');
  console.log('To launch tidal-hifi:');
  console.log(`  - Run: flatpak run ${FLATPAK_APP_ID} &`);
  console.log('  - Or find "TIDAL Hi-Fi" in your application menu');
  console.log('');
  console.log('NOTE: tidal-hifi requires a graphical desktop environment.');
  console.log('If running on a headless server, use the web player at:');
  console.log('  https://listen.tidal.com');
}

/**
 * Install Tidal on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 1903 or later, or Windows 11 (64-bit)
 * - At least 250 MB free disk space
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * The installation uses Chocolatey's 'tidal' package which downloads and
 * installs the official Tidal desktop application.
 *
 * NOTE: After installation, Tidal can be launched from the Start Menu or
 * via the 'tidal:' protocol handler.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Tidal is already installed...');

  // Check if Tidal is already installed via Chocolatey
  const isInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (isInstalled) {
    console.log('Tidal is already installed, skipping installation.');
    return;
  }

  // Verify Chocolatey is available before attempting installation
  if (!choco.isInstalled()) {
    throw new Error(
      'Chocolatey is not installed. Please install Chocolatey first:\n\n' +
      'Run the following in an Administrator PowerShell:\n' +
      '  Set-ExecutionPolicy Bypass -Scope Process -Force; ' +
      '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; ' +
      'iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))\n\n' +
      'Then retry installing Tidal.'
    );
  }

  console.log('Installing Tidal via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install Tidal using Chocolatey
  // The -y flag automatically confirms all prompts
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Tidal via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Run 'choco list tidal' to check availability\n` +
      `  3. Try manual installation: choco install tidal -y --force`
    );
  }

  // Verify installation
  const verifyInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but Tidal was not found.\n\n' +
      'Please try:\n' +
      '  1. Run: choco list tidal\n' +
      '  2. Retry: choco install tidal -y'
    );
  }

  console.log('Tidal installed successfully.');
  console.log('');
  console.log('To launch Tidal:');
  console.log('  - Open from Start Menu, or');
  console.log('  - Run: Start-Process tidal:');
  console.log('');
  console.log('On first launch, you will be prompted to sign in with your');
  console.log('Tidal account credentials.');
}

/**
 * Install Tidal when running from Ubuntu on WSL (Windows Subsystem for Linux).
 *
 * PLATFORM APPROACH: Tidal is installed on the Windows host and accessed from
 * WSL. While WSL with WSLg can technically run Linux GUI applications, the
 * recommended approach is to install Tidal on Windows and launch it from WSL
 * using Windows interoperability.
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - Chocolatey installed on Windows for Tidal installation
 *
 * This function installs Tidal on the Windows host via PowerShell/Chocolatey,
 * then provides instructions for launching it from within WSL.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation on Windows host fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Installing Tidal on the Windows host...');
  console.log('');

  // Check if Tidal is already available on Windows host
  const tidalCheck = await shell.exec('cmd.exe /c "choco list tidal --local-only" 2>/dev/null');
  if (tidalCheck.code === 0 && tidalCheck.stdout.toLowerCase().includes('tidal')) {
    console.log('Tidal is already installed on Windows, skipping installation.');
    console.log('');
    console.log('To launch Tidal from WSL:');
    console.log('  cmd.exe /c start "" "tidal:"');
    return;
  }

  console.log('Installing Tidal via Chocolatey on Windows...');
  console.log('This may take a few minutes...');

  // Install via PowerShell using Chocolatey on the Windows host
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install tidal -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Tidal on Windows host.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Open an Administrator PowerShell on Windows and run:\n` +
      `     choco install tidal -y\n` +
      `  3. Then launch from WSL with: cmd.exe /c start "" "tidal:"`
    );
  }

  console.log('Tidal installed successfully on Windows.');
  console.log('');
  console.log('To launch Tidal from WSL:');
  console.log('  cmd.exe /c start "" "tidal:"');
  console.log('');
  console.log('Alternative - open Tidal web in browser:');
  console.log('  cmd.exe /c start https://listen.tidal.com');
  console.log('');
  console.log('TIP: Add an alias to ~/.bashrc for convenience:');
  console.log('  echo \'alias tidal="cmd.exe /c start https://listen.tidal.com"\' >> ~/.bashrc');
}

/**
 * Install Tidal from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Tidal on the
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
  console.log('Installing Tidal on the Windows host...');
  console.log('');

  // Check if Tidal is already installed
  const tidalCheck = await shell.exec('choco list tidal --local-only 2>/dev/null');
  if (tidalCheck.code === 0 && tidalCheck.stdout.toLowerCase().includes('tidal')) {
    console.log('Tidal is already installed, skipping installation.');
    console.log('');
    console.log('To launch Tidal:');
    console.log('  start https://listen.tidal.com');
    return;
  }

  console.log('Installing Tidal via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install via PowerShell using Chocolatey
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install tidal -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Tidal.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell:\n` +
      `     choco install tidal -y`
    );
  }

  console.log('Tidal installed successfully.');
  console.log('');
  console.log('To launch Tidal from Git Bash:');
  console.log('  start https://listen.tidal.com');
  console.log('');
  console.log('Or use the explicit Windows command:');
  console.log('  cmd //c "start https://listen.tidal.com"');
}

/**
 * Check if this installer is supported on the current platform.
 * Tidal is supported on all major platforms except Raspberry Pi OS.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Tidal Desktop via Homebrew cask
 * - Ubuntu/Debian: tidal-hifi via Flatpak (x86_64 only)
 * - Raspberry Pi OS: Not supported (graceful message with alternatives)
 * - Amazon Linux/RHEL: tidal-hifi via Flatpak (x86_64 only)
 * - Windows: Tidal Desktop via Chocolatey
 * - WSL (Ubuntu): Installs Tidal on Windows host
 * - Git Bash: Installs Tidal on Windows host
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
    console.log(`Tidal is not available for ${platform.type}.`);
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

// Allow direct execution: node tidal.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
