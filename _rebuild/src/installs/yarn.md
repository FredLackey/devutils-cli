# Installing Yarn

## Overview

Yarn is a fast, reliable, and secure JavaScript package manager developed by Facebook (now Meta) as an alternative to npm. It addresses key pain points in JavaScript dependency management by offering deterministic installations, offline caching, and parallel downloads. Yarn provides two major version lines:

- **Yarn Classic (1.x)**: The original, stable version still widely used in production environments. This is what system package managers (Homebrew, APT, Chocolatey) install by default.
- **Yarn Modern (Berry, 2.x+)**: A complete rewrite with advanced features like Plug'n'Play (zero `node_modules`), workspaces, and plugins. Managed per-project via Corepack or `yarn set version`.

Key capabilities of Yarn:

- Deterministic dependency resolution through lockfiles
- Parallel package downloads for faster installations
- Offline mode using cached packages
- Workspaces for monorepo management
- Security-focused design with integrity checks

This guide documents Yarn Classic (1.x) installation for system-wide availability across all platforms supported by DevUtils CLI. For projects requiring Yarn Modern (2.x+), use Corepack after installing Node.js.

## Prerequisites

Before installing Yarn on any platform, ensure:

1. **Node.js installed** - Yarn requires Node.js 18 or later (LTS recommended)
2. **Internet connectivity** - Required to download Yarn packages
3. **Administrative privileges** - Required for system-wide installation
4. **Terminal access** - Required to run installation commands

**Version Strategy**: This guide installs Yarn Classic (1.x) for maximum compatibility. If your project requires Yarn Modern (2.x, 3.x, or 4.x), install Node.js first, then use Corepack:

```bash
corepack enable
yarn init -2
```

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or `dev install homebrew`
- **Optional:** None
- **Auto-installed:**
  - Node.js - Homebrew automatically installs Node.js as a dependency if not present

### Ubuntu (APT/Snap)
- **Required:**
  - `curl` - Install via `sudo apt-get install -y curl`
  - `gnupg` - Install via `sudo apt-get install -y gnupg`
  - `ca-certificates` - Install via `sudo apt-get install -y ca-certificates`
- **Optional:**
  - Node.js - Install via `dev install node` or NodeSource repository (recommended but not enforced by installer)
- **Auto-installed:**
  - None (all dependencies must be explicitly installed)
- **Note:** The conflicting `cmdtest` package is automatically removed if present

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `curl` - Install via `sudo apt-get install -y curl`
  - `gnupg` - Install via `sudo apt-get install -y gnupg`
  - `ca-certificates` - Install via `sudo apt-get install -y ca-certificates`
- **Optional:**
  - Node.js - Install via `dev install node` or NodeSource repository (recommended but not enforced by installer)
- **Auto-installed:**
  - None (all dependencies must be explicitly installed)
- **Note:** The conflicting `cmdtest` package is automatically removed if present

### Amazon Linux (DNF/YUM)
- **Required:**
  - `curl` - Install via `sudo dnf install -y curl` (AL2023) or `sudo yum install -y curl` (AL2)
  - DNF or YUM package manager - Pre-installed on Amazon Linux, RHEL, Fedora, CentOS
- **Optional:**
  - Node.js - Install via `dev install node` (recommended but not enforced by installer)
- **Auto-installed:**
  - None (all dependencies must be explicitly installed)

### Windows (Chocolatey/winget)
- **Required:**
  - Chocolatey - Install via PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
  - Administrator privileges - Required for Chocolatey package installation
- **Optional:**
  - Node.js - Install via `choco install nodejs-lts -y` (recommended but Chocolatey can install it automatically as a dependency)
- **Auto-installed:**
  - Node.js - Chocolatey can automatically install Node.js as a dependency if missing

### Git Bash (Manual/Portable)
- **Required:**
  - Git Bash (Git for Windows) - Download from https://git-scm.com/download/win
  - Chocolatey on Windows host - Install via PowerShell (see Windows section above)
  - Administrator privileges - Required for Chocolatey operations via PowerShell interop
- **Optional:**
  - `winpty` - Install via `pacman -S winpty` in Git Bash (for interactive Yarn commands, usually pre-installed with Git for Windows)
  - Node.js - Install via `choco install nodejs-lts -y` (recommended)
- **Auto-installed:**
  - Node.js - Chocolatey can automatically install Node.js as a dependency if missing
