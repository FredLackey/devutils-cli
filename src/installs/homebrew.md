# Installing Homebrew

## Overview

Homebrew is a free and open-source package management system that simplifies the installation of software on macOS and Linux. Originally created for macOS to fill the void of a missing system package manager, Homebrew has expanded to support Linux distributions. It installs packages to their own directory and symlinks their files into standard locations, avoiding conflicts with system software.

Key features of Homebrew:

- **Simple installation**: Install software with a single command (`brew install <package>`)
- **Dependency management**: Automatically installs required dependencies
- **Binary packages (bottles)**: Pre-compiled packages for fast installation on supported platforms
- **Easy updates**: Update all installed packages with `brew upgrade`

**Platform Support Summary**:

| Platform | Support Level | Notes |
|----------|---------------|-------|
| macOS (Intel/Apple Silicon) | Full | Primary platform with complete bottle support |
| Ubuntu/Debian (x86_64) | Full | Complete bottle support via Linuxbrew |
| Amazon Linux (x86_64) | Full | Complete bottle support via Linuxbrew |
| WSL (Ubuntu on Windows) | Full | Complete bottle support via Linuxbrew |
| Raspberry Pi OS (ARM64) | Limited | No bottles; packages compile from source |
| Raspberry Pi OS (ARM32) | Minimal | Tier 3 support; requires manual Ruby installation |
| Windows (Native) | Not Supported | Use WSL for Homebrew on Windows |
| Git Bash | Not Supported | Use WSL for Homebrew on Windows |

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `/bin/bash` - Pre-installed with macOS
  - `curl` - Pre-installed with macOS
- **Optional:** None
- **Auto-installed:**
  - Xcode Command Line Tools (includes compilers, git, and build tools) - Installed automatically by the Homebrew installer if not already present

### Ubuntu (APT/Snap)
- **Required:**
  - `build-essential` - Install via `sudo apt-get install -y build-essential`
  - `procps` - Install via `sudo apt-get install -y procps`
  - `curl` - Install via `sudo apt-get install -y curl`
  - `file` - Install via `sudo apt-get install -y file`
  - `git` - Install via `sudo apt-get install -y git`
  - `/bin/bash` - Pre-installed on Ubuntu
  - `sudo` privileges
- **Optional:** None
- **Auto-installed:**
  - `tar` - Installed as dependency of build-essential

### Raspberry Pi OS (APT/Snap)
- **Required (64-bit aarch64):**
  - `build-essential` - Install via `sudo apt-get install -y build-essential`
  - `procps` - Install via `sudo apt-get install -y procps`
  - `curl` - Install via `sudo apt-get install -y curl`
  - `file` - Install via `sudo apt-get install -y file`
  - `git` - Install via `sudo apt-get install -y git`
  - `/bin/bash` - Pre-installed on Raspberry Pi OS
  - `sudo` privileges
- **Required (32-bit armv7l):**
  - All of the above, PLUS:
  - `ruby` - Install via `sudo apt-get install -y ruby`
  - `ruby-dev` - Install via `sudo apt-get install -y ruby-dev`
- **Optional:**
  - Swap space (recommended for systems with limited RAM to avoid out-of-memory errors during package compilation) - Configure via `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`
- **Auto-installed:**
  - `tar` - Installed as dependency of build-essential

### Amazon Linux (DNF/YUM)
- **Required:**
  - Development Tools group - Install via `sudo dnf groupinstall -y "Development Tools"` (AL2023) or `sudo yum groupinstall -y "Development Tools"` (AL2)
  - `procps-ng` - Install via `sudo dnf install -y procps-ng` (AL2023) or `procps` via `sudo yum install -y procps` (AL2)
  - `curl` - Install via `sudo dnf install -y curl` (AL2023) or `sudo yum install -y curl` (AL2)
  - `file` - Install via `sudo dnf install -y file` (AL2023) or `sudo yum install -y file` (AL2)
  - `git` - Install via `sudo dnf install -y git` (AL2023) or `sudo yum install -y git` (AL2)
  - `/bin/bash` - Pre-installed on Amazon Linux
  - `sudo` privileges
- **Optional:** None
- **Auto-installed:**
  - `gcc`, `g++`, `make` and various compiler dependencies - Installed via Development Tools group

### Windows (Chocolatey/winget)
- **Required:** Installation not supported on native Windows
- **Optional:** None
- **Auto-installed:** None
- **Note:** Homebrew does not run natively on Windows. Use Windows Subsystem for Linux (WSL) with Ubuntu to run Homebrew. See WSL installation instructions in the Platform-Specific Installation section below.

