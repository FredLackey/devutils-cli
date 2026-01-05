#!/usr/bin/env node

/**
 * @fileoverview Install Docker.
 * @module installs/docker
 *
 * Docker is a containerization platform that enables developers to package
 * applications and their dependencies into standardized units called containers.
 *
 * This installer provides:
 * - Docker Desktop for desktop platforms (macOS, Windows)
 * - Docker Engine for server platforms (Ubuntu, Raspberry Pi OS, Amazon Linux)
 *
 * IMPORTANT PLATFORM NOTES:
 * - macOS: Installs Docker Desktop via Homebrew cask
 * - Windows: Installs Docker Desktop via Chocolatey
 * - Ubuntu/Debian: Installs Docker Engine from Docker's official APT repository
 * - Raspberry Pi OS: Installs Docker Engine from Docker's Debian repository
 * - Amazon Linux: Installs Docker from Amazon's repository
 * - WSL: Installs Docker Engine directly within WSL
 * - Git Bash: Installs Docker Desktop on Windows host via PowerShell
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const systemd = require('../utils/ubuntu/systemd');
const choco = require('../utils/windows/choco');

/**
 * The Homebrew cask name for Docker Desktop on macOS.
 */
const HOMEBREW_CASK_NAME = 'docker';

/**
 * The Chocolatey package name for Docker Desktop on Windows.
 */
const CHOCO_PACKAGE_NAME = 'docker-desktop';

/**
 * Docker packages to install on Debian-based systems.
 * These are the official Docker Engine packages from Docker's repository.
 */
const DOCKER_APT_PACKAGES = [
  'docker-ce',
  'docker-ce-cli',
  'containerd.io',
  'docker-buildx-plugin',
  'docker-compose-plugin'
];

/**
 * Conflicting packages that should be removed before installing Docker.
 * These are third-party or outdated Docker packages that may cause conflicts.
 */
const CONFLICTING_PACKAGES = [
  'docker.io',
  'docker-doc',
  'docker-compose',
  'podman-docker',
  'containerd',
  'runc'
];

/**
 * Check if Docker CLI is installed by verifying the 'docker' command exists.
 *
 * This is a quick check that works across all platforms. Note that the presence
 * of the docker command does not guarantee the Docker daemon is running.
 *
 * @returns {boolean} True if the docker command is available, false otherwise
 */
function isDockerCommandAvailable() {
  return shell.commandExists('docker');
}

/**
 * Check if Docker is installed and get the version.
 *
 * Executes 'docker --version' to verify Docker is properly installed
 * and operational. Returns the version string if successful.
 *
 * @returns {Promise<string|null>} Docker version string, or null if not installed
 */
async function getDockerVersion() {
  if (!isDockerCommandAvailable()) {
    return null;
  }

  const result = await shell.exec('docker --version');
  if (result.code === 0 && result.stdout) {
    // Output format: "Docker version 27.4.1, build b9d17ea"
    const match = result.stdout.match(/Docker version ([\d.]+)/);
    return match ? match[1] : result.stdout.trim();
  }
  return null;
}

/**
 * Remove conflicting Docker packages on Debian-based systems.
 *
 * Before installing Docker from the official repository, we need to remove
 * any third-party or outdated Docker packages that may conflict.
 * This function silently removes packages that exist and ignores errors
 * for packages that are not installed.
 *
 * @returns {Promise<void>}
 */
async function removeConflictingPackages() {
  console.log('Removing any conflicting Docker packages...');

  for (const pkg of CONFLICTING_PACKAGES) {
    // Use DEBIAN_FRONTEND=noninteractive and ignore errors (package may not exist)
    await shell.exec(
      `sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y ${pkg} 2>/dev/null || true`
    );
  }
}

/**
 * Set up Docker's official APT repository on Ubuntu.
 *
 * This function:
 * 1. Installs prerequisites (ca-certificates, curl)
 * 2. Downloads and installs Docker's GPG key
 * 3. Adds Docker's APT repository to sources
 * 4. Updates the package cache
 *
 * @returns {Promise<void>}
 * @throws {Error} If any step fails
 */
