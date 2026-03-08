#!/usr/bin/env node

/**
 * @fileoverview Install CA Certificates - trusted Certificate Authority certificates.
 *
 * CA certificates (Certificate Authority certificates) are digital certificates
 * that establish a chain of trust for SSL/TLS connections. They are used by
 * web browsers, command-line tools like cURL and wget, programming languages,
 * and other applications to verify that secure connections to remote servers
 * are legitimate and not being intercepted by malicious actors.
 *
 * CA certificates are essential for:
 * - Secure web browsing (HTTPS)
 * - Package manager operations (downloading from secure repositories)
 * - API calls from applications
 * - Git operations over HTTPS
 * - Email encryption (TLS)
 * - VPN connections
 *
 * Platform-specific packages and tools:
 * - macOS: Homebrew ca-certificates formula (Mozilla CA bundle for CLI tools)
 * - Ubuntu/Debian/Raspbian: ca-certificates package via APT + update-ca-certificates
 * - Amazon Linux/RHEL: ca-certificates package via DNF/YUM + update-ca-trust
 * - Windows: Windows Certificate Store (managed via certutil)
 * - WSL: ca-certificates package via APT (same as Ubuntu)
 * - Git Bash: CA bundle bundled with Git for Windows
 *
 * @module installs/ca-certificates
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Checks if the ca-certificates package is installed on Debian-based systems.
 * Uses dpkg to query the package installation status.
 *
 * @returns {Promise<boolean>} True if ca-certificates is installed via APT
 */
async function isDebianCaCertsInstalled() {
  return await apt.isPackageInstalled('ca-certificates');
}

/**
 * Checks if the certificate bundle file exists on Debian-based systems.
 * The bundle file at /etc/ssl/certs/ca-certificates.crt contains all
 * trusted CA certificates concatenated together.
 *
 * @returns {Promise<boolean>} True if the certificate bundle file exists
 */
async function doesDebianCertBundleExist() {
  const result = await shell.exec('test -f /etc/ssl/certs/ca-certificates.crt');
  return result.code === 0;
}

/**
 * Checks if the certificate bundle file exists on RHEL-based systems.
 * The actual bundle file is at /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem
 * (with a symlink at /etc/pki/tls/certs/ca-bundle.crt for compatibility).
 * We check the actual file location since the symlink may be missing even when
 * the bundle exists.
 *
 * @returns {Promise<boolean>} True if the certificate bundle file exists
 */
async function doesRhelCertBundleExist() {
  // Check the actual bundle file location, not the symlink
  const result = await shell.exec('test -f /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem');
  return result.code === 0;
}

// -----------------------------------------------------------------------------
// Platform-Specific Installation Functions
// -----------------------------------------------------------------------------

