#!/usr/bin/env node

/**
 * brewd - Run Homebrew doctor to check for potential problems
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias brewd="brew doctor"
 *
 * This script runs `brew doctor` which checks your Homebrew installation
 * for potential problems. It examines your system configuration, identifies
 * common issues, and provides suggestions for fixing them.
 *
 * Common issues detected by brew doctor include:
 * - Outdated Xcode Command Line Tools
 * - Conflicting software or libraries
 * - Permissions problems
 * - Unlinked kegs (installed packages not properly symlinked)
 * - Outdated formulae
 *
 * @module scripts/brewd
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');

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
 * Pure Node.js implementation - not applicable for this command.
 *
 * This function cannot be implemented in pure Node.js because `brew doctor`
 * is a Homebrew-specific command that performs system-level checks that
 * require Homebrew's internal knowledge of how it manages packages.
 *
 * Platform-specific functions should NOT call this function. They should
 * either run `brew doctor` directly (on platforms with Homebrew support)
 * or display guidance about equivalent commands for their platform.
 *
 * @param {string[]} args - Command line arguments (passed through to brew doctor)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_brewd_nodejs(args) {
  throw new Error(
    'do_brewd_nodejs cannot be implemented in pure Node.js.\n' +
    'The `brew doctor` command requires Homebrew to be installed.\n' +
    'Use the platform-specific functions instead.'
  );
}

/**
 * Run brew doctor on macOS.
 *
 * macOS is the primary platform for Homebrew. This function checks if
 * Homebrew is installed and runs `brew doctor` to diagnose potential
 * problems with the Homebrew installation.
 *
 * @param {string[]} args - Command line arguments to pass to brew doctor
 * @returns {Promise<void>}
 */
async function do_brewd_macos(args) {
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

  // Build the command with any additional arguments
  // Arguments could include things like --verbose or --debug
  const command = args.length > 0
    ? `brew doctor ${args.join(' ')}`
    : 'brew doctor';

  // Execute brew doctor and stream output directly to console
  // We use spawnAsync with stdio inheritance to preserve colors and formatting
  const { spawnSync } = require('child_process');

  const result = spawnSync('brew', ['doctor', ...args], {
    stdio: 'inherit',  // Pass through stdin/stdout/stderr for real-time output
    shell: false       // Run brew directly without shell interpretation
  });

  // Exit with the same code as brew doctor
  // brew doctor returns 0 if no problems found, non-zero otherwise
  process.exit(result.status || 0);
}

/**
 * Run brew doctor on Ubuntu.
 *
 * Homebrew (Linuxbrew) can be installed on Ubuntu and other Linux distributions.
 * This function checks if Homebrew is installed and runs `brew doctor`.
 * If Homebrew is not installed, it provides guidance for both installing
 * Homebrew and using APT's built-in diagnostic tools.
 *
 * @param {string[]} args - Command line arguments to pass to brew doctor
 * @returns {Promise<void>}
 */
