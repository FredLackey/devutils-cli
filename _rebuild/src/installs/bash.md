# Installing Bash

## Overview

Bash (Bourne-Again SHell) is a Unix shell and command language written by Brian Fox for the GNU Project. It is the default shell on most Linux distributions and was the default shell on macOS until Catalina (10.15). Bash provides a powerful command-line interface for interacting with your operating system, running scripts, and automating tasks.

Modern Bash (version 5.x) includes significant improvements over older versions, including associative arrays, better regular expression support, the `coproc` keyword for coprocesses, improved `case` statement features, and numerous bug fixes. macOS ships with Bash 3.2 due to GPL licensing restrictions, making an upgrade essential for developers who need modern shell features.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew package manager - Install via `dev install homebrew` or directly from https://brew.sh
  - Administrative privileges (sudo access) - Required for modifying `/etc/shells` and changing default shell
  - Internet connectivity - Required to download packages from Homebrew repositories
- **Optional:** None
- **Auto-installed:**
  - Xcode Command Line Tools - Homebrew automatically installs if missing
  - Bash dependencies (ncurses, readline) - Homebrew handles these transparently

### Ubuntu (APT/Snap)
- **Required:**
  - APT package manager - Pre-installed on Ubuntu/Debian systems
  - sudo privileges - Required for package installation and system modifications
  - Internet connectivity - Required to download packages from APT repositories
- **Optional:** None
- **Auto-installed:**
  - Bash dependencies (libc6, libtinfo6, readline libraries) - APT handles these transparently

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - APT package manager - Pre-installed on Raspberry Pi OS
  - sudo privileges - Required for package installation and system modifications
  - Internet connectivity - Required to download packages from APT repositories
- **Optional:** None
- **Auto-installed:**
  - Bash dependencies (libc6, libtinfo6, readline libraries) - APT handles these for ARM architecture transparently

### Amazon Linux (DNF/YUM)
- **Required:**
  - DNF (Amazon Linux 2023, RHEL 8/9) or YUM (Amazon Linux 2) package manager - Pre-installed on these systems
  - sudo privileges - Required for package installation and system modifications
  - Internet connectivity - Required to download packages from distribution repositories
- **Optional:** None
- **Auto-installed:**
  - Bash dependencies (glibc, ncurses-libs, readline) - DNF/YUM handles these transparently

### Windows (Chocolatey/winget)
- **Required:**
  - Chocolatey package manager - Install via `dev install chocolatey` or from https://chocolatey.org/install
  - Administrator privileges - Required for installing software system-wide
  - Internet connectivity - Required to download Git for Windows package
- **Optional:** None
- **Auto-installed:**
  - Git for Windows - Contains Git Bash (installed as the `git` package)
  - MSYS2 runtime environment - Bundled with Git for Windows
  - Common Unix utilities (grep, sed, awk, find, etc.) - Included with Git for Windows
  - Bash 5.2.x - Bundled with Git for Windows

### Git Bash (Manual/Portable)
- **Required:**
  - Git for Windows already installed - Bash is bundled with this package
- **Optional:**
  - Chocolatey package manager - Only needed for automated updates via `choco upgrade git -y`
- **Auto-installed:** None (Bash is already present if Git for Windows is installed)

## Prerequisites

Before installing Bash on any platform, ensure:

1. **Administrative privileges** - Required for system-wide installation and shell registration
2. **Internet connectivity** - Required to download packages from repositories
3. **Existing shell access** - You need a working terminal to run installation commands

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager installed
- Terminal access

macOS ships with Bash 3.2, which is over 15 years old. Apple will not update the bundled Bash to version 4.0+ because newer versions are licensed under GPLv3, which Apple cannot distribute. Install a modern Bash via Homebrew to access current features.

If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Bash 5.x:

```bash
brew install --quiet bash
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts.

After installation, register the new Bash as an allowed shell and set it as your default:

```bash
# Add Homebrew Bash to the list of allowed shells
# Use the correct path based on your Mac's architecture
BREW_BASH="$(brew --prefix)/bin/bash"
echo "$BREW_BASH" | sudo tee -a /etc/shells >/dev/null

