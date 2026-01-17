# Installing Comet Browser

## Overview

Comet Browser is an AI-native web browser developed by Perplexity AI. Built on the Chromium engine, Comet integrates advanced AI capabilities directly into the browsing experience, transforming passive web navigation into active cognition. Key features include a built-in AI assistant powered by GPT-4o, Claude, and Perplexity Sonar models; agentic search capabilities that can complete complex tasks like reservations, shopping, and meeting planning; smart tab organization; multilingual content translation; and a built-in ad blocker. Comet supports Chrome extensions and maintains full compatibility with Chromium-based web standards.

**Important**: Comet Browser is currently available only on macOS and Windows. Linux support (including Ubuntu, Raspberry Pi OS, Amazon Linux, and WSL) is not yet available. Perplexity has indicated that Linux and mobile support are planned for future releases, but no confirmed release dates have been announced. This documentation covers the supported platforms and provides guidance for unsupported platforms.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `Homebrew` - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None (Homebrew cask handles Comet installation directly)

### Ubuntu/Debian (APT)
- **Required:** Not supported on this platform. Comet Browser does not provide Linux builds.
- **Alternative:** Use the Perplexity AI web interface at https://www.perplexity.ai in any browser.

### Raspberry Pi OS (APT)
- **Required:** Not supported on this platform. Comet Browser does not provide ARM Linux builds.
- **Alternative:** Use the Perplexity AI web interface at https://www.perplexity.ai in Chromium browser.

### Amazon Linux (DNF/YUM)
- **Required:** Not supported on this platform. Comet Browser does not provide Linux builds.
- **Alternative:** Use the Perplexity AI web interface at https://www.perplexity.ai in any browser.

### Windows (winget)
- **Required:**
  - `winget` - Included in Windows 10 version 2004+ and Windows 11
  - Administrator privileges may be required for system-wide installation
- **Optional:** None
- **Auto-installed:** None (Comet installer handles all dependencies)

### WSL (Ubuntu)
- **Required:** Not supported. Comet Browser requires native Windows or macOS. For WSL users, install Comet on the Windows host and access it from Windows.
- **Alternative:** Install Comet on Windows (see Windows section) and use from Windows desktop.

### Git Bash (Windows)
- **Required:**
  - Comet Browser installed on Windows host (see Windows section)
  - `PowerShell` access for installation
- **Optional:** None
- **Auto-installed:** None

## Prerequisites

Before installing Comet Browser, ensure:

1. **Internet connectivity** - Required to download the browser package (approximately 200 MB)
2. **Perplexity account** - Required for full AI functionality (can create during first launch)
3. **Sufficient disk space** - Comet requires approximately 500 MB of disk space
4. **Minimum RAM** - 4 GB RAM required; 16 GB recommended for optimal AI performance
5. **64-bit operating system** - Required on all supported platforms

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 12 (Monterey) or later
- Both Apple Silicon (M1/M2/M3) and Intel processors are supported
- Homebrew package manager installed
- Terminal access

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Comet Browser:

```bash
brew install --cask --quiet comet
```

The `--cask` flag specifies a graphical application (as opposed to a command-line tool), and `--quiet` suppresses non-essential output, making the command suitable for automation scripts.

After installation, Comet will be available in the Applications folder. Launch it from the command line:

```bash
open -a "Comet"
```

#### Verification

Confirm the installation succeeded:

```bash
ls /Applications/Comet.app && echo "Comet Browser installed successfully"
```

Verify the installed version:

```bash
/Applications/Comet.app/Contents/MacOS/Comet --version
```

Expected output (version numbers may vary):

```
Comet 143.2.7499.37648
```

#### Troubleshooting

**Problem**: `brew: command not found`

**Solution**: Homebrew is not in your PATH. Add it:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For a permanent fix, add the above line to your `~/.zshrc` or `~/.bash_profile`.

**Problem**: Comet fails to open after installation

**Solution**: macOS Gatekeeper may block the application. Go to System Settings > Privacy & Security, and click "Open Anyway" next to the Comet message. Alternatively, remove the quarantine attribute:

```bash
xattr -cr /Applications/Comet.app
```

**Problem**: Installation fails with "Cask 'comet' is already installed"

**Solution**: Reinstall the cask:

```bash
brew reinstall --cask comet
```

**Problem**: "Comet" is not recognized after install

**Solution**: The application name in the cask may differ slightly. Check the Applications folder:

```bash
ls /Applications | grep -i comet
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 or later
- sudo privileges

**Critical Limitation**: Comet Browser does NOT support Linux. Perplexity has not released Linux builds for Comet Browser. This limitation applies to all Linux distributions, including Ubuntu, Debian, and their derivatives.

#### Installation Steps

**Comet Browser cannot be installed on Ubuntu/Debian.**

**Alternative: Use Perplexity AI Web Interface**

Access Perplexity AI's features through your existing web browser:

```bash
# Install a Chromium-based browser if needed
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y chromium-browser

# Open Perplexity AI
chromium-browser https://www.perplexity.ai &
```

The web interface at https://www.perplexity.ai provides many of the same AI search and assistant capabilities as Comet Browser.

#### Verification

Verify access to Perplexity AI web interface:

```bash
curl -sI https://www.perplexity.ai | head -1
```

Expected output:

```
HTTP/2 200
```

#### Troubleshooting

**Problem**: Want to use Comet Browser features on Linux

**Solution**: Perplexity AI's core functionality is available through the web interface at https://www.perplexity.ai. While the browser-specific features like tab management and agentic tasks are not available, the AI search and assistant capabilities work in any modern browser.

**Problem**: Need browser-integrated AI on Linux

**Solution**: Consider alternative AI-integrated browsers that support Linux, such as:
- Brave Browser with Leo AI (`sudo apt-get install -y brave-browser`)
- Arc Browser (if Linux support is added)
- Browser extensions for AI assistants in Chrome/Firefox

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 3 or later
- sudo privileges

**Critical Limitation**: Comet Browser does NOT support ARM architecture or Linux. Perplexity only provides builds for x86/x64 Windows and macOS (both Intel and Apple Silicon). This means Comet Browser cannot be installed on any Raspberry Pi device.

#### Installation Steps

**Comet Browser cannot be installed on Raspberry Pi OS.**

**Alternative: Use Perplexity AI Web Interface**

Access Perplexity AI's features through Chromium:

```bash
# Update packages
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y

# Install Chromium (optimized for ARM)
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y chromium-browser

# Open Perplexity AI
chromium-browser https://www.perplexity.ai &
```

**Note**: On newer Raspberry Pi OS versions, the package may be named `chromium`:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y chromium
chromium https://www.perplexity.ai &
```

#### Verification

Verify Chromium installation and Perplexity AI access:

```bash
chromium-browser --version 2>/dev/null || chromium --version
curl -sI https://www.perplexity.ai | head -1
```

#### Troubleshooting

**Problem**: Why can't I install Comet Browser?

**Solution**: Perplexity does not provide ARM Linux builds of Comet Browser. The only way to access Perplexity AI features on Raspberry Pi is through the web interface.

**Problem**: Web interface is slow on Raspberry Pi

**Solution**: Raspberry Pi has limited resources. Launch Chromium with performance flags:

```bash
chromium-browser --disable-gpu --disable-software-rasterizer https://www.perplexity.ai &
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 or RHEL 8+
- sudo privileges
- Desktop environment (if attempting alternatives)

**Critical Limitation**: Comet Browser does NOT support Linux. Amazon Linux, RHEL, Fedora, Rocky Linux, and AlmaLinux are all unsupported platforms.

#### Installation Steps

**Comet Browser cannot be installed on Amazon Linux or RHEL-based distributions.**

**Alternative: Use Perplexity AI Web Interface**

For Amazon Linux instances with a desktop environment, access Perplexity AI through a browser:

```bash
# Install Firefox (if not present)
sudo dnf install -y firefox

