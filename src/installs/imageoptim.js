#!/usr/bin/env node

/**
 * @fileoverview Install ImageOptim and equivalent image optimization tools.
 * @module installs/imageoptim
 *
 * ImageOptim is a powerful image optimization tool that reduces file sizes of
 * PNG, JPEG, GIF, and SVG images through lossless compression. It integrates
 * multiple optimization engines including OptiPNG, PNGCrush, Zopfli, JPEGOptim,
 * Jpegtran, Guetzli, Gifsicle, SVGO, and MozJPEG.
 *
 * This installer provides:
 * - ImageOptim GUI app via Homebrew for macOS (the native app)
 * - optipng, jpegoptim, gifsicle via APT for Ubuntu/Debian
 * - optipng, jpegoptim, gifsicle via APT for Raspberry Pi OS
 * - optipng, jpegoptim via source compilation or EPEL for Amazon Linux
 * - FileOptimizer GUI and optipng, jpegoptim via Chocolatey for Windows
 * - optipng, jpegoptim, gifsicle via APT for WSL (Ubuntu)
 * - optipng, jpegoptim portable binaries for Git Bash
 *
 * IMPORTANT PLATFORM NOTE:
 * ImageOptim is a macOS-only GUI application. For Linux, Windows, WSL, and
 * Git Bash environments, this installer provides equivalent command-line tools
 * (optipng, jpegoptim, gifsicle) and alternative applications (Trimage,
 * FileOptimizer) that use many of the same underlying optimization engines.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Whether this installer requires a desktop environment to function.
 * ImageOptim is a GUI image optimization application.
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for ImageOptim on macOS.
 * This installs the native macOS GUI application.
 */
const HOMEBREW_CASK_NAME = 'imageoptim';

/**
 * The Homebrew formula name for the ImageOptim CLI on macOS.
 * This is an optional companion tool for command-line automation.
 */
const HOMEBREW_CLI_FORMULA_NAME = 'imageoptim-cli';

/**
 * The APT package names for image optimization tools on Debian-based systems.
 * These are the command-line equivalents to ImageOptim's internal engines.
 */
const APT_PACKAGE_NAMES = ['optipng', 'jpegoptim', 'gifsicle'];

/**
 * The Chocolatey package names for image optimization tools on Windows.
 * FileOptimizer provides a GUI similar to ImageOptim.
 */
const CHOCO_PACKAGE_NAMES = ['optipng', 'jpegoptim'];

/**
 * The expected path where ImageOptim.app is installed on macOS.
 */
const IMAGEOPTIM_APP_PATH = '/Applications/ImageOptim.app';

/**
 * Check if optipng command is available in the system PATH.
 *
 * optipng is the primary PNG optimization tool and serves as the main
 * indicator of whether image optimization tools are installed.
 *
 * @returns {boolean} True if optipng is available, false otherwise
 */
function isOptipngAvailable() {
  return shell.commandExists('optipng');
}

/**
 * Check if jpegoptim command is available in the system PATH.
 *
 * jpegoptim is the primary JPEG optimization tool.
 *
 * @returns {boolean} True if jpegoptim is available, false otherwise
 */
function isJpegoptimAvailable() {
  return shell.commandExists('jpegoptim');
}

/**
 * Check if gifsicle command is available in the system PATH.
 *
 * gifsicle is the primary GIF optimization tool.
 *
 * @returns {boolean} True if gifsicle is available, false otherwise
 */
function isGifsicleAvailable() {
  return shell.commandExists('gifsicle');
}

/**
 * Get the installed version of optipng.
 *
 * Executes 'optipng --version' to retrieve version information.
 *
 * @returns {Promise<string|null>} Version string, or null if not installed
 */
async function getOptipngVersion() {
  if (!isOptipngAvailable()) {
    return null;
  }

  const result = await shell.exec('optipng --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "OptiPNG version 0.7.7"
    const match = result.stdout.match(/OptiPNG version\s+([^\s]+)/i);
    return match ? match[1] : result.stdout.split('\n')[0].trim();
  }
  return null;
}

/**
 * Get the installed version of jpegoptim.
 *
 * Executes 'jpegoptim --version' to retrieve version information.
 *
 * @returns {Promise<string|null>} Version string, or null if not installed
 */
