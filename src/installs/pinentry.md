# Installing Pinentry

## Overview

Pinentry is a collection of small dialog programs that allow GnuPG (GPG) and other programs to read passphrases and PIN numbers in a secure manner. It is an essential companion to GPG, providing the graphical or text-based interface that prompts users to enter their passphrase when performing cryptographic operations such as signing Git commits, decrypting files, or managing GPG keys.

Pinentry ensures that entered information is:

- Not swapped to disk
- Not temporarily stored anywhere accessible to other processes
- Protected from screen capture and keystroke logging where possible
- Displayed in a trusted, secure dialog

Without a properly configured pinentry program, GPG operations that require a passphrase will fail with "No pinentry" errors. This guide documents pinentry installation procedures for all platforms supported by DevUtils CLI.

## Prerequisites

Before installing pinentry on any platform, ensure:

1. **GnuPG is installed** - Pinentry works in conjunction with GPG; install GPG first
2. **Internet connectivity** - Required to download pinentry packages
3. **Administrative privileges** - Required for system-wide installation
4. **Terminal access** - Required to run installation commands

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma or later recommended)
- Homebrew package manager installed
- GnuPG installed (the `gnupg` package)
- Command line access via Terminal.app or iTerm2

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install pinentry-mac:

```bash
brew install --quiet pinentry-mac
```

The `--quiet` flag suppresses non-essential output, making the installation suitable for automation and scripts.

**Configure GPG to use pinentry-mac:**

Create the GnuPG configuration directory (if it does not exist) and configure the GPG agent to use pinentry-mac:

```bash
mkdir -p ~/.gnupg
chmod 700 ~/.gnupg
echo "pinentry-program $(brew --prefix)/bin/pinentry-mac" >> ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

This configuration enables a native macOS dialog for entering GPG passphrases, which integrates with macOS Keychain for optional passphrase storage.

#### Verification

Confirm the installation succeeded:

```bash
pinentry-mac --version
```

Expected output (version numbers may vary):

```
pinentry-mac (pinentry) 1.3.1.1
```

Verify pinentry-mac is configured in GPG:

```bash
cat ~/.gnupg/gpg-agent.conf | grep pinentry
```

Expected output (path varies by architecture):

```
pinentry-program /opt/homebrew/bin/pinentry-mac
```

On Intel Macs, the path will be `/usr/local/bin/pinentry-mac`.

Test the pinentry dialog by requesting a GPG passphrase:

```bash
echo "test" | gpg --clearsign
```

A native macOS dialog should appear requesting your GPG passphrase.

#### Troubleshooting

**Problem**: `pinentry-mac --version` shows "command not found"

**Solution**: Ensure Homebrew's bin directory is in your PATH:

```bash
echo 'export PATH="$(brew --prefix)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Problem**: `brew: command not found`

**Solution**: Homebrew is not installed or not in PATH. Install Homebrew first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Problem**: Passphrase dialog does not appear when signing commits

**Solution**: The GPG agent may not be using pinentry-mac. Verify the configuration and restart the agent:

```bash
echo "pinentry-program $(brew --prefix)/bin/pinentry-mac" > ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

**Problem**: "No pinentry" error when generating keys

**Solution**: Ensure pinentry-mac is installed and configured, then restart the GPG agent:

```bash
brew install --quiet pinentry-mac
mkdir -p ~/.gnupg
echo "pinentry-program $(brew --prefix)/bin/pinentry-mac" > ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

**Problem**: Permission errors on `~/.gnupg`

**Solution**: Fix permissions on the GnuPG directory:

```bash
chmod 700 ~/.gnupg
chmod 600 ~/.gnupg/*
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- Internet connectivity
- GnuPG installed

Ubuntu and Debian provide multiple pinentry variants. Choose the appropriate one based on your environment.

#### Installation Steps

**For desktop environments (GNOME):**

Run the following commands to install pinentry-gnome3:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-gnome3
```

**For terminal/server environments (recommended for headless systems):**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures no interactive prompts appear during installation, making this suitable for scripts and automation.

**Available pinentry packages:**

