#!/usr/bin/env node

/**
 * @fileoverview Install Visual Studio Code - a powerful code editor by Microsoft.
 * @module installs/vscode
 *
 * Visual Studio Code (VS Code) is a free, open-source code editor developed by
 * Microsoft. It provides a lightweight yet powerful development environment with
 * built-in support for JavaScript, TypeScript, and Node.js, along with a rich
 * ecosystem of extensions for other languages and tools.
 *
 * VS Code features:
 * - Intelligent code completion (IntelliSense)
 * - Integrated debugging
 * - Git integration
 * - Highly customizable interface
 * - Extensive extension marketplace
 *
 * This installer provides:
 * - macOS: VS Code via Homebrew cask
 * - Ubuntu/Debian: VS Code via Microsoft's APT repository
 * - Raspberry Pi OS: VS Code via APT (available in Raspberry Pi OS repository)
 * - Amazon Linux/RHEL: VS Code via Microsoft's YUM/DNF repository
 * - Windows: VS Code via Chocolatey
 * - WSL (Ubuntu): VS Code via Microsoft's APT repository
 * - Git Bash: VS Code installed on Windows host via Chocolatey
 *
 * IMPORTANT PLATFORM NOTES:
 * - On Ubuntu/Debian, Microsoft's repository is used for the latest version
 * - Raspberry Pi OS includes VS Code in its default repository for ARM compatibility
 * - On Windows, a new terminal window must be opened after installation for
 *   PATH changes to take effect
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew cask name for Visual Studio Code on macOS.
 * This installs the full VS Code application to /Applications.
 */
const HOMEBREW_CASK_NAME = 'visual-studio-code';

/**
 * The Chocolatey package name for Visual Studio Code on Windows.
 * This is the official VS Code package maintained by the Chocolatey community.
 */
const CHOCO_PACKAGE_NAME = 'vscode';

/**
 * The APT package name for Visual Studio Code on Debian-based systems.
 * This is the package name used in Microsoft's repository.
 */
const APT_PACKAGE_NAME = 'code';

/**
 * Microsoft's GPG key URL for package verification.
 * This key is used to verify the authenticity of VS Code packages.
 */
const MICROSOFT_GPG_KEY_URL = 'https://packages.microsoft.com/keys/microsoft.asc';

/**
 * Check if VS Code CLI is installed by verifying the 'code' command exists.
 *
 * This is a quick synchronous check that works across all platforms.
 * It verifies that the 'code' executable is available in the system PATH.
 *
 * @returns {boolean} True if the code command is available, false otherwise
 */
function isCodeCommandAvailable() {
  return shell.commandExists('code');
}

/**
 * Check if VS Code is installed and get the version.
 *
 * Executes 'code --version' to verify VS Code is properly installed
 * and operational. Returns the version string if successful.
 *
 * @returns {Promise<string|null>} VS Code version string (e.g., "1.107.1"), or null if not installed
 */
async function getVSCodeVersion() {
  if (!isCodeCommandAvailable()) {
    return null;
  }

  const result = await shell.exec('code --version');
  if (result.code === 0 && result.stdout) {
    // Output format: First line is version (e.g., "1.107.1")
    const lines = result.stdout.trim().split('\n');
    return lines[0] || null;
  }
  return null;
}

/**
 * Set up Microsoft's APT repository for VS Code on Ubuntu/Debian.
 *
 * This function:
 * 1. Installs prerequisites (wget, gpg, apt-transport-https)
 * 2. Imports Microsoft's GPG key for package verification
 * 3. Adds Microsoft's VS Code repository to APT sources
 * 4. Updates the package cache
 *
 * @returns {Promise<void>}
 * @throws {Error} If any step fails
 */
