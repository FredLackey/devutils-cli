# Installing yt-dlp

## Overview

yt-dlp is a feature-rich command-line audio and video downloader. It is a fork of the now-discontinued youtube-dl project, with additional features, bug fixes, and active maintenance. yt-dlp supports downloading from YouTube, Vimeo, Twitter, TikTok, and thousands of other websites.

Key capabilities include:

- **Video downloading**: Download videos in various qualities and formats
- **Audio extraction**: Extract audio tracks from videos (requires FFmpeg)
- **Playlist support**: Download entire playlists or channels
- **Metadata embedding**: Embed thumbnails, subtitles, and metadata into files
- **Format selection**: Choose specific video/audio quality and codecs
- **Live stream recording**: Capture live streams as they broadcast

**Important**: For full functionality (format conversion, audio extraction, thumbnail embedding), install FFmpeg alongside yt-dlp. See the FFmpeg installation guide for details.

## Prerequisites

Before installing yt-dlp on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required for system-wide installation
3. **FFmpeg (recommended)** - Required for format conversion and audio extraction
4. **Python 3.9+ (optional)** - Required only for pip installation method

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- Xcode Command Line Tools installed

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install yt-dlp:

```bash
brew install --quiet yt-dlp
```

The `--quiet` flag suppresses non-essential output for cleaner automation. Homebrew automatically installs Python and other dependencies.

To install FFmpeg for full format conversion support:

```bash
brew install --quiet ffmpeg
```

#### Verification

Confirm the installation succeeded:

```bash
yt-dlp --version
```

Expected output (version numbers may vary):

```
2025.12.08
```

Test basic functionality by checking supported extractors:

```bash
yt-dlp --list-extractors | head -20
```

#### Troubleshooting

**Problem**: `yt-dlp: command not found` after installation

**Solution**: Homebrew may not be in your PATH. Add it to your shell profile:

For Apple Silicon Macs (M1/M2/M3/M4):

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

For Intel Macs:

```bash
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

**Problem**: Downloads fail with "unable to extract" errors

**Solution**: Update yt-dlp to the latest version. Website changes frequently break extractors:

```bash
brew upgrade yt-dlp
```

**Problem**: Cannot convert formats or extract audio

**Solution**: Install FFmpeg:

```bash
brew install --quiet ffmpeg
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 22.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- At least 100 MB free disk space

**Note**: The yt-dlp package is available in official Ubuntu repositories starting with Ubuntu 22.04. However, repository versions may be outdated. This guide uses the official Ubuntu repositories for simplicity and system integration.

#### Installation Steps

Run the following commands to update the package index and install yt-dlp:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y yt-dlp
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully unattended installation without prompts.

To install FFmpeg for full format conversion support:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg
```

**Note on Version Currency**: Ubuntu repository versions may lag behind the latest release. Ubuntu 24.04 LTS includes yt-dlp 2024.04.09, while the latest release may be newer. For most use cases, the repository version is sufficient. If you need the latest version, use the pip installation method or download the binary directly (see Git Bash section for binary installation steps).

#### Verification

Confirm the installation succeeded:

```bash
yt-dlp --version
```

Expected output (version numbers vary by distribution):

```
2024.04.09
```

Test that yt-dlp can access the network:

```bash
yt-dlp --dump-json "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 2>/dev/null | head -1
```

#### Troubleshooting

**Problem**: `E: Unable to locate package yt-dlp`

**Solution**: Update the package index:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

If still unavailable, your Ubuntu version may be too old. Use pip installation instead:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3-pip
python3 -m pip install -U "yt-dlp[default]"
```

**Problem**: Downloads fail with extraction errors

**Solution**: Repository versions may be outdated. Update to the latest version using pip:

```bash
python3 -m pip install -U "yt-dlp[default]"
```

**Problem**: Audio extraction or format conversion fails

**Solution**: Install FFmpeg:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye), 32-bit or 64-bit
- Raspberry Pi 3 or later recommended (earlier models work but may be slow)
- sudo privileges
- At least 100 MB free disk space

#### Installation Steps

Run the following commands to update the package index and install yt-dlp:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y yt-dlp
```

**Note on ARM Architecture**: Raspberry Pi OS is based on Debian, and yt-dlp in the repositories works on ARM processors without modification. The package is architecture-independent (pure Python).

To install FFmpeg for full format conversion support:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg
```

