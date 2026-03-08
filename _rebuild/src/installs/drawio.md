# Installing Draw.io

## Overview

Draw.io (also known as diagrams.net) is a free, open-source diagramming application for creating flowcharts, process diagrams, org charts, UML diagrams, ER diagrams, network diagrams, and more. The desktop application is built on Electron and provides a security-first approach where all diagram data remains local - no data is ever sent externally.

Key features:
- **Offline-first**: Works completely offline after installation
- **Privacy-focused**: No analytics or external data transmission
- **Cross-platform**: Available for macOS, Windows, and Linux
- **Free and open-source**: Licensed under Apache 2.0

This guide documents Draw.io Desktop installation across all supported platforms.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:** All application dependencies are automatically handled by the Homebrew cask installation process

### Ubuntu (APT/Snap)
- **Required:**
  - snapd - Install via `sudo apt-get update && sudo apt-get install -y snapd` (automatically installed by the installer if missing)
- **Optional:** None
- **Auto-installed:** snapd package manager will be installed automatically if not present via `sudo apt-get install -y snapd`

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - curl - Install via `sudo apt-get install -y curl` (usually pre-installed)
- **Optional:**
  - snapd - Install via `sudo apt-get install -y snapd` (preferred installation method, but installer falls back to .deb package if unavailable)
- **Auto-installed:** When using .deb package fallback, apt will automatically install any missing package dependencies

### Amazon Linux (DNF/YUM)
- **Required:**
  - wget - Install via `sudo dnf install -y wget` (AL2023) or `sudo yum install -y wget` (AL2)
  - curl - Install via `sudo dnf install -y curl` (AL2023) or `sudo yum install -y curl` (AL2)
  - libxkbfile - Install via `sudo dnf install -y libxkbfile` (AL2023) or `sudo yum install -y libxkbfile` (AL2)
  - libsecret - Install via `sudo dnf install -y libsecret` (AL2023) or `sudo yum install -y libsecret` (AL2)
  - nss - Install via `sudo dnf install -y nss` (AL2023) or `sudo yum install -y nss` (AL2)
  - gtk3 - Install via `sudo dnf install -y gtk3` (AL2023) or `sudo yum install -y gtk3` (AL2)
  - libdrm - Install via `sudo dnf install -y libdrm` (AL2023) or `sudo yum install -y libdrm` (AL2)
  - mesa-libgbm - Install via `sudo dnf install -y mesa-libgbm` (AL2023) or `sudo yum install -y mesa-libgbm` (AL2)
  - alsa-lib - Install via `sudo dnf install -y alsa-lib` (AL2023) or `sudo yum install -y alsa-lib` (AL2)
- **Optional:** None
- **Auto-installed:** None (all dependencies must be manually installed before running Draw.io)

### Windows (Chocolatey/winget)
- **Required:**
  - Chocolatey - Install via PowerShell (Administrator): `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
- **Optional:** None
- **Auto-installed:** All application dependencies are automatically handled by the Chocolatey package installation process

### Git Bash (Manual/Portable)
- **Required:**
  - curl - Usually pre-installed with Git for Windows
- **Optional:**
  - unzip - Install via Git for Windows package manager or use PowerShell's Expand-Archive as fallback
- **Auto-installed:** None

## Prerequisites

Before installing Draw.io on any platform, ensure:

1. **Internet connectivity** - Required to download installation packages
2. **Administrative privileges** - Required for system-wide installation
3. **Sufficient disk space** - Approximately 500 MB free space recommended

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 12 (Monterey) or later
- Homebrew package manager installed
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Draw.io Desktop:

```bash
brew install --quiet --cask drawio
```

The `--quiet` flag suppresses non-essential output, and `--cask` specifies the graphical application version. Homebrew automatically detects your processor architecture (Intel or Apple Silicon) and installs the appropriate version.

#### Verification

Confirm the installation succeeded by launching the application:

```bash
open -a "draw.io"
```

Alternatively, verify the application exists:

```bash
ls /Applications | grep -i draw
```

Expected output:

```
draw.io.app
```

#### Troubleshooting

**Problem**: `Error: Cask 'drawio' is not installed`

**Solution**: The cask name may have changed. Search for the current name:

```bash
brew search drawio
```

**Problem**: Application fails to open with "damaged" warning

**Solution**: Remove the quarantine attribute:

```bash
xattr -cr /Applications/draw.io.app
```

**Problem**: Homebrew is not in PATH after installation

**Solution**: Add Homebrew to your PATH. For Apple Silicon Macs:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

---

### Ubuntu/Debian (Snap)

#### Prerequisites

- Ubuntu 16.04 LTS or later, or Debian 9 or later
- snapd package manager (pre-installed on Ubuntu 16.04+)
- sudo privileges

Snap is the recommended installation method for Ubuntu/Debian as it provides automatic updates and consistent behavior across distributions.

First, ensure snapd is installed and up to date:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
```

