# Installing Keyboard Maestro

## Overview

Keyboard Maestro is a powerful macro and automation application for macOS developed by Stairways Software. It enables users to automate virtually any task on their Mac by creating macros that can be triggered by hotkeys, typed strings, application launches, time schedules, and many other triggers. With hundreds of built-in actions including flow control, conditions, looping, and the ability to execute AppleScript, JavaScript for Automation (JXA), and shell scripts, Keyboard Maestro is considered one of the most comprehensive automation tools available for macOS.

Key capabilities include:

- **Visual Macro Editor**: Create complex automations without coding using a drag-and-drop interface
- **Trigger Flexibility**: Launch macros via hotkeys, typed text, application events, time schedules, USB device connections, and more
- **Text Expansion**: Create snippets and templates that expand when triggered
- **Clipboard Management**: Multiple named clipboards and clipboard history
- **Window Management**: Control window positions, sizes, and arrangements
- **Application Control**: Automate menu selections, button clicks, and UI interactions
- **Web Automation**: Fill forms, click buttons, and extract data from web pages

**Important Platform Limitation:** Keyboard Maestro is a **macOS-only** application. There is no official version for Windows, Linux, or any other operating system. Stairways Software has no plans to create versions for other platforms. For other platforms, this documentation covers equivalent automation tools that provide similar functionality.

| Platform | Tool | Description |
|----------|------|-------------|
| macOS | Keyboard Maestro | Stairways Software's comprehensive macro/automation utility |
| Windows | AutoHotkey | Open-source scripting language for Windows automation |
| Linux | AutoKey | Desktop automation utility for Linux and X11 |

## Prerequisites

Before installing automation tools on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required for system-wide installation
3. **Sufficient disk space** - At least 100 MB for installation

---

## Platform-Specific Installation

### macOS (Homebrew)

Keyboard Maestro is the native macOS automation solution and is available as a Homebrew cask.

#### Prerequisites

- macOS 10.13 (High Sierra) or later (macOS 10.15 Catalina or later recommended)
- Homebrew package manager installed
- 64-bit processor (Intel or Apple Silicon natively supported)
- Valid license for full functionality (trial available)

Verify Homebrew is installed:

```bash
brew --version
```

If Homebrew is not installed, install it first using `dev install homebrew` or run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Keyboard Maestro:

```bash
brew install --cask --quiet keyboard-maestro
```

**Explanation of flags:**
- `--cask`: Indicates this is a macOS application (not a CLI formula)
- `--quiet`: Suppresses non-essential output for non-interactive installation

The installation downloads Keyboard Maestro and installs it to `/Applications/Keyboard Maestro.app`.

#### Verification

Confirm the installation succeeded:

```bash
ls -la "/Applications/Keyboard Maestro.app" && echo "Keyboard Maestro is installed"
```

You can also verify by checking the Homebrew list:

```bash
brew list --cask | grep keyboard-maestro
```

#### Troubleshooting

**Installation fails with permission errors:**

```bash
# Reset Homebrew cask cache and retry
brew cleanup
brew install --cask --quiet keyboard-maestro
```

**Keyboard Maestro fails to open with "cannot be opened" error:**

This occurs when macOS Gatekeeper blocks the application:

```bash
xattr -cr "/Applications/Keyboard Maestro.app"
```

**Keyboard Maestro requires Accessibility permissions:**

On first launch, Keyboard Maestro will request Accessibility permissions. This is required for the application to control other applications and respond to global hotkeys. Grant access via:

1. Open System Settings (or System Preferences on older macOS)
2. Navigate to Privacy & Security > Accessibility
3. Enable the toggle for Keyboard Maestro

To automate granting Accessibility permissions (requires admin privileges and disabling SIP, not recommended for most users):

```bash
# View current Accessibility database (informational only)
sudo sqlite3 "/Library/Application Support/com.apple.TCC/TCC.db" "SELECT * FROM access WHERE service='kTCCServiceAccessibility';"
```

**Upgrading from a previous version:**

```bash
brew upgrade --cask keyboard-maestro
```

---

### Ubuntu/Debian (APT)

**Keyboard Maestro is NOT available on Ubuntu or Debian.** It is a macOS-only application.

Use **AutoKey** as the equivalent automation tool for Linux. AutoKey is a desktop automation utility for Linux and X11 that provides text expansion and scripting capabilities similar to Keyboard Maestro.

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- X11 display server (AutoKey does not work with Wayland)
- sudo privileges
- Desktop environment (GNOME, KDE, XFCE, etc.)

**Important**: AutoKey requires X11 and will not function correctly when Wayland is in use. To check your display server:

