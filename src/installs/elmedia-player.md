# Installing Elmedia Player

## Overview

Elmedia Player is a premium media player developed by Electronic Team, Inc. (formerly Eltima Software) exclusively for macOS. It supports virtually all video and audio formats including AVI, MP4, FLV, WMV, MKV, MP3, M4V, MOV, and many others without requiring additional codecs. Elmedia Player also supports advanced codecs such as H.264/AVC, H.265/HEVC, and H.266/VVC with playback capabilities up to 8K resolution.

Key features include:
- Universal format support without external codecs
- Streaming to AirPlay 2, Chromecast, DLNA, and Roku devices
- Subtitle loading, synchronization, and customization (SRT, ASS, embedded)
- Audio enhancement with equalizer, pitch, and sync controls
- Native Apple Silicon optimization for M1, M2, and M3 chips
- Picture-in-picture and full-screen playback modes

**Important**: Elmedia Player is a **macOS-exclusive application**. It is not available for Windows, Linux, or any other operating system. The sections below for non-macOS platforms document this limitation and suggest alternative cross-platform media players.

## Prerequisites

Before installing Elmedia Player, ensure:

1. **macOS operating system** - Elmedia Player runs exclusively on macOS
2. **macOS 10.13 (High Sierra) or later** - Minimum system requirement for version 8.x
3. **Internet connectivity** - Required to download the application
4. **Administrative privileges** - May be required for Homebrew installation

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (Homebrew cask requirement)
- Homebrew package manager installed
- A graphical desktop session (not SSH-only)

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Elmedia Player:

```bash
brew install --cask --quiet elmedia-player
```

The `--cask` flag specifies that this is a macOS application (not a command-line formula). The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts.

This installs the free version of Elmedia Player. The Pro version with additional features (streaming, playlist management, video tuning) requires a separate license purchase from the Electronic Team website.

#### Verification

Confirm the installation succeeded by checking that the application exists:

```bash
ls -la /Applications/Elmedia\ Player.app
```

Expected output:

```
drwxr-xr-x@ 3 user  staff  96 Jan  1 12:00 /Applications/Elmedia Player.app
```

Verify the version installed:

```bash
defaults read /Applications/Elmedia\ Player.app/Contents/Info.plist CFBundleShortVersionString
```

Expected output (version may vary):

```
8.24
```

Alternatively, launch Elmedia Player from Spotlight (Cmd+Space, then type "Elmedia") and verify the application opens.

#### Troubleshooting

**Problem**: `Error: Cask 'elmedia-player' is unavailable`

**Solution**: Update Homebrew to get the latest cask definitions:

```bash
brew update
```

**Problem**: Installation requires password but script cannot prompt

**Solution**: Homebrew cask installations may require authentication. Pre-authenticate with sudo before running:

```bash
sudo -v && brew install --cask --quiet elmedia-player
```

**Problem**: Elmedia Player does not launch after installation

**Solution**: Launch the application manually:

```bash
open /Applications/Elmedia\ Player.app
```

**Problem**: macOS Gatekeeper blocks the application

**Solution**: Approve the application in System Preferences > Security & Privacy > General, or run:

```bash
xattr -dr com.apple.quarantine /Applications/Elmedia\ Player.app
```

**Problem**: Installation fails with "already installed" error

**Solution**: If you have a previous version installed (perhaps from the Mac App Store), either uninstall it first or use the `--force` flag:

```bash
brew install --cask --quiet --force elmedia-player
```

**Problem**: Conflicts between Homebrew version and Mac App Store version

**Solution**: The Homebrew cask installs the version from Electronic Team's website. The Mac App Store has a separate version. Choose one distribution method. To remove the Homebrew version:

```bash
brew uninstall --cask elmedia-player
```

---

### Ubuntu/Debian (APT)

#### Platform Not Supported

**Elmedia Player is not available for Ubuntu or Debian.** It is a macOS-exclusive application developed by Electronic Team, Inc. and has no Linux version.

#### Recommended Alternative

For Linux users requiring a feature-rich media player, install VLC Media Player:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc
```

VLC is a free, open-source, cross-platform media player that supports virtually all video and audio formats, similar to Elmedia Player.

Other alternatives include:

- **MPV** - Lightweight, scriptable media player:
  ```bash
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mpv
  ```

- **Celluloid** (GTK+ frontend for MPV):
  ```bash
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y celluloid
  ```

#### Verification

Verify VLC installation:

```bash
vlc --version
```

---

### Raspberry Pi OS (APT)

#### Platform Not Supported

**Elmedia Player is not available for Raspberry Pi OS.** It is a macOS-exclusive application and has no ARM Linux version.

#### Recommended Alternative

For Raspberry Pi users, install VLC Media Player which has excellent ARM support:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc
```

