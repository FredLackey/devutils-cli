#!/usr/bin/env node

/**
 * @fileoverview Install NordVPN VPN client across supported platforms.
 * @module installs/nordvpn
 *
 * NordVPN is a commercial Virtual Private Network (VPN) service that encrypts
 * your internet traffic and masks your IP address. It provides secure, private
 * access to the internet with features including AES-256 encryption, a global
 * network of 6,000+ servers, kill switch, threat protection, and Meshnet.
 *
 * This installer provides:
 * - NordVPN GUI application via Homebrew cask for macOS
 * - NordVPN CLI via official installation script for Linux (Ubuntu, Raspberry Pi OS)
 * - NordVPN CLI via official installation script for Amazon Linux/RHEL
 * - NordVPN GUI application via Chocolatey for Windows
 * - Windows NordVPN installation from Git Bash via PowerShell
 *
 * IMPORTANT NOTES:
 * - A NordVPN subscription is required (sign up at https://nordvpn.com)
 * - After installation, authenticate with: nordvpn login --token YOUR_TOKEN_HERE
 * - Linux users must log out and back in after installation for group changes
 * - WSL: Recommended to install NordVPN on Windows host instead of within WSL
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const choco = require('../utils/windows/choco');
const fs = require('fs');

/**
 * The Homebrew cask name for NordVPN on macOS.
 * @constant {string}
 */
const HOMEBREW_CASK_NAME = 'nordvpn';

/**
 * The Chocolatey package name for NordVPN on Windows.
 * @constant {string}
 */
const CHOCO_PACKAGE_NAME = 'nordvpn';

/**
 * The command used to verify NordVPN installation on Linux.
 * @constant {string}
 */
const NORDVPN_COMMAND = 'nordvpn';

/**
 * URL for the official NordVPN Linux installation script.
 * @constant {string}
 */
const NORDVPN_INSTALL_SCRIPT_URL = 'https://downloads.nordcdn.com/apps/linux/install.sh';

/**
 * Path to NordVPN application on macOS.
 * @constant {string}
 */
const MACOS_APP_PATH = '/Applications/NordVPN.app';

/**
 * Check if the NordVPN CLI command is available in the system PATH.
 * This performs a quick check that works on Linux platforms.
 *
 * Note: On macOS and Windows, NordVPN may be installed as a GUI application
 * without a CLI command in PATH.
 *
 * @returns {boolean} True if the nordvpn command is available, false otherwise
 */
function isNordVPNCommandAvailable() {
  return shell.commandExists(NORDVPN_COMMAND);
}

/**
 * Get the installed version of NordVPN CLI.
 *
 * Executes 'nordvpn --version' to verify NordVPN is properly installed
 * and retrieve the version number. This works primarily on Linux platforms.
 *
 * @returns {Promise<string|null>} NordVPN version string (e.g., "3.19.2"), or null if not installed
 */
async function getNordVPNVersion() {
  if (!isNordVPNCommandAvailable()) {
    return null;
  }

  const result = await shell.exec('nordvpn --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "NordVPN Version 3.19.2"
    const versionMatch = result.stdout.match(/Version\s+(\d+\.\d+\.?\d*)/i);
    return versionMatch ? versionMatch[1] : result.stdout.trim();
  }
  return null;
}

/**
 * Check if NordVPN application is installed on macOS.
 *
 * Checks for the presence of NordVPN.app in the Applications folder.
 *
 * @returns {boolean} True if NordVPN.app exists, false otherwise
 */
function isMacOSAppInstalled() {
  try {
    return fs.existsSync(MACOS_APP_PATH);
  } catch {
    return false;
  }
}

/**
 * Add the current user to the nordvpn group on Linux systems.
 *
 * This grants permission to use the NordVPN CLI without sudo.
 * A logout and login is required for the group change to take effect.
 *
 * @returns {Promise<boolean>} True if the user was added successfully
 */
async function addUserToNordVPNGroup() {
  const currentUser = process.env.USER || process.env.USERNAME;
  if (!currentUser) {
    console.log('Warning: Could not determine current user.');
    return false;
  }

  console.log(`Adding user '${currentUser}' to the nordvpn group...`);
  const result = await shell.exec(`sudo usermod -aG nordvpn ${currentUser}`);

  if (result.code !== 0) {
    console.log('Warning: Could not add user to nordvpn group.');
    console.log('You may need to run: sudo usermod -aG nordvpn $USER');
    return false;
  }

  return true;
}