async function getJpegoptimVersion() {
  if (!isJpegoptimAvailable()) {
    return null;
  }

  const result = await shell.exec('jpegoptim --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "jpegoptim v1.5.0"
    const match = result.stdout.match(/jpegoptim\s+v?([^\s]+)/i);
    return match ? match[1] : result.stdout.split('\n')[0].trim();
  }
  return null;
}

/**
 * Check if ImageOptim.app exists on macOS.
 *
 * Verifies that the GUI application is installed in the Applications folder.
 *
 * @returns {Promise<boolean>} True if ImageOptim.app exists, false otherwise
 */
async function isImageOptimAppInstalled() {
  const result = await shell.exec(`test -d "${IMAGEOPTIM_APP_PATH}"`);
  return result.code === 0;
}

/**
 * Install ImageOptim on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 11 (Big Sur) or later
 * - Homebrew package manager installed
 * - Xcode Command Line Tools installed
 *
 * This installs the native macOS GUI application ImageOptim via Homebrew Cask.
 * ImageOptim is Apple Silicon and Intel compatible.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if ImageOptim is already installed...');

  // Check if ImageOptim.app already exists
  const appInstalled = await isImageOptimAppInstalled();
  if (appInstalled) {
    console.log('ImageOptim is already installed, skipping installation.');
    return;
  }

  // Also check if the cask is installed via Homebrew
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('ImageOptim is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('NOTE: If ImageOptim is not in Applications, check:');
    console.log('  brew info --cask imageoptim');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing ImageOptim.'
    );
  }

  console.log('Installing ImageOptim via Homebrew Cask...');

  // Install ImageOptim cask (use --quiet flag for cleaner output)
  const result = await shell.exec('brew install --cask --quiet imageoptim');

  if (result.code !== 0) {
    throw new Error(
      `Failed to install ImageOptim via Homebrew.\n` +
      `Output: ${result.stderr || result.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update' and retry\n` +
      `  2. Check for Homebrew issues: brew doctor\n` +
      `  3. Try manual installation: brew install --cask imageoptim`
    );
  }

  // Verify installation succeeded
  const verified = await isImageOptimAppInstalled();
  if (!verified) {
    throw new Error(
      'Installation appeared to complete but ImageOptim.app was not found.\n\n' +
      'Please check:\n' +
      '  1. Look in /Applications for ImageOptim.app\n' +
      '  2. Run: brew info --cask imageoptim'
    );
  }

  console.log('ImageOptim installed successfully.');
  console.log('');
  console.log(`Installation location: ${IMAGEOPTIM_APP_PATH}`);
  console.log('');
  console.log('To launch ImageOptim:');
  console.log('  - Open from Applications folder');
  console.log('  - Or run: open -a ImageOptim');
  console.log('');
  console.log('Optional: Install ImageOptim-CLI for command-line automation:');
  console.log('  brew install imageoptim-cli');
}

/**
 * Install image optimization tools on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
 * - sudo privileges
 * - At least 100 MB free disk space
 *
 * NOTE: ImageOptim is macOS-only. This installs the command-line tools
 * optipng, jpegoptim, and gifsicle which are the same engines ImageOptim
 * uses internally.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu() {
  console.log('NOTE: ImageOptim is a macOS-only application.');
  console.log('Installing equivalent command-line tools (optipng, jpegoptim, gifsicle)...');
  console.log('');

  // Check if tools are already installed
  const optipngVersion = await getOptipngVersion();
  const jpegoptimVersion = await getJpegoptimVersion();

  if (optipngVersion && jpegoptimVersion) {
    console.log(`optipng ${optipngVersion} is already installed.`);
    console.log(`jpegoptim ${jpegoptimVersion} is already installed.`);
    console.log('Image optimization tools are already installed, skipping installation.');
    return;
  }

  // Update package index before installing
  console.log('Updating package index...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Could not update package index, continuing anyway...');
  }

  // Install image optimization tools via APT
  console.log('Installing optipng, jpegoptim, and gifsicle via APT...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAMES.join(' ')}`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install image optimization tools via APT.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'sudo apt-get update' and retry\n` +
      `  2. Try installing individually:\n` +
      `     sudo apt-get install -y optipng\n` +
      `     sudo apt-get install -y jpegoptim\n` +
      `     sudo apt-get install -y gifsicle`
    );
  }

  // Verify installation succeeded
  const verifiedOptipng = await getOptipngVersion();
  const verifiedJpegoptim = await getJpegoptimVersion();

  if (!verifiedOptipng || !verifiedJpegoptim) {
    throw new Error(
      'Installation appeared to complete but tools were not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: optipng --version && jpegoptim --version'
    );
  }

  console.log('Image optimization tools installed successfully.');
  console.log('');
  console.log('Installed tools:');
  console.log(`  - optipng ${verifiedOptipng}: PNG optimization`);
  console.log(`  - jpegoptim ${verifiedJpegoptim}: JPEG optimization`);
  if (isGifsicleAvailable()) {
    console.log('  - gifsicle: GIF optimization');
  }
  console.log('');
  console.log('Usage examples:');
  console.log('  optipng -o2 image.png           # Optimize PNG');
  console.log('  jpegoptim --strip-all image.jpg # Optimize JPEG');
  console.log('  gifsicle -O3 input.gif -o out.gif # Optimize GIF');
  console.log('');
  console.log('Optional: Install Trimage for a GUI interface:');
  console.log('  sudo apt-get install -y trimage');
}

/**
 * Install image optimization tools on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (Bookworm or Bullseye), 32-bit or 64-bit
 * - Raspberry Pi 3 or later (earlier models have limited performance)
 * - sudo privileges
 * - At least 100 MB free disk space
 *
 * NOTE on ARM Architecture: Raspberry Pi OS is Debian-based, and all
 * optimization tools are available pre-compiled for ARM architecture.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_raspbian() {
  console.log('NOTE: ImageOptim is a macOS-only application.');
  console.log('Installing equivalent command-line tools (optipng, jpegoptim, gifsicle)...');
  console.log('');

  // Check if tools are already installed
  const optipngVersion = await getOptipngVersion();
  const jpegoptimVersion = await getJpegoptimVersion();

  if (optipngVersion && jpegoptimVersion) {
    console.log(`optipng ${optipngVersion} is already installed.`);
    console.log(`jpegoptim ${jpegoptimVersion} is already installed.`);
    console.log('Image optimization tools are already installed, skipping installation.');
    return;
  }

  // Update package index before installing
  console.log('Updating package index...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Could not update package index, continuing anyway...');
  }

  // Install image optimization tools via APT
  console.log('Installing optipng, jpegoptim, and gifsicle via APT...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAMES.join(' ')}`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install image optimization tools via APT.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'sudo apt-get update' and retry\n` +
      `  2. Try installing individually:\n` +
      `     sudo apt-get install -y optipng\n` +
      `     sudo apt-get install -y jpegoptim\n` +
      `     sudo apt-get install -y gifsicle`
    );
  }

  // Verify installation succeeded
  const verifiedOptipng = await getOptipngVersion();
  const verifiedJpegoptim = await getJpegoptimVersion();

  if (!verifiedOptipng || !verifiedJpegoptim) {
    throw new Error(
      'Installation appeared to complete but tools were not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: optipng --version && jpegoptim --version'
    );
  }

  console.log('Image optimization tools installed successfully.');
  console.log('');
  console.log('Installed tools:');
  console.log(`  - optipng ${verifiedOptipng}: PNG optimization`);
  console.log(`  - jpegoptim ${verifiedJpegoptim}: JPEG optimization`);
  if (isGifsicleAvailable()) {
    console.log('  - gifsicle: GIF optimization');
  }
  console.log('');
  console.log('RASPBERRY PI NOTES:');
  console.log('  - Use lower optimization levels for faster processing:');
  console.log('    optipng -o2 image.png (instead of -o7)');
  console.log('  - Process images one at a time to avoid memory issues');
  console.log('');
  console.log('Usage examples:');
  console.log('  optipng -o2 image.png           # Optimize PNG');
  console.log('  jpegoptim --strip-all image.jpg # Optimize JPEG');
}

/**
 * Install image optimization tools on Amazon Linux using EPEL or source compilation.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - sudo privileges
 * - At least 200 MB free disk space (includes build dependencies)
 *
 * IMPORTANT: optipng and jpegoptim are not available in standard Amazon Linux
 * repositories. On Amazon Linux 2, EPEL can be enabled. On Amazon Linux 2023,
 * compilation from source is required.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('NOTE: ImageOptim is a macOS-only application.');
  console.log('Installing equivalent command-line tools (optipng, jpegoptim)...');
  console.log('');

  // Check if tools are already installed
  const optipngVersion = await getOptipngVersion();
  const jpegoptimVersion = await getJpegoptimVersion();

  if (optipngVersion && jpegoptimVersion) {
    console.log(`optipng ${optipngVersion} is already installed.`);
    console.log(`jpegoptim ${jpegoptimVersion} is already installed.`);
    console.log('Image optimization tools are already installed, skipping installation.');
    return;
  }

  // Detect if this is Amazon Linux 2 or 2023 by checking for amazon-linux-extras
  console.log('Detecting Amazon Linux version...');
  const isAL2 = shell.commandExists('amazon-linux-extras');

  if (isAL2) {
    // Amazon Linux 2: Use EPEL repository
    console.log('Detected Amazon Linux 2. Installing via EPEL...');

    // Enable EPEL repository
    console.log('Enabling EPEL repository...');
    const epelResult = await shell.exec('sudo amazon-linux-extras install epel -y');
    if (epelResult.code !== 0) {
      console.log('Warning: Could not enable EPEL, will try to continue...');
    }

    // Install via yum
    console.log('Installing optipng, jpegoptim, and gifsicle via YUM...');
    const installResult = await shell.exec('sudo yum install -y optipng jpegoptim gifsicle');

    if (installResult.code !== 0) {
      throw new Error(
        `Failed to install image optimization tools via YUM.\n` +
        `Output: ${installResult.stderr}\n\n` +
        `Troubleshooting:\n` +
        `  1. Ensure EPEL is enabled: sudo amazon-linux-extras install epel -y\n` +
        `  2. Try: sudo yum install -y optipng jpegoptim`
      );
    }
  } else {
    // Amazon Linux 2023: Compile from source
    console.log('Detected Amazon Linux 2023. Installing via source compilation...');
    console.log('This may take several minutes...');
    console.log('');

    // Install build dependencies
    console.log('Installing build dependencies...');
    const depsResult = await shell.exec(
      'sudo dnf groupinstall -y "Development Tools" && ' +
      'sudo dnf install -y zlib-devel libjpeg-turbo-devel'
    );

    if (depsResult.code !== 0) {
      throw new Error(
        `Failed to install build dependencies.\n` +
        `Output: ${depsResult.stderr}\n\n` +
        `Troubleshooting:\n` +
        `  1. Run: sudo dnf groupinstall -y "Development Tools"\n` +
        `  2. Run: sudo dnf install -y zlib-devel libjpeg-turbo-devel`
      );
    }

    // Install optipng from source if not already installed
    if (!optipngVersion) {
      console.log('Downloading and compiling optipng...');
      const optipngCommands = [
        'cd /tmp',
        'curl -L -o optipng.tar.gz https://sourceforge.net/projects/optipng/files/OptiPNG/optipng-0.7.8/optipng-0.7.8.tar.gz/download',
        'tar -xzf optipng.tar.gz',
        'cd optipng-0.7.8',
        './configure',
        'make',
        'sudo make install',
        'cd /tmp && rm -rf optipng-0.7.8 optipng.tar.gz'
      ];

      const optipngResult = await shell.exec(optipngCommands.join(' && '));
      if (optipngResult.code !== 0) {
        throw new Error(
          `Failed to compile optipng.\n` +
          `Output: ${optipngResult.stderr}\n\n` +
          `Troubleshooting:\n` +
          `  1. Ensure zlib-devel is installed\n` +
          `  2. Check the error message above for missing dependencies`
        );
      }
    }

    // Install jpegoptim from source if not already installed
    if (!jpegoptimVersion) {
      console.log('Downloading and compiling jpegoptim...');
      const jpegoptimCommands = [
        'cd /tmp',
        'curl -L -o jpegoptim.tar.gz https://github.com/tjko/jpegoptim/archive/refs/tags/v1.5.5.tar.gz',
        'tar -xzf jpegoptim.tar.gz',
        'cd jpegoptim-1.5.5',
        './configure',
        'make',
        'sudo make install',
        'cd /tmp && rm -rf jpegoptim-1.5.5 jpegoptim.tar.gz'
      ];

      const jpegoptimResult = await shell.exec(jpegoptimCommands.join(' && '));
      if (jpegoptimResult.code !== 0) {
        throw new Error(
          `Failed to compile jpegoptim.\n` +
          `Output: ${jpegoptimResult.stderr}\n\n` +
          `Troubleshooting:\n` +
          `  1. Ensure libjpeg-turbo-devel is installed\n` +
          `  2. Check the error message above for missing dependencies`
        );
      }
    }
  }

  // Verify installation succeeded
  const verifiedOptipng = await getOptipngVersion();
  const verifiedJpegoptim = await getJpegoptimVersion();

  if (!verifiedOptipng || !verifiedJpegoptim) {
    // Check if /usr/local/bin is in PATH
    console.log('');
    console.log('Tools may have been installed but are not in PATH.');
    console.log('If /usr/local/bin is not in your PATH, add it:');
    console.log('  echo \'export PATH="/usr/local/bin:$PATH"\' >> ~/.bashrc');
    console.log('  source ~/.bashrc');
    return;
  }

  console.log('Image optimization tools installed successfully.');
  console.log('');
  console.log('Installed tools:');
  console.log(`  - optipng ${verifiedOptipng}: PNG optimization`);
  console.log(`  - jpegoptim ${verifiedJpegoptim}: JPEG optimization`);
  console.log('');
  console.log('Installation location: /usr/local/bin/');
  console.log('');
  console.log('Usage examples:');
  console.log('  optipng -o2 image.png           # Optimize PNG');
  console.log('  jpegoptim --strip-all image.jpg # Optimize JPEG');
}

/**
 * Install image optimization tools on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 or later (64-bit)
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * NOTE: ImageOptim is macOS-only. This installs optipng and jpegoptim
 * command-line tools via Chocolatey.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('NOTE: ImageOptim is a macOS-only application.');
  console.log('Installing equivalent command-line tools (optipng, jpegoptim)...');
  console.log('');

  // Check if tools are already installed
  const optipngVersion = await getOptipngVersion();
  const jpegoptimVersion = await getJpegoptimVersion();

  if (optipngVersion && jpegoptimVersion) {
    console.log(`optipng ${optipngVersion} is already installed.`);
    console.log(`jpegoptim ${jpegoptimVersion} is already installed.`);
    console.log('Image optimization tools are already installed, skipping installation.');
    return;
  }

  // Verify Chocolatey is available
  if (!choco.isInstalled()) {
    throw new Error(
      'Chocolatey is not installed. Please install Chocolatey first:\n\n' +
      'Run the following in an Administrator PowerShell:\n' +
      '  Set-ExecutionPolicy Bypass -Scope Process -Force; ' +
      '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; ' +
      'iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))\n\n' +
      'Then retry installing.'
    );
  }

  console.log('Installing optipng and jpegoptim via Chocolatey...');

  // Install each package
  for (const packageName of CHOCO_PACKAGE_NAMES) {
    const isInstalled = await choco.isPackageInstalled(packageName);
    if (isInstalled) {
      console.log(`${packageName} is already installed, skipping...`);
      continue;
    }

    console.log(`Installing ${packageName}...`);
    const result = await choco.install(packageName);

    if (!result.success) {
      console.log(`Warning: Failed to install ${packageName}: ${result.output}`);
    }
  }

  console.log('');
  console.log('Image optimization tools installation complete.');
  console.log('');
  console.log('IMPORTANT: Open a new terminal window to refresh your PATH.');
  console.log('Alternatively, run: refreshenv');
  console.log('');
  console.log('Installed tools:');
  console.log('  - optipng: PNG optimization');
  console.log('  - jpegoptim: JPEG optimization');
  console.log('');
  console.log('Usage examples:');
  console.log('  optipng -o2 image.png           # Optimize PNG');
  console.log('  jpegoptim --strip-all image.jpg # Optimize JPEG');
  console.log('');
  console.log('For a GUI alternative, install FileOptimizer:');
  console.log('  choco install fileoptimizer -y');
}

/**
 * Install image optimization tools on Ubuntu running in WSL.
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 *
 * NOTE: Image optimization tools installed in Windows are not accessible from
 * WSL. This function installs them separately within the WSL Ubuntu environment.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('NOTE: ImageOptim is a macOS-only application.');
  console.log('Installing equivalent command-line tools within WSL...');
  console.log('');

  // Check if tools are already installed
  const optipngVersion = await getOptipngVersion();
  const jpegoptimVersion = await getJpegoptimVersion();

  if (optipngVersion && jpegoptimVersion) {
    console.log(`optipng ${optipngVersion} is already installed.`);
    console.log(`jpegoptim ${jpegoptimVersion} is already installed.`);
    console.log('Image optimization tools are already installed, skipping installation.');
    return;
  }

  // Update package index before installing
  console.log('Updating package index...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Could not update package index, continuing anyway...');
  }

  // Install image optimization tools via APT
  console.log('Installing optipng, jpegoptim, and gifsicle via APT...');
  const installResult = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAMES.join(' ')}`
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install image optimization tools via APT.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. If you see DNS errors, try:\n` +
      `     echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf\n` +
      `  2. Run 'sudo apt-get update' and retry`
    );
  }

  // Verify installation succeeded
  const verifiedOptipng = await getOptipngVersion();
  const verifiedJpegoptim = await getJpegoptimVersion();

  if (!verifiedOptipng || !verifiedJpegoptim) {
    throw new Error(
      'Installation appeared to complete but tools were not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your WSL session\n' +
      '  2. Run: optipng --version && jpegoptim --version'
    );
  }

  console.log('Image optimization tools installed successfully.');
  console.log('');
  console.log('Installed tools:');
  console.log(`  - optipng ${verifiedOptipng}: PNG optimization`);
  console.log(`  - jpegoptim ${verifiedJpegoptim}: JPEG optimization`);
  if (isGifsicleAvailable()) {
    console.log('  - gifsicle: GIF optimization');
  }
  console.log('');
  console.log('WSL NOTES:');
  console.log('  - Access Windows files through /mnt/c/, /mnt/d/, etc.');
  console.log('  - Example: optipng -o2 /mnt/c/Users/You/Pictures/image.png');
  console.log('  - Files on Windows filesystem are slower to process');
  console.log('');
  console.log('Usage examples:');
  console.log('  optipng -o2 image.png           # Optimize PNG');
  console.log('  jpegoptim --strip-all image.jpg # Optimize JPEG');
}

/**
 * Install image optimization tools in Git Bash using portable Windows binaries.
 *
 * Prerequisites:
 * - Windows 10 or later (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Internet access to download binaries
 * - unzip command available (included with Git Bash)
 *
 * Git Bash runs in a MinGW environment on Windows. This function downloads
 * portable Windows binaries that can be run directly from Git Bash.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('');
  console.log('NOTE: ImageOptim is a macOS-only application.');
  console.log('Installing equivalent command-line tools using portable binaries...');
  console.log('');

  // Check if tools are already available
  const optipngVersion = await getOptipngVersion();
  const jpegoptimVersion = await getJpegoptimVersion();

  if (optipngVersion && jpegoptimVersion) {
    console.log(`optipng ${optipngVersion} is already installed.`);
    console.log(`jpegoptim ${jpegoptimVersion} is already installed.`);
    console.log('Image optimization tools are already installed, skipping installation.');
    return;
  }

  // Create ~/bin directory if it doesn't exist
  console.log('Creating ~/bin directory...');
  const mkdirResult = await shell.exec('mkdir -p ~/bin');
  if (mkdirResult.code !== 0) {
    throw new Error(`Failed to create ~/bin directory: ${mkdirResult.stderr}`);
  }

  // Download optipng Windows binary
  if (!optipngVersion) {
    console.log('Downloading optipng Windows binary...');
    const optipngDownloadUrl = 'https://sourceforge.net/projects/optipng/files/OptiPNG/optipng-0.7.8/optipng-0.7.8-win64.zip/download';

    const optipngCommands = [
      'cd /tmp',
      `curl -L -o optipng.zip "${optipngDownloadUrl}"`,
      'unzip -q optipng.zip -d /tmp/optipng-extract',
      'mv /tmp/optipng-extract/optipng-0.7.8-win64/optipng.exe ~/bin/',
      'rm -rf /tmp/optipng.zip /tmp/optipng-extract'
    ];

    const optipngResult = await shell.exec(optipngCommands.join(' && '));
    if (optipngResult.code !== 0) {
      console.log(`Warning: Failed to download optipng: ${optipngResult.stderr}`);
    }
  }

  // Download jpegoptim Windows binary
  if (!jpegoptimVersion) {
    console.log('Downloading jpegoptim Windows binary...');
    const jpegoptimDownloadUrl = 'https://github.com/XhmikosR/jpegoptim-windows/releases/download/1.5.5-rel1/jpegoptim-1.5.5-rel1-win64-msvc-2022-mozjpeg331-static-ltcg.zip';

    const jpegoptimCommands = [
      'cd /tmp',
      `curl -L -o jpegoptim.zip "${jpegoptimDownloadUrl}"`,
      'unzip -q jpegoptim.zip -d /tmp/jpegoptim-extract',
      'mv /tmp/jpegoptim-extract/jpegoptim.exe ~/bin/',
      'rm -rf /tmp/jpegoptim.zip /tmp/jpegoptim-extract'
    ];

    const jpegoptimResult = await shell.exec(jpegoptimCommands.join(' && '));
    if (jpegoptimResult.code !== 0) {
      console.log(`Warning: Failed to download jpegoptim: ${jpegoptimResult.stderr}`);
    }
  }

  // Make executables executable (likely not needed on Windows but good practice)
  await shell.exec('chmod +x ~/bin/optipng.exe ~/bin/jpegoptim.exe 2>/dev/null || true');

  // Check if ~/bin is in PATH and add it if needed
  const pathCheckResult = await shell.exec('echo $PATH | grep -q "$HOME/bin"');
  if (pathCheckResult.code !== 0) {
    console.log('Adding ~/bin to PATH in ~/.bashrc...');
    await shell.exec('echo \'export PATH="$HOME/bin:$PATH"\' >> ~/.bashrc');
    console.log('');
    console.log('IMPORTANT: Run "source ~/.bashrc" or restart Git Bash to update PATH.');
  }

  // Verify installation (using full path since PATH may not be updated yet)
  const verifyOptipng = await shell.exec('~/bin/optipng.exe --version 2>/dev/null');
  const verifyJpegoptim = await shell.exec('~/bin/jpegoptim.exe --version 2>/dev/null');

  console.log('');
  console.log('Image optimization tools installation complete.');
  console.log('');
  console.log('Installation location: ~/bin/');
  console.log('');
  console.log('Installed tools:');
  if (verifyOptipng.code === 0) {
    console.log('  - optipng.exe: PNG optimization');
  }
  if (verifyJpegoptim.code === 0) {
    console.log('  - jpegoptim.exe: JPEG optimization');
  }
  console.log('');
  console.log('GIT BASH NOTES:');
  console.log('  - Restart Git Bash or run: source ~/.bashrc');
  console.log('  - For Windows paths, use double slashes or MSYS_NO_PATHCONV=1');
  console.log('');
  console.log('Usage examples:');
  console.log('  optipng -o2 image.png           # Optimize PNG');
  console.log('  jpegoptim --strip-all image.jpg # Optimize JPEG');
}

/**
 * Check if ImageOptim (or equivalent image optimization tools) is installed.
 *
 * On macOS, checks if the ImageOptim cask is installed via Homebrew.
 * On Windows, checks if optipng is installed via Chocolatey.
 * On Linux and Git Bash, checks if the optipng command exists.
 *
 * @returns {Promise<boolean>} True if installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    return brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  }

  if (platform.type === 'windows') {
    return choco.isPackageInstalled('optipng');
  }

  // Linux and Git Bash: Check if optipng command exists
  return shell.commandExists('optipng');
}

/**
 * Check if this installer is supported on the current platform.
 * ImageOptim (or equivalent CLI tools) is supported on all major platforms.
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
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: ImageOptim GUI via Homebrew Cask
 * - Ubuntu/Debian: optipng, jpegoptim, gifsicle via APT
 * - Raspberry Pi OS: optipng, jpegoptim, gifsicle via APT
 * - Amazon Linux/RHEL: optipng, jpegoptim via EPEL or source
 * - Windows: optipng, jpegoptim via Chocolatey
 * - WSL (Ubuntu): optipng, jpegoptim, gifsicle via APT within WSL
 * - Git Bash: optipng, jpegoptim portable binaries
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases (e.g., debian maps to ubuntu installer)
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
    'gitbash': install_gitbash
  };

  const installer = installers[platform.type];

  if (!installer) {
    console.log(`ImageOptim is not available for ${platform.type}.`);
    return;
  }

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
  install_gitbash
};

// Allow direct execution: node imageoptim.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
