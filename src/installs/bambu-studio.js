#!/usr/bin/env node

/**
 * @fileoverview Install Bambu Studio - a feature-rich 3D printing slicer software.
 * @module installs/bambu-studio
 *
 * Bambu Studio is an open-source 3D printing slicer developed by Bambu Lab.
 * It converts 3D model files (STL, OBJ, 3MF, AMF) into G-code for 3D printers.
 * Built upon PrusaSlicer, it provides project-based workflows, optimized slicing,
 * and native AMS (Automatic Material System) integration for multi-color printing.
 *
 * IMPORTANT: Bambu Studio is a GUI application. It requires a desktop environment
 * with OpenGL 2.0+ support and will not work on headless servers.
 *
 * Supported platforms:
 * - macOS: Homebrew cask (brew install --cask bambu-studio)
 * - Ubuntu/Debian: Flatpak from Flathub (com.bambulab.BambuStudio)
 * - Raspberry Pi OS: Pi-Apps (64-bit only, requires aarch64)
 * - Amazon Linux/RHEL: Flatpak from Flathub (not officially supported)
 * - Windows: Chocolatey (choco install bambustudio)
 * - WSL: Flatpak with WSLg for GUI support
 * - Git Bash: Uses Windows Chocolatey
 */

const fs = require('fs');
const path = require('path');
const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const choco = require('../utils/windows/choco');
const macosApps = require('../utils/macos/apps');

/**
 * Whether this installer requires a desktop environment to function.
 * Bambu Studio is a GUI 3D printing slicer requiring OpenGL 2.0+.
 */
const REQUIRES_DESKTOP = true;

/**
 * The macOS application bundle name for Bambu Studio.
 * Used to verify installation via the standard /Applications directory.
 */
const MACOS_APP_NAME = 'BambuStudio';

/**
 * The Homebrew cask name for Bambu Studio.
 */
const HOMEBREW_CASK_NAME = 'bambu-studio';

/**
 * The Flatpak application ID for Bambu Studio on Flathub.
 * Note: AppImage is now preferred over Flatpak for Linux installations.
 */
const FLATPAK_APP_ID = 'com.bambulab.BambuStudio';

/**
 * The GitHub repository for Bambu Studio releases.
 */
const GITHUB_REPO = 'bambulab/BambuStudio';

/**
 * The installation directory for AppImage executables.
 */
const APPIMAGE_INSTALL_DIR = '/usr/local/bin';

/**
 * The desktop entry installation directory.
 */
const DESKTOP_ENTRY_DIR = '/usr/share/applications';

/**
 * The Chocolatey package name for Bambu Studio on Windows.
 */
const CHOCOLATEY_PACKAGE_NAME = 'bambustudio';

/**
 * The Windows installation path for Bambu Studio.
 */
const WINDOWS_INSTALL_PATH = 'C:\\Program Files\\Bambu Studio\\bambu-studio.exe';

/**
 * Checks if Bambu Studio is already installed on macOS.
 * Looks for the BambuStudio.app bundle in /Applications.
 *
 * @returns {boolean} True if Bambu Studio is installed on macOS
 */
function isInstalledOnMacOS() {
  return macosApps.isAppInstalled(MACOS_APP_NAME);
}

/**
 * Checks if Bambu Studio AppImage is installed in the system.
 * Looks for the executable in common installation paths.
 *
 * @returns {boolean} True if Bambu Studio AppImage is installed
 */
function isAppImageInstalled() {
  // Check common installation paths
  const commonPaths = [
    '/usr/local/bin/bambu-studio',
    '/usr/local/bin/BambuStudio',
    '/opt/bambu-studio/bambu-studio'
  ];

  for (const path of commonPaths) {
    if (fs.existsSync(path)) {
      return true;
    }
  }

  // Check if bambu-studio or BambuStudio command exists in PATH
  return shell.commandExists('bambu-studio') || shell.commandExists('BambuStudio');
}

/**
 * Checks if Flatpak is available on the system.
 * Flatpak is required for Linux installations (Ubuntu, WSL, Amazon Linux).
 *
 * @returns {boolean} True if the flatpak command exists in PATH
 */
function isFlatpakAvailable() {
  return shell.commandExists('flatpak');
}

/**
 * Checks if Bambu Studio is installed via Flatpak.
 * Queries the Flatpak list for the Bambu Studio application ID.
 * Checks both system-level and user-level installations.
 *
 * @returns {Promise<boolean>} True if Bambu Studio is installed via Flatpak
 */
