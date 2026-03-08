# Installing Sublime Text

## Overview

Sublime Text is a sophisticated text editor for code, markup, and prose. Known for its speed, elegant interface, and powerful features, Sublime Text offers:

- **Goto Anything**: Quickly navigate to files, symbols, or lines with a single keyboard shortcut
- **Multiple Selections**: Make multiple changes at once with multiple cursors
- **Command Palette**: Access frequently used functions quickly without navigating menus
- **Distraction Free Mode**: Full-screen editing without any chrome
- **Split Editing**: Edit files side by side or in multiple panes
- **Instant Project Switch**: Switch between projects with no save prompts
- **Cross-Platform**: Available on macOS, Windows, and Linux with a single license

Sublime Text is a paid application with an unlimited evaluation period. A license is required for continued use but the editor remains fully functional during evaluation.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None (Homebrew automatically handles all Sublime Text dependencies)

### Ubuntu (APT/Snap)
- **Required:**
  - `sudo` - Pre-installed on Ubuntu
  - `wget` - Install via `sudo apt-get install -y wget` (used for downloading GPG key)
- **Optional:** None
- **Auto-installed:**
  - `apt-transport-https` - Installed automatically by the installer script
  - `ca-certificates` - Installed automatically by the installer script
  - `curl` - Installed automatically by the installer script
  - `gnupg` - Installed automatically by the installer script

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - 64-bit operating system (`aarch64` architecture) - Sublime Text 4 does not support 32-bit systems
  - `sudo` - Pre-installed on Raspberry Pi OS
  - `wget` - Install via `sudo apt-get install -y wget` (used for downloading GPG key)
- **Optional:** None
- **Auto-installed:**
  - `apt-transport-https` - Installed automatically by the installer script
  - `ca-certificates` - Installed automatically by the installer script
  - `curl` - Installed automatically by the installer script
  - `gnupg` - Installed automatically by the installer script

### Amazon Linux (DNF/YUM)
- **Required:**
  - `dnf` or `yum` package manager - Pre-installed on Amazon Linux, RHEL, CentOS, and Fedora
  - x86_64 architecture - Sublime Text does not provide ARM64 RPM packages
  - `sudo` - Pre-installed on Amazon Linux
- **Optional:**
  - `yum-utils` - Required for `yum-config-manager` on YUM-based systems (Amazon Linux 2); installed automatically by the script if missing
  - `dnf-plugins-core` - Required for `dnf config-manager` on some DNF systems; may need manual installation via `sudo dnf install -y dnf-plugins-core`
- **Auto-installed:**
  - `yum-utils` - Installed automatically by the installer script when using YUM if `yum-config-manager` is not available

### Windows (Chocolatey/winget)
- **Required:**
  - Chocolatey - Install via Administrator PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
- **Optional:** None
- **Auto-installed:** None (Chocolatey automatically handles all Sublime Text dependencies)

### Git Bash (Manual/Portable)
- **Required:**
  - Chocolatey installed on Windows host - See Windows section above for installation
  - PowerShell access - Pre-installed on Windows
  - Administrator privileges - Required to run Chocolatey commands
- **Optional:** None
- **Auto-installed:** None (installation occurs on Windows host via PowerShell/Chocolatey)

## Prerequisites

Before installing Sublime Text on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required for system-wide installation (sudo on Linux/macOS, Administrator on Windows)
3. **64-bit operating system** - Sublime Text 4 only supports 64-bit systems

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- Administrator privileges for Homebrew operations

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Sublime Text:

```bash
brew install --quiet --cask sublime-text
```

The `--quiet` flag suppresses non-essential output, and `--cask` specifies the graphical application version.

#### Verification

Confirm the installation succeeded:

```bash
subl --version
```

Expected output (version numbers may vary):

```
Sublime Text Build 4200
```

Launch Sublime Text from Applications or via command line:

```bash
open -a "Sublime Text"
```

If the `subl` command is not available, create a symbolic link:

```bash
sudo ln -sf "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl" /usr/local/bin/subl
```

#### Troubleshooting

**Problem**: `subl: command not found` after installation

**Solution**: The command-line tool symlink may not exist. Create it manually:

```bash
sudo ln -sf "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl" /usr/local/bin/subl
```

**Problem**: Homebrew cask installation fails with permission error

