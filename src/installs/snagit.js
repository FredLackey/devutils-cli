#!/usr/bin/env node

/**
 * @fileoverview Install Snagit.
 * @module installs/snagit
 *
 * Snagit is a professional screen capture and screen recording software developed
 * by TechSmith Corporation. It enables users to capture screenshots of their entire
 * desktop, specific regions, windows, or scrolling content such as web pages and
 * documents. Snagit includes a powerful built-in editor that allows you to add
 * annotations, arrows, text callouts, highlights, and shapes to captured images.
 * The software also supports quick video recording for creating tutorials and
 * demonstrations.
 *
 * IMPORTANT PLATFORM LIMITATION:
 * Snagit is officially supported ONLY on macOS and Windows.
 * TechSmith explicitly states: "Currently, neither Snagit nor Camtasia are
 * supported on Linux. They are only available for Windows and Mac platforms."
 *
 * For unsupported platforms (Ubuntu, Debian, Raspberry Pi OS, Amazon Linux, etc.),
 * this installer will display a simple message and return gracefully without error.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const winget = require('../utils/windows/winget');
const windowsShell = require('../utils/windows/shell');
const fs = require('fs');

/**
 * Whether this installer requires a desktop environment to function.
 * Snagit is a GUI screen capture and recording application.
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for Snagit.
 * This is used for both installation checks and the install command.
 */
const HOMEBREW_CASK_NAME = 'snagit';

/**
 * The winget package ID for Snagit.
 * TechSmith publishes Snagit under this identifier in the winget repository.
 * Note: The version year may change (e.g., TechSmith.Snagit.2025, TechSmith.Snagit.2026)
 * but winget typically resolves the latest version when using the base ID.
 */
const WINGET_PACKAGE_ID = 'TechSmith.Snagit';

/**
 * Windows installation paths where Snagit may be installed.
 * We check multiple possible version-specific paths since TechSmith
 * includes the year in the installation folder name.
 */
const WINDOWS_INSTALL_PATHS = [
  'C:\\Program Files\\TechSmith\\Snagit 2026',
  'C:\\Program Files\\TechSmith\\Snagit 2025',
  'C:\\Program Files\\TechSmith\\Snagit 2024',
  'C:\\Program Files\\TechSmith\\Snagit 2023'
];

/**
 * Check if Snagit is installed on macOS.
 *
 * Snagit installs to /Applications with a version-specific name like
 * "Snagit 2026.app", so we need to check for any matching pattern
 * rather than an exact app name.
 *
 * @returns {boolean} True if Snagit is installed, false otherwise
 */
function isInstalledMacOS() {
  const applicationsDir = '/Applications';

  try {
    const entries = fs.readdirSync(applicationsDir);
    // Check if any entry starts with "Snagit" and ends with ".app"
    const snagitApp = entries.find(entry =>
      entry.startsWith('Snagit') && entry.endsWith('.app')
    );
    return !!snagitApp;
  } catch (err) {
    // If we cannot read the directory, assume not installed
    return false;
  }
}

/**
 * Check if Snagit is installed on Windows.
 *
 * Checks multiple version-specific installation paths because TechSmith
 * includes the year in the folder name (e.g., "Snagit 2025").
 * Falls back to winget list check if path checks fail.
 *
 * @returns {Promise<boolean>} True if Snagit is installed, false otherwise
 */
async function isInstalledWindows() {
  // First, check if any known installation path exists
  for (const installPath of WINDOWS_INSTALL_PATHS) {
    const result = await windowsShell.execPowerShell(`Test-Path '${installPath}'`);
    if (result.success && result.stdout.trim().toLowerCase() === 'true') {
      return true;
    }
  }

  // Fallback: check via winget in case of a non-standard installation location
  const isPackageInstalled = await winget.isPackageInstalled(WINGET_PACKAGE_ID);
  return isPackageInstalled;
}

