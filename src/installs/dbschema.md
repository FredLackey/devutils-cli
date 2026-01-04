# Installing DbSchema

## Overview

DbSchema is a visual database design and management tool that supports schema design, documentation generation, data exploration, and SQL query building. Built with Java and JavaFX, DbSchema works with over 70 databases including PostgreSQL, MySQL, SQL Server, Oracle, SQLite, MongoDB, and many others. The application connects to databases via JDBC drivers and provides features such as ER diagram visualization, schema comparison and synchronization, HTML5/PDF/Markdown documentation generation, and random data generation for testing.

DbSchema is available for macOS, Windows, and Linux. It offers a free Community Edition and a paid Pro Edition with a 15-day trial included in all downloads. No registration is required to download and use DbSchema.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `Homebrew` - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- **Optional:** None
- **Auto-installed:** None

### Ubuntu (APT/Snap)
- **Required:**
  - `curl` - Install via `sudo apt install curl` (used for downloading the .deb package; usually pre-installed)
  - `apt-get` - Pre-installed on Ubuntu/Debian systems
- **Optional:** None
- **Auto-installed:**
  - JDBC drivers (downloaded automatically by DbSchema when connecting to databases)
  - Package dependencies resolved automatically by apt-get during .deb installation

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `curl` - Install via `sudo apt install curl` (used for downloading the ARM64 tar.gz package; usually pre-installed)
  - 64-bit ARM architecture (aarch64) - Verify with `uname -m`
  - `tar` - Pre-installed on Raspberry Pi OS (used for extracting the package)
  - `sudo` privileges - Required for installation to /opt/DbSchema
- **Optional:**
  - `box64` - Install via `sudo apt install box64` (for running x86_64 version via emulation if ARM64 has compatibility issues)
- **Auto-installed:** None
- **Important Note:** DbSchema ARM64 support is limited on Raspberry Pi. Users may experience JavaFX compatibility issues. Raspberry Pi 4 or later with 4 GB+ RAM recommended.

### Amazon Linux (DNF/YUM)
- **Required:**
  - `curl` - Install via `sudo dnf install curl` or `sudo yum install curl` (used for downloading the .rpm package)
  - `dnf` or `yum` - Pre-installed on Amazon Linux/RHEL systems (dnf preferred on AL2023, RHEL 8+; yum on AL2, CentOS 7)
- **Optional:** None
- **Auto-installed:**
  - JDBC drivers (downloaded automatically by DbSchema when connecting to databases)
  - Package dependencies resolved automatically by dnf/yum during .rpm installation

### Windows (Chocolatey/winget)
- **Required:**
  - `PowerShell` - Pre-installed on Windows 10/11 (Windows PowerShell 5.1 or PowerShell Core 7+)
  - `msiexec.exe` - Pre-installed on Windows (used for silent MSI installation)
- **Optional:** None
- **Auto-installed:**
  - JDBC drivers (downloaded automatically by DbSchema when connecting to databases)

### Git Bash (Manual/Portable)
- **Required:**
  - `PowerShell` - Pre-installed on Windows 10/11 (accessed via `powershell.exe` from Git Bash)
  - `msiexec.exe` - Pre-installed on Windows (used for silent MSI installation)
- **Optional:** None
- **Auto-installed:**
  - JDBC drivers (downloaded automatically by DbSchema when connecting to databases)
- **Note:** Git Bash uses the Windows installation of DbSchema. The installer is run via PowerShell from within Git Bash.

## Prerequisites

Before installing DbSchema on any platform, ensure:

1. **Internet connectivity** - Required for downloading the installer
2. **Sufficient disk space** - At least 500 MB available
3. **Display** - DbSchema is a graphical desktop application and requires a display (X11, Wayland, or native GUI)
4. **Administrative privileges** - Required on most platforms for system-wide installation

**Important**: DbSchema bundles its own Java runtime (OpenJDK with JavaFX), so no separate Java installation is required.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- Terminal access

Homebrew supports both Apple Silicon (M1/M2/M3/M4) and Intel Macs. If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install DbSchema via Homebrew:

```bash
brew install --cask --quiet dbschema
```

The `--cask` flag indicates this is a macOS application (not a command-line formula), and `--quiet` suppresses non-essential output for automation compatibility.

After installation, DbSchema is available in `/Applications/DbSchema.app` and can be launched from Spotlight or the Applications folder.

