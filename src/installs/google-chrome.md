# Installing Google Chrome

## Overview

Google Chrome is a fast, secure, and free web browser built by Google. It is the most widely used web browser globally, known for its speed, simplicity, and robust developer tools. Chrome features automatic updates, built-in PDF viewer, password manager, translation capabilities, and extensive support for web standards. For developers, Chrome DevTools provides powerful debugging and performance analysis capabilities that make it an essential tool for web development.

**Important**: Google Chrome is a proprietary browser. If you need an open-source alternative, consider Chromium (the open-source project Chrome is built upon). However, Chromium lacks some features like automatic updates, proprietary media codecs (for services like Netflix), and certain Google integrations.

## Prerequisites

Before installing Google Chrome on any platform, ensure:

1. **Internet connectivity** - Required to download the browser package
2. **Administrative privileges** - Required on most platforms for system-wide installation
3. **Sufficient disk space** - Chrome requires approximately 500 MB of disk space
4. **64-bit operating system** - Modern Chrome versions require a 64-bit system (except for Windows, which still offers 32-bit builds)

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 12 (Monterey) or later
- Homebrew package manager installed
- Terminal access

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Google Chrome:

```bash
brew install --cask --quiet google-chrome
```

The `--cask` flag specifies a graphical application (as opposed to a command-line tool), and `--quiet` suppresses non-essential output, making the command suitable for automation scripts.

After installation, Chrome will be available in the Applications folder. Launch it from the command line:

```bash
open -a "Google Chrome"
```

#### Verification

Confirm the installation succeeded:

```bash
ls /Applications/Google\ Chrome.app && echo "Google Chrome installed successfully"
```

Verify the installed version:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version
```

Expected output (version numbers may vary):

```
Google Chrome 143.0.7499.170
```

#### Troubleshooting

**Problem**: `brew: command not found`

**Solution**: Homebrew is not in your PATH. Add it:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For a permanent fix, add the above line to your `~/.zshrc` or `~/.bash_profile`.

**Problem**: Chrome fails to open after installation

**Solution**: macOS Gatekeeper may block the application. Allow it by going to System Preferences > Security & Privacy > General, and click "Open Anyway" next to the Chrome message. Alternatively, remove the quarantine attribute:

```bash
xattr -cr /Applications/Google\ Chrome.app
```

**Problem**: Installation fails with "Cask 'google-chrome' is already installed"

**Solution**: Reinstall the cask:

```bash
brew reinstall --cask google-chrome
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 or later (64-bit only)
- sudo privileges
- wget or curl installed

**Important**: Google Chrome is not available in the default Ubuntu/Debian repositories. Use Google's official repository for installation and automatic updates.

#### Installation Steps

**Step 1: Download and install Chrome directly**

The simplest method is to download and install the .deb package directly:

```bash
wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ./google-chrome-stable_current_amd64.deb
rm google-chrome-stable_current_amd64.deb
```

This method automatically adds Google's repository to your system, enabling future updates through `apt-get upgrade`.

**Alternative: Set up the repository manually first**

If you prefer to set up the repository before installation:

```bash
# Install prerequisites
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget gnupg

# Add Google's GPG signing key
wget -qO - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor | sudo tee /etc/apt/keyrings/google-chrome.gpg > /dev/null

# Add the Chrome repository
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list > /dev/null

# Update and install
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y google-chrome-stable
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures the installation proceeds without prompts, making it suitable for automation scripts.

#### Verification

Confirm the installation succeeded:

```bash
google-chrome --version
```

Expected output (version numbers may vary):

```
Google Chrome 143.0.7499.170
```

Launch Chrome:

```bash
google-chrome &
```

#### Troubleshooting

**Problem**: `E: Unable to locate package google-chrome-stable`

**Solution**: The repository was not added correctly. Verify the configuration file exists:

```bash
cat /etc/apt/sources.list.d/google-chrome.list
```

If the file is empty or missing, repeat the installation steps.

**Problem**: GPG key error during apt-get update

**Solution**: Re-add the GPG key:

```bash
wget -qO - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor | sudo tee /etc/apt/keyrings/google-chrome.gpg > /dev/null
```

**Problem**: Chrome fails to start with "running as root without --no-sandbox"

**Solution**: Chrome cannot run as the root user without disabling the sandbox. Create a regular user account and run Chrome from there, or add the `--no-sandbox` flag (not recommended for security reasons):

```bash
google-chrome --no-sandbox
```

**Problem**: Missing dependencies error

**Solution**: Install the missing dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -f
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 3 or later recommended
- sudo privileges

**Critical Limitation**: Google Chrome does NOT support ARM architecture. Google only provides x86/x64 builds of Chrome, and Raspberry Pi uses ARM processors. This means Google Chrome cannot be installed natively on any Raspberry Pi device.

#### Installation Steps

**Use Chromium instead of Google Chrome.**

Chromium is the open-source browser that Chrome is built upon. It is included in the Raspberry Pi OS repositories with ARM-specific optimizations:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y chromium-browser
```

