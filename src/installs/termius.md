# Installing Termius

## Overview

Termius is a modern SSH client designed for productivity and collaboration. It enables secure connections to Linux servers, IoT devices, Docker containers, virtual machines, Raspberry Pi devices, and cloud instances (AWS, DigitalOcean, etc.) from desktop and mobile devices. Termius provides a multi-tab interface with split-view support, encrypted credential storage using AES-256 encryption, and cross-device synchronization for hosts, keys, and settings.

Key features include:
- SSH, Mosh, Telnet, Port Forwarding, and SFTP support
- Encrypted vault for storing credentials and SSH keys
- Snippets for frequently used commands and scripts
- Team collaboration with secure credential sharing
- Biometric authentication (Windows Hello, Touch ID, Face ID)

**Important Platform Note**: The Termius desktop application is only available for x86_64 (64-bit) architectures on Linux. ARM-based systems (including Raspberry Pi running as a desktop) do not have official native Termius desktop support. Termius is typically used as a client TO connect to ARM devices like Raspberry Pi, not run ON them.

## Prerequisites

Before installing Termius on any platform, ensure:

1. **Internet connectivity** - Required to download Termius and sync data across devices
2. **Administrative privileges** - Required for system-wide installation on most platforms
3. **64-bit operating system** - Required for desktop applications (x86_64 architecture on Linux)
4. **Termius account** (optional) - Free accounts enable syncing hosts and settings across devices

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- Apple Silicon (M1/M2/M3/M4) or Intel processor
- At least 300 MB free disk space

If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Termius:

```bash
brew install --quiet --cask termius
```

The `--quiet` flag suppresses non-essential output for automation-friendly installation. The `--cask` flag specifies the graphical application version.

After installation, launch Termius from the Applications folder or via command line:

```bash
open -a Termius
```

**Note**: On first launch, Termius will display the login screen. Create an account or sign in to enable cross-device synchronization.

#### Verification

Confirm the installation succeeded by checking if the application exists:

```bash
ls /Applications/ | grep -i termius
```

Expected output:

```
Termius.app
```

Verify Termius can launch:

```bash
open -a Termius
```

#### Troubleshooting

**Problem**: `Error: Cask 'termius' requires macOS >= 10.15`

**Solution**: Your macOS version is too old. Termius requires macOS 10.15 (Catalina) or later. Upgrade your operating system before installing.

**Problem**: "Termius is damaged and can't be opened" error

**Solution**: Clear the quarantine attribute:

```bash
xattr -cr "/Applications/Termius.app"
```

**Problem**: Cask already installed

**Solution**: If you need to reinstall, first uninstall then reinstall:

```bash
brew uninstall --cask termius
brew install --quiet --cask termius
```

**Problem**: Termius fails to start after macOS upgrade

**Solution**: Reinstall Termius:

```bash
brew uninstall --cask termius
brew install --quiet --cask termius
```

---

### Ubuntu/Debian (Snap)

#### Prerequisites

- Ubuntu 16.04 LTS or later, or Debian 10 (Buster) or later (64-bit x86_64)
- sudo privileges
- Snap package manager (pre-installed on Ubuntu 16.04+)
- At least 300 MB free disk space

