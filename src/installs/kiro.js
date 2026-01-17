#!/usr/bin/env node

/**
 * @fileoverview Install Kiro - Amazon's AI-powered agentic IDE.
 * @module installs/kiro
 *
 * Kiro is an AI-powered IDE developed by Amazon Web Services (AWS) that helps
 * developers go from prototype to production using spec-driven development.
 * Built on the Code OSS foundation (same base as VS Code), Kiro provides
 * intelligent coding assistance through structured specifications, agent hooks,
 * and natural language interactions.
 *
 * Kiro is available for:
 * - macOS: via Homebrew cask (IDE and CLI)
 * - Ubuntu/Debian: via direct tar.gz download and CLI installation
 * - Raspberry Pi OS: via CLI (musl build for ARM64)
 * - Amazon Linux/RHEL: via CLI and optional IDE tar.gz
 * - Windows: via winget
 * - WSL: via winget on Windows host (recommended) or CLI within WSL
 * - Git Bash: via winget on Windows host
 *
 * Authentication is required via GitHub, Google, AWS Builder ID, or AWS IAM
 * Identity Center. An AWS account is NOT required.
 *
 * @see https://kiro.dev/
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const winget = require('../utils/windows/winget');
const macosApps = require('../utils/macos/apps');

/**
 * Whether this installer requires a desktop environment to function.
 * Kiro IDE is a GUI application, but the CLI can run headless.
 * We mark this as true since the primary installation is the IDE.
 * @type {boolean}
 */
const REQUIRES_DESKTOP = true;

/**
 * The name of the Kiro application bundle on macOS
 * Used for checking if Kiro is already installed
 * @constant {string}
 */
const MACOS_APP_NAME = 'Kiro';

/**
 * The Homebrew cask name for Kiro IDE
 * @constant {string}
 */
const HOMEBREW_CASK_NAME = 'kiro';

/**
 * The Homebrew cask name for Kiro CLI
 * @constant {string}
 */
const HOMEBREW_CLI_CASK_NAME = 'kiro-cli';

/**
 * The winget package ID for Kiro on Windows
 * @constant {string}
 */
const WINGET_PACKAGE_ID = 'Amazon.Kiro';

/**
 * Download URLs for Kiro packages by platform/architecture
 * These URLs point to the latest stable releases
 * @constant {Object}
 */
const DOWNLOAD_URLS = {
  // Linux IDE tar.gz packages
  'linux-x64': 'https://desktop-release.q.us-east-1.amazonaws.com/latest/linux-x64/Kiro.tar.gz',
  // CLI zip packages
  'cli-x64': 'https://desktop-release.q.us-east-1.amazonaws.com/latest/kirocli-x86_64-linux.zip',
  'cli-arm64': 'https://desktop-release.q.us-east-1.amazonaws.com/latest/kirocli-aarch64-linux.zip',
  'cli-x64-musl': 'https://desktop-release.q.us-east-1.amazonaws.com/latest/kirocli-x86_64-linux-musl.zip',
  'cli-arm64-musl': 'https://desktop-release.q.us-east-1.amazonaws.com/latest/kirocli-aarch64-linux-musl.zip',
  // Official install script
  'install-script': 'https://cli.kiro.dev/install'
};

/**
 * Check if the Kiro CLI is installed by verifying the 'kiro-cli' command exists.
 * This is a quick check that works across all platforms.
 *
 * @returns {boolean} True if the kiro-cli command is available in PATH
 */
function isKiroCliInstalled() {
  return shell.commandExists('kiro-cli');
}

/**
 * Check if the Kiro IDE is installed by verifying the 'kiro' command exists.
 * On Linux, this checks for the kiro command (symlinked from /opt/kiro/kiro).
 *
 * @returns {boolean} True if the kiro command is available in PATH
 */
function isKiroCommandAvailable() {
  return shell.commandExists('kiro');
}

/**
 * Get the installed version of Kiro CLI.
 * Runs 'kiro-cli version' and parses the output.
 *
 * @returns {Promise<string|null>} The version string (e.g., "1.24.0") or null if not installed
 */
