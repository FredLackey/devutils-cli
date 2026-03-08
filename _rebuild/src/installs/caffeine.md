# Installing Caffeine

## Overview

Caffeine is a utility that prevents your computer from going to sleep, activating the screensaver, or dimming the screen. It is invaluable when you need your computer to stay awake during long-running processes like downloads, presentations, video playback, or software builds. Different implementations exist for each operating system, but they all serve the same core purpose: keeping your machine awake on demand.

On macOS, Caffeine is a lightweight menu bar application. On Linux, Caffeine is typically a GNOME Shell extension or a system tray indicator. On Windows, Caffeine is a portable utility that simulates keypresses to prevent idle detection.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None

### Ubuntu (APT/Snap)
- **Required:** None (systemd-inhibit is pre-installed on all systemd-based systems)
- **Optional:**
  - GNOME Shell - Install via `sudo apt install gnome-shell` (required for gnome-shell-extension-caffeine)
  - gnome-extensions CLI tool - Install via `sudo apt install gnome-shell-extensions` (required to enable the GNOME extension)
- **Auto-installed:** None

### Raspberry Pi OS (APT/Snap)
- **Required:** None (xset and systemd-inhibit are pre-installed)
- **Optional:** None
- **Auto-installed:** None

### Amazon Linux (DNF/YUM)
- **Required:** None (systemd-inhibit is pre-installed on all systemd-based systems)
- **Optional:**
  - GNOME Shell - Install via `sudo dnf install gnome-shell` or `sudo yum install gnome-shell` (required for GNOME extension, if available in repositories)
- **Auto-installed:** None

### Windows (Chocolatey/winget)
- **Required:**
  - Chocolatey - Install via PowerShell as Administrator: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
- **Optional:** None
- **Auto-installed:** None

### Git Bash (Manual/Portable)
- **Required:**
  - Windows Caffeine installation - See Windows section above for installation via Chocolatey or manual download from https://www.zhornsoftware.co.uk/caffeine/
- **Optional:**
  - Chocolatey - Install via PowerShell as Administrator (enables automated installation from Git Bash)
- **Auto-installed:** None

## Prerequisites

Before installing Caffeine on any platform, ensure:

1. **Internet connectivity** - Required to download the package or installer
2. **Administrative privileges** - Required on most platforms for system-wide installation
3. **Desktop environment** - Caffeine requires a graphical desktop environment on all platforms (it is not useful on headless servers)

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager installed
- A graphical desktop session (not SSH-only)

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Caffeine:

```bash
brew install --cask --quiet caffeine
```

The `--cask` flag specifies that this is a macOS application (not a command-line formula). The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts.

**Note**: macOS also includes a built-in command-line utility called `caffeinate` that provides similar functionality without requiring any installation. Use `caffeinate` in Terminal to prevent sleep while the command runs, or `caffeinate -d` to prevent display sleep specifically.

#### Verification

Confirm the installation succeeded by checking that the application exists:

```bash
ls -la /Applications/Caffeine.app
```

Expected output:

```
drwxr-xr-x@ 3 user  staff  96 Jan  1 12:00 /Applications/Caffeine.app
```

Alternatively, launch Caffeine from Spotlight (Cmd+Space, then type "Caffeine") and verify a coffee cup icon appears in the menu bar.

#### Troubleshooting

**Problem**: `Error: Cask 'caffeine' is unavailable`

**Solution**: Update Homebrew to get the latest cask definitions:

```bash
brew update
```

**Problem**: Installation requires password but script cannot prompt

**Solution**: Homebrew cask installations may require authentication. Pre-authenticate with sudo before running:

```bash
sudo -v && brew install --cask --quiet caffeine
```

**Problem**: Caffeine does not appear in menu bar after installation

**Solution**: Launch the application manually:

```bash
open /Applications/Caffeine.app
```

To make Caffeine start automatically at login, add it to Login Items in System Preferences > Users & Groups > Login Items.

**Problem**: macOS Gatekeeper blocks the application

**Solution**: Approve the application in System Preferences > Security & Privacy > General, or run:

```bash
xattr -dr com.apple.quarantine /Applications/Caffeine.app
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 or later, or Debian 10 or later
- GNOME desktop environment (GNOME Shell)
- sudo privileges

**Note**: The `gnome-shell-extension-caffeine` package is available in the Ubuntu Universe repository for Ubuntu 20.04 (Focal) and earlier. For Ubuntu 22.04+ and Debian 11+, use the command-line alternative `systemd-inhibit` documented below.

#### Installation Steps

For Ubuntu 20.04 LTS and Debian 10/11 with GNOME:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnome-shell-extension-caffeine
```