# Open Perplexity AI (requires desktop environment)
firefox https://www.perplexity.ai &
```

For headless server environments, use Perplexity AI's API directly for programmatic access.

#### Verification

Verify Firefox installation:

```bash
firefox --version
```

#### Troubleshooting

**Problem**: Amazon Linux is typically a server OS without a GUI

**Solution**: Amazon Linux is designed for server workloads. If you need Comet Browser's AI capabilities:

1. Use the Perplexity AI API for programmatic access
2. Access https://www.perplexity.ai from a separate desktop machine
3. Install a desktop environment on Amazon Linux (not recommended for production servers)

**Problem**: Need AI-powered browsing for testing/automation

**Solution**: For automated web testing with AI capabilities, consider using:
- Perplexity API integration in your test scripts
- Headless Chrome/Chromium with Selenium or Playwright
- Other AI APIs (OpenAI, Anthropic) integrated with your automation framework

---

### Windows (winget)

#### Prerequisites

- Windows 10 version 1809 or later, or Windows 11
- winget package manager (included in Windows 10 2004+ and Windows 11)
- Administrator PowerShell or Command Prompt (for system-wide installation)

**Note**: Chocolatey does not currently have a Comet Browser package. Use winget for installation.

#### Installation Steps

Run the following command in PowerShell or Command Prompt:

```powershell
winget install --id Perplexity.Comet --silent --accept-package-agreements --accept-source-agreements
```

The `--silent` flag suppresses the installer UI, and the `--accept-*` flags prevent license agreement prompts, enabling fully non-interactive installation.

For system-wide installation (all users), run as Administrator:

```powershell
winget install --id Perplexity.Comet --silent --scope machine --accept-package-agreements --accept-source-agreements
```

**Alternative: Direct Installer Download**

For environments without winget, download and run the installer directly:

```powershell
# Download the installer
Invoke-WebRequest -Uri "https://browser-download.perplexity.ai/windows-installers/6/comet_installer_latest.exe" -OutFile "$env:TEMP\comet_installer.exe"

# Run silent installation
Start-Process -FilePath "$env:TEMP\comet_installer.exe" -ArgumentList "--install --silent" -Wait

# Clean up
Remove-Item "$env:TEMP\comet_installer.exe"
```

#### Verification

Open a new PowerShell or Command Prompt window, then verify the installation:

```powershell
# Check if Comet is in the Start Menu
Get-StartApps | Where-Object { $_.Name -like "*Comet*" }
```

Or verify by checking common installation paths:

```powershell
# Check user installation
Test-Path "$env:LOCALAPPDATA\Comet\Comet.exe"

# Check system installation
Test-Path "C:\Program Files\Comet\Comet.exe"
```

Launch Comet:

```powershell
Start-Process "Comet"
```

#### Troubleshooting

**Problem**: `winget: The term 'winget' is not recognized`

**Solution**: winget may not be installed or updated. Install or update the App Installer package:

```powershell
# Open Microsoft Store to App Installer page
Start-Process "ms-windows-store://pdp/?ProductId=9NBLGGH4NNS1"
```

After installation, close and reopen PowerShell.

**Problem**: Installation fails with "No applicable installer found"

**Solution**: Update winget to the latest version:

```powershell
winget upgrade --id Microsoft.AppInstaller --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: Comet auto-starts with Windows and you want to disable it

**Solution**: Disable Comet from startup:

```powershell
# Open Task Manager Startup tab
Start-Process "taskmgr" -ArgumentList "/7"
```

Find Comet in the list and disable it. Alternatively, use Autoruns from Sysinternals for more control.

**Problem**: Installation requires Administrator but user lacks permissions

**Solution**: Use per-user installation (no Administrator required):

