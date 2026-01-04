# Installing Tailscale

## Overview

Tailscale is a zero-configuration VPN service built on WireGuard that creates secure mesh networks (called tailnets) between your devices. It eliminates the complexity of traditional VPN setup by handling authentication, key exchange, and NAT traversal automatically. Tailscale is ideal for:

- **Remote access**: Securely connect to your home or office devices from anywhere
- **Developer environments**: Access development servers, databases, and services without exposing them to the public internet
- **Team networking**: Connect distributed teams with shared access to internal resources
- **IoT and home automation**: Securely reach Raspberry Pi devices, NAS systems, and smart home servers

Tailscale provides both GUI applications (for desktop platforms) and CLI-only daemons (for servers and headless systems).

## Prerequisites

Before installing Tailscale on any platform, ensure:

1. **Internet connectivity** - Required to download packages and authenticate with Tailscale
2. **Administrative privileges** - Required for system-wide installation and network configuration
3. **A Tailscale account** - Free tier supports up to 100 devices; sign up at https://tailscale.com
4. **curl** - Required on Linux platforms for the installation script

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

**Important**: There are three ways to run Tailscale on macOS. This guide documents the CLI-only Homebrew installation, which is recommended for servers and advanced users who prefer command-line management. For desktop use with a GUI, download the Standalone variant from https://tailscale.com/download instead.

#### Installation Steps

Run the following command to install the Tailscale CLI:

```bash
brew install --quiet tailscale
```

The `--quiet` flag suppresses non-essential output for cleaner automation logs.

Start the Tailscale daemon as a background service:

```bash
sudo brew services start tailscale
```

**Note**: The `sudo` prefix is required because Tailscale needs root privileges to configure network interfaces.

Connect to your Tailscale network:

```bash
sudo tailscale up
```

This command outputs an authentication URL. Open the URL in your browser to authenticate with your Tailscale account.

#### Verification

Confirm the installation succeeded:

```bash
tailscale --version
```

Expected output (version numbers may vary):

```
1.92.3
  tailscale commit: abcdef1234567890
  other commit: 1234567890abcdef
  go version: go1.25.5
```

Verify your Tailscale IP address:

```bash
tailscale ip -4
```

Check connection status:

```bash
tailscale status
```

#### Troubleshooting

**Problem**: `tailscale: command not found` after installation

**Solution**: The Homebrew binary path may not be in your PATH. Add it:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile
```

**Problem**: "cannot connect to local Tailscale daemon" error

**Solution**: The tailscaled service is not running. Start it:

```bash
sudo brew services start tailscale
```

**Problem**: Authentication URL not appearing

**Solution**: Check if tailscaled is running and try again:

```bash
sudo brew services restart tailscale
sudo tailscale up
```

**Problem**: Conflict with GUI Tailscale app

**Solution**: Do not install both the Homebrew CLI version and the GUI app (Standalone or Mac App Store). They conflict with each other. Choose one:

```bash
# If switching from GUI to CLI, first quit and delete the Tailscale app
# Then empty Trash and reboot before installing via Homebrew
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 (Bionic) or later, or Debian 10 (Buster) or later (64-bit or 32-bit)
- sudo privileges
- curl installed

If curl is not installed:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
```

#### Installation Steps

**Step 1: Run the official installation script**

Tailscale provides an automated installation script that detects your distribution and adds the appropriate repository:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

This script automatically:
- Detects your Ubuntu/Debian version
- Adds Tailscale's GPG signing key
- Configures the APT repository
- Installs the tailscale package
- Enables and starts the tailscaled service

**Step 2: Connect to your Tailscale network**

```bash
sudo tailscale up
```

This command outputs an authentication URL. Open the URL in your browser to authenticate with your Tailscale account.

#### Manual Installation (Alternative)

If you prefer not to use the installation script, add the repository manually.

**For Ubuntu (example using 24.04 Noble):**

```bash
# Add Tailscale's GPG key
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.noarmor.gpg | sudo tee /usr/share/keyrings/tailscale-archive-keyring.gpg >/dev/null

