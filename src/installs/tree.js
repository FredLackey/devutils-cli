#!/usr/bin/env node

/**
 * @fileoverview Install tree - a recursive directory listing command-line utility.
 *
 * Tree produces a depth-indented listing of files and directories in a tree-like
 * format, making it easy to understand folder hierarchies at a glance. Tree is
 * invaluable for developers, system administrators, and anyone who works with
 * complex directory structures.
 *
 * Common use cases include:
 * - Documenting project structures for README files
 * - Understanding unfamiliar codebases
 * - Verifying deployment directory layouts
 * - Debugging file organization issues
 *
 * @module installs/tree
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Install tree on macOS using Homebrew.
 *
 * This function installs tree via Homebrew, which is the recommended method for
 * macOS. Tree is a simple command-line utility with no additional dependencies.
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

  // Check if tree is already installed by verifying the command exists
  // Tree is not pre-installed on macOS, so we can check the command directly
  const isInstalled = shell.commandExists('tree');
  if (isInstalled) {
    console.log('tree is already installed, skipping...');
    return;
  }

  // Install tree using Homebrew
  // The brew.install function handles the --quiet flag internally for cleaner output
  console.log('Installing tree via Homebrew...');
  const result = await brew.install('tree');

  if (!result.success) {
    console.log('Failed to install tree via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  const verified = shell.commandExists('tree');
  if (!verified) {
    console.log('Installation may have failed: tree command not found after install.');
    return;
  }

  console.log('tree installed successfully.');
}

/**
 * Install tree on Ubuntu/Debian using APT.
 *
 * Tree is available in the default Ubuntu and Debian repositories, so no
 * additional PPAs or repositories are required. The repository version is
 * stable and recommended for most users.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if tree is already installed by looking for the command
  const isInstalled = shell.commandExists('tree');
  if (isInstalled) {
    console.log('tree is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest available version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install tree using APT
  // The apt.install function uses DEBIAN_FRONTEND=noninteractive and -y flag
  // to ensure fully automated installation without prompts
  console.log('Installing tree via APT...');
  const result = await apt.install('tree');

  if (!result.success) {
    console.log('Failed to install tree via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('tree');
  if (!verified) {
    console.log('Installation may have failed: tree command not found after install.');
    return;
  }

  console.log('tree installed successfully.');
}

/**
 * Install tree on Ubuntu running in WSL.
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
 * Install tree on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so tree installation follows the same
 * process as Ubuntu/Debian. The tree package is available for both 32-bit (armv7l)
 * and 64-bit (aarch64) ARM architectures.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install tree on Amazon Linux using DNF or YUM.
 *
 * Tree is available in the default Amazon Linux repositories. This function
 * automatically detects whether to use dnf (Amazon Linux 2023) or yum
 * (Amazon Linux 2) based on the available package manager.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if tree is already installed by looking for the command
  const isInstalled = shell.commandExists('tree');
  if (isInstalled) {
    console.log('tree is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Construct the install command based on available package manager
  // The -y flag automatically confirms installation prompts for non-interactive execution
  const installCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y tree'
    : 'sudo yum install -y tree';

  // Install tree
  console.log(`Installing tree via ${packageManager}...`);
  const result = await shell.exec(installCommand);

  if (result.code !== 0) {
    console.log(`Failed to install tree via ${packageManager}.`);
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('tree');
  if (!verified) {
    console.log('Installation may have failed: tree command not found after install.');
    return;
  }

  console.log('tree installed successfully.');
}

/**
 * Install tree on Windows using Chocolatey.
 *
 * This function installs tree via Chocolatey, which downloads the GnuWin32
 * version of tree. Note that Windows includes a built-in tree command, but
 * the GnuWin32 version provides additional features like colorized output
 * and extended options matching the Unix version.
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

  // Check if tree is already installed via Chocolatey
  // Note: Windows has a built-in tree.com command, so we check Chocolatey specifically
  const isChocoTreeInstalled = await choco.isPackageInstalled('tree');
  if (isChocoTreeInstalled) {
    console.log('tree is already installed via Chocolatey, skipping...');
    return;
  }

  // Install tree using Chocolatey
  // The -y flag automatically confirms all prompts for fully non-interactive installation
  console.log('Installing tree via Chocolatey...');
  const result = await choco.install('tree');

  if (!result.success) {
    console.log('Failed to install tree via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled('tree');
  if (!verified) {
    console.log('Installation may have failed: tree package not found after install.');
    return;
  }

  console.log('tree installed successfully via Chocolatey.');
  console.log('');
  console.log('Note: You may need to open a new terminal window for the PATH update to take effect.');
  console.log('Use "tree --version" to verify. If you see "Invalid switch", the built-in Windows');
  console.log('tree is being invoked instead. Ensure Chocolatey bin is before System32 in PATH.');
}

/**
 * Install tree on Git Bash (Windows).
 *
 * Git Bash does not include tree by default. This function downloads the
 * GnuWin32 tree binary from SourceForge and places it in /usr/local/bin,
 * which is included in Git Bash's PATH.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if tree is already available in Git Bash
  const isInstalled = shell.commandExists('tree');
  if (isInstalled) {
    console.log('tree is already installed, skipping...');
    return;
  }

  // Check if curl is available for downloading the binary
  // curl should be bundled with Git Bash, but verify it exists
  const hasCurl = shell.commandExists('curl');
  if (!hasCurl) {
    console.log('curl is not available. Please ensure Git for Windows is installed correctly.');
    return;
  }

  // Check if unzip is available for extracting the binary
  // unzip is included in recent versions of Git for Windows
  const hasUnzip = shell.commandExists('unzip');
  if (!hasUnzip) {
    console.log('unzip is not available.');
    console.log('Please download tree.exe manually from https://gnuwin32.sourceforge.net/packages/tree.htm');
    console.log('and place it in /usr/local/bin');
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

  // Download and extract the tree binary from GnuWin32 on SourceForge
  // This is the official GnuWin32 distribution of tree for Windows
  console.log('Downloading tree from GnuWin32...');
  const downloadUrl = 'https://downloads.sourceforge.net/gnuwin32/tree-1.5.2.2-bin.zip';
  const downloadCommand = `curl -L -o /tmp/tree.zip "${downloadUrl}" && unzip -o -j /tmp/tree.zip bin/tree.exe -d /usr/local/bin && rm /tmp/tree.zip`;
  const downloadResult = await shell.exec(downloadCommand);

  if (downloadResult.code !== 0) {
    console.log('Failed to download or extract tree binary.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    console.log('');
    console.log('If you encounter SSL certificate errors, try running:');
    console.log('  curl -k -L -o /tmp/tree.zip "' + downloadUrl + '"');
    console.log('');
    console.log('Alternatively, if tree is installed via Chocolatey on Windows, copy it:');
    console.log('  cp "/c/ProgramData/chocolatey/bin/tree.exe" /usr/local/bin/');
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  const verified = shell.commandExists('tree');
  if (!verified) {
    console.log('Installation may have failed: tree command not found after install.');
    console.log('');
    console.log('The /usr/local/bin directory may not be in your PATH. Add it manually:');
    console.log('  echo \'export PATH="/usr/local/bin:$PATH"\' >> ~/.bashrc && source ~/.bashrc');
    return;
  }

  console.log('tree installed successfully.');
}

/**
 * Check if tree is installed on the current system.
 * @returns {Promise<boolean>} True if tree is installed
 */
async function isInstalled() {
  const platform = os.detect();
  if (platform.type === 'macos') {
    return brew.isFormulaInstalled('tree');
  }
  if (platform.type === 'windows') {
    return choco.isPackageInstalled('tree');
  }
  return shell.commandExists('tree');
}

/**
 * Check if this installer is supported on the current platform.
 * tree is supported on all major platforms.
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
 * - Git Bash (Manual download from GnuWin32)
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
    console.log(`tree is not available for ${platform.type}.`);
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
