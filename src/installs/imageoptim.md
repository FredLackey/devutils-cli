# Installing ImageOptim

## Overview

ImageOptim is a powerful image optimization tool that reduces file sizes of PNG, JPEG, GIF, and SVG images through lossless compression. It integrates multiple optimization engines including OptiPNG, PNGCrush, Zopfli, JPEGOptim, Jpegtran, Guetzli, Gifsicle, SVGO, and MozJPEG to achieve maximum compression without quality loss. EXIF metadata and other unnecessary data are removed to further reduce file sizes.

Key capabilities include:

- **Lossless Compression**: Reduces file sizes without visible quality loss
- **Multiple Format Support**: Optimizes PNG, JPEG, GIF, and SVG files
- **Batch Processing**: Process multiple images simultaneously
- **Metadata Removal**: Strips EXIF data, color profiles, and comments
- **Automation Ready**: Command-line interface available for scripting

**Important Platform Note**: ImageOptim is a macOS-only GUI application. For Linux, Windows, WSL, and Git Bash environments, this guide documents equivalent command-line tools (optipng, jpegoptim) and alternative applications (Trimage, FileOptimizer) that provide similar functionality using many of the same underlying optimization engines.

## Prerequisites

Before installing image optimization tools on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required for system-wide installation
3. **Sufficient disk space** - At least 100 MB for installation with dependencies

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
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

Run the following command to install ImageOptim:

```bash
brew install --cask --quiet imageoptim
```

The `--quiet` flag suppresses non-essential output for cleaner automation. This installs the native macOS GUI application ImageOptim, which is Apple Silicon and Intel compatible.

**Optional**: Install the ImageOptim-CLI for command-line integration and automation:

```bash
brew install --quiet imageoptim-cli
```

ImageOptim-CLI enables batch processing from the terminal and integrates with build systems.

#### Verification

Confirm the GUI application installed successfully:

```bash
ls /Applications/ImageOptim.app && echo "ImageOptim installed successfully"
```

Expected output:

```
/Applications/ImageOptim.app
ImageOptim installed successfully
```

If you installed imageoptim-cli, verify it:

```bash
imageoptim --version
```

Expected output (version numbers may vary):

```
3.1.9
```

#### Troubleshooting

**Problem**: `brew install --cask` fails with "Cask 'imageoptim' is unavailable"

**Solution**: Update Homebrew to refresh the cask list:

```bash
brew update
brew install --cask --quiet imageoptim
```

**Problem**: ImageOptim does not appear in Applications folder

**Solution**: Homebrew casks install to `/Applications` by default. Check if the installation path differs:

```bash
brew info --cask imageoptim | grep "Installed"
```

**Problem**: ImageOptim fails to launch on Apple Silicon Mac

**Solution**: ImageOptim is native Apple Silicon. If issues persist, try reinstalling:

```bash
brew uninstall --cask imageoptim
brew install --cask --quiet imageoptim
```

**Problem**: `imageoptim` command not found after installing CLI

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

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- At least 100 MB free disk space

**Note**: ImageOptim is macOS-only. On Ubuntu/Debian, use the command-line tools `optipng` and `jpegoptim`, which are the same engines ImageOptim uses internally. For a GUI alternative, Trimage provides a similar interface.

#### Installation Steps

Run the following commands to install the image optimization tools:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y optipng jpegoptim gifsicle
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully unattended installation without prompts.

**Optional**: Install Trimage for a GUI interface similar to ImageOptim:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y trimage
```

Trimage uses optipng, pngcrush, advpng, and jpegoptim under the hood and provides drag-and-drop functionality.

#### Verification

Confirm the command-line tools installed successfully:

```bash
optipng --version
```

Expected output (version numbers may vary):

```
OptiPNG version 0.7.7
```

```bash
jpegoptim --version
```

Expected output:

```
jpegoptim v1.5.0
```

```bash
gifsicle --version
```

Expected output:

```
LCDF Gifsicle 1.93
```

If you installed Trimage, launch it from the terminal:

```bash
trimage --help
```

#### Troubleshooting

**Problem**: `E: Unable to locate package optipng`

**Solution**: Update the package index:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Trimage crashes on launch or shows blank window

**Solution**: Reinstall Trimage and its dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y trimage
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y trimage
```

**Problem**: Need additional PNG optimization tools

**Solution**: Install pngquant for lossy PNG compression (reduces file size further with minimal quality loss):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pngquant
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye), 32-bit or 64-bit
- Raspberry Pi 3 or later (earlier models have limited performance)
- sudo privileges
- At least 100 MB free disk space

