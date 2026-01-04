#!/usr/bin/env node

/**
 * @fileoverview Install OpenSSH - the premier suite of secure networking utilities.
 *
 * OpenSSH (Open Secure Shell) provides encrypted communication over unsecured
 * networks, replacing insecure protocols like telnet, rlogin, and rsh. Originally
 * developed by the OpenBSD project, it has become the standard for secure remote
 * access and file transfer.
 *
 * OpenSSH includes:
 * - ssh: The SSH client for connecting to remote servers
 * - sshd: The SSH server daemon that accepts incoming connections
 * - ssh-keygen: Tool for generating SSH key pairs
 * - ssh-agent: Authentication agent for managing private keys
 * - ssh-add: Adds private keys to the authentication agent
 * - scp: Secure file copy utility
 * - sftp: Secure file transfer program
 * - ssh-copy-id: Tool for installing public keys on remote servers
 *
 * This installer provides:
 * - SSH client on all platforms (always installed)
 * - SSH server on Linux platforms (for accepting incoming connections)
 * - Homebrew version on macOS (newer than system version with FIDO2 support)
 * - Windows capability-based installation (built-in feature)
 * - Git Bash bundled SSH verification
 *
 * @module installs/openssh
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');
const brew = require('../utils/macos/brew');
const apt = require('../utils/ubuntu/apt');
const systemd = require('../utils/ubuntu/systemd');

/**
 * The Homebrew formula name for OpenSSH on macOS.
 * Installing via Homebrew provides a newer version than the system-bundled one,
 * with additional features like FIDO2/U2F hardware key support.
 */
const HOMEBREW_FORMULA_NAME = 'openssh';

/**
 * APT packages to install on Debian-based systems.
 * - openssh-client: SSH client tools (ssh, ssh-keygen, ssh-agent, scp, sftp)
 * - openssh-server: SSH server daemon (sshd) for accepting connections
 */
const APT_PACKAGES = ['openssh-client', 'openssh-server'];

/**
 * Package names for Amazon Linux/RHEL systems.
 * Note: These systems use 'openssh-clients' (plural) for the client package.
 */
const RHEL_PACKAGES = ['openssh-clients', 'openssh-server'];

/**
 * Check if the SSH client (ssh command) is available on the system.
 *
 * This is a quick check to determine if OpenSSH is installed. The ssh command
 * is the primary interface for connecting to remote servers.
 *
 * @returns {boolean} True if the ssh command is available, false otherwise
 */
function isSshClientInstalled() {
  return shell.commandExists('ssh');
}

/**
 * Check if ssh-keygen is available on the system.
 *
 * ssh-keygen is used to generate SSH key pairs for authentication.
 * Its presence indicates a functional OpenSSH client installation.
 *
 * @returns {boolean} True if ssh-keygen is available, false otherwise
 */
function isSshKeygenInstalled() {
  return shell.commandExists('ssh-keygen');
}

/**
 * Get the installed SSH version by running 'ssh -V'.
 *
 * The version string helps identify whether the system or Homebrew version
 * is being used, and whether an upgrade might be beneficial.
 *
 * @returns {Promise<string|null>} SSH version string, or null if not installed
 */
async function getSshVersion() {
  if (!isSshClientInstalled()) {
    return null;
  }

  // ssh -V outputs to stderr, not stdout
  const result = await shell.exec('ssh -V 2>&1');
  if (result.code === 0 && result.stdout) {
    // Output format: "OpenSSH_9.6p1, OpenSSL 3.2.1 30 Jan 2024"
    const match = result.stdout.match(/OpenSSH[_\s]([\d.p]+)/);
    return match ? match[1] : result.stdout.trim().split('\n')[0];
  }
  return null;
}

/**
 * Install OpenSSH on macOS using Homebrew.
 *
 * macOS includes a pre-installed version of OpenSSH. However, Apple's bundled
 * version may be older than the latest release. Homebrew provides a more recent
 * version with additional features like FIDO2/U2F hardware key support.
 *
 * Prerequisites:
 * - macOS 10.15 (Catalina) or later
 * - Homebrew package manager installed
 *
 * After installation:
 * - The Homebrew version is available at /opt/homebrew/bin/ssh (Apple Silicon)
 *   or /usr/local/bin/ssh (Intel Macs)
 * - The system version remains at /usr/bin/ssh
 * - Ensure Homebrew's bin directory is first in PATH to use the newer version
 *
 * @returns {Promise<void>}
 */
