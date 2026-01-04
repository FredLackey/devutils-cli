# Installing NVM (Node Version Manager)

## Overview

NVM (Node Version Manager) is a version manager for Node.js, designed to be installed per-user, and invoked per-shell. NVM allows you to quickly install and switch between multiple versions of Node.js on the same machine, making it essential for developers who work on projects requiring different Node.js versions.

**Important Platform Note**: NVM (nvm-sh/nvm) is designed for POSIX-compliant systems (macOS, Linux, WSL). For native Windows environments (PowerShell, Command Prompt, Git Bash), use **nvm-windows** (coreybutler/nvm-windows), which is a completely separate project with similar functionality but different implementation.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew package manager - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:**
  - Shell integration scripts (nvm.sh, bash_completion) - Installed automatically by Homebrew formula

### Ubuntu (APT/Snap)
- **Required:**
  - `curl` - Install via `sudo apt install curl` (installer will install if missing)
  - `git` - Install via `sudo apt install git` (NVM install script requires git to clone the repository)
- **Optional:** None
- **Auto-installed:**
  - Build essentials - NVM install script handles dependency installation automatically

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `curl` - Install via `sudo apt install curl` (installer will install if missing)
  - `git` - Install via `sudo apt install git` (NVM install script requires git to clone the repository)
- **Optional:**
  - Swap space - For ARMv6 (Pi Zero/1) if compiling Node.js from source: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`
- **Auto-installed:**
  - Build essentials - NVM install script handles dependency installation automatically

### Amazon Linux (DNF/YUM)
- **Required:**
  - `curl` - Install via `sudo dnf install curl` (AL2023) or `sudo yum install curl` (AL2) - installer will install if missing
  - `git` - Install via `sudo dnf install git` or `sudo yum install git` (NVM install script requires git to clone the repository)
- **Optional:** None
- **Auto-installed:**
  - Build essentials - NVM install script handles dependency installation automatically

### Windows (Chocolatey/winget)
- **Required:**
  - Chocolatey OR winget (at least one must be present)
    - Chocolatey: Install via PowerShell (Administrator): `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
    - winget: Pre-installed on Windows 10/11, or install App Installer from Microsoft Store
- **Optional:** None
- **Auto-installed:** None

### Git Bash (Manual/Portable)
- **Required:**
  - Git Bash (comes with Git for Windows) - Download from https://git-scm.com/download/win
  - Chocolatey installed on Windows host - Install via PowerShell (see Windows section above)
  - PowerShell access for interop - Pre-installed on Windows
- **Optional:** None
- **Auto-installed:** None

**Note on Dependencies**: The NVM installer script is designed to be idempotent and will check for required dependencies before installation. On Unix-like systems (macOS, Ubuntu, Raspberry Pi OS, Amazon Linux), the installer will attempt to install `curl` automatically if missing using the system package manager. On Windows and Git Bash, the package manager (Chocolatey or winget) must already be installed.

## Prerequisites

Before installing NVM on any platform, ensure:

1. **Internet connectivity** - Required to download NVM and Node.js versions
2. **Terminal access** - Command line interface to run installation commands
3. **Git** (optional) - Required only if using git-based installation method
4. **No existing Node.js installation** - While not strictly required on Unix systems, it is strongly recommended to uninstall any existing Node.js installations to avoid PATH conflicts

**Why remove existing Node.js?** NVM manages Node.js installations in a separate directory (`~/.nvm/versions/node/`). Existing system-wide Node.js installations can cause PATH conflicts, where the system version takes precedence over NVM-managed versions.

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

Remove any existing Node.js installation to avoid conflicts:

```bash
brew uninstall --ignore-dependencies node 2>/dev/null || true
brew uninstall --force node 2>/dev/null || true
```

#### Installation Steps

**Step 1: Install NVM via Homebrew**

```bash
brew install --quiet nvm
```

The `--quiet` flag suppresses non-essential output for automation-friendly installation.

**Step 2: Create the NVM directory**

```bash
mkdir -p ~/.nvm
```

**Step 3: Configure your shell**

For zsh (default on macOS), add the following to `~/.zshrc`:

```bash
cat >> ~/.zshrc << 'EOF'

# NVM Configuration
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"  # This loads nvm
[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion
EOF
```

**Note for Intel Macs**: If you have an Intel Mac, replace `/opt/homebrew/` with `/usr/local/` in the paths above.

