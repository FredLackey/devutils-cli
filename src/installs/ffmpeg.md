# Installing FFmpeg

## Overview

FFmpeg is a complete, cross-platform solution for recording, converting, and streaming audio and video. It includes libavcodec (the leading audio/video codec library), libavformat (a library for muxing and demuxing into various container formats), and the `ffmpeg` command-line tool for transcoding multimedia files. FFmpeg is the backbone of countless media applications and is essential for any developer working with audio or video processing.

Key capabilities include:

- **Transcoding**: Convert between virtually any audio/video format
- **Streaming**: Stream media over various protocols (RTMP, HLS, DASH)
- **Filtering**: Apply filters for scaling, cropping, overlaying, and effects
- **Recording**: Capture audio/video from various sources
- **Analysis**: Inspect media file properties with `ffprobe`

## Prerequisites

Before installing FFmpeg on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required for system-wide installation
3. **Sufficient disk space** - At least 500 MB for full installation with dependencies

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 12 (Monterey) or later
- Homebrew package manager installed
- Xcode Command Line Tools installed

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

If Xcode Command Line Tools are not installed:

```bash
xcode-select --install
```

#### Installation Steps

Run the following command to install FFmpeg:

```bash
brew install --quiet ffmpeg
```

The `--quiet` flag suppresses non-essential output for cleaner automation. Homebrew installs FFmpeg along with its 40+ dependencies including codecs for x264, x265, VP8/VP9, AV1, and various audio formats.

#### Verification

Confirm the installation succeeded:

```bash
ffmpeg -version
```

Expected output (version numbers may vary):

```
ffmpeg version 8.0.1 Copyright (c) 2000-2025 the FFmpeg developers
built with Apple clang version 16.0.0
...
```

Test basic functionality:

```bash
ffprobe -version
```

#### Troubleshooting

**Problem**: `ffmpeg: command not found` after installation

**Solution**: Homebrew may not be in your PATH. Add it to your shell profile:

For Apple Silicon Macs (M1/M2/M3):

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

For Intel Macs:

