#!/usr/bin/env node

/**
 * @fileoverview Install Sublime Text.
 * @module installs/sublime-text
 *
 * Sublime Text is a sophisticated text editor for code, markup, and prose.
 * Known for its speed, elegant interface, and powerful features including
 * Goto Anything, multiple selections, and distraction-free mode.
 *
 * This installer provides:
 * - macOS: Sublime Text via Homebrew cask
 * - Ubuntu/Debian: Sublime Text from official APT repository
 * - Raspberry Pi OS: Sublime Text from official APT repository (64-bit only)
 * - Amazon Linux/RHEL: Sublime Text from official RPM repository
 * - Windows: Sublime Text via Chocolatey
 * - WSL: Sublime Text directly within WSL
 * - Git Bash: Sublime Text on Windows host via PowerShell
 *
 * IMPORTANT: Sublime Text 4 only supports 64-bit operating systems.
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const choco = require('../utils/windows/choco');

/**
 * Indicates whether this installer requires a desktop environment.
 * Sublime Text is a GUI text editor and requires a display.
 * @type {boolean}
 */
const REQUIRES_DESKTOP = true;

/**
 * The Homebrew cask name for Sublime Text on macOS.
 * @constant {string}
 */
const HOMEBREW_CASK_NAME = 'sublime-text';

/**
 * The Chocolatey package name for Sublime Text on Windows.
 * @constant {string}
 */
const CHOCO_PACKAGE_NAME = 'sublimetext4';

/**
 * The APT package name for Sublime Text on Debian-based systems.
 * @constant {string}
 */
const APT_PACKAGE_NAME = 'sublime-text';

/**
 * Check if Sublime Text CLI (subl) is available in PATH.
 *
 * This is a quick check that works across all platforms. The presence
 * of the subl command indicates Sublime Text is installed and accessible
 * from the command line.
 *
 * @returns {boolean} True if the subl command is available, false otherwise
 */
function isSublimeCommandAvailable() {
  return shell.commandExists('subl');
}

/**
 * Check if Sublime Text is installed and get the version.
 *
 * Executes 'subl --version' to verify Sublime Text is properly installed
 * and operational. Returns the version/build string if successful.
 *
 * @returns {Promise<string|null>} Sublime Text version string, or null if not installed
 */
async function getSublimeVersion() {
  if (!isSublimeCommandAvailable()) {
    return null;
  }

  const result = await shell.exec('subl --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "Sublime Text Build 4200"
    return result.stdout.trim();
  }
  return null;
}

/**
 * Set up Sublime Text's official APT repository on Debian-based systems.
 *
 * This function:
 * 1. Installs prerequisites (apt-transport-https, ca-certificates, curl, gnupg)
 * 2. Creates the keyrings directory if it doesn't exist
 * 3. Downloads and installs Sublime Text's GPG key
 * 4. Adds Sublime Text's APT repository to sources
 * 5. Updates the package cache
 *
 * @returns {Promise<void>}
 * @throws {Error} If any step fails
 */