**Step 4: Reload your shell configuration**

```bash
source ~/.zshrc
```

#### Verification

Confirm NVM is installed correctly:

```bash
nvm --version
```

Expected output (version numbers may vary):

```
0.40.1
```

Test installing Node.js:

```bash
nvm install --lts
node --version
```

#### Troubleshooting

**Problem**: `nvm: command not found` after installation

**Solution**: Ensure the shell configuration was added correctly and the shell was reloaded:

```bash
# Verify the configuration exists
grep -q "NVM_DIR" ~/.zshrc && echo "Config exists" || echo "Config missing"

# Reload the shell
source ~/.zshrc
```

**Problem**: NVM loads slowly on shell startup

**Solution**: Add lazy loading to your shell configuration. Replace the NVM configuration with:

```bash
# Lazy load NVM for faster shell startup
export NVM_DIR="$HOME/.nvm"
nvm() {
  unset -f nvm
  [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"
  nvm "$@"
}
```

**Problem**: Homebrew NVM version differs from official NVM

**Solution**: Homebrew may have a slightly different version. If you need the absolute latest version, use the direct install method instead:

```bash
brew uninstall nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 or later, or Debian 10 or later
- sudo privileges
- curl or wget installed

NVM is not available in the official Ubuntu/Debian repositories. The installation uses the official NVM install script directly.

First, install required dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
```

Remove any existing Node.js installation (optional but recommended):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y nodejs npm 2>/dev/null || true
```

#### Installation Steps

**Step 1: Download and run the NVM install script**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

This script:
- Clones the NVM repository to `~/.nvm`
- Adds NVM initialization to your shell profile (`~/.bashrc`, `~/.zshrc`, or `~/.profile`)

**Step 2: Reload your shell configuration**

```bash
source ~/.bashrc
```

For zsh users:

```bash
source ~/.zshrc
```

#### Verification

Confirm NVM is installed correctly:

```bash
nvm --version
```

Expected output (version numbers may vary):

```
0.40.3
```

Test installing Node.js:

```bash
nvm install --lts
node --version
npm --version
```

#### Troubleshooting

**Problem**: `nvm: command not found` after installation

**Solution**: The install script may not have detected your shell profile correctly. Manually add the configuration:

```bash
cat >> ~/.bashrc << 'EOF'

# NVM Configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
EOF
source ~/.bashrc
```

**Problem**: NVM not available in new terminal sessions

**Solution**: Ensure `~/.bashrc` is sourced from `~/.bash_profile` for login shells:

```bash
echo 'source ~/.bashrc' >> ~/.bash_profile
```

**Problem**: Permission denied errors during installation

**Solution**: NVM should be installed as a regular user, not with sudo. If you ran the install script with sudo, remove and reinstall:

```bash
sudo rm -rf ~/.nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm, Bullseye, or Buster) - 64-bit or 32-bit
- Raspberry Pi 2 or later (Pi Zero/1 have limited support - see notes below)
- sudo privileges
- curl installed

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM (Raspberry Pi 3/4/5 with 64-bit OS) - Full support
- `armv7l` = 32-bit ARM (Raspberry Pi 2/3/4 with 32-bit OS) - Full support
- `armv6l` = 32-bit ARM (Raspberry Pi Zero/1) - Limited support (see notes)

Install required dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
```

#### Installation Steps

**Step 1: Download and run the NVM install script**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

**Step 2: Reload your shell configuration**

```bash
source ~/.bashrc
```

**Step 3: Install Node.js**

For aarch64 and armv7l architectures:

```bash
nvm install --lts
```

For armv6l architecture (Raspberry Pi Zero/1), use unofficial builds:

```bash
NVM_NODEJS_ORG_MIRROR=https://unofficial-builds.nodejs.org/download/release nvm install 20
```

**Note**: Unofficial builds stopped supporting armv6l for Node.js v22+. The maximum supported version on armv6l is Node.js 20.x.

#### Verification

Confirm NVM is installed correctly:

```bash
nvm --version
```

Expected output:

```
0.40.3
```

Verify Node.js installation:

```bash
node --version
npm --version
```

#### Troubleshooting

**Problem**: `nvm install` takes a very long time on Raspberry Pi Zero/1

**Solution**: On armv6l devices, NVM attempts to compile from source if prebuilt binaries are unavailable. Use the unofficial builds mirror:

```bash
NVM_NODEJS_ORG_MIRROR=https://unofficial-builds.nodejs.org/download/release nvm install 20
```

**Problem**: "There is no 'node' binary for your system" error

**Solution**: The requested Node.js version does not have prebuilt binaries for your architecture. Try an older LTS version or use unofficial builds for armv6l.

**Problem**: Out of memory during Node.js compilation

**Solution**: Add swap space before compiling:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

**Problem**: NVM not found after reboot

**Solution**: Ensure the NVM configuration is in `~/.bashrc` and the file is sourced on login:

```bash
cat >> ~/.bashrc << 'EOF'

