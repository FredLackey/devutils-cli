#!/usr/bin/env node

/**
 * brewr - Uninstall packages via the system package manager
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias brewr="brew uninstall"
 *
 * This script provides a cross-platform package uninstallation command.
 * On macOS, it wraps Homebrew's uninstall command. On other platforms,
 * it uses the native package manager (apt, dnf, yum, choco, winget).
 *
 * @module scripts/brewr
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');

/**
 * Pure Node.js implementation - not applicable for this script.
 *
 * Package uninstallation requires shell-based package managers on all platforms,
 * so there is no pure Node.js implementation. Each platform function must
 * invoke the appropriate system package manager.
 *
 * @param {string[]} args - Package names to uninstall
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_brewr_nodejs(args) {
  // Package uninstallation requires OS-specific package managers.
  // There is no pure Node.js implementation for this functionality.
  throw new Error(
    'do_brewr_nodejs should not be called directly. ' +
    'Package uninstallation requires platform-specific package managers.'
  );
}

/**
 * Uninstall packages using Homebrew on macOS.
 *
 * Runs `brew uninstall <packages>` to remove the specified packages.
 * Multiple packages can be specified at once.
 *
 * @param {string[]} args - Package names to uninstall
 * @returns {Promise<void>}
 *
 * @example
 * // Uninstall a single package
 * do_brewr_macos(['wget'])
 *
 * @example
 * // Uninstall multiple packages
 * do_brewr_macos(['wget', 'curl', 'jq'])
 */
