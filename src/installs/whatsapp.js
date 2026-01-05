#!/usr/bin/env node

/**
 * @fileoverview Install WhatsApp.
 * @module installs/whatsapp
 *
 * WhatsApp is a cross-platform messaging application owned by Meta that allows
 * users to send text messages, make voice and video calls, share files and media,
 * and communicate with contacts worldwide. WhatsApp uses end-to-end encryption
 * for private communications and syncs messages across linked devices.
 *
 * This installer provides:
 * - Official WhatsApp Desktop for macOS via Homebrew cask
 * - Official WhatsApp Desktop for Windows via winget
 * - WhatsApp for Linux (unofficial client) for Ubuntu/Debian via Flatpak
 * - WhatsApp for Linux for Amazon Linux/RHEL via Flatpak
 * - Instructions to launch Windows WhatsApp from WSL/Git Bash
 *
 * IMPORTANT PLATFORM NOTES:
 * - Raspberry Pi OS: No official or unofficial WhatsApp desktop application is
 *   available for ARM architecture. Users should access WhatsApp Web via browser.
 * - Linux (Ubuntu, Amazon Linux): Meta does not provide an official desktop
 *   application. This installer uses WhatsApp for Linux, an open-source unofficial
 *   client that wraps WhatsApp Web in a native desktop application.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const winget = require('../utils/windows/winget');

/**
 * The Homebrew cask name for WhatsApp on macOS.
 * This installs the official Meta WhatsApp desktop application to /Applications.
 */
const HOMEBREW_CASK_NAME = 'whatsapp';

/**
 * The winget package ID for WhatsApp on Windows.
 * This is the official Meta WhatsApp application from the Microsoft Store.
 */
const WINGET_PACKAGE_ID = 'WhatsApp.WhatsApp';

/**
 * The Flatpak application ID for WhatsApp for Linux.
 * This is an unofficial open-source client that wraps WhatsApp Web.
 */
const FLATPAK_APP_ID = 'com.github.eneshecan.WhatsAppForLinux';

/**
 * Check if WhatsApp Desktop application is installed on macOS.
 *
 * Looks for WhatsApp.app in /Applications or ~/Applications using the
 * macosApps utility which handles common variations of app names.
 *
 * @returns {boolean} True if WhatsApp.app exists, false otherwise
 */
function isWhatsAppInstalledMacOS() {
  return macosApps.isAppInstalled('WhatsApp');
}

/**
 * Check if Flatpak is installed and available on the system.
 *
 * Flatpak is required for installing WhatsApp for Linux on Ubuntu and
 * Amazon Linux since Meta does not provide official Linux packages.
 *
 * @returns {boolean} True if flatpak command exists, false otherwise
 */
function isFlatpakInstalled() {
  return shell.commandExists('flatpak');
}

/**
 * Check if WhatsApp for Linux is installed via Flatpak.
 *
 * Queries Flatpak to see if the WhatsApp for Linux application has been
 * installed from Flathub.
 *
 * @returns {Promise<boolean>} True if WhatsApp for Linux is installed, false otherwise
 */
async function isWhatsAppFlatpakInstalled() {
  if (!isFlatpakInstalled()) {
    return false;
  }

  const result = await shell.exec(`flatpak list | grep -i "${FLATPAK_APP_ID}"`);
  return result.code === 0 && result.stdout.trim().length > 0;
}

