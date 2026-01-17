# Installing Brave Browser

## Overview

Brave is a free, open-source web browser developed by Brave Software, Inc. Built on the Chromium web browser engine, Brave focuses on privacy and speed by blocking ads and website trackers by default. Key features include built-in ad blocking, HTTPS Everywhere integration, fingerprinting protection, and the optional Brave Rewards program that allows users to earn cryptocurrency (BAT) for viewing privacy-respecting ads. Brave offers significant performance improvements over traditional browsers by eliminating tracking scripts and advertisements, resulting in faster page loads and reduced data usage.

**Important**: Brave Browser is a desktop GUI application that requires a graphical display environment. It cannot be installed in headless server environments, WSL without WSLg, or Git Bash (which lacks native GUI capabilities).

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `Homebrew` - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None (Homebrew cask handles Brave installation directly)

### Ubuntu/Debian (APT)
- **Required:**
  - `curl` - Install via `sudo apt-get install -y curl`
  - `sudo` privileges - Required for repository and package installation
- **Optional:** None
- **Auto-installed:**
  - Brave repository GPG keyring and sources file
  - Browser dependencies (graphics, fonts, audio libraries) - Automatically resolved by APT

### Amazon Linux/RHEL/Fedora (DNF)
- **Required:**
  - `dnf` - Pre-installed on Amazon Linux 2023, RHEL 8+, and Fedora
  - `dnf-plugins-core` - Install via `sudo dnf install -y dnf-plugins-core`
  - `sudo` privileges - Required for repository and package installation
- **Optional:** None
- **Auto-installed:**
  - Brave repository configuration
  - Browser dependencies (graphics, fonts, audio libraries) - Automatically resolved by DNF

### Windows (Chocolatey)
- **Required:**
  - `Chocolatey` - Install via PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
  - Administrator privileges - Required for system-wide installation
- **Optional:** None
- **Auto-installed:** None (Brave installer handles all dependencies)

## Prerequisites

Before installing Brave Browser on any platform, ensure:

1. **Internet connectivity** - Required to download the browser package and repository keys
2. **Administrative privileges** - Required on all platforms for system-wide installation
3. **Sufficient disk space** - Brave requires approximately 500 MB of disk space
4. **64-bit operating system** - Brave supports both x86_64 and ARM64 architectures on supported platforms
5. **Desktop environment** - A graphical display is required (X11 or Wayland on Linux, standard desktop on macOS/Windows)

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

Run the following command to install Brave Browser:

```bash
brew install --cask --quiet brave-browser
```

The `--cask` flag specifies a graphical application (as opposed to a command-line tool), and `--quiet` suppresses non-essential output, making the command suitable for automation scripts.

After installation, Brave will be available in the Applications folder. Launch it from the command line:

```bash
open -a "Brave Browser"
```

#### Verification

Confirm the installation succeeded:

```bash
ls /Applications/Brave\ Browser.app && echo "Brave Browser installed successfully"
```

Verify the installed version:

```bash
/Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser --version
```

Expected output (version numbers may vary):

```
Brave 1.86.139 Chromium: 128.0.6613.137
```

#### Troubleshooting

**Problem**: `brew: command not found`

**Solution**: Homebrew is not in your PATH. Add it:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For a permanent fix, add the above line to your `~/.zshrc` or `~/.bash_profile`.

**Problem**: Brave fails to open after installation

**Solution**: macOS Gatekeeper may block the application. Allow it by going to System Preferences > Security & Privacy > General, and click "Open Anyway" next to the Brave message. Alternatively, remove the quarantine attribute:

```bash
xattr -cr /Applications/Brave\ Browser.app
```

**Problem**: Installation fails with "Cask 'brave-browser' is already installed"

**Solution**: Reinstall the cask:

```bash
brew reinstall --cask brave-browser
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 or later
- Both x86_64 (amd64) and ARM64 (aarch64) architectures are supported
- sudo privileges
- curl installed

**Important**: Brave Browser is not available in the default Ubuntu/Debian repositories. Use Brave's official repository for installation and automatic updates.

#### Installation Steps

**Step 1: Install curl (if not already installed)**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
```

**Step 2: Download and install the Brave GPG keyring**

