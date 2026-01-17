# Installing DBeaver Community Edition

## Overview

DBeaver Community Edition is a free, open-source universal database management tool and SQL client for developers, database administrators, analysts, and anyone who works with databases. It supports virtually all popular databases including MySQL, PostgreSQL, MariaDB, SQLite, Oracle, DB2, SQL Server, Sybase, MS Access, Teradata, Firebird, Derby, and many more through JDBC drivers.

DBeaver provides a powerful SQL editor with syntax highlighting and auto-completion, visual query builder, data export/import capabilities, ER diagram generation, and database schema browsing. The application is built on the Eclipse platform and includes its own bundled JRE (OpenJDK 21), eliminating the need for separate Java installation.

DBeaver Community Edition is available for Windows, macOS, and Linux, making it an excellent choice for cross-platform database management. This guide documents the installation process for all platforms supported by DevUtils CLI.

## Prerequisites

Before installing DBeaver Community Edition on any platform, ensure:

1. **Internet connectivity** - Required to download DBeaver packages
2. **Administrative privileges** - Required for system-wide installation (most platforms)
3. **Sufficient disk space** - Approximately 500 MB for installation (includes bundled JRE)
4. **64-bit operating system** - Required for all platforms (32-bit support is limited)
5. **Graphical display** - DBeaver is a GUI application and requires a display environment

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew package manager - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:** OpenJDK 21 is bundled with DBeaver (no separate Java installation needed)

### Ubuntu (APT/Snap)
- **Required:**
  - `wget` - Install via `sudo apt-get install -y wget`
  - `gpg` - Install via `sudo apt-get install -y gpg` (for APT repository method)
- **Optional:** None
- **Auto-installed:** OpenJDK 21 is bundled with DBeaver; all GUI dependencies are automatically installed by APT

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `wget` - Install via `sudo apt-get install -y wget`
  - `gpg` - Install via `sudo apt-get install -y gpg` (for APT repository method)
- **Optional:** None
- **Auto-installed:** OpenJDK 21 is bundled with DBeaver; all GUI dependencies are automatically installed by APT

### Amazon Linux (DNF/YUM)
- **Required:**
  - `wget` - Install via `sudo dnf install -y wget` or `sudo yum install -y wget`
- **Optional:** None
- **Auto-installed:**
  - OpenJDK 21 is bundled with DBeaver
  - GUI libraries may need manual installation on minimal/headless systems

### Windows (Chocolatey/winget)
- **Required:**
  - Chocolatey package manager - Install via PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
  - OR winget (Windows Package Manager) - Pre-installed on Windows 11 and recent Windows 10 versions
- **Optional:** None
- **Auto-installed:** OpenJDK 21 is bundled with DBeaver (no separate Java installation needed)

### Git Bash (Manual/Portable)
- **Required:**
  - Git Bash installed (comes with Git for Windows)
  - PowerShell access for running the portable extraction commands
- **Optional:** None
- **Auto-installed:** OpenJDK 21 is bundled in the portable ZIP archive

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager installed
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install DBeaver Community Edition:

```bash
brew install --quiet --cask dbeaver-community
```

The `--quiet` flag suppresses non-essential output for cleaner installation logs. The `--cask` option specifies the graphical application version.

#### Verification

Confirm the installation succeeded by checking that the application exists:

```bash
ls -la "/Applications/DBeaver.app"
```

Expected output shows the DBeaver.app directory with appropriate permissions.

Launch DBeaver to verify it opens correctly:

```bash
open -a DBeaver
```

Verify the package installation via Homebrew:

```bash
brew list --cask dbeaver-community
```

#### Troubleshooting

**Problem**: "DBeaver.app" is damaged and cannot be opened

**Solution**: Clear the quarantine attribute:

```bash
xattr -cr "/Applications/DBeaver.app"
```

**Problem**: Homebrew reports the cask is already installed

**Solution**: Reinstall to update:

```bash
brew reinstall --cask dbeaver-community
```

**Problem**: DBeaver fails to start with Java errors

**Solution**: DBeaver bundles its own JRE. If you see Java-related errors, ensure you are using the official distribution and not a third-party repackage:

```bash
brew uninstall --cask dbeaver-community
brew install --quiet --cask dbeaver-community
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 (Focal) or later, or Debian 10 (Buster) or later (64-bit)
- sudo privileges
- wget and gpg utilities

#### Installation Steps

**Step 1: Install prerequisites and import DBeaver's GPG key**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget gpg
sudo wget -O /usr/share/keyrings/dbeaver.gpg.key https://dbeaver.io/debs/dbeaver.gpg.key
```