After installation, enable the extension:

```bash
gnome-extensions enable caffeine@patapon.info
```

**Note**: You may need to log out and log back in for the extension to appear in the GNOME Shell top bar.

**For Ubuntu 22.04+ and newer Debian versions**, the GNOME Shell extension package may not be available or compatible. Use `systemd-inhibit` instead, which is pre-installed on all systemd-based systems:

```bash
# Prevent sleep indefinitely (press Ctrl+C to stop)
systemd-inhibit --what=idle:sleep:shutdown sleep infinity
```

For background usage in scripts:

```bash
# Run a command while preventing sleep
systemd-inhibit --what=idle:sleep your-long-running-command
```

#### Verification

For the GNOME extension, verify the extension is installed and enabled:

```bash
gnome-extensions list | grep caffeine
```

Expected output:

```
caffeine@patapon.info
```

Check extension status:

```bash
gnome-extensions info caffeine@patapon.info
```

For `systemd-inhibit`, verify it is available:

```bash
which systemd-inhibit
```

Expected output:

```
/usr/bin/systemd-inhibit
```

#### Troubleshooting

**Problem**: `E: Unable to locate package gnome-shell-extension-caffeine`

**Solution**: The package is in the Universe repository (Ubuntu) or main repository (Debian). Enable Universe on Ubuntu:

```bash
sudo DEBIAN_FRONTEND=noninteractive add-apt-repository -y universe && sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

If the package is still unavailable, your Ubuntu/Debian version may be too new. Use `systemd-inhibit` instead.

**Problem**: Extension installed but not visible in GNOME Shell

**Solution**: Restart GNOME Shell by logging out and logging back in. On Xorg sessions, you can restart the shell with Alt+F2, then type `r` and press Enter.

**Problem**: `gnome-extensions: command not found`

**Solution**: Install the GNOME extensions CLI tool:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnome-shell-extensions
```

**Problem**: Extension does not work after GNOME upgrade

**Solution**: The extension may be incompatible with your GNOME Shell version. Check the extension version compatibility:

```bash
gnome-shell --version
```

If incompatible, use `systemd-inhibit` as the alternative.

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS with desktop (not Lite)
- Raspberry Pi 3B+ or later recommended
- sudo privileges

**Important**: Raspberry Pi OS uses the LXDE or Wayfire desktop environment by default, not GNOME. The GNOME Shell extension will not work. Use command-line alternatives instead.

#### Installation Steps

Raspberry Pi OS includes `xset` for managing display power settings and `systemd-inhibit` for preventing system sleep. No additional installation is required.

To prevent the display from sleeping, run:

```bash
xset s off -dpms
```

This command:
- `s off` - Disables the screensaver
- `-dpms` - Disables Display Power Management Signaling (prevents monitor sleep)

To prevent system sleep while running a long process:

```bash
systemd-inhibit --what=idle:sleep your-long-running-command
```

For persistent display-on settings, add the xset command to autostart. Create or edit the autostart file:

```bash
mkdir -p ~/.config/lxsession/LXDE-pi
echo "@xset s off -dpms" >> ~/.config/lxsession/LXDE-pi/autostart
```

#### Verification

Verify display power management is disabled:

```bash
xset q | grep -A2 "DPMS"
```

Expected output when DPMS is disabled:

```
DPMS (Energy Star):
  DPMS is Disabled
```

Verify `systemd-inhibit` is available:

```bash
which systemd-inhibit
```

Expected output:

```
/usr/bin/systemd-inhibit
```

#### Troubleshooting

**Problem**: `xset: unable to open display ""`

**Solution**: You are running in a non-graphical session (SSH). The command must be run from the desktop environment. If you need to set this remotely, specify the display:

```bash
DISPLAY=:0 xset s off -dpms
```

**Problem**: Screen still blanks after running xset commands

**Solution**: Raspberry Pi OS may have additional blanking settings in the desktop preferences. Open Raspberry Pi Configuration > Display and disable "Screen Blanking", or run:

```bash
sudo raspi-config nonint do_blanking 1
```

(Note: `1` disables blanking in raspi-config)

**Problem**: Settings reset after reboot

**Solution**: Ensure the autostart file is correctly configured. Verify the file exists and contains the xset command:

```bash
cat ~/.config/lxsession/LXDE-pi/autostart
```

