#!/usr/bin/env node

/**
 * @fileoverview Install Pandoc - the universal document converter.
 *
 * Pandoc is a universal document converter that can convert files between a wide
 * variety of markup formats. Often called the "Swiss Army knife" of document
 * conversion, Pandoc supports input formats including Markdown, reStructuredText,
 * HTML, LaTeX, DOCX, EPUB, and many others, with equally diverse output options
 * including PDF, HTML, DOCX, ODT, and presentation formats.
 *
 * This installer provides:
 * - Pandoc via Homebrew for macOS
 * - Pandoc via APT for Ubuntu/Debian and Raspberry Pi OS
 * - Pandoc via static tarball from GitHub for Amazon Linux (not in standard repos)
 * - Pandoc via Chocolatey for Windows
 * - Pandoc via APT for WSL (Ubuntu)
 * - Pandoc via Chocolatey (Windows host) for Git Bash
 *
 * NOTE: PDF output requires a LaTeX distribution (BasicTeX, TeX Live, MiKTeX).
 * This installer does NOT install LaTeX automatically. For PDF support, run:
 *   dev install latex
 *
 * @module installs/pandoc
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew formula name for Pandoc on macOS.
 */
const HOMEBREW_FORMULA_NAME = 'pandoc';

/**
 * The APT package name for Pandoc on Debian-based systems.
 */
const APT_PACKAGE_NAME = 'pandoc';

/**
 * The Chocolatey package name for Pandoc on Windows.
 */
const CHOCO_PACKAGE_NAME = 'pandoc';

/**
 * The current Pandoc version for manual/tarball installations.
 * This is used for Amazon Linux where Pandoc is not in the standard repos.
 */
const PANDOC_VERSION = '3.8.3';

/**
 * Check if Pandoc is installed by verifying the 'pandoc' command exists.
 *
 * This is a quick check that works across all platforms by looking for
 * the pandoc executable in the system PATH.
 *
 * @returns {boolean} True if the pandoc command is available, false otherwise
 */
function isPandocCommandAvailable() {
  return shell.commandExists('pandoc');
}

/**
 * Check if Pandoc is installed and get the version.
 *
 * Executes 'pandoc --version' to verify Pandoc is properly installed
 * and operational. Returns the version string if successful.
 *
 * @returns {Promise<string|null>} Pandoc version string, or null if not installed
 */
async function getPandocVersion() {
  // First check if the command exists to avoid unnecessary process spawning
  if (!isPandocCommandAvailable()) {
    return null;
  }

  // Execute pandoc --version to get version information
  // The output format is typically: "pandoc 3.8.3\nFeatures: +server +lua..."
  const result = await shell.exec('pandoc --version');
  if (result.code === 0 && result.stdout) {
    // Parse version from output like: "pandoc 3.8.3"
    const match = result.stdout.match(/pandoc\s+([^\s\n]+)/);
    return match ? match[1] : result.stdout.split('\n')[0].trim();
  }
  return null;
}

