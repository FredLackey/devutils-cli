# Installing Tidal

## Overview

Tidal is a high-fidelity music streaming service that provides access to over 100 million songs and 650,000+ music videos. Known for its lossless audio quality, Tidal offers HiFi (lossless CD quality at 16-bit/44.1kHz) and HiFi Plus (Master Quality Authenticated/MQA and HiRes FLAC up to 24-bit/192kHz) streaming tiers. The desktop application allows users to stream music, create playlists, and enjoy exclusive content from artists.

**Important Platform Note**: Tidal does not provide an official desktop application for Linux. Linux users must use a third-party open-source client called tidal-hifi, which wraps the Tidal web player in an Electron shell with added features like media key support, Discord integration, and MPRIS support.

## Prerequisites

Before installing Tidal on any platform, ensure:

1. **Internet connectivity** - Required to download Tidal and stream music
2. **Tidal account** - Required to sign in (create an account at tidal.com)
3. **Audio output** - Speakers or headphones connected to your system
4. **Tidal subscription** - Free tier available, but HiFi and HiFi Plus require paid subscriptions

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 12 (Monterey) or later
- Homebrew package manager installed
- At least 200 MB free disk space
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Tidal:

```bash
brew install --quiet --cask tidal
```

The `--quiet` flag suppresses non-essential output for automation-friendly installation. The `--cask` flag specifies the graphical application version.

After installation, launch Tidal from the Applications folder or via command line:

```bash
open -a TIDAL
```

**Note**: On first launch, Tidal will prompt you to sign in with your account credentials.

#### Verification

Confirm the installation succeeded by checking if the application exists:

```bash
ls /Applications/ | grep -i tidal
```

Expected output:

```
TIDAL.app
```

Verify Tidal can launch:

```bash
open -a TIDAL
```

#### Troubleshooting

**Problem**: `Error: Cask 'tidal' requires macOS >= 12`

**Solution**: Your macOS version is too old. Tidal requires macOS 12 (Monterey) or later. Upgrade your operating system before installing.

**Problem**: "Tidal is damaged and can't be opened" error

**Solution**: Clear the quarantine attribute:

```bash
xattr -cr "/Applications/TIDAL.app"
```

**Problem**: Cask already installed

**Solution**: If you need to reinstall, first uninstall then reinstall:

```bash
brew uninstall --cask tidal
brew install --quiet --cask tidal
```

**Problem**: Tidal fails to start after macOS upgrade

**Solution**: Reinstall Tidal:

```bash
brew uninstall --cask tidal
brew install --quiet --cask tidal
```

---

### Ubuntu/Debian (Flatpak)

#### Platform Note

**Tidal does not provide an official desktop application for Linux.** The recommended solution is tidal-hifi, an open-source Electron-based application that wraps the Tidal web player with native desktop features including:

- HiFi audio quality support via Widevine
- Media key integration
- MPRIS support for desktop audio controls
- Discord Rich Presence integration
- ListenBrainz scrobbling

#### Prerequisites

- Ubuntu 18.04 LTS or later, or Debian 10 (Buster) or later (64-bit x86_64)
- sudo privileges
- Flatpak installed
- At least 500 MB free disk space

Install Flatpak if not already installed:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y flatpak
```

Add the Flathub repository:

```bash
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

**Important**: After installing Flatpak for the first time, log out and log back in (or reboot) for the flatpak command to function correctly.

#### Installation Steps

Run the following command to install tidal-hifi via Flatpak:

```bash
flatpak install -y flathub com.mastermindzh.tidal-hifi
```

The `-y` flag automatically confirms installation prompts for non-interactive operation.

After installation, launch tidal-hifi:

```bash
flatpak run com.mastermindzh.tidal-hifi &
```

The ampersand (`&`) runs the application in the background, freeing your terminal.

#### Verification

Confirm the installation succeeded:

```bash
flatpak list | grep -i tidal
```

Expected output (version may vary):