# NVM Configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
EOF
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges (typically ec2-user on EC2 instances)
- curl installed

This is the AWS-recommended method for setting up Node.js on EC2 instances.

First, install required dependencies:

```bash
# For Amazon Linux 2023
sudo dnf install -y curl

# For Amazon Linux 2
sudo yum install -y curl
```

#### Installation Steps

**Step 1: Download and run the NVM install script**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

**Step 2: Activate NVM in the current session**

```bash
source ~/.bashrc
```

**Step 3: Install Node.js**

```bash
nvm install --lts
```

#### Verification

Confirm NVM is installed correctly:

```bash
nvm --version
```

Expected output:

```
0.40.3
```

Verify Node.js installation:

```bash
node --version
npm --version
```

#### Troubleshooting

**Problem**: `nvm: command not found` after running the install script

**Solution**: Source your shell profile:

```bash
source ~/.bashrc
```

If that does not work, manually add the configuration:

```bash
cat >> ~/.bashrc << 'EOF'

# NVM Configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
EOF
source ~/.bashrc
```

**Problem**: NVM not available after EC2 instance restart

**Solution**: NVM is user-specific. Ensure you are logged in as the same user who installed NVM (typically ec2-user). The installation persists across reboots but requires sourcing the shell profile.

**Problem**: Node.js version too old for project requirements

**Solution**: Install a specific version:

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

**Problem**: Creating an AMI with Node.js pre-installed

**Solution**: After installing NVM and Node.js, you can create an AMI from the instance. The AMI will include the NVM installation. Users of the AMI will need to run `source ~/.bashrc` or start a new shell session to access NVM.

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 version 1809 or later, or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey or winget package manager installed
- **No existing Node.js installation** - This is critical on Windows

**Critical**: Uninstall any pre-existing Node.js installations before installing nvm-windows. The tool cannot manage existing installations due to Windows security restrictions, and symlinks will not work correctly if another Node.js version is in your PATH.

To remove existing Node.js:

1. Open "Add or Remove Programs" from Windows Settings
2. Search for "Node.js" and uninstall any found installations
3. Delete any remaining Node.js directories (e.g., `C:\Program Files\nodejs`)
4. Remove Node.js from your PATH environment variable if present

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps (Chocolatey)

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install nvm -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Note**: Close and reopen your terminal after installation to ensure PATH changes take effect.

#### Installation Steps (winget)

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
winget install --id CoreyButler.NVMforWindows --silent --accept-package-agreements --accept-source-agreements
```

**Note**: Close and reopen your terminal after installation to ensure PATH changes take effect.

#### Post-Installation: Install Node.js

Open a new Administrator PowerShell or Command Prompt:

```powershell
nvm install lts
nvm use lts
```

**Important**: Running `nvm install` and `nvm use` requires Administrator privileges because nvm-windows creates symlinks.

#### Verification

Open a new terminal window, then run:

```powershell
nvm version
```

Expected output (version numbers may vary):

```
1.2.2
```

Verify Node.js installation:

```powershell
node --version
npm --version
```

#### Troubleshooting

**Problem**: `nvm` command not found after installation

**Solution**: Close all terminal windows and open a new one. The PATH is updated during installation but existing terminals do not pick up the change.

**Problem**: `nvm use` appears to work but Node.js version does not change

**Solution**: Another Node.js installation may be taking precedence in your PATH. Verify no other Node.js installations exist:

```powershell
where node
```

If multiple paths are shown, remove the non-NVM installations.

**Problem**: "Access is denied" or "symlink privilege not held" error

**Solution**: Run your terminal as Administrator. NVM-windows requires Administrator privileges to create symlinks.

**Problem**: npm global packages not available after switching Node.js versions

**Solution**: Global packages are installed per Node.js version. Reinstall global packages for each version:

```powershell
nvm use 20
npm install -g yarn typescript
```

**Problem**: Installation fails with antivirus interference

**Solution**: Temporarily disable antivirus or add nvm-windows to the exclusion list. Some antivirus software flags the symlink operations.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

WSL runs a full Linux environment, so NVM installation follows the standard Linux procedure.

Install required dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
```

