#!/usr/bin/env node

/**
 * @fileoverview Install Spotify.
 * @module installs/spotify
 *
 * Spotify is a digital music streaming service that provides access to millions
 * of songs, podcasts, and videos from creators worldwide. The desktop application
 * offers features including offline listening (with Premium), high-quality audio
 * streaming, curated playlists, and seamless syncing across devices.
 *
 * This installer provides:
 * - Spotify Desktop App for macOS via Homebrew cask
 * - Spotify Desktop App for Windows via Chocolatey
 * - Spotify Desktop App for Ubuntu/Debian via Snap (x86_64 only)
 * - Raspotify (Spotify Connect client) for Raspberry Pi OS
 * - Spotify Desktop App for Amazon Linux/RHEL via Snap (x86_64 only)
 * - Instructions to launch Windows Spotify from WSL/Git Bash
 *
 * IMPORTANT PLATFORM NOTES:
 * - Raspberry Pi OS: The native Spotify desktop app is not available for ARM.
 *   This installer provides Raspotify, which turns the Pi into a Spotify Connect
 *   speaker. A Spotify Premium account is required for Raspotify.
 * - Linux: Spotify for Linux is not an officially supported platform. As Spotify
 *   states, it is "a labor of love from engineers who wanted to listen to Spotify
 *   on their Linux development machines."
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const snap = require('../utils/ubuntu/snap');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew cask name for Spotify on macOS.
 * This installs the full desktop application to /Applications.
 */
const HOMEBREW_CASK_NAME = 'spotify';

/**
 * The Chocolatey package name for Spotify on Windows.
 */
const CHOCO_PACKAGE_NAME = 'spotify';

/**
 * The Snap package name for Spotify on Ubuntu/Debian.
 * This is the officially supported distribution method by Spotify for Linux.
 */
const SNAP_PACKAGE_NAME = 'spotify';

/**
 * Check if Spotify Desktop application is installed on macOS.
 *
 * Looks for Spotify.app in /Applications or ~/Applications using the
 * macosApps utility which handles common variations of app names.
 *
 * @returns {boolean} True if Spotify.app exists, false otherwise
 */
function isSpotifyInstalledMacOS() {
  return macosApps.isAppInstalled('Spotify');
}

/**
 * Check if the Spotify command is available in PATH on Linux systems.
 *
 * After Snap installation, the 'spotify' command should be available.
 * This check is used as an additional verification method alongside
 * the Snap-specific check.
 *
 * @returns {boolean} True if spotify command exists, false otherwise
 */
function isSpotifyCommandAvailable() {
  return shell.commandExists('spotify');
}

/**
 * Check if Raspotify service is installed on Raspberry Pi OS.
 *
 * Raspotify is a Spotify Connect client that allows the Raspberry Pi
 * to act as a Spotify speaker. This function checks for the presence
 * of the raspotify service unit file.
 *
 * @returns {Promise<boolean>} True if raspotify is installed, false otherwise
 */
async function isRaspotifyInstalled() {
  // Check if the raspotify service exists
  const result = await shell.exec('systemctl list-unit-files raspotify.service 2>/dev/null');
  return result.code === 0 && result.stdout.includes('raspotify');
}

