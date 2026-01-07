#!/usr/bin/env node

/**
 * brewu - Update, upgrade, and cleanup Homebrew
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias brewu="brew update --quiet && brew upgrade && brew cleanup"
 *
 * This script performs a full Homebrew maintenance cycle:
 * 1. brew update --quiet  - Fetch latest formulae from Homebrew's git repository
 * 2. brew upgrade         - Upgrade all outdated packages to their latest versions
 * 3. brew cleanup         - Remove old versions of installed packages to free disk space
 *
 * This is a common maintenance routine that keeps your Homebrew installation
 * up-to-date and prevents disk space bloat from accumulated old package versions.
 *
 * @module scripts/brewu
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const { spawnSync } = require('child_process');

/**
 * Check if Homebrew is installed and available in PATH.
 *
 * Uses the shell utility to search for the `brew` command in PATH.
 * This works on both macOS and Linux where Linuxbrew may be installed.
 *
 * @returns {boolean} True if brew command is available, false otherwise
 */
function isBrewInstalled() {
  return shell.commandExists('brew');
}

/**
 * Run a brew subcommand with real-time output streaming.
 *
 * This helper function executes a single brew subcommand (like update, upgrade,
 * or cleanup) and streams the output directly to the console so users can see
 * progress in real-time. Returns the exit code so the caller can decide whether
 * to continue with the next step.
 *
 * @param {string} subcommand - The brew subcommand to run (e.g., 'update', 'upgrade')
 * @param {string[]} [subcommandArgs] - Additional arguments for the subcommand
 * @returns {number} The exit code from the brew command (0 = success)
 */
function runBrewCommand(subcommand, subcommandArgs = []) {
  const result = spawnSync('brew', [subcommand, ...subcommandArgs], {
    stdio: 'inherit',  // Stream output directly to console
    shell: false       // Run brew directly without shell interpretation
  });

  return result.status || 0;
}

/**
 * Pure Node.js implementation - not applicable for this command.
 *
 * This function cannot be implemented in pure Node.js because the `brew`
 * commands require Homebrew to be installed. The update/upgrade/cleanup
 * operations interact with Homebrew's internal package management system
 * which cannot be replicated without Homebrew itself.
 *
 * Platform-specific functions should NOT call this function. They should
 * either run the brew commands directly (on platforms with Homebrew support)
 * or display guidance about equivalent commands for their platform.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_brewu_nodejs(args) {
  throw new Error(
    'do_brewu_nodejs cannot be implemented in pure Node.js.\n' +
    'The Homebrew update/upgrade/cleanup commands require Homebrew to be installed.\n' +
    'Use the platform-specific functions instead.'
  );
}

/**
 * Run brew update, upgrade, and cleanup on macOS.
 *
 * macOS is the primary platform for Homebrew. This function checks if
 * Homebrew is installed and then runs the three-step maintenance cycle:
 * update (fetch latest formulae), upgrade (update packages), and cleanup
 * (remove old versions).
 *
 * The commands are run sequentially, stopping if any step fails. This
 * matches the behavior of the original alias which used && to chain commands.
 *
 * @param {string[]} args - Command line arguments (currently unused)
 * @returns {Promise<void>}
 */