async function setupSublimeAptRepository() {
  console.log('Setting up Sublime Text APT repository...');

  // Install prerequisites
  console.log('Installing prerequisites (apt-transport-https, ca-certificates, curl, gnupg)...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y apt-transport-https ca-certificates curl gnupg'
  );
  if (prereqResult.code !== 0) {
    throw new Error(`Failed to install prerequisites: ${prereqResult.stderr}`);
  }

  // Create keyrings directory if it doesn't exist
  console.log('Setting up GPG keyring...');
  const keyringDirResult = await shell.exec('sudo mkdir -p /etc/apt/keyrings');
  if (keyringDirResult.code !== 0) {
    throw new Error(`Failed to create keyring directory: ${keyringDirResult.stderr}`);
  }

  // Download and install Sublime Text's GPG key
  // Using the modern signed-by method with ASC key file
  const gpgResult = await shell.exec(
    'wget -qO - https://download.sublimetext.com/sublimehq-pub.gpg | sudo tee /etc/apt/keyrings/sublimehq-pub.asc > /dev/null'
  );
  if (gpgResult.code !== 0) {
    throw new Error(`Failed to add Sublime Text GPG key: ${gpgResult.stderr}`);
  }

  // Add the Sublime Text repository using the modern DEB822 format
  console.log('Adding Sublime Text repository...');
  // Use cat with heredoc to create the DEB822 sources file for better reliability
  const repoResult = await shell.exec(
    `cat <<'SUBLREPO' | sudo tee /etc/apt/sources.list.d/sublime-text.sources
Types: deb
URIs: https://download.sublimetext.com/
Suites: apt/stable/
Signed-By: /etc/apt/keyrings/sublimehq-pub.asc
SUBLREPO`
  );
  if (repoResult.code !== 0) {
    throw new Error(`Failed to add Sublime Text repository: ${repoResult.stderr}`);
  }

  // Update package cache
  console.log('Updating package cache...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package cache: ${updateResult.stderr}`);
  }
}

/**
 * Install Sublime Text via APT package manager.
 *
 * Installs the sublime-text package from the official Sublime Text repository.
 * The repository must be set up before calling this function.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function installSublimeApt() {
  console.log('Installing Sublime Text...');

  const result = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${APT_PACKAGE_NAME}`
  );

  if (result.code !== 0) {
    throw new Error(
      `Failed to install Sublime Text.\n` +
      `Output: ${result.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'sudo apt-get update' and retry\n` +
      `  2. Check if the Sublime Text repository was added correctly:\n` +
      `     cat /etc/apt/sources.list.d/sublime-text.sources\n` +
      `  3. Verify the GPG key exists: ls -la /etc/apt/keyrings/sublimehq-pub.asc`
    );
  }
}

/**
 * Install Sublime Text on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 * - Administrator privileges for Homebrew operations
 *
 * The installation uses the Homebrew cask 'sublime-text' which downloads
 * and installs Sublime Text to /Applications/Sublime Text.app.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Sublime Text is already installed...');

  // Check if Sublime Text is already installed via command line
  const existingVersion = await getSublimeVersion();
  if (existingVersion) {
    console.log(`${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Also check if the cask is installed (Sublime Text may be installed but subl not in PATH)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Sublime Text is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('NOTE: If the "subl" command is not working, create a symlink:');
    console.log('  sudo ln -sf "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl" /usr/local/bin/subl');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Sublime Text.'
    );
  }

  console.log('Installing Sublime Text via Homebrew...');

  // Install Sublime Text cask using --quiet to suppress non-essential output
  const result = await shell.exec('brew install --quiet --cask sublime-text');

  if (result.code !== 0) {
    throw new Error(
      `Failed to install Sublime Text via Homebrew.\n` +
      `Output: ${result.stderr || result.stdout}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. If you see permission errors, run:\n` +
      `     sudo chown -R $(whoami) /usr/local/Caskroom\n` +
      `  3. On Apple Silicon, if the app is "damaged", run:\n` +
      `     xattr -cr "/Applications/Sublime Text.app"`
    );
  }

  console.log('Sublime Text installed successfully.');
  console.log('');
  console.log('You can launch Sublime Text from Applications or via command line:');
  console.log('  open -a "Sublime Text"');
  console.log('');
  console.log('If the "subl" command is not available, create a symlink:');
  console.log('  sudo ln -sf "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl" /usr/local/bin/subl');
}

/**
 * Install Sublime Text on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 18.04+ or Debian 10+ (64-bit)
 * - sudo privileges
 * - wget installed (for GPG key download)
 *
 * This function installs Sublime Text from the official Sublime Text
 * APT repository. It first sets up the repository and GPG key, then
 * installs the package.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu() {
  console.log('Checking if Sublime Text is already installed...');

  // Check if Sublime Text is already installed
  const existingVersion = await getSublimeVersion();
  if (existingVersion) {
    console.log(`${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Set up Sublime Text's APT repository
  await setupSublimeAptRepository();

  // Install Sublime Text
  await installSublimeApt();

  // Verify installation
  const version = await getSublimeVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but Sublime Text was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: subl --version'
    );
  }

  console.log(`${version} installed successfully.`);
  console.log('');
  console.log('You can launch Sublime Text via:');
  console.log('  subl');
}

/**
 * Install Sublime Text on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 *
 * NOTE: GUI applications in WSL require WSLg (Windows 11) or an X server
 * (Windows 10). Without a display server, Sublime Text cannot launch
 * its graphical interface.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Installing Sublime Text directly within WSL...');
  console.log('');

  // Check if Sublime Text is already installed
  const existingVersion = await getSublimeVersion();
  if (existingVersion) {
    console.log(`${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Set up Sublime Text's APT repository
  await setupSublimeAptRepository();

  // Install Sublime Text
  await installSublimeApt();

  // Verify installation
  const version = await getSublimeVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but Sublime Text was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: subl --version'
    );
  }

  console.log(`${version} installed successfully.`);
  console.log('');
  console.log('IMPORTANT for WSL users:');
  console.log('');
  console.log('1. GUI applications require WSLg (Windows 11) or an X server (Windows 10).');
  console.log('');
  console.log('2. On Windows 11 with WSLg, simply run:');
  console.log('   subl');
  console.log('');
  console.log('3. On Windows 10, you need an X server like VcXsrv:');
  console.log('   - Install VcXsrv and launch XLaunch');
  console.log('   - Set DISPLAY variable: export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk "{print \\$2}"):0');
  console.log('   - Then run: subl');
  console.log('');
  console.log('4. If you see scaling issues, try:');
  console.log('   export GDK_SCALE=2');
  console.log('   export GDK_DPI_SCALE=0.5');
}

/**
 * Install Sublime Text on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit) - Bookworm or Bullseye
 * - Raspberry Pi 3B+ or later (64-bit capable hardware)
 * - sudo privileges
 *
 * IMPORTANT: Sublime Text 4 requires a 64-bit operating system.
 * It does not support 32-bit Raspberry Pi OS (armv7l architecture).
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails or system is 32-bit
 */