**Solution**: Fix Homebrew permissions:

```bash
sudo chown -R $(whoami) /usr/local/Caskroom
brew install --quiet --cask sublime-text
```

**Problem**: "Sublime Text.app is damaged and can't be opened" on Apple Silicon

**Solution**: Remove the quarantine attribute:

```bash
xattr -cr "/Applications/Sublime Text.app"
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04+ or Debian 10+ (64-bit)
- sudo privileges
- wget or curl installed

#### Installation Steps

**Step 1: Install prerequisites and import GPG key**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y apt-transport-https ca-certificates curl gnupg
```

Import the Sublime Text GPG signing key:

```bash
wget -qO - https://download.sublimetext.com/sublimehq-pub.gpg | sudo tee /etc/apt/keyrings/sublimehq-pub.asc > /dev/null
```

**Step 2: Add the Sublime Text repository**

```bash
echo -e 'Types: deb\nURIs: https://download.sublimetext.com/\nSuites: apt/stable/\nSigned-By: /etc/apt/keyrings/sublimehq-pub.asc' | sudo tee /etc/apt/sources.list.d/sublime-text.sources
```

**Step 3: Update package lists and install Sublime Text**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y sublime-text
```

#### Verification

Confirm the installation succeeded:

```bash
subl --version
```

Expected output (version numbers may vary):

```
Sublime Text Build 4200
```

Launch Sublime Text:

```bash
subl
```

#### Troubleshooting

**Problem**: `E: Unable to locate package sublime-text`

**Solution**: The repository was not added correctly. Verify the sources file exists:

```bash
cat /etc/apt/sources.list.d/sublime-text.sources
```

If empty or missing, repeat Step 2.

**Problem**: GPG key import fails

**Solution**: Ensure the keyrings directory exists and retry:

```bash
sudo mkdir -p /etc/apt/keyrings
wget -qO - https://download.sublimetext.com/sublimehq-pub.gpg | sudo tee /etc/apt/keyrings/sublimehq-pub.asc > /dev/null
```

**Problem**: "NO_PUBKEY" error during apt-get update

**Solution**: Re-import the GPG key:

```bash
wget -qO - https://download.sublimetext.com/sublimehq-pub.gpg | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/sublimehq-archive.gpg
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit) - Bookworm or Bullseye
- Raspberry Pi 3B+ or later (64-bit capable hardware)
- sudo privileges

**Important**: Sublime Text 4 requires a 64-bit operating system. It does not support 32-bit Raspberry Pi OS.

Verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit (supported)
- `armv7l` = 32-bit (NOT supported)

If running 32-bit Raspberry Pi OS, you must upgrade to 64-bit before proceeding.

#### Installation Steps

The Sublime Text APT repository includes ARM64 packages, allowing installation via the same method as Ubuntu/Debian.

**Step 1: Install prerequisites and import GPG key**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y apt-transport-https ca-certificates curl gnupg
wget -qO - https://download.sublimetext.com/sublimehq-pub.gpg | sudo tee /etc/apt/keyrings/sublimehq-pub.asc > /dev/null
```

**Step 2: Add the Sublime Text repository**

```bash
echo -e 'Types: deb\nURIs: https://download.sublimetext.com/\nSuites: apt/stable/\nSigned-By: /etc/apt/keyrings/sublimehq-pub.asc' | sudo tee /etc/apt/sources.list.d/sublime-text.sources
```

**Step 3: Update package lists and install Sublime Text**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y sublime-text
```

#### Verification

Confirm the installation succeeded:

```bash
subl --version
```

Expected output (version numbers may vary):

```
Sublime Text Build 4200
```

Launch Sublime Text from the Programming menu or via command line:

```bash
subl
```

#### Troubleshooting

**Problem**: Installation fails with architecture error

**Solution**: Verify you are running 64-bit Raspberry Pi OS:

```bash
uname -m
```

If the output is `armv7l`, you need to install 64-bit Raspberry Pi OS. Download it from the official Raspberry Pi website and flash a new SD card.

**Problem**: Sublime Text runs slowly on Raspberry Pi

**Solution**: Sublime Text is resource-intensive. Ensure you have sufficient free memory:

```bash
free -h
```

Close unnecessary applications or add swap space if needed:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Problem**: Display issues on Raspberry Pi

