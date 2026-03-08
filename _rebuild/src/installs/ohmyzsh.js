#!/usr/bin/env node

/**
 * @fileoverview Install Oh My Zsh - a framework for managing Zsh configuration.
 * @module installs/ohmyzsh
 *
 * Oh My Zsh is an open-source, community-driven framework for managing your Zsh
 * configuration. It comes bundled with thousands of helpful functions, plugins,
 * themes, and features that make working in the terminal more efficient and
 * enjoyable. With over 2,400 contributors and 300+ plugins, Oh My Zsh has become
 * the most popular Zsh configuration framework.
 *
 * Oh My Zsh provides:
 * - 300+ plugins for common tools (git, docker, npm, kubectl, aws, and many more)
 * - 140+ themes for customizing your terminal prompt appearance
 * - Auto-update mechanism to keep your installation current
 * - Plugin management for easy addition and removal of functionality
 * - Aliases and functions for common commands and workflows
 *
 * DEPENDENCY MANAGEMENT:
 * Prerequisites (zsh, curl, git) are declared in installers.json and installed
 * automatically by the `dev install` command's dependency resolution system
 * before this installer runs. This installer only handles Oh My Zsh itself.
 *
 * IMPORTANT PLATFORM NOTES:
 * - Git Bash and native Windows are NOT supported (use WSL instead)
 * - All Unix-like platforms use the same official install script from ohmyzsh/ohmyzsh
 *
 * POST-INSTALLATION NOTES:
 * - Users should open a new terminal or source ~/.zshrc after installation
 * - The installer backs up existing ~/.zshrc to ~/.zshrc.pre-oh-my-zsh
 * - Oh My Zsh is installed to ~/.oh-my-zsh directory
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const fs = require('fs');
const path = require('path');

/**
 * The URL for the official Oh My Zsh install script.
 * This script clones the Oh My Zsh repository and configures shell initialization.
 */
const OHMYZSH_INSTALL_SCRIPT_URL = 'https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh';

/**
 * Check if Oh My Zsh is installed by looking for the ~/.oh-my-zsh directory.
 *
 * Oh My Zsh installs to the user's home directory at ~/.oh-my-zsh. We check for
 * the presence of the oh-my-zsh.sh script within that directory to verify
 * the installation is complete and valid.
 *
 * @returns {boolean} True if Oh My Zsh appears to be installed, false otherwise
 */
function isOhMyZshInstalled() {
  const homeDir = os.getHomeDir();
  const ohmyzshDir = path.join(homeDir, '.oh-my-zsh');
  const ohmyzshScript = path.join(ohmyzshDir, 'oh-my-zsh.sh');

  return fs.existsSync(ohmyzshScript);
}

/**
 * Check if Zsh is installed on the current system.
 *
 * Zsh is a prerequisite for Oh My Zsh. This function checks if the zsh
 * command is available in the PATH.
 *
 * @returns {boolean} True if Zsh is installed, false otherwise
 */
function isZshInstalled() {
  return shell.commandExists('zsh');
}

/**
 * Get the path to the user's shell configuration file.
 *
 * Returns the path to .zshrc in the user's home directory. This file is
 * created or modified by the Oh My Zsh installer to load the framework.
 *
 * @returns {string} Path to the shell configuration file
 */
function getShellConfigFile() {
  const homeDir = os.getHomeDir();
  return path.join(homeDir, '.zshrc');
}

/**
 * Run the Oh My Zsh install script in unattended mode.
 *
 * The --unattended flag prevents the installer from:
 * - Changing your default shell automatically
 * - Launching Zsh after installation
 * - Requiring any interactive input
 *
 * This makes it suitable for use in automation scripts.
 *
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function runOhMyZshInstaller() {
  console.log('Installing Oh My Zsh via official install script...');
  console.log('');

  // Download and run the official install script with --unattended flag
  const installResult = await shell.exec(
    `sh -c "$(curl -fsSL ${OHMYZSH_INSTALL_SCRIPT_URL})" "" --unattended`
  );

  // The install script may output to stderr for informational messages
  // Check if the installation directory was created successfully
  if (!isOhMyZshInstalled()) {
    console.log('Oh My Zsh installation may have failed.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Check your internet connection');
    console.log('  2. Ensure curl and git are installed');
    console.log('  3. Try running the install command manually:');
    console.log(`     sh -c "$(curl -fsSL ${OHMYZSH_INSTALL_SCRIPT_URL})" "" --unattended`);
    return false;
  }

  return true;
}

/**
 * Display post-installation instructions to the user.
 *
 * @param {string} shellConfigFile - Path to the shell configuration file
 */
