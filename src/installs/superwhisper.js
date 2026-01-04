#!/usr/bin/env node

/**
 * @fileoverview Install Superwhisper.
 * @module installs/superwhisper
 *
 * Superwhisper is an AI-powered voice-to-text application that enables fast and
 * accurate speech transcription using advanced Whisper-based AI models. It allows
 * you to dictate text up to 5x faster than typing, with intelligent punctuation,
 * formatting, and optional AI post-processing to refine your spoken words.
 *
 * Key features include:
 * - Offline transcription with local AI models for privacy
 * - 100+ language support for transcription and translation
 * - AI formatting modes to transform speech into professional text
 * - System-wide dictation that works in any application
 *
 * This installer provides:
 * - Superwhisper for macOS via Homebrew cask
 * - Direct download installer for Windows (not in Chocolatey/winget)
 * - Windows installation from Git Bash via PowerShell
 *
 * PLATFORM LIMITATIONS:
 * - Superwhisper is not available for Linux distributions (Ubuntu, Debian,
 *   Raspberry Pi OS, Amazon Linux, RHEL)
 * - WSL cannot run Superwhisper directly due to audio/GUI requirements;
 *   install on Windows host instead
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');

/**
 * The Homebrew cask name for Superwhisper on macOS.
 * This installs the full desktop application to /Applications.
 */
const HOMEBREW_CASK_NAME = 'superwhisper';

/**
 * The expected application name after installation on macOS.
 * Superwhisper installs as "superwhisper.app" in /Applications.
 */
const MACOS_APP_NAME = 'superwhisper';

/**
 * Windows installation directory path (relative to LOCALAPPDATA).
 * Superwhisper installs to %LOCALAPPDATA%\Programs\superwhisper on Windows.
 */
const WINDOWS_INSTALL_PATH = 'Programs\\superwhisper';

/**
 * Download URLs for Windows installer.
 * These are the official download endpoints from superwhisper.com.
 */
const WINDOWS_DOWNLOAD_URLS = {
  x64: 'https://fresh.superwhisper.com/download/installer/windows/x64',
  arm64: 'https://fresh.superwhisper.com/download/installer/windows/aarch64'
};

/**
 * Check if Superwhisper Desktop application is installed on macOS.
 *
 * Looks for superwhisper.app in /Applications or ~/Applications using the
 * macosApps utility which handles common variations of app names.
 *
 * @returns {boolean} True if superwhisper.app exists, false otherwise
 */
function isSuperwhisperInstalledMacOS() {
  return macosApps.isAppInstalled(MACOS_APP_NAME);
}

