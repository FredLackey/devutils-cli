# Installing Xcode CLT (Command Line Tools)

## Overview

Xcode Command Line Tools (CLT) is a lightweight package (~2.5 GB) from Apple containing essential development utilities needed by most developers on macOS. It includes compilers (clang, Swift), version control (git), build tools (make), and other utilities required by package managers like Homebrew.

**This installer is for Command Line Tools only.** If you need the full Xcode IDE for iOS/macOS app development, see the full Xcode installer (xcode.md).

**What's Included in CLT:**
- **Compilers**: clang, clang++, Swift compiler
- **Version Control**: git
- **Build Tools**: make, ld, ar, ranlib, libtool
- **Utilities**: dsymutil, strip, nm, otool, lipo
- **Headers**: macOS SDK headers for building software

**Platform Limitation**: Xcode CLT is an Apple-exclusive product and **only runs on macOS**. There is no legitimate way to install or run Xcode CLT on Windows, Linux, or other operating systems.

## Dependencies

### macOS (Homebrew)
- **Required:** None - Installation uses built-in macOS commands (`softwareupdate`, `xcode-select`)
- **Optional:** None
- **Auto-installed:** Xcode CLT is a foundational package that includes:
  - `clang` and `clang++` (C/C++ compilers)
  - `swift` (Swift compiler)
  - `git` (version control system)
  - `make` (build automation tool)
  - `ld`, `ar`, `ranlib`, `libtool` (linker and archiving tools)
  - `dsymutil`, `strip`, `nm`, `otool`, `lipo` (debugging and binary utilities)
  - macOS SDK headers for software compilation

### Ubuntu (APT/Snap)
- **Required:** Installation not supported on this platform (Xcode CLT is macOS-only)
- **Optional:** N/A
- **Auto-installed:** N/A
- **Alternative:** Use `sudo apt-get install -y build-essential git` for equivalent tooling

### Raspberry Pi OS (APT/Snap)
- **Required:** Installation not supported on this platform (Xcode CLT is macOS-only)
- **Optional:** N/A
- **Auto-installed:** N/A
- **Alternative:** Use `sudo apt-get install -y build-essential git` for equivalent tooling

### Amazon Linux (DNF/YUM)
- **Required:** Installation not supported on this platform (Xcode CLT is macOS-only)
- **Optional:** N/A
- **Auto-installed:** N/A
- **Alternative:** Use `sudo dnf groupinstall -y "Development Tools"` and `sudo dnf install -y git` for equivalent tooling

### Windows (Chocolatey/winget)
- **Required:** Installation not supported on this platform (Xcode CLT is macOS-only)
- **Optional:** N/A
- **Auto-installed:** N/A
- **Alternative:** Use `choco install visualstudio2022buildtools git -y` or `winget install Microsoft.VisualStudio.2022.BuildTools Git.Git` for equivalent tooling

### Git Bash (Manual/Portable)
- **Required:** Installation not supported on this platform (Xcode CLT is macOS-only)
- **Optional:** N/A
- **Auto-installed:** N/A
- **Alternative:** Git Bash includes git by default; use Windows tooling (see above) for compiler support

## Prerequisites

### Universal Requirements (macOS Only)

- **macOS**: macOS 10.15 (Catalina) or later (varies by CLT version)
- **Disk Space**: ~2.5 GB
- **Internet Connection**: Required for download
- **Admin Access**: Required for installation via `sudo`

### Checking macOS Version

```bash
sw_vers -productVersion
```

## Platform-Specific Installation

---

### macOS (Homebrew)

Xcode Command Line Tools can be installed non-interactively using `softwareupdate`. This method avoids the GUI dialog that `xcode-select --install` triggers.

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Admin (sudo) access

#### Installation Steps

```bash
# Non-interactive installation using softwareupdate
# This method avoids the GUI dialog that xcode-select --install triggers

# Create placeholder file to make CLT available in softwareupdate
touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress

# Find the Command Line Tools package name
CLT_PACKAGE=$(softwareupdate -l 2>&1 | grep -o "Command Line Tools for Xcode-[0-9.]*" | head -n 1)

# Install the Command Line Tools (requires sudo for installation)
sudo softwareupdate -i "$CLT_PACKAGE" --verbose

# Clean up the placeholder file
rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
```

#### Verification

```bash
# Verify Command Line Tools installation
xcode-select -p
# Expected output: /Library/Developer/CommandLineTools

# Verify compiler is available
clang --version

# Verify git is available
git --version

# Verify make is available
make --version
```

#### Troubleshooting

**Problem**: Command Line Tools installation fails with softwareupdate

```bash
# Reset xcode-select and try again
sudo xcode-select --reset
sudo rm -rf /Library/Developer/CommandLineTools

# Re-run the installation
touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
CLT_PACKAGE=$(softwareupdate -l 2>&1 | grep -o "Command Line Tools for Xcode-[0-9.]*" | head -n 1)
sudo softwareupdate -i "$CLT_PACKAGE" --verbose
rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
```

