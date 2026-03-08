#!/usr/bin/env node

/**
 * @fileoverview Install tmux - a terminal multiplexer for Unix-like systems.
 *
 * tmux is a terminal multiplexer that allows you to create, access, and control
 * multiple terminal sessions from a single screen. Originally developed by
 * Nicholas Marriott and first released in 2007, tmux has become an essential tool
 * for developers, system administrators, and power users who work extensively in
 * the command line.
 *
 * tmux enables you to:
 * - Run multiple terminal sessions within a single window
 * - Detach from sessions and reattach later (even from a different computer)
 * - Split your terminal into multiple panes for side-by-side work
 * - Keep processes running after disconnecting from SSH
 * - Share terminal sessions with other users
 * - Create persistent workspaces that survive terminal crashes
 *
 * @module installs/tmux
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');

/**
 * Install tmux on macOS using Homebrew.
 *
 * This function installs tmux via Homebrew, which is the recommended method for
 * macOS. Homebrew automatically installs the required dependencies (libevent,
 * ncurses, and utf8proc) as part of the installation process.
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

  // Check if tmux is already installed by verifying the command exists
  // This provides idempotency - running the script multiple times is safe
  const isInstalled = shell.commandExists('tmux');
  if (isInstalled) {
    console.log('tmux is already installed, skipping...');
    return;
  }

  // Install tmux using Homebrew
  // The brew.install function handles the --quiet flag internally for cleaner output
  // Dependencies (libevent, ncurses, utf8proc) are installed automatically
  console.log('Installing tmux via Homebrew...');
  const result = await brew.install('tmux');

  if (!result.success) {
    console.log('Failed to install tmux via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  // This catches edge cases where the install reports success but the binary is not available
  const verified = shell.commandExists('tmux');
  if (!verified) {
    console.log('Installation may have failed: tmux command not found after install.');
    return;
  }

  console.log('tmux installed successfully.');
}

/**
 * Install tmux on Ubuntu/Debian using APT.
 *
 * tmux is available in the default Ubuntu and Debian repositories, so no
 * additional PPAs or repositories are required. The repository version may
 * be slightly older than the latest release, but is stable and recommended
 * for most users.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if tmux is already installed by looking for the command
  // This ensures idempotency - the script can be run multiple times safely
  const isInstalled = shell.commandExists('tmux');
  if (isInstalled) {
    console.log('tmux is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest available version
  // This is especially important if the package cache is stale
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    // Continue with installation even if update fails - the package may still be available
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install tmux using APT
  // The apt.install function uses DEBIAN_FRONTEND=noninteractive and -y flag
  // to ensure fully automated installation without prompts
  console.log('Installing tmux via APT...');
  const result = await apt.install('tmux');

  if (!result.success) {
    console.log('Failed to install tmux via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  // This confirms the package was installed correctly and is accessible
  const verified = shell.commandExists('tmux');
  if (!verified) {
    console.log('Installation may have failed: tmux command not found after install.');
    return;
  }

  console.log('tmux installed successfully.');
}

/**
 * Install tmux on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL Ubuntu installations follow the same process as native Ubuntu using APT.
 * This function delegates to install_ubuntu() because WSL provides a full
 * Ubuntu environment with APT package management. tmux works seamlessly in WSL
 * and provides the same functionality as on native Linux.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  // The installation process is identical because WSL provides a full Linux environment
  await install_ubuntu();
}

/**
 * Install tmux on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so tmux installation follows the same
 * process as Ubuntu/Debian. The tmux package is available for both 32-bit (armv7l)
 * and 64-bit (aarch64) ARM architectures. The repository version may be slightly
 * older than on Ubuntu or Homebrew, but is fully functional.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  // The tmux package works on both 32-bit and 64-bit ARM architectures
  await install_ubuntu();
}

/**
 * Install tmux on Amazon Linux using DNF or YUM.
 *
 * tmux is available in the default Amazon Linux repositories. This function
 * automatically detects whether to use dnf (Amazon Linux 2023) or yum
 * (Amazon Linux 2) based on the available package manager on the system.
 *
 * Note: Amazon Linux 2 reaches end of support on June 30, 2026. Users should
 * consider migrating to Amazon Linux 2023 for long-term support.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if tmux is already installed by looking for the command
  // This ensures the script is idempotent and safe to run multiple times
  const isInstalled = shell.commandExists('tmux');
  if (isInstalled) {
    console.log('tmux is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, while Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Construct the install command based on available package manager
  // The -y flag automatically confirms installation prompts for non-interactive execution
  const installCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y tmux'
    : 'sudo yum install -y tmux';

  // Install tmux using the detected package manager
  console.log(`Installing tmux via ${packageManager}...`);
  const result = await shell.exec(installCommand);

  if (result.code !== 0) {
    console.log(`Failed to install tmux via ${packageManager}.`);
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('tmux');
  if (!verified) {
    console.log('Installation may have failed: tmux command not found after install.');
    return;
  }

  console.log('tmux installed successfully.');
}

/**
 * Display informational message for Windows users.
 *
 * tmux is a Unix-native application and does not run natively on Windows.
 * This function provides a graceful message informing Windows users that
 * tmux is not available on their platform. Users running WSL will be
 * handled by the install_ubuntu_wsl() function instead.
 *
 * Note: While tmux can technically run in Cygwin or MSYS2, these approaches
 * are not recommended for production use. WSL provides better integration
 * and performance for running tmux on Windows.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // tmux is a Unix-native application that relies on Unix-specific features
  // like pseudo-terminals (ptys) and does not run natively on Windows
  // Return gracefully without throwing an error
  console.log('tmux is not available for Windows.');
  return;
}

/**
 * Display informational message for Git Bash users.
 *
 * While tmux can technically be installed in Git Bash through MSYS2 by copying
 * binaries and DLLs, this approach requires additional manual setup and only
 * works with the MinTTY terminal. This function provides a graceful message
 * rather than attempting a complex installation that may not work reliably.
 *
 * For users who need tmux on Windows, WSL (Windows Subsystem for Linux)
 * provides a better experience with full Linux environment support.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // tmux in Git Bash requires copying binaries from a full MSYS2 installation
  // This is complex and only works with MinTTY terminal (git-bash.exe)
  // Return gracefully without throwing an error
  console.log('tmux is not available for Git Bash.');
  return;
}

/**
 * Check if tmux is installed on the current system.
 * @returns {Promise<boolean>} True if tmux is installed
 */
async function isInstalled() {
  const platform = os.detect();
  if (platform.type === 'macos') {
    return brew.isFormulaInstalled('tmux');
  }
  return shell.commandExists('tmux');
}

/**
 * Check if this installer is supported on the current platform.
 * tmux is only available on Unix-like systems (not Windows/Git Bash).
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. The function handles
 * unsupported platforms gracefully by displaying a message without throwing errors.
 *
 * Supported platforms:
 * - macOS (Homebrew)
 * - Ubuntu/Debian (APT)
 * - Ubuntu on WSL (APT)
 * - Raspberry Pi OS (APT)
 * - Amazon Linux/RHEL (DNF/YUM)
 *
 * Unsupported platforms (graceful message):
 * - Windows (native)
 * - Git Bash
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
    console.log(`tmux is not available for ${platform.type}.`);
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