| Package | Description | Use Case |
|---------|-------------|----------|
| `pinentry-curses` | Text-based curses dialog | Servers, SSH sessions, terminals |
| `pinentry-tty` | Minimal TTY-only dialog | Minimal systems |
| `pinentry-gnome3` | GNOME 3 native dialog | GNOME desktop environments |
| `pinentry-gtk2` | GTK+ 2 dialog | GTK-based desktop environments |
| `pinentry-qt` | Qt-based dialog | KDE/Qt desktop environments |
| `pinentry-fltk` | FLTK-based dialog | Lightweight desktops |

**Configure GPG to use a specific pinentry (optional):**

If you have multiple pinentry programs installed and want to specify which one to use:

```bash
mkdir -p ~/.gnupg
chmod 700 ~/.gnupg
echo "pinentry-program /usr/bin/pinentry-curses" > ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

Replace `/usr/bin/pinentry-curses` with the path to your preferred pinentry program.

#### Verification

Confirm the installation succeeded:

```bash
pinentry --version
```

Expected output (version numbers may vary):

```
pinentry-curses (pinentry) 1.3.1
```

Verify the installation location:

```bash
which pinentry
```

Expected output:

```
/usr/bin/pinentry
```

List all installed pinentry variants:

```bash
update-alternatives --list pinentry 2>/dev/null || ls /usr/bin/pinentry*
```

#### Troubleshooting

**Problem**: `E: Unable to locate package pinentry-gnome3`

**Solution**: Update your package lists:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: "No pinentry" error when generating keys or signing

**Solution**: Install a pinentry package and restart the GPG agent:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses
gpgconf --kill gpg-agent
```

**Problem**: GUI pinentry does not appear in desktop environment

**Solution**: Install the appropriate GUI pinentry for your desktop:

```bash
# For GNOME
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-gnome3

# For KDE/Qt
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-qt
```

**Problem**: Pinentry hangs or times out over SSH

**Solution**: Ensure `GPG_TTY` is set in your shell profile:

```bash
echo 'export GPG_TTY=$(tty)' >> ~/.bashrc
source ~/.bashrc
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye recommended)
- Raspberry Pi 3B+ or later (any model supported by Raspberry Pi OS)
- sudo privileges
- Internet connectivity
- GnuPG installed

Raspberry Pi OS is based on Debian, so pinentry installation follows the Debian/APT method. Pinentry works on both 32-bit (armhf) and 64-bit (arm64) architectures.

#### Installation Steps

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM
- `armv7l` = 32-bit ARM

**For headless/server Raspberry Pi systems (most common):**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses
```

**For Raspberry Pi with desktop environment:**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-gnome3
```

The installation command is identical for both 32-bit and 64-bit Raspberry Pi OS.

**Configure pinentry for headless use:**

For headless Raspberry Pi systems, configure GPG to use pinentry-curses:

```bash
mkdir -p ~/.gnupg
chmod 700 ~/.gnupg
echo "pinentry-program /usr/bin/pinentry-curses" > ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

#### Verification

Confirm the installation succeeded:

```bash
pinentry --version
```

Expected output (version numbers may vary):

```
pinentry-curses (pinentry) 1.3.1
```

Verify the installation location:

```bash
which pinentry
```

Expected output:

```
/usr/bin/pinentry
```

#### Troubleshooting

**Problem**: Installation is slow

**Solution**: Raspberry Pi SD cards can be slow. Use a high-quality SD card (Class 10 or A1/A2 rated) or boot from USB/SSD for better performance.

**Problem**: "No pinentry" error when generating keys on headless Pi

**Solution**: Install and configure pinentry-curses:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses
mkdir -p ~/.gnupg
echo "pinentry-program /usr/bin/pinentry-curses" > ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

**Problem**: `E: Unable to fetch some archives`

**Solution**: Network connectivity issues. Check your internet connection and retry:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses
```

**Problem**: Pinentry prompt does not appear over SSH

**Solution**: Ensure `GPG_TTY` is set:

```bash
export GPG_TTY=$(tty)
```

Add to your `~/.bashrc` for persistence:

```bash
echo 'export GPG_TTY=$(tty)' >> ~/.bashrc
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- EC2 instance or compatible environment
- GnuPG installed

