# Installing GPG (GnuPG)

## Overview

GnuPG (GNU Privacy Guard), commonly known as GPG, is a free and open-source implementation of the OpenPGP standard (RFC 4880). It enables you to encrypt and sign your data and communications, providing cryptographic privacy and authentication.

GPG enables developers to:

- Sign Git commits and tags to verify authorship
- Encrypt sensitive files and communications
- Verify the integrity and authenticity of downloaded software
- Manage cryptographic keys for secure communications
- Authenticate to remote services using GPG keys

GnuPG is an essential tool for secure software development workflows, particularly for signing Git commits (a requirement for many open-source projects and enterprise environments).

This guide documents GPG installation procedures for all platforms supported by DevUtils CLI.

## Prerequisites

Before installing GPG on any platform, ensure:

1. **Internet connectivity** - Required to download GPG packages
2. **Administrative privileges** - Required for system-wide installation
3. **Terminal access** - Required to run installation commands

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma or later recommended)
- Homebrew package manager installed
- Command line access via Terminal.app or iTerm2

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following commands to install GnuPG and pinentry-mac (for GUI passphrase dialogs):

```bash
brew install --quiet gnupg
brew install --quiet pinentry-mac
```

The `--quiet` flag suppresses non-essential output, making the installation suitable for automation and scripts.

**Configure pinentry-mac for passphrase dialogs:**

Create the GnuPG configuration directory and configure the GPG agent to use pinentry-mac:

```bash
mkdir -p ~/.gnupg
chmod 700 ~/.gnupg
echo "pinentry-program $(brew --prefix)/bin/pinentry-mac" >> ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

This configuration enables a native macOS dialog for entering GPG passphrases, which is required for signing Git commits.

#### Verification

Confirm the installation succeeded:

```bash
gpg --version
```

Expected output (version numbers may vary):

```
gpg (GnuPG) 2.4.9
libgcrypt 1.10.3
...
```

Verify pinentry-mac is configured:

```bash
cat ~/.gnupg/gpg-agent.conf
```

Expected output should include:

```
pinentry-program /opt/homebrew/bin/pinentry-mac
```

(On Intel Macs, the path will be `/usr/local/bin/pinentry-mac`)

#### Troubleshooting

**Problem**: `gpg --version` shows an older version after installation

**Solution**: The system may have a different GPG in PATH. Ensure Homebrew's bin directory is first in your PATH:

```bash
echo 'export PATH="$(brew --prefix)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Problem**: `brew: command not found`

**Solution**: Homebrew is not installed or not in PATH. Install Homebrew first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Problem**: Passphrase prompt does not appear when signing commits

**Solution**: The GPG agent may not be using pinentry-mac. Verify the configuration and restart the agent:

```bash
echo "pinentry-program $(brew --prefix)/bin/pinentry-mac" > ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

**Problem**: "No pinentry" error when generating keys

**Solution**: Install and configure pinentry-mac as shown above, then restart the GPG agent.

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

GnuPG is included in the default Ubuntu and Debian repositories and may already be installed on most systems.

#### Installation Steps

Run the following commands to update package lists and install GnuPG:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnupg
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures no interactive prompts appear during installation, making this suitable for scripts and automation.

**Note**: On modern Debian/Ubuntu systems (Debian 12+, Ubuntu 22.04+), the `gnupg` package installs GnuPG version 2.x. The `gpg` command automatically uses version 2.

#### Verification

Confirm the installation succeeded:

```bash
gpg --version
```

Expected output (version numbers may vary):

```
gpg (GnuPG) 2.2.40
libgcrypt 1.10.1
...
```

Verify the installation location:

```bash
which gpg
```

Expected output:

```
/usr/bin/gpg
```

#### Troubleshooting

**Problem**: `E: Unable to locate package gnupg`

**Solution**: Update your package lists:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Old version of GPG installed

**Solution**: On Ubuntu, you can use the official GnuPG repository for newer versions. However, the default repository version is sufficient for most use cases including Git commit signing.

**Problem**: "No pinentry" error when generating keys

**Solution**: Install a pinentry package appropriate for your environment:

```bash
# For GUI environments
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-gnome3

