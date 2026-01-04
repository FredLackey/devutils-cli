# Installing Balena Etcher

## Overview

Balena Etcher is a powerful, open-source OS image flasher built with web technologies. It provides a safe and easy way to flash OS images to SD cards and USB drives. Etcher validates the writing process to ensure every byte of data is written correctly, and it includes safeguards to prevent accidentally writing to your hard drives. The tool supports a wide range of image formats including ISO, IMG, ZIP, and compressed archives.

Balena Etcher is commonly used for:

- Creating bootable USB drives for operating system installation
- Flashing Raspberry Pi images to SD cards
- Writing disk images for embedded systems and IoT devices
- Preparing recovery media

## Prerequisites

Before installing Balena Etcher on any platform, ensure:

1. **Internet connectivity** - Required to download the installer or package
2. **Administrative privileges** - Required on most platforms for installation
3. **64-bit operating system** - Balena Etcher requires a 64-bit system on all platforms
4. **GUI environment** - Balena Etcher is a graphical application and requires a desktop environment

**Important**: Balena Etcher is a GUI application. It cannot be run headlessly or via SSH without X11 forwarding.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- **Optional:** None
- **Auto-installed:** None (Homebrew cask handles all application dependencies automatically)

### Ubuntu (APT/Snap)
- **Required:**
  - `wget` - Install via `sudo apt-get install -y wget` (auto-installed by script if missing)
  - `sudo` privileges - Required for package installation
- **Optional:** None
- **Auto-installed:** Package dependencies are automatically resolved by APT when installing the .deb file

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - 64-bit Raspberry Pi OS (aarch64 architecture) - Verify with `uname -m`
  - `wget` - Usually pre-installed, or install via `sudo apt-get install -y wget`
  - Pi-Apps - Auto-installed by the script from https://github.com/Botspot/pi-apps
- **Optional:** None
- **Auto-installed:**
  - Pi-Apps and its dependencies: `yad`, `curl`, `wget` (installed during Pi-Apps setup if missing)

### Amazon Linux (DNF/YUM)
- **Required:**
  - `wget` - Install via `sudo dnf install -y wget` or `sudo yum install -y wget` (auto-installed by script if missing)
  - `sudo` privileges - Required for package installation
- **Optional:**
  - Desktop environment (GNOME, KDE, etc.) - Install via `sudo dnf groupinstall -y "Server with GUI"`
- **Auto-installed:**
  - Runtime dependencies (may include): `libXScrnSaver`, `gtk3`, `nss`, `alsa-lib` - installed automatically by DNF/YUM when installing the .rpm package

### Windows (Chocolatey/winget)
- **Required:**
  - Chocolatey OR winget package manager
    - Chocolatey - Install via PowerShell (Administrator): `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
    - winget - Pre-installed on Windows 11 and recent Windows 10 builds
  - Administrator privileges - Required for installation
- **Optional:** None
- **Auto-installed:** All runtime dependencies are handled automatically by the package manager

### Git Bash (Manual/Portable)
- **Required:**
  - Git Bash - Install via https://git-scm.com/download/win
  - Windows 10 or Windows 11 (64-bit)
  - Chocolatey (for package manager install) OR ability to download portable version
- **Optional:**
  - `unzip` - Usually included with Git Bash, needed for portable version extraction
  - PowerShell - Alternative method for extracting zip files
- **Auto-installed:** None (delegates to Windows Chocolatey installation, or uses manually extracted portable version)

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- Terminal access

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Balena Etcher:

```bash
brew install --cask --quiet balenaetcher
```

The `--cask` flag specifies this is a GUI application (cask), and `--quiet` suppresses non-essential output, making the command suitable for automation scripts.

#### Verification

Confirm the installation succeeded by checking the application exists:

```bash
ls /Applications/balenaEtcher.app
```

Expected output:

```
/Applications/balenaEtcher.app
```

Alternatively, launch the application:

```bash
open /Applications/balenaEtcher.app
```

#### Troubleshooting

**Problem**: `Error: Cask balenaetcher is not available`

**Solution**: Update Homebrew's cask definitions:

```bash
brew update
```

**Problem**: Installation blocked by macOS Gatekeeper

**Solution**: The application is signed, but macOS may still block it on first launch. Open System Preferences > Security & Privacy and click "Open Anyway" for balenaEtcher.

**Problem**: Permission denied errors during installation

**Solution**: Fix Homebrew permissions:

```bash
sudo chown -R $(whoami) /Applications
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 or later (64-bit)
- sudo privileges
- wget or curl installed

