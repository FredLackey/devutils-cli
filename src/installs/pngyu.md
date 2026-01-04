# Installing Pngyu

## Overview

Pngyu is a simple PNG image compression tool that provides a graphical user interface for pngquant, allowing you to batch compress multiple PNG files with drag-and-drop simplicity. It achieves significant file size reduction (often 60-80% smaller) by converting 24-bit/32-bit full-color PNG files to 8-bit indexed color using an excellent color reduction algorithm.

Key capabilities include:

- **Batch Processing**: Compress multiple PNG files simultaneously with drag-and-drop
- **Quality Control**: Adjust compression quality and color palette settings
- **Preview Function**: Review compression results before finalizing
- **pngquant Engine**: Uses the same compression engine as ImageAlpha and TinyPNG

**Important Platform Note**: Pngyu is a GUI application officially available only for macOS and Windows. For Linux distributions (Ubuntu, Raspberry Pi OS, Amazon Linux), WSL, and Git Bash environments, this guide documents the installation of pngquant, the underlying command-line tool that Pngyu wraps. pngquant provides identical compression capabilities through a terminal interface.

**Important macOS Compatibility Note**: Pngyu is not compatible with macOS 15 Sequoia and later. On these newer macOS versions, use pngquant (command-line) as the recommended alternative.

**Warning**: PNG compression with pngquant is a lossy process involving color reduction. It is impossible to restore the original image after compression. Always backup important files before compressing.

## Prerequisites

Before installing Pngyu or pngquant on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required for system-wide installation
3. **Sufficient disk space** - At least 50 MB for installation with dependencies

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) through macOS 14 (Sonoma)
- Homebrew package manager installed
- For Apple Silicon Macs: Rosetta 2 installed (Pngyu is Intel-only)

**Critical Compatibility Warning**: Pngyu does not work on macOS 15 Sequoia or later. If you are running macOS 15+, skip the Pngyu installation and install pngquant instead (see "Alternative for macOS 15+" section below).

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

For Apple Silicon Macs (M1/M2/M3/M4), install Rosetta 2:

```bash
softwareupdate --install-rosetta --agree-to-license
```

#### Installation Steps

Run the following command to install Pngyu:

```bash
brew install --cask --quiet pngyu
```

The `--quiet` flag suppresses non-essential output for cleaner automation. Pngyu requires Rosetta 2 on Apple Silicon Macs because it is built for Intel architecture.

**Alternative for macOS 15+ (Sequoia and later):**

Since Pngyu is incompatible with macOS 15 Sequoia, install pngquant directly for command-line PNG compression:

```bash
brew install --quiet pngquant
```

#### Verification

For Pngyu (macOS 14 and earlier):

```bash
ls /Applications/Pngyu.app && echo "Pngyu installed successfully"
```

Expected output:

```
/Applications/Pngyu.app
Pngyu installed successfully
```

For pngquant (all macOS versions):

```bash
pngquant --version
```

Expected output (version numbers may vary):

```
3.0.3 (January 2024)
```

#### Troubleshooting

**Problem**: `Error: Cask 'pngyu' is unavailable: disabled because it is discontinued upstream`

**Solution**: The Pngyu cask has been disabled in Homebrew. Install pngquant instead:

```bash
brew install --quiet pngquant
```

**Problem**: Pngyu crashes or fails to launch on macOS 15 Sequoia

**Solution**: Pngyu is not compatible with macOS 15. Use pngquant from the command line:

```bash
brew install --quiet pngquant
pngquant --quality=80-90 image.png
```

**Problem**: "Pngyu can't be opened because Apple cannot check it for malicious software"

**Solution**: Allow Pngyu in System Settings:

1. Open System Settings > Privacy & Security
2. Scroll down to find the message about Pngyu
3. Click "Open Anyway"

Or via command line:

```bash
xattr -d com.apple.quarantine /Applications/Pngyu.app
```

**Problem**: Pngyu is slow on Apple Silicon Mac

**Solution**: Pngyu runs through Rosetta 2 translation on Apple Silicon, which adds overhead. For better performance, use native pngquant:

```bash
brew install --quiet pngquant
pngquant --quality=80-90 --speed 1 image.png
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- At least 50 MB free disk space

**Note**: Pngyu is not available for Linux. This section installs pngquant, the command-line tool that Pngyu wraps. pngquant provides identical compression capabilities through the terminal.

#### Installation Steps

Run the following commands to install pngquant:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pngquant
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully unattended installation without prompts.

#### Verification

Confirm pngquant installed successfully:

```bash
pngquant --version
```

Expected output (version numbers may vary):

```
2.17.0 (December 2021)
```

Test compression on a sample PNG:

```bash
# Create a test PNG (requires ImageMagick, optional)
convert -size 100x100 xc:red test.png 2>/dev/null || echo "ImageMagick not installed - use existing PNG"