async function do_brewr_macos(args) {
  // Validate that at least one package name was provided
  if (args.length === 0) {
    console.log('Usage: brewr <package> [package2] [package3] ...');
    console.log('');
    console.log('Uninstall packages using Homebrew.');
    console.log('');
    console.log('Examples:');
    console.log('  brewr wget              # Uninstall wget');
    console.log('  brewr wget curl jq      # Uninstall multiple packages');
    console.log('  brewr --cask firefox    # Uninstall a cask (GUI app)');
    console.log('  brewr --force wget      # Force uninstall (removes all versions)');
    process.exit(1);
  }

  // Check if Homebrew is installed
  if (!shell.commandExists('brew')) {
    console.error('Error: Homebrew is not installed.');
    console.error('');
    console.error('Install Homebrew first:');
    console.error('  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    console.error('');
    console.error('Or use: dev install homebrew');
    process.exit(1);
  }

  // Build the command with all package arguments
  // We pass args directly to brew uninstall, which allows for:
  // - Multiple package names: brewr wget curl jq
  // - Cask uninstalls: brewr --cask firefox
  // - Force flag: brewr --force wget
  const packages = args.join(' ');
  const command = `brew uninstall ${packages}`;

  console.log(`Uninstalling: ${args.filter(a => !a.startsWith('-')).join(', ')}`);

  // Execute brew uninstall and stream output to console
  const result = await shell.exec(command);

  // Output the result
  if (result.stdout) {
    console.log(result.stdout);
  }
  if (result.stderr && result.code !== 0) {
    console.error(result.stderr);
  }

  // Exit with the same code as brew
  if (result.code !== 0) {
    process.exit(result.code);
  }
}

/**
 * Uninstall packages using APT on Ubuntu.
 *
 * Runs `sudo apt-get remove -y <packages>` to remove the specified packages.
 * The -y flag automatically answers "yes" to prompts.
 *
 * Note: This uses `remove` not `purge`. If you want to also remove config
 * files, use `apt-get purge` instead.
 *
 * @param {string[]} args - Package names to uninstall
 * @returns {Promise<void>}
 *
 * @example
 * // Uninstall a single package
 * do_brewr_ubuntu(['wget'])
 */
async function do_brewr_ubuntu(args) {
  // Validate that at least one package name was provided
  if (args.length === 0) {
    console.log('Usage: brewr <package> [package2] [package3] ...');
    console.log('');
    console.log('Uninstall packages using APT (Ubuntu equivalent of brew uninstall).');
    console.log('');
    console.log('Examples:');
    console.log('  brewr wget              # Uninstall wget');
    console.log('  brewr wget curl jq      # Uninstall multiple packages');
    console.log('');
    console.log('Note: This removes packages but keeps configuration files.');
    console.log('      Use "apt-get purge" to also remove config files.');
    process.exit(1);
  }

  // Check if apt-get is available
  if (!shell.commandExists('apt-get')) {
    console.error('Error: apt-get is not available on this system.');
    process.exit(1);
  }

  // Build the command with all package arguments
  // Using 'remove' instead of 'purge' to preserve configuration files
  // This is safer and matches the typical brew uninstall behavior
  const packages = args.join(' ');
  const command = `sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y ${packages}`;

  console.log(`Uninstalling: ${args.join(', ')}`);

  // Execute apt-get remove
  const result = await shell.exec(command);

  // Output the result
  if (result.stdout) {
    console.log(result.stdout);
  }
  if (result.stderr && result.code !== 0) {
    console.error(result.stderr);
  }

  // Exit with the same code as apt-get
  if (result.code !== 0) {
    process.exit(result.code);
  }
}

/**
 * Uninstall packages using APT on Raspberry Pi OS.
 *
 * Raspberry Pi OS is Debian-based, so it uses the same APT package manager
 * as Ubuntu. This function delegates to the Ubuntu implementation.
 *
 * @param {string[]} args - Package names to uninstall
 * @returns {Promise<void>}
 */
async function do_brewr_raspbian(args) {
  // Raspbian uses the same APT package manager as Ubuntu
  return do_brewr_ubuntu(args);
}

/**
 * Uninstall packages using DNF or YUM on Amazon Linux.
 *
 * Amazon Linux 2023 uses DNF, while Amazon Linux 2 uses YUM.
 * This function detects which package manager is available and uses it.
 *
 * @param {string[]} args - Package names to uninstall
 * @returns {Promise<void>}
 *
 * @example
 * // Uninstall a single package
 * do_brewr_amazon_linux(['wget'])
 */
async function do_brewr_amazon_linux(args) {
  // Validate that at least one package name was provided
  if (args.length === 0) {
    console.log('Usage: brewr <package> [package2] [package3] ...');
    console.log('');
    console.log('Uninstall packages using DNF/YUM (Amazon Linux equivalent of brew uninstall).');
    console.log('');
    console.log('Examples:');
    console.log('  brewr wget              # Uninstall wget');
    console.log('  brewr wget curl jq      # Uninstall multiple packages');
    process.exit(1);
  }

  // Detect package manager (dnf for AL2023, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    console.error('Error: Neither dnf nor yum package manager found.');
    console.error('This command supports Amazon Linux 2023 (dnf) and Amazon Linux 2 (yum).');
    process.exit(1);
  }

  // Build the command with all package arguments
  const packages = args.join(' ');
  const command = `sudo ${packageManager} remove -y ${packages}`;

  console.log(`Uninstalling via ${packageManager}: ${args.join(', ')}`);

  // Execute the remove command
  const result = await shell.exec(command);

  // Output the result
  if (result.stdout) {
    console.log(result.stdout);
  }
  if (result.stderr && result.code !== 0) {
    console.error(result.stderr);
  }

  // Exit with the same code as the package manager
  if (result.code !== 0) {
    process.exit(result.code);
  }
}

/**
 * Uninstall packages using Chocolatey in Windows Command Prompt.
 *
 * Runs `choco uninstall -y <packages>` to remove the specified packages.
 * Requires Chocolatey to be installed and admin privileges.
 *
 * @param {string[]} args - Package names to uninstall
 * @returns {Promise<void>}
 *
 * @example
 * // Uninstall a single package
 * do_brewr_cmd(['wget'])
 */
