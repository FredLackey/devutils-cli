# Installing ShellCheck

## Overview

ShellCheck is a static analysis tool for shell scripts. It analyzes Bash and POSIX sh scripts, identifying syntax issues, semantic problems, and subtle pitfalls that can cause scripts to fail unexpectedly. Think of ShellCheck as a linter for shell scripts - it catches common mistakes, suggests best practices, and helps you write more robust shell code.

ShellCheck is essential for developers, system administrators, and DevOps engineers who write shell scripts. Common use cases include:

- Catching common syntax errors before they cause runtime failures
- Identifying deprecated or non-portable shell constructs
- Enforcing shell scripting best practices
- Integrating linting into CI/CD pipelines for shell scripts
- Learning proper shell scripting patterns through actionable feedback

ShellCheck supports Bash, sh, dash, and ksh scripts. It does not support zsh scripts.

## Prerequisites

Before installing ShellCheck on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required on most platforms for system-wide installation
3. **Package manager installed** - Each platform requires its respective package manager (Homebrew, APT, DNF/YUM, Chocolatey, etc.)

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

Run the following command to install ShellCheck via Homebrew:

```bash
brew install --quiet shellcheck
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts and CI/CD pipelines.

**Note**: Homebrew will automatically install the dependency `gmp` (GNU multiple precision arithmetic library) if it is not already present.

#### Verification

Confirm the installation succeeded:

```bash
shellcheck --version
```

Expected output (version numbers may vary):

```
ShellCheck - shell script analysis tool
version: 0.11.0
license: GNU General Public License, version 3
website: https://www.shellcheck.net
```

Verify the installation path:

```bash
which shellcheck
```

Expected output: `/opt/homebrew/bin/shellcheck` (Apple Silicon) or `/usr/local/bin/shellcheck` (Intel).

Test ShellCheck on a sample script:

```bash
echo '#!/bin/bash
echo $foo' | shellcheck -
```

Expected output showing a warning about unquoted variable:

```
In - line 2:
echo $foo
     ^--^ SC2086 (info): Double quote to prevent globbing and word splitting.

Did you mean:
echo "$foo"
```

#### Troubleshooting

**Problem**: `shellcheck: command not found` after installation

**Solution**: Homebrew may not be in your PATH. For Apple Silicon Macs, add Homebrew to your PATH:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For a permanent fix, add this to your shell configuration:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc && source ~/.zshrc
```

**Problem**: `brew install shellcheck` fails with permission errors

**Solution**: Fix Homebrew directory ownership:

```bash
sudo chown -R $(whoami) $(brew --prefix)/*
```

**Problem**: Installation fails with network errors

**Solution**: Check your internet connection and try again. If behind a corporate proxy, configure Homebrew to use it:

```bash
export ALL_PROXY=http://proxy.example.com:8080
brew install --quiet shellcheck
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 LTS or later, or Debian 10 (Buster) or later
- sudo privileges
- Internet connectivity

ShellCheck is available in the default Ubuntu and Debian repositories. For newer versions, use the Snap package (documented in the Snap alternative section).

#### Installation Steps

Run the following command to update package lists and install ShellCheck:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y shellcheck
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
shellcheck --version
```

Expected output (version numbers may vary depending on your distribution version):

```
ShellCheck - shell script analysis tool
version: 0.8.0
license: GNU General Public License, version 3
website: https://www.shellcheck.net
```

**Note**: Ubuntu and Debian repositories may contain slightly older versions of ShellCheck. For Ubuntu 22.04 LTS, the repository provides version 0.8.0. If you require the latest version (0.11.0), use the Snap package or download the binary directly.

Verify the installation path:

```bash
which shellcheck
```

Expected output: `/usr/bin/shellcheck`

Test ShellCheck on a sample script:

```bash
echo '#!/bin/bash
echo $foo' | shellcheck -
```

#### Troubleshooting

**Problem**: `E: Unable to locate package shellcheck`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: `Permission denied` errors

**Solution**: Ensure you are using `sudo` with the installation command.

**Problem**: Older ShellCheck version than expected

**Solution**: Ubuntu/Debian repositories prioritize stability over bleeding-edge releases. For the latest version, install via Snap:

```bash
sudo snap install shellcheck
```

Or download the binary directly from GitHub:

