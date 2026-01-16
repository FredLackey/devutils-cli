#!/usr/bin/env node

/**
 * @fileoverview Install Studio 3T - Professional IDE and GUI for MongoDB.
 * @module installs/studio-3t
 *
 * Studio 3T is a comprehensive MongoDB IDE that provides a visual query
 * builder, IntelliShell with autocomplete, SQL query translation, aggregation
 * editor, data import/export, schema explorer, and compare/sync features.
 *
 * This installer provides:
 * - Homebrew cask installation for macOS (Intel and Apple Silicon)
 * - Manual tarball installation for Ubuntu/Debian (x86-64 only)
 * - Chocolatey-based installation for Windows
 * - Manual tarball installation for Amazon Linux/RHEL (x86-64 only)
 * - WSL support via Linux tarball installation (requires WSLg for GUI)
 * - Git Bash support via Windows Chocolatey installation
 *
 * IMPORTANT PLATFORM NOTES:
 * - macOS: Installs via Homebrew cask (supports Intel and Apple Silicon)
 * - Windows: Installs via Chocolatey
 * - Ubuntu/Debian: Manual tarball installation (no APT package available)
 * - Amazon Linux/RHEL: Manual tarball installation (typically headless servers)
 * - Raspberry Pi OS: NOT supported (ARM architecture incompatible)
 * - WSL: Linux tarball installation (requires WSLg for GUI)
 * - Git Bash: Installs on Windows host via Chocolatey
 *
 * NOTE: Studio 3T is built exclusively for x86-64 architecture on Linux.
 * ARM-based systems (Raspberry Pi, AWS Graviton) are not supported.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const choco = require('../utils/windows/choco');

/**
 * Whether this installer requires a desktop environment to function.
 * Studio 3T is a GUI MongoDB IDE.
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for Studio 3T on macOS.
 * @constant {string}
 */
const HOMEBREW_CASK_NAME = 'studio-3t';

/**
 * The Chocolatey package name for Studio 3T on Windows.
 * @constant {string}
 */
const CHOCO_PACKAGE_NAME = 'studio3t';

/**
 * The macOS application name (as it appears in /Applications).
 * @constant {string}
 */
const MACOS_APP_NAME = 'Studio 3T';

/**
 * The installation directory for Studio 3T on Linux.
 * This is where the installer extracts Studio 3T by default.
 * @constant {string}
 */
const LINUX_INSTALL_DIR = '/opt/studio3t';

/**
 * The Studio 3T executable path on Linux.
 * @constant {string}
 */
const LINUX_EXECUTABLE = '/opt/studio3t/Studio-3T';

/**
 * The download URL for the Linux x64 tarball.
 * NOTE: Version number may change - check https://studio3t.com/download/ for latest.
 * @constant {string}
 */
const LINUX_TARBALL_URL = 'https://download.studio3t.com/studio-3t/linux/2025.23.0/studio-3t-linux-x64.tar.gz';

/**
 * Check if Studio 3T is installed on macOS by looking for the .app bundle.
 *
 * This is the most reliable method for detecting macOS GUI applications,
 * as Studio 3T does not install a command-line entry point.
 *
 * @returns {boolean} True if Studio 3T.app exists, false otherwise
 */
function isStudio3TInstalledMacOS() {
  return macosApps.isAppInstalled(MACOS_APP_NAME);
}

/**
 * Check if Studio 3T is installed on Linux via the tarball method.
 *
 * Looks for the Studio-3T executable in /opt/studio3t/ which is where
 * the official installer extracts the application.
 *
 * @returns {Promise<boolean>} True if Studio 3T executable exists, false otherwise
 */
async function isStudio3TInstalledLinux() {
  const result = await shell.exec(`test -f "${LINUX_EXECUTABLE}"`);
  return result.code === 0;
}

