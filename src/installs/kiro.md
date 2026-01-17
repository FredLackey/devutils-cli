# Installing Kiro

## Overview

Kiro is an AI-powered agentic IDE developed by Amazon Web Services (AWS) that helps developers go from prototype to production using spec-driven development. Built on the Code OSS foundation (the same base as VS Code), Kiro provides intelligent coding assistance through structured specifications, agent hooks, and natural language interactions. It breaks down requirements into detailed implementation plans, generates working code, documentation, and tests, all while understanding your project context.

Kiro is available for macOS, Windows, and Linux, and also offers a command-line interface (CLI) for terminal-based workflows. While Kiro does not require an AWS account, it does require authentication through GitHub, Google, AWS Builder ID, or AWS IAM Identity Center. An active internet connection is required for all AI-powered features.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- **Optional:** None
- **Auto-installed:**
  - Xcode Command Line Tools (automatically installed by Homebrew if not present)

### Ubuntu (APT/Snap)
- **Required:**
  - `curl` - Install via `sudo apt-get install -y curl` (usually pre-installed)
  - `wget` - Install via `sudo apt-get install -y wget` (usually pre-installed)
  - `unzip` - Install via `sudo apt-get install -y unzip` (for CLI installation)
  - `sudo` privileges - Required for package installation
- **Optional:**
  - `libfuse2` (for Ubuntu 20.04-22.04) - Install via `sudo apt-get install -y libfuse2` (only needed for AppImage/universal installation)
  - `libfuse2t64` (for Ubuntu 24.04+) - Install via `sudo apt-get install -y libfuse2t64` (only needed for AppImage/universal installation)
- **Auto-installed:** None

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `curl` - Install via `sudo apt-get install -y curl` (usually pre-installed)
  - `unzip` - Install via `sudo apt-get install -y unzip` (for CLI installation)
  - `sudo` privileges - Required for package installation
  - ARM64 architecture (aarch64) - Requires 64-bit Raspberry Pi OS; verify with `uname -m`
- **Optional:**
  - `libfuse2` - Install via `sudo apt-get install -y libfuse2` (only needed for AppImage installation)
- **Auto-installed:** None

### Amazon Linux (DNF/YUM)
- **Required:**
  - `curl` - Install via `sudo dnf install -y curl` or `sudo yum install -y curl` (usually pre-installed)
  - `unzip` - Install via `sudo dnf install -y unzip` (for CLI installation)
  - `tar` - Install via `sudo dnf install -y tar` (for tar.gz extraction)
  - `dnf` (Amazon Linux 2023, RHEL 8+, Fedora) or `yum` (Amazon Linux 2, older RHEL) - System package manager (pre-installed)
  - `sudo` privileges - Required for package installation
- **Optional:**
  - `fuse` - Install via `sudo dnf install -y fuse fuse-libs` (only needed for AppImage installation)
  - Desktop environment - Install via `sudo dnf groupinstall -y "Server with GUI"` (Kiro IDE is a GUI application)
- **Auto-installed:** None

### Windows (Chocolatey/winget)
- **Required:**
  - `winget` - Pre-installed on Windows 10 version 1809+ and Windows 11; install from Microsoft Store via "App Installer" if missing
- **Optional:** None
- **Auto-installed:** None

### Git Bash (Manual/Portable)
- **Required:**
  - `winget.exe` - Pre-installed on Windows 10 version 1809+ and Windows 11; accessible from Git Bash as `winget.exe`
  - Git for Windows - Download from https://git-scm.com/downloads/win (provides Git Bash environment)
- **Optional:** None
- **Auto-installed:** None

## Prerequisites

Before installing Kiro on any platform, ensure:

1. **Internet connectivity** - Required for downloading, authentication, and all AI-powered features
2. **Sufficient disk space** - At least 500 MB for the IDE, additional space for CLI
3. **Minimum RAM** - 4 GB RAM minimum, 8 GB recommended
4. **Authentication account** - GitHub, Google, AWS Builder ID, or AWS IAM Identity Center account required for sign-in

