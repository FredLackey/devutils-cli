# Installing Node.js

## Overview

Node.js is a free, open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside of a web browser. Built on Chrome's V8 JavaScript engine, Node.js enables developers to use JavaScript for server-side scripting, command-line tools, and desktop applications.

Node.js includes npm (Node Package Manager), the world's largest software registry with over two million packages. Together, Node.js and npm form the foundation of modern JavaScript development.

Key capabilities of Node.js:

- Build web servers and APIs with frameworks like Express.js
- Create command-line tools and scripts
- Develop desktop applications with Electron
- Run build tools like webpack, Vite, and esbuild
- Execute automated tests and CI/CD pipelines

This guide documents Node.js installation procedures for all platforms supported by DevUtils CLI, using the current LTS (Long Term Support) version for stability and long-term maintenance.

## Prerequisites

Before installing Node.js on any platform, ensure:

1. **Internet connectivity** - Required to download Node.js packages
2. **Administrative privileges** - Required for system-wide installation
3. **Terminal access** - Required to run installation commands
4. **Sufficient disk space** - At least 500 MB free space recommended

**Version Selection**: This guide installs Node.js LTS (currently v24.x) for production stability. The LTS version receives security updates and bug fixes for 30 months. For development with bleeding-edge features, the Current release (v25.x) is available but not documented here due to its shorter support window.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew package manager - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None (Homebrew manages all Node.js dependencies internally)

### Ubuntu (APT/Snap)
- **Required:**
  - `curl` - Install via `sudo apt-get install -y curl` (required to download NodeSource setup script)
  - `ca-certificates` - Install via `sudo apt-get install -y ca-certificates` (required for HTTPS verification)
  - `gnupg` - Install via `sudo apt-get install -y gnupg` (required for GPG key verification)
- **Optional:**
  - `build-essential` - Install via `sudo apt-get install -y build-essential` (required for compiling native npm modules)
- **Auto-installed:** All nodejs runtime dependencies are handled automatically by APT

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `curl` - Install via `sudo apt-get install -y curl` (required to download NodeSource setup script)
  - `ca-certificates` - Install via `sudo apt-get install -y ca-certificates` (required for HTTPS verification)
  - `gnupg` - Install via `sudo apt-get install -y gnupg` (required for GPG key verification)
- **Optional:**
  - `build-essential` - Install via `sudo apt-get install -y build-essential` (required for compiling native npm modules)
  - `python3` - Install via `sudo apt-get install -y python3` (required for some native module build scripts)
- **Auto-installed:** All nodejs runtime dependencies are handled automatically by APT

### Amazon Linux (DNF/YUM)

**For Amazon Linux 2023 (DNF):**
- **Required:** None (dnf is pre-installed on Amazon Linux 2023)
- **Optional:** None
- **Auto-installed:** `nodejs22-npm` is installed alongside `nodejs22` automatically

**For Amazon Linux 2 (YUM):**
- **Required:**
  - `curl` - Install via `sudo yum install -y curl` (required to download NodeSource setup script)
- **Optional:**
  - `gcc-c++` - Install via `sudo yum install -y gcc-c++` (required for compiling native npm modules)
  - `make` - Install via `sudo yum install -y make` (required for compiling native npm modules)
- **Auto-installed:** All nodejs runtime dependencies are handled automatically by YUM

### Windows (Chocolatey/winget)
- **Required:**
  - Chocolatey package manager - Install via PowerShell (Administrator): `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
- **Optional:** None
- **Auto-installed:** `npm` is bundled with the `nodejs-lts` Chocolatey package

### Git Bash (Manual/Portable)
- **Required:**
  - Chocolatey package manager on Windows host - Install via PowerShell (Administrator): `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
  - PowerShell - Pre-installed on Windows 10/11
- **Optional:** None
- **Auto-installed:** `npm` is bundled with the `nodejs-lts` Chocolatey package installed on the Windows host

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 12 (Monterey) or later (macOS 14 Sonoma or later recommended)
- Homebrew package manager installed
- Command line access via Terminal.app or iTerm2
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Node.js LTS:

```bash
brew install --quiet node
```

The `--quiet` flag suppresses non-essential output, making the installation suitable for automation and scripts. This command installs the latest stable Node.js version along with npm.

**Note**: Homebrew installs the current stable release by default. For a specific LTS version, use versioned formulas such as `node@22` or `node@20`. However, the default `node` formula is recommended for most users.

#### Verification

Confirm the installation succeeded:

```bash
node --version
```

Expected output (version numbers may vary):

```
v25.2.1
```

Verify npm is installed:

```bash
npm --version
```

Expected output (version numbers may vary):

```
10.9.2
```

Verify the Homebrew version is being used:

```bash
which node
```

Expected output for Apple Silicon Macs:

```
/opt/homebrew/bin/node
```

Expected output for Intel Macs:

```
/usr/local/bin/node
```

#### Troubleshooting

**Problem**: `node --version` shows an unexpected version or command not found

**Solution**: Ensure Homebrew's bin directory is in your PATH before system directories:

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

**Problem**: Permission errors during installation

**Solution**: Homebrew should not require sudo. If you encounter permission errors, fix Homebrew permissions:

```bash
sudo chown -R $(whoami) /opt/homebrew
```

**Problem**: Old Node.js version after installation

**Solution**: Update Homebrew and upgrade Node.js:

```bash
brew update
brew upgrade node
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later (64-bit)
- sudo privileges
- Internet connectivity
- curl installed (will be installed if missing)

**Important**: The default Ubuntu/Debian repositories contain outdated Node.js versions. This guide uses the NodeSource repository to install the current LTS version.

#### Installation Steps

**Step 1: Install prerequisites**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl ca-certificates gnupg
```

**Step 2: Add the NodeSource repository**

Download and run the NodeSource setup script for Node.js 22.x LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
```

This script adds the NodeSource signing key and repository to your system. The `-E` flag preserves environment variables, and the script runs non-interactively.

**Step 3: Install Node.js**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures no interactive prompts appear during installation, making this suitable for scripts and automation.

**Step 4 (Optional): Install build tools**

Some npm packages require compilation. Install build essentials:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential
```

#### Verification

Confirm the installation succeeded:

```bash
node --version
```

Expected output (version numbers may vary):

```
v22.12.0
```

Verify npm is installed:

```bash
npm --version
```

Expected output (version numbers may vary):

```
10.9.0
```

Verify the installation location:

```bash
which node
```

Expected output:

```
/usr/bin/node
```

#### Troubleshooting

**Problem**: `E: Unable to locate package nodejs`

**Solution**: The NodeSource repository was not added correctly. Re-run the setup script:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: GPG key errors during repository setup

**Solution**: Ensure ca-certificates and gnupg are installed:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates gnupg
```

**Problem**: Old Node.js version installed despite using NodeSource

**Solution**: The system may have conflicting packages. Remove them and reinstall:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y nodejs npm
sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

**Problem**: npm global packages require sudo

**Solution**: Configure npm to use a user-writable directory:

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye recommended)
- Raspberry Pi 3B+ or later (64-bit OS recommended)
- At least 1 GB RAM (2 GB or more recommended for npm operations)
- sudo privileges
- Internet connectivity

**Architecture Note**: Raspberry Pi OS supports both 32-bit (armhf/armv7l) and 64-bit (arm64/aarch64) versions. This guide covers both, though 64-bit is recommended for better Node.js support.

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM (recommended)
- `armv7l` = 32-bit ARM (limited support for newer Node.js versions)
- `armv6l` = 32-bit ARM (Pi Zero/Pi 1 - very limited support)

#### Installation Steps

**For 64-bit Raspberry Pi OS (aarch64) - Recommended:**

Use the NodeSource repository:

```bash
# Install prerequisites
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl ca-certificates gnupg

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs

# Optional: Install build tools for native modules
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential
```

**For 32-bit Raspberry Pi OS (armv7l):**

The NodeSource repository also supports 32-bit ARM:

```bash
# Install prerequisites
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl ca-certificates gnupg

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

**For Raspberry Pi Zero/Pi 1 (armv6l):**

ARMv6 is not officially supported by Node.js 12+. Use unofficial builds:

```bash
# Download Node.js 20.x for ARMv6 (latest supported)
NODE_VERSION="v20.18.0"
wget https://unofficial-builds.nodejs.org/download/release/${NODE_VERSION}/node-${NODE_VERSION}-linux-armv6l.tar.xz

# Extract and install
sudo tar -xJf node-${NODE_VERSION}-linux-armv6l.tar.xz -C /usr/local --strip-components=1

# Clean up
rm node-${NODE_VERSION}-linux-armv6l.tar.xz
```

**Note**: Node.js 22+ does not provide ARMv6 builds. Raspberry Pi Zero and Pi 1 users are limited to Node.js 20.x or earlier.

#### Verification