/**
 * Install WhatsApp Desktop on macOS using Homebrew cask.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * The installation uses the Homebrew cask 'whatsapp' which downloads and installs
 * the official Meta WhatsApp desktop application to /Applications/WhatsApp.app.
 *
 * NOTE: After installation, WhatsApp must be launched manually. On first launch,
 * it will display a QR code that must be scanned using the WhatsApp mobile app
 * to link the desktop client.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if WhatsApp is already installed...');

  // Check if WhatsApp.app already exists in Applications
  if (isWhatsAppInstalledMacOS()) {
    console.log('WhatsApp is already installed, skipping installation.');
    return;
  }

  // Also check if the cask is installed via Homebrew
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('WhatsApp is already installed via Homebrew, skipping installation.');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing WhatsApp.'
    );
  }

  console.log('Installing WhatsApp via Homebrew...');

  // Install WhatsApp cask with quiet flag for cleaner output
  // The --quiet flag suppresses non-essential output for automation-friendly installation
  const result = await shell.exec('brew install --quiet --cask whatsapp');

  if (result.code !== 0) {
    throw new Error(
      `Failed to install WhatsApp via Homebrew.\n` +
      `Output: ${result.stderr || result.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Check if macOS version is 12 (Monterey) or later\n` +
      `  3. Try manual installation: brew reinstall --cask whatsapp`
    );
  }

  // Verify installation succeeded by checking if app now exists
  if (!isWhatsAppInstalledMacOS()) {
    throw new Error(
      'Installation command completed but WhatsApp.app was not found in Applications.\n\n' +
      'Please try:\n' +
      '  1. Check /Applications for WhatsApp.app\n' +
      '  2. Run: brew reinstall --cask whatsapp'
    );
  }

  console.log('WhatsApp installed successfully.');
  console.log('');
  console.log('To launch WhatsApp:');
  console.log('  - Open from Applications folder, or');
  console.log('  - Run: open -a WhatsApp');
  console.log('');
  console.log('On first launch, you will need to scan the QR code using your');
  console.log('phone\'s WhatsApp app: Settings > Linked Devices > Link a Device');
}

/**
 * Install WhatsApp for Linux on Ubuntu/Debian using Flatpak.
 *
 * Prerequisites:
 * - Ubuntu 18.04 or later, or Debian 10 (Buster) or later (64-bit x86_64)
 * - sudo privileges
 * - Internet connectivity
 *
 * IMPORTANT: Meta does not provide an official WhatsApp desktop application for
 * Linux. This function installs WhatsApp for Linux, an open-source unofficial
 * client that provides a native desktop experience by wrapping WhatsApp Web.
 *
 * The installation process:
 * 1. Installs Flatpak if not already available
 * 2. Adds the Flathub repository
 * 3. Installs WhatsApp for Linux from Flathub
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu() {
  console.log('Checking if WhatsApp for Linux is already installed...');

  // Check if WhatsApp for Linux is already installed via Flatpak
  const isInstalled = await isWhatsAppFlatpakInstalled();
  if (isInstalled) {
    console.log('WhatsApp for Linux is already installed, skipping installation.');
    return;
  }

  console.log('');
  console.log('NOTE: Meta does not provide an official WhatsApp desktop app for Linux.');
  console.log('Installing WhatsApp for Linux - an unofficial open-source client.');
  console.log('');

  // Step 1: Ensure Flatpak is installed
  if (!isFlatpakInstalled()) {
    console.log('Installing Flatpak...');
    const flatpakResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y flatpak'
    );

    if (flatpakResult.code !== 0) {
      throw new Error(
        'Failed to install Flatpak.\n' +
        `Output: ${flatpakResult.stderr}\n\n` +
        'Please try manually:\n' +
        '  sudo apt-get update && sudo apt-get install -y flatpak'
      );
    }
  }

  // Step 2: Add Flathub repository (idempotent with --if-not-exists)
  console.log('Adding Flathub repository...');
  const flathubResult = await shell.exec(
    'flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo'
  );

  if (flathubResult.code !== 0) {
    throw new Error(
      'Failed to add Flathub repository.\n' +
      `Output: ${flathubResult.stderr}\n\n` +
      'Please try manually:\n' +
      '  flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo'
    );
  }

  // Step 3: Install WhatsApp for Linux
  console.log('Installing WhatsApp for Linux via Flatpak...');
  console.log('This may take a few minutes...');

  const installResult = await shell.exec(
    `flatpak install -y flathub ${FLATPAK_APP_ID}`
  );

  if (installResult.code !== 0) {
    throw new Error(
      'Failed to install WhatsApp for Linux via Flatpak.\n' +
      `Output: ${installResult.stderr || installResult.stdout}\n\n` +
      'Troubleshooting:\n' +
      '  1. Ensure Flathub is added: flatpak remote-list\n' +
      `  2. Try manual installation: flatpak install -y flathub ${FLATPAK_APP_ID}`
    );
  }

  // Verify installation
  const verifyInstalled = await isWhatsAppFlatpakInstalled();
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but WhatsApp for Linux was not found.\n\n' +
      'Please try:\n' +
      '  1. Run: flatpak list | grep -i whatsapp\n' +
      `  2. Retry: flatpak install -y flathub ${FLATPAK_APP_ID}`
    );
  }

  console.log('WhatsApp for Linux installed successfully.');
  console.log('');
  console.log('To launch WhatsApp for Linux:');
  console.log(`  - Run: flatpak run ${FLATPAK_APP_ID} &`);
  console.log('  - Or find "WhatsApp for Linux" in your application menu');
  console.log('');
  console.log('NOTE: You may need to log out and log back in for the application');
  console.log('to appear in your application menu.');
  console.log('');
  console.log('On first launch, you will need to scan the QR code using your');
  console.log('phone\'s WhatsApp app: Settings > Linked Devices > Link a Device');
}

/**
 * Install WhatsApp on Raspberry Pi OS.
 *
 * PLATFORM LIMITATION: WhatsApp does not provide native ARM packages. Neither
 * the official WhatsApp desktop application nor WhatsApp for Linux are available
 * for ARM architecture used by Raspberry Pi devices.
 *
 * This function gracefully informs the user that WhatsApp is not available for
 * Raspberry Pi and suggests using WhatsApp Web via a browser instead.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('WhatsApp is not available for Raspberry Pi OS.');
  return;
}

/**
 * Install WhatsApp for Linux on Amazon Linux/RHEL using Flatpak.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, RHEL 8/9, or Fedora (64-bit x86_64)
 * - sudo privileges
 * - Graphical desktop environment (required for WhatsApp GUI)
 *
 * IMPORTANT: Meta does not provide an official WhatsApp desktop application for
 * any Linux distribution. For systems with a desktop environment, this function
 * installs WhatsApp for Linux via Flatpak.
 *
 * Amazon Linux is typically used as a server OS. If running on a headless server,
 * use WhatsApp Web at https://web.whatsapp.com instead.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('Checking if WhatsApp for Linux is already installed...');

  // Check if WhatsApp for Linux is already installed via Flatpak
  const isInstalled = await isWhatsAppFlatpakInstalled();
  if (isInstalled) {
    console.log('WhatsApp for Linux is already installed, skipping installation.');
    return;
  }

  console.log('');
  console.log('NOTE: Meta does not provide an official WhatsApp desktop app for Linux.');
  console.log('Installing WhatsApp for Linux - an unofficial open-source client.');
  console.log('');

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

  // Step 1: Install Flatpak if not already installed
  if (!isFlatpakInstalled()) {
    console.log(`Installing Flatpak via ${packageManager}...`);
    const flatpakResult = await shell.exec(`sudo ${packageManager} install -y flatpak`);

    if (flatpakResult.code !== 0) {
      throw new Error(
        'Failed to install Flatpak.\n' +
        `Output: ${flatpakResult.stderr}\n\n` +
        `Please try manually:\n` +
        `  sudo ${packageManager} install -y flatpak`
      );
    }
  }

  // Step 2: Add Flathub repository (idempotent with --if-not-exists)
  console.log('Adding Flathub repository...');
  const flathubResult = await shell.exec(
    'flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo'
  );

  if (flathubResult.code !== 0) {
    throw new Error(
      'Failed to add Flathub repository.\n' +
      `Output: ${flathubResult.stderr}\n\n` +
      'Please try manually:\n' +
      '  flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo'
    );
  }

  // Step 3: Install WhatsApp for Linux
  console.log('Installing WhatsApp for Linux via Flatpak...');
  console.log('This may take a few minutes...');

  const installResult = await shell.exec(
    `flatpak install -y flathub ${FLATPAK_APP_ID}`
  );

  if (installResult.code !== 0) {
    throw new Error(
      'Failed to install WhatsApp for Linux via Flatpak.\n' +
      `Output: ${installResult.stderr || installResult.stdout}\n\n` +
      'Troubleshooting:\n' +
      '  1. Ensure Flathub is added: flatpak remote-list\n' +
      `  2. Try manual installation: flatpak install -y flathub ${FLATPAK_APP_ID}`
    );
  }

  // Verify installation
  const verifyInstalled = await isWhatsAppFlatpakInstalled();
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but WhatsApp for Linux was not found.\n\n' +
      'Please try:\n' +
      '  1. Run: flatpak list | grep -i whatsapp\n' +
      `  2. Retry: flatpak install -y flathub ${FLATPAK_APP_ID}`
    );
  }

  console.log('WhatsApp for Linux installed successfully.');
  console.log('');
  console.log('To launch WhatsApp for Linux:');
  console.log(`  - Run: flatpak run ${FLATPAK_APP_ID} &`);
  console.log('  - Or find "WhatsApp for Linux" in your application menu');
  console.log('');
  console.log('NOTE: WhatsApp for Linux requires a graphical desktop environment.');
  console.log('If running on a headless server, use WhatsApp Web at:');
  console.log('  https://web.whatsapp.com');
}

/**
 * Install WhatsApp on Windows using winget.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later, or Windows 11
 * - winget package manager (pre-installed on Windows 10 1809+ and Windows 11)
 * - Administrator privileges recommended
 *
 * The installation uses winget to install the official Meta WhatsApp application.
 * This is the same application available from the Microsoft Store.
 *
 * NOTE: After installation, WhatsApp can be launched from the Start Menu or
 * via the 'whatsapp:' protocol handler.
 *
 * @returns {Promise<void>}
 * @throws {Error} If winget is not available or installation fails
 */
