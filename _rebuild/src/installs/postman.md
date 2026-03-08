# Installing Postman

## Overview

Postman is a collaboration platform for API development that simplifies each step of building and testing APIs. It provides a comprehensive environment for designing, testing, documenting, and monitoring APIs. Postman offers:

- **API Request Builder**: Create and send HTTP requests with various methods (GET, POST, PUT, DELETE, etc.)
- **Collections**: Organize and save API requests for reuse and sharing
- **Environment Variables**: Manage different configurations for development, staging, and production
- **Automated Testing**: Write tests in JavaScript to validate API responses
- **Documentation**: Generate API documentation automatically from collections
- **Mock Servers**: Create mock API endpoints for development and testing

Postman is available as a desktop application for macOS, Windows, and Linux, as well as a web application at go.postman.co. The desktop application provides the full feature set including local file access and the ability to work with localhost APIs without CORS restrictions.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `homebrew` - Package manager for macOS (Install via: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`)
- **Optional:** None
- **Auto-installed:** None (Homebrew manages all Postman dependencies internally via the cask)

### Ubuntu (APT/Snap)
- **Required:**
  - `snapd` - Snap package manager (Usually pre-installed on Ubuntu 16.04+, or install via: `sudo apt-get install -y snapd`)
- **Optional:** None
- **Auto-installed:**
  - All required libraries are bundled within the Snap package itself

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `wget` - Download tool for fetching the ARM64 tarball (Usually pre-installed, or install via: `sudo apt-get install -y wget`)
  - `tar` - Archive extraction tool (Usually pre-installed, or install via: `sudo apt-get install -y tar`)
- **Optional:**
  - `libgtk-3-0` - GTK+ 3 GUI library (Install via: `sudo apt-get install -y libgtk-3-0`)
  - `libnotify4` - Desktop notification library (Install via: `sudo apt-get install -y libnotify4`)
  - `libnss3` - Network Security Services library (Install via: `sudo apt-get install -y libnss3`)
  - `libxss1` - X11 Screen Saver extension library (Install via: `sudo apt-get install -y libxss1`)
  - `libxtst6` - X11 Testing library (Install via: `sudo apt-get install -y libxtst6`)
  - `xdg-utils` - Desktop integration utilities (Install via: `sudo apt-get install -y xdg-utils`)
  - `libatspi2.0-0` - Assistive Technology Service Provider Interface (Install via: `sudo apt-get install -y libatspi2.0-0`)
  - `libsecret-1-0` - Secret storage library (Install via: `sudo apt-get install -y libsecret-1-0`)
- **Auto-installed:** None
- **Note:** Optional dependencies may be required at runtime if shared library errors occur (installer will display these in troubleshooting output)

### Amazon Linux (DNF/YUM)
- **Required:** None
- **Optional:** None
- **Auto-installed:** None
- **Note:** Installation not supported - Postman is a GUI application and Amazon Linux typically runs headless without a display server

### Windows (Chocolatey/winget)
- **Required:**
  - `chocolatey` - Package manager for Windows (Install via Administrator PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`)
- **Optional:** None
- **Auto-installed:** All Postman dependencies are handled by Chocolatey during installation

### Git Bash (Manual/Portable)
- **Required:**
  - `chocolatey` - Package manager installed on Windows host (Install on Windows via Administrator PowerShell)
  - `powershell.exe` - PowerShell for executing Chocolatey commands (Pre-installed on Windows)
- **Optional:** None
- **Auto-installed:** All Postman dependencies are handled by Chocolatey on the Windows host

## Prerequisites

Before installing Postman on any platform, ensure:

1. **Internet connectivity** - Required to download Postman and for account features
2. **Administrative privileges** - Required for system-wide installation on most platforms
3. **Sufficient resources** - Minimum 4 GB RAM and 2 GB free disk space recommended
4. **Display** - Postman requires a graphical display environment

**Important**: Postman is an Electron-based application. Some platforms (particularly ARM-based Linux systems) have limited support.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager installed
- At least 4 GB RAM
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Postman:

```bash
brew install --quiet --cask postman
```

The `--quiet` flag suppresses non-essential output, and `--cask` specifies the graphical application version. This command installs Postman to your Applications folder automatically.

After installation, launch Postman from the Applications folder or via command line:

```bash
open -a Postman
```

**Note**: On first launch, Postman will prompt you to sign in or create an account. You can skip this and use Postman in "Lightweight API Client" mode, though some features require an account.

#### Verification

