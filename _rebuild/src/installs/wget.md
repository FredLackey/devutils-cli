# Installing wget

## Overview

GNU Wget is a free command-line utility for non-interactive downloading of files from the web. It supports HTTP, HTTPS, and FTP protocols, making it one of the most widely-used tools for automated file retrieval. Wget is essential for developers, system administrators, and DevOps engineers who need to download files, mirror websites, or retrieve data within scripts and CI/CD pipelines.

Wget supports features such as:
- Non-interactive operation (can run in the background or in scripts)
- Recursive downloading and website mirroring
- Resume interrupted downloads
- Bandwidth throttling and retry on failure
- HTTP cookies and authentication support
- Proxy support (HTTP and FTP)
- Robust handling of slow or unstable connections

## Dependencies

### macOS (Homebrew)
- **Required:** Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:** libidn2, openssl@3, gettext, libunistring (installed automatically by Homebrew as wget dependencies)

### Ubuntu (APT/Snap)
- **Required:** None (APT is built into Ubuntu/Debian)
- **Optional:** None
- **Auto-installed:** OpenSSL, zlib, libidn2, libpsl, libpcre2 (installed automatically by APT as wget dependencies)

### Raspberry Pi OS (APT/Snap)
- **Required:** None (APT is built into Raspberry Pi OS)
- **Optional:** None
- **Auto-installed:** OpenSSL, zlib, libidn2, libpsl, libpcre2 (installed automatically by APT as wget dependencies)

### Amazon Linux (DNF/YUM)
- **Required:** None (DNF/YUM is built into Amazon Linux)
- **Optional:** None
- **Auto-installed:** OpenSSL, zlib, libidn2, libpsl (installed automatically by DNF/YUM as wget dependencies)

### Windows (Chocolatey/winget)
- **Required:** Chocolatey - Install via PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))` or run `dev install chocolatey`
- **Optional:** None
- **Auto-installed:** OpenSSL, zlib (bundled in the wget package)

### Git Bash (Manual/Portable)
- **Required:** Git for Windows - Download from https://git-scm.com/download/win or install via `choco install git -y`
- **Optional:** None
- **Auto-installed:** None (wget.exe is a standalone statically compiled binary)

## Prerequisites

Before installing wget on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required on most platforms for system-wide installation
3. **Package manager installed** - Each platform requires its respective package manager (Homebrew, APT, DNF/YUM, Chocolatey, etc.)

**Note**: Unlike macOS (which does not include wget by default), most Linux distributions include wget pre-installed. The installation steps below ensure you have wget available or upgrade to the latest version.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma+ recommended)
- Homebrew package manager installed
- Terminal access

macOS does not include wget by default (it ships with curl instead). The steps below install wget via Homebrew.

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

For Apple Silicon Macs, add Homebrew to your shell environment:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc && source ~/.zshrc
```

#### Installation Steps

Run the following command to install wget via Homebrew:

```bash
brew install --quiet wget
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts.

#### Verification

Confirm the installation succeeded:

```bash
wget --version
```

Expected output (version numbers may vary):

```
GNU Wget 1.25.0 built on darwin23.0.0.

-cares +digest -gpgme +https +ipv6 +iri +large-file -metalink +nls
+ntlm +opie +psl +ssl/openssl

Wgetrc:
    /opt/homebrew/etc/wgetrc (system)
Locale:
    /opt/homebrew/share/locale
Compile:
    Apple clang version 15.0.0 (clang-1500.3.9.4)
    -I/opt/homebrew/opt/libidn2/include -I/opt/homebrew/opt/openssl@3/include
