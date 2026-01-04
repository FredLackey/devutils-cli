#!/usr/bin/env node

/**
 * @fileoverview Install VLC Media Player.
 * @module installs/vlc
 *
 * VLC is a free and open-source cross-platform multimedia player and framework
 * developed by the VideoLAN project. It plays most multimedia files, DVDs,
 * Audio CDs, VCDs, and various streaming protocols without requiring additional
 * codec packs.
 *
 * This installer provides:
 * - VLC via Homebrew cask for macOS
 * - VLC via APT for Ubuntu/Debian and Raspberry Pi OS
 * - VLC via DNF/YUM with RPM Fusion for Amazon Linux/RHEL
 * - VLC via Chocolatey for Windows
 * - VLC via APT for WSL (Ubuntu)
 * - VLC via Windows installation (Chocolatey) for Git Bash
 *
 * IMPORTANT PLATFORM NOTES:
 * - macOS: Installs VLC.app via Homebrew cask to /Applications
 * - Ubuntu/Debian: Installs from official APT repositories
 * - Raspberry Pi OS: Installs from official APT repositories (ARM compatible)
 * - Amazon Linux/RHEL: Requires EPEL and RPM Fusion repositories
 * - Windows: Installs via Chocolatey package manager
 * - WSL: Installs via APT within WSL environment (requires WSLg for GUI)
 * - Git Bash: Installs on Windows host via Chocolatey through PowerShell
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew cask name for VLC on macOS.
 * This installs the full VLC.app to /Applications.
 */
const HOMEBREW_CASK_NAME = 'vlc';

/**
 * The APT package name for VLC on Debian-based systems.
 */
const APT_PACKAGE_NAME = 'vlc';

/**
 * The Chocolatey package name for VLC on Windows.
 */
const CHOCO_PACKAGE_NAME = 'vlc';

/**
 * The macOS application name for VLC.
 * Used to check if VLC is already installed in /Applications.
 */
const MACOS_APP_NAME = 'VLC';

/**
 * Check if VLC is installed by verifying the 'vlc' command exists.
 *
 * This check works on Linux and Windows where VLC adds itself to PATH.
 * For macOS, use the macosApps utility to check for VLC.app instead.
 *
 * @returns {boolean} True if the vlc command is available, false otherwise
 */
function isVLCCommandAvailable() {
  return shell.commandExists('vlc');
}

/**
 * Check if VLC is installed and get the version.
 *
 * Executes 'vlc --version' to verify VLC is properly installed
 * and operational. Returns the version string if successful.
 *
 * @returns {Promise<string|null>} VLC version string, or null if not installed
 */
async function getVLCVersion() {
  // First check if the command exists to avoid unnecessary process spawning
  if (!isVLCCommandAvailable()) {
    return null;
  }

  // Execute vlc --version to get version information
  // The output format is typically: "VLC media player X.Y.Z Vetinari..."
  const result = await shell.exec('vlc --version');
  if (result.code === 0 && result.stdout) {
    // Parse version from output like: "VLC media player 3.0.21 Vetinari..."
    const match = result.stdout.match(/VLC media player\s+([^\s]+)/);
    return match ? match[1] : result.stdout.split('\n')[0].trim();
  }
  return null;
}

