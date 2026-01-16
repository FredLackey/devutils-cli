#!/usr/bin/env node

/**
 * @fileoverview Install Zsh (Z Shell) across supported platforms.
 *
 * Zsh is a powerful Unix shell and command interpreter designed for interactive
 * use and scripting. It combines features from Bash, ksh, and tcsh while adding
 * many original features like advanced tab completion, spelling correction,
 * themeable prompts, and an extensive plugin ecosystem.
 *
 * Key features of Zsh:
 * - Advanced context-aware tab completion
 * - Spelling correction for commands and paths
 * - Highly customizable, themeable prompts
 * - Extended pattern matching and recursive globbing
 * - Plugin ecosystem (Oh My Zsh, etc.)
 * - Shared command history across sessions
 *
 * Since macOS Catalina (10.15), Zsh is the default shell on macOS. On Linux
 * systems, Bash typically remains the default, but Zsh is readily available
 * through standard package managers.
 *
 * IMPORTANT: This installer does NOT automatically change the user's default
 * shell. Changing the default shell should be a deliberate user action.
 *
 * @module installs/zsh
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');

/**
 * Retrieves the currently installed Zsh version by running `zsh --version`.
 *
 * The version output format is: "zsh 5.9 (x86_64-apple-darwin23.0)"
 * This function extracts just the numeric version (e.g., "5.9").
 *
 * @returns {Promise<string|null>} The version string (e.g., "5.9") or null if not found
 */
async function getZshVersion() {
  const result = await shell.exec('zsh --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "zsh 5.9 (x86_64-apple-darwin23.0)"
    // Extract just the version number (e.g., "5.9")
    const versionMatch = result.stdout.match(/zsh\s+(\d+\.\d+\.?\d*)/);
    if (versionMatch) {
      return versionMatch[1];
    }
  }
  return null;
}

/**
 * Checks if Zsh is already installed on the system.
 *
 * Uses the shell utility to check if the 'zsh' command exists in PATH.
 * This is a synchronous check that returns immediately.
 *
 * @returns {boolean} True if zsh command exists in PATH
 */
function isZshCommandAvailable() {
  return shell.commandExists('zsh');
}