/**
 * Install Spotify Desktop on macOS using Homebrew cask.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later
 * - Homebrew package manager installed
 * - At least 500 MB free disk space
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * The installation uses the Homebrew cask 'spotify' which downloads and installs
 * the Spotify desktop application to /Applications/Spotify.app.
 *
 * NOTE: After installation, Spotify must be launched manually. On first launch,
 * it will prompt you to sign in with your Spotify account credentials.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Spotify is already installed...');

  // Check if Spotify.app already exists in Applications
  if (isSpotifyInstalledMacOS()) {
    console.log('Spotify is already installed, skipping installation.');
    return;
  }

  // Also check if the cask is installed via Homebrew
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Spotify is already installed via Homebrew, skipping installation.');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Spotify.'
    );
  }

  console.log('Installing Spotify via Homebrew...');

  // Install Spotify cask with quiet flag for cleaner output
  // The --quiet flag suppresses non-essential output for automation-friendly installation
  const result = await shell.exec('brew install --quiet --cask spotify');

  if (result.code !== 0) {
    throw new Error(
      `Failed to install Spotify via Homebrew.\n` +
      `Output: ${result.stderr || result.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Check if macOS version is 12 (Monterey) or later\n` +
      `  3. Try manual installation: brew reinstall --cask spotify`
    );
  }

  // Verify installation succeeded by checking if app now exists
  if (!isSpotifyInstalledMacOS()) {
    throw new Error(
      'Installation command completed but Spotify.app was not found in Applications.\n\n' +
      'Please try:\n' +
      '  1. Check /Applications for Spotify.app\n' +
      '  2. Run: brew reinstall --cask spotify'
    );
  }

  console.log('Spotify installed successfully.');
  console.log('');
  console.log('To launch Spotify:');
  console.log('  - Open from Applications folder, or');
  console.log('  - Run: open -a Spotify');
  console.log('');
  console.log('On first launch, you will be prompted to sign in with your');
  console.log('Spotify account credentials.');
}

/**
 * Install Spotify on Ubuntu/Debian using Snap.
 *
 * Prerequisites:
 * - Ubuntu 16.04 LTS or later, or Debian 10 (Buster) or later
 * - 64-bit x86_64 architecture (ARM is not supported)
 * - sudo privileges
 * - Snap package manager (pre-installed on Ubuntu 16.04+)
 * - At least 250 MB free disk space
 *
 * The installation uses the Snap package which is the officially supported
 * distribution method by Spotify for Linux. The Snap package provides
 * automatic updates and sandboxed execution.
 *
 * IMPORTANT: Spotify Snap is only available for x86_64 architecture. ARM-based
 * systems (including Raspberry Pi) are not supported by this installation method.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails on supported architecture
 */