# For terminal/server environments
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses
```

**Problem**: `gpg-agent` errors

**Solution**: Restart the GPG agent:

```bash
gpgconf --kill gpg-agent
gpg-agent --daemon
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye recommended)
- Raspberry Pi 3B+ or later (any model supported by Raspberry Pi OS)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so GPG installation follows the Debian/APT method. GPG works on both 32-bit (armhf) and 64-bit (arm64) architectures.

#### Installation Steps

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM
- `armv7l` = 32-bit ARM

Install GnuPG using APT:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnupg
```

The installation command is identical for both 32-bit and 64-bit Raspberry Pi OS.

**For headless/server installations**, install pinentry-curses for terminal-based passphrase entry:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses
```

#### Verification

Confirm the installation succeeded:

```bash
gpg --version
```

Expected output (version numbers may vary):

```
gpg (GnuPG) 2.2.40
libgcrypt 1.10.1
...
```

Verify the installation location:

```bash
which gpg
```

Expected output:

```
/usr/bin/gpg
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
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnupg
```

**Problem**: Key generation hangs (waiting for entropy)

**Solution**: On headless Raspberry Pi systems, the entropy pool may be low. Install `haveged` to improve entropy generation:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y haveged
sudo systemctl enable haveged
sudo systemctl start haveged
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- EC2 instance or compatible environment

Amazon Linux 2023 uses DNF as the default package manager. Amazon Linux 2 uses YUM.

**Important**: Amazon Linux 2023 ships with `gnupg2-minimal` by default, which provides only basic GPG functionality for package signature verification. For full GPG functionality (including key server access and Git commit signing), you need `gnupg2-full`.

#### Installation Steps

**For Amazon Linux 2023 (AL2023):**

Replace the minimal package with the full package:

```bash
sudo dnf swap -y gnupg2-minimal gnupg2-full
```

The `dnf swap` command removes `gnupg2-minimal` and installs `gnupg2-full` in a single transaction, handling the package conflict automatically.

**For Amazon Linux 2 (AL2):**

```bash
sudo yum install -y gnupg2
```

The `-y` flag automatically confirms installation, enabling non-interactive execution.

#### Verification

Confirm the installation succeeded:

```bash
gpg --version
```

Expected output (version numbers may vary):

```
gpg (GnuPG) 2.3.8
libgcrypt 1.10.1
...
```

Verify the installation location:

```bash
which gpg
```

Expected output:

```
/usr/bin/gpg
```

**For Amazon Linux 2023**, verify you have the full package:

```bash
rpm -q gnupg2-full
```

Expected output:

```
gnupg2-full-2.3.8-1.amzn2023.0.4.x86_64
```

#### Troubleshooting

**Problem**: `keyserver receive failed: No dirmngr` on AL2023

**Solution**: You have the minimal package installed. Install the full package:

```bash
sudo dnf swap -y gnupg2-minimal gnupg2-full
```

**Problem**: `package gnupg2-minimal conflicts with gnupg2` error

**Solution**: Use `dnf swap` instead of `dnf install` to handle the conflict:

```bash
sudo dnf swap -y gnupg2-minimal gnupg2-full
```

**Problem**: `No match for argument: gnupg2` on Amazon Linux 2

**Solution**: Update the yum cache and retry:

```bash
sudo yum makecache
sudo yum install -y gnupg2
```

**Problem**: Permission denied errors

**Solution**: Ensure you are using sudo:

```bash
sudo dnf swap -y gnupg2-minimal gnupg2-full
```

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 version 1903 or higher (64-bit), or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey or winget package manager installed

**Recommended**: Use winget (built into Windows 10 1809+ and Windows 11). If winget is unavailable, use Chocolatey.

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

#### Verification