**Important**: The official Balena Etcher APT repository is deprecated and no longer receives updates. Install Balena Etcher by downloading the `.deb` package directly from GitHub releases.

#### Installation Steps

Download and install the latest Balena Etcher `.deb` package:

```bash
wget -q -O /tmp/balena-etcher.deb "https://github.com/balena-io/etcher/releases/download/v2.1.4/balena-etcher_2.1.4_amd64.deb"
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/balena-etcher.deb
rm -f /tmp/balena-etcher.deb
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully non-interactive installation. The temporary file is cleaned up after installation.

#### Verification

Confirm the installation succeeded:

```bash
which balena-etcher || dpkg -l | grep balena-etcher
```

Expected output showing the package is installed:

```
ii  balena-etcher  2.1.4  amd64  Flash OS images to SD cards & USB drives, safely and easily.
```

Launch the application from the terminal:

```bash
balena-etcher &
```

#### Troubleshooting

**Problem**: `dpkg: dependency problems prevent configuration`

**Solution**: Fix broken dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -f -y
```

**Problem**: Application fails to launch with GPU/sandbox errors

**Solution**: Run with sandbox disabled (for troubleshooting only):

```bash
balena-etcher --no-sandbox
```

For a permanent fix, ensure your system has proper graphics drivers installed.

**Problem**: `wget: command not found`

**Solution**: Install wget first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget
```

---

### Raspberry Pi OS (Pi-Apps)

#### Prerequisites

- Raspberry Pi OS (64-bit) - **Required**
- Raspberry Pi 3, 4, or 5 (64-bit capable hardware)
- Desktop environment installed (Raspberry Pi OS with Desktop)
- Internet connectivity

**Critical**: Balena Etcher does NOT have an official ARM installer. The x86/x64 packages from the official website will not work on Raspberry Pi. Use Pi-Apps to install a community-compiled ARM64 version.

Verify you are running 64-bit Raspberry Pi OS:

```bash
uname -m
```

This **must** output `aarch64`. If it outputs `armv7l`, you need to install the 64-bit version of Raspberry Pi OS.

#### Installation Steps

First, install Pi-Apps (the Raspberry Pi app store):

```bash
wget -qO- https://raw.githubusercontent.com/Botspot/pi-apps/master/install | bash
```

After Pi-Apps is installed, install Balena Etcher using the Pi-Apps CLI:

```bash
/home/$USER/pi-apps/manage install 'BalenaEtcher'
```

**Note**: The Pi-Apps installation process may display progress in a GUI window. For fully headless installation, you can use:

```bash
DISPLAY=:0 /home/$USER/pi-apps/manage install 'BalenaEtcher'
```

#### Verification

Confirm the installation succeeded:

```bash
which balena-etcher-electron || ls /usr/bin/balena-etcher*
```

Launch the application:

```bash
balena-etcher-electron &
```

#### Troubleshooting

**Problem**: Pi-Apps installation fails

**Solution**: Ensure you have a desktop environment and required dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y yad curl wget
```

**Problem**: `BalenaEtcher will only run on PiOS 64-bit`

**Solution**: You must use the 64-bit version of Raspberry Pi OS. Download it from https://www.raspberrypi.com/software/operating-systems/ and reflash your SD card.

**Problem**: Application crashes on launch

**Solution**: Ensure you have sufficient GPU memory. Edit `/boot/config.txt` and set:

```
gpu_mem=128
```

Then reboot:

```bash
sudo reboot
```

