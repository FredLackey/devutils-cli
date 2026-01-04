# Installing Studio 3T

## Overview

Studio 3T is the professional IDE, client, and GUI for MongoDB. It provides a comprehensive environment for working with MongoDB databases, offering features such as:

- **Visual Query Builder**: Build MongoDB queries using drag-and-drop functionality
- **IntelliShell**: Autocomplete-enabled MongoDB shell with syntax highlighting
- **SQL Query**: Query MongoDB using SQL syntax and automatically translate to MongoDB query language
- **Aggregation Editor**: Visual pipeline builder for MongoDB aggregation framework
- **Data Import/Export**: Support for JSON, CSV, SQL, and BSON formats
- **Schema Explorer**: Visualize and analyze document schemas
- **Compare and Sync**: Compare and synchronize MongoDB collections and databases

Studio 3T is available in multiple editions:
- **Studio 3T Free**: Non-commercial use with core features
- **Studio 3T Professional**: Full feature set for individual developers
- **Studio 3T Ultimate**: Enterprise features including team governance and compliance

Studio 3T is a native desktop application available for Windows, macOS, and Linux (x86-64 only). ARM-based systems (including Raspberry Pi and Apple Silicon via Rosetta) have varying levels of support.

## Prerequisites

Before installing Studio 3T on any platform, ensure:

1. **Internet connectivity** - Required to download Studio 3T and for license activation
2. **Administrative privileges** - Required for system-wide installation on most platforms
3. **Sufficient resources** - Minimum 4 GB RAM and 500 MB free disk space recommended
4. **Display** - Studio 3T requires a graphical display environment (GUI application)
5. **Java Runtime** - Bundled with the installer; no separate installation required

**Important**: Studio 3T is built for x86-64 (Intel/AMD 64-bit) architecture. It does not natively support ARM processors on Linux. macOS Apple Silicon is supported via a dedicated build.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew package manager - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- **Optional:** None
- **Auto-installed:** None (Studio 3T is a self-contained .app bundle)

### Ubuntu (APT/Snap)
- **Required:**
  - `wget` - Install via `sudo apt install wget` (usually pre-installed)
  - `tar` - Install via `sudo apt install tar` (usually pre-installed)
  - `gzip` - Install via `sudo apt install gzip` (usually pre-installed)
  - `sudo` privileges - Required for installation
- **Optional:**
  - GTK3 and GUI libraries (recommended if GUI errors occur after installation):
    - `libgtk-3-0` - Install via `sudo apt install libgtk-3-0`
    - `libnotify4` - Install via `sudo apt install libnotify4`
    - `libnss3` - Install via `sudo apt install libnss3`
    - `libxss1` - Install via `sudo apt install libxss1`
    - `libxtst6` - Install via `sudo apt install libxtst6`
    - `libatspi2.0-0` - Install via `sudo apt install libatspi2.0-0`
    - `libsecret-1-0` - Install via `sudo apt install libsecret-1-0`
  - X11 or Wayland display server - For GUI support (usually pre-installed on desktop systems)
- **Auto-installed:** None

### Raspberry Pi OS (APT/Snap)
- **Installation not supported:** Studio 3T requires x86-64 architecture and does not support ARM processors used by Raspberry Pi

### Amazon Linux (DNF/YUM)
- **Required:**
  - Package manager (`dnf` for Amazon Linux 2023, `yum` for Amazon Linux 2) - Pre-installed
  - `wget` - Auto-installed during script execution via `sudo dnf install wget` or `sudo yum install wget`
  - `tar` - Auto-installed during script execution via `sudo dnf install tar` or `sudo yum install tar`
  - `gzip` - Auto-installed during script execution via `sudo dnf install gzip` or `sudo yum install gzip`
  - `sudo` privileges - Required for installation
- **Optional:**
  - X11 display server or X11 forwarding - Required for GUI on headless servers (connect via `ssh -X`)
- **Auto-installed:**
  - `gtk3` - GTK 3 library (installed via `sudo dnf install gtk3` or `sudo yum install gtk3`)
  - `libnotify` - Desktop notification library (installed via package manager)
  - `nss` - Network Security Services (installed via package manager)
  - `libXScrnSaver` - X11 screensaver extension library (installed via package manager)
  - `libXtst` - X11 testing library (installed via package manager)
  - `at-spi2-core` - Assistive Technology Service Provider Interface (installed via package manager)
  - `libsecret` - Secret storage library (installed via package manager)