async function setupDockerAptRepositoryUbuntu() {
  console.log('Setting up Docker APT repository...');

  // Install prerequisites
  console.log('Installing prerequisites (ca-certificates, curl)...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl'
  );
  if (prereqResult.code !== 0) {
    throw new Error(`Failed to install prerequisites: ${prereqResult.stderr}`);
  }

  // Create keyrings directory
  console.log('Setting up GPG keyring...');
  const keyringResult = await shell.exec('sudo install -m 0755 -d /etc/apt/keyrings');
  if (keyringResult.code !== 0) {
    throw new Error(`Failed to create keyring directory: ${keyringResult.stderr}`);
  }

  // Download and install Docker's GPG key
  const gpgResult = await shell.exec(
    'sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && ' +
    'sudo chmod a+r /etc/apt/keyrings/docker.asc'
  );
  if (gpgResult.code !== 0) {
    throw new Error(`Failed to add Docker GPG key: ${gpgResult.stderr}`);
  }

  // Add the Docker repository
  // Using shell command to properly expand variables
  console.log('Adding Docker repository...');
  const repoResult = await shell.exec(
    'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] ' +
    'https://download.docker.com/linux/ubuntu ' +
    '$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | ' +
    'sudo tee /etc/apt/sources.list.d/docker.list > /dev/null'
  );
  if (repoResult.code !== 0) {
    throw new Error(`Failed to add Docker repository: ${repoResult.stderr}`);
  }

  // Update package cache
  console.log('Updating package cache...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package cache: ${updateResult.stderr}`);
  }
}

/**
 * Set up Docker's official APT repository on Debian (including Raspberry Pi OS).
 *
 * Similar to Ubuntu setup but uses the Debian repository URL.
 * Raspberry Pi OS is based on Debian, so it uses the same repository.
 *
 * @param {boolean} [isRaspbian=false] - Whether this is Raspberry Pi OS (for 32-bit support)
 * @returns {Promise<void>}
 * @throws {Error} If any step fails
 */
async function setupDockerAptRepositoryDebian(isRaspbian = false) {
  console.log('Setting up Docker APT repository...');

  // Install prerequisites
  console.log('Installing prerequisites (ca-certificates, curl)...');
  const prereqResult = await shell.exec(
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && ' +
    'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl'
  );
  if (prereqResult.code !== 0) {
    throw new Error(`Failed to install prerequisites: ${prereqResult.stderr}`);
  }

  // Create keyrings directory
  console.log('Setting up GPG keyring...');
  const keyringResult = await shell.exec('sudo install -m 0755 -d /etc/apt/keyrings');
  if (keyringResult.code !== 0) {
    throw new Error(`Failed to create keyring directory: ${keyringResult.stderr}`);
  }

  // Determine which repository to use based on architecture and OS
  // For 32-bit Raspberry Pi OS, use raspbian repository; otherwise use debian
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  const useRaspbianRepo = isRaspbian && arch === 'armv7l';
  const repoDistro = useRaspbianRepo ? 'raspbian' : 'debian';

  console.log(`Using Docker ${repoDistro} repository (architecture: ${arch})...`);

  // Download and install Docker's GPG key
  const gpgResult = await shell.exec(
    `sudo curl -fsSL https://download.docker.com/linux/${repoDistro}/gpg -o /etc/apt/keyrings/docker.asc && ` +
    'sudo chmod a+r /etc/apt/keyrings/docker.asc'
  );
  if (gpgResult.code !== 0) {
    throw new Error(`Failed to add Docker GPG key: ${gpgResult.stderr}`);
  }

  // Add the Docker repository
  console.log('Adding Docker repository...');
  const repoResult = await shell.exec(
    `echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] ` +
    `https://download.docker.com/linux/${repoDistro} ` +
    '$(. /etc/os-release && echo "$VERSION_CODENAME") stable" | ' +
    'sudo tee /etc/apt/sources.list.d/docker.list > /dev/null'
  );
  if (repoResult.code !== 0) {
    throw new Error(`Failed to add Docker repository: ${repoResult.stderr}`);
  }

  // Update package cache
  console.log('Updating package cache...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    throw new Error(`Failed to update package cache: ${updateResult.stderr}`);
  }
}

