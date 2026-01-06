#!/usr/bin/env node

/**
 * @fileoverview Install Pngyu - a simple PNG image compression tool with a GUI.
 *
 * Pngyu is a cross-platform PNG image file compression tool that wraps pngquant,
 * providing a drag-and-drop graphical interface for batch PNG compression. It
 * achieves significant file size reduction (often 60-80%) by converting 24-bit
 * or 32-bit full-color PNGs to 8-bit indexed color using an excellent color
 * reduction algorithm.
 *
 * IMPORTANT PLATFORM NOTES:
 * - macOS: Pngyu GUI available via Homebrew Cask (macOS 14 and earlier only).
 *          For macOS 15 Sequoia and later, pngquant CLI is installed instead.
 * - Windows: Pngyu GUI available via Chocolatey.
 * - Ubuntu/Debian: Pngyu is not available. Installs pngquant CLI instead.
 * - Raspberry Pi OS: Pngyu is not available. Installs pngquant CLI instead.
 * - Amazon Linux: Pngyu is not available. Installs pngquant from EPEL or source.
 * - WSL: Pngyu is not available. Installs pngquant CLI within WSL.
 * - Git Bash: Pngyu is not available. Downloads pngquant Windows binary.
 *
 * NOTE: PNG compression with pngquant is a lossy process involving color
 * reduction. The original image cannot be restored after compression.
 * Always backup important files before compressing.
 *
 * @module installs/pngyu
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');
const fs = require('fs');

/**
 * Whether this installer requires a desktop environment to function.
 * Pngyu is a GUI PNG compression application.
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for Pngyu GUI application.
 */
const HOMEBREW_CASK_NAME = 'pngyu';

/**
 * The Homebrew formula name for pngquant CLI tool.
 */
const HOMEBREW_PNGQUANT_FORMULA = 'pngquant';

/**
 * The APT package name for pngquant on Debian-based systems.
 */
const APT_PACKAGE_NAME = 'pngquant';

/**
 * The Chocolatey package name for Pngyu GUI on Windows.
 */
const CHOCO_PACKAGE_NAME = 'pngyu';

/**
 * The Chocolatey package name for pngquant CLI on Windows.
 */
const CHOCO_PNGQUANT_PACKAGE = 'pngquant';

/**
 * Check if pngquant CLI is available on the system.
 *
 * pngquant is the underlying compression engine used by Pngyu. This function
 * checks if the command-line tool is accessible in the system PATH.
 *
 * @returns {boolean} True if pngquant command is available, false otherwise
 */
function isPngquantCommandAvailable() {
  return shell.commandExists('pngquant');
}

/**
 * Get the installed version of pngquant.
 *
 * Executes 'pngquant --version' and parses the output to extract the version
 * number. The output format is typically "3.0.3 (January 2024)".
 *
 * @returns {Promise<string|null>} The pngquant version string, or null if not installed
 */
async function getPngquantVersion() {
  // First check if the command exists to avoid unnecessary process spawning
  if (!isPngquantCommandAvailable()) {
    return null;
  }

  // Execute pngquant --version to get version information
  const result = await shell.exec('pngquant --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "3.0.3 (January 2024)" or just "3.0.3"
    const version = result.stdout.trim().split(' ')[0];
    return version || result.stdout.trim();
  }
  return null;
}

/**
 * Check if Pngyu GUI application is installed on macOS.
 *
 * Pngyu is installed as a standard macOS application in /Applications.
 * This function checks for the presence of the .app bundle.
 *
 * @returns {boolean} True if Pngyu.app exists in /Applications, false otherwise
 */
function isPngyuInstalledMacOS() {
  try {
    return fs.existsSync('/Applications/Pngyu.app');
  } catch (err) {
    return false;
  }
}

/**
 * Get the macOS version number for compatibility checking.
 *
 * Pngyu is not compatible with macOS 15 (Sequoia) and later. This function
 * extracts the major version number from the system to determine compatibility.
 *
 * @returns {Promise<number|null>} The major macOS version number, or null if detection fails
 */
async function getMacOSMajorVersion() {
  const result = await shell.exec('sw_vers -productVersion');
  if (result.code === 0 && result.stdout) {
    // Output format: "14.5" or "15.0.1"
    const versionParts = result.stdout.trim().split('.');
    const majorVersion = parseInt(versionParts[0], 10);
    return isNaN(majorVersion) ? null : majorVersion;
  }
  return null;
}

