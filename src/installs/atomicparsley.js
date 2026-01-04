#!/usr/bin/env node

/**
 * @fileoverview Install AtomicParsley - a lightweight command-line program for
 * reading, parsing, and setting metadata into MPEG-4 files.
 *
 * AtomicParsley specializes in iTunes-style metadata for .mp4, .m4a, .m4p, .m4v,
 * and .m4b files. It is commonly used alongside media download tools like yt-dlp
 * to automatically embed metadata, artwork, and chapter information.
 *
 * Supported platforms:
 * - macOS (via Homebrew)
 * - Ubuntu/Debian (via APT)
 * - Raspberry Pi OS (via APT)
 * - Amazon Linux/RHEL (via EPEL/YUM or build from source)
 * - Windows (via Chocolatey or winget)
 * - WSL Ubuntu (via APT)
 * - Git Bash (via Chocolatey/winget through PowerShell)
 *
 * @module installs/atomicparsley
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');
const winget = require('../utils/windows/winget');

/**
 * The command name used to verify AtomicParsley installation.
 * Note: AtomicParsley uses mixed case naming on all platforms.
 * @constant {string}
 */
const ATOMICPARSLEY_COMMAND = 'AtomicParsley';

/**
 * Checks if AtomicParsley is already installed by verifying the command exists.
 * This function handles the case-sensitivity of the AtomicParsley command name.
 *
 * @returns {Promise<boolean>} True if AtomicParsley is installed and accessible
 */
async function isAtomicParsleyInstalled() {
  // AtomicParsley uses mixed case - check both cases for compatibility
  // On case-insensitive systems (macOS, Windows), lowercase will also work
  // On case-sensitive systems (Linux), we need the exact case
  const mixedCaseExists = shell.commandExists(ATOMICPARSLEY_COMMAND);
  const lowerCaseExists = shell.commandExists('atomicparsley');

  return mixedCaseExists || lowerCaseExists;
}

/**
 * Verifies AtomicParsley installation by running --version command.
 * This provides a more thorough check than just verifying the command exists.
 *
 * @returns {Promise<boolean>} True if AtomicParsley responds to version command
 */
async function verifyInstallation() {
  // Try mixed case first (correct naming)
  const mixedCaseResult = await shell.exec(`${ATOMICPARSLEY_COMMAND} --version`);
  if (mixedCaseResult.code === 0) {
    return true;
  }

  // Fallback to lowercase for case-insensitive systems
  const lowerCaseResult = await shell.exec('atomicparsley --version');
  return lowerCaseResult.code === 0;
}

