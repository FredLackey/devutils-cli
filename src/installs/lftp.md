# Installing LFTP

## Overview

LFTP is a sophisticated command-line file transfer program that supports multiple protocols including FTP, FTPS, HTTP, HTTPS, HFTP, FISH, SFTP, and BitTorrent. Developed by Alexander Lukyanov and distributed under the GNU General Public License (GPL-3.0-or-later), LFTP is designed for reliability and automation.

Key features that distinguish LFTP from basic FTP clients:

- **Automatic retry and resume**: Any non-fatal error is handled properly and operations are automatically retried. If a download breaks, it resumes from where it stopped.
- **Mirror capabilities**: Built-in mirror command can download or upload entire directory trees. Reverse mirror (`mirror -R`) uploads directories to servers.
- **Segmented transfers**: Downloads can be split into multiple segments for faster transfers.
- **Job control**: Unix shell-like job control allows background transfers and queue management.
- **Scriptable**: Fully scriptable for automation in CI/CD pipelines and scheduled tasks.
- **Bandwidth throttling**: Transfer speeds can be limited to avoid saturating network connections.

LFTP is commonly used for automated backups, website deployments, large file transfers, and any scenario requiring reliable file synchronization over various protocols.

## Prerequisites

Before installing LFTP on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required for system-wide installation (sudo on Linux/macOS, Administrator on Windows)
3. **Terminal access** - LFTP is a command-line tool with no graphical interface

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager installed
- Xcode Command Line Tools (installed automatically by Homebrew if missing)

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

For Apple Silicon Macs, ensure Homebrew is in your PATH:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

#### Installation Steps

Run the following command to install LFTP:

```bash
brew install --quiet lftp
```

The `--quiet` flag suppresses non-essential output, making the installation suitable for scripts and automation. Homebrew automatically installs the required dependencies:

- libidn2 (international domain name library)
- openssl@3 (cryptography and SSL/TLS toolkit)
- readline (command-line editing library)
- gettext (internationalization library)

#### Verification

Confirm the installation succeeded:

```bash
lftp --version
```

Expected output (version numbers may vary):

```
LFTP | Version 4.9.3 | Copyright (c) 1996-2024 Alexander V. Lukyanov

LFTP is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```

Test LFTP can connect to a server:

```bash
lftp -c "open ftp.gnu.org; ls; bye"
```

This connects to the GNU FTP server, lists the directory contents, and exits.

#### Troubleshooting

**Problem**: `lftp: command not found` after installation

**Solution**: Homebrew may not be in your PATH. Run:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Then add this line to your shell profile (`~/.zshrc` or `~/.bash_profile`) for persistence.

**Problem**: SSL certificate verification errors when connecting to servers

**Solution**: If the server uses a self-signed certificate or one not recognized by your system, add to `~/.lftprc`:

```bash
echo 'set ssl:verify-certificate no' >> ~/.lftprc
```

**Warning**: Only disable certificate verification for trusted servers. This reduces security.

**Problem**: "Fatal error: Certificate verification: subjectAltName does not match"

**Solution**: The server's certificate hostname does not match. Either use the correct hostname or disable verification as shown above.

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- Active internet connection

LFTP is available in the official Ubuntu and Debian repositories, so no additional repository configuration is required.

#### Installation Steps

Run the following commands to update the package index and install LFTP:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y lftp
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure the installation proceeds without prompts, making it suitable for scripts and automation.

#### Verification

Confirm the installation succeeded:

```bash
lftp --version
```

Expected output (version numbers may vary based on your Ubuntu/Debian version):

```
LFTP | Version 4.9.2 | Copyright (c) 1996-2021 Alexander V. Lukyanov
```

Test LFTP can connect to a server:

```bash
lftp -c "open ftp.gnu.org; ls; bye"
```

#### Troubleshooting

**Problem**: `E: Unable to locate package lftp`

**Solution**: The package index may be outdated. Run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

Then retry the installation.

**Problem**: Permission denied errors