async function isInstalledViaFlatpak() {
  if (!isFlatpakAvailable()) {
    return false;
  }

  // Check system-level installation
  let result = await shell.exec(`flatpak list --app | grep -i "${FLATPAK_APP_ID}"`);
  if (result.code === 0 && result.stdout.includes(FLATPAK_APP_ID)) {
    return true;
  }

  // Check user-level installation
  result = await shell.exec(`flatpak list --app --user | grep -i "${FLATPAK_APP_ID}"`);
  return result.code === 0 && result.stdout.includes(FLATPAK_APP_ID);
}

/**
 * Checks if Bambu Studio is already installed on Windows.
 * Looks for the executable in the standard Program Files location.
 *
 * @returns {Promise<boolean>} True if Bambu Studio is installed on Windows
 */
async function isInstalledOnWindows() {
  // Check if the executable exists at the expected location
  const result = await shell.exec(`powershell -NoProfile -Command "Test-Path '${WINDOWS_INSTALL_PATH}'"`);
  return result.stdout.trim().toLowerCase() === 'true';
}

/**
 * Checks if Bambu Studio is installed on Raspberry Pi via Pi-Apps.
 * Pi-Apps installs Bambu Studio to a local binary location.
 *
 * @returns {Promise<boolean>} True if Bambu Studio is installed
 */
async function isInstalledOnRaspbian() {
  // Check for the bambu-studio command in PATH
  if (shell.commandExists('bambu-studio')) {
    return true;
  }

  // Check for desktop file created by Pi-Apps
  const homeDir = os.getHomeDir();
  const desktopFilePath = path.join(homeDir, '.local', 'share', 'applications');

  try {
    const files = fs.readdirSync(desktopFilePath);
    for (const file of files) {
      if (file.toLowerCase().includes('bambu')) {
        return true;
      }
    }
  } catch {
    // Directory doesn't exist or can't be read - not installed
  }

  return false;
}

/**
 * Gets the latest AppImage download URL from GitHub releases.
 * Detects the system architecture and chooses the appropriate AppImage variant.
 *
 * @returns {Promise<{url: string, filename: string} | null>} Download URL and filename, or null if not found
 */
async function getLatestAppImageUrl() {
  try {
    // Fetch the latest release info from GitHub API
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
    const result = await shell.exec(`curl -s "${apiUrl}"`);

    if (result.code !== 0 || !result.stdout) {
      console.error('Failed to fetch latest release information from GitHub.');
      return null;
    }

    const release = JSON.parse(result.stdout);
    const assets = release.assets || [];

    // Determine which AppImage to download based on Ubuntu version or distribution
    // Prefer ubuntu-22.04 for broader compatibility, unless on a newer system
    let preferredVariant = 'ubuntu-22.04';

    // Check if running Ubuntu 24.04 or newer
    if (fs.existsSync('/etc/os-release')) {
      const osReleaseResult = await shell.exec('cat /etc/os-release | grep VERSION_ID');
      if (osReleaseResult.code === 0 && osReleaseResult.stdout.includes('24.04')) {
        preferredVariant = 'ubuntu-24.04';
      }
    }

    // Look for AppImage assets (prioritize preferred variant, then Fedora, then any Ubuntu)
    let selectedAsset = null;

    // First try: preferred Ubuntu variant
    selectedAsset = assets.find(asset =>
      asset.name.endsWith('.AppImage') &&
      asset.name.includes(preferredVariant)
    );

    // Second try: Fedora variant (good for RHEL-based systems)
    if (!selectedAsset) {
      selectedAsset = assets.find(asset =>
        asset.name.endsWith('.AppImage') &&
        asset.name.includes('fedora')
      );
    }

    // Third try: any Ubuntu variant
    if (!selectedAsset) {
      selectedAsset = assets.find(asset =>
        asset.name.endsWith('.AppImage') &&
        asset.name.includes('ubuntu')
      );
    }

    // Last resort: any AppImage
    if (!selectedAsset) {
      selectedAsset = assets.find(asset => asset.name.endsWith('.AppImage'));
    }

    if (!selectedAsset) {
      console.error('No AppImage found in the latest release.');
      return null;
    }

    return {
      url: selectedAsset.browser_download_url,
      filename: selectedAsset.name
    };
  } catch (error) {
    console.error('Error fetching AppImage URL:', error.message);
    return null;
  }
}

/**
 * Creates a desktop entry file for Bambu Studio AppImage.
 * This allows the application to appear in desktop menus.
 *
 * @param {string} execPath - The full path to the AppImage executable
 * @returns {Promise<boolean>} True if desktop entry was created successfully
 */