Open a new Command Prompt or PowerShell window, then run:

```powershell
gpg --version
```

Expected output (version numbers may vary):

```
gpg (GnuPG) 2.4.5
libgcrypt 1.10.3
...
```

Verify the installation location:

```powershell
where gpg
```

Expected output:

```
C:\Program Files (x86)\GnuPG\bin\gpg.exe
```

#### Troubleshooting

**Problem**: `gpg: command not found` or `'gpg' is not recognized`

**Solution**: Close and reopen your terminal window. If the problem persists, add GPG to your PATH manually:

```powershell
$env:PATH += ";C:\Program Files (x86)\GnuPG\bin"
```

To make this permanent, add the path via System Properties > Environment Variables, or run in Administrator PowerShell:

```powershell
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Program Files (x86)\GnuPG\bin", [EnvironmentVariableTarget]::Machine)
```

**Problem**: winget installation fails

**Solution**: Fall back to Chocolatey:

```powershell
choco install gnupg -y
```

**Problem**: Passphrase dialog does not appear

**Solution**: GnuPG on Windows includes a graphical pinentry. Ensure the gpg-agent is running:

```powershell
gpg-connect-agent /bye
```

**Problem**: Chocolatey installation fails

**Solution**: Ensure you are running PowerShell as Administrator. Right-click PowerShell and select "Run as administrator".

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

WSL runs Ubuntu (or another Linux distribution) within Windows. GPG must be installed separately within WSL, as it does not share binaries with Windows GPG.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnupg
```

**Optional**: For GUI passphrase dialogs when using WSL with a graphical environment, install pinentry-gnome3:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-gnome3
```

For terminal-only WSL usage, pinentry-curses is sufficient (included with gnupg).

#### Verification

Confirm the installation succeeded:

```bash
gpg --version
```

Expected output (version numbers may vary):

```
gpg (GnuPG) 2.2.40
libgcrypt 1.10.1
...
```

Verify the installation location:

```bash
which gpg
```

Expected output:

```
/usr/bin/gpg
```

#### Troubleshooting

**Problem**: GPG version differs between WSL and Windows

**Solution**: This is expected behavior. WSL and Windows maintain separate GPG installations. Use the appropriate GPG for each environment:

- Inside WSL terminal: Use Linux GPG (`/usr/bin/gpg`)
- In Windows PowerShell/CMD: Use Windows GPG (`C:\Program Files (x86)\GnuPG\bin\gpg.exe`)

**Problem**: Cannot share GPG keys between WSL and Windows

**Solution**: GPG keys are stored in different locations for each environment. You can export and import keys between environments:

```bash
# In WSL, export your key
gpg --export-secret-keys --armor your-key-id > private-key.asc

# In Windows PowerShell, import the key
gpg --import "\\wsl$\Ubuntu\home\username\private-key.asc"
```

**Problem**: "No pinentry" error in WSL

**Solution**: Ensure pinentry is installed and configured:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses
mkdir -p ~/.gnupg
echo "pinentry-program /usr/bin/pinentry-curses" > ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

**Problem**: Permission errors in WSL

