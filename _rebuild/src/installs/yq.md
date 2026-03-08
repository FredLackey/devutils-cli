# Installing yq

## Overview

yq is a lightweight and portable command-line YAML processor written in Go by Mike Farah. It uses jq-like syntax but works with YAML files as well as JSON, XML, CSV, TSV, INI, properties, and HCL formats. Think of yq as the jq or sed equivalent for YAML data - it allows you to read, filter, update, and transform structured data with concise expressions.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None

### Ubuntu (APT/Snap)
- **Required:**
  - snapd - Install via `sudo apt-get install snapd` (installer will attempt to install automatically if missing)
  - sudo privileges for package installation
- **Optional:** None
- **Auto-installed:**
  - snapd - Automatically installed via `sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd` if not present

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - curl - Install via `sudo apt-get install curl` (typically pre-installed)
  - uname - Pre-installed system utility for architecture detection
  - sudo privileges for installation
- **Optional:**
  - snapd - Install via `sudo apt-get install snapd` (preferred for 64-bit installations, installer falls back to binary download if unavailable)
- **Auto-installed:** None

### Amazon Linux (DNF/YUM)
- **Required:**
  - curl - Pre-installed on Amazon Linux (if missing: `sudo dnf install curl` or `sudo yum install curl`)
  - uname - Pre-installed system utility for architecture detection
  - sudo privileges for installation
- **Optional:** None
- **Auto-installed:** None

### Windows (Chocolatey/winget)
- **Required:**
  - Chocolatey - Install via PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))` or run `dev install chocolatey`
  - Administrator privileges (run PowerShell or Command Prompt as Administrator)
- **Optional:**
  - winget - Pre-installed on Windows 11 and recent Windows 10 builds (alternative to Chocolatey)
- **Auto-installed:** None

### Git Bash (Manual/Portable)
- **Required:**
  - curl - Pre-installed with Git for Windows
  - mkdir - Pre-installed shell command
  - Git for Windows - Install from https://git-scm.com/download/win
- **Optional:** None
- **Auto-installed:** None

yq is essential for developers and DevOps engineers who work with Kubernetes manifests, Helm charts, Docker Compose files, CI/CD configurations, or any YAML-based infrastructure. Common use cases include:

- Parsing and extracting values from YAML configuration files
- Modifying Kubernetes manifests programmatically
- Converting between YAML, JSON, and XML formats
- Merging multiple YAML files
- Updating values in Docker Compose files
- Processing CI/CD pipeline configurations

yq is a single statically compiled binary with zero runtime dependencies, making it extremely portable and easy to deploy across platforms.

**Important Note**: There are multiple tools named "yq" in the ecosystem. This documentation covers Mike Farah's Go-based yq (https://github.com/mikefarah/yq), which is the most widely used implementation. The Python-based yq (kislyuk/yq) available in some Linux package managers is a different tool.

## Prerequisites

Before installing yq on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required on most platforms for system-wide installation
3. **Package manager installed** - Each platform requires its respective package manager (Homebrew, Snap, Chocolatey, etc.)

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma or later recommended)
- Homebrew package manager installed
- Terminal access

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install yq via Homebrew:

```bash
brew install --quiet yq
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts and CI/CD pipelines.

**Note**: This installs Mike Farah's yq. Homebrew has a separate `python-yq` formula - do not install that one if you want the Go-based yq.

#### Verification

Confirm the installation succeeded:

```bash
yq --version
```

Expected output (version numbers may vary):

```
yq (https://github.com/mikefarah/yq/) version v4.50.1
```

Verify the installation path:

```bash
which yq
```

Expected output: `/opt/homebrew/bin/yq` (Apple Silicon) or `/usr/local/bin/yq` (Intel).

#### Troubleshooting

**Problem**: `yq: command not found` after installation