/**
 * Install Docker Engine packages via APT.
 *
 * Installs the official Docker Engine packages:
 * - docker-ce: Docker Engine
 * - docker-ce-cli: Docker CLI
 * - containerd.io: Container runtime
 * - docker-buildx-plugin: BuildKit plugin
 * - docker-compose-plugin: Compose v2 plugin
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function installDockerEngineApt() {
  console.log('Installing Docker Engine packages...');

  const packages = DOCKER_APT_PACKAGES.join(' ');
  const result = await shell.exec(
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${packages}`
  );

  if (result.code !== 0) {
    throw new Error(
      `Failed to install Docker Engine packages.\n` +
      `Output: ${result.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'sudo apt-get update' and retry\n` +
      `  2. Check if the Docker repository was added correctly:\n` +
      `     cat /etc/apt/sources.list.d/docker.list\n` +
      `  3. Verify the GPG key exists: ls -la /etc/apt/keyrings/docker.asc`
    );
  }
}

/**
 * Configure Docker to start on boot and add user to docker group.
 *
 * This function:
 * 1. Enables the docker and containerd systemd services
 * 2. Adds the current user to the 'docker' group for rootless operation
 *
 * NOTE: The user must log out and back in for group membership to take effect.
 *
 * @returns {Promise<void>}
 * @throws {Error} If configuration fails
 */
async function configureDockerLinux() {
  console.log('Configuring Docker to start on boot...');

  // Enable docker service
  const dockerEnableResult = await systemd.enableService('docker.service');
  if (!dockerEnableResult.success) {
    console.log('Warning: Could not enable docker.service. You may need to start it manually.');
  }

  // Enable containerd service
  const containerdEnableResult = await systemd.enableService('containerd.service');
  if (!containerdEnableResult.success) {
    console.log('Warning: Could not enable containerd.service. You may need to start it manually.');
  }

  // Add user to docker group for rootless operation
  console.log('Adding current user to docker group...');
  const currentUser = process.env.USER || process.env.USERNAME;
  if (currentUser) {
    const groupResult = await shell.exec(`sudo usermod -aG docker ${currentUser}`);
    if (groupResult.code !== 0) {
      console.log(`Warning: Could not add user to docker group: ${groupResult.stderr}`);
      console.log('You may need to run: sudo usermod -aG docker $USER');
    }
  }
}

/**
 * Install Docker Desktop on macOS using Homebrew.
 *
 * Prerequisites:
 * - macOS 14 (Sonoma) or later recommended
 * - Homebrew package manager installed
 * - At least 4 GB RAM
 * - Apple Silicon (M1/M2/M3/M4) or Intel processor
 *
 * The installation uses the Homebrew cask 'docker' which downloads and installs
 * Docker Desktop to /Applications/Docker.app.
 *
 * NOTE: After installation, Docker Desktop must be launched manually.
 * The first launch will prompt for administrator password to install
 * privileged helper components.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Homebrew is not installed or installation fails
 */
async function install_macos() {
  console.log('Checking if Docker is already installed...');

  // Check if Docker is already installed
  const existingVersion = await getDockerVersion();
  if (existingVersion) {
    console.log(`Docker ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Also check if the cask is installed (Docker Desktop may be installed but not running)
  const caskInstalled = await brew.isCaskInstalled(HOMEBREW_CASK_NAME);
  if (caskInstalled) {
    console.log('Docker Desktop is already installed via Homebrew, skipping installation.');
    console.log('');
    console.log('NOTE: If Docker commands are not working, ensure Docker Desktop is running.');
    console.log('You can start it from Applications or run: open -a Docker');
    return;
  }

  // Verify Homebrew is available
  if (!brew.isInstalled()) {
    throw new Error(
      'Homebrew is not installed. Please install Homebrew first using:\n' +
      '  dev install homebrew\n' +
      'Then retry installing Docker.'
    );
  }

  console.log('Installing Docker Desktop via Homebrew...');

  // Install Docker Desktop cask
  const result = await brew.installCask(HOMEBREW_CASK_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Docker Desktop via Homebrew.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Run 'brew update && brew cleanup' and retry\n` +
      `  2. If on Apple Silicon, ensure you have Rosetta 2: softwareupdate --install-rosetta\n` +
      `  3. Try manual installation: brew reinstall --cask docker`
    );
  }

  console.log('Docker Desktop installed successfully.');
  console.log('');
  console.log('IMPORTANT: To complete setup:');
  console.log('  1. Launch Docker Desktop from Applications or run: open -a Docker');
  console.log('  2. On first launch, you will be prompted to provide your password');
  console.log('     to install privileged helper components.');
  console.log('  3. Wait for Docker Desktop to fully initialize (whale icon in menu bar).');
  console.log('  4. Run "docker run hello-world" to verify the installation.');
}