/**
 * Install Pngyu on macOS using Homebrew.
 *
 * This function handles the complex macOS installation scenario:
 * - On macOS 14 (Sonoma) and earlier: Installs Pngyu GUI via Homebrew Cask
 * - On macOS 15 (Sequoia) and later: Installs pngquant CLI instead (Pngyu incompatible)
 *
 * For Apple Silicon Macs, Rosetta 2 is required for Pngyu since it is an Intel-only
 * application. The function checks for Rosetta 2 availability but does not install it.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Verify Homebrew is available - required for installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Detect macOS version to determine installation strategy
  const macOSVersion = await getMacOSMajorVersion();
  console.log(`Detected macOS version: ${macOSVersion || 'unknown'}`);

  // macOS 15 (Sequoia) and later are incompatible with Pngyu
  // Install pngquant CLI instead as the documented alternative
  if (macOSVersion !== null && macOSVersion >= 15) {
    console.log('');
    console.log('NOTE: Pngyu is not compatible with macOS 15 (Sequoia) and later.');
    console.log('Installing pngquant CLI tool instead...');
    console.log('');

    await installPngquantMacOS();
    return;
  }

  // For macOS 14 and earlier, attempt to install Pngyu GUI
  console.log('Checking if Pngyu is already installed...');

  // Check if Pngyu.app already exists
  if (isPngyuInstalledMacOS()) {
    console.log('Pngyu is already installed, skipping...');
    return;
  }

  // Also check if Pngyu cask is installed via Homebrew
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Pngyu is already installed via Homebrew, skipping...');
    return;
  }

  // Attempt to install Pngyu via Homebrew Cask
  console.log('Installing Pngyu via Homebrew Cask...');
  const result = await shell.exec(`brew install --cask --quiet ${HOMEBREW_CASK_NAME}`);

  // Handle the case where Pngyu cask has been disabled in Homebrew
  // This can happen if the cask is discontinued upstream
  if (result.code !== 0) {
    const isDiscontinued = result.stderr &&
      (result.stderr.includes('discontinued') || result.stderr.includes('unavailable'));

    if (isDiscontinued) {
      console.log('');
      console.log('NOTE: Pngyu has been discontinued in Homebrew.');
      console.log('Installing pngquant CLI tool as the alternative...');
      console.log('');

      await installPngquantMacOS();
      return;
    }

    // For other errors, log the failure
    console.log('Failed to install Pngyu via Homebrew Cask.');
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify installation succeeded
  if (!isPngyuInstalledMacOS()) {
    console.log('Installation may have failed: Pngyu.app not found in /Applications.');
    console.log('');
    console.log('If you encounter Gatekeeper issues, try:');
    console.log('  xattr -d com.apple.quarantine /Applications/Pngyu.app');
    return;
  }

  console.log('Pngyu installed successfully.');
  console.log('');
  console.log('You can find Pngyu in your Applications folder.');
  console.log('');
  console.log('NOTE: On Apple Silicon Macs, Pngyu runs through Rosetta 2.');
  console.log('For better performance, consider using pngquant CLI:');
  console.log('  brew install pngquant');
}

/**
 * Install pngquant CLI on macOS via Homebrew.
 *
 * This is a helper function used when Pngyu GUI is not available or not
 * compatible (e.g., on macOS 15+). pngquant provides identical compression
 * capabilities through the command line.
 *
 * @returns {Promise<void>}
 */
