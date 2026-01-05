#!/usr/bin/env node

/**
 * @fileoverview Install Gemini CLI - Google's AI coding assistant CLI tool.
 *
 * Gemini CLI is an open-source AI agent developed by Google that brings the
 * power of Gemini directly into your terminal. It provides interactive
 * conversations, code assistance, file operations, shell command execution,
 * and web search directly from the command line.
 *
 * Gemini CLI is distinct from Google's web-based Gemini interface. It runs
 * a ReAct (reason and act) agent loop that can decide when to use built-in
 * tools versus when to respond directly.
 *
 * Prerequisites:
 * - Google Account (required for authentication, personal accounts provide free tier)
 * - Node.js 20 or higher (for npm-based installation on Linux platforms)
 * - Internet connection (required for authentication and all AI processing)
 *
 * Free tier benefits:
 * - 60 requests per minute
 * - 1,000 requests per day
 * - Access to Gemini 2.5 Pro with 1 million token context window
 *
 * @module installs/gemini-cli
 * @see https://github.com/google-gemini/gemini-cli
 * @see https://geminicli.com/docs/get-started/installation/
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const winget = require('../utils/windows/winget');
const choco = require('../utils/windows/choco');

/**
 * The command name used to verify Gemini CLI installation.
 * @constant {string}
 */
const GEMINI_COMMAND = 'gemini';

/**
 * The Homebrew formula name for Gemini CLI on macOS.
 * Note: Gemini CLI is installed as a formula (CLI tool), not a cask (GUI app).
 * @constant {string}
 */
const HOMEBREW_FORMULA_NAME = 'gemini-cli';

/**
 * The npm package name for Gemini CLI.
 * This is the primary installation method for Linux platforms.
 * @constant {string}
 */
const NPM_PACKAGE_NAME = '@google/gemini-cli';

/**
 * The winget package ID for Node.js LTS on Windows.
 * Used to ensure Node.js is installed before npm-based installation.
 * @constant {string}
 */
const WINGET_NODEJS_ID = 'OpenJS.NodeJS.LTS';

/**
 * The Chocolatey package name for Node.js LTS on Windows.
 * Used as fallback when winget is not available.
 * @constant {string}
 */
const CHOCO_NODEJS_PACKAGE = 'nodejs-lts';

/**
 * The minimum required Node.js major version for Gemini CLI.
 * Gemini CLI requires Node.js 20 or higher.
 * @constant {number}
 */
const MIN_NODE_VERSION = 20;

/**
 * Checks if Gemini CLI is already installed on the system.
 * Uses the shell utility to search for the 'gemini' command in PATH.
 *
 * @returns {boolean} True if Gemini CLI is installed and accessible via PATH
 */
function isGeminiCliInstalled() {
  return shell.commandExists(GEMINI_COMMAND);
}

/**
 * Gets the installed version of Gemini CLI.
 * Runs 'gemini --version' and parses the output.
 *
 * @returns {Promise<string|null>} The version string (e.g., "0.22.5") or null if not installed
 */
async function getInstalledVersion() {
  if (!isGeminiCliInstalled()) {
    return null;
  }

  const result = await shell.exec('gemini --version');
  if (result.code === 0 && result.stdout) {
    // Output format is typically just the version number: "0.22.5"
    const version = result.stdout.trim();
    // Handle various output formats, extract first numeric version pattern
    const match = version.match(/(\d+\.\d+\.?\d*)/);
    return match ? match[1] : version;
  }
  return null;
}

/**
 * Checks if Node.js is installed and meets the minimum version requirement.
 * Gemini CLI requires Node.js 20 or later.
 *
 * @returns {Promise<{ installed: boolean, version: string|null, meetsMinimum: boolean }>}
 *   Object containing Node.js installation status, version, and whether it meets minimum requirements
 */
async function checkNodeVersion() {
  const isNodeInstalled = shell.commandExists('node');
  if (!isNodeInstalled) {
    return { installed: false, version: null, meetsMinimum: false };
  }

  const result = await shell.exec('node --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "v22.0.0"
    const version = result.stdout.trim().replace(/^v/, '');
    const majorVersion = parseInt(version.split('.')[0], 10);
    return {
      installed: true,
      version: version,
      meetsMinimum: majorVersion >= MIN_NODE_VERSION
    };
  }

  return { installed: true, version: null, meetsMinimum: false };
}

