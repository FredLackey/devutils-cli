# Installing Go

## Overview

Go (also known as Golang) is an open-source programming language developed by Google that makes it simple to build secure, scalable systems. Go is statically typed, compiled, and designed for simplicity and reliability. It features built-in concurrency primitives, garbage collection, and a robust standard library, making it ideal for building web servers, cloud services, command-line tools, and distributed systems.

Go was created by Robert Griesemer, Rob Pike, and Ken Thompson at Google and publicly announced in 2009. The language emphasizes simplicity, readability, and fast compilation times.

## Prerequisites

Before installing Go on any platform, ensure:

1. **Internet connectivity** - Required to download Go packages
2. **Administrative privileges** - Required for system-wide installation
3. **Sufficient disk space** - At least 500 MB free disk space recommended
4. **Terminal/command prompt access** - Required to run installation commands

**Important**: If you have older Go installations, remove them before installing to avoid conflicts between versions.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 12 (Monterey) or later
- Homebrew package manager installed
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Go:

```bash
brew install --quiet go
```

The `--quiet` flag suppresses non-essential output for cleaner automation. Homebrew automatically:

- Installs Go to the Homebrew prefix (`/opt/homebrew/Cellar/go/` on Apple Silicon, `/usr/local/Cellar/go/` on Intel)
- Creates symlinks in the Homebrew bin directory
- Adds Go to your PATH (if Homebrew is properly configured)

**Note**: With modern Go (1.16+), you do not need to set `GOROOT` or `GOPATH` environment variables. Go modules handle dependency management automatically, and `GOPATH` defaults to `~/go`.

#### Verification

Confirm the installation succeeded:

```bash
go version
```

Expected output (version numbers may vary):

```
go version go1.25.5 darwin/arm64
```

Test that Go is working correctly by running a simple command:

```bash
go env GOROOT
```

This displays the Go installation directory, confirming the installation is functional.

#### Troubleshooting

**Problem**: `go: command not found` after installation

**Solution**: Homebrew may not be in your PATH. Add Homebrew to your shell configuration:

For Apple Silicon (M1/M2/M3/M4):

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile
```

For Intel Macs:

```bash
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile
```

**Problem**: Old version of Go installed

**Solution**: Update Homebrew and upgrade Go:

```bash
brew update && brew upgrade go
```

**Problem**: Need to install Go binaries globally (like `gopls`, `dlv`)

**Solution**: Ensure `$HOME/go/bin` is in your PATH:

```bash
echo 'export PATH="$PATH:$HOME/go/bin"' >> ~/.zprofile
source ~/.zprofile
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 (Focal) or later, or Debian 11 (Bullseye) or later (64-bit)
- sudo privileges
- At least 500 MB free disk space

**Important**: The `golang-go` package in Ubuntu/Debian repositories may be outdated. This guide uses the official Go distribution for the latest stable version.

First, remove any existing Go installations to avoid conflicts:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y golang-go golang 2>/dev/null || true
sudo rm -rf /usr/local/go 2>/dev/null || true
```

#### Installation Steps

**Step 1: Install required utilities**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget curl
```

**Step 2: Download and install Go**

Download the latest stable version and extract to `/usr/local`:

```bash
GO_VERSION=$(curl -sL 'https://go.dev/VERSION?m=text' | head -n1)
wget -q "https://go.dev/dl/${GO_VERSION}.linux-amd64.tar.gz" -O /tmp/go.tar.gz
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
```

**Step 3: Configure environment variables**

Add Go to your PATH by appending to your shell profile:

```bash
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.profile
echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.profile
source ~/.profile
```

The first line adds the Go compiler to PATH. The second line adds the directory where `go install` places binaries.

#### Verification

Confirm the installation succeeded:

```bash
go version
```

Expected output (version numbers may vary):

```
go version go1.25.5 linux/amd64
```

Verify the environment is configured correctly:

```bash
go env GOROOT GOPATH
```

