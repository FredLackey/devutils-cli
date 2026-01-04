#!/usr/bin/env node

/**
 * @fileoverview Install FFmpeg.
 * @module installs/ffmpeg
 *
 * FFmpeg is a complete, cross-platform solution for recording, converting,
 * and streaming audio and video. It includes libavcodec (the leading audio/video
 * codec library), libavformat (for muxing/demuxing into various container formats),
 * and the ffmpeg command-line tool for transcoding multimedia files.
 *
 * This installer provides:
 * - FFmpeg via Homebrew for macOS
 * - FFmpeg via APT for Ubuntu/Debian and Raspberry Pi OS
 * - FFmpeg via static builds for Amazon Linux (not available in standard repos)
 * - FFmpeg via Chocolatey for Windows
 * - FFmpeg via APT for WSL (Ubuntu)
 * - FFmpeg via portable static builds for Git Bash
 *
 * IMPORTANT PLATFORM NOTES:
 * - macOS: Installs via Homebrew formula with full codec support
 * - Ubuntu/Debian: Installs from official APT repositories
 * - Raspberry Pi OS: Installs from official APT repositories (ARM compatible)
 * - Amazon Linux: Uses BtbN static builds (FFmpeg not in standard repos)
 * - Windows: Installs via Chocolatey (essentials build)
 * - WSL: Installs via APT within WSL environment
 * - Git Bash: Downloads portable static builds from gyan.dev
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew formula name for FFmpeg on macOS.
 * This installs FFmpeg with all common codecs (x264, x265, VP8/VP9, AV1, etc.).
 */
const HOMEBREW_FORMULA_NAME = 'ffmpeg';

/**
 * The APT package name for FFmpeg on Debian-based systems.
 */
const APT_PACKAGE_NAME = 'ffmpeg';

/**
 * The Chocolatey package name for FFmpeg on Windows.
 * This installs the "essentials" build with commonly-used codecs.
 */
const CHOCO_PACKAGE_NAME = 'ffmpeg';

/**
 * Check if FFmpeg is installed by verifying the 'ffmpeg' command exists.
 *
 * This is a quick check that works across all platforms.
 * Note that this only checks for the ffmpeg command, not ffprobe or ffplay.
 *
 * @returns {boolean} True if the ffmpeg command is available, false otherwise
 */
function isFFmpegCommandAvailable() {
  return shell.commandExists('ffmpeg');
}

/**
 * Check if FFmpeg is installed and get the version.
 *
 * Executes 'ffmpeg -version' to verify FFmpeg is properly installed
 * and operational. Returns the version string if successful.
 *
 * @returns {Promise<string|null>} FFmpeg version string, or null if not installed
 */
async function getFFmpegVersion() {
  // First check if the command exists to avoid unnecessary process spawning
  if (!isFFmpegCommandAvailable()) {
    return null;
  }

  // Execute ffmpeg -version to get version information
  // The output format is typically: "ffmpeg version X.Y.Z Copyright..."
  const result = await shell.exec('ffmpeg -version');
  if (result.code === 0 && result.stdout) {
    // Parse version from output like: "ffmpeg version 8.0.1 Copyright..."
    // or "ffmpeg version N-XXXXX-gXXXXXXXXXX Copyright..." (for git builds)
    const match = result.stdout.match(/ffmpeg version\s+([^\s]+)/);
    return match ? match[1] : result.stdout.split('\n')[0].trim();
  }
  return null;
}

/**
 * Check if ffprobe is installed (companion tool to ffmpeg).
 *
 * ffprobe is typically installed alongside ffmpeg and is used to
 * inspect media file properties.
 *
 * @returns {boolean} True if ffprobe is available, false otherwise
 */
function isFFprobeAvailable() {
  return shell.commandExists('ffprobe');
}

