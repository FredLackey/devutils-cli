#!/usr/bin/env node

/**
 * @fileoverview Install winpty - Windows PTY interface for console programs.
 * @module installs/winpty
 *
 * winpty is a Windows software package that provides an interface similar to a
 * Unix pty-master for communicating with Windows console programs. It enables
 * interactive console applications (like Python REPL, Node.js REPL, and Docker)
 * to work correctly in terminal emulators that do not natively support Windows
 * console programs, such as MinTTY (used by Git Bash), Cygwin terminals, and MSYS2.
 *
 * IMPORTANT PLATFORM LIMITATION:
 * winpty is a Windows-only utility. Unix-like systems (macOS, Linux) have native
 * pseudoterminal (PTY) support built into the kernel and do not need winpty.
 *
 * INSTALLATION NOTE:
 * winpty is bundled with Git for Windows. If Git for Windows is installed,
 * winpty is already available in Git Bash. This installer installs Git for
 * Windows via Chocolatey, which includes winpty automatically.
 *
 * For unsupported platforms, this installer will display a simple message
 * and return gracefully without error.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const choco = require('../utils/windows/choco');

/**
 * The command name used to verify winpty is installed.
 * In Git Bash, winpty is available at /usr/bin/winpty.
 */
const WINPTY_COMMAND = 'winpty';

/**
 * The Chocolatey package name for Git for Windows, which includes winpty.
 * winpty is bundled with Git for Windows and is not available as a separate
 * Chocolatey package.
 */
const GIT_PACKAGE_NAME = 'git';