async function createDesktopEntry(execPath) {
  const desktopEntry = `[Desktop Entry]
Name=Bambu Studio
Comment=3D printing slicer for Bambu Lab printers
Exec=${execPath}
Icon=bambu-studio
Terminal=false
Type=Application
Categories=Graphics;3DGraphics;Engineering;
MimeType=model/stl;application/x-3mf;model/x.stl-binary;model/x.stl-ascii;application/sla;
`;

  const desktopFilePath = path.join(DESKTOP_ENTRY_DIR, 'bambu-studio.desktop');

  try {
    // Create desktop entry directory if it doesn't exist
    await shell.exec(`sudo mkdir -p ${DESKTOP_ENTRY_DIR}`);

    // Write desktop entry file
    const tempFile = `/tmp/bambu-studio.desktop`;
    fs.writeFileSync(tempFile, desktopEntry);

    const copyResult = await shell.exec(`sudo mv ${tempFile} ${desktopFilePath}`);
    if (copyResult.code !== 0) {
      console.error('Failed to create desktop entry:', copyResult.stderr);
      return false;
    }

    // Make desktop entry executable
    await shell.exec(`sudo chmod 644 ${desktopFilePath}`);

    // Update desktop database
    await shell.exec('sudo update-desktop-database 2>/dev/null || true');

    return true;
  } catch (error) {
    console.error('Error creating desktop entry:', error.message);
    return false;
  }
}

/**
 * Downloads and installs Bambu Studio AppImage.
 * AppImages are self-contained executables that work across Linux distributions.
 *
 * @returns {Promise<boolean>} True if installation succeeded
 */
async function installAppImage() {
  console.log('Fetching latest Bambu Studio AppImage from GitHub...');

  // Get the download URL
  const downloadInfo = await getLatestAppImageUrl();
  if (!downloadInfo) {
    console.error('Could not determine AppImage download URL.');
    return false;
  }

  console.log(`Found AppImage: ${downloadInfo.filename}`);
  console.log('Downloading Bambu Studio AppImage...');
  console.log('Note: This may take several minutes depending on your connection.');

  // Download the AppImage to /tmp
  const tempPath = `/tmp/${downloadInfo.filename}`;
  const downloadResult = await shell.exec(`curl -L -o "${tempPath}" "${downloadInfo.url}"`);

  if (downloadResult.code !== 0) {
    console.error('Failed to download AppImage:', downloadResult.stderr);
    return false;
  }

  console.log('AppImage downloaded successfully.');

  // Make the AppImage executable
  console.log('Installing AppImage...');
  const chmodResult = await shell.exec(`chmod +x "${tempPath}"`);
  if (chmodResult.code !== 0) {
    console.error('Failed to make AppImage executable:', chmodResult.stderr);
    return false;
  }

  // Install to /usr/local/bin with a simplified name
  const installPath = `${APPIMAGE_INSTALL_DIR}/bambu-studio`;
  const installResult = await shell.exec(`sudo mv "${tempPath}" "${installPath}"`);

  if (installResult.code !== 0) {
    console.error('Failed to install AppImage:', installResult.stderr);
    return false;
  }

  console.log(`Bambu Studio installed to ${installPath}`);

  // Create desktop entry
  console.log('Creating desktop entry...');
  const desktopCreated = await createDesktopEntry(installPath);
  if (!desktopCreated) {
    console.log('Warning: Desktop entry creation failed. You can still launch from command line.');
  }

  return true;
}

/**
 * Installs Flatpak if not already present on a Debian-based system.
 * This is a prerequisite for installing Bambu Studio on Linux via Flatpak.
 *
 * @returns {Promise<boolean>} True if Flatpak is available after this function
 */
async function ensureFlatpakInstalled() {
  if (isFlatpakAvailable()) {
    return true;
  }

  console.log('Flatpak is not installed. Installing Flatpak...');

  // Update apt cache first
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.error('Failed to update apt cache:', updateResult.stderr);
    return false;
  }

  // Install Flatpak
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y flatpak');
  if (installResult.code !== 0) {
    console.error('Failed to install Flatpak:', installResult.stderr);
    return false;
  }

  console.log('Flatpak installed successfully.');
  return true;
}

/**
 * Checks if the system has a display environment (not headless).
 * Flatpak requires a display environment and D-Bus to function properly.
 *
 * @returns {boolean} True if a display environment is detected
 */
function hasDisplayEnvironment() {
  // Check for common display environment variables
  const hasDisplay = process.env.DISPLAY ||
                     process.env.WAYLAND_DISPLAY ||
                     process.env.XDG_CURRENT_DESKTOP;
  return Boolean(hasDisplay);
}

