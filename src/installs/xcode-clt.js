#!/usr/bin/env node

/**
 * @fileoverview Install Xcode Command Line Tools on macOS.
 *
 * Xcode is Apple's integrated development environment (IDE) for developing software
 * for all Apple platforms including iOS, macOS, watchOS, tvOS, and visionOS.
 *
 * This installer focuses on the Xcode Command Line Tools - a lightweight package
 * (~2.5 GB) containing essential development utilities (compilers, git, make, etc.)
 * needed by most developers and required by package managers like Homebrew.
 *
 * IMPORTANT PLATFORM LIMITATION:
 * Xcode and Xcode Command Line Tools are Apple-exclusive products and ONLY run
 * on macOS. There is no legitimate way to install or run Xcode on Windows, Linux,
 * or other operating systems.
 *
 * What this installer provides:
 * - Non-interactive installation of Xcode Command Line Tools via softwareupdate
 * - Verification of existing installation to ensure idempotency
 * - Graceful handling of unsupported platforms
 *
 * @module installs/xcode-clt
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const fs = require('fs');
const path = require('path');

/**
 * The path where Xcode Command Line Tools are installed on macOS.
 * This is the standard location Apple uses for CLT installations.
 */
const CLT_INSTALL_PATH = '/Library/Developer/CommandLineTools';

/**
 * The path to the placeholder file used to make CLT appear in softwareupdate.
 * Creating this file triggers macOS to list CLT as an available update.
 */
const CLT_PLACEHOLDER_FILE = '/tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress';

/**
 * Check if Xcode Command Line Tools are already installed.
 *
 * This function uses two methods to verify CLT installation:
 * 1. Checks if the xcode-select command reports a valid developer directory
 * 2. Verifies that the CLT directory structure exists on disk
 *
 * Both checks are necessary because:
 * - xcode-select -p can report a path even if CLT is partially installed
 * - The directory might exist but CLT might not be fully functional
 *
 * @returns {Promise<boolean>} True if CLT is fully installed and functional, false otherwise
 */
async function isCommandLineToolsInstalled() {
  // First check: Use xcode-select to verify the developer directory is set
  // This is the most reliable way to check if CLT is properly configured
  const xcodeSelectResult = await shell.exec('xcode-select -p');

  // If xcode-select returns an error code, CLT is not installed or not configured
  if (xcodeSelectResult.code !== 0) {
    return false;
  }

  const developerPath = xcodeSelectResult.stdout.trim();

  // xcode-select -p returns the developer directory path
  // For CLT-only installs: /Library/Developer/CommandLineTools
  // For full Xcode: /Applications/Xcode.app/Contents/Developer
  // An empty response or error indicates no installation
  if (!developerPath) {
    return false;
  }

  // Second check: Verify the reported path actually exists on disk
  // This catches cases where xcode-select has a stale configuration
  const pathExists = fs.existsSync(developerPath);
  if (!pathExists) {
    return false;
  }

  // Third check: Verify a core CLT binary exists (clang compiler)
  // This ensures CLT is not just partially installed
  // Check for clang in both possible locations
  const cltClangPath = path.join(CLT_INSTALL_PATH, 'usr', 'bin', 'clang');
  const xcodeClangPath = '/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang';

  const hasCltClang = fs.existsSync(cltClangPath);
  const hasXcodeClang = fs.existsSync(xcodeClangPath);

  return hasCltClang || hasXcodeClang;
}

/**
 * Get the currently installed Xcode or Command Line Tools version.
 *
 * This function attempts to retrieve version information from xcode-select.
 * The output format varies depending on whether CLT or full Xcode is installed.
 *
 * @returns {Promise<string|null>} The version string if available, null otherwise
 */
async function getInstalledVersion() {
  // Try xcode-select --version first
  const versionResult = await shell.exec('xcode-select --version');
  if (versionResult.code === 0 && versionResult.stdout) {
    // Output format: "xcode-select version 2397."
    const versionMatch = versionResult.stdout.match(/version\s+(\d+)/);
    if (versionMatch) {
      return `xcode-select ${versionMatch[1]}`;
    }
    return versionResult.stdout.trim();
  }

  // If xcode-select version fails, try checking if full Xcode is installed
  const xcodebuildResult = await shell.exec('xcodebuild -version 2>/dev/null');
  if (xcodebuildResult.code === 0 && xcodebuildResult.stdout) {
    // Output format: "Xcode 26.2\nBuild version 26B104"
    const firstLine = xcodebuildResult.stdout.trim().split('\n')[0];
    if (firstLine) {
      return firstLine;
    }
  }

  return null;
}