### Git Bash (Manual/Portable)
- **Required:** Installation not supported in Git Bash
- **Optional:** None
- **Auto-installed:** None
- **Note:** Git Bash does not provide a full Linux userspace required by Homebrew. Use Windows Subsystem for Linux (WSL) with Ubuntu to run Homebrew. See WSL installation instructions in the Platform-Specific Installation section below.

## Prerequisites

Before installing Homebrew on any platform, ensure:

1. **Internet connectivity** - Required to download the installer and packages
2. **Command-line access** - Terminal (macOS), bash shell (Linux), or WSL terminal (Windows)
3. **Administrative privileges** - Required for initial installation (sudo access on Linux)
4. **Sufficient disk space** - At least 5 GB free (Homebrew itself plus cached downloads)

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 14 (Sonoma) or later for full support (macOS 10.15-13 may work but are unsupported)
- Apple Silicon (M1/M2/M3/M4) or 64-bit Intel processor
- Command Line Tools for Xcode (installed automatically if not present)
- Bash shell available (default on macOS)

Run this command to pre-install the Command Line Tools (optional, as the Homebrew installer handles this automatically):

```bash
xcode-select --install
```

#### Installation Steps

Run the following command in Terminal to install Homebrew non-interactively:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

The `NONINTERACTIVE=1` environment variable tells the installer to run without prompting for confirmation, making it suitable for automation and scripts. The installer will:

1. Download Homebrew to `/opt/homebrew` (Apple Silicon) or `/usr/local` (Intel)
2. Install the Command Line Tools for Xcode if not already present
3. Configure the Homebrew environment

**Post-Installation PATH Configuration**:

After installation, add Homebrew to your shell PATH. The exact command depends on your processor:

**For Apple Silicon Macs (M1/M2/M3/M4):**

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
eval "$(/opt/homebrew/bin/brew shellenv)"
```

**For Intel Macs:**

```bash
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zshrc
eval "$(/usr/local/bin/brew shellenv)"
```

**Note**: The above commands assume you are using zsh (the default shell on modern macOS). If you use bash, replace `~/.zshrc` with `~/.bash_profile`.

#### Verification

Confirm Homebrew is installed and configured correctly:

```bash
brew --version
```

Expected output (version numbers may vary):

```
Homebrew 4.4.15
```

Run the diagnostic command to check for issues:

```bash
brew doctor
```

A healthy installation displays:

```
Your system is ready to brew.
```

Test installing a package:

```bash
brew install --quiet wget
wget --version
```

#### Troubleshooting

**Problem**: `brew: command not found` after installation

**Solution**: The PATH was not configured correctly. Run the shellenv command for your processor:

```bash
# Apple Silicon
eval "$(/opt/homebrew/bin/brew shellenv)"

# Intel
eval "$(/usr/local/bin/brew shellenv)"
```

Then add it to your shell configuration file as shown in the Installation Steps.

**Problem**: Xcode Command Line Tools installation hangs or fails

**Solution**: Install the Command Line Tools manually before running the Homebrew installer:

```bash
xcode-select --install
```

Wait for the installation dialog to complete, then re-run the Homebrew installation command.

**Problem**: Permission errors during installation

**Solution**: Ensure you own the Homebrew directories:

```bash
# Apple Silicon
sudo chown -R $(whoami) /opt/homebrew

# Intel
sudo chown -R $(whoami) /usr/local/Homebrew
```

**Problem**: `brew update` fails with git errors

**Solution**: Reset the Homebrew repository:

```bash
brew update-reset
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 10 (Buster) or later (64-bit x86_64)
- sudo privileges
- curl and git installed

Install the required build dependencies before installing Homebrew:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential procps curl file git
```

This command installs:
- `build-essential`: Compilers and build tools (gcc, g++, make)
- `procps`: Process utilities required by Homebrew
- `curl`: For downloading the installer
- `file`: File type detection utility
- `git`: Version control system used by Homebrew

#### Installation Steps

Run the following command to install Homebrew non-interactively:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

The installer creates the `/home/linuxbrew/.linuxbrew` directory and installs Homebrew there. This location is used (rather than a user home directory) because it enables the use of pre-compiled binary packages (bottles).

**Post-Installation PATH Configuration**:

Add Homebrew to your shell PATH:

```bash
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.bashrc
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
```

For zsh users, replace `~/.bashrc` with `~/.zshrc`.

#### Verification

Confirm Homebrew is installed correctly:

```bash
brew --version
```

Expected output (version numbers may vary):

```
Homebrew 4.4.15
```

Run diagnostics:

```bash
brew doctor
```

Expected output for a healthy installation:

```
Your system is ready to brew.
```

Test installing a package:

```bash
brew install --quiet hello
hello
```

Expected output:

```
Hello, world!
```

#### Troubleshooting

**Problem**: `brew: command not found` after installation

**Solution**: The PATH was not configured. Run:

```bash
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
```

Then add it to your shell configuration file.

**Problem**: `Error: Failure while executing; tar` during package installation

**Solution**: Ensure all build dependencies are installed:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential procps curl file git
```

