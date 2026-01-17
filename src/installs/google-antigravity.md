# Installing Google Antigravity

## Overview

Google Antigravity is an AI-powered integrated development environment (IDE) developed by Google, announced on November 18, 2025 alongside the release of Gemini 3. It represents a shift from traditional manual coding to an agentic development platform where AI handles complete workflows. Antigravity enables developers to delegate complex coding tasks to autonomous AI agents powered primarily by Google's Gemini 3 Pro, Gemini 3 Deep Think, and Gemini 3 Flash models.

Unlike standard coding assistants that autocomplete lines, Antigravity provides a "Mission Control" for managing autonomous agents that can plan, code, and browse the web to help you build software. Key features include:

- **Agent Manager View**: Spawn multiple AI agents to work on different tasks simultaneously
- **Browser Orchestration**: Headless Chrome instance that tests web applications automatically
- **Artifacts System**: Agents generate tangible deliverables (task lists, implementation plans, screenshots, browser recordings) for verification
- **1 Million Token Context Window**: Extremely large context for understanding entire codebases
- **MCP Integration**: Connect to databases, APIs, and external tools

Antigravity is a heavily modified fork of Visual Studio Code, offering a familiar editing experience with powerful agentic capabilities. It is available free of charge during public preview.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- **Optional:** None
- **Auto-installed:**
  - Xcode Command Line Tools (automatically installed by Homebrew if not present)

### Ubuntu (APT/Snap)
- **Required:**
  - `curl` - Install via `sudo apt-get install -y curl` (usually pre-installed)
  - `gpg` - Install via `sudo apt-get install -y gpg` (usually pre-installed)
  - `apt-transport-https` - Install via `sudo apt-get install -y apt-transport-https`
  - `sudo` privileges - Required for package installation
  - glibc >= 2.28 - Ubuntu 20.04+ meets this requirement
  - glibcxx >= 3.4.25 - Ubuntu 20.04+ meets this requirement
- **Optional:**
  - Google Chrome - Required for in-app browser testing functionality
- **Auto-installed:** GUI libraries and dependencies are automatically installed by APT

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - ARM64 architecture (aarch64) - Requires 64-bit Raspberry Pi OS; verify with `uname -m`
  - `curl` - Install via `sudo apt-get install -y curl` (usually pre-installed)
  - `gpg` - Install via `sudo apt-get install -y gpg` (usually pre-installed)
  - `apt-transport-https` - Install via `sudo apt-get install -y apt-transport-https`
  - `sudo` privileges - Required for package installation
  - glibc >= 2.28 - Raspberry Pi OS Bullseye (11) and later meet this requirement
- **Optional:**
  - Google Chrome for ARM64 - Required for in-app browser testing functionality
- **Auto-installed:** GUI libraries and dependencies are automatically installed by APT

### Amazon Linux (DNF/YUM)
- **Required:**
  - `curl` - Install via `sudo dnf install -y curl` (usually pre-installed)
  - `dnf` (Amazon Linux 2023, RHEL 8+) or `yum` (Amazon Linux 2) - Pre-installed
  - `sudo` privileges - Required for package installation
  - glibc >= 2.28 - Amazon Linux 2023 meets this requirement; Amazon Linux 2 may require updates
- **Optional:**
  - Desktop environment - Install via `sudo dnf groupinstall -y "Server with GUI"` (Antigravity is a GUI application)
  - Google Chrome - Required for in-app browser testing functionality
- **Auto-installed:** X11 libraries and dependencies are automatically installed by DNF/YUM

### Windows (Chocolatey/winget)
- **Required:**
  - `winget` - Pre-installed on Windows 10 version 1809+ and Windows 11; install from Microsoft Store via "App Installer" if missing
  - Windows 10 or Windows 11 (64-bit)
- **Optional:**
  - Google Chrome - Required for in-app browser testing functionality (usually pre-installed or easily obtained)
- **Auto-installed:** Visual C++ Redistributables (if required and not already present)

