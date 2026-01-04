#!/usr/bin/env node

/**
 * @fileoverview Install Node.js - JavaScript runtime environment.
 * @module installs/node
 *
 * Node.js is a free, open-source, cross-platform JavaScript runtime environment
 * that executes JavaScript code outside of a web browser. Built on Chrome's V8
 * JavaScript engine, Node.js enables developers to use JavaScript for server-side
 * scripting, command-line tools, and desktop applications.
 *
 * Node.js includes npm (Node Package Manager), the world's largest software
 * registry with over two million packages. Together, Node.js and npm form the
 * foundation of modern JavaScript development.
 *
 * This installer provides:
 * - macOS: Node.js via Homebrew (latest stable version)
 * - Ubuntu/Debian: Node.js via NodeSource repository (LTS v22.x)
 * - Raspberry Pi OS: Node.js via NodeSource repository (LTS v22.x)
 * - Amazon Linux: Node.js via DNF/YUM (namespaced packages on AL2023, NodeSource on AL2)
 * - Windows: Node.js LTS via Chocolatey
 * - WSL (Ubuntu): Node.js via NodeSource repository (LTS v22.x)
 * - Git Bash: Node.js LTS installed on Windows host via Chocolatey
 *
 * IMPORTANT PLATFORM NOTES:
 * - The NodeSource repository is used for Ubuntu, Debian, and Raspberry Pi OS
 *   to ensure a recent LTS version is installed (default repository versions
 *   are often outdated).
 * - Amazon Linux 2023 uses namespaced packages (nodejs22, nodejs22-npm).
 * - On Windows, a new terminal window must be opened after installation for
 *   PATH changes to take effect.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew formula name for Node.js on macOS.
 * This installs the latest stable Node.js version.
 */
const HOMEBREW_FORMULA_NAME = 'node';

/**
 * The Chocolatey package name for Node.js LTS on Windows.
 * Using nodejs-lts ensures a stable, long-term supported version.
 */
const CHOCO_PACKAGE_NAME = 'nodejs-lts';

/**
 * The Node.js LTS major version to install via NodeSource.
 * This should be updated when new LTS versions are released.
 */
const NODESOURCE_LTS_VERSION = '22';

/**
 * The NodeSource repository setup script URL for Debian-based systems.
 * This script adds the NodeSource GPG key and APT repository.
 */
const NODESOURCE_DEB_SETUP_URL = `https://deb.nodesource.com/setup_${NODESOURCE_LTS_VERSION}.x`;

/**
 * The NodeSource repository setup script URL for RPM-based systems (Amazon Linux 2).
 * Note: Amazon Linux 2023 uses namespaced packages instead.
 */
const NODESOURCE_RPM_SETUP_URL = `https://rpm.nodesource.com/setup_${NODESOURCE_LTS_VERSION}.x`;

/**
 * Check if Node.js CLI is installed by verifying the 'node' command exists.
 *
 * This is a quick synchronous check that works across all platforms.
 * It verifies that the 'node' executable is available in the system PATH.
 *
 * @returns {boolean} True if the node command is available, false otherwise
 */
function isNodeCommandAvailable() {
  return shell.commandExists('node');
}

/**
 * Check if Node.js is installed and get the version.
 *
 * Executes 'node --version' to verify Node.js is properly installed
 * and operational. Returns the version string (without 'v' prefix) if successful.
 *
 * @returns {Promise<string|null>} Node.js version string (e.g., "22.12.0"), or null if not installed
 */
async function getNodeVersion() {
  if (!isNodeCommandAvailable()) {
    return null;
  }

  const result = await shell.exec('node --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "v22.12.0" - strip the leading 'v'
    const version = result.stdout.trim();
    return version.startsWith('v') ? version.substring(1) : version;
  }
  return null;
}

/**
 * Check if npm is installed and get the version.
 *
 * Executes 'npm --version' to verify npm is properly installed.
 * npm is bundled with Node.js, so this should succeed if Node.js is installed.
 *
 * @returns {Promise<string|null>} npm version string, or null if not installed
 */