/**
 * Install Superwhisper Desktop on macOS using Homebrew cask.
 *
 * Prerequisites:
 * - macOS 13 (Ventura) or later
 * - Homebrew package manager installed
 * - Apple Silicon (M1/M2/M3/M4) recommended for best offline model performance
 * - Intel Macs supported but work best with cloud models
 * - At least 8 GB RAM (16 GB recommended for larger AI models)
 *
 * The installation uses the Homebrew cask 'superwhisper' which downloads and installs
 * the Superwhisper desktop application to /Applications/superwhisper.app.
 *
 * NOTE: After installation, Superwhisper must be launched manually. On first launch,
 * it will request microphone and accessibility permissions for system-wide dictation.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Superwhisper is already installed...');

  // Check if superwhisper.app already exists in Applications
  if (isSuperwhisperInstalledMacOS()) {
    console.log('Superwhisper is already installed, skipping installation.');
    return;
  }

  // Also check if the cask is installed via Homebrew
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Superwhisper is already installed via Homebrew, skipping installation.');
    return;
  }

  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Superwhisper.'
    );
  }

  console.log('Installing Superwhisper via Homebrew...');

  // Install Superwhisper cask with quiet flag for cleaner output
  // The --quiet flag suppresses non-essential output for automation-friendly installation
  const result = await shell.exec('brew install --quiet --cask superwhisper');

  if (result.code !== 0) {
    throw new Error(
      `Failed to install Superwhisper via Homebrew.\n` +
      `Output: ${result.stderr || result.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. Check if macOS version is 13 (Ventura) or later\n` +
      `  3. Try manual installation: brew reinstall --cask superwhisper`
    );
  }

  // Verify installation succeeded by checking if app now exists
  if (!isSuperwhisperInstalledMacOS()) {
    throw new Error(
      'Installation command completed but superwhisper.app was not found in Applications.\n\n' +
      'Please try:\n' +
      '  1. Check /Applications for superwhisper.app\n' +
      '  2. Run: brew reinstall --cask superwhisper'
    );
  }

  console.log('Superwhisper installed successfully.');
  console.log('');
  console.log('To launch Superwhisper:');
  console.log('  - Open from Applications folder, or');
  console.log('  - Run: open -a superwhisper');
  console.log('');
  console.log('On first launch, Superwhisper will request:');
  console.log('  1. Microphone permissions (required for voice input)');
  console.log('  2. Accessibility permissions (required for system-wide dictation)');
  console.log('');
  console.log('Grant all requested permissions for full functionality.');
  console.log('');
  console.log('Superwhisper runs as a menu bar application. Look for its icon');
  console.log('in the macOS menu bar after launching.');
}

/**
 * Handle Superwhisper installation request on Ubuntu/Debian.
 *
 * PLATFORM LIMITATION: Superwhisper is not available for Ubuntu, Debian, or any
 * Linux distribution. It is developed exclusively for macOS, iOS, and Windows.
 *
 * This function returns gracefully with a message rather than throwing an error,
 * following the project's convention for unsupported platforms.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Superwhisper is not available for Ubuntu.');
  return;
}

/**
 * Handle Superwhisper installation request on Raspberry Pi OS.
 *
 * PLATFORM LIMITATION: Superwhisper is not available for Raspberry Pi OS or any
 * ARM-based Linux distribution. It is developed exclusively for macOS, iOS, and
 * Windows.
 *
 * This function returns gracefully with a message rather than throwing an error,
 * following the project's convention for unsupported platforms.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Superwhisper is not available for Raspberry Pi OS.');
  return;
}

/**
 * Handle Superwhisper installation request on Amazon Linux/RHEL.
 *
 * PLATFORM LIMITATION: Superwhisper is not available for Amazon Linux, RHEL, or
 * any Linux distribution. It is developed exclusively for macOS, iOS, and Windows.
 *
 * This function returns gracefully with a message rather than throwing an error,
 * following the project's convention for unsupported platforms.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Superwhisper is not available for Amazon Linux.');
  return;
}

/**
 * Install Superwhisper on Windows via direct download.
 *
 * IMPORTANT: Superwhisper is NOT available in Chocolatey or winget package
 * repositories. Installation must be performed via direct download from the
 * official website.
 *
 * Prerequisites:
 * - Windows 10 or later (Windows 11 supported)
 * - Both x64 (Intel/AMD) and ARM64 architectures supported
 * - At least 8 GB RAM (16 GB recommended for larger AI models)
 * - Administrator privileges for installation
 * - Active internet connection for download
 *
 * The installation process:
 * 1. Detects the system architecture (x64 or ARM64)
 * 2. Downloads the appropriate installer from superwhisper.com
 * 3. Runs the installer (may require user interaction)
 * 4. Cleans up the downloaded installer file
 *
 * NOTE: The Windows version was released in December 2025. Some features may
 * differ from the macOS version.
 *
 * @returns {Promise<void>}
 * @throws {Error} If download or installation fails
 */
