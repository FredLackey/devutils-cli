# Installing Microsoft Teams

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `Homebrew` - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None

### Ubuntu (APT/Snap)
- **Required:**
  - `wget` - Install via `sudo apt-get install -y wget`
  - `ca-certificates` - Install via `sudo apt-get install -y ca-certificates`
- **Optional:**
  - `snapd` - Install via `sudo apt-get install -y snapd` (if using Snap instead of APT repository)
- **Auto-installed:** None

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `snapd` - Install via `sudo apt-get install -y snapd` (required for ARM architecture support)
- **Optional:** None
- **Auto-installed:** None

### Amazon Linux (DNF/YUM)
- **Required:**
  - `curl` - Install via `sudo dnf install -y curl` (Amazon Linux 2023/RHEL 8+) or `sudo yum install -y curl` (Amazon Linux 2)
  - Either `dnf` or `yum` package manager (pre-installed on supported distributions)
- **Optional:** None
- **Auto-installed:** None

### Windows (Chocolatey/winget)
- **Required:**
  - `Chocolatey` - Install via PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
- **Optional:**
  - `winget` - Pre-installed on Windows 11 and Windows 10 (version 1809+), can be used as alternative to Chocolatey
- **Auto-installed:**
  - `App Installer (MSIX)` - Required by Teams bootstrapper, typically pre-installed on Windows 10/11

### Git Bash (Manual/Portable)
- **Required:**
  - `Chocolatey` (on Windows host) - Install via Administrator PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
  - `PowerShell` - Pre-installed on Windows
- **Optional:** None
- **Auto-installed:** None

## Overview

Microsoft Teams is a collaboration and communication platform developed by Microsoft. It provides chat, video meetings, file storage, and application integration for teams and organizations. Teams is widely used for remote work, virtual meetings, and team collaboration in business, education, and personal contexts.

**Important Platform Availability Note**: Microsoft discontinued native Linux desktop applications for Teams at the end of 2022. Linux users must use either the unofficial "Teams for Linux" Electron-based client (which wraps the web application) or access Teams through a web browser. This document provides the recommended installation method for each platform.

## Prerequisites

Before installing Microsoft Teams on any platform, ensure:

1. **Internet connectivity** - Required to download installation packages and use Teams services
2. **Microsoft account** - Required to sign in and use Teams (personal, work, or school account)
3. **Administrative privileges** - Required for system-wide installation on most platforms
4. **Supported browser** - For web-based access, Chrome, Edge, Firefox, or Safari

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager installed
- At least 2 GB free disk space
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Microsoft Teams:

```bash
brew install --quiet --cask microsoft-teams
```

The `--quiet` flag suppresses non-essential output, and `--cask` specifies the graphical application version.

After installation, launch Microsoft Teams from the Applications folder or via command line:

```bash
open -a "Microsoft Teams"
```

**Note**: On first launch, Teams will prompt you to sign in with your Microsoft account.

#### Verification

Confirm the installation succeeded by checking if the application exists:

```bash
ls /Applications/ | grep -i "microsoft teams"
```

Expected output:

```
Microsoft Teams.app
```

Verify Teams can launch:

```bash
open -a "Microsoft Teams"
```

#### Troubleshooting

**Problem**: `Error: Cask microsoft-teams requires macOS >= 11`

**Solution**: Your macOS version is too old. Microsoft Teams requires macOS 11 (Big Sur) or later. Upgrade your operating system before installing.

**Problem**: "Microsoft Teams is damaged and can't be opened" error

**Solution**: Clear the quarantine attribute:

```bash
xattr -cr "/Applications/Microsoft Teams.app"
```

**Problem**: Classic Teams version needed

**Solution**: If you need the older classic version of Teams (version 1.x), install it with:

```bash
brew install --quiet --cask microsoft-teams@classic
```

**Problem**: Teams fails to start after macOS Sequoia upgrade

**Solution**: Reinstall Teams:

```bash
brew uninstall --cask microsoft-teams
brew install --quiet --cask microsoft-teams
```

---

### Ubuntu/Debian (APT)

#### Platform Limitation

**Microsoft Teams is not available natively on Linux.** Microsoft discontinued the official Linux desktop client at the end of 2022. The recommended solution is the unofficial "Teams for Linux" Electron-based client, which wraps the Teams web application in a desktop wrapper with system integration.

#### Prerequisites

- Ubuntu 20.04, 22.04, 24.04 or later, or Debian 11, 12 or later (64-bit)
- sudo privileges
- At least 1 GB free disk space

