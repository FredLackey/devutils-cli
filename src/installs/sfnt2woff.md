# Installing sfnt2woff

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or `dev install homebrew`
  - Xcode Command Line Tools - Install via `xcode-select --install` (required by Homebrew for building native packages)
- **Optional:** None
- **Auto-installed:**
  - woff2sfnt (reverse conversion tool, included in the sfnt2woff Homebrew formula)

### Ubuntu (APT/Snap)
- **Required:**
  - sudo privileges (for package installation)
- **Optional:** None
- **Auto-installed:**
  - woff2sfnt (reverse conversion tool, included in the woff-tools APT package)

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - sudo privileges (for package installation)
- **Optional:** None
- **Auto-installed:**
  - woff2sfnt (reverse conversion tool, included in the woff-tools APT package)

### Amazon Linux (DNF/YUM)
- **Required:**
  - gcc - Install via `sudo dnf install -y gcc` (AL2023) or `sudo yum install -y gcc` (AL2)
  - make - Install via `sudo dnf install -y make` (AL2023) or `sudo yum install -y make` (AL2)
  - zlib-devel - Install via `sudo dnf install -y zlib-devel` (AL2023) or `sudo yum install -y zlib-devel` (AL2)
  - git - Install via `sudo dnf install -y git` (AL2023) or `sudo yum install -y git` (AL2)
  - sudo privileges (for installing build dependencies)
- **Optional:** None
- **Auto-installed:**
  - woff2sfnt (compiled alongside sfnt2woff from the same source repository)

### Windows (Chocolatey/winget)
- **Required:**
  - Node.js - Install via `choco install nodejs-lts -y` or `dev install node`
  - npm - Installed automatically with Node.js
- **Optional:** None
- **Auto-installed:** None

### Git Bash (Manual/Portable)
- **Required:**
  - Node.js - Download from https://nodejs.org/ or install via `dev install node`
  - npm - Installed automatically with Node.js
- **Optional:** None
- **Auto-installed:** None

## Overview

sfnt2woff is a command-line utility that converts TrueType and OpenType font files (TTF/OTF) to Web Open Font Format (WOFF). Originally developed by Jonathan Kew at Mozilla, this tool enables web developers to compress fonts for faster web page loading while maintaining visual fidelity. The tool works in conjunction with woff2sfnt, which performs the reverse conversion.

Key capabilities include:

- **Font Conversion**: Convert TTF and OTF files to WOFF format
- **Metadata Support**: Optionally embed XML metadata in WOFF files
- **Private Data**: Include private data blocks for font-specific information
- **Compression**: Apply zlib compression to reduce file sizes (typically 40-60% smaller than original)

**Note**: This tool produces WOFF 1.0 files. For WOFF 2.0 (which offers better compression), use the `woff2` tool instead.

## Prerequisites

Before installing sfnt2woff on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required for system-wide installation
3. **Sufficient disk space** - At least 50 MB for installation with dependencies

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

Run the following commands to add the webfonttools tap and install sfnt2woff:

```bash
brew tap bramstein/webfonttools
brew install --quiet sfnt2woff
```

The first command adds a third-party Homebrew repository containing web font tools. The second command installs sfnt2woff along with its companion tool woff2sfnt (for reverse conversion). The `--quiet` flag suppresses non-essential output for cleaner automation.

#### Verification

Confirm the installation succeeded:

```bash
sfnt2woff
```

Expected output:

```
Usage: sfnt2woff [-v <maj>.<min>] [-m <metadata.xml>] [-p <private.dat>] <otffile>
```

Test the reverse tool is also available:

```bash
woff2sfnt
```

#### Troubleshooting

**Problem**: `sfnt2woff: command not found` after installation

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

**Problem**: Tap command fails

**Solution**: Update Homebrew and retry:

```bash
brew update
brew tap bramstein/webfonttools
```

**Problem**: Want better compression

**Solution**: Install sfnt2woff-zopfli, which uses Zopfli compression for 5-8% better compression:

