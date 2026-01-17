# Installing Cloudflare WARP

## Overview

Cloudflare WARP is a VPN client that encrypts all traffic leaving your device and routes it through Cloudflare's global network. Built on the WireGuard protocol, WARP provides fast, secure connections while protecting your privacy from ISP snooping and network-level tracking. WARP operates in several modes:

- **WARP mode** (default): Encrypts all traffic (including DNS) and routes it through Cloudflare's network
- **1.1.1.1 mode**: Only encrypts DNS traffic to Cloudflare's 1.1.1.1 resolver
- **WARP+ mode**: Premium tier with optimized routing through Cloudflare's Argo network for improved performance

WARP is available for personal use (free) and as part of Cloudflare Zero Trust for enterprise deployments. This guide covers the personal/consumer installation.

## Prerequisites

Before installing Cloudflare WARP on any platform, ensure:

1. **Internet connectivity** - Required to download packages and register with Cloudflare
2. **Administrative privileges** - Required for system-wide installation and network configuration
3. **No conflicting VPN software** - Uninstall or disable other VPN clients that may interfere with WARP

**Important**: Cloudflare recommends uninstalling any existing third-party VPN software before installing WARP. VPN software in a disconnected or disabled state can still interfere with the WARP client.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `Homebrew` - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- **Optional:** None
- **Auto-installed:** None (WARP is a complete package)

### Ubuntu (APT/Snap)
- **Required:**
  - `curl` - Install via `sudo apt-get install -y curl`
  - `gpg` - Install via `sudo apt-get install -y gpg` (usually pre-installed)
  - `lsb-release` - Install via `sudo apt-get install -y lsb-release`
- **Optional:** None
- **Auto-installed:**
  - GPG signing key (added during repository setup)
  - APT repository configuration
  - `cloudflare-warp` package dependencies (handled by APT)

### Raspberry Pi OS (APT/Snap)
- **Required:** None (WARP is not officially supported on ARM Linux)
- **Note:** Cloudflare WARP client is not available for ARM architecture (neither 32-bit nor 64-bit). See the Raspberry Pi OS section for alternative approaches.

### Amazon Linux (DNF/YUM)
- **Required:**
  - `curl` - Install via `sudo dnf install -y curl` or `sudo yum install -y curl`
- **Optional:** None
- **Auto-installed:**
  - Repository configuration (added via .repo file)
  - `cloudflare-warp` package dependencies (handled by DNF/YUM)

### Windows (Chocolatey/winget)
- **Required:**
  - `Chocolatey` - Install via PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
- **Optional:**
  - `winget` - Alternative package manager (pre-installed on Windows 11 and recent Windows 10)
- **Auto-installed:** None (WARP is a complete package)

### Git Bash (Manual/Portable)
- **Required:**
  - `Chocolatey` on Windows host - Install via PowerShell (see Windows section above)
  - Cloudflare WARP installed on Windows host (Git Bash inherits Windows PATH)