#### Verification

Confirm the installation succeeded:

```bash
yt-dlp --version
```

Expected output (version numbers may vary):

```
2023.03.04
```

Test basic functionality:

```bash
yt-dlp --help | head -5
```

#### Troubleshooting

**Problem**: Downloads are very slow

**Solution**: Raspberry Pi has limited CPU and network bandwidth. Use lower quality formats:

```bash
yt-dlp -f "best[height<=720]" "URL"
```

**Problem**: Out of memory during download or conversion

**Solution**: Add swap space:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Problem**: Package not available on older Raspberry Pi OS

**Solution**: Use pip installation:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3-pip
python3 -m pip install -U "yt-dlp[default]"
```

**Problem**: SSL certificate errors during downloads

**Solution**: Update certificates:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- At least 100 MB free disk space
- Python 3.9 or later

**Important**: yt-dlp is not available in the standard Amazon Linux repositories. This guide uses pip installation, which is the recommended approach for Amazon Linux.

#### Installation Steps

**Step 1: Install Python and pip**

For Amazon Linux 2023:

```bash
sudo dnf install -y python3-pip
```

For Amazon Linux 2:

```bash
sudo yum install -y python3-pip
```

**Step 2: Install yt-dlp using pip**

```bash
python3 -m pip install -U "yt-dlp[default]"
```

The `[default]` extra installs recommended dependencies for optimal functionality.

**Step 3: Add pip bin directory to PATH (if needed)**

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Step 4: Install FFmpeg for format conversion (recommended)**

FFmpeg is not in Amazon Linux repositories. Install using static builds:

For x86_64 (Intel/AMD) instances:

```bash
cd /tmp
curl -L -o ffmpeg.tar.xz https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz
sudo tar -xf ffmpeg.tar.xz -C /opt/
sudo ln -sf /opt/ffmpeg-master-latest-linux64-gpl/bin/ffmpeg /usr/local/bin/ffmpeg
sudo ln -sf /opt/ffmpeg-master-latest-linux64-gpl/bin/ffprobe /usr/local/bin/ffprobe
rm ffmpeg.tar.xz
```

For ARM64 (Graviton) instances:

```bash
cd /tmp
curl -L -o ffmpeg.tar.xz https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linuxarm64-gpl.tar.xz
sudo tar -xf ffmpeg.tar.xz -C /opt/
sudo ln -sf /opt/ffmpeg-master-latest-linuxarm64-gpl/bin/ffmpeg /usr/local/bin/ffmpeg
sudo ln -sf /opt/ffmpeg-master-latest-linuxarm64-gpl/bin/ffprobe /usr/local/bin/ffprobe
rm ffmpeg.tar.xz
```

#### Verification

Confirm the installation succeeded:

```bash
yt-dlp --version
```

Expected output (version numbers may vary):

```
2025.12.08
```

Test that FFmpeg is accessible:

```bash
ffmpeg -version | head -1
```

#### Troubleshooting

**Problem**: `yt-dlp: command not found` after pip installation

**Solution**: The pip bin directory may not be in PATH. Add it:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: pip installation fails with permission errors

**Solution**: Use the `--user` flag (which is the default for modern pip) or ensure you are not running as root without sudo:

```bash
python3 -m pip install --user -U "yt-dlp[default]"
```

**Problem**: SSL errors during downloads

**Solution**: Update certificates:

```bash
sudo dnf install -y ca-certificates  # AL2023
sudo yum install -y ca-certificates  # AL2
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or later (64-bit)
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install yt-dlp -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

To install FFmpeg for full format conversion support:

```powershell
choco install ffmpeg -y
```

#### Verification

Open a new PowerShell or Command Prompt window (to refresh PATH), then run:

```powershell
yt-dlp --version
```

Expected output (version numbers may vary):

```
2025.12.08
```

Test basic functionality:

```powershell
yt-dlp --help
```

#### Troubleshooting

**Problem**: `yt-dlp: The term 'yt-dlp' is not recognized`

**Solution**: Open a new terminal window. Chocolatey updates PATH during installation, but existing terminals do not pick up the change. Alternatively, refresh the environment:

```powershell
refreshenv
```

**Problem**: Downloads fail with network errors

**Solution**: Windows Defender or antivirus may be blocking the connection. Add yt-dlp to the exclusion list or temporarily disable real-time protection.

