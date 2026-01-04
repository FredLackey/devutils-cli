# Installing WhatsApp

## Overview

WhatsApp is a cross-platform messaging application owned by Meta that allows users to send text messages, make voice and video calls, share files and media, and communicate with contacts worldwide. WhatsApp uses end-to-end encryption for private communications and syncs messages across linked devices.

**Important Platform Notes**:
- **macOS**: Official WhatsApp desktop application available via Homebrew
- **Windows**: Official WhatsApp desktop application available via winget (recommended) or Chocolatey
- **Linux (Ubuntu, Raspberry Pi, Amazon Linux)**: No official Meta desktop application exists; use **WhatsApp for Linux**, an open-source unofficial client that wraps WhatsApp Web in a native desktop application

This guide documents the installation of the official WhatsApp desktop application where available, and WhatsApp for Linux as the definitive alternative for platforms without official support.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None

### Ubuntu (APT/Snap)
- **Required:**
  - Flatpak - Install via `sudo apt-get install -y flatpak`
  - Flathub repository - Add via `flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo`
- **Optional:** None
- **Auto-installed:**
  - Flatpak runtime dependencies (GNOME runtime, freedesktop runtime) - automatically installed by Flatpak when installing WhatsApp for Linux

### Raspberry Pi OS (APT/Snap)
- Installation not yet supported on this platform. WhatsApp does not provide native ARM packages. Users should access WhatsApp Web via browser at https://web.whatsapp.com

### Amazon Linux (DNF/YUM)
- **Required:**
  - Flatpak - Install via `sudo dnf install -y flatpak` (Amazon Linux 2023/RHEL 8+) or `sudo yum install -y flatpak` (Amazon Linux 2)
  - Flathub repository - Add via `flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo`
  - Desktop environment (GNOME, MATE, or similar) - Install via `sudo dnf groupinstall -y "Server with GUI"` (Amazon Linux is typically a server OS)
- **Optional:** None
- **Auto-installed:**
  - Flatpak runtime dependencies (GNOME runtime, freedesktop runtime) - automatically installed by Flatpak when installing WhatsApp for Linux

### Windows (Chocolatey/winget)
- **Required:**
  - winget - Pre-installed on Windows 10 version 1809+ and Windows 11. If missing, install App Installer from Microsoft Store via `start ms-windows-store://pdp/?productid=9NBLGGH4NNS1`
- **Optional:** None
- **Auto-installed:** None

### Git Bash (Manual/Portable)
- **Required:**
  - winget.exe - Pre-installed on Windows 10 version 1809+ and Windows 11. If missing, install App Installer from Microsoft Store
  - Windows 10 version 1809 or later, or Windows 11
- **Optional:** None
- **Auto-installed:** None

## Prerequisites

Before installing WhatsApp on any platform, ensure:

1. **WhatsApp mobile account** - Required to link the desktop application via QR code scanning
2. **Smartphone with WhatsApp installed** - Required for initial device linking
3. **Internet connectivity** - Required for all WhatsApp functionality
4. **Administrative privileges** - Required on most platforms for installation

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 12 (Monterey) or later
- Homebrew package manager installed
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install the official WhatsApp desktop application:

