#!/usr/bin/env node

/**
 * brews - Search for packages via the system package manager
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias brews="brew search"
 *
 * This script provides a cross-platform package search command.
 * On macOS, it wraps Homebrew's search command. On other platforms,
 * it uses the native package manager's search functionality:
 * - macOS: brew search
 * - Ubuntu/Debian: apt-cache search
 * - Raspberry Pi OS: apt-cache search
 * - Amazon Linux: dnf search / yum search
 * - Windows: choco search / winget search
 *
 * @module scripts/brews
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');

/**
 * Pure Node.js implementation - not applicable for this script.
 *
 * Package searching requires shell-based package managers on all platforms,
 * so there is no pure Node.js implementation. Each platform function must
 * invoke the appropriate system package manager's search command.
 *
 * @param {string[]} args - Search term(s)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_brews_nodejs(args) {
  // Package searching requires OS-specific package managers.
  // There is no pure Node.js implementation for this functionality.
  throw new Error(
    'do_brews_nodejs should not be called directly. ' +
    'Package searching requires platform-specific package managers.'
  );
}

/**
 * Search for packages using Homebrew on macOS.
 *
 * Runs `brew search <term>` to search for packages matching the specified term.
 * Homebrew searches both formulae (CLI tools) and casks (GUI applications).
 *
 * @param {string[]} args - Search term(s) to look for
 * @returns {Promise<void>}
 *
 * @example
 * // Search for packages containing "node"
 * do_brews_macos(['node'])
 *
 * @example
 * // Search using a regex pattern
 * do_brews_macos(['/^node/'])
 */