Confirm the installation succeeded by checking if the application exists:

```bash
ls -la /Applications/Postman.app
```

Expected output should show the Postman.app directory with recent modification dates.

Launch Postman to verify it opens correctly:

```bash
open -a Postman
```

The application should launch and display the main Postman interface.

#### Troubleshooting

**Problem**: `Error: Cask 'postman' is already installed`

**Solution**: If you need to reinstall, first uninstall then reinstall:

```bash
brew uninstall --cask postman
brew install --quiet --cask postman
```

**Problem**: Application does not launch or crashes immediately

**Solution**: Clear Postman's cache and try again:

```bash
rm -rf ~/Library/Application\ Support/Postman
rm -rf ~/Library/Caches/Postman
open -a Postman
```

**Problem**: "Postman cannot be opened because Apple cannot check it for malicious software"

**Solution**: Right-click the Postman application in Finder and select "Open" to bypass Gatekeeper, or allow it in System Preferences > Security & Privacy.

---

### Ubuntu/Debian (Snap)

#### Prerequisites

- Ubuntu 16.04 LTS or later, or Debian 10 (Buster) or later (64-bit)
- sudo privileges
- Snap package manager (pre-installed on Ubuntu 16.04+)
- X11 or Wayland display server for GUI

If snap is not installed (rare on modern Ubuntu):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
```

For Ubuntu 18.04, install an additional library required by Postman:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libgconf-2-4
```

#### Installation Steps

Run the following command to install Postman via Snap:

```bash
sudo snap install postman
```

Snap automatically handles all dependencies and bundles required libraries with the application. This is the installation method recommended by Postman.

After installation, launch Postman:

```bash
postman &
```

The ampersand (`&`) runs Postman in the background, freeing your terminal.

#### Verification

Confirm the installation succeeded:

```bash
snap list postman
```

Expected output shows Postman with version information:

```
Name     Version   Rev   Tracking       Publisher    Notes
postman  11.71.7   282   latest/stable  postman-inc  -
```

Verify Postman launches correctly:

```bash
postman &
```

The Postman window should appear within a few seconds.

#### Troubleshooting

**Problem**: `error: snap "postman" is not available on stable for this architecture`

**Solution**: This error typically occurs on 32-bit systems. Postman requires 64-bit architecture. Check your architecture:

```bash
uname -m
```

If output is `i686` or `i386`, you have a 32-bit system which is not supported. Use the Postman web application at https://go.postman.co instead.

**Problem**: Postman fails to launch with GPU/rendering errors

**Solution**: Disable GPU acceleration by launching with:

```bash
postman --disable-gpu &
```

To make this permanent, create a wrapper script or alias.

**Problem**: "cannot communicate with server: Post ... dial unix /run/snapd.socket"

**Solution**: The snap daemon is not running. Start it:

```bash
sudo systemctl start snapd
sudo systemctl enable snapd
```

**Problem**: Postman opens but shows blank window

**Solution**: This can occur with certain display configurations. Try:

```bash
postman --disable-gpu --no-sandbox &
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit strongly recommended) - Bookworm or later
- Raspberry Pi 4 or later with at least 4 GB RAM
- 64-bit operating system (aarch64/arm64 architecture)
- sudo privileges
- X11 display server for GUI

**Important Architecture Limitation**: Postman's native desktop application has limited official support for ARM64 Linux. While the Snap store lists Postman for ARM64, users have reported installation and runtime issues on Raspberry Pi hardware.

First, verify your architecture:

```bash
uname -m
```

Expected output for compatible systems: `aarch64`

If output is `armv7l`, you have a 32-bit system. The native Postman application does not support 32-bit ARM. Use the alternatives documented below.

#### Installation Steps

**Method: Manual Tarball Installation (ARM64)**

Download and extract Postman using the ARM64 tarball:

```bash
# Create installation directory
sudo mkdir -p /opt

# Download the latest ARM64 version
wget -q https://dl.pstmn.io/download/latest/linux_arm64 -O /tmp/postman-linux-arm64.tar.gz

# Extract to /opt
sudo tar -xzf /tmp/postman-linux-arm64.tar.gz -C /opt/

# Create symbolic link for command-line access
sudo ln -sf /opt/Postman/Postman /usr/local/bin/postman