/**
 * Install winpty on macOS.
 *
 * IMPORTANT: winpty is NOT applicable to macOS.
 *
 * macOS is a Unix-based operating system with native pseudoterminal (PTY)
 * support built into the kernel. The PTY system in macOS allows terminal
 * emulators (like Terminal.app, iTerm2) to communicate directly with console
 * programs without requiring a translation layer.
 *
 * The functionality that winpty provides on Windows (bridging between terminal
 * emulators and console programs) is handled natively by macOS through:
 * - The /dev/pty* device files
 * - The posix_openpt() and related POSIX functions
 * - Native support in all macOS terminal emulators
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('winpty is not available for macOS.');
}

/**
 * Install winpty on Ubuntu/Debian.
 *
 * IMPORTANT: winpty is NOT applicable to Ubuntu/Debian Linux.
 *
 * Ubuntu and Debian are Linux distributions with native pseudoterminal (PTY)
 * support built into the kernel. The PTY subsystem in Linux allows terminal
 * emulators (like GNOME Terminal, Konsole, xterm) to communicate directly with
 * console programs.
 *
 * Linux provides PTY functionality through:
 * - The /dev/pts filesystem (devpts)
 * - The posix_openpt(), grantpt(), unlockpt(), and ptsname() functions
 * - Native kernel support via the CONFIG_UNIX98_PTYS option
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('winpty is not available for Ubuntu/Debian.');
}

/**
 * Install winpty on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * IMPORTANT: winpty is NOT needed within WSL.
 *
 * WSL (Windows Subsystem for Linux) runs a real Linux kernel (WSL 2) or a
 * Linux-compatible layer (WSL 1). Within WSL, you have native Linux PTY support
 * through the kernel, just like any other Linux distribution.
 *
 * The WSL terminal environment communicates with programs using standard Linux
 * PTY mechanisms, so winpty is unnecessary.
 *
 * Important distinction:
 * - Inside WSL: You are running Linux; use native PTY (no winpty needed)
 * - In Windows outside WSL: Use winpty with Git Bash/MinTTY for interactive
 *   Windows console programs
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('winpty is not available for WSL.');
}

/**
 * Install winpty on Raspberry Pi OS.
 *
 * IMPORTANT: winpty is NOT applicable to Raspberry Pi OS.
 *
 * Raspberry Pi OS is based on Debian Linux and has native pseudoterminal (PTY)
 * support built into the kernel. This applies to both 32-bit (armhf) and 64-bit
 * (arm64) versions of Raspberry Pi OS.
 *
 * The PTY system works identically to standard Linux:
 * - PTY devices are available at /dev/pts/*
 * - All terminal emulators communicate directly with console programs
 * - No translation layer is required
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('winpty is not available for Raspberry Pi OS.');
}

/**
 * Install winpty on Amazon Linux/RHEL.
 *
 * IMPORTANT: winpty is NOT applicable to Amazon Linux or RHEL.
 *
 * Amazon Linux (both AL2 and AL2023) is a Linux distribution with native
 * pseudoterminal (PTY) support built into the kernel. Whether running on EC2
 * instances or other environments, PTY support is available out of the box.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('winpty is not available for Amazon Linux/RHEL.');
}

/**
 * Install winpty on Windows using Chocolatey.
 *
 * winpty is bundled with Git for Windows. This function installs Git for Windows
 * via Chocolatey, which automatically includes winpty. After installation,
 * winpty will be available in Git Bash at /usr/bin/winpty.
 *
 * Prerequisites:
 * - Windows 10 version 1903 or higher (64-bit), or Windows 11
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 * - Internet connectivity
 *
 * The installation uses Chocolatey with the -y flag to automatically confirm
 * all prompts, enabling fully non-interactive installation.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if Chocolatey is available - it is required for Windows installation
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('Run: dev install chocolatey');
    return;
  }

  // Check if Git for Windows is already installed via Chocolatey
  // winpty is bundled with Git for Windows, so if Git is installed,
  // winpty should be available
  const isGitInstalled = await choco.isPackageInstalled(GIT_PACKAGE_NAME);
  if (isGitInstalled) {
    console.log('winpty is already installed (bundled with Git for Windows), skipping...');
    console.log('');
    console.log('Note: winpty is available in Git Bash. Use it to run interactive programs:');
    console.log('  winpty python');
    console.log('  winpty node');
    console.log('  winpty docker run -it ubuntu bash');
    return;
  }

  // Install Git for Windows, which includes winpty
  console.log('Installing winpty via Git for Windows (Chocolatey)...');
  console.log('winpty is bundled with Git for Windows and will be installed automatically.');
  console.log('');

  const result = await choco.install(GIT_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install Git for Windows via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if Git is now installed
  const verified = await choco.isPackageInstalled(GIT_PACKAGE_NAME);
  if (!verified) {
    console.log('Installation may have failed: Git for Windows not found after install.');
    return;
  }

  console.log('winpty installed successfully (bundled with Git for Windows).');
  console.log('');
  console.log('Note: Close and reopen your terminal for PATH changes to take effect.');
  console.log('');
  console.log('In Git Bash, use winpty to run interactive Windows console programs:');
  console.log('  winpty python');
  console.log('  winpty node');
  console.log('  winpty docker run -it ubuntu bash');
}

/**
 * Install winpty on Git Bash (Windows).
 *
 * Git Bash is included with Git for Windows, which also bundles winpty. If the
 * user is running this installer from within Git Bash, winpty should already be
 * available. This function verifies that winpty is present and provides guidance
 * if it is somehow missing.
 *
 * winpty is located at /usr/bin/winpty in Git Bash and is used to run
 * interactive Windows console programs that would otherwise not work correctly
 * in MinTTY (Git Bash's terminal emulator).
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if winpty is already available (it should be, since Git Bash includes it)
  const isInstalled = shell.commandExists(WINPTY_COMMAND);
  if (isInstalled) {
    console.log('winpty is already installed (bundled with Git for Windows), skipping...');
    console.log('');
    console.log('Use winpty to run interactive Windows console programs:');
    console.log('  winpty python');
    console.log('  winpty node');
    console.log('  winpty docker run -it ubuntu bash');
    return;
  }

  // winpty should always be available in Git Bash, but if it is missing,
  // the user likely has a corrupted or very old Git for Windows installation
  console.log('winpty is not found. It should be bundled with Git for Windows.');
  console.log('');
  console.log('To install winpty, reinstall Git for Windows from an Administrator');
  console.log('PowerShell or Command Prompt:');
  console.log('');
  console.log('  choco uninstall git -y');
  console.log('  choco install git -y');
  console.log('');
  console.log('Then close and reopen Git Bash.');
}

/**
 * Check if winpty is installed on the current system.
 * @returns {Promise<boolean>} True if winpty is installed
 */
async function isInstalled() {
  const platform = os.detect();
  if (platform.type === 'windows') {
    // winpty is bundled with Git for Windows
    return choco.isPackageInstalled('git');
  }
  if (platform.type === 'gitbash') {
    return shell.commandExists(WINPTY_COMMAND);
  }
  // winpty is not applicable on non-Windows platforms
  return false;
}

/**
 * Check if this installer is supported on the current platform.
 * winpty is only applicable to Windows and Git Bash (Windows environments).
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
 * appropriate platform-specific installer function. winpty is Windows-only,
 * so Unix-like platforms (macOS, Linux) will receive a message explaining
 * that winpty is not needed because they have native PTY support.
 *
 * Supported platforms (winpty is applicable):
 * - Windows: Installs Git for Windows via Chocolatey (includes winpty)
 * - Git Bash: Verifies winpty is available (bundled with Git for Windows)
 *
 * Unsupported platforms (returns gracefully with message - winpty not applicable):
 * - macOS: Native PTY support via kernel
 * - Ubuntu/Debian: Native PTY support via kernel
 * - WSL: Native Linux PTY support within WSL environment
 * - Raspberry Pi OS: Native PTY support via Linux kernel
 * - Amazon Linux/RHEL: Native PTY support via Linux kernel
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their corresponding installer functions
  // Unix-like platforms will receive a message that winpty is not available
  // because they have native PTY support
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
    console.log(`winpty is not available for ${platform.type}.`);
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