/**
 * Install Studio 3T on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - At least 4 GB RAM
 * - Intel processor or Apple Silicon (M1/M2/M3/M4)
 *
 * The installation uses the Homebrew cask 'studio-3t' which downloads and
 * installs Studio 3T to /Applications/Studio 3T.app. Homebrew automatically
 * selects the correct architecture build for your Mac.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Studio 3T is already installed...');

  // Check if Studio 3T is already installed via the app bundle
  if (isStudio3TInstalledMacOS()) {
    const version = macosApps.getAppVersion(MACOS_APP_NAME);
    if (version) {
      console.log(`Studio 3T ${version} is already installed, skipping installation.`);
    } else {
      console.log('Studio 3T is already installed, skipping installation.');
    }
    return;
  }

  // Also check if the cask is installed (Studio 3T may be installed in a different location)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Studio 3T is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('You can launch Studio 3T from Applications or run: open -a "Studio 3T"');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Studio 3T.'
    );
  }

  console.log('Installing Studio 3T via Homebrew...');
  console.log('This may take a few minutes...');

  // Install Studio 3T cask
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Studio 3T via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Try manual installation: brew install --cask studio-3t`
    );
  }

  // Verify installation succeeded
  if (!isStudio3TInstalledMacOS()) {
    throw new Error(
      'Installation appeared to complete but Studio 3T.app was not found in /Applications.\n' +
      'Please try reinstalling: brew reinstall --cask studio-3t'
    );
  }

  console.log('Studio 3T installed successfully.');
  console.log('');
  console.log('You can launch Studio 3T from:');
  console.log('  - Applications folder');
  console.log('  - Command line: open -a "Studio 3T"');
  console.log('');
  console.log('NOTE: On first launch, Studio 3T will prompt you to accept the license');
  console.log('agreement and optionally sign in. You can use Studio 3T Free for');
  console.log('non-commercial purposes without an account.');
}

/**
 * Install Studio 3T on Ubuntu/Debian using the official tarball.
 *
 * Prerequisites:
 * - Ubuntu 22.04 LTS or later, or Debian 11 (Bullseye) or later
 * - 64-bit x86-64 architecture ONLY (ARM is not supported)
 * - sudo privileges
 * - X11 or Wayland display server for GUI
 * - At least 4 GB RAM
 *
 * IMPORTANT: Studio 3T is not available through APT repositories.
 * It must be installed manually via the official tarball which includes
 * a shell script installer supporting silent/non-interactive installation.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails or architecture is unsupported
 */
