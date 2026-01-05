#!/usr/bin/env node

/**
 * @fileoverview Install woff2 - Google's reference implementation of WOFF2 font compression.
 *
 * woff2 provides tools for compressing and decompressing Web Open Font Format 2.0 files.
 * WOFF2 uses the Brotli compression algorithm to achieve significantly better compression
 * ratios than the original WOFF 1.0 format, typically reducing font file sizes by 30%
 * compared to WOFF 1.0 and up to 50-70% compared to uncompressed TTF/OTF fonts.
 *
 * Included tools:
 * - woff2_compress: Convert TTF/OTF fonts to WOFF2 format
 * - woff2_decompress: Convert WOFF2 files back to TTF format
 * - woff2_info: Display metadata and file information
 *
 * @module installs/woff2
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');

/**
 * Check if woff2 tools are installed by verifying the woff2_compress command exists.
 *
 * We check for woff2_compress as it is the primary tool installed by the woff2 package.
 * If this command exists, the other tools (woff2_decompress, woff2_info) should also
 * be available.
 *
 * @returns {boolean} True if woff2_compress command is available, false otherwise
 */
function isWoff2Installed() {
  return shell.commandExists('woff2_compress');
}

/**
 * Get the installed woff2 version by running woff2_compress --version.
 *
 * The version output format is typically: "woff2_compress 1.0.2"
 *
 * @returns {Promise<string|null>} The version string if installed, null otherwise
 */
async function getWoff2Version() {
  // First check if the command exists to avoid unnecessary process spawning
  if (!isWoff2Installed()) {
    return null;
  }

  // Execute woff2_compress --version to get version information
  const result = await shell.exec('woff2_compress --version');
  if (result.code === 0 && result.stdout) {
    // Parse version from output like: "woff2_compress 1.0.2"
    const match = result.stdout.match(/woff2_compress\s+([^\s]+)/);
    return match ? match[1] : result.stdout.split('\n')[0].trim();
  }
  return null;
}

