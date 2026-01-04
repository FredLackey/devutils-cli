#!/usr/bin/env node

/**
 * @fileoverview Install sfnt2woff - a command-line utility for converting TrueType
 * and OpenType fonts (TTF/OTF) to Web Open Font Format (WOFF).
 *
 * sfnt2woff was originally developed by Jonathan Kew at Mozilla and is used by
 * web developers to compress fonts for faster web page loading while maintaining
 * visual fidelity. The tool works in conjunction with woff2sfnt, which performs
 * the reverse conversion.
 *
 * Key capabilities:
 * - Convert TTF and OTF files to WOFF format
 * - Optionally embed XML metadata in WOFF files
 * - Include private data blocks for font-specific information
 * - Apply zlib compression (typically 40-60% smaller than original)
 *
 * Note: This tool produces WOFF 1.0 files. For WOFF 2.0 (better compression),
 * use the 'woff2' tool instead.
 *
 * Platform-specific installation methods:
 * - macOS: Homebrew tap (bramstein/webfonttools) with sfnt2woff formula
 * - Ubuntu/Debian: APT package 'woff-tools'
 * - Raspberry Pi OS: APT package 'woff-tools' (ARM builds available)
 * - Amazon Linux: Compile from source (not in repositories)
 * - Windows: npm package 'sfnt2woff' (Node.js-based implementation)
 * - WSL: APT package 'woff-tools' (same as Ubuntu)
 * - Git Bash: npm package 'sfnt2woff' (Node.js-based implementation)
 *
 * @module installs/sfnt2woff
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew tap repository containing web font tools.
 * This third-party tap must be added before installing sfnt2woff.
 */
const HOMEBREW_TAP_REPOSITORY = 'bramstein/webfonttools';

/**
 * The Homebrew formula name for sfnt2woff.
 * This formula is available after adding the bramstein/webfonttools tap.
 */
const HOMEBREW_FORMULA_NAME = 'sfnt2woff';

/**
 * The APT package name that provides sfnt2woff on Debian-based systems.
 * The woff-tools package includes both sfnt2woff and woff2sfnt utilities.
 */
const APT_PACKAGE_NAME = 'woff-tools';

/**
 * The npm package name for sfnt2woff.
 * Used on Windows and Git Bash where native binaries are not easily available.
 */
const NPM_PACKAGE_NAME = 'sfnt2woff';

/**
 * The Git repository URL for building sfnt2woff from source.
 * Used on Amazon Linux where the package is not available in repositories.
 */
const SOURCE_REPOSITORY_URL = 'https://github.com/wget/sfnt2woff.git';

/**
 * Check if sfnt2woff is installed by verifying the command exists in PATH.
 *
 * This check works for natively installed versions (Homebrew, APT, compiled).
 * For npm-based installations, the command may require 'npx' to execute.
 *
 * @returns {boolean} True if sfnt2woff command is available, false otherwise
 */
function isSfnt2woffCommandAvailable() {
  return shell.commandExists('sfnt2woff');
}

/**
 * Check if woff2sfnt (the reverse conversion tool) is installed.
 *
 * woff2sfnt is typically installed alongside sfnt2woff and allows converting
 * WOFF files back to OTF/TTF format.
 *
 * @returns {boolean} True if woff2sfnt command is available, false otherwise
 */
function isWoff2sfntCommandAvailable() {
  return shell.commandExists('woff2sfnt');
}

/**
 * Check if Node.js and npm are available for npm-based installation.
 *
 * On Windows and Git Bash, sfnt2woff is installed via npm since native
 * binaries are not easily available.
 *
 * @returns {boolean} True if both node and npm commands are available
 */
function isNpmAvailable() {
  return shell.commandExists('node') && shell.commandExists('npm');
}

