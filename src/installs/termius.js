#!/usr/bin/env node

/**
 * @fileoverview Install Termius SSH Client.
 * @module installs/termius
 *
 * Termius is a modern SSH client designed for productivity and collaboration.
 * It enables secure connections to Linux servers, IoT devices, Docker containers,
 * virtual machines, Raspberry Pi devices, and cloud instances. Termius provides
 * a multi-tab interface with split-view support, encrypted credential storage
 * using AES-256 encryption, and cross-device synchronization for hosts, keys,
 * and settings.
 *
 * Key features include:
 * - SSH, Mosh, Telnet, Port Forwarding, and SFTP support
 * - Encrypted vault for storing credentials and SSH keys
 * - Snippets for frequently used commands and scripts
 * - Team collaboration with secure credential sharing
 * - Biometric authentication (Windows Hello, Touch ID, Face ID)
 *
 * This installer provides:
 * - Termius Desktop for macOS via Homebrew cask
 * - Termius Desktop for Windows via Chocolatey
 * - Termius Desktop for Ubuntu/Debian via Snap (x86_64 only)
 * - Termius Desktop for Amazon Linux/RHEL via Snap + EPEL (x86_64 only)
 * - Instructions to launch Windows Termius from WSL/Git Bash
 *
 * IMPORTANT PLATFORM NOTES:
 * - Raspberry Pi OS: Termius does not provide native ARM packages. The desktop
 *   application is only available for x86_64 architecture. Users should install
 *   Termius on another device and use it to connect TO the Raspberry Pi.
 * - Linux: Requires 64-bit x86_64 architecture and a graphical desktop environment.
 * - Amazon Linux: Most EC2 instances run headless; GUI required for Termius.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const snap = require('../utils/ubuntu/snap');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew cask name for Termius on macOS.
 * This installs the full desktop application to /Applications.
 */
const HOMEBREW_CASK_NAME = 'termius';

/**
 * The Chocolatey package name for Termius on Windows.
 */
const CHOCO_PACKAGE_NAME = 'termius';

/**
 * The Snap package name for Termius on Ubuntu/Debian and Amazon Linux.
 * Note: The snap is named 'termius-app', not just 'termius'.
 */
const SNAP_PACKAGE_NAME = 'termius-app';

/**
 * The macOS application name (as it appears in /Applications).
 */
const MACOS_APP_NAME = 'Termius';

/**
 * Check if Termius Desktop application is installed on macOS.
 *
 * Looks for Termius.app in /Applications or ~/Applications.
 * This is more reliable than checking for a CLI command since Termius
 * on macOS is a GUI application without a command-line entry point.
 *
 * @returns {boolean} True if Termius.app exists, false otherwise
 */
function isTermiusInstalledMacOS() {
  return macosApps.isAppInstalled(MACOS_APP_NAME);
}

/**
 * Check if the termius-app command is available in PATH on Linux systems.
 *
 * After Snap installation, the 'termius-app' command should be available.
 * This is the primary way to check for Snap-based Termius installations.
 *
 * @returns {boolean} True if termius-app command exists, false otherwise
 */
function isTermiusCommandAvailable() {
  return shell.commandExists('termius-app');
}

