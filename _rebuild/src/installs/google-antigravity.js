#!/usr/bin/env node

/**
 * @fileoverview Install Google Antigravity - AI-powered IDE developed by Google.
 * @module installs/google-antigravity
 *
 * Google Antigravity is an AI-powered integrated development environment (IDE)
 * developed by Google, announced on November 18, 2025 alongside Gemini 3. It
 * is a heavily modified fork of Visual Studio Code that provides autonomous
 * AI agents powered by Gemini 3 Pro, Gemini 3 Deep Think, and Gemini 3 Flash.
 *
 * Key features:
 * - Agent Manager View: Spawn multiple AI agents to work on tasks simultaneously
 * - Browser Orchestration: Headless Chrome instance for automatic web testing
 * - Artifacts System: Agents generate task lists, plans, screenshots, and recordings
 * - 1 Million Token Context Window: Understand entire codebases
 * - MCP Integration: Connect to databases, APIs, and external tools
 *
 * This installer provides:
 * - macOS: Antigravity via Homebrew cask
 * - Ubuntu/Debian: Antigravity via Google's APT repository
 * - Raspberry Pi OS: Antigravity via Google's APT repository (ARM64 only)
 * - Amazon Linux/RHEL: Antigravity via Google's RPM repository
 * - Windows: Antigravity via winget (preferred) or Chocolatey
 * - WSL (Ubuntu): Installs on Windows host via winget
 * - Git Bash: Installs on Windows host via winget
 *
 * IMPORTANT PLATFORM NOTES:
 * - All platforms require 64-bit architecture
 * - Raspberry Pi OS requires 64-bit (ARM64/aarch64) - 32-bit is not supported
 * - A Google Account is required to activate Gemini 3 Pro features
 * - At least 8 GB RAM recommended (16 GB for optimal performance)
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const winget = require('../utils/windows/winget');
const macosApps = require('../utils/macos/apps');

/**
 * Indicates whether this installer requires a desktop environment.
 * Google Antigravity is a GUI application and requires a display.
 * @type {boolean}
 */
const REQUIRES_DESKTOP = true;

/**
 * The name of the Antigravity application bundle on macOS.
 * Used to check if Antigravity is already installed in /Applications.
 */
const MACOS_APP_NAME = 'Antigravity';

/**
 * The Homebrew cask name for Google Antigravity on macOS.
 * This installs the full Antigravity application to /Applications.
 */
const HOMEBREW_CASK_NAME = 'antigravity';

/**
 * The winget package ID for Google Antigravity on Windows.
 * This is the official Antigravity package from Google.
 */
const WINGET_PACKAGE_ID = 'Google.Antigravity';

/**
 * The Chocolatey package name for Google Antigravity on Windows.
 * This is an alternative to winget for Windows installations.
 */
const CHOCO_PACKAGE_NAME = 'antigravity';

/**
 * The APT package name for Google Antigravity on Debian-based systems.
 * This is the package name used in Google's repository.
 */
const APT_PACKAGE_NAME = 'antigravity';

/**
 * Google's GPG key URL for package verification.
 * This key is used to verify the authenticity of Antigravity packages.
 */
const GOOGLE_GPG_KEY_URL = 'https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg';

/**
 * Google's APT repository URL for Antigravity.
 * This repository contains the Antigravity packages for Debian-based systems.
 */
const GOOGLE_APT_REPO_URL = 'https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/';

/**
 * Google's RPM repository URL for Antigravity.
 * This repository contains the Antigravity packages for RHEL-based systems.
 */
const GOOGLE_RPM_REPO_URL = 'https://us-central1-yum.pkg.dev/projects/antigravity-auto-updater-dev/antigravity-rpm';

/**
 * Check if the Antigravity CLI command is available in PATH.
 *
 * Antigravity provides two command names: 'antigravity' and 'agy' (short alias).
 * This function checks for either command.
 *
 * @returns {boolean} True if the antigravity or agy command is available
 */
function isAntigravityCommandAvailable() {
  return shell.commandExists('antigravity') || shell.commandExists('agy');
}