async function install_windows() {
  console.log('Checking if WhatsApp is already installed...');

  // Check if WhatsApp is already installed via winget
  const isInstalled = await winget.isPackageInstalled(WINGET_PACKAGE_ID);
  if (isInstalled) {
    console.log('WhatsApp is already installed, skipping installation.');
    return;
  }

  // Verify winget is available
  if (!winget.isInstalled()) {
    throw new Error(
      'winget is not available. winget should be pre-installed on Windows 10 1809+.\n\n' +
      'If winget is not available, install App Installer from the Microsoft Store:\n' +
      '  1. Open Microsoft Store\n' +
      '  2. Search for "App Installer"\n' +
      '  3. Install or update the App Installer package\n\n' +
      'Then retry installing WhatsApp.'
    );
  }

  console.log('Installing WhatsApp via winget...');
  console.log('This may take a few minutes...');

  // Install WhatsApp using winget with silent mode and agreement acceptance
  const result = await winget.install(WINGET_PACKAGE_ID);

  if (!result.success) {
    throw new Error(
      `Failed to install WhatsApp via winget.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Check if winget is available: winget --version\n` +
      `  3. Try manual installation: winget install --id ${WINGET_PACKAGE_ID} --silent --accept-package-agreements --accept-source-agreements`
    );
  }

  // Verify installation
  const verifyInstalled = await winget.isPackageInstalled(WINGET_PACKAGE_ID);
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but WhatsApp was not found.\n\n' +
      'Please try:\n' +
      `  1. Run: winget list --id ${WINGET_PACKAGE_ID}\n` +
      `  2. Retry: winget install --id ${WINGET_PACKAGE_ID}`
    );
  }

  console.log('WhatsApp installed successfully.');
  console.log('');
  console.log('To launch WhatsApp:');
  console.log('  - Open from Start Menu, or');
  console.log('  - Run: start whatsapp:');
  console.log('');
  console.log('On first launch, you will need to scan the QR code using your');
  console.log('phone\'s WhatsApp app: Settings > Linked Devices > Link a Device');
}