```bash
wget -qO- "https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.x86_64.tar.xz" | tar -xJv && sudo cp shellcheck-v0.11.0/shellcheck /usr/local/bin/ && rm -rf shellcheck-v0.11.0
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 2 or later (Raspberry Pi 3B+ or later recommended for 64-bit)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so ShellCheck installation follows the same APT-based process. ShellCheck is available for both ARM architectures (armhf for 32-bit, arm64 for 64-bit).

#### Installation Steps

Run the following command to update package lists and install ShellCheck:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y shellcheck
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
shellcheck --version
```

Expected output (version numbers may vary):

```
ShellCheck - shell script analysis tool
version: 0.8.0
license: GNU General Public License, version 3
website: https://www.shellcheck.net
```

Verify your architecture:

```bash
uname -m
```

Expected output: `aarch64` (64-bit) or `armv7l` (32-bit).

Verify the installation path:

```bash
which shellcheck
```

Expected output: `/usr/bin/shellcheck`

#### Troubleshooting

**Problem**: `E: Unable to locate package shellcheck`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

If still not found, ShellCheck may not be in the repository for older Raspberry Pi OS versions. Use Snap instead:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd && sudo snap install shellcheck
```

**Problem**: Very slow download speeds

**Solution**: Raspberry Pi may have limited bandwidth. Use a wired ethernet connection for faster downloads, or wait for the installation to complete.

**Problem**: Installation fails with disk space errors

**Solution**: Check available disk space and clean up if needed:

```bash
df -h
sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y
sudo DEBIAN_FRONTEND=noninteractive apt-get clean
```

**Problem**: Need latest ShellCheck version on ARM

**Solution**: For 64-bit ARM (aarch64), download the ARM64 binary directly from GitHub:

```bash
wget -qO- "https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.aarch64.tar.xz" | tar -xJv && sudo cp shellcheck-v0.11.0/shellcheck /usr/local/bin/ && rm -rf shellcheck-v0.11.0
```

For 32-bit ARM (armv7l), download the armv6hf binary:

```bash
wget -qO- "https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.armv6hf.tar.xz" | tar -xJv && sudo cp shellcheck-v0.11.0/shellcheck /usr/local/bin/ && rm -rf shellcheck-v0.11.0
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- Internet connectivity

ShellCheck is not available in the default Amazon Linux repositories. Install it via EPEL (Extra Packages for Enterprise Linux) for Amazon Linux 2, or download the binary directly for Amazon Linux 2023.

#### Installation Steps

**For Amazon Linux 2023:**

Amazon Linux 2023 does not have EPEL compatibility. Download the binary directly:

```bash
wget -qO- "https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.x86_64.tar.xz" | tar -xJv && sudo cp shellcheck-v0.11.0/shellcheck /usr/local/bin/ && rm -rf shellcheck-v0.11.0
```

**For Amazon Linux 2:**

Enable the EPEL repository and install ShellCheck:

```bash
sudo amazon-linux-extras install -y epel && sudo yum install -y ShellCheck
```

**Note**: The package name is `ShellCheck` (with capital S and C) in the EPEL repository, not `shellcheck`.

The `-y` flag automatically confirms installation prompts, enabling non-interactive execution.

#### Verification

Confirm the installation succeeded:

```bash
shellcheck --version
```

Expected output (version numbers may vary):

```
ShellCheck - shell script analysis tool
version: 0.11.0
license: GNU General Public License, version 3
website: https://www.shellcheck.net
```

For EPEL installations on Amazon Linux 2, the version may be older (0.7.x or 0.8.x).

Verify the installation path:

```bash
which shellcheck
```

Expected output: `/usr/local/bin/shellcheck` (binary install) or `/usr/bin/shellcheck` (EPEL install).

#### Troubleshooting

**Problem**: `No match for argument: ShellCheck` on Amazon Linux 2

**Solution**: Ensure EPEL is enabled:

```bash
sudo amazon-linux-extras install -y epel
sudo yum makecache
sudo yum install -y ShellCheck
```

**Problem**: `No match for argument: ShellCheck` on Amazon Linux 2023

**Solution**: Amazon Linux 2023 does not support EPEL. Download the binary directly:

```bash
wget -qO- "https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.x86_64.tar.xz" | tar -xJv && sudo cp shellcheck-v0.11.0/shellcheck /usr/local/bin/ && rm -rf shellcheck-v0.11.0
```