**Solution**: Ensure you are using sudo for installation:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnupg
```

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- GPG installed on Windows (see Windows section)

**Note**: Git Bash on Windows does not include a usable GPG installation by default. Git for Windows ships with an older GPG 1.4.x in the MinGW environment, but this is insufficient for modern use cases like Git commit signing. You must install GPG on Windows separately.

#### Installation Steps

**Step 1: Install GPG on Windows**

First, install GPG on Windows using winget (run in Administrator PowerShell):

```powershell
winget install --id GnuPG.GnuPG --silent --accept-package-agreements --accept-source-agreements
```

Or using Chocolatey:

```powershell
choco install gnupg -y
```

**Step 2: Configure Git to use Windows GPG**

Open Git Bash and configure Git to use the Windows GPG installation instead of the bundled MinGW GPG:

```bash
git config --global gpg.program "/c/Program Files (x86)/GnuPG/bin/gpg.exe"
```

This tells Git to use the Windows GPG for all signing operations.

**Step 3: Close and reopen Git Bash**

Close all Git Bash windows and open a new one to ensure environment changes take effect.

#### Verification

In Git Bash, confirm GPG is accessible via the configured path:

```bash
"/c/Program Files (x86)/GnuPG/bin/gpg.exe" --version
```

Expected output (version numbers may vary):

```
gpg (GnuPG) 2.4.5
libgcrypt 1.10.3
...
```

Verify Git is configured to use Windows GPG:

```bash
git config --global gpg.program
```

Expected output:

```
/c/Program Files (x86)/GnuPG/bin/gpg.exe
```

#### Troubleshooting

**Problem**: `gpg` command in Git Bash uses old version

**Solution**: Git Bash's built-in GPG is old and limited. Configure Git to use Windows GPG:

```bash
git config --global gpg.program "/c/Program Files (x86)/GnuPG/bin/gpg.exe"
```

You can also create an alias to use Windows GPG directly:

```bash
echo 'alias gpg="/c/Program\ Files\ \(x86\)/GnuPG/bin/gpg.exe"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Git commit signing fails with "secret key not available"

**Solution**: Keys must be imported into Windows GPG, not the Git Bash MinGW GPG. Use the Windows GPG to generate or import keys:

```bash
"/c/Program Files (x86)/GnuPG/bin/gpg.exe" --list-secret-keys
```

If no keys are listed, generate one:

```bash
"/c/Program Files (x86)/GnuPG/bin/gpg.exe" --full-generate-key
```

**Problem**: GPG passphrase prompt does not appear

**Solution**: Windows GPG uses a graphical pinentry that may not work correctly from Git Bash in some configurations. Ensure the GPG agent is running:

```bash
"/c/Program Files (x86)/GnuPG/bin/gpg-connect-agent.exe" /bye
```

**Problem**: "gpg: signing failed: Inappropriate ioctl for device"

**Solution**: This occurs when GPG cannot open a TTY for passphrase entry. Set the GPG_TTY environment variable:

```bash
echo 'export GPG_TTY=$(tty)' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Path issues with spaces in "Program Files (x86)"

**Solution**: Always quote paths or escape spaces when referencing the GPG executable:

```bash
# Using quotes
"/c/Program Files (x86)/GnuPG/bin/gpg.exe" --version

# Or escaping spaces
/c/Program\ Files\ \(x86\)/GnuPG/bin/gpg.exe --version
```

---

## Post-Installation Configuration

After installing GPG on any platform, configure it for Git commit signing (the most common developer use case).

### Generate a GPG Key

Generate a new GPG key pair:

```bash
gpg --full-generate-key
```

When prompted:

1. Select key type: Choose `(1) RSA and RSA` or `(9) ECC and ECC` (recommended)
2. For ECC, select `(1) Curve 25519`
3. Key validity: Choose `2y` (2 years) or `0` (no expiration)
4. Enter your name and email (use the same email as your Git commits)
5. Set a strong passphrase

### List Your GPG Keys

View your secret keys:

```bash
gpg --list-secret-keys --keyid-format=long
```

Example output:

```
sec   ed25519/ABC123DEF456GH78 2024-01-15 [SC] [expires: 2026-01-15]
      1234567890ABCDEF1234567890ABCDEF12345678
