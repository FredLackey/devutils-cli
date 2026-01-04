#!/usr/bin/env node

/**
 * @fileoverview Install LaTeX (TeX Live) - a document preparation system.
 *
 * LaTeX is a document preparation system widely used for scientific, technical,
 * and academic writing. It excels at producing high-quality typeset documents,
 * particularly those containing complex mathematical equations, tables, and
 * cross-references. TeX Live is the standard, cross-platform distribution of
 * LaTeX maintained by the TeX Users Group (TUG).
 *
 * Key components included in TeX Live:
 * - TeX/LaTeX engines: pdfTeX, XeTeX, LuaTeX for document compilation
 * - Macro packages: Thousands of style files and document classes
 * - Fonts: Comprehensive font collections for professional typography
 * - Utilities: BibTeX for bibliographies, dvips, makeindex, and more
 * - tlmgr: TeX Live Manager for installing/updating packages
 *
 * This installer provides:
 * - macOS: MacTeX (TeX Live) via Homebrew cask (mactex-no-gui)
 * - Ubuntu/Debian: texlive-full via APT
 * - Raspberry Pi OS: texlive-full via APT
 * - Amazon Linux/RHEL: texlive-scheme-full via DNF/YUM
 * - Windows: TeX Live via Chocolatey
 * - WSL: texlive-full via APT (same as native Ubuntu)
 *
 * IMPORTANT: TeX Live is a large distribution (7+ GB for full installation).
 * Installation can take 30-90 minutes depending on network speed.
 *
 * @module installs/latex
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew cask name for MacTeX (TeX Live) on macOS.
 * Using mactex-no-gui which excludes GUI applications (TeXShop, BibDesk, etc.)
 * for a more command-line focused installation.
 */
const HOMEBREW_CASK_NAME = 'mactex-no-gui';

/**
 * The Chocolatey package name for TeX Live on Windows.
 */
const CHOCO_PACKAGE_NAME = 'texlive';

/**
 * The APT package name for TeX Live on Ubuntu/Debian/Raspberry Pi OS.
 * texlive-full provides the complete distribution.
 */
const APT_PACKAGE_NAME = 'texlive-full';

/**
 * The DNF/YUM package name for TeX Live on Amazon Linux/RHEL.
 */
const DNF_PACKAGE_NAME = 'texlive-scheme-full';

/**
 * Check if LaTeX is installed by verifying the 'latex' command exists.
 *
 * This is a quick check that works across all platforms. The presence of the
 * latex command indicates that TeX Live or another LaTeX distribution is
 * installed and available in the system PATH.
 *
 * @returns {boolean} True if the latex command is available, false otherwise
 */
function isLatexCommandAvailable() {
  return shell.commandExists('latex');
}

/**
 * Check if LaTeX is installed and get the version.
 *
 * Executes 'latex --version' to verify LaTeX is properly installed and
 * operational. Returns the version string if successful.
 *
 * @returns {Promise<string|null>} LaTeX version string, or null if not installed
 */
async function getLatexVersion() {
  // First check if the command exists to avoid error output
  if (!isLatexCommandAvailable()) {
    return null;
  }

  const result = await shell.exec('latex --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "pdfTeX 3.141592653-2.6-1.40.26 (TeX Live 2025)"
    // Extract the TeX Live version from the output
    const texLiveMatch = result.stdout.match(/TeX Live (\d{4})/);
    if (texLiveMatch) {
      return `TeX Live ${texLiveMatch[1]}`;
    }

    // Fallback: extract the first line which contains version info
    const firstLine = result.stdout.split('\n')[0];
    return firstLine.trim();
  }
  return null;
}