```bash
brew install --quiet --cask whatsapp
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts. The `--cask` flag specifies this is a macOS application.

#### Verification

Confirm the installation succeeded by launching the application:

```bash
open -a WhatsApp
```

Alternatively, verify the application exists:

```bash
ls /Applications/WhatsApp.app
```

Expected output:

```
/Applications/WhatsApp.app
```

#### Troubleshooting

**Problem**: `brew: command not found`

**Solution**: Homebrew is not installed or not in PATH. Install Homebrew or add it to your PATH:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

**Problem**: App shows "WhatsApp can't be opened because Apple cannot check it for malicious software"

**Solution**: This can occur on first launch. Right-click the app in Applications and select "Open", then click "Open" in the dialog. Alternatively, clear the quarantine flag:

```bash
xattr -cr /Applications/WhatsApp.app
```

**Problem**: QR code not scanning or linking fails

**Solution**: Ensure your phone and computer are on the same network. On your phone, go to WhatsApp > Settings > Linked Devices > Link a Device, and scan the QR code displayed on the desktop application.

**Problem**: WhatsApp shows "Phone not connected"

**Solution**: WhatsApp desktop requires your phone to have an active internet connection for the initial sync. Ensure your phone is connected to the internet and has WhatsApp running.

---

### Ubuntu/Debian (Flatpak)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 or later (64-bit x86_64)
- Flatpak installed and configured with Flathub repository
- sudo privileges
- Active internet connection

**Important**: Meta does not provide an official WhatsApp desktop application for Linux. This guide documents the installation of **WhatsApp for Linux**, an open-source unofficial client that provides a native desktop experience by wrapping WhatsApp Web.

#### Installation Steps

**Step 1: Install Flatpak (if not already installed)**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y flatpak
```

**Step 2: Add the Flathub repository**

```bash
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
```

**Step 3: Install WhatsApp for Linux**

```bash
flatpak install -y flathub com.github.eneshecan.WhatsAppForLinux
```

The `-y` flag automatically confirms the installation, enabling fully non-interactive operation.

**Note**: After installation, you may need to log out and log back in, or restart your terminal, for the application to appear in your application menu.

#### Verification

Confirm the installation succeeded:

```bash
flatpak list | grep -i whatsapp
```

Expected output:

```
WhatsApp for Linux    com.github.eneshecan.WhatsAppForLinux    1.6.4    stable    flathub
```

Launch the application:

```bash
flatpak run com.github.eneshecan.WhatsAppForLinux &
```

Or find "WhatsApp for Linux" in your application menu under Internet or Communication.

#### Troubleshooting

**Problem**: `flatpak: command not found`

**Solution**: Install flatpak first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y flatpak
```

Then restart your terminal or log out and log back in.

**Problem**: "No remote refs found similar to flathub"

**Solution**: Add the Flathub repository:

```bash
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
```

**Problem**: Application fails to start with graphics errors

**Solution**: The application may have issues with certain graphics drivers. Try running with software rendering:

```bash
flatpak run --env=LIBGL_ALWAYS_SOFTWARE=1 com.github.eneshecan.WhatsAppForLinux &
```

**Problem**: Cannot scan QR code or link device

**Solution**: Ensure your phone has an active internet connection. On your phone, go to WhatsApp > Settings > Linked Devices > Link a Device, and scan the QR code displayed on the desktop application.

**Problem**: Notifications not working

**Solution**: Ensure your desktop environment allows notifications. On GNOME, check Settings > Notifications > WhatsApp for Linux.

---

### Raspberry Pi OS (Pi-Apps)

#### Prerequisites

- Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
- Raspberry Pi 3 or later with 2GB+ RAM (4GB recommended)
- sudo privileges
- Desktop environment configured

**Important**: Meta does not provide an official WhatsApp desktop application for Raspberry Pi or any Linux ARM platform. This guide documents the installation of **WhatsApp for Linux** using Pi-Apps, which properly handles ARM64 builds.

Verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM (recommended, full support)
- `armv7l` = 32-bit ARM (limited support via Pi-Apps)

#### Installation Steps

**Step 1: Install Pi-Apps**

Pi-Apps is an application installer for Raspberry Pi that handles ARM-specific builds:

```bash
wget -qO- https://raw.githubusercontent.com/Botspot/pi-apps/master/install | bash
```

This command downloads and runs the Pi-Apps installer non-interactively.

**Step 2: Install WhatsApp via Pi-Apps CLI**

```bash
~/pi-apps/manage install "WhatsApp"
```

This installs a WhatsApp Web chromium webapp optimized for Raspberry Pi.

#### Verification

Confirm the installation succeeded by checking the Pi-Apps status:

```bash
~/pi-apps/manage check-all | grep -i whatsapp
```

Launch the application from the menu: **Menu > Internet > WhatsApp**

Or launch from command line:

```bash
chromium-browser --app=https://web.whatsapp.com &
```

#### Troubleshooting

**Problem**: Pi-Apps installation fails

**Solution**: Ensure you have internet connectivity and git is installed:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

Then retry the Pi-Apps installation.

**Problem**: WhatsApp runs slowly or crashes

**Solution**: Raspberry Pi may have limited resources for web applications. Close other applications and ensure you have at least 2GB RAM. Consider increasing swap space:

```bash
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