uid                 [ultimate] Your Name <your.email@example.com>
ssb   cv25519/XYZ789ABC123DE45 2024-01-15 [E] [expires: 2026-01-15]
```

The key ID is the string after `ed25519/` or `rsa4096/` (e.g., `ABC123DEF456GH78`).

### Configure Git to Sign Commits

Tell Git which GPG key to use:

```bash
git config --global user.signingkey ABC123DEF456GH78
```

Enable automatic commit signing:

```bash
git config --global commit.gpgsign true
```

Enable automatic tag signing:

```bash
git config --global tag.gpgsign true
```

### Export Your Public Key for GitHub/GitLab

Export your public key in ASCII-armored format:

```bash
gpg --armor --export ABC123DEF456GH78
```

Copy the entire output (including `-----BEGIN PGP PUBLIC KEY BLOCK-----` and `-----END PGP PUBLIC KEY BLOCK-----`) and add it to your GitHub/GitLab account settings under GPG keys.

### Configure GPG Agent Caching

To avoid entering your passphrase repeatedly, configure the GPG agent cache timeout. Create or edit `~/.gnupg/gpg-agent.conf`:

```bash
mkdir -p ~/.gnupg
cat >> ~/.gnupg/gpg-agent.conf << 'EOF'
default-cache-ttl 3600
max-cache-ttl 86400
EOF
gpgconf --kill gpg-agent
```

This caches your passphrase for 1 hour (3600 seconds), with a maximum of 24 hours (86400 seconds).

---

## Common Issues

### Issue: "No secret key" When Signing Commits

**Symptoms**: `gpg: signing failed: No secret key`

**Solutions**:

- Verify your key exists:

  ```bash
  gpg --list-secret-keys --keyid-format=long
  ```

- Ensure Git is configured with the correct key ID:

  ```bash
  git config --global user.signingkey YOUR_KEY_ID
  ```

- On Windows Git Bash, ensure Git uses Windows GPG:

  ```bash
  git config --global gpg.program "/c/Program Files (x86)/GnuPG/bin/gpg.exe"
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

### Issue: Passphrase Prompt Not Appearing

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

### Issue: "No pinentry" Error

**Symptoms**: `gpg: problem with the agent: No pinentry`

**Solutions**:

- Install pinentry for your platform:

  ```bash
  # macOS
  brew install --quiet pinentry-mac

  # Ubuntu/Debian/Raspberry Pi
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pinentry-curses
  ```

- Configure gpg-agent to use the correct pinentry:

  ```bash
  mkdir -p ~/.gnupg
  echo "pinentry-program /path/to/pinentry" > ~/.gnupg/gpg-agent.conf
  gpgconf --kill gpg-agent
  ```

### Issue: Key Generation Hangs

**Symptoms**: Key generation never completes, appears frozen

**Solutions**:

- This usually indicates insufficient entropy. Generate activity on the system (move mouse, type, disk activity).

- On headless systems, install `haveged`:

  ```bash
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y haveged
  sudo systemctl enable haveged
  sudo systemctl start haveged
  ```

### Issue: Cannot Import Keys from Another System

**Symptoms**: Imported keys are not usable for signing

**Solutions**:

- Export and import both public and secret keys:

  ```bash
  # On source system
  gpg --export-secret-keys --armor KEY_ID > private.asc
  gpg --export --armor KEY_ID > public.asc

  # On destination system
  gpg --import public.asc
  gpg --import private.asc
  ```

- Trust the imported key:

  ```bash
  gpg --edit-key KEY_ID trust quit
  # Select trust level 5 (ultimate) for your own key
  ```

---

## References

- [GnuPG Official Website](https://gnupg.org/)
- [GnuPG Official Documentation](https://gnupg.org/documentation/)
- [GnuPG Download Page](https://gnupg.org/download/)
- [GitHub: Signing Commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
- [GitLab: Signing Commits with GPG](https://docs.gitlab.com/ee/user/project/repository/signed_commits/gpg.html)
- [Homebrew GnuPG Formula](https://formulae.brew.sh/formula/gnupg)
- [Chocolatey GnuPG Package](https://community.chocolatey.org/packages/gnupg)
- [winget GnuPG Package](https://winget.run/pkg/GnuPG/GnuPG)
- [AWS Documentation: GnuPG on Amazon Linux 2023](https://docs.aws.amazon.com/linux/al2023/ug/gnupg-minimal.html)
- [Debian Wiki: GnuPG](https://wiki.debian.org/GnuPG)
