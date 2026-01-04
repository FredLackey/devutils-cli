#!/usr/bin/env node

/**
 * @fileoverview Install file - a utility that determines file types by examining file contents.
 *
 * The `file` command identifies file types by examining file contents rather than relying
 * on file extensions. It uses a database of "magic numbers" (unique byte sequences at the
 * start of files) to identify thousands of file formats. This approach is more reliable
 * than extension-based identification because it examines what the file actually contains.
 *
 * Common use cases include:
 * - Identifying unknown or misnamed files
 * - Security analysis and malware detection workflows
 * - Script automation that needs to handle different file types
 * - Forensic analysis and data recovery
 * - Validating file uploads in web applications
 * - Debugging encoding issues with text files
 *
 * @module installs/file
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const choco = require('../utils/windows/choco');

/**
 * Install file on macOS using Homebrew.
 *
 * macOS includes a built-in `file` command as part of the BSD utilities. For most use
 * cases, the system version is sufficient. This function checks if the system version
 * is available (it always should be) and reports success.
 *
 * Note: Homebrew provides a `file-formula` package for users who need a newer version
 * with an updated magic database, but this is rarely necessary for typical usage.
 * The Homebrew version is installed as "keg-only" and is not linked by default to
 * avoid conflicts with the macOS system version.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if the file command is available (it should always be on macOS)
  // macOS ships with a BSD-derived version of file pre-installed at /usr/bin/file
  const isInstalled = shell.commandExists('file');
  if (isInstalled) {
    console.log('file is already installed (system-provided), skipping...');
    return;
  }

  // This situation should not occur on a standard macOS installation
  // If we reach here, something unusual has happened with the system
  console.log('The file command was not found. This is unexpected on macOS.');
  console.log('');
  console.log('The file command should be pre-installed as part of macOS.');
  console.log('If you need to install it manually, you can use Homebrew:');
  console.log('  brew install file-formula');
  console.log('');
  console.log('Note: The Homebrew package is named "file-formula" (not "file") because');
  console.log('macOS already includes a system "file" command. The Homebrew version is');
  console.log('installed as keg-only and must be accessed via its full path:');
  console.log('  $(brew --prefix)/opt/file-formula/bin/file');
}

/**
 * Install file on Ubuntu/Debian using APT.
 *
 * The file package is typically pre-installed on Ubuntu and Debian. This function
 * checks if file is already available and installs it via APT if missing. This
 * handles cases where file was removed or a minimal installation was performed.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if file is already installed by looking for the command
  // It is typically pre-installed on Ubuntu and Debian systems
  const isInstalled = shell.commandExists('file');
  if (isInstalled) {
    console.log('file is already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest available version
  // This is especially important on freshly provisioned systems
  console.log('Updating package lists...');
  const updateResult = await apt.update();
  if (!updateResult.success) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install file using APT
  // The apt.install function uses DEBIAN_FRONTEND=noninteractive and -y flag
  // to ensure fully automated installation without prompts
  console.log('Installing file via APT...');
  const result = await apt.install('file');

  if (!result.success) {
    console.log('Failed to install file via APT.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('file');
  if (!verified) {
    console.log('Installation may have failed: file command not found after install.');
    return;
  }

  console.log('file installed successfully.');
}

/**
 * Install file on Ubuntu running in WSL.
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
 * Install file on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so file installation follows the same
 * process as Ubuntu/Debian. The file package is typically pre-installed, but
 * this function handles cases where it was removed or is missing from a minimal
 * installation. The package is available for both 32-bit (armv7l) and 64-bit
 * (aarch64) ARM architectures.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Raspberry Pi OS uses the same APT-based installation as Ubuntu/Debian
  await install_ubuntu();
}

/**
 * Install file on Amazon Linux using DNF or YUM.
 *
 * The file package is typically pre-installed on Amazon Linux. This function
 * automatically detects whether to use dnf (Amazon Linux 2023) or yum
 * (Amazon Linux 2) based on the available package manager.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if file is already installed by looking for the command
  // It is typically pre-installed on Amazon Linux systems
  const isInstalled = shell.commandExists('file');
  if (isInstalled) {
    console.log('file is already installed, skipping...');
    return;
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Construct the install command based on available package manager
  // The -y flag automatically confirms installation prompts for non-interactive execution
  const installCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y file'
    : 'sudo yum install -y file';

  // Install file
  console.log(`Installing file via ${packageManager}...`);
  const result = await shell.exec(installCommand);

  if (result.code !== 0) {
    console.log(`Failed to install file via ${packageManager}.`);
    console.log(result.stderr || result.stdout);
    return;
  }

  // Verify the installation succeeded by checking if the command exists
  const verified = shell.commandExists('file');
  if (!verified) {
    console.log('Installation may have failed: file command not found after install.');
    return;
  }

  console.log('file installed successfully.');
}

/**
 * Install file on Windows using Chocolatey.
 *
 * Windows does not include a built-in `file` command equivalent to the Unix version.
 * This function installs the Windows port of the Unix file command via Chocolatey,
 * which provides the same functionality for identifying file types by content.
 *
 * The Chocolatey package includes the magic database files needed for file type
 * detection. A new terminal window may be required for PATH updates to take effect.
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

  // Check if file is already installed via Chocolatey
  const isChocoFileInstalled = await choco.isPackageInstalled('file');
  if (isChocoFileInstalled) {
    console.log('file is already installed via Chocolatey, skipping...');
    return;
  }

  // Also check if file command exists (might be installed via other means)
  const commandExists = shell.commandExists('file');
  if (commandExists) {
    console.log('file is already installed, skipping...');
    return;
  }

  // Install file using Chocolatey
  // The -y flag automatically confirms all prompts for fully non-interactive installation
  console.log('Installing file via Chocolatey...');
  const result = await choco.install('file');

  if (!result.success) {
    console.log('Failed to install file via Chocolatey.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the package is now installed
  const verified = await choco.isPackageInstalled('file');
  if (!verified) {
    console.log('Installation may have failed: file package not found after install.');
    return;
  }

  console.log('file installed successfully via Chocolatey.');
  console.log('');
  console.log('Note: You may need to open a new terminal window for the PATH update to take effect.');
}

/**
 * Install file on Git Bash (Windows).
 *
 * Git Bash does not include the file command by default. This function downloads
 * the Windows binary from ezwinports (a maintained Windows port project) and
 * places it in /usr/local/bin, which is included in Git Bash's PATH.
 *
 * The ezwinports package includes the magic database needed for file type detection,
 * and the MAGIC environment variable is configured to locate it.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if file is already available in Git Bash
  const isInstalled = shell.commandExists('file');
  if (isInstalled) {
    console.log('file is already installed, skipping...');
    return;
  }

  // Check if curl is available for downloading the binary
  // curl should be bundled with Git Bash, but verify it exists
  const hasCurl = shell.commandExists('curl');
  if (!hasCurl) {
    console.log('curl is not available. Please ensure Git for Windows is installed correctly.');
    return;
  }

  // Check if unzip is available for extracting the binary
  // unzip is included in recent versions of Git for Windows
  const hasUnzip = shell.commandExists('unzip');
  if (!hasUnzip) {
    console.log('unzip is not available.');
    console.log('Please download file manually from https://sourceforge.net/projects/ezwinports/files/');
    console.log('and place file.exe in /usr/local/bin');
    return;
  }

  // Create the /usr/local/bin directory if it does not exist
  // This directory is typically in Git Bash's PATH
  console.log('Creating /usr/local/bin directory if needed...');
  const mkdirBinResult = await shell.exec('mkdir -p /usr/local/bin');
  if (mkdirBinResult.code !== 0) {
    console.log('Failed to create /usr/local/bin directory.');
    console.log('Try running Git Bash as Administrator.');
    return;
  }

  // Create the /usr/local/share/misc directory for the magic database
  console.log('Creating /usr/local/share/misc directory if needed...');
  const mkdirMiscResult = await shell.exec('mkdir -p /usr/local/share/misc');
  if (mkdirMiscResult.code !== 0) {
    console.log('Failed to create /usr/local/share/misc directory.');
    console.log('Try running Git Bash as Administrator.');
    return;
  }

  // Download and extract the file binary and dependencies from ezwinports
  // Using version 5.41 as specified in the documentation
  // This is an all-in-one command that:
  // 1. Downloads the ezwinports file package
  // 2. Extracts the archive to a temporary directory
  // 3. Copies the file.exe binary to /usr/local/bin
  // 4. Copies required DLL dependencies to /usr/local/bin
  // 5. Copies the magic database file to /usr/local/share/misc
  // 6. Cleans up temporary files
  console.log('Downloading file from ezwinports...');
  const downloadUrl = 'https://sourceforge.net/projects/ezwinports/files/file-5.41-w32-bin.zip/download';
  const downloadCommand = `curl -L -o /tmp/file.zip "${downloadUrl}" && unzip -o /tmp/file.zip -d /tmp/file-extract && cp /tmp/file-extract/bin/file.exe /usr/local/bin/ && cp /tmp/file-extract/bin/*.dll /usr/local/bin/ && cp /tmp/file-extract/share/misc/magic.mgc /usr/local/share/misc/ && rm -rf /tmp/file.zip /tmp/file-extract`;
  const downloadResult = await shell.exec(downloadCommand);

  if (downloadResult.code !== 0) {
    console.log('Failed to download or extract file binary.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    console.log('');
    console.log('If you encounter SSL certificate errors, try running:');
    console.log('  curl -k -L -o /tmp/file.zip "' + downloadUrl + '"');
    return;
  }

  // Set the MAGIC environment variable in .bashrc so file can locate the magic database
  // This is required because the file command needs to know where to find the magic.mgc file
  console.log('Configuring MAGIC environment variable...');
  const magicExportLine = 'export MAGIC="/usr/local/share/misc/magic.mgc"';
  const bashrcPath = '~/.bashrc';

  // Check if the MAGIC export already exists in .bashrc to maintain idempotency
  const checkExistingResult = await shell.exec(`grep -q 'export MAGIC=' ${bashrcPath} 2>/dev/null`);
  if (checkExistingResult.code !== 0) {
    // The MAGIC export does not exist, so add it
    const appendResult = await shell.exec(`echo '${magicExportLine}' >> ${bashrcPath}`);
    if (appendResult.code !== 0) {
      console.log('Warning: Failed to add MAGIC environment variable to ~/.bashrc');
      console.log('You may need to manually add this line to your ~/.bashrc:');
      console.log(`  ${magicExportLine}`);
    }
  }

  // Verify the installation succeeded by checking if the binary exists
  // Note: The command may not be found immediately via commandExists because
  // the MAGIC environment variable is not yet set in the current session
  const verifyBinaryResult = await shell.exec('test -f /usr/local/bin/file.exe');
  if (verifyBinaryResult.code !== 0) {
    console.log('Installation may have failed: file.exe not found after install.');
    return;
  }

  console.log('file installed successfully.');
  console.log('');
  console.log('Note: Run "source ~/.bashrc" or open a new terminal for the MAGIC');
  console.log('environment variable to take effect.');
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. Supported platforms:
 * - macOS (system-provided, optionally Homebrew)
 * - Ubuntu/Debian (APT)
 * - Ubuntu on WSL (APT)
 * - Raspberry Pi OS (APT)
 * - Amazon Linux/RHEL (DNF/YUM)
 * - Windows (Chocolatey)
 * - Git Bash (Manual download from ezwinports)
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
    console.log(`file is not available for ${platform.type}.`);
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
