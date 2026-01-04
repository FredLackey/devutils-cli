# Installing Zoom

## Overview

Zoom is a video conferencing and collaboration platform that provides video meetings, webinars, chat, and phone services. It enables teams and individuals to connect through high-quality video and audio across desktop and mobile devices. Zoom is widely used for business meetings, remote work, online education, and personal video calls.

**Important Platform Note**: Zoom does not provide native ARM builds for Linux. Raspberry Pi and other ARM-based Linux systems require either x86 emulation via Box86/Box64 or using the Zoom web application in a browser.

## Prerequisites

Before installing Zoom on any platform, ensure:

1. **Internet connectivity** - Required to download Zoom and use all conferencing features
2. **Administrative privileges** - Required for system-wide installation on most platforms
3. **Zoom account** - Required to host meetings (optional for joining meetings; create at zoom.us)
4. **Working microphone and speakers** - Required for audio in meetings
5. **Webcam** - Required for video in meetings (optional for audio-only participation)

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- At least 500 MB free disk space
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Zoom:

```bash
brew install --quiet --cask zoom
```

The `--quiet` flag suppresses non-essential output for automation-friendly installation. The `--cask` flag specifies the graphical application version.

After installation, launch Zoom from the Applications folder or via command line:

```bash
open -a "zoom.us"
```

**Note**: On first launch, Zoom will prompt you to sign in or join a meeting.

#### Verification

Confirm the installation succeeded by checking if the application exists:

```bash
ls /Applications/ | grep -i zoom
```

Expected output:

```
zoom.us.app
```

Verify Zoom can launch:

```bash
open -a "zoom.us"
```

#### Troubleshooting

**Problem**: `Error: Cask 'zoom' requires macOS >= 10.15`

**Solution**: Your macOS version is too old. Zoom requires macOS 10.15 (Catalina) or later. Upgrade your operating system before installing.

**Problem**: "zoom.us is damaged and can't be opened" error

**Solution**: Clear the quarantine attribute:

```bash
xattr -cr "/Applications/zoom.us.app"
```

**Problem**: Cask already installed

**Solution**: If you need to reinstall, first uninstall then reinstall:

```bash
brew uninstall --cask zoom
brew install --quiet --cask zoom
```

**Problem**: Conflict with zoom-for-it-admins cask

**Solution**: The `zoom` and `zoom-for-it-admins` casks conflict. If you have `zoom-for-it-admins` installed, uninstall it first:

```bash
brew uninstall --cask zoom-for-it-admins
brew install --quiet --cask zoom
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 (Buster) or later (64-bit x86_64)
- sudo privileges
- At least 500 MB free disk space

**Important**: Zoom only provides 64-bit x86_64 packages for Debian/Ubuntu. ARM-based systems are not supported with native packages.

#### Installation Steps

**Step 1: Download the Zoom .deb package**

```bash
wget -q https://zoom.us/client/latest/zoom_amd64.deb -O /tmp/zoom_amd64.deb
```

**Step 2: Install Zoom using apt**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/zoom_amd64.deb
```

The `DEBIAN_FRONTEND=noninteractive` environment variable prevents any interactive prompts during installation.

**Step 3: Clean up the downloaded file**

```bash
rm /tmp/zoom_amd64.deb
```

After installation, launch Zoom:

```bash
zoom &
```

The ampersand (`&`) runs Zoom in the background, freeing your terminal.

#### Verification

Confirm the installation succeeded:

```bash
dpkg -l | grep zoom
```

Expected output (version may vary):

```
ii  zoom           6.7.2.72191    amd64        Zoom Cloud Meetings
```

Verify Zoom launches correctly:

```bash
zoom &
```

The Zoom window should appear within a few seconds.

#### Troubleshooting

**Problem**: Dependency errors during installation

**Solution**: Fix broken dependencies and retry:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get --fix-broken install -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/zoom_amd64.deb
```

**Problem**: Missing library errors when launching Zoom

**Solution**: Install common dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libgl1-mesa-glx libegl1-mesa libxcb-xtest0 libxcb-xinerama0
```