#### Verification

Confirm the installation succeeded by verifying the application exists:

```bash
ls /Applications/DbSchema.app
```

Expected output:

```
/Applications/DbSchema.app
```

Launch DbSchema to verify it starts correctly:

```bash
open -a DbSchema
```

#### Troubleshooting

**Problem**: `brew: command not found`

**Solution**: Homebrew is not installed or not in PATH. Add it to your PATH:

For Apple Silicon Macs:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For Intel Macs:

```bash
eval "$(/usr/local/bin/brew shellenv)"
```

**Problem**: Installation fails with "Cask 'dbschema' is unavailable"

**Solution**: Update Homebrew to get the latest cask definitions:

```bash
brew update && brew install --cask --quiet dbschema
```

**Problem**: App shows "DbSchema can't be opened because Apple cannot check it for malicious software"

**Solution**: This can occur on first launch. Right-click the app in Applications and select "Open", then click "Open" in the dialog. Alternatively, clear the quarantine flag:

```bash
xattr -cr /Applications/DbSchema.app
```

**Problem**: DbSchema fails to start or crashes immediately

**Solution**: Check the log files for errors. Enable debug logging:

```bash
export INSTALL4J_LOG=yes
open -a DbSchema
```

Review the log output in the terminal for specific error messages.

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 or later, or Debian 10 or later (64-bit x86_64)
- sudo privileges
- Active internet connection
- Desktop environment with display (X11 or Wayland)

**Note**: DbSchema is not available in the official Ubuntu/Debian APT repositories or as a Snap package. Install it using the official Debian package from DbSchema's website.

#### Installation Steps

Download and install the DbSchema Debian package:

```bash
curl -fsSL "https://dbschema.com/download/dbschema_linux_10_0_2.deb" -o /tmp/dbschema.deb && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/dbschema.deb && rm /tmp/dbschema.deb
```

This command:
- Downloads the latest DbSchema .deb package
- Installs it using apt-get with no interactive prompts
- Cleans up the downloaded file

After installation, DbSchema is available in your application menu and can be launched from the terminal.

#### Verification

Verify the package is installed:

```bash
dpkg -l | grep dbschema
```

Expected output shows the package name and version:

```
ii  dbschema       10.0.2      amd64        DbSchema Database Designer
```

Launch DbSchema:

```bash
/opt/DbSchema/DbSchema &
```

Or search for "DbSchema" in your application menu.

#### Troubleshooting

**Problem**: Installation fails with dependency errors

**Solution**: Fix missing dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -f -y
```

Then retry the installation.

**Problem**: DbSchema does not appear in application menu

**Solution**: Log out and log back in, or manually refresh the desktop database:

```bash
update-desktop-database ~/.local/share/applications
```

**Problem**: Graphics rendering issues or blank window

**Solution**: Try running with a different graphics toolkit:

```bash
export _JAVA_AWT_WM_NONREPARENTING=1
/opt/DbSchema/DbSchema
```

For Wayland-specific issues, try forcing X11:

```bash
GDK_BACKEND=x11 /opt/DbSchema/DbSchema
```

**Problem**: "No display available" error

**Solution**: DbSchema requires a graphical display. If connecting via SSH, use X11 forwarding:

```bash
ssh -X user@server
/opt/DbSchema/DbSchema
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit) - ARM64/aarch64 architecture
- Raspberry Pi 4 or later with 4 GB or more RAM recommended
- sudo privileges
- Active internet connection
- Desktop environment with display

**Critical Architecture Requirement**: DbSchema provides ARM64 Linux builds, but these are for x86_64 emulation scenarios. Native ARM64 support is limited. Verify your architecture:

```bash
uname -m
```

**Important Note**: DbSchema's primary Linux builds target x86_64 architecture. While DbSchema provides an ARM64 tar.gz package, Raspberry Pi users may experience compatibility issues due to the JavaFX dependencies. The Arch Linux AUR package explicitly lists only 'i686' and 'x86_64' as supported architectures.

#### Installation Steps

For Raspberry Pi OS (64-bit ARM64), download and extract the ARM64 tar.gz package:

```bash
curl -fsSL "https://dbschema.com/download/dbschema_linux_arm_10_0_2.tar.gz" -o /tmp/dbschema.tar.gz && sudo mkdir -p /opt/DbSchema && sudo tar -xzf /tmp/dbschema.tar.gz -C /opt/DbSchema --strip-components=1 && rm /tmp/dbschema.tar.gz
```