# Clean up
rm /tmp/postman-linux-arm64.tar.gz
```

Create a desktop entry for the application launcher:

```bash
sudo tee /usr/share/applications/postman.desktop > /dev/null <<'EOF'
[Desktop Entry]
Encoding=UTF-8
Name=Postman
Exec=/opt/Postman/Postman %U
Icon=/opt/Postman/app/resources/app/assets/icon.png
Terminal=false
Type=Application
Categories=Development;
Comment=API Development Environment
EOF
```

#### Verification

Confirm the installation succeeded:

```bash
ls -la /opt/Postman/Postman
```

Expected output shows the Postman executable file.

Verify the symbolic link works:

```bash
which postman
```

Expected output: `/usr/local/bin/postman`

Launch Postman:

```bash
postman &
```

#### Troubleshooting

**Problem**: Download URL returns 404 or redirects to website

**Solution**: The ARM64 build may not be available for the latest version. Check the Postman downloads page for current ARM64 availability, or use Newman CLI as an alternative.

**Problem**: "error while loading shared libraries"

**Solution**: Install missing dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libsecret-1-0
```

**Problem**: Application crashes or fails to start on Raspberry Pi

**Solution**: Raspberry Pi ARM64 support is limited. Use one of these alternatives:

**Alternative 1 - Newman CLI** (Recommended for Raspberry Pi):

Newman is Postman's command-line collection runner. It works reliably on ARM64:

```bash
# Install Node.js if not present
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs npm

# Install Newman globally
sudo npm install -g newman
```

Use Newman to run Postman collections:

```bash
newman run your-collection.json
```

**Alternative 2 - Postman Web Application**:

Access Postman via web browser at https://go.postman.co. This provides most features without requiring native installation.

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023, Amazon Linux 2, RHEL 8, or later
- sudo privileges
- X11 display server for GUI (typically not available on server instances)
- At least 4 GB RAM

**Important**: Amazon Linux EC2 instances typically run headless (no GUI). Postman is a graphical application and requires a display. For headless environments, use Newman CLI instead.

For systems with a graphical desktop environment, proceed with the installation below.

#### Installation Steps

**For Amazon Linux 2023 / RHEL 8+ with GUI:**

Install Postman via Snap. First, install and configure snapd:

```bash
# Install EPEL repository (required for snapd)
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm

# Update package cache
sudo dnf update -y

# Install snapd
sudo dnf install -y snapd

# Enable and start snapd
sudo systemctl enable --now snapd.socket

# Create symbolic link for classic snap support
sudo ln -sf /var/lib/snapd/snap /snap
```

Log out and log back in, or start a new shell session for PATH changes to take effect.

Install Postman:

```bash
sudo snap install postman
```

**For Amazon Linux 2 with GUI:**

```bash
# Install EPEL repository
sudo yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm

# Update package cache
sudo yum update -y

# Install snapd
sudo yum install -y snapd

# Enable and start snapd
sudo systemctl enable --now snapd.socket

# Create symbolic link
sudo ln -sf /var/lib/snapd/snap /snap
```

Log out and log back in, then install Postman:

```bash
sudo snap install postman
```

**For Headless Servers (No GUI) - Newman CLI:**

If you need API testing capabilities on a headless Amazon Linux server, install Newman:

```bash
# For Amazon Linux 2023
sudo dnf install -y nodejs npm

# For Amazon Linux 2
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum install -y nodejs

# Install Newman
sudo npm install -g newman
```

#### Verification

For Snap installation, confirm it succeeded:

```bash
snap list postman
```

Expected output shows Postman with version information.

For Newman installation, verify:

```bash
newman --version
```

Expected output shows Newman version number.

#### Troubleshooting

**Problem**: `error: cannot communicate with server: Post ... dial unix /run/snapd.socket`

**Solution**: Start the snapd service:

```bash
sudo systemctl start snapd.socket
sudo systemctl start snapd.service
```

**Problem**: `error: snap "postman" not found`

**Solution**: Ensure snapd is properly installed and the snap store is accessible. Check connectivity:

```bash
snap find postman
```

**Problem**: Postman fails to launch with display errors

**Solution**: Postman requires a graphical display. For EC2 instances, either:
1. Connect via VNC/RDP to a GUI desktop session
2. Use X11 forwarding with SSH (`ssh -X`)
3. Use Newman CLI for headless API testing

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 version 21H2 or higher (64-bit), or Windows 11
- At least 4 GB RAM
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

**Note**: Postman v9.5 and later requires 64-bit Windows. Version 9.4 was the last to support 32-bit systems.

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install postman -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation. Chocolatey handles downloading, installation, and PATH configuration automatically.

After installation, Postman can be launched from the Start Menu or via command line:

```powershell
postman
```

