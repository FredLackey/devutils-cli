# Installing unzip

## Overview

unzip is a command-line utility for extracting files from ZIP archives (also known as "zipfiles"). It is one of the most fundamental file compression tools available on Unix-like systems and Windows, providing reliable extraction of compressed files. unzip is developed and maintained by the Info-ZIP project, which has been providing free, portable, high-quality versions of ZIP utilities since the early 1990s.

unzip is essential for developers, system administrators, and DevOps engineers who need to:

- Extract software packages and releases distributed as ZIP files
- Decompress archives downloaded from the internet
- Automate extraction in deployment scripts and CI/CD pipelines
- List and test contents of ZIP archives without extracting
- Extract specific files from large archives

Key features of unzip include:

- Full compatibility with PKZIP, WinZip, and other ZIP utilities
- Support for ZIP64 extensions (archives larger than 4GB)
- Ability to preserve file permissions and timestamps
- Password-protected archive extraction
- Selective extraction of specific files or directories
- Testing archives for integrity without extraction

## Dependencies

### macOS (Homebrew)
- **Required:** None (unzip is pre-installed on macOS)
- **Optional:** Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew` if you need the latest version
- **Auto-installed:** None

### Ubuntu (APT/Snap)
- **Required:** None (APT is built into Ubuntu/Debian)
- **Optional:** None
- **Auto-installed:** None (unzip may already be pre-installed on many Ubuntu installations)

### Raspberry Pi OS (APT/Snap)
- **Required:** None (APT is built into Raspberry Pi OS)
- **Optional:** None
- **Auto-installed:** None (unzip may already be pre-installed on Raspberry Pi OS)

### Amazon Linux (DNF/YUM)
- **Required:** None (DNF/YUM is built into Amazon Linux)
- **Optional:** None
- **Auto-installed:** None

### Windows (Chocolatey/winget)
- **Required:** Chocolatey - Install via PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))` or run `dev install chocolatey`
- **Optional:** None
- **Auto-installed:** None
- **Note:** Windows 10/11 includes built-in ZIP support through File Explorer and PowerShell's `Expand-Archive`, but the Info-ZIP `unzip` command provides more features and is required for shell scripts expecting Unix-style `unzip`

### Git Bash (Manual/Portable)
- **Required:** Git for Windows - Download from https://git-scm.com/download/win or install via `choco install git -y`
- **Optional:** None
- **Auto-installed:** unzip is typically bundled with recent versions of Git for Windows; manual installation only needed if missing

## Prerequisites

Before installing unzip on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required on most platforms for system-wide installation
3. **Package manager installed** - Each platform requires its respective package manager (Homebrew, APT, DNF/YUM, Chocolatey, etc.)

**Note**: Many modern operating systems include unzip pre-installed. The installation steps below ensure you have unzip available or install it if missing.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma+ recommended)
- Terminal access

macOS includes a system version of unzip pre-installed at `/usr/bin/unzip`. For most users, the pre-installed version is sufficient. The steps below install the latest version via Homebrew if you need newer features or bug fixes.

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

First, check if unzip is already available:

```bash
unzip -v
```

If unzip is not installed or you need the Homebrew version, run:

```bash
brew install --quiet unzip
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts.

**Important**: Homebrew intentionally does not symlink unzip to the default bin directory to avoid conflicts with the macOS system version. To use the Homebrew version, you must reference it by its full path or add it to your PATH:

```bash
echo 'export PATH="$(brew --prefix)/opt/unzip/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

For Bash users, replace `~/.zshrc` with `~/.bash_profile`.

#### Verification

Confirm unzip is available:

```bash
unzip -v
```

Expected output (version numbers may vary):

```
UnZip 6.00 of 20 April 2009, by Info-ZIP.  Maintained by C. Spieler.  Send
bug reports using http://www.info-zip.org/zip-bug.html; see README for details.

Latest sources and executables are at ftp://ftp.info-zip.org/pub/infozip/ ;
see ftp://ftp.info-zip.org/pub/infozip/UnZip.html for other sites.

Compiled with gcc 4.2.1 Compatible Apple LLVM for Unix (Mac OS X) on Jan 30 2018.

UnZip special compilation options:
        APPLE_XATTR
        ...
```

Verify the installation path:

```bash
which unzip
```

Expected output: `/usr/bin/unzip` (system version) or `/opt/homebrew/opt/unzip/bin/unzip` (Homebrew version on Apple Silicon).

#### Troubleshooting

**Problem**: Homebrew unzip not in PATH

**Solution**: The Homebrew version is keg-only and not symlinked. Add it to your PATH as shown above, or use the full path:

```bash
$(brew --prefix)/opt/unzip/bin/unzip -v
```

**Problem**: `brew install unzip` fails with permission errors

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

unzip is available in the default Ubuntu and Debian repositories. Many installations include it pre-installed.

#### Installation Steps

Run the following command to update package lists and install unzip:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y unzip
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
unzip -v
```

Expected output (version numbers may vary):

```
UnZip 6.00 of 20 April 2009, by Debian. Original by Info-ZIP.

Latest sources and executables are at ftp://ftp.info-zip.org/pub/infozip/ ;
see ftp://ftp.info-zip.org/pub/infozip/UnZip.html for other sites.

Compiled with gcc 11.2.0 for Unix (Linux/GLIBC) on Mar 14 2022.

UnZip special compilation options:
        ...
```

Verify the installation path:

```bash
which unzip
```

Expected output: `/usr/bin/unzip`

#### Troubleshooting

**Problem**: `E: Unable to locate package unzip`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: `Permission denied` errors

**Solution**: Ensure you are using `sudo` with the installation command.

**Problem**: unzip is already installed but outdated

**Solution**: Upgrade to the latest version in the repositories:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y unzip
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 2 or later (Raspberry Pi 3B+ or later recommended for 64-bit)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so unzip installation follows the same APT-based process. unzip is often pre-installed on Raspberry Pi OS.

#### Installation Steps

Run the following command to update package lists and install unzip:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y unzip
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
unzip -v
```

Expected output (version numbers may vary):

```
UnZip 6.00 of 20 April 2009, by Debian. Original by Info-ZIP.

Latest sources and executables are at ftp://ftp.info-zip.org/pub/infozip/ ;
see ftp://ftp.info-zip.org/pub/infozip/UnZip.html for other sites.

Compiled with gcc 10.2.1 for Unix (Linux/GLIBC) on Nov  8 2020.

UnZip special compilation options:
        ...
```

Verify your architecture:

```bash
uname -m
```

Expected output: `aarch64` (64-bit) or `armv7l` (32-bit).

Verify the installation path:

```bash
which unzip
```

Expected output: `/usr/bin/unzip`

#### Troubleshooting

**Problem**: `E: Unable to locate package unzip`

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

unzip is available in the default Amazon Linux repositories. Amazon Linux 2023 uses `dnf` as the package manager, while Amazon Linux 2 uses `yum`. For convenience, AWS creates a symlink so `yum` commands also work on AL2023.

#### Installation Steps

**For Amazon Linux 2023:**

Run the following command to install unzip:

```bash
sudo dnf install -y unzip
```

**For Amazon Linux 2:**

Run the following command to install unzip:

```bash
sudo yum install -y unzip
```

The `-y` flag automatically confirms installation prompts, enabling non-interactive execution.

#### Verification

Confirm the installation succeeded:

```bash
unzip -v
```

Expected output (version numbers may vary):

```
UnZip 6.00 of 20 April 2009, by Info-ZIP.  Maintained by C. Spieler.  Send
bug reports using http://www.info-zip.org/zip-bug.html; see README for details.

Latest sources and executables are at ftp://ftp.info-zip.org/pub/infozip/ ;
see ftp://ftp.info-zip.org/pub/infozip/UnZip.html for other sites.

Compiled with gcc 11.3.1 for Unix (Linux/GLIBC) on Sep 27 2022.

UnZip special compilation options:
        ...
```

Check which unzip package is installed:

```bash
rpm -q unzip
```

Expected output: `unzip-6.0-x.amzn2023.x86_64` or similar.

#### Troubleshooting

**Problem**: `No match for argument: unzip`

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
sudo yum install -y unzip
```

**Problem**: Permission denied when running unzip

**Solution**: Check file permissions on the archive or run with appropriate privileges.

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 (version 1803+) or Windows 11
- Chocolatey package manager installed
- Administrator PowerShell or Command Prompt

**Note**: Windows includes built-in ZIP support through File Explorer and PowerShell's `Expand-Archive` cmdlet. The Info-ZIP `unzip` command provides additional features and is required for shell scripts expecting Unix-style `unzip` behavior.

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install unzip -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

#### Verification

Open a **new** Command Prompt or PowerShell window (required for PATH to update), then run:

```powershell
unzip -v
```

Expected output (version numbers may vary):

```
UnZip 6.00 of 20 April 2009, by Info-ZIP.  Maintained by C. Spieler.  Send
bug reports using http://www.info-zip.org/zip-bug.html; see README for details.