```bash
echo $XDG_SESSION_TYPE
```

If it returns "wayland", you need to switch to X11 or use an alternative tool.

#### Installation Steps

Run the following commands to install AutoKey with the GTK interface (recommended for GNOME, MATE, Unity, Cinnamon):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y autokey-gtk
```

**For KDE Plasma, LXQt, or other Qt-based desktop environments**, install the Qt version instead:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y autokey-qt
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully unattended installation without prompts.

#### Verification

Confirm AutoKey installed successfully:

```bash
autokey-gtk --version 2>/dev/null || autokey-qt --version 2>/dev/null
```

Expected output (version numbers may vary):

```
autokey 0.95.10
```

Verify the application is available:

```bash
which autokey-gtk || which autokey-qt
```

#### Troubleshooting

**Problem**: `E: Unable to locate package autokey-gtk`

**Solution**: Update the package index and ensure universe repository is enabled:

```bash
sudo add-apt-repository universe -y
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y autokey-gtk
```

**Problem**: AutoKey crashes or fails to detect keypresses

**Solution**: AutoKey requires X11. If you are using Wayland, log out and select "Ubuntu on Xorg" (or similar X11 session) from the login screen.

**Problem**: AutoKey does not start automatically at login

**Solution**: Add AutoKey to startup applications:

```bash
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/autokey-gtk.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=AutoKey
Exec=autokey-gtk
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF
```

---

### Raspberry Pi OS (APT)

**Keyboard Maestro is NOT available on Raspberry Pi OS.** It is a macOS-only application.

Use **AutoKey** as the equivalent automation tool. The installation process is identical to Ubuntu/Debian since Raspberry Pi OS is Debian-based.

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye) with desktop environment
- Raspberry Pi 3 or later (earlier models have limited performance)
- X11 display server (default on Raspberry Pi OS)
- sudo privileges

**Note on ARM Architecture**: AutoKey is available pre-compiled for ARM architecture in the Raspberry Pi OS repositories. No special configuration is required.

#### Installation Steps

Run the following commands to install AutoKey:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y autokey-gtk
```

**Note**: The GTK version is recommended for Raspberry Pi OS as it uses the LXDE/LXQt desktop environment by default.

#### Verification

Confirm the installation succeeded:

```bash
autokey-gtk --version
```

Expected output (version numbers may vary):

```
autokey 0.95.10
```

Launch AutoKey to verify it works:

```bash
autokey-gtk &
```

#### Troubleshooting

**Problem**: AutoKey is slow or unresponsive on Raspberry Pi

**Solution**: AutoKey can be resource-intensive. On Raspberry Pi 3, close other applications when using AutoKey. Raspberry Pi 4 or 5 is recommended for better performance.

**Problem**: AutoKey does not detect keyboard input

**Solution**: Ensure you are running a full desktop session (not SSH or headless). AutoKey requires direct access to the X11 display:

```bash
# Verify X11 is running
echo $DISPLAY
```

If empty, you are not in a graphical session.

**Problem**: Package not found in Raspberry Pi OS Lite

**Solution**: Raspberry Pi OS Lite does not include a desktop environment. Install the full desktop first or use Raspberry Pi OS with desktop.

---

### Amazon Linux/RHEL (YUM/DNF)

**Keyboard Maestro is NOT available on Amazon Linux or RHEL.** It is a macOS-only application.

Amazon Linux and RHEL are primarily server operating systems without desktop environments by default. Desktop automation tools like Keyboard Maestro or AutoKey are not applicable to these platforms in typical use cases.

#### Prerequisites

- Amazon Linux 2, Amazon Linux 2023, RHEL 7/8/9, or compatible
- Desktop environment installed (optional, for GUI-based automation)
- sudo privileges

#### Installation Steps

**For headless/server automation**, use shell scripting, cron jobs, or systemd timers instead of GUI-based automation tools:

```bash
# Example: Create a simple automation script
cat > ~/automation-script.sh << 'EOF'
#!/bin/bash
# Your automation commands here
echo "Automated task executed at $(date)"
EOF
chmod +x ~/automation-script.sh

# Schedule with cron (runs every hour)
(crontab -l 2>/dev/null; echo "0 * * * * ~/automation-script.sh") | crontab -
```

**For desktop automation** (if a desktop environment is installed), AutoKey can be compiled from source:

**Step 1: Install dependencies (Amazon Linux 2023 / RHEL 8+)**

```bash
sudo dnf install -y python3 python3-pip python3-dbus python3-gobject gtk3 wmctrl
```

**Step 2: Install AutoKey via pip**

```bash
pip3 install --user autokey
```

