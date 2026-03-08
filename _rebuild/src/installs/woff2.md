# Installing woff2

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `Homebrew` - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
  - `Xcode Command Line Tools` - Install via `xcode-select --install`
- **Optional:** None
- **Auto-installed:**
  - `brotli` - Compression library automatically installed by Homebrew when installing woff2

### Ubuntu (APT/Snap)
- **Required:**
  - `sudo privileges` - Required for running apt-get commands
- **Optional:** None
- **Auto-installed:**
  - All runtime dependencies are automatically handled by the APT package manager

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `sudo privileges` - Required for running apt-get commands
- **Optional:** None
- **Auto-installed:**
  - All runtime dependencies are automatically handled by the APT package manager

### Amazon Linux (DNF/YUM)
- **Required:**
  - `sudo privileges` - Required for installing build dependencies and binaries
  - `gcc-c++` - Install via `sudo dnf install -y gcc-c++` (AL2023) or `sudo yum install -y gcc-c++` (AL2)
  - `cmake` - Install via `sudo dnf install -y cmake` (AL2023) or `sudo yum install -y cmake3` (AL2)
  - `git` - Install via `sudo dnf install -y git` (AL2023) or `sudo yum install -y git` (AL2)
  - `brotli-devel` - Install via `sudo dnf install -y brotli-devel` (AL2023 only; AL2 uses bundled brotli)
- **Optional:** None
- **Auto-installed:**
  - `brotli` (bundled) - For Amazon Linux 2, brotli is included as a git submodule and compiled during the build process

### Windows (Chocolatey/winget)
- **Required:** Installation not yet supported on this platform
- **Optional:** None
- **Auto-installed:** None
- **Note:** The installer provides instructions to use WSL (Windows Subsystem for Linux) as an alternative. See the WSL section for WSL-specific dependencies.

### Git Bash (Manual/Portable)
- **Required:** Installation not yet supported on this platform
- **Optional:** None
- **Auto-installed:** None
- **Note:** The installer provides instructions to use WSL (Windows Subsystem for Linux) as an alternative, either by installing woff2 in WSL directly or by creating wrapper scripts in Git Bash that invoke WSL commands.

## Overview

woff2 is Google's reference implementation of the Web Open Font Format 2.0 (WOFF2), a modern, highly compressed container format for packaging TrueType and OpenType fonts for efficient delivery over the web. WOFF2 uses the Brotli compression algorithm to achieve significantly better compression ratios than the original WOFF 1.0 format, typically reducing font file sizes by 30% compared to WOFF 1.0 and up to 50-70% compared to uncompressed TTF/OTF fonts.

Key capabilities include:

- **Font Compression**: Convert TTF and OTF fonts to highly compressed WOFF2 format using `woff2_compress`
- **Font Decompression**: Convert WOFF2 files back to TTF format using `woff2_decompress`
- **Font Information**: Display metadata and file information using `woff2_info`
- **Brotli Compression**: Leverages Google's Brotli algorithm for superior compression ratios
- **Variable Font Support**: Full support for modern variable fonts and OpenType features

WOFF2 is the recommended format for web fonts due to its excellent browser support and compression efficiency. All modern browsers support WOFF2, making it the preferred choice for web developers optimizing font delivery.

## Prerequisites

Before installing woff2 on any platform, ensure:

1. **Internet connectivity** - Required to download packages or source code
2. **Administrative privileges** - Required for system-wide installation
3. **Sufficient disk space** - At least 100 MB for installation with dependencies (more if compiling from source)

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

Run the following command to install woff2:

```bash
brew install --quiet woff2
```

The `--quiet` flag suppresses non-essential output for cleaner automation. Homebrew automatically installs the required dependency `brotli` (the compression library) if it is not already present.

#### Verification

Confirm the installation succeeded by checking the version:

```bash
woff2_compress --version
```

Expected output (version numbers may vary):

```
woff2_compress 1.0.2
```

Test that all tools are available:

```bash
woff2_decompress --version
woff2_info --version
```

Verify the installation path:

```bash
which woff2_compress
```

Expected output: `/opt/homebrew/bin/woff2_compress` (Apple Silicon) or `/usr/local/bin/woff2_compress` (Intel).

#### Troubleshooting

**Problem**: `woff2_compress: command not found` after installation

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

