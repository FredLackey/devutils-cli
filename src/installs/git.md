# Installing Git

## Overview

Git is a free and open-source distributed version control system designed to handle everything from small to very large projects with speed and efficiency. Originally created by Linus Torvalds in 2005 for Linux kernel development, Git has become the most widely used version control system in the world.

Git enables developers to:

- Track changes in source code during software development
- Coordinate work among multiple developers
- Maintain a complete history of all changes
- Branch and merge code with minimal friction
- Work offline and sync changes when connected

This guide documents Git installation procedures for all platforms supported by DevUtils CLI.

## Prerequisites

Before installing Git on any platform, ensure:

1. **Internet connectivity** - Required to download Git packages
2. **Administrative privileges** - Required for system-wide installation
3. **Terminal access** - Required to run installation commands

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma or later recommended)
- Homebrew package manager installed
- Command line access via Terminal.app or iTerm2

macOS may include a pre-installed version of Git via Xcode Command Line Tools. However, Homebrew typically provides a more recent version. This guide documents the Homebrew installation method.

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Git:

```bash
brew install --quiet git
```

The `--quiet` flag suppresses non-essential output, making the installation suitable for automation and scripts.

#### Verification

Confirm the installation succeeded:

```bash
git --version
```

Expected output (version numbers may vary):

```
git version 2.52.0
```

Verify the Homebrew version is being used (not the system version):

```bash
which git
```

Expected output for Apple Silicon Macs:

```
/opt/homebrew/bin/git
```

Expected output for Intel Macs:

```
/usr/local/bin/git
```

#### Troubleshooting

**Problem**: `git --version` shows an older version after installation

**Solution**: The system version of Git (from Xcode Command Line Tools) may be taking precedence. Ensure Homebrew's bin directory is in your PATH before `/usr/bin`:

```bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

For Intel Macs, use `/usr/local/bin` instead of `/opt/homebrew/bin`.

**Problem**: `brew: command not found`

**Solution**: Homebrew is not installed or not in PATH. Install Homebrew first, then add it to your PATH:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
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

Ubuntu and Debian include Git in their default repositories. For the latest stable version, use the Git Core PPA (Ubuntu) or the default repository (Debian).

#### Installation Steps

**Step 1: Update package lists and install Git**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures no interactive prompts appear during installation, making this suitable for scripts and automation.

**Step 2 (Optional): Install the latest stable version via PPA (Ubuntu only)**

The default Ubuntu repositories may contain an older version of Git. To install the latest stable version:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:git-core/ppa
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

#### Verification

Confirm the installation succeeded:

```bash
git --version
```

Expected output (version numbers may vary):

```
git version 2.52.0
```

Verify the installation location:

```bash
which git
```

Expected output:

```
/usr/bin/git
```

#### Troubleshooting

**Problem**: `E: Unable to locate package git`

**Solution**: Update your package lists:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: PPA installation fails on Debian

**Solution**: PPAs are Ubuntu-specific. On Debian, use the default repository or compile from source. The default repository version is typically sufficient for most use cases.

**Problem**: `add-apt-repository: command not found`

**Solution**: Install the software-properties-common package:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common
```

**Problem**: Old version of Git despite using PPA

**Solution**: Ensure the PPA is active and update:

```bash
sudo add-apt-repository -y ppa:git-core/ppa
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y git
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye recommended)
- Raspberry Pi 3B+ or later (any model supported by Raspberry Pi OS)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so Git installation follows the Debian/APT method. Git is available in the default repositories and works on both 32-bit (armhf) and 64-bit (arm64) architectures.

#### Installation Steps

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM
- `armv7l` = 32-bit ARM

Install Git using APT:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

The installation command is identical for both 32-bit and 64-bit Raspberry Pi OS.

#### Verification

Confirm the installation succeeded:

```bash
git --version
```

Expected output (version numbers may vary):

```
git version 2.39.2
```

Note: Raspberry Pi OS repositories may contain a slightly older version than Ubuntu PPA or Homebrew. This is expected and the version provided is fully functional.

Verify the installation location:

```bash
which git
```

Expected output:

```
/usr/bin/git
```

#### Troubleshooting

**Problem**: Installation is slow

**Solution**: Raspberry Pi SD cards can be slow. Use a high-quality SD card (Class 10 or A1/A2 rated) or boot from USB/SSD for better performance.

**Problem**: `E: Unable to fetch some archives`

**Solution**: Network connectivity issues. Check your internet connection and retry:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

**Problem**: Package conflicts or broken dependencies

**Solution**: Fix broken packages before installing:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -f
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

**Problem**: Git version is very old

**Solution**: Ensure your Raspberry Pi OS is up to date:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- EC2 instance or compatible environment

Amazon Linux 2023 uses DNF as the default package manager. Amazon Linux 2 uses YUM. Git is included in the default Amazon Linux repositories.

**Important**: Amazon Linux 2 reaches end of support on June 30, 2026. Migrate to Amazon Linux 2023 for long-term support.

#### Installation Steps

**For Amazon Linux 2023 (AL2023):**

```bash
sudo dnf install -y git
```

**For Amazon Linux 2 (AL2):**

```bash
sudo yum install -y git
```

The `-y` flag automatically confirms installation, enabling non-interactive execution.

#### Verification

Confirm the installation succeeded:

```bash
git --version
```

Expected output (version numbers may vary):

```
git version 2.40.1
```

Verify the installation location:

```bash
which git
```

Expected output:

```
/usr/bin/git
```

#### Troubleshooting

**Problem**: `No match for argument: git` on Amazon Linux 2

**Solution**: Update the yum cache and retry:

```bash
sudo yum makecache
sudo yum install -y git
```

**Problem**: Git version is older than expected

**Solution**: Amazon's repositories prioritize stability over bleeding-edge versions. The version provided is tested and compatible with Amazon Linux. If you require a newer version, compile from source.

**Problem**: `Cannot find a valid baseurl for repo`

**Solution**: Network or repository configuration issue. Check connectivity and repository settings:

```bash
# For AL2023
sudo dnf check-update

