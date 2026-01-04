# Installing Bambu Studio

## Overview

Bambu Studio is an open-source, feature-rich 3D printing slicer software developed by Bambu Lab. It converts 3D model files (STL, OBJ, 3MF, or AMF) into G-code that 3D printers can understand. Built upon PrusaSlicer, Bambu Studio provides project-based workflows, optimized slicing algorithms, native AMS (Automatic Material System) integration for multi-color printing, and an intuitive graphical interface. While designed primarily for Bambu Lab printers (X1, P1, and A1 series), it supports other 3D printers as well.

## Prerequisites

Before installing Bambu Studio on any platform, ensure:

1. **Internet connectivity** - Required to download the installer and for cloud-based features
2. **64-bit operating system** - Bambu Studio requires a 64-bit system on all platforms
3. **OpenGL support** - A GPU with OpenGL 2.0 or higher support is required
4. **Adequate system resources** - Intel Core i3 / AMD Ryzen 3 (dual-core 2.5 GHz or higher) recommended

**Important**: Bambu Studio is a GUI application. Headless server environments without display capabilities cannot run this software.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager installed
- Terminal access

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Bambu Studio:

```bash
brew install --cask --quiet bambu-studio
```

The `--cask` flag specifies this is a macOS application (not a command-line formula), and `--quiet` suppresses non-essential output for automation-friendly installation.

#### Verification

Confirm the installation succeeded by checking the application exists:

```bash
ls /Applications/BambuStudio.app
```

Expected output:

```
/Applications/BambuStudio.app
```

Alternatively, launch the application:

```bash
open /Applications/BambuStudio.app
```

#### Troubleshooting

**Problem**: `Error: Cask 'bambu-studio' is not available`

**Solution**: Update Homebrew to get the latest cask definitions:

```bash
brew update
```

**Problem**: macOS blocks the application with "cannot be opened because the developer cannot be verified"

**Solution**: Approve the application in System Settings:

1. Open System Settings > Privacy & Security
2. Scroll down to find the blocked application message
3. Click "Open Anyway"

Or remove the quarantine attribute via Terminal:

```bash
xattr -dr com.apple.quarantine /Applications/BambuStudio.app
```

**Problem**: Permission denied errors during installation

**Solution**: Fix Homebrew ownership:

```bash
sudo chown -R $(whoami) /opt/homebrew
```

---

### Ubuntu/Debian (Flatpak)

#### Prerequisites

- Ubuntu 20.04 or later, or Debian 11 or later (64-bit)
- Flatpak package manager
- sudo privileges
- X11 or Wayland display server

**Important**: There is no official APT package or Snap package for Bambu Studio. Use Flatpak from Flathub, which is the recommended installation method for Linux.

#### Installation Steps

First, install Flatpak if not already present:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y flatpak
```

Add the Flathub repository:

```bash
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

Restart your system for Flatpak to fully initialize (or log out and log back in):

```bash
sudo reboot
```

After reboot, install Bambu Studio:

```bash
flatpak install -y flathub com.bambulab.BambuStudio
```

The `-y` flag automatically confirms the installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
flatpak list | grep -i bambu
```

Expected output:

```
Bambu Studio    com.bambulab.BambuStudio    stable    flathub
```

Launch the application:

```bash
flatpak run com.bambulab.BambuStudio
```

#### Troubleshooting

**Problem**: `error: Unable to load summary from remote flathub`

**Solution**: The Flathub repository may not be properly configured. Re-add it:

```bash
flatpak remote-delete flathub
flatpak remote-add flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

**Problem**: Application crashes on startup or shows blank home tab

**Solution**: The Flatpak version resolves many display issues. Ensure you have the latest version:

```bash
flatpak update -y
```

**Problem**: `error: app/com.bambulab.BambuStudio/x86_64/stable not installed`

**Solution**: The installation may have failed. Retry:

```bash
flatpak uninstall -y com.bambulab.BambuStudio 2>/dev/null || true
flatpak install -y flathub com.bambulab.BambuStudio
```

**Problem**: Network plugin installation loop ("Bambu Network plug-in not detected. Click here to install it.")

**Solution**: This is a known issue on some Linux systems. The Flatpak version typically handles this better than AppImage. If the issue persists, the network features may be limited on Linux.

---

### Raspberry Pi OS (Pi-Apps)

#### Prerequisites

- Raspberry Pi OS (64-bit only) - Bookworm or later recommended
- Raspberry Pi 3B+ or later (64-bit capable hardware)
- Pi-Apps package manager
- Desktop environment (GUI required)

