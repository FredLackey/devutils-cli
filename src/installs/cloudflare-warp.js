#!/usr/bin/env node

/**
 * @fileoverview Install Cloudflare WARP VPN client across supported platforms.
 * @module installs/cloudflare-warp
 *
 * Cloudflare WARP is a VPN client that encrypts all traffic leaving your device
 * and routes it through Cloudflare's global network. Built on the WireGuard protocol,
 * WARP provides fast, secure connections while protecting your privacy from ISP
 * snooping and network-level tracking.
 *
 * WARP operates in several modes:
 * - WARP mode (default): Encrypts all traffic (including DNS) and routes it through Cloudflare
 * - 1.1.1.1 mode: Only encrypts DNS traffic to Cloudflare's 1.1.1.1 resolver
 * - WARP+ mode: Premium tier with optimized routing through Cloudflare's Argo network
 *
 * This installer provides:
 * - Cloudflare WARP GUI application via Homebrew cask for macOS
 * - Cloudflare WARP daemon via official APT repository for Ubuntu/Debian
 * - Cloudflare WARP via DNF/YUM for Amazon Linux/RHEL
 * - Cloudflare WARP GUI via Chocolatey for Windows
 * - Windows WARP installation from Git Bash via PowerShell
 *
 * IMPORTANT PLATFORM NOTES:
 * - Raspberry Pi OS: WARP is NOT officially supported on ARM Linux architecture
 * - WSL: Recommended to install WARP on Windows host; WSL traffic is automatically protected
 * - After installation, WARP must be manually connected using the GUI or warp-cli
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew cask name for Cloudflare WARP on macOS.
 * @constant {string}
 */
const HOMEBREW_CASK_NAME = 'cloudflare-warp';

/**
 * The Chocolatey package name for Cloudflare WARP on Windows.
 * Note: The package is named 'warp' not 'cloudflare-warp' on Chocolatey.
 * @constant {string}
 */
const CHOCO_PACKAGE_NAME = 'warp';

/**
 * The command used to verify WARP CLI installation on Linux systems.
 * @constant {string}
 */
const WARP_CLI_COMMAND = 'warp-cli';

/**
 * The macOS application path where WARP is installed.
 * Used for verification and to locate the bundled warp-cli.
 * @constant {string}
 */
const MACOS_APP_PATH = '/Applications/Cloudflare WARP.app';

/**
 * The path to warp-cli bundled inside the macOS application.
 * @constant {string}
 */
const MACOS_WARP_CLI_PATH = '/Applications/Cloudflare WARP.app/Contents/Resources/warp-cli';

/**
 * Check if the WARP CLI command is available in the system PATH.
 * This performs a quick check that works across Linux platforms.
 *
 * Note: On macOS, warp-cli is bundled inside the application and not in PATH.
 * Use isWarpAppInstalledMacOS() for macOS verification instead.
 *
 * @returns {boolean} True if the warp-cli command is available, false otherwise
 */
function isWarpCliCommandAvailable() {
  return shell.commandExists(WARP_CLI_COMMAND);
}

/**
 * Check if Cloudflare WARP application is installed on macOS.
 * Checks for the application bundle in /Applications.
 *
 * @returns {boolean} True if WARP app is installed on macOS, false otherwise
 */
function isWarpAppInstalledMacOS() {
  const fs = require('fs');
  try {
    return fs.existsSync(MACOS_APP_PATH);
  } catch {
    return false;
  }
}

/**
 * Get the installed version of WARP CLI on Linux systems.
 *
 * Executes 'warp-cli --version' to verify WARP is properly installed
 * and retrieve the version number.
 *
 * @returns {Promise<string|null>} WARP version string, or null if not installed
 */
async function getWarpCliVersion() {
  if (!isWarpCliCommandAvailable()) {
    return null;
  }

  const result = await shell.exec('warp-cli --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "warp-cli 2024.6.555.0 (a1b2c3d4)"
    // Extract just the version number
    const versionMatch = result.stdout.match(/warp-cli\s+([\d.]+)/);
    return versionMatch ? versionMatch[1] : result.stdout.trim();
  }
  return null;
}

/**
 * Get the installed version of WARP on macOS using the bundled warp-cli.
 *
 * @returns {Promise<string|null>} WARP version string, or null if not installed
 */
