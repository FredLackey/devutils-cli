#!/usr/bin/env node

/**
 * @fileoverview Install DBeaver Community Edition - a free, open-source universal database management tool.
 * @module installs/dbeaver
 *
 * DBeaver Community Edition is a free, open-source universal database management
 * tool and SQL client for developers, database administrators, analysts, and anyone
 * who works with databases. It supports virtually all popular databases including
 * MySQL, PostgreSQL, MariaDB, SQLite, Oracle, DB2, SQL Server, Sybase, MS Access,
 * Teradata, Firebird, Derby, and many more through JDBC drivers.
 *
 * Key features:
 * - Powerful SQL editor with syntax highlighting and auto-completion
 * - Visual query builder for complex queries
 * - Data export/import capabilities
 * - ER diagram generation
 * - Database schema browsing
 *
 * DBeaver bundles its own JRE (OpenJDK 21), eliminating the need for separate
 * Java installation.
 *
 * This installer provides:
 * - macOS: DBeaver via Homebrew cask
 * - Ubuntu/Debian: DBeaver via official APT repository
 * - Raspberry Pi OS: DBeaver via official APT repository (ARM64 compatible)
 * - Amazon Linux/RHEL: DBeaver via direct RPM download
 * - Windows: DBeaver via Chocolatey
 * - WSL (Ubuntu): DBeaver via official APT repository (requires WSLg for GUI)
 * - Git Bash: DBeaver installed on Windows host via Chocolatey
 *
 * IMPORTANT PLATFORM NOTES:
 * - DBeaver is a GUI application and requires a display environment
 * - All platforms include bundled OpenJDK 21 (no separate Java required)
 * - On headless servers, DBeaver cannot be used; consider CLI tools instead
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Indicates whether this installer requires a desktop environment.
 * DBeaver is a GUI database management tool and requires a display.
 * @type {boolean}
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for DBeaver Community Edition on macOS.
 * This installs the full DBeaver application to /Applications.
 */
const HOMEBREW_CASK_NAME = 'dbeaver-community';

/**
 * The Chocolatey package name for DBeaver on Windows.
 * This is the official DBeaver package maintained by the Chocolatey community.
 */
const CHOCO_PACKAGE_NAME = 'dbeaver';

/**
 * The APT package name for DBeaver Community Edition on Debian-based systems.
 * This is the package name used in DBeaver's official repository.
 */
const APT_PACKAGE_NAME = 'dbeaver-ce';

/**
 * The macOS application name (as it appears in /Applications).
 */
const MACOS_APP_NAME = 'DBeaver';

/**
 * DBeaver's GPG key URL for package verification on Debian-based systems.
 */
const DBEAVER_GPG_KEY_URL = 'https://dbeaver.io/debs/dbeaver.gpg.key';

/**
 * DBeaver's GPG keyring path for APT signature verification.
 */
const DBEAVER_KEYRING_PATH = '/usr/share/keyrings/dbeaver.gpg.key';

/**
 * DBeaver's APT repository configuration.
 */
const DBEAVER_APT_REPO = 'deb [signed-by=/usr/share/keyrings/dbeaver.gpg.key] https://dbeaver.io/debs/dbeaver-ce /';

/**
 * DBeaver's APT sources list file path.
 */
const DBEAVER_SOURCES_LIST = '/etc/apt/sources.list.d/dbeaver.list';

/**
 * DBeaver RPM download URL for Amazon Linux/RHEL.
 * The "latest-stable" URL always points to the most recent stable release.
 */
const DBEAVER_RPM_URL = 'https://dbeaver.io/files/dbeaver-ce-latest-stable.x86_64.rpm';

/**
 * Temporary path for downloading the RPM package.
 */
const DBEAVER_RPM_TEMP_PATH = '/tmp/dbeaver-ce.rpm';

/**
 * Check if DBeaver is installed on macOS by looking for the .app bundle.
 *
 * This is more reliable than checking for a CLI command since DBeaver
 * on macOS is a GUI application without a command-line entry point in PATH.
 *
 * @returns {boolean} True if DBeaver.app exists, false otherwise
 */
function isDbeaverInstalledMacOS() {
  return macosApps.isAppInstalled(MACOS_APP_NAME);
}

/**
 * Check if the 'dbeaver' command is available in the system PATH.
 *
 * On Linux systems, DBeaver installs a command-line launcher at /usr/bin/dbeaver.
 * This function checks if that launcher is accessible.
 *
 * @returns {boolean} True if the dbeaver command is available, false otherwise
 */
