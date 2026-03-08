# Installing tar

## Overview

tar (tape archive) is a command-line utility for creating, extracting, and manipulating archive files. Originally designed for writing data to sequential I/O devices (tape drives), tar has become the standard archiving tool on Unix-like systems. It bundles multiple files and directories into a single archive file while preserving file permissions, ownership, and directory structures.

tar is essential for:
- Creating backups of files and directories
- Distributing software source code (the ubiquitous `.tar.gz` "tarball" format)
- Packaging files for transfer across systems
- Combining with compression tools (gzip, bzip2, xz) for space-efficient archives

Two major implementations exist:
- **GNU tar** - The default on most Linux distributions; feature-rich with GNU extensions
- **BSD tar (bsdtar)** - The default on macOS and FreeBSD; uses the libarchive library

This guide documents tar installation procedures for all platforms supported by DevUtils CLI.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `homebrew` - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None
- **Note:** macOS includes BSD tar pre-installed at `/usr/bin/tar`. Homebrew installs GNU tar as `gtar` to avoid conflicts.

### Ubuntu (APT/Snap)
- **Required:** None (APT package manager is pre-installed on Ubuntu)
- **Optional:** None
- **Auto-installed:** None
- **Note:** tar (GNU tar) is pre-installed on all Ubuntu systems as part of the base system.

### Raspberry Pi OS (APT/Snap)
- **Required:** None (APT package manager is pre-installed on Raspberry Pi OS)
- **Optional:** None
- **Auto-installed:** None
- **Note:** tar (GNU tar) is pre-installed on all Raspberry Pi OS systems as part of the base system.

### Amazon Linux (DNF/YUM)
- **Required:** None (DNF/YUM package manager is pre-installed on Amazon Linux)
- **Optional:** None
- **Auto-installed:** None
- **Note:** tar (GNU tar) is pre-installed on all Amazon Linux systems as part of the base system.

### Windows (Chocolatey/winget)
- **Required:** None
- **Optional:**
  - `chocolatey` - For installing GNU tar tools if needed
- **Auto-installed:** None
- **Note:** Windows 10 (version 1803+) and Windows 11 include bsdtar pre-installed at `C:\Windows\System32\tar.exe`.

### Git Bash (Manual/Portable)
- **Required:**
  - `git` - Git for Windows must be installed (GNU tar is bundled with it). Download from https://git-scm.com/download/win or install via `choco install git -y`
- **Optional:** None
- **Auto-installed:** None
- **Note:** Git Bash includes GNU tar at `C:\Program Files\Git\usr\bin\tar.exe`.

## Prerequisites

Before installing or verifying tar on any platform, ensure:

1. **Terminal access** - Required to run commands
2. **Administrative privileges** - Required for installation (sudo on Linux/macOS, Administrator on Windows)
3. **Internet connectivity** - Required only if tar is not pre-installed

**Note**: tar is pre-installed on most operating systems. The installation steps below verify tar availability and install it only if missing.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma or later recommended)
- Homebrew package manager installed
- Terminal access via Terminal.app or iTerm2

macOS includes BSD tar pre-installed at `/usr/bin/tar`. This version works well for most use cases. However, if you need GNU tar (for compatibility with Linux systems or specific GNU extensions), install it via Homebrew.

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

**Check if tar is already available (BSD tar is pre-installed on macOS):**

```bash
tar --version
```

Expected output showing BSD tar:

```
bsdtar 3.5.3 - libarchive 3.5.3 zlib/1.2.11 liblzma/5.0.5 bz2lib/1.0.8
```

**To install GNU tar via Homebrew:**

```bash
brew install --quiet gnu-tar
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts.

GNU tar is installed with the `g` prefix as `gtar` to avoid conflicts with the system BSD tar. To use GNU tar as the default `tar` command, add the gnubin directory to your PATH:

**For Apple Silicon Macs (M1/M2/M3):**

```bash
echo 'export PATH="/opt/homebrew/opt/gnu-tar/libexec/gnubin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

**For Intel Macs:**