**Solution**: Ensure you are using sudo:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y lftp
```

**Problem**: Slow connection or timeout errors

**Solution**: LFTP may be attempting active FTP mode. Force passive mode by adding to `~/.lftprc`:

```bash
echo 'set ftp:passive-mode on' >> ~/.lftprc
```

**Problem**: SFTP connections fail with "Host key verification failed"

**Solution**: The server's SSH host key is not in your known_hosts file. Connect once with ssh to add it:

```bash
ssh user@hostname
```

Accept the host key, then retry with LFTP.

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit) - Bookworm or Bullseye
- Raspberry Pi 2B or later (any model with network connectivity)
- sudo privileges

Raspberry Pi OS is based on Debian, so LFTP is available in the standard repositories.

#### Installation Steps

Run the following commands to install LFTP:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y lftp
```

The installation process is identical to Ubuntu/Debian. The ARM architecture is handled automatically by the package manager.

#### Verification

Confirm the installation succeeded:

```bash
lftp --version
```

Expected output (version numbers may vary):

```
LFTP | Version 4.9.2 | Copyright (c) 1996-2021 Alexander V. Lukyanov
```

Test LFTP connectivity:

```bash
lftp -c "open ftp.gnu.org; ls; bye"
```

Check that LFTP is properly installed for your architecture:

```bash
file $(which lftp)
```

Expected output for 64-bit:
```
/usr/bin/lftp: ELF 64-bit LSB pie executable, ARM aarch64...
```

Expected output for 32-bit:
```
/usr/bin/lftp: ELF 32-bit LSB pie executable, ARM...
```

#### Troubleshooting

**Problem**: Installation very slow

**Solution**: Raspberry Pi SD cards can be slow. Use a high-quality SD card (Class 10 or faster) or boot from USB/SSD for better performance.

**Problem**: Network timeout errors during transfers

**Solution**: Raspberry Pi's network interface may have power saving enabled. Add to `~/.lftprc`:

```bash
echo 'set net:timeout 30' >> ~/.lftprc
echo 'set net:max-retries 5' >> ~/.lftprc
```

**Problem**: Out of memory during large transfers

**Solution**: LFTP buffers data during transfers. Limit buffer size in `~/.lftprc`:

```bash
echo 'set xfer:buffer-size 1048576' >> ~/.lftprc
```

This sets a 1MB buffer instead of the default.

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8/9, CentOS Stream 8/9, Rocky Linux 8/9, or AlmaLinux 8/9
- sudo privileges

LFTP is available in the base repositories for these distributions.

#### Installation Steps

**For Amazon Linux 2023 and RHEL/CentOS/Rocky/AlmaLinux 8+:**

```bash
sudo dnf install -y lftp
```

**For Amazon Linux 2 and older RHEL/CentOS 7:**

```bash
sudo yum install -y lftp
```

The `-y` flag automatically confirms the installation, enabling non-interactive execution. DNF is the successor to YUM and is used on modern RPM-based distributions. On Amazon Linux 2023, the `yum` command is available but internally calls `dnf`.

#### Verification

Confirm the installation succeeded:

```bash
lftp --version
```

Expected output (version numbers vary by distribution):

- Amazon Linux 2023 / RHEL 9: LFTP 4.9.2
- Amazon Linux 2 / RHEL 7: LFTP 4.4.8
- RHEL 8: LFTP 4.8.4

Test LFTP connectivity:

```bash
lftp -c "open ftp.gnu.org; ls; bye"
```

#### Troubleshooting

**Problem**: `No match for argument: lftp` on Amazon Linux 2023

**Solution**: The package may be in a different repository. Search for it:

```bash
dnf search lftp
```

If not found in base repositories, enable SPAL (Supplementary Packages for Amazon Linux):

```bash
sudo dnf install -y amazon-supplementary-packages
sudo dnf install -y lftp
```

**Problem**: Package not found on older Amazon Linux 2

**Solution**: On Amazon Linux 2, LFTP should be in the base repository. Update the package cache:

```bash
sudo yum makecache -y
sudo yum install -y lftp
```

**Problem**: "Repository 'X' is failing" errors

**Solution**: Clear the DNF cache and retry:

