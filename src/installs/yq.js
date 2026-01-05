#!/usr/bin/env node

/**
 * @fileoverview Install yq - a lightweight and portable command-line YAML processor.
 *
 * yq is a lightweight and portable command-line YAML processor written in Go by
 * Mike Farah. It uses jq-like syntax but works with YAML files as well as JSON,
 * XML, CSV, TSV, INI, properties, and HCL formats. Think of yq as the jq or sed
 * equivalent for YAML data - it allows you to read, filter, update, and transform
 * structured data with concise expressions.
 *
 * yq is essential for developers and DevOps engineers who work with Kubernetes
 * manifests, Helm charts, Docker Compose files, CI/CD configurations, or any
 * YAML-based infrastructure. Common use cases include:
 * - Parsing and extracting values from YAML configuration files
 * - Modifying Kubernetes manifests programmatically
 * - Converting between YAML, JSON, and XML formats
 * - Merging multiple YAML files
 * - Updating values in Docker Compose files
 * - Processing CI/CD pipeline configurations
 *
 * IMPORTANT: This installer installs Mike Farah's Go-based yq (https://github.com/mikefarah/yq),
 * which is the most widely used implementation. The Python-based yq (kislyuk/yq)
 * available in some Linux package managers is a different tool and should NOT be
 * installed via APT if you want this version.
 *
 * @module installs/yq
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const snap = require('../utils/ubuntu/snap');
const choco = require('../utils/windows/choco');

/**
 * The name of the yq command used to verify installation
 * @constant {string}
 */
const YQ_COMMAND = 'yq';

/**
 * Check if yq is already installed by verifying the yq command exists in PATH
 *
 * This is a quick synchronous check that works across all platforms by looking
 * for the yq executable in the system PATH.
 *
 * @returns {boolean} True if yq is installed and accessible in PATH
 */
function isYqInstalled() {
  return shell.commandExists(YQ_COMMAND);
}

/**
 * Get the installed version of yq
 *
 * Executes 'yq --version' and parses the output to extract the version number.
 * Returns null if yq is not installed or the version cannot be determined.
 *
 * Mike Farah's yq outputs: "yq (https://github.com/mikefarah/yq/) version v4.50.1"
 * Python yq outputs: "yq X.X.X"
 *
 * @returns {Promise<string|null>} The version string (e.g., "v4.50.1") or null if not installed
 */