- **Note:** Yarn is installed on the Windows host and becomes available in Git Bash through PATH inheritance

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 12 (Monterey) or later (macOS 14 Sonoma or later recommended)
- Homebrew package manager installed
- Node.js installed (Homebrew will install it as a dependency if missing)
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

If Node.js is not installed, install it first:

```bash
brew install --quiet node
```

#### Installation Steps

Run the following command to install Yarn:

```bash
brew install --quiet yarn
```

The `--quiet` flag suppresses non-essential output, making the installation suitable for automation and scripts. This installs Yarn Classic (1.22.x), which is the stable version provided by Homebrew.

**Note**: The Homebrew `yarn` formula conflicts with `corepack` and `hadoop` packages. If you have either installed, you must uninstall them first or use npm to install Yarn instead.

#### Verification

Confirm the installation succeeded:

```bash
yarn --version
```

Expected output (version numbers may vary):

```
1.22.22
```

Verify the Homebrew version is being used:

```bash
which yarn
```

Expected output for Apple Silicon Macs:

```
/opt/homebrew/bin/yarn
```

Expected output for Intel Macs:

```
/usr/local/bin/yarn
```

Test Yarn works by checking its configuration:

```bash
yarn config list
```

#### Troubleshooting

**Problem**: `brew: command not found`

**Solution**: Homebrew is not installed or not in PATH. Install Homebrew first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Problem**: Conflict with corepack

**Solution**: If you see a conflict error, you must choose between Homebrew's Yarn or Corepack-managed Yarn:

```bash
# Option: Remove Homebrew yarn and use corepack
brew uninstall yarn
corepack enable
```

**Problem**: `yarn --version` shows unexpected version or command not found

**Solution**: Ensure Homebrew's bin directory is in your PATH before other directories:

```bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

For Intel Macs, use `/usr/local/bin` instead of `/opt/homebrew/bin`.

**Problem**: Yarn cannot find Node.js

**Solution**: Ensure Node.js is installed via Homebrew:

```bash
brew install --quiet node
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later (64-bit)
- sudo privileges
- Node.js installed (install via NodeSource repository for latest versions)
- curl and gnupg installed

**Important**: Some older Ubuntu versions ship with a package called `cmdtest` that provides a different `yarn` command. Remove it first to avoid conflicts.

#### Installation Steps

**Step 1: Remove conflicting packages**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y cmdtest 2>/dev/null || true
```

**Step 2: Install prerequisites**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl gnupg ca-certificates
```

**Step 3: Add the Yarn GPG key and repository**

```bash
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | sudo tee /etc/apt/keyrings/yarn-archive-keyring.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/yarn-archive-keyring.gpg] https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list > /dev/null
```

**Step 4: Install Yarn**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y yarn
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures no interactive prompts appear during installation, making this suitable for scripts and automation.

**Note for nvm users**: If you manage Node.js with nvm, install Yarn without the Node.js dependency:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends yarn
```

#### Verification

Confirm the installation succeeded:

```bash
yarn --version
```

Expected output (version numbers may vary):

```
1.22.22
```

Verify the installation location:

```bash
which yarn
```

Expected output:

```
/usr/bin/yarn
```

Test Yarn works by checking its configuration:

```bash
yarn config list
```

#### Troubleshooting

**Problem**: `E: Unable to locate package yarn`

**Solution**: The Yarn repository was not added correctly. Re-run the repository setup:

```bash
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | sudo tee /etc/apt/keyrings/yarn-archive-keyring.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/yarn-archive-keyring.gpg] https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Running `yarn` opens a different program (cmdtest)

**Solution**: The `cmdtest` package provides a conflicting `yarn` command. Remove it:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y cmdtest
hash -r
```

**Problem**: GPG key errors during repository setup

**Solution**: Ensure gnupg and ca-certificates are installed:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnupg ca-certificates
```

**Problem**: Yarn cannot find Node.js

**Solution**: Install Node.js via the NodeSource repository:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye recommended)
- Raspberry Pi 3B+ or later (64-bit OS recommended)
- At least 1 GB RAM (2 GB or more recommended)
- sudo privileges
- Node.js installed
- Internet connectivity

**Architecture Note**: Raspberry Pi OS supports both 32-bit (armhf/armv7l) and 64-bit (arm64/aarch64) versions. Yarn works on both architectures.

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM (recommended)
- `armv7l` = 32-bit ARM

#### Installation Steps

The installation process is identical to Ubuntu/Debian since Raspberry Pi OS is Debian-based.

**Step 1: Remove conflicting packages**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y cmdtest 2>/dev/null || true
```

**Step 2: Install prerequisites**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl gnupg ca-certificates
```