Alternatively, add to `/etc/xdg/lxsession/LXDE-pi/autostart` for system-wide settings (requires sudo).

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 or Amazon Linux 2
- Desktop environment installed (Amazon Linux is typically headless by default)
- sudo privileges

**Important**: Amazon Linux is primarily designed for server workloads and does not typically include a desktop environment. If you are running Amazon Linux as a desktop or need to prevent system sleep on a server, use `systemd-inhibit`.

#### Installation Steps

Amazon Linux includes `systemd-inhibit` by default. No installation is required.

To prevent system sleep while running a command:

```bash
systemd-inhibit --what=idle:sleep:shutdown your-long-running-command
```

To prevent sleep indefinitely (useful during maintenance):

```bash
systemd-inhibit --what=idle:sleep:shutdown sleep infinity &
```

To run in the background and later stop:

```bash
# Start inhibiting (save the PID)
systemd-inhibit --what=idle:sleep:shutdown sleep infinity &
INHIBIT_PID=$!

# Your long-running work here...

# Stop inhibiting
kill $INHIBIT_PID
```

If you have a desktop environment installed (such as GNOME), you can install the GNOME extension:

```bash
sudo dnf install -y gnome-shell-extension-caffeine 2>/dev/null || echo "GNOME extension not available, use systemd-inhibit"
```

**Note**: The GNOME extension package may not be available in the default Amazon Linux repositories. Use `systemd-inhibit` as the primary method.

#### Verification

Verify `systemd-inhibit` is available:

```bash
which systemd-inhibit
```

Expected output:

```
/usr/bin/systemd-inhibit
```

List current inhibitors:

```bash
systemd-inhibit --list
```

This shows all processes currently preventing sleep or shutdown.

#### Troubleshooting

**Problem**: `systemd-inhibit: command not found`

**Solution**: This should not occur on Amazon Linux 2023 or AL2 as systemd is the init system. Verify systemd is running:

```bash
ps -p 1 -o comm=
```

Expected output: `systemd`

**Problem**: System still sleeps despite inhibitor

**Solution**: Check if the inhibitor is active:

```bash
systemd-inhibit --list
```

If your inhibitor is not listed, the process may have exited. Use `sleep infinity` to keep the inhibitor running.

**Problem**: Need to prevent sleep during EC2 instance maintenance

**Solution**: EC2 instances do not have traditional sleep/suspend mechanisms. The instance will remain running unless explicitly stopped. For long-running processes, use `nohup` or `screen`/`tmux` instead:

```bash
nohup your-long-running-command &
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or Windows 11
- Chocolatey package manager installed
- Administrator PowerShell or Command Prompt

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install caffeine -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

Caffeine will be installed to `C:\ProgramData\chocolatey\lib\caffeine\tools\` and a shortcut may be created in the Start Menu.

#### Verification

Confirm the installation succeeded:

```powershell
choco list --local-only | findstr caffeine
```

Expected output:

```
caffeine 1.98.0
```

Verify the executable exists:

```powershell
dir "C:\ProgramData\chocolatey\lib\caffeine\tools\caffeine.exe"
```

Launch Caffeine to verify it works:

```powershell
Start-Process "C:\ProgramData\chocolatey\lib\caffeine\tools\caffeine.exe"
```

A coffee cup icon should appear in the system tray.

#### Troubleshooting

**Problem**: `choco: The term 'choco' is not recognized`

**Solution**: Chocolatey is not installed or not in PATH. Close all terminal windows, open a new Administrator PowerShell, and verify Chocolatey is installed:

```powershell
Get-Command choco
```

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell as Administrator. Right-click PowerShell and select "Run as administrator".

**Problem**: Caffeine does not appear in system tray after launching

**Solution**: The system tray may be hiding the icon. Click the up arrow (^) in the system tray to show hidden icons. To always show the Caffeine icon, right-click the taskbar > Taskbar settings > Select which icons appear on the taskbar.

**Problem**: Caffeine does not prevent sleep on corporate/managed computers

**Solution**: Group Policy may override Caffeine's ability to prevent sleep. Contact your IT administrator, or use the built-in PowerShell command as an alternative:

```powershell
# Prevent sleep for 8 hours (28800 seconds)
powercfg -change -standby-timeout-ac 0
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows Subsystem for Linux with Ubuntu installed
- WSL 2 recommended
- sudo privileges within WSL

**Important**: WSL runs in a virtualized Linux environment that does not have direct control over Windows power management. To prevent your Windows host from sleeping, you must use Windows-native tools (see Windows section). WSL tools like `systemd-inhibit` will only affect the WSL environment, not the host.