Snap is pre-installed on Ubuntu 16.04 and later. If snap is not installed (common on Debian):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
sudo systemctl enable --now snapd.socket
sudo ln -sf /var/lib/snapd/snap /snap
```

After installing snapd on Debian, log out and log back in (or reboot) for the snap command to become available in your PATH.

#### Installation Steps

Run the following command to install Termius via Snap:

```bash
sudo snap install termius-app
```

After installation, launch Termius:

```bash
termius-app &
```

The ampersand (`&`) runs Termius in the background, freeing your terminal.

#### Verification

Confirm the installation succeeded:

```bash
snap list termius-app
```

Expected output (version may vary):

```
Name         Version  Rev   Tracking       Publisher  Notes
termius-app  9.34.8   xxx   latest/stable  nicklara   -
```

Verify Termius launches correctly:

```bash
termius-app &
```

The Termius window should appear within a few seconds.

#### Troubleshooting

**Problem**: `error: snap "termius-app" is not available on stable for this architecture`

**Solution**: This error occurs on 32-bit systems or ARM architecture. Termius's Snap package requires 64-bit x86_64 architecture. Check your architecture:

```bash
uname -m
```

If output is anything other than `x86_64`, you cannot install the Termius desktop application natively. Consider using Termius on another device to connect to this system remotely.

**Problem**: "cannot communicate with server: Post ... dial unix /run/snapd.socket"

**Solution**: The snap daemon is not running. Start it:

```bash
sudo systemctl start snapd
sudo systemctl enable snapd
```

**Problem**: Termius fails to launch with GPU/rendering errors

**Solution**: Disable GPU acceleration by launching with:

```bash
termius-app --disable-gpu &
```

**Problem**: Termius window appears but remains blank

**Solution**: This may be a graphics driver issue. Try:

```bash
termius-app --disable-gpu --disable-software-rasterizer &
```

---

### Raspberry Pi OS (ARM)

#### Platform Limitation

**Termius does not provide native ARM packages for the desktop application.** The Termius Snap package and desktop application are only available for x86_64 architecture. Raspberry Pi devices use ARM processors (armhf or aarch64), which are not supported for running Termius locally.

**Important**: Termius is primarily designed as a client TO connect to Raspberry Pi and other ARM devices, not to run ON them directly.

#### Prerequisites

- Raspberry Pi OS (64-bit or 32-bit)
- Raspberry Pi 3 or later (with network connectivity)
- sudo privileges

#### Alternative Approaches

**Option 1: Use Termius on Another Device**

The recommended approach is to install Termius on a supported device (Windows, macOS, Linux x86_64, iOS, or Android) and connect to your Raspberry Pi via SSH.

On your Raspberry Pi, ensure SSH is enabled:

```bash
sudo systemctl enable --now ssh
```

Get your Raspberry Pi's IP address:

```bash
hostname -I
```

Then connect using Termius from your desktop or mobile device.

**Option 2: Use Native SSH Client on Raspberry Pi**

If you need an SSH client on Raspberry Pi to connect to other servers, use the built-in OpenSSH client:

```bash
# OpenSSH client is pre-installed on Raspberry Pi OS
# Verify it exists:
ssh -V

# Connect to a remote server:
ssh user@remote-server.example.com
```

#### Verification

For the SSH approach on Raspberry Pi, verify SSH client is available:

```bash
ssh -V
```

Expected output (version may vary):

```
OpenSSH_8.4p1 Debian-5+deb11u2, OpenSSL 1.1.1n  15 Mar 2022
```

#### Troubleshooting

**Problem**: SSH service not running on Raspberry Pi

**Solution**: Enable and start the SSH service:

```bash
sudo systemctl enable --now ssh
```

**Problem**: Cannot find Raspberry Pi IP address

**Solution**: Check the IP address:

```bash
hostname -I
```

Or use:

```bash
ip addr show | grep inet
```

---

### Amazon Linux/RHEL (DNF/YUM via Snap)

#### Prerequisites

- Amazon Linux 2023, Amazon Linux 2, RHEL 8/9, or Fedora (64-bit x86_64)
- sudo privileges
- Graphical desktop environment (required for Termius GUI)
- At least 300 MB free disk space

**Important**: Amazon Linux EC2 instances typically run headless (no GUI). If you are running a headless server, install Termius on your local workstation and use it to connect to your Amazon Linux instances. The Termius desktop application requires a graphical environment.

#### Installation Steps

**Step 1: Install and Configure Snapd**

**For Amazon Linux 2023 / Fedora:**

```bash
sudo dnf install -y snapd
sudo systemctl enable --now snapd.socket
sudo ln -sf /var/lib/snapd/snap /snap
```

Log out and log back in (or reboot) for PATH updates to take effect.

**For Amazon Linux 2:**

Amazon Linux 2 does not have snapd in the default repositories. Enable EPEL first:

```bash
sudo amazon-linux-extras install -y epel
sudo yum install -y snapd
sudo systemctl enable --now snapd.socket
sudo ln -sf /var/lib/snapd/snap /snap
```

Log out and log back in (or reboot) for PATH updates to take effect.

**For RHEL 8/9:**

```bash
# RHEL 9
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm

# RHEL 8
# sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm

sudo dnf upgrade -y
sudo yum install -y snapd
sudo systemctl enable --now snapd.socket
sudo ln -sf /var/lib/snapd/snap /snap
```

Log out and log back in (or reboot) for PATH updates to take effect.

**Step 2: Install Termius**

```bash
sudo snap install termius-app
```

After installation, launch Termius:

```bash
termius-app &
```

#### Verification

Confirm the installation succeeded:

```bash
snap list termius-app
```

Expected output (version may vary):

```
Name         Version  Rev   Tracking       Publisher  Notes
termius-app  9.34.8   xxx   latest/stable  nicklara   -
```

Verify Termius can launch (requires graphical environment):

```bash
termius-app &
```

#### Troubleshooting

**Problem**: "No snap 'termius-app' available" error

**Solution**: Ensure snapd is properly installed and the socket is active:

```bash
sudo systemctl status snapd.socket
```

If not running:

```bash
sudo systemctl enable --now snapd.socket
```

**Problem**: Termius fails to launch with display errors

**Solution**: Termius requires a graphical environment. For headless servers:
- Use X11 forwarding with SSH: `ssh -X user@server` then run `termius-app`
- Use VNC or RDP to connect to a desktop session
- Install Termius on your local workstation instead and connect to the server remotely

**Problem**: snap command not found after installation

**Solution**: Log out and log back in, or add snap to your PATH manually:

```bash
export PATH=$PATH:/snap/bin
```

Add this line to your `~/.bashrc` for persistence.

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- At least 300 MB free disk space
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install termius -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

After installation, Termius can be launched from the Start Menu or via command line:

```powershell
Start-Process "Termius"
```

**Note**: On first launch, Termius will display the login screen. Create an account or sign in to enable cross-device synchronization.

#### Verification

Open a new Command Prompt or PowerShell window, then verify Termius is installed:

```powershell
choco list termius
```

Expected output (version may vary):

```
termius 9.34.8
1 packages installed.
```

Launch Termius to verify it opens correctly:

```powershell
Start-Process "Termius"
```

The application should launch and display the login screen.

#### Troubleshooting

**Problem**: `choco: command not found` or `'choco' is not recognized`

**Solution**: Chocolatey is not installed or not in PATH. Install Chocolatey first (see Prerequisites), then open a new terminal window.

**Problem**: Installation fails with permission errors

**Solution**: Run PowerShell as Administrator. Right-click PowerShell in the Start Menu and select "Run as administrator".

**Problem**: Termius fails to launch after installation

**Solution**: Restart your computer to ensure all components are properly registered, then try launching again.

**Problem**: Need to update Termius

**Solution**: Run the upgrade command:

```powershell
choco upgrade termius -y
```

**Alternative: Install via winget**

If you prefer using winget (built into Windows 11 and Windows 10 21H2+):

```powershell
winget install --id Termius.Termius --silent --accept-package-agreements --accept-source-agreements
```

---

### WSL (Ubuntu)

#### Platform Approach

**Termius is installed on the Windows host, not within WSL.** The recommended approach is to install Termius on Windows and use it from the Windows desktop while working within WSL.

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- Administrator access on Windows for Termius installation

#### Installation Steps

**Step 1: Install Termius on Windows**

From a Windows Administrator PowerShell:

```powershell
choco install termius -y
```

**Step 2: Access Termius from WSL**

From within your WSL terminal, you can launch Windows Termius:

```bash
# Launch Termius using Windows command
cmd.exe /c start "" "Termius"
```

This command uses Windows interoperability to launch the Termius application installed on the Windows host.

**Alternative: Create a convenience alias**

Add to your `~/.bashrc`:

```bash
echo 'alias termius="cmd.exe /c start \"\" \"Termius\""' >> ~/.bashrc
source ~/.bashrc
```

Then simply run `termius` from your WSL terminal.

#### Verification

From WSL, verify you can launch Windows Termius:

```bash
cmd.exe /c start "" "Termius"
```

Termius should open in a new window on the Windows desktop.

#### Troubleshooting

**Problem**: Cannot launch Termius from WSL

**Solution**: Ensure Termius is installed on Windows first. Run `choco list termius` in a Windows PowerShell to verify installation.

**Problem**: "start: command not found"

**Solution**: Use the full Windows command syntax:

```bash
cmd.exe /c start "" "Termius"
```

**Problem**: Termius opens but WSL integration does not work

**Solution**: Termius works independently of WSL. Use Termius to connect to remote servers; your WSL environment is separate from Termius's SSH connections.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Administrator access for Termius installation

#### Installation Steps

Git Bash runs on Windows, so Termius is installed on the Windows host and accessible from Git Bash.

**Step 1: Install Termius on Windows**

From an Administrator Command Prompt or PowerShell (not Git Bash):

```powershell
choco install termius -y
```

**Step 2: Access Termius from Git Bash**

After installation, Termius can be launched from Git Bash:

```bash
start "" "Termius"
```

Or use the explicit command form:

```bash
cmd //c "start \"\" \"Termius\""
```

#### Verification

From Git Bash, verify Termius can be launched:

```bash
start "" "Termius"
```

Termius should open in a new window.

#### Troubleshooting

**Problem**: `start: command not found`

**Solution**: Use the Windows-style command:

```bash
cmd //c "start \"\" \"Termius\""
```

**Problem**: Termius does not launch

**Solution**: Ensure Termius is installed on Windows. Open a Windows Command Prompt and verify:

```cmd
choco list termius
```

If not installed, install it from an Administrator PowerShell first.

**Problem**: Need to use Termius in scripts

**Solution**: For scripting, use the Windows command wrapper:

```bash
#!/bin/bash
# Launch Termius silently
cmd //c "start /min \"\" \"Termius\"" 2>/dev/null
```

---

## Post-Installation Configuration

After installing Termius on any platform, complete these configuration steps.

### Creating an Account

While Termius works without an account, creating one enables:
- Syncing hosts, keys, and settings across all devices
- Encrypted cloud backup of your SSH configurations
- Team collaboration features (paid plans)

1. Launch Termius
2. Click "Create Account" or "Sign Up"
3. Enter your email and create a password
4. Verify your email address

### Importing SSH Config

Termius can import your existing SSH configuration:

1. Open Termius Settings (gear icon)
2. Navigate to Import/Export
3. Select "Import from SSH config"
4. Termius will parse your `~/.ssh/config` file and import hosts

### Adding Your First Host

1. Click the "+" button or "New Host"
2. Enter the host details:
   - **Label**: A friendly name for the connection
   - **Address**: IP address or hostname
   - **Port**: SSH port (default: 22)
   - **Username**: Your SSH username
   - **Authentication**: Password or SSH Key
3. Click "Save"
4. Double-click the host to connect

### Configuring SSH Keys

To use SSH key authentication:

1. Go to Termius Settings > Keychain
2. Click "Add Key"
3. Either generate a new key pair or import an existing private key
4. Associate the key with specific hosts

### Setting Up Snippets

Save frequently used commands as snippets:

1. Go to Snippets in the sidebar
2. Click "New Snippet"
3. Enter a name and the command(s)
4. Access snippets during terminal sessions with the snippet menu

---

## Common Issues

### Issue: "Connection Refused" or "Connection Timed Out"

**Symptoms**: Cannot connect to remote host

**Solutions**:
- Verify the server's SSH service is running
- Check the IP address/hostname is correct
- Ensure port 22 (or custom SSH port) is open in firewall
- Verify network connectivity with `ping`

### Issue: "Host Key Verification Failed"

**Symptoms**: Connection fails with host key warning

**Solutions**:
- If the server was reinstalled, remove the old key: click "Remove and Reconnect" when prompted
- Verify you are connecting to the correct server (not a man-in-the-middle attack)

### Issue: "Permission Denied (publickey)"

**Symptoms**: Key authentication fails

**Solutions**:
- Ensure the correct key is associated with the host in Termius
- Verify the public key is in the remote server's `~/.ssh/authorized_keys`
- Check file permissions on the server: `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`

### Issue: Sync Not Working

**Symptoms**: Hosts and settings do not sync across devices

**Solutions**:
- Verify you are signed into the same Termius account on all devices
- Check internet connectivity
- Force sync by going to Settings > Sync > Sync Now
- Sign out and sign back in

### Issue: Terminal Rendering Issues

**Symptoms**: Characters display incorrectly, or terminal appears corrupted

**Solutions**:
- Try a different terminal font in Settings > Appearance
- Adjust terminal encoding settings
- Clear the terminal buffer and reconnect

### Issue: High CPU Usage

**Symptoms**: Termius consumes excessive CPU

**Solutions**:
- Close unused terminal tabs and sessions
- Disable hardware acceleration in settings
- Restart Termius

---

## Summary Table

| Platform | Native Support | Installation Method | Notes |
|----------|---------------|---------------------|-------|
| macOS | Yes | `brew install --quiet --cask termius` | Requires macOS 10.15+ |
| Windows | Yes | `choco install termius -y` | Primary supported platform |
| Ubuntu/Debian | Yes | `sudo snap install termius-app` | x86_64 only |
| Raspberry Pi | No | N/A | Use Termius on another device to connect to Pi |
| Amazon Linux/RHEL | Yes | Snap via EPEL + `sudo snap install termius-app` | x86_64 only, requires GUI |
| WSL | N/A | Install on Windows host | Uses Windows installation |
| Git Bash | N/A | Uses Windows installation | Inherits Windows Termius |

---

## References

- [Termius Official Website](https://termius.com/)
- [Termius Downloads](https://termius.com/download/windows)
- [Termius for Linux](https://termius.com/free-ssh-client-for-linux)
- [Termius Homebrew Cask](https://formulae.brew.sh/cask/termius)
- [Termius Chocolatey Package](https://community.chocolatey.org/packages/termius)
- [Termius Snap Package](https://snapcraft.io/termius-app)
- [Termius on Microsoft Store](https://apps.microsoft.com/detail/9nk1gdvpx09v)
- [Termius on Mac App Store](https://apps.apple.com/us/app/termius-modern-ssh-client/id549039908)
- [Install Termius on Ubuntu via Snap](https://snapcraft.io/install/termius-app/ubuntu)
- [Install Termius on Fedora via Snap](https://snapcraft.io/install/termius-app/fedora)
- [Install Termius on RHEL via Snap](https://snapcraft.io/install/termius-app/rhel)
