#!/usr/bin/env node

/**
 * @fileoverview Install Messenger (via Caprine, the cross-platform Facebook Messenger client).
 * @module installs/messenger
 *
 * Messenger is Meta's instant messaging platform. Since Meta does not provide official
 * desktop applications for all platforms, this installer uses Caprine, an open-source,
 * privacy-focused Facebook Messenger client that provides a native desktop experience.
 *
 * Caprine offers additional privacy features not available in the official app:
 * - Block read receipts
 * - Block typing indicators
 * - Link tracking prevention
 * - Dark mode support
 *
 * PLATFORM SUPPORT:
 * - macOS: Caprine via Homebrew cask
 * - Ubuntu/Debian: Caprine via Snap
 * - Raspberry Pi OS: Caprine via Pi-Apps (ARM-compatible build)
 * - Amazon Linux: Caprine via AppImage (requires FUSE)
 * - Windows: Caprine via winget
 * - WSL: Recommends Windows installation or opens web interface
 * - Git Bash: Caprine via winget on Windows host
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const snap = require('../utils/ubuntu/snap');
const winget = require('../utils/windows/winget');

/**
 * Whether this installer requires a desktop environment to function.
 * Messenger (Caprine) is a GUI messaging application.
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for Caprine on macOS.
 * This is the official package name in the Homebrew cask repository.
 */
const HOMEBREW_CASK_NAME = 'caprine';

/**
 * The Snap package name for Caprine on Ubuntu/Debian.
 * This is the official package name in the Snap store.
 */
const SNAP_PACKAGE_NAME = 'caprine';

/**
 * The winget package ID for Caprine on Windows.
 * Using the full package ID ensures the correct package is installed.
 */
const WINGET_PACKAGE_ID = 'Caprine.Caprine';

/**
 * The macOS application bundle name.
 * Used to verify installation by checking /Applications folder.
 */
const MACOS_APP_NAME = 'Caprine';

/**
 * The path where Caprine is installed by Pi-Apps on Raspberry Pi OS.
 * Pi-Apps installs applications to /opt by default.
 */
const PIAPPS_CAPRINE_PATH = '/opt/Caprine/caprine';

/**
 * The URL for downloading Caprine AppImage on Amazon Linux.
 * Using a specific version for stability; update as needed.
 */
const APPIMAGE_VERSION = '2.61.0';
const APPIMAGE_URL = `https://github.com/sindresorhus/caprine/releases/download/v${APPIMAGE_VERSION}/Caprine-${APPIMAGE_VERSION}.AppImage`;

/**
 * Check if Caprine is installed on macOS.
 *
 * Checks for the Caprine.app bundle in standard application directories
 * (/Applications and ~/Applications).
 *
 * @returns {boolean} True if Caprine is installed, false otherwise
 */
function isCaprineInstalledMacOS() {
  return macosApps.isAppInstalled(MACOS_APP_NAME);
}

/**
 * Check if Caprine is installed via Snap on Linux.
 *
 * Uses the snap list command to verify Caprine is in the list of installed snaps.
 *
 * @returns {Promise<boolean>} True if Caprine is installed via Snap
 */
async function isCaprineInstalledSnap() {
  return await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
}

/**
 * Check if Caprine is installed via Pi-Apps on Raspberry Pi OS.
 *
 * Checks for the existence of the Caprine executable in the Pi-Apps
 * installation directory (/opt/Caprine/).
 *
 * @returns {boolean} True if Caprine is installed via Pi-Apps
 */
function isCaprineInstalledPiApps() {
  const fs = require('fs');
  return fs.existsSync(PIAPPS_CAPRINE_PATH);
}

/**
 * Check if Caprine AppImage is installed on Amazon Linux.
 *
 * Checks for the AppImage file in the user's ~/.local/bin directory.
 *
 * @returns {boolean} True if Caprine AppImage exists
 */
function isCaprineInstalledAppImage() {
  const fs = require('fs');
  const path = require('path');
  const homeDir = os.getHomeDir();
  const appImagePath = path.join(homeDir, '.local', 'bin', 'Caprine.AppImage');
  return fs.existsSync(appImagePath);
}