```bash
sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg
```

**Step 3: Add the Brave repository sources file**

```bash
sudo curl -fsSLo /etc/apt/sources.list.d/brave-browser-release.sources https://brave-browser-apt-release.s3.brave.com/brave-browser.sources
```

**Step 4: Update package lists and install Brave**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y brave-browser
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures the installation proceeds without prompts, making it suitable for automation scripts.

**Alternative: One-Line Install Script**

Brave provides an official installation script that handles all steps automatically:

```bash
curl -fsS https://dl.brave.com/install.sh | sh
```

**Note**: The one-line script may prompt for sudo password if not running as root. For fully automated deployments, use the step-by-step method above.

#### Verification

Confirm the installation succeeded:

```bash
brave-browser --version
```

Expected output (version numbers may vary):

```
Brave 1.86.139 Chromium: 128.0.6613.137
```

Launch Brave:

```bash
brave-browser &
```

#### Troubleshooting

**Problem**: `E: Unable to locate package brave-browser`

**Solution**: The repository was not added correctly. Verify the configuration file exists:

```bash
cat /etc/apt/sources.list.d/brave-browser-release.sources
```

If the file is empty or missing, repeat the installation steps.

**Problem**: GPG key error during apt-get update

**Solution**: Re-download the GPG keyring:

```bash
sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg
```

**Problem**: Brave fails to start with "running as root without --no-sandbox"

**Solution**: Brave cannot run as the root user without disabling the sandbox. Create a regular user account and run Brave from there, or add the `--no-sandbox` flag (not recommended for security reasons):

```bash
brave-browser --no-sandbox
```

**Problem**: Missing dependencies error

**Solution**: Install the missing dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -f
```

**Problem**: Wrong architecture installed (ARM vs x86)

**Solution**: The repository sources file automatically selects the correct architecture. If you manually configured the repository, ensure the architecture matches your system:

```bash
# Check your architecture
dpkg --print-architecture
```

---

### Amazon Linux/RHEL/Fedora (DNF)

#### Prerequisites

- Amazon Linux 2023, RHEL 8+, Fedora 37+, Rocky Linux, or AlmaLinux
- x86_64 or ARM64 architecture
- sudo privileges
- Desktop environment installed (GNOME, KDE, etc.)

**Important**: Amazon Linux and RHEL are typically used for server workloads. Installing Brave Browser requires a desktop environment with graphical capabilities. This is uncommon on cloud instances but applicable to workstation configurations.

#### Installation Steps

**For Fedora 41 and later (uses dnf5 syntax):**

```bash
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager addrepo --from-repofile=https://brave-browser-rpm-release.s3.brave.com/brave-browser.repo
sudo dnf install -y brave-browser
```

**For Amazon Linux 2023, RHEL 8+, Fedora 40 and earlier, Rocky Linux, AlmaLinux:**

```bash
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://brave-browser-rpm-release.s3.brave.com/brave-browser.repo
sudo dnf install -y brave-browser
```

**For Amazon Linux 2 (legacy, uses YUM):**

```bash
sudo rpm --import https://brave-browser-rpm-release.s3.brave.com/brave-core.asc
sudo curl -fsSLo /etc/yum.repos.d/brave-browser.repo https://brave-browser-rpm-release.s3.brave.com/brave-browser.repo
sudo yum install -y brave-browser
```

**Note**: Amazon Linux 2 reached end of standard support on June 30, 2025. Migrate to Amazon Linux 2023 for continued support.

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

#### Verification

Confirm the installation succeeded:

```bash
brave-browser --version
```

Expected output (version numbers may vary):

```
Brave 1.86.139 Chromium: 128.0.6613.137
```

Launch Brave:

```bash
brave-browser &
```

#### Troubleshooting

**Problem**: `Unknown argument '--add-repo' for command 'config-manager'`

**Solution**: You are running Fedora 41 or later with dnf5. Use the new syntax:

```bash
sudo dnf config-manager addrepo --from-repofile=https://brave-browser-rpm-release.s3.brave.com/brave-browser.repo
```

**Problem**: Repository GPG key not trusted

**Solution**: Import the Brave GPG key manually:

```bash
sudo rpm --import https://brave-browser-rpm-release.s3.brave.com/brave-core.asc
```

**Problem**: Missing dependencies when installing

**Solution**: Install common dependencies first:

```bash
sudo dnf install -y libXcomposite libXdamage libXrandr libgbm libxkbcommon pango alsa-lib atk at-spi2-atk cups-libs libdrm mesa-libgbm
```

Then retry the Brave installation.

**Problem**: Brave crashes with sandbox errors

**Solution**: On server environments or containers, the sandbox may have issues. For headless/automated use, disable the sandbox (use only in trusted environments):

```bash
brave-browser --no-sandbox --headless
```

**Problem**: Brave fails to run on Graviton (ARM) instances

**Solution**: Brave provides ARM64 builds for Linux. Ensure you have a desktop environment installed:

```bash
sudo dnf groupinstall -y "Server with GUI"
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 1809 or later, or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