**Problem**: Zoom fails to launch with GPU/rendering errors

**Solution**: Disable GPU acceleration by launching with:

```bash
zoom --disable-gpu &
```

**Problem**: Screen sharing does not work on Wayland

**Solution**: Screen sharing has limited support on Wayland. Log out and log back in using an X11 session for full screen sharing functionality, or install PipeWire for Wayland screen sharing support.

---

### Raspberry Pi OS (ARM)

#### Platform Limitation

**Zoom does not provide native ARM packages.** The official Zoom desktop application is only available for x86_64 architecture. Raspberry Pi devices use ARM processors, which are not directly supported.

#### Prerequisites

- Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
- Raspberry Pi 4 or 5 with at least 4 GB RAM (recommended for video calls)
- sudo privileges
- Web browser (Chromium recommended)

#### Installation Steps

**Use the Zoom Web Application**

The recommended approach for Raspberry Pi is to use Zoom through the web browser:

```bash
# Ensure Chromium is installed
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y chromium-browser

# Launch Zoom web application
chromium-browser --app=https://zoom.us/wc &
```

The `--app` flag launches Chromium in application mode, providing a cleaner, app-like experience without browser chrome.

**Create a Desktop Shortcut**

For easier access, create a desktop shortcut:

```bash
mkdir -p ~/.local/share/applications

cat > ~/.local/share/applications/zoom-web.desktop << 'EOF'
[Desktop Entry]
Name=Zoom
Comment=Video Conferencing via Web
Exec=chromium-browser --app=https://zoom.us/wc
Icon=web-browser
Terminal=false
Type=Application
Categories=Network;VideoConference;
EOF
```

**Alternative: Using Box64 Emulation (Advanced)**

For users who need the native client features, Box64 can emulate the x86_64 Zoom client on 64-bit Raspberry Pi OS. This method is resource-intensive and may have performance issues:

```bash
# Install Box64 (requires 64-bit Raspberry Pi OS)
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git build-essential cmake

git clone https://github.com/ptitSeb/box64.git /tmp/box64
cd /tmp/box64 && mkdir build && cd build
cmake .. -DRPI4ARM64=1 -DCMAKE_BUILD_TYPE=RelWithDebInfo
make -j$(nproc)
sudo make install
sudo systemctl restart systemd-binfmt

# Download x86_64 Zoom client
wget -q https://zoom.us/client/latest/zoom_x86_64.rpm -O /tmp/zoom.rpm
cd /tmp && rpm2cpio zoom.rpm | cpio -idmv
```

**Note**: Box64 emulation may have audio issues and reduced video performance. The web application is recommended for most users.

#### Verification

For web application approach, verify Chromium can access Zoom:

```bash
chromium-browser --app=https://zoom.us/wc &
```

The Zoom web client should load and prompt you to join or sign in.

#### Troubleshooting

**Problem**: Web application is slow or unresponsive

**Solution**: Raspberry Pi has limited resources. For better performance:
- Use a Raspberry Pi 4 or 5 with at least 4 GB RAM
- Close other applications while using Zoom
- Disable video if experiencing lag
- Use the audio-only option for calls

**Problem**: Cannot receive notifications from web application

**Solution**: Web notifications require browser permission. When Zoom prompts for notification permission, click "Allow". Ensure your desktop environment supports web notifications.

**Problem**: Camera or microphone not detected

**Solution**: Ensure your user is in the video and audio groups:

```bash
sudo usermod -aG video,audio $USER
```

Log out and log back in for changes to take effect.

**Problem**: Box64 emulation crashes or has no audio

**Solution**: Box64 support for Zoom is experimental. Use the web application for a more stable experience.

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023, Amazon Linux 2, RHEL 8/9, or Fedora (64-bit x86_64)
- sudo privileges
- Graphical desktop environment (required for Zoom GUI)
- At least 500 MB free disk space

**Important**: Amazon Linux EC2 instances typically run headless (no GUI). If you are running a headless server, use the Zoom web application at https://zoom.us/wc or the Zoom API for automation.

#### Installation Steps