async function install_macos() {
  console.log('Checking OpenSSH installation status...');

  // macOS always has a system SSH, but we can install a newer version via Homebrew
  const existingVersion = await getSshVersion();
  if (existingVersion) {
    console.log(`OpenSSH ${existingVersion} is available on this system.`);
  }

  // Check if Homebrew is available for installing a newer version
  if (!brew.isInstalled()) {
    // If no Homebrew but system SSH exists, that's fine
    if (isSshClientInstalled()) {
      console.log('Using system-provided OpenSSH (Homebrew not available for upgrade).');
      console.log('');
      console.log('To install a newer version with FIDO2 support, first install Homebrew:');
      console.log('  dev install homebrew');
      return;
    }

    // This should never happen on macOS, but handle gracefully
    console.log('Homebrew is not installed and no system SSH found.');
    console.log('Please install Homebrew first: dev install homebrew');
    return;
  }

  // Check if already installed via Homebrew
  const isBrewInstalled = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (isBrewInstalled) {
    console.log('OpenSSH is already installed via Homebrew, skipping...');
    console.log('');
    console.log('To ensure you are using the Homebrew version, verify your PATH:');
    console.log('  which ssh');
    console.log('');
    console.log('Expected output for Apple Silicon: /opt/homebrew/bin/ssh');
    console.log('Expected output for Intel Macs: /usr/local/bin/ssh');
    return;
  }

  // Install OpenSSH via Homebrew
  console.log('Installing OpenSSH via Homebrew...');
  console.log('This provides a newer version with FIDO2/U2F hardware key support.');
  console.log('');

  const result = await brew.install(HOMEBREW_FORMULA_NAME);

  if (!result.success) {
    console.log('Failed to install OpenSSH via Homebrew.');
    console.log(result.output);
    console.log('');
    console.log('The system-provided OpenSSH is still available at /usr/bin/ssh');
    return;
  }

  // Verify installation
  const verified = await brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  if (!verified) {
    console.log('Installation may have failed: OpenSSH formula not found after install.');
    console.log('The system-provided OpenSSH is still available at /usr/bin/ssh');
    return;
  }

  console.log('OpenSSH installed successfully via Homebrew.');
  console.log('');
  console.log('IMPORTANT: To use the Homebrew version, ensure it is first in your PATH.');
  console.log('');
  console.log('For Apple Silicon Macs, add to ~/.zshrc:');
  console.log('  export PATH="/opt/homebrew/bin:$PATH"');
  console.log('');
  console.log('For Intel Macs, add to ~/.zshrc:');
  console.log('  export PATH="/usr/local/bin:$PATH"');
  console.log('');
  console.log('Verify with: which ssh');
}

