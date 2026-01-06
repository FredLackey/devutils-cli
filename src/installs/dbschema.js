#!/usr/bin/env node

/**
 * @fileoverview Install DbSchema across supported platforms.
 *
 * DbSchema is a visual database design and management tool that supports schema
 * design, documentation generation, data exploration, and SQL query building.
 * Built with Java and JavaFX, DbSchema works with over 70 databases including
 * PostgreSQL, MySQL, SQL Server, Oracle, SQLite, MongoDB, and many others.
 *
 * DbSchema bundles its own Java runtime (OpenJDK with JavaFX), so no separate
 * Java installation is required.
 *
 * IMPORTANT: DbSchema is commercial software. It offers a free Community Edition
 * and a paid Pro Edition with a 15-day trial included in all downloads.
 *
 * PLATFORM SUPPORT:
 * - macOS: Supported via Homebrew Cask (Intel and Apple Silicon)
 * - Ubuntu/Debian: Supported via official .deb package from DbSchema website
 * - Amazon Linux/RHEL: Supported via official .rpm package from DbSchema website
 * - Windows: Supported via official MSI installer (silent installation)
 * - WSL (Ubuntu): Supported via official .deb package (requires WSLg or X server)
 * - Git Bash: Uses Windows installation
 * - Raspberry Pi OS: Limited support via ARM64 tar.gz (may have compatibility issues)
 *
 * @module installs/dbschema
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const macosApps = require('../utils/macos/apps');
const apt = require('../utils/ubuntu/apt');
const windowsShell = require('../utils/windows/shell');

/**
 * Whether this installer requires a desktop environment to function.
 * DbSchema is a GUI database design and management tool.
 */
const REQUIRES_DESKTOP = true;

/**
 * The current version of DbSchema to install.
 * Update this constant when new versions are released.
 * @constant {string}
 */
const DBSCHEMA_VERSION = '10.0.2';

/**
 * Download URLs for platform-specific packages.
 * These URLs point to the official DbSchema download server.
 * @constant {Object}
 */
const DOWNLOAD_URLS = {
  // Debian/Ubuntu .deb package for x86_64 architecture
  deb: `https://dbschema.com/download/dbschema_linux_${DBSCHEMA_VERSION.replace(/\./g, '_')}.deb`,
  // RHEL/Amazon Linux .rpm package for x86_64 architecture
  rpm: `https://dbschema.com/download/dbschema_linux_${DBSCHEMA_VERSION.replace(/\./g, '_')}.rpm`,
  // Windows MSI installer for x86_64 architecture
  msi: `https://dbschema.com/download/dbschema_windows_${DBSCHEMA_VERSION.replace(/\./g, '_')}.msi`,
  // Raspberry Pi / ARM64 tar.gz archive
  arm64: `https://dbschema.com/download/dbschema_linux_arm_${DBSCHEMA_VERSION.replace(/\./g, '_')}.tar.gz`
};

/**
 * Installation paths where DbSchema is typically installed.
 * Used for verification after installation.
 * @constant {Object}
 */
const INSTALL_PATHS = {
  linux: '/opt/DbSchema/DbSchema',
  windows: 'C:\\Program Files\\DbSchema\\DbSchema.exe'
};

