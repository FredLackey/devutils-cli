# Installing jq

## Overview

jq is a lightweight and flexible command-line JSON processor. It is designed to parse, filter, map, and transform structured JSON data with ease. Think of jq as sed or awk for JSON data - it allows you to slice, filter, and transform JSON with concise filter expressions.

jq is essential for developers and DevOps engineers who work with JSON-based APIs, configuration files, or any structured data. Common use cases include:

- Parsing API responses from curl or wget
- Extracting specific fields from JSON configuration files
- Transforming and reformatting JSON data
- Validating JSON syntax
- Scripting and automation with JSON data sources

jq has zero runtime dependencies and is written in portable C, making it extremely fast and easy to deploy across platforms.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `Homebrew` - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or `dev install homebrew`
- **Optional:** None
- **Auto-installed:**
  - `oniguruma` (regular expressions library) - Automatically installed by Homebrew as a jq dependency

### Ubuntu (APT/Snap)
- **Required:**
  - `sudo` privileges - Pre-installed on Ubuntu
  - `apt-get` - Pre-installed on Ubuntu
- **Optional:** None
- **Auto-installed:**
  - Standard C libraries and jq dependencies are handled by APT package manager

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `sudo` privileges - Pre-installed on Raspberry Pi OS
  - `apt-get` - Pre-installed on Raspberry Pi OS
- **Optional:** None
- **Auto-installed:**
  - Standard C libraries and jq dependencies are handled by APT package manager

### Amazon Linux (DNF/YUM)
- **Required:**
  - `sudo` privileges - Pre-installed on Amazon Linux
  - `dnf` (Amazon Linux 2023) or `yum` (Amazon Linux 2) - Pre-installed based on distribution version
- **Optional:** None
- **Auto-installed:**
  - Standard C libraries and jq dependencies are handled by DNF/YUM package manager

### Windows (Chocolatey/winget)
- **Required:**
  - `Chocolatey` - Install via PowerShell (Administrator): `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))` or `dev install chocolatey`
- **Optional:** None
- **Auto-installed:**
  - PATH updates and system integration handled by Chocolatey

### Git Bash (Manual/Portable)
- **Required:**
  - `curl` - Pre-installed with Git for Windows
  - `/usr/local/bin` directory access - Created by the installer if needed
- **Optional:** None
- **Auto-installed:** None

## Prerequisites

Before installing jq on any platform, ensure:

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

Run the following command to install jq via Homebrew:

```bash
brew install --quiet jq
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts and CI/CD pipelines.

**Note**: Homebrew will automatically install the dependency `oniguruma` (a regular expressions library) if it is not already present.

#### Verification

Confirm the installation succeeded:

```bash
jq --version
```

Expected output (version numbers may vary):

```
jq-1.8.1
```

Verify the installation path:

```bash
which jq
```

Expected output: `/opt/homebrew/bin/jq` (Apple Silicon) or `/usr/local/bin/jq` (Intel).

#### Troubleshooting

**Problem**: `jq: command not found` after installation

**Solution**: Homebrew may not be in your PATH. For Apple Silicon Macs, add Homebrew to your PATH:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For a permanent fix, add this to your shell configuration:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc && source ~/.zshrc
```

**Problem**: `brew install jq` fails with permission errors

**Solution**: Fix Homebrew directory ownership:

```bash
sudo chown -R $(whoami) $(brew --prefix)/*
```

**Problem**: Installation fails with network errors

**Solution**: Check your internet connection and try again. If behind a corporate proxy, configure Homebrew to use it:

```bash
export ALL_PROXY=http://proxy.example.com:8080
brew install --quiet jq
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 LTS or later, or Debian 10 (Buster) or later
- sudo privileges
- Internet connectivity

jq is available in the default Ubuntu and Debian repositories and does not require adding external PPAs.

#### Installation Steps

Run the following command to update package lists and install jq:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y jq
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
jq --version
```

Expected output (version numbers may vary depending on your distribution version):

```
jq-1.6
```

**Note**: Ubuntu and Debian repositories may contain slightly older versions of jq. The repository version is stable and recommended for most users. If you require the absolute latest version, see the "Building from Source" section in Common Issues.

Verify the installation path:

```bash
which jq
```

Expected output: `/usr/bin/jq`

#### Troubleshooting

**Problem**: `E: Unable to locate package jq`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: `Permission denied` errors

**Solution**: Ensure you are using `sudo` with the installation command.

**Problem**: Older jq version than expected

**Solution**: Ubuntu/Debian repositories prioritize stability over bleeding-edge releases. The repository version is sufficient for most use cases. For the latest version, download the binary directly from GitHub:

```bash
curl -L -o /usr/local/bin/jq https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-amd64 && sudo chmod +x /usr/local/bin/jq
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 2 or later (Raspberry Pi 3B+ or later recommended for 64-bit)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so jq installation follows the same APT-based process. The package is available for both ARM architectures.

#### Installation Steps

Run the following command to update package lists and install jq:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y jq
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
jq --version
```

Expected output (version numbers may vary):

