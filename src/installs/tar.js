#!/usr/bin/env node

/**
 * @fileoverview Install tar - a command-line utility for creating, extracting, and manipulating archives.
 *
 * tar (tape archive) is the standard archiving tool on Unix-like systems. It bundles multiple
 * files and directories into a single archive file while preserving file permissions, ownership,
 * and directory structures. tar is essential for creating backups, distributing software source
 * code (the ubiquitous .tar.gz "tarball" format), and packaging files for transfer.
 *
 * Two major implementations exist:
 * - GNU tar - The default on most Linux distributions; feature-rich with GNU extensions
 * - BSD tar (bsdtar) - The default on macOS and Windows 10+; uses the libarchive library
 *
 * Note: tar is pre-installed on most operating systems. This installer verifies tar availability
 * and installs it only if missing (which is rare).
 *
 * @module installs/tar
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Install tar on macOS using Homebrew.
 *
 * macOS includes BSD tar pre-installed at /usr/bin/tar. This function installs
 * GNU tar via Homebrew as 'gtar', which provides better compatibility with
 * Linux systems and supports GNU-specific extensions.
 *
 * The system BSD tar remains available and is not replaced. Homebrew installs
 * GNU tar with a 'g' prefix (gtar) to avoid conflicts with the system version.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // First, check if the system tar is available (it should always be on macOS)
  // We check for tar command existence as a baseline verification
  const systemTarExists = shell.commandExists('tar');
  if (!systemTarExists) {
    // This is an extremely rare case - system tar should always exist on macOS
    console.log('Warning: System tar not found. This is unexpected on macOS.');
  }

  // Check if Homebrew is available - it is required for installing GNU tar
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    console.log('');
    console.log('Note: macOS includes BSD tar pre-installed at /usr/bin/tar.');
    console.log('Homebrew is only needed if you require GNU tar (gtar).');
    return;
  }

  // Check if GNU tar is already installed via Homebrew
  // The formula name is 'gnu-tar' but the command is 'gtar'
  const isBrewTarInstalled = await brew.isFormulaInstalled('gnu-tar');
  if (isBrewTarInstalled) {
    console.log('GNU tar is already installed via Homebrew (gtar), skipping...');
    return;
  }

  // Install GNU tar using Homebrew
  console.log('Installing GNU tar via Homebrew...');
  const result = await brew.install('gnu-tar');

  if (!result.success) {
    console.log('Failed to install GNU tar via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if gtar command now exists
  const verified = shell.commandExists('gtar');
  if (!verified) {
    console.log('Installation may have failed: gtar command not found after install.');
    return;
  }

  console.log('GNU tar installed successfully via Homebrew.');
  console.log('');
  console.log('Usage:');
  console.log('  gtar - Use GNU tar directly');
  console.log('  /usr/bin/tar - Use macOS BSD tar');
  console.log('');
  console.log('To make GNU tar the default, add to your PATH:');
  console.log('  echo \'export PATH="$(brew --prefix)/opt/gnu-tar/libexec/gnubin:$PATH"\' >> ~/.zshrc');
}

/**
 * Install tar on Ubuntu/Debian using APT.
 *
 * GNU tar is pre-installed on all Ubuntu and Debian systems as part of the
 * core utilities. This function verifies tar is present and installs it only
 * if it is missing (which would be an extremely rare scenario).
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if tar is already installed (it should be on all Ubuntu/Debian systems)
  const isInstalled = shell.commandExists('tar');
  if (isInstalled) {
    console.log('tar is already installed, skipping...');
    return;
  }

  // tar is not installed - this is unusual on Ubuntu/Debian but handle it gracefully
  // Update package lists before installing to ensure we get the latest version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install tar using APT
  console.log('Installing tar via APT...');
  const result = await apt.install('tar');

  if (!result.success) {
    console.log('Failed to install tar via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('tar');
  if (!verified) {
    console.log('Installation may have failed: tar command not found after install.');
    return;
  }

  console.log('tar installed successfully.');
}

/**
 * Install tar on Ubuntu running in WSL.
 *
 * WSL Ubuntu installations follow the same process as native Ubuntu using APT.
 * GNU tar is pre-installed in WSL Ubuntu distributions just like native Ubuntu.
 * This function delegates to install_ubuntu() because WSL provides a full
 * Ubuntu environment with APT package management.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();
}

/**
 * Install tar on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so tar installation follows the same
 * process as Ubuntu/Debian. GNU tar is pre-installed on all Raspberry Pi OS
 * installations. The tar package is available for both 32-bit (armv7l) and
 * 64-bit (aarch64) ARM architectures.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install tar on Amazon Linux using DNF or YUM.
 *
 * GNU tar is pre-installed on all Amazon Linux versions as part of the base
 * system. This function verifies tar is present and installs it if missing.
 * Amazon Linux 2023 uses dnf as the package manager, while Amazon Linux 2
 * uses yum. This function detects which package manager is available and
 * uses it accordingly.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if tar is already installed (it should be on all Amazon Linux systems)
  const isInstalled = shell.commandExists('tar');
  if (isInstalled) {
    console.log('tar is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Construct the install command based on available package manager
  // The -y flag automatically confirms installation prompts for non-interactive execution
  const installCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y tar'
    : 'sudo yum install -y tar';

  // Install tar
  console.log(`Installing tar via ${packageManager}...`);
  const result = await shell.exec(installCommand);

  if (result.code !== 0) {
    console.log(`Failed to install tar via ${packageManager}.`);
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('tar');
  if (!verified) {
    console.log('Installation may have failed: tar command not found after install.');
    return;
  }

  console.log('tar installed successfully.');
}

/**
 * Install tar on Windows.
 *
 * Windows 10 (version 1803+) and Windows 11 include bsdtar pre-installed at
 * C:\Windows\System32\tar.exe. This function verifies tar is available.
 * Unlike other tools, no additional installation via Chocolatey is typically
 * needed since the built-in tar is sufficient for most use cases.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if tar is already available (it should be on Windows 10 1803+ and Windows 11)
  const isInstalled = shell.commandExists('tar');
  if (isInstalled) {
    console.log('tar is already installed (built-in Windows bsdtar), skipping...');
    return;
  }

  // tar is not available - this means the user is on an older Windows version
  // or something is wrong with the system PATH
  console.log('tar is not available on this system.');
  console.log('');
  console.log('tar is included by default on Windows 10 version 1803 and later.');
  console.log('');

  // Check if Chocolatey is available to offer an alternative installation method
  if (!choco.isInstalled()) {
    console.log('To install tar on older Windows versions, install Chocolatey first:');
    console.log('Run: dev install chocolatey');
    console.log('');
    console.log('Then install TarTool:');
    console.log('Run: choco install tartool -y');
    return;
  }

  // Chocolatey is available - offer to install TarTool
  console.log('Installing TarTool via Chocolatey...');
  const result = await choco.install('tartool');

  if (!result.success) {
    console.log('Failed to install TarTool via Chocolatey.');
    console.log(result.output);
    return;
  }

  console.log('TarTool installed successfully via Chocolatey.');
  console.log('');
  console.log('Note: You may need to open a new terminal for the PATH update to take effect.');
}

/**
 * Install tar on Git Bash (Windows).
 *
 * Git Bash includes GNU tar bundled at C:\Program Files\Git\usr\bin\tar.exe.
 * This is separate from the Windows built-in bsdtar. When running commands
 * in Git Bash, the GNU tar takes precedence due to PATH ordering.
 *
 * No installation is typically required as tar is bundled with Git for Windows.
 * If tar is not available, the user likely needs to reinstall Git for Windows.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if tar is already available (it should be bundled with Git Bash)
  const isInstalled = shell.commandExists('tar');
  if (isInstalled) {
    console.log('tar is already installed (bundled with Git for Windows), skipping...');
    return;
  }

  // tar should be bundled with Git for Windows, but if it is missing,
  // the user likely needs to reinstall Git for Windows
  console.log('tar is not found. It should be bundled with Git for Windows.');
  console.log('');
  console.log('Please reinstall Git for Windows from https://git-scm.com/download/win');
  console.log('Alternatively, install Git for Windows via Chocolatey:');
  console.log('  choco install git -y');
}

/**
 * Check if this installer is supported on the current platform.
 * tar is available on all major platforms.
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
 * appropriate platform-specific installer function. tar is pre-installed on
 * most platforms, so these installers primarily verify availability.
 *
 * Supported platforms:
 * - macOS (BSD tar pre-installed, GNU tar via Homebrew)
 * - Ubuntu/Debian (GNU tar pre-installed, APT if missing)
 * - Ubuntu on WSL (GNU tar pre-installed, APT if missing)
 * - Raspberry Pi OS (GNU tar pre-installed, APT if missing)
 * - Amazon Linux/RHEL (GNU tar pre-installed, DNF/YUM if missing)
 * - Windows (bsdtar pre-installed on Windows 10 1803+)
 * - Git Bash (GNU tar bundled with Git for Windows)
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
  // Do not throw an error - just log a message and return
  if (!installer) {
    console.log(`tar is not available for ${platform.type}.`);
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