Create a desktop launcher for easy access:

```bash
cat > ~/.local/share/applications/dbschema.desktop << 'EOF'
[Desktop Entry]
Name=DbSchema
Comment=Database Design Tool
Exec=/opt/DbSchema/DbSchema
Icon=/opt/DbSchema/.install4j/DbSchema.png
Terminal=false
Type=Application
Categories=Development;Database;
EOF
```

Update the desktop database:

```bash
update-desktop-database ~/.local/share/applications
```

#### Verification

Verify the files were extracted:

```bash
ls /opt/DbSchema/DbSchema
```

Expected output:

```
/opt/DbSchema/DbSchema
```

Attempt to launch DbSchema:

```bash
/opt/DbSchema/DbSchema &
```

#### Troubleshooting

**Problem**: DbSchema fails to start with JavaFX errors

**Solution**: DbSchema's ARM64 build may have limited compatibility with Raspberry Pi's ARM64 implementation. Consider using x86 emulation via Box64:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y box64
```

Then download and run the x86_64 version through Box64. Note that performance may be significantly reduced.

**Problem**: `uname -m` shows `armv7l` instead of `aarch64`

**Solution**: You are running 32-bit Raspberry Pi OS. DbSchema requires 64-bit. Download and install the 64-bit Raspberry Pi OS image from https://www.raspberrypi.com/software/.

**Problem**: Out of memory errors or crashes

**Solution**: DbSchema requires significant memory. Increase swap space:

```bash
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

Close other applications before running DbSchema.

**Problem**: Display rendering issues

**Solution**: Try running with software rendering:

```bash
export LIBGL_ALWAYS_SOFTWARE=1
/opt/DbSchema/DbSchema
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8+, Fedora, or CentOS Stream 8+
- sudo privileges
- Active internet connection
- Desktop environment (DbSchema is a graphical application)

**Note**: DbSchema is not available in the default Amazon Linux, RHEL, or Fedora repositories. Install it using the official RPM package from DbSchema's website.

#### Installation Steps

For Amazon Linux 2023, RHEL 8+, and Fedora (using DNF):

```bash
curl -fsSL "https://dbschema.com/download/dbschema_linux_10_0_2.rpm" -o /tmp/dbschema.rpm && sudo dnf install -y /tmp/dbschema.rpm && rm /tmp/dbschema.rpm
```

For Amazon Linux 2 and older systems (using YUM):

```bash
curl -fsSL "https://dbschema.com/download/dbschema_linux_10_0_2.rpm" -o /tmp/dbschema.rpm && sudo yum install -y /tmp/dbschema.rpm && rm /tmp/dbschema.rpm
```

After installation, DbSchema is available in your application menu.

#### Verification

Verify the package is installed:

```bash
rpm -qa | grep -i dbschema
```

Expected output shows the package name:

```
dbschema-10.0.2-1.x86_64
```

Launch DbSchema:

```bash
/opt/DbSchema/DbSchema &
```

#### Troubleshooting

**Problem**: No graphical display available

**Solution**: DbSchema is a GUI application and requires a desktop environment. For headless servers, use X11 forwarding:

```bash
ssh -X user@server
/opt/DbSchema/DbSchema
```

Or install a desktop environment:

```bash
sudo dnf groupinstall -y "Server with GUI"
```

**Problem**: SELinux blocking execution

**Solution**: Check the audit log for SELinux denials:

```bash
sudo ausearch -m avc -ts recent
```

For testing, you can temporarily set SELinux to permissive mode:

```bash
sudo setenforce 0
```

**Note**: This is temporary. For production, create a proper SELinux policy.

**Problem**: Missing dependencies

**Solution**: Install common GUI dependencies:

```bash
sudo dnf install -y libX11 libXScrnSaver gtk3 nss alsa-lib mesa-libGL
```

**Problem**: RPM installation fails with conflicts

**Solution**: Remove any previous DbSchema installation first:

```bash
sudo dnf remove -y dbschema
```

Then retry the installation.

---

### Windows (MSI Installer)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Administrator privileges
- Active internet connection

**Note**: DbSchema is not available in the Chocolatey or winget package repositories. Install it using the official MSI installer from DbSchema's website with silent installation flags.

#### Installation Steps

Download and install DbSchema using the MSI installer with silent flags. Run the following commands in an Administrator PowerShell:

```powershell
Invoke-WebRequest -Uri "https://dbschema.com/download/dbschema_windows_10_0_2.msi" -OutFile "$env:TEMP\dbschema.msi"; Start-Process msiexec.exe -ArgumentList "/i", "$env:TEMP\dbschema.msi", "/qn", "/norestart" -Wait; Remove-Item "$env:TEMP\dbschema.msi"
```

This command:
- Downloads the DbSchema MSI installer to the temp directory
- Runs the installer silently (`/qn` = quiet, no UI)
- Waits for installation to complete
- Cleans up the downloaded file

The `/qn` flag ensures completely silent installation with no user prompts.

**Alternative: EXE Installer with Silent Flag**

DbSchema's EXE installer (built with install4j) supports the `-q` flag for silent installation:

```powershell
Invoke-WebRequest -Uri "https://dbschema.com/download/dbschema_windows_10_0_2.exe" -OutFile "$env:TEMP\dbschema.exe"; Start-Process "$env:TEMP\dbschema.exe" -ArgumentList "-q" -Wait; Remove-Item "$env:TEMP\dbschema.exe"
```

After installation, DbSchema is available in the Start Menu and typically installed to `C:\Program Files\DbSchema\`.

#### Verification

Verify the installation by checking for the executable:

```powershell
Test-Path "C:\Program Files\DbSchema\DbSchema.exe"
```

Expected output:

```
True
```

Launch DbSchema:

```powershell
Start-Process "C:\Program Files\DbSchema\DbSchema.exe"
```

Or search for "DbSchema" in the Start Menu.

#### Troubleshooting

**Problem**: Installation fails with "Administrator privileges required"

**Solution**: Right-click PowerShell and select "Run as administrator", then retry the installation command.

**Problem**: MSI installation fails silently

**Solution**: Enable logging to diagnose the issue:

```powershell
msiexec.exe /i "$env:TEMP\dbschema.msi" /qn /l*v "$env:TEMP\dbschema_install.log"
```

Review the log file at `$env:TEMP\dbschema_install.log` for error details.

**Problem**: Windows Defender SmartScreen blocks the installer

**Solution**: The DbSchema installer is a legitimate application. In an automated context, you may need to configure Windows Defender exclusions or download signing policies. For manual installation, click "More info" and then "Run anyway".

**Problem**: DbSchema does not start after installation

**Solution**: Check for conflicting Java installations. DbSchema bundles its own JRE, but system-wide Java configurations may interfere. Try launching with debug logging:

```powershell
& "C:\Program Files\DbSchema\DbSchema.exe" /create-i4j-log
```

Review the generated log file for errors.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- Windows Subsystem for Linux installed with Ubuntu distribution
- WSL 2 recommended (WSLg provides native GUI support)
- sudo privileges within WSL

**Important**: DbSchema is a graphical desktop application. Running it in WSL requires either WSLg (Windows 11 with WSL 2) for native GUI support, or an X server on Windows for older setups.

Verify WSL version and GUI support:

```bash
wsl --list --verbose
```

For WSL 2 with Windows 11, WSLg provides automatic GUI support. For older setups, install an X server like VcXsrv on Windows.

#### Installation Steps

Download and install the DbSchema Debian package within WSL Ubuntu:

```bash
curl -fsSL "https://dbschema.com/download/dbschema_linux_10_0_2.deb" -o /tmp/dbschema.deb && sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/dbschema.deb && rm /tmp/dbschema.deb
```

For WSL 2 with WSLg (Windows 11), no additional configuration is needed. For older setups without WSLg, configure the DISPLAY variable:

```bash
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
```

Add this line to `~/.bashrc` for persistence.

#### Verification

Verify the package is installed:

```bash
dpkg -l | grep dbschema
```

Launch DbSchema:

```bash
/opt/DbSchema/DbSchema &
```

A GUI window should appear on your Windows desktop (via WSLg or X server).

#### Troubleshooting

**Problem**: "Cannot open display" error

**Solution**: For WSL 2 without WSLg, ensure an X server (like VcXsrv) is running on Windows and configure DISPLAY:

```bash
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
export LIBGL_ALWAYS_INDIRECT=1
```

For VcXsrv, launch it with "Disable access control" checked.

**Problem**: GUI is extremely slow or laggy

**Solution**: WSLg performance depends on GPU support. Try disabling hardware acceleration:

```bash
export LIBGL_ALWAYS_SOFTWARE=1
/opt/DbSchema/DbSchema
```

**Problem**: DbSchema fails to connect to databases

**Solution**: When connecting to databases running on Windows from WSL, use the Windows host IP:

```bash
cat /etc/resolv.conf | grep nameserver
```

Use this IP address instead of `localhost` in your database connection settings.

**Problem**: Font rendering issues

**Solution**: Install additional fonts:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y fonts-dejavu fonts-liberation
```