async function setupMicrosoftAptRepository() {
  console.log('Setting up Microsoft APT repository for VS Code...');

  // Install prerequisites needed to download and verify the repository
  console.log('Installing prerequisites (wget, gpg, apt-transport-https)...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget gpg apt-transport-https'
  );
  if (prereqResult.code !== 0) {
    throw new Error(`Failed to install prerequisites: ${prereqResult.stderr}`);
  }

  // Download and import Microsoft's GPG key
  console.log('Importing Microsoft GPG key...');
  const gpgResult = await shell.exec(
    `wget -qO- ${MICROSOFT_GPG_KEY_URL} | gpg --dearmor > /tmp/microsoft.gpg && ` +
    'sudo install -D -o root -g root -m 644 /tmp/microsoft.gpg /usr/share/keyrings/microsoft.gpg && ' +
    'rm -f /tmp/microsoft.gpg'
  );
  if (gpgResult.code !== 0) {
    throw new Error(`Failed to import Microsoft GPG key: ${gpgResult.stderr}`);
  }

  // Add Microsoft's APT repository using the DEB822 format for modern systems
  console.log('Adding Microsoft VS Code repository...');
  const repoContent = `Types: deb
URIs: https://packages.microsoft.com/repos/code
Suites: stable
Components: main
Architectures: amd64,arm64,armhf
Signed-By: /usr/share/keyrings/microsoft.gpg`;

  const repoResult = await shell.exec(
    `echo "${repoContent}" | sudo tee /etc/apt/sources.list.d/vscode.sources > /dev/null`
  );
  if (repoResult.code !== 0) {
    throw new Error(`Failed to add Microsoft repository: ${repoResult.stderr}`);
  }

  // Update package cache to include the new repository
  console.log('Updating package cache...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package cache: ${updateResult.stderr}`);
  }

  console.log('Microsoft APT repository configured successfully.');
}

/**
 * Set up Microsoft's YUM/DNF repository for VS Code on Amazon Linux/RHEL.
 *
 * This function:
 * 1. Imports Microsoft's GPG key using rpm
 * 2. Creates the repository configuration file
 *
 * @returns {Promise<void>}
 * @throws {Error} If any step fails
 */
async function setupMicrosoftYumRepository() {
  console.log('Setting up Microsoft YUM repository for VS Code...');

  // Import Microsoft's GPG key
  console.log('Importing Microsoft GPG key...');
  const gpgResult = await shell.exec(
    `sudo rpm --import ${MICROSOFT_GPG_KEY_URL}`
  );
  if (gpgResult.code !== 0) {
    throw new Error(`Failed to import Microsoft GPG key: ${gpgResult.stderr}`);
  }

  // Create the repository configuration file
  console.log('Adding Microsoft VS Code repository...');
  const repoContent = `[code]
name=Visual Studio Code
baseurl=https://packages.microsoft.com/yumrepos/vscode
enabled=1
autorefresh=1
type=rpm-md
gpgcheck=1
gpgkey=${MICROSOFT_GPG_KEY_URL}`;

  const repoResult = await shell.exec(
    `echo -e "${repoContent}" | sudo tee /etc/yum.repos.d/vscode.repo > /dev/null`
  );
  if (repoResult.code !== 0) {
    throw new Error(`Failed to add Microsoft repository: ${repoResult.stderr}`);
  }

  console.log('Microsoft YUM repository configured successfully.');
}