/**
 * Check if Antigravity is installed and get the version.
 *
 * Executes 'antigravity --version' to verify Antigravity is properly installed
 * and operational. Returns the version string if successful.
 *
 * @returns {Promise<string|null>} Antigravity version string, or null if not installed
 */
async function getAntigravityVersion() {
  // Try the full command name first, then the short alias
  const commands = ['antigravity', 'agy'];

  for (const cmd of commands) {
    if (shell.commandExists(cmd)) {
      const result = await shell.exec(`${cmd} --version`);
      if (result.code === 0 && result.stdout) {
        // Output format: First line is typically the version
        const lines = result.stdout.trim().split('\n');
        return lines[0] || null;
      }
    }
  }

  return null;
}

/**
 * Set up Google's APT repository for Antigravity on Ubuntu/Debian.
 *
 * This function:
 * 1. Installs prerequisites (curl, gpg, apt-transport-https)
 * 2. Creates the keyrings directory if it doesn't exist
 * 3. Imports Google's GPG key for package verification
 * 4. Adds Google's Antigravity repository to APT sources
 * 5. Updates the package cache
 *
 * @param {boolean} [isArm64=false] - Whether to specify ARM64 architecture
 * @returns {Promise<void>}
 * @throws {Error} If any step fails
 */
async function setupGoogleAptRepository(isArm64 = false) {
  console.log('Setting up Google APT repository for Antigravity...');

  // Install prerequisites needed to download and verify the repository
  console.log('Installing prerequisites (curl, gpg, apt-transport-https)...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl gpg apt-transport-https'
  );
  if (prereqResult.code !== 0) {
    throw new Error(`Failed to install prerequisites: ${prereqResult.stderr}`);
  }

  // Create the keyrings directory if it doesn't exist
  console.log('Creating keyrings directory...');
  const mkdirResult = await shell.exec('sudo mkdir -p /etc/apt/keyrings');
  if (mkdirResult.code !== 0) {
    throw new Error(`Failed to create keyrings directory: ${mkdirResult.stderr}`);
  }

  // Download and import Google's GPG key
  console.log('Importing Google GPG key...');
  const gpgResult = await shell.exec(
    `curl -fsSL ${GOOGLE_GPG_KEY_URL} | sudo gpg --dearmor -o /etc/apt/keyrings/antigravity-repo-key.gpg`
  );
  if (gpgResult.code !== 0) {
    throw new Error(`Failed to import Google GPG key: ${gpgResult.stderr}`);
  }

  // Set proper permissions on the keyring file
  await shell.exec('sudo chmod 644 /etc/apt/keyrings/antigravity-repo-key.gpg');

  // Add Google's APT repository
  // For ARM64 systems (Raspberry Pi), specify the architecture explicitly
  console.log('Adding Google Antigravity repository...');
  const archSpec = isArm64 ? ' arch=arm64' : '';
  const repoEntry = `deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg${archSpec}] ${GOOGLE_APT_REPO_URL} antigravity-debian main`;

  const repoResult = await shell.exec(
    `echo "${repoEntry}" | sudo tee /etc/apt/sources.list.d/antigravity.list > /dev/null`
  );
  if (repoResult.code !== 0) {
    throw new Error(`Failed to add Google repository: ${repoResult.stderr}`);
  }

  // Update package cache to include the new repository
  console.log('Updating package cache...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package cache: ${updateResult.stderr}`);
  }

  console.log('Google APT repository configured successfully.');
}

/**
 * Set up Google's RPM repository for Antigravity on Amazon Linux/RHEL.
 *
 * This function creates the repository configuration file that points
 * to Google's RPM repository for Antigravity packages.
 *
 * @returns {Promise<void>}
 * @throws {Error} If any step fails
 */