### Git Bash (Manual/Portable)
- **Required:**
  - `winget.exe` - Pre-installed on Windows 10 version 1809+ and Windows 11; accessible from Git Bash as `winget.exe`
  - Git for Windows - Download from https://git-scm.com/downloads/win (provides Git Bash environment)
- **Optional:** None
- **Auto-installed:** None (Git Bash inherits the Windows PATH and accesses the Windows Antigravity installation directly)

## Prerequisites

Before installing Google Antigravity on any platform, ensure:

1. **Internet connectivity** - Required for downloading and for all AI-powered features
2. **Google Account** - Required for authentication and accessing Gemini 3 Pro features
3. **Sufficient disk space** - At least 2 GB available
4. **Minimum RAM** - 8 GB RAM minimum, 16 GB recommended
5. **64-bit processor** - Required on all platforms
6. **Administrative privileges** - Required on most platforms for installation

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager installed
- Apple Silicon (M1/M2/M3/M4) or Intel processor (both x64 and ARM64 supported)
- Terminal access

If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Google Antigravity via Homebrew:

```bash
brew install --cask --quiet antigravity
```

The `--cask` flag indicates this is a macOS application (not a command-line formula), and `--quiet` suppresses non-essential output for automation compatibility.

After installation, Antigravity is available in `/Applications/Antigravity.app` and can be launched from Spotlight or the Applications folder.

#### Verification

Confirm the installation succeeded by checking that the application exists:

```bash
ls /Applications/Antigravity.app
```

Expected output:

```
/Applications/Antigravity.app
```

Launch Antigravity:

```bash
open -a Antigravity
```

Verify the CLI command is available (after first launch and signing in):

```bash
antigravity --version
```

Or use the alternate command name:

```bash
agy --version
```

#### Troubleshooting

**Problem**: `brew: command not found`

**Solution**: Homebrew is not installed or not in PATH. Install Homebrew or add it to your PATH:

For Apple Silicon Macs:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For Intel Macs:

```bash
eval "$(/usr/local/bin/brew shellenv)"
```

**Problem**: Installation fails with "Cask 'antigravity' is unavailable"

**Solution**: Update Homebrew to get the latest cask definitions:

```bash
brew update
brew install --cask --quiet antigravity
```

**Problem**: App shows "Antigravity can't be opened because Apple cannot check it for malicious software"

**Solution**: This can occur on first launch. Right-click the app in Applications and select "Open", then click "Open" in the dialog. Alternatively, clear the quarantine flag:

```bash
xattr -cr /Applications/Antigravity.app
```

**Problem**: `antigravity` or `agy` command not found in terminal

**Solution**: Open Antigravity, then press `Cmd+Shift+P` to open the Command Palette. Type "Shell Command: Install 'antigravity' command in PATH" and select it.

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 (Focal) or later, or Debian 10 (Buster) or later (64-bit)
- glibc >= 2.28 and glibcxx >= 3.4.25 (met by Ubuntu 20.04+, Debian 10+)
- sudo privileges
- Active internet connection

#### Installation Steps

