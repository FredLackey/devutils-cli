# Installing gitego

## Overview

gitego is a Git identity manager and automatic profile switcher that eliminates the risk of committing to a repository with the wrong user identity. It allows you to define separate profiles for work, personal projects, and clients, then automatically switches between them based on your working directory.

Key features include:

- **Automatic profile switching**: Configure profiles to activate automatically when you enter a specific directory
- **Unified identity management**: A single profile manages your commit author (user.name, email), authentication method (SSH keys), and API token (PAT)
- **Secure credential storage**: Personal Access Tokens are stored in your operating system's native keychain (macOS Keychain, Windows Credential Manager, or Linux Secret Service), never in plaintext configuration files
- **Cross-platform support**: Works natively on macOS, Windows, and Linux

gitego uses Git's `includeIf` directive for identity switching and acts as a Git credential helper for HTTPS authentication.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `homebrew` - Install from https://brew.sh
  - `git` - Install via `brew install git` (usually pre-installed with Xcode Command Line Tools)
- **Optional:** None
- **Auto-installed:**
  - `go` (version 1.24+) - Automatically installed via `brew install go` if not present or version is too old

### Ubuntu (APT/Snap)
- **Required:**
  - `git` - Install via `sudo apt-get install -y git`
  - `wget` - Install via `sudo apt-get install -y wget` (usually pre-installed)
- **Optional:** None
- **Auto-installed:**
  - Go 1.24+ - Downloaded directly from https://go.dev/dl/go1.24.0.linux-amd64.tar.gz and installed to /usr/local/go
  - `libsecret-1-0` - Installed via `sudo apt-get install -y libsecret-1-0` for secure PAT storage

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `git` - Install via `sudo apt-get install -y git`
  - `wget` - Install via `sudo apt-get install -y wget` (usually pre-installed)
- **Optional:** None
- **Auto-installed:**
  - Go 1.24+ - Downloaded directly from https://go.dev/dl/ (arm64 or armv6l variant based on detected architecture) and installed to /usr/local/go
  - `libsecret-1-0` - Installed via `sudo apt-get install -y libsecret-1-0` for secure PAT storage

### Amazon Linux (DNF/YUM)
- **Required:**
  - `git` - Install via `sudo dnf install -y git` (AL2023) or `sudo yum install -y git` (AL2)
- **Optional:** None
- **Auto-installed:**
  - `wget` - Installed via `sudo dnf install -y wget` or `sudo yum install -y wget` if not present
  - Go 1.24+ - Downloaded directly from https://go.dev/dl/go1.24.0.linux-amd64.tar.gz and installed to /usr/local/go
  - `libsecret` - Attempted installation via `sudo dnf install -y libsecret` or `sudo yum install -y libsecret` for secure PAT storage (may fail on headless servers, which is expected)

### Windows (Chocolatey/winget)
- **Required:**
  - `git` - Install via `choco install git -y` or `winget install --id Git.Git --silent`
  - `chocolatey` OR `winget` - At least one package manager must be installed. Install Chocolatey from https://chocolatey.org/install
- **Optional:** None
- **Auto-installed:**
  - `go` (version 1.24+) - Installed via `choco install golang` or `winget install --id GoLang.Go` if not present or version is too old

### Git Bash (Manual/Portable)
- **Required:**
  - `git` - Install Git for Windows from https://git-scm.com/downloads
  - `go` (version 1.24+) - Must be pre-installed on Windows via `choco install golang -y` or `winget install --id GoLang.Go --silent`
- **Optional:** None
- **Auto-installed:** None (Git Bash inherits Windows environment, so dependencies must be installed on Windows first)

## Prerequisites

Before installing gitego on any platform, ensure:

1. **Git installed and configured** - gitego manages Git identities, so Git must be present
2. **Internet connectivity** - Required to download Go and gitego
3. **Terminal/shell access** - All installation is performed via command line