/**
 * Adds the Flathub repository if not already configured.
 * Flathub is the source for the Bambu Studio Flatpak package.
 *
 * Tries system-level installation first, falls back to user-level if system bus unavailable.
 * This enables installation in Docker/containerized environments with limited D-Bus access.
 *
 * @returns {Promise<{success: boolean, userLevel: boolean}>} Result object with success status and whether user-level was used
 */
async function ensureFlathubConfigured() {
  // Check if Flathub is already configured (system-level)
  let checkResult = await shell.exec('flatpak remote-list | grep -i flathub');
  if (checkResult.code === 0 && checkResult.stdout.includes('flathub')) {
    return { success: true, userLevel: false };
  }

  // Check if Flathub is already configured (user-level)
  checkResult = await shell.exec('flatpak remote-list --user | grep -i flathub');
  if (checkResult.code === 0 && checkResult.stdout.includes('flathub')) {
    return { success: true, userLevel: true };
  }

  console.log('Adding Flathub repository...');

  // Try system-level first (preferred for desktop systems)
  let addResult = await shell.exec(
    'flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo'
  );

  if (addResult.code === 0) {
    console.log('Flathub repository added successfully.');
    return { success: true, userLevel: false };
  }

  // If system-level fails due to D-Bus issues, try user-level installation
  if (addResult.stderr.includes('system bus') || addResult.stderr.includes('D-Bus')) {
    console.log('System-level Flatpak unavailable (no system D-Bus). Trying user-level installation...');

    addResult = await shell.exec(
      'flatpak remote-add --if-not-exists --user flathub https://dl.flathub.org/repo/flathub.flatpakrepo'
    );

    if (addResult.code === 0) {
      console.log('Flathub repository added successfully (user-level).');
      return { success: true, userLevel: true };
    }
  }

  // Both system and user-level failed
  console.error('Failed to add Flathub repository:', addResult.stderr);
  console.log('');
  console.log('Troubleshooting:');
  console.log('  1. Ensure D-Bus is running (for GUI applications)');
  console.log('  2. Try manually: flatpak remote-add --user flathub https://dl.flathub.org/repo/flathub.flatpakrepo');
  console.log('  3. If in Docker, ensure the container has proper D-Bus configuration');

  return { success: false, userLevel: false };
}

/**
 * Installs Flatpak if not already present on Amazon Linux/RHEL.
 * Uses dnf as the package manager.
 *
 * @returns {Promise<boolean>} True if Flatpak is available after this function
 */
async function ensureFlatpakInstalledRHEL() {
  if (isFlatpakAvailable()) {
    return true;
  }

  console.log('Flatpak is not installed. Installing Flatpak...');

  // Determine which package manager to use (dnf preferred over yum)
  const packageManager = shell.commandExists('dnf') ? 'dnf' : 'yum';

  const installResult = await shell.exec(`sudo ${packageManager} install -y flatpak`);
  if (installResult.code !== 0) {
    console.error('Failed to install Flatpak:', installResult.stderr);
    return false;
  }

  console.log('Flatpak installed successfully.');
  return true;
}