### Windows (Chocolatey)
- **Required:**
  - Chocolatey package manager - Install via PowerShell (Administrator): `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
  - Administrator privileges - Required to run Chocolatey
- **Optional:** None
- **Auto-installed:** None (Chocolatey handles all Studio 3T installation requirements)

### Git Bash (Manual/Portable)
- **Required:**
  - Windows 10 or Windows 11 (64-bit) - Host operating system
  - Git Bash - Comes with Git for Windows (download from https://git-scm.com/download/win)
  - Chocolatey package manager on Windows - Install via PowerShell (Administrator)
  - PowerShell - Pre-installed on Windows
  - Administrator privileges - Required for Chocolatey operations
- **Optional:** None
- **Auto-installed:** None (Studio 3T is installed on Windows host via Chocolatey)

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- At least 4 GB RAM
- Intel processor or Apple Silicon (M1/M2/M3/M4)

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Studio 3T:

```bash
brew install --quiet --cask studio-3t
```

The `--quiet` flag suppresses non-essential output, and `--cask` specifies the graphical application version. Homebrew automatically selects the correct architecture (Intel or Apple Silicon) for your Mac.

After installation, launch Studio 3T from the Applications folder or via command line:

```bash
open -a "Studio 3T"
```

**Note**: On first launch, Studio 3T will prompt you to accept the license agreement and optionally sign in or start a trial. You can use Studio 3T Free without an account for non-commercial purposes.

#### Verification

Confirm the installation succeeded by checking if the application exists:

```bash
ls -la "/Applications/Studio 3T.app"
```

Expected output should show the Studio 3T.app directory with recent modification dates.

Verify the installed version:

```bash
brew info --cask studio-3t | head -1
```

Expected output (version numbers may vary):

```
studio-3t: 2025.23.0
```

#### Troubleshooting

**Problem**: `Error: Cask 'studio-3t' is already installed`

**Solution**: If you need to reinstall, first uninstall then reinstall:

```bash
brew uninstall --cask studio-3t
brew install --quiet --cask studio-3t
```

**Problem**: Application does not launch or crashes immediately

**Solution**: Clear Studio 3T's cache and configuration, then try again:

```bash
rm -rf ~/Library/Application\ Support/3T\ Software\ Labs
rm -rf ~/Library/Caches/3T\ Software\ Labs
open -a "Studio 3T"
```

**Problem**: "Studio 3T cannot be opened because Apple cannot check it for malicious software"

**Solution**: Right-click the Studio 3T application in Finder and select "Open" to bypass Gatekeeper, or allow it in System Preferences > Security & Privacy > General.

**Problem**: Application runs slowly on Apple Silicon

**Solution**: Studio 3T provides a native Apple Silicon build. Ensure you have the latest version:

```bash
brew upgrade --cask studio-3t
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 22.04 LTS or later, or Debian 11 (Bullseye) or later (64-bit x86-64 only)
- sudo privileges
- X11 or Wayland display server for GUI
- At least 4 GB RAM

**Important**: Studio 3T is not available through APT repositories. It must be installed manually via the official tarball. The installation uses an included shell script that supports silent/non-interactive installation.

#### Installation Steps

**Step 1: Download Studio 3T**

Download the latest Linux tarball:

```bash
wget -q "https://download.studio3t.com/studio-3t/linux/2025.23.0/studio-3t-linux-x64.tar.gz" -O /tmp/studio-3t-linux-x64.tar.gz
```

**Note**: Replace `2025.23.0` with the latest version number. Check https://studio3t.com/download/ for the current version.

**Step 2: Extract the archive**

```bash
tar -xzf /tmp/studio-3t-linux-x64.tar.gz -C /tmp/
```

**Step 3: Run the installer (non-interactive)**

```bash
sudo /tmp/studio-3t-linux-x64.sh -q
```

The `-q` flag enables quiet/non-interactive mode, installing Studio 3T to the default location (`/opt/studio3t`) without prompting for input.

**Step 4: Clean up**

```bash
rm -f /tmp/studio-3t-linux-x64.tar.gz /tmp/studio-3t-linux-x64.sh
```

After installation, launch Studio 3T from the application menu or via command line:

```bash
/opt/studio3t/Studio-3T &
```

#### Verification

Confirm the installation succeeded:

```bash
ls -la /opt/studio3t/Studio-3T
```

Expected output shows the Studio 3T executable file.

Verify the desktop entry was created:

```bash
ls -la /usr/share/applications/studio-3t.desktop 2>/dev/null || ls -la ~/.local/share/applications/studio-3t.desktop 2>/dev/null
```

Launch Studio 3T:

```bash
/opt/studio3t/Studio-3T &
```

The application should launch and display the main Studio 3T interface.

#### Troubleshooting

**Problem**: Installer fails with permission errors

**Solution**: Ensure you run the installer with sudo:

```bash
sudo /tmp/studio-3t-linux-x64.sh -q
```

**Problem**: "error while loading shared libraries"

**Solution**: Install missing GTK and other dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 libatspi2.0-0 libsecret-1-0
```

**Problem**: Application fails to start with display errors

**Solution**: Ensure you have a working X11 or Wayland session. For headless servers, use X11 forwarding:

```bash
ssh -X user@server
/opt/studio3t/Studio-3T
```

**Problem**: Download URL returns 404

**Solution**: The version number may have changed. Visit https://studio3t.com/download/ to find the current version and update the download URL accordingly.

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit) - Bookworm or later
- Raspberry Pi 4 or later with at least 4 GB RAM
- 64-bit operating system (aarch64/arm64 architecture)
- sudo privileges
- X11 display server for GUI

**Critical Limitation**: Studio 3T does NOT support ARM architecture. The application is built exclusively for x86-64 (Intel/AMD) processors. There is no ARM build available for Raspberry Pi.

First, verify your architecture:

```bash
uname -m
```

- `aarch64` or `armv8l` = ARM 64-bit (NOT supported by Studio 3T)
- `armv7l` = ARM 32-bit (NOT supported by Studio 3T)

#### Installation Steps

**Studio 3T cannot be installed on Raspberry Pi due to architecture incompatibility.**

Use one of these alternatives instead:

**Alternative 1 - MongoDB Compass (Recommended)**

MongoDB Compass is MongoDB's official GUI and may have better ARM support. However, it also has limited ARM Linux support. Check the current status at https://www.mongodb.com/products/compass.

**Alternative 2 - mongosh (MongoDB Shell)**

For command-line access to MongoDB, install the MongoDB Shell:

```bash
# Add MongoDB repository
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/mongodb-archive-keyring.gpg arch=arm64] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mongodb-mongosh
```

**Alternative 3 - Web-based MongoDB Tools**

Access your MongoDB databases through web-based interfaces:
- MongoDB Atlas includes a web-based data explorer
- Adminmongo (self-hosted web interface)

**Alternative 4 - Remote Access**

Install Studio 3T on an x86-64 machine (desktop PC, laptop, or cloud VM) and connect remotely to your MongoDB instance running on the Raspberry Pi.

#### Verification

This section is not applicable as Studio 3T cannot be installed on Raspberry Pi.

For mongosh alternative, verify installation:

```bash
mongosh --version
```

#### Troubleshooting

**Problem**: Attempting to run Studio 3T Linux installer on Raspberry Pi

**Solution**: This will fail because the binary is compiled for x86-64 architecture. Use one of the alternatives listed above.

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023, Amazon Linux 2, RHEL 8, or later (64-bit x86-64)
- sudo privileges
- X11 display server for GUI (typically not available on EC2 server instances)
- At least 4 GB RAM

**Important**: Amazon Linux EC2 instances typically run headless (no GUI). Studio 3T is a graphical application and requires a display. For headless server environments, either use X11 forwarding or access MongoDB through command-line tools.

#### Installation Steps

**Step 1: Install required dependencies**

For Amazon Linux 2023:

```bash
sudo dnf install -y wget tar gzip gtk3 libnotify nss libXScrnSaver libXtst at-spi2-core libsecret
```

For Amazon Linux 2:

```bash
sudo yum install -y wget tar gzip gtk3 libnotify nss libXScrnSaver libXtst at-spi2-atk libsecret
```

**Step 2: Download Studio 3T**

```bash
wget -q "https://download.studio3t.com/studio-3t/linux/2025.23.0/studio-3t-linux-x64.tar.gz" -O /tmp/studio-3t-linux-x64.tar.gz
```

**Note**: Replace `2025.23.0` with the latest version number from https://studio3t.com/download/.

**Step 3: Extract the archive**

```bash
tar -xzf /tmp/studio-3t-linux-x64.tar.gz -C /tmp/
```

**Step 4: Run the installer (non-interactive)**

```bash
sudo /tmp/studio-3t-linux-x64.sh -q
```

The `-q` flag enables quiet/non-interactive mode.

**Step 5: Clean up**

```bash
rm -f /tmp/studio-3t-linux-x64.tar.gz /tmp/studio-3t-linux-x64.sh
```

**For Headless Servers - mongosh Alternative:**

If you only need command-line MongoDB access on a headless server:

```bash
# For Amazon Linux 2023
sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo > /dev/null <<'EOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF
sudo dnf install -y mongodb-mongosh