/**
 * Install Visual Studio Code on macOS using Homebrew cask.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * This function installs VS Code as a macOS application via Homebrew cask.
 * The 'code' command-line tool is typically added to PATH automatically
 * on modern versions.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if Visual Studio Code is already installed...');

  // Check if VS Code cask is already installed via Homebrew
  const isCaskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (isCaskInstalled) {
    const version = await getVSCodeVersion();
    console.log(`Visual Studio Code ${version || 'unknown version'} is already installed via Homebrew, skipping...`);
    return;
  }

  // Also check if the code command exists (might be installed by other means)
  const existingVersion = await getVSCodeVersion();
  if (existingVersion) {
    console.log(`Visual Studio Code ${existingVersion} is already installed, skipping...`);
    console.log('');
    console.log('Note: VS Code was not installed via Homebrew.');
    console.log('If you want to manage it with Homebrew, first uninstall the existing version.');
    return;
  }

  // Verify Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Install VS Code using Homebrew cask
  console.log('Installing Visual Studio Code via Homebrew...');
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    console.log('Failed to install Visual Studio Code via Homebrew.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "brew update && brew cleanup" and retry');
    console.log('  2. If on Apple Silicon, ensure you have Rosetta 2: softwareupdate --install-rosetta');
    console.log('  3. Try manual installation: brew reinstall --cask visual-studio-code');
    return;
  }

  // Verify the installation succeeded
  const verified = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (!verified) {
    console.log('Installation may have failed: VS Code cask not found after install.');
    return;
  }

  // Display installed version
  const version = await getVSCodeVersion();

  console.log('Visual Studio Code installed successfully via Homebrew.');
  console.log('');
  if (version) {
    console.log(`VS Code version: ${version}`);
    console.log('');
  }
  console.log('NOTE: If "code" command is not found, you can add it to PATH by:');
  console.log('  1. Launch VS Code');
  console.log('  2. Open Command Palette (Cmd+Shift+P)');
  console.log('  3. Run "Shell Command: Install \'code\' command in PATH"');
  console.log('');
  console.log('Verify installation with: code --version');
}

/**
 * Install Visual Studio Code on Ubuntu/Debian using APT with Microsoft's repository.
 *
 * Prerequisites:
 * - Ubuntu 20.04 (Focal) or later, or Debian 10 (Buster) or later (64-bit)
 * - sudo privileges
 * - wget and gpg utilities
 *
 * IMPORTANT: This function adds Microsoft's APT repository to ensure the
 * latest version of VS Code is installed. Do not use 'apt install code'
 * without first adding the repository.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if Visual Studio Code is already installed...');

  // Check if VS Code is already installed via APT
  const isAptInstalled = await apt.isPackageInstalled(APT_PACKAGE_NAME);
  if (isAptInstalled) {
    const version = await getVSCodeVersion();
    console.log(`Visual Studio Code ${version || 'unknown version'} is already installed, skipping...`);
    return;
  }

  // Also check if the code command exists (might be installed by other means)
  const existingVersion = await getVSCodeVersion();
  if (existingVersion) {
    console.log(`Visual Studio Code ${existingVersion} is already installed, skipping...`);
    return;
  }

  // Set up Microsoft's APT repository
  await setupMicrosoftAptRepository();

  // Install VS Code from the Microsoft repository
  console.log('Installing Visual Studio Code via APT...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Visual Studio Code via APT.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "sudo apt-get update" and retry');
    console.log('  2. Check if the Microsoft repository was added:');
    console.log('     cat /etc/apt/sources.list.d/vscode.sources');
    console.log('  3. Verify the GPG key exists: ls -la /usr/share/keyrings/microsoft.gpg');
    return;
  }

  // Verify the installation succeeded
  const version = await getVSCodeVersion();
  if (!version) {
    console.log('Installation may have failed: code command not found after install.');
    return;
  }

  console.log('Visual Studio Code installed successfully.');
  console.log('');
  console.log(`VS Code version: ${version}`);
  console.log('');
  console.log('Verify installation with: code --version');
}

/**
 * Install Visual Studio Code on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or later, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 *
 * This function installs VS Code natively within WSL for users who have
 * WSLg (Windows 11) or an X server configured. For most users, Microsoft
 * recommends installing VS Code on Windows and using the Remote-WSL extension.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Check if VS Code is already available (either native or from Windows)
  const existingVersion = await getVSCodeVersion();
  if (existingVersion) {
    console.log(`Visual Studio Code ${existingVersion} is already installed, skipping...`);
    console.log('');
    console.log('Note: The "code" command may be using VS Code installed on Windows.');
    console.log('This is the recommended setup for WSL development.');
    return;
  }

  // Install VS Code natively in WSL using the same method as Ubuntu
  console.log('Installing Visual Studio Code natively in WSL...');
  console.log('');
  console.log('TIP: For best experience, consider installing VS Code on Windows');
  console.log('and using the Remote-WSL extension. Simply run "code ." from WSL');
  console.log('to connect VS Code on Windows to your WSL environment.');
  console.log('');

  // Set up Microsoft's APT repository
  await setupMicrosoftAptRepository();

  // Install VS Code from the Microsoft repository
  console.log('Installing Visual Studio Code via APT...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Visual Studio Code via APT.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify the installation succeeded
  const version = await getVSCodeVersion();
  if (!version) {
    console.log('Installation may have failed: code command not found after install.');
    return;
  }

  console.log('Visual Studio Code installed successfully in WSL.');
  console.log('');
  console.log(`VS Code version: ${version}`);
  console.log('');
  console.log('NOTE: To run VS Code GUI, you need WSLg (Windows 11) or an X server.');
  console.log('If VS Code does not launch, verify your display environment is configured.');
  console.log('');
  console.log('Verify installation with: code --version');
}

/**
 * Install Visual Studio Code on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
 * - Raspberry Pi 3B+ or later (64-bit capable hardware recommended)
 * - At least 1 GB RAM (2 GB or more recommended for comfortable usage)
 * - sudo privileges
 *
 * VS Code is available in the official Raspberry Pi OS repository, which
 * includes ARM-compatible builds. This eliminates the need to manually
 * add Microsoft's repository.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if Visual Studio Code is already installed...');

  // Check if VS Code is already installed
  const existingVersion = await getVSCodeVersion();
  if (existingVersion) {
    console.log(`Visual Studio Code ${existingVersion} is already installed, skipping...`);
    return;
  }

  // Check and report architecture for informational purposes
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  console.log(`Detected architecture: ${arch}`);
  console.log('');

  // Update package lists first
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install VS Code from Raspberry Pi OS repository
  // The official Raspberry Pi OS repository includes ARM-compatible builds
  console.log('Installing Visual Studio Code via APT...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Visual Studio Code via APT.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('The package may not be available in the default repository.');
    console.log('Attempting to install from Microsoft repository instead...');
    console.log('');

    // Fall back to Microsoft's repository
    try {
      await setupMicrosoftAptRepository();
      const retryResult = await shell.exec(
        `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
      );
      if (retryResult.code !== 0) {
        console.log('Failed to install Visual Studio Code from Microsoft repository.');
        console.log(retryResult.stderr || retryResult.stdout);
        return;
      }
    } catch (error) {
      console.log(`Failed to set up Microsoft repository: ${error.message}`);
      return;
    }
  }

  // Verify the installation succeeded
  const version = await getVSCodeVersion();
  if (!version) {
    console.log('Installation may have failed: code command not found after install.');
    return;
  }

  console.log('Visual Studio Code installed successfully.');
  console.log('');
  console.log(`VS Code version: ${version}`);
  console.log('');
  console.log('NOTE: If VS Code is slow, you can disable hardware acceleration:');
  console.log('  1. Open VS Code and press Ctrl+Shift+P');
  console.log('  2. Type "Preferences: Configure Runtime Arguments"');
  console.log('  3. Add: "disable-hardware-acceleration": true');
  console.log('');
  console.log('Verify installation with: code --version');
}

/**
 * Install Visual Studio Code on Amazon Linux/RHEL using DNF or YUM.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8+, or CentOS 8+
 * - sudo privileges
 * - 64-bit system
 *
 * This function automatically detects whether the system uses DNF (AL2023)
 * or YUM (AL2) and uses the appropriate package manager.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if Visual Studio Code is already installed...');

  // Check if VS Code is already installed
  const existingVersion = await getVSCodeVersion();
  if (existingVersion) {
    console.log(`Visual Studio Code ${existingVersion} is already installed, skipping...`);
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

  // Set up Microsoft's YUM repository
  await setupMicrosoftYumRepository();

  // Update package cache (check-update returns 100 if updates are available, which is not an error)
  console.log('Checking for updates...');
  await shell.exec(`sudo ${packageManager} check-update || true`);

  // Install VS Code
  console.log('Installing Visual Studio Code via ' + packageManager + '...');
  const installResult = await shell.exec(
    `sudo ${packageManager} install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    console.log(`Failed to install Visual Studio Code via ${packageManager}.`);
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Verify the repository was added correctly:');
    console.log('     cat /etc/yum.repos.d/vscode.repo');
    console.log(`  2. Try: sudo ${packageManager} install -y code`);
    return;
  }

  // Verify the installation succeeded
  const version = await getVSCodeVersion();
  if (!version) {
    console.log('Installation may have failed: code command not found after install.');
    return;
  }

  console.log('Visual Studio Code installed successfully.');
  console.log('');
  console.log(`VS Code version: ${version}`);
  console.log('');
  console.log('Verify installation with: code --version');
}

/**
 * Install Visual Studio Code on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 1709 or later (64-bit), or Windows 11
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * The Chocolatey package automatically:
 * - Adds VS Code to the system PATH
 * - Creates "Open with Code" context menu entries
 *
 * IMPORTANT: A new terminal window must be opened after installation
 * for PATH changes to take effect.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if Visual Studio Code is already installed...');

  // Check if VS Code is already installed via Chocolatey
  const isChocoInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (isChocoInstalled) {
    const version = await getVSCodeVersion();
    console.log(`Visual Studio Code ${version || 'unknown version'} is already installed via Chocolatey, skipping...`);
    return;
  }

  // Also check if the code command exists (might be installed by other means)
  const existingVersion = await getVSCodeVersion();
  if (existingVersion) {
    console.log(`Visual Studio Code ${existingVersion} is already installed, skipping...`);
    console.log('');
    console.log('Note: VS Code was not installed via Chocolatey.');
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

  // Install VS Code using Chocolatey
  console.log('Installing Visual Studio Code via Chocolatey...');
  console.log('This may take a few minutes...');
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install Visual Studio Code via Chocolatey.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you are running as Administrator');
    console.log('  2. Try: choco install vscode -y --force');
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!verified) {
    console.log('Installation may have failed: vscode package not found after install.');
    return;
  }

  console.log('Visual Studio Code installed successfully via Chocolatey.');
  console.log('');
  console.log('IMPORTANT: Close and reopen your terminal for PATH changes to take effect.');
  console.log('');
  console.log('After reopening the terminal, verify with:');
  console.log('  code --version');
}

/**
 * Install Visual Studio Code from Git Bash on Windows.
 *
 * Git Bash runs within Windows and inherits the Windows PATH, so once
 * VS Code is installed on Windows, the 'code' command is automatically
 * available in Git Bash.
 *
 * This function installs VS Code on the Windows host using Chocolatey
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

  // Check if VS Code is already available
  const existingVersion = await getVSCodeVersion();
  if (existingVersion) {
    console.log(`Visual Studio Code ${existingVersion} is already installed, skipping...`);
    return;
  }

  // Install via PowerShell using Chocolatey
  console.log('Installing Visual Studio Code on the Windows host via Chocolatey...');
  console.log('This may take a few minutes...');

  const installResult = await shell.exec(
    `powershell.exe -NoProfile -Command "choco install ${CHOCO_PACKAGE_NAME} -y"`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Visual Studio Code.');
    console.log(installResult.stdout || installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure Chocolatey is installed on Windows');
    console.log('  2. Run Git Bash as Administrator and retry');
    console.log('  3. Try installing directly from PowerShell:');
    console.log('     choco install vscode -y');
    return;
  }

  console.log('Visual Studio Code installed successfully.');
  console.log('');
  console.log('IMPORTANT: Close and reopen Git Bash for PATH changes to take effect.');
  console.log('');
  console.log('Git Bash tips:');
  console.log('  - For interactive features, use: winpty code --wait');
  console.log('  - File paths with spaces need quoting');
  console.log('');
  console.log('After reopening Git Bash, verify with:');
  console.log('  code --version');
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. VS Code is supported on
 * all major platforms:
 *
 * - macOS: Homebrew cask
 * - Ubuntu/Debian: APT with Microsoft repository
 * - Ubuntu on WSL: APT with Microsoft repository
 * - Raspberry Pi OS: APT (from Raspberry Pi OS or Microsoft repository)
 * - Amazon Linux/RHEL: DNF/YUM with Microsoft repository
 * - Windows: Chocolatey
 * - Git Bash: Chocolatey on Windows host
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
    console.log(`Visual Studio Code is not available for ${platform.type}.`);
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

// Allow direct execution: node vscode.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