#### Installation Steps

Run the following command to install Draw.io:

```bash
sudo snap install drawio
```

Snap handles all dependencies automatically and will keep Draw.io updated in the background.

#### Verification

Confirm the installation succeeded:

```bash
snap list drawio
```

Expected output (version numbers may vary):

```
Name    Version  Rev   Tracking       Publisher  Notes
drawio  28.2.5   123   latest/stable  jgraph     -
```

Launch Draw.io to verify it works:

```bash
drawio &
```

Or from the application menu, search for "draw.io" or "diagrams.net".

#### Troubleshooting

**Problem**: `error: snap "drawio" is not available on stable for this architecture`

**Solution**: The Snap package may not support your CPU architecture. Use the alternative .deb installation method:

```bash
# Download the latest .deb package
curl -s https://api.github.com/repos/jgraph/drawio-desktop/releases/latest | grep "browser_download_url.*amd64.*\.deb" | cut -d '"' -f 4 | xargs -I {} curl -L -o /tmp/drawio.deb {}
# Install the package
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/drawio.deb
```

**Problem**: Draw.io cannot access files in certain directories

**Solution**: Snap applications have limited file system access by default. Grant additional permissions:

```bash
sudo snap connect drawio:removable-media
```

**Problem**: `snap: command not found`

**Solution**: Install snapd:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
sudo systemctl enable --now snapd.socket
sudo ln -s /var/lib/snapd/snap /snap
```

Log out and log back in for PATH changes to take effect.

---

### Raspberry Pi OS (Snap or Manual)

#### Prerequisites

- Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
- Raspberry Pi 3B+ or later (64-bit capable hardware)
- At least 2 GB RAM
- sudo privileges

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit (recommended, more packages available)
- `armv7l` = 32-bit (limited package availability)

**Important**: Draw.io Desktop ARM64 packages are available from GitHub releases. Snap packages may have limited ARM support.

#### Installation Steps

**For 64-bit Raspberry Pi OS (aarch64):**

Install via Snap (if available for your architecture):

```bash
# Install and configure snapd
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
sudo reboot
```

After reboot:

```bash
sudo snap install core
sudo snap install drawio
```

**Alternative: Install from .deb package (Recommended for ARM64):**

If Snap does not work on your architecture, download and install the ARM64 .deb package directly:

```bash
# Download the latest ARM64 .deb package
curl -s https://api.github.com/repos/jgraph/drawio-desktop/releases/latest | grep "browser_download_url.*arm64.*\.deb" | cut -d '"' -f 4 | xargs -I {} curl -L -o /tmp/drawio-arm64.deb {}

# Install the package and resolve dependencies
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/drawio-arm64.deb
```

**For 32-bit Raspberry Pi OS (armv7l):**

Draw.io Desktop does not officially provide 32-bit ARM packages. Use the web version instead:

1. Open Chromium browser on your Raspberry Pi
2. Navigate to https://app.diagrams.net
3. The web application provides the same functionality as the desktop app

#### Verification

For Snap installation:

```bash
snap list drawio
```

For .deb installation:

```bash
dpkg -l | grep drawio
```

Launch Draw.io:

```bash
drawio &
```

#### Troubleshooting

**Problem**: Snap installation fails with architecture error

**Solution**: Use the .deb package installation method described above for ARM64, or use the web version for 32-bit systems.

**Problem**: Application is slow or unresponsive

**Solution**: Draw.io is an Electron application which can be resource-intensive. Ensure you have adequate RAM (2 GB minimum, 4 GB recommended) and consider closing other applications.

**Problem**: Dependency errors when installing .deb package

**Solution**: Fix broken dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -f
```

---

### Amazon Linux (RPM Manual Installation)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- curl and wget installed

**Note**: Draw.io is not available in Amazon Linux's default repositories. Install the RPM package directly from GitHub releases.

#### Installation Steps

**For Amazon Linux 2023 (DNF):**

```bash
# Install required dependencies
sudo dnf install -y wget curl libxkbfile libsecret nss

# Download the latest x86_64 RPM package
curl -s https://api.github.com/repos/jgraph/drawio-desktop/releases/latest | grep "browser_download_url.*x86_64.*\.rpm" | cut -d '"' -f 4 | xargs -I {} curl -L -o /tmp/drawio.rpm {}

# Install the package
sudo dnf install -y /tmp/drawio.rpm
```

**For Amazon Linux 2 (YUM):**

```bash
# Install required dependencies
sudo yum install -y wget curl libxkbfile libsecret nss

# Download the latest x86_64 RPM package
curl -s https://api.github.com/repos/jgraph/drawio-desktop/releases/latest | grep "browser_download_url.*x86_64.*\.rpm" | cut -d '"' -f 4 | xargs -I {} curl -L -o /tmp/drawio.rpm {}

# Install the package
sudo yum install -y /tmp/drawio.rpm
```