/**
 * Install OpenSSH on Ubuntu/Debian using APT.
 *
 * Installs both the SSH client and server from the default repositories.
 * The client is typically pre-installed on desktop systems, but the server
 * component requires manual installation.
 *
 * After installation:
 * - SSH client tools (ssh, ssh-keygen, scp, sftp) are available
 * - SSH server (sshd) is enabled and started automatically
 * - Firewall rule for SSH may need to be added if UFW is active
 *
 * Prerequisites:
 * - Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
 * - sudo privileges
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  console.log('Checking OpenSSH installation status...');

  // Check if both client and server are already installed
  const clientInstalled = await apt.isPackageInstalled('openssh-client');
  const serverInstalled = await apt.isPackageInstalled('openssh-server');

  if (clientInstalled && serverInstalled) {
    const version = await getSshVersion();
    console.log(`OpenSSH is already installed${version ? ` (${version})` : ''}, skipping...`);
    return;
  }

  // Determine what needs to be installed
  const packagesToInstall = [];
  if (!clientInstalled) {
    packagesToInstall.push('openssh-client');
  }
  if (!serverInstalled) {
    packagesToInstall.push('openssh-server');
  }

  console.log(`Installing: ${packagesToInstall.join(', ')}...`);

  // Update package lists first
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install the required packages
  console.log('Installing OpenSSH packages...');
  const installCommand = `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${packagesToInstall.join(' ')}`;
  const installResult = await shell.exec(installCommand);

  if (installResult.code !== 0) {
    console.log('Failed to install OpenSSH packages.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Enable and start the SSH service if server was installed
  if (packagesToInstall.includes('openssh-server')) {
    console.log('Enabling and starting SSH service...');
    const enableResult = await systemd.enableService('ssh', { now: true });
    if (!enableResult.success) {
      console.log('Warning: Could not enable SSH service automatically.');
      console.log('You may need to run: sudo systemctl enable ssh --now');
    }
  }

  // Verify installation
  const clientVerified = shell.commandExists('ssh');
  if (!clientVerified) {
    console.log('Installation may have failed: ssh command not found after install.');
    return;
  }

  const version = await getSshVersion();
  console.log(`OpenSSH installed successfully${version ? ` (${version})` : ''}.`);
  console.log('');
  console.log('SSH server is enabled and running. To verify:');
  console.log('  sudo systemctl status ssh');
  console.log('');
  console.log('If UFW (firewall) is enabled, allow SSH connections:');
  console.log('  sudo ufw allow ssh');
}

/**
 * Install OpenSSH on Ubuntu running in WSL (Windows Subsystem for Linux).
 *
 * WSL runs Ubuntu within Windows. The SSH client is typically pre-installed,
 * but the SSH server requires additional configuration for external access
 * due to WSL's virtual networking.
 *
 * IMPORTANT: WSL does not use systemd by default, so the SSH service must
 * be started manually or via a startup script.
 *
 * After installation:
 * - SSH client tools are available within WSL
 * - SSH server (if installed) requires manual startup: sudo service ssh start
 * - For external access, port forwarding from Windows host may be required
 *
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  console.log('Detected Ubuntu running in WSL (Windows Subsystem for Linux).');
  console.log('');

  // Check if already installed
  const clientInstalled = await apt.isPackageInstalled('openssh-client');
  const serverInstalled = await apt.isPackageInstalled('openssh-server');

  if (clientInstalled && serverInstalled) {
    const version = await getSshVersion();
    console.log(`OpenSSH is already installed${version ? ` (${version})` : ''}, skipping...`);
    console.log('');
    console.log('WSL Note: SSH server requires manual startup:');
    console.log('  sudo service ssh start');
    return;
  }

  // Determine what needs to be installed
  const packagesToInstall = [];
  if (!clientInstalled) {
    packagesToInstall.push('openssh-client');
  }
  if (!serverInstalled) {
    packagesToInstall.push('openssh-server');
  }

  console.log(`Installing: ${packagesToInstall.join(', ')}...`);

  // Update package lists
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install the packages
  console.log('Installing OpenSSH packages...');
  const installCommand = `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${packagesToInstall.join(' ')}`;
  const installResult = await shell.exec(installCommand);

  if (installResult.code !== 0) {
    console.log('Failed to install OpenSSH packages.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Start SSH service (WSL typically does not use systemd)
  if (packagesToInstall.includes('openssh-server')) {
    console.log('Starting SSH service...');
    const startResult = await shell.exec('sudo service ssh start');
    if (startResult.code !== 0) {
      console.log('Warning: Could not start SSH service automatically.');
      console.log('You may need to run: sudo service ssh start');
    }
  }

  // Verify installation
  const clientVerified = shell.commandExists('ssh');
  if (!clientVerified) {
    console.log('Installation may have failed: ssh command not found after install.');
    return;
  }

  const version = await getSshVersion();
  console.log(`OpenSSH installed successfully${version ? ` (${version})` : ''}.`);
  console.log('');
  console.log('IMPORTANT for WSL users:');
  console.log('');
  console.log('1. SSH server must be started manually (WSL does not use systemd):');
  console.log('   sudo service ssh start');
  console.log('');
  console.log('2. To auto-start SSH when WSL launches, add to ~/.bashrc:');
  console.log('   if [ -z "$(pgrep -x sshd)" ]; then sudo service ssh start > /dev/null 2>&1; fi');
  console.log('');
  console.log('3. By default, SSH uses port 22. To avoid conflict with Windows SSH,');
  console.log('   consider changing to port 2222 in /etc/ssh/sshd_config');
  console.log('');
  console.log('4. For external access, configure Windows firewall and port forwarding.');
}

/**
 * Install OpenSSH on Raspberry Pi OS using APT.
 *
 * Raspberry Pi OS is based on Debian, so installation follows the same
 * APT-based process. OpenSSH works on both 32-bit (armhf) and 64-bit (arm64)
 * architectures.
 *
 * NOTE: SSH is disabled by default on Raspberry Pi OS for security.
 * This function installs and enables it via command line.
 *
 * Alternative headless setup: Create an empty file named 'ssh' on the
 * boot partition before first boot to enable SSH without keyboard/monitor.
 *
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  console.log('Checking OpenSSH installation status on Raspberry Pi OS...');

  // Check if already installed
  const clientInstalled = await apt.isPackageInstalled('openssh-client');
  const serverInstalled = await apt.isPackageInstalled('openssh-server');

  if (clientInstalled && serverInstalled) {
    const version = await getSshVersion();
    console.log(`OpenSSH is already installed${version ? ` (${version})` : ''}, skipping...`);

    // Ensure SSH service is enabled (may have been disabled for security)
    console.log('Verifying SSH service is enabled...');
    const isEnabled = await systemd.isServiceEnabled('ssh');
    if (!isEnabled) {
      console.log('SSH service is disabled. Enabling...');
      await systemd.enableService('ssh', { now: true });
    }
    return;
  }

  // Determine what needs to be installed
  const packagesToInstall = [];
  if (!clientInstalled) {
    packagesToInstall.push('openssh-client');
  }
  if (!serverInstalled) {
    packagesToInstall.push('openssh-server');
  }

  console.log(`Installing: ${packagesToInstall.join(', ')}...`);

  // Update package lists
  console.log('Updating package lists...');
  const updateResult = await shell.exec('sudo DEBIAN_FRONTEND=noninteractive apt-get update -y');
  if (updateResult.code !== 0) {
    console.log('Warning: Failed to update package lists. Continuing with installation...');
  }

  // Install the packages
  console.log('Installing OpenSSH packages...');
  const installCommand = `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${packagesToInstall.join(' ')}`;
  const installResult = await shell.exec(installCommand);

  if (installResult.code !== 0) {
    console.log('Failed to install OpenSSH packages.');
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Enable and start the SSH service
  if (packagesToInstall.includes('openssh-server')) {
    console.log('Enabling and starting SSH service...');
    const enableResult = await systemd.enableService('ssh', { now: true });
    if (!enableResult.success) {
      console.log('Warning: Could not enable SSH service automatically.');
      console.log('You may need to run: sudo systemctl enable ssh --now');
    }
  }

  // Verify installation
  const clientVerified = shell.commandExists('ssh');
  if (!clientVerified) {
    console.log('Installation may have failed: ssh command not found after install.');
    return;
  }

  const version = await getSshVersion();
  console.log(`OpenSSH installed successfully${version ? ` (${version})` : ''}.`);
  console.log('');
  console.log('SSH is enabled and running. Find your Pi\'s IP address with:');
  console.log('  hostname -I');
  console.log('');
  console.log('Connect from another machine:');
  console.log('  ssh pi@<raspberry-pi-ip-address>');
}

/**
 * Install OpenSSH on Amazon Linux using DNF or YUM.
 *
 * Amazon Linux 2023 uses DNF, while Amazon Linux 2 uses YUM. OpenSSH is
 * typically pre-installed on Amazon Linux EC2 instances (it's how you
 * access the instance), but this ensures the latest version is installed.
 *
 * NOTE: On Amazon Linux, the SSH service is named 'sshd', not 'ssh'.
 *
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  console.log('Checking OpenSSH installation status...');

  // Check if SSH client is already installed
  if (isSshClientInstalled()) {
    const version = await getSshVersion();
    console.log(`OpenSSH is already installed${version ? ` (${version})` : ''}, skipping...`);
    return;
  }

  // Detect package manager
  const platform = os.detect();
  const packageManager = platform.packageManager;

  if (packageManager !== 'dnf' && packageManager !== 'yum') {
    console.log(`Unexpected package manager: ${packageManager}`);
    console.log('Expected dnf (Amazon Linux 2023) or yum (Amazon Linux 2).');
    return;
  }

  console.log(`Using ${packageManager} package manager...`);
  console.log('Installing OpenSSH packages...');

  // Install OpenSSH packages
  const packages = RHEL_PACKAGES.join(' ');
  const installCommand = `sudo ${packageManager} install -y ${packages}`;
  const installResult = await shell.exec(installCommand);

  if (installResult.code !== 0) {
    console.log(`Failed to install OpenSSH via ${packageManager}.`);
    console.log(installResult.stderr || installResult.stdout);
    return;
  }

  // Enable and start the SSH service (named 'sshd' on Amazon Linux)
  console.log('Enabling and starting SSH service...');
  const enableResult = await shell.exec('sudo systemctl enable sshd --now');
  if (enableResult.code !== 0) {
    console.log('Warning: Could not enable SSH service automatically.');
    console.log('You may need to run: sudo systemctl enable sshd --now');
  }

  // Verify installation
  const clientVerified = shell.commandExists('ssh');
  if (!clientVerified) {
    console.log('Installation may have failed: ssh command not found after install.');
    return;
  }

  const version = await getSshVersion();
  console.log(`OpenSSH installed successfully${version ? ` (${version})` : ''}.`);
  console.log('');
  console.log('SSH service is enabled and running. To verify:');
  console.log('  sudo systemctl status sshd');
  console.log('');
  console.log('NOTE: For EC2 instances, ensure the security group allows');
  console.log('inbound SSH (port 22) from your IP address.');
}

/**
 * Install OpenSSH on Windows using Windows Capability.
 *
 * Windows 10 (1809+) and Windows 11 include OpenSSH as an optional feature.
 * This function installs both the SSH client and server using the built-in
 * Add-WindowsCapability PowerShell cmdlet.
 *
 * Prerequisites:
 * - Windows 10 version 1809 or later, or Windows 11
 * - Administrator privileges
 * - Internet connectivity (components download from Windows Update)
 *
 * After installation:
 * - SSH client (ssh, ssh-keygen) is available from PowerShell and Command Prompt
 * - SSH server (sshd) is installed but requires manual startup
 * - Firewall rule for SSH server is created automatically
 *
 * @returns {Promise<void>}
 */
