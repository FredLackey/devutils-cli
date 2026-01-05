#!/usr/bin/env node

/**
 * @fileoverview Install Homebrew package manager.
 * @module installs/homebrew
 *
 * Homebrew is a free and open-source package management system that simplifies
 * the installation of software on macOS and Linux. Originally created for macOS,
 * Homebrew has expanded to support Linux distributions via Linuxbrew.
 *
 * This installer provides:
 * - Native Homebrew installation on macOS (Intel and Apple Silicon)
 * - Linuxbrew installation on Ubuntu/Debian (x86_64)
 * - Linuxbrew installation on Amazon Linux (x86_64)
 * - Linuxbrew installation on Raspberry Pi OS (ARM64/ARM32 with limitations)
 * - Linuxbrew installation within WSL (Ubuntu)
 *
 * IMPORTANT PLATFORM NOTES:
 * - macOS: Full support with pre-compiled bottles for fast installation
 * - Ubuntu/Debian (x86_64): Full support with bottles via Linuxbrew
 * - Amazon Linux (x86_64): Full support with bottles via Linuxbrew
 * - Raspberry Pi OS (ARM64): Limited support; no bottles, packages compile from source
 * - Raspberry Pi OS (ARM32): Minimal support; requires system Ruby, no bottles
 * - Windows (Native): Not supported; use WSL for Homebrew on Windows
 * - Git Bash: Not supported; use WSL for Homebrew on Windows
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const fs = require('fs');
const path = require('path');

/**
 * The URL for the Homebrew installation script.
 * This is the official installer maintained by the Homebrew project.
 */
const HOMEBREW_INSTALL_URL = 'https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh';

/**
 * Installation paths for Homebrew on different platforms.
 * These are the default locations where Homebrew installs itself.
 */
const HOMEBREW_PATHS = {
  // macOS Apple Silicon (M1/M2/M3/M4)
  macos_arm: '/opt/homebrew',
  // macOS Intel
  macos_intel: '/usr/local',
  // Linux (including WSL)
  linux: '/home/linuxbrew/.linuxbrew'
};

/**
 * Required build dependencies for installing Homebrew on Debian-based Linux systems.
 * These packages are required to compile packages from source and run the installer.
 */
const DEBIAN_BUILD_DEPENDENCIES = [
  'build-essential',  // Compilers and build tools (gcc, g++, make)
  'procps',           // Process utilities required by Homebrew
  'curl',             // For downloading the installer
  'file',             // File type detection utility
  'git'               // Version control system used by Homebrew
];

/**
 * Required build dependencies for installing Homebrew on RHEL-based Linux systems.
 * These packages are required to compile packages from source and run the installer.
 */
const RHEL_BUILD_DEPENDENCIES = [
  'procps-ng',  // Process utilities (Amazon Linux 2023 uses procps-ng)
  'curl',       // For downloading the installer
  'file',       // File type detection utility
  'git'         // Version control system used by Homebrew
];

/**
 * Check if Homebrew is already installed by looking for the brew command.
 *
 * This is the primary method to detect if Homebrew is installed and functional.
 * It checks if 'brew' exists in the PATH and is executable.
 *
 * @returns {boolean} True if Homebrew is installed and available, false otherwise
 */
function isBrewInstalled() {
  return shell.commandExists('brew');
}

/**
 * Get the installed Homebrew version.
 *
 * Executes 'brew --version' to retrieve the version string if Homebrew
 * is installed. Returns null if Homebrew is not installed or the command fails.
 *
 * @returns {Promise<string|null>} The Homebrew version string, or null if not installed
 */
async function getBrewVersion() {
  if (!isBrewInstalled()) {
    return null;
  }

  const result = await shell.exec('brew --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "Homebrew 4.4.15"
    const match = result.stdout.match(/Homebrew\s+([\d.]+)/);
    return match ? match[1] : result.stdout.trim().split('\n')[0];
  }
  return null;
}

/**
 * Check if Homebrew installation directory exists.
 *
 * This is a secondary check that looks for the Homebrew directory structure
 * even if the 'brew' command is not in PATH. Useful for detecting partial
 * installations that may need PATH configuration.
 *
 * @param {string} platform - The platform type ('macos', 'linux', etc.)
 * @returns {boolean} True if the Homebrew directory exists, false otherwise
 */