**Solution**: Homebrew may not be in your PATH. For Apple Silicon Macs, add Homebrew to your PATH:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For a permanent fix, add this to your shell configuration:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc && source ~/.zshrc
```

**Problem**: `brew install yq` fails with permission errors

**Solution**: Fix Homebrew directory ownership:

```bash
sudo chown -R $(whoami) $(brew --prefix)/*
```

**Problem**: Installed wrong yq (python-yq)

**Solution**: If you accidentally installed python-yq, uninstall it and install the correct one:

```bash
brew uninstall python-yq && brew install --quiet yq
```

**Problem**: Installation fails with network errors

**Solution**: Check your internet connection and try again. If behind a corporate proxy, configure Homebrew to use it:

```bash
export ALL_PROXY=http://proxy.example.com:8080
brew install --quiet yq
```

---

### Ubuntu/Debian (Snap)

#### Prerequisites

- Ubuntu 16.04 LTS or later, or Debian 10 (Buster) or later
- sudo privileges
- Internet connectivity
- snapd installed (pre-installed on Ubuntu 16.04+)

**Important**: The `yq` package in Ubuntu/Debian APT repositories is NOT Mike Farah's yq - it is a Python-based wrapper around jq called python-yq (kislyuk/yq). Do NOT install via `apt-get install yq` if you want Mike Farah's yq. Use Snap instead.

#### Installation Steps

Run the following command to install yq via Snap:

```bash
sudo snap install yq
```

Snap packages install non-interactively by default. The command downloads and installs the latest stable version from the Snap Store.

#### Verification

Confirm the installation succeeded:

```bash
yq --version
```

Expected output (version numbers may vary):

```
yq (https://github.com/mikefarah/yq/) version v4.49.2
```

**Note**: Snap may install a slightly older stable version compared to the absolute latest GitHub release. This is normal and the Snap version is well-tested.

Verify the installation path:

```bash
which yq
```

Expected output: `/snap/bin/yq`

#### Troubleshooting

**Problem**: `snap: command not found`

**Solution**: Install snapd first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
```

Then reboot or log out and back in, and retry the yq installation.

**Problem**: `yq: command not found` after snap installation

**Solution**: Snap binaries may not be in your PATH. Add Snap's bin directory:

```bash
echo 'export PATH="/snap/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

**Problem**: Snap installation fails with permission errors

**Solution**: Ensure you are using `sudo` with the snap install command.

**Problem**: Need the absolute latest version

**Solution**: Install from the edge channel or use direct binary download:

```bash
sudo snap install yq --edge
```

Or download the binary directly from GitHub:

```bash
sudo curl -L -o /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 && sudo chmod +x /usr/local/bin/yq
```

---

### Raspberry Pi OS (Snap)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 2 or later (Raspberry Pi 3B+ or later recommended for 64-bit)
- sudo privileges
- Internet connectivity
- snapd installed

Raspberry Pi OS is based on Debian. Like Ubuntu/Debian, the APT repositories contain python-yq, not Mike Farah's yq. Use Snap or direct binary download instead.

#### Installation Steps

**Step 1: Install snapd (if not already installed)**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
```

After installing snapd, reboot the Raspberry Pi:

```bash
sudo reboot
```

**Step 2: Install yq via Snap**

After reboot, open a new terminal and run:

```bash
sudo snap install yq
```

**Alternative: Direct Binary Download (recommended for 32-bit)**

For 32-bit Raspberry Pi OS or if Snap is not desired, download the ARM binary directly:

For 64-bit (aarch64):

```bash
sudo curl -L -o /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_arm64 && sudo chmod +x /usr/local/bin/yq
```

For 32-bit (armv7l/armhf):

```bash
sudo curl -L -o /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_arm && sudo chmod +x /usr/local/bin/yq
```

#### Verification

Confirm the installation succeeded:

```bash
yq --version
```

Expected output (version numbers may vary):

```
yq (https://github.com/mikefarah/yq/) version v4.49.2
```

Verify your architecture:

```bash
uname -m
```

Expected output: `aarch64` (64-bit) or `armv7l` (32-bit).

Verify the installation path:

```bash
which yq
```

Expected output: `/snap/bin/yq` (Snap) or `/usr/local/bin/yq` (binary download).

#### Troubleshooting

**Problem**: Snap installation hangs or is very slow

**Solution**: Raspberry Pi may have limited bandwidth or processing power. Use the direct binary download method instead, which is faster.

**Problem**: `snap: command not found`

**Solution**: Ensure snapd is installed and you have rebooted after installation:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
sudo reboot
```

**Problem**: Wrong architecture binary downloaded

**Solution**: Check your architecture with `uname -m` and download the correct binary:
- `aarch64` = use `yq_linux_arm64`
- `armv7l` = use `yq_linux_arm`

**Problem**: Permission denied when running yq

**Solution**: Ensure the binary has execute permissions:

```bash
sudo chmod +x /usr/local/bin/yq
```

---

### Amazon Linux (Direct Binary Download)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- Internet connectivity
- curl or wget installed (pre-installed on Amazon Linux)

**Important**: Mike Farah's yq is NOT available in the standard Amazon Linux repositories. Use direct binary download for installation.

#### Installation Steps

Run the following commands to download and install yq:

For x86_64 instances:

```bash
sudo curl -L -o /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 && sudo chmod +x /usr/local/bin/yq
```

For ARM-based instances (Graviton):

```bash
sudo curl -L -o /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_arm64 && sudo chmod +x /usr/local/bin/yq
```

This downloads the latest stable release directly from GitHub and installs it to `/usr/local/bin/`.

#### Verification

Confirm the installation succeeded:

```bash
yq --version
```

Expected output (version numbers may vary):

```
yq (https://github.com/mikefarah/yq/) version v4.50.1
```

Check which architecture is installed:

```bash
file /usr/local/bin/yq
```

Expected output for x86_64: `ELF 64-bit LSB executable, x86-64`
Expected output for ARM64: `ELF 64-bit LSB executable, ARM aarch64`

Verify the installation path:

```bash
which yq
```

Expected output: `/usr/local/bin/yq`

#### Troubleshooting

**Problem**: `curl: command not found`

**Solution**: curl should be pre-installed, but if missing:

```bash
sudo dnf install -y curl
```

Or for Amazon Linux 2:

```bash
sudo yum install -y curl
```

**Problem**: Permission denied when downloading

**Solution**: Ensure you are using `sudo` for the curl and chmod commands.

**Problem**: yq not found after installation

**Solution**: `/usr/local/bin` should be in PATH by default. If not, add it:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

**Problem**: Need to install a specific version

**Solution**: Replace `latest` with the specific version tag:

```bash
sudo curl -L -o /usr/local/bin/yq https://github.com/mikefarah/yq/releases/download/v4.50.1/yq_linux_amd64 && sudo chmod +x /usr/local/bin/yq
```

**Problem**: Downloaded wrong architecture

**Solution**: Check your instance architecture first:

```bash
uname -m
```

Use `yq_linux_amd64` for `x86_64` and `yq_linux_arm64` for `aarch64`.

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 (version 1803+) or Windows 11
- Chocolatey package manager installed
- Administrator PowerShell or Command Prompt

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install yq -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

Chocolatey downloads the appropriate Windows binary and adds it to the PATH automatically.

#### Verification

Open a **new** Command Prompt or PowerShell window (required for PATH to update), then run:

```powershell
yq --version
```

Expected output (version numbers may vary):

```
yq (https://github.com/mikefarah/yq/) version v4.50.1
```

Verify the installation path:

```powershell
where yq
```

Expected output: `C:\ProgramData\chocolatey\bin\yq.exe`

#### Troubleshooting

**Problem**: `yq` command not found after installation

**Solution**: Close all terminal windows and open a new Command Prompt or PowerShell. The PATH update requires a fresh terminal session.

**Problem**: `choco` command not found

**Solution**: Chocolatey may not be in PATH. Close all terminal windows, open a new Administrator PowerShell, and try again. If the issue persists, reinstall Chocolatey.

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: Need to use winget instead of Chocolatey

**Solution**: winget is also supported. Run the following in PowerShell or Command Prompt:

```powershell
winget install --id MikeFarah.yq --silent --accept-package-agreements --accept-source-agreements
```

The `--silent` flag ensures non-interactive installation.

**Note**: The winget version may be slightly older than the Chocolatey version. Check the version after installation.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004+ or Windows 11
- Windows Subsystem for Linux (WSL) with Ubuntu installed
- WSL 2 recommended for best performance
- sudo privileges within WSL

WSL Ubuntu follows the same process as native Ubuntu - use Snap or direct binary download.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

**Option 1: Via Snap (if snapd is available)**

```bash
sudo snap install yq
```

**Option 2: Direct Binary Download (recommended for WSL)**

```bash
sudo curl -L -o /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 && sudo chmod +x /usr/local/bin/yq
```

The direct binary download is often more reliable in WSL environments.

#### Verification

Confirm the installation succeeded:

```bash
yq --version
```

Expected output (version numbers may vary):

```
yq (https://github.com/mikefarah/yq/) version v4.50.1
```

Verify the installation path:

```bash
which yq
```

Expected output: `/snap/bin/yq` (Snap) or `/usr/local/bin/yq` (binary download).

#### Troubleshooting

**Problem**: Snap commands fail in WSL

**Solution**: Snap support in WSL can be problematic. Use the direct binary download method instead:

```bash
sudo curl -L -o /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 && sudo chmod +x /usr/local/bin/yq
```

**Problem**: WSL itself is not installed

**Solution**: Install WSL from an Administrator PowerShell on Windows:

```powershell
wsl --install
```

Restart your computer after installation.

**Problem**: Network connectivity issues in WSL

**Solution**: WSL may have DNS resolution issues. Try restarting WSL:

```powershell
# From Windows PowerShell
wsl --shutdown
wsl
```

**Problem**: `/usr/local/bin` not in PATH

**Solution**: Add it to your PATH:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or Windows 11
- Git for Windows installed (includes Git Bash)
- Internet connectivity

Git Bash does not include yq by default. Download the Windows binary and place it in a directory included in Git Bash's PATH.

#### Installation Steps

Open Git Bash and run the following commands:

**Step 1: Create the local bin directory (if it does not exist)**

```bash
mkdir -p /usr/local/bin
```

**Step 2: Download the yq Windows binary**

```bash
curl -L -o /usr/local/bin/yq.exe https://github.com/mikefarah/yq/releases/latest/download/yq_windows_amd64.exe
```

This downloads the latest yq release directly from the official GitHub releases.

#### Verification

Confirm the installation succeeded:

```bash
yq --version
```

Expected output (version numbers may vary):

```
yq (https://github.com/mikefarah/yq/) version v4.50.1
```

Verify yq is accessible:

```bash
which yq
```

Expected output: `/usr/local/bin/yq`

#### Troubleshooting

**Problem**: `yq: command not found`

**Solution**: The `/usr/local/bin` directory may not be in Git Bash's PATH. Add it manually:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

**Problem**: Permission denied when downloading

**Solution**: Run Git Bash as Administrator. Press Windows key, type "Git Bash", then press Ctrl+Shift+Enter.

**Problem**: SSL certificate errors during download

**Solution**: Update the CA certificates or use the `-k` flag (not recommended for production):

```bash
curl -k -L -o /usr/local/bin/yq.exe https://github.com/mikefarah/yq/releases/latest/download/yq_windows_amd64.exe
```

**Problem**: Need 32-bit version

**Solution**: Download the 32-bit binary instead:

```bash
curl -L -o /usr/local/bin/yq.exe https://github.com/mikefarah/yq/releases/latest/download/yq_windows_386.exe
```

**Problem**: Want to install to Git's built-in bin directory

**Solution**: Alternatively, copy to Git's usr/bin directory (requires running Git Bash as Administrator):

```bash
curl -L -o /usr/bin/yq.exe https://github.com/mikefarah/yq/releases/latest/download/yq_windows_amd64.exe
```

---

## Post-Installation Configuration

yq works out of the box for most use cases. No additional configuration is typically required. The following optional tips may be useful:

### Shell Aliases

Create convenient aliases for common yq operations. Add to your shell configuration file (`~/.bashrc`, `~/.zshrc`, or `~/.bash_profile`):

```bash
# Pretty-print YAML
alias ypp='yq eval .'

# Convert YAML to JSON
alias y2j='yq eval -o=json'

# Convert JSON to YAML
alias j2y='yq eval -P'

# Evaluate in-place
alias yqi='yq eval -i'
```

### Tab Completion

yq supports shell completion for Bash, Zsh, Fish, and PowerShell.

**Bash:**

```bash
echo 'source <(yq shell-completion bash)' >> ~/.bashrc && source ~/.bashrc
```

**Zsh:**

```bash
echo 'source <(yq shell-completion zsh)' >> ~/.zshrc && source ~/.zshrc
```

**PowerShell:**

```powershell
yq shell-completion powershell | Out-String | Invoke-Expression
```

To make it permanent in PowerShell, add to your profile:

```powershell
Add-Content $PROFILE 'yq shell-completion powershell | Out-String | Invoke-Expression'
```

### Test Your Installation

Verify yq can parse YAML correctly:

```bash
echo 'name: yq
version: 4.50.1' | yq '.name'
```

Expected output:

```
yq
```

Test JSON output:

```bash
echo 'name: yq
version: 4.50.1' | yq -o=json
```

Expected output:

```json
{
  "name": "yq",
  "version": "4.50.1"
}
```

---

## Common Issues

### Issue: "Error: bad file descriptor" on Windows

**Symptoms**: yq fails with file descriptor errors when reading from stdin on Windows.

**Solution**: This can occur with certain terminal configurations. Use file input instead of stdin:

```powershell
yq eval '.key' input.yaml
```

Or redirect input explicitly:

```powershell
Get-Content input.yaml | yq eval '.key'
```

### Issue: Wrong yq installed (python-yq vs Go yq)

**Symptoms**: yq version shows Python or uses different syntax.

**Solution**: You may have installed the Python-based yq (kislyuk/yq) instead of Mike Farah's Go-based yq. Check which one is installed:

```bash
yq --version
```

Mike Farah's yq shows: `yq (https://github.com/mikefarah/yq/) version vX.X.X`
Python yq shows: `yq X.X.X`

To fix, uninstall the Python version and install Mike Farah's yq using Snap or direct binary download.

### Issue: "null" output when key does not exist

**Symptoms**: yq returns `null` when querying a non-existent key.

**Solution**: This is expected behavior. To handle missing keys gracefully, use the alternative operator:

```bash
echo 'name: yq' | yq '.missing // "default"'
```

### Issue: YAML anchors and aliases not resolved

**Symptoms**: yq output contains `*anchor` references instead of resolved values.

**Solution**: Use the `explode` function to resolve anchors:

```bash
yq 'explode(.)' file.yaml
```

### Issue: Comments are lost when editing

**Symptoms**: yq removes comments when modifying YAML files.

**Solution**: yq preserves comments in most cases, but complex operations may lose them. For simple value updates, comments are preserved:

```bash
yq -i '.version = "2.0.0"' file.yaml
```

For complex operations, consider using `--prettyPrint` flag.

### Issue: Large YAML files cause memory issues

**Symptoms**: Processing very large YAML files causes yq to consume excessive memory.

**Solution**: yq streams by default for many operations, but very large files may still cause issues. Consider splitting large files or using streaming mode where applicable.

### Issue: PowerShell quoting problems

**Symptoms**: yq expressions fail in PowerShell with parsing errors.

**Solution**: PowerShell has different quoting rules. Use single quotes for yq expressions:

```powershell
yq '.key' file.yaml
```

For complex expressions, escape internal quotes:

```powershell
yq '.items[] | select(.name == \"value\")' file.yaml
```

Or use PowerShell's here-string:

```powershell
yq @'
.items[] | select(.name == "value")
'@ file.yaml
```

### Issue: Updating yq to latest version

**Symptoms**: Need to upgrade to the latest yq version.

**Solution**:

For Homebrew:
```bash
brew upgrade yq
```

For Snap:
```bash
sudo snap refresh yq
```

For Chocolatey:
```bash
choco upgrade yq -y
```

For manual installation, re-run the curl download command with the latest URL.

---

## References

- [yq Official Documentation](https://mikefarah.gitbook.io/yq/)
- [yq GitHub Repository](https://github.com/mikefarah/yq)
- [yq GitHub Releases](https://github.com/mikefarah/yq/releases)
- [yq Homebrew Formula](https://formulae.brew.sh/formula/yq)
- [yq Snap Package](https://snapcraft.io/yq)
- [yq Chocolatey Package](https://community.chocolatey.org/packages/yq)
- [yq winget Package](https://winget.run/pkg/MikeFarah/yq)
- [yq Operators Reference](https://mikefarah.gitbook.io/yq/operators)
- [yq Recipes and Examples](https://mikefarah.gitbook.io/yq/recipes)