async function install_ubuntu() {
  console.log('Checking if Spotify is already installed...');

  // Check if Spotify is already installed via Snap
  const isInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (isInstalled) {
    console.log('Spotify is already installed, skipping installation.');
    return;
  }

  // Also check if spotify command exists (could be installed another way)
  if (isSpotifyCommandAvailable()) {
    console.log('Spotify is already installed, skipping installation.');
    return;
  }

  // Verify architecture - Spotify Snap only supports x86_64
  // ARM systems should use the web player at https://open.spotify.com
  const archResult = await shell.exec('uname -m');
  const architecture = archResult.stdout.trim();
  if (architecture !== 'x86_64') {
    console.log(`Spotify is not available for ${architecture} architecture.`);
    console.log('');
    console.log('Spotify requires 64-bit x86_64 architecture for the native desktop app.');
    console.log('You can use the Spotify web player at https://open.spotify.com instead.');
    return;
  }

  // Verify Snap is available before attempting installation
  if (!snap.isInstalled()) {
    throw new Error(
      'Snap package manager is not installed.\n\n' +
      'On Ubuntu, Snap should be pre-installed. If not, install it with:\n' +
      '  sudo apt-get update && sudo apt-get install -y snapd\n' +
      '  sudo systemctl enable --now snapd.socket\n\n' +
      'Then log out and back in, and retry installing Spotify.'
    );
  }

  console.log('Installing Spotify via Snap...');
  console.log('This may take a few minutes...');

  // Install Spotify via Snap
  // Unlike Slack, Spotify does not require --classic confinement
  const result = await snap.install(SNAP_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Spotify via Snap.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure snapd is running: sudo systemctl start snapd\n` +
      `  2. Check architecture: uname -m (must be x86_64)\n` +
      `  3. Try manual installation: sudo snap install spotify`
    );
  }

  // Verify installation succeeded
  const verifyInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but Spotify was not found.\n\n' +
      'Please try:\n' +
      '  1. Run: snap list spotify\n' +
      '  2. Retry: sudo snap install spotify'
    );
  }

  console.log('Spotify installed successfully.');
  console.log('');
  console.log('To launch Spotify:');
  console.log('  - Run: spotify &');
  console.log('  - Or find Spotify in your application menu');
  console.log('');
  console.log('On first launch, you will be prompted to sign in with your');
  console.log('Spotify account credentials.');
  console.log('');
  console.log('NOTE: Spotify for Linux is not an officially supported platform.');
  console.log('Experience may differ from Windows and Mac clients.');
}

/**
 * Install Raspotify (Spotify Connect client) on Raspberry Pi OS.
 *
 * PLATFORM LIMITATION: Spotify does not provide native ARM packages. The official
 * Spotify desktop application and Snap package are only available for x86_64
 * architecture. Raspberry Pi devices use ARM processors.
 *
 * SOLUTION: This function installs Raspotify, an open-source Spotify Connect
 * client that turns your Raspberry Pi into a Spotify speaker. You control
 * playback from your phone, tablet, or computer, and audio plays through
 * the Raspberry Pi.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit or 32-bit)
 * - Raspberry Pi 3 or later (Raspberry Pi 4 or 5 recommended)
 * - sudo privileges
 * - Internet connectivity
 * - Spotify Premium account (required for Spotify Connect)
 *
 * @returns {Promise<void>}
 * @throws {Error} If Raspotify installation fails
 */
async function install_raspbian() {
  console.log('Checking if Raspotify is already installed...');

  // Check if Raspotify is already installed
  const raspotifyInstalled = await isRaspotifyInstalled();
  if (raspotifyInstalled) {
    console.log('Raspotify is already installed, skipping installation.');
    console.log('');
    console.log('To check Raspotify status:');
    console.log('  sudo systemctl status raspotify');
    return;
  }

  console.log('');
  console.log('NOTE: The native Spotify desktop app is not available for Raspberry Pi.');
  console.log('Installing Raspotify - a Spotify Connect client for Raspberry Pi.');
  console.log('');
  console.log('IMPORTANT: Raspotify requires a Spotify Premium account.');
  console.log('');

  // Ensure curl is installed for downloading the install script
  console.log('Ensuring curl is available...');
  const curlCheck = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl');
  if (curlCheck.code !== 0) {
    throw new Error(
      'Failed to install curl, which is required for Raspotify installation.\n' +
      `Output: ${curlCheck.stderr}\n\n` +
      'Please try:\n' +
      '  sudo apt-get update && sudo apt-get install -y curl'
    );
  }

  // Install Raspotify using the official install script
  // This script is maintained by the Raspotify project
  console.log('Installing Raspotify...');
  console.log('This may take a few minutes...');

  const installResult = await shell.exec('curl -sL https://dtcooper.github.io/raspotify/install.sh | sh');

  if (installResult.code !== 0) {
    throw new Error(
      'Failed to install Raspotify.\n' +
      `Output: ${installResult.stderr || installResult.stdout}\n\n` +
      'Troubleshooting:\n' +
      '  1. Check your internet connection\n' +
      '  2. Try manual installation:\n' +
      '     curl -sL https://dtcooper.github.io/raspotify/install.sh | sh\n' +
      '  3. Visit https://github.com/dtcooper/raspotify for documentation'
    );
  }

  // Verify installation by checking if the service exists
  const verifyInstalled = await isRaspotifyInstalled();
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but Raspotify service was not found.\n\n' +
      'Please try:\n' +
      '  1. Check: systemctl status raspotify\n' +
      '  2. Visit https://github.com/dtcooper/raspotify for manual installation'
    );
  }

  console.log('Raspotify installed successfully.');
  console.log('');
  console.log('Raspotify is now running as a service and will start on boot.');
  console.log('');
  console.log('To use Spotify Connect:');
  console.log('  1. Open Spotify on your phone, tablet, or computer');
  console.log('  2. Start playing music');
  console.log('  3. Tap the "Connect to a device" icon (speaker icon)');
  console.log('  4. Select your Raspberry Pi from the device list');
  console.log('  5. Audio will play through the Raspberry Pi speakers');
  console.log('');
  console.log('To configure Raspotify (device name, audio settings):');
  console.log('  sudo nano /etc/raspotify/conf');
  console.log('  sudo systemctl restart raspotify');
  console.log('');
  console.log('To check service status:');
  console.log('  sudo systemctl status raspotify');
}

/**
 * Install Spotify on Amazon Linux/RHEL using Snap via EPEL.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, RHEL 8/9, or Fedora (64-bit x86_64)
 * - sudo privileges
 * - Graphical desktop environment (required for Spotify GUI)
 * - EPEL repository enabled (for RHEL/Amazon Linux)
 * - At least 250 MB free disk space
 *
 * IMPORTANT: Amazon Linux EC2 instances typically run headless (no GUI).
 * If you are running a headless server, use the Spotify web player at
 * https://open.spotify.com instead.
 *
 * This function:
 * 1. Enables EPEL repository (if not already enabled)
 * 2. Installs snapd package manager
 * 3. Enables the snapd socket service
 * 4. Installs Spotify via Snap
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails on supported architecture
 */
async function install_amazon_linux() {
  console.log('Checking if Spotify is already installed...');

  // Check if Spotify is already installed via Snap
  if (snap.isInstalled()) {
    const isInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
    if (isInstalled) {
      console.log('Spotify is already installed, skipping installation.');
      return;
    }
  }

  // Also check if spotify command exists
  if (isSpotifyCommandAvailable()) {
    console.log('Spotify is already installed, skipping installation.');
    return;
  }

  // Verify architecture - Spotify only supports x86_64
  const archResult = await shell.exec('uname -m');
  const architecture = archResult.stdout.trim();
  if (architecture !== 'x86_64') {
    console.log(`Spotify is not available for ${architecture} architecture.`);
    console.log('');
    console.log('Spotify requires 64-bit x86_64 architecture for the native desktop app.');
    console.log('You can use the Spotify web player at https://open.spotify.com instead.');
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

  // Step 1: Enable EPEL repository and install snapd
  console.log('Setting up Snap package manager...');

  if (hasDnf) {
    // Amazon Linux 2023 or RHEL 8/9
    console.log('Installing EPEL repository and snapd...');

    // For Amazon Linux 2023, use EPEL 9
    // For RHEL, use the appropriate EPEL version
    const epelResult = await shell.exec(
      'sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm 2>/dev/null || true'
    );

    const snapdResult = await shell.exec('sudo dnf install -y snapd');
    if (snapdResult.code !== 0) {
      throw new Error(
        'Failed to install snapd.\n' +
        `Output: ${snapdResult.stderr}\n\n` +
        'Troubleshooting:\n' +
        '  1. Ensure EPEL repository is enabled\n' +
        '  2. Try: sudo dnf install epel-release && sudo dnf install snapd'
      );
    }
  } else {
    // Amazon Linux 2
    console.log('Installing EPEL and snapd via amazon-linux-extras...');

    const extrasCheck = shell.commandExists('amazon-linux-extras');
    if (extrasCheck) {
      await shell.exec('sudo amazon-linux-extras install -y epel');
    }

    const snapdResult = await shell.exec('sudo yum install -y snapd');
    if (snapdResult.code !== 0) {
      throw new Error(
        'Failed to install snapd.\n' +
        `Output: ${snapdResult.stderr}\n\n` +
        'Troubleshooting:\n' +
        '  1. Enable EPEL: sudo amazon-linux-extras install epel\n' +
        '  2. Then: sudo yum install snapd'
      );
    }
  }

  // Step 2: Enable and start snapd socket
  console.log('Enabling snapd service...');
  const enableResult = await shell.exec('sudo systemctl enable --now snapd.socket');
  if (enableResult.code !== 0) {
    console.log('Warning: Could not enable snapd.socket automatically.');
  }

  // Create symbolic link for classic snap support
  await shell.exec('sudo ln -sf /var/lib/snapd/snap /snap');

  // Wait a moment for snapd to initialize
  console.log('Waiting for snapd to initialize...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 3: Install Spotify via Snap
  console.log('Installing Spotify via Snap...');
  console.log('This may take a few minutes...');

  const installResult = await shell.exec('sudo snap install spotify');

  if (installResult.code !== 0) {
    throw new Error(
      'Failed to install Spotify via Snap.\n' +
      `Output: ${installResult.stderr || installResult.stdout}\n\n` +
      'Troubleshooting:\n' +
      '  1. Ensure snapd is running: sudo systemctl start snapd\n' +
      '  2. You may need to log out and back in after enabling snapd\n' +
      '  3. Try: sudo snap install spotify'
    );
  }

  // Verify installation
  const verifyInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (!verifyInstalled) {
    // Snap might not be fully in PATH yet
    console.log('');
    console.log('Spotify installation completed.');
    console.log('');
    console.log('IMPORTANT: You may need to log out and log back in for the');
    console.log('snap command to become available in your PATH.');
    console.log('');
    console.log('After logging back in:');
    console.log('  - Run: spotify &');
    console.log('  - Or find Spotify in your application menu');
    return;
  }

  console.log('Spotify installed successfully.');
  console.log('');
  console.log('To launch Spotify:');
  console.log('  - Run: spotify &');
  console.log('  - Or find Spotify in your application menu');
  console.log('');
  console.log('NOTE: Spotify requires a graphical desktop environment.');
  console.log('If running on a headless server, use the web player at:');
  console.log('  https://open.spotify.com');
}

/**
 * Install Spotify on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 1903 or later, or Windows 11 (64-bit)
 * - At least 500 MB free disk space
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * The installation uses Chocolatey's 'spotify' package which downloads and
 * installs the official Spotify desktop application.
 *
 * NOTE: After installation, Spotify can be launched from the Start Menu or
 * via the 'spotify:' protocol handler.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Spotify is already installed...');

  // Check if Spotify is already installed via Chocolatey
  const isInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (isInstalled) {
    console.log('Spotify is already installed, skipping installation.');
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
      'Then retry installing Spotify.'
    );
  }

  console.log('Installing Spotify via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install Spotify using Chocolatey
  // The -y flag automatically confirms all prompts
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Spotify via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Run 'choco list spotify' to check availability\n` +
      `  3. Try manual installation: choco install spotify -y --force`
    );
  }

  // Verify installation
  const verifyInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but Spotify was not found.\n\n' +
      'Please try:\n' +
      '  1. Run: choco list spotify\n' +
      '  2. Retry: choco install spotify -y'
    );
  }

  console.log('Spotify installed successfully.');
  console.log('');
  console.log('To launch Spotify:');
  console.log('  - Open from Start Menu, or');
  console.log('  - Run: Start-Process spotify:');
  console.log('');
  console.log('On first launch, you will be prompted to sign in with your');
  console.log('Spotify account credentials.');
}