**Alternative Approach**: If you need to flash SD cards on a Raspberry Pi, consider using Raspberry Pi Imager instead, which has official ARM support:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y rpi-imager
```

---

### Amazon Linux/RHEL (DNF)

#### Prerequisites

- Amazon Linux 2023, Amazon Linux 2, RHEL 8+, or Fedora 35+
- 64-bit (x86_64) architecture
- sudo privileges
- Desktop environment installed (GNOME, KDE, etc.)

**Note**: Amazon Linux is typically used as a server OS without a GUI. If you need Balena Etcher on Amazon Linux, you must first install a desktop environment.

#### Installation Steps

Download and install the latest Balena Etcher RPM package:

```bash
wget -q -O /tmp/balena-etcher.rpm "https://github.com/balena-io/etcher/releases/download/v2.1.4/balena-etcher-2.1.4-1.x86_64.rpm"
sudo dnf install -y /tmp/balena-etcher.rpm
rm -f /tmp/balena-etcher.rpm
```

The `-y` flag ensures non-interactive installation without prompts.

For Amazon Linux 2 (which uses `yum` instead of `dnf`):

```bash
wget -q -O /tmp/balena-etcher.rpm "https://github.com/balena-io/etcher/releases/download/v2.1.4/balena-etcher-2.1.4-1.x86_64.rpm"
sudo yum install -y /tmp/balena-etcher.rpm
rm -f /tmp/balena-etcher.rpm
```

**Note**: During installation, DNF may display a warning about skipping OpenPGP checks for packages from the commandline repository. This is expected behavior when installing local RPM files.

#### Verification

Confirm the installation succeeded:

```bash
rpm -q balena-etcher
```

Expected output:

```
balena-etcher-2.1.4-1.x86_64
```

The binary installs to `/usr/bin/balena-etcher`:

```bash
which balena-etcher
```

#### Troubleshooting

**Problem**: `No package balena-etcher available`

**Solution**: Ensure you are installing from the downloaded RPM file, not from a repository:

```bash
sudo dnf install -y /tmp/balena-etcher.rpm
```

**Problem**: Missing dependencies

**Solution**: Install required libraries:

```bash
sudo dnf install -y libXScrnSaver gtk3 nss alsa-lib
```

**Problem**: Cannot launch - no display

**Solution**: Amazon Linux servers typically do not have a GUI. Install a desktop environment first:

```bash
sudo dnf groupinstall -y "Server with GUI"
sudo systemctl set-default graphical.target
sudo reboot
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Chocolatey package manager installed
- Administrator PowerShell or Command Prompt

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install etcher -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Alternative (winget)**: If you prefer winget:

```powershell
winget install --id Balena.Etcher --silent --accept-source-agreements --accept-package-agreements
```

The `--silent`, `--accept-source-agreements`, and `--accept-package-agreements` flags ensure non-interactive installation.

#### Verification

After installation, verify by checking the installation path:

```powershell
Test-Path "C:\Program Files\balenaEtcher\balenaEtcher.exe"
```

Expected output:

```
True
```

Launch the application:

```powershell
Start-Process "C:\Program Files\balenaEtcher\balenaEtcher.exe"
```

#### Troubleshooting

**Problem**: `choco: The term 'choco' is not recognized`

**Solution**: Chocolatey is not installed or not in PATH. Close all terminals, open a new Administrator PowerShell, and verify Chocolatey installation:

```powershell
refreshenv
choco --version
```

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell as Administrator. Right-click PowerShell and select "Run as administrator".

**Problem**: Application does not appear in Start menu

**Solution**: The Start menu shortcut may take a moment to appear. Alternatively, search for "balenaEtcher" in the Windows search bar or navigate to the installation directory.

**Problem**: Windows Defender blocks the installation

**Solution**: Balena Etcher is safe software. Temporarily disable real-time protection or add an exclusion for the Chocolatey and balenaEtcher directories.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows Subsystem for Linux with Ubuntu installed
- WSL 2 recommended (required for GUI support)
- Windows 11 or Windows 10 with WSLg enabled
- sudo privileges within WSL

