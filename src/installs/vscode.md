# Installing Visual Studio Code

## Overview

Visual Studio Code (VS Code) is a free, open-source code editor developed by Microsoft. It provides a lightweight yet powerful development environment with built-in support for JavaScript, TypeScript, and Node.js, along with a rich ecosystem of extensions for other languages and tools. VS Code features intelligent code completion (IntelliSense), integrated debugging, Git integration, and a highly customizable interface that adapts to your workflow.

VS Code is available for Windows, macOS, and Linux, making it a popular choice for cross-platform development teams. This guide documents the installation process for all platforms supported by DevUtils CLI.

## Prerequisites

Before installing Visual Studio Code on any platform, ensure:

1. **Internet connectivity** - Required to download VS Code packages
2. **Administrative privileges** - Required for system-wide installation (most platforms)
3. **Sufficient disk space** - Approximately 500 MB for installation
4. **64-bit operating system** - Required for all platforms (32-bit is deprecated)

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Visual Studio Code:

```bash
brew install --quiet --cask visual-studio-code
```

The `--quiet` flag suppresses non-essential output for cleaner installation logs. The `--cask` option specifies the graphical application version.

After installation, add the `code` command to your PATH for terminal access. This step is normally automatic on modern versions, but if needed, add manually:

**For Zsh (default on macOS):**

```bash
cat << 'EOF' >> ~/.zprofile
# Add Visual Studio Code (code)
export PATH="$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"
EOF
source ~/.zprofile
```

**For Bash:**

```bash
cat << 'EOF' >> ~/.bash_profile
# Add Visual Studio Code (code)
export PATH="$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"
EOF
source ~/.bash_profile
```

#### Verification

Confirm the installation succeeded:

```bash
code --version
```

Expected output (version numbers may vary):

```
1.107.1
e54c774e0add60467559eb0d1e229c6452cf8447
x64
```

Test that VS Code launches correctly:

```bash
code --help
```

#### Troubleshooting

**Problem**: `code: command not found` after installation

**Solution**: The `code` command may not be in your PATH. Either add it manually (see Installation Steps above) or launch VS Code, open the Command Palette (Cmd+Shift+P), and run "Shell Command: Install 'code' command in PATH".

**Problem**: "Visual Studio Code.app" is damaged and can't be opened

**Solution**: Clear the quarantine attribute:

```bash
xattr -cr "/Applications/Visual Studio Code.app"
```

**Problem**: Homebrew reports the cask is already installed

**Solution**: Reinstall to update:

```bash
brew reinstall --cask visual-studio-code
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 (Focal) or later, or Debian 10 (Buster) or later (64-bit)
- sudo privileges
- wget and gpg utilities

**Important**: Do not use `apt install code` without first adding Microsoft's repository. The package may not exist or may be outdated.

#### Installation Steps

**Step 1: Install prerequisites and import Microsoft's GPG key**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget gpg apt-transport-https
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /tmp/microsoft.gpg
sudo install -D -o root -g root -m 644 /tmp/microsoft.gpg /usr/share/keyrings/microsoft.gpg
rm -f /tmp/microsoft.gpg
```

**Step 2: Add Microsoft's APT repository**

```bash
echo "Types: deb
URIs: https://packages.microsoft.com/repos/code
Suites: stable
Components: main
Architectures: amd64,arm64,armhf
Signed-By: /usr/share/keyrings/microsoft.gpg" | sudo tee /etc/apt/sources.list.d/vscode.sources > /dev/null
```

**Step 3: Install Visual Studio Code**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y code
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation with no prompts.

#### Verification

Confirm the installation succeeded:

```bash
code --version
```

Expected output (version numbers may vary):

```
1.107.1
e54c774e0add60467559eb0d1e229c6452cf8447
x64
```

Verify the package is from Microsoft's repository:

```bash
apt-cache policy code
```

The output should show `https://packages.microsoft.com/repos/code` as the source.

#### Troubleshooting

**Problem**: `E: Unable to locate package code`

**Solution**: The repository was not added correctly. Verify the sources file exists and has correct content:

```bash
cat /etc/apt/sources.list.d/vscode.sources
```

