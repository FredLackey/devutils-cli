#!/usr/bin/env node

/**
 * @fileoverview Install Go (Golang) programming language.
 * @module installs/go
 *
 * Go is an open-source programming language developed by Google that makes it
 * simple to build secure, scalable systems. Go is statically typed, compiled,
 * and designed for simplicity and reliability.
 *
 * This installer provides:
 * - Homebrew installation for macOS
 * - Official Go distribution for Linux platforms (Ubuntu, Raspberry Pi OS, Amazon Linux)
 * - Chocolatey installation for Windows
 *
 * IMPORTANT PLATFORM NOTES:
 * - macOS: Installs via Homebrew formula
 * - Ubuntu/Debian: Downloads official tarball from go.dev
 * - Raspberry Pi OS: Downloads ARM-specific tarball (auto-detects 32/64-bit)
 * - Amazon Linux: Downloads official tarball from go.dev
 * - Windows: Installs via Chocolatey
 * - WSL: Downloads official tarball (same as Ubuntu)
 * - Git Bash: Installs on Windows host via Chocolatey/PowerShell
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew formula name for Go on macOS.
 */
const HOMEBREW_FORMULA_NAME = 'go';

/**
 * The Chocolatey package name for Go on Windows.
 */
const CHOCO_PACKAGE_NAME = 'golang';

/**
 * The Go version API endpoint that returns the latest stable version.
 * This URL returns plain text with the version string (e.g., "go1.25.5").
 */
const GO_VERSION_URL = 'https://go.dev/VERSION?m=text';

/**
 * The base URL for downloading Go tarballs from the official website.
 */
const GO_DOWNLOAD_BASE_URL = 'https://go.dev/dl';

/**
 * The standard installation directory for Go on Linux systems.
 * This is the recommended location per the official Go installation guide.
 */
const GO_INSTALL_DIR = '/usr/local/go';

/**
 * Check if Go is installed by verifying the 'go' command exists.
 *
 * This performs a quick check across all platforms. Note that if Go is
 * installed but not in PATH, this will return false.
 *
 * @returns {boolean} True if the go command is available, false otherwise
 */
function isGoCommandAvailable() {
  return shell.commandExists('go');
}

/**
 * Get the installed Go version.
 *
 * Executes 'go version' to determine the currently installed version.
 * Returns the version string (e.g., "1.25.5") if successful.
 *
 * This function checks both:
 * 1. The 'go' command in PATH (for convenience)
 * 2. The standard installation location /usr/local/go/bin/go (for Linux)
 *
 * This ensures idempotency works correctly even when the shell profile
 * hasn't been sourced yet in the current session.
 *
 * @returns {Promise<string|null>} Go version string, or null if not installed
 */
async function getGoVersion() {
  // First try the go command if it's in PATH
  if (isGoCommandAvailable()) {
    const result = await shell.exec('go version');
    if (result.code === 0 && result.stdout) {
      // Output format: "go version go1.25.5 darwin/arm64"
      const match = result.stdout.match(/go version go([\d.]+)/);
      return match ? match[1] : result.stdout.trim();
    }
  }

  // If not in PATH, check the standard Linux installation location
  // This is important for idempotency in the same session before profile is sourced
  const result = await shell.exec('/usr/local/go/bin/go version 2>/dev/null');
  if (result.code === 0 && result.stdout) {
    const match = result.stdout.match(/go version go([\d.]+)/);
    return match ? match[1] : result.stdout.trim();
  }

  return null;
}

/**
 * Fetch the latest Go version from the official Go website.
 *
 * Queries the Go version API to get the current stable version string.
 * The API returns text like "go1.25.5" on the first line.
 *
 * @returns {Promise<string|null>} Version string (e.g., "go1.25.5"), or null on failure
 */
async function fetchLatestGoVersion() {
  const result = await shell.exec(`curl -sL '${GO_VERSION_URL}' | head -n1`);
  if (result.code === 0 && result.stdout) {
    // The API returns something like "go1.25.5\ntime 2024-01-01..."
    // We only need the first line
    return result.stdout.trim().split('\n')[0];
  }
  return null;
}

