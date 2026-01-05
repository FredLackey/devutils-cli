#!/usr/bin/env node

/**
 * @fileoverview Install Claude Code - Anthropic's AI coding assistant CLI tool.
 *
 * Claude Code is an agentic coding tool that runs in your terminal, understands
 * your codebase, and helps you code faster through natural language commands.
 * It supports macOS, Linux (Ubuntu, Debian, Raspberry Pi OS, Amazon Linux, RHEL),
 * and Windows (native and WSL).
 *
 * @module installs/claude-code
 * @see https://code.claude.com/docs/en/overview
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const winget = require('../utils/windows/winget');
const choco = require('../utils/windows/choco');

/**
 * The command name used to verify Claude Code installation.
 * @constant {string}
 */
const CLAUDE_COMMAND = 'claude';

/**
 * The Homebrew cask name for Claude Code on macOS.
 * @constant {string}
 */
const HOMEBREW_CASK_NAME = 'claude-code';

/**
 * The winget package ID for Claude Code on Windows.
 * @constant {string}
 */
const WINGET_PACKAGE_ID = 'Anthropic.ClaudeCode';

/**
 * The Chocolatey package name for Claude Code on Windows.
 * @constant {string}
 */
const CHOCO_PACKAGE_NAME = 'claude-code';

/**
 * The npm package name for Claude Code (used as alternative installation method).
 * @constant {string}
 */
const NPM_PACKAGE_NAME = '@anthropic-ai/claude-code';

/**
 * The URL for the native installer script (Linux/macOS).
 * @constant {string}
 */
const NATIVE_INSTALLER_URL = 'https://claude.ai/install.sh';

/**
 * Checks if Claude Code is already installed on the system.
 * Uses the shell utility to search for the 'claude' command in PATH.
 *
 * @returns {boolean} True if Claude Code is installed and accessible via PATH
 */
function isClaudeCodeInstalled() {
  return shell.commandExists(CLAUDE_COMMAND);
}

/**
 * Gets the installed version of Claude Code.
 * Runs 'claude --version' and parses the output.
 *
 * @returns {Promise<string|null>} The version string (e.g., "2.0.76") or null if not installed
 */
async function getInstalledVersion() {
  if (!isClaudeCodeInstalled()) {
    return null;
  }

  const result = await shell.exec('claude --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "claude v2.0.76 (native)" or "claude v2.0.76 (npm)"
    const match = result.stdout.match(/claude\s+v?([\d.]+)/i);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Checks if Node.js is installed and meets the minimum version requirement.
 * Claude Code requires Node.js 18 or later for npm installation.
 *
 * @returns {Promise<{ installed: boolean, version: string|null, meetsMinimum: boolean }>}
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
      meetsMinimum: majorVersion >= 18
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
 * Install Claude Code on macOS using Homebrew.
 *
 * This function installs Claude Code via the Homebrew cask. Homebrew must be
 * installed first. The installation is idempotent - if Claude Code is already
 * installed, the function will skip installation and return early.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Step 1: Check if Claude Code is already installed
  if (isClaudeCodeInstalled()) {
    const version = await getInstalledVersion();
    console.log(`Claude Code is already installed${version ? ` (version ${version})` : ''}, skipping installation.`);
    return;
  }

  // Step 2: Verify Homebrew is available
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Step 3: Install Claude Code via Homebrew cask
  console.log('Installing Claude Code via Homebrew...');
  const installResult = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!installResult.success) {
    console.log('Failed to install Claude Code via Homebrew.');
    console.log(installResult.output);
    return;
  }

  // Step 4: Verify the installation succeeded
  // Note: We need to re-check PATH since brew may have added new entries
  const verifyResult = await shell.exec('claude --version');
  if (verifyResult.code !== 0) {
    console.log('Installation completed but Claude Code command is not in PATH.');
    console.log('Try opening a new terminal window or run: source ~/.zshrc');
    return;
  }

  console.log('Claude Code installed successfully.');
  console.log('Run "claude" to start, then authenticate with your Anthropic account.');
}