**Step 1: Install prerequisites**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl gpg apt-transport-https
```

**Step 2: Add Google's GPG key and repository**

```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/antigravity-repo-key.gpg
echo "deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg] https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ antigravity-debian main" | sudo tee /etc/apt/sources.list.d/antigravity.list > /dev/null
```

**Step 3: Install Antigravity**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y antigravity
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation with no prompts.

After installation, Antigravity is available in your application menu and can be launched from the terminal with the `antigravity` or `agy` command.

#### Verification

Confirm the installation succeeded:

```bash
antigravity --version
```

Or using the short alias:

```bash
agy --version
```

Verify the package is installed:

```bash
dpkg -l | grep antigravity
```

Launch Antigravity:

```bash
antigravity
```

#### Troubleshooting

**Problem**: `E: Unable to locate package antigravity`

**Solution**: The repository was not added correctly. Verify the sources file exists and has correct content:

```bash
cat /etc/apt/sources.list.d/antigravity.list
```

If missing or malformed, repeat Steps 1 and 2.

**Problem**: GPG key import fails with permission errors

**Solution**: Ensure the keyrings directory exists and has proper permissions:

```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/antigravity-repo-key.gpg
sudo chmod 644 /etc/apt/keyrings/antigravity-repo-key.gpg
```

**Problem**: Antigravity does not launch on headless server

**Solution**: Antigravity is a GUI application and requires a graphical display. For headless servers, use X11 forwarding:

```bash
ssh -X user@server
antigravity
```

Or install a desktop environment.

**Problem**: Dependency errors during installation

**Solution**: Ensure your system meets the minimum glibc (>= 2.28) and glibcxx (>= 3.4.25) requirements:

```bash
ldd --version
```

On Ubuntu/Debian, update all packages before installing:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit) - ARM64/aarch64 architecture **required**
- Raspberry Pi 4 or later with 4 GB or more RAM recommended (8 GB strongly recommended for AI workloads)
- Raspberry Pi OS Bullseye (11) or later
- sudo privileges
- Active internet connection

**Critical Architecture Requirement**: Antigravity requires a 64-bit operating system. Verify your architecture:

```bash
uname -m
```

This must output `aarch64`. If it outputs `armv7l`, you are running 32-bit Raspberry Pi OS and must install the 64-bit version from the Raspberry Pi Imager.

#### Installation Steps

**Step 1: Install prerequisites**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl gpg apt-transport-https
```

**Step 2: Add Google's GPG key and repository**

```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/antigravity-repo-key.gpg
echo "deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg arch=arm64] https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ antigravity-debian main" | sudo tee /etc/apt/sources.list.d/antigravity.list > /dev/null
```

Note the `arch=arm64` specification to ensure the correct ARM64 packages are fetched.

**Step 3: Install Antigravity**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y antigravity
```

#### Verification

Confirm the installation succeeded:

```bash
antigravity --version
```

Or using the short alias:

```bash
agy --version
```

Expected output includes the version number and `arm64` architecture indicator.

#### Troubleshooting

**Problem**: `uname -m` shows `armv7l` instead of `aarch64`

**Solution**: You are running 32-bit Raspberry Pi OS. Antigravity requires 64-bit. Download and install the 64-bit Raspberry Pi OS image from https://www.raspberrypi.com/software/.

**Problem**: Antigravity is very slow or unresponsive

**Solution**: Raspberry Pi has limited resources compared to desktop systems. Ensure you have at least 4 GB RAM (8 GB recommended). Close other applications and consider increasing swap:

```bash
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=4096/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

**Problem**: Out of memory errors during AI operations

**Solution**: The AI features are computationally intensive. Monitor memory usage and close unnecessary applications:

```bash
free -h
```

Consider disabling some AI features or using a machine with more RAM for heavy AI workloads.

**Problem**: Display issues on Wayland

**Solution**: If you experience rendering issues on Wayland, try running with X11:

```bash
GDK_BACKEND=x11 antigravity
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), RHEL 8+, Fedora 36+, or CentOS Stream 8+
- glibc >= 2.28 (Amazon Linux 2023, RHEL 8+, Fedora 36+ meet this requirement)
- sudo privileges
- Active internet connection
- Desktop environment (Antigravity is a GUI application)

**Note**: Amazon Linux 2023 uses DNF as the package manager. RHEL 8+ and Fedora also use DNF. This guide uses DNF commands.

#### Installation Steps

**Step 1: Add Google's RPM repository**

```bash
sudo tee /etc/yum.repos.d/antigravity.repo << 'EOF' > /dev/null
[antigravity-rpm]
name=Antigravity RPM Repository
baseurl=https://us-central1-yum.pkg.dev/projects/antigravity-auto-updater-dev/antigravity-rpm
enabled=1
gpgcheck=0
EOF
```

**Step 2: Update the package cache and install Antigravity**

```bash
sudo dnf makecache
sudo dnf install -y antigravity
```

The `-y` flag ensures fully automated installation with no prompts.

After installation, Antigravity is available in your application menu and can be launched from the terminal with the `antigravity` or `agy` command.

#### Verification

Confirm the installation succeeded:

```bash
antigravity --version
```

Or using the short alias:

```bash
agy --version
```

Verify the package is installed:

```bash
rpm -qi antigravity
```

#### Troubleshooting

**Problem**: `No package antigravity available`

**Solution**: The repository was not added correctly. Verify the repo file:

```bash
cat /etc/yum.repos.d/antigravity.repo
```

Ensure it contains the `[antigravity-rpm]` section with the correct baseurl. Then refresh:

```bash
sudo dnf clean all
sudo dnf makecache
```

**Problem**: Dependency conflicts during installation

**Solution**: Ensure your system packages are current:

```bash
sudo dnf upgrade -y
```

If conflicts persist, try installing with `--allowerasing`:

```bash
sudo dnf install -y --allowerasing antigravity
```

**Problem**: Antigravity fails to launch with display errors

**Solution**: Antigravity requires a graphical display. For remote servers, use X11 forwarding:

```bash
ssh -X user@server
antigravity
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

