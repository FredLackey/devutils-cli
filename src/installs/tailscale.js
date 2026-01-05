#!/usr/bin/env node

/**
 * @fileoverview Install Tailscale VPN client across supported platforms.
 * @module installs/tailscale
 *
 * Tailscale is a zero-configuration VPN service built on WireGuard that creates
 * secure mesh networks (called tailnets) between devices. It handles authentication,
 * key exchange, and NAT traversal automatically.
 *
 * This installer provides:
 * - CLI-only Tailscale via Homebrew for macOS (recommended for servers/advanced users)
 * - Tailscale daemon via official install script for Linux (Ubuntu, Raspberry Pi OS)
 * - Tailscale via DNF/YUM for Amazon Linux/RHEL
 * - Tailscale GUI application via Chocolatey for Windows
 * - Windows Tailscale installation from Git Bash via PowerShell
 *
 * IMPORTANT NOTES:
 * - macOS: Installs CLI-only version. For GUI, download from https://tailscale.com/download
 * - After installation, run 'sudo tailscale up' to authenticate with your Tailscale account
 * - WSL: Recommended to install Tailscale on Windows host instead of within WSL
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew formula name for Tailscale CLI on macOS.
 * @constant {string}
 */
const HOMEBREW_FORMULA_NAME = 'tailscale';

/**
 * The Chocolatey package name for Tailscale on Windows.
 * @constant {string}
 */
const CHOCO_PACKAGE_NAME = 'tailscale';

/**
 * The command used to verify Tailscale installation.
 * @constant {string}
 */
const TAILSCALE_COMMAND = 'tailscale';

/**
 * Check if the Tailscale CLI command is available in the system PATH.
 * This performs a quick check that works across all platforms.
 *
 * Note: The presence of the tailscale command does not guarantee the
 * Tailscale daemon (tailscaled) is running.
 *
 * @returns {boolean} True if the tailscale command is available, false otherwise
 */
function isTailscaleCommandAvailable() {
  return shell.commandExists(TAILSCALE_COMMAND);
}

/**
 * Get the installed version of Tailscale.
 *
 * Executes 'tailscale --version' to verify Tailscale is properly installed
 * and retrieve the version number.
 *
 * @returns {Promise<string|null>} Tailscale version string (e.g., "1.92.3"), or null if not installed
 */
async function getTailscaleVersion() {
  if (!isTailscaleCommandAvailable()) {
    return null;
  }

  const result = await shell.exec('tailscale --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "1.92.3\n  tailscale commit: abcdef...\n  ..."
    // The version is on the first line
    const firstLine = result.stdout.split('\n')[0].trim();
    // Version should be a semver-like string
    const versionMatch = firstLine.match(/^(\d+\.\d+\.?\d*)/);
    return versionMatch ? versionMatch[1] : firstLine;
  }
  return null;
}