/**
 * Install Pandoc on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - Terminal access
 *
 * Homebrew installs Pandoc along with its dependency (gmp - GNU multiple
 * precision arithmetic library) automatically.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if Pandoc is already installed...');

  // Check if Pandoc is already installed by verifying the command exists
  const existingVersion = await getPandocVersion();
  if (existingVersion) {
    console.log(`Pandoc ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Also check if the formula is installed via Homebrew
  // (Pandoc may be installed but not in PATH for some reason)
  const formulaInstalled = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (formulaInstalled) {
    console.log('Pandoc is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('NOTE: If Pandoc commands are not working, check your PATH.');
    console.log('Run: brew info pandoc');
    return;
  }

  // Verify Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  console.log('Installing Pandoc via Homebrew...');
  console.log('This may take a moment as dependencies are installed...');

  // Install Pandoc using Homebrew with the --quiet flag for cleaner output
  // This is suitable for automation scripts and CI/CD pipelines
  const result = await brew.install(HOMEBREW_FORMULA_NAME);

  if (!result.success) {
    console.log('Failed to install Pandoc via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command now exists
  const version = await getPandocVersion();
  if (!version) {
    console.log('Installation may have failed: pandoc command not found after install.');
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Restart your terminal session');
    console.log('  2. Run: pandoc --version');
    return;
  }

  console.log(`Pandoc ${version} installed successfully.`);
  console.log('');
  console.log('Verify installation with: pandoc --version');
  console.log('');
  console.log('NOTE: For PDF output, you need a LaTeX distribution.');
  console.log('Install BasicTeX with: brew install --cask basictex');
}

/**
 * Install Pandoc on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
 * - sudo privileges
 * - Internet connectivity
 *
 * Pandoc is available in the default Ubuntu and Debian repositories. Note that
 * repository versions may be older than the latest release, but are stable and
 * recommended for most users.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if Pandoc is already installed...');

  // Check if Pandoc is already installed by looking for the command
  const existingVersion = await getPandocVersion();
  if (existingVersion) {
    console.log(`Pandoc ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Update package lists before installing to ensure we get the latest available version
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install Pandoc using APT
  // The apt.install function uses DEBIAN_FRONTEND=noninteractive and -y flag
  // to ensure fully automated installation without prompts
  console.log('Installing Pandoc via APT...');
  const result = await apt.install(APT_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install Pandoc via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const version = await getPandocVersion();
  if (!version) {
    console.log('Installation may have failed: pandoc command not found after install.');
    return;
  }

  console.log(`Pandoc ${version} installed successfully.`);
  console.log('');
  console.log('NOTE: Repository versions may be older than the latest release.');
  console.log('For the latest version, download directly from GitHub releases.');
  console.log('');
  console.log('For PDF output, install LaTeX:');
  console.log('  sudo apt-get install -y texlive texlive-latex-extra');
}

/**
 * Install Pandoc on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004+ or Windows 11
 * - Windows Subsystem for Linux (WSL) with Ubuntu installed
 * - WSL 2 recommended for best performance
 * - sudo privileges within WSL
 *
 * WSL Ubuntu installations follow the same process as native Ubuntu using APT.
 * This function delegates to install_ubuntu() because WSL provides a full
 * Ubuntu environment with APT package management.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();
}

/**
 * Install Pandoc on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit recommended, 32-bit supported)
 * - Raspberry Pi 3B+ or later (64-bit capable hardware recommended)
 * - sudo privileges
 * - Internet connectivity
 *
 * Raspberry Pi OS is based on Debian, so Pandoc installation follows the same
 * APT-based process as Ubuntu/Debian. The pandoc package is available for both
 * 32-bit (armv7l) and 64-bit (aarch64) ARM architectures.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if Pandoc is already installed...');

  // Check if Pandoc is already installed
  const existingVersion = await getPandocVersion();
  if (existingVersion) {
    console.log(`Pandoc ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Update package lists before installing
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install Pandoc via APT
  console.log('Installing Pandoc via APT...');
  const result = await apt.install(APT_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install Pandoc via APT.');
    console.log(result.output);
    return;
  }

  // Verify installation
  const version = await getPandocVersion();
  if (!version) {
    console.log('Installation may have failed: pandoc command not found after install.');
    return;
  }

  console.log(`Pandoc ${version} installed successfully.`);
  console.log('');
  console.log('RASPBERRY PI NOTES:');
  console.log('  - For 64-bit systems, you can install the latest version from GitHub');
  console.log('  - TeX Live is large; consider texlive-latex-base for minimal PDF support');
  console.log('');
  console.log('For PDF output, install LaTeX:');
  console.log('  sudo apt-get install -y texlive texlive-latex-extra');
}

/**
 * Install Pandoc on Amazon Linux using static tarball from GitHub.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - sudo privileges
 * - Internet connectivity
 * - curl for downloading
 *
 * IMPORTANT: Pandoc is NOT available in the default Amazon Linux repositories.
 * This function downloads and installs Pandoc from the official GitHub releases
 * using the Linux tarball. The tarball includes statically linked binaries that
 * work without additional dependencies.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if Pandoc is already installed...');

  // Check if Pandoc is already installed
  const existingVersion = await getPandocVersion();
  if (existingVersion) {
    console.log(`Pandoc ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Detect architecture to download the correct build
  console.log('Detecting system architecture...');
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  console.log(`Architecture: ${arch}`);

  // Determine download URL based on architecture
  // x86_64 = Intel/AMD (most EC2 instances)
  // aarch64 = ARM64 (Graviton processors)
  let downloadUrl;
  let tarballName;

  if (arch === 'x86_64') {
    tarballName = `pandoc-${PANDOC_VERSION}-linux-amd64.tar.gz`;
    downloadUrl = `https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/${tarballName}`;
  } else if (arch === 'aarch64') {
    tarballName = `pandoc-${PANDOC_VERSION}-linux-arm64.tar.gz`;
    downloadUrl = `https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/${tarballName}`;
  } else {
    console.log(`Unsupported architecture: ${arch}`);
    console.log('Pandoc static builds are available for x86_64 and aarch64 architectures.');
    return;
  }

  // Download the Pandoc tarball from GitHub releases
  console.log('Downloading Pandoc from GitHub releases...');
  console.log('This may take a moment depending on your connection...');
  const downloadResult = await shell.exec(
    `curl -L -o /tmp/${tarballName} "${downloadUrl}"`
  );

  if (downloadResult.code !== 0) {
    console.log('Failed to download Pandoc.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Check your internet connection');
    console.log(`  2. Try downloading manually: curl -L -o /tmp/${tarballName} "${downloadUrl}"`);
    return;
  }

  // Extract the tarball to /usr/local
  // The --strip-components 1 removes the top-level directory from the archive
  console.log('Extracting Pandoc to /usr/local...');
  const extractResult = await shell.exec(
    `sudo tar xvzf /tmp/${tarballName} --strip-components 1 -C /usr/local`
  );

  if (extractResult.code !== 0) {
    console.log('Failed to extract Pandoc.');
    console.log(extractResult.stderr || extractResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have sudo privileges');
    console.log('  2. Check if /usr/local has enough space');
    return;
  }

  // Clean up the downloaded tarball
  console.log('Cleaning up temporary files...');
  await shell.exec(`rm -f /tmp/${tarballName}`);

  // Verify the installation succeeded
  const version = await getPandocVersion();
  if (!version) {
    console.log('Installation may have failed: pandoc command not found after install.');
    console.log('');
    console.log('Ensure /usr/local/bin is in your PATH:');
    console.log('  echo $PATH | grep -q "/usr/local/bin" && echo "OK" || echo "Missing"');
    console.log('');
    console.log('If missing, add it to your PATH:');
    console.log('  echo \'export PATH="/usr/local/bin:$PATH"\' >> ~/.bashrc && source ~/.bashrc');
    return;
  }

  console.log(`Pandoc ${version} installed successfully.`);
  console.log('');
  console.log('Installation location: /usr/local/bin/pandoc');
  console.log('');
  console.log('For PDF output, install LaTeX:');
  console.log('  Amazon Linux 2023: sudo dnf install -y texlive texlive-latex texlive-xetex');
  console.log('  Amazon Linux 2:    sudo yum install -y texlive texlive-latex texlive-xetex');
}

/**
 * Install Pandoc on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 (version 1803+) or Windows 11
 * - Chocolatey package manager installed
 * - Administrator PowerShell or Command Prompt
 *
 * Chocolatey installs Pandoc with the appropriate binary (32-bit or 64-bit)
 * based on system architecture and adds it to the PATH automatically. A new
 * terminal window may be required for PATH updates to take effect.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if Pandoc is already installed...');

  // Check if Pandoc is already installed via Chocolatey
  const isChocoInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (isChocoInstalled) {
    console.log('Pandoc is already installed via Chocolatey, skipping installation.');
    return;
  }

  // Also check if pandoc command exists (might be installed via other means like winget or MSI)
  const existingVersion = await getPandocVersion();
  if (existingVersion) {
    console.log(`Pandoc ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Verify Chocolatey is available - it is required for Windows installation
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('Run: dev install chocolatey');
    return;
  }

  // Install Pandoc using Chocolatey
  // The -y flag automatically confirms all prompts for fully non-interactive installation
  console.log('Installing Pandoc via Chocolatey...');
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install Pandoc via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!verified) {
    console.log('Installation may have failed: pandoc package not found after install.');
    return;
  }

  console.log('Pandoc installed successfully via Chocolatey.');
  console.log('');
  console.log('IMPORTANT: Open a new terminal window to refresh your PATH.');
  console.log('');
  console.log('Verify installation with: pandoc --version');
  console.log('');
  console.log('For PDF output, install MiKTeX:');
  console.log('  choco install miktex -y');
}

/**
 * Install Pandoc on Git Bash (Windows).
 *
 * Prerequisites:
 * - Windows 10 or Windows 11
 * - Git for Windows installed (includes Git Bash)
 * - Internet connectivity
 *
 * Git Bash does not include a package manager. Pandoc must be installed on
 * Windows first (via Chocolatey, winget, or MSI installer), and it will then
 * be available in Git Bash through the Windows PATH inheritance.
 *
 * This function checks if Pandoc is already available via the Windows PATH.
 * If not, it attempts to install via Chocolatey if available, or provides
 * instructions for manual installation.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('');

  // Check if Pandoc is already available (inherited from Windows PATH)
  const existingVersion = await getPandocVersion();
  if (existingVersion) {
    console.log(`Pandoc ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if Chocolatey is available from Git Bash
  // Git Bash can access Windows executables including choco.exe
  if (choco.isInstalled()) {
    console.log('Chocolatey detected. Installing Pandoc via Chocolatey...');

    // Check if already installed via Chocolatey
    const isChocoInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
    if (isChocoInstalled) {
      console.log('Pandoc is already installed via Chocolatey.');
      console.log('Close and reopen Git Bash to refresh your PATH.');
      return;
    }

    // Install using Chocolatey
    const result = await choco.install(CHOCO_PACKAGE_NAME);

    if (!result.success) {
      console.log('Failed to install Pandoc via Chocolatey.');
      console.log(result.output);
      console.log('');
      console.log('Try running from an Administrator PowerShell:');
      console.log('  choco install pandoc -y');
      return;
    }

    console.log('Pandoc installed successfully via Chocolatey.');
    console.log('');
    console.log('IMPORTANT: Close and reopen Git Bash to refresh your PATH.');
    console.log('');
    console.log('Verify installation with: pandoc --version');
    return;
  }

  // Chocolatey not available - provide manual installation instructions
  console.log('Pandoc is not installed and Chocolatey is not available.');
  console.log('');
  console.log('To install Pandoc for Git Bash:');
  console.log('');
  console.log('Option 1: Install Chocolatey first, then Pandoc:');
  console.log('  1. Open Administrator PowerShell');
  console.log('  2. Run: Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))');
  console.log('  3. Run: choco install pandoc -y');
  console.log('  4. Restart Git Bash');
  console.log('');
  console.log('Option 2: Download MSI installer from GitHub:');
  console.log(`  https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}-windows-x86_64.msi`);
  console.log('');
  console.log('After installation, restart Git Bash to pick up PATH changes.');
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
 * - Amazon Linux/RHEL (Static tarball from GitHub)
 * - Windows (Chocolatey)
 * - Git Bash (Chocolatey via Windows or manual installation)
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
    console.log(`Pandoc is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
  await installer();
}

// Export all functions for use as a module and for testing
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

// Allow direct execution: node pandoc.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