/**
 * Install Docker Engine on Ubuntu/Debian using APT.
 *
 * Prerequisites:
 * - Ubuntu 22.04 (Jammy) or later, or Debian 11 (Bullseye) or later
 * - sudo privileges
 * - At least 4 GB RAM recommended
 *
 * This function installs Docker Engine (not Docker Desktop) from Docker's
 * official APT repository. This is the recommended approach for servers
 * and development environments on Linux.
 *
 * IMPORTANT: Do not use 'apt install docker.io' or 'snap install docker'.
 * These packages are maintained by third parties and may be outdated.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu() {
  console.log('Checking if Docker is already installed...');

  // Check if Docker is already installed
  const existingVersion = await getDockerVersion();
  if (existingVersion) {
    console.log(`Docker ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Remove conflicting packages
  await removeConflictingPackages();

  // Set up Docker's APT repository
  await setupDockerAptRepositoryUbuntu();

  // Install Docker Engine
  await installDockerEngineApt();

  // Configure Docker (enable services, add user to group)
  await configureDockerLinux();

  // Verify installation
  const version = await getDockerVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but Docker was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: sudo systemctl start docker\n' +
      '  3. Run: docker --version'
    );
  }

  console.log(`Docker Engine ${version} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To run Docker without sudo:');
  console.log('  1. Log out and log back in for group membership to take effect');
  console.log('     OR run: newgrp docker');
  console.log('  2. Then verify with: docker run hello-world');
}

/**
 * Install Docker Engine on Raspberry Pi OS using APT.
 *
 * Prerequisites:
 * - Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
 * - Raspberry Pi 3B+ or later (64-bit capable hardware)
 * - At least 2 GB RAM (4 GB recommended)
 * - sudo privileges
 *
 * IMPORTANT DEPRECATION NOTICE: Docker Engine v28 will be the last major
 * version to support Raspberry Pi OS 32-bit (armhf). For long-term support,
 * use 64-bit Raspberry Pi OS.
 *
 * This function automatically detects the architecture (aarch64 vs armv7l)
 * and uses the appropriate Docker repository (debian for 64-bit, raspbian for 32-bit).
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_raspbian() {
  console.log('Checking if Docker is already installed...');

  // Check if Docker is already installed
  const existingVersion = await getDockerVersion();
  if (existingVersion) {
    console.log(`Docker ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check and warn about architecture
  const archResult = await shell.exec('uname -m');
  const arch = archResult.stdout.trim();
  if (arch === 'armv7l') {
    console.log('');
    console.log('WARNING: You are running 32-bit Raspberry Pi OS.');
    console.log('Docker Engine v28 will be the last version to support 32-bit (armhf).');
    console.log('For long-term support, consider upgrading to 64-bit Raspberry Pi OS.');
    console.log('');
  }

  // Remove conflicting packages
  await removeConflictingPackages();

  // Set up Docker's APT repository (using Debian repository for Raspberry Pi OS)
  // Pass true to indicate this is Raspbian, which affects 32-bit repository selection
  await setupDockerAptRepositoryDebian(true);

  // Install Docker Engine
  await installDockerEngineApt();

  // Configure Docker (enable services, add user to group)
  await configureDockerLinux();

  // Verify installation
  const version = await getDockerVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but Docker was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: sudo systemctl start docker\n' +
      '  3. Run: docker --version\n\n' +
      'If you see cgroup errors, add these to /boot/cmdline.txt and reboot:\n' +
      '  cgroup_memory=1 cgroup_enable=memory'
    );
  }

  console.log(`Docker Engine ${version} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To run Docker without sudo:');
  console.log('  1. Log out and log back in for group membership to take effect');
  console.log('     OR run: newgrp docker');
  console.log('  2. Then verify with: docker run hello-world');
  console.log('');
  console.log('NOTE: Not all Docker images support ARM architecture.');
  console.log('Use images with arm64 or arm/v7 tags, or multi-architecture images.');
}

/**
 * Install Docker on Amazon Linux using DNF/YUM.
 *
 * Prerequisites:
 * - Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
 * - sudo privileges
 * - EC2 instance or compatible environment
 *
 * Amazon Linux 2023 uses DNF, while Amazon Linux 2 uses YUM.
 * This function detects which is available and uses the appropriate commands.
 *
 * NOTE: Amazon's repository may have a slightly older Docker version than
 * Docker's official repository. This is intentional for stability.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_amazon_linux() {
  console.log('Checking if Docker is already installed...');

  // Check if Docker is already installed
  const existingVersion = await getDockerVersion();
  if (existingVersion) {
    console.log(`Docker ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Detect package manager (dnf for AL2023, yum for AL2)
  const hasDnf = shell.commandExists('dnf');
  const hasYum = shell.commandExists('yum');
  const packageManager = hasDnf ? 'dnf' : (hasYum ? 'yum' : null);

  if (!packageManager) {
    throw new Error(
      'Neither dnf nor yum package manager found.\n' +
      'This installer supports Amazon Linux 2023 (dnf) and Amazon Linux 2 (yum).'
    );
  }

  console.log(`Detected package manager: ${packageManager}`);

  // Update system packages
  console.log('Updating system packages...');
  const updateResult = await shell.exec(`sudo ${packageManager} update -y`);
  if (updateResult.code !== 0) {
    console.log('Warning: System update had issues, continuing with installation...');
  }

  // Install Docker
  // For Amazon Linux 2023, docker is directly available
  // For Amazon Linux 2, we need to use amazon-linux-extras
  console.log('Installing Docker...');

  let installResult;
  if (hasDnf) {
    // Amazon Linux 2023
    installResult = await shell.exec('sudo dnf install -y docker');
  } else {
    // Amazon Linux 2 - try amazon-linux-extras first
    const hasExtras = shell.commandExists('amazon-linux-extras');
    if (hasExtras) {
      installResult = await shell.exec('sudo amazon-linux-extras install -y docker');
    } else {
      installResult = await shell.exec('sudo yum install -y docker');
    }
  }

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Docker.\n` +
      `Output: ${installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. For Amazon Linux 2023: sudo dnf install docker\n` +
      `  2. For Amazon Linux 2: sudo amazon-linux-extras install docker\n` +
      `  3. Check your network connectivity and repository access`
    );
  }

  // Start and enable Docker service
  console.log('Starting Docker service...');
  const startResult = await shell.exec('sudo systemctl start docker');
  if (startResult.code !== 0) {
    console.log('Warning: Could not start Docker service automatically.');
  }

  console.log('Enabling Docker to start on boot...');
  const enableResult = await shell.exec('sudo systemctl enable docker');
  if (enableResult.code !== 0) {
    console.log('Warning: Could not enable Docker service.');
  }

  // Add user to docker group
  console.log('Adding current user to docker group...');
  const currentUser = process.env.USER || process.env.USERNAME;
  if (currentUser) {
    const groupResult = await shell.exec(`sudo usermod -aG docker ${currentUser}`);
    if (groupResult.code !== 0) {
      console.log('Warning: Could not add user to docker group.');
    }
  }

  // Install Docker Compose plugin (for AL2023)
  if (hasDnf) {
    console.log('Installing Docker Compose plugin...');
    const composeResult = await shell.exec('sudo dnf install -y docker-compose-plugin');
    if (composeResult.code !== 0) {
      console.log('Warning: Could not install docker-compose-plugin. You can install it manually later.');
    }
  }

  // Verify installation
  const version = await getDockerVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but Docker was not found.\n\n' +
      'Please try:\n' +
      '  1. Restart your terminal session\n' +
      '  2. Run: sudo systemctl start docker\n' +
      '  3. Run: docker --version'
    );
  }

  console.log(`Docker ${version} installed successfully.`);
  console.log('');
  console.log('IMPORTANT: To run Docker without sudo:');
  console.log('  1. Log out and log back in for group membership to take effect');
  console.log('     OR run: newgrp docker');
  console.log('  2. Then verify with: docker run hello-world');
  console.log('');
  console.log('NOTE: Amazon Linux Docker packages may be slightly older than');
  console.log('Docker\'s official releases. This is intentional for stability.');
}

/**
 * Install Docker Desktop on Windows using Chocolatey.
 *
 * Prerequisites:
 * - Windows 10 version 21H2 or higher (64-bit), or Windows 11
 * - BIOS-level virtualization enabled (Intel VT-x or AMD-V)
 * - WSL 2 backend (recommended) or Hyper-V enabled
 * - At least 4 GB RAM
 * - Administrator privileges
 * - Chocolatey package manager installed
 *
 * NOTE: A system restart may be required after installation.
 * After restart, Docker Desktop will need to be launched manually.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Chocolatey is not installed or installation fails
 */