async function install_windows() {
  console.log('Checking if Superwhisper is already installed...');

  // Check if Superwhisper is already installed by looking for its directory
  const checkResult = await shell.exec(
    'powershell.exe -NoProfile -Command "Test-Path \\"$env:LOCALAPPDATA\\Programs\\superwhisper\\""'
  );

  if (checkResult.code === 0 && checkResult.stdout.trim().toLowerCase() === 'true') {
    console.log('Superwhisper is already installed, skipping installation.');
    console.log('');
    console.log('To launch Superwhisper:');
    console.log('  - Open from Start Menu, or');
    console.log('  - Run: Start-Process superwhisper');
    return;
  }

  // Detect system architecture to download the correct installer
  console.log('Detecting system architecture...');
  const archResult = await shell.exec(
    'powershell.exe -NoProfile -Command "$env:PROCESSOR_ARCHITECTURE"'
  );
  const architecture = archResult.stdout.trim().toUpperCase();

  // Determine the appropriate download URL based on architecture
  let downloadUrl;
  if (architecture === 'ARM64') {
    console.log('Detected ARM64 architecture.');
    downloadUrl = WINDOWS_DOWNLOAD_URLS.arm64;
  } else {
    // Default to x64 for AMD64, x86, and other architectures
    console.log('Detected x64 architecture.');
    downloadUrl = WINDOWS_DOWNLOAD_URLS.x64;
  }

  console.log('Downloading Superwhisper installer...');
  console.log('This may take a few minutes depending on your connection speed...');

  // Download the installer to the temp directory
  // Enable TLS 1.2 first to ensure secure download works
  const downloadCommand = `
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;
    Invoke-WebRequest -Uri "${downloadUrl}" -OutFile "$env:TEMP\\superwhisper-setup.exe"
  `.trim().replace(/\n/g, ' ');

  const downloadResult = await shell.exec(
    `powershell.exe -NoProfile -Command "${downloadCommand}"`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      'Failed to download Superwhisper installer.\n' +
      `Output: ${downloadResult.stderr || downloadResult.stdout}\n\n` +
      'Troubleshooting:\n' +
      '  1. Check your internet connection\n' +
      '  2. Try downloading manually from: https://superwhisper.com/windows\n' +
      '  3. Run the downloaded installer manually'
    );
  }

  console.log('Download complete. Running installer...');
  console.log('');
  console.log('NOTE: The installer may open a GUI window. Please follow the prompts');
  console.log('to complete the installation.');
  console.log('');

  // Run the installer
  // We use -Wait to wait for the installer to complete
  // The /S flag attempts silent installation, but if not supported, GUI will appear
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "Start-Process -FilePath \\"$env:TEMP\\superwhisper-setup.exe\\" -Wait"'
  );

  // Clean up the downloaded installer regardless of result
  await shell.exec(
    'powershell.exe -NoProfile -Command "Remove-Item \\"$env:TEMP\\superwhisper-setup.exe\\" -Force -ErrorAction SilentlyContinue"'
  );

  // Verify installation by checking if the directory now exists
  const verifyResult = await shell.exec(
    'powershell.exe -NoProfile -Command "Test-Path \\"$env:LOCALAPPDATA\\Programs\\superwhisper\\""'
  );

  if (verifyResult.stdout.trim().toLowerCase() !== 'true') {
    // Installation may have been cancelled or failed
    console.log('');
    console.log('Installation was not completed or may have been cancelled.');
    console.log('');
    console.log('To install manually:');
    console.log('  1. Visit: https://superwhisper.com/windows');
    console.log('  2. Download the installer for your system');
    console.log('  3. Run the downloaded installer');
    return;
  }

  console.log('Superwhisper installed successfully.');
  console.log('');
  console.log('To launch Superwhisper:');
  console.log('  - Open from Start Menu, or');
  console.log('  - Run: Start-Process superwhisper');
  console.log('');
  console.log('Superwhisper runs in the system tray. The default keyboard shortcut');
  console.log('for voice input is Ctrl+Space.');
  console.log('');
  console.log('On first launch, grant microphone permissions when prompted.');
}