Amazon Linux 2023 uses DNF as the default package manager. Amazon Linux 2 uses YUM.

#### Installation Steps

**For Amazon Linux 2023 (AL2023):**

```bash
sudo dnf install -y pinentry
```

**For Amazon Linux 2 (AL2):**

```bash
sudo yum install -y pinentry
```

The `-y` flag automatically confirms installation, enabling non-interactive execution.

**Configure pinentry for terminal use:**

On server environments like EC2, configure GPG to use pinentry-curses:

```bash
mkdir -p ~/.gnupg
chmod 700 ~/.gnupg
echo "pinentry-program /usr/bin/pinentry-curses" > ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

#### Verification

Confirm the installation succeeded:

```bash
pinentry --version
```

Expected output (version numbers may vary):

```
pinentry-curses (pinentry) 1.2.1
```

Verify the installation location:

```bash
which pinentry
```

Expected output:

```
/usr/bin/pinentry
```

List available pinentry programs:

```bash
rpm -ql pinentry | grep bin
```

#### Troubleshooting

**Problem**: `No match for argument: pinentry` on Amazon Linux 2

**Solution**: Update the yum cache and retry:

```bash
sudo yum makecache
sudo yum install -y pinentry
```

**Problem**: "No pinentry" error when using GPG

**Solution**: Verify pinentry is installed and restart the GPG agent:

```bash
sudo dnf install -y pinentry
gpgconf --kill gpg-agent
```

**Problem**: Permission denied errors

**Solution**: Ensure you are using sudo:

```bash
sudo dnf install -y pinentry
```

**Problem**: Pinentry hangs waiting for input over SSH

**Solution**: Set the `GPG_TTY` environment variable:

```bash
export GPG_TTY=$(tty)
```

Add to your shell profile for persistence:

```bash
echo 'export GPG_TTY=$(tty)' >> ~/.bashrc
```

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 version 1903 or higher (64-bit), or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey or winget package manager installed

**Note**: On Windows, pinentry is bundled with GnuPG. You do not install pinentry separately. Installing GnuPG via Chocolatey or winget automatically includes pinentry-basic.exe.

If Chocolatey is not installed and you prefer to use it, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

**Using winget (recommended):**

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
winget install --id GnuPG.GnuPG --silent --accept-package-agreements --accept-source-agreements
```

**Using Chocolatey:**

```powershell
choco install gnupg -y
```

The `--silent` flag (winget) and `-y` flag (Chocolatey) ensure non-interactive installation suitable for automation and scripts.

After installation, close and reopen your terminal to ensure PATH changes take effect.

**Pinentry executables included:**

The GnuPG installation includes:

- `pinentry-basic.exe` - Simple Windows dialog (always included)
- `pinentry-qt.exe` - Qt-based GUI dialog (included with Gpg4win full installation)

The default installation uses pinentry-basic.exe, which displays a simple Windows dialog for passphrase entry.

#### Verification

Open a new Command Prompt or PowerShell window, then run:

```powershell
where pinentry-basic
```

Expected output:

```
C:\Program Files (x86)\GnuPG\bin\pinentry-basic.exe
```

Verify GPG is configured to use pinentry:

```powershell
gpg-connect-agent "getinfo pid" /bye
```

This should return a process ID, confirming the GPG agent is running with pinentry support.

#### Troubleshooting

**Problem**: `pinentry-basic: command not found` or `'pinentry-basic' is not recognized`

**Solution**: Close and reopen your terminal window. If the problem persists, add GPG to your PATH manually:

```powershell
$env:PATH += ";C:\Program Files (x86)\GnuPG\bin"
```

To make this permanent, run in Administrator PowerShell:

```powershell
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Program Files (x86)\GnuPG\bin", [EnvironmentVariableTarget]::Machine)
```

**Problem**: Passphrase dialog does not appear

**Solution**: Ensure the GPG agent is running:

```powershell
gpg-connect-agent /bye
```

**Problem**: Want to use Qt-based pinentry instead of basic

**Solution**: Install Gpg4win for the full suite including pinentry-qt:

```powershell
choco install gpg4win -y
```

Then configure GPG to use pinentry-qt:

```powershell
echo pinentry-program "C:\Program Files (x86)\Gpg4win\bin\pinentry-qt.exe" >> %APPDATA%\gnupg\gpg-agent.conf
gpg-connect-agent reloadagent /bye
```

**Problem**: Chocolatey or winget installation fails

**Solution**: Ensure you are running PowerShell as Administrator. Right-click PowerShell and select "Run as administrator".

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL
- GnuPG installed within WSL

WSL runs Ubuntu (or another Linux distribution) within Windows. Pinentry must be installed separately within WSL, as it does not share binaries with Windows.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

**For terminal-only WSL usage (most common):**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses
```

**For WSL with GUI support (WSLg):**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-gnome3
```

**Configure GPG to use pinentry-curses:**

```bash
mkdir -p ~/.gnupg
chmod 700 ~/.gnupg
echo "pinentry-program /usr/bin/pinentry-curses" > ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

**Set GPG_TTY for proper terminal detection:**

```bash
echo 'export GPG_TTY=$(tty)' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
pinentry --version
```

Expected output (version numbers may vary):

```
pinentry-curses (pinentry) 1.3.1
```

Verify the installation location:

```bash
which pinentry
```

Expected output:

```
/usr/bin/pinentry
```

Test pinentry by signing a test message:

```bash
echo "test" | gpg --clearsign
```

A pinentry dialog should appear in your terminal.

#### Troubleshooting

**Problem**: "No pinentry" error in WSL

**Solution**: Ensure pinentry is installed and configured:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses
mkdir -p ~/.gnupg
echo "pinentry-program /usr/bin/pinentry-curses" > ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

**Problem**: "Inappropriate ioctl for device" error

**Solution**: Set the GPG_TTY environment variable:

```bash
export GPG_TTY=$(tty)
```

Add to your shell profile for persistence:

```bash
echo 'export GPG_TTY=$(tty)' >> ~/.bashrc
```

**Problem**: Pinentry hangs in VS Code terminal

**Solution**: VS Code's integrated terminal may not properly allocate a TTY. Use pinentry-curses and ensure GPG_TTY is set. Alternatively, use an external terminal for GPG operations.

**Problem**: Want to use Windows pinentry from WSL

**Solution**: You can configure WSL GPG to use the Windows pinentry. Edit `~/.gnupg/gpg-agent.conf`:

```bash
mkdir -p ~/.gnupg
echo 'pinentry-program "/mnt/c/Program Files (x86)/GnuPG/bin/pinentry-basic.exe"' > ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

**Problem**: Permission errors in WSL