```bash
brew install --quiet sfnt2woff-zopfli
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- At least 50 MB free disk space

#### Installation Steps

Run the following commands to update the package index and install woff-tools (which provides sfnt2woff):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y woff-tools
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully unattended installation without prompts. The woff-tools package includes both sfnt2woff (for conversion to WOFF) and woff2sfnt (for conversion from WOFF).

**Alternative (Better Compression)**: For 5-8% better compression, install sfnt2woff-zopfli instead:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y sfnt2woff-zopfli
```

Note that sfnt2woff-zopfli installs commands named `sfnt2woff-zopfli` and `woff2sfnt-zopfli` rather than the standard `sfnt2woff` and `woff2sfnt`.

#### Verification

Confirm the installation succeeded:

```bash
sfnt2woff
```

Expected output:

```
Usage: sfnt2woff [-v <maj>.<min>] [-m <metadata.xml>] [-p <private.dat>] <otffile>
```

Test that the reverse tool is also available:

```bash
woff2sfnt
```

#### Troubleshooting

**Problem**: `E: Unable to locate package woff-tools`

**Solution**: Update the package index:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

If still unavailable, verify your sources.list includes the universe repository:

```bash
sudo DEBIAN_FRONTEND=noninteractive add-apt-repository -y universe
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Package version is outdated

**Solution**: The repository version is the original Mozilla implementation and is stable. For better compression, use sfnt2woff-zopfli which is more actively maintained.

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
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y woff-tools
```

**ARM Architecture Note**: The woff-tools package is available for ARM architectures (armhf, arm64) in the Debian/Raspberry Pi OS repositories. The package is compiled natively for ARM, so no special considerations are required.

**Alternative (Better Compression)**: The sfnt2woff-zopfli package is also available for ARM:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y sfnt2woff-zopfli
```

Supported ARM architectures for sfnt2woff-zopfli:
- arm64 (64-bit Raspberry Pi OS)
- armhf (32-bit Raspberry Pi OS)
- armel (older 32-bit ARM systems)

#### Verification

Confirm the installation succeeded:

```bash
sfnt2woff
```

Expected output:

```
Usage: sfnt2woff [-v <maj>.<min>] [-m <metadata.xml>] [-p <private.dat>] <otffile>
```

Test that the reverse tool is also available:

```bash
woff2sfnt
```

#### Troubleshooting

**Problem**: Package not found

**Solution**: Ensure your package lists are current:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Slow font conversion on older Raspberry Pi models

**Solution**: Font conversion is CPU-intensive. On Raspberry Pi 2 or earlier, expect longer processing times. Consider processing fonts on a more powerful machine if converting many files.

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- Development tools for compiling from source
- At least 100 MB free disk space

**Important**: sfnt2woff is not available in the standard Amazon Linux repositories. This guide compiles from source using the original Mozilla codebase.

#### Installation Steps

**Step 1: Install build dependencies**

For Amazon Linux 2023:

```bash
sudo dnf install -y gcc make zlib-devel git
```

For Amazon Linux 2:

```bash
sudo yum install -y gcc make zlib-devel git
```

**Step 2: Clone the source repository**

```bash
cd /tmp
git clone https://github.com/wget/sfnt2woff.git
cd sfnt2woff
```

**Step 3: Compile the tools**

```bash
make
```

This compiles both sfnt2woff (OTF/TTF to WOFF) and woff2sfnt (WOFF to OTF/TTF).

**Step 4: Install the binaries**

```bash
sudo cp sfnt2woff woff2sfnt /usr/local/bin/
sudo chmod 755 /usr/local/bin/sfnt2woff /usr/local/bin/woff2sfnt
```

**Step 5: Clean up**

```bash
cd /
rm -rf /tmp/sfnt2woff
```

#### Verification

Confirm the installation succeeded:

```bash
sfnt2woff
```

Expected output:

```
Usage: sfnt2woff [-v <maj>.<min>] [-m <metadata.xml>] [-p <private.dat>] <otffile>
```

Test that the reverse tool is also available:

```bash
woff2sfnt
```

#### Troubleshooting

**Problem**: `make` fails with "zlib.h: No such file or directory"

**Solution**: Install the zlib development package:

For Amazon Linux 2023:

```bash
sudo dnf install -y zlib-devel
```

For Amazon Linux 2:

```bash
sudo yum install -y zlib-devel
```

**Problem**: `sfnt2woff: command not found` after installation

**Solution**: Ensure `/usr/local/bin` is in your PATH:

```bash
echo $PATH | grep -q '/usr/local/bin' && echo "PATH OK" || echo "PATH missing /usr/local/bin"
```

If missing, add it:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Git clone fails

**Solution**: Ensure git is installed and you have internet connectivity:

```bash
sudo dnf install -y git   # AL2023
sudo yum install -y git   # AL2
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or later (64-bit)
- Administrator PowerShell or Command Prompt
- Development tools for compiling from source