# For AL2
sudo yum check-update
```

**Problem**: Permission denied errors

**Solution**: Ensure you are using sudo:

```bash
sudo dnf install -y git
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 1903 or higher (64-bit), or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install git -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation suitable for automation and scripts.

**Optional**: Install Git with additional Unix tools in PATH:

```powershell
choco install git -y --params "'/GitAndUnixToolsOnPath'"
```

This adds common Unix utilities (like `ls`, `cat`, `grep`) to your Windows PATH alongside Git.

After installation, close and reopen your terminal to ensure PATH changes take effect.

#### Verification

Open a new Command Prompt or PowerShell window, then run:

```powershell
git --version
```

Expected output (version numbers may vary):

```
git version 2.52.0.windows.1
```

Verify the installation location:

```powershell
where git
```

Expected output:

```
C:\Program Files\Git\cmd\git.exe
```

#### Troubleshooting

**Problem**: `git: command not found` or `'git' is not recognized`

**Solution**: Close and reopen your terminal window. If the problem persists, verify Git is in your PATH:

```powershell
$env:PATH -split ';' | Select-String -Pattern 'Git'
```

If Git is not listed, add it manually:

```powershell
$env:PATH += ";C:\Program Files\Git\cmd"
```

To make this permanent, add the path via System Properties > Environment Variables.

**Problem**: Chocolatey installation fails

**Solution**: Ensure you are running PowerShell as Administrator. Right-click PowerShell and select "Run as administrator".

**Problem**: SSL/TLS errors during installation

**Solution**: Update your security protocols:

```powershell
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
choco install git -y
```

**Problem**: Git installed but Git Bash not working

**Solution**: Git Bash is installed with Git. Access it from the Start Menu or run:

```powershell
"C:\Program Files\Git\bin\bash.exe"
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

WSL runs Ubuntu (or another Linux distribution) within Windows. Git must be installed separately within WSL, as it does not share binaries with Windows Git.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

**Optional**: Install the latest stable version via PPA:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:git-core/ppa
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

#### Verification

Confirm the installation succeeded:

```bash
git --version
```

Expected output (version numbers may vary):

```
git version 2.52.0
```

Verify the installation location:

```bash
which git
```

Expected output:

```
/usr/bin/git
```

#### Troubleshooting

**Problem**: Git version differs between WSL and Windows

**Solution**: This is expected behavior. WSL and Windows maintain separate Git installations. Use the appropriate Git for each environment:

- Inside WSL terminal: Use Linux Git (`/usr/bin/git`)
- In Windows PowerShell/CMD: Use Windows Git (`C:\Program Files\Git\cmd\git.exe`)

**Problem**: Git Credential Manager issues between WSL and Windows

**Solution**: Configure Git to use Windows Git Credential Manager from within WSL:

```bash
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

**Problem**: Line ending issues (CRLF vs LF)

**Solution**: Configure Git to handle line endings appropriately for WSL:

```bash
git config --global core.autocrlf input
```

**Problem**: Permission errors in WSL

**Solution**: Ensure you are using sudo for installation:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit or ARM64)
- Administrator access for installation
- Internet connectivity

Git Bash is a terminal emulator for Windows that provides a Bash shell environment along with Git. It is included with Git for Windows and does not require a separate installation.