function doesBrewDirectoryExist(platform) {
  if (platform === 'macos') {
    // Check both Apple Silicon and Intel paths
    const arch = os.getArch();
    const brewPath = arch === 'arm64' ? HOMEBREW_PATHS.macos_arm : HOMEBREW_PATHS.macos_intel;
    return fs.existsSync(path.join(brewPath, 'bin', 'brew'));
  }

  // Linux (Ubuntu, Debian, Amazon Linux, Raspberry Pi, WSL)
  return fs.existsSync(path.join(HOMEBREW_PATHS.linux, 'bin', 'brew'));
}

/**
 * Get the appropriate shell configuration file path for the current user.
 *
 * Determines which shell configuration file to modify for PATH configuration.
 * Checks the SHELL environment variable to determine the user's default shell.
 *
 * @returns {string} The path to the shell configuration file
 */
function getShellConfigFile() {
  const homeDir = os.getHomeDir();
  const currentShell = process.env.SHELL || '';

  // Check for zsh (default on modern macOS)
  if (currentShell.includes('zsh')) {
    return path.join(homeDir, '.zshrc');
  }

  // Default to bash configuration files
  // On macOS, .bash_profile is used for login shells; on Linux, .bashrc
  if (process.platform === 'darwin') {
    return path.join(homeDir, '.bash_profile');
  }

  return path.join(homeDir, '.bashrc');
}

/**
 * Get the Homebrew shellenv command for PATH configuration.
 *
 * Returns the appropriate command to add Homebrew to the shell PATH.
 * The command varies based on the platform and processor architecture.
 *
 * @param {string} platform - The platform type ('macos', 'linux', etc.)
 * @returns {string} The shellenv command to add to shell configuration
 */
function getShellenvCommand(platform) {
  if (platform === 'macos') {
    const arch = os.getArch();
    if (arch === 'arm64') {
      // Apple Silicon Mac
      return 'eval "$(/opt/homebrew/bin/brew shellenv)"';
    }
    // Intel Mac
    return 'eval "$(/usr/local/bin/brew shellenv)"';
  }

  // Linux (Ubuntu, Debian, Amazon Linux, Raspberry Pi, WSL)
  return 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"';
}

/**
 * Configure PATH for Homebrew by adding shellenv to shell configuration file.
 *
 * This function adds the Homebrew shellenv command to the appropriate shell
 * configuration file if it's not already present. It also runs the shellenv
 * command to make Homebrew available in the current session.
 *
 * @param {string} platform - The platform type ('macos', 'linux', etc.)
 * @returns {Promise<void>}
 */
async function configureBrewPath(platform) {
  const shellConfigFile = getShellConfigFile();
  const shellenvCommand = getShellenvCommand(platform);

  console.log(`Configuring Homebrew in ${shellConfigFile}...`);

  // Check if the shellenv command is already in the config file
  let configContent = '';
  try {
    if (fs.existsSync(shellConfigFile)) {
      configContent = fs.readFileSync(shellConfigFile, 'utf8');
    }
  } catch (error) {
    // File doesn't exist or can't be read; we'll create it
  }

  // Only add the command if it's not already present
  if (!configContent.includes('brew shellenv')) {
    const lineToAdd = `\n# Homebrew\n${shellenvCommand}\n`;

    try {
      fs.appendFileSync(shellConfigFile, lineToAdd);
      console.log(`Added Homebrew to ${shellConfigFile}`);
    } catch (error) {
      console.log(`Warning: Could not update ${shellConfigFile}`);
      console.log(`Please add this line manually: ${shellenvCommand}`);
    }
  } else {
    console.log('Homebrew PATH configuration already exists in shell config.');
  }

  // Run shellenv to make brew available in the current process
  // Note: This won't persist to the parent shell, but it enables verification
  if (platform === 'macos') {
    const arch = os.getArch();
    const brewPath = arch === 'arm64' ? '/opt/homebrew/bin' : '/usr/local/bin';
    process.env.PATH = `${brewPath}:${process.env.PATH}`;
  } else {
    process.env.PATH = `/home/linuxbrew/.linuxbrew/bin:${process.env.PATH}`;
  }
}