**Note**: On newer versions of Raspberry Pi OS, the package may be named `chromium` instead of `chromium-browser`:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y chromium
```

#### Verification

Confirm the installation succeeded:

```bash
chromium-browser --version 2>/dev/null || chromium --version
```

Expected output (version numbers may vary):

```
Chromium 120.0.6099.216 Built on Raspberry Pi OS/Debian
```

Launch Chromium:

```bash
chromium-browser 2>/dev/null || chromium &
```

#### Troubleshooting

**Problem**: Why can't I install actual Google Chrome?

**Solution**: Google does not provide ARM builds of Chrome for Linux. The only Chrome versions available for ARM are for Chrome OS (Chromebooks) and Android, neither of which is compatible with Raspberry Pi OS. Chromium is the recommended alternative and provides nearly identical functionality.

**Problem**: Chromium is slow or crashes

**Solution**: Raspberry Pi has limited resources. Launch with performance flags:

```bash
chromium-browser --disable-gpu --disable-software-rasterizer --memory-pressure-off
```

**Problem**: Video streaming services (Netflix, Hulu) do not work

**Solution**: Chromium does not include Widevine DRM by default on Raspberry Pi. Some services require proprietary DRM components that are not available. Consider using a dedicated streaming device for these services.

**Problem**: `chromium-browser: command not found`

**Solution**: The command name varies by Raspberry Pi OS version. Try `chromium` instead:

```bash
chromium --version
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) recommended
- Amazon Linux 2 (AL2) is supported but reached end of standard support on June 30, 2025
- sudo privileges
- x86_64 architecture (ARM/Graviton instances require alternative approaches)

**Important**: Google does not officially support Chrome on Amazon Linux. However, the Chrome RPM package installs successfully on Amazon Linux 2023 using DNF.

#### Installation Steps

**For Amazon Linux 2023:**

Install Google Chrome directly from Google's repository:

```bash
sudo dnf install -y https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
```

This command downloads and installs the Chrome RPM package along with all required dependencies.

**For Amazon Linux 2 (legacy):**

```bash
sudo yum install -y https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
```

**Note**: Amazon Linux 2 has reached end of standard support. Newer versions of Chrome may not be fully compatible. Migrate to Amazon Linux 2023 for continued support.

#### Verification

Confirm the installation succeeded:

```bash
google-chrome-stable --version
```

Expected output (version numbers may vary):

```
Google Chrome 143.0.7499.170
```

#### Troubleshooting

**Problem**: Missing dependencies when installing

**Solution**: Install common dependencies first:

```bash
sudo dnf install -y libXcomposite libXdamage libXrandr libgbm libxkbcommon pango alsa-lib atk at-spi2-atk cups-libs libdrm mesa-libgbm
```

Then retry the Chrome installation.

**Problem**: Chrome crashes with sandbox errors

**Solution**: On Amazon Linux, especially on EC2 instances, the sandbox may have issues. For headless/automated use, disable the sandbox (use only in trusted environments):

```bash
google-chrome-stable --no-sandbox --headless
```

**Problem**: Chrome fails to run on Graviton (ARM) instances

**Solution**: Google Chrome does not provide ARM Linux builds. On Graviton instances, you have two options:

1. Use a headless browser solution that supports ARM (e.g., Playwright with Chromium)
2. Use a remote Chrome instance on an x86_64 machine

**Problem**: Need to run headless Chrome for automation

**Solution**: Install a virtual framebuffer for headless operation:

```bash
sudo dnf install -y xorg-x11-server-Xvfb
xvfb-run google-chrome-stable --headless --dump-dom https://example.com
```

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 version 1809 or later, or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey or winget package manager installed

**Installing Chocolatey** (if not already installed):

Run this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**Note**: winget is included by default in Windows 10 (2004 and later) and Windows 11.

#### Installation Steps

**Using Chocolatey:**

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install googlechrome -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Using winget:**

Run the following command in PowerShell or Command Prompt:

```powershell
winget install --id Google.Chrome --silent --accept-package-agreements --accept-source-agreements
```

The `--silent` flag suppresses the installer UI, and the `--accept-*` flags prevent license agreement prompts.

For system-wide installation (all users), add the `--scope machine` flag:

```powershell
winget install --id Google.Chrome --silent --scope machine --accept-package-agreements --accept-source-agreements
```

**Note**: System-wide installation requires Administrator privileges.

#### Verification

Open a new Command Prompt or PowerShell window (required for PATH updates), then run:

```powershell
"C:\Program Files\Google\Chrome\Application\chrome.exe" --version
```

Expected output (version numbers may vary):