# Add the repository
curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.tailscale-keyring.list | sudo tee /etc/apt/sources.list.d/tailscale.list

# Install Tailscale
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tailscale

# Connect to your network
sudo tailscale up
```

**Note**: Replace `noble` with your Ubuntu codename. Find yours with `lsb_release -cs`. Common codenames: `focal` (20.04), `jammy` (22.04), `noble` (24.04).

**For Debian (example using Bookworm):**

```bash
# Add Tailscale's GPG key
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkgs.tailscale.com/stable/debian/bookworm.noarmor.gpg | sudo tee /usr/share/keyrings/tailscale-archive-keyring.gpg >/dev/null

# Add the repository
curl -fsSL https://pkgs.tailscale.com/stable/debian/bookworm.tailscale-keyring.list | sudo tee /etc/apt/sources.list.d/tailscale.list

# Install Tailscale
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tailscale

# Connect to your network
sudo tailscale up
```

**Note**: Replace `bookworm` with your Debian codename. Common codenames: `buster` (10), `bullseye` (11), `bookworm` (12), `trixie` (13).

#### Verification

Confirm the installation succeeded:

```bash
tailscale --version
```

Verify your Tailscale IP address:

```bash
tailscale ip -4
```

Check connection status:

```bash
tailscale status
```

Verify the service is running:

```bash
sudo systemctl status tailscaled
```

#### Troubleshooting

**Problem**: GPG key import fails

**Solution**: Ensure curl and ca-certificates are installed:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl gnupg
```

**Problem**: "Unable to locate package tailscale"

**Solution**: The repository was not added correctly. Verify the list file exists and contains the correct URL:

```bash
cat /etc/apt/sources.list.d/tailscale.list
```

Re-run the installation script if the file is missing or incorrect.

**Problem**: tailscaled service not running

**Solution**: Start and enable the service:

```bash
sudo systemctl enable --now tailscaled
```

**Problem**: DNS resolution issues after installation

**Solution**: Tailscale manages DNS for MagicDNS features. If you experience issues with non-Tailscale DNS, you can disable MagicDNS in the Tailscale admin console or run:

```bash
sudo tailscale set --accept-dns=false
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit) - Bullseye, Bookworm, or newer recommended
- Raspberry Pi 3, 4, or 5 (64-bit capable hardware recommended)
- sudo privileges
- curl installed

Verify your architecture to understand which packages will be used:

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
curl -fsSL https://tailscale.com/install.sh | sh
```

The script automatically detects Raspberry Pi OS and configures the appropriate repository for your architecture.

**Step 2: Connect to your Tailscale network**

```bash
sudo tailscale up
```

This command outputs an authentication URL. Open the URL in your browser (on any device) to authenticate with your Tailscale account.

#### Manual Installation (Alternative)

If you prefer manual installation:

**For 64-bit Raspberry Pi OS (aarch64):**

```bash
# Add Tailscale's GPG key
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkgs.tailscale.com/stable/debian/bookworm.noarmor.gpg | sudo tee /usr/share/keyrings/tailscale-archive-keyring.gpg >/dev/null

# Add the repository (uses Debian arm64 packages)
curl -fsSL https://pkgs.tailscale.com/stable/debian/bookworm.tailscale-keyring.list | sudo tee /etc/apt/sources.list.d/tailscale.list

# Install Tailscale
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tailscale

# Connect to your network
sudo tailscale up
```

**For 32-bit Raspberry Pi OS (armv7l):**

```bash
# Add Tailscale's GPG key (using legacy apt-key for older Raspbian)
curl -fsSL https://pkgs.tailscale.com/stable/raspbian/bookworm.gpg | sudo apt-key add -

# Add the repository
curl -fsSL https://pkgs.tailscale.com/stable/raspbian/bookworm.list | sudo tee /etc/apt/sources.list.d/tailscale.list

# Install Tailscale
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tailscale

# Connect to your network
sudo tailscale up
```