async function do_brews_macos(args) {
  // Validate that a search term was provided
  if (args.length === 0) {
    console.log('Usage: brews <search-term>');
    console.log('');
    console.log('Search for packages using Homebrew.');
    console.log('');
    console.log('Examples:');
    console.log('  brews node              # Search for packages containing "node"');
    console.log('  brews /^node/           # Search using regex (packages starting with "node")');
    console.log('  brews --cask chrome     # Search only casks (GUI apps)');
    console.log('  brews --formula wget    # Search only formulae (CLI tools)');
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

  // Execute brew search with all provided arguments
  // Arguments can include:
  // - Search terms: brews node
  // - Regex patterns: brews /^node/
  // - Flags: brews --cask chrome
  const { spawnSync } = require('child_process');

  const result = spawnSync('brew', ['search', ...args], {
    stdio: 'inherit',  // Pass through stdin/stdout/stderr for real-time output
    shell: false       // Run brew directly without shell interpretation
  });

  // Exit with the same code as brew search
  process.exit(result.status || 0);
}

/**
 * Search for packages using APT on Ubuntu.
 *
 * Runs `apt-cache search <term>` to search for packages matching the specified term.
 * APT searches package names and descriptions.
 *
 * @param {string[]} args - Search term(s) to look for
 * @returns {Promise<void>}
 *
 * @example
 * // Search for packages containing "node"
 * do_brews_ubuntu(['node'])
 */
async function do_brews_ubuntu(args) {
  // Validate that a search term was provided
  if (args.length === 0) {
    console.log('Usage: brews <search-term>');
    console.log('');
    console.log('Search for packages using APT (Ubuntu equivalent of brew search).');
    console.log('');
    console.log('Examples:');
    console.log('  brews node              # Search for packages containing "node"');
    console.log('  brews nodejs            # Search for nodejs packages');
    console.log('');
    console.log('Tips:');
    console.log('  apt-cache show <pkg>    # Show detailed info about a package');
    console.log('  apt-cache policy <pkg>  # Show version and repository info');
    process.exit(1);
  }

  // Check if apt-cache is available
  if (!shell.commandExists('apt-cache')) {
    console.error('Error: apt-cache is not available on this system.');
    process.exit(1);
  }

  // Execute apt-cache search with all provided arguments
  // apt-cache search joins multiple terms with AND logic
  const { spawnSync } = require('child_process');

  const result = spawnSync('apt-cache', ['search', ...args], {
    stdio: 'inherit',
    shell: false
  });

  // Exit with the same code as apt-cache
  process.exit(result.status || 0);
}

/**
 * Search for packages using APT on Raspberry Pi OS.
 *
 * Raspberry Pi OS is Debian-based, so it uses the same APT package manager
 * as Ubuntu. This function delegates to the Ubuntu implementation.
 *
 * @param {string[]} args - Search term(s) to look for
 * @returns {Promise<void>}
 */
async function do_brews_raspbian(args) {
  // Raspbian uses the same APT package manager as Ubuntu
  return do_brews_ubuntu(args);
}

/**
 * Search for packages using DNF or YUM on Amazon Linux.
 *
 * Amazon Linux 2023 uses DNF, while Amazon Linux 2 uses YUM.
 * This function detects which package manager is available and uses it.
 *
 * @param {string[]} args - Search term(s) to look for
 * @returns {Promise<void>}
 *
 * @example
 * // Search for packages containing "node"
 * do_brews_amazon_linux(['node'])
 */
async function do_brews_amazon_linux(args) {
  // Validate that a search term was provided
  if (args.length === 0) {
    console.log('Usage: brews <search-term>');
    console.log('');
    console.log('Search for packages using DNF/YUM (Amazon Linux equivalent of brew search).');
    console.log('');
    console.log('Examples:');
    console.log('  brews node              # Search for packages containing "node"');
    console.log('  brews nodejs            # Search for nodejs packages');
    console.log('');
    console.log('Tips:');
    console.log('  dnf info <pkg>          # Show detailed info about a package');
    console.log('  dnf repoquery <pkg>     # Query repository for package info');
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

  // Execute dnf/yum search with all provided arguments
  const { spawnSync } = require('child_process');

  const result = spawnSync(packageManager, ['search', ...args], {
    stdio: 'inherit',
    shell: false
  });

  // Exit with the same code as the package manager
  process.exit(result.status || 0);
}

/**
 * Search for packages using Chocolatey in Windows Command Prompt.
 *
 * Runs `choco search <term>` to search for packages matching the specified term.
 * Chocolatey searches the Chocolatey Community Repository.
 *
 * @param {string[]} args - Search term(s) to look for
 * @returns {Promise<void>}
 *
 * @example
 * // Search for packages containing "node"
 * do_brews_cmd(['node'])
 */
async function do_brews_cmd(args) {
  // Validate that a search term was provided
  if (args.length === 0) {
    console.log('Usage: brews <search-term>');
    console.log('');
    console.log('Search for packages using Chocolatey (Windows equivalent of brew search).');
    console.log('');
    console.log('Examples:');
    console.log('  brews node              # Search for packages containing "node"');
    console.log('  brews nodejs            # Search for nodejs packages');
    console.log('  brews --exact nodejs    # Search for exact package name match');
    console.log('');
    console.log('Tips:');
    console.log('  choco info <pkg>        # Show detailed info about a package');
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
    console.error('');
    console.error('Alternatively, you can use winget:');
    console.error('  winget search <term>');
    process.exit(1);
  }

  // Execute choco search with all provided arguments
  const { spawnSync } = require('child_process');

  const result = spawnSync('choco', ['search', ...args], {
    stdio: 'inherit',
    shell: false
  });

  // Exit with the same code as choco
  process.exit(result.status || 0);
}

/**
 * Search for packages using Chocolatey or winget in Windows PowerShell.
 *
 * Prefers Chocolatey if available, falls back to winget.
 * This mirrors the macOS Homebrew experience.
 *
 * @param {string[]} args - Search term(s) to look for
 * @returns {Promise<void>}
 */
async function do_brews_powershell(args) {
  // Validate that a search term was provided
  if (args.length === 0) {
    console.log('Usage: brews <search-term>');
    console.log('');
    console.log('Search for packages using Chocolatey or winget (Windows equivalent of brew search).');
    console.log('');
    console.log('Examples:');
    console.log('  brews node              # Search for packages containing "node"');
    console.log('  brews nodejs            # Search for nodejs packages');
    console.log('');
    console.log('Tips:');
    console.log('  choco info <pkg>        # Show detailed info (Chocolatey)');
    console.log('  winget show <pkg>       # Show detailed info (winget)');
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

  const { spawnSync } = require('child_process');
  let result;

  if (hasChoco) {
    // Use Chocolatey search
    result = spawnSync('choco', ['search', ...args], {
      stdio: 'inherit',
      shell: false
    });
  } else {
    // Use winget search
    result = spawnSync('winget', ['search', ...args], {
      stdio: 'inherit',
      shell: false
    });
  }

  // Exit with the same code as the package manager
  process.exit(result.status || 0);
}

/**
 * Search for packages from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function uses Chocolatey or winget
 * via the Windows host. Prefers Chocolatey if available.
 *
 * @param {string[]} args - Search term(s) to look for
 * @returns {Promise<void>}
 */
async function do_brews_gitbash(args) {
  // Validate that a search term was provided
  if (args.length === 0) {
    console.log('Usage: brews <search-term>');
    console.log('');
    console.log('Search for packages using Chocolatey or winget (Windows equivalent of brew search).');
    console.log('');
    console.log('Examples:');
    console.log('  brews node              # Search for packages containing "node"');
    console.log('  brews nodejs            # Search for nodejs packages');
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
    const searchTerms = args.join(' ');
    command = `powershell.exe -NoProfile -Command "choco search ${searchTerms}"`;
  } else {
    // Use winget via PowerShell
    packageManager = 'winget';
    const searchTerms = args.join(' ');
    command = `powershell.exe -NoProfile -Command "winget search ${searchTerms}"`;
  }

  // Execute the search command
  const result = await shell.exec(command);

  // Output the result
  if (result.stdout) {
    console.log(result.stdout);
  }
  if (result.stderr && result.code !== 0) {
    console.error(result.stderr);
  }

  // Exit with the same code as the package manager
  process.exit(result.code || 0);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * This script searches for packages using the platform's native package manager:
 * - macOS: Homebrew (brew search)
 * - Ubuntu/Debian: APT (apt-cache search)
 * - Raspberry Pi OS: APT (apt-cache search)
 * - Amazon Linux: DNF or YUM (dnf/yum search)
 * - Windows CMD: Chocolatey (choco search)
 * - Windows PowerShell: Chocolatey or winget (choco/winget search)
 * - Git Bash: Chocolatey or winget via PowerShell
 *
 * @param {string[]} args - Search term(s) to look for
 * @returns {Promise<void>}
 */
async function do_brews(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_brews_macos,
    'ubuntu': do_brews_ubuntu,
    'debian': do_brews_ubuntu,
    'raspbian': do_brews_raspbian,
    'amazon_linux': do_brews_amazon_linux,
    'rhel': do_brews_amazon_linux,
    'fedora': do_brews_amazon_linux,
    'cmd': do_brews_cmd,
    'windows': do_brews_powershell,
    'powershell': do_brews_powershell,
    'gitbash': do_brews_gitbash,
    'wsl': do_brews_ubuntu
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
  main: do_brews,
  do_brews,
  do_brews_nodejs,
  do_brews_macos,
  do_brews_ubuntu,
  do_brews_raspbian,
  do_brews_amazon_linux,
  do_brews_cmd,
  do_brews_powershell,
  do_brews_gitbash
};

if (require.main === module) {
  do_brews(process.argv.slice(2)).catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