**Step 3: Add the Yarn GPG key and repository**

```bash
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | sudo tee /etc/apt/keyrings/yarn-archive-keyring.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/yarn-archive-keyring.gpg] https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list > /dev/null
```

**Step 4: Install Yarn**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y yarn
```

#### Verification

Confirm the installation succeeded:

```bash
yarn --version
```

Expected output (version numbers may vary):

```
1.22.22
```

Test Yarn works with your architecture:

```bash
yarn config list
node -e "console.log('Yarn is working on ' + process.arch)"
```

Expected output:

```
Yarn is working on arm64
```

(or `arm` for 32-bit systems)

#### Troubleshooting

**Problem**: Installation is very slow

**Solution**: Raspberry Pi SD cards can be slow. Use a high-quality SD card (Class 10, A1/A2 rated) or boot from USB/SSD for better performance.

**Problem**: `yarn install` fails with out of memory errors

**Solution**: Raspberry Pi has limited RAM. Increase swap space:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Problem**: Yarn cannot find Node.js on ARMv6 (Pi Zero/Pi 1)

**Solution**: ARMv6 requires unofficial Node.js builds. See the Node.js documentation for ARMv6 installation, then install Yarn via npm:

```bash
npm install -g yarn
```

---

### Amazon Linux/RHEL (YUM/DNF)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- Alternatively: RHEL 8+, CentOS Stream 8+, Fedora 36+
- sudo privileges
- Node.js installed
- Internet connectivity

**Note**: Amazon Linux 2023 uses DNF as the package manager. Amazon Linux 2 uses YUM. The commands below work with both.

#### Installation Steps

**Step 1: Import the Yarn GPG key**

```bash
sudo rpm --import https://dl.yarnpkg.com/rpm/pubkey.gpg
```

**Step 2: Add the Yarn repository**

```bash
sudo curl -sL https://dl.yarnpkg.com/rpm/yarn.repo -o /etc/yum.repos.d/yarn.repo
```

**Step 3: Install Yarn**

For Amazon Linux 2023 / RHEL 8+ / Fedora (DNF):

```bash
sudo dnf install -y yarn
```

For Amazon Linux 2 / RHEL 7 / CentOS 7 (YUM):

```bash
sudo yum install -y yarn
```

The `-y` flag automatically confirms the installation, making this suitable for scripts and automation.

#### Verification

Confirm the installation succeeded:

```bash
yarn --version
```

Expected output (version numbers may vary):

```
1.22.22
```

Verify the installation location:

```bash
which yarn
```

Expected output:

```
/usr/bin/yarn
```

Test Yarn works:

```bash
yarn config list
```

#### Troubleshooting

**Problem**: `No package yarn available`

**Solution**: The Yarn repository was not added correctly. Verify the repo file exists:

```bash
cat /etc/yum.repos.d/yarn.repo
```

If empty or missing, re-run the repository setup:

```bash
sudo curl -sL https://dl.yarnpkg.com/rpm/yarn.repo -o /etc/yum.repos.d/yarn.repo
sudo dnf clean all  # or: sudo yum clean all
```

**Problem**: GPG key verification fails

**Solution**: Import the GPG key:

```bash
sudo rpm --import https://dl.yarnpkg.com/rpm/pubkey.gpg
```

**Problem**: Yarn cannot find Node.js

**Solution**: Install Node.js first. For Amazon Linux 2023:

```bash
sudo dnf install -y nodejs22 nodejs22-npm
sudo alternatives --set node /usr/bin/node-22
```

For Amazon Linux 2:

```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 1903 or higher (64-bit), or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed
- Node.js installed (Chocolatey can install it automatically)
- Internet connectivity

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

If Node.js is not installed, install it first:

```powershell
choco install nodejs-lts -y
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install yarn -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation suitable for automation and scripts. This installs Yarn Classic (1.22.x).

After installation, close and reopen your terminal to ensure PATH changes take effect.

#### Verification

Open a new Command Prompt or PowerShell window, then run:

```powershell
yarn --version
```

Expected output (version numbers may vary):

```
1.22.22
```

Verify the installation location:

```powershell
where yarn
```

Expected output:

```
C:\Program Files (x86)\Yarn\bin\yarn
C:\Program Files (x86)\Yarn\bin\yarn.cmd
```

Test Yarn works:

```powershell
yarn config list
```

#### Troubleshooting

**Problem**: `'yarn' is not recognized as an internal or external command`

**Solution**: Close and reopen your terminal window. If the problem persists, verify Yarn is in your PATH:

```powershell
$env:PATH -split ';' | Select-String -Pattern 'Yarn'
```

If not listed, add it manually or reinstall:

```powershell
choco uninstall yarn -y
choco install yarn -y
```

**Problem**: Chocolatey installation fails

**Solution**: Ensure you are running PowerShell as Administrator. Right-click PowerShell and select "Run as administrator".

**Problem**: Node.js not found

**Solution**: Install Node.js before Yarn:

```powershell
choco install nodejs-lts -y
```

Close and reopen your terminal, then install Yarn.

**Problem**: SSL/TLS errors during installation

**Solution**: Update your security protocols before installing:

```powershell
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
choco install yarn -y
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL
- Node.js installed within WSL
- Internet connectivity

WSL runs Ubuntu (or another Linux distribution) within Windows. Yarn must be installed separately within WSL, as it does not share binaries with Windows.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

**Step 1: Remove conflicting packages**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y cmdtest 2>/dev/null || true
```

**Step 2: Install prerequisites**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl gnupg ca-certificates
```

**Step 3: Add the Yarn GPG key and repository**

```bash
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | sudo tee /etc/apt/keyrings/yarn-archive-keyring.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/yarn-archive-keyring.gpg] https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list > /dev/null
```

**Step 4: Install Yarn**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y yarn
```

#### Verification

Confirm the installation succeeded:

```bash
yarn --version
```

Expected output (version numbers may vary):

```
1.22.22
```

Verify the installation location:

```bash
which yarn
```

Expected output:

```
/usr/bin/yarn
```

#### Troubleshooting

**Problem**: Yarn version differs between WSL and Windows

**Solution**: This is expected behavior. WSL and Windows maintain separate Yarn installations. Use the appropriate installation for each environment:

- Inside WSL terminal: Use Linux Yarn (`/usr/bin/yarn`)
- In Windows PowerShell/CMD: Use Windows Yarn (`C:\Program Files (x86)\Yarn\bin\yarn`)

**Problem**: `yarn install` is slow or times out

**Solution**: WSL file system performance is better on the Linux filesystem. Store your projects in the WSL home directory (`~/projects`) rather than Windows mounts (`/mnt/c/...`):

```bash
mkdir -p ~/projects
cd ~/projects
```

**Problem**: Node.js not found

**Solution**: Install Node.js in WSL using the NodeSource repository:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Administrator access for installation
- Node.js and Yarn installed on Windows
- Internet connectivity

**Note**: Git Bash on Windows does not require a separate Yarn installation. Git Bash inherits the Windows PATH, so once Yarn is installed on Windows, the `yarn` command is automatically available in Git Bash.

#### Installation Steps

**Step 1: Install Yarn on Windows using Chocolatey**

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install yarn -y
```

**Step 2: Close and reopen Git Bash**

After installation, close any open Git Bash windows and open a new one to pick up the updated PATH.

**Step 3: Verify Yarn is accessible**

In Git Bash:

```bash
yarn --version
```

#### Verification

In Git Bash, confirm Yarn is accessible:

```bash
yarn --version
```

Expected output (version numbers may vary):

```
1.22.22
```

Verify the PATH includes Yarn:

```bash
which yarn
```

Expected output:

```
/c/Program Files (x86)/Yarn/bin/yarn
```

Test Yarn works:

```bash
yarn config list
```

#### Troubleshooting

**Problem**: `yarn: command not found` in Git Bash

**Solution**: Yarn may not be in PATH or Git Bash was opened before installation completed. First, close and reopen Git Bash. Then verify the PATH includes Yarn:

```bash
echo $PATH | tr ':' '\n' | grep -i yarn
```

If Yarn is not in PATH, add it to your `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/c/Program Files (x86)/Yarn/bin"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: `the input device is not a TTY` error with interactive commands

**Solution**: Git Bash's mintty terminal has TTY compatibility issues. Use the `winpty` prefix for interactive commands:

```bash
winpty yarn
```

Or add an alias to your `~/.bashrc`:

```bash
echo 'alias yarn="winpty yarn"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Path conversion issues (Unix paths being converted to Windows paths)

**Solution**: Git Bash automatically converts Unix-style paths. To prevent this for specific commands, set `MSYS_NO_PATHCONV`:

```bash
MSYS_NO_PATHCONV=1 yarn add /path/to/local/package
```

---

## Post-Installation Configuration