Expected output:

```
/usr/local/go
/home/<username>/go
```

#### Troubleshooting

**Problem**: `go: command not found` after installation

**Solution**: The PATH changes require a new shell session. Either log out and log back in, or source your profile:

```bash
source ~/.profile
```

**Problem**: Permission denied when running `go install`

**Solution**: Go installs binaries to `$HOME/go/bin` by default, which should not require elevated privileges. If you encounter permission issues, ensure the directory exists and is owned by your user:

```bash
mkdir -p ~/go/bin
```

**Problem**: Old version persists after installation

**Solution**: An older version may be installed via apt. Remove it:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y golang-go golang
hash -r
go version
```

**Problem**: `GOROOT` or `GOPATH` errors

**Solution**: Modern Go (1.16+) does not require these to be set. If you have them set incorrectly from a previous installation, remove them:

```bash
unset GOROOT
unset GOPATH
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
- Raspberry Pi 3B+ or later (64-bit capable hardware)
- At least 500 MB free disk space
- sudo privileges

**Important**: You must download the correct Go binary for your architecture. Raspberry Pi OS can run in 32-bit (armv6l/armv7l) or 64-bit (arm64/aarch64) mode.

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit (recommended, use `linux-arm64`)
- `armv7l` or `armv6l` = 32-bit (use `linux-armv6l`)

Remove any existing Go installations:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y golang-go golang 2>/dev/null || true
sudo rm -rf /usr/local/go 2>/dev/null || true
```

#### Installation Steps

**Step 1: Install required utilities**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget curl
```

**Step 2: Download and install Go**

The following script automatically detects your architecture and downloads the correct version:

```bash
GO_VERSION=$(curl -sL 'https://go.dev/VERSION?m=text' | head -n1)
ARCH=$(uname -m)
if [ "$ARCH" = "aarch64" ]; then
  GO_ARCH="linux-arm64"
elif [ "$ARCH" = "armv7l" ] || [ "$ARCH" = "armv6l" ]; then
  GO_ARCH="linux-armv6l"
else
  echo "Unsupported architecture: $ARCH"
  exit 1
fi
wget -q "https://go.dev/dl/${GO_VERSION}.${GO_ARCH}.tar.gz" -O /tmp/go.tar.gz
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
```

**Step 3: Configure environment variables**

Add Go to your PATH:

```bash
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.profile
echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.profile
source ~/.profile
```

#### Verification

Confirm the installation succeeded:

```bash
go version
```

Expected output for 64-bit (version numbers may vary):

```
go version go1.25.5 linux/arm64
```

Expected output for 32-bit:

```
go version go1.25.5 linux/arm
```

#### Troubleshooting

**Problem**: `cannot execute binary file: Exec format error`

**Solution**: You downloaded the wrong architecture. Check your architecture with `uname -m` and download the matching version:

- `aarch64` -> `linux-arm64.tar.gz`
- `armv7l` or `armv6l` -> `linux-armv6l.tar.gz`

**Problem**: Very slow compilation

**Solution**: Raspberry Pi has limited CPU and RAM. Compilation is slower than on desktop systems. Consider:

- Using a faster SD card or USB/SSD boot
- Adding swap space if you have less than 2 GB RAM
- Cross-compiling on a more powerful machine

**Problem**: Out of memory during compilation

**Solution**: Add swap space:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Problem**: `apt install golang-go` installs very old version

**Solution**: The Raspberry Pi OS repositories contain outdated Go versions. Use the manual installation method above for the latest version.

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- EC2 instance or compatible environment

**Note**: Amazon Linux 2023 uses DNF as the package manager. Amazon Linux 2 uses YUM. The version in Amazon's repositories may be older than the latest stable release. This guide uses the official Go distribution for the latest version.

First, remove any existing Go installations:

```bash
sudo rm -rf /usr/local/go 2>/dev/null || true
```

#### Installation Steps