**Note on ARM Architecture**: Raspberry Pi OS is Debian-based, and all optimization tools are available pre-compiled for ARM architecture. No special configuration is required.

#### Installation Steps

Run the following commands to update the package index and install image optimization tools:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y optipng jpegoptim gifsicle
```

**Optional**: Install Trimage for a GUI interface:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y trimage
```

**Note**: Trimage requires a desktop environment. If running Raspberry Pi OS Lite (headless), skip Trimage and use the command-line tools only.

#### Verification

Confirm the installation succeeded:

```bash
optipng --version
```

Expected output (version numbers may vary):

```
OptiPNG version 0.7.7
```

```bash
jpegoptim --version
```

Expected output:

```
jpegoptim v1.5.0
```

Test optimization on a sample image:

```bash
# Create a test PNG
convert -size 100x100 xc:red test.png 2>/dev/null || echo "ImageMagick not installed - skip test file creation"

# If you have a PNG file, optimize it
optipng -o2 -strip all test.png 2>/dev/null && echo "optipng working correctly"
```

#### Troubleshooting

**Problem**: Optimization is very slow on Raspberry Pi

**Solution**: Use lower optimization levels for faster processing:

```bash
# Use -o2 instead of -o7 for faster PNG optimization
optipng -o2 image.png

# Skip progressive encoding for faster JPEG processing
jpegoptim --strip-all image.jpg
```

**Problem**: Out of memory during batch optimization

**Solution**: Process images one at a time or add swap space:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Problem**: `trimage` command not found after installation

**Solution**: On Raspberry Pi OS Lite without a desktop, Trimage may not install correctly. Use the command-line tools instead:

```bash
# Optimize all PNGs in current directory
find . -name "*.png" -exec optipng -o2 {} \;

# Optimize all JPEGs in current directory
find . -name "*.jpg" -exec jpegoptim --strip-all {} \;
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- At least 200 MB free disk space (includes build dependencies for compilation)

**Important**: optipng and jpegoptim are not available in standard Amazon Linux repositories. On Amazon Linux 2, you can enable EPEL. On Amazon Linux 2023, EPEL is not supported, so you must compile from source or use the Supplementary Packages for Amazon Linux (SPAL).

#### Installation Steps

**For Amazon Linux 2 (using EPEL):**

```bash
sudo amazon-linux-extras install epel -y
sudo yum install -y optipng jpegoptim gifsicle
```

**For Amazon Linux 2023 (compile from source):**

Since EPEL is not supported on AL2023, install development tools and compile from source:

**Step 1: Install build dependencies**

```bash
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y zlib-devel libjpeg-turbo-devel
```

**Step 2: Install optipng from source**

```bash
cd /tmp
curl -L -o optipng.tar.gz https://sourceforge.net/projects/optipng/files/OptiPNG/optipng-0.7.8/optipng-0.7.8.tar.gz/download
tar -xzf optipng.tar.gz
cd optipng-0.7.8
./configure
make
sudo make install
cd /tmp && rm -rf optipng-0.7.8 optipng.tar.gz
```

**Step 3: Install jpegoptim from source**

```bash
cd /tmp
curl -L -o jpegoptim.tar.gz https://github.com/tjko/jpegoptim/archive/refs/tags/v1.5.5.tar.gz
tar -xzf jpegoptim.tar.gz
cd jpegoptim-1.5.5
./configure
make
sudo make install
cd /tmp && rm -rf jpegoptim-1.5.5 jpegoptim.tar.gz
```

**Step 4: Install gifsicle (optional, for GIF optimization)**

```bash
cd /tmp
curl -L -o gifsicle.tar.gz https://www.lcdf.org/gifsicle/gifsicle-1.94.tar.gz
tar -xzf gifsicle.tar.gz
cd gifsicle-1.94
./configure
make
sudo make install
cd /tmp && rm -rf gifsicle-1.94 gifsicle.tar.gz
```

#### Verification

Confirm the installation succeeded:

```bash
optipng --version
```

Expected output:

```
OptiPNG version 0.7.8
```

```bash
jpegoptim --version
```

Expected output:

```
jpegoptim v1.5.5
```

```bash
gifsicle --version
```

Expected output:

```
LCDF Gifsicle 1.94
```

#### Troubleshooting

**Problem**: `optipng: command not found` after compilation

**Solution**: The default installation path is `/usr/local/bin`. Ensure this directory is in your PATH:

```bash
echo $PATH | grep -q '/usr/local/bin' && echo "PATH OK" || echo "PATH missing /usr/local/bin"
```

If missing, add it:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Compilation fails with missing zlib.h

**Solution**: Install the zlib development package:

```bash
sudo dnf install -y zlib-devel
```

**Problem**: jpegoptim compilation fails with missing jpeglib.h

**Solution**: Install the libjpeg development package:

```bash
sudo dnf install -y libjpeg-turbo-devel
```

**Problem**: Need to uninstall compiled tools

**Solution**: Navigate to each source directory and run:

```bash
sudo make uninstall
```

Or manually remove the binaries:

```bash
sudo rm /usr/local/bin/optipng /usr/local/bin/jpegoptim /usr/local/bin/gifsicle
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

