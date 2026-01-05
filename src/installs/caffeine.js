#!/usr/bin/env node

/**
 * @fileoverview Install Caffeine - a utility that prevents your computer from sleeping.
 *
 * Caffeine keeps your machine awake during long-running processes like downloads,
 * presentations, video playback, or software builds.
 *
 * Platform implementations vary:
 * - macOS: Caffeine.app via Homebrew (GUI menu bar app)
 * - Ubuntu/Debian: gnome-shell-extension-caffeine or systemd-inhibit (built-in)
 * - Raspberry Pi OS: Uses xset and systemd-inhibit (built-in, no install needed)
 * - Amazon Linux: Uses systemd-inhibit (built-in, no install needed)
 * - Windows: Caffeine via Chocolatey (system tray app)
 * - WSL: Uses systemd-inhibit within WSL or Windows Caffeine for host
 * - Git Bash: Uses Windows Caffeine (Windows installation)
 *
 * @module installs/caffeine
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Install Caffeine on macOS using Homebrew.
 *
 * Installs the Caffeine.app menu bar utility via Homebrew cask.
 * The app displays a coffee cup icon in the menu bar that can be clicked
 * to toggle sleep prevention on/off.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Caffeine.app is already installed in /Applications
  const isAlreadyInstalled = macosApps.isAppInstalled('Caffeine');
  if (isAlreadyInstalled) {
    console.log('Caffeine is already installed, skipping...');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  console.log('Installing Caffeine via Homebrew...');

  // Install the Caffeine cask (GUI application)
  const result = await brew.installCask('caffeine');

  if (!result.success) {
    console.log('Failed to install Caffeine:', result.output);
    return;
  }

  // Verify the installation succeeded by checking for the app bundle
  const isInstalled = macosApps.isAppInstalled('Caffeine');
  if (!isInstalled) {
    console.log('Installation completed but Caffeine.app was not found in /Applications.');
    return;
  }

  console.log('Caffeine installed successfully.');
  console.log('Launch Caffeine from Spotlight (Cmd+Space) or open /Applications/Caffeine.app');
  console.log('Note: macOS also includes a built-in "caffeinate" command for terminal use.');
}

/**
 * Install Caffeine on Ubuntu/Debian using APT.
 *
 * On Ubuntu 20.04 LTS and Debian 10/11 with GNOME, installs the
 * gnome-shell-extension-caffeine package. For newer versions or non-GNOME
 * desktops, the built-in systemd-inhibit command is recommended.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // First, check if systemd-inhibit is available (it should be on all modern Ubuntu/Debian)
  const hasSystemdInhibit = shell.commandExists('systemd-inhibit');

  // Check if the GNOME extension is already installed
  const gnomeExtensionResult = await shell.exec('gnome-extensions list 2>/dev/null | grep -q "caffeine@patapon.info"');
  const hasGnomeExtension = gnomeExtensionResult.code === 0;

  if (hasGnomeExtension) {
    console.log('GNOME Caffeine extension is already installed, skipping...');
    console.log('Enable it with: gnome-extensions enable caffeine@patapon.info');
    return;
  }

  // Check if GNOME Shell is available (required for the extension)
  const hasGnomeShell = shell.commandExists('gnome-shell');

  if (hasGnomeShell) {
    // Try to install the GNOME Shell extension
    console.log('Installing GNOME Shell Caffeine extension...');

    // Update package lists first
    const updateResult = await apt.update();
    if (!updateResult.success) {
      console.log('Warning: Failed to update package lists:', updateResult.output);
    }

    // Attempt to install the GNOME extension package
    const installResult = await apt.install('gnome-shell-extension-caffeine');

    if (installResult.success) {
      console.log('GNOME Caffeine extension installed successfully.');
      console.log('Enable it with: gnome-extensions enable caffeine@patapon.info');
      console.log('You may need to log out and log back in for the extension to appear.');
      return;
    }

    // If the GNOME extension is not available, fall back to systemd-inhibit
    console.log('GNOME extension package not available for this Ubuntu/Debian version.');
  }

  // Verify systemd-inhibit is available as the fallback
  if (hasSystemdInhibit) {
    console.log('Caffeine GNOME extension is not available, but systemd-inhibit is ready to use.');
    console.log('');
    console.log('To prevent sleep while running a command:');
    console.log('  systemd-inhibit --what=idle:sleep your-long-running-command');
    console.log('');
    console.log('To prevent sleep indefinitely (press Ctrl+C to stop):');
    console.log('  systemd-inhibit --what=idle:sleep sleep infinity');
    return;
  }

  console.log('Neither GNOME Caffeine extension nor systemd-inhibit is available.');
}

/**
 * Install Caffeine on Ubuntu running in WSL.
 *
 * WSL does not have direct control over Windows power management.
 * If systemd is enabled, systemd-inhibit can be used within WSL.
 * For preventing Windows host sleep, the Windows Caffeine app should be used.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // Check if systemd is running in WSL
  const initProcessResult = await shell.exec('ps -p 1 -o comm= 2>/dev/null');
  const initProcess = initProcessResult.stdout.trim();
  const hasSystemd = initProcess === 'systemd';

  if (hasSystemd) {
    // Check if systemd-inhibit is available
    const hasSystemdInhibit = shell.commandExists('systemd-inhibit');

    if (hasSystemdInhibit) {
      console.log('systemd-inhibit is available in WSL.');
      console.log('');
      console.log('Note: WSL inhibitors only affect the WSL environment, not the Windows host.');
      console.log('To prevent the Windows host from sleeping, install Caffeine on Windows.');
      console.log('');
      console.log('To prevent WSL sleep for a command:');
      console.log('  systemd-inhibit --what=idle:sleep your-long-running-command');
      return;
    }
  }

  // If systemd is not running or systemd-inhibit is not available
  console.log('systemd is not enabled in WSL or systemd-inhibit is not available.');
  console.log('');
  console.log('To enable systemd in WSL 2, add the following to /etc/wsl.conf:');
  console.log('  [boot]');
  console.log('  systemd=true');
  console.log('');
  console.log('Then restart WSL from PowerShell with: wsl --shutdown');
  console.log('');
  console.log('To prevent the Windows host from sleeping, install Caffeine on Windows:');
  console.log('  choco install caffeine -y');
}

/**
 * Install Caffeine on Raspberry Pi OS.
 *
 * Raspberry Pi OS uses LXDE or Wayfire desktop, not GNOME. The GNOME Shell
 * extension is not compatible. Instead, xset and systemd-inhibit are used
 * for power management. These tools are pre-installed, so no installation
 * is needed.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if xset is available (for display power management)
  const hasXset = shell.commandExists('xset');

  // Check if systemd-inhibit is available (for system sleep prevention)
  const hasSystemdInhibit = shell.commandExists('systemd-inhibit');

  if (!hasXset && !hasSystemdInhibit) {
    console.log('Neither xset nor systemd-inhibit is available on this system.');
    return;
  }

  console.log('Caffeine tools are already available on Raspberry Pi OS.');
  console.log('No installation is required.');
  console.log('');

  if (hasXset) {
    console.log('To prevent display sleep (run from desktop):');
    console.log('  xset s off -dpms');
    console.log('');
  }

  if (hasSystemdInhibit) {
    console.log('To prevent system sleep while running a command:');
    console.log('  systemd-inhibit --what=idle:sleep your-long-running-command');
    console.log('');
  }

  console.log('To disable screen blanking permanently, run:');
  console.log('  sudo raspi-config nonint do_blanking 1');
}

/**
 * Install Caffeine on Amazon Linux/RHEL.
 *
 * Amazon Linux is primarily designed for server workloads and typically runs
 * headless without a desktop environment. The systemd-inhibit command is
 * pre-installed and can prevent sleep/idle during long-running processes.
 * No additional installation is required.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if systemd-inhibit is available (it should be on all systemd-based systems)
  const hasSystemdInhibit = shell.commandExists('systemd-inhibit');

  if (!hasSystemdInhibit) {
    console.log('systemd-inhibit is not available on this system.');
    console.log('This is unexpected for Amazon Linux. Verify systemd is running:');
    console.log('  ps -p 1 -o comm=');
    return;
  }

  console.log('Caffeine functionality is already available via systemd-inhibit.');
  console.log('No installation is required.');
  console.log('');
  console.log('To prevent sleep while running a command:');
  console.log('  systemd-inhibit --what=idle:sleep:shutdown your-long-running-command');
  console.log('');
  console.log('To prevent sleep indefinitely (useful during maintenance):');
  console.log('  systemd-inhibit --what=idle:sleep:shutdown sleep infinity &');
  console.log('');
  console.log('Note: EC2 instances do not have traditional sleep/suspend mechanisms.');
  console.log('For long-running processes on EC2, use nohup, screen, or tmux instead.');
}

/**
 * Install Caffeine on Windows using Chocolatey.
 *
 * Installs the Caffeine utility from Zhorn Software via Chocolatey.
 * Caffeine simulates keypresses to prevent Windows from entering idle/sleep mode.
 * A coffee cup icon appears in the system tray when running.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if Caffeine is already installed via Chocolatey
  const isAlreadyInstalled = await choco.isPackageInstalled('caffeine');
  if (isAlreadyInstalled) {
    console.log('Caffeine is already installed, skipping...');
    return;
  }

  // Verify Chocolatey is available before attempting installation
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('Run PowerShell as Administrator and follow the instructions at:');
    console.log('https://chocolatey.org/install');
    return;
  }

  console.log('Installing Caffeine via Chocolatey...');

  // Install the Caffeine package
  const result = await choco.install('caffeine');

  if (!result.success) {
    console.log('Failed to install Caffeine:', result.output);
    return;
  }

  // Verify the installation succeeded
  const isInstalled = await choco.isPackageInstalled('caffeine');
  if (!isInstalled) {
    console.log('Installation completed but Caffeine was not found.');
    return;
  }

  console.log('Caffeine installed successfully.');
  console.log('');
  console.log('Launch Caffeine from:');
  console.log('  C:\\ProgramData\\chocolatey\\lib\\caffeine\\tools\\caffeine.exe');
  console.log('');
  console.log('A coffee cup icon will appear in the system tray when running.');
  console.log('Click the icon to toggle sleep prevention on/off.');
}

/**
 * Install Caffeine for Git Bash (Windows environment).
 *
 * Git Bash runs on Windows and uses the Windows Caffeine application.
 * This function attempts to install Caffeine via Chocolatey from Git Bash,
 * or provides instructions for manual installation.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if Caffeine executable already exists in the Chocolatey location
  const chocoPath = '/c/ProgramData/chocolatey/lib/caffeine/tools/caffeine.exe';
  const existsResult = await shell.exec(`ls "${chocoPath}" 2>/dev/null`);
  const caffeineExists = existsResult.code === 0;

  if (caffeineExists) {
    console.log('Caffeine is already installed, skipping...');
    console.log(`Launch with: ${chocoPath}`);
    return;
  }

  // Check if Chocolatey is available from Git Bash
  const chocoExe = '/c/ProgramData/chocolatey/bin/choco.exe';
  const chocoExistsResult = await shell.exec(`ls "${chocoExe}" 2>/dev/null`);
  const hasChoco = chocoExistsResult.code === 0;

  if (hasChoco) {
    console.log('Installing Caffeine via Chocolatey...');
    console.log('Note: This may require Administrator privileges.');
    console.log('');

    // Attempt to install via Chocolatey
    const installResult = await shell.exec(`"${chocoExe}" install caffeine -y`);

    if (installResult.code === 0) {
      console.log('Caffeine installed successfully.');
      console.log(`Launch with: ${chocoPath}`);
      return;
    }

    // Installation failed, likely due to permissions
    console.log('Failed to install Caffeine. This may be due to insufficient privileges.');
    console.log('');
  }

  // Provide manual installation instructions
  console.log('To install Caffeine on Windows:');
  console.log('');
  console.log('Option 1: Use Chocolatey from an Administrator Command Prompt:');
  console.log('  choco install caffeine -y');
  console.log('');
  console.log('Option 2: Download manually from:');
  console.log('  https://www.zhornsoftware.co.uk/caffeine/');
  console.log('');
  console.log('After installation, launch from Git Bash with:');
  console.log(`  ${chocoPath} &`);
}

/**
 * Check if Caffeine (or equivalent) is installed on the current platform.
 *
 * This function performs platform-specific checks to determine if Caffeine
 * or its equivalent sleep-prevention functionality is available:
 * - macOS: Checks for Caffeine.app in /Applications
 * - Windows: Checks for Caffeine package via Chocolatey
 * - Linux: Checks for systemd-inhibit (built-in) or GNOME extension
 *
 * @returns {Promise<boolean>} True if Caffeine/equivalent is installed
 */