/**
 * Install Claude Code on Ubuntu/Debian using the native installer.
 *
 * This function downloads and runs Anthropic's official install script which
 * installs the Claude Code binary to ~/.local/bin. The installation is
 * idempotent - if Claude Code is already installed, it will skip installation.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Step 1: Check if Claude Code is already installed
  if (isClaudeCodeInstalled()) {
    const version = await getInstalledVersion();
    console.log(`Claude Code is already installed${version ? ` (version ${version})` : ''}, skipping installation.`);
    return;
  }

  // Step 2: Verify curl is available for downloading the installer
  if (!shell.commandExists('curl')) {
    console.log('curl is required but not installed. Installing curl...');
    const curlResult = await apt.install('curl');
    if (!curlResult.success) {
      console.log('Failed to install curl. Please install it manually.');
      return;
    }
  }

  // Step 3: Run the native installer script
  console.log('Installing Claude Code via native installer...');
  const installResult = await shell.exec(`curl -fsSL ${NATIVE_INSTALLER_URL} | bash`, {
    timeout: 300000 // 5 minute timeout for download and installation
  });

  if (installResult.code !== 0) {
    console.log('Native installer failed. Attempting npm installation as fallback...');
    await installViaNodeNpm();
    return;
  }

  // Step 4: Source bashrc to update PATH (installer adds ~/.local/bin to PATH)
  // Note: This won't affect the current process, but we inform the user
  console.log('Claude Code installed successfully.');
  console.log('Run "source ~/.bashrc" or open a new terminal to use Claude Code.');
  console.log('Then run "claude" to start and authenticate with your Anthropic account.');
}

/**
 * Install Claude Code on Raspberry Pi OS using npm.
 *
 * The native installer has had compatibility issues with Raspberry Pi ARM64
 * architecture, so npm installation is the recommended method. This function
 * first ensures Node.js 18+ is installed, then installs Claude Code globally.
 *
 * Requirements:
 * - 64-bit Raspberry Pi OS (aarch64 architecture)
 * - Raspberry Pi 4 or later with 4GB+ RAM recommended
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Step 1: Check if Claude Code is already installed
  if (isClaudeCodeInstalled()) {
    const version = await getInstalledVersion();
    console.log(`Claude Code is already installed${version ? ` (version ${version})` : ''}, skipping installation.`);
    return;
  }

  // Step 2: Verify architecture is 64-bit (Claude Code requires aarch64)
  const archResult = await shell.exec('uname -m');
  const architecture = archResult.stdout.trim();
  if (architecture !== 'aarch64') {
    console.log('Claude Code requires 64-bit Raspberry Pi OS (aarch64).');
    console.log(`Current architecture: ${architecture}`);
    console.log('Please install 64-bit Raspberry Pi OS from https://www.raspberrypi.com/software/');
    return;
  }

  // Step 3: Install via npm (recommended for Raspberry Pi due to native installer issues)
  console.log('Installing Claude Code via npm (recommended for Raspberry Pi)...');
  await installViaNodeNpm();
}

/**
 * Install Claude Code on Amazon Linux/RHEL using the native installer.
 *
 * This function uses Anthropic's official install script which installs
 * the Claude Code binary to ~/.local/bin. Works on Amazon Linux 2023,
 * Amazon Linux 2, RHEL 8+, and CentOS Stream 8+.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Step 1: Check if Claude Code is already installed
  if (isClaudeCodeInstalled()) {
    const version = await getInstalledVersion();
    console.log(`Claude Code is already installed${version ? ` (version ${version})` : ''}, skipping installation.`);
    return;
  }

  // Step 2: Verify curl is available
  if (!shell.commandExists('curl')) {
    console.log('curl is required but not installed. Installing curl...');
    // Determine package manager (dnf for AL2023/RHEL8+, yum for AL2)
    const platform = os.detect();
    const packageManager = platform.packageManager || 'yum';
    const installCmd = packageManager === 'dnf'
      ? 'sudo dnf install -y curl'
      : 'sudo yum install -y curl';

    const curlResult = await shell.exec(installCmd);
    if (curlResult.code !== 0) {
      console.log('Failed to install curl. Please install it manually.');
      return;
    }
  }

  // Step 3: Run the native installer script
  console.log('Installing Claude Code via native installer...');
  const installResult = await shell.exec(`curl -fsSL ${NATIVE_INSTALLER_URL} | bash`, {
    timeout: 300000 // 5 minute timeout
  });

  if (installResult.code !== 0) {
    console.log('Native installer failed. Attempting npm installation as fallback...');
    await installViaNodeNpm();
    return;
  }

  // Step 4: Inform user about PATH updates
  console.log('Claude Code installed successfully.');
  console.log('Run "source ~/.bashrc" or open a new terminal to use Claude Code.');
  console.log('Then run "claude" to start and authenticate with your Anthropic account.');
}

/**
 * Install Claude Code on Windows using winget (preferred) or Chocolatey.
 *
 * This function attempts installation via winget first (pre-installed on
 * Windows 10/11), falling back to Chocolatey if winget is not available.
 * The installation is idempotent - if Claude Code is already installed,
 * it will skip installation.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Step 1: Check if Claude Code is already installed
  if (isClaudeCodeInstalled()) {
    const version = await getInstalledVersion();
    console.log(`Claude Code is already installed${version ? ` (version ${version})` : ''}, skipping installation.`);
    return;
  }

  // Step 2: Try winget first (preferred, pre-installed on Windows 10/11)
  if (winget.isInstalled()) {
    console.log('Installing Claude Code via winget...');
    const wingetResult = await winget.install(WINGET_PACKAGE_ID);

    if (wingetResult.success) {
      console.log('Claude Code installed successfully.');
      console.log('Open a new terminal window, then run "claude" to start.');
      return;
    }

    console.log('winget installation failed, trying Chocolatey...');
  }

  // Step 3: Try Chocolatey as fallback
  if (choco.isInstalled()) {
    console.log('Installing Claude Code via Chocolatey...');
    const chocoResult = await choco.install(CHOCO_PACKAGE_NAME);

    if (chocoResult.success) {
      console.log('Claude Code installed successfully.');
      console.log('Open a new terminal window, then run "claude" to start.');
      return;
    }

    console.log('Chocolatey installation failed.');
    console.log(chocoResult.output);
    return;
  }

  // Step 4: Neither package manager available
  console.log('Neither winget nor Chocolatey is available.');
  console.log('Please install one of these package managers:');
  console.log('  - winget: Install "App Installer" from the Microsoft Store');
  console.log('  - Chocolatey: https://chocolatey.org/install');
}

/**
 * Install Claude Code on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Claude Code runs natively within WSL - there's no need to install on both
 * Windows and WSL. This function uses the native installer, same as Ubuntu.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // Step 1: Check if Claude Code is already installed
  if (isClaudeCodeInstalled()) {
    const version = await getInstalledVersion();
    console.log(`Claude Code is already installed${version ? ` (version ${version})` : ''}, skipping installation.`);
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

  // Step 3: Run the native installer script
  console.log('Installing Claude Code in WSL via native installer...');
  const installResult = await shell.exec(`curl -fsSL ${NATIVE_INSTALLER_URL} | bash`, {
    timeout: 300000 // 5 minute timeout
  });

  if (installResult.code !== 0) {
    console.log('Native installer failed. Attempting npm installation as fallback...');
    await installViaNodeNpm();
    return;
  }

  // Step 4: Inform user about PATH updates and WSL-specific notes
  console.log('Claude Code installed successfully in WSL.');
  console.log('Run "source ~/.bashrc" or open a new terminal to use Claude Code.');
  console.log('Then run "claude" to start and authenticate with your Anthropic account.');
  console.log('');
  console.log('Note: For best performance, keep your projects within the WSL filesystem');
  console.log('(e.g., ~/projects/) rather than /mnt/c/ paths.');
}

/**
 * Install Claude Code on Git Bash (Windows).
 *
 * Git Bash can execute Windows commands, so this function uses winget or
 * Chocolatey to install Claude Code. The same Windows installation works
 * for both PowerShell and Git Bash.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Git Bash uses the same Windows binaries, so delegate to Windows installer
  console.log('Installing Claude Code for Git Bash (using Windows installation)...');
  await install_windows();
}

/**
 * Helper function to install Claude Code via npm.
 *
 * This is used as a fallback when the native installer fails, or as the
 * primary method for Raspberry Pi. It first checks/installs Node.js 18+,
 * configures npm to use a user directory to avoid permission issues,
 * then installs Claude Code globally.
 *
 * @returns {Promise<void>}
 */