async function install_raspbian() {
  console.log('Checking if Sublime Text is already installed...');

  // Check if Sublime Text is already installed
  const existingVersion = await getSublimeVersion();
  if (existingVersion) {
    console.log(`${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check architecture - Sublime Text 4 requires 64-bit
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();

  if (arch === 'armv7l') {
    console.log('Sublime Text is not available for 32-bit Raspberry Pi OS.');
    console.log('');
    console.log('Sublime Text 4 requires a 64-bit operating system.');
    console.log('Your current architecture: ' + arch + ' (32-bit)');
    console.log('');
    console.log('To use Sublime Text on Raspberry Pi:');
    console.log('  1. Download 64-bit Raspberry Pi OS from raspberrypi.com');
    console.log('  2. Flash it to a new SD card');
    console.log('  3. Retry this installation');
    return;
  }

  console.log(`Detected 64-bit architecture: ${arch}`);

  // Set up Sublime Text's APT repository
  await setupSublimeAptRepository();

  // Install Sublime Text
  await installSublimeApt();

  // Verify installation
  const version = await getSublimeVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but Sublime Text was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: subl --version'
    );
  }

  console.log(`${version} installed successfully.`);
  console.log('');
  console.log('You can launch Sublime Text from the Programming menu or via:');
  console.log('  subl');
  console.log('');
  console.log('NOTE: If Sublime Text runs slowly, consider:');
  console.log('  - Adding swap space if memory is limited');
  console.log('  - Disabling hardware acceleration in preferences:');
  console.log('    { "hardware_acceleration": "none" }');
}

/**
 * Install Sublime Text on Amazon Linux/RHEL using DNF or YUM.
 *
 * Prerequisites:
 * - Amazon Linux 2023, Amazon Linux 2, RHEL 8+, CentOS 8+, or Fedora (64-bit)
 * - sudo privileges
 *
 * IMPORTANT: Sublime Text does not provide ARM64 RPM packages.
 * This installation method only works on x86_64 systems.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('Checking if Sublime Text is already installed...');

  // Check if Sublime Text is already installed
  const existingVersion = await getSublimeVersion();
  if (existingVersion) {
    console.log(`${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check architecture - Sublime Text only provides x86_64 RPMs
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();

  if (arch !== 'x86_64') {
    console.log(`Sublime Text is not available for ${arch} architecture on Amazon Linux/RHEL.`);
    console.log('');
    console.log('Sublime Text only provides x86_64 RPM packages.');
    return;
  }

  // Detect package manager (dnf for AL2023/Fedora, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    throw new Error(
      'Neither dnf nor yum package manager found.\n' +
      'This installer supports Amazon Linux 2023 (dnf), Amazon Linux 2 (yum), RHEL, and Fedora.'
    );
  }

  console.log(`Detected package manager: ${packageManager}`);

  // Import Sublime Text GPG key
  console.log('Importing Sublime Text GPG key...');
  const gpgResult = await shell.exec(
    'sudo rpm -v --import https://download.sublimetext.com/sublimehq-rpm-pub.gpg'
  );
  if (gpgResult.code !== 0) {
    throw new Error(`Failed to import GPG key: ${gpgResult.stderr}`);
  }

  // Add Sublime Text repository
  console.log('Adding Sublime Text repository...');
  let repoResult;

  if (hasDnf) {
    // Check for dnf5 (Fedora 41+) which uses different syntax
    const dnf5Check = await shell.exec('dnf --version 2>/dev/null | head -1');
    const isDnf5 = dnf5Check.stdout && dnf5Check.stdout.includes('dnf5');

    if (isDnf5) {
      // dnf5 syntax for Fedora 41+
      repoResult = await shell.exec(
        'sudo dnf config-manager addrepo --from-repofile=https://download.sublimetext.com/rpm/stable/x86_64/sublime-text.repo'
      );
    } else {
      // Standard dnf syntax
      repoResult = await shell.exec(
        'sudo dnf config-manager --add-repo https://download.sublimetext.com/rpm/stable/x86_64/sublime-text.repo'
      );
    }
  } else {
    // Ensure yum-config-manager is available
    const hasConfigManager = shell.commandExists('yum-config-manager');
    if (!hasConfigManager) {
      console.log('Installing yum-utils for repository management...');
      const yumUtilsResult = await shell.exec('sudo yum install -y yum-utils');
      if (yumUtilsResult.code !== 0) {
        throw new Error('Failed to install yum-utils: ' + yumUtilsResult.stderr);
      }
    }

    repoResult = await shell.exec(
      'sudo yum-config-manager --add-repo https://download.sublimetext.com/rpm/stable/x86_64/sublime-text.repo'
    );
  }

  if (repoResult.code !== 0) {
    throw new Error(`Failed to add Sublime Text repository: ${repoResult.stderr}`);
  }

  // Install Sublime Text
  console.log('Installing Sublime Text...');
  const installResult = await shell.exec(`sudo ${packageManager} install -y sublime-text`);

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Sublime Text.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'sudo ${packageManager} clean all' and retry\n` +
      `  2. Verify the GPG key was imported:\n` +
      `     rpm -qa gpg-pubkey* | xargs rpm -qi | grep -i sublime`
    );
  }

  // Verify installation
  const version = await getSublimeVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but Sublime Text was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: subl --version'
    );
  }

  console.log(`${version} installed successfully.`);
  console.log('');
  console.log('You can launch Sublime Text via:');
  console.log('  subl');
}

/**
 * Install Sublime Text on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Administrator PowerShell or Command Prompt
 * - Chocolatey package manager installed
 *
 * The installation uses Chocolatey package 'sublimetext4'.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Sublime Text is already installed...');

  // Check if Sublime Text is already installed
  const existingVersion = await getSublimeVersion();
  if (existingVersion) {
    console.log(`${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if the Chocolatey package is installed
  const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (packageInstalled) {
    console.log('Sublime Text is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('NOTE: If the "subl" command is not working, add Sublime Text to your PATH:');
    console.log('  C:\\Program Files\\Sublime Text');
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
      'Then retry installing Sublime Text.'
    );
  }

  console.log('Installing Sublime Text via Chocolatey...');

  // Install Sublime Text using the -y flag for non-interactive installation
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Sublime Text via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Try manual installation: choco install sublimetext4 -y --force`
    );
  }

  console.log('Sublime Text installed successfully.');
  console.log('');
  console.log('You may need to open a new terminal window for the "subl" command to work.');
  console.log('');
  console.log('If "subl" is not recognized, add Sublime Text to your PATH:');
  console.log('  C:\\Program Files\\Sublime Text');
  console.log('');
  console.log('Or via PowerShell:');
  console.log('  $sublPath = "C:\\Program Files\\Sublime Text"');
  console.log('  [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$sublPath", [EnvironmentVariableTarget]::User)');
}

/**
 * Install Sublime Text from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Sublime Text
 * on the Windows host using Chocolatey via PowerShell interop.
 *
 * Prerequisites:
 * - Windows 10 or Windows 11 (64-bit)
 * - Git Bash installed (comes with Git for Windows)
 * - Chocolatey package manager installed on Windows
 * - Administrator privileges
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('Installing Sublime Text on the Windows host...');
  console.log('');

  // Check if Sublime Text is already available
  const existingVersion = await getSublimeVersion();
  if (existingVersion) {
    console.log(`${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Install via PowerShell using Chocolatey
  console.log('Installing Sublime Text via Chocolatey...');

  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install sublimetext4 -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Sublime Text.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell:\n` +
      `     choco install sublimetext4 -y`
    );
  }

  console.log('Sublime Text installed successfully.');
  console.log('');
  console.log('If "subl" is not available in Git Bash, add an alias to ~/.bashrc:');
  console.log('  echo \'alias subl="/c/Program\\ Files/Sublime\\ Text/subl.exe"\' >> ~/.bashrc');
  console.log('  source ~/.bashrc');
  console.log('');
  console.log('To prevent Git Bash from hanging when opening files:');
  console.log('  subl myfile.txt &');
}

/**
 * Check if Sublime Text is installed on the current platform.
 *
 * This function performs platform-specific checks to determine if Sublime Text
 * is already installed on the system by checking for the 'subl' command.
 *
 * @returns {Promise<boolean>} True if Sublime Text is installed, false otherwise
 */
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
    if (caskInstalled) return true;
  }

  if (platform.type === 'windows' || platform.type === 'gitbash') {
    return choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  }

  // For all platforms, check if subl command is available
  return isSublimeCommandAvailable();
}

/**
 * Check if this installer is supported on the current platform.
 * Sublime Text is available on all major platforms.
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();

  // First check if the platform is supported
  const supportedPlatforms = ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'];
  if (!supportedPlatforms.includes(platform.type)) {
    return false;
  }

  // This installer requires a desktop environment
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
 * - macOS: Sublime Text via Homebrew cask
 * - Ubuntu/Debian: Sublime Text from official APT repository
 * - Raspberry Pi OS: Sublime Text from official APT repository (64-bit only)
 * - Amazon Linux/RHEL: Sublime Text from official RPM repository
 * - Windows: Sublime Text via Chocolatey
 * - WSL (Ubuntu): Sublime Text within WSL
 * - Git Bash: Sublime Text on Windows host
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases (e.g., debian maps to ubuntu for APT-based installs)
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
    console.log(`Sublime Text is not available for ${platform.type}.`);
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

// Allow direct execution: node sublime-text.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