function isDbeaverCommandAvailable() {
  return shell.commandExists('dbeaver');
}

/**
 * Set up DBeaver's official APT repository on Ubuntu/Debian/Raspberry Pi OS.
 *
 * This function:
 * 1. Installs prerequisites (wget, gpg)
 * 2. Downloads and installs DBeaver's GPG key for package verification
 * 3. Adds DBeaver's APT repository to sources
 * 4. Updates the package cache
 *
 * The GPG key is stored in /usr/share/keyrings/ following modern APT best practices.
 *
 * @returns {Promise<void>}
 * @throws {Error} If any step fails
 */
async function setupDbeaverAptRepository() {
  console.log('Setting up DBeaver APT repository...');

  // Install prerequisites needed to download and verify the repository
  console.log('Installing prerequisites (wget, gpg)...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget gpg'
  );
  if (prereqResult.code !== 0) {
    throw new Error(`Failed to install prerequisites: ${prereqResult.stderr}`);
  }

  // Download and install DBeaver's GPG key
  console.log('Importing DBeaver GPG key...');
  const gpgResult = await shell.exec(
    `sudo wget -O ${DBEAVER_KEYRING_PATH} ${DBEAVER_GPG_KEY_URL}`
  );
  if (gpgResult.code !== 0) {
    throw new Error(`Failed to import DBeaver GPG key: ${gpgResult.stderr}`);
  }

  // Add DBeaver's APT repository
  console.log('Adding DBeaver repository...');
  const repoResult = await shell.exec(
    `echo "${DBEAVER_APT_REPO}" | sudo tee ${DBEAVER_SOURCES_LIST} > /dev/null`
  );
  if (repoResult.code !== 0) {
    throw new Error(`Failed to add DBeaver repository: ${repoResult.stderr}`);
  }

  // Update package cache to include the new repository
  console.log('Updating package cache...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package cache: ${updateResult.stderr}`);
  }

  console.log('DBeaver APT repository configured successfully.');
}

