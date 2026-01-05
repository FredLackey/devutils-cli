#!/usr/bin/env node

/**
 * @fileoverview Install Keyboard Maestro (macOS) or equivalent automation tools on other platforms.
 * @module installs/keyboard-maestro
 *
 * Keyboard Maestro is a powerful macro and automation application for macOS
 * developed by Stairways Software. It enables users to automate virtually any
 * task on their Mac by creating macros that can be triggered by hotkeys,
 * typed strings, application launches, time schedules, and many other triggers.
 *
 * IMPORTANT PLATFORM LIMITATION:
 * Keyboard Maestro is officially supported ONLY on macOS. There is NO version
 * for Windows, Linux, or any other operating system. Stairways Software has
 * no plans to create versions for other platforms.
 *
 * For other platforms, this installer installs platform-appropriate automation
 * tools that provide similar functionality:
 * - Windows: AutoHotkey (open-source scripting language for Windows automation)
 * - Ubuntu/Debian/Raspberry Pi: AutoKey (desktop automation utility for Linux/X11)
 * - Amazon Linux/RHEL: Not applicable (server OS without desktop environment)
 *
 * For unsupported platforms, this installer will display a simple message
 * and return gracefully without error.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');
const fs = require('fs');

/**
 * The name of the application bundle on macOS.
 * Keyboard Maestro installs to /Applications/Keyboard Maestro.app
 */
const MACOS_APP_NAME = 'Keyboard Maestro';

/**
 * The full path to the macOS application bundle.
 */
const MACOS_APP_PATH = '/Applications/Keyboard Maestro.app';

/**
 * The Homebrew cask name for Keyboard Maestro.
 */
const HOMEBREW_CASK_NAME = 'keyboard-maestro';

/**
 * The APT package name for AutoKey (GTK version) on Ubuntu/Debian/Raspberry Pi.
 * The GTK version is recommended for most desktop environments.
 */
const AUTOKEY_GTK_PACKAGE = 'autokey-gtk';

/**
 * The Chocolatey package name for AutoHotkey on Windows.
 */
const CHOCO_AUTOHOTKEY_PACKAGE = 'autohotkey';

/**
 * Check if Keyboard Maestro is installed on macOS.
 *
 * We check for the application bundle directly at /Applications/Keyboard Maestro.app
 * since this is the standard installation location for the Homebrew cask.
 *
 * @returns {boolean} True if Keyboard Maestro is installed, false otherwise
 */
function isKeyboardMaestroInstalled() {
  return fs.existsSync(MACOS_APP_PATH);
}

/**
 * Check if AutoKey (GTK version) is installed on Linux.
 *
 * We check if the autokey-gtk command exists in the system PATH,
 * which indicates that the autokey-gtk package has been installed.
 *
 * @returns {boolean} True if AutoKey GTK is installed, false otherwise
 */
function isAutoKeyInstalled() {
  return shell.commandExists('autokey-gtk');
}

/**
 * Check if AutoHotkey is installed on Windows.
 *
 * We use the Chocolatey package manager to check if AutoHotkey
 * has been installed via the choco install command.
 *
 * @returns {Promise<boolean>} True if AutoHotkey is installed, false otherwise
 */
async function isAutoHotkeyInstalled() {
  // First check if the AutoHotkey executable exists in common locations
  const autohotkeyExists = shell.commandExists('AutoHotkey64.exe') ||
                           shell.commandExists('AutoHotkey.exe');
  if (autohotkeyExists) {
    return true;
  }

  // Fallback: check via Chocolatey if installed that way
  if (choco.isInstalled()) {
    return await choco.isPackageInstalled(CHOCO_AUTOHOTKEY_PACKAGE);
  }

  return false;
}

