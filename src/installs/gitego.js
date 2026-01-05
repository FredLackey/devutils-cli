#!/usr/bin/env node

/**
 * @fileoverview Install gitego - a Git identity manager and automatic profile switcher.
 *
 * gitego eliminates the risk of committing to a repository with the wrong user
 * identity. It allows you to define separate profiles for work, personal projects,
 * and clients, then automatically switches between them based on your working
 * directory.
 *
 * Key features include:
 * - Automatic profile switching based on directory
 * - Unified identity management (user.name, email, SSH keys, PAT)
 * - Secure credential storage using native keychains
 * - Cross-platform support (macOS, Windows, Linux)
 *
 * gitego uses Git's `includeIf` directive for identity switching and acts as
 * a Git credential helper for HTTPS authentication.
 *
 * Prerequisites:
 * - Git must be installed
 * - Go 1.24 or later is required (gitego is installed via `go install`)
 *
 * @module installs/gitego
 * @see https://github.com/bgreenwell/gitego
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');
const winget = require('../utils/windows/winget');

/**
 * The Go package path for gitego installation via `go install`.
 * @constant {string}
 */
const GITEGO_PACKAGE = 'github.com/bgreenwell/gitego@latest';

/**
 * Minimum required Go version for building gitego.
 * @constant {string}
 */
const MIN_GO_VERSION = '1.24';

/**
 * Checks if Go is installed and returns version information.
 *
 * @returns {Promise<{ installed: boolean, version: string|null, meetsMinimum: boolean }>}
 */
async function checkGoInstallation() {
  const isInstalled = shell.commandExists('go');
  if (!isInstalled) {
    return { installed: false, version: null, meetsMinimum: false };
  }

  // Get the installed Go version
  const result = await shell.exec('go version');
  if (result.code !== 0) {
    return { installed: true, version: null, meetsMinimum: false };
  }

  // Parse version from output like "go version go1.24.0 darwin/arm64"
  const versionMatch = result.stdout.match(/go(\d+\.\d+)/);
  if (!versionMatch) {
    return { installed: true, version: null, meetsMinimum: false };
  }

  const version = versionMatch[1];
  const meetsMinimum = compareVersions(version, MIN_GO_VERSION) >= 0;

  return { installed: true, version, meetsMinimum };
}

/**
 * Compares two semantic version strings.
 *
 * @param {string} version1 - First version (e.g., "1.24")
 * @param {string} version2 - Second version (e.g., "1.24")
 * @returns {number} - Negative if v1 < v2, positive if v1 > v2, zero if equal
 */
function compareVersions(version1, version2) {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 !== part2) {
      return part1 - part2;
    }
  }
  return 0;
}

/**
 * Checks if gitego is already installed by looking for the command.
 *
 * @returns {boolean} - True if gitego command exists in PATH
 */
function isGitegoInstalled() {
  return shell.commandExists('gitego');
}

/**
 * Installs gitego using `go install`.
 *
 * This function assumes Go is already installed and configured with
 * the Go bin directory in PATH.
 *
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function installGitegoViaGo() {
  console.log('Installing gitego via go install...');
  const result = await shell.exec(`go install ${GITEGO_PACKAGE}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Configures Git to use gitego as the credential helper.
 *
 * This clears any existing credential helpers and sets gitego as the
 * primary credential helper for HTTPS operations.
 *
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function configureGitCredentialHelper() {
  console.log('Configuring Git to use gitego as credential helper...');

  // Clear existing credential helpers first
  const clearResult = await shell.exec('git config --global credential.helper ""');
  if (clearResult.code !== 0) {
    return {
      success: false,
      output: `Failed to clear credential helper: ${clearResult.stderr}`
    };
  }

  // Add gitego as the credential helper
  const addResult = await shell.exec('git config --global --add credential.helper "!gitego credential"');
  return {
    success: addResult.code === 0,
    output: addResult.stdout || addResult.stderr
  };
}

/**
 * Verifies the gitego installation by running gitego --version.
 *
 * @returns {Promise<boolean>} - True if verification succeeds
 */
async function verifyInstallation() {
  const result = await shell.exec('gitego --version');
  return result.code === 0;
}

