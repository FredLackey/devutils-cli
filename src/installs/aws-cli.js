#!/usr/bin/env node

/**
 * @fileoverview Install AWS CLI v2 across supported platforms.
 * @module installs/aws-cli
 *
 * AWS CLI v2 is the unified tool for interacting with all AWS services.
 * It bundles its own Python runtime, so no separate Python installation is required.
 *
 * Supported platforms:
 * - macOS: Homebrew (brew install awscli)
 * - Ubuntu/Debian: Snap (snap install aws-cli --classic)
 * - Raspberry Pi OS: Snap (requires 64-bit OS)
 * - Amazon Linux 2023: DNF (pre-installed, upgrade with dnf)
 * - Amazon Linux 2: Manual installer (must remove v1 first)
 * - Windows: Chocolatey (choco install awscli)
 * - WSL (Ubuntu): Snap or manual installer
 * - Git Bash: Uses Windows installation (inherited PATH)
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const snap = require('../utils/ubuntu/snap');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * The name of the AWS CLI command used to verify installation
 * @constant {string}
 */
const AWS_CLI_COMMAND = 'aws';

/**
 * The snap package name for AWS CLI
 * @constant {string}
 */
const SNAP_PACKAGE_NAME = 'aws-cli';

/**
 * The Homebrew formula name for AWS CLI
 * @constant {string}
 */
const BREW_FORMULA_NAME = 'awscli';

/**
 * The Chocolatey package name for AWS CLI
 * @constant {string}
 */
const CHOCO_PACKAGE_NAME = 'awscli';

/**
 * Check if AWS CLI is already installed by verifying the aws command exists
 * @returns {boolean} True if AWS CLI is installed and accessible
 */
function isAwsCliInstalled() {
  return shell.commandExists(AWS_CLI_COMMAND);
}

/**
 * Get the installed version of AWS CLI
 * @returns {Promise<string|null>} The version string or null if not installed
 */