```bash
echo 'export PATH="/usr/local/opt/gnu-tar/libexec/gnubin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

#### Verification

Verify BSD tar (pre-installed):

```bash
/usr/bin/tar --version
```

Verify GNU tar after Homebrew installation:

```bash
gtar --version
```

Expected output (version numbers may vary):

```
tar (GNU tar) 1.35
Copyright (C) 2023 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <https://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by John Gilmore and Jay Fenlason.
```

If you added gnubin to PATH, verify `tar` points to GNU tar:

```bash
which tar
tar --version
```

Expected output for Apple Silicon (after PATH modification):

```
/opt/homebrew/opt/gnu-tar/libexec/gnubin/tar
tar (GNU tar) 1.35
```

#### Troubleshooting

**Problem**: `gtar: command not found` after installation

**Solution**: Restart your terminal or source your shell configuration:

```bash
source ~/.zshrc
```

**Problem**: `tar` still shows BSD tar after adding gnubin to PATH

**Solution**: Ensure the gnubin path is added before the system paths. Check your PATH:

```bash
echo $PATH
```

The Homebrew gnubin directory should appear before `/usr/bin`. Restart your terminal after modifying `~/.zshrc`.

**Problem**: Archive created on macOS has issues on Linux

**Solution**: BSD tar stores extended attributes by default, which may cause issues on Linux. Use these flags when creating archives for cross-platform use:

```bash
tar --disable-copyfile -cvf archive.tar directory/
```

Or use GNU tar (`gtar`) for maximum Linux compatibility.

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 LTS or later, or Debian 10 (Buster) or later
- sudo privileges
- Internet connectivity (only if tar is not installed)

GNU tar is pre-installed on all Ubuntu and Debian systems as part of the core utilities. The steps below verify tar is present and install it if missing.

#### Installation Steps

**Check if tar is already installed (it should be):**

```bash
tar --version
```

Expected output (version numbers may vary):

```
tar (GNU tar) 1.34
Copyright (C) 2021 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <https://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by John Gilmore and Jay Fenlason.
```

**If tar is not installed (rare), install it:**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tar
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm tar is available:

```bash
tar --version
```

Verify the installation location:

```bash
which tar
```

Expected output:

```
/usr/bin/tar
```

Test creating and extracting an archive:

```bash
echo "test" > /tmp/testfile.txt
tar -cvf /tmp/test.tar -C /tmp testfile.txt
tar -tvf /tmp/test.tar
rm /tmp/testfile.txt /tmp/test.tar
```

#### Troubleshooting

**Problem**: `tar: command not found`

**Solution**: Install tar using APT:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tar
```

**Problem**: `E: Unable to locate package tar`

**Solution**: Update the package list:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Permission denied when extracting files

**Solution**: Use sudo when extracting to system directories:

```bash
sudo tar -xvf archive.tar -C /destination
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye recommended)
- Raspberry Pi 2 or later (any model supported by Raspberry Pi OS)
- sudo privileges
- Internet connectivity (only if tar is not installed)

Raspberry Pi OS is based on Debian, so tar installation follows the Debian/APT method. GNU tar is pre-installed on all Raspberry Pi OS installations.

#### Installation Steps

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM
- `armv7l` = 32-bit ARM

**Check if tar is already installed (it should be):**

```bash
tar --version
```

Expected output (version numbers may vary):

```
tar (GNU tar) 1.34
Copyright (C) 2021 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <https://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by John Gilmore and Jay Fenlason.
```

**If tar is not installed (rare), install it:**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tar
```

The installation command is identical for both 32-bit and 64-bit Raspberry Pi OS.

#### Verification

Confirm tar is available:

```bash
tar --version
```

Verify the installation location:

```bash
which tar
```

Expected output:

```
/usr/bin/tar
```

#### Troubleshooting

**Problem**: `tar: command not found`