**Step 1: Install required utilities**

For Amazon Linux 2023:

```bash
sudo dnf install -y wget curl tar
```

For Amazon Linux 2:

```bash
sudo yum install -y wget curl tar
```

**Step 2: Download and install Go**

```bash
GO_VERSION=$(curl -sL 'https://go.dev/VERSION?m=text' | head -n1)
wget -q "https://go.dev/dl/${GO_VERSION}.linux-amd64.tar.gz" -O /tmp/go.tar.gz
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
```

**Step 3: Configure environment variables**

Add Go to your PATH:

```bash
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc
```

**Alternative: Install from Amazon Repositories (older version)**

If you prefer to use the version from Amazon's repositories (may be older):

For Amazon Linux 2023:

```bash
sudo dnf install -y golang
```

For Amazon Linux 2:

```bash
sudo yum install -y golang
```

**Note**: The repository version may be Go 1.19 or older. Use the manual installation above for the latest version.

#### Verification

Confirm the installation succeeded:

```bash
go version
```

Expected output (version numbers may vary):

```
go version go1.25.5 linux/amd64
```

Verify the environment:

```bash
go env GOROOT
```

Expected output:

```
/usr/local/go
```

#### Troubleshooting

**Problem**: `go: command not found` after installation

**Solution**: Source your bash profile or start a new shell session:

```bash
source ~/.bashrc
```

**Problem**: Repository version is too old

**Solution**: Use the manual installation method documented above to get the latest version from the official Go website.

**Problem**: Conflict between manual and repository installations

**Solution**: Remove the repository version before manual installation:

For Amazon Linux 2023:

```bash
sudo dnf remove -y golang
```

For Amazon Linux 2:

```bash
sudo yum remove -y golang
```

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 version 1809 or later, or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey or winget package manager installed

If neither package manager is installed, install Chocolatey by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install golang -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation. Chocolatey uses the official Go MSI installer with silent installation flags (`/qn /norestart`).

**Alternative: Using winget**

If you prefer winget (built into Windows 11 and Windows 10 21H2+):

```powershell
winget install --id GoLang.Go --silent --accept-package-agreements --accept-source-agreements
```

After installation, close and reopen your terminal for the PATH changes to take effect. Alternatively, in PowerShell, run:

```powershell
refreshenv
```

#### Verification

Open a new Command Prompt or PowerShell window, then run:

```powershell
go version
```

Expected output (version numbers may vary):

```
go version go1.25.5 windows/amd64
```

Verify the installation path:

```powershell
go env GOROOT
```

Expected output (default installation):

```
C:\Program Files\Go
```

#### Troubleshooting

**Problem**: `go: The term 'go' is not recognized` after installation

**Solution**: The PATH was not updated. Close and reopen PowerShell, or manually refresh the environment:

```powershell
refreshenv
```

If using Command Prompt, close and reopen it.

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click the application and select "Run as administrator".

**Problem**: Old version persists after upgrade

**Solution**: Uninstall and reinstall Go:

```powershell
choco uninstall golang -y
choco install golang -y
```

**Problem**: Multiple Go versions installed

**Solution**: Remove the extra installation. Check `C:\Program Files\Go` and `C:\Go` for duplicate installations.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

**Note**: WSL runs a full Linux environment, so the installation process is identical to native Ubuntu. The commands below are specific to Ubuntu running under WSL.

First, remove any existing Go installations:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y golang-go golang 2>/dev/null || true
sudo rm -rf /usr/local/go 2>/dev/null || true
```

#### Installation Steps

Run these commands in your WSL Ubuntu terminal:

**Step 1: Install required utilities**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget curl
```

**Step 2: Download and install Go**

```bash
GO_VERSION=$(curl -sL 'https://go.dev/VERSION?m=text' | head -n1)
wget -q "https://go.dev/dl/${GO_VERSION}.linux-amd64.tar.gz" -O /tmp/go.tar.gz
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
```