# Compress a PNG file (creates filename-fs8.png or filename-or8.png)
pngquant --quality=80-90 test.png 2>/dev/null && echo "pngquant working correctly"
```

#### Troubleshooting

**Problem**: `E: Unable to locate package pngquant`

**Solution**: Update the package index:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: pngquant version is outdated (version 1.x)

**Solution**: The pngquant website warns against using version 1.0 due to significant quality and compression differences. Check version and compile from source if needed:

```bash
pngquant --version
# If version is 1.x, compile from source:
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential libpng-dev
cd /tmp
git clone --recursive https://github.com/kornelski/pngquant.git
cd pngquant
make
sudo make install
```

**Problem**: Output file not created

**Solution**: By default, pngquant skips files if the output would be larger. Use `--force` to always create output:

```bash
pngquant --force --quality=80-90 image.png
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye), 32-bit or 64-bit
- Raspberry Pi 3 or later (earlier models have limited performance for image processing)
- sudo privileges
- At least 50 MB free disk space

**Note on ARM Architecture**: Raspberry Pi OS is Debian-based, and pngquant is available pre-compiled for ARM architecture. No special configuration is required.

**Note**: Pngyu is not available for Raspberry Pi. This section installs pngquant, the command-line compression tool.

#### Installation Steps

Run the following commands to install pngquant:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pngquant
```

#### Verification

Confirm the installation succeeded:

```bash
pngquant --version
```

Expected output (version numbers may vary):

```
2.17.0 (December 2021)
```

Test compression:

```bash
# Compress a PNG (replace with your actual file)
pngquant --quality=80-90 --output test-compressed.png test.png
```

#### Troubleshooting

**Problem**: Compression is very slow on Raspberry Pi

**Solution**: Use higher speed settings (1=slowest/best, 11=fastest):

```bash
pngquant --speed 10 --quality=80-90 image.png
```

**Problem**: Out of memory during batch compression

**Solution**: Process images one at a time and consider adding swap space:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Problem**: pngquant version is very old

**Solution**: Compile from source for the latest version. Install Rust first (required for pngquant 3.x):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libpng-dev
cd /tmp
git clone --recursive https://github.com/kornelski/pngquant.git
cd pngquant
cargo build --release
sudo cp target/release/pngquant /usr/local/bin/
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- At least 100 MB free disk space (includes build dependencies)

**Important**: pngquant is not available in standard Amazon Linux repositories. On Amazon Linux 2, you can enable EPEL. On Amazon Linux 2023, EPEL is not fully supported, so compilation from source is required.

**Note**: Pngyu is not available for Amazon Linux. This section installs pngquant, the command-line compression tool.

#### Installation Steps

**For Amazon Linux 2 (using EPEL):**

```bash
sudo amazon-linux-extras install epel -y
sudo yum install -y pngquant
```

**For Amazon Linux 2023 (compile from source):**

Since EPEL is not fully supported on AL2023, install build tools and compile from source:

**Step 1: Install build dependencies**

```bash
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y libpng-devel cmake git
```

**Step 2: Install Rust (required for pngquant 3.x)**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env
```

**Step 3: Clone and build pngquant**

```bash
cd /tmp
git clone --recursive https://github.com/kornelski/pngquant.git
cd pngquant
cargo build --release
sudo cp target/release/pngquant /usr/local/bin/
cd /tmp && rm -rf pngquant
```

#### Verification

Confirm the installation succeeded:

```bash
pngquant --version
```

Expected output (version numbers may vary):

```
3.0.3 (January 2024)
```

Test compression:

```bash
pngquant --quality=80-90 --output test-compressed.png test.png
```

#### Troubleshooting

**Problem**: `pngquant: command not found` after compilation

**Solution**: The installation path is `/usr/local/bin`. Ensure this directory is in your PATH:

```bash
echo $PATH | grep -q '/usr/local/bin' && echo "PATH OK" || echo "PATH missing /usr/local/bin"
```

If missing, add it:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Rust installation fails

**Solution**: Verify curl and network access, then try again:

```bash
curl --version
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```

**Problem**: Compilation fails with "libpng not found"

**Solution**: Install the libpng development package:

```bash
sudo dnf install -y libpng-devel
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

Run the following command in an Administrator PowerShell or Command Prompt to install Pngyu:

```powershell
choco install pngyu -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Alternative**: Install pngquant for command-line usage:

```powershell
choco install pngquant -y
```

#### Verification

For Pngyu GUI:

Open Windows Start menu and search for "Pngyu", or verify the installation path:

```powershell
Test-Path "$env:ProgramFiles\Pngyu\Pngyu.exe" -or Test-Path "${env:ProgramFiles(x86)}\Pngyu\Pngyu.exe"
```