If missing or malformed, repeat Steps 1 and 2.

**Problem**: GPG key import fails with permission errors

**Solution**: Ensure wget and gpg are installed, and use a temporary file with proper permissions:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget gpg
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor | sudo tee /usr/share/keyrings/microsoft.gpg > /dev/null
```

**Problem**: VS Code does not launch on headless server

**Solution**: VS Code requires a graphical display. For remote development, use the Remote-SSH extension from a desktop VS Code instance, or install on a desktop system.

**Problem**: Pop!_OS or other distributions install wrong package

**Solution**: Create a preferences file to prioritize Microsoft's repository:

```bash
echo 'Package: code
Pin: origin "packages.microsoft.com"
Pin-Priority: 9999' | sudo tee /etc/apt/preferences.d/code
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
- Raspberry Pi 3B+ or later (64-bit capable hardware recommended)
- At least 1 GB RAM (2 GB or more recommended for comfortable usage)
- sudo privileges

Verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit (recommended)
- `armv7l` = 32-bit (limited performance)

#### Installation Steps

VS Code is available in the official Raspberry Pi OS APT repository. Run these commands:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y code
```

The Raspberry Pi OS repository includes ARM-compatible builds of VS Code, eliminating the need to manually add Microsoft's repository.

**Alternative for latest version (if Raspberry Pi OS repo is outdated):**

If you need the latest VS Code version, add Microsoft's repository instead:

```bash
# Install prerequisites
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget gpg apt-transport-https

# Import GPG key
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /tmp/microsoft.gpg
sudo install -D -o root -g root -m 644 /tmp/microsoft.gpg /usr/share/keyrings/microsoft.gpg
rm -f /tmp/microsoft.gpg

# Add repository
echo "Types: deb
URIs: https://packages.microsoft.com/repos/code
Suites: stable
Components: main
Architectures: arm64,armhf
Signed-By: /usr/share/keyrings/microsoft.gpg" | sudo tee /etc/apt/sources.list.d/vscode.sources > /dev/null

# Install
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y code
```

#### Verification

Confirm the installation succeeded:

```bash
code --version
```

Expected output (version numbers may vary):

```
1.107.1
e54c774e0add60467559eb0d1e229c6452cf8447
arm64
```

Launch VS Code:

```bash
code
```

#### Troubleshooting

**Problem**: VS Code is very slow or unresponsive

**Solution**: Disable hardware acceleration. Open VS Code, press Ctrl+Shift+P, type "Preferences: Configure Runtime Arguments", and add:

```json
{
  "disable-hardware-acceleration": true
}
```

Alternatively, launch with the flag:

```bash
code --disable-gpu
```

**Problem**: Out of memory errors

**Solution**: Close other applications and consider adding swap space:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Problem**: VS Code not found in Programming menu

**Solution**: Refresh the desktop environment:

```bash
lxpanelctl restart
```

**Problem**: Display issues on older Raspberry Pi models

**Solution**: Use the 32-bit version of Raspberry Pi OS for Raspberry Pi 3B or earlier, and ensure GPU memory is set appropriately in `raspi-config`.

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8+, or CentOS 8+
- sudo privileges
- 64-bit system

**Note**: Amazon Linux 2023 uses DNF as the package manager. Amazon Linux 2 uses YUM. This guide uses DNF commands; replace `dnf` with `yum` for AL2.

#### Installation Steps

**Step 1: Import Microsoft's GPG key and add the repository**

```bash
sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\nautorefresh=1\ntype=rpm-md\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" | sudo tee /etc/yum.repos.d/vscode.repo > /dev/null
```

**Step 2: Install Visual Studio Code**

For Amazon Linux 2023 and RHEL 8+ (DNF):

```bash
sudo dnf check-update || true
sudo dnf install -y code
```

For Amazon Linux 2 (YUM):

```bash
sudo yum check-update || true
sudo yum install -y code
```

The `|| true` ensures the command does not fail if there are no updates (check-update returns exit code 100 when updates are available).

#### Verification

Confirm the installation succeeded:

```bash
code --version
```

Expected output (version numbers may vary):

```
1.107.1
e54c774e0add60467559eb0d1e229c6452cf8447
x64
```

Verify the repository is configured:

```bash
dnf repolist | grep code
```

#### Troubleshooting

**Problem**: `No package code available`

**Solution**: The repository was not added correctly. Verify the repo file:

```bash
cat /etc/yum.repos.d/vscode.repo
```

Ensure it contains the `[code]` section with the correct baseurl.

**Problem**: GPG key import fails

**Solution**: Import the key manually with curl:

```bash
curl -sSL https://packages.microsoft.com/keys/microsoft.asc | sudo rpm --import -
```

**Problem**: VS Code fails to launch with display errors

**Solution**: Ensure X11 forwarding is enabled if connecting remotely, or use the Remote-SSH extension from a desktop installation.

**Problem**: Dependency conflicts on older systems

**Solution**: Install required libraries:

```bash
sudo dnf install -y libX11 libxcb libXcomposite libXcursor libXdamage libXext libXfixes libXi libXrender libXtst alsa-lib
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 1709 or later (64-bit), or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install vscode -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