**Important**: Bambu Studio requires a 64-bit operating system. It will not run on 32-bit Raspberry Pi OS. Verify your architecture:

```bash
uname -m
```

This must output `aarch64`. If it outputs `armv7l`, you need to install the 64-bit version of Raspberry Pi OS from https://www.raspberrypi.com/software/operating-systems/

#### Installation Steps

First, install Pi-Apps if not already present:

```bash
wget -qO- https://raw.githubusercontent.com/Botspot/pi-apps/master/install | bash
```

Wait for the installation to complete. Pi-Apps will be added to your application menu.

Install Bambu Studio using the Pi-Apps command-line interface:

```bash
/home/$USER/pi-apps/manage install "Bambu Studio"
```

**Note**: The Pi-Apps installation script handles all dependencies and ARM-specific compilation automatically. This process may take significant time on Raspberry Pi hardware.

#### Verification

Confirm the installation succeeded:

```bash
which bambu-studio || ls ~/.local/share/applications/*bambu* 2>/dev/null
```

Launch the application from the desktop menu under Engineering, or via command line:

```bash
bambu-studio
```

#### Troubleshooting

**Problem**: Pi-Apps shows "Bambu Studio will only run on PiOS 64-bit"

**Solution**: You are running 32-bit Raspberry Pi OS. Download and install the 64-bit version:
1. Visit https://www.raspberrypi.com/software/operating-systems/
2. Download "Raspberry Pi OS (64-bit)"
3. Re-flash your SD card with the 64-bit image

**Problem**: Installation fails with memory errors

**Solution**: Raspberry Pi may run out of memory during compilation. Increase swap space:

```bash
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

Then retry the installation.

**Problem**: Network plugin repeatedly fails to install

**Solution**: This is a known limitation on ARM Linux. The network plugin may not be fully functional on Raspberry Pi. Local file-based workflows will still work.

**Problem**: Application is very slow or unresponsive

**Solution**: Bambu Studio is resource-intensive. Ensure you are using a Raspberry Pi 4 or 5 with at least 4GB RAM. Close other applications to free up memory.

---

### Amazon Linux (Not Officially Supported)

#### Prerequisites

- Amazon Linux 2023 or Amazon Linux 2
- Desktop environment with X11/Wayland support
- Flatpak package manager (must be installed manually)

**Important**: Amazon Linux is primarily a server operating system and does not have a desktop environment by default. Bambu Studio is a GUI application and requires a display. This platform is not recommended for Bambu Studio usage. Consider using a desktop Linux distribution or Windows instead.

#### Installation Steps

If you must run Bambu Studio on Amazon Linux with a desktop environment, use Flatpak:

Install Flatpak:

```bash
sudo dnf install -y flatpak
```

Add the Flathub repository:

```bash
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

Install Bambu Studio:

```bash
flatpak install -y flathub com.bambulab.BambuStudio
```

#### Verification

Confirm the installation succeeded:

```bash
flatpak list | grep -i bambu
```

Expected output:

```
Bambu Studio    com.bambulab.BambuStudio    stable    flathub
```

#### Troubleshooting

**Problem**: `flatpak: command not found`

**Solution**: Flatpak is not included by default on Amazon Linux. Install it:

```bash
sudo dnf install -y flatpak
```

**Problem**: Cannot launch application - no display

**Solution**: Amazon Linux requires a desktop environment. Install one:

```bash
sudo dnf groupinstall -y "GNOME Desktop Environment"
```

Then configure your system to boot into graphical mode or use VNC/remote desktop.

**Problem**: OpenGL errors or rendering issues

**Solution**: Install graphics drivers and ensure hardware acceleration is available:

```bash
sudo dnf install -y mesa-libGL mesa-libGLU mesa-dri-drivers
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
choco install bambustudio -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Note**: The Chocolatey package depends on `vcredist140` (Visual C++ Redistributable), which will be installed automatically if not present.

#### Verification

Open a new Command Prompt or PowerShell window (required for PATH and Start Menu updates), then verify installation:

```powershell
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" | Where-Object { $_.DisplayName -like "*Bambu Studio*" } | Select-Object DisplayName, DisplayVersion
```

Expected output:

```
DisplayName   DisplayVersion
-----------   --------------
Bambu Studio  02.04.00.70
```

Launch the application from the Start Menu or via command:

```powershell
Start-Process "C:\Program Files\Bambu Studio\bambu-studio.exe"
```

#### Troubleshooting

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: Visual C++ Redistributable installation fails

**Solution**: Download and install manually from Microsoft:

```powershell
choco install vcredist140 -y
```

Then retry the Bambu Studio installation.

**Problem**: Application crashes on startup

**Solution**: Bambu Studio requires OpenGL 2.0+. Update your graphics drivers to the latest version from your GPU manufacturer (NVIDIA, AMD, or Intel).

**Problem**: Installation path contains non-ASCII characters causing issues

**Solution**: Uninstall and reinstall to a path containing only ASCII characters:

```powershell
choco uninstall bambustudio -y
choco install bambustudio -y --install-arguments="'/D=C:\BambuStudio'"
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 Build 19044+ or Windows 11
- WSL 2 with Ubuntu installed
- WSLg enabled (default on Windows 11 and recent Windows 10 updates)
- GPU drivers installed on Windows host