**Critical Requirement**: Go 1.24 or later must be installed. gitego is a Go application installed via `go install`. Each platform section below includes Go installation steps.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- Git installed (included with macOS Command Line Tools)

If Homebrew is not installed, install it first (this command is non-interactive after initial installation):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

**Step 1: Install Go**

Install Go using Homebrew:

```bash
brew install --quiet go
```

Verify Go is installed and meets the version requirement:

```bash
go version
```

Expected output should show Go 1.24 or later.

**Step 2: Ensure Go bin directory is in PATH**

Add the Go bin directory to your PATH by adding this line to your shell profile. For zsh (default on modern macOS):

```bash
echo 'export PATH="$PATH:$HOME/go/bin"' >> ~/.zshrc && source ~/.zshrc
```

For bash:

```bash
echo 'export PATH="$PATH:$HOME/go/bin"' >> ~/.bash_profile && source ~/.bash_profile
```

**Step 3: Install gitego**

Install gitego using Go's package manager:

```bash
go install github.com/bgreenwell/gitego@latest
```

**Step 4: Configure Git to use gitego as credential helper**

Clear any existing credential helpers and set gitego as the primary handler:

```bash
git config --global credential.helper ""
git config --global --add credential.helper "!gitego credential"
```

#### Verification

Confirm gitego is installed:

```bash
gitego --version
```

Expected output:

```
gitego version 0.1.1
```

Test the credential helper configuration:

```bash
git config --global --get-all credential.helper
```

Expected output:

```
!gitego credential
```

#### Troubleshooting

**Problem**: `gitego: command not found`

**Solution**: The Go bin directory is not in your PATH. Verify the PATH includes `~/go/bin`:

```bash
echo $PATH | tr ':' '\n' | grep go
```

If not present, add it to your shell profile:

```bash
echo 'export PATH="$PATH:$HOME/go/bin"' >> ~/.zshrc && source ~/.zshrc
```

**Problem**: `go install` fails with version error

**Solution**: Your Go version is too old. Update Go:

```bash
brew upgrade go
```

**Problem**: Credential helper not working

**Solution**: Verify the configuration is correct:

```bash
git config --global --get-all credential.helper
```

If multiple entries exist, clear and reconfigure:

```bash
git config --global --unset-all credential.helper
git config --global credential.helper ""
git config --global --add credential.helper "!gitego credential"
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 or later, or Debian 11 (Bullseye) or later
- sudo privileges
- Git installed

Install Git if not present:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

#### Installation Steps

**Step 1: Install Go**

The version of Go in Ubuntu/Debian repositories is often outdated. Download and install Go directly from the official source to ensure you have version 1.24 or later:

```bash
# Download Go 1.24 (adjust version as needed for newer releases)
wget -q https://go.dev/dl/go1.24.0.linux-amd64.tar.gz -O /tmp/go.tar.gz

# Remove any existing Go installation and extract new version
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf /tmp/go.tar.gz

# Clean up downloaded archive
rm /tmp/go.tar.gz
```

**Step 2: Configure PATH**

Add Go to your PATH:

```bash
echo 'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"' >> ~/.bashrc && source ~/.bashrc
```

Verify Go is installed correctly:

```bash
go version
```

Expected output should show Go 1.24 or later.

**Step 3: Install gitego**

Install gitego using Go's package manager:

```bash
go install github.com/bgreenwell/gitego@latest
```

**Step 4: Configure Git to use gitego as credential helper**

Clear any existing credential helpers and set gitego as the primary handler:

```bash
git config --global credential.helper ""
git config --global --add credential.helper "!gitego credential"
```

**Step 5: Install libsecret for secure credential storage**

gitego uses the Linux Secret Service for secure PAT storage. Install the required library:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libsecret-1-0
```

#### Verification

Confirm gitego is installed:

```bash
gitego --version
```

Expected output:

```
gitego version 0.1.1
```

Test the credential helper configuration:

```bash
git config --global --get-all credential.helper
```

Expected output:

```
!gitego credential
```

#### Troubleshooting

**Problem**: `gitego: command not found`

**Solution**: The Go bin directory is not in your PATH. Add it:

```bash
echo 'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"' >> ~/.bashrc && source ~/.bashrc
```

**Problem**: Go version is too old

**Solution**: The system Go package is outdated. Remove it and install from official tarball:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y golang-go
wget -q https://go.dev/dl/go1.24.0.linux-amd64.tar.gz -O /tmp/go.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
```

**Problem**: Secure credential storage fails

**Solution**: Ensure you have a running secret service (like GNOME Keyring):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnome-keyring
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
- Raspberry Pi 3B+ or later (64-bit capable hardware)
- sudo privileges
- Git installed

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit (use arm64 Go binary)
- `armv7l` = 32-bit (use armv6l Go binary)

Install Git if not present:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

#### Installation Steps

**Step 1: Install Go**

Download the appropriate Go binary for your Raspberry Pi architecture.

**For 64-bit Raspberry Pi OS (aarch64):**

```bash
wget -q https://go.dev/dl/go1.24.0.linux-arm64.tar.gz -O /tmp/go.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
```

**For 32-bit Raspberry Pi OS (armv7l):**

```bash
wget -q https://go.dev/dl/go1.24.0.linux-armv6l.tar.gz -O /tmp/go.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
```

**Step 2: Configure PATH**

Add Go to your PATH:

```bash
echo 'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"' >> ~/.bashrc && source ~/.bashrc
```

Verify Go is installed correctly:

```bash
go version
```

Expected output should show Go 1.24 or later.

**Step 3: Install gitego**

Install gitego using Go's package manager:

```bash
go install github.com/bgreenwell/gitego@latest
```

**Note**: Compilation on Raspberry Pi may take several minutes due to limited processing power.

**Step 4: Configure Git to use gitego as credential helper**

Clear any existing credential helpers and set gitego as the primary handler:

```bash
git config --global credential.helper ""
git config --global --add credential.helper "!gitego credential"
```

**Step 5: Install libsecret for secure credential storage**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libsecret-1-0
```

#### Verification

Confirm gitego is installed:

```bash
gitego --version
```

Expected output:

```
gitego version 0.1.1
```

#### Troubleshooting

**Problem**: `go install` fails with "exec format error"

**Solution**: You downloaded the wrong architecture binary. Check your architecture with `uname -m` and download the correct Go tarball (arm64 for aarch64, armv6l for armv7l).

**Problem**: Compilation is extremely slow or fails with out of memory

**Solution**: Raspberry Pi has limited resources. Increase swap space:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

Then retry the installation.

**Problem**: `gitego: command not found`

**Solution**: Ensure Go bin directory is in PATH:

```bash
echo 'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"' >> ~/.bashrc && source ~/.bashrc
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- Git installed

Install Git if not present:

```bash
# For Amazon Linux 2023
sudo dnf install -y git

# For Amazon Linux 2
sudo yum install -y git
```

#### Installation Steps

**Step 1: Install Go**

The Go version in Amazon Linux repositories may be outdated. Download and install Go directly from the official source:

```bash
wget -q https://go.dev/dl/go1.24.0.linux-amd64.tar.gz -O /tmp/go.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
```

**Step 2: Configure PATH**

Add Go to your PATH:

```bash
echo 'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"' >> ~/.bashrc && source ~/.bashrc
```

Verify Go is installed correctly:

```bash
go version
```

Expected output should show Go 1.24 or later.

**Step 3: Install gitego**

Install gitego using Go's package manager:

```bash
go install github.com/bgreenwell/gitego@latest
```

**Step 4: Configure Git to use gitego as credential helper**

Clear any existing credential helpers and set gitego as the primary handler:

```bash
git config --global credential.helper ""
git config --global --add credential.helper "!gitego credential"
```

**Step 5: Install libsecret for secure credential storage (optional)**

For secure PAT storage on headless servers, install libsecret:

```bash
# For Amazon Linux 2023
sudo dnf install -y libsecret