Confirm the installation succeeded:

```bash
node --version
```

Expected output (version numbers may vary):

```
v22.12.0
```

Verify npm is installed:

```bash
npm --version
```

Expected output (version numbers may vary):

```
10.9.0
```

Test Node.js works:

```bash
node -e "console.log('Node.js is working on ' + process.arch)"
```

Expected output:

```
Node.js is working on arm64
```

(or `arm` for 32-bit systems)

#### Troubleshooting

**Problem**: Installation is very slow

**Solution**: Raspberry Pi SD cards can be slow. Use a high-quality SD card (Class 10, A1/A2 rated) or boot from USB/SSD for better performance.

**Problem**: `npm install` fails with out of memory errors

**Solution**: Raspberry Pi has limited RAM. Increase swap space:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Problem**: Native module compilation fails

**Solution**: Install build essentials and Python:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential python3
```

**Problem**: "Illegal instruction" error on Pi Zero/Pi 1

**Solution**: You are running a Node.js version built for ARMv7 on ARMv6 hardware. Use the unofficial ARMv6 builds as documented above.

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- EC2 instance or compatible environment
- Internet connectivity

**Important**: Amazon Linux 2023 uses DNF as the package manager with namespaced Node.js packages. Amazon Linux 2 uses YUM with a different approach. This guide covers both.

#### Installation Steps

**For Amazon Linux 2023 (AL2023):**

Amazon Linux 2023 provides Node.js as namespaced packages (nodejs20, nodejs22, nodejs24):

```bash
# Update system packages
sudo dnf update -y

# Install Node.js 22 (current LTS) and npm
sudo dnf install -y nodejs22 nodejs22-npm

# Set Node.js 22 as the active version
sudo alternatives --set node /usr/bin/node-22
```

The `alternatives` command configures the default `node` and `npm` commands to point to version 22.

**For Amazon Linux 2 (AL2):**

Use the NodeSource repository:

```bash
# Install prerequisites
sudo yum install -y curl

# Add NodeSource repository for Node.js 22.x
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -

# Install Node.js
sudo yum install -y nodejs

# Optional: Install build tools
sudo yum install -y gcc-c++ make
```

#### Verification

Confirm the installation succeeded:

```bash
node --version
```

Expected output (version numbers may vary):

```
v22.12.0
```

Verify npm is installed:

```bash
npm --version
```

Expected output (version numbers may vary):

```
10.9.0
```

Verify the installation location:

```bash
which node
```

Expected output:

```
/usr/bin/node
```

**For Amazon Linux 2023**, check active alternatives:

```bash
alternatives --display node
```

#### Troubleshooting

**Problem**: `No match for argument: nodejs22` on Amazon Linux 2023

**Solution**: Update the dnf cache:

```bash
sudo dnf makecache
sudo dnf install -y nodejs22 nodejs22-npm
```

**Problem**: Multiple Node.js versions conflict on AL2023

**Solution**: Use alternatives to switch versions:

```bash
# List available versions
alternatives --display node

# Switch to a specific version
sudo alternatives --set node /usr/bin/node-22
```

**Problem**: `No package nodejs available` on Amazon Linux 2

**Solution**: The NodeSource repository was not added correctly. Re-run the setup:

```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum clean all
sudo yum install -y nodejs
```

**Problem**: npm global packages require sudo

**Solution**: Configure npm to use a user-writable directory:

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 1903 or higher (64-bit), or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed
- Internet connectivity

**Important**: Starting with Node.js 23.x, 32-bit Windows installations are no longer supported. Use 64-bit Windows.

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install nodejs-lts -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation suitable for automation and scripts. The `nodejs-lts` package installs the current Long Term Support version.

**Note**: Use `nodejs-lts` for stability. The `nodejs` package installs the latest current release, which may have a shorter support window.

After installation, close and reopen your terminal to ensure PATH changes take effect.

#### Verification

Open a new Command Prompt or PowerShell window, then run:

```powershell
node --version
```

Expected output (version numbers may vary):

```
v22.12.0
```

Verify npm is installed:

```powershell
npm --version
```

Expected output (version numbers may vary):

```
10.9.0
```

Verify the installation location:

```powershell
where node
```

Expected output:

```
C:\Program Files\nodejs\node.exe
```

#### Troubleshooting

**Problem**: `'node' is not recognized as an internal or external command`

**Solution**: Close and reopen your terminal window. If the problem persists, verify Node.js is in your PATH:

```powershell
$env:PATH -split ';' | Select-String -Pattern 'nodejs'
```

If not listed, add it manually (temporary for current session):

```powershell
$env:PATH += ";C:\Program Files\nodejs"
```

To make this permanent, add the path via System Properties > Environment Variables.

**Problem**: Chocolatey installation fails

**Solution**: Ensure you are running PowerShell as Administrator. Right-click PowerShell and select "Run as administrator".

**Problem**: SSL/TLS errors during installation

**Solution**: Update your security protocols before installing:

```powershell
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
choco install nodejs-lts -y
```

**Problem**: Permission errors when installing global npm packages

**Solution**: Run PowerShell as Administrator, or configure npm to use a user-writable directory:

```powershell
npm config set prefix "$env:APPDATA\npm"
```

**Problem**: Conflict with existing Node.js installation

**Solution**: Uninstall existing Node.js first:

```powershell
choco uninstall nodejs nodejs.install -y
choco install nodejs-lts -y
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL
- Internet connectivity