# Set Homebrew Bash as your default shell
sudo chsh -s "$BREW_BASH" "$USER"
```

**Note**: On Apple Silicon Macs (M1/M2/M3), the path is `/opt/homebrew/bin/bash`. On Intel Macs, the path is `/usr/local/bin/bash`. The command above automatically detects the correct path.

To suppress the deprecation warning when using Bash on macOS, add this line to your `~/.bash_profile`:

```bash
echo 'export BASH_SILENCE_DEPRECATION_WARNING=1' >> ~/.bash_profile
```

#### Verification

Confirm the installation succeeded:

```bash
# Check the installed version
bash --version

# Verify the default shell path
echo "$SHELL"

# Verify Homebrew Bash is in the allowed shells list
grep "$(brew --prefix)/bin/bash" /etc/shells
```

Expected output (version numbers may vary):

```
GNU bash, version 5.3.9(1)-release (aarch64-apple-darwin23.4.0)
Copyright (C) 2024 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>

This is free software; you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```

#### Troubleshooting

**Problem**: `bash: command not found` after installation

**Solution**: Homebrew may not be in your PATH. Add it by running:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For permanent fix, add the above line to your `~/.bash_profile`.

**Problem**: `chsh: /opt/homebrew/bin/bash: non-standard shell`

**Solution**: The new Bash was not added to `/etc/shells`. Add it manually:

```bash
echo "$(brew --prefix)/bin/bash" | sudo tee -a /etc/shells >/dev/null
```

**Problem**: Terminal still shows old Bash version after changing default shell

**Solution**: Close all terminal windows and open a new one. The shell change only takes effect in new sessions. Verify with:

```bash
echo "$BASH_VERSION"
```

**Problem**: Permission denied when modifying `/etc/shells`

**Solution**: Ensure you are using `sudo` with the `tee` command. If you still encounter issues, you may need to disable System Integrity Protection (SIP) temporarily, but this is rarely necessary and not recommended.

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 or later (64-bit)
- sudo privileges
- Terminal access

Ubuntu and Debian include Bash by default. The version depends on your distribution release:
- Ubuntu 24.04 LTS: Bash 5.2.21
- Ubuntu 22.04 LTS: Bash 5.1.16
- Ubuntu 20.04 LTS: Bash 5.0.17
- Debian 12: Bash 5.2.15
- Debian 11: Bash 5.1.4

#### Installation Steps

Run the following commands to install or update Bash:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y bash
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully non-interactive installation suitable for automation scripts.

Bash is the default shell on Ubuntu/Debian, so no additional configuration is needed to set it as your default shell. If you need to explicitly set Bash as the default:

```bash
sudo chsh -s /bin/bash "$USER"
```

#### Verification

Confirm the installation succeeded:

```bash
bash --version
```

Expected output (version numbers may vary based on your distribution):

```
GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)
Copyright (C) 2024 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>

This is free software; you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```

Check that Bash is your default shell:

```bash
echo "$SHELL"
```

Expected output:

```
/bin/bash
```

#### Troubleshooting

**Problem**: Package manager reports Bash is already installed

**Solution**: This is expected. To ensure you have the latest version available for your distribution:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y bash
```

**Problem**: `apt-get update` fails with repository errors

**Solution**: Your package sources may be outdated or unreachable. Try:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update --fix-missing -y
```

**Problem**: Need a newer Bash version than available in official repositories

**Solution**: Ubuntu/Debian repositories contain stable, tested versions. For newer versions, consider compiling from source:

```bash
# Install build dependencies
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential curl

# Download and extract Bash source
curl -fsSL https://ftp.gnu.org/gnu/bash/bash-5.3.tar.gz -o /tmp/bash-5.3.tar.gz
tar -xzf /tmp/bash-5.3.tar.gz -C /tmp

# Compile and install
cd /tmp/bash-5.3
./configure --prefix=/usr/local
make -j$(nproc)
sudo make install

