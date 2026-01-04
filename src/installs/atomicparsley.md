# Installing AtomicParsley

## Overview

AtomicParsley is a lightweight command-line program for reading, parsing, and setting metadata into MPEG-4 files. It specializes in iTunes-style metadata for .mp4, .m4a, .m4p, .m4v, and .m4b files, as well as 3GPP-style assets in 3GP files. AtomicParsley is commonly used alongside media download tools like yt-dlp to automatically embed metadata, artwork, and chapter information into downloaded media files.

**Key Features:**
- Read and write iTunes-style metadata tags
- Embed artwork (cover art) into media files
- Set chapter markers and other MPEG-4 atom data
- Support for 3GPP metadata in 3GP files
- Lightweight and fast with minimal dependencies

## Prerequisites

Before installing AtomicParsley, ensure you have:

1. **Administrator Access**: Required for installation on all platforms
2. **Package Manager**: The appropriate package manager for your platform must be installed:
   - macOS: Homebrew
   - Ubuntu/Debian: APT (pre-installed)
   - Raspberry Pi OS: APT (pre-installed)
   - Amazon Linux: DNF or YUM (pre-installed)
   - Windows: Chocolatey or winget

---

## Platform-Specific Installation

### macOS (Homebrew)

AtomicParsley is available as a Homebrew formula and can be installed with a single command.

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- 64-bit processor (Intel or Apple Silicon)

Verify Homebrew is installed:

```bash
brew --version
```

If Homebrew is not installed, install it first using `dev install homebrew`.

#### Installation Steps

Run the following command to install AtomicParsley:

```bash
brew install --quiet atomicparsley
```

**Explanation of flags:**
- `--quiet`: Suppresses output for non-interactive installation

The installation downloads the AtomicParsley binary and places it in `/opt/homebrew/bin/` (Apple Silicon) or `/usr/local/bin/` (Intel).

#### Verification

Confirm the installation succeeded:

```bash
AtomicParsley --version
```

Expected output format:

```
AtomicParsley version: 20240608.083822.1ed9031
```

You can also verify by checking the Homebrew list:

```bash
brew list | grep atomicparsley
```

#### Troubleshooting

**Installation fails with permission errors:**

```bash
# Reset Homebrew cache and retry
brew cleanup
brew install --quiet atomicparsley
```

**Command not found after installation:**

Ensure Homebrew's bin directory is in your PATH:

```bash
# For Apple Silicon
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc

# For Intel
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

**Upgrade to latest version:**

```bash
brew upgrade atomicparsley
```

---

### Ubuntu/Debian (APT)

AtomicParsley is available in the Ubuntu universe repository and can be installed directly using APT.

#### Prerequisites

- Ubuntu 20.04 (Focal) or later / Debian 10 (Buster) or later
- Universe repository enabled (enabled by default on most Ubuntu installations)
- sudo privileges

#### Installation Steps

Run the following commands to install AtomicParsley:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y atomicparsley
```

**Explanation of flags:**
- `DEBIAN_FRONTEND=noninteractive`: Prevents any interactive prompts
- `-y`: Automatically answers "yes" to confirmation prompts

The installation places the AtomicParsley binary at `/usr/bin/AtomicParsley`.

**Note:** The package version in Ubuntu repositories may lag behind the latest GitHub release. Ubuntu 24.04 includes version `20210715.151551.e7ad03a`, while the latest release is `20240608.083822.1ed9031`.

#### Verification

Confirm the installation succeeded:

```bash
AtomicParsley --version
```

**Important:** The executable uses mixed case naming (`AtomicParsley`), not all lowercase.

You can also verify via dpkg:

```bash
dpkg -l | grep atomicparsley
```

#### Troubleshooting

**Package not found:**

Ensure the universe repository is enabled:

```bash
sudo DEBIAN_FRONTEND=noninteractive add-apt-repository -y universe
sudo DEBIAN_FRONTEND=noninteractive apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y atomicparsley
```

**Need the latest version (build from source):**

If you require the latest version, build from source:

```bash
# Install build dependencies
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y cmake make g++ zlib1g-dev git

# Clone the repository
git clone https://github.com/wez/atomicparsley.git /tmp/atomicparsley
cd /tmp/atomicparsley

# Build
cmake .
cmake --build . --config Release

# Install
sudo mv AtomicParsley /usr/local/bin/
sudo chmod +x /usr/local/bin/AtomicParsley

# Cleanup
cd ~ && rm -rf /tmp/atomicparsley
```

---