**Step 1: Import the GPG key**

```bash
sudo rpm --import https://zoom.us/linux/download/pubkey?version=6-3-10
```

**Step 2: Download and install Zoom**

For Amazon Linux 2023, RHEL 8/9, and Fedora (using dnf):

```bash
sudo dnf install -y https://zoom.us/client/latest/zoom_x86_64.rpm
```

For Amazon Linux 2 (using yum):

```bash
sudo yum install -y https://zoom.us/client/latest/zoom_x86_64.rpm
```

DNF and YUM can install directly from a URL, which downloads and installs the package in a single command. The `-y` flag automatically confirms the installation.

After installation, launch Zoom:

```bash
zoom &
```

#### Verification

Confirm the installation succeeded:

```bash
rpm -qa | grep zoom
```

Expected output (version may vary):

```
zoom-6.7.2.72191-1.x86_64
```

Verify Zoom can launch (requires graphical environment):

```bash
zoom &
```

#### Troubleshooting

**Problem**: GPG key import fails

**Solution**: Ensure curl is installed and retry:

```bash
sudo dnf install -y curl ca-certificates
sudo rpm --import https://zoom.us/linux/download/pubkey?version=6-3-10
```

**Problem**: Dependency errors during installation

**Solution**: Update system packages first, then retry:

```bash
sudo dnf update -y
sudo dnf install -y https://zoom.us/client/latest/zoom_x86_64.rpm
```

**Problem**: Zoom fails to launch with display errors

**Solution**: Zoom requires a graphical environment. For headless servers:
- Use X11 forwarding with SSH: `ssh -X user@server` then run `zoom`
- Use VNC or RDP to connect to a desktop session
- Use the Zoom web application at https://zoom.us/wc

**Problem**: libxcb errors when launching

**Solution**: Install required X11 libraries:

```bash
sudo dnf install -y libxcb libxcb-xinerama xcb-util-image xcb-util-keysyms
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 1903 or later, or Windows 11 (64-bit)
- At least 500 MB free disk space
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install zoom -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation. Chocolatey uses silent install arguments (`/quiet /qn /norestart`) by default.

**Optional Parameters**

Customize the installation with package parameters:

```powershell
choco install zoom -y --params="'/NoDesktopShortcut /NoAutoUpdate'"
```

Available parameters:
- `/DisableRestartManager` - Wait until current meetings conclude before installing
- `/NoAutoUpdate` - Remove the "Check for Updates" option from the client
- `/NoDesktopShortcut` - Prevent desktop shortcut creation
- `/NoInstallIfRunning` - Cancel installation if Zoom is currently active
- `/SilentStart` - Launch client in system tray after reboot

After installation, Zoom can be launched from the Start Menu or via command line:

```powershell
Start-Process zoom
```

**Note**: On first launch, Zoom will prompt you to sign in or join a meeting.

#### Verification

Open a new Command Prompt or PowerShell window, then verify Zoom is installed:

```powershell
choco list zoom
```

Expected output (version may vary):

```
zoom 6.6.11.23272
1 packages installed.
```

Launch Zoom to verify it opens correctly:

```powershell
Start-Process zoom
```

The application should launch and display the sign-in or join screen.

#### Troubleshooting

**Problem**: `choco: command not found` or `'choco' is not recognized`

**Solution**: Chocolatey is not installed or not in PATH. Install Chocolatey first (see Prerequisites), then open a new terminal window.

**Problem**: Installation fails with permission errors

**Solution**: Run PowerShell as Administrator. Right-click PowerShell in the Start Menu and select "Run as administrator".

**Problem**: Zoom fails to launch after installation

**Solution**: Restart your computer to ensure all components are properly registered, then try launching again.

**Problem**: Need to update Zoom

**Solution**: Run the upgrade command:

```powershell
choco upgrade zoom -y
```

---

### WSL (Ubuntu)

#### Platform Approach

**Zoom is installed on the Windows host, not within WSL.** While WSL with WSLg (GUI support) can technically run Linux GUI applications, the recommended approach is to install Zoom on Windows and access it from WSL.

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- Administrator access on Windows for Zoom installation

#### Installation Steps

**Step 1: Install Zoom on Windows**

From a Windows Administrator PowerShell:

```powershell
choco install zoom -y
```

**Step 2: Access Zoom from WSL**

From within your WSL terminal, you can launch Windows Zoom:

```bash
# Launch Zoom using Windows executable
cmd.exe /c start zoom
```

This command uses Windows interoperability to launch the Zoom application installed on the Windows host.

**Alternative: Access Zoom via browser from WSL**

If you prefer browser-based access:

```bash
# Open Zoom web client in default Windows browser
cmd.exe /c start https://zoom.us/wc
```

#### Verification

From WSL, verify you can launch Windows Zoom:

```bash
cmd.exe /c start zoom
```

Zoom should open in a new window on the Windows desktop.

#### Troubleshooting

**Problem**: Cannot launch Windows Zoom from WSL

**Solution**: Ensure Zoom is installed on Windows first. Run `choco list zoom` in a Windows PowerShell to verify installation.

**Problem**: "start: command not found"

**Solution**: Use the full Windows command syntax:

```bash
cmd.exe /c start zoom
```

**Problem**: Need to use Zoom commands in WSL scripts

**Solution**: Create a helper alias in your `~/.bashrc`:

```bash
echo 'alias zoom="cmd.exe /c start zoom"' >> ~/.bashrc
source ~/.bashrc
```

Then simply run `zoom` from your WSL terminal.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Administrator access for Zoom installation

#### Installation Steps

Git Bash runs on Windows, so Zoom is installed on the Windows host and accessible from Git Bash.

**Step 1: Install Zoom on Windows**

From an Administrator Command Prompt or PowerShell (not Git Bash):

```powershell
choco install zoom -y
```

**Step 2: Access Zoom from Git Bash**

After installation, Zoom can be launched from Git Bash:

```bash
start zoom
```

Or use the explicit command form:

```bash
cmd //c "start zoom"
```

#### Verification

From Git Bash, verify Zoom can be launched:

```bash
start zoom
```

Zoom should open in a new window.

#### Troubleshooting

**Problem**: `start: command not found`

**Solution**: Use the Windows-style command:

```bash
cmd //c "start zoom"
```

**Problem**: Zoom does not launch

**Solution**: Ensure Zoom is installed on Windows. Open a Windows Command Prompt and verify:

```cmd
choco list zoom
```

If not installed, install it from an Administrator PowerShell first.

**Problem**: Need to use Zoom in scripts

**Solution**: For scripting, use the Windows command wrapper:

```bash
#!/bin/bash
# Launch Zoom silently
cmd //c "start /min zoom" 2>/dev/null
```

---

## Post-Installation Configuration

After installing Zoom on any platform, complete these configuration steps.

### Signing In

1. Launch Zoom
2. Click "Sign In"
3. Enter your email and password, or use SSO/Google/Facebook authentication
4. Complete any two-factor authentication if enabled

### Configuring Audio and Video

Before your first meeting, test your devices:

1. Click your profile picture in the Zoom window
2. Go to **Settings** > **Audio**
3. Test your speaker and microphone
4. Go to **Settings** > **Video**
5. Test your camera and adjust settings

### Configuring Notifications

Adjust notification settings to manage interruptions:

1. Click your profile picture in Zoom
2. Go to **Settings** > **Notifications** (or **General** on some versions)
3. Configure notification preferences for meetings, chat, and reminders

### Joining a Test Meeting

Zoom provides a test meeting to verify your setup:

1. Visit https://zoom.us/test
2. Click "Join" to enter the test meeting
3. Follow the prompts to test audio and video

### Keyboard Shortcuts

Essential shortcuts for productivity:

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Mute/Unmute Audio | `Alt+A` | `Cmd+Shift+A` |
| Start/Stop Video | `Alt+V` | `Cmd+Shift+V` |
| Start/Stop Screen Share | `Alt+S` | `Cmd+Shift+S` |
| Open Chat | `Alt+H` | `Cmd+Shift+H` |
| Raise/Lower Hand | `Alt+Y` | `Option+Y` |
| End Meeting (Host) | `Alt+Q` | `Cmd+W` |

### Configuring Startup Behavior

To control whether Zoom starts automatically:

**Windows:**
1. Open Zoom Settings
2. Go to **General**
3. Toggle "Start Zoom when I start Windows" on or off

**macOS:**
1. Open Zoom Settings
2. Go to **General**
3. Toggle "Start Zoom when I start macOS" on or off

**Linux:**
```bash
# Disable autostart
rm ~/.config/autostart/zoom.desktop 2>/dev/null || true
```

---

## Common Issues

### Issue: "Unable to Connect" or Network Errors

**Symptoms**: Zoom shows connection errors or fails to join meetings

**Solutions**:
- Check internet connectivity
- Verify firewall allows Zoom traffic (ports 443, 8801-8802)
- If behind a corporate proxy, configure proxy settings in Zoom Settings > Network > Proxy
- Try using the web client at https://zoom.us/wc

### Issue: High CPU or Memory Usage

**Symptoms**: Zoom consumes excessive system resources

**Solutions**:
- Close other applications during video calls
- Disable virtual backgrounds if experiencing lag
- Reduce video quality in Settings > Video
- Disable HD video if bandwidth is limited
- Ensure Zoom is updated to the latest version

### Issue: Echo or Audio Feedback

**Symptoms**: Other participants hear echo during calls

**Solutions**:
- Use headphones instead of speakers
- Enable "Automatically adjust microphone volume" in Settings > Audio
- Mute when not speaking
- Reduce speaker volume if using built-in speakers

### Issue: Screen Sharing Not Working

**Symptoms**: Screen sharing option is grayed out or not functioning

**Solutions**:

**macOS:** Grant screen recording permission in System Preferences > Security & Privacy > Privacy > Screen Recording

**Linux:** On Wayland, screen sharing may have limitations. Use X11 session for full screen sharing support.

**Windows:** Ensure Zoom has necessary permissions. Run as administrator if sharing specific applications fails.

### Issue: Camera Not Detected

**Symptoms**: Video shows a black screen or "No camera detected"

**Solutions**:
- Ensure no other application is using the camera
- Check camera permissions in operating system settings
- Restart Zoom
- Try a different USB port (for external cameras)
- Update camera drivers (Windows)

### Issue: Virtual Background Not Working

**Symptoms**: Virtual background option is unavailable or not rendering correctly

**Solutions**:
- Verify your system meets virtual background requirements
- Ensure adequate lighting in your environment
- Update graphics drivers
- Disable hardware acceleration if experiencing issues

---

## Summary Table

| Platform | Native Support | Installation Method | Notes |
|----------|---------------|---------------------|-------|
| macOS | Yes | `brew install --quiet --cask zoom` | Requires macOS 10.15+ |
| Windows | Yes | `choco install zoom -y` | Primary supported platform |
| Ubuntu/Debian | Yes | Download .deb + `sudo apt install` | x86_64 only |
| Raspberry Pi | No | Web app via Chromium | Use https://zoom.us/wc |
| Amazon Linux/RHEL | Yes | `sudo dnf install -y <url>` | x86_64 only |
| WSL | N/A | Install on Windows host | Uses Windows installation |
| Git Bash | N/A | Uses Windows installation | Inherits Windows Zoom |

---

## References

- [Zoom Official Website](https://zoom.us/)
- [Zoom Download Center](https://zoom.us/download)
- [Installing or Updating Zoom on Linux](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0063458)
- [Zoom Homebrew Cask](https://formulae.brew.sh/cask/zoom)
- [Zoom Chocolatey Package](https://community.chocolatey.org/packages/zoom)
- [Zoom Snap Package](https://snapcraft.io/zoom-client)
- [Zoom Web Client](https://zoom.us/wc)
- [Zoom System Requirements](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060788)
- [Mass Deployment with Preconfigured Settings (Windows)](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0064484)
- [Box64 - x86_64 Emulator for ARM](https://github.com/ptitSeb/box64)