**Problem**: Installation fails with permission errors

**Solution**: Fix Homebrew permissions:

```bash
sudo chown -R $(whoami) $(brew --prefix)/*
```

**Problem**: Outdated version installed

**Solution**: Update Homebrew and upgrade woff2:

```bash
brew update && brew upgrade woff2
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- At least 50 MB free disk space

#### Installation Steps

Run the following commands to update the package index and install woff2:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y woff2
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully unattended installation without prompts. The woff2 package includes three command-line utilities: `woff2_compress`, `woff2_decompress`, and `woff2_info`.

**Package versions by distribution:**

| Distribution | Version |
|--------------|---------|
| Ubuntu 24.04 (Noble) | 1.0.2-2build1 |
| Ubuntu 22.04 (Jammy) | 1.0.2-1build4 |
| Ubuntu 20.04 (Focal) | 1.0.2-1build2 |
| Debian 12 (Bookworm) | 1.0.2-2 |
| Debian 11 (Bullseye) | 1.0.2-1+b1 |

#### Verification

Confirm the installation succeeded:

```bash
woff2_compress --version
```

Expected output (version numbers may vary):

```
woff2_compress 1.0.2
```

Test that all tools are available:

```bash
woff2_decompress --version
woff2_info --version
```

Verify the installation path:

```bash
which woff2_compress
```

Expected output: `/usr/bin/woff2_compress`

#### Troubleshooting

**Problem**: `E: Unable to locate package woff2`

**Solution**: Update the package index:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

If still unavailable, verify your sources.list includes the universe repository (Ubuntu):

```bash
sudo DEBIAN_FRONTEND=noninteractive add-apt-repository -y universe
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Need to install the development libraries

**Solution**: Install the development package for linking against libwoff:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libwoff-dev
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye), 32-bit or 64-bit
- Raspberry Pi 3 or later recommended
- sudo privileges
- At least 50 MB free disk space

#### Installation Steps

Raspberry Pi OS is based on Debian, so the installation process uses APT. Run the following commands:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y woff2
```

**ARM Architecture Note**: The woff2 package is available for ARM architectures (armhf, arm64) in the Debian/Raspberry Pi OS repositories. The package is compiled natively for ARM, so no special considerations are required.

**Available ARM architectures:**

| Architecture | Description |
|--------------|-------------|
| arm64 | 64-bit Raspberry Pi OS (Pi 3, 4, 5 with 64-bit OS) |
| armhf | 32-bit Raspberry Pi OS (Pi 2, 3, 4, 5 with 32-bit OS) |

#### Verification

Confirm the installation succeeded:

```bash
woff2_compress --version
```

Expected output (version numbers may vary):

```
woff2_compress 1.0.2
```

Verify your architecture:

```bash
uname -m
```

Expected output: `aarch64` (64-bit) or `armv7l` (32-bit).

Test that all tools are available:

```bash
woff2_decompress --version
woff2_info --version
```

#### Troubleshooting

**Problem**: Package not found

**Solution**: Ensure your package lists are current:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Slow compression on older Raspberry Pi models

**Solution**: Font compression is CPU-intensive. On Raspberry Pi 2 or earlier models, expect longer processing times. Consider processing large font collections on a more powerful machine.

**Problem**: Out of memory during compression of large fonts

**Solution**: Add swap space if needed:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- Development tools for compiling from source
- At least 200 MB free disk space

**Important**: woff2 is NOT available in the standard Amazon Linux repositories or SPAL (Supplementary Packages for Amazon Linux). This guide compiles from source using the official Google codebase.

#### Installation Steps

**Step 1: Install build dependencies**

For Amazon Linux 2023:

```bash
sudo dnf install -y gcc-c++ cmake git brotli-devel
```

For Amazon Linux 2:

```bash
sudo yum install -y gcc-c++ cmake3 git
```

**Note**: Amazon Linux 2 does not have brotli-devel in its repositories. The build process will use the bundled brotli submodule.

**Step 2: Clone the source repository with submodules**

```bash
cd /tmp
git clone --recursive https://github.com/google/woff2.git
cd woff2
```

The `--recursive` flag ensures the brotli submodule is also cloned.

**Step 3: Build the tools**

For Amazon Linux 2023:

```bash
mkdir out
cd out
cmake ..
make -j$(nproc)
```

For Amazon Linux 2 (using cmake3):

```bash
mkdir out
cd out
cmake3 ..
make -j$(nproc)
```

**Step 4: Install the binaries**

```bash
sudo make install
```

This installs the binaries to `/usr/local/bin` and libraries to `/usr/local/lib64` (or `/usr/local/lib`).

**Step 5: Update the library cache**

```bash
sudo ldconfig
```

**Step 6: Clean up**

```bash
cd /
rm -rf /tmp/woff2
```

#### Verification

Confirm the installation succeeded:

```bash
woff2_compress --version
```

Expected output:

```
woff2_compress 1.0.2
```

Test that all tools are available:

```bash
woff2_decompress --version
woff2_info --version
```

#### Troubleshooting

**Problem**: `woff2_compress: command not found` after installation

**Solution**: Ensure `/usr/local/bin` is in your PATH:

```bash
echo $PATH | grep -q '/usr/local/bin' && echo "PATH OK" || echo "PATH missing /usr/local/bin"
```

If missing, add it:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: `error while loading shared libraries: libwoff2common.so.1.0.2`

**Solution**: The library path may not be configured. Run:

```bash
sudo ldconfig
```

If the issue persists, add the library path explicitly:

```bash
echo '/usr/local/lib64' | sudo tee /etc/ld.so.conf.d/woff2.conf
sudo ldconfig
```

**Problem**: CMake fails with "Could NOT find Brotli"

**Solution**: For Amazon Linux 2023, install brotli-devel:

```bash
sudo dnf install -y brotli-devel
```

For Amazon Linux 2, use the bundled brotli by cloning with `--recursive`:

```bash
git clone --recursive https://github.com/google/woff2.git
```

**Problem**: Git clone fails

**Solution**: Ensure git is installed:

```bash
sudo dnf install -y git   # AL2023
sudo yum install -y git   # AL2
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or later (64-bit)
- Administrator PowerShell or Command Prompt
- Visual Studio Build Tools or Visual Studio with C++ support
- CMake and Git