### Raspberry Pi OS (APT)

AtomicParsley is available in the Raspberry Pi OS repositories and supports ARM architecture natively.

#### Prerequisites

- Raspberry Pi OS (Bullseye or later recommended)
- sudo privileges
- ARM 32-bit (armhf) or 64-bit (arm64) architecture

#### Installation Steps

Run the following commands to install AtomicParsley:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y atomicparsley
```

**Explanation of flags:**
- `DEBIAN_FRONTEND=noninteractive`: Prevents any interactive prompts
- `-y`: Automatically answers "yes" to confirmation prompts

#### ARM-Specific Considerations

The AtomicParsley package in the Raspberry Pi OS repositories is compiled for ARM architecture and works on both 32-bit and 64-bit Raspberry Pi devices:

- Raspberry Pi 2, 3, 4 (32-bit OS): Uses `armhf` package
- Raspberry Pi 3, 4, 5 (64-bit OS): Uses `arm64` package

The package manager automatically selects the correct architecture.

#### Verification

Confirm the installation succeeded:

```bash
AtomicParsley --version
```

You can also verify the package is installed:

```bash
dpkg -l | grep atomicparsley
```

#### Troubleshooting

**Disk space issues:**

If installation fails due to low disk space (common on Raspberry Pi), clean up first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get clean
sudo DEBIAN_FRONTEND=noninteractive apt-get autoclean
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y atomicparsley
```

**Need the latest version (build from source):**

Build from source on Raspberry Pi:

```bash
# Install build dependencies
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y cmake make g++ zlib1g-dev git

# Clone the repository
git clone https://github.com/wez/atomicparsley.git /tmp/atomicparsley
cd /tmp/atomicparsley

# Build (may take several minutes on Raspberry Pi)
cmake .
cmake --build . --config Release

# Install
sudo mv AtomicParsley /usr/local/bin/
sudo chmod +x /usr/local/bin/AtomicParsley

# Cleanup
cd ~ && rm -rf /tmp/atomicparsley
```

**Note:** Building from source on Raspberry Pi can take 5-10 minutes depending on the model.

---

### Amazon Linux/RHEL (YUM/DNF)

AtomicParsley is not available in the default Amazon Linux or RHEL repositories, but can be installed from EPEL (Extra Packages for Enterprise Linux) or built from source.

#### Prerequisites

- Amazon Linux 2, Amazon Linux 2023, RHEL 7/8/9, or compatible
- sudo privileges
- EPEL repository access (for Amazon Linux 2 / RHEL 7/8)

#### Installation Steps

**For Amazon Linux 2 / RHEL 7/8 (using EPEL):**

```bash
# Enable EPEL repository
sudo yum install -y epel-release

# Install AtomicParsley
sudo yum install -y AtomicParsley
```

**For Amazon Linux 2023 / RHEL 9 / Fedora (build from source):**

Amazon Linux 2023 does not support EPEL, so build from source:

```bash
# Install build dependencies
sudo dnf install -y cmake make gcc-c++ zlib-devel git

# Clone the repository
git clone https://github.com/wez/atomicparsley.git /tmp/atomicparsley
cd /tmp/atomicparsley

# Build
cmake .
cmake --build . --config Release

# Install
sudo mv AtomicParsley /usr/local/bin/
sudo chmod +x /usr/local/bin/AtomicParsley

# Cleanup
cd ~ && rm -rf /tmp/atomicparsley
```

**Explanation of flags:**
- `-y`: Automatically answers "yes" to all prompts

#### Verification

Confirm the installation succeeded:

```bash
AtomicParsley --version
```

For EPEL installations, you can also verify via yum:

```bash
yum list installed | grep -i atomicparsley
```

#### Troubleshooting

**EPEL repository not available:**

Install EPEL manually:

```bash
# For RHEL 7
sudo yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm

# For RHEL 8
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm

# For RHEL 9
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm
```

**Build fails with missing dependencies:**

Install additional development tools:

```bash
# For DNF-based systems
sudo dnf groupinstall -y "Development Tools"

# For YUM-based systems
sudo yum groupinstall -y "Development Tools"
```

---

### Windows (Chocolatey/winget)

AtomicParsley is available on Windows through both Chocolatey and winget package managers.

#### Prerequisites

- Windows 10 version 1809 or later
- Chocolatey or winget installed
- Administrator privileges
- Microsoft Visual C++ Redistributable (installed automatically with most packages)

Verify Chocolatey is available:

```powershell
choco --version
```