**Note**: You do NOT need an AWS account to use Kiro. You can sign in with GitHub or Google.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager installed
- Terminal access
- Apple Silicon (M1/M2/M3/M4) or Intel processor

Homebrew supports both Apple Silicon and Intel Macs. If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

**Install Kiro IDE:**

Run the following command to install Kiro via Homebrew:

```bash
brew install --cask --quiet kiro
```

The `--cask` flag indicates this is a macOS application (not a command-line formula), and `--quiet` suppresses non-essential output for automation compatibility.

After installation, Kiro is available in `/Applications/Kiro.app` and can be launched from Spotlight or the Applications folder.

**Install Kiro CLI (Optional):**

The Kiro CLI provides terminal-based AI assistance. Install it separately:

```bash
brew install --cask --quiet kiro-cli
```

Alternatively, use the official installation script:

```bash
curl -fsSL https://cli.kiro.dev/install | bash
```

#### Verification

Confirm the IDE installation succeeded by launching the application:

```bash
open -a Kiro
```

Alternatively, verify the application exists:

```bash
ls /Applications/Kiro.app
```

Expected output:

```
/Applications/Kiro.app
```

Verify the CLI installation (if installed):

```bash
kiro-cli version
```

Expected output (version numbers may vary):

```
Kiro CLI 1.24.0
```

#### Troubleshooting

**Problem**: `brew: command not found`

**Solution**: Homebrew is not installed or not in PATH. Install Homebrew or add it to your PATH:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For Intel Macs, use:

```bash
eval "$(/usr/local/bin/brew shellenv)"
```

**Problem**: "Kiro.app" is damaged and can't be opened or security warning appears

**Solution**: Clear the quarantine attribute and approve in System Settings:

```bash
sudo xattr -d com.apple.quarantine /Applications/Kiro.app
```

Then go to System Settings > Privacy & Security and approve Kiro.

**Problem**: Installation fails with "Cask 'kiro' is unavailable"

**Solution**: Update Homebrew to get the latest cask definitions:

```bash
brew update
brew install --cask --quiet kiro
```

**Problem**: `kiro-cli: command not found` after installation

**Solution**: The CLI may not be in your PATH. Add it manually:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

For Bash users, modify `~/.bash_profile` instead.

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 24.04 or later, or Debian 12 or later (64-bit x86_64)
- sudo privileges
- Active internet connection

**Note**: The official Kiro .deb package requires Ubuntu 24.04+ or equivalent with glibc 2.34+. For older systems, use the universal tar.gz installation method.

#### Installation Steps

**Step 1: Install prerequisites**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget curl unzip
```

**Step 2: Download and install the .deb package**

```bash
wget -q https://desktop-release.q.us-east-1.amazonaws.com/latest/kiro-cli.deb -O /tmp/kiro-cli.deb
sudo DEBIAN_FRONTEND=noninteractive dpkg -i /tmp/kiro-cli.deb
sudo DEBIAN_FRONTEND=noninteractive apt-get install -f -y
rm -f /tmp/kiro-cli.deb
```

This installs the Kiro CLI. For the full Kiro IDE, download and install from the official website:

**Step 3: Install Kiro IDE (x86_64)**

```bash
curl -fsSL "https://desktop-release.q.us-east-1.amazonaws.com/latest/linux-x64/Kiro.tar.gz" -o /tmp/kiro.tar.gz
sudo mkdir -p /opt/kiro
sudo tar -xzf /tmp/kiro.tar.gz -C /opt/kiro --strip-components=1
sudo ln -sf /opt/kiro/kiro /usr/local/bin/kiro
rm -f /tmp/kiro.tar.gz
```

**Step 4: Create a desktop entry (optional)**

```bash
cat << 'EOF' | sudo tee /usr/share/applications/kiro.desktop > /dev/null
[Desktop Entry]
Name=Kiro
Comment=AI-powered IDE from AWS
Exec=/opt/kiro/kiro %F
Icon=/opt/kiro/resources/app/resources/linux/code.png
Type=Application
Categories=Development;IDE;
StartupNotify=true
StartupWMClass=Kiro
EOF
```

#### Verification

Verify the CLI installation:

```bash
kiro-cli version
```

Verify the IDE installation:

```bash
/opt/kiro/kiro --version
```

Or if you created the symlink:

```bash
kiro --version
```

Launch Kiro:

```bash
kiro
```

#### Troubleshooting

**Problem**: `dpkg: error: dependency problems prevent configuration`

**Solution**: Run apt-get to fix dependencies:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -f -y
```