- **Optional:** None
- **Auto-installed:** None (Git Bash uses the Windows host's WARP installation)

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Cloudflare WARP:

```bash
brew install --quiet --cask cloudflare-warp
```

The `--quiet` flag suppresses non-essential output, and `--cask` specifies the graphical application (WARP is a GUI application on macOS).

After installation, launch Cloudflare WARP from the Applications folder or via command line:

```bash
open -a "Cloudflare WARP"
```

The WARP icon will appear in your menu bar. Click it to access settings and enable WARP.

**Note**: On first launch, WARP will request permission to add VPN configurations. Click "Allow" when prompted.

#### Verification

Confirm the installation succeeded by checking the application is running (look for the WARP icon in the menu bar).

Verify WARP is connected by running:

```bash
curl -s https://www.cloudflare.com/cdn-cgi/trace/ | grep warp
```

Expected output when WARP is active:

```
warp=on
```

Alternatively, use the warp-cli (located in the application bundle):

```bash
/Applications/Cloudflare\ WARP.app/Contents/Resources/warp-cli status
```

#### Troubleshooting

**Problem**: WARP icon does not appear in menu bar

**Solution**: Ensure WARP is running. Launch it manually:

```bash
open -a "Cloudflare WARP"
```

**Problem**: "VPN configuration" permission prompt keeps appearing

**Solution**: Grant the permission in System Preferences > Privacy & Security > Privacy > VPN Configurations. If issues persist, remove and reinstall WARP:

```bash
brew uninstall --cask cloudflare-warp
brew install --quiet --cask cloudflare-warp
```

**Problem**: warp-cli command not found

**Solution**: The CLI is bundled inside the application. Use the full path:

```bash
/Applications/Cloudflare\ WARP.app/Contents/Resources/warp-cli --help
```

Or create an alias in your shell profile:

```bash
echo 'alias warp-cli="/Applications/Cloudflare\ WARP.app/Contents/Resources/warp-cli"' >> ~/.zshrc
source ~/.zshrc
```

**Problem**: Conflict with other VPN applications

**Solution**: Disable or uninstall other VPN software. WARP and other VPNs often cannot run simultaneously.

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 (Focal), 22.04 (Jammy), or 24.04 (Noble), or Debian 10 (Buster) through 13 (Trixie)
- 64-bit (x86_64/amd64) architecture only (ARM is not supported)
- sudo privileges

Verify your architecture:

```bash
uname -m
```

Expected output: `x86_64`. If you see `aarch64` or `armv7l`, WARP is not supported on your system.

#### Installation Steps

**Step 1: Add the Cloudflare GPG key**

```bash
curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
```

**Step 2: Add the Cloudflare repository**

```bash
echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflare-client.list
```

**Step 3: Update package lists and install WARP**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y cloudflare-warp
```

**Step 4: Register and connect**

Register your device with Cloudflare:

```bash
warp-cli registration new
```

Connect to WARP:

```bash
warp-cli connect
```

#### Verification

Confirm the installation succeeded:

```bash
warp-cli --version
```

Check the connection status:

```bash
warp-cli status
```

Expected output when connected:

```
Status update: Connected
```

Verify WARP is routing your traffic:

```bash
curl -s https://www.cloudflare.com/cdn-cgi/trace/ | grep warp
```

Expected output:

```
warp=on
```

#### Troubleshooting

**Problem**: `E: Unable to locate package cloudflare-warp`

**Solution**: The repository was not added correctly or your distribution is not supported. Verify the repository file:

```bash
cat /etc/apt/sources.list.d/cloudflare-client.list
```

If empty or incorrect, repeat Steps 1 and 2.

**Problem**: GPG key errors

**Solution**: The GPG key may have expired or was not installed correctly. Re-add the key:

```bash
curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
```

**Note**: As of 2025, the Cloudflare public key was updated. If you installed the key before September 2025, you must re-run the GPG key installation command.

**Problem**: `warp-cli: command not found` after installation

**Solution**: The warp-svc service may not be running. Start it:

```bash
sudo systemctl enable --now warp-svc
```

**Problem**: Registration fails

**Solution**: Ensure you have internet connectivity and the warp-svc service is running:

```bash
sudo systemctl status warp-svc
```

If the service is not running, start it:

```bash
sudo systemctl start warp-svc
```

**Problem**: DNS resolution issues after enabling WARP

**Solution**: WARP modifies DNS settings. If you experience issues, you can check your current DNS:

```bash
warp-cli dns log
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

**Important**: Cloudflare WARP client is NOT officially supported on ARM Linux architectures. This includes all Raspberry Pi devices running Raspberry Pi OS (both 32-bit and 64-bit).

The official WARP client packages are only available for:
- x86_64 (amd64) architecture on Linux

#### Alternative Approach: Using WGCF with WireGuard

If you need WARP functionality on Raspberry Pi, you can use an unofficial workaround that combines `wgcf` (a third-party tool) with WireGuard:

**Step 1: Install WireGuard**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wireguard wireguard-tools
```

**Step 2: Download and install wgcf**

Determine your architecture:

```bash
uname -m
```

Download the appropriate wgcf binary:

```bash
# For 64-bit Raspberry Pi (aarch64)
curl -fsSL -o wgcf https://github.com/ViRb3/wgcf/releases/download/v2.2.22/wgcf_2.2.22_linux_arm64
chmod +x wgcf
sudo mv wgcf /usr/local/bin/
```

```bash
# For 32-bit Raspberry Pi (armv7l)
curl -fsSL -o wgcf https://github.com/ViRb3/wgcf/releases/download/v2.2.22/wgcf_2.2.22_linux_armv7
chmod +x wgcf
sudo mv wgcf /usr/local/bin/
```

**Step 3: Register with Cloudflare WARP**

```bash
wgcf register
```

This creates a `wgcf-account.toml` file with your registration.

**Step 4: Generate WireGuard configuration**

```bash
wgcf generate
```

This creates a `wgcf-profile.conf` file.

**Step 5: Configure WireGuard**

```bash
sudo cp wgcf-profile.conf /etc/wireguard/wgcf.conf
```

**Step 6: Connect to WARP via WireGuard**

```bash
sudo wg-quick up wgcf
```

To disconnect:

```bash
sudo wg-quick down wgcf
```

To enable automatic connection at boot:

```bash
sudo systemctl enable wg-quick@wgcf
```

#### Verification

Check the WireGuard interface status:

```bash
sudo wg show
```

Verify WARP is active:

```bash
curl -s https://www.cloudflare.com/cdn-cgi/trace/ | grep warp
```

Expected output:

```
warp=on
```

#### Troubleshooting

**Problem**: WireGuard fails to start with kernel errors

**Solution**: Ensure the WireGuard kernel module is loaded:

```bash
sudo modprobe wireguard
```

If the module is not available, you may need to update your kernel:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
sudo reboot
```

**Problem**: DNS resolution fails when connected

**Solution**: The wgcf-profile.conf may override your DNS. Edit `/etc/wireguard/wgcf.conf` and adjust the DNS line if needed.

**Disclaimer**: This workaround uses third-party tools and is not officially supported by Cloudflare. Use at your own risk.

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), RHEL 8, CentOS 8, or compatible distributions
- 64-bit (x86_64) architecture only
- sudo privileges