/**
 * Install CA certificates on macOS using Homebrew.
 *
 * macOS maintains CA certificates in two locations:
 * 1. System Keychain - Used by Safari, native macOS applications, and system services
 * 2. Homebrew ca-certificates - Used by Homebrew-installed tools like cURL, OpenSSL, and Python
 *
 * This function installs the Mozilla CA certificate bundle via Homebrew, which
 * provides certificates for command-line tools. The certificate bundle is sourced
 * from Mozilla (via https://curl.se/docs/caextract.html) and is regularly updated.
 *
 * Note: System applications use the macOS Keychain, not Homebrew's ca-certificates.
 * Use Keychain Access or the security command to manage system-wide certificates.
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  // Check if Homebrew is available - it is required for macOS installation
  if (!brew.isInstalled()) {
    console.log('Homebrew is not installed. Please install Homebrew first.');
    console.log('Run: dev install homebrew');
    return;
  }

  // Check if ca-certificates is already installed via Homebrew
  const isBrewCaCertsInstalled = await brew.isFormulaInstalled('ca-certificates');
  if (isBrewCaCertsInstalled) {
    console.log('CA certificates are already installed via Homebrew, skipping...');
    return;
  }

  // Install ca-certificates using Homebrew
  // The --quiet flag suppresses non-essential output for cleaner automation
  console.log('Installing CA certificates via Homebrew...');
  const result = await brew.install('ca-certificates');

  if (!result.success) {
    console.log('Failed to install CA certificates via Homebrew.');
    console.log(result.output);
    return;
  }

  // Verify the installation succeeded by checking if the formula is now installed
  const verified = await brew.isFormulaInstalled('ca-certificates');
  if (!verified) {
    console.log('Installation may have failed: ca-certificates formula not found after install.');
    return;
  }

  console.log('CA certificates installed successfully via Homebrew.');
  console.log('');
  console.log('Note: Homebrew-installed tools will automatically use this certificate bundle.');
  console.log('System applications (Safari, Mail) use the macOS Keychain instead.');
}

/**
 * Install CA certificates on Ubuntu/Debian using APT.
 *
 * The ca-certificates package is typically pre-installed on Ubuntu and Debian
 * systems. This function ensures it is installed and up to date, then regenerates
 * the certificate bundle using update-ca-certificates.
 *
 * The update-ca-certificates command:
 * 1. Reads certificate configuration from /etc/ca-certificates.conf
 * 2. Processes certificates from /usr/share/ca-certificates/ and /usr/local/share/ca-certificates/
 * 3. Generates the unified bundle at /etc/ssl/certs/ca-certificates.crt
 * 4. Creates individual certificate symlinks in /etc/ssl/certs/
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Check if ca-certificates is already installed and certificate bundle exists
  const isInstalled = await isDebianCaCertsInstalled();
  const bundleExists = await doesDebianCertBundleExist();

  if (isInstalled && bundleExists) {
    console.log('CA certificates are already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest version
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install ca-certificates using APT with non-interactive mode
  console.log('Installing CA certificates via APT...');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates');

  if (installResult.code !== 0) {
    console.log('Failed to install CA certificates via APT.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Regenerate the certificate bundle to ensure it is up to date
  // This command processes all certificates and creates the unified bundle
  console.log('Regenerating certificate bundle...');
  const updateCaResult = await shell.exec('sudo update-ca-certificates');

  if (updateCaResult.code !== 0) {
    console.log('Warning: Failed to regenerate certificate bundle.');
    console.log(updateCaResult.stderr || updateCaResult.stdout);
  }

  // Verify the installation succeeded by checking if the bundle file exists
  const verified = await doesDebianCertBundleExist();
  if (!verified) {
    console.log('Installation may have failed: certificate bundle not found after install.');
    return;
  }

  console.log('CA certificates installed successfully.');
}

/**
 * Install CA certificates on Ubuntu running in WSL.
 *
 * WSL Ubuntu installations follow the same process as native Ubuntu using APT.
 * The certificate store is separate from the Windows host, so certificates
 * added to Windows Certificate Store are not automatically available in WSL.
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL Ubuntu uses the same APT-based installation as native Ubuntu
  await install_ubuntu();
}

/**
 * Install CA certificates on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so CA certificates management follows
 * the same process as Ubuntu/Debian. The ca-certificates package is typically
 * pre-installed on Raspberry Pi OS.
 *
 * Note: The ca-certificates package is architecture-independent (it contains
 * only certificate data files, no compiled binaries), so there is no difference
 * between ARM and x86 installations.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // Check if ca-certificates is already installed and certificate bundle exists
  const isInstalled = await isDebianCaCertsInstalled();
  const bundleExists = await doesDebianCertBundleExist();

  if (isInstalled && bundleExists) {
    console.log('CA certificates are already installed, skipping...');
    return;
  }

  // Update package lists before installing to ensure we get the latest version
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install ca-certificates using APT with non-interactive mode
  console.log('Installing CA certificates via APT...');
  console.log('Note: Installation may take a few minutes on Raspberry Pi.');
  const installResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates');

  if (installResult.code !== 0) {
    console.log('Failed to install CA certificates via APT.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Regenerate the certificate bundle to ensure it is up to date
  console.log('Regenerating certificate bundle...');
  const updateCaResult = await shell.exec('sudo update-ca-certificates');

  if (updateCaResult.code !== 0) {
    console.log('Warning: Failed to regenerate certificate bundle.');
    console.log(updateCaResult.stderr || updateCaResult.stdout);
  }

  // Verify the installation succeeded by checking if the bundle file exists
  const verified = await doesDebianCertBundleExist();
  if (!verified) {
    console.log('Installation may have failed: certificate bundle not found after install.');
    return;
  }

  console.log('CA certificates installed successfully.');
}

/**
 * Install CA certificates on Amazon Linux/RHEL using DNF or YUM.
 *
 * The ca-certificates package is pre-installed on all Amazon Linux versions.
 * This function ensures it is installed and up to date, then regenerates
 * the certificate bundle using update-ca-trust.
 *
 * Note: Unlike Debian-based systems that use update-ca-certificates, Red Hat-based
 * systems (including Amazon Linux) use update-ca-trust to manage the certificate
 * trust store. The bundle is located at /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem
 * (with a symlink at /etc/pki/tls/certs/ca-bundle.crt for compatibility).
 *
 * Amazon Linux 2023 uses dnf as the package manager, while Amazon Linux 2 uses yum.
 * This function automatically detects which package manager is available.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  // Check if the certificate bundle already exists
  const bundleExists = await doesRhelCertBundleExist();

  if (bundleExists) {
    // Verify the package is installed by checking if rpm can find it
    const rpmResult = await shell.exec('rpm -q ca-certificates');
    if (rpmResult.code === 0) {
      console.log('CA certificates are already installed, skipping...');
      return;
    }
  }

  // Detect the platform to determine which package manager to use
  // Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
  const platform = os.detect();
  const packageManager = platform.packageManager;

  // Construct the install command based on available package manager
  const installCommand = packageManager === 'dnf'
    ? 'sudo dnf install -y ca-certificates'
    : 'sudo yum install -y ca-certificates';

  // Install ca-certificates
  console.log(`Installing CA certificates via ${packageManager}...`);
  const installResult = await shell.exec(installCommand);

  if (installResult.code !== 0) {
    console.log(`Failed to install CA certificates via ${packageManager}.`);
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Regenerate the certificate bundle using update-ca-trust
  // This command reads certificates from /etc/pki/ca-trust/source/anchors/
  // and generates the unified bundle at /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem
  console.log('Regenerating certificate trust store...');
  const updateTrustResult = await shell.exec('sudo update-ca-trust');

  if (updateTrustResult.code !== 0) {
    console.log('Warning: Failed to regenerate certificate trust store.');
    console.log(updateTrustResult.stderr || updateTrustResult.stdout);
  }

  // Verify the installation succeeded by checking if the bundle file exists
  const verified = await doesRhelCertBundleExist();
  if (!verified) {
    console.log('Installation may have failed: certificate bundle not found after install.');
    return;
  }

  console.log('CA certificates installed successfully.');
}

/**
 * Install/update CA certificates on Windows.
 *
 * Windows handles CA certificates differently from Linux and macOS. There is no
 * "ca-certificates" package to install. Instead, Windows maintains a Certificate
 * Trust List (CTL) that is automatically updated through Windows Update.
 *
 * This function manually triggers an update of the root certificates by:
 * 1. Downloading the latest root certificate list from Microsoft
 * 2. Importing the certificates to the Trusted Root store
 *
 * Windows stores certificates in the Windows Certificate Store, accessible via:
 * - Certificate Manager (certmgr.msc) for current user certificates
 * - Certificate Manager (certlm.msc) for local machine certificates
 * - certutil command-line tool
 * - PowerShell certificate provider
 *
 * Note: This function must be run with Administrator privileges.
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Check if certutil is available (it should be on all modern Windows versions)
  const hasCertutil = shell.commandExists('certutil');
  if (!hasCertutil) {
    console.log('certutil command not found. This is unexpected on Windows.');
    console.log('Please ensure you are running Windows 10 or later.');
    return;
  }

  // Check if certificates are already present in the Trusted Root store
  // A healthy Windows installation should have over 100 root certificates
  console.log('Checking current certificate store...');
  const countResult = await shell.exec('powershell -Command "(Get-ChildItem Cert:\\LocalMachine\\Root).Count"');

  if (countResult.code === 0) {
    const certCount = parseInt(countResult.stdout.trim(), 10);
    if (certCount > 100) {
      console.log(`Windows Certificate Store contains ${certCount} root certificates.`);
      console.log('CA certificates are already present, skipping...');
      return;
    }
  }

  // Download and import the latest root certificates from Microsoft
  // This command retrieves the Certificate Trust List from Windows Update servers
  console.log('Downloading latest root certificates from Microsoft...');
  const downloadResult = await shell.exec('certutil -generateSSTFromWU C:\\Windows\\Temp\\roots.sst');

  if (downloadResult.code !== 0) {
    console.log('Failed to download root certificates from Microsoft.');
    console.log('This may be due to network issues or Windows Update being blocked.');
    console.log(downloadResult.stderr || downloadResult.stdout);
    return;
  }

  // Import the certificates to the Trusted Root store
  console.log('Importing certificates to Trusted Root store...');
  const importResult = await shell.exec('certutil -addstore -f Root C:\\Windows\\Temp\\roots.sst');

  if (importResult.code !== 0) {
    console.log('Failed to import certificates to Trusted Root store.');
    console.log('Ensure you are running this command as Administrator.');
    console.log(importResult.stderr || importResult.stdout);
    // Clean up temporary file
    await shell.exec('del C:\\Windows\\Temp\\roots.sst');
    return;
  }

  // Clean up the temporary file
  await shell.exec('del C:\\Windows\\Temp\\roots.sst');

  console.log('CA certificates updated successfully.');
  console.log('');
  console.log('Note: Windows Update automatically maintains root CA certificates.');
  console.log('This manual update ensures you have the latest certificates immediately.');
}

/**
 * Install CA certificates on Git Bash (Windows).
 *
 * Git for Windows includes its own CA certificate bundle that is used by Git
 * and the bundled cURL. This bundle is separate from both the Windows Certificate
 * Store and any WSL certificate stores.
 *
 * The CA certificate bundle is located at:
 * - C:\Program Files\Git\mingw64\etc\ssl\certs\ca-bundle.crt (Git commands)
 * - C:\Program Files\Git\mingw64\ssl\certs\ca-bundle.crt (cURL/OpenSSL)
 *
 * No separate installation is required. If the certificate bundle is missing or
 * needs to be updated, users can:
 * 1. Upgrade Git for Windows (which includes an updated certificate bundle)
 * 2. Configure Git to use the Windows SChannel backend instead
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  // Check if the CA bundle file exists (it should be bundled with Git Bash)
  const bundleCheckResult = await shell.exec('test -f /mingw64/etc/ssl/certs/ca-bundle.crt');

  if (bundleCheckResult.code === 0) {
    console.log('CA certificates are already installed (bundled with Git for Windows), skipping...');
    return;
  }

  // If the bundle is missing, provide guidance
  console.log('CA certificate bundle not found at expected location.');
  console.log('');
  console.log('Git for Windows includes its own CA certificate bundle. If it is missing:');
  console.log('');
  console.log('Option 1: Reinstall or upgrade Git for Windows');
  console.log('  Download from: https://git-scm.com/download/win');
  console.log('');
  console.log('Option 2: Configure Git to use Windows Certificate Store');
  console.log('  git config --global http.sslBackend schannel');
  console.log('');
  console.log('Option 3: Manually download the Mozilla CA bundle');
  console.log('  curl -o /mingw64/etc/ssl/certs/ca-bundle.crt https://curl.se/ca/cacert.pem');
}

// -----------------------------------------------------------------------------
// Eligibility Check
// -----------------------------------------------------------------------------

/**
 * Check if CA certificates are installed on the current platform.
 *
 * This function performs platform-specific checks to determine if CA certificates
 * are installed:
 * - macOS: Checks for ca-certificates Homebrew formula
 * - Linux (Debian-based): Checks for ca-certificates APT package and bundle file
 * - Linux (RHEL-based): Checks for ca-certificates RPM package and bundle file
 * - Windows/Git Bash: Checks for certificate store or bundle file
 *
 * @returns {Promise<boolean>} True if CA certificates are installed
 */