async function installViaNodeNpm() {
  // Step 1: Check Node.js version
  const nodeInfo = await checkNodeVersion();

  if (!nodeInfo.installed) {
    console.log('Node.js is required for npm installation but is not installed.');
    console.log('Please install Node.js 18 or later first.');
    console.log('Run: dev install node');
    return;
  }

  if (!nodeInfo.meetsMinimum) {
    console.log(`Node.js ${nodeInfo.version} is installed but Claude Code requires Node.js 18+.`);
    console.log('Please upgrade Node.js to version 18 or later.');
    return;
  }

  // Step 2: Check npm is available
  if (!isNpmInstalled()) {
    console.log('npm is not available. Please ensure Node.js is installed correctly.');
    return;
  }

  // Step 3: Configure npm to use user directory (avoids sudo requirement)
  console.log('Configuring npm for user-level global installs...');
  const npmGlobalDir = `${os.getHomeDir()}/.npm-global`;

  await shell.exec(`mkdir -p ${npmGlobalDir}`);
  await shell.exec(`npm config set prefix ${npmGlobalDir}`);

  // Step 4: Install Claude Code via npm
  console.log('Installing Claude Code via npm...');
  const installResult = await shell.exec(`npm install -g ${NPM_PACKAGE_NAME}`, {
    timeout: 300000, // 5 minute timeout
    env: {
      ...process.env,
      PATH: `${npmGlobalDir}/bin:${process.env.PATH}`
    }
  });

  if (installResult.code !== 0) {
    console.log('Failed to install Claude Code via npm.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Step 5: Remind user to update PATH
  console.log('Claude Code installed successfully via npm.');
  console.log(`Ensure ${npmGlobalDir}/bin is in your PATH.`);
  console.log('Add this to your shell profile if not already present:');
  console.log(`  export PATH="${npmGlobalDir}/bin:$PATH"`);
  console.log('');
  console.log('Then run "claude" to start and authenticate with your Anthropic account.');
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Claude Code can be installed on all supported platforms:
 * - macOS (via Homebrew cask)
 * - Ubuntu/Debian (via native installer or npm)
 * - Raspberry Pi OS (via npm, 64-bit only)
 * - Amazon Linux/RHEL/Fedora (via native installer or npm)
 * - Windows (via winget or Chocolatey)
 * - WSL (via native installer)
 * - Git Bash (via Windows winget/Chocolatey)
 *
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
    'fedora': install_amazon_linux,     // Fedora also uses native installer
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  const installer = installers[platform.type];

  if (!installer) {
    // Platform not supported - return gracefully without error
    console.log(`Claude Code is not available for ${platform.type}.`);
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
