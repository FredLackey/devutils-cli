#!/usr/bin/env node

/**
 * @fileoverview Install GNU Wget - a command-line utility for non-interactive downloading.
 *
 * GNU Wget is a free utility for non-interactive downloading of files from the web.
 * It supports HTTP, HTTPS, and FTP protocols, making it one of the most widely-used
 * tools for automated file retrieval. Wget is essential for developers, system
 * administrators, and DevOps engineers who need to download files, mirror websites,
 * or retrieve data within scripts and CI/CD pipelines.
 *
 * Key features include:
 * - Non-interactive operation (can run in the background or in scripts)
 * - Recursive downloading and website mirroring
 * - Resume interrupted downloads with the -c flag
 * - Bandwidth throttling and retry on failure
 * - HTTP cookies and authentication support
 * - Proxy support (HTTP and FTP)
 *
 * @module installs/wget
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Install wget on macOS using Homebrew.
 *
 * macOS does not include wget by default (it ships with curl instead). This
 * function installs wget via Homebrew, which is the recommended method for
 * macOS. Homebrew will automatically install dependencies like libidn2,
 * openssl@3, gettext, and libunistring.
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

  // Check if wget is already installed by verifying the command exists
  // Unlike curl, wget is NOT pre-installed on macOS, so we can check the command directly
  const isInstalled = shell.commandExists('wget');
  if (isInstalled) {
    console.log('wget is already installed, skipping...');
    return;
  }

  // Install wget using Homebrew
  // The brew.install function handles the installation and returns success/failure status
  console.log('Installing wget via Homebrew...');
  const result = await brew.install('wget');

  if (!result.success) {
    console.log('Failed to install wget via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  const verified = shell.commandExists('wget');
  if (!verified) {
    console.log('Installation may have failed: wget command not found after install.');
    return;
  }

  console.log('wget installed successfully.');
}

/**
 * Install wget on Ubuntu/Debian using APT.
 *
 * Most Ubuntu and Debian installations include wget pre-installed. This function
 * ensures wget is installed or updates it to the latest version from the
 * repositories. APT will automatically handle dependencies like OpenSSL, zlib,
 * libidn2, libpsl, and libpcre2.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if wget is already installed by looking for the command
  const isInstalled = shell.commandExists('wget');
  if (isInstalled) {
    console.log('wget is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install wget using APT
  // The apt.install function uses DEBIAN_FRONTEND=noninteractive and -y flag
  // to ensure fully automated installation without prompts
  console.log('Installing wget via APT...');
  const result = await apt.install('wget');

  if (!result.success) {
    console.log('Failed to install wget via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('wget');
  if (!verified) {
    console.log('Installation may have failed: wget command not found after install.');
    return;
  }

  console.log('wget installed successfully.');
}

/**
 * Install wget on Ubuntu running in WSL.
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
 * Install wget on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so wget installation follows the same
 * process as Ubuntu/Debian. wget is typically pre-installed on Raspberry Pi OS.
 * The wget package is available for both 32-bit (armv7l) and 64-bit (aarch64)
 * ARM architectures.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install wget on Amazon Linux using DNF or YUM.
 *
 * wget is typically pre-installed on Amazon Linux. Amazon Linux 2023 uses
 * dnf as the package manager, while Amazon Linux 2 uses yum. This function
 * detects which package manager is available and uses it accordingly.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if wget is already installed by looking for the command
  const isInstalled = shell.commandExists('wget');
  if (isInstalled) {
    console.log('wget is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Construct the install command based on available package manager
  // The -y flag automatically confirms installation prompts for non-interactive execution
  const installCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y wget'
    : 'sudo yum install -y wget';

  // Install wget
  console.log(`Installing wget via ${packageManager}...`);
  const result = await shell.exec(installCommand);

  if (result.code !== 0) {
    console.log(`Failed to install wget via ${packageManager}.`);
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('wget');
  if (!verified) {
    console.log('Installation may have failed: wget command not found after install.');
    return;
  }

  console.log('wget installed successfully.');
}

/**
 * Install wget on Windows using Chocolatey.
 *
 * Windows does not include wget by default. Note that PowerShell has an alias
 * 'wget' that points to Invoke-WebRequest, but this is NOT the same as GNU wget.
 * This function installs the actual GNU wget via Chocolatey. The Chocolatey
 * package automatically detects system architecture and installs the appropriate
 * 32-bit or 64-bit version.
 *
 * Important: In PowerShell, use 'wget.exe' (with the extension) to invoke the
 * actual GNU wget executable, as 'wget' is an alias for Invoke-WebRequest.
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

  // Check if wget is already installed via Chocolatey
  // Note: We check the Chocolatey package, not the command, because PowerShell
  // has a built-in alias 'wget' that points to Invoke-WebRequest
  const isChocoWgetInstalled = await choco.isPackageInstalled('wget');
  if (isChocoWgetInstalled) {
    console.log('wget is already installed via Chocolatey, skipping...');
    return;
  }

  // Install wget using Chocolatey
  // The -y flag automatically confirms all prompts for fully non-interactive installation
  console.log('Installing wget via Chocolatey...');
  const result = await choco.install('wget');

  if (!result.success) {
    console.log('Failed to install wget via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled('wget');
  if (!verified) {
    console.log('Installation may have failed: wget package not found after install.');
    return;
  }

  console.log('wget installed successfully via Chocolatey.');
  console.log('');
  console.log('Note: In PowerShell, use "wget.exe" (with the extension) to run GNU wget,');
  console.log('as "wget" is an alias for Invoke-WebRequest.');
}

/**
 * Install wget on Git Bash (Windows).
 *
 * Git Bash does not include wget by default. This function downloads the
 * standalone wget executable from eternallybored.org (a trusted source for
 * Windows wget binaries) and places it in the Git Bash bin directory.
 *
 * The wget binary is statically compiled and does not require additional
 * dependencies.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if wget is already available in Git Bash
  const isInstalled = shell.commandExists('wget');
  if (isInstalled) {
    console.log('wget is already installed, skipping...');
    return;
  }

  // Check if curl is available for downloading the binary
  // curl should be bundled with Git Bash, but verify it exists
  const hasCurl = shell.commandExists('curl');
  if (!hasCurl) {
    console.log('curl is not available. Please ensure Git for Windows is installed correctly.');
    return;
  }

  // Create the mingw64/bin directory if it does not exist
  // This is the standard location for executables in Git for Windows
  console.log('Creating bin directory if needed...');
  const mkdirResult = await shell.exec('mkdir -p "/c/Program Files/Git/mingw64/bin"');
  if (mkdirResult.code !== 0) {
    console.log('Failed to create bin directory.');
    console.log('Try running Git Bash as Administrator.');
    return;
  }

  // Download the wget executable from eternallybored.org
  // This is a trusted source for Windows wget binaries mentioned in the documentation
  // Using the 64-bit version as it is the most common architecture
  console.log('Downloading wget from eternallybored.org...');
  const downloadUrl = 'https://eternallybored.org/misc/wget/1.21.4/64/wget.exe';
  const downloadCommand = `curl -L -o "/c/Program Files/Git/mingw64/bin/wget.exe" "${downloadUrl}"`;
  const downloadResult = await shell.exec(downloadCommand);

  if (downloadResult.code !== 0) {
    console.log('Failed to download wget binary.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    console.log('');
    console.log('If you encounter SSL certificate errors, try running:');
    console.log('  curl -k -L -o "/c/Program Files/Git/mingw64/bin/wget.exe" "' + downloadUrl + '"');
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  // Note: May need to restart Git Bash for the PATH to be updated
  const verified = shell.commandExists('wget');
  if (!verified) {
    console.log('wget was downloaded but may not be in your PATH yet.');
    console.log('Please close and reopen Git Bash to use wget.');
    console.log('');
    console.log('Alternatively, verify the file exists:');
    console.log('  ls -la "/c/Program Files/Git/mingw64/bin/wget.exe"');
    return;
  }

  console.log('wget installed successfully.');
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
 * - Git Bash (Manual download from eternallybored.org)
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
    console.log(`wget is not available for ${platform.type}.`);
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