/**
 * Remove any existing Go installations from the system.
 *
 * This function removes Go installed via APT (golang-go package) and
 * also removes any manually installed Go in /usr/local/go. This ensures
 * a clean slate before installing the latest version.
 *
 * @returns {Promise<void>}
 */
async function removeExistingGoInstallations() {
  console.log('Removing any existing Go installations...');

  // Remove APT-installed Go packages (may be outdated)
  await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y golang-go golang 2>/dev/null || true'
  );

  // Remove any manual installation in /usr/local/go
  await shell.exec('sudo rm -rf /usr/local/go 2>/dev/null || true');
}

/**
 * Install required utilities (wget, curl) on Debian-based systems.
 *
 * These utilities are needed to download Go from the official website.
 * Uses DEBIAN_FRONTEND=noninteractive for unattended installation.
 *
 * @returns {Promise<void>}
 * @throws {Error} If utility installation fails
 */
async function installRequiredUtilities() {
  console.log('Installing required utilities (wget, curl)...');

  const updateResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y'
  );
  if (updateResult.code !== 0) {
    console.log('Warning: apt-get update had issues, continuing...');
  }

  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget curl'
  );
  if (installResult.code !== 0) {
    throw new Error(`Failed to install required utilities: ${installResult.stderr}`);
  }
}

/**
 * Download and extract Go tarball to /usr/local.
 *
 * Downloads the specified Go version tarball and extracts it to the
 * standard location (/usr/local/go). The tarball is downloaded to /tmp
 * and cleaned up after extraction.
 *
 * @param {string} goVersion - The Go version to download (e.g., "go1.25.5")
 * @param {string} goArch - The architecture suffix (e.g., "linux-amd64", "linux-arm64")
 * @returns {Promise<void>}
 * @throws {Error} If download or extraction fails
 */
async function downloadAndInstallGo(goVersion, goArch) {
  const tarballName = `${goVersion}.${goArch}.tar.gz`;
  const downloadUrl = `${GO_DOWNLOAD_BASE_URL}/${tarballName}`;
  const tempPath = `/tmp/go.tar.gz`;

  console.log(`Downloading Go ${goVersion} for ${goArch}...`);
  console.log(`URL: ${downloadUrl}`);

  // Download the tarball
  const downloadResult = await shell.exec(
    `wget -q "${downloadUrl}" -O ${tempPath}`
  );
  if (downloadResult.code !== 0) {
    throw new Error(
      `Failed to download Go.\n` +
      `URL: ${downloadUrl}\n` +
      `Error: ${downloadResult.stderr}\n\n` +
      `Please check your internet connection and try again.`
    );
  }

  // Extract to /usr/local
  console.log('Extracting Go to /usr/local...');
  const extractResult = await shell.exec(
    `sudo tar -C /usr/local -xzf ${tempPath}`
  );
  if (extractResult.code !== 0) {
    throw new Error(
      `Failed to extract Go tarball.\n` +
      `Error: ${extractResult.stderr}\n\n` +
      `Ensure you have sudo privileges and /usr/local is writable.`
    );
  }

  // Clean up the downloaded tarball
  await shell.exec(`rm -f ${tempPath}`);
}

/**
 * Configure Go environment variables by adding to shell profile.
 *
 * Adds the Go binary directory (/usr/local/go/bin) and the user's Go
 * workspace bin directory ($HOME/go/bin) to the PATH. Writes to the
 * appropriate shell profile based on the platform.
 *
 * @param {string} profilePath - Path to the shell profile file (e.g., ~/.profile, ~/.bashrc)
 * @returns {Promise<void>}
 */
