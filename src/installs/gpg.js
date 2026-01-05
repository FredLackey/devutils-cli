#!/usr/bin/env node

/**
 * @fileoverview Install GnuPG (GPG) - the GNU Privacy Guard.
 *
 * GnuPG (GNU Privacy Guard), commonly known as GPG, is a free and open-source
 * implementation of the OpenPGP standard (RFC 4880). It enables encryption and
 * signing of data and communications, providing cryptographic privacy and
 * authentication.
 *
 * GPG enables developers to:
 * - Sign Git commits and tags to verify authorship
 * - Encrypt sensitive files and communications
 * - Verify the integrity and authenticity of downloaded software
 * - Manage cryptographic keys for secure communications
 * - Authenticate to remote services using GPG keys
 *
 * GnuPG is an essential tool for secure software development workflows,
 * particularly for signing Git commits (a requirement for many open-source
 * projects and enterprise environments).
 *
 * @module installs/gpg
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');
const winget = require('../utils/windows/winget');

/**
 * Install GPG on macOS using Homebrew.
 *
 * On macOS, this installs GnuPG along with pinentry-mac, which provides
 * a native macOS dialog for entering GPG passphrases. The pinentry-mac
 * integration is essential for signing Git commits, as it allows
 * passphrase entry in GUI applications.
 *
 * After installation, the GPG agent is configured to use pinentry-mac
 * and the agent is restarted to apply the configuration.
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

  // Check if GnuPG is already installed via Homebrew
  // Note: We check the Homebrew formula to ensure we manage the Homebrew version
  const isGnupgInstalled = await brew.isFormulaInstalled('gnupg');
  if (isGnupgInstalled) {
    console.log('GnuPG is already installed via Homebrew, skipping...');
    return;
  }

  // Install GnuPG using Homebrew
  console.log('Installing GnuPG via Homebrew...');
  const gnupgResult = await brew.install('gnupg');

  if (!gnupgResult.success) {
    console.log('Failed to install GnuPG via Homebrew.');
    console.log(gnupgResult.output);
    return;
  }

  // Install pinentry-mac for native macOS passphrase dialogs
  // This is essential for signing Git commits as it allows passphrase entry
  // in GUI environments where there is no terminal attached
  console.log('Installing pinentry-mac for GUI passphrase dialogs...');
  const pinentryResult = await brew.install('pinentry-mac');

  if (!pinentryResult.success) {
    console.log('Warning: Failed to install pinentry-mac. GPG may not work correctly for signing commits.');
    console.log(pinentryResult.output);
  }

  // Configure GPG agent to use pinentry-mac
  // This creates the ~/.gnupg directory with proper permissions and
  // configures gpg-agent.conf to use the Homebrew-installed pinentry-mac
  console.log('Configuring GPG agent to use pinentry-mac...');
  const configCommands = [
    'mkdir -p ~/.gnupg',
    'chmod 700 ~/.gnupg',
    // Use brew --prefix to get the correct path for both Intel and Apple Silicon Macs
    'echo "pinentry-program $(brew --prefix)/bin/pinentry-mac" >> ~/.gnupg/gpg-agent.conf',
    // Restart the GPG agent to apply the new configuration
    'gpgconf --kill gpg-agent'
  ].join(' && ');

  const configResult = await shell.exec(configCommands);

  if (configResult.code !== 0) {
    console.log('Warning: Failed to configure GPG agent. You may need to configure pinentry-mac manually.');
    console.log('See: dev install gpg --help for configuration instructions.');
  }

  // Verify the installation succeeded by checking if the formula is now installed
  const verified = await brew.isFormulaInstalled('gnupg');
  if (!verified) {
    console.log('Installation may have failed: GnuPG formula not found after install.');
    return;
  }

  console.log('GnuPG installed successfully via Homebrew.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Generate a GPG key: gpg --full-generate-key');
  console.log('  2. List your keys: gpg --list-secret-keys --keyid-format=long');
  console.log('  3. Configure Git to sign commits: git config --global user.signingkey YOUR_KEY_ID');
  console.log('  4. Enable commit signing: git config --global commit.gpgsign true');
}

/**
 * Install GPG on Ubuntu/Debian using APT.
 *
 * GnuPG is available in the default Ubuntu and Debian repositories and may
 * already be installed on most systems. This function installs the gnupg
 * package from the standard repositories.
 *
 * On modern Debian/Ubuntu systems (Debian 12+, Ubuntu 22.04+), the gnupg
 * package installs GnuPG version 2.x.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if GPG is already installed by looking for the command
  const isInstalled = shell.commandExists('gpg');
  if (isInstalled) {
    console.log('GPG is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest version
  // from the repositories
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install GnuPG using APT
  console.log('Installing GnuPG via APT...');
  const result = await apt.install('gnupg');

  if (!result.success) {
    console.log('Failed to install GnuPG via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('gpg');
  if (!verified) {
    console.log('Installation may have failed: gpg command not found after install.');
    return;
  }

  console.log('GnuPG installed successfully.');
}

/**
 * Install GPG on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL provides a full Ubuntu environment within Windows, so GPG installation
 * follows the same APT-based process as native Ubuntu. The GPG installed within
 * WSL is separate from any GPG installation on the Windows host.
 *
 * Note: It is common and expected to have different GPG versions in WSL and
 * Windows, as they are independent installations for their respective
 * environments.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();
}

/**
 * Install GPG on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so GPG installation follows the same
 * APT-based process as Ubuntu/Debian. GPG works on both 32-bit (armhf) and
 * 64-bit (arm64) ARM architectures.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install GPG on Amazon Linux using DNF or YUM.
 *
 * Amazon Linux 2023 ships with gnupg2-minimal by default, which provides only
 * basic GPG functionality for package signature verification. For full GPG
 * functionality (including key server access and Git commit signing), this
 * function replaces gnupg2-minimal with gnupg2-full using dnf swap.
 *
 * For Amazon Linux 2, gnupg2 is installed directly via yum.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if GPG is already fully functional by testing for dirmngr
  // (a component included in gnupg2-full but not gnupg2-minimal)
  const hasFullGpg = shell.commandExists('dirmngr');
  if (hasFullGpg) {
    console.log('GnuPG (full version) is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  if (packageManager === 'dnf') {
    // Amazon Linux 2023: Swap gnupg2-minimal for gnupg2-full
    // The dnf swap command handles the package conflict automatically
    console.log('Installing GnuPG (full version) via DNF...');
    console.log('Note: Replacing gnupg2-minimal with gnupg2-full for complete functionality.');

    const result = await shell.exec('sudo dnf swap -y gnupg2-minimal gnupg2-full');

    if (result.code !== 0) {
      // If swap fails, try direct install (minimal may not be installed)
      console.log('Swap failed, attempting direct install...');
      const directResult = await shell.exec('sudo dnf install -y gnupg2-full');

      if (directResult.code !== 0) {
        console.log('Failed to install GnuPG via DNF.');
        console.log(directResult.stderr || directResult.stdout);
        return;
      }
    }
  } else {
    // Amazon Linux 2: Install gnupg2 via yum
    console.log('Installing GnuPG via YUM...');
    const result = await shell.exec('sudo yum install -y gnupg2');

    if (result.code !== 0) {
      console.log('Failed to install GnuPG via YUM.');
      console.log(result.stderr || result.stdout);
      return;
    }
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('gpg');
  if (!verified) {
    console.log('Installation may have failed: gpg command not found after install.');
    return;
  }

  console.log('GnuPG installed successfully.');
}

/**
 * Install GPG on Windows using winget or Chocolatey.
 *
 * This installs GnuPG for Windows, which includes the gpg command-line tools
 * and a graphical pinentry for passphrase entry. winget is preferred if
 * available; otherwise, Chocolatey is used as a fallback.
 *
 * After installation, GPG will be available at:
 * C:\Program Files (x86)\GnuPG\bin\gpg.exe
 *
 * Note: A new terminal window must be opened for PATH changes to take effect.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if GPG is already installed by looking for the command
  const isInstalled = shell.commandExists('gpg');
  if (isInstalled) {
    console.log('GPG is already installed, skipping...');
    return;
  }

  // Prefer winget if available, fall back to Chocolatey
  if (winget.isInstalled()) {
    console.log('Installing GnuPG via winget...');
    const result = await winget.install('GnuPG.GnuPG');

    if (result.success) {
      console.log('GnuPG installed successfully via winget.');
      console.log('');
      console.log('Note: Close and reopen your terminal for PATH changes to take effect.');
      return;
    }

    console.log('winget installation failed, trying Chocolatey...');
  }

  // Try Chocolatey if winget failed or is not available
  if (choco.isInstalled()) {
    console.log('Installing GnuPG via Chocolatey...');
    const result = await choco.install('gnupg');

    if (!result.success) {
      console.log('Failed to install GnuPG via Chocolatey.');
      console.log(result.output);
      return;
    }

    console.log('GnuPG installed successfully via Chocolatey.');
    console.log('');
    console.log('Note: Close and reopen your terminal for PATH changes to take effect.');
    return;
  }

  // Neither winget nor Chocolatey is available
  console.log('Neither winget nor Chocolatey is installed.');
  console.log('Please install one of these package managers first:');
  console.log('  - winget: Built into Windows 10 1809+ and Windows 11');
  console.log('  - Chocolatey: Run "dev install chocolatey"');
}

/**
 * Install GPG on Git Bash (Windows).
 *
 * Git Bash on Windows does not include a usable GPG installation by default.
 * Git for Windows ships with an older GPG 1.4.x in the MinGW environment,
 * but this is insufficient for modern use cases like Git commit signing.
 *
 * This function checks if Windows GPG is installed and configures Git to use
 * it. If Windows GPG is not available, it provides guidance to install it.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if Windows GPG is available at the standard location
  const windowsGpgPath = '/c/Program Files (x86)/GnuPG/bin/gpg.exe';
  const checkResult = await shell.exec(`test -f "${windowsGpgPath}"`);
  const hasWindowsGpg = checkResult.code === 0;

  if (hasWindowsGpg) {
    console.log('Windows GPG is installed. Configuring Git to use it...');

    // Configure Git to use the Windows GPG installation
    const configResult = await shell.exec(
      `git config --global gpg.program "${windowsGpgPath}"`
    );

    if (configResult.code === 0) {
      console.log('Git configured to use Windows GPG successfully.');
      console.log('');
      console.log('You can verify with: git config --global gpg.program');
    } else {
      console.log('Warning: Failed to configure Git to use Windows GPG.');
      console.log('You can configure it manually with:');
      console.log(`  git config --global gpg.program "${windowsGpgPath}"`);
    }
    return;
  }

  // Windows GPG is not installed - provide guidance
  console.log('Windows GPG is not installed.');
  console.log('');
  console.log('To use GPG in Git Bash, you need to install GPG on Windows first.');
  console.log('Open an Administrator PowerShell and run:');
  console.log('');
  console.log('  winget install --id GnuPG.GnuPG --silent --accept-package-agreements');
  console.log('');
  console.log('Or run: dev install gpg (from Windows PowerShell or Command Prompt)');
  console.log('');
  console.log('After installing, run this command again to configure Git.');
}

/**
 * Check if GPG is currently installed on the system.
 *
 * This function checks for GPG installation across all supported platforms:
 * - macOS: Checks for gnupg via Homebrew formula or gpg command
 * - Windows: Checks if gpg command exists
 * - Linux/Git Bash: Checks if gpg command exists in PATH
 *
 * @returns {Promise<boolean>} True if GPG is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    // Check if gnupg formula is installed via Homebrew
    const formulaInstalled = await brew.isFormulaInstalled('gnupg');
    if (formulaInstalled) {
      return true;
    }
    // Also check if gpg command exists
    return shell.commandExists('gpg');
  }

  // All other platforms: Check if gpg command exists
  return shell.commandExists('gpg');
}

/**
 * Check if this installer is supported on the current platform.
 * GPG is supported on all major platforms.
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
 * appropriate platform-specific installer function. GPG is supported on all
 * major platforms:
 *
 * - macOS (Homebrew) - gnupg + pinentry-mac
 * - Ubuntu/Debian (APT) - gnupg
 * - Ubuntu on WSL (APT) - gnupg
 * - Raspberry Pi OS (APT) - gnupg
 * - Amazon Linux/RHEL/Fedora (DNF/YUM) - gnupg2-full or gnupg2
 * - Windows (winget/Chocolatey) - GnuPG
 * - Git Bash (Windows GPG) - configuration for Windows GPG
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
    console.log(`GPG is not available for ${platform.type}.`);
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