#### Verification

Confirm the installation succeeded:

```bash
rpm -qa | grep drawio
```

Expected output (version numbers may vary):

```
drawio-29.2.9-1.x86_64
```

Launch Draw.io (requires X11 display):

```bash
drawio &
```

#### Troubleshooting

**Problem**: Missing library dependencies

**Solution**: Install common Electron dependencies:

```bash
# For AL2023
sudo dnf install -y gtk3 libdrm mesa-libgbm alsa-lib

# For AL2
sudo yum install -y gtk3 libdrm mesa-libgbm alsa-lib
```

**Problem**: "cannot open display" error

**Solution**: Draw.io is a GUI application requiring a graphical environment. On headless servers, use X11 forwarding:

```bash
ssh -X user@amazon-linux-host
drawio &
```

Or use the web version at https://app.diagrams.net for server environments.

**Problem**: RPM verification fails

**Solution**: Import the GPG key or skip verification (less secure):

```bash
sudo rpm --import https://github.com/jgraph.gpg
# Or skip verification
sudo rpm -ivh --nosignature /tmp/drawio.rpm
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 1809 or later (64-bit), or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install drawio -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation. The Chocolatey package uses the `/S` (silent) flag internally for the installer.

#### Verification

Confirm the installation succeeded:

```powershell
choco list drawio
```

Expected output (version numbers may vary):

```
drawio 29.2.9
1 packages installed.
```

Launch Draw.io from the Start Menu or via command line:

```powershell
start "" "C:\Program Files\draw.io\draw.io.exe"
```

#### Troubleshooting

**Problem**: Installation fails with access denied error

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click the terminal icon and select "Run as administrator".

**Problem**: `choco: command not found`

**Solution**: Chocolatey was not installed correctly or PATH was not updated. Close and reopen PowerShell, or reinstall Chocolatey.

**Problem**: Application does not appear after installation

**Solution**: The installer may require a system restart. If that does not help, verify the installation:

```powershell
Get-ChildItem "C:\Program Files\draw.io"
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL
- X11 server running on Windows (for GUI applications)

**Important**: Draw.io is a GUI application. Running it in WSL requires an X11 server on Windows to display the window.

#### Installation Steps

**Step 1: Install an X11 server on Windows**

Install VcXsrv or similar X11 server on Windows:

```powershell
# Run in Windows PowerShell as Administrator
choco install vcxsrv -y
```

Launch XLaunch from the Start Menu with default settings (Multiple windows, Start no client, Disable access control).

**Step 2: Configure WSL for X11 display**

In WSL Ubuntu, configure the DISPLAY variable:

```bash
# For WSL 2
echo 'export DISPLAY=$(grep -m 1 nameserver /etc/resolv.conf | awk "{print \$2}"):0' >> ~/.bashrc
source ~/.bashrc
```

**Step 3: Install Draw.io via Snap**

```bash
# Install snapd if not present
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd

# Install Draw.io
sudo snap install drawio
```

#### Verification

Confirm the installation succeeded:

```bash
snap list drawio
```

Launch Draw.io (ensure X11 server is running on Windows):

```bash
drawio &
```

A Draw.io window should appear on your Windows desktop.

#### Troubleshooting

**Problem**: `Error: cannot open display`

**Solution**: Ensure the X11 server is running on Windows and DISPLAY is set correctly:

```bash
echo $DISPLAY
```

If empty or incorrect, set it manually:

```bash
export DISPLAY=$(grep -m 1 nameserver /etc/resolv.conf | awk '{print $2}'):0
```

**Problem**: Snap does not work in WSL

**Solution**: Snap requires systemd which is not enabled by default in WSL. Enable systemd:

```bash
echo -e "[boot]\nsystemd=true" | sudo tee /etc/wsl.conf
```

Then restart WSL from Windows PowerShell:

```powershell
wsl --shutdown
```

Re-open WSL and retry the Snap installation.

**Problem**: Window appears but is blank or crashes

**Solution**: Try running with software rendering:

```bash
drawio --disable-gpu &
```

---

### Git Bash (Windows Portable Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Internet connection to download the portable package

**Note**: Git Bash runs on Windows, so the primary installation method is the Windows Chocolatey installation (see Windows section). However, if you cannot use Chocolatey or need a portable installation, follow these steps.

#### Installation Steps

Download and extract the portable Windows ZIP package:

```bash
# Create a directory for portable applications
mkdir -p ~/portable-apps

# Download the latest Windows ZIP (portable version)
curl -L -o /tmp/drawio.zip "$(curl -s https://api.github.com/repos/jgraph/drawio-desktop/releases/latest | grep 'browser_download_url.*windows\.zip' | head -1 | cut -d '"' -f 4)"

# Extract to portable apps directory
unzip -q /tmp/drawio.zip -d ~/portable-apps/drawio

# Clean up
rm /tmp/drawio.zip
```