#### Installation Steps

**Step 1: Add the Teams for Linux repository**

```bash
sudo mkdir -p /etc/apt/keyrings
sudo wget -qO /etc/apt/keyrings/teams-for-linux.asc https://repo.teamsforlinux.de/teams-for-linux.asc
```

**Step 2: Add the repository source**

```bash
echo "Types: deb
URIs: https://repo.teamsforlinux.de/debian/
Suites: stable
Components: main
Signed-By: /etc/apt/keyrings/teams-for-linux.asc
Architectures: amd64" | sudo tee /etc/apt/sources.list.d/teams-for-linux-packages.sources > /dev/null
```

**Step 3: Update package lists and install**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y teams-for-linux
```

**Alternative: Install via Snap**

If you prefer Snap packages or need ARM architecture support:

```bash
sudo snap install teams-for-linux
```

The Snap version supports amd64, arm64, and armhf architectures.

#### Verification

Confirm the installation succeeded:

```bash
teams-for-linux --version
```

Or check if the package is installed:

```bash
dpkg -l | grep teams-for-linux
```

Launch Teams:

```bash
teams-for-linux &
```

#### Troubleshooting

**Problem**: GPG key import fails

**Solution**: Ensure wget is installed and try again:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget ca-certificates
sudo wget -qO /etc/apt/keyrings/teams-for-linux.asc https://repo.teamsforlinux.de/teams-for-linux.asc
```

**Problem**: Package not found after adding repository

**Solution**: Verify the repository file was created correctly:

```bash
cat /etc/apt/sources.list.d/teams-for-linux-packages.sources
```

If empty or malformed, recreate it using the commands in Step 2.

**Problem**: Application crashes or white screen

**Solution**: Try running with GPU acceleration disabled:

```bash
teams-for-linux --disable-gpu
```

**Problem**: Screen sharing does not work

**Solution**: On Wayland sessions, screen sharing may be limited. Switch to X11 session for full screen sharing support, or use Pipewire for Wayland screen sharing.

---

### Raspberry Pi OS (APT)

#### Platform Limitation

**Microsoft Teams does not have an official ARM client.** The unofficial "Teams for Linux" Snap package supports ARM architectures (arm64 and armhf). The APT repository only provides amd64 packages.

#### Prerequisites

- Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
- Raspberry Pi 3B+ or later (arm64 or armhf architecture)
- At least 2 GB RAM (4 GB recommended for video calls)
- sudo privileges
- snapd installed

#### Installation Steps

**Step 1: Ensure snapd is installed**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
```

**Step 2: Reboot to complete snapd installation (if newly installed)**

```bash
sudo reboot
```

**Step 3: Install Teams for Linux via Snap**

```bash
sudo snap install teams-for-linux
```

The Snap package includes arm64 and armhf support, making it suitable for Raspberry Pi.

**Alternative: Use the Web Application**

For better performance on lower-spec Raspberry Pi models, use Microsoft Teams in a browser:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y chromium-browser
chromium-browser --app=https://teams.microsoft.com &
```

#### Verification

Confirm the installation succeeded:

```bash
snap list | grep teams-for-linux
```

Expected output (version may vary):

```
teams-for-linux  2.6.18  234  latest/stable  nicoh88  -
```

Launch Teams:

```bash
teams-for-linux &
```

#### Troubleshooting

**Problem**: Snap installation fails with "snap not found"