**Problem**: Compilation errors when installing packages

**Solution**: Install the GCC compiler provided by Homebrew:

```bash
brew install --quiet gcc
```

**Problem**: Slow package installation (compiling from source instead of using bottles)

**Solution**: Verify your system meets the bottle requirements. Bottles are only available for x86_64 architecture. Check your architecture:

```bash
uname -m
```

If output is `x86_64`, bottles should work. If output is `aarch64` or `armv7l`, see the Raspberry Pi section.

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS Bookworm or Bullseye (64-bit recommended)
- Raspberry Pi 3B+ or later (64-bit capable hardware recommended)
- At least 2 GB RAM (4 GB recommended)
- sudo privileges

**Important Architecture Considerations**:

| Architecture | Command `uname -m` | Support Level | Binary Packages |
|--------------|-------------------|---------------|-----------------|
| 64-bit | `aarch64` | Tier 3 | No bottles available |
| 32-bit | `armv7l` | Tier 3 | No bottles; requires manual Ruby |

Homebrew on ARM Linux is a Tier 3 platform, meaning:
- It is supported on a best-effort basis
- No pre-compiled binary packages (bottles) are available
- All packages must be compiled from source
- Installation takes significantly longer than on x86_64 platforms

Verify your architecture:

```bash
uname -m
```

Install the required build dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential procps curl file git
```

#### Installation Steps

**For 64-bit Raspberry Pi OS (aarch64):**

Run the following command to install Homebrew:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Post-Installation PATH Configuration**:

```bash
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.bashrc
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
```

**For 32-bit Raspberry Pi OS (armv7l):**

Homebrew on 32-bit ARM requires manual Ruby installation because Homebrew does not distribute a Portable Ruby for this architecture.

First, install Ruby from the system package manager:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ruby ruby-dev
```

Then install Homebrew:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Configure PATH:

```bash
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.bashrc
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
```

**Note**: Package installation on Raspberry Pi will be slow because all packages compile from source. Consider using the native `apt` package manager for common tools when possible.

#### Verification

Confirm Homebrew is installed:

```bash
brew --version
```

Expected output (version numbers may vary):

```
Homebrew 4.4.15
```

Run diagnostics (expect some warnings about unsupported platform):

```bash
brew doctor
```

Test installing a package (this will compile from source and may take several minutes):

```bash
brew install --quiet hello
hello
```

#### Troubleshooting

**Problem**: `Error: No Homebrew ruby available for aarch64 processors!`

**Solution**: Install system Ruby before running the Homebrew installer:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ruby ruby-dev
```

Then re-run the Homebrew installation command.

**Problem**: Package installation extremely slow

**Solution**: This is expected behavior on ARM platforms because packages compile from source. For frequently-used tools, consider using the native `apt` package manager:

```bash
# Instead of: brew install wget
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget
```

**Problem**: Compilation fails with out-of-memory errors

**Solution**: Add swap space to your Raspberry Pi:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Problem**: `brew doctor` shows many warnings

**Solution**: Warnings about unsupported platform and missing bottles are expected on Raspberry Pi. Focus on actual errors rather than warnings.

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- 64-bit x86_64 architecture
- sudo privileges
- EC2 instance or compatible environment

**Note**: Amazon Linux 2023 uses DNF as the default package manager. Amazon Linux 2 uses YUM. The commands below use DNF; for AL2, substitute `dnf` with `yum`.

Install the required development tools and dependencies:

```bash
# For Amazon Linux 2023
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y procps-ng curl file git

# For Amazon Linux 2
sudo yum groupinstall -y "Development Tools"
sudo yum install -y procps curl file git
```

#### Installation Steps

Run the following command to install Homebrew non-interactively:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

The installer creates the `/home/linuxbrew/.linuxbrew` directory and installs Homebrew there.

**Post-Installation PATH Configuration**:

Add Homebrew to your shell PATH:

```bash
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.bashrc
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
```

#### Verification

Confirm Homebrew is installed correctly:

```bash
brew --version
```

Expected output (version numbers may vary):

```
Homebrew 4.4.15
```

Run diagnostics:

```bash
brew doctor
```

Expected output for a healthy installation:

```
Your system is ready to brew.
```

Test installing a package:

```bash
brew install --quiet hello
hello
```

Expected output:

```
Hello, world!
```

#### Troubleshooting

**Problem**: `brew: command not found` after installation

**Solution**: The PATH was not configured. Run:

```bash
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
```

Then add the line to your `~/.bashrc`.

**Problem**: Missing development tools error

**Solution**: Install the development tools group:

```bash
# Amazon Linux 2023
sudo dnf groupinstall -y "Development Tools"