**Solution**: If experiencing graphical glitches, try disabling GPU rendering. Add to your Sublime Text preferences:

```json
{
    "hardware_acceleration": "none"
}
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023, Amazon Linux 2, RHEL 8+, CentOS 8+, or Fedora (64-bit)
- sudo privileges

**Important**: Sublime Text does not provide ARM64 RPM packages. This installation method only works on x86_64 systems.

#### Installation Steps

**Step 1: Import the GPG signing key**

```bash
sudo rpm -v --import https://download.sublimetext.com/sublimehq-rpm-pub.gpg
```

**Step 2: Add the Sublime Text repository**

For Amazon Linux 2023, RHEL 8+, or Fedora (DNF-based systems):

```bash
sudo dnf config-manager --add-repo https://download.sublimetext.com/rpm/stable/x86_64/sublime-text.repo
```

**Note for Fedora 41+ (dnf5)**: Use the updated syntax:

```bash
sudo dnf config-manager addrepo --from-repofile=https://download.sublimetext.com/rpm/stable/x86_64/sublime-text.repo
```

For Amazon Linux 2 or older RHEL/CentOS (YUM-based systems):

```bash
sudo yum-config-manager --add-repo https://download.sublimetext.com/rpm/stable/x86_64/sublime-text.repo
```

**Step 3: Install Sublime Text**

For DNF-based systems:

```bash
sudo dnf install -y sublime-text
```

For YUM-based systems:

```bash
sudo yum install -y sublime-text
```

#### Verification

Confirm the installation succeeded:

```bash
subl --version
```

Expected output (version numbers may vary):

```
Sublime Text Build 4200
```

Launch Sublime Text:

```bash
subl
```

#### Troubleshooting

**Problem**: `yum-config-manager: command not found`

**Solution**: Install yum-utils first:

```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.sublimetext.com/rpm/stable/x86_64/sublime-text.repo
```

**Problem**: `dnf config-manager: command not found` on Amazon Linux 2023

**Solution**: Install dnf-plugins-core:

```bash
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://download.sublimetext.com/rpm/stable/x86_64/sublime-text.repo
```

**Problem**: GPG key verification fails

**Solution**: Re-import the GPG key and verify:

```bash
sudo rpm -v --import https://download.sublimetext.com/sublimehq-rpm-pub.gpg
rpm -qa gpg-pubkey* | xargs rpm -qi | grep -i sublime
```

**Problem**: Repository not found on ARM-based systems

**Solution**: Sublime Text does not provide ARM64 RPM packages. For ARM-based Amazon Linux or RHEL systems, no official installation method is available. Consider using an x86_64 system or alternative editor.

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Administrator PowerShell or Command Prompt
- Chocolatey or winget package manager

**Installing Chocolatey** (if not already installed):

Run this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

**Using Chocolatey (recommended):**

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install sublimetext4 -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Using winget:**

```powershell
winget install --id SublimeHQ.SublimeText.4 --silent --accept-package-agreements --accept-source-agreements
```

The `--silent` flag suppresses the installer UI, and the `--accept-*` flags automatically accept licenses.

#### Verification

Open a new Command Prompt or PowerShell window, then run:

```powershell
subl --version
```

Expected output (version numbers may vary):

```
Sublime Text Build 4200
```

If `subl` is not recognized, the installation directory may not be in PATH. Add it:

```powershell
$sublPath = "C:\Program Files\Sublime Text"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$sublPath", [EnvironmentVariableTarget]::User)
```

Then open a new terminal window.

#### Troubleshooting

**Problem**: `subl: The term 'subl' is not recognized`

**Solution**: Add Sublime Text to your PATH. The default installation location is `C:\Program Files\Sublime Text`. Add this to your system PATH:

1. Open System Properties > Advanced > Environment Variables
2. Under User variables, edit Path
3. Add `C:\Program Files\Sublime Text`
4. Open a new terminal window

Or via PowerShell:

```powershell
$sublPath = "C:\Program Files\Sublime Text"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$sublPath", [EnvironmentVariableTarget]::User)
```

**Problem**: Chocolatey installation fails with access denied

**Solution**: Ensure you are running PowerShell as Administrator. Right-click PowerShell and select "Run as administrator".

**Problem**: winget installation shows "Unknown" version

**Solution**: This is a known winget manifest issue. The installation should complete successfully despite this warning. Verify by running:

```powershell
subl --version
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

