#!/usr/bin/env node

/**
 * @fileoverview Install ShellCheck - a static analysis tool for shell scripts.
 *
 * ShellCheck is designed to analyze Bash and POSIX sh scripts, identifying
 * syntax issues, semantic problems, and subtle pitfalls that can cause scripts
 * to fail unexpectedly. Think of ShellCheck as a linter for shell scripts - it
 * catches common mistakes, suggests best practices, and helps you write more
 * robust shell code.
 *
 * ShellCheck is essential for developers, system administrators, and DevOps
 * engineers who write shell scripts. It supports Bash, sh, dash, and ksh scripts.
 *
 * @module installs/shellcheck
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Install ShellCheck on macOS using Homebrew.
 *
 * This function installs ShellCheck via Homebrew, which is the recommended
 * method for macOS. Homebrew will automatically install the gmp (GNU multiple
 * precision arithmetic library) dependency if it is not already present.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Check if ShellCheck is already installed by verifying the command exists
  const isInstalled = shell.commandExists('shellcheck');
  if (isInstalled) {
    console.log('ShellCheck is already installed, skipping...');
    return;
  }

  // Install ShellCheck using Homebrew
  // The --quiet flag is handled internally by the brew utility
  console.log('Installing ShellCheck via Homebrew...');
  const result = await brew.install('shellcheck');

  if (!result.success) {
    console.log('Failed to install ShellCheck via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  const verified = shell.commandExists('shellcheck');
  if (!verified) {
    console.log('Installation may have failed: shellcheck command not found after install.');
    return;
  }

  console.log('ShellCheck installed successfully.');
}

/**
 * Install ShellCheck on Ubuntu/Debian using APT.
 *
 * ShellCheck is available in the default Ubuntu and Debian repositories, so no
 * additional PPAs or repositories are required. The repository version may be
 * slightly older than the latest release (e.g., 0.8.0 vs 0.11.0), but is stable
 * and recommended for most users.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if ShellCheck is already installed by looking for the command
  const isInstalled = shell.commandExists('shellcheck');
  if (isInstalled) {
    console.log('ShellCheck is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest available version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install ShellCheck using APT
  // The apt.install function uses DEBIAN_FRONTEND=noninteractive and -y flag
  // to ensure fully automated installation without prompts
  console.log('Installing ShellCheck via APT...');
  const result = await apt.install('shellcheck');

  if (!result.success) {
    console.log('Failed to install ShellCheck via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('shellcheck');
  if (!verified) {
    console.log('Installation may have failed: shellcheck command not found after install.');
    return;
  }

  console.log('ShellCheck installed successfully.');
}

/**
 * Install ShellCheck on Ubuntu running in WSL.
 *
 * WSL Ubuntu installations follow the same process as native Ubuntu using APT.
 * This function delegates to install_ubuntu() because WSL provides a full
 * Ubuntu environment with APT package management.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();
}

/**
 * Install ShellCheck on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so ShellCheck installation follows the
 * same process as Ubuntu/Debian. The ShellCheck package is available for both
 * 32-bit (armv7l/armhf) and 64-bit (aarch64/arm64) ARM architectures.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install ShellCheck on Amazon Linux using DNF or YUM.
 *
 * ShellCheck is NOT available in the default Amazon Linux repositories.
 * - For Amazon Linux 2023: Download the binary directly from GitHub releases
 * - For Amazon Linux 2: Enable EPEL and install ShellCheck (note: package name is "ShellCheck" with capitals)
 *
 * This function automatically detects whether to use dnf (Amazon Linux 2023)
 * or yum (Amazon Linux 2) based on the available package manager, and chooses
 * the appropriate installation method.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if ShellCheck is already installed by looking for the command
  const isInstalled = shell.commandExists('shellcheck');
  if (isInstalled) {
    console.log('ShellCheck is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // For Amazon Linux 2023 (uses dnf), we need to download the binary directly
  // because EPEL is not compatible with AL2023
  if (packageManager === 'dnf') {
    console.log('Installing ShellCheck via direct binary download (Amazon Linux 2023)...');

    // Detect architecture for appropriate binary download
    const arch = os.getArch();
    let archSuffix;

    if (arch === 'x64') {
      archSuffix = 'x86_64';
    } else if (arch === 'arm64') {
      archSuffix = 'aarch64';
    } else {
      console.log(`Unsupported architecture: ${arch}. ShellCheck binaries are available for x86_64 and aarch64.`);
      return;
    }

    // Ensure xz utilities are available for extracting the tarball
    const xzResult = await shell.exec('sudo dnf install -y xz');
    if (xzResult.code !== 0) {
      console.log('Warning: Failed to install xz utilities. Continuing anyway...');
    }

    // Download and extract ShellCheck binary from GitHub releases
    // Using version 0.11.0 as specified in the documentation
    const downloadUrl = `https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.${archSuffix}.tar.xz`;
    const downloadCommand = `curl -sSL "${downloadUrl}" | tar -xJv -C /tmp && sudo cp /tmp/shellcheck-v0.11.0/shellcheck /usr/local/bin/ && rm -rf /tmp/shellcheck-v0.11.0`;

    const result = await shell.exec(downloadCommand);

    if (result.code !== 0) {
      console.log('Failed to download and install ShellCheck binary.');
      console.log(result.stderr || result.stdout);
      return;
    }

    // Ensure the binary has execute permissions
    await shell.exec('sudo chmod +x /usr/local/bin/shellcheck');

  } else {
    // For Amazon Linux 2 (uses yum), enable EPEL and install via yum
    console.log('Enabling EPEL repository for Amazon Linux 2...');
    const epelResult = await shell.exec('sudo amazon-linux-extras install -y epel');

    if (epelResult.code !== 0) {
      console.log('Failed to enable EPEL repository.');
      console.log(epelResult.stderr || epelResult.stdout);
      return;
    }

    // Install ShellCheck using yum
    // Note: The package name is "ShellCheck" (with capital S and C) in the EPEL repository
    console.log('Installing ShellCheck via YUM (from EPEL)...');
    const result = await shell.exec('sudo yum install -y ShellCheck');

    if (result.code !== 0) {
      console.log('Failed to install ShellCheck via YUM.');
      console.log(result.stderr || result.stdout);
      return;
    }
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('shellcheck');
  if (!verified) {
    console.log('Installation may have failed: shellcheck command not found after install.');
    return;
  }

  console.log('ShellCheck installed successfully.');
}

/**
 * Install ShellCheck on Windows using Chocolatey.
 *
 * This function installs ShellCheck via Chocolatey, which downloads the
 * Windows binary and adds it to the PATH automatically. A new terminal window
 * may be required for PATH updates to take effect.
 *
 * Note: The Chocolatey package may be slightly behind the latest release
 * (e.g., 0.9.0 vs 0.11.0). For the latest version, users can use winget instead.
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

  // Check if ShellCheck is already installed via Chocolatey
  const isChocoShellCheckInstalled = await choco.isPackageInstalled('shellcheck');
  if (isChocoShellCheckInstalled) {
    console.log('ShellCheck is already installed via Chocolatey, skipping...');
    return;
  }

  // Also check if shellcheck command exists (might be installed via other means like winget)
  const commandExists = shell.commandExists('shellcheck');
  if (commandExists) {
    console.log('ShellCheck is already installed, skipping...');
    return;
  }

  // Install ShellCheck using Chocolatey
  // The -y flag automatically confirms all prompts for fully non-interactive installation
  console.log('Installing ShellCheck via Chocolatey...');
  const result = await choco.install('shellcheck');

  if (!result.success) {
    console.log('Failed to install ShellCheck via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled('shellcheck');
  if (!verified) {
    console.log('Installation may have failed: shellcheck package not found after install.');
    return;
  }

  console.log('ShellCheck installed successfully via Chocolatey.');
  console.log('');
  console.log('Note: You may need to open a new terminal window for the PATH update to take effect.');
}

/**
 * Install ShellCheck on Git Bash (Windows).
 *
 * Git Bash does not include ShellCheck by default. This function downloads
 * the Windows binary directly from the official ShellCheck GitHub releases
 * and places it in ~/bin, which is added to PATH if not already present.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if ShellCheck is already available in Git Bash
  const isInstalled = shell.commandExists('shellcheck');
  if (isInstalled) {
    console.log('ShellCheck is already installed, skipping...');
    return;
  }

  // Create the ~/bin directory if it does not exist
  // This directory is commonly used for user binaries in Git Bash
  console.log('Creating ~/bin directory if needed...');
  const homeDir = os.getHomeDir();
  const binDir = `${homeDir}/bin`;
  const mkdirResult = await shell.exec(`mkdir -p "${binDir}"`);
  if (mkdirResult.code !== 0) {
    console.log('Failed to create ~/bin directory.');
    console.log(mkdirResult.stderr || mkdirResult.stdout);
    return;
  }

  // Download the ShellCheck Windows binary from the official GitHub releases
  // Using version 0.11.0 as specified in the documentation
  console.log('Downloading ShellCheck from GitHub releases...');
  const downloadUrl = 'https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.zip';
  const zipPath = `${homeDir}/shellcheck.zip`;
  const downloadCommand = `curl -Lo "${zipPath}" "${downloadUrl}"`;
  const downloadResult = await shell.exec(downloadCommand);

  if (downloadResult.code !== 0) {
    console.log('Failed to download ShellCheck binary.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    console.log('');
    console.log('If you encounter SSL certificate errors, try running:');
    console.log(`  curl -kLo "${zipPath}" "${downloadUrl}"`);
    return;
  }

  // Extract the zip file and move the executable to ~/bin
  console.log('Extracting ShellCheck binary...');
  const extractCommand = `unzip -o "${zipPath}" -d "${binDir}" && mv "${binDir}/shellcheck-v0.11.0.exe" "${binDir}/shellcheck.exe" && rm "${zipPath}"`;
  const extractResult = await shell.exec(extractCommand);

  if (extractResult.code !== 0) {
    console.log('Failed to extract ShellCheck binary.');
    console.log(extractResult.stderr || extractResult.stdout);
    console.log('');
    console.log('If unzip is not available, try using PowerShell:');
    console.log(`  powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${binDir}' -Force"`);
    return;
  }

  // Check if ~/bin is already in PATH, and add it if not
  // This ensures ShellCheck will be available in future Git Bash sessions
  const pathCheckResult = await shell.exec(`echo $PATH | grep -q "${homeDir}/bin"`);
  if (pathCheckResult.code !== 0) {
    console.log('Adding ~/bin to PATH in ~/.bashrc...');
    await shell.exec(`echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc`);
    console.log('');
    console.log('Note: Run "source ~/.bashrc" or open a new terminal for PATH changes to take effect.');
  }

  // Verify the installation succeeded by checking if the binary exists
  // We cannot use commandExists here because PATH may not be updated yet in this session
  const verifyResult = await shell.exec(`test -f "${binDir}/shellcheck.exe"`);
  if (verifyResult.code !== 0) {
    console.log('Installation may have failed: shellcheck.exe not found in ~/bin.');
    return;
  }

  console.log('ShellCheck installed successfully.');
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. Supported platforms:
 * - macOS (Homebrew)
 * - Ubuntu/Debian (APT)
 * - Ubuntu on WSL (APT)
 * - Raspberry Pi OS (APT)
 * - Amazon Linux/RHEL (DNF/YUM or binary download)
 * - Windows (Chocolatey)
 * - Git Bash (Manual download from GitHub)
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their corresponding installer functions
  // Multiple platform types can map to the same installer (e.g., debian and ubuntu)
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
  // Do not throw an error - just log a message and return
  if (!installer) {
    console.log(`ShellCheck is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
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