**Installing Chocolatey** (if not already installed):

Run this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install brave -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Alternative: Using winget**

If you prefer winget (included in Windows 10 2004+ and Windows 11):

```powershell
winget install --id Brave.Brave --silent --accept-package-agreements --accept-source-agreements
```

The `--silent` flag suppresses the installer UI, and the `--accept-*` flags prevent license agreement prompts.

**Alternative: Silent EXE Installation**

For direct silent installation without a package manager:

```powershell
# Download the installer
Invoke-WebRequest -Uri "https://brave-browser-downloads.s3.brave.com/latest/brave_installer-x64.exe" -OutFile "$env:TEMP\brave_installer-x64.exe"

# Run silent installation
Start-Process -FilePath "$env:TEMP\brave_installer-x64.exe" -ArgumentList "--install --silent --system-level" -Wait

# Clean up
Remove-Item "$env:TEMP\brave_installer-x64.exe"
```

The `--system-level` flag installs Brave for all users in `Program Files` instead of the current user's `AppData` folder.

#### Verification

Open a new Command Prompt or PowerShell window (required for PATH updates), then run:

```powershell
& "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --version
```

Expected output (version numbers may vary):

```
Brave 1.86.139 Chromium: 128.0.6613.137
```

#### Troubleshooting

**Problem**: `choco: The term 'choco' is not recognized`

**Solution**: Close all terminal windows and open a new Administrator PowerShell. Chocolatey should be available after a fresh terminal session.

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click the application and select "Run as administrator".

**Problem**: Brave installs to AppData instead of Program Files

**Solution**: By default, Chocolatey installs Brave to `%LOCALAPPDATA%\BraveSoftware`. For system-wide installation, use the EXE method with `--system-level` flag, or use winget with `--scope machine`:

```powershell
winget install --id Brave.Brave --silent --scope machine --accept-package-agreements --accept-source-agreements
```

**Problem**: winget shows "No applicable installer found"

**Solution**: Update winget to the latest version:

```powershell
winget upgrade --id Microsoft.AppInstaller --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: Brave installs but does not appear in PATH

**Solution**: Brave is not added to PATH by default on Windows. Use the full path to the executable, or add it to your PATH manually:

```powershell
$env:Path += ";C:\Program Files\BraveSoftware\Brave-Browser\Application"
```

For permanent PATH modification, add through System Properties > Environment Variables.

---

## Post-Installation Configuration

After installing Brave Browser on any platform, consider these optional configurations.

### Set Brave as Default Browser

**macOS:**

```bash
open -a "Brave Browser"
# Then go to Brave menu > Settings > Default browser > Make default
```

**Ubuntu/Debian:**

```bash
sudo update-alternatives --set x-www-browser /usr/bin/brave-browser
sudo update-alternatives --set gnome-www-browser /usr/bin/brave-browser
xdg-settings set default-web-browser brave-browser.desktop
```

**Windows (via Settings UI):**

```powershell
start ms-settings:defaultapps
```

Navigate to Web browser and select Brave.

### Configure Brave Shields

Brave Shields is the built-in ad and tracker blocker. Access settings via the Brave icon in the address bar or navigate to:

```
brave://settings/shields
```

### Import Data from Other Browsers

On first launch, Brave offers to import bookmarks, passwords, and settings from other browsers. Access this later via:

```
brave://settings/importData
```

### Configure for Headless Automation

For CI/CD pipelines and automated testing, use these flags:

```bash
brave-browser --headless --disable-gpu --no-sandbox --disable-dev-shm-usage
```

**Flag explanations:**
- `--headless`: Run without a GUI
- `--disable-gpu`: Disable GPU hardware acceleration (required in many server environments)
- `--no-sandbox`: Disable the sandbox (use only in trusted/containerized environments)
- `--disable-dev-shm-usage`: Use /tmp instead of /dev/shm (prevents crashes in Docker containers)

### Disable Brave Rewards

If you do not want to participate in Brave Rewards:

1. Navigate to `brave://rewards`
2. Toggle off "Brave Rewards"