```
Google Chrome 143.0.7499.170
```

#### Troubleshooting

**Problem**: `choco: The term 'choco' is not recognized`

**Solution**: Close all terminal windows and open a new Administrator PowerShell. Chocolatey should be available after a fresh terminal session.

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click the application and select "Run as administrator".

**Problem**: winget shows "No applicable installer found"

**Solution**: Update winget to the latest version:

```powershell
winget upgrade --id Microsoft.AppInstaller --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: Chrome installs but does not appear in PATH

**Solution**: Chrome is not added to PATH by default on Windows. Use the full path to the executable, or add it to your PATH manually:

```powershell
$env:Path += ";C:\Program Files\Google\Chrome\Application"
```

For permanent PATH modification, add through System Properties > Environment Variables.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 with Ubuntu distribution installed
- WSLg enabled (included by default in Windows 11 and Windows 10 21H2+)
- sudo privileges within WSL

**Important**: Running GUI applications in WSL requires WSLg (Windows Subsystem for Linux GUI). WSL 1 does not support GUI applications.

To verify WSL version:

```bash
wsl --list --verbose
```

Ensure your Ubuntu distribution shows "VERSION 2".

#### Installation Steps

Install Google Chrome using the same method as Ubuntu:

```bash
wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ./google-chrome-stable_current_amd64.deb
rm google-chrome-stable_current_amd64.deb
```

#### Verification

Confirm the installation succeeded:

```bash
google-chrome --version
```

Expected output (version numbers may vary):

```
Google Chrome 143.0.7499.170
```

Launch Chrome (requires WSLg):

```bash
google-chrome &
```

#### Troubleshooting

**Problem**: "cannot open display" error

**Solution**: WSLg may not be properly configured. Ensure you are running WSL 2 and update WSL:

```powershell
# Run in Windows PowerShell (not WSL)
wsl --update
wsl --shutdown
```

Then reopen your WSL terminal.

**Problem**: Chrome crashes with sandbox errors

**Solution**: WSL has limitations with Linux security namespaces. Run Chrome with the sandbox disabled:

```bash
google-chrome --no-sandbox
```

**Warning**: Disabling the sandbox reduces security. Use only for development and testing, not for general browsing.

**Problem**: Extremely slow performance or high CPU usage

**Solution**: GUI applications in WSL have overhead. For automated testing, use headless mode:

```bash
google-chrome --headless --disable-gpu --dump-dom https://example.com
```

**Problem**: "Running as root without --no-sandbox is not supported"

**Solution**: Do not run Chrome as the root user. Switch to a regular user:

```bash
sudo -u $SUDO_USER google-chrome
```

Or create a new user if needed.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11
- Git Bash installed (comes with Git for Windows)
- Google Chrome installed on Windows (see Windows section above)

**Important**: Git Bash runs within the Windows environment and inherits the Windows PATH. There is no separate Chrome installation for Git Bash - you use the Chrome installed on Windows.

#### Installation Steps

Install Chrome on Windows using Chocolatey or winget (from PowerShell as Administrator), then access it from Git Bash.

**Step 1: Install Chrome on Windows**

From an Administrator PowerShell:

```powershell
choco install googlechrome -y
```

Or using winget:

```powershell
winget install --id Google.Chrome --silent --accept-package-agreements --accept-source-agreements
```

**Step 2: Access Chrome from Git Bash**

Chrome will be accessible in Git Bash after Windows installation. The executable is located at:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe"
```

Create an alias for convenience by adding to your `~/.bashrc`:

```bash
echo 'alias chrome="/c/Program\ Files/Google/Chrome/Application/chrome.exe"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Confirm Chrome is accessible from Git Bash:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --version
```

Expected output (version numbers may vary):

```
Google Chrome 143.0.7499.170
```

With the alias configured:

```bash
chrome --version
```

#### Troubleshooting

**Problem**: Chrome executable not found

**Solution**: Verify Chrome is installed on Windows. Check the installation path:

```bash
ls "/c/Program Files/Google/Chrome/Application/chrome.exe"
```

If Chrome is installed in a different location (user installation), check:

```bash
ls "$LOCALAPPDATA/Google/Chrome/Application/chrome.exe"
```

**Problem**: "the input device is not a TTY" error

**Solution**: Git Bash's mintty terminal has TTY compatibility issues with some Windows applications. Use the `winpty` prefix:

```bash
winpty "/c/Program Files/Google/Chrome/Application/chrome.exe"
```

**Problem**: Chrome opens but PATH-based command does not work

**Solution**: Add Chrome to your Git Bash PATH in `~/.bashrc`:

```bash
export PATH="$PATH:/c/Program Files/Google/Chrome/Application"
```

Then reload:

```bash
source ~/.bashrc
```

---

## Post-Installation Configuration

After installing Google Chrome on any platform, consider these optional configurations.