**Step 2: Add DBeaver's APT repository**

```bash
echo "deb [signed-by=/usr/share/keyrings/dbeaver.gpg.key] https://dbeaver.io/debs/dbeaver-ce /" | sudo tee /etc/apt/sources.list.d/dbeaver.list > /dev/null
```

**Step 3: Install DBeaver Community Edition**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y dbeaver-ce
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation with no prompts.

#### Verification

Confirm the installation succeeded:

```bash
apt-cache policy dbeaver-ce
```

Expected output shows the installed version and repository source:

```
dbeaver-ce:
  Installed: 25.3.2
  Candidate: 25.3.2
  Version table:
 *** 25.3.2 500
        500 https://dbeaver.io/debs/dbeaver-ce / Packages
```

Verify the executable exists:

```bash
which dbeaver
```

Expected output:

```
/usr/bin/dbeaver
```

Launch DBeaver (requires graphical display):

```bash
dbeaver &
```

#### Troubleshooting

**Problem**: `E: Unable to locate package dbeaver-ce`

**Solution**: The repository was not added correctly. Verify the sources file exists:

```bash
cat /etc/apt/sources.list.d/dbeaver.list
```

If missing or malformed, repeat Steps 1 and 2.

**Problem**: GPG key import fails with permission errors

**Solution**: Ensure wget is installed and use sudo for the key download:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget
sudo wget -O /usr/share/keyrings/dbeaver.gpg.key https://dbeaver.io/debs/dbeaver.gpg.key
```

**Problem**: DBeaver does not launch on headless server

**Solution**: DBeaver requires a graphical display. For remote access to databases, consider using DBeaver on a desktop system with SSH tunneling, or use command-line tools like `psql` or `mysql` for headless environments.

**Problem**: DBeaver crashes on startup

**Solution**: Clear the workspace and configuration:

```bash
rm -rf ~/.local/share/DBeaverData
dbeaver &
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
- Raspberry Pi 4 or later recommended (at least 2 GB RAM for comfortable usage)
- Raspberry Pi 3B+ may work but performance will be limited
- sudo privileges

Verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit (recommended)
- `armv7l` = 32-bit (limited support, may have issues)

#### Installation Steps

DBeaver provides ARM64-compatible packages. Use the official DBeaver Debian repository:

**Step 1: Install prerequisites and import DBeaver's GPG key**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget gpg
sudo wget -O /usr/share/keyrings/dbeaver.gpg.key https://dbeaver.io/debs/dbeaver.gpg.key
```

**Step 2: Add DBeaver's APT repository**

```bash
echo "deb [signed-by=/usr/share/keyrings/dbeaver.gpg.key] https://dbeaver.io/debs/dbeaver-ce /" | sudo tee /etc/apt/sources.list.d/dbeaver.list > /dev/null
```

**Step 3: Install DBeaver Community Edition**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y dbeaver-ce
```

#### Verification

Confirm the installation succeeded:

```bash
apt-cache policy dbeaver-ce
```

Expected output shows the installed version:

```
dbeaver-ce:
  Installed: 25.3.2
  Candidate: 25.3.2
```

Verify the executable exists:

```bash
which dbeaver
```

Launch DBeaver:

```bash
dbeaver &
```

#### Troubleshooting

**Problem**: DBeaver is very slow or unresponsive

**Solution**: Raspberry Pi has limited resources. Reduce memory usage by closing other applications. Consider adding swap space:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Problem**: Out of memory errors

**Solution**: DBeaver with its bundled JRE requires significant memory. Ensure at least 2 GB RAM is available. Close background applications and consider using Raspberry Pi 4 with 4 GB or 8 GB RAM.

**Problem**: Display issues or crashes on startup

**Solution**: Ensure GPU memory is allocated appropriately. Run `raspi-config` and set GPU memory to at least 128 MB:

```bash
sudo raspi-config
```

Navigate to Performance Options > GPU Memory and set to 128.

**Problem**: Package not found for 32-bit Raspberry Pi OS

**Solution**: DBeaver primarily supports 64-bit ARM (aarch64). For 32-bit systems, use the Snap installation method instead:

```bash
sudo apt-get install -y snapd
sudo snap install dbeaver-ce
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8+, CentOS 8+, or Fedora
- sudo privileges
- 64-bit system
- Graphical display environment

**Note**: Amazon Linux 2023 uses DNF as the package manager. Amazon Linux 2 uses YUM. This guide uses DNF commands; replace `dnf` with `yum` for AL2.

#### Installation Steps

**Step 1: Install wget**

```bash
sudo dnf install -y wget
```

For Amazon Linux 2 (YUM):

```bash
sudo yum install -y wget
```

**Step 2: Download the latest RPM package**

```bash
wget -q https://dbeaver.io/files/dbeaver-ce-latest-stable.x86_64.rpm -O /tmp/dbeaver-ce.rpm
```

**Step 3: Install DBeaver Community Edition**

For Amazon Linux 2023, RHEL 8+, Fedora (DNF):

```bash
sudo dnf install -y /tmp/dbeaver-ce.rpm
```

For Amazon Linux 2 (YUM):

```bash
sudo yum install -y /tmp/dbeaver-ce.rpm
```

**Step 4: Clean up the downloaded package**

```bash
rm -f /tmp/dbeaver-ce.rpm
```

#### Verification

Confirm the installation succeeded:

```bash
rpm -q dbeaver-ce
```

Expected output (version may vary):

```
dbeaver-ce-25.3.2-stable.x86_64
```

Verify the executable exists:

```bash
which dbeaver
```

Expected output:

```
/usr/bin/dbeaver
```

Launch DBeaver (requires graphical display):

```bash
dbeaver &
```

#### Troubleshooting

**Problem**: Dependency errors during installation

**Solution**: Install required GUI libraries:

```bash
sudo dnf install -y libX11 libxcb libXcomposite libXcursor libXdamage libXext libXfixes libXi libXrender libXtst alsa-lib gtk3
```

For YUM:

```bash
sudo yum install -y libX11 libxcb libXcomposite libXcursor libXdamage libXext libXfixes libXi libXrender libXtst alsa-lib gtk3
```

**Problem**: DBeaver fails to launch with display errors

**Solution**: Ensure X11 forwarding is enabled if connecting remotely:

```bash
ssh -X user@server
dbeaver &
```

Or use X11 forwarding with compression:

```bash
ssh -XC user@server
dbeaver &
```

**Problem**: Upgrading to a newer version

**Solution**: Download the new RPM and use the upgrade parameter:

```bash
wget -q https://dbeaver.io/files/dbeaver-ce-latest-stable.x86_64.rpm -O /tmp/dbeaver-ce.rpm
sudo rpm -Uvh /tmp/dbeaver-ce.rpm
rm -f /tmp/dbeaver-ce.rpm
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or later (64-bit), or Windows Server 2016 or later
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

Windows 8 and Windows Server 2012 are not supported.

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install dbeaver -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

The Chocolatey package:
- Includes bundled JRE (no separate Java installation needed)
- Creates Start Menu shortcuts
- Associates database file types with DBeaver

#### Verification

Open a **new** PowerShell or Command Prompt window (to pick up any PATH changes), then verify DBeaver is installed:

```powershell
choco list dbeaver
```

Expected output (version may vary):

```
dbeaver 25.3.2
1 packages installed.
```

Launch DBeaver from the Start Menu or by running:

```powershell
dbeaver
```

#### Troubleshooting

**Problem**: Chocolatey installation blocked by antivirus

**Solution**: Temporarily disable real-time scanning or add an exception for the Chocolatey directory (`C:\ProgramData\chocolatey`).

**Problem**: Installation requires restart

**Solution**: Some Windows updates may require a restart. Chocolatey will notify you if this is needed:

```powershell
choco install dbeaver -y
shutdown /r /t 60 /c "Restarting to complete DBeaver installation"
```

**Problem**: DBeaver does not start after installation

**Solution**: Try reinstalling:

```powershell
choco uninstall dbeaver -y
choco install dbeaver -y
```

---

### Windows (winget)

#### Prerequisites

- Windows 10 version 1809 or later (64-bit), or Windows 11
- Windows Package Manager (winget) - Pre-installed on Windows 11 and Windows 10 (recent versions)

Verify winget is available:

```powershell
winget --version
```

#### Installation Steps

Run the following command in PowerShell or Command Prompt:

```powershell
winget install --id dbeaver.dbeaver --silent --accept-package-agreements --accept-source-agreements
```

The flags ensure fully non-interactive installation:
- `--id dbeaver.dbeaver` - Exact package identifier
- `--silent` - No installation UI
- `--accept-package-agreements` - Automatically accept license agreements
- `--accept-source-agreements` - Automatically accept source repository agreements

#### Verification

Open a **new** terminal window, then verify DBeaver is installed:

```powershell
winget list --id dbeaver.dbeaver
```

Expected output shows the installed version.