Latest sources and executables are at ftp://ftp.info-zip.org/pub/infozip/ ;
see ftp://ftp.info-zip.org/pub/infozip/UnZip.html for other sites.

Compiled with Microsoft C for Windows NT/2K/XP/2K3/Vista/2K8 (32-bit) on ...
```

Verify the installation path:

```powershell
where unzip
```

Expected output should include `C:\ProgramData\chocolatey\bin\unzip.exe`.

#### Troubleshooting

**Problem**: `unzip` command not found after installation

**Solution**: Close all terminal windows and open a new Command Prompt or PowerShell. The PATH update requires a fresh terminal session.

**Problem**: `choco` command not found

**Solution**: Chocolatey may not be in PATH. Close all terminal windows, open a new Administrator PowerShell, and try again. If the issue persists, reinstall Chocolatey.

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: Need to use winget instead of Chocolatey

**Solution**: winget is also supported. Run the following in PowerShell or Command Prompt:

```powershell
winget install --id GnuWin32.UnZip --silent --accept-package-agreements --accept-source-agreements
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
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y unzip
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
unzip -v
```

Expected output (version numbers may vary):

```
UnZip 6.00 of 20 April 2009, by Debian. Original by Info-ZIP.

Latest sources and executables are at ftp://ftp.info-zip.org/pub/infozip/ ;
see ftp://ftp.info-zip.org/pub/infozip/UnZip.html for other sites.

Compiled with gcc 11.2.0 for Unix (Linux/GLIBC) on Mar 14 2022.

UnZip special compilation options:
        ...
```

Verify the installation path:

```bash
which unzip
```

Expected output: `/usr/bin/unzip`

#### Troubleshooting

**Problem**: `E: Unable to locate package unzip`

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
- Internet connectivity

Recent versions of Git for Windows (1.7.6 and later) include the `unzip` command. If your version does not include it, you must download the binary manually.

#### Installation Steps

**Step 1: Check if unzip is already available**

Open Git Bash and run:

```bash
unzip -v
```

If unzip is available, you will see version information and can skip the remaining steps.

**Step 2: Download unzip if missing**

If unzip is not available, download the GnuWin32 unzip package:

```bash
curl -L -o /tmp/unzip-5.51-1-bin.zip https://sourceforge.net/projects/gnuwin32/files/unzip/5.51-1/unzip-5.51-1-bin.zip/download
```

**Step 3: Extract unzip.exe**

```bash
mkdir -p /tmp/unzip-extract && cd /tmp/unzip-extract && powershell.exe -Command "Expand-Archive -Path '/tmp/unzip-5.51-1-bin.zip' -DestinationPath '.' -Force"
```

**Step 4: Copy unzip.exe to Git's bin directory**

```bash
cp /tmp/unzip-extract/bin/unzip.exe /usr/bin/unzip.exe
```

**Step 5: Clean up temporary files**

```bash
rm -rf /tmp/unzip-5.51-1-bin.zip /tmp/unzip-extract
```

#### Verification

Confirm unzip is available:

```bash
unzip -v
```

Expected output (version numbers may vary):

```
UnZip 5.51 of 22 May 2004, by Info-ZIP.  Maintained by C. Spieler.  Send
bug reports using http://www.info-zip.org/zip-bug.html; see README for details.

Latest sources and executables are at ftp://ftp.info-zip.org/pub/infozip/
```

Verify the installation path:

```bash
which unzip
```

Expected output: `/usr/bin/unzip`

#### Troubleshooting

**Problem**: `unzip: command not found` after installation

**Solution**: Ensure the file was copied to `/usr/bin/` correctly. Verify with:

```bash
ls -la /usr/bin/unzip.exe
```

If the file exists but is not executable, Git Bash may not recognize it. Restart Git Bash.

**Problem**: Cannot write to `/usr/bin/`

**Solution**: Run Git Bash as Administrator. Right-click on Git Bash and select "Run as administrator".

**Problem**: curl download fails

**Solution**: SourceForge URLs may redirect. If the download fails, visit https://sourceforge.net/projects/gnuwin32/files/unzip/ in your browser, download manually, and extract unzip.exe to the Git Bash bin directory.

**Problem**: Need to use an alternative location

**Solution**: If you cannot write to `/usr/bin/`, create a local bin directory:

```bash
mkdir -p ~/bin
cp /tmp/unzip-extract/bin/unzip.exe ~/bin/unzip.exe
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

---

## Post-Installation Configuration

unzip works out of the box for most use cases. No additional configuration is typically required. The following tips may be useful:

### Common Usage Examples

Extract all files from an archive to the current directory:

```bash
unzip archive.zip
```

Extract to a specific directory:

```bash
unzip archive.zip -d /path/to/destination
```

List contents of an archive without extracting:

```bash
unzip -l archive.zip
```

Extract a specific file from an archive:

```bash
unzip archive.zip path/to/file.txt
```

Overwrite existing files without prompting:

```bash
unzip -o archive.zip
```

Test archive integrity without extracting:

```bash
unzip -t archive.zip
```

### Shell Aliases

Create convenient aliases for common unzip operations. Add to your shell configuration file (`~/.bashrc`, `~/.zshrc`, or `~/.bash_profile`):

```bash
# List ZIP contents
alias zipls='unzip -l'

# Test ZIP integrity
alias ziptest='unzip -t'

# Extract with overwrite
alias unzipo='unzip -o'
```

### Test Your Installation

Verify unzip works correctly by creating a test archive and extracting it:

```bash
# Create a test file
echo "Hello, World!" > /tmp/test.txt

# Create a ZIP archive (requires zip command)
zip /tmp/test.zip /tmp/test.txt

# Extract and verify
unzip -l /tmp/test.zip
```

Expected output:

```
Archive:  /tmp/test.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
       14  2024-01-15 10:30   tmp/test.txt
---------                     -------
       14                     1 file
```

---

## Common Issues

### Issue: "Archive: ... End-of-central-directory signature not found"

**Symptoms**: unzip fails with an error about missing central directory signature.

**Solution**: The ZIP file may be corrupted or incomplete. Try:

1. Re-download the archive
2. Check if the file is actually a ZIP (some files have wrong extensions):

```bash
file archive.zip
```

3. If the file is a different format (like gzip or tar), use the appropriate tool:

```bash
# For .tar.gz files
tar -xzf archive.tar.gz

# For .gz files
gunzip archive.gz
```

### Issue: "Need PK compat. v6.1 (can do v4.6)"

**Symptoms**: unzip cannot extract files compressed with newer methods.

**Solution**: The archive uses compression methods not supported by your unzip version. Use a newer tool like 7-zip:

```bash
# Install 7-zip (p7zip)
# Ubuntu/Debian/Raspberry Pi
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y p7zip-full

# macOS
brew install --quiet p7zip

# Then extract
7z x archive.zip
```

### Issue: Password-protected archives

**Symptoms**: Archive requires a password but unzip does not prompt.

**Solution**: Use the `-P` flag to provide the password:

```bash
unzip -P yourpassword archive.zip
```

**Warning**: Passing passwords on the command line is insecure as it may appear in process listings and shell history.

### Issue: "replace file.txt? [y]es, [n]o, [A]ll, [N]one, [r]ename:"

**Symptoms**: unzip prompts for confirmation when files already exist.

**Solution**: For non-interactive extraction, use the `-o` (overwrite) flag:

```bash
unzip -o archive.zip
```

Or use `-n` to never overwrite:

```bash
unzip -n archive.zip
```

### Issue: Filename encoding problems

**Symptoms**: Extracted filenames contain garbled characters or question marks.

**Solution**: Specify the character encoding:

```bash
# For archives created on Windows with non-ASCII filenames
unzip -O CP936 archive.zip
```

Common encodings: `CP936` (Chinese), `CP932` (Japanese), `CP949` (Korean), `CP1252` (Western European).

### Issue: Permission denied on extracted files

**Symptoms**: Cannot access extracted files due to permission issues.

**Solution**: The archive may contain files with restrictive permissions. Extract and fix:

```bash
unzip archive.zip
chmod -R u+rw extracted_directory/
```

---

## References

- [Info-ZIP Home Page](https://infozip.sourceforge.net/)
- [Info-ZIP UnZip Documentation](https://infozip.sourceforge.net/UnZip.html)
- [Info-ZIP FAQ](https://infozip.sourceforge.net/FAQ.html)
- [Info-ZIP on SourceForge](https://sourceforge.net/projects/infozip/)
- [unzip Homebrew Formula](https://formulae.brew.sh/formula/unzip)
- [unzip Chocolatey Package](https://community.chocolatey.org/packages/unzip)
- [GnuWin32 UnZip Package](https://gnuwin32.sourceforge.net/packages/unzip.htm)
- [winget GnuWin32.UnZip Package](https://winget.run/pkg/GnuWin32/UnZip)
- [Ubuntu unzip Package](https://packages.ubuntu.com/search?keywords=unzip)
- [Info-ZIP Wikipedia Article](https://en.wikipedia.org/wiki/Info-ZIP)