async function isInstalled() {
  const platform = os.detect();

  // macOS: Check for ca-certificates via Homebrew
  if (platform.type === 'macos') {
    return await brew.isFormulaInstalled('ca-certificates');
  }

  // Ubuntu/Debian/WSL/Raspberry Pi: Check for package and bundle file
  if (['ubuntu', 'debian', 'wsl', 'raspbian'].includes(platform.type)) {
    const packageInstalled = await isDebianCaCertsInstalled();
    const bundleExists = await doesDebianCertBundleExist();
    return packageInstalled && bundleExists;
  }

  // Amazon Linux/RHEL/Fedora: Check for RPM package and bundle file
  if (['amazon_linux', 'rhel', 'fedora'].includes(platform.type)) {
    const rpmResult = await shell.exec('rpm -q ca-certificates 2>/dev/null');
    const bundleExists = await doesRhelCertBundleExist();
    return rpmResult.code === 0 && bundleExists;
  }

  // Windows: Check if certificate store has certificates
  if (platform.type === 'windows') {
    const countResult = await shell.exec('powershell -Command "(Get-ChildItem Cert:\\LocalMachine\\Root).Count"');
    if (countResult.code === 0) {
      const certCount = parseInt(countResult.stdout.trim(), 10);
      return certCount > 100;
    }
    return false;
  }

  // Git Bash: Check if CA bundle file exists
  if (platform.type === 'gitbash') {
    const bundleCheckResult = await shell.exec('test -f /mingw64/etc/ssl/certs/ca-bundle.crt');
    return bundleCheckResult.code === 0;
  }

  return false;
}

