#!/usr/bin/env node

/**
 * @fileoverview Install tfenv (Terraform Version Manager).
 * @module installs/tfenv
 *
 * tfenv is a version manager for Terraform, inspired by rbenv. It allows you to
 * install, switch between, and manage multiple versions of Terraform on the same
 * machine. This is essential for developers and DevOps engineers who work on
 * projects requiring different Terraform versions, ensuring compatibility and
 * reducing the risk of applying infrastructure changes with an incorrect Terraform
 * binary.
 *
 * Key capabilities include:
 * - Version switching: Easily install and switch between multiple Terraform versions
 * - Automatic version selection: Use .terraform-version files to auto-select the
 *   correct version per project
 * - Hash verification: Automatically validates downloads against HashiCorp's
 *   published SHA256 hashes
 * - Signature verification: Optionally verify PGP signatures using Keybase or GnuPG
 *
 * IMPORTANT PLATFORM DISTINCTION:
 * - macOS: Uses Homebrew to install tfenv (recommended)
 * - Ubuntu/Debian/WSL/Raspbian: Git clone to ~/.tfenv with PATH configuration
 * - Amazon Linux: Git clone to ~/.tfenv with PATH configuration
 * - Windows (native): tfenv has experimental/failing support - marked as not supported
 * - Git Bash: tfenv has experimental/failing support - marked as not supported
 *
 * POST-INSTALLATION NOTES:
 * - Unix-like systems require sourcing the shell configuration or opening a new terminal
 * - tfenv is installed per-user and does not require sudo for Terraform version management
 * - Use .terraform-version files in project roots for automatic version selection
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const fs = require('fs');
const path = require('path');

/**
 * The Homebrew formula name for tfenv on macOS.
 */
const HOMEBREW_FORMULA_NAME = 'tfenv';

/**
 * The GitHub repository URL for tfenv.
 * This is used for git clone installation on Linux systems.
 */
const TFENV_REPO_URL = 'https://github.com/tfutils/tfenv.git';

/**
 * The default installation directory for tfenv on Unix-like systems.
 * Installed to the user's home directory for per-user isolation.
 */
const TFENV_INSTALL_DIR = '.tfenv';

/**
 * Check if tfenv is installed by verifying the tfenv command exists in PATH.
 *
 * tfenv installs a shell script, so we can use shell.commandExists() to verify.
 * For git-based installations, we also check for the ~/.tfenv directory.
 *
 * @returns {boolean} True if tfenv is installed, false otherwise
 */
function isTfenvInstalled() {
  // First check if tfenv is in PATH
  if (shell.commandExists('tfenv')) {
    return true;
  }

  // Also check for the existence of the tfenv directory (git clone installation)
  const homeDir = os.getHomeDir();
  const tfenvDir = path.join(homeDir, TFENV_INSTALL_DIR);
  const tfenvBin = path.join(tfenvDir, 'bin', 'tfenv');

  return fs.existsSync(tfenvBin);
}

/**
 * Get the installed tfenv version.
 *
 * Executes 'tfenv --version' to get the version string.
 * For git-based installations, we source the PATH first.
 *
 * @returns {Promise<string|null>} tfenv version string, or null if not installed
 */
async function getTfenvVersion() {
  // First try directly if in PATH
  if (shell.commandExists('tfenv')) {
    const result = await shell.exec('tfenv --version');
    if (result.code === 0 && result.stdout) {
      return result.stdout.trim();
    }
  }

  // For git clone installations, source PATH and try again
  const homeDir = os.getHomeDir();
  const tfenvDir = path.join(homeDir, TFENV_INSTALL_DIR);

  if (fs.existsSync(path.join(tfenvDir, 'bin', 'tfenv'))) {
    const result = await shell.exec(
      `bash -c 'export PATH="$HOME/${TFENV_INSTALL_DIR}/bin:$PATH" && tfenv --version'`
    );
    if (result.code === 0 && result.stdout) {
      return result.stdout.trim();
    }
  }

  return null;
}

/**
 * Detect the user's default shell on Unix-like systems.
 *
 * This is used to determine which shell configuration file to update
 * after tfenv installation.
 *
 * @returns {string} The shell name ('bash', 'zsh', or 'sh')
 */