**Problem**: Sandbox errors when launching Kiro

**Solution**: In trusted environments, bypass sandbox restrictions:

```bash
/opt/kiro/kiro --no-sandbox
```

**Note**: Using `--no-sandbox` reduces security. Only use this in trusted environments.

**Problem**: "libc.so.6: version GLIBC_2.34 not found"

**Solution**: Your system has an older glibc version. Use the musl build for the CLI:

```bash
curl --proto '=https' --tlsv1.2 -sSf 'https://desktop-release.q.us-east-1.amazonaws.com/latest/kirocli-x86_64-linux-musl.zip' -o /tmp/kirocli.zip
unzip -o /tmp/kirocli.zip -d /tmp/kirocli
/tmp/kirocli/install.sh
rm -rf /tmp/kirocli /tmp/kirocli.zip
```

**Problem**: Kiro does not appear in application menu

**Solution**: Refresh the desktop database:

```bash
sudo update-desktop-database
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit) - ARM64/aarch64 architecture **required**
- Raspberry Pi 4 or later with 4 GB or more RAM recommended
- sudo privileges
- Active internet connection

**Critical Architecture Requirement**: Kiro requires a 64-bit operating system. Verify your architecture:

```bash
uname -m
```

This must output `aarch64`. If it outputs `armv7l`, you are running 32-bit Raspberry Pi OS and must install the 64-bit version from the Raspberry Pi Imager.

Check your glibc version:

```bash
ldd --version | head -1
```

If the version is 2.34 or newer, use the standard ARM64 build. If older, use the musl build.

#### Installation Steps

**Step 1: Install prerequisites**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl unzip nodejs git
```

**Step 2: Install Kiro CLI (ARM64 musl build - recommended for Raspberry Pi)**

The musl build provides better compatibility with Raspberry Pi's environment:

```bash
curl --proto '=https' --tlsv1.2 -sSf 'https://desktop-release.q.us-east-1.amazonaws.com/latest/kirocli-aarch64-linux-musl.zip' -o /tmp/kirocli.zip
unzip -o /tmp/kirocli.zip -d /tmp/kirocli
/tmp/kirocli/install.sh
rm -rf /tmp/kirocli /tmp/kirocli.zip
```

**Step 3: Add CLI to PATH**

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Note**: The full Kiro IDE (graphical application) may have limited support on Raspberry Pi due to resource constraints and ARM architecture. The CLI provides full AI-powered terminal functionality.

#### Verification

Verify the CLI installation:

```bash
kiro-cli version
```

Expected output (version numbers may vary):

```
Kiro CLI 1.24.0
```

Test the CLI:

```bash
kiro-cli doctor
```

This command diagnoses and fixes common installation issues.

#### Troubleshooting

**Problem**: "Illegal instruction (SIGILL)" error when running Kiro CLI

**Solution**: The standard build is incompatible with your Pi. Use the musl build as shown in the installation steps above.

**Problem**: `kiro-cli: command not found` after installation

**Solution**: Ensure the PATH is updated:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Verify the binary exists:

```bash
ls ~/.local/bin/kiro-cli
```

**Problem**: Authentication fails in headless environment