/**
 * Check if this installer is supported on the current platform.
 *
 * CA certificates can be installed on all supported platforms:
 * - macOS (Homebrew ca-certificates formula)
 * - Ubuntu/Debian (ca-certificates package via APT)
 * - Ubuntu on WSL (ca-certificates package via APT)
 * - Raspberry Pi OS (ca-certificates package via APT)
 * - Amazon Linux/RHEL/Fedora (ca-certificates package via DNF/YUM)
 * - Windows (certutil for Windows Certificate Store)
 * - Git Bash (bundled with Git for Windows)
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel', 'windows', 'gitbash'].includes(platform.type);
}

// -----------------------------------------------------------------------------
// Main Installation Entry Point
// -----------------------------------------------------------------------------

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * This function detects the current operating system and dispatches to the
 * appropriate platform-specific installer function. CA certificates are
 * supported on all major platforms.
 *
 * Supported platforms:
 * - macOS (Homebrew ca-certificates formula)
 * - Ubuntu/Debian (ca-certificates package via APT)
 * - Ubuntu on WSL (ca-certificates package via APT)
 * - Raspberry Pi OS (ca-certificates package via APT)
 * - Amazon Linux/RHEL/Fedora (ca-certificates package via DNF/YUM)
 * - Windows (certutil for Windows Certificate Store)
 * - Git Bash (bundled with Git for Windows)
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
  if (!installer) {
    console.log(`CA certificates are not available for ${platform.type}.`);
    return;
  }

  // Run the platform-specific installer
  await installer();
}

// -----------------------------------------------------------------------------
// Module Exports
// -----------------------------------------------------------------------------

module.exports = {
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

// -----------------------------------------------------------------------------
// Direct Execution Handler
// -----------------------------------------------------------------------------

if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