/**
 * Check if Caprine is installed on Windows via winget.
 *
 * Queries winget to check if the Caprine package is in the installed list.
 *
 * @returns {Promise<boolean>} True if Caprine is installed via winget
 */
async function isCaprineInstalledWindows() {
  return await winget.isPackageInstalled(WINGET_PACKAGE_ID);
}

/**
 * Install Caprine on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * The installation uses the Homebrew cask 'caprine' which downloads and installs
 * Caprine to /Applications/Caprine.app.
 *
 * NOTE: On first launch, macOS may display a security warning. Users should
 * right-click the app and select "Open" to bypass Gatekeeper, or clear the
 * quarantine flag with: xattr -cr /Applications/Caprine.app
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Caprine (Messenger) is already installed...');

  // Check if Caprine is already installed via Homebrew cask
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Caprine is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('To launch Caprine, open it from Applications or run: open -a Caprine');
    return;
  }

  // Also check if the app exists in Applications (may have been installed manually)
  if (isCaprineInstalledMacOS()) {
    console.log('Caprine is already installed in Applications, skipping installation.');
    console.log('');
    console.log('To launch Caprine, open it from Applications or run: open -a Caprine');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Messenger (Caprine).'
    );
  }

  console.log('Installing Caprine (Messenger) via Homebrew...');

  // Install Caprine cask
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Caprine via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. If you see a quarantine warning, run:\n` +
      `     xattr -cr /Applications/Caprine.app\n` +
      `  3. Try manual installation: brew reinstall --cask caprine`
    );
  }

  console.log('Caprine (Messenger) installed successfully.');
  console.log('');
  console.log('To get started:');
  console.log('  1. Launch Caprine from Applications or run: open -a Caprine');
  console.log('  2. Log in with your Facebook account');
  console.log('  3. Configure privacy settings in Caprine > Preferences (Cmd + ,)');
  console.log('');
  console.log('Privacy features available in Caprine:');
  console.log('  - Block read receipts (prevents others from seeing when you read messages)');
  console.log('  - Block typing indicator (hides when you are typing)');
  console.log('  - Dark mode (Cmd + D to toggle)');
}

/**
 * Install Caprine on Ubuntu/Debian using Snap.
 *
 * Prerequisites:
 * - Ubuntu 18.04 or later, or Debian 10 or later (64-bit x86_64)
 * - snapd service installed and running (pre-installed on Ubuntu 16.04+)
 * - sudo privileges
 *
 * Snap handles all dependencies automatically and provides automatic updates.
 *
 * NOTE: After installation, users may need to log out and log back in, or
 * restart their terminal, for the application to appear in the application menu.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Snap is not available or installation fails
 */