async function getWarpVersionMacOS() {
  if (!isWarpAppInstalledMacOS()) {
    return null;
  }

  // Use the bundled warp-cli inside the application
  const result = await shell.exec(`"${MACOS_WARP_CLI_PATH}" --version 2>/dev/null`);
  if (result.code === 0 && result.stdout) {
    const versionMatch = result.stdout.match(/warp-cli\s+([\d.]+)/);
    return versionMatch ? versionMatch[1] : result.stdout.trim();
  }
  return null;
}

/**
 * Install Cloudflare WARP GUI application on macOS using Homebrew.
 *
 * This installs the full Cloudflare WARP desktop application, which includes
 * the GUI (menu bar icon), background daemon, and bundled warp-cli.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * After installation:
 * 1. Launch Cloudflare WARP from Applications or menu bar
 * 2. Grant VPN configuration permission when prompted
 * 3. Enable WARP by clicking the toggle in the menu bar app
 *
 * NOTE: On first launch, WARP will request permission to add VPN configurations.
 * The warp-cli is bundled inside the application at:
 *   /Applications/Cloudflare WARP.app/Contents/Resources/warp-cli
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if Cloudflare WARP is already installed...');

  // Check if WARP application is already installed
  if (isWarpAppInstalledMacOS()) {
    const version = await getWarpVersionMacOS();
    if (version) {
      console.log(`Cloudflare WARP ${version} is already installed, skipping installation.`);
    } else {
      console.log('Cloudflare WARP is already installed, skipping installation.');
    }
    console.log('');
    console.log('To launch Cloudflare WARP:');
    console.log('  open -a "Cloudflare WARP"');
    return;
  }

  // Also check if the cask is installed (WARP may be installed but app not in expected location)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Cloudflare WARP is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('To launch Cloudflare WARP:');
    console.log('  open -a "Cloudflare WARP"');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    return;
  }

  console.log('Installing Cloudflare WARP via Homebrew...');

  // Install WARP cask with --quiet to suppress non-essential output
  const result = await shell.exec('brew install --quiet --cask cloudflare-warp');

  if (result.code !== 0) {
    console.log('Failed to install Cloudflare WARP via Homebrew.');
    console.log(result.stderr || result.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "brew update" and retry');
    console.log('  2. Try manual installation: brew install --cask cloudflare-warp');
    console.log('  3. Or download directly from: https://one.one.one.one/');
    return;
  }

  // Verify installation succeeded
  if (isWarpAppInstalledMacOS()) {
    const version = await getWarpVersionMacOS();
    if (version) {
      console.log(`Cloudflare WARP ${version} installed successfully.`);
    } else {
      console.log('Cloudflare WARP installed successfully.');
    }
  } else {
    console.log('Cloudflare WARP installed successfully.');
  }

  console.log('');
  console.log('To complete setup:');
  console.log('  1. Launch Cloudflare WARP:');
  console.log('     open -a "Cloudflare WARP"');
  console.log('');
  console.log('  2. Click "Allow" when prompted to add VPN configurations.');
  console.log('');
  console.log('  3. Look for the WARP icon in the menu bar and click to enable.');
  console.log('');
  console.log('To verify WARP is working:');
  console.log('  curl -s https://www.cloudflare.com/cdn-cgi/trace/ | grep warp');
  console.log('  Expected output: warp=on');
  console.log('');
  console.log('NOTE: The warp-cli is bundled inside the application:');
  console.log('  /Applications/Cloudflare\\ WARP.app/Contents/Resources/warp-cli --help');
}

/**
 * Install Cloudflare WARP on Ubuntu/Debian using the official APT repository.
 *
 * This function:
 * 1. Installs prerequisites (curl, gpg, lsb-release)
 * 2. Downloads and installs Cloudflare's GPG key
 * 3. Adds the Cloudflare APT repository
 * 4. Installs the cloudflare-warp package
 *
 * Prerequisites:
 * - Ubuntu 20.04 (Focal), 22.04 (Jammy), or 24.04 (Noble)
 * - Debian 10 (Buster) through 13 (Trixie)
 * - 64-bit (x86_64/amd64) architecture only (ARM is NOT supported)
 * - sudo privileges
 *
 * After installation:
 * 1. Register with Cloudflare: warp-cli registration new
 * 2. Connect to WARP: warp-cli connect
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if Cloudflare WARP is already installed...');

  // Check if WARP is already installed
  const existingVersion = await getWarpCliVersion();
  if (existingVersion) {
    console.log(`Cloudflare WARP ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Verify architecture - WARP only supports x86_64 on Linux
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  if (arch !== 'x86_64') {
    console.log(`Cloudflare WARP is not available for ${arch} architecture.`);
    console.log('WARP only supports 64-bit (x86_64/amd64) on Linux.');
    return;
  }

  // Ensure prerequisites are installed
  console.log('Installing prerequisites (curl, gpg, lsb-release)...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl gpg lsb-release'
  );
  if (prereqResult.code !== 0) {
    console.log('Failed to install prerequisites.');
    console.log(prereqResult.stderr);
    return;
  }

  // Step 1: Add the Cloudflare GPG key
  console.log('Adding Cloudflare GPG key...');
  const gpgResult = await shell.exec(
    'curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | ' +
    'sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg'
  );
  if (gpgResult.code !== 0) {
    console.log('Failed to add Cloudflare GPG key.');
    console.log(gpgResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have internet connectivity');
    console.log('  2. Try running manually:');
    console.log('     curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg');
    return;
  }

  // Step 2: Add the Cloudflare repository
  console.log('Adding Cloudflare APT repository...');
  const repoResult = await shell.exec(
    'echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] ' +
    'https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | ' +
    'sudo tee /etc/apt/sources.list.d/cloudflare-client.list'
  );
  if (repoResult.code !== 0) {
    console.log('Failed to add Cloudflare repository.');
    console.log(repoResult.stderr);
    return;
  }

  // Step 3: Update package lists and install WARP
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Failed to update package lists.');
    console.log(updateResult.stderr);
    return;
  }

  console.log('Installing cloudflare-warp package...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y cloudflare-warp');
  if (installResult.code !== 0) {
    console.log('Failed to install Cloudflare WARP.');
    console.log(installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Verify the repository was added correctly:');
    console.log('     cat /etc/apt/sources.list.d/cloudflare-client.list');
    console.log('  2. Check if your distribution is supported');
    console.log('  3. Try running: sudo apt-get update && sudo apt-get install cloudflare-warp');
    return;
  }

  // Verify installation succeeded
  const version = await getWarpCliVersion();
  if (version) {
    console.log(`Cloudflare WARP ${version} installed successfully.`);
  } else {
    console.log('Cloudflare WARP installed successfully.');
  }

  console.log('');
  console.log('To complete setup:');
  console.log('  1. Register with Cloudflare:');
  console.log('     warp-cli registration new');
  console.log('');
  console.log('  2. Connect to WARP:');
  console.log('     warp-cli connect');
  console.log('');
  console.log('To verify WARP is working:');
  console.log('  warp-cli status');
  console.log('  curl -s https://www.cloudflare.com/cdn-cgi/trace/ | grep warp');
  console.log('  Expected output: warp=on');
  console.log('');
  console.log('If warp-cli is not found, start the service:');
  console.log('  sudo systemctl enable --now warp-svc');
}

/**
 * Handle Raspberry Pi OS installation attempt.
 *
 * Cloudflare WARP client is NOT officially supported on ARM Linux architectures.
 * This includes all Raspberry Pi devices running Raspberry Pi OS (both 32-bit
 * and 64-bit).
 *
 * The documentation mentions an unofficial workaround using wgcf with WireGuard,
 * but per project guidelines, we do not suggest alternatives.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Cloudflare WARP is not available for Raspberry Pi OS.');
  return;
}

/**
 * Install Cloudflare WARP on Amazon Linux/RHEL using DNF or YUM.
 *
 * This function:
 * 1. Detects the package manager (DNF for AL2023/RHEL8+, YUM for AL2/RHEL7)
 * 2. Adds the Cloudflare repository
 * 3. Installs the cloudflare-warp package
 * 4. Enables and starts the warp-svc service
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023), RHEL 8, CentOS 8, or compatible distributions
 * - 64-bit (x86_64) architecture only
 * - sudo privileges
 *
 * After installation:
 * 1. Register with Cloudflare: warp-cli registration new
 * 2. Connect to WARP: warp-cli connect
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if Cloudflare WARP is already installed...');

  // Check if WARP is already installed
  const existingVersion = await getWarpCliVersion();
  if (existingVersion) {
    console.log(`Cloudflare WARP ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Detect package manager (dnf for AL2023/RHEL8+, yum for AL2/RHEL7)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    console.log('Neither dnf nor yum package manager found.');
    console.log('This installer supports Amazon Linux 2023 (dnf) and Amazon Linux 2 (yum),');
    console.log('as well as RHEL/CentOS 7, 8, and 9.');
    return;
  }

  console.log(`Detected package manager: ${packageManager}`);

  // Ensure curl is installed
  if (!shell.commandExists('curl')) {
    console.log('Installing curl...');
    const curlResult = await shell.exec(`sudo ${packageManager} install -y curl`);
    if (curlResult.code !== 0) {
      console.log('Failed to install curl. Please install curl manually and retry.');
      return;
    }
  }

  // Step 1: Add the Cloudflare repository
  console.log('Adding Cloudflare repository...');
  const repoResult = await shell.exec(
    'curl -fsSl https://pkg.cloudflareclient.com/cloudflare-warp-ascii.repo | ' +
    'sudo tee /etc/yum.repos.d/cloudflare-warp.repo'
  );
  if (repoResult.code !== 0) {
    console.log('Failed to add Cloudflare repository.');
    console.log(repoResult.stderr);
    return;
  }

  // Step 2: Update package cache and install WARP
  console.log('Updating package cache...');
  const updateResult = await shell.exec(`sudo ${packageManager} update -y`);
  if (updateResult.code !== 0) {
    console.log('Warning: Package cache update had issues, continuing with installation...');
  }

  console.log('Installing cloudflare-warp package...');
  const installResult = await shell.exec(`sudo ${packageManager} install -y cloudflare-warp`);
  if (installResult.code !== 0) {
    console.log('Failed to install Cloudflare WARP.');
    console.log(installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Verify the repository was added:');
    console.log('     cat /etc/yum.repos.d/cloudflare-warp.repo');
    console.log('  2. Try importing the GPG key manually:');
    console.log('     sudo rpm --import https://pkg.cloudflareclient.com/pubkey.gpg');
    console.log(`  3. Retry: sudo ${packageManager} install cloudflare-warp`);
    return;
  }

  // Step 3: Enable and start the WARP service
  console.log('Enabling and starting warp-svc service...');
  const serviceResult = await shell.exec('sudo systemctl enable --now warp-svc');
  if (serviceResult.code !== 0) {
    console.log('Warning: Could not enable warp-svc service. You may need to start it manually.');
  }

  // Verify installation succeeded
  const version = await getWarpCliVersion();
  if (version) {
    console.log(`Cloudflare WARP ${version} installed successfully.`);
  } else {
    console.log('Cloudflare WARP installed successfully.');
  }

  console.log('');
  console.log('To complete setup:');
  console.log('  1. Register with Cloudflare:');
  console.log('     warp-cli registration new');
  console.log('');
  console.log('  2. Connect to WARP:');
  console.log('     warp-cli connect');
  console.log('');
  console.log('To verify WARP is working:');
  console.log('  warp-cli status');
  console.log('  curl -s https://www.cloudflare.com/cdn-cgi/trace/ | grep warp');
  console.log('  Expected output: warp=on');
}

/**
 * Install Cloudflare WARP on Windows using Chocolatey.
 *
 * This installs the Cloudflare WARP GUI application for Windows, which includes
 * the graphical interface (system tray icon), background service, and CLI tools.
 *
 * Prerequisites:
 * - Windows 10 version 1909 or later (64-bit)
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * After installation, Cloudflare WARP will be available in the Start Menu
 * and system tray. Launch it to complete the initial setup.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if Cloudflare WARP is already installed...');

  // Check if WARP package is installed via Chocolatey
  const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (packageInstalled) {
    console.log('Cloudflare WARP is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('If WARP is not running, launch it from the Start Menu:');
    console.log('  Search for "Cloudflare WARP" and click to launch.');
    return;
  }

  // Verify Chocolatey is available
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('');
    console.log('Run the following in an Administrator PowerShell:');
    console.log("  Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))");
    return;
  }

  console.log('Installing Cloudflare WARP via Chocolatey...');

  // Install WARP (package name is 'warp' on Chocolatey)
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install Cloudflare WARP via Chocolatey.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you are running as Administrator');
    console.log('  2. Try manual installation: choco install warp -y');
    console.log('  3. Or download from: https://one.one.one.one/');
    return;
  }

  console.log('Cloudflare WARP installed successfully.');
  console.log('');
  console.log('To complete setup:');
  console.log('  1. Launch Cloudflare WARP from the Start Menu');
  console.log('  2. Click the WARP icon in the system tray');
  console.log('  3. Toggle the switch to enable WARP');
  console.log('');
  console.log('To verify WARP is working:');
  console.log('  curl -s https://www.cloudflare.com/cdn-cgi/trace/ | findstr warp');
  console.log('  Expected output: warp=on');
}

/**
 * Install Cloudflare WARP on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * IMPORTANT: The recommended approach is to install WARP on the Windows host,
 * NOT inside WSL. When WARP runs on Windows, WSL 2 traffic is automatically
 * protected. Installing WARP inside WSL has known issues because Windows WARP
 * uses WinDivert which operates in Windows user-land, and WSL 2's networking
 * bypasses it.
 *
 * This function installs WARP directly within WSL for users who specifically
 * need it running inside the WSL environment.
 *
 * Prerequisites:
 * - Windows 10 version 2004 or later, or Windows 11
 * - WSL 2 installed with Ubuntu distribution
 * - WARP installed on the Windows host (recommended) OR
 * - Following this installation for WARP inside WSL (not recommended)
 *
 * NOTE: WSL does not use systemd by default, so the warp-svc daemon must be
 * started manually with 'sudo warp-svc &' before running 'warp-cli' commands.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('RECOMMENDATION: Install Cloudflare WARP on the Windows host instead.');
  console.log('The Windows WARP client provides network protection that is visible');
  console.log('to WSL 2 automatically. See: choco install warp -y (in Windows)');
  console.log('');

  // Check if WARP is already installed
  const existingVersion = await getWarpCliVersion();
  if (existingVersion) {
    console.log(`Cloudflare WARP ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Verify architecture - WARP only supports x86_64 on Linux
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  if (arch !== 'x86_64') {
    console.log(`Cloudflare WARP is not available for ${arch} architecture.`);
    console.log('WARP only supports 64-bit (x86_64/amd64) on Linux.');
    return;
  }

  // Install WARP using same process as Ubuntu
  console.log('Proceeding with Cloudflare WARP installation inside WSL...');
  console.log('');

  // Ensure prerequisites are installed
  console.log('Installing prerequisites (curl, gpg, lsb-release)...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl gpg lsb-release'
  );
  if (prereqResult.code !== 0) {
    console.log('Failed to install prerequisites.');
    console.log(prereqResult.stderr);
    return;
  }

  // Add the Cloudflare GPG key
  console.log('Adding Cloudflare GPG key...');
  const gpgResult = await shell.exec(
    'curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | ' +
    'sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg'
  );
  if (gpgResult.code !== 0) {
    console.log('Failed to add Cloudflare GPG key.');
    console.log(gpgResult.stderr);
    return;
  }

  // Add the Cloudflare repository
  console.log('Adding Cloudflare APT repository...');
  const repoResult = await shell.exec(
    'echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] ' +
    'https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | ' +
    'sudo tee /etc/apt/sources.list.d/cloudflare-client.list'
  );
  if (repoResult.code !== 0) {
    console.log('Failed to add Cloudflare repository.');
    console.log(repoResult.stderr);
    return;
  }

  // Update package lists and install WARP
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Failed to update package lists.');
    console.log(updateResult.stderr);
    return;
  }

  console.log('Installing cloudflare-warp package...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y cloudflare-warp');
  if (installResult.code !== 0) {
    console.log('Failed to install Cloudflare WARP.');
    console.log(installResult.stderr);
    return;
  }

  // Verify installation succeeded
  const version = await getWarpCliVersion();
  if (version) {
    console.log(`Cloudflare WARP ${version} installed successfully.`);
  } else {
    console.log('Cloudflare WARP installed successfully.');
  }

  console.log('');
  console.log('IMPORTANT for WSL users:');
  console.log('');
  console.log('1. WSL does not use systemd by default. Start the daemon manually:');
  console.log('   sudo warp-svc &');
  console.log('   sleep 3');
  console.log('');
  console.log('2. Register with Cloudflare:');
  console.log('   warp-cli registration new');
  console.log('');
  console.log('3. Connect to WARP:');
  console.log('   warp-cli connect');
  console.log('');
  console.log('4. To auto-start warp-svc when WSL launches, add to ~/.bashrc:');
  console.log('   if ! pgrep -x warp-svc > /dev/null; then');
  console.log('       sudo warp-svc > /dev/null 2>&1 &');
  console.log('       sleep 2');
  console.log('   fi');
  console.log('');
  const currentUser = process.env.USER || process.env.USERNAME || 'youruser';
  console.log('5. For passwordless sudo (optional):');
  console.log(`   echo "${currentUser} ALL=(ALL) NOPASSWD: /usr/bin/warp-svc" | sudo tee /etc/sudoers.d/warp-svc`);
  console.log('   sudo chmod 0440 /etc/sudoers.d/warp-svc');
}

/**
 * Install Cloudflare WARP from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Cloudflare WARP
 * on the Windows host using Chocolatey via PowerShell interop.
 * Once installed, WARP protects all network traffic from the machine,
 * including Git Bash, because it runs as a system-wide VPN.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey package manager installed on Windows
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Cloudflare WARP on the Windows host...');
  console.log('');

  // Check if Chocolatey is available via Windows path
  const chocoPath = '/c/ProgramData/chocolatey/bin/choco.exe';
  const chocoResult = await shell.exec(`"${chocoPath}" --version 2>/dev/null`);

  if (chocoResult.code !== 0) {
    console.log('Chocolatey is not installed on Windows.');
    console.log('Please install Chocolatey first, then run this installer again.');
    console.log('');
    console.log('Or download Cloudflare WARP directly from:');
    console.log('  https://one.one.one.one/');
    return;
  }

  // Check if WARP is already installed
  const listResult = await shell.exec(`"${chocoPath}" list --local-only --exact warp 2>/dev/null`);
  if (listResult.code === 0 && listResult.stdout.toLowerCase().includes('warp')) {
    console.log('Cloudflare WARP is already installed, skipping installation.');
    console.log('');
    console.log('If WARP is not running, launch it from the Windows Start Menu.');
    return;
  }

  console.log('Installing Cloudflare WARP via Windows Chocolatey...');

  const installResult = await shell.exec(`"${chocoPath}" install warp -y`);

  if (installResult.code !== 0) {
    console.log('Failed to install Cloudflare WARP.');
    console.log(installResult.stdout || installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run Git Bash as Administrator and retry');
    console.log('  2. Try installing directly from PowerShell:');
    console.log('     choco install warp -y');
    console.log('  3. Or download from: https://one.one.one.one/');
    return;
  }

  console.log('Cloudflare WARP installed successfully.');
  console.log('');
  console.log('To complete setup:');
  console.log('  1. Launch Cloudflare WARP from the Windows Start Menu');
  console.log('  2. Click the WARP icon in the system tray');
  console.log('  3. Toggle the switch to enable WARP');
  console.log('');
  console.log('Git Bash notes:');
  console.log('  - WARP is a system-wide VPN; all traffic (including Git Bash) is protected');
  console.log('  - Look for the WARP icon in the Windows system tray to verify it is running');
  console.log('');
  console.log('To verify WARP is working:');
  console.log('  curl -s https://www.cloudflare.com/cdn-cgi/trace/ | grep warp');
  console.log('  Expected output: warp=on');
}

/**
 * Check if Cloudflare WARP is installed on the current system.
 *
 * This function checks for WARP installation across all supported platforms:
 * - macOS: Checks for WARP.app via Homebrew cask or application bundle
 * - Windows: Checks for WARP via Chocolatey package
 * - Linux: Checks if warp-cli command exists in PATH
 *
 * @returns {Promise<boolean>} True if WARP is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    // Check if WARP app is installed or cask is installed
    if (isWarpAppInstalledMacOS()) {
      return true;
    }
    return brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  }

  if (platform.type === 'windows' || platform.type === 'gitbash') {
    // Check if WARP package is installed via Chocolatey
    return choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  }

  // Linux and WSL: Check if warp-cli command exists
  return isWarpCliCommandAvailable();
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Cloudflare WARP is NOT available on:
 * - Raspberry Pi OS (ARM architecture not supported)
 *
 * Note: WSL support is limited; recommended to install on Windows host instead.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  // Exclude raspbian since WARP is not available for ARM Linux
  return ['macos', 'ubuntu', 'debian', 'wsl', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * Detects the current platform and executes the corresponding installer function.
 * Handles platform-specific mappings to ensure all supported platforms have
 * appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: WARP GUI via Homebrew cask
 * - Ubuntu/Debian: WARP daemon via official APT repository
 * - Amazon Linux/RHEL: WARP via DNF/YUM
 * - Windows: WARP GUI via Chocolatey
 * - WSL (Ubuntu): WARP within WSL (not recommended)
 * - Git Bash: WARP on Windows host via PowerShell
 *
 * Unsupported platforms:
 * - Raspberry Pi OS: ARM architecture not supported
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
    // Gracefully handle unsupported platforms without throwing an error
    console.log(`Cloudflare WARP is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

// Export all functions for use as a module and for testing
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
  // Export helper functions for potential reuse or testing
  isWarpCliCommandAvailable,
  isWarpAppInstalledMacOS,
  getWarpCliVersion,
  getWarpVersionMacOS
};

// Allow direct execution: node cloudflare-warp.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