/**
 * Install Homebrew on macOS.
 *
 * Prerequisites:
 * - macOS 14 (Sonoma) or later for full support (older versions may work)
 * - Apple Silicon (M1/M2/M3/M4) or 64-bit Intel processor
 * - Command Line Tools for Xcode (installed automatically if not present)
 * - Bash shell available (default on macOS)
 *
 * The installer automatically:
 * 1. Downloads Homebrew to /opt/homebrew (Apple Silicon) or /usr/local (Intel)
 * 2. Installs the Command Line Tools for Xcode if not present
 * 3. Configures the Homebrew environment
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if Homebrew is already installed...');

  // Check if Homebrew is already installed via command
  const existingVersion = await getBrewVersion();
  if (existingVersion) {
    console.log(`Homebrew ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if Homebrew directory exists but PATH is not configured
  if (doesBrewDirectoryExist('macos')) {
    console.log('Homebrew appears to be installed but not in PATH.');
    console.log('Configuring PATH...');
    await configureBrewPath('macos');

    // Verify it works now
    const versionAfterConfig = await getBrewVersion();
    if (versionAfterConfig) {
      console.log(`Homebrew ${versionAfterConfig} is now configured and ready.`);
      return;
    }
  }

  console.log('Installing Homebrew on macOS...');
  console.log('');
  console.log('This will install:');
  console.log('  - Homebrew package manager');
  console.log('  - Xcode Command Line Tools (if not already installed)');
  console.log('');

  // Run the official Homebrew installer in non-interactive mode
  // NONINTERACTIVE=1 prevents prompts for confirmation
  console.log('Downloading and running the Homebrew installer...');
  console.log('This may take several minutes...');
  console.log('');

  const installResult = await shell.exec(
    `NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL ${HOMEBREW_INSTALL_URL})"`,
    { timeout: 600000 } // 10 minute timeout for slow connections
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Homebrew.\n` +
      `Output: ${installResult.stderr || installResult.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. If Xcode Command Line Tools installation hung, run:\n` +
      `     xcode-select --install\n` +
      `     Then retry installing Homebrew.\n` +
      `  2. For permission errors, ensure you own the target directory:\n` +
      `     sudo chown -R $(whoami) /opt/homebrew  # Apple Silicon\n` +
      `     sudo chown -R $(whoami) /usr/local/Homebrew  # Intel\n` +
      `  3. Check your internet connection and retry.`
    );
  }

  // Configure PATH
  await configureBrewPath('macos');

  // Verify installation
  const version = await getBrewVersion();
  if (!version) {
    // Even if version check fails, the installation might be successful
    // Give user instructions to complete setup
    console.log('');
    console.log('Homebrew installation completed.');
    console.log('');
    console.log('IMPORTANT: To use Homebrew, either:');
    console.log('  1. Open a new terminal window, OR');
    console.log('  2. Run this command in your current terminal:');
    console.log(`     ${getShellenvCommand('macos')}`);
    console.log('');
    console.log('Then verify with: brew --version');
    return;
  }

  console.log(`Homebrew ${version} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To use Homebrew in your current terminal, run:');
  console.log(`  ${getShellenvCommand('macos')}`);
  console.log('');
  console.log('Or simply open a new terminal window.');
  console.log('');
  console.log('Verify with: brew --version');
  console.log('Run diagnostics: brew doctor');
}

/**
 * Install build dependencies on Ubuntu/Debian systems.
 *
 * Installs the required packages for Homebrew to function on Debian-based systems.
 * These packages include compilers, build tools, and utilities needed by Homebrew.
 *
 * @returns {Promise<void>}
 * @throws {Error} If package installation fails
 */
async function installDebianBuildDependencies() {
  console.log('Installing required build dependencies...');

  // Update package lists first
  const updateResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y'
  );
  if (updateResult.code !== 0) {
    console.log('Warning: apt-get update had issues, continuing anyway...');
  }

  // Install build dependencies
  const packages = DEBIAN_BUILD_DEPENDENCIES.join(' ');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${packages}`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install build dependencies.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Required packages: ${packages}\n` +
      `Please install them manually with:\n` +
      `  sudo apt-get update && sudo apt-get install -y ${packages}`
    );
  }

  console.log('Build dependencies installed successfully.');
}