```bash
sudo dnf clean all
sudo dnf install -y lftp
```

**Problem**: SSL/TLS errors on older systems

**Solution**: Older versions of LFTP may have outdated SSL libraries. Update the system:

```bash
sudo dnf update -y
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 1809 or later, or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

If Chocolatey is not installed, install it by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Close and reopen PowerShell after installation.

**Note**: LFTP is not available in winget. The Chocolatey package provides unofficial Windows builds from the LFTP4WIN project.

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install lftp -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

#### Verification

Open a new Command Prompt or PowerShell window (required to pick up PATH changes), then run:

```powershell
lftp --version
```

Expected output (version numbers may vary):

```
LFTP | Version 4.9.2 | Copyright (c) 1996-2021 Alexander V. Lukyanov
```

Test LFTP connectivity:

```powershell
lftp -c "open ftp.gnu.org; ls; bye"
```

#### Troubleshooting

**Problem**: `lftp: command not found` or `'lftp' is not recognized`

**Solution**: The PATH may not have been updated. Close and reopen your terminal, or run:

```powershell
refreshenv
```

If still not working, verify Chocolatey shim exists:

```powershell
where.exe lftp
```

**Problem**: SSL certificate errors

**Solution**: Create or edit the LFTP configuration file. The location depends on your home directory:

```powershell
echo set ssl:verify-certificate no >> %USERPROFILE%\.lftprc
```

**Problem**: "MSYS fork" or "cygwin" related errors

**Solution**: The Windows LFTP build uses Cygwin libraries. Ensure no conflicting Cygwin installations exist. Try running from a standard Command Prompt rather than PowerShell.

**Problem**: Interactive mode issues in PowerShell

**Solution**: LFTP works better in Command Prompt on Windows. For scripting, use the `-c` flag:

```powershell
lftp -c "open ftp://user:pass@host; get file.txt; bye"
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

If WSL is not installed, install it from an Administrator PowerShell:

```powershell
wsl --install -d Ubuntu
```

Restart your computer if prompted, then complete the Ubuntu setup.

#### Installation Steps

Run these commands in your WSL Ubuntu terminal:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y lftp
```

The installation is identical to native Ubuntu because WSL runs a full Ubuntu userspace.

#### Verification

Confirm the installation succeeded:

```bash
lftp --version
```

Expected output (version numbers may vary based on your Ubuntu version):

```
LFTP | Version 4.9.2 | Copyright (c) 1996-2021 Alexander V. Lukyanov
```

Test LFTP connectivity:

```bash
lftp -c "open ftp.gnu.org; ls; bye"
```

#### Troubleshooting

**Problem**: DNS resolution fails in WSL

**Solution**: WSL sometimes has DNS issues. Create or edit `/etc/wsl.conf`:

```bash
sudo tee /etc/wsl.conf > /dev/null <<'EOF'
[network]
generateResolvConf = false
EOF
```

Then set a DNS server:

```bash
sudo rm /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
```

Restart WSL from PowerShell:

```powershell
wsl --shutdown
```

**Problem**: Cannot access Windows files from LFTP

**Solution**: Windows drives are mounted under `/mnt/`. Access files using:

```bash
lftp -c "put /mnt/c/Users/YourName/file.txt"
```

**Problem**: Slow network performance

**Solution**: WSL 2 uses a virtual network adapter. Large transfers may be slower than native Linux. For better performance with large files, consider using LFTP from native Windows (Chocolatey installation).

**Problem**: Permission denied when saving files

**Solution**: Ensure you have write permissions to the target directory. Within WSL, your home directory (`~`) is always writable:

```bash
cd ~
lftp -c "open ftp://server; get file.txt; bye"
```

---

### Git Bash (Cygwin/LFTP4WIN)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Internet connection for downloading LFTP4WIN

**Important**: LFTP is not natively available in Git Bash because Git Bash uses MinGW, which does not include LFTP. The solution is to install LFTP4WIN, a portable Cygwin-based distribution that includes LFTP.

#### Installation Steps

**Step 1: Download LFTP4WIN**

Open Git Bash and create an installation directory:

```bash
mkdir -p /c/tools/lftp4win
cd /c/tools/lftp4win
```

Download the LFTP4WIN installer:

```bash
curl -fsSL -o LFTP4WIN-installer.cmd https://raw.githubusercontent.com/userdocs/LFTP4WIN/master/LFTP4WIN-installer.cmd
```

**Step 2: Run the Installer**

The installer must be run from Windows Command Prompt or PowerShell (not Git Bash). Open Command Prompt as Administrator and run:

```cmd
cd C:\tools\lftp4win
LFTP4WIN-installer.cmd
```

The installer downloads and configures a portable Cygwin installation with LFTP and related tools. This process takes several minutes.

**Note**: The LFTP4WIN installer does not support silent installation. It runs non-interactively but displays output during the download and configuration process.

**Step 3: Add LFTP to Git Bash PATH**

After installation completes, add LFTP to your Git Bash PATH. Edit your `~/.bashrc`:

```bash
echo 'export PATH="/c/tools/lftp4win/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Alternatively, create an alias to run LFTP through the Cygwin environment:

```bash
echo 'alias lftp="/c/tools/lftp4win/bin/lftp.exe"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Test LFTP is accessible from Git Bash:

```bash
/c/tools/lftp4win/bin/lftp --version
```

Or if you added the PATH/alias:

```bash
lftp --version
```

Expected output (version numbers may vary):

```
LFTP | Version 4.9.2 | Copyright (c) 1996-2021 Alexander V. Lukyanov
```

Test LFTP connectivity:

```bash
/c/tools/lftp4win/bin/lftp -c "open ftp.gnu.org; ls; bye"
```

#### Troubleshooting

**Problem**: "cygwin1.dll not found" or similar DLL errors

**Solution**: LFTP4WIN includes its own Cygwin DLLs. Ensure you are running the lftp.exe from the LFTP4WIN installation directory, not a conflicting version.

**Problem**: LFTP works in LFTP4WIN terminal but not Git Bash

**Solution**: Git Bash and Cygwin are separate environments. You need to either:

1. Add the LFTP4WIN bin directory to your Git Bash PATH (as shown above)
2. Use the full path to lftp.exe
3. Use the LFTP4WIN-terminal.cmd to access LFTP

**Problem**: Path conversion issues (paths starting with `/c/` converted incorrectly)

**Solution**: Use Windows-style paths when running LFTP from Git Bash:

```bash
/c/tools/lftp4win/bin/lftp -c "lcd C:/Users/YourName; open ftp://server; put file.txt; bye"
```

**Problem**: SSH/SFTP connections fail

**Solution**: LFTP4WIN includes its own SSH. For SFTP, ensure your SSH keys are accessible. Copy keys to the LFTP4WIN home directory:

```bash
cp ~/.ssh/id_rsa /c/tools/lftp4win/home/$USER/.ssh/
cp ~/.ssh/id_rsa.pub /c/tools/lftp4win/home/$USER/.ssh/
```

**Problem**: Installer fails partway through

**Solution**: The installer may have been blocked by firewall or antivirus. Rerun the installer - it will resume from where it stopped:

```cmd
cd C:\tools\lftp4win
LFTP4WIN-installer.cmd
```

---

## Post-Installation Configuration

After installing LFTP on any platform, consider these optional but recommended configurations.

### Configuration File Locations

LFTP reads configuration from these files in order:

1. `/etc/lftp.conf` - System-wide configuration (Linux/macOS)
2. `~/.lftprc` - User-specific configuration
3. `~/.lftp/rc` - Alternative user configuration location

On Windows (Chocolatey/LFTP4WIN), the user configuration is typically at `%USERPROFILE%\.lftprc`.

### Recommended Configuration

Create a `~/.lftprc` file with commonly useful settings:

```bash
cat > ~/.lftprc << 'EOF'
# Use passive mode by default (works better with firewalls/NAT)
set ftp:passive-mode on

# Set connection timeout to 30 seconds
set net:timeout 30