**Note**: Amazon Linux 2 (AL2) may work but is not officially listed as supported. Amazon Linux 2023 uses DNF; RHEL 8/CentOS 8 can use either DNF or YUM.

#### Installation Steps

**Step 1: Add the Cloudflare repository**

```bash
curl -fsSl https://pkg.cloudflareclient.com/cloudflare-warp-ascii.repo | sudo tee /etc/yum.repos.d/cloudflare-warp.repo
```

**Step 2: Update the package cache and install WARP**

For DNF-based systems (Amazon Linux 2023, RHEL 8+):

```bash
sudo dnf update -y
sudo dnf install -y cloudflare-warp
```

For YUM-based systems:

```bash
sudo yum update -y
sudo yum install -y cloudflare-warp
```

**Step 3: Enable and start the WARP service**

```bash
sudo systemctl enable --now warp-svc
```

**Step 4: Register and connect**

Register your device with Cloudflare:

```bash
warp-cli registration new
```

Connect to WARP:

```bash
warp-cli connect
```

#### Verification

Confirm the installation succeeded:

```bash
warp-cli --version
```

Check the connection status:

```bash
warp-cli status
```

Expected output when connected:

```
Status update: Connected
```

Verify WARP is routing your traffic:

```bash
curl -s https://www.cloudflare.com/cdn-cgi/trace/ | grep warp
```

Expected output:

```
warp=on
```

#### Troubleshooting

**Problem**: `No package cloudflare-warp available`

**Solution**: The repository was not added correctly. Verify it exists:

```bash
ls /etc/yum.repos.d/ | grep cloudflare
cat /etc/yum.repos.d/cloudflare-warp.repo
```

Re-add the repository if missing.

**Problem**: GPG key verification fails

**Solution**: Import the GPG key manually:

```bash
sudo rpm --import https://pkg.cloudflareclient.com/pubkey.gpg
```