**Problem**: Cannot extract audio or convert formats

**Solution**: Install FFmpeg:

```powershell
choco install ffmpeg -y
```

**Problem**: Upgrade fails

**Solution**: Uninstall and reinstall:

```powershell
choco uninstall yt-dlp -y
choco install yt-dlp -y
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

**Note**: yt-dlp installed in Windows is not accessible from WSL. You must install yt-dlp separately within your WSL Ubuntu environment.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y yt-dlp
```

The installation process is identical to native Ubuntu since WSL Ubuntu uses the same package repositories.

To install FFmpeg for full format conversion support:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg
```

**Alternative: Latest version via pip**

If you need the latest yt-dlp version:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3-pip
python3 -m pip install -U "yt-dlp[default]"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
yt-dlp --version
```

Expected output (version numbers vary by Ubuntu version):

```
2024.04.09
```

Test basic functionality:

```bash
yt-dlp --help | head -5
```

#### Troubleshooting

**Problem**: Package installation fails with network errors

**Solution**: WSL may have DNS issues. Update the resolv.conf:

```bash
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Need to download files to Windows filesystem

**Solution**: Access Windows files through `/mnt/c/`:

```bash
# Download to Windows Downloads folder
yt-dlp -o "/mnt/c/Users/YourUsername/Downloads/%(title)s.%(ext)s" "URL"
```

**Problem**: Downloads are slower than on Windows

**Solution**: WSL filesystem I/O to Windows drives is slower. Download to the WSL filesystem first, then move:

```bash
yt-dlp -o "~/Downloads/%(title)s.%(ext)s" "URL"
mv ~/Downloads/*.mp4 /mnt/c/Users/YourUsername/Downloads/
```

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or later (64-bit)
- Git Bash installed (comes with Git for Windows)
- Internet access to download binaries

**Note**: Git Bash runs in a MinGW environment on Windows. This guide uses direct binary download, which provides a portable installation that works in Git Bash.

#### Installation Steps

**Step 1: Create a directory for yt-dlp**

Open Git Bash and run:

```bash
mkdir -p ~/bin
```

**Step 2: Download the yt-dlp executable**

```bash
curl -L -o ~/bin/yt-dlp.exe https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
chmod +x ~/bin/yt-dlp.exe
```

**Step 3: Add to PATH**

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Step 4: Install FFmpeg (recommended)**

```bash
cd /tmp
curl -L -o ffmpeg.zip https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
unzip -q ffmpeg.zip -d /tmp/ffmpeg-extract
mv /tmp/ffmpeg-extract/ffmpeg-*/bin/*.exe ~/bin/
rm -rf /tmp/ffmpeg.zip /tmp/ffmpeg-extract
```

#### Verification

Confirm the installation succeeded:

```bash
yt-dlp --version
```

Expected output (version numbers may vary):

```
2025.12.08
```

Test that FFmpeg is available:

```bash
ffmpeg -version | head -1
```

#### Troubleshooting

**Problem**: `yt-dlp: command not found`

**Solution**: Verify PATH includes `~/bin`:

```bash
echo $PATH | grep -q "$HOME/bin" && echo "PATH OK" || echo "Missing from PATH"
```

If missing, add it manually:

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Download fails with certificate errors

**Solution**: Update ca-certificates or use the `-k` flag (less secure):

```bash
curl -L -k -o ~/bin/yt-dlp.exe https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
```

**Problem**: Permission denied when running yt-dlp

**Solution**: Ensure the executable has proper permissions:

```bash
chmod +x ~/bin/yt-dlp.exe
```

**Problem**: Path conversion issues with Windows-style paths

**Solution**: Use forward slashes or the MSYS_NO_PATHCONV environment variable:

```bash
MSYS_NO_PATHCONV=1 yt-dlp -o "C:/Users/Me/Downloads/%(title)s.%(ext)s" "URL"
```

---

## Post-Installation Configuration

After installing yt-dlp on any platform, consider these optional but useful configurations.

### Creating a Configuration File

yt-dlp supports a configuration file for persistent settings. Create it at:

- **Linux/macOS/WSL**: `~/.config/yt-dlp/config`
- **Windows**: `%APPDATA%\yt-dlp\config`

Example configuration:

```bash
# Create config directory
mkdir -p ~/.config/yt-dlp

# Create configuration file
cat > ~/.config/yt-dlp/config << 'EOF'
# Default format: best quality up to 1080p
-f "bestvideo[height<=1080]+bestaudio/best[height<=1080]"

# Output filename template
-o "%(title)s.%(ext)s"

# Embed metadata
--embed-metadata
--embed-thumbnail

# Download subtitles if available
--write-subs
--sub-langs "en"
EOF
```

### Verifying FFmpeg Integration

Check that yt-dlp can find FFmpeg:

```bash
yt-dlp --verbose 2>&1 | grep -i ffmpeg
```

You should see the FFmpeg path listed in the output.

### Testing Audio Extraction

Verify audio extraction works (requires FFmpeg):

```bash
yt-dlp --extract-audio --audio-format mp3 --audio-quality 0 "https://www.youtube.com/watch?v=dQw4w9WgXcQ" -o "test-audio.%(ext)s"
rm -f test-audio.mp3  # Clean up
```

### Updating yt-dlp

Keep yt-dlp updated to ensure extractors work with website changes:

**Homebrew (macOS)**:
```bash
brew upgrade yt-dlp
```

**APT (Ubuntu/Debian/Raspberry Pi)**:
```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y yt-dlp
```

**pip (any platform)**:
```bash
python3 -m pip install -U "yt-dlp[default]"
```

**Chocolatey (Windows)**:
```powershell
choco upgrade yt-dlp -y
```

**Binary (Git Bash/manual)**:
```bash
yt-dlp -U
```

---

## Common Issues

### Issue: "Unable to extract" or "Video unavailable"

**Symptoms**: Downloads fail with extraction errors

**Solutions**:

- Update yt-dlp to the latest version (websites frequently change their structure)
- Check if the video is actually available in your region
- Some videos are age-restricted and require cookies:

```bash
# Export cookies from your browser using a browser extension
yt-dlp --cookies cookies.txt "URL"
```

### Issue: "ffmpeg not found" or "ffprobe not found"

**Symptoms**: Format conversion or audio extraction fails

**Solutions**:

- Install FFmpeg using the platform-specific instructions above
- Verify FFmpeg is in PATH:

```bash
which ffmpeg  # Linux/macOS
where ffmpeg  # Windows
```

### Issue: Downloads are Slow

**Symptoms**: Downloads take much longer than expected

**Solutions**:

- Use a download speed limit if your connection is unstable:

```bash
yt-dlp --limit-rate 10M "URL"
```

- Use concurrent fragment downloads for faster downloads:

```bash
yt-dlp --concurrent-fragments 5 "URL"
```

### Issue: "HTTP Error 429: Too Many Requests"

**Symptoms**: Downloads fail with rate limiting errors

**Solutions**:

- Wait a few minutes before retrying
- Use a lower rate limit:

```bash
yt-dlp --sleep-interval 5 --max-sleep-interval 30 "URL"
```

- Use cookies from a logged-in browser session

### Issue: Output File Already Exists

**Symptoms**: Downloads fail because file already exists

**Solutions**:

- Skip existing files:

```bash
yt-dlp --no-overwrites "URL"
```

- Or force overwrite:

```bash
yt-dlp --force-overwrites "URL"
```

### Issue: Subtitles Not Downloaded

**Symptoms**: No subtitle files appear alongside video

**Solutions**:

- Check available subtitles:

```bash
yt-dlp --list-subs "URL"
```

- Download all available subtitles:

```bash
yt-dlp --write-subs --all-subs "URL"
```

- Download auto-generated subtitles if no manual ones exist:

```bash
yt-dlp --write-auto-subs "URL"
```

---

## References

- [yt-dlp GitHub Repository](https://github.com/yt-dlp/yt-dlp)
- [yt-dlp Installation Wiki](https://github.com/yt-dlp/yt-dlp/wiki/Installation)
- [yt-dlp Supported Sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)
- [yt-dlp Configuration Options](https://github.com/yt-dlp/yt-dlp#configuration)
- [Homebrew Formula - yt-dlp](https://formulae.brew.sh/formula/yt-dlp)
- [Chocolatey Package - yt-dlp](https://community.chocolatey.org/packages/yt-dlp)
- [Ubuntu Packages - yt-dlp](https://packages.ubuntu.com/search?keywords=yt-dlp)
- [FFmpeg Official Website](https://www.ffmpeg.org/)
- [yt-dlp PyPI Package](https://pypi.org/project/yt-dlp/)
