#!/usr/bin/env node

/**
 * @fileoverview Install Chocolatey - a package manager for Windows.
 *
 * Chocolatey is a machine-level package manager for Windows that automates
 * the software installation, configuration, upgrade, and uninstallation
 * process. It uses NuGet infrastructure and PowerShell to wrap installers,
 * executables, zips, and scripts into compiled packages.
 *
 * Key features of Chocolatey:
 * - Simple installation with a single command (`choco install <package>`)
 * - Silent installations with the `-y` flag for non-interactive operation
 * - Automatic dependency management
 * - Enterprise-ready with integration for SCCM, Puppet, Chef, Ansible
 * - Access to thousands of community-maintained packages at chocolatey.org
 *
 * IMPORTANT: Chocolatey is a Windows-only tool. It does not run on macOS,
 * Linux, or within WSL. For those platforms, use the native package manager
 * (Homebrew for macOS, APT for Debian/Ubuntu, DNF/YUM for RHEL).
 *
 * @module installs/chocolatey
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const windowsShell = require('../utils/windows/shell');
const choco = require('../utils/windows/choco');

/**
 * The official Chocolatey installation script URL.
 * This URL hosts the PowerShell installation script from chocolatey.org.
 */
const CHOCOLATEY_INSTALL_URL = 'https://community.chocolatey.org/install.ps1';

/**
 * The default Chocolatey installation directory on Windows.
 * This is where Chocolatey installs itself and stores packages.
 */
const CHOCOLATEY_INSTALL_PATH = 'C:\\ProgramData\\chocolatey';

/**
 * Check if Chocolatey is installed by looking for the 'choco' command.
 *
 * This is a quick synchronous check that works on both native Windows
 * and Git Bash environments. Returns true if the 'choco' command is
 * available in the system PATH.
 *
 * @returns {boolean} True if Chocolatey is installed, false otherwise
 */
function isChocolateyInstalled() {
  return shell.commandExists('choco');
}

/**
 * Get the installed Chocolatey version.
 *
 * Executes 'choco --version' to retrieve the installed version number.
 * Returns null if Chocolatey is not installed or if the version cannot
 * be determined.
 *
 * @returns {Promise<string|null>} The version string (e.g., "2.4.1"), or null
 */
async function getChocolateyVersion() {
  if (!isChocolateyInstalled()) {
    return null;
  }

  const result = await shell.exec('choco --version');
  if (result.code === 0 && result.stdout) {
    // Output is simply the version number, e.g., "2.4.1"
    return result.stdout.trim();
  }
  return null;
}