After installing Yarn on any platform, consider these optional but recommended configurations.

### Verify Yarn is Working

Test Yarn by checking its version and configuration:

```bash
yarn --version
yarn config list
```

### Set Default Registry

Yarn uses the npm registry by default. To verify or set the registry:

```bash
yarn config get registry
```

Expected output:

```
https://registry.yarnpkg.com
```

To use the npm registry instead:

```bash
yarn config set registry https://registry.npmjs.org
```

### Configure Yarn Initialization Defaults

Set default values for `yarn init`:

```bash
yarn config set init-author-name "Your Name"
yarn config set init-author-email "your.email@example.com"
yarn config set init-license "MIT"
```

### Configure Offline Mirror (Optional)

For offline installations or faster CI/CD, configure a local cache:

```bash
yarn config set yarn-offline-mirror ./npm-packages-offline-cache
yarn config set yarn-offline-mirror-pruning true
```

### Upgrade to Yarn Modern (Per-Project)

If a project requires Yarn 2+ (Berry), use Corepack after installing Node.js 16.10+:

```bash
corepack enable
cd /path/to/your/project
yarn set version stable
yarn install
```

This creates project-specific Yarn configuration without affecting your global Yarn Classic installation.

---

## Common Issues

### Issue: "There appears to be trouble with your network connection"

**Symptoms**: Yarn cannot download packages, displays network retry messages

**Solutions**:

- Check your internet connection
- If behind a corporate proxy, configure Yarn:

```bash
yarn config set proxy http://proxy.example.com:8080
yarn config set https-proxy http://proxy.example.com:8080
```

- Increase network timeout:

```bash
yarn config set network-timeout 300000
```

### Issue: "Integrity check failed" or Checksum Mismatch

**Symptoms**: `error Integrity check failed for "package-name"`

**Solutions**:

- Clear the Yarn cache:

```bash
yarn cache clean
```

- Delete `yarn.lock` and `node_modules`, then reinstall:

```bash
rm -rf node_modules yarn.lock
yarn install
```

### Issue: Permission Denied Errors

**Symptoms**: `EACCES: permission denied` when running Yarn commands

**Solutions**:

- Do not use `sudo` with Yarn - it creates permission issues
- Fix npm global directory permissions:

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc  # or ~/.zshrc on macOS
source ~/.bashrc
```

### Issue: Yarn Classic vs Modern Confusion

**Symptoms**: Different Yarn behavior or commands across projects

**Solutions**:

- Check which version a project uses:

```bash
yarn --version
```

- Yarn 1.x uses `yarn.lock` and `node_modules`
- Yarn 2+ may use `.yarnrc.yml`, `.pnp.cjs`, and `.yarn/` directory
- To use a specific version per-project:

```bash
# For Yarn Modern
corepack enable
yarn set version stable

# For Yarn Classic
yarn set version classic
```

### Issue: "The engine 'node' is incompatible with this module"

**Symptoms**: Yarn refuses to install packages due to Node.js version mismatch

**Solutions**:

- Check your Node.js version:

```bash
node --version
```

- Install the required Node.js version (use nvm for version management)
- To ignore engine checks (not recommended for production):

```bash
yarn install --ignore-engines
```

### Issue: Slow Installation Times

**Symptoms**: `yarn install` takes very long

**Solutions**:

- Check if offline mirror is configured and populated
- Use `--prefer-offline` for cached packages:

```bash
yarn install --prefer-offline
```

- For CI/CD, use `--frozen-lockfile` to skip resolution:

```bash
yarn install --frozen-lockfile
```

---

## References

- [Yarn Official Website](https://yarnpkg.com/)
- [Yarn Classic Documentation](https://classic.yarnpkg.com/)
- [Yarn Installation Guide (Modern)](https://yarnpkg.com/getting-started/install)
- [Yarn Classic Installation Guide](https://classic.yarnpkg.com/lang/en/docs/install/)
- [Yarn GitHub Repository (Classic 1.x)](https://github.com/yarnpkg/yarn)
- [Yarn GitHub Repository (Modern/Berry)](https://github.com/yarnpkg/berry)
- [Homebrew Yarn Formula](https://formulae.brew.sh/formula/yarn)
- [Chocolatey Yarn Package](https://community.chocolatey.org/packages/yarn)
- [Yarn APT/RPM Repository](https://github.com/yarnpkg/releases)
- [Node.js Corepack Documentation](https://nodejs.org/api/corepack.html)
- [Yarn Corepack Integration](https://yarnpkg.com/corepack)
