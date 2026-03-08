# Installing tfenv (Terraform Version Manager)

## Overview

tfenv is a version manager for Terraform, inspired by rbenv. It allows you to install, switch between, and manage multiple versions of Terraform on the same machine. This is essential for developers and DevOps engineers who work on projects requiring different Terraform versions, ensuring compatibility and reducing the risk of applying infrastructure changes with an incorrect Terraform binary.

Key capabilities include:

- **Version switching**: Easily install and switch between multiple Terraform versions
- **Automatic version selection**: Use `.terraform-version` files to auto-select the correct version per project
- **Hash verification**: Automatically validates downloads against HashiCorp's published SHA256 hashes
- **Signature verification**: Optionally verify PGP signatures using Keybase or GnuPG

**Important Platform Note**: tfenv is designed for POSIX-compliant systems (macOS, Linux, WSL). Native Windows support is experimental and limited to Git Bash with known symlink issues. For native Windows environments (PowerShell, Command Prompt), consider using Chocolatey to install specific Terraform versions directly (`choco install terraform --version=X.Y.Z -y`), or use WSL.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew package manager - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:**
  - `grep` (GNU grep) - Installed automatically as a dependency of the tfenv formula

### Ubuntu (APT/Snap)
- **Required:**
  - `git` - Install via `sudo apt-get install -y git`
  - `curl` - Install via `sudo apt-get install -y curl`
  - `unzip` - Install via `sudo apt-get install -y unzip`
- **Optional:**
  - `keybase` - For PGP signature verification of Terraform downloads
  - `gnupg` - Alternative for PGP signature verification
- **Auto-installed:** None (manual git clone installation)

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `git` - Install via `sudo apt-get install -y git`
  - `curl` - Install via `sudo apt-get install -y curl`
  - `unzip` - Install via `sudo apt-get install -y unzip`
- **Optional:**
  - `keybase` - For PGP signature verification of Terraform downloads
- **Auto-installed:** None (manual git clone installation)

### Amazon Linux (DNF/YUM)
- **Required:**
  - `git` - Install via `sudo dnf install -y git` (AL2023) or `sudo yum install -y git` (AL2)
  - `curl` - Install via `sudo dnf install -y curl` or `sudo yum install -y curl`
  - `unzip` - Install via `sudo dnf install -y unzip` or `sudo yum install -y unzip`
- **Optional:** None
- **Auto-installed:** None (manual git clone installation)

### Windows (Chocolatey/winget)
- **Required:**
  - WSL 2 with Ubuntu - tfenv does not run natively on Windows; use WSL instead
  - OR Git Bash (experimental, with known limitations)
- **Optional:** None
- **Auto-installed:** None

### Git Bash (Manual/Portable)
- **Required:**
  - Git Bash (comes with Git for Windows) - Download from https://git-scm.com/download/win
  - `unzip` - Usually included with Git Bash, or install via `choco install unzip -y` from PowerShell
- **Optional:** None
- **Auto-installed:** None

**Note on Dependencies**: tfenv requires `git` for installation and updates, `curl` or `wget` for downloading Terraform binaries, and `unzip` for extracting them. On Unix-like systems, these are typically pre-installed or easily available through package managers.

## Prerequisites

Before installing tfenv on any platform, ensure:

1. **Internet connectivity** - Required to clone the tfenv repository and download Terraform versions
2. **Terminal access** - Command line interface to run installation commands
3. **Git** - Required to clone the tfenv repository
4. **No existing tfenv or conflicting tools** - Remove any previous tfenv installations or conflicting version managers like `tenv`

**Why use a version manager?** Different Terraform configurations may require different Terraform versions. Using an incompatible version can cause state file corruption, unexpected behavior, or outright failures. A version manager ensures you always use the correct version for each project.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- zsh shell (default on macOS 10.15+) or bash

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

**Step 1: Install tfenv via Homebrew**

```bash
brew install --quiet tfenv
```

The `--quiet` flag suppresses non-essential output for automation-friendly installation. This installs tfenv version 3.0.0 (or later) from the official Homebrew formula.

**Note**: If you have the conflicting `tenv` package installed, you must remove it first:

```bash
brew uninstall tenv 2>/dev/null || true
```

**Step 2: Verify tfenv is in your PATH**

Homebrew automatically adds tfenv to your PATH. Verify by running:

```bash
which tfenv
```

Expected output:

```
/opt/homebrew/bin/tfenv
```

(On Intel Macs, the path will be `/usr/local/bin/tfenv`)

#### Verification

Confirm tfenv is installed correctly:

```bash
tfenv --version
```

Expected output (version numbers may vary):

```
tfenv 3.0.0
```

Test installing and using Terraform:

```bash
tfenv install latest
tfenv use latest
terraform --version
```

#### Troubleshooting

**Problem**: `tfenv: command not found` after installation

**Solution**: Ensure Homebrew is in your PATH. Add to your shell profile:

```bash
# For Apple Silicon Macs (M1/M2/M3)
eval "$(/opt/homebrew/bin/brew shellenv)"

# For Intel Macs
eval "$(/usr/local/bin/brew shellenv)"
```

**Problem**: Conflict with tenv package

**Solution**: tfenv conflicts with tenv (a multi-version manager). Remove tenv before installing tfenv:

```bash
brew uninstall tenv
brew install --quiet tfenv
```

**Problem**: `grep: invalid option` errors when using tfenv

**Solution**: tfenv requires GNU grep. Homebrew installs it as a dependency, but ensure it is available:

```bash
brew install --quiet grep
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 or later, or Debian 10 or later
- sudo privileges
- git, curl, and unzip installed

**Note**: tfenv is not available in the official Ubuntu/Debian APT repositories. Installation is performed via git clone from the official GitHub repository.

First, install required dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git curl unzip
```

#### Installation Steps

**Step 1: Clone the tfenv repository**

```bash
git clone --depth=1 https://github.com/tfutils/tfenv.git ~/.tfenv
```

The `--depth=1` flag creates a shallow clone for faster download.

**Step 2: Add tfenv to your PATH**

For bash (default shell on Ubuntu):

```bash
cat >> ~/.bashrc << 'EOF'

# tfenv configuration
export PATH="$HOME/.tfenv/bin:$PATH"
EOF
```

**Step 3: Reload your shell configuration**

```bash
source ~/.bashrc
```

**Alternative: Create symlinks to ~/.local/bin**

If you prefer symlinks instead of modifying PATH:

```bash
mkdir -p ~/.local/bin
ln -sf ~/.tfenv/bin/* ~/.local/bin/
```

This works because `~/.local/bin` is typically already in the default Ubuntu PATH.

#### Verification

Confirm tfenv is installed correctly:

```bash
tfenv --version
```

Expected output (version numbers may vary):

```
tfenv 3.0.0
```

Test installing and using Terraform:

```bash
tfenv install latest
tfenv use latest
terraform --version
```

#### Troubleshooting

**Problem**: `tfenv: command not found` after installation

**Solution**: Ensure the PATH configuration was added and the shell was reloaded:

```bash
grep -q "tfenv" ~/.bashrc && echo "Config exists" || echo "Config missing"
source ~/.bashrc
```

If missing, manually add the configuration:

```bash
echo 'export PATH="$HOME/.tfenv/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: `git: command not found`

**Solution**: Install git:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git
```

**Problem**: `unzip: command not found` when installing Terraform

**Solution**: Install unzip:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y unzip
```

**Problem**: Permission denied errors

**Solution**: tfenv should be installed as a regular user, not with sudo. If you installed with sudo, remove and reinstall:

```bash
sudo rm -rf ~/.tfenv
git clone --depth=1 https://github.com/tfutils/tfenv.git ~/.tfenv
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm, Bullseye, or Buster) - 64-bit or 32-bit
- Raspberry Pi 2 or later
- sudo privileges
- git, curl, and unzip installed

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM (Raspberry Pi 3/4/5 with 64-bit OS) - Full support
- `armv7l` = 32-bit ARM (Raspberry Pi 2/3/4 with 32-bit OS) - Full support
- `armv6l` = 32-bit ARM (Raspberry Pi Zero/1) - Limited Terraform version support