**Solution**: Install tar using APT:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tar
```

**Problem**: Extraction is slow on SD card

**Solution**: SD cards have limited I/O performance. For better extraction performance, use a high-quality SD card (Class 10 or A1/A2 rated) or boot from USB/SSD.

**Problem**: "No space left on device" when extracting

**Solution**: Check available disk space before extraction:

```bash
df -h
```

Clear space if needed:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y
sudo DEBIAN_FRONTEND=noninteractive apt-get clean
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- EC2 instance or compatible environment

Amazon Linux 2023 uses DNF as the default package manager. Amazon Linux 2 uses YUM. GNU tar is pre-installed on all Amazon Linux versions as part of the base system.

**Important**: Amazon Linux 2 reaches end of support on June 30, 2026. Migrate to Amazon Linux 2023 for long-term support.

#### Installation Steps

**Check if tar is already installed (it should be):**

```bash
tar --version
```

Expected output (version numbers may vary):

```
tar (GNU tar) 1.34
Copyright (C) 2021 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <https://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by John Gilmore and Jay Fenlason.
```

**If tar is not installed (rare), install it:**

**For Amazon Linux 2023 (AL2023):**

```bash
sudo dnf install -y tar
```

**For Amazon Linux 2 (AL2):**

```bash
sudo yum install -y tar
```

The `-y` flag automatically confirms installation, enabling non-interactive execution.

#### Verification

Confirm tar is available:

```bash
tar --version
```

Verify the installation location:

```bash
which tar
```

Expected output:

```
/usr/bin/tar
```

Get package information:

```bash
rpm -q tar
```

Expected output (version may vary):

```
tar-1.34-1.amzn2023.x86_64
```

#### Troubleshooting

**Problem**: `tar: command not found`

**Solution**: Install tar using DNF or YUM:

```bash
# For AL2023
sudo dnf install -y tar

# For AL2
sudo yum install -y tar
```

**Problem**: `No match for argument: tar`

**Solution**: Update the package cache and retry:

```bash
# For AL2023
sudo dnf makecache
sudo dnf install -y tar

# For AL2
sudo yum makecache
sudo yum install -y tar
```

**Problem**: Cannot find a valid baseurl for repo

**Solution**: Check network connectivity and repository configuration:

```bash
# For AL2023
sudo dnf check-update

# For AL2
sudo yum check-update
```

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 version 1803 or later, or Windows 11
- Administrator PowerShell or Command Prompt

Windows 10 (version 1803+) and Windows 11 include bsdtar pre-installed at `C:\Windows\System32\tar.exe`. This built-in tar supports common operations and is suitable for most use cases. No additional installation is required.

#### Installation Steps

**Verify tar is already available (it should be on Windows 10 1803+):**

Open Command Prompt or PowerShell and run:

```powershell
tar --version
```

Expected output:

```
bsdtar 3.5.2 - libarchive 3.5.2 zlib/1.2.11 bz2lib/1.0.8 liblzma/5.2.4
```

**Alternative: Using Chocolatey for additional tar tools**

If you need specialized tar functionality, TarTool is available via Chocolatey. First, ensure Chocolatey is installed by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Install TarTool:

```powershell
choco install tartool -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Alternative: Using winget for GNU tar**

```powershell
winget install --id GnuWin32.Tar --silent --accept-package-agreements --accept-source-agreements
```

#### Verification

Verify the built-in tar:

```powershell
tar --version
where tar
```

Expected output:

```
bsdtar 3.5.2 - libarchive 3.5.2 zlib/1.2.11 bz2lib/1.0.8 liblzma/5.2.4
C:\Windows\System32\tar.exe
```

Test creating and extracting an archive:

```powershell
echo "test" > testfile.txt
tar -cvf test.tar testfile.txt
tar -tvf test.tar
del testfile.txt test.tar
```

#### Troubleshooting

**Problem**: `'tar' is not recognized as an internal or external command`

**Solution**: Ensure you are on Windows 10 version 1803 or later. Check your Windows version:

```powershell
winver
```

If you are on an older version, install tar via Chocolatey or winget as shown above.

**Problem**: tar fails with "Cannot read: Invalid argument"

**Solution**: Windows bsdtar may have issues with certain path formats. Use forward slashes in paths:

```powershell
tar -cvf archive.tar path/to/files
```

**Problem**: Non-Latin characters in filenames cause issues

