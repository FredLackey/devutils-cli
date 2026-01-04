#!/usr/bin/env node

/**
 * @fileoverview Install Xcode (Full IDE) on macOS.
 * @module installs/xcode
 *
 * Xcode is Apple's integrated development environment (IDE) for developing software
 * for all Apple platforms: iOS, iPadOS, macOS, watchOS, tvOS, and visionOS.
 *
 * This installer uses the `xcodes` CLI tool to download and install Xcode from
 * Apple's servers. The xcodes tool provides version management and faster downloads
 * (via aria2) compared to the Mac App Store.
 *
 * IMPORTANT PLATFORM LIMITATION:
 * Xcode is an Apple-exclusive product and ONLY runs on macOS. There is no legitimate
 * way to install or run Xcode on Windows, Linux, or other operating systems. Apple
 * does not support virtualization of macOS on non-Apple hardware.
 *
 * What this installer provides:
 * - Installation of the full Xcode IDE (~40+ GB)
 * - Swift and Objective-C compilers
 * - Interface Builder, Instruments, and other development tools
 * - Simulators for all Apple platforms
 * - SDKs for iOS, macOS, watchOS, tvOS, and visionOS
 *
 * IMPORTANT: This is for the FULL Xcode IDE. For the lightweight Command Line Tools
 * only (~2.5 GB), use `dev install xcode-clt` instead.
 *
 * Prerequisites:
 * - macOS version compatible with target Xcode version
 * - Apple ID for downloading from Apple servers
 * - At least 50 GB free disk space
 * - Homebrew package manager
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const fs = require('fs');

/**
 * The path where Xcode is typically installed on macOS.
 * The standard location is /Applications/Xcode.app.
 */
const XCODE_APP_PATH = '/Applications/Xcode.app';

/**
 * The path to the Xcode developer directory within the app bundle.
 * This path is used by xcode-select to point to the active developer tools.
 */
const XCODE_DEVELOPER_PATH = '/Applications/Xcode.app/Contents/Developer';

/**
 * The Homebrew formula name for the xcodes CLI tool.
 * xcodes is a third-party tool that manages Xcode installations.
 */
const XCODES_FORMULA = 'xcodesorg/made/xcodes';

/**
 * The Homebrew formula name for aria2 download accelerator.
 * aria2 enables 3-5x faster Xcode downloads via parallel connections.
 */
const ARIA2_FORMULA = 'aria2';

/**
 * Check if the full Xcode IDE is installed on macOS.
 *
 * This function verifies Xcode installation by:
 * 1. Checking if Xcode.app exists in /Applications
 * 2. Verifying the app bundle structure contains expected binaries
 *
 * Note: This checks for the full Xcode IDE, not just Command Line Tools.
 * The presence of /Library/Developer/CommandLineTools is NOT sufficient.
 *
 * @returns {boolean} True if full Xcode IDE is installed, false otherwise
 */
function isXcodeInstalled() {
  // Check if the Xcode.app bundle exists
  if (!fs.existsSync(XCODE_APP_PATH)) {
    return false;
  }

  // Verify the developer directory exists within the app bundle
  // This ensures it's a complete Xcode installation, not a stub
  if (!fs.existsSync(XCODE_DEVELOPER_PATH)) {
    return false;
  }

  // Verify a core Xcode binary exists (xcodebuild)
  const xcodebuildPath = `${XCODE_DEVELOPER_PATH}/usr/bin/xcodebuild`;
  return fs.existsSync(xcodebuildPath);
}

/**
 * Get the installed Xcode version using xcodebuild command.
 *
 * Executes `xcodebuild -version` to retrieve version information.
 * Output format is typically:
 *   Xcode 16.2
 *   Build version 16C5032a
 *
 * @returns {Promise<string|null>} The Xcode version string (e.g., "16.2"), or null if not installed
 */
