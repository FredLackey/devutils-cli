# Installing Cursor

## Overview

Cursor is an AI-powered code editor built on Visual Studio Code that provides intelligent coding assistance through seamless AI integrations. It enables pair programming with AI, offering features like real-time code suggestions, debugging assistance, and code generation using advanced language models. Because Cursor is forked from VS Code, you can easily migrate your existing extensions, themes, and keybindings.

Cursor is available for macOS, Windows, and Linux. It requires an active internet connection for AI features and offers both free and paid subscription tiers.

## Prerequisites

Before installing Cursor on any platform, ensure:

1. **Internet connectivity** - Required for downloading and for all AI-powered features
2. **Sufficient disk space** - At least 2 GB available
3. **Minimum RAM** - 4 GB RAM recommended
4. **Administrative privileges** - Required on most platforms for installation

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

Run the following command to install Cursor via Homebrew:

```bash
brew install --cask --quiet cursor
```

The `--cask` flag indicates this is a macOS application (not a command-line formula), and `--quiet` suppresses non-essential output for automation compatibility.

After installation, Cursor is available in `/Applications/Cursor.app` and can be launched from Spotlight or the Applications folder.

#### Verification

Confirm the installation succeeded by launching the application:

```bash
open -a Cursor
```

Alternatively, verify the application exists:

```bash
ls /Applications/Cursor.app
```

Expected output:

```
/Applications/Cursor.app
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

**Problem**: Installation fails with "Cask 'cursor' is unavailable"

**Solution**: Update Homebrew to get the latest cask definitions:

```bash
brew update
brew install --cask --quiet cursor
```

**Problem**: App shows "Cursor can't be opened because Apple cannot check it for malicious software"

**Solution**: This can occur on first launch. Right-click the app in Applications and select "Open", then click "Open" in the dialog. Alternatively, clear the quarantine flag:

```bash
xattr -cr /Applications/Cursor.app
```

**Problem**: Cursor does not appear in PATH for terminal commands

**Solution**: Open Cursor, then press `Cmd+Shift+P` to open the Command Palette. Type "Shell Command: Install 'cursor' command in PATH" and select it. This adds the `cursor` command to your terminal.

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 or later, or Debian 10 or later (64-bit x86_64 or ARM64)
- sudo privileges
- Active internet connection

#### Installation Steps

**Method: Download and Install .deb Package**

Download and install the Cursor .deb package directly. This method enables automatic updates through your package manager.

```bash
curl -fsSL "https://www.cursor.com/api/download?platform=linux-deb-x64&releaseTrack=stable" -o /tmp/cursor.deb && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/cursor.deb && rm /tmp/cursor.deb
```

This command:
- Downloads the latest stable Cursor .deb package for x86_64
- Installs it using apt-get with no interactive prompts
- Cleans up the downloaded file

For ARM64 systems (like AWS Graviton), use:

```bash
curl -fsSL "https://www.cursor.com/api/download?platform=linux-deb-arm64&releaseTrack=stable" -o /tmp/cursor.deb && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/cursor.deb && rm /tmp/cursor.deb
```

After installation, Cursor is available in your application menu and can be launched from the terminal with the `cursor` command.

**Alternative Method: AppImage (Portable)**

If you prefer not to use the package manager or encounter issues with the .deb package:

```bash
curl -fsSL "https://www.cursor.com/api/download?platform=linux-appImage-x64&releaseTrack=stable" -o /tmp/cursor.AppImage && chmod +x /tmp/cursor.AppImage && sudo mv /tmp/cursor.AppImage /opt/cursor.AppImage
```

Install the required FUSE library for AppImage support:

For Ubuntu 20.04 - 22.04:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libfuse2
```

