# Installing NordVPN

## Overview

NordVPN is a commercial Virtual Private Network (VPN) service that encrypts your internet traffic and masks your IP address. It provides secure, private access to the internet with features including:

- **Privacy Protection**: Encrypts all network traffic using AES-256 encryption
- **Global Server Network**: Access to 6,000+ servers in 111 countries
- **Kill Switch**: Automatically blocks internet access if VPN connection drops
- **Threat Protection**: Blocks ads, trackers, and malware (varies by platform)
- **Meshnet**: Create encrypted networks between your devices for remote access
- **NordLynx Protocol**: WireGuard-based protocol for high-speed connections

NordVPN provides both GUI applications (for desktop platforms) and CLI tools (for servers and headless systems).

## Prerequisites

Before installing NordVPN on any platform, ensure:

1. **Internet connectivity** - Required to download packages and authenticate with NordVPN
2. **Administrative privileges** - Required for system-wide installation and network configuration
3. **A NordVPN subscription** - Active account required; sign up at https://nordvpn.com
4. **curl or wget** - Required on Linux platforms for the installation script

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `Homebrew` - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- **Optional:** None
- **Auto-installed:** None

### Ubuntu (APT/Snap)
- **Required:**
  - `curl` or `wget` - Install via `sudo apt-get install -y curl` (one is typically pre-installed)
- **Optional:**
  - `snapd` - For Snap installation method
- **Auto-installed:**
  - GPG signing key (added by install script)
  - APT repository configuration (added by install script)
  - `nordvpn` package dependencies (handled by APT)

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `curl` or `wget` - Install via `sudo apt-get install -y curl`
- **Optional:** None
- **Auto-installed:**
  - GPG signing key (added by install script)
  - APT repository configuration (added by install script)
  - `nordvpn` package dependencies (handled by APT)

### Amazon Linux (DNF/YUM)
- **Required:**
  - `curl` or `wget` - Install via `sudo dnf install -y curl` or `sudo yum install -y curl`
- **Optional:** None
- **Auto-installed:**
  - Repository configuration (added by install script)
  - `nordvpn` package dependencies (handled by DNF/YUM)
  - systemd service configuration

### Windows (Chocolatey/winget)
- **Required:**
  - `Chocolatey` - Install via PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
- **Optional:**
  - `winget` - Alternative package manager (pre-installed on Windows 11 and recent Windows 10)
- **Auto-installed:**
  - `.NET Framework 4.8` (dependency)
  - `Visual C++ Redistributable` (dependency)

### Git Bash (Manual/Portable)
- **Required:**
  - NordVPN installed on Windows host (see Windows section)
  - Git Bash inherits Windows PATH for the `nordvpn` command
- **Optional:** None
- **Auto-installed:** None

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 12.0 (Monterey) or later
- Homebrew package manager installed
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install NordVPN:

```bash
brew install --cask --quiet nordvpn
```

The `--cask` flag specifies this is a GUI application. The `--quiet` flag suppresses non-essential output for cleaner automation logs.

After installation, launch NordVPN from your Applications folder or Spotlight to complete the setup.

#### Verification

Confirm the application is installed:

```bash
ls /Applications/NordVPN.app
```

Expected output:

```
/Applications/NordVPN.app
```

Check the installed version via Homebrew:

```bash
brew info --cask nordvpn | head -1
```

#### Troubleshooting

**Problem**: `Error: Cask 'nordvpn' is not installed`

**Solution**: The Homebrew cask path may not be configured. Update Homebrew and retry:

```bash
brew update
brew install --cask --quiet nordvpn
```

**Problem**: Application requires macOS version newer than installed

**Solution**: NordVPN requires macOS 12 (Monterey) or later. Upgrade your operating system or download an older version directly from NordVPN's website.

**Problem**: "NordVPN can't be opened because Apple cannot check it for malicious software"

**Solution**: This is a Gatekeeper warning. Allow the app in System Preferences > Security & Privacy > General, or run:

```bash
xattr -cr /Applications/NordVPN.app
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 (Focal) or later, or Debian 11 (Bullseye) or later (64-bit)
- sudo privileges
- curl or wget installed

If curl is not installed:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
```

#### Installation Steps

**Step 1: Run the official installation script**

NordVPN provides an automated installation script that detects your distribution and configures the repository. The `-n` flag enables non-interactive mode:

```bash
sh <(curl -sSf https://downloads.nordcdn.com/apps/linux/install.sh) -n
```

If curl is unavailable, use wget instead:

```bash
sh <(wget -qO - https://downloads.nordcdn.com/apps/linux/install.sh) -n
```

This script automatically:
- Detects your Ubuntu/Debian version
- Adds NordVPN's GPG signing key
- Configures the APT repository
- Installs the nordvpn package
- Enables and starts the nordvpnd service

**Step 2: Add your user to the nordvpn group**

This grants permission to use the NordVPN CLI without sudo:

```bash
sudo usermod -aG nordvpn $USER
```

**Important**: You must log out and log back in (or reboot) for the group change to take effect.

**Step 3: Log in to NordVPN**

After logging back in, authenticate with your NordVPN account using a token:

1. Log into your Nord Account at https://my.nordaccount.com
2. Go to NordVPN > Advanced Settings > Access token
3. Generate a new access token (choose non-expiring for servers)
4. Copy the token and run:

```bash
nordvpn login --token YOUR_TOKEN_HERE
```

**Step 4: Connect to VPN**

```bash
nordvpn connect
```

This connects to the fastest available server. The connection persists until you disconnect.

#### Alternative: Snap Installation

If you prefer Snap packages:

```bash
sudo snap install nordvpn
```

After installation, add your user to the nordvpn group and log in as described above.

#### Verification

Confirm the installation succeeded:

```bash
nordvpn --version
```

Expected output (version numbers may vary):

```
NordVPN Version 3.19.2
```

Check connection status:

```bash
nordvpn status
```

#### Troubleshooting

**Problem**: `Whoops! Permission denied accessing /run/nordvpn/nordvpnd.sock`

**Solution**: Your user is not in the nordvpn group or the session needs refresh:

```bash
sudo usermod -aG nordvpn $USER
```

Then log out and log back in, or reboot.

**Problem**: `nordvpn: command not found` after installation

**Solution**: Open a new terminal session. If still not found, the package may not have installed correctly. Reinstall:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --reinstall nordvpn
```

**Problem**: Cannot connect - "You are not logged in"

**Solution**: Generate an access token from your Nord Account and log in:

```bash
nordvpn login --token YOUR_TOKEN_HERE
```

**Problem**: The installation script prompts for confirmation

**Solution**: Ensure you are using the `-n` flag for non-interactive mode:

```bash
sh <(curl -sSf https://downloads.nordcdn.com/apps/linux/install.sh) -n
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit) - Bullseye, Bookworm, or newer
- Raspberry Pi 3, 4, 5, or Zero 2 W (ARM processor)
- sudo privileges
- curl or wget installed

Verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit (uses Debian arm64 packages)
- `armv7l` = 32-bit (uses Raspbian-specific packages)