async function install_ubuntu() {
  console.log('Checking if Studio 3T is already installed...');

  // Check if already installed
  const isInstalled = await isStudio3TInstalledLinux();
  if (isInstalled) {
    console.log('Studio 3T is already installed in /opt/studio3t, skipping installation.');
    return;
  }

  // Check architecture - Studio 3T requires x86-64
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();

  if (arch !== 'x86_64') {
    console.log(`Studio 3T requires x86-64 architecture.`);
    console.log(`Your architecture is: ${arch}`);
    console.log('');
    console.log('Studio 3T is not available for ARM processors.');
    return;
  }

  console.log('Installing Studio 3T for Linux (x86-64)...');
  console.log('');

  // Step 1: Download the tarball
  console.log('Downloading Studio 3T...');
  const downloadResult = await shell.exec(
    `wget -q "${LINUX_TARBALL_URL}" -O /tmp/studio-3t-linux-x64.tar.gz`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      `Failed to download Studio 3T.\n` +
      `Error: ${downloadResult.stderr}\n\n` +
      `The download URL may have changed. Check:\n` +
      `  https://studio3t.com/download/`
    );
  }

  // Step 2: Extract the archive
  console.log('Extracting archive...');
  const extractResult = await shell.exec(
    'tar -xzf /tmp/studio-3t-linux-x64.tar.gz -C /tmp/'
  );

  if (extractResult.code !== 0) {
    throw new Error(`Failed to extract Studio 3T archive: ${extractResult.stderr}`);
  }

  // Step 3: Run the installer in quiet/non-interactive mode
  // Note: The -dir parameter is required to specify installation directory
  console.log('Running installer (this may take a moment)...');
  const installResult = await shell.exec(
    `sudo /tmp/studio-3t-linux-x64.sh -q -dir ${LINUX_INSTALL_DIR}`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to run Studio 3T installer.\n` +
      `Error: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you have sudo privileges\n` +
      `  2. Try running manually: sudo /tmp/studio-3t-linux-x64.sh -q -dir ${LINUX_INSTALL_DIR}`
    );
  }

  // Step 4: Clean up downloaded files
  console.log('Cleaning up...');
  await shell.exec('rm -f /tmp/studio-3t-linux-x64.tar.gz /tmp/studio-3t-linux-x64.sh');

  // Verify installation
  const verified = await isStudio3TInstalledLinux();
  if (!verified) {
    throw new Error(
      'Installation appeared to complete but Studio 3T was not found.\n' +
      'Please check /opt/studio3t/ for the installation.'
    );
  }

  console.log('Studio 3T installed successfully.');
  console.log('');
  console.log('Launch Studio 3T with:');
  console.log('  /opt/studio3t/Studio-3T &');
  console.log('');
  console.log('If you encounter shared library errors, install dependencies with:');
  console.log('  sudo apt-get install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 libatspi2.0-0 libsecret-1-0');
}

/**
 * Install Studio 3T on Raspberry Pi OS.
 *
 * CRITICAL LIMITATION: Studio 3T does NOT support ARM architecture.
 * The application is built exclusively for x86-64 (Intel/AMD) processors.
 * There is no ARM build available for Raspberry Pi, and attempting to
 * run the x86-64 binary will fail.
 *
 * This function returns gracefully with a message explaining the limitation.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Studio 3T is not available for Raspberry Pi OS.');
  console.log('');
  console.log('Studio 3T requires x86-64 (Intel/AMD) architecture and does not');
  console.log('support ARM processors used by Raspberry Pi.');
}

/**
 * Install Studio 3T on Amazon Linux/RHEL using the official tarball.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, RHEL 8, or later
 * - 64-bit x86-64 architecture ONLY (Graviton ARM instances not supported)
 * - sudo privileges
 * - X11 display server for GUI (typically not available on EC2 instances)
 * - At least 4 GB RAM
 *
 * IMPORTANT: Amazon Linux EC2 instances typically run headless (no GUI).
 * Studio 3T is a graphical application and requires a display. For headless
 * server environments, use X11 forwarding or access MongoDB through
 * command-line tools like mongosh.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails or architecture is unsupported
 */
async function install_amazon_linux() {
  console.log('Checking if Studio 3T is already installed...');

  // Check if already installed
  const isInstalled = await isStudio3TInstalledLinux();
  if (isInstalled) {
    console.log('Studio 3T is already installed in /opt/studio3t, skipping installation.');
    return;
  }

  // Check architecture - Studio 3T requires x86-64
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();

  if (arch !== 'x86_64') {
    console.log(`Studio 3T requires x86-64 architecture.`);
    console.log(`Your architecture is: ${arch}`);
    console.log('');
    console.log('Studio 3T is not available for ARM processors (AWS Graviton).');
    return;
  }

  console.log('Installing Studio 3T for Linux (x86-64)...');
  console.log('');
  console.log('NOTE: Studio 3T is a GUI application. If you are running on a');
  console.log('headless server, you will need X11 forwarding to launch it.');
  console.log('');

  // Step 1: Install required dependencies
  console.log('Installing dependencies...');

  // Detect package manager (dnf for Amazon Linux 2023, yum for Amazon Linux 2)
  const hasDnf = shell.commandExists('dnf');
  const pkgManager = hasDnf ? 'dnf' : 'yum';

  const depsResult = await shell.exec(
    `sudo ${pkgManager} install -y wget tar gzip gtk3 libnotify nss libXScrnSaver libXtst at-spi2-core libsecret`
  );

  if (depsResult.code !== 0) {
    console.log('Warning: Some dependencies may not have installed correctly.');
    console.log('Continuing with installation...');
  }

  // Step 2: Download the tarball
  console.log('Downloading Studio 3T...');
  const downloadResult = await shell.exec(
    `wget -q "${LINUX_TARBALL_URL}" -O /tmp/studio-3t-linux-x64.tar.gz`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      `Failed to download Studio 3T.\n` +
      `Error: ${downloadResult.stderr}\n\n` +
      `The download URL may have changed. Check:\n` +
      `  https://studio3t.com/download/`
    );
  }

  // Step 3: Extract the archive
  console.log('Extracting archive...');
  const extractResult = await shell.exec(
    'tar -xzf /tmp/studio-3t-linux-x64.tar.gz -C /tmp/'
  );

  if (extractResult.code !== 0) {
    throw new Error(`Failed to extract Studio 3T archive: ${extractResult.stderr}`);
  }

  // Step 4: Run the installer in quiet/non-interactive mode
  console.log('Running installer (this may take a moment)...');
  const installResult = await shell.exec(
    'sudo /tmp/studio-3t-linux-x64.sh -q'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to run Studio 3T installer.\n` +
      `Error: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you have sudo privileges\n` +
      `  2. Try running manually: sudo /tmp/studio-3t-linux-x64.sh -q -dir ${LINUX_INSTALL_DIR}`
    );
  }

  // Step 5: Clean up downloaded files
  console.log('Cleaning up...');
  await shell.exec('rm -f /tmp/studio-3t-linux-x64.tar.gz /tmp/studio-3t-linux-x64.sh');

  // Verify installation
  const verified = await isStudio3TInstalledLinux();
  if (!verified) {
    throw new Error(
      'Installation appeared to complete but Studio 3T was not found.\n' +
      'Please check /opt/studio3t/ for the installation.'
    );
  }

  console.log('Studio 3T installed successfully.');
  console.log('');
  console.log('For X11-forwarded sessions, launch Studio 3T with:');
  console.log('  /opt/studio3t/Studio-3T &');
  console.log('');
  console.log('To connect via SSH with X11 forwarding:');
  console.log('  ssh -X user@your-server');
}

/**
 * Install Studio 3T on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 21H2 or higher (64-bit), or Windows 11
 * - At least 4 GB RAM
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * The installation uses the 'studio3t' Chocolatey package which downloads
 * the official Studio 3T installer and configures the application.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Studio 3T is already installed...');

  // Check if Studio 3T is installed via Chocolatey
  const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (packageInstalled) {
    const version = await choco.getPackageVersion(CHOCO_PACKAGE_NAME);
    if (version) {
      console.log(`Studio 3T ${version} is already installed via Chocolatey, skipping installation.`);
    } else {
      console.log('Studio 3T is already installed via Chocolatey, skipping installation.');
    }
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
      'Then retry installing Studio 3T.'
    );
  }

  console.log('Installing Studio 3T via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install Studio 3T
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Studio 3T via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Try: choco install studio3t -y\n` +
      `  3. Check Windows Defender is not blocking the installation`
    );
  }

  // Verify installation
  const installed = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!installed) {
    throw new Error(
      'Installation appeared to complete but Studio 3T was not found.\n' +
      'Please try: choco install studio3t -y'
    );
  }

  const version = await choco.getPackageVersion(CHOCO_PACKAGE_NAME);
  console.log(`Studio 3T ${version || ''} installed successfully.`);
  console.log('');
  console.log('Launch Studio 3T from:');
  console.log('  - Start Menu');
  console.log('  - Command line: studio3t');
  console.log('');
  console.log('NOTE: On first launch, Studio 3T will prompt you to accept the license');
  console.log('agreement and optionally sign in. You can use Studio 3T Free for');
  console.log('non-commercial purposes without an account.');
}