**Solution**: The CLI requires browser-based authentication on first use. Copy the authentication URL displayed in the terminal, open it in a browser on another device, complete authentication, and return to the terminal.

**Problem**: Slow performance or high memory usage

**Solution**: Raspberry Pi has limited resources. Close other applications and consider increasing swap:

```bash
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8+, Fedora, or CentOS Stream 8+
- sudo privileges
- Active internet connection
- Desktop environment (if using GUI; Kiro IDE is a graphical application)

**Note**: Amazon Linux 2023 uses DNF as the package manager. Amazon Linux 2 uses YUM. This guide uses DNF commands; replace `dnf` with `yum` for AL2.

#### Installation Steps

**Step 1: Install prerequisites**

For Amazon Linux 2023 and RHEL 8+ (DNF):

```bash
sudo dnf install -y curl unzip tar
```

For Amazon Linux 2 (YUM):

```bash
sudo yum install -y curl unzip tar
```

**Step 2: Install Kiro CLI (x86_64)**

```bash
curl --proto '=https' --tlsv1.2 -sSf 'https://desktop-release.q.us-east-1.amazonaws.com/latest/kirocli-x86_64-linux.zip' -o /tmp/kirocli.zip
unzip -o /tmp/kirocli.zip -d /tmp/kirocli
/tmp/kirocli/install.sh
rm -rf /tmp/kirocli /tmp/kirocli.zip
```

For ARM64 systems (AWS Graviton):

```bash
curl --proto '=https' --tlsv1.2 -sSf 'https://desktop-release.q.us-east-1.amazonaws.com/latest/kirocli-aarch64-linux.zip' -o /tmp/kirocli.zip
unzip -o /tmp/kirocli.zip -d /tmp/kirocli
/tmp/kirocli/install.sh
rm -rf /tmp/kirocli /tmp/kirocli.zip
```

**Step 3: Add CLI to PATH**

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Step 4: Install Kiro IDE (optional, for desktop environments)**

Download and extract the universal Linux build:

```bash
curl -fsSL "https://desktop-release.q.us-east-1.amazonaws.com/latest/linux-x64/Kiro.tar.gz" -o /tmp/kiro.tar.gz
sudo mkdir -p /opt/kiro
sudo tar -xzf /tmp/kiro.tar.gz -C /opt/kiro --strip-components=1
sudo ln -sf /opt/kiro/kiro /usr/local/bin/kiro
rm -f /tmp/kiro.tar.gz
```

**Note**: There is currently no official RPM/DNF/YUM repository for Kiro IDE. This is an open feature request.

#### Verification

Verify the CLI installation:

```bash
kiro-cli version
```

Verify the IDE installation (if installed):

```bash
kiro --version
```

Run diagnostics:

```bash
kiro-cli doctor
```

#### Troubleshooting

**Problem**: No graphical display available for IDE

**Solution**: Kiro IDE is a GUI application and requires a desktop environment. For headless servers, use the Kiro CLI for terminal-based AI assistance, or use X11 forwarding:

```bash
ssh -X user@server
kiro
```

Or install a desktop environment:

```bash
sudo dnf groupinstall -y "Server with GUI"
```

**Problem**: "libc.so.6: version GLIBC_2.34 not found"

**Solution**: Use the musl build for systems with older glibc:

```bash
curl --proto '=https' --tlsv1.2 -sSf 'https://desktop-release.q.us-east-1.amazonaws.com/latest/kirocli-x86_64-linux-musl.zip' -o /tmp/kirocli.zip
unzip -o /tmp/kirocli.zip -d /tmp/kirocli
/tmp/kirocli/install.sh
rm -rf /tmp/kirocli /tmp/kirocli.zip
```

**Problem**: SELinux blocking execution

**Solution**: Check the audit log for SELinux denials:

```bash
sudo ausearch -m avc -ts recent
```

For testing, temporarily set SELinux to permissive mode:

```bash
sudo setenforce 0
```

**Note**: This is temporary. For production, create a proper SELinux policy.

---

### Windows (winget)

#### Prerequisites

- Windows 10 version 1809 or later, or Windows 11
- winget package manager (pre-installed on Windows 10 1809+ and Windows 11)
- Administrator privileges recommended
- Active internet connection

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
winget install --id Amazon.Kiro --silent --accept-package-agreements --accept-source-agreements
```

