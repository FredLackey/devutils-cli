#!/usr/bin/env node

/**
 * @fileoverview Install Bash (Bourne-Again SHell) across supported platforms.
 *
 * Bash is a Unix shell and command language. Modern Bash (version 5.x) includes
 * significant improvements over older versions, including associative arrays,
 * better regular expression support, and numerous bug fixes. macOS ships with
 * Bash 3.2 due to GPL licensing restrictions, making an upgrade essential for
 * developers who need modern shell features.
 *
 * @module installs/bash
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Retrieves the currently installed Bash version by running `bash --version`.
 *
 * @returns {Promise<string|null>} The version string (e.g., "5.2.21") or null if not found
 */
async function getBashVersion() {
  const result = await shell.exec('bash --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)"
    // Extract just the version number (e.g., "5.2.21")
    const versionMatch = result.stdout.match(/version\s+(\d+\.\d+\.?\d*)/);
    if (versionMatch) {
      return versionMatch[1];
    }
  }
  return null;
}

/**
 * Checks if Bash is already installed on the system.
 *
 * @returns {boolean} True if bash command exists in PATH
 */
function isBashInstalled() {
  return shell.commandExists('bash');
}

/**
 * Install Bash on macOS using Homebrew.
 *
 * macOS ships with Bash 3.2 due to GPL licensing restrictions. This function
 * installs modern Bash 5.x via Homebrew. The new Bash is registered as an
 * allowed shell and can be set as the default shell manually by the user.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Homebrew is available (required for installation)
  if (!brew.isInstalled()) {
    console.log('Homebrew is required to install Bash on macOS.');
    console.log('Please install Homebrew first: dev install homebrew');
    return;
  }

  // Check if Homebrew Bash is already installed via Homebrew
  const isBrewBashInstalled = await brew.isFormulaInstalled('bash');
  if (isBrewBashInstalled) {
    const version = await getBashVersion();
    console.log(`Bash is already installed via Homebrew (version ${version || 'unknown'}).`);
    return;
  }

  // Proceed with Homebrew Bash installation
  console.log('Installing Bash via Homebrew...');
  const installResult = await brew.install('bash');

  if (!installResult.success) {
    console.log('Failed to install Bash via Homebrew.');
    console.log(installResult.output);
    return;
  }

  // Verify installation succeeded
  const verifyResult = await brew.isFormulaInstalled('bash');
  if (!verifyResult) {
    console.log('Installation verification failed: Bash was not found after install.');
    return;
  }

  // Get the Homebrew prefix to determine the correct bash path
  // On Apple Silicon: /opt/homebrew/bin/bash
  // On Intel Macs: /usr/local/bin/bash
  const prefixResult = await shell.exec('brew --prefix');
  const brewPrefix = prefixResult.code === 0 ? prefixResult.stdout.trim() : '/opt/homebrew';
  const brewBashPath = `${brewPrefix}/bin/bash`;

  console.log('Bash installed successfully via Homebrew.');
  console.log(`Homebrew Bash path: ${brewBashPath}`);
  console.log('');
  console.log('To use the new Bash as your default shell, run:');
  console.log(`  echo "${brewBashPath}" | sudo tee -a /etc/shells`);
  console.log(`  sudo chsh -s "${brewBashPath}" "$USER"`);
  console.log('');
  console.log('To suppress the macOS Bash deprecation warning, add this to ~/.bash_profile:');
  console.log('  export BASH_SILENCE_DEPRECATION_WARNING=1');

  // Display the installed version
  const version = await getBashVersion();
  if (version) {
    console.log(`\nInstalled Bash version: ${version}`);
  }
}

/**
 * Install Bash on Ubuntu/Debian using APT.
 *
 * Ubuntu and Debian include Bash by default, but this function ensures the
 * latest version available in the distribution's repositories is installed.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if Bash is already installed (it should be on Ubuntu/Debian)
  if (isBashInstalled()) {
    const version = await getBashVersion();
    console.log(`Bash is already installed (version ${version || 'unknown'}).`);
    console.log('Checking for updates...');
  }

  // Update package lists to ensure we get the latest version available
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install or upgrade Bash
  console.log('Installing Bash via APT...');
  const installResult = await apt.install('bash');

  if (!installResult.success) {
    console.log('Failed to install Bash via APT.');
    console.log(installResult.output);
    return;
  }

  // Verify installation
  if (!isBashInstalled()) {
    console.log('Installation verification failed: Bash was not found after install.');
    return;
  }

  console.log('Bash installed successfully.');

  // Display the installed version
  const version = await getBashVersion();
  if (version) {
    console.log(`Installed Bash version: ${version}`);
  }
}

/**
 * Install Bash on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL provides a full Linux environment on Windows, including a native Bash
 * shell. This function ensures the latest version is installed via APT.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  // The installation process is identical
  console.log('Installing Bash in WSL Ubuntu environment...');
  await install_ubuntu();
}

/**
 * Install Bash on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so Bash installation follows the same
 * process as Debian/Ubuntu. The package manager handles ARM architecture
 * automatically.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses APT just like Ubuntu/Debian
  // The installation process is identical
  console.log('Installing Bash on Raspberry Pi OS...');
  await install_ubuntu();
}

/**
 * Install Bash on Amazon Linux or RHEL using DNF/YUM.
 *
 * Amazon Linux and RHEL come with Bash pre-installed. This function ensures
 * the latest version available in the distribution's repositories is installed.
 * Uses DNF on modern systems (AL2023, RHEL 8/9) and YUM on older systems (AL2).
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if Bash is already installed (it should be on Amazon Linux/RHEL)
  if (isBashInstalled()) {
    const version = await getBashVersion();
    console.log(`Bash is already installed (version ${version || 'unknown'}).`);
    console.log('Checking for updates...');
  }

  // Determine whether to use DNF or YUM
  // DNF is available on Amazon Linux 2023 and RHEL 8/9
  // YUM is used on Amazon Linux 2 and older RHEL
  const useDnf = shell.commandExists('dnf');
  const packageManager = useDnf ? 'dnf' : 'yum';

  console.log(`Installing Bash via ${packageManager.toUpperCase()}...`);

  // Install Bash using the appropriate package manager
  const installCommand = `sudo ${packageManager} install -y bash`;
  const installResult = await shell.exec(installCommand);

  if (installResult.code !== 0) {
    console.log(`Failed to install Bash via ${packageManager.toUpperCase()}.`);
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify installation
  if (!isBashInstalled()) {
    console.log('Installation verification failed: Bash was not found after install.');
    return;
  }

  console.log('Bash installed successfully.');

  // Display the installed version
  const version = await getBashVersion();
  if (version) {
    console.log(`Installed Bash version: ${version}`);
  }
}

/**
 * Install Bash on Windows using Chocolatey (via Git for Windows).
 *
 * Windows does not have a native Bash shell. This function installs Git for
 * Windows, which includes Git Bash - a Bash emulation environment based on
 * MSYS2. Git for Windows includes modern Bash 5.x.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if Chocolatey is available (required for installation)
  if (!choco.isInstalled()) {
    console.log('Chocolatey is required to install Bash on Windows.');
    console.log('Please install Chocolatey first or use winget manually.');
    return;
  }

  // Check if Git for Windows (which includes Bash) is already installed
  // Git Bash is bundled with Git for Windows, so we check for the git package
  const isGitInstalled = await choco.isPackageInstalled('git');
  if (isGitInstalled) {
    // Verify bash is actually available
    if (isBashInstalled()) {
      const version = await getBashVersion();
      console.log(`Bash is already installed via Git for Windows (version ${version || 'unknown'}).`);
      return;
    }
  }

  // Install Git for Windows with Unix tools on PATH (includes Bash)
  console.log('Installing Git for Windows (includes Git Bash)...');
  console.log('This will add Bash and common Unix tools to your PATH.');

  // Use custom parameters to configure Git for Windows installation:
  // /GitAndUnixToolsOnPath - Adds Unix tools (including bash) to the Windows PATH
  // /NoAutoCrlf - Disables automatic line ending conversion
  // /WindowsTerminal - Adds Git Bash profile to Windows Terminal
  const installResult = await shell.exec(
    'choco install git -y --params "/GitAndUnixToolsOnPath /NoAutoCrlf /WindowsTerminal"'
  );

  if (installResult.code !== 0) {
    console.log('Failed to install Git for Windows via Chocolatey.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  console.log('Git for Windows (including Git Bash) installed successfully.');
  console.log('');
  console.log('Please close and reopen your terminal for PATH changes to take effect.');
  console.log('');
  console.log('Git Bash will be available at:');
  console.log('  C:\\Program Files\\Git\\bin\\bash.exe');
  console.log('');
  console.log('You can also launch Git Bash from the Start Menu or Windows Terminal.');
}

/**
 * Install Bash in Git Bash environment on Windows.
 *
 * Git Bash is the Bash shell included with Git for Windows. If Git for Windows
 * is already installed, Bash is already available. This function provides
 * guidance on updating Git for Windows to get the latest Bash version.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // If running in Git Bash, Bash is already available
  if (isBashInstalled()) {
    const version = await getBashVersion();
    console.log(`Bash is already available in Git Bash (version ${version || 'unknown'}).`);
    console.log('');
    console.log('To update Git Bash to the latest version, run one of these commands:');
    console.log('');
    console.log('  From Git Bash (interactive):');
    console.log('    git update-git-for-windows');
    console.log('');
    console.log('  From Administrator PowerShell (non-interactive):');
    console.log('    choco upgrade git -y');
    return;
  }

  // This case is unusual - running in Git Bash but bash command not found
  console.log('Git Bash environment detected but bash command not found.');
  console.log('Please reinstall Git for Windows to restore Bash functionality.');
}

/**
 * Check if Bash is installed on the current platform.
 *
 * This function uses the internal isBashInstalled helper to check if the
 * bash command exists in PATH.
 *
 * @returns {Promise<boolean>} True if Bash is installed
 */
async function isInstalled() {
  return isBashInstalled();
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Bash can be installed on all supported platforms:
 * - macOS (via Homebrew - upgrades from default Bash 3.2)
 * - Ubuntu/Debian (via APT)
 * - Raspberry Pi OS (via APT)
 * - Amazon Linux/RHEL/Fedora (via DNF/YUM)
 * - Windows (via Git for Windows/Chocolatey)
 * - WSL (via APT)
 * - Git Bash (already included, can update Git for Windows)
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically detects the current operating system and invokes
 * the corresponding platform-specific installation function. Unsupported platforms
 * receive a friendly message and the script exits gracefully.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installation functions
  // Multiple platform types may map to the same installer (e.g., debian -> ubuntu installer)
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,
    'wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  const installer = installers[platform.type];

  // Handle unsupported platforms gracefully without throwing errors
  if (!installer) {
    console.log(`Bash installer is not available for ${platform.type}.`);
    return;
  }

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