```
jq-1.6
```

Verify your architecture:

```bash
uname -m
```

Expected output: `aarch64` (64-bit) or `armv7l` (32-bit).

Verify the installation path:

```bash
which jq
```

Expected output: `/usr/bin/jq`

#### Troubleshooting

**Problem**: `E: Unable to locate package jq`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
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

**Problem**: Need latest jq version on ARM

**Solution**: Download the ARM64 binary directly from GitHub:

```bash
sudo curl -L -o /usr/local/bin/jq https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-arm64 && sudo chmod +x /usr/local/bin/jq
```

For 32-bit ARM (armv7l), use the `jq-linux-armhf` binary instead.

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- Internet connectivity

jq is available in the default Amazon Linux repositories. Amazon Linux 2023 uses `dnf` as the package manager, while Amazon Linux 2 uses `yum`.

#### Installation Steps

**For Amazon Linux 2023:**

Run the following command to install jq:

```bash
sudo dnf install -y jq
```

**For Amazon Linux 2:**

Run the following command to install jq:

```bash
sudo yum install -y jq
```

The `-y` flag automatically confirms installation prompts, enabling non-interactive execution.

#### Verification

Confirm the installation succeeded:

```bash
jq --version
```

Expected output (version numbers may vary):

```
jq-1.6
```

Check which jq package is installed:

```bash
rpm -q jq
```

Expected output: `jq-1.6-x.amzn2023.x86_64` or similar.

#### Troubleshooting

**Problem**: `No match for argument: jq`

**Solution**: Refresh the repository cache:

```bash
sudo dnf makecache
```

Or for Amazon Linux 2:

```bash
sudo yum makecache
```

**Problem**: `dnf: command not found` on Amazon Linux 2

**Solution**: Use `yum` instead of `dnf` on Amazon Linux 2:

```bash
sudo yum install -y jq
```

**Problem**: Need the latest jq version

**Solution**: Amazon's repository may have an older version. Download the latest binary directly:

For x86_64 instances:

```bash
sudo curl -L -o /usr/local/bin/jq https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-amd64 && sudo chmod +x /usr/local/bin/jq
```

For ARM-based instances (Graviton):

```bash
sudo curl -L -o /usr/local/bin/jq https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-arm64 && sudo chmod +x /usr/local/bin/jq
```

**Problem**: Permission denied when running jq

**Solution**: Ensure the binary has execute permissions:

```bash
sudo chmod +x /usr/local/bin/jq
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
choco install jq -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

Chocolatey downloads the appropriate binary (32-bit or 64-bit) based on your system architecture and adds it to the PATH automatically.

#### Verification

Open a **new** Command Prompt or PowerShell window (required for PATH to update), then run:

```powershell
jq --version
```

Expected output (version numbers may vary):

```
jq-1.8.1
```

Verify the installation path:

```powershell
where jq
```

Expected output: `C:\ProgramData\chocolatey\bin\jq.exe`

#### Troubleshooting

**Problem**: `jq` command not found after installation

**Solution**: Close all terminal windows and open a new Command Prompt or PowerShell. The PATH update requires a fresh terminal session.

**Problem**: `choco` command not found

**Solution**: Chocolatey may not be in PATH. Close all terminal windows, open a new Administrator PowerShell, and try again. If the issue persists, reinstall Chocolatey.

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: Need to use winget instead of Chocolatey

**Solution**: winget is also supported. Run the following in PowerShell or Command Prompt:

```powershell
winget install --id jqlang.jq --silent --accept-package-agreements --accept-source-agreements
```

The `--silent` flag ensures non-interactive installation.

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
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y jq
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
jq --version
```

Expected output (version numbers may vary):

```
jq-1.6
```

Verify the installation path:

```bash
which jq
```

Expected output: `/usr/bin/jq`

#### Troubleshooting

**Problem**: `E: Unable to locate package jq`

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

**Problem**: Need the latest jq version in WSL

**Solution**: Download the latest binary directly:

```bash
sudo curl -L -o /usr/local/bin/jq https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-amd64 && sudo chmod +x /usr/local/bin/jq
```

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or Windows 11
- Git for Windows installed (includes Git Bash)
- Internet connectivity

Git Bash does not include jq by default. You must download the Windows binary and place it in a directory included in Git Bash's PATH.

#### Installation Steps

Open Git Bash and run the following commands:

**Step 1: Create the local bin directory (if it does not exist)**

```bash
mkdir -p /usr/local/bin
```

**Step 2: Download the jq Windows binary**

```bash
curl -L -o /usr/local/bin/jq.exe https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-windows-amd64.exe
```

This downloads jq version 1.8.1 directly from the official GitHub releases.

**Step 3: Verify the download (optional but recommended)**

The SHA-256 checksum for jq-windows-amd64.exe version 1.8.1 is:
`23cb60a1354eed6bcc8d9b9735e8c7b388cd1fdcb75726b93bc299ef22dd9334`

Verify the checksum:

```bash
sha256sum /usr/local/bin/jq.exe
```

#### Verification

Confirm the installation succeeded:

```bash
jq --version
```

Expected output:

```
jq-1.8.1
```

Verify jq is accessible:

```bash
which jq
```

Expected output: `/usr/local/bin/jq`

#### Troubleshooting

**Problem**: `jq: command not found`

**Solution**: The `/usr/local/bin` directory may not be in Git Bash's PATH. Add it manually:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

**Problem**: Permission denied when downloading

**Solution**: Run Git Bash as Administrator. Press Windows key, type "Git Bash", then press Ctrl+Shift+Enter.

**Problem**: SSL certificate errors during download

**Solution**: Update the CA certificates or use the `-k` flag (not recommended for production):

```bash
curl -k -L -o /usr/local/bin/jq.exe https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-windows-amd64.exe
```

**Problem**: Need 32-bit version

**Solution**: Download the 32-bit binary instead:

```bash
curl -L -o /usr/local/bin/jq.exe https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-windows-i386.exe
```

**Problem**: Want to install to Git's built-in bin directory

**Solution**: Alternatively, copy to Git's usr/bin directory (requires running Git Bash as Administrator):

```bash
curl -L -o /usr/bin/jq.exe https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-windows-amd64.exe
```

---

## Post-Installation Configuration

jq works out of the box for most use cases. No additional configuration is typically required. The following optional tips may be useful:

### Shell Aliases

Create convenient aliases for common jq operations. Add to your shell configuration file (`~/.bashrc`, `~/.zshrc`, or `~/.bash_profile`):

```bash
# Pretty-print JSON
alias jsonpp='jq .'

# Compact JSON output
alias jsonc='jq -c .'

# Extract keys from JSON object
alias jsonkeys='jq keys'
```

### Tab Completion

jq supports Bash and Zsh tab completion for filter expressions. This is typically installed automatically with package manager installations.

For Homebrew on macOS, ensure completions are enabled:

```bash
echo '[[ -r "$(brew --prefix)/etc/profile.d/bash_completion.sh" ]] && source "$(brew --prefix)/etc/profile.d/bash_completion.sh"' >> ~/.bash_profile && source ~/.bash_profile
```

### Test Your Installation

Verify jq can parse JSON correctly:

```bash
echo '{"name": "jq", "version": "1.8.1"}' | jq '.name'
```

Expected output:

```
"jq"
```

---

## Common Issues

### Issue: "jq: error: syntax error, unexpected INVALID_CHARACTER"

**Symptoms**: jq fails to parse input with strange character errors.

**Solution**: This often occurs when the input contains Windows-style line endings (CRLF) or invisible characters. Convert to Unix line endings:

```bash
# Using sed (Linux/macOS)
sed -i 's/\r$//' input.json

# Or pipe through tr
cat input.json | tr -d '\r' | jq .
```

### Issue: "jq: error: null cannot be parsed as a number"

**Symptoms**: jq fails when trying to perform arithmetic on null values.

**Solution**: Use the alternative operator `//` to provide default values:

```bash
echo '{"count": null}' | jq '.count // 0'
```

### Issue: Large JSON Files Cause Out of Memory

**Symptoms**: Processing very large JSON files causes jq to consume excessive memory.

**Solution**: Use streaming mode for large files:

```bash
jq --stream 'select(length==2)' large-file.json
```

Or use the `--slurpfile` option to process arrays incrementally.

### Issue: Color Output Not Working

**Symptoms**: jq output is not colorized when expected.

**Solution**: jq enables colors automatically when outputting to a terminal. If piping to another command, force colors with:

```bash
jq -C '.' file.json | less -R
```

### Issue: Need to Process Multiple JSON Files

**Symptoms**: Need to run jq on many files at once.

**Solution**: Use a loop or xargs:

```bash
# Using a loop
for f in *.json; do jq '.name' "$f"; done

# Using find and xargs
find . -name "*.json" -exec jq '.name' {} \;
```

### Issue: Building from Source

**Symptoms**: Need to build jq from source for a custom configuration.

**Solution**: Clone the repository and build:

```bash
git clone --recursive https://github.com/jqlang/jq.git
cd jq
autoreconf -i
./configure
make
sudo make install
```

**Note**: Building from source requires `autoconf`, `automake`, `libtool`, and a C compiler. On macOS, install these via Homebrew first. Use `./configure --disable-docs` if Ruby or Python dependencies are causing build failures.

---

## References

- [jq Official Website](https://jqlang.org/)
- [jq Manual](https://jqlang.org/manual/)
- [jq Tutorial](https://jqlang.org/tutorial/)
- [jq Download Page](https://jqlang.org/download/)
- [jq GitHub Repository](https://github.com/jqlang/jq)
- [jq GitHub Releases](https://github.com/jqlang/jq/releases)
- [jq Homebrew Formula](https://formulae.brew.sh/formula/jq)
- [jq Chocolatey Package](https://community.chocolatey.org/packages/jq)
- [jq Installation Wiki](https://github.com/jqlang/jq/wiki/Installation)
- [jqplay - Online jq Playground](https://jqplay.org/)