**Solution**: Install and configure snapd:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
sudo systemctl enable --now snapd.socket
sudo ln -sf /snap /var/lib/snapd/snap
sudo reboot
```

After reboot, retry the installation.

**Problem**: Teams is very slow or video calls lag

**Solution**: Raspberry Pi has limited resources. For better performance:
- Use a Raspberry Pi 4 or 5 with at least 4 GB RAM
- Close other applications during video calls
- Use the web version in Chromium with hardware acceleration:

```bash
chromium-browser --enable-features=VaapiVideoDecoder --app=https://teams.microsoft.com
```

**Problem**: Camera or microphone not detected

**Solution**: Ensure your user is in the video and audio groups:

```bash
sudo usermod -aG video,audio $USER
```

Log out and log back in for changes to take effect.

**Problem**: Screen sharing not available

**Solution**: Screen sharing on ARM devices has limited support. Use the web version in Chromium for better screen sharing compatibility.

---

### Amazon Linux/RHEL (DNF/YUM)

#### Platform Limitation

**Microsoft Teams is not available natively on Linux.** Use the unofficial "Teams for Linux" Electron-based client via the dedicated RPM repository.

#### Prerequisites

- Amazon Linux 2023, Amazon Linux 2, RHEL 8, RHEL 9, or Fedora
- sudo privileges
- At least 1 GB free disk space

#### Installation Steps

**For Amazon Linux 2023, RHEL 8/9, and Fedora:**

**Step 1: Import the GPG key**

```bash
curl -1sLf -o /tmp/teams-for-linux.asc https://repo.teamsforlinux.de/teams-for-linux.asc
sudo rpm --import /tmp/teams-for-linux.asc
```

**Step 2: Add the repository**

```bash
sudo curl -1sLf -o /etc/yum.repos.d/teams-for-linux.repo https://repo.teamsforlinux.de/rpm/teams-for-linux.repo
```

**Step 3: Install Teams for Linux**

```bash
sudo dnf install -y teams-for-linux
```

**For Amazon Linux 2 (uses yum):**

```bash
curl -1sLf -o /tmp/teams-for-linux.asc https://repo.teamsforlinux.de/teams-for-linux.asc
sudo rpm --import /tmp/teams-for-linux.asc
sudo curl -1sLf -o /etc/yum.repos.d/teams-for-linux.repo https://repo.teamsforlinux.de/rpm/teams-for-linux.repo
sudo yum install -y teams-for-linux
```

**Note for EC2 Instances**: If running on a headless EC2 instance without a GUI, Microsoft Teams cannot be used directly. Consider:
- Using the Microsoft Graph API for automated Teams operations
- Accessing Teams via a browser on a workstation that connects to the EC2 instance

#### Verification

Confirm the installation succeeded:

```bash
teams-for-linux --version
```

Or check if the package is installed:

```bash
rpm -qa | grep teams-for-linux
```

Launch Teams:

```bash
teams-for-linux &
```

#### Troubleshooting

**Problem**: GPG key import fails

**Solution**: Ensure curl is installed:

```bash
sudo dnf install -y curl
```

Then retry the GPG key import.

**Problem**: Repository not found

**Solution**: Verify the repository file exists and is correct:

```bash
cat /etc/yum.repos.d/teams-for-linux.repo
```

If missing, recreate it using the commands in Step 2.

**Problem**: Dependency conflicts

**Solution**: Update system packages first:

```bash
sudo dnf update -y
sudo dnf install -y teams-for-linux
```

**Problem**: Application won't start on headless server

**Solution**: Teams requires a graphical environment. For headless servers, use the Microsoft Teams web application through a browser on a machine with GUI access, or use Microsoft Graph API for programmatic access.

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 version 20H1 (10.0.19041) or later, or Windows 11
- At least 2 GB RAM and 3 GB free disk space
- Administrator PowerShell or Command Prompt
- Microsoft account (personal, work, or school)

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

**Using Chocolatey (Recommended):**

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install microsoft-teams-new-bootstrapper -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

This installs the new Microsoft Teams client (version 2.x) using the official Microsoft bootstrapper, which downloads and installs the latest Teams MSIX package. Teams is self-updating after installation.

**Alternative Using winget:**

```powershell
winget install --id Microsoft.Teams --silent --accept-package-agreements --accept-source-agreements
```

The flags ensure non-interactive installation:
- `--silent` suppresses the installer UI
- `--accept-package-agreements` auto-accepts license agreements
- `--accept-source-agreements` accepts source repository terms

**Note**: After installation, launch Teams and sign in with your Microsoft account.

#### Verification

Open a new Command Prompt or PowerShell window, then verify the installation:

```powershell
winget list --id Microsoft.Teams
```

Or check for the Teams executable:

```powershell
Get-Command ms-teams -ErrorAction SilentlyContinue
```

Launch Teams:

```powershell
Start-Process ms-teams:
```

Or from the Start Menu, search for "Microsoft Teams" and launch it.

#### Troubleshooting

**Problem**: "Package not found" error with Chocolatey

**Solution**: Update Chocolatey sources and retry:

```powershell
choco upgrade chocolatey -y
choco install microsoft-teams-new-bootstrapper -y
```

**Problem**: Installation fails with "App Installer" error

**Solution**: The Teams bootstrapper requires App Installer (MSIX). Update App Installer from the Microsoft Store or run:

```powershell
winget install --id Microsoft.AppInstaller --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: Teams shows "classic" version instead of new client

**Solution**: The new Teams client may need to be enabled by your IT administrator for work/school accounts. For personal use, ensure you installed the new bootstrapper, not the classic package.

**Problem**: Cannot sign in with work/school account