**Note**: This method is not recommended for production servers. Amazon Linux is designed for server workloads, not desktop automation.

#### Verification

For shell-based automation:

```bash
crontab -l | grep automation-script && echo "Automation script scheduled"
```

#### Troubleshooting

**Problem**: No desktop environment available

**Solution**: Amazon Linux is a server OS. If you need GUI automation, consider using a different distribution with desktop support, or use headless automation techniques (shell scripts, APIs, etc.).

**Problem**: pip3 install fails with permission errors

**Solution**: Use the `--user` flag to install to your home directory:

```bash
pip3 install --user autokey
```

---

### Windows (Chocolatey/winget)

**Keyboard Maestro is NOT available on Windows.** It is a macOS-only application.

Use **AutoHotkey** as the equivalent automation tool for Windows. AutoHotkey is an open-source scripting language that allows automation of the Windows GUI and general scripting. It is the most popular Keyboard Maestro alternative for Windows users.

#### Prerequisites

- Windows 10 or later (64-bit recommended)
- Administrator PowerShell or Command Prompt
- Chocolatey or winget package manager installed

Verify Chocolatey is installed:

```powershell
choco --version
```

Or verify winget:

```powershell
winget --version
```

#### Installation Steps

**Install using Chocolatey (Recommended):**

Open PowerShell or Command Prompt as Administrator and run:

```powershell
choco install autohotkey -y
```

**Explanation of flags:**
- `-y`: Automatically confirms all prompts for non-interactive installation

**Install using winget:**

```powershell
winget install --id AutoHotkey.AutoHotkey --silent --accept-package-agreements --accept-source-agreements
```

**Explanation of flags:**
- `--id AutoHotkey.AutoHotkey`: Specifies the exact package identifier
- `--silent`: Suppresses the installer UI completely
- `--accept-package-agreements`: Automatically accepts the package license
- `--accept-source-agreements`: Automatically accepts the source terms

#### Verification

Open a new PowerShell or Command Prompt window (to refresh PATH), then verify:

```powershell
where AutoHotkey64.exe
```

Expected output:

```
C:\Program Files\AutoHotkey\v2\AutoHotkey64.exe
```

Or verify via Chocolatey:

```powershell
choco list autohotkey
```

#### Troubleshooting

**Problem**: `AutoHotkey64.exe` not found after installation

**Solution**: Open a new terminal window to refresh the PATH. If the issue persists, verify installation:

```powershell
# Check Chocolatey installation
choco list --local-only | findstr autohotkey

# Or check winget installation
winget list --id AutoHotkey.AutoHotkey
```

**Problem**: winget installation prompts for install location

**Solution**: This was a known issue in older AutoHotkey versions. Update to AutoHotkey v2.0.3 or later, or use Chocolatey instead:

```powershell
choco install autohotkey -y
```

**Problem**: Scripts do not run due to security policy

**Solution**: Right-click the .ahk file and select "Run as Administrator", or adjust your system's execution policies.

**Problem**: Need AutoHotkey v1 instead of v2

**Solution**: Install the legacy version via Chocolatey:

```powershell
choco install autohotkey.install --version=1.1.37.02 -y
```

---

### WSL (Ubuntu)

**Keyboard Maestro cannot run in WSL.** WSL runs a Linux environment where macOS applications are not compatible.

#### Recommended Approach

For automation needs in a WSL environment:

1. **For Linux automation within WSL**: Install AutoKey (if using WSLg or an X server)
2. **For Windows automation**: Install AutoHotkey on the Windows host

#### Prerequisites

- WSL 2 with Ubuntu installed
- WSLg (Windows 11) or X server configured for GUI applications
- sudo privileges within WSL

#### Installation Steps

**For GUI automation within WSL (requires WSLg or X server):**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y autokey-gtk
```

**To install AutoHotkey on the Windows host from within WSL:**

```bash
powershell.exe -Command "choco install autohotkey -y"
```

Or using winget:

```bash
powershell.exe -Command "winget install --id AutoHotkey.AutoHotkey --silent --accept-package-agreements --accept-source-agreements"
```

#### Verification

Verify AutoKey in WSL (if installed):

```bash
autokey-gtk --version
```

Check AutoHotkey on Windows host:

```bash
powershell.exe -Command "where.exe AutoHotkey64.exe"
```

#### Troubleshooting

**Problem**: AutoKey fails to launch with display errors

**Solution**: AutoKey requires an X11 display. On Windows 11 with WSLg, it should work automatically. On Windows 10, install an X server (VcXsrv or Xming) and export the display:

```bash
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
```

**Problem**: PowerShell command fails from WSL

**Solution**: Use the full path to PowerShell:

```bash
/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -Command "choco install autohotkey -y"
```

---

### Git Bash (Manual/Portable)

Git Bash runs within Windows, so use **AutoHotkey** for automation. AutoHotkey can be installed system-wide via Chocolatey (recommended) or as a portable installation.

#### Prerequisites

- Windows 10 or later
- Git Bash installed (comes with Git for Windows)
- Administrator privileges (for system installation) or write access to install directory (for portable)

#### Installation Steps

**Option A: Install via Chocolatey from Git Bash (Recommended)**

If Chocolatey is installed, run from Git Bash:

```bash
powershell.exe -Command "choco install autohotkey -y"
```

**Option B: Download portable version**

Download and extract AutoHotkey to a local directory:

```bash
# Create installation directory
mkdir -p "$HOME/Apps/AutoHotkey"