#### Installation Steps

**Step 1: Download and run the NVM install script**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

**Step 2: Reload your shell configuration**

```bash
source ~/.bashrc
```

**Step 3: Install Node.js**

```bash
nvm install --lts
```

#### Verification

Confirm NVM is installed correctly:

```bash
nvm --version
```

Expected output:

```
0.40.3
```

Verify Node.js installation:

```bash
node --version
npm --version
```

#### Troubleshooting

**Problem**: `nvm: command not found` in WSL

**Solution**: The install script may not have updated your profile. Manually add the configuration:

```bash
cat >> ~/.bashrc << 'EOF'

# NVM Configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
EOF
source ~/.bashrc
```

**Problem**: NVM works in WSL but not in Windows terminal

**Solution**: NVM installed in WSL is only available within WSL. For Windows terminals (PowerShell, Command Prompt), install nvm-windows separately (see Windows section).

**Problem**: Different Node.js versions in WSL vs Windows

**Solution**: WSL and Windows maintain separate environments. If you need the same Node.js version in both:

1. In WSL: `nvm install 20 && nvm use 20`
2. In Windows (nvm-windows): `nvm install 20 && nvm use 20`

**Problem**: File permission issues when accessing Windows files from WSL

**Solution**: When working with files on the Windows filesystem (`/mnt/c/...`), Node.js may have permission issues. Store your projects in the Linux filesystem (`~/projects/`) for best performance and compatibility.

---

### Git Bash (Windows nvm-windows)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Administrator privileges for installation
- **No existing Node.js installation**

**Note**: Git Bash on Windows runs in a MinGW environment that inherits the Windows PATH. Once nvm-windows is installed via Chocolatey or winget, the `nvm` and `node` commands are automatically available in Git Bash.

#### Installation Steps

**Step 1: Install nvm-windows using Chocolatey**

Open an Administrator PowerShell or Command Prompt (not Git Bash) and run:

```powershell
choco install nvm -y
```

**Step 2: Close all terminal windows and open Git Bash**

The PATH updates require a fresh terminal session.

**Step 3: Install Node.js**

In Git Bash (running as Administrator):

```bash
nvm install lts
nvm use lts
```

**Note**: To run Git Bash as Administrator, right-click the Git Bash shortcut and select "Run as administrator".

#### Verification

In Git Bash, confirm nvm-windows is accessible:

```bash
nvm version
```

Expected output:

```
1.2.2
```

Verify Node.js installation:

```bash
node --version
npm --version
```

#### Troubleshooting

**Problem**: `nvm: command not found` in Git Bash

**Solution**: Git Bash inherits the Windows PATH. Ensure nvm-windows is installed correctly:

```bash
# Check if nvm is in PATH
echo $PATH | tr ':' '\n' | grep -i nvm
```

If nvm is not in PATH, close Git Bash and all other terminals, then reopen Git Bash.

**Problem**: `nvm use` requires Administrator privileges

**Solution**: Git Bash must be run as Administrator for `nvm use` commands because symlink creation requires elevated privileges. Right-click the Git Bash shortcut and select "Run as administrator".

**Problem**: MinGW path translation issues

**Solution**: Git Bash's MinGW layer can translate paths unexpectedly. If you encounter path issues, use the `MSYS_NO_PATHCONV` environment variable:

```bash
MSYS_NO_PATHCONV=1 node /c/path/to/script.js
```

**Problem**: TTY-related errors when running interactive Node.js scripts

**Solution**: Git Bash's mintty terminal has TTY compatibility issues. Use `winpty` prefix:

```bash
winpty node
```

Or add an alias to your `~/.bashrc`:

```bash
echo 'alias node="winpty node"' >> ~/.bashrc
source ~/.bashrc
```

---

## Post-Installation Configuration

After installing NVM on any platform, consider these common configurations.

### Setting a Default Node.js Version

Set a default Node.js version that will be active in all new shells:

```bash
nvm alias default 20
```

Or use the latest LTS:

```bash
nvm alias default lts/*
```

### Automatic Version Switching with .nvmrc