# For Amazon Linux 2
sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo > /dev/null <<'EOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF
sudo yum install -y mongodb-mongosh
```

#### Verification

Confirm the installation succeeded:

```bash
ls -la /opt/studio3t/Studio-3T
```

Expected output shows the Studio 3T executable file.

For X11-forwarded sessions, launch Studio 3T:

```bash
/opt/studio3t/Studio-3T &
```

For mongosh, verify:

```bash
mongosh --version
```

#### Troubleshooting

**Problem**: "cannot open display" error

**Solution**: Studio 3T requires a graphical display. Connect via SSH with X11 forwarding:

```bash
ssh -X user@your-ec2-instance
/opt/studio3t/Studio-3T
```

Or use a VNC/RDP connection to a desktop environment.

**Problem**: Missing library errors

**Solution**: Install additional dependencies:

```bash
# For Amazon Linux 2023
sudo dnf install -y libXcomposite libXdamage libXrandr mesa-libgbm alsa-lib

# For Amazon Linux 2
sudo yum install -y libXcomposite libXdamage libXrandr mesa-libgbm alsa-lib
```

**Problem**: Installer fails on Graviton (ARM) instances

**Solution**: Studio 3T does not support ARM architecture. Use x86-64 instance types only, or use mongosh for command-line access.

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 21H2 or higher (64-bit), or Windows 11
- At least 4 GB RAM
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install studio3t -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation. Chocolatey downloads the Studio 3T ZIP archive, extracts it, and configures the application.

After installation, launch Studio 3T from the Start Menu or via command line:

```powershell
studio3t
```

**Note**: On first launch, Studio 3T will prompt you to accept the license agreement and optionally sign in or start a trial.

#### Verification

Open a new PowerShell or Command Prompt window, then verify Studio 3T is installed:

```powershell
choco list studio3t
```

Expected output shows Studio 3T with version information:

```
studio3t 2025.23.0
1 packages installed.
```

Launch Studio 3T to verify it opens correctly:

```powershell
studio3t
```

The application should launch and display the main Studio 3T interface.

#### Troubleshooting

**Problem**: `choco: command not found` or `'choco' is not recognized`

**Solution**: Chocolatey is not installed or not in PATH. Install Chocolatey first (see Prerequisites), then open a new terminal window.

**Problem**: Installation fails with permission errors

**Solution**: Run PowerShell as Administrator. Right-click PowerShell in the Start Menu and select "Run as administrator".

**Problem**: Studio 3T fails to launch after installation

**Solution**: Restart your computer to ensure all components are properly registered, then try launching again.

**Problem**: Windows Defender or antivirus blocks installation

**Solution**: The Chocolatey package downloads from official Studio 3T servers. If blocked, temporarily allow the download or add an exception for `download.studio3t.com`.

**Problem**: Need to install a specific version

**Solution**: Specify the version number:

```powershell
choco install studio3t --version=2025.23.0 -y
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- WSLg enabled (Windows 11 or Windows 10 build 21364+) for GUI application support
- sudo privileges within WSL

**Note**: Running GUI applications in WSL requires WSLg (Windows Subsystem for Linux GUI). Without WSLg, you cannot run Studio 3T's graphical interface directly in WSL.

To check if WSLg is available:

```bash
echo $DISPLAY
```

If this returns a value (e.g., `:0` or similar), WSLg is configured.

#### Installation Steps

**Option A: Install Linux Version in WSL (Requires WSLg)**

Follow the same steps as Ubuntu/Debian installation:

```bash
# Download Studio 3T
wget -q "https://download.studio3t.com/studio-3t/linux/2025.23.0/studio-3t-linux-x64.tar.gz" -O /tmp/studio-3t-linux-x64.tar.gz

# Extract the archive
tar -xzf /tmp/studio-3t-linux-x64.tar.gz -C /tmp/

# Run the installer (non-interactive)
sudo /tmp/studio-3t-linux-x64.sh -q

# Clean up
rm -f /tmp/studio-3t-linux-x64.tar.gz /tmp/studio-3t-linux-x64.sh
```