This command:
- `--id Amazon.Kiro` - Specifies the Kiro package from Amazon
- `--silent` - Runs without user prompts
- `--accept-package-agreements` - Automatically accepts package license agreements
- `--accept-source-agreements` - Automatically accepts source repository agreements

After installation, close and reopen your terminal for PATH updates to take effect.

#### Verification

Open a new PowerShell or Command Prompt window, then verify the installation:

```powershell
winget list --id Amazon.Kiro
```

Or launch Kiro:

```powershell
kiro
```

Alternatively, search for "Kiro" in the Start Menu.

#### Troubleshooting

**Problem**: `winget: The term 'winget' is not recognized`

**Solution**: winget may not be installed or PATH may not be updated. Install App Installer from the Microsoft Store:

```powershell
start ms-windows-store://pdp/?productid=9NBLGGH4NNS1
```

After installation, open a new terminal window.

**Problem**: Installation fails with "Administrator privileges required"

**Solution**: Right-click PowerShell or Command Prompt and select "Run as administrator", then retry the installation command.

**Problem**: Windows Defender SmartScreen blocks the installer

**Solution**: Kiro is a legitimate application from Amazon. Click "More info" and then "Run anyway". For enterprise environments, contact your IT administrator to whitelist the Kiro installer.

**Problem**: "Windows protected your PC" message

**Solution**: Click "More info" and then "Run anyway". Alternatively, temporarily disable Windows Defender SmartScreen during installation.

**Problem**: Auto-updates disabled when running as administrator

**Solution**: Kiro auto-updates may be disabled when always running as administrator. To fix:

1. Right-click the Kiro icon
2. Select Properties
3. Go to the Compatibility tab
4. Uncheck "Run this program as an administrator"
5. Apply changes

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- Windows Subsystem for Linux installed with Ubuntu distribution
- WSL 2 recommended for best performance
- Active internet connection

**Recommended Approach**: Install Kiro IDE on Windows and use its remote development capabilities to connect to your WSL environment, similar to VS Code's Remote-WSL pattern.

Verify WSL is installed and running Ubuntu:

```powershell
wsl --list --verbose
```

#### Installation Steps

**Option 1: Install Kiro on Windows (Recommended)**

From PowerShell (as Administrator):

```powershell
winget install --id Amazon.Kiro --silent --accept-package-agreements --accept-source-agreements
```

Then launch Kiro from Windows and connect to your WSL environment through Kiro's remote features.

**Option 2: Install Kiro CLI in WSL**

From within WSL Ubuntu, install the CLI for terminal-based AI assistance:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl unzip
curl -fsSL https://cli.kiro.dev/install | bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

For Windows installation, launch Kiro from the Start Menu.

For WSL CLI installation:

```bash
kiro-cli version
```

Test the CLI:

```bash
kiro-cli doctor
```

#### Troubleshooting

**Problem**: Cannot connect to WSL from Kiro

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

**Problem**: `kiro-cli: command not found` in WSL

**Solution**: Ensure the PATH includes the CLI installation directory:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Authentication fails in WSL

**Solution**: The CLI requires browser-based authentication. It will display a URL - copy it and open in a Windows browser to complete authentication.

---

### Git Bash (Windows)

#### Prerequisites

- Windows 10 or later
- Git for Windows installed (provides Git Bash)
- PowerShell available (for initial installation)

Git Bash provides a Unix-compatible environment on Windows. Since Kiro is a Windows application, it is installed on Windows and accessible from Git Bash.