/**
 * Checks if npm is installed and available.
 *
 * @returns {boolean} True if npm command is available in PATH
 */
function isNpmInstalled() {
  return shell.commandExists('npm');
}

/**
 * Configures npm to use a user-level global directory.
 * This prevents permission issues when installing global packages without sudo.
 *
 * Creates ~/.npm-global directory and sets npm prefix to use it.
 * This follows npm's recommended best practice for global installations.
 *
 * @returns {Promise<{ success: boolean, binPath: string }>}
 *   Object containing success status and the path to the npm global bin directory
 */
async function configureNpmGlobalDirectory() {
  const homeDir = os.getHomeDir();
  const npmGlobalDir = `${homeDir}/.npm-global`;
  const npmGlobalBin = `${npmGlobalDir}/bin`;

  // Create the npm global directory if it doesn't exist
  await shell.exec(`mkdir -p ${npmGlobalDir}`);

  // Set npm prefix to use the user directory
  const configResult = await shell.exec(`npm config set prefix ${npmGlobalDir}`);

  return {
    success: configResult.code === 0,
    binPath: npmGlobalBin
  };
}

/**
 * Installs Gemini CLI via npm.
 * This is a helper function used by multiple platform installers.
 *
 * @param {Object} [options] - Installation options
 * @param {boolean} [options.showPathInstructions=true] - Whether to show PATH update instructions
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installViaNpm(options = {}) {
  const showPathInstructions = options.showPathInstructions !== false;

  // Step 1: Check Node.js version
  const nodeInfo = await checkNodeVersion();

  if (!nodeInfo.installed) {
    console.log('Node.js is required for Gemini CLI but is not installed.');
    console.log('Please install Node.js 20 or later first.');
    console.log('Run: dev install node');
    return false;
  }

  if (!nodeInfo.meetsMinimum) {
    console.log(`Node.js ${nodeInfo.version} is installed but Gemini CLI requires Node.js ${MIN_NODE_VERSION}+.`);
    console.log('Please upgrade Node.js to version 20 or later.');
    return false;
  }

  // Step 2: Check npm is available
  if (!isNpmInstalled()) {
    console.log('npm is not available. Please ensure Node.js is installed correctly.');
    return false;
  }

  // Step 3: Configure npm to use user directory (avoids sudo requirement)
  console.log('Configuring npm for user-level global installs...');
  const npmConfig = await configureNpmGlobalDirectory();

  if (!npmConfig.success) {
    console.log('Failed to configure npm global directory.');
    return false;
  }

  // Step 4: Install Gemini CLI via npm
  console.log('Installing Gemini CLI via npm...');
  const installResult = await shell.exec(`npm install -g ${NPM_PACKAGE_NAME}`, {
    timeout: 300000, // 5 minute timeout for download and installation
    env: {
      ...process.env,
      PATH: `${npmConfig.binPath}:${process.env.PATH}`
    }
  });

  if (installResult.code !== 0) {
    console.log('Failed to install Gemini CLI via npm.');
    console.log(installResult.stderr || installResult.stdout);
    return false;
  }

  // Step 5: Provide PATH instructions if requested
  if (showPathInstructions) {
    console.log('Gemini CLI installed successfully via npm.');
    console.log(`Ensure ${npmConfig.binPath} is in your PATH.`);
    console.log('Add this to your shell profile if not already present:');
    console.log(`  export PATH="${npmConfig.binPath}:$PATH"`);
    console.log('');
    console.log('Then run "gemini" to start and authenticate with your Google account.');
  }

  return true;
}

/**
 * Install Gemini CLI on macOS using Homebrew.
 *
 * This function installs Gemini CLI via the Homebrew formula. Homebrew must be
 * installed first. The installation is idempotent - if Gemini CLI is already
 * installed, the function will skip installation and return early.
 *
 * Homebrew handles Node.js as a dependency automatically.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Step 1: Check if Gemini CLI is already installed
  if (isGeminiCliInstalled()) {
    const version = await getInstalledVersion();
    console.log(`Gemini CLI is already installed${version ? ` (version ${version})` : ''}, skipping installation.`);
    return;
  }

  // Step 2: Verify Homebrew is available
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Step 3: Install Gemini CLI via Homebrew formula
  // Note: Using install() not installCask() because gemini-cli is a CLI tool formula
  console.log('Installing Gemini CLI via Homebrew...');
  const installResult = await brew.install(HOMEBREW_FORMULA_NAME);

  if (!installResult.success) {
    console.log('Failed to install Gemini CLI via Homebrew.');
    console.log(installResult.output);
    return;
  }

  // Step 4: Verify the installation succeeded
  // Note: We need to re-check since brew may have added new entries to PATH
  const verifyResult = await shell.exec('gemini --version');
  if (verifyResult.code !== 0) {
    console.log('Installation completed but Gemini CLI command is not in PATH.');
    console.log('Try opening a new terminal window or run: source ~/.zshrc');
    return;
  }

  console.log('Gemini CLI installed successfully.');
  console.log('Run "gemini" to start, then authenticate with your Google account.');
}

/**
 * Install Gemini CLI on Ubuntu/Debian using npm.
 *
 * This function installs Node.js from the NodeSource repository if needed,
 * then installs Gemini CLI via npm. The installation is idempotent - if
 * Gemini CLI is already installed, it will skip installation.
 *
 * Important: Do NOT use sudo with npm install -g. Instead, configure npm
 * to use a user-level global directory to avoid permission issues.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Step 1: Check if Gemini CLI is already installed
  if (isGeminiCliInstalled()) {
    const version = await getInstalledVersion();
    console.log(`Gemini CLI is already installed${version ? ` (version ${version})` : ''}, skipping installation.`);
    return;
  }

  // Step 2: Verify curl is available for potential NodeSource installation
  if (!shell.commandExists('curl')) {
    console.log('curl is required but not installed. Installing curl...');
    const curlResult = await apt.install('curl');
    if (!curlResult.success) {
      console.log('Failed to install curl. Please install it manually.');
      return;
    }
  }

  // Step 3: Check Node.js version and install/upgrade if needed
  const nodeInfo = await checkNodeVersion();

  if (!nodeInfo.installed || !nodeInfo.meetsMinimum) {
    console.log('Installing Node.js 22 (LTS) from NodeSource...');

    // Install Node.js from NodeSource repository
    const nodeSourceResult = await shell.exec(
      'curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -',
      { timeout: 120000 } // 2 minute timeout
    );

    if (nodeSourceResult.code !== 0) {
      console.log('Failed to add NodeSource repository.');
      console.log(nodeSourceResult.stderr || nodeSourceResult.stdout);
      return;
    }

    const nodeInstallResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs',
      { timeout: 180000 } // 3 minute timeout
    );

    if (nodeInstallResult.code !== 0) {
      console.log('Failed to install Node.js.');
      console.log(nodeInstallResult.stderr || nodeInstallResult.stdout);
      return;
    }

    // Verify Node.js was installed correctly
    const newNodeInfo = await checkNodeVersion();
    if (!newNodeInfo.meetsMinimum) {
      console.log('Node.js installation completed but version is still below required minimum.');
      console.log(`Installed: ${newNodeInfo.version}, Required: ${MIN_NODE_VERSION}+`);
      return;
    }
  }

  // Step 4: Install Gemini CLI via npm
  console.log('Installing Gemini CLI via npm...');
  const success = await installViaNpm({ showPathInstructions: true });

  if (success) {
    console.log('');
    console.log('Run "source ~/.bashrc" or open a new terminal to update your PATH.');
  }
}

/**
 * Install Gemini CLI on Raspberry Pi OS using npm.
 *
 * Gemini CLI works on Raspberry Pi with 64-bit Raspberry Pi OS (aarch64).
 * The 32-bit version (armv7l) is NOT supported.
 *
 * Requirements:
 * - 64-bit Raspberry Pi OS (aarch64 architecture required)
 * - Raspberry Pi 4 or later with 4GB+ RAM recommended
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Step 1: Check if Gemini CLI is already installed
  if (isGeminiCliInstalled()) {
    const version = await getInstalledVersion();
    console.log(`Gemini CLI is already installed${version ? ` (version ${version})` : ''}, skipping installation.`);
    return;
  }

  // Step 2: Verify architecture is 64-bit (Gemini CLI requires aarch64)
  const archResult = await shell.exec('uname -m');
  const architecture = archResult.stdout.trim();
  if (architecture !== 'aarch64') {
    console.log('Gemini CLI requires 64-bit Raspberry Pi OS (aarch64).');
    console.log(`Current architecture: ${architecture}`);
    console.log('Please install 64-bit Raspberry Pi OS from https://www.raspberrypi.com/software/');
    return;
  }

  // Step 3: Verify curl is available
  if (!shell.commandExists('curl')) {
    console.log('curl is required but not installed. Installing curl...');
    const curlResult = await apt.install('curl');
    if (!curlResult.success) {
      console.log('Failed to install curl. Please install it manually.');
      return;
    }
  }

  // Step 4: Check Node.js version and install/upgrade if needed
  const nodeInfo = await checkNodeVersion();

  if (!nodeInfo.installed || !nodeInfo.meetsMinimum) {
    console.log('Installing Node.js 22 (LTS) from NodeSource...');

    // Install Node.js from NodeSource repository
    const nodeSourceResult = await shell.exec(
      'curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -',
      { timeout: 120000 } // 2 minute timeout
    );

    if (nodeSourceResult.code !== 0) {
      console.log('Failed to add NodeSource repository.');
      console.log(nodeSourceResult.stderr || nodeSourceResult.stdout);
      return;
    }

    const nodeInstallResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs',
      { timeout: 180000 } // 3 minute timeout
    );

    if (nodeInstallResult.code !== 0) {
      console.log('Failed to install Node.js.');
      console.log(nodeInstallResult.stderr || nodeInstallResult.stdout);
      return;
    }
  }

  // Step 5: Install Gemini CLI via npm (recommended for Raspberry Pi)
  console.log('Installing Gemini CLI via npm (recommended for Raspberry Pi)...');
  const success = await installViaNpm({ showPathInstructions: true });

  if (success) {
    console.log('');
    console.log('Run "source ~/.bashrc" or open a new terminal to update your PATH.');
    console.log('');
    console.log('Note: Raspberry Pi has limited resources. For best performance:');
    console.log('  - Close other applications when using Gemini CLI');
    console.log('  - Use a Raspberry Pi 4 or later with 4GB+ RAM');
  }
}

/**
 * Install Gemini CLI on Amazon Linux/RHEL using npm.
 *
 * This function installs Node.js from the NodeSource repository if needed,
 * then installs Gemini CLI via npm. Works on Amazon Linux 2023, Amazon Linux 2,
 * RHEL 8+, CentOS Stream 8+, and Fedora.
 *
 * Amazon Linux is typically used as a server OS. Gemini CLI works well in
 * headless environments - use API key authentication for non-interactive use.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Step 1: Check if Gemini CLI is already installed
  if (isGeminiCliInstalled()) {
    const version = await getInstalledVersion();
    console.log(`Gemini CLI is already installed${version ? ` (version ${version})` : ''}, skipping installation.`);
    return;
  }

  // Step 2: Determine package manager (dnf for AL2023/RHEL8+, yum for AL2)
  const platform = os.detect();
  const packageManager = platform.packageManager || 'yum';

  // Step 3: Verify curl is available
  if (!shell.commandExists('curl')) {
    console.log('curl is required but not installed. Installing curl...');
    const curlCommand = packageManager === 'dnf'
      ? 'sudo dnf install -y curl'
      : 'sudo yum install -y curl';

    const curlResult = await shell.exec(curlCommand);
    if (curlResult.code !== 0) {
      console.log('Failed to install curl. Please install it manually.');
      return;
    }
  }

  // Step 4: Check Node.js version and install/upgrade if needed
  const nodeInfo = await checkNodeVersion();

  if (!nodeInfo.installed || !nodeInfo.meetsMinimum) {
    console.log('Installing Node.js 22 (LTS) from NodeSource...');

    // Install Node.js from NodeSource repository (works for both dnf and yum)
    const nodeSourceResult = await shell.exec(
      'curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -',
      { timeout: 120000 } // 2 minute timeout
    );

    if (nodeSourceResult.code !== 0) {
      console.log('Failed to add NodeSource repository.');
      console.log(nodeSourceResult.stderr || nodeSourceResult.stdout);
      return;
    }

    // Install Node.js using the appropriate package manager
    const nodeInstallCommand = packageManager === 'dnf'
      ? 'sudo dnf install -y nodejs'
      : 'sudo yum install -y nodejs';

    const nodeInstallResult = await shell.exec(nodeInstallCommand, {
      timeout: 180000 // 3 minute timeout
    });

    if (nodeInstallResult.code !== 0) {
      console.log('Failed to install Node.js.');
      console.log(nodeInstallResult.stderr || nodeInstallResult.stdout);
      return;
    }
  }

  // Step 5: Install Gemini CLI via npm
  console.log('Installing Gemini CLI via npm...');
  const success = await installViaNpm({ showPathInstructions: true });

  if (success) {
    console.log('');
    console.log('Run "source ~/.bashrc" or open a new terminal to update your PATH.');
    console.log('');
    console.log('Note: For headless/SSH environments, use API key authentication:');
    console.log('  export GEMINI_API_KEY="YOUR_API_KEY_HERE"');
    console.log('  Get your API key from: https://aistudio.google.com/');
  }
}

/**
 * Install Gemini CLI on Windows using winget (preferred) or Chocolatey.
 *
 * This function first ensures Node.js is installed via winget or Chocolatey,
 * then installs Gemini CLI via npm. The installation is idempotent - if
 * Gemini CLI is already installed, it will skip installation.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Step 1: Check if Gemini CLI is already installed
  if (isGeminiCliInstalled()) {
    const version = await getInstalledVersion();
    console.log(`Gemini CLI is already installed${version ? ` (version ${version})` : ''}, skipping installation.`);
    return;
  }

  // Step 2: Check Node.js version
  const nodeInfo = await checkNodeVersion();

  // Step 3: Install Node.js if needed
  if (!nodeInfo.installed || !nodeInfo.meetsMinimum) {
    console.log('Installing Node.js LTS...');

    let nodeInstalled = false;

    // Try winget first (preferred, pre-installed on Windows 10/11)
    if (winget.isInstalled()) {
      console.log('Installing Node.js via winget...');
      const wingetResult = await winget.install(WINGET_NODEJS_ID);
      nodeInstalled = wingetResult.success;

      if (!nodeInstalled) {
        console.log('winget installation failed, trying Chocolatey...');
      }
    }

    // Try Chocolatey as fallback
    if (!nodeInstalled && choco.isInstalled()) {
      console.log('Installing Node.js via Chocolatey...');
      const chocoResult = await choco.install(CHOCO_NODEJS_PACKAGE);
      nodeInstalled = chocoResult.success;
    }

    if (!nodeInstalled) {
      console.log('Failed to install Node.js.');
      console.log('Please install Node.js 20+ manually from https://nodejs.org/');
      return;
    }

    console.log('Node.js installed. Please close and reopen your terminal,');
    console.log('then run this installer again to complete Gemini CLI installation.');
    return;
  }

  // Step 4: Check npm is available
  if (!isNpmInstalled()) {
    console.log('npm is not available. Please ensure Node.js is installed correctly.');
    console.log('Try closing and reopening your terminal.');
    return;
  }

  // Step 5: Install Gemini CLI via npm
  console.log('Installing Gemini CLI via npm...');
  const installResult = await shell.exec(`npm install -g ${NPM_PACKAGE_NAME}`, {
    timeout: 300000 // 5 minute timeout
  });

  if (installResult.code !== 0) {
    console.log('Failed to install Gemini CLI via npm.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Step 6: Verify installation
  console.log('Gemini CLI installed successfully.');
  console.log('Open a new terminal window, then run "gemini" to start.');
  console.log('You will be prompted to authenticate with your Google account.');
}

/**
 * Install Gemini CLI on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Gemini CLI runs natively within WSL. This function uses the same process
 * as Ubuntu - installing Node.js from NodeSource and Gemini CLI via npm.
 *
 * Important: Install only within WSL for the best experience. Authentication
 * will open a browser in Windows.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // Step 1: Check if Gemini CLI is already installed
  if (isGeminiCliInstalled()) {
    const version = await getInstalledVersion();
    console.log(`Gemini CLI is already installed${version ? ` (version ${version})` : ''}, skipping installation.`);
    return;
  }

  // Step 2: Verify curl is available
  if (!shell.commandExists('curl')) {
    console.log('curl is required but not installed. Installing curl...');
    const curlResult = await apt.install('curl');
    if (!curlResult.success) {
      console.log('Failed to install curl. Please install it manually.');
      return;
    }
  }

  // Step 3: Update package lists
  console.log('Updating package lists...');
  await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');

  // Step 4: Check Node.js version and install/upgrade if needed
  const nodeInfo = await checkNodeVersion();

  if (!nodeInfo.installed || !nodeInfo.meetsMinimum) {
    console.log('Installing Node.js 22 (LTS) from NodeSource...');

    const nodeSourceResult = await shell.exec(
      'curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -',
      { timeout: 120000 }
    );

    if (nodeSourceResult.code !== 0) {
      console.log('Failed to add NodeSource repository.');
      console.log(nodeSourceResult.stderr || nodeSourceResult.stdout);
      return;
    }

    const nodeInstallResult = await shell.exec(
      'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs',
      { timeout: 180000 }
    );

    if (nodeInstallResult.code !== 0) {
      console.log('Failed to install Node.js.');
      console.log(nodeInstallResult.stderr || nodeInstallResult.stdout);
      return;
    }
  }

  // Step 5: Install Gemini CLI via npm
  console.log('Installing Gemini CLI in WSL via npm...');
  const success = await installViaNpm({ showPathInstructions: false });

  if (success) {
    const homeDir = os.getHomeDir();
    console.log('Gemini CLI installed successfully in WSL.');
    console.log('Run "source ~/.bashrc" or open a new terminal to update your PATH.');
    console.log('Then run "gemini" to start and authenticate with your Google account.');
    console.log('');
    console.log('Notes for WSL:');
    console.log('  - Authentication will open a browser window in Windows');
    console.log('  - For best performance, keep projects in the WSL filesystem');
    console.log('    (e.g., ~/projects/) rather than /mnt/c/ paths');
  }
}

/**
 * Install Gemini CLI on Git Bash (Windows).
 *
 * Git Bash can execute Windows commands, so this function delegates to the
 * Windows installer. The same Windows npm installation works for both
 * PowerShell and Git Bash.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Git Bash uses the same Windows binaries, so delegate to Windows installer
  console.log('Installing Gemini CLI for Git Bash (using Windows installation)...');
  await install_windows();
}

/**
 * Check if this installer is supported on the current platform.
 * Gemini CLI is supported on all major platforms via npm.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function uses the OS detection utility to determine the current platform
 * and dispatches to the appropriate platform-specific installer. If the platform
 * is not supported, it displays a friendly message and returns without error.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  /**
   * Map of platform types to their installer functions.
   * Each key corresponds to a platform.type value from os.detect().
   */
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,           // Debian uses same process as Ubuntu
    'wsl': install_ubuntu_wsl,          // WSL detection from os.detect()
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'rhel': install_amazon_linux,       // RHEL uses same process as Amazon Linux
    'fedora': install_amazon_linux,     // Fedora also uses npm installation
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  const installer = installers[platform.type];

  if (!installer) {
    // Platform not supported - return gracefully without error
    console.log(`Gemini CLI is not available for ${platform.type}.`);
    return;
  }

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