Launch Studio 3T:

```bash
/opt/studio3t/Studio-3T &
```

The Studio 3T window should appear as a Windows application window (rendered through WSLg).

**Option B: Use Windows Studio 3T (Recommended without WSLg)**

If WSLg is not available, install Studio 3T on Windows using Chocolatey (see Windows section) and launch it from Windows. You can still connect to MongoDB instances running in WSL from the Windows application.

#### Verification

Confirm the installation succeeded:

```bash
ls -la /opt/studio3t/Studio-3T
```

Expected output shows the Studio 3T executable file.

Test the GUI launches (requires WSLg):

```bash
/opt/studio3t/Studio-3T &
```

A Studio 3T window should appear within a few seconds.

#### Troubleshooting

**Problem**: "cannot open display" error

**Solution**: WSLg is not configured or not working. Either:
1. Update Windows to a version that supports WSLg (Windows 11 or Windows 10 21H2+)
2. Use the Windows native Studio 3T installation
3. Restart WSL: `wsl --shutdown` from PowerShell, then reopen your WSL terminal

**Problem**: Studio 3T starts but shows rendering errors or blank screen

**Solution**: Disable GPU acceleration by setting an environment variable:

```bash
LIBGL_ALWAYS_SOFTWARE=1 /opt/studio3t/Studio-3T &
```

**Problem**: Application crashes immediately

**Solution**: Install missing dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 libatspi2.0-0 libsecret-1-0 libasound2
```

**Problem**: Connecting to MongoDB running in WSL from Windows Studio 3T

**Solution**: Use `localhost` as the host. WSL 2 and Windows share the localhost network by default on modern Windows versions.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Studio 3T installed on Windows via Chocolatey or direct download

**Note**: Git Bash on Windows does not require a separate Studio 3T installation. Git Bash inherits the Windows PATH, so once Studio 3T is installed on Windows, the application is accessible. However, Studio 3T is a GUI application and cannot run inside the Git Bash terminal itself.

#### Installation Steps

Install Studio 3T on Windows using Chocolatey. Run this from an Administrator PowerShell or Command Prompt (not Git Bash, as Chocolatey requires elevated privileges):

```powershell
choco install studio3t -y
```

After installation, you can launch Studio 3T from Git Bash using the Windows `start` command:

```bash
start studio3t
```

Or launch it directly via its executable path:

```bash
"/c/Users/$USERNAME/AppData/Local/Programs/Studio 3T/Studio 3T.exe" &
```

**Note**: The exact installation path may vary. Use `where studio3t` in Command Prompt to find the actual location.

#### Verification

From Git Bash, verify Studio 3T can be launched:

```bash
start studio3t
```

The Studio 3T application should launch as a Windows application.

To verify the installation via Chocolatey (run in PowerShell, not Git Bash):

```powershell
choco list studio3t
```

#### Troubleshooting

**Problem**: `studio3t: command not found` in Git Bash

**Solution**: The Studio 3T executable may not be in PATH. Launch using the `start` command or the full path:

```bash
start studio3t
```

Or find and use the full path:

```bash
# Find where studio3t is installed (run in PowerShell first)
# where studio3t