/**
 * Install DbSchema on macOS using Homebrew Cask.
 *
 * DbSchema is available as a Homebrew Cask and supports both Apple Silicon
 * (M1/M2/M3/M4) and Intel Macs. The application will be installed to
 * /Applications/DbSchema.app.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Verify Homebrew is installed before proceeding
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Visit https://brew.sh for installation instructions.');
    return;
  }

  // Check if DbSchema is already installed by looking for the app bundle
  // This catches installations done outside of Homebrew as well
  const isAppInstalled = macosApps.isAppInstalled('DbSchema');
  if (isAppInstalled) {
    const version = macosApps.getAppVersion('DbSchema');
    console.log(`DbSchema is already installed${version ? ` (version ${version})` : ''}, skipping...`);
    return;
  }

  // Also check via Homebrew cask list for completeness
  // This handles the case where the app bundle might be in a non-standard location
  const isCaskInstalled = await brew.isCaskInstalled('dbschema');
  if (isCaskInstalled) {
    console.log('DbSchema is already installed via Homebrew, skipping...');
    return;
  }

  console.log('Installing DbSchema via Homebrew Cask...');

  // Install DbSchema using Homebrew Cask
  // The --cask flag is implicit in installCask but we use the utility for consistency
  const result = await brew.installCask('dbschema');

  if (!result.success) {
    console.log('Failed to install DbSchema.');
    console.log(result.output);
    return;
  }

  // Verify installation succeeded by checking for the app bundle
  const verified = macosApps.isAppInstalled('DbSchema');
  if (!verified) {
    console.log('Installation may have failed: DbSchema.app not found in /Applications.');
    return;
  }

  console.log('DbSchema installed successfully.');
  console.log('');
  console.log('Launch DbSchema from Spotlight or the Applications folder.');
  console.log('DbSchema includes a 15-day Pro trial; after that, use the free Community Edition or purchase a license.');
}

/**
 * Install DbSchema on Ubuntu/Debian using the official .deb package.
 *
 * DbSchema is not available in the official Ubuntu/Debian APT repositories,
 * so this function downloads the .deb package directly from DbSchema's website
 * and installs it using apt-get. The application will be installed to /opt/DbSchema/.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if DbSchema is already installed by looking for the executable
  const isInstalled = await checkLinuxInstallation();
  if (isInstalled) {
    console.log('DbSchema is already installed, skipping...');
    return;
  }

  // Ensure curl is available for downloading the package
  // curl is preferred over wget as it's more commonly pre-installed
  if (!shell.commandExists('curl')) {
    console.log('curl is not available. Installing curl first...');
    const curlResult = await apt.install('curl');
    if (!curlResult.success) {
      console.log('Failed to install curl. Cannot proceed with DbSchema installation.');
      return;
    }
  }

  console.log('Installing DbSchema...');

  // Download the .deb package to a temporary location
  // Using -fsSL for: fail silently on errors, silent mode, follow redirects
  console.log('Downloading DbSchema package...');
  const downloadResult = await shell.exec(
    `curl -fsSL "${DOWNLOAD_URLS.deb}" -o /tmp/dbschema.deb`
  );

  if (downloadResult.code !== 0) {
    console.log('Failed to download DbSchema package.');
    console.log(downloadResult.stderr);
    return;
  }

  // Install the downloaded .deb package using apt-get
  // DEBIAN_FRONTEND=noninteractive prevents any interactive prompts
  console.log('Installing DbSchema package...');
  const installResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/dbschema.deb'
  );

  // Clean up the downloaded package file regardless of installation result
  await shell.exec('rm -f /tmp/dbschema.deb');

  if (installResult.code !== 0) {
    console.log('Failed to install DbSchema.');
    console.log(installResult.stderr);
    return;
  }

  // Verify installation by checking for the executable
  const verified = await checkLinuxInstallation();
  if (!verified) {
    console.log('Installation may have failed: DbSchema executable not found at /opt/DbSchema/DbSchema.');
    return;
  }

  console.log('DbSchema installed successfully.');
  console.log('');
  console.log('Launch DbSchema from your application menu or by running:');
  console.log('  /opt/DbSchema/DbSchema &');
}

/**
 * Install DbSchema on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL Ubuntu follows the same installation process as native Ubuntu.
 * DbSchema runs as a Linux application within WSL. For GUI support:
 * - Windows 11 with WSL 2: WSLg provides built-in GUI support
 * - Windows 10: Requires an X server (e.g., VcXsrv) on Windows
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same installation as native Ubuntu
  // The .deb package works identically in both environments
  await install_ubuntu();

  // Provide additional guidance for WSL-specific setup
  // Users need to understand the GUI requirements for DbSchema
  console.log('');
  console.log('Note: DbSchema is a graphical application and requires display support.');
  console.log('  - Windows 11 with WSL 2: WSLg provides built-in GUI support.');
  console.log('  - Windows 10: Install an X server (e.g., VcXsrv) and configure DISPLAY.');
  console.log('');
  console.log('If you experience display issues, try:');
  console.log('  export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk \'{print $2}\'):0');
}

/**
 * Install DbSchema on Raspberry Pi OS using the ARM64 tar.gz package.
 *
 * IMPORTANT: DbSchema's ARM64 support for Raspberry Pi is limited. While DbSchema
 * provides an ARM64 Linux build, it is primarily designed for x86_64 emulation
 * scenarios. Users may experience compatibility issues due to JavaFX dependencies.
 *
 * This function downloads and extracts the ARM64 tar.gz package to /opt/DbSchema/
 * and creates a desktop launcher for easy access.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if DbSchema is already installed
  const isInstalled = await checkLinuxInstallation();
  if (isInstalled) {
    console.log('DbSchema is already installed, skipping...');
    return;
  }

  // Verify we're on 64-bit ARM architecture
  // DbSchema ARM build requires aarch64; armv7l (32-bit) is not supported
  const archResult = await shell.exec('uname -m');
  const architecture = archResult.stdout.trim();

  if (architecture !== 'aarch64') {
    console.log('DbSchema requires 64-bit Raspberry Pi OS (aarch64).');
    console.log(`Your system is running: ${architecture}`);
    console.log('Please install 64-bit Raspberry Pi OS to use DbSchema.');
    return;
  }

  // Ensure curl is available for downloading the package
  if (!shell.commandExists('curl')) {
    console.log('curl is not available. Installing curl first...');
    const curlResult = await apt.install('curl');
    if (!curlResult.success) {
      console.log('Failed to install curl. Cannot proceed with DbSchema installation.');
      return;
    }
  }

  console.log('Installing DbSchema for Raspberry Pi (ARM64)...');
  console.log('');
  console.log('Note: DbSchema ARM64 support may have limited compatibility with Raspberry Pi.');
  console.log('If you experience issues, consider using x86 emulation via Box64.');
  console.log('');

  // Download the ARM64 tar.gz package
  console.log('Downloading DbSchema ARM64 package...');
  const downloadResult = await shell.exec(
    `curl -fsSL "${DOWNLOAD_URLS.arm64}" -o /tmp/dbschema.tar.gz`
  );

  if (downloadResult.code !== 0) {
    console.log('Failed to download DbSchema package.');
    console.log(downloadResult.stderr);
    return;
  }

  // Create the installation directory and extract the package
  // --strip-components=1 removes the top-level directory from the archive
  console.log('Extracting DbSchema to /opt/DbSchema...');
  const extractResult = await shell.exec(
    'sudo mkdir -p /opt/DbSchema && sudo tar -xzf /tmp/dbschema.tar.gz -C /opt/DbSchema --strip-components=1'
  );

  // Clean up the downloaded archive
  await shell.exec('rm -f /tmp/dbschema.tar.gz');

  if (extractResult.code !== 0) {
    console.log('Failed to extract DbSchema package.');
    console.log(extractResult.stderr);
    return;
  }

  // Create a desktop launcher for easy access from the application menu
  console.log('Creating desktop launcher...');
  const desktopEntry = `[Desktop Entry]
Name=DbSchema
Comment=Database Design Tool
Exec=/opt/DbSchema/DbSchema
Icon=/opt/DbSchema/.install4j/DbSchema.png
Terminal=false
Type=Application
Categories=Development;Database;`;

  // Ensure the local applications directory exists
  await shell.exec('mkdir -p ~/.local/share/applications');

  // Write the desktop entry file
  const writeResult = await shell.exec(
    `echo '${desktopEntry}' > ~/.local/share/applications/dbschema.desktop`
  );

  if (writeResult.code !== 0) {
    console.log('Warning: Failed to create desktop launcher. You can still launch DbSchema from the terminal.');
  }

  // Update the desktop database so the launcher appears in menus
  await shell.exec('update-desktop-database ~/.local/share/applications 2>/dev/null');

  // Verify installation
  const verified = await checkLinuxInstallation();
  if (!verified) {
    console.log('Installation may have failed: DbSchema executable not found at /opt/DbSchema/DbSchema.');
    return;
  }

  console.log('DbSchema installed successfully.');
  console.log('');
  console.log('Launch DbSchema from your application menu or by running:');
  console.log('  /opt/DbSchema/DbSchema &');
}

/**
 * Install DbSchema on Amazon Linux or RHEL using the official .rpm package.
 *
 * DbSchema is not available in the default Amazon Linux, RHEL, or Fedora
 * repositories. This function downloads the .rpm package directly from
 * DbSchema's website and installs it using dnf or yum.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if DbSchema is already installed
  const isInstalled = await checkLinuxInstallation();
  if (isInstalled) {
    console.log('DbSchema is already installed, skipping...');
    return;
  }

  // Determine which package manager to use
  // dnf is preferred (Amazon Linux 2023, RHEL 8+, Fedora)
  // yum is used on older systems (Amazon Linux 2, CentOS 7)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : hasYum ? 'yum' : null;

  if (!packageManager) {
    console.log('Neither dnf nor yum package manager found. Cannot install DbSchema.');
    return;
  }

  // Ensure curl is available for downloading the package
  if (!shell.commandExists('curl')) {
    console.log('curl is not available. Installing curl first...');
    const curlResult = await shell.exec(`sudo ${packageManager} install -y curl`);
    if (curlResult.code !== 0) {
      console.log('Failed to install curl. Cannot proceed with DbSchema installation.');
      return;
    }
  }

  console.log('Installing DbSchema...');

  // Download the .rpm package to a temporary location
  console.log('Downloading DbSchema package...');
  const downloadResult = await shell.exec(
    `curl -fsSL "${DOWNLOAD_URLS.rpm}" -o /tmp/dbschema.rpm`
  );

  if (downloadResult.code !== 0) {
    console.log('Failed to download DbSchema package.');
    console.log(downloadResult.stderr);
    return;
  }

  // Install the downloaded .rpm package
  // The -y flag automatically confirms the installation
  console.log('Installing DbSchema package...');
  const installResult = await shell.exec(
    `sudo ${packageManager} install -y /tmp/dbschema.rpm`
  );

  // Clean up the downloaded package file
  await shell.exec('rm -f /tmp/dbschema.rpm');

  if (installResult.code !== 0) {
    console.log('Failed to install DbSchema.');
    console.log(installResult.stderr);
    return;
  }

  // Verify installation
  const verified = await checkLinuxInstallation();
  if (!verified) {
    console.log('Installation may have failed: DbSchema executable not found at /opt/DbSchema/DbSchema.');
    return;
  }

  console.log('DbSchema installed successfully.');
  console.log('');
  console.log('Note: DbSchema is a graphical application and requires a desktop environment.');
  console.log('Launch DbSchema from your application menu or by running:');
  console.log('  /opt/DbSchema/DbSchema &');
}

/**
 * Install DbSchema on Windows using the official MSI installer.
 *
 * DbSchema is not available in Chocolatey or winget repositories, so this
 * function downloads the MSI installer directly from DbSchema's website and
 * runs it with silent installation flags.
 *
 * The installation is performed via PowerShell to handle the download and
 * MSI execution properly on Windows systems.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if DbSchema is already installed by looking for the executable
  const isInstalled = await checkWindowsInstallation();
  if (isInstalled) {
    console.log('DbSchema is already installed, skipping...');
    return;
  }

  // Ensure PowerShell is available for the installation process
  if (!windowsShell.hasWindowsPowerShell() && !windowsShell.hasPowerShellCore()) {
    console.log('PowerShell is not available. Cannot install DbSchema.');
    return;
  }

  console.log('Installing DbSchema...');
  console.log('This may take a few minutes as the installer is approximately 200 MB.');

  // Build the PowerShell command to download and install DbSchema
  // The command:
  // 1. Downloads the MSI to the temp directory using Invoke-WebRequest
  // 2. Runs msiexec with /qn (quiet, no UI) and /norestart flags
  // 3. Waits for the installation to complete
  // 4. Removes the downloaded MSI file
  const downloadUrl = DOWNLOAD_URLS.msi;
  const installCommand = `
    $ErrorActionPreference = 'Stop';
    Write-Host 'Downloading DbSchema installer...';
    Invoke-WebRequest -Uri '${downloadUrl}' -OutFile "$env:TEMP\\dbschema.msi";
    Write-Host 'Installing DbSchema...';
    Start-Process msiexec.exe -ArgumentList '/i', "$env:TEMP\\dbschema.msi", '/qn', '/norestart' -Wait;
    Remove-Item "$env:TEMP\\dbschema.msi" -ErrorAction SilentlyContinue;
    Write-Host 'Installation complete.';
  `;

  // Execute the PowerShell command
  const result = await windowsShell.execPowerShell(installCommand);

  if (!result.success) {
    console.log('Failed to install DbSchema.');
    console.log(result.stderr || result.stdout);
    console.log('');
    console.log('If the installation failed, try running PowerShell as Administrator.');
    return;
  }

  // Verify installation
  const verified = await checkWindowsInstallation();
  if (!verified) {
    console.log('Installation may have failed: DbSchema.exe not found at expected location.');
    console.log('Check if DbSchema appears in the Start Menu.');
    return;
  }

  console.log('DbSchema installed successfully.');
  console.log('');
  console.log('Launch DbSchema from the Start Menu or by running:');
  console.log('  "C:\\Program Files\\DbSchema\\DbSchema.exe"');
}

/**
 * Install DbSchema on Git Bash (Windows).
 *
 * Git Bash on Windows inherits the Windows PATH. Since DbSchema is a Windows
 * application, this function installs it on Windows using the MSI installer,
 * making it available from Git Bash as well.
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Git Bash uses the Windows installation of DbSchema.');
  console.log('');

  // Check if DbSchema is already available via the Windows PATH
  const isAvailable = await checkWindowsInstallation();
  if (isAvailable) {
    console.log('DbSchema is already installed on Windows and available from Git Bash, skipping...');
    return;
  }

  // Install via the Windows installer
  await install_windows();

  console.log('');
  console.log('Close and reopen Git Bash to ensure the application is accessible.');
  console.log('Launch DbSchema from Git Bash by running:');
  console.log('  "/c/Program Files/DbSchema/DbSchema.exe" &');
}

/**
 * Helper function to check if DbSchema is installed on Linux systems.
 *
 * Checks for the DbSchema executable at the standard installation path
 * (/opt/DbSchema/DbSchema). Also checks if the dbschema package is
 * registered with dpkg on Debian-based systems.
 *
 * @returns {Promise<boolean>} True if DbSchema is installed, false otherwise
 */