/**
 * Install AtomicParsley on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - 64-bit processor (Intel or Apple Silicon)
 *
 * The installation places the binary in /opt/homebrew/bin/ (Apple Silicon)
 * or /usr/local/bin/ (Intel).
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if AtomicParsley is already installed (idempotency check)
  const isInstalled = await isAtomicParsleyInstalled();
  if (isInstalled) {
    console.log('AtomicParsley is already installed, skipping...');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first using: dev install homebrew');
    return;
  }

  console.log('Installing AtomicParsley via Homebrew...');

  // Install using the brew utility - formula name is lowercase
  const result = await brew.install('atomicparsley');

  if (!result.success) {
    console.log(`Installation failed: ${result.output}`);
    return;
  }

  // Verify the installation was successful
  const verified = await verifyInstallation();
  if (!verified) {
    console.log('Installation completed but AtomicParsley could not be verified. Please check your PATH.');
    return;
  }

  console.log('AtomicParsley installed successfully.');
}

/**
 * Install AtomicParsley on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 20.04 (Focal) or later / Debian 10 (Buster) or later
 * - Universe repository enabled (enabled by default on most Ubuntu installations)
 * - sudo privileges
 *
 * Note: The package version in Ubuntu repositories may lag behind the latest
 * GitHub release. Ubuntu 24.04 includes version 20210715, while the latest
 * release is 20240608.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if AtomicParsley is already installed (idempotency check)
  const isInstalled = await isAtomicParsleyInstalled();
  if (isInstalled) {
    console.log('AtomicParsley is already installed, skipping...');
    return;
  }

  // Verify APT is available
  if (!apt.isInstalled()) {
    console.log('APT package manager is not available on this system.');
    return;
  }

  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log(`Failed to update package lists: ${updateResult.output}`);
    return;
  }

  console.log('Installing AtomicParsley via APT...');

  // Install using the apt utility - package name is lowercase
  const result = await apt.install('atomicparsley');

  if (!result.success) {
    console.log(`Installation failed: ${result.output}`);
    return;
  }

  // Verify the installation was successful
  const verified = await verifyInstallation();
  if (!verified) {
    console.log('Installation completed but AtomicParsley could not be verified.');
    return;
  }

  console.log('AtomicParsley installed successfully.');
}

/**
 * Install AtomicParsley on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL runs Ubuntu Linux, so AtomicParsley can be installed using APT commands
 * identical to the Ubuntu installation. The installed binary can process files
 * on both the Linux filesystem and the Windows filesystem (mounted at /mnt/c/).
 *
 * Prerequisites:
 * - WSL 2 with Ubuntu installed (20.04 or later recommended)
 * - sudo privileges within WSL
 *
 * Performance Note: Processing files on the Windows filesystem (/mnt/c/) may be
 * slower than files on the native Linux filesystem (~/). For batch operations,
 * consider copying files to the Linux filesystem first.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same installation process as regular Ubuntu
  // The APT package works identically in WSL
  await install_ubuntu();
}

/**
 * Install AtomicParsley on Raspberry Pi OS using APT.
 *
 * AtomicParsley is available in the Raspberry Pi OS repositories and supports
 * ARM architecture natively. The package manager automatically selects the
 * correct architecture (armhf for 32-bit, arm64 for 64-bit).
 *
 * Prerequisites:
 * - Raspberry Pi OS (Bullseye or later recommended)
 * - sudo privileges
 * - ARM 32-bit (armhf) or 64-bit (arm64) architecture
 *
 * Supported devices:
 * - Raspberry Pi 2, 3, 4 (32-bit OS): Uses armhf package
 * - Raspberry Pi 3, 4, 5 (64-bit OS): Uses arm64 package
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if AtomicParsley is already installed (idempotency check)
  const isInstalled = await isAtomicParsleyInstalled();
  if (isInstalled) {
    console.log('AtomicParsley is already installed, skipping...');
    return;
  }

  // Verify APT is available
  if (!apt.isInstalled()) {
    console.log('APT package manager is not available on this system.');
    return;
  }

  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log(`Failed to update package lists: ${updateResult.output}`);
    return;
  }

  console.log('Installing AtomicParsley via APT...');

  // Install using the apt utility - same package as Ubuntu/Debian
  const result = await apt.install('atomicparsley');

  if (!result.success) {
    console.log(`Installation failed: ${result.output}`);
    return;
  }

  // Verify the installation was successful
  const verified = await verifyInstallation();
  if (!verified) {
    console.log('Installation completed but AtomicParsley could not be verified.');
    return;
  }

  console.log('AtomicParsley installed successfully.');
}

/**
 * Install AtomicParsley on Amazon Linux/RHEL using YUM/DNF.
 *
 * AtomicParsley is not available in the default Amazon Linux or RHEL repositories,
 * but can be installed from EPEL (Extra Packages for Enterprise Linux) on older
 * versions. For Amazon Linux 2023 and RHEL 9, this function builds from source.
 *
 * Prerequisites:
 * - Amazon Linux 2, Amazon Linux 2023, RHEL 7/8/9, or compatible
 * - sudo privileges
 * - EPEL repository access (for Amazon Linux 2 / RHEL 7/8)
 *
 * Installation method:
 * - Amazon Linux 2 / RHEL 7/8: Installs via EPEL repository
 * - Amazon Linux 2023 / RHEL 9: Builds from source (EPEL not supported)
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if AtomicParsley is already installed (idempotency check)
  const isInstalled = await isAtomicParsleyInstalled();
  if (isInstalled) {
    console.log('AtomicParsley is already installed, skipping...');
    return;
  }

  // Detect if we have dnf or yum available
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');

  if (!hasDnf && !hasYum) {
    console.log('Neither DNF nor YUM package manager is available on this system.');
    return;
  }

  // First, try to install via EPEL (works on Amazon Linux 2, RHEL 7/8)
  console.log('Attempting to install AtomicParsley via EPEL...');

  // Try to enable EPEL repository
  const epelInstallCmd = hasDnf
    ? 'sudo dnf install -y epel-release'
    : 'sudo yum install -y epel-release';

  const epelResult = await shell.exec(epelInstallCmd);

  if (epelResult.code === 0) {
    // EPEL is available, try to install AtomicParsley
    const installCmd = hasDnf
      ? 'sudo dnf install -y AtomicParsley'
      : 'sudo yum install -y AtomicParsley';

    const result = await shell.exec(installCmd);

    if (result.code === 0) {
      // Verify the installation was successful
      const verified = await verifyInstallation();
      if (verified) {
        console.log('AtomicParsley installed successfully via EPEL.');
        return;
      }
    }
  }

  // EPEL installation failed - attempt to build from source
  // This is necessary for Amazon Linux 2023 and RHEL 9
  console.log('EPEL installation not available, building from source...');

  // Install build dependencies
  const depsCmd = hasDnf
    ? 'sudo dnf install -y cmake make gcc-c++ zlib-devel git'
    : 'sudo yum install -y cmake make gcc-c++ zlib-devel git';

  const depsResult = await shell.exec(depsCmd);
  if (depsResult.code !== 0) {
    console.log(`Failed to install build dependencies: ${depsResult.stderr}`);
    return;
  }

  // Clone the repository to a temporary directory
  const cloneResult = await shell.exec('git clone https://github.com/wez/atomicparsley.git /tmp/atomicparsley');
  if (cloneResult.code !== 0) {
    console.log(`Failed to clone repository: ${cloneResult.stderr}`);
    return;
  }

  // Build AtomicParsley
  console.log('Building AtomicParsley from source (this may take a few minutes)...');

  const cmakeResult = await shell.exec('cmake .', { cwd: '/tmp/atomicparsley' });
  if (cmakeResult.code !== 0) {
    console.log(`CMake configuration failed: ${cmakeResult.stderr}`);
    // Cleanup
    await shell.exec('rm -rf /tmp/atomicparsley');
    return;
  }

  const buildResult = await shell.exec('cmake --build . --config Release', { cwd: '/tmp/atomicparsley' });
  if (buildResult.code !== 0) {
    console.log(`Build failed: ${buildResult.stderr}`);
    // Cleanup
    await shell.exec('rm -rf /tmp/atomicparsley');
    return;
  }

  // Install the built binary
  const installBinaryResult = await shell.exec('sudo mv /tmp/atomicparsley/AtomicParsley /usr/local/bin/ && sudo chmod +x /usr/local/bin/AtomicParsley');
  if (installBinaryResult.code !== 0) {
    console.log(`Failed to install binary: ${installBinaryResult.stderr}`);
    // Cleanup
    await shell.exec('rm -rf /tmp/atomicparsley');
    return;
  }

  // Cleanup build directory
  await shell.exec('rm -rf /tmp/atomicparsley');

  // Verify the installation was successful
  const verified = await verifyInstallation();
  if (!verified) {
    console.log('Installation completed but AtomicParsley could not be verified.');
    return;
  }

  console.log('AtomicParsley built and installed successfully from source.');
}

/**
 * Install AtomicParsley on Windows using Chocolatey or winget.
 *
 * AtomicParsley is available on Windows through both Chocolatey and winget
 * package managers. This function prefers winget if available, falling back
 * to Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later
 * - Chocolatey or winget installed
 * - Administrator privileges
 * - Microsoft Visual C++ Redistributable (installed automatically with most packages)
 *
 * The Chocolatey package installs a portable version that places the executable
 * in the Chocolatey bin directory (typically C:\ProgramData\chocolatey\bin\).
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if AtomicParsley is already installed (idempotency check)
  const isInstalled = await isAtomicParsleyInstalled();
  if (isInstalled) {
    console.log('AtomicParsley is already installed, skipping...');
    return;
  }

  // Check which package manager is available - prefer winget over Chocolatey
  const hasWinget = winget.isInstalled();
  const hasChoco = choco.isInstalled();

  if (!hasWinget && !hasChoco) {
    console.log('Neither winget nor Chocolatey is available. Please install a package manager first.');
    return;
  }

  // Try winget first as it's the more modern option
  if (hasWinget) {
    console.log('Installing AtomicParsley via winget...');

    // Use the exact package ID for winget
    const result = await winget.install('wez.AtomicParsley');

    if (result.success) {
      // Verify the installation was successful
      const verified = await verifyInstallation();
      if (verified) {
        console.log('AtomicParsley installed successfully via winget.');
        return;
      }
      console.log('Installation reported success but AtomicParsley could not be verified. You may need to restart your terminal.');
      return;
    }

    // If winget failed and we have Chocolatey, try that
    if (hasChoco) {
      console.log('winget installation failed, trying Chocolatey...');
    } else {
      console.log(`Installation failed: ${result.output}`);
      return;
    }
  }

  // Fall back to Chocolatey
  if (hasChoco) {
    console.log('Installing AtomicParsley via Chocolatey...');

    const result = await choco.install('atomicparsley');

    if (!result.success) {
      console.log(`Installation failed: ${result.output}`);
      return;
    }

    // Verify the installation was successful
    const verified = await verifyInstallation();
    if (!verified) {
      console.log('Installation completed but AtomicParsley could not be verified. You may need to restart your terminal.');
      return;
    }

    console.log('AtomicParsley installed successfully via Chocolatey.');
  }
}

/**
 * Install AtomicParsley on Git Bash (Windows).
 *
 * Git Bash runs within Windows, so AtomicParsley is installed using Windows
 * package managers (Chocolatey or winget) via PowerShell. The installed binary
 * will be accessible from Git Bash after installation.
 *
 * Prerequisites:
 * - Windows 10 or later
 * - Git Bash installed
 * - Chocolatey or winget installed on the Windows host
 * - Administrator privileges (for package manager installation)
 *
 * Note: This function invokes PowerShell to perform the installation since
 * Git Bash cannot directly call Windows package managers.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if AtomicParsley is already installed (idempotency check)
  const isInstalled = await isAtomicParsleyInstalled();
  if (isInstalled) {
    console.log('AtomicParsley is already installed, skipping...');
    return;
  }

  // In Git Bash, we need to use PowerShell to invoke Windows package managers
  // Check which package manager is available via PowerShell
  const wingetCheck = await shell.exec('powershell.exe -Command "Get-Command winget -ErrorAction SilentlyContinue"');
  const chocoCheck = await shell.exec('powershell.exe -Command "Get-Command choco -ErrorAction SilentlyContinue"');

  const hasWinget = wingetCheck.code === 0;
  const hasChoco = chocoCheck.code === 0;

  if (!hasWinget && !hasChoco) {
    console.log('Neither winget nor Chocolatey is available. Please install a package manager first.');
    return;
  }

  // Try winget first
  if (hasWinget) {
    console.log('Installing AtomicParsley via winget (through PowerShell)...');

    const result = await shell.exec(
      'powershell.exe -Command "winget install --id wez.AtomicParsley --silent --accept-package-agreements --accept-source-agreements"'
    );

    if (result.code === 0) {
      console.log('AtomicParsley installed successfully via winget.');
      console.log('Note: You may need to restart Git Bash for the PATH to update.');
      return;
    }

    // If winget failed and we have Chocolatey, try that
    if (hasChoco) {
      console.log('winget installation failed, trying Chocolatey...');
    } else {
      console.log(`Installation failed: ${result.stderr}`);
      return;
    }
  }

  // Fall back to Chocolatey
  if (hasChoco) {
    console.log('Installing AtomicParsley via Chocolatey (through PowerShell)...');

    const result = await shell.exec('powershell.exe -Command "choco install atomicparsley -y"');

    if (result.code !== 0) {
      console.log(`Installation failed: ${result.stderr}`);
      return;
    }

    console.log('AtomicParsley installed successfully via Chocolatey.');
    console.log('Note: You may need to restart Git Bash for the PATH to update.');
  }
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically detects the current operating system and invokes
 * the corresponding platform-specific installation function. Each platform
 * installer is idempotent and will skip installation if AtomicParsley is
 * already present.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  /**
   * Mapping of platform types to their installation functions.
   * Multiple platform identifiers may map to the same installer where
   * the installation process is identical (e.g., debian and ubuntu both
   * use APT).
   */
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,
    'ubuntu-wsl': install_ubuntu_wsl,
    'wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'amazon-linux': install_amazon_linux,
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  const installer = installers[platform.type];

  if (!installer) {
    // Return gracefully without throwing an error for unsupported platforms
    console.log(`AtomicParsley is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

module.exports = {
  install,
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