For Ubuntu 24.04 and later:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libfuse2t64
```

**Important**: On Ubuntu 22.04 and later, do NOT install the `fuse` package directly as it can remove critical system packages. Always use `libfuse2` or `libfuse2t64` instead.

#### Verification

For .deb installation, verify with:

```bash
cursor --version
```

For AppImage installation, verify with:

```bash
/opt/cursor.AppImage --version
```

Launch Cursor:

```bash
cursor
```

Or for AppImage:

```bash
/opt/cursor.AppImage
```

#### Troubleshooting

**Problem**: "dlopen(): error loading libfuse.so.2" when running AppImage

**Solution**: Install the FUSE library as shown in the installation steps. Alternatively, extract and run the AppImage without FUSE:

```bash
/opt/cursor.AppImage --appimage-extract
./squashfs-root/cursor
```

**Problem**: Sandbox errors when launching Cursor

**Solution**: In trusted environments, you can bypass sandbox restrictions. Modify your launch command:

```bash
/opt/cursor.AppImage --no-sandbox
```

**Note**: Using `--no-sandbox` reduces security. Only use this in trusted environments.

**Problem**: apt update fails after installing Cursor .deb

**Solution**: There are known issues with the Cursor apt repository on some systems. If apt update fails, temporarily disable the Cursor repository:

```bash
sudo mv /etc/apt/sources.list.d/cursor.list /etc/apt/sources.list.d/cursor.list.disabled
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

Cursor will still work; you will just need to update it manually by downloading a new .deb package.

**Problem**: `cursor: command not found` after installation

**Solution**: The cursor command may not be in your PATH. Open Cursor graphically, then use the Command Palette (`Ctrl+Shift+P`) and run "Shell Command: Install 'cursor' command in PATH".

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit) - ARM64/aarch64 architecture **required**
- Raspberry Pi 4 or later with 4 GB or more RAM recommended
- sudo privileges
- Active internet connection

**Critical Architecture Requirement**: Cursor requires a 64-bit operating system. Verify your architecture:

```bash
uname -m
```

This must output `aarch64`. If it outputs `armv7l`, you are running 32-bit Raspberry Pi OS and must install the 64-bit version from the Raspberry Pi Imager.

#### Installation Steps

**Method: Download and Install .deb Package (ARM64)**

```bash
curl -fsSL "https://www.cursor.com/api/download?platform=linux-deb-arm64&releaseTrack=stable" -o /tmp/cursor.deb && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/cursor.deb && rm /tmp/cursor.deb
```

**Alternative Method: AppImage (ARM64)**

```bash
curl -fsSL "https://www.cursor.com/api/download?platform=linux-appImage-arm64&releaseTrack=stable" -o /tmp/cursor.AppImage && chmod +x /tmp/cursor.AppImage && sudo mv /tmp/cursor.AppImage /opt/cursor.AppImage
```

Install the FUSE library for AppImage support:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libfuse2
```

#### Verification

For .deb installation:

```bash
cursor --version
```

For AppImage installation:

```bash
/opt/cursor.AppImage --version
```

#### Troubleshooting

**Problem**: Cursor crashes immediately on launch

**Solution**: Some users have reported crashes with the ARM64 AppImage on Raspberry Pi 5. Try using the .deb package instead, or extract and run the AppImage:

```bash
/opt/cursor.AppImage --appimage-extract
./squashfs-root/cursor --no-sandbox
```

**Problem**: `uname -m` shows `armv7l` instead of `aarch64`

**Solution**: You are running 32-bit Raspberry Pi OS. Cursor requires 64-bit. Download and install the 64-bit Raspberry Pi OS image from https://www.raspberrypi.com/software/.

**Problem**: Slow performance or high memory usage

**Solution**: Raspberry Pi has limited resources. Close other applications and ensure you have at least 4 GB RAM. Consider increasing swap:

```bash
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

**Problem**: Display issues on Wayland

**Solution**: If you experience rendering issues on Wayland, try running with X11:

```bash
GDK_BACKEND=x11 cursor
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8+, Fedora, or CentOS Stream 8+
- sudo privileges
- Active internet connection
- Desktop environment (if using GUI; Cursor is a graphical application)

#### Installation Steps

**Method: Download and Install RPM Package**

For Amazon Linux 2023, RHEL 8+, and Fedora (using DNF):

```bash
curl -fsSL "https://www.cursor.com/api/download?platform=linux-rpm-x64&releaseTrack=stable" -o /tmp/cursor.rpm && sudo dnf install -y /tmp/cursor.rpm && rm /tmp/cursor.rpm
```

For Amazon Linux 2 and older systems (using YUM):

```bash
curl -fsSL "https://www.cursor.com/api/download?platform=linux-rpm-x64&releaseTrack=stable" -o /tmp/cursor.rpm && sudo yum install -y /tmp/cursor.rpm && rm /tmp/cursor.rpm
```

For ARM64 systems (AWS Graviton, etc.):

```bash
curl -fsSL "https://www.cursor.com/api/download?platform=linux-rpm-arm64&releaseTrack=stable" -o /tmp/cursor.rpm && sudo dnf install -y /tmp/cursor.rpm && rm /tmp/cursor.rpm
```

**Alternative Method: AppImage (Portable)**

For headless servers or environments where the RPM installation is not suitable:

```bash
curl -fsSL "https://www.cursor.com/api/download?platform=linux-appImage-x64&releaseTrack=stable" -o /tmp/cursor.AppImage && chmod +x /tmp/cursor.AppImage && sudo mv /tmp/cursor.AppImage /opt/cursor.AppImage
```

Install FUSE for AppImage support:

```bash
sudo dnf install -y fuse fuse-libs
```

Or for YUM-based systems:

```bash
sudo yum install -y fuse fuse-libs
```

#### Verification

For RPM installation:

```bash
cursor --version
```

For AppImage installation:

```bash
/opt/cursor.AppImage --version
```

#### Troubleshooting

**Problem**: No graphical display available

**Solution**: Cursor is a GUI application and requires a desktop environment. For headless servers, you can use X11 forwarding:

```bash
ssh -X user@server
cursor
```

Or install a desktop environment:

```bash
sudo dnf groupinstall -y "Server with GUI"
```

**Problem**: AppImage fails with "FUSE not available"

**Solution**: Install FUSE:

```bash
sudo dnf install -y fuse fuse-libs
```

Or extract and run the AppImage directly:

```bash
/opt/cursor.AppImage --appimage-extract
./squashfs-root/cursor
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

**Solution**: Install common dependencies:

```bash
sudo dnf install -y libX11 libXScrnSaver gtk3 nss alsa-lib
```

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
winget install --id Anysphere.Cursor --silent --accept-package-agreements --accept-source-agreements
```

This command:
- `--id Anysphere.Cursor` - Specifies the Cursor package
- `--silent` - Runs without user prompts
- `--accept-package-agreements` - Automatically accepts package license agreements
- `--accept-source-agreements` - Automatically accepts source license agreements

**Alternative Method: Chocolatey**

If Chocolatey is installed, you can use:

```powershell
choco install cursoride -y
```

The `-y` flag automatically confirms the installation without prompts.

**Note**: The Chocolatey package name is `cursoride`, not `cursor`.

After installation, close and reopen your terminal for PATH updates to take effect.

#### Verification

Open a new PowerShell or Command Prompt window, then verify the installation:

```powershell
winget list --id Anysphere.Cursor
```

Or launch Cursor:

```powershell
cursor
```

Alternatively, search for "Cursor" in the Start Menu.

#### Troubleshooting

**Problem**: `winget: The term 'winget' is not recognized`

**Solution**: winget may not be installed or PATH may not be updated. Install App Installer from the Microsoft Store:

```powershell
start ms-windows-store://pdp/?productid=9NBLGGH4NNS1
```

After installation, open a new terminal window.

**Problem**: Installation fails with "Administrator privileges required"

**Solution**: Right-click PowerShell or Command Prompt and select "Run as administrator", then retry the installation command.

**Problem**: `cursor: command not found` after installation

**Solution**: The PATH has not been updated. Close and reopen your terminal. If the problem persists, open Cursor from the Start Menu, then use the Command Palette (`Ctrl+Shift+P`) and run "Shell Command: Install 'cursor' command in PATH".

**Problem**: Windows Defender SmartScreen blocks the installer

**Solution**: Cursor is a legitimate application from Anysphere. Click "More info" and then "Run anyway". For enterprise environments, contact your IT administrator to whitelist the Cursor installer.

**Problem**: Antivirus flags the installer

**Solution**: Some antivirus software may flag the installer due to its behavior. Temporarily disable your antivirus during installation, or add an exception for the Cursor installer and installation directory.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- Windows Subsystem for Linux installed with Ubuntu distribution
- WSL 2 recommended for best performance
- Cursor installed on Windows (see Windows section above)

**Important**: Cursor runs on Windows and connects to WSL using the Remote - WSL extension pattern (similar to VS Code). You do not install Cursor inside WSL itself. Instead, install Cursor on Windows and use its remote development capabilities to connect to your WSL environment.

Verify WSL is installed and running Ubuntu:

```bash
wsl --list --verbose
```

#### Installation Steps

**Step 1: Install Cursor on Windows**

From PowerShell (as Administrator):

```powershell
winget install --id Anysphere.Cursor --silent --accept-package-agreements --accept-source-agreements
```

**Step 2: Configure WSL PATH (Optional)**

To launch Cursor from within WSL, add the Windows Cursor installation to your WSL PATH. Add this line to your `~/.bashrc` or `~/.zshrc` in WSL:

```bash
echo 'export PATH="$PATH:/mnt/c/Users/$(cmd.exe /c echo %USERNAME% 2>/dev/null | tr -d '\r')/AppData/Local/Programs/cursor/resources/app/bin"' >> ~/.bashrc && source ~/.bashrc
```

**Step 3: Connect to WSL from Cursor**

1. Launch Cursor on Windows
2. Click the green icon in the bottom-left corner (shows "><" or "Remote")
3. Select "Connect to WSL" from the menu
4. Choose your Ubuntu distribution from the list
5. Cursor installs the necessary server components in WSL (first connection may take a few minutes)

After connecting, you can open folders and files within your WSL filesystem directly from Cursor.

#### Verification

From within WSL, verify you can launch Cursor (after PATH configuration):

```bash
cursor --version
```

Or from Windows, verify Cursor can connect to WSL:

1. Open Cursor
2. Press `Ctrl+Shift+P` to open the Command Palette
3. Type "Remote-WSL: New Window" and select it
4. Verify Cursor opens with a WSL connection (indicated in the bottom-left corner)

#### Troubleshooting

**Problem**: "WSL extension is supported only in Microsoft versions of VS Code"

**Solution**: This error can occur if there is a conflict with VS Code Remote extensions. Ensure you are using the latest version of Cursor. Reinstall Cursor if necessary:

```powershell
winget uninstall --id Anysphere.Cursor --silent
winget install --id Anysphere.Cursor --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: Cannot connect to WSL from Cursor

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

**Problem**: `cursor: command not found` in WSL

**Solution**: The PATH may not include the Windows Cursor installation. Verify the path exists and update your shell configuration:

```bash
ls "/mnt/c/Users/$(cmd.exe /c echo %USERNAME% 2>/dev/null | tr -d '\r')/AppData/Local/Programs/cursor/resources/app/bin"
```

If the directory does not exist, Cursor may be installed in a different location. Search for it:

```bash
find /mnt/c/Users -name "cursor" -type d 2>/dev/null | head -5
```

---

### Git Bash (Windows)

#### Prerequisites