async function checkLinuxInstallation() {
  // Check for the executable at the standard installation path
  const executableResult = await shell.exec(`test -f "${INSTALL_PATHS.linux}" && echo "exists"`);
  if (executableResult.stdout.trim() === 'exists') {
    return true;
  }

  // Also check if the package is installed via dpkg (Debian-based systems)
  const dpkgResult = await shell.exec('dpkg -l dbschema 2>/dev/null | grep -q "^ii"');
  if (dpkgResult.code === 0) {
    return true;
  }

  // Check if installed via rpm (RHEL-based systems)
  const rpmResult = await shell.exec('rpm -qa dbschema 2>/dev/null | grep -q dbschema');
  if (rpmResult.code === 0) {
    return true;
  }

  return false;
}

/**
 * Helper function to check if DbSchema is installed on Windows systems.
 *
 * Checks for the DbSchema executable at the standard installation path
 * (C:\Program Files\DbSchema\DbSchema.exe).
 *
 * @returns {Promise<boolean>} True if DbSchema is installed, false otherwise
 */
async function checkWindowsInstallation() {
  // Use PowerShell to check if the executable exists
  const result = await windowsShell.execPowerShell(
    `Test-Path "${INSTALL_PATHS.windows}"`
  );

  // PowerShell Test-Path returns "True" or "False" as string
  return result.success && result.stdout.trim().toLowerCase() === 'true';
}