The Chocolatey package automatically:
- Adds VS Code to the system PATH
- Creates "Open with Code" context menu entries for files and folders
- Does NOT start VS Code after installation
- Does NOT create a desktop icon (by default)

**To customize the installation:**

```powershell
choco install vscode -y --params "/NoContextMenuFiles /NoContextMenuFolders"
```

Available parameters:
- `/NoDesktopIcon` - Skip creating a desktop shortcut
- `/NoQuicklaunchIcon` - Skip Quick Launch icon
- `/NoContextMenuFiles` - Remove "Open with Code" from file context menu
- `/NoContextMenuFolders` - Remove "Open with Code" from folder context menu
- `/DontAddToPath` - Do not add to system PATH

#### Verification

Open a **new** Command Prompt or PowerShell window (to pick up PATH changes), then run:

```powershell
code --version
```

Expected output (version numbers may vary):

```
1.107.1
e54c774e0add60467559eb0d1e229c6452cf8447
x64
```

#### Troubleshooting

**Problem**: `code: The term 'code' is not recognized`

**Solution**: Open a new terminal window to refresh the PATH. If the problem persists, add VS Code to PATH manually:

```powershell
$vscodePath = "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$vscodePath", "User")
```

**Problem**: Installation requires restart

**Solution**: Some Windows updates may require a restart. Chocolatey will notify you if this is needed:

```powershell
choco install vscode -y
shutdown /r /t 60 /c "Restarting to complete VS Code installation"
```

**Problem**: Chocolatey installation blocked by antivirus

**Solution**: Temporarily disable real-time scanning or add an exception for the Chocolatey directory (`C:\ProgramData\chocolatey`).

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
winget install --id Microsoft.VisualStudioCode --silent --accept-package-agreements --accept-source-agreements
```

The flags ensure fully non-interactive installation:
- `--id Microsoft.VisualStudioCode` - Exact package identifier
- `--silent` - No installation UI
- `--accept-package-agreements` - Automatically accept license agreements
- `--accept-source-agreements` - Automatically accept source repository agreements

**For custom installation options:**

```powershell
winget install --id Microsoft.VisualStudioCode --silent --accept-package-agreements --accept-source-agreements --override "/VERYSILENT /SP- /MERGETASKS=!runcode,addcontextmenufiles,addcontextmenufolders,associatewithfiles,addtopath"
```

The `/MERGETASKS` parameter controls which installation tasks are performed. Note the exact spelling - a common typo is "MERGETAKS" which is silently ignored.

#### Verification

Open a **new** terminal window, then run:

```powershell
code --version
```

Expected output (version numbers may vary):

```
1.107.1
e54c774e0add60467559eb0d1e229c6452cf8447
x64
```

#### Troubleshooting

**Problem**: `No package found matching input criteria`

**Solution**: Update the winget source:

```powershell
winget source update
winget install --id Microsoft.VisualStudioCode --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: Installation hangs or times out

**Solution**: Try the User scope installation:

```powershell
winget install --id Microsoft.VisualStudioCode --scope user --silent --accept-package-agreements --accept-source-agreements
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

**Recommended Approach**: Install VS Code on Windows and use the Remote-WSL extension. This is Microsoft's recommended workflow and provides the best performance.

#### Installation Steps

**Recommended: VS Code on Windows with Remote-WSL**

1. Install VS Code on Windows using Chocolatey or winget (see Windows sections above)

2. Launch VS Code from within WSL:

```bash
code .
```

On first run, VS Code automatically downloads and installs the VS Code Server in WSL, enabling seamless development.

**Alternative: Native VS Code in WSL (for GUI-enabled WSL)**

If you have WSLg (Windows 11) or an X server configured, you can install VS Code natively in WSL:

```bash
# Install prerequisites
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget gpg apt-transport-https

# Import GPG key
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /tmp/microsoft.gpg
sudo install -D -o root -g root -m 644 /tmp/microsoft.gpg /usr/share/keyrings/microsoft.gpg
rm -f /tmp/microsoft.gpg

# Add repository
echo "Types: deb
URIs: https://packages.microsoft.com/repos/code
Suites: stable
Components: main
Architectures: amd64,arm64,armhf
Signed-By: /usr/share/keyrings/microsoft.gpg" | sudo tee /etc/apt/sources.list.d/vscode.sources > /dev/null

# Install
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y code
```

#### Verification

For the recommended approach (VS Code on Windows):

```bash
code --version
```

This should launch the Windows VS Code and display version information.

For native WSL installation:

```bash
code --version
```

Expected output (version numbers may vary):

```
1.107.1
e54c774e0add60467559eb0d1e229c6452cf8447
x64
```

#### Troubleshooting

**Problem**: `code` command not found in WSL

**Solution**: For the Windows approach, ensure VS Code is installed on Windows and the WSL integration is enabled. Open VS Code on Windows, install the "Remote - WSL" extension, and restart your WSL terminal.

**Problem**: VS Code opens but cannot access WSL files

**Solution**: Launch VS Code from within the WSL terminal:

```bash
cd /home/user/project
code .
```

**Problem**: GUI does not display for native WSL installation

**Solution**: Ensure WSLg is enabled (Windows 11) or configure an X server (Windows 10). For Windows 11:

```powershell
wsl --update
```

**Problem**: Extensions do not work in WSL

**Solution**: Extensions must be installed separately in the WSL context. Open VS Code in WSL, go to Extensions, and click "Install in WSL: Ubuntu" for each extension.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- VS Code installed on Windows (see Windows sections above)

**Note**: Git Bash on Windows does not require a separate VS Code installation. Git Bash inherits the Windows PATH, so once VS Code is installed on Windows, the `code` command is automatically available in Git Bash.

#### Installation Steps

1. Install VS Code on Windows using Chocolatey (recommended):

```powershell
# Run from Administrator PowerShell or Command Prompt
choco install vscode -y
```

2. Open Git Bash - the `code` command will be available

No additional configuration is typically required as Git Bash inherits the Windows PATH.

#### Verification

In Git Bash, confirm VS Code is accessible:

```bash
code --version
```

Expected output (version numbers may vary):

```
1.107.1
e54c774e0add60467559eb0d1e229c6452cf8447
x64
```

Open a project:

```bash
code .
```

#### Troubleshooting

**Problem**: `code: command not found` in Git Bash

**Solution**: VS Code may not be in PATH. Add it manually to your `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/c/Users/$USER/AppData/Local/Programs/Microsoft VS Code/bin"' >> ~/.bashrc
source ~/.bashrc
```

If VS Code is installed system-wide:

```bash
echo 'export PATH="$PATH:/c/Program Files/Microsoft VS Code/bin"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: `the input device is not a TTY` when using integrated terminal features

**Solution**: Git Bash's mintty terminal has TTY compatibility issues. Use `winpty` prefix for interactive commands:

```bash
winpty code --wait
```

Or add an alias to your `~/.bashrc`:

```bash
echo 'alias code="winpty code"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: File paths not recognized correctly

**Solution**: Git Bash may convert Unix-style paths. Use Windows-style paths or escape forward slashes:

```bash
# Use Windows path
code "C:\Users\username\project"