- Windows 10 or later
- Git for Windows installed (provides Git Bash)
- PowerShell available (for initial installation)

Git Bash provides a Unix-compatible environment on Windows. Since Cursor is a Windows application, it is installed on Windows and accessible from Git Bash.

Download Git for Windows from https://git-scm.com/downloads/win if not already installed.

#### Installation Steps

Git Bash can execute Windows commands, so use winget from within Git Bash:

```bash
winget.exe install --id Anysphere.Cursor --silent --accept-package-agreements --accept-source-agreements
```

**Alternative: Use PowerShell from Git Bash**

```bash
powershell.exe -Command "winget install --id Anysphere.Cursor --silent --accept-package-agreements --accept-source-agreements"
```

**Alternative: Use Chocolatey from Git Bash**

```bash
choco.exe install cursoride -y
```

After installation, close and reopen Git Bash for PATH updates to take effect.

#### Verification

Open a new Git Bash window and run:

```bash
cursor --version
```

Or launch Cursor:

```bash
cursor
```

If the cursor command is not available, launch via Windows:

```bash
cmd.exe /c start "" "Cursor"
```

#### Troubleshooting

**Problem**: `winget.exe: command not found`

**Solution**: Winget may not be in the Git Bash PATH. Use the full path:

```bash
"/c/Users/$USER/AppData/Local/Microsoft/WindowsApps/winget.exe" install --id Anysphere.Cursor --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: `cursor: command not found` after installation

**Solution**: The PATH in Git Bash may not include the Cursor binary. Add it manually:

```bash
echo 'export PATH="$PATH:/c/Users/$USER/AppData/Local/Programs/cursor/resources/app/bin"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: PowerShell command fails from Git Bash

**Solution**: Ensure PowerShell is accessible. Try using the full path:

```bash
"/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" -Command "winget install --id Anysphere.Cursor --silent --accept-package-agreements --accept-source-agreements"
```

**Problem**: Cannot launch Cursor from Git Bash

**Solution**: Use the Windows `start` command through cmd:

```bash
cmd.exe /c start "" "Cursor"
```

Or open directly using the Windows path:

```bash
"/c/Users/$USER/AppData/Local/Programs/cursor/Cursor.exe" &
```

---

## Post-Installation Configuration

### First-Time Setup

After installing and launching Cursor on any platform:

1. **Sign in (Optional)** - Create a Cursor account or sign in with GitHub/Google to enable cloud sync and access AI features
2. **Import VS Code Settings** - Cursor prompts you to import extensions, themes, keybindings, and settings from VS Code if detected
3. **Configure AI Model** - Go to Settings > AI to configure your preferred AI model and API keys
4. **Install Shell Command** - Use the Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux) and run "Shell Command: Install 'cursor' command in PATH"

### Keyboard Shortcuts

Cursor inherits VS Code keyboard shortcuts and adds AI-specific ones:

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| Open Command Palette | Cmd+Shift+P | Ctrl+Shift+P |
| AI Chat | Cmd+L | Ctrl+L |
| AI Edit | Cmd+K | Ctrl+K |
| Accept AI Suggestion | Tab | Tab |
| New File | Cmd+N | Ctrl+N |
| Open Folder | Cmd+O | Ctrl+O |
| Toggle Terminal | Ctrl+` | Ctrl+` |

### Configuring Extensions

Cursor supports VS Code extensions. Install extensions via:

1. Open the Extensions view (`Cmd+Shift+X` on macOS, `Ctrl+Shift+X` on Windows/Linux)
2. Search for the desired extension
3. Click "Install"

Popular extensions for development:
- ESLint (for JavaScript/TypeScript linting)
- Prettier (for code formatting)
- GitLens (for enhanced Git integration)
- Remote - SSH (for remote development)

### Configuring AI Features

Cursor offers multiple AI models and configuration options:

1. Open Settings (`Cmd+,` on macOS, `Ctrl+,` on Windows/Linux)
2. Navigate to "AI" or "Cursor" settings
3. Configure:
   - Default AI model (GPT-4, Claude, etc.)
   - API keys (if using your own)
   - Context settings (how much code context to include)
   - Privacy settings (what data is sent to AI)

---

## Common Issues

### Issue: AI Features Not Working

**Symptoms**: AI suggestions do not appear, or AI chat returns errors.

**Solution**:
1. Ensure you are signed in to Cursor
2. Check your internet connection
3. Verify your subscription status (some features require paid plans)
4. Check Cursor status at https://status.cursor.com/

### Issue: High CPU or Memory Usage

**Symptoms**: Cursor consumes excessive system resources.

**Solution**:
1. Disable unused extensions (Extensions view > Installed > Disable)
2. Close unused editor tabs
3. Reduce the number of open projects
4. Restart Cursor to clear cached data

### Issue: Extensions Not Working

**Symptoms**: VS Code extensions fail to install or function.

**Solution**:
1. Ensure you are using compatible extensions (some VS Code extensions may not work with Cursor)
2. Check extension compatibility on the extension's marketplace page
3. Try reinstalling the extension
4. Report incompatible extensions to the Cursor team

### Issue: Cursor Cannot Find Installed Packages (Node, Python, etc.)

**Symptoms**: Terminal in Cursor cannot find globally installed packages.

**Solution**: Cursor may not inherit your shell's PATH. Add this to your shell configuration:

For macOS/Linux (`~/.bashrc` or `~/.zshrc`):

```bash
export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin"
```

Restart Cursor after modifying shell configuration.

### Issue: Git Integration Not Working

**Symptoms**: Git status, diff, or other features do not work.

**Solution**:
1. Ensure Git is installed and in your PATH
2. Open a terminal in Cursor and run `git --version`
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
brew uninstall --cask cursor
rm -rf ~/Library/Application\ Support/Cursor
rm -rf ~/Library/Caches/Cursor
```

### Ubuntu/Debian

For .deb installation:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y cursor
rm -rf ~/.config/Cursor
rm -rf ~/.cache/Cursor
```

For AppImage installation:

```bash
sudo rm /opt/cursor.AppImage
rm -rf ~/.config/Cursor
rm -rf ~/.cache/Cursor
```

### Amazon Linux/RHEL

For RPM installation:

```bash
sudo dnf remove -y cursor
rm -rf ~/.config/Cursor
rm -rf ~/.cache/Cursor
```

For AppImage installation:

```bash
sudo rm /opt/cursor.AppImage
rm -rf ~/.config/Cursor
rm -rf ~/.cache/Cursor
```

### Windows

Using winget:

```powershell
winget uninstall --id Anysphere.Cursor --silent
```

Using Chocolatey:

```powershell
choco uninstall cursoride -y
```

Remove user data (PowerShell):

```powershell
Remove-Item -Path "$env:APPDATA\Cursor" -Recurse -Force
Remove-Item -Path "$env:LOCALAPPDATA\Cursor" -Recurse -Force
```

---

## References

- [Cursor Official Website](https://cursor.com/)
- [Cursor Download Page](https://cursor.com/download)
- [Cursor Documentation](https://cursor.com/docs)
- [Cursor CLI Installation](https://cursor.com/docs/cli/installation)
- [Cursor Downloads Reference](https://cursor.com/docs/downloads)
- [Cursor Homebrew Cask](https://formulae.brew.sh/cask/cursor)
- [Cursor Chocolatey Package](https://community.chocolatey.org/packages/cursoride)
- [Cursor winget Package](https://winstall.app/apps/Anysphere.Cursor)
- [Cursor Community Forum](https://forum.cursor.com/)
- [Cursor GitHub Issues](https://github.com/cursor/cursor/issues)
- [Cursor Status Page](https://status.cursor.com/)