**Important**: tfenv automatically detects ARM architecture and downloads the appropriate Terraform binary. For 64-bit Raspberry Pi OS, it uses `linux_arm64` binaries. For 32-bit, it uses `linux_arm` binaries.

Install required dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git curl unzip
```

#### Installation Steps

**Step 1: Clone the tfenv repository**

```bash
git clone --depth=1 https://github.com/tfutils/tfenv.git ~/.tfenv
```

**Step 2: Add tfenv to your PATH**

```bash
cat >> ~/.bashrc << 'EOF'

# tfenv configuration
export PATH="$HOME/.tfenv/bin:$PATH"
EOF
```

**Step 3: Reload your shell configuration**

```bash
source ~/.bashrc
```

#### Verification

Confirm tfenv is installed correctly:

```bash
tfenv --version
```

Expected output:

```
tfenv 3.0.0
```

Test installing Terraform:

```bash
tfenv install latest
tfenv use latest
terraform --version
```

Expected output for ARM64 (version numbers may vary):

```
Terraform v1.14.3
on linux_arm64
```

#### Troubleshooting

**Problem**: `No versions matching 'X.Y.Z' for os 'linux', architecture 'arm64'`

**Solution**: Some older Terraform versions do not have ARM64 binaries. For older versions, you can force AMD64 architecture (requires emulation layer):

```bash
TFENV_ARCH=amd64 tfenv install 0.12.31
```

However, this is not recommended for production use. Prefer using Terraform versions that have native ARM support.

**Problem**: Download is very slow

**Solution**: Raspberry Pi network and SD card speeds can be limiting. Use a wired ethernet connection and a high-quality SD card (Class 10 or faster), or boot from USB/SSD.

**Problem**: `unzip: command not found`

**Solution**: Install unzip:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y unzip
```

**Problem**: Out of memory during Terraform operations

**Solution**: Add swap space:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges (typically ec2-user on EC2 instances)
- git, curl, and unzip installed

This is a common setup for managing Terraform versions on AWS EC2 instances.

First, install required dependencies:

```bash
# For Amazon Linux 2023
sudo dnf install -y git curl unzip

# For Amazon Linux 2
sudo yum install -y git curl unzip
```

#### Installation Steps

**Step 1: Clone the tfenv repository**

```bash
git clone --depth=1 https://github.com/tfutils/tfenv.git ~/.tfenv
```

**Step 2: Add tfenv to your PATH**

```bash
cat >> ~/.bashrc << 'EOF'

# tfenv configuration
export PATH="$HOME/.tfenv/bin:$PATH"
EOF
```

**Step 3: Activate tfenv in the current session**

```bash
source ~/.bashrc
```

#### Verification

Confirm tfenv is installed correctly:

```bash
tfenv --version
```

Expected output:

```
tfenv 3.0.0
```

Test installing and using Terraform:

```bash
tfenv install latest
tfenv use latest
terraform --version
```

Expected output (version numbers may vary):

```
Terraform v1.14.3
on linux_amd64
```

#### Troubleshooting

**Problem**: `tfenv: command not found` after running the install script

**Solution**: Source your shell profile:

```bash
source ~/.bashrc
```

If that does not work, manually add the configuration:

```bash
echo 'export PATH="$HOME/.tfenv/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: tfenv not available after EC2 instance restart

**Solution**: tfenv is user-specific. Ensure you are logged in as the same user who installed tfenv (typically ec2-user). The installation persists across reboots but requires sourcing the shell profile.

**Problem**: `git: command not found`

**Solution**: Install git:

```bash
# For AL2023
sudo dnf install -y git

# For AL2
sudo yum install -y git
```

**Problem**: Creating an AMI with tfenv pre-installed

**Solution**: After installing tfenv and any desired Terraform versions, you can create an AMI from the instance. The AMI will include the tfenv installation. Users of the AMI will need to run `source ~/.bashrc` or start a new shell session to access tfenv.

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed (recommended)
- OR Git Bash (experimental, with known limitations)

**Critical**: tfenv does not run natively on Windows (PowerShell or Command Prompt). Windows users must use one of these approaches:

1. **WSL 2 (Recommended)**: Install tfenv inside WSL Ubuntu - this provides full functionality
2. **Git Bash (Experimental)**: Limited support with known symlink issues

For native Windows Terraform version management without WSL, use Chocolatey to install specific Terraform versions directly:

```powershell
# Install a specific Terraform version on Windows
choco install terraform --version=1.14.3 -y