async function getAwsCliVersion() {
  if (!isAwsCliInstalled()) {
    return null;
  }

  const result = await shell.exec('aws --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "aws-cli/2.32.28 Python/3.11.6 Darwin/23.3.0 source/arm64"
    const match = result.stdout.match(/aws-cli\/(\S+)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Check if the installed AWS CLI is version 2 (not legacy v1)
 * @returns {Promise<boolean>} True if AWS CLI v2 is installed
 */
async function isVersion2() {
  const version = await getAwsCliVersion();
  if (!version) {
    return false;
  }
  // Version 2.x.x starts with "2."
  return version.startsWith('2.');
}

/**
 * Install AWS CLI on macOS using Homebrew
 *
 * Prerequisites:
 * - macOS 11 (Big Sur) or later
 * - Homebrew package manager installed
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if AWS CLI is already installed
  if (isAwsCliInstalled()) {
    const version = await getAwsCliVersion();
    console.log(`AWS CLI is already installed (version ${version}), skipping...`);
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    return;
  }

  console.log('Installing AWS CLI via Homebrew...');
  const result = await brew.install(BREW_FORMULA_NAME);

  if (!result.success) {
    console.log('Failed to install AWS CLI via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded
  if (isAwsCliInstalled()) {
    const version = await getAwsCliVersion();
    console.log(`AWS CLI installed successfully (version ${version}).`);
  } else {
    console.log('Installation completed but AWS CLI command not found.');
    console.log('You may need to restart your terminal or add Homebrew to your PATH.');
  }
}

/**
 * Install AWS CLI on Ubuntu/Debian using Snap
 *
 * The official AWS CLI Snap package is recommended over APT because
 * the APT repositories contain outdated AWS CLI v1 packages.
 *
 * Prerequisites:
 * - Ubuntu 18.04+ or Debian 10+ (64-bit)
 * - snapd service installed and running
 * - sudo privileges
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if AWS CLI is already installed
  if (isAwsCliInstalled()) {
    const version = await getAwsCliVersion();
    console.log(`AWS CLI is already installed (version ${version}), skipping...`);
    return;
  }

  // Check if snap is available, install it if not
  if (!snap.isInstalled()) {
    console.log('Snap is not installed. Installing snapd...');
    const aptResult = await apt.install('snapd');
    if (!aptResult.success) {
      console.log('Failed to install snapd.');
      console.log(aptResult.output);
      return;
    }
    console.log('snapd installed. You may need to log out and back in for snap to work.');
  }

  console.log('Installing AWS CLI via Snap...');
  // AWS CLI requires --classic flag for access to system files
  const result = await snap.install(SNAP_PACKAGE_NAME, { classic: true });

  if (!result.success) {
    console.log('Failed to install AWS CLI via Snap.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded
  // Note: Snap may not be in PATH immediately, so check both ways
  const isInstalled = isAwsCliInstalled() || await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (isInstalled) {
    const version = await getAwsCliVersion();
    if (version) {
      console.log(`AWS CLI installed successfully (version ${version}).`);
    } else {
      console.log('AWS CLI installed successfully.');
      console.log('You may need to log out and back in, or add /snap/bin to your PATH.');
    }
  } else {
    console.log('Installation completed but AWS CLI not found.');
    console.log('Try logging out and back in, or run: export PATH=$PATH:/snap/bin');
  }
}

/**
 * Install AWS CLI on Raspberry Pi OS using Snap
 *
 * Important: AWS CLI v2 requires a 64-bit (aarch64) operating system.
 * The 32-bit version of Raspberry Pi OS is not supported.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit) - ARM64/aarch64 architecture
 * - Raspberry Pi 3B+ or later (64-bit capable hardware)
 * - snapd service installed
 * - sudo privileges
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if AWS CLI is already installed
  if (isAwsCliInstalled()) {
    const version = await getAwsCliVersion();
    console.log(`AWS CLI is already installed (version ${version}), skipping...`);
    return;
  }

  // Verify 64-bit architecture - AWS CLI v2 does not support 32-bit ARM
  const arch = os.getArch();
  if (arch !== 'arm64') {
    console.log('AWS CLI v2 requires a 64-bit operating system.');
    console.log(`Your system architecture is: ${arch}`);
    console.log('Please install the 64-bit version of Raspberry Pi OS.');
    return;
  }

  // Check if snap is available, install it if not
  if (!snap.isInstalled()) {
    console.log('Snap is not installed. Installing snapd...');
    const aptResult = await apt.install('snapd');
    if (!aptResult.success) {
      console.log('Failed to install snapd.');
      console.log(aptResult.output);
      return;
    }
    console.log('snapd installed. A reboot may be required before continuing.');
    console.log('Run: sudo reboot');
    console.log('Then run this installer again.');
    return;
  }

  console.log('Installing AWS CLI via Snap...');
  const result = await snap.install(SNAP_PACKAGE_NAME, { classic: true });

  if (!result.success) {
    console.log('Failed to install AWS CLI via Snap.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded
  const isInstalled = isAwsCliInstalled() || await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
  if (isInstalled) {
    const version = await getAwsCliVersion();
    if (version) {
      console.log(`AWS CLI installed successfully (version ${version}).`);
    } else {
      console.log('AWS CLI installed successfully.');
      console.log('You may need to log out and back in, or add /snap/bin to your PATH.');
    }
  } else {
    console.log('Installation completed but AWS CLI not found.');
    console.log('Try logging out and back in, or run: export PATH=$PATH:/snap/bin');
  }
}

/**
 * Install AWS CLI on Amazon Linux using DNF/YUM or manual installer
 *
 * Amazon Linux 2023: AWS CLI v2 is pre-installed, this upgrades to latest.
 * Amazon Linux 2: Ships with v1, this removes v1 and installs v2 manually.
 *
 * Prerequisites:
 * - Amazon Linux 2023 or Amazon Linux 2
 * - sudo privileges
 * - For AL2: unzip and curl packages
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if AWS CLI is already installed and which version
  if (isAwsCliInstalled()) {
    const isV2 = await isVersion2();
    if (isV2) {
      const version = await getAwsCliVersion();
      console.log(`AWS CLI v2 is already installed (version ${version}), skipping...`);
      return;
    }
    // AWS CLI v1 is installed, need to remove it first
    console.log('AWS CLI v1 detected. Removing v1 before installing v2...');
    const removeResult = await shell.exec('sudo yum remove -y awscli');
    if (removeResult.code !== 0) {
      console.log('Failed to remove AWS CLI v1.');
      console.log(removeResult.stderr);
      return;
    }
    // Clear bash hash table to forget old aws location
    await shell.exec('hash -r 2>/dev/null || true');
  }

  // Detect if we're on Amazon Linux 2023 (has dnf) or Amazon Linux 2 (has yum)
  const hasDnf = shell.commandExists('dnf');

  if (hasDnf) {
    // Amazon Linux 2023 - AWS CLI v2 should be available via DNF
    console.log('Installing/upgrading AWS CLI via DNF...');
    const result = await shell.exec('sudo dnf install -y awscli');

    if (result.code !== 0) {
      console.log('Failed to install AWS CLI via DNF.');
      console.log(result.stderr);
      return;
    }
  } else {
    // Amazon Linux 2 - Use the official manual installer
    console.log('Installing AWS CLI v2 using the official installer...');

    // Ensure required tools are available
    if (!shell.commandExists('unzip')) {
      console.log('Installing unzip...');
      await shell.exec('sudo yum install -y unzip');
    }

    if (!shell.commandExists('curl')) {
      console.log('Installing curl...');
      await shell.exec('sudo yum install -y curl');
    }

    // Download the installer
    console.log('Downloading AWS CLI v2 installer...');
    const downloadResult = await shell.exec(
      'curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"'
    );

    if (downloadResult.code !== 0) {
      console.log('Failed to download AWS CLI installer.');
      console.log(downloadResult.stderr);
      return;
    }

    // Extract the installer
    console.log('Extracting installer...');
    const extractResult = await shell.exec('unzip -o -q /tmp/awscliv2.zip -d /tmp');

    if (extractResult.code !== 0) {
      console.log('Failed to extract AWS CLI installer.');
      console.log(extractResult.stderr);
      // Clean up
      await shell.exec('rm -f /tmp/awscliv2.zip');
      return;
    }

    // Run the installer
    console.log('Running installer...');
    const installResult = await shell.exec('sudo /tmp/aws/install');

    // Clean up regardless of result
    await shell.exec('rm -rf /tmp/awscliv2.zip /tmp/aws');

    if (installResult.code !== 0) {
      console.log('Failed to run AWS CLI installer.');
      console.log(installResult.stderr);
      return;
    }
  }

  // Verify the installation succeeded
  // Clear hash table to pick up new aws location
  await shell.exec('hash -r 2>/dev/null || true');

  if (isAwsCliInstalled()) {
    const version = await getAwsCliVersion();
    console.log(`AWS CLI installed successfully (version ${version}).`);
  } else {
    console.log('Installation completed but AWS CLI command not found.');
    console.log('Try running: hash -r');
    console.log('Or open a new terminal session.');
  }
}

/**
 * Install AWS CLI on Windows using Chocolatey
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Chocolatey package manager installed
 * - Administrator PowerShell or Command Prompt
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if AWS CLI is already installed
  if (isAwsCliInstalled()) {
    const version = await getAwsCliVersion();
    console.log(`AWS CLI is already installed (version ${version}), skipping...`);
    return;
  }

  // Verify Chocolatey is available
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('Run in an Administrator PowerShell:');
    console.log("Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))");
    return;
  }

  console.log('Installing AWS CLI via Chocolatey...');
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install AWS CLI via Chocolatey.');
    console.log(result.output);
    return;
  }

  console.log('AWS CLI installed successfully.');
  console.log('You may need to open a new terminal window for the aws command to be available.');
}

/**
 * Install AWS CLI on Ubuntu running in WSL (Windows Subsystem for Linux)
 *
 * WSL Ubuntu follows the same process as native Ubuntu using Snap.
 * If Snap has issues in WSL, falls back to the manual installer method.
 *
 * Prerequisites:
 * - Windows Subsystem for Linux with Ubuntu installed
 * - WSL 2 recommended for best performance
 * - sudo privileges within WSL
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // Check if AWS CLI is already installed
  if (isAwsCliInstalled()) {
    const version = await getAwsCliVersion();
    console.log(`AWS CLI is already installed (version ${version}), skipping...`);
    return;
  }

  // Try Snap first, fall back to manual installer if needed
  // Snap may have issues in WSL due to systemd requirements
  let useManualInstaller = false;

  if (!snap.isInstalled()) {
    console.log('Snap is not installed. Installing snapd...');
    const aptResult = await apt.install('snapd');
    if (!aptResult.success) {
      console.log('Failed to install snapd. Using manual installer instead...');
      useManualInstaller = true;
    }
  }

  if (!useManualInstaller) {
    // Try to set up snapd socket if systemd is available
    const systemdCheck = await shell.exec('systemctl --version 2>/dev/null');
    if (systemdCheck.code === 0) {
      await shell.exec('sudo systemctl enable --now snapd.socket 2>/dev/null');
      await shell.exec('sudo ln -s /var/lib/snapd/snap /snap 2>/dev/null || true');
    }

    console.log('Installing AWS CLI via Snap...');
    const result = await snap.install(SNAP_PACKAGE_NAME, { classic: true });

    if (!result.success) {
      console.log('Snap installation failed. Using manual installer instead...');
      useManualInstaller = true;
    }
  }

  // Manual installer fallback for WSL environments where Snap doesn't work
  if (useManualInstaller) {
    console.log('Installing AWS CLI v2 using the official installer...');

    // Ensure required tools are available
    if (!shell.commandExists('unzip')) {
      console.log('Installing unzip...');
      await apt.install('unzip');
    }

    if (!shell.commandExists('curl')) {
      console.log('Installing curl...');
      await apt.install('curl');
    }

    // Download the installer
    console.log('Downloading AWS CLI v2 installer...');
    const downloadResult = await shell.exec(
      'curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"'
    );

    if (downloadResult.code !== 0) {
      console.log('Failed to download AWS CLI installer.');
      console.log(downloadResult.stderr);
      return;
    }

    // Extract the installer
    console.log('Extracting installer...');
    const extractResult = await shell.exec('unzip -o -q /tmp/awscliv2.zip -d /tmp');

    if (extractResult.code !== 0) {
      console.log('Failed to extract AWS CLI installer.');
      console.log(extractResult.stderr);
      await shell.exec('rm -f /tmp/awscliv2.zip');
      return;
    }

    // Run the installer
    console.log('Running installer...');
    const installResult = await shell.exec('sudo /tmp/aws/install');

    // Clean up
    await shell.exec('rm -rf /tmp/awscliv2.zip /tmp/aws');

    if (installResult.code !== 0) {
      console.log('Failed to run AWS CLI installer.');
      console.log(installResult.stderr);
      return;
    }
  }

  // Verify the installation succeeded
  if (isAwsCliInstalled()) {
    const version = await getAwsCliVersion();
    console.log(`AWS CLI installed successfully (version ${version}).`);
  } else {
    const snapInstalled = await snap.isSnapInstalled(SNAP_PACKAGE_NAME);
    if (snapInstalled) {
      console.log('AWS CLI installed successfully.');
      console.log('You may need to restart your WSL session or add paths to PATH:');
      console.log('export PATH=$PATH:/snap/bin:/usr/local/bin');
    } else {
      console.log('Installation completed but AWS CLI command not found.');
      console.log('Try opening a new terminal or adding /usr/local/bin to your PATH.');
    }
  }
}

/**
 * Install AWS CLI in Git Bash on Windows
 *
 * Git Bash inherits the Windows PATH, so once AWS CLI is installed on Windows
 * via Chocolatey or the MSI installer, it is automatically available in Git Bash.
 * This function calls the Windows installer.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey installed on Windows
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if AWS CLI is already available (inherited from Windows PATH)
  if (isAwsCliInstalled()) {
    const version = await getAwsCliVersion();
    console.log(`AWS CLI is already installed (version ${version}), skipping...`);
    return;
  }

  // Check if Chocolatey is available via Windows path
  const chocoPath = '/c/ProgramData/chocolatey/bin/choco.exe';
  const chocoResult = await shell.exec(`"${chocoPath}" --version 2>/dev/null`);

  if (chocoResult.code !== 0) {
    console.log('Chocolatey is not installed on Windows.');
    console.log('Please install Chocolatey first, then run this installer again.');
    console.log('Or install AWS CLI manually using the MSI installer from:');
    console.log('https://awscli.amazonaws.com/AWSCLIV2.msi');
    return;
  }

  console.log('Installing AWS CLI via Windows Chocolatey...');
  const result = await shell.exec(`"${chocoPath}" install awscli -y`);

  if (result.code !== 0) {
    console.log('Failed to install AWS CLI via Chocolatey.');
    console.log(result.stderr);
    return;
  }

  console.log('AWS CLI installed successfully.');
  console.log('Please close and reopen Git Bash for the aws command to be available.');
  console.log('If aws is still not found, add this to your ~/.bashrc:');
  console.log('export PATH=$PATH:"/c/Program Files/Amazon/AWSCLIV2"');
}

/**
 * Main installation entry point - detects platform and runs appropriate installer
 *
 * Supported platforms:
 * - macos: Uses Homebrew
 * - ubuntu: Uses Snap
 * - debian: Uses Snap (same as ubuntu)
 * - raspbian: Uses Snap (requires 64-bit OS)
 * - amazon_linux: Uses DNF (AL2023) or manual installer (AL2)
 * - rhel: Uses same approach as amazon_linux
 * - fedora: Uses DNF
 * - wsl: Uses Snap or manual installer
 * - windows: Uses Chocolatey
 * - gitbash: Uses Windows Chocolatey via Git Bash
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
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'wsl': install_ubuntu_wsl,
    'windows': install_windows,
  };

  const installer = installers[platform.type];

  if (!installer) {
    // For unknown platforms, gracefully inform the user without throwing an error
    console.log(`AWS CLI is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

module.exports = {
  install,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash,
  // Export helper functions for potential reuse or testing
  isAwsCliInstalled,
  getAwsCliVersion,
  isVersion2,
};

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