Download Git for Windows from https://git-scm.com/downloads/win if not already installed.

#### Installation Steps

Git Bash can execute Windows commands, so use winget from within Git Bash:

```bash
winget.exe install --id Amazon.Kiro --silent --accept-package-agreements --accept-source-agreements
```

**Alternative: Use PowerShell from Git Bash**

```bash
powershell.exe -Command "winget install --id Amazon.Kiro --silent --accept-package-agreements --accept-source-agreements"
```

After installation, close and reopen Git Bash for PATH updates to take effect.

#### Verification

Open a new Git Bash window and run:

```bash
kiro --version
```

Or launch Kiro:

```bash
kiro
```

If the kiro command is not available, launch via Windows:

```bash
cmd.exe /c start "" "Kiro"
```

#### Troubleshooting

**Problem**: `winget.exe: command not found`

**Solution**: Winget may not be in the Git Bash PATH. Use the full path:

```bash
"/c/Users/$USER/AppData/Local/Microsoft/WindowsApps/winget.exe" install --id Amazon.Kiro --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: `kiro: command not found` after installation

**Solution**: The PATH in Git Bash may not include the Kiro binary. Add it manually:

```bash
echo 'export PATH="$PATH:/c/Users/$USER/AppData/Local/Programs/kiro"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Cannot launch Kiro from Git Bash

**Solution**: Use the Windows `start` command through cmd:

```bash
cmd.exe /c start "" "Kiro"
```

---

## Post-Installation Configuration

### First-Time Setup

After installing and launching Kiro on any platform:

1. **Sign in** - Kiro requires authentication. Choose from GitHub, Google, AWS Builder ID, or AWS IAM Identity Center
2. **Import VS Code Settings (Optional)** - Kiro prompts you to import extensions, themes, keybindings, and settings from VS Code if detected
3. **Select Theme** - Choose your preferred light or dark theme
4. **Enable Shell Integration** - Allow Kiro to set up shell integration, enabling the agent to execute commands on your behalf
5. **Install Shell Command** - Use the Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux) and run "Shell Command: Install 'kiro' command in PATH"

### Understanding Kiro Features

Kiro provides several unique features:

- **Specs** - Plan and build features using structured specifications that break down requirements into detailed implementation plans
- **Hooks** - Automate repetitive tasks with intelligent triggers that respond to file changes and development events
- **Agentic Chat** - Build features through natural conversation with Kiro that understands your project context
- **Steering** - Guide Kiro's behavior with custom rules and project-specific context through markdown files
- **MCP Servers** - Connect external tools and data sources through the Model Context Protocol

### CLI Configuration

The Kiro CLI provides additional commands:

```bash
# View all available commands
kiro-cli --help

# Diagnose installation issues
kiro-cli doctor

# Check authentication status
kiro-cli whoami

# Update to latest version
kiro-cli update

# Start interactive chat
kiro-cli chat

# Translate natural language to shell commands
kiro-cli translate
```

### Configuring MCP Servers

Kiro supports Model Context Protocol (MCP) servers for extended functionality. Manage MCP servers via the CLI:

```bash
# List configured MCP servers
kiro-cli mcp list

# Add an MCP server
kiro-cli mcp add

# Check MCP server status
kiro-cli mcp status
```

---

## Common Issues

### Issue: AI Features Not Working

**Symptoms**: AI suggestions do not appear, or AI interactions fail.

**Solution**:
1. Ensure you are signed in to Kiro (`kiro-cli whoami`)
2. Check your internet connection
3. Verify your subscription status (some features may have usage limits)
4. Run diagnostics: `kiro-cli doctor`

### Issue: Browser Redirect Fails During Authentication

**Symptoms**: Authentication does not complete after signing in via browser.

**Solution for Windows**:
1. Open Command Prompt as administrator
2. Run Kiro with logging: `kiro --enable-logging`
3. Check logs for access denied errors
4. Verify user has administrator permissions

