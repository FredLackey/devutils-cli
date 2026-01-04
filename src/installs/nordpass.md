# Installing NordPass

## Overview

NordPass is a password manager developed by Nord Security, the company behind NordVPN. It provides secure storage for passwords, credit card information, secure notes, and other sensitive data. NordPass uses XChaCha20 encryption (a modern, highly secure encryption algorithm) and operates on a zero-knowledge architecture, meaning only you can access your vault contents.

Key features include:
- **Password generation** - Create strong, unique passwords
- **Autofill and autosave** - Automatically fill login forms and save new credentials
- **Data breach scanner** - Check if your credentials have been exposed in known breaches
- **Password health checker** - Identify weak, reused, or old passwords
- **Cross-platform sync** - Access your vault from any device
- **Browser extensions** - Direct integration with major browsers

**Important Platform Notes**:
- Nord Security provides official desktop applications for **macOS**, **Windows**, and **Linux** (x86_64/amd64 only)
- **Raspberry Pi OS and Amazon Linux** do not have native NordPass desktop applications due to ARM architecture limitations (Raspberry Pi) and lack of Snap/Flatpak support (Amazon Linux)
- For unsupported platforms, the NordPass **browser extension** or **web vault** (https://app.nordpass.com) can be used as alternatives

## Prerequisites

Before installing NordPass on any platform, ensure:

1. **NordPass account** - A free or paid NordPass account is required (create at https://nordpass.com)
2. **Internet connectivity** - Required for sync, authentication, and updates
3. **Administrative privileges** - Required for installation on most platforms
4. **64-bit operating system** - NordPass requires a 64-bit system on all platforms

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager installed
- Apple Silicon (M1/M2/M3/M4) or Intel processor
- At least 200 MB free disk space

If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install NordPass:

```bash
brew install --cask --quiet nordpass
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts. The `--cask` flag specifies this is a macOS application (GUI app) rather than a command-line tool.

After installation, launch NordPass:

```bash
open -a NordPass
```

#### Verification

Confirm the installation succeeded by checking the application exists:

```bash
ls /Applications/NordPass.app
```

Expected output:

```
/Applications/NordPass.app
```

Alternatively, launch the application to verify it opens correctly:

```bash
open -a NordPass
```

#### Troubleshooting

**Problem**: Installation fails with "Cask 'nordpass' is unavailable"

**Solution**: Update Homebrew to get the latest cask definitions:

```bash
brew update
brew install --cask --quiet nordpass
```

**Problem**: App shows "NordPass can't be opened because Apple cannot check it for malicious software"

**Solution**: This can occur on first launch. Right-click the app in Applications and select "Open", then click "Open" in the dialog. Alternatively, clear the quarantine flag:

```bash
xattr -cr /Applications/NordPass.app
```

**Problem**: `brew: command not found`

**Solution**: Homebrew is not installed or not in PATH. For Apple Silicon Macs, add Homebrew to your PATH:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For Intel Macs:

```bash
eval "$(/usr/local/bin/brew shellenv)"
```

**Problem**: NordPass browser extension not connecting to desktop app

**Solution**: Ensure both the desktop app and browser extension are installed. Restart the browser after installing the desktop app. The extension should automatically detect the desktop app.

---

### Ubuntu/Debian (Snap)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 or later (64-bit x86_64/amd64)
- snapd service installed and running (pre-installed on Ubuntu 16.04+)
- sudo privileges
- Active internet connection

**Important**: NordPass for Linux is officially distributed via Snap. The Snap package is maintained by NordPass and provides automatic updates. Do not use unofficial .deb packages.

#### Installation Steps

**Step 1: Ensure snapd is installed**

On Ubuntu 16.04 and later, snapd is pre-installed. On Debian or other distributions, install it first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
```

After installing snapd, log out and log back in, or restart your system to ensure snap paths are updated correctly.

**Step 2: Install NordPass**

```bash
sudo snap install nordpass
```

The snap package handles all dependencies automatically and will auto-update in the background.

#### Verification

Confirm the installation succeeded:

```bash
snap list nordpass
```

Expected output (version may vary):

```
Name      Version  Rev   Tracking       Publisher    Notes
nordpass  5.25.19  xxx   latest/stable  nordsec**    -
```

Launch NordPass:

```bash
nordpass &
```

Or find "NordPass" in your application menu.

#### Troubleshooting

**Problem**: `snap: command not found`

**Solution**: Install snapd:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
```

Then log out and log back in, or reboot.

**Problem**: "error: cannot communicate with server"

**Solution**: The snapd service may not be running. Start and enable it:

```bash
sudo systemctl enable --now snapd.socket
sudo systemctl enable --now snapd.service
```

**Problem**: NordPass window does not appear

**Solution**: Snap applications may have issues with certain display servers. Try running with explicit display settings:

```bash
DISPLAY=:0 nordpass &
```

**Problem**: Cannot find NordPass in application menu

**Solution**: The snap bin directory may not be in PATH. Add it to your shell configuration:

```bash
echo 'export PATH=$PATH:/snap/bin' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: "Architecture not supported" error

**Solution**: NordPass Snap only supports amd64 (x86_64) architecture. Check your architecture:

```bash
uname -m
```

If it shows `aarch64` or `armv7l`, your system uses ARM architecture which is not supported. Use the NordPass browser extension instead.

---

### Raspberry Pi OS (Browser Extension)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 3B+ or later recommended
- Web browser installed (Chromium comes pre-installed)
- Active internet connection

**Important**: NordPass does **not** provide a native desktop application for ARM architecture (Raspberry Pi). The NordPass Snap package only supports amd64 (x86_64) processors. For Raspberry Pi users, the recommended solution is to use the NordPass browser extension or web vault.

Verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM
- `armv7l` = 32-bit ARM

Neither architecture is supported by the NordPass desktop application.

#### Installation Steps

**Install the NordPass browser extension in Chromium:**

Chromium is pre-installed on Raspberry Pi OS. Launch it and install the NordPass extension:

```bash
chromium-browser https://chrome.google.com/webstore/detail/nordpass-password-manager/fooolghllnmhmmndgjiamiiodkpenpbb &
```

Click "Add to Chrome" and confirm the installation.

**Alternative: Use the NordPass Web Vault**

Access NordPass directly through the web vault without any installation:

```bash
chromium-browser https://app.nordpass.com &
```

The web vault provides full access to your passwords and secure items without requiring a desktop application.

**Alternative: Install Firefox and use the Firefox extension**

If you prefer Firefox:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y firefox-esr
firefox-esr https://addons.mozilla.org/en-US/firefox/addon/nordpass-password-manager-b2b/ &
```

#### Verification

Verify the browser extension is installed by checking the browser toolbar for the NordPass icon (a green/dark shield logo).

Test the web vault access:

```bash
chromium-browser https://app.nordpass.com &
```

You should be able to log in and access your vault.

#### Troubleshooting

**Problem**: Browser extension not syncing or slow

**Solution**: Raspberry Pi has limited resources. Close other applications and browser tabs:

```bash
# Check memory usage
free -h
```

If memory is low, consider using a swap file or using the lightweight web vault instead of the full extension.

**Problem**: Cannot install extensions in Chromium

**Solution**: Ensure you are using the latest version of Chromium:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y chromium-browser
```

**Problem**: Web vault loads slowly

**Solution**: The web interface may be resource-intensive for Raspberry Pi. Try using Firefox ESR which may perform better on low-resource systems:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y firefox-esr
firefox-esr https://app.nordpass.com &
```

---

### Amazon Linux (Browser Extension / Web Vault)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- Desktop environment installed (if using graphical browser)
- sudo privileges

**Important**: NordPass does not provide a native desktop application for Amazon Linux. Amazon Linux does not natively support Snap or Flatpak, which are the primary distribution methods for NordPass on Linux. For Amazon Linux environments, use the NordPass web vault or browser extension.

#### Installation Steps

**For Desktop Environments with Browser:**

If you have a graphical desktop environment, install a browser and use the NordPass web vault or browser extension:

```bash
# Install Firefox on Amazon Linux 2023
sudo dnf install -y firefox

# Or on Amazon Linux 2
sudo amazon-linux-extras install -y firefox
```

Then access the web vault:

```bash
firefox https://app.nordpass.com &
```

Or install the NordPass extension from:
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/nordpass-password-manager-b2b/
- Chrome: https://chrome.google.com/webstore/detail/nordpass-password-manager/fooolghllnmhmmndgjiamiiodkpenpbb

**For Headless Server Environments:**

On headless servers (most Amazon Linux use cases), you cannot use NordPass directly. Consider these alternatives:

1. **Use the NordPass web vault** from a workstation with browser access
2. **Export passwords** to a secure local password store for server use
3. **Use AWS Secrets Manager** or **AWS Parameter Store** for server-side credential management (recommended for automation)

**Alternative: Install Snap (Experimental)**

Snap can be installed on Amazon Linux with additional configuration, but this is not officially supported:

```bash
# For Amazon Linux 2023 - Experimental, not officially supported
sudo dnf install -y epel-release
sudo dnf install -y snapd
sudo systemctl enable --now snapd.socket
sudo ln -s /var/lib/snapd/snap /snap

# Log out and log back in, then:
sudo snap install nordpass
```

**Warning**: This approach is experimental and may not work reliably on all Amazon Linux configurations.

#### Verification

For browser-based access, verify the web vault loads:

```bash
firefox https://app.nordpass.com &
```

Log in with your NordPass credentials to confirm access.

#### Troubleshooting

**Problem**: Firefox not available in package manager

**Solution**: On Amazon Linux 2, use amazon-linux-extras:

```bash
sudo amazon-linux-extras install -y firefox
```

On Amazon Linux 2023:

```bash
sudo dnf install -y firefox
```

**Problem**: No graphical display available

**Solution**: Amazon Linux is typically a server OS. For headless environments, access NordPass from a workstation with a browser, or use X11 forwarding:

```bash
# From your local machine, connect with X11 forwarding
ssh -X ec2-user@your-instance
firefox https://app.nordpass.com &
```

**Problem**: Snap installation fails

**Solution**: Snap on Amazon Linux is not officially supported. Use the web vault or browser extension method instead.

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or later, or Windows Server 2016 or later
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed
- Active internet connection

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install nordpass -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation. The installer uses silent installation arguments (`/S`) automatically.

After installation, NordPass will be available in the Start Menu.

#### Verification

Verify the installation:

```powershell
choco list nordpass
```

Expected output (version may vary):

```
Chocolatey v2.x.x
nordpass 5.9.25
1 packages installed.
```

Launch NordPass from the Start Menu, or via command line:

```powershell
start "" "C:\Program Files\NordPass\NordPass.exe"
```

#### Troubleshooting

**Problem**: Installation fails with "Checksum validation failed"

**Solution**: The package checksum may have changed. Try forcing reinstallation with checksum skip (use with caution):

```powershell
choco install nordpass -y --ignore-checksums
```

**Problem**: `choco: command not found`

**Solution**: Chocolatey is not installed or not in PATH. Close and reopen your terminal as Administrator, then verify:

```powershell
refreshenv
choco --version
```

If still not found, reinstall Chocolatey using the command in the Prerequisites section.

**Problem**: NordPass does not appear in Start Menu after installation

**Solution**: Refresh the Windows shell:

```powershell
refreshenv
```

Or restart Windows Explorer:

```powershell
Stop-Process -Name explorer -Force
Start-Process explorer
```

**Problem**: Browser extension not connecting to desktop app

**Solution**: Ensure both are installed. Restart your browser after installing the desktop app. If issues persist, reinstall the browser extension from the browser's extension store.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL
- WSLg (Windows 11) for GUI support, or X server configured (Windows 10)

**Recommended Approach**: Install NordPass on Windows (see Windows section) and access your passwords through the browser. The Windows app and browser extensions work seamlessly alongside WSL.

**Alternative Approach**: Install NordPass via Snap within WSL (requires WSL 2 with systemd and WSLg for GUI).

#### Installation Steps

**Option A: Use Windows NordPass Installation (Recommended)**

Install NordPass on Windows using Chocolatey (see Windows section), then access it from WSL:

1. Install NordPass on Windows
2. Use the NordPass browser extension in your Windows browser
3. For browser-based access from WSL, use `wslview`:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wslu
wslview https://app.nordpass.com
```

This opens the NordPass web vault in your default Windows browser.

**Option B: Install NordPass Snap in WSL (WSL 2 + WSLg)**

For WSL 2 on Windows 11 with WSLg, you can run Linux GUI applications natively.

First, enable systemd in WSL. Edit `/etc/wsl.conf`:

```bash
sudo tee /etc/wsl.conf > /dev/null << 'EOF'
[boot]
systemd=true
EOF
```

Restart WSL from PowerShell:

```powershell
wsl --shutdown
```

Reopen WSL and install snapd:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
sudo snap install nordpass
```

#### Verification

For Option A (web vault access):

```bash
wslview https://app.nordpass.com
```

This should open the NordPass web vault in your Windows browser.

For Option B (Snap installation):

```bash
snap list nordpass
```

Launch NordPass:

```bash
nordpass &
```

#### Troubleshooting

**Problem**: GUI applications do not display

**Solution**: WSLg requires Windows 11. For Windows 10, install an X server like VcXsrv:

1. Install VcXsrv on Windows from https://sourceforge.net/projects/vcxsrv/
2. Launch XLaunch with "Multiple windows" and "Disable access control"
3. In WSL, set the display:

```bash
export DISPLAY=$(grep nameserver /etc/resolv.conf | awk '{print $2}'):0.0
```

**Problem**: systemctl commands fail in WSL

**Solution**: systemd may not be enabled. Edit `/etc/wsl.conf` as shown above and restart WSL with `wsl --shutdown`.

**Problem**: Snap installation fails or hangs

**Solution**: Snap may have issues in WSL. Use the Windows NordPass installation (Option A) or the web vault:

```bash
wslview https://app.nordpass.com
```

**Problem**: `wslview: command not found`

**Solution**: Install wslu utilities:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wslu
```

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or later
- Git Bash installed (comes with Git for Windows)
- NordPass installed on Windows (see Windows section)

**Note**: Git Bash on Windows runs within the Windows environment and inherits the Windows PATH. Once NordPass is installed on Windows, you can launch it from Git Bash. Git Bash itself cannot run the NordPass Linux application.

#### Installation Steps

Git Bash can execute Windows commands directly. Install NordPass using Chocolatey:

**Method 1: Use choco.exe directly from Git Bash**

Run Git Bash as Administrator, then:

```bash
choco.exe install nordpass -y
```

**Method 2: Use PowerShell from Git Bash**

```bash
powershell.exe -Command "choco install nordpass -y"
```

**Method 3: Use winget from Git Bash**

If you prefer winget over Chocolatey:

```bash
winget.exe install --id NordSecurity.NordPass --silent --accept-package-agreements --accept-source-agreements
```

After installation, close and reopen Git Bash for PATH updates to take effect.

#### Verification

Verify NordPass is installed:

```bash
choco.exe list nordpass
```

Or check if the executable exists:

```bash
ls "/c/Program Files/NordPass/NordPass.exe"
```

Launch NordPass from Git Bash:

```bash
start "" "/c/Program Files/NordPass/NordPass.exe"
```

Or open the web vault:

```bash
start https://app.nordpass.com
```

#### Troubleshooting

**Problem**: `choco.exe: command not found`

**Solution**: Chocolatey may not be in the Git Bash PATH. Use the full path:

```bash
/c/ProgramData/chocolatey/bin/choco.exe install nordpass -y
```

**Problem**: `start: command not found`

**Solution**: In Git Bash, use `cmd.exe` to run Windows commands:

```bash
cmd.exe /c start "" "C:\Program Files\NordPass\NordPass.exe"
```

**Problem**: Installation fails with permission errors

**Solution**: Git Bash must be run as Administrator for Chocolatey installations. Right-click Git Bash and select "Run as administrator", then retry the installation.

**Problem**: NordPass installed but cannot launch from Git Bash

**Solution**: Use the Windows `start` command through cmd:

```bash
cmd.exe /c start "" "C:\Program Files\NordPass\NordPass.exe"
```

Or access the web vault:

```bash
cmd.exe /c start https://app.nordpass.com
```

---

## Post-Installation Configuration

### First-Time Setup

After installing and launching NordPass on any platform:

1. **Sign in or create account** - Log in with your NordPass account or create a new one
2. **Set master password** - Create a strong master password (this is the only password you need to remember)
3. **Install browser extension** - NordPass prompts you to install the browser extension for autofill functionality
4. **Import existing passwords** - Import from browsers, CSV files, or other password managers via Settings > Import

### Browser Extension Installation

For the best experience, install the NordPass browser extension:

- **Chrome/Chromium**: https://chrome.google.com/webstore/detail/nordpass-password-manager/fooolghllnmhmmndgjiamiiodkpenpbb
- **Firefox**: https://addons.mozilla.org/en-US/firefox/addon/nordpass-password-manager-b2b/
- **Edge**: https://microsoftedge.microsoft.com/addons/detail/nordpass-password-manage/njgnlkhcjgmjfnfahjgppcefghdkflml
- **Safari**: Available in the Mac App Store
- **Brave/Opera**: Use the Chrome Web Store link

The browser extension can work **with or without** the desktop application. The standalone extension provides full functionality.

### Enabling Autofill

To enable autofill in the browser extension:

1. Click the NordPass extension icon in your browser
2. Log in to your account
3. Navigate to Settings > Autofill
4. Enable "Autofill passwords" and "Autosave passwords"

### Configuring Two-Factor Authentication

For enhanced security, enable 2FA on your NordPass account:

1. Log in to NordPass
2. Go to Settings > Security
3. Enable Two-Factor Authentication
4. Choose your 2FA method (authenticator app recommended)

---

## Common Issues

### Issue: Cannot Connect to NordPass Servers

**Symptoms**: Login fails, sync does not work, or "Unable to connect" errors appear.

**Solutions**:

1. Check your internet connection
2. Verify NordPass services are operational (check https://nordpass.com/status/ if available)
3. Check if a firewall or proxy is blocking the connection
4. Try accessing https://app.nordpass.com in a browser to isolate the issue
5. Restart the NordPass application

### Issue: Browser Extension Not Detecting Desktop App

**Symptoms**: The browser extension shows "Desktop app not found" or autofill does not work.

**Solutions**:

1. Ensure the desktop app is running
2. Restart your browser after installing the desktop app
3. Reinstall the browser extension
4. Check that both the extension and app are logged into the same account

### Issue: Passwords Not Syncing Across Devices

**Symptoms**: Passwords saved on one device do not appear on another.

**Solutions**:

1. Ensure you are logged into the same NordPass account on all devices
2. Check internet connectivity on both devices
3. Force sync: Go to Settings > Sync and trigger a manual sync
4. Log out and log back in to refresh the vault

### Issue: Master Password Forgotten

**Symptoms**: Cannot access the vault due to forgotten master password.

**Solutions**:

1. Use the NordPass recovery key if you set one up during account creation
2. Contact NordPass support at https://support.nordpass.com/
3. **Note**: Due to zero-knowledge architecture, NordPass cannot recover your master password. If you have no recovery key, vault data may be lost.

### Issue: High CPU or Memory Usage

**Symptoms**: NordPass consumes excessive system resources.

**Solutions**:

On Linux:
```bash
# Restart NordPass
snap restart nordpass
```

On macOS:
```bash
killall NordPass
open -a NordPass
```

On Windows:
```powershell
taskkill /IM NordPass.exe /F
start "" "C:\Program Files\NordPass\NordPass.exe"
```

### Issue: Import Fails or Data Missing After Import

**Symptoms**: Importing passwords from CSV or other sources fails or results in missing data.

**Solutions**:

1. Ensure the CSV format matches NordPass requirements (check the import template)
2. For Flatpak installations on Linux, there may be sandbox restrictions affecting file access
3. Try importing via the web vault at https://app.nordpass.com instead
4. Export/import one password manager at a time to identify compatibility issues

---

## References

- [NordPass Official Website](https://nordpass.com/)
- [NordPass Download Page](https://nordpass.com/download/)
- [NordPass for macOS](https://nordpass.com/download/macos/)
- [NordPass for Windows](https://nordpass.com/download/windows/)
- [NordPass for Linux](https://nordpass.com/download/linux/)
- [NordPass Support Center](https://support.nordpass.com/)
- [Installing NordPass on macOS (Official Guide)](https://support.nordpass.com/hc/en-us/articles/40177058357265-Installing-NordPass-desktop-application-on-macOS)
- [Installing NordPass on Windows (Official Guide)](https://support.nordpass.com/hc/en-us/articles/360004799257-Installing-NordPass-desktop-application-on-Windows)
- [Installing NordPass on Linux (Official Guide)](https://support.nordpass.com/hc/en-us/articles/40176839614225-Installing-NordPass-desktop-application-on-Linux)
- [NordPass Homebrew Cask](https://formulae.brew.sh/cask/nordpass)
- [NordPass Chocolatey Package](https://community.chocolatey.org/packages/nordpass)
- [NordPass Snap Package](https://snapcraft.io/nordpass)
- [NordPass Flatpak Package](https://flathub.org/apps/com.nordpass.NordPass)
- [NordPass Chrome Extension](https://chrome.google.com/webstore/detail/nordpass-password-manager/fooolghllnmhmmndgjiamiiodkpenpbb)
- [NordPass Firefox Extension](https://addons.mozilla.org/en-US/firefox/addon/nordpass-password-manager-b2b/)
- [NordPass Web Vault](https://app.nordpass.com/)
- [NordPass Standalone Extension FAQ](https://support.nordpass.com/hc/en-us/articles/18185360038289-NordPass-standalone-extension-FAQ)
