# Installing tmux

## Overview

tmux is a terminal multiplexer that allows you to create, access, and control multiple terminal sessions from a single screen. Originally developed by Nicholas Marriott and first released in 2007, tmux has become an essential tool for developers, system administrators, and power users who work extensively in the command line.

tmux enables you to:

- Run multiple terminal sessions within a single window
- Detach from sessions and reattach later (even from a different computer)
- Split your terminal into multiple panes for side-by-side work
- Keep processes running after disconnecting from SSH
- Share terminal sessions with other users
- Create persistent workspaces that survive terminal crashes

The current stable version is tmux 3.6a. This guide documents tmux installation procedures for all platforms supported by DevUtils CLI.

## Prerequisites

Before installing tmux on any platform, ensure:

1. **Internet connectivity** - Required to download tmux packages
2. **Administrative privileges** - Required for system-wide installation
3. **Terminal access** - Required to run installation commands

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma or later recommended)
- Homebrew package manager installed
- Command line access via Terminal.app or iTerm2

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install tmux:

```bash
brew install --quiet tmux
```

The `--quiet` flag suppresses non-essential output, making the installation suitable for automation and scripts.

Homebrew automatically installs the required dependencies (libevent, ncurses, and utf8proc) as part of the installation process.

#### Verification

Confirm the installation succeeded:

```bash
tmux -V
```

Expected output (version numbers may vary):

```
tmux 3.6a
```

Verify the Homebrew version is being used:

```bash
which tmux
```

Expected output for Apple Silicon Macs:

```
/opt/homebrew/bin/tmux
```

Expected output for Intel Macs:

```
/usr/local/bin/tmux
```

#### Troubleshooting

**Problem**: `tmux: command not found` after installation

**Solution**: Ensure Homebrew's bin directory is in your PATH:

```bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

For Intel Macs, use `/usr/local/bin` instead of `/opt/homebrew/bin`.

**Problem**: `brew: command not found`

**Solution**: Homebrew is not installed or not in PATH. Install Homebrew first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Problem**: Outdated version of tmux

**Solution**: Update Homebrew and upgrade tmux:

```bash
brew update && brew upgrade tmux
```

**Problem**: Permission errors during installation

**Solution**: Homebrew should not require sudo. If you encounter permission errors, fix Homebrew permissions:

```bash
sudo chown -R $(whoami) /opt/homebrew
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- Internet connectivity

Ubuntu and Debian include tmux in their default repositories. The repository version is stable and well-tested, though it may not be the absolute latest release.

#### Installation Steps

Run the following commands to install tmux:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tmux
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures no interactive prompts appear during installation, making this suitable for scripts and automation. The `-y` flag automatically confirms the installation.

#### Verification

Confirm the installation succeeded:

```bash
tmux -V
```

Expected output (version numbers may vary based on your distribution):

```
tmux 3.4
```

Verify the installation location:

```bash
which tmux
```

Expected output:

```
/usr/bin/tmux
```

#### Troubleshooting

**Problem**: `E: Unable to locate package tmux`

**Solution**: Update your package lists first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Older version of tmux than expected

**Solution**: Ubuntu and Debian repositories prioritize stability over bleeding-edge versions. If you need the latest version, build from source. First, install the build dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git automake build-essential libevent-dev libncurses5-dev bison pkg-config
```

Then build tmux:

```bash
git clone https://github.com/tmux/tmux.git
cd tmux
sh autogen.sh
./configure && make
sudo make install
```

**Problem**: `tmux: need UTF-8 locale` error

**Solution**: Ensure your locale is set correctly:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y locales
sudo locale-gen en_US.UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

**Problem**: Package conflicts or broken dependencies

**Solution**: Fix broken packages before installing:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -f
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tmux
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye recommended)
- Raspberry Pi 3B+ or later (any model supported by Raspberry Pi OS)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so tmux installation follows the Debian/APT method. tmux is available in the default repositories and works on both 32-bit (armhf) and 64-bit (arm64) architectures.

#### Installation Steps

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM
- `armv7l` = 32-bit ARM

Install tmux using APT:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tmux
```

The installation command is identical for both 32-bit and 64-bit Raspberry Pi OS.

#### Verification

Confirm the installation succeeded:

```bash
tmux -V
```

Expected output (version numbers may vary):

```
tmux 3.3a
```

Note: Raspberry Pi OS repositories may contain a slightly older version than Ubuntu or Homebrew. This is expected and the version provided is fully functional.

Verify the installation location:

```bash
which tmux
```

Expected output:

```
/usr/bin/tmux
```

#### Troubleshooting

**Problem**: Installation is slow

**Solution**: Raspberry Pi SD cards can be slow. Use a high-quality SD card (Class 10 or A1/A2 rated) or boot from USB/SSD for better performance.