**Problem**: `wget: command not found`

**Solution**: Use curl instead:

```bash
curl -sSL "https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.x86_64.tar.xz" | tar -xJv && sudo cp shellcheck-v0.11.0/shellcheck /usr/local/bin/ && rm -rf shellcheck-v0.11.0
```

**Problem**: `tar: xz: Cannot exec: No such file or directory`

**Solution**: Install xz-utils first:

```bash
sudo dnf install -y xz
```

Or for Amazon Linux 2:

```bash
sudo yum install -y xz
```

**Problem**: Permission denied when running shellcheck

**Solution**: Ensure the binary has execute permissions:

```bash
sudo chmod +x /usr/local/bin/shellcheck
```

**Problem**: Using ARM-based instances (Graviton)

**Solution**: Download the ARM64 binary:

```bash
wget -qO- "https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.aarch64.tar.xz" | tar -xJv && sudo cp shellcheck-v0.11.0/shellcheck /usr/local/bin/ && rm -rf shellcheck-v0.11.0
```

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
choco install shellcheck -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

Chocolatey downloads the Windows binary and adds it to the PATH automatically.

#### Verification

Open a **new** Command Prompt or PowerShell window (required for PATH to update), then run:

```powershell
shellcheck --version
```

Expected output (version numbers may vary):

```
ShellCheck - shell script analysis tool
version: 0.9.0
license: GNU General Public License, version 3
website: https://www.shellcheck.net
```

**Note**: The Chocolatey package may be slightly behind the latest release. As of the documentation date, Chocolatey provides version 0.9.0 while the latest is 0.11.0.

Verify the installation path:

```powershell
where shellcheck
```

Expected output: `C:\ProgramData\chocolatey\bin\shellcheck.exe`

#### Troubleshooting

**Problem**: `shellcheck` command not found after installation

**Solution**: Close all terminal windows and open a new Command Prompt or PowerShell. The PATH update requires a fresh terminal session.

**Problem**: `choco` command not found

**Solution**: Chocolatey may not be in PATH. Close all terminal windows, open a new Administrator PowerShell, and try again. If the issue persists, reinstall Chocolatey.

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: Need the latest ShellCheck version

**Solution**: The Chocolatey package may lag behind releases. For the absolute latest version, use winget or download the binary manually:

Using winget:

```powershell
winget install --id koalaman.shellcheck --silent --accept-package-agreements --accept-source-agreements
```

Manual download:

```powershell
Invoke-WebRequest -Uri "https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.zip" -OutFile "$env:TEMP\shellcheck.zip"
Expand-Archive -Path "$env:TEMP\shellcheck.zip" -DestinationPath "$env:TEMP\shellcheck" -Force
Copy-Item "$env:TEMP\shellcheck\shellcheck-v0.11.0.exe" -Destination "C:\Windows\System32\shellcheck.exe"
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004+ or Windows 11
- Windows Subsystem for Linux (WSL) with Ubuntu installed
- WSL 2 recommended for best performance
- sudo privileges within WSL

WSL Ubuntu installations follow the same process as native Ubuntu, using APT.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y shellcheck
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
shellcheck --version
```

Expected output (version numbers may vary):

```
ShellCheck - shell script analysis tool
version: 0.8.0
license: GNU General Public License, version 3
website: https://www.shellcheck.net
```

Verify the installation path:

```bash
which shellcheck
```

Expected output: `/usr/bin/shellcheck`

Test ShellCheck on a sample script:

```bash
echo '#!/bin/bash
echo $foo' | shellcheck -
```

#### Troubleshooting

**Problem**: `E: Unable to locate package shellcheck`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
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

**Problem**: Need the latest ShellCheck version in WSL

**Solution**: Download the latest binary directly:

```bash
wget -qO- "https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.x86_64.tar.xz" | tar -xJv && sudo cp shellcheck-v0.11.0/shellcheck /usr/local/bin/ && rm -rf shellcheck-v0.11.0
```

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or Windows 11
- Git for Windows installed (includes Git Bash)
- Internet connectivity

Git Bash does not include ShellCheck by default. You must download the Windows binary and place it in a directory included in Git Bash's PATH.

#### Installation Steps

Open Git Bash and run the following commands:

**Step 1: Create the local bin directory (if it does not exist)**

```bash
mkdir -p ~/bin
```

**Step 2: Download and extract the ShellCheck Windows binary**

```bash
curl -Lo ~/shellcheck.zip https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.zip && unzip -o ~/shellcheck.zip -d ~/bin && mv ~/bin/shellcheck-v0.11.0.exe ~/bin/shellcheck.exe && rm ~/shellcheck.zip
```

This downloads ShellCheck version 0.11.0 directly from the official GitHub releases and places it in your home bin directory.

**Step 3: Add ~/bin to PATH (if not already)**

Check if ~/bin is in your PATH:

```bash
echo $PATH | grep -q "$HOME/bin" && echo "Already in PATH" || echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
shellcheck --version
```

Expected output:

```
ShellCheck - shell script analysis tool
version: 0.11.0
license: GNU General Public License, version 3
website: https://www.shellcheck.net
```

Verify ShellCheck is accessible:

```bash
which shellcheck
```

Expected output: `/c/Users/<your-username>/bin/shellcheck` or similar.

Test ShellCheck on a sample script:

```bash
echo '#!/bin/bash
echo $foo' | shellcheck -
```

#### Troubleshooting

**Problem**: `shellcheck: command not found`

**Solution**: The `~/bin` directory may not be in Git Bash's PATH. Add it manually:

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

**Problem**: `unzip: command not found`

**Solution**: Git Bash includes unzip by default, but if missing, extract manually using Windows Explorer or install unzip:

```bash
# Alternative: Use PowerShell to extract
powershell -Command "Expand-Archive -Path '$HOME/shellcheck.zip' -DestinationPath '$HOME/bin' -Force"
mv ~/bin/shellcheck-v0.11.0.exe ~/bin/shellcheck.exe
```

**Problem**: Permission denied when downloading

**Solution**: Git Bash normally has network access. If behind a corporate proxy, configure Git Bash to use it:

```bash
export http_proxy=http://proxy.example.com:8080
export https_proxy=http://proxy.example.com:8080
```

**Problem**: SSL certificate errors during download

**Solution**: Update the CA certificates or use the `-k` flag (not recommended for production):

```bash
curl -kLo ~/shellcheck.zip https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.zip
```

**Problem**: Want to install to Git's built-in bin directory

**Solution**: Alternatively, copy to Git's usr/bin directory (requires running Git Bash as Administrator):

```bash
curl -Lo /tmp/shellcheck.zip https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.zip && unzip -o /tmp/shellcheck.zip -d /tmp && cp /tmp/shellcheck-v0.11.0.exe /usr/bin/shellcheck.exe
```

---

## Post-Installation Configuration

ShellCheck works out of the box for most use cases. No additional configuration is typically required. The following optional configurations may be useful:

### Configuring Default Options

Create a `.shellcheckrc` file in your home directory or project root to set default options:

```bash
cat > ~/.shellcheckrc << 'EOF'
# Enable all optional checks
enable=all

# Exclude specific checks if needed
# disable=SC2034,SC2154

# Specify shell dialect (sh, bash, dash, ksh)
shell=bash

# Set source path for sourced files
# source-path=SCRIPTDIR
EOF
```

### Editor Integration

**VS Code**: Install the ShellCheck extension from the VS Code marketplace. The extension includes bundled binaries but will use your system ShellCheck if installed:

```bash
code --install-extension timonwong.shellcheck
```

**Vim/Neovim**: Add ShellCheck to ALE or Syntastic for real-time linting.

**Sublime Text**: Install the SublimeLinter-shellcheck package via Package Control.

### CI/CD Integration

Add ShellCheck to your CI/CD pipeline. Example for GitHub Actions:

```yaml
- name: Run ShellCheck
  run: |
    find . -name "*.sh" -type f | xargs shellcheck
```

Example for GitLab CI:

```yaml
shellcheck:
  image: koalaman/shellcheck-alpine:stable
  script:
    - find . -name "*.sh" -type f | xargs shellcheck
```

### Shell Aliases

Create convenient aliases for common ShellCheck operations. Add to your shell configuration file (`~/.bashrc`, `~/.zshrc`, or `~/.bash_profile`):