async function getYqVersion() {
  // First check if the command exists to avoid unnecessary exec calls
  if (!isYqInstalled()) {
    return null;
  }

  const result = await shell.exec('yq --version');
  if (result.code === 0 && result.stdout) {
    // Mike Farah's yq format: "yq (https://github.com/mikefarah/yq/) version v4.50.1"
    const match = result.stdout.match(/version\s+(v?[\d.]+)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Install yq on macOS using Homebrew
 *
 * This function installs Mike Farah's yq via Homebrew, which is the recommended
 * method for macOS. Homebrew provides the official yq formula that is regularly
 * updated with new releases.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later (macOS 14 Sonoma or later recommended)
 * - Homebrew package manager installed
 * - Terminal access
 *
 * Note: Homebrew has a separate 'python-yq' formula - this installer specifically
 * installs the Go-based yq, not the Python wrapper.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Check if yq is already installed by verifying the command exists
  // This provides idempotency - running the installer multiple times is safe
  if (isYqInstalled()) {
    const version = await getYqVersion();
    console.log(`yq is already installed (version ${version}), skipping...`);
    return;
  }

  // Install yq using Homebrew
  // The --quiet flag is handled internally by the brew utility
  console.log('Installing yq via Homebrew...');
  const result = await brew.install('yq');

  if (!result.success) {
    console.log('Failed to install yq via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  if (isYqInstalled()) {
    const version = await getYqVersion();
    console.log(`yq installed successfully (version ${version}).`);
  } else {
    console.log('Installation completed but yq command not found.');
    console.log('You may need to restart your terminal or add Homebrew to your PATH.');
    console.log('Run: eval "$(/opt/homebrew/bin/brew shellenv)"');
  }
}

/**
 * Install yq on Ubuntu/Debian using Snap
 *
 * This function installs Mike Farah's yq via Snap, which is the recommended
 * method for Ubuntu and Debian systems. The Snap package is officially maintained
 * and provides the Go-based yq.
 *
 * IMPORTANT: The 'yq' package in Ubuntu/Debian APT repositories is NOT Mike Farah's
 * yq - it is a Python-based wrapper around jq called python-yq (kislyuk/yq).
 * Do NOT install via 'apt-get install yq' if you want Mike Farah's yq. Use Snap instead.
 *
 * Prerequisites:
 * - Ubuntu 16.04 LTS or later, or Debian 10 (Buster) or later
 * - sudo privileges
 * - snapd installed (pre-installed on Ubuntu 16.04+)
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if yq is already installed by looking for the command
  // This provides idempotency - running the installer multiple times is safe
  if (isYqInstalled()) {
    const version = await getYqVersion();
    console.log(`yq is already installed (version ${version}), skipping...`);
    return;
  }

  // Check if Snap is available on the system
  if (!snap.isInstalled()) {
    console.log('Snap is not available. Installing snapd...');
    const snapdResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd');
    if (snapdResult.code !== 0) {
      console.log('Failed to install snapd.');
      console.log(snapdResult.stderr || snapdResult.stdout);
      console.log('');
      console.log('You may need to reboot after installing snapd, then try again.');
      return;
    }
    console.log('snapd installed. You may need to reboot and run this installer again.');
    return;
  }

  // Install yq using Snap
  // Snap packages install non-interactively by default
  console.log('Installing yq via Snap...');
  const result = await snap.install('yq');

  if (!result.success) {
    console.log('Failed to install yq via Snap.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  if (isYqInstalled()) {
    const version = await getYqVersion();
    console.log(`yq installed successfully (version ${version}).`);
  } else {
    console.log('Installation completed but yq command not found.');
    console.log('');
    console.log('Snap binaries may not be in your PATH. Add Snap\'s bin directory:');
    console.log('echo \'export PATH="/snap/bin:$PATH"\' >> ~/.bashrc && source ~/.bashrc');
  }
}

/**
 * Install yq on Ubuntu running in WSL (Windows Subsystem for Linux)
 *
 * WSL Ubuntu follows the same process as native Ubuntu using Snap. However,
 * Snap support in WSL can be problematic, so this function uses direct binary
 * download as the recommended method for WSL environments.
 *
 * Prerequisites:
 * - Windows 10 version 2004+ or Windows 11
 * - Windows Subsystem for Linux (WSL) with Ubuntu installed
 * - WSL 2 recommended for best performance
 * - sudo privileges within WSL
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // Check if yq is already installed by looking for the command
  if (isYqInstalled()) {
    const version = await getYqVersion();
    console.log(`yq is already installed (version ${version}), skipping...`);
    return;
  }

  // For WSL, direct binary download is more reliable than Snap
  // Snap support in WSL can be problematic
  console.log('Installing yq via direct binary download (recommended for WSL)...');

  // Download the Linux AMD64 binary (WSL typically runs on x86_64)
  const downloadUrl = 'https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64';
  const downloadCommand = `sudo curl -L -o /usr/local/bin/yq "${downloadUrl}" && sudo chmod +x /usr/local/bin/yq`;

  const result = await shell.exec(downloadCommand);

  if (result.code !== 0) {
    console.log('Failed to download yq binary.');
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  if (isYqInstalled()) {
    const version = await getYqVersion();
    console.log(`yq installed successfully (version ${version}).`);
  } else {
    console.log('Installation completed but yq command not found.');
    console.log('');
    console.log('/usr/local/bin may not be in your PATH. Add it:');
    console.log('echo \'export PATH="/usr/local/bin:$PATH"\' >> ~/.bashrc && source ~/.bashrc');
  }
}

/**
 * Install yq on Raspberry Pi OS using Snap or direct binary download
 *
 * This function attempts to install yq via Snap first (if available), and falls
 * back to direct binary download for ARM architectures if Snap is not available
 * or if using 32-bit Raspberry Pi OS.
 *
 * Prerequisites:
 * - Raspberry Pi OS (32-bit or 64-bit)
 * - Raspberry Pi 2 or later (Raspberry Pi 3B+ or later recommended for 64-bit)
 * - sudo privileges
 * - Internet connectivity
 *
 * Note: The APT repositories contain python-yq, not Mike Farah's yq. Use Snap
 * or direct binary download instead.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if yq is already installed by looking for the command
  if (isYqInstalled()) {
    const version = await getYqVersion();
    console.log(`yq is already installed (version ${version}), skipping...`);
    return;
  }

  // Detect the system architecture to determine the correct binary
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();

  // Determine the correct binary URL based on architecture
  // aarch64 = 64-bit ARM, armv7l = 32-bit ARM
  let binaryUrl;
  if (arch === 'aarch64') {
    binaryUrl = 'https://github.com/mikefarah/yq/releases/latest/download/yq_linux_arm64';
  } else if (arch === 'armv7l') {
    binaryUrl = 'https://github.com/mikefarah/yq/releases/latest/download/yq_linux_arm';
  } else {
    console.log(`Unsupported architecture: ${arch}`);
    console.log('yq is available for arm64 (aarch64) and arm (armv7l) architectures.');
    return;
  }

  console.log(`Detected architecture: ${arch}`);

  // Try Snap first if available (works well on 64-bit Raspberry Pi OS)
  if (snap.isInstalled() && arch === 'aarch64') {
    console.log('Installing yq via Snap...');
    const snapResult = await snap.install('yq');

    if (snapResult.success) {
      // Verify the installation succeeded
      if (isYqInstalled()) {
        const version = await getYqVersion();
        console.log(`yq installed successfully via Snap (version ${version}).`);
        return;
      }
    }
    // If Snap install failed, fall through to binary download
    console.log('Snap installation failed, falling back to direct binary download...');
  }

  // Direct binary download (recommended for 32-bit or when Snap is not available)
  console.log('Installing yq via direct binary download...');

  const downloadCommand = `sudo curl -L -o /usr/local/bin/yq "${binaryUrl}" && sudo chmod +x /usr/local/bin/yq`;
  const result = await shell.exec(downloadCommand);

  if (result.code !== 0) {
    console.log('Failed to download yq binary.');
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  if (isYqInstalled()) {
    const version = await getYqVersion();
    console.log(`yq installed successfully (version ${version}).`);
  } else {
    console.log('Installation completed but yq command not found.');
    console.log('');
    console.log('Ensure /usr/local/bin is in your PATH:');
    console.log('echo \'export PATH="/usr/local/bin:$PATH"\' >> ~/.bashrc && source ~/.bashrc');
  }
}

/**
 * Install yq on Amazon Linux/RHEL using direct binary download from GitHub
 *
 * This function downloads the yq binary directly from GitHub releases and
 * installs it to /usr/local/bin. This is the recommended method because
 * Mike Farah's yq is NOT available in the standard Amazon Linux repositories.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - sudo privileges
 * - Internet connectivity
 * - curl installed (pre-installed on Amazon Linux)
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if yq is already installed by looking for the command
  if (isYqInstalled()) {
    const version = await getYqVersion();
    console.log(`yq is already installed (version ${version}), skipping...`);
    return;
  }

  // Detect the system architecture to download the correct binary
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();

  // Determine the correct binary URL based on architecture
  // x86_64 = AMD64 instances, aarch64 = ARM-based Graviton instances
  let binaryUrl;
  if (arch === 'x86_64') {
    binaryUrl = 'https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64';
  } else if (arch === 'aarch64') {
    binaryUrl = 'https://github.com/mikefarah/yq/releases/latest/download/yq_linux_arm64';
  } else {
    console.log(`Unsupported architecture: ${arch}`);
    console.log('yq is available for x86_64 (AMD64) and aarch64 (ARM64) architectures.');
    return;
  }

  console.log(`Detected architecture: ${arch}`);

  // Download and install the yq binary from GitHub releases
  console.log('Downloading yq from GitHub releases...');
  const downloadCommand = `sudo curl -L -o /usr/local/bin/yq "${binaryUrl}" && sudo chmod +x /usr/local/bin/yq`;
  const result = await shell.exec(downloadCommand);

  if (result.code !== 0) {
    console.log('Failed to download yq binary.');
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  if (isYqInstalled()) {
    const version = await getYqVersion();
    console.log(`yq installed successfully (version ${version}).`);
  } else {
    console.log('Installation completed but yq command not found.');
    console.log('');
    console.log('/usr/local/bin should be in PATH by default. If not, add it:');
    console.log('echo \'export PATH="/usr/local/bin:$PATH"\' >> ~/.bashrc && source ~/.bashrc');
  }
}

/**
 * Install yq on Windows using Chocolatey
 *
 * This function installs yq via Chocolatey, which downloads the appropriate
 * Windows binary and adds it to the PATH automatically. A new terminal window
 * may be required for PATH updates to take effect.
 *
 * Prerequisites:
 * - Windows 10 (version 1803+) or Windows 11
 * - Chocolatey package manager installed
 * - Administrator PowerShell or Command Prompt
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if Chocolatey is available - it is required for Windows installation
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('Run: dev install chocolatey');
    return;
  }

  // Check if yq is already installed via Chocolatey
  const isChocoYqInstalled = await choco.isPackageInstalled('yq');
  if (isChocoYqInstalled) {
    const version = await choco.getPackageVersion('yq');
    console.log(`yq is already installed via Chocolatey (version ${version}), skipping...`);
    return;
  }

  // Also check if yq command exists (might be installed via other means like winget)
  if (isYqInstalled()) {
    const version = await getYqVersion();
    console.log(`yq is already installed (version ${version}), skipping...`);
    return;
  }

  // Install yq using Chocolatey
  // The -y flag automatically confirms all prompts for fully non-interactive installation
  console.log('Installing yq via Chocolatey...');
  const result = await choco.install('yq');

  if (!result.success) {
    console.log('Failed to install yq via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled('yq');
  if (verified) {
    console.log('yq installed successfully via Chocolatey.');
    console.log('');
    console.log('Note: You may need to open a new terminal window for the PATH update to take effect.');
  } else {
    console.log('Installation completed but could not verify yq package.');
    console.log('Try opening a new terminal window and run: yq --version');
  }
}

/**
 * Install yq in Git Bash on Windows
 *
 * Git Bash does not include yq by default. This function downloads the Windows
 * binary directly from GitHub releases and places it in /usr/local/bin, which
 * is included in Git Bash's PATH.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11
 * - Git for Windows installed (includes Git Bash)
 * - Internet connectivity
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if yq is already available in Git Bash
  if (isYqInstalled()) {
    const version = await getYqVersion();
    console.log(`yq is already installed (version ${version}), skipping...`);
    return;
  }

  // Create the /usr/local/bin directory if it does not exist
  // This directory is typically in Git Bash's PATH
  console.log('Creating /usr/local/bin directory if needed...');
  const mkdirResult = await shell.exec('mkdir -p /usr/local/bin');
  if (mkdirResult.code !== 0) {
    console.log('Failed to create /usr/local/bin directory.');
    console.log('Try running Git Bash as Administrator.');
    return;
  }

  // Download the yq Windows binary from the official GitHub releases
  // Note: Git Bash uses Windows executables, so we download the Windows AMD64 binary
  console.log('Downloading yq from GitHub releases...');
  const downloadUrl = 'https://github.com/mikefarah/yq/releases/latest/download/yq_windows_amd64.exe';
  const downloadCommand = `curl -L -o /usr/local/bin/yq.exe "${downloadUrl}"`;
  const downloadResult = await shell.exec(downloadCommand);

  if (downloadResult.code !== 0) {
    console.log('Failed to download yq binary.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    console.log('');
    console.log('If you encounter SSL certificate errors, try running:');
    console.log(`  curl -k -L -o /usr/local/bin/yq.exe "${downloadUrl}"`);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  if (isYqInstalled()) {
    const version = await getYqVersion();
    console.log(`yq installed successfully (version ${version}).`);
  } else {
    console.log('Installation completed but yq command not found.');
    console.log('');
    console.log('The /usr/local/bin directory may not be in your PATH. Add it manually:');
    console.log('  echo \'export PATH="/usr/local/bin:$PATH"\' >> ~/.bashrc && source ~/.bashrc');
  }
}

/**
 * Check if this installer is supported on the current platform.
 * yq is supported on all major platforms.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer
 *
 * This function detects the current operating system using the os utility module
 * and dispatches to the appropriate platform-specific installer function.
 *
 * Supported platforms:
 * - macos: Uses Homebrew
 * - ubuntu/debian: Uses Snap
 * - wsl: Uses direct binary download (Snap can be problematic in WSL)
 * - raspbian: Uses Snap or direct binary download
 * - amazon_linux/rhel: Uses direct binary download from GitHub
 * - windows: Uses Chocolatey
 * - gitbash: Uses direct binary download (Windows executable)
 *
 * Unsupported platforms will receive a graceful message and the script
 * will exit cleanly without errors.
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
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  // Look up the installer for the detected platform
  const installer = installers[platform.type];

  // If no installer exists for this platform, inform the user gracefully
  // Do not throw an error - just log a message and return cleanly
  if (!installer) {
    console.log(`yq is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
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
  install_gitbash,
  // Export helper functions for potential reuse or testing
  isYqInstalled,
  getYqVersion,
};

// Allow direct execution: node yq.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