/**
 * Install WhatsApp when running from Ubuntu on WSL (Windows Subsystem for Linux).
 *
 * PLATFORM APPROACH: WhatsApp is installed on the Windows host and accessed from
 * WSL. This is the recommended approach because:
 * 1. WhatsApp for Linux via Flatpak has limited WSL support
 * 2. The Windows WhatsApp app provides a better experience
 * 3. Windows interoperability allows launching Windows apps from WSL
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - winget available on Windows host
 *
 * This function installs WhatsApp on the Windows host via winget.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation on Windows host fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Installing WhatsApp on the Windows host...');
  console.log('');

  // Check if WhatsApp is already available on Windows host
  const whatsappCheck = await shell.exec(
    `winget.exe list --id "${WINGET_PACKAGE_ID}" 2>/dev/null`
  );
  if (whatsappCheck.code === 0 && whatsappCheck.stdout.includes(WINGET_PACKAGE_ID)) {
    console.log('WhatsApp is already installed on Windows, skipping installation.');
    console.log('');
    console.log('To launch WhatsApp from WSL:');
    console.log('  cmd.exe /c start whatsapp:');
    return;
  }

  console.log('Installing WhatsApp via winget on Windows...');
  console.log('This may take a few minutes...');

  // Install via winget on Windows host
  const installResult = await shell.exec(
    `winget.exe install --id "${WINGET_PACKAGE_ID}" --silent --accept-package-agreements --accept-source-agreements`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install WhatsApp on Windows host.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure winget is available on Windows\n` +
      `  2. Open an Administrator PowerShell on Windows and run:\n` +
      `     winget install --id ${WINGET_PACKAGE_ID} --silent\n` +
      `  3. Then launch from WSL with: cmd.exe /c start whatsapp:`
    );
  }

  console.log('WhatsApp installed successfully on Windows.');
  console.log('');
  console.log('To launch WhatsApp from WSL:');
  console.log('  cmd.exe /c start whatsapp:');
  console.log('');
  console.log('Alternative - open WhatsApp Web in browser:');
  console.log('  cmd.exe /c start https://web.whatsapp.com');
  console.log('');
  console.log('TIP: Add an alias to ~/.bashrc for convenience:');
  console.log('  echo \'alias whatsapp="cmd.exe /c start whatsapp:"\' >> ~/.bashrc');
}

/**
 * Install WhatsApp from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs WhatsApp on the
 * Windows host using winget. Git Bash can directly execute Windows commands
 * including winget.exe.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later, or Windows 11
 * - Git Bash installed (comes with Git for Windows)
 * - winget available (pre-installed on supported Windows versions)
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing WhatsApp on the Windows host...');
  console.log('');

  // Check if WhatsApp is already installed
  const whatsappCheck = await shell.exec(
    `winget.exe list --id "${WINGET_PACKAGE_ID}" 2>/dev/null`
  );
  if (whatsappCheck.code === 0 && whatsappCheck.stdout.includes(WINGET_PACKAGE_ID)) {
    console.log('WhatsApp is already installed, skipping installation.');
    console.log('');
    console.log('To launch WhatsApp:');
    console.log('  start whatsapp:');
    return;
  }

  console.log('Installing WhatsApp via winget...');
  console.log('This may take a few minutes...');

  // Install via winget
  const installResult = await shell.exec(
    `winget.exe install --id "${WINGET_PACKAGE_ID}" --silent --accept-package-agreements --accept-source-agreements`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install WhatsApp.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure winget is available: winget.exe --version\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell:\n` +
      `     winget install --id ${WINGET_PACKAGE_ID} --silent`
    );
  }

  console.log('WhatsApp installed successfully.');
  console.log('');
  console.log('To launch WhatsApp from Git Bash:');
  console.log('  start whatsapp:');
  console.log('');
  console.log('Or use the explicit Windows command:');
  console.log('  cmd //c "start whatsapp:"');
}

/**
 * Check if this installer is supported on the current platform.
 * WhatsApp is supported on all major platforms except Raspberry Pi OS.
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
 * - macOS: Official WhatsApp Desktop via Homebrew cask
 * - Ubuntu/Debian: WhatsApp for Linux (unofficial) via Flatpak
 * - Raspberry Pi OS: Not supported (graceful message)
 * - Amazon Linux/RHEL: WhatsApp for Linux (unofficial) via Flatpak
 * - Windows: Official WhatsApp via winget
 * - WSL (Ubuntu): Installs WhatsApp on Windows host
 * - Git Bash: Installs WhatsApp on Windows host
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
    console.log(`WhatsApp is not available for ${platform.type}.`);
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

// Allow direct execution: node whatsapp.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