**Solution**: The Windows built-in bsdtar has known issues with Unicode characters in paths. Consider using 7-Zip or GNU tar from Git Bash for archives with non-ASCII filenames.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

WSL runs Ubuntu (or another Linux distribution) within Windows. GNU tar is pre-installed in WSL Ubuntu distributions.

#### Installation Steps

Open your WSL Ubuntu terminal and verify tar is installed:

```bash
tar --version
```

Expected output (version numbers may vary):

```
tar (GNU tar) 1.34
Copyright (C) 2021 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <https://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by John Gilmore and Jay Fenlason.
```

**If tar is not installed (rare), install it:**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tar
```

#### Verification

Confirm tar is available:

```bash
tar --version
which tar
```

Expected output:

```
tar (GNU tar) 1.34
/usr/bin/tar
```

#### Troubleshooting

**Problem**: tar shows different behavior in WSL vs Windows

**Solution**: WSL uses GNU tar while Windows uses bsdtar. They have slightly different behaviors. Use WSL tar for Linux-compatible archives and Windows tar for Windows-specific use cases.

**Problem**: Extracting archives from Windows filesystem is slow

**Solution**: Store archives on the Linux filesystem (e.g., `/home/username`) for best performance. Accessing Windows files via `/mnt/c` has I/O overhead.

**Problem**: Permission issues when extracting to Windows drives

**Solution**: The Windows filesystem does not support Unix permissions. Extract to the Linux filesystem first, or use the `--no-same-owner` flag:

```bash
tar --no-same-owner -xvf archive.tar -C /mnt/c/destination
```

---

### Git Bash (Windows)

#### Prerequisites

- Windows 10 or Windows 11
- Git for Windows installed (Git Bash is bundled with it)

Git Bash includes GNU tar bundled at `C:\Program Files\Git\usr\bin\tar.exe`. This is separate from the Windows built-in bsdtar. When running commands in Git Bash, the GNU tar takes precedence due to PATH ordering.

#### Installation Steps

Git for Windows includes GNU tar by default. If Git for Windows is not installed:

**Install via Chocolatey (recommended):**

```powershell
choco install git -y
```

The `-y` flag automatically confirms all prompts, enabling non-interactive installation.

**Or download from the official website:**

Download from https://git-scm.com/download/win and run the installer.

After installation, launch Git Bash from the Start Menu.

#### Verification

Open Git Bash and run:

```bash
tar --version
```

Expected output (version numbers may vary):

```
tar (GNU tar) 1.35
Copyright (C) 2023 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <https://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by John Gilmore and Jay Fenlason.
```

Verify the location:

```bash
which tar
```

Expected output:

```
/usr/bin/tar
```

This corresponds to `C:\Program Files\Git\usr\bin\tar.exe` on the Windows filesystem.

#### Troubleshooting

**Problem**: tar command fails with Windows-style paths

**Solution**: Git Bash tar requires Unix-style paths. Convert Windows paths:

```bash
# WRONG - will fail
tar -cvf C:\Users\name\archive.tar files/