/**
 * Install DBeaver Community Edition on macOS using Homebrew cask.
 *
 * Prerequisites:
 * - macOS 11 (Big Sur) or later
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 * - Approximately 500 MB disk space
 *
 * This function installs DBeaver as a macOS application via Homebrew cask.
 * The installation includes bundled OpenJDK 21, so no separate Java
 * installation is required.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if DBeaver is already installed...');

  // Check if DBeaver is already installed via the app bundle
  if (isDbeaverInstalledMacOS()) {
    const version = macosApps.getAppVersion(MACOS_APP_NAME);
    if (version) {
      console.log(`DBeaver ${version} is already installed, skipping installation.`);
    } else {
      console.log('DBeaver is already installed, skipping installation.');
    }
    return;
  }

  // Also check if the cask is installed (DBeaver may be installed but in a different location)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('DBeaver is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('You can launch DBeaver from Applications or run: open -a DBeaver');
    return;
  }

  // Verify Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Install DBeaver using Homebrew cask
  console.log('Installing DBeaver Community Edition via Homebrew...');
  console.log('This may take a few minutes (approximately 500 MB download)...');
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    console.log('Failed to install DBeaver Community Edition via Homebrew.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "brew update && brew cleanup" and retry');
    console.log('  2. If you see quarantine errors, run:');
    console.log('     xattr -cr "/Applications/DBeaver.app"');
    console.log('  3. Try manual installation: brew reinstall --cask dbeaver-community');
    return;
  }

  // Verify the installation succeeded
  if (!isDbeaverInstalledMacOS()) {
    console.log('Installation may have failed: DBeaver.app not found in /Applications.');
    console.log('Please try reinstalling: brew reinstall --cask dbeaver-community');
    return;
  }

  // Display installed version
  const version = macosApps.getAppVersion(MACOS_APP_NAME);

  console.log('DBeaver Community Edition installed successfully.');
  console.log('');
  if (version) {
    console.log(`DBeaver version: ${version}`);
    console.log('');
  }
  console.log('You can launch DBeaver from:');
  console.log('  - Applications folder');
  console.log('  - Command line: open -a DBeaver');
  console.log('');
  console.log('NOTE: On first launch, you can create database connections');
  console.log('via Database > New Database Connection.');
}

/**
 * Install DBeaver Community Edition on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 20.04 (Focal) or later, or Debian 10 (Buster) or later (64-bit)
 * - sudo privileges
 * - wget and gpg utilities (installed automatically)
 * - Graphical display environment for GUI
 *
 * This function adds DBeaver's official APT repository and installs the
 * dbeaver-ce package. The repository is signed with DBeaver's GPG key
 * for package verification.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if DBeaver is already installed...');

  // Check if DBeaver is already installed via APT
  const isAptInstalled = await apt.isPackageInstalled(APT_PACKAGE_NAME);
  if (isAptInstalled) {
    const version = await apt.getPackageVersion(APT_PACKAGE_NAME);
    console.log(`DBeaver ${version || 'unknown version'} is already installed, skipping...`);
    return;
  }

  // Also check if the dbeaver command exists (might be installed by other means)
  if (isDbeaverCommandAvailable()) {
    console.log('DBeaver is already installed, skipping...');
    return;
  }

  // Set up DBeaver's APT repository
  await setupDbeaverAptRepository();

  // Install DBeaver from the repository
  console.log('Installing DBeaver Community Edition via APT...');
  console.log('This may take a few minutes (approximately 500 MB download)...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install DBeaver Community Edition via APT.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "sudo apt-get update" and retry');
    console.log('  2. Check if the DBeaver repository was added:');
    console.log(`     cat ${DBEAVER_SOURCES_LIST}`);
    console.log('  3. Verify the GPG key exists:');
    console.log(`     ls -la ${DBEAVER_KEYRING_PATH}`);
    return;
  }

  // Verify the installation succeeded
  if (!isDbeaverCommandAvailable()) {
    console.log('Installation may have failed: dbeaver command not found after install.');
    return;
  }

  // Get installed version
  const version = await apt.getPackageVersion(APT_PACKAGE_NAME);

  console.log('DBeaver Community Edition installed successfully.');
  console.log('');
  if (version) {
    console.log(`DBeaver version: ${version}`);
    console.log('');
  }
  console.log('Launch DBeaver with:');
  console.log('  dbeaver &');
  console.log('');
  console.log('NOTE: DBeaver requires a graphical display. If you see display errors,');
  console.log('verify your X11 or Wayland session is configured correctly.');
}

/**
 * Install DBeaver Community Edition on Ubuntu running in WSL.
 *
 * Prerequisites:
 * - Windows 10 version 2004 or later, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - WSLg enabled (Windows 11) for GUI application support
 * - sudo privileges within WSL
 *
 * This function installs DBeaver natively within WSL. For users with WSLg,
 * the GUI will display properly. For users without WSLg, a recommendation
 * is provided to install DBeaver on Windows instead.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Check if DBeaver is already installed
  const isAptInstalled = await apt.isPackageInstalled(APT_PACKAGE_NAME);
  if (isAptInstalled) {
    const version = await apt.getPackageVersion(APT_PACKAGE_NAME);
    console.log(`DBeaver ${version || 'unknown version'} is already installed, skipping...`);
    return;
  }

  if (isDbeaverCommandAvailable()) {
    console.log('DBeaver is already installed, skipping...');
    return;
  }

  // Check if WSLg is available (DISPLAY environment variable)
  const display = process.env.DISPLAY;
  if (!display) {
    console.log('WARNING: WSLg does not appear to be available ($DISPLAY is not set).');
    console.log('DBeaver requires a graphical display to run.');
    console.log('');
    console.log('Options:');
    console.log('  1. Update to Windows 11 which includes WSLg support');
    console.log('  2. Install DBeaver on Windows and connect to databases in WSL');
    console.log('     via localhost connections');
    console.log('');
    console.log('Continuing with installation anyway...');
    console.log('');
  }

  // Set up DBeaver's APT repository and install
  await setupDbeaverAptRepository();

  console.log('Installing DBeaver Community Edition via APT...');
  console.log('This may take a few minutes...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install DBeaver Community Edition via APT.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify the installation succeeded
  if (!isDbeaverCommandAvailable()) {
    console.log('Installation may have failed: dbeaver command not found after install.');
    return;
  }

  const version = await apt.getPackageVersion(APT_PACKAGE_NAME);

  console.log('DBeaver Community Edition installed successfully in WSL.');
  console.log('');
  if (version) {
    console.log(`DBeaver version: ${version}`);
    console.log('');
  }
  console.log('Launch DBeaver with:');
  console.log('  dbeaver &');
  console.log('');
  console.log('IMPORTANT for WSL users:');
  console.log('  - Requires WSLg for GUI support (Windows 11)');
  console.log('  - If you see display errors, verify $DISPLAY is set');
  console.log('  - Alternative: Install DBeaver on Windows and connect to');
  console.log('    databases in WSL via localhost');
}

/**
 * Install DBeaver Community Edition on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
 * - Raspberry Pi 4 or later recommended (at least 2 GB RAM)
 * - sudo privileges
 * - Graphical display environment
 *
 * IMPORTANT: DBeaver provides ARM64-compatible packages. 64-bit Raspberry Pi OS
 * is recommended for best performance. 32-bit systems have limited support
 * and may experience issues.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if DBeaver is already installed...');

  // Check if DBeaver is already installed
  const isAptInstalled = await apt.isPackageInstalled(APT_PACKAGE_NAME);
  if (isAptInstalled) {
    const version = await apt.getPackageVersion(APT_PACKAGE_NAME);
    console.log(`DBeaver ${version || 'unknown version'} is already installed, skipping...`);
    return;
  }

  if (isDbeaverCommandAvailable()) {
    console.log('DBeaver is already installed, skipping...');
    return;
  }

  // Check and report architecture
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  console.log(`Detected architecture: ${arch}`);

  if (arch !== 'aarch64') {
    console.log('');
    console.log('WARNING: You are running 32-bit Raspberry Pi OS.');
    console.log('DBeaver primarily supports 64-bit ARM (aarch64).');
    console.log('You may experience installation or runtime issues.');
    console.log('');
    console.log('For best results, consider upgrading to 64-bit Raspberry Pi OS.');
    console.log('');
  }

  // Set up DBeaver's APT repository and install
  await setupDbeaverAptRepository();

  console.log('Installing DBeaver Community Edition via APT...');
  console.log('This may take several minutes on Raspberry Pi...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install DBeaver Community Edition via APT.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have at least 2 GB RAM available');
    console.log('  2. Consider adding swap space if you see memory errors:');
    console.log('     sudo fallocate -l 2G /swapfile');
    console.log('     sudo chmod 600 /swapfile');
    console.log('     sudo mkswap /swapfile');
    console.log('     sudo swapon /swapfile');
    return;
  }

  // Verify the installation succeeded
  if (!isDbeaverCommandAvailable()) {
    console.log('Installation may have failed: dbeaver command not found after install.');
    return;
  }

  const version = await apt.getPackageVersion(APT_PACKAGE_NAME);

  console.log('DBeaver Community Edition installed successfully.');
  console.log('');
  if (version) {
    console.log(`DBeaver version: ${version}`);
    console.log('');
  }
  console.log('Launch DBeaver with:');
  console.log('  dbeaver &');
  console.log('');
  console.log('NOTE: DBeaver may be slow on Raspberry Pi due to limited resources.');
  console.log('Consider closing other applications for better performance.');
}

/**
 * Install DBeaver Community Edition on Amazon Linux/RHEL using DNF or YUM.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8+, CentOS 8+, or Fedora
 * - sudo privileges
 * - 64-bit system
 * - Graphical display environment
 * - wget utility (installed automatically)
 *
 * This function downloads the latest stable RPM package directly from DBeaver's
 * website and installs it using DNF or YUM depending on what's available.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if DBeaver is already installed...');

  // Check if DBeaver is already installed by looking for the command
  if (isDbeaverCommandAvailable()) {
    console.log('DBeaver is already installed, skipping...');
    return;
  }

  // Also check via rpm
  const rpmCheck = await shell.exec('rpm -q dbeaver-ce 2>/dev/null');
  if (rpmCheck.code === 0) {
    console.log(`DBeaver ${rpmCheck.stdout.trim()} is already installed, skipping...`);
    return;
  }

  // Detect package manager (dnf for AL2023, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    console.log('Neither dnf nor yum package manager found.');
    console.log('This installer supports Amazon Linux 2023 (dnf) and Amazon Linux 2 (yum).');
    return;
  }

  console.log(`Detected package manager: ${packageManager}`);

  // Install wget if not available
  console.log('Ensuring wget is installed...');
  const wgetResult = await shell.exec(`sudo ${packageManager} install -y wget`);
  if (wgetResult.code !== 0) {
    console.log('Warning: Could not install wget. Continuing anyway...');
  }

  // Download the latest stable RPM package
  console.log('Downloading DBeaver Community Edition RPM...');
  console.log('This may take a few minutes (approximately 100 MB download)...');
  const downloadResult = await shell.exec(
    `wget -q ${DBEAVER_RPM_URL} -O ${DBEAVER_RPM_TEMP_PATH}`
  );

  if (downloadResult.code !== 0) {
    console.log('Failed to download DBeaver RPM package.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Check your internet connection');
    console.log('  2. Try downloading manually from https://dbeaver.io/download/');
    return;
  }

  // Install the RPM package
  console.log('Installing DBeaver Community Edition...');
  const installResult = await shell.exec(
    `sudo ${packageManager} install -y ${DBEAVER_RPM_TEMP_PATH}`
  );

  // Clean up the downloaded file
  console.log('Cleaning up...');
  await shell.exec(`rm -f ${DBEAVER_RPM_TEMP_PATH}`);

  if (installResult.code !== 0) {
    console.log('Failed to install DBeaver Community Edition.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Install GUI dependencies:');
    console.log(`     sudo ${packageManager} install -y libX11 libxcb libXcomposite libXcursor libXdamage libXext libXfixes libXi libXrender libXtst alsa-lib gtk3`);
    console.log('  2. Try the installation again');
    return;
  }

  // Verify installation
  if (!isDbeaverCommandAvailable()) {
    console.log('Installation may have failed: dbeaver command not found after install.');
    return;
  }

  // Get installed version from rpm
  const versionResult = await shell.exec('rpm -q dbeaver-ce');
  const version = versionResult.code === 0 ? versionResult.stdout.trim() : null;

  console.log('DBeaver Community Edition installed successfully.');
  console.log('');
  if (version) {
    console.log(`DBeaver version: ${version}`);
    console.log('');
  }
  console.log('Launch DBeaver with:');
  console.log('  dbeaver &');
  console.log('');
  console.log('NOTE: DBeaver requires a graphical display. For remote servers,');
  console.log('use X11 forwarding (ssh -X) or install a desktop environment.');
}

/**
 * Install DBeaver Community Edition on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 or later (64-bit), or Windows 11
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * The Chocolatey package:
 * - Includes bundled JRE (no separate Java installation needed)
 * - Creates Start Menu shortcuts
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if DBeaver is already installed...');

  // Check if DBeaver is already installed via Chocolatey
  const isChocoInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (isChocoInstalled) {
    const version = await choco.getPackageVersion(CHOCO_PACKAGE_NAME);
    console.log(`DBeaver ${version || 'unknown version'} is already installed via Chocolatey, skipping...`);
    return;
  }

  // Also check if the dbeaver command exists (might be installed by other means)
  if (isDbeaverCommandAvailable()) {
    console.log('DBeaver is already installed, skipping...');
    console.log('');
    console.log('Note: DBeaver was not installed via Chocolatey.');
    console.log('If you want to manage it with Chocolatey, first uninstall the existing version.');
    return;
  }

  // Verify Chocolatey is available - it is required for Windows installation
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('');
    console.log('To install Chocolatey, run in an Administrator PowerShell:');
    console.log("  Set-ExecutionPolicy Bypass -Scope Process -Force; " +
      "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; " +
      "iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))");
    return;
  }

  // Install DBeaver using Chocolatey
  console.log('Installing DBeaver Community Edition via Chocolatey...');
  console.log('This may take a few minutes...');
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install DBeaver Community Edition via Chocolatey.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you are running as Administrator');
    console.log('  2. Try: choco install dbeaver -y --force');
    return;
  }

  // Verify the installation succeeded
  const verified = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!verified) {
    console.log('Installation may have failed: dbeaver package not found after install.');
    return;
  }

  const version = await choco.getPackageVersion(CHOCO_PACKAGE_NAME);

  console.log('DBeaver Community Edition installed successfully via Chocolatey.');
  console.log('');
  if (version) {
    console.log(`DBeaver version: ${version}`);
    console.log('');
  }
  console.log('Launch DBeaver from:');
  console.log('  - Start Menu');
  console.log('  - Command line: dbeaver');
  console.log('');
  console.log('IMPORTANT: Close and reopen your terminal for PATH changes to take effect.');
}

/**
 * Install DBeaver Community Edition from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs DBeaver
 * on the Windows host using Chocolatey via PowerShell interop.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey package manager installed on Windows
 * - Administrator privileges
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('');

  // Check if DBeaver is already available
  if (isDbeaverCommandAvailable()) {
    console.log('DBeaver is already installed, skipping...');
    return;
  }

  // Check via PowerShell if Chocolatey has it installed
  const checkResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco list --local-only --exact dbeaver"'
  );
  if (checkResult.code === 0 && checkResult.stdout.toLowerCase().includes('dbeaver')) {
    console.log('DBeaver is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('Launch DBeaver from the Windows Start Menu or run: dbeaver');
    return;
  }

  // Check if Chocolatey is available
  const chocoCheck = await shell.exec('powershell.exe -NoProfile -Command "choco --version"');
  if (chocoCheck.code !== 0) {
    console.log('Chocolatey is not installed on Windows.');
    console.log('');
    console.log('Install Chocolatey by running the following in an Administrator PowerShell:');
    console.log("  Set-ExecutionPolicy Bypass -Scope Process -Force; " +
      "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; " +
      "iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))");
    return;
  }

  // Install via PowerShell using Chocolatey
  console.log('Installing DBeaver Community Edition on the Windows host via Chocolatey...');
  console.log('This may take a few minutes...');

  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "choco install ${CHOCO_PACKAGE_NAME} -y"`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install DBeaver Community Edition.');
    console.log(installResult.stdout || installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure Chocolatey is installed on Windows');
    console.log('  2. Run Git Bash as Administrator and retry');
    console.log('  3. Try installing directly from PowerShell:');
    console.log('     choco install dbeaver -y');
    return;
  }

  console.log('DBeaver Community Edition installed successfully.');
  console.log('');
  console.log('IMPORTANT: Close and reopen Git Bash for PATH changes to take effect.');
  console.log('');
  console.log('Launch DBeaver from:');
  console.log('  - Windows Start Menu');
  console.log('  - Git Bash: start dbeaver');
}

/**
 * Check if DBeaver is installed on the current system.
 *
 * This function checks for DBeaver installation using platform-appropriate methods:
 * - macOS: Checks if DBeaver.app exists in /Applications
 * - Windows: Checks if Chocolatey package 'dbeaver' is installed
 * - Linux: Checks if APT package 'dbeaver-ce' is installed or command exists
 *
 * @returns {Promise<boolean>} True if DBeaver is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    return isDbeaverInstalledMacOS();
  }

  if (platform.type === 'windows' || platform.type === 'gitbash') {
    return choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  }

  // Ubuntu/Debian/Raspbian/WSL: Check APT installation
  if (['ubuntu', 'debian', 'wsl', 'raspbian'].includes(platform.type)) {
    return apt.isPackageInstalled(APT_PACKAGE_NAME);
  }

  // Amazon Linux/RHEL: Check if command exists
  if (['amazon_linux', 'rhel', 'fedora'].includes(platform.type)) {
    return isDbeaverCommandAvailable();
  }

  // Fallback: Check if command exists
  return isDbeaverCommandAvailable();
}

/**
 * Check if this installer is supported on the current platform.
 *
 * DBeaver is supported on all major desktop platforms but requires a graphical
 * display environment since it is a GUI application. On headless servers or
 * containers without a display, this function returns false.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();

  // First check if the platform is supported
  const supportedPlatforms = ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel', 'windows', 'gitbash'];
  if (!supportedPlatforms.includes(platform.type)) {
    return false;
  }

  // This installer requires a desktop environment
  if (REQUIRES_DESKTOP && !os.isDesktopAvailable()) {
    return false;
  }

  return true;
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. DBeaver is supported on
 * all major desktop platforms:
 *
 * - macOS: Homebrew cask
 * - Ubuntu/Debian: APT with DBeaver's official repository
 * - Ubuntu on WSL: APT with DBeaver's official repository
 * - Raspberry Pi OS: APT with DBeaver's official repository
 * - Amazon Linux/RHEL: Direct RPM download and install
 * - Windows: Chocolatey
 * - Git Bash: Chocolatey on Windows host
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their corresponding installer functions
  // Multiple platform types can map to the same installer (e.g., debian and ubuntu)
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
    'gitbash': install_gitbash,
  };

  // Look up the installer for the detected platform
  const installer = installers[platform.type];

  // If no installer exists for this platform, inform the user gracefully
  if (!installer) {
    console.log(`DBeaver Community Edition is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
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
  install_gitbash,
};

// Allow direct execution: node dbeaver.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
