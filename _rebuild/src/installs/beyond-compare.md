# Installing Beyond Compare

## Overview

Beyond Compare is a powerful file and folder comparison utility developed by Scooter Software. It enables users to compare files, folders, and even entire drives with detailed side-by-side visualization of differences. Beyond Compare supports merging changes between two or three versions of files, synchronizing files and folders between different locations (including FTP, SFTP, WebDAV, and cloud storage), and generating comparison reports. The tool includes specialized comparison viewers for text files, binary files, images, tables, registry hives, and more. Beyond Compare is widely used by software developers, IT professionals, and anyone who needs to efficiently compare, synchronize, and merge files.

**Note**: Beyond Compare is commercial software. Downloads include both Standard and Pro functionality, with your license key unlocking the appropriate features for permanent use. A 30-day trial is available.

## Prerequisites

Before installing Beyond Compare on any platform, ensure:

1. **Internet connectivity** - Required to download the installer or packages
2. **Administrative privileges** - Required for system-wide installation on most platforms
3. **64-bit operating system** - Beyond Compare 5 requires a 64-bit (x86_64/AMD64) system on all platforms
4. **Graphical environment** - Beyond Compare is a GUI application and requires a display (X11 on Linux, GUI on Windows/macOS)

**Important**: Beyond Compare does NOT support ARM processors (including Apple Silicon natively, Raspberry Pi, or ARM-based Linux systems). On Apple Silicon Macs, it runs through Rosetta 2 translation. ARM Linux systems are not supported.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew package manager - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- **Optional:**
  - Rosetta 2 (for Apple Silicon Macs) - Usually auto-prompted by macOS when needed, or install manually via `softwareupdate --install-rosetta --agree-to-license`
- **Auto-installed:** None

### Ubuntu (APT/Snap)
- **Required:**
  - `wget` - Install via `sudo apt install wget` (installer will auto-install if missing)
- **Optional:** None
- **Auto-installed:**
  - GTK3 libraries, X11 libraries, and other GUI dependencies (handled by APT when installing the .deb package)

### Raspberry Pi OS (APT/Snap)
- **Installation not supported on this platform** - Beyond Compare does not support ARM architecture. Use alternatives like Meld (`sudo apt install meld`), KDiff3 (`sudo apt install kdiff3`), or vimdiff (`sudo apt install vim`).

### Amazon Linux (DNF/YUM)
- **Required:**
  - `wget` - Install via `sudo dnf install wget` or `sudo yum install wget` (installer will auto-install if missing)
- **Optional:** None
- **Auto-installed:**
  - GTK3 libraries, X11 libraries (libXScrnSaver), and other GUI dependencies (handled by DNF/YUM when installing the .rpm package)

### Windows (Chocolatey)
- **Required:**
  - Chocolatey package manager - Install via PowerShell (Administrator): `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
- **Optional:** None
- **Auto-installed:**
  - .NET Framework and other Windows runtime dependencies (handled by Chocolatey)

### Git Bash (Manual/Portable)
- **Required:**
  - Beyond Compare installed on Windows - See Windows section above for installation via Chocolatey or download from https://www.scootersoftware.com/download
- **Optional:**
  - Chocolatey (for automated installation from Git Bash) - See Windows section for installation
- **Auto-installed:** None (Git Bash inherits the Windows PATH and uses the Windows installation)

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager installed
- Terminal access
- Apple Silicon Macs: Rosetta 2 will be used automatically (Beyond Compare is Intel-only)

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Beyond Compare:

```bash
brew install --cask --quiet beyond-compare
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts. The `--cask` flag is required because Beyond Compare is a macOS application (not a command-line formula).

#### Verification

Confirm the installation succeeded:

```bash
ls /Applications/Beyond\ Compare.app && echo "Beyond Compare installed successfully"
```

Launch Beyond Compare to verify it runs:

```bash
open -a "Beyond Compare"
```

#### Installing Command Line Tools

After installation, enable command-line access by launching Beyond Compare and selecting:

**Beyond Compare menu > Install Command Line Tools**

This creates two command-line shortcuts:
- `/usr/local/bin/bcomp` - Launches comparison and waits for completion (useful for scripts)
- `/usr/local/bin/bcompare` - Launches comparison and returns immediately