**Note**: This is temporary and resets on reboot. For production, create a proper SELinux policy.

---

### Windows (winget)

#### Prerequisites

- Windows 10 version 1809 or later (64-bit), or Windows 11
- winget package manager (pre-installed on Windows 10 1809+ and Windows 11)
- Administrator privileges recommended
- Active internet connection

Verify winget is available:

```powershell
winget --version
```

If winget is not found, install "App Installer" from the Microsoft Store.

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
winget install --id Google.Antigravity --silent --accept-package-agreements --accept-source-agreements
```

This command:
- `--id Google.Antigravity` - Specifies the Antigravity package
- `--silent` - Runs without user prompts
- `--accept-package-agreements` - Automatically accepts package license agreements
- `--accept-source-agreements` - Automatically accepts source license agreements

**Alternative Method: Chocolatey**

If Chocolatey is installed, you can use:

```powershell
choco install antigravity -y
```

The `-y` flag automatically confirms the installation without prompts.

After installation, close and reopen your terminal for PATH updates to take effect. Antigravity can be launched from the Start Menu or by typing `antigravity` in the terminal.

#### Verification

Open a new PowerShell or Command Prompt window, then verify the installation:

```powershell
winget list --id Google.Antigravity
```

Or check the version:

```powershell
antigravity --version
```

Or using the short alias:

```powershell
agy --version
```

Alternatively, search for "Antigravity" in the Start Menu and launch it.

#### Troubleshooting

**Problem**: `winget: The term 'winget' is not recognized`

**Solution**: winget may not be installed or PATH may not be updated. Install App Installer from the Microsoft Store:

```powershell
start ms-windows-store://pdp/?productid=9NBLGGH4NNS1
```

After installation, open a new terminal window.

**Problem**: Installation fails with "Administrator privileges required"

**Solution**: Right-click PowerShell or Command Prompt and select "Run as administrator", then retry the installation command.

**Problem**: `antigravity: command not found` after installation

**Solution**: The PATH has not been updated. Close and reopen your terminal. If the problem persists, launch Antigravity from the Start Menu, then use the Command Palette (`Ctrl+Shift+P`) and run "Shell Command: Install 'antigravity' command in PATH".

**Problem**: Windows Defender SmartScreen blocks the installer

**Solution**: Antigravity is a legitimate application from Google. Click "More info" and then "Run anyway". For enterprise environments, contact your IT administrator to whitelist the Antigravity installer.

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or later (64-bit), or Windows 11
- Chocolatey package manager installed
- Administrator privileges

If Chocolatey is not installed, install it by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install antigravity -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

After installation, close and reopen your terminal for PATH updates to take effect.

#### Verification

Open a new PowerShell or Command Prompt window, then verify:

```powershell
choco list --local-only | findstr antigravity
```

Or check the version:

```powershell
antigravity --version
```

#### Troubleshooting

**Problem**: `choco: The term 'choco' is not recognized`

**Solution**: Chocolatey is not installed or not in PATH. Install Chocolatey using the command in the Prerequisites section, then open a new terminal window.

**Problem**: Package not found

**Solution**: Update Chocolatey sources:

```powershell
choco upgrade chocolatey -y
choco install antigravity -y
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- Windows Subsystem for Linux installed with Ubuntu distribution
- WSL 2 recommended for best performance
- Antigravity installed on Windows (see Windows section above)