**Solution**: Ensure you are using sudo for installation:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses
```

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- GnuPG installed on Windows (see Windows section)

**Note**: Git Bash on Windows does not include a usable pinentry installation. Git for Windows ships with an older GPG 1.4.x in the MinGW environment, which is insufficient for modern use cases. You must install GnuPG on Windows separately, which includes pinentry.

#### Installation Steps

**Step 1: Install GnuPG on Windows**

First, install GnuPG on Windows using winget (run in Administrator PowerShell):

```powershell
winget install --id GnuPG.GnuPG --silent --accept-package-agreements --accept-source-agreements
```

Or using Chocolatey:

```powershell
choco install gnupg -y
```

**Step 2: Configure Git to use Windows GPG**

Open Git Bash and configure Git to use the Windows GPG installation (which includes pinentry):

```bash
git config --global gpg.program "/c/Program Files (x86)/GnuPG/bin/gpg.exe"
```

**Step 3: Set GPG_TTY for terminal operations**

Add to your `~/.bashrc`:

```bash
echo 'export GPG_TTY=$(tty)' >> ~/.bashrc
source ~/.bashrc
```

**Step 4: Close and reopen Git Bash**

Close all Git Bash windows and open a new one to ensure environment changes take effect.

#### Verification

In Git Bash, verify the Windows pinentry is accessible:

```bash
"/c/Program Files (x86)/GnuPG/bin/pinentry-basic.exe" --version
```

Expected output (version numbers may vary):

```
pinentry-basic (pinentry) 1.3.1
```

Verify Git is configured to use Windows GPG:

```bash
git config --global gpg.program
```

Expected output:

```
/c/Program Files (x86)/GnuPG/bin/gpg.exe
```

Test GPG signing (pinentry dialog should appear):

```bash
echo "test" | "/c/Program Files (x86)/GnuPG/bin/gpg.exe" --clearsign
```

#### Troubleshooting

**Problem**: `pinentry` command in Git Bash uses old version or not found

**Solution**: Git Bash's MinGW environment does not include modern pinentry. Use the Windows installation directly:

```bash
"/c/Program Files (x86)/GnuPG/bin/pinentry-basic.exe" --version
```

**Problem**: Git commit signing fails with "no pinentry"

**Solution**: Ensure Git is configured to use Windows GPG:

```bash
git config --global gpg.program "/c/Program Files (x86)/GnuPG/bin/gpg.exe"
```

**Problem**: Pinentry window appears behind other windows

**Solution**: This is a known Windows issue. The pinentry window may appear in the taskbar. Click on it to bring it to the foreground.

**Problem**: "gpg: signing failed: Inappropriate ioctl for device"

**Solution**: Set the GPG_TTY environment variable:

```bash
echo 'export GPG_TTY=$(tty)' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Path issues with spaces in "Program Files (x86)"

**Solution**: Always quote paths or escape spaces when referencing the pinentry executable:

```bash
# Using quotes
"/c/Program Files (x86)/GnuPG/bin/pinentry-basic.exe" --version

# Or escaping spaces
/c/Program\ Files\ \(x86\)/GnuPG/bin/pinentry-basic.exe --version
```

---

## Post-Installation Configuration

After installing pinentry on any platform, perform these configuration steps to ensure proper integration with GPG.

### Configure GPG Agent to Use Pinentry

Create or edit the GPG agent configuration file to specify your pinentry program:

**macOS:**

```bash
mkdir -p ~/.gnupg
echo "pinentry-program $(brew --prefix)/bin/pinentry-mac" > ~/.gnupg/gpg-agent.conf
```

**Linux (Ubuntu/Debian/Raspberry Pi/Amazon Linux):**

```bash
mkdir -p ~/.gnupg
echo "pinentry-program /usr/bin/pinentry-curses" > ~/.gnupg/gpg-agent.conf
```

For GUI environments, replace `pinentry-curses` with `pinentry-gnome3` or `pinentry-qt`.

**Windows:**

```powershell
echo pinentry-program "C:\Program Files (x86)\GnuPG\bin\pinentry-basic.exe" >> %APPDATA%\gnupg\gpg-agent.conf
```

### Restart GPG Agent

After changing the configuration, restart the GPG agent:

```bash
gpgconf --kill gpg-agent
```

The agent will automatically restart when needed.

### Set GPG_TTY Environment Variable

For terminal-based pinentry programs to work correctly, especially over SSH, set the `GPG_TTY` variable:

**Bash (Linux/macOS/Git Bash):**

```bash
echo 'export GPG_TTY=$(tty)' >> ~/.bashrc
source ~/.bashrc
```

**Zsh (macOS default):**

```bash
echo 'export GPG_TTY=$(tty)' >> ~/.zshrc
source ~/.zshrc
```

### Configure Passphrase Caching

To reduce the frequency of passphrase prompts, configure the GPG agent cache timeout:

```bash
cat >> ~/.gnupg/gpg-agent.conf << 'EOF'
default-cache-ttl 3600
max-cache-ttl 86400
EOF
gpgconf --kill gpg-agent
```

This caches your passphrase for 1 hour (3600 seconds), with a maximum of 24 hours (86400 seconds).

### Enable Keychain Integration (macOS)