/**
 * Install Spotify when running from Ubuntu on WSL (Windows Subsystem for Linux).
 *
 * PLATFORM APPROACH: Spotify is installed on the Windows host and accessed from
 * WSL. While WSL with WSLg can technically run Linux GUI applications, the
 * recommended approach is to install Spotify on Windows and launch it from WSL
 * using Windows interoperability.
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - Chocolatey installed on Windows for Spotify installation
 *
 * This function installs Spotify on the Windows host via PowerShell/Chocolatey,
 * then provides instructions for launching it from within WSL.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation on Windows host fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Installing Spotify on the Windows host...');
  console.log('');

  // Check if Spotify is already available on Windows host
  const spotifyCheck = await shell.exec('cmd.exe /c "choco list spotify --local-only" 2>/dev/null');
  if (spotifyCheck.code === 0 && spotifyCheck.stdout.toLowerCase().includes('spotify')) {
    console.log('Spotify is already installed on Windows, skipping installation.');
    console.log('');
    console.log('To launch Spotify from WSL:');
    console.log('  cmd.exe /c start spotify:');
    return;
  }

  console.log('Installing Spotify via Chocolatey on Windows...');
  console.log('This may take a few minutes...');

  // Install via PowerShell using Chocolatey on the Windows host
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install spotify -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Spotify on Windows host.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Open an Administrator PowerShell on Windows and run:\n` +
      `     choco install spotify -y\n` +
      `  3. Then launch from WSL with: cmd.exe /c start spotify:`
    );
  }

  console.log('Spotify installed successfully on Windows.');
  console.log('');
  console.log('To launch Spotify from WSL:');
  console.log('  cmd.exe /c start spotify:');
  console.log('');
  console.log('Alternative - open Spotify web in browser:');
  console.log('  cmd.exe /c start https://open.spotify.com');
  console.log('');
  console.log('TIP: Add an alias to ~/.bashrc for convenience:');
  console.log('  echo \'alias spotify="cmd.exe /c start spotify:"\' >> ~/.bashrc');
}

/**
 * Install Spotify from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Spotify on the
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
  console.log('Installing Spotify on the Windows host...');
  console.log('');

  // Check if Spotify is already installed
  const spotifyCheck = await shell.exec('choco list spotify --local-only 2>/dev/null');
  if (spotifyCheck.code === 0 && spotifyCheck.stdout.toLowerCase().includes('spotify')) {
    console.log('Spotify is already installed, skipping installation.');
    console.log('');
    console.log('To launch Spotify:');
    console.log('  start spotify:');
    return;
  }

  console.log('Installing Spotify via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install via PowerShell using Chocolatey
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install spotify -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Spotify.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell:\n` +
      `     choco install spotify -y`
    );
  }

  console.log('Spotify installed successfully.');
  console.log('');
  console.log('To launch Spotify from Git Bash:');
  console.log('  start spotify:');
  console.log('');
  console.log('Or use the explicit Windows command:');
  console.log('  cmd //c "start spotify:"');
}

/**
 * Check if Spotify is installed on the current platform.
 *
 * This function performs platform-specific checks to determine if Spotify
 * is already installed on the system.
 *
 * @returns {Promise<boolean>} True if Spotify is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    return isSpotifyInstalledMacOS();
  }

  if (platform.type === 'windows' || platform.type === 'gitbash') {
    return choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  }

  if (['ubuntu', 'debian', 'wsl'].includes(platform.type)) {
    return snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  }

  if (platform.type === 'raspbian') {
    return isRaspotifyInstalled();
  }

  // For Amazon Linux and other platforms, check for command
  return isSpotifyCommandAvailable();
}

/**
 * Check if this installer is supported on the current platform.
 * Spotify is available on all major platforms.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Spotify Desktop via Homebrew cask
 * - Ubuntu/Debian: Spotify Desktop via Snap (x86_64 only)
 * - Raspberry Pi OS: Raspotify (Spotify Connect client)
 * - Amazon Linux/RHEL: Spotify Desktop via Snap (x86_64 only)
 * - Windows: Spotify Desktop via Chocolatey
 * - WSL (Ubuntu): Installs Spotify on Windows host
 * - Git Bash: Installs Spotify on Windows host
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
    console.log(`Spotify is not available for ${platform.type}.`);
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

// Allow direct execution: node spotify.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