async function do_brewu_macos(args) {
  // Check if Homebrew is installed
  if (!isBrewInstalled()) {
    console.error('Error: Homebrew is not installed.');
    console.error('');
    console.error('To install Homebrew, run:');
    console.error('  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    console.error('');
    console.error('Or use the devutils installer:');
    console.error('  dev install homebrew');
    process.exit(1);
  }

  // Step 1: Update Homebrew's formulae (fetch latest package info)
  // Using --quiet to reduce output noise during the fetch
  console.log('==> Updating Homebrew...');
  const updateCode = runBrewCommand('update', ['--quiet']);
  if (updateCode !== 0) {
    console.error('Error: brew update failed with exit code', updateCode);
    process.exit(updateCode);
  }

  // Step 2: Upgrade all outdated packages
  console.log('');
  console.log('==> Upgrading packages...');
  const upgradeCode = runBrewCommand('upgrade');
  if (upgradeCode !== 0) {
    console.error('Error: brew upgrade failed with exit code', upgradeCode);
    process.exit(upgradeCode);
  }

  // Step 3: Cleanup old versions to free disk space
  console.log('');
  console.log('==> Cleaning up...');
  const cleanupCode = runBrewCommand('cleanup');
  if (cleanupCode !== 0) {
    console.error('Error: brew cleanup failed with exit code', cleanupCode);
    process.exit(cleanupCode);
  }

  console.log('');
  console.log('Homebrew maintenance complete!');
}

/**
 * Run brew update, upgrade, and cleanup on Ubuntu.
 *
 * Homebrew (Linuxbrew) can be installed on Ubuntu and other Linux distributions.
 * This function checks if Homebrew is installed and runs the maintenance cycle.
 * If Homebrew is not installed, it provides guidance for both installing
 * Homebrew and using APT's built-in update commands.
 *
 * @param {string[]} args - Command line arguments (currently unused)
 * @returns {Promise<void>}
 */
async function do_brewu_ubuntu(args) {
  // Check if Homebrew is installed (Linuxbrew)
  if (!isBrewInstalled()) {
    console.error('Error: Homebrew (Linuxbrew) is not installed.');
    console.error('');
    console.error('On Ubuntu, you can either:');
    console.error('');
    console.error('1. Install Homebrew for Linux:');
    console.error('   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    console.error('');
    console.error('2. Use APT update commands instead:');
    console.error('   sudo apt update && sudo apt upgrade -y && sudo apt autoremove -y');
    console.error('');
    console.error('   Or use the devutils command:');
    console.error('   u                       # Updates system packages');
    process.exit(1);
  }

  // Run the same update/upgrade/cleanup cycle as macOS
  console.log('==> Updating Homebrew...');
  const updateCode = runBrewCommand('update', ['--quiet']);
  if (updateCode !== 0) {
    console.error('Error: brew update failed with exit code', updateCode);
    process.exit(updateCode);
  }

  console.log('');
  console.log('==> Upgrading packages...');
  const upgradeCode = runBrewCommand('upgrade');
  if (upgradeCode !== 0) {
    console.error('Error: brew upgrade failed with exit code', upgradeCode);
    process.exit(upgradeCode);
  }

  console.log('');
  console.log('==> Cleaning up...');
  const cleanupCode = runBrewCommand('cleanup');
  if (cleanupCode !== 0) {
    console.error('Error: brew cleanup failed with exit code', cleanupCode);
    process.exit(cleanupCode);
  }

  console.log('');
  console.log('Homebrew maintenance complete!');
}

/**
 * Run brew update, upgrade, and cleanup on Raspberry Pi OS.
 *
 * Homebrew can be installed on Raspberry Pi OS (64-bit ARM).
 * This function checks if Homebrew is installed and runs the maintenance cycle.
 * If not available, it provides guidance for APT-based updates.
 *
 * @param {string[]} args - Command line arguments (currently unused)
 * @returns {Promise<void>}
 */
async function do_brewu_raspbian(args) {
  // Check if Homebrew is installed
  if (!isBrewInstalled()) {
    console.error('Error: Homebrew is not installed.');
    console.error('');
    console.error('On Raspberry Pi OS, you can either:');
    console.error('');
    console.error('1. Install Homebrew (64-bit Raspberry Pi OS only):');
    console.error('   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    console.error('');
    console.error('2. Use APT update commands instead:');
    console.error('   sudo apt update && sudo apt upgrade -y && sudo apt autoremove -y');
    console.error('');
    console.error('   Or use the devutils command:');
    console.error('   u                       # Updates system packages');
    process.exit(1);
  }

  // Run the update/upgrade/cleanup cycle
  console.log('==> Updating Homebrew...');
  const updateCode = runBrewCommand('update', ['--quiet']);
  if (updateCode !== 0) {
    console.error('Error: brew update failed with exit code', updateCode);
    process.exit(updateCode);
  }

  console.log('');
  console.log('==> Upgrading packages...');
  const upgradeCode = runBrewCommand('upgrade');
  if (upgradeCode !== 0) {
    console.error('Error: brew upgrade failed with exit code', upgradeCode);
    process.exit(upgradeCode);
  }

  console.log('');
  console.log('==> Cleaning up...');
  const cleanupCode = runBrewCommand('cleanup');
  if (cleanupCode !== 0) {
    console.error('Error: brew cleanup failed with exit code', cleanupCode);
    process.exit(cleanupCode);
  }

  console.log('');
  console.log('Homebrew maintenance complete!');
}

/**
 * Run brew update, upgrade, and cleanup on Amazon Linux.
 *
 * Homebrew can be installed on Amazon Linux, though it's less common.
 * This function checks if Homebrew is installed and provides guidance
 * for DNF/YUM-based package manager updates if not available.
 *
 * @param {string[]} args - Command line arguments (currently unused)
 * @returns {Promise<void>}
 */
async function do_brewu_amazon_linux(args) {
  // Check if Homebrew is installed
  if (!isBrewInstalled()) {
    console.error('Error: Homebrew is not installed.');
    console.error('');
    console.error('On Amazon Linux, Homebrew is not the standard package manager.');
    console.error('');
    console.error('Use DNF/YUM update commands instead:');
    console.error('   sudo dnf upgrade -y && sudo dnf autoremove -y');
    console.error('   # or for older Amazon Linux:');
    console.error('   sudo yum update -y && sudo yum autoremove -y');
    console.error('');
    console.error('Or use the devutils command:');
    console.error('   u                       # Updates system packages');
    console.error('');
    console.error('To install Homebrew anyway:');
    console.error('   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    process.exit(1);
  }

  // Run the update/upgrade/cleanup cycle
  console.log('==> Updating Homebrew...');
  const updateCode = runBrewCommand('update', ['--quiet']);
  if (updateCode !== 0) {
    console.error('Error: brew update failed with exit code', updateCode);
    process.exit(updateCode);
  }

  console.log('');
  console.log('==> Upgrading packages...');
  const upgradeCode = runBrewCommand('upgrade');
  if (upgradeCode !== 0) {
    console.error('Error: brew upgrade failed with exit code', upgradeCode);
    process.exit(upgradeCode);
  }

  console.log('');
  console.log('==> Cleaning up...');
  const cleanupCode = runBrewCommand('cleanup');
  if (cleanupCode !== 0) {
    console.error('Error: brew cleanup failed with exit code', cleanupCode);
    process.exit(cleanupCode);
  }

  console.log('');
  console.log('Homebrew maintenance complete!');
}

/**
 * Handle brewu command in Windows Command Prompt.
 *
 * Homebrew is not available on Windows. This function informs the user
 * and provides guidance for equivalent package manager update commands using
 * Chocolatey or winget.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_brewu_cmd(args) {
  console.error('Error: Homebrew is not available on Windows.');
  console.error('');
  console.error('Windows uses different package managers. Try these alternatives:');
  console.error('');
  console.error('For Chocolatey (if installed):');
  console.error('   choco upgrade all -y    # Upgrade all packages');
  console.error('');
  console.error('For winget (Windows Package Manager):');
  console.error('   winget upgrade --all    # Upgrade all packages');
  console.error('');
  console.error('Or use the devutils command:');
  console.error('   u                       # Updates system packages');
  process.exit(1);
}

/**
 * Handle brewu command in Windows PowerShell.
 *
 * Homebrew is not available on Windows. This function informs the user
 * and provides guidance for equivalent package manager update commands.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_brewu_powershell(args) {
  console.error('Error: Homebrew is not available on Windows.');
  console.error('');
  console.error('Windows uses different package managers. Try these alternatives:');
  console.error('');
  console.error('For Chocolatey (if installed):');
  console.error('   choco upgrade all -y    # Upgrade all packages');
  console.error('');
  console.error('For winget (Windows Package Manager):');
  console.error('   winget upgrade --all    # Upgrade all packages');
  console.error('');
  console.error('For Windows Update via PowerShell:');
  console.error('   Install-Module PSWindowsUpdate -Force');
  console.error('   Get-WindowsUpdate');
  console.error('   Install-WindowsUpdate -AcceptAll');
  console.error('');
  console.error('Or use the devutils command:');
  console.error('   u                       # Updates system packages');
  process.exit(1);
}

/**
 * Run brew update, upgrade, and cleanup from Git Bash on Windows.
 *
 * Git Bash runs on Windows where Homebrew is not natively available.
 * However, if the user has installed Homebrew in WSL or another Linux
 * environment, it may be accessible. This function checks for brew
 * availability and provides appropriate guidance.
 *
 * @param {string[]} args - Command line arguments (currently unused)
 * @returns {Promise<void>}
 */
async function do_brewu_gitbash(args) {
  // Check if Homebrew is available (unlikely in Git Bash, but possible via WSL interop)
  if (isBrewInstalled()) {
    // Brew is somehow available, run it
    console.log('==> Updating Homebrew...');
    const updateCode = runBrewCommand('update', ['--quiet']);
    if (updateCode !== 0) {
      console.error('Error: brew update failed with exit code', updateCode);
      process.exit(updateCode);
    }

    console.log('');
    console.log('==> Upgrading packages...');
    const upgradeCode = runBrewCommand('upgrade');
    if (upgradeCode !== 0) {
      console.error('Error: brew upgrade failed with exit code', upgradeCode);
      process.exit(upgradeCode);
    }

    console.log('');
    console.log('==> Cleaning up...');
    const cleanupCode = runBrewCommand('cleanup');
    if (cleanupCode !== 0) {
      console.error('Error: brew cleanup failed with exit code', cleanupCode);
      process.exit(cleanupCode);
    }

    console.log('');
    console.log('Homebrew maintenance complete!');
    return;
  }

  // Homebrew not available, provide guidance
  console.error('Error: Homebrew is not available in Git Bash on Windows.');
  console.error('');
  console.error('Git Bash runs on Windows which uses different package managers.');
  console.error('');
  console.error('Options:');
  console.error('');
  console.error('1. Use Chocolatey (from PowerShell or CMD):');
  console.error('   choco upgrade all -y    # Upgrade all packages');
  console.error('');
  console.error('2. Use winget (Windows Package Manager):');
  console.error('   winget upgrade --all    # Upgrade all packages');
  console.error('');
  console.error('3. If you have WSL installed, you can run brew commands there:');
  console.error('   wsl brew update && wsl brew upgrade && wsl brew cleanup');
  console.error('');
  console.error('Or use the devutils command:');
  console.error('   u                       # Updates system packages');
  process.exit(1);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Runs a full Homebrew maintenance cycle: update, upgrade, and cleanup.
 * This is equivalent to running:
 *   brew update --quiet && brew upgrade && brew cleanup
 *
 * The update step fetches the latest package information from Homebrew's
 * repository. The upgrade step updates all outdated packages to their
 * latest versions. The cleanup step removes old versions of packages
 * to free up disk space.
 *
 * On platforms where Homebrew is not available, provides guidance for
 * equivalent update commands using the native package manager.
 *
 * @param {string[]} args - Command line arguments (currently unused)
 * @returns {Promise<void>}
 */
async function do_brewu(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_brewu_macos,
    'ubuntu': do_brewu_ubuntu,
    'raspbian': do_brewu_raspbian,
    'amazon_linux': do_brewu_amazon_linux,
    'cmd': do_brewu_cmd,
    'powershell': do_brewu_powershell,
    'gitbash': do_brewu_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    // Handle other Linux distros that might have Homebrew
    if (platform.type === 'debian' || platform.type === 'fedora' ||
        platform.type === 'rhel' || platform.type === 'linux') {
      // Try ubuntu handler as fallback for generic Linux
      await do_brewu_ubuntu(args);
      return;
    }

    // Handle Windows platform type
    if (platform.type === 'windows') {
      await do_brewu_cmd(args);
      return;
    }

    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('The brewu command is a shortcut for Homebrew maintenance:');
    console.error('  brew update --quiet && brew upgrade && brew cleanup');
    console.error('');
    console.error('Homebrew is available on macOS and Linux.');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_brewu,
  do_brewu,
  do_brewu_nodejs,
  do_brewu_macos,
  do_brewu_ubuntu,
  do_brewu_raspbian,
  do_brewu_amazon_linux,
  do_brewu_cmd,
  do_brewu_powershell,
  do_brewu_gitbash
};

if (require.main === module) {
  do_brewu(process.argv.slice(2));
}