If you previously had an older key installed, remove it first:

```bash
sudo rpm -e 'gpg-pubkey(4fa1c3ba-61abda35)' 2>/dev/null || true
sudo rpm --import https://pkg.cloudflareclient.com/pubkey.gpg
```

**Problem**: warp-svc service fails to start

**Solution**: Check the service status and logs:

```bash
sudo systemctl status warp-svc
sudo journalctl -u warp-svc -n 50
```

**Problem**: SELinux blocking WARP

**Solution**: If SELinux is in enforcing mode and blocking WARP, you can temporarily set it to permissive for testing:

```bash
sudo setenforce 0
```

For a permanent solution, create an SELinux policy for WARP (consult Cloudflare documentation for details).

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 1909 or later (64-bit)
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install warp -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

After installation, Cloudflare WARP will be available in your Start Menu and system tray. Launch it to complete the initial setup.

#### Alternative: winget Installation

If you prefer winget over Chocolatey:

```powershell
winget install --id Cloudflare.Warp --silent --accept-package-agreements --accept-source-agreements
```

#### Verification

Open a new Command Prompt or PowerShell window, then confirm WARP is running by checking the system tray for the WARP icon (a stylized "1").

Verify WARP is active:

```powershell
curl -s https://www.cloudflare.com/cdn-cgi/trace/ | findstr warp
```

Expected output when WARP is enabled:

```
warp=on
```

#### File Locations

- **Application**: `C:\Program Files\Cloudflare\Cloudflare WARP\Cloudflare WARP.exe`
- **Service**: `C:\Program Files\Cloudflare\Cloudflare WARP\warp-svc.exe`
- **Service Logs**: `C:\ProgramData\Cloudflare`
- **GUI Logs**: `C:\Users\<username>\AppData\Local\Cloudflare`

#### Troubleshooting

**Problem**: WARP fails to install with WebView error

**Solution**: This is a known issue with some winget installations. Use Chocolatey instead:

```powershell
choco install warp -y
```

**Problem**: WARP icon does not appear in system tray

**Solution**: The WARP application may not have started. Launch it from the Start Menu:

1. Open Start Menu
2. Search for "Cloudflare WARP"
3. Click to launch

**Problem**: "Cannot start service CloudflareWARP" error

**Solution**: The WARP service may have failed to start. Restart it:

```powershell
Restart-Service CloudflareWARP
```

Or from Services (services.msc), find "Cloudflare WARP" and restart it.

**Problem**: Windows 11 24H2 performance issues (mouse lag, audio crackling)

**Solution**: This is a known Microsoft regression. Update to Windows 11 24H2 version KB5060829 or higher.

**Problem**: Conflict with other VPN software

**Solution**: Uninstall or disable other VPN clients before using WARP. Check Settings > Apps for VPN software and remove it.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- WSL 2 installed with Ubuntu distribution
- WARP installed on the Windows host (recommended)

**Important**: The recommended approach is to install WARP on the Windows host, not inside WSL. When WARP runs on Windows, WSL 2 traffic is automatically protected.

#### Recommended Approach: Windows Host Installation

Install WARP on Windows using Chocolatey (see Windows section):

```powershell
choco install warp -y
```

WSL 2 traffic will be routed through the Windows WARP client automatically.

#### Alternative: WARP Inside WSL (Not Recommended)

If you need WARP running directly inside WSL (not recommended due to networking complexities), follow these steps.

**Known Limitation**: Installing WARP inside WSL 2 has known issues because Windows WARP uses WinDivert which operates in Windows user-land, and WSL 2's networking bypasses it.

**Step 1: Install WARP in WSL Ubuntu**

```bash
curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflare-client.list

sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y cloudflare-warp
```

**Step 2: Start the WARP service manually**

WSL does not use systemd by default, so start warp-svc manually:

```bash
sudo warp-svc &
sleep 3
```

**Step 3: Register and connect**

```bash
warp-cli registration new
warp-cli connect
```

#### Starting WARP Automatically in WSL