On macOS, pinentry-mac can store passphrases in the macOS Keychain. To enable this feature, check "Save in Keychain" when the pinentry dialog appears, or add to `~/.gnupg/gpg-agent.conf`:

```bash
allow-preset-passphrase
```

---

## Common Issues

### Issue: "No pinentry" Error

**Symptoms**: `gpg: problem with the agent: No pinentry`

**Solutions**:

- Install pinentry for your platform:

  ```bash
  # macOS
  brew install --quiet pinentry-mac

  # Ubuntu/Debian/Raspberry Pi
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses

  # Amazon Linux 2023
  sudo dnf install -y pinentry

  # Amazon Linux 2
  sudo yum install -y pinentry
  ```

- Configure GPG agent to use the correct pinentry:

  ```bash
  mkdir -p ~/.gnupg
  echo "pinentry-program /path/to/pinentry" > ~/.gnupg/gpg-agent.conf
  gpgconf --kill gpg-agent
  ```

### Issue: "Inappropriate ioctl for device"

**Symptoms**: `gpg: signing failed: Inappropriate ioctl for device`

**Solutions**:

- Set the GPG_TTY environment variable:

  ```bash
  export GPG_TTY=$(tty)
  ```

- Add to your shell profile (`~/.bashrc`, `~/.zshrc`):

  ```bash
  echo 'export GPG_TTY=$(tty)' >> ~/.bashrc
  ```

### Issue: Passphrase Dialog Not Appearing

**Symptoms**: GPG hangs waiting for passphrase, or fails immediately

**Solutions**:

- **macOS**: Ensure pinentry-mac is installed and configured:

  ```bash
  brew install --quiet pinentry-mac
  echo "pinentry-program $(brew --prefix)/bin/pinentry-mac" > ~/.gnupg/gpg-agent.conf
  gpgconf --kill gpg-agent
  ```

- **Linux**: Ensure appropriate pinentry is installed:

  ```bash
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses
  ```

- Restart the GPG agent:

  ```bash
  gpgconf --kill gpg-agent
  ```

### Issue: Pinentry Dialog Appears Behind Other Windows

**Symptoms**: Pinentry prompt is hidden behind other application windows

**Solutions**:

- **Windows**: Check the taskbar for the pinentry window and click to bring it forward
- **Linux (GNOME)**: Use pinentry-gnome3 which integrates better with the window manager
- **macOS**: pinentry-mac should raise to the foreground; restart the GPG agent if this fails

### Issue: Pinentry Hangs Over SSH

**Symptoms**: GPG operations hang when connected via SSH

**Solutions**:

- Use `pinentry-curses` or `pinentry-tty` (not GUI versions)
- Ensure `GPG_TTY` is set:

  ```bash
  export GPG_TTY=$(tty)
  ```

- Verify SSH is allocating a TTY (use `ssh -t` if needed)

### Issue: Multiple Pinentry Programs Installed

**Symptoms**: Wrong pinentry program is used, or inconsistent behavior

**Solutions**:

- **Debian/Ubuntu**: Use `update-alternatives` to set the default:

  ```bash
  sudo update-alternatives --config pinentry
  ```

- Explicitly configure pinentry in `~/.gnupg/gpg-agent.conf`:

  ```bash
  pinentry-program /usr/bin/pinentry-curses
  ```

---

## References

- [GnuPG Pinentry Official Page](https://www.gnupg.org/related_software/pinentry/index.html)
- [GnuPG Official Documentation](https://gnupg.org/documentation/)
- [Homebrew pinentry-mac Formula](https://formulae.brew.sh/formula/pinentry-mac)
- [Debian Pinentry Package Information](https://packages.debian.org/source/stable/pinentry)
- [Ubuntu Pinentry Package](https://launchpad.net/ubuntu/+source/pinentry)
- [Chocolatey GnuPG Package](https://community.chocolatey.org/packages/gnupg)
- [winget GnuPG Package](https://winget.run/pkg/GnuPG/GnuPG)
- [GitHub: Signing Git Commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
- [GPG Pinentry GitHub Repository](https://github.com/gpg/pinentry)