**Problem**: Graphics rendering issues

**Solution**: Try running Chromium with GPU acceleration disabled:

```bash
chromium-browser --disable-gpu --app=https://web.whatsapp.com &
```

**Problem**: QR code display issues

**Solution**: If the QR code does not render correctly, try increasing the window size or using a different zoom level in Chromium settings.

---

### Amazon Linux/RHEL (Flatpak)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8/9, or Fedora
- Desktop environment installed (GNOME, MATE, or similar)
- sudo privileges
- Active internet connection

**Important**: Meta does not provide an official WhatsApp desktop application for Amazon Linux or any Linux distribution. For desktop environments, use **WhatsApp for Linux** via Flatpak. For headless server environments, use the web interface at https://web.whatsapp.com.

Amazon Linux is typically used as a server OS. If you need a graphical WhatsApp client, ensure you have a desktop environment installed first.

#### Installation Steps

**Step 1: Install Flatpak**

For Amazon Linux 2023:

```bash
sudo dnf install -y flatpak
```

For Amazon Linux 2:

```bash
sudo yum install -y flatpak
```

**Step 2: Add the Flathub repository**

```bash
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
```

**Step 3: Install WhatsApp for Linux**

```bash
flatpak install -y flathub com.github.eneshecan.WhatsAppForLinux
```

#### Verification

Confirm the installation succeeded:

```bash
flatpak list | grep -i whatsapp
```

Expected output:

```
WhatsApp for Linux    com.github.eneshecan.WhatsAppForLinux    1.6.4    stable    flathub
```

Launch the application:

```bash
flatpak run com.github.eneshecan.WhatsAppForLinux &
```

#### Troubleshooting

**Problem**: No graphical display available

**Solution**: Amazon Linux is typically a server OS without a desktop environment. Install a desktop environment first:

```bash
# For Amazon Linux 2023
sudo dnf groupinstall -y "Server with GUI"
sudo systemctl set-default graphical.target
sudo reboot
```

Or use the web interface at https://web.whatsapp.com from any browser.

**Problem**: Flatpak installation fails with "Unable to locate runtime"

**Solution**: Ensure the Flathub repository is correctly added:

```bash
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
flatpak update
```

**Problem**: SELinux blocks the application

**Solution**: Check SELinux denials and allow if necessary:

```bash
sudo ausearch -m AVC -ts recent | grep whatsapp
```

If there are denials, create a local policy module or set SELinux to permissive mode temporarily for testing.

**Problem**: GTK or graphics library errors

**Solution**: Install required dependencies:

```bash
sudo dnf install -y gtk3 webkit2gtk3
```

---

### Windows (winget)

#### Prerequisites