/**
 * Install NordVPN GUI application on macOS using Homebrew cask.
 *
 * This installs the NordVPN desktop application, which provides both
 * a graphical interface and integration with macOS system features.
 *
 * Prerequisites:
 * - macOS 12.0 (Monterey) or later
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * After installation, launch NordVPN from your Applications folder
 * or Spotlight to complete setup and log in to your NordVPN account.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if NordVPN is already installed...');

  // Check if NordVPN cask is already installed via Homebrew
  const isCaskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (isCaskInstalled) {
    console.log('NordVPN is already installed via Homebrew, skipping installation.');
    return;
  }

  // Also check if NordVPN.app exists (might be installed by other means)
  if (isMacOSAppInstalled()) {
    console.log('NordVPN is already installed, skipping installation.');
    console.log('');
    console.log('Note: NordVPN was not installed via Homebrew.');
    console.log('If you want to manage it with Homebrew, first uninstall the existing version.');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    return;
  }

  console.log('Installing NordVPN via Homebrew...');

  // Install NordVPN cask
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    console.log('Failed to install NordVPN via Homebrew.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "brew update && brew cleanup" and retry');
    console.log('  2. Try manual installation: brew install --cask nordvpn');
    console.log('  3. Or download directly from: https://nordvpn.com/download/');
    return;
  }

  // Verify installation succeeded
  const verified = isMacOSAppInstalled();
  if (!verified) {
    console.log('Installation may have failed: NordVPN.app not found after install.');
    return;
  }

  console.log('NordVPN installed successfully.');
  console.log('');
  console.log('To complete setup:');
  console.log('  1. Launch NordVPN from Applications or Spotlight');
  console.log('  2. Log in with your NordVPN account credentials');
  console.log('  3. Grant any requested permissions (network extension, etc.)');
  console.log('');
  console.log('NOTE: A NordVPN subscription is required. Sign up at:');
  console.log('      https://nordvpn.com');
}

/**
 * Install NordVPN CLI on Ubuntu/Debian using the official installation script.
 *
 * The official installation script automatically:
 * - Detects your Ubuntu/Debian version
 * - Adds NordVPN's GPG signing key
 * - Configures the APT repository
 * - Installs the nordvpn package
 * - Enables and starts the nordvpnd service
 *
 * Prerequisites:
 * - Ubuntu 20.04 (Focal) or later, or Debian 11 (Bullseye) or later (64-bit)
 * - sudo privileges
 * - curl or wget installed
 *
 * After installation, log out and back in for group membership to take effect,
 * then authenticate with: nordvpn login --token YOUR_TOKEN_HERE
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if NordVPN is already installed...');

  // Check if NordVPN is already installed
  const existingVersion = await getNordVPNVersion();
  if (existingVersion) {
    console.log(`NordVPN ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Ensure curl is installed (required by the installation script)
  if (!shell.commandExists('curl')) {
    console.log('Installing curl (required for NordVPN installation)...');
    const curlResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl'
    );
    if (curlResult.code !== 0) {
      console.log('Failed to install curl. Please install curl manually and retry.');
      console.log(curlResult.stderr);
      return;
    }
  }

  console.log('Installing NordVPN using the official installation script...');
  console.log('This will add the NordVPN APT repository and install the package.');

  // Run the official NordVPN installation script with -n flag for non-interactive mode
  // The script handles repository setup, package installation, and service configuration
  // Note: Using bash instead of sh because process substitution <() requires bash
  const installResult = await shell.exec(
    `bash -c 'curl -sSf ${NORDVPN_INSTALL_SCRIPT_URL} | bash -s -- -n'`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install NordVPN.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have internet connectivity');
    console.log('  2. Verify curl is installed: which curl');
    console.log('  3. Try running the install script manually:');
    console.log(`     curl -sSf ${NORDVPN_INSTALL_SCRIPT_URL} | bash -s -- -n`);
    return;
  }

  // Add user to nordvpn group for rootless operation
  await addUserToNordVPNGroup();

  // Verify installation succeeded
  const version = await getNordVPNVersion();
  if (version) {
    console.log(`NordVPN ${version} installed successfully.`);
  } else {
    console.log('NordVPN installed successfully.');
  }

  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('');
  console.log('  1. LOG OUT and LOG BACK IN for group membership to take effect');
  console.log('     (or reboot your system)');
  console.log('');
  console.log('  2. Generate an access token:');
  console.log('     - Log into https://my.nordaccount.com');
  console.log('     - Go to NordVPN > Advanced Settings > Access token');
  console.log('     - Generate a new token');
  console.log('');
  console.log('  3. Log in to NordVPN:');
  console.log('     nordvpn login --token YOUR_TOKEN_HERE');
  console.log('');
  console.log('  4. Connect to VPN:');
  console.log('     nordvpn connect');
}

/**
 * Install NordVPN CLI on Raspberry Pi OS using the official installation script.
 *
 * The installation script automatically detects Raspberry Pi OS and configures
 * the appropriate repository for your architecture (64-bit or 32-bit).
 *
 * Prerequisites:
 * - Raspberry Pi OS (32-bit or 64-bit) - Bullseye, Bookworm, or newer
 * - Raspberry Pi 3, 4, 5, or Zero 2 W (ARM processor)
 * - sudo privileges
 * - curl or wget installed
 *
 * NOTE: NordVPN officially supports Raspberry Pi OS but with limited ARM64
 * support. The CLI version works well on Raspberry Pi devices.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if NordVPN is already installed...');

  // Check if NordVPN is already installed
  const existingVersion = await getNordVPNVersion();
  if (existingVersion) {
    console.log(`NordVPN ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Log architecture information for user awareness
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  console.log(`Detected architecture: ${arch}`);

  // Ensure curl is installed
  if (!shell.commandExists('curl')) {
    console.log('Installing curl (required for NordVPN installation)...');
    const curlResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl'
    );
    if (curlResult.code !== 0) {
      console.log('Failed to install curl. Please install curl manually and retry.');
      console.log(curlResult.stderr);
      return;
    }
  }

  console.log('Installing NordVPN using the official installation script...');

  // Run the official NordVPN installation script
  const installResult = await shell.exec(
    `bash -c 'curl -sSf ${NORDVPN_INSTALL_SCRIPT_URL} | bash -s -- -n'`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install NordVPN.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have internet connectivity');
    console.log('  2. If on 32-bit Raspberry Pi OS, ARM support may be limited');
    console.log('  3. Try running the install script manually:');
    console.log(`     curl -sSf ${NORDVPN_INSTALL_SCRIPT_URL} | bash -s -- -n`);
    console.log('');
    console.log('Alternative: Use OpenVPN with NordVPN configuration files:');
    console.log('  https://support.nordvpn.com/hc/en-us/articles/20455204080913');
    return;
  }

  // Add user to nordvpn group
  await addUserToNordVPNGroup();

  // Verify installation succeeded
  const version = await getNordVPNVersion();
  if (version) {
    console.log(`NordVPN ${version} installed successfully.`);
  } else {
    console.log('NordVPN installed successfully.');
  }

  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('');
  console.log('  1. LOG OUT and LOG BACK IN for group membership to take effect');
  console.log('');
  console.log('  2. Generate an access token at https://my.nordaccount.com');
  console.log('     (NordVPN > Advanced Settings > Access token)');
  console.log('');
  console.log('  3. Log in: nordvpn login --token YOUR_TOKEN_HERE');
  console.log('');
  console.log('  4. Connect: nordvpn connect');
  console.log('');
  console.log('TIP: For better performance on Raspberry Pi, enable NordLynx:');
  console.log('     nordvpn set technology nordlynx');
}

/**
 * Install NordVPN CLI on Amazon Linux/RHEL using the official installation script.
 *
 * The official installation script automatically detects your distribution
 * and configures the appropriate repository.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, Fedora 32+, RHEL 8/9, or CentOS 8/9
 * - sudo privileges
 * - curl or wget installed
 *
 * NOTE: Amazon Linux 2023 and Fedora use DNF. Amazon Linux 2, RHEL 7, and
 * CentOS 7 use YUM.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if NordVPN is already installed...');

  // Check if NordVPN is already installed
  const existingVersion = await getNordVPNVersion();
  if (existingVersion) {
    console.log(`NordVPN ${existingVersion} is already installed, skipping installation.`);
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
    console.log('Installing curl (required for NordVPN installation)...');
    const curlResult = await shell.exec(`sudo ${packageManager} install -y curl`);
    if (curlResult.code !== 0) {
      console.log('Failed to install curl. Please install curl manually and retry.');
      console.log(curlResult.stderr);
      return;
    }
  }

  console.log('Installing NordVPN using the official installation script...');

  // Run the official NordVPN installation script
  const installResult = await shell.exec(
    `bash -c 'curl -sSf ${NORDVPN_INSTALL_SCRIPT_URL} | bash -s -- -n'`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install NordVPN using the installation script.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have internet connectivity');
    console.log('  2. Try running the install script manually:');
    console.log(`     curl -sSf ${NORDVPN_INSTALL_SCRIPT_URL} | bash -s -- -n`);
    console.log('');
    console.log('Alternative: Manual repository setup:');
    if (hasDnf) {
      console.log('  sudo dnf config-manager --add-repo https://repo.nordvpn.com/yum/nordvpn/centos/x86_64/');
      console.log('  sudo rpm --import https://repo.nordvpn.com/gpg/nordvpn_public.asc');
      console.log('  sudo dnf install -y nordvpn');
    } else {
      console.log('  sudo yum-config-manager --add-repo https://repo.nordvpn.com/yum/nordvpn/centos/x86_64/');
      console.log('  sudo rpm --import https://repo.nordvpn.com/gpg/nordvpn_public.asc');
      console.log('  sudo yum install -y nordvpn');
    }
    return;
  }

  // Add user to nordvpn group
  await addUserToNordVPNGroup();

  // Verify installation succeeded
  const version = await getNordVPNVersion();
  if (version) {
    console.log(`NordVPN ${version} installed successfully.`);
  } else {
    console.log('NordVPN installed successfully.');
  }

  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('');
  console.log('  1. LOG OUT and LOG BACK IN for group membership to take effect');
  console.log('');
  console.log('  2. Generate an access token at https://my.nordaccount.com');
  console.log('     (NordVPN > Advanced Settings > Access token)');
  console.log('');
  console.log('  3. Log in: nordvpn login --token YOUR_TOKEN_HERE');
  console.log('');
  console.log('  4. Connect: nordvpn connect');
}

/**
 * Install NordVPN GUI application on Windows using Chocolatey.
 *
 * This installs the NordVPN desktop application, which provides a graphical
 * interface and command-line tools.
 *
 * Prerequisites:
 * - Windows 10 or later, or Windows Server 2016 or later (64-bit)
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * IMPORTANT: A system reboot may be required after installation.
 * After installation, launch NordVPN from the Start Menu and log in
 * with your NordVPN account.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if NordVPN is already installed...');

  // Check if NordVPN package is installed via Chocolatey
  const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (packageInstalled) {
    console.log('NordVPN is already installed via Chocolatey, skipping installation.');
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

  console.log('Installing NordVPN via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install NordVPN
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install NordVPN via Chocolatey.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you are running as Administrator');
    console.log('  2. Try manual installation: choco install nordvpn -y');
    console.log('  3. Or download from: https://nordvpn.com/download/');
    return;
  }

  console.log('NordVPN installed successfully.');
  console.log('');
  console.log('To complete setup:');
  console.log('  1. Launch NordVPN from the Start Menu');
  console.log('  2. Log in with your NordVPN account credentials');
  console.log('');
  console.log('Command-line usage (after logging in via GUI):');
  console.log('  cd "C:\\Program Files\\NordVPN"');
  console.log('  nordvpn -c                    # Connect to fastest server');
  console.log('  nordvpn -c -g "United States" # Connect to specific country');
  console.log('  nordvpn -d                    # Disconnect');
  console.log('');
  console.log('NOTE: A NordVPN subscription is required. Sign up at:');
  console.log('      https://nordvpn.com');
}

/**
 * Install NordVPN on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * IMPORTANT: For most users, it is recommended to install NordVPN on the
 * Windows host only. WSL 2 shares the Windows network stack, so VPN
 * protection from Windows applies to WSL traffic automatically. Running
 * NordVPN in both Windows and WSL simultaneously causes conflicts.
 *
 * This function installs NordVPN directly within WSL for users who
 * specifically need it running inside the WSL environment.
 *
 * Prerequisites:
 * - Windows 10 version 2004 or later, or Windows 11
 * - WSL 2 installed and configured (WSL 1 is not supported)
 * - Ubuntu distribution installed in WSL
 *
 * NOTE: WSL does not use systemd by default, so the NordVPN daemon must
 * be started manually with 'sudo nordvpnd &' before running 'nordvpn up'.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('RECOMMENDATION: For most users, install NordVPN on the Windows host');
  console.log('instead of within WSL. The Windows VPN protection automatically');
  console.log('applies to WSL 2 traffic.');
  console.log('');

  // Check if NordVPN is already installed
  const existingVersion = await getNordVPNVersion();
  if (existingVersion) {
    console.log(`NordVPN ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Ensure curl is installed
  if (!shell.commandExists('curl')) {
    console.log('Installing curl (required for NordVPN installation)...');
    const curlResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl'
    );
    if (curlResult.code !== 0) {
      console.log('Failed to install curl. Please install curl manually and retry.');
      console.log(curlResult.stderr);
      return;
    }
  }

  console.log('Installing NordVPN in WSL using the official installation script...');

  // Run the official NordVPN installation script
  const installResult = await shell.exec(
    `bash -c 'curl -sSf ${NORDVPN_INSTALL_SCRIPT_URL} | bash -s -- -n'`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install NordVPN.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Add user to nordvpn group
  await addUserToNordVPNGroup();

  // Verify installation succeeded
  const version = await getNordVPNVersion();
  if (version) {
    console.log(`NordVPN ${version} installed successfully.`);
  } else {
    console.log('NordVPN installed successfully.');
  }

  const currentUser = process.env.USER || process.env.USERNAME || 'youruser';

  console.log('');
  console.log('IMPORTANT for WSL users:');
  console.log('');
  console.log('1. WSL does not use systemd by default. Start the daemon manually:');
  console.log('   sudo nordvpnd &');
  console.log('   sleep 3');
  console.log('');
  console.log('2. Log in and connect:');
  console.log('   nordvpn login --token YOUR_TOKEN_HERE');
  console.log('   nordvpn connect');
  console.log('');
  console.log('3. To auto-start NordVPN when WSL launches, add to ~/.bashrc:');
  console.log('   if ! pgrep -x nordvpnd > /dev/null; then');
  console.log('       sudo nordvpnd > /dev/null 2>&1 &');
  console.log('       sleep 2');
  console.log('   fi');
  console.log('');
  console.log('4. For passwordless sudo (optional):');
  console.log(`   echo "${currentUser} ALL=(ALL) NOPASSWD: /usr/sbin/nordvpnd" | sudo tee /etc/sudoers.d/nordvpnd`);
  console.log('   sudo chmod 0440 /etc/sudoers.d/nordvpnd');
}

/**
 * Install NordVPN from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs NordVPN
 * on the Windows host using Chocolatey via PowerShell interop.
 * Once installed, NordVPN can be accessed from the Windows Start Menu.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey package manager installed on Windows
 *
 * NOTE: Git Bash can access NordVPN's CLI by navigating to its directory:
 * cd "/c/Program Files/NordVPN" && ./nordvpn -c
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing NordVPN on the Windows host...');
  console.log('');

  // Check if Chocolatey is available via Windows path
  const chocoPath = '/c/ProgramData/chocolatey/bin/choco.exe';
  const chocoResult = await shell.exec(`"${chocoPath}" --version 2>/dev/null`);

  if (chocoResult.code !== 0) {
    console.log('Chocolatey is not installed on Windows.');
    console.log('Please install Chocolatey first, then run this installer again.');
    console.log('');
    console.log('Or install NordVPN manually from:');
    console.log('  https://nordvpn.com/download/');
    return;
  }

  // Check if NordVPN is already installed via Chocolatey
  const listResult = await shell.exec(`"${chocoPath}" list --local-only --exact nordvpn`);
  if (listResult.code === 0 && listResult.stdout.toLowerCase().includes('nordvpn')) {
    console.log('NordVPN is already installed via Chocolatey, skipping installation.');
    return;
  }

  console.log('Installing NordVPN via Windows Chocolatey...');

  const installResult = await shell.exec(`"${chocoPath}" install nordvpn -y`);

  if (installResult.code !== 0) {
    console.log('Failed to install NordVPN.');
    console.log(installResult.stdout || installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run Git Bash as Administrator and retry');
    console.log('  2. Try installing directly from PowerShell:');
    console.log('     choco install nordvpn -y');
    console.log('  3. Or download from: https://nordvpn.com/download/');
    return;
  }

  console.log('NordVPN installed successfully.');
  console.log('');
  console.log('To complete setup:');
  console.log('  1. Launch NordVPN from the Windows Start Menu');
  console.log('  2. Log in with your NordVPN account credentials');
  console.log('');
  console.log('Git Bash usage:');
  console.log('  # Navigate to NordVPN installation directory');
  console.log('  cd "/c/Program Files/NordVPN"');
  console.log('');
  console.log('  # Connect to VPN');
  console.log('  ./nordvpn -c');
  console.log('');
  console.log('  # Connect to specific country');
  console.log('  ./nordvpn -c -g "United States"');
  console.log('');
  console.log('  # Disconnect');
  console.log('  ./nordvpn -d');
}

/**
 * Check if NordVPN is installed on the current system.
 *
 * This function checks for NordVPN installation across all supported platforms:
 * - macOS: Checks for NordVPN.app or Homebrew cask
 * - Windows: Checks for Chocolatey package
 * - Linux: Checks if nordvpn command exists in PATH
 *
 * @returns {Promise<boolean>} True if NordVPN is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    // Check if NordVPN cask is installed via Homebrew
    const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
    if (caskInstalled) {
      return true;
    }
    // Also check if NordVPN.app exists
    return isMacOSAppInstalled();
  }

  if (platform.type === 'windows' || platform.type === 'gitbash') {
    // Check if NordVPN package is installed via Chocolatey
    return choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  }

  // Linux and WSL: Check if nordvpn command exists
  return isNordVPNCommandAvailable();
}

/**
 * Check if this installer is supported on the current platform.
 *
 * NordVPN is a desktop application that requires a GUI environment:
 * - macOS: Always has desktop (GUI via Homebrew cask)
 * - Windows/Git Bash: Always has desktop (GUI via Chocolatey)
 * - Linux (Ubuntu/Debian/etc.): Requires desktop environment (checks for X11/Wayland)
 *
 * For headless Linux servers, NordVPN CLI can be installed but this installer
 * is configured for desktop environments only per installers.json.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();

  // macOS and Windows always have desktop environments
  if (['macos', 'windows', 'gitbash'].includes(platform.type)) {
    return true;
  }

  // For Linux platforms, check if desktop environment is available
  if (['ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora'].includes(platform.type)) {
    try {
      const desktop = require('../utils/ubuntu/desktop');
      return desktop.hasDesktop();
    } catch (error) {
      // If desktop detection fails, assume no desktop
      return false;
    }
  }

  // Unsupported platform
  return false;
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * Detects the current platform and executes the corresponding installer function.
 * Handles platform-specific mappings to ensure all supported platforms have
 * appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: NordVPN GUI via Homebrew cask
 * - Ubuntu/Debian: NordVPN CLI via official install script
 * - Raspberry Pi OS: NordVPN CLI via official install script
 * - Amazon Linux/RHEL: NordVPN CLI via official install script
 * - Windows: NordVPN GUI via Chocolatey
 * - WSL (Ubuntu): NordVPN CLI within WSL
 * - Git Bash: NordVPN GUI on Windows host via Chocolatey
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
    console.log(`NordVPN is not available for ${platform.type}.`);
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
  isNordVPNCommandAvailable,
  getNordVPNVersion
};

// Allow direct execution: node nordvpn.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
