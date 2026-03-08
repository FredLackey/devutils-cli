#!/usr/bin/env node

/**
 * @fileoverview Install Draw.io (diagrams.net) Desktop Application.
 * @module installs/drawio
 *
 * Draw.io is a free, open-source diagramming application for creating
 * flowcharts, process diagrams, org charts, UML diagrams, ER diagrams,
 * network diagrams, and more. The desktop application is built on Electron
 * and provides a security-first approach where all diagram data remains
 * local - no data is ever sent externally.
 *
 * Key features:
 * - Offline-first: Works completely offline after installation
 * - Privacy-focused: No analytics or external data transmission
 * - Cross-platform: Available for macOS, Windows, and Linux
 * - Free and open-source: Licensed under Apache 2.0
 *
 * IMPORTANT PLATFORM NOTES:
 * - macOS: Installs Draw.io Desktop via Homebrew cask
 * - Windows: Installs Draw.io Desktop via Chocolatey
 * - Ubuntu/Debian: Installs Draw.io via Snap
 * - Raspberry Pi OS: Installs via Snap or ARM64 .deb package
 * - Amazon Linux: Installs via RPM package from GitHub releases
 * - WSL: Installs via Snap (requires X11 server on Windows host)
 * - Git Bash: Installs portable Windows version
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const snap = require('../utils/ubuntu/snap');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Whether this installer requires a desktop environment to function.
 * Draw.io is a GUI diagramming application.
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for Draw.io Desktop on macOS.
 * @constant {string}
 */
const HOMEBREW_CASK_NAME = 'drawio';

/**
 * The Chocolatey package name for Draw.io on Windows.
 * @constant {string}
 */
const CHOCO_PACKAGE_NAME = 'drawio';

/**
 * The Snap package name for Draw.io on Linux.
 * @constant {string}
 */
const SNAP_PACKAGE_NAME = 'drawio';

/**
 * The macOS application name as it appears in /Applications.
 * @constant {string}
 */
const MACOS_APP_NAME = 'draw.io';

/**
 * The Windows executable path after installation.
 * @constant {string}
 */
const WINDOWS_EXE_PATH = 'C:\\Program Files\\draw.io\\draw.io.exe';

/**
 * GitHub API URL for fetching the latest Draw.io release.
 * Used for downloading .deb and .rpm packages directly.
 * @constant {string}
 */
const GITHUB_RELEASES_API = 'https://api.github.com/repos/jgraph/drawio-desktop/releases/latest';

/**
 * Check if Draw.io is installed on macOS by looking for the application bundle.
 *
 * This function checks both /Applications and ~/Applications directories
 * for the draw.io.app bundle.
 *
 * @returns {boolean} True if Draw.io is installed, false otherwise
 */
function isInstalledMacOS() {
  return macosApps.isAppInstalled(MACOS_APP_NAME);
}

/**
 * Check if Draw.io is installed via Snap on Linux systems.
 *
 * This function queries the Snap package manager to determine
 * if the drawio snap is installed.
 *
 * @returns {Promise<boolean>} True if Draw.io snap is installed, false otherwise
 */
async function isInstalledSnap() {
  return await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
}

/**
 * Check if Draw.io is installed via dpkg on Debian-based systems.
 *
 * This is used as a fallback check for systems where Draw.io was
 * installed via .deb package rather than Snap.
 *
 * @returns {Promise<boolean>} True if Draw.io deb package is installed, false otherwise
 */
async function isInstalledDeb() {
  const result = await shell.exec('dpkg -l | grep -i drawio 2>/dev/null');
  return result.code === 0 && result.stdout.includes('drawio');
}

/**
 * Check if Draw.io is installed via RPM on RHEL-based systems.
 *
 * This function queries the RPM database to check if Draw.io
 * was installed from the .rpm package.
 *
 * @returns {Promise<boolean>} True if Draw.io RPM is installed, false otherwise
 */
async function isInstalledRpm() {
  const result = await shell.exec('rpm -qa | grep -i drawio 2>/dev/null');
  return result.code === 0 && result.stdout.includes('drawio');
}