async function install_windows() {
  console.log('Checking OpenSSH installation status on Windows...');

  // Check if SSH client is already available
  if (isSshClientInstalled()) {
    const version = await getSshVersion();
    console.log(`OpenSSH is already installed${version ? ` (${version})` : ''}.`);
    console.log('');
    console.log('To verify installation status:');
    console.log('  Get-WindowsCapability -Online | Where-Object Name -like "OpenSSH*"');
    return;
  }

  console.log('Installing OpenSSH via Windows Capability...');
  console.log('This may take a few moments as components download from Windows Update.');
  console.log('');

  // Install OpenSSH Client
  console.log('Installing OpenSSH Client...');
  const clientResult = await shell.exec(
    'powershell.exe -NoProfile -Command "Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"'
  );

  if (clientResult.code !== 0) {
    console.log('Failed to install OpenSSH Client.');
    console.log(clientResult.stderr || clientResult.stdout);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Run as Administrator');
    console.log('  2. Ensure Windows Update is accessible');
    console.log('  3. Check Event Viewer for detailed errors');
    return;
  }

  console.log('OpenSSH Client installed successfully.');

  // Install OpenSSH Server
  console.log('Installing OpenSSH Server...');
  const serverResult = await shell.exec(
    'powershell.exe -NoProfile -Command "Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0"'
  );

  if (serverResult.code !== 0) {
    console.log('Warning: Failed to install OpenSSH Server.');
    console.log('SSH client is available, but server functionality is not installed.');
    console.log('You can install it manually later with:');
    console.log('  Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0');
  } else {
    console.log('OpenSSH Server installed successfully.');

    // Configure SSH server for automatic startup
    console.log('Configuring SSH server...');
    await shell.exec('powershell.exe -NoProfile -Command "Set-Service -Name sshd -StartupType Automatic"');
    await shell.exec('powershell.exe -NoProfile -Command "Start-Service sshd"');

    // Add firewall rule if it doesn't exist
    const firewallCmd = `
      if (-not (Get-NetFirewallRule -Name "OpenSSH-Server-In-TCP" -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -Name "OpenSSH-Server-In-TCP" -DisplayName "OpenSSH Server (sshd)" -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
      }
    `;
    await shell.exec(`powershell.exe -NoProfile -Command "${firewallCmd.replace(/\n/g, ' ')}"`);
  }

  // Verify installation
  // Note: PATH may not be updated in current session, so check via PowerShell
  const verifyResult = await shell.exec(
    'powershell.exe -NoProfile -Command "Get-WindowsCapability -Online | Where-Object Name -like \'OpenSSH.Client*\' | Select-Object -ExpandProperty State"'
  );

  if (verifyResult.stdout.trim() === 'Installed') {
    const version = await getSshVersion();
    console.log('');
    console.log(`OpenSSH installed successfully${version ? ` (${version})` : ''}.`);
    console.log('');
    console.log('NOTE: Close and reopen your terminal for PATH changes to take effect.');
    console.log('');
    console.log('To verify: ssh -V');
    console.log('');
    console.log('SSH Server status: Get-Service sshd');
  } else {
    console.log('Installation may have failed. Verify with:');
    console.log('  Get-WindowsCapability -Online | Where-Object Name -like "OpenSSH*"');
  }
}