If curl is not installed:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
```

#### Installation Steps

**Step 1: Run the official installation script**

```bash
sh <(curl -sSf https://downloads.nordcdn.com/apps/linux/install.sh) -n
```

The script automatically detects Raspberry Pi OS and configures the appropriate repository for your architecture.

**Note**: NordVPN officially supports Raspberry Pi OS but with limited ARM64 support. The CLI version works well on Raspberry Pi devices.

**Step 2: Add your user to the nordvpn group**

```bash
sudo usermod -aG nordvpn $USER
```

Log out and log back in for the group change to take effect.

**Step 3: Log in to NordVPN**

Generate an access token from your Nord Account (https://my.nordaccount.com > NordVPN > Advanced Settings > Access token), then:

```bash
nordvpn login --token YOUR_TOKEN_HERE
```

**Step 4: Connect to VPN**

```bash
nordvpn connect
```

#### Alternative: Manual OpenVPN Setup

If the NordVPN native client does not work on your Raspberry Pi, use OpenVPN directly:

```bash
# Install OpenVPN
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y openvpn

# Download NordVPN configuration files
cd /etc/openvpn
sudo wget -q https://downloads.nordcdn.com/configs/archives/servers/ovpn.zip

# Install unzip if needed
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y unzip

# Extract configuration files
sudo unzip -q ovpn.zip
sudo rm ovpn.zip

# Connect using a configuration file (get credentials from Nord Account > Manual setup)
cd /etc/openvpn/ovpn_udp/
sudo openvpn us2957.nordvpn.com.udp.ovpn
```

**Note**: When prompted, enter your NordVPN service credentials (found in Nord Account > Manual setup > Service credentials). These are different from your account login.

#### Verification

Confirm the installation succeeded:

```bash
nordvpn --version
```

Check connection status:

```bash
nordvpn status
```

Verify your IP has changed:

```bash
curl -s https://api.ipify.org && echo
```

#### Troubleshooting

**Problem**: Installation fails with ARM architecture errors

**Solution**: NordVPN has limited ARM64 support. Use the OpenVPN manual setup method described above instead.

**Problem**: Very slow VPN performance on Raspberry Pi

**Solution**: Enable the NordLynx protocol for better performance:

```bash
nordvpn set technology nordlynx
nordvpn connect
```

**Problem**: VPN disconnects after system sleep or reboot

**Solution**: Enable auto-connect:

```bash
nordvpn set autoconnect on
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023, Amazon Linux 2, Fedora 32+, RHEL 8/9, or CentOS 8/9
- sudo privileges
- curl or wget installed

**Note**: Amazon Linux 2023 and Fedora use DNF. Amazon Linux 2, RHEL 7, and CentOS 7 use YUM.

#### Installation Steps

**Step 1: Run the official installation script**

```bash
sh <(curl -sSf https://downloads.nordcdn.com/apps/linux/install.sh) -n
```

The script automatically detects your distribution and configures the appropriate repository.

**Step 2: Add your user to the nordvpn group**

```bash
sudo usermod -aG nordvpn $USER
```

Log out and log back in for the group change to take effect.

**Step 3: Log in to NordVPN**

Generate an access token from your Nord Account, then:

```bash
nordvpn login --token YOUR_TOKEN_HERE
```

**Step 4: Connect to VPN**

```bash
nordvpn connect
```

#### Alternative: Manual Repository Setup

**For Amazon Linux 2023 / Fedora (DNF):**

```bash
# Add NordVPN repository
sudo dnf config-manager --add-repo https://repo.nordvpn.com/yum/nordvpn/centos/x86_64/

# Import GPG key
sudo rpm --import https://repo.nordvpn.com/gpg/nordvpn_public.asc

# Install NordVPN
sudo dnf install -y nordvpn

# Enable and start the service
sudo systemctl enable --now nordvpnd

# Add user to nordvpn group
sudo usermod -aG nordvpn $USER
```

**For Amazon Linux 2 (YUM):**

```bash
# Install yum-utils if not present
sudo yum install -y yum-utils

# Add NordVPN repository
sudo yum-config-manager --add-repo https://repo.nordvpn.com/yum/nordvpn/centos/x86_64/

# Import GPG key
sudo rpm --import https://repo.nordvpn.com/gpg/nordvpn_public.asc

# Install NordVPN
sudo yum install -y nordvpn

# Enable and start the service
sudo systemctl enable --now nordvpnd

# Add user to nordvpn group
sudo usermod -aG nordvpn $USER
```

#### Verification

Confirm the installation succeeded:

```bash
nordvpn --version
```

Check connection status:

```bash
nordvpn status
```

Verify the service is running:

```bash
sudo systemctl status nordvpnd
```

#### Troubleshooting

**Problem**: "No package nordvpn available"

**Solution**: The repository was not added correctly. Verify and re-add:

```bash
ls /etc/yum.repos.d/ | grep -i nord
```

If missing, manually add the repository as shown above.

**Problem**: GPG key verification fails

**Solution**: Import the key manually:

```bash
sudo rpm --import https://repo.nordvpn.com/gpg/nordvpn_public.asc
```

**Problem**: SELinux blocking NordVPN

**Solution**: Allow NordVPN through SELinux or set to permissive temporarily:

```bash
sudo setenforce 0
```

For a permanent fix, create an SELinux policy module.

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or later, or Windows Server 2016 or later (64-bit)
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**Important**: A system reboot is required after installing Chocolatey's dependencies (.NET Framework 4.8 and Visual C++ Redistributable) before NordVPN will install successfully.

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install nordvpn -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

After installation:
1. Reboot if this is the first install (to complete dependency setup)
2. Launch NordVPN from the Start Menu
3. Log in with your NordVPN account

#### Alternative: winget Installation

If you prefer winget over Chocolatey:

```powershell
winget install --id NordVPN.NordVPN --silent --accept-package-agreements --accept-source-agreements
```

#### Command-Line Usage

After logging in via the GUI, you can use NordVPN from the command line:

```powershell
# Navigate to NordVPN directory
cd "C:\Program Files\NordVPN"

# Connect to VPN
nordvpn -c

# Connect to a specific country
nordvpn -c -g "United States"

# Connect to a specific server
nordvpn -c -n "United States #3710"

# Disconnect
nordvpn -d
```

#### Verification

Open a new Command Prompt or PowerShell window after installation:

```powershell
cd "C:\Program Files\NordVPN"
nordvpn -c
```

If the command connects successfully, the installation is complete.

Check the system tray for the NordVPN icon to confirm the service is running.

#### Troubleshooting

**Problem**: Installation fails with dependency errors

**Solution**: Install dependencies first, reboot, then install NordVPN:

```powershell
choco install dotnetfx vcredist140 -y
# Reboot the system
choco install nordvpn -y
```

**Problem**: `nordvpn` command not found

**Solution**: The NordVPN directory is not in PATH. Navigate to it directly:

```powershell
cd "C:\Program Files\NordVPN"
.\nordvpn -c
```

Or add to PATH permanently via System Properties > Environment Variables.

**Problem**: NordVPN service not running

**Solution**: Start the service:

```powershell
Start-Service NordVPN
```

Or launch the NordVPN application from the Start Menu.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- WSL 2 installed and configured (WSL 1 is not supported)
- Ubuntu distribution installed in WSL

Verify you are on WSL 2:

```powershell
wsl -l -v
```

The VERSION column should show `2` for your Ubuntu distribution.

**Important Recommendation**: For most users, install NordVPN on the Windows host only (see Windows section). WSL 2 shares the Windows network stack, so the VPN protection applies to WSL traffic automatically. Running NordVPN in both Windows and WSL simultaneously causes conflicts.

#### Installation Steps

If you specifically need NordVPN running inside WSL (advanced use cases only), follow these steps.

**Step 1: Install NordVPN in WSL**

Open your WSL Ubuntu terminal:

```bash
sh <(curl -sSf https://downloads.nordcdn.com/apps/linux/install.sh) -n
```

**Step 2: Add your user to the nordvpn group**

```bash
sudo usermod -aG nordvpn $USER
```

Exit and restart WSL for group changes to take effect.

**Step 3: Start the NordVPN daemon manually**

WSL does not use systemd by default, so start the daemon manually:

```bash
sudo nordvpnd &
sleep 3
```

**Step 4: Log in and connect**

```bash
nordvpn login --token YOUR_TOKEN_HERE
nordvpn connect
```

#### Starting NordVPN Automatically in WSL

Add this to your `~/.bashrc` to start NordVPN when you open a WSL terminal:

```bash
# Start nordvpnd if not already running
if ! pgrep -x nordvpnd > /dev/null; then
    sudo nordvpnd > /dev/null 2>&1 &
    sleep 2
fi
```

Configure passwordless sudo for nordvpnd (to avoid password prompts):

```bash
echo "$USER ALL=(ALL) NOPASSWD: /usr/sbin/nordvpnd" | sudo tee /etc/sudoers.d/nordvpnd
sudo chmod 0440 /etc/sudoers.d/nordvpnd
```

#### Verification

Confirm the installation succeeded:

```bash
nordvpn --version
```

Check connection status:

```bash
nordvpn status
```

#### Troubleshooting

**Problem**: "Permission denied accessing /run/nordvpn/nordvpnd.sock"

**Solution**: The daemon is not running. Start it:

```bash
sudo nordvpnd &
sleep 3
```

**Problem**: DNS resolution broken after connecting

**Solution**: Disable Tailscale-style DNS management:

```bash
nordvpn set dns off
```

Or manually restore `/etc/resolv.conf`:

```bash
sudo rm /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
```

**Problem**: VPN only works for WSL, not Windows

**Solution**: This is expected when running NordVPN in WSL only. For full system protection, install NordVPN on the Windows host instead.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- NordVPN installed on Windows (see Windows section)

**Note**: Git Bash on Windows does not require a separate NordVPN installation. Git Bash inherits the Windows PATH, so once NordVPN is installed on Windows, you can use it from Git Bash.

#### Installation Steps

1. Install NordVPN on Windows using Chocolatey (see Windows section):

```bash
# Run from Administrator PowerShell or Command Prompt
choco install nordvpn -y
```

2. Launch NordVPN from the Windows Start Menu and log in

3. Open Git Bash - the NordVPN CLI will be accessible by navigating to its directory

#### Using NordVPN from Git Bash

```bash
# Navigate to NordVPN installation directory
cd "/c/Program Files/NordVPN"

# Check connection status (informal test)
./nordvpn -c

# Connect to VPN
./nordvpn -c -g "United States"

# Disconnect
./nordvpn -d
```

#### Verification

In Git Bash, confirm NordVPN is accessible:

```bash
cd "/c/Program Files/NordVPN"
./nordvpn -c
```

If the command initiates a connection, the setup is complete.

#### Troubleshooting

**Problem**: `nordvpn: command not found` in Git Bash

**Solution**: Navigate to the installation directory:

```bash
cd "/c/Program Files/NordVPN"
./nordvpn -c
```

Or add NordVPN to your PATH in `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/c/Program Files/NordVPN"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Commands hang or timeout

**Solution**: Ensure the NordVPN Windows service is running. Check the system tray for the NordVPN icon. If not present, launch NordVPN from the Start Menu.

**Problem**: Interactive prompts fail in Git Bash's mintty terminal

**Solution**: Use winpty for interactive commands:

```bash
winpty "/c/Program Files/NordVPN/nordvpn" -c
```

---

## Post-Installation Configuration

After installing NordVPN on any platform, consider these common configurations.

### Enabling Auto-Connect

Configure NordVPN to connect automatically on system startup:

```bash
nordvpn set autoconnect on
```

To auto-connect to a specific country:

```bash
nordvpn set autoconnect on us
```

### Enabling Kill Switch

The Kill Switch blocks all internet traffic if the VPN connection drops:

```bash
nordvpn set killswitch on
```

### Changing Protocol

Switch between OpenVPN and NordLynx (WireGuard-based) protocols:

```bash
# Use NordLynx for better performance
nordvpn set technology nordlynx

# Use OpenVPN for compatibility
nordvpn set technology openvpn
```

### Enabling Threat Protection Lite

Block ads, trackers, and malicious websites:

```bash
nordvpn set threatprotectionlite on
```

### Token-Based Login for Automation

For headless servers and automated scripts, use access tokens instead of interactive login:

1. Generate a token at https://my.nordaccount.com (NordVPN > Advanced Settings > Access token)
2. Choose "Non-expiring token" for servers (enable MFA for security)
3. Login with the token:

```bash
nordvpn login --token YOUR_TOKEN_HERE
```

To preserve the token when logging out (for reuse):

```bash
nordvpn logout --persist-token
```

### Useful CLI Commands

```bash
# Connect to the fastest server
nordvpn connect

# Connect to a specific country
nordvpn connect us

# Connect to a specific city
nordvpn connect us new_york

# Connect to a P2P-optimized server
nordvpn connect p2p

# Disconnect
nordvpn disconnect

# Check current status
nordvpn status

# View current settings
nordvpn settings

# List available countries
nordvpn countries

# List cities in a country
nordvpn cities us
```

---

## Common Issues

### Issue: Permission Denied on Linux

**Symptoms**: `Whoops! Permission denied accessing /run/nordvpn/nordvpnd.sock`

**Solution**: Add your user to the nordvpn group and restart your session:

```bash
sudo usermod -aG nordvpn $USER
# Log out and log back in, or reboot
```

### Issue: Login Fails or Loops

**Symptoms**: `nordvpn login` opens browser but authentication fails

**Solution**: Use token-based login instead of browser-based login:

1. Generate an access token at https://my.nordaccount.com
2. Run: `nordvpn login --token YOUR_TOKEN_HERE`

### Issue: Cannot Connect to Servers

**Symptoms**: Connection attempts timeout or fail

**Solutions**:

- Verify your subscription is active at https://my.nordaccount.com
- Try a different server: `nordvpn connect us`
- Switch protocols: `nordvpn set technology openvpn`
- Check if firewall is blocking NordVPN

### Issue: DNS Leaks

**Symptoms**: Websites can detect your real location despite VPN

**Solutions**:

- Enable Threat Protection Lite: `nordvpn set threatprotectionlite on`
- On Windows with OpenVPN, add `block-outside-dns` to config files
- Verify with a DNS leak test at https://nordvpn.com/dns-leak-test/

### Issue: Slow Connection Speeds

**Symptoms**: VPN significantly reduces internet speed

**Solutions**:

- Switch to NordLynx protocol: `nordvpn set technology nordlynx`
- Connect to a closer server
- Check for network congestion

### Issue: Service Not Running on Linux

**Symptoms**: Commands fail with daemon connection errors

**Solutions**:

```bash
# Check service status
sudo systemctl status nordvpnd

# Start the service
sudo systemctl start nordvpnd

# Enable on boot
sudo systemctl enable nordvpnd
```

### Issue: Conflicting VPN Software

**Symptoms**: NordVPN fails to connect when other VPN software is installed

**Solution**: Disable or uninstall other VPN clients before using NordVPN. NordVPN should not run simultaneously with other VPN software.

---

## References

- [NordVPN Official Website](https://nordvpn.com)
- [NordVPN Download Page](https://nordvpn.com/download/)
- [Installing NordVPN on Linux](https://support.nordvpn.com/hc/en-us/articles/20196094470929-Installing-NordVPN-on-Linux-distributions)
- [NordVPN Linux Client (GitHub)](https://github.com/NordSecurity/nordvpn-linux)
- [How to Login Without GUI on Linux](https://support.nordvpn.com/hc/en-us/articles/20226600447633-How-to-log-in-to-NordVPN-on-Linux-devices-without-a-GUI)
- [NordVPN Windows CLI Usage](https://support.nordvpn.com/hc/en-us/articles/19919384880145-Connect-to-NordVPN-Windows-with-Command-Prompt)
- [NordVPN Configuration Files](https://nordvpn.com/blog/nordvpn-config-files/)
- [NordVPN Raspberry Pi Setup](https://support.nordvpn.com/hc/en-us/articles/20455204080913-How-to-configure-a-Raspberry-Pi)
- [NordVPN Homebrew Cask](https://formulae.brew.sh/cask/nordvpn)
- [NordVPN Chocolatey Package](https://community.chocolatey.org/packages/nordvpn)
- [NordVPN Snap Package](https://snapcraft.io/nordvpn)
- [NordVPN winget Package](https://winget.run/pkg/NordVPN/NordVPN)