**Note**: ImageOptim is macOS-only. On Windows, use FileOptimizer for a GUI alternative, or install optipng and jpegoptim command-line tools.

#### Installation Steps

Run the following commands in an Administrator PowerShell or Command Prompt to install FileOptimizer (GUI) and command-line tools:

**Option A: Install FileOptimizer (GUI - recommended for desktop use)**

```powershell
choco install fileoptimizer -y
```

FileOptimizer is a comprehensive file optimization tool that supports images (PNG, JPEG, GIF, BMP, TIFF), PDFs, and many other formats. It uses many of the same optimization engines as ImageOptim.

**Option B: Install command-line tools (for scripting and automation)**

```powershell
choco install optipng jpegoptim -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

#### Verification

Open a new PowerShell or Command Prompt window (to refresh PATH), then verify the installations:

For FileOptimizer:

```powershell
where FileOptimizer64.exe
```

Expected output:

```
C:\Program Files\FileOptimizer\FileOptimizer64.exe
```

For command-line tools:

```powershell
optipng --version
```

Expected output:

```
OptiPNG version 7.9.1
```

```powershell
jpegoptim --version
```

Expected output:

```
jpegoptim v1.5.5
```

#### Troubleshooting

**Problem**: `optipng: The term 'optipng' is not recognized`

**Solution**: Open a new terminal window. Chocolatey updates PATH during installation, but existing terminals do not pick up the change. Alternatively, refresh the environment:

```powershell
refreshenv
```

**Problem**: FileOptimizer does not appear in Start menu

**Solution**: Chocolatey installs FileOptimizer to `C:\Program Files\FileOptimizer\`. Launch it directly:

```powershell
& "C:\Program Files\FileOptimizer\FileOptimizer64.exe"
```

**Problem**: Need to run FileOptimizer from command line for automation

**Solution**: FileOptimizer supports command-line operation:

```powershell
& "C:\Program Files\FileOptimizer\FileOptimizer64.exe" "C:\path\to\image.png"
```

For batch processing:

```powershell
Get-ChildItem -Path "C:\images" -Filter "*.png" | ForEach-Object { & "C:\Program Files\FileOptimizer\FileOptimizer64.exe" $_.FullName }
```

**Problem**: Antivirus blocks installation

**Solution**: Chocolatey downloads from trusted sources. Temporarily disable antivirus or add an exception for the Chocolatey directory (`C:\ProgramData\chocolatey`).

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

**Note**: Image optimization tools installed in Windows are not accessible from WSL. You must install them separately within your WSL Ubuntu environment. The installation process is identical to native Ubuntu.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y optipng jpegoptim gifsicle
```

The installation is identical to native Ubuntu since WSL Ubuntu uses the same package repositories.

**Optional**: Install Trimage if you have WSLg (Windows 11) or an X server configured:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y trimage
```

#### Verification

Confirm the installation succeeded:

```bash
optipng --version
```

Expected output:

```
OptiPNG version 0.7.7
```

```bash
jpegoptim --version
```

Expected output:

```
jpegoptim v1.5.0
```

Test optimization on a sample image:

```bash
# Create a test image and optimize it
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test.png
optipng -o2 test.png
rm test.png
```

#### Troubleshooting

**Problem**: Package installation fails with network errors

**Solution**: WSL may have DNS issues. Update the resolv.conf:

```bash
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Trimage fails to launch with display errors

**Solution**: Trimage requires a graphical environment. On Windows 11 with WSLg, it should work automatically. On Windows 10, you need an X server:

1. Install VcXsrv or Xming on Windows
2. Export the display in WSL:

```bash
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
```

**Problem**: Need to process files on Windows filesystem

**Solution**: Access Windows files through `/mnt/c/`:

```bash
# Optimize all PNGs in Windows Downloads folder
find /mnt/c/Users/YourUsername/Downloads -name "*.png" -exec optipng -o2 {} \;

# Optimize all JPEGs in Windows Documents folder
find /mnt/c/Users/YourUsername/Documents -name "*.jpg" -exec jpegoptim --strip-all {} \;
```