**Note**: On first launch, Postman will prompt you to sign in or create an account. You can skip this for basic functionality.

#### Verification

Open a new Command Prompt or PowerShell window, then verify Postman is installed:

```powershell
choco list postman
```

Expected output shows Postman with version information:

```
postman 11.46.6
1 packages installed.
```

Launch Postman to verify it opens correctly:

```powershell
postman
```

The application should launch and display the main Postman interface.

#### Troubleshooting

**Problem**: `choco: command not found` or `'choco' is not recognized`

**Solution**: Chocolatey is not installed or not in PATH. Install Chocolatey first (see Prerequisites), then open a new terminal window.

**Problem**: Installation fails with permission errors

**Solution**: Run PowerShell as Administrator. Right-click PowerShell in the Start Menu and select "Run as administrator".

**Problem**: Postman fails to launch after installation

**Solution**: Restart your computer to ensure all components are properly registered, then try launching again.

**Problem**: Windows Defender blocks installation

**Solution**: Temporarily disable real-time protection during installation, or add Chocolatey and Postman to exclusions. Postman is a legitimate application and false positives can occur.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- WSLg enabled (Windows 11 or Windows 10 build 21364+) for GUI application support
- sudo privileges within WSL

**Note**: Running GUI applications in WSL requires WSLg (Windows Subsystem for Linux GUI). Without WSLg, you cannot run Postman's graphical interface in WSL.

To check if WSLg is available:

```bash
echo $DISPLAY
```

If this returns a value (e.g., `:0`), WSLg is configured.

#### Installation Steps

Install Postman via Snap within your WSL Ubuntu environment:

```bash
# Ensure snapd is installed and running
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd

# Install Postman
sudo snap install postman
```

After installation, launch Postman:

```bash
postman &
```

The Postman window should appear as a Windows application window (rendered through WSLg).

**Alternative without WSLg - Use Windows Postman:**

If WSLg is not available, install Postman on Windows (see Windows section) and access it from WSL via interop:

```bash
# Launch Windows Postman from WSL
/mnt/c/Users/*/AppData/Local/Postman/Postman.exe &
```

Or use Newman CLI for command-line API testing:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs npm
sudo npm install -g newman
```

#### Verification

Confirm the installation succeeded:

```bash
snap list postman
```

Expected output shows Postman with version information.

Test the GUI launches (requires WSLg):

```bash
postman &
```

A Postman window should appear within a few seconds.

#### Troubleshooting

**Problem**: "cannot open display" error

**Solution**: WSLg is not configured. Either:
1. Update Windows to a version that supports WSLg
2. Use the Windows native Postman installation
3. Use Newman CLI for headless testing

**Problem**: Snap installation fails with socket errors

**Solution**: The snap daemon may not start automatically in WSL. Start it manually:

```bash
sudo service snapd start
```

**Problem**: Postman starts but shows rendering errors or blank screen

**Solution**: Disable GPU acceleration:

```bash
postman --disable-gpu &
```

**Problem**: "The SUID sandbox helper binary was found" error

**Solution**: Run with the no-sandbox flag (less secure but works in WSL):

```bash
postman --no-sandbox &
```

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Postman installed on Windows via Chocolatey or direct download

**Note**: Git Bash on Windows does not require a separate Postman installation. Git Bash inherits the Windows PATH, so once Postman is installed on Windows, the application is accessible. However, Postman is a GUI application and is typically launched separately from the terminal.

#### Installation Steps

Install Postman on Windows using Chocolatey. Run this from an Administrator PowerShell or Command Prompt (not Git Bash):

```powershell
choco install postman -y
```

Alternatively, use the Postman Portable version for a self-contained installation:

1. Download Postman Portable from https://github.com/portapps/postman-portable/releases
2. Extract to a location of your choice (e.g., `C:\Tools\PostmanPortable`)
3. Run `postman-portable.exe`

For command-line API testing in Git Bash, install Newman:

```bash
npm install -g newman
```

#### Verification

From Git Bash, verify Newman is available (if installed):

```bash
newman --version
```

Expected output shows Newman version number.

To launch the Postman GUI application from Git Bash:

```bash
start postman
```

Or navigate to Postman directly:

```bash
"/c/Users/$USERNAME/AppData/Local/Postman/Postman.exe" &
```

#### Troubleshooting

**Problem**: `newman: command not found`

**Solution**: npm global binaries may not be in Git Bash PATH. Add npm global directory to PATH in your `~/.bashrc`:

```bash
echo 'export PATH="$PATH:$(npm config get prefix)/bin"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Cannot launch Postman GUI from Git Bash