async function installPngquantMacOS() {
  // Check if pngquant is already installed
  const existingVersion = await getPngquantVersion();
  if (existingVersion) {
    console.log(`pngquant ${existingVersion} is already installed, skipping...`);
    return;
  }

  // Also check if formula is installed but not in PATH
  const formulaInstalled = await brew.isFormulaInstalled(HOMEBREW_PNGQUANT_FORMULA);
  if (formulaInstalled) {
    console.log('pngquant is already installed via Homebrew, skipping...');
    return;
  }

  // Install pngquant via Homebrew
  console.log('Installing pngquant via Homebrew...');
  const result = await brew.install(HOMEBREW_PNGQUANT_FORMULA);

  if (!result.success) {
    console.log('Failed to install pngquant via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify installation succeeded
  const version = await getPngquantVersion();
  if (!version) {
    console.log('Installation may have failed: pngquant command not found.');
    return;
  }

  console.log(`pngquant ${version} installed successfully.`);
  console.log('');
  console.log('Usage examples:');
  console.log('  pngquant --quality=80-90 image.png');
  console.log('  pngquant --quality=80-90 --output compressed.png image.png');
  console.log('');
  console.log('For batch compression:');
  console.log('  find . -name "*.png" -exec pngquant --quality=80-90 --force --ext .png {} \\;');
}

/**
 * Install pngquant on Ubuntu/Debian using APT.
 *
 * Pngyu GUI is not available for Linux. This function installs pngquant,
 * the underlying command-line tool that provides identical compression
 * capabilities through the terminal.
 *
 * pngquant is available in the default Ubuntu and Debian repositories,
 * so no additional PPAs or repositories are required.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('NOTE: Pngyu GUI is not available for Linux.');
  console.log('Installing pngquant CLI tool instead...');
  console.log('');

  // Check if pngquant is already installed
  const existingVersion = await getPngquantVersion();
  if (existingVersion) {
    console.log(`pngquant ${existingVersion} is already installed, skipping...`);
    return;
  }

  // Update package index before installing
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install pngquant via APT
  // The apt.install function handles DEBIAN_FRONTEND=noninteractive and -y flag
  console.log('Installing pngquant via APT...');
  const result = await apt.install(APT_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install pngquant via APT.');
    console.log(result.output);
    return;
  }

  // Verify installation succeeded
  const version = await getPngquantVersion();
  if (!version) {
    console.log('Installation may have failed: pngquant command not found after install.');
    return;
  }

  console.log(`pngquant ${version} installed successfully.`);
  console.log('');
  console.log('Usage examples:');
  console.log('  pngquant --quality=80-90 image.png');
  console.log('  pngquant --quality=80-90 --output compressed.png image.png');
  console.log('');
  console.log('For batch compression:');
  console.log('  find . -name "*.png" -exec pngquant --quality=80-90 --force --ext .png {} \\;');
}

/**
 * Install pngquant on Ubuntu running in WSL.
 *
 * WSL (Windows Subsystem for Linux) provides a full Ubuntu environment,
 * so the installation process is identical to native Ubuntu using APT.
 *
 * Note that Pngyu GUI cannot run within WSL as it requires a native Windows
 * or macOS environment.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Delegate to the standard Ubuntu installer since WSL uses the same APT system
  await install_ubuntu();

  // Add WSL-specific usage tips
  console.log('');
  console.log('WSL TIPS:');
  console.log('  - Access Windows files through /mnt/c/, /mnt/d/, etc.');
  console.log('  - Example: pngquant --quality=80-90 /mnt/c/Users/You/Pictures/image.png');
  console.log('  - For better I/O performance, copy files to Linux filesystem first.');
}

/**
 * Install pngquant on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is Debian-based, so pngquant installation follows the same
 * process as Ubuntu/Debian. The pngquant package is available pre-compiled
 * for both 32-bit (armv7l) and 64-bit (aarch64) ARM architectures.
 *
 * Pngyu GUI is not available for Raspberry Pi.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('NOTE: Pngyu GUI is not available for Raspberry Pi OS.');
  console.log('Installing pngquant CLI tool instead...');
  console.log('');

  // Check if pngquant is already installed
  const existingVersion = await getPngquantVersion();
  if (existingVersion) {
    console.log(`pngquant ${existingVersion} is already installed, skipping...`);
    return;
  }

  // Update package index before installing
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install pngquant via APT
  console.log('Installing pngquant via APT...');
  const result = await apt.install(APT_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install pngquant via APT.');
    console.log(result.output);
    return;
  }

  // Verify installation succeeded
  const version = await getPngquantVersion();
  if (!version) {
    console.log('Installation may have failed: pngquant command not found after install.');
    return;
  }

  console.log(`pngquant ${version} installed successfully.`);
  console.log('');
  console.log('Usage examples:');
  console.log('  pngquant --quality=80-90 image.png');
  console.log('  pngquant --quality=80-90 --output compressed.png image.png');
  console.log('');
  console.log('RASPBERRY PI TIP:');
  console.log('  For faster compression on Raspberry Pi, use higher speed settings:');
  console.log('  pngquant --speed 10 --quality=80-90 image.png');
}

/**
 * Install pngquant on Amazon Linux using EPEL or from source.
 *
 * pngquant is not available in the standard Amazon Linux repositories.
 * - On Amazon Linux 2: Available through EPEL (Extra Packages for Enterprise Linux)
 * - On Amazon Linux 2023: EPEL is not fully supported, so this function compiles
 *   pngquant from source using Rust/Cargo.
 *
 * Pngyu GUI is not available for Amazon Linux.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('NOTE: Pngyu GUI is not available for Amazon Linux.');
  console.log('Installing pngquant CLI tool instead...');
  console.log('');

  // Check if pngquant is already installed
  const existingVersion = await getPngquantVersion();
  if (existingVersion) {
    console.log(`pngquant ${existingVersion} is already installed, skipping...`);
    return;
  }

  // Detect which package manager is available (dnf for AL2023, yum for AL2)
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Try EPEL-based installation first (works on Amazon Linux 2)
  if (packageManager === 'yum') {
    console.log('Attempting to install pngquant via EPEL...');

    // Enable EPEL repository
    const enableEpel = await shell.exec('sudo amazon-linux-extras install epel -y');
    if (enableEpel.code === 0) {
      // Try to install pngquant from EPEL
      const installResult = await shell.exec('sudo yum install -y pngquant');
      if (installResult.code === 0) {
        const version = await getPngquantVersion();
        if (version) {
          console.log(`pngquant ${version} installed successfully via EPEL.`);
          printPngquantUsage();
          return;
        }
      }
    }

    console.log('EPEL installation failed. Falling back to source compilation...');
  }

  // For Amazon Linux 2023 or when EPEL fails, compile from source
  await installPngquantFromSource();
}

/**
 * Compile and install pngquant from source.
 *
 * This helper function is used when pngquant is not available from package
 * repositories (e.g., Amazon Linux 2023). It installs the necessary build
 * dependencies, Rust toolchain, and compiles pngquant from the official
 * GitHub repository.
 *
 * @returns {Promise<void>}
 */
async function installPngquantFromSource() {
  console.log('Installing pngquant from source...');
  console.log('This may take several minutes...');
  console.log('');

  // Detect package manager
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Install build dependencies
  console.log('Installing build dependencies...');
  let depsResult;
  if (packageManager === 'dnf') {
    depsResult = await shell.exec('sudo dnf groupinstall -y "Development Tools" && sudo dnf install -y libpng-devel cmake git');
  } else {
    depsResult = await shell.exec('sudo yum groupinstall -y "Development Tools" && sudo yum install -y libpng-devel cmake git');
  }

  if (depsResult.code !== 0) {
    console.log('Failed to install build dependencies.');
    console.log(depsResult.stderr || depsResult.stdout);
    return;
  }

  // Check if Rust is installed, install if needed
  const rustInstalled = shell.commandExists('cargo');
  if (!rustInstalled) {
    console.log('Installing Rust toolchain...');
    const rustResult = await shell.exec('curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y');
    if (rustResult.code !== 0) {
      console.log('Failed to install Rust toolchain.');
      console.log(rustResult.stderr || rustResult.stdout);
      return;
    }

    // Source the Rust environment for this session
    process.env.PATH = `${process.env.HOME}/.cargo/bin:${process.env.PATH}`;
  }

  // Clone and build pngquant
  console.log('Cloning pngquant repository...');
  const cloneResult = await shell.exec('cd /tmp && rm -rf pngquant && git clone --recursive https://github.com/kornelski/pngquant.git');
  if (cloneResult.code !== 0) {
    console.log('Failed to clone pngquant repository.');
    console.log(cloneResult.stderr || cloneResult.stdout);
    return;
  }

  console.log('Building pngquant (this may take a few minutes)...');
  const cargoPath = `${process.env.HOME}/.cargo/bin/cargo`;
  const buildResult = await shell.exec(`cd /tmp/pngquant && ${cargoPath} build --release`);
  if (buildResult.code !== 0) {
    console.log('Failed to build pngquant.');
    console.log(buildResult.stderr || buildResult.stdout);
    return;
  }

  // Install the binary to /usr/local/bin
  console.log('Installing pngquant to /usr/local/bin...');
  const installResult = await shell.exec('sudo cp /tmp/pngquant/target/release/pngquant /usr/local/bin/');
  if (installResult.code !== 0) {
    console.log('Failed to install pngquant binary.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Clean up
  console.log('Cleaning up build files...');
  await shell.exec('cd /tmp && rm -rf pngquant');

  // Verify installation
  const version = await getPngquantVersion();
  if (!version) {
    console.log('Installation may have failed: pngquant command not found.');
    console.log('');
    console.log('Ensure /usr/local/bin is in your PATH:');
    console.log('  echo \'export PATH="/usr/local/bin:$PATH"\' >> ~/.bashrc');
    console.log('  source ~/.bashrc');
    return;
  }

  console.log(`pngquant ${version} installed successfully.`);
  printPngquantUsage();
}

/**
 * Print common pngquant usage examples.
 *
 * Helper function to display consistent usage information across platforms.
 *
 * @returns {void}
 */
function printPngquantUsage() {
  console.log('');
  console.log('Usage examples:');
  console.log('  pngquant --quality=80-90 image.png');
  console.log('  pngquant --quality=80-90 --output compressed.png image.png');
  console.log('');
  console.log('For batch compression:');
  console.log('  find . -name "*.png" -exec pngquant --quality=80-90 --force --ext .png {} \\;');
}

/**
 * Install Pngyu on Windows using Chocolatey.
 *
 * This function installs the Pngyu GUI application via Chocolatey. Pngyu
 * provides a graphical interface for batch PNG compression with drag-and-drop
 * support on Windows.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Verify Chocolatey is available
  if (!choco.isInstalled()) {
    console.log('Chocolatey is not installed. Please install Chocolatey first.');
    console.log('Run: dev install chocolatey');
    return;
  }

  // Check if Pngyu is already installed via Chocolatey
  const isChocoInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (isChocoInstalled) {
    console.log('Pngyu is already installed via Chocolatey, skipping...');
    return;
  }

  // Install Pngyu using Chocolatey
  console.log('Installing Pngyu via Chocolatey...');
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    console.log('Failed to install Pngyu via Chocolatey.');
    console.log(result.output);
    console.log('');
    console.log('As an alternative, you can install pngquant CLI:');
    console.log('  choco install pngquant -y');
    return;
  }

  // Verify installation
  const verified = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (!verified) {
    console.log('Installation may have failed: Pngyu package not found after install.');
    return;
  }

  console.log('Pngyu installed successfully.');
  console.log('');
  console.log('You can find Pngyu in your Start menu.');
  console.log('');
  console.log('For command-line usage, also install pngquant:');
  console.log('  choco install pngquant -y');
}

/**
 * Install pngquant in Git Bash on Windows using portable binaries.
 *
 * Git Bash runs in a MinGW environment on Windows. This function downloads
 * the official pngquant Windows binary from pngquant.org and places it in
 * ~/bin, which is then added to PATH.
 *
 * Pngyu GUI is not usable from Git Bash as it requires a native Windows
 * graphical environment.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('NOTE: Pngyu GUI requires a native Windows environment.');
  console.log('Installing pngquant CLI tool instead...');
  console.log('');

  // Check if pngquant is already available
  const existingVersion = await getPngquantVersion();
  if (existingVersion) {
    console.log(`pngquant ${existingVersion} is already installed, skipping...`);
    return;
  }

  // Create ~/bin directory if it doesn't exist
  console.log('Creating ~/bin directory...');
  const mkdirResult = await shell.exec('mkdir -p ~/bin');
  if (mkdirResult.code !== 0) {
    console.log('Failed to create ~/bin directory.');
    return;
  }

  // Download pngquant Windows binary from official source
  console.log('Downloading pngquant from pngquant.org...');
  const downloadUrl = 'https://pngquant.org/pngquant-windows.zip';
  const downloadResult = await shell.exec(`cd /tmp && curl -L -o pngquant.zip "${downloadUrl}"`);

  if (downloadResult.code !== 0) {
    console.log('Failed to download pngquant.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    console.log('');
    console.log('If you encounter certificate errors, try:');
    console.log(`  curl -L -k -o /tmp/pngquant.zip "${downloadUrl}"`);
    return;
  }

  // Extract the binary
  console.log('Extracting pngquant...');
  const extractResult = await shell.exec('cd /tmp && unzip -q pngquant.zip -d /tmp/pngquant-extract 2>/dev/null || powershell -command "Expand-Archive -Path \'/tmp/pngquant.zip\' -DestinationPath \'/tmp/pngquant-extract\'"');

  if (extractResult.code !== 0) {
    console.log('Failed to extract pngquant archive.');
    console.log(extractResult.stderr || extractResult.stdout);
    return;
  }

  // Move the executable to ~/bin
  console.log('Installing pngquant to ~/bin...');
  const moveResult = await shell.exec('mv /tmp/pngquant-extract/pngquant.exe ~/bin/');

  if (moveResult.code !== 0) {
    console.log('Failed to install pngquant binary.');
    console.log(moveResult.stderr || moveResult.stdout);
    return;
  }

  // Clean up
  await shell.exec('rm -rf /tmp/pngquant.zip /tmp/pngquant-extract');

  // Check if ~/bin is in PATH and add it if needed
  const pathCheck = await shell.exec('echo $PATH | grep -q "$HOME/bin"');
  if (pathCheck.code !== 0) {
    console.log('Adding ~/bin to PATH in ~/.bashrc...');
    await shell.exec('echo \'export PATH="$HOME/bin:$PATH"\' >> ~/.bashrc');
  }

  // Verify installation using the full path
  const verifyResult = await shell.exec('~/bin/pngquant.exe --version');
  if (verifyResult.code !== 0) {
    console.log('Installation may have failed: pngquant verification failed.');
    console.log('');
    console.log('Try running:');
    console.log('  source ~/.bashrc');
    console.log('  pngquant --version');
    return;
  }

  // Parse version from output
  const versionMatch = verifyResult.stdout.trim().split(' ')[0];
  const version = versionMatch || verifyResult.stdout.trim();

  console.log(`pngquant ${version} installed successfully.`);
  console.log('');
  console.log('Restart Git Bash or run: source ~/.bashrc');
  console.log('');
  console.log('Usage examples:');
  console.log('  pngquant --quality=80-90 image.png');
  console.log('  pngquant --quality=80-90 --output compressed.png image.png');
  console.log('');
  console.log('GIT BASH TIP:');
  console.log('  For Windows paths, use: MSYS_NO_PATHCONV=1 pngquant /c/Users/Me/image.png');
}

/**
 * Check if Pngyu (or pngquant) is already installed on the system.
 *
 * This function checks for Pngyu/pngquant installation using platform-appropriate methods:
 * - macOS: Checks if Pngyu cask is installed OR pngquant formula is installed
 * - Windows: Checks if Chocolatey package 'pngyu' is installed
 * - Linux/Git Bash: Checks if 'pngquant' command exists in PATH
 *
 * @returns {Promise<boolean>} True if Pngyu or pngquant is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    // Check for Pngyu app or pngquant CLI
    const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
    if (caskInstalled) return true;
    const formulaInstalled = await brew.isFormulaInstalled(HOMEBREW_PNGQUANT_FORMULA);
    if (formulaInstalled) return true;
    return isPngyuInstalledMacOS();
  }

  if (platform.type === 'windows') {
    return choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  }

  // Linux and Git Bash: Check if pngquant command exists
  return shell.commandExists('pngquant');
}

/**
 * Check if this installer is supported on the current platform.
 * Pngyu (or pngquant CLI) is supported on all major platforms.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  const supportedPlatforms = ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'];
  if (!supportedPlatforms.includes(platform.type)) {
    return false;
  }
  if (REQUIRES_DESKTOP && !os.isDesktopAvailable()) {
    return false;
  }
  return true;
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. It handles the complexity
 * of installing either the Pngyu GUI (where available) or the pngquant CLI
 * (on platforms where Pngyu is not supported).
 *
 * Supported platforms:
 * - macOS: Pngyu GUI (macOS 14 and earlier) or pngquant CLI (macOS 15+)
 * - Windows: Pngyu GUI via Chocolatey
 * - Ubuntu/Debian: pngquant CLI via APT
 * - Ubuntu on WSL: pngquant CLI via APT
 * - Raspberry Pi OS: pngquant CLI via APT
 * - Amazon Linux/RHEL: pngquant CLI via EPEL or source
 * - Git Bash: pngquant CLI portable binary
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
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  // Look up the installer for the detected platform
  const installer = installers[platform.type];

  // If no installer exists for this platform, inform the user gracefully
  // Do not throw an error - just log a message and return
  if (!installer) {
    console.log(`Pngyu is not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
  await installer();
}

// Export all functions for use as a module and for testing
module.exports = {
  REQUIRES_DESKTOP,
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

// Allow direct execution: node pngyu.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
