#!/usr/bin/env node

/**
 * @fileoverview Install unzip - a command-line utility for extracting files from ZIP archives.
 *
 * unzip is one of the most fundamental file compression tools available on Unix-like systems
 * and Windows, providing reliable extraction of compressed files. It is developed and maintained
 * by the Info-ZIP project, which has been providing free, portable, high-quality versions of
 * ZIP utilities since the early 1990s.
 *
 * unzip is essential for developers, system administrators, and DevOps engineers who need to:
 * - Extract software packages and releases distributed as ZIP files
 * - Decompress archives downloaded from the internet
 * - Automate extraction in deployment scripts and CI/CD pipelines
 * - List and test contents of ZIP archives without extracting
 * - Extract specific files from large archives
 *
 * Note: unzip is pre-installed on most operating systems. This installer verifies unzip
 * availability and installs it only if missing.
 *
 * @module installs/unzip
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Install unzip on macOS using Homebrew.
 *
 * macOS includes a system version of unzip pre-installed at /usr/bin/unzip. For most users,
 * the pre-installed version is sufficient. This function installs the latest version via
 * Homebrew if the user needs newer features or bug fixes.
 *
 * Note: Homebrew intentionally does not symlink unzip to the default bin directory to avoid
 * conflicts with the macOS system version. Users must manually add it to their PATH to use
 * the Homebrew version.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // First, check if the system unzip is available (it should always be on macOS)
  // We check for the unzip command existence as a baseline verification
  const systemUnzipExists = shell.commandExists('unzip');
  if (systemUnzipExists) {
    // macOS always has unzip pre-installed at /usr/bin/unzip
    // Unlike tools like curl, there is typically no benefit to installing via Homebrew
    // unless the user specifically needs newer features
    console.log('unzip is already installed (macOS system version), skipping...');
    return;
  }

  // This is an extremely rare case - system unzip should always exist on macOS
  // If we reach here, something is wrong with the system
  console.log('Warning: System unzip not found. This is unexpected on macOS.');

  // Check if Homebrew is available - it is required for installing unzip if missing
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Check if unzip is already installed via Homebrew
  const isBrewUnzipInstalled = await brew.isFormulaInstalled('unzip');
  if (isBrewUnzipInstalled) {
    console.log('unzip is already installed via Homebrew, skipping...');
    return;
  }

  // Install unzip using Homebrew with the --quiet flag for cleaner output
  console.log('Installing unzip via Homebrew...');
  const result = await brew.install('unzip');

  if (!result.success) {
    console.log('Failed to install unzip via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if unzip command now exists
  const verified = shell.commandExists('unzip');
  if (!verified) {
    console.log('Installation may have failed: unzip command not found after install.');
    console.log('');
    console.log('Note: Homebrew unzip is keg-only and not symlinked by default.');
    console.log('To use it, add to your PATH:');
    console.log('  echo \'export PATH="$(brew --prefix)/opt/unzip/bin:$PATH"\' >> ~/.zshrc && source ~/.zshrc');
    return;
  }

  console.log('unzip installed successfully via Homebrew.');
}

/**
 * Install unzip on Ubuntu/Debian using APT.
 *
 * unzip is available in the default Ubuntu and Debian repositories. Many installations
 * include it pre-installed. This function ensures unzip is installed or updates it to
 * the latest version from the repositories.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if unzip is already installed by looking for the command
  const isInstalled = shell.commandExists('unzip');
  if (isInstalled) {
    console.log('unzip is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install unzip using APT
  // The apt.install function uses DEBIAN_FRONTEND=noninteractive and -y flag
  // to ensure fully automated installation without prompts
  console.log('Installing unzip via APT...');
  const result = await apt.install('unzip');

  if (!result.success) {
    console.log('Failed to install unzip via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('unzip');
  if (!verified) {
    console.log('Installation may have failed: unzip command not found after install.');
    return;
  }

  console.log('unzip installed successfully.');
}

/**
 * Install unzip on Ubuntu running in WSL.
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
 * Install unzip on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so unzip installation follows the same
 * process as Ubuntu/Debian. unzip is often pre-installed on Raspberry Pi OS.
 * The unzip package is available for both 32-bit (armv7l) and 64-bit (aarch64)
 * ARM architectures.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install unzip on Amazon Linux using DNF or YUM.
 *
 * unzip is available in the default Amazon Linux repositories. This function
 * automatically detects whether to use dnf (Amazon Linux 2023) or yum
 * (Amazon Linux 2) based on the available package manager.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if unzip is already installed by looking for the command
  const isInstalled = shell.commandExists('unzip');
  if (isInstalled) {
    console.log('unzip is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Construct the install command based on available package manager
  // The -y flag automatically confirms installation prompts for non-interactive execution
  const installCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y unzip'
    : 'sudo yum install -y unzip';

  // Install unzip
  console.log(`Installing unzip via ${packageManager}...`);
  const result = await shell.exec(installCommand);

  if (result.code !== 0) {
    console.log(`Failed to install unzip via ${packageManager}.`);
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('unzip');
  if (!verified) {
    console.log('Installation may have failed: unzip command not found after install.');
    return;
  }

  console.log('unzip installed successfully.');
}

/**
 * Install unzip on Windows using Chocolatey.
 *
 * Windows 10/11 includes built-in ZIP support through File Explorer and PowerShell's
 * Expand-Archive cmdlet. However, the Info-ZIP unzip command provides more features
 * and is required for shell scripts expecting Unix-style unzip behavior.
 *
 * This function installs the Info-ZIP unzip via Chocolatey, which downloads the
 * appropriate binary and adds it to the PATH automatically.
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

  // Check if unzip is already installed via Chocolatey
  const isChocoUnzipInstalled = await choco.isPackageInstalled('unzip');
  if (isChocoUnzipInstalled) {
    console.log('unzip is already installed via Chocolatey, skipping...');
    return;
  }

  // Also check if unzip command exists (might be installed via other means like winget)
  const commandExists = shell.commandExists('unzip');
  if (commandExists) {
    console.log('unzip is already installed, skipping...');
    return;
  }

  // Install unzip using Chocolatey
  // The -y flag automatically confirms all prompts for fully non-interactive installation
  console.log('Installing unzip via Chocolatey...');
  const result = await choco.install('unzip');

  if (!result.success) {
    console.log('Failed to install unzip via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled('unzip');
  if (!verified) {
    console.log('Installation may have failed: unzip package not found after install.');
    return;
  }

  console.log('unzip installed successfully via Chocolatey.');
  console.log('');
  console.log('Note: You may need to open a new terminal window for the PATH update to take effect.');
}

/**
 * Install unzip on Git Bash (Windows).
 *
 * Recent versions of Git for Windows (1.7.6 and later) include the unzip command
 * bundled. This function checks if unzip is available and, if missing, downloads
 * the GnuWin32 unzip binary and installs it to the Git Bash usr/bin directory.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if unzip is already available (it should be bundled with recent Git for Windows)
  const isInstalled = shell.commandExists('unzip');
  if (isInstalled) {
    console.log('unzip is already installed (bundled with Git for Windows), skipping...');
    return;
  }

  // unzip is not bundled with this version of Git for Windows
  // We need to download and install it manually
  console.log('unzip is not found. Downloading from GnuWin32...');

  // Create the temporary directory if needed
  const mkdirResult = await shell.exec('mkdir -p /tmp');
  if (mkdirResult.code !== 0) {
    console.log('Failed to create temporary directory.');
    return;
  }

  // Download the GnuWin32 unzip package
  // Note: This is version 5.51-1 from the GnuWin32 project
  const downloadUrl = 'https://sourceforge.net/projects/gnuwin32/files/unzip/5.51-1/unzip-5.51-1-bin.zip/download';
  console.log('Downloading unzip binary...');
  const downloadCommand = `curl -L -o /tmp/unzip-5.51-1-bin.zip "${downloadUrl}"`;
  const downloadResult = await shell.exec(downloadCommand);

  if (downloadResult.code !== 0) {
    console.log('Failed to download unzip binary.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    console.log('');
    console.log('If the download fails, visit https://sourceforge.net/projects/gnuwin32/files/unzip/');
    console.log('in your browser to download manually.');
    return;
  }

  // Extract the downloaded archive using PowerShell's Expand-Archive
  // (since we do not have unzip yet, we must use PowerShell)
  console.log('Extracting unzip binary...');
  const extractCommand = 'mkdir -p /tmp/unzip-extract && cd /tmp/unzip-extract && powershell.exe -Command "Expand-Archive -Path \'/tmp/unzip-5.51-1-bin.zip\' -DestinationPath \'.\' -Force"';
  const extractResult = await shell.exec(extractCommand);

  if (extractResult.code !== 0) {
    console.log('Failed to extract unzip binary.');
    console.log(extractResult.stderr || extractResult.stdout);
    return;
  }

  // Copy unzip.exe to Git Bash's usr/bin directory
  console.log('Installing unzip to /usr/bin...');
  const copyCommand = 'cp /tmp/unzip-extract/bin/unzip.exe /usr/bin/unzip.exe';
  const copyResult = await shell.exec(copyCommand);

  if (copyResult.code !== 0) {
    console.log('Failed to copy unzip.exe to /usr/bin.');
    console.log('Try running Git Bash as Administrator.');
    console.log('');
    console.log('Alternatively, install to your home directory:');
    console.log('  mkdir -p ~/bin');
    console.log('  cp /tmp/unzip-extract/bin/unzip.exe ~/bin/unzip.exe');
    console.log('  echo \'export PATH="$HOME/bin:$PATH"\' >> ~/.bashrc && source ~/.bashrc');
    return;
  }

  // Clean up temporary files
  console.log('Cleaning up temporary files...');
  await shell.exec('rm -rf /tmp/unzip-5.51-1-bin.zip /tmp/unzip-extract');

  // Verify the installation succeeded by checking if the command now exists
  const verified = shell.commandExists('unzip');
  if (!verified) {
    console.log('Installation may have failed: unzip command not found after install.');
    console.log('');
    console.log('Try restarting Git Bash and running: unzip -v');
    return;
  }

  console.log('unzip installed successfully.');
}

/**
 * Check if unzip is installed on the current system.
 * @returns {Promise<boolean>} True if unzip is installed
 */
async function isInstalled() {
  const platform = os.detect();
  if (platform.type === 'macos') {
    // macOS always has system unzip, also check Homebrew
    const hasBrewUnzip = await brew.isFormulaInstalled('unzip');
    return hasBrewUnzip || shell.commandExists('unzip');
  }
  if (platform.type === 'windows') {
    return choco.isPackageInstalled('unzip');
  }
  return shell.commandExists('unzip');
}

/**
 * Check if this installer is supported on the current platform.
 * unzip is supported on all major platforms.
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
 * appropriate platform-specific installer function. unzip is pre-installed on
 * most platforms, so these installers primarily verify availability.
 *
 * Supported platforms:
 * - macOS (system unzip pre-installed, Homebrew available if missing)
 * - Ubuntu/Debian (APT)
 * - Ubuntu on WSL (APT)
 * - Raspberry Pi OS (APT)
 * - Amazon Linux/RHEL (DNF/YUM)
 * - Windows (Chocolatey)
 * - Git Bash (bundled with Git for Windows or manual install)
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
    console.log(`unzip is not available for ${platform.type}.`);
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