**Note**: GUI applications in WSL require WSLg (Windows 11) or an X server (Windows 10). Without a display server, Sublime Text cannot launch its graphical interface.

#### Installation Steps

Run these commands in your WSL Ubuntu terminal:

**Step 1: Install prerequisites and import GPG key**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y apt-transport-https ca-certificates curl gnupg
wget -qO - https://download.sublimetext.com/sublimehq-pub.gpg | sudo tee /etc/apt/keyrings/sublimehq-pub.asc > /dev/null
```

**Step 2: Add the Sublime Text repository**

```bash
echo -e 'Types: deb\nURIs: https://download.sublimetext.com/\nSuites: apt/stable/\nSigned-By: /etc/apt/keyrings/sublimehq-pub.asc' | sudo tee /etc/apt/sources.list.d/sublime-text.sources
```

**Step 3: Update package lists and install Sublime Text**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y sublime-text
```

#### Verification

Confirm the installation succeeded:

```bash
subl --version
```

Expected output (version numbers may vary):

```
Sublime Text Build 4200
```

On Windows 11 with WSLg, launch Sublime Text:

```bash
subl
```

#### Troubleshooting

**Problem**: `subl` shows "cannot open display" error

**Solution**: WSLg is required for GUI applications. Verify WSLg is working:

```bash
wsl --version
```

Ensure WSLg is listed. If not, update WSL:

```powershell
wsl --update
```

Then restart WSL:

```powershell
wsl --shutdown
```

**Problem**: GUI applications not working on Windows 10

**Solution**: Windows 10 requires an X server for WSL GUI apps. Install VcXsrv or similar:

1. Download and install VcXsrv from its official site
2. Launch XLaunch with default settings
3. In WSL, set the DISPLAY variable:

```bash
echo 'export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk "{print \$2}"):0' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Sublime Text looks blurry or has scaling issues

**Solution**: Set GDK scaling environment variables:

```bash
echo 'export GDK_SCALE=2' >> ~/.bashrc
echo 'export GDK_DPI_SCALE=0.5' >> ~/.bashrc
source ~/.bashrc
```

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Sublime Text installed on Windows (see Windows section)

**Note**: Git Bash on Windows does not require a separate Sublime Text installation. Git Bash inherits the Windows PATH, so once Sublime Text is installed on Windows, the `subl` command becomes available in Git Bash.

#### Installation Steps

1. Install Sublime Text on Windows using Chocolatey (see Windows section):

```bash
# Run from Administrator PowerShell or Command Prompt
choco install sublimetext4 -y
```

2. Open Git Bash - the `subl` command will be available if Sublime Text's installation directory is in your Windows PATH.

3. If `subl` is not available, add an alias to your Git Bash profile:

```bash
echo 'alias subl="/c/Program\ Files/Sublime\ Text/subl.exe"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

In Git Bash, confirm Sublime Text is accessible:

```bash
subl --version
```

Expected output (version numbers may vary):

```
Sublime Text Build 4200
```

Open a file in Sublime Text:

```bash
subl ~/.bashrc
```

#### Troubleshooting

**Problem**: `subl: command not found` in Git Bash

**Solution**: Sublime Text is not in PATH or the alias is not configured. Add an alias to your `~/.bashrc`:

```bash
echo 'alias subl="/c/Program\ Files/Sublime\ Text/subl.exe"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Path issues with spaces in directory names

**Solution**: When referencing Sublime Text's path in Git Bash, escape spaces properly:

```bash
"/c/Program Files/Sublime Text/subl.exe" myfile.txt
```

Or use the short 8.3 filename format:

```bash
/c/PROGRA~1/SUBLIM~1/subl.exe myfile.txt
```

**Problem**: Sublime Text opens but Git Bash terminal hangs

**Solution**: Use the `-b` (background) flag or the `&` operator:

```bash
subl myfile.txt &
```

Or create an alias that always runs in background:

```bash
echo 'subl() { "/c/Program Files/Sublime Text/subl.exe" "$@" & }' >> ~/.bashrc
source ~/.bashrc
```

---

## Post-Installation Configuration

After installing Sublime Text on any platform, consider these optional configurations.

### Installing Package Control

Package Control is the package manager for Sublime Text, enabling easy installation of plugins and themes.

1. Open Sublime Text
2. Open the Command Palette with `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
3. Type "Install Package Control" and press Enter

