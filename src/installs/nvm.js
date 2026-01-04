#!/usr/bin/env node

/**
 * @fileoverview Install NVM (Node Version Manager).
 * @module installs/nvm
 *
 * NVM (Node Version Manager) is a version manager for Node.js, designed to be
 * installed per-user and invoked per-shell. NVM allows developers to quickly
 * install and switch between multiple versions of Node.js on the same machine,
 * making it essential for projects requiring different Node.js versions.
 *
 * IMPORTANT PLATFORM DISTINCTION:
 * - Unix/Linux/macOS/WSL: Uses nvm-sh/nvm (shell-based, installed per-user)
 * - Windows (native): Uses nvm-windows (coreybutler/nvm-windows), a completely
 *   separate project with similar functionality but different implementation
 *
 * This installer provides:
 * - macOS: NVM via Homebrew with shell configuration
 * - Ubuntu/Debian: NVM via official install script from nvm-sh/nvm
 * - Raspberry Pi OS: NVM via official install script (ARM compatible)
 * - Amazon Linux: NVM via official install script
 * - Windows: nvm-windows via Chocolatey or winget
 * - WSL (Ubuntu): NVM via official install script
 * - Git Bash: nvm-windows installed on Windows host via Chocolatey
 *
 * POST-INSTALLATION NOTES:
 * - Unix-like systems require sourcing the shell configuration or opening a new terminal
 * - NVM is installed per-user and does not require sudo/admin for Node.js management
 * - Windows users must run nvm install/use commands as Administrator for symlink creation
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const choco = require('../utils/windows/choco');
const winget = require('../utils/windows/winget');
const fs = require('fs');
const path = require('path');

/**
 * The current stable version of NVM (nvm-sh/nvm) to install on Unix-like systems.
 * This should be updated periodically as new versions are released.
 * Check https://github.com/nvm-sh/nvm/releases for the latest version.
 */
const NVM_VERSION = '0.40.3';

/**
 * The URL for the official NVM install script.
 * This script clones the NVM repository and configures shell initialization.
 */
const NVM_INSTALL_SCRIPT_URL = `https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh`;

/**
 * The Homebrew formula name for NVM on macOS.
 */
const HOMEBREW_FORMULA_NAME = 'nvm';

/**
 * The Chocolatey package name for nvm-windows.
 * Note: The package is named 'nvm' but installs nvm-windows (coreybutler/nvm-windows).
 */
const CHOCO_PACKAGE_NAME = 'nvm';

/**
 * The winget package ID for nvm-windows.
 */
const WINGET_PACKAGE_ID = 'CoreyButler.NVMforWindows';

/**
 * Check if NVM (nvm-sh/nvm) is installed on Unix-like systems.
 *
 * NVM is a shell function, not a standalone executable, so we cannot use
 * shell.commandExists(). Instead, we check for the presence of the NVM
 * directory and the nvm.sh script.
 *
 * @returns {boolean} True if NVM appears to be installed, false otherwise
 */
function isNvmShInstalled() {
  const homeDir = os.getHomeDir();
  const nvmDir = process.env.NVM_DIR || path.join(homeDir, '.nvm');
  const nvmScript = path.join(nvmDir, 'nvm.sh');

  return fs.existsSync(nvmScript);
}

/**
 * Check if nvm-windows is installed on Windows systems.
 *
 * nvm-windows installs an actual executable, so we can check for its presence
 * in the PATH using shell.commandExists().
 *
 * @returns {boolean} True if nvm-windows is installed, false otherwise
 */
function isNvmWindowsInstalled() {
  return shell.commandExists('nvm');
}

/**
 * Get the installed NVM version on Unix-like systems.
 *
 * Since NVM is a shell function, we need to source it first before running
 * the version command. This function sources the nvm.sh script and then
 * runs 'nvm --version'.
 *
 * @returns {Promise<string|null>} NVM version string, or null if not installed
 */
async function getNvmShVersion() {
  if (!isNvmShInstalled()) {
    return null;
  }

  const homeDir = os.getHomeDir();
  const nvmDir = process.env.NVM_DIR || path.join(homeDir, '.nvm');

  // Source NVM and get the version in a subshell
  const result = await shell.exec(
    `bash -c 'export NVM_DIR="${nvmDir}" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm --version'`
  );

  if (result.code === 0 && result.stdout) {
    return result.stdout.trim();
  }
  return null;
}

