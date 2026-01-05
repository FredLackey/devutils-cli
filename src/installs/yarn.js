#!/usr/bin/env node

/**
 * @fileoverview Install Yarn - Fast, reliable, and secure JavaScript package manager.
 * @module installs/yarn
 *
 * Yarn is a fast, reliable, and secure JavaScript package manager developed by
 * Facebook (now Meta) as an alternative to npm. It addresses key pain points in
 * JavaScript dependency management by offering deterministic installations,
 * offline caching, and parallel downloads.
 *
 * Key capabilities of Yarn:
 * - Deterministic dependency resolution through lockfiles
 * - Parallel package downloads for faster installations
 * - Offline mode using cached packages
 * - Workspaces for monorepo management
 * - Security-focused design with integrity checks
 *
 * This installer provides Yarn Classic (1.x) for system-wide availability:
 * - macOS: Yarn via Homebrew
 * - Ubuntu/Debian: Yarn via APT with official Yarn repository
 * - Raspberry Pi OS: Yarn via APT with official Yarn repository
 * - Amazon Linux/RHEL: Yarn via DNF/YUM with official Yarn repository
 * - Windows: Yarn via Chocolatey
 * - WSL (Ubuntu): Yarn via APT with official Yarn repository
 * - Git Bash: Yarn installed on Windows host via Chocolatey
 *
 * IMPORTANT NOTE:
 * This installer provides Yarn Classic (1.x) for maximum compatibility. For
 * projects requiring Yarn Modern (2.x, 3.x, or 4.x), install Node.js first,
 * then use Corepack: `corepack enable && yarn init -2`
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew formula name for Yarn on macOS.
 * This installs Yarn Classic (1.22.x).
 */
const HOMEBREW_FORMULA_NAME = 'yarn';

/**
 * The Chocolatey package name for Yarn on Windows.
 * This installs Yarn Classic (1.22.x).
 */
const CHOCO_PACKAGE_NAME = 'yarn';

/**
 * The URL for the Yarn GPG public key used to verify packages.
 * This key is used when adding the official Yarn APT/YUM repository.
 */
const YARN_GPG_KEY_URL = 'https://dl.yarnpkg.com/debian/pubkey.gpg';

/**
 * The path where the Yarn GPG keyring will be stored on Debian-based systems.
 * Using the modern signed-by approach for APT repository verification.
 */
const YARN_KEYRING_PATH = '/etc/apt/keyrings/yarn-archive-keyring.gpg';

/**
 * The APT repository line for Yarn on Debian-based systems.
 * Uses the signed-by directive for modern GPG key verification.
 */
const YARN_APT_REPO = `deb [signed-by=${YARN_KEYRING_PATH}] https://dl.yarnpkg.com/debian/ stable main`;

/**
 * The path where the Yarn APT sources list file will be stored.
 */
const YARN_APT_LIST_PATH = '/etc/apt/sources.list.d/yarn.list';

/**
 * The URL for the Yarn YUM/DNF repository configuration file.
 */
const YARN_RPM_REPO_URL = 'https://dl.yarnpkg.com/rpm/yarn.repo';

/**
 * The path where the Yarn YUM/DNF repository file will be stored.
 */
const YARN_RPM_REPO_PATH = '/etc/yum.repos.d/yarn.repo';

/**
 * The URL for the Yarn RPM GPG public key.
 */
const YARN_RPM_GPG_KEY_URL = 'https://dl.yarnpkg.com/rpm/pubkey.gpg';

/**
 * Check if the Yarn CLI is installed by verifying the 'yarn' command exists.
 *
 * This is a quick synchronous check that works across all platforms.
 * It verifies that the 'yarn' executable is available in the system PATH.
 *
 * @returns {boolean} True if the yarn command is available, false otherwise
 */
function isYarnCommandAvailable() {
  return shell.commandExists('yarn');
}

/**
 * Check if Yarn is installed and get the version.
 *
 * Executes 'yarn --version' to verify Yarn is properly installed
 * and operational. Returns the version string if successful.
 *
 * @returns {Promise<string|null>} Yarn version string (e.g., "1.22.22"), or null if not installed
 */
async function getYarnVersion() {
  if (!isYarnCommandAvailable()) {
    return null;
  }

  const result = await shell.exec('yarn --version');
  if (result.code === 0 && result.stdout) {
    return result.stdout.trim();
  }
  return null;
}

