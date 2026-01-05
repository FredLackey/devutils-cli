#!/usr/bin/env node

/**
 * @fileoverview Install procps - a collection of Linux process monitoring utilities.
 *
 * procps (or procps-ng, the "next generation" fork) provides essential command-line
 * utilities for monitoring system processes and resources on Linux systems. These
 * utilities read information from the /proc pseudo-filesystem.
 *
 * Key utilities included in procps:
 * - ps: Display a snapshot of current processes
 * - top: Interactive real-time process viewer
 * - free: Display memory usage
 * - vmstat: Report virtual memory statistics
 * - pgrep/pkill: Find and signal processes by name
 * - uptime: Show system uptime and load average
 * - watch: Execute a command periodically
 *
 * IMPORTANT: procps is Linux-specific and requires the /proc filesystem.
 * It is NOT available on macOS, Windows, or Git Bash. These platforms have
 * their own native process monitoring tools.
 *
 * @module installs/procps
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const apt = require('../utils/ubuntu/apt');

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Checks if the 'ps' command from procps is available.
 * This is the primary indicator that procps utilities are installed.
 *
 * Note: On macOS and BSD systems, a different 'ps' (BSD variant) exists,
 * so this check is only meaningful on Linux systems.
 *
 * @returns {boolean} - True if ps command exists in PATH
 */
function isPsInstalled() {
  return shell.commandExists('ps');
}

/**
 * Checks if the 'free' command is available.
 * The 'free' command is part of procps and does not exist on macOS/BSD,
 * making it a reliable indicator of procps installation on Linux.
 *
 * @returns {boolean} - True if free command exists in PATH
 */
function isFreeInstalled() {
  return shell.commandExists('free');
}

/**
 * Checks if procps utilities are functional by verifying both 'ps' and 'free'
 * commands are available. This combined check is more reliable than checking
 * a single command because 'ps' might exist as a BSD variant on some systems.
 *
 * @returns {boolean} - True if core procps utilities are available
 */
function areProcpsUtilitiesInstalled() {
  return isPsInstalled() && isFreeInstalled();
}

// -----------------------------------------------------------------------------
// Platform-Specific Installation Functions
// -----------------------------------------------------------------------------