async function do_brewr_cmd(args) {
  // Validate that at least one package name was provided
  if (args.length === 0) {
    console.log('Usage: brewr <package> [package2] [package3] ...');
    console.log('');
    console.log('Uninstall packages using Chocolatey (Windows equivalent of brew uninstall).');
    console.log('');
    console.log('Examples:');
    console.log('  brewr wget              # Uninstall wget');
    console.log('  brewr wget curl jq      # Uninstall multiple packages');
    console.log('');
    console.log('Note: Run as Administrator for best results.');
    process.exit(1);
  }

  // Check if Chocolatey is installed
  if (!shell.commandExists('choco')) {
    console.error('Error: Chocolatey is not installed.');
    console.error('');
    console.error('Install Chocolatey first (run as Administrator in PowerShell):');
    console.error('  Set-ExecutionPolicy Bypass -Scope Process -Force;');
    console.error('  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;');
    console.error('  iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))');
    process.exit(1);
  }

  // Build the command with all package arguments
  const packages = args.join(' ');
  const command = `choco uninstall -y ${packages}`;

  console.log(`Uninstalling: ${args.join(', ')}`);

  // Execute choco uninstall
  const result = await shell.exec(command);

  // Output the result
  if (result.stdout) {
    console.log(result.stdout);
  }
  if (result.stderr && result.code !== 0) {
    console.error(result.stderr);
  }

  // Exit with the same code as choco
  if (result.code !== 0) {
    process.exit(result.code);
  }
}

/**
 * Uninstall packages using Chocolatey or winget in Windows PowerShell.
 *
 * Prefers Chocolatey if available, falls back to winget.
 * This mirrors the macOS Homebrew experience.
 *
 * @param {string[]} args - Package names to uninstall
 * @returns {Promise<void>}
 */
async function do_brewr_powershell(args) {
  // Validate that at least one package name was provided
  if (args.length === 0) {
    console.log('Usage: brewr <package> [package2] [package3] ...');
    console.log('');
    console.log('Uninstall packages using Chocolatey or winget (Windows equivalent of brew uninstall).');
    console.log('');
    console.log('Examples:');
    console.log('  brewr wget              # Uninstall wget');
    console.log('  brewr wget curl jq      # Uninstall multiple packages');
    console.log('');
    console.log('Note: Run as Administrator for best results.');
    process.exit(1);
  }

  // Prefer Chocolatey if available, fall back to winget
  const hasChoco = shell.commandExists('choco');
  const hasWinget = shell.commandExists('winget');

  if (!hasChoco && !hasWinget) {
    console.error('Error: Neither Chocolatey nor winget is available.');
    console.error('');
    console.error('Install Chocolatey (recommended):');
    console.error('  Set-ExecutionPolicy Bypass -Scope Process -Force;');
    console.error('  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;');
    console.error('  iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))');
    console.error('');
    console.error('Or use winget (built into Windows 11 and Windows 10 21H2+).');
    process.exit(1);
  }

  let command;
  let packageManager;

  if (hasChoco) {
    // Use Chocolatey
    packageManager = 'Chocolatey';
    const packages = args.join(' ');
    command = `choco uninstall -y ${packages}`;
  } else {
    // Use winget
    packageManager = 'winget';
    const packages = args.join(' ');
    command = `winget uninstall ${packages}`;
  }

  console.log(`Uninstalling via ${packageManager}: ${args.join(', ')}`);

  // Execute the uninstall command
  const result = await shell.exec(command);

  // Output the result
  if (result.stdout) {
    console.log(result.stdout);
  }
  if (result.stderr && result.code !== 0) {
    console.error(result.stderr);
  }

  // Exit with the same code as the package manager
  if (result.code !== 0) {
    process.exit(result.code);
  }
}

/**
 * Uninstall packages from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function uses Chocolatey
 * via the Windows host. Falls back to winget if Chocolatey is not available.
 *
 * @param {string[]} args - Package names to uninstall
 * @returns {Promise<void>}
 */