VLC on Raspberry Pi supports hardware-accelerated video decoding for smooth playback.

Alternative lightweight player for Raspberry Pi:

- **OMXPlayer** (pre-installed on older Raspberry Pi OS, deprecated on newer versions):
  ```bash
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y omxplayer
  ```

- **MPV** (modern, efficient):
  ```bash
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mpv
  ```

#### Verification

Verify VLC installation:

```bash
vlc --version
```

---

### Amazon Linux (DNF/YUM)

#### Platform Not Supported

**Elmedia Player is not available for Amazon Linux.** It is a macOS-exclusive application and has no Linux version.

#### Recommended Alternative

Amazon Linux is typically used for server workloads and does not include a desktop environment by default. If you have a desktop environment installed and need a media player, install VLC:

**Amazon Linux 2023:**

```bash
sudo dnf install -y vlc
```

**Amazon Linux 2:**

VLC is not available in the default Amazon Linux 2 repositories. Install from EPEL:

```bash
sudo amazon-linux-extras install -y epel && sudo yum install -y vlc
```

For server environments without a desktop, consider command-line media tools:

- **FFmpeg** for media processing:
  ```bash
  sudo dnf install -y ffmpeg
  ```

- **MPV** (if desktop is available):
  ```bash
  sudo dnf install -y mpv
  ```

#### Verification

Verify VLC installation:

```bash
vlc --version
```

---

### Windows (Chocolatey/winget)

#### Platform Not Supported

**Elmedia Player is not available for Windows.** It is a macOS-exclusive application developed by Electronic Team, Inc. and has no Windows version.

#### Recommended Alternative

For Windows users requiring a feature-rich media player, install VLC Media Player:

**Using Chocolatey:**

```powershell
choco install vlc -y
```

**Using winget:**

```powershell
winget install --id VideoLAN.VLC --silent --accept-package-agreements --accept-source-agreements
```

Other alternatives include:

- **PotPlayer** (feature-rich Windows media player):
  ```powershell
  choco install potplayer -y
  ```

- **MPV** (lightweight, scriptable):
  ```powershell
  choco install mpv -y
  ```

- **MPC-HC** (Media Player Classic - Home Cinema):
  ```powershell
  choco install mpc-hc -y
  ```

#### Verification

Verify VLC installation:

```powershell
vlc --version
```

Or check installed packages:

```powershell
choco list --local-only | findstr vlc
```

---

### WSL (Ubuntu)

#### Platform Not Supported

**Elmedia Player is not available for WSL.** It is a macOS-exclusive application. Additionally, WSL (Windows Subsystem for Linux) is primarily designed for command-line Linux tools, not graphical applications.

#### Recommended Alternative

If you need to play media within WSL with GUI support (WSLg on Windows 11), install VLC:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc
```

For Windows host media playback, install VLC on Windows instead (see Windows section above).

For command-line media playback within WSL:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mpv
```

**Note**: GUI applications in WSL require WSLg (Windows 11) or an X server (Windows 10). For most media playback needs, use a native Windows application.

#### Verification

Verify VLC installation:

```bash
vlc --version
```

---

### Git Bash (Manual/Portable)

#### Platform Not Supported

**Elmedia Player is not available for Git Bash or Windows.** It is a macOS-exclusive application.

Git Bash is a Windows terminal emulator that provides a Bash shell environment. It does not have its own media player ecosystem.

#### Recommended Alternative

Use Windows media players accessible from Git Bash after installation:

**Install VLC via Chocolatey (from Administrator Command Prompt/PowerShell):**

```bash
/c/ProgramData/chocolatey/bin/choco.exe install vlc -y
```

**Launch VLC from Git Bash:**

```bash
"/c/Program Files/VideoLAN/VLC/vlc.exe" &
```

For portable installation without Chocolatey:

```bash
# Download VLC portable (adjust version as needed)
curl -L -o ~/vlc-portable.zip "https://get.videolan.org/vlc/last/win64/"

# Note: VLC portable requires manual download from https://www.videolan.org/vlc/download-windows.html
# Select "7zip package" for portable use
```

#### Verification

Verify VLC is accessible:

```bash
ls -la "/c/Program Files/VideoLAN/VLC/vlc.exe"
```

---

## Post-Installation Configuration

### macOS

