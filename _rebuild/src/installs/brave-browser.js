#!/usr/bin/env node

/**
 * @fileoverview Install Brave Browser - a privacy-focused web browser.
 * @module installs/brave-browser
 *
 * Brave is a free, open-source web browser developed by Brave Software, Inc.
 * Built on the Chromium web browser engine, Brave focuses on privacy and speed
 * by blocking ads and website trackers by default. Key features include:
 * - Built-in ad blocking
 * - HTTPS Everywhere integration
 * - Fingerprinting protection
 * - Optional Brave Rewards program for earning cryptocurrency (BAT)
 *
 * This installer provides:
 * - Brave Browser via Homebrew cask on macOS
 * - Brave Browser via official APT repository on Ubuntu/Debian
 * - Brave Browser via official DNF/YUM repository on Amazon Linux/RHEL/Fedora
 * - Brave Browser via Chocolatey on Windows
 * - Brave Browser within WSL (same as Ubuntu installation)
 * - Brave Browser on Windows host from Git Bash
 *
 * IMPORTANT PLATFORM NOTES:
 * - Raspberry Pi OS: Brave Browser supports both x86_64 and ARM64 architectures.
 * - All platforms require a desktop environment since Brave is a GUI application.
 * - WSL requires WSLg (Windows 11 / Windows 10 21H2+) for GUI support.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const choco = require('../utils/windows/choco');
const apt = require('../utils/ubuntu/apt');

/**
 * Indicates whether this installer requires a desktop environment.
 * Brave Browser is a GUI web browser and requires a display.
 * @type {boolean}
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for Brave Browser on macOS.
 * Using the cask (not formula) because Brave is a GUI application.
 */
const HOMEBREW_CASK_NAME = 'brave-browser';

/**
 * The Chocolatey package name for Brave Browser on Windows.
 */
const CHOCO_PACKAGE_NAME = 'brave';

/**
 * The APT package name for Brave Browser on Debian-based systems.
 */
const APT_PACKAGE_NAME = 'brave-browser';

/**
 * Path to Brave Browser application on macOS.
 * Used to verify installation succeeded.
 */
const MACOS_APP_PATH = '/Applications/Brave Browser.app';

/**
 * Path to Brave Browser executable on Windows (system-wide installation).
 * Used to verify installation and check version.
 */
const WINDOWS_BRAVE_PATH_SYSTEM = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';

/**
 * Path to Brave Browser executable on Windows (per-user installation).
 * Chocolatey sometimes installs to the user's AppData folder.
 */
const WINDOWS_BRAVE_PATH_USER_APPDATA = process.env.LOCALAPPDATA
  ? `${process.env.LOCALAPPDATA}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`
  : null;

/**
 * URL for the Brave Browser GPG keyring on Debian/Ubuntu.
 * Used to verify package authenticity.
 */
const BRAVE_GPG_KEYRING_URL = 'https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg';

/**
 * URL for the Brave Browser APT sources file on Debian/Ubuntu.
 * This modern DEB822 format file contains repository configuration.
 */
const BRAVE_APT_SOURCES_URL = 'https://brave-browser-apt-release.s3.brave.com/brave-browser.sources';

/**
 * URL for the Brave Browser RPM repository file.
 * Used on Fedora, RHEL, and Amazon Linux.
 */
const BRAVE_RPM_REPO_URL = 'https://brave-browser-rpm-release.s3.brave.com/brave-browser.repo';

/**
 * URL for the Brave Browser GPG key for RPM packages.
 * Used to verify package authenticity on Fedora/RHEL/Amazon Linux.
 */
const BRAVE_RPM_GPG_KEY_URL = 'https://brave-browser-rpm-release.s3.brave.com/brave-core.asc';

/**
 * Check if Brave Browser is installed on macOS by verifying the app bundle exists.
 *
 * On macOS, GUI applications are typically installed as .app bundles in /Applications.
 * We check for the bundle's existence rather than relying on PATH because Brave
 * is a GUI application that may not add itself to the shell PATH.
 *
 * @returns {boolean} True if Brave Browser.app exists in /Applications, false otherwise
 */