# For Amazon Linux 2
sudo yum install -y libsecret
```

**Note**: On headless servers without a graphical environment, the secret service may not be available. In this case, gitego will still function for identity switching, but PAT storage may require alternative configuration.

#### Verification

Confirm gitego is installed:

```bash
gitego --version
```

Expected output:

```
gitego version 0.1.1
```

Test the credential helper configuration:

```bash
git config --global --get-all credential.helper
```

Expected output:

```
!gitego credential
```

#### Troubleshooting

**Problem**: `gitego: command not found`

**Solution**: The Go bin directory is not in your PATH. Add it:

```bash
echo 'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"' >> ~/.bashrc && source ~/.bashrc
```

**Problem**: `wget: command not found`

**Solution**: Install wget:

```bash
# For Amazon Linux 2023
sudo dnf install -y wget

# For Amazon Linux 2
sudo yum install -y wget
```

**Problem**: Secret service not available on headless server

**Solution**: gitego still works for identity switching without a secret service. For PAT management on headless servers, consider using SSH keys instead, or configure a headless secret service like `pass`.

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 version 1809 or later, or Windows 11
- Administrator PowerShell or Command Prompt
- Git for Windows installed
- Chocolatey or winget package manager

If Git is not installed, install it first:

```powershell
choco install git -y
```

Or with winget:

```powershell
winget install --id Git.Git --silent --accept-package-agreements --accept-source-agreements
```

#### Installation Steps

**Step 1: Install Go**

Using Chocolatey (run in Administrator PowerShell):

```powershell
choco install golang -y
```

Using winget:

```powershell
winget install --id GoLang.Go --silent --accept-package-agreements --accept-source-agreements
```

**Step 2: Refresh environment variables**

Close and reopen your terminal, or in PowerShell run:

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

Verify Go is installed:

```powershell
go version
```

Expected output should show Go 1.24 or later.

**Step 3: Install gitego**

Install gitego using Go's package manager:

```powershell
go install github.com/bgreenwell/gitego@latest
```

**Step 4: Add Go bin to PATH**

The Go bin directory needs to be in your PATH. Add it permanently:

```powershell
$gopath = [System.Environment]::GetEnvironmentVariable("GOPATH", "User")
if (-not $gopath) { $gopath = "$env:USERPROFILE\go" }
$binPath = "$gopath\bin"
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$binPath*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;$binPath", "User")
}
```

Close and reopen your terminal for the PATH change to take effect.

**Step 5: Configure Git to use gitego as credential helper**

Clear any existing credential helpers and set gitego as the primary handler:

```powershell
git config --global credential.helper ""
git config --global --add credential.helper "!gitego credential"
```

#### Verification

Confirm gitego is installed:

```powershell
gitego --version
```

Expected output:

```
gitego version 0.1.1
```

Test the credential helper configuration:

```powershell
git config --global --get-all credential.helper
```

Expected output:

```
!gitego credential
```

#### Troubleshooting

**Problem**: `gitego: The term 'gitego' is not recognized`

**Solution**: The Go bin directory is not in your PATH. Add it and restart your terminal:

```powershell
$gopath = "$env:USERPROFILE\go"
$binPath = "$gopath\bin"
[System.Environment]::SetEnvironmentVariable("Path", "$env:Path;$binPath", "User")
```

Then close and reopen PowerShell.

**Problem**: `go install` fails with network error

**Solution**: Check your internet connection and proxy settings. If behind a corporate proxy:

```powershell
$env:HTTP_PROXY = "http://proxy.example.com:8080"
$env:HTTPS_PROXY = "http://proxy.example.com:8080"
go install github.com/bgreenwell/gitego@latest
```

**Problem**: Go version is outdated

**Solution**: Update Go using Chocolatey:

```powershell
choco upgrade golang -y
```

Or with winget:

```powershell
winget upgrade --id GoLang.Go
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL
- Git installed in WSL