# Download AutoHotkey portable
curl -L -o "$HOME/Apps/AutoHotkey/AutoHotkey.zip" \
  "https://github.com/AutoHotkey/AutoHotkey/releases/download/v2.0.19/AutoHotkey_2.0.19.zip"

# Extract the archive
unzip -q "$HOME/Apps/AutoHotkey/AutoHotkey.zip" -d "$HOME/Apps/AutoHotkey/"

# Remove the zip file to save space
rm "$HOME/Apps/AutoHotkey/AutoHotkey.zip"

# Create alias for convenience
echo 'alias ahk="$HOME/Apps/AutoHotkey/AutoHotkey64.exe"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

**For system installation:**

```bash
powershell.exe -Command "where.exe AutoHotkey64.exe"
```

**For portable installation:**

```bash
if [[ -f "$HOME/Apps/AutoHotkey/AutoHotkey64.exe" ]]; then
  echo "AutoHotkey (portable) is installed"
else
  echo "AutoHotkey is NOT installed"
fi
```

Test AutoHotkey with a simple script:

```bash
# Create a test script
echo 'MsgBox "AutoHotkey is working!"' > /tmp/test.ahk

# Run the script (Windows will open a message box)
"$HOME/Apps/AutoHotkey/AutoHotkey64.exe" "$(cygpath -w /tmp/test.ahk)"
```

#### Troubleshooting

**Problem**: curl download fails

**Solution**: Use wget as an alternative:

```bash
wget -O "$HOME/Apps/AutoHotkey/AutoHotkey.zip" \
  "https://github.com/AutoHotkey/AutoHotkey/releases/download/v2.0.19/AutoHotkey_2.0.19.zip"
```

**Problem**: unzip not found

**Solution**: Extract using PowerShell:

```bash
powershell.exe -Command "Expand-Archive -Path '$HOME/Apps/AutoHotkey/AutoHotkey.zip' -DestinationPath '$HOME/Apps/AutoHotkey/' -Force"
```

**Problem**: AutoHotkey script does not run from Git Bash

**Solution**: Convert the path to Windows format using `cygpath`:

```bash
"$HOME/Apps/AutoHotkey/AutoHotkey64.exe" "$(cygpath -w /path/to/script.ahk)"
```

---

## Post-Installation Configuration

### macOS (Keyboard Maestro)

After installing Keyboard Maestro on macOS:

1. **Grant Accessibility Permissions**: On first launch, grant Accessibility permissions in System Settings > Privacy & Security > Accessibility. This is required for Keyboard Maestro to control other applications.

2. **Grant Automation Permissions**: When Keyboard Maestro attempts to control an application, macOS will prompt for permission. Grant access for each application you want to automate.

3. **License Activation**: Purchase a license from https://purchase.keyboardmaestro.com/ (US$36) or continue with the trial. The trial is fully functional but displays a reminder dialog.

4. **Enable the Keyboard Maestro Engine**: Ensure the Keyboard Maestro Engine is running (appears in the menu bar). This background process is required for macros to trigger.

5. **Import Macros**: If migrating from another machine, import your macro library via File > Import Macros.

### Windows (AutoHotkey)

After installing AutoHotkey on Windows:

1. **Create Your First Script**: AutoHotkey scripts use the `.ahk` extension. Create a file named `MyScript.ahk`:

```autohotkey
; Example: Press Win+N to open Notepad
#n::Run "notepad.exe"

; Example: Text expansion - type "btw" to expand to "by the way"
::btw::by the way
```

2. **Run Scripts at Startup**: Place your .ahk files in the Startup folder:

```powershell
# Open the Startup folder
explorer shell:startup
```

3. **Compile Scripts (Optional)**: Convert .ahk scripts to standalone .exe files using the AutoHotkey compiler (Ahk2Exe) included with the installation.