/**
 * Get the installed nvm-windows version.
 *
 * nvm-windows uses 'nvm version' (not '--version') to display its version.
 *
 * @returns {Promise<string|null>} nvm-windows version string, or null if not installed
 */
async function getNvmWindowsVersion() {
  if (!isNvmWindowsInstalled()) {
    return null;
  }

  const result = await shell.exec('nvm version');
  if (result.code === 0 && result.stdout) {
    return result.stdout.trim();
  }
  return null;
}

/**
 * Detect the user's default shell on Unix-like systems.
 *
 * This is used to determine which shell configuration file to update
 * after NVM installation.
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
 * Check if NVM configuration already exists in a shell config file.
 *
 * Searches for the NVM_DIR export line to determine if NVM has already
 * been configured in the given file.
 *
 * @param {string} filePath - Path to the shell configuration file
 * @returns {boolean} True if NVM configuration is present, false otherwise
 */
function hasNvmConfig(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('NVM_DIR');
  } catch (err) {
    return false;
  }
}

/**
 * Install NVM on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - zsh shell (default on macOS 10.15+) or bash
 *
 * This function:
 * 1. Installs NVM via Homebrew
 * 2. Creates the ~/.nvm directory
 * 3. Adds NVM configuration to the shell profile (if not present)
 *
 * IMPORTANT: After installation, the user must:
 * - Open a new terminal or run 'source ~/.zshrc' (or ~/.bashrc)
 * - The first time NVM is used, it will initialize from Homebrew's installation
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if NVM is already installed...');

  // Check if NVM is already installed via Homebrew formula
  const isBrewNvmInstalled = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (isBrewNvmInstalled) {
    const version = await getNvmShVersion();
    console.log(`NVM ${version || 'unknown version'} is already installed via Homebrew, skipping...`);
    console.log('');
    console.log('To use NVM, open a new terminal or run: source ~/.zshrc');
    return;
  }

  // Also check if NVM is installed via other means (e.g., direct install script)
  if (isNvmShInstalled()) {
    const version = await getNvmShVersion();
    console.log(`NVM ${version || 'unknown version'} is already installed, skipping...`);
    console.log('');
    console.log('Note: NVM was not installed via Homebrew.');
    console.log('If you want to manage it with Homebrew, first uninstall the existing NVM.');
    return;
  }

  // Verify Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Install NVM using Homebrew
  console.log('Installing NVM via Homebrew...');
  const result = await brew.install(HOMEBREW_FORMULA_NAME);

  if (!result.success) {
    console.log('Failed to install NVM via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded
  const verified = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (!verified) {
    console.log('Installation may have failed: NVM formula not found after install.');
    return;
  }

  // Create the NVM directory if it doesn't exist
  const homeDir = os.getHomeDir();
  const nvmDir = path.join(homeDir, '.nvm');
  if (!fs.existsSync(nvmDir)) {
    console.log('Creating NVM directory at ~/.nvm...');
    try {
      fs.mkdirSync(nvmDir, { recursive: true });
    } catch (err) {
      console.log(`Warning: Could not create NVM directory: ${err.message}`);
    }
  }

  // Add NVM configuration to shell config file if not present
  const configFile = getShellConfigFile();
  if (!hasNvmConfig(configFile)) {
    console.log(`Adding NVM configuration to ${configFile}...`);

    // Determine the Homebrew prefix (different for Apple Silicon vs Intel)
    const prefixResult = await shell.exec('brew --prefix');
    const brewPrefix = prefixResult.code === 0 ? prefixResult.stdout.trim() : '/opt/homebrew';

    // NVM configuration block for Homebrew installation
    const nvmConfig = `
# NVM Configuration (installed via Homebrew)
export NVM_DIR="$HOME/.nvm"
[ -s "${brewPrefix}/opt/nvm/nvm.sh" ] && \\. "${brewPrefix}/opt/nvm/nvm.sh"  # This loads nvm
[ -s "${brewPrefix}/opt/nvm/etc/bash_completion.d/nvm" ] && \\. "${brewPrefix}/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion
`;

    try {
      fs.appendFileSync(configFile, nvmConfig);
      console.log('NVM configuration added successfully.');
    } catch (err) {
      console.log(`Warning: Could not update ${configFile}: ${err.message}`);
      console.log('');
      console.log('Please manually add the following to your shell configuration:');
      console.log(nvmConfig);
    }
  } else {
    console.log('NVM configuration already exists in shell config file.');
  }

  console.log('');
  console.log('NVM installed successfully via Homebrew.');
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Open a new terminal, OR run: source ~/.zshrc (or ~/.bashrc)');
  console.log('  2. Verify NVM is working: nvm --version');
  console.log('  3. Install Node.js: nvm install --lts');
  console.log('  4. Verify Node.js: node --version');
}

/**
 * Install NVM on Ubuntu/Debian using the official install script.
 *
 * Prerequisites:
 * - Ubuntu 20.04 or later, or Debian 10 or later
 * - sudo privileges (for installing curl if not present)
 * - curl or wget installed (script will install curl if missing)
 *
 * This function uses the official NVM install script from the nvm-sh/nvm
 * repository. The script:
 * 1. Clones the NVM repository to ~/.nvm
 * 2. Adds NVM initialization to the shell profile
 *
 * IMPORTANT: NVM should NOT be installed with sudo. The ~/.nvm directory
 * must be owned by the regular user.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if NVM is already installed...');

  // Check if NVM is already installed
  if (isNvmShInstalled()) {
    const version = await getNvmShVersion();
    console.log(`NVM ${version || 'unknown version'} is already installed, skipping...`);
    console.log('');
    console.log('To use NVM, open a new terminal or run: source ~/.bashrc');
    return;
  }

  // Ensure curl is installed (required for the install script)
  console.log('Ensuring curl is installed...');
  const curlExists = shell.commandExists('curl');
  if (!curlExists) {
    console.log('Installing curl...');
    const curlResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl'
    );
    if (curlResult.code !== 0) {
      console.log('Failed to install curl.');
      console.log(curlResult.stderr || curlResult.stdout);
      return;
    }
  }

  // Download and run the official NVM install script
  console.log(`Installing NVM v${NVM_VERSION} via official install script...`);
  console.log('');

  const installResult = await shell.exec(
    `curl -o- ${NVM_INSTALL_SCRIPT_URL} | bash`
  );

  // The install script may have a non-zero exit code but still succeed
  // Check if the NVM directory was created
  if (!isNvmShInstalled()) {
    console.log('NVM installation may have failed.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Check your internet connection');
    console.log('  2. Ensure you are not running this script with sudo');
    console.log('  3. Try running the install command manually:');
    console.log(`     curl -o- ${NVM_INSTALL_SCRIPT_URL} | bash`);
    return;
  }

  // Verify NVM configuration was added to shell config
  const configFile = getShellConfigFile();
  if (!hasNvmConfig(configFile)) {
    console.log(`Warning: NVM configuration not found in ${configFile}.`);
    console.log('Manually adding NVM configuration...');

    const nvmConfig = `
# NVM Configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
`;

    try {
      fs.appendFileSync(configFile, nvmConfig);
      console.log('NVM configuration added successfully.');
    } catch (err) {
      console.log(`Warning: Could not update ${configFile}: ${err.message}`);
    }
  }

  // Get the installed version
  const version = await getNvmShVersion();

  console.log('');
  console.log(`NVM ${version || NVM_VERSION} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Open a new terminal, OR run: source ~/.bashrc');
  console.log('  2. Verify NVM is working: nvm --version');
  console.log('  3. Install Node.js: nvm install --lts');
  console.log('  4. Verify Node.js: node --version');
}

/**
 * Install NVM on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 *
 * WSL runs a full Linux environment, so NVM installation follows the same
 * process as native Ubuntu using the official install script.
 *
 * NOTE: NVM installed in WSL is separate from nvm-windows on the Windows host.
 * If you need Node.js in both environments, install NVM/nvm-windows separately
 * in each.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Check if NVM is already installed
  if (isNvmShInstalled()) {
    const version = await getNvmShVersion();
    console.log(`NVM ${version || 'unknown version'} is already installed in WSL, skipping...`);
    console.log('');
    console.log('To use NVM, open a new terminal or run: source ~/.bashrc');
    return;
  }

  // Ensure curl is installed
  console.log('Ensuring curl is installed...');
  const curlExists = shell.commandExists('curl');
  if (!curlExists) {
    console.log('Installing curl...');
    const curlResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl'
    );
    if (curlResult.code !== 0) {
      console.log('Failed to install curl.');
      console.log(curlResult.stderr || curlResult.stdout);
      return;
    }
  }

  // Download and run the official NVM install script
  console.log(`Installing NVM v${NVM_VERSION} via official install script...`);
  console.log('');

  const installResult = await shell.exec(
    `curl -o- ${NVM_INSTALL_SCRIPT_URL} | bash`
  );

  // Check if installation succeeded
  if (!isNvmShInstalled()) {
    console.log('NVM installation may have failed.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify NVM configuration was added
  const configFile = getShellConfigFile();
  if (!hasNvmConfig(configFile)) {
    const nvmConfig = `
# NVM Configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
`;

    try {
      fs.appendFileSync(configFile, nvmConfig);
    } catch (err) {
      console.log(`Warning: Could not update ${configFile}: ${err.message}`);
    }
  }

  const version = await getNvmShVersion();

  console.log('');
  console.log(`NVM ${version || NVM_VERSION} installed successfully in WSL.`);
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Open a new terminal, OR run: source ~/.bashrc');
  console.log('  2. Verify NVM is working: nvm --version');
  console.log('  3. Install Node.js: nvm install --lts');
  console.log('  4. Verify Node.js: node --version');
  console.log('');
  console.log('WSL Note:');
  console.log('  NVM in WSL is separate from nvm-windows on the Windows host.');
  console.log('  If you need Node.js in Windows terminals, install nvm-windows separately.');
}

/**
 * Install NVM on Raspberry Pi OS using the official install script.
 *
 * Prerequisites:
 * - Raspberry Pi OS (Bookworm, Bullseye, or Buster) - 64-bit or 32-bit
 * - Raspberry Pi 2 or later (Pi Zero/1 have limited Node.js support)
 * - sudo privileges
 * - curl installed
 *
 * NVM works on all ARM architectures supported by Raspberry Pi. However,
 * Node.js availability varies by architecture:
 * - aarch64 (64-bit): Full support for all Node.js versions
 * - armv7l (32-bit): Full support for all Node.js versions
 * - armv6l (Pi Zero/1): Limited support (requires unofficial builds for recent versions)
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if NVM is already installed...');

  // Check if NVM is already installed
  if (isNvmShInstalled()) {
    const version = await getNvmShVersion();
    console.log(`NVM ${version || 'unknown version'} is already installed, skipping...`);
    console.log('');
    console.log('To use NVM, open a new terminal or run: source ~/.bashrc');
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
    console.log('NVM will install successfully, but Node.js 22+ does not provide');
    console.log('official ARMv6 builds. After installing NVM, use:');
    console.log('  NVM_NODEJS_ORG_MIRROR=https://unofficial-builds.nodejs.org/download/release nvm install 20');
    console.log('');
  }

  // Ensure curl is installed
  console.log('Ensuring curl is installed...');
  const curlExists = shell.commandExists('curl');
  if (!curlExists) {
    console.log('Installing curl...');
    const curlResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl'
    );
    if (curlResult.code !== 0) {
      console.log('Failed to install curl.');
      console.log(curlResult.stderr || curlResult.stdout);
      return;
    }
  }

  // Download and run the official NVM install script
  console.log(`Installing NVM v${NVM_VERSION} via official install script...`);
  console.log('');

  const installResult = await shell.exec(
    `curl -o- ${NVM_INSTALL_SCRIPT_URL} | bash`
  );

  // Check if installation succeeded
  if (!isNvmShInstalled()) {
    console.log('NVM installation may have failed.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify NVM configuration was added
  const configFile = getShellConfigFile();
  if (!hasNvmConfig(configFile)) {
    const nvmConfig = `
# NVM Configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
`;

    try {
      fs.appendFileSync(configFile, nvmConfig);
    } catch (err) {
      console.log(`Warning: Could not update ${configFile}: ${err.message}`);
    }
  }

  const version = await getNvmShVersion();

  console.log('');
  console.log(`NVM ${version || NVM_VERSION} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Open a new terminal, OR run: source ~/.bashrc');
  console.log('  2. Verify NVM is working: nvm --version');
  console.log('  3. Install Node.js: nvm install --lts');
  console.log('  4. Verify Node.js: node --version');

  // Extra guidance for armv6l
  if (arch === 'armv6l') {
    console.log('');
    console.log('ARMv6 Note: For Node.js 20+ on Pi Zero/1, use unofficial builds:');
    console.log('  NVM_NODEJS_ORG_MIRROR=https://unofficial-builds.nodejs.org/download/release nvm install 20');
  }
}

/**
 * Install NVM on Amazon Linux using the official install script.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - sudo privileges (for installing curl if not present)
 * - curl installed (will be installed if missing)
 *
 * This is the AWS-recommended method for managing Node.js versions on EC2 instances.
 * The installation uses the official NVM install script from nvm-sh/nvm.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if NVM is already installed...');

  // Check if NVM is already installed
  if (isNvmShInstalled()) {
    const version = await getNvmShVersion();
    console.log(`NVM ${version || 'unknown version'} is already installed, skipping...`);
    console.log('');
    console.log('To use NVM, open a new terminal or run: source ~/.bashrc');
    return;
  }

  // Detect package manager (dnf for AL2023, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const packageManager = hasDnf ? 'dnf' : 'yum';

  // Ensure curl is installed
  console.log('Ensuring curl is installed...');
  const curlExists = shell.commandExists('curl');
  if (!curlExists) {
    console.log('Installing curl...');
    const curlResult = await shell.exec(`sudo ${packageManager} install -y curl`);
    if (curlResult.code !== 0) {
      console.log('Failed to install curl.');
      console.log(curlResult.stderr || curlResult.stdout);
      return;
    }
  }

  // Download and run the official NVM install script
  console.log(`Installing NVM v${NVM_VERSION} via official install script...`);
  console.log('');

  const installResult = await shell.exec(
    `curl -o- ${NVM_INSTALL_SCRIPT_URL} | bash`
  );

  // Check if installation succeeded
  if (!isNvmShInstalled()) {
    console.log('NVM installation may have failed.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify NVM configuration was added
  const configFile = getShellConfigFile();
  if (!hasNvmConfig(configFile)) {
    const nvmConfig = `
# NVM Configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
`;

    try {
      fs.appendFileSync(configFile, nvmConfig);
    } catch (err) {
      console.log(`Warning: Could not update ${configFile}: ${err.message}`);
    }
  }

  const version = await getNvmShVersion();

  console.log('');
  console.log(`NVM ${version || NVM_VERSION} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Open a new terminal, OR run: source ~/.bashrc');
  console.log('  2. Verify NVM is working: nvm --version');
  console.log('  3. Install Node.js: nvm install --lts');
  console.log('  4. Verify Node.js: node --version');
  console.log('');
  console.log('EC2 Note:');
  console.log('  NVM is user-specific. If creating an AMI, the NVM installation');
  console.log('  will persist, but users must source ~/.bashrc or open a new shell.');
}

/**
 * Install nvm-windows on Windows using Chocolatey or winget.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later, or Windows 11
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey or winget package manager installed
 * - No existing Node.js installation (critical for proper symlink operation)
 *
 * IMPORTANT: nvm-windows is a completely different project from nvm-sh/nvm.
 * It provides similar functionality but uses Windows symlinks to manage
 * Node.js versions. Running 'nvm install' and 'nvm use' requires Administrator
 * privileges due to symlink creation.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if nvm-windows is already installed...');

  // Check if nvm-windows is already installed
  if (isNvmWindowsInstalled()) {
    const version = await getNvmWindowsVersion();
    console.log(`nvm-windows ${version || 'unknown version'} is already installed, skipping...`);
    console.log('');
    console.log('NOTE: Close and reopen your terminal to ensure nvm is available.');
    return;
  }

  // Try Chocolatey first, then winget
  const hasChoco = choco.isInstalled();
  const hasWinget = winget.isInstalled();

  if (!hasChoco && !hasWinget) {
    console.log('Neither Chocolatey nor winget is available.');
    console.log('');
    console.log('Please install one of the following package managers:');
    console.log('');
    console.log('  Option 1: Chocolatey (run in Administrator PowerShell):');
    console.log("    Set-ExecutionPolicy Bypass -Scope Process -Force; " +
      "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; " +
      "iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))");
    console.log('');
    console.log('  Option 2: winget (included with Windows 10/11, App Installer from Microsoft Store)');
    return;
  }

  // Prefer Chocolatey if available (more reliable for this package)
  if (hasChoco) {
    console.log('Installing nvm-windows via Chocolatey...');
    console.log('');

    // Check if already installed via Chocolatey
    const isChocoInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
    if (isChocoInstalled) {
      console.log('nvm-windows is already installed via Chocolatey.');
      console.log('');
      console.log('NOTE: Close and reopen your terminal for PATH changes to take effect.');
      return;
    }

    const result = await choco.install(CHOCO_PACKAGE_NAME);

    if (!result.success) {
      console.log('Failed to install nvm-windows via Chocolatey.');
      console.log(result.output);
      console.log('');
      console.log('Troubleshooting:');
      console.log('  1. Ensure you are running as Administrator');
      console.log('  2. Try: choco install nvm -y --force');
      return;
    }
  } else {
    // Fall back to winget
    console.log('Installing nvm-windows via winget...');
    console.log('');

    // Check if already installed via winget
    const isWingetInstalled = await winget.isPackageInstalled(WINGET_PACKAGE_ID);
    if (isWingetInstalled) {
      console.log('nvm-windows is already installed via winget.');
      console.log('');
      console.log('NOTE: Close and reopen your terminal for PATH changes to take effect.');
      return;
    }

    const result = await winget.install(WINGET_PACKAGE_ID);

    if (!result.success) {
      console.log('Failed to install nvm-windows via winget.');
      console.log(result.output);
      console.log('');
      console.log('Troubleshooting:');
      console.log('  1. Ensure you are running as Administrator');
      console.log('  2. Try: winget install --id CoreyButler.NVMforWindows --silent --accept-package-agreements --accept-source-agreements');
      return;
    }
  }

  console.log('');
  console.log('nvm-windows installed successfully.');
  console.log('');
  console.log('IMPORTANT: Close and reopen your terminal for PATH changes to take effect.');
  console.log('');
  console.log('After reopening, verify with: nvm version');
  console.log('');
  console.log('To install Node.js (run as Administrator):');
  console.log('  nvm install lts');
  console.log('  nvm use lts');
  console.log('');
  console.log('NOTE: nvm install and nvm use require Administrator privileges');
  console.log('because nvm-windows creates symlinks.');
}

/**
 * Install nvm-windows from Git Bash on Windows.
 *
 * Git Bash runs within Windows and inherits the Windows PATH, so once
 * nvm-windows is installed, the 'nvm' and 'node' commands are automatically
 * available in Git Bash.
 *
 * This function installs nvm-windows on the Windows host using Chocolatey
 * via PowerShell interop.
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

  // Check if nvm-windows is already available
  if (isNvmWindowsInstalled()) {
    const version = await getNvmWindowsVersion();
    console.log(`nvm-windows ${version || 'unknown version'} is already installed, skipping...`);
    console.log('');
    console.log('NOTE: If nvm is not recognized, close and reopen Git Bash.');
    return;
  }

  // Install via PowerShell using Chocolatey
  console.log('Installing nvm-windows on the Windows host via Chocolatey...');
  console.log('');

  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install nvm -y"'
  );

  if (installResult.code !== 0) {
    console.log('Failed to install nvm-windows.');
    console.log(installResult.stdout || installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure Chocolatey is installed on Windows');
    console.log('  2. Run Git Bash as Administrator and retry');
    console.log('  3. Try installing directly from PowerShell:');
    console.log('     choco install nvm -y');
    return;
  }

  console.log('');
  console.log('nvm-windows installed successfully.');
  console.log('');
  console.log('IMPORTANT: Close and reopen Git Bash for PATH changes to take effect.');
  console.log('');
  console.log('After reopening, verify with: nvm version');
  console.log('');
  console.log('To install Node.js (run Git Bash as Administrator):');
  console.log('  nvm install lts');
  console.log('  nvm use lts');
  console.log('');
  console.log('Git Bash Note:');
  console.log('  Run Git Bash as Administrator for nvm install/use commands');
  console.log('  (right-click Git Bash shortcut -> Run as administrator)');
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. NVM is supported on all
 * major platforms with the following implementations:
 *
 * - macOS: nvm-sh/nvm via Homebrew
 * - Ubuntu/Debian: nvm-sh/nvm via official install script
 * - Ubuntu on WSL: nvm-sh/nvm via official install script
 * - Raspberry Pi OS: nvm-sh/nvm via official install script
 * - Amazon Linux/RHEL/Fedora: nvm-sh/nvm via official install script
 * - Windows: nvm-windows via Chocolatey or winget
 * - Git Bash: nvm-windows on Windows host via Chocolatey
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
    console.log(`NVM is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
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
  install_gitbash,
};

// Allow direct execution: node nvm.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