Create a `.nvmrc` file in your project root to specify the Node.js version:

```bash
echo "20" > .nvmrc
```

Then switch to that version:

```bash
nvm use
```

To automatically switch versions when entering a directory, add this to your `~/.bashrc` or `~/.zshrc`:

```bash
# Automatically switch Node.js version based on .nvmrc
autoload -U add-zsh-hook
load-nvmrc() {
  local nvmrc_path="$(nvm_find_nvmrc)"
  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")
    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$(nvm version)" ]; then
      nvm use
    fi
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

### Installing Global Packages

Global packages are installed per Node.js version. To reinstall global packages when installing a new Node.js version:

```bash
nvm install 22 --reinstall-packages-from=20
```

### Listing Installed Versions

View all installed Node.js versions:

```bash
nvm ls
```

View all available versions for installation:

```bash
nvm ls-remote --lts
```

### Uninstalling a Node.js Version

Remove a specific version:

```bash
nvm uninstall 18
```

---

## Common Issues

### Issue: "nvm: command not found"

**Symptoms**: After installation, `nvm` command is not recognized.

**Solutions**:

1. Reload your shell configuration:

```bash
# For bash
source ~/.bashrc

# For zsh
source ~/.zshrc
```

2. Open a new terminal window

3. Verify NVM is configured in your profile:

```bash
grep NVM_DIR ~/.bashrc ~/.zshrc ~/.profile 2>/dev/null
```

4. If missing, manually add the configuration (see platform-specific sections)

### Issue: Node.js Version Not Changing

**Symptoms**: `nvm use` runs without error but `node --version` shows the old version.

**Solutions**:

- **Unix/Linux/macOS**: Check for system-installed Node.js taking precedence:

```bash
which node
```

If the path is not `~/.nvm/versions/node/...`, remove the system installation.

- **Windows**: Ensure no other Node.js installations exist:

```powershell
where node
```

### Issue: Permission Denied on Linux/macOS

**Symptoms**: Cannot install Node.js versions or access NVM directory.

**Solutions**:

- NVM should never be installed with sudo. The `~/.nvm` directory should be owned by your user:

```bash
ls -la ~/.nvm
```

If owned by root, fix ownership:

```bash
sudo chown -R $USER:$USER ~/.nvm
```

### Issue: NVM Slows Down Shell Startup

**Symptoms**: Opening a new terminal takes several seconds.

**Solutions**:

Use lazy loading - NVM will only initialize when first invoked:

```bash
# Add to ~/.bashrc or ~/.zshrc instead of default NVM config
export NVM_DIR="$HOME/.nvm"
nvm() {
  unset -f nvm node npm npx
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm "$@"
}
node() {
  unset -f nvm node npm npx
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  node "$@"
}
npm() {
  unset -f nvm node npm npx
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  npm "$@"
}
npx() {
  unset -f nvm node npm npx
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  npx "$@"
}
```

### Issue: Cannot Find Node.js Binary in Scripts

**Symptoms**: Scripts or cron jobs cannot find the `node` command.

**Solutions**:

Use the full path to the Node.js binary:

```bash
~/.nvm/versions/node/v20.10.0/bin/node script.js
```

Or source NVM in your script:

```bash
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
node script.js
```

### Issue: Global Packages Missing After Version Switch

**Symptoms**: Global packages like `yarn`, `typescript`, etc. are not available after switching Node.js versions.

**Solutions**:

Global packages are installed per Node.js version. Reinstall them for the new version:

```bash
npm install -g yarn typescript eslint
```

Or install a new version with packages from another version:

```bash
nvm install 22 --reinstall-packages-from=20
```

---

## References

- [NVM (nvm-sh) Official Repository](https://github.com/nvm-sh/nvm)
- [NVM-Windows Official Repository](https://github.com/coreybutler/nvm-windows)
- [NVM Homebrew Formula](https://formulae.brew.sh/formula/nvm)
- [NVM Chocolatey Package](https://community.chocolatey.org/packages/nvm)
- [NVM-Windows winget Package](https://winget.run/pkg/CoreyButler/NVMforWindows)
- [AWS Documentation: Setting Up Node.js on EC2](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-up-node-on-ec2-instance.html)
- [Node.js Unofficial Builds (for ARMv6)](https://unofficial-builds.nodejs.org/download/release/)
- [Microsoft Learn: Set up Node.js on Windows](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows)