/**
 * Install Chocolatey on macOS.
 *
 * Chocolatey does not run on macOS because it is built on PowerShell
 * and the Windows ecosystem. This function gracefully informs the user
 * that Chocolatey is not available for this platform.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Chocolatey is not available for macOS.');
  return;
}

/**
 * Install Chocolatey on Ubuntu/Debian.
 *
 * Chocolatey does not run on Linux because it is built on PowerShell
 * and the Windows ecosystem. This function gracefully informs the user
 * that Chocolatey is not available for this platform.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Chocolatey is not available for Ubuntu/Debian.');
  return;
}

/**
 * Install Chocolatey on Ubuntu running in WSL.
 *
 * Chocolatey does not run within WSL because WSL provides a Linux
 * environment, not a Windows environment. This function gracefully
 * informs the user that Chocolatey is not available within WSL.
 *
 * Note: If the user needs Chocolatey, they should install it on the
 * Windows host (outside of WSL) using PowerShell.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Chocolatey is not available for WSL.');
  return;
}

/**
 * Install Chocolatey on Raspberry Pi OS.
 *
 * Chocolatey does not run on Linux because it is built on PowerShell
 * and the Windows ecosystem. This function gracefully informs the user
 * that Chocolatey is not available for this platform.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Chocolatey is not available for Raspberry Pi OS.');
  return;
}

/**
 * Install Chocolatey on Amazon Linux/RHEL.
 *
 * Chocolatey does not run on Linux because it is built on PowerShell
 * and the Windows ecosystem. This function gracefully informs the user
 * that Chocolatey is not available for this platform.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Chocolatey is not available for Amazon Linux.');
  return;
}

/**
 * Install Chocolatey on Windows using PowerShell.
 *
 * This is the primary installation method for Chocolatey. The installation
 * process uses PowerShell to download and execute the official installation
 * script from chocolatey.org.
 *
 * Prerequisites:
 * - Windows 7 SP1 or later (Windows 10/11 recommended)
 * - PowerShell v3 or later (comes pre-installed on Windows 10/11)
 * - .NET Framework 4.8 (installer handles this automatically if missing)
 * - Administrator privileges
 *
 * The installation command performs the following operations:
 * 1. Temporarily sets execution policy to Bypass for the current session
 * 2. Enables TLS 1.2 for secure HTTPS downloads
 * 3. Downloads and executes the official Chocolatey installation script
 *
 * After installation, Chocolatey creates:
 * - The C:\ProgramData\chocolatey directory structure
 * - The ChocolateyInstall environment variable
 * - Adds Chocolatey to the system PATH
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if Chocolatey is already installed - this makes the function idempotent
  if (isChocolateyInstalled()) {
    const version = await getChocolateyVersion();
    if (version) {
      console.log(`Chocolatey ${version} is already installed, skipping...`);
    } else {
      console.log('Chocolatey is already installed, skipping...');
    }
    return;
  }

  // Verify that PowerShell is available (it should be on Windows 10/11)
  const hasPowerShell = windowsShell.hasWindowsPowerShell() || windowsShell.hasPowerShellCore();
  if (!hasPowerShell) {
    console.log('PowerShell is required to install Chocolatey but was not found.');
    console.log('PowerShell should be pre-installed on Windows 10 and later.');
    return;
  }

  console.log('Installing Chocolatey via PowerShell...');
  console.log('');
  console.log('This requires Administrator privileges. If this script is not running');
  console.log('as Administrator, the installation may fail.');
  console.log('');

  // Build the PowerShell installation command
  // This is the official installation command from https://chocolatey.org/install
  //
  // Breaking down the command:
  // - Set-ExecutionPolicy Bypass -Scope Process -Force
  //     Temporarily allows script execution for the current session only
  //     Does not permanently change the system execution policy
  //
  // - [System.Net.ServicePointManager]::SecurityProtocol = ... -bor 3072
  //     Enables TLS 1.2 for secure HTTPS downloads
  //     The value 3072 represents Tls12 in the SecurityProtocolType enum
  //
  // - iex ((New-Object System.Net.WebClient).DownloadString(...))
  //     Downloads and immediately executes the installation script
  const installCommand = [
    'Set-ExecutionPolicy Bypass -Scope Process -Force;',
    '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;',
    `iex ((New-Object System.Net.WebClient).DownloadString('${CHOCOLATEY_INSTALL_URL}'))`
  ].join(' ');

  // Execute the installation command via PowerShell
  // We use powershell.exe (Windows PowerShell 5.x) for maximum compatibility
  const result = await shell.exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${installCommand}"`);

  if (result.code !== 0) {
    console.log('Failed to install Chocolatey.');
    console.log('');
    console.log('Common causes:');
    console.log('  1. Not running as Administrator');
    console.log('  2. Network/firewall blocking the download');
    console.log('  3. PowerShell execution policy restrictions');
    console.log('');
    console.log('To install manually, open an Administrator PowerShell and run:');
    console.log('  Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))');
    console.log('');
    if (result.stderr) {
      console.log('Error details:');
      console.log(result.stderr);
    }
    return;
  }

  // Verify the installation succeeded
  // Note: The PATH may not be updated in the current session, so we check
  // for the choco executable directly in the expected installation path
  const verifyResult = await shell.exec(`powershell.exe -NoProfile -Command "Test-Path '${CHOCOLATEY_INSTALL_PATH}\\bin\\choco.exe'"`);
  const isVerified = verifyResult.code === 0 && verifyResult.stdout.trim().toLowerCase() === 'true';

  if (!isVerified) {
    console.log('Installation may have failed: Chocolatey was not found after install.');
    console.log('');
    console.log('Please try installing manually from an Administrator PowerShell.');
    return;
  }

  // Add Chocolatey's bin directory to the current process PATH so that
  // subsequent choco commands work without requiring a terminal restart
  choco.addBinToPath();

  console.log('Chocolatey installed successfully.');
  console.log('');
  console.log('IMPORTANT: Close and reopen your terminal for PATH changes to take effect.');
  console.log('');
  console.log('Verify the installation by running:');
  console.log('  choco --version');
  console.log('');
  console.log('Install your first package with:');
  console.log('  choco install notepadplusplus -y');
}

/**
 * Install Chocolatey from Git Bash on Windows.
 *
 * Git Bash runs on Windows, so Chocolatey can be installed on the Windows
 * host. However, the installation must be performed via PowerShell because
 * Git Bash cannot directly execute the PowerShell installation script.
 *
 * This function invokes PowerShell from Git Bash to perform the installation.
 * After installation, Chocolatey commands will be available in Git Bash.
 *
 * Prerequisites:
 * - Windows operating system with Git Bash installed
 * - PowerShell available on the Windows host
 * - Administrator privileges (run Git Bash as Administrator)
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if Chocolatey is already installed - this makes the function idempotent
  if (isChocolateyInstalled()) {
    const version = await getChocolateyVersion();
    if (version) {
      console.log(`Chocolatey ${version} is already installed, skipping...`);
    } else {
      console.log('Chocolatey is already installed, skipping...');
    }
    return;
  }

  console.log('Installing Chocolatey on the Windows host via PowerShell...');
  console.log('');
  console.log('This requires Administrator privileges. If Git Bash is not running');
  console.log('as Administrator, the installation may fail.');
  console.log('');

  // Build the PowerShell installation command (same as install_windows)
  const installCommand = [
    'Set-ExecutionPolicy Bypass -Scope Process -Force;',
    '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;',
    `iex ((New-Object System.Net.WebClient).DownloadString('${CHOCOLATEY_INSTALL_URL}'))`
  ].join(' ');

  // Execute the installation command via PowerShell from Git Bash
  // Git Bash can invoke Windows executables directly
  const result = await shell.exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${installCommand}"`);

  if (result.code !== 0) {
    console.log('Failed to install Chocolatey.');
    console.log('');
    console.log('Common causes:');
    console.log('  1. Git Bash not running as Administrator');
    console.log('  2. Network/firewall blocking the download');
    console.log('  3. PowerShell execution policy restrictions');
    console.log('');
    console.log('To install manually:');
    console.log('  1. Close Git Bash');
    console.log('  2. Open an Administrator PowerShell window');
    console.log('  3. Run the Chocolatey installation command');
    console.log('  4. Close and reopen Git Bash');
    console.log('');
    if (result.stderr) {
      console.log('Error details:');
      console.log(result.stderr);
    }
    return;
  }

  // Verify the installation succeeded
  const verifyResult = await shell.exec(`powershell.exe -NoProfile -Command "Test-Path '${CHOCOLATEY_INSTALL_PATH}\\bin\\choco.exe'"`);
  const isVerified = verifyResult.code === 0 && verifyResult.stdout.trim().toLowerCase() === 'true';

  if (!isVerified) {
    console.log('Installation may have failed: Chocolatey was not found after install.');
    console.log('');
    console.log('Please try installing manually from an Administrator PowerShell.');
    return;
  }

  // Add Chocolatey's bin directory to the current process PATH so that
  // subsequent choco commands work without requiring a terminal restart
  choco.addBinToPath();

  console.log('Chocolatey installed successfully.');
  console.log('');
  console.log('IMPORTANT: Close and reopen Git Bash for PATH changes to take effect.');
  console.log('');
  console.log('If choco is not found after reopening, add Chocolatey to your PATH:');
  console.log('  echo \'export PATH="$PATH:/c/ProgramData/chocolatey/bin"\' >> ~/.bashrc');
  console.log('  source ~/.bashrc');
  console.log('');
  console.log('Verify the installation by running:');
  console.log('  choco --version');
}

/**
 * Check if Chocolatey is installed on the current platform.
 *
 * This function uses the internal isChocolateyInstalled helper to check if
 * the 'choco' command exists in PATH.
 *
 * @returns {Promise<boolean>} True if Chocolatey is installed
 */
async function isInstalled() {
  return isChocolateyInstalled();
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Chocolatey can only be installed on:
 * - Windows (native PowerShell)
 * - Git Bash (Windows environment)
 *
 * Note: Chocolatey is a Windows-only tool and cannot run on macOS,
 * Linux, or within WSL.
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. Chocolatey is only
 * supported on Windows and Git Bash (which runs on Windows).
 *
 * For all other platforms (macOS, Linux, WSL), the function gracefully
 * returns with a message indicating that Chocolatey is not available.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their corresponding installer functions
  // Only Windows and Git Bash have actual installation logic
  // All other platforms gracefully return with a message
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
    console.log(`Chocolatey is not available for ${platform.type}.`);
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