/**
 * Handle procps on macOS.
 *
 * procps is NOT available on macOS because it relies on the /proc filesystem
 * which does not exist on macOS. macOS uses a different kernel architecture
 * (XNU/Darwin) that exposes process information through different mechanisms.
 *
 * macOS provides equivalent functionality through built-in commands:
 * - ps (BSD variant with different options)
 * - top (interactive process viewer)
 * - vm_stat (memory statistics)
 * - pgrep/pkill (find/signal processes by name)
 * - uptime (system uptime)
 *
 * The only procps utility not natively available on macOS is 'watch',
 * which can be installed via Homebrew if needed.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // procps is not available on macOS - gracefully inform the user
  console.log('procps is not available for macOS.');
  return;
}

/**
 * Install procps on Ubuntu/Debian using APT.
 *
 * procps is typically pre-installed on Ubuntu and Debian systems as it
 * contains essential system utilities. This function ensures it is installed
 * or updates it to the latest version from the repositories.
 *
 * The installation uses DEBIAN_FRONTEND=noninteractive to ensure fully
 * automated installation without interactive prompts.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if procps is already installed by verifying core utilities
  // We check both 'ps' and 'free' because 'ps' alone might be a BSD variant
  if (areProcpsUtilitiesInstalled()) {
    // Double-check by querying dpkg for the package
    const packageInstalled = await apt.isPackageInstalled('procps');
    if (packageInstalled) {
      console.log('procps is already installed, skipping...');
      return;
    }
  }

  console.log('Installing procps via APT...');

  // Update package lists first to ensure we have the latest package information
  // This prevents "package not found" errors on fresh systems
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install procps with non-interactive mode and auto-confirm
  // DEBIAN_FRONTEND=noninteractive prevents any interactive prompts
  // The -y flag automatically answers "yes" to confirmation prompts
  console.log('Installing procps package...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y procps');

  if (installResult.code !== 0) {
    console.log('Failed to install procps via APT.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify installation succeeded by checking if core utilities are now available
  if (!areProcpsUtilitiesInstalled()) {
    console.log('Installation may have failed: procps utilities not found after install.');
    return;
  }

  console.log('procps installed successfully.');
}

/**
 * Install procps on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL provides a full Linux environment where procps works exactly as it
 * does on native Linux, including access to the /proc filesystem. The
 * installation process is identical to native Ubuntu using APT.
 *
 * Note: In WSL, procps utilities show information about the WSL virtual
 * machine, not the Windows host. For Windows host information, users
 * should use native Windows tools.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();
}

/**
 * Install procps on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so procps installation follows the
 * same process as Ubuntu/Debian. procps is typically pre-installed on
 * Raspberry Pi OS as it contains essential system utilities.
 *
 * The ARM-compatible version of procps is automatically installed by APT.
 * Installation may take slightly longer on older Raspberry Pi models due
 * to slower I/O and processor speeds.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if procps is already installed by verifying core utilities
  if (areProcpsUtilitiesInstalled()) {
    // Double-check by querying dpkg for the package
    const packageInstalled = await apt.isPackageInstalled('procps');
    if (packageInstalled) {
      console.log('procps is already installed, skipping...');
      return;
    }
  }

  console.log('Installing procps via APT...');

  // Update package lists first to ensure we have the latest package information
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install procps with non-interactive mode and auto-confirm
  console.log('Installing procps package...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y procps');

  if (installResult.code !== 0) {
    console.log('Failed to install procps via APT.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify installation succeeded
  if (!areProcpsUtilitiesInstalled()) {
    console.log('Installation may have failed: procps utilities not found after install.');
    return;
  }

  console.log('procps installed successfully.');
}

/**
 * Install procps-ng on Amazon Linux/RHEL using DNF or YUM.
 *
 * On RHEL-based systems (including Amazon Linux), the package is named
 * 'procps-ng' (next generation) rather than 'procps'. The function
 * automatically detects whether to use DNF (AL2023, Fedora) or YUM (AL2).
 *
 * procps-ng is typically pre-installed on Amazon Linux as it contains
 * essential system utilities.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if procps utilities are already installed by verifying core commands
  if (areProcpsUtilitiesInstalled()) {
    console.log('procps-ng is already installed, skipping...');
    return;
  }

  // Detect which package manager is available
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const hasDnf = shell.commandExists('dnf');
  const packageManager = hasDnf ? 'dnf' : 'yum';

  console.log(`Installing procps-ng via ${packageManager}...`);

  // Install procps-ng (the package name on RHEL-based systems)
  // The -y flag automatically confirms installation prompts
  const installCommand = `sudo ${packageManager} install -y procps-ng`;
  const installResult = await shell.exec(installCommand);

  if (installResult.code !== 0) {
    console.log(`Failed to install procps-ng via ${packageManager}.`);
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify installation succeeded
  if (!areProcpsUtilitiesInstalled()) {
    console.log('Installation may have failed: procps utilities not found after install.');
    return;
  }

  console.log('procps-ng installed successfully.');
}

/**
 * Handle procps on Windows.
 *
 * procps is NOT available on Windows because it relies on the /proc
 * filesystem which does not exist on Windows. Windows uses a completely
 * different process and memory management architecture.
 *
 * Windows provides equivalent functionality through built-in tools:
 * - Get-Process (PowerShell) or tasklist (CMD) for process listing
 * - Task Manager for interactive process viewing
 * - systeminfo or Get-CimInstance for memory information
 * - Stop-Process or taskkill for terminating processes
 *
 * For users who need Linux procps utilities on Windows, WSL (Windows
 * Subsystem for Linux) provides full procps support.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // procps is not available on Windows - gracefully inform the user
  console.log('procps is not available for Windows.');
  return;
}

/**
 * Handle procps on Git Bash.
 *
 * procps is NOT available for Git Bash because Git Bash provides a minimal
 * Unix-like environment on Windows that does not include a /proc filesystem
 * or Linux process management capabilities.
 *
 * Git Bash's built-in 'ps' command only shows processes in the current
 * bash session, not system-wide processes. For full process information,
 * users should use Windows native tools (tasklist.exe, taskkill.exe) or
 * WSL for full Linux compatibility.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // procps is not available for Git Bash - gracefully inform the user
  console.log('procps is not available for Git Bash.');
  return;
}

// -----------------------------------------------------------------------------
// Main Installation Entry Point
// -----------------------------------------------------------------------------

/**
 * Check if this installer is supported on the current platform.
 * procps is Linux-ONLY (requires /proc filesystem).
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  // procps requires /proc filesystem which only exists on Linux
  return ['ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically detects the current platform using os.detect()
 * and dispatches to the appropriate platform-specific installation function.
 *
 * procps is only available on Linux platforms:
 * - Ubuntu/Debian: procps package via APT
 * - Raspberry Pi OS: procps package via APT
 * - Amazon Linux/RHEL/Fedora: procps-ng package via DNF/YUM
 * - WSL: procps package via APT (same as Ubuntu)
 *
 * NOT supported (gracefully returns with message):
 * - macOS: Uses different kernel, no /proc filesystem
 * - Windows: Uses different architecture, no /proc filesystem
 * - Git Bash: Minimal Unix-like environment, no /proc filesystem
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installation functions
  // procps is only available on Linux-based platforms
  const installers = {
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,
    'wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'macos': install_macos,
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  // Find the appropriate installer for this platform
  const installer = installers[platform.type];

  // Handle completely unknown platforms gracefully (no error, just a message)
  if (!installer) {
    console.log(`procps is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
  await installer();
}

// -----------------------------------------------------------------------------
// Module Exports
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Direct Execution Handler
// -----------------------------------------------------------------------------

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
