#!/usr/bin/env node

/**
 * @fileoverview Install jq - a lightweight and flexible command-line JSON processor.
 *
 * jq is designed to parse, filter, map, and transform structured JSON data with ease.
 * Think of jq as sed or awk for JSON data - it allows you to slice, filter, and
 * transform JSON with concise filter expressions. jq is essential for developers
 * and DevOps engineers working with JSON-based APIs, configuration files, or any
 * structured data.
 *
 * @module installs/jq
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Install jq on macOS using Homebrew.
 *
 * This function installs jq via Homebrew, which is the recommended method for
 * macOS. Homebrew will automatically install the oniguruma dependency (a regular
 * expressions library) if it is not already present.
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

  // Check if jq is already installed by verifying the command exists
  // Unlike cURL, jq is not pre-installed on macOS, so we can check the command directly
  const isInstalled = shell.commandExists('jq');
  if (isInstalled) {
    console.log('jq is already installed, skipping...');
    return;
  }

  // Install jq using Homebrew with the --quiet flag to suppress non-essential output
  // This makes the command more suitable for automation scripts and CI/CD pipelines
  console.log('Installing jq via Homebrew...');
  const result = await brew.install('jq');

  if (!result.success) {
    console.log('Failed to install jq via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  const verified = shell.commandExists('jq');
  if (!verified) {
    console.log('Installation may have failed: jq command not found after install.');
    return;
  }

  console.log('jq installed successfully.');
}

/**
 * Install jq on Ubuntu/Debian using APT.
 *
 * jq is available in the default Ubuntu and Debian repositories, so no
 * additional PPAs or repositories are required. The repository version may
 * be slightly older than the latest release, but is stable and recommended
 * for most users.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if jq is already installed by looking for the command
  const isInstalled = shell.commandExists('jq');
  if (isInstalled) {
    console.log('jq is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest available version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install jq using APT
  // The apt.install function uses DEBIAN_FRONTEND=noninteractive and -y flag
  // to ensure fully automated installation without prompts
  console.log('Installing jq via APT...');
  const result = await apt.install('jq');

  if (!result.success) {
    console.log('Failed to install jq via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('jq');
  if (!verified) {
    console.log('Installation may have failed: jq command not found after install.');
    return;
  }

  console.log('jq installed successfully.');
}

/**
 * Install jq on Ubuntu running in WSL.
 *
 * WSL Ubuntu installations follow the same process as native Ubuntu using APT.
 * This function delegates to install_ubuntu() because WSL provides a full
 * Ubuntu environment with APT package management.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();
}

/**
 * Install jq on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so jq installation follows the same
 * process as Ubuntu/Debian. The jq package is available for both 32-bit (armv7l)
 * and 64-bit (aarch64) ARM architectures.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install jq on Amazon Linux using DNF or YUM.
 *
 * jq is available in the default Amazon Linux repositories. This function
 * automatically detects whether to use dnf (Amazon Linux 2023) or yum
 * (Amazon Linux 2) based on the available package manager.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if jq is already installed by looking for the command
  const isInstalled = shell.commandExists('jq');
  if (isInstalled) {
    console.log('jq is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Construct the install command based on available package manager
  // The -y flag automatically confirms installation prompts for non-interactive execution
  const installCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y jq'
    : 'sudo yum install -y jq';

  // Install jq
  console.log(`Installing jq via ${packageManager}...`);
  const result = await shell.exec(installCommand);

  if (result.code !== 0) {
    console.log(`Failed to install jq via ${packageManager}.`);
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('jq');
  if (!verified) {
    console.log('Installation may have failed: jq command not found after install.');
    return;
  }

  console.log('jq installed successfully.');
}

/**
 * Install jq on Windows using Chocolatey.
 *
 * This function installs jq via Chocolatey, which downloads the appropriate
 * binary (32-bit or 64-bit) based on system architecture and adds it to the
 * PATH automatically. A new terminal window may be required for PATH updates
 * to take effect.
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

  // Check if jq is already installed via Chocolatey
  const isChocoJqInstalled = await choco.isPackageInstalled('jq');
  if (isChocoJqInstalled) {
    console.log('jq is already installed via Chocolatey, skipping...');
    return;
  }

  // Also check if jq command exists (might be installed via other means like winget)
  const commandExists = shell.commandExists('jq');
  if (commandExists) {
    console.log('jq is already installed, skipping...');
    return;
  }

  // Install jq using Chocolatey
  // The -y flag automatically confirms all prompts for fully non-interactive installation
  console.log('Installing jq via Chocolatey...');
  const result = await choco.install('jq');

  if (!result.success) {
    console.log('Failed to install jq via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled('jq');
  if (!verified) {
    console.log('Installation may have failed: jq package not found after install.');
    return;
  }

  console.log('jq installed successfully via Chocolatey.');
  console.log('');
  console.log('Note: You may need to open a new terminal window for the PATH update to take effect.');
}

/**
 * Install jq on Git Bash (Windows).
 *
 * Git Bash does not include jq by default. This function downloads the Windows
 * binary directly from the official jq GitHub releases and places it in
 * /usr/local/bin, which is included in Git Bash's PATH.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if jq is already available in Git Bash
  const isInstalled = shell.commandExists('jq');
  if (isInstalled) {
    console.log('jq is already installed, skipping...');
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

  // Download the jq Windows binary from the official GitHub releases
  // Using version 1.8.1 as specified in the documentation
  console.log('Downloading jq from GitHub releases...');
  const downloadUrl = 'https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-windows-amd64.exe';
  const downloadCommand = `curl -L -o /usr/local/bin/jq.exe "${downloadUrl}"`;
  const downloadResult = await shell.exec(downloadCommand);

  if (downloadResult.code !== 0) {
    console.log('Failed to download jq binary.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    console.log('');
    console.log('If you encounter SSL certificate errors, try running:');
    console.log('  curl -k -L -o /usr/local/bin/jq.exe "' + downloadUrl + '"');
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  const verified = shell.commandExists('jq');
  if (!verified) {
    console.log('Installation may have failed: jq command not found after install.');
    console.log('');
    console.log('The /usr/local/bin directory may not be in your PATH. Add it manually:');
    console.log('  echo \'export PATH="/usr/local/bin:$PATH"\' >> ~/.bashrc && source ~/.bashrc');
    return;
  }

  console.log('jq installed successfully.');
}

/**
 * Check if jq is installed on the current platform.
 *
 * On macOS, checks if the jq formula is installed via Homebrew.
 * On Windows, checks if jq is installed via Chocolatey.
 * On Linux and Git Bash, checks if the jq command exists.
 *
 * @returns {Promise<boolean>} True if installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    return brew.isFormulaInstalled('jq');
  }

  if (platform.type === 'windows') {
    return choco.isPackageInstalled('jq');
  }

  // Linux and Git Bash: Check if jq command exists
  return shell.commandExists('jq');
}

/**
 * Check if this installer is supported on the current platform.
 * jq is supported on all major platforms.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. Supported platforms:
 * - macOS (Homebrew)
 * - Ubuntu/Debian (APT)
 * - Ubuntu on WSL (APT)
 * - Raspberry Pi OS (APT)
 * - Amazon Linux/RHEL (DNF/YUM)
 * - Windows (Chocolatey)
 * - Git Bash (Manual download from GitHub)
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
  // Do not throw an error - just log a message and return
  if (!installer) {
    console.log(`jq is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
  await installer();
}

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
};

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