/**
 * Install Termius Desktop on macOS using Homebrew cask.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - At least 300 MB free disk space
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * The installation uses the Homebrew cask 'termius' which downloads and installs
 * the Termius desktop application to /Applications/Termius.app.
 *
 * NOTE: After installation, Termius must be launched manually. On first launch,
 * it will prompt you to sign in or create an account for cross-device sync.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Termius is already installed...');

  // Check if Termius.app already exists in Applications
  if (isTermiusInstalledMacOS()) {
    const version = macosApps.getAppVersion(MACOS_APP_NAME);
    if (version) {
      console.log(`Termius ${version} is already installed, skipping installation.`);
    } else {
      console.log('Termius is already installed, skipping installation.');
    }
    return;
  }

  // Also check if the cask is installed via Homebrew (may be in different location)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Termius is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('You can launch Termius from Applications or run: open -a Termius');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Termius.'
    );
  }

  console.log('Installing Termius via Homebrew...');

  // Install Termius cask with quiet flag for cleaner automation output
  const result = await shell.exec('brew install --quiet --cask termius');

  if (result.code !== 0) {
    throw new Error(
      `Failed to install Termius via Homebrew.\n` +
      `Output: ${result.stderr || result.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Check if macOS version is 10.15 (Catalina) or later\n` +
      `  3. Try manual installation: brew reinstall --cask termius`
    );
  }

  // Verify installation succeeded by checking for the app bundle
  if (!isTermiusInstalledMacOS()) {
    throw new Error(
      'Installation command completed but Termius.app was not found in Applications.\n\n' +
      'Please try:\n' +
      '  1. Check /Applications for Termius.app\n' +
      '  2. Run: brew reinstall --cask termius'
    );
  }

  console.log('Termius installed successfully.');
  console.log('');
  console.log('To launch Termius:');
  console.log('  - Open from Applications folder, or');
  console.log('  - Run: open -a Termius');
  console.log('');
  console.log('On first launch, you will be prompted to sign in or create an account.');
  console.log('Creating an account enables syncing hosts and settings across devices.');
}

/**
 * Install Termius on Ubuntu/Debian using Snap.
 *
 * Prerequisites:
 * - Ubuntu 16.04 LTS or later, or Debian 10 (Buster) or later
 * - 64-bit x86_64 architecture (ARM is not supported)
 * - sudo privileges
 * - Snap package manager (pre-installed on Ubuntu 16.04+)
 * - At least 300 MB free disk space
 * - X11 or Wayland display server for GUI
 *
 * The installation uses the Snap package 'termius-app' which is the official
 * recommended installation method for Termius on Linux. Snap automatically
 * handles all dependencies and provides sandboxed execution.
 *
 * IMPORTANT: Termius Snap is only available for x86_64 architecture. ARM-based
 * systems (including Raspberry Pi) are not supported for the desktop application.
 *
 * @returns {Promise<void>}
 * @throws {Error} If architecture is not supported or installation fails
 */
