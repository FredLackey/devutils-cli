#!/usr/bin/env node

/**
 * @fileoverview Install Vim - a highly configurable, open-source text editor.
 *
 * Vim (Vi IMproved) is a highly configurable, open-source text editor built
 * to make creating and changing any kind of text very efficient. Originally
 * released by Bram Moolenaar in 1991 as an improved version of the classic
 * Unix Vi editor, Vim has become one of the most popular text editors among
 * developers and system administrators.
 *
 * Vim provides:
 * - Modal editing with distinct modes for inserting text and executing commands
 * - Extensive customization through configuration files and plugins
 * - Powerful search and replace with regular expression support
 * - Multi-window and multi-buffer editing
 * - Built-in scripting language (Vimscript) and support for external languages
 * - Cross-platform availability on virtually every operating system
 *
 * @module installs/vim
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');
const windowsShell = require('../utils/windows/shell');

/**
 * Install Vim on macOS using Homebrew.
 *
 * macOS includes a pre-installed version of Vim (accessible as `vi` or `vim`),
 * but it is typically an older version with limited features. The Homebrew
 * version provides the latest release with full feature support including
 * Python, Lua, and Ruby integration.
 *
 * After installation, the Homebrew version will be available at:
 * - Apple Silicon Macs: /opt/homebrew/bin/vim
 * - Intel Macs: /usr/local/bin/vim
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

  // Check if Vim is already installed via Homebrew
  // Note: We check the Homebrew formula because macOS has a system Vim
  // that will always exist at /usr/bin/vim
  const isBrewVimInstalled = await brew.isFormulaInstalled('vim');
  if (isBrewVimInstalled) {
    console.log('Vim is already installed via Homebrew, skipping...');
    return;
  }

  // Install Vim using Homebrew
  // The --quiet flag is added by brew.install() for cleaner output
  console.log('Installing Vim via Homebrew...');
  const result = await brew.install('vim');

  if (!result.success) {
    console.log('Failed to install Vim via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the formula is now installed
  const verified = await brew.isFormulaInstalled('vim');
  if (!verified) {
    console.log('Installation may have failed: Vim formula not found after install.');
    return;
  }

  console.log('Vim installed successfully via Homebrew.');
  console.log('');
  console.log('Note: To use the Homebrew version instead of the system version,');
  console.log('ensure /opt/homebrew/bin (Apple Silicon) or /usr/local/bin (Intel)');
  console.log('appears before /usr/bin in your PATH.');
}

/**
 * Install Vim on Ubuntu/Debian using APT.
 *
 * Ubuntu and Debian include Vim in their default repositories. This function
 * installs the standard Vim package which provides the full feature set for
 * most use cases. For additional features like Python support, users can
 * manually install vim-nox after this installation.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if Vim is already installed by looking for the command
  // Note: Some minimal installations may have vim-tiny (accessible as vi)
  // but we want the full vim package
  const isInstalled = shell.commandExists('vim');
  if (isInstalled) {
    console.log('Vim is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest version
  // from the repositories
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install Vim using APT
  // The DEBIAN_FRONTEND=noninteractive is handled by the apt utility
  console.log('Installing Vim via APT...');
  const result = await apt.install('vim');

  if (!result.success) {
    console.log('Failed to install Vim via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('vim');
  if (!verified) {
    console.log('Installation may have failed: vim command not found after install.');
    return;
  }

  console.log('Vim installed successfully.');
}

/**
 * Install Vim on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL provides a full Ubuntu environment within Windows, so Vim installation
 * follows the same APT-based process as native Ubuntu. The Vim installed within
 * WSL is separate from any Vim installation on the Windows host.
 *
 * Note: It is common to have different Vim configurations in WSL and Windows,
 * as they are independent installations for their respective environments.
 * Use ~/.vimrc in WSL and ~/_vimrc in Windows.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();
}

/**
 * Install Vim on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so Vim installation follows the same
 * APT-based process as Ubuntu/Debian. Vim is available in the default
 * repositories and works on both 32-bit (armhf) and 64-bit (arm64) ARM
 * architectures.
 *
 * Note: Vim is not installed by default on Raspberry Pi OS and must be
 * installed manually. The installation requires approximately 30MB of
 * storage space.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install Vim on Amazon Linux using DNF or YUM.
 *
 * Amazon Linux 2023 uses DNF as the default package manager, while Amazon
 * Linux 2 uses YUM. This function automatically detects which package manager
 * is available and uses it accordingly.
 *
 * Important: The default vim-minimal package provides only basic functionality
 * in /bin/vi. This function installs vim-enhanced for the complete Vim
 * experience with Python, Perl, and other scripting language support.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if Vim (full version) is already installed by looking for the command
  // Note: Amazon Linux often has vim-minimal pre-installed which only provides vi
  const isInstalled = shell.commandExists('vim');
  if (isInstalled) {
    console.log('Vim is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Construct the install command based on available package manager
  // We install vim-enhanced for the full-featured version (not vim-minimal)
  const installCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y vim-enhanced'
    : 'sudo yum install -y vim-enhanced';

  // Install Vim
  console.log(`Installing Vim (vim-enhanced) via ${packageManager}...`);
  const result = await shell.exec(installCommand);

  if (result.code !== 0) {
    console.log(`Failed to install Vim via ${packageManager}.`);
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('vim');
  if (!verified) {
    console.log('Installation may have failed: vim command not found after install.');
    return;
  }

  console.log('Vim installed successfully.');
}

/**
 * Install Vim on Windows using Chocolatey.
 *
 * This installs Vim for Windows, which includes:
 * - vim.exe - Terminal-based Vim editor
 * - gvim.exe - Graphical Vim application (GVim)
 * - Context menu integration - "Edit with Vim" option in Windows Explorer
 * - Batch files - vim.bat, gvim.bat, view.bat, and related commands in PATH
 *
 * After installation, a new terminal window must be opened for the PATH
 * changes to take effect. Vim will be available at:
 * C:\tools\vim\vim91\vim.exe (version number may vary)
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

  // Check if Vim is already installed via Chocolatey
  const isChocoVimInstalled = await choco.isPackageInstalled('vim');
  if (isChocoVimInstalled) {
    console.log('Vim is already installed via Chocolatey, skipping...');
    return;
  }

  // Install Vim using Chocolatey
  // The -y flag automatically confirms all prompts for non-interactive installation
  console.log('Installing Vim via Chocolatey...');
  const result = await choco.install('vim');

  if (!result.success) {
    console.log('Failed to install Vim via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled('vim');
  if (!verified) {
    console.log('Installation may have failed: Vim package not found after install.');
    return;
  }

  console.log('Vim installed successfully via Chocolatey.');
  console.log('');
  console.log('Note: Close and reopen your terminal for PATH changes to take effect.');
  console.log('GVim (graphical version) is also available from the Start Menu.');
}

/**
 * Install Vim on Git Bash (Windows).
 *
 * Git Bash inherits the Windows PATH, so once Vim is installed on Windows
 * via Chocolatey, the vim and gvim commands are available in Git Bash.
 * This function installs Vim on Windows using PowerShell, which makes it
 * available in Git Bash as well.
 *
 * Note: Git for Windows includes a minimal version of Vim, but for full
 * functionality with all features enabled, we install Vim separately via
 * Chocolatey.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if Vim (full version from Chocolatey) is already available
  // Git Bash may have a minimal vim from Git for Windows, but we want
  // the full Chocolatey version
  const isInstalled = shell.commandExists('vim');
  if (isInstalled) {
    // Check if it's the Chocolatey version by looking for the typical path
    const vimPath = shell.which('vim');
    if (vimPath && vimPath.toLowerCase().includes('tools\\vim')) {
      console.log('Vim is already installed via Chocolatey, skipping...');
      return;
    }
    // Otherwise, we have the minimal Git Bash vim - continue to install full version
  }

  // Install Vim on Windows via PowerShell which uses Chocolatey
  // This makes Vim available in Git Bash through the Windows PATH
  console.log('Installing Vim via Chocolatey (using PowerShell)...');
  console.log('This will make Vim available in Git Bash.');

  // Execute the Chocolatey install command via PowerShell
  const result = await windowsShell.execPowerShell('choco install vim -y');

  if (!result.success) {
    console.log('Failed to install Vim via Chocolatey.');
    console.log(result.stderr || result.stdout);
    return;
  }

  console.log('Vim installed successfully via Chocolatey.');
  console.log('');
  console.log('Note: Close and reopen Git Bash for PATH changes to take effect.');
  console.log('You may need to add Vim to your PATH in ~/.bashrc:');
  console.log('  export PATH="$PATH:/c/tools/vim/vim91"');
}

/**
 * Check if Vim is installed on the current system.
 * @returns {Promise<boolean>} True if Vim is installed
 */
async function isInstalled() {
  const platform = os.detect();
  if (platform.type === 'macos') {
    return brew.isFormulaInstalled('vim');
  }
  if (platform.type === 'windows') {
    return choco.isPackageInstalled('vim');
  }
  return shell.commandExists('vim');
}

/**
 * Check if this installer is supported on the current platform.
 * Vim is supported on all major platforms.
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
 * appropriate platform-specific installer function. Vim is supported on all
 * major platforms:
 *
 * - macOS (Homebrew)
 * - Ubuntu/Debian (APT)
 * - Ubuntu on WSL (APT)
 * - Raspberry Pi OS (APT)
 * - Amazon Linux/RHEL/Fedora (DNF/YUM)
 * - Windows (Chocolatey)
 * - Git Bash (via Windows Chocolatey installation)
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
  // Note: Vim is available on virtually all platforms, so this is unlikely
  if (!installer) {
    console.log(`Vim is not available for ${platform.type}.`);
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