/**
 * Install Bambu Studio on macOS using Homebrew Cask.
 *
 * Prerequisites:
 * - macOS 11 (Big Sur) or later
 * - Homebrew package manager installed
 * - Terminal access
 *
 * The installation uses `brew install --cask bambu-studio` which downloads
 * and installs the application to /Applications/BambuStudio.app.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first:');
    console.log('  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    return;
  }

  // Check if already installed (idempotency check)
  if (isInstalledOnMacOS()) {
    console.log('Bambu Studio is already installed.');
    return;
  }

  console.log('Installing Bambu Studio via Homebrew Cask...');

  // Install using the brew cask command
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    console.error('Failed to install Bambu Studio:', result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "brew update" and retry');
    console.log('  2. If macOS blocks the app, go to System Settings > Privacy & Security');
    console.log('     and click "Open Anyway"');
    return;
  }

  // Verify installation succeeded
  if (isInstalledOnMacOS()) {
    console.log('Bambu Studio installed successfully.');
    console.log('Location: /Applications/BambuStudio.app');
    console.log('');
    console.log('Launch with: open /Applications/BambuStudio.app');
  } else {
    console.error('Installation completed but Bambu Studio was not found in /Applications.');
  }
}

/**
 * Install Bambu Studio on Ubuntu/Debian using AppImage from GitHub.
 *
 * IMPORTANT: AppImage is now the preferred installation method for Linux.
 * AppImages are self-contained executables that work in Docker containers
 * and don't require user namespaces or D-Bus configuration.
 *
 * Prerequisites:
 * - Ubuntu 20.04+ or Debian 11+ (64-bit)
 * - X11 or Wayland display server (for GUI applications)
 * - sudo privileges
 * - curl installed
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if already installed via AppImage (idempotency check)
  if (isAppImageInstalled()) {
    console.log('Bambu Studio is already installed.');
    return;
  }

  // Check for display environment before proceeding (Bambu Studio requires GUI)
  if (!hasDisplayEnvironment()) {
    console.log('Bambu Studio is a GUI application and requires a desktop environment.');
    console.log('No display environment detected (DISPLAY, WAYLAND_DISPLAY, or XDG_CURRENT_DESKTOP).');
    console.log('');
    console.log('This application cannot be installed on:');
    console.log('  - Headless servers');
    console.log('  - Docker containers without display forwarding');
    console.log('  - SSH sessions without X11 forwarding');
    console.log('');
    console.log('Please run this installer on a system with a desktop environment.');
    return;
  }

  // Install using AppImage
  console.log('Installing Bambu Studio via AppImage from GitHub...');
  const success = await installAppImage();

  if (!success) {
    console.error('Failed to install Bambu Studio AppImage.');
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure curl is installed: sudo apt-get install -y curl');
    console.log('  2. Check your internet connection');
    console.log('  3. Visit https://github.com/bambulab/BambuStudio/releases for manual download');
    return;
  }

  // Verify installation succeeded
  if (isAppImageInstalled()) {
    console.log('');
    console.log('Bambu Studio installed successfully.');
    console.log('');
    console.log('Launch with: bambu-studio');
    console.log('Location: /usr/local/bin/bambu-studio');
  } else {
    console.error('Installation completed but Bambu Studio was not found.');
  }
}

/**
 * Install Bambu Studio on Raspberry Pi OS using Pi-Apps.
 *
 * IMPORTANT: Bambu Studio requires 64-bit Raspberry Pi OS (aarch64).
 * It will NOT work on 32-bit (armv7l) installations.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit only) - Bookworm or later recommended
 * - Raspberry Pi 3B+ or later (64-bit capable hardware)
 * - Desktop environment (GUI required)
 * - Pi-Apps package manager (installed automatically if missing)
 *
 * NOTE: The Pi-Apps installation compiles from source on ARM, which can
 * take significant time and system resources.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if already installed (idempotency check)
  const alreadyInstalled = await isInstalledOnRaspbian();
  if (alreadyInstalled) {
    console.log('Bambu Studio is already installed.');
    return;
  }

  // Verify we are running on 64-bit Raspberry Pi OS
  // Bambu Studio ARM builds only support aarch64 architecture
  const archResult = await shell.exec('uname -m');
  const architecture = archResult.stdout.trim();

  if (architecture !== 'aarch64') {
    console.log('Bambu Studio requires 64-bit Raspberry Pi OS (aarch64).');
    console.log(`Current architecture: ${architecture}`);
    console.log('');
    console.log('Please install 64-bit Raspberry Pi OS from:');
    console.log('  https://www.raspberrypi.com/software/operating-systems/');
    return;
  }

  // Check if Pi-Apps is already installed
  const homeDir = os.getHomeDir();
  const piAppsPath = path.join(homeDir, 'pi-apps', 'manage');
  const piAppsInstalled = fs.existsSync(piAppsPath);

  if (!piAppsInstalled) {
    console.log('Installing Pi-Apps (required for Bambu Studio on Raspberry Pi)...');

    // Install Pi-Apps from the official repository
    const piAppsResult = await shell.exec(
      'wget -qO- https://raw.githubusercontent.com/Botspot/pi-apps/master/install | bash'
    );

    if (piAppsResult.code !== 0) {
      console.error('Failed to install Pi-Apps:', piAppsResult.stderr);
      console.log('');
      console.log('You may need to install required dependencies first:');
      console.log('  sudo apt-get update && sudo apt-get install -y yad curl wget');
      return;
    }

    console.log('Pi-Apps installed successfully.');
  }

  console.log('Installing Bambu Studio via Pi-Apps...');
  console.log('Note: This may take a significant amount of time on Raspberry Pi hardware.');

  // Install Bambu Studio using Pi-Apps CLI
  // The app name in Pi-Apps is "Bambu Studio" (with space, case-sensitive)
  const installResult = await shell.exec(`"${piAppsPath}" install "Bambu Studio"`);

  if (installResult.code !== 0) {
    console.error('Failed to install Bambu Studio via Pi-Apps:', installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. If you run out of memory, increase swap space:');
    console.log('     sudo dphys-swapfile swapoff');
    console.log('     sudo sed -i "s/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/" /etc/dphys-swapfile');
    console.log('     sudo dphys-swapfile setup');
    console.log('     sudo dphys-swapfile swapon');
    console.log('  2. Ensure you have at least 4GB RAM (Raspberry Pi 4/5 recommended)');
    return;
  }

  // Verify installation succeeded
  const verifyInstalled = await isInstalledOnRaspbian();
  if (verifyInstalled) {
    console.log('Bambu Studio installed successfully.');
    console.log('');
    console.log('Launch from the desktop menu under Engineering, or via: bambu-studio');
  } else {
    console.error('Installation completed but Bambu Studio was not found.');
  }
}

/**
 * Install Bambu Studio on Amazon Linux/RHEL using AppImage.
 *
 * IMPORTANT: Amazon Linux is primarily a server OS without a desktop environment.
 * Bambu Studio is a GUI application and requires a display. This platform is
 * NOT recommended for Bambu Studio usage.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, RHEL 8+, or Fedora 35+
 * - Desktop environment with X11/Wayland support
 * - sudo privileges
 * - curl installed
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if already installed via AppImage (idempotency check)
  if (isAppImageInstalled()) {
    console.log('Bambu Studio is already installed.');
    return;
  }

  console.log('Note: Amazon Linux is primarily a server OS. Bambu Studio requires');
  console.log('a desktop environment with display capabilities.');
  console.log('');

  // Check for display environment before proceeding (Bambu Studio requires GUI)
  if (!hasDisplayEnvironment()) {
    console.log('Bambu Studio is a GUI application and requires a desktop environment.');
    console.log('No display environment detected (DISPLAY, WAYLAND_DISPLAY, or XDG_CURRENT_DESKTOP).');
    console.log('');
    console.log('This application cannot be installed on:');
    console.log('  - Headless servers');
    console.log('  - Docker containers without display forwarding');
    console.log('  - SSH sessions without X11 forwarding');
    console.log('');
    console.log('Please run this installer on a system with a desktop environment.');
    return;
  }

  // Install using AppImage
  console.log('Installing Bambu Studio via AppImage from GitHub...');
  const success = await installAppImage();

  if (!success) {
    console.error('Failed to install Bambu Studio AppImage.');
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure curl is installed: sudo dnf install -y curl');
    console.log('  2. Check your internet connection');
    console.log('  3. Ensure you have a desktop environment installed:');
    console.log('     sudo dnf groupinstall -y "GNOME Desktop Environment"');
    console.log('  4. Visit https://github.com/bambulab/BambuStudio/releases for manual download');
    return;
  }

  // Verify installation succeeded
  if (isAppImageInstalled()) {
    console.log('');
    console.log('Bambu Studio installed successfully.');
    console.log('');
    console.log('Launch with: bambu-studio');
    console.log('Location: /usr/local/bin/bambu-studio');
  } else {
    console.error('Installation completed but Bambu Studio was not found.');
  }
}

/**
 * Install Bambu Studio on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Chocolatey package manager installed
 * - Administrator PowerShell or Command Prompt
 *
 * NOTE: The Chocolatey package depends on vcredist140 (Visual C++ Redistributable),
 * which will be installed automatically if not present.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if already installed (idempotency check)
  const alreadyInstalled = await isInstalledOnWindows();
  if (alreadyInstalled) {
    console.log('Bambu Studio is already installed.');
    return;
  }

  // Check if Chocolatey is available
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first:');
    console.log('');
    console.log('Run this command in an Administrator PowerShell:');
    console.log('  Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))');
    return;
  }

  console.log('Installing Bambu Studio via Chocolatey...');

  // Install using Chocolatey
  // The -y flag automatically confirms the installation
  const result = await choco.install(CHOCOLATEY_PACKAGE_NAME);

  if (!result.success) {
    console.error('Failed to install Bambu Studio:', result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you are running as Administrator');
    console.log('  2. If Visual C++ Redistributable fails, install it manually:');
    console.log('     choco install vcredist140 -y');
    console.log('  3. Update graphics drivers for OpenGL 2.0+ support');
    return;
  }

  // Verify installation succeeded
  const verifyInstalled = await isInstalledOnWindows();
  if (verifyInstalled) {
    console.log('Bambu Studio installed successfully.');
    console.log('Location: C:\\Program Files\\Bambu Studio\\bambu-studio.exe');
    console.log('');
    console.log('Launch from the Start Menu or via:');
    console.log('  Start-Process "C:\\Program Files\\Bambu Studio\\bambu-studio.exe"');
  } else {
    console.error('Installation completed but Bambu Studio was not found.');
    console.log('You may need to close and reopen your terminal for PATH updates.');
  }
}

/**
 * Install Bambu Studio on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Uses Flatpak with WSLg for GUI support. WSLg enables Linux GUI applications
 * to run with native Windows integration, appearing as regular Windows windows.
 *
 * Prerequisites:
 * - Windows 10 Build 19044+ or Windows 11
 * - WSL 2 with Ubuntu installed
 * - WSLg enabled (default on Windows 11 and recent Windows 10 updates)
 * - GPU drivers installed on Windows host
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // Check if already installed via Flatpak (idempotency check)
  const alreadyInstalled = await isInstalledViaFlatpak();
  if (alreadyInstalled) {
    console.log('Bambu Studio is already installed.');
    return;
  }

  console.log('Note: Bambu Studio in WSL requires WSLg for GUI support.');
  console.log('If you encounter display issues, run "wsl --update" from Windows PowerShell.');
  console.log('');

  // Check for display environment before proceeding (Bambu Studio requires GUI)
  if (!hasDisplayEnvironment()) {
    console.log('Bambu Studio is a GUI application and requires a desktop environment.');
    console.log('No display environment detected (DISPLAY, WAYLAND_DISPLAY, or XDG_CURRENT_DESKTOP).');
    console.log('');
    console.log('WSLg is required for GUI applications in WSL. Ensure:');
    console.log('  1. You are running Windows 10 Build 19044+ or Windows 11');
    console.log('  2. WSL is up to date: wsl --update (from Windows PowerShell)');
    console.log('  3. WSL 2 is being used: wsl --set-default-version 2');
    console.log('');
    console.log('After updating WSL, restart your WSL session and try again.');
    return;
  }

  // Ensure Flatpak is installed
  const flatpakReady = await ensureFlatpakInstalled();
  if (!flatpakReady) {
    console.error('Could not install Flatpak. Please install it manually:');
    console.log('  sudo apt-get update && sudo apt-get install -y flatpak');
    return;
  }

  // Ensure Flathub repository is configured
  const flathubResult = await ensureFlathubConfigured();
  if (!flathubResult.success) {
    console.error('Could not configure Flathub repository. Please add it manually:');
    console.log('  flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo');
    return;
  }

  console.log('Installing Bambu Studio via Flatpak...');
  console.log('Note: This may take several minutes on first install.');

  // Install Bambu Studio from Flathub
  // Use --user flag if we're using user-level Flatpak (no system D-Bus)
  const userFlag = flathubResult.userLevel ? '--user' : '';
  const installResult = await shell.exec(`flatpak install -y ${userFlag} flathub ${FLATPAK_APP_ID}`);

  if (installResult.code !== 0) {
    console.error('Failed to install Bambu Studio:', installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Restart WSL: wsl --shutdown (from Windows PowerShell)');
    console.log('  2. Update WSL: wsl --update (from Windows PowerShell)');
    console.log('  3. If network issues, try:');
    console.log('     wsl --shutdown && netsh winsock reset (Admin PowerShell)');
    return;
  }

  // Verify installation succeeded
  const verifyInstalled = await isInstalledViaFlatpak();
  if (verifyInstalled) {
    console.log('Bambu Studio installed successfully.');
    console.log('');
    console.log('Launch with: flatpak run com.bambulab.BambuStudio');
    console.log('');
    console.log('If the application window does not appear:');
    console.log('  1. Verify WSLg is enabled: wsl --version (from Windows PowerShell)');
    console.log('  2. Update GPU drivers on the Windows host');
    console.log('  3. For best performance, consider using the native Windows installation');
  } else {
    console.error('Installation completed but Bambu Studio was not found.');
  }
}

/**
 * Install Bambu Studio from Git Bash on Windows.
 *
 * Git Bash runs on Windows and can access Windows package managers.
 * This function installs Bambu Studio using Chocolatey on the Windows host.
 *
 * Prerequisites:
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey installed on Windows
 * - Administrator privileges (run Git Bash as Administrator)
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Git Bash runs on Windows and can access Windows package managers
  // Delegate to the Windows installation function
  console.log('Installing Bambu Studio for Windows from Git Bash...');

  // Check if already installed (idempotency check)
  // Use a simple file existence check that works from Git Bash
  const checkResult = await shell.exec('ls "/c/Program Files/Bambu Studio/bambu-studio.exe" 2>/dev/null');
  if (checkResult.code === 0) {
    console.log('Bambu Studio is already installed.');
    return;
  }

  // Check if Chocolatey is available (might need to use full path in Git Bash)
  const chocoPath = '/c/ProgramData/chocolatey/bin/choco.exe';
  const chocoAvailable = shell.commandExists('choco') || fs.existsSync(chocoPath);

  if (!chocoAvailable) {
    console.log('Chocolatey is not installed. Please install Chocolatey first:');
    console.log('');
    console.log('Run this command in an Administrator PowerShell:');
    console.log('  Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))');
    return;
  }

  console.log('Installing Bambu Studio via Chocolatey...');

  // Try to use choco from PATH first, fall back to full path
  const chocoCommand = shell.commandExists('choco') ? 'choco' : chocoPath;
  const installResult = await shell.exec(`${chocoCommand} install ${CHOCOLATEY_PACKAGE_NAME} -y`);

  if (installResult.code !== 0) {
    console.error('Failed to install Bambu Studio:', installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run Git Bash as Administrator (right-click > Run as administrator)');
    console.log('  2. Try using the full Chocolatey path:');
    console.log(`     ${chocoPath} install ${CHOCOLATEY_PACKAGE_NAME} -y`);
    return;
  }

  // Verify installation succeeded
  const verifyResult = await shell.exec('ls "/c/Program Files/Bambu Studio/bambu-studio.exe" 2>/dev/null');
  if (verifyResult.code === 0) {
    console.log('Bambu Studio installed successfully.');
    console.log('Location: C:\\Program Files\\Bambu Studio\\bambu-studio.exe');
    console.log('');
    console.log('Launch with: "/c/Program Files/Bambu Studio/bambu-studio.exe" &');
  } else {
    console.error('Installation completed but Bambu Studio was not found.');
    console.log('Close and reopen Git Bash for PATH updates to take effect.');
  }
}

/**
 * Check if Bambu Studio is installed on the current platform.
 *
 * This function performs platform-specific checks to determine if Bambu Studio
 * is already installed:
 * - macOS: Checks for the app bundle in /Applications
 * - Windows: Checks for the executable in Program Files
 * - Linux: Checks for Flatpak installation
 * - Raspberry Pi: Checks for Pi-Apps installation
 *
 * @returns {Promise<boolean>} True if Bambu Studio is installed
 */