async function getXcodeVersion() {
  // Check if xcodebuild command exists and Xcode is properly configured
  const result = await shell.exec('xcodebuild -version 2>/dev/null');

  if (result.code !== 0 || !result.stdout) {
    return null;
  }

  // Parse the version from the output
  // Expected format: "Xcode 16.2\nBuild version 16C5032a"
  const versionMatch = result.stdout.match(/Xcode\s+(\d+\.?\d*\.?\d*)/);
  if (versionMatch) {
    return versionMatch[1];
  }

  return null;
}

/**
 * Check if the xcodes CLI tool is installed.
 *
 * xcodes is a command-line tool for managing Xcode installations.
 * It provides faster downloads and version management compared to
 * the Mac App Store.
 *
 * @returns {boolean} True if xcodes is available, false otherwise
 */
function isXcodesInstalled() {
  return shell.commandExists('xcodes');
}

/**
 * Install the xcodes CLI tool and aria2 download accelerator via Homebrew.
 *
 * This function installs:
 * - xcodes: CLI tool for downloading and managing Xcode versions
 * - aria2: Download accelerator for 3-5x faster Xcode downloads
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function installXcodesTools() {
  // Verify Homebrew is available before attempting installation
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Xcode.'
    );
  }

  console.log('Installing xcodes CLI tool and aria2 download accelerator...');

  // First, tap the xcodes repository
  // This adds the third-party repository containing the xcodes formula
  const tapResult = await brew.tap('xcodesorg/made');
  if (!tapResult.success) {
    throw new Error(
      `Failed to add xcodes tap.\n` +
      `Output: ${tapResult.output}\n\n` +
      `Try running manually: brew tap xcodesorg/made`
    );
  }

  // Install xcodes CLI tool
  console.log('Installing xcodes CLI tool...');
  const xcodesResult = await brew.install('xcodes');
  if (!xcodesResult.success) {
    throw new Error(
      `Failed to install xcodes.\n` +
      `Output: ${xcodesResult.output}\n\n` +
      `Try running manually: brew install xcodesorg/made/xcodes`
    );
  }

  // Install aria2 for faster downloads (optional but recommended)
  console.log('Installing aria2 download accelerator...');
  const aria2Result = await brew.install(ARIA2_FORMULA);
  if (!aria2Result.success) {
    // aria2 failure is not critical, just warn
    console.log('Warning: Could not install aria2. Downloads will be slower.');
    console.log('You can install it manually later: brew install aria2');
  } else {
    console.log('aria2 installed - Xcode downloads will use parallel connections.');
  }

  // Verify xcodes installation
  if (!isXcodesInstalled()) {
    throw new Error(
      'xcodes installation appeared to succeed but the command is not available.\n\n' +
      'Try restarting your terminal and running:\n' +
      '  which xcodes\n' +
      '  xcodes version'
    );
  }

  console.log('xcodes CLI tool installed successfully.');
}

/**
 * Install the full Xcode IDE on macOS using xcodes.
 *
 * Prerequisites:
 * - macOS version compatible with target Xcode version
 * - Homebrew package manager installed
 * - Apple ID credentials (environment variables or interactive prompt)
 * - At least 50 GB free disk space
 *
 * Installation process:
 * 1. Check if Xcode is already installed (idempotency)
 * 2. Install xcodes and aria2 if not present
 * 3. Download and install the latest Xcode via xcodes
 * 4. Accept the Xcode license agreement
 * 5. Run first-launch setup to install additional components
 * 6. Verify the installation succeeded
 *
 * NOTE: This function will require Apple ID credentials. If XCODES_USERNAME
 * and XCODES_PASSWORD environment variables are not set, xcodes will prompt
 * interactively (and optionally save credentials to Keychain).
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_macos() {
  console.log('Checking if Xcode is already installed...');

  // Check if Xcode is already installed - this ensures idempotency
  if (isXcodeInstalled()) {
    const version = await getXcodeVersion();
    if (version) {
      console.log(`Xcode ${version} is already installed, skipping...`);
    } else {
      console.log('Xcode is already installed, skipping...');
    }
    return;
  }

  console.log('Xcode is not installed. Starting installation...');
  console.log('');
  console.log('This will install:');
  console.log('  - Full Xcode IDE (~40+ GB)');
  console.log('  - Swift and Objective-C compilers');
  console.log('  - Interface Builder and Instruments');
  console.log('  - iOS, macOS, watchOS, tvOS, and visionOS SDKs');
  console.log('  - Simulators for all Apple platforms');
  console.log('');
  console.log('IMPORTANT: You will need an Apple ID to download Xcode.');
  console.log('');

  // Install xcodes CLI tool if not already present
  if (!isXcodesInstalled()) {
    await installXcodesTools();
  } else {
    console.log('xcodes CLI tool is already installed.');
  }

  console.log('');
  console.log('Downloading and installing the latest Xcode...');
  console.log('This may take 30-60 minutes depending on your internet connection.');
  console.log('');

  // Check for Apple ID credentials in environment variables
  const hasCredentials = process.env.XCODES_USERNAME && process.env.XCODES_PASSWORD;
  if (!hasCredentials) {
    console.log('NOTE: Apple ID credentials not found in environment variables.');
    console.log('You will be prompted to enter your Apple ID and password.');
    console.log('Credentials will be saved to your macOS Keychain for future use.');
    console.log('');
    console.log('To set credentials non-interactively:');
    console.log('  export XCODES_USERNAME="your-apple-id@example.com"');
    console.log('  export XCODES_PASSWORD="your-password-or-app-specific-password"');
    console.log('');
  }

  // Install the latest Xcode using xcodes
  // The --latest flag installs the most recent stable release
  // This command may prompt for Apple ID credentials if not set
  const installResult = await shell.exec('xcodes install --latest', {
    timeout: 3600000 // 60 minute timeout for large download
  });

  // Check if installation succeeded
  // Note: xcodes may output to stderr for progress, so we check the exit code
  if (installResult.code !== 0) {
    // Check if Xcode was actually installed despite the error code
    // (some warnings may cause non-zero exit but installation succeeds)
    if (isXcodeInstalled()) {
      console.log('');
      console.log('Installation completed with warnings.');
    } else {
      console.log('');
      console.log('Xcode download/installation failed.');
      console.log('');
      console.log('Error output:');
      console.log(installResult.stderr || installResult.stdout || 'No error details available');
      console.log('');
      console.log('Troubleshooting:');
      console.log('  1. Verify your Apple ID credentials are correct');
      console.log('  2. If using two-factor authentication, generate an app-specific password:');
      console.log('     https://appleid.apple.com/account/manage');
      console.log('  3. Check available disk space (need ~50 GB free)');
      console.log('  4. Try running manually:');
      console.log('     xcodes install --latest');
      console.log('');
      console.log('To install a specific version:');
      console.log('  xcodes list');
      console.log('  xcodes install 16.2');
      return;
    }
  }

  // Verify Xcode is now installed
  if (!isXcodeInstalled()) {
    console.log('');
    console.log('Download completed but Xcode was not found at /Applications/Xcode.app');
    console.log('');
    console.log('Please check:');
    console.log('  1. Available disk space');
    console.log('  2. Output from: xcodes installed');
    console.log('  3. Contents of /Applications folder');
    return;
  }

  console.log('');
  console.log('Xcode downloaded and installed successfully.');
  console.log('');

  // Accept the Xcode license agreement
  console.log('Accepting Xcode license agreement...');
  const licenseResult = await shell.exec('sudo xcodebuild -license accept');
  if (licenseResult.code !== 0) {
    console.log('Warning: Could not automatically accept license.');
    console.log('Please run manually: sudo xcodebuild -license accept');
  }

  // Run first-launch setup to install additional components
  console.log('Installing additional components...');
  const firstLaunchResult = await shell.exec('sudo xcodebuild -runFirstLaunch', {
    timeout: 600000 // 10 minute timeout
  });
  if (firstLaunchResult.code !== 0) {
    console.log('Warning: Could not complete first-launch setup.');
    console.log('Please run manually: sudo xcodebuild -runFirstLaunch');
  }

  // Set the developer directory to point to the full Xcode installation
  console.log('Setting active developer directory...');
  const selectResult = await shell.exec(`sudo xcode-select -s "${XCODE_DEVELOPER_PATH}"`);
  if (selectResult.code !== 0) {
    console.log('Warning: Could not set developer directory.');
    console.log(`Please run manually: sudo xcode-select -s "${XCODE_DEVELOPER_PATH}"`);
  }

  // Get and display the installed version
  const installedVersion = await getXcodeVersion();
  console.log('');
  if (installedVersion) {
    console.log(`Xcode ${installedVersion} installed successfully.`);
  } else {
    console.log('Xcode installed successfully.');
  }
  console.log('');
  console.log('Post-installation notes:');
  console.log('  1. Launch Xcode from /Applications or Spotlight to complete setup');
  console.log('  2. Sign in with your Apple ID in Xcode > Settings > Accounts');
  console.log('  3. Download additional simulators in Xcode > Settings > Platforms');
  console.log('');
  console.log('Verify installation:');
  console.log('  xcodebuild -version');
  console.log('  swift --version');
  console.log('  xcode-select -p');
}

/**
 * Handle Xcode installation request on Ubuntu/Debian.
 *
 * Xcode is an Apple-exclusive product and is NOT available for Ubuntu or Debian.
 * This function returns gracefully with a simple informational message.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Xcode is not available for Ubuntu.');
  return;
}

/**
 * Handle Xcode installation request on Ubuntu running in WSL.
 *
 * Xcode is an Apple-exclusive product and cannot run in WSL. WSL runs a Linux
 * kernel, not macOS, and cannot run macOS applications.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Xcode is not available for WSL.');
  return;
}

/**
 * Handle Xcode installation request on Raspberry Pi OS.
 *
 * Xcode is an Apple-exclusive product and is NOT available for Raspberry Pi OS.
 * The ARM architecture of Raspberry Pi is not compatible with Xcode, which only
 * runs on macOS with Apple Silicon or Intel processors.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Xcode is not available for Raspberry Pi OS.');
  return;
}

/**
 * Handle Xcode installation request on Amazon Linux/RHEL.
 *
 * Xcode is an Apple-exclusive product and is NOT available for Amazon Linux
 * or RHEL. Apple does not provide Xcode for any Linux distribution.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Xcode is not available for Amazon Linux.');
  return;
}

/**
 * Handle Xcode installation request on Windows.
 *
 * Xcode is an Apple-exclusive product and is NOT available for Windows.
 * Apple does not provide Xcode for Windows, and there is no legitimate way
 * to run Xcode on Windows.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Xcode is not available for Windows.');
  return;
}

/**
 * Handle Xcode installation request in Git Bash.
 *
 * Xcode is an Apple-exclusive product and is NOT available for Git Bash on
 * Windows. Git Bash provides a Unix-like shell environment on Windows but
 * cannot run macOS applications.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Xcode is not available for Git Bash.');
  return;
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically detects the current operating system and invokes
 * the corresponding platform-specific installation function. Since Xcode is
 * macOS-only, all non-macOS platforms receive a polite informational message.
 *
 * Supported platforms:
 * - macOS: Full Xcode IDE installation via xcodes
 *
 * Unsupported platforms (returns gracefully with message):
 * - Ubuntu/Debian
 * - Ubuntu on WSL
 * - Raspberry Pi OS
 * - Amazon Linux/RHEL/Fedora
 * - Windows (native)
 * - Git Bash
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their corresponding installer functions
  // All non-macOS platforms will receive a "not available" message
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

  const installer = installers[platform.type];

  // Handle unknown platforms gracefully without throwing an error
  if (!installer) {
    console.log(`Xcode is not available for ${platform.type}.`);
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