/**
 * Install Keyboard Maestro on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 10.13 (High Sierra) or later (macOS 10.15 Catalina or later recommended)
 * - Homebrew package manager installed
 * - 64-bit processor (Intel or Apple Silicon natively supported)
 * - Valid license for full functionality (trial available)
 *
 * The installation uses the Homebrew cask 'keyboard-maestro' which downloads
 * and installs Keyboard Maestro to /Applications/Keyboard Maestro.app.
 *
 * NOTE: After installation, the user must:
 * 1. Grant Accessibility permissions in System Settings > Privacy & Security
 * 2. Optionally purchase a license (US$36) or use the trial version
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Keyboard Maestro is already installed...');

  // Check if already installed using direct path check
  if (isKeyboardMaestroInstalled()) {
    console.log('Keyboard Maestro is already installed, skipping installation.');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Keyboard Maestro.'
    );
  }

  console.log('Installing Keyboard Maestro via Homebrew...');

  // Install the cask using the brew utility
  // The cask installs the app to /Applications/Keyboard Maestro.app
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Keyboard Maestro via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. If you see permission errors, try 'brew reinstall --cask keyboard-maestro'\n` +
      `  3. If blocked by Gatekeeper, run: xattr -cr "/Applications/Keyboard Maestro.app"`
    );
  }

  // Verify the installation succeeded by checking if the app exists
  if (!isKeyboardMaestroInstalled()) {
    throw new Error(
      'Installation appeared to complete but Keyboard Maestro was not found at:\n' +
      `  ${MACOS_APP_PATH}\n\n` +
      'Please try reinstalling manually: brew reinstall --cask keyboard-maestro'
    );
  }

  console.log('Keyboard Maestro installed successfully.');
  console.log('');
  console.log('IMPORTANT POST-INSTALLATION STEPS:');
  console.log('1. Launch Keyboard Maestro from /Applications');
  console.log('2. Grant Accessibility permissions when prompted:');
  console.log('   System Settings > Privacy & Security > Accessibility');
  console.log('3. Purchase a license (US$36) or use the trial version');
  console.log('');
  console.log('The Keyboard Maestro Engine must be running for macros to trigger.');
}

/**
 * Install AutoKey on Ubuntu/Debian using APT.
 *
 * Since Keyboard Maestro is macOS-only, we install AutoKey as the
 * equivalent automation tool for Linux. AutoKey is a desktop automation
 * utility that provides text expansion and scripting capabilities.
 *
 * Prerequisites:
 * - Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
 * - X11 display server (AutoKey does not work with Wayland)
 * - sudo privileges
 * - Desktop environment (GNOME, KDE, XFCE, etc.)
 *
 * @returns {Promise<void>}
 * @throws {Error} If APT is not available or installation fails
 */
async function install_ubuntu() {
  console.log('Keyboard Maestro is macOS-only. Installing AutoKey as the Linux equivalent...');
  console.log('');

  // Check if already installed
  if (isAutoKeyInstalled()) {
    console.log('AutoKey is already installed, skipping installation.');
    return;
  }

  // Verify APT is available
  if (!apt.isInstalled()) {
    throw new Error(
      'APT package manager is not available.\n' +
      'This installer requires a Debian-based system with apt-get.'
    );
  }

  // Update package lists first to ensure we have the latest package info
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists, continuing with installation...');
  }

  // Install AutoKey GTK version (recommended for most desktop environments)
  console.log('Installing AutoKey (GTK version) via APT...');
  const installResult = await apt.install(AUTOKEY_GTK_PACKAGE);

  if (!installResult.success) {
    throw new Error(
      `Failed to install AutoKey via APT.\n` +
      `Output: ${installResult.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Try: sudo add-apt-repository universe -y && sudo apt-get update\n` +
      `  2. For KDE/Qt desktops, try: sudo apt-get install autokey-qt\n` +
      `  3. Ensure you have a desktop environment installed (not headless/server)`
    );
  }

  // Verify installation succeeded
  if (!isAutoKeyInstalled()) {
    throw new Error(
      'Installation appeared to complete but AutoKey was not found.\n\n' +
      'Please try installing manually:\n' +
      '  sudo apt-get update && sudo apt-get install -y autokey-gtk'
    );
  }

  console.log('AutoKey installed successfully.');
  console.log('');
  console.log('IMPORTANT NOTES:');
  console.log('1. AutoKey requires X11 (does not work with Wayland)');
  console.log('2. Check your display server: echo $XDG_SESSION_TYPE');
  console.log('3. If using Wayland, log out and select "Ubuntu on Xorg" at login');
  console.log('4. Launch AutoKey from your application menu or run: autokey-gtk');
}