### Set Chrome as Default Browser

**macOS:**

```bash
open -a "Google Chrome"
# Then go to Chrome menu > Settings > Default browser > Make default
```

**Ubuntu/Debian:**

```bash
sudo update-alternatives --set x-www-browser /usr/bin/google-chrome-stable
sudo update-alternatives --set gnome-www-browser /usr/bin/google-chrome-stable
```

**Windows (via Settings UI):**

```powershell
start ms-settings:defaultapps
```

Navigate to Web browser and select Google Chrome.

### Configure for Headless Automation

For CI/CD pipelines and automated testing, use these flags:

```bash
google-chrome --headless --disable-gpu --no-sandbox --disable-dev-shm-usage
```

**Flag explanations:**
- `--headless`: Run without a GUI (new headless mode in Chrome 112+)
- `--disable-gpu`: Disable GPU hardware acceleration (required in many server environments)
- `--no-sandbox`: Disable the sandbox (use only in trusted/containerized environments)
- `--disable-dev-shm-usage`: Use /tmp instead of /dev/shm (prevents crashes in Docker containers)

### Set Up Custom User Data Directory

Store Chrome profiles in a custom location for isolated testing:

```bash
google-chrome --user-data-dir=/path/to/custom/profile
```

### Enable Developer Tools on Startup

Launch Chrome with DevTools automatically open:

```bash
google-chrome --auto-open-devtools-for-tabs
```

---

## Common Issues

### Issue: Chrome Does Not Auto-Update (Linux)

**Symptoms**: Chrome version remains old despite updates being available.

**Solutions**:

On Debian/Ubuntu, Chrome adds its repository automatically. Update with:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y google-chrome-stable
```

On Amazon Linux:

```bash
sudo dnf upgrade -y google-chrome-stable
```

### Issue: High Memory Usage

**Symptoms**: System becomes slow, Chrome uses excessive RAM.

**Solutions**:

1. Close unused tabs
2. Use Chrome's built-in Task Manager (Shift+Esc) to identify memory-heavy tabs/extensions
3. Disable or remove unused extensions
4. Launch with memory flags:

```bash
google-chrome --memory-pressure-off --max_old_space_size=2048
```

### Issue: Chrome Crashes on Startup

**Symptoms**: Chrome opens briefly and immediately closes, or shows "Aw, Snap!" errors.

**Solutions**:

1. Clear the user profile cache:

```bash
# Linux/macOS
rm -rf ~/.config/google-chrome/Default/Cache
rm -rf ~/.config/google-chrome/Default/Code\ Cache

# Windows (Git Bash)
rm -rf "$LOCALAPPDATA/Google/Chrome/User Data/Default/Cache"
```

2. Disable hardware acceleration:

```bash
google-chrome --disable-gpu
```

3. Reset Chrome to default settings (backup bookmarks first).

### Issue: Certificate Errors on Internal Sites

**Symptoms**: `NET::ERR_CERT_AUTHORITY_INVALID` errors on internal or self-signed certificates.

**Solutions**:

1. Import your organization's CA certificate to the system trust store
2. For development only, bypass certificate errors:

```bash
google-chrome --ignore-certificate-errors
```

**Warning**: Never use `--ignore-certificate-errors` for general browsing.

### Issue: PDF Files Download Instead of Opening

**Symptoms**: PDFs download automatically instead of opening in Chrome's built-in viewer.

**Solution**: Enable the PDF viewer in Chrome settings:

1. Navigate to `chrome://settings/content/pdfDocuments`
2. Select "Open PDFs in Chrome"

Or launch with:

```bash
google-chrome --enable-features=PdfViewerUpdate
```

---

## References

- [Google Chrome Official Download Page](https://www.google.com/chrome/)
- [Google Chrome Help Center](https://support.google.com/chrome/)
- [Google Chrome Enterprise Documentation](https://chromeenterprise.google/policies/)
- [Homebrew Cask - google-chrome](https://formulae.brew.sh/cask/google-chrome)
- [Chocolatey Package - googlechrome](https://community.chocolatey.org/packages/googlechrome)
- [winget Package - Google.Chrome](https://winget.run/pkg/Google/Chrome)
- [Chrome Command Line Switches](https://peter.sh/experiments/chromium-command-line-switches/)
- [Chrome for Testing (Headless Automation)](https://googlechromelabs.github.io/chrome-for-testing/)
- [Installing Chrome on Ubuntu](https://www.cherryservers.com/blog/install-chrome-ubuntu)
- [Chrome on Amazon Linux](https://medium.com/@davidkadlec/installing-google-chrome-on-amazon-linux-ec2-d1cb6aa37f28)
- [WSL GUI Apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/wsl/tutorials/gui-apps)
- [UbuntuUpdates - Google Chrome PPA](https://www.ubuntuupdates.org/ppa/google_chrome)