**Note**: WSL 2 with WSLg enables Linux GUI applications to run with native Windows integration. Bambu Studio will appear as a regular Windows window.

#### Installation Steps

First, verify WSL 2 and WSLg are properly configured. From Windows PowerShell:

```powershell
wsl --update
```

Inside WSL Ubuntu, install Flatpak:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y flatpak
```

Add the Flathub repository:

```bash
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

Exit and restart WSL for changes to take effect. From Windows PowerShell:

```powershell
wsl --shutdown
```

Then reopen your WSL Ubuntu terminal and install Bambu Studio:

```bash
flatpak install -y flathub com.bambulab.BambuStudio
```

#### Verification

Confirm the installation succeeded:

```bash
flatpak list | grep -i bambu
```

Expected output:

```
Bambu Studio    com.bambulab.BambuStudio    stable    flathub
```

Launch the application (a Windows window should appear):

```bash
flatpak run com.bambulab.BambuStudio
```

#### Troubleshooting

**Problem**: Application window does not appear

**Solution**: WSLg may not be enabled. Verify from Windows PowerShell:

```powershell
wsl --version
```

Ensure WSLg is listed. If not, update WSL:

```powershell
wsl --update
```

**Problem**: OpenGL errors or blank display

**Solution**: Install vGPU drivers for WSL. Download the appropriate driver:
- NVIDIA: https://developer.nvidia.com/cuda/wsl
- AMD: https://www.amd.com/en/support
- Intel: https://www.intel.com/content/www/us/en/download/19344/intel-graphics-windows-dch-drivers.html

**Problem**: Flatpak hangs during installation

**Solution**: WSL may have network issues. Try restarting the WSL networking:

```powershell
# From Windows PowerShell (Admin)
wsl --shutdown
netsh winsock reset
```

Then restart WSL and retry.

**Problem**: Poor performance compared to native Windows

**Solution**: WSL adds overhead. For best performance with Bambu Studio, use the native Windows installation instead.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Bambu Studio installed on Windows (see Windows section above)

**Note**: Git Bash on Windows does not require a separate Bambu Studio installation. Git Bash inherits the Windows PATH, so once Bambu Studio is installed on Windows via Chocolatey (or other methods), it is accessible from Git Bash.

#### Installation Steps

Install Bambu Studio on Windows using Chocolatey. From Git Bash with Administrator privileges:

```bash
/c/ProgramData/chocolatey/bin/choco.exe install bambustudio -y
```

Alternatively, download and run the installer silently using curl:

```bash
# Download the installer
curl -L -o /tmp/BambuStudio_installer.exe "https://github.com/bambulab/BambuStudio/releases/latest/download/Bambu_Studio_win_public-v02.04.00.70.exe"

# Note: Run the following from an Administrator Command Prompt (not Git Bash)
# The /S flag enables silent installation
# Bambu_Studio_win_public-v02.04.00.70.exe /S
```

**Important**: The NSIS installer must be run from a native Windows command prompt with Administrator privileges for silent installation. Git Bash cannot directly execute silent Windows installers with the `/S` flag reliably.

After installation, close and reopen Git Bash for PATH changes to take effect.

#### Verification

Confirm Bambu Studio is accessible from Git Bash:

```bash
ls "/c/Program Files/Bambu Studio/bambu-studio.exe"
```

Expected output:

```
/c/Program Files/Bambu Studio/bambu-studio.exe
```

Launch the application from Git Bash:

```bash
"/c/Program Files/Bambu Studio/bambu-studio.exe" &
```

#### Troubleshooting

**Problem**: Chocolatey command not found in Git Bash

**Solution**: Chocolatey may not be in the Git Bash PATH. Use the full path:

```bash
/c/ProgramData/chocolatey/bin/choco.exe install bambustudio -y
```

**Problem**: Permission denied when running installer

**Solution**: Git Bash must be run as Administrator. Right-click Git Bash and select "Run as administrator".

**Problem**: Application launches but immediately closes