**Important**: Antigravity runs on Windows and connects to WSL using remote development capabilities (similar to VS Code). You do not install Antigravity inside WSL itself. Instead, install Antigravity on Windows and use its remote development features to connect to your WSL environment.

Verify WSL is installed and running Ubuntu:

```bash
wsl --list --verbose
```

#### Installation Steps

**Step 1: Install Antigravity on Windows**

From PowerShell (as Administrator):

```powershell
winget install --id Google.Antigravity --silent --accept-package-agreements --accept-source-agreements
```

**Step 2: Configure WSL PATH (Optional)**

To launch Antigravity from within WSL using the `agy` command, the Windows Antigravity installation should be accessible via interop. WSL automatically provides access to Windows executables.

Test if the command is available:

```bash
agy.exe --version
```

If not available, add the Windows Antigravity installation to your WSL PATH. Add this line to your `~/.bashrc` or `~/.zshrc` in WSL:

```bash
echo 'export PATH="$PATH:/mnt/c/Users/$(cmd.exe /c echo %USERNAME% 2>/dev/null | tr -d '\r')/AppData/Local/Programs/Antigravity/resources/app/bin"' >> ~/.bashrc && source ~/.bashrc
```

**Step 3: Connect to WSL from Antigravity**

1. Launch Antigravity on Windows
2. Click the green icon in the bottom-left corner (shows "><" or "Remote")
3. Select "Connect to WSL" from the menu
4. Choose your Ubuntu distribution from the list
5. Antigravity installs the necessary server components in WSL (first connection may take a few minutes)

After connecting, you can open folders and files within your WSL filesystem directly from Antigravity.

#### Verification

From within WSL, verify you can launch Antigravity (after PATH configuration):

```bash
agy.exe --version
```

Or from Windows, verify Antigravity can connect to WSL:

1. Open Antigravity
2. Press `Ctrl+Shift+P` to open the Command Palette
3. Type "Remote-WSL: New Window" and select it
4. Verify Antigravity opens with a WSL connection (indicated in the bottom-left corner)

#### Troubleshooting

**Problem**: `agy.exe: command not found` in WSL

**Solution**: WSL interop may be disabled or the PATH is not configured. Check if interop is enabled:

```bash
cat /proc/sys/fs/binfmt_misc/WSLInterop
```

If disabled, enable it in `/etc/wsl.conf`:

```bash
echo -e "[interop]\nenabled=true\nappendWindowsPath=true" | sudo tee /etc/wsl.conf
```

Then restart WSL from PowerShell:

```powershell
wsl --shutdown
wsl
```

**Problem**: Cannot connect to WSL from Antigravity

**Solution**: Ensure WSL 2 is installed and your distribution is running:

```powershell
wsl --set-default-version 2
wsl --install -d Ubuntu
```

Restart WSL:

```powershell
wsl --shutdown
wsl
```

**Problem**: Slow file access when working with Windows files from WSL

**Solution**: WSL has slower performance when accessing files on the Windows filesystem (`/mnt/c/`). For best performance, keep your projects within the WSL filesystem (`~/projects/` or similar).

---

### Git Bash (Windows)

#### Prerequisites

- Windows 10 or later (64-bit)
- Git for Windows installed (provides Git Bash)
- PowerShell available (for initial installation)

Git Bash provides a Unix-compatible environment on Windows. Since Antigravity is a Windows application, it is installed on Windows and accessible from Git Bash.

Download Git for Windows from https://git-scm.com/downloads/win if not already installed.

#### Installation Steps

Git Bash can execute Windows commands, so use winget from within Git Bash:

```bash
winget.exe install --id Google.Antigravity --silent --accept-package-agreements --accept-source-agreements
```

**Alternative: Use PowerShell from Git Bash**

```bash
powershell.exe -Command "winget install --id Google.Antigravity --silent --accept-package-agreements --accept-source-agreements"
```

**Alternative: Use Chocolatey from Git Bash**

```bash
choco.exe install antigravity -y
```

After installation, close and reopen Git Bash for PATH updates to take effect.

#### Verification

Open a new Git Bash window and run:

```bash
antigravity --version
```

Or using the short alias:

```bash
agy --version
```

Or launch Antigravity:

```bash
antigravity
```

If the antigravity command is not available, launch via Windows:

```bash
cmd.exe /c start "" "Antigravity"
```

#### Troubleshooting

**Problem**: `winget.exe: command not found`

**Solution**: Winget may not be in the Git Bash PATH. Use the full path:

```bash
"/c/Users/$USER/AppData/Local/Microsoft/WindowsApps/winget.exe" install --id Google.Antigravity --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: `antigravity: command not found` after installation

**Solution**: The PATH in Git Bash may not include the Antigravity binary. Add it manually:

```bash
echo 'export PATH="$PATH:/c/Users/$USER/AppData/Local/Programs/Antigravity/resources/app/bin"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: PowerShell command fails from Git Bash

**Solution**: Ensure PowerShell is accessible. Try using the full path:

```bash
"/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" -Command "winget install --id Google.Antigravity --silent --accept-package-agreements --accept-source-agreements"
```

**Problem**: Cannot launch Antigravity from Git Bash

**Solution**: Use the Windows `start` command through cmd:

```bash
cmd.exe /c start "" "Antigravity"
```

Or open directly using the Windows path:

```bash
"/c/Users/$USER/AppData/Local/Programs/Antigravity/Antigravity.exe" &
```

---

## Post-Installation Configuration

### First-Time Setup

After installing and launching Antigravity on any platform:

1. **Sign in with Google Account** - Required to activate Gemini 3 Pro features and sync settings
2. **Import VS Code Settings** - Antigravity prompts you to import extensions, themes, keybindings, and settings from VS Code or Cursor if detected
3. **Choose Workspace Mode** - Select your preferred level of agent automation:
   - **Agent-Driven**: Hands-off mode where agents work autonomously
   - **Review-Driven**: Collaborative mode where you review agent decisions
4. **Configure Terminal Permissions** - Choose whether agents can execute terminal commands automatically or require review
5. **Install Shell Command** - Use the Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux) and run "Shell Command: Install 'antigravity' command in PATH"

### Keyboard Shortcuts

Antigravity inherits VS Code keyboard shortcuts and adds AI-specific ones:

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| Open Command Palette | Cmd+Shift+P | Ctrl+Shift+P |
| Toggle Agent Panel | Cmd+L | Ctrl+L |
| Toggle Terminal | Ctrl+` | Ctrl+` |
| New Agent Task | Cmd+Shift+A | Ctrl+Shift+A |
| Accept AI Suggestion | Tab | Tab |
| New File | Cmd+N | Ctrl+N |
| Open Folder | Cmd+O | Ctrl+O |

### Configuring Extensions

Antigravity supports VS Code extensions. Install extensions via:

1. Open the Extensions view (`Cmd+Shift+X` on macOS, `Ctrl+Shift+X` on Windows/Linux)
2. Search for the desired extension
3. Click "Install"

Popular extensions for development:
- ESLint (for JavaScript/TypeScript linting)
- Prettier (for code formatting)
- GitLens (for enhanced Git integration)
- Remote - SSH (for remote development)

### Configuring AI Features

Antigravity offers multiple AI models and configuration options:

1. Open Settings (`Cmd+,` on macOS, `Ctrl+,` on Windows/Linux)
2. Navigate to "AI" or "Antigravity" settings
3. Configure:
   - Default AI model (Gemini 3 Pro, Gemini 3 Flash, Claude, etc.)
   - Agent permissions (terminal access, file access, browser access)
   - Context settings (how much code context to include)
   - Privacy settings (what data is sent to AI)