/**
 * Install Snagit on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 15.0 (Sequoia) or later for Snagit 2026
 * - macOS 14.0 (Sonoma) or later for Snagit 2025/2024
 * - Apple Silicon (M1, M2, M3, M4) or Intel processor
 * - Minimum 8 GB RAM recommended
 * - 1.6 GB available disk space
 * - Homebrew package manager installed
 *
 * The installation uses the Homebrew cask 'snagit' which downloads
 * and installs the Snagit application to /Applications/.
 *
 * NOTE: After installation, the user must:
 * 1. Activate their license or start a trial
 * 2. Grant macOS permissions (Screen Recording, Accessibility, etc.)
 * These steps require user interaction and cannot be automated.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Snagit is already installed...');

  // Check if already installed using direct path check
  if (isInstalledMacOS()) {
    console.log('Snagit is already installed, skipping installation.');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Snagit.'
    );
  }

  console.log('Installing Snagit via Homebrew...');

  // Install the cask with quiet mode to reduce output noise
  // Note: This may prompt for administrator password for system components
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Snagit via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Check macOS version compatibility at techsmith.com/snagit/system-requirements/\n` +
      `  3. Clear Snagit preferences: rm -rf ~/Library/Preferences/com.TechSmith.Snagit*`
    );
  }

  // Verify the installation succeeded by checking if the app exists
  if (!isInstalledMacOS()) {
    throw new Error(
      'Installation appeared to complete but Snagit was not found in /Applications.\n\n' +
      'Please try reinstalling manually: brew reinstall --cask snagit'
    );
  }

  console.log('Snagit installed successfully.');
  console.log('');
  console.log('IMPORTANT: Please launch Snagit and complete the following:');
  console.log('  1. Sign in with your TechSmith account or enter your license key');
  console.log('  2. Grant macOS permissions when prompted:');
  console.log('     - Screen Recording (System Settings > Privacy & Security)');
  console.log('     - Accessibility (for Snagit and SnagitHelper)');
  console.log('     - Microphone (optional, for video recording)');
  console.log('     - Camera (optional, for webcam capture)');
}

/**
 * Install Snagit on Ubuntu/Debian.
 *
 * IMPORTANT: Snagit is NOT officially supported on Ubuntu or Debian.
 * TechSmith explicitly states: "Currently, neither Snagit nor Camtasia are
 * supported on Linux. They are only available for Windows and Mac platforms."
 *
 * This function returns gracefully without error per the project requirements.
 * No alternatives are suggested as per the installation guidelines.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Snagit is not available for Ubuntu/Debian.');
}

/**
 * Install Snagit on Raspberry Pi OS.
 *
 * IMPORTANT: Snagit is NOT supported on Raspberry Pi OS due to two
 * fundamental incompatibilities:
 *
 * 1. Architecture: Snagit is compiled for x86/x86_64 processors.
 *    Raspberry Pi uses ARM processors, and TechSmith does not release
 *    ARM-compiled versions.
 *
 * 2. Operating System: TechSmith only supports macOS and Windows.
 *    There is no Linux support of any kind.
 *
 * This function returns gracefully without error per the project requirements.
 * No alternatives are suggested as per the installation guidelines.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Snagit is not available for Raspberry Pi OS.');
}

/**
 * Install Snagit on Amazon Linux/RHEL.
 *
 * IMPORTANT: Snagit is NOT officially supported on Amazon Linux or RHEL.
 * TechSmith does not provide packages for any Linux distribution.
 *
 * This function returns gracefully without error per the project requirements.
 * No alternatives are suggested as per the installation guidelines.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Snagit is not available for Amazon Linux/RHEL.');
}

/**
 * Install Snagit on Windows using winget.
 *
 * Prerequisites:
 * - Windows 11 (64-bit)
 * - Windows 11 on ARM (23H2 or higher)
 * - Windows 10 (64-bit) version 20H2 or later
 * - Windows Server 2016 or Windows Server 2019
 * - Intel i5 6th Gen / AMD equivalent CPU
 * - Minimum 8 GB RAM recommended
 * - 1.6 GB available disk space
 * - .NET Framework 4.7.2 or later
 * - winget (Windows Package Manager) installed
 *
 * Note: Windows N editions require the Media Foundation Pack.
 * Snagit Printer is not available on Windows on ARM.
 *
 * The installation uses winget with silent flags to minimize user interaction.
 * However, after installation, the user must activate their license or start a trial.
 * This step cannot be automated without enterprise deployment tools.
 *
 * @returns {Promise<void>}
 * @throws {Error} If winget is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Snagit is already installed...');

  // Check if already installed
  const alreadyInstalled = await isInstalledWindows();
  if (alreadyInstalled) {
    console.log('Snagit is already installed, skipping installation.');
    return;
  }

  // Verify winget is available
  if (!winget.isInstalled()) {
    throw new Error(
      'winget (Windows Package Manager) is not available.\n\n' +
      'To install winget:\n' +
      '  1. Install "App Installer" from the Microsoft Store, or\n' +
      '  2. Run: dev install winget\n\n' +
      'Then retry installing Snagit.'
    );
  }

  console.log('Installing Snagit via winget...');

  // Install using winget with silent mode and auto-accept agreements
  const result = await winget.install(WINGET_PACKAGE_ID, {
    silent: true
  });

  if (!result.success) {
    throw new Error(
      `Failed to install Snagit via winget.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'winget source reset --force' and retry\n` +
      `  2. Ensure .NET Framework 4.7.2 is installed\n` +
      `  3. Install WebView2 Runtime: choco install webview2-runtime -y\n` +
      `  4. Ensure you have administrator privileges`
    );
  }

  // Verify installation succeeded
  const verified = await isInstalledWindows();
  if (!verified) {
    throw new Error(
      'Installation appeared to complete but Snagit was not found.\n\n' +
      'Please try reinstalling manually:\n' +
      '  winget uninstall --id TechSmith.Snagit --silent\n' +
      '  winget install --id TechSmith.Snagit --silent --accept-package-agreements --accept-source-agreements'
    );
  }

  console.log('Snagit installed successfully.');
  console.log('');
  console.log('IMPORTANT: Please launch Snagit and either:');
  console.log('  - Sign in with your TechSmith account');
  console.log('  - Enter your license key via Help > Enter Software Key');
  console.log('  - Start a free trial');
}

/**
 * Install Snagit from Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * IMPORTANT: Snagit cannot run inside WSL because WSL runs a Linux
 * environment and TechSmith does not support Linux.
 *
 * This function installs Snagit on the Windows HOST instead, which
 * is the recommended approach. WSL applications can still interact with files
 * that Snagit modifies via /mnt/c/.
 *
 * @returns {Promise<void>}
 * @throws {Error} If winget is not available on Windows host or installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Snagit cannot run inside WSL because WSL runs a Linux');
  console.log('environment and TechSmith does not support Linux.');
  console.log('');
  console.log('Installing Snagit on the Windows HOST instead...');
  console.log('');

  // Check if already installed on Windows host via PowerShell interop
  console.log('Checking if Snagit is already installed on Windows host...');

  // Build a PowerShell command to check multiple version paths
  const checkPaths = WINDOWS_INSTALL_PATHS.map(p => `(Test-Path '${p}')`).join(' -or ');
  const checkResult = await shell.exec(
    `powershell.exe -NoProfile -Command "${checkPaths}"`
  );

  if (checkResult.code === 0 && checkResult.stdout.trim().toLowerCase() === 'true') {
    console.log('Snagit is already installed on the Windows host, skipping installation.');
    console.log('');
    console.log('You can access Snagit capture files from WSL at:');
    console.log('  /mnt/c/Users/<your-username>/Documents/Snagit/');
    return;
  }

  // Install via PowerShell interop using winget on the Windows host
  console.log('Installing Snagit on Windows host via winget...');

  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "winget install --id ${WINGET_PACKAGE_ID} --silent --accept-package-agreements --accept-source-agreements"`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Snagit on the Windows host.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure winget is installed on Windows\n` +
      `  2. Open a Windows PowerShell as Administrator and run:\n` +
      `     winget install --id TechSmith.Snagit --silent --accept-package-agreements --accept-source-agreements\n` +
      `  3. Check if you have administrator privileges`
    );
  }

  // Verify installation succeeded
  const verifyResult = await shell.exec(
    `powershell.exe -NoProfile -Command "${checkPaths}"`
  );

  if (verifyResult.code !== 0 || verifyResult.stdout.trim().toLowerCase() !== 'true') {
    throw new Error(
      'Installation appeared to complete but Snagit was not found on the Windows host.\n\n' +
      'Please install manually from Windows PowerShell:\n' +
      '  winget install --id TechSmith.Snagit --silent --accept-package-agreements --accept-source-agreements'
    );
  }

  console.log('Snagit installed successfully on the Windows host.');
  console.log('');
  console.log('IMPORTANT: Please launch Snagit from Windows and either:');
  console.log('  - Sign in with your TechSmith account');
  console.log('  - Enter your license key via Help > Enter Software Key');
  console.log('  - Start a free trial');
  console.log('');
  console.log('You can access Snagit capture files from WSL at:');
  console.log('  /mnt/c/Users/<your-username>/Documents/Snagit/');
}

/**
 * Install Snagit from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Snagit
 * on the Windows host using winget via PowerShell interop.
 *
 * @returns {Promise<void>}
 * @throws {Error} If winget is not available or installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Snagit on the Windows host...');
  console.log('');

  // Check if already installed on Windows host via PowerShell
  console.log('Checking if Snagit is already installed...');

  // Build a PowerShell command to check multiple version paths
  const checkPaths = WINDOWS_INSTALL_PATHS.map(p => `(Test-Path '${p}')`).join(' -or ');
  const checkResult = await shell.exec(
    `powershell.exe -NoProfile -Command "${checkPaths}"`
  );

  if (checkResult.code === 0 && checkResult.stdout.trim().toLowerCase() === 'true') {
    console.log('Snagit is already installed, skipping installation.');
    return;
  }

  // Install via PowerShell using winget
  console.log('Installing Snagit via winget...');

  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "winget install --id ${WINGET_PACKAGE_ID} --silent --accept-package-agreements --accept-source-agreements"`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Snagit.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure winget is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try using the full PowerShell path:\n` +
      `     /c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -Command "winget install --id TechSmith.Snagit --silent --accept-package-agreements --accept-source-agreements"`
    );
  }

  // Verify installation
  const verifyResult = await shell.exec(
    `powershell.exe -NoProfile -Command "${checkPaths}"`
  );

  if (verifyResult.code !== 0 || verifyResult.stdout.trim().toLowerCase() !== 'true') {
    throw new Error(
      'Installation appeared to complete but Snagit was not found.\n\n' +
      'Please try installing manually from PowerShell:\n' +
      '  winget install --id TechSmith.Snagit --silent --accept-package-agreements --accept-source-agreements'
    );
  }

  console.log('Snagit installed successfully.');
  console.log('');
  console.log('IMPORTANT: Please launch Snagit and either:');
  console.log('  - Sign in with your TechSmith account');
  console.log('  - Enter your license key via Help > Enter Software Key');
  console.log('  - Start a free trial');
}

/**
 * Check if Snagit is installed on the current platform.
 *
 * This function performs platform-specific checks to determine if Snagit
 * is already installed on the system.
 *
 * @returns {Promise<boolean>} True if Snagit is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    return isInstalledMacOS();
  }

  if (platform.type === 'windows' || platform.type === 'gitbash' || platform.type === 'wsl') {
    return isInstalledWindows();
  }

  // Snagit is not available on Linux platforms
  return false;
}

/**
 * Check if this installer is supported on the current platform.
 * Snagit is only available on macOS and Windows platforms.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  // Snagit is only available on macOS and Windows (TechSmith does not support Linux)
  const supportedPlatforms = ['macos', 'wsl', 'windows', 'gitbash'];
  if (!supportedPlatforms.includes(platform.type)) {
    return false;
  }
  if (REQUIRES_DESKTOP && !os.isDesktopAvailable()) {
    return false;
  }
  return true;
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported (and unsupported)
 * platforms have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Full support via Homebrew cask
 * - Windows: Full support via winget
 * - Git Bash: Full support via PowerShell interop to winget
 * - WSL (Ubuntu): Installs on Windows host via PowerShell interop
 *
 * Unsupported platforms (returns gracefully with message):
 * - Ubuntu/Debian: TechSmith does not provide Linux packages
 * - Raspberry Pi OS: ARM architecture + no Linux support
 * - Amazon Linux/RHEL: No Linux support from TechSmith
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
    console.log(`Snagit is not available for ${platform.type}.`);
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

// Allow direct execution: node snagit.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
