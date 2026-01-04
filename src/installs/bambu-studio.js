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
 */
const FLATPAK_APP_ID = 'com.bambulab.BambuStudio';

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
 *
 * @returns {Promise<boolean>} True if Bambu Studio is installed via Flatpak
 */
async function isInstalledViaFlatpak() {
  if (!isFlatpakAvailable()) {
    return false;
  }

  // Check if the Flatpak app is installed by looking for it in the list
  const result = await shell.exec(`flatpak list --app | grep -i "${FLATPAK_APP_ID}"`);
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
 * Adds the Flathub repository if not already configured.
 * Flathub is the source for the Bambu Studio Flatpak package.
 *
 * @returns {Promise<boolean>} True if Flathub is available after this function
 */
async function ensureFlathubConfigured() {
  // Check if Flathub is already configured
  const checkResult = await shell.exec('flatpak remote-list | grep -i flathub');
  if (checkResult.code === 0 && checkResult.stdout.includes('flathub')) {
    return true;
  }

  console.log('Adding Flathub repository...');

  // Add Flathub repository (--if-not-exists prevents errors if already added)
  const addResult = await shell.exec(
    'flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo'
  );

  if (addResult.code !== 0) {
    console.error('Failed to add Flathub repository:', addResult.stderr);
    return false;
  }

  console.log('Flathub repository added successfully.');
  return true;
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
 * Install Bambu Studio on Ubuntu/Debian using Flatpak from Flathub.
 *
 * IMPORTANT: There is no official APT or Snap package for Bambu Studio.
 * Flatpak from Flathub is the recommended installation method for Linux.
 *
 * Prerequisites:
 * - Ubuntu 20.04+ or Debian 11+ (64-bit)
 * - X11 or Wayland display server
 * - sudo privileges
 *
 * NOTE: A system restart (or logout/login) may be required after installing
 * Flatpak for the first time before Bambu Studio can be launched.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if already installed via Flatpak (idempotency check)
  const alreadyInstalled = await isInstalledViaFlatpak();
  if (alreadyInstalled) {
    console.log('Bambu Studio is already installed.');
    return;
  }

  // Ensure Flatpak is installed (required for Bambu Studio on Linux)
  const flatpakReady = await ensureFlatpakInstalled();
  if (!flatpakReady) {
    console.error('Could not install Flatpak. Please install it manually:');
    console.log('  sudo apt-get update && sudo apt-get install -y flatpak');
    return;
  }

  // Ensure Flathub repository is configured
  const flathubReady = await ensureFlathubConfigured();
  if (!flathubReady) {
    console.error('Could not configure Flathub repository. Please add it manually:');
    console.log('  flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo');
    return;
  }

  console.log('Installing Bambu Studio via Flatpak...');
  console.log('Note: This may take several minutes on first install.');

  // Install Bambu Studio from Flathub
  // The -y flag automatically confirms the installation
  const installResult = await shell.exec(`flatpak install -y flathub ${FLATPAK_APP_ID}`);

  if (installResult.code !== 0) {
    console.error('Failed to install Bambu Studio:', installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Try restarting your system and running the install again');
    console.log('  2. Run: flatpak update -y');
    console.log('  3. If Flathub fails, try re-adding it:');
    console.log('     flatpak remote-delete flathub');
    console.log('     flatpak remote-add flathub https://dl.flathub.org/repo/flathub.flatpakrepo');
    return;
  }

  // Verify installation succeeded
  const verifyInstalled = await isInstalledViaFlatpak();
  if (verifyInstalled) {
    console.log('Bambu Studio installed successfully.');
    console.log('');
    console.log('Launch with: flatpak run com.bambulab.BambuStudio');
    console.log('');
    console.log('Note: If this is your first Flatpak installation, you may need to');
    console.log('restart your system or log out/in for the app to appear in menus.');
  } else {
    console.error('Installation completed but Bambu Studio was not found.');
    console.log('Try running: flatpak list | grep -i bambu');
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
 * Install Bambu Studio on Amazon Linux/RHEL using Flatpak.
 *
 * IMPORTANT: Amazon Linux is primarily a server OS without a desktop environment.
 * Bambu Studio is a GUI application and requires a display. This platform is
 * NOT recommended for Bambu Studio usage.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, RHEL 8+, or Fedora 35+
 * - Desktop environment with X11/Wayland support
 * - Flatpak package manager
 * - sudo privileges
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if already installed via Flatpak (idempotency check)
  const alreadyInstalled = await isInstalledViaFlatpak();
  if (alreadyInstalled) {
    console.log('Bambu Studio is already installed.');
    return;
  }

  console.log('Note: Amazon Linux is primarily a server OS. Bambu Studio requires');
  console.log('a desktop environment with display capabilities.');
  console.log('');

  // Ensure Flatpak is installed
  const flatpakReady = await ensureFlatpakInstalledRHEL();
  if (!flatpakReady) {
    console.error('Could not install Flatpak. Please install it manually:');
    console.log('  sudo dnf install -y flatpak');
    return;
  }

  // Ensure Flathub repository is configured
  const flathubReady = await ensureFlathubConfigured();
  if (!flathubReady) {
    console.error('Could not configure Flathub repository. Please add it manually:');
    console.log('  flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo');
    return;
  }

  console.log('Installing Bambu Studio via Flatpak...');

  // Install Bambu Studio from Flathub
  const installResult = await shell.exec(`flatpak install -y flathub ${FLATPAK_APP_ID}`);

  if (installResult.code !== 0) {
    console.error('Failed to install Bambu Studio:', installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have a desktop environment installed:');
    console.log('     sudo dnf groupinstall -y "GNOME Desktop Environment"');
    console.log('  2. Install required graphics drivers:');
    console.log('     sudo dnf install -y mesa-libGL mesa-libGLU mesa-dri-drivers');
    return;
  }

  // Verify installation succeeded
  const verifyInstalled = await isInstalledViaFlatpak();
  if (verifyInstalled) {
    console.log('Bambu Studio installed successfully.');
    console.log('');
    console.log('Launch with: flatpak run com.bambulab.BambuStudio');
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

  // Ensure Flatpak is installed
  const flatpakReady = await ensureFlatpakInstalled();
  if (!flatpakReady) {
    console.error('Could not install Flatpak. Please install it manually:');
    console.log('  sudo apt-get update && sudo apt-get install -y flatpak');
    return;
  }

  // Ensure Flathub repository is configured
  const flathubReady = await ensureFlathubConfigured();
  if (!flathubReady) {
    console.error('Could not configure Flathub repository. Please add it manually:');
    console.log('  flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo');
    return;
  }

  console.log('Installing Bambu Studio via Flatpak...');
  console.log('Note: This may take several minutes on first install.');

  // Install Bambu Studio from Flathub
  const installResult = await shell.exec(`flatpak install -y flathub ${FLATPAK_APP_ID}`);

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
  install,
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
