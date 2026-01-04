# Installing cURL

## Overview

cURL (Client URL) is a command-line tool and library for transferring data using various network protocols including HTTP, HTTPS, FTP, FTPS, SCP, SFTP, LDAP, and many more. It is one of the most widely-used tools for making HTTP requests, downloading files, testing APIs, and automating data transfers. cURL is essential for developers, system administrators, and DevOps engineers who need to interact with web services from the command line or within scripts.

cURL supports features such as:
- HTTP/HTTPS requests with custom headers and authentication
- File uploads and downloads with resume capability
- Proxy support (HTTP, SOCKS4, SOCKS5)
- SSL/TLS certificate handling
- Cookie management
- HTTP/2 and HTTP/3 (QUIC) protocol support

## Dependencies

### macOS (Homebrew)
- **Required:** Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None (macOS includes cURL pre-installed; Homebrew version provides latest features)

### Ubuntu (APT/Snap)
- **Required:** None (APT is built into Ubuntu/Debian)
- **Optional:** None
- **Auto-installed:** OpenSSL, zlib, brotli, zstd, libidn2, libpsl, libssh2, nghttp2, librtmp, OpenLDAP (installed automatically by APT as cURL dependencies)

### Raspberry Pi OS (APT/Snap)
- **Required:** None (APT is built into Raspberry Pi OS)
- **Optional:** None
- **Auto-installed:** OpenSSL, zlib, brotli, zstd, libidn2, libpsl, libssh2, nghttp2 (installed automatically by APT as cURL dependencies)

### Amazon Linux (DNF/YUM)
- **Required:** None (DNF/YUM is built into Amazon Linux)
- **Optional:** None
- **Auto-installed:** OpenSSL, zlib, brotli, zstd, libidn2, libssh2, nghttp2 (installed automatically by DNF/YUM as cURL dependencies)
- **Note:** Amazon Linux 2023 provides `curl-minimal` by default. For full protocol support, install `curl-full` via `sudo dnf install -y --allowerasing curl-full libcurl-full`

### Windows (Chocolatey/winget)
- **Required:** Chocolatey - Install via PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))` or run `dev install chocolatey`
- **Optional:** None
- **Auto-installed:** Schannel, zlib, brotli, zstd, WinIDN, libssh2, nghttp2, ngtcp2, nghttp3 (installed automatically by Chocolatey as cURL dependencies)
- **Note:** Windows 10 version 1803+ includes cURL pre-installed at `C:\Windows\System32\curl.exe`

### Git Bash (Manual/Portable)
- **Required:** Git for Windows - Download from https://git-scm.com/download/win or install via `choco install git -y`
- **Optional:** None
- **Auto-installed:** None (cURL is bundled with Git for Windows; no separate installation needed)

## Prerequisites

Before installing cURL on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required on most platforms for system-wide installation
3. **Package manager installed** - Each platform requires its respective package manager (Homebrew, APT, DNF/YUM, Chocolatey, etc.)

**Note**: Many modern operating systems include cURL pre-installed. The installation steps below ensure you have cURL available or upgrade to the latest version.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma+ recommended)
- Homebrew package manager installed
- Terminal access

macOS includes a system version of cURL pre-installed. The steps below install the latest version via Homebrew, which includes more recent features and security updates.

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install the latest cURL via Homebrew:

```bash
brew install --quiet curl
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts.

**Important**: Homebrew intentionally does not symlink cURL to the default bin directory to avoid conflicts with the macOS system version. To use the Homebrew version as your default, add it to your PATH:

```bash
echo 'export PATH="$(brew --prefix)/opt/curl/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

For Bash users, replace `~/.zshrc` with `~/.bash_profile`.

#### Verification

Confirm the installation succeeded and that you are using the Homebrew version:

```bash
curl --version
```

Expected output (version numbers may vary):

```
curl 8.11.0 (x86_64-apple-darwin23.0) libcurl/8.11.0 (SecureTransport) OpenSSL/3.4.0 zlib/1.2.13 brotli/1.1.0 zstd/1.5.6 libidn2/2.3.7 libssh2/1.11.1 nghttp2/1.64.0 librtmp/2.3 OpenLDAP/2.6.8
Release-Date: 2024-11-06
Protocols: dict file ftp ftps gopher gophers http https imap imaps ipfs ipns ldap ldaps mqtt pop3 pop3s rtmp rtsp scp sftp smb smbs smtp smtps telnet tftp
Features: alt-svc AsynchDNS brotli GSS-API HSTS HTTP2 HTTPS-proxy IDN IPv6 Kerberos Largefile libz MultiSSL NTLM PSL SPNEGO SSL threadsafe TLS-SRP UnixSockets zstd
```

Verify the path points to Homebrew:

```bash
which curl
```

Expected output: `/opt/homebrew/opt/curl/bin/curl` (Apple Silicon) or `/usr/local/opt/curl/bin/curl` (Intel).

#### Troubleshooting

**Problem**: `curl --version` shows older macOS system version

**Solution**: The Homebrew cURL is not in your PATH. Run the PATH export command shown above and restart your terminal.

**Problem**: `brew install curl` fails with permission errors

**Solution**: Fix Homebrew directory ownership:

```bash
sudo chown -R $(whoami) $(brew --prefix)/*
```

**Problem**: Homebrew itself is not found

**Solution**: Ensure Homebrew is in your PATH. For Apple Silicon Macs:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 LTS or later, or Debian 10 (Buster) or later
- sudo privileges
- Internet connectivity

Most Ubuntu and Debian installations include cURL pre-installed. The steps below ensure cURL is installed or update it to the latest version from the repositories.

#### Installation Steps

Run the following commands to update package lists and install cURL:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
curl --version
```

Expected output (version numbers may vary):

```
curl 7.88.1 (x86_64-pc-linux-gnu) libcurl/7.88.1 OpenSSL/3.0.11 zlib/1.2.13 brotli/1.0.9 zstd/1.5.4 libidn2/2.3.3 libpsl/0.21.2 (+libidn2/2.3.3) libssh2/1.10.0 nghttp2/1.52.0 librtmp/2.3 OpenLDAP/2.5.13
Release-Date: 2023-02-20
Protocols: dict file ftp ftps gopher gophers http https imap imaps ldap ldaps mqtt pop3 pop3s rtmp rtsp scp sftp smb smbs smtp smtps telnet tftp
Features: alt-svc AsynchDNS brotli GSS-API HSTS HTTP2 HTTPS-proxy IDN IPv6 Kerberos Largefile libz NTLM NTLM_WB PSL SPNEGO SSL TLS-SRP UnixSockets zstd
```

Verify the installation path:

```bash
which curl
```

Expected output: `/usr/bin/curl`

#### Troubleshooting

**Problem**: `E: Unable to locate package curl`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: `Permission denied` errors

**Solution**: Ensure you are using `sudo` with the installation command.

**Problem**: Older cURL version than expected

**Solution**: Ubuntu/Debian repositories maintain stable versions. For the absolute latest, you can build from source, but the repository version is recommended for most users.

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 2 or later (Raspberry Pi 3B+ or later recommended for 64-bit)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so cURL installation follows the same process as Ubuntu/Debian. cURL is often pre-installed on Raspberry Pi OS.

#### Installation Steps

Run the following commands to update package lists and install cURL:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
curl --version
```

Expected output for ARM64 (version numbers may vary):

```
curl 7.88.1 (aarch64-unknown-linux-gnu) libcurl/7.88.1 OpenSSL/3.0.11 zlib/1.2.13 brotli/1.0.9 zstd/1.5.4 libidn2/2.3.3 libpsl/0.21.2 (+libidn2/2.3.3) libssh2/1.10.0 nghttp2/1.52.0
Release-Date: 2023-02-20
Protocols: dict file ftp ftps gopher gophers http https imap imaps ldap ldaps mqtt pop3 pop3s rtmp rtsp scp sftp smb smbs smtp smtps telnet tftp
Features: alt-svc AsynchDNS brotli GSS-API HSTS HTTP2 HTTPS-proxy IDN IPv6 Kerberos Largefile libz NTLM NTLM_WB PSL SPNEGO SSL TLS-SRP UnixSockets zstd
```

Verify your architecture:

```bash
uname -m
```

Expected output: `aarch64` (64-bit) or `armv7l` (32-bit).

#### Troubleshooting

**Problem**: `E: Unable to locate package curl`

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

cURL is pre-installed on all Amazon Linux versions. Amazon Linux 2023 uses `dnf` as the package manager, while Amazon Linux 2 uses `yum`. For convenience, AWS creates a symlink so `yum` commands also work on AL2023.

**Note**: AL2023 provides `curl-minimal` by default, which supports the most common protocols. The full `curl` package is available if additional protocols are needed.

#### Installation Steps

**For Amazon Linux 2023:**

Run the following command to ensure cURL is installed (or update to the latest version):

```bash
sudo dnf install -y curl
```

If you need the full-featured cURL with all protocols:

```bash
sudo dnf install -y --allowerasing curl-full libcurl-full
```

**For Amazon Linux 2:**

Run the following command to ensure cURL is installed (or update to the latest version):

```bash
sudo yum install -y curl
```

The `-y` flag automatically confirms installation prompts, enabling non-interactive execution.

#### Verification

Confirm the installation succeeded:

```bash
curl --version
```

Expected output (version numbers may vary):

```
curl 8.5.0 (x86_64-amazon-linux-gnu) libcurl/8.5.0 OpenSSL/3.0.8 zlib/1.2.11 brotli/1.0.9 zstd/1.5.5 libidn2/2.3.4 libssh2/1.10.0 nghttp2/1.51.0
Release-Date: 2023-12-06
Protocols: dict file ftp ftps gopher gophers http https imap imaps ldap ldaps mqtt pop3 pop3s rtmp rtsp scp sftp smb smbs smtp smtps telnet tftp
Features: alt-svc AsynchDNS brotli GSS-API HSTS HTTP2 HTTPS-proxy IDN IPv6 Kerberos Largefile libz NTLM PSL SPNEGO SSL threadsafe TLS-SRP UnixSockets zstd
```

Check which curl package is installed:

```bash
rpm -q curl
```

#### Troubleshooting

**Problem**: `curl: command not found` (unlikely, but possible in minimal containers)

**Solution**: Install cURL:

```bash
sudo dnf install -y curl
# or for Amazon Linux 2:
sudo yum install -y curl
```

**Problem**: Missing protocol support (e.g., LDAP, RTMP)

**Solution**: Install the full cURL package:

```bash
sudo dnf install -y --allowerasing curl-full
```

**Problem**: `dnf: command not found` on Amazon Linux 2

**Solution**: Use `yum` instead of `dnf` on Amazon Linux 2:

```bash
sudo yum install -y curl
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 (version 1803+) or Windows 11
- Chocolatey package manager installed
- Administrator PowerShell or Command Prompt

**Note**: Windows 10 version 1803 and later includes cURL pre-installed at `C:\Windows\System32\curl.exe`. The steps below install the latest cURL version via Chocolatey, which may include newer features and security updates.

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install curl -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

#### Verification

Open a **new** Command Prompt or PowerShell window (required for PATH to update), then run:

```powershell
curl --version
```

Expected output (version numbers may vary):

```
curl 8.11.0 (Windows) libcurl/8.11.0 Schannel zlib/1.3.1 brotli/1.1.0 zstd/1.5.6 WinIDN libssh2/1.11.1 nghttp2/1.64.0 ngtcp2/1.8.1 nghttp3/1.6.0
Release-Date: 2024-11-06
Protocols: dict file ftp ftps gopher gophers http https imap imaps ipfs ipns ldap ldaps mqtt pop3 pop3s rtsp scp sftp smb smbs smtp smtps telnet tftp ws wss
Features: alt-svc AsynchDNS brotli HSTS HTTP2 HTTP3 HTTPS-proxy IDN IPv6 Kerberos Largefile libz NTLM PSL SPNEGO SSL SSPI threadsafe UnixSockets zstd
```

Verify the path points to the Chocolatey installation:

```powershell
where curl
```

Expected output should include `C:\ProgramData\chocolatey\bin\curl.exe`.

#### Troubleshooting

**Problem**: `curl` shows Windows built-in version instead of Chocolatey version

**Solution**: The Windows system32 version may take precedence. Either:

1. Use the full path: `C:\ProgramData\chocolatey\bin\curl.exe --version`
2. Modify system PATH to put Chocolatey bin directory before System32

**Problem**: In PowerShell, `curl` runs `Invoke-WebRequest` instead of the actual curl

**Solution**: Use `curl.exe` (with the extension) to invoke the actual cURL executable:

```powershell
curl.exe --version
```

**Problem**: `choco` command not found

**Solution**: Chocolatey may not be in PATH. Close all terminal windows, open a new Administrator PowerShell, and try again. If the issue persists, reinstall Chocolatey.

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

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
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
curl --version
```

Expected output (version numbers may vary):

```
curl 7.88.1 (x86_64-pc-linux-gnu) libcurl/7.88.1 OpenSSL/3.0.11 zlib/1.2.13 brotli/1.0.9 zstd/1.5.4 libidn2/2.3.3 libpsl/0.21.2 (+libidn2/2.3.3) libssh2/1.10.0 nghttp2/1.52.0 librtmp/2.3 OpenLDAP/2.5.13
Release-Date: 2023-02-20
Protocols: dict file ftp ftps gopher gophers http https imap imaps ldap ldaps mqtt pop3 pop3s rtmp rtsp scp sftp smb smbs smtp smtps telnet tftp
Features: alt-svc AsynchDNS brotli GSS-API HSTS HTTP2 HTTPS-proxy IDN IPv6 Kerberos Largefile libz NTLM NTLM_WB PSL SPNEGO SSL TLS-SRP UnixSockets zstd
```

#### Troubleshooting

**Problem**: `E: Unable to locate package curl`

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

### Git Bash (Windows)

#### Prerequisites

- Windows 10 or Windows 11
- Git for Windows installed (includes Git Bash)

Git Bash includes a MinGW-compiled version of cURL bundled with Git for Windows. No separate installation is typically required.

#### Installation Steps

Git for Windows includes cURL by default. If Git for Windows is not installed:

1. Download from https://git-scm.com/download/win
2. Run the installer with default options

Alternatively, install Git for Windows via Chocolatey (which includes Git Bash and cURL):

```powershell
choco install git -y
```

If you need a newer cURL version than the one bundled with Git Bash, install cURL separately on Windows (see Windows section above). Git Bash inherits the Windows PATH, so the Chocolatey-installed cURL will be available.

#### Verification

Open Git Bash and run:

```bash
curl --version
```

Expected output (version numbers may vary):

```
curl 8.4.0 (x86_64-w64-mingw32) libcurl/8.4.0 Schannel zlib/1.3 brotli/1.1.0 zstd/1.5.5 libidn2/2.3.4 libssh2/1.11.0 nghttp2/1.57.0 libgsasl/2.2.0
Release-Date: 2023-10-11
Protocols: dict file ftp ftps gopher gophers http https imap imaps ldap ldaps mqtt pop3 pop3s rtsp scp sftp smb smbs smtp smtps telnet tftp
Features: alt-svc AsynchDNS brotli GSS-API HSTS HTTP2 HTTPS-proxy IDN IPv6 Kerberos Largefile libz NTLM PSL SPNEGO SSL SSPI threadsafe UnixSockets zstd
```

#### Troubleshooting

**Problem**: `curl: command not found` in Git Bash

**Solution**: Git for Windows may not be installed correctly, or its bin directory is not in PATH. Reinstall Git for Windows from https://git-scm.com/download/win.

**Problem**: Old cURL version bundled with Git Bash

**Solution**: Install a newer cURL on Windows using Chocolatey (see Windows section above). Git Bash inherits the Windows PATH, so the newer version will be used automatically if Chocolatey bin is in PATH before Git's usr/bin.

**Problem**: SSL certificate errors in Git Bash

**Solution**: Update the CA certificates bundle:

```bash
git config --global http.sslCAInfo /mingw64/ssl/certs/ca-bundle.crt
```

---

## Post-Installation Configuration

cURL works out of the box for most use cases. The following optional configurations may be useful:

### Create a Configuration File

cURL reads default options from `~/.curlrc` (Linux/macOS) or `%APPDATA%\_curlrc` (Windows). Create this file to set persistent options:

```bash
# ~/.curlrc
# Follow redirects automatically
--location

# Show errors
--show-error

# Fail silently on HTTP errors (useful for scripts)
--fail

# Set a default user agent
--user-agent "Mozilla/5.0 (compatible; curl)"
```

### Configure Proxy Settings

For environments behind a corporate proxy:

```bash
# Set proxy via environment variable
export http_proxy="http://proxy.example.com:8080"
export https_proxy="http://proxy.example.com:8080"

# Or in ~/.curlrc
--proxy "http://proxy.example.com:8080"
```

### Test Your Installation

Verify cURL can make HTTPS requests:

```bash
curl -s -o /dev/null -w "%{http_code}" https://httpbin.org/get
```

Expected output: `200`

---

## Common Issues

### Issue: SSL Certificate Verification Fails

**Symptoms**: `curl: (60) SSL certificate problem: unable to get local issuer certificate`

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

### Issue: Connection Timeout

**Symptoms**: `curl: (28) Connection timed out`

**Solution**: Check network connectivity and firewall settings. Try increasing the timeout:

```bash
curl --connect-timeout 30 --max-time 120 https://example.com
```

### Issue: curl vs curl.exe on Windows

**Symptoms**: PowerShell runs `Invoke-WebRequest` instead of actual cURL.

**Solution**: Always use `curl.exe` in PowerShell to invoke the actual cURL executable:

```powershell
curl.exe https://example.com
```

### Issue: HTTP/2 or HTTP/3 Not Supported

**Symptoms**: cURL does not use HTTP/2 or HTTP/3 even when requested.

**Solution**: Check if your installed version supports these protocols:

```bash
curl --version | grep -i "http2\|http3"
```

If not listed in Features, you may need to install a newer version or build from source with appropriate flags.

### Issue: Slow DNS Resolution

**Symptoms**: cURL commands take several seconds to start.

**Solution**: Force IPv4 to avoid IPv6 DNS lookup delays:

```bash
curl -4 https://example.com
```

Or set this permanently in `~/.curlrc`:

```
--ipv4
```

---

## References

- [cURL Official Website](https://curl.se/)
- [cURL Documentation](https://curl.se/docs/)
- [Everything curl - The Book](https://everything.curl.dev/)
- [cURL Installation Guide](https://curl.se/docs/install.html)
- [cURL for macOS](https://everything.curl.dev/install/macos.html)
- [cURL for Linux](https://everything.curl.dev/install/linux.html)
- [cURL for Windows](https://everything.curl.dev/install/windows/index.html)
- [cURL Homebrew Formula](https://formulae.brew.sh/formula/curl)
- [cURL Chocolatey Package](https://community.chocolatey.org/packages/curl)
- [cURL Winget Package](https://winget.run/pkg/cURL/cURL)
- [Amazon Linux 2023 curl Package Information](https://docs.aws.amazon.com/linux/al2023/ug/curl-minimal.html)
- [cURL GitHub Repository](https://github.com/curl/curl)
