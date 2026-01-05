#!/usr/bin/env node

/**
 * @fileoverview Install cURL - a command-line tool for transferring data with URLs.
 *
 * cURL supports HTTP, HTTPS, FTP, FTPS, SCP, SFTP, and many other protocols.
 * It is essential for making HTTP requests, downloading files, testing APIs,
 * and automating data transfers from the command line.
 *
 * @module installs/curl
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Install cURL on macOS using Homebrew.
 *
 * macOS includes a system version of cURL pre-installed. This function installs
 * the latest version via Homebrew, which includes more recent features and
 * security updates.
 *
 * Note: Homebrew intentionally does not symlink cURL to avoid conflicts with
 * the macOS system version. Users must manually add it to their PATH.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Check if cURL is already installed via Homebrew
  // Note: We check the Homebrew formula, not the command, because macOS has
  // a system cURL that will always exist at /usr/bin/curl
  const isBrewCurlInstalled = await brew.isFormulaInstalled('curl');
  if (isBrewCurlInstalled) {
    console.log('cURL is already installed via Homebrew, skipping...');
    return;
  }

  // Install cURL using Homebrew
  console.log('Installing cURL via Homebrew...');
  const result = await brew.install('curl');

  if (!result.success) {
    console.log('Failed to install cURL via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the formula is now installed
  const verified = await brew.isFormulaInstalled('curl');
  if (!verified) {
    console.log('Installation may have failed: cURL formula not found after install.');
    return;
  }

  console.log('cURL installed successfully via Homebrew.');
  console.log('');
  console.log('Note: To use the Homebrew version as your default cURL, add it to your PATH:');
  console.log('  echo \'export PATH="$(brew --prefix)/opt/curl/bin:$PATH"\' >> ~/.zshrc && source ~/.zshrc');
}

/**
 * Install cURL on Ubuntu/Debian using APT.
 *
 * Most Ubuntu and Debian installations include cURL pre-installed. This function
 * ensures cURL is installed or updates it to the latest version from the
 * repositories.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if cURL is already installed by looking for the command
  const isInstalled = shell.commandExists('curl');
  if (isInstalled) {
    console.log('cURL is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install cURL using APT
  console.log('Installing cURL via APT...');
  const result = await apt.install('curl');

  if (!result.success) {
    console.log('Failed to install cURL via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('curl');
  if (!verified) {
    console.log('Installation may have failed: curl command not found after install.');
    return;
  }

  console.log('cURL installed successfully.');
}

/**
 * Install cURL on Ubuntu running in WSL.
 *
 * WSL Ubuntu installations follow the same process as native Ubuntu using APT.
 * This function is identical to install_ubuntu() because WSL provides a full
 * Ubuntu environment.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();
}

/**
 * Install cURL on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so cURL installation follows the same
 * process as Ubuntu/Debian. cURL is often pre-installed on Raspberry Pi OS.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install cURL on Amazon Linux using DNF or YUM.
 *
 * cURL is pre-installed on all Amazon Linux versions. Amazon Linux 2023 uses
 * dnf as the package manager, while Amazon Linux 2 uses yum. This function
 * detects which package manager is available and uses it accordingly.
 *
 * Note: AL2023 provides curl-minimal by default. The full curl package is
 * available if additional protocols are needed.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if cURL is already installed by looking for the command
  const isInstalled = shell.commandExists('curl');
  if (isInstalled) {
    console.log('cURL is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Construct the install command based on available package manager
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const installCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y curl'
    : 'sudo yum install -y curl';

  // Install cURL
  console.log(`Installing cURL via ${packageManager}...`);
  const result = await shell.exec(installCommand);

  if (result.code !== 0) {
    console.log(`Failed to install cURL via ${packageManager}.`);
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('curl');
  if (!verified) {
    console.log('Installation may have failed: curl command not found after install.');
    return;
  }

  console.log('cURL installed successfully.');
}

/**
 * Install cURL on Windows using Chocolatey.
 *
 * Windows 10 version 1803 and later includes cURL pre-installed at
 * C:\Windows\System32\curl.exe. This function installs the latest cURL
 * version via Chocolatey, which may include newer features and security updates.
 *
 * Note: In PowerShell, 'curl' is an alias for Invoke-WebRequest. Use 'curl.exe'
 * to invoke the actual cURL executable.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if Chocolatey is available - it is required for Windows installation
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('Run: dev install chocolatey');
    return;
  }

  // Check if cURL is already installed via Chocolatey
  // Note: We check the Chocolatey package, not the command, because Windows has
  // a built-in cURL that will always exist at C:\Windows\System32\curl.exe
  const isChocoCurlInstalled = await choco.isPackageInstalled('curl');
  if (isChocoCurlInstalled) {
    console.log('cURL is already installed via Chocolatey, skipping...');
    return;
  }

  // Install cURL using Chocolatey
  console.log('Installing cURL via Chocolatey...');
  const result = await choco.install('curl');

  if (!result.success) {
    console.log('Failed to install cURL via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled('curl');
  if (!verified) {
    console.log('Installation may have failed: cURL package not found after install.');
    return;
  }

  console.log('cURL installed successfully via Chocolatey.');
  console.log('');
  console.log('Note: In PowerShell, use "curl.exe" (with the extension) to run the actual cURL');
  console.log('executable, as "curl" is an alias for Invoke-WebRequest.');
}

/**
 * Install cURL on Git Bash (Windows).
 *
 * Git Bash includes a MinGW-compiled version of cURL bundled with Git for Windows.
 * No separate installation is typically required. If cURL is not available,
 * this function directs users to reinstall Git for Windows.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if cURL is already available (it should be bundled with Git Bash)
  const isInstalled = shell.commandExists('curl');
  if (isInstalled) {
    console.log('cURL is already installed (bundled with Git for Windows), skipping...');
    return;
  }

  // cURL should be bundled with Git for Windows, but if it is missing,
  // the user likely needs to reinstall Git for Windows
  console.log('cURL is not found. It should be bundled with Git for Windows.');
  console.log('Please reinstall Git for Windows from https://git-scm.com/download/win');
  console.log('Alternatively, install cURL on Windows using: dev install curl');
}

/**
 * Check if this installer is supported on the current platform.
 *
 * cURL can be installed on all supported platforms:
 * - macOS (via Homebrew)
 * - Ubuntu/Debian (via APT)
 * - Ubuntu on WSL (via APT)
 * - Raspberry Pi OS (via APT)
 * - Amazon Linux/RHEL/Fedora (via DNF/YUM)
 * - Windows (via Chocolatey)
 * - Git Bash (bundled with Git for Windows)
 *
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
 * appropriate platform-specific installer function. Supported platforms:
 * - macOS (Homebrew)
 * - Ubuntu/Debian (APT)
 * - Ubuntu on WSL (APT)
 * - Raspberry Pi OS (APT)
 * - Amazon Linux/RHEL (DNF/YUM)
 * - Windows (Chocolatey)
 * - Git Bash (bundled with Git for Windows)
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
    console.log(`cURL is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
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