# Upgrade to a different version
choco upgrade terraform --version=1.9.0 -y
```

#### Installation Steps (WSL 2 - Recommended)

**Step 1: Ensure WSL 2 with Ubuntu is installed**

Open PowerShell as Administrator and run:

```powershell
wsl --install -d Ubuntu
```

Restart your computer if prompted, then set up your Ubuntu user account.

**Step 2: Install tfenv inside WSL Ubuntu**

Open Ubuntu from the Start menu, then run:

```bash
# Install dependencies
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git curl unzip

# Clone tfenv
git clone --depth=1 https://github.com/tfutils/tfenv.git ~/.tfenv

# Add to PATH
cat >> ~/.bashrc << 'EOF'

# tfenv configuration
export PATH="$HOME/.tfenv/bin:$PATH"
EOF

# Reload shell
source ~/.bashrc
```

#### Verification

In WSL Ubuntu terminal:

```bash
tfenv --version
```

Expected output:

```
tfenv 3.0.0
```

Test installing Terraform:

```bash
tfenv install latest
tfenv use latest
terraform --version
```

#### Troubleshooting

**Problem**: tfenv works in WSL but not in Windows PowerShell

**Solution**: tfenv installed in WSL is only available within WSL. For Windows terminals, use Chocolatey to install Terraform directly:

```powershell
choco install terraform -y
```

**Problem**: WSL not installed

**Solution**: Install WSL 2 from Administrator PowerShell:

```powershell
wsl --install
```

**Problem**: Ubuntu not available in WSL

**Solution**: Install Ubuntu distribution:

```powershell
wsl --install -d Ubuntu
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

WSL runs a full Linux environment, so tfenv installation follows the standard Linux procedure.

Install required dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git curl unzip
```

#### Installation Steps

**Step 1: Clone the tfenv repository**

```bash
git clone --depth=1 https://github.com/tfutils/tfenv.git ~/.tfenv
```

**Step 2: Add tfenv to your PATH**

```bash
cat >> ~/.bashrc << 'EOF'

# tfenv configuration
export PATH="$HOME/.tfenv/bin:$PATH"
EOF
```

**Step 3: Reload your shell configuration**

```bash
source ~/.bashrc
```

**Step 4: Install Terraform**

```bash
tfenv install latest
tfenv use latest
```

#### Verification

Confirm tfenv is installed correctly:

```bash
tfenv --version
```

Expected output:

```
tfenv 3.0.0
```

Verify Terraform installation:

```bash
terraform --version
```

Expected output:

```
Terraform v1.14.3
on linux_amd64
```

#### Troubleshooting

**Problem**: `tfenv: command not found` in WSL

**Solution**: The PATH was not updated. Manually add the configuration:

```bash
echo 'export PATH="$HOME/.tfenv/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: tfenv works in WSL but not in Windows terminal

**Solution**: tfenv installed in WSL is only available within WSL. For Windows terminals (PowerShell, Command Prompt), install Terraform separately using Chocolatey (see Windows section).

**Problem**: Different Terraform versions in WSL vs Windows

**Solution**: WSL and Windows maintain separate environments. If you need the same Terraform version in both:

1. In WSL: `tfenv install 1.14.3 && tfenv use 1.14.3`
2. In Windows: `choco install terraform --version=1.14.3 -y`

**Problem**: File permission issues when accessing Windows files from WSL

**Solution**: When working with files on the Windows filesystem (`/mnt/c/...`), Terraform may have permission issues. Store your Terraform configurations in the Linux filesystem (`~/projects/`) for best performance and compatibility.

---

### Git Bash (Experimental - Manual/Portable)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- unzip available (typically included with Git Bash)

**Important Warning**: tfenv on Windows Git Bash is experimental and has known symlink issues. The tfenv maintainers note that Windows (64-bit) is "only tested in git-bash and is currently presumed failing due to symlink issues." For production use, strongly recommend using WSL instead.

