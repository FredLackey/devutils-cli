#!/usr/bin/env node

/**
 * @fileoverview Install Bash Completion 2 across supported platforms.
 *
 * Bash Completion is a collection of shell functions that provide intelligent
 * auto-completion for commands, file paths, options, and arguments when pressing Tab.
 * Version 2 (bash-completion@2) is designed for Bash 4.2+ and offers improved
 * performance and more comprehensive completion support.
 *
 * Supported platforms:
 * - macOS: via Homebrew (bash-completion@2)
 * - Ubuntu/Debian: via APT (bash-completion package provides v2.x)
 * - Raspberry Pi OS: via APT (bash-completion package provides v2.x)
 * - Amazon Linux: via DNF/YUM (bash-completion package)
 * - WSL: via APT within the WSL Ubuntu environment
 * - Windows: Not natively supported (provides Clink as an alternative)
 * - Git Bash: Manual setup with Git completion scripts
 *
 * @module installs/bash-completion
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');

/**
 * Install Bash Completion 2 on macOS using Homebrew.
 *
 * macOS ships with Bash 3.2 by default, which is incompatible with bash-completion@2.
 * This installer assumes the user has already installed a modern version of Bash
 * via Homebrew (Bash 4.2+). The installation uses the bash-completion@2 formula.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Installing Bash Completion 2 on macOS...');

  // Step 1: Verify Homebrew is installed (required for installation)
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Step 2: Check if bash-completion@2 is already installed
  const isAlreadyInstalled = await brew.isFormulaInstalled('bash-completion@2');
  if (isAlreadyInstalled) {
    console.log('Bash Completion 2 is already installed, skipping installation.');
    return;
  }

  // Step 3: Check if the older bash-completion (v1) is installed
  // Version 1 and 2 conflict with each other, so we need to warn the user
  const hasVersion1 = await brew.isFormulaInstalled('bash-completion');
  if (hasVersion1) {
    console.log('Warning: bash-completion (version 1) is installed.');
    console.log('Version 1 and 2 conflict with each other.');
    console.log('Consider running: brew uninstall bash-completion');
    console.log('Then re-run this installer.');
    return;
  }

  // Step 4: Install bash-completion@2 via Homebrew
  console.log('Installing bash-completion@2 via Homebrew...');
  const installResult = await brew.install('bash-completion@2');

  if (!installResult.success) {
    console.log('Failed to install Bash Completion 2.');
    console.log(installResult.output);
    return;
  }

  // Step 5: Verify the installation succeeded
  const verifyInstalled = await brew.isFormulaInstalled('bash-completion@2');
  if (!verifyInstalled) {
    console.log('Installation verification failed: bash-completion@2 not found.');
    return;
  }

  console.log('Bash Completion 2 installed successfully.');
  console.log('');
  console.log('To enable bash-completion, add the following to your ~/.bash_profile:');
  console.log('');
  console.log('  [[ -r "${HOMEBREW_PREFIX}/etc/profile.d/bash_completion.sh" ]] && . "${HOMEBREW_PREFIX}/etc/profile.d/bash_completion.sh"');
  console.log('');
  console.log('Then run: source ~/.bash_profile');
  console.log('');
  console.log('Note: Bash Completion 2 requires Bash 4.2 or later.');
  console.log('macOS ships with Bash 3.2. Install modern Bash with: brew install bash');
}

/**
 * Install Bash Completion on Ubuntu/Debian using APT.
 *
 * On Ubuntu/Debian, the APT package "bash-completion" provides version 2.x
 * functionality. The @2 suffix is specific to Homebrew on macOS.
 * Modern Ubuntu/Debian systems ship with Bash 4.2+ by default.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Installing Bash Completion on Ubuntu/Debian...');

  // Step 1: Verify APT is available
  if (!apt.isInstalled()) {
    console.log('APT package manager is not available on this system.');
    return;
  }

  // Step 2: Check if bash-completion is already installed
  const isAlreadyInstalled = await apt.isPackageInstalled('bash-completion');
  if (isAlreadyInstalled) {
    console.log('Bash Completion is already installed, skipping installation.');
    return;
  }

  // Step 3: Update package lists to ensure we have the latest package info
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Step 4: Install bash-completion via APT
  console.log('Installing bash-completion via APT...');
  const installResult = await apt.install('bash-completion');

  if (!installResult.success) {
    console.log('Failed to install Bash Completion.');
    console.log(installResult.output);
    return;
  }

  // Step 5: Verify the installation succeeded
  const verifyInstalled = await apt.isPackageInstalled('bash-completion');
  if (!verifyInstalled) {
    console.log('Installation verification failed: bash-completion not found.');
    return;
  }

  console.log('Bash Completion installed successfully.');
  console.log('');
  console.log('Bash Completion should be enabled automatically on most Ubuntu/Debian systems.');
  console.log('If completion is not working, add the following to your ~/.bashrc:');
  console.log('');
  console.log('  if ! shopt -oq posix; then');
  console.log('    if [ -f /usr/share/bash-completion/bash_completion ]; then');
  console.log('      . /usr/share/bash-completion/bash_completion');
  console.log('    elif [ -f /etc/bash_completion ]; then');
  console.log('      . /etc/bash_completion');
  console.log('    fi');
  console.log('  fi');
  console.log('');
  console.log('Then run: source ~/.bashrc');
}

/**
 * Install Bash Completion on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so the installation process is
 * nearly identical to Ubuntu/Debian. The bash-completion package provides
 * version 2.x functionality.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Installing Bash Completion on Raspberry Pi OS...');

  // Step 1: Verify APT is available
  if (!apt.isInstalled()) {
    console.log('APT package manager is not available on this system.');
    return;
  }

  // Step 2: Check if bash-completion is already installed
  const isAlreadyInstalled = await apt.isPackageInstalled('bash-completion');
  if (isAlreadyInstalled) {
    console.log('Bash Completion is already installed, skipping installation.');
    return;
  }

  // Step 3: Update package lists to ensure we have the latest package info
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Step 4: Install bash-completion via APT
  console.log('Installing bash-completion via APT...');
  const installResult = await apt.install('bash-completion');

  if (!installResult.success) {
    console.log('Failed to install Bash Completion.');
    console.log(installResult.output);
    return;
  }

  // Step 5: Verify the installation succeeded
  const verifyInstalled = await apt.isPackageInstalled('bash-completion');
  if (!verifyInstalled) {
    console.log('Installation verification failed: bash-completion not found.');
    return;
  }

  console.log('Bash Completion installed successfully.');
  console.log('');
  console.log('Bash Completion should be enabled automatically on Raspberry Pi OS.');
  console.log('If completion is not working, add the following to your ~/.bashrc:');
  console.log('');
  console.log('  if ! shopt -oq posix; then');
  console.log('    if [ -f /usr/share/bash-completion/bash_completion ]; then');
  console.log('      . /usr/share/bash-completion/bash_completion');
  console.log('    elif [ -f /etc/bash_completion ]; then');
  console.log('      . /etc/bash_completion');
  console.log('    fi');
  console.log('  fi');
  console.log('');
  console.log('Then run: source ~/.bashrc');
}

/**
 * Install Bash Completion on Amazon Linux/RHEL using DNF or YUM.
 *
 * Amazon Linux 2023 uses DNF, while Amazon Linux 2 uses YUM.
 * The installer automatically detects which package manager is available.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Installing Bash Completion on Amazon Linux/RHEL...');

  // Step 1: Determine which package manager is available (DNF preferred over YUM)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');

  if (!hasDnf && !hasYum) {
    console.log('Neither DNF nor YUM package manager is available on this system.');
    return;
  }

  const packageManager = hasDnf ? 'dnf' : 'yum';

  // Step 2: Check if bash-completion is already installed using rpm
  const checkResult = await shell.exec('rpm -q bash-completion');
  if (checkResult.code === 0) {
    console.log('Bash Completion is already installed, skipping installation.');
    return;
  }

  // Step 3: Install bash-completion using the appropriate package manager
  console.log(`Installing bash-completion via ${packageManager.toUpperCase()}...`);
  const installCommand = `sudo ${packageManager} install -y bash-completion`;
  const installResult = await shell.exec(installCommand);

  if (installResult.code !== 0) {
    console.log('Failed to install Bash Completion.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Step 4: Verify the installation succeeded
  const verifyResult = await shell.exec('rpm -q bash-completion');
  if (verifyResult.code !== 0) {
    console.log('Installation verification failed: bash-completion not found.');
    return;
  }

  console.log('Bash Completion installed successfully.');
  console.log('');
  console.log('Bash Completion should be enabled automatically for login shells.');
  console.log('If completion is not working, add the following to your ~/.bashrc:');
  console.log('');
  console.log('  [[ $PS1 && -f /etc/profile.d/bash_completion.sh ]] && . /etc/profile.d/bash_completion.sh');
  console.log('');
  console.log('Then run: source ~/.bashrc');
}

/**
 * Handle Bash Completion on native Windows.
 *
 * Bash Completion is a Linux/Unix tool that does not run natively on Windows.
 * Windows uses PowerShell or Command Prompt, which have their own completion
 * mechanisms. This function provides information about alternatives.
 *
 * Note: Clink provides Bash-style line editing for cmd.exe but is not the same
 * as bash-completion. For full bash-completion support, users should use WSL.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Bash Completion is not natively available on Windows
  // Return gracefully with an informational message
  console.log('Bash Completion is not available for Windows.');
  return;
}

/**
 * Install Bash Completion in WSL (Windows Subsystem for Linux - Ubuntu).
 *
 * WSL provides a full Linux environment where bash-completion works normally.
 * The installation is identical to Ubuntu since WSL typically runs Ubuntu.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Installing Bash Completion in WSL (Ubuntu)...');

  // Step 1: Verify APT is available within WSL
  if (!apt.isInstalled()) {
    console.log('APT package manager is not available in this WSL environment.');
    return;
  }

  // Step 2: Check if bash-completion is already installed
  const isAlreadyInstalled = await apt.isPackageInstalled('bash-completion');
  if (isAlreadyInstalled) {
    console.log('Bash Completion is already installed, skipping installation.');
    return;
  }

  // Step 3: Update package lists to ensure we have the latest package info
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Step 4: Install bash-completion via APT
  console.log('Installing bash-completion via APT...');
  const installResult = await apt.install('bash-completion');

  if (!installResult.success) {
    console.log('Failed to install Bash Completion.');
    console.log(installResult.output);
    return;
  }

  // Step 5: Verify the installation succeeded
  const verifyInstalled = await apt.isPackageInstalled('bash-completion');
  if (!verifyInstalled) {
    console.log('Installation verification failed: bash-completion not found.');
    return;
  }

  console.log('Bash Completion installed successfully in WSL.');
  console.log('');
  console.log('Bash Completion should be enabled automatically in WSL Ubuntu.');
  console.log('If completion is not working, add the following to your ~/.bashrc:');
  console.log('');
  console.log('  if ! shopt -oq posix; then');
  console.log('    if [ -f /usr/share/bash-completion/bash_completion ]; then');
  console.log('      . /usr/share/bash-completion/bash_completion');
  console.log('    elif [ -f /etc/bash_completion ]; then');
  console.log('      . /etc/bash_completion');
  console.log('    fi');
  console.log('  fi');
  console.log('');
  console.log('Then run: source ~/.bashrc');
}

/**
 * Install Git completion scripts in Git Bash on Windows.
 *
 * Git Bash provides a minimal Bash environment on Windows. While it includes
 * Git-specific completions by default, this function ensures they are properly
 * configured. For full bash-completion support, WSL is recommended instead.
 *
 * Note: Git Bash (MINGW64) does not support the full bash-completion package.
 * This installer sets up Git command completion only.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Setting up Git completion in Git Bash...');

  // Step 1: Verify we're running in Git Bash (MINGW environment)
  const isMingw = process.env.MSYSTEM && process.env.MSYSTEM.includes('MINGW');
  if (!isMingw) {
    console.log('This does not appear to be a Git Bash (MINGW) environment.');
    return;
  }

  // Step 2: Check if Git is available
  if (!shell.commandExists('git')) {
    console.log('Git is not installed. Git Bash requires Git for Windows.');
    return;
  }

  // Step 3: Check for built-in Git completion in Git for Windows installation
  // Git for Windows typically includes completion scripts in its installation
  const gitCompletionPaths = [
    '/c/Program Files/Git/mingw64/share/git/completion/git-completion.bash',
    '/mingw64/share/git/completion/git-completion.bash',
    '/usr/share/git/completion/git-completion.bash'
  ];

  let foundCompletionPath = null;
  for (const completionPath of gitCompletionPaths) {
    const checkResult = await shell.exec(`test -f "${completionPath}" && echo "exists"`);
    if (checkResult.stdout.trim() === 'exists') {
      foundCompletionPath = completionPath;
      break;
    }
  }

  if (foundCompletionPath) {
    console.log('Git completion scripts found in Git for Windows installation.');
    console.log(`Location: ${foundCompletionPath}`);
    console.log('');
    console.log('To enable Git completion, add the following to your ~/.bashrc:');
    console.log('');
    console.log(`  if [ -f "${foundCompletionPath}" ]; then`);
    console.log(`    . "${foundCompletionPath}"`);
    console.log('  fi');
    console.log('');
    console.log('Then restart Git Bash or run: source ~/.bashrc');
    return;
  }

  // Step 4: If built-in completion not found, provide instructions for manual setup
  console.log('Git completion scripts not found in standard locations.');
  console.log('');
  console.log('To set up Git completion manually:');
  console.log('');
  console.log('  1. Create a directory: mkdir -p ~/bash_completion.d');
  console.log('  2. Download the script:');
  console.log('     curl -fsSL -o ~/bash_completion.d/git-completion.bash \\');
  console.log('       https://raw.githubusercontent.com/git/git/master/contrib/completion/git-completion.bash');
  console.log('  3. Add to ~/.bashrc:');
  console.log('     if [ -f ~/bash_completion.d/git-completion.bash ]; then');
  console.log('       . ~/bash_completion.d/git-completion.bash');
  console.log('     fi');
  console.log('  4. Restart Git Bash or run: source ~/.bashrc');
  console.log('');
  console.log('For full bash-completion support, consider using WSL instead of Git Bash.');
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Bash Completion can be installed on:
 * - macOS (via Homebrew)
 * - Ubuntu/Debian (via APT)
 * - Raspberry Pi OS (via APT)
 * - Amazon Linux/RHEL/Fedora (via DNF/YUM)
 * - WSL (via APT)
 * - Git Bash (manual setup with Git completion scripts)
 *
 * Note: Native Windows is not supported (Bash Completion is a Unix tool)
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  // Git Bash is handled specially - check for MSYSTEM environment variable
  if (platform.type === 'windows' && process.env.MSYSTEM) {
    return true;
  }
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs the appropriate installer.
 *
 * This function uses the os.detect() utility to identify the current platform
 * and delegates to the platform-specific installation function.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map detected platform types to their corresponding installer functions
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,           // Debian uses the same APT-based installer as Ubuntu
    'wsl': install_ubuntu_wsl,          // WSL typically runs Ubuntu
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'rhel': install_amazon_linux,       // RHEL uses the same DNF/YUM installer as Amazon Linux
    'fedora': install_amazon_linux,     // Fedora also uses DNF
    'windows': install_windows
  };

  // Check for Git Bash (MINGW) environment on Windows
  // Git Bash sets MSYSTEM environment variable to indicate MINGW
  if (platform.type === 'windows' && process.env.MSYSTEM) {
    await install_gitbash();
    return;
  }

  const installer = installers[platform.type];

  if (!installer) {
    // Platform not supported - return gracefully without error
    console.log(`Bash Completion is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

module.exports = {
  install,
  isEligible,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash
};

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
