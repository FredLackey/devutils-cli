#!/usr/bin/env node

/**
 * @fileoverview Install Build Essential tools across supported platforms.
 *
 * Build essential tools are the foundational compilation utilities required to
 * build software from source code. This includes compilers (GCC, Clang, MSVC),
 * GNU Make for build automation, and related development utilities.
 *
 * Platform-specific packages:
 * - macOS: Xcode Command Line Tools
 * - Ubuntu/Debian/Raspbian: build-essential meta-package
 * - Amazon Linux/RHEL: "Development Tools" group package
 * - Windows: Visual Studio Build Tools with C++ workload
 * - WSL: build-essential (same as Ubuntu)
 * - Git Bash: MSYS2/MinGW toolchain
 *
 * @module installs/build-essential
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Checks if GCC is available in the system PATH.
 * This is the primary indicator that build tools are installed on Unix systems.
 *
 * @returns {boolean} - True if gcc command exists
 */
function isGccInstalled() {
  return shell.commandExists('gcc');
}

/**
 * Checks if Make is available in the system PATH.
 * Make is a core build automation tool included with build-essential packages.
 *
 * @returns {boolean} - True if make command exists
 */
function isMakeInstalled() {
  return shell.commandExists('make');
}

/**
 * Checks if Xcode Command Line Tools are installed on macOS.
 * Uses xcode-select to verify the installation path exists.
 *
 * @returns {Promise<boolean>} - True if Xcode CLI tools are installed
 */
async function isXcodeCliInstalled() {
  const result = await shell.exec('xcode-select -p');
  return result.code === 0;
}

// -----------------------------------------------------------------------------
// Platform-Specific Installation Functions
// -----------------------------------------------------------------------------

/**
 * Install build essential tools on macOS using Xcode Command Line Tools.
 *
 * Xcode Command Line Tools provide GCC, Clang, Make, and other essential build
 * utilities. This is the standard way to get compilation tools on macOS.
 *
 * The installation uses a non-interactive method via softwareupdate to avoid
 * the GUI dialog that xcode-select --install would trigger.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Xcode Command Line Tools are already installed
  const alreadyInstalled = await isXcodeCliInstalled();
  if (alreadyInstalled) {
    console.log('Xcode Command Line Tools are already installed, skipping...');
    return;
  }

  console.log('Installing Xcode Command Line Tools...');
  console.log('Note: This may take 5-15 minutes depending on your internet connection.');

  // Create a placeholder file that triggers softwareupdate to list CLI tools
  const touchResult = await shell.exec('touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress');
  if (touchResult.code !== 0) {
    throw new Error('Failed to create placeholder file for Xcode CLI tools installation.');
  }

  // Find the latest Command Line Tools package name from softwareupdate
  const listResult = await shell.exec('softwareupdate -l 2>/dev/null | grep -o ".*Command Line Tools.*" | tail -n 1 | sed "s/^[[:space:]]*//" | sed "s/^Label: //"');

  if (listResult.code !== 0 || !listResult.stdout.trim()) {
    // Clean up placeholder file before throwing
    await shell.exec('rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress');
    throw new Error('Could not find Command Line Tools package. Try downloading directly from https://developer.apple.com/download/all/?q=command%20line%20tools');
  }

  const packageName = listResult.stdout.trim();
  console.log(`Found package: ${packageName}`);

  // Install the package using softwareupdate
  const installResult = await shell.exec(`softwareupdate -i "${packageName}" --verbose`, { timeout: 900000 }); // 15 minute timeout

  // Clean up the placeholder file regardless of installation outcome
  await shell.exec('rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress');

  if (installResult.code !== 0) {
    throw new Error(`Installation failed: ${installResult.stderr || 'Unknown error'}`);
  }

  // Verify installation succeeded by checking for gcc and make
  const verified = await isXcodeCliInstalled();
  if (!verified) {
    throw new Error('Installation completed but Xcode Command Line Tools not found. Please try again or install manually.');
  }

  console.log('Xcode Command Line Tools installed successfully.');
}