**Note**: Replace `bookworm` with your Raspberry Pi OS codename. Find yours with `cat /etc/os-release | grep VERSION_CODENAME`. Common codenames: `buster` (Raspbian 10), `bullseye` (Raspberry Pi OS 11), `bookworm` (Raspberry Pi OS 12).

#### Disabling Key Expiry for Always-On Devices

Raspberry Pis often run as always-on servers. By default, Tailscale keys expire after 180 days, requiring re-authentication. For headless devices, disable key expiry in the Tailscale admin console:

1. Go to https://login.tailscale.com/admin/machines
2. Find your Raspberry Pi in the list
3. Click the three-dot menu and select "Disable key expiry"

**Security Warning**: Disabling key expiry reduces security. Only use this for trusted devices and revoke the key immediately if the device is lost or compromised.

#### Verification

Confirm the installation succeeded:

```bash
tailscale --version
```

Verify your Tailscale IP address:

```bash
tailscale ip -4
```

Check connection status:

```bash
tailscale status
```

#### Troubleshooting

**Problem**: Slow installation or downloads

**Solution**: Raspberry Pi SD cards can be slow. Consider using a high-quality Class 10 or faster SD card, or boot from USB/SSD.

**Problem**: apt-key deprecation warning on newer systems

**Solution**: Use the keyring method instead of apt-key (as shown in the 64-bit instructions). The installation script handles this automatically.

**Problem**: Cannot reach other Tailscale devices

**Solution**: Verify the tailscaled service is running:

```bash
sudo systemctl status tailscaled
```

If not running, start it:

```bash
sudo systemctl enable --now tailscaled
sudo tailscale up
```

**Problem**: Raspberry Pi loses Tailscale connection after reboot

**Solution**: Ensure tailscaled starts at boot:

```bash
sudo systemctl enable tailscaled
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023, Amazon Linux 2, RHEL 7/8/9, or CentOS 7/8/9
- sudo privileges

**Note**: Amazon Linux 2023 uses DNF as the package manager. Amazon Linux 2, RHEL 7, and CentOS 7 use YUM. The commands below specify which package manager to use.

#### Installation Steps

**Option A: Use the official installation script (Recommended)**

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

The script automatically detects your distribution and version, then configures the appropriate repository.

After installation, connect to your Tailscale network:

```bash
sudo tailscale up
```

**Option B: Manual installation**

**For Amazon Linux 2023 (DNF):**

```bash
# Add Tailscale repository
sudo dnf config-manager --add-repo https://pkgs.tailscale.com/stable/amazon-linux/2023/tailscale.repo

# Install Tailscale
sudo dnf install -y tailscale

# Enable and start the service
sudo systemctl enable --now tailscaled

# Connect to your network
sudo tailscale up
```

**For Amazon Linux 2 (YUM):**

```bash
# Install yum-utils if not present
sudo yum install -y yum-utils

# Add Tailscale repository
sudo yum-config-manager --add-repo https://pkgs.tailscale.com/stable/amazon-linux/2/tailscale.repo

# Install Tailscale
sudo yum install -y tailscale

# Enable and start the service
sudo systemctl enable --now tailscaled

# Connect to your network
sudo tailscale up
```

**For RHEL 8/9 or CentOS 8/9 (DNF):**

```bash
# Add Tailscale repository (replace 9 with your version: 7, 8, or 9)
sudo dnf config-manager --add-repo https://pkgs.tailscale.com/stable/rhel/9/tailscale.repo

# Install Tailscale
sudo dnf install -y tailscale

# Enable and start the service
sudo systemctl enable --now tailscaled

# Connect to your network
sudo tailscale up
```

**For RHEL 7 or CentOS 7 (YUM):**

```bash
# Install yum-utils if not present
sudo yum install -y yum-utils

