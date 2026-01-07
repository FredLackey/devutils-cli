#!/usr/bin/env node

/**
 * u - Update system packages and tools
 *
 * Migrated from legacy dotfiles alias.
 * Original aliases:
 *   macOS:   alias u="sudo softwareupdate --install --all && brew update && brew upgrade && brew cleanup"
 *   Ubuntu:  alias u="sudo apt-get update && sudo apt-get upgrade"
 *   Raspbian: alias u="sudo apt-get update && sudo apt-get upgrade"
 *
 * This script updates the operating system and installed packages:
 * - macOS: Updates macOS software (softwareupdate) and Homebrew packages
 * - Ubuntu/Debian: Updates APT package lists and upgrades installed packages
 * - Raspberry Pi OS: Same as Ubuntu (APT-based)
 * - Amazon Linux: Updates DNF/YUM packages
 * - Windows: Updates winget packages (and optionally Chocolatey)
 *
 * NOTE: This script requires elevated privileges (sudo) on most platforms.
 * The script will prompt for your password when needed.
 *
 * @module scripts/u
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to detect which package managers are available.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists, false otherwise
 */
function isCommandAvailable(cmd) {
  try {
    // Use 'which' on Unix-like systems, 'where' on Windows
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper function to run a command and show output to the user.
 * This is a wrapper around execSync that handles errors gracefully.
 *
 * @param {string} command - The command to execute
 * @param {string} description - Human-readable description of what we're doing
 * @returns {boolean} True if the command succeeded, false otherwise
 */
function runCommand(command, description) {
  console.log(`\n>>> ${description}...`);
  console.log(`    Running: ${command}\n`);

  try {
    // Use spawnSync with shell: true for commands that need shell features
    // stdio: 'inherit' passes through stdin/stdout/stderr so user sees progress
    const result = spawnSync(command, {
      shell: true,
      stdio: 'inherit'
    });

    if (result.status !== 0) {
      console.error(`\n    Warning: Command exited with code ${result.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`\n    Error running command: ${error.message}`);
    return false;
  }
}

/**
 * Pure Node.js implementation - NOT APPLICABLE for this script.
 *
 * System updates require OS-level package managers (brew, apt, dnf, winget, etc.)
 * that cannot be replicated in pure Node.js. Each platform has its own package
 * management system that must be invoked directly.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_u_nodejs(args) {
  // System updates are inherently platform-specific and require OS package managers.
  // There is no pure Node.js way to update system packages.
  throw new Error(
    'do_u_nodejs should not be called directly. ' +
    'System updates require OS-specific package managers.'
  );
}

/**
 * Update system on macOS using softwareupdate and Homebrew.
 *
 * This function replicates the original dotfiles alias:
 *   sudo softwareupdate --install --all && brew update && brew upgrade && brew cleanup
 *
 * It performs the following steps:
 * 1. softwareupdate --install --all: Installs all available macOS updates (requires sudo)
 * 2. brew update: Updates Homebrew's list of available packages
 * 3. brew upgrade: Upgrades all installed Homebrew packages to latest versions
 * 4. brew cleanup: Removes old versions and clears download cache
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_u_macos(args) {
  console.log('=== macOS System Update ===');
  console.log('This will update macOS and Homebrew packages.');
  console.log('You may be prompted for your password.\n');

  let hasErrors = false;

  // Step 1: Update macOS using softwareupdate
  // The --install --all flags install all available updates
  // Note: This requires sudo, but softwareupdate will prompt for it
  const softwareUpdateSuccess = runCommand(
    'sudo softwareupdate --install --all',
    'Checking for and installing macOS updates'
  );
  if (!softwareUpdateSuccess) {
    console.error('Warning: macOS software update encountered issues.');
    hasErrors = true;
  }

  // Step 2-4: Update Homebrew (only if Homebrew is installed)
  if (isCommandAvailable('brew')) {
    // Step 2: Update Homebrew's package list
    const brewUpdateSuccess = runCommand(
      'brew update',
      'Updating Homebrew package list'
    );
    if (!brewUpdateSuccess) {
      console.error('Warning: brew update encountered issues.');
      hasErrors = true;
    }

    // Step 3: Upgrade all installed packages
    const brewUpgradeSuccess = runCommand(
      'brew upgrade',
      'Upgrading installed Homebrew packages'
    );
    if (!brewUpgradeSuccess) {
      console.error('Warning: brew upgrade encountered issues.');
      hasErrors = true;
    }

    // Step 4: Clean up old versions and cache
    const brewCleanupSuccess = runCommand(
      'brew cleanup',
      'Cleaning up old Homebrew versions and cache'
    );
    if (!brewCleanupSuccess) {
      console.error('Warning: brew cleanup encountered issues.');
      hasErrors = true;
    }
  } else {
    console.log('\nHomebrew is not installed. Skipping Homebrew updates.');
    console.log('To install Homebrew, visit: https://brew.sh');
  }

  // Summary
  console.log('\n=== Update Complete ===');
  if (hasErrors) {
    console.log('Some updates encountered issues. Review the output above.');
  } else {
    console.log('All updates completed successfully.');
  }
}

/**
 * Update system on Ubuntu using APT.
 *
 * This function replicates the original dotfiles alias:
 *   sudo apt-get update && sudo apt-get upgrade
 *
 * It performs the following steps:
 * 1. apt-get update: Refreshes the list of available packages from repositories
 * 2. apt-get upgrade: Upgrades all installed packages to their latest versions
 *
 * The -y flag is NOT used by default to match the original alias behavior,
 * which prompts the user to confirm before upgrading packages.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_u_ubuntu(args) {
  console.log('=== Ubuntu System Update ===');
  console.log('This will update APT packages.');
  console.log('You may be prompted for your password.\n');

  let hasErrors = false;

  // Step 1: Update package lists
  // This downloads the latest package information from configured repositories
  const updateSuccess = runCommand(
    'sudo apt-get update',
    'Updating package lists from repositories'
  );
  if (!updateSuccess) {
    console.error('Warning: apt-get update encountered issues.');
    hasErrors = true;
  }

  // Step 2: Upgrade installed packages
  // This upgrades all installed packages to their newest versions
  // The user will be prompted to confirm the upgrade (matching original alias behavior)
  const upgradeSuccess = runCommand(
    'sudo apt-get upgrade',
    'Upgrading installed packages'
  );
  if (!upgradeSuccess) {
    console.error('Warning: apt-get upgrade encountered issues.');
    hasErrors = true;
  }

  // Summary
  console.log('\n=== Update Complete ===');
  if (hasErrors) {
    console.log('Some updates encountered issues. Review the output above.');
  } else {
    console.log('All updates completed successfully.');
  }
}

/**
 * Update system on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is Debian-based, so it uses the same APT commands as Ubuntu.
 * This function is essentially identical to do_u_ubuntu but with Raspberry Pi
 * specific messaging.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_u_raspbian(args) {
  console.log('=== Raspberry Pi OS System Update ===');
  console.log('This will update APT packages.');
  console.log('You may be prompted for your password.\n');

  let hasErrors = false;

  // Step 1: Update package lists
  const updateSuccess = runCommand(
    'sudo apt-get update',
    'Updating package lists from repositories'
  );
  if (!updateSuccess) {
    console.error('Warning: apt-get update encountered issues.');
    hasErrors = true;
  }

  // Step 2: Upgrade installed packages
  const upgradeSuccess = runCommand(
    'sudo apt-get upgrade',
    'Upgrading installed packages'
  );
  if (!upgradeSuccess) {
    console.error('Warning: apt-get upgrade encountered issues.');
    hasErrors = true;
  }

  // Summary
  console.log('\n=== Update Complete ===');
  if (hasErrors) {
    console.log('Some updates encountered issues. Review the output above.');
  } else {
    console.log('All updates completed successfully.');
  }
}

/**
 * Update system on Amazon Linux using DNF or YUM.
 *
 * Amazon Linux 2023 uses DNF, while Amazon Linux 2 uses YUM.
 * This function detects which package manager is available and uses it.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_u_amazon_linux(args) {
  console.log('=== Amazon Linux System Update ===');
  console.log('This will update system packages.');
  console.log('You may be prompted for your password.\n');

  let hasErrors = false;

  // Detect which package manager to use
  // Amazon Linux 2023 uses DNF, Amazon Linux 2 uses YUM
  const useDnf = isCommandAvailable('dnf');
  const packageManager = useDnf ? 'dnf' : 'yum';

  console.log(`Using package manager: ${packageManager}`);

  // Step 1: Check for updates (optional, but informative)
  const checkSuccess = runCommand(
    `sudo ${packageManager} check-update`,
    'Checking for available updates'
  );
  // Note: check-update returns exit code 100 if updates are available,
  // which would be treated as an error. We'll continue regardless.

  // Step 2: Upgrade all packages
  // The -y flag could be added for non-interactive mode, but we match
  // the interactive behavior of the original Ubuntu alias
  const upgradeSuccess = runCommand(
    `sudo ${packageManager} upgrade`,
    'Upgrading installed packages'
  );
  if (!upgradeSuccess) {
    console.error(`Warning: ${packageManager} upgrade encountered issues.`);
    hasErrors = true;
  }

  // Step 3: Clean up cached packages (optional but good practice)
  const cleanSuccess = runCommand(
    `sudo ${packageManager} clean all`,
    'Cleaning up package cache'
  );
  if (!cleanSuccess) {
    console.error(`Warning: ${packageManager} clean encountered issues.`);
    // Don't set hasErrors for cleanup failure - it's not critical
  }

  // Summary
  console.log('\n=== Update Complete ===');
  if (hasErrors) {
    console.log('Some updates encountered issues. Review the output above.');
  } else {
    console.log('All updates completed successfully.');
  }
}

/**
 * Update system on Windows using winget (and optionally Chocolatey).
 *
 * Windows doesn't have a built-in equivalent to softwareupdate, but:
 * - winget (Windows Package Manager) can upgrade installed packages
 * - Chocolatey can upgrade packages it manages
 *
 * This function uses winget by default (included in Windows 10/11) and
 * also updates Chocolatey packages if Chocolatey is installed.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_u_cmd(args) {
  console.log('=== Windows System Update ===');
  console.log('This will update installed packages.\n');

  let hasErrors = false;
  let hasUpdaters = false;

  // Try winget first (built into Windows 10/11)
  if (isCommandAvailable('winget')) {
    hasUpdaters = true;

    // winget upgrade --all upgrades all packages that have updates available
    const wingetSuccess = runCommand(
      'winget upgrade --all',
      'Upgrading packages via Windows Package Manager (winget)'
    );
    if (!wingetSuccess) {
      console.error('Warning: winget upgrade encountered issues.');
      hasErrors = true;
    }
  } else {
    console.log('winget is not available. Skipping winget updates.');
    console.log('winget comes with Windows 10 (1709+) and Windows 11.');
  }

  // Also try Chocolatey if installed
  if (isCommandAvailable('choco')) {
    hasUpdaters = true;

    const chocoSuccess = runCommand(
      'choco upgrade all -y',
      'Upgrading packages via Chocolatey'
    );
    if (!chocoSuccess) {
      console.error('Warning: choco upgrade encountered issues.');
      hasErrors = true;
    }
  } else {
    console.log('\nChocolatey is not installed. Skipping Chocolatey updates.');
    console.log('To install Chocolatey, visit: https://chocolatey.org/install');
  }

  if (!hasUpdaters) {
    console.error('\nError: No package manager found.');
    console.error('Install winget (Windows 10/11) or Chocolatey to manage packages.');
    process.exit(1);
  }

  // Summary
  console.log('\n=== Update Complete ===');
  if (hasErrors) {
    console.log('Some updates encountered issues. Review the output above.');
  } else {
    console.log('All updates completed successfully.');
  }
}

/**
 * Update system on Windows using PowerShell.
 *
 * This function performs the same updates as do_u_cmd, using the same
 * package managers (winget, Chocolatey). PowerShell provides more advanced
 * scripting capabilities, but for simple package updates, the commands are
 * essentially the same.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_u_powershell(args) {
  // PowerShell uses the same Windows package managers as CMD
  return do_u_cmd(args);
}

/**
 * Update system from Git Bash on Windows.
 *
 * Git Bash runs in the Windows environment, so we use the same Windows
 * package managers (winget, Chocolatey) as CMD and PowerShell.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_u_gitbash(args) {
  // Git Bash runs on Windows, use the same Windows update logic
  return do_u_cmd(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "u" (update) command updates the operating system and installed packages.
 * This is a common developer workflow: keep your system and tools up to date.
 *
 * The behavior varies by platform:
 * - macOS: Updates macOS (softwareupdate) and Homebrew packages
 * - Ubuntu/Debian: Updates APT packages
 * - Raspberry Pi OS: Updates APT packages
 * - Amazon Linux: Updates DNF/YUM packages
 * - Windows: Updates winget and/or Chocolatey packages
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_u(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_u_macos,
    'ubuntu': do_u_ubuntu,
    'debian': do_u_ubuntu,
    'raspbian': do_u_raspbian,
    'amazon_linux': do_u_amazon_linux,
    'rhel': do_u_amazon_linux,
    'fedora': do_u_amazon_linux,
    'linux': do_u_ubuntu,
    'wsl': do_u_ubuntu,
    'cmd': do_u_cmd,
    'windows': do_u_cmd,
    'powershell': do_u_powershell,
    'gitbash': do_u_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS (softwareupdate + Homebrew)');
    console.error('  - Ubuntu, Debian (APT)');
    console.error('  - Raspberry Pi OS (APT)');
    console.error('  - Amazon Linux, RHEL, Fedora (DNF/YUM)');
    console.error('  - Windows (winget, Chocolatey)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_u,
  do_u,
  do_u_nodejs,
  do_u_macos,
  do_u_ubuntu,
  do_u_raspbian,
  do_u_amazon_linux,
  do_u_cmd,
  do_u_powershell,
  do_u_gitbash
};

if (require.main === module) {
  do_u(process.argv.slice(2));
}