function detectShell() {
  const shellEnv = process.env.SHELL || '';

  if (shellEnv.includes('zsh')) {
    return 'zsh';
  } else if (shellEnv.includes('bash')) {
    return 'bash';
  }
  return 'bash'; // Default to bash
}

/**
 * Get the shell configuration file path for the current user.
 *
 * Returns the appropriate rc file based on the detected shell.
 *
 * @returns {string} Path to the shell configuration file
 */
function getShellConfigFile() {
  const homeDir = os.getHomeDir();
  const userShell = detectShell();

  if (userShell === 'zsh') {
    return path.join(homeDir, '.zshrc');
  }
  return path.join(homeDir, '.bashrc');
}

/**
 * Check if tfenv PATH configuration already exists in a shell config file.
 *
 * Searches for the tfenv PATH export line to determine if tfenv has already
 * been configured in the given file.
 *
 * @param {string} filePath - Path to the shell configuration file
 * @returns {boolean} True if tfenv configuration is present, false otherwise
 */
function hasTfenvConfig(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Check for tfenv PATH configuration
    return content.includes('.tfenv/bin') || content.includes('tfenv');
  } catch (err) {
    return false;
  }
}

/**
 * Add tfenv PATH configuration to the shell config file.
 *
 * Appends the necessary PATH export to the user's shell configuration file
 * so that tfenv is available in new terminal sessions.
 *
 * @param {string} configFile - Path to the shell configuration file
 * @returns {boolean} True if configuration was added successfully
 */
function addTfenvToPath(configFile) {
  // tfenv configuration block
  const tfenvConfig = `
# tfenv configuration
export PATH="$HOME/.tfenv/bin:$PATH"
`;

  try {
    fs.appendFileSync(configFile, tfenvConfig);
    return true;
  } catch (err) {
    console.log(`Warning: Could not update ${configFile}: ${err.message}`);
    return false;
  }
}

/**
 * Install required dependencies for tfenv on Debian-based systems.
 *
 * tfenv requires git for installation and updates, curl or wget for downloading
 * Terraform binaries, and unzip for extracting them.
 *
 * @returns {Promise<boolean>} True if dependencies were installed successfully
 */
async function installDebianDependencies() {
  console.log('Installing required dependencies (git, curl, unzip)...');

  const result = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git curl unzip'
  );

  if (result.code !== 0) {
    console.log('Warning: Failed to install some dependencies.');
    console.log(result.stderr || result.stdout);
    return false;
  }

  return true;
}

/**
 * Install required dependencies for tfenv on Amazon Linux systems.
 *
 * Uses dnf (AL2023) or yum (AL2) to install git, curl, and unzip.
 *
 * @returns {Promise<boolean>} True if dependencies were installed successfully
 */
async function installAmazonLinuxDependencies() {
  console.log('Installing required dependencies (git, curl, unzip)...');

  // Detect package manager (dnf for AL2023, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const packageManager = hasDnf ? 'dnf' : 'yum';

  const result = await shell.exec(
    `sudo ${packageManager} install -y git curl unzip`
  );

  if (result.code !== 0) {
    console.log('Warning: Failed to install some dependencies.');
    console.log(result.stderr || result.stdout);
    return false;
  }

  return true;
}

/**
 * Clone the tfenv repository to the user's home directory.
 *
 * Uses a shallow clone (--depth=1) for faster download.
 * The repository is cloned to ~/.tfenv.
 *
 * @returns {Promise<boolean>} True if clone was successful
 */