async function install_ubuntu() {
  console.log('Checking if Termius is already installed...');

  // Check if Termius is already installed via Snap
  const isInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (isInstalled) {
    const version = await snap.getSnapVersion(SNAP_PACKAGE_NAME);
    if (version) {
      console.log(`Termius ${version} is already installed via Snap, skipping installation.`);
    } else {
      console.log('Termius is already installed via Snap, skipping installation.');
    }
    return;
  }

  // Also check if termius-app command exists (could be installed another way)
  if (isTermiusCommandAvailable()) {
    console.log('Termius is already installed, skipping installation.');
    return;
  }

  // Verify architecture - Termius Snap only supports x86_64
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  if (arch !== 'x86_64') {
    console.log(`Termius is not available for ${arch} architecture.`);
    console.log('');
    console.log('Termius requires 64-bit x86_64 architecture for the native desktop app.');
    console.log('Consider installing Termius on another device to connect to this system.');
    return;
  }

  // Verify Snap is available before attempting installation
  if (!snap.isInstalled()) {
    throw new Error(
      'Snap package manager is not installed.\n\n' +
      'On Ubuntu, Snap should be pre-installed. If not, install it with:\n' +
      '  sudo apt-get update && sudo apt-get install -y snapd\n' +
      '  sudo systemctl enable --now snapd.socket\n\n' +
      'Then log out and back in, and retry installing Termius.'
    );
  }

  console.log('Installing Termius via Snap...');
  console.log('This may take a few minutes...');

  // Install Termius via Snap (no classic confinement needed)
  const result = await snap.install(SNAP_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Termius via Snap.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure snapd is running: sudo systemctl start snapd\n` +
      `  2. Check architecture: uname -m (must be x86_64)\n` +
      `  3. Try manual installation: sudo snap install termius-app`
    );
  }

  // Verify installation succeeded
  const verifyInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but Termius was not found.\n\n' +
      'Please try:\n' +
      '  1. Run: snap list termius-app\n' +
      '  2. Retry: sudo snap install termius-app'
    );
  }

  const version = await snap.getSnapVersion(SNAP_PACKAGE_NAME);
  console.log(`Termius ${version || ''} installed successfully.`);
  console.log('');
  console.log('To launch Termius:');
  console.log('  - Run: termius-app &');
  console.log('  - Or find Termius in your application menu');
  console.log('');
  console.log('On first launch, you will be prompted to sign in or create an account.');
  console.log('Creating an account enables syncing hosts and settings across devices.');
}

/**
 * Install Termius on Raspberry Pi OS.
 *
 * PLATFORM LIMITATION: Termius does not provide native ARM packages for the
 * desktop application. The Termius Snap package and desktop application are
 * only available for x86_64 architecture. Raspberry Pi devices use ARM
 * processors (armhf or aarch64), which are not supported.
 *
 * Termius is primarily designed as a client TO connect to Raspberry Pi and
 * other ARM devices, not to run ON them directly.
 *
 * This function gracefully informs the user that Termius is not available for
 * Raspberry Pi OS without throwing an error or suggesting alternatives.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Termius is not available for Raspberry Pi OS.');
}

/**
 * Install Termius on Amazon Linux/RHEL using Snap.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, RHEL 8/9, or Fedora (64-bit x86_64)
 * - sudo privileges
 * - Graphical desktop environment (required for Termius GUI)
 * - At least 300 MB free disk space
 *
 * IMPORTANT: Amazon Linux EC2 instances typically run headless (no GUI).
 * If you are running a headless server, install Termius on your local
 * workstation and use it to connect to your Amazon Linux instances.
 *
 * This function:
 * 1. Checks architecture (must be x86_64)
 * 2. Installs snapd if not already present (via EPEL for Amazon Linux 2)
 * 3. Enables and starts the snapd service
 * 4. Installs Termius via Snap
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('Checking if Termius is already installed...');

  // Check if Termius is already installed via Snap
  const snapInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (snapInstalled) {
    const version = await snap.getSnapVersion(SNAP_PACKAGE_NAME);
    if (version) {
      console.log(`Termius ${version} is already installed via Snap, skipping installation.`);
    } else {
      console.log('Termius is already installed via Snap, skipping installation.');
    }
    return;
  }

  // Also check if termius-app command exists
  if (isTermiusCommandAvailable()) {
    console.log('Termius is already installed, skipping installation.');
    return;
  }

  // Verify architecture - Termius only supports x86_64
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  if (arch !== 'x86_64') {
    console.log(`Termius is not available for ${arch} architecture.`);
    console.log('');
    console.log('Termius requires 64-bit x86_64 architecture for the native desktop app.');
    return;
  }

  // Detect package manager (dnf for AL2023/RHEL8+/Fedora, yum for AL2)
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

  // Check if snapd is installed, if not, install it
  if (!snap.isInstalled()) {
    console.log('Snap is not installed. Installing snapd...');

    // For Amazon Linux 2, we need to enable EPEL first
    if (packageManager === 'yum') {
      console.log('Enabling EPEL repository for Amazon Linux 2...');
      const epelResult = await shell.exec('sudo amazon-linux-extras install -y epel');
      if (epelResult.code !== 0) {
        throw new Error(
          'Failed to enable EPEL repository.\n' +
          'Error: ' + epelResult.stderr + '\n\n' +
          'Try manually: sudo amazon-linux-extras install -y epel'
        );
      }
    }

    // Install snapd
    console.log('Installing snapd...');
    const snapdResult = await shell.exec(`sudo ${packageManager} install -y snapd`);
    if (snapdResult.code !== 0) {
      throw new Error(
        'Failed to install snapd.\n' +
        'Error: ' + snapdResult.stderr + '\n\n' +
        `Try manually: sudo ${packageManager} install -y snapd`
      );
    }

    // Enable and start snapd socket
    console.log('Enabling snapd service...');
    const enableResult = await shell.exec('sudo systemctl enable --now snapd.socket');
    if (enableResult.code !== 0) {
      console.log('Warning: Could not enable snapd.socket. You may need to reboot.');
    }

    // Create the /snap symbolic link if it does not exist
    const linkResult = await shell.exec('sudo ln -sf /var/lib/snapd/snap /snap');
    if (linkResult.code !== 0) {
      console.log('Warning: Could not create /snap symlink.');
    }

    console.log('');
    console.log('NOTE: You may need to log out and back in (or reboot) for snap');
    console.log('to be available in your PATH before proceeding.');
    console.log('');
  }

  console.log('Installing Termius via Snap...');
  console.log('This may take a few minutes...');

  // Install Termius via Snap
  const result = await snap.install(SNAP_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Termius via Snap.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Log out and back in, then retry\n` +
      `  2. Ensure snapd is running: sudo systemctl start snapd\n` +
      `  3. Try manual installation: sudo snap install termius-app`
    );
  }

  // Verify installation
  const verifyInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but Termius was not found.\n\n' +
      'Please try:\n' +
      '  1. Log out and back in\n' +
      '  2. Run: snap list termius-app\n' +
      '  3. Retry: sudo snap install termius-app'
    );
  }

  const version = await snap.getSnapVersion(SNAP_PACKAGE_NAME);
  console.log(`Termius ${version || ''} installed successfully.`);
  console.log('');
  console.log('To launch Termius:');
  console.log('  - Run: termius-app &');
  console.log('  - Or find Termius in your application menu');
  console.log('');
  console.log('NOTE: Termius requires a graphical desktop environment.');
  console.log('If running on a headless server, consider installing Termius on');
  console.log('your local workstation and connecting to this server remotely.');
}