Or verify winget:

```powershell
winget --version
```

#### Installation Steps

**Install using Chocolatey:**

Open PowerShell or Command Prompt as Administrator and run:

```powershell
choco install atomicparsley -y
```

**Explanation of flags:**
- `-y`: Automatically confirms all prompts

**Install using winget:**

```powershell
winget install --id wez.AtomicParsley --silent --accept-package-agreements --accept-source-agreements
```

**Explanation of flags:**
- `--id wez.AtomicParsley`: Specifies the exact package identifier
- `--silent`: Suppresses the installer UI
- `--accept-package-agreements`: Automatically accepts the package license
- `--accept-source-agreements`: Automatically accepts the source terms

The Chocolatey package installs a portable version that places the executable in the Chocolatey bin directory (typically `C:\ProgramData\chocolatey\bin\`).

#### Verification

Confirm the installation succeeded:

```powershell
AtomicParsley --version
```

Or check via the package manager:

```powershell
# Chocolatey
choco list --local-only | Select-String atomicparsley

# winget
winget list --id wez.AtomicParsley
```

#### Troubleshooting

**Chocolatey installation fails:**

Clear the Chocolatey cache and retry:

```powershell
choco cache remove
choco install atomicparsley -y --force
```

**winget package not found:**

Reset winget sources:

```powershell
winget source reset --force
winget install --id wez.AtomicParsley --silent --accept-package-agreements --accept-source-agreements
```

**vcruntime140.dll error:**

Install the Microsoft Visual C++ Redistributable:

```powershell
winget install --id Microsoft.VCRedist.2015+.x64 --silent --accept-package-agreements --accept-source-agreements
```

**Command not found after installation:**

Refresh the PATH environment variable:

```powershell
# In PowerShell, restart the shell or run:
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

---

### WSL (Ubuntu)

WSL runs Ubuntu Linux, so AtomicParsley can be installed using APT commands identical to the Ubuntu installation.

#### Prerequisites

- WSL 2 with Ubuntu installed (20.04 or later recommended)
- sudo privileges within WSL

#### Installation Steps

Run the following commands within the WSL Ubuntu terminal:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y atomicparsley
```

**Explanation of flags:**
- `DEBIAN_FRONTEND=noninteractive`: Prevents any interactive prompts
- `-y`: Automatically answers "yes" to confirmation prompts

#### Verification

Confirm the installation succeeded:

```bash
AtomicParsley --version
```

#### WSL-Specific Considerations

AtomicParsley in WSL can process files on both the Linux filesystem and the Windows filesystem (mounted at `/mnt/c/`, `/mnt/d/`, etc.):

```bash
# Process a file on Windows filesystem
AtomicParsley /mnt/c/Users/YourName/Videos/video.mp4 --show

# Process a file on Linux filesystem
AtomicParsley ~/videos/video.mp4 --show
```

**Performance Note:** Processing files on the Windows filesystem (`/mnt/c/`) may be slower than files on the native Linux filesystem (`~/`). For batch operations, copy files to the Linux filesystem first.

#### Troubleshooting

**APT update fails:**

Ensure WSL can access the internet:

```bash
ping -c 3 archive.ubuntu.com
```

If DNS resolution fails:

```bash
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
```

**Permission denied when accessing Windows files:**

Ensure the target file is not open in another Windows application. WSL respects Windows file locks.

---

### Git Bash (Manual/Portable)

Git Bash runs within Windows, so AtomicParsley can be installed using the Chocolatey or winget commands, or via manual download of the portable binary.

#### Prerequisites

- Windows 10 or later
- Git Bash installed
- curl available in Git Bash (included by default)
- Administrator privileges (for Chocolatey/winget installation)

#### Installation Steps

**Option A: Install via PowerShell from Git Bash (Recommended)**

Use Chocolatey to install from Git Bash:

```bash
powershell.exe -Command "choco install atomicparsley -y"
```

Or use winget:

```bash
powershell.exe -Command "winget install --id wez.AtomicParsley --silent --accept-package-agreements --accept-source-agreements"
```

**Option B: Manual/Portable Installation**

Download and extract the portable binary:

```bash
# Create installation directory
mkdir -p "$HOME/Apps/AtomicParsley"

# Download the latest Windows release
curl -L -o "$HOME/Apps/AtomicParsley/AtomicParsley.zip" \
  "https://github.com/wez/atomicparsley/releases/download/20240608.083822.1ed9031/AtomicParsleyWindows.zip"

# Extract the archive
unzip -q "$HOME/Apps/AtomicParsley/AtomicParsley.zip" -d "$HOME/Apps/AtomicParsley/"

# Remove the zip file to save space
rm "$HOME/Apps/AtomicParsley/AtomicParsley.zip"

# Add to PATH (add to .bashrc for persistence)
echo 'export PATH="$HOME/Apps/AtomicParsley:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Verify the installation:

```bash
AtomicParsley --version
```

For manual installation, verify the executable exists:

```bash
if [[ -f "$HOME/Apps/AtomicParsley/AtomicParsley.exe" ]]; then
  echo "AtomicParsley is installed"
else
  echo "AtomicParsley is NOT installed"
fi
```

#### Troubleshooting

**curl download fails:**

Use wget as an alternative:

```bash
wget -O "$HOME/Apps/AtomicParsley/AtomicParsley.zip" \
  "https://github.com/wez/atomicparsley/releases/download/20240608.083822.1ed9031/AtomicParsleyWindows.zip"
```

**unzip not found:**

Extract using PowerShell:

```bash
powershell.exe -Command "Expand-Archive -Path '$HOME/Apps/AtomicParsley/AtomicParsley.zip' -DestinationPath '$HOME/Apps/AtomicParsley/' -Force"
```

**PowerShell command fails from Git Bash:**

Use the full path to PowerShell:

```bash
/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -Command "choco install atomicparsley -y"
```

---

## Post-Installation Configuration

AtomicParsley is a command-line tool that requires no post-installation configuration. It is ready to use immediately after installation.

### Basic Usage Examples

**Display metadata of an MPEG-4 file:**

```bash
AtomicParsley video.mp4 --show
```

**Set title metadata:**

```bash
AtomicParsley video.mp4 --title "My Video Title" --overWrite
```

**Embed artwork:**

```bash
AtomicParsley video.mp4 --artwork cover.jpg --overWrite
```

**Set multiple metadata fields:**

```bash
AtomicParsley video.mp4 \
  --title "My Video" \
  --artist "Artist Name" \
  --album "Album Name" \
  --year 2024 \
  --overWrite
```

### Integration with yt-dlp

AtomicParsley is commonly used with yt-dlp for embedding metadata in downloaded videos. yt-dlp automatically detects and uses AtomicParsley when available:

```bash
# yt-dlp will use AtomicParsley to embed metadata
yt-dlp --embed-thumbnail --add-metadata "https://example.com/video"
```

---

## Common Issues

### Cross-Platform Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Command not found | Executable not in PATH | Verify installation and check PATH environment variable |
| Permission denied | Insufficient privileges | Run with sudo (Linux/macOS) or as Administrator (Windows) |
| File locked | File open in another application | Close the media file in any players or editors |
| Invalid atom error | Corrupted or non-standard MPEG-4 file | Try with a different file; some files may have non-standard structures |

### Case Sensitivity

**Important:** The executable name uses mixed case (`AtomicParsley`) on all platforms. Using lowercase (`atomicparsley`) may fail:

```bash
# Correct
AtomicParsley --version

# May fail on case-sensitive systems
atomicparsley --version
```

On macOS and Windows (case-insensitive filesystems), both work. On Linux (case-sensitive), use the correct case.

### Version Differences

Package manager versions may lag behind the latest GitHub release:

| Source | Version (as of 2024) |
|--------|---------------------|
| GitHub Releases | 20240608.083822.1ed9031 |
| Homebrew | 20240608.083822.1ed9031 |
| Chocolatey | 20240608.083822.1ed9031 |
| Ubuntu 24.04 | 20210715.151551.e7ad03a |
| Debian 12 | 20210715.151551.e7ad03a |

If you need the latest version on Linux, build from source as described in the troubleshooting sections.

---

## References

- [AtomicParsley GitHub Repository (wez/atomicparsley)](https://github.com/wez/atomicparsley)
- [AtomicParsley GitHub Releases](https://github.com/wez/atomicparsley/releases)
- [AtomicParsley Homebrew Formula](https://formulae.brew.sh/formula/atomicparsley)
- [AtomicParsley Chocolatey Package](https://community.chocolatey.org/packages/atomicparsley)
- [AtomicParsley Ubuntu Package](https://packages.ubuntu.com/atomicparsley)
- [AtomicParsley SourceForge (Legacy)](https://atomicparsley.sourceforge.net/)
- [yt-dlp Documentation (AtomicParsley Integration)](https://github.com/yt-dlp/yt-dlp#embedding-metadata)