/**
 * Install sfnt2woff on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later
 * - Homebrew package manager installed
 * - Xcode Command Line Tools installed
 *
 * This function first adds the bramstein/webfonttools tap (a third-party
 * Homebrew repository containing web font tools) and then installs sfnt2woff.
 * The installation also includes woff2sfnt for reverse conversion.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if sfnt2woff is already installed via any method
  const isInstalled = isSfnt2woffCommandAvailable();
  if (isInstalled) {
    console.log('sfnt2woff is already installed, skipping...');
    return;
  }

  // Verify Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Add the bramstein/webfonttools tap which contains sfnt2woff
  // This is a third-party Homebrew repository maintained by Bram Stein
  console.log('Adding bramstein/webfonttools Homebrew tap...');
  const tapResult = await brew.tap(HOMEBREW_TAP_REPOSITORY);

  if (!tapResult.success) {
    console.log('Failed to add the bramstein/webfonttools tap.');
    console.log(tapResult.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Update Homebrew: brew update');
    console.log('  2. Retry adding the tap: brew tap bramstein/webfonttools');
    return;
  }

  // Install sfnt2woff using Homebrew
  // This also installs woff2sfnt (the companion tool for reverse conversion)
  console.log('Installing sfnt2woff via Homebrew...');
  const result = await brew.install(HOMEBREW_FORMULA_NAME);

  if (!result.success) {
    console.log('Failed to install sfnt2woff via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  const verified = isSfnt2woffCommandAvailable();
  if (!verified) {
    console.log('Installation may have failed: sfnt2woff command not found after install.');
    console.log('');
    console.log('Homebrew may not be in your PATH. For Apple Silicon Macs:');
    console.log('  echo \'eval "$(/opt/homebrew/bin/brew shellenv)"\' >> ~/.zshrc');
    console.log('  source ~/.zshrc');
    console.log('');
    console.log('For Intel Macs:');
    console.log('  echo \'eval "$(/usr/local/bin/brew shellenv)"\' >> ~/.zshrc');
    console.log('  source ~/.zshrc');
    return;
  }

  console.log('sfnt2woff installed successfully.');

  // Check if the companion tool woff2sfnt is also available
  if (isWoff2sfntCommandAvailable()) {
    console.log('woff2sfnt (reverse conversion tool) is also available.');
  }

  console.log('');
  console.log('Usage: sfnt2woff myfont.ttf');
  console.log('       sfnt2woff -v 1.0 -m metadata.xml myfont.otf');
}

/**
 * Install sfnt2woff on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
 * - sudo privileges
 * - At least 50 MB free disk space
 *
 * The woff-tools package is available in the default Ubuntu/Debian repositories
 * and includes both sfnt2woff (for conversion to WOFF) and woff2sfnt (for
 * conversion from WOFF).
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if sfnt2woff is already installed by looking for the command
  const isInstalled = isSfnt2woffCommandAvailable();
  if (isInstalled) {
    console.log('sfnt2woff is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest available version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install woff-tools using APT
  // The package includes both sfnt2woff and woff2sfnt utilities
  console.log('Installing woff-tools (provides sfnt2woff) via APT...');
  const result = await apt.install(APT_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install woff-tools via APT.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure the universe repository is enabled:');
    console.log('     sudo add-apt-repository -y universe');
    console.log('     sudo apt-get update');
    console.log('  2. Retry: sudo apt-get install -y woff-tools');
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = isSfnt2woffCommandAvailable();
  if (!verified) {
    console.log('Installation may have failed: sfnt2woff command not found after install.');
    return;
  }

  console.log('sfnt2woff installed successfully.');

  // Check if the companion tool woff2sfnt is also available
  if (isWoff2sfntCommandAvailable()) {
    console.log('woff2sfnt (reverse conversion tool) is also available.');
  }

  console.log('');
  console.log('Usage: sfnt2woff myfont.ttf');
  console.log('       sfnt2woff -v 1.0 -m metadata.xml myfont.otf');
}

/**
 * Install sfnt2woff on Ubuntu running in WSL.
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 *
 * WSL Ubuntu uses the same APT package repositories as native Ubuntu,
 * so the installation process is identical. The woff-tools package
 * provides both sfnt2woff and woff2sfnt utilities.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();

  // Provide WSL-specific tips after installation
  if (isSfnt2woffCommandAvailable()) {
    console.log('');
    console.log('WSL Tips:');
    console.log('  - Access Windows files via /mnt/c/Users/...');
    console.log('  - Example: sfnt2woff /mnt/c/Users/YourName/Downloads/myfont.ttf');
    console.log('  - Output file will be created in the same directory as input');
  }
}

/**
 * Install sfnt2woff on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (Bookworm or Bullseye), 32-bit or 64-bit
 * - Raspberry Pi 3 or later recommended
 * - sudo privileges
 * - At least 50 MB free disk space
 *
 * Raspberry Pi OS is based on Debian, so woff-tools installation follows
 * the same process as Ubuntu/Debian. The package is available for ARM
 * architectures (armhf, arm64).
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  // The woff-tools package is compiled natively for ARM architectures
  await install_ubuntu();

  // Provide Raspberry Pi-specific notes after installation
  if (isSfnt2woffCommandAvailable()) {
    console.log('');
    console.log('Note: Font conversion is CPU-intensive. On older Raspberry Pi');
    console.log('models (Pi 2 or earlier), expect longer processing times.');
  }
}

/**
 * Install sfnt2woff on Amazon Linux by compiling from source.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - sudo privileges
 * - Development tools (gcc, make, zlib-devel, git)
 * - At least 100 MB free disk space
 *
 * IMPORTANT: sfnt2woff is not available in the Amazon Linux repositories.
 * This function compiles it from source using the original Mozilla codebase
 * maintained on GitHub.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if sfnt2woff is already installed
  const isInstalled = isSfnt2woffCommandAvailable();
  if (isInstalled) {
    console.log('sfnt2woff is already installed, skipping...');
    return;
  }

  // Detect the package manager (dnf for AL2023, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    console.log('Neither dnf nor yum package manager found.');
    console.log('This installer supports Amazon Linux 2023 (dnf) and Amazon Linux 2 (yum).');
    return;
  }

  console.log(`Detected package manager: ${packageManager}`);
  console.log('');
  console.log('sfnt2woff is not available in Amazon Linux repositories.');
  console.log('Compiling from source...');
  console.log('');

  // Install build dependencies required for compilation
  // gcc: C compiler
  // make: Build automation tool
  // zlib-devel: Compression library headers (required for WOFF compression)
  // git: For cloning the source repository
  console.log('Installing build dependencies...');
  const installDepsCommand = `sudo ${packageManager} install -y gcc make zlib-devel git`;
  const depsResult = await shell.exec(installDepsCommand);

  if (depsResult.code !== 0) {
    console.log('Failed to install build dependencies.');
    console.log(depsResult.stderr || depsResult.stdout);
    return;
  }

  // Clone the sfnt2woff source repository to a temporary directory
  console.log('Cloning sfnt2woff source repository...');
  const cloneCommand = `cd /tmp && rm -rf sfnt2woff && git clone ${SOURCE_REPOSITORY_URL}`;
  const cloneResult = await shell.exec(cloneCommand);

  if (cloneResult.code !== 0) {
    console.log('Failed to clone the source repository.');
    console.log(cloneResult.stderr || cloneResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Check your internet connection');
    console.log('  2. Ensure git is installed: sudo ' + packageManager + ' install -y git');
    return;
  }

  // Compile the source code using make
  console.log('Compiling sfnt2woff...');
  const makeResult = await shell.exec('cd /tmp/sfnt2woff && make');

  if (makeResult.code !== 0) {
    console.log('Failed to compile sfnt2woff.');
    console.log(makeResult.stderr || makeResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure zlib-devel is installed:');
    console.log('     sudo ' + packageManager + ' install -y zlib-devel');
    console.log('  2. Check for compiler errors in the output above');
    return;
  }

  // Install the compiled binaries to /usr/local/bin
  console.log('Installing binaries to /usr/local/bin...');
  const installResult = await shell.exec(
    'sudo cp /tmp/sfnt2woff/sfnt2woff /tmp/sfnt2woff/woff2sfnt /usr/local/bin/ && ' +
    'sudo chmod 755 /usr/local/bin/sfnt2woff /usr/local/bin/woff2sfnt'
  );

  if (installResult.code !== 0) {
    console.log('Failed to install binaries.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Clean up the temporary build directory
  console.log('Cleaning up build files...');
  await shell.exec('rm -rf /tmp/sfnt2woff');

  // Verify the installation succeeded
  const verified = isSfnt2woffCommandAvailable();
  if (!verified) {
    console.log('Installation may have failed: sfnt2woff command not found after install.');
    console.log('');
    console.log('Ensure /usr/local/bin is in your PATH:');
    console.log('  echo \'export PATH="/usr/local/bin:$PATH"\' >> ~/.bashrc');
    console.log('  source ~/.bashrc');
    return;
  }

  console.log('sfnt2woff installed successfully (compiled from source).');

  // Check if the companion tool woff2sfnt is also available
  if (isWoff2sfntCommandAvailable()) {
    console.log('woff2sfnt (reverse conversion tool) is also available.');
  }

  console.log('');
  console.log('Usage: sfnt2woff myfont.ttf');
  console.log('       sfnt2woff -v 1.0 -m metadata.xml myfont.otf');
}

/**
 * Install sfnt2woff on Windows using npm.
 *
 * Prerequisites:
 * - Windows 10 or later (64-bit)
 * - Node.js and npm installed
 * - Administrator PowerShell (for global npm installation)
 *
 * IMPORTANT: sfnt2woff is not available as a Chocolatey or winget package.
 * This function installs an npm package that provides sfnt2woff functionality.
 * The npm version is a JavaScript/Node.js implementation that provides
 * equivalent functionality to the original Mozilla C tool.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if sfnt2woff is already installed (native or npm-based)
  const isInstalled = isSfnt2woffCommandAvailable();
  if (isInstalled) {
    console.log('sfnt2woff is already installed, skipping...');
    return;
  }

  // Verify Node.js and npm are available - required for Windows installation
  if (!isNpmAvailable()) {
    console.log('Node.js and npm are required but not installed.');
    console.log('');
    console.log('Please install Node.js first:');
    console.log('  dev install node');
    console.log('');
    console.log('Or via Chocolatey:');
    console.log('  choco install nodejs-lts -y');
    return;
  }

  // Install sfnt2woff via npm globally
  // The -g flag makes the command available system-wide
  console.log('Installing sfnt2woff via npm...');
  const result = await shell.exec(`npm install -g ${NPM_PACKAGE_NAME}`);

  if (result.code !== 0) {
    console.log('Failed to install sfnt2woff via npm.');
    console.log(result.stderr || result.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run PowerShell as Administrator');
    console.log('  2. Try: npm install -g sfnt2woff');
    console.log('  3. If permission errors persist, configure npm prefix:');
    console.log('     npm config set prefix %USERPROFILE%\\npm');
    return;
  }

  console.log('sfnt2woff installed successfully via npm.');
  console.log('');
  console.log('Usage with npx: npx sfnt2woff input.ttf output.woff');
  console.log('');
  console.log('Note: The npm package provides equivalent functionality to the');
  console.log('original Mozilla tool but is implemented in JavaScript/Node.js.');
  console.log('');
  console.log('For the native C-based tool, consider using WSL (Windows Subsystem for Linux).');
}

/**
 * Install sfnt2woff on Git Bash using npm.
 *
 * Prerequisites:
 * - Windows 10 or later (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Node.js installed (accessible from Git Bash)
 * - Internet access
 *
 * Git Bash runs in a MinGW environment where native compilation requires
 * additional setup. The simplest approach is using the npm package since
 * Node.js commands work seamlessly in Git Bash.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if sfnt2woff is already available in Git Bash
  const isInstalled = isSfnt2woffCommandAvailable();
  if (isInstalled) {
    console.log('sfnt2woff is already installed, skipping...');
    return;
  }

  // Verify Node.js and npm are available
  if (!isNpmAvailable()) {
    console.log('Node.js and npm are required but not installed.');
    console.log('');
    console.log('Please install Node.js first:');
    console.log('  dev install node');
    console.log('');
    console.log('Or download from: https://nodejs.org/');
    return;
  }

  // Install sfnt2woff via npm globally
  console.log('Installing sfnt2woff via npm...');
  const result = await shell.exec(`npm install -g ${NPM_PACKAGE_NAME}`);

  if (result.code !== 0) {
    console.log('Failed to install sfnt2woff via npm.');
    console.log(result.stderr || result.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Verify npm is working: npm --version');
    console.log('  2. Try: npm install -g sfnt2woff');
    return;
  }

  // Verify npm global bin is in PATH
  const npmPrefixResult = await shell.exec('npm config get prefix');
  const npmPrefix = npmPrefixResult.stdout.trim();

  console.log('sfnt2woff installed successfully via npm.');
  console.log('');
  console.log('Usage with npx: npx sfnt2woff input.ttf output.woff');
  console.log('');
  console.log('Path tip for Git Bash: Use forward slashes and MSYS format:');
  console.log('  npx sfnt2woff /c/Users/YourName/Fonts/myfont.ttf');
  console.log('');
  console.log('For the native C-based tool, consider using WSL instead.');
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. sfnt2woff is supported on
 * all major platforms through various installation methods:
 *
 * - macOS: Homebrew tap (bramstein/webfonttools)
 * - Ubuntu/Debian: APT package (woff-tools)
 * - Ubuntu on WSL: APT package (woff-tools)
 * - Raspberry Pi OS: APT package (woff-tools, ARM builds)
 * - Amazon Linux/RHEL: Compile from source
 * - Windows: npm package (sfnt2woff)
 * - Git Bash: npm package (sfnt2woff)
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
    console.log(`sfnt2woff is not available for ${platform.type}.`);
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