async function configureGoEnvironment(profilePath) {
  console.log(`Configuring Go environment in ${profilePath}...`);

  // Check if Go path is already configured to avoid duplicates
  const checkResult = await shell.exec(`grep -q '/usr/local/go/bin' ${profilePath} 2>/dev/null`);
  if (checkResult.code === 0) {
    console.log('Go PATH already configured in profile, skipping...');
    return;
  }

  // Add Go to PATH
  const pathConfig = `
# Go programming language
export PATH=$PATH:/usr/local/go/bin
export PATH=$PATH:$HOME/go/bin
`;

  const appendResult = await shell.exec(
    `echo '${pathConfig}' >> ${profilePath}`
  );
  if (appendResult.code !== 0) {
    console.log(`Warning: Could not update ${profilePath}. You may need to add Go to PATH manually.`);
  }
}

/**
 * Install Go on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * Homebrew automatically handles PATH configuration and version management.
 * With modern Go (1.16+), you do not need to set GOROOT or GOPATH manually.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Go is already installed...');

  // Check if Go is already installed
  const existingVersion = await getGoVersion();
  if (existingVersion) {
    console.log(`Go ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Also check if the formula is installed (Go may be installed but not in current PATH)
  const formulaInstalled = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (formulaInstalled) {
    console.log('Go is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('NOTE: If go commands are not working, ensure Homebrew is in your PATH.');
    console.log('For Apple Silicon: eval "$(/opt/homebrew/bin/brew shellenv)"');
    console.log('For Intel: eval "$(/usr/local/bin/brew shellenv)"');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Go.'
    );
  }

  console.log('Installing Go via Homebrew...');

  // Install Go formula
  const result = await brew.install(HOMEBREW_FORMULA_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Go via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Try manual installation: brew reinstall go`
    );
  }

  // Verify installation
  const version = await getGoVersion();
  if (!version) {
    console.log('');
    console.log('Go was installed but may not be in your current PATH.');
    console.log('Please restart your terminal or run:');
    console.log('  source ~/.zprofile');
    console.log('');
    console.log('Then verify with: go version');
    return;
  }

  console.log(`Go ${version} installed successfully.`);
  console.log('');
  console.log('To use Go tools installed via "go install", add this to ~/.zprofile:');
  console.log('  export PATH="$PATH:$HOME/go/bin"');
}

/**
 * Install Go on Ubuntu/Debian using official tarball from go.dev.
 *
 * Prerequisites:
 * - Ubuntu 20.04 (Focal) or later, or Debian 11 (Bullseye) or later (64-bit)
 * - sudo privileges
 * - At least 500 MB free disk space
 *
 * IMPORTANT: The golang-go package in Ubuntu/Debian repositories may be
 * outdated. This function downloads the latest version from go.dev.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu() {
  console.log('Checking if Go is already installed...');

  // Check if Go is already installed
  const existingVersion = await getGoVersion();
  if (existingVersion) {
    console.log(`Go ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Remove any existing Go installations (APT packages may be outdated)
  await removeExistingGoInstallations();

  // Install required utilities
  await installRequiredUtilities();

  // Fetch the latest Go version
  console.log('Fetching latest Go version...');
  const goVersion = await fetchLatestGoVersion();
  if (!goVersion) {
    throw new Error(
      'Could not determine the latest Go version.\n' +
      'Please check your internet connection and try again.'
    );
  }
  console.log(`Latest version: ${goVersion}`);

  // Download and install Go
  await downloadAndInstallGo(goVersion, 'linux-amd64');

  // Configure environment
  await configureGoEnvironment('~/.profile');

  // Source the profile to make Go available in the current session
  await shell.exec('source ~/.profile 2>/dev/null || true');

  // Verify installation by checking the binary directly
  const verifyResult = await shell.exec('/usr/local/go/bin/go version');
  if (verifyResult.code !== 0) {
    throw new Error(
      'Installation appeared to complete but Go was not found.\n\n' +
      'Please try:\n' +
      '  1. Log out and log back in, or run: source ~/.profile\n' +
      '  2. Verify installation: /usr/local/go/bin/go version'
    );
  }

  // Extract version from output for display
  const versionMatch = verifyResult.stdout.match(/go version go([\d.]+)/);
  const installedVersion = versionMatch ? versionMatch[1] : goVersion;

  console.log(`Go ${installedVersion} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To use Go in your current terminal session:');
  console.log('  source ~/.profile');
  console.log('');
  console.log('Or log out and log back in for changes to take effect.');
  console.log('');
  console.log('Verify installation with: go version');
}

/**
 * Install Go on Raspberry Pi OS using official tarball from go.dev.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
 * - Raspberry Pi 3B+ or later (64-bit capable hardware)
 * - At least 500 MB free disk space
 * - sudo privileges
 *
 * This function automatically detects the architecture (aarch64 vs armv7l)
 * and downloads the appropriate Go binary:
 * - aarch64 (64-bit): linux-arm64
 * - armv7l/armv6l (32-bit): linux-armv6l
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_raspbian() {
  console.log('Checking if Go is already installed...');

  // Check if Go is already installed
  const existingVersion = await getGoVersion();
  if (existingVersion) {
    console.log(`Go ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Detect architecture
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();

  let goArch;
  if (arch === 'aarch64') {
    goArch = 'linux-arm64';
    console.log('Detected 64-bit Raspberry Pi OS (arm64).');
  } else if (arch === 'armv7l' || arch === 'armv6l') {
    goArch = 'linux-armv6l';
    console.log(`Detected 32-bit Raspberry Pi OS (${arch}).`);
    console.log('');
    console.log('NOTE: For better performance and long-term support, consider');
    console.log('upgrading to 64-bit Raspberry Pi OS.');
    console.log('');
  } else {
    throw new Error(
      `Unsupported Raspberry Pi architecture: ${arch}\n` +
      'Expected aarch64 (64-bit) or armv7l/armv6l (32-bit).'
    );
  }

  // Remove any existing Go installations
  await removeExistingGoInstallations();

  // Install required utilities
  await installRequiredUtilities();

  // Fetch the latest Go version
  console.log('Fetching latest Go version...');
  const goVersion = await fetchLatestGoVersion();
  if (!goVersion) {
    throw new Error(
      'Could not determine the latest Go version.\n' +
      'Please check your internet connection and try again.'
    );
  }
  console.log(`Latest version: ${goVersion}`);

  // Download and install Go
  await downloadAndInstallGo(goVersion, goArch);

  // Configure environment
  await configureGoEnvironment('~/.profile');

  // Source the profile
  await shell.exec('source ~/.profile 2>/dev/null || true');

  // Verify installation
  const verifyResult = await shell.exec('/usr/local/go/bin/go version');
  if (verifyResult.code !== 0) {
    throw new Error(
      'Installation appeared to complete but Go was not found.\n\n' +
      'Please try:\n' +
      '  1. Log out and log back in, or run: source ~/.profile\n' +
      '  2. Verify installation: /usr/local/go/bin/go version'
    );
  }

  const versionMatch = verifyResult.stdout.match(/go version go([\d.]+)/);
  const installedVersion = versionMatch ? versionMatch[1] : goVersion;

  console.log(`Go ${installedVersion} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To use Go in your current terminal session:');
  console.log('  source ~/.profile');
  console.log('');
  console.log('Or log out and log back in for changes to take effect.');
  console.log('');
  console.log('NOTE: Compilation may be slower on Raspberry Pi due to limited');
  console.log('CPU and RAM. Consider adding swap space if you encounter memory issues.');
}

/**
 * Install Go on Amazon Linux using official tarball from go.dev.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - sudo privileges
 * - EC2 instance or compatible environment
 *
 * This function downloads the latest Go version from go.dev rather than
 * using the Amazon repository version, which may be outdated.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('Checking if Go is already installed...');

  // Check if Go is already installed
  const existingVersion = await getGoVersion();
  if (existingVersion) {
    console.log(`Go ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Detect package manager (dnf for AL2023, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    throw new Error(
      'Neither dnf nor yum package manager found.\n' +
      'This installer supports Amazon Linux 2023 (dnf) and Amazon Linux 2 (yum).'
    );
  }

  console.log(`Detected package manager: ${packageManager}`);

  // Remove any existing Go installations
  console.log('Removing any existing Go installations...');
  await shell.exec('sudo rm -rf /usr/local/go 2>/dev/null || true');

  // Remove repository-installed Go if present
  await shell.exec(`sudo ${packageManager} remove -y golang 2>/dev/null || true`);

  // Install required utilities
  console.log('Installing required utilities (wget, curl, tar)...');
  const installResult = await shell.exec(
    `sudo ${packageManager} install -y wget curl tar`
  );
  if (installResult.code !== 0) {
    console.log('Warning: Could not install utilities, they may already exist.');
  }

  // Fetch the latest Go version
  console.log('Fetching latest Go version...');
  const goVersion = await fetchLatestGoVersion();
  if (!goVersion) {
    throw new Error(
      'Could not determine the latest Go version.\n' +
      'Please check your internet connection and try again.'
    );
  }
  console.log(`Latest version: ${goVersion}`);

  // Download and install Go
  await downloadAndInstallGo(goVersion, 'linux-amd64');

  // Configure environment (Amazon Linux uses .bashrc)
  await configureGoEnvironment('~/.bashrc');

  // Source the profile
  await shell.exec('source ~/.bashrc 2>/dev/null || true');

  // Verify installation
  const verifyResult = await shell.exec('/usr/local/go/bin/go version');
  if (verifyResult.code !== 0) {
    throw new Error(
      'Installation appeared to complete but Go was not found.\n\n' +
      'Please try:\n' +
      '  1. Log out and log back in, or run: source ~/.bashrc\n' +
      '  2. Verify installation: /usr/local/go/bin/go version'
    );
  }

  const versionMatch = verifyResult.stdout.match(/go version go([\d.]+)/);
  const installedVersion = versionMatch ? versionMatch[1] : goVersion;

  console.log(`Go ${installedVersion} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To use Go in your current terminal session:');
  console.log('  source ~/.bashrc');
  console.log('');
  console.log('Or log out and log back in for changes to take effect.');
}

/**
 * Install Go on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later, or Windows 11
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * Chocolatey installs Go using the official MSI installer with silent flags.
 * After installation, the PATH is updated automatically.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Go is already installed...');

  // Check if Go is already installed
  const existingVersion = await getGoVersion();
  if (existingVersion) {
    console.log(`Go ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if Go package is installed via Chocolatey
  const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (packageInstalled) {
    console.log('Go is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('NOTE: If go commands are not working, close and reopen your terminal');
    console.log('or run: refreshenv');
    return;
  }

  // Verify Chocolatey is available
  if (!choco.isInstalled()) {
    throw new Error(
      'Chocolatey is not installed. Please install Chocolatey first:\n\n' +
      'Run the following in an Administrator PowerShell:\n' +
      '  Set-ExecutionPolicy Bypass -Scope Process -Force; ' +
      '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; ' +
      'iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))\n\n' +
      'Then retry installing Go.'
    );
  }

  console.log('Installing Go via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install Go
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Go via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Try manual installation: choco install golang -y --force`
    );
  }

  console.log('Go installed successfully.');
  console.log('');
  console.log('IMPORTANT: Close and reopen your terminal for PATH changes to take effect.');
  console.log('Or in PowerShell, run: refreshenv');
  console.log('');
  console.log('Then verify with: go version');
  console.log('');
  console.log('To use Go tools installed via "go install", ensure this is in your PATH:');
  console.log('  %USERPROFILE%\\go\\bin');
}

/**
 * Install Go on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or later, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 *
 * This function installs Go directly within WSL using the same method
 * as native Ubuntu. The installation is independent of any Windows
 * Go installation.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Installing Go directly within WSL...');
  console.log('');

  // Check if Go is already installed
  const existingVersion = await getGoVersion();
  if (existingVersion) {
    console.log(`Go ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Remove any existing Go installations
  await removeExistingGoInstallations();

  // Install required utilities
  await installRequiredUtilities();

  // Fetch the latest Go version
  console.log('Fetching latest Go version...');
  const goVersion = await fetchLatestGoVersion();
  if (!goVersion) {
    throw new Error(
      'Could not determine the latest Go version.\n' +
      'Please check your internet connection and try again.'
    );
  }
  console.log(`Latest version: ${goVersion}`);

  // Download and install Go
  await downloadAndInstallGo(goVersion, 'linux-amd64');

  // Configure environment (WSL Ubuntu uses .bashrc)
  await configureGoEnvironment('~/.bashrc');

  // Source the profile
  await shell.exec('source ~/.bashrc 2>/dev/null || true');

  // Verify installation
  const verifyResult = await shell.exec('/usr/local/go/bin/go version');
  if (verifyResult.code !== 0) {
    throw new Error(
      'Installation appeared to complete but Go was not found.\n\n' +
      'Please try:\n' +
      '  1. Close and reopen your WSL terminal, or run: source ~/.bashrc\n' +
      '  2. Verify installation: /usr/local/go/bin/go version'
    );
  }

  const versionMatch = verifyResult.stdout.match(/go version go([\d.]+)/);
  const installedVersion = versionMatch ? versionMatch[1] : goVersion;

  console.log(`Go ${installedVersion} installed successfully.`);
  console.log('');
  console.log('IMPORTANT for WSL users:');
  console.log('');
  console.log('1. To use Go in your current terminal session:');
  console.log('   source ~/.bashrc');
  console.log('');
  console.log('2. For best performance, keep your Go code on the Linux filesystem');
  console.log('   (e.g., ~/projects) rather than /mnt/c/ (Windows filesystem).');
  console.log('');
  console.log('3. Go binaries installed in WSL are Linux executables and cannot');
  console.log('   run directly from Windows.');
}

/**
 * Install Go from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Go on the
 * Windows host using Chocolatey via PowerShell interop.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey package manager installed on Windows
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Go on the Windows host...');
  console.log('');

  // Check if Go is already available
  const existingVersion = await getGoVersion();
  if (existingVersion) {
    console.log(`Go ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Install via PowerShell using Chocolatey
  console.log('Installing Go via Chocolatey...');

  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install golang -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Go.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell:\n` +
      `     choco install golang -y`
    );
  }

  console.log('Go installed successfully.');
  console.log('');
  console.log('IMPORTANT: Close and reopen Git Bash for PATH changes to take effect.');
  console.log('');
  console.log('Then verify with: go version');
  console.log('');
  console.log('If go is still not found, you may need to add it to your Git Bash PATH:');
  console.log('  echo \'export PATH="$PATH:/c/Program Files/Go/bin"\' >> ~/.bashrc');
  console.log('  echo \'export PATH="$PATH:$HOME/go/bin"\' >> ~/.bashrc');
  console.log('  source ~/.bashrc');
}

/**
 * Check if Go is currently installed on the system.
 *
 * This function checks for Go installation across all supported platforms:
 * - macOS: Checks for Go via Homebrew formula or go command
 * - Windows: Checks for Go via Chocolatey or go command
 * - Linux/Git Bash: Checks if go command exists in PATH
 *
 * @returns {Promise<boolean>} True if Go is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    // Check if Go formula is installed via Homebrew
    const formulaInstalled = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
    if (formulaInstalled) {
      return true;
    }
    // Also check if go command exists
    return isGoCommandAvailable();
  }

  if (platform.type === 'windows') {
    // Check if Go package is installed via Chocolatey
    const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
    if (packageInstalled) {
      return true;
    }
    // Also check if go command exists
    return isGoCommandAvailable();
  }

  // Linux, WSL, and Git Bash: Check if go command exists
  return isGoCommandAvailable();
}

/**
 * Check if this installer is supported on the current platform.
 * Go is supported on all major platforms.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Homebrew formula
 * - Ubuntu/Debian: Official tarball from go.dev
 * - Raspberry Pi OS: Official ARM tarball from go.dev
 * - Amazon Linux/RHEL: Official tarball from go.dev
 * - Windows: Chocolatey package
 * - WSL (Ubuntu): Official tarball within WSL
 * - Git Bash: Chocolatey on Windows host
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases (e.g., debian maps to ubuntu installer)
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
    console.log(`Go is not available for ${platform.type}.`);
    return;
  }

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
  install_gitbash
};

// Allow direct execution: node go.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