Add this to your `~/.bashrc`:

```bash
# Start warp-svc if not already running
if ! pgrep -x warp-svc > /dev/null; then
    sudo warp-svc > /dev/null 2>&1 &
    sleep 2
fi
```

Configure passwordless sudo for warp-svc:

```bash
echo "$USER ALL=(ALL) NOPASSWD: /usr/bin/warp-svc" | sudo tee /etc/sudoers.d/warp-svc
sudo chmod 0440 /etc/sudoers.d/warp-svc
```

#### Workaround: Using wsl-vpnkit

For better WSL 2 VPN compatibility, consider using wsl-vpnkit:

```bash
# Download and install wsl-vpnkit from https://github.com/sakai135/wsl-vpnkit
```

This tool helps WSL 2 work correctly with VPNs running on the Windows host.

#### Verification

Check WARP status:

```bash
warp-cli status
```

Verify WARP is active:

```bash
curl -s https://www.cloudflare.com/cdn-cgi/trace/ | grep warp
```

#### Troubleshooting

**Problem**: "Cannot connect to local Tailscale daemon" (similar error for WARP)

**Solution**: The warp-svc process is not running. Start it:

```bash
sudo warp-svc &
sleep 3
warp-cli status
```

**Problem**: Registration fails because browser cannot open

**Solution**: WSL has no GUI by default. When `warp-cli registration new` requires browser authentication, copy the URL and open it in your Windows browser manually.

**Problem**: WARP works on Windows but not in WSL

**Solution**: If WARP is installed on Windows, ensure you have WSL 2 (not WSL 1):

```powershell
wsl -l -v
```

If using WSL 1, upgrade to WSL 2:

```powershell
wsl --set-version <distro-name> 2
```

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Cloudflare WARP installed on Windows (see Windows section)

**Note**: Git Bash on Windows does not require a separate WARP installation. Git Bash inherits the Windows PATH, and WARP runs as a Windows service. Once WARP is installed on Windows, the protection applies to all network traffic from the machine, including Git Bash.

#### Installation Steps

1. Install Cloudflare WARP on Windows using Chocolatey (see Windows section):

```bash
# Run from Administrator PowerShell or Command Prompt
choco install warp -y
```

2. Launch Cloudflare WARP from the Windows Start Menu

3. Enable WARP by clicking the toggle in the WARP application

4. Open Git Bash - all network traffic is now routed through WARP

#### Verification

In Git Bash, verify WARP is active:

```bash
curl -s https://www.cloudflare.com/cdn-cgi/trace/ | grep warp
```

Expected output:

```
warp=on
```

#### Troubleshooting

**Problem**: WARP is not protecting Git Bash traffic

**Solution**: WARP is a system-wide VPN that protects all traffic. Ensure WARP is enabled in the Windows system tray application. Click the WARP icon and verify the toggle is ON.

**Problem**: Git operations fail when WARP is enabled

**Solution**: Some corporate networks or Git hosts may have issues with WARP. Try:

1. Temporarily disable WARP for the operation
2. Add the Git host to WARP's split tunnel exclusion list (in WARP settings)

**Problem**: curl or wget commands timeout

**Solution**: Ensure WARP is connected and not in a "Connecting" state. Check the system tray icon. If stuck, try:

1. Click the WARP system tray icon
2. Click the toggle to disconnect
3. Wait a few seconds
4. Click the toggle to reconnect

---

## Post-Installation Configuration

After installing Cloudflare WARP on any platform, consider these common configurations.

### Switching WARP Modes

WARP supports several operational modes:

```bash
# Set to full WARP mode (default, encrypts all traffic)
warp-cli mode warp

# Set to DNS-only mode (1.1.1.1)
warp-cli mode doh

# Set to WARP with DNS-over-HTTPS
warp-cli mode warp+doh

# Set to proxy mode (SOCKS5 proxy on localhost)
warp-cli mode proxy
```

### Checking Connection Status

View your current WARP status:

```bash
warp-cli status
```

View your Cloudflare trace information:

```bash
curl -s https://www.cloudflare.com/cdn-cgi/trace/
```