/**
 * Install gitego on macOS using Homebrew.
 *
 * macOS installation steps:
 * 1. Verify Homebrew is available
 * 2. Install Go via Homebrew if not present
 * 3. Ensure Go bin directory is in PATH
 * 4. Install gitego via `go install`
 * 5. Configure Git credential helper
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if gitego is already installed
  if (isGitegoInstalled()) {
    console.log('gitego is already installed, skipping...');
    return;
  }

  // Check if Homebrew is available - required for installing Go
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Check if Go is installed and meets minimum version requirement
  let goStatus = await checkGoInstallation();

  if (!goStatus.installed) {
    // Install Go via Homebrew
    console.log('Go is not installed. Installing Go via Homebrew...');
    const goInstallResult = await brew.install('go');
    if (!goInstallResult.success) {
      console.log('Failed to install Go via Homebrew.');
      console.log(goInstallResult.output);
      return;
    }
    console.log('Go installed successfully.');

    // Recheck Go installation after installing
    goStatus = await checkGoInstallation();
  }

  if (!goStatus.meetsMinimum) {
    console.log(`Go version ${goStatus.version || 'unknown'} is installed, but gitego requires Go ${MIN_GO_VERSION} or later.`);
    console.log('Please upgrade Go: brew upgrade go');
    return;
  }

  // Install gitego via go install
  const installResult = await installGitegoViaGo();
  if (!installResult.success) {
    console.log('Failed to install gitego via go install.');
    console.log(installResult.output);
    console.log('');
    console.log('Troubleshooting: Ensure ~/go/bin is in your PATH:');
    console.log('  echo \'export PATH="$PATH:$HOME/go/bin"\' >> ~/.zshrc && source ~/.zshrc');
    return;
  }

  // Configure Git credential helper
  const configResult = await configureGitCredentialHelper();
  if (!configResult.success) {
    console.log('Warning: Failed to configure Git credential helper.');
    console.log(configResult.output);
    console.log('You can configure it manually:');
    console.log('  git config --global credential.helper ""');
    console.log('  git config --global --add credential.helper "!gitego credential"');
  }

  // Verify the installation
  const verified = await verifyInstallation();
  if (!verified) {
    console.log('Installation may have succeeded, but gitego command not found in PATH.');
    console.log('Add ~/go/bin to your PATH:');
    console.log('  echo \'export PATH="$PATH:$HOME/go/bin"\' >> ~/.zshrc && source ~/.zshrc');
    return;
  }

  console.log('gitego installed successfully.');
  console.log('');
  console.log('Next steps:');
  console.log('  gitego add personal --name "Your Name" --email "you@example.com"');
  console.log('  gitego use personal');
}

/**
 * Install gitego on Ubuntu/Debian using APT.
 *
 * Ubuntu installation steps:
 * 1. Check if gitego is already installed
 * 2. Download and install Go from official source (APT version often outdated)
 * 3. Configure PATH to include Go directories
 * 4. Install gitego via `go install`
 * 5. Install libsecret for secure credential storage
 * 6. Configure Git credential helper
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if gitego is already installed
  if (isGitegoInstalled()) {
    console.log('gitego is already installed, skipping...');
    return;
  }

  // Check if Git is installed (required for gitego)
  if (!shell.commandExists('git')) {
    console.log('Git is not installed. Please install Git first.');
    console.log('Run: dev install git');
    return;
  }

  // Check if Go is installed and meets minimum version requirement
  let goStatus = await checkGoInstallation();

  if (!goStatus.installed || !goStatus.meetsMinimum) {
    // Go version in APT is often outdated, so we download directly from go.dev
    console.log('Installing Go from official source...');

    // Download Go tarball
    const downloadResult = await shell.exec(
      'wget -q https://go.dev/dl/go1.24.0.linux-amd64.tar.gz -O /tmp/go.tar.gz'
    );
    if (downloadResult.code !== 0) {
      console.log('Failed to download Go.');
      console.log(downloadResult.stderr);
      return;
    }

    // Remove existing Go installation and extract new version
    const extractResult = await shell.exec(
      'sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf /tmp/go.tar.gz'
    );
    if (extractResult.code !== 0) {
      console.log('Failed to extract Go.');
      console.log(extractResult.stderr);
      return;
    }

    // Clean up the downloaded archive
    await shell.exec('rm -f /tmp/go.tar.gz');

    console.log('Go installed successfully.');
    console.log('');
    console.log('Important: Add Go to your PATH by running:');
    console.log('  echo \'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"\' >> ~/.bashrc && source ~/.bashrc');
    console.log('');

    // Update PATH for the current session so we can continue installation
    process.env.PATH = `${process.env.PATH}:/usr/local/go/bin:${process.env.HOME}/go/bin`;

    // Verify Go is now available
    goStatus = await checkGoInstallation();
    if (!goStatus.installed) {
      console.log('Go installation completed, but go command not found.');
      console.log('Please add Go to your PATH and run this installer again.');
      return;
    }
  }

  // Install gitego via go install
  const installResult = await installGitegoViaGo();
  if (!installResult.success) {
    console.log('Failed to install gitego via go install.');
    console.log(installResult.output);
    return;
  }

  // Install libsecret for secure credential storage
  console.log('Installing libsecret for secure credential storage...');
  const libsecretResult = await apt.install('libsecret-1-0');
  if (!libsecretResult.success) {
    console.log('Warning: Failed to install libsecret. PAT storage may not work.');
    console.log('You can install it manually: sudo apt-get install -y libsecret-1-0');
  }

  // Configure Git credential helper
  const configResult = await configureGitCredentialHelper();
  if (!configResult.success) {
    console.log('Warning: Failed to configure Git credential helper.');
    console.log(configResult.output);
  }

  // Verify the installation
  const verified = await verifyInstallation();
  if (!verified) {
    console.log('Installation may have succeeded, but gitego command not found in PATH.');
    console.log('Add the Go bin directories to your PATH:');
    console.log('  echo \'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"\' >> ~/.bashrc && source ~/.bashrc');
    return;
  }

  console.log('gitego installed successfully.');
  console.log('');
  console.log('Next steps:');
  console.log('  gitego add personal --name "Your Name" --email "you@example.com"');
  console.log('  gitego use personal');
}

/**
 * Install gitego on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL installation follows the same process as native Ubuntu, with additional
 * configuration for credential storage since WSL does not have a native
 * secret service running by default.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // Check if gitego is already installed
  if (isGitegoInstalled()) {
    console.log('gitego is already installed, skipping...');
    return;
  }

  // Use the same installation process as Ubuntu
  await install_ubuntu();

  // If installation succeeded, provide WSL-specific guidance
  if (isGitegoInstalled()) {
    console.log('');
    console.log('WSL Note: For secure PAT storage, you may need to configure pass:');
    console.log('  sudo apt-get install -y pass gnupg');
    console.log('  gpg --gen-key');
    console.log('  pass init "your-gpg-key-id"');
  }
}

/**
 * Install gitego on Raspberry Pi OS using APT.
 *
 * Raspberry Pi installation follows the same process as Ubuntu, but uses
 * the appropriate ARM architecture Go binary (arm64 for 64-bit, armv6l
 * for 32-bit).
 *
 * Note: Compilation on Raspberry Pi may take several minutes due to
 * limited processing power.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if gitego is already installed
  if (isGitegoInstalled()) {
    console.log('gitego is already installed, skipping...');
    return;
  }

  // Check if Git is installed (required for gitego)
  if (!shell.commandExists('git')) {
    console.log('Git is not installed. Please install Git first.');
    console.log('Run: dev install git');
    return;
  }

  // Detect the architecture to download the correct Go binary
  const arch = os.getArch();
  let goArch;
  if (arch === 'arm64') {
    goArch = 'arm64';
  } else if (arch === 'arm') {
    goArch = 'armv6l';
  } else {
    console.log(`Unsupported architecture for Raspberry Pi: ${arch}`);
    return;
  }

  // Check if Go is installed and meets minimum version requirement
  let goStatus = await checkGoInstallation();

  if (!goStatus.installed || !goStatus.meetsMinimum) {
    console.log(`Installing Go for ${goArch} from official source...`);

    // Download Go tarball for the appropriate ARM architecture
    const downloadResult = await shell.exec(
      `wget -q https://go.dev/dl/go1.24.0.linux-${goArch}.tar.gz -O /tmp/go.tar.gz`
    );
    if (downloadResult.code !== 0) {
      console.log('Failed to download Go.');
      console.log(downloadResult.stderr);
      return;
    }

    // Remove existing Go installation and extract new version
    const extractResult = await shell.exec(
      'sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf /tmp/go.tar.gz'
    );
    if (extractResult.code !== 0) {
      console.log('Failed to extract Go.');
      console.log(extractResult.stderr);
      return;
    }

    // Clean up the downloaded archive
    await shell.exec('rm -f /tmp/go.tar.gz');

    console.log('Go installed successfully.');
    console.log('');
    console.log('Important: Add Go to your PATH by running:');
    console.log('  echo \'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"\' >> ~/.bashrc && source ~/.bashrc');
    console.log('');

    // Update PATH for the current session
    process.env.PATH = `${process.env.PATH}:/usr/local/go/bin:${process.env.HOME}/go/bin`;

    goStatus = await checkGoInstallation();
    if (!goStatus.installed) {
      console.log('Go installation completed, but go command not found.');
      console.log('Please add Go to your PATH and run this installer again.');
      return;
    }
  }

  // Install gitego via go install
  // Note: This may take several minutes on Raspberry Pi
  console.log('Installing gitego (this may take several minutes on Raspberry Pi)...');
  const installResult = await installGitegoViaGo();
  if (!installResult.success) {
    console.log('Failed to install gitego via go install.');
    console.log(installResult.output);
    console.log('');
    console.log('If you see out-of-memory errors, try increasing swap space:');
    console.log('  sudo fallocate -l 2G /swapfile');
    console.log('  sudo chmod 600 /swapfile');
    console.log('  sudo mkswap /swapfile');
    console.log('  sudo swapon /swapfile');
    return;
  }

  // Install libsecret for secure credential storage
  console.log('Installing libsecret for secure credential storage...');
  const libsecretResult = await apt.install('libsecret-1-0');
  if (!libsecretResult.success) {
    console.log('Warning: Failed to install libsecret. PAT storage may not work.');
  }

  // Configure Git credential helper
  const configResult = await configureGitCredentialHelper();
  if (!configResult.success) {
    console.log('Warning: Failed to configure Git credential helper.');
    console.log(configResult.output);
  }

  // Verify the installation
  const verified = await verifyInstallation();
  if (!verified) {
    console.log('Installation may have succeeded, but gitego command not found in PATH.');
    console.log('Add the Go bin directories to your PATH:');
    console.log('  echo \'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"\' >> ~/.bashrc && source ~/.bashrc');
    return;
  }

  console.log('gitego installed successfully.');
  console.log('');
  console.log('Next steps:');
  console.log('  gitego add personal --name "Your Name" --email "you@example.com"');
  console.log('  gitego use personal');
}

/**
 * Install gitego on Amazon Linux using DNF or YUM.
 *
 * Amazon Linux installation steps:
 * 1. Check if gitego is already installed
 * 2. Download and install Go from official source
 * 3. Install gitego via `go install`
 * 4. Optionally install libsecret for credential storage
 * 5. Configure Git credential helper
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if gitego is already installed
  if (isGitegoInstalled()) {
    console.log('gitego is already installed, skipping...');
    return;
  }

  // Check if Git is installed (required for gitego)
  if (!shell.commandExists('git')) {
    console.log('Git is not installed. Please install Git first.');
    console.log('Run: dev install git');
    return;
  }

  // Detect the platform to determine which package manager to use
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Check if Go is installed and meets minimum version requirement
  let goStatus = await checkGoInstallation();

  if (!goStatus.installed || !goStatus.meetsMinimum) {
    console.log('Installing Go from official source...');

    // Check if wget is available, install if not
    if (!shell.commandExists('wget')) {
      console.log('Installing wget...');
      const wgetCommand = packageManager === 'dnf'
        ? 'sudo dnf install -y wget'
        : 'sudo yum install -y wget';
      const wgetResult = await shell.exec(wgetCommand);
      if (wgetResult.code !== 0) {
        console.log('Failed to install wget.');
        return;
      }
    }

    // Download Go tarball
    const downloadResult = await shell.exec(
      'wget -q https://go.dev/dl/go1.24.0.linux-amd64.tar.gz -O /tmp/go.tar.gz'
    );
    if (downloadResult.code !== 0) {
      console.log('Failed to download Go.');
      console.log(downloadResult.stderr);
      return;
    }

    // Remove existing Go installation and extract new version
    const extractResult = await shell.exec(
      'sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf /tmp/go.tar.gz'
    );
    if (extractResult.code !== 0) {
      console.log('Failed to extract Go.');
      console.log(extractResult.stderr);
      return;
    }

    // Clean up the downloaded archive
    await shell.exec('rm -f /tmp/go.tar.gz');

    console.log('Go installed successfully.');
    console.log('');
    console.log('Important: Add Go to your PATH by running:');
    console.log('  echo \'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"\' >> ~/.bashrc && source ~/.bashrc');
    console.log('');

    // Update PATH for the current session
    process.env.PATH = `${process.env.PATH}:/usr/local/go/bin:${process.env.HOME}/go/bin`;

    goStatus = await checkGoInstallation();
    if (!goStatus.installed) {
      console.log('Go installation completed, but go command not found.');
      console.log('Please add Go to your PATH and run this installer again.');
      return;
    }
  }

  // Install gitego via go install
  const installResult = await installGitegoViaGo();
  if (!installResult.success) {
    console.log('Failed to install gitego via go install.');
    console.log(installResult.output);
    return;
  }

  // Install libsecret for secure credential storage (optional on headless servers)
  console.log('Installing libsecret for secure credential storage...');
  const libsecretCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y libsecret'
    : 'sudo yum install -y libsecret';
  const libsecretResult = await shell.exec(libsecretCommand);
  if (libsecretResult.code !== 0) {
    console.log('Note: libsecret installation failed. This is expected on headless servers.');
    console.log('gitego will still work for identity switching, but PAT storage may require alternative configuration.');
  }

  // Configure Git credential helper
  const configResult = await configureGitCredentialHelper();
  if (!configResult.success) {
    console.log('Warning: Failed to configure Git credential helper.');
    console.log(configResult.output);
  }

  // Verify the installation
  const verified = await verifyInstallation();
  if (!verified) {
    console.log('Installation may have succeeded, but gitego command not found in PATH.');
    console.log('Add the Go bin directories to your PATH:');
    console.log('  echo \'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"\' >> ~/.bashrc && source ~/.bashrc');
    return;
  }

  console.log('gitego installed successfully.');
  console.log('');
  console.log('Next steps:');
  console.log('  gitego add personal --name "Your Name" --email "you@example.com"');
  console.log('  gitego use personal');
}

/**
 * Install gitego on Windows using Chocolatey or winget.
 *
 * Windows installation steps:
 * 1. Check if gitego is already installed
 * 2. Verify Chocolatey or winget is available
 * 3. Install Go via the available package manager
 * 4. Install gitego via `go install`
 * 5. Configure Git credential helper
 *
 * Note: After installation, a new terminal window must be opened for
 * PATH changes to take effect.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if gitego is already installed
  if (isGitegoInstalled()) {
    console.log('gitego is already installed, skipping...');
    return;
  }

  // Check if Git is installed (required for gitego)
  if (!shell.commandExists('git')) {
    console.log('Git is not installed. Please install Git first.');
    console.log('Run: dev install git');
    return;
  }

  // Determine which package manager to use (prefer winget, fall back to Chocolatey)
  const hasWinget = winget.isInstalled();
  const hasChoco = choco.isInstalled();

  if (!hasWinget && !hasChoco) {
    console.log('Neither winget nor Chocolatey is installed.');
    console.log('Please install Chocolatey first: dev install chocolatey');
    return;
  }

  // Check if Go is installed and meets minimum version requirement
  let goStatus = await checkGoInstallation();

  if (!goStatus.installed || !goStatus.meetsMinimum) {
    console.log('Installing Go...');

    let goInstallResult;
    if (hasChoco) {
      goInstallResult = await choco.install('golang');
    } else {
      goInstallResult = await winget.install('GoLang.Go');
    }

    if (!goInstallResult.success) {
      console.log('Failed to install Go.');
      console.log(goInstallResult.output);
      return;
    }

    console.log('Go installed successfully.');
    console.log('');
    console.log('Important: Close and reopen your terminal for PATH changes to take effect.');
    console.log('Then run this installer again to complete gitego installation.');
    return;
  }

  // Install gitego via go install
  const installResult = await installGitegoViaGo();
  if (!installResult.success) {
    console.log('Failed to install gitego via go install.');
    console.log(installResult.output);
    console.log('');
    console.log('Troubleshooting: Ensure the Go bin directory is in your PATH.');
    console.log('The Go bin directory is typically at: %USERPROFILE%\\go\\bin');
    return;
  }

  // Configure Git credential helper
  const configResult = await configureGitCredentialHelper();
  if (!configResult.success) {
    console.log('Warning: Failed to configure Git credential helper.');
    console.log(configResult.output);
    console.log('You can configure it manually in PowerShell:');
    console.log('  git config --global credential.helper ""');
    console.log('  git config --global --add credential.helper "!gitego credential"');
  }

  // Verify the installation
  const verified = await verifyInstallation();
  if (!verified) {
    console.log('Installation may have succeeded, but gitego command not found in PATH.');
    console.log('Close and reopen your terminal, then verify with: gitego --version');
    return;
  }

  console.log('gitego installed successfully.');
  console.log('');
  console.log('Note: Close and reopen your terminal for PATH changes to take effect.');
  console.log('');
  console.log('Next steps:');
  console.log('  gitego add personal --name "Your Name" --email "you@example.com"');
  console.log('  gitego use personal');
}

/**
 * Install gitego on Git Bash (Windows).
 *
 * Git Bash runs on Windows, so gitego installation follows the Windows
 * process. The gitego binary installed on Windows will be available
 * in Git Bash since Git Bash inherits the Windows PATH.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if gitego is already installed
  if (isGitegoInstalled()) {
    console.log('gitego is already installed, skipping...');
    return;
  }

  // Check if Go is available
  const goStatus = await checkGoInstallation();
  if (!goStatus.installed) {
    console.log('Go is not installed. Please install Go on Windows first.');
    console.log('');
    console.log('From an Administrator PowerShell, run:');
    console.log('  choco install golang -y');
    console.log('');
    console.log('Or with winget:');
    console.log('  winget install --id GoLang.Go --silent');
    console.log('');
    console.log('Then restart Git Bash and run this installer again.');
    return;
  }

  if (!goStatus.meetsMinimum) {
    console.log(`Go version ${goStatus.version} is installed, but gitego requires Go ${MIN_GO_VERSION} or later.`);
    console.log('Please upgrade Go and try again.');
    return;
  }

  // Install gitego via go install
  const installResult = await installGitegoViaGo();
  if (!installResult.success) {
    console.log('Failed to install gitego via go install.');
    console.log(installResult.output);
    console.log('');
    console.log('Troubleshooting: Ensure ~/go/bin is in your PATH:');
    console.log('  echo \'export PATH="$PATH:$HOME/go/bin"\' >> ~/.bashrc && source ~/.bashrc');
    return;
  }

  // Configure Git credential helper
  const configResult = await configureGitCredentialHelper();
  if (!configResult.success) {
    console.log('Warning: Failed to configure Git credential helper.');
    console.log(configResult.output);
  }

  // Verify the installation
  const verified = await verifyInstallation();
  if (!verified) {
    console.log('Installation may have succeeded, but gitego command not found in PATH.');
    console.log('Add ~/go/bin to your PATH:');
    console.log('  echo \'export PATH="$PATH:$HOME/go/bin"\' >> ~/.bashrc && source ~/.bashrc');
    return;
  }

  console.log('gitego installed successfully.');
  console.log('');
  console.log('Next steps:');
  console.log('  gitego add personal --name "Your Name" --email "you@example.com"');
  console.log('  gitego use personal');
}

/**
 * Check if gitego is currently installed on the system.
 *
 * This function checks if the gitego command exists in PATH.
 * gitego is installed via `go install` on all platforms.
 *
 * @returns {Promise<boolean>} True if gitego is installed, false otherwise
 */
async function isInstalled() {
  return isGitegoInstalled();
}

/**
 * Check if this installer is supported on the current platform.
 * gitego is supported on all major platforms via Go.
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
 * appropriate platform-specific installer function. gitego is supported on
 * all major platforms through Go's cross-platform compilation.
 *
 * Supported platforms:
 * - macOS (via Homebrew for Go, then go install)
 * - Ubuntu/Debian (via official Go tarball, then go install)
 * - Ubuntu on WSL (same as Ubuntu, with WSL-specific guidance)
 * - Raspberry Pi OS (via ARM Go tarball, then go install)
 * - Amazon Linux/RHEL (via official Go tarball, then go install)
 * - Windows (via Chocolatey/winget for Go, then go install)
 * - Git Bash (uses Windows Go installation)
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
    console.log(`gitego is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
  await installer();
}

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

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