async function install_windows() {
  console.log('Checking if Docker is already installed...');

  // Check if Docker is already installed
  const existingVersion = await getDockerVersion();
  if (existingVersion) {
    console.log(`Docker ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Check if Docker Desktop package is installed via Chocolatey
  const packageInstalled = await choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  if (packageInstalled) {
    console.log('Docker Desktop is already installed via Chocolatey, skipping installation.');
    console.log('');
    console.log('NOTE: If Docker commands are not working, ensure Docker Desktop is running.');
    console.log('Launch Docker Desktop from the Start Menu and wait for initialization.');
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
      'Then retry installing Docker.'
    );
  }

  console.log('Installing Docker Desktop via Chocolatey...');
  console.log('This may take several minutes...');

  // Install Docker Desktop
  const result = await choco.install(CHOCO_PACKAGE_NAME);

  if (!result.success) {
    throw new Error(
      `Failed to install Docker Desktop via Chocolatey.\n` +
      `Output: ${result.output}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure you are running as Administrator\n` +
      `  2. Check if WSL 2 is installed: wsl --status\n` +
      `  3. Enable virtualization in BIOS/UEFI settings\n` +
      `  4. Try manual installation: choco install docker-desktop -y --force`
    );
  }

  console.log('Docker Desktop installed successfully.');
  console.log('');
  console.log('IMPORTANT: A system restart may be required.');
  console.log('');
  console.log('After restart:');
  console.log('  1. Launch Docker Desktop from the Start Menu');
  console.log('  2. Wait for Docker Desktop to fully initialize');
  console.log('     (look for the whale icon in the system tray)');
  console.log('  3. Run "docker run hello-world" to verify the installation');
  console.log('');
  console.log('If you see "WSL 2 installation is incomplete" error:');
  console.log('  Run: wsl --install');
  console.log('  Then restart and retry.');
}

/**
 * Install Docker Engine on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * Prerequisites:
 * - Windows 10 version 2004 or higher, or Windows 11
 * - WSL 2 enabled with Ubuntu distribution installed
 * - sudo privileges within WSL
 *
 * This function installs Docker Engine directly within WSL rather than
 * relying on Docker Desktop's WSL integration. This is useful for users
 * who prefer not to use Docker Desktop or need Docker only within WSL.
 *
 * NOTE: WSL does not use systemd by default, so Docker must be started
 * manually with 'sudo service docker start'.
 *
 * @returns {Promise<void>}
 * @throws {Error} If installation fails
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');
  console.log('Installing Docker Engine directly within WSL...');
  console.log('');

  // Check if Docker is already installed
  const existingVersion = await getDockerVersion();
  if (existingVersion) {
    console.log(`Docker ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Remove conflicting packages
  await removeConflictingPackages();

  // Set up Docker's APT repository
  await setupDockerAptRepositoryUbuntu();

  // Install Docker Engine
  await installDockerEngineApt();

  // Add user to docker group
  console.log('Adding current user to docker group...');
  const currentUser = process.env.USER || process.env.USERNAME;
  if (currentUser) {
    const groupResult = await shell.exec(`sudo usermod -aG docker ${currentUser}`);
    if (groupResult.code !== 0) {
      console.log('Warning: Could not add user to docker group.');
    }
  }

  // Start Docker service (WSL may not have systemd)
  console.log('Starting Docker service...');
  const startResult = await shell.exec('sudo service docker start');
  if (startResult.code !== 0) {
    console.log('Warning: Could not start Docker service automatically.');
    console.log('You may need to start it manually: sudo service docker start');
  }

  // Verify installation
  const version = await getDockerVersion();
  if (!version) {
    throw new Error(
      'Installation appeared to complete but Docker was not found.\n\n' +
      'Please try:\n' +
      '  1. Start Docker: sudo service docker start\n' +
      '  2. Run: docker --version'
    );
  }

  console.log(`Docker Engine ${version} installed successfully.`);
  console.log('');
  console.log('IMPORTANT for WSL users:');
  console.log('');
  console.log('1. Docker must be started manually (WSL does not use systemd):');
  console.log('   sudo service docker start');
  console.log('');
  console.log('2. To auto-start Docker when WSL launches, add to ~/.bashrc:');
  console.log('   if [ -z "$(pgrep -x dockerd)" ]; then sudo service docker start > /dev/null 2>&1; fi');
  console.log('');
  console.log('3. For passwordless sudo (optional), run:');
  console.log(`   echo "${currentUser} ALL=(ALL) NOPASSWD: /usr/sbin/service docker *" | sudo tee /etc/sudoers.d/docker-service`);
  console.log('');
  console.log('4. Log out and back in (or run: newgrp docker) to use Docker without sudo.');
  console.log('');
  console.log('5. Verify installation: docker run hello-world');
}

/**
 * Install Docker Desktop from Git Bash on Windows.
 *
 * Git Bash runs within Windows, so this function installs Docker Desktop
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
  console.log('Installing Docker Desktop on the Windows host...');
  console.log('');

  // Check if Docker is already available
  const existingVersion = await getDockerVersion();
  if (existingVersion) {
    console.log(`Docker ${existingVersion} is already installed, skipping installation.`);
    return;
  }

  // Install via PowerShell using Chocolatey
  console.log('Installing Docker Desktop via Chocolatey...');
  console.log('This may take several minutes...');

  const installResult = await shell.exec(
    'powershell.exe -NoProfile -Command "choco install docker-desktop -y"'
  );

  if (installResult.code !== 0) {
    throw new Error(
      `Failed to install Docker Desktop.\n` +
      `Output: ${installResult.stdout || installResult.stderr}\n\n` +
      `Troubleshooting:\n` +
      `  1. Ensure Chocolatey is installed on Windows\n` +
      `  2. Run Git Bash as Administrator and retry\n` +
      `  3. Try installing directly from PowerShell:\n` +
      `     choco install docker-desktop -y`
    );
  }

  console.log('Docker Desktop installed successfully.');
  console.log('');
  console.log('IMPORTANT: A system restart may be required.');
  console.log('');
  console.log('After restart:');
  console.log('  1. Launch Docker Desktop from the Start Menu');
  console.log('  2. Wait for Docker Desktop to fully initialize');
  console.log('  3. Run "docker run hello-world" to verify');
  console.log('');
  console.log('Git Bash notes:');
  console.log('  - For interactive containers, use: winpty docker run -it <image>');
  console.log('  - Volume paths need double slashes: //c/Users/...');
}

/**
 * Check if this installer is supported on the current platform.
 *
 * Docker can be installed on all supported platforms:
 * - macOS (Docker Desktop via Homebrew)
 * - Ubuntu/Debian (Docker Engine via official APT repository)
 * - Raspberry Pi OS (Docker Engine via official APT repository)
 * - Amazon Linux/RHEL/Fedora (Docker via DNF/YUM)
 * - Windows (Docker Desktop via Chocolatey)
 * - WSL (Docker Engine within WSL)
 * - Git Bash (Docker Desktop on Windows host)
 *
 * @returns {boolean} True if installation is supported on this platform
 */
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'rhel', 'fedora', 'windows', 'gitbash'].includes(platform.type);
}

/**
 * Main installation entry point.
 *
 * Detects the current platform and runs the appropriate installer function.
 * Handles platform-specific mappings to ensure all supported platforms
 * have appropriate installation logic.
 *
 * Supported platforms:
 * - macOS: Docker Desktop via Homebrew
 * - Ubuntu/Debian: Docker Engine via official APT repository
 * - Raspberry Pi OS: Docker Engine via official APT repository
 * - Amazon Linux/RHEL: Docker via DNF/YUM
 * - Windows: Docker Desktop via Chocolatey
 * - WSL (Ubuntu): Docker Engine within WSL
 * - Git Bash: Docker Desktop on Windows host
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their installer functions
  // This mapping handles aliases (e.g., debian maps to ubuntu for Docker Engine)
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
    console.log(`Docker is not available for ${platform.type}.`);
    return;
  }

  await installer();
}

// Export all functions for use as a module and for testing
module.exports = {
  install,
  isEligible,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash
};

// Allow direct execution: node docker.js
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