```
TIDAL Hi-Fi    com.mastermindzh.tidal-hifi    6.0.0    stable    flathub
```

Verify tidal-hifi launches correctly:

```bash
flatpak run com.mastermindzh.tidal-hifi &
```

The tidal-hifi window should appear within a few seconds.

#### Troubleshooting

**Problem**: `error: Unable to load summary from remote flathub`

**Solution**: Add the Flathub repository:

```bash
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

**Problem**: Audio playback issues or no sound

**Solution**: Ensure PulseAudio or PipeWire is running:

```bash
pulseaudio --check || pulseaudio --start
```

**Problem**: Discord Rich Presence not working

**Solution**: If running Discord as a native (non-Flatpak) application, use Flatseal to grant tidal-hifi access to the Discord socket:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y flatpak
flatpak install -y flathub com.github.tchx84.Flatseal
```

Then use Flatseal to add filesystem access to `~/.config/discord` for tidal-hifi.

**Problem**: Media keys not working

**Solution**: Ensure MPRIS is enabled in tidal-hifi settings. The Flatpak version should have this configured by default.

---

### Raspberry Pi OS (ARM)

#### Platform Limitation

**Tidal does not provide native ARM packages, and tidal-hifi is only available for x86_64 architecture.** Raspberry Pi devices use ARM processors, which are not supported by the official Tidal client or tidal-hifi.

#### Prerequisites

- Raspberry Pi OS (64-bit or 32-bit)
- Raspberry Pi 3 or later (Raspberry Pi 4 or 5 recommended)
- sudo privileges
- Docker and Docker Compose installed
- Tidal subscription (required for Tidal Connect)

#### Installation Steps

**Use Tidal Connect via Docker**

Tidal Connect allows your Raspberry Pi to function as a Tidal streaming endpoint. You control playback from your phone, tablet, or computer, and audio plays through the Raspberry Pi.

**Step 1: Install Docker if not already installed**

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Log out and log back in for group membership to take effect.

**Step 2: Create Docker Compose configuration**

Create a directory for the Tidal Connect configuration:

```bash
mkdir -p ~/tidal-connect
```

Create the Docker Compose file:

```bash
cat > ~/tidal-connect/docker-compose.yml << 'EOF'
version: '3'
services:
  tidal-connect:
    image: giof71/tidal-connect:latest
    container_name: tidal-connect
    restart: unless-stopped
    network_mode: host
    devices:
      - /dev/snd:/dev/snd
    environment:
      - FRIENDLY_NAME=Raspberry Pi Tidal
    volumes:
      - ./config:/config
EOF
```

**Step 3: Start Tidal Connect**

```bash
cd ~/tidal-connect && docker compose up -d
```

After startup, your Raspberry Pi will appear as a Tidal Connect device in the Tidal app on your phone, tablet, or computer.

#### Verification

Confirm the Docker container is running:

```bash
docker ps | grep tidal-connect
```

Expected output should show the tidal-connect container with status "Up".

Test Tidal Connect:

1. Open the Tidal app on your phone, tablet, or computer
2. Start playing music
3. Tap the "Connect to a device" icon (speaker/device icon)
4. Select "Raspberry Pi Tidal" from the device list
5. Audio should play through the Raspberry Pi speakers

#### Troubleshooting

**Problem**: Container fails to start with audio device errors

**Solution**: Check available audio devices and update the Docker configuration:

```bash
aplay -l
```

If using a specific audio device, add the ALSA device to your docker-compose.yml:

```yaml
environment:
  - FRIENDLY_NAME=Raspberry Pi Tidal
  - ALSA_DEVICE=hw:0,0
```

**Problem**: Device does not appear in Tidal Connect

**Solution**: Ensure your Raspberry Pi and control device are on the same network. Check container logs:

```bash
docker logs tidal-connect
```

**Problem**: Raspberry Pi 5 compatibility issues

**Solution**: If you encounter "ELF load command alignment" errors, ensure you are using a compatible container image. Check the tidal-connect repository for Pi 5-specific images or use 32-bit Raspberry Pi OS.