# Add Tailscale repository
sudo yum-config-manager --add-repo https://pkgs.tailscale.com/stable/rhel/7/tailscale.repo

# Install Tailscale
sudo yum install -y tailscale

# Enable and start the service
sudo systemctl enable --now tailscaled

# Connect to your network
sudo tailscale up
```

#### Verification

Confirm the installation succeeded:

```bash
tailscale --version
```

Verify your Tailscale IP address:

```bash
tailscale ip -4
```

Check connection status:

```bash
tailscale status
```

Verify the service is running:

```bash
sudo systemctl status tailscaled
```

#### Troubleshooting

**Problem**: "No package tailscale available"

**Solution**: The repository was not added correctly. Verify it exists:

```bash
ls /etc/yum.repos.d/ | grep tailscale
cat /etc/yum.repos.d/tailscale.repo
```

Re-add the repository if missing.

**Problem**: Repository GPG key verification fails

**Solution**: Import the GPG key manually:

```bash
sudo rpm --import https://pkgs.tailscale.com/stable/rhel/repo.gpg
```

**Problem**: SELinux blocking Tailscale

**Solution**: On RHEL/CentOS with SELinux enforcing, you may need to allow Tailscale:

```bash
sudo setsebool -P tailscaled_use_all_interfaces 1
```

Or temporarily set SELinux to permissive to diagnose:

```bash
sudo setenforce 0
```

**Problem**: firewalld blocking Tailscale traffic

**Solution**: Tailscale should work with firewalld, but if you have issues:

```bash
sudo firewall-cmd --zone=trusted --add-interface=tailscale0 --permanent
sudo firewall-cmd --reload
```

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

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install tailscale -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

After installation, Tailscale will be available in your Start Menu. Launch it to complete the setup.

Alternatively, connect from the command line:

```powershell
tailscale up
```

This opens your default browser to authenticate with your Tailscale account.

#### Alternative: winget Installation

If you prefer winget over Chocolatey:

```powershell
winget install --id Tailscale.Tailscale --silent --accept-package-agreements --accept-source-agreements
```

#### Verification

Open a new Command Prompt or PowerShell window, then run:

```powershell
tailscale --version
```

Expected output (version numbers may vary):

```
1.92.3
```

Verify your Tailscale IP address:

```powershell
tailscale ip -4
```

Check connection status:

```powershell
tailscale status
```

#### Troubleshooting

**Problem**: `tailscale: The term 'tailscale' is not recognized`

**Solution**: Close and reopen your terminal to pick up PATH changes. If the problem persists, Tailscale may not be in your PATH. Add it manually:

```powershell
$env:Path += ";C:\Program Files\Tailscale"
```

Or add permanently via System Properties > Environment Variables.

**Problem**: Tailscale service not running

**Solution**: Start the Tailscale service:

```powershell
Start-Service Tailscale
```

Or start the Tailscale GUI application from the Start Menu.

**Problem**: VPN conflicts with other software

**Solution**: Tailscale is designed to coexist with most VPNs, but some corporate VPN clients may conflict. Contact your IT department or consult Tailscale's documentation for compatibility information.

**Problem**: winget downloads wrong architecture

**Solution**: This is a known winget issue. Use Chocolatey instead, or download the MSI installer directly from https://pkgs.tailscale.com/stable/#windows and specify the correct architecture (amd64 for 64-bit).

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

**Important Recommendation**: If you need Tailscale on both Windows and WSL, install Tailscale on the Windows host only (see Windows section). The Windows Tailscale client provides network access that is visible to WSL 2 automatically. Running Tailscale in both Windows and WSL simultaneously can cause conflicts.

#### Installation Steps

If you specifically need Tailscale running inside WSL (not recommended for most users), follow these steps.

**Step 1: Install Tailscale in WSL**

Open your WSL Ubuntu terminal and run:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

**Step 2: Start the Tailscale daemon**

WSL does not use systemd by default, so Tailscale cannot run as a service. Start it manually:

```bash
sudo tailscaled &
```

Wait a few seconds for the daemon to initialize, then connect:

```bash
sudo tailscale up
```

This outputs an authentication URL. Copy it and open in your browser to authenticate.

#### Starting Tailscale Automatically in WSL

Since WSL does not support systemd, add this to your `~/.bashrc` to start Tailscale when you open a WSL terminal:

```bash
# Start tailscaled if not already running
if ! pgrep -x tailscaled > /dev/null; then
    sudo tailscaled > /dev/null 2>&1 &
    sleep 2