```bash
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

**Problem**: Installation fails with permission errors

**Solution**: Fix Homebrew permissions:

```bash
sudo chown -R $(whoami) $(brew --prefix)/*
```

**Problem**: Outdated version installed

**Solution**: Update Homebrew and upgrade FFmpeg:

```bash
brew update && brew upgrade ffmpeg
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- At least 500 MB free disk space

#### Installation Steps

Run the following commands to update the package index and install FFmpeg:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully unattended installation without prompts.

**Note**: The version available in Ubuntu/Debian official repositories may not be the latest. Ubuntu 24.04 LTS includes FFmpeg 6.1.1, while Ubuntu 22.04 LTS includes FFmpeg 4.4.2. For most use cases, the repository version is sufficient.

#### Verification

Confirm the installation succeeded:

```bash
ffmpeg -version
```

Expected output (version numbers vary by distribution):

```
ffmpeg version 6.1.1-3ubuntu5 Copyright (c) 2000-2023 the FFmpeg developers
built with gcc 13 (Ubuntu 13.2.0-23ubuntu4)
...
```

Test that all tools are available:

```bash
ffprobe -version
ffplay -version
```

#### Troubleshooting

**Problem**: `E: Unable to locate package ffmpeg`

**Solution**: Update the package index:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Need a newer version than available in repositories

**Solution**: Use the Ubuntu Handbook PPA for FFmpeg 7 or 8:

```bash
sudo DEBIAN_FRONTEND=noninteractive add-apt-repository -y ppa:ubuntuhandbook1/ffmpeg7
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg
```

**Problem**: Missing codecs or limited format support

**Solution**: Install additional codec libraries:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libavcodec-extra
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye), 32-bit or 64-bit
- Raspberry Pi 3 or later (earlier models have limited performance for video processing)
- sudo privileges
- At least 500 MB free disk space

#### Installation Steps

Run the following commands to update the package index and install FFmpeg:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg
```

**Note on ARM Architecture**: Raspberry Pi OS is based on Debian, and FFmpeg in the repositories is compiled for ARM. Raspberry Pi OS Bookworm includes FFmpeg 5.1.6. Hardware acceleration features may vary depending on your Raspberry Pi model.

#### Verification

Confirm the installation succeeded:

```bash
ffmpeg -version
```

Expected output (version numbers may vary):

```
ffmpeg version 5.1.6-0+deb12u1+rpt1 Copyright (c) 2000-2024 the FFmpeg developers
built with gcc 12 (Debian 12.2.0-14)
...
```

Check available hardware acceleration:

```bash
ffmpeg -hwaccels
```

On Raspberry Pi 4, you should see `drm` and possibly `v4l2m2m` listed.

#### Troubleshooting

**Problem**: Very slow video encoding/decoding

**Solution**: Raspberry Pi has limited CPU power. Use hardware acceleration where possible:

```bash
# Example: Use V4L2 hardware encoder for H.264
ffmpeg -i input.mp4 -c:v h264_v4l2m2m output.mp4
```

**Problem**: Out of memory during transcoding

**Solution**: Reduce processing requirements or add swap space:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Problem**: Need newer version than available in repositories

**Solution**: Raspberry Pi OS tracks Debian stable releases. For newer FFmpeg versions, compile from source or use static builds (see Git Bash section for static build instructions, which also work on Linux).

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- At least 500 MB free disk space

**Important**: FFmpeg is not available in the standard Amazon Linux repositories. This guide uses static pre-built binaries from BtbN, which is the recommended approach for Amazon Linux.

#### Installation Steps

**Step 1: Determine your architecture**

```bash
ARCH=$(uname -m)
echo "Architecture: $ARCH"
```

**Step 2: Download and install FFmpeg static build**

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

**Note**: These static builds include all common codecs and do not require additional dependencies. The builds are updated daily from FFmpeg master branch.

#### Verification

Confirm the installation succeeded:

```bash
ffmpeg -version
```

Expected output (version numbers may vary):

```
ffmpeg version N-XXXXX-gXXXXXXXXXX Copyright (c) 2000-2025 the FFmpeg developers
built with gcc 13.2.0 (GCC)
...
```

Test that ffprobe is also available:

```bash
ffprobe -version
```

#### Troubleshooting

**Problem**: `ffmpeg: command not found` after installation

**Solution**: Verify the symlinks exist and `/usr/local/bin` is in PATH:

```bash
ls -la /usr/local/bin/ffmpeg
echo $PATH | grep -q '/usr/local/bin' && echo "PATH OK" || echo "PATH missing /usr/local/bin"
```

If PATH is missing `/usr/local/bin`, add it:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Permission denied when extracting

**Solution**: Ensure you have sudo privileges and the target directory exists:

```bash
sudo mkdir -p /opt
```

**Problem**: Want to use a specific FFmpeg version instead of latest

**Solution**: Replace `latest` in the URL with a specific release tag. Check available releases at https://github.com/BtbN/FFmpeg-Builds/releases

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
choco install ffmpeg -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

Chocolatey installs the "essentials" build which includes commonly-used codecs (x264, x265, VP8/VP9, Opus, AAC). The essentials build is compatible with Windows 7 and later.

#### Verification

Open a new PowerShell or Command Prompt window (to refresh PATH), then run:

```powershell
ffmpeg -version
```

Expected output (version numbers may vary):

```
ffmpeg version 8.0.1-essentials_build-www.gyan.dev Copyright (c) 2000-2025 the FFmpeg developers
built with gcc 14.2.0 (Rev1, Built by MSYS2 project)
...
```

Test that ffprobe is also available:

```powershell
ffprobe -version
```

#### Troubleshooting

**Problem**: `ffmpeg: The term 'ffmpeg' is not recognized`

**Solution**: Open a new terminal window. Chocolatey updates PATH during installation, but existing terminals do not pick up the change. Alternatively, refresh the environment:

```powershell
refreshenv
```

**Problem**: Need the "full" build with additional codecs

**Solution**: Install the full build instead:

```powershell
choco uninstall ffmpeg -y
choco install ffmpeg-full -y
```

Note: The full build requires Windows 10 or later.

**Problem**: Antivirus blocks the download

**Solution**: Chocolatey downloads from trusted sources (gyan.dev). Temporarily disable antivirus or add an exception for the Chocolatey directory (`C:\ProgramData\chocolatey`).

**Problem**: Upgrade fails

**Solution**: Uninstall and reinstall:

```powershell
choco uninstall ffmpeg -y
choco install ffmpeg -y
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

**Note**: FFmpeg installed in Windows is not accessible from WSL. You must install FFmpeg separately within your WSL Ubuntu environment.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg
```

The installation process is identical to native Ubuntu since WSL Ubuntu uses the same package repositories.

#### Verification

Confirm the installation succeeded:

```bash
ffmpeg -version
```

Expected output (version numbers vary by Ubuntu version):

```
ffmpeg version 6.1.1-3ubuntu5 Copyright (c) 2000-2023 the FFmpeg developers
built with gcc 13 (Ubuntu 13.2.0-23ubuntu4)
...
```

Test basic functionality:

```bash
ffprobe -version
```

#### Troubleshooting

**Problem**: Package installation fails with network errors

**Solution**: WSL may have DNS issues. Update the resolv.conf:

```bash
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: `ffplay` fails with display errors

**Solution**: `ffplay` requires a display. In WSL 2, you need WSLg (Windows 11) or an X server (Windows 10). For Windows 10:

1. Install VcXsrv or Xming on Windows
2. Export the display in WSL:

```bash
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
```

**Problem**: Need to process files on Windows filesystem

**Solution**: Access Windows files through `/mnt/c/`:

```bash
# Example: Convert a file from Windows Downloads folder
ffmpeg -i /mnt/c/Users/YourUsername/Downloads/input.mp4 /mnt/c/Users/YourUsername/Downloads/output.webm
```

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or later (64-bit)
- Git Bash installed (comes with Git for Windows)
- Internet access to download static builds

**Note**: Git Bash runs in a MinGW environment on Windows. The easiest approach is to use FFmpeg static builds that are portable and require no installation.

#### Installation Steps

**Step 1: Create a directory for FFmpeg**

Open Git Bash and run:

```bash
mkdir -p ~/bin
```

**Step 2: Download the static build**

```bash
cd /tmp
curl -L -o ffmpeg.zip https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
```

**Step 3: Extract the binaries**

```bash
unzip -q ffmpeg.zip -d /tmp/ffmpeg-extract
mv /tmp/ffmpeg-extract/ffmpeg-*/bin/*.exe ~/bin/
rm -rf /tmp/ffmpeg.zip /tmp/ffmpeg-extract
```

**Step 4: Add to PATH**

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
ffmpeg -version
```

Expected output (version numbers may vary):

```
ffmpeg version 8.0.1-essentials_build-www.gyan.dev Copyright (c) 2000-2025 the FFmpeg developers
built with gcc 14.2.0 (Rev1, Built by MSYS2 project)
...
```

Test that all tools are available:

```bash
ffprobe -version
ffplay -version
```

#### Troubleshooting

**Problem**: `ffmpeg: command not found`

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
curl -L -k -o ffmpeg.zip https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
```

**Problem**: Permission denied when moving files

**Solution**: Ensure you have write access to `~/bin`:

```bash
chmod 755 ~/bin
chmod +x ~/bin/ffmpeg.exe ~/bin/ffprobe.exe ~/bin/ffplay.exe
```

**Problem**: Path conversion issues with Windows-style paths

**Solution**: Use forward slashes and escape spaces, or use the MSYS_NO_PATHCONV environment variable:

```bash
MSYS_NO_PATHCONV=1 ffmpeg -i "C:/Users/Me/My Videos/input.mp4" output.mp4
```

---

## Post-Installation Configuration

After installing FFmpeg on any platform, consider these optional but useful configurations.

### Verifying Codec Support

Check which codecs are available in your FFmpeg build:

```bash
# List all available decoders
ffmpeg -decoders

# List all available encoders
ffmpeg -encoders

# Check for specific codec
ffmpeg -encoders | grep x264
```

### Checking Available Formats

Verify FFmpeg can handle common formats:

```bash
# List all supported formats
ffmpeg -formats

# Check for specific format support
ffmpeg -formats | grep mp4
```

### Testing Hardware Acceleration

Check available hardware acceleration methods:

```bash
ffmpeg -hwaccels
```

Common hardware accelerators:
- **macOS**: `videotoolbox` (Apple Silicon and Intel)
- **Windows**: `d3d11va`, `dxva2`, `cuda` (NVIDIA)
- **Linux**: `vaapi`, `vdpau`, `cuda` (NVIDIA)
- **Raspberry Pi**: `v4l2m2m`, `drm`

### Creating a Test Configuration

Verify your installation works with a simple test:

```bash
# Create a 5-second test video
ffmpeg -f lavfi -i testsrc=duration=5:size=640x480:rate=30 -c:v libx264 -y test_output.mp4

# Check the output file
ffprobe test_output.mp4

# Clean up
rm test_output.mp4
```

---

## Common Issues

### Issue: "Unknown encoder" or "Encoder not found"

**Symptoms**: `Unknown encoder 'libx264'` or similar errors

**Solutions**:

- Verify the encoder is included in your build:

```bash
ffmpeg -encoders | grep x264
```

- If missing, you may have a minimal FFmpeg build. Reinstall with a full build or install codec libraries.

### Issue: "No such filter" Errors

**Symptoms**: `No such filter: 'scale'` or similar

**Solutions**:

- Check available filters:

```bash
ffmpeg -filters
```

- Ensure you have a complete FFmpeg installation, not a stripped-down version.

### Issue: Very Slow Processing

**Symptoms**: Transcoding takes much longer than expected

**Solutions**:

- Use hardware acceleration if available:

```bash
# macOS (VideoToolbox)
ffmpeg -i input.mp4 -c:v h264_videotoolbox output.mp4

# Windows (NVIDIA NVENC)
ffmpeg -i input.mp4 -c:v h264_nvenc output.mp4

# Linux (VAAPI)
ffmpeg -vaapi_device /dev/dri/renderD128 -i input.mp4 -c:v h264_vaapi output.mp4
```

- Reduce quality settings for faster processing
- Use `-threads 0` to auto-detect optimal thread count

### Issue: Output File Has No Audio or Video

**Symptoms**: Resulting file is missing audio or video stream

**Solutions**:

- Check input file streams:

```bash
ffprobe -v error -show_streams input.mp4
```

- Explicitly map streams:

```bash
ffmpeg -i input.mp4 -map 0:v -map 0:a -c copy output.mp4
```

### Issue: "Permission denied" Writing Output

**Symptoms**: `output.mp4: Permission denied`

**Solutions**:

- Check write permissions on the output directory
- On Windows, ensure the file is not open in another application
- Try writing to a different location:

```bash
ffmpeg -i input.mp4 ~/Desktop/output.mp4
```

### Issue: Aspect Ratio or Resolution Problems

**Symptoms**: Output video is stretched, cropped, or wrong size

**Solutions**:

- Explicitly set output size while maintaining aspect ratio:

```bash
ffmpeg -i input.mp4 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" output.mp4
```

---

## References

- [FFmpeg Official Website](https://www.ffmpeg.org/)
- [FFmpeg Official Download Page](https://www.ffmpeg.org/download.html)
- [FFmpeg Documentation](https://www.ffmpeg.org/documentation.html)
- [FFmpeg Homebrew Formula](https://formulae.brew.sh/formula/ffmpeg)
- [FFmpeg Chocolatey Package](https://community.chocolatey.org/packages/ffmpeg)
- [FFmpeg Windows Builds (gyan.dev)](https://www.gyan.dev/ffmpeg/builds/)
- [FFmpeg Static Builds (BtbN GitHub)](https://github.com/BtbN/FFmpeg-Builds)
- [Ubuntu Packages - FFmpeg](https://packages.ubuntu.com/ffmpeg)
- [FFmpeg Wiki - Compilation Guides](https://trac.ffmpeg.org/wiki/CompilationGuide)
- [FFmpeg Hardware Acceleration](https://trac.ffmpeg.org/wiki/HWAccelIntro)