# Clean up
rm -rf /tmp/bash-5.3 /tmp/bash-5.3.tar.gz
```

**Note**: Compiling from source installs to `/usr/local/bin/bash`. Add this to `/etc/shells` and use `chsh` to set it as your default if desired.

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 3B+ or later recommended for adequate performance
- sudo privileges
- Terminal access (via local monitor/keyboard or SSH)

Raspberry Pi OS is based on Debian, so Bash installation follows the same process as Debian/Ubuntu. The package manager handles ARM architecture automatically.

Check your architecture:

```bash
uname -m
```

Expected output: `armv7l` (32-bit) or `aarch64` (64-bit).

#### Installation Steps

Run the following commands to install or update Bash:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y bash
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully non-interactive installation suitable for automation scripts and headless deployments.

Bash is the default shell on Raspberry Pi OS, so no additional configuration is needed.

#### Verification

Confirm the installation succeeded:

```bash
bash --version
```

Expected output (version numbers may vary based on your Raspberry Pi OS version):

```
GNU bash, version 5.1.4(1)-release (arm-unknown-linux-gnueabihf)
Copyright (C) 2020 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>

This is free software; you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```

On 64-bit Raspberry Pi OS, the architecture identifier will show `aarch64-unknown-linux-gnu` instead.

#### Troubleshooting

**Problem**: Slow package installation

**Solution**: Raspberry Pi may have limited bandwidth or SD card I/O. Allow extra time or use a wired ethernet connection for faster downloads. Using a high-quality SD card (Class 10 or better) also improves performance.

**Problem**: Package manager lock file errors

**Solution**: Another process may be using apt. Wait for it to complete or remove stale lock files:

```bash
sudo rm -f /var/lib/apt/lists/lock /var/cache/apt/archives/lock /var/lib/dpkg/lock*
sudo dpkg --configure -a
```

**Problem**: Out of memory during package installation

**Solution**: Increase swap space temporarily:

```bash
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), or RHEL 8/9
- sudo privileges
- Terminal access

**Bash Versions by Distribution**:
- Amazon Linux 2023: Bash 5.2.x (pre-installed)
- Amazon Linux 2: Bash 4.2.x (pre-installed)
- RHEL 9: Bash 5.1.x (pre-installed)
- RHEL 8: Bash 4.4.x (pre-installed)

#### Installation Steps

**For Amazon Linux 2023 and RHEL 8/9 (using DNF):**

```bash
sudo dnf install -y bash
```

**For Amazon Linux 2 (using YUM):**

```bash
sudo yum install -y bash
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

To update Bash to the latest version available in your repository:

**Amazon Linux 2023 / RHEL 8/9:**

```bash
sudo dnf upgrade -y bash
```

**Amazon Linux 2:**

```bash
sudo yum update -y bash
```

**Note**: Amazon Linux 2023 uses versioned repositories that are locked to the AMI version by default. To get the latest packages, you may need to update the repository version:

```bash
sudo dnf check-release-update
# If updates are available, follow the displayed command to update
```

#### Verification

Confirm the installation succeeded:

```bash
bash --version
```

Expected output for Amazon Linux 2023 (version numbers may vary):

```
GNU bash, version 5.2.15(1)-release (x86_64-amazon-linux-gnu)
Copyright (C) 2024 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>

This is free software; you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```

Check that Bash is your default shell:

```bash
echo "$SHELL"
```

#### Troubleshooting

**Problem**: DNF/YUM reports Bash is already installed

**Solution**: This is expected on Amazon Linux and RHEL systems. To ensure you have the latest available version:

```bash
# Amazon Linux 2023 / RHEL 8/9
sudo dnf upgrade -y bash

# Amazon Linux 2
sudo yum update -y bash
```

**Problem**: `dnf: command not found` on Amazon Linux 2

**Solution**: Amazon Linux 2 uses `yum` by default. Use `yum` instead of `dnf`:

```bash
sudo yum install -y bash
```

**Problem**: Repository metadata errors

**Solution**: Clear the package manager cache and retry:

```bash
# DNF (AL2023, RHEL 8/9)
sudo dnf clean all
sudo dnf makecache