Key fields in the trace output:
- `warp=on` - WARP is active
- `warp=off` - WARP is not active
- `gateway=on` - Connected via Cloudflare Gateway (Zero Trust)

### Viewing Connection Statistics

Display connection statistics:

```bash
warp-cli stats
```

### Generating Diagnostic Information

Create a diagnostic bundle for troubleshooting:

```bash
# Linux
sudo warp-diag
```

This creates a `warp-debugging-info.zip` file in the current directory.

### Disconnecting and Reconnecting

```bash
# Disconnect from WARP
warp-cli disconnect

# Reconnect to WARP
warp-cli connect
```

### Resetting WARP Registration

If you need to re-register your device:

```bash
# Delete current registration
warp-cli registration delete

# Create new registration
warp-cli registration new
```

---

## Common Issues

### Issue: "warp=off" Despite WARP Being Enabled

**Symptoms**: `curl https://www.cloudflare.com/cdn-cgi/trace/` shows `warp=off` even though WARP appears connected.

**Solutions**:

- Ensure WARP is in "WARP" mode, not "1.1.1.1" mode:

```bash
warp-cli mode warp
warp-cli connect
```

- Restart the WARP service:

```bash
# Linux
sudo systemctl restart warp-svc

# Then reconnect
warp-cli connect
```

### Issue: WARP Causes Network Slowdown

**Symptoms**: Internet speeds are significantly slower when WARP is enabled.

**Solutions**:

- This can happen when traffic is being relayed. Check your connection:

```bash
warp-cli stats
```

- Try reconnecting to get a better route:

```bash
warp-cli disconnect
warp-cli connect
```

- Consider WARP+ subscription for optimized routing

### Issue: Specific Websites or Services Not Working

**Symptoms**: Certain websites or applications fail when WARP is enabled.

**Solutions**:

- Some services block VPN traffic. You may need to temporarily disable WARP for those services.

- On desktop applications, check if split tunneling is available in WARP settings to exclude specific applications.

### Issue: DNS Resolution Failures

**Symptoms**: Cannot resolve hostnames when WARP is enabled.

**Solutions**:

- Check DNS configuration:

```bash
warp-cli dns log
```

- Try switching DNS modes:

```bash
warp-cli mode warp+doh
warp-cli connect
```

### Issue: WARP Conflicts With Corporate VPN

**Symptoms**: Corporate VPN stops working or WARP cannot connect when corporate VPN is active.

**Solutions**:

- WARP and other VPNs typically cannot run simultaneously
- Choose one VPN to use at a time
- Contact your IT department about Cloudflare Zero Trust integration if you need both

### Issue: Registration Requires Browser But No GUI Available

**Symptoms**: On headless Linux servers, `warp-cli registration new` requires browser authentication.

**Solutions**:

- The registration URL can be opened on any device. Copy the URL shown and open it in a browser on another device.

- For automated deployments, use Cloudflare Zero Trust with an MDM token instead of interactive registration.

---

## References

- [Cloudflare WARP Client Documentation](https://developers.cloudflare.com/warp-client/)
- [WARP Client for macOS](https://developers.cloudflare.com/warp-client/get-started/macos/)
- [WARP Client for Windows](https://developers.cloudflare.com/warp-client/get-started/windows/)
- [WARP Client for Linux](https://developers.cloudflare.com/warp-client/get-started/linux/)
- [Cloudflare WARP Packages Repository](https://pkg.cloudflareclient.com/)
- [Cloudflare WARP Homebrew Cask](https://formulae.brew.sh/cask/cloudflare-warp)
- [Cloudflare WARP Chocolatey Package](https://community.chocolatey.org/packages/warp)
- [Download and Install WARP with winget](https://winget.run/pkg/Cloudflare/Warp)
- [Cloudflare One - WARP for Organizations](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/)
- [WARP Modes Documentation](https://developers.cloudflare.com/warp-client/warp-modes/)
- [wgcf - Unofficial WARP CLI for WireGuard](https://github.com/ViRb3/wgcf)