async function isInstalled() {
  const platform = os.detect();

  // macOS: Check for Caffeine.app
  if (platform.type === 'macos') {
    return macosApps.isAppInstalled('Caffeine');
  }

  // Windows: Check for Caffeine via Chocolatey
  if (platform.type === 'windows') {
    return await choco.isPackageInstalled('caffeine');
  }

  // Git Bash: Check for Windows Caffeine installation
  if (platform.type === 'gitbash') {
    const chocoPath = '/c/ProgramData/chocolatey/lib/caffeine/tools/caffeine.exe';
    const existsResult = await shell.exec(`ls "${chocoPath}" 2>/dev/null`);
    return existsResult.code === 0;
  }

  // Ubuntu/Debian/WSL: Check for GNOME extension or systemd-inhibit
  if (['ubuntu', 'debian', 'wsl'].includes(platform.type)) {
    // Check for GNOME Caffeine extension
    const gnomeExtensionResult = await shell.exec('gnome-extensions list 2>/dev/null | grep -q "caffeine@patapon.info"');
    if (gnomeExtensionResult.code === 0) {
      return true;
    }
    // systemd-inhibit is always available on systemd-based systems
    return shell.commandExists('systemd-inhibit');
  }

  // Raspberry Pi/Amazon Linux: systemd-inhibit is built-in
  if (['raspbian', 'amazon_linux', 'rhel', 'fedora'].includes(platform.type)) {
    return shell.commandExists('systemd-inhibit');
  }

  return false;
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Caffeine/sleep prevention can be installed or configured on all platforms:
 * - macOS (Caffeine.app via Homebrew cask)
 * - Ubuntu/Debian (GNOME extension or systemd-inhibit)
 * - Raspberry Pi OS (xset and systemd-inhibit, built-in)
 * - Amazon Linux/RHEL/Fedora (systemd-inhibit, built-in)
 * - Windows (Caffeine via Chocolatey)
 * - WSL (systemd-inhibit or Windows app)
 * - Git Bash (Windows Caffeine via Chocolatey)
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically detects the current operating system and distribution,
 * then invokes the corresponding platform-specific installation function.
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
    'ubuntu-wsl': install_ubuntu_wsl,
    'wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'amazon-linux': install_amazon_linux,
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  const installer = installers[platform.type];

  // If no installer exists for this platform, exit gracefully without error
  if (!installer) {
    console.log(`Caffeine is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

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
  install_gitbash,
};

// Allow direct execution of this script
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
