#!/usr/bin/env node

/**
 * @fileoverview Install Git - a distributed version control system.
 *
 * Git is a free and open-source distributed version control system designed
 * to handle everything from small to very large projects with speed and
 * efficiency. Originally created by Linus Torvalds in 2005 for Linux kernel
 * development, Git has become the most widely used version control system
 * in the world.
 *
 * Git enables developers to:
 * - Track changes in source code during software development
 * - Coordinate work among multiple developers
 * - Maintain a complete history of all changes
 * - Branch and merge code with minimal friction
 * - Work offline and sync changes when connected
 *
 * @module installs/git
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Install Git on macOS using Homebrew.
 *
 * macOS may include a pre-installed version of Git via Xcode Command Line Tools.
 * However, Homebrew typically provides a more recent version with the latest
 * features and security updates. This function installs Git via Homebrew for
 * a more up-to-date version.
 *
 * After installation, the Homebrew version will be available at:
 * - Apple Silicon Macs: /opt/homebrew/bin/git
 * - Intel Macs: /usr/local/bin/git
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

  // Check if Git is already installed via Homebrew
  // Note: We check the Homebrew formula because macOS may have a system Git
  // from Xcode Command Line Tools that would always exist at /usr/bin/git
  const isBrewGitInstalled = await brew.isFormulaInstalled('git');
  if (isBrewGitInstalled) {
    console.log('Git is already installed via Homebrew, skipping...');
    return;
  }

  // Install Git using Homebrew
  console.log('Installing Git via Homebrew...');
  const result = await brew.install('git');

  if (!result.success) {
    console.log('Failed to install Git via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the formula is now installed
  const verified = await brew.isFormulaInstalled('git');
  if (!verified) {
    console.log('Installation may have failed: Git formula not found after install.');
    return;
  }

  console.log('Git installed successfully via Homebrew.');
}

/**
 * Install Git on Ubuntu/Debian using APT.
 *
 * Git is available in the default Ubuntu and Debian repositories. This function
 * installs Git from the standard repositories, which provides a stable and
 * well-tested version suitable for most use cases.
 *
 * For users who require the absolute latest version, the Git Core PPA can be
 * added manually, but this is typically not necessary for standard development
 * workflows.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if Git is already installed by looking for the command
  const isInstalled = shell.commandExists('git');
  if (isInstalled) {
    console.log('Git is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest version
  // from the repositories
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install Git using APT
  console.log('Installing Git via APT...');
  const result = await apt.install('git');

  if (!result.success) {
    console.log('Failed to install Git via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('git');
  if (!verified) {
    console.log('Installation may have failed: git command not found after install.');
    return;
  }

  console.log('Git installed successfully.');
}

/**
 * Install Git on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL provides a full Ubuntu environment within Windows, so Git installation
 * follows the same APT-based process as native Ubuntu. The Git installed within
 * WSL is separate from any Git installation on the Windows host.
 *
 * Note: It is common and expected to have different Git versions in WSL and
 * Windows, as they are independent installations for their respective
 * environments.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();
}

/**
 * Install Git on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so Git installation follows the same
 * APT-based process as Ubuntu/Debian. Git is available in the default
 * repositories and works on both 32-bit (armhf) and 64-bit (arm64) ARM
 * architectures.
 *
 * Note: The version available in Raspberry Pi OS repositories may be slightly
 * older than what's available via Homebrew or Ubuntu PPA, but it is fully
 * functional for standard Git workflows.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install Git on Amazon Linux using DNF or YUM.
 *
 * Git is available in the default Amazon Linux repositories. This function
 * automatically detects whether the system uses DNF (Amazon Linux 2023) or
 * YUM (Amazon Linux 2) and uses the appropriate package manager.
 *
 * Important: Amazon Linux 2 reaches end of support on June 30, 2026. Consider
 * migrating to Amazon Linux 2023 for long-term support.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if Git is already installed by looking for the command
  const isInstalled = shell.commandExists('git');
  if (isInstalled) {
    console.log('Git is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Construct the install command based on available package manager
  const installCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y git'
    : 'sudo yum install -y git';

  // Install Git
  console.log(`Installing Git via ${packageManager}...`);
  const result = await shell.exec(installCommand);

  if (result.code !== 0) {
    console.log(`Failed to install Git via ${packageManager}.`);
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('git');
  if (!verified) {
    console.log('Installation may have failed: git command not found after install.');
    return;
  }

  console.log('Git installed successfully.');
}

/**
 * Install Git on Windows using Chocolatey.
 *
 * This installs Git for Windows, which includes:
 * - Git command-line tools
 * - Git Bash (Bash emulation environment)
 * - Git GUI (graphical interface)
 * - Git Credential Manager
 *
 * After installation, a new terminal window must be opened for the PATH
 * changes to take effect. Git will be available at:
 * C:\Program Files\Git\cmd\git.exe
 *
 * Note: The Windows version includes a ".windows.N" suffix in the version
 * number (e.g., "2.52.0.windows.1"), which is expected and correct.
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

  // Check if Git is already installed via Chocolatey
  const isChocoGitInstalled = await choco.isPackageInstalled('git');
  if (isChocoGitInstalled) {
    console.log('Git is already installed via Chocolatey, skipping...');
    return;
  }

  // Install Git using Chocolatey
  // The -y flag automatically confirms all prompts for non-interactive installation
  console.log('Installing Git via Chocolatey...');
  const result = await choco.install('git');

  if (!result.success) {
    console.log('Failed to install Git via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled('git');
  if (!verified) {
    console.log('Installation may have failed: Git package not found after install.');
    return;
  }

  console.log('Git installed successfully via Chocolatey.');
  console.log('');
  console.log('Note: Close and reopen your terminal for PATH changes to take effect.');
  console.log('Git Bash is also available from the Start Menu.');
}

/**
 * Install Git on Git Bash (Windows).
 *
 * Git Bash is included with Git for Windows, so if the user is running this
 * installer from within Git Bash, Git is already available. This function
 * confirms that Git is present and provides guidance if it is somehow missing.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if Git is already available (it should be, since Git Bash requires Git)
  const isInstalled = shell.commandExists('git');
  if (isInstalled) {
    console.log('Git is already installed (bundled with Git for Windows), skipping...');
    return;
  }

  // Git should always be available in Git Bash, but if it is missing,
  // the user likely has a corrupted installation
  console.log('Git is not found. It should be bundled with Git for Windows.');
  console.log('Please reinstall Git for Windows from https://git-scm.com/download/win');
}

/**
 * Check if this installer is supported on the current platform.
 * Git is supported on all major platforms.
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
 * appropriate platform-specific installer function. Git is supported on all
 * major platforms:
 *
 * - macOS (Homebrew)
 * - Ubuntu/Debian (APT)
 * - Ubuntu on WSL (APT)
 * - Raspberry Pi OS (APT)
 * - Amazon Linux/RHEL/Fedora (DNF/YUM)
 * - Windows (Chocolatey)
 * - Git Bash (bundled with Git for Windows)
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
  // Note: Git is available on virtually all platforms, so this is unlikely
  if (!installer) {
    console.log(`Git is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
  await installer();
}

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
};

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
