#!/usr/bin/env node

/**
 * @fileoverview Install yum-utils - a collection of utilities for YUM/DNF package management.
 *
 * yum-utils provides essential tools for repository management, package debugging,
 * and system administration tasks on Red Hat-based Linux distributions. Key utilities
 * include:
 *
 * - yum-config-manager: Manage yum repository configuration
 * - repoquery: Query yum repositories for package information
 * - yumdownloader: Download RPM packages without installing
 * - package-cleanup: Clean up duplicate, orphaned, or old packages
 * - needs-restarting: Report processes that need restarting after updates
 *
 * Important naming note:
 * - On Amazon Linux 2, RHEL 7, CentOS 7: Install "yum-utils"
 * - On Amazon Linux 2023, RHEL 8+, Fedora 22+: Install "dnf-utils"
 *   (the yum-utils package name may still work as an alias)
 *
 * @module installs/yum-utils
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');

/**
 * Install yum-utils on macOS.
 *
 * yum-utils is not available for macOS because it is specifically designed for
 * Red Hat-based Linux distributions that use RPM/YUM/DNF package management.
 * macOS uses Homebrew, which is a completely different package management system.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // yum-utils is a Linux-only package for RPM-based systems
  // macOS does not have YUM/DNF and uses Homebrew instead
  console.log('yum-utils is not available for macOS.');
  return;
}

/**
 * Install yum-utils on Ubuntu/Debian.
 *
 * yum-utils is not available for Ubuntu or Debian because these distributions
 * use APT (Advanced Package Tool) with DEB packages, not YUM/DNF with RPM packages.
 * The underlying package management architectures are fundamentally different.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // yum-utils is a Linux-only package for RPM-based systems
  // Ubuntu/Debian use APT and do not support YUM/DNF
  console.log('yum-utils is not available for Ubuntu.');
  return;
}

/**
 * Install yum-utils on Ubuntu running in WSL.
 *
 * yum-utils is not available for Ubuntu on WSL because WSL Ubuntu uses APT,
 * not YUM/DNF. Even within WSL, Ubuntu remains a Debian-based distribution
 * with APT package management.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based system as native Ubuntu
  // yum-utils is not available for Debian-based distributions
  console.log('yum-utils is not available for Ubuntu on WSL.');
  return;
}

/**
 * Install yum-utils on Raspberry Pi OS.
 *
 * yum-utils is not available for Raspberry Pi OS because it is Debian-based
 * and uses APT with DEB packages. YUM/DNF and RPM packages are not part of
 * the Raspberry Pi ecosystem.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS is Debian-based and uses APT
  // yum-utils is not available for Debian-based distributions
  console.log('yum-utils is not available for Raspberry Pi OS.');
  return;
}

/**
 * Install yum-utils on Amazon Linux using DNF or YUM.
 *
 * This is the primary use case for yum-utils. Amazon Linux is a Red Hat-based
 * distribution that fully supports yum-utils.
 *
 * Installation behavior:
 * - Amazon Linux 2023: Installs "dnf-utils" which provides the same functionality
 * - Amazon Linux 2: Installs "yum-utils" using the yum package manager
 *
 * The function automatically detects which Amazon Linux version is running and
 * uses the appropriate package manager and package name.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Detect the platform to determine which package manager to use
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Determine the correct package name based on the package manager:
  // - dnf (AL2023, RHEL 8+): Use "dnf-utils"
  // - yum (AL2, RHEL 7): Use "yum-utils"
  const packageName = packageManager === 'dnf' ? 'dnf-utils' : 'yum-utils';

  // Check if the package is already installed using rpm query
  // We check for both package names since they provide the same tools
  const checkResult = await shell.exec('rpm -q yum-utils dnf-utils 2>/dev/null');

  // If either package is installed (exit code 0 for at least one), skip installation
  // The rpm -q command returns 0 if any of the queried packages are installed
  if (checkResult.code === 0 && checkResult.stdout.trim()) {
    // Check if the output indicates at least one package is installed
    // rpm -q returns "package X is not installed" for missing packages
    const installedPackages = checkResult.stdout
      .split('\n')
      .filter(line => !line.includes('is not installed') && line.trim());

    if (installedPackages.length > 0) {
      console.log(`${packageName} is already installed, skipping...`);
      return;
    }
  }

  // Build the install command using the appropriate package manager
  const installCommand = packageManager === 'dnf'
    ? `sudo dnf install -y ${packageName}`
    : `sudo yum install -y ${packageName}`;

  // Install the package
  console.log(`Installing ${packageName} via ${packageManager}...`);
  const result = await shell.exec(installCommand);

  // Check if the installation command succeeded
  if (result.code !== 0) {
    console.log(`Failed to install ${packageName} via ${packageManager}.`);
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking for yum-config-manager
  // This is one of the primary tools provided by yum-utils/dnf-utils
  const verified = shell.commandExists('yum-config-manager');
  if (!verified) {
    console.log('Installation may have failed: yum-config-manager command not found after install.');
    return;
  }

  console.log(`${packageName} installed successfully.`);
}

/**
 * Install yum-utils on Windows.
 *
 * yum-utils is not available for Windows because it is a Linux-specific tool
 * for managing RPM packages and YUM/DNF repositories. Windows uses completely
 * different package management systems (Chocolatey, winget, or MSI installers).
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // yum-utils is a Linux-only package for RPM-based systems
  // Windows does not have YUM/DNF and uses Chocolatey/winget instead
  console.log('yum-utils is not available for Windows.');
  return;
}

/**
 * Install yum-utils on Git Bash (Windows).
 *
 * yum-utils is not available for Git Bash because Git Bash is a terminal
 * emulator for Windows that does not include Linux package management systems.
 * The yum-utils package requires a full Linux environment with RPM database support.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Git Bash runs on Windows and does not have access to YUM/DNF/RPM
  // yum-utils requires a full Linux environment
  console.log('yum-utils is not available for Git Bash.');
  return;
}

/**
 * Check if yum-utils is installed on the current system.
 * @returns {Promise<boolean>} True if yum-utils is installed
 */
async function isInstalled() {
  const platform = os.detect();
  if (['amazon_linux', 'fedora', 'rhel'].includes(platform.type)) {
    // Check if either yum-utils or dnf-utils is installed
    const checkResult = await shell.exec('rpm -q yum-utils dnf-utils 2>/dev/null');
    if (checkResult.code === 0 && checkResult.stdout.trim()) {
      const installedPackages = checkResult.stdout
        .split('\n')
        .filter(line => !line.includes('is not installed') && line.trim());
      return installedPackages.length > 0;
    }
    return false;
  }
  return false;
}

/**
 * Check if this installer is supported on the current platform.
 * yum-utils is only supported on Red Hat-based Linux distributions.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['amazon_linux', 'fedora', 'rhel'].includes(platform.type);
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. yum-utils is only supported
 * on Red Hat-based Linux distributions:
 *
 * - Amazon Linux 2 (YUM)
 * - Amazon Linux 2023 (DNF via dnf-utils)
 * - RHEL 7 (YUM)
 * - RHEL 8+ (DNF via dnf-utils)
 * - CentOS 7 (YUM)
 * - CentOS Stream 8+ (DNF via dnf-utils)
 * - Fedora (DNF via dnf-utils)
 *
 * All other platforms (macOS, Ubuntu, Debian, Windows, etc.) are not supported
 * because they use different package management systems.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their corresponding installer functions
  // yum-utils is only supported on Red Hat-based distributions (amazon_linux, rhel, fedora)
  // All other platforms return gracefully with an informational message
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
    console.log(`yum-utils is not available for ${platform.type}.`);
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