#### Setting Elmedia Player as Default Media Player

To set Elmedia Player as the default application for video files:

1. Right-click any video file in Finder
2. Select "Get Info" (or press Cmd+I)
3. Expand the "Open with" section
4. Select "Elmedia Player" from the dropdown
5. Click "Change All..." to apply to all files of this type

To configure via command line using `duti` (if installed):

```bash
# Install duti if not present
brew install --quiet duti

# Set Elmedia Player as default for common video formats
duti -s com.eltima.elmedia-player .mp4 all
duti -s com.eltima.elmedia-player .mkv all
duti -s com.eltima.elmedia-player .avi all
duti -s com.eltima.elmedia-player .mov all
```

#### Enabling Streaming Features (Pro Version)

Streaming to Chromecast, AirPlay, and DLNA devices requires the Pro version. After purchasing:

1. Launch Elmedia Player
2. Go to Elmedia Player > Enter License
3. Enter your registration information
4. Streaming options appear in the playback controls

#### Start at Login

To make Elmedia Player start automatically at login:

```bash
osascript -e 'tell application "System Events" to make login item at end with properties {path:"/Applications/Elmedia Player.app", hidden:false}'
```

---

## Common Issues

### Issue: Video Plays But No Audio

**Symptoms**: Video playback works but audio is silent.

**Solution**:
1. Check system volume is not muted
2. In Elmedia Player, go to Audio menu and verify the correct output device is selected
3. Check Audio > Audio Delay is set to 0
4. Try playing a different file to rule out file-specific issues

### Issue: Subtitles Not Displaying

**Symptoms**: Subtitles are loaded but not visible during playback.

**Solution**:
1. Go to Subtitles menu and verify subtitles are enabled
2. Check subtitle track is selected (Subtitles > Subtitle Track)
3. Adjust subtitle appearance in Preferences > Subtitles (font size, color, position)
4. For external subtitle files, ensure the subtitle file has the same base filename as the video

### Issue: High CPU Usage During Playback

**Symptoms**: Elmedia Player consumes excessive CPU resources.

**Solution**:
1. Enable hardware acceleration: Preferences > General > Enable hardware-accelerated decoding
2. For Apple Silicon Macs, ensure you are running the native version (not Rosetta)
3. Update to the latest version:
   ```bash
   brew upgrade --cask elmedia-player
   ```

### Issue: Chromecast/AirPlay Streaming Not Working (Pro)

**Symptoms**: Cannot find or connect to streaming devices.

**Solution**:
1. Ensure your Mac and streaming device are on the same network
2. Check firewall is not blocking Elmedia Player
3. Verify Pro license is activated
4. Restart the streaming device
5. In System Preferences > Security & Privacy > Firewall > Firewall Options, ensure Elmedia Player is allowed incoming connections

### Issue: Application Crashes on Launch

**Symptoms**: Elmedia Player quits unexpectedly when opening.

**Solution**:
1. Reset preferences:
   ```bash
   rm -rf ~/Library/Preferences/com.eltima.elmedia-player.plist
   rm -rf ~/Library/Application\ Support/Elmedia\ Player
   ```
2. Reinstall the application:
   ```bash
   brew uninstall --cask elmedia-player && brew install --cask --quiet elmedia-player
   ```
3. Check Console.app for crash logs for more details

### Issue: Conflict with Mac App Store Version

**Symptoms**: Multiple versions of Elmedia Player installed, unexpected behavior.

**Solution**: Use only one distribution method. Check for both versions:

```bash
# Check Homebrew version
ls /Applications/Elmedia\ Player.app

# Check for App Store version (different bundle location)
mdfind "kMDItemCFBundleIdentifier == 'com.eltima.elmedia-player'"
```

Remove the version you do not want to keep.

---

## References

- [Elmedia Player Official Website](https://www.elmedia-video-player.com/)
- [Electronic Team, Inc. (Developer)](https://mac.eltima.com/)
- [Elmedia Player - Homebrew Formulae](https://formulae.brew.sh/cask/elmedia-player)
- [Elmedia Player on Mac App Store](https://apps.apple.com/us/app/elmedia-video-player/id1044549675)
- [Elmedia Player Version History](https://help.electronic.us/support/solutions/articles/44002280353-elmedia-player-from-the-electronic-team-website)
- [Electronic Team Support](https://help.electronic.us/support/home)
- [VLC Media Player (Cross-Platform Alternative)](https://www.videolan.org/vlc/)
- [MPV Media Player (Cross-Platform Alternative)](https://mpv.io/)