# YUM (AL2)
sudo yum clean all
sudo yum makecache
```

**Problem**: Need Bash 5.x on Amazon Linux 2 or RHEL 8

**Solution**: The official repositories contain older Bash versions. For Bash 5.x, compile from source:

```bash
# Install build dependencies
sudo yum install -y gcc make curl

# Download and extract Bash source
curl -fsSL https://ftp.gnu.org/gnu/bash/bash-5.3.tar.gz -o /tmp/bash-5.3.tar.gz
tar -xzf /tmp/bash-5.3.tar.gz -C /tmp

# Compile and install
cd /tmp/bash-5.3
./configure --prefix=/usr/local
make -j$(nproc)
sudo make install

# Clean up
rm -rf /tmp/bash-5.3 /tmp/bash-5.3.tar.gz
```

---

### Windows (Git for Windows)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Administrator privileges for installation
- Internet connectivity

**Note**: Windows does not have a native Bash shell. The recommended approach is to install Git for Windows, which includes Git Bash (a Bash emulation environment based on MSYS2). Git for Windows version 2.52.0 includes Bash 5.2.x, providing modern shell features.

#### Installation Steps

Install Git for Windows using Chocolatey. Run this command in an Administrator PowerShell or Command Prompt:

```powershell
choco install git -y --params "/GitAndUnixToolsOnPath /NoAutoCrlf /WindowsTerminal"
```

The `-y` flag automatically confirms all prompts. The parameters configure Git with commonly preferred settings:
- `/GitAndUnixToolsOnPath` - Adds Unix tools (including bash) to the Windows PATH
- `/NoAutoCrlf` - Disables automatic line ending conversion
- `/WindowsTerminal` - Adds Git Bash profile to Windows Terminal

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

After installation, close and reopen your terminal for PATH changes to take effect.

#### Verification

Open a new Command Prompt, PowerShell, or Git Bash window, then run:

```bash
bash --version
```

Expected output (version numbers may vary):

```
GNU bash, version 5.2.32(1)-release (x86_64-pc-msys)
Copyright (C) 2024 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>

This is free software; you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```

Verify Git Bash is accessible:

```powershell
where bash
```

Expected output:

```
C:\Program Files\Git\bin\bash.exe
C:\Program Files\Git\usr\bin\bash.exe
```

#### Troubleshooting

**Problem**: `bash: The term 'bash' is not recognized`

**Solution**: Open a new terminal window. The PATH is updated during installation but existing windows do not reflect this. Alternatively, refresh the environment in PowerShell:

```powershell
refreshenv
```

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: Chocolatey command not found

**Solution**: Chocolatey may not be in PATH. Close all terminal windows, open a new Administrator PowerShell, and try again. If the issue persists, reinstall Chocolatey.

**Problem**: Git Bash shows wrong Bash version

**Solution**: Multiple Bash installations may exist. Check which bash is being used:

```bash
which bash
type bash
```

Remove conflicting installations or adjust your PATH to prioritize the Git for Windows bash.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 1903 or later, or Windows 11
- WSL 2 recommended for best performance
- Administrator privileges to install WSL
- sudo privileges within the WSL distribution

WSL (Windows Subsystem for Linux) provides a full Linux environment on Windows, including a native Bash shell. The Bash version depends on which Linux distribution you install.

#### Installation Steps

If WSL is not installed, install it first from an Administrator PowerShell:

```powershell
wsl --install --no-launch
```

The `--no-launch` flag prevents automatic launch after installation, which is useful for automation scripts.

After installation completes, restart your computer. Then launch Ubuntu to complete setup:

```powershell
wsl --install -d Ubuntu --no-launch
ubuntu config --default-user root
ubuntu install --root
```

**Note**: The first launch of Ubuntu will prompt for a username and password. For non-interactive installation in automation scenarios, use the commands above to configure a root user without prompts.

Once inside the WSL Ubuntu environment, update and install Bash:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y bash
```

#### Verification

From within WSL, confirm the installation succeeded:

```bash
bash --version
```

Expected output (version numbers may vary):

```
GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)
Copyright (C) 2024 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>

This is free software; you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```

Verify Bash is the default shell:

```bash
echo "$SHELL"
```