**Solution**: Check for error messages by running from Command Prompt instead of Git Bash:

```cmd
"C:\Program Files\Bambu Studio\bambu-studio.exe"
```

This will display any error messages that Git Bash might suppress.

**Problem**: Silent installer `/S` flag not working from Git Bash

**Solution**: Use Windows Command Prompt or PowerShell for silent installation:

```cmd
Bambu_Studio_win_public-v02.04.00.70.exe /S
```

---

## Post-Installation Configuration

### Initial Setup

On first launch, Bambu Studio will guide you through initial configuration:

1. **Accept License Agreement** - Review and accept the AGPL-3.0 license
2. **Select Printer** - Choose your Bambu Lab printer model (X1, P1, A1 series) or configure a custom printer
3. **Login (Optional)** - Sign in to your Bambu Lab account for cloud features and remote printing

### Connecting to Your Printer

**For Bambu Lab printers on your local network:**

1. Ensure your printer and computer are on the same network
2. Open Bambu Studio and go to Device tab
3. The printer should appear automatically via network discovery
4. Click to connect and enter the access code from your printer's screen (if required)

**For LAN-only mode (no cloud):**

1. Go to Preferences > Network
2. Enable "LAN Mode Only"
3. Enter your printer's IP address manually if auto-discovery fails

### Network Plugin (Linux Note)

On Linux systems, the Bambu Network Plugin may have limited functionality. If you encounter the "Bambu Network plug-in not detected" message:

1. The plugin installation may loop indefinitely on some Linux configurations
2. Local file export (Save to File) and SD card transfer will still work
3. Consider using the Windows or macOS version for full cloud integration features

---

## Common Issues

### Issue: OpenGL Errors on Launch

**Symptoms**: Application crashes immediately or shows OpenGL-related error messages.

**Solution**: Update your graphics drivers to the latest version. Bambu Studio requires OpenGL 2.0 or higher.

For Linux systems, ensure mesa drivers are installed:

```bash
# Ubuntu/Debian
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mesa-utils libgl1-mesa-glx

# Verify OpenGL
glxinfo | grep "OpenGL version"
```

### Issue: High Memory Usage

**Symptoms**: System becomes slow or unresponsive when slicing large models.

**Solution**: Bambu Studio can use significant memory for complex models. Close other applications and ensure you have at least 8GB RAM for complex prints. Consider reducing model complexity or splitting into multiple plates.

### Issue: Mesh Repair Not Available on Linux

**Symptoms**: The "Fix Model" or mesh repair feature does not work on Linux.

**Solution**: Mesh repair on Windows uses Microsoft 3D Builder, which is not available on Linux. Use an external mesh repair tool:

```bash
# Install MeshLab via Flatpak
flatpak install -y flathub net.meshlab.MeshLab

# Use it to repair meshes before importing to Bambu Studio
```

### Issue: Printer Not Found on Network

**Symptoms**: Bambu Studio cannot discover your printer.

**Solution**:
1. Verify printer and computer are on the same network/subnet
2. Check firewall settings - allow Bambu Studio through the firewall
3. Try entering the printer's IP address manually
4. Restart both the printer and Bambu Studio

### Issue: Profiles Missing After Update

**Symptoms**: Custom print profiles disappear after updating Bambu Studio.

**Solution**: Profiles are typically preserved during updates. If lost:
1. Check the backup location: `~/.config/BambuStudio/` (Linux) or `%APPDATA%\BambuStudio\` (Windows)
2. Import profiles from backup using File > Import > Import Configs

---

## References

- [Bambu Studio Official Download Page](https://bambulab.com/en/download/studio)
- [Bambu Studio GitHub Repository](https://github.com/bambulab/BambuStudio)
- [Bambu Studio GitHub Releases](https://github.com/bambulab/BambuStudio/releases)
- [Bambu Studio Wiki](https://wiki.bambulab.com/en/software/bambu-studio)
- [Bambu Studio Homebrew Cask](https://formulae.brew.sh/cask/bambu-studio)
- [Bambu Studio Flathub Page](https://flathub.org/apps/com.bambulab.BambuStudio)
- [Bambu Studio Chocolatey Package](https://community.chocolatey.org/packages/bambustudio)
- [Bambu Studio Winget Package](https://winget.run/pkg/Bambulab/Bambustudio)
- [Pi-Apps Bambu Studio](https://pi-apps.io/install-app/install-bambu-studio-on-raspberry-pi/)
- [Linux Compile Guide](https://github.com/bambulab/BambuStudio/wiki/Linux-Compile-Guide)
- [WSLg Documentation](https://github.com/microsoft/wslg)