```

Verify the installation path:

```bash
which wget
```

Expected output: `/opt/homebrew/bin/wget` (Apple Silicon) or `/usr/local/bin/wget` (Intel).

#### Troubleshooting

**Problem**: `brew install wget` fails with permission errors

**Solution**: Fix Homebrew directory ownership:

```bash
sudo chown -R $(whoami) $(brew --prefix)/*
```

**Problem**: Homebrew itself is not found

**Solution**: Ensure Homebrew is in your PATH. For Apple Silicon Macs:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

**Problem**: SSL certificate errors when using wget

**Solution**: Update CA certificates:

```bash
brew install --quiet ca-certificates
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 LTS or later, or Debian 10 (Buster) or later
- sudo privileges
- Internet connectivity

Most Ubuntu and Debian installations include wget pre-installed. The steps below ensure wget is installed or update it to the latest version from the repositories.

#### Installation Steps

Run the following commands to update package lists and install wget:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
wget --version
```

Expected output (version numbers may vary):

```
GNU Wget 1.21.3 built on linux-gnu.

-cares +digest -gpgme +https +ipv6 +iri +large-file -metalink +nls
+ntlm +opie +psl +ssl/openssl

Wgetrc:
    /etc/wgetrc (system)
Locale:
    /usr/share/locale
Compile:
    gcc -DHAVE_CONFIG_H -DSYSTEM_WGETRC="/etc/wgetrc"
    -DLOCALEDIR="/usr/share/locale" -I. -I../../src -I../lib
```

Verify the installation path:

```bash
which wget
```

Expected output: `/usr/bin/wget`

#### Troubleshooting

**Problem**: `E: Unable to locate package wget`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: `Permission denied` errors

**Solution**: Ensure you are using `sudo` with the installation command.

**Problem**: Older wget version than expected

**Solution**: Ubuntu/Debian repositories maintain stable versions. For the absolute latest, you can build from source, but the repository version is recommended for most users.

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 2 or later (Raspberry Pi 3B+ or later recommended for 64-bit)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so wget installation follows the same process as Ubuntu/Debian. wget is typically pre-installed on Raspberry Pi OS.

#### Installation Steps

Run the following commands to update package lists and install wget:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
wget --version
```

Expected output for ARM64 (version numbers may vary):

```
GNU Wget 1.21.3 built on linux-gnueabihf.

-cares +digest -gpgme +https +ipv6 +iri +large-file -metalink +nls
+ntlm +opie +psl +ssl/openssl

Wgetrc:
    /etc/wgetrc (system)
Locale:
    /usr/share/locale
Compile:
    arm-linux-gnueabihf-gcc -DHAVE_CONFIG_H
```

Verify your architecture:

```bash
uname -m
```

Expected output: `aarch64` (64-bit) or `armv7l` (32-bit).

#### Troubleshooting

**Problem**: `E: Unable to locate package wget`

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

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- Internet connectivity

wget is typically pre-installed on Amazon Linux. Amazon Linux 2023 uses `dnf` as the package manager, while Amazon Linux 2 uses `yum`. For convenience, AWS creates a symlink so `yum` commands also work on AL2023.

#### Installation Steps

**For Amazon Linux 2023:**

Run the following command to ensure wget is installed (or update to the latest version):

```bash
sudo dnf install -y wget
```

**For Amazon Linux 2:**

Run the following command to ensure wget is installed (or update to the latest version):

```bash
sudo yum install -y wget
```

The `-y` flag automatically confirms installation prompts, enabling non-interactive execution.

#### Verification

Confirm the installation succeeded:

```bash
wget --version
```

Expected output (version numbers may vary):

```
GNU Wget 1.21.3 built on linux-gnu.

-cares +digest -gpgme +https +ipv6 +iri +large-file -metalink +nls
+ntlm +opie +psl +ssl/openssl

Wgetrc:
    /etc/wgetrc (system)
Locale:
    /usr/share/locale
```

Check which wget package is installed:

```bash
rpm -q wget
```

#### Troubleshooting

**Problem**: `wget: command not found` (unlikely, but possible in minimal containers)

**Solution**: Install wget:

```bash
sudo dnf install -y wget
```

**Problem**: `dnf: command not found` on Amazon Linux 2

**Solution**: Use `yum` instead of `dnf` on Amazon Linux 2:

```bash
sudo yum install -y wget
```

**Problem**: Package installation fails with GPG key errors

**Solution**: Update the system first:

```bash
sudo dnf update -y
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or Windows 11
- Chocolatey package manager installed
- Administrator PowerShell or Command Prompt

**Note**: Windows does not include wget by default. PowerShell has an alias `wget` that points to `Invoke-WebRequest`, but this is not the same as GNU wget.

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install wget -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

The Chocolatey package automatically detects your system architecture and installs the appropriate 32-bit or 64-bit version.

#### Verification

Open a **new** Command Prompt or PowerShell window (required for PATH to update), then run:

```powershell
wget.exe --version
```

**Note**: Use `wget.exe` (with the extension) in PowerShell to avoid invoking the PowerShell alias.

Expected output (version numbers may vary):

```
GNU Wget 1.21.4 built on mingw32.

-cares +digest -gpgme +https +ipv6 +iri +large-file -metalink -nls
+ntlm +opie -psl +ssl/openssl

Wgetrc:
Locale:
Compile:
    x86_64-w64-mingw32-gcc -DHAVE_CONFIG_H -DSYSTEM_WGETRC=""
```

Verify the path points to the Chocolatey installation:

```powershell
where wget.exe
```

Expected output should include `C:\ProgramData\chocolatey\bin\wget.exe`.

#### Troubleshooting

**Problem**: In PowerShell, `wget` runs `Invoke-WebRequest` instead of GNU wget

**Solution**: Use `wget.exe` (with the extension) to invoke the actual GNU wget executable:

```powershell
wget.exe https://example.com/file.zip
```

**Problem**: `choco` command not found

**Solution**: Chocolatey may not be in PATH. Close all terminal windows, open a new Administrator PowerShell, and try again. If the issue persists, reinstall Chocolatey.

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: wget.exe is not found after installation

**Solution**: Close and reopen your terminal window to refresh the PATH environment variable.

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
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
wget --version
```

Expected output (version numbers may vary):

```
GNU Wget 1.21.3 built on linux-gnu.

-cares +digest -gpgme +https +ipv6 +iri +large-file -metalink +nls
+ntlm +opie +psl +ssl/openssl

Wgetrc:
    /etc/wgetrc (system)
Locale:
    /usr/share/locale
```

#### Troubleshooting

**Problem**: `E: Unable to locate package wget`

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

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or Windows 11
- Git for Windows installed (includes Git Bash)

Git Bash does not include wget by default. The following steps install wget manually by downloading the standalone executable.

#### Installation Steps

**Step 1**: Download the wget executable

Open Git Bash and run the following commands to download and install wget:

```bash
# Create the bin directory if it doesn't exist
mkdir -p /c/Program\ Files/Git/mingw64/bin

# Download wget.exe (64-bit version)
curl -L -o /c/Program\ Files/Git/mingw64/bin/wget.exe https://eternallybored.org/misc/wget/1.21.4/64/wget.exe
```

**Note**: This downloads wget version 1.21.4. Check https://eternallybored.org/misc/wget/ for the latest version.

**Alternative for 32-bit systems**: Replace the URL with `https://eternallybored.org/misc/wget/1.21.4/32/wget.exe`

**Step 2**: Restart Git Bash

Close and reopen Git Bash to ensure the new executable is in your PATH.

#### Verification

Confirm the installation succeeded:

```bash
wget --version
```

Expected output (version numbers may vary):

```
GNU Wget 1.21.4 built on mingw32.

-cares +digest -gpgme +https +ipv6 +iri +large-file -metalink -nls
+ntlm +opie -psl +ssl/openssl

Wgetrc:
Locale:
Compile:
    x86_64-w64-mingw32-gcc -DHAVE_CONFIG_H -DSYSTEM_WGETRC=""
```

Verify wget is accessible:

```bash
which wget
```

Expected output: `/c/Program Files/Git/mingw64/bin/wget` or similar.

#### Troubleshooting

**Problem**: `wget: command not found` after installation

**Solution**: Ensure wget.exe was placed in the correct directory. Verify the file exists:

```bash
ls -la "/c/Program Files/Git/mingw64/bin/wget.exe"
```

If the file does not exist, repeat the download step.

**Problem**: Permission denied when downloading

**Solution**: Run Git Bash as Administrator, or download to a user-writable directory first and then move the file:

```bash
curl -L -o ~/wget.exe https://eternallybored.org/misc/wget/1.21.4/64/wget.exe
mv ~/wget.exe "/c/Program Files/Git/mingw64/bin/wget.exe"
```

**Problem**: SSL certificate errors with wget

**Solution**: The wget binaries from eternallybored.org are statically compiled with OpenSSL. If you encounter SSL issues, update the CA certificates or use the `--no-check-certificate` flag (not recommended for production):

```bash
wget --no-check-certificate https://example.com/file.zip
```

**Problem**: Antivirus flags wget.exe as suspicious

**Solution**: This is a false positive. The wget binaries from eternallybored.org are legitimate. Add an exception in your antivirus software for the wget.exe file.

---

## Post-Installation Configuration

wget works out of the box for most use cases. The following optional configurations may be useful:

### Create a Configuration File

wget reads default options from `~/.wgetrc` (Linux/macOS) or `%HOME%\_wgetrc` (Windows). Create this file to set persistent options:

```bash
# ~/.wgetrc

# Follow redirects automatically
follow_ftp = on

# Retry failed downloads
tries = 3

# Wait between retries
retry_connrefused = on
waitretry = 10

# Show a progress bar
progress = bar

# Set a default user agent
user_agent = Mozilla/5.0 (compatible; Wget)

# Timeout settings
timeout = 60
read_timeout = 60
dns_timeout = 30
```

### Configure Proxy Settings

For environments behind a corporate proxy:

```bash
# Set proxy via environment variables
export http_proxy="http://proxy.example.com:8080"
export https_proxy="http://proxy.example.com:8080"
export ftp_proxy="http://proxy.example.com:8080"

# Or in ~/.wgetrc
http_proxy = http://proxy.example.com:8080
https_proxy = http://proxy.example.com:8080
ftp_proxy = http://proxy.example.com:8080
use_proxy = on
```

### Test Your Installation

Verify wget can download files:

```bash
wget -q --spider https://www.google.com && echo "wget is working correctly"
```

Expected output: `wget is working correctly`

---

## Common Issues

### Issue: SSL Certificate Verification Fails

**Symptoms**: `ERROR: cannot verify example.com's certificate` or `Unable to locally verify the issuer's authority`

**Solution**: Update CA certificates on your system:

```bash
# Ubuntu/Debian/Raspberry Pi OS/WSL
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates

# Amazon Linux 2023
sudo dnf install -y ca-certificates

# Amazon Linux 2
sudo yum install -y ca-certificates

# macOS
brew install --quiet ca-certificates
```

### Issue: Download Interrupted or Connection Lost

**Symptoms**: Download stops partway through or fails with connection errors.

**Solution**: Use the `-c` flag to resume interrupted downloads:

```bash
wget -c https://example.com/large-file.zip
```

### Issue: wget vs Invoke-WebRequest on Windows

**Symptoms**: PowerShell runs `Invoke-WebRequest` instead of GNU wget.

**Solution**: Always use `wget.exe` in PowerShell to invoke the actual GNU wget:

```powershell
wget.exe https://example.com/file.zip
```

### Issue: Slow Downloads

**Symptoms**: Downloads are slower than expected.

**Solution**: Check if bandwidth throttling is enabled in your config. Also try disabling progress output for faster downloads:

```bash
wget -q https://example.com/file.zip
```

### Issue: Too Many Redirects

**Symptoms**: `20 redirections exceeded` error.

**Solution**: Increase the redirect limit:

```bash
wget --max-redirect=50 https://example.com/page
```

### Issue: Website Blocks wget

**Symptoms**: Websites return 403 Forbidden or similar errors.

**Solution**: Set a browser-like user agent:

```bash
wget --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" https://example.com/file.zip
```

---

## References

- [GNU Wget Official Website](https://www.gnu.org/software/wget/)
- [GNU Wget Manual](https://www.gnu.org/software/wget/manual/wget.html)
- [Wget Homebrew Formula](https://formulae.brew.sh/formula/wget)
- [Wget Chocolatey Package](https://community.chocolatey.org/packages/Wget)
- [Wget Windows Binaries (eternallybored.org)](https://eternallybored.org/misc/wget/)
- [Adding wget to Git Bash](https://gist.github.com/evanwill/0207876c3243bbb6863e65ec5dc3f058)
- [Amazon Linux 2023 Package Management](https://docs.aws.amazon.com/linux/al2023/ug/package-management.html)
- [Raspberry Pi OS Documentation](https://www.raspberrypi.com/documentation/computers/os.html)