For pngquant CLI (open a new terminal first):

```powershell
pngquant --version
```

Expected output:

```
3.0.3 (January 2024)
```

#### Troubleshooting

**Problem**: `pngquant: The term 'pngquant' is not recognized`

**Solution**: Open a new terminal window. Chocolatey updates PATH during installation, but existing terminals do not pick up the change. Alternatively, refresh the environment:

```powershell
refreshenv
```

**Problem**: Pngyu does not appear in Start menu

**Solution**: Chocolatey may install Pngyu to a different location. Search your system:

```powershell
Get-ChildItem -Path "C:\ProgramData\chocolatey\lib" -Filter "Pngyu.exe" -Recurse
```

**Problem**: Windows Defender blocks installation

**Solution**: Chocolatey downloads from trusted sources. Add an exception for the Chocolatey directory or temporarily disable real-time protection during installation.

**Problem**: Need to use pngquant from command line

**Solution**: If you installed Pngyu but need CLI access, install pngquant separately:

```powershell
choco install pngquant -y
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

**Note**: Pngyu is a Windows/macOS GUI application and cannot run in WSL. This section installs pngquant within your WSL Ubuntu environment for command-line PNG compression.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pngquant
```

The installation is identical to native Ubuntu since WSL Ubuntu uses the same package repositories.

#### Verification

Confirm the installation succeeded:

```bash
pngquant --version
```

Expected output:

```
2.17.0 (December 2021)
```

Test compression on a Windows file:

```bash
# Access a PNG on Windows filesystem
pngquant --quality=80-90 /mnt/c/Users/YourUsername/Pictures/image.png
```

#### Troubleshooting

**Problem**: Package installation fails with network errors

**Solution**: WSL may have DNS issues. Update resolv.conf:

```bash
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Cannot find output file after compression

**Solution**: pngquant creates output files with `-fs8.png` or `-or8.png` suffix by default. Use `--output` to specify the output filename:

```bash
pngquant --quality=80-90 --output /mnt/c/Users/YourUsername/Pictures/compressed.png /mnt/c/Users/YourUsername/Pictures/original.png
```

**Problem**: Compression is slow on files in `/mnt/c/`

**Solution**: Files accessed through `/mnt/c/` have slower I/O. Copy to Linux filesystem, compress, then copy back:

```bash
cp /mnt/c/Users/YourUsername/Pictures/image.png ~/
pngquant --quality=80-90 --output ~/compressed.png ~/image.png
cp ~/compressed.png /mnt/c/Users/YourUsername/Pictures/
```

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or later (64-bit)
- Git Bash installed (comes with Git for Windows)
- Internet access to download binaries

**Note**: Git Bash runs in a MinGW environment on Windows. This guide downloads portable pngquant Windows binaries that work directly in Git Bash.

#### Installation Steps

**Step 1: Create a directory for the tool**

Open Git Bash and run:

```bash
mkdir -p ~/bin
```

**Step 2: Download pngquant Windows binary**

```bash
cd /tmp
curl -L -o pngquant.zip "https://pngquant.org/pngquant-windows.zip"
unzip -q pngquant.zip -d /tmp/pngquant-extract
mv /tmp/pngquant-extract/pngquant.exe ~/bin/
rm -rf /tmp/pngquant.zip /tmp/pngquant-extract
```

**Step 3: Add to PATH**

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
pngquant --version
```

Expected output:

```
3.0.3 (January 2024)
```

Test with a sample compression:

```bash
pngquant --quality=80-90 --output ~/test-compressed.png ~/test.png 2>/dev/null && echo "pngquant working"
```

#### Troubleshooting

**Problem**: `pngquant: command not found`

**Solution**: Verify PATH includes `~/bin`:

```bash
echo $PATH | grep -q "$HOME/bin" && echo "PATH OK" || echo "Missing from PATH"
```

If missing, add it:

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Download fails with certificate errors

**Solution**: Update ca-certificates or use the `-k` flag (less secure):

```bash
curl -L -k -o pngquant.zip "https://pngquant.org/pngquant-windows.zip"
```

**Problem**: `unzip: command not found`

**Solution**: Git Bash may not include unzip. Use PowerShell to extract:

```bash
powershell -command "Expand-Archive -Path '/tmp/pngquant.zip' -DestinationPath '/tmp/pngquant-extract'"
```

**Problem**: Path conversion issues with Windows-style paths

**Solution**: Use forward slashes and the MSYS_NO_PATHCONV environment variable:

```bash
MSYS_NO_PATHCONV=1 pngquant "C:/Users/Me/Pictures/image.png"
```

Or use Unix-style paths:

```bash
pngquant "/c/Users/Me/Pictures/image.png"
```

---

## Post-Installation Configuration