Verify you are running WSL 2:

```bash
wsl.exe --list --verbose
```

Your Ubuntu distribution should show "2" in the VERSION column.

Install Git if not present:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

#### Installation Steps

**Step 1: Install Go**

Download and install Go from the official source:

```bash
wget -q https://go.dev/dl/go1.24.0.linux-amd64.tar.gz -O /tmp/go.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
```

**Step 2: Configure PATH**

Add Go to your PATH:

```bash
echo 'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"' >> ~/.bashrc && source ~/.bashrc
```

Verify Go is installed correctly:

```bash
go version
```

Expected output should show Go 1.24 or later.

**Step 3: Install gitego**

Install gitego using Go's package manager:

```bash
go install github.com/bgreenwell/gitego@latest
```

**Step 4: Configure Git to use gitego as credential helper**

Clear any existing credential helpers and set gitego as the primary handler:

```bash
git config --global credential.helper ""
git config --global --add credential.helper "!gitego credential"
```

**Step 5: Configure credential storage for WSL**

WSL does not have a native secret service running by default. Install and configure pass for credential storage:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pass gnupg
```

Generate a GPG key for pass (follow the prompts):

```bash
gpg --batch --gen-key <<EOF
Key-Type: RSA
Key-Length: 4096
Name-Real: gitego
Name-Email: gitego@localhost
Expire-Date: 0
%no-protection
EOF
```

Initialize pass with the generated key:

```bash
pass init "gitego"
```

#### Verification

Confirm gitego is installed:

```bash
gitego --version
```

Expected output:

```
gitego version 0.1.1
```

Test the credential helper configuration:

```bash
git config --global --get-all credential.helper
```

Expected output:

```
!gitego credential
```

#### Troubleshooting

**Problem**: `gitego: command not found`

**Solution**: Ensure Go bin directory is in PATH:

```bash
echo 'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"' >> ~/.bashrc && source ~/.bashrc
```

**Problem**: WSL 1 compatibility issues

**Solution**: Upgrade to WSL 2:

```powershell
wsl --set-version Ubuntu 2
```

**Problem**: Secret storage errors

**Solution**: Ensure pass is properly initialized:

```bash
pass init "$(gpg --list-keys --keyid-format LONG | grep -A1 pub | tail -1 | awk '{print $1}')"
```

---

### Git Bash (Windows)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Go installed on Windows (see Windows section)

Git Bash inherits the Windows PATH, so if Go and gitego are installed on Windows, they will be available in Git Bash automatically.

#### Installation Steps

**Step 1: Install Go on Windows**

If Go is not already installed, install it using Chocolatey from an Administrator PowerShell:

```powershell
choco install golang -y
```

Or with winget:

```powershell
winget install --id GoLang.Go --silent --accept-package-agreements --accept-source-agreements
```

**Step 2: Install gitego**

Open Git Bash and install gitego:

```bash
go install github.com/bgreenwell/gitego@latest
```

**Step 3: Add Go bin to PATH**

If gitego is not found after installation, add the Go bin directory to your Git Bash profile:

```bash
echo 'export PATH="$PATH:$HOME/go/bin"' >> ~/.bashrc && source ~/.bashrc
```

**Step 4: Configure Git to use gitego as credential helper**

Clear any existing credential helpers and set gitego as the primary handler:

```bash
git config --global credential.helper ""
git config --global --add credential.helper "!gitego credential"
```

#### Verification

Confirm gitego is installed:

```bash
gitego --version
```

Expected output:

```
gitego version 0.1.1
```

Test the credential helper configuration:

```bash
git config --global --get-all credential.helper
```

Expected output:

```
!gitego credential
```

#### Troubleshooting

**Problem**: `gitego: command not found`

**Solution**: Add the Go bin directory to your PATH:

```bash
echo 'export PATH="$PATH:$HOME/go/bin:/c/Users/$USER/go/bin"' >> ~/.bashrc && source ~/.bashrc
```

**Problem**: `go: command not found`

**Solution**: Go is not installed or not in PATH. Install Go on Windows first (see Windows section), then restart Git Bash.

**Problem**: Credential helper not working

**Solution**: Verify the Git configuration:

```bash
git config --global --list | grep credential
```

Reconfigure if needed:

```bash
git config --global --unset-all credential.helper
git config --global credential.helper ""
git config --global --add credential.helper "!gitego credential"
```

---

## Post-Installation Configuration

After installing gitego on any platform, complete these configuration steps.

### Create Your First Profile

Create a default profile with your primary Git identity:

```bash
gitego add personal --name "Your Name" --email "you@example.com" --username "your-github-username"
```

Set it as the global default:

```bash
gitego use personal
```

### Create Additional Profiles

Create profiles for different contexts:

```bash
# Work profile with SSH key
gitego add work --name "Your Name" --email "you@company.com" --username "work-username" --ssh-key ~/.ssh/id_work