**Step 3: Configure environment variables**

Add Go to your PATH:

```bash
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
go version
```

Expected output (version numbers may vary):

```
go version go1.25.5 linux/amd64
```

#### Troubleshooting

**Problem**: `go: command not found` after installation

**Solution**: Source your bash profile or close and reopen the WSL terminal:

```bash
source ~/.bashrc
```

**Problem**: Very slow file operations when code is on Windows filesystem

**Solution**: Keep your Go code on the Linux filesystem (`~/projects`) rather than the Windows filesystem (`/mnt/c/`). WSL 2 performs significantly better with files on the native Linux filesystem.

**Problem**: Cannot access Go tools installed with `go install` from Windows

**Solution**: Go binaries installed in WSL are Linux executables and cannot run directly from Windows. Use VS Code with the Remote - WSL extension or run Go commands from within WSL.

**Problem**: IDE cannot find Go installation

**Solution**: When using VS Code with Remote - WSL extension, ensure you open VS Code from within WSL by running `code .` in your project directory. VS Code will automatically detect the Go installation in WSL.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Go installed on Windows (see Windows section)

**Note**: Git Bash on Windows does not require a separate Go installation. Git Bash inherits the Windows PATH, so once Go is installed on Windows using Chocolatey or winget, the `go` command is automatically available in Git Bash.

#### Installation Steps

1. Install Go on Windows using Chocolatey (see Windows section):

```bash
# Run from Administrator PowerShell or Command Prompt
choco install golang -y
```

2. Close and reopen Git Bash to pick up the PATH changes

3. The `go` command is now available in Git Bash

If you need to manually add Go to the Git Bash PATH (typically not required), add to your `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/c/Program Files/Go/bin"' >> ~/.bashrc
echo 'export PATH="$PATH:$HOME/go/bin"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

In Git Bash, confirm Go is accessible:

```bash
go version
```

Expected output (version numbers may vary):

```
go version go1.25.5 windows/amd64
```

Test that Go commands work:

```bash
go env GOROOT
```

Expected output:

```
C:\Program Files\Go
```

#### Troubleshooting

**Problem**: `go: command not found` in Git Bash

**Solution**: The PATH may not be inherited. First, ensure Go is installed on Windows and works in PowerShell/Command Prompt. Then add Go to Git Bash's PATH manually:

```bash
echo 'export PATH="$PATH:/c/Program Files/Go/bin"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Path conversion issues with Go commands

**Solution**: Git Bash automatically converts Unix-style paths to Windows paths. This can occasionally cause issues. To disable path conversion for a specific command, prefix it with `MSYS_NO_PATHCONV=1`:

```bash
MSYS_NO_PATHCONV=1 go build -o /c/Users/me/myapp.exe
```

**Problem**: Go modules fail to download (SSL/TLS errors)

**Solution**: Ensure Git is configured with proper SSL settings:

```bash
git config --global http.sslBackend schannel
```

**Problem**: `go install` puts binaries in unexpected location

**Solution**: Go uses `%USERPROFILE%\go\bin` on Windows. In Git Bash, this translates to `$HOME/go/bin`. Ensure this is in your PATH:

```bash
echo 'export PATH="$PATH:$HOME/go/bin"' >> ~/.bashrc
source ~/.bashrc
```

---

## Post-Installation Configuration

After installing Go on any platform, consider these optional but recommended configurations.

### Verifying Go Modules Work

Modern Go uses modules for dependency management (enabled by default since Go 1.16). Test that modules work:

```bash
mkdir -p /tmp/gotest && cd /tmp/gotest
go mod init example.com/test
go get golang.org/x/tools/gopls@latest
```

If this completes without errors, Go modules are working correctly.

### Installing Common Development Tools

Install frequently used Go tools:

```bash
go install golang.org/x/tools/gopls@latest      # Go language server (for IDE support)
go install github.com/go-delve/delve/cmd/dlv@latest  # Debugger
go install golang.org/x/tools/cmd/goimports@latest   # Import organizer
```