# CORRECT - use Unix-style paths
tar -cvf /c/Users/name/archive.tar files/
```

**Problem**: Archive paths contain mixed slashes

**Solution**: Git Bash automatically converts paths, which can cause issues. Set `MSYS_NO_PATHCONV` to prevent path conversion:

```bash
MSYS_NO_PATHCONV=1 tar -cvf archive.tar files/
```

**Problem**: `tar: command not found`

**Solution**: Git for Windows may not be installed or the Git usr/bin is not in PATH. Reinstall Git for Windows from https://git-scm.com/download/win or via Chocolatey:

```powershell
choco install git -y
```

**Problem**: Conflict between Git Bash tar and Windows tar

**Solution**: Git Bash places its tar first in PATH. To explicitly use Windows tar, use the full path:

```bash
/c/Windows/System32/tar.exe --version
```

---

## Post-Installation Configuration

tar works out of the box with no configuration required. The following tips help with common use cases:

### Common tar Commands

**Create a compressed archive (.tar.gz):**

```bash
tar -czvf archive.tar.gz directory/
```

**Extract a compressed archive:**

```bash
tar -xzvf archive.tar.gz
```

**List contents of an archive:**

```bash
tar -tvf archive.tar.gz
```

**Extract to a specific directory:**

```bash
tar -xzvf archive.tar.gz -C /destination/path
```

### Understanding tar Flags

| Flag | Meaning |
|------|---------|
| `-c` | Create a new archive |
| `-x` | Extract files from an archive |
| `-t` | List the contents of an archive |
| `-v` | Verbose output (show files being processed) |
| `-f` | Specify the archive filename |
| `-z` | Filter through gzip (for .tar.gz files) |
| `-j` | Filter through bzip2 (for .tar.bz2 files) |
| `-J` | Filter through xz (for .tar.xz files) |
| `-C` | Change to directory before operation |

### Cross-Platform Compatibility

When creating archives that will be used across different operating systems:

**On macOS (for Linux compatibility):**

```bash
tar --disable-copyfile -cvf archive.tar directory/
```

Or use GNU tar:

```bash
gtar -cvf archive.tar directory/
```

**On Linux (standard):**

```bash
tar -cvf archive.tar directory/
```

**On Windows Git Bash:**

```bash
tar -cvf archive.tar directory/
```

---

## Common Issues

### Issue: "tar: Removing leading '/' from member names"

**Symptoms**: Warning message when creating archives with absolute paths

**Solution**: This is expected behavior, not an error. tar strips leading slashes to prevent extracting files to absolute paths (security feature). To preserve absolute paths (not recommended):

```bash
tar -cvPf archive.tar /absolute/path
```

### Issue: Archive created on macOS fails to extract on Linux

**Symptoms**: Errors about extended attributes or unknown headers

**Solution**: macOS BSD tar includes Apple-specific metadata. Create archives without extended attributes:

```bash
tar --disable-copyfile --no-xattrs -cvf archive.tar directory/
```

Or install and use GNU tar on macOS:

```bash
brew install --quiet gnu-tar
gtar -cvf archive.tar directory/
```

### Issue: "tar: Error is not recoverable: exiting now"

**Symptoms**: tar exits with error during extraction

**Solution**: The archive may be corrupted or truncated. Verify the archive:

```bash
gzip -t archive.tar.gz
```

If the archive is valid, try extracting with verbose output to identify the problematic file:

```bash
tar -xzvf archive.tar.gz
```

### Issue: Permission denied when extracting

**Symptoms**: `tar: Cannot open: Permission denied`

**Solution**: Use sudo for extracting to system directories, or extract as the file owner:

```bash
sudo tar -xvf archive.tar -C /destination
```

Or extract without preserving ownership:

```bash
tar --no-same-owner -xvf archive.tar
```

### Issue: Filename too long

**Symptoms**: `tar: file name is too long`

**Solution**: This occurs with older tar formats. Use the POSIX pax format:

```bash
tar --format=posix -cvf archive.tar directory/
```

### Issue: Symlinks not extracted correctly on Windows

**Symptoms**: Symlinks become regular files or fail to extract

**Solution**: Windows has limited symlink support. Run Git Bash as Administrator for symlink creation, or extract using WSL instead.

---

## References

- [GNU tar Official Documentation](https://www.gnu.org/software/tar/manual/)
- [GNU tar Manual](https://www.gnu.org/software/tar/manual/tar.html)
- [BSD tar (libarchive) Documentation](https://www.libarchive.org/)
- [Homebrew gnu-tar Formula](https://formulae.brew.sh/formula/gnu-tar)
- [Differences Between BSD tar and GNU tar (Baeldung)](https://www.baeldung.com/linux/bsd-tar-gnu-tar-star)
- [Microsoft: Tar and Curl Come to Windows](https://devblogs.microsoft.com/commandline/tar-and-curl-come-to-windows/)
- [Ubuntu tar Manual Page](https://manpages.ubuntu.com/manpages/jammy/man1/tar.1.html)
- [Chocolatey TarTool Package](https://community.chocolatey.org/packages/tartool)
- [winget GnuWin32.Tar Package](https://winget.run/pkg/GnuWin32/Tar)