Or launch with:

```bash
brave-browser --disable-brave-rewards
```

---

## Common Issues

### Issue: Brave Does Not Auto-Update (Linux)

**Symptoms**: Brave version remains old despite updates being available.

**Solutions**:

On Debian/Ubuntu, Brave adds its repository automatically. Update with:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y brave-browser
```

On Fedora/RHEL/Amazon Linux:

```bash
sudo dnf upgrade -y brave-browser
```

### Issue: High Memory Usage

**Symptoms**: System becomes slow, Brave uses excessive RAM.

**Solutions**:

1. Close unused tabs
2. Use Brave's built-in Task Manager (Shift+Esc) to identify memory-heavy tabs/extensions
3. Disable or remove unused extensions
4. Navigate to `brave://settings/system` and disable "Continue running background apps when Brave is closed"

### Issue: Brave Crashes on Startup

**Symptoms**: Brave opens briefly and immediately closes, or shows "Aw, Snap!" errors.

**Solutions**:

1. Clear the user profile cache:

```bash
# Linux
rm -rf ~/.config/BraveSoftware/Brave-Browser/Default/Cache
rm -rf ~/.config/BraveSoftware/Brave-Browser/Default/Code\ Cache

# macOS
rm -rf ~/Library/Application\ Support/BraveSoftware/Brave-Browser/Default/Cache
rm -rf ~/Library/Application\ Support/BraveSoftware/Brave-Browser/Default/Code\ Cache

# Windows (PowerShell)
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\User Data\Default\Cache"
```

2. Disable hardware acceleration:

```bash
brave-browser --disable-gpu
```

3. Reset Brave to default settings (backup bookmarks first).

### Issue: Extensions Not Working

**Symptoms**: Chrome Web Store extensions fail to install or function incorrectly.

**Solutions**:

Brave supports Chrome extensions. Install from the Chrome Web Store:

1. Navigate to `chrome.google.com/webstore`
2. Find your extension and click "Add to Brave"

If extensions still fail:

1. Navigate to `brave://extensions`
2. Enable "Developer mode"
3. Click "Update" to refresh all extensions

### Issue: Sync Not Working

**Symptoms**: Brave Sync fails to sync data between devices.

**Solutions**:

1. Navigate to `brave://settings/braveSync/setup`
2. Ensure you have the correct sync chain code
3. Verify internet connectivity
4. Try leaving and rejoining the sync chain

### Issue: PDF Files Download Instead of Opening

**Symptoms**: PDFs download automatically instead of opening in Brave's built-in viewer.

**Solution**: Enable the PDF viewer in Brave settings:

1. Navigate to `brave://settings/content/pdfDocuments`
2. Select "Open PDFs in Brave"

---

## References

- [Brave Browser Official Website](https://brave.com/)
- [Brave Browser Download Page](https://brave.com/download/)
- [Installing Brave on Linux - Official Documentation](https://brave.com/linux/)
- [Brave Help Center](https://support.brave.app/)
- [Homebrew Cask - brave-browser](https://formulae.brew.sh/cask/brave-browser)
- [Chocolatey Package - brave](https://community.chocolatey.org/packages/brave)
- [winget Package - Brave.Brave](https://winget.run/pkg/Brave/Brave)
- [Brave Browser GitHub Repository](https://github.com/brave/brave-browser)
- [Brave Community Forums](https://community.brave.app/)
- [Brave Silent Install Guide](https://silentinstallhq.com/brave-browser-silent-install-how-to-guide/)