fi
```

Configure passwordless sudo for tailscaled (to avoid password prompts):

```bash
echo "$USER ALL=(ALL) NOPASSWD: /usr/sbin/tailscaled" | sudo tee /etc/sudoers.d/tailscaled
sudo chmod 0440 /etc/sudoers.d/tailscaled
```

#### Verification

Confirm the installation succeeded:

```bash
tailscale --version
```

Verify your Tailscale IP address:

```bash
tailscale ip -4
```

Check connection status:

```bash
tailscale status
```

#### Troubleshooting

**Problem**: "cannot connect to local Tailscale daemon"

**Solution**: The tailscaled process is not running. Start it:

```bash
sudo tailscaled &
sleep 2
sudo tailscale up
```

**Problem**: DNS resolution broken after installing Tailscale

**Solution**: Tailscale modifies `/etc/resolv.conf` for MagicDNS. If this breaks regular DNS, disable Tailscale DNS:

```bash
sudo tailscale set --accept-dns=false
```

Or manually restore `/etc/resolv.conf`:

```bash
sudo rm /etc/resolv.conf
sudo bash -c 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'
```

**Problem**: Encrypted traffic fails when Tailscale runs on both Windows and WSL

**Solution**: This is expected behavior. Tailscale should run on the Windows host only, not in WSL. Uninstall from WSL:

```bash
sudo apt-get remove -y tailscale
```

Then use the Windows Tailscale client.

**Problem**: MTU-related connectivity issues

**Solution**: WSL 2 has a default MTU of 1280 which is too small for Tailscale. The tailscaled daemon should raise it automatically, but if issues persist:

```bash
sudo ip link set dev eth0 mtu 1340
```

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Tailscale installed on Windows (see Windows section)

**Note**: Git Bash on Windows does not require a separate Tailscale installation. Git Bash inherits the Windows PATH, so once Tailscale is installed on Windows, the `tailscale` command is automatically available in Git Bash.

#### Installation Steps

1. Install Tailscale on Windows using Chocolatey (see Windows section):

```bash
# Run from Administrator PowerShell or Command Prompt
choco install tailscale -y
```

2. Start Tailscale from the Windows Start Menu or system tray

3. Open Git Bash - the `tailscale` command will be available

#### Verification

In Git Bash, confirm Tailscale is accessible:

```bash
tailscale --version
```

Expected output (version numbers may vary):

```
1.92.3
```

Verify your Tailscale IP address:

```bash
tailscale ip -4
```

Check connection status:

```bash
tailscale status
```

#### Troubleshooting

**Problem**: `tailscale: command not found` in Git Bash

**Solution**: The Tailscale path may not be inherited. Add it to your `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/c/Program Files/Tailscale"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Tailscale commands hang or timeout

**Solution**: Ensure the Tailscale Windows service is running. Check the system tray for the Tailscale icon. If not present, start Tailscale from the Start Menu.

**Problem**: Interactive prompts fail in Git Bash

**Solution**: Some Tailscale commands may not work interactively in Git Bash's mintty terminal. Use Windows Command Prompt or PowerShell for those operations, or prefix with `winpty`:

```bash
winpty tailscale login
```

---

## Post-Installation Configuration

After installing Tailscale on any platform, consider these common configurations.

### Enabling Tailscale SSH

Tailscale SSH allows you to SSH between machines in your tailnet without managing SSH keys:

```bash
sudo tailscale set --ssh
```