# Retry failed operations up to 5 times
set net:max-retries 5

# Delay between retries (in seconds)
set net:reconnect-interval-base 5

# Use encryption when available
set ftp:ssl-allow yes
set ftp:ssl-protect-data yes

# Show transfer progress
set cmd:trace no
EOF
```

### Bookmark Management

LFTP supports bookmarks for frequently accessed servers. Add a bookmark:

```bash
lftp -c "bookmark add myserver ftp://user@ftp.example.com"
```

List bookmarks:

```bash
lftp -c "bookmark list"
```

Connect using a bookmark:

```bash
lftp myserver
```

Bookmarks are stored in `~/.lftp/bookmarks`.

### Setting Default Credentials

For frequently accessed servers, you can store credentials (use with caution):

```bash
cat >> ~/.netrc << 'EOF'
machine ftp.example.com
login myusername
password mypassword
EOF
chmod 600 ~/.netrc
```

LFTP respects the standard `.netrc` file format.

---

## Common Issues

### Issue: "Login failed" or "530 Login incorrect"

**Symptoms**: LFTP connects but authentication fails

**Solutions**:

- Verify username and password are correct
- Check if the server requires a specific authentication method:
  ```bash
  lftp -e "set ftp:ssl-auth TLS; open ftp://user@server"
  ```
- Some servers require email address as password for anonymous access

### Issue: "Connection refused" or "Connection timed out"

**Symptoms**: LFTP cannot establish a connection to the server

**Solutions**:

- Verify the hostname and port are correct
- Check if a firewall is blocking the connection
- Try passive mode if behind NAT:
  ```bash
  lftp -e "set ftp:passive-mode on; open ftp://server"
  ```
- Verify the server is running and accepting connections

### Issue: "SSL certificate problem"

**Symptoms**: Connection fails with certificate verification errors

**Solutions**:

- For testing only, disable certificate verification:
  ```bash
  lftp -e "set ssl:verify-certificate no; open ftps://server"
  ```
- For production, install the CA certificate or update CA certificates:
  ```bash
  # Ubuntu/Debian
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates
  sudo update-ca-certificates
  ```

### Issue: Transfers stall or timeout

**Symptoms**: File transfers start but hang partway through

**Solutions**:

- Increase timeout values:
  ```bash
  lftp -e "set net:timeout 60; set net:max-retries 10; open ftp://server"
  ```
- Try disabling data connection reuse:
  ```bash
  lftp -e "set ftp:use-site-idle no; open ftp://server"
  ```
- Check available disk space on source and destination

### Issue: "Permission denied" when writing files

**Symptoms**: Downloads or uploads fail with permission errors

**Solutions**:

- Verify you have write permission to the local directory
- Verify you have write permission on the remote server
- On Linux/macOS, check file ownership:
  ```bash
  ls -la /path/to/directory
  ```

### Issue: Mirror command skips files

**Symptoms**: `mirror` does not transfer all expected files

**Solutions**:

- By default, mirror only transfers newer/changed files. Force full transfer:
  ```bash
  lftp -e "mirror --only-newer=no /remote/path /local/path; bye" ftp://server
  ```
- Check for hidden files (files starting with `.`):
  ```bash
  lftp -e "set ftp:list-options -a; mirror /remote /local; bye" ftp://server
  ```

---

## References

- [LFTP Official Website](https://lftp.yar.ru/)
- [LFTP Manual Page](https://lftp.yar.ru/lftp-man.html)
- [LFTP Source Code on GitHub](https://github.com/lavv17/lftp)
- [Homebrew LFTP Formula](https://formulae.brew.sh/formula/lftp)
- [Chocolatey LFTP Package](https://community.chocolatey.org/packages/lftp)
- [LFTP4WIN Project](https://github.com/userdocs/LFTP4WIN)
- [Ubuntu LFTP Package](https://packages.ubuntu.com/search?keywords=lftp)
- [Debian LFTP Package](https://packages.debian.org/search?keywords=lftp)
- [Fedora LFTP Package](https://packages.fedoraproject.org/pkgs/lftp/lftp/)