/**
 * Find the Command Line Tools package name from softwareupdate.
 *
 * This function queries softwareupdate for available updates and extracts
 * the specific CLT package name. The package name includes a version number
 * that changes with each macOS release, so we need to find it dynamically.
 *
 * Example package names:
 * - "Command Line Tools for Xcode-26.0"
 * - "Command Line Tools for Xcode-15.4"
 *
 * @returns {Promise<string|null>} The full package name if found, null otherwise
 */
async function findCLTPackageName() {
  // Create the placeholder file that tells macOS to include CLT in the update list
  // This is the same technique used by the official Apple documentation
  try {
    fs.writeFileSync(CLT_PLACEHOLDER_FILE, '');
  } catch (error) {
    console.log('Warning: Could not create placeholder file. Continuing anyway...');
  }

  // Query softwareupdate for the list of available updates
  // The -l flag lists available updates without installing them
  console.log('Checking for available Command Line Tools...');
  const listResult = await shell.exec('softwareupdate -l 2>&1', { timeout: 120000 });

  if (listResult.code !== 0 && !listResult.stdout) {
    console.log('Warning: softwareupdate returned an error. Output:', listResult.stderr);
    return null;
  }

  // Combine stdout and stderr as softwareupdate sometimes writes to stderr
  const output = listResult.stdout + '\n' + listResult.stderr;

  // Look for the Command Line Tools package in the output
  // The format can vary, so we try multiple patterns
  // Pattern 1: "* Label: Command Line Tools for Xcode-XX.X"
  // Pattern 2: "Command Line Tools for Xcode-XX.X" (on a single line)
  const patterns = [
    /\*\s+Label:\s+(Command Line Tools for Xcode-[\d.]+)/,
    /^\s*(Command Line Tools for Xcode-[\d.]+)/m,
    /(Command Line Tools for Xcode-[\d.]+)/
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Clean up the placeholder file used for softwareupdate.
 *
 * This function removes the temporary placeholder file that was created
 * to make CLT appear in the softwareupdate list. It should be called
 * after installation completes (success or failure) to avoid leaving
 * temporary files on the system.
 */
function cleanupPlaceholderFile() {
  try {
    if (fs.existsSync(CLT_PLACEHOLDER_FILE)) {
      fs.unlinkSync(CLT_PLACEHOLDER_FILE);
    }
  } catch (error) {
    // Silently ignore cleanup failures - the file is in /tmp and will be
    // automatically cleaned up on reboot anyway
  }
}

/**
 * Install Xcode Command Line Tools on macOS.
 *
 * This function installs CLT using the non-interactive softwareupdate method,
 * which is the recommended approach for automated installations. It avoids
 * the GUI dialog that xcode-select --install would trigger.
 *
 * Installation process:
 * 1. Check if CLT is already installed (idempotency)
 * 2. Create a placeholder file to make CLT appear in softwareupdate
 * 3. Find the CLT package name from softwareupdate
 * 4. Install CLT using sudo softwareupdate -i
 * 5. Clean up the placeholder file
 * 6. Verify the installation succeeded
 *
 * Note: This function requires sudo privileges for the actual installation.
 * The user will be prompted for their password by the softwareupdate command.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking if Xcode Command Line Tools are already installed...');

  // Check if CLT is already installed - this ensures idempotency
  const alreadyInstalled = await isCommandLineToolsInstalled();
  if (alreadyInstalled) {
    const version = await getInstalledVersion();
    if (version) {
      console.log(`Xcode Command Line Tools are already installed (${version}), skipping...`);
    } else {
      console.log('Xcode Command Line Tools are already installed, skipping...');
    }
    return;
  }

  console.log('Xcode Command Line Tools are not installed. Starting installation...');
  console.log('');
  console.log('This will install:');
  console.log('  - Compilers (clang, clang++)');
  console.log('  - Git version control');
  console.log('  - Make and other build tools');
  console.log('  - System headers and libraries');
  console.log('');
  console.log('The installation requires approximately 2.5 GB of disk space.');
  console.log('');

  // Find the CLT package name
  const packageName = await findCLTPackageName();

  if (!packageName) {
    // Clean up placeholder file before exiting
    cleanupPlaceholderFile();

    console.log('Could not find Command Line Tools in available software updates.');
    console.log('');
    console.log('This can happen if:');
    console.log('  1. Command Line Tools are already installed but not detected');
    console.log('  2. Your macOS version does not support the latest CLT');
    console.log('  3. Network issues prevented checking for updates');
    console.log('');
    console.log('Try running manually:');
    console.log('  xcode-select --install');
    console.log('');
    console.log('Or download directly from:');
    console.log('  https://developer.apple.com/download/all/');
    return;
  }

  console.log(`Found package: ${packageName}`);
  console.log('');
  console.log('Installing... This may take several minutes depending on your');
  console.log('internet connection and disk speed.');
  console.log('');
  console.log('You may be prompted for your password (sudo is required).');
  console.log('');

  // Install CLT using softwareupdate
  // The --verbose flag provides progress output
  // We use a longer timeout because the download can be slow
  const installResult = await shell.exec(
    `sudo softwareupdate -i "${packageName}" --verbose`,
    { timeout: 600000 } // 10 minute timeout
  );

  // Clean up the placeholder file regardless of success/failure
  cleanupPlaceholderFile();

  // Check if installation succeeded
  if (installResult.code !== 0) {
    console.log('');
    console.log('Installation encountered an issue.');
    console.log('');

    // Check if it actually installed despite the error code
    // (softwareupdate sometimes returns non-zero even on success)
    const nowInstalled = await isCommandLineToolsInstalled();
    if (nowInstalled) {
      console.log('However, Command Line Tools appear to be installed successfully.');
      const version = await getInstalledVersion();
      if (version) {
        console.log(`Installed version: ${version}`);
      }
      console.log('');
      console.log('Installation completed successfully.');
      return;
    }

    console.log('Error output:');
    console.log(installResult.stderr || installResult.stdout || 'No error details available');
    console.log('');
    console.log('Troubleshooting steps:');
    console.log('  1. Try running: xcode-select --install');
    console.log('  2. Ensure you have a stable internet connection');
    console.log('  3. Check available disk space (need ~2.5 GB free)');
    console.log('  4. Download manually from: https://developer.apple.com/download/all/');
    return;
  }

  // Verify the installation succeeded
  const verified = await isCommandLineToolsInstalled();
  if (!verified) {
    console.log('');
    console.log('Installation completed but verification failed.');
    console.log('');
    console.log('The softwareupdate command finished, but Command Line Tools');
    console.log('were not detected in the expected location.');
    console.log('');
    console.log('Try restarting your terminal and running:');
    console.log('  xcode-select -p');
    console.log('  clang --version');
    return;
  }

  // Get and display the installed version
  const installedVersion = await getInstalledVersion();
  console.log('');
  if (installedVersion) {
    console.log(`Xcode Command Line Tools installed successfully (${installedVersion}).`);
  } else {
    console.log('Xcode Command Line Tools installed successfully.');
  }
  console.log('');
  console.log('You can verify the installation by running:');
  console.log('  xcode-select -p');
  console.log('  clang --version');
  console.log('  git --version');
}

/**
 * Handle Xcode CLT installation request on Ubuntu/Debian.
 *
 * Xcode CLT is an Apple-exclusive product and is NOT available for Ubuntu or Debian.
 * This function returns gracefully with a simple informational message.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Xcode CLT is not available for Ubuntu.');
  return;
}

/**
 * Handle Xcode CLT installation request on Ubuntu running in WSL.
 *
 * Xcode CLT is an Apple-exclusive product and cannot run in WSL. WSL runs a Linux
 * kernel, not macOS, and cannot run macOS applications.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Xcode CLT is not available for WSL.');
  return;
}

/**
 * Handle Xcode CLT installation request on Raspberry Pi OS.
 *
 * Xcode CLT is an Apple-exclusive product and is NOT available for Raspberry Pi OS.
 * The ARM architecture of Raspberry Pi is not compatible with Xcode CLT, which only
 * runs on macOS with Apple Silicon or Intel processors.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Xcode CLT is not available for Raspberry Pi OS.');
  return;
}

/**
 * Handle Xcode CLT installation request on Amazon Linux/RHEL.
 *
 * Xcode CLT is an Apple-exclusive product and is NOT available for Amazon Linux
 * or RHEL. Apple does not provide Xcode CLT for any Linux distribution.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Xcode CLT is not available for Amazon Linux.');
  return;
}

/**
 * Handle Xcode CLT installation request on Windows.
 *
 * Xcode CLT is an Apple-exclusive product and is NOT available for Windows.
 * Apple does not provide Xcode CLT for Windows, and there is no legitimate way
 * to run Xcode CLT on Windows.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Xcode CLT is not available for Windows.');
  return;
}

/**
 * Handle Xcode CLT installation request in Git Bash.
 *
 * Xcode CLT is an Apple-exclusive product and is NOT available for Git Bash on
 * Windows. Git Bash provides a Unix-like shell environment on Windows but
 * cannot run macOS applications.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Xcode CLT is not available for Git Bash.');
  return;
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function automatically detects the current operating system and invokes
 * the corresponding platform-specific installation function. Since Xcode CLT is
 * macOS-only, all non-macOS platforms receive a polite informational message.
 *
 * Supported platforms:
 * - macOS: Full Xcode Command Line Tools installation
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
    console.log(`Xcode CLT is not available for ${platform.type}.`);
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