Add an alias for easy access from Git Bash:

```bash
echo 'alias drawio="~/portable-apps/drawio/draw.io.exe"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
ls ~/portable-apps/drawio/
```

Expected output should include `draw.io.exe` and supporting files.

Launch Draw.io:

```bash
drawio &
```

Or directly:

```bash
~/portable-apps/drawio/draw.io.exe &
```

#### Troubleshooting

**Problem**: `unzip: command not found`

**Solution**: Install unzip via Git Bash's package manager or use Windows built-in extraction:

```bash
# Alternative using PowerShell from Git Bash
powershell -command "Expand-Archive -Path '/tmp/drawio.zip' -DestinationPath '$HOME/portable-apps/drawio'"
```

**Problem**: Permission denied when running the executable

**Solution**: Windows may have blocked the downloaded file. Unblock it:

```bash
powershell -command "Unblock-File -Path '$HOME/portable-apps/drawio/draw.io.exe'"
```

**Problem**: PATH issues with spaces in directory names

**Solution**: Ensure the path is quoted correctly in aliases and commands. Use Windows-style paths if needed:

```bash
alias drawio='"/c/Users/YourName/portable-apps/drawio/draw.io.exe"'
```

---

## Post-Installation Configuration

After installing Draw.io on any platform, consider these optional configurations.

### Setting Default File Format

Draw.io supports multiple file formats. To set a default:

1. Open Draw.io
2. Go to File > Properties
3. Set your preferred default format (`.drawio`, `.drawio.xml`, `.drawio.svg`, `.drawio.png`)

### Configuring Automatic Updates

**macOS (Homebrew)**: Updates are manual. Run periodically:

```bash
brew upgrade --cask drawio
```

**Linux (Snap)**: Updates are automatic via snapd.

**Windows (Chocolatey)**: Run periodically:

```powershell
choco upgrade drawio -y
```

### Disabling Update Checks

If you prefer to control updates manually, you can disable automatic update checks:

1. Open Draw.io
2. Go to Help > Check for Updates
3. Disable automatic checking

### Integrating with Version Control

Draw.io files (`.drawio`) are XML-based and can be version-controlled with Git. For better diff support:

1. Save diagrams as `.drawio.svg` or `.drawio.png` for visual diffs
2. Or use `.drawio.xml` for text-based diffs

---

## Common Issues

### Issue: Application Takes Long Time to Start

**Symptoms**: Draw.io shows a blank window or loading indicator for an extended period.

**Solutions**:

- Disable hardware acceleration: Launch with `--disable-gpu` flag
- Clear application cache (location varies by platform)
- Ensure sufficient system resources are available

### Issue: Cannot Open Files from Network Drives

**Symptoms**: Error when trying to open diagrams stored on network shares.

**Solutions**:

- Copy the file locally first, then open it
- On Linux Snap installations, connect the removable-media interface:

```bash
sudo snap connect drawio:removable-media
```

### Issue: Export to PDF Fails

**Symptoms**: PDF export produces blank or corrupted files.

**Solutions**:

- Ensure the diagram is not empty
- Try exporting to PNG first, then convert to PDF
- Update to the latest version of Draw.io

### Issue: Fonts Appear Incorrect

**Symptoms**: Diagram text uses incorrect or fallback fonts.

**Solutions**:

- Install the required fonts on your system
- Use web-safe fonts for maximum compatibility
- Embed fonts when exporting (File > Export As > Advanced Options)

### Issue: Slow Performance with Large Diagrams

**Symptoms**: Application becomes sluggish with complex diagrams.

**Solutions**:

- Split large diagrams into multiple pages
- Reduce the use of complex shapes and gradients
- Increase available system memory
- Disable "Connection Arrows" for complex diagrams

---

## References

- [Draw.io Official Website](https://www.drawio.com/)
- [Draw.io Desktop GitHub Repository](https://github.com/jgraph/drawio-desktop)
- [Draw.io Desktop Releases](https://github.com/jgraph/drawio-desktop/releases)
- [Homebrew Cask - drawio](https://formulae.brew.sh/cask/drawio)
- [Snap Store - drawio](https://snapcraft.io/drawio)
- [Chocolatey Package - drawio](https://community.chocolatey.org/packages/drawio)
- [Draw.io Desktop Documentation](https://www.drawio.com/blog/diagrams-offline)
- [Installing Snap on Raspberry Pi OS](https://snapcraft.io/docs/installing-snap-on-raspbian)
- [Draw.io Silent Installation Guide](https://silentinstallhq.com/draw-io-silent-install-how-to-guide/)
