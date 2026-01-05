#!/usr/bin/env node

/**
 * @fileoverview Install Terraform across supported platforms.
 * @module installs/terraform
 *
 * Terraform is an open-source infrastructure as code (IaC) tool created by HashiCorp.
 * It enables you to define, provision, and manage cloud infrastructure across multiple
 * providers (AWS, Azure, GCP, and many others) using declarative configuration files
 * written in HashiCorp Configuration Language (HCL).
 *
 * Key capabilities:
 * - Multi-cloud provisioning: Manage resources across AWS, Azure, GCP, Kubernetes, and 3,000+ providers
 * - State management: Track infrastructure state to detect drift and enable safe updates
 * - Dependency resolution: Automatically determine the order of resource creation and destruction
 * - Module ecosystem: Reuse infrastructure patterns through the Terraform Registry
 *
 * Supported platforms:
 * - macOS: Homebrew (HashiCorp tap)
 * - Ubuntu/Debian: APT (HashiCorp repository)
 * - Raspberry Pi OS: Manual binary installation (ARM)
 * - Amazon Linux/RHEL: YUM (HashiCorp repository)
 * - Windows: Chocolatey
 * - WSL (Ubuntu): APT (HashiCorp repository)
 * - Git Bash: Windows installation via Chocolatey/PowerShell
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * The name of the Terraform command used to verify installation
 * @constant {string}
 */
const TERRAFORM_COMMAND = 'terraform';

/**
 * The HashiCorp Homebrew tap repository name
 * @constant {string}
 */
const HASHICORP_TAP = 'hashicorp/tap';

/**
 * The Homebrew formula name for Terraform from HashiCorp tap
 * @constant {string}
 */
const BREW_FORMULA_NAME = 'hashicorp/tap/terraform';

/**
 * The Chocolatey package name for Terraform
 * @constant {string}
 */
const CHOCO_PACKAGE_NAME = 'terraform';

/**
 * The Terraform version to use for manual binary installations (Raspberry Pi)
 * Update this when newer versions are released
 * @constant {string}
 */
const TERRAFORM_VERSION = '1.14.3';

/**
 * Check if Terraform is already installed by verifying the terraform command exists
 *
 * This is a quick synchronous check that works across all platforms by looking
 * for the terraform executable in the system PATH.
 *
 * @returns {boolean} True if Terraform is installed and accessible in PATH
 */
function isTerraformInstalled() {
  return shell.commandExists(TERRAFORM_COMMAND);
}

/**
 * Get the installed version of Terraform
 *
 * Executes 'terraform --version' and parses the output to extract the version number.
 * Returns null if Terraform is not installed or the version cannot be determined.
 *
 * @returns {Promise<string|null>} The version string (e.g., "1.14.3") or null if not installed
 */
