#!/usr/bin/env node

/**
 * @fileoverview Install Development Tools across supported platforms.
 *
 * Development tools are the foundational compilation utilities required to
 * build software from source code. This includes compilers (GCC, Clang, MSVC),
 * GNU Make for build automation, and related development utilities.
 *
 * These tools are essential for:
 * - Compiling open-source software from source
 * - Installing native Node.js modules (via node-gyp)
 * - Building Python packages with C extensions
 * - Developing C/C++ applications
 * - Working with most software development toolchains
 *
 * Platform-specific packages:
 * - macOS: Xcode Command Line Tools (provides Clang/Apple LLVM and Make)
 * - Ubuntu/Debian/Raspbian: build-essential meta-package (provides GCC, G++, Make)
 * - Amazon Linux/RHEL: "Development Tools" group package (provides GCC, G++, Make, autotools)
 * - Windows: Visual Studio Build Tools with C++ workload (provides MSVC, nmake)
 * - WSL: build-essential (same as Ubuntu)
 * - Git Bash: Manual MSYS2/MinGW installation guidance
 *
 * @module installs/development-tools
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
 * GCC (GNU Compiler Collection) is the primary indicator that build tools
 * are installed on most Unix-like systems.
 *
 * @returns {boolean} - True if the gcc command exists in PATH
 */
function isGccInstalled() {
  return shell.commandExists('gcc');
}

/**
 * Checks if Make is available in the system PATH.
 * Make is a core build automation tool included with development tools packages.
 * It reads Makefiles to compile and link programs.
 *
 * @returns {boolean} - True if the make command exists in PATH
 */
function isMakeInstalled() {
  return shell.commandExists('make');
}

/**
 * Checks if Xcode Command Line Tools are installed on macOS.
 * Uses xcode-select to verify that the installation path exists.
 * The path is typically /Library/Developer/CommandLineTools.
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
 * Install development tools on macOS using Xcode Command Line Tools.
 *
 * Xcode Command Line Tools provide:
 * - Clang (Apple's LLVM-based C/C++ compiler, invoked as 'gcc' and 'g++')
 * - Make (GNU Make for build automation)
 * - Git (version control)
 * - Other essential development utilities
 *
 * The installation uses a non-interactive method via Apple's softwareupdate
 * command to avoid the GUI dialog that `xcode-select --install` would trigger.
 * This makes the installer suitable for automation and CI/CD pipelines.
 *
 * Installation time: 5-15 minutes depending on internet connection.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails or Command Line Tools package cannot be found
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

  // Create a placeholder file that triggers softwareupdate to list CLI tools.
  // This is a documented trick that makes Command Line Tools appear in the
  // available updates list without requiring the GUI installation dialog.
  const touchResult = await shell.exec('touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress');
  if (touchResult.code !== 0) {
    throw new Error('Failed to create placeholder file for Xcode CLI tools installation.');
  }

  // Find the latest Command Line Tools package name from softwareupdate.
  // The output contains lines like "Label: Command Line Tools for Xcode-15.3"
  // We extract just the package name for use with softwareupdate -i
  const listResult = await shell.exec('softwareupdate -l 2>/dev/null | grep -o ".*Command Line Tools.*" | tail -n 1 | sed "s/^[[:space:]]*//" | sed "s/^Label: //"');

  if (listResult.code !== 0 || !listResult.stdout.trim()) {
    // Clean up placeholder file before throwing
    await shell.exec('rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress');
    throw new Error('Could not find Command Line Tools package. Try downloading directly from https://developer.apple.com/download/all/?q=command%20line%20tools');
  }

  const packageName = listResult.stdout.trim();
  console.log(`Found package: ${packageName}`);

  // Install the package using softwareupdate.
  // The --verbose flag shows progress during the download and installation.
  // Timeout is set to 15 minutes (900000ms) to accommodate slow connections.
  const installResult = await shell.exec(`softwareupdate -i "${packageName}" --verbose`, { timeout: 900000 });

  // Clean up the placeholder file regardless of installation outcome
  await shell.exec('rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress');

  if (installResult.code !== 0) {
    throw new Error(`Installation failed: ${installResult.stderr || 'Unknown error'}`);
  }

  // Verify installation succeeded by checking if xcode-select reports a path
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
 * - GCC (GNU Compiler Collection) for C compilation
 * - G++ (GNU C++ Compiler) for C++ compilation
 * - Make (GNU Make) for build automation
 * - libc6-dev (C library development headers)
 * - dpkg-dev (Debian package development tools)
 *
 * The DEBIAN_FRONTEND=noninteractive environment variable prevents
 * any interactive prompts during installation, making this suitable
 * for automated scripts.
 *
 * @returns {Promise<void>}
 * @throws {Error} If package update or installation fails
 */