**Important**: sfnt2woff is not available as a Chocolatey or winget package. This guide uses Node.js with an npm package that provides sfnt2woff functionality.

#### Installation Steps

**Step 1: Install Node.js via Chocolatey**

If Node.js is not already installed, run in an Administrator PowerShell:

```powershell
choco install nodejs-lts -y
```

Close and reopen PowerShell to refresh the PATH.

**Step 2: Install sfnt2woff via npm**

```powershell
npm install -g sfnt2woff
```

The `-g` flag installs the package globally, making the command available system-wide.

**Note**: The npm package provides equivalent functionality to the original Mozilla tool but is implemented in JavaScript/Node.js.

#### Verification

Confirm the installation succeeded:

```powershell
npx sfnt2woff --help
```

Expected behavior: The command should display usage information or process fonts when given appropriate arguments.

Test basic functionality by converting a font file:

```powershell
# If you have a TTF file available:
npx sfnt2woff input.ttf output.woff
```

#### Troubleshooting

**Problem**: `npm: The term 'npm' is not recognized`

**Solution**: Node.js is not installed or not in PATH. Install Node.js:

```powershell
choco install nodejs-lts -y
```

Then close and reopen your terminal.

**Problem**: Permission errors during npm install

**Solution**: Run the command in an Administrator PowerShell, or configure npm to use a different global directory:

```powershell
npm config set prefix %USERPROFILE%\npm
```

**Problem**: Need the original C-based tool instead of Node.js version

**Solution**: Use WSL (Windows Subsystem for Linux) to run the native Linux version. See the WSL section below.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

**Note**: WSL provides a full Linux environment, allowing you to use the native woff-tools package.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y woff-tools
```

The installation process is identical to native Ubuntu since WSL Ubuntu uses the same package repositories.

**Alternative (Better Compression)**:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y sfnt2woff-zopfli
```

#### Verification

Confirm the installation succeeded:

```bash
sfnt2woff
```

Expected output:

```
Usage: sfnt2woff [-v <maj>.<min>] [-m <metadata.xml>] [-p <private.dat>] <otffile>
```

Test that the reverse tool is also available:

```bash
woff2sfnt
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
# Example: Convert a font from Windows Downloads folder
sfnt2woff /mnt/c/Users/YourUsername/Downloads/myfont.ttf
# Output will be /mnt/c/Users/YourUsername/Downloads/myfont.woff
```

**Problem**: Output file created in wrong location

**Solution**: By default, sfnt2woff creates the output file in the same directory as the input file with a `.woff` extension. Navigate to the input file's directory or specify the full path.

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or later (64-bit)
- Git Bash installed (comes with Git for Windows)
- Node.js installed
- Internet access

**Note**: Git Bash runs in a MinGW environment. The simplest approach is using the npm package since native compilation requires additional setup.

#### Installation Steps

**Step 1: Verify Node.js is available**

Open Git Bash and run:

```bash
node --version
npm --version
```

If Node.js is not installed, download and install it from https://nodejs.org/ or use the Windows Chocolatey method first.

**Step 2: Install sfnt2woff via npm**

```bash
npm install -g sfnt2woff
```

**Step 3: Verify npm global bin is in PATH**

```bash
npm config get prefix
```

Add the npm bin directory to your PATH if not already present:

```bash
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
npx sfnt2woff --help
```

Test basic functionality:

```bash
# If you have a TTF file available:
npx sfnt2woff input.ttf output.woff
```

#### Troubleshooting

**Problem**: `npm: command not found`