async function do_brewr_gitbash(args) {
  // Validate that at least one package name was provided
  if (args.length === 0) {
    console.log('Usage: brewr <package> [package2] [package3] ...');
    console.log('');
    console.log('Uninstall packages using Chocolatey (Windows equivalent of brew uninstall).');
    console.log('');
    console.log('Examples:');
    console.log('  brewr wget              # Uninstall wget');
    console.log('  brewr wget curl jq      # Uninstall multiple packages');
    console.log('');
    console.log('Note: You may need to run Git Bash as Administrator.');
    process.exit(1);
  }

  // Check for Chocolatey via PowerShell (more reliable in Git Bash)
  const chocoCheck = await shell.exec('powershell.exe -NoProfile -Command "Get-Command choco -ErrorAction SilentlyContinue"');
  const hasChoco = chocoCheck.code === 0 && chocoCheck.stdout.includes('choco');

  // Check for winget via PowerShell
  const wingetCheck = await shell.exec('powershell.exe -NoProfile -Command "Get-Command winget -ErrorAction SilentlyContinue"');
  const hasWinget = wingetCheck.code === 0 && wingetCheck.stdout.includes('winget');

  if (!hasChoco && !hasWinget) {
    console.error('Error: Neither Chocolatey nor winget is available.');
    console.error('');
    console.error('Install Chocolatey (run as Administrator in PowerShell):');
    console.error('  Set-ExecutionPolicy Bypass -Scope Process -Force;');
    console.error('  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;');
    console.error('  iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))');
    process.exit(1);
  }

  let command;
  let packageManager;

  if (hasChoco) {
    // Use Chocolatey via PowerShell
    packageManager = 'Chocolatey';
    const packages = args.join(' ');
    command = `powershell.exe -NoProfile -Command "choco uninstall -y ${packages}"`;
  } else {
    // Use winget via PowerShell
    packageManager = 'winget';
    const packages = args.join(' ');
    command = `powershell.exe -NoProfile -Command "winget uninstall ${packages}"`;
  }

  console.log(`Uninstalling via ${packageManager}: ${args.join(', ')}`);

  // Execute the uninstall command
  const result = await shell.exec(command);

  // Output the result
  if (result.stdout) {
    console.log(result.stdout);
  }
  if (result.stderr && result.code !== 0) {
    console.error(result.stderr);
  }

  // Exit with the same code as the package manager
  if (result.code !== 0) {
    process.exit(result.code);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * This script uninstalls packages using the platform's native package manager:
 * - macOS: Homebrew (brew uninstall)
 * - Ubuntu/Debian: APT (apt-get remove)
 * - Raspberry Pi OS: APT (apt-get remove)
 * - Amazon Linux: DNF or YUM (dnf/yum remove)
 * - Windows CMD: Chocolatey (choco uninstall)
 * - Windows PowerShell: Chocolatey or winget
 * - Git Bash: Chocolatey or winget via PowerShell
 *
 * @param {string[]} args - Package names to uninstall
 * @returns {Promise<void>}
 */
async function do_brewr(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_brewr_macos,
    'ubuntu': do_brewr_ubuntu,
    'debian': do_brewr_ubuntu,
    'raspbian': do_brewr_raspbian,
    'amazon_linux': do_brewr_amazon_linux,
    'rhel': do_brewr_amazon_linux,
    'fedora': do_brewr_amazon_linux,
    'cmd': do_brewr_cmd,
    'windows': do_brewr_powershell,
    'powershell': do_brewr_powershell,
    'gitbash': do_brewr_gitbash,
    'wsl': do_brewr_ubuntu
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS (Homebrew)');
    console.error('  - Ubuntu/Debian (APT)');
    console.error('  - Raspberry Pi OS (APT)');
    console.error('  - Amazon Linux/RHEL/Fedora (DNF/YUM)');
    console.error('  - Windows (Chocolatey/winget)');
    console.error('  - Git Bash (Chocolatey/winget)');
    console.error('  - WSL (APT)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_brewr,
  do_brewr,
  do_brewr_nodejs,
  do_brewr_macos,
  do_brewr_ubuntu,
  do_brewr_raspbian,
  do_brewr_amazon_linux,
  do_brewr_cmd,
  do_brewr_powershell,
  do_brewr_gitbash
};

if (require.main === module) {
  do_brewr(process.argv.slice(2)).catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