**Important**: woff2 is NOT available as a Chocolatey or winget package. This guide compiles from source using Visual Studio Build Tools. For a simpler approach, use WSL (Windows Subsystem for Linux) instead.

#### Installation Steps

**Step 1: Install build prerequisites via Chocolatey**

Run the following commands in an Administrator PowerShell:

```powershell
choco install git -y
choco install cmake --installargs 'ADD_CMAKE_TO_PATH=System' -y
choco install visualstudio2022buildtools -y --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

Close and reopen PowerShell after installation to refresh the PATH.

**Step 2: Clone the source repository**

Open a new Administrator PowerShell and run:

```powershell
cd $env:TEMP
git clone --recursive https://github.com/google/woff2.git
cd woff2
```

**Step 3: Build using CMake and Visual Studio**

```powershell
mkdir out
cd out
cmake .. -G "Visual Studio 17 2022" -A x64
cmake --build . --config Release
```

**Step 4: Install the binaries**

Copy the built executables to a directory in your PATH:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\bin"
Copy-Item ".\Release\woff2_compress.exe" "$env:USERPROFILE\bin\"
Copy-Item ".\Release\woff2_decompress.exe" "$env:USERPROFILE\bin\"
Copy-Item ".\Release\woff2_info.exe" "$env:USERPROFILE\bin\"
```

**Step 5: Add to PATH**

```powershell
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$env:USERPROFILE\bin*") {
    [Environment]::SetEnvironmentVariable("PATH", "$userPath;$env:USERPROFILE\bin", "User")
}
```

Close and reopen PowerShell to apply the PATH change.

**Step 6: Clean up**

```powershell
Remove-Item -Recurse -Force "$env:TEMP\woff2"
```

#### Verification

Open a new PowerShell window and run:

```powershell
woff2_compress --version
```

Expected output:

```
woff2_compress 1.0.2
```

Test that all tools are available:

```powershell
woff2_decompress --version
woff2_info --version
```

#### Troubleshooting

**Problem**: CMake fails to find Visual Studio

**Solution**: Ensure Visual Studio Build Tools are installed with C++ support:

```powershell
choco install visualstudio2022buildtools -y --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

**Problem**: `woff2_compress` is not recognized

**Solution**: Verify the binaries exist and PATH is set:

```powershell
Test-Path "$env:USERPROFILE\bin\woff2_compress.exe"
$env:PATH -split ';' | Select-String -Pattern 'bin'
```

Open a new PowerShell window to pick up PATH changes.

**Problem**: Build fails with linker errors

**Solution**: Ensure you are using the Release configuration:

```powershell
cmake --build . --config Release
```

**Problem**: Prefer a simpler installation method

**Solution**: Use WSL (Windows Subsystem for Linux) instead. See the WSL section below.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

**Note**: WSL provides a full Linux environment, allowing you to use the native Ubuntu package. This is the recommended approach for Windows users who want to avoid compiling from source.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y woff2
```

The installation process is identical to native Ubuntu since WSL Ubuntu uses the same package repositories.

#### Verification

Confirm the installation succeeded:

```bash
woff2_compress --version
```

Expected output (version numbers may vary):

```
woff2_compress 1.0.2
```

Test that all tools are available:

```bash
woff2_decompress --version
woff2_info --version
```

#### Troubleshooting

**Problem**: Package installation fails with network errors

**Solution**: WSL may have DNS issues. Update the resolv.conf:

```bash
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Need to process font files on Windows filesystem

**Solution**: Access Windows files through `/mnt/c/`:

```bash
# Example: Compress a font from Windows Downloads folder
woff2_compress /mnt/c/Users/YourUsername/Downloads/myfont.ttf
# Output will be /mnt/c/Users/YourUsername/Downloads/myfont.woff2
```

**Problem**: WSL itself is not installed

**Solution**: Install WSL from an Administrator PowerShell on Windows:

```powershell
wsl --install
```

Restart your computer after installation.

**Problem**: Need to use woff2 from Windows command line

**Solution**: You can call WSL commands from Windows:

```powershell
wsl woff2_compress /mnt/c/Users/YourUsername/Downloads/myfont.ttf
```

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or later (64-bit)
- Git Bash installed (comes with Git for Windows)
- WSL with Ubuntu installed (recommended approach)

**Note**: Git Bash runs in a MinGW environment on Windows. Compiling woff2 natively in MinGW is complex due to build tool requirements. The recommended approach is to use WSL from within Git Bash.

#### Installation Steps

**Recommended: Use WSL from Git Bash**

If WSL is installed with Ubuntu, you can use woff2 through WSL:

**Step 1: Install woff2 in WSL**

From Git Bash, run:

```bash
wsl sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
wsl sudo DEBIAN_FRONTEND=noninteractive apt-get install -y woff2
```

**Step 2: Create wrapper scripts**

Create wrapper scripts in Git Bash to call the WSL commands:

```bash
mkdir -p ~/bin

cat > ~/bin/woff2_compress << 'EOF'
#!/bin/bash
wsl woff2_compress "$@"
EOF
chmod +x ~/bin/woff2_compress

cat > ~/bin/woff2_decompress << 'EOF'
#!/bin/bash
wsl woff2_decompress "$@"
EOF
chmod +x ~/bin/woff2_decompress

cat > ~/bin/woff2_info << 'EOF'
#!/bin/bash
wsl woff2_info "$@"
EOF
chmod +x ~/bin/woff2_info
```

**Step 3: Add to PATH**

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
woff2_compress --version
```

Expected output (version numbers may vary):

```
woff2_compress 1.0.2
```

Test that all tools are available:

```bash
woff2_decompress --version
woff2_info --version
```

#### Troubleshooting

**Problem**: `wsl: command not found`

**Solution**: WSL is not installed or not in PATH. Install WSL from an Administrator PowerShell:

```powershell
wsl --install
```

**Problem**: Path conversion issues with Windows-style paths

**Solution**: Use WSL path format when calling the commands:

```bash
# Convert Windows path to WSL path
# Instead of: woff2_compress "C:\Users\Me\Fonts\font.ttf"
woff2_compress "/mnt/c/Users/Me/Fonts/font.ttf"
```

**Problem**: Need native Windows binaries

**Solution**: Follow the Windows (Chocolatey) section to compile from source, or use pre-built binaries if available from third-party sources.

---

## Post-Installation Configuration

After installing woff2 on any platform, review these usage examples and tips.

### Basic Usage

**Compress a TrueType font to WOFF2:**

```bash
woff2_compress myfont.ttf
# Creates myfont.woff2 in the same directory
```