#### Installation Steps

**Step 1: Clone the tfenv repository**

Open Git Bash and run:

```bash
git clone --depth=1 https://github.com/tfutils/tfenv.git ~/.tfenv
```

**Step 2: Add tfenv to your PATH**

```bash
cat >> ~/.bashrc << 'EOF'

# tfenv configuration
export PATH="$HOME/.tfenv/bin:$PATH"
EOF
```

**Step 3: Reload your shell configuration**

```bash
source ~/.bashrc
```

**Step 4: Test tfenv (may have issues)**

```bash
tfenv --version
```

If this works, attempt to install Terraform:

```bash
tfenv install latest
tfenv use latest
```

#### Verification

In Git Bash, confirm tfenv is accessible:

```bash
tfenv --version
```

Expected output (if working):

```
tfenv 3.0.0
```

Test Terraform:

```bash
terraform --version
```

#### Troubleshooting

**Problem**: Symlink errors when running `tfenv use`

**Solution**: This is a known limitation of tfenv on Windows Git Bash. Git Bash's MinGW environment does not fully support Unix symlinks. Workarounds include:

1. **Use WSL instead** (recommended) - Full tfenv functionality
2. **Run Git Bash as Administrator** - May help with symlink creation:
   Right-click Git Bash shortcut and select "Run as administrator"
3. **Enable Developer Mode in Windows** - This allows symlink creation without admin rights:
   Settings > Update & Security > For developers > Developer Mode

**Problem**: `tfenv: command not found` in Git Bash

**Solution**: Git Bash must source `~/.bashrc`. Verify the configuration:

```bash
grep -q "tfenv" ~/.bashrc && echo "Config exists" || echo "Config missing"
source ~/.bashrc
```

**Problem**: `unzip: command not found`

**Solution**: Git Bash typically includes unzip. If missing, install via Chocolatey from PowerShell (Administrator):

```powershell
choco install unzip -y
```

Then restart Git Bash.

**Problem**: tfenv works but `terraform` command not found after `tfenv use`

**Solution**: The symlink creation likely failed. Check if terraform binary exists:

```bash
ls -la ~/.tfenv/versions/*/terraform.exe
```

If the binary exists but symlinks failed, manually add the version directory to PATH:

```bash
export PATH="$HOME/.tfenv/versions/$(tfenv version-name):$PATH"
```

**Alternative for Windows Git Bash users**: If tfenv proves unreliable, use Chocolatey from PowerShell to manage Terraform versions:

```powershell
# Install Terraform via Chocolatey (from Administrator PowerShell)
choco install terraform -y

# The terraform command will then be available in Git Bash
```

---

## Post-Installation Configuration

After installing tfenv on any platform, consider these common configurations.

### Setting a Default Terraform Version

Install and set a default Terraform version:

```bash
# Install the latest Terraform version
tfenv install latest

# Set it as the default
tfenv use latest
```

### Automatic Version Switching with .terraform-version

Create a `.terraform-version` file in your project root to specify the Terraform version:

```bash
echo "1.14.3" > .terraform-version
```

When you navigate to that directory and run any terraform command, tfenv automatically uses the specified version. If the version is not installed, tfenv will install it automatically (when `TFENV_AUTO_INSTALL=true`, which is the default).

Supported `.terraform-version` file values:

- Exact version: `1.14.3`
- Latest: `latest`
- Latest matching regex: `latest:^1.9`
- Latest allowed by terraform files: `latest-allowed`
- Minimum required: `min-required`

### Listing Available and Installed Versions

View all installed Terraform versions:

```bash
tfenv list
```

View all available versions for installation:

```bash
tfenv list-remote
```

### Uninstalling a Terraform Version

Remove a specific version:

```bash
tfenv uninstall 1.9.0
```

Remove the latest installed version:

```bash
tfenv uninstall latest
```

### Updating tfenv

Update tfenv to the latest version:

```bash
git -C ~/.tfenv pull
```

For Homebrew installations on macOS:

```bash
brew upgrade tfenv
```

### Environment Variables

tfenv supports several environment variables for customization:

| Variable | Description | Default |
|----------|-------------|---------|
| `TFENV_ARCH` | Architecture to download (amd64, arm64) | Auto-detected |
| `TFENV_AUTO_INSTALL` | Auto-install missing versions | `true` |
| `TFENV_TERRAFORM_VERSION` | Override .terraform-version file | (none) |
| `TFENV_CURL_OUTPUT` | Control download progress display | `0` (disabled) |
| `TFENV_DEBUG` | Enable debug output (0-3 levels) | `0` |
| `TFENV_REMOTE` | Custom Terraform download source | HashiCorp releases |

Example using environment variables:

```bash
# Force AMD64 architecture
TFENV_ARCH=amd64 tfenv install 1.14.3

# Install specific version without .terraform-version file
TFENV_TERRAFORM_VERSION=1.9.0 terraform init
```

---

## Common Issues

### Issue: "No installed versions of terraform matched"

**Symptoms**: Error when running terraform commands indicating no version is installed or selected.

**Solutions**:

1. Install a Terraform version:

```bash
tfenv install latest
tfenv use latest
```

2. Check if a version is selected:

```bash
tfenv version
```

3. Create a `.terraform-version` file in your project:

```bash
echo "latest" > .terraform-version
```

### Issue: "shasum: command not found"

**Symptoms**: Warning about missing shasum during Terraform installation.

**Solutions**:

- On Ubuntu/Debian: shasum is typically available; if not, install perl:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y perl
```

- On Amazon Linux:

```bash
sudo yum install -y perl-Digest-SHA
```

This is a warning only - tfenv will still install Terraform, but will skip hash verification.

### Issue: Version Conflicts with System Terraform

**Symptoms**: Running `terraform --version` shows a different version than `tfenv version`.

**Solutions**:

- Ensure tfenv's bin directory is at the beginning of your PATH (before any system directories)
- Check for system-installed Terraform:

```bash
which -a terraform
```

- Remove system-installed Terraform or ensure `~/.tfenv/bin` comes first in PATH:

```bash
export PATH="$HOME/.tfenv/bin:$PATH"
```

### Issue: "Permission denied" Errors

**Symptoms**: Cannot install Terraform versions or access tfenv directory.

**Solutions**:

- tfenv should be installed as a regular user, not with sudo
- Fix ownership if needed:

```bash
sudo chown -R $USER:$USER ~/.tfenv
```

### Issue: Slow Terraform Downloads

**Symptoms**: `tfenv install` takes a long time or times out.

**Solutions**:

- Check internet connectivity
- For corporate networks, configure proxy:

```bash
export HTTP_PROXY="http://proxy.example.com:8080"
export HTTPS_PROXY="http://proxy.example.com:8080"
```

- Use a custom mirror with `TFENV_REMOTE` environment variable

### Issue: ARM64 Version Not Available

**Symptoms**: `tfenv install` fails on ARM systems for older Terraform versions.

**Solutions**:

- Use a Terraform version that supports ARM64 (1.0.0 and later have good ARM support)
- Force AMD64 architecture (not recommended for production):

```bash
TFENV_ARCH=amd64 tfenv install 0.12.31
```

---

## References

- [tfenv Official GitHub Repository](https://github.com/tfutils/tfenv)
- [tfenv Homebrew Formula](https://formulae.brew.sh/formula/tfenv)
- [HashiCorp Terraform Downloads](https://releases.hashicorp.com/terraform/)
- [Installing tfenv on Ubuntu](https://brain2life.hashnode.dev/how-to-install-tfenv-terraform-version-manager-on-ubuntu-os)
- [Installing tfenv with WSL2 on Windows](https://medium.com/azure-terraformer/installing-and-using-tfenv-with-wsl2-on-windows-2f5d442e0ca6)
- [How to Use tfenv to Manage Multiple Terraform Versions (Spacelift)](https://spacelift.io/blog/tfenv)
- [Manage Multiple Terraform Versions with tfenv (Opensource.com)](https://opensource.com/article/20/11/tfenv)
- [tfenv ARM64 Support Issue Discussion](https://github.com/tfutils/tfenv/issues/337)