# Amazon Linux 2
sudo yum groupinstall -y "Development Tools"
```

**Problem**: GCC version too old

**Solution**: Install Homebrew's GCC:

```bash
brew install --quiet gcc
```

**Problem**: Locale warnings during installation

**Solution**: Set the locale before running the installer:

```bash
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

### Windows (Chocolatey/winget)

#### Platform Note

**Homebrew does not run natively on Windows.** The Homebrew project officially supports only macOS and Linux.

To use Homebrew on Windows, install Windows Subsystem for Linux (WSL) and run Homebrew within the Linux environment. See the WSL (Ubuntu) section below for complete instructions.

**Alternative package managers for native Windows:**

For native Windows package management, use one of these tools instead:

- **winget**: Microsoft's built-in package manager (Windows 10/11)
- **Chocolatey**: Third-party community package manager

These are documented in other installation guides within this project.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 (build 19041) or higher, or Windows 11
- WSL 2 enabled (WSL 1 has known issues with Homebrew)
- Ubuntu distribution installed in WSL
- sudo privileges within WSL

**Step 1: Install WSL and Ubuntu**

Run this command in an Administrator PowerShell to install WSL with Ubuntu:

```powershell
wsl --install -d Ubuntu
```

Restart your computer when prompted. After restart, the Ubuntu setup will launch automatically. Create your UNIX username and password when prompted.

**Step 2: Verify WSL Version**

Open Ubuntu from the Start menu and verify you are running WSL 2:

```bash
wsl.exe -l -v
```

If your Ubuntu distribution shows Version 1, upgrade it to Version 2:

```powershell
wsl --set-version Ubuntu 2
```

#### Installation Steps

Open your WSL Ubuntu terminal and install the required build dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential procps curl file git
```

Run the following command to install Homebrew non-interactively:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Post-Installation PATH Configuration**:

Add Homebrew to your shell PATH:

```bash
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.bashrc
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
```

#### Verification

Confirm Homebrew is installed correctly:

```bash
brew --version
```

Expected output (version numbers may vary):

```
Homebrew 4.4.15
```

Run diagnostics:

```bash
brew doctor
```

Expected output for a healthy installation:

```
Your system is ready to brew.
```

Test installing a package:

```bash
brew install --quiet hello
hello
```

Expected output:

```
Hello, world!
```

#### Troubleshooting

**Problem**: `brew: command not found` after installation

**Solution**: The PATH was not configured. Run:

```bash
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
```

Add it to your `~/.bashrc` for persistence.

**Problem**: "WSL 1 is not supported" or compatibility warnings

**Solution**: Upgrade to WSL 2:

```powershell
# Run in PowerShell (not WSL)
wsl --set-version Ubuntu 2
```

**Problem**: Very slow disk performance

**Solution**: Store your files in the Linux filesystem (`/home/username/`) rather than the Windows filesystem (`/mnt/c/`). Accessing Windows files from WSL is significantly slower.

**Problem**: `apt-get update` fails with network errors

**Solution**: This can indicate WSL networking issues. Restart WSL:

```powershell
# Run in PowerShell
wsl --shutdown
```

Then reopen Ubuntu.

**Problem**: Line ending issues (CRLF vs LF)

**Solution**: Configure git to use Unix line endings in WSL:

```bash
git config --global core.autocrlf input
```

---

### Git Bash (Manual/Portable)

#### Platform Note

**Homebrew does not run in Git Bash.** Git Bash is a Windows terminal emulator that provides a bash-like environment but does not include a full Linux userspace required by Homebrew.

To use Homebrew on Windows, install Windows Subsystem for Linux (WSL) and run Homebrew within the Linux environment. See the WSL (Ubuntu) section above for complete instructions.

**Alternative approaches for Git Bash users:**

1. **Install WSL** - Run a full Linux environment alongside Windows and use Homebrew there
2. **Use Chocolatey** - Native Windows package manager that works from any Windows terminal including Git Bash
3. **Use winget** - Microsoft's built-in Windows package manager

---

## Post-Installation Configuration

After installing Homebrew on any platform, consider these optional but recommended configurations.

### Update Homebrew

Update Homebrew to the latest version:

```bash
brew update
```

### Install Recommended Dependencies

Homebrew recommends installing its own GCC compiler for maximum compatibility:

```bash
brew install --quiet gcc
```

### Configure Homebrew Analytics

Homebrew collects anonymous usage analytics by default. To disable analytics:

```bash
brew analytics off
```

### Configure Homebrew Auto-Update

By default, Homebrew automatically checks for updates before each `brew install` command. To disable auto-update:

```bash
echo 'export HOMEBREW_NO_AUTO_UPDATE=1' >> ~/.bashrc
source ~/.bashrc
```

### Common Homebrew Commands

| Command | Description |
|---------|-------------|
| `brew install <package>` | Install a package |
| `brew uninstall <package>` | Remove a package |
| `brew upgrade` | Upgrade all installed packages |
| `brew upgrade <package>` | Upgrade a specific package |
| `brew list` | List installed packages |
| `brew search <term>` | Search for packages |
| `brew info <package>` | Show package information |
| `brew doctor` | Check for system issues |
| `brew cleanup` | Remove old versions and cache |
| `brew update` | Update Homebrew itself |

---

## Common Issues

### Issue: Homebrew Is Slow

**Symptoms**: `brew install` or `brew update` takes a very long time

**Solutions**:

- On ARM platforms (Raspberry Pi), slowness is expected because packages compile from source
- Check your internet connection
- Disable auto-update if running many commands:

```bash
export HOMEBREW_NO_AUTO_UPDATE=1
```

- Clean up old cached files:

```bash
brew cleanup --prune=all
```

### Issue: Bottles Not Available

**Symptoms**: Packages compile from source instead of downloading pre-built bottles

**Solutions**:

- Bottles are only available for officially supported platforms (macOS Intel/Apple Silicon, Linux x86_64)
- On ARM Linux, bottles are not available; compilation from source is expected
- Verify your architecture with `uname -m`

### Issue: Permission Errors

**Symptoms**: `Permission denied` errors during installation or package operations

**Solutions**:

- Do not run `brew` with sudo (except during initial setup on some Linux systems)
- Fix ownership of Homebrew directories:

```bash
# macOS Apple Silicon
sudo chown -R $(whoami) /opt/homebrew