These binaries are installed to `$HOME/go/bin` (or `%USERPROFILE%\go\bin` on Windows). Ensure this directory is in your PATH.

### Configuring Your Editor

**VS Code:**

1. Install the "Go" extension by the Go Team at Google
2. Open a `.go` file and accept the prompt to install Go tools
3. The extension uses `gopls` for language features

**GoLand:**

GoLand automatically detects Go installations. Verify the SDK path in Settings > Go > GOROOT.

**Vim/Neovim:**

Install the `vim-go` plugin or use native LSP with `gopls`.

### Setting Up Private Module Access

If you use private Go modules (from private Git repositories), configure Git authentication:

```bash
# For GitHub
git config --global url."git@github.com:".insteadOf "https://github.com/"

# Set GOPRIVATE for your private repos
export GOPRIVATE="github.com/your-org/*"
```

Add `GOPRIVATE` to your shell profile for persistence.

---

## Common Issues

### Issue: "go: module requires Go X.Y"

**Symptoms**: Error message indicating the module requires a newer Go version than installed.

**Solutions**:

- Update Go to the latest version using your package manager
- Or use the version specified by the module (check `go.mod`)

### Issue: "cannot find package" or Module Download Failures

**Symptoms**: `go get` or `go build` cannot find or download packages.

**Solutions**:

- Ensure you have internet connectivity
- Check if the package exists and the URL is correct
- For corporate networks, configure proxy settings:

```bash
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
export NO_PROXY=localhost,127.0.0.1
```

- For private modules, configure `GOPRIVATE`:

```bash
export GOPRIVATE="github.com/your-org/*"
```

### Issue: "GOROOT" or "GOPATH" Confusion

**Symptoms**: Errors related to GOROOT or GOPATH configuration.

**Solutions**:

Modern Go (1.16+) handles these automatically:

- `GOROOT`: Location of Go installation (auto-detected)
- `GOPATH`: Location for downloaded modules and installed binaries (defaults to `$HOME/go`)

You typically do not need to set these. If you have them set from an old installation, remove them:

```bash
unset GOROOT
unset GOPATH
```

### Issue: "Permission Denied" When Installing Packages

**Symptoms**: `go install` fails with permission errors.

**Solutions**:

Go should install to `$HOME/go/bin`, which does not require root. If it is trying to install elsewhere:

- Check `go env GOBIN` and `go env GOPATH`
- Ensure `$HOME/go/bin` exists and is writable:

```bash
mkdir -p ~/go/bin
```

- Never run `go install` with sudo

### Issue: Slow First-Time Builds

**Symptoms**: Initial compilation takes a long time.

**Solutions**:

This is normal. Go caches compiled packages, so subsequent builds are much faster. To ensure caching works:

- Check the cache location: `go env GOCACHE`
- Ensure you have sufficient disk space
- On CI systems, cache the Go build cache and module cache

---

## References

- [Go Official Download Page](https://go.dev/dl/)
- [Go Installation Documentation](https://go.dev/doc/install)
- [Go Wiki: Ubuntu](https://go.dev/wiki/Ubuntu)
- [Go Homebrew Formula](https://formulae.brew.sh/formula/go)
- [Go Chocolatey Package](https://community.chocolatey.org/packages/golang)
- [Go winget Package](https://winstall.app/apps/GoLang.Go)
- [AWS: Go in Amazon Linux 2023](https://docs.aws.amazon.com/linux/al2023/ug/go.html)
- [Installing Go on Raspberry Pi](https://www.jeremymorgan.com/tutorials/raspberry-pi/install-go-raspberry-pi/)
- [Installing Go on WSL](https://dev.to/pu-lazydev/installing-go-golang-on-wsl-ubuntu-18b7)
- [Go Modules Documentation](https://go.dev/blog/using-go-modules)