- Windows 10 version 1809 or later, or Windows 11
- winget package manager (pre-installed on Windows 10 1809+ and Windows 11)
- Administrator privileges recommended
- Active internet connection

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
winget install --id WhatsApp.WhatsApp --silent --accept-package-agreements --accept-source-agreements
```

This command:
- `--id WhatsApp.WhatsApp` - Specifies the winget package ID for the official WhatsApp application
- `--silent` - Runs without user prompts
- `--accept-package-agreements` - Automatically accepts package license agreements
- `--accept-source-agreements` - Automatically accepts source license agreements

#### Verification

Open a new PowerShell or Command Prompt window (required for PATH to update), then verify the installation:

```powershell
winget list --id WhatsApp.WhatsApp
```

Expected output:

```
Name      Id               Version   Source
--------------------------------------------
WhatsApp  WhatsApp.WhatsApp  2.2410.1  winget
```

Launch the application from the Start Menu by searching for "WhatsApp", or:

```powershell
start whatsapp:
```

#### Troubleshooting

**Problem**: `winget: The term 'winget' is not recognized`

**Solution**: winget may not be installed or PATH may not be updated. Install App Installer from the Microsoft Store:

```powershell
start ms-windows-store://pdp/?productid=9NBLGGH4NNS1
```

After installation, open a new terminal window.

**Problem**: Installation fails with "No applicable installer found"

**Solution**: Your Windows version may be too old. Check your version:

```powershell
winver
```

Windows 10 version 1809 (October 2018 Update) or later is required.

**Problem**: "Administrator privileges required"

**Solution**: Right-click PowerShell or Command Prompt and select "Run as administrator", then retry the installation command.

**Problem**: WhatsApp installed but cannot find it

**Solution**: The installation may have completed but the Start Menu not yet updated. Try running directly:

```powershell
start whatsapp:
```

Or search for WhatsApp in the Start Menu.

**Problem**: Cannot scan QR code

**Solution**: Ensure your phone has an active internet connection. On your phone, go to WhatsApp > Settings > Linked Devices > Link a Device, and scan the QR code displayed on the desktop application.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows Subsystem for Linux with Ubuntu installed
- WSL 2 recommended for best performance
- WSLg support (Windows 11) for native Linux GUI apps
- sudo privileges within WSL

**Important**: WhatsApp for Linux is a GUI application and requires a display. WSL 2 with WSLg (Windows 11) supports Linux GUI applications natively. For WSL on Windows 10, additional X server configuration is required.

#### Installation Steps

**Recommended Approach - Use Windows WhatsApp Installation**:

The simplest approach is to install WhatsApp on Windows (see Windows section above) and access it from WSL through Windows interop:

```bash
# Install wslu for Windows integration
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wslu

# Open WhatsApp web interface in Windows browser
wslview https://web.whatsapp.com
```

**Alternative Approach - Linux Flatpak in WSL (WSL 2 + WSLg required)**:

For WSL 2 on Windows 11 with WSLg, you can run Linux GUI applications natively.

First, ensure systemd is enabled in WSL. Edit `/etc/wsl.conf`:

```bash
sudo tee /etc/wsl.conf > /dev/null << 'EOF'
[boot]
systemd=true
EOF
```

Restart WSL from PowerShell:

```powershell
wsl --shutdown
```

Then reopen WSL and install WhatsApp for Linux via Flatpak:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y flatpak
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
flatpak install -y flathub com.github.eneshecan.WhatsAppForLinux
```

#### Verification

For the Windows browser approach:

```bash
wslview https://web.whatsapp.com
```

This should open WhatsApp Web in your Windows browser.

For the Linux Flatpak approach (WSL 2 + WSLg):

```bash
flatpak list | grep -i whatsapp
```

Launch the application:

```bash
flatpak run com.github.eneshecan.WhatsAppForLinux &
```

The WhatsApp window should appear on your Windows desktop via WSLg.

#### Troubleshooting

**Problem**: GUI applications do not display

**Solution**: WSLg requires Windows 11 or later. For Windows 10, install an X server like VcXsrv:

1. Install VcXsrv on Windows from https://sourceforge.net/projects/vcxsrv/
2. Launch XLaunch with "Multiple windows" and "Disable access control"
3. In WSL, set the display:

```bash
export DISPLAY=$(grep nameserver /etc/resolv.conf | awk '{print $2}'):0.0
```

Add to `~/.bashrc` for persistence.

**Problem**: systemctl commands fail