async function getKiroCliVersion() {
  if (!isKiroCliInstalled()) {
    return null;
  }

  const result = await shell.exec('kiro-cli version');
  if (result.code === 0 && result.stdout) {
    // Output format: "Kiro CLI 1.24.0"
    const match = result.stdout.match(/Kiro CLI\s+([\d.]+)/i);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Install Kiro on macOS using Homebrew.
 *
 * This function installs both the Kiro IDE (as a cask) and optionally the
 * Kiro CLI. The IDE is installed to /Applications/Kiro.app.
 *
 * Prerequisites:
 * - macOS 11 (Big Sur) or later
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Step 1: Check if Kiro IDE is already installed
  const isAppInstalled = macosApps.isAppInstalled(MACOS_APP_NAME);
  if (isAppInstalled) {
    console.log('Kiro IDE is already installed.');
    return;
  }

  // Step 2: Verify Homebrew is available
  if (!brew.isInstalled()) {
    console.log('Homebrew is required to install Kiro on macOS.');
    console.log('Please install Homebrew first: https://brew.sh');
    console.log('Or run: dev install homebrew');
    return;
  }

  // Step 3: Install Kiro IDE via Homebrew cask
  console.log('Installing Kiro IDE via Homebrew...');
  const ideResult = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!ideResult.success) {
    console.log('Failed to install Kiro IDE via Homebrew.');
    console.log(ideResult.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "brew update" and retry');
    console.log('  2. Check if the cask is available: brew info --cask kiro');
    return;
  }

  // Step 4: Verify IDE installation
  const verifyInstalled = macosApps.isAppInstalled(MACOS_APP_NAME);
  if (!verifyInstalled) {
    console.log('Installation completed but Kiro.app was not found in /Applications.');
    console.log('You may need to run the installer again or install manually from https://kiro.dev/downloads/');
    return;
  }

  console.log('Kiro IDE installed successfully.');
  console.log('');
  console.log('To get started:');
  console.log('  1. Launch Kiro from /Applications/Kiro.app or Spotlight');
  console.log('  2. Sign in with GitHub, Google, AWS Builder ID, or AWS IAM Identity Center');
  console.log('  3. Optionally import your VS Code settings when prompted');
  console.log('');
  console.log('To install the Kiro CLI for terminal-based AI assistance:');
  console.log('  brew install --cask kiro-cli');
}

/**
 * Install Kiro on Ubuntu/Debian.
 *
 * This function installs both the Kiro IDE (from tar.gz) and the Kiro CLI.
 * The IDE is extracted to /opt/kiro and a symlink is created at /usr/local/bin/kiro.
 *
 * Prerequisites:
 * - Ubuntu 24.04+ or Debian 12+ (64-bit x86_64 for IDE)
 * - sudo privileges
 * - curl, wget, unzip packages
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Step 1: Check if Kiro is already installed
  if (isKiroCommandAvailable() || isKiroCliInstalled()) {
    const version = await getKiroCliVersion();
    console.log(`Kiro is already installed${version ? ` (CLI version ${version})` : ''}.`);
    return;
  }

  // Step 2: Install prerequisites
  console.log('Installing prerequisites...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget curl unzip tar'
  );
  if (prereqResult.code !== 0) {
    console.log('Warning: Failed to install some prerequisites. Continuing...');
  }

  // Step 3: Install Kiro CLI using the official install script
  // This script handles architecture detection and installs both CLI and IDE
  console.log('Installing Kiro using official install script...');
  const installResult = await shell.exec(
    `curl -fsSL ${DOWNLOAD_URLS['install-script']} | bash`,
    { timeout: 300000 }
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Kiro.');
    console.log(installResult.stderr);
    return;
  }

  // Step 4: Verify installation
  const verifyIde = isKiroCommandAvailable();
  const verifyCli = isKiroCliInstalled();

  if (verifyIde || verifyCli) {
    console.log('Kiro installed successfully.');
    console.log('');
    if (verifyIde) {
      console.log('Kiro IDE: installed');
    }
    if (verifyCli) {
      const version = await getKiroCliVersion();
      console.log(`Kiro CLI: ${version ? `version ${version}` : 'installed'}`);
    }
    console.log('');
    console.log('To get started:');
    console.log('  - Launch IDE: kiro');
    console.log('  - Use CLI: kiro-cli --help');
    console.log('');
    console.log('Ensure ~/.local/bin is in your PATH:');
    console.log('  echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc');
    console.log('  source ~/.bashrc');
  } else {
    console.log('Installation completed but Kiro commands were not found.');
    console.log('You may need to open a new terminal or add ~/.local/bin to your PATH.');
  }
}

/**
 * Install Kiro on Raspberry Pi OS.
 *
 * Raspberry Pi has limited support for the full Kiro IDE due to resource
 * constraints and ARM architecture. This function installs the Kiro CLI
 * (terminal-based AI assistance) using the musl build for best compatibility.
 *
 * Prerequisites:
 * - 64-bit Raspberry Pi OS (ARM64/aarch64 required)
 * - Raspberry Pi 4 or later with 4GB+ RAM recommended
 * - sudo privileges
 * - curl and unzip packages
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Step 1: Check if Kiro CLI is already installed
  if (isKiroCliInstalled()) {
    const version = await getKiroCliVersion();
    console.log(`Kiro CLI is already installed${version ? ` (version ${version})` : ''}.`);
    return;
  }

  // Step 2: Verify architecture is 64-bit
  const archResult = await shell.exec('uname -m');
  const architecture = archResult.stdout.trim();
  if (architecture !== 'aarch64') {
    console.log('Kiro requires 64-bit Raspberry Pi OS (ARM64/aarch64).');
    console.log(`Current architecture: ${architecture}`);
    console.log('');
    console.log('Please install 64-bit Raspberry Pi OS from:');
    console.log('https://www.raspberrypi.com/software/');
    return;
  }

  // Step 3: Install prerequisites
  console.log('Installing prerequisites...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl unzip'
  );
  if (prereqResult.code !== 0) {
    console.log('Warning: Failed to install some prerequisites. Continuing...');
  }

  // Step 4: Install Kiro CLI using musl build (better compatibility on Pi)
  console.log('Installing Kiro CLI (musl build for ARM64)...');
  console.log('Note: The full Kiro IDE has limited support on Raspberry Pi.');
  console.log('');
  await installKiroCli('cli-arm64-musl');

  // Step 5: Verify installation
  if (isKiroCliInstalled()) {
    const version = await getKiroCliVersion();
    console.log('Kiro CLI installed successfully.');
    console.log(`Version: ${version || 'installed'}`);
    console.log('');
    console.log('To get started:');
    console.log('  kiro-cli --help');
    console.log('  kiro-cli doctor    # Check installation');
    console.log('  kiro-cli chat      # Start interactive chat');
  } else {
    console.log('Installation completed but kiro-cli command was not found.');
    console.log('');
    console.log('Ensure ~/.local/bin is in your PATH:');
    console.log('  echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc');
    console.log('  source ~/.bashrc');
  }
}

/**
 * Install Kiro on Amazon Linux/RHEL.
 *
 * This function installs the Kiro CLI and optionally the IDE (for systems
 * with a desktop environment). The CLI is installed via the official
 * installation script or direct zip download.
 *
 * Prerequisites:
 * - Amazon Linux 2023, AL2, RHEL 8+, Fedora, or CentOS Stream 8+
 * - sudo privileges
 * - curl, unzip, tar packages
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Step 1: Check if Kiro is already installed
  if (isKiroCommandAvailable() || isKiroCliInstalled()) {
    const version = await getKiroCliVersion();
    console.log(`Kiro is already installed${version ? ` (CLI version ${version})` : ''}.`);
    return;
  }

  // Step 2: Detect package manager (dnf for AL2023/RHEL8+, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const packageManager = hasDnf ? 'dnf' : 'yum';

  // Step 3: Install prerequisites
  console.log(`Installing prerequisites via ${packageManager}...`);
  const prereqResult = await shell.exec(
    `sudo ${packageManager} install -y curl unzip tar`
  );
  if (prereqResult.code !== 0) {
    console.log('Warning: Failed to install some prerequisites. Continuing...');
  }

  // Step 4: Determine architecture and install CLI
  const arch = os.getArch();
  const cliUrl = arch === 'arm64' ? 'cli-arm64' : 'cli-x64';

  console.log('Installing Kiro CLI...');
  await installKiroCli(cliUrl);

  // Step 5: Check if desktop environment is available for IDE
  const hasDesktop = os.isDesktopAvailable();
  if (hasDesktop && arch === 'x64') {
    console.log('');
    console.log('Desktop environment detected. Installing Kiro IDE...');

    const downloadResult = await shell.exec(
      `curl -fsSL "${DOWNLOAD_URLS['linux-x64']}" -o /tmp/kiro.tar.gz`,
      { timeout: 300000 }
    );

    if (downloadResult.code === 0) {
      const installResult = await shell.exec(
        'sudo mkdir -p /opt/kiro && ' +
        'sudo tar -xzf /tmp/kiro.tar.gz -C /opt/kiro --strip-components=1 && ' +
        'sudo ln -sf /opt/kiro/kiro /usr/local/bin/kiro && ' +
        'rm -f /tmp/kiro.tar.gz'
      );

      if (installResult.code === 0) {
        console.log('Kiro IDE installed to /opt/kiro');
      } else {
        console.log('Failed to install Kiro IDE. CLI is still available.');
        await shell.exec('rm -f /tmp/kiro.tar.gz');
      }
    } else {
      console.log('Failed to download Kiro IDE. CLI is still available.');
    }
  } else if (!hasDesktop) {
    console.log('');
    console.log('Note: No desktop environment detected. Kiro IDE requires a GUI.');
    console.log('The Kiro CLI provides full terminal-based AI assistance.');
  }

  // Step 6: Verify installation
  const verifyCli = isKiroCliInstalled();
  const verifyIde = isKiroCommandAvailable();

  if (verifyCli || verifyIde) {
    console.log('');
    console.log('Kiro installed successfully.');
    if (verifyCli) {
      const version = await getKiroCliVersion();
      console.log(`Kiro CLI: ${version ? `version ${version}` : 'installed'}`);
    }
    if (verifyIde) {
      console.log('Kiro IDE: /opt/kiro/kiro');
    }
    console.log('');
    console.log('To get started:');
    console.log('  kiro-cli --help');
    console.log('  kiro-cli doctor');
  } else {
    console.log('Installation completed but Kiro commands were not found.');
    console.log('Ensure ~/.local/bin is in your PATH.');
  }
}

/**
 * Install Kiro on Windows using winget.
 *
 * This function installs Kiro IDE using the Windows Package Manager (winget),
 * which is pre-installed on Windows 10 1809+ and Windows 11.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later, or Windows 11
 * - winget package manager (pre-installed on modern Windows)
 * - Administrator privileges recommended
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Step 1: Check if Kiro is already installed via winget
  const isInstalledViaWinget = await winget.isPackageInstalled(WINGET_PACKAGE_ID);
  if (isInstalledViaWinget) {
    console.log('Kiro is already installed.');
    return;
  }

  // Also check if kiro command exists (may have been installed manually)
  if (isKiroCommandAvailable()) {
    console.log('Kiro is already installed.');
    return;
  }

  // Step 2: Verify winget is available
  if (!winget.isInstalled()) {
    console.log('winget is required to install Kiro on Windows.');
    console.log('winget is included with Windows 10 version 1809 and later.');
    console.log('');
    console.log('To install winget:');
    console.log('  1. Open Microsoft Store');
    console.log('  2. Search for "App Installer"');
    console.log('  3. Install or update the App Installer package');
    return;
  }

  // Step 3: Install Kiro via winget
  console.log('Installing Kiro via winget...');
  const result = await winget.install(WINGET_PACKAGE_ID);

  if (!result.success) {
    console.log('Failed to install Kiro via winget.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run as Administrator and retry');
    console.log('  2. Try: winget install --id Amazon.Kiro');
    console.log('  3. Download directly from https://kiro.dev/downloads/');
    return;
  }

  console.log('Kiro installed successfully.');
  console.log('');
  console.log('Close and reopen your terminal for PATH changes to take effect.');
  console.log('');
  console.log('To get started:');
  console.log('  1. Launch Kiro from the Start Menu');
  console.log('  2. Sign in with GitHub, Google, AWS Builder ID, or AWS IAM Identity Center');
}

/**
 * Install Kiro on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * The recommended approach is to install Kiro on Windows and use its remote
 * development capabilities to connect to WSL. This function can also install
 * the CLI within WSL for terminal-based AI assistance.
 *
 * Prerequisites:
 * - Windows 10 version 2004+ or Windows 11
 * - WSL 2 with Ubuntu distribution
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Step 1: Check if Kiro is already installed on Windows host
  const checkResult = await shell.exec(
    `winget.exe list --exact --id "${WINGET_PACKAGE_ID}" 2>/dev/null`
  );

  if (checkResult.code === 0 && checkResult.stdout.includes(WINGET_PACKAGE_ID)) {
    console.log('Kiro is already installed on Windows.');
    console.log('');
    console.log('To connect to WSL from Kiro:');
    console.log('  1. Open Kiro on Windows');
    console.log('  2. Use Kiro\'s remote features to connect to your WSL environment');
    return;
  }

  // Step 2: Check for existing CLI installation in WSL
  if (isKiroCliInstalled()) {
    const version = await getKiroCliVersion();
    console.log(`Kiro CLI is already installed in WSL${version ? ` (version ${version})` : ''}.`);
    return;
  }

  // Step 3: Verify winget is accessible from WSL
  const wingetExists = shell.commandExists('winget.exe');
  if (wingetExists) {
    console.log('Installing Kiro on Windows host (recommended)...');
    const installResult = await shell.exec(
      `winget.exe install --id "${WINGET_PACKAGE_ID}" --silent --accept-package-agreements --accept-source-agreements`
    );

    if (installResult.code === 0) {
      console.log('Kiro installed successfully on Windows.');
      console.log('');
      console.log('To use Kiro with WSL:');
      console.log('  1. Open Kiro on Windows');
      console.log('  2. Use Kiro\'s remote features to connect to your WSL environment');
      console.log('');
      console.log('Optionally, install Kiro CLI in WSL for terminal-based assistance:');
      console.log('  curl -fsSL https://cli.kiro.dev/install | bash');
      return;
    }

    console.log('Failed to install Kiro on Windows. Installing CLI in WSL instead...');
  } else {
    console.log('winget not accessible from WSL. Installing CLI in WSL...');
  }

  // Step 4: Install CLI in WSL as fallback
  console.log('Installing Kiro CLI within WSL...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl unzip'
  );
  if (prereqResult.code !== 0) {
    console.log('Warning: Failed to install prerequisites. Continuing...');
  }

  // Use the official install script
  const installResult = await shell.exec(
    `curl -fsSL ${DOWNLOAD_URLS['install-script']} | bash`,
    { timeout: 300000 }
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Kiro CLI in WSL.');
    console.log(installResult.stderr);
    return;
  }

  console.log('Kiro CLI installed in WSL.');
  console.log('');
  console.log('Ensure ~/.local/bin is in your PATH:');
  console.log('  echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc');
  console.log('  source ~/.bashrc');
}

/**
 * Install Kiro on Windows via Git Bash.
 *
 * Git Bash runs on Windows, so Kiro is installed as a Windows application
 * using winget. The installation is the same as native Windows.
 *
 * Prerequisites:
 * - Windows 10 or later
 * - Git for Windows (provides Git Bash)
 * - winget package manager
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if Kiro is already installed
  const checkResult = await shell.exec(
    `winget.exe list --exact --id "${WINGET_PACKAGE_ID}" 2>/dev/null`
  );

  if (checkResult.code === 0 && checkResult.stdout.includes(WINGET_PACKAGE_ID)) {
    console.log('Kiro is already installed.');
    return;
  }

  // Verify winget is accessible
  const wingetExists = shell.commandExists('winget.exe');
  if (!wingetExists) {
    console.log('winget is required to install Kiro.');
    console.log('winget should be available if you are running Windows 10 1809+ or Windows 11.');
    console.log('');
    console.log('To install winget:');
    console.log('  1. Open Microsoft Store');
    console.log('  2. Search for "App Installer"');
    console.log('  3. Install or update the App Installer package');
    return;
  }

  // Install Kiro via winget
  console.log('Installing Kiro via winget...');
  const installResult = await shell.exec(
    `winget.exe install --id "${WINGET_PACKAGE_ID}" --silent --accept-package-agreements --accept-source-agreements`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Kiro.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  console.log('Kiro installed successfully.');
  console.log('');
  console.log('Close and reopen Git Bash for PATH changes to take effect.');
  console.log('');
  console.log('To launch Kiro from Git Bash:');
  console.log('  kiro');
  console.log('Or:');
  console.log('  cmd.exe /c start "" "Kiro"');
}

/**
 * Helper function to install Kiro CLI using the official install script.
 *
 * This function uses the official Kiro CLI install script which handles
 * architecture detection and installs the appropriate CLI build. Falls back
 * to direct zip download if the install script fails.
 *
 * @param {string} urlKey - Key from DOWNLOAD_URLS (e.g., 'cli-x64', 'cli-arm64-musl') - used as fallback
 * @returns {Promise<void>}
 */
async function installKiroCli(urlKey) {
  // Try the official install script first
  console.log('Installing Kiro CLI using official install script...');
  const installScriptResult = await shell.exec(
    `curl -fsSL ${DOWNLOAD_URLS['install-script']} | bash`,
    { timeout: 300000 }
  );

  if (installScriptResult.code === 0) {
    console.log('');
    console.log('Kiro CLI installed to ~/.local/bin');
    console.log('');
    console.log('Ensure ~/.local/bin is in your PATH:');
    console.log('  echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc');
    console.log('  source ~/.bashrc');
    return;
  }

  // Fallback to direct download if install script fails
  console.log('Official install script failed. Attempting direct download...');
  const downloadUrl = DOWNLOAD_URLS[urlKey];
  if (!downloadUrl) {
    console.log(`No download URL found for ${urlKey}`);
    return;
  }

  // Download CLI zip
  console.log('Downloading Kiro CLI...');
  const downloadResult = await shell.exec(
    `curl --proto '=https' --tlsv1.2 -sSf '${downloadUrl}' -o /tmp/kirocli.zip`,
    { timeout: 300000 }
  );

  if (downloadResult.code !== 0) {
    console.log('Failed to download Kiro CLI.');
    console.log(downloadResult.stderr);
    return;
  }

  // Extract and run install script
  console.log('Extracting and installing Kiro CLI...');
  const extractResult = await shell.exec(
    'unzip -o /tmp/kirocli.zip -d /tmp/kirocli && ' +
    '/tmp/kirocli/install.sh && ' +
    'rm -rf /tmp/kirocli /tmp/kirocli.zip'
  );

  if (extractResult.code !== 0) {
    console.log('Failed to install Kiro CLI.');
    console.log(extractResult.stderr);
    // Clean up on failure
    await shell.exec('rm -rf /tmp/kirocli /tmp/kirocli.zip');
    return;
  }

  // Update PATH for current session info
  console.log('');
  console.log('Kiro CLI installed to ~/.local/bin');
  console.log('');
  console.log('Ensure ~/.local/bin is in your PATH:');
  console.log('  echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc');
  console.log('  source ~/.bashrc');
}

/**
 * Check if Kiro is installed on the current platform.
 *
 * This function performs platform-specific checks to determine if Kiro
 * is already installed:
 * - macOS: Checks for Kiro.app in /Applications
 * - Windows/Git Bash/WSL: Checks for winget package
 * - Linux: Checks for kiro or kiro-cli commands
 *
 * @returns {Promise<boolean>} True if Kiro is installed
 */
async function isInstalled() {
  const platform = os.detect();

  // macOS: Check for Kiro.app
  if (platform.type === 'macos') {
    return macosApps.isAppInstalled(MACOS_APP_NAME);
  }

  // Windows: Check via winget
  if (platform.type === 'windows') {
    return await winget.isPackageInstalled(WINGET_PACKAGE_ID);
  }

  // WSL and Git Bash: Check via winget.exe
  if (platform.type === 'wsl' || platform.type === 'gitbash') {
    const checkResult = await shell.exec(
      `winget.exe list --exact --id "${WINGET_PACKAGE_ID}" 2>/dev/null`
    );
    if (checkResult.code === 0 && checkResult.stdout.includes(WINGET_PACKAGE_ID)) {
      return true;
    }
    // Also check for CLI installation within WSL
    return isKiroCliInstalled();
  }

  // Linux platforms: Check for kiro or kiro-cli commands
  if (['ubuntu', 'debian', 'raspbian', 'amazon_linux', 'rhel', 'fedora'].includes(platform.type)) {
    return isKiroCommandAvailable() || isKiroCliInstalled();
  }

  return false;
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Kiro can be installed on:
 * - macOS (via Homebrew cask)
 * - Ubuntu/Debian (via tar.gz and CLI)
 * - Raspberry Pi OS (via CLI, ARM64 only)
 * - Amazon Linux/RHEL/Fedora (via CLI and optional IDE)
 * - Windows (via winget)
 * - WSL (via winget on Windows host or CLI within WSL)
 * - Git Bash (via winget on Windows host)
 *
 * For desktop applications (REQUIRES_DESKTOP = true), this function also
 * checks if a desktop environment is available on Linux systems.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  const supportedPlatforms = [
    'macos',
    'ubuntu',
    'debian',
    'wsl',
    'raspbian',
    'amazon_linux',
    'rhel',
    'fedora',
    'windows',
    'gitbash'
  ];

  if (!supportedPlatforms.includes(platform.type)) {
    return false;
  }

  // For desktop applications, check if a desktop environment is available
  // This prevents installation attempts in headless Docker/server environments
  if (REQUIRES_DESKTOP && !os.isDesktopAvailable()) {
    return false;
  }

  return true;
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function uses os.detect() to determine the current platform and
 * delegates to the appropriate platform-specific installation function.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  /**
   * Map of platform types to their installer functions.
   * Multiple platform types can map to the same installer (e.g., debian uses ubuntu installer).
   */
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
    // Platform not supported - return gracefully without error
    console.log(`Kiro is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

module.exports = {
  REQUIRES_DESKTOP,
  install,
  isInstalled,
  isEligible,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash
};

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