/**
 * Install Tailscale CLI on macOS using Homebrew.
 *
 * This installs the CLI-only version of Tailscale, which is recommended for
 * servers and advanced users who prefer command-line management.
 *
 * Prerequisites:
 * - macOS 12.0 (Monterey) or later
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * IMPORTANT: For desktop use with a GUI, download the Standalone variant
 * from https://tailscale.com/download instead. Do not install both the
 * Homebrew CLI and GUI versions as they conflict.
 *
 * After installation:
 * 1. Start the daemon: sudo brew services start tailscale
 * 2. Authenticate: sudo tailscale up
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if Tailscale is already installed...');

  // Check if Tailscale is already installed via command availability
  const existingVersion = await getTailscaleVersion();
  if (existingVersion) {
    console.log(`Tailscale ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Also check if the Homebrew formula is installed (daemon may not be running)
  const formulaInstalled = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (formulaInstalled) {
    console.log('Tailscale is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('To start Tailscale:');
    console.log('  sudo brew services start tailscale');
    console.log('  sudo tailscale up');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    return;
  }

  console.log('Installing Tailscale CLI via Homebrew...');

  // Install Tailscale formula
  const result = await brew.install(HOMEBREW_FORMULA_NAME);

  if (!result.success) {
    console.log('Failed to install Tailscale via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify installation succeeded
  const version = await getTailscaleVersion();
  if (version) {
    console.log(`Tailscale ${version} installed successfully.`);
  } else {
    console.log('Tailscale installed successfully.');
  }

  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Start the Tailscale daemon:');
  console.log('     sudo brew services start tailscale');
  console.log('');
  console.log('  2. Connect to your Tailscale network:');
  console.log('     sudo tailscale up');
  console.log('');
  console.log('  3. Open the authentication URL in your browser to sign in.');
  console.log('');
  console.log('NOTE: This is the CLI-only version. For a GUI, download from:');
  console.log('      https://tailscale.com/download');
}

/**
 * Install Tailscale on Ubuntu/Debian using the official installation script.
 *
 * The official installation script automatically:
 * - Detects your Ubuntu/Debian version
 * - Adds Tailscale's GPG signing key
 * - Configures the APT repository
 * - Installs the tailscale package
 * - Enables and starts the tailscaled service
 *
 * Prerequisites:
 * - Ubuntu 18.04 (Bionic) or later, or Debian 10 (Buster) or later
 * - sudo privileges
 * - curl installed (will be installed if missing)
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if Tailscale is already installed...');

  // Check if Tailscale is already installed
  const existingVersion = await getTailscaleVersion();
  if (existingVersion) {
    console.log(`Tailscale ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Ensure curl is installed (required by the installation script)
  if (!shell.commandExists('curl')) {
    console.log('Installing curl (required for Tailscale installation)...');
    const curlResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl');
    if (curlResult.code !== 0) {
      console.log('Failed to install curl. Please install curl manually and retry.');
      console.log(curlResult.stderr);
      return;
    }
  }

  console.log('Installing Tailscale using the official installation script...');
  console.log('This will add the Tailscale APT repository and install the package.');

  // Run the official Tailscale installation script
  // The script handles repository setup, package installation, and service configuration
  const installResult = await shell.exec('curl -fsSL https://tailscale.com/install.sh | sh');

  if (installResult.code !== 0) {
    console.log('Failed to install Tailscale.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have internet connectivity');
    console.log('  2. Verify curl is installed: which curl');
    console.log('  3. Try running the install script manually:');
    console.log('     curl -fsSL https://tailscale.com/install.sh | sh');
    return;
  }

  // Verify installation succeeded
  const version = await getTailscaleVersion();
  if (version) {
    console.log(`Tailscale ${version} installed successfully.`);
  } else {
    console.log('Tailscale installed successfully.');
  }

  console.log('');
  console.log('To connect to your Tailscale network:');
  console.log('  sudo tailscale up');
  console.log('');
  console.log('Open the authentication URL in your browser to sign in.');
}

/**
 * Install Tailscale on Raspberry Pi OS using the official installation script.
 *
 * The installation script automatically detects Raspberry Pi OS and configures
 * the appropriate repository for your architecture (64-bit or 32-bit).
 *
 * Prerequisites:
 * - Raspberry Pi OS (32-bit or 64-bit) - Bullseye, Bookworm, or newer
 * - Raspberry Pi 3, 4, or 5 (64-bit capable hardware recommended)
 * - sudo privileges
 * - curl installed
 *
 * NOTE: For always-on Raspberry Pi devices (servers, NAS, IoT), consider
 * disabling key expiry in the Tailscale admin console to prevent automatic
 * disconnection after 180 days.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if Tailscale is already installed...');

  // Check if Tailscale is already installed
  const existingVersion = await getTailscaleVersion();
  if (existingVersion) {
    console.log(`Tailscale ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Log architecture information for user awareness
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  console.log(`Detected architecture: ${arch}`);

  // Ensure curl is installed
  if (!shell.commandExists('curl')) {
    console.log('Installing curl (required for Tailscale installation)...');
    const curlResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl');
    if (curlResult.code !== 0) {
      console.log('Failed to install curl. Please install curl manually and retry.');
      console.log(curlResult.stderr);
      return;
    }
  }

  console.log('Installing Tailscale using the official installation script...');

  // Run the official Tailscale installation script
  const installResult = await shell.exec('curl -fsSL https://tailscale.com/install.sh | sh');

  if (installResult.code !== 0) {
    console.log('Failed to install Tailscale.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have internet connectivity');
    console.log('  2. If on 32-bit Raspberry Pi OS, ensure your SD card has sufficient space');
    console.log('  3. Try running the install script manually:');
    console.log('     curl -fsSL https://tailscale.com/install.sh | sh');
    return;
  }

  // Verify installation succeeded
  const version = await getTailscaleVersion();
  if (version) {
    console.log(`Tailscale ${version} installed successfully.`);
  } else {
    console.log('Tailscale installed successfully.');
  }

  console.log('');
  console.log('To connect to your Tailscale network:');
  console.log('  sudo tailscale up');
  console.log('');
  console.log('Open the authentication URL in your browser (on any device) to sign in.');
  console.log('');
  console.log('TIP: For always-on Raspberry Pi devices, disable key expiry in the');
  console.log('Tailscale admin console to prevent disconnection after 180 days:');
  console.log('  https://login.tailscale.com/admin/machines');
}

/**
 * Install Tailscale on Amazon Linux/RHEL using DNF or YUM.
 *
 * This function detects whether the system uses DNF (Amazon Linux 2023, RHEL 8/9)
 * or YUM (Amazon Linux 2, RHEL 7) and uses the appropriate package manager.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, RHEL 7/8/9, or CentOS 7/8/9
 * - sudo privileges
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if Tailscale is already installed...');

  // Check if Tailscale is already installed
  const existingVersion = await getTailscaleVersion();
  if (existingVersion) {
    console.log(`Tailscale ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Detect package manager (dnf for AL2023/RHEL8+, yum for AL2/RHEL7)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    console.log('Neither dnf nor yum package manager found.');
    console.log('This installer supports Amazon Linux 2023 (dnf) and Amazon Linux 2 (yum),');
    console.log('as well as RHEL/CentOS 7, 8, and 9.');
    return;
  }

  console.log(`Detected package manager: ${packageManager}`);
  console.log('Installing Tailscale using the official installation script...');

  // Use the official installation script which handles repository setup
  const installResult = await shell.exec('curl -fsSL https://tailscale.com/install.sh | sh');

  if (installResult.code !== 0) {
    console.log('Failed to install Tailscale using the installation script.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Attempting manual repository setup...');

    // Fall back to manual installation
    let repoResult;
    if (hasDnf) {
      // Try Amazon Linux 2023 repository first
      repoResult = await shell.exec('sudo dnf config-manager --add-repo https://pkgs.tailscale.com/stable/amazon-linux/2023/tailscale.repo');
      if (repoResult.code !== 0) {
        // Try RHEL repository
        const osVersionResult = await shell.exec('cat /etc/os-release | grep VERSION_ID');
        const versionMatch = osVersionResult.stdout.match(/VERSION_ID="?(\d+)/);
        const version = versionMatch ? versionMatch[1] : '9';
        repoResult = await shell.exec(`sudo dnf config-manager --add-repo https://pkgs.tailscale.com/stable/rhel/${version}/tailscale.repo`);
      }
    } else {
      // YUM-based system (AL2 or RHEL 7)
      await shell.exec('sudo yum install -y yum-utils');
      repoResult = await shell.exec('sudo yum-config-manager --add-repo https://pkgs.tailscale.com/stable/amazon-linux/2/tailscale.repo');
      if (repoResult.code !== 0) {
        repoResult = await shell.exec('sudo yum-config-manager --add-repo https://pkgs.tailscale.com/stable/rhel/7/tailscale.repo');
      }
    }

    if (repoResult.code !== 0) {
      console.log('Failed to add Tailscale repository.');
      console.log(repoResult.stderr);
      return;
    }

    // Install Tailscale package
    console.log('Installing Tailscale package...');
    const pkgResult = await shell.exec(`sudo ${packageManager} install -y tailscale`);
    if (pkgResult.code !== 0) {
      console.log('Failed to install Tailscale package.');
      console.log(pkgResult.stderr);
      return;
    }

    // Enable and start the service
    console.log('Enabling and starting tailscaled service...');
    await shell.exec('sudo systemctl enable --now tailscaled');
  }

  // Verify installation succeeded
  const version = await getTailscaleVersion();
  if (version) {
    console.log(`Tailscale ${version} installed successfully.`);
  } else {
    console.log('Tailscale installed successfully.');
  }

  console.log('');
  console.log('To connect to your Tailscale network:');
  console.log('  sudo tailscale up');
  console.log('');
  console.log('Open the authentication URL in your browser to sign in.');
}

/**
 * Install Tailscale on Windows using Chocolatey.
 *
 * This installs the Tailscale GUI application, which includes both the
 * graphical interface and command-line tools.
 *
 * Prerequisites:
 * - Windows 10 or later, or Windows Server 2016 or later (64-bit)
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * After installation, Tailscale will be available in the Start Menu
 * and system tray. The `tailscale` command will also be available
 * in Command Prompt and PowerShell.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if Tailscale is already installed...');

  // Check if Tailscale is already installed
  const existingVersion = await getTailscaleVersion();
  if (existingVersion) {
    console.log(`Tailscale ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if package is installed via Chocolatey
  const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (packageInstalled) {
    console.log('Tailscale is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('If the tailscale command is not working, ensure Tailscale is running.');
    console.log('Launch Tailscale from the Start Menu or check the system tray.');
    return;
  }

  // Verify Chocolatey is available
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('');
    console.log('Run the following in an Administrator PowerShell:');
    console.log("  Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))");
    return;
  }

  console.log('Installing Tailscale via Chocolatey...');

  // Install Tailscale
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install Tailscale via Chocolatey.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you are running as Administrator');
    console.log('  2. Try manual installation: choco install tailscale -y');
    console.log('  3. Or download from: https://tailscale.com/download');
    return;
  }

  console.log('Tailscale installed successfully.');
  console.log('');
  console.log('To complete setup:');
  console.log('  1. Launch Tailscale from the Start Menu');
  console.log('  2. Click "Log in" to authenticate with your Tailscale account');
  console.log('');
  console.log('Alternatively, from the command line:');
  console.log('  tailscale up');
  console.log('');
  console.log('NOTE: You may need to open a new terminal for the tailscale command to be available.');
}

/**
 * Install Tailscale on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * IMPORTANT: If you need Tailscale on both Windows and WSL, it is recommended
 * to install Tailscale on the Windows host only. The Windows Tailscale client
 * provides network access that is visible to WSL 2 automatically. Running
 * Tailscale in both Windows and WSL simultaneously can cause conflicts.
 *
 * This function installs Tailscale directly within WSL for users who specifically
 * need it running inside the WSL environment.
 *
 * Prerequisites:
 * - Windows 10 version 2004 or later, or Windows 11
 * - WSL 2 installed and configured (WSL 1 is not supported)
 * - Ubuntu distribution installed in WSL
 *
 * NOTE: WSL does not use systemd by default, so the tailscaled daemon must be
 * started manually with 'sudo tailscaled &' before running 'tailscale up'.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('RECOMMENDATION: For most users, install Tailscale on the Windows host');
  console.log('instead of within WSL. The Windows Tailscale client provides network');
  console.log('access that is visible to WSL 2 automatically.');
  console.log('');

  // Check if Tailscale is already installed
  const existingVersion = await getTailscaleVersion();
  if (existingVersion) {
    console.log(`Tailscale ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Ensure curl is installed
  if (!shell.commandExists('curl')) {
    console.log('Installing curl (required for Tailscale installation)...');
    const curlResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl');
    if (curlResult.code !== 0) {
      console.log('Failed to install curl. Please install curl manually and retry.');
      console.log(curlResult.stderr);
      return;
    }
  }

  console.log('Installing Tailscale in WSL using the official installation script...');

  // Run the official Tailscale installation script
  const installResult = await shell.exec('curl -fsSL https://tailscale.com/install.sh | sh');

  if (installResult.code !== 0) {
    console.log('Failed to install Tailscale.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify installation succeeded
  const version = await getTailscaleVersion();
  if (version) {
    console.log(`Tailscale ${version} installed successfully.`);
  } else {
    console.log('Tailscale installed successfully.');
  }

  console.log('');
  console.log('IMPORTANT for WSL users:');
  console.log('');
  console.log('1. WSL does not use systemd by default. Start the daemon manually:');
  console.log('   sudo tailscaled &');
  console.log('');
  console.log('2. Wait a few seconds, then connect:');
  console.log('   sudo tailscale up');
  console.log('');
  console.log('3. To auto-start Tailscale when WSL launches, add to ~/.bashrc:');
  console.log('   if ! pgrep -x tailscaled > /dev/null; then');
  console.log('       sudo tailscaled > /dev/null 2>&1 &');
  console.log('       sleep 2');
  console.log('   fi');
  console.log('');
  console.log('4. For passwordless sudo (optional):');
  const currentUser = process.env.USER || process.env.USERNAME || 'youruser';
  console.log(`   echo "${currentUser} ALL=(ALL) NOPASSWD: /usr/sbin/tailscaled" | sudo tee /etc/sudoers.d/tailscaled`);
  console.log('   sudo chmod 0440 /etc/sudoers.d/tailscaled');
}

/**
 * Install Tailscale from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Tailscale
 * on the Windows host using Chocolatey via PowerShell interop.
 * Once installed, the `tailscale` command is automatically available
 * in Git Bash because Git Bash inherits the Windows PATH.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey package manager installed on Windows
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Tailscale on the Windows host...');
  console.log('');

  // Check if Tailscale is already available (inherited from Windows PATH)
  const existingVersion = await getTailscaleVersion();
  if (existingVersion) {
    console.log(`Tailscale ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if Chocolatey is available via Windows path
  const chocoPath = '/c/ProgramData/chocolatey/bin/choco.exe';
  const chocoResult = await shell.exec(`"${chocoPath}" --version 2>/dev/null`);

  if (chocoResult.code !== 0) {
    console.log('Chocolatey is not installed on Windows.');
    console.log('Please install Chocolatey first, then run this installer again.');
    console.log('');
    console.log('Or install Tailscale manually from:');
    console.log('  https://tailscale.com/download');
    return;
  }

  console.log('Installing Tailscale via Windows Chocolatey...');

  const installResult = await shell.exec(`"${chocoPath}" install tailscale -y`);

  if (installResult.code !== 0) {
    console.log('Failed to install Tailscale.');
    console.log(installResult.stdout || installResult.stderr);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run Git Bash as Administrator and retry');
    console.log('  2. Try installing directly from PowerShell:');
    console.log('     choco install tailscale -y');
    console.log('  3. Or download from: https://tailscale.com/download');
    return;
  }

  console.log('Tailscale installed successfully.');
  console.log('');
  console.log('To complete setup:');
  console.log('  1. Launch Tailscale from the Windows Start Menu');
  console.log('  2. Click "Log in" to authenticate with your Tailscale account');
  console.log('');
  console.log('Git Bash notes:');
  console.log('  - Close and reopen Git Bash for the tailscale command to be available');
  console.log('  - If tailscale is still not found, add to ~/.bashrc:');
  console.log('    export PATH="$PATH:/c/Program Files/Tailscale"');
}

/**
 * Check if this installer is supported on the current platform.
 * Tailscale is available on all major platforms.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * Detects the current platform and executes the corresponding installer function.
 * Handles platform-specific mappings to ensure all supported platforms have
 * appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Tailscale CLI via Homebrew
 * - Ubuntu/Debian: Tailscale via official install script
 * - Raspberry Pi OS: Tailscale via official install script
 * - Amazon Linux/RHEL: Tailscale via DNF/YUM
 * - Windows: Tailscale GUI via Chocolatey
 * - WSL (Ubuntu): Tailscale within WSL
 * - Git Bash: Tailscale on Windows host via PowerShell
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases (e.g., debian maps to ubuntu)
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
    // Gracefully handle unsupported platforms without throwing an error
    console.log(`Tailscale is not available for ${platform.type}.`);
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
  install_gitbash,
  // Export helper functions for potential reuse or testing
  isTailscaleCommandAvailable,
  getTailscaleVersion
};

// Allow direct execution: node tailscale.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