function isBraveInstalledMacOS() {
  const fs = require('fs');
  return fs.existsSync(MACOS_APP_PATH);
}

/**
 * Get the installed version of Brave Browser on macOS.
 *
 * Executes the Brave binary within the app bundle with --version flag.
 * The output format is: "Brave 1.86.139 Chromium: 128.0.6613.137"
 *
 * @returns {Promise<string|null>} Version string (e.g., "1.86.139") or null if not installed
 */
async function getBraveVersionMacOS() {
  if (!isBraveInstalledMacOS()) {
    return null;
  }

  const bravePath = `${MACOS_APP_PATH}/Contents/MacOS/Brave Browser`;
  const result = await shell.exec(`"${bravePath}" --version`);

  if (result.code === 0 && result.stdout) {
    // Output format: "Brave 1.86.139 Chromium: 128.0.6613.137"
    const match = result.stdout.match(/Brave\s+([\d.]+)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Check if Brave Browser is installed on Linux by verifying the brave-browser command exists.
 *
 * When installed from Brave's official repository, the 'brave-browser' command
 * is added to /usr/bin.
 *
 * @returns {boolean} True if the brave-browser command is available, false otherwise
 */
function isBraveInstalledLinux() {
  return shell.commandExists('brave-browser');
}

/**
 * Get the installed version of Brave Browser on Linux.
 *
 * Executes the brave-browser command with --version flag to retrieve the version.
 * Output format: "Brave 1.86.139 Chromium: 128.0.6613.137"
 *
 * @returns {Promise<string|null>} Version string or null if not installed
 */
async function getBraveVersionLinux() {
  if (!isBraveInstalledLinux()) {
    return null;
  }

  const result = await shell.exec('brave-browser --version');
  if (result.code === 0 && result.stdout) {
    const match = result.stdout.match(/Brave\s+([\d.]+)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Check if Brave Browser is installed on Windows.
 *
 * Checks for the Brave executable at the default installation paths.
 * Brave is typically installed to Program Files for system-wide installation
 * or to LocalAppData for per-user installation.
 *
 * @returns {boolean} True if Brave executable exists, false otherwise
 */
function isBraveInstalledWindows() {
  const fs = require('fs');

  // Check system-wide installation path
  if (fs.existsSync(WINDOWS_BRAVE_PATH_SYSTEM)) {
    return true;
  }

  // Check per-user installation path
  if (WINDOWS_BRAVE_PATH_USER_APPDATA && fs.existsSync(WINDOWS_BRAVE_PATH_USER_APPDATA)) {
    return true;
  }

  return false;
}

/**
 * Get the installed version of Brave Browser on Windows.
 *
 * Executes the Brave executable with --version flag to retrieve the version.
 *
 * @returns {Promise<string|null>} Version string or null if not installed
 */
async function getBraveVersionWindows() {
  const fs = require('fs');

  // Determine which path has Brave installed
  let bravePath = null;
  if (fs.existsSync(WINDOWS_BRAVE_PATH_SYSTEM)) {
    bravePath = WINDOWS_BRAVE_PATH_SYSTEM;
  } else if (WINDOWS_BRAVE_PATH_USER_APPDATA && fs.existsSync(WINDOWS_BRAVE_PATH_USER_APPDATA)) {
    bravePath = WINDOWS_BRAVE_PATH_USER_APPDATA;
  }

  if (!bravePath) {
    return null;
  }

  const result = await shell.exec(`"${bravePath}" --version`);
  if (result.code === 0 && result.stdout) {
    const match = result.stdout.match(/Brave\s+([\d.]+)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Set up Brave's APT repository for Ubuntu/Debian.
 *
 * This function:
 * 1. Downloads and installs the Brave GPG keyring for package verification
 * 2. Downloads and installs the Brave repository sources file
 * 3. Updates the package cache to include the new repository
 *
 * @returns {Promise<void>}
 * @throws {Error} If any step fails
 */
async function setupBraveAptRepository() {
  console.log('Setting up Brave APT repository...');

  // Step 1: Download and install the Brave GPG keyring
  console.log('Downloading Brave GPG keyring...');
  const keyringResult = await shell.exec(
    `sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg ${BRAVE_GPG_KEYRING_URL}`
  );
  if (keyringResult.code !== 0) {
    throw new Error(
      `Failed to download Brave GPG keyring.\n` +
      `Error: ${keyringResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check your internet connection\n` +
      `  2. Ensure curl is installed: sudo apt-get install -y curl\n` +
      `  3. Try downloading manually: curl -fsSLo /tmp/brave-keyring.gpg ${BRAVE_GPG_KEYRING_URL}`
    );
  }

  // Step 2: Download and install the Brave repository sources file
  console.log('Adding Brave repository...');
  const sourcesResult = await shell.exec(
    `sudo curl -fsSLo /etc/apt/sources.list.d/brave-browser-release.sources ${BRAVE_APT_SOURCES_URL}`
  );
  if (sourcesResult.code !== 0) {
    throw new Error(
      `Failed to add Brave repository.\n` +
      `Error: ${sourcesResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Verify sudo privileges\n` +
      `  2. Try downloading manually: curl -fsSL ${BRAVE_APT_SOURCES_URL}`
    );
  }

  // Step 3: Update package cache to include the new repository
  console.log('Updating package cache...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(
      `Failed to update package cache.\n` +
      `Error: ${updateResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check the repository configuration: cat /etc/apt/sources.list.d/brave-browser-release.sources\n` +
      `  2. Verify the GPG key exists: ls -la /usr/share/keyrings/brave-browser-archive-keyring.gpg`
    );
  }

  console.log('Brave APT repository configured successfully.');
}

/**
 * Set up Brave's DNF/YUM repository for Amazon Linux/RHEL/Fedora.
 *
 * This function:
 * 1. Installs dnf-plugins-core if needed (for config-manager command)
 * 2. Adds the Brave repository using the appropriate method for the dnf version
 *
 * @returns {Promise<void>}
 * @throws {Error} If any step fails
 */
async function setupBraveDnfRepository() {
  console.log('Setting up Brave DNF repository...');

  // Detect package manager (dnf for AL2023/Fedora/RHEL8+, yum for AL2)
  const hasDnf = shell.commandExists('dnf');

  if (hasDnf) {
    // Install dnf-plugins-core if not already installed
    console.log('Ensuring dnf-plugins-core is installed...');
    await shell.exec('sudo dnf install -y dnf-plugins-core');

    // Try the modern dnf5 syntax first (Fedora 41+)
    console.log('Adding Brave repository...');
    let repoResult = await shell.exec(
      `sudo dnf config-manager addrepo --from-repofile=${BRAVE_RPM_REPO_URL}`
    );

    // If dnf5 syntax fails, fall back to legacy dnf4 syntax
    if (repoResult.code !== 0) {
      console.log('Trying legacy dnf syntax...');
      repoResult = await shell.exec(
        `sudo dnf config-manager --add-repo ${BRAVE_RPM_REPO_URL}`
      );
    }

    if (repoResult.code !== 0) {
      throw new Error(
        `Failed to add Brave repository.\n` +
        `Error: ${repoResult.stderr}\n\n` +
        `Troubleshooting:\n` +
        `  1. Import GPG key manually: sudo rpm --import ${BRAVE_RPM_GPG_KEY_URL}\n` +
        `  2. Download repo file manually: sudo curl -fsSLo /etc/yum.repos.d/brave-browser.repo ${BRAVE_RPM_REPO_URL}`
      );
    }
  } else {
    // Legacy YUM for Amazon Linux 2
    console.log('Importing Brave GPG key...');
    const gpgResult = await shell.exec(`sudo rpm --import ${BRAVE_RPM_GPG_KEY_URL}`);
    if (gpgResult.code !== 0) {
      throw new Error(`Failed to import Brave GPG key: ${gpgResult.stderr}`);
    }

    console.log('Adding Brave repository...');
    const repoResult = await shell.exec(
      `sudo curl -fsSLo /etc/yum.repos.d/brave-browser.repo ${BRAVE_RPM_REPO_URL}`
    );
    if (repoResult.code !== 0) {
      throw new Error(`Failed to add Brave repository: ${repoResult.stderr}`);
    }
  }

  console.log('Brave repository configured successfully.');
}

/**
 * Install Brave Browser on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later
 * - Homebrew package manager installed
 * - Terminal access
 *
 * The installation uses the Homebrew cask 'brave-browser' which downloads
 * and installs Brave to /Applications/Brave Browser.app.
 *
 * This function is idempotent - it checks if Brave is already installed
 * before attempting installation and skips if already present.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if Brave Browser is already installed...');

  // Check if Brave is already installed via file system check
  if (isBraveInstalledMacOS()) {
    const version = await getBraveVersionMacOS();
    if (version) {
      console.log(`Brave Browser ${version} is already installed, skipping installation.`);
    } else {
      console.log('Brave Browser is already installed, skipping installation.');
    }
    return;
  }

  // Also check if the Homebrew cask is installed (Brave may be installed but not detected)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Brave Browser is already installed via Homebrew, skipping installation.');
    return;
  }

  // Verify Homebrew is available before proceeding
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  console.log('Installing Brave Browser via Homebrew...');

  // Install Brave Browser cask
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    console.log('Failed to install Brave Browser via Homebrew.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "brew update && brew cleanup" and retry');
    console.log('  2. Try manual installation: brew reinstall --cask brave-browser');
    console.log('  3. Check if macOS Gatekeeper is blocking the app:');
    console.log('     xattr -cr /Applications/Brave\\ Browser.app');
    return;
  }

  // Verify the installation succeeded
  if (!isBraveInstalledMacOS()) {
    console.log('Installation may have failed: Brave Browser was not found.');
    console.log('Please check /Applications folder for Brave Browser.app');
    return;
  }

  const installedVersion = await getBraveVersionMacOS();
  console.log(`Brave Browser ${installedVersion || ''} installed successfully.`);
  console.log('');
  console.log('You can launch Brave from Applications or run:');
  console.log('  open -a "Brave Browser"');
}

/**
 * Install Brave Browser on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 18.04 or later, or Debian 10 or later
 * - Both x86_64 (amd64) and ARM64 (aarch64) architectures are supported
 * - sudo privileges
 * - curl installed
 *
 * This function adds Brave's official APT repository and installs the browser.
 * The repository is configured using the modern DEB822 format for Ubuntu 22.04+
 * compatibility.
 *
 * This function is idempotent - it checks if Brave is already installed
 * before attempting installation.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if Brave Browser is already installed...');

  // Check if Brave is already installed
  if (isBraveInstalledLinux()) {
    const version = await getBraveVersionLinux();
    if (version) {
      console.log(`Brave Browser ${version} is already installed, skipping installation.`);
    } else {
      console.log('Brave Browser is already installed, skipping installation.');
    }
    return;
  }

  // Ensure curl is installed (required for downloading GPG key and sources file)
  if (!shell.commandExists('curl')) {
    console.log('Installing curl...');
    const curlResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl');
    if (curlResult.code !== 0) {
      console.log('Failed to install curl. Please install it manually:');
      console.log('  sudo apt-get install -y curl');
      return;
    }
  }

  // Set up Brave's APT repository
  try {
    await setupBraveAptRepository();
  } catch (error) {
    console.log(`Failed to set up Brave repository: ${error.message}`);
    return;
  }

  // Install Brave Browser from the repository
  console.log('Installing Brave Browser via APT...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Brave Browser via APT.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run "sudo apt-get update" and retry');
    console.log('  2. Install missing dependencies: sudo apt-get install -y -f');
    console.log('  3. Check the repository configuration:');
    console.log('     cat /etc/apt/sources.list.d/brave-browser-release.sources');
    return;
  }

  // Verify installation
  if (!isBraveInstalledLinux()) {
    console.log('Installation may have failed: brave-browser command not found.');
    console.log('Please try running: brave-browser --version');
    return;
  }

  const installedVersion = await getBraveVersionLinux();
  console.log(`Brave Browser ${installedVersion || ''} installed successfully.`);
  console.log('');
  console.log('Launch Brave with:');
  console.log('  brave-browser &');
  console.log('');
  console.log('NOTE: Brave will automatically update via apt-get upgrade.');
}

/**
 * Install Brave Browser on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 with Ubuntu distribution installed
 * - WSLg enabled (included by default in Windows 11 and Windows 10 21H2+)
 * - sudo privileges within WSL
 *
 * This function installs Brave using the same method as Ubuntu since
 * WSL Ubuntu is functionally identical to native Ubuntu for package management.
 * However, running Brave requires WSLg for GUI support.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Use the same installation process as Ubuntu
  await install_ubuntu();

  // Add WSL-specific post-installation notes
  console.log('');
  console.log('WSL-SPECIFIC NOTES:');
  console.log('');
  console.log('1. Running GUI apps in WSL requires WSLg (Windows 11 / Windows 10 21H2+).');
  console.log('   If Brave fails to launch, ensure WSLg is enabled.');
  console.log('');
  console.log('2. If you see sandbox errors, try:');
  console.log('   brave-browser --no-sandbox');
  console.log('');
  console.log('3. For headless automation in WSL:');
  console.log('   brave-browser --headless --disable-gpu --dump-dom https://example.com');
}

/**
 * Install Brave Browser on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit or 32-bit) - Bookworm or Bullseye
 * - Raspberry Pi 3B+ or later recommended
 * - Desktop environment installed
 * - sudo privileges
 *
 * Brave Browser supports both ARM64 and armhf architectures, making it
 * compatible with Raspberry Pi devices. This function uses the same
 * APT repository setup as Ubuntu/Debian.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if Brave Browser is already installed...');

  // Check if Brave is already installed
  if (isBraveInstalledLinux()) {
    const version = await getBraveVersionLinux();
    if (version) {
      console.log(`Brave Browser ${version} is already installed, skipping installation.`);
    } else {
      console.log('Brave Browser is already installed, skipping installation.');
    }
    return;
  }

  // Check and report architecture for informational purposes
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  console.log(`Detected architecture: ${arch}`);
  console.log('');

  // Ensure curl is installed
  if (!shell.commandExists('curl')) {
    console.log('Installing curl...');
    const curlResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl');
    if (curlResult.code !== 0) {
      console.log('Failed to install curl. Please install it manually:');
      console.log('  sudo apt-get install -y curl');
      return;
    }
  }

  // Set up Brave's APT repository (same as Ubuntu/Debian)
  try {
    await setupBraveAptRepository();
  } catch (error) {
    console.log(`Failed to set up Brave repository: ${error.message}`);
    return;
  }

  // Install Brave Browser from the repository
  console.log('Installing Brave Browser via APT...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Brave Browser via APT.');
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have a desktop environment installed');
    console.log('  2. Run "sudo apt-get update" and retry');
    console.log('  3. Install missing dependencies: sudo apt-get install -y -f');
    return;
  }

  // Verify installation
  if (!isBraveInstalledLinux()) {
    console.log('Installation may have failed: brave-browser command not found.');
    return;
  }

  const installedVersion = await getBraveVersionLinux();
  console.log(`Brave Browser ${installedVersion || ''} installed successfully.`);
  console.log('');
  console.log('NOTE: If Brave is slow on Raspberry Pi, you can try disabling');
  console.log('hardware acceleration in Brave settings (brave://settings/system).');
}

/**
 * Install Brave Browser on Amazon Linux/RHEL/Fedora using DNF or YUM.
 *
 * Prerequisites:
 * - Amazon Linux 2023, RHEL 8+, Fedora 37+, Rocky Linux, or AlmaLinux
 * - x86_64 or ARM64 architecture
 * - sudo privileges
 * - Desktop environment installed (GNOME, KDE, etc.)
 *
 * IMPORTANT: Amazon Linux and RHEL are typically used for server workloads.
 * Installing Brave Browser requires a desktop environment with graphical
 * capabilities. This is uncommon on cloud instances but applicable to
 * workstation configurations.
 *
 * This function automatically detects whether the system uses DNF or YUM
 * and uses the appropriate package manager.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if Brave Browser is already installed...');

  // Check if Brave is already installed
  if (isBraveInstalledLinux()) {
    const version = await getBraveVersionLinux();
    if (version) {
      console.log(`Brave Browser ${version} is already installed, skipping installation.`);
    } else {
      console.log('Brave Browser is already installed, skipping installation.');
    }
    return;
  }

  // Detect package manager (dnf for AL2023/Fedora/RHEL8+, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    console.log('Neither dnf nor yum package manager found.');
    console.log('This installer supports Amazon Linux 2023 (dnf) and Amazon Linux 2 (yum).');
    return;
  }

  console.log(`Detected package manager: ${packageManager}`);

  // Set up Brave's DNF/YUM repository
  try {
    await setupBraveDnfRepository();
  } catch (error) {
    console.log(`Failed to set up Brave repository: ${error.message}`);
    return;
  }

  // Install Brave Browser from the repository
  console.log(`Installing Brave Browser via ${packageManager}...`);
  const installResult = await shell.exec(
    `sudo ${packageManager} install -y ${APT_PACKAGE_NAME}`
  );

  if (installResult.code !== 0) {
    console.log(`Failed to install Brave Browser via ${packageManager}.`);
    console.log(installResult.stderr || installResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Install common dependencies first:');
    console.log(`     sudo ${packageManager} install -y libXcomposite libXdamage libXrandr libgbm libxkbcommon pango alsa-lib atk at-spi2-atk cups-libs libdrm mesa-libgbm`);
    console.log('  2. Then retry the installation');
    return;
  }

  // Verify installation
  if (!isBraveInstalledLinux()) {
    console.log('Installation may have failed: brave-browser command not found.');
    return;
  }

  const installedVersion = await getBraveVersionLinux();
  console.log(`Brave Browser ${installedVersion || ''} installed successfully.`);
  console.log('');
  console.log('NOTE: On EC2 instances, you may need to run Brave with additional flags:');
  console.log('  brave-browser --no-sandbox --headless');
}

/**
 * Install Brave Browser on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later, or Windows 11
 * - Administrator privileges
 * - Chocolatey package manager installed
 *
 * The Chocolatey package installs Brave Browser system-wide and handles
 * all dependencies automatically.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if Brave Browser is already installed...');

  // Check if Brave is already installed
  if (isBraveInstalledWindows()) {
    const version = await getBraveVersionWindows();
    if (version) {
      console.log(`Brave Browser ${version} is already installed, skipping installation.`);
    } else {
      console.log('Brave Browser is already installed, skipping installation.');
    }
    return;
  }

  // Also check if Chocolatey has the package installed
  const isChocoInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (isChocoInstalled) {
    console.log('Brave Browser is already installed via Chocolatey, skipping installation.');
    return;
  }

  // Verify Chocolatey is available
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('Run: dev install chocolatey');
    return;
  }

  console.log('Installing Brave Browser via Chocolatey...');
  console.log('This may take a few minutes...');

  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install Brave Browser via Chocolatey.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you are running as Administrator');
    console.log('  2. Try: choco install brave -y --force');
    return;
  }

  // Verify the installation succeeded
  const verified = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!verified && !isBraveInstalledWindows()) {
    console.log('Installation may have failed: Brave Browser package not found after install.');
    return;
  }

  console.log('Brave Browser installed successfully via Chocolatey.');
  console.log('');
  console.log('NOTE: Brave is now available in your Start Menu.');
  console.log('You may need to open a new terminal to use it from the command line.');
}

/**
 * Install Brave Browser from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Brave Browser
 * on the Windows host using PowerShell interop with Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey package manager installed on Windows
 * - Administrator privileges
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Brave Browser on the Windows host...');
  console.log('');

  // Check if Brave is already installed by checking the Windows path
  const fs = require('fs');

  // Git Bash path format uses forward slashes with drive letter prefix
  const windowsPath = '/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe';
  const exists = fs.existsSync(windowsPath);

  if (exists) {
    console.log('Brave Browser is already installed, skipping installation.');
    console.log('');
    console.log('To use Brave from Git Bash:');
    console.log('  "/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe" --version');
    return;
  }

  // Try Chocolatey via PowerShell
  console.log('Attempting installation via Chocolatey...');
  const chocoResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install brave -y"'
  );

  if (chocoResult.code === 0) {
    console.log('Brave Browser installed successfully via Chocolatey.');
    console.log('');
    console.log('To use Brave from Git Bash:');
    console.log('  "/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe" --version');
    return;
  }

  // Chocolatey failed
  console.log('Failed to install Brave Browser.');
  console.log(chocoResult.stdout || chocoResult.stderr);
  console.log('');
  console.log('Troubleshooting:');
  console.log('  1. Ensure Chocolatey is installed on Windows');
  console.log('  2. Run Git Bash as Administrator and retry');
  console.log('  3. Try installing directly from PowerShell:');
  console.log('     choco install brave -y');
}

/**
 * Check if Brave Browser is currently installed on the system.
 *
 * This function checks for Brave Browser installation across all supported platforms:
 * - macOS: Checks for Brave Browser.app via Homebrew cask or application bundle
 * - Windows: Checks for brave.exe at standard installation paths
 * - Linux: Checks if brave-browser command exists
 *
 * @returns {Promise<boolean>} True if Brave Browser is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    // Check if Brave Browser app bundle exists
    if (isBraveInstalledMacOS()) {
      return true;
    }
    // Also check via Homebrew cask
    return await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  }

  if (platform.type === 'windows' || platform.type === 'gitbash') {
    return isBraveInstalledWindows();
  }

  // Linux platforms: Check if brave-browser command exists
  return isBraveInstalledLinux();
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Brave Browser is supported on most major platforms but requires a desktop
 * environment since it is a GUI application. On headless servers or
 * containers without a display, this function returns false.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();

  // First check if the platform is supported
  const supportedPlatforms = ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'];
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
 * Main installation entry point.
 *
 * Detects the current platform using os.detect() and routes to the appropriate
 * platform-specific installer function. Handles platform aliases to ensure
 * all supported distributions use the correct installation method.
 *
 * Supported platforms:
 * - macOS: Brave Browser via Homebrew cask
 * - Ubuntu/Debian: Brave Browser via official APT repository
 * - Raspberry Pi OS: Brave Browser via official APT repository (ARM supported)
 * - Amazon Linux/RHEL/Fedora: Brave Browser via official DNF/YUM repository
 * - Windows: Brave Browser via Chocolatey
 * - WSL (Ubuntu): Brave Browser within WSL environment
 * - Git Bash: Brave Browser on Windows host
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases (e.g., debian uses the same installer as ubuntu)
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
    console.log(`Brave Browser is not available for ${platform.type}.`);
    return;
  }

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
  install_gitbash
};

// Allow direct execution: node brave-browser.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