**Note**: Git Bash is automatically installed when you install Git on Windows via Chocolatey or the official installer. This section documents the Chocolatey method for consistency with other Windows installations.

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install git -y
```

This installs:

- Git command-line tools
- Git Bash (Bash emulation environment)
- Git GUI (graphical interface)
- Git Credential Manager

After installation, close and reopen your terminal to ensure PATH changes take effect.

**Launching Git Bash**:

- From Start Menu: Search for "Git Bash"
- From Command Prompt: Run `"C:\Program Files\Git\bin\bash.exe"`
- From File Explorer: Right-click in a folder and select "Git Bash Here" (if context menu integration was enabled)

#### Verification

Open Git Bash from the Start Menu, then run:

```bash
git --version
```

Expected output (version numbers may vary):

```
git version 2.52.0.windows.1
```

Verify Bash is working:

```bash
echo $BASH_VERSION
```

Expected output (version numbers may vary):

```
5.2.26(1)-release
```

#### Troubleshooting

**Problem**: "Git Bash Here" context menu option is missing

**Solution**: This option is only available if enabled during installation. To add it retroactively, reinstall Git with the context menu option:

```powershell
choco uninstall git -y
choco install git -y --params "'/GitAndUnixToolsOnPath /WindowsTerminal'"
```

**Problem**: `the input device is not a TTY` error when running interactive commands

**Solution**: Git Bash's mintty terminal has TTY compatibility issues with some commands. Use the `winpty` prefix:

```bash
winpty docker run -it ubuntu bash
```

Or add an alias to your `~/.bashrc`:

```bash
echo 'alias docker="winpty docker"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Path conversion issues (forward slashes being converted)

**Solution**: Git Bash automatically converts Unix-style paths to Windows paths. To prevent this, use double leading slashes or set `MSYS_NO_PATHCONV`:

```bash
# Use double leading slash
/c/Users/username/project

# Or disable path conversion for a command
MSYS_NO_PATHCONV=1 some-command /path/to/file
```

**Problem**: Git Bash is slow to start

**Solution**: Disable Git status in the prompt by editing `~/.bashrc`:

```bash
export GIT_PS1_SHOWDIRTYSTATE=
export GIT_PS1_SHOWUNTRACKEDFILES=
```

---

## Post-Installation Configuration

After installing Git on any platform, configure your identity. This information is included in every commit you create.

### Configure User Identity

Set your name and email address:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Verify your configuration:

```bash
git config --global --list
```

### Configure Default Branch Name

Set the default branch name for new repositories (recommended: `main`):

```bash
git config --global init.defaultBranch main
```

### Configure Line Endings

Configure how Git handles line endings:

**On macOS and Linux:**

```bash
git config --global core.autocrlf input
```

**On Windows:**

```bash
git config --global core.autocrlf true
```

### Configure Default Editor

Set your preferred text editor for commit messages:

```bash
# For VS Code
git config --global core.editor "code --wait"

# For Vim
git config --global core.editor "vim"

# For Nano
git config --global core.editor "nano"
```

### Configure Credential Storage

Enable credential caching to avoid re-entering passwords:

**On macOS:**

```bash
git config --global credential.helper osxkeychain
```

**On Linux:**

```bash
git config --global credential.helper cache
```

**On Windows:**

Git Credential Manager is installed automatically with Git for Windows and is the default credential helper.

---

## Common Issues

### Issue: "Please tell me who you are" Error

**Symptoms**: Git refuses to commit with the message "Please tell me who you are"

**Solution**: Configure your user identity:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Issue: SSL Certificate Errors

**Symptoms**: `SSL certificate problem: unable to get local issuer certificate`

**Solution**: This often occurs in corporate environments with proxy servers. Configure Git to use the system certificate store:

```bash
git config --global http.sslBackend schannel  # Windows
git config --global http.sslBackend openssl   # macOS/Linux
```

**Warning**: Do not disable SSL verification (`http.sslVerify false`) as this creates security vulnerabilities.

### Issue: Permission Denied (publickey) When Cloning

**Symptoms**: `Permission denied (publickey)` when cloning from GitHub/GitLab

**Solution**: SSH keys are not configured. Generate an SSH key and add it to your Git hosting service:

```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

Then copy the public key to your Git hosting service:

```bash
cat ~/.ssh/id_ed25519.pub
```

### Issue: Git Commands Are Slow

**Symptoms**: Git operations (status, diff, log) are slow

**Solutions**:

- **Large repositories**: Enable Git's filesystem monitor:

  ```bash
  git config --global core.fsmonitor true
  ```

- **Many files**: Enable Git's untracked cache:

  ```bash
  git config --global core.untrackedCache true
  ```

- **Windows/WSL**: Store repositories on the native filesystem (Windows filesystem for Windows Git, Linux filesystem for WSL Git)

### Issue: "fatal: not a git repository"

**Symptoms**: Git commands fail with "fatal: not a git repository"

**Solution**: You are not in a Git repository directory. Either navigate to a repository or initialize one:

```bash
# Initialize a new repository
git init

# Or clone an existing repository
git clone https://github.com/user/repo.git
```

---

## References

- [Git Official Website](https://git-scm.com/)
- [Git Official Documentation](https://git-scm.com/doc)
- [Git Installation for macOS](https://git-scm.com/download/mac)
- [Git Installation for Windows](https://git-scm.com/download/win)
- [Git Installation for Linux](https://git-scm.com/download/linux)
- [Git for Windows Project](https://gitforwindows.org/)
- [Homebrew Git Formula](https://formulae.brew.sh/formula/git)
- [Chocolatey Git Package](https://community.chocolatey.org/packages/git)
- [Ubuntu Git PPA](https://launchpad.net/~git-core/+archive/ubuntu/ppa)
- [Microsoft Learn: Git on WSL](https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-git)
- [Amazon Linux Documentation](https://docs.aws.amazon.com/linux/)
