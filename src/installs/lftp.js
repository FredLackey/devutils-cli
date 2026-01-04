#!/usr/bin/env node

/**
 * @fileoverview Install LFTP - a sophisticated command-line file transfer program.
 *
 * LFTP supports multiple protocols including FTP, FTPS, HTTP, HTTPS, HFTP, FISH,
 * SFTP, and BitTorrent. Key features include automatic retry and resume, mirror
 * capabilities, segmented transfers, job control, and full scriptability for
 * automation in CI/CD pipelines and scheduled tasks.
 *
 * @module installs/lftp
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Install LFTP on macOS using Homebrew.
 *
 * Installs LFTP via Homebrew, which automatically handles all dependencies
 * including libidn2, openssl@3, readline, and gettext.
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

  // Check if LFTP is already installed via Homebrew
  const isBrewLftpInstalled = await brew.isFormulaInstalled('lftp');
  if (isBrewLftpInstalled) {
    console.log('LFTP is already installed via Homebrew, skipping...');
    return;
  }

  // Install LFTP using Homebrew
  // The --quiet flag is handled by brew.install internally if needed
  console.log('Installing LFTP via Homebrew...');
  const result = await brew.install('lftp');

  if (!result.success) {
    console.log('Failed to install LFTP via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the formula is now installed
  const verified = await brew.isFormulaInstalled('lftp');
  if (!verified) {
    console.log('Installation may have failed: LFTP formula not found after install.');
    return;
  }

  console.log('LFTP installed successfully via Homebrew.');
}

/**
 * Install LFTP on Ubuntu/Debian using APT.
 *
 * LFTP is available in the official Ubuntu and Debian repositories, so no
 * additional repository configuration is required. The installation uses
 * non-interactive mode for automation compatibility.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if LFTP is already installed by looking for the command
  const isInstalled = shell.commandExists('lftp');
  if (isInstalled) {
    console.log('LFTP is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install LFTP using APT
  // The apt.install function handles sudo and -y flag automatically
  console.log('Installing LFTP via APT...');
  const result = await apt.install('lftp');

  if (!result.success) {
    console.log('Failed to install LFTP via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('lftp');
  if (!verified) {
    console.log('Installation may have failed: lftp command not found after install.');
    return;
  }

  console.log('LFTP installed successfully.');
}

/**
 * Install LFTP on Ubuntu running in WSL.
 *
 * WSL Ubuntu installations follow the same process as native Ubuntu using APT.
 * The installation is identical because WSL provides a full Ubuntu userspace.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();
}

/**
 * Install LFTP on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so LFTP installation follows the same
 * process as Ubuntu/Debian. The ARM architecture is handled automatically
 * by the package manager.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install LFTP on Amazon Linux/RHEL using DNF or YUM.
 *
 * LFTP is available in the base repositories for Amazon Linux 2, Amazon Linux
 * 2023, RHEL, CentOS, Rocky Linux, and AlmaLinux. This function detects
 * which package manager (dnf or yum) is available and uses it accordingly.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if LFTP is already installed by looking for the command
  const isInstalled = shell.commandExists('lftp');
  if (isInstalled) {
    console.log('LFTP is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Construct the install command based on available package manager
  // The -y flag automatically confirms the installation for non-interactive execution
  const installCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y lftp'
    : 'sudo yum install -y lftp';

  // Install LFTP
  console.log(`Installing LFTP via ${packageManager}...`);
  const result = await shell.exec(installCommand);

  if (result.code !== 0) {
    console.log(`Failed to install LFTP via ${packageManager}.`);
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('lftp');
  if (!verified) {
    console.log('Installation may have failed: lftp command not found after install.');
    return;
  }

  console.log('LFTP installed successfully.');
}

/**
 * Install LFTP on Windows using Chocolatey.
 *
 * LFTP is not available in winget, so Chocolatey is used. The Chocolatey
 * package provides unofficial Windows builds from the LFTP4WIN project.
 *
 * Note: After installation, users may need to open a new terminal window
 * to pick up PATH changes.
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

  // Check if LFTP is already installed via Chocolatey
  const isChocoLftpInstalled = await choco.isPackageInstalled('lftp');
  if (isChocoLftpInstalled) {
    console.log('LFTP is already installed via Chocolatey, skipping...');
    return;
  }

  // Install LFTP using Chocolatey
  // The -y flag is handled by choco.install automatically
  console.log('Installing LFTP via Chocolatey...');
  const result = await choco.install('lftp');

  if (!result.success) {
    console.log('Failed to install LFTP via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled('lftp');
  if (!verified) {
    console.log('Installation may have failed: LFTP package not found after install.');
    return;
  }

  console.log('LFTP installed successfully via Chocolatey.');
  console.log('');
  console.log('Note: You may need to open a new terminal window to use the lftp command.');
}

/**
 * Install LFTP on Git Bash (Windows).
 *
 * LFTP is not natively available in Git Bash because Git Bash uses MinGW.
 * This function informs users that LFTP is not available in Git Bash and
 * returns gracefully without error.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // LFTP is not available in Git Bash - inform the user and return gracefully
  // Note: The documentation mentions LFTP4WIN as a workaround, but per project
  // guidelines we should not suggest alternatives
  console.log('LFTP is not available for Git Bash.');
  return;
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
 *
 * Unsupported platforms:
 * - Git Bash (returns gracefully with message)
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
    console.log(`LFTP is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
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
};

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