---

### Git Bash (Windows)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git for Windows installed (provides Git Bash)
- PowerShell available (for initial installation)

Git Bash provides a Unix-compatible environment on Windows. Since DbSchema is a Windows application, it is installed on Windows and accessible from Git Bash.

Download Git for Windows from https://git-scm.com/downloads/win if not already installed.

#### Installation Steps

From Git Bash, use PowerShell to download and install DbSchema silently:

```bash
powershell.exe -Command "Invoke-WebRequest -Uri 'https://dbschema.com/download/dbschema_windows_10_0_2.msi' -OutFile '$env:TEMP\dbschema.msi'; Start-Process msiexec.exe -ArgumentList '/i', '$env:TEMP\dbschema.msi', '/qn', '/norestart' -Wait; Remove-Item '$env:TEMP\dbschema.msi'"
```

**Alternative: Using the EXE installer**

```bash
powershell.exe -Command "Invoke-WebRequest -Uri 'https://dbschema.com/download/dbschema_windows_10_0_2.exe' -OutFile '$env:TEMP\dbschema.exe'; Start-Process '$env:TEMP\dbschema.exe' -ArgumentList '-q' -Wait; Remove-Item '$env:TEMP\dbschema.exe'"
```

After installation, close and reopen Git Bash for any PATH updates to take effect.

#### Verification

Verify the installation by checking for the executable:

```bash
ls "/c/Program Files/DbSchema/DbSchema.exe"
```

Expected output:

```
'/c/Program Files/DbSchema/DbSchema.exe'
```

Launch DbSchema from Git Bash:

```bash
"/c/Program Files/DbSchema/DbSchema.exe" &
```

Or use the Windows `start` command:

```bash
cmd.exe /c start "" "DbSchema"
```

#### Troubleshooting

**Problem**: PowerShell command fails from Git Bash

**Solution**: Use the full path to PowerShell:

```bash
"/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" -Command "..."
```

**Problem**: DbSchema executable not found at expected location

**Solution**: Search for the installation directory:

```bash
find "/c/Program Files" -name "DbSchema.exe" 2>/dev/null
```

**Problem**: Cannot launch DbSchema from Git Bash

**Solution**: Use the Windows command processor:

```bash
cmd.exe /c start "" "C:\Program Files\DbSchema\DbSchema.exe"
```

**Problem**: Git Bash terminal hangs when launching DbSchema

**Solution**: Run DbSchema in the background to return control to the terminal:

```bash
"/c/Program Files/DbSchema/DbSchema.exe" &
disown
```

---

## Post-Installation Configuration

### First-Time Setup

After installing and launching DbSchema on any platform:

1. **License Activation** - DbSchema starts with a 15-day Pro trial. After the trial, you can continue using the free Community Edition or purchase a Pro license.

2. **Connect to a Database** - Click "Connect to Database" and select your database type. DbSchema will automatically download the appropriate JDBC driver.

3. **Create or Import Schema** - Either connect to an existing database to reverse-engineer its schema, or create a new schema from scratch.

### JDBC Driver Management

DbSchema automatically downloads JDBC drivers when you first connect to a database type. Drivers are stored in:

- **macOS**: `~/Library/DbSchema/drivers/`
- **Linux**: `~/.DbSchema/drivers/`
- **Windows**: `%USERPROFILE%\.DbSchema\drivers\`

To manually add a driver, use the menu: Help > Download and Register JDBC Driver.

### Headless/CLI Mode

DbSchema includes a command-line interface (DbSchemaCLI) for automation. Common operations include:

```bash
# Connect to a database
dbschemacli connection mydb postgresql "host=localhost&port=5432&database=myapp"
dbschemacli connect mydb