/**
 * Install Termius on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - At least 300 MB free disk space
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * The installation uses Chocolatey's 'termius' package which downloads and
 * installs the official Termius desktop application.
 *
 * NOTE: After installation, Termius can be launched from the Start Menu or
 * via the command line with 'Start-Process Termius'.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Termius is already installed...');

  // Check if Termius is already installed via Chocolatey
  const isInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (isInstalled) {
    const version = await choco.getPackageVersion(CHOCO_PACKAGE_NAME);
    if (version) {
      console.log(`Termius ${version} is already installed via Chocolatey, skipping installation.`);
    } else {
      console.log('Termius is already installed via Chocolatey, skipping installation.');
    }
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
      'Then retry installing Termius.'
    );
  }

  console.log('Installing Termius via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install Termius using Chocolatey
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Termius via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Run 'choco list termius' to check availability\n` +
      `  3. Try manual installation: choco install termius -y`
    );
  }

  // Verify installation succeeded
  const verifyInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!verifyInstalled) {
    throw new Error(
      'Installation command completed but Termius was not found.\n\n' +
      'Please try:\n' +
      '  1. Run: choco list termius\n' +
      '  2. Retry: choco install termius -y'
    );
  }

  const version = await choco.getPackageVersion(CHOCO_PACKAGE_NAME);
  console.log(`Termius ${version || ''} installed successfully.`);
  console.log('');
  console.log('To launch Termius:');
  console.log('  - Open from Start Menu, or');
  console.log('  - Run: Start-Process "Termius"');
  console.log('');
  console.log('On first launch, you will be prompted to sign in or create an account.');
  console.log('Creating an account enables syncing hosts and settings across devices.');
}

/**
 * Install Termius when running from Ubuntu on WSL (Windows Subsystem for Linux).
 *
 * PLATFORM APPROACH: Termius is installed on the Windows host and accessed from
 * WSL using Windows interoperability. This is the recommended approach as Termius
 * is a GUI application best run on the Windows desktop.
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - Chocolatey installed on Windows for Termius installation
 *
 * This function installs Termius on the Windows host via PowerShell/Chocolatey.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation on Windows host fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Installing Termius on the Windows host...');
  console.log('');

  // Check if Termius is already available on Windows via Chocolatey
  const slackCheck = await shell.exec('cmd.exe /c "choco list termius --local-only" 2>/dev/null');
  if (slackCheck.code === 0 && slackCheck.stdout.toLowerCase().includes('termius')) {
    console.log('Termius is already installed on Windows, skipping installation.');
    console.log('');
    console.log('To launch Termius from WSL:');
    console.log('  cmd.exe /c start "" "Termius"');
    return;
  }

  // Check if Chocolatey is available on Windows
  const chocoCheck = await shell.exec('powershell.exe -NoProfile -Command "choco --version"');
  if (chocoCheck.code !== 0) {
    throw new Error(
      'Chocolatey is not installed on Windows.\n\n' +
      'Install Chocolatey by running the following in an Administrator PowerShell:\n' +
      '  Set-ExecutionPolicy Bypass -Scope Process -Force; ' +
      '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; ' +
      'iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))\n\n' +
      'Then retry installing Termius.'
    );
  }

  console.log('Installing Termius via Chocolatey on Windows...');
  console.log('This may take a few minutes...');

  // Install via PowerShell using Chocolatey
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install termius -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Termius on Windows host.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Open an Administrator PowerShell on Windows and run:\n` +
      `     choco install termius -y\n` +
      `  3. Then launch from WSL with: cmd.exe /c start "" "Termius"`
    );
  }

  console.log('Termius installed successfully on Windows.');
  console.log('');
  console.log('To launch Termius from WSL:');
  console.log('  cmd.exe /c start "" "Termius"');
  console.log('');
  console.log('TIP: Add an alias to ~/.bashrc for convenience:');
  console.log('  echo \'alias termius="cmd.exe /c start \\"\\" \\"Termius\\""\' >> ~/.bashrc');
}

/**
 * Install Termius from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Termius on the
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
  console.log('Installing Termius on the Windows host...');
  console.log('');

  // Check if Termius is already installed via Chocolatey
  const termiusCheck = await shell.exec(
    'powershell.exe -NoProfile -Command "choco list --local-only --exact termius"'
  );
  if (termiusCheck.code === 0 && termiusCheck.stdout.toLowerCase().includes('termius')) {
    console.log('Termius is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('To launch Termius from Git Bash:');
    console.log('  start "" "Termius"');
    return;
  }

  // Check if Chocolatey is available
  const chocoCheck = await shell.exec('powershell.exe -NoProfile -Command "choco --version"');
  if (chocoCheck.code !== 0) {
    throw new Error(
      'Chocolatey is not installed on Windows.\n\n' +
      'Install Chocolatey by running the following in an Administrator PowerShell:\n' +
      '  Set-ExecutionPolicy Bypass -Scope Process -Force; ' +
      '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; ' +
      'iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))\n\n' +
      'Then retry installing Termius.'
    );
  }

  console.log('Installing Termius via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install via PowerShell using Chocolatey
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install termius -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Termius.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell:\n` +
      `     choco install termius -y`
    );
  }

  console.log('Termius installed successfully.');
  console.log('');
  console.log('To launch Termius from Git Bash:');
  console.log('  start "" "Termius"');
  console.log('');
  console.log('Or use the explicit Windows command:');
  console.log('  cmd //c "start \\"\\" \\"Termius\\""');
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Termius Desktop via Homebrew cask
 * - Ubuntu/Debian: Termius Desktop via Snap (x86_64 only)
 * - Amazon Linux/RHEL: Termius Desktop via Snap + EPEL (x86_64 only)
 * - Windows: Termius Desktop via Chocolatey
 * - WSL (Ubuntu): Installs Termius on Windows host via Chocolatey
 * - Git Bash: Installs Termius on Windows host via Chocolatey
 *
 * Unsupported platforms:
 * - Raspberry Pi OS: ARM architecture not supported (graceful message)
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases and variations for different distributions
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

  // If no installer is found for this platform, gracefully inform the user
  if (!installer) {
    console.log(`Termius is not available for ${platform.type}.`);
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

// Allow direct execution: node termius.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