**Important**: Balena Etcher is a GUI application. Running GUI applications in WSL requires WSLg (Windows Subsystem for Linux GUI), which is available in Windows 11 and recent Windows 10 builds.

#### Installation Steps

Follow the same steps as Ubuntu/Debian:

```bash
wget -q -O /tmp/balena-etcher.deb "https://github.com/balena-io/etcher/releases/download/v2.1.4/balena-etcher_2.1.4_amd64.deb"
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/balena-etcher.deb
rm -f /tmp/balena-etcher.deb
```

#### Verification

Check the package is installed:

```bash
dpkg -l | grep balena-etcher
```

Launch the application (requires WSLg):

```bash
balena-etcher &
```

#### Troubleshooting

**Problem**: `cannot open display` error

**Solution**: WSLg may not be enabled or configured. Verify WSLg is working:

```bash
echo $DISPLAY
```

This should output something like `:0`. If empty, ensure you are using WSL 2 and Windows 11 (or Windows 10 with WSLg enabled):

```powershell
# In Windows PowerShell
wsl --update
wsl --shutdown
wsl
```

**Problem**: USB devices not accessible from WSL

**Solution**: WSL does not have native USB passthrough. For flashing USB drives, install Balena Etcher directly on Windows instead (see Windows section). Alternatively, use USB/IP to forward USB devices to WSL.

**Problem**: Application fails with sandbox errors

**Solution**: Run without sandbox:

```bash
balena-etcher --no-sandbox &
```

**Recommended Alternative**: For USB flashing operations, install Balena Etcher on Windows directly (using Chocolatey or winget) rather than in WSL, as WSL has limited USB device access.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Balena Etcher installed on Windows (see Windows section above)

**Note**: Git Bash runs on Windows and inherits the Windows PATH. Once Balena Etcher is installed on Windows, it is automatically accessible from Git Bash. There is no separate Git Bash installation required.

#### Installation Steps

Install Balena Etcher on Windows using Chocolatey from Git Bash:

```bash
# Call Windows Chocolatey from Git Bash (requires Administrator Git Bash)
/c/ProgramData/chocolatey/bin/choco.exe install etcher -y
```

Alternatively, download and run the portable version without requiring Administrator privileges:

```bash
# Create a local applications directory
mkdir -p ~/Applications

# Download the portable Windows version
curl -L -o ~/Applications/balenaEtcher.zip "https://github.com/balena-io/etcher/releases/download/v2.1.4/balenaEtcher-win32-x64-2.1.4.zip"

# Extract the archive
unzip -q ~/Applications/balenaEtcher.zip -d ~/Applications/balenaEtcher

# Clean up the zip file
rm ~/Applications/balenaEtcher.zip
```

#### Verification

If installed via Chocolatey, verify the installation:

```bash
ls "/c/Program Files/balenaEtcher/balenaEtcher.exe"
```

If using the portable version:

```bash
ls ~/Applications/balenaEtcher/balenaEtcher.exe
```

Launch the application:

```bash
# Installed version
"/c/Program Files/balenaEtcher/balenaEtcher.exe" &

# Or portable version
~/Applications/balenaEtcher/balenaEtcher.exe &
```

#### Troubleshooting

**Problem**: Chocolatey command not found

**Solution**: Chocolatey may not be installed or the path is different. Install via PowerShell first (see Windows section), then access from Git Bash.

**Problem**: Permission denied when installing via Chocolatey

**Solution**: Git Bash must be run as Administrator for Chocolatey installations. Right-click Git Bash and select "Run as administrator".

**Problem**: Cannot extract zip file

**Solution**: Install unzip if not available:

```bash
# unzip is typically included with Git Bash, but if missing:
pacman -S unzip  # Only works if pacman is available (MSYS2)
```

Alternatively, use PowerShell to extract:

```bash
powershell -command "Expand-Archive -Path '$HOME/Applications/balenaEtcher.zip' -DestinationPath '$HOME/Applications/balenaEtcher'"
```