Then SSH using Tailscale hostnames:

```bash
ssh user@hostname
```

### Advertising Exit Nodes

To use a machine as an exit node (route all traffic through it):

```bash
sudo tailscale up --advertise-exit-node
```

On the client machine, use the exit node:

```bash
sudo tailscale up --exit-node=<exit-node-hostname>
```

### Advertising Subnet Routes

To make a local network accessible via Tailscale:

```bash
sudo tailscale up --advertise-routes=192.168.1.0/24
```

Approve the route in the Tailscale admin console at https://login.tailscale.com/admin/machines.

### MagicDNS

MagicDNS is enabled by default and allows you to reach machines by their hostname (e.g., `ssh myserver` instead of `ssh 100.x.y.z`). To disable it:

```bash
sudo tailscale set --accept-dns=false
```

### Checking Your Tailscale Status

View all connected machines and their IPs:

```bash
tailscale status
```

Get your Tailscale IPv4 and IPv6 addresses:

```bash
tailscale ip
```

---

## Common Issues

### Issue: Authentication Loop

**Symptoms**: `tailscale up` keeps asking for authentication

**Solutions**:

- Ensure you complete the authentication in your browser
- Check that your machine appears in the admin console at https://login.tailscale.com/admin/machines
- If using an auth key, ensure it is valid and not expired

### Issue: Cannot Reach Other Tailscale Devices

**Symptoms**: Ping or connection to other tailnet devices times out

**Solutions**:

- Verify both devices are connected: `tailscale status`
- Check for firewall rules blocking Tailscale traffic
- Ensure the tailscaled service is running on both devices
- Try restarting Tailscale: `sudo tailscale down && sudo tailscale up`

### Issue: Key Expiry

**Symptoms**: Device disconnects after 180 days

**Solutions**:

- Re-authenticate: `sudo tailscale up`
- For servers/always-on devices, disable key expiry in the admin console

### Issue: Slow Connection or High Latency

**Symptoms**: Connections work but are slow

**Solutions**:

- Check if traffic is being relayed (DERP): `tailscale netcheck`
- Ensure UDP port 41641 is not blocked by firewalls
- Direct connections are faster; relay is used as fallback

### Issue: Tailscale Conflicts with Another VPN

**Symptoms**: Tailscale or other VPN stops working when both are active

**Solutions**:

- Tailscale is designed to coexist with most VPNs
- If conflict occurs, consult https://tailscale.com/kb/1105/other-vpns/
- As a workaround, disconnect the other VPN when using Tailscale

### Issue: DNS Resolution Failures

**Symptoms**: Cannot resolve hostnames after enabling Tailscale

**Solutions**:

- Tailscale manages DNS for MagicDNS; this is expected behavior
- To use your original DNS: `sudo tailscale set --accept-dns=false`
- Restart your browser or clear DNS cache after changing settings

---

## References

- [Tailscale Official Documentation](https://tailscale.com/kb/)
- [Install Tailscale on macOS](https://tailscale.com/kb/1016/install-mac)
- [Three Ways to Run Tailscale on macOS](https://tailscale.com/kb/1065/macos-variants)
- [Install Tailscale on Linux](https://tailscale.com/kb/1031/install-linux)
- [Install Tailscale on Windows](https://tailscale.com/kb/1022/install-windows)
- [Install Tailscale on Windows with MSI](https://tailscale.com/kb/1189/install-windows-msi)
- [Install Tailscale in WSL 2](https://tailscale.com/kb/1295/install-windows-wsl2)
- [Tailscale Packages Repository](https://pkgs.tailscale.com/stable/)
- [Tailscale Homebrew Formula](https://formulae.brew.sh/formula/tailscale)
- [Tailscale Chocolatey Package](https://community.chocolatey.org/packages/tailscale)
- [Tailscale GitHub Repository](https://github.com/tailscale/tailscale)
- [Tailscale Download Page](https://tailscale.com/download)