Verify command-line tools:

```bash
bcompare --version
```

#### Troubleshooting

**Problem**: `beyond-compare: cask not found`

**Solution**: Update Homebrew cask definitions:

```bash
brew update
```

**Problem**: Application crashes on Apple Silicon Mac

**Solution**: Ensure Rosetta 2 is installed:

```bash
softwareupdate --install-rosetta --agree-to-license
```

**Problem**: `bcomp: command not found` after installing command-line tools

**Solution**: Ensure `/usr/local/bin` is in your PATH. Add to `~/.zshrc`:

```bash
export PATH="/usr/local/bin:$PATH"
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 or later (64-bit x86_64 only)
- X Window System (graphical environment required)
- sudo privileges
- `wget` installed (pre-installed on most systems)

#### Installation Steps

Download and install Beyond Compare using the official .deb package:

```bash
wget -q -O /tmp/bcompare.deb "https://www.scootersoftware.com/files/bcompare-5.1.7.31736_amd64.deb" && \
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/bcompare.deb && \
rm -f /tmp/bcompare.deb
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures no interactive prompts appear during installation. The `-y` flag automatically confirms package installation.

**Note**: Installing the .deb package automatically adds the Scooter Software repository to your system for future updates.

#### Preventing Automatic Repository Addition

If you do not want the Scooter Software repository added to your system, create a configuration file before installation:

```bash
sudo touch /etc/default/bcompare
wget -q -O /tmp/bcompare.deb "https://www.scootersoftware.com/files/bcompare-5.1.7.31736_amd64.deb" && \
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/bcompare.deb && \
rm -f /tmp/bcompare.deb
```

#### Verification

Confirm the installation succeeded:

```bash
bcompare --version
```

Expected output (version numbers may vary):

```
Beyond Compare Version 5.1.7 (build 31736)
```

Alternatively, verify the package is installed:

```bash
dpkg -l | grep bcompare
```

#### Troubleshooting

**Problem**: `wget: command not found`

**Solution**: Install wget first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget
```

**Problem**: Dependency errors during installation

**Solution**: Install missing dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -f
```

**Problem**: Beyond Compare fails to launch with display errors

**Solution**: Ensure you have a graphical environment. Beyond Compare requires X11. If running over SSH, use X11 forwarding:

```bash
ssh -X user@host
```

**Problem**: Cannot run bcompare command

**Solution**: The binary is installed to `/usr/bin/bcompare`. Verify it is in PATH:

```bash
which bcompare
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

**Important**: Beyond Compare does NOT support ARM architecture. Raspberry Pi devices use ARM processors (armv7l or aarch64), which are not supported by Beyond Compare.

This is a fundamental limitation of Beyond Compare, not a packaging issue. Scooter Software has stated they do not have plans to support ARM CPUs due to limited development resources.

#### Alternative Solutions

For file comparison needs on Raspberry Pi, use one of these open-source alternatives that support ARM:

**Meld** (graphical diff tool):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y meld
```

**KDiff3** (graphical diff and merge tool):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y kdiff3
```

**vimdiff** (terminal-based diff tool):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim
```

Then use `vimdiff file1 file2` to compare files.

#### Verification

Verify your architecture to confirm ARM:

```bash
uname -m
```

If this outputs `armv7l` or `aarch64`, your system is ARM-based and Beyond Compare is not available.

#### Troubleshooting

**Problem**: User attempts to install the amd64.deb package on Raspberry Pi

**Solution**: This will fail with an architecture mismatch error. There is no workaround. Use one of the alternative tools listed above.

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023, Amazon Linux 2, RHEL 8/9/10, Fedora 41+, or CentOS Stream (64-bit x86_64 only)
- X Window System (graphical environment required)
- sudo or root privileges
- `wget` installed

**Note**: Amazon Linux EC2 instances typically run headless (no GUI). Beyond Compare requires a graphical environment. For server use cases, consider using command-line diff tools instead, or access Beyond Compare via X11 forwarding.

#### Installation Steps

**For Amazon Linux 2023, RHEL 8/9, Fedora:**

Download and install Beyond Compare using the official .rpm package:

```bash
wget -q -O /tmp/bcompare.rpm "https://www.scootersoftware.com/files/bcompare-5.1.7.31736.x86_64.rpm" && \
sudo dnf install -y /tmp/bcompare.rpm && \
rm -f /tmp/bcompare.rpm
```

**For Amazon Linux 2, RHEL 7, CentOS 7:**

Use YUM instead of DNF:

```bash
wget -q -O /tmp/bcompare.rpm "https://www.scootersoftware.com/files/bcompare-5.1.7.31736.x86_64.rpm" && \
sudo yum install -y /tmp/bcompare.rpm && \
rm -f /tmp/bcompare.rpm
```

The `-y` flag automatically confirms package installation without prompts.

**Note**: Installing the .rpm package automatically adds the Scooter Software repository to your system for future updates.

#### Preventing Automatic Repository Addition

If you do not want the Scooter Software repository added to your system:

```bash
sudo touch /etc/default/bcompare
wget -q -O /tmp/bcompare.rpm "https://www.scootersoftware.com/files/bcompare-5.1.7.31736.x86_64.rpm" && \
sudo dnf install -y /tmp/bcompare.rpm && \
rm -f /tmp/bcompare.rpm
```

#### Verification

Confirm the installation succeeded:

```bash
bcompare --version
```

Expected output (version numbers may vary):

```
Beyond Compare Version 5.1.7 (build 31736)
```

Alternatively, verify the package is installed:

```bash
rpm -qa | grep bcompare
```

#### Troubleshooting

**Problem**: `wget: command not found`

**Solution**: Install wget first:

```bash
sudo dnf install -y wget
# or for AL2/RHEL7:
sudo yum install -y wget
```

**Problem**: Dependency errors mentioning GTK or display libraries

**Solution**: Install required GUI dependencies:

```bash
sudo dnf groupinstall -y "Server with GUI"
# or for minimal install:
sudo dnf install -y gtk3 libXScrnSaver
```

**Problem**: Beyond Compare fails to start on headless server

**Solution**: Beyond Compare requires X11. For remote access, use X11 forwarding:

```bash
ssh -X user@host
bcompare
```

Or install a desktop environment and use VNC/RDP.

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Chocolatey package manager installed
- Administrator PowerShell or Command Prompt

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install beyondcompare -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Note**: The Chocolatey package automatically detects your system locale and installs the appropriate language version (English, German, French, Japanese, or Chinese).

#### Installation Parameters

For customized installation, use these optional parameters:

```powershell
choco install beyondcompare -y --params="'/CurrentUser'"
```

Available parameters:
- `/CurrentUser` - Install for current user only (default installs for all users)
- `/LCID:nnn` - Force specific language (e.g., `/LCID:1031` for German)

#### Verification

Open a new Command Prompt or PowerShell window (required for PATH to update), then run:

```powershell
bcompare --version
```

Expected output (version numbers may vary):

```
Beyond Compare Version 5.1.7 (build 31736)
```

Verify the application is installed:

```powershell
Get-Command bcompare
```

#### Troubleshooting

**Problem**: `bcompare: The term 'bcompare' is not recognized`

**Solution**: Open a new terminal window. The PATH is updated during installation but existing windows do not reflect this. Alternatively, refresh the environment:

```powershell
refreshenv
```

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: Chocolatey command not found

**Solution**: Chocolatey may not be in PATH. Close all terminal windows, open a new Administrator PowerShell, and try again.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows Subsystem for Linux with Ubuntu installed
- WSL 2 recommended for best performance
- X Server running on Windows (for GUI support) or WSLg enabled (Windows 11)
- sudo privileges within WSL

**Important**: Beyond Compare is a GUI application. WSL requires an X server or WSLg to display graphical applications.

#### Installation Steps

WSL Ubuntu follows the same installation process as native Ubuntu:

```bash
wget -q -O /tmp/bcompare.deb "https://www.scootersoftware.com/files/bcompare-5.1.7.31736_amd64.deb" && \
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/bcompare.deb && \
rm -f /tmp/bcompare.deb
```

#### Setting Up GUI Support

**For Windows 11 with WSLg (built-in GUI support):**

WSLg is enabled by default. No additional setup is required.

**For Windows 10 (requires X Server):**

Install an X server on Windows such as VcXsrv or X410, then configure the DISPLAY variable:

```bash
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
```

Add this line to `~/.bashrc` for persistence.

#### Verification

Confirm the installation succeeded:

```bash
bcompare --version
```

Expected output (version numbers may vary):

```
Beyond Compare Version 5.1.7 (build 31736)
```

Test launching the GUI (requires X server or WSLg):

```bash
bcompare &
```

#### Troubleshooting

**Problem**: `cannot open display` error when launching Beyond Compare

**Solution**: For Windows 11, ensure WSL is updated:

```bash
wsl --update
```

For Windows 10, ensure your X server is running and the DISPLAY variable is set correctly.

**Problem**: Graphics appear garbled or slow

**Solution**: WSLg provides better performance than external X servers. If on Windows 10, consider upgrading to Windows 11 or using VcXsrv with GPU acceleration disabled.

**Problem**: Beyond Compare hangs on startup

**Solution**: Reset WSL:

```bash
wsl --shutdown
```

Then restart your WSL terminal.

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Beyond Compare installed on Windows (see Windows section above)

**Note**: Git Bash on Windows does not require a separate Beyond Compare installation. Git Bash inherits the Windows PATH, so once Beyond Compare is installed on Windows via Chocolatey or the official installer, it is automatically available in Git Bash.

#### Installation Steps

If Beyond Compare is already installed on Windows, it should be available in Git Bash. To install from Git Bash using Chocolatey (if Chocolatey is installed on Windows):

```bash
/c/ProgramData/chocolatey/bin/choco.exe install beyondcompare -y
```

Alternatively, download and run the installer silently:

```bash
curl -L -o /tmp/BCompare.exe "https://www.scootersoftware.com/files/BCompare-5.1.7.31736.exe" && \
/tmp/BCompare.exe /VERYSILENT /NORESTART /ALLUSERS /SUPPRESSMSGBOXES
```

The installer switches ensure completely silent installation:
- `/VERYSILENT` - No UI shown during installation
- `/NORESTART` - Do not restart computer after installation
- `/ALLUSERS` - Install for all users
- `/SUPPRESSMSGBOXES` - Suppress all message boxes

After installation, close and reopen Git Bash for PATH changes to take effect.

#### Verification

Confirm Beyond Compare is accessible from Git Bash:

```bash
bcompare --version
```

Expected output (version numbers may vary):

```
Beyond Compare Version 5.1.7 (build 31736)
```

Verify the executable path:

```bash
which bcompare
```

Expected output:

```
/c/Program Files/Beyond Compare 5/bcompare
```

#### Configuring Git to Use Beyond Compare

Beyond Compare integrates well with Git as a diff and merge tool. Configure Git to use it:

```bash
git config --global diff.tool bc
git config --global difftool.bc.path "/c/Program Files/Beyond Compare 5/bcomp.exe"
git config --global difftool.prompt false

git config --global merge.tool bc
git config --global mergetool.bc.path "/c/Program Files/Beyond Compare 5/bcomp.exe"
git config --global mergetool.bc.trustExitCode true
```

Test the configuration:

```bash
git difftool HEAD~1
```

#### Troubleshooting

**Problem**: `bcompare: command not found` in Git Bash

**Solution**: The Windows PATH may not be fully inherited. Add the Beyond Compare directory explicitly to your `~/.bashrc`:

```bash
export PATH="$PATH:/c/Program Files/Beyond Compare 5"
```

**Problem**: Git difftool shows path errors

**Solution**: Use Windows-style paths in Git configuration or escape spaces properly:

```bash
git config --global difftool.bc.path "C:/Program Files/Beyond Compare 5/bcomp.exe"
```

**Problem**: Silent installer exits but Beyond Compare is not installed

**Solution**: The silent installer requires Administrator privileges. Open Git Bash as Administrator by right-clicking on the shortcut and selecting "Run as administrator".

---

## Post-Installation Configuration

After installing Beyond Compare on any platform, you may want to configure several optional features.

### Registering Your License

Beyond Compare includes a 30-day trial. To register a purchased license:

1. Open Beyond Compare
2. Go to **Help > Enter Key** (Windows/Linux) or **Beyond Compare > Enter Key** (macOS)
3. Enter your license key