/**
 * Install VLC on macOS using Homebrew cask.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - At least 200 MB free disk space
 *
 * Homebrew installs VLC.app to /Applications. On first launch, macOS may
 * display a Gatekeeper warning that requires right-clicking the app and
 * selecting "Open" to bypass.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if VLC is already installed...');

  // Check if VLC.app exists in /Applications
  const isAppInstalled = macosApps.isAppInstalled(MACOS_APP_NAME);
  if (isAppInstalled) {
    const version = macosApps.getAppVersion(MACOS_APP_NAME);
    if (version) {
      console.log(`VLC ${version} is already installed, skipping installation.`);
    } else {
      console.log('VLC is already installed, skipping installation.');
    }
    return;
  }

  // Also check if the cask is installed via Homebrew
  // (VLC may be installed but not detected in Applications for some reason)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('VLC is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('NOTE: If VLC is not appearing in Applications, try:');
    console.log('  brew reinstall --cask vlc');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing VLC.'
    );
  }

  console.log('Installing VLC via Homebrew...');

  // Install VLC cask with --quiet flag for cleaner output
  const result = await shell.exec('brew install --quiet --cask vlc');

  if (result.code !== 0) {
    throw new Error(
      `Failed to install VLC via Homebrew.\n` +
      `Output: ${result.stderr || result.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Check for Homebrew issues: brew doctor\n` +
      `  3. Try manual installation: brew install --cask vlc`
    );
  }

  // Verify installation succeeded by checking for VLC.app
  const verified = macosApps.isAppInstalled(MACOS_APP_NAME);
  if (!verified) {
    throw new Error(
      'Installation appeared to complete but VLC.app was not found.\n\n' +
      'Please try:\n' +
      '  1. Check /Applications/VLC.app exists\n' +
      '  2. Run: brew reinstall --cask vlc'
    );
  }

  const installedVersion = macosApps.getAppVersion(MACOS_APP_NAME);
  console.log(`VLC ${installedVersion || ''} installed successfully.`);
  console.log('');
  console.log('You can launch VLC from:');
  console.log('  - Applications folder');
  console.log('  - Spotlight (Cmd+Space, type "VLC")');
  console.log('  - Terminal: open -a VLC');
  console.log('');
  console.log('NOTE: On first launch, you may see a Gatekeeper warning.');
  console.log('Right-click VLC in Applications and select "Open" to bypass.');
}

/**
 * Install VLC on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
 * - sudo privileges
 * - At least 500 MB free disk space (including dependencies)
 *
 * The version available in Ubuntu/Debian repositories may not be the absolute
 * latest. For most use cases, the repository version is sufficient and receives
 * security updates.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu() {
  console.log('Checking if VLC is already installed...');

  // Check if VLC is already installed via dpkg
  const isInstalled = await apt.isPackageInstalled(APT_PACKAGE_NAME);
  if (isInstalled) {
    const version = await apt.getPackageVersion(APT_PACKAGE_NAME);
    if (version) {
      console.log(`VLC ${version} is already installed, skipping installation.`);
    } else {
      console.log('VLC is already installed, skipping installation.');
    }
    return;
  }

  // Update package index before installing
  console.log('Updating package index...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Could not update package index, continuing anyway...');
  }

  // Install VLC via APT
  console.log('Installing VLC via APT...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install VLC via APT.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'sudo apt-get update' and retry\n` +
      `  2. Check available packages: apt-cache search vlc\n` +
      `  3. Try manual installation: sudo apt-get install vlc`
    );
  }

  // Verify installation succeeded
  const version = await getVLCVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but VLC was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: vlc --version'
    );
  }

  console.log(`VLC ${version} installed successfully.`);
  console.log('');
  console.log('You can launch VLC from:');
  console.log('  - Applications menu');
  console.log('  - Terminal: vlc');
  console.log('  - Headless/CLI mode: cvlc');
  console.log('');
  console.log('NOTE: The repository version may not be the latest.');
  console.log('For newer versions, consider the VideoLAN PPA.');
}

/**
 * Install VLC on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (Bookworm or Bullseye), 32-bit or 64-bit
 * - Raspberry Pi 3 or later recommended (earlier models have limited performance)
 * - sudo privileges
 * - At least 500 MB free disk space
 *
 * NOTE: Raspberry Pi OS (full desktop version) typically comes with VLC
 * pre-installed. This installer handles cases where VLC was removed or
 * on Raspberry Pi OS Lite.
 *
 * The Raspberry Pi OS repositories contain VLC builds optimized for ARM
 * processors with hardware acceleration patches for the Raspberry Pi's GPU.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_raspbian() {
  console.log('Checking if VLC is already installed...');

  // Check if VLC is already installed via dpkg
  const isInstalled = await apt.isPackageInstalled(APT_PACKAGE_NAME);
  if (isInstalled) {
    const version = await apt.getPackageVersion(APT_PACKAGE_NAME);
    if (version) {
      console.log(`VLC ${version} is already installed, skipping installation.`);
    } else {
      console.log('VLC is already installed, skipping installation.');
    }
    return;
  }

  // Update package index before installing
  console.log('Updating package index...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Could not update package index, continuing anyway...');
  }

  // Install VLC via APT
  console.log('Installing VLC via APT...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install VLC via APT.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'sudo apt-get update' and retry\n` +
      `  2. Check available packages: apt-cache search vlc\n` +
      `  3. Try manual installation: sudo apt-get install vlc`
    );
  }

  // Verify installation succeeded
  const version = await getVLCVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but VLC was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: vlc --version'
    );
  }

  console.log(`VLC ${version} installed successfully.`);
  console.log('');
  console.log('You can launch VLC from:');
  console.log('  - Desktop menu (under Sound & Video)');
  console.log('  - Terminal: vlc');
  console.log('  - Headless/CLI mode: cvlc');
  console.log('');
  console.log('RASPBERRY PI NOTES:');
  console.log('  - Hardware acceleration is available for better performance');
  console.log('  - Use MMAL codec for H.264: cvlc --codec=mmal_codec video.mp4');
  console.log('  - For headless streaming, install vlc-nox: sudo apt install vlc-nox');
}

/**
 * Install VLC on Amazon Linux/RHEL using DNF/YUM with RPM Fusion.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), or RHEL 8/9
 * - sudo privileges
 * - At least 500 MB free disk space
 *
 * IMPORTANT: VLC is not available in the standard Amazon Linux or RHEL
 * repositories. This function enables the EPEL (Extra Packages for Enterprise
 * Linux) and RPM Fusion repositories to install VLC.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('Checking if VLC is already installed...');

  // Check if VLC is already installed
  const existingVersion = await getVLCVersion();
  if (existingVersion) {
    console.log(`VLC ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Detect package manager (dnf for AL2023/RHEL9, yum for AL2/RHEL8)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    throw new Error(
      'Neither dnf nor yum package manager found.\n' +
      'This installer supports Amazon Linux 2023 (dnf), Amazon Linux 2 (yum), and RHEL 8/9.'
    );
  }

  console.log(`Detected package manager: ${packageManager}`);

  // Determine the RHEL version for repository URLs
  // AL2023 is based on Fedora and compatible with RHEL 9 repos
  // AL2 and RHEL 8 use version 8 repos
  console.log('Detecting system version...');
  const versionResult = await shell.exec('rpm -E %rhel');
  let rhelVersion = versionResult.stdout.trim();

  // If rpm -E %rhel returns empty or just "%rhel", try to detect from os-release
  if (!rhelVersion || rhelVersion === '%rhel') {
    if (hasDnf) {
      // Amazon Linux 2023 is compatible with RHEL 9
      rhelVersion = '9';
    } else {
      // Amazon Linux 2 is compatible with RHEL 8
      rhelVersion = '8';
    }
  }

  console.log(`Using RHEL ${rhelVersion} compatible repositories...`);

  // Install EPEL repository (required dependency for RPM Fusion)
  console.log('Installing EPEL repository...');
  const epelUrl = `https://dl.fedoraproject.org/pub/epel/epel-release-latest-${rhelVersion}.noarch.rpm`;
  const epelResult = await shell.exec(`sudo ${packageManager} install -y ${epelUrl}`);
  if (epelResult.code !== 0) {
    // EPEL might already be installed, continue anyway
    console.log('Note: EPEL may already be installed, continuing...');
  }

  // Install RPM Fusion Free repository (contains VLC)
  console.log('Installing RPM Fusion Free repository...');
  const rpmfusionUrl = `https://download1.rpmfusion.org/free/el/rpmfusion-free-release-${rhelVersion}.noarch.rpm`;
  const rpmfusionResult = await shell.exec(`sudo ${packageManager} install -y ${rpmfusionUrl}`);
  if (rpmfusionResult.code !== 0) {
    throw new Error(
      `Failed to install RPM Fusion repository.\n` +
      `Output: ${rpmfusionResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check your internet connection\n` +
      `  2. Verify the repository URL is accessible\n` +
      `  3. Try manually: sudo ${packageManager} install -y ${rpmfusionUrl}`
    );
  }

  // Install VLC
  console.log('Installing VLC...');
  const installResult = await shell.exec(`sudo ${packageManager} install -y vlc`);

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install VLC.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Verify RPM Fusion is enabled: ${packageManager} repolist\n` +
      `  2. Clean package cache: sudo ${packageManager} clean all\n` +
      `  3. Try manual installation: sudo ${packageManager} install vlc`
    );
  }

  // Verify installation succeeded
  const version = await getVLCVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but VLC was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: vlc --version'
    );
  }

  console.log(`VLC ${version} installed successfully.`);
  console.log('');
  console.log('You can launch VLC from:');
  console.log('  - Terminal: vlc');
  console.log('  - Headless/CLI mode: cvlc');
  console.log('');
  console.log('NOTE: VLC was installed from RPM Fusion repository.');
  console.log('For headless server use (streaming/transcoding): cvlc --no-video');
}

/**
 * Install VLC on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 or later (32-bit or 64-bit), or Windows 11
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 * - At least 200 MB free disk space
 *
 * Chocolatey downloads VLC from the official VideoLAN servers and handles
 * the installation silently. VLC will be added to the system PATH.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if VLC is already installed...');

  // Check if VLC is already installed
  const existingVersion = await getVLCVersion();
  if (existingVersion) {
    console.log(`VLC ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if VLC package is installed via Chocolatey
  const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (packageInstalled) {
    console.log('VLC is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('NOTE: If VLC commands are not working, open a new terminal window');
    console.log('to refresh your PATH, or run: refreshenv');
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
      'Then retry installing VLC.'
    );
  }

  console.log('Installing VLC via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install VLC using Chocolatey
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install VLC via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Try manual installation: choco install vlc -y\n` +
      `  3. Check Chocolatey logs for details`
    );
  }

  console.log('VLC installed successfully.');
  console.log('');
  console.log('IMPORTANT: Open a new terminal window to refresh your PATH.');
  console.log('Alternatively, run: refreshenv');
  console.log('');
  console.log('You can launch VLC from:');
  console.log('  - Start Menu');
  console.log('  - Command line: vlc');
  console.log('  - File path: "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe"');
  console.log('');
  console.log('Verify installation with: vlc --version');
}

/**
 * Install VLC on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 Build 19044 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - WSLg enabled for GUI application support (Windows 11 or Windows 10 with updates)
 * - sudo privileges within WSL
 *
 * IMPORTANT: VLC is a graphical application. Running VLC in WSL requires
 * GUI support through WSLg (Windows Subsystem for Linux GUI). Windows 11
 * includes WSLg by default. For headless operation, use cvlc or vlc-nox.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Installing VLC within WSL environment...');
  console.log('');

  // Check if VLC is already installed
  const isInstalled = await apt.isPackageInstalled(APT_PACKAGE_NAME);
  if (isInstalled) {
    const version = await apt.getPackageVersion(APT_PACKAGE_NAME);
    if (version) {
      console.log(`VLC ${version} is already installed, skipping installation.`);
    } else {
      console.log('VLC is already installed, skipping installation.');
    }
    return;
  }

  // Update package index before installing
  console.log('Updating package index...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Could not update package index, continuing anyway...');
  }

  // Install VLC via APT
  console.log('Installing VLC via APT...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install VLC via APT.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. If you see DNS errors, try:\n` +
      `     echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf\n` +
      `  2. Run 'sudo apt-get update' and retry\n` +
      `  3. Try manual installation: sudo apt-get install vlc`
    );
  }

  // Verify installation succeeded
  const version = await getVLCVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but VLC was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your WSL session\n' +
      '  2. Run: vlc --version'
    );
  }

  console.log(`VLC ${version} installed successfully.`);
  console.log('');
  console.log('WSL NOTES:');
  console.log('');
  console.log('1. GUI support requires WSLg:');
  console.log('   - Windows 11: WSLg is included by default');
  console.log('   - Windows 10: Requires specific builds and updates');
  console.log('   - Test with: vlc &');
  console.log('');
  console.log('2. If you see "cannot open display" errors:');
  console.log('   - Restart WSL: wsl --shutdown (from PowerShell)');
  console.log('   - Then reopen your WSL terminal');
  console.log('');
  console.log('3. For headless operation (streaming/transcoding):');
  console.log('   - Use cvlc: cvlc --no-video /path/to/media.mp4');
  console.log('');
  console.log('4. To access Windows files:');
  console.log('   - cvlc /mnt/c/Users/YourName/Videos/movie.mp4');
}

/**
 * Install VLC from Git Bash on Windows.
 *
 * Git Bash runs in a MinGW environment on Windows. This function installs
 * VLC on the Windows host using Chocolatey via PowerShell interop.
 * Once installed, VLC will be accessible from Git Bash through the Windows PATH.
 *
 * Prerequisites:
 * - Windows 10 or later (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey package manager installed on Windows
 * - Administrator privileges
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing VLC on the Windows host...');
  console.log('');

  // Check if VLC is already available
  const existingVersion = await getVLCVersion();
  if (existingVersion) {
    console.log(`VLC ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if VLC executable exists in common Windows location
  const vlcExistsResult = await shell.exec('ls "/c/Program Files/VideoLAN/VLC/vlc.exe" 2>/dev/null');
  if (vlcExistsResult.code === 0) {
    console.log('VLC is already installed on Windows, skipping installation.');
    console.log('');
    console.log('If VLC is not in your PATH, add it with:');
    console.log('  echo \'export PATH="$PATH:/c/Program Files/VideoLAN/VLC"\' >> ~/.bashrc');
    console.log('  source ~/.bashrc');
    return;
  }

  // Install via PowerShell using Chocolatey
  console.log('Installing VLC via Chocolatey...');
  console.log('This may take a few minutes...');

  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install vlc -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install VLC.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell:\n` +
      `     choco install vlc -y`
    );
  }

  console.log('VLC installed successfully.');
  console.log('');
  console.log('Git Bash notes:');
  console.log('');
  console.log('1. Restart Git Bash or run: source ~/.bashrc');
  console.log('');
  console.log('2. If vlc is not found, add to PATH:');
  console.log('   echo \'export PATH="$PATH:/c/Program Files/VideoLAN/VLC"\' >> ~/.bashrc');
  console.log('   source ~/.bashrc');
  console.log('');
  console.log('3. To launch VLC:');
  console.log('   vlc &');
  console.log('   # or with full path:');
  console.log('   "/c/Program Files/VideoLAN/VLC/vlc.exe" &');
  console.log('');
  console.log('4. When passing file paths, use Windows-style or double slashes:');
  console.log('   vlc "C:/Users/YourName/Videos/movie.mp4"');
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: VLC via Homebrew cask
 * - Ubuntu/Debian: VLC via APT
 * - Raspberry Pi OS: VLC via APT
 * - Amazon Linux/RHEL: VLC via DNF/YUM with RPM Fusion
 * - Windows: VLC via Chocolatey
 * - WSL (Ubuntu): VLC via APT within WSL
 * - Git Bash: VLC on Windows host via Chocolatey
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
    console.log(`VLC is not available for ${platform.type}.`);
    return;
  }

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
  install_gitbash
};

// Allow direct execution: node vlc.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