async function cloneTfenvRepository() {
  const homeDir = os.getHomeDir();
  const tfenvDir = path.join(homeDir, TFENV_INSTALL_DIR);

  // Check if directory already exists
  if (fs.existsSync(tfenvDir)) {
    console.log(`Directory ${tfenvDir} already exists.`);
    console.log('Attempting to update existing installation...');

    // Try to update existing installation
    const pullResult = await shell.exec(`git -C "${tfenvDir}" pull`);
    if (pullResult.code === 0) {
      console.log('Successfully updated existing tfenv installation.');
      return true;
    }

    console.log('Could not update existing installation.');
    console.log('To reinstall, remove the directory and run again:');
    console.log(`  rm -rf ${tfenvDir}`);
    return false;
  }

  // Clone the repository
  console.log('Cloning tfenv repository...');
  const cloneResult = await shell.exec(
    `git clone --depth=1 ${TFENV_REPO_URL} "${tfenvDir}"`
  );

  if (cloneResult.code !== 0) {
    console.log('Failed to clone tfenv repository.');
    console.log(cloneResult.stderr || cloneResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Check your internet connection');
    console.log('  2. Ensure git is installed: sudo apt-get install git');
    console.log('  3. Try cloning manually:');
    console.log(`     git clone ${TFENV_REPO_URL} ~/.tfenv`);
    return false;
  }

  return true;
}

/**
 * Install tfenv on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - zsh shell (default on macOS 10.15+) or bash
 *
 * This function installs tfenv via Homebrew which handles PATH configuration
 * automatically. If the conflicting 'tenv' package is installed, it should
 * be removed first.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if tfenv is already installed...');

  // Check if tfenv is already installed via Homebrew formula
  const isBrewTfenvInstalled = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (isBrewTfenvInstalled) {
    const version = await getTfenvVersion();
    console.log(`tfenv ${version || 'unknown version'} is already installed via Homebrew, skipping...`);
    console.log('');
    console.log('To manage Terraform versions:');
    console.log('  tfenv install latest     # Install latest Terraform');
    console.log('  tfenv use latest         # Switch to latest version');
    console.log('  terraform --version      # Verify installation');
    return;
  }

  // Also check if tfenv is installed via other means (e.g., git clone)
  if (isTfenvInstalled()) {
    const version = await getTfenvVersion();
    console.log(`tfenv ${version || 'unknown version'} is already installed, skipping...`);
    console.log('');
    console.log('Note: tfenv was not installed via Homebrew.');
    console.log('If you want to manage it with Homebrew, first uninstall the existing tfenv.');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Install tfenv using Homebrew with --quiet flag for cleaner output
  console.log('Installing tfenv via Homebrew...');
  const result = await shell.exec('brew install --quiet tfenv');

  if (result.code !== 0) {
    console.log('Failed to install tfenv via Homebrew.');
    console.log(result.stderr || result.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. If you have tenv installed, remove it first:');
    console.log('     brew uninstall tenv');
    console.log('  2. Try updating Homebrew: brew update');
    console.log('  3. Try manual installation: brew install tfenv');
    return;
  }

  // Verify the installation succeeded
  const verified = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (!verified) {
    console.log('Installation may have failed: tfenv formula not found after install.');
    return;
  }

  const version = await getTfenvVersion();
  console.log('');
  console.log(`tfenv ${version || ''} installed successfully via Homebrew.`);
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Open a new terminal (Homebrew adds tfenv to PATH automatically)');
  console.log('  2. Verify tfenv is working: tfenv --version');
  console.log('  3. Install Terraform: tfenv install latest');
  console.log('  4. Use Terraform: tfenv use latest');
  console.log('  5. Verify Terraform: terraform --version');
}

/**
 * Install tfenv on Ubuntu/Debian using git clone.
 *
 * Prerequisites:
 * - Ubuntu 20.04 or later, or Debian 10 or later
 * - sudo privileges (for installing git, curl, unzip if not present)
 * - git, curl, and unzip installed
 *
 * This function clones the tfenv repository to ~/.tfenv and configures
 * the PATH in the user's shell configuration file.
 *
 * Note: tfenv is not available in the official Ubuntu/Debian APT repositories.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if tfenv is already installed...');

  // Check if tfenv is already installed
  if (isTfenvInstalled()) {
    const version = await getTfenvVersion();
    console.log(`tfenv ${version || 'unknown version'} is already installed, skipping...`);
    console.log('');
    console.log('To use tfenv, open a new terminal or run: source ~/.bashrc');
    return;
  }

  // Install dependencies
  await installDebianDependencies();

  // Clone the tfenv repository
  const cloneSuccess = await cloneTfenvRepository();
  if (!cloneSuccess) {
    return;
  }

  // Add tfenv to PATH in shell config
  const configFile = getShellConfigFile();
  if (!hasTfenvConfig(configFile)) {
    console.log(`Adding tfenv to PATH in ${configFile}...`);
    addTfenvToPath(configFile);
  } else {
    console.log('tfenv PATH configuration already exists in shell config file.');
  }

  // Get the installed version
  const version = await getTfenvVersion();

  console.log('');
  console.log(`tfenv ${version || ''} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Open a new terminal, OR run: source ~/.bashrc');
  console.log('  2. Verify tfenv is working: tfenv --version');
  console.log('  3. Install Terraform: tfenv install latest');
  console.log('  4. Use Terraform: tfenv use latest');
  console.log('  5. Verify Terraform: terraform --version');
}

/**
 * Install tfenv on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 *
 * WSL runs a full Linux environment, so tfenv installation follows the same
 * process as native Ubuntu using git clone.
 *
 * NOTE: tfenv installed in WSL is separate from any Windows Terraform installation.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Check if tfenv is already installed
  if (isTfenvInstalled()) {
    const version = await getTfenvVersion();
    console.log(`tfenv ${version || 'unknown version'} is already installed in WSL, skipping...`);
    console.log('');
    console.log('To use tfenv, open a new terminal or run: source ~/.bashrc');
    return;
  }

  // Install dependencies
  await installDebianDependencies();

  // Clone the tfenv repository
  const cloneSuccess = await cloneTfenvRepository();
  if (!cloneSuccess) {
    return;
  }

  // Add tfenv to PATH in shell config
  const configFile = getShellConfigFile();
  if (!hasTfenvConfig(configFile)) {
    console.log(`Adding tfenv to PATH in ${configFile}...`);
    addTfenvToPath(configFile);
  }

  const version = await getTfenvVersion();

  console.log('');
  console.log(`tfenv ${version || ''} installed successfully in WSL.`);
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Open a new terminal, OR run: source ~/.bashrc');
  console.log('  2. Verify tfenv is working: tfenv --version');
  console.log('  3. Install Terraform: tfenv install latest');
  console.log('  4. Use Terraform: tfenv use latest');
  console.log('  5. Verify Terraform: terraform --version');
  console.log('');
  console.log('WSL Note:');
  console.log('  tfenv in WSL is separate from any Windows Terraform installation.');
  console.log('  For Windows native Terraform, install it separately using Chocolatey.');
}

/**
 * Install tfenv on Raspberry Pi OS using git clone.
 *
 * Prerequisites:
 * - Raspberry Pi OS (Bookworm, Bullseye, or Buster) - 64-bit or 32-bit
 * - Raspberry Pi 2 or later
 * - sudo privileges
 * - git, curl, and unzip installed
 *
 * tfenv automatically detects ARM architecture and downloads the appropriate
 * Terraform binary. For 64-bit Raspberry Pi OS, it uses linux_arm64 binaries.
 * For 32-bit, it uses linux_arm binaries.
 *
 * Note: Raspberry Pi Zero/1 (armv6l) have limited Terraform version support.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if tfenv is already installed...');

  // Check if tfenv is already installed
  if (isTfenvInstalled()) {
    const version = await getTfenvVersion();
    console.log(`tfenv ${version || 'unknown version'} is already installed, skipping...`);
    console.log('');
    console.log('To use tfenv, open a new terminal or run: source ~/.bashrc');
    return;
  }

  // Check and report architecture for informational purposes
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  console.log(`Detected architecture: ${arch}`);

  // Provide guidance for armv6l users
  if (arch === 'armv6l') {
    console.log('');
    console.log('NOTE: ARMv6 (Raspberry Pi Zero/1) is detected.');
    console.log('tfenv will install successfully, but some newer Terraform versions');
    console.log('may not have ARMv6 builds available.');
    console.log('');
  }

  // Install dependencies
  await installDebianDependencies();

  // Clone the tfenv repository
  const cloneSuccess = await cloneTfenvRepository();
  if (!cloneSuccess) {
    return;
  }

  // Add tfenv to PATH in shell config
  const configFile = getShellConfigFile();
  if (!hasTfenvConfig(configFile)) {
    console.log(`Adding tfenv to PATH in ${configFile}...`);
    addTfenvToPath(configFile);
  }

  const version = await getTfenvVersion();

  console.log('');
  console.log(`tfenv ${version || ''} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Open a new terminal, OR run: source ~/.bashrc');
  console.log('  2. Verify tfenv is working: tfenv --version');
  console.log('  3. Install Terraform: tfenv install latest');
  console.log('  4. Use Terraform: tfenv use latest');
  console.log('  5. Verify Terraform: terraform --version');

  // Extra guidance for ARM architecture
  if (arch === 'aarch64') {
    console.log('');
    console.log('ARM64 Note: tfenv will download linux_arm64 Terraform binaries.');
  } else if (arch === 'armv7l' || arch === 'armv6l') {
    console.log('');
    console.log('ARM32 Note: tfenv will download linux_arm Terraform binaries.');
    console.log('Some older Terraform versions may not have ARM32 builds.');
  }
}

/**
 * Install tfenv on Amazon Linux using git clone.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - sudo privileges (typically ec2-user on EC2 instances)
 * - git, curl, and unzip installed
 *
 * This is a common setup for managing Terraform versions on AWS EC2 instances.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if tfenv is already installed...');

  // Check if tfenv is already installed
  if (isTfenvInstalled()) {
    const version = await getTfenvVersion();
    console.log(`tfenv ${version || 'unknown version'} is already installed, skipping...`);
    console.log('');
    console.log('To use tfenv, open a new terminal or run: source ~/.bashrc');
    return;
  }

  // Install dependencies
  await installAmazonLinuxDependencies();

  // Clone the tfenv repository
  const cloneSuccess = await cloneTfenvRepository();
  if (!cloneSuccess) {
    return;
  }

  // Add tfenv to PATH in shell config
  const configFile = getShellConfigFile();
  if (!hasTfenvConfig(configFile)) {
    console.log(`Adding tfenv to PATH in ${configFile}...`);
    addTfenvToPath(configFile);
  }

  const version = await getTfenvVersion();

  console.log('');
  console.log(`tfenv ${version || ''} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Open a new terminal, OR run: source ~/.bashrc');
  console.log('  2. Verify tfenv is working: tfenv --version');
  console.log('  3. Install Terraform: tfenv install latest');
  console.log('  4. Use Terraform: tfenv use latest');
  console.log('  5. Verify Terraform: terraform --version');
  console.log('');
  console.log('EC2 Note:');
  console.log('  tfenv is user-specific. If creating an AMI, the tfenv installation');
  console.log('  will persist, but users must source ~/.bashrc or open a new shell.');
}

/**
 * Install tfenv on Windows.
 *
 * tfenv does not run natively on Windows (PowerShell or Command Prompt).
 * Windows support is experimental and has known symlink issues.
 *
 * For Windows users, the recommended approach is to use WSL with Ubuntu
 * and install tfenv there, or use Chocolatey to install Terraform directly:
 *   choco install terraform --version=X.Y.Z -y
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('tfenv is not available for Windows.');
  return;
}

/**
 * Install tfenv on Git Bash (Windows).
 *
 * tfenv on Windows Git Bash is experimental and has known symlink issues.
 * The tfenv maintainers note that Windows (64-bit) is "only tested in git-bash
 * and is currently presumed failing due to symlink issues."
 *
 * For reliable Terraform version management on Windows, consider:
 * - Using WSL with Ubuntu where tfenv works reliably
 * - Using Chocolatey to install Terraform directly:
 *   choco install terraform --version=X.Y.Z -y
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('tfenv is not available for Git Bash.');
  return;
}

/**
 * Check if tfenv is installed on the current platform.
 *
 * @returns {Promise<boolean>} True if installed, false otherwise
 */
async function isInstalled() {
  return isTfenvInstalled();
}

/**
 * Check if this installer is supported on the current platform.
 *
 * tfenv is supported on POSIX-compliant systems:
 * - macOS (via Homebrew)
 * - Ubuntu/Debian (via git clone)
 * - Raspberry Pi OS (via git clone)
 * - Amazon Linux/RHEL/Fedora (via git clone)
 * - WSL (via git clone)
 *
 * tfenv is NOT supported on:
 * - Windows (native) - experimental with known issues
 * - Git Bash - experimental with known symlink issues
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  // Supported platforms (POSIX-compliant systems)
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function.
 *
 * Supported platforms:
 * - macOS: tfenv via Homebrew
 * - Ubuntu/Debian: tfenv via git clone to ~/.tfenv
 * - Ubuntu on WSL: tfenv via git clone to ~/.tfenv
 * - Raspberry Pi OS: tfenv via git clone to ~/.tfenv
 * - Amazon Linux/RHEL/Fedora: tfenv via git clone to ~/.tfenv
 *
 * Unsupported platforms (graceful message):
 * - Windows (native): experimental, marked as not available
 * - Git Bash: experimental, marked as not available
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their corresponding installer functions
  // Multiple platform types can map to the same installer
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
    console.log(`tfenv is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
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
};

// Allow direct execution: node tfenv.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