For silent registration during deployment, create a license file. Refer to Scooter Software's Network Setup guide for enterprise deployment options.

### Configuring as Default Diff/Merge Tool

#### For Git (All Platforms)

Configure Git to use Beyond Compare for diffs and merges:

```bash
# Set Beyond Compare as diff tool
git config --global diff.tool bc
git config --global difftool.prompt false

# Set Beyond Compare as merge tool
git config --global merge.tool bc
git config --global mergetool.bc.trustExitCode true
```

Usage:
- `git difftool` - View diff in Beyond Compare
- `git mergetool` - Resolve merge conflicts in Beyond Compare

#### For SVN

Beyond Compare can be configured as the external diff tool for Subversion. Add to your SVN config file (`~/.subversion/config` on Unix, `%APPDATA%\Subversion\config` on Windows):

```ini
[helpers]
diff-cmd = /path/to/bcomp
```

### Session File Defaults

Beyond Compare uses sessions to save comparison configurations. Default session locations:

- **Windows**: `%APPDATA%\Scooter Software\Beyond Compare 5\`
- **macOS**: `~/Library/Application Support/Beyond Compare 5/`
- **Linux**: `~/.config/bcompare5/`

---

## Common Issues

### Issue: Beyond Compare Runs Slowly with Large Files

**Symptoms**: UI becomes unresponsive when comparing very large files or directories with many files.

**Solution**: Adjust comparison settings:

1. Go to **Tools > Options > Comparison**
2. Enable "Quick compare" option for large directory comparisons
3. Disable "Compare contents" for initial scans
4. Increase memory allocation if available in options

### Issue: Character Encoding Problems

**Symptoms**: Special characters display incorrectly, or files show as entirely different when they are not.

**Solution**: Set the correct encoding:

1. Open the file comparison
2. Go to **Format > Encoding**
3. Select the correct encoding (UTF-8 is recommended for most cases)

### Issue: Line Ending Differences Flagged as Changes

**Symptoms**: Files appear different due to Windows (CRLF) vs Unix (LF) line endings.

**Solution**: Configure Beyond Compare to ignore line ending differences:

1. Go to **Session > Session Settings**
2. Under "Misc" tab, check "Ignore line endings"

### Issue: Network/Cloud Storage Access Fails

**Symptoms**: Unable to connect to FTP, SFTP, or cloud storage locations.

**Solution**: Verify network connectivity and credentials. For FTP/SFTP:

1. Go to **Tools > Options > FTP**
2. Verify proxy settings if behind a corporate firewall
3. Check that the server address and port are correct

### Issue: Beyond Compare Not Found After Installation

**Symptoms**: Terminal cannot find `bcompare` command after installation.

**Solution**: The installation path may not be in your system PATH. Verify installation location and add to PATH:

**Linux**:
```bash
export PATH="$PATH:/usr/bin"
```

**Windows** (PowerShell):
```powershell
$env:PATH += ";C:\Program Files\Beyond Compare 5"
```

---

## Uninstallation

### macOS

```bash
brew uninstall --cask beyond-compare
```

### Ubuntu/Debian

```bash
sudo apt remove -y bcompare
```

### Amazon Linux/RHEL

```bash
sudo dnf remove -y bcompare
# or for AL2/RHEL7:
sudo yum remove -y bcompare
```

### Windows

```powershell
choco uninstall beyondcompare -y
```

---

## References

- [Scooter Software Official Website](https://www.scootersoftware.com/)
- [Beyond Compare Download Page](https://www.scootersoftware.com/download)
- [Beyond Compare Linux Installation Guide](https://www.scootersoftware.com/kb/linux_install)
- [Beyond Compare macOS Command Line Tools](https://www.scootersoftware.com/support.php?zz=kb_OSXInstallCLT)
- [Beyond Compare Homebrew Cask](https://formulae.brew.sh/cask/beyond-compare)
- [Beyond Compare Chocolatey Package](https://community.chocolatey.org/packages/beyondcompare)
- [Beyond Compare Version Control Integration](https://www.scootersoftware.com/support.php?zz=kb_vcs)
- [Beyond Compare Command Line Reference](https://www.scootersoftware.com/v4help/command_line_reference.html)
- [Scooter Software Forums](https://forum.scootersoftware.com/)