```powershell
winget install --id Perplexity.Comet --silent --scope user --accept-package-agreements --accept-source-agreements
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 with Ubuntu distribution installed
- Comet Browser installed on Windows host

**Critical Limitation**: Comet Browser does not support Linux, including WSL. Since WSL runs a Linux environment, you cannot install Comet Browser directly within WSL.

#### Installation Steps

**Install Comet Browser on the Windows host, not within WSL.**

**Step 1: Install Comet on Windows**

Open a Windows PowerShell (not WSL terminal) and run:

```powershell
winget install --id Perplexity.Comet --silent --accept-package-agreements --accept-source-agreements
```

**Step 2: Access from Windows Desktop**

After installation, launch Comet from the Windows Start Menu or desktop. WSL does not provide direct integration with Windows GUI applications like Comet Browser.

**Alternative: Access Perplexity AI within WSL**

For command-line access to AI capabilities within WSL, use the Perplexity web interface through a text-based approach or use the Perplexity API:

```bash
# Install curl if needed
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl

# Test connectivity to Perplexity
curl -sI https://www.perplexity.ai | head -1
```

#### Verification

Verify Comet is installed on Windows (from Windows PowerShell):

```powershell
Get-StartApps | Where-Object { $_.Name -like "*Comet*" }
```

#### Troubleshooting

**Problem**: Want to use Comet features from within WSL

**Solution**: Comet Browser is a Windows GUI application. You have these options:

1. Use Comet on Windows alongside your WSL development environment
2. Access https://www.perplexity.ai from a browser within WSLg (if available)
3. Use Perplexity API for programmatic access from WSL

**Problem**: WSLg shows Windows apps but Comet does not appear

**Solution**: WSLg only shows Linux GUI applications running in WSL. Windows applications like Comet must be launched from Windows, not from within WSL.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11
- Git Bash installed (comes with Git for Windows)
- Comet Browser installed on Windows (see Windows section)

**Important**: Git Bash runs within the Windows environment and does not have its own application installation mechanism. Comet Browser must be installed on Windows using winget or the direct installer.

#### Installation Steps

**Step 1: Install Comet on Windows**

From Git Bash, invoke PowerShell to run the installation:

```bash
powershell.exe -Command "winget install --id Perplexity.Comet --silent --accept-package-agreements --accept-source-agreements"
```

**Step 2: Verify Installation Path**

After installation, locate the Comet executable:

```bash
# Check user installation
ls "$LOCALAPPDATA/Comet/Comet.exe" 2>/dev/null && echo "Found in user directory"

# Check common system paths
ls "/c/Program Files/Comet/Comet.exe" 2>/dev/null && echo "Found in Program Files"
ls "/c/Program Files (x86)/Comet/Comet.exe" 2>/dev/null && echo "Found in Program Files (x86)"
```

**Step 3: Create Alias for Convenience**

Add an alias to your `~/.bashrc` for easy access:

```bash
# Find where Comet is installed and add alias
if [ -f "$LOCALAPPDATA/Comet/Comet.exe" ]; then
    echo 'alias comet="$LOCALAPPDATA/Comet/Comet.exe"' >> ~/.bashrc
elif [ -f "/c/Program Files/Comet/Comet.exe" ]; then
    echo 'alias comet="/c/Program\ Files/Comet/Comet.exe"' >> ~/.bashrc
fi