/**
 * Install Homebrew on Ubuntu/Debian systems.
 *
 * Prerequisites:
 * - Ubuntu 20.04 LTS or later, or Debian 10 (Buster) or later (64-bit x86_64)
 * - sudo privileges
 * - curl and git installed (handled automatically)
 *
 * Homebrew on Linux (Linuxbrew) installs to /home/linuxbrew/.linuxbrew and
 * provides pre-compiled bottles for x86_64 architecture, enabling fast installation.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if Homebrew is already installed...');

  // Check if Homebrew is already installed via command
  const existingVersion = await getBrewVersion();
  if (existingVersion) {
    console.log(`Homebrew ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if Homebrew directory exists but PATH is not configured
  if (doesBrewDirectoryExist('linux')) {
    console.log('Homebrew appears to be installed but not in PATH.');
    console.log('Configuring PATH...');
    await configureBrewPath('linux');

    // Verify it works now
    const versionAfterConfig = await getBrewVersion();
    if (versionAfterConfig) {
      console.log(`Homebrew ${versionAfterConfig} is now configured and ready.`);
      return;
    }
  }

  console.log('Installing Homebrew on Ubuntu/Debian...');
  console.log('');

  // Install build dependencies
  await installDebianBuildDependencies();

  console.log('');
  console.log('Downloading and running the Homebrew installer...');
  console.log('This may take several minutes...');
  console.log('');

  // Run the official Homebrew installer in non-interactive mode
  const installResult = await shell.exec(
    `NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL ${HOMEBREW_INSTALL_URL})"`,
    { timeout: 600000 } // 10 minute timeout
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Homebrew.\n` +
      `Output: ${installResult.stderr || installResult.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure all dependencies are installed:\n` +
      `     sudo apt-get install -y build-essential procps curl file git\n` +
      `  2. Check your internet connection\n` +
      `  3. If you see tar errors, run:\n` +
      `     sudo apt-get install -y tar`
    );
  }

  // Configure PATH
  await configureBrewPath('linux');

  // Verify installation
  const version = await getBrewVersion();
  if (!version) {
    console.log('');
    console.log('Homebrew installation completed.');
    console.log('');
    console.log('IMPORTANT: To use Homebrew, either:');
    console.log('  1. Open a new terminal window, OR');
    console.log('  2. Run this command in your current terminal:');
    console.log(`     ${getShellenvCommand('linux')}`);
    console.log('');
    console.log('Then verify with: brew --version');
    return;
  }

  console.log(`Homebrew ${version} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To use Homebrew in your current terminal, run:');
  console.log(`  ${getShellenvCommand('linux')}`);
  console.log('');
  console.log('Or simply open a new terminal window.');
  console.log('');
  console.log('Verify with: brew --version');
  console.log('Run diagnostics: brew doctor');
}

/**
 * Install Homebrew on Raspberry Pi OS.
 *
 * Prerequisites:
 * - Raspberry Pi OS Bookworm or Bullseye (64-bit recommended)
 * - Raspberry Pi 3B+ or later (64-bit capable hardware recommended)
 * - At least 2 GB RAM (4 GB recommended)
 * - sudo privileges
 *
 * IMPORTANT: Homebrew on ARM Linux is a Tier 3 platform:
 * - No pre-compiled binary packages (bottles) are available
 * - All packages must be compiled from source
 * - Installation takes significantly longer than on x86_64 platforms
 * - 32-bit (armv7l) requires system Ruby to be installed first
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if Homebrew is already installed...');

  // Check if Homebrew is already installed via command
  const existingVersion = await getBrewVersion();
  if (existingVersion) {
    console.log(`Homebrew ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if Homebrew directory exists but PATH is not configured
  if (doesBrewDirectoryExist('linux')) {
    console.log('Homebrew appears to be installed but not in PATH.');
    console.log('Configuring PATH...');
    await configureBrewPath('linux');

    // Verify it works now
    const versionAfterConfig = await getBrewVersion();
    if (versionAfterConfig) {
      console.log(`Homebrew ${versionAfterConfig} is now configured and ready.`);
      return;
    }
  }

  // Detect architecture to provide appropriate warnings
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();

  console.log('Installing Homebrew on Raspberry Pi OS...');
  console.log('');
  console.log('IMPORTANT: Homebrew on ARM is a Tier 3 platform.');
  console.log('- No pre-compiled bottles are available');
  console.log('- All packages will compile from source');
  console.log('- Installation and package installation will be slow');
  console.log('');

  // Install build dependencies
  await installDebianBuildDependencies();

  // For 32-bit Raspberry Pi OS, we need to install system Ruby first
  if (arch === 'armv7l') {
    console.log('');
    console.log('Detected 32-bit Raspberry Pi OS (armv7l).');
    console.log('Installing system Ruby (required for 32-bit ARM)...');

    const rubyResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ruby ruby-dev'
    );
    if (rubyResult.code !== 0) {
      throw new Error(
        `Failed to install Ruby, which is required for Homebrew on 32-bit ARM.\n` +
        `Please install Ruby manually:\n` +
        `  sudo apt-get install -y ruby ruby-dev\n` +
        `Then retry installing Homebrew.`
      );
    }
    console.log('Ruby installed successfully.');
  }

  console.log('');
  console.log('Downloading and running the Homebrew installer...');
  console.log('This may take several minutes (or longer on slower hardware)...');
  console.log('');

  // Run the official Homebrew installer in non-interactive mode
  const installResult = await shell.exec(
    `NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL ${HOMEBREW_INSTALL_URL})"`,
    { timeout: 1200000 } // 20 minute timeout for slower Raspberry Pi hardware
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Homebrew.\n` +
      `Output: ${installResult.stderr || installResult.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure all dependencies are installed:\n` +
      `     sudo apt-get install -y build-essential procps curl file git\n` +
      `  2. For 32-bit (armv7l), ensure Ruby is installed:\n` +
      `     sudo apt-get install -y ruby ruby-dev\n` +
      `  3. If compilation fails with out-of-memory errors, add swap space:\n` +
      `     sudo fallocate -l 2G /swapfile\n` +
      `     sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile\n` +
      `  4. Check your internet connection and retry.`
    );
  }

  // Configure PATH
  await configureBrewPath('linux');

  // Verify installation
  const version = await getBrewVersion();
  if (!version) {
    console.log('');
    console.log('Homebrew installation completed.');
    console.log('');
    console.log('IMPORTANT: To use Homebrew, either:');
    console.log('  1. Open a new terminal window, OR');
    console.log('  2. Run this command in your current terminal:');
    console.log(`     ${getShellenvCommand('linux')}`);
    console.log('');
    console.log('Then verify with: brew --version');
    return;
  }

  console.log(`Homebrew ${version} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To use Homebrew in your current terminal, run:');
  console.log(`  ${getShellenvCommand('linux')}`);
  console.log('');
  console.log('Or simply open a new terminal window.');
  console.log('');
  console.log('NOTE: Package installation will be slow on Raspberry Pi because');
  console.log('all packages compile from source. Consider using apt for common tools.');
  console.log('');
  console.log('Verify with: brew --version');
  console.log('Run diagnostics: brew doctor (expect some warnings about ARM platform)');
}

/**
 * Install build dependencies on Amazon Linux/RHEL systems.
 *
 * Installs the required packages for Homebrew to function on RHEL-based systems.
 * Detects whether to use dnf (Amazon Linux 2023) or yum (Amazon Linux 2).
 *
 * @returns {Promise<void>}
 * @throws {Error} If package installation fails
 */