# Then use that path in Git Bash, converting to Unix-style path
"/c/Users/YourUsername/AppData/Local/Programs/Studio 3T/Studio 3T.exe" &
```

**Problem**: Cannot install Chocolatey packages from Git Bash

**Solution**: Chocolatey requires elevated privileges and PowerShell. Open an Administrator PowerShell window to install packages:

```powershell
choco install studio3t -y
```

**Problem**: Paths with spaces cause errors

**Solution**: Always quote paths that contain spaces:

```bash
"/c/Program Files/Studio 3T/Studio 3T.exe" &
```

---

## Post-Installation Configuration

After installing Studio 3T on any platform, consider these optional configurations.

### Activating Studio 3T

On first launch, Studio 3T offers several options:

1. **Start Free Trial**: 14-day trial of all Professional features
2. **Activate License**: Enter a purchased license key
3. **Use Studio 3T Free**: Continue with the free edition for non-commercial use

For the free edition, click "Use Studio 3T Free" to skip activation.

### Connecting to MongoDB

To connect to a MongoDB database:

1. Click "Connect" in the toolbar
2. Click "New Connection"
3. Enter your MongoDB connection details:
   - **Server**: hostname or IP address
   - **Port**: default is 27017
   - **Authentication**: credentials if required
4. Click "Test Connection" to verify
5. Click "Save" then "Connect"

### Importing Connections from Other Tools

Studio 3T can import connections from:
- Robo 3T / Robomongo
- MongoDB Compass
- NoSQLBooster
- Connection URI strings

Go to **File > Import Connections** to access import options.

### Configuring Proxy Settings

For corporate networks requiring a proxy:

1. Open Studio 3T
2. Go to **Edit > Preferences** (Windows/Linux) or **Studio 3T > Preferences** (macOS)
3. Select **Network** in the left panel
4. Configure your proxy server details
5. Click "OK" to save

### Configuring Keyboard Shortcuts

Customize keyboard shortcuts:

1. Go to **Edit > Preferences** (Windows/Linux) or **Studio 3T > Preferences** (macOS)
2. Select **Keyboard Shortcuts**
3. Modify shortcuts as needed
4. Click "OK" to save

---

## Common Issues

### Issue: "Unable to connect to MongoDB"

**Symptoms**: Connection test fails with timeout or connection refused errors

**Solutions**:

- Verify MongoDB is running on the target server
- Check the hostname and port are correct
- Ensure firewall rules allow connections on the MongoDB port (default 27017)
- For remote connections, verify MongoDB is configured to accept remote connections (`bindIp` setting)
- Check authentication credentials if authentication is enabled

### Issue: License Activation Fails

**Symptoms**: "Unable to activate license" or "License server unreachable"

**Solutions**:

- Ensure internet connectivity
- Check if your firewall blocks `https://license.studio3t.com`
- For offline activation, contact Studio 3T support for an offline license file
- Verify your license key is entered correctly (no extra spaces)

### Issue: High Memory Usage

**Symptoms**: Studio 3T consumes excessive RAM, system becomes slow

**Solutions**:

- Close unused connection tabs and query results
- Limit the number of documents loaded in the result view
- Go to **Preferences > Performance** and reduce cache sizes
- Restart Studio 3T periodically during long sessions

### Issue: Slow Query Performance

**Symptoms**: Queries take very long to execute or display results

**Solutions**:

- Use query limits: add `.limit(100)` to avoid loading large result sets
- Ensure your MongoDB collections have appropriate indexes
- Check network latency to the MongoDB server
- For large result sets, use the "Table View" which handles large data better

### Issue: Java-Related Errors

**Symptoms**: Application fails to start with Java errors

**Solutions**:

Studio 3T bundles its own Java runtime, but conflicts can occur:

- Remove or rename any `JAVA_HOME` environment variable temporarily
- On macOS, check for conflicting Java installations in `/Library/Java/JavaVirtualMachines/`
- Reinstall Studio 3T to restore the bundled Java runtime

### Issue: SSL/TLS Connection Errors

**Symptoms**: "SSL handshake failed" or certificate errors

**Solutions**:

- In connection settings, go to the SSL tab
- For self-signed certificates, enable "Allow invalid hostnames" and add your CA certificate
- For MongoDB Atlas, ensure you're using the correct connection string with `ssl=true`
- Check that your system's date/time is correct (certificate validation fails with incorrect time)

---

## References

- [Studio 3T Official Website](https://studio3t.com/)
- [Studio 3T Download Page](https://studio3t.com/download/)
- [Studio 3T Installation Guide](https://studio3t.com/knowledge-base/articles/installation/)
- [Studio 3T macOS Installation](https://studio3t.com/knowledge-base/articles/how-to-install-studio-3t-on-macos/)
- [Studio 3T Windows Installation](https://studio3t.com/knowledge-base/articles/how-to-install-studio-3t-on-windows/)
- [Studio 3T Linux Installation](https://studio3t.com/knowledge-base/articles/how-to-install-studio-3t-on-linux/)
- [Studio 3T Homebrew Cask](https://formulae.brew.sh/cask/studio-3t)
- [Studio 3T Chocolatey Package](https://community.chocolatey.org/packages/studio3t)
- [Studio 3T Knowledge Base](https://studio3t.com/knowledge-base/)
- [Studio 3T Changelog](https://files.studio3t.com/changelog/changelog.txt)
- [Studio 3T Community Forum](https://community.studio3t.com/)
- [MongoDB Shell (mongosh) Documentation](https://www.mongodb.com/docs/mongodb-shell/)