async function getNpmVersion() {
  if (!shell.commandExists('npm')) {
    return null;
  }

  const result = await shell.exec('npm --version');
  if (result.code === 0 && result.stdout) {
    return result.stdout.trim();
  }
  return null;
}

/**
 * Set up the NodeSource APT repository on Ubuntu/Debian systems.
 *
 * This function:
 * 1. Installs prerequisites (curl, ca-certificates, gnupg)
 * 2. Downloads and runs the NodeSource setup script
 * 3. The script adds the NodeSource GPG key and APT repository
 *
 * @returns {Promise<void>}
 * @throws {Error} If repository setup fails
 */
async function setupNodeSourceAptRepository() {
  console.log('Setting up NodeSource APT repository for Node.js LTS...');

  // Install prerequisites needed to download and verify the NodeSource repository
  console.log('Installing prerequisites (curl, ca-certificates, gnupg)...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl ca-certificates gnupg'
  );
  if (prereqResult.code !== 0) {
    throw new Error(`Failed to install prerequisites: ${prereqResult.stderr}`);
  }

  // Download and run the NodeSource setup script
  // The -E flag preserves environment variables for sudo
  console.log(`Adding NodeSource repository for Node.js ${NODESOURCE_LTS_VERSION}.x...`);
  const setupResult = await shell.exec(
    `curl -fsSL ${NODESOURCE_DEB_SETUP_URL} | sudo -E bash -`
  );
  if (setupResult.code !== 0) {
    throw new Error(
      `Failed to set up NodeSource repository.\n` +
      `Output: ${setupResult.stderr || setupResult.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check your internet connection\n` +
      `  2. Verify ca-certificates is installed: sudo apt-get install -y ca-certificates\n` +
      `  3. Try running the command manually:\n` +
      `     curl -fsSL ${NODESOURCE_DEB_SETUP_URL} | sudo -E bash -`
    );
  }

  console.log('NodeSource repository configured successfully.');
}