Launch DBeaver from the Start Menu or by searching for "DBeaver" in Windows Search.

#### Troubleshooting

**Problem**: `No package found matching input criteria`

**Solution**: Update the winget source:

```powershell
winget source update
winget install --id dbeaver.dbeaver --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: Installation hangs or times out

**Solution**: Try specifying the scope:

```powershell
winget install --id dbeaver.dbeaver --scope user --silent --accept-package-agreements --accept-source-agreements
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

**Recommended Approach**: DBeaver is a GUI application. The recommended approach is to install DBeaver on Windows and use it directly, connecting to databases running in WSL via localhost.

#### Installation Steps

**Option 1: Install on Windows, connect to WSL databases (Recommended)**

1. Install DBeaver on Windows using Chocolatey or winget (see Windows sections above)
2. Run your database server in WSL
3. Connect from Windows DBeaver to `localhost` or `127.0.0.1`

This approach provides the best performance and avoids GUI compatibility issues.

**Option 2: Native DBeaver in WSL with WSLg (Windows 11)**

If you have WSLg (Windows 11) enabled, you can install DBeaver natively in WSL:

```bash
# Install prerequisites
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget gpg

# Import GPG key
sudo wget -O /usr/share/keyrings/dbeaver.gpg.key https://dbeaver.io/debs/dbeaver.gpg.key

# Add repository
echo "deb [signed-by=/usr/share/keyrings/dbeaver.gpg.key] https://dbeaver.io/debs/dbeaver-ce /" | sudo tee /etc/apt/sources.list.d/dbeaver.list > /dev/null

# Install
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y dbeaver-ce
```

#### Verification

For native WSL installation with WSLg:

```bash
apt-cache policy dbeaver-ce
```

Launch DBeaver:

```bash
dbeaver &
```

The WSLg system should display the DBeaver window.

#### Troubleshooting

**Problem**: GUI does not display for WSL installation

**Solution**: Ensure WSLg is enabled (Windows 11). Update WSL:

```powershell
wsl --update
```

Then restart WSL:

```powershell
wsl --shutdown
```

**Problem**: Display errors with X server

**Solution**: For Windows 10 without WSLg, you need to configure an X server (VcXsrv, X410, etc.). This adds complexity; the recommended approach is to install DBeaver on Windows instead.

**Problem**: Cannot connect to database in WSL from Windows DBeaver

**Solution**: Ensure the database is configured to listen on `0.0.0.0` or `127.0.0.1`, and connect from DBeaver using `localhost` as the host.

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- PowerShell access for initial setup

**Note**: Git Bash on Windows does not require a separate DBeaver installation. The recommended approach is to install DBeaver on Windows using Chocolatey, which makes it available system-wide including from Git Bash.

#### Installation Steps

**Recommended: Use Chocolatey (simplest approach)**

Install DBeaver using Chocolatey from an Administrator PowerShell:

```powershell
choco install dbeaver -y
```

Then DBeaver is available from Git Bash:

```bash
dbeaver &
```

**Alternative: Portable ZIP Installation**

For a portable installation that does not require administrator privileges:

**Step 1: Download the portable ZIP from PowerShell**

```powershell
$dbeaverUrl = "https://dbeaver.io/files/dbeaver-ce-latest-win32.win32.x86_64.zip"
$downloadPath = "$env:USERPROFILE\Downloads\dbeaver-portable.zip"
$extractPath = "$env:USERPROFILE\Apps\DBeaver"

Invoke-WebRequest -Uri $dbeaverUrl -OutFile $downloadPath -UseBasicParsing
```

**Step 2: Extract the archive**

```powershell
if (Test-Path $extractPath) { Remove-Item -Recurse -Force $extractPath }
Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
Remove-Item $downloadPath
```

**Step 3: Add to Git Bash PATH**

In Git Bash, add DBeaver to your PATH by editing `~/.bashrc`:

```bash
echo 'export PATH="$PATH:$HOME/Apps/DBeaver/dbeaver"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

In Git Bash, verify DBeaver is accessible:

For Chocolatey installation:

```bash
which dbeaver
```

For portable installation:

```bash
ls -la "$HOME/Apps/DBeaver/dbeaver/dbeaver.exe"
```

Launch DBeaver:

```bash
dbeaver &
```

#### Troubleshooting

**Problem**: `dbeaver: command not found` in Git Bash

**Solution**: For Chocolatey installation, ensure DBeaver is installed and open a new Git Bash window. For portable installation, verify the PATH is set correctly:

```bash
echo $PATH | grep -i dbeaver
```

If not found, re-add to PATH:

```bash
echo 'export PATH="$PATH:$HOME/Apps/DBeaver/dbeaver"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: DBeaver window does not open