async function installRhelBuildDependencies() {
  console.log('Installing required build dependencies...');

  // Detect package manager (dnf for AL2023, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const packageManager = hasDnf ? 'dnf' : 'yum';

  console.log(`Using package manager: ${packageManager}`);

  // Install Development Tools group
  console.log('Installing Development Tools group...');
  const groupResult = await shell.exec(
    `sudo ${packageManager} groupinstall -y "Development Tools"`
  );
  if (groupResult.code !== 0) {
    console.log('Warning: Could not install Development Tools group, trying individual packages...');
    // Try installing gcc and make individually
    await shell.exec(`sudo ${packageManager} install -y gcc gcc-c++ make`);
  }

  // Install other required dependencies
  // Note: Amazon Linux 2023 uses procps-ng, AL2 uses procps
  const procpsPkg = hasDnf ? 'procps-ng' : 'procps';
  const packages = [procpsPkg, 'curl', 'file', 'git'].join(' ');

  const installResult = await shell.exec(
    `sudo ${packageManager} install -y ${packages}`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install build dependencies.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Please install them manually with:\n` +
      `  sudo ${packageManager} groupinstall -y "Development Tools"\n` +
      `  sudo ${packageManager} install -y ${packages}`
    );
  }

  console.log('Build dependencies installed successfully.');
}

/**
 * Install Homebrew on Amazon Linux/RHEL systems.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - 64-bit x86_64 architecture
 * - sudo privileges
 * - EC2 instance or compatible environment
 *
 * Amazon Linux 2023 uses DNF as the default package manager.
 * Amazon Linux 2 uses YUM.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if Homebrew is already installed...');

  // Check if Homebrew is already installed via command
  const existingVersion = await getBrewVersion();
  if (existingVersion) {
    console.log(`Homebrew ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if Homebrew directory exists but PATH is not configured
  if (doesBrewDirectoryExist('linux')) {
    console.log('Homebrew appears to be installed but not in PATH.');
    console.log('Configuring PATH...');
    await configureBrewPath('linux');

    // Verify it works now
    const versionAfterConfig = await getBrewVersion();
    if (versionAfterConfig) {
      console.log(`Homebrew ${versionAfterConfig} is now configured and ready.`);
      return;
    }
  }

  console.log('Installing Homebrew on Amazon Linux...');
  console.log('');

  // Set locale to avoid warnings during installation
  process.env.LC_ALL = 'en_US.UTF-8';
  process.env.LANG = 'en_US.UTF-8';

  // Install build dependencies
  await installRhelBuildDependencies();

  console.log('');
  console.log('Downloading and running the Homebrew installer...');
  console.log('This may take several minutes...');
  console.log('');

  // Run the official Homebrew installer in non-interactive mode
  const installResult = await shell.exec(
    `NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL ${HOMEBREW_INSTALL_URL})"`,
    { timeout: 600000 } // 10 minute timeout
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Homebrew.\n` +
      `Output: ${installResult.stderr || installResult.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Development Tools are installed:\n` +
      `     sudo dnf groupinstall -y "Development Tools"  # Amazon Linux 2023\n` +
      `     sudo yum groupinstall -y "Development Tools"  # Amazon Linux 2\n` +
      `  2. Install required dependencies:\n` +
      `     sudo dnf install -y procps-ng curl file git  # Amazon Linux 2023\n` +
      `     sudo yum install -y procps curl file git  # Amazon Linux 2\n` +
      `  3. Set locale if you see locale warnings:\n` +
      `     export LC_ALL=en_US.UTF-8 && export LANG=en_US.UTF-8\n` +
      `  4. Check your internet connection and retry.`
    );
  }

  // Configure PATH
  await configureBrewPath('linux');

  // Verify installation
  const version = await getBrewVersion();
  if (!version) {
    console.log('');
    console.log('Homebrew installation completed.');
    console.log('');
    console.log('IMPORTANT: To use Homebrew, either:');
    console.log('  1. Open a new terminal window, OR');
    console.log('  2. Run this command in your current terminal:');
    console.log(`     ${getShellenvCommand('linux')}`);
    console.log('');
    console.log('Then verify with: brew --version');
    return;
  }

  console.log(`Homebrew ${version} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To use Homebrew in your current terminal, run:');
  console.log(`  ${getShellenvCommand('linux')}`);
  console.log('');
  console.log('Or simply open a new terminal window.');
  console.log('');
  console.log('Verify with: brew --version');
  console.log('Run diagnostics: brew doctor');
}

/**
 * Handle Homebrew installation on native Windows.
 *
 * Homebrew does not run natively on Windows. This function informs the user
 * that they need to use WSL (Windows Subsystem for Linux) to use Homebrew.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Homebrew is not available for native Windows.');
  console.log('');
  console.log('To use Homebrew on Windows, install Windows Subsystem for Linux (WSL):');
  console.log('');
  console.log('1. Open PowerShell as Administrator and run:');
  console.log('   wsl --install -d Ubuntu');
  console.log('');
  console.log('2. Restart your computer when prompted.');
  console.log('');
  console.log('3. After restart, open Ubuntu from the Start menu and complete setup.');
  console.log('');
  console.log('4. Then run this installer again from within WSL.');
  return;
}

/**
 * Install Homebrew on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 (build 19041) or higher, or Windows 11
 * - WSL 2 enabled (WSL 1 has known issues with Homebrew)
 * - Ubuntu distribution installed in WSL
 * - sudo privileges within WSL
 *
 * The installation process is identical to native Ubuntu, but this function
 * provides WSL-specific messaging and warnings.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Check if Homebrew is already installed via command
  const existingVersion = await getBrewVersion();
  if (existingVersion) {
    console.log(`Homebrew ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if Homebrew directory exists but PATH is not configured
  if (doesBrewDirectoryExist('linux')) {
    console.log('Homebrew appears to be installed but not in PATH.');
    console.log('Configuring PATH...');
    await configureBrewPath('linux');

    // Verify it works now
    const versionAfterConfig = await getBrewVersion();
    if (versionAfterConfig) {
      console.log(`Homebrew ${versionAfterConfig} is now configured and ready.`);
      return;
    }
  }

  console.log('Installing Homebrew in WSL...');
  console.log('');
  console.log('NOTE: For best performance, ensure you are using WSL 2.');
  console.log('Check with: wsl.exe -l -v');
  console.log('');

  // Install build dependencies
  await installDebianBuildDependencies();

  console.log('');
  console.log('Downloading and running the Homebrew installer...');
  console.log('This may take several minutes...');
  console.log('');

  // Run the official Homebrew installer in non-interactive mode
  const installResult = await shell.exec(
    `NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL ${HOMEBREW_INSTALL_URL})"`,
    { timeout: 600000 } // 10 minute timeout
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Homebrew in WSL.\n` +
      `Output: ${installResult.stderr || installResult.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure WSL 2 is being used (WSL 1 has known issues):\n` +
      `     Run in PowerShell: wsl --set-version Ubuntu 2\n` +
      `  2. Ensure all dependencies are installed:\n` +
      `     sudo apt-get install -y build-essential procps curl file git\n` +
      `  3. If apt-get update fails with network errors, restart WSL:\n` +
      `     Run in PowerShell: wsl --shutdown\n` +
      `     Then reopen Ubuntu.\n` +
      `  4. Check your internet connection and retry.`
    );
  }

  // Configure PATH
  await configureBrewPath('linux');

  // Verify installation
  const version = await getBrewVersion();
  if (!version) {
    console.log('');
    console.log('Homebrew installation completed.');
    console.log('');
    console.log('IMPORTANT: To use Homebrew, either:');
    console.log('  1. Open a new terminal window, OR');
    console.log('  2. Run this command in your current terminal:');
    console.log(`     ${getShellenvCommand('linux')}`);
    console.log('');
    console.log('Then verify with: brew --version');
    return;
  }

  console.log(`Homebrew ${version} installed successfully in WSL.`);
  console.log('');
  console.log('IMPORTANT: To use Homebrew in your current terminal, run:');
  console.log(`  ${getShellenvCommand('linux')}`);
  console.log('');
  console.log('Or simply open a new terminal window.');
  console.log('');
  console.log('WSL Tips:');
  console.log('  - Store files in ~/... (Linux filesystem) for best performance');
  console.log('  - Accessing /mnt/c/... (Windows filesystem) is slower');
  console.log('  - Configure git line endings: git config --global core.autocrlf input');
  console.log('');
  console.log('Verify with: brew --version');
  console.log('Run diagnostics: brew doctor');
}

/**
 * Handle Homebrew installation in Git Bash.
 *
 * Homebrew does not run in Git Bash. This function informs the user
 * that they need to use WSL (Windows Subsystem for Linux) to use Homebrew.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Homebrew is not available for Git Bash.');
  console.log('');
  console.log('Git Bash is a Windows terminal emulator that provides a bash-like');
  console.log('environment but does not include a full Linux userspace required');
  console.log('by Homebrew.');
  console.log('');
  console.log('To use Homebrew on Windows, install Windows Subsystem for Linux (WSL):');
  console.log('');
  console.log('1. Open PowerShell as Administrator and run:');
  console.log('   wsl --install -d Ubuntu');
  console.log('');
  console.log('2. Restart your computer when prompted.');
  console.log('');
  console.log('3. After restart, open Ubuntu from the Start menu and complete setup.');
  console.log('');
  console.log('4. Then run this installer from within WSL.');
  return;
}

/**
 * Check if this installer is supported on the current platform.
 * Homebrew is supported on macOS and Linux (including WSL).
 * Windows and Git Bash are NOT supported (use WSL instead).
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  // Homebrew does NOT run natively on Windows or Git Bash
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora'].includes(platform.type);
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Native Homebrew installation
 * - Ubuntu/Debian: Linuxbrew installation
 * - Raspberry Pi OS: Linuxbrew installation (with ARM limitations)
 * - Amazon Linux/RHEL: Linuxbrew installation
 * - WSL (Ubuntu): Linuxbrew installation within WSL
 * - Windows (Native): Not supported, advises WSL
 * - Git Bash: Not supported, advises WSL
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
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

  if (!installer) {
    console.log(`Homebrew is not available for ${platform.type}.`);
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

// Allow direct execution: node homebrew.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