async function getTerraformVersion() {
  // First check if the command exists to avoid unnecessary exec calls
  if (!isTerraformInstalled()) {
    return null;
  }

  const result = await shell.exec('terraform --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "Terraform v1.14.3\non darwin_arm64"
    const match = result.stdout.match(/Terraform v([\d.]+)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Install Terraform on macOS using Homebrew with the official HashiCorp tap
 *
 * This function:
 * 1. Checks if Terraform is already installed (idempotency)
 * 2. Verifies Homebrew is available
 * 3. Adds the HashiCorp tap if not already present
 * 4. Installs Terraform from the HashiCorp tap
 * 5. Verifies the installation succeeded
 *
 * Prerequisites:
 * - macOS 11 (Big Sur) or later
 * - Homebrew package manager installed
 * - Terminal access
 *
 * Using the HashiCorp tap ensures you receive official releases directly from HashiCorp
 * rather than community-maintained packages.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Terraform is already installed (idempotency check)
  if (isTerraformInstalled()) {
    const version = await getTerraformVersion();
    console.log(`Terraform is already installed (version ${version}), skipping...`);
    return;
  }

  // Verify Homebrew is available before proceeding
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    return;
  }

  // Add the HashiCorp tap to get official Terraform releases
  // The tap command is idempotent - it will succeed even if already tapped
  console.log('Adding HashiCorp Homebrew tap...');
  const tapResult = await brew.tap(HASHICORP_TAP);
  if (!tapResult.success) {
    console.log('Failed to add HashiCorp tap.');
    console.log(tapResult.output);
    return;
  }

  // Install Terraform from the HashiCorp tap
  console.log('Installing Terraform via Homebrew...');
  const installResult = await brew.install(BREW_FORMULA_NAME);

  if (!installResult.success) {
    console.log('Failed to install Terraform via Homebrew.');
    console.log(installResult.output);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  if (isTerraformInstalled()) {
    const version = await getTerraformVersion();
    console.log(`Terraform installed successfully (version ${version}).`);
  } else {
    console.log('Installation completed but Terraform command not found.');
    console.log('You may need to restart your terminal or add Homebrew to your PATH.');
    console.log('Run: eval "$(/opt/homebrew/bin/brew shellenv)"');
  }
}

/**
 * Install Terraform on Ubuntu/Debian using APT with the official HashiCorp repository
 *
 * This function:
 * 1. Checks if Terraform is already installed (idempotency)
 * 2. Installs prerequisite packages (gnupg, software-properties-common, wget)
 * 3. Downloads and installs HashiCorp's GPG key for package verification
 * 4. Adds the official HashiCorp APT repository
 * 5. Updates package lists and installs Terraform
 * 6. Verifies the installation succeeded
 *
 * Prerequisites:
 * - Ubuntu 20.04 or later, or Debian 10 (Buster) or later (64-bit)
 * - sudo privileges
 * - Internet connectivity
 *
 * IMPORTANT: Do not use 'snap install terraform'. The Snap package is maintained
 * by the community, not HashiCorp. Use the official HashiCorp APT repository
 * for production environments.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if Terraform is already installed (idempotency check)
  if (isTerraformInstalled()) {
    const version = await getTerraformVersion();
    console.log(`Terraform is already installed (version ${version}), skipping...`);
    return;
  }

  // Step 1: Install prerequisite packages for GPG key management
  console.log('Installing prerequisite packages...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnupg software-properties-common wget'
  );
  if (prereqResult.code !== 0) {
    console.log('Failed to install prerequisite packages.');
    console.log(prereqResult.stderr || prereqResult.stdout);
    return;
  }

  // Step 2: Download and install HashiCorp's GPG key
  console.log('Adding HashiCorp GPG key...');
  const gpgResult = await shell.exec(
    'wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg'
  );
  if (gpgResult.code !== 0) {
    console.log('Failed to add HashiCorp GPG key.');
    console.log(gpgResult.stderr || gpgResult.stdout);
    return;
  }

  // Step 3: Add the HashiCorp APT repository
  // The repository URL uses the distribution codename from /etc/os-release
  console.log('Adding HashiCorp APT repository...');
  const repoResult = await shell.exec(
    'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] ' +
    'https://apt.releases.hashicorp.com $(grep -oP \'(?<=UBUNTU_CODENAME=).*\' /etc/os-release || lsb_release -cs) main" | ' +
    'sudo tee /etc/apt/sources.list.d/hashicorp.list'
  );
  if (repoResult.code !== 0) {
    console.log('Failed to add HashiCorp repository.');
    console.log(repoResult.stderr || repoResult.stdout);
    return;
  }

  // Step 4: Update package lists and install Terraform
  console.log('Updating package lists...');
  const updateResult2 = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult2.code !== 0) {
    console.log('Warning: Failed to update package lists after adding repository.');
  }

  console.log('Installing Terraform...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y terraform');
  if (installResult.code !== 0) {
    console.log('Failed to install Terraform.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify the installation succeeded
  if (isTerraformInstalled()) {
    const version = await getTerraformVersion();
    console.log(`Terraform installed successfully (version ${version}).`);
  } else {
    console.log('Installation completed but Terraform command not found.');
    console.log('You may need to restart your terminal session.');
  }
}

/**
 * Install Terraform on Ubuntu running in WSL (Windows Subsystem for Linux)
 *
 * WSL Ubuntu follows the same process as native Ubuntu using the HashiCorp APT
 * repository. This function delegates to install_ubuntu() because WSL provides
 * a full Ubuntu environment with APT package management.
 *
 * Prerequisites:
 * - Windows Subsystem for Linux with Ubuntu installed
 * - WSL 2 recommended for best performance
 * - sudo privileges within WSL
 *
 * Note: Terraform installed in WSL is only available within WSL. If you need
 * Terraform in Windows PowerShell, install it separately using Chocolatey.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();
}

/**
 * Install Terraform on Raspberry Pi OS using manual binary installation
 *
 * This function:
 * 1. Checks if Terraform is already installed (idempotency)
 * 2. Detects the system architecture (aarch64 for 64-bit, armv7l for 32-bit)
 * 3. Downloads the appropriate ARM binary from HashiCorp releases
 * 4. Extracts and installs the binary to /usr/local/bin
 * 5. Verifies the installation succeeded
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit strongly recommended) - Bookworm or Bullseye
 * - Raspberry Pi 3B+ or later (64-bit capable hardware)
 * - sudo privileges
 *
 * IMPORTANT: The HashiCorp APT repository provides packages only for AMD64 (x86_64)
 * architecture. For ARM-based Raspberry Pi systems, manual binary installation
 * with the Linux ARM64 or ARM binary is required.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if Terraform is already installed (idempotency check)
  if (isTerraformInstalled()) {
    const version = await getTerraformVersion();
    console.log(`Terraform is already installed (version ${version}), skipping...`);
    return;
  }

  // Detect the system architecture to download the correct binary
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();

  // Determine the correct binary suffix based on architecture
  // aarch64 = 64-bit ARM (recommended), armv7l = 32-bit ARM
  let binaryArch;
  if (arch === 'aarch64') {
    binaryArch = 'linux_arm64';
  } else if (arch === 'armv7l') {
    binaryArch = 'linux_arm';
  } else if (arch === 'x86_64') {
    // For x86_64 on Raspberry Pi (unlikely but possible with emulation)
    binaryArch = 'linux_amd64';
  } else {
    console.log(`Unsupported architecture: ${arch}`);
    console.log('Terraform is available for arm64 (aarch64) and arm (armv7l) architectures.');
    return;
  }

  console.log(`Detected architecture: ${arch} (using ${binaryArch} binary)`);

  // Install unzip if not present (required to extract the download)
  if (!shell.commandExists('unzip')) {
    console.log('Installing unzip...');
    const unzipResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y unzip');
    if (unzipResult.code !== 0) {
      console.log('Failed to install unzip.');
      console.log(unzipResult.stderr || unzipResult.stdout);
      return;
    }
  }

  // Download the Terraform binary from HashiCorp releases
  const downloadUrl = `https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_${binaryArch}.zip`;
  console.log(`Downloading Terraform ${TERRAFORM_VERSION}...`);
  const downloadResult = await shell.exec(`wget -q "${downloadUrl}" -O /tmp/terraform.zip`);
  if (downloadResult.code !== 0) {
    console.log('Failed to download Terraform binary.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    console.log('');
    console.log('If download fails with certificate error, try:');
    console.log('sudo apt-get install -y ca-certificates');
    return;
  }

  // Extract the binary to /tmp
  console.log('Extracting Terraform...');
  const extractResult = await shell.exec('unzip -o -q /tmp/terraform.zip -d /tmp');
  if (extractResult.code !== 0) {
    console.log('Failed to extract Terraform binary.');
    console.log(extractResult.stderr || extractResult.stdout);
    await shell.exec('rm -f /tmp/terraform.zip');
    return;
  }

  // Move the binary to /usr/local/bin and set executable permissions
  console.log('Installing Terraform to /usr/local/bin...');
  const installResult = await shell.exec('sudo mv /tmp/terraform /usr/local/bin/ && sudo chmod +x /usr/local/bin/terraform');
  if (installResult.code !== 0) {
    console.log('Failed to install Terraform binary.');
    console.log(installResult.stderr || installResult.stdout);
    await shell.exec('rm -f /tmp/terraform.zip /tmp/terraform');
    return;
  }

  // Clean up downloaded files
  await shell.exec('rm -f /tmp/terraform.zip');

  // Verify the installation succeeded
  if (isTerraformInstalled()) {
    const version = await getTerraformVersion();
    console.log(`Terraform installed successfully (version ${version}).`);
  } else {
    console.log('Installation completed but Terraform command not found.');
    console.log('Ensure /usr/local/bin is in your PATH:');
    console.log('echo \'export PATH=$PATH:/usr/local/bin\' >> ~/.bashrc && source ~/.bashrc');
  }
}

/**
 * Install Terraform on Amazon Linux/RHEL using YUM with the official HashiCorp repository
 *
 * This function:
 * 1. Checks if Terraform is already installed (idempotency)
 * 2. Installs yum-utils package for repository management
 * 3. Adds the official HashiCorp YUM repository
 * 4. Installs Terraform via yum
 * 5. Verifies the installation succeeded
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), or RHEL 7/8/9
 * - sudo privileges
 * - Internet connectivity
 *
 * Note: Amazon Linux 2023 uses DNF as the default package manager, but the
 * yum command still works as it's aliased to dnf. This function uses yum
 * for compatibility across both AL2 and AL2023.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if Terraform is already installed (idempotency check)
  if (isTerraformInstalled()) {
    const version = await getTerraformVersion();
    console.log(`Terraform is already installed (version ${version}), skipping...`);
    return;
  }

  // Install yum-utils for repository management (provides yum-config-manager)
  console.log('Installing yum-utils...');
  const utilsResult = await shell.exec('sudo yum install -y yum-utils');
  if (utilsResult.code !== 0) {
    console.log('Failed to install yum-utils.');
    console.log(utilsResult.stderr || utilsResult.stdout);
    return;
  }

  // Detect if we're on Amazon Linux or RHEL to use the correct repository
  // Amazon Linux uses the AmazonLinux repository, RHEL/CentOS uses the RHEL repository
  const platform = os.detect();
  const isAmazonLinux = platform.distro === 'amzn' || platform.distro === 'amazon' || platform.type === 'amazon_linux';
  const repoUrl = isAmazonLinux
    ? 'https://rpm.releases.hashicorp.com/AmazonLinux/hashicorp.repo'
    : 'https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo';

  // Add the HashiCorp repository
  console.log('Adding HashiCorp YUM repository...');
  const repoResult = await shell.exec(`sudo yum-config-manager --add-repo ${repoUrl}`);
  if (repoResult.code !== 0) {
    console.log('Failed to add HashiCorp repository.');
    console.log(repoResult.stderr || repoResult.stdout);
    return;
  }

  // Install Terraform
  console.log('Installing Terraform...');
  const installResult = await shell.exec('sudo yum install -y terraform');
  if (installResult.code !== 0) {
    console.log('Failed to install Terraform.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify the installation succeeded
  if (isTerraformInstalled()) {
    const version = await getTerraformVersion();
    console.log(`Terraform installed successfully (version ${version}).`);
  } else {
    console.log('Installation completed but Terraform command not found.');
    console.log('You may need to restart your terminal session.');
  }
}

/**
 * Install Terraform on Windows using Chocolatey
 *
 * This function:
 * 1. Checks if Terraform is already installed (idempotency)
 * 2. Verifies Chocolatey is available
 * 3. Installs Terraform via Chocolatey
 * 4. Verifies the installation succeeded
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * Note: HashiCorp does not maintain the Chocolatey package directly, but it is
 * regularly updated and provides a convenient installation method. For production
 * environments requiring the absolute latest version on release day, consider
 * manual installation.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if Terraform is already installed (idempotency check)
  if (isTerraformInstalled()) {
    const version = await getTerraformVersion();
    console.log(`Terraform is already installed (version ${version}), skipping...`);
    return;
  }

  // Verify Chocolatey is available before proceeding
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('Run in an Administrator PowerShell:');
    console.log("Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))");
    return;
  }

  // Install Terraform via Chocolatey
  console.log('Installing Terraform via Chocolatey...');
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install Terraform via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation - note that PATH may not be updated in current session
  const isInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (isInstalled) {
    console.log('Terraform installed successfully via Chocolatey.');
    console.log('');
    console.log('Note: You may need to open a new terminal window for the PATH update to take effect.');
    console.log('Then run: terraform --version');
  } else {
    console.log('Installation completed but could not verify Terraform package.');
    console.log('Try opening a new terminal window and run: terraform --version');
  }
}

/**
 * Install Terraform in Git Bash on Windows via Chocolatey/PowerShell
 *
 * Git Bash inherits the Windows PATH, so once Terraform is installed on Windows
 * via Chocolatey, it is automatically available in Git Bash. This function
 * invokes Chocolatey through PowerShell from Git Bash.
 *
 * This function:
 * 1. Checks if Terraform is already available (from Windows PATH)
 * 2. Invokes Chocolatey via PowerShell to install Terraform
 * 3. Provides instructions for PATH updates
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey installed on Windows
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if Terraform is already available (inherited from Windows PATH)
  if (isTerraformInstalled()) {
    const version = await getTerraformVersion();
    console.log(`Terraform is already installed (version ${version}), skipping...`);
    return;
  }

  // Check if Chocolatey is available via Windows path
  const chocoPath = '/c/ProgramData/chocolatey/bin/choco.exe';
  const chocoResult = await shell.exec(`"${chocoPath}" --version 2>/dev/null`);

  if (chocoResult.code !== 0) {
    console.log('Chocolatey is not installed on Windows.');
    console.log('Please install Chocolatey first, then run this installer again.');
    console.log('');
    console.log('Or install Terraform manually from:');
    console.log('https://developer.hashicorp.com/terraform/install');
    return;
  }

  // Install Terraform via Windows Chocolatey
  console.log('Installing Terraform via Windows Chocolatey...');
  const result = await shell.exec(`"${chocoPath}" install terraform -y`);

  if (result.code !== 0) {
    console.log('Failed to install Terraform via Chocolatey.');
    console.log(result.stderr || result.stdout);
    return;
  }

  console.log('Terraform installed successfully.');
  console.log('');
  console.log('Please close and reopen Git Bash for the terraform command to be available.');
  console.log('');
  console.log('If terraform is still not found, add this to your ~/.bashrc:');
  console.log('export PATH=$PATH:/c/ProgramData/chocolatey/bin');
}

/**
 * Check if Terraform is installed on the current system.
 * @returns {Promise<boolean>} True if Terraform is installed
 */
async function isInstalled() {
  const platform = os.detect();
  if (platform.type === 'macos') {
    return brew.isFormulaInstalled(BREW_FORMULA_NAME);
  }
  if (platform.type === 'windows') {
    return choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  }
  return shell.commandExists(TERRAFORM_COMMAND);
}

/**
 * Check if this installer is supported on the current platform.
 * Terraform is available on all major platforms.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer
 *
 * This function detects the current operating system using the os utility module
 * and dispatches to the appropriate platform-specific installer function.
 *
 * Supported platforms:
 * - macos: Uses Homebrew with HashiCorp tap
 * - ubuntu: Uses APT with HashiCorp repository
 * - debian: Uses APT with HashiCorp repository (same as ubuntu)
 * - wsl: Uses APT with HashiCorp repository (same as ubuntu)
 * - raspbian: Uses manual binary installation (ARM)
 * - amazon_linux: Uses YUM with HashiCorp repository
 * - rhel: Uses YUM with HashiCorp repository (same as amazon_linux)
 * - fedora: Uses YUM/DNF with HashiCorp repository
 * - windows: Uses Chocolatey
 * - gitbash: Uses Windows Chocolatey via Git Bash
 *
 * Unsupported platforms will receive a graceful message and the script
 * will exit cleanly without errors.
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
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  // Look up the installer for the detected platform
  const installer = installers[platform.type];

  // If no installer exists for this platform, inform the user gracefully
  // Do not throw an error - just log a message and return cleanly
  if (!installer) {
    console.log(`Terraform is not available for ${platform.type}.`);
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
  // Export helper functions for potential reuse or testing
  isTerraformInstalled,
  getTerraformVersion,
};

// Allow direct execution: node terraform.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
