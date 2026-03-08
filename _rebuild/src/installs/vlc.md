# Installing VLC

## Dependencies

### macOS (Homebrew)

- **Required:**
  - `homebrew` - Install via `dev install homebrew` or `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- **Optional:** None
- **Auto-installed:** None

### Ubuntu (APT/Snap)

- **Required:** None (APT is pre-installed on Ubuntu/Debian systems)
- **Optional:**
  - `vlc-plugin-access-extra` - Install via `sudo apt-get install vlc-plugin-access-extra` (for additional codec support)
  - `libdvd-pkg` - Install via `sudo apt-get install libdvd-pkg` (for DVD playback support)
- **Auto-installed:**
  - Various multimedia codecs (libavcodec, libavformat, etc.)
  - Qt5 libraries for GUI
  - Audio/video output libraries

### Raspberry Pi OS (APT/Snap)

- **Required:** None (APT is pre-installed on Raspberry Pi OS)
- **Optional:**
  - `vlc-nox` - Install via `sudo apt-get install vlc-nox` (headless/command-line only version for servers)
  - `vlc-plugin-base` - Install via `sudo apt-get install vlc-plugin-base` (additional plugin support)
  - `vlc-plugin-video-output` - Install via `sudo apt-get install vlc-plugin-video-output` (additional video output modules)
- **Auto-installed:**
  - ARM-optimized multimedia codecs
  - Hardware acceleration libraries (MMAL for Raspberry Pi GPU)
  - Qt5 libraries for GUI

### Amazon Linux (DNF/YUM)

- **Required:**
  - EPEL repository - Automatically installed via `sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm` (AL2023/RHEL9) or `sudo yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm` (AL2/RHEL8)
  - RPM Fusion Free repository - Automatically installed via `sudo dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-9.noarch.rpm` (AL2023/RHEL9) or `sudo yum install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-8.noarch.rpm` (AL2/RHEL8)
- **Optional:** None
- **Auto-installed:**
  - Multimedia codecs from RPM Fusion
  - Qt5 libraries for GUI
  - EPEL dependencies

### Windows (Chocolatey/winget)

- **Required:**
  - `chocolatey` - Install via PowerShell (Administrator): `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
  - Alternative: `winget` (pre-installed on Windows 10/11)
- **Optional:** None
- **Auto-installed:** None (VLC is a self-contained installation)

### Git Bash (Manual/Portable)