---

## Post-Installation Configuration

Balena Etcher requires no configuration after installation. The application is ready to use immediately.

### First Launch

1. Launch Balena Etcher from your application menu or command line
2. Click "Flash from file" to select an OS image (ISO, IMG, ZIP, etc.)
3. Click "Select target" to choose your USB drive or SD card
4. Click "Flash!" to begin the writing process

### USB Device Permissions (Linux Only)

On Linux systems, you may need to add your user to the appropriate groups to access USB devices without sudo:

```bash
sudo usermod -a -G disk $USER
sudo usermod -a -G plugdev $USER
```

Log out and log back in for group changes to take effect.

### Creating Desktop Shortcuts (Linux)

If a desktop shortcut is not automatically created, you can create one manually:

```bash
cat > ~/.local/share/applications/balena-etcher.desktop << 'EOF'
[Desktop Entry]
Name=balenaEtcher
Comment=Flash OS images to SD cards and USB drives
Exec=/usr/bin/balena-etcher %U
Icon=balena-etcher
Terminal=false
Type=Application
Categories=Utility;
EOF
```

---

## Common Issues

### Issue: "No polkit authentication agent found"

**Symptoms**: Error message about polkit when trying to flash drives on Linux.

**Solution**: Install a polkit authentication agent:

```bash
# Ubuntu/Debian
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y policykit-1-gnome

# Fedora/Amazon Linux
sudo dnf install -y polkit-gnome
```

### Issue: USB Drive Not Detected

**Symptoms**: The USB drive does not appear in the target selection.

**Solution**:

1. Ensure the USB drive is properly inserted
2. Try a different USB port (preferably USB 2.0 for compatibility)
3. On Linux, check if the device is mounted and unmount it:

```bash
# Find the device
lsblk

# Unmount if mounted (replace sdX with your device)
sudo umount /dev/sdX*
```

### Issue: Flash Validation Fails

**Symptoms**: The flash completes but validation fails with errors.

**Solution**:

1. The SD card or USB drive may be faulty - try a different one
2. Download the image file again (it may be corrupted)
3. Verify the image checksum before flashing:

```bash
sha256sum your-image-file.img
```

### Issue: Application Crashes on Launch

**Symptoms**: Balena Etcher immediately closes or shows a blank window.

**Solution**:

1. Update your graphics drivers
2. Try launching with GPU acceleration disabled:

```bash
# Linux
balena-etcher --disable-gpu

# Windows (PowerShell)
& "C:\Program Files\balenaEtcher\balenaEtcher.exe" --disable-gpu
```

### Issue: "EACCES: permission denied" on Linux

**Symptoms**: Permission errors when trying to write to a drive.

**Solution**: Run Balena Etcher with elevated privileges (not recommended for regular use):

```bash
sudo balena-etcher
```

Better solution: Fix udev rules for USB device access:

```bash
echo 'SUBSYSTEM=="usb", MODE="0666"' | sudo tee /etc/udev/rules.d/50-usb.rules
sudo udevadm control --reload-rules
sudo udevadm trigger
```

---

## References

- [Balena Etcher Official Website](https://etcher.balena.io/)
- [Balena Etcher GitHub Repository](https://github.com/balena-io/etcher)
- [Balena Etcher GitHub Releases](https://github.com/balena-io/etcher/releases)
- [Homebrew Cask - balenaetcher](https://formulae.brew.sh/cask/balenaetcher)
- [Chocolatey Package - etcher](https://community.chocolatey.org/packages/etcher)
- [winget Package - Balena.Etcher](https://winget.run/pkg/Balena/Etcher)
- [Pi-Apps - BalenaEtcher for Raspberry Pi](https://pi-apps.io/install-app/install-balenaetcher-on-raspberry-pi/)
- [BalenaEtcher ARM Builds (Community)](https://github.com/Itai-Nelken/BalenaEtcher-arm)
- [PortableApps - balenaEtcher Portable](https://portableapps.com/apps/utilities/balenaetcher-portable)