/**
 * Install Node.js on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later (macOS 14 Sonoma or later recommended)
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * This function installs the latest stable Node.js version via Homebrew.
 * Homebrew also installs npm as part of the Node.js package.
 *
 * After installation, Node.js will be available at:
 * - Apple Silicon Macs: /opt/homebrew/bin/node
 * - Intel Macs: /usr/local/bin/node
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if Node.js is already installed...');

  // Check if Node.js is already installed via Homebrew formula
  const isBrewNodeInstalled = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (isBrewNodeInstalled) {
    const version = await getNodeVersion();
    const npmVersion = await getNpmVersion();
    console.log(`Node.js ${version || 'unknown version'} is already installed via Homebrew, skipping...`);
    if (npmVersion) {
      console.log(`npm version: ${npmVersion}`);
    }
    return;
  }

  // Also check if node command exists (might be installed via other means)
  const existingVersion = await getNodeVersion();
  if (existingVersion) {
    console.log(`Node.js ${existingVersion} is already installed, skipping...`);
    console.log('');
    console.log('Note: Node.js was not installed via Homebrew.');
    console.log('If you want to manage it with Homebrew, first uninstall the existing version.');
    return;
  }

  // Verify Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Install Node.js using Homebrew
  console.log('Installing Node.js via Homebrew...');
  const result = await brew.install(HOMEBREW_FORMULA_NAME);

  if (!result.success) {
    console.log('Failed to install Node.js via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded
  const verified = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (!verified) {
    console.log('Installation may have failed: Node.js formula not found after install.');
    return;
  }

  // Display installed versions
  const nodeVersion = await getNodeVersion();
  const npmVersion = await getNpmVersion();

  console.log('Node.js installed successfully via Homebrew.');
  console.log('');
  if (nodeVersion) {
    console.log(`Node.js version: ${nodeVersion}`);
  }
  if (npmVersion) {
    console.log(`npm version: ${npmVersion}`);
  }
  console.log('');
  console.log('Verify installation with: node --version && npm --version');
}

/**
 * Install Node.js on Ubuntu/Debian using APT with NodeSource repository.
 *
 * Prerequisites:
 * - Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later (64-bit)
 * - sudo privileges
 * - Internet connectivity
 *
 * IMPORTANT: This function uses the NodeSource repository instead of the default
 * Ubuntu/Debian repositories because the default repositories contain outdated
 * Node.js versions that may not be suitable for modern development.
 *
 * The NodeSource repository provides:
 * - Current LTS versions (v22.x, v20.x, v18.x)
 * - Regular security updates
 * - npm bundled with Node.js
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if Node.js is already installed...');

  // Check if Node.js is already installed
  const existingVersion = await getNodeVersion();
  if (existingVersion) {
    const npmVersion = await getNpmVersion();
    console.log(`Node.js ${existingVersion} is already installed, skipping...`);
    if (npmVersion) {
      console.log(`npm version: ${npmVersion}`);
    }
    return;
  }

  // Set up the NodeSource APT repository to get a recent Node.js version
  await setupNodeSourceAptRepository();

  // Install Node.js from the NodeSource repository
  console.log('Installing Node.js via APT...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs'
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Node.js via APT.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "sudo apt-get update" and retry');
    console.log('  2. Check if the NodeSource repository was added:');
    console.log('     cat /etc/apt/sources.list.d/nodesource.list');
    return;
  }

  // Verify the installation succeeded
  const nodeVersion = await getNodeVersion();
  if (!nodeVersion) {
    console.log('Installation may have failed: node command not found after install.');
    return;
  }

  const npmVersion = await getNpmVersion();

  console.log('Node.js installed successfully.');
  console.log('');
  console.log(`Node.js version: ${nodeVersion}`);
  if (npmVersion) {
    console.log(`npm version: ${npmVersion}`);
  }
  console.log('');
  console.log('Verify installation with: node --version && npm --version');
}

/**
 * Install Node.js on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 *
 * WSL runs Ubuntu within Windows, so Node.js installation follows the same
 * APT-based process as native Ubuntu using the NodeSource repository.
 *
 * NOTE: The Node.js installed within WSL is separate from any Node.js
 * installation on the Windows host. It is common and expected to have
 * different Node.js versions in WSL and Windows.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Check if Node.js is already installed
  const existingVersion = await getNodeVersion();
  if (existingVersion) {
    const npmVersion = await getNpmVersion();
    console.log(`Node.js ${existingVersion} is already installed, skipping...`);
    if (npmVersion) {
      console.log(`npm version: ${npmVersion}`);
    }
    return;
  }

  // Set up the NodeSource APT repository
  await setupNodeSourceAptRepository();

  // Install Node.js from the NodeSource repository
  console.log('Installing Node.js via APT...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs'
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Node.js via APT.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify the installation succeeded
  const nodeVersion = await getNodeVersion();
  if (!nodeVersion) {
    console.log('Installation may have failed: node command not found after install.');
    return;
  }

  const npmVersion = await getNpmVersion();

  console.log('Node.js installed successfully in WSL.');
  console.log('');
  console.log(`Node.js version: ${nodeVersion}`);
  if (npmVersion) {
    console.log(`npm version: ${npmVersion}`);
  }
  console.log('');
  console.log('WSL Tips:');
  console.log('  - Store projects in ~/... (Linux filesystem) for best npm performance');
  console.log('  - Accessing /mnt/c/... (Windows filesystem) is slower for npm operations');
  console.log('');
  console.log('Verify installation with: node --version && npm --version');
}

/**
 * Install Node.js on Raspberry Pi OS using APT with NodeSource repository.
 *
 * Prerequisites:
 * - Raspberry Pi OS (Bookworm or Bullseye recommended)
 * - Raspberry Pi 3B+ or later (64-bit OS recommended)
 * - At least 1 GB RAM (2 GB or more recommended for npm operations)
 * - sudo privileges
 *
 * This function supports both 64-bit (aarch64) and 32-bit (armv7l) Raspberry Pi OS.
 * The NodeSource repository provides ARM builds for both architectures.
 *
 * NOTE: For Raspberry Pi Zero/Pi 1 (armv6l), Node.js 22+ does not provide official
 * builds. Users on these devices should use Node.js 20.x from unofficial builds.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if Node.js is already installed...');

  // Check if Node.js is already installed
  const existingVersion = await getNodeVersion();
  if (existingVersion) {
    const npmVersion = await getNpmVersion();
    console.log(`Node.js ${existingVersion} is already installed, skipping...`);
    if (npmVersion) {
      console.log(`npm version: ${npmVersion}`);
    }
    return;
  }

  // Check and report architecture for informational purposes
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  console.log(`Detected architecture: ${arch}`);

  // Warn about ARMv6 limitations (Raspberry Pi Zero, Pi 1)
  if (arch === 'armv6l') {
    console.log('');
    console.log('WARNING: ARMv6 (Raspberry Pi Zero/Pi 1) is detected.');
    console.log(`Node.js ${NODESOURCE_LTS_VERSION}.x does not provide official ARMv6 builds.`);
    console.log('');
    console.log('Options for ARMv6:');
    console.log('  1. Use Node.js 20.x from unofficial builds:');
    console.log('     https://unofficial-builds.nodejs.org/download/release/');
    console.log('  2. Use an older Node.js version from the Raspberry Pi OS repository:');
    console.log('     sudo apt-get install -y nodejs');
    console.log('');
    console.log('Attempting NodeSource installation anyway (may fail on ARMv6)...');
    console.log('');
  }

  // Set up the NodeSource APT repository
  await setupNodeSourceAptRepository();

  // Install Node.js from the NodeSource repository
  console.log('Installing Node.js via APT...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs'
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Node.js via APT.');
    console.log(installResult.stderr || installResult.stdout);

    // Provide ARMv6-specific guidance if installation failed
    if (arch === 'armv6l') {
      console.log('');
      console.log('Installation failed, likely due to ARMv6 architecture.');
      console.log('Please use Node.js 20.x from unofficial builds instead.');
    }
    return;
  }

  // Verify the installation succeeded
  const nodeVersion = await getNodeVersion();
  if (!nodeVersion) {
    console.log('Installation may have failed: node command not found after install.');
    return;
  }

  const npmVersion = await getNpmVersion();

  console.log('Node.js installed successfully.');
  console.log('');
  console.log(`Node.js version: ${nodeVersion}`);
  if (npmVersion) {
    console.log(`npm version: ${npmVersion}`);
  }
  console.log('');
  console.log('NOTE: If npm install is slow or runs out of memory, consider:');
  console.log('  - Using a faster SD card (Class 10, A1/A2 rated)');
  console.log('  - Increasing swap space for memory-intensive operations');
  console.log('');
  console.log('Verify installation with: node --version && npm --version');
}

/**
 * Install Node.js on Amazon Linux using DNF or YUM.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - sudo privileges
 * - EC2 instance or compatible environment
 *
 * Amazon Linux 2023 provides Node.js as namespaced packages (nodejs22, nodejs22-npm).
 * Amazon Linux 2 uses the NodeSource repository for recent Node.js versions.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if Node.js is already installed...');

  // Check if Node.js is already installed
  const existingVersion = await getNodeVersion();
  if (existingVersion) {
    const npmVersion = await getNpmVersion();
    console.log(`Node.js ${existingVersion} is already installed, skipping...`);
    if (npmVersion) {
      console.log(`npm version: ${npmVersion}`);
    }
    return;
  }

  // Detect package manager (dnf for AL2023, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    console.log('Neither dnf nor yum package manager found.');
    console.log('This installer supports Amazon Linux 2023 (dnf) and Amazon Linux 2 (yum).');
    return;
  }

  console.log(`Detected package manager: ${packageManager}`);

  // Different installation methods for AL2023 vs AL2
  if (hasDnf) {
    // Amazon Linux 2023 - use namespaced packages
    console.log('Installing Node.js on Amazon Linux 2023...');
    console.log('');

    // Update system packages first
    console.log('Updating system packages...');
    await shell.exec('sudo dnf update -y');

    // Install Node.js 22 and npm from Amazon's repository
    console.log(`Installing nodejs${NODESOURCE_LTS_VERSION} and npm...`);
    const installResult = await shell.exec(
      `sudo dnf install -y nodejs${NODESOURCE_LTS_VERSION} nodejs${NODESOURCE_LTS_VERSION}-npm`
    );

    if (installResult.code !== 0) {
      console.log('Failed to install Node.js via dnf.');
      console.log(installResult.stderr || installResult.stdout);
      console.log('');
      console.log('Troubleshooting:');
      console.log('  1. Update dnf cache: sudo dnf makecache');
      console.log(`  2. Try: sudo dnf install -y nodejs${NODESOURCE_LTS_VERSION} nodejs${NODESOURCE_LTS_VERSION}-npm`);
      return;
    }

    // Set Node.js 22 as the active version using alternatives
    console.log('Setting Node.js as the active version...');
    const alternativesResult = await shell.exec(
      `sudo alternatives --set node /usr/bin/node-${NODESOURCE_LTS_VERSION}`
    );
    if (alternativesResult.code !== 0) {
      console.log('Warning: Could not set node alternative. The node command may not be available.');
      console.log('You may need to use the full path: /usr/bin/node-22');
    }
  } else {
    // Amazon Linux 2 - use NodeSource repository
    console.log('Installing Node.js on Amazon Linux 2 via NodeSource...');
    console.log('');

    // Install prerequisites
    console.log('Installing prerequisites (curl)...');
    await shell.exec('sudo yum install -y curl');

    // Add NodeSource repository
    console.log(`Adding NodeSource repository for Node.js ${NODESOURCE_LTS_VERSION}.x...`);
    const setupResult = await shell.exec(
      `curl -fsSL ${NODESOURCE_RPM_SETUP_URL} | sudo bash -`
    );

    if (setupResult.code !== 0) {
      console.log('Failed to set up NodeSource repository.');
      console.log(setupResult.stderr || setupResult.stdout);
      return;
    }

    // Install Node.js
    console.log('Installing Node.js via yum...');
    const installResult = await shell.exec('sudo yum install -y nodejs');

    if (installResult.code !== 0) {
      console.log('Failed to install Node.js via yum.');
      console.log(installResult.stderr || installResult.stdout);
      return;
    }
  }

  // Verify the installation succeeded
  const nodeVersion = await getNodeVersion();
  if (!nodeVersion) {
    console.log('Installation may have failed: node command not found after install.');
    if (hasDnf) {
      console.log('');
      console.log('For Amazon Linux 2023, try running:');
      console.log(`  sudo alternatives --set node /usr/bin/node-${NODESOURCE_LTS_VERSION}`);
    }
    return;
  }

  const npmVersion = await getNpmVersion();

  console.log('Node.js installed successfully.');
  console.log('');
  console.log(`Node.js version: ${nodeVersion}`);
  if (npmVersion) {
    console.log(`npm version: ${npmVersion}`);
  }
  console.log('');
  console.log('Verify installation with: node --version && npm --version');
}

/**
 * Install Node.js LTS on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 1903 or higher (64-bit), or Windows 11
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * This function installs Node.js LTS (Long Term Support) which provides
 * stability and security updates for 30 months. The 'nodejs-lts' package
 * includes both Node.js and npm.
 *
 * IMPORTANT: A new terminal window must be opened after installation
 * for PATH changes to take effect.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if Node.js is already installed...');

  // Check if Node.js is already installed via Chocolatey
  const isChocoNodeInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (isChocoNodeInstalled) {
    const version = await getNodeVersion();
    const npmVersion = await getNpmVersion();
    console.log(`Node.js LTS ${version || 'unknown version'} is already installed via Chocolatey, skipping...`);
    if (npmVersion) {
      console.log(`npm version: ${npmVersion}`);
    }
    return;
  }

  // Also check if node command exists (might be installed via other means)
  const existingVersion = await getNodeVersion();
  if (existingVersion) {
    console.log(`Node.js ${existingVersion} is already installed, skipping...`);
    console.log('');
    console.log('Note: Node.js was not installed via Chocolatey.');
    console.log('If you want to manage it with Chocolatey, first uninstall the existing version.');
    return;
  }

  // Verify Chocolatey is available - it is required for Windows installation
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('');
    console.log('To install Chocolatey, run in an Administrator PowerShell:');
    console.log("  Set-ExecutionPolicy Bypass -Scope Process -Force; " +
      "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; " +
      "iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))");
    return;
  }

  // Install Node.js LTS using Chocolatey
  console.log('Installing Node.js LTS via Chocolatey...');
  console.log('This may take a few minutes...');
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install Node.js LTS via Chocolatey.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you are running as Administrator');
    console.log('  2. Try: choco install nodejs-lts -y --force');
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!verified) {
    console.log('Installation may have failed: nodejs-lts package not found after install.');
    return;
  }

  console.log('Node.js LTS installed successfully via Chocolatey.');
  console.log('');
  console.log('IMPORTANT: Close and reopen your terminal for PATH changes to take effect.');
  console.log('');
  console.log('After reopening the terminal, verify with:');
  console.log('  node --version');
  console.log('  npm --version');
}

/**
 * Install Node.js from Git Bash on Windows.
 *
 * Git Bash runs within Windows and inherits the Windows PATH, so once
 * Node.js is installed on Windows, the 'node' and 'npm' commands are
 * automatically available in Git Bash.
 *
 * This function installs Node.js LTS on the Windows host using Chocolatey
 * via PowerShell interop.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey package manager installed on Windows
 * - Administrator privileges
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('');

  // Check if Node.js is already available (it should be if installed on Windows)
  const existingVersion = await getNodeVersion();
  if (existingVersion) {
    const npmVersion = await getNpmVersion();
    console.log(`Node.js ${existingVersion} is already installed, skipping...`);
    if (npmVersion) {
      console.log(`npm version: ${npmVersion}`);
    }
    return;
  }

  // Install via PowerShell using Chocolatey
  console.log('Installing Node.js LTS on the Windows host via Chocolatey...');
  console.log('This may take a few minutes...');

  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "choco install ${CHOCO_PACKAGE_NAME} -y"`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Node.js LTS.');
    console.log(installResult.stdout || installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure Chocolatey is installed on Windows');
    console.log('  2. Run Git Bash as Administrator and retry');
    console.log('  3. Try installing directly from PowerShell:');
    console.log('     choco install nodejs-lts -y');
    return;
  }

  console.log('Node.js LTS installed successfully.');
  console.log('');
  console.log('IMPORTANT: Close and reopen Git Bash for PATH changes to take effect.');
  console.log('');
  console.log('Git Bash tips:');
  console.log('  - For interactive Node.js REPL, use: winpty node');
  console.log('  - Volume paths for Docker need double slashes: //c/Users/...');
  console.log('');
  console.log('After reopening Git Bash, verify with:');
  console.log('  node --version');
  console.log('  npm --version');
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. Node.js is supported on
 * all major platforms:
 *
 * - macOS: Homebrew (latest stable)
 * - Ubuntu/Debian: APT with NodeSource repository (LTS v22.x)
 * - Ubuntu on WSL: APT with NodeSource repository (LTS v22.x)
 * - Raspberry Pi OS: APT with NodeSource repository (LTS v22.x)
 * - Amazon Linux/RHEL: DNF/YUM (namespaced packages on AL2023, NodeSource on AL2)
 * - Windows: Chocolatey (LTS)
 * - Git Bash: Chocolatey on Windows host (LTS)
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
    console.log(`Node.js is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
  await installer();
}

// Export all functions for use as a module and for testing
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

// Allow direct execution: node node.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