Expected output:

```
/bin/bash
```

#### Troubleshooting

**Problem**: `wsl: command not found`

**Solution**: WSL is not enabled. Enable it from an Administrator PowerShell:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

Restart your computer after enabling these features.

**Problem**: WSL installation hangs or fails

**Solution**: Ensure virtualization is enabled in your BIOS/UEFI settings. Intel VT-x or AMD-V must be enabled for WSL 2 to function properly.

**Problem**: `apt-get update` fails inside WSL

**Solution**: DNS resolution may be failing. Create or modify `/etc/wsl.conf`:

```bash
sudo tee /etc/wsl.conf > /dev/null << 'EOF'
[network]
generateResolvConf = false
EOF

sudo rm /etc/resolv.conf
sudo tee /etc/resolv.conf > /dev/null << 'EOF'
nameserver 8.8.8.8
nameserver 8.8.4.4
EOF
```

Restart WSL from PowerShell:

```powershell
wsl --shutdown
```

**Problem**: Permission denied errors inside WSL

**Solution**: Your user may not have sudo privileges. Reset to root user temporarily:

```bash
# From Windows PowerShell
ubuntu config --default-user root
```

---

### Git Bash (Windows)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git for Windows installed (includes Git Bash)

**Note**: Git Bash is the Bash shell included with Git for Windows. If you followed the Windows installation steps above, Git Bash is already installed. This section covers using Git Bash and updating it.

Git Bash provides a BASH emulation that allows you to run Git from the command line along with common Unix utilities. It uses MSYS2 as its underlying runtime, which includes Bash 5.2.x in recent versions.

#### Installation Steps

If Git for Windows is not installed, follow the Windows (Git for Windows) section above.

To update Git Bash to the latest version, update Git for Windows using one of these methods:

**Method 1: Using Git's built-in update command (from Git Bash):**

```bash
git update-git-for-windows
```

**Note**: This command is interactive by default. For non-interactive updates, use Chocolatey (Method 2).

**Method 2: Using Chocolatey (from Administrator PowerShell):**

```powershell
choco upgrade git -y
```

The `-y` flag ensures non-interactive execution suitable for automation.

After updating, close and reopen Git Bash to use the new version.

#### Verification

Open Git Bash and confirm the Bash version:

```bash
bash --version
```

Expected output (version numbers may vary):

```
GNU bash, version 5.2.32(1)-release (x86_64-pc-msys)
Copyright (C) 2024 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>

This is free software; you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```

Check the Git version to ensure the update succeeded:

```bash
git --version
```

Expected output:

```
git version 2.52.0.windows.1
```

#### Troubleshooting

**Problem**: `git update-git-for-windows` is not a git command

**Solution**: Your Git version is too old (requires >= 2.14.2) or you are not using the official Git for Windows distribution. Update using Chocolatey instead:

```powershell
choco upgrade git -y
```

**Problem**: Git Bash shows old Bash version after update

**Solution**: Close all Git Bash windows and open a new one. The version change only takes effect in new sessions.

**Problem**: Unix commands not found in Git Bash

**Solution**: The Unix tools may not be on your PATH. Reinstall Git for Windows with the Unix tools option:

```powershell
choco uninstall git -y
choco install git -y --params "/GitAndUnixToolsOnPath"
```

**Problem**: Git Bash cannot find files in Windows paths

**Solution**: Convert Windows paths to Unix-style paths in Git Bash:

```bash
# Windows path: C:\Users\username\Documents
# Git Bash path: /c/Users/username/Documents

cd /c/Users/username/Documents
```

---

## Post-Installation Configuration

After installing Bash on any platform, consider these common configuration steps.

### Create or Update Shell Configuration Files

Bash reads configuration files in a specific order. Create these files if they do not exist:

```bash
# For login shells
touch ~/.bash_profile

# For interactive non-login shells
touch ~/.bashrc

# Ensure .bash_profile sources .bashrc for consistency
echo 'if [ -f ~/.bashrc ]; then source ~/.bashrc; fi' >> ~/.bash_profile
```

### Set Common Environment Variables