### Setting Default Editor for Git

Configure Antigravity as Git's default editor:

```bash
git config --global core.editor "antigravity --wait"
```

---

## Common Issues

### Issue: AI Features Not Working

**Symptoms**: AI agents do not respond, or agent panel shows errors.

**Solution**:
1. Ensure you are signed in with your Google Account
2. Check your internet connection
3. Verify your Gemini 3 rate limits have not been exceeded
4. Check Antigravity status at https://status.antigravity.google/

### Issue: High CPU or Memory Usage

**Symptoms**: Antigravity consumes excessive system resources.

**Solution**:
1. Disable unused extensions (Extensions view > Installed > Disable)
2. Close unused editor tabs and agent tasks
3. Reduce the number of active agents
4. Restart Antigravity to clear cached data

### Issue: Agent Cannot Access Browser

**Symptoms**: Browser testing features fail or show errors.

**Solution**:
1. Ensure Google Chrome is installed on your system
2. Check that Chrome is accessible in your PATH
3. Verify no other process is blocking Chrome access
4. Restart Antigravity

### Issue: Antigravity Cannot Find Installed Packages (Node, Python, etc.)

**Symptoms**: Terminal in Antigravity cannot find globally installed packages.

**Solution**: Antigravity may not inherit your shell's PATH. Add this to your shell configuration:

For macOS/Linux (`~/.bashrc` or `~/.zshrc`):

```bash
export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin"
```

Restart Antigravity after modifying shell configuration.

### Issue: Git Integration Not Working

**Symptoms**: Git status, diff, or other features do not work.

**Solution**:
1. Ensure Git is installed and in your PATH
2. Open a terminal in Antigravity and run `git --version`
3. If Git is not found, install it or add it to your PATH
4. Configure Git user identity if prompted:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## Uninstallation

### macOS

```bash
brew uninstall --cask antigravity
rm -rf ~/Library/Application\ Support/Antigravity
rm -rf ~/Library/Caches/Antigravity
```

### Ubuntu/Debian

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y antigravity
sudo rm -f /etc/apt/sources.list.d/antigravity.list
sudo rm -f /etc/apt/keyrings/antigravity-repo-key.gpg
rm -rf ~/.config/Antigravity
rm -rf ~/.cache/Antigravity
```

### Amazon Linux/RHEL

```bash
sudo dnf remove -y antigravity
sudo rm -f /etc/yum.repos.d/antigravity.repo
rm -rf ~/.config/Antigravity
rm -rf ~/.cache/Antigravity
```

### Windows

Using winget:

```powershell
winget uninstall --id Google.Antigravity --silent
```

Using Chocolatey:

```powershell
choco uninstall antigravity -y
```

Remove user data (PowerShell):

```powershell
Remove-Item -Path "$env:APPDATA\Antigravity" -Recurse -Force
Remove-Item -Path "$env:LOCALAPPDATA\Antigravity" -Recurse -Force
```

---

## References

- [Google Antigravity Official Website](https://antigravity.google/)
- [Google Antigravity Download Page](https://antigravity.google/download)
- [Google Developers Blog - Antigravity Announcement](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/)
- [Getting Started with Google Antigravity - Google Codelabs](https://codelabs.developers.google.com/getting-started-google-antigravity)
- [Google Antigravity Documentation](https://antigravity.google/docs)
- [Google Antigravity CLI Documentation](https://antigravity.google/docs/command)
- [Antigravity Homebrew Cask](https://formulae.brew.sh/cask/antigravity)
- [Antigravity Chocolatey Package](https://push.chocolatey.org/packages/antigravity)
- [Antigravity winget Package](https://winstall.app/apps/Google.Antigravity)
- [Google Antigravity Linux Download](https://antigravity.google/download/linux)
- [Google Antigravity Wikipedia](https://en.wikipedia.org/wiki/Google_Antigravity)