**Problem**: Audio quality is poor or distorted

**Solution**: Ensure your audio device supports the output format. Try reducing the quality settings in the Tidal app.

---

### Amazon Linux/RHEL (Flatpak)

#### Prerequisites

- Amazon Linux 2023, Amazon Linux 2, RHEL 8/9, or Fedora (64-bit x86_64)
- sudo privileges
- Graphical desktop environment (required for tidal-hifi GUI)
- At least 500 MB free disk space

**Important**: Amazon Linux EC2 instances typically run headless (no GUI). If you are running a headless server, use the Tidal web player at https://listen.tidal.com instead.

#### Installation Steps

**Step 1: Install Flatpak**

For Amazon Linux 2023 or RHEL 9:

```bash
sudo dnf install -y flatpak
```

For Amazon Linux 2 or RHEL 8:

```bash
sudo yum install -y flatpak
```

**Step 2: Add the Flathub repository**

```bash
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

**Important**: Log out and log back in (or reboot) after this step for the flatpak command to function correctly.

**Step 3: Install tidal-hifi**

```bash
flatpak install -y flathub com.mastermindzh.tidal-hifi
```

After installation, launch tidal-hifi:

```bash
flatpak run com.mastermindzh.tidal-hifi &
```

#### Verification

Confirm the installation succeeded:

```bash
flatpak list | grep -i tidal
```

Expected output (version may vary):

```
TIDAL Hi-Fi    com.mastermindzh.tidal-hifi    6.0.0    stable    flathub
```

Verify tidal-hifi can launch (requires graphical environment):

```bash
flatpak run com.mastermindzh.tidal-hifi &
```

#### Troubleshooting

**Problem**: Flatpak fails to install

**Solution**: Ensure the package manager repositories are up to date:

```bash
# Amazon Linux 2023 / RHEL 9
sudo dnf makecache

# Amazon Linux 2 / RHEL 8
sudo yum makecache
```

**Problem**: tidal-hifi fails to launch with display errors

**Solution**: tidal-hifi requires a graphical environment. For headless servers:

- Use X11 forwarding with SSH: `ssh -X user@server` then run `flatpak run com.mastermindzh.tidal-hifi`
- Use VNC or RDP to connect to a desktop session
- Use the Tidal web player at https://listen.tidal.com

**Problem**: Audio playback issues

**Solution**: Ensure PulseAudio is installed and running:

```bash
sudo dnf install -y pulseaudio pulseaudio-utils
pulseaudio --start
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 1903 or later, or Windows 11 (64-bit)
- At least 250 MB free disk space
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install tidal -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

After installation, Tidal can be launched from the Start Menu or via command line:

```powershell
Start-Process "shell:AppsFolder\$(Get-StartApps -Name 'TIDAL' | Select-Object -First 1 -ExpandProperty AppId)"
```

**Note**: On first launch, Tidal will prompt you to sign in with your account credentials.

#### Verification

Open a new Command Prompt or PowerShell window, then verify Tidal is installed:

```powershell
choco list tidal
```

Expected output (version may vary):

```
tidal 2.39.5
1 packages installed.
```

#### Troubleshooting

**Problem**: `choco: command not found` or `'choco' is not recognized`

**Solution**: Chocolatey is not installed or not in PATH. Install Chocolatey first (see Prerequisites), then open a new terminal window.

**Problem**: Installation fails with permission errors

**Solution**: Run PowerShell as Administrator. Right-click PowerShell in the Start Menu and select "Run as administrator".

**Problem**: Tidal fails to launch after installation

**Solution**: Restart your computer to ensure all components are properly registered, then try launching again.

**Problem**: Need to update Tidal

**Solution**: Run the upgrade command:

```powershell
choco upgrade tidal -y
```

---

### WSL (Ubuntu)

#### Platform Approach

**Tidal is installed on the Windows host, not within WSL.** The recommended approach is to install Tidal on Windows and access it from WSL using Windows interoperability.

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- Administrator access on Windows for Tidal installation