# Or escape the path
code //c/Users/username/project
```

---

## Post-Installation Configuration

After installing VS Code on any platform, consider these recommended configurations.

### Installing Essential Extensions

Install commonly used extensions from the command line:

```bash
# Install essential extensions non-interactively
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension eamodio.gitlens
```

### Configuring Settings Sync

VS Code can synchronize settings across devices using your Microsoft or GitHub account. Enable in VS Code:

1. Click the gear icon (Settings) in the bottom-left
2. Select "Turn on Settings Sync..."
3. Sign in with Microsoft or GitHub

### Setting Default Editor for Git

Configure VS Code as Git's default editor:

```bash
git config --global core.editor "code --wait"
```

Configure VS Code as the default diff and merge tool:

```bash
git config --global diff.tool vscode
git config --global difftool.vscode.cmd 'code --wait --diff $LOCAL $REMOTE'
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd 'code --wait $MERGED'
```

### Enabling Auto-Update (Linux)

On Linux systems using APT or DNF, VS Code updates automatically through the system package manager. To update manually:

**APT (Ubuntu/Debian/Raspberry Pi):**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y code
```

**DNF (Amazon Linux/RHEL):**

```bash
sudo dnf upgrade -y code
```

---

## Common Issues

### Issue: VS Code Opens Blank or White Screen

**Symptoms**: VS Code window opens but shows blank content

**Solutions**:

Disable GPU acceleration:

```bash
code --disable-gpu
```

To make permanent, add to VS Code settings:

1. Open Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Search "Preferences: Configure Runtime Arguments"
3. Add: `"disable-hardware-acceleration": true`

### Issue: High CPU Usage

**Symptoms**: VS Code consumes excessive CPU, especially with TypeScript projects

**Solutions**:

Exclude large folders from file watching in settings.json:

```json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/**": true
  }
}
```

### Issue: Extensions Not Loading

**Symptoms**: Extensions fail to activate or load

**Solutions**:

Clear the extension cache:

```bash
# Linux/macOS
rm -rf ~/.vscode/extensions

# Windows (PowerShell)
Remove-Item -Recurse -Force "$env:USERPROFILE\.vscode\extensions"
```

Reinstall extensions after clearing.

### Issue: Cannot Save Files (Permission Denied)

**Symptoms**: Error saving files in certain directories

**Solutions**:

Check file ownership and permissions:

```bash
ls -la filename
```

For system directories, consider using the "Save as Root" extension or fixing permissions:

```bash
sudo chown -R $USER:$USER /path/to/directory
```

### Issue: Integrated Terminal Not Working

**Symptoms**: Terminal fails to open or shows errors

**Solutions**:

Reset terminal settings:

1. Open settings.json
2. Remove any terminal-related customizations
3. Restart VS Code

Set default shell explicitly:

```json
{
  "terminal.integrated.defaultProfile.linux": "bash",
  "terminal.integrated.defaultProfile.osx": "zsh",
  "terminal.integrated.defaultProfile.windows": "PowerShell"
}
```

---

## References

- [Visual Studio Code Official Website](https://code.visualstudio.com/)
- [VS Code Documentation](https://code.visualstudio.com/docs)
- [VS Code on macOS](https://code.visualstudio.com/docs/setup/mac)
- [VS Code on Linux](https://code.visualstudio.com/docs/setup/linux)
- [VS Code on Windows](https://code.visualstudio.com/docs/setup/windows)
- [VS Code on Raspberry Pi](https://code.visualstudio.com/docs/setup/raspberry-pi)
- [Homebrew Cask: visual-studio-code](https://formulae.brew.sh/cask/visual-studio-code)
- [Chocolatey Package: vscode](https://community.chocolatey.org/packages/vscode)
- [Winget Package: Microsoft.VisualStudioCode](https://winget.run/pkg/Microsoft/VisualStudioCode)
- [VS Code Remote Development](https://code.visualstudio.com/docs/remote/remote-overview)
- [VS Code Release Notes](https://code.visualstudio.com/updates)