async function setupGoogleRpmRepository() {
  console.log('Setting up Google RPM repository for Antigravity...');

  // Create the repository configuration file
  // Note: gpgcheck is disabled as per the installation documentation
  const repoContent = `[antigravity-rpm]
name=Antigravity RPM Repository
baseurl=${GOOGLE_RPM_REPO_URL}
enabled=1
gpgcheck=0`;

  console.log('Adding Google Antigravity repository...');
  const repoResult = await shell.exec(
    `sudo tee /etc/yum.repos.d/antigravity.repo << 'EOF' > /dev/null
${repoContent}
EOF`
  );
  if (repoResult.code !== 0) {
    throw new Error(`Failed to add Google repository: ${repoResult.stderr}`);
  }

  console.log('Google RPM repository configured successfully.');
}

/**
 * Install Google Antigravity on macOS using Homebrew cask.
 *
 * Prerequisites:
 * - macOS 11 (Big Sur) or later
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor (both x64 and ARM64 supported)
 *
 * This function installs Antigravity as a macOS application via Homebrew cask.
 * After installation, Antigravity is available in /Applications/Antigravity.app.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if Google Antigravity is already installed...');

  // Check if Antigravity app bundle exists in /Applications
  const isAppInstalled = macosApps.isAppInstalled(MACOS_APP_NAME);
  if (isAppInstalled) {
    const version = await getAntigravityVersion();
    console.log(`Google Antigravity ${version || 'unknown version'} is already installed, skipping...`);
    return;
  }

  // Also check if Antigravity is installed via Homebrew cask
  const isCaskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (isCaskInstalled) {
    console.log('Google Antigravity is already installed via Homebrew, skipping...');
    return;
  }

  // Verify Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Install Antigravity using Homebrew cask
  console.log('Installing Google Antigravity via Homebrew...');
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    console.log('Failed to install Google Antigravity via Homebrew.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "brew update && brew cleanup" and retry');
    console.log('  2. If the cask is unavailable, try updating Homebrew: brew update');
    console.log('  3. Try manual installation: brew install --cask antigravity');
    return;
  }

  // Verify the installation succeeded
  const verified = macosApps.isAppInstalled(MACOS_APP_NAME);
  if (!verified) {
    console.log('Installation may have failed: Antigravity.app not found after install.');
    return;
  }

  console.log('Google Antigravity installed successfully via Homebrew.');
  console.log('');
  console.log('The application is available at /Applications/Antigravity.app');
  console.log('');
  console.log('NOTE: If "antigravity" or "agy" command is not found, you can add it to PATH by:');
  console.log('  1. Launch Antigravity');
  console.log('  2. Open Command Palette (Cmd+Shift+P)');
  console.log('  3. Run "Shell Command: Install \'antigravity\' command in PATH"');
  console.log('');
  console.log('After first launch, sign in with your Google Account to activate Gemini 3 Pro features.');
}

/**
 * Install Google Antigravity on Ubuntu/Debian using APT with Google's repository.
 *
 * Prerequisites:
 * - Ubuntu 20.04 (Focal) or later, or Debian 10 (Buster) or later (64-bit)
 * - glibc >= 2.28 and glibcxx >= 3.4.25 (met by Ubuntu 20.04+, Debian 10+)
 * - sudo privileges
 * - Active internet connection
 *
 * This function adds Google's APT repository and installs Antigravity.
 * After installation, Antigravity is available via the 'antigravity' or 'agy' command.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if Google Antigravity is already installed...');

  // Check if Antigravity command is already available
  if (isAntigravityCommandAvailable()) {
    const version = await getAntigravityVersion();
    console.log(`Google Antigravity ${version || 'unknown version'} is already installed, skipping...`);
    return;
  }

  // Set up Google's APT repository
  try {
    await setupGoogleAptRepository();
  } catch (error) {
    console.log(`Failed to set up Google repository: ${error.message}`);
    return;
  }

  // Install Antigravity from the Google repository
  console.log('Installing Google Antigravity via APT...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Google Antigravity via APT.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "sudo apt-get update" and retry');
    console.log('  2. Check if the Google repository was added:');
    console.log('     cat /etc/apt/sources.list.d/antigravity.list');
    console.log('  3. Verify the GPG key exists: ls -la /etc/apt/keyrings/antigravity-repo-key.gpg');
    return;
  }

  // Verify the installation succeeded
  const version = await getAntigravityVersion();
  if (!version) {
    console.log('Installation may have failed: antigravity command not found after install.');
    return;
  }

  console.log('Google Antigravity installed successfully.');
  console.log('');
  console.log(`Antigravity version: ${version}`);
  console.log('');
  console.log('Launch Antigravity with: antigravity (or agy)');
  console.log('');
  console.log('After first launch, sign in with your Google Account to activate Gemini 3 Pro features.');
}

/**
 * Install Google Antigravity on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or later, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - Antigravity installed on Windows host (this function handles the installation)
 *
 * IMPORTANT: Antigravity runs on Windows and connects to WSL using remote
 * development capabilities. You do not install Antigravity inside WSL itself.
 * This function installs Antigravity on the Windows host via winget.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Antigravity should be installed on Windows and connected to WSL');
  console.log('using remote development capabilities.');
  console.log('');

  // Check if Antigravity is already installed on Windows host
  const checkResult = await shell.exec(
    `winget.exe list --exact --id "${WINGET_PACKAGE_ID}" 2>/dev/null`
  );

  if (checkResult.code === 0 && checkResult.stdout.includes(WINGET_PACKAGE_ID)) {
    console.log('Google Antigravity is already installed on Windows.');
    console.log('');
    console.log('To connect to WSL from Antigravity:');
    console.log('  1. Launch Antigravity on Windows');
    console.log('  2. Click the green remote icon in the bottom-left corner');
    console.log('  3. Select "Connect to WSL" and choose your distribution');
    return;
  }

  // Verify winget is accessible from WSL
  const wingetExists = shell.commandExists('winget.exe');
  if (!wingetExists) {
    console.log('winget is required to install Antigravity from WSL.');
    console.log('winget should be available if you are running Windows 10 1809+ or Windows 11.');
    console.log('');
    console.log('Alternatively, install Antigravity directly from Windows PowerShell:');
    console.log('  winget install --id Google.Antigravity --silent --accept-package-agreements --accept-source-agreements');
    return;
  }

  console.log('Installing Google Antigravity on Windows host via winget...');

  // Install Antigravity on Windows using winget.exe from within WSL
  const installResult = await shell.exec(
    `winget.exe install --id "${WINGET_PACKAGE_ID}" --silent --accept-package-agreements --accept-source-agreements`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Google Antigravity.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  console.log('Google Antigravity installed successfully on Windows.');
  console.log('');
  console.log('To use Antigravity with WSL:');
  console.log('  1. Open Antigravity on Windows');
  console.log('  2. Click the green remote icon in the bottom-left corner');
  console.log('  3. Select "Connect to WSL" and choose your distribution');
  console.log('');
  console.log('After first launch, sign in with your Google Account to activate Gemini 3 Pro features.');
}

/**
 * Install Google Antigravity on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit) - ARM64/aarch64 architecture REQUIRED
 * - Raspberry Pi 4 or later with 4 GB or more RAM (8 GB strongly recommended)
 * - Raspberry Pi OS Bullseye (11) or later
 * - sudo privileges
 * - Active internet connection
 *
 * CRITICAL: Antigravity requires a 64-bit operating system. 32-bit Raspberry Pi OS
 * (armv7l architecture) is NOT supported.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if Google Antigravity is already installed...');

  // Check if Antigravity command is already available
  if (isAntigravityCommandAvailable()) {
    const version = await getAntigravityVersion();
    console.log(`Google Antigravity ${version || 'unknown version'} is already installed, skipping...`);
    return;
  }

  // Critical architecture check - Antigravity requires 64-bit ARM
  const arch = os.getArch();
  console.log(`Detected architecture: ${arch}`);

  if (arch !== 'arm64') {
    console.log('');
    console.log('Google Antigravity requires 64-bit Raspberry Pi OS (ARM64/aarch64).');
    console.log(`Your system architecture is ${arch}.`);
    console.log('');
    console.log('Please install 64-bit Raspberry Pi OS from:');
    console.log('  https://www.raspberrypi.com/software/');
    return;
  }

  // Set up Google's APT repository with ARM64 architecture specified
  try {
    await setupGoogleAptRepository(true); // true = ARM64
  } catch (error) {
    console.log(`Failed to set up Google repository: ${error.message}`);
    return;
  }

  // Install Antigravity from the Google repository
  console.log('Installing Google Antigravity via APT...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Google Antigravity via APT.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you are running 64-bit Raspberry Pi OS (uname -m should show aarch64)');
    console.log('  2. Run "sudo apt-get update" and retry');
    console.log('  3. Check if the Google repository was added:');
    console.log('     cat /etc/apt/sources.list.d/antigravity.list');
    return;
  }

  // Verify the installation succeeded
  const version = await getAntigravityVersion();
  if (!version) {
    console.log('Installation may have failed: antigravity command not found after install.');
    return;
  }

  console.log('Google Antigravity installed successfully.');
  console.log('');
  console.log(`Antigravity version: ${version}`);
  console.log('');
  console.log('NOTE: Raspberry Pi has limited resources compared to desktop systems.');
  console.log('For best performance:');
  console.log('  - Ensure you have at least 4 GB RAM (8 GB recommended)');
  console.log('  - Close other applications when using AI features');
  console.log('  - Consider increasing swap if you experience memory issues');
  console.log('');
  console.log('Launch Antigravity with: antigravity (or agy)');
  console.log('');
  console.log('After first launch, sign in with your Google Account to activate Gemini 3 Pro features.');
}

/**
 * Install Google Antigravity on Amazon Linux/RHEL using DNF or YUM.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023), RHEL 8+, Fedora 36+, or CentOS Stream 8+
 * - glibc >= 2.28 (Amazon Linux 2023, RHEL 8+, Fedora 36+ meet this requirement)
 * - sudo privileges
 * - Active internet connection
 * - Desktop environment (Antigravity is a GUI application)
 *
 * This function automatically detects whether the system uses DNF (AL2023, RHEL 8+)
 * or YUM (older systems) and uses the appropriate package manager.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if Google Antigravity is already installed...');

  // Check if Antigravity command is already available
  if (isAntigravityCommandAvailable()) {
    const version = await getAntigravityVersion();
    console.log(`Google Antigravity ${version || 'unknown version'} is already installed, skipping...`);
    return;
  }

  // Detect package manager (dnf for AL2023/RHEL8+, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    console.log('Neither dnf nor yum package manager found.');
    console.log('This installer supports Amazon Linux 2023 (dnf), Amazon Linux 2 (yum), RHEL 8+, and Fedora.');
    return;
  }

  console.log(`Detected package manager: ${packageManager}`);

  // Set up Google's RPM repository
  try {
    await setupGoogleRpmRepository();
  } catch (error) {
    console.log(`Failed to set up Google repository: ${error.message}`);
    return;
  }

  // Update package cache
  console.log('Updating package cache...');
  await shell.exec(`sudo ${packageManager} makecache`);

  // Install Antigravity
  console.log(`Installing Google Antigravity via ${packageManager}...`);
  const installResult = await shell.exec(
    `sudo ${packageManager} install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    console.log(`Failed to install Google Antigravity via ${packageManager}.`);
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Verify the repository was added correctly:');
    console.log('     cat /etc/yum.repos.d/antigravity.repo');
    console.log(`  2. Try: sudo ${packageManager} install -y antigravity`);
    console.log('  3. Ensure you have a desktop environment installed for GUI applications');
    return;
  }

  // Verify the installation succeeded
  const version = await getAntigravityVersion();
  if (!version) {
    console.log('Installation may have failed: antigravity command not found after install.');
    return;
  }

  console.log('Google Antigravity installed successfully.');
  console.log('');
  console.log(`Antigravity version: ${version}`);
  console.log('');
  console.log('NOTE: Antigravity is a GUI application and requires a desktop environment.');
  console.log('If you are on a headless server, you can use X11 forwarding:');
  console.log('  ssh -X user@server');
  console.log('  antigravity');
  console.log('');
  console.log('Launch Antigravity with: antigravity (or agy)');
  console.log('');
  console.log('After first launch, sign in with your Google Account to activate Gemini 3 Pro features.');
}

/**
 * Install Google Antigravity on Windows using winget (preferred) or Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later (64-bit), or Windows 11
 * - winget package manager (pre-installed on Windows 10 1809+ and Windows 11)
 * - Administrator privileges recommended
 * - Active internet connection
 *
 * This function uses winget to install Antigravity. Winget is the preferred
 * package manager as it is built into modern Windows versions.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if Google Antigravity is already installed...');

  // Check if Antigravity is already installed via winget
  const isInstalledViaWinget = await winget.isPackageInstalled(WINGET_PACKAGE_ID);
  if (isInstalledViaWinget) {
    const version = await getAntigravityVersion();
    console.log(`Google Antigravity ${version || 'unknown version'} is already installed via winget, skipping...`);
    return;
  }

  // Also check if the antigravity command exists (may have been installed by other means)
  if (isAntigravityCommandAvailable()) {
    const version = await getAntigravityVersion();
    console.log(`Google Antigravity ${version || 'unknown version'} is already installed, skipping...`);
    console.log('');
    console.log('Note: Antigravity was not installed via winget.');
    console.log('If you want to manage it with winget, first uninstall the existing version.');
    return;
  }

  // Verify winget is available
  if (!winget.isInstalled()) {
    console.log('winget is required to install Google Antigravity on Windows.');
    console.log('winget is included with Windows 10 version 1809 and later.');
    console.log('');
    console.log('You can install it from the Microsoft Store (App Installer):');
    console.log('  start ms-windows-store://pdp/?productid=9NBLGGH4NNS1');
    console.log('');
    console.log('Alternatively, you can use Chocolatey if installed:');
    console.log('  choco install antigravity -y');
    return;
  }

  console.log('Installing Google Antigravity via winget...');
  console.log('This may take a few minutes...');

  // Install Antigravity using winget with silent flags and auto-accept agreements
  const result = await winget.install(WINGET_PACKAGE_ID);

  if (!result.success) {
    console.log('Failed to install Google Antigravity via winget.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you are running as Administrator');
    console.log('  2. Try: winget install --id Google.Antigravity --silent --accept-package-agreements --accept-source-agreements');
    console.log('  3. Alternatively, use Chocolatey: choco install antigravity -y');
    return;
  }

  console.log('Google Antigravity installed successfully via winget.');
  console.log('');
  console.log('IMPORTANT: Close and reopen your terminal for PATH changes to take effect.');
  console.log('');
  console.log('You can launch Antigravity from:');
  console.log('  - The Start Menu (search for "Antigravity")');
  console.log('  - The command line: antigravity (or agy)');
  console.log('');
  console.log('After first launch, sign in with your Google Account to activate Gemini 3 Pro features.');
}

/**
 * Install Google Antigravity from Git Bash on Windows.
 *
 * Git Bash runs within Windows and inherits the Windows PATH, so once
 * Antigravity is installed on Windows, the 'antigravity' command is
 * automatically available in Git Bash.
 *
 * This function installs Antigravity on the Windows host using winget
 * via the winget.exe command available from Git Bash.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - winget available (pre-installed on Windows 10 1809+ and Windows 11)
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('');

  // Check if Antigravity is already installed
  // Try winget first (works in Git Bash as winget.exe)
  const checkResult = await shell.exec(
    `winget.exe list --exact --id "${WINGET_PACKAGE_ID}" 2>/dev/null`
  );

  if (checkResult.code === 0 && checkResult.stdout.includes(WINGET_PACKAGE_ID)) {
    console.log('Google Antigravity is already installed.');
    return;
  }

  // Also check for the command directly
  if (isAntigravityCommandAvailable()) {
    const version = await getAntigravityVersion();
    console.log(`Google Antigravity ${version || 'unknown version'} is already installed, skipping...`);
    return;
  }

  // Verify winget is accessible from Git Bash
  const wingetExists = shell.commandExists('winget.exe');
  if (!wingetExists) {
    console.log('winget is required to install Google Antigravity.');
    console.log('winget should be available if you are running Windows 10 1809+ or Windows 11.');
    console.log('');
    console.log('Alternatively, you can use Chocolatey if installed:');
    console.log('  choco.exe install antigravity -y');
    return;
  }

  console.log('Installing Google Antigravity via winget...');
  console.log('This may take a few minutes...');

  // Install Antigravity using winget.exe
  const installResult = await shell.exec(
    `winget.exe install --id "${WINGET_PACKAGE_ID}" --silent --accept-package-agreements --accept-source-agreements`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Google Antigravity.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run Git Bash as Administrator and retry');
    console.log('  2. Try installing directly from PowerShell:');
    console.log('     winget install --id Google.Antigravity --silent --accept-package-agreements --accept-source-agreements');
    return;
  }

  console.log('Google Antigravity installed successfully.');
  console.log('');
  console.log('IMPORTANT: Close and reopen Git Bash for PATH changes to take effect.');
  console.log('');
  console.log('Git Bash tips:');
  console.log('  - Launch Antigravity: antigravity (or agy)');
  console.log('  - For interactive features, you may need: winpty antigravity');
  console.log('');
  console.log('After first launch, sign in with your Google Account to activate Gemini 3 Pro features.');
}

/**
 * Check if Google Antigravity is installed on the current system.
 *
 * This function performs platform-specific checks to determine if Antigravity
 * is already installed:
 * - macOS: Checks for Antigravity.app in /Applications
 * - Windows: Checks for winget package
 * - WSL/Git Bash: Checks for winget.exe package on Windows host
 * - Ubuntu/Debian/Raspberry Pi/Amazon Linux: Checks for antigravity command
 *
 * @returns {Promise<boolean>} True if Antigravity is installed
 */