```bash
# Check all shell scripts in current directory
alias scall='find . -name "*.sh" -type f | xargs shellcheck'

# Check with severity filter (only errors and warnings)
alias scerr='shellcheck -S error'
alias scwarn='shellcheck -S warning'

# Output in different formats
alias scjson='shellcheck -f json'
alias scgcc='shellcheck -f gcc'
```

### Test Your Installation

Verify ShellCheck can analyze scripts correctly:

```bash
echo '#!/bin/bash
for f in $(ls *.txt); do
  echo $f
done' | shellcheck -
```

Expected output showing multiple warnings:

```
In - line 2:
for f in $(ls *.txt); do
         ^---------^ SC2045 (warning): Iterating over ls output is fragile. Use globs.
              ^---^ SC2035 (info): Use ./*glob* or -- *glob* so names with dashes won't become options.

In - line 3:
  echo $f
       ^-- SC2086 (info): Double quote to prevent globbing and word splitting.

Did you mean:
  echo "$f"
```

---

## Common Issues

### Issue: "SC2086: Double quote to prevent globbing and word splitting"

**Symptoms**: ShellCheck warns about unquoted variables.

**Solution**: Quote your variables to prevent word splitting and globbing:

```bash
# Before
echo $variable

# After
echo "$variable"
```

To disable this check for a specific line:

```bash
# shellcheck disable=SC2086
echo $variable
```

### Issue: "SC2034: Variable appears unused"

**Symptoms**: ShellCheck warns about variables that are actually used in sourced scripts.

**Solution**: Export the variable or disable the check:

```bash
# Option 1: Export the variable
export MY_VAR="value"

# Option 2: Disable check for this variable
# shellcheck disable=SC2034
MY_VAR="value"
```

### Issue: Checking scripts that source other files

**Symptoms**: ShellCheck cannot find sourced files and reports errors.

**Solution**: Use the `source-path` directive or the `-P` option:

```bash
# In .shellcheckrc
source-path=SCRIPTDIR

# Or on command line
shellcheck -P SCRIPTDIR script.sh
```

### Issue: Different shell dialect than expected

**Symptoms**: ShellCheck assumes wrong shell and reports incorrect warnings.

**Solution**: Add a shebang to your script or use the `-s` flag:

```bash
#!/bin/bash
# Script content here

# Or specify on command line
shellcheck -s bash script.sh
```

### Issue: Checking files without .sh extension

**Symptoms**: ShellCheck does not recognize files without standard extensions.

**Solution**: Pipe the file content to ShellCheck or use the shebang:

```bash
# Pipe content
shellcheck < myscript

# Or add shebang to file
#!/bin/bash
```

### Issue: Too many warnings to fix at once

**Symptoms**: Existing codebase has many warnings and fixing all at once is overwhelming.

**Solution**: Filter by severity and fix incrementally:

```bash
# Show only errors (most critical)
shellcheck -S error script.sh

# Show errors and warnings
shellcheck -S warning script.sh

# Exclude specific rules while fixing others
shellcheck --exclude=SC2086,SC2034 script.sh
```

### Issue: Using Docker instead of local installation

**Symptoms**: Cannot install ShellCheck locally or need consistent version across team.

**Solution**: Use the official Docker image:

```bash
docker run --rm -v "$PWD:/mnt" koalaman/shellcheck:stable myscript.sh
```

For specific version:

```bash
docker run --rm -v "$PWD:/mnt" koalaman/shellcheck:v0.11.0 myscript.sh
```

---

## References

- [ShellCheck Official Website](https://www.shellcheck.net/)
- [ShellCheck GitHub Repository](https://github.com/koalaman/shellcheck)
- [ShellCheck GitHub Releases](https://github.com/koalaman/shellcheck/releases)
- [ShellCheck Wiki](https://www.shellcheck.net/wiki/)
- [ShellCheck Homebrew Formula](https://formulae.brew.sh/formula/shellcheck)
- [ShellCheck Chocolatey Package](https://community.chocolatey.org/packages/shellcheck)
- [ShellCheck Snap Package](https://snapcraft.io/shellcheck)
- [ShellCheck VS Code Extension](https://marketplace.visualstudio.com/items?itemName=timonwong.shellcheck)
- [ShellCheck Docker Hub](https://hub.docker.com/r/koalaman/shellcheck)
- [ShellCheck Online Playground](https://www.shellcheck.net/)