/**
 * Check if Draw.io is installed on Windows via Chocolatey.
 *
 * @returns {Promise<boolean>} True if Draw.io is installed via Chocolatey, false otherwise
 */
async function isInstalledChoco() {
  return await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
}

/**
 * Check if Draw.io executable exists on Windows.
 *
 * This is a fallback check for cases where Draw.io was installed
 * without using Chocolatey.
 *
 * @returns {Promise<boolean>} True if the Draw.io executable exists, false otherwise
 */
async function isInstalledWindowsExe() {
  const fs = require('fs');
  return fs.existsSync(WINDOWS_EXE_PATH);
}

/**
 * Get the version of Draw.io installed via Snap.
 *
 * @returns {Promise<string|null>} The installed version, or null if not installed
 */
async function getSnapVersion() {
  return await snap.getSnapVersion(SNAP_PACKAGE_NAME);
}

/**
 * Install Draw.io Desktop on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * The installation uses the Homebrew cask 'drawio' which downloads and installs
 * Draw.io Desktop to /Applications/draw.io.app. Homebrew automatically detects
 * your processor architecture and installs the appropriate version.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Draw.io is already installed...');

  // Check if Draw.io is already installed via application bundle
  if (isInstalledMacOS()) {
    const version = macosApps.getAppVersion(MACOS_APP_NAME);
    if (version) {
      console.log(`Draw.io ${version} is already installed, skipping installation.`);
    } else {
      console.log('Draw.io is already installed, skipping installation.');
    }
    return;
  }

  // Also check if the cask is installed (app may exist in non-standard location)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Draw.io is already installed via Homebrew, skipping installation.');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Draw.io.'
    );
  }

  console.log('Installing Draw.io Desktop via Homebrew...');

  // Install Draw.io cask
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Draw.io via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Search for the cask: brew search drawio\n` +
      `  3. Try manual installation: brew reinstall --cask drawio`
    );
  }

  // Verify installation succeeded
  if (!isInstalledMacOS()) {
    throw new Error(
      'Installation appeared to complete but Draw.io was not found.\n\n' +
      'Please try launching Draw.io from Applications or run:\n' +
      '  open -a "draw.io"'
    );
  }

  console.log('Draw.io Desktop installed successfully.');
  console.log('');
  console.log('To launch Draw.io:');
  console.log('  - Open from Applications folder');
  console.log('  - Or run: open -a "draw.io"');
}

/**
 * Install Draw.io on Ubuntu/Debian using Snap.
 *
 * Prerequisites:
 * - Ubuntu 16.04 LTS or later, or Debian 9 or later
 * - snapd package manager (pre-installed on Ubuntu 16.04+)
 * - sudo privileges
 *
 * Snap is the recommended installation method for Ubuntu/Debian as it
 * provides automatic updates and consistent behavior across distributions.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu() {
  console.log('Checking if Draw.io is already installed...');

  // Check if already installed via Snap
  if (await isInstalledSnap()) {
    const version = await getSnapVersion();
    if (version) {
      console.log(`Draw.io ${version} is already installed via Snap, skipping installation.`);
    } else {
      console.log('Draw.io is already installed via Snap, skipping installation.');
    }
    return;
  }

  // Also check if installed via .deb package
  if (await isInstalledDeb()) {
    console.log('Draw.io is already installed via deb package, skipping installation.');
    return;
  }

  // Ensure snapd is installed
  if (!snap.isInstalled()) {
    console.log('Installing snapd package manager...');
    const snapdResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd'
    );
    if (snapdResult.code !== 0) {
      throw new Error(
        `Failed to install snapd.\n` +
        `Output: ${snapdResult.stderr}\n\n` +
        `Please try installing snapd manually:\n` +
        `  sudo apt-get update && sudo apt-get install -y snapd`
      );
    }
  }

  console.log('Installing Draw.io via Snap...');

  // Install Draw.io snap
  const result = await snap.install(SNAP_PACKAGE_NAME);

  if (!result.success) {
    // Snap installation failed - provide guidance
    throw new Error(
      `Failed to install Draw.io via Snap.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure snapd is running: sudo systemctl start snapd\n` +
      `  2. If on a minimal install, enable systemd for snaps\n` +
      `  3. Check architecture support: snap info drawio`
    );
  }

  // Verify installation
  if (!(await isInstalledSnap())) {
    throw new Error(
      'Installation appeared to complete but Draw.io was not found.\n\n' +
      'Please verify with: snap list drawio'
    );
  }

  const installedVersion = await getSnapVersion();
  if (installedVersion) {
    console.log(`Draw.io ${installedVersion} installed successfully.`);
  } else {
    console.log('Draw.io installed successfully.');
  }
  console.log('');
  console.log('To launch Draw.io:');
  console.log('  - Run: drawio');
  console.log('  - Or find it in your application menu');
}

/**
 * Install Draw.io on Raspberry Pi OS.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
 * - Raspberry Pi 3B+ or later (64-bit capable hardware)
 * - At least 2 GB RAM
 * - sudo privileges
 *
 * This function first attempts Snap installation, then falls back to
 * the ARM64 .deb package from GitHub releases if Snap is not available
 * or does not support the architecture.
 *
 * IMPORTANT: Draw.io Desktop is an Electron application which can be
 * resource-intensive. Ensure adequate RAM is available.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails on 64-bit systems
 */