async function isInstalled() {
  const platform = os.detect();

  // macOS: Check for Antigravity.app
  if (platform.type === 'macos') {
    return macosApps.isAppInstalled(MACOS_APP_NAME);
  }

  // Windows: Check via winget
  if (platform.type === 'windows') {
    return await winget.isPackageInstalled(WINGET_PACKAGE_ID);
  }

  // WSL and Git Bash: Check via winget.exe on Windows host
  if (platform.type === 'wsl' || platform.type === 'gitbash') {
    const checkResult = await shell.exec(
      `winget.exe list --exact --id "${WINGET_PACKAGE_ID}" 2>/dev/null`
    );
    return checkResult.code === 0 && checkResult.stdout.includes(WINGET_PACKAGE_ID);
  }

  // Ubuntu/Debian/Raspberry Pi/Amazon Linux: Check for antigravity command
  if (['ubuntu', 'debian', 'raspbian', 'amazon_linux', 'rhel', 'fedora'].includes(platform.type)) {
    return isAntigravityCommandAvailable();
  }

  return false;
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Google Antigravity is supported on all major platforms but requires a desktop
 * environment since it is a GUI application. On headless servers or containers
 * without a display, this function returns false.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();

  // First check if the platform is supported
  const supportedPlatforms = ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel', 'windows', 'gitbash'];
  if (!supportedPlatforms.includes(platform.type)) {
    return false;
  }

  // This installer requires a desktop environment
  if (REQUIRES_DESKTOP && !os.isDesktopAvailable()) {
    return false;
  }

  return true;
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. Google Antigravity is
 * supported on all major platforms:
 *
 * - macOS: Homebrew cask
 * - Ubuntu/Debian: APT with Google repository
 * - Ubuntu on WSL: winget on Windows host
 * - Raspberry Pi OS: APT with Google repository (ARM64 only)
 * - Amazon Linux/RHEL: DNF/YUM with Google repository
 * - Windows: winget (preferred)
 * - Git Bash: winget on Windows host
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
  // Do NOT throw an error - per project requirements
  if (!installer) {
    console.log(`Google Antigravity is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
  await installer();
}

// Export all functions for use as a module and for testing
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
  install_gitbash,
};

// Allow direct execution: node google-antigravity.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