**Problem**: Optimization is slow on files stored in Windows filesystem

**Solution**: Files accessed through `/mnt/c/` have slower I/O due to filesystem translation. For best performance, copy files to the Linux filesystem, optimize, then copy back:

```bash
cp /mnt/c/Users/YourUsername/image.png ~/
optipng -o7 ~/image.png
cp ~/image.png /mnt/c/Users/YourUsername/
```

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or later (64-bit)
- Git Bash installed (comes with Git for Windows)
- Internet access to download binaries

**Note**: Git Bash runs in a MinGW environment on Windows. This guide uses portable Windows binaries that can be run directly from Git Bash without installation.

#### Installation Steps

**Step 1: Create a directory for the tools**

Open Git Bash and run:

```bash
mkdir -p ~/bin
```

**Step 2: Download optipng Windows binary**

```bash
cd /tmp
curl -L -o optipng.zip "https://sourceforge.net/projects/optipng/files/OptiPNG/optipng-0.7.8/optipng-0.7.8-win64.zip/download"
unzip -q optipng.zip -d /tmp/optipng-extract
mv /tmp/optipng-extract/optipng-0.7.8-win64/optipng.exe ~/bin/
rm -rf /tmp/optipng.zip /tmp/optipng-extract
```

**Step 3: Download jpegoptim Windows binary**

```bash
cd /tmp
curl -L -o jpegoptim.zip "https://github.com/XhmikosR/jpegoptim-windows/releases/download/1.5.5-rel1/jpegoptim-1.5.5-rel1-win64-msvc-2022-mozjpeg331-static-ltcg.zip"
unzip -q jpegoptim.zip -d /tmp/jpegoptim-extract
mv /tmp/jpegoptim-extract/jpegoptim.exe ~/bin/
rm -rf /tmp/jpegoptim.zip /tmp/jpegoptim-extract
```

**Step 4: Add to PATH**

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
optipng --version
```

Expected output:

```
OptiPNG version 0.7.8
```

```bash
jpegoptim --version
```

Expected output:

```
jpegoptim v1.5.5  (build  20230627)
```

Test with a sample optimization:

```bash
# If you have a PNG file
optipng -o2 ~/test.png 2>/dev/null && echo "optipng working"

# If you have a JPEG file
jpegoptim --strip-all ~/test.jpg 2>/dev/null && echo "jpegoptim working"
```

#### Troubleshooting

**Problem**: `optipng: command not found`

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
curl -L -k -o optipng.zip "https://sourceforge.net/projects/optipng/files/OptiPNG/optipng-0.7.8/optipng-0.7.8-win64.zip/download"
```

**Problem**: `unzip` command not found

**Solution**: Git Bash may not include unzip. Install it via Chocolatey in Windows, or extract manually:

```bash
# Use PowerShell to extract
powershell -command "Expand-Archive -Path '/tmp/optipng.zip' -DestinationPath '/tmp/optipng-extract'"
```

**Problem**: Path conversion issues with Windows-style paths

**Solution**: Use forward slashes and the MSYS_NO_PATHCONV environment variable:

```bash
MSYS_NO_PATHCONV=1 optipng "C:/Users/Me/My Images/photo.png"
```

Or use Unix-style paths:

```bash
optipng "/c/Users/Me/My Images/photo.png"
```

**Problem**: Permission denied when moving files

**Solution**: Ensure you have write access to `~/bin`:

```bash
chmod 755 ~/bin
chmod +x ~/bin/optipng.exe ~/bin/jpegoptim.exe
```

---

## Post-Installation Configuration

After installing image optimization tools on any platform, consider these optional but useful configurations.

### Basic Usage Examples

**Optimize a single PNG file:**

```bash
optipng -o2 image.png
```

Optimization levels range from -o0 (fastest, least compression) to -o7 (slowest, best compression). Level -o2 provides a good balance.

**Optimize a single JPEG file:**

```bash
jpegoptim --strip-all image.jpg
```

The `--strip-all` flag removes all metadata including EXIF data, comments, and color profiles.

**Optimize a GIF file:**

```bash
gifsicle -O3 --colors 256 input.gif -o output.gif
```

### Batch Processing

**Optimize all PNGs in a directory (Linux/macOS/WSL/Git Bash):**

```bash
find . -name "*.png" -exec optipng -o2 {} \;
```

**Optimize all JPEGs in a directory:**