async function do_brewd_ubuntu(args) {
  // Check if Homebrew is installed (Linuxbrew)
  if (!isBrewInstalled()) {
    console.error('Error: Homebrew (Linuxbrew) is not installed.');
    console.error('');
    console.error('On Ubuntu, you can either:');
    console.error('');
    console.error('1. Install Homebrew for Linux:');
    console.error('   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    console.error('');
    console.error('2. Use APT diagnostic commands instead:');
    console.error('   apt-get check           # Verify package dependencies');
    console.error('   dpkg --audit            # Check for broken packages');
    console.error('   apt-get -f install      # Fix broken dependencies');
    process.exit(1);
  }

  // Execute brew doctor with inherited stdio for real-time output
  const { spawnSync } = require('child_process');

  const result = spawnSync('brew', ['doctor', ...args], {
    stdio: 'inherit',
    shell: false
  });

  process.exit(result.status || 0);
}

/**
 * Run brew doctor on Raspberry Pi OS.
 *
 * Homebrew can be installed on Raspberry Pi OS (64-bit ARM).
 * This function checks if Homebrew is installed and runs `brew doctor`.
 * If not available, it provides guidance for APT-based diagnostics.
 *
 * @param {string[]} args - Command line arguments to pass to brew doctor
 * @returns {Promise<void>}
 */
async function do_brewd_raspbian(args) {
  // Check if Homebrew is installed
  if (!isBrewInstalled()) {
    console.error('Error: Homebrew is not installed.');
    console.error('');
    console.error('On Raspberry Pi OS, you can either:');
    console.error('');
    console.error('1. Install Homebrew (64-bit Raspberry Pi OS only):');
    console.error('   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    console.error('');
    console.error('2. Use APT diagnostic commands instead:');
    console.error('   apt-get check           # Verify package dependencies');
    console.error('   dpkg --audit            # Check for broken packages');
    console.error('   apt-get -f install      # Fix broken dependencies');
    process.exit(1);
  }

  // Execute brew doctor with inherited stdio
  const { spawnSync } = require('child_process');

  const result = spawnSync('brew', ['doctor', ...args], {
    stdio: 'inherit',
    shell: false
  });

  process.exit(result.status || 0);
}

/**
 * Run brew doctor on Amazon Linux.
 *
 * Homebrew can be installed on Amazon Linux, though it's less common.
 * This function checks if Homebrew is installed and provides guidance
 * for DNF/YUM-based package manager diagnostics if not available.
 *
 * @param {string[]} args - Command line arguments to pass to brew doctor
 * @returns {Promise<void>}
 */
async function do_brewd_amazon_linux(args) {
  // Check if Homebrew is installed
  if (!isBrewInstalled()) {
    console.error('Error: Homebrew is not installed.');
    console.error('');
    console.error('On Amazon Linux, Homebrew is not the standard package manager.');
    console.error('');
    console.error('Use DNF/YUM diagnostic commands instead:');
    console.error('   dnf check              # Check for package problems');
    console.error('   dnf repolist           # List configured repositories');
    console.error('   rpm -Va                # Verify all installed packages');
    console.error('');
    console.error('To install Homebrew anyway:');
    console.error('   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    process.exit(1);
  }

  // Execute brew doctor with inherited stdio
  const { spawnSync } = require('child_process');

  const result = spawnSync('brew', ['doctor', ...args], {
    stdio: 'inherit',
    shell: false
  });

  process.exit(result.status || 0);
}

/**
 * Handle brewd command in Windows Command Prompt.
 *
 * Homebrew is not available on Windows. This function informs the user
 * and provides guidance for equivalent package manager diagnostics using
 * Chocolatey or winget.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_brewd_cmd(args) {
  console.error('Error: Homebrew is not available on Windows.');
  console.error('');
  console.error('Windows uses different package managers. Try these alternatives:');
  console.error('');
  console.error('For Chocolatey (if installed):');
  console.error('   choco outdated         # Check for outdated packages');
  console.error('   choco list --local     # List installed packages');
  console.error('');
  console.error('For winget (Windows Package Manager):');
  console.error('   winget list            # List installed packages');
  console.error('   winget upgrade         # Check for available upgrades');
  console.error('');
  console.error('For system health checks:');
  console.error('   sfc /scannow           # System File Checker (run as Admin)');
  console.error('   DISM /Online /Cleanup-Image /CheckHealth');
  process.exit(1);
}

/**
 * Handle brewd command in Windows PowerShell.
 *
 * Homebrew is not available on Windows. This function informs the user
 * and provides guidance for equivalent package manager diagnostics.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_brewd_powershell(args) {
  console.error('Error: Homebrew is not available on Windows.');
  console.error('');
  console.error('Windows uses different package managers. Try these alternatives:');
  console.error('');
  console.error('For Chocolatey (if installed):');
  console.error('   choco outdated         # Check for outdated packages');
  console.error('   choco list --local     # List installed packages');
  console.error('');
  console.error('For winget (Windows Package Manager):');
  console.error('   winget list            # List installed packages');
  console.error('   winget upgrade         # Check for available upgrades');
  console.error('');
  console.error('For system health checks:');
  console.error('   sfc /scannow           # System File Checker (run as Admin)');
  console.error('   DISM /Online /Cleanup-Image /CheckHealth');
  console.error('');
  console.error('PowerShell modules check:');
  console.error('   Get-Module -ListAvailable  # List installed modules');
  process.exit(1);
}

/**
 * Run brew doctor from Git Bash on Windows.
 *
 * Git Bash runs on Windows where Homebrew is not natively available.
 * However, if the user has installed Homebrew in WSL or another Linux
 * environment, it may be accessible. This function checks for brew
 * availability and provides appropriate guidance.
 *
 * @param {string[]} args - Command line arguments to pass to brew doctor
 * @returns {Promise<void>}
 */
async function do_brewd_gitbash(args) {
  // Check if Homebrew is available (unlikely in Git Bash, but possible via WSL interop)
  if (isBrewInstalled()) {
    // Brew is somehow available, run it
    const { spawnSync } = require('child_process');

    const result = spawnSync('brew', ['doctor', ...args], {
      stdio: 'inherit',
      shell: false
    });

    process.exit(result.status || 0);
  }

  // Homebrew not available, provide guidance
  console.error('Error: Homebrew is not available in Git Bash on Windows.');
  console.error('');
  console.error('Git Bash runs on Windows which uses different package managers.');
  console.error('');
  console.error('Options:');
  console.error('');
  console.error('1. Use Chocolatey (from PowerShell or CMD):');
  console.error('   choco outdated         # Check for outdated packages');
  console.error('');
  console.error('2. Use winget (Windows Package Manager):');
  console.error('   winget upgrade         # Check for available upgrades');
  console.error('');
  console.error('3. If you have WSL installed, you can run brew doctor there:');
  console.error('   wsl brew doctor');
  process.exit(1);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Runs `brew doctor` to check for potential problems with your Homebrew
 * installation. This command is essential for troubleshooting Homebrew
 * issues and ensuring your package manager is functioning correctly.
 *
 * On platforms where Homebrew is not available, provides guidance for
 * equivalent diagnostic commands using the native package manager.
 *
 * @param {string[]} args - Command line arguments to pass to brew doctor
 * @returns {Promise<void>}
 */
async function do_brewd(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_brewd_macos,
    'ubuntu': do_brewd_ubuntu,
    'raspbian': do_brewd_raspbian,
    'amazon_linux': do_brewd_amazon_linux,
    'cmd': do_brewd_cmd,
    'powershell': do_brewd_powershell,
    'gitbash': do_brewd_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    // Handle other Linux distros that might have Homebrew
    if (platform.type === 'debian' || platform.type === 'fedora' ||
        platform.type === 'rhel' || platform.type === 'linux') {
      // Try ubuntu handler as fallback for generic Linux
      await do_brewd_ubuntu(args);
      return;
    }

    // Handle Windows platform type
    if (platform.type === 'windows') {
      await do_brewd_cmd(args);
      return;
    }

    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('The brewd command is a shortcut for `brew doctor` which requires');
    console.error('Homebrew to be installed. Homebrew is available on macOS and Linux.');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_brewd,
  do_brewd,
  do_brewd_nodejs,
  do_brewd_macos,
  do_brewd_ubuntu,
  do_brewd_raspbian,
  do_brewd_amazon_linux,
  do_brewd_cmd,
  do_brewd_powershell,
  do_brewd_gitbash
};

if (require.main === module) {
  do_brewd(process.argv.slice(2));
}