**Decompress a WOFF2 font back to TrueType:**

```bash
woff2_decompress myfont.woff2
# Creates myfont.ttf in the same directory
```

**Display information about a WOFF2 file:**

```bash
woff2_info myfont.woff2
```

### Batch Processing

Convert all TTF files in a directory to WOFF2:

```bash
for f in *.ttf; do woff2_compress "$f"; done
```

Convert all OTF files (note: OTF files work the same way):

```bash
for f in *.otf; do woff2_compress "$f"; done
```

### Comparing Compression Results

Check file sizes before and after compression:

```bash
# Original file size
ls -lh myfont.ttf

# Compress
woff2_compress myfont.ttf

# Compressed file size
ls -lh myfont.woff2
```

Typical compression ratios:
- WOFF2 is typically 30% smaller than WOFF 1.0
- WOFF2 is typically 50-70% smaller than uncompressed TTF/OTF

### Integration with Build Tools

For web development projects, you can integrate woff2 into your build process:

```bash
# Example: Compress all fonts in a fonts directory
find ./fonts -name "*.ttf" -exec woff2_compress {} \;
find ./fonts -name "*.otf" -exec woff2_compress {} \;
```

---

## Common Issues

### Issue: Compression Fails with No Output

**Symptoms**: `woff2_compress` runs but no .woff2 file is created

**Solutions**:

- Verify the input file exists and is a valid TTF or OTF font:

```bash
file myfont.ttf
```

Expected output should indicate a TrueType or OpenType font.

- Check file permissions on the output directory
- Ensure sufficient disk space

### Issue: "Malformed font" or Compression Errors

**Symptoms**: woff2_compress reports font data errors

**Solutions**:

- Verify the input file is a TrueType (.ttf) or OpenType (.otf) font, not already a WOFF or WOFF2 file
- Some fonts with unusual table structures may not compress correctly
- Try using a font editor (like FontForge) to re-export the font before compression

### Issue: Large Output File Size

**Symptoms**: WOFF2 file is not significantly smaller than the original

**Solutions**:

- This can occur with already-optimized fonts or fonts with embedded bitmaps
- WOFF2 works best with vector-based fonts
- Consider subsetting the font to remove unused glyphs using tools like `pyftsubset` from fonttools

### Issue: Decompressed Font Differs from Original

**Symptoms**: Round-trip compression/decompression produces a different file

**Solutions**:

- This is expected behavior. WOFF2 normalization may reorder tables or apply other transformations
- The fonts should be visually and functionally identical
- Compare glyphs using a font comparison tool rather than file hashes

### Issue: Variable Font Support

**Symptoms**: Variable fonts fail to compress or decompress correctly

**Solutions**:

- Ensure you have woff2 version 1.0.2 or later, which includes improved variable font support
- Complex variable fonts may require the latest version from the git repository
- Check the Google woff2 GitHub issues for known limitations

### Issue: Cannot Find Shared Libraries on Linux

**Symptoms**: `error while loading shared libraries: libwoff2common.so`

**Solutions**:

- Run `sudo ldconfig` to update the library cache
- Verify the library path is configured:

```bash
echo '/usr/local/lib64' | sudo tee /etc/ld.so.conf.d/woff2.conf
sudo ldconfig
```

- Alternatively, set LD_LIBRARY_PATH:

```bash
export LD_LIBRARY_PATH="/usr/local/lib64:$LD_LIBRARY_PATH"
```

---

## References

- [Google woff2 GitHub Repository](https://github.com/google/woff2)
- [WOFF 2.0 W3C Recommendation](https://www.w3.org/TR/WOFF2/)
- [WOFF 2.0 Evaluation Report](https://www.w3.org/TR/WOFF20ER/)
- [Homebrew woff2 Formula](https://formulae.brew.sh/formula/woff2)
- [Ubuntu Packages - woff2](https://packages.ubuntu.com/woff2)
- [Debian Packages - woff2](https://packages.debian.org/woff2)
- [Fedora Packages - woff2](https://packages.fedoraproject.org/pkgs/woff2/woff2/)
- [Brotli Compression Algorithm](https://github.com/google/brotli)
- [MDN Web Docs - WOFF2](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/WOFF)
- [Can I Use - WOFF2 Browser Support](https://caniuse.com/woff2)