After installing Pngyu or pngquant on any platform, consider these optional but useful configurations.

### Using Pngyu GUI (macOS/Windows)

1. Launch Pngyu from Applications (macOS) or Start Menu (Windows)
2. Drag and drop PNG files into the "Drop here" area
3. Adjust compression settings in Output Options and Compress Options
4. Use the preview feature to verify quality before compressing
5. Click "Compress Start" to process files

### Basic pngquant Command-Line Usage

**Compress a single PNG file:**

```bash
pngquant --quality=80-90 image.png
```

This creates `image-fs8.png` (Floyd-Steinberg dithering) or `image-or8.png` (ordered dithering).

**Compress with custom output filename:**

```bash
pngquant --quality=80-90 --output compressed.png image.png
```

**Compress and overwrite original (use with caution):**

```bash
pngquant --quality=80-90 --force --ext .png image.png
```

**Quality settings explained:**
- `--quality=min-max`: Sets minimum and maximum quality (0-100)
- Lower minimum = smaller files but potentially visible quality loss
- Recommended: `--quality=80-90` for web images, `--quality=90-100` for high quality

### Batch Processing

**Compress all PNGs in a directory (Linux/macOS/WSL/Git Bash):**

```bash
find . -name "*.png" -exec pngquant --quality=80-90 --force --ext .png {} \;
```

**Compress with parallel processing for speed:**

```bash
find . -name "*.png" -print0 | xargs -0 -P 4 -I {} pngquant --quality=80-90 --force --ext .png {}
```

### Creating Shell Aliases

Add these to your `~/.bashrc` or `~/.zshrc` for convenience:

```bash
# Quick PNG compression (web quality)
alias pngweb='pngquant --quality=80-90 --force --ext .png'

# Quick PNG compression (high quality)
alias pnghq='pngquant --quality=90-100 --force --ext .png'

# Compress all PNGs in current directory
alias pngall='find . -name "*.png" -exec pngquant --quality=80-90 --force --ext .png {} \;'
```

---

## Common Issues

### Issue: "File not changed" or No Size Reduction

**Symptoms**: pngquant reports the file was skipped or output is same size

**Solutions**:

- The file may already be optimized or is smaller than 8-bit can represent
- Use `--force` to always create output even if larger
- Try lower quality settings:

```bash
pngquant --quality=60-80 --force image.png
```

### Issue: Quality Loss is Too Visible

**Symptoms**: Compressed images show noticeable banding or color shifts

**Solutions**:

- Increase minimum quality setting:

```bash
pngquant --quality=90-100 image.png
```

- pngquant compression is lossy and may not be suitable for all images
- Consider lossless optimization with optipng instead:

```bash
optipng -o2 image.png  # Lossless, smaller size reduction
```

### Issue: Output File Has Different Name

**Symptoms**: Original file unchanged, new file created with `-fs8.png` suffix

**Solutions**:

- This is default behavior to prevent accidental data loss
- To overwrite original file (backup first!):

```bash
pngquant --force --ext .png image.png
```

- To specify custom output name:

```bash
pngquant --output compressed.png image.png
```

### Issue: Command Not Found After Installation

**Symptoms**: Terminal cannot find pngquant command

**Solutions**:

- Open a new terminal window to refresh PATH
- Verify installation location:

```bash
which pngquant
type pngquant
```

- On macOS, ensure Homebrew is in PATH:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"  # Apple Silicon
eval "$(/usr/local/bin/brew shellenv)"     # Intel
```

### Issue: Permission Denied Errors

**Symptoms**: Cannot write output file or access source file

**Solutions**:

- Check file permissions:

```bash
ls -la image.png
```

- Ensure you have write access to the directory:

```bash
chmod 644 image.png
chmod 755 .
```

- On Windows, ensure the file is not open in another application

---

## References

- [Pngyu Official Website](https://nukesaq88.github.io/Pngyu/)
- [Pngyu GitHub Repository](https://github.com/nukesaq88/Pngyu)
- [Pngyu Homebrew Cask](https://formulae.brew.sh/cask/pngyu)
- [Pngyu Chocolatey Package](https://community.chocolatey.org/packages/pngyu)
- [pngquant Official Website](https://pngquant.org/)
- [pngquant GitHub Repository](https://github.com/kornelski/pngquant)
- [pngquant Installation Guide](https://pngquant.org/install.html)
- [pngquant Homebrew Formula](https://formulae.brew.sh/formula/pngquant)
- [pngquant Chocolatey Package](https://community.chocolatey.org/packages/pngquant)
- [pngquant Ubuntu Package](https://packages.ubuntu.com/search?keywords=pngquant)
- [PNGpng - Pngyu Alternative for macOS 15 Sequoia](https://i-icc.github.io/png-png/en.html)