/**
 * Verify and configure OpenSSH on Git Bash (Windows).
 *
 * Git Bash includes a bundled version of OpenSSH when Git for Windows is
 * installed. This function verifies the bundled SSH is working and provides
 * guidance for common configurations.
 *
 * NOTE: Git Bash only provides the SSH client, not the server. For SSH server
 * functionality on Windows, use the Windows OpenSSH Server (see Windows section).
 *
 * @returns {Promise<void>}
 */
async function install_gitbash() {
  console.log('Detected Git Bash on Windows.');
  console.log('');

  // Check if SSH is available (it should be bundled with Git for Windows)
  if (isSshClientInstalled()) {
    const version = await getSshVersion();
    console.log(`OpenSSH is available${version ? ` (${version})` : ''} (bundled with Git for Windows).`);
    console.log('');

    // Verify ssh-agent is functional
    const agentResult = await shell.exec('ssh-agent -s');
    if (agentResult.code === 0) {
      console.log('SSH agent is functional.');
    }

    console.log('');
    console.log('Common Git Bash SSH tips:');
    console.log('');
    console.log('1. Start ssh-agent and add your key:');
    console.log('   eval $(ssh-agent -s)');
    console.log('   ssh-add ~/.ssh/id_ed25519');
    console.log('');
    console.log('2. For interactive SSH sessions, use winpty:');
    console.log('   winpty ssh user@host');
    console.log('');
    console.log('3. To use Windows OpenSSH instead of Git Bash bundled version:');
    console.log('   git config --global core.sshCommand "C:/Windows/System32/OpenSSH/ssh.exe"');
    return;
  }

  // SSH should be bundled with Git for Windows - if not found, the installation is incomplete
  console.log('SSH client not found in Git Bash.');
  console.log('');
  console.log('This is unexpected - Git for Windows should include OpenSSH.');
  console.log('');
  console.log('To fix this issue:');
  console.log('  1. Reinstall Git for Windows from https://git-scm.com/download/win');
  console.log('  2. During installation, ensure "Use bundled OpenSSH" is selected');
  console.log('');
  console.log('Alternatively, install OpenSSH on Windows and configure Git to use it:');
  console.log('  1. Run "dev install openssh" from PowerShell');
  console.log('  2. Then in Git Bash:');
  console.log('     git config --global core.sshCommand "C:/Windows/System32/OpenSSH/ssh.exe"');
}

/**
 * Main installation entry point - detects platform and runs appropriate installer.
 *
 * Detects the current operating system and dispatches to the appropriate
 * platform-specific installer function. OpenSSH is supported on all major
 * platforms:
 *
 * - macOS (Homebrew) - newer version with FIDO2 support
 * - Ubuntu/Debian (APT) - openssh-client + openssh-server
 * - Ubuntu on WSL (APT) - client + server with WSL-specific guidance
 * - Raspberry Pi OS (APT) - client + server
 * - Amazon Linux/RHEL (DNF/YUM) - openssh-clients + openssh-server
 * - Windows (Windows Capability) - built-in optional feature
 * - Git Bash (bundled) - included with Git for Windows
 *
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  // Map platform types to their corresponding installer functions
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
    console.log(`OpenSSH is not available for ${platform.type}.`);
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