async function install_raspbian() {
  console.log('Checking if Draw.io is already installed...');

  // Check if already installed via Snap
  if (await isInstalledSnap()) {
    const version = await getSnapVersion();
    if (version) {
      console.log(`Draw.io ${version} is already installed via Snap, skipping installation.`);
    } else {
      console.log('Draw.io is already installed via Snap, skipping installation.');
    }
    return;
  }

  // Check if installed via .deb package
  if (await isInstalledDeb()) {
    console.log('Draw.io is already installed via deb package, skipping installation.');
    return;
  }

  // Check architecture
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();

  // 32-bit ARM is not supported
  if (arch === 'armv7l' || arch === 'armhf') {
    console.log('Draw.io Desktop is not available for 32-bit Raspberry Pi OS.');
    console.log('');
    console.log('Alternative: Use the web version at https://app.diagrams.net');
    console.log('The web application provides the same functionality as the desktop app.');
    return;
  }

  console.log(`Detected architecture: ${arch}`);

  // Try Snap installation first (for 64-bit systems)
  if (snap.isInstalled()) {
    console.log('Attempting installation via Snap...');
    const snapResult = await snap.install(SNAP_PACKAGE_NAME);

    if (snapResult.success) {
      const installedVersion = await getSnapVersion();
      if (installedVersion) {
        console.log(`Draw.io ${installedVersion} installed successfully via Snap.`);
      } else {
        console.log('Draw.io installed successfully via Snap.');
      }
      console.log('');
      console.log('To launch Draw.io:');
      console.log('  - Run: drawio');
      console.log('  - Or find it in your application menu');
      return;
    }

    console.log('Snap installation failed, falling back to .deb package...');
  }

  // Fallback: Install from ARM64 .deb package
  console.log('Installing Draw.io from ARM64 .deb package...');

  // Download the latest ARM64 .deb package from GitHub releases
  console.log('Downloading latest Draw.io ARM64 package from GitHub...');
  const downloadResult = await shell.exec(
    `curl -s ${GITHUB_RELEASES_API} | ` +
    `grep "browser_download_url.*arm64.*\\.deb" | ` +
    `cut -d '"' -f 4 | ` +
    `xargs -I {} curl -L -o /tmp/drawio-arm64.deb {}`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      `Failed to download Draw.io ARM64 package.\n` +
      `Output: ${downloadResult.stderr}\n\n` +
      `Please check your internet connection and try again.\n` +
      `Alternatively, download manually from:\n` +
      `  https://github.com/jgraph/drawio-desktop/releases`
    );
  }

  // Update apt cache and install the package
  console.log('Installing downloaded package...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/drawio-arm64.deb'
  );

  if (installResult.code !== 0) {
    // Try fixing dependencies and retrying
    console.log('Attempting to fix dependencies...');
    await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -f');
    const retryResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/drawio-arm64.deb'
    );

    if (retryResult.code !== 0) {
      throw new Error(
        `Failed to install Draw.io .deb package.\n` +
        `Output: ${retryResult.stderr}\n\n` +
        `Troubleshooting:\n` +
        `  1. Run: sudo apt-get install -f\n` +
        `  2. Check for missing dependencies\n` +
        `  3. Ensure you have enough disk space`
      );
    }
  }

  // Clean up downloaded file
  await shell.exec('rm -f /tmp/drawio-arm64.deb');

  // Verify installation
  if (!(await isInstalledDeb())) {
    throw new Error(
      'Installation appeared to complete but Draw.io was not found.\n\n' +
      'Please verify with: dpkg -l | grep drawio'
    );
  }

  console.log('Draw.io installed successfully.');
  console.log('');
  console.log('To launch Draw.io:');
  console.log('  - Run: drawio');
  console.log('  - Or find it in your application menu');
  console.log('');
  console.log('NOTE: Draw.io is an Electron app which may be resource-intensive.');
  console.log('For best performance, ensure at least 2 GB RAM is available.');
}