After installation, access packages via Command Palette > "Package Control: Install Package".

### Setting as Default Git Editor

Configure Git to use Sublime Text as the default editor:

**macOS/Linux:**

```bash
git config --global core.editor "subl -n -w"
```

**Windows (Command Prompt/PowerShell):**

```powershell
git config --global core.editor "'C:/Program Files/Sublime Text/subl.exe' -n -w"
```

**Git Bash:**

```bash
git config --global core.editor "'/c/Program Files/Sublime Text/subl.exe' -n -w"
```

The `-n` flag opens a new window and `-w` makes Git wait until the file is closed.

### Command Line Usage

The `subl` command supports various options:

```bash
# Open files
subl file1.txt file2.txt

# Open a folder as a project
subl /path/to/project

# Open and wait (useful for commit messages)
subl -w file.txt

# Open in a new window
subl -n file.txt

# Add folder to current window
subl -a /path/to/folder

# Go to specific line and column
subl file.txt:100:5
```

### License Activation

If you have purchased a license:

1. Open Sublime Text
2. Go to Help > Enter License
3. Paste your license key
4. Click Use License

---

## Common Issues

### Issue: "This is an unregistered copy" popup

**Explanation**: Sublime Text shows periodic reminders during the evaluation period. This does not limit functionality.

**Solution**: Purchase a license from sublimetext.com to remove the popup, or dismiss it to continue using the evaluation version.

### Issue: Syntax highlighting not working

**Symptoms**: Code appears as plain text without colors

**Solutions**:

1. Set the syntax manually: View > Syntax > (choose language)
2. Install additional syntax packages via Package Control
3. Check if the file extension is recognized: Preferences > Settings and verify `"ignored_packages"` does not include relevant packages

### Issue: Plugin/Package installation fails

**Symptoms**: Package Control shows errors when installing packages

**Solutions**:

1. Check internet connectivity
2. Restart Sublime Text
3. Remove Package Control cache:

**macOS/Linux:**
```bash
rm -rf ~/.config/sublime-text/Cache/*
```

**Windows:**
```powershell
Remove-Item -Recurse -Force "$env:APPDATA\Sublime Text\Cache\*"
```

### Issue: Sublime Text crashes on startup

**Solutions**:

1. Start in safe mode by holding Shift while launching (disables plugins)
2. Reset to default settings by removing the User folder:

**macOS:**
```bash
mv ~/Library/Application\ Support/Sublime\ Text/Packages/User ~/Library/Application\ Support/Sublime\ Text/Packages/User.backup
```

**Linux:**
```bash
mv ~/.config/sublime-text/Packages/User ~/.config/sublime-text/Packages/User.backup
```

**Windows:**
```powershell
Rename-Item "$env:APPDATA\Sublime Text\Packages\User" "$env:APPDATA\Sublime Text\Packages\User.backup"
```

### Issue: High CPU usage

**Symptoms**: Sublime Text consumes excessive CPU resources

**Solutions**:

1. Check for problematic plugins: start in safe mode (Shift on launch)
2. Disable indexing for large projects in settings:

```json
{
    "index_files": false
}
```

3. Exclude large folders from indexing:

```json
{
    "folder_exclude_patterns": [".git", "node_modules", "__pycache__"]
}
```

---

## References

- [Sublime Text Official Website](https://www.sublimetext.com/)
- [Sublime Text Download Page](https://www.sublimetext.com/download)
- [Sublime Text Linux Repositories](https://www.sublimetext.com/docs/linux_repositories.html)
- [Sublime Text Command Line Interface](https://www.sublimetext.com/docs/command_line.html)
- [Sublime Text Community Documentation](https://docs.sublimetext.io/)
- [Package Control - Sublime Text Package Manager](https://packagecontrol.io/)
- [Homebrew Cask: sublime-text](https://formulae.brew.sh/cask/sublime-text)
- [Chocolatey Package: sublimetext4](https://community.chocolatey.org/packages/sublimetext4)
- [winget Package: SublimeHQ.SublimeText.4](https://winget.run/pkg/SublimeHQ/SublimeText.4)