/**
 * Install AutoKey on Raspberry Pi OS using APT.
 *
 * Since Keyboard Maestro is macOS-only, we install AutoKey as the
 * equivalent automation tool. The installation process is identical
 * to Ubuntu/Debian since Raspberry Pi OS is Debian-based.
 *
 * Prerequisites:
 * - Raspberry Pi OS (Bookworm or Bullseye) with desktop environment
 * - Raspberry Pi 3 or later (earlier models have limited performance)
 * - X11 display server (default on Raspberry Pi OS)
 * - sudo privileges
 *
 * @returns {Promise<void>}
 * @throws {Error} If APT is not available or installation fails
 */
async function install_raspbian() {
  console.log('Keyboard Maestro is macOS-only. Installing AutoKey as the Linux equivalent...');
  console.log('');

  // Check if already installed
  if (isAutoKeyInstalled()) {
    console.log('AutoKey is already installed, skipping installation.');
    return;
  }

  // Verify APT is available
  if (!apt.isInstalled()) {
    throw new Error(
      'APT package manager is not available.\n' +
      'This installer requires Raspberry Pi OS with apt-get.'
    );
  }

  // Update package lists first
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists, continuing with installation...');
  }

  // Install AutoKey GTK version (recommended for Raspberry Pi OS)
  console.log('Installing AutoKey (GTK version) via APT...');
  const installResult = await apt.install(AUTOKEY_GTK_PACKAGE);

  if (!installResult.success) {
    throw new Error(
      `Failed to install AutoKey via APT.\n` +
      `Output: ${installResult.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are using Raspberry Pi OS with desktop (not Lite)\n` +
      `  2. Try: sudo apt-get update && sudo apt-get install -y autokey-gtk\n` +
      `  3. Raspberry Pi 4 or 5 is recommended for better performance`
    );
  }

  // Verify installation succeeded
  if (!isAutoKeyInstalled()) {
    throw new Error(
      'Installation appeared to complete but AutoKey was not found.\n\n' +
      'Please try installing manually:\n' +
      '  sudo apt-get update && sudo apt-get install -y autokey-gtk'
    );
  }

  console.log('AutoKey installed successfully.');
  console.log('');
  console.log('IMPORTANT NOTES:');
  console.log('1. AutoKey requires a graphical desktop session (not SSH/headless)');
  console.log('2. Verify X11 is running: echo $DISPLAY');
  console.log('3. Launch AutoKey from your application menu or run: autokey-gtk');
  console.log('4. AutoKey can be resource-intensive on Raspberry Pi 3');
}