Add useful environment variables to your `~/.bashrc`:

```bash
cat >> ~/.bashrc << 'EOF'

# History configuration
export HISTSIZE=10000
export HISTFILESIZE=20000
export HISTCONTROL=ignoreboth:erasedups
shopt -s histappend

# Better defaults
export EDITOR=vim
export VISUAL=vim
export PAGER=less

# Color support
export CLICOLOR=1
export LSCOLORS=GxFxCxDxBxegedabagaced
EOF
```

### Enable Bash Completion

Install bash-completion for enhanced tab completion:

**macOS:**
```bash
brew install --quiet bash-completion@2
echo '[[ -r "$(brew --prefix)/etc/profile.d/bash_completion.sh" ]] && source "$(brew --prefix)/etc/profile.d/bash_completion.sh"' >> ~/.bash_profile
```

**Ubuntu/Debian/Raspberry Pi OS:**
```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y bash-completion
```

**Amazon Linux/RHEL:**
```bash
sudo dnf install -y bash-completion  # or: sudo yum install -y bash-completion
```

### Verify Configuration

After making changes, reload your configuration:

```bash
source ~/.bashrc
```

Check that your settings are applied:

```bash
echo "HISTSIZE: $HISTSIZE"
echo "EDITOR: $EDITOR"
```

---

## Common Issues

### Issue: Scripts Written for Bash 4/5 Fail on macOS

**Symptoms**: Scripts using associative arrays, `${var,,}` (lowercase), or other Bash 4+ features fail with syntax errors.

**Solution**: Ensure you are using Homebrew Bash, not the system Bash:

```bash
# Check which bash is being used
which bash
# Should show: /opt/homebrew/bin/bash (Apple Silicon) or /usr/local/bin/bash (Intel)

# Update your script shebang to use env
#!/usr/bin/env bash
```

### Issue: Shell Not Changing After chsh

**Symptoms**: After running `chsh`, new terminals still use the old shell.

**Solution**: The change only affects new login sessions. Log out and log back in, or restart your computer. On macOS, you may also need to update Terminal preferences to use the default login shell.

### Issue: Bash Version Mismatch Between Shells

**Symptoms**: `bash --version` shows different versions depending on how you invoke it.

**Solution**: Check all bash binaries on your system:

```bash
# List all bash locations
which -a bash

# Check each version
/bin/bash --version
/usr/local/bin/bash --version
/opt/homebrew/bin/bash --version  # macOS Apple Silicon
```

Remove or rename conflicting binaries, or ensure your PATH prioritizes the desired version.

### Issue: Permission Denied When Running Scripts

**Symptoms**: `bash: ./script.sh: Permission denied`

**Solution**: Make the script executable:

```bash
chmod +x ./script.sh
```

Or run it explicitly with bash:

```bash
bash ./script.sh
```

### Issue: Line Ending Problems (Windows/Unix)

**Symptoms**: Scripts fail with `$'\r': command not found` or similar errors.

**Solution**: Convert Windows line endings (CRLF) to Unix line endings (LF):

```bash
# Using sed
sed -i 's/\r$//' script.sh

# Or using dos2unix (if installed)
dos2unix script.sh
```

On Windows with Git, configure Git to not convert line endings:

```bash
git config --global core.autocrlf false
```

---

## References

- [GNU Bash Official Website](https://www.gnu.org/software/bash/)
- [GNU Bash Manual](https://www.gnu.org/software/bash/manual/bash.html)
- [Bash Homebrew Formula](https://formulae.brew.sh/formula/bash)
- [Ubuntu Bash Packages](https://packages.ubuntu.com/bash)
- [Git for Windows](https://gitforwindows.org/)
- [Git for Windows Silent Installation](https://github.com/git-for-windows/git/wiki/Silent-or-Unattended-Installation)
- [Microsoft WSL Documentation](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Apple Terminal Documentation](https://support.apple.com/guide/terminal/change-the-default-shell-trml113/mac)
- [Bash Release Notes](https://tiswww.case.edu/php/chet/bash/NEWS)
- [Chocolatey Git Package](https://community.chocolatey.org/packages/git)
