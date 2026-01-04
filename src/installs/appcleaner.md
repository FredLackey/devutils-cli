# Installing AppCleaner

## Overview

AppCleaner is a small, free application that allows you to thoroughly uninstall unwanted applications by finding and removing all associated files, preferences, caches, and hidden data that standard uninstallation methods leave behind. When you install an application on macOS, it distributes files throughout your system, using disk space unnecessarily. AppCleaner finds all these files and safely deletes them.

**Important Platform Limitation:** AppCleaner by FreeMacSoft is a **macOS-only** application. There is no official version for Windows, Linux, or any other operating system. For other platforms, this documentation covers equivalent application uninstaller tools that provide similar functionality.

| Platform | Tool | Description |
|----------|------|-------------|
| macOS | AppCleaner | FreeMacSoft's free application uninstaller |
| Windows | Bulk Crap Uninstaller | Open-source bulk application uninstaller |
| Linux | apt purge / apt autoremove | Built-in package manager cleanup commands |

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `dev install homebrew` or from [brew.sh](https://brew.sh)
- **Optional:** None
- **Auto-installed:** None

### Ubuntu (APT/Snap)
- **Required:** None (installation not supported on this platform)
- **Optional:** None
- **Auto-installed:** None
- **Note:** AppCleaner is macOS-only. Ubuntu uses built-in APT commands (`apt purge`, `apt autoremove`) which are pre-installed with the operating system.

### Raspberry Pi OS (APT/Snap)
- **Required:** None (installation not supported on this platform)
- **Optional:** None
- **Auto-installed:** None
- **Note:** AppCleaner is macOS-only. Raspberry Pi OS uses built-in APT commands (`apt purge`, `apt autoremove`) which are pre-installed with the operating system.

### Amazon Linux (DNF/YUM)
- **Required:** None (installation not supported on this platform)
- **Optional:** None
- **Auto-installed:** None
- **Note:** AppCleaner is macOS-only. Amazon Linux uses built-in DNF/YUM commands (`dnf remove`, `dnf autoremove`) which are pre-installed with the operating system.

### Windows (Chocolatey/winget)
- **Required:**
  - At least one of the following package managers:
    - winget (Windows Package Manager) - Install via Microsoft Store (App Installer) or pre-installed on Windows 10 1809+
    - Chocolatey - Install via `dev install chocolatey` or from [chocolatey.org](https://chocolatey.org/install)
- **Optional:** None
- **Auto-installed:**
  - .NET 6 Desktop Runtime - Automatically installed by Bulk Crap Uninstaller's installer if not already present

### Git Bash (Manual/Portable)
- **Required:**
  - `curl` - Pre-installed with Git Bash (part of Git for Windows)
  - `unzip` - Pre-installed with Git Bash (part of Git for Windows)
- **Optional:**
  - PowerShell - For alternative installation via winget from Git Bash (pre-installed on Windows)
- **Auto-installed:** None
- **Note:** The portable version of Bulk Crap Uninstaller includes the .NET 6 runtime, making it fully self-contained.

## Prerequisites

Before installing, ensure you have:

1. **Administrator Access**: Required for installation on all platforms
2. **Package Manager**: The appropriate package manager for your platform must be installed:
   - macOS: Homebrew
   - Windows: Chocolatey or winget
   - Ubuntu/Debian: APT (pre-installed)
   - Amazon Linux: DNF or YUM (pre-installed)

---

## Platform-Specific Installation

### macOS (Homebrew)

AppCleaner is the native solution for macOS and is available as a Homebrew cask.

#### Prerequisites

- macOS 10.15 (Catalina) or later for version 3.6.8
- macOS 10.13 (High Sierra) users should use version 3.6
- Homebrew package manager installed
- 64-bit processor (Intel or Apple Silicon)

Verify Homebrew is installed:

```bash
brew --version
```

If Homebrew is not installed, install it first using `dev install homebrew`.

#### Installation Steps

Run the following command to install AppCleaner:

```bash
brew install --cask --quiet appcleaner
```

**Explanation of flags:**
- `--cask`: Indicates this is a macOS application (not a CLI formula)
- `--quiet`: Suppresses output for non-interactive installation

The installation downloads AppCleaner and installs it to `/Applications/AppCleaner.app`.

#### Verification

Confirm the installation succeeded:

```bash
ls -la "/Applications/AppCleaner.app" && echo "AppCleaner is installed"
```

You can also verify by checking the Homebrew list:

```bash
brew list --cask | grep appcleaner
```

#### Troubleshooting

**Installation fails with permission errors:**

```bash
# Reset Homebrew cask cache and retry
brew cleanup
brew install --cask --quiet appcleaner
```

**AppCleaner fails to open with "cannot be opened" error:**

This occurs when macOS Gatekeeper blocks the application:

```bash
xattr -cr /Applications/AppCleaner.app
```

**Need to downgrade for older macOS version:**

For macOS High Sierra (10.13):
```bash
# Download version 3.6 directly
curl -L -o ~/Downloads/AppCleaner3.6.zip "https://freemacsoft.net/downloads/AppCleaner_3.6.zip"
unzip -q ~/Downloads/AppCleaner3.6.zip -d /Applications/
rm ~/Downloads/AppCleaner3.6.zip
```

---

### Ubuntu/Debian (APT)

**AppCleaner is NOT available on Ubuntu or Debian.** It is a macOS-only application.

However, Ubuntu and Debian have built-in package management tools that handle complete application removal, including configuration files and dependencies.

#### Prerequisites

- Ubuntu 18.04 or later / Debian 10 or later
- sudo privileges

#### Installation Steps

No installation is required. The APT package manager includes built-in functionality for complete application removal.

**To completely remove an application and its configuration files:**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get purge -y <package-name>
```

**To remove unused dependencies left behind by removed applications:**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y
```

**To perform a complete cleanup (purge package and remove orphaned dependencies):**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get purge -y <package-name> && \
sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y --purge
```

**Explanation of flags:**
- `DEBIAN_FRONTEND=noninteractive`: Prevents any interactive prompts
- `purge`: Removes the package AND its configuration files (unlike `remove` which keeps configs)
- `-y`: Automatically answers "yes" to confirmation prompts
- `autoremove`: Removes packages that were installed as dependencies but are no longer needed
- `--purge`: When used with autoremove, also removes configuration files of orphaned packages

#### Verification

Verify the package removal tools are available:

```bash
apt-get --help | grep -E "(purge|autoremove)" && echo "APT removal tools available"
```

#### Troubleshooting

**Finding the correct package name:**

```bash
dpkg --list | grep -i <application-name>
```

**Listing all manually installed packages:**

```bash
apt-mark showmanual
```

**Removing Snap packages completely:**

Snap packages are removed differently:

```bash
sudo snap remove <package-name>
```

---

### Raspberry Pi OS (APT)

**AppCleaner is NOT available on Raspberry Pi OS.** The same APT-based cleanup approach used for Ubuntu/Debian applies here.

#### Prerequisites

- Raspberry Pi OS (Bullseye or later recommended)
- sudo privileges

#### Installation Steps

No installation is required. Use the built-in APT commands for complete application removal.

**To completely remove an application and its configuration files:**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get purge -y <package-name>
```

**To remove unused dependencies:**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y --purge
```

**To clean up downloaded package files and free disk space:**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get clean
```

#### ARM-Specific Considerations

Raspberry Pi uses ARM architecture. This does not affect the APT removal commands, which work identically across architectures.

#### Verification

Confirm APT tools are working:

```bash
apt-get --version && echo "APT is available"
```

#### Troubleshooting

**Disk space issues on Raspberry Pi:**

Clean all cached package files to free space:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get clean && \
sudo DEBIAN_FRONTEND=noninteractive apt-get autoclean
```

**Broken packages preventing removal:**

```bash
sudo dpkg --configure -a
sudo DEBIAN_FRONTEND=noninteractive apt-get install -f -y
```

---

### Amazon Linux/RHEL (YUM/DNF)

**AppCleaner is NOT available on Amazon Linux or RHEL.** Use the built-in package manager commands for complete application removal.

#### Prerequisites

- Amazon Linux 2, Amazon Linux 2023, RHEL 7/8/9, or compatible
- sudo privileges

#### Installation Steps

No installation is required. Use DNF (modern) or YUM (legacy) for complete package removal.

**For Amazon Linux 2023 / RHEL 8+ (DNF):**

```bash
# Remove a package completely (including dependencies if safe)
sudo dnf remove -y <package-name>

# Remove orphaned dependencies
sudo dnf autoremove -y
```

**For Amazon Linux 2 / RHEL 7 (YUM):**

```bash
# Remove a package
sudo yum remove -y <package-name>

# Remove orphaned dependencies
sudo yum autoremove -y
```

**Explanation of flags:**
- `-y`: Automatically answers "yes" to all prompts

#### Verification

Confirm the package manager is available:

```bash
# For DNF-based systems
dnf --version && echo "DNF is available"

# For YUM-based systems
yum --version && echo "YUM is available"
```

#### Troubleshooting

**Finding installed packages:**

```bash
# DNF
dnf list installed | grep -i <application-name>

# YUM
yum list installed | grep -i <application-name>
```

**Cleaning package cache:**

```bash
# DNF
sudo dnf clean all

# YUM
sudo yum clean all
```

---

### Windows (Chocolatey/winget)

**AppCleaner is NOT available on Windows.** Use **Bulk Crap Uninstaller (BCUninstaller)** as the equivalent tool. BCUninstaller is a free, open-source bulk application uninstaller that excels at removing large numbers of applications with minimal user input.

#### Prerequisites

- Windows 10 version 1903 or later (Windows 7 SP1 with Platform Updates minimum)
- winget (Windows Package Manager) or Chocolatey installed
- Administrator privileges
- .NET 6 Desktop Runtime (installed automatically if missing)

Verify winget is available:

```powershell
winget --version
```

Or verify Chocolatey:

```powershell
choco --version
```

#### Installation Steps

**Option A: Install using winget (Recommended):**

Open PowerShell or Command Prompt as Administrator and run:

```powershell
winget install --id Klocman.BulkCrapUninstaller --silent --accept-package-agreements --accept-source-agreements
```

**Explanation of flags:**
- `--id Klocman.BulkCrapUninstaller`: Specifies the exact package identifier
- `--silent`: Suppresses the installer UI completely
- `--accept-package-agreements`: Automatically accepts the package license
- `--accept-source-agreements`: Automatically accepts the source terms

**Option B: Install using Chocolatey:**

```powershell
choco install bulk-crap-uninstaller -y
```

**Explanation of flags:**
- `-y`: Automatically confirms all prompts

#### Verification

Confirm Bulk Crap Uninstaller is installed:

```powershell
# Check via winget
winget list --id Klocman.BulkCrapUninstaller

# Or check if the executable exists
if (Test-Path "$env:ProgramFiles\BCUninstaller\BCUninstaller.exe") {
    Write-Host "Bulk Crap Uninstaller is installed"
} else {
    Write-Host "Bulk Crap Uninstaller is NOT installed"
}
```

#### Troubleshooting

**winget installation fails:**

Reset winget sources and retry:

```powershell
winget source reset --force
winget install --id Klocman.BulkCrapUninstaller --silent --accept-package-agreements --accept-source-agreements
```

**Chocolatey installation fails:**

Clear the Chocolatey cache:

```powershell
choco cache remove
choco install bulk-crap-uninstaller -y --force
```

**.NET 6 Runtime missing:**

The installer should automatically install .NET 6 if missing. If it fails:

```powershell
winget install --id Microsoft.DotNet.DesktopRuntime.6 --silent --accept-package-agreements --accept-source-agreements
```

---

### WSL (Ubuntu)

**AppCleaner cannot run in WSL.** WSL runs a Linux environment where AppCleaner (a macOS application) is not compatible.

#### Recommended Approach

Use the standard APT commands within WSL for managing Linux packages, and install Bulk Crap Uninstaller on the Windows host for managing Windows applications.

#### Prerequisites

- WSL 2 with Ubuntu installed
- sudo privileges within WSL

#### Installation Steps

**For Linux packages within WSL, use APT:**

```bash
# Completely remove a package and its configuration
sudo DEBIAN_FRONTEND=noninteractive apt-get purge -y <package-name>

# Remove orphaned dependencies
sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y --purge
```

**To install Bulk Crap Uninstaller on the Windows host from within WSL:**

```bash
powershell.exe -Command "winget install --id Klocman.BulkCrapUninstaller --silent --accept-package-agreements --accept-source-agreements"
```

#### Verification

Verify APT is available in WSL:

```bash
apt-get --version && echo "APT is available in WSL"
```

Check if Bulk Crap Uninstaller is installed on Windows host:

```bash
powershell.exe -Command "Test-Path 'C:\Program Files\BCUninstaller\BCUninstaller.exe'"
```

#### Troubleshooting

**PowerShell command fails from WSL:**

Use the full path to PowerShell:

```bash
/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -Command "winget install --id Klocman.BulkCrapUninstaller --silent --accept-package-agreements --accept-source-agreements"
```

---

### Git Bash (Manual/Portable)

Git Bash runs within Windows, so use the portable version of Bulk Crap Uninstaller for a self-contained solution that does not require installation.

#### Prerequisites

- Windows 10 or later
- Git Bash installed
- curl available in Git Bash (included by default)
- Sufficient disk space (approximately 200 MB for the portable version)

#### Installation Steps

Download and extract the portable version of Bulk Crap Uninstaller:

```bash
# Create installation directory
mkdir -p "$HOME/Apps/BCUninstaller"

# Download the portable version
curl -L -o "$HOME/Apps/BCUninstaller/BCUninstaller_portable.zip" \
  "https://github.com/Klocman/Bulk-Crap-Uninstaller/releases/download/v5.9/BCUninstaller_5.9.0_portable.zip"

# Extract the archive
unzip -q "$HOME/Apps/BCUninstaller/BCUninstaller_portable.zip" -d "$HOME/Apps/BCUninstaller/"

# Remove the zip file to save space
rm "$HOME/Apps/BCUninstaller/BCUninstaller_portable.zip"

# Create a convenience alias (optional)
echo 'alias bcuninstaller="$HOME/Apps/BCUninstaller/BCUninstaller.exe"' >> ~/.bashrc
source ~/.bashrc
```

**Note:** The portable version includes the .NET 6 runtime, making it self-contained but larger in size (approximately 200 MB).

#### Alternative: Install via PowerShell from Git Bash

If you prefer the installed version:

```bash
powershell.exe -Command "winget install --id Klocman.BulkCrapUninstaller --silent --accept-package-agreements --accept-source-agreements"
```

#### Verification

Verify the portable installation:

```bash
if [[ -f "$HOME/Apps/BCUninstaller/BCUninstaller.exe" ]]; then
  echo "Bulk Crap Uninstaller (portable) is installed"
else
  echo "Bulk Crap Uninstaller is NOT installed"
fi
```

Launch the application to verify it works:

```bash
"$HOME/Apps/BCUninstaller/BCUninstaller.exe" &
```

#### Troubleshooting

**curl download fails:**

Use wget as an alternative:

```bash
wget -O "$HOME/Apps/BCUninstaller/BCUninstaller_portable.zip" \
  "https://github.com/Klocman/Bulk-Crap-Uninstaller/releases/download/v5.9/BCUninstaller_5.9.0_portable.zip"
```

**unzip not found:**

Extract using PowerShell:

```bash
powershell.exe -Command "Expand-Archive -Path '$HOME/Apps/BCUninstaller/BCUninstaller_portable.zip' -DestinationPath '$HOME/Apps/BCUninstaller/' -Force"
```

**Permission denied when running:**

Ensure the executable has proper permissions. In Git Bash, Windows executables should run without additional permissions, but if issues occur:

```bash
chmod +x "$HOME/Apps/BCUninstaller/BCUninstaller.exe"
```

---

## Post-Installation Configuration

### macOS (AppCleaner)

After installing AppCleaner on macOS:

1. **Enable SmartDelete (Optional)**: Open AppCleaner > Preferences > SmartDelete. This automatically prompts you to remove associated files when you drag an app to the Trash.

2. **Configure Protected Apps**: In Preferences, you can specify applications that should never be suggested for removal.

3. **Review Launch at Login**: Disable "Launch at Login" in Preferences if you prefer to run AppCleaner only when needed.

### Windows (Bulk Crap Uninstaller)

After installing Bulk Crap Uninstaller on Windows:

1. **First Launch**: The application may run a setup wizard on first launch. Accept the default settings for standard operation.

2. **Enable Quiet Uninstall**: In Settings > Uninstall > Quiet uninstall, enable automatic quiet uninstallation for supported applications.

3. **Configure Leftover Removal**: In Settings > Uninstall, enable "Automatically search for leftovers" to clean up residual files after uninstallation.

---

## Common Issues

### Cross-Platform Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Package manager not found | Package manager not installed | Install the appropriate package manager for your platform first |
| Permission denied | Insufficient privileges | Run commands with sudo (Linux/macOS) or as Administrator (Windows) |
| Download fails | Network connectivity issues | Check internet connection; try alternative download sources |

### macOS-Specific Issues

| Issue | Solution |
|-------|----------|
| "AppCleaner is damaged" error | Run `xattr -cr /Applications/AppCleaner.app` |
| Homebrew cask outdated | Run `brew update && brew upgrade --cask appcleaner` |
| AppCleaner not finding all files | Ensure you have granted Full Disk Access in System Preferences > Privacy & Security |

### Windows-Specific Issues

| Issue | Solution |
|-------|----------|
| winget not found | Install from Microsoft Store (App Installer) or upgrade Windows |
| .NET Runtime errors | Install .NET 6 Desktop Runtime manually |
| Portable version fails to start | Ensure Windows Defender is not blocking the executable; add an exception if needed |

### Linux-Specific Issues

| Issue | Solution |
|-------|----------|
| apt-get purge leaves files behind | Some applications store data in user home directories; manually remove `~/.config/<app-name>` and `~/.local/share/<app-name>` |
| Package dependencies still installed | Run `apt-get autoremove -y --purge` after purging the main package |

---

## Usage Examples

### macOS: Using AppCleaner

1. **Drag and Drop Method**: Open AppCleaner, then drag an application from Finder into the AppCleaner window. It will scan for all associated files.

2. **Application List Method**: Click the application icon in AppCleaner's toolbar to see a list of all installed applications. Select one to see its associated files.

3. **SmartDelete Method**: With SmartDelete enabled, simply drag an application to the Trash. AppCleaner will automatically detect this and offer to remove associated files.

### Windows: Using Bulk Crap Uninstaller

1. **GUI Method**: Launch BCUninstaller. The application automatically scans for installed programs. Select one or more programs and click "Uninstall".

2. **Quiet Uninstall**: Select applications and choose "Quiet Uninstall" to remove them without installer prompts.

3. **Leftover Cleanup**: After uninstallation, BCUninstaller can scan for and remove leftover files and registry entries.

---

## References

### macOS (AppCleaner)

- [AppCleaner Official Website (FreeMacSoft)](https://freemacsoft.net/appcleaner/)
- [AppCleaner Homebrew Cask](https://formulae.brew.sh/cask/appcleaner)

### Windows (Bulk Crap Uninstaller)

- [Bulk Crap Uninstaller Official Website](https://www.bcuninstaller.com/)
- [Bulk Crap Uninstaller GitHub Repository](https://github.com/Klocman/Bulk-Crap-Uninstaller)
- [Bulk Crap Uninstaller Chocolatey Package](https://community.chocolatey.org/packages/bulk-crap-uninstaller)
- [Bulk Crap Uninstaller winget Package](https://winget.run/pkg/Klocman/BulkCrapUninstaller)
- [Bulk Crap Uninstaller SourceForge Downloads](https://sourceforge.net/projects/bulk-crap-uninstaller/)

### Linux

- [Ubuntu APT Documentation](https://help.ubuntu.com/community/AptGet/Howto)
- [Debian Package Management](https://www.debian.org/doc/manuals/debian-reference/ch02.en.html)
- [DNF Command Reference](https://dnf.readthedocs.io/en/latest/command_ref.html)
