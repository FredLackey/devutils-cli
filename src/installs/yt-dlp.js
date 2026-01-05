#!/usr/bin/env node

/**
 * @fileoverview Install yt-dlp - a feature-rich command-line audio/video downloader.
 * @module installs/yt-dlp
 *
 * yt-dlp is a fork of the now-discontinued youtube-dl project, with additional
 * features, bug fixes, and active maintenance. It supports downloading from
 * YouTube, Vimeo, Twitter, TikTok, and thousands of other websites.
 *
 * Key capabilities include:
 * - Video downloading in various qualities and formats
 * - Audio extraction from videos (requires FFmpeg)
 * - Playlist and channel downloading
 * - Metadata and thumbnail embedding
 * - Format selection and live stream recording
 *
 * This installer provides:
 * - yt-dlp via Homebrew for macOS
 * - yt-dlp via APT for Ubuntu/Debian and Raspberry Pi OS
 * - yt-dlp via pip for Amazon Linux (not available in standard repos)
 * - yt-dlp via Chocolatey for Windows
 * - yt-dlp via APT for WSL (Ubuntu)
 * - yt-dlp via direct binary download for Git Bash
 *
 * IMPORTANT: For full functionality (format conversion, audio extraction),
 * install FFmpeg alongside yt-dlp using: dev install ffmpeg
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew formula name for yt-dlp on macOS.
 */
const HOMEBREW_FORMULA_NAME = 'yt-dlp';

/**
 * The APT package name for yt-dlp on Debian-based systems.
 */
const APT_PACKAGE_NAME = 'yt-dlp';

/**
 * The Chocolatey package name for yt-dlp on Windows.
 */
const CHOCO_PACKAGE_NAME = 'yt-dlp';

/**
 * Check if yt-dlp is installed by verifying the 'yt-dlp' command exists.
 *
 * This is a quick check that works across all platforms by looking for
 * the yt-dlp executable in the system PATH.
 *
 * @returns {boolean} True if the yt-dlp command is available, false otherwise
 */
function isYtDlpCommandAvailable() {
  return shell.commandExists('yt-dlp');
}

/**
 * Check if yt-dlp is installed and get the version.
 *
 * Executes 'yt-dlp --version' to verify yt-dlp is properly installed
 * and operational. Returns the version string if successful.
 *
 * @returns {Promise<string|null>} yt-dlp version string, or null if not installed
 */
async function getYtDlpVersion() {
  // First check if the command exists to avoid unnecessary process spawning
  if (!isYtDlpCommandAvailable()) {
    return null;
  }

  // Execute yt-dlp --version to get version information
  // The output format is typically just the version date: "2025.12.08"
  const result = await shell.exec('yt-dlp --version');
  if (result.code === 0 && result.stdout) {
    // yt-dlp version output is just the version string on a single line
    return result.stdout.trim();
  }
  return null;
}