/**
 * Check if DbSchema is currently installed on the system.
 *
 * This function checks for DbSchema installation across all supported platforms:
 * - macOS: Checks for DbSchema.app via Homebrew cask or application bundle
 * - Windows: Checks for DbSchema.exe at the standard installation path
 * - Linux: Checks for the DbSchema executable at /opt/DbSchema/DbSchema
 *
 * @returns {Promise<boolean>} True if DbSchema is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    // Check if DbSchema app bundle exists
    if (macosApps.isAppInstalled('DbSchema')) {
      return true;
    }
    // Also check via Homebrew cask
    return await brew.isCaskInstalled('dbschema');
  }

  if (platform.type === 'windows' || platform.type === 'gitbash') {
    return await checkWindowsInstallation();
  }

  // Linux platforms (ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora)
  return await checkLinuxInstallation();
}

/**
 * Check if this installer is supported on the current platform.
 *
 * DbSchema can be installed on:
 * - macOS (via Homebrew cask)
 * - Ubuntu/Debian (via official .deb package)
 * - Raspberry Pi OS (via ARM64 tar.gz package)
 * - Amazon Linux/RHEL/Fedora (via official .rpm package)
 * - Windows (via official MSI installer)
 * - WSL (via official .deb package, requires WSLg or X server)
 * - Git Bash (uses Windows installation)
 *
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
 * This function detects the current operating system and delegates to the
 * appropriate platform-specific installer. On unsupported platforms, it
 * displays a friendly message and returns gracefully without throwing an error.
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // Multiple platform types may use the same installer function
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,
    'wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'rhel': install_amazon_linux,
    'fedora': install_amazon_linux,
    'windows': install_windows
  };

  const installer = installers[platform.type];

  if (!installer) {
    // Handle unsupported platforms gracefully without throwing an error
    // Per project requirements: never throw errors for unsupported platforms
    console.log(`DbSchema is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

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

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