**Solution**: Run DBeaver directly with the full path:

```bash
"$HOME/Apps/DBeaver/dbeaver/dbeaver.exe" &
```

**Problem**: Portable version settings not persisting

**Solution**: The portable version stores configuration in a `configuration` folder within the DBeaver directory. Ensure this folder is writable:

```bash
ls -la "$HOME/Apps/DBeaver/dbeaver/configuration"
```

---

## Post-Installation Configuration

After installing DBeaver on any platform, consider these recommended configurations.

### Creating Your First Database Connection

1. Launch DBeaver
2. Click "Database" > "New Database Connection" (or the plug icon in toolbar)
3. Select your database type (e.g., PostgreSQL, MySQL, SQLite)
4. Enter connection details (host, port, database name, credentials)
5. Click "Test Connection" to verify
6. Click "Finish" to save the connection

### Installing Database Drivers

DBeaver automatically downloads JDBC drivers for most databases on first connection. For databases that require manual driver setup:

1. Right-click the connection > "Edit Connection"
2. Go to "Driver properties" tab
3. Click "Download/Update" if drivers are missing

### Configuring Workspace Location

By default, DBeaver stores its workspace in:
- **Linux/macOS**: `~/.local/share/DBeaverData`
- **Windows**: `%APPDATA%\DBeaverData`

To change the workspace location, edit the `dbeaver.ini` file in the DBeaver installation directory and add:

```
-data
/path/to/your/workspace
```

### Enabling Dark Theme

1. Go to "Window" > "Preferences" (or "DBeaver" > "Preferences" on macOS)
2. Navigate to "User Interface" > "Appearance"
3. Select "Dark" theme
4. Click "Apply and Close"
5. Restart DBeaver

---

## Common Issues

### Issue: DBeaver Uses Too Much Memory

**Symptoms**: DBeaver consumes excessive RAM, system becomes slow

**Solutions**:

Edit the `dbeaver.ini` file to limit memory usage:

```
-Xms256m
-Xmx1024m
```

The `-Xmx` parameter sets the maximum heap size. Adjust based on your system resources.

### Issue: Connection Timeout to Remote Database

**Symptoms**: DBeaver cannot connect to remote database, times out

**Solutions**:

1. Verify the database server is running and accepting connections
2. Check firewall rules allow traffic on the database port
3. Increase connection timeout in connection settings:
   - Right-click connection > "Edit Connection"
   - Go to "Connection settings" > "General"
   - Increase timeout values

### Issue: SSL/TLS Connection Problems

**Symptoms**: Connection fails with SSL-related errors

**Solutions**:

1. Right-click connection > "Edit Connection"
2. Go to "Driver properties"
3. For MySQL: Set `useSSL=true` and `allowPublicKeyRetrieval=true`
4. For PostgreSQL: Set `sslmode=require`

### Issue: Cannot Edit Data (Read-Only)

**Symptoms**: Table data appears read-only, cannot insert/update

**Solutions**:

1. Ensure the connected user has write permissions
2. Check if the table has a primary key (required for editable results)
3. Right-click the table > "Read Data in SQL Console" to use direct SQL

### Issue: Export/Import Fails

**Symptoms**: Data export or import operations fail

**Solutions**:

1. Check write permissions on the target directory
2. Ensure sufficient disk space
3. For large exports, increase heap memory in `dbeaver.ini`
4. Try exporting in smaller batches

---

## References

- [DBeaver Official Website](https://dbeaver.io/)
- [DBeaver Download Page](https://dbeaver.io/download/)
- [DBeaver Installation Documentation](https://dbeaver.com/docs/dbeaver/Installation/)
- [DBeaver GitHub Wiki](https://github.com/dbeaver/dbeaver/wiki/Installation)
- [DBeaver Command Line](https://dbeaver.com/docs/dbeaver/Command-Line/)
- [Homebrew Cask: dbeaver-community](https://formulae.brew.sh/cask/dbeaver-community)
- [Chocolatey Package: dbeaver](https://community.chocolatey.org/packages/dbeaver)
- [Winget Package: dbeaver.dbeaver](https://winget.run/pkg/dbeaver/dbeaver)
- [DBeaver Snap Package](https://snapcraft.io/dbeaver-ce)
- [DBeaver Debian Repository](https://dbeaver.io/download/)
- [DBeaver GitHub Repository](https://github.com/dbeaver/dbeaver)