**Solution for macOS**:
1. Open Kiro and access Help > Toggle Developer Tools
2. Check Console tab for error messages
3. Verify `ioreg` command exists in PATH (typically at `/usr/sbin/ioreg`)

### Issue: Shell Integration Not Working

**Symptoms**: Agent cannot execute commands in the terminal.

**Solution**:
1. Update Kiro via Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) > "Check for Updates"
2. Enable integration: Command Palette > "Enable Shell Integration"
3. Quit and reopen Kiro

For manual configuration, add the appropriate lines to your shell config:

**Zsh (`~/.zshrc`)**:

```bash
[[ "$TERM_PROGRAM" == "kiro" ]] && . "/path/to/kiro/shell-integration.zsh"
```

**Bash (`~/.bashrc`)**:

```bash
[[ "$TERM_PROGRAM" == "kiro" ]] && . "/path/to/kiro/shell-integration.bash"
```

### Issue: Identity Center Session Timeouts

**Symptoms**: Session expires and requires re-authentication frequently.

**Solution**: The default session duration is 8 hours. Administrators can configure longer timeouts via AWS documentation. Alternatively, use GitHub or Google sign-in for longer sessions.

### Issue: High Memory Usage

**Symptoms**: Kiro consumes excessive system resources.

**Solution**:
1. Close unused editor tabs
2. Disable unused extensions
3. Reduce the number of open projects
4. Restart Kiro to clear cached data

---

## Uninstallation

### macOS

```bash
brew uninstall --cask kiro
brew uninstall --cask kiro-cli
rm -rf ~/Library/Application\ Support/Kiro
rm -rf ~/Library/Caches/Kiro
rm -rf ~/.local/bin/kiro-cli
```

### Ubuntu/Debian

For CLI installation:

```bash
rm -rf ~/.local/bin/kiro-cli
rm -rf ~/.kiro
```

For IDE installation:

```bash
sudo rm -rf /opt/kiro
sudo rm -f /usr/local/bin/kiro
sudo rm -f /usr/share/applications/kiro.desktop
rm -rf ~/.config/Kiro
rm -rf ~/.cache/Kiro
```

### Amazon Linux/RHEL

```bash
rm -rf ~/.local/bin/kiro-cli
rm -rf ~/.kiro
sudo rm -rf /opt/kiro
sudo rm -f /usr/local/bin/kiro
rm -rf ~/.config/Kiro
```

### Windows

Using winget:

```powershell
winget uninstall --id Amazon.Kiro --silent
```

Remove user data (PowerShell):

```powershell
Remove-Item -Path "$env:APPDATA\Kiro" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\Kiro" -Recurse -Force -ErrorAction SilentlyContinue
```

---

## References

- [Kiro Official Website](https://kiro.dev/)
- [Kiro Downloads Page](https://kiro.dev/downloads/)
- [Kiro IDE Installation Documentation](https://kiro.dev/docs/getting-started/installation/)
- [Kiro CLI Installation Documentation](https://kiro.dev/docs/cli/installation/)
- [Kiro CLI Commands Reference](https://kiro.dev/docs/cli/reference/cli-commands/)
- [Kiro Troubleshooting Guide](https://kiro.dev/docs/troubleshooting/)
- [Kiro Homebrew Cask (IDE)](https://formulae.brew.sh/cask/kiro)
- [Kiro Homebrew Cask (CLI)](https://formulae.brew.sh/cask/kiro-cli)
- [Kiro winget Package](https://winget.ragerworks.com/package/Amazon.Kiro)
- [Kiro GitHub Repository](https://github.com/kirodotdev/Kiro)
- [Running Kiro CLI on Raspberry Pi](https://dev.to/kirodotdev/running-kiro-cli-from-a-raspberry-pi-400-4d2h)
- [Kiro ARM64 Linux Installation Guide](https://learn.arm.com/install-guides/kiro-cli/)