```bash
find . -name "*.jpg" -exec jpegoptim --strip-all {} \;
find . -name "*.jpeg" -exec jpegoptim --strip-all {} \;
```

**Optimize all images recursively:**

```bash
find . \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -exec sh -c '
  case "$1" in
    *.png) optipng -o2 "$1" ;;
    *.jpg|*.jpeg) jpegoptim --strip-all "$1" ;;
  esac
' _ {} \;
```

### Creating Shell Aliases

Add these to your `~/.bashrc` or `~/.zshrc` for convenience:

```bash
# Optimize all images in current directory
alias imgopt='find . -name "*.png" -exec optipng -o2 {} \; && find . -name "*.jpg" -exec jpegoptim --strip-all {} \;'

# Quick PNG optimization
alias pngopt='optipng -o2'

# Quick JPEG optimization
alias jpgopt='jpegoptim --strip-all'
```

### macOS ImageOptim CLI Integration

If using ImageOptim-CLI on macOS, you can integrate it with your workflow:

```bash
# Optimize images using ImageOptim app
imageoptim ~/Pictures/*.png

# Optimize with ImageAlpha for better PNG compression
imageoptim --imagealpha ~/Pictures/*.png

# Optimize entire directory
imageoptim ~/Pictures/
```

---

## Common Issues

### Issue: "File not changed" or No Size Reduction

**Symptoms**: optipng or jpegoptim reports the file was not modified

**Solutions**:

- The file is already optimally compressed
- Try higher optimization levels:

```bash
optipng -o7 image.png
jpegoptim -m85 --strip-all image.jpg  # Lossy compression for more savings
```

- For PNGs, try pngquant for lossy compression:

```bash
pngquant --quality=80-90 --skip-if-larger image.png
```

### Issue: Optimization Corrupts Image

**Symptoms**: Image appears damaged or fails to open after optimization

**Solutions**:

- Always keep backups before batch optimization
- Verify tool versions are up to date
- Test with a single file before batch processing:

```bash
cp original.png backup.png
optipng -o2 original.png
# Verify original.png opens correctly before continuing
```

### Issue: Very Slow Optimization

**Symptoms**: Optimization takes a long time

**Solutions**:

- Use lower optimization levels for faster processing:

```bash
optipng -o1 image.png  # Fast
jpegoptim --strip-all image.jpg  # Already fast
```

- Process files in parallel (Linux/macOS):

```bash
find . -name "*.png" -print0 | xargs -0 -P 4 -I {} optipng -o2 {}
```

### Issue: Command Not Found After Installation

**Symptoms**: Terminal cannot find optipng, jpegoptim, or imageoptim commands

**Solutions**:

- Open a new terminal window to refresh PATH
- Verify installation location:

```bash
which optipng
which jpegoptim
```

- On macOS, ensure Homebrew is in PATH:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"  # Apple Silicon
eval "$(/usr/local/bin/brew shellenv)"     # Intel
```

### Issue: Permission Denied Errors

**Symptoms**: Cannot write optimized file or access source file

**Solutions**:

- Check file permissions:

```bash
ls -la image.png
```

- Ensure you own the file or have write access:

```bash
chmod 644 image.png
```

- On Windows, ensure the file is not open in another application

---

## References

- [ImageOptim Official Website](https://imageoptim.com/mac)
- [ImageOptim Homebrew Cask](https://formulae.brew.sh/cask/imageoptim)
- [ImageOptim-CLI GitHub](https://github.com/JamieMason/ImageOptim-CLI)
- [ImageOptim-CLI Homebrew Formula](https://formulae.brew.sh/formula/imageoptim-cli)
- [ImageOptim Alternatives for Windows and Linux](https://imageoptim.com/versions.html)
- [OptiPNG Official Website](https://optipng.sourceforge.net/)
- [OptiPNG SourceForge Downloads](https://sourceforge.net/projects/optipng/)
- [OptiPNG Chocolatey Package](https://community.chocolatey.org/packages/OptiPNG)
- [jpegoptim GitHub Repository](https://github.com/tjko/jpegoptim)
- [jpegoptim Windows Builds](https://github.com/XhmikosR/jpegoptim-windows)
- [jpegoptim Chocolatey Package](https://community.chocolatey.org/packages/jpegoptim)
- [Trimage Official Website](https://trimage.org/)
- [FileOptimizer Official Website](https://nikkhokkho.sourceforge.io/?page=FileOptimizer)
- [FileOptimizer Chocolatey Package](https://community.chocolatey.org/packages/FileOptimizer)
- [Gifsicle Official Website](https://www.lcdf.org/gifsicle/)