async function install_ubuntu() {
  console.log('Checking if Caprine (Messenger) is already installed...');

  // Check if Caprine is already installed via Snap
  const isInstalled = await isCaprineInstalledSnap();
  if (isInstalled) {
    console.log('Caprine is already installed via Snap, skipping installation.');
    console.log('');
    console.log('To launch Caprine, run: caprine &');
    console.log('Or find "Caprine" in your application menu under Internet.');
    return;
  }

  // Verify Snap is available
  if (!snap.isInstalled()) {
    throw new Error(
      'Snap package manager is not installed.\n\n' +
      'Install snapd first using:\n' +
      '  sudo apt-get update && sudo apt-get install -y snapd\n\n' +
      'Then restart your terminal and retry installing Messenger (Caprine).'
    );
  }

  console.log('Installing Caprine (Messenger) via Snap...');

  // Install Caprine snap
  const result = await snap.install(SNAP_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Caprine via Snap.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure snapd is running: sudo systemctl status snapd\n` +
      `  2. Try manual installation: sudo snap install caprine\n` +
      `  3. If you see architecture errors, note that Snap only supports amd64 (x86_64)`
    );
  }

  console.log('Caprine (Messenger) installed successfully.');
  console.log('');
  console.log('To get started:');
  console.log('  1. Launch Caprine: caprine &');
  console.log('     Or find "Caprine" in your application menu under Internet');
  console.log('  2. Log in with your Facebook account');
  console.log('  3. Configure privacy settings in File > Preferences');
  console.log('');
  console.log('NOTE: You may need to log out and log back in for the app');
  console.log('      to appear in your application menu.');
  console.log('');
  console.log('To enable notifications, run:');
  console.log('  snap connect caprine:desktop');
  console.log('  snap connect caprine:desktop-legacy');
}

/**
 * Install Caprine on Raspberry Pi OS using Pi-Apps.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
 * - Raspberry Pi 4 or later with 2GB+ RAM (4GB recommended)
 * - sudo privileges
 * - Desktop environment configured
 *
 * The Snap version of Caprine only supports amd64 (x86_64) architecture and
 * will not work on Raspberry Pi. Pi-Apps provides ARM-compatible builds.
 *
 * NOTE: Electron apps like Caprine may be resource-intensive on Raspberry Pi.
 * Close other applications if you experience slow performance.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Pi-Apps installation fails
 */
async function install_raspbian() {
  console.log('Checking if Caprine (Messenger) is already installed...');

  // Check if Caprine is already installed via Pi-Apps
  if (isCaprineInstalledPiApps()) {
    console.log('Caprine is already installed via Pi-Apps, skipping installation.');
    console.log('');
    console.log('To launch Caprine, run: /opt/Caprine/caprine &');
    console.log('Or find "Caprine" in your application menu under Internet.');
    return;
  }

  // Check architecture and provide guidance
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  console.log(`Detected architecture: ${arch}`);

  if (arch !== 'aarch64' && arch !== 'armv7l') {
    throw new Error(
      `Unsupported architecture: ${arch}\n` +
      'Caprine installation via Pi-Apps requires ARM architecture (aarch64 or armv7l).'
    );
  }

  // Check if Pi-Apps is installed
  const fs = require('fs');
  const path = require('path');
  const homeDir = os.getHomeDir();
  const piAppsPath = path.join(homeDir, 'pi-apps', 'manage');
  const piAppsInstalled = fs.existsSync(piAppsPath);

  if (!piAppsInstalled) {
    console.log('Pi-Apps is not installed. Installing Pi-Apps first...');
    console.log('');

    // Install Pi-Apps
    const piAppsInstallResult = await shell.exec(
      'wget -qO- https://raw.githubusercontent.com/Botspot/pi-apps/master/install | bash'
    );

    if (piAppsInstallResult.code !== 0) {
      throw new Error(
        `Failed to install Pi-Apps.\n` +
        `Output: ${piAppsInstallResult.stderr}\n\n` +
        `Troubleshooting:\n` +
        `  1. Check your internet connection\n` +
        `  2. Ensure git is installed: sudo apt-get install -y git\n` +
        `  3. Try manual installation:\n` +
        `     wget -qO- https://raw.githubusercontent.com/Botspot/pi-apps/master/install | bash`
      );
    }

    console.log('Pi-Apps installed successfully.');
  }

  console.log('Installing Caprine (Messenger) via Pi-Apps...');
  console.log('This may take several minutes on Raspberry Pi...');

  // Install Caprine via Pi-Apps CLI
  const installResult = await shell.exec(
    `${path.join(homeDir, 'pi-apps', 'manage')} install Caprine`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Caprine via Pi-Apps.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Try running Pi-Apps graphically from the start menu\n` +
      `  2. Navigate to Internet > Communication > Caprine\n` +
      `  3. Check Pi-Apps logs in ~/pi-apps/logs/`
    );
  }

  // Verify installation
  if (!isCaprineInstalledPiApps()) {
    throw new Error(
      'Installation appeared to complete but Caprine was not found at /opt/Caprine/caprine.\n\n' +
      'Please try installing Caprine manually through the Pi-Apps GUI.'
    );
  }

  console.log('Caprine (Messenger) installed successfully.');
  console.log('');
  console.log('To get started:');
  console.log('  1. Launch Caprine: /opt/Caprine/caprine &');
  console.log('     Or find "Caprine" in your application menu under Internet');
  console.log('  2. Log in with your Facebook account');
  console.log('');
  console.log('Performance tips for Raspberry Pi:');
  console.log('  - Close other applications to free up memory');
  console.log('  - If graphics issues occur, try: /opt/Caprine/caprine --disable-gpu &');
  console.log('  - Ensure you have at least 2GB RAM (4GB recommended)');
}

/**
 * Install Caprine on Amazon Linux using AppImage.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - Desktop environment installed (GNOME, MATE, or similar)
 * - FUSE installed (required for AppImage)
 * - sudo privileges
 *
 * Amazon Linux is typically used as a server OS. If you need a graphical
 * Messenger client, ensure you have a desktop environment installed first.
 *
 * The AppImage is downloaded to ~/.local/bin/ and made executable.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('Checking if Caprine (Messenger) is already installed...');

  // Check if Caprine AppImage is already installed
  if (isCaprineInstalledAppImage()) {
    console.log('Caprine AppImage is already installed, skipping installation.');
    console.log('');
    console.log('To launch Caprine, run: ~/.local/bin/Caprine.AppImage &');
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

  // Check for and install FUSE (required for AppImage)
  console.log('Checking for FUSE (required for AppImage)...');

  const fuseCheckResult = await shell.exec('which fusermount');
  if (fuseCheckResult.code !== 0) {
    console.log('Installing FUSE...');

    const fuseInstallResult = await shell.exec(
      `sudo ${packageManager} install -y fuse fuse-libs`
    );

    if (fuseInstallResult.code !== 0) {
      console.log('Warning: Could not install FUSE. AppImage may not run correctly.');
      console.log('You can install FUSE manually: sudo ' + packageManager + ' install -y fuse fuse-libs');
    }
  }

  // Create ~/.local/bin directory if it doesn't exist
  const fs = require('fs');
  const path = require('path');
  const homeDir = os.getHomeDir();
  const binDir = path.join(homeDir, '.local', 'bin');

  if (!fs.existsSync(binDir)) {
    console.log(`Creating directory: ${binDir}`);
    fs.mkdirSync(binDir, { recursive: true });
  }

  const appImagePath = path.join(binDir, 'Caprine.AppImage');

  console.log('Downloading Caprine AppImage...');
  console.log(`Source: ${APPIMAGE_URL}`);

  // Download the AppImage
  const downloadResult = await shell.exec(
    `curl -L -o "${appImagePath}" "${APPIMAGE_URL}"`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      `Failed to download Caprine AppImage.\n` +
      `Output: ${downloadResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check your internet connection\n` +
      `  2. Try downloading manually:\n` +
      `     curl -L -o ~/.local/bin/Caprine.AppImage "${APPIMAGE_URL}"`
    );
  }

  // Make the AppImage executable
  console.log('Making AppImage executable...');
  const chmodResult = await shell.exec(`chmod +x "${appImagePath}"`);

  if (chmodResult.code !== 0) {
    throw new Error(
      `Failed to make AppImage executable.\n` +
      `Run: chmod +x ~/.local/bin/Caprine.AppImage`
    );
  }

  // Verify the file exists
  if (!fs.existsSync(appImagePath)) {
    throw new Error(
      'Installation appeared to complete but AppImage was not found.\n' +
      `Expected location: ${appImagePath}`
    );
  }

  // Check if ~/.local/bin is in PATH
  const pathEnv = process.env.PATH || '';
  const binDirInPath = pathEnv.includes(binDir);

  console.log('Caprine (Messenger) installed successfully.');
  console.log('');
  console.log(`Location: ${appImagePath}`);
  console.log('');
  console.log('To launch Caprine, run: ~/.local/bin/Caprine.AppImage &');
  console.log('');

  if (!binDirInPath) {
    console.log('NOTE: ~/.local/bin is not in your PATH.');
    console.log('Add it to your PATH by adding this line to ~/.bashrc:');
    console.log('  export PATH="$HOME/.local/bin:$PATH"');
    console.log('');
    console.log('Then run: source ~/.bashrc');
    console.log('');
  }

  console.log('If the AppImage fails to run, you may need to extract it:');
  console.log('  ~/.local/bin/Caprine.AppImage --appimage-extract');
  console.log('  ~/squashfs-root/caprine &');
}

/**
 * Install Caprine on Windows using winget.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later, or Windows 11
 * - winget package manager (pre-installed on Windows 10 1809+ and Windows 11)
 * - Administrator privileges recommended
 *
 * Meta has deprecated the traditional Windows desktop Messenger app in favor of
 * a Progressive Web App (PWA). Caprine provides a native desktop experience
 * with additional privacy features.
 *
 * @returns {Promise<void>}
 * @throws {Error} If winget is not available or installation fails
 */
async function install_windows() {
  console.log('Checking if Caprine (Messenger) is already installed...');

  // Check if Caprine is already installed via winget
  const isInstalled = await isCaprineInstalledWindows();
  if (isInstalled) {
    console.log('Caprine is already installed, skipping installation.');
    console.log('');
    console.log('To launch Caprine, search for "Caprine" in the Start Menu.');
    return;
  }

  // Verify winget is available
  if (!winget.isInstalled()) {
    throw new Error(
      'winget is not installed or not available.\n\n' +
      'winget should be pre-installed on Windows 10 1809+ and Windows 11.\n' +
      'If missing, install "App Installer" from the Microsoft Store:\n' +
      '  Start > Microsoft Store > Search "App Installer"\n\n' +
      'After installation, open a new terminal window and retry.'
    );
  }

  console.log('Installing Caprine (Messenger) via winget...');

  // Install Caprine
  const result = await winget.install(WINGET_PACKAGE_ID);

  if (!result.success) {
    throw new Error(
      `Failed to install Caprine via winget.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Try running as Administrator\n` +
      `  2. Update winget sources: winget source update\n` +
      `  3. Try manual installation:\n` +
      `     winget install --id Caprine.Caprine --silent --accept-package-agreements --accept-source-agreements`
    );
  }

  console.log('Caprine (Messenger) installed successfully.');
  console.log('');
  console.log('To get started:');
  console.log('  1. Search for "Caprine" in the Start Menu and launch it');
  console.log('  2. Log in with your Facebook account');
  console.log('  3. Configure privacy settings in Help > Preferences');
  console.log('');
  console.log('Privacy features available in Caprine:');
  console.log('  - Block read receipts (Ctrl + ,)');
  console.log('  - Block typing indicator');
  console.log('  - Dark mode (Ctrl + D to toggle)');
}

/**
 * Handle Messenger installation on Ubuntu running in WSL.
 *
 * WSL (Windows Subsystem for Linux) requires special handling for GUI applications.
 * This function recommends using the Windows installation of Caprine or the web
 * interface, as GUI apps in WSL require WSLg (Windows 11) or an X server.
 *
 * For WSL 2 with WSLg on Windows 11, the Linux Snap version can be installed,
 * but this requires systemd to be enabled in WSL.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('For the best experience with Messenger in WSL, you have two options:');
  console.log('');
  console.log('OPTION 1: Install Caprine on Windows (Recommended)');
  console.log('  From PowerShell or Command Prompt, run:');
  console.log('    winget install --id Caprine.Caprine --silent --accept-package-agreements --accept-source-agreements');
  console.log('');
  console.log('OPTION 2: Use the web interface');
  console.log('  Open Messenger in your Windows browser by running:');
  console.log('    wslview https://messenger.com');
  console.log('');

  // Check if wslview is available
  const wslviewCheck = shell.commandExists('wslview');

  if (wslviewCheck) {
    console.log('Opening Messenger in your Windows browser...');
    await shell.exec('wslview https://messenger.com');
  } else {
    console.log('To install wslu utilities (for wslview command):');
    console.log('  sudo apt-get update && sudo apt-get install -y wslu');
    console.log('');
    console.log('Then you can open Messenger with: wslview https://messenger.com');
  }

  console.log('');
  console.log('NOTE: If you want to run Linux GUI apps in WSL (Windows 11 with WSLg):');
  console.log('  1. Enable systemd in /etc/wsl.conf:');
  console.log('     [boot]');
  console.log('     systemd=true');
  console.log('  2. Restart WSL: wsl --shutdown (from PowerShell)');
  console.log('  3. Install Caprine via Snap: sudo snap install caprine');
}

/**
 * Install Caprine from Git Bash on Windows.
 *
 * Git Bash runs within the Windows environment, so this function installs
 * Caprine on the Windows host using winget via the winget.exe command.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later, or Windows 11
 * - Git Bash installed (comes with Git for Windows)
 * - winget available on Windows
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Caprine (Messenger) on the Windows host...');
  console.log('');

  // Check if Caprine is already installed
  const checkResult = await shell.exec(
    'winget.exe list --id Caprine.Caprine'
  );

  if (checkResult.code === 0 && checkResult.stdout.includes('Caprine')) {
    console.log('Caprine is already installed, skipping installation.');
    console.log('');
    console.log('To launch Caprine, search for "Caprine" in the Start Menu.');
    console.log('Or from Git Bash: start "" "Caprine"');
    return;
  }

  // Check if winget is available
  const wingetCheck = await shell.exec('winget.exe --version');
  if (wingetCheck.code !== 0) {
    throw new Error(
      'winget.exe is not available from Git Bash.\n\n' +
      'Ensure winget is installed on Windows:\n' +
      '  1. Open PowerShell as Administrator\n' +
      '  2. If winget is missing, install "App Installer" from Microsoft Store\n\n' +
      'Then retry the installation from Git Bash.'
    );
  }

  console.log('Installing Caprine via winget...');

  const installResult = await shell.exec(
    'winget.exe install --id Caprine.Caprine --silent --accept-package-agreements --accept-source-agreements'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Caprine.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Try running Git Bash as Administrator\n` +
      `  2. Install from PowerShell instead:\n` +
      `     winget install --id Caprine.Caprine --silent --accept-package-agreements --accept-source-agreements`
    );
  }

  console.log('Caprine (Messenger) installed successfully.');
  console.log('');
  console.log('To get started:');
  console.log('  1. Search for "Caprine" in the Windows Start Menu');
  console.log('  2. Or from Git Bash: start "" "Caprine"');
  console.log('  3. Log in with your Facebook account');
  console.log('');
  console.log('To open the web interface instead:');
  console.log('  start https://messenger.com');
}