function displayPostInstallInstructions(shellConfigFile) {
  console.log('');
  console.log('Oh My Zsh installed successfully.');
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log(`  1. Open a new terminal, OR run: source ${shellConfigFile}`);
  console.log('  2. Verify Oh My Zsh is loaded: echo $ZSH');
  console.log('');
  console.log('To change your default shell to Zsh:');
  console.log('  chsh -s $(which zsh)');
  console.log('');
  console.log('To customize Oh My Zsh, edit ~/.zshrc:');
  console.log('  - Change theme: ZSH_THEME="robbyrussell"');
  console.log('  - Enable plugins: plugins=(git docker npm)');
}

/**
 * Check that all prerequisites are installed.
 *
 * Prerequisites (zsh, curl, git) should be installed automatically by the
 * dependency system in installers.json before this installer runs. This
 * function provides a safety check in case the installer is run directly.
 *
 * @returns {boolean} True if all prerequisites are available, false otherwise
 */
function checkPrerequisites() {
  // Check for Zsh (installed via dependency system)
  if (!isZshInstalled()) {
    console.log('Zsh is required but not installed.');
    console.log('Run: dev install zsh');
    return false;
  }

  // Check for curl (installed via dependency system)
  if (!shell.commandExists('curl')) {
    console.log('curl is required but not installed.');
    console.log('Run: dev install curl');
    return false;
  }

  // Check for git (installed via dependency system)
  if (!shell.commandExists('git')) {
    console.log('git is required but not installed.');
    console.log('Run: dev install git');
    return false;
  }

  return true;
}