WSL runs Ubuntu (or another Linux distribution) within Windows. Node.js must be installed separately within WSL, as it does not share binaries with Windows.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

**Step 1: Install prerequisites**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl ca-certificates gnupg
```

**Step 2: Add the NodeSource repository**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
```

**Step 3: Install Node.js**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

**Step 4 (Optional): Install build tools**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential
```

#### Verification

Confirm the installation succeeded:

```bash
node --version
```

Expected output (version numbers may vary):

```
v22.12.0
```

Verify npm is installed:

```bash
npm --version
```

Expected output (version numbers may vary):

```
10.9.0
```

Verify the installation location:

```bash
which node
```

Expected output:

```
/usr/bin/node
```

#### Troubleshooting

**Problem**: Node.js version differs between WSL and Windows

**Solution**: This is expected behavior. WSL and Windows maintain separate Node.js installations. Use the appropriate installation for each environment:

- Inside WSL terminal: Use Linux Node.js (`/usr/bin/node`)
- In Windows PowerShell/CMD: Use Windows Node.js (`C:\Program Files\nodejs\node.exe`)

**Problem**: npm install is slow or times out

**Solution**: WSL file system performance is better on the Linux filesystem. Store your projects in the WSL home directory (`~/projects`) rather than Windows mounts (`/mnt/c/...`):

```bash
mkdir -p ~/projects
cd ~/projects
```

**Problem**: `EACCES` permission errors with npm

**Solution**: Configure npm to use a user-writable directory:

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Cannot run node commands from Windows terminal

**Solution**: If you need to run WSL Node.js from Windows PowerShell:

```powershell
wsl node --version
wsl npm --version
```

For seamless integration, consider installing Node.js natively on Windows as well.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Administrator access for installation
- Internet connectivity

**Note**: Git Bash on Windows does not require a separate Node.js installation. Git Bash inherits the Windows PATH, so once Node.js is installed on Windows, the `node` and `npm` commands are automatically available in Git Bash.

#### Installation Steps

**Step 1: Install Node.js on Windows using Chocolatey**

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install nodejs-lts -y
```

**Step 2: Close and reopen Git Bash**

After installation, close any open Git Bash windows and open a new one to pick up the updated PATH.

**Step 3: Verify Node.js is accessible**

In Git Bash:

```bash
node --version
npm --version
```

#### Verification

In Git Bash, confirm Node.js is accessible:

```bash
node --version
```

Expected output (version numbers may vary):

```
v22.12.0
```

Verify npm is installed:

```bash
npm --version
```

Expected output (version numbers may vary):

```
10.9.0
```

Verify the PATH includes Node.js:

```bash
which node
```

Expected output:

```
/c/Program Files/nodejs/node
```

#### Troubleshooting

**Problem**: `node: command not found` in Git Bash

**Solution**: Node.js may not be in PATH or Git Bash was opened before installation completed. First, close and reopen Git Bash. Then verify the PATH includes Node.js:

```bash
echo $PATH | tr ':' '\n' | grep -i node
```

If Node.js is not in PATH, add it to your `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/c/Program Files/nodejs"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: npm commands fail with permission errors

**Solution**: Git Bash may have issues with Windows paths containing spaces. Use the short path or configure npm:

```bash
npm config set prefix ~/npm-global
echo 'export PATH="$HOME/npm-global/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: `the input device is not a TTY` error with interactive commands

**Solution**: Git Bash's mintty terminal has TTY compatibility issues. Use the `winpty` prefix for interactive commands:

```bash
winpty node
```

Or add an alias to your `~/.bashrc`:

```bash
echo 'alias node="winpty node"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Path conversion issues (Unix paths being converted to Windows paths)

**Solution**: Git Bash automatically converts Unix-style paths. To prevent this for specific commands, set `MSYS_NO_PATHCONV`:

```bash
MSYS_NO_PATHCONV=1 node /path/to/script.js
```

---

## Post-Installation Configuration

After installing Node.js on any platform, consider these optional but recommended configurations.

### Verify npm is Working

Test npm by checking its version and listing global packages:

```bash
npm --version
npm list -g --depth=0
```

### Configure npm Initialization Defaults

Set default values for `npm init`:

```bash
npm config set init-author-name "Your Name"
npm config set init-author-email "your.email@example.com"
npm config set init-license "MIT"
```

### Install Common Global Packages

Install frequently used global packages:

```bash
# TypeScript
npm install -g typescript

# Package runners
npm install -g npx

# Linters and formatters
npm install -g eslint prettier
```

### Configure npm Registry (Corporate Environments)

If you need to use a private npm registry:

```bash
npm config set registry https://registry.your-company.com/
```

To use the official npm registry:

```bash
npm config set registry https://registry.npmjs.org/
```

### Enable npm Audit

npm audit is enabled by default. To run a security audit on your project:

```bash
npm audit
```

To automatically fix vulnerabilities:

```bash
npm audit fix
```

---

## Common Issues

### Issue: "npm WARN" Messages During Installation

**Symptoms**: Warnings appear during `npm install` but installation completes

**Solution**: These are typically informational. Common warnings include:

- `npm WARN deprecated` - A package dependency is deprecated
- `npm WARN optional` - An optional dependency failed to install
- `npm WARN peer` - Peer dependency version mismatch

These warnings rarely cause issues. Address them only if your application malfunctions.

### Issue: EACCES Permission Errors

**Symptoms**: `EACCES: permission denied` when installing global packages

**Solution**: Configure npm to use a user-writable directory instead of requiring sudo:

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc  # or ~/.zshrc on macOS
source ~/.bashrc
```

Then reinstall global packages without sudo.

### Issue: Node.js Version Conflicts

**Symptoms**: Different projects require different Node.js versions

**Solution**: While this guide focuses on system-wide installation, version managers like nvm (Node Version Manager) can help:

```bash
# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Install and use a specific version
nvm install 20
nvm use 20
```

For Windows, use nvm-windows or the official Node.js installer with multiple versions.

### Issue: SSL/TLS Certificate Errors

**Symptoms**: `unable to get local issuer certificate` or SSL handshake failures

**Solution**: This often occurs in corporate environments with proxy servers. Configure npm to use the system certificate store:

```bash
npm config set strict-ssl false  # Temporary workaround (less secure)
```

For a proper fix, configure your corporate CA certificate:

```bash
npm config set cafile /path/to/corporate-ca.crt
```

### Issue: Slow npm Install

**Symptoms**: `npm install` takes very long or times out

**Solutions**:

- Use a faster registry mirror (if available in your region)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then reinstall
- Check network connectivity and proxy settings

### Issue: Native Module Compilation Failures

**Symptoms**: Errors mentioning `gyp`, `node-gyp`, or `make` during installation

**Solution**: Install build tools:

**macOS**:
```bash
xcode-select --install
```

**Ubuntu/Debian/WSL**:
```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential
```

**Windows** (run in Administrator PowerShell):
```powershell
npm install -g windows-build-tools
```

Or install Visual Studio Build Tools separately.

---

## References

- [Node.js Official Website](https://nodejs.org/)
- [Node.js Downloads](https://nodejs.org/en/download)
- [Node.js Documentation](https://nodejs.org/docs/latest/api/)
- [npm Documentation](https://docs.npmjs.com/)
- [NodeSource Distributions](https://github.com/nodesource/distributions)
- [Homebrew Node Formula](https://formulae.brew.sh/formula/node)
- [Chocolatey Node.js Package](https://community.chocolatey.org/packages/nodejs)
- [Chocolatey Node.js LTS Package](https://community.chocolatey.org/packages/nodejs-lts)
- [Node.js in Amazon Linux 2023](https://docs.aws.amazon.com/linux/al2023/ug/nodejs.html)
- [Microsoft Learn: Node.js on Windows](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows)
- [Node.js Unofficial Builds (ARMv6)](https://unofficial-builds.nodejs.org/download/release/)