/**
 * Install FFmpeg on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 12 (Monterey) or later
 * - Homebrew package manager installed
 * - Xcode Command Line Tools installed
 *
 * Homebrew installs FFmpeg with all its dependencies, including codecs
 * for x264, x265, VP8/VP9, AV1, and various audio formats.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if FFmpeg is already installed...');

  // Check if FFmpeg is already installed
  const existingVersion = await getFFmpegVersion();
  if (existingVersion) {
    console.log(`FFmpeg ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Also check if the formula is installed via Homebrew
  // (FFmpeg may be installed but not in PATH for some reason)
  const formulaInstalled = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (formulaInstalled) {
    console.log('FFmpeg is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('NOTE: If FFmpeg commands are not working, check your PATH.');
    console.log('Run: brew info ffmpeg');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing FFmpeg.'
    );
  }

  console.log('Installing FFmpeg via Homebrew...');
  console.log('This may take several minutes as FFmpeg has many dependencies...');

  // Install FFmpeg formula (use --quiet flag for cleaner output)
  const result = await shell.exec('brew install --quiet ffmpeg');

  if (result.code !== 0) {
    throw new Error(
      `Failed to install FFmpeg via Homebrew.\n` +
      `Output: ${result.stderr || result.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Check for Homebrew issues: brew doctor\n` +
      `  3. Try manual installation: brew install ffmpeg`
    );
  }

  // Verify installation succeeded
  const version = await getFFmpegVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but FFmpeg was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: ffmpeg -version'
    );
  }

  console.log(`FFmpeg ${version} installed successfully.`);
  console.log('');
  console.log('Installed tools:');
  console.log('  - ffmpeg: Video/audio transcoding tool');
  console.log('  - ffprobe: Media file analyzer');
  console.log('  - ffplay: Simple media player');
  console.log('');
  console.log('Verify installation with: ffmpeg -version');
}

/**
 * Install FFmpeg on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
 * - sudo privileges
 * - At least 500 MB free disk space
 *
 * The version available in Ubuntu/Debian repositories may not be the latest,
 * but is sufficient for most use cases. Ubuntu 24.04 LTS includes FFmpeg 6.1.1.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu() {
  console.log('Checking if FFmpeg is already installed...');

  // Check if FFmpeg is already installed
  const existingVersion = await getFFmpegVersion();
  if (existingVersion) {
    console.log(`FFmpeg ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Update package index before installing
  console.log('Updating package index...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Could not update package index, continuing anyway...');
  }

  // Install FFmpeg via APT
  console.log('Installing FFmpeg via APT...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install FFmpeg via APT.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'sudo apt-get update' and retry\n` +
      `  2. Check available packages: apt-cache search ffmpeg\n` +
      `  3. Try manual installation: sudo apt-get install ffmpeg`
    );
  }

  // Verify installation succeeded
  const version = await getFFmpegVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but FFmpeg was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: ffmpeg -version'
    );
  }

  console.log(`FFmpeg ${version} installed successfully.`);
  console.log('');
  console.log('Installed tools:');
  console.log('  - ffmpeg: Video/audio transcoding tool');
  console.log('  - ffprobe: Media file analyzer');
  console.log('  - ffplay: Simple media player');
  console.log('');
  console.log('NOTE: The repository version may not be the latest.');
  console.log('For the latest version, consider using a PPA or static builds.');
}

/**
 * Install FFmpeg on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (Bookworm or Bullseye), 32-bit or 64-bit
 * - Raspberry Pi 3 or later (earlier models have limited performance)
 * - sudo privileges
 * - At least 500 MB free disk space
 *
 * FFmpeg in the repositories is compiled for ARM architecture.
 * Raspberry Pi OS Bookworm includes FFmpeg 5.1.6.
 * Hardware acceleration features vary by Raspberry Pi model.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_raspbian() {
  console.log('Checking if FFmpeg is already installed...');

  // Check if FFmpeg is already installed
  const existingVersion = await getFFmpegVersion();
  if (existingVersion) {
    console.log(`FFmpeg ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Update package index before installing
  console.log('Updating package index...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Could not update package index, continuing anyway...');
  }

  // Install FFmpeg via APT
  console.log('Installing FFmpeg via APT...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install FFmpeg via APT.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'sudo apt-get update' and retry\n` +
      `  2. Check available packages: apt-cache search ffmpeg\n` +
      `  3. Try manual installation: sudo apt-get install ffmpeg`
    );
  }

  // Verify installation succeeded
  const version = await getFFmpegVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but FFmpeg was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: ffmpeg -version'
    );
  }

  console.log(`FFmpeg ${version} installed successfully.`);
  console.log('');
  console.log('Installed tools:');
  console.log('  - ffmpeg: Video/audio transcoding tool');
  console.log('  - ffprobe: Media file analyzer');
  console.log('  - ffplay: Simple media player');
  console.log('');
  console.log('RASPBERRY PI NOTES:');
  console.log('  - Check available hardware acceleration: ffmpeg -hwaccels');
  console.log('  - Use V4L2 hardware encoder for H.264: -c:v h264_v4l2m2m');
  console.log('  - Video encoding on Pi may be slow without hardware acceleration');
}

/**
 * Install FFmpeg on Amazon Linux using static builds.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - sudo privileges
 * - At least 500 MB free disk space
 * - curl for downloading
 *
 * IMPORTANT: FFmpeg is not available in the standard Amazon Linux repositories.
 * This function downloads static pre-built binaries from BtbN's FFmpeg Builds
 * (https://github.com/BtbN/FFmpeg-Builds), which is the recommended approach.
 *
 * The static builds include all common codecs and do not require additional
 * dependencies. Builds are updated daily from FFmpeg master branch.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('Checking if FFmpeg is already installed...');

  // Check if FFmpeg is already installed
  const existingVersion = await getFFmpegVersion();
  if (existingVersion) {
    console.log(`FFmpeg ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Detect architecture to download the correct build
  console.log('Detecting system architecture...');
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  console.log(`Architecture: ${arch}`);

  // Determine download URL based on architecture
  // x86_64 = Intel/AMD, aarch64 = ARM64 (Graviton)
  let downloadUrl;
  let extractDir;

  if (arch === 'x86_64') {
    downloadUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz';
    extractDir = 'ffmpeg-master-latest-linux64-gpl';
  } else if (arch === 'aarch64') {
    downloadUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linuxarm64-gpl.tar.xz';
    extractDir = 'ffmpeg-master-latest-linuxarm64-gpl';
  } else {
    throw new Error(
      `Unsupported architecture: ${arch}\n` +
      `FFmpeg static builds are available for x86_64 and aarch64 architectures.`
    );
  }

  // Ensure /opt directory exists
  console.log('Preparing installation directory...');
  const mkdirResult = await shell.exec('sudo mkdir -p /opt');
  if (mkdirResult.code !== 0) {
    throw new Error(`Failed to create /opt directory: ${mkdirResult.stderr}`);
  }

  // Download FFmpeg static build
  console.log('Downloading FFmpeg static build from BtbN...');
  console.log('This may take a few minutes depending on your connection...');
  const downloadResult = await shell.exec(
    `cd /tmp && curl -L -o ffmpeg.tar.xz "${downloadUrl}"`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      `Failed to download FFmpeg.\n` +
      `Output: ${downloadResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check your internet connection\n` +
      `  2. Try downloading manually:\n` +
      `     curl -L -o /tmp/ffmpeg.tar.xz "${downloadUrl}"`
    );
  }

  // Extract the archive to /opt
  console.log('Extracting FFmpeg to /opt...');
  const extractResult = await shell.exec(
    'sudo tar -xf /tmp/ffmpeg.tar.xz -C /opt/'
  );

  if (extractResult.code !== 0) {
    throw new Error(
      `Failed to extract FFmpeg.\n` +
      `Output: ${extractResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you have sudo privileges\n` +
      `  2. Check if /opt has enough space\n` +
      `  3. Try manual extraction: sudo tar -xf /tmp/ffmpeg.tar.xz -C /opt/`
    );
  }

  // Create symlinks in /usr/local/bin for easy access
  console.log('Creating symlinks in /usr/local/bin...');
  const symlinkCommands = [
    `sudo ln -sf /opt/${extractDir}/bin/ffmpeg /usr/local/bin/ffmpeg`,
    `sudo ln -sf /opt/${extractDir}/bin/ffprobe /usr/local/bin/ffprobe`
  ];

  for (const cmd of symlinkCommands) {
    const result = await shell.exec(cmd);
    if (result.code !== 0) {
      console.log(`Warning: Could not create symlink: ${result.stderr}`);
    }
  }

  // Clean up downloaded archive
  console.log('Cleaning up temporary files...');
  await shell.exec('rm -f /tmp/ffmpeg.tar.xz');

  // Verify installation succeeded
  const version = await getFFmpegVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but FFmpeg was not found.\n\n' +
      'Please try:\n' +
      '  1. Verify /usr/local/bin is in your PATH:\n' +
      `     echo $PATH | grep -q '/usr/local/bin' && echo "OK" || echo "Missing"\n` +
      '  2. Add to PATH if missing:\n' +
      '     echo \'export PATH="/usr/local/bin:$PATH"\' >> ~/.bashrc && source ~/.bashrc\n' +
      '  3. Run: ffmpeg -version'
    );
  }

  console.log(`FFmpeg ${version} installed successfully.`);
  console.log('');
  console.log(`Installation location: /opt/${extractDir}/`);
  console.log('Symlinks created in: /usr/local/bin/');
  console.log('');
  console.log('Installed tools:');
  console.log('  - ffmpeg: Video/audio transcoding tool');
  console.log('  - ffprobe: Media file analyzer');
  console.log('');
  console.log('NOTE: These static builds are updated daily from FFmpeg master branch.');
  console.log('To upgrade, simply re-run this installer.');
}

/**
 * Install FFmpeg on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 or later (64-bit)
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * Chocolatey installs the "essentials" build which includes commonly-used
 * codecs (x264, x265, VP8/VP9, Opus, AAC). The essentials build is compatible
 * with Windows 7 and later.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if FFmpeg is already installed...');

  // Check if FFmpeg is already installed
  const existingVersion = await getFFmpegVersion();
  if (existingVersion) {
    console.log(`FFmpeg ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if FFmpeg is installed via Chocolatey
  const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (packageInstalled) {
    console.log('FFmpeg is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('NOTE: If FFmpeg commands are not working, open a new terminal window');
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
      'Then retry installing FFmpeg.'
    );
  }

  console.log('Installing FFmpeg via Chocolatey...');
  console.log('This may take a few minutes...');

  // Install FFmpeg using Chocolatey
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install FFmpeg via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Try manual installation: choco install ffmpeg -y\n` +
      `  3. Check Chocolatey logs for details`
    );
  }

  console.log('FFmpeg installed successfully.');
  console.log('');
  console.log('IMPORTANT: Open a new terminal window to refresh your PATH.');
  console.log('Alternatively, run: refreshenv');
  console.log('');
  console.log('Installed tools:');
  console.log('  - ffmpeg: Video/audio transcoding tool');
  console.log('  - ffprobe: Media file analyzer');
  console.log('  - ffplay: Simple media player');
  console.log('');
  console.log('Verify installation with: ffmpeg -version');
  console.log('');
  console.log('NOTE: For the "full" build with additional codecs:');
  console.log('  choco uninstall ffmpeg -y && choco install ffmpeg-full -y');
}

/**
 * Install FFmpeg on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 *
 * FFmpeg installed in Windows is not accessible from WSL, so this function
 * installs FFmpeg separately within the WSL Ubuntu environment using APT.
 * The installation process is identical to native Ubuntu.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Installing FFmpeg within WSL environment...');
  console.log('');

  // Check if FFmpeg is already installed
  const existingVersion = await getFFmpegVersion();
  if (existingVersion) {
    console.log(`FFmpeg ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Update package index before installing
  console.log('Updating package index...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Could not update package index, continuing anyway...');
  }

  // Install FFmpeg via APT
  console.log('Installing FFmpeg via APT...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install FFmpeg via APT.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. If you see DNS errors, try:\n` +
      `     echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf\n` +
      `  2. Run 'sudo apt-get update' and retry\n` +
      `  3. Try manual installation: sudo apt-get install ffmpeg`
    );
  }

  // Verify installation succeeded
  const version = await getFFmpegVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but FFmpeg was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your WSL session\n' +
      '  2. Run: ffmpeg -version'
    );
  }

  console.log(`FFmpeg ${version} installed successfully.`);
  console.log('');
  console.log('Installed tools:');
  console.log('  - ffmpeg: Video/audio transcoding tool');
  console.log('  - ffprobe: Media file analyzer');
  console.log('  - ffplay: Simple media player (requires X server for display)');
  console.log('');
  console.log('WSL NOTES:');
  console.log('  - Access Windows files through /mnt/c/, /mnt/d/, etc.');
  console.log('  - Example: ffmpeg -i /mnt/c/Users/You/Videos/input.mp4 output.webm');
  console.log('  - ffplay requires WSLg (Windows 11) or an X server (Windows 10)');
}

/**
 * Install FFmpeg in Git Bash on Windows using portable static builds.
 *
 * Prerequisites:
 * - Windows 10 or later (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Internet access to download static builds
 * - unzip command available (included with Git Bash)
 *
 * Git Bash runs in a MinGW environment on Windows. This function downloads
 * portable FFmpeg static builds from gyan.dev that require no installation.
 * The binaries are placed in ~/bin which is added to PATH.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('');
  console.log('Installing FFmpeg using portable static builds...');
  console.log('');

  // Check if FFmpeg is already available
  const existingVersion = await getFFmpegVersion();
  if (existingVersion) {
    console.log(`FFmpeg ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Create ~/bin directory if it doesn't exist
  console.log('Creating ~/bin directory...');
  const mkdirResult = await shell.exec('mkdir -p ~/bin');
  if (mkdirResult.code !== 0) {
    throw new Error(`Failed to create ~/bin directory: ${mkdirResult.stderr}`);
  }

  // Download the static build from gyan.dev
  console.log('Downloading FFmpeg static build from gyan.dev...');
  console.log('This may take a few minutes depending on your connection...');
  const downloadUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';
  const downloadResult = await shell.exec(
    `cd /tmp && curl -L -o ffmpeg.zip "${downloadUrl}"`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      `Failed to download FFmpeg.\n` +
      `Output: ${downloadResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check your internet connection\n` +
      `  2. If you see certificate errors, try:\n` +
      `     curl -L -k -o /tmp/ffmpeg.zip "${downloadUrl}"\n` +
      `  3. Try downloading manually in a browser`
    );
  }

  // Extract the binaries
  console.log('Extracting FFmpeg binaries...');
  const extractResult = await shell.exec(
    'cd /tmp && unzip -q ffmpeg.zip -d /tmp/ffmpeg-extract'
  );

  if (extractResult.code !== 0) {
    throw new Error(
      `Failed to extract FFmpeg.\n` +
      `Output: ${extractResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure unzip is available: which unzip\n` +
      `  2. Try manual extraction:\n` +
      `     unzip /tmp/ffmpeg.zip -d /tmp/ffmpeg-extract`
    );
  }

  // Move the executables to ~/bin
  console.log('Installing FFmpeg binaries to ~/bin...');
  const moveResult = await shell.exec(
    'mv /tmp/ffmpeg-extract/ffmpeg-*/bin/*.exe ~/bin/'
  );

  if (moveResult.code !== 0) {
    throw new Error(
      `Failed to move FFmpeg binaries.\n` +
      `Output: ${moveResult.stderr}`
    );
  }

  // Make sure executables are executable (shouldn't be needed on Windows but just in case)
  await shell.exec('chmod +x ~/bin/ffmpeg.exe ~/bin/ffprobe.exe ~/bin/ffplay.exe 2>/dev/null || true');

  // Clean up temporary files
  console.log('Cleaning up temporary files...');
  await shell.exec('rm -rf /tmp/ffmpeg.zip /tmp/ffmpeg-extract');

  // Check if ~/bin is in PATH and add it if needed
  const pathCheckResult = await shell.exec('echo $PATH | grep -q "$HOME/bin"');
  if (pathCheckResult.code !== 0) {
    console.log('Adding ~/bin to PATH in ~/.bashrc...');
    await shell.exec('echo \'export PATH="$HOME/bin:$PATH"\' >> ~/.bashrc');
    console.log('');
    console.log('IMPORTANT: Run "source ~/.bashrc" or restart Git Bash to update PATH.');
  }

  // Source bashrc and verify installation
  // Note: We need to check with the full path since PATH may not be updated yet
  const verifyResult = await shell.exec('~/bin/ffmpeg.exe -version');
  if (verifyResult.code !== 0) {
    throw new Error(
      'Installation appeared to complete but FFmpeg verification failed.\n\n' +
      'Please try:\n' +
      '  1. Restart Git Bash\n' +
      '  2. Run: ~/bin/ffmpeg.exe -version'
    );
  }

  // Parse version from verification output
  const versionMatch = verifyResult.stdout.match(/ffmpeg version\s+([^\s]+)/);
  const version = versionMatch ? versionMatch[1] : 'unknown';

  console.log(`FFmpeg ${version} installed successfully.`);
  console.log('');
  console.log('Installation location: ~/bin/');
  console.log('');
  console.log('Installed tools:');
  console.log('  - ffmpeg.exe: Video/audio transcoding tool');
  console.log('  - ffprobe.exe: Media file analyzer');
  console.log('  - ffplay.exe: Simple media player');
  console.log('');
  console.log('GIT BASH NOTES:');
  console.log('  - For Windows paths, use double slashes: //c/Users/...');
  console.log('  - Or use MSYS_NO_PATHCONV=1 before commands');
  console.log('  - Restart Git Bash or run: source ~/.bashrc');
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: FFmpeg via Homebrew
 * - Ubuntu/Debian: FFmpeg via APT
 * - Raspberry Pi OS: FFmpeg via APT
 * - Amazon Linux/RHEL: FFmpeg via static builds
 * - Windows: FFmpeg via Chocolatey
 * - WSL (Ubuntu): FFmpeg via APT within WSL
 * - Git Bash: FFmpeg portable builds
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
    console.log(`FFmpeg is not available for ${platform.type}.`);
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

// Allow direct execution: node ffmpeg.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
