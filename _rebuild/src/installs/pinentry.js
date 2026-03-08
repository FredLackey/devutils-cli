#!/usr/bin/env node

/**
 * @fileoverview Install Pinentry - secure passphrase dialog for GPG.
 *
 * Pinentry is a collection of small dialog programs that allow GnuPG (GPG) and
 * other programs to read passphrases and PIN numbers in a secure manner. It is
 * an essential companion to GPG, providing the graphical or text-based interface
 * that prompts users to enter their passphrase when performing cryptographic
 * operations such as signing Git commits, decrypting files, or managing GPG keys.
 *
 * Pinentry ensures that entered information is:
 * - Not swapped to disk
 * - Not temporarily stored anywhere accessible to other processes
 * - Protected from screen capture and keystroke logging where possible
 * - Displayed in a trusted, secure dialog
 *
 * Without a properly configured pinentry program, GPG operations that require
 * a passphrase will fail with "No pinentry" errors.
 *
 * @module installs/pinentry
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');
const winget = require('../utils/windows/winget');

/**
 * Install Pinentry on macOS using Homebrew.
 *
 * On macOS, this installs pinentry-mac, which provides a native macOS dialog
 * for entering GPG passphrases. The pinentry-mac integration enables passphrase
 * entry in GUI applications and optionally stores passphrases in macOS Keychain.
 *
 * After installation, the GPG agent is configured to use pinentry-mac and the
 * agent is restarted to apply the configuration.
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

  // Check if pinentry-mac is already installed via Homebrew
  // Note: We check the Homebrew formula to ensure we manage the Homebrew version
  const isPinentryInstalled = await brew.isFormulaInstalled('pinentry-mac');
  if (isPinentryInstalled) {
    console.log('Pinentry-mac is already installed via Homebrew, skipping...');
    return;
  }

  // Install pinentry-mac using Homebrew
  // This provides a native macOS dialog for entering GPG passphrases
  console.log('Installing pinentry-mac via Homebrew...');
  const result = await brew.install('pinentry-mac');

  if (!result.success) {
    console.log('Failed to install pinentry-mac via Homebrew.');
    console.log(result.output);
    return;
  }

  // Configure GPG agent to use pinentry-mac
  // This creates the ~/.gnupg directory with proper permissions and
  // configures gpg-agent.conf to use the Homebrew-installed pinentry-mac
  console.log('Configuring GPG agent to use pinentry-mac...');
  const configCommands = [
    // Create GnuPG configuration directory with secure permissions
    'mkdir -p ~/.gnupg',
    'chmod 700 ~/.gnupg',
    // Use brew --prefix to get the correct path for both Intel and Apple Silicon Macs
    // Intel Macs: /usr/local/bin/pinentry-mac
    // Apple Silicon Macs: /opt/homebrew/bin/pinentry-mac
    'echo "pinentry-program $(brew --prefix)/bin/pinentry-mac" >> ~/.gnupg/gpg-agent.conf',
    // Restart the GPG agent to apply the new configuration
    'gpgconf --kill gpg-agent'
  ].join(' && ');

  const configResult = await shell.exec(configCommands);

  if (configResult.code !== 0) {
    console.log('Warning: Failed to configure GPG agent. You may need to configure pinentry-mac manually.');
    console.log('Add this line to ~/.gnupg/gpg-agent.conf:');
    console.log('  pinentry-program /opt/homebrew/bin/pinentry-mac  (Apple Silicon)');
    console.log('  pinentry-program /usr/local/bin/pinentry-mac    (Intel)');
  }

  // Verify the installation succeeded by checking if the formula is now installed
  const verified = await brew.isFormulaInstalled('pinentry-mac');
  if (!verified) {
    console.log('Installation may have failed: pinentry-mac formula not found after install.');
    return;
  }

  console.log('Pinentry-mac installed successfully via Homebrew.');
  console.log('');
  console.log('A native macOS dialog will now appear when GPG needs your passphrase.');
  console.log('You can optionally save passphrases in macOS Keychain.');
}

/**
 * Install Pinentry on Ubuntu/Debian using APT.
 *
 * Ubuntu and Debian provide multiple pinentry variants. This function installs
 * pinentry-curses, which is suitable for both desktop and server environments.
 * For desktop-only systems, consider installing pinentry-gnome3 for a native
 * GNOME dialog experience.
 *
 * Available pinentry packages:
 * - pinentry-curses: Text-based curses dialog (servers, SSH sessions, terminals)
 * - pinentry-gnome3: GNOME 3 native dialog (GNOME desktop environments)
 * - pinentry-qt: Qt-based dialog (KDE/Qt desktop environments)
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if pinentry is already installed by looking for the command
  // The 'pinentry' command is a symlink to the installed pinentry variant
  const isInstalled = shell.commandExists('pinentry');
  if (isInstalled) {
    console.log('Pinentry is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest version
  // from the repositories
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install pinentry-curses using APT
  // pinentry-curses works in both terminal and desktop environments
  // For headless servers and SSH sessions, this is the most reliable choice
  console.log('Installing pinentry-curses via APT...');
  const result = await apt.install('pinentry-curses');

  if (!result.success) {
    console.log('Failed to install pinentry-curses via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('pinentry');
  if (!verified) {
    console.log('Installation may have failed: pinentry command not found after install.');
    return;
  }

  console.log('Pinentry installed successfully.');
  console.log('');
  console.log('For desktop environments, you may also want to install:');
  console.log('  sudo apt-get install pinentry-gnome3  (for GNOME)');
  console.log('  sudo apt-get install pinentry-qt      (for KDE)');
}

/**
 * Install Pinentry on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL provides a full Ubuntu environment within Windows, so pinentry installation
 * follows the same APT-based process as native Ubuntu. For terminal-only WSL usage,
 * pinentry-curses is installed by default.
 *
 * For WSL with GUI support (WSLg), you may want to install pinentry-gnome3 instead.
 *
 * Note: The GPG_TTY environment variable should be set for pinentry to work
 * correctly in WSL terminals. Add 'export GPG_TTY=$(tty)' to ~/.bashrc.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();

  // Provide additional guidance specific to WSL
  console.log('');
  console.log('WSL-specific note: Ensure GPG_TTY is set in your shell profile:');
  console.log("  echo 'export GPG_TTY=$(tty)' >> ~/.bashrc");
  console.log('  source ~/.bashrc');
}

/**
 * Install Pinentry on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so pinentry installation follows the same
 * APT-based process as Ubuntu/Debian. Pinentry works on both 32-bit (armhf) and
 * 64-bit (arm64) ARM architectures.
 *
 * For headless Raspberry Pi systems (the most common use case), pinentry-curses
 * is installed. For Raspberry Pi with desktop environment, pinentry-gnome3 can
 * be installed separately.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install Pinentry on Amazon Linux using DNF or YUM.
 *
 * Amazon Linux 2023 uses DNF as the default package manager, while Amazon Linux 2
 * uses YUM. This function detects the available package manager and installs the
 * appropriate pinentry package.
 *
 * The pinentry package on Amazon Linux provides pinentry-curses, which is suitable
 * for the server environment typical of EC2 instances.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if pinentry is already installed by looking for the command
  const isInstalled = shell.commandExists('pinentry');
  if (isInstalled) {
    console.log('Pinentry is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  if (packageManager === 'dnf') {
    // Amazon Linux 2023: Install pinentry via DNF
    console.log('Installing pinentry via DNF...');
    const result = await shell.exec('sudo dnf install -y pinentry');

    if (result.code !== 0) {
      console.log('Failed to install pinentry via DNF.');
      console.log(result.stderr || result.stdout);
      return;
    }
  } else {
    // Amazon Linux 2: Install pinentry via YUM
    console.log('Installing pinentry via YUM...');
    const result = await shell.exec('sudo yum install -y pinentry');

    if (result.code !== 0) {
      console.log('Failed to install pinentry via YUM.');
      console.log(result.stderr || result.stdout);
      return;
    }
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('pinentry');
  if (!verified) {
    console.log('Installation may have failed: pinentry command not found after install.');
    return;
  }

  console.log('Pinentry installed successfully.');
  console.log('');
  console.log('For server environments, ensure GPG_TTY is set:');
  console.log("  echo 'export GPG_TTY=$(tty)' >> ~/.bashrc");
}

/**
 * Install Pinentry on Windows using winget or Chocolatey.
 *
 * On Windows, pinentry is bundled with GnuPG. You do not install pinentry
 * separately. Installing GnuPG via winget or Chocolatey automatically includes
 * pinentry-basic.exe.
 *
 * This function checks if GnuPG (and thus pinentry) is already installed. If not,
 * it installs GnuPG which includes the pinentry components.
 *
 * Pinentry executables included with GnuPG:
 * - pinentry-basic.exe: Simple Windows dialog (always included)
 * - pinentry-qt.exe: Qt-based GUI dialog (included with Gpg4win)
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if pinentry is already installed by looking for the command
  // Pinentry comes bundled with GnuPG on Windows
  const isPinentryInstalled = shell.commandExists('pinentry-basic');
  if (isPinentryInstalled) {
    console.log('Pinentry is already installed (bundled with GnuPG), skipping...');
    return;
  }

  // Check if GPG is installed but pinentry-basic is not in PATH
  // This can happen if GnuPG is installed but PATH is not updated
  const isGpgInstalled = shell.commandExists('gpg');
  if (isGpgInstalled) {
    console.log('GnuPG is installed. Pinentry should be available at:');
    console.log('  C:\\Program Files (x86)\\GnuPG\\bin\\pinentry-basic.exe');
    console.log('');
    console.log('If pinentry is not working, close and reopen your terminal');
    console.log('for PATH changes to take effect.');
    return;
  }

  // Pinentry is not installed - need to install GnuPG which includes it
  console.log('Pinentry is bundled with GnuPG on Windows.');
  console.log('Installing GnuPG (which includes pinentry)...');

  // Prefer winget if available, fall back to Chocolatey
  if (winget.isInstalled()) {
    console.log('Installing GnuPG via winget...');
    const result = await winget.install('GnuPG.GnuPG');

    if (result.success) {
      console.log('GnuPG (with pinentry) installed successfully via winget.');
      console.log('');
      console.log('Note: Close and reopen your terminal for PATH changes to take effect.');
      console.log('Pinentry will be available at:');
      console.log('  C:\\Program Files (x86)\\GnuPG\\bin\\pinentry-basic.exe');
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

    console.log('GnuPG (with pinentry) installed successfully via Chocolatey.');
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
 * Install Pinentry on Git Bash (Windows).
 *
 * Git Bash on Windows does not include a usable pinentry installation. Git for
 * Windows ships with an older GPG 1.4.x in the MinGW environment, which is
 * insufficient for modern use cases.
 *
 * This function checks if Windows GPG (which includes pinentry) is installed and
 * configures Git to use it. If Windows GPG is not available, it provides guidance
 * to install it.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if Windows GPG is available at the standard location
  // Windows GPG includes pinentry-basic.exe in the same directory
  const windowsGpgPath = '/c/Program Files (x86)/GnuPG/bin/gpg.exe';
  const windowsPinentryPath = '/c/Program Files (x86)/GnuPG/bin/pinentry-basic.exe';

  const checkResult = await shell.exec(`test -f "${windowsPinentryPath}"`);
  const hasWindowsPinentry = checkResult.code === 0;

  if (hasWindowsPinentry) {
    console.log('Windows pinentry is installed. Configuring Git to use Windows GPG...');

    // Configure Git to use the Windows GPG installation (which includes pinentry)
    const configResult = await shell.exec(
      `git config --global gpg.program "${windowsGpgPath}"`
    );

    if (configResult.code === 0) {
      console.log('Git configured to use Windows GPG (with pinentry) successfully.');
      console.log('');
      console.log('You can verify with: git config --global gpg.program');
      console.log('');
      console.log('Pinentry is available at:');
      console.log('  /c/Program Files (x86)/GnuPG/bin/pinentry-basic.exe');
    } else {
      console.log('Warning: Failed to configure Git to use Windows GPG.');
      console.log('You can configure it manually with:');
      console.log(`  git config --global gpg.program "${windowsGpgPath}"`);
    }
    return;
  }

  // Windows GPG (and thus pinentry) is not installed - provide guidance
  console.log('Windows GPG (which includes pinentry) is not installed.');
  console.log('');
  console.log('To use pinentry in Git Bash, you need to install GPG on Windows first.');
  console.log('Open an Administrator PowerShell and run:');
  console.log('');
  console.log('  winget install --id GnuPG.GnuPG --silent --accept-package-agreements');
  console.log('');
  console.log('Or run: dev install gpg (from Windows PowerShell or Command Prompt)');
  console.log('');
  console.log('After installing, run this command again to configure Git.');
}

/**
 * Check if Pinentry is already installed on the system.
 *
 * This function checks for Pinentry installation using platform-appropriate methods:
 * - macOS: Checks if 'pinentry-mac' Homebrew formula is installed
 * - Windows: Checks if 'pinentry-basic' command exists (bundled with GnuPG)
 * - Linux/Git Bash: Checks if 'pinentry' command exists in PATH
 *
 * @returns {Promise<boolean>} True if Pinentry is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    return brew.isFormulaInstalled('pinentry-mac');
  }

  if (platform.type === 'windows') {
    return shell.commandExists('pinentry-basic');
  }

  // Linux and Git Bash: Check if pinentry command exists
  return shell.commandExists('pinentry');
}

/**
 * Check if this installer is supported on the current platform.
 * Pinentry is supported on all major platforms.
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
 * appropriate platform-specific installer function. Pinentry is supported on all
 * major platforms:
 *
 * - macOS (Homebrew) - pinentry-mac (native macOS dialog)
 * - Ubuntu/Debian (APT) - pinentry-curses (text-based dialog)
 * - Ubuntu on WSL (APT) - pinentry-curses (text-based dialog)
 * - Raspberry Pi OS (APT) - pinentry-curses (text-based dialog)
 * - Amazon Linux/RHEL/Fedora (DNF/YUM) - pinentry (text-based dialog)
 * - Windows (winget/Chocolatey) - pinentry-basic (bundled with GnuPG)
 * - Git Bash (Windows GPG) - configuration for Windows GPG pinentry
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
    console.log(`Pinentry is not available for ${platform.type}.`);
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