/**
 * Set up the official Yarn APT repository on Ubuntu/Debian systems.
 *
 * This function:
 * 1. Removes the conflicting cmdtest package (which provides a different 'yarn' command)
 * 2. Installs prerequisites (curl, gnupg, ca-certificates)
 * 3. Creates the keyring directory if it does not exist
 * 4. Downloads and stores the Yarn GPG key
 * 5. Adds the official Yarn APT repository
 *
 * @returns {Promise<void>}
 * @throws {Error} If repository setup fails
 */
async function setupYarnAptRepository() {
  console.log('Setting up official Yarn APT repository...');

  // Step 1: Remove cmdtest package if present (it conflicts with Yarn)
  // The cmdtest package provides a different program called 'yarn'
  console.log('Removing conflicting cmdtest package if present...');
  await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y cmdtest 2>/dev/null || true');

  // Step 2: Install prerequisites needed to download and verify the Yarn repository
  console.log('Installing prerequisites (curl, gnupg, ca-certificates)...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl gnupg ca-certificates'
  );
  if (prereqResult.code !== 0) {
    throw new Error(`Failed to install prerequisites: ${prereqResult.stderr}`);
  }

  // Step 3: Ensure the keyring directory exists
  console.log('Creating keyring directory...');
  const mkdirResult = await shell.exec('sudo mkdir -p /etc/apt/keyrings');
  if (mkdirResult.code !== 0) {
    throw new Error(`Failed to create keyring directory: ${mkdirResult.stderr}`);
  }

  // Step 4: Download and store the Yarn GPG key using the modern signed-by approach
  console.log('Adding Yarn GPG key...');
  const gpgKeyResult = await shell.exec(
    `curl -sS ${YARN_GPG_KEY_URL} | gpg --dearmor | sudo tee ${YARN_KEYRING_PATH} > /dev/null`
  );
  if (gpgKeyResult.code !== 0) {
    throw new Error(
      `Failed to add Yarn GPG key.\n` +
      `Output: ${gpgKeyResult.stderr || gpgKeyResult.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check your internet connection\n` +
      `  2. Verify gnupg is installed: sudo apt-get install -y gnupg\n` +
      `  3. Try manually: curl -sS ${YARN_GPG_KEY_URL} | gpg --dearmor | sudo tee ${YARN_KEYRING_PATH}`
    );
  }

  // Step 5: Add the official Yarn APT repository
  console.log('Adding Yarn APT repository...');
  const repoResult = await shell.exec(
    `echo "${YARN_APT_REPO}" | sudo tee ${YARN_APT_LIST_PATH} > /dev/null`
  );
  if (repoResult.code !== 0) {
    throw new Error(`Failed to add Yarn repository: ${repoResult.stderr}`);
  }

  // Update package lists to include the new repository
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package lists: ${updateResult.stderr}`);
  }

  console.log('Yarn APT repository configured successfully.');
}

/**
 * Set up the official Yarn YUM/DNF repository on Amazon Linux/RHEL systems.
 *
 * This function:
 * 1. Imports the Yarn RPM GPG key
 * 2. Downloads and installs the Yarn repository configuration
 *
 * @returns {Promise<void>}
 * @throws {Error} If repository setup fails
 */
async function setupYarnRpmRepository() {
  console.log('Setting up official Yarn YUM/DNF repository...');

  // Step 1: Import the Yarn RPM GPG key for package verification
  console.log('Importing Yarn GPG key...');
  const gpgResult = await shell.exec(`sudo rpm --import ${YARN_RPM_GPG_KEY_URL}`);
  if (gpgResult.code !== 0) {
    throw new Error(
      `Failed to import Yarn GPG key.\n` +
      `Output: ${gpgResult.stderr || gpgResult.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check your internet connection\n` +
      `  2. Try manually: sudo rpm --import ${YARN_RPM_GPG_KEY_URL}`
    );
  }

  // Step 2: Download and install the Yarn repository configuration file
  console.log('Adding Yarn repository...');
  const repoResult = await shell.exec(
    `sudo curl -sL ${YARN_RPM_REPO_URL} -o ${YARN_RPM_REPO_PATH}`
  );
  if (repoResult.code !== 0) {
    throw new Error(
      `Failed to add Yarn repository.\n` +
      `Output: ${repoResult.stderr || repoResult.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check your internet connection\n` +
      `  2. Try manually: sudo curl -sL ${YARN_RPM_REPO_URL} -o ${YARN_RPM_REPO_PATH}`
    );
  }

  console.log('Yarn YUM/DNF repository configured successfully.');
}

/**
 * Install Yarn on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later (macOS 14 Sonoma or later recommended)
 * - Homebrew package manager installed
 * - Node.js installed (Homebrew will install it as a dependency if missing)
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * This function installs Yarn Classic (1.22.x) via Homebrew.
 *
 * After installation, Yarn will be available at:
 * - Apple Silicon Macs: /opt/homebrew/bin/yarn
 * - Intel Macs: /usr/local/bin/yarn
 *
 * Note: The Homebrew yarn formula conflicts with corepack and hadoop packages.
 * If you have either installed, you must uninstall them first.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if Yarn is already installed...');

  // Check if Yarn is already installed via Homebrew formula
  const isBrewYarnInstalled = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (isBrewYarnInstalled) {
    const version = await getYarnVersion();
    console.log(`Yarn ${version || 'unknown version'} is already installed via Homebrew, skipping...`);
    return;
  }

  // Also check if yarn command exists (might be installed via other means like npm)
  const existingVersion = await getYarnVersion();
  if (existingVersion) {
    console.log(`Yarn ${existingVersion} is already installed, skipping...`);
    console.log('');
    console.log('Note: Yarn was not installed via Homebrew.');
    console.log('If you want to manage it with Homebrew, first uninstall the existing version.');
    return;
  }

  // Verify Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Install Yarn using Homebrew
  console.log('Installing Yarn via Homebrew...');
  const result = await brew.install(HOMEBREW_FORMULA_NAME);

  if (!result.success) {
    console.log('Failed to install Yarn via Homebrew.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  - If you see a conflict with corepack, run: brew uninstall yarn && corepack enable');
    console.log('  - Ensure Node.js is installed: brew install node');
    return;
  }

  // Verify the installation succeeded
  const verified = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (!verified) {
    console.log('Installation may have failed: Yarn formula not found after install.');
    return;
  }

  // Display installed version
  const yarnVersion = await getYarnVersion();

  console.log('Yarn installed successfully via Homebrew.');
  console.log('');
  if (yarnVersion) {
    console.log(`Yarn version: ${yarnVersion}`);
  }
  console.log('');
  console.log('Verify installation with: yarn --version');
}

/**
 * Install Yarn on Ubuntu/Debian using APT with the official Yarn repository.
 *
 * Prerequisites:
 * - Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later (64-bit)
 * - sudo privileges
 * - Node.js installed (install via NodeSource repository for latest versions)
 * - Internet connectivity
 *
 * IMPORTANT: Some older Ubuntu versions ship with a package called 'cmdtest' that
 * provides a different 'yarn' command. This function removes cmdtest first to
 * avoid conflicts.
 *
 * This function:
 * 1. Removes the conflicting cmdtest package
 * 2. Adds the official Yarn APT repository
 * 3. Installs Yarn Classic (1.22.x) via APT
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if Yarn is already installed...');

  // Check if Yarn is already installed
  const existingVersion = await getYarnVersion();
  if (existingVersion) {
    console.log(`Yarn ${existingVersion} is already installed, skipping...`);
    return;
  }

  // Set up the official Yarn APT repository
  await setupYarnAptRepository();

  // Install Yarn from the official Yarn repository
  console.log('Installing Yarn via APT...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y yarn'
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Yarn via APT.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure the Yarn repository was added correctly:');
    console.log(`     cat ${YARN_APT_LIST_PATH}`);
    console.log('  2. Run "sudo apt-get update" and retry');
    console.log('  3. Ensure Node.js is installed: dev install node');
    return;
  }

  // Verify the installation succeeded
  const yarnVersion = await getYarnVersion();
  if (!yarnVersion) {
    console.log('Installation may have failed: yarn command not found after install.');
    return;
  }

  console.log('Yarn installed successfully.');
  console.log('');
  console.log(`Yarn version: ${yarnVersion}`);
  console.log('');
  console.log('Verify installation with: yarn --version');
}

/**
 * Install Yarn on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 * - Node.js installed within WSL
 *
 * WSL runs Ubuntu within Windows, so Yarn installation follows the same
 * APT-based process as native Ubuntu using the official Yarn repository.
 *
 * NOTE: The Yarn installed within WSL is separate from any Yarn
 * installation on the Windows host. It is common and expected to have
 * different Yarn versions in WSL and Windows.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Check if Yarn is already installed
  const existingVersion = await getYarnVersion();
  if (existingVersion) {
    console.log(`Yarn ${existingVersion} is already installed, skipping...`);
    return;
  }

  // Set up the official Yarn APT repository
  await setupYarnAptRepository();

  // Install Yarn from the official Yarn repository
  console.log('Installing Yarn via APT...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y yarn'
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Yarn via APT.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify the installation succeeded
  const yarnVersion = await getYarnVersion();
  if (!yarnVersion) {
    console.log('Installation may have failed: yarn command not found after install.');
    return;
  }

  console.log('Yarn installed successfully in WSL.');
  console.log('');
  console.log(`Yarn version: ${yarnVersion}`);
  console.log('');
  console.log('WSL Tips:');
  console.log('  - Store projects in ~/... (Linux filesystem) for best yarn performance');
  console.log('  - Accessing /mnt/c/... (Windows filesystem) is slower for yarn operations');
  console.log('');
  console.log('Verify installation with: yarn --version');
}

/**
 * Install Yarn on Raspberry Pi OS using APT with the official Yarn repository.
 *
 * Prerequisites:
 * - Raspberry Pi OS (Bookworm or Bullseye recommended)
 * - Raspberry Pi 3B+ or later (64-bit OS recommended)
 * - At least 1 GB RAM (2 GB or more recommended)
 * - sudo privileges
 * - Node.js installed
 * - Internet connectivity
 *
 * This function supports both 64-bit (aarch64) and 32-bit (armv7l) Raspberry Pi OS.
 * The official Yarn repository provides builds for both architectures.
 *
 * The installation process is identical to Ubuntu/Debian since Raspberry Pi OS
 * is Debian-based.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if Yarn is already installed...');

  // Check if Yarn is already installed
  const existingVersion = await getYarnVersion();
  if (existingVersion) {
    console.log(`Yarn ${existingVersion} is already installed, skipping...`);
    return;
  }

  // Check and report architecture for informational purposes
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  console.log(`Detected architecture: ${arch}`);

  // Set up the official Yarn APT repository
  await setupYarnAptRepository();

  // Install Yarn from the official Yarn repository
  console.log('Installing Yarn via APT...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y yarn'
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Yarn via APT.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify the installation succeeded
  const yarnVersion = await getYarnVersion();
  if (!yarnVersion) {
    console.log('Installation may have failed: yarn command not found after install.');
    return;
  }

  console.log('Yarn installed successfully.');
  console.log('');
  console.log(`Yarn version: ${yarnVersion}`);
  console.log('');
  console.log('NOTE: If yarn install is slow or runs out of memory, consider:');
  console.log('  - Using a faster SD card (Class 10, A1/A2 rated)');
  console.log('  - Increasing swap space for memory-intensive operations');
  console.log('');
  console.log('Verify installation with: yarn --version');
}

/**
 * Install Yarn on Amazon Linux using DNF or YUM with the official Yarn repository.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - Alternatively: RHEL 8+, CentOS Stream 8+, Fedora 36+
 * - sudo privileges
 * - Node.js installed
 * - Internet connectivity
 *
 * Note: Amazon Linux 2023 uses DNF as the package manager. Amazon Linux 2 uses YUM.
 * This function automatically detects and uses the appropriate package manager.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if Yarn is already installed...');

  // Check if Yarn is already installed
  const existingVersion = await getYarnVersion();
  if (existingVersion) {
    console.log(`Yarn ${existingVersion} is already installed, skipping...`);
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

  // Set up the official Yarn YUM/DNF repository
  await setupYarnRpmRepository();

  // Install Yarn using the detected package manager
  console.log(`Installing Yarn via ${packageManager}...`);
  const installCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y yarn'
    : 'sudo yum install -y yarn';

  const installResult = await shell.exec(installCommand);

  if (installResult.code !== 0) {
    console.log(`Failed to install Yarn via ${packageManager}.`);
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log(`  1. Verify the Yarn repository was added: cat ${YARN_RPM_REPO_PATH}`);
    console.log(`  2. Clean cache and retry: sudo ${packageManager} clean all`);
    console.log('  3. Ensure Node.js is installed: dev install node');
    return;
  }

  // Verify the installation succeeded
  const yarnVersion = await getYarnVersion();
  if (!yarnVersion) {
    console.log('Installation may have failed: yarn command not found after install.');
    return;
  }

  console.log('Yarn installed successfully.');
  console.log('');
  console.log(`Yarn version: ${yarnVersion}`);
  console.log('');
  console.log('Verify installation with: yarn --version');
}

/**
 * Install Yarn on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 1903 or higher (64-bit), or Windows 11
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 * - Node.js installed (Chocolatey can install it automatically)
 * - Internet connectivity
 *
 * This function installs Yarn Classic (1.22.x) via Chocolatey.
 *
 * IMPORTANT: A new terminal window must be opened after installation
 * for PATH changes to take effect.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if Yarn is already installed...');

  // Check if Yarn is already installed via Chocolatey
  const isChocoYarnInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (isChocoYarnInstalled) {
    const version = await getYarnVersion();
    console.log(`Yarn ${version || 'unknown version'} is already installed via Chocolatey, skipping...`);
    return;
  }

  // Also check if yarn command exists (might be installed via other means)
  const existingVersion = await getYarnVersion();
  if (existingVersion) {
    console.log(`Yarn ${existingVersion} is already installed, skipping...`);
    console.log('');
    console.log('Note: Yarn was not installed via Chocolatey.');
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

  // Install Yarn using Chocolatey
  console.log('Installing Yarn via Chocolatey...');
  console.log('This may take a few minutes...');
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install Yarn via Chocolatey.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you are running as Administrator');
    console.log('  2. Try: choco install yarn -y --force');
    console.log('  3. Ensure Node.js is installed: choco install nodejs-lts -y');
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!verified) {
    console.log('Installation may have failed: Yarn package not found after install.');
    return;
  }

  console.log('Yarn installed successfully via Chocolatey.');
  console.log('');
  console.log('IMPORTANT: Close and reopen your terminal for PATH changes to take effect.');
  console.log('');
  console.log('After reopening the terminal, verify with:');
  console.log('  yarn --version');
}

/**
 * Install Yarn from Git Bash on Windows.
 *
 * Git Bash runs within Windows and inherits the Windows PATH, so once
 * Yarn is installed on Windows, the 'yarn' command is automatically
 * available in Git Bash.
 *
 * This function installs Yarn on the Windows host using Chocolatey
 * via PowerShell interop.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey package manager installed on Windows
 * - Administrator privileges
 * - Node.js installed
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('');

  // Check if Yarn is already available (it should be if installed on Windows)
  const existingVersion = await getYarnVersion();
  if (existingVersion) {
    console.log(`Yarn ${existingVersion} is already installed, skipping...`);
    return;
  }

  // Install via PowerShell using Chocolatey
  console.log('Installing Yarn on the Windows host via Chocolatey...');
  console.log('This may take a few minutes...');

  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "choco install ${CHOCO_PACKAGE_NAME} -y"`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Yarn.');
    console.log(installResult.stdout || installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure Chocolatey is installed on Windows');
    console.log('  2. Run Git Bash as Administrator and retry');
    console.log('  3. Ensure Node.js is installed: choco install nodejs-lts -y');
    console.log('  4. Try installing directly from PowerShell:');
    console.log('     choco install yarn -y');
    return;
  }

  console.log('Yarn installed successfully.');
  console.log('');
  console.log('IMPORTANT: Close and reopen Git Bash for PATH changes to take effect.');
  console.log('');
  console.log('Git Bash tips:');
  console.log('  - For interactive yarn commands, you may need: winpty yarn');
  console.log('  - Add alias to ~/.bashrc if needed: alias yarn="winpty yarn"');
  console.log('');
  console.log('After reopening Git Bash, verify with:');
  console.log('  yarn --version');
}

/**
 * Check if Yarn is installed on the current system.
 * @returns {Promise<boolean>} True if Yarn is installed
 */
async function isInstalled() {
  const platform = os.detect();
  if (platform.type === 'macos') {
    return brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  }
  if (platform.type === 'windows') {
    return choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  }
  return isYarnCommandAvailable();
}

/**
 * Check if this installer is supported on the current platform.
 * Yarn is supported on all major platforms.
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
 * appropriate platform-specific installer function. Yarn is supported on
 * all major platforms:
 *
 * - macOS: Homebrew (Yarn Classic 1.22.x)
 * - Ubuntu/Debian: APT with official Yarn repository (Yarn Classic 1.22.x)
 * - Ubuntu on WSL: APT with official Yarn repository (Yarn Classic 1.22.x)
 * - Raspberry Pi OS: APT with official Yarn repository (Yarn Classic 1.22.x)
 * - Amazon Linux/RHEL: DNF/YUM with official Yarn repository (Yarn Classic 1.22.x)
 * - Windows: Chocolatey (Yarn Classic 1.22.x)
 * - Git Bash: Chocolatey on Windows host (Yarn Classic 1.22.x)
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
    console.log(`Yarn is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
  await installer();
}

// Export all functions for use as a module and for testing
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

// Allow direct execution: node yarn.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