async function isInstalled() {
  const platform = os.detect();

  // macOS: Check for the app bundle
  if (platform.type === 'macos') {
    return isInstalledOnMacOS();
  }

  // Windows: Check for the executable
  if (platform.type === 'windows') {
    return await isInstalledOnWindows();
  }

  // Git Bash: Check for Windows installation
  if (platform.type === 'gitbash') {
    const checkResult = await shell.exec('ls "/c/Program Files/Bambu Studio/bambu-studio.exe" 2>/dev/null');
    return checkResult.code === 0;
  }

  // Raspberry Pi: Check via Pi-Apps
  if (platform.type === 'raspbian') {
    return await isInstalledOnRaspbian();
  }

  // Linux platforms (Ubuntu, Debian, WSL, Amazon Linux, Fedora, RHEL): Check AppImage first, then Flatpak
  if (['ubuntu', 'debian', 'wsl', 'amazon_linux', 'fedora', 'rhel'].includes(platform.type)) {
    // Check AppImage installation (preferred)
    if (isAppImageInstalled()) {
      return true;
    }
    // Fallback to Flatpak check (for legacy installations)
    return await isInstalledViaFlatpak();
  }

  return false;
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Bambu Studio can be installed on all supported platforms:
 * - macOS (via Homebrew cask)
 * - Ubuntu/Debian (via Flatpak from Flathub)
 * - Raspberry Pi OS (via Pi-Apps, 64-bit only)
 * - Amazon Linux/RHEL/Fedora (via Flatpak from Flathub)
 * - Windows (via Chocolatey)
 * - WSL (via Flatpak with WSLg)
 * - Git Bash (via Windows Chocolatey)
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  const supportedPlatforms = ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel', 'windows', 'gitbash'];
  if (!supportedPlatforms.includes(platform.type)) {
    return false;
  }
  if (REQUIRES_DESKTOP && !os.isDesktopAvailable()) {
    return false;
  }
  return true;
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically determines the current operating system and
 * invokes the correct platform-specific installation function.
 *
 * Supported platforms:
 * - macOS: Homebrew cask
 * - Ubuntu/Debian: Flatpak from Flathub
 * - Raspberry Pi OS: Pi-Apps (64-bit only)
 * - Amazon Linux/RHEL: Flatpak from Flathub
 * - Windows: Chocolatey
 * - WSL: Flatpak with WSLg
 * - Git Bash: Windows Chocolatey
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their respective installer functions
  // This mapping handles aliases (e.g., debian maps to ubuntu)
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,
    'wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'fedora': install_amazon_linux,
    'rhel': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash
  };

  const installer = installers[platform.type];

  // Handle unsupported platforms gracefully (no errors, no alternatives)
  if (!installer) {
    console.log(`Bambu Studio is not available for ${platform.type}.`);
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

// Allow direct execution of this script: node bambu-studio.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