#### Installation Steps

**Step 1: Install Tidal on Windows**

From a Windows Administrator PowerShell:

```powershell
choco install tidal -y
```

**Step 2: Access Tidal from WSL**

From within your WSL terminal, you can launch Windows Tidal:

```bash
# Launch Tidal using Windows executable
cmd.exe /c start "" "tidal:"
```

This command uses Windows interoperability to launch the Tidal application installed on the Windows host.

**Alternative: Access Tidal via browser from WSL**

If you prefer browser-based access:

```bash
# Open Tidal web player in default Windows browser
cmd.exe /c start https://listen.tidal.com
```

#### Verification

From WSL, verify you can launch Windows Tidal:

```bash
cmd.exe /c start "" "tidal:"
```

Tidal should open in a new window on the Windows desktop.

#### Troubleshooting

**Problem**: Cannot launch Windows Tidal from WSL

**Solution**: Ensure Tidal is installed on Windows first. Run `choco list tidal` in a Windows PowerShell to verify installation.

**Problem**: Protocol handler not recognized

**Solution**: Use the web player approach instead:

```bash
cmd.exe /c start https://listen.tidal.com
```

**Problem**: Need to use Tidal commands in WSL scripts

**Solution**: Create a helper alias in your `~/.bashrc`:

```bash
echo 'alias tidal="cmd.exe /c start https://listen.tidal.com"' >> ~/.bashrc
source ~/.bashrc
```

Then simply run `tidal` from your WSL terminal.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Administrator access for Tidal installation

#### Installation Steps

Git Bash runs on Windows, so Tidal is installed on the Windows host and accessible from Git Bash.

**Step 1: Install Tidal on Windows**

From an Administrator Command Prompt or PowerShell (not Git Bash):

```powershell
choco install tidal -y
```

**Step 2: Access Tidal from Git Bash**

After installation, Tidal can be launched from Git Bash:

```bash
start "" "tidal:"
```

Or use the web player:

```bash
start https://listen.tidal.com
```

#### Verification

From Git Bash, verify Tidal can be launched:

```bash
start https://listen.tidal.com
```

The Tidal web player should open in your default browser.

#### Troubleshooting

**Problem**: `start: command not found`

**Solution**: Use the Windows-style command:

```bash
cmd //c "start https://listen.tidal.com"
```

**Problem**: Tidal does not launch

**Solution**: Ensure Tidal is installed on Windows. Open a Windows Command Prompt and verify:

```cmd
choco list tidal
```

If not installed, install it from an Administrator PowerShell first.

**Problem**: Need to use Tidal in scripts

**Solution**: For scripting, use the Windows command wrapper:

```bash
#!/bin/bash
# Launch Tidal web player
cmd //c "start https://listen.tidal.com" 2>/dev/null
```

---

## Post-Installation Configuration

After installing Tidal on any platform, complete these configuration steps.

### Signing In

1. Launch Tidal
2. Click "Log in" and enter your credentials, or sign in with Facebook, Apple, Twitter, or other linked accounts
3. Complete any two-factor authentication if enabled on your account

### Configuring Audio Quality

Adjust streaming quality based on your subscription and preferences:

1. Click your profile picture or the settings icon
2. Go to **Settings** > **Streaming**
3. Select audio quality:
   - **Normal** (AAC 96 kbps) - Low data usage
   - **High** (AAC 320 kbps) - Better quality
   - **HiFi** (FLAC 16-bit/44.1kHz) - Lossless CD quality (HiFi subscription required)
   - **Max** (MQA/FLAC up to 24-bit/192kHz) - Master quality (HiFi Plus subscription required)

### Configuring Download Quality (Mobile/Desktop)

For offline listening:

1. Go to **Settings** > **Downloads**
2. Select download quality matching your storage capacity
3. Toggle on **Download using cellular** if desired (mobile)

### Keyboard Shortcuts

Essential shortcuts for productivity:

| Action | Windows | macOS |
|--------|---------|-------|
| Play/Pause | `Space` | `Space` |
| Next Track | `Ctrl+Right` | `Cmd+Right` |
| Previous Track | `Ctrl+Left` | `Cmd+Left` |
| Volume Up | `Ctrl+Up` | `Cmd+Up` |
| Volume Down | `Ctrl+Down` | `Cmd+Down` |
| Search | `Ctrl+L` | `Cmd+L` |

---

## Common Issues

### Issue: "Unable to Connect" or Network Errors

**Symptoms**: Tidal shows connection errors or fails to load content

**Solutions**:

- Check internet connectivity
- Verify firewall allows Tidal traffic (ports 443, 80)
- If behind a corporate proxy, configure proxy settings in system settings
- Try signing out and signing back in
- Clear cache in Settings

### Issue: High Memory or CPU Usage

**Symptoms**: Tidal consumes excessive system resources

**Solutions**:

- Disable hardware acceleration in settings if available
- Restart Tidal periodically during long sessions
- Ensure Tidal is updated to the latest version
- Close other resource-intensive applications

### Issue: Audio Playback Problems

**Symptoms**: No sound, stuttering, or distorted audio

**Solutions**:

**All Platforms:**

- Check system volume and ensure Tidal is not muted
- Verify correct audio output device is selected in Tidal Settings
- Restart Tidal

**Linux (tidal-hifi):**

- Ensure PulseAudio or PipeWire is running
- Check audio device permissions

**Windows:**

- Run Windows Audio Troubleshooter
- Update audio drivers

### Issue: HiFi/Max Quality Not Available

**Symptoms**: Cannot select HiFi or Max quality options

**Solutions**:

- Verify your subscription tier at https://tidal.com/account
- HiFi quality requires HiFi or HiFi Plus subscription
- Max quality requires HiFi Plus subscription
- Some content may not be available in all quality levels
- Web player has limited quality support (no Max on Firefox/Safari)

### Issue: Exclusive Mode / Audio Device Conflicts

**Symptoms**: Other applications cannot play audio when Tidal is open

**Solutions**:

- Disable exclusive mode in Tidal Settings > Playback
- This allows other applications to share the audio device

---

## Summary Table

| Platform | Native Support | Installation Method | Notes |
|----------|---------------|---------------------|-------|
| macOS | Yes | `brew install --quiet --cask tidal` | Requires macOS 12+ |
| Windows | Yes | `choco install tidal -y` | Primary supported platform |
| Ubuntu/Debian | No | `flatpak install -y flathub com.mastermindzh.tidal-hifi` | Third-party client, x86_64 only |
| Raspberry Pi | No | Docker (tidal-connect) | Tidal Connect only, no GUI |
| Amazon Linux/RHEL | No | `flatpak install -y flathub com.mastermindzh.tidal-hifi` | Third-party client, requires desktop |
| WSL | N/A | Install on Windows host | Uses Windows installation |
| Git Bash | N/A | Uses Windows installation | Inherits Windows Tidal |

---

## References

- [Tidal Official Website](https://tidal.com/)
- [Tidal Downloads](https://tidal.com/download)
- [Tidal System Requirements](https://support.tidal.com/hc/en-us/articles/115005872445-System-Requirements)
- [Tidal Support - Desktop](https://support.tidal.com/hc/en-us/sections/115001618769-Desktop)
- [Tidal Homebrew Cask](https://formulae.brew.sh/cask/tidal)
- [Tidal Chocolatey Package](https://community.chocolatey.org/packages/tidal)
- [Tidal winget Package](https://winget.run/pkg/TIDALMusicAS/TIDAL)
- [Tidal Web Player](https://listen.tidal.com)
- [tidal-hifi GitHub Repository](https://github.com/Mastermindzh/tidal-hifi)
- [tidal-hifi on Flathub](https://flathub.org/apps/com.mastermindzh.tidal-hifi)
- [Tidal Connect Docker](https://github.com/GioF71/tidal-connect)