### Linux (AutoKey)

After installing AutoKey on Linux:

1. **First Launch**: Launch AutoKey from your application menu or run `autokey-gtk` (or `autokey-qt`).

2. **Create Phrases**: For text expansion, create a new phrase in the AutoKey window.

3. **Create Scripts**: For complex automation, create Python scripts that can simulate keypresses, mouse clicks, and more.

4. **Configure Autostart**: Enable AutoKey to start automatically at login through the application preferences or by creating a .desktop file.

---

## Common Issues

### Cross-Platform Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Package manager not found | Package manager not installed | Install the appropriate package manager for your platform first |
| Permission denied | Insufficient privileges | Run commands with sudo (Linux/macOS) or as Administrator (Windows) |
| Download fails | Network connectivity issues | Check internet connection; try alternative download sources |

### macOS-Specific Issues (Keyboard Maestro)

| Issue | Solution |
|-------|----------|
| "Keyboard Maestro Engine is not running" | Launch Keyboard Maestro.app; the Engine starts automatically |
| Macros do not trigger | Grant Accessibility permissions in System Settings > Privacy & Security |
| Application control fails | Grant Automation permissions when prompted by macOS |
| Homebrew cask outdated | Run `brew update && brew upgrade --cask keyboard-maestro` |

### Windows-Specific Issues (AutoHotkey)

| Issue | Solution |
|-------|----------|
| Scripts blocked by antivirus | Add AutoHotkey to antivirus exclusions |
| Hotkeys do not work in elevated apps | Run AutoHotkey script as Administrator |
| v1 scripts fail in v2 | AutoHotkey v2 has different syntax; use v1 for legacy scripts |

### Linux-Specific Issues (AutoKey)

| Issue | Solution |
|-------|----------|
| AutoKey does not start | Ensure X11 is running (not Wayland); check `echo $XDG_SESSION_TYPE` |
| Phrases do not expand | Verify trigger phrase and ensure AutoKey is running in system tray |
| Permission errors | Add user to `input` group: `sudo usermod -aG input $USER` |

---

## Feature Comparison

| Feature | Keyboard Maestro (macOS) | AutoHotkey (Windows) | AutoKey (Linux) |
|---------|--------------------------|----------------------|-----------------|
| GUI Macro Editor | Yes (visual) | No (text-based) | Yes (basic) |
| Text Expansion | Yes | Yes | Yes |
| Hotkey Triggers | Yes | Yes | Yes |
| Application Triggers | Yes | Limited | Limited |
| Time-Based Triggers | Yes | Via Windows Task Scheduler | Via cron |
| Mouse Automation | Yes | Yes | Yes |
| Window Management | Yes | Yes | Limited |
| Scripting Language | AppleScript, JXA, Shell | AutoHotkey Script | Python |
| Price | US$36 (one-time) | Free (open source) | Free (open source) |

---

## References

### macOS (Keyboard Maestro)

- [Keyboard Maestro Official Website](https://www.keyboardmaestro.com/main/)
- [Keyboard Maestro Download Page](https://www.stairways.com/main/download)
- [Keyboard Maestro Homebrew Cask](https://formulae.brew.sh/cask/keyboard-maestro)
- [Keyboard Maestro Wiki](https://wiki.keyboardmaestro.com/)
- [Keyboard Maestro Forum](https://forum.keyboardmaestro.com/)
- [Stairways Software](https://www.stairways.com/main/)

### Windows (AutoHotkey)

- [AutoHotkey Official Website](https://www.autohotkey.com/)
- [AutoHotkey Documentation](https://www.autohotkey.com/docs/v2/)
- [AutoHotkey GitHub Repository](https://github.com/AutoHotkey/AutoHotkey)
- [AutoHotkey Chocolatey Package](https://community.chocolatey.org/packages/autohotkey)
- [AutoHotkey winget Package](https://winget.run/pkg/AutoHotkey/AutoHotkey)
- [AutoHotkey Forum](https://www.autohotkey.com/boards/)

### Linux (AutoKey)

- [AutoKey GitHub Repository](https://github.com/autokey/autokey)
- [AutoKey Installation Guide](https://github.com/autokey/autokey/wiki/Installing)
- [AutoKey Ubuntu Package](https://packages.ubuntu.com/autokey)

### Alternatives and Comparisons

- [Keyboard Maestro Alternatives (AlternativeTo)](https://alternativeto.net/software/keyboard-maestro/)
- [Keyboard Maestro Forum - Windows Alternatives Discussion](https://forum.keyboardmaestro.com/t/keyboard-maestro-alternatives-for-windows/35013)