# macOS Intel
sudo chown -R $(whoami) /usr/local/Homebrew

# Linux
sudo chown -R $(whoami) /home/linuxbrew/.linuxbrew
```

### Issue: PATH Not Configured

**Symptoms**: `brew: command not found` after installation

**Solutions**:

Run the appropriate shellenv command for your platform:

```bash
# macOS Apple Silicon
eval "$(/opt/homebrew/bin/brew shellenv)"

# macOS Intel
eval "$(/usr/local/bin/brew shellenv)"

# Linux/WSL
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
```

Add the command to your shell configuration file (`~/.bashrc`, `~/.zshrc`, or `~/.bash_profile`).

### Issue: Conflicting Package Versions

**Symptoms**: System packages conflict with Homebrew packages

**Solutions**:

Homebrew packages take precedence over system packages when Homebrew is in your PATH. If you need to use a system package instead:

```bash
# Temporarily use system version
/usr/bin/git --version

# Or remove Homebrew from PATH for current session
export PATH=$(echo $PATH | sed 's|/home/linuxbrew/.linuxbrew/bin:||')
```

### Issue: Disk Space Full

**Symptoms**: Installation fails with "No space left on device"

**Solutions**:

Remove cached downloads and old package versions:

```bash
brew cleanup --prune=all
```

Check disk usage by Homebrew:

```bash
brew --cache
du -sh $(brew --cache)
```

---

## Uninstalling Homebrew

To completely remove Homebrew from your system, run:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"
```

The `NONINTERACTIVE=1` flag runs the uninstaller without prompting for confirmation.

After uninstallation, remove the shellenv line from your shell configuration file (`~/.bashrc`, `~/.zshrc`, or `~/.bash_profile`).

---

## References

- [Homebrew Official Website](https://brew.sh/)
- [Homebrew Installation Documentation](https://docs.brew.sh/Installation)
- [Homebrew on Linux Documentation](https://docs.brew.sh/Homebrew-on-Linux)
- [Homebrew FAQ](https://docs.brew.sh/FAQ)
- [Homebrew Installer GitHub Repository](https://github.com/Homebrew/install)
- [Homebrew Core GitHub Repository](https://github.com/Homebrew/homebrew-core)
- [WSL Installation Guide](https://learn.microsoft.com/en-us/windows/wsl/install)
- [AWS SAM Homebrew Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-homebrew.html)