**Problem**: `xcode-select: error: command line tools are already installed`

This is not an error - CLT is already installed. Verify with:

```bash
xcode-select -p
clang --version
```

**Problem**: `softwareupdate` returns no CLT package

```bash
# Ensure the placeholder file exists
touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress

# Check available packages
softwareupdate -l

# If still no CLT package, try the interactive installer as fallback
xcode-select --install
```

---

### Ubuntu/Debian (APT)

#### Not Supported

Xcode CLT is an Apple-exclusive product and is **not available for Ubuntu or Debian**. Apple does not provide Xcode CLT for any Linux distribution.

#### Alternatives for Linux Developers

Linux already has equivalent tools available natively:

```bash
# Install build essentials (gcc, g++, make)
sudo apt-get update && sudo apt-get install -y build-essential

# Install git
sudo apt-get install -y git

# Install clang (if preferred over gcc)
sudo apt-get install -y clang
```

---

### Raspberry Pi OS (APT)

#### Not Supported

Xcode CLT is an Apple-exclusive product and is **not available for Raspberry Pi OS**.

#### Alternatives

Raspberry Pi OS has equivalent tools available natively:

```bash
# Install build essentials (gcc, g++, make)
sudo apt-get update && sudo apt-get install -y build-essential

# Install git
sudo apt-get install -y git
```

---

### Amazon Linux/RHEL (YUM/DNF)

#### Not Supported

Xcode CLT is an Apple-exclusive product and is **not available for Amazon Linux or RHEL**.

#### Alternatives

Amazon Linux/RHEL has equivalent tools available natively:

```bash
# Install Development Tools group (gcc, g++, make)
sudo yum groupinstall -y "Development Tools"
# Or on newer systems with DNF:
sudo dnf groupinstall -y "Development Tools"

# Install git
sudo yum install -y git
# Or:
sudo dnf install -y git
```

---

### Windows (Chocolatey/winget)

#### Not Supported

Xcode CLT is an Apple-exclusive product and is **not available for Windows**.

#### Alternatives

Windows has equivalent tools available:

```powershell
# Install Build Tools for Visual Studio (includes MSVC compiler)
choco install visualstudio2022buildtools -y

# Install git
choco install git -y

# Install make (via GnuWin32 or similar)
choco install make -y

# Or use winget:
winget install Microsoft.VisualStudio.2022.BuildTools
winget install Git.Git
```

---

### WSL (Windows Subsystem for Linux)

#### Not Supported

Xcode CLT is an Apple-exclusive product and is **not available for WSL**.

#### Alternatives

WSL has equivalent Linux tools available:

```bash
# Install build essentials (gcc, g++, make)
sudo apt-get update && sudo apt-get install -y build-essential

# Install git
sudo apt-get install -y git

# Install clang (if preferred over gcc)
sudo apt-get install -y clang
```

---

### Git Bash (Manual/Portable)

#### Not Supported

Xcode CLT is an Apple-exclusive product and is **not available for Git Bash on Windows**.

#### Alternatives

Git Bash already includes git. For additional build tools, see the Windows section above.

---

## Post-Installation Configuration

These steps apply only to macOS installations.

### Verify Installation

After installation, verify CLT is working correctly:

```bash
# Check developer directory is set
xcode-select -p
# Expected: /Library/Developer/CommandLineTools

# Verify key tools are available
clang --version
git --version
make --version
```

### Reset Developer Directory

If tools point to the wrong location:

```bash
# Reset to CLT location
sudo xcode-select -s /Library/Developer/CommandLineTools
```

## Common Issues

### CLT Not Found After macOS Update

macOS updates sometimes remove or invalidate CLT. Reinstall:

```bash
sudo rm -rf /Library/Developer/CommandLineTools
touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
CLT_PACKAGE=$(softwareupdate -l 2>&1 | grep -o "Command Line Tools for Xcode-[0-9.]*" | head -n 1)
sudo softwareupdate -i "$CLT_PACKAGE" --verbose
rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
```

### Headers Not Found

If compilation fails with missing headers:

```bash
# On older macOS versions, headers may need to be installed separately
# This is rare on modern macOS but may apply to macOS 10.14 (Mojave)
sudo installer -pkg /Library/Developer/CommandLineTools/Packages/macOS_SDK_headers_for_macOS_10.14.pkg -target /
```

## References

- [Installing Command Line Tools - Apple Documentation](https://developer.apple.com/documentation/xcode/installing-the-command-line-tools/)
- [xcode-select Man Page](https://keith.github.io/xcode-man-pages/xcode-select.1.html)
- [Technical Note TN2339: Building from the Command Line](https://developer.apple.com/library/archive/technotes/tn2339/_index.html)