**Solution**: systemd may not be enabled. Edit `/etc/wsl.conf` as shown above and restart WSL.

**Problem**: Flatpak installation hangs or fails

**Solution**: Flatpak may have issues in WSL. Use the Windows WhatsApp installation or web interface instead:

```bash
wslview https://web.whatsapp.com
```

**Problem**: `wslview: command not found`

**Solution**: Install wslu utilities:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wslu
```

---

### Git Bash (Windows)

#### Prerequisites

- Windows 10 version 1809 or later, or Windows 11
- Git Bash installed (comes with Git for Windows)
- WhatsApp installed on Windows (see Windows section above)

**Note**: Git Bash on Windows runs within the Windows environment and inherits the Windows PATH. Once WhatsApp is installed on Windows, it is accessible from Git Bash through Windows application launching.

#### Installation Steps

Git Bash can execute Windows commands directly. Install WhatsApp using winget:

```bash
winget.exe install --id WhatsApp.WhatsApp --silent --accept-package-agreements --accept-source-agreements
```

After installation, close and reopen Git Bash for the Start Menu shortcuts to update.

#### Verification

Verify WhatsApp is installed by checking winget:

```bash
winget.exe list --id WhatsApp.WhatsApp
```

Launch WhatsApp from Git Bash:

```bash
start whatsapp:
```

Or open the web interface:

```bash
start https://web.whatsapp.com
```

#### Troubleshooting

**Problem**: `winget.exe: command not found`

**Solution**: winget may not be in the Git Bash PATH. Use the full path:

```bash
/c/Users/$USER/AppData/Local/Microsoft/WindowsApps/winget.exe install --id WhatsApp.WhatsApp --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: `start: command not found`

**Solution**: In Git Bash, use `cmd.exe` to run Windows commands:

```bash
cmd.exe /c start whatsapp:
```

**Problem**: Installation fails with permission errors

**Solution**: Git Bash may need to be run as Administrator. Right-click Git Bash and select "Run as administrator", then retry the installation.

**Problem**: WhatsApp installed but cannot launch from Git Bash

**Solution**: Use the Windows `start` command through cmd:

```bash
cmd.exe /c start whatsapp:
```

Or simply access the web interface:

```bash
cmd.exe /c start https://web.whatsapp.com
```

---

## Post-Installation Configuration

### First-Time Setup

After installing and launching WhatsApp on any platform:

1. **Scan QR Code** - Open WhatsApp on your phone, go to Settings > Linked Devices > Link a Device, and scan the QR code displayed on the desktop application
2. **Wait for Sync** - Allow time for your messages and media to sync to the desktop client
3. **Grant Permissions** - Allow notifications when prompted for real-time message alerts
4. **Configure Settings** - Adjust notification preferences, themes, and privacy settings as desired

### Keyboard Shortcuts

| Platform | New Chat | Search | Settings | Mute Conversation |
|----------|----------|--------|----------|-------------------|
| macOS | Cmd + N | Cmd + F | Cmd + , | Cmd + Shift + M |
| Windows/Linux | Ctrl + N | Ctrl + F | Ctrl + , | Ctrl + Shift + M |

### Configuring Notifications

To ensure you receive message notifications:

**Linux (Flatpak)**:
Ensure your desktop environment allows notifications from Flatpak applications. On GNOME, check Settings > Notifications.

**Windows**:
Ensure notifications are enabled in Windows Settings > System > Notifications > WhatsApp.

**macOS**:
Grant notification permissions in System Settings > Notifications > WhatsApp.

### Managing Linked Devices

You can link up to four devices to your WhatsApp account. To manage linked devices:

1. Open WhatsApp on your phone
2. Go to Settings > Linked Devices
3. View, add, or remove linked devices

---

## Common Issues

### Issue: Cannot Scan QR Code

**Symptoms**: QR code does not appear, does not scan, or continuously refreshes.

**Solutions**:

1. Ensure your phone has an active internet connection
2. Ensure your phone's WhatsApp is up to date
3. On your phone, go to WhatsApp > Settings > Linked Devices > Link a Device
4. Position the phone camera to fully capture the QR code
5. If the QR code times out, refresh the desktop application

### Issue: Messages Not Syncing

**Symptoms**: New messages do not appear or sent messages do not show.

**Solutions**:

1. Refresh the connection by restarting the desktop application
2. Ensure your phone has an active internet connection
3. Check WhatsApp server status at https://downdetector.com/status/whatsapp/
4. Re-link the device by removing it from Linked Devices and scanning the QR code again

### Issue: High Memory Usage

**Symptoms**: WhatsApp consumes excessive system resources.

**Solutions**:

WhatsApp desktop applications, especially unofficial Linux clients built with Electron or WebKit, can consume significant memory. To reduce usage:

1. Close and restart WhatsApp periodically
2. Avoid having many conversations with media open
3. Clear the application cache if available

On Linux, check memory usage:

```bash
ps aux | grep -i whatsapp
```

### Issue: No Notifications

**Symptoms**: Not receiving notifications for new messages.

**Solutions**:

1. Verify notifications are enabled in WhatsApp settings
2. Check system notification settings
3. On Linux, ensure the notification daemon is running
4. On macOS/Windows, check that WhatsApp has notification permissions in system settings

### Issue: Audio/Video Calls Not Working

**Symptoms**: Cannot make or receive voice/video calls.

**Solutions**:

1. Verify microphone and camera permissions are granted to WhatsApp
2. Check that correct audio devices are selected in system settings
3. For Linux unofficial clients, audio/video calling may have limited support
4. Consider using WhatsApp Web in a browser for calls if the desktop client has issues

### Issue: "Phone Not Connected" Error

**Symptoms**: Desktop app shows phone disconnection warning.

**Solutions**:

1. Ensure your phone is connected to the internet
2. Ensure WhatsApp is open on your phone (for older linking method)
3. With newer versions, the phone only needs periodic connectivity
4. Re-link the device if the issue persists

---

## Summary Table

| Platform | Native Support | Installation Method | Notes |
|----------|---------------|---------------------|-------|
| macOS | Yes | `brew install --quiet --cask whatsapp` | Requires macOS 12+ |
| Windows | Yes | `winget install --id WhatsApp.WhatsApp --silent ...` | Primary supported platform |
| Ubuntu/Debian | No | `flatpak install -y flathub com.github.eneshecan.WhatsAppForLinux` | Unofficial client |
| Raspberry Pi | No | Pi-Apps or Chromium webapp | Use WhatsApp Web wrapper |
| Amazon Linux/RHEL | No | `flatpak install -y flathub com.github.eneshecan.WhatsAppForLinux` | Unofficial client |
| WSL | N/A | Install on Windows host or use Flatpak with WSLg | Uses Windows installation |
| Git Bash | N/A | Uses Windows installation | Inherits Windows WhatsApp |

---

## References

- [WhatsApp Official Website](https://www.whatsapp.com/)
- [WhatsApp Official Download Page](https://www.whatsapp.com/download)
- [WhatsApp Homebrew Cask](https://formulae.brew.sh/cask/whatsapp)
- [WhatsApp winget Package](https://winget.run/pkg/WhatsApp/WhatsApp)
- [WhatsApp for Linux - Flathub](https://flathub.org/apps/com.github.eneshecan.WhatsAppForLinux)
- [WhatsApp for Linux - GitHub](https://github.com/eneshecan/whatsapp-for-linux)
- [Pi-Apps for Raspberry Pi](https://pi-apps.io/)
- [Pi-Apps WhatsApp Installation](https://pi-apps.io/install-app/install-whatsapp-on-raspberry-pi/)
- [WhatsApp Web](https://web.whatsapp.com)
- [WhatsApp Help Center](https://faq.whatsapp.com/)