**Problem**: `E: Unable to fetch some archives`

**Solution**: Network connectivity issues. Check your internet connection and retry:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tmux
```

**Problem**: `tmux: invalid LC_ALL, LC_CTYPE or LANG` error

**Solution**: Reconfigure your locales:

```bash
sudo dpkg-reconfigure locales
```

If the error persists, set the locale manually:

```bash
echo 'export LANG=en_US.UTF-8' >> ~/.bashrc
echo 'export LC_ALL=en_US.UTF-8' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: tmux version is very old

**Solution**: Ensure your Raspberry Pi OS is up to date:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tmux
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- EC2 instance or compatible environment

Amazon Linux 2023 uses DNF as the default package manager. Amazon Linux 2 uses YUM. tmux is included in the default Amazon Linux repositories.

**Important**: Amazon Linux 2 reaches end of support on June 30, 2026. Migrate to Amazon Linux 2023 for long-term support.

#### Installation Steps

**For Amazon Linux 2023 (AL2023):**

```bash
sudo dnf install -y tmux
```

**For Amazon Linux 2 (AL2):**

```bash
sudo yum install -y tmux
```

The `-y` flag automatically confirms installation, enabling non-interactive execution suitable for automation and scripts.

#### Verification

Confirm the installation succeeded:

```bash
tmux -V
```

Expected output (version numbers may vary):

```
tmux 3.2a
```

Verify the installation location:

```bash
which tmux
```

Expected output:

```
/usr/bin/tmux
```

#### Troubleshooting

**Problem**: `No match for argument: tmux`

**Solution**: Update the package cache and retry:

```bash
# For AL2023
sudo dnf makecache
sudo dnf install -y tmux

# For AL2
sudo yum makecache
sudo yum install -y tmux
```

**Problem**: tmux version is older than expected

**Solution**: Amazon's repositories prioritize stability over bleeding-edge versions. If you need the latest version, build from source:

```bash
# Install dependencies
sudo dnf install -y git automake gcc make libevent-devel ncurses-devel bison pkg-config

# Build tmux
git clone https://github.com/tmux/tmux.git
cd tmux
sh autogen.sh
./configure && make
sudo make install
```

For Amazon Linux 2, replace `dnf` with `yum` in the dependency installation command.

**Problem**: `Cannot find a valid baseurl for repo`

**Solution**: Network or repository configuration issue. Check connectivity:

```bash
# For AL2023
sudo dnf check-update

# For AL2
sudo yum check-update
```

**Problem**: Permission denied errors

**Solution**: Ensure you are using sudo:

```bash
sudo dnf install -y tmux
```

---

### Windows (WSL Recommended)

#### Prerequisites

- Windows 10 version 2004 or higher (Build 19041+), or Windows 11
- Administrator access to install WSL
- WSL 2 with Ubuntu distribution

**Important**: tmux is a Unix-native application and does not run natively on Windows. The recommended approach is to use Windows Subsystem for Linux (WSL), which provides a full Linux environment where tmux runs properly.

Native Windows alternatives like Cygwin or MSYS2 can run tmux, but WSL provides better integration and performance.

#### Installation Steps

**Step 1: Install WSL with Ubuntu**

Open PowerShell as Administrator and run:

```powershell
wsl --install
```

This command installs WSL 2 with Ubuntu as the default distribution. Restart your computer when prompted.

**Step 2: Set up Ubuntu**

After restart, Ubuntu will launch automatically. Complete the initial setup by creating a username and password.

**Step 3: Install tmux in WSL Ubuntu**

Open Ubuntu (from Start Menu or Windows Terminal) and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tmux
```

#### Verification

Confirm the installation succeeded within WSL:

```bash
tmux -V
```

Expected output (version numbers may vary):

```
tmux 3.4
```

Start a tmux session to verify it works:

```bash
tmux new-session -s test
```

Press `Ctrl+b` then `d` to detach from the session.

#### Troubleshooting

**Problem**: `wsl --install` fails or WSL not available

**Solution**: Enable WSL manually:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

Restart your computer, then set WSL 2 as default:

```powershell
wsl --set-default-version 2
```

**Problem**: Ubuntu not installed with WSL

**Solution**: Install Ubuntu manually:

```powershell
wsl --install -d Ubuntu
```

**Problem**: tmux sessions not persisting after closing Windows Terminal

**Solution**: tmux sessions run inside WSL, which may shut down when no terminals are open. Keep WSL running in the background, or reattach to existing sessions:

```bash
tmux attach-session -t test
```

**Problem**: Display issues or terminal not rendering correctly

**Solution**: Windows Terminal provides the best tmux experience. Install it from the Microsoft Store or via winget:

```powershell
winget install --id Microsoft.WindowsTerminal --silent --accept-package-agreements --accept-source-agreements
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