/**
 * Install Studio 3T on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - WSLg enabled (Windows 11 or Windows 10 build 21364+) for GUI support
 * - sudo privileges within WSL
 * - x86-64 architecture (ARM64 Windows not supported)
 *
 * NOTE: Running GUI applications in WSL requires WSLg. Without WSLg,
 * you cannot run Studio 3T's graphical interface in WSL. The installation
 * follows the same tarball method as Ubuntu.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Check if already installed
  const isInstalled = await isStudio3TInstalledLinux();
  if (isInstalled) {
    console.log('Studio 3T is already installed in /opt/studio3t, skipping installation.');
    return;
  }

  // Check if WSLg is available (DISPLAY environment variable)
  const display = process.env.DISPLAY;
  if (!display) {
    console.log('WARNING: WSLg does not appear to be available ($DISPLAY is not set).');
    console.log('Studio 3T requires a graphical display to run.');
    console.log('');
    console.log('Options:');
    console.log('  1. Update Windows to a version that supports WSLg');
    console.log('  2. Install Studio 3T on Windows and use it directly');
    console.log('');
  }

  // Check architecture - Studio 3T requires x86-64
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();

  if (arch !== 'x86_64') {
    console.log(`Studio 3T requires x86-64 architecture.`);
    console.log(`Your architecture is: ${arch}`);
    console.log('');
    console.log('Studio 3T is not available for ARM processors.');
    return;
  }

  console.log('Installing Studio 3T for Linux (x86-64) in WSL...');
  console.log('');

  // Step 1: Download the tarball
  console.log('Downloading Studio 3T...');
  const downloadResult = await shell.exec(
    `wget -q "${LINUX_TARBALL_URL}" -O /tmp/studio-3t-linux-x64.tar.gz`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      `Failed to download Studio 3T.\n` +
      `Error: ${downloadResult.stderr}\n\n` +
      `The download URL may have changed. Check:\n` +
      `  https://studio3t.com/download/`
    );
  }

  // Step 2: Extract the archive
  console.log('Extracting archive...');
  const extractResult = await shell.exec(
    'tar -xzf /tmp/studio-3t-linux-x64.tar.gz -C /tmp/'
  );

  if (extractResult.code !== 0) {
    throw new Error(`Failed to extract Studio 3T archive: ${extractResult.stderr}`);
  }

  // Step 3: Run the installer in quiet/non-interactive mode
  // Note: The -dir parameter is required to specify installation directory
  console.log('Running installer (this may take a moment)...');
  const installResult = await shell.exec(
    `sudo /tmp/studio-3t-linux-x64.sh -q -dir ${LINUX_INSTALL_DIR}`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to run Studio 3T installer.\n` +
      `Error: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you have sudo privileges\n` +
      `  2. Try running manually: sudo /tmp/studio-3t-linux-x64.sh -q -dir ${LINUX_INSTALL_DIR}`
    );
  }

  // Step 4: Clean up downloaded files
  console.log('Cleaning up...');
  await shell.exec('rm -f /tmp/studio-3t-linux-x64.tar.gz /tmp/studio-3t-linux-x64.sh');

  // Verify installation
  const verified = await isStudio3TInstalledLinux();
  if (!verified) {
    throw new Error(
      'Installation appeared to complete but Studio 3T was not found.\n' +
      'Please check /opt/studio3t/ for the installation.'
    );
  }

  console.log('Studio 3T installed successfully.');
  console.log('');
  console.log('Launch Studio 3T with:');
  console.log('  /opt/studio3t/Studio-3T &');
  console.log('');
  console.log('IMPORTANT for WSL users:');
  console.log('  - Studio 3T requires WSLg for GUI support');
  console.log('  - If you see display errors, check that $DISPLAY is set');
  console.log('  - For rendering issues, try: LIBGL_ALWAYS_SOFTWARE=1 /opt/studio3t/Studio-3T &');
}

/**
 * Install Studio 3T from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Studio 3T
 * on the Windows host using Chocolatey via PowerShell interop.
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
  console.log('Installing Studio 3T on the Windows host...');
  console.log('');

  // Check if Studio 3T is already installed via Chocolatey
  const checkResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco list --local-only --exact studio3t"'
  );
  if (checkResult.code === 0 && checkResult.stdout.toLowerCase().includes('studio3t')) {
    console.log('Studio 3T is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('Launch Studio 3T from the Windows Start Menu.');
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
      'Then retry installing Studio 3T.'
    );
  }

  console.log('Installing Studio 3T via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install via PowerShell using Chocolatey
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install studio3t -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Studio 3T.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell: choco install studio3t -y`
    );
  }

  console.log('Studio 3T installed successfully.');
  console.log('');
  console.log('Launch Studio 3T from:');
  console.log('  - Windows Start Menu');
  console.log('  - Git Bash: start studio3t');
}

/**
 * Check if Studio 3T is installed on the current platform.
 *
 * This function performs platform-specific checks to determine if Studio 3T
 * is already installed on the system.
 *
 * @returns {Promise<boolean>} True if Studio 3T is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    return isStudio3TInstalledMacOS();
  }

  if (platform.type === 'windows' || platform.type === 'gitbash') {
    return choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  }

  if (['ubuntu', 'debian', 'wsl', 'amazon_linux', 'rhel', 'fedora'].includes(platform.type)) {
    return isStudio3TInstalledLinux();
  }

  // Raspberry Pi is not supported
  return false;
}

/**
 * Check if this installer is supported on the current platform.
 * Studio 3T is not available for Raspberry Pi (ARM architecture not supported).
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  const supportedPlatforms = ['macos', 'ubuntu', 'debian', 'wsl', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'];
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
 * - macOS: Studio 3T via Homebrew cask
 * - Ubuntu/Debian: Studio 3T via official tarball
 * - Amazon Linux/RHEL: Studio 3T via official tarball
 * - Windows: Studio 3T via Chocolatey
 * - WSL (Ubuntu): Studio 3T via official tarball (requires WSLg)
 * - Git Bash: Studio 3T on Windows host via Chocolatey
 *
 * Unsupported platforms:
 * - Raspberry Pi OS: ARM architecture not supported
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
    console.log(`Studio 3T is not available for ${platform.type}.`);
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

// Allow direct execution: node studio-3t.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