**Solution**: Your organization may have specific Teams deployment policies. Contact your IT administrator to verify Teams access.

**Problem**: Teams does not start after installation

**Solution**: Restart your computer and try launching Teams again:

```powershell
Restart-Computer -Force
```

---

### WSL (Ubuntu)

#### Platform Limitation

**Microsoft Teams cannot be installed within WSL (Windows Subsystem for Linux).** WSL runs a Linux environment, and while Teams for Linux could theoretically run in WSL with WSLg (graphical support), the recommended approach is to install Teams on the Windows host.

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- Administrator access on Windows for installation

#### Recommended Approach

Install Microsoft Teams on the Windows host and access it from WSL by launching the Windows executable.

**Step 1: Install Microsoft Teams on Windows**

From a Windows Administrator PowerShell:

```powershell
choco install microsoft-teams-new-bootstrapper -y
```

**Step 2: Access Teams from WSL**

From within your WSL terminal, you can launch Windows Teams:

```bash
# Launch Microsoft Teams from WSL
/mnt/c/Users/$(cmd.exe /c "echo %USERNAME%" 2>/dev/null | tr -d '\r')/AppData/Local/Microsoft/WindowsApps/ms-teams.exe &
```

Or use the simpler approach with the PATH:

```bash
cmd.exe /c start ms-teams:
```

**Alternative: Install Teams for Linux in WSL with WSLg**

If you have WSLg (Windows Subsystem for Linux GUI) enabled, you can install Teams for Linux:

```bash
sudo snap install teams-for-linux
teams-for-linux &
```

Note: This requires WSL 2 with WSLg support (Windows 11 or Windows 10 with KB5020030).

#### Verification

From WSL, verify you can access Windows Teams:

```bash
cmd.exe /c "where ms-teams" 2>/dev/null
```

Or verify the Teams for Linux Snap (if installed in WSL):

```bash
snap list | grep teams-for-linux
```

#### Troubleshooting

**Problem**: Cannot launch Windows Teams from WSL

**Solution**: Ensure Teams is installed on Windows and try the direct command:

```bash
cmd.exe /c start ms-teams:
```

**Problem**: Teams for Linux Snap fails in WSL

**Solution**: WSLg may not be enabled or working correctly. Check WSLg status:

```bash
ls /mnt/wslg
```

If the directory does not exist or is empty, WSLg is not available. Update to Windows 11 or a recent Windows 10 build with WSLg support.

**Problem**: Audio/video not working in Teams for Linux on WSL

**Solution**: WSLg audio support can be inconsistent. Use Windows Teams for meetings with audio/video.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Administrator access for installation

#### Installation Steps

Git Bash runs on Windows, so Microsoft Teams is installed on the Windows host and accessible from Git Bash.

**Step 1: Install Microsoft Teams on Windows**

From an Administrator Command Prompt or PowerShell (not Git Bash):

```powershell
choco install microsoft-teams-new-bootstrapper -y
```

**Step 2: Restart your computer if prompted**

**Step 3: Access Teams from Git Bash**

After installation, Teams can be launched from Git Bash:

```bash
start ms-teams:
```

Or use the explicit path:

```bash
cmd //c "start ms-teams:"
```

#### Verification

From Git Bash, verify Teams can be launched:

```bash
start ms-teams:
```

Teams should open in a new window.

#### Troubleshooting

**Problem**: `start: command not found`

**Solution**: Use the Windows-style command:

```bash
cmd //c "start ms-teams:"
```

**Problem**: Teams does not launch

**Solution**: Ensure Teams is installed and restart your computer. Then try:

```bash
"/c/Users/$USERNAME/AppData/Local/Microsoft/WindowsApps/ms-teams.exe" &
```

**Problem**: Need to use Teams commands in scripts

**Solution**: For scripting, use the Windows command wrapper:

```bash
#!/bin/bash
# Launch Teams silently
cmd //c "start /min ms-teams:" 2>/dev/null
```

---

## Post-Installation Configuration

After installing Microsoft Teams on any platform, consider these configuration steps.

### Signing In

1. Launch Microsoft Teams
2. Enter your email address (personal Microsoft account, or work/school account)
3. Follow the authentication prompts
4. Complete any organization-specific setup if using a work/school account

### Configuring Notifications

Adjust notification settings to avoid interruptions:

1. Click on your profile picture in Teams
2. Go to Settings > Notifications
3. Configure notification preferences for messages, meetings, and mentions

### Setting Up Audio and Video

Before your first meeting:

1. Click on your profile picture in Teams
2. Go to Settings > Devices
3. Test your speaker, microphone, and camera
4. Make a test call to verify everything works

### Enabling Dark Mode

For reduced eye strain:

1. Click on your profile picture in Teams
2. Go to Settings > Appearance
3. Select "Dark" or "High contrast"

### Configuring Startup Behavior

To control whether Teams starts automatically:

**Windows:**
1. Go to Settings > General
2. Toggle "Auto-start application" on or off

**macOS:**
1. Go to Settings > General
2. Toggle "Auto-start application" on or off

**Linux (Teams for Linux):**
```bash
# Disable autostart
rm ~/.config/autostart/teams-for-linux.desktop 2>/dev/null || true
```

---

## Common Issues

### Issue: "Sign in loop" - Cannot Complete Sign In

**Symptoms**: Teams asks you to sign in repeatedly without completing authentication

**Solutions**:

- Clear Teams cache:

**Windows:**
```powershell
Remove-Item -Path "$env:APPDATA\Microsoft\Teams\*" -Recurse -Force -ErrorAction SilentlyContinue
```

**macOS:**
```bash
rm -rf ~/Library/Application\ Support/Microsoft/Teams/*
rm -rf ~/Library/Caches/com.microsoft.teams/*
```

**Linux:**
```bash
rm -rf ~/.config/teams-for-linux/*
rm -rf ~/.cache/teams-for-linux/*
```

### Issue: Audio or Video Not Working in Meetings

**Symptoms**: Others cannot hear you or see your video

**Solutions**:

- Check device permissions in your operating system settings
- Verify the correct devices are selected in Teams Settings > Devices
- Close other applications that might be using the camera or microphone
- Restart Teams

### Issue: Screen Sharing Not Available

**Symptoms**: Screen sharing option is grayed out or not working

**Solutions**:

- **macOS**: Grant screen recording permission in System Preferences > Security & Privacy > Privacy > Screen Recording
- **Linux**: On Wayland, screen sharing may be limited. Use X11 session or ensure Pipewire is configured
- **Windows**: Run Teams as administrator if sharing specific applications

### Issue: High CPU or Memory Usage

**Symptoms**: Teams consumes excessive system resources

**Solutions**:

- Disable GPU hardware acceleration in Settings > General (if experiencing issues)
- Close unused chats and channels
- Restart Teams periodically
- Update to the latest version

### Issue: Notifications Not Working

**Symptoms**: Missing notifications for messages or calls

**Solutions**:

- Check notification settings in Teams and operating system
- Ensure "Do Not Disturb" mode is not enabled
- Verify Teams is allowed to send notifications in OS settings

---

## Summary Table

| Platform | Native Support | Installation Method | Notes |
|----------|---------------|---------------------|-------|
| macOS | Yes | `brew install --quiet --cask microsoft-teams` | Requires macOS 11+ |
| Windows | Yes | `choco install microsoft-teams-new-bootstrapper -y` | Primary supported platform |
| Ubuntu/Debian | No (unofficial) | APT repo or `sudo snap install teams-for-linux` | Teams for Linux (Electron wrapper) |
| Raspberry Pi | No (unofficial) | `sudo snap install teams-for-linux` | Snap supports ARM64/armhf |
| Amazon Linux/RHEL | No (unofficial) | RPM repository + `dnf install teams-for-linux` | Teams for Linux |
| WSL | N/A | Install on Windows host | Uses Windows installation |
| Git Bash | N/A | Uses Windows installation | Inherits Windows Teams |

---

## References

- [Microsoft Teams Official Website](https://www.microsoft.com/en-us/microsoft-teams/group-chat-software/)
- [Microsoft Teams Web Application](https://teams.microsoft.com)
- [Microsoft Teams Homebrew Cask](https://formulae.brew.sh/cask/microsoft-teams)
- [Microsoft Teams Classic Homebrew Cask](https://formulae.brew.sh/cask/microsoft-teams@classic)
- [Microsoft Teams Chocolatey Package (New Client)](https://community.chocolatey.org/packages/microsoft-teams-new-bootstrapper)
- [Microsoft Teams winget Package](https://winget.run/pkg/Microsoft/Teams)
- [Teams for Linux (Unofficial Client)](https://github.com/IsmaelMartinez/teams-for-linux)
- [Teams for Linux Snap Package](https://snapcraft.io/teams-for-linux)
- [Teams for Linux Repository](https://repo.teamsforlinux.de/)
- [winget install Command Documentation](https://learn.microsoft.com/en-us/windows/package-manager/winget/install)