/**
 * Install Zsh on macOS using Homebrew.
 *
 * macOS Catalina (10.15) and later include Zsh pre-installed as the default
 * shell. This function can install a newer version via Homebrew if desired.
 * The system Zsh at /bin/zsh will always remain available.
 *
 * Note: This installer checks if Zsh is installed via Homebrew specifically,
 * not just if Zsh exists on the system (since macOS always has system Zsh).
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Homebrew is available (required for installing Homebrew Zsh)
  if (!brew.isInstalled()) {
    console.log('Homebrew is required to install Zsh via Homebrew on macOS.');
    console.log('Please install Homebrew first: dev install homebrew');
    console.log('');
    console.log('Note: macOS already includes Zsh pre-installed at /bin/zsh.');
    console.log('Homebrew is only needed if you want a newer version.');
    return;
  }

  // Check if Zsh is already installed via Homebrew
  // Note: We check the Homebrew formula, not the command, because macOS has
  // a system Zsh that will always exist at /bin/zsh
  const isBrewZshInstalled = await brew.isFormulaInstalled('zsh');
  if (isBrewZshInstalled) {
    const version = await getZshVersion();
    console.log(`Zsh is already installed via Homebrew (version ${version || 'unknown'}).`);
    return;
  }

  // Check if user has system Zsh and inform them before proceeding
  if (isZshCommandAvailable()) {
    const systemVersion = await getZshVersion();
    console.log(`System Zsh is available (version ${systemVersion || 'unknown'}).`);
    console.log('Installing Homebrew Zsh for a potentially newer version...');
    console.log('');
  }

  // Proceed with Homebrew Zsh installation
  console.log('Installing Zsh via Homebrew...');
  const installResult = await brew.install('zsh');

  if (!installResult.success) {
    console.log('Failed to install Zsh via Homebrew.');
    console.log(installResult.output);
    return;
  }

  // Verify installation succeeded
  const verifyResult = await brew.isFormulaInstalled('zsh');
  if (!verifyResult) {
    console.log('Installation verification failed: Zsh was not found after install.');
    return;
  }

  // Get the Homebrew prefix to determine the correct zsh path
  // On Apple Silicon: /opt/homebrew/bin/zsh
  // On Intel Macs: /usr/local/bin/zsh
  const prefixResult = await shell.exec('brew --prefix');
  const brewPrefix = prefixResult.code === 0 ? prefixResult.stdout.trim() : '/opt/homebrew';
  const brewZshPath = `${brewPrefix}/bin/zsh`;

  console.log('Zsh installed successfully via Homebrew.');
  console.log(`Homebrew Zsh path: ${brewZshPath}`);
  console.log('');
  console.log('To use the Homebrew Zsh as your default shell:');
  console.log(`  1. Add it to allowed shells: echo "${brewZshPath}" | sudo tee -a /etc/shells`);
  console.log(`  2. Change your default shell: chsh -s "${brewZshPath}"`);
  console.log('');
  console.log('Or continue using the system Zsh at /bin/zsh');

  // Display the installed version
  const version = await getZshVersion();
  if (version) {
    console.log(`\nInstalled Zsh version: ${version}`);
  }
}

/**
 * Install Zsh on Ubuntu/Debian using APT.
 *
 * Ubuntu and Debian use Bash as the default shell, but Zsh is available in
 * the standard repositories. This function installs Zsh via APT and provides
 * instructions for setting it as the default shell.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if Zsh is already installed by looking for the command
  if (isZshCommandAvailable()) {
    const version = await getZshVersion();
    console.log(`Zsh is already installed (version ${version || 'unknown'}).`);
    return;
  }

  // Update package lists before installing to ensure we get the latest version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install Zsh using APT
  console.log('Installing Zsh via APT...');
  const installResult = await apt.install('zsh');

  if (!installResult.success) {
    console.log('Failed to install Zsh via APT.');
    console.log(installResult.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  if (!isZshCommandAvailable()) {
    console.log('Installation verification failed: zsh command not found after install.');
    return;
  }

  console.log('Zsh installed successfully.');

  // Display the installed version
  const version = await getZshVersion();
  if (version) {
    console.log(`Installed Zsh version: ${version}`);
  }

  // Provide instructions for setting Zsh as the default shell
  console.log('');
  console.log('To set Zsh as your default shell, run:');
  console.log('  chsh -s $(which zsh)');
  console.log('');
  console.log('Then log out and log back in for the change to take effect.');
}

/**
 * Install Zsh on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL provides a full Linux environment on Windows. The installation process
 * is identical to native Ubuntu using APT. After installation, users may need
 * to configure their WSL session to start Zsh automatically.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Installing Zsh in WSL Ubuntu environment...');

  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();

  // Provide WSL-specific guidance for auto-launching Zsh
  if (isZshCommandAvailable()) {
    console.log('');
    console.log('WSL Tip: If changing the default shell does not work, add this to ~/.bashrc:');
    console.log('');
    console.log('  if [ -t 1 ] && [ -x /usr/bin/zsh ]; then');
    console.log('    exec /usr/bin/zsh');
    console.log('  fi');
    console.log('');
    console.log('This will automatically launch Zsh when you open a WSL terminal.');
  }
}

/**
 * Install Zsh on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so Zsh installation follows the same
 * APT-based process. Zsh works well on all Raspberry Pi models, though
 * complex Zsh prompts (with git status, etc.) may be slower on older models.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Installing Zsh on Raspberry Pi OS...');

  // Raspberry Pi OS uses APT just like Ubuntu/Debian
  // The installation process is identical
  await install_ubuntu();

  // Provide Raspberry Pi-specific tips
  if (isZshCommandAvailable()) {
    console.log('');
    console.log('Raspberry Pi Tip: If you experience slow prompts, use a simple prompt:');
    console.log("  Add to ~/.zshrc: PROMPT='%n@%m:%~%# '");
  }
}

/**
 * Install Zsh on Amazon Linux or RHEL using DNF/YUM.
 *
 * Amazon Linux and RHEL use Bash as the default shell. Zsh is available in
 * the standard repositories. This function detects whether to use DNF (modern)
 * or YUM (legacy) based on what is available.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if Zsh is already installed by looking for the command
  if (isZshCommandAvailable()) {
    const version = await getZshVersion();
    console.log(`Zsh is already installed (version ${version || 'unknown'}).`);
    return;
  }

  // Determine whether to use DNF or YUM
  // DNF is available on Amazon Linux 2023 and RHEL 8/9
  // YUM is used on Amazon Linux 2 and older RHEL
  const useDnf = shell.commandExists('dnf');
  const packageManager = useDnf ? 'dnf' : 'yum';

  console.log(`Installing Zsh via ${packageManager.toUpperCase()}...`);

  // Install Zsh using the appropriate package manager
  // The -y flag automatically confirms all prompts for non-interactive installation
  const installCommand = `sudo ${packageManager} install -y zsh`;
  const installResult = await shell.exec(installCommand);

  if (installResult.code !== 0) {
    console.log(`Failed to install Zsh via ${packageManager.toUpperCase()}.`);
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Verify installation succeeded
  if (!isZshCommandAvailable()) {
    console.log('Installation verification failed: zsh command not found after install.');
    return;
  }

  console.log('Zsh installed successfully.');

  // Display the installed version
  const version = await getZshVersion();
  if (version) {
    console.log(`Installed Zsh version: ${version}`);
  }

  // Provide instructions for setting Zsh as the default shell
  console.log('');
  console.log('To set Zsh as your default shell, run:');
  console.log('  sudo usermod --shell $(which zsh) $USER');
  console.log('');
  console.log('Then log out and log back in for the change to take effect.');
}

/**
 * Handle Zsh installation on native Windows.
 *
 * Zsh does not run on native Windows (PowerShell, Command Prompt).
 * Zsh is a Unix shell that requires a POSIX-compatible environment.
 * This function informs the user gracefully without throwing an error.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Zsh is not available for native Windows.');
  return;
}

/**
 * Handle Zsh installation in Git Bash on Windows.
 *
 * Zsh does not run in Git Bash. Git Bash uses a MinGW-based environment
 * that provides Bash, not Zsh. While Git Bash includes many Unix utilities,
 * it does not support alternative shells like Zsh.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Zsh is not available for Git Bash.');
  return;
}

/**
 * Check if Zsh is installed on the current platform.
 *
 * This function checks whether Zsh is available, using platform-appropriate
 * verification methods:
 * - macOS: Checks Homebrew formula (system Zsh always exists)
 * - Linux/WSL: Checks if zsh command exists
 * - Windows/Git Bash: Always returns false (not supported)
 *
 * @returns {Promise<boolean>} True if Zsh is installed
 */