WSL runs Ubuntu (or another Linux distribution) within Windows. tmux must be installed within WSL, as it does not share binaries with Windows.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tmux
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures no interactive prompts appear during installation.

#### Verification

Confirm the installation succeeded:

```bash
tmux -V
```

Expected output (version numbers may vary):

```
tmux 3.4
```

Verify the installation location:

```bash
which tmux
```

Expected output:

```
/usr/bin/tmux
```

Test tmux by creating a new session:

```bash
tmux new-session -s test
```

#### Troubleshooting

**Problem**: `Cannot connect to server` error when running tmux

**Solution**: The tmux server may not be running. This can happen if the `/tmp` directory has permission issues. Check permissions:

```bash
ls -la /tmp
```

If needed, fix permissions:

```bash
sudo chmod 1777 /tmp
```

**Problem**: tmux not persisting between WSL sessions

**Solution**: WSL may terminate background processes when all terminals are closed. Enable systemd in WSL to keep services running:

```bash
echo -e "[boot]\nsystemd=true" | sudo tee /etc/wsl.conf
```

Then restart WSL from PowerShell:

```powershell
wsl --shutdown
```

**Problem**: Copy/paste not working in tmux

**Solution**: Enable mouse mode and configure clipboard integration. Add to your `~/.tmux.conf`:

```bash
set -g mouse on
set -g set-clipboard on
```

**Problem**: Colors not displaying correctly

**Solution**: Ensure your terminal supports 256 colors. Add to your `~/.bashrc`:

```bash
export TERM=xterm-256color
```

Then reload:

```bash
source ~/.bashrc
```

---

### Git Bash (MSYS2 Method)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git for Windows installed (provides Git Bash)
- MSYS2 installed for obtaining tmux binaries
- Administrator access

**Important**: Git Bash is a minimal MSYS2 environment bundled with Git for Windows. It does not include tmux by default, but you can add tmux by copying binaries from a full MSYS2 installation. tmux only works with the MinTTY terminal (git-bash.exe), not with cmd.exe or PowerShell-based Git prompts.

#### Installation Steps

**Step 1: Install MSYS2**

Download and install MSYS2 from https://www.msys2.org/. Run the installer and complete the setup.

**Step 2: Install tmux in MSYS2**

Open the MSYS2 MSYS terminal and run:

```bash
pacman -Sy --noconfirm tmux
```

The `--noconfirm` flag enables non-interactive installation without prompts.

**Step 3: Copy tmux binaries to Git Bash**

Copy the tmux executable and required DLLs from MSYS2 to Git for Windows:

```bash
# Run these commands in MSYS2 terminal
cp /usr/bin/tmux.exe "/c/Program Files/Git/usr/bin/"
cp /usr/bin/msys-event*.dll "/c/Program Files/Git/usr/bin/"
```

Note: If your Git installation is in a different location, adjust the path accordingly.

**Step 4: Verify the copy**

Close and reopen Git Bash, then run:

```bash
tmux -V
```

#### Verification

Confirm tmux is accessible in Git Bash:

```bash
tmux -V
```

Expected output (version numbers may vary):

```
tmux 3.6a
```

Start a tmux session to verify it works:

```bash
tmux new-session -s test
```

#### Troubleshooting

**Problem**: `open terminal failed: not a terminal` error

**Solution**: tmux requires the MinTTY terminal. Launch Git Bash using `git-bash.exe` (the MinTTY-based terminal), not `bash.exe` or Git from cmd/PowerShell. Look for "Git Bash" in the Start Menu.

**Problem**: `tmux.exe - System Error: The code execution cannot proceed because msys-event-2-1-7.dll was not found`

**Solution**: Copy the missing DLL files from MSYS2. The exact DLL names may vary by version:

```bash
# In MSYS2 terminal, list event DLLs
ls /usr/bin/msys-event*.dll

# Copy all event DLLs
cp /usr/bin/msys-event*.dll "/c/Program Files/Git/usr/bin/"
```

**Problem**: `tmux: command not found` after copying files

**Solution**: Ensure you copied to the correct directory and restart Git Bash:

```bash
# Verify tmux exists
ls "/c/Program Files/Git/usr/bin/tmux.exe"
```

If the file exists, close all Git Bash windows and reopen.

**Problem**: tmux works but displays incorrectly

**Solution**: Set the TERM variable in your `~/.bashrc`:

```bash
echo 'export TERM=xterm-256color' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Copy/paste not working

**Solution**: MinTTY handles copy/paste differently. Use `Ctrl+Insert` to copy and `Shift+Insert` to paste, or enable mouse support in tmux:

```bash
echo 'set -g mouse on' >> ~/.tmux.conf
```

---

## Post-Installation Configuration

After installing tmux on any platform, consider these configurations to enhance your workflow.

### Create a Configuration File

tmux reads configuration from `~/.tmux.conf`. Create this file to customize tmux behavior:

```bash
touch ~/.tmux.conf
```

### Common Configuration Options

Add these settings to `~/.tmux.conf` for a better experience:

```bash
# Enable mouse support
set -g mouse on

# Set prefix key to Ctrl+a (more ergonomic than default Ctrl+b)
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# Start window numbering at 1 (easier to reach)
set -g base-index 1
setw -g pane-base-index 1

# Enable 256 color support
set -g default-terminal "screen-256color"

# Increase scrollback buffer size
set -g history-limit 10000

# Reduce escape time for faster command sequences
set -sg escape-time 10

# Enable focus events for terminals that support it
set -g focus-events on

# Reload configuration with prefix + r
bind r source-file ~/.tmux.conf \; display-message "Config reloaded"
```

### Reload Configuration

After editing `~/.tmux.conf`, reload without restarting tmux:

```bash
tmux source-file ~/.tmux.conf
```

Or, if you added the keybinding above, press `prefix + r`.

### Basic tmux Commands

Start a new session:

```bash
tmux new-session -s mysession
```

List sessions:

```bash
tmux list-sessions
```

Attach to an existing session:

```bash
tmux attach-session -t mysession
```

Detach from a session (from within tmux):

Press `Ctrl+b` then `d`

Kill a session:

```bash
tmux kill-session -t mysession
```

---

## Common Issues

### Issue: "no server running on /tmp/tmux-1000/default"

**Symptoms**: tmux commands fail with "no server running" error

**Solutions**:

- Start a new tmux session:

```bash
tmux new-session
```

- Check if the tmux socket directory exists and has correct permissions:

```bash
ls -la /tmp/tmux-$(id -u)
```

- If permissions are wrong, fix them:

```bash
chmod 700 /tmp/tmux-$(id -u)
```

### Issue: "terminal not suitable" or "open terminal failed"

**Symptoms**: tmux refuses to start with terminal-related errors

**Solutions**:

- Ensure you are running tmux from a proper terminal emulator, not from a script or non-interactive shell

- Set the TERM variable:

```bash
export TERM=xterm-256color
tmux
```

- On Windows Git Bash, use MinTTY (git-bash.exe), not cmd.exe or PowerShell

### Issue: Colors not displaying correctly

**Symptoms**: tmux shows wrong colors or no colors

**Solutions**:

- Set 256-color terminal in your shell profile:

```bash
export TERM=xterm-256color
```

- Add to `~/.tmux.conf`:

```bash
set -g default-terminal "screen-256color"
```

### Issue: tmux session lost after SSH disconnect

**Symptoms**: Cannot reattach to tmux sessions after network interruption

**Solutions**:

- Ensure you detached properly before disconnecting. If the connection was interrupted, the session should still exist

- List existing sessions:

```bash
tmux list-sessions
```

- Reattach to the session:

```bash
tmux attach-session -t 0
```

- If sessions appear stale, kill and recreate:

```bash
tmux kill-server
tmux new-session
```

### Issue: Keys not working correctly (especially on macOS)

**Symptoms**: Function keys, Home, End, or other special keys not working

**Solutions**:

- Add to `~/.tmux.conf`:

```bash
set-window-option -g xterm-keys on
```

- For macOS Terminal.app, enable "Use Option as Meta key" in Terminal preferences

### Issue: "sessions should be nested with care" warning

**Symptoms**: Warning appears when starting tmux inside an existing tmux session

**Solutions**:

- This is a safety warning to prevent accidental nesting. If you intentionally want nested sessions, use:

```bash
tmux new-session -t mysession
```

- To disable the warning, unset the TMUX variable (not recommended for beginners):

```bash
unset TMUX
tmux
```

---

## References

- [tmux Official GitHub Repository](https://github.com/tmux/tmux)
- [tmux Official Wiki](https://github.com/tmux/tmux/wiki)
- [tmux Installation Guide](https://github.com/tmux/tmux/wiki/Installing)
- [tmux Manual Page](https://man7.org/linux/man-pages/man1/tmux.1.html)
- [Homebrew tmux Formula](https://formulae.brew.sh/formula/tmux)
- [MSYS2 tmux Package](https://packages.msys2.org/packages/tmux)
- [Ubuntu tmux Package](https://packages.ubuntu.com/search?keywords=tmux)
- [Microsoft WSL Documentation](https://learn.microsoft.com/en-us/windows/wsl/)