- **Required:**
  - VLC installed on Windows host (see Windows section above)
  - `chocolatey` on Windows - Install via PowerShell (Administrator): `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
- **Optional:** None
- **Auto-installed:** None

## Overview

VLC is a free and open-source cross-platform multimedia player and framework developed by the VideoLAN project. It plays most multimedia files, DVDs, Audio CDs, VCDs, and various streaming protocols without requiring additional codec packs. VLC is renowned for its versatility, supporting formats like MPEG-2, MPEG-4, H.264, MKV, WebM, WMV, MP3, FLAC, and many more out of the box.

Key capabilities include:

- **Universal Playback**: Plays virtually any audio or video format without additional codecs
- **Streaming Support**: Handles network streams (HTTP, RTSP, RTMP, HLS, etc.)
- **Subtitle Support**: Automatic subtitle download and synchronization
- **Hardware Acceleration**: GPU-accelerated decoding for better performance
- **Privacy-Focused**: No spyware, ads, or user tracking

## Prerequisites

Before installing VLC on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required for system-wide installation
3. **Sufficient disk space** - At least 200 MB for the application and dependencies

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- At least 200 MB free disk space

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

For Apple Silicon Macs (M1/M2/M3/M4), ensure Homebrew is in your PATH:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

#### Installation Steps

Run the following command to install VLC:

```bash
brew install --quiet --cask vlc
```

The `--quiet` flag suppresses non-essential output for cleaner automation. The `--cask` flag specifies the graphical application version. Homebrew handles the download from the official VideoLAN servers and places VLC in your Applications folder.

#### Verification

Confirm the installation succeeded:

```bash
/Applications/VLC.app/Contents/MacOS/VLC --version
```

Expected output (version numbers may vary):

```
VLC media player 3.0.21 Vetinari (revision 3.0.21-0-gf50c77779e)
```

Alternatively, verify VLC is in Applications:

```bash
ls -la /Applications/VLC.app
```

#### Troubleshooting

**Problem**: `VLC.app: No such file or directory` after installation

**Solution**: Homebrew may still be downloading or extracting. Wait a moment and check again. If the issue persists, reinstall:

```bash
brew uninstall --cask vlc
brew install --quiet --cask vlc
```

**Problem**: "VLC can't be opened because Apple cannot check it for malicious software"

**Solution**: Right-click (or Control-click) on VLC in Applications, select "Open", then click "Open" in the dialog. This only needs to be done once.

**Problem**: Installation fails with permission errors

**Solution**: Fix Homebrew permissions:

```bash
sudo chown -R $(whoami) $(brew --prefix)/*
```

**Problem**: Outdated version installed

**Solution**: Update Homebrew and upgrade VLC:

```bash
brew update && brew upgrade --cask vlc
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- At least 500 MB free disk space (including dependencies)

#### Installation Steps

Run the following commands to update the package index and install VLC:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully unattended installation without prompts.

**Note**: The version available in Ubuntu/Debian official repositories may not be the absolute latest. Ubuntu 24.04 LTS includes VLC 3.0.20, while Ubuntu 22.04 LTS includes VLC 3.0.16. For most use cases, the repository version is sufficient and receives security updates.

#### Verification

Confirm the installation succeeded:

```bash
vlc --version
```

Expected output (version numbers vary by distribution):

```
VLC media player 3.0.20 Vetinari (revision 3.0.20-0-g6f0d0ab12c)
```

Test that VLC launches correctly (headless check):

```bash
cvlc --version
```

The `cvlc` command runs VLC without the graphical interface, useful for verification on servers.

#### Troubleshooting

**Problem**: `E: Unable to locate package vlc`

**Solution**: Update the package index:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Need a newer version than available in repositories

**Solution**: Use the official VideoLAN PPA for the latest stable version:

```bash
sudo DEBIAN_FRONTEND=noninteractive add-apt-repository -y ppa:videolan/stable-daily
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc
```

**Problem**: VLC crashes or has codec issues

**Solution**: Install additional codec libraries:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc-plugin-access-extra libdvd-pkg
sudo DEBIAN_FRONTEND=noninteractive dpkg-reconfigure -f noninteractive libdvd-pkg
```

**Problem**: "No protocol specified" error when launching

**Solution**: This occurs when trying to run GUI VLC from a non-graphical session. Use `cvlc` for command-line operations or ensure you have a display server running.

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye), 32-bit or 64-bit
- Raspberry Pi 3 or later recommended (earlier models have limited performance)
- sudo privileges
- At least 500 MB free disk space

**Note**: Raspberry Pi OS (full desktop version) typically comes with VLC pre-installed. These steps are for Raspberry Pi OS Lite or if VLC was removed.

#### Installation Steps

Run the following commands to update the package index and install VLC:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc
```

**ARM Architecture Note**: The Raspberry Pi OS repositories contain VLC builds specifically optimized for ARM processors. These builds include hardware acceleration patches for the Raspberry Pi's GPU, providing better video playback performance than generic ARM builds.

For Raspberry Pi OS Lite (headless), install the command-line version only:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc-nox
```

The `vlc-nox` package provides VLC without X11 dependencies, suitable for headless streaming servers.

#### Verification

Confirm the installation succeeded:

```bash
vlc --version
```

Expected output (version numbers may vary):

```
VLC media player 3.0.20 Vetinari (revision 3.0.20-0-g6f0d0ab126)
```

For headless systems, verify the command-line player:

```bash
cvlc --version
```

Check that hardware acceleration is available:

```bash
vlc -vvv --list 2>&1 | grep -i mmal
```

On Raspberry Pi, you should see `mmal` (Multi-Media Abstraction Layer) entries indicating GPU acceleration support.

#### Troubleshooting

**Problem**: VLC installed but video playback is choppy

**Solution**: Enable hardware acceleration by editing VLC preferences or use command-line options:

```bash
cvlc --codec=mmal_codec /path/to/video.mp4
```

**Problem**: "No matching plugin found" errors

**Solution**: Install additional VLC plugins:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc-plugin-base vlc-plugin-video-output
```

**Problem**: Out of memory errors during playback

**Solution**: Add swap space for memory-intensive operations:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Problem**: Audio output not working

**Solution**: Set the correct audio output module:

```bash
cvlc --aout=alsa /path/to/audio.mp3
```

Or for HDMI audio:

```bash
cvlc --aout=hdmi /path/to/audio.mp3
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), or RHEL 8/9
- sudo privileges
- At least 500 MB free disk space

**Important**: VLC is not available in the standard Amazon Linux or RHEL repositories. You must enable the EPEL (Extra Packages for Enterprise Linux) and RPM Fusion repositories to install VLC.

#### Installation Steps

**For Amazon Linux 2023 / RHEL 9:**

```bash
# Install EPEL repository
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm

# Install RPM Fusion Free repository (contains VLC)
sudo dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-9.noarch.rpm

# Install VLC
sudo dnf install -y vlc
```

**For Amazon Linux 2 / RHEL 8:**

```bash
# Install EPEL repository
sudo yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm

# Install RPM Fusion Free repository (contains VLC)
sudo yum install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-8.noarch.rpm

# Install VLC
sudo yum install -y vlc
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Note for Amazon Linux 2023**: AL2023 is based on Fedora and uses DNF. The RHEL 9 repositories are compatible. For best results on EC2 instances, ensure your security groups allow outbound HTTPS access to the repository servers.

#### Verification

Confirm the installation succeeded:

```bash
vlc --version
```

Expected output (version numbers may vary):

```
VLC media player 3.0.20 Vetinari (revision 3.0.20-0-g6f0d0ab126)
```

Verify the command-line player works:

```bash
cvlc --version
```

#### Troubleshooting

**Problem**: `No match for argument: vlc`

**Solution**: Ensure RPM Fusion is properly installed. Check the repository list:

```bash
dnf repolist
```

You should see `rpmfusion-free` in the list. If not, reinstall the repository:

```bash
sudo dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm
```

**Problem**: Dependency conflicts during installation

**Solution**: Clean the DNF cache and retry:

```bash
sudo dnf clean all
sudo dnf install -y vlc
```

**Problem**: Repository GPG key errors

**Solution**: Import the RPM Fusion GPG keys:

```bash
sudo rpm --import https://www.rpmfusion.org/keys?action=AttachFile&do=get&target=RPM-GPG-KEY-rpmfusion-free-el-$(rpm -E %rhel)
```

**Problem**: VLC fails to start on headless EC2 instances

**Solution**: For streaming or transcoding on headless servers, use the command-line interface:

```bash
cvlc --no-video /path/to/media.mp4
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or later (32-bit or 64-bit), or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed
- At least 200 MB free disk space

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install vlc -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation. Chocolatey downloads VLC from the official VideoLAN servers and handles the installation silently.

**Alternative using winget** (built into Windows 10/11):

```powershell
winget install --id VideoLAN.VLC --silent --accept-package-agreements --accept-source-agreements
```

The `--silent` flag suppresses the installer GUI, and `--accept-package-agreements --accept-source-agreements` handles license acceptance automatically.

#### Verification

Open a new PowerShell or Command Prompt window (to refresh PATH), then run:

```powershell
vlc --version
```

Expected output (version numbers may vary):

```
VLC media player 3.0.21 Vetinari (revision 3.0.21-0-gf50c77779e)
```

If `vlc` is not recognized, use the full path:

```powershell
& "C:\Program Files\VideoLAN\VLC\vlc.exe" --version
```

#### Troubleshooting

**Problem**: `vlc: The term 'vlc' is not recognized`

**Solution**: Open a new terminal window to refresh environment variables. Alternatively, refresh the environment:

```powershell
refreshenv
```

If still not working, add VLC to your PATH manually or use the full path to the executable.

**Problem**: Installation fails with "package failed to install"

**Solution**: Run Chocolatey with verbose logging to diagnose:

```powershell
choco install vlc -y --debug --verbose
```

**Problem**: Antivirus blocks the download

**Solution**: Chocolatey downloads from official sources. Temporarily disable real-time scanning or add an exception for `C:\ProgramData\chocolatey`.

**Problem**: Upgrade fails or old version persists

**Solution**: Uninstall and reinstall:

```powershell
choco uninstall vlc -y
choco install vlc -y
```

**Problem**: winget reports "A newer version was found, but the install technology is different"

**Solution**: Uninstall the existing VLC installation from Windows Settings, then install fresh:

```powershell
winget uninstall VideoLAN.VLC
winget install --id VideoLAN.VLC --silent --accept-package-agreements --accept-source-agreements
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 Build 19044 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- WSLg enabled for GUI application support (Windows 11 or Windows 10 with updates)
- sudo privileges within WSL

**Important**: VLC is a graphical application. Running VLC in WSL requires GUI support through WSLg (Windows Subsystem for Linux GUI). Windows 11 includes WSLg by default. Windows 10 users need specific builds and updates for WSLg support.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc
```

The installation process is identical to native Ubuntu since WSL Ubuntu uses the same package repositories.

**Note**: For headless operation (streaming/transcoding without GUI), install the command-line version:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vlc-nox
```

#### Verification

Confirm the installation succeeded:

```bash
vlc --version
```

Expected output (version numbers vary by Ubuntu version):

```
VLC media player 3.0.20 Vetinari (revision 3.0.20-0-g6f0d0ab126)
```

Test GUI support (requires WSLg):

```bash
vlc &
```

If WSLg is working, a VLC window will appear on your Windows desktop.

#### Troubleshooting

**Problem**: "cannot open display" or "No protocol specified" error

**Solution**: WSLg may not be enabled or working. Verify WSLg status:

```bash
echo $DISPLAY
```

If empty, WSLg is not configured. On Windows 11, restart WSL:

```powershell
wsl --shutdown
```

Then reopen your WSL terminal.

**Problem**: VLC window appears but video playback fails

**Solution**: WSLg has limited GPU acceleration. For better performance, use Windows-native VLC for media playback and WSL VLC only for command-line operations:

```bash
cvlc --no-video /path/to/media.mp4
```

**Problem**: Audio not working in WSL VLC

**Solution**: WSLg includes PulseAudio support. Verify audio is routing correctly:

```bash
pactl info
```

If PulseAudio is not running, audio will not work in GUI applications.

**Problem**: Package installation fails with network errors

**Solution**: WSL may have DNS issues. Update resolv.conf:

```bash
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Need to access Windows files for playback

**Solution**: Windows drives are mounted under `/mnt/`. Access files like:

```bash
cvlc /mnt/c/Users/YourUsername/Videos/movie.mp4
```

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or later (64-bit)
- Git Bash installed (comes with Git for Windows)
- VLC installed on Windows (see Windows section)

**Note**: Git Bash runs in a MinGW environment on Windows. It does not require a separate VLC installation. Once VLC is installed on Windows using Chocolatey or winget, the `vlc` command becomes available in Git Bash through the Windows PATH.

#### Installation Steps

1. Install VLC on Windows using Chocolatey (requires Administrator PowerShell):

```bash
choco install vlc -y
```

2. Open Git Bash - the `vlc` command will be available because Git Bash inherits the Windows PATH.

If VLC is already installed on Windows but not accessible from Git Bash, add it to your PATH manually:

```bash
echo 'export PATH="$PATH:/c/Program Files/VideoLAN/VLC"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

In Git Bash, confirm VLC is accessible:

```bash
vlc --version
```

Expected output (version numbers may vary):

```
VLC media player 3.0.21 Vetinari (revision 3.0.21-0-gf50c77779e)
```

Test launching VLC:

```bash
vlc &
```

The VLC window should appear on your Windows desktop.

#### Troubleshooting

**Problem**: `vlc: command not found` in Git Bash

**Solution**: VLC may not be in PATH. Add it manually:

```bash
echo 'export PATH="$PATH:/c/Program Files/VideoLAN/VLC"' >> ~/.bashrc
source ~/.bashrc
```

Verify the path exists:

```bash
ls "/c/Program Files/VideoLAN/VLC/vlc.exe"
```

**Problem**: Path conversion issues with file arguments

**Solution**: Git Bash automatically converts Unix-style paths, which can cause issues. Use Windows-style paths or disable path conversion:

```bash
# Option 1: Use Windows-style paths
vlc "C:/Users/YourName/Videos/movie.mp4"

# Option 2: Disable path conversion for this command
MSYS_NO_PATHCONV=1 vlc /c/Users/YourName/Videos/movie.mp4
```

**Problem**: VLC opens but cannot find the media file

**Solution**: When passing file paths, use the Windows path format:

```bash
vlc "C:\Users\YourName\Videos\movie.mp4"
```

Or convert the path:

```bash
vlc "$(cygpath -w /c/Users/YourName/Videos/movie.mp4)"
```

**Problem**: VLC crashes when started from Git Bash

**Solution**: This is rare but can occur due to environment variable conflicts. Launch VLC directly:

```bash
"/c/Program Files/VideoLAN/VLC/vlc.exe" &
```

---

## Post-Installation Configuration

After installing VLC on any platform, consider these optional but useful configurations.

### Setting VLC as Default Media Player

**macOS:**

1. Right-click any media file in Finder
2. Select "Get Info"
3. Under "Open with", select VLC
4. Click "Change All" to apply to all files of that type

**Ubuntu/Debian/Raspberry Pi:**

```bash
xdg-mime default vlc.desktop video/mp4
xdg-mime default vlc.desktop audio/mpeg
```

**Windows:**

```powershell
# Set VLC as default for common video formats (requires admin)
assoc .mp4=VLC.mp4
assoc .mkv=VLC.mkv
assoc .avi=VLC.avi
```

Or use Windows Settings > Apps > Default apps.

### Enabling Hardware Acceleration

VLC can leverage GPU hardware for video decoding. Verify hardware acceleration is available:

**macOS:**

VLC automatically uses VideoToolbox on macOS. No configuration needed.

**Linux:**

Check available acceleration methods:

```bash
vlc -vvv --list 2>&1 | grep -E "(vaapi|vdpau|mmal)"
```

Enable VA-API (Intel/AMD GPUs) by setting preferences or using command line:

```bash
vlc --avcodec-hw=vaapi /path/to/video.mp4
```

**Windows:**

VLC uses DirectX Video Acceleration (DXVA2) automatically. Verify in Tools > Preferences > Input/Codecs > Hardware-accelerated decoding.

### Command-Line Streaming

VLC can stream media over the network. Example to stream a file over HTTP:

```bash
cvlc /path/to/video.mp4 --sout '#standard{access=http,mux=ts,dst=:8080}'
```

Access the stream from another device at `http://your-ip:8080`.

### Disabling Update Checks

For automated environments, disable VLC's update notifications:

**Linux:**
Create or edit `~/.config/vlc/vlcrc`:

```bash
mkdir -p ~/.config/vlc
echo "qt-updates-notif=0" >> ~/.config/vlc/vlcrc
```

**Windows:**
The setting is stored in the registry or can be set via VLC preferences (Tools > Preferences > Interface).

---

## Common Issues

### Issue: VLC Opens But No Video Displays

**Symptoms**: VLC window opens, audio plays, but video is black or missing

**Solutions**:

- Update graphics drivers to the latest version
- Try disabling hardware acceleration:

```bash
vlc --avcodec-hw=none /path/to/video.mp4
```

- On Linux, try a different video output:

```bash
vlc --vout=x11 /path/to/video.mp4
```

### Issue: No Audio Output

**Symptoms**: Video plays but no sound

**Solutions**:

- Check system volume and audio output device
- In VLC, go to Audio > Audio Device and select the correct output
- On Linux, specify the audio output:

```bash
vlc --aout=pulse /path/to/media.mp4
```

### Issue: Subtitle Timing Is Off

**Symptoms**: Subtitles appear too early or too late

**Solutions**:

- Use keyboard shortcuts: `G` to delay subtitles, `H` to speed them up
- Adjust in Tools > Track Synchronization > Subtitle track synchronization

### Issue: MKV Files Stutter or Skip

**Symptoms**: Playback of MKV files is choppy

**Solutions**:

- Enable file caching:

```bash
vlc --file-caching=1000 /path/to/video.mkv
```

- Reduce video quality settings or disable post-processing effects

### Issue: VLC Uses High CPU

**Symptoms**: CPU usage spikes during playback

**Solutions**:

- Enable hardware acceleration (see Post-Installation Configuration)
- Lower video output quality in Preferences
- On Raspberry Pi, ensure MMAL is being used for H.264 content

---

## References

- [VLC Official Website](https://www.videolan.org/)
- [VLC Official Download Page](https://www.videolan.org/vlc/)
- [VLC for Windows Download](https://www.videolan.org/vlc/download-windows.html)
- [VLC for macOS Download](https://www.videolan.org/vlc/download-macosx.html)
- [VLC for Ubuntu Download](https://www.videolan.org/vlc/download-ubuntu.html)
- [VLC Homebrew Cask](https://formulae.brew.sh/cask/vlc)
- [VLC Chocolatey Package](https://community.chocolatey.org/packages/vlc)
- [VLC Snap Package](https://snapcraft.io/vlc)
- [VLC on winget](https://winget.run/pkg/VideoLAN/VLC)
- [VLC Documentation Wiki](https://wiki.videolan.org/Documentation:Documentation/)
- [VLC Command-Line Help](https://wiki.videolan.org/VLC_command-line_help/)
- [RPM Fusion Repository](https://rpmfusion.org/)
- [Microsoft WSL GUI Apps Documentation](https://learn.microsoft.com/en-us/windows/wsl/tutorials/gui-apps)