/**
 * Install MacTeX (TeX Live) on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 10.14 (Mojave) or later
 * - Homebrew package manager installed
 * - At least 8 GB free disk space for full installation
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * This function installs MacTeX without GUI applications (mactex-no-gui),
 * which is ideal for command-line workflows and automation. The full TeX Live
 * distribution is included.
 *
 * IMPORTANT: The installation downloads approximately 4 GB and takes 20-40 minutes.
 *
 * After installation, you may need to restart your terminal or run:
 *   eval "$(/usr/libexec/path_helper)"
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if LaTeX (TeX Live) is already installed...');

  // Check if LaTeX is already installed via command availability
  const existingVersion = await getLatexVersion();
  if (existingVersion) {
    console.log(`LaTeX (${existingVersion}) is already installed, skipping installation.`);
    return;
  }

  // Also check if the cask is installed (MacTeX may be installed but not in PATH)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('MacTeX is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('NOTE: If latex commands are not working, restart your terminal or run:');
    console.log('  eval "$(/usr/libexec/path_helper)"');
    console.log('');
    console.log('If the TeX binaries are still not found, add them to your PATH:');
    console.log('  export PATH="/Library/TeX/texbin:$PATH"');
    return;
  }

  // Verify Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  console.log('Installing MacTeX (TeX Live) via Homebrew...');
  console.log('');
  console.log('NOTE: This is a large installation (~4 GB download, ~8 GB installed).');
  console.log('The installation may take 20-40 minutes depending on your network speed.');
  console.log('');

  // Install MacTeX cask (without GUI applications)
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    console.log('Failed to install MacTeX via Homebrew.');
    console.log(result.output);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have enough disk space (8+ GB required)');
    console.log('  2. Run: brew update && brew cleanup');
    console.log('  3. Try manual installation: brew install --cask mactex-no-gui');
    console.log('');
    console.log('For a smaller installation (~300 MB), use BasicTeX:');
    console.log('  brew install --cask basictex');
    return;
  }

  // Verify the installation succeeded by checking if the cask is now installed
  const verified = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (!verified) {
    console.log('Installation may have failed: MacTeX cask not found after install.');
    return;
  }

  console.log('MacTeX (TeX Live) installed successfully.');
  console.log('');
  console.log('IMPORTANT: To complete setup, restart your terminal or run:');
  console.log('  eval "$(/usr/libexec/path_helper)"');
  console.log('');
  console.log('Verify the installation:');
  console.log('  latex --version');
  console.log('');
  console.log('Test with a simple document:');
  console.log('  echo \'\\documentclass{article}\\begin{document}Hello, LaTeX!\\end{document}\' > /tmp/test.tex');
  console.log('  pdflatex -interaction=nonstopmode -output-directory=/tmp /tmp/test.tex');
}

/**
 * Install TeX Live on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
 * - sudo privileges
 * - At least 6 GB free disk space for full installation
 *
 * This function installs the complete TeX Live distribution (texlive-full)
 * from the Ubuntu/Debian repositories. This includes all fonts, language
 * support, and documentation.
 *
 * IMPORTANT: The installation downloads several gigabytes and can take 30-60 minutes.
 *
 * NOTE: The distribution-packaged TeX Live version may be a year or two behind
 * the current release from TUG. For most users, this is perfectly adequate.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking if LaTeX (TeX Live) is already installed...');

  // Check if LaTeX is already installed by looking for the command
  const existingVersion = await getLatexVersion();
  if (existingVersion) {
    console.log(`LaTeX (${existingVersion}) is already installed, skipping installation.`);
    return;
  }

  console.log('Installing TeX Live via APT...');
  console.log('');
  console.log('NOTE: This is a large installation (several GB download, ~6 GB installed).');
  console.log('The installation may take 30-60 minutes depending on your network speed.');
  console.log('');

  // Update package lists before installing to ensure we get the correct packages
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install TeX Live using APT with non-interactive mode
  console.log(`Installing ${APT_PACKAGE_NAME}...`);
  const result = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (result.code !== 0) {
    console.log('Failed to install TeX Live via APT.');
    console.log(result.stderr || result.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have enough disk space (6+ GB required)');
    console.log('  2. Run: sudo apt-get update');
    console.log('  3. Try installing a smaller subset:');
    console.log('     sudo apt-get install -y texlive-latex-recommended texlive-fonts-recommended');
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = isLatexCommandAvailable();
  if (!verified) {
    console.log('Installation may have failed: latex command not found after install.');
    return;
  }

  // Get the installed version for confirmation
  const installedVersion = await getLatexVersion();
  console.log(`LaTeX (${installedVersion || 'TeX Live'}) installed successfully.`);
  console.log('');
  console.log('Verify the installation:');
  console.log('  latex --version');
  console.log('');
  console.log('Test with a simple document:');
  console.log('  echo \'\\documentclass{article}\\begin{document}Hello, LaTeX!\\end{document}\' > /tmp/test.tex');
  console.log('  pdflatex -interaction=nonstopmode -output-directory=/tmp /tmp/test.tex');
}

/**
 * Install TeX Live on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 * - At least 6 GB free disk space in WSL
 *
 * WSL provides a full Ubuntu environment, so TeX Live installation follows
 * the same APT-based process as native Ubuntu. The TeX Live installed within
 * WSL is separate from any installation on the Windows host.
 *
 * NOTE: To view generated PDFs from WSL, copy them to a Windows-accessible location:
 *   cp /tmp/test.pdf /mnt/c/Users/$USER/Desktop/
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('Installing TeX Live directly within WSL...');
  console.log('');

  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();

  // Additional WSL-specific guidance
  console.log('');
  console.log('WSL-specific notes:');
  console.log('  - To view PDFs, copy them to Windows: cp /tmp/test.pdf /mnt/c/Users/$USER/Desktop/');
  console.log('  - WSL disk I/O may be slower than native Linux; installation takes longer.');
}

/**
 * Install TeX Live on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
 * - Raspberry Pi 3B+ or later (64-bit capable hardware recommended)
 * - At least 6 GB free disk space for full installation
 * - At least 2 GB RAM (4 GB recommended for compiling complex documents)
 * - sudo privileges
 *
 * Raspberry Pi OS is based on Debian, so TeX Live installation follows the
 * same APT-based process as Ubuntu/Debian. The ARM architecture is fully
 * supported.
 *
 * IMPORTANT: Installation on Raspberry Pi can be significantly slower than
 * on desktop systems, especially when using an SD card. Expect 1-2 hours
 * for the full installation.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking if LaTeX (TeX Live) is already installed...');

  // Check if LaTeX is already installed
  const existingVersion = await getLatexVersion();
  if (existingVersion) {
    console.log(`LaTeX (${existingVersion}) is already installed, skipping installation.`);
    return;
  }

  console.log('Installing TeX Live via APT...');
  console.log('');
  console.log('NOTE: This is a large installation (several GB download, ~6 GB installed).');
  console.log('On Raspberry Pi, this may take 1-2 hours depending on your SD card speed.');
  console.log('Using a high-quality SD card (Class 10 or faster) or SSD will improve performance.');
  console.log('');

  // Update package lists before installing
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install TeX Live using APT with non-interactive mode
  console.log(`Installing ${APT_PACKAGE_NAME}...`);
  const result = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (result.code !== 0) {
    console.log('Failed to install TeX Live via APT.');
    console.log(result.stderr || result.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have enough disk space: df -h /');
    console.log('  2. For faster installation, use a smaller subset:');
    console.log('     sudo apt-get install -y texlive-latex-recommended texlive-fonts-recommended');
    console.log('  3. Consider using an SSD or faster SD card');
    return;
  }

  // Verify the installation succeeded
  const verified = isLatexCommandAvailable();
  if (!verified) {
    console.log('Installation may have failed: latex command not found after install.');
    return;
  }

  // Get the installed version for confirmation
  const installedVersion = await getLatexVersion();
  console.log(`LaTeX (${installedVersion || 'TeX Live'}) installed successfully.`);
  console.log('');
  console.log('Verify the installation:');
  console.log('  latex --version');
  console.log('');
  console.log('Raspberry Pi notes:');
  console.log('  - If compiling complex documents, ensure adequate RAM (4 GB recommended)');
  console.log('  - Consider adding swap space for memory-intensive compilations');
}

/**
 * Install TeX Live on Amazon Linux/RHEL using DNF or YUM.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8/9, or CentOS Stream
 * - sudo privileges
 * - At least 6 GB free disk space for full installation
 *
 * Amazon Linux 2023 and RHEL 9 use DNF as the package manager.
 * Amazon Linux 2 and RHEL 7/8 use YUM.
 *
 * NOTE: The texlive-scheme-full package may not be available in all repositories.
 * If unavailable, individual TeX Live packages will be installed.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking if LaTeX (TeX Live) is already installed...');

  // Check if LaTeX is already installed
  const existingVersion = await getLatexVersion();
  if (existingVersion) {
    console.log(`LaTeX (${existingVersion}) is already installed, skipping installation.`);
    return;
  }

  // Detect the package manager (dnf for AL2023/RHEL9, yum for AL2/RHEL7/8)
  const platform = os.detect();
  const packageManager = platform.packageManager;

  if (!packageManager || (packageManager !== 'dnf' && packageManager !== 'yum')) {
    console.log('Could not detect package manager (dnf or yum).');
    console.log('This installer supports Amazon Linux and RHEL-based systems.');
    return;
  }

  console.log(`Detected package manager: ${packageManager}`);
  console.log('');
  console.log('Installing TeX Live...');
  console.log('NOTE: This is a large installation and may take 20-40 minutes.');
  console.log('');

  // Try to install the full scheme first
  console.log(`Attempting to install ${DNF_PACKAGE_NAME}...`);
  let result = await shell.exec(`sudo ${packageManager} install -y ${DNF_PACKAGE_NAME}`);

  // If the full scheme is not available, install individual packages
  if (result.code !== 0) {
    console.log('');
    console.log('Full TeX Live scheme not available. Installing core packages...');

    // Install core TeX Live packages that are commonly available
    const corePackages = [
      'texlive',
      'texlive-latex',
      'texlive-xetex',
      'texlive-collection-latexrecommended',
      'texlive-collection-fontsrecommended'
    ];

    result = await shell.exec(
      `sudo ${packageManager} install -y ${corePackages.join(' ')}`
    );
  }

  if (result.code !== 0) {
    console.log('Failed to install TeX Live.');
    console.log(result.stderr || result.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you have enough disk space');
    console.log(`  2. Try: sudo ${packageManager} update`);
    console.log(`  3. Try installing basic packages: sudo ${packageManager} install -y texlive texlive-latex`);
    return;
  }

  // Verify the installation succeeded
  const verified = isLatexCommandAvailable();
  if (!verified) {
    console.log('Installation may have failed: latex command not found after install.');
    console.log('');
    console.log('Try restarting your terminal or check if TeX Live binaries are in your PATH.');
    return;
  }

  // Get the installed version for confirmation
  const installedVersion = await getLatexVersion();
  console.log(`LaTeX (${installedVersion || 'TeX Live'}) installed successfully.`);
  console.log('');
  console.log('Verify the installation:');
  console.log('  latex --version');
  console.log('');
  console.log('NOTE: Amazon Linux/RHEL packages may be slightly older than TUG releases.');
  console.log('This is intentional for stability.');
}

/**
 * Install TeX Live on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 * - At least 8 GB free disk space for full installation
 * - Stable internet connection (downloads several gigabytes)
 *
 * The installation uses Chocolatey to install the TeX Live distribution.
 * The full scheme provides the complete TeX Live distribution.
 *
 * IMPORTANT: Installation can take 45-90 minutes. A system restart may be
 * required to update the PATH.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking if LaTeX (TeX Live) is already installed...');

  // Check if LaTeX is already installed
  const existingVersion = await getLatexVersion();
  if (existingVersion) {
    console.log(`LaTeX (${existingVersion}) is already installed, skipping installation.`);
    return;
  }

  // Check if the package is installed via Chocolatey
  const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (packageInstalled) {
    console.log('TeX Live is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('NOTE: If latex commands are not working, restart your terminal.');
    console.log('The PATH should be updated to include TeX Live binaries.');
    return;
  }

  // Verify Chocolatey is available - it is required for Windows installation
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('Run: dev install chocolatey');
    return;
  }

  console.log('Installing TeX Live via Chocolatey...');
  console.log('');
  console.log('NOTE: This is a large installation (~8 GB installed).');
  console.log('The installation may take 45-90 minutes depending on your network speed.');
  console.log('');

  // Install TeX Live with full scheme using Chocolatey
  // The /scheme:full parameter installs the complete distribution
  const result = await shell.exec(
    `choco install ${CHOCO_PACKAGE_NAME} -y --params="'/scheme:full'" --execution-timeout=7200`
  );

  if (result.code !== 0) {
    console.log('Failed to install TeX Live via Chocolatey.');
    console.log(result.stderr || result.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure you are running as Administrator');
    console.log('  2. Check if you have enough disk space (8+ GB required)');
    console.log('  3. Try with a longer timeout:');
    console.log('     choco install texlive -y --params="\'/scheme:full\'" --execution-timeout=10800');
    console.log('  4. For a smaller installation:');
    console.log('     choco install texlive -y --params="\'/scheme:basic\'"');
    return;
  }

  // Verify the installation succeeded
  const verified = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!verified) {
    console.log('Installation may have failed: TeX Live package not found after install.');
    return;
  }

  console.log('TeX Live installed successfully via Chocolatey.');
  console.log('');
  console.log('IMPORTANT: Restart your terminal or PowerShell for PATH changes to take effect.');
  console.log('');
  console.log('Verify the installation after restarting:');
  console.log('  latex --version');
  console.log('');
  console.log('Test with a simple document:');
  console.log('  echo \\documentclass{article}\\begin{document}Hello, LaTeX!\\end{document} > %TEMP%\\test.tex');
  console.log('  pdflatex -interaction=nonstopmode -output-directory=%TEMP% %TEMP%\\test.tex');
}

/**
 * Install TeX Live from Git Bash on Windows.
 *
 * Git Bash runs within Windows and shares the Windows PATH. This function
 * installs TeX Live on the Windows host using Chocolatey via PowerShell
 * interop. After installation, the latex command will be available in Git Bash.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey package manager installed on Windows
 * - Administrator privileges
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing TeX Live on the Windows host...');
  console.log('');

  // Check if LaTeX is already available
  const existingVersion = await getLatexVersion();
  if (existingVersion) {
    console.log(`LaTeX (${existingVersion}) is already installed, skipping installation.`);
    return;
  }

  console.log('Installing TeX Live via Chocolatey (through PowerShell)...');
  console.log('');
  console.log('NOTE: This is a large installation (~8 GB installed).');
  console.log('The installation may take 45-90 minutes depending on your network speed.');
  console.log('');

  // Install via PowerShell using Chocolatey
  const result = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install texlive -y --params=\'/scheme:full\' --execution-timeout=7200"'
  );

  if (result.code !== 0) {
    console.log('Failed to install TeX Live.');
    console.log(result.stderr || result.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure Chocolatey is installed on Windows');
    console.log('  2. Run Git Bash as Administrator and retry');
    console.log('  3. Try installing directly from PowerShell:');
    console.log('     choco install texlive -y --params="\'/scheme:full\'"');
    return;
  }

  console.log('TeX Live installed successfully.');
  console.log('');
  console.log('IMPORTANT: Restart Git Bash for PATH changes to take effect.');
  console.log('');
  console.log('Verify the installation after restarting:');
  console.log('  latex --version');
  console.log('');
  console.log('Git Bash notes:');
  console.log('  - If latex is not found, verify TeX Live is in your PATH:');
  console.log('    echo $PATH | tr \':\' \'\\n\' | grep -i texlive');
  console.log('  - You may need to add TeX Live to PATH manually in ~/.bashrc:');
  console.log('    export PATH="/c/texlive/2025/bin/windows:$PATH"');
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. LaTeX (TeX Live) is
 * supported on all major platforms:
 *
 * - macOS: MacTeX via Homebrew (mactex-no-gui cask)
 * - Ubuntu/Debian: texlive-full via APT
 * - Ubuntu on WSL: texlive-full via APT
 * - Raspberry Pi OS: texlive-full via APT
 * - Amazon Linux/RHEL: texlive-scheme-full via DNF/YUM
 * - Windows: TeX Live via Chocolatey
 * - Git Bash: TeX Live on Windows host via Chocolatey
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
  // Do NOT throw an error - just return with a message
  if (!installer) {
    console.log(`LaTeX (TeX Live) is not available for ${platform.type}.`);
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

// Allow direct execution: node latex.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