/**
 * Check if Messenger (Caprine) is installed on the current platform.
 *
 * On macOS, checks if Caprine cask is installed via Homebrew.
 * On Windows, checks if Caprine is installed via winget.
 * On Ubuntu/Debian, checks if Caprine is installed via Snap.
 * On Raspberry Pi, checks if Caprine is installed via Pi-Apps.
 * On Amazon Linux, checks for AppImage.
 *
 * @returns {Promise<boolean>} True if installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    return brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  }

  if (platform.type === 'windows' || platform.type === 'gitbash') {
    return winget.isPackageInstalled(WINGET_PACKAGE_ID);
  }

  if (platform.type === 'ubuntu' || platform.type === 'debian') {
    return snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  }

  if (platform.type === 'raspbian') {
    return isCaprineInstalledPiApps();
  }

  if (platform.type === 'amazon_linux' || platform.type === 'rhel' || platform.type === 'fedora') {
    return isCaprineInstalledAppImage();
  }

  // WSL: Check for Snap installation
  if (platform.type === 'wsl') {
    return snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  }

  return false;
}

/**
 * Check if this installer is supported on the current platform.
 * Messenger (Caprine) is supported on all major platforms.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  const supportedPlatforms = ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'];
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
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Caprine via Homebrew cask
 * - Ubuntu/Debian: Caprine via Snap
 * - Raspberry Pi OS: Caprine via Pi-Apps
 * - Amazon Linux/RHEL: Caprine via AppImage
 * - Windows: Caprine via winget
 * - WSL (Ubuntu): Recommends Windows installation or web interface
 * - Git Bash: Caprine via winget on Windows host
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases (e.g., debian maps to ubuntu for Snap installation)
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
    console.log(`Messenger (Caprine) is not available for ${platform.type}.`);
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

// Allow direct execution: node messenger.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