/**
 * Install build-essential on Ubuntu/Debian using APT.
 *
 * The build-essential package is a meta-package that installs:
 * - GCC (GNU Compiler Collection) for C
 * - G++ for C++
 * - Make for build automation
 * - libc development headers
 * - dpkg-dev for building Debian packages
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if build-essential is already installed by verifying gcc and make
  if (isGccInstalled() && isMakeInstalled()) {
    // Double-check by querying dpkg for the package
    const packageInstalled = await apt.isPackageInstalled('build-essential');
    if (packageInstalled) {
      console.log('build-essential is already installed, skipping...');
      return;
    }
  }

  console.log('Installing build-essential via APT...');

  // Update package lists first to ensure we have the latest package information
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package lists: ${updateResult.stderr}`);
  }

  // Install build-essential with non-interactive mode and auto-confirm
  console.log('Installing build-essential package...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential');
  if (installResult.code !== 0) {
    throw new Error(`Failed to install build-essential: ${installResult.stderr}`);
  }

  // Verify installation succeeded
  if (!isGccInstalled() || !isMakeInstalled()) {
    throw new Error('Installation completed but gcc or make not found in PATH.');
  }

  console.log('build-essential installed successfully.');
}

/**
 * Install build-essential on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so the installation process is identical
 * to Ubuntu/Debian. The package includes ARM-compatible versions of all tools.
 *
 * Note: Installation may take longer on Raspberry Pi due to slower I/O and
 * processor speeds (5-10 minutes on older Pi models).
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if build-essential is already installed by verifying gcc and make
  if (isGccInstalled() && isMakeInstalled()) {
    // Double-check by querying dpkg for the package
    const packageInstalled = await apt.isPackageInstalled('build-essential');
    if (packageInstalled) {
      console.log('build-essential is already installed, skipping...');
      return;
    }
  }

  console.log('Installing build-essential via APT...');
  console.log('Note: Installation may take 5-10 minutes on Raspberry Pi.');

  // Update package lists first to ensure we have the latest package information
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package lists: ${updateResult.stderr}`);
  }

  // Install build-essential with non-interactive mode and auto-confirm
  console.log('Installing build-essential package...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential');
  if (installResult.code !== 0) {
    throw new Error(`Failed to install build-essential: ${installResult.stderr}`);
  }

  // Verify installation succeeded
  if (!isGccInstalled() || !isMakeInstalled()) {
    throw new Error('Installation completed but gcc or make not found in PATH.');
  }

  console.log('build-essential installed successfully.');
}

/**
 * Install Development Tools on Amazon Linux/RHEL using DNF or YUM.
 *
 * Amazon Linux uses the "Development Tools" package group, which includes:
 * - GCC (GNU Compiler Collection) for C
 * - G++ for C++
 * - Make for build automation
 * - autoconf, automake, and related utilities
 *
 * The function automatically detects whether to use DNF (AL2023) or YUM (AL2).
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if gcc and make are already installed
  if (isGccInstalled() && isMakeInstalled()) {
    console.log('Development Tools appear to be already installed, skipping...');
    return;
  }

  console.log('Installing Development Tools...');

  // Detect which package manager is available (dnf for AL2023, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const packageManager = hasDnf ? 'dnf' : 'yum';

  console.log(`Using ${packageManager} package manager...`);

  // Install the Development Tools group
  // Note: The grub2-common warning in AL2023 Docker containers can be safely ignored
  const installResult = await shell.exec(`sudo ${packageManager} groupinstall -y "Development Tools"`);
  if (installResult.code !== 0) {
    throw new Error(`Failed to install Development Tools: ${installResult.stderr}`);
  }

  // Verify installation succeeded
  if (!isGccInstalled() || !isMakeInstalled()) {
    throw new Error('Installation completed but gcc or make not found in PATH.');
  }

  console.log('Development Tools installed successfully.');
}

/**
 * Install Visual Studio Build Tools on Windows using Chocolatey.
 *
 * On Windows, build essential tools are provided by Visual Studio Build Tools
 * with the Visual C++ workload. This includes:
 * - MSVC compiler (cl.exe)
 * - Linker (link.exe)
 * - Windows SDK headers and libraries
 * - nmake for build automation
 *
 * Note: Installation typically takes 10-20 minutes and requires approximately
 * 5-8 GB of disk space. A system reboot may be required after installation.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if Chocolatey is installed
  if (!choco.isInstalled()) {
    throw new Error('Chocolatey is not installed. Please install Chocolatey first: https://chocolatey.org/install');
  }

  // Check if Visual Studio Build Tools are already installed
  const buildToolsInstalled = await choco.isPackageInstalled('visualstudio2022buildtools');
  const vcToolsInstalled = await choco.isPackageInstalled('visualstudio2022-workload-vctools');

  if (buildToolsInstalled && vcToolsInstalled) {
    console.log('Visual Studio Build Tools are already installed, skipping...');
    return;
  }

  console.log('Installing Visual Studio Build Tools...');
  console.log('Note: This may take 10-20 minutes and requires approximately 5-8 GB of disk space.');

  // Install Visual Studio 2022 Build Tools base package
  if (!buildToolsInstalled) {
    console.log('Installing Visual Studio 2022 Build Tools...');
    const buildToolsResult = await choco.install('visualstudio2022buildtools');
    if (!buildToolsResult.success) {
      throw new Error(`Failed to install Visual Studio Build Tools: ${buildToolsResult.output}`);
    }
  }

  // Install the C++ build tools workload with recommended components
  if (!vcToolsInstalled) {
    console.log('Installing C++ build tools workload...');
    const vcToolsResult = await shell.exec('choco install visualstudio2022-workload-vctools -y --package-parameters "--includeRecommended"', { timeout: 1200000 }); // 20 minute timeout
    if (vcToolsResult.code !== 0) {
      throw new Error(`Failed to install C++ workload: ${vcToolsResult.stderr}`);
    }
  }

  console.log('Visual Studio Build Tools installed successfully.');
  console.log('Note: Use "Developer Command Prompt for VS 2022" or "Developer PowerShell for VS 2022" to access the build tools.');
}

/**
 * Install build-essential on Ubuntu running in WSL.
 *
 * WSL Ubuntu installations follow the same process as native Ubuntu, using APT.
 * The build-essential package provides all necessary compilation tools.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same installation process as native Ubuntu
  // Check if build-essential is already installed by verifying gcc and make
  if (isGccInstalled() && isMakeInstalled()) {
    // Double-check by querying dpkg for the package
    const packageInstalled = await apt.isPackageInstalled('build-essential');
    if (packageInstalled) {
      console.log('build-essential is already installed, skipping...');
      return;
    }
  }

  console.log('Installing build-essential via APT (WSL)...');

  // Update package lists first to ensure we have the latest package information
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package lists: ${updateResult.stderr}`);
  }

  // Install build-essential with non-interactive mode and auto-confirm
  console.log('Installing build-essential package...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential');
  if (installResult.code !== 0) {
    throw new Error(`Failed to install build-essential: ${installResult.stderr}`);
  }

  // Verify installation succeeded
  if (!isGccInstalled() || !isMakeInstalled()) {
    throw new Error('Installation completed but gcc or make not found in PATH.');
  }

  console.log('build-essential installed successfully.');
}

/**
 * Install build tools on Git Bash using MSYS2/MinGW.
 *
 * Git Bash is a terminal emulator that does not include its own compiler.
 * This function provides information about installing MSYS2/MinGW toolchain,
 * which provides GCC-based compilation tools that work well from Git Bash.
 *
 * Note: Due to the complexity of MSYS2 installation (requires downloading
 * an installer and running it), this function provides guidance rather than
 * fully automated installation.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Build essential tools for Git Bash is not available for automated installation.');
  console.log('');
  console.log('To install build tools for Git Bash, you have two options:');
  console.log('');
  console.log('Option 1: Use Visual Studio Build Tools (recommended for Windows development)');
  console.log('  Run this installer on Windows (not Git Bash): dev install build-essential');
  console.log('');
  console.log('Option 2: Install MSYS2/MinGW toolchain manually');
  console.log('  1. Download MSYS2 from https://www.msys2.org/');
  console.log('  2. Open MSYS2 MINGW64 terminal and run:');
  console.log('     pacman -Syu --noconfirm');
  console.log('     pacman -S --noconfirm --needed mingw-w64-x86_64-toolchain');
  console.log('  3. Add to your ~/.bashrc:');
  console.log('     export PATH="/c/msys64/mingw64/bin:$PATH"');
  return;
}

// -----------------------------------------------------------------------------
// Eligibility Check
// -----------------------------------------------------------------------------

/**
 * Check if this installer is supported on the current platform.
 *
 * Build essential tools can be installed on:
 * - macOS (Xcode Command Line Tools)
 * - Ubuntu/Debian (build-essential package via APT)
 * - Raspberry Pi OS (build-essential package via APT)
 * - Amazon Linux/RHEL/Fedora (Development Tools group via DNF/YUM)
 * - Windows (Visual Studio Build Tools via Chocolatey)
 * - WSL (build-essential package via APT)
 *
 * Note: Git Bash provides guidance only (no automated install)
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows'].includes(platform.type);
}

// -----------------------------------------------------------------------------
// Main Installation Entry Point
// -----------------------------------------------------------------------------

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically detects the current platform using the os.detect()
 * utility and dispatches to the appropriate platform-specific installation function.
 *
 * Supported platforms:
 * - macos: Xcode Command Line Tools
 * - ubuntu/debian: build-essential package via APT
 * - raspbian: build-essential package via APT
 * - amazon_linux/rhel/fedora: Development Tools group via DNF/YUM
 * - windows: Visual Studio Build Tools via Chocolatey
 * - wsl: build-essential package via APT
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installation functions
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
  };

  // Find the appropriate installer for this platform
  const installer = installers[platform.type];

  // Handle unsupported platforms gracefully (no error, just a message)
  if (!installer) {
    console.log(`Build essential tools are not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
  await installer();
}

// -----------------------------------------------------------------------------
// Module Exports
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Direct Execution Handler
// -----------------------------------------------------------------------------

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