# Execute SQL queries
dbschemacli spool /tmp/output.csv
# ... run queries ...
dbschemacli spool off

# Generate documentation
# (Use the GUI for documentation generation)
```

### Project Files

DbSchema saves projects as `.dbs` files which contain:
- Schema definitions
- Layout information
- Connection settings (credentials can be excluded for security)
- Documentation notes

Store `.dbs` files in version control to track schema changes over time.

---

## Common Issues

### Issue: Database Connection Fails

**Symptoms**: Cannot connect to database, timeout errors, or authentication failures.

**Solution**:
1. Verify the database server is running and accessible
2. Check firewall rules allow the connection
3. Verify credentials are correct
4. Ensure the JDBC driver is downloaded (Help > Download and Register JDBC Driver)
5. For SSL connections, configure SSL settings in the connection dialog

### Issue: Slow Performance with Large Schemas

**Symptoms**: DbSchema becomes slow or unresponsive with databases containing many tables.

**Solution**:
1. Use schema filters to load only relevant tables
2. Increase heap memory by editing the DbSchema configuration
3. Close unused diagrams and layouts
4. Consider splitting large schemas into multiple DbSchema projects

### Issue: Diagram Export Quality Issues

**Symptoms**: Exported images are blurry or low resolution.

**Solution**:
1. Use vector formats (SVG, PDF) instead of raster formats (PNG, JPG)
2. For PNG export, increase the DPI setting in export options
3. Zoom to 100% before exporting to ensure proper scaling

### Issue: Schema Comparison Shows Unexpected Differences

**Symptoms**: Schema comparison shows differences that do not exist or misses actual differences.

**Solution**:
1. Ensure both schemas are fully loaded (wait for loading to complete)
2. Check comparison settings - some differences may be filtered out
3. Refresh both schemas before comparing
4. Verify you are comparing the correct database/schema names

### Issue: DbSchema Uses Wrong Java Version

**Symptoms**: Startup errors mentioning Java version incompatibility.

**Solution**: DbSchema bundles its own JRE and should not use the system Java. If issues occur:

1. Check for conflicting JAVA_HOME settings:

```bash
echo $JAVA_HOME
```

2. Temporarily unset JAVA_HOME:

```bash
unset JAVA_HOME
/opt/DbSchema/DbSchema
```

3. If the bundled JRE is corrupted, reinstall DbSchema.

---

## Uninstallation

### macOS

```bash
brew uninstall --cask dbschema
rm -rf ~/Library/Application\ Support/DbSchema
rm -rf ~/Library/Caches/DbSchema
rm -rf ~/Library/DbSchema
```

### Ubuntu/Debian

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y dbschema
rm -rf ~/.DbSchema
rm -rf ~/.local/share/applications/dbschema.desktop
```

### Raspberry Pi OS

```bash
sudo rm -rf /opt/DbSchema
rm -rf ~/.DbSchema
rm -rf ~/.local/share/applications/dbschema.desktop
```

### Amazon Linux/RHEL

```bash
sudo dnf remove -y dbschema
rm -rf ~/.DbSchema
```

Or for YUM-based systems:

```bash
sudo yum remove -y dbschema
rm -rf ~/.DbSchema
```

### Windows

Using PowerShell (as Administrator):

```powershell
Start-Process msiexec.exe -ArgumentList "/x", "{product-code}", "/qn" -Wait
Remove-Item -Path "$env:USERPROFILE\.DbSchema" -Recurse -Force
```

Or use the Windows "Add or Remove Programs" interface to uninstall DbSchema, then manually delete the `.DbSchema` folder from your user profile.

---

## References

- [DbSchema Official Website](https://dbschema.com/)
- [DbSchema Download Page](https://dbschema.com/download.html)
- [DbSchema Documentation](https://dbschema.com/documentation/)
- [DbSchema FAQ](https://dbschema.com/faq.html)
- [DbSchema Technical Support](https://dbschema.com/support.html)
- [DbSchema Homebrew Cask](https://formulae.brew.sh/cask/dbschema)
- [DbSchema Blog - Cross-Platform Support](https://dbschema.com/blog/dbschema-features/dbschema-cross-platform-support/)
- [DbSchemaCLI Documentation](https://dbschema.com/documentation/dbschemacli.html)
- [install4j Silent Installation Options](https://www.ej-technologies.com/resources/install4j/help/doc/installers/options.html)