async function isInstalled() {
  const platform = os.detect();

  // Windows and Git Bash don't support Zsh
  if (platform.type === 'windows' || platform.type === 'gitbash') {
    return false;
  }

  // macOS: Check Homebrew formula (system Zsh is always present at /bin/zsh)
  // For macOS, we consider Zsh "installed" if either Homebrew Zsh or system Zsh exists
  if (platform.type === 'macos') {
    // System Zsh is always available on macOS Catalina+
    return isZshCommandAvailable();
  }

  // Linux platforms (including WSL): Check if zsh command exists
  return isZshCommandAvailable();
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Zsh can be installed on:
 * - macOS (pre-installed, can update via Homebrew)
 * - Ubuntu/Debian (via APT)
 * - Ubuntu on WSL (via APT)
 * - Raspberry Pi OS (via APT)
 * - Amazon Linux/RHEL/Fedora (via DNF/YUM)
 *
 * Zsh is NOT supported on:
 * - Windows (native) - requires POSIX environment
 * - Git Bash - uses MinGW, not a full Unix environment
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  // Supported platforms for Zsh installation
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically detects the current operating system and invokes
 * the corresponding platform-specific installation function. For unsupported
 * platforms (Windows native, Git Bash), a friendly message is displayed and
 * the script exits gracefully without errors.
 *
 * IMPORTANT: This installer does NOT change the user's default shell.
 * Setting the default shell is a deliberate user action that should be
 * performed separately after installation.
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
    console.log(`Zsh is not available for ${platform.type}.`);
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