# Reload bash configuration
source ~/.bashrc
```

#### Verification

Verify Comet is accessible from Git Bash:

```bash
# Using PowerShell to check
powershell.exe -Command "Get-StartApps | Where-Object { \$_.Name -like '*Comet*' }"
```

Launch Comet from Git Bash (after setting up alias):

```bash
comet &
```

Or launch directly:

```bash
start "" "Comet"
```

#### Troubleshooting

**Problem**: PowerShell command fails from Git Bash

**Solution**: Ensure PowerShell is accessible. Git Bash should have access to Windows executables by default:

```bash
which powershell.exe
```

If not found, add Windows System32 to your PATH in `~/.bashrc`:

```bash
export PATH="$PATH:/c/Windows/System32/WindowsPowerShell/v1.0"
```

**Problem**: Comet alias does not work

**Solution**: Verify the installation path and update the alias accordingly:

```bash
# Find Comet installation
find /c -name "Comet.exe" 2>/dev/null | head -5
```

**Problem**: "the input device is not a TTY" error

**Solution**: Some Windows applications have TTY compatibility issues with mintty. Use the `winpty` prefix or launch via `start`:

```bash
start "" "Comet"
```

---

## Post-Installation Configuration

After installing Comet Browser on macOS or Windows, consider these configurations.

### Sign In to Perplexity Account

On first launch, Comet prompts you to sign in or create a Perplexity account. This enables:

- Cloud sync of preferences and history
- Access to Pro AI features (if subscribed)
- Personalized AI responses

### Import Browser Data

Comet can import data from other browsers on first launch:

1. Bookmarks and favorites
2. Browsing history
3. Saved passwords
4. Settings and preferences

Access this later via Comet's Settings menu.

### Configure AI Features

Customize Comet's AI behavior through Settings:

- **AI Model Selection**: Choose between available models (GPT-4o, Claude, Sonar)
- **Search Preferences**: Configure default search behavior
- **Privacy Settings**: Control data sharing with AI models

### Set as Default Browser

**macOS:**

```bash
open -a "Comet"
# Navigate to Settings > Default browser > Make default
```

**Windows:**

```powershell
start ms-settings:defaultapps
```

Navigate to Web browser and select Comet.

### Disable Telemetry (Optional)

During setup or in Settings, you can opt out of anonymous usage data collection.

---

## Common Issues

### Issue: Account Sign-in Popup on Every New Tab

**Symptoms**: Every new tab prompts you to sign in to your Perplexity account.

**Solution**: This is a known behavior in Comet. Sign in once to dismiss future prompts. If you prefer not to sign in, this popup will continue appearing but can be dismissed each time.

### Issue: High Memory Usage

**Symptoms**: Comet uses significant RAM, especially with many tabs open.

**Solutions**:

1. Close unused tabs
2. Disable unused AI features in Settings
3. Use tab grouping to manage memory more efficiently
4. Restart Comet periodically to clear memory

### Issue: Extensions Not Working

**Symptoms**: Chrome Web Store extensions fail to install or function.

**Solution**: Comet supports Chrome extensions. Install from the Chrome Web Store:

1. Navigate to `chrome.google.com/webstore`
2. Find your extension
3. Click "Add to Comet" (or similar)

If issues persist, check Comet's extension settings for compatibility options.

### Issue: AI Features Not Responding

**Symptoms**: AI assistant does not respond or shows errors.

**Solutions**:

1. Check internet connectivity
2. Verify Perplexity account status
3. Check if you have exceeded daily AI query limits (free tier: 5 Pro queries/day)
4. Try signing out and back in

### Issue: Comet Crashes on Startup

**Symptoms**: Comet opens briefly and immediately closes.

**Solutions**:

1. Clear the user profile cache:

**macOS:**
```bash
rm -rf ~/Library/Application\ Support/Comet/Default/Cache
rm -rf ~/Library/Application\ Support/Comet/Default/Code\ Cache
```

**Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Comet\User Data\Default\Cache"
```

2. Reinstall Comet if crashes persist.

### Issue: Sync Not Working Between Devices

**Symptoms**: Settings and data do not sync between macOS and Windows installations.

**Solution**: Ensure you are signed into the same Perplexity account on all devices. Sync functionality requires an active internet connection and may take a few minutes to propagate changes.

---

## References

- [Comet Browser Official Page](https://www.perplexity.ai/comet)
- [Comet Download Page](https://www.perplexity.ai/download-comet)
- [Perplexity Help Center - Getting Started with Comet](https://www.perplexity.ai/help-center/en/articles/11172798-getting-started-with-comet)
- [Perplexity Help Center - System Requirements](https://www.perplexity.ai/help-center/en/articles/11187553-system-requirements)
- [Homebrew Cask - comet](https://formulae.brew.sh/cask/comet)
- [winget Package - Perplexity.Comet](https://winstall.app/apps/Perplexity.Comet)
- [Perplexity AI Web Interface](https://www.perplexity.ai/)
- [Tom's Guide - Comet Browser Review](https://www.tomsguide.com/ai/perplexity/perplexitys-ai-browser-comet-is-now-free-for-everyone-heres-how-to-download-it)