async function install_ubuntu() {
  // Check if build-essential is already installed by verifying gcc and make
  if (isGccInstalled() && isMakeInstalled()) {
    // Double-check by querying dpkg for the actual package
    const packageInstalled = await apt.isPackageInstalled('build-essential');
    if (packageInstalled) {
      console.log('build-essential is already installed, skipping...');
      return;
    }
  }

  console.log('Installing build-essential via APT...');

  // Update package lists first to ensure we have the latest package information.
  // This is important because package versions and availability can change.
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package lists: ${updateResult.stderr}`);
  }

  // Install build-essential with non-interactive mode and auto-confirm.
  // The -y flag automatically answers "yes" to confirmation prompts.
  console.log('Installing build-essential package...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential');
  if (installResult.code !== 0) {
    throw new Error(`Failed to install build-essential: ${installResult.stderr}`);
  }

  // Verify installation succeeded by checking for the core tools
  if (!isGccInstalled() || !isMakeInstalled()) {
    throw new Error('Installation completed but gcc or make not found in PATH.');
  }

  console.log('build-essential installed successfully.');
}

/**
 * Install build-essential on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so the installation process is identical
 * to Ubuntu/Debian. The build-essential package includes ARM-compatible versions
 * of all tools (both 32-bit armhf and 64-bit arm64 architectures).
 *
 * Note: Installation may take longer on Raspberry Pi compared to desktop systems
 * due to slower I/O (SD card) and processor speeds. Allow 5-10 minutes on older
 * Pi models (Pi 3, Zero 2 W).
 *
 * @returns {Promise<void>}
 * @throws {Error} If package update or installation fails
 */
async function install_raspbian() {
  // Check if build-essential is already installed by verifying gcc and make
  if (isGccInstalled() && isMakeInstalled()) {
    // Double-check by querying dpkg for the actual package
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

  // Verify installation succeeded by checking for the core tools
  if (!isGccInstalled() || !isMakeInstalled()) {
    throw new Error('Installation completed but gcc or make not found in PATH.');
  }

  console.log('build-essential installed successfully.');
}

/**
 * Install Development Tools on Amazon Linux/RHEL using DNF or YUM.
 *
 * Amazon Linux and RHEL use the "Development Tools" package group, which includes:
 * - GCC (GNU Compiler Collection) for C compilation
 * - G++ (gcc-c++) for C++ compilation
 * - Make (GNU Make) for build automation
 * - autoconf and automake (GNU build system generators)
 * - patch (file patching utility)
 * - rpm-build (RPM package building tools)
 *
 * The function automatically detects which package manager is available:
 * - DNF is used on Amazon Linux 2023 and RHEL 8+
 * - YUM is used on Amazon Linux 2 and RHEL 7
 *
 * Note: In Docker containers running AL2023, you may see a warning about the
 * grub2-common package. This warning can be safely ignored.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  // Check if gcc and make are already installed
  if (isGccInstalled() && isMakeInstalled()) {
    console.log('Development Tools appear to be already installed, skipping...');
    return;
  }

  console.log('Installing Development Tools...');

  // Detect which package manager is available.
  // DNF (Dandified YUM) is the modern package manager used in AL2023 and RHEL 8+.
  // YUM (Yellowdog Updater Modified) is used in older versions like AL2.
  const hasDnf = shell.commandExists('dnf');
  const packageManager = hasDnf ? 'dnf' : 'yum';

  console.log(`Using ${packageManager} package manager...`);

  // Install the Development Tools group.
  // The groupinstall command installs an entire package group at once.
  // The -y flag automatically confirms the installation.
  const installResult = await shell.exec(`sudo ${packageManager} groupinstall -y "Development Tools"`);
  if (installResult.code !== 0) {
    throw new Error(`Failed to install Development Tools: ${installResult.stderr}`);
  }

  // Verify installation succeeded by checking for the core tools
  if (!isGccInstalled() || !isMakeInstalled()) {
    throw new Error('Installation completed but gcc or make not found in PATH.');
  }

  console.log('Development Tools installed successfully.');
}

/**
 * Install Visual Studio Build Tools on Windows using Chocolatey.
 *
 * On Windows, development tools are provided by Visual Studio Build Tools
 * with the Visual C++ workload. This includes:
 * - MSVC compiler (cl.exe) - Microsoft's C/C++ compiler
 * - Linker (link.exe) - Links object files into executables
 * - Windows SDK headers and libraries
 * - nmake (Microsoft Program Maintenance Utility) - Similar to GNU Make
 * - CMake (build system generator)
 * - Visual C++ runtime libraries
 *
 * Requirements:
 * - Windows 10 or Windows 11 (64-bit)
 * - Administrator privileges
 * - Chocolatey package manager installed
 * - At least 5-8 GB free disk space
 *
 * Installation time: 10-20 minutes. A system reboot may be required.
 *
 * IMPORTANT: After installation, use "Developer Command Prompt for VS 2022"
 * or "Developer PowerShell for VS 2022" to access the build tools, as they
 * set up the necessary environment variables.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  // Check if Chocolatey is installed - it's required for this installation method
  if (!choco.isInstalled()) {
    throw new Error('Chocolatey is not installed. Please install Chocolatey first: https://chocolatey.org/install');
  }

  // Check if Visual Studio Build Tools are already installed via Chocolatey
  const buildToolsInstalled = await choco.isPackageInstalled('visualstudio2022buildtools');
  const vcToolsInstalled = await choco.isPackageInstalled('visualstudio2022-workload-vctools');

  if (buildToolsInstalled && vcToolsInstalled) {
    console.log('Visual Studio Build Tools are already installed, skipping...');
    return;
  }

  console.log('Installing Visual Studio Build Tools...');
  console.log('Note: This may take 10-20 minutes and requires approximately 5-8 GB of disk space.');

  // Install Visual Studio 2022 Build Tools base package.
  // This is the foundation that the C++ workload builds upon.
  if (!buildToolsInstalled) {
    console.log('Installing Visual Studio 2022 Build Tools...');
    const buildToolsResult = await choco.install('visualstudio2022buildtools');
    if (!buildToolsResult.success) {
      throw new Error(`Failed to install Visual Studio Build Tools: ${buildToolsResult.output}`);
    }
  }

  // Install the C++ build tools workload with recommended components.
  // The --package-parameters "--includeRecommended" flag ensures we get
  // all commonly needed components like Windows SDK, CMake, etc.
  // Timeout is set to 20 minutes (1200000ms) for large download/install.
  if (!vcToolsInstalled) {
    console.log('Installing C++ build tools workload...');
    const vcToolsResult = await shell.exec('choco install visualstudio2022-workload-vctools -y --package-parameters "--includeRecommended"', { timeout: 1200000 });
    if (vcToolsResult.code !== 0) {
      throw new Error(`Failed to install C++ workload: ${vcToolsResult.stderr}`);
    }
  }

  console.log('Visual Studio Build Tools installed successfully.');
  console.log('Note: Use "Developer Command Prompt for VS 2022" or "Developer PowerShell for VS 2022" to access the build tools.');
}

/**
 * Install build-essential on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL Ubuntu installations follow the same process as native Ubuntu, using APT.
 * The build-essential package provides all necessary compilation tools within
 * the WSL environment.
 *
 * Note: These tools are for compiling within WSL. If you need Windows-native
 * build tools, install Visual Studio Build Tools on the Windows host instead.
 *
 * @returns {Promise<void>}
 * @throws {Error} If package update or installation fails
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same installation process as native Ubuntu
  // Check if build-essential is already installed by verifying gcc and make
  if (isGccInstalled() && isMakeInstalled()) {
    // Double-check by querying dpkg for the actual package
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

  // Verify installation succeeded by checking for the core tools
  if (!isGccInstalled() || !isMakeInstalled()) {
    throw new Error('Installation completed but gcc or make not found in PATH.');
  }

  console.log('build-essential installed successfully.');
}

/**
 * Provide guidance for installing development tools on Git Bash.
 *
 * Git Bash is a terminal emulator that provides a Unix-like command-line
 * experience on Windows, but it does not include its own compiler. To get
 * GCC and Make that work seamlessly with Git Bash, users need to either:
 *
 * 1. Install Visual Studio Build Tools on Windows (recommended for Windows dev)
 * 2. Install MSYS2/MinGW toolchain manually (provides GCC-based tools)
 *
 * Due to the complexity of MSYS2 installation (requires downloading an
 * installer and running pacman commands), this function provides guidance
 * rather than fully automated installation.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Git Bash does not support automated installation of build tools.
  // We provide helpful guidance instead of failing with an error.
  console.log('Development tools for Git Bash is not available for automated installation.');
  console.log('');
  console.log('To install development tools for Git Bash, you have two options:');
  console.log('');
  console.log('Option 1: Use Visual Studio Build Tools (recommended for Windows development)');
  console.log('  Run this installer on Windows (not Git Bash): dev install development-tools');
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
// Installation Check
// -----------------------------------------------------------------------------

/**
 * Check if development tools are currently installed on the system.
 *
 * This function checks for development tools across all supported platforms:
 * - macOS: Checks for Xcode Command Line Tools via xcode-select
 * - Ubuntu/Debian/Raspbian/WSL: Checks for build-essential (gcc and make)
 * - Amazon Linux/RHEL/Fedora: Checks for Development Tools (gcc and make)
 * - Windows: Checks for Visual Studio Build Tools via Chocolatey
 *
 * @returns {Promise<boolean>} True if development tools are installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    return await isXcodeCliInstalled();
  }

  if (platform.type === 'windows') {
    // Check for Visual Studio Build Tools via Chocolatey
    const buildToolsInstalled = await choco.isPackageInstalled('visualstudio2022buildtools');
    const vcToolsInstalled = await choco.isPackageInstalled('visualstudio2022-workload-vctools');
    return buildToolsInstalled && vcToolsInstalled;
  }

  // Linux platforms: Check if gcc and make are available
  return isGccInstalled() && isMakeInstalled();
}

// -----------------------------------------------------------------------------
// Eligibility Check
// -----------------------------------------------------------------------------

/**
 * Check if this installer is supported on the current platform.
 *
 * Development tools can be installed on:
 * - macOS (Xcode Command Line Tools via softwareupdate)
 * - Ubuntu/Debian (build-essential package via APT)
 * - Raspberry Pi OS (build-essential package via APT)
 * - Amazon Linux/RHEL/Fedora (Development Tools group via DNF/YUM)
 * - Windows (Visual Studio Build Tools via Chocolatey)
 * - WSL (build-essential package via APT)
 *
 * Note: Git Bash only provides guidance (no automated install)
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
 * Supported platforms and their installers:
 * - macos: Xcode Command Line Tools via softwareupdate
 * - ubuntu/debian: build-essential package via APT
 * - raspbian: build-essential package via APT (ARM-compatible)
 * - amazon_linux/rhel/fedora: "Development Tools" group via DNF/YUM
 * - windows: Visual Studio Build Tools via Chocolatey
 * - wsl: build-essential package via APT (within WSL environment)
 * - gitbash: Manual installation guidance (no automated install)
 *
 * For unsupported platforms, a friendly message is displayed and the function
 * returns gracefully without throwing an error.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installation functions.
  // Some platforms share the same installer (e.g., debian uses install_ubuntu).
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
    'gitbash': install_gitbash,
  };

  // Find the appropriate installer for this platform
  const installer = installers[platform.type];

  // Handle unsupported platforms gracefully (no error, just a message)
  if (!installer) {
    console.log(`Development tools are not available for ${platform.type}.`);
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

// -----------------------------------------------------------------------------
// Direct Execution Handler
// -----------------------------------------------------------------------------

// Allow the script to be run directly: node development-tools.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