**Solution**: Node.js is not installed or not in Git Bash's PATH. Install Node.js for Windows and ensure it's in your system PATH.

**Problem**: Path conversion issues with Windows-style paths

**Solution**: Use forward slashes and the MSYS path format:

```bash
# Instead of C:\Users\Me\Fonts\font.ttf
npx sfnt2woff /c/Users/Me/Fonts/font.ttf
```

**Problem**: Need the native C-based tool

**Solution**: For the native tool in Git Bash, you would need MSYS2 with a full MinGW development environment. A simpler approach is to use WSL instead.

---

## Post-Installation Configuration

After installing sfnt2woff on any platform, review these optional but useful configurations.

### Basic Usage

Convert a TrueType or OpenType font to WOFF:

```bash
sfnt2woff myfont.ttf
# Creates myfont.woff in the same directory
```

Convert with a specific version number:

```bash
sfnt2woff -v 1.0 myfont.ttf
```

Include XML metadata:

```bash
sfnt2woff -m metadata.xml myfont.ttf
```

### Reverse Conversion

Convert a WOFF file back to OTF/TTF:

```bash
woff2sfnt myfont.woff > myfont.ttf
```

Extract just the metadata from a WOFF file:

```bash
woff2sfnt -m myfont.woff
```

### Batch Processing

Convert all TTF files in a directory:

```bash
for f in *.ttf; do sfnt2woff "$f"; done
```

Convert all OTF files:

```bash
for f in *.otf; do sfnt2woff "$f"; done
```

---

## Common Issues

### Issue: Output File Not Created

**Symptoms**: No error message but no .woff file appears

**Solutions**:

- Verify the input file exists and is a valid TTF/OTF:

```bash
file myfont.ttf
```

- Check file permissions on the output directory
- Ensure sufficient disk space

### Issue: "Malformed font" or "Invalid font data" Errors

**Symptoms**: sfnt2woff reports font data errors

**Solutions**:

- Verify the input file is a valid TrueType or OpenType font, not WOFF or WOFF2
- Some fonts with unusual table structures may not convert correctly
- Try using a font editor to re-export the font before conversion

### Issue: Large Output File Size

**Symptoms**: WOFF file is not significantly smaller than the original

**Solutions**:

- This is normal for some fonts, especially those already optimized
- For better compression, use sfnt2woff-zopfli (5-8% smaller):

```bash
# Ubuntu/Debian/Raspberry Pi OS
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y sfnt2woff-zopfli
sfnt2woff-zopfli myfont.ttf
```

```bash
# macOS
brew install --quiet sfnt2woff-zopfli
sfnt2woff-zopfli myfont.ttf
```

### Issue: WOFF2 Needed Instead of WOFF

**Symptoms**: Need WOFF2 format for better browser support or compression

**Solutions**:

- sfnt2woff only produces WOFF 1.0 files
- For WOFF2, install the woff2 tool instead:

```bash
# Ubuntu/Debian
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y woff2

# macOS
brew tap bramstein/webfonttools
brew install --quiet woff2
```

### Issue: Cannot Convert Variable Fonts

**Symptoms**: Variable font (with font variations) fails to convert

**Solutions**:

- The original sfnt2woff tool predates variable fonts and may not handle them correctly
- Use Google's woff2 tools which have better support for modern font features

---

## References

- [WOFF File Format Specification (W3C)](https://www.w3.org/TR/WOFF/)
- [MDN Web Docs - WOFF](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Fonts/WOFF)
- [GitHub - woff-tools (wget fork)](https://github.com/wget/sfnt2woff)
- [GitHub - sfnt2woff-zopfli](https://github.com/bramstein/sfnt2woff-zopfli)
- [Homebrew webfonttools Tap](https://github.com/bramstein/homebrew-webfonttools)
- [Ubuntu Packages - woff-tools](https://packages.ubuntu.com/woff-tools)
- [Debian Packages - sfnt2woff-zopfli](https://packages.debian.org/sfnt2woff-zopfli)
- [npm - sfnt2woff](https://www.npmjs.com/package/sfnt2woff)
- [Ubuntu Manpage - sfnt2woff](https://manpages.ubuntu.com/manpages/jammy/man1/sfnt2woff.1.html)