#### Installation Steps

If you need to prevent the WSL session itself from timing out or being affected by Windows sleep, install `systemd-inhibit` support:

```bash
# Ensure systemd is enabled in WSL (WSL 2 only)
# Check if systemd is running:
ps -p 1 -o comm=
```

If the output is `systemd`, you can use `systemd-inhibit`:

```bash
systemd-inhibit --what=idle:sleep your-long-running-command
```

If systemd is not running (output is `init`), enable it by creating or editing `/etc/wsl.conf`:

```bash
sudo tee /etc/wsl.conf > /dev/null << 'EOF'
[boot]
systemd=true
EOF
```

Then restart WSL from PowerShell:

```powershell
wsl --shutdown
```

After restarting WSL, `systemd-inhibit` will be available.

**For preventing Windows host sleep from WSL**, call the Windows Caffeine executable:

```bash
# If Caffeine is installed on Windows via Chocolatey:
/mnt/c/ProgramData/chocolatey/lib/caffeine/tools/caffeine.exe &
```

#### Verification

Verify systemd is running:

```bash
ps -p 1 -o comm=
```

Expected output for systemd-enabled WSL:

```
systemd
```

Verify `systemd-inhibit` is available:

```bash
which systemd-inhibit
```

Expected output:

```
/usr/bin/systemd-inhibit
```

#### Troubleshooting

**Problem**: `systemd-inhibit: command not found`

**Solution**: Systemd is not enabled in WSL. Follow the steps above to enable systemd in `/etc/wsl.conf` and restart WSL.

**Problem**: Windows still sleeps even with WSL inhibitor active

**Solution**: WSL inhibitors do not affect the Windows host. Install and run Caffeine on Windows (see Windows section), or use Windows power settings to disable sleep.

**Problem**: WSL session terminates when Windows sleeps

**Solution**: Configure Windows to never sleep when on AC power:

```powershell
# Run in Windows PowerShell as Administrator
powercfg -change -standby-timeout-ac 0
```

Or install Windows Caffeine and run it before starting long WSL processes.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11
- Git Bash installed (comes with Git for Windows)
- Caffeine installed on Windows (see Windows section above)

**Note**: Git Bash runs on Windows and does not have its own power management. Use Windows Caffeine, which will be accessible from Git Bash once installed.

#### Installation Steps

Git Bash inherits the Windows PATH and can access Windows executables. First, install Caffeine on Windows using Chocolatey (from an Administrator Command Prompt or PowerShell):

```bash
# From Git Bash, call Windows choco.exe
/c/ProgramData/chocolatey/bin/choco.exe install caffeine -y
```

Alternatively, download Caffeine manually:

```bash
# Download Caffeine to a local directory
curl -L -o ~/caffeine.zip "https://www.zhornsoftware.co.uk/caffeine/caffeine.zip"

# Extract (requires unzip or use Windows built-in)
mkdir -p ~/bin
unzip -o ~/caffeine.zip -d ~/bin/

# The executable is now at ~/bin/caffeine64.exe or ~/bin/caffeine.exe
```

After installation, you can launch Caffeine from Git Bash:

```bash
# If installed via Chocolatey:
/c/ProgramData/chocolatey/lib/caffeine/tools/caffeine.exe &

# If downloaded manually:
~/bin/caffeine64.exe &
```

#### Verification

Verify Caffeine is accessible from Git Bash:

```bash
# Check if Chocolatey version exists:
ls -la /c/ProgramData/chocolatey/lib/caffeine/tools/caffeine.exe

# Or check manual download:
ls -la ~/bin/caffeine*.exe
```

Launch Caffeine and verify the system tray icon appears:

```bash
/c/ProgramData/chocolatey/lib/caffeine/tools/caffeine.exe &
```

#### Troubleshooting

**Problem**: `No such file or directory` when launching caffeine.exe

**Solution**: Caffeine may not be installed. Install via Chocolatey from an Administrator prompt:

```bash
# Open Windows Command Prompt as Administrator and run:
choco install caffeine -y
```

Then retry from Git Bash.

**Problem**: Git Bash cannot find Windows executables

**Solution**: Ensure Windows PATH is inherited. Check your Git Bash PATH:

```bash
echo $PATH | tr ':' '\n' | grep -i windows
```

If Windows paths are not present, add them to your `~/.bashrc`:

```bash
echo 'export PATH=$PATH:/c/ProgramData/chocolatey/bin' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Caffeine runs but does not prevent sleep

**Solution**: Caffeine must remain running to prevent sleep. Use the `&` to background the process, or launch it from Windows Start Menu for persistent operation. To run at startup, add Caffeine to Windows Startup folder.

**Problem**: Want command-line control without GUI

**Solution**: Windows Caffeine supports command-line arguments. Run with `-startoff` to start disabled, or specify a timeout:

```bash
# Start Caffeine but disabled (click icon to enable)
/c/ProgramData/chocolatey/lib/caffeine/tools/caffeine.exe -startoff &

# Run for 2 hours then exit (7200 seconds)
/c/ProgramData/chocolatey/lib/caffeine/tools/caffeine.exe -exitafter:120 &
```

---

## Post-Installation Configuration

### macOS

To make Caffeine start automatically at login:

1. Open System Preferences > Users & Groups
2. Select your user account
3. Click the "Login Items" tab
4. Click the "+" button and add `/Applications/Caffeine.app`

Alternatively, use the command line:

```bash
osascript -e 'tell application "System Events" to make login item at end with properties {path:"/Applications/Caffeine.app", hidden:false}'
```

### Linux (GNOME Extension)

The GNOME Caffeine extension can be configured to automatically activate when certain applications are running (e.g., video players). Access settings via:

```bash
gnome-extensions prefs caffeine@patapon.info
```

Or through GNOME Extensions application if installed.

### Windows

To make Caffeine start automatically at login:

1. Press Win+R, type `shell:startup`, and press Enter
2. Create a shortcut to `C:\ProgramData\chocolatey\lib\caffeine\tools\caffeine.exe` in this folder

Or use the command line in an Administrator PowerShell:

```powershell
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Caffeine.lnk")
$Shortcut.TargetPath = "C:\ProgramData\chocolatey\lib\caffeine\tools\caffeine.exe"
$Shortcut.Save()
```

---

## Common Issues

### Issue: Computer Still Sleeps Despite Caffeine Running

**Symptoms**: Caffeine appears to be active, but the computer still enters sleep mode.

**Solution**:
1. Verify Caffeine is actually running and enabled (check for active/full coffee cup icon)
2. On macOS, check System Preferences > Battery > Power Adapter and ensure sleep timer is not overriding Caffeine
3. On Windows, check Power Options in Control Panel for conflicting settings
4. On Linux, check if another power management service is overriding the inhibitor

### Issue: Caffeine Prevents Sleep Even When Disabled

**Symptoms**: After disabling Caffeine, the computer still does not sleep.

**Solution**:
1. Completely quit/exit Caffeine (not just disable)
2. On macOS, use Cmd+Q or right-click the menu bar icon and select "Quit"
3. On Windows, right-click the system tray icon and select "Exit"
4. On Linux, disable the extension or kill the process: `killall caffeine`

### Issue: Multiple Caffeine-Like Tools Conflicting

**Symptoms**: Inconsistent behavior, multiple icons in system tray/menu bar.

**Solution**: Use only one sleep-prevention tool at a time. Remove or disable others:

```bash
# macOS - list running caffeine-like apps
ps aux | grep -i caffeine

# Linux - check active inhibitors
systemd-inhibit --list

# Windows - check system tray for multiple icons
```

### Issue: High CPU Usage from Caffeine

**Symptoms**: Caffeine process consuming excessive CPU.

**Solution**: This is rare but can happen with older versions. Update to the latest version:

```bash
# macOS
brew upgrade --cask caffeine

# Windows
choco upgrade caffeine -y
```

---

## References

- [Caffeine for macOS - Homebrew Formulae](https://formulae.brew.sh/cask/caffeine)
- [macOS caffeinate command - Apple Developer Documentation](https://developer.apple.com/library/archive/documentation/Darwin/Reference/ManPages/man8/caffeinate.8.html)
- [GNOME Shell Extension Caffeine](https://extensions.gnome.org/extension/517/caffeine/)
- [GNOME Shell Extension Caffeine - GitHub](https://github.com/eonpatapon/gnome-shell-extension-caffeine)
- [systemd-inhibit Manual Page](https://www.freedesktop.org/software/systemd/man/latest/systemd-inhibit.html)
- [Caffeine for Windows - Zhorn Software](https://www.zhornsoftware.co.uk/caffeine/)
- [Caffeine for Windows - Chocolatey Package](https://community.chocolatey.org/packages/caffeine)
- [Raspberry Pi Display Power Management](https://www.raspberrypi.com/documentation/computers/configuration.html)