**Solution**: Use the `start` command to launch Windows applications:

```bash
start postman
```

Or launch via Windows Explorer integration:

```bash
explorer.exe "C:\Users\$USERNAME\AppData\Local\Postman\Postman.exe"
```

**Problem**: Newman tests fail with SSL certificate errors

**Solution**: Run Newman with SSL verification disabled (for development only):

```bash
newman run collection.json --insecure
```

---

## Post-Installation Configuration

After installing Postman on any platform, consider these optional configurations.

### Creating a Postman Account

While Postman can be used without an account in "Lightweight API Client" mode, creating a free account enables:

- Cloud sync of collections and environments
- Collaboration features
- Access from multiple devices
- Postman web application access

Create an account at https://identity.getpostman.com/signup or through the application on first launch.

### Installing Newman for CI/CD

Newman is Postman's command-line collection runner, essential for integrating API tests into CI/CD pipelines. Install it on any platform with Node.js:

```bash
npm install -g newman
```

Run a collection:

```bash
newman run your-collection.json
```

With environment variables:

```bash
newman run your-collection.json -e environment.json
```

With HTML report output:

```bash
npm install -g newman-reporter-html
newman run your-collection.json -r html
```

### Configuring Proxy Settings

For corporate networks requiring a proxy, configure Postman's proxy settings:

1. Open Postman
2. Go to Settings (gear icon)
3. Select "Proxy" tab
4. Configure your proxy server details

### Exporting Collections for Version Control

To store API collections in version control:

1. In Postman, right-click a collection
2. Select "Export"
3. Choose format (Collection v2.1 recommended)
4. Save the JSON file to your repository

---

## Common Issues

### Issue: "Could not get any response"

**Symptoms**: Requests to localhost or internal APIs fail with "Could not get any response"

**Solutions**:

- Ensure the target service is running and accessible
- For localhost, verify the correct port is specified
- On macOS/Windows, ensure Docker networks are accessible if targeting containers
- Disable SSL certificate verification in Settings for self-signed certificates (development only)

### Issue: CORS Errors in Web Application

**Symptoms**: Requests work in desktop app but fail in web app with CORS errors

**Solutions**:

- Install and enable the Postman Desktop Agent for the web application
- Use the desktop application instead of the web app for local development
- Configure your API server to allow CORS from Postman origins

### Issue: High Memory Usage

**Symptoms**: Postman consumes excessive RAM, system becomes slow

**Solutions**:

- Close unused tabs and collections
- Disable the "Interceptor" if not in use
- Clear response history: Settings > Data > Clear history
- Restart Postman periodically during long sessions

### Issue: SSL Certificate Errors

**Symptoms**: "SSL Certificate Problem" or "Unable to verify certificate"

**Solutions**:

- For self-signed certificates: Settings > General > Disable "SSL certificate verification"
- Add your CA certificate: Settings > Certificates > Add CA Certificate
- For client certificates: Settings > Certificates > Add Client Certificate

### Issue: Postman Won't Start After Update

**Symptoms**: Application crashes or hangs on startup after an update

**Solutions**:

Clear application data and restart:

**macOS**:
```bash
rm -rf ~/Library/Application\ Support/Postman
rm -rf ~/Library/Caches/Postman
```

**Ubuntu/Linux**:
```bash
rm -rf ~/.config/Postman
rm -rf ~/snap/postman/current/.config/Postman
```

**Windows** (PowerShell):
```powershell
Remove-Item -Recurse -Force "$env:APPDATA\Postman"
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Postman"
```

---

## References

- [Postman Official Download Page](https://www.postman.com/downloads/)
- [Postman Installation Documentation](https://learning.postman.com/docs/getting-started/installation/installation-and-updates/)
- [Postman Homebrew Cask](https://formulae.brew.sh/cask/postman)
- [Postman Snap Package](https://snapcraft.io/postman)
- [Postman Chocolatey Package](https://community.chocolatey.org/packages/postman)
- [Postman winget Package](https://winget.run/pkg/Postman/Postman)
- [Newman Documentation](https://learning.postman.com/docs/collections/using-newman-cli/installing-running-newman/)
- [Newman npm Package](https://www.npmjs.com/package/newman)
- [Postman Portable for Windows](https://github.com/portapps/postman-portable)
- [Postman Desktop Agent](https://www.postman.com/downloads/postman-agent/)
- [Postman Web Application](https://go.postman.co)