/**
 * Handle installation request for Amazon Linux/RHEL.
 *
 * Amazon Linux and RHEL are primarily server operating systems without
 * desktop environments by default. Desktop automation tools like
 * Keyboard Maestro or AutoKey are not applicable to these platforms
 * in typical use cases.
 *
 * This function returns gracefully with a message rather than throwing
 * an error, as per the installer guidelines.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Keyboard Maestro is not available for Amazon Linux/RHEL.');
  console.log('');
  console.log('Amazon Linux and RHEL are server operating systems that typically');
  console.log('do not include desktop environments. For server automation, consider');
  console.log('using shell scripts, cron jobs, or systemd timers instead.');
}

/**
 * Install AutoHotkey on Windows using Chocolatey.
 *
 * Since Keyboard Maestro is macOS-only, we install AutoHotkey as the
 * equivalent automation tool for Windows. AutoHotkey is an open-source
 * scripting language that allows automation of the Windows GUI and
 * general scripting.
 *
 * Prerequisites:
 * - Windows 10 or later (64-bit recommended)
 * - Chocolatey package manager installed
 * - Administrator privileges
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Keyboard Maestro is macOS-only. Installing AutoHotkey as the Windows equivalent...');
  console.log('');

  // Check if already installed
  const alreadyInstalled = await isAutoHotkeyInstalled();
  if (alreadyInstalled) {
    console.log('AutoHotkey is already installed, skipping installation.');
    return;
  }

  // Verify Chocolatey is available
  if (!choco.isInstalled()) {
    throw new Error(
      'Chocolatey is not installed.\n\n' +
      'To install Chocolatey, open PowerShell as Administrator and run:\n' +
      '  Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))\n\n' +
      'Or run: dev install chocolatey\n\n' +
      'Then retry installing Keyboard Maestro.'
    );
  }

  console.log('Installing AutoHotkey via Chocolatey...');

  // Install AutoHotkey using Chocolatey
  const result = await choco.install(CHOCO_AUTOHOTKEY_PACKAGE);

  if (!result.success) {
    throw new Error(
      `Failed to install AutoHotkey via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Try: choco install autohotkey -y --force\n` +
      `  3. If antivirus blocks it, add AutoHotkey to exclusions`
    );
  }

  // Verify installation succeeded
  const verified = await isAutoHotkeyInstalled();
  if (!verified) {
    // AutoHotkey might be installed but not in PATH yet - check via Chocolatey
    const chocoCheck = await choco.isPackageInstalled(CHOCO_AUTOHOTKEY_PACKAGE);
    if (!chocoCheck) {
      throw new Error(
        'Installation appeared to complete but AutoHotkey was not found.\n\n' +
        'Please try installing manually:\n' +
        '  choco install autohotkey -y'
      );
    }
    console.log('AutoHotkey installed successfully (restart terminal to update PATH).');
  } else {
    console.log('AutoHotkey installed successfully.');
  }

  console.log('');
  console.log('GETTING STARTED WITH AUTOHOTKEY:');
  console.log('1. Create a .ahk script file with your automation rules');
  console.log('2. Example hotkey: #n::Run "notepad.exe"  (Win+N opens Notepad)');
  console.log('3. Example text expansion: ::btw::by the way');
  console.log('4. Place .ahk files in the Startup folder to run at login');
  console.log('5. Documentation: https://www.autohotkey.com/docs/v2/');
}

/**
 * Install automation tools from Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Since Keyboard Maestro cannot run inside WSL (macOS-only), and AutoKey
 * requires X11 which may not be configured in WSL, we install AutoHotkey
 * on the Windows HOST instead. This is the most practical approach for
 * automating tasks in a WSL environment.
 *
 * Prerequisites:
 * - WSL 2 with Ubuntu installed
 * - Chocolatey or winget on the Windows host
 * - Administrator privileges on Windows
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation on Windows host fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Keyboard Maestro is macOS-only and cannot run in WSL.');
  console.log('Installing AutoHotkey on the Windows HOST instead...');
  console.log('');

  // Check if AutoHotkey is already installed on Windows host via PowerShell
  console.log('Checking if AutoHotkey is already installed on Windows host...');

  const checkResult = await shell.exec(
    `powershell.exe -NoProfile -Command "Get-Command AutoHotkey64.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source"`
  );

  if (checkResult.code === 0 && checkResult.stdout.trim()) {
    console.log('AutoHotkey is already installed on the Windows host, skipping installation.');
    console.log(`Location: ${checkResult.stdout.trim()}`);
    return;
  }

  // Try to install via Chocolatey on Windows host
  console.log('Installing AutoHotkey on Windows host via Chocolatey...');

  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "choco install autohotkey -y"`
  );

  if (installResult.code !== 0) {
    // Chocolatey might not be installed, try winget as fallback
    console.log('Chocolatey installation failed, trying winget...');

    const wingetResult = await shell.exec(
      `powershell.exe -NoProfile -Command "winget install --id AutoHotkey.AutoHotkey --silent --accept-package-agreements --accept-source-agreements"`
    );

    if (wingetResult.code !== 0) {
      throw new Error(
        `Failed to install AutoHotkey on the Windows host.\n` +
        `Chocolatey output: ${installResult.stdout || installResult.stderr}\n` +
        `Winget output: ${wingetResult.stdout || wingetResult.stderr}\n\n` +
        `Troubleshooting:\n` +
        `  1. Open PowerShell as Administrator on Windows and run:\n` +
        `     choco install autohotkey -y\n` +
        `  2. Or install via winget:\n` +
        `     winget install --id AutoHotkey.AutoHotkey --silent`
      );
    }
  }

  // Verify installation succeeded
  const verifyResult = await shell.exec(
    `powershell.exe -NoProfile -Command "Get-Command AutoHotkey64.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source"`
  );

  if (verifyResult.code !== 0 || !verifyResult.stdout.trim()) {
    // Installation might have succeeded but command not in PATH yet
    console.log('AutoHotkey installed successfully on the Windows host.');
    console.log('Note: You may need to restart your terminal for PATH to update.');
  } else {
    console.log('AutoHotkey installed successfully on the Windows host.');
    console.log(`Location: ${verifyResult.stdout.trim()}`);
  }

  console.log('');
  console.log('USING AUTOHOTKEY FROM WSL:');
  console.log('1. Create .ahk scripts on the Windows host');
  console.log('2. Access Windows files from WSL at /mnt/c/');
  console.log('3. Run scripts via: powershell.exe -Command "AutoHotkey64.exe C:\\path\\to\\script.ahk"');
}

/**
 * Install AutoHotkey from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs AutoHotkey
 * on the Windows host using Chocolatey via PowerShell interop.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not available or installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Keyboard Maestro is macOS-only. Installing AutoHotkey instead...');
  console.log('');

  // Check if AutoHotkey is already installed via PowerShell
  console.log('Checking if AutoHotkey is already installed...');

  const checkResult = await shell.exec(
    `powershell.exe -NoProfile -Command "Get-Command AutoHotkey64.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source"`
  );

  if (checkResult.code === 0 && checkResult.stdout.trim()) {
    console.log('AutoHotkey is already installed, skipping installation.');
    console.log(`Location: ${checkResult.stdout.trim()}`);
    return;
  }

  // Install via Chocolatey
  console.log('Installing AutoHotkey via Chocolatey...');

  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "choco install autohotkey -y"`
  );

  if (installResult.code !== 0) {
    // Try winget as fallback
    console.log('Chocolatey installation failed, trying winget...');

    const wingetResult = await shell.exec(
      `powershell.exe -NoProfile -Command "winget install --id AutoHotkey.AutoHotkey --silent --accept-package-agreements --accept-source-agreements"`
    );

    if (wingetResult.code !== 0) {
      throw new Error(
        `Failed to install AutoHotkey.\n` +
        `Output: ${installResult.stdout || installResult.stderr}\n\n` +
        `Troubleshooting:\n` +
        `  1. Run Git Bash as Administrator and retry\n` +
        `  2. Or install manually from PowerShell:\n` +
        `     choco install autohotkey -y`
      );
    }
  }

  // Verify installation
  const verifyResult = await shell.exec(
    `powershell.exe -NoProfile -Command "Get-Command AutoHotkey64.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source"`
  );

  if (verifyResult.code === 0 && verifyResult.stdout.trim()) {
    console.log('AutoHotkey installed successfully.');
    console.log(`Location: ${verifyResult.stdout.trim()}`);
  } else {
    console.log('AutoHotkey installed successfully.');
    console.log('Note: You may need to restart your terminal for PATH to update.');
  }

  console.log('');
  console.log('GETTING STARTED WITH AUTOHOTKEY:');
  console.log('1. Create a .ahk script file with your automation rules');
  console.log('2. Example: #n::Run "notepad.exe"  (Win+N opens Notepad)');
  console.log('3. Place scripts in shell:startup to run at login');
  console.log('4. Documentation: https://www.autohotkey.com/docs/v2/');
}

/**
 * Check if this installer is supported on the current platform.
 * Keyboard Maestro (or equivalent) is supported on desktop platforms.
 * Server operating systems (Amazon Linux, RHEL, Fedora) are NOT supported.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  // Desktop automation tools are NOT applicable to server operating systems
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported (and unsupported)
 * platforms have appropriate installation logic.
 *
 * Supported platforms and what gets installed:
 * - macOS: Keyboard Maestro via Homebrew cask
 * - Windows: AutoHotkey via Chocolatey
 * - Git Bash: AutoHotkey via PowerShell/Chocolatey
 * - WSL (Ubuntu): AutoHotkey on Windows host via PowerShell
 * - Ubuntu/Debian: AutoKey via APT
 * - Raspberry Pi OS: AutoKey via APT
 *
 * Unsupported platforms (returns gracefully with message):
 * - Amazon Linux/RHEL: Server OS, desktop automation not applicable
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases (e.g., debian maps to ubuntu)
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
    'gitbash': install_gitbash
  };

  const installer = installers[platform.type];

  if (!installer) {
    console.log(`Keyboard Maestro is not available for ${platform.type}.`);
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

// Allow direct execution: node keyboard-maestro.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