/**
 * Handle Superwhisper installation request from Ubuntu running in WSL.
 *
 * PLATFORM LIMITATION: Superwhisper cannot run in WSL (Windows Subsystem for Linux).
 * It is a graphical application that requires direct access to audio hardware and
 * a native windowing system. WSL does not provide the necessary audio infrastructure
 * or GUI support for Superwhisper.
 *
 * RECOMMENDED APPROACH: Install Superwhisper on the Windows host and use it alongside
 * your WSL environment. Superwhisper runs in the Windows system tray and can insert
 * text into any application, including terminals running WSL sessions.
 *
 * This function installs Superwhisper on the Windows host via PowerShell, providing
 * a functional solution for WSL users.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Windows installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('NOTE: Superwhisper cannot run directly in WSL due to audio/GUI');
  console.log('requirements. Installing on the Windows host instead...');
  console.log('');

  // Check if Superwhisper is already installed on Windows host
  const checkResult = await shell.exec(
    'powershell.exe -NoProfile -Command "Test-Path \\"$env:LOCALAPPDATA\\Programs\\superwhisper\\""'
  );

  if (checkResult.code === 0 && checkResult.stdout.trim().toLowerCase() === 'true') {
    console.log('Superwhisper is already installed on Windows, skipping installation.');
    console.log('');
    console.log('To launch Superwhisper from WSL:');
    console.log('  cmd.exe /c start superwhisper');
    console.log('');
    console.log('Superwhisper runs in the Windows system tray. Press Ctrl+Space to');
    console.log('start dictation. Text will be inserted into your active application,');
    console.log('including WSL terminal windows.');
    return;
  }

  // Detect Windows architecture from WSL
  console.log('Detecting Windows architecture...');
  const archResult = await shell.exec(
    'powershell.exe -NoProfile -Command "$env:PROCESSOR_ARCHITECTURE"'
  );
  const architecture = archResult.stdout.trim().toUpperCase();

  let downloadUrl;
  if (architecture === 'ARM64') {
    console.log('Detected ARM64 architecture.');
    downloadUrl = WINDOWS_DOWNLOAD_URLS.arm64;
  } else {
    console.log('Detected x64 architecture.');
    downloadUrl = WINDOWS_DOWNLOAD_URLS.x64;
  }

  console.log('Downloading Superwhisper installer to Windows...');
  console.log('This may take a few minutes...');

  // Download the installer via PowerShell
  const downloadCommand = `
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;
    Invoke-WebRequest -Uri "${downloadUrl}" -OutFile "$env:TEMP\\superwhisper-setup.exe"
  `.trim().replace(/\n/g, ' ');

  const downloadResult = await shell.exec(
    `powershell.exe -NoProfile -Command "${downloadCommand}"`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      'Failed to download Superwhisper installer.\n' +
      `Output: ${downloadResult.stderr || downloadResult.stdout}\n\n` +
      'Troubleshooting:\n' +
      '  1. Open PowerShell on Windows and run:\n' +
      '     Invoke-WebRequest -Uri "https://fresh.superwhisper.com/download/installer/windows/x64" -OutFile "$env:TEMP\\superwhisper-setup.exe"\n' +
      '     Start-Process "$env:TEMP\\superwhisper-setup.exe"\n' +
      '  2. Or download manually from: https://superwhisper.com/windows'
    );
  }

  console.log('Download complete. Running installer...');
  console.log('');
  console.log('NOTE: A Windows installer window may appear. Follow the prompts to');
  console.log('complete installation.');
  console.log('');

  // Run the installer
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "Start-Process -FilePath \\"$env:TEMP\\superwhisper-setup.exe\\" -Wait"'
  );

  // Clean up
  await shell.exec(
    'powershell.exe -NoProfile -Command "Remove-Item \\"$env:TEMP\\superwhisper-setup.exe\\" -Force -ErrorAction SilentlyContinue"'
  );

  // Verify installation
  const verifyResult = await shell.exec(
    'powershell.exe -NoProfile -Command "Test-Path \\"$env:LOCALAPPDATA\\Programs\\superwhisper\\""'
  );

  if (verifyResult.stdout.trim().toLowerCase() !== 'true') {
    console.log('');
    console.log('Installation was not completed or may have been cancelled.');
    console.log('');
    console.log('To install manually from Windows:');
    console.log('  1. Visit: https://superwhisper.com/windows');
    console.log('  2. Download and run the installer');
    return;
  }

  console.log('Superwhisper installed successfully on Windows.');
  console.log('');
  console.log('To launch Superwhisper from WSL:');
  console.log('  cmd.exe /c start superwhisper');
  console.log('');
  console.log('Superwhisper runs in the Windows system tray. Press Ctrl+Space');
  console.log('to start dictation. Text will be inserted into your active');
  console.log('application, including WSL terminal windows.');
  console.log('');
  console.log('TIP: Add an alias to ~/.bashrc for convenience:');
  console.log('  echo \'alias superwhisper="cmd.exe /c start superwhisper"\' >> ~/.bashrc');
}

/**
 * Install Superwhisper from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Superwhisper on the
 * Windows host using direct download via PowerShell interop.
 *
 * IMPORTANT: Superwhisper is not available in Chocolatey or winget, so we must
 * download directly from the official website.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit or ARM64)
 * - Git Bash installed (comes with Git for Windows)
 * - Active internet connection for download
 *
 * @returns {Promise<void>}
 * @throws {Error} If download or installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Superwhisper on the Windows host...');
  console.log('');

  // Check if Superwhisper is already installed
  const checkResult = await shell.exec(
    'powershell.exe -NoProfile -Command "Test-Path \\"$env:LOCALAPPDATA\\Programs\\superwhisper\\""'
  );

  if (checkResult.code === 0 && checkResult.stdout.trim().toLowerCase() === 'true') {
    console.log('Superwhisper is already installed, skipping installation.');
    console.log('');
    console.log('To launch Superwhisper:');
    console.log('  cmd //c start superwhisper');
    return;
  }

  // Detect system architecture
  console.log('Detecting system architecture...');
  const archResult = await shell.exec(
    'powershell.exe -NoProfile -Command "$env:PROCESSOR_ARCHITECTURE"'
  );
  const architecture = archResult.stdout.trim().toUpperCase();

  let downloadUrl;
  if (architecture === 'ARM64') {
    console.log('Detected ARM64 architecture.');
    downloadUrl = WINDOWS_DOWNLOAD_URLS.arm64;
  } else {
    console.log('Detected x64 architecture.');
    downloadUrl = WINDOWS_DOWNLOAD_URLS.x64;
  }

  console.log('Downloading Superwhisper installer...');
  console.log('This may take a few minutes...');

  // Download the installer via PowerShell
  const downloadCommand = `
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;
    Invoke-WebRequest -Uri "${downloadUrl}" -OutFile "$env:TEMP\\superwhisper-setup.exe"
  `.trim().replace(/\n/g, ' ');

  const downloadResult = await shell.exec(
    `powershell.exe -NoProfile -Command "${downloadCommand}"`
  );

  if (downloadResult.code !== 0) {
    throw new Error(
      'Failed to download Superwhisper installer.\n' +
      `Output: ${downloadResult.stderr || downloadResult.stdout}\n\n` +
      'Troubleshooting:\n' +
      '  1. Check your internet connection\n' +
      '  2. Open PowerShell and run:\n' +
      '     Invoke-WebRequest -Uri "https://fresh.superwhisper.com/download/installer/windows/x64" -OutFile "$env:TEMP\\superwhisper-setup.exe"\n' +
      '     Start-Process "$env:TEMP\\superwhisper-setup.exe"\n' +
      '  3. Or download manually from: https://superwhisper.com/windows'
    );
  }

  console.log('Download complete. Running installer...');
  console.log('');
  console.log('NOTE: The installer window may appear. Follow the prompts to complete');
  console.log('installation.');
  console.log('');

  // Run the installer
  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "Start-Process -FilePath \\"$env:TEMP\\superwhisper-setup.exe\\" -Wait"'
  );

  // Clean up
  await shell.exec(
    'powershell.exe -NoProfile -Command "Remove-Item \\"$env:TEMP\\superwhisper-setup.exe\\" -Force -ErrorAction SilentlyContinue"'
  );

  // Verify installation
  const verifyResult = await shell.exec(
    'powershell.exe -NoProfile -Command "Test-Path \\"$env:LOCALAPPDATA\\Programs\\superwhisper\\""'
  );

  if (verifyResult.stdout.trim().toLowerCase() !== 'true') {
    console.log('');
    console.log('Installation was not completed or may have been cancelled.');
    console.log('');
    console.log('To install manually:');
    console.log('  1. Visit: https://superwhisper.com/windows');
    console.log('  2. Download and run the installer');
    return;
  }

  console.log('Superwhisper installed successfully.');
  console.log('');
  console.log('To launch Superwhisper from Git Bash:');
  console.log('  cmd //c start superwhisper');
  console.log('');
  console.log('Superwhisper runs in the system tray. The default keyboard shortcut');
  console.log('for voice input is Ctrl+Space.');
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms have
 * appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Superwhisper Desktop via Homebrew cask
 * - Windows: Superwhisper Desktop via direct download
 * - Git Bash: Installs Superwhisper on Windows host via direct download
 *
 * Unsupported platforms (returns graceful message):
 * - Ubuntu/Debian: Superwhisper is not available for Linux
 * - Raspberry Pi OS: Superwhisper is not available for ARM Linux
 * - Amazon Linux/RHEL: Superwhisper is not available for Linux
 * - WSL: Installs on Windows host instead (Superwhisper cannot run in WSL)
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases and variations
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
    console.log(`Superwhisper is not available for ${platform.type}.`);
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

// Allow direct execution: node superwhisper.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