/**
 * Install Oh My Zsh on macOS using the official install script.
 *
 * Prerequisites (handled by dependency system in installers.json):
 * - Zsh (pre-installed on macOS 10.15+, or via Homebrew)
 * - curl (pre-installed on macOS)
 * - git (via Xcode CLT or Homebrew)
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Oh My Zsh is already installed
  if (isOhMyZshInstalled()) {
    console.log('Oh My Zsh is already installed, skipping...');
    console.log('');
    console.log('To update Oh My Zsh, run: omz update');
    return;
  }

  // Verify prerequisites (should already be installed via dependency system)
  if (!checkPrerequisites()) {
    return;
  }

  // Run the Oh My Zsh installer
  const installSuccess = await runOhMyZshInstaller();
  if (!installSuccess) {
    return;
  }

  // Display post-installation instructions
  displayPostInstallInstructions('~/.zshrc');
}

/**
 * Install Oh My Zsh on Ubuntu/Debian using the official install script.
 *
 * Prerequisites (handled by dependency system in installers.json):
 * - Zsh (via APT)
 * - curl (via APT)
 * - git (via APT)
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if Oh My Zsh is already installed
  if (isOhMyZshInstalled()) {
    console.log('Oh My Zsh is already installed, skipping...');
    console.log('');
    console.log('To update Oh My Zsh, run: omz update');
    return;
  }

  // Verify prerequisites (should already be installed via dependency system)
  if (!checkPrerequisites()) {
    return;
  }

  // Run the Oh My Zsh installer
  const installSuccess = await runOhMyZshInstaller();
  if (!installSuccess) {
    return;
  }

  // Display post-installation instructions
  displayPostInstallInstructions('~/.zshrc');
}

/**
 * Install Oh My Zsh on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites (handled by dependency system in installers.json):
 * - Zsh (via APT)
 * - curl (via APT)
 * - git (via APT)
 *
 * NOTE: Oh My Zsh installed in WSL is separate from any Windows shell configuration.
 * This is the recommended way to use Oh My Zsh on Windows.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Check if Oh My Zsh is already installed
  if (isOhMyZshInstalled()) {
    console.log('Oh My Zsh is already installed in WSL, skipping...');
    console.log('');
    console.log('To update Oh My Zsh, run: omz update');
    return;
  }

  // Verify prerequisites (should already be installed via dependency system)
  if (!checkPrerequisites()) {
    return;
  }

  // Run the Oh My Zsh installer
  const installSuccess = await runOhMyZshInstaller();
  if (!installSuccess) {
    return;
  }

  // Display post-installation instructions with WSL-specific notes
  console.log('');
  console.log('Oh My Zsh installed successfully in WSL.');
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Close and reopen WSL, OR run: source ~/.zshrc');
  console.log('  2. Verify Oh My Zsh is loaded: echo $ZSH');
  console.log('');
  console.log('To change your default shell to Zsh in WSL:');
  console.log('  chsh -s $(which zsh)');
  console.log('');
  console.log('WSL Note:');
  console.log('  For proper font rendering of themes with special characters,');
  console.log('  install a Nerd Font on Windows and configure Windows Terminal');
  console.log('  to use it for your WSL profile.');
}

/**
 * Install Oh My Zsh on Raspberry Pi OS using the official install script.
 *
 * Prerequisites (handled by dependency system in installers.json):
 * - Zsh (via APT)
 * - curl (via APT)
 * - git (via APT)
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if Oh My Zsh is already installed
  if (isOhMyZshInstalled()) {
    console.log('Oh My Zsh is already installed, skipping...');
    console.log('');
    console.log('To update Oh My Zsh, run: omz update');
    return;
  }

  // Check and report architecture for informational purposes
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  console.log(`Detected architecture: ${arch}`);
  console.log('');

  // Verify prerequisites (should already be installed via dependency system)
  if (!checkPrerequisites()) {
    return;
  }

  // Run the Oh My Zsh installer
  const installSuccess = await runOhMyZshInstaller();
  if (!installSuccess) {
    return;
  }

  // Display post-installation instructions with Raspberry Pi-specific notes
  console.log('');
  console.log('Oh My Zsh installed successfully.');
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Open a new terminal, OR run: source ~/.zshrc');
  console.log('  2. Verify Oh My Zsh is loaded: echo $ZSH');
  console.log('');
  console.log('To change your default shell to Zsh:');
  console.log('  chsh -s $(which zsh)');
  console.log('');
  console.log('Raspberry Pi Note:');
  console.log('  Some complex themes may be slow on older Pi models.');
  console.log('  Consider using a lightweight theme like "robbyrussell" (default).');
}

/**
 * Install Oh My Zsh on Amazon Linux/RHEL/Fedora using the official install script.
 *
 * Prerequisites (handled by dependency system in installers.json):
 * - Zsh (via DNF/YUM)
 * - curl (via DNF/YUM)
 * - git (via DNF/YUM)
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if Oh My Zsh is already installed
  if (isOhMyZshInstalled()) {
    console.log('Oh My Zsh is already installed, skipping...');
    console.log('');
    console.log('To update Oh My Zsh, run: omz update');
    return;
  }

  // Verify prerequisites (should already be installed via dependency system)
  if (!checkPrerequisites()) {
    return;
  }

  // Run the Oh My Zsh installer
  const installSuccess = await runOhMyZshInstaller();
  if (!installSuccess) {
    return;
  }

  // Display post-installation instructions
  displayPostInstallInstructions('~/.zshrc');
}

/**
 * Handle Windows native installation (not supported).
 *
 * Oh My Zsh is a Zsh framework and Zsh is not available on native Windows.
 * Users should install Oh My Zsh within WSL (Windows Subsystem for Linux) instead.
 *
 * This function gracefully informs the user that the platform is not supported
 * without throwing an error or suggesting alternatives.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Oh My Zsh is not available for Windows.');
  return;
}

/**
 * Handle Git Bash installation (not supported).
 *
 * Git Bash uses a MinGW-based Bash shell and does not support Zsh.
 * Oh My Zsh is specifically designed for Zsh and cannot be installed on Git Bash.
 *
 * This function gracefully informs the user that the platform is not supported
 * without throwing an error or suggesting alternatives.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Oh My Zsh is not available for Git Bash.');
  return;
}

/**
 * Check if Oh My Zsh is installed on the current platform.
 *
 * On all Unix-like systems (macOS, Linux, WSL), checks for the presence of
 * the ~/.oh-my-zsh directory with the oh-my-zsh.sh script.
 *
 * On Windows native and Git Bash, returns false as these platforms are not supported.
 *
 * @returns {Promise<boolean>} True if installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  // Windows native and Git Bash do not support Oh My Zsh
  if (platform.type === 'windows' || platform.type === 'gitbash') {
    return false;
  }

  // All other platforms: check for Oh My Zsh installation
  return isOhMyZshInstalled();
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Oh My Zsh is supported on:
 * - macOS
 * - Ubuntu/Debian
 * - Ubuntu on WSL
 * - Raspberry Pi OS
 * - Amazon Linux/RHEL/Fedora
 *
 * Oh My Zsh is NOT supported on:
 * - Windows native (no Zsh available)
 * - Git Bash (uses Bash, not Zsh)
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. Prerequisites (zsh, curl, git)
 * are handled by the dependency system in installers.json.
 *
 * Supported platforms:
 * - macOS, Ubuntu/Debian, WSL, Raspberry Pi OS, Amazon Linux/RHEL/Fedora
 *
 * Not supported:
 * - Windows native, Git Bash (Zsh not available)
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
    console.log(`Oh My Zsh is not available for ${platform.type}.`);
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

// Allow direct execution: node ohmyzsh.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