/**
 * Install Draw.io on Amazon Linux/RHEL using RPM from GitHub releases.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - sudo privileges
 * - curl installed
 *
 * NOTE: Draw.io is not available in Amazon Linux's default repositories.
 * This function downloads and installs the x86_64 RPM package directly
 * from GitHub releases.
 *
 * IMPORTANT: Draw.io is a GUI application requiring an X11 display.
 * On headless servers, use X11 forwarding or the web version.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('Checking if Draw.io is already installed...');

  // Check if already installed via RPM
  if (await isInstalledRpm()) {
    console.log('Draw.io is already installed, skipping installation.');
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

  // Install dependencies
  console.log('Installing required dependencies...');
  const depsResult = await shell.exec(
    `sudo ${packageManager} install -y wget curl libxkbfile libsecret nss gtk3 libdrm mesa-libgbm alsa-lib`
  );
  if (depsResult.code !== 0) {
    console.log('Warning: Some dependencies may not have been installed.');
    console.log('Continuing with installation...');
  }

  // Download the latest x86_64 RPM package from GitHub releases
  console.log('Downloading latest Draw.io RPM package from GitHub...');
  const downloadResult = await shell.exec(
    `curl -s ${GITHUB_RELEASES_API} | ` +
    `grep "browser_download_url.*x86_64.*\\.rpm" | ` +
    `cut -d '"' -f 4 | ` +
    `xargs -I {} curl -L -o /tmp/drawio.rpm {}`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      `Failed to download Draw.io RPM package.\n` +
      `Output: ${downloadResult.stderr}\n\n` +
      `Please check your internet connection and try again.\n` +
      `Alternatively, download manually from:\n` +
      `  https://github.com/jgraph/drawio-desktop/releases`
    );
  }

  // Install the RPM package
  console.log('Installing Draw.io RPM package...');
  const installResult = await shell.exec(
    `sudo ${packageManager} install -y /tmp/drawio.rpm`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Draw.io RPM package.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check for missing dependencies: sudo ${packageManager} install -y gtk3 libdrm mesa-libgbm alsa-lib\n` +
      `  2. Verify the download: ls -la /tmp/drawio.rpm\n` +
      `  3. Try manual installation: sudo rpm -ivh /tmp/drawio.rpm`
    );
  }

  // Clean up downloaded file
  await shell.exec('rm -f /tmp/drawio.rpm');

  // Verify installation
  if (!(await isInstalledRpm())) {
    throw new Error(
      'Installation appeared to complete but Draw.io was not found.\n\n' +
      'Please verify with: rpm -qa | grep drawio'
    );
  }

  console.log('Draw.io installed successfully.');
  console.log('');
  console.log('To launch Draw.io (requires X11 display):');
  console.log('  - Run: drawio');
  console.log('');
  console.log('NOTE: Draw.io is a GUI application. On headless servers:');
  console.log('  - Use X11 forwarding: ssh -X user@host');
  console.log('  - Or use the web version: https://app.diagrams.net');
}

/**
 * Install Draw.io on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later (64-bit), or Windows 11
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * The Chocolatey package installs Draw.io Desktop silently with
 * the /S flag for fully non-interactive installation.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Draw.io is already installed...');

  // Check if Draw.io is already installed via Chocolatey
  if (await isInstalledChoco()) {
    console.log('Draw.io is already installed via Chocolatey, skipping installation.');
    return;
  }

  // Check if Draw.io executable exists (installed via other method)
  if (await isInstalledWindowsExe()) {
    console.log('Draw.io is already installed, skipping installation.');
    return;
  }

  // Verify Chocolatey is available
  if (!choco.isInstalled()) {
    throw new Error(
      'Chocolatey is not installed. Please install Chocolatey first:\n\n' +
      'Run the following in an Administrator PowerShell:\n' +
      '  Set-ExecutionPolicy Bypass -Scope Process -Force; ' +
      '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; ' +
      'iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))\n\n' +
      'Then retry installing Draw.io.'
    );
  }

  console.log('Installing Draw.io via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install Draw.io via Chocolatey
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Draw.io via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Try: choco install drawio -y --force\n` +
      `  3. Check Chocolatey logs: C:\\ProgramData\\chocolatey\\logs`
    );
  }

  console.log('Draw.io installed successfully.');
  console.log('');
  console.log('To launch Draw.io:');
  console.log('  - Find it in the Start Menu');
  console.log('  - Or run: start "" "C:\\Program Files\\draw.io\\draw.io.exe"');
}

/**
 * Install Draw.io on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 * - X11 server running on Windows (for GUI applications)
 *
 * IMPORTANT: Draw.io is a GUI application. Running it in WSL requires
 * an X11 server on Windows (such as VcXsrv or X410) to display the window.
 *
 * This function installs Draw.io via Snap within WSL, similar to the
 * standard Ubuntu installation.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('IMPORTANT: Draw.io is a GUI application.');
  console.log('You will need an X11 server running on Windows to display it.');
  console.log('Consider installing VcXsrv: choco install vcxsrv (from Windows)');
  console.log('');

  // Check if already installed via Snap
  if (await isInstalledSnap()) {
    const version = await getSnapVersion();
    if (version) {
      console.log(`Draw.io ${version} is already installed via Snap, skipping installation.`);
    } else {
      console.log('Draw.io is already installed via Snap, skipping installation.');
    }
    return;
  }

  // Check if installed via .deb package
  if (await isInstalledDeb()) {
    console.log('Draw.io is already installed via deb package, skipping installation.');
    return;
  }

  // Ensure snapd is installed
  if (!snap.isInstalled()) {
    console.log('Installing snapd package manager...');
    const snapdResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd'
    );
    if (snapdResult.code !== 0) {
      throw new Error(
        `Failed to install snapd.\n` +
        `Output: ${snapdResult.stderr}\n\n` +
        `Note: Snap requires systemd which may not be enabled in WSL.\n` +
        `To enable systemd, add to /etc/wsl.conf:\n` +
        `  [boot]\n` +
        `  systemd=true\n` +
        `Then restart WSL: wsl --shutdown (from Windows PowerShell)`
      );
    }
  }

  console.log('Installing Draw.io via Snap...');

  // Install Draw.io snap
  const result = await snap.install(SNAP_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Draw.io via Snap.\n` +
      `Output: ${result.output}\n\n` +
      `WSL Troubleshooting:\n` +
      `  1. Ensure systemd is enabled in /etc/wsl.conf\n` +
      `  2. Restart WSL: wsl --shutdown (from Windows)\n` +
      `  3. Verify snap is working: snap list\n` +
      `  4. Try: sudo snap install core && sudo snap install drawio`
    );
  }

  // Verify installation
  if (!(await isInstalledSnap())) {
    throw new Error(
      'Installation appeared to complete but Draw.io was not found.\n\n' +
      'Please verify with: snap list drawio'
    );
  }

  const installedVersion = await getSnapVersion();
  if (installedVersion) {
    console.log(`Draw.io ${installedVersion} installed successfully.`);
  } else {
    console.log('Draw.io installed successfully.');
  }
  console.log('');
  console.log('To launch Draw.io:');
  console.log('  1. Ensure an X11 server is running on Windows');
  console.log('  2. Set DISPLAY variable (for WSL 2):');
  console.log('     export DISPLAY=$(grep -m 1 nameserver /etc/resolv.conf | awk \'{print $2}\'):0');
  console.log('  3. Run: drawio');
  console.log('');
  console.log('If you experience display issues, try:');
  console.log('  drawio --disable-gpu');
}

/**
 * Install Draw.io from Git Bash on Windows using portable installation.
 *
 * Git Bash runs within Windows, so this function downloads and extracts
 * the portable Windows ZIP package from GitHub releases.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Internet connection to download the portable package
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Draw.io portable version...');
  console.log('');

  // Define portable app directory
  const homeDir = os.getHomeDir();
  const portableDir = `${homeDir}/portable-apps/drawio`;

  // Check if already installed
  const checkResult = await shell.exec(`ls "${portableDir}/draw.io.exe" 2>/dev/null`);
  if (checkResult.code === 0) {
    console.log('Draw.io is already installed in portable-apps, skipping installation.');
    console.log('');
    console.log('To launch Draw.io:');
    console.log(`  ${portableDir}/draw.io.exe`);
    return;
  }

  // Also check if installed via Chocolatey/Windows installer
  const winExeResult = await shell.exec('ls "C:/Program Files/draw.io/draw.io.exe" 2>/dev/null');
  if (winExeResult.code === 0) {
    console.log('Draw.io is already installed on Windows, skipping installation.');
    console.log('');
    console.log('To launch Draw.io from Git Bash:');
    console.log('  "/c/Program Files/draw.io/draw.io.exe"');
    return;
  }

  // Create portable apps directory
  console.log('Creating portable apps directory...');
  await shell.exec(`mkdir -p "${homeDir}/portable-apps"`);

  // Download the latest Windows ZIP package
  console.log('Downloading latest Draw.io portable package from GitHub...');
  const downloadResult = await shell.exec(
    `curl -L -o /tmp/drawio.zip "$(curl -s ${GITHUB_RELEASES_API} | ` +
    `grep 'browser_download_url.*windows\\.zip' | head -1 | cut -d '"' -f 4)"`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      `Failed to download Draw.io portable package.\n` +
      `Output: ${downloadResult.stderr}\n\n` +
      `Please check your internet connection and try again.\n` +
      `Alternatively, download manually from:\n` +
      `  https://github.com/jgraph/drawio-desktop/releases`
    );
  }

  // Extract the ZIP file
  console.log('Extracting Draw.io...');

  // Check if unzip is available
  if (shell.commandExists('unzip')) {
    const extractResult = await shell.exec(
      `unzip -q /tmp/drawio.zip -d "${portableDir}"`
    );
    if (extractResult.code !== 0) {
      throw new Error(
        `Failed to extract Draw.io package.\n` +
        `Output: ${extractResult.stderr}`
      );
    }
  } else {
    // Use PowerShell as fallback
    console.log('Using PowerShell to extract (unzip not available)...');
    const psExtractResult = await shell.exec(
      `powershell.exe -command "Expand-Archive -Path '/tmp/drawio.zip' -DestinationPath '${portableDir}' -Force"`
    );
    if (psExtractResult.code !== 0) {
      throw new Error(
        `Failed to extract Draw.io package.\n` +
        `Output: ${psExtractResult.stderr}`
      );
    }
  }

  // Clean up downloaded file
  await shell.exec('rm -f /tmp/drawio.zip');

  // Unblock the executable (Windows security)
  console.log('Unblocking executable...');
  await shell.exec(
    `powershell.exe -command "Get-ChildItem -Path '${portableDir}' -Recurse | Unblock-File" 2>/dev/null`
  );

  // Verify installation
  const verifyResult = await shell.exec(`ls "${portableDir}/draw.io.exe" 2>/dev/null`);
  if (verifyResult.code !== 0) {
    // Files might be in a subdirectory
    const findResult = await shell.exec(`find "${portableDir}" -name "draw.io.exe" 2>/dev/null`);
    if (findResult.code !== 0 || !findResult.stdout.trim()) {
      throw new Error(
        'Installation appeared to complete but draw.io.exe was not found.\n\n' +
        `Please check: ls "${portableDir}"`
      );
    }
    console.log(`Note: Executable found at: ${findResult.stdout.trim()}`);
  }

  console.log('Draw.io installed successfully.');
  console.log('');
  console.log('To launch Draw.io:');
  console.log(`  "${portableDir}/draw.io.exe"`);
  console.log('');
  console.log('To add an alias, add this to your ~/.bashrc:');
  console.log(`  alias drawio='"${portableDir}/draw.io.exe"'`);
}

/**
 * Check if Draw.io is currently installed on the system.
 *
 * This function checks for Draw.io installation across all supported platforms:
 * - macOS: Checks for draw.io.app via Homebrew cask or application bundle
 * - Windows: Checks for Draw.io via Chocolatey or executable path
 * - Linux: Checks for Draw.io via Snap, dpkg, or RPM
 *
 * @returns {Promise<boolean>} True if Draw.io is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    // Check if Draw.io app bundle exists
    if (isInstalledMacOS()) {
      return true;
    }
    // Also check via Homebrew cask
    return await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  }

  if (platform.type === 'windows') {
    // Check via Chocolatey or executable path
    if (await isInstalledChoco()) {
      return true;
    }
    return await isInstalledWindowsExe();
  }

  if (platform.type === 'gitbash') {
    // Git Bash uses portable version, check in portable-apps directory
    const homeDir = os.getHomeDir();
    const portableDir = `${homeDir}/portable-apps/drawio`;
    const checkResult = await shell.exec(`ls "${portableDir}/draw.io.exe" 2>/dev/null`);
    if (checkResult.code === 0) {
      return true;
    }
    // Also check Windows installation
    return await isInstalledWindowsExe();
  }

  // Linux platforms: Check Snap first, then deb, then rpm
  if (await isInstalledSnap()) {
    return true;
  }
  if (await isInstalledDeb()) {
    return true;
  }
  return await isInstalledRpm();
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Draw.io can be installed on all supported platforms:
 * - macOS (Draw.io Desktop via Homebrew cask)
 * - Ubuntu/Debian (Draw.io via Snap)
 * - Raspberry Pi OS (Draw.io via Snap or ARM64 .deb package)
 * - Amazon Linux/RHEL/Fedora (Draw.io via RPM from GitHub releases)
 * - Windows (Draw.io Desktop via Chocolatey)
 * - WSL (Draw.io via Snap, requires X11 server)
 * - Git Bash (Draw.io portable Windows version)
 *
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
 * - macOS: Draw.io Desktop via Homebrew cask
 * - Ubuntu/Debian: Draw.io via Snap
 * - Raspberry Pi OS: Draw.io via Snap or ARM64 .deb package
 * - Amazon Linux/RHEL: Draw.io via RPM from GitHub releases
 * - Windows: Draw.io Desktop via Chocolatey
 * - WSL (Ubuntu): Draw.io via Snap (requires X11 server)
 * - Git Bash: Draw.io portable Windows version
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
    console.log(`Draw.io is not available for ${platform.type}.`);
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

// Allow direct execution: node drawio.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