/**
 * Install woff2 on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later
 * - Homebrew package manager installed
 * - Xcode Command Line Tools installed
 *
 * Homebrew automatically installs the required brotli dependency if it is not
 * already present on the system.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if woff2 is already installed...');

  // Check if woff2 is already installed by verifying the command exists
  const existingVersion = await getWoff2Version();
  if (existingVersion) {
    console.log(`woff2 ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Also check if the formula is installed via Homebrew
  // (woff2 may be installed but not in PATH for some reason)
  const formulaInstalled = await brew.isFormulaInstalled('woff2');
  if (formulaInstalled) {
    console.log('woff2 is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('NOTE: If woff2 commands are not working, check your PATH.');
    console.log('Run: brew info woff2');
    return;
  }

  // Verify Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Install woff2 using Homebrew with the --quiet flag for cleaner output
  // This makes the command more suitable for automation scripts
  console.log('Installing woff2 via Homebrew...');
  const result = await brew.install('woff2');

  if (!result.success) {
    console.log('Failed to install woff2 via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  const version = await getWoff2Version();
  if (!version) {
    console.log('Installation may have failed: woff2_compress command not found after install.');
    console.log('');
    console.log('Please try:');
    console.log('  1. Restart your terminal session');
    console.log('  2. Run: woff2_compress --version');
    return;
  }

  console.log(`woff2 ${version} installed successfully.`);
  console.log('');
  console.log('Installed tools:');
  console.log('  - woff2_compress: Convert TTF/OTF to WOFF2');
  console.log('  - woff2_decompress: Convert WOFF2 back to TTF');
  console.log('  - woff2_info: Display WOFF2 file information');
  console.log('');
  console.log('Verify installation with: woff2_compress --version');
}

/**
 * Install woff2 on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
 * - sudo privileges
 * - At least 50 MB free disk space
 *
 * The woff2 package includes three command-line utilities: woff2_compress,
 * woff2_decompress, and woff2_info. All dependencies are handled automatically
 * by APT.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if woff2 is already installed...');

  // Check if woff2 is already installed by looking for the command
  const existingVersion = await getWoff2Version();
  if (existingVersion) {
    console.log(`woff2 ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Update package lists before installing to ensure we get the latest available version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install woff2 using APT
  // The apt.install function uses DEBIAN_FRONTEND=noninteractive and -y flag
  // to ensure fully automated installation without prompts
  console.log('Installing woff2 via APT...');
  const result = await apt.install('woff2');

  if (!result.success) {
    console.log('Failed to install woff2 via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const version = await getWoff2Version();
  if (!version) {
    console.log('Installation may have failed: woff2_compress command not found after install.');
    console.log('');
    console.log('Please try:');
    console.log('  1. Restart your terminal session');
    console.log('  2. Run: woff2_compress --version');
    return;
  }

  console.log(`woff2 ${version} installed successfully.`);
  console.log('');
  console.log('Installed tools:');
  console.log('  - woff2_compress: Convert TTF/OTF to WOFF2');
  console.log('  - woff2_decompress: Convert WOFF2 back to TTF');
  console.log('  - woff2_info: Display WOFF2 file information');
  console.log('');
  console.log('Verify installation with: woff2_compress --version');
}

/**
 * Install woff2 on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 *
 * WSL provides a full Linux environment, allowing use of the native Ubuntu
 * package. The installation process is identical to native Ubuntu.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();

  // Add WSL-specific usage notes after installation
  console.log('');
  console.log('WSL NOTES:');
  console.log('  - Access Windows files through /mnt/c/, /mnt/d/, etc.');
  console.log('  - Example: woff2_compress /mnt/c/Users/You/Fonts/myfont.ttf');
  console.log('  - Output will be created in the same directory as the input file');
}

/**
 * Install woff2 on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (Bookworm or Bullseye), 32-bit or 64-bit
 * - Raspberry Pi 3 or later recommended
 * - sudo privileges
 * - At least 50 MB free disk space
 *
 * Raspberry Pi OS is based on Debian, so the installation process uses APT.
 * The woff2 package is available for both ARM architectures (arm64, armhf).
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if woff2 is already installed...');

  // Check if woff2 is already installed by looking for the command
  const existingVersion = await getWoff2Version();
  if (existingVersion) {
    console.log(`woff2 ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Update package lists before installing
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install woff2 using APT - same process as Ubuntu/Debian
  console.log('Installing woff2 via APT...');
  const result = await apt.install('woff2');

  if (!result.success) {
    console.log('Failed to install woff2 via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded
  const version = await getWoff2Version();
  if (!version) {
    console.log('Installation may have failed: woff2_compress command not found after install.');
    console.log('');
    console.log('Please try:');
    console.log('  1. Restart your terminal session');
    console.log('  2. Run: woff2_compress --version');
    return;
  }

  console.log(`woff2 ${version} installed successfully.`);
  console.log('');
  console.log('Installed tools:');
  console.log('  - woff2_compress: Convert TTF/OTF to WOFF2');
  console.log('  - woff2_decompress: Convert WOFF2 back to TTF');
  console.log('  - woff2_info: Display WOFF2 file information');
  console.log('');
  console.log('RASPBERRY PI NOTES:');
  console.log('  - Font compression is CPU-intensive');
  console.log('  - On older Pi models, expect longer processing times for large fonts');
  console.log('');
  console.log('Verify installation with: woff2_compress --version');
}

/**
 * Install woff2 on Amazon Linux by compiling from source.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - sudo privileges
 * - Development tools for compiling (gcc-c++, cmake, git)
 * - At least 200 MB free disk space
 *
 * IMPORTANT: woff2 is NOT available in the standard Amazon Linux repositories.
 * This function compiles from source using the official Google woff2 repository.
 * The build process uses the bundled brotli submodule for compression.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if woff2 is already installed...');

  // Check if woff2 is already installed by looking for the command
  const existingVersion = await getWoff2Version();
  if (existingVersion) {
    console.log(`woff2 ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Detect the platform to determine which package manager and cmake command to use
  // Amazon Linux 2023 uses dnf and cmake, Amazon Linux 2 uses yum and cmake3
  const platform = os.detect();
  const packageManager = platform.packageManager;
  const cmakeCommand = packageManager === 'dnf' ? 'cmake' : 'cmake3';

  // Step 1: Install build dependencies
  console.log('Installing build dependencies...');
  let installDepsCommand;
  if (packageManager === 'dnf') {
    // Amazon Linux 2023 - use dnf and install brotli-devel for system brotli
    installDepsCommand = 'sudo dnf install -y gcc-c++ cmake git brotli-devel';
  } else {
    // Amazon Linux 2 - use yum, brotli-devel is not available so we use bundled
    installDepsCommand = 'sudo yum install -y gcc-c++ cmake3 git';
  }

  const depsResult = await shell.exec(installDepsCommand);
  if (depsResult.code !== 0) {
    console.log('Failed to install build dependencies.');
    console.log(depsResult.stderr || depsResult.stdout);
    return;
  }

  // Step 2: Clone the source repository with submodules
  // The --recursive flag ensures the brotli submodule is also cloned
  console.log('Cloning woff2 source repository...');
  const cloneResult = await shell.exec('cd /tmp && rm -rf woff2 && git clone --recursive https://github.com/google/woff2.git');
  if (cloneResult.code !== 0) {
    console.log('Failed to clone woff2 repository.');
    console.log(cloneResult.stderr || cloneResult.stdout);
    return;
  }

  // Step 3: Build the tools using CMake
  console.log('Building woff2 from source...');
  const buildCommands = `cd /tmp/woff2 && mkdir -p out && cd out && ${cmakeCommand} .. && make -j$(nproc)`;
  const buildResult = await shell.exec(buildCommands);
  if (buildResult.code !== 0) {
    console.log('Failed to build woff2.');
    console.log(buildResult.stderr || buildResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure all build dependencies are installed');
    console.log('  2. Check available disk space');
    console.log('  3. Try building manually in /tmp/woff2');
    return;
  }

  // Step 4: Install the binaries to /usr/local/bin
  console.log('Installing woff2 binaries...');
  const installResult = await shell.exec('cd /tmp/woff2/out && sudo make install');
  if (installResult.code !== 0) {
    console.log('Failed to install woff2 binaries.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Step 5: Update the library cache so the shared libraries are found
  console.log('Updating library cache...');
  await shell.exec('sudo ldconfig');

  // Step 6: Clean up the source directory
  console.log('Cleaning up build files...');
  await shell.exec('rm -rf /tmp/woff2');

  // Verify the installation succeeded
  const version = await getWoff2Version();
  if (!version) {
    console.log('Installation may have failed: woff2_compress command not found after install.');
    console.log('');
    console.log('Ensure /usr/local/bin is in your PATH:');
    console.log('  echo \'export PATH="/usr/local/bin:$PATH"\' >> ~/.bashrc && source ~/.bashrc');
    console.log('');
    console.log('If you see shared library errors, run:');
    console.log('  sudo ldconfig');
    return;
  }

  console.log(`woff2 ${version} installed successfully.`);
  console.log('');
  console.log('Installation location: /usr/local/bin/');
  console.log('');
  console.log('Installed tools:');
  console.log('  - woff2_compress: Convert TTF/OTF to WOFF2');
  console.log('  - woff2_decompress: Convert WOFF2 back to TTF');
  console.log('  - woff2_info: Display WOFF2 file information');
  console.log('');
  console.log('Verify installation with: woff2_compress --version');
}

/**
 * Install woff2 on Windows.
 *
 * woff2 is NOT available as a Chocolatey or winget package. Building from
 * source on Windows requires Visual Studio Build Tools and is complex.
 *
 * For Windows users, the recommended approach is to use WSL (Windows Subsystem
 * for Linux) where woff2 can be installed easily via APT.
 *
 * This function provides a graceful message rather than attempting a complex
 * source build that may fail.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // woff2 requires compilation from source on Windows, which is complex
  // and requires Visual Studio Build Tools. We provide a graceful message
  // directing users to WSL as the recommended alternative.
  console.log('woff2 is not available as a pre-built package for Windows.');
  console.log('');
  console.log('For Windows users, the recommended approach is to use WSL:');
  console.log('  1. Install WSL: wsl --install');
  console.log('  2. Open Ubuntu in WSL');
  console.log('  3. Run: dev install woff2');
  console.log('');
  console.log('You can then use woff2 from WSL to process fonts on your Windows filesystem');
  console.log('by accessing files through /mnt/c/, /mnt/d/, etc.');
  return;
}

/**
 * Install woff2 in Git Bash on Windows.
 *
 * Git Bash runs in a MinGW environment on Windows. Compiling woff2 natively
 * in MinGW is complex due to build tool requirements.
 *
 * The recommended approach is to use WSL from within Git Bash, where woff2
 * can be installed easily via APT.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Git Bash cannot easily compile woff2 from source
  // Recommend using WSL instead
  console.log('woff2 is not available for Git Bash.');
  console.log('');
  console.log('For Git Bash users, the recommended approach is to use WSL:');
  console.log('  1. Install WSL from PowerShell: wsl --install');
  console.log('  2. Install woff2 in WSL: wsl sudo apt-get install -y woff2');
  console.log('  3. Use woff2 from Git Bash via WSL: wsl woff2_compress /mnt/c/path/to/font.ttf');
  console.log('');
  console.log('You can create wrapper scripts in ~/bin to call WSL commands seamlessly.');
  return;
}

/**
 * Check if this installer is supported on the current platform.
 * woff2 is supported on all Unix-like platforms. Windows and Git Bash users
 * should use WSL for woff2 functionality.
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
 * appropriate platform-specific installer function.
 *
 * Supported platforms:
 * - macOS: Install via Homebrew
 * - Ubuntu/Debian: Install via APT
 * - Ubuntu on WSL: Install via APT within WSL
 * - Raspberry Pi OS: Install via APT
 * - Amazon Linux/RHEL: Compile from source
 * - Windows: Graceful message (recommend WSL)
 * - Git Bash: Graceful message (recommend WSL)
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
    console.log(`woff2 is not available for ${platform.type}.`);
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