/**
 * Install yt-dlp on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - Xcode Command Line Tools installed
 *
 * Homebrew installs yt-dlp with all its dependencies, including Python.
 * For full functionality, FFmpeg should also be installed separately.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if yt-dlp is already installed...');

  // Check if yt-dlp is already installed via command availability
  const existingVersion = await getYtDlpVersion();
  if (existingVersion) {
    console.log(`yt-dlp ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Also check if the formula is installed via Homebrew
  // (yt-dlp may be installed but not in PATH for some reason)
  const formulaInstalled = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (formulaInstalled) {
    console.log('yt-dlp is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('NOTE: If yt-dlp commands are not working, check your PATH.');
    console.log('Run: brew info yt-dlp');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  console.log('Installing yt-dlp via Homebrew...');

  // Install yt-dlp formula using Homebrew utility
  const result = await brew.install(HOMEBREW_FORMULA_NAME);

  if (!result.success) {
    console.log('Failed to install yt-dlp via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify installation succeeded by checking if the command now exists
  const version = await getYtDlpVersion();
  if (!version) {
    console.log('Installation may have failed: yt-dlp command not found after install.');
    console.log('');
    console.log('Please try:');
    console.log('  1. Restart your terminal session');
    console.log('  2. Run: yt-dlp --version');
    return;
  }

  console.log(`yt-dlp ${version} installed successfully.`);
  console.log('');
  console.log('RECOMMENDED: Install FFmpeg for full format conversion support:');
  console.log('  dev install ffmpeg');
  console.log('');
  console.log('Verify installation with: yt-dlp --version');
}

/**
 * Install yt-dlp on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 22.04 LTS or later, or Debian 11 (Bullseye) or later
 * - sudo privileges
 * - At least 100 MB free disk space
 *
 * Note: The version available in Ubuntu/Debian repositories may not be the
 * latest, but is sufficient for most use cases. For the latest version,
 * consider using pip installation method.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if yt-dlp is already installed...');

  // Check if yt-dlp is already installed
  const existingVersion = await getYtDlpVersion();
  if (existingVersion) {
    console.log(`yt-dlp ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Update package lists before installing to ensure we get the latest available version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install yt-dlp using APT
  // The apt.install function uses DEBIAN_FRONTEND=noninteractive and -y flag
  console.log('Installing yt-dlp via APT...');
  const result = await apt.install(APT_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install yt-dlp via APT.');
    console.log(result.output);
    console.log('');
    console.log('If the package is not available, you can install via pip:');
    console.log('  sudo apt-get install -y python3-pip');
    console.log('  python3 -m pip install -U "yt-dlp[default]"');
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const version = await getYtDlpVersion();
  if (!version) {
    console.log('Installation may have failed: yt-dlp command not found after install.');
    return;
  }

  console.log(`yt-dlp ${version} installed successfully.`);
  console.log('');
  console.log('NOTE: The repository version may not be the latest.');
  console.log('For the latest version, use pip: python3 -m pip install -U "yt-dlp[default]"');
  console.log('');
  console.log('RECOMMENDED: Install FFmpeg for full format conversion support:');
  console.log('  dev install ffmpeg');
}

/**
 * Install yt-dlp on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 *
 * yt-dlp installed in Windows is not accessible from WSL, so this function
 * installs yt-dlp separately within the WSL Ubuntu environment using APT.
 * The installation process is identical to native Ubuntu.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Installing yt-dlp within WSL environment...');
  console.log('');

  // Check if yt-dlp is already installed
  const existingVersion = await getYtDlpVersion();
  if (existingVersion) {
    console.log(`yt-dlp ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Update package lists before installing
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install yt-dlp using APT
  console.log('Installing yt-dlp via APT...');
  const result = await apt.install(APT_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install yt-dlp via APT.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. If you see DNS errors, try:');
    console.log('     echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf');
    console.log('  2. Alternatively, install via pip:');
    console.log('     sudo apt-get install -y python3-pip');
    console.log('     python3 -m pip install -U "yt-dlp[default]"');
    return;
  }

  // Verify installation succeeded
  const version = await getYtDlpVersion();
  if (!version) {
    console.log('Installation may have failed: yt-dlp command not found after install.');
    return;
  }

  console.log(`yt-dlp ${version} installed successfully.`);
  console.log('');
  console.log('WSL NOTES:');
  console.log('  - Access Windows files through /mnt/c/, /mnt/d/, etc.');
  console.log('  - Example: yt-dlp -o "/mnt/c/Users/You/Downloads/%(title)s.%(ext)s" "URL"');
  console.log('');
  console.log('RECOMMENDED: Install FFmpeg for full format conversion support:');
  console.log('  dev install ffmpeg');
}

/**
 * Install yt-dlp on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (Bookworm or Bullseye), 32-bit or 64-bit
 * - Raspberry Pi 3 or later recommended (earlier models work but may be slow)
 * - sudo privileges
 * - At least 100 MB free disk space
 *
 * The yt-dlp package in the repositories is architecture-independent (pure Python)
 * and works on ARM processors without modification.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if yt-dlp is already installed...');

  // Check if yt-dlp is already installed
  const existingVersion = await getYtDlpVersion();
  if (existingVersion) {
    console.log(`yt-dlp ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Update package lists before installing
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install yt-dlp using APT
  console.log('Installing yt-dlp via APT...');
  const result = await apt.install(APT_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install yt-dlp via APT.');
    console.log(result.output);
    console.log('');
    console.log('If the package is not available on older Raspberry Pi OS, use pip:');
    console.log('  sudo apt-get install -y python3-pip');
    console.log('  python3 -m pip install -U "yt-dlp[default]"');
    return;
  }

  // Verify installation succeeded
  const version = await getYtDlpVersion();
  if (!version) {
    console.log('Installation may have failed: yt-dlp command not found after install.');
    return;
  }

  console.log(`yt-dlp ${version} installed successfully.`);
  console.log('');
  console.log('RASPBERRY PI NOTES:');
  console.log('  - Downloads may be slow on older Pi models');
  console.log('  - Use lower quality for faster downloads: yt-dlp -f "best[height<=720]" "URL"');
  console.log('');
  console.log('RECOMMENDED: Install FFmpeg for full format conversion support:');
  console.log('  dev install ffmpeg');
}

/**
 * Install yt-dlp on Amazon Linux using pip.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - sudo privileges
 * - At least 100 MB free disk space
 * - Python 3.9 or later
 *
 * IMPORTANT: yt-dlp is not available in the standard Amazon Linux repositories.
 * This function uses pip installation, which is the recommended approach.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if yt-dlp is already installed...');

  // Check if yt-dlp is already installed
  const existingVersion = await getYtDlpVersion();
  if (existingVersion) {
    console.log(`yt-dlp ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Detect the platform to determine which package manager to use for pip
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // First, ensure python3-pip is installed
  console.log('Ensuring Python pip is installed...');
  const pipInstallCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y python3-pip'
    : 'sudo yum install -y python3-pip';

  const pipResult = await shell.exec(pipInstallCommand);
  if (pipResult.code !== 0) {
    console.log('Failed to install python3-pip.');
    console.log(pipResult.stderr || pipResult.stdout);
    return;
  }

  // Install yt-dlp using pip
  // The [default] extra installs recommended dependencies for optimal functionality
  console.log('Installing yt-dlp via pip...');
  const installResult = await shell.exec('python3 -m pip install -U "yt-dlp[default]"');

  if (installResult.code !== 0) {
    console.log('Failed to install yt-dlp via pip.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Try installing with --user flag:');
    console.log('     python3 -m pip install --user -U "yt-dlp[default]"');
    console.log('  2. Ensure ~/.local/bin is in your PATH:');
    console.log('     echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc');
    console.log('     source ~/.bashrc');
    return;
  }

  // Check if ~/.local/bin is in PATH (common location for pip-installed binaries)
  const pathCheckResult = await shell.exec('echo $PATH | grep -q "$HOME/.local/bin"');
  if (pathCheckResult.code !== 0) {
    console.log('Adding ~/.local/bin to PATH...');
    await shell.exec('echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc');
    console.log('');
    console.log('IMPORTANT: Run "source ~/.bashrc" or restart your terminal to update PATH.');
  }

  // Verify installation succeeded
  // Note: We may need to check with the full path since PATH may not be updated yet
  let version = await getYtDlpVersion();
  if (!version) {
    // Try checking the version using the full path
    const fullPathResult = await shell.exec('$HOME/.local/bin/yt-dlp --version');
    if (fullPathResult.code === 0 && fullPathResult.stdout) {
      version = fullPathResult.stdout.trim();
    }
  }

  if (!version) {
    console.log('Installation may have failed or yt-dlp is not in PATH.');
    console.log('');
    console.log('Please try:');
    console.log('  1. Add ~/.local/bin to PATH:');
    console.log('     echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc');
    console.log('     source ~/.bashrc');
    console.log('  2. Run: yt-dlp --version');
    return;
  }

  console.log(`yt-dlp ${version} installed successfully.`);
  console.log('');
  console.log('RECOMMENDED: Install FFmpeg for full format conversion support:');
  console.log('  dev install ffmpeg');
}

/**
 * Install yt-dlp on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 or later (64-bit)
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * Chocolatey installs yt-dlp and adds it to the system PATH automatically.
 * A new terminal window may be required for PATH updates to take effect.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if yt-dlp is already installed...');

  // Check if yt-dlp is already installed via command availability
  const existingVersion = await getYtDlpVersion();
  if (existingVersion) {
    console.log(`yt-dlp ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if yt-dlp is installed via Chocolatey
  const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (packageInstalled) {
    console.log('yt-dlp is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('NOTE: If yt-dlp commands are not working, open a new terminal window');
    console.log('to refresh your PATH, or run: refreshenv');
    return;
  }

  // Verify Chocolatey is available before attempting installation
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('Run: dev install chocolatey');
    return;
  }

  console.log('Installing yt-dlp via Chocolatey...');

  // Install yt-dlp using Chocolatey utility
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install yt-dlp via Chocolatey.');
    console.log(result.output);
    return;
  }

  console.log('yt-dlp installed successfully.');
  console.log('');
  console.log('IMPORTANT: Open a new terminal window to refresh your PATH.');
  console.log('Alternatively, run: refreshenv');
  console.log('');
  console.log('RECOMMENDED: Install FFmpeg for full format conversion support:');
  console.log('  dev install ffmpeg');
  console.log('');
  console.log('Verify installation with: yt-dlp --version');
}

/**
 * Install yt-dlp in Git Bash on Windows using direct binary download.
 *
 * Prerequisites:
 * - Windows 10 or later (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Internet access to download binaries from GitHub
 *
 * Git Bash runs in a MinGW environment on Windows. This function downloads
 * the portable yt-dlp Windows executable from GitHub releases and places
 * it in ~/bin which is added to PATH.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('');
  console.log('Installing yt-dlp using direct binary download...');
  console.log('');

  // Check if yt-dlp is already available
  const existingVersion = await getYtDlpVersion();
  if (existingVersion) {
    console.log(`yt-dlp ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Create ~/bin directory if it does not exist
  // This directory will be added to PATH for storing portable executables
  console.log('Creating ~/bin directory...');
  const mkdirResult = await shell.exec('mkdir -p ~/bin');
  if (mkdirResult.code !== 0) {
    console.log('Failed to create ~/bin directory.');
    console.log(mkdirResult.stderr);
    return;
  }

  // Download the yt-dlp Windows executable from GitHub releases
  // Using the 'latest' URL which always points to the most recent release
  console.log('Downloading yt-dlp from GitHub releases...');
  const downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
  const downloadCommand = `curl -L -o ~/bin/yt-dlp.exe "${downloadUrl}"`;
  const downloadResult = await shell.exec(downloadCommand);

  if (downloadResult.code !== 0) {
    console.log('Failed to download yt-dlp binary.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Check your internet connection');
    console.log('  2. If you see certificate errors, try:');
    console.log(`     curl -k -L -o ~/bin/yt-dlp.exe "${downloadUrl}"`);
    return;
  }

  // Make the executable file executable (may not be necessary on Windows but ensures consistency)
  await shell.exec('chmod +x ~/bin/yt-dlp.exe 2>/dev/null || true');

  // Check if ~/bin is in PATH and add it if needed
  const pathCheckResult = await shell.exec('echo $PATH | grep -q "$HOME/bin"');
  if (pathCheckResult.code !== 0) {
    console.log('Adding ~/bin to PATH in ~/.bashrc...');
    await shell.exec('echo \'export PATH="$HOME/bin:$PATH"\' >> ~/.bashrc');
    console.log('');
    console.log('IMPORTANT: Run "source ~/.bashrc" or restart Git Bash to update PATH.');
  }

  // Verify installation by checking the version using the full path
  // (PATH may not be updated yet in the current session)
  const verifyResult = await shell.exec('~/bin/yt-dlp.exe --version');
  if (verifyResult.code !== 0) {
    console.log('Installation may have failed or verification failed.');
    console.log('');
    console.log('Please try:');
    console.log('  1. Restart Git Bash');
    console.log('  2. Run: ~/bin/yt-dlp.exe --version');
    return;
  }

  const version = verifyResult.stdout.trim();

  console.log(`yt-dlp ${version} installed successfully.`);
  console.log('');
  console.log('Installation location: ~/bin/yt-dlp.exe');
  console.log('');
  console.log('GIT BASH NOTES:');
  console.log('  - For Windows paths, use forward slashes or MSYS path format');
  console.log('  - Example: yt-dlp -o "//c/Users/You/Downloads/%(title)s.%(ext)s" "URL"');
  console.log('  - Or use: MSYS_NO_PATHCONV=1 yt-dlp -o "C:/Users/..." "URL"');
  console.log('');
  console.log('RECOMMENDED: Install FFmpeg for full format conversion support:');
  console.log('  dev install ffmpeg');
  console.log('');
  console.log('Restart Git Bash or run: source ~/.bashrc');
}

/**
 * Check if this installer is supported on the current platform.
 * yt-dlp is supported on all major platforms.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: yt-dlp via Homebrew
 * - Ubuntu/Debian: yt-dlp via APT
 * - Raspberry Pi OS: yt-dlp via APT
 * - Amazon Linux/RHEL: yt-dlp via pip (not in standard repos)
 * - Windows: yt-dlp via Chocolatey
 * - WSL (Ubuntu): yt-dlp via APT within WSL
 * - Git Bash: yt-dlp direct binary download from GitHub
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases (e.g., debian maps to ubuntu installer)
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,
    'wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash
  };

  const installer = installers[platform.type];

  // If no installer exists for this platform, inform the user gracefully
  // Do not throw an error - just log a message and return
  if (!installer) {
    console.log(`yt-dlp is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

// Export all functions for use as a module and for testing
module.exports = {
  install,
  isEligible,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash
};

// Allow direct execution: node yt-dlp.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