# Client profile with Personal Access Token
gitego add client --name "Your Name" --email "you@client.com" --username "client-username" --pat "ghp_YourPATHere"
```

### Configure Auto-Switching

Set up automatic profile switching based on directory:

```bash
gitego auto ~/work/ work
gitego auto ~/personal/ personal
gitego auto ~/clients/abc/ client
```

### Install Pre-Commit Hook (Optional)

Add a safety hook to prevent commits with the wrong identity:

```bash
cd /path/to/your/repo
gitego install-hook
```

### Verify Configuration

Check the current effective Git identity:

```bash
gitego status
```

List all configured profiles:

```bash
gitego list
```

---

## Common Issues

### Issue: "error: cannot run gitego credential: No such file or directory"

**Symptoms**: Git operations fail with credential helper errors.

**Solution**: gitego is not in your PATH. Verify the installation:

```bash
which gitego
```

If not found, add the Go bin directory to your PATH (see platform-specific instructions above).

### Issue: Profile not switching automatically

**Symptoms**: `gitego status` shows the wrong profile when in a configured directory.

**Solution**: Verify auto-switching rules:

```bash
gitego list
```

Ensure the directory path in the auto rule matches your actual directory structure. The path must be an exact prefix match.

### Issue: PAT not being used for HTTPS operations

**Symptoms**: Git prompts for username/password despite PAT being configured.

**Solution**: Verify the credential helper is configured:

```bash
git config --global --get-all credential.helper
```

If gitego is not listed, reconfigure:

```bash
git config --global credential.helper ""
git config --global --add credential.helper "!gitego credential"
```

### Issue: SSH key not being used

**Symptoms**: Git uses wrong SSH key for operations.

**Solution**: gitego manages SSH key selection via GIT_SSH_COMMAND. Verify the profile has an SSH key configured:

```bash
gitego list
```

If the ssh-key field is empty, add one:

```bash
gitego edit profile-name --ssh-key ~/.ssh/id_correct_key
```

### Issue: "secret service not available" on Linux

**Symptoms**: PAT storage fails on headless Linux systems.

**Solution**: Install and configure a secret service. For systems with GNOME:

```bash
sudo apt-get install -y gnome-keyring
```

For headless systems, use pass:

```bash
sudo apt-get install -y pass gnupg
gpg --gen-key
pass init "your-gpg-key-id"
```

---

## References

- [gitego GitHub Repository](https://github.com/bgreenwell/gitego)
- [Go Installation Documentation](https://go.dev/doc/install)
- [Git Credential Helpers Documentation](https://git-scm.com/docs/gitcredentials)
- [Git Conditional Includes Documentation](https://git-scm.com/docs/git-config#_conditional_includes)
- [Homebrew Go Formula](https://formulae.brew.sh/formula/go)
- [Chocolatey Go Package](https://community.chocolatey.org/packages/golang)
- [winget Go Package](https://winget.run/pkg/GoLang/Go)
