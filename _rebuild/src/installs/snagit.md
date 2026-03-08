# Installing Snagit

## Overview

Snagit is a professional screen capture and screen recording software developed by TechSmith Corporation. It enables users to capture screenshots of their entire desktop, specific regions, windows, or scrolling content such as web pages and documents. Snagit includes a powerful built-in editor that allows you to add annotations, arrows, text callouts, highlights, and shapes to captured images. The software also supports quick video recording for creating tutorials and demonstrations. Snagit is widely used by technical writers, educators, IT professionals, customer support teams, and anyone who needs to create visual documentation efficiently.

**Important Platform Limitation:** Snagit is officially supported only on **macOS** and **Windows**. TechSmith does not provide Linux versions, which affects Ubuntu, Raspberry Pi OS, Amazon Linux, WSL, and other Linux distributions.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `Homebrew` - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:**
  - `Xcode Command Line Tools` - Automatically installed by Homebrew during first use if not present

### Ubuntu (APT/Snap)
- **Installation not supported:** TechSmith does not provide Linux versions of Snagit. See the "Alternative: Flameshot" section below for Linux-compatible screen capture tools.

### Raspberry Pi OS (APT/Snap)
- **Installation not supported:** Snagit is not available for ARM architecture and TechSmith does not support Linux. See the "Alternative: Flameshot" section below for compatible tools.

### Amazon Linux (DNF/YUM)
- **Installation not supported:** TechSmith does not provide Linux versions of Snagit. See the "Alternative: Flameshot" section below for Linux-compatible screen capture tools.

### Windows (Chocolatey/winget)
- **Required:**
  - `winget` (Windows Package Manager) - Pre-installed on Windows 11; for Windows 10, install "App Installer" from Microsoft Store or run `dev install winget`
  - `.NET Framework 4.7.2 or later` - Download from [Microsoft .NET Framework 4.7.2](https://dotnet.microsoft.com/download/dotnet-framework/net472) or install via `choco install dotnetfx -y`
- **Optional:**
  - `WebView2 Runtime` - Usually bundled with Snagit installer; if needed, install via `choco install webview2-runtime -y`
  - `Media Foundation Pack` - Required for Windows N editions; download from Microsoft Store
- **Auto-installed:** None

### Git Bash (Manual/Portable)
- **Required:**
  - `PowerShell` - Pre-installed on all modern Windows versions; verify with `powershell.exe -Command "Get-Host"`
  - `winget` on Windows host - Pre-installed on Windows 11; for Windows 10, install "App Installer" from Microsoft Store
- **Optional:** None
- **Auto-installed:** None

## Prerequisites

Before installing Snagit on any platform, ensure you have:

1. **TechSmith Account**: Required for activation and license management. Create one at [techsmith.com](https://www.techsmith.com) if you do not have one.
2. **License or Trial**: Snagit requires a paid license for full functionality. A free 15-day trial is available.
3. **Internet Connection**: Required for initial download, activation, and updates.
4. **Administrative Privileges**: Required for system-wide installation on most platforms.

---

## Platform-Specific Installation

### macOS (Homebrew)

Snagit is available as a Homebrew cask and can be installed non-interactively.

#### Prerequisites

- macOS 15.0 (Sequoia) or later for Snagit 2026
- macOS 14.0 (Sonoma) or later for Snagit 2025/2024
- Apple Silicon (M1, M2, M3, M4) or Intel processor
- Minimum 8 GB RAM recommended
- 1.6 GB available disk space
- Homebrew package manager installed

Verify Homebrew is installed:

```bash
brew --version
```

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Snagit:

```bash
brew install --cask --quiet snagit
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts. The `--cask` flag is required because Snagit is a macOS application (not a command-line formula).

**Note:** This command may prompt for your administrator password because Snagit requires elevated privileges to install system components. In fully automated scenarios (such as CI/CD pipelines), ensure the running user has passwordless sudo configured or pre-authorize the installer.

#### Verification

Confirm the installation succeeded:

```bash
ls /Applications/Snagit*.app && echo "Snagit installed successfully"
```

Launch Snagit to verify it runs:

```bash
open -a "Snagit 2026"
```

Check the installed version via Homebrew:

```bash
brew info --cask snagit | head -1
```

#### Post-Installation: macOS Permissions

Snagit requires several macOS permissions to function properly. After first launch, macOS will prompt for permissions. Grant the following:

1. **Screen Recording**: System Settings > Privacy & Security > Screen Recording > Enable Snagit
2. **Accessibility**: System Settings > Privacy & Security > Accessibility > Enable Snagit and SnagitHelper
3. **Microphone** (for video recording): System Settings > Privacy & Security > Microphone > Enable Snagit
4. **Camera** (for webcam capture): System Settings > Privacy & Security > Camera > Enable Snagit

**macOS Sequoia (macOS 15) Note:** You will see a prompt asking to "Allow For One Month" for screen recording. Select this option to continue capturing with Snagit. This is a macOS platform requirement and will reappear periodically.

#### Troubleshooting

**Problem**: `snagit: cask not found`

**Solution**: Update Homebrew cask definitions:

```bash
brew update
```

**Problem**: Installation fails with permission errors

**Solution**: Reset Homebrew cask cache and retry:

```bash
brew cleanup
brew install --cask --quiet snagit
```

**Problem**: Screen capture returns black images

**Solution**: Ensure Screen Recording permission is enabled:

1. Open System Settings > Privacy & Security > Screen Recording
2. Ensure Snagit is checked
3. If grayed out, click the lock icon and enter your password
4. Restart Snagit after enabling permissions

**Problem**: Application crashes on launch

**Solution**: Remove preferences and retry:

```bash
rm -rf ~/Library/Preferences/com.TechSmith.Snagit*
rm -rf ~/Library/Application\ Support/TechSmith/Snagit*
```

**Problem**: Older macOS version not supported

**Solution**: Check the TechSmith support page for compatible Snagit versions:
- macOS 15 Sequoia: Snagit 2023.3.2, 2024.3.2, or 2025.3.1 and newer
- macOS 14 Sonoma: Snagit 2023.2.2 and newer
- macOS 13 Ventura: Snagit 2022.2.4 and newer

---

### Ubuntu/Debian (APT)

**Snagit is NOT officially supported on Ubuntu or Debian.** TechSmith explicitly states: "Currently, neither Snagit nor Camtasia are supported on Linux. They are only available for Windows and Mac platforms."

#### Why It Cannot Work

- TechSmith does not release Linux binaries
- There is no APT, Snap, or Flatpak package available
- Wine compatibility is poor for modern Snagit versions
- The application relies on Windows/macOS-specific screen capture APIs

#### Alternative: Flameshot

Flameshot is the most popular open-source screen capture tool for Linux and provides functionality similar to Snagit:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y flameshot
```

Flameshot features include:
- Customizable area selection
- Annotations (arrows, text, shapes, highlighting)
- Direct upload to Imgur
- Command-line interface for scripting
- Clipboard and file saving options

**Additional Alternatives:**

**Shutter** (Screenshot with built-in editor):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y shutter
```

**Ksnip** (Cross-platform screenshot tool):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ksnip
```

**GNOME Screenshot** (Simple screenshot tool, pre-installed on many systems):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnome-screenshot
```

#### Verification

Verify Flameshot is installed:

```bash
flameshot --version
```

#### Troubleshooting

**Problem**: User attempts to run Windows Snagit installer via Wine

**Solution**: This approach is not recommended. Wine compatibility with modern Snagit is poor due to:
- Complex screen capture API requirements
- Windows-specific COM object dependencies
- Hardware acceleration requirements

Use the native Linux alternatives listed above instead.

---

### Raspberry Pi OS (APT)

**Snagit is NOT supported on Raspberry Pi OS.** This is due to two fundamental incompatibilities:

1. **Architecture**: Snagit is compiled for x86/x86_64 processors. Raspberry Pi uses ARM processors, and TechSmith does not release ARM-compiled versions.
2. **Operating System**: TechSmith only supports macOS and Windows. There is no Linux support of any kind.

#### Why It Cannot Work

- TechSmith's software is closed-source and cannot be recompiled for ARM
- x86 emulation on ARM is too slow for practical use of screen capture applications
- Even Wine cannot bridge this gap because it requires x86 binaries
- Snagit relies on platform-specific screen capture APIs

#### Alternative: Flameshot

For screen capture on Raspberry Pi, install Flameshot:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y flameshot
```

**Additional Alternatives:**

**Scrot** (Lightweight command-line screenshot tool):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y scrot
```

**GNOME Screenshot**:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnome-screenshot
```

**Note**: Screenshot tool performance on Raspberry Pi is generally good due to the lightweight nature of screen capture operations, unlike video editing which is resource-intensive.

#### Verification

Verify your architecture to confirm ARM:

```bash
uname -m
```

If this outputs `armv7l` or `aarch64`, your system is ARM-based and Snagit is not available.

Verify Flameshot is installed:

```bash
flameshot --version
```

---

### Amazon Linux/RHEL (DNF/YUM)

**Snagit is NOT officially supported on Amazon Linux or RHEL.** TechSmith does not provide packages for any Linux distribution.

#### Why It Cannot Work

- TechSmith explicitly does not support Linux
- No RPM packages are available from TechSmith
- Wine compatibility is unreliable for modern Snagit versions
- Amazon Linux servers are typically headless and lack the GUI requirements

#### Alternative: Flameshot

For screen capture on Amazon Linux/RHEL, install Flameshot:

**For Amazon Linux 2023, RHEL 8/9, Fedora:**

```bash
sudo dnf install -y flameshot
```

**For Amazon Linux 2, RHEL 7, CentOS 7:**

```bash
# Enable EPEL repository first
sudo yum install -y epel-release

# Install Flameshot
sudo yum install -y flameshot
```

**Additional Alternatives:**

**Spectacle** (KDE screenshot tool):

```bash
sudo dnf install -y spectacle
```

**GNOME Screenshot**:

```bash
sudo dnf install -y gnome-screenshot
```

**Note**: Amazon Linux EC2 instances typically run headless (no GUI). Screen capture tools require a graphical environment. For server use cases, consider using a desktop Linux distribution with a GUI or capture screenshots on a workstation.

#### Verification

Verify Flameshot is installed:

```bash
flameshot --version
```

---

### Windows (Chocolatey)

Snagit is fully supported on Windows and can be installed using Chocolatey with silent installation flags.

#### Prerequisites

- Windows 11 (64-bit)
- Windows 11 on ARM (23H2 or higher)
- Windows 10 (64-bit) version 20H2 or later
- Windows Server 2016 or Windows Server 2019
- Intel i5 6th Gen / AMD equivalent CPU (Intel 8th Gen or AMD Ryzen 2000 for video recording)
- Minimum 8 GB RAM recommended
- 1.6 GB available disk space
- .NET Framework 4.7.2 or later
- Chocolatey package manager installed

**Note**: Windows N editions require the Media Foundation Pack. Snagit Printer is not available on Windows on ARM.

Verify Chocolatey is installed:

```powershell
choco --version
```

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install snagit -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation. The package uses MSI with `/quiet /passive /norestart` arguments for silent deployment.

#### Installation with License Key

To install with a license key for automated deployments:

```powershell
choco install snagit -y --params='"/licensekey=XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"'
```

Available parameters:
- `/licensekey=XXXXX-XXXXX-XXXXX-XXXXX-XXXXX` - Registers the license key during installation
- `/DisableAutoStart` - Prevents Snagit from starting when Windows starts
- `/DisableStartNow` - Skips launching Snagit after installation
- `/Language='ENU'|'DEU'|'ESP'|'FRA'|'JPN'|'PTB'` - Sets the application language
- `/HideRegistrationKey` - Hides the registration key in the Help menu

Example with multiple parameters:

```powershell
choco install snagit -y --params='"/licensekey=XXXXX-XXXXX-XXXXX-XXXXX-XXXXX /DisableAutoStart /DisableStartNow"'
```

If no license key is provided, Snagit installs as a trial.

#### Alternative: winget Installation

```powershell
winget install --id TechSmith.Snagit.2025 --silent --accept-package-agreements --accept-source-agreements
```

**Note**: The winget package may not support license key parameters during installation. Use Chocolatey for enterprise deployments requiring license keys.

#### Verification

Open a new Command Prompt or PowerShell window (required for PATH to update), then verify the installation:

```powershell
# Check if Snagit is installed
if (Test-Path "$env:ProgramFiles\TechSmith\Snagit*\Snagit*.exe") {
    Write-Host "Snagit is installed"
} else {
    Write-Host "Snagit is NOT installed"
}
```

Verify via Chocolatey:

```powershell
choco list snagit
```

Or verify via winget:

```powershell
winget list --id TechSmith.Snagit
```

#### Troubleshooting

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: Chocolatey command not found

**Solution**: Chocolatey may not be in PATH. Close all terminal windows, open a new Administrator PowerShell, and try again.

**Problem**: Silent installation still shows some UI

**Solution**: This is expected for the Snagit installer. The MSI runs silently but may briefly show a progress indicator. The installation does not require user interaction.

**Problem**: Installation fails due to checksum mismatch

**Solution**: TechSmith occasionally releases updates with the same version number. Use the ignore checksums flag:

```powershell
choco install snagit -y --ignore-checksums
```

**Problem**: Old version remains after upgrade

**Solution**: Uninstall the old version first:

```powershell
choco uninstall snagit -y --all-versions
choco install snagit -y
```

**Problem**: WebView2 Runtime missing

**Solution**: The Snagit installer includes WebView2 Runtime. If issues persist:

```powershell
choco install webview2-runtime -y
choco install snagit -y
```

---

### WSL (Ubuntu)

**Snagit cannot run inside WSL (Windows Subsystem for Linux).** WSL runs a Linux environment, and TechSmith does not support Linux.

#### Recommended Approach

Install Snagit on the Windows host instead. WSL applications can still interact with files that Snagit modifies.

From within WSL, you can trigger the Windows installation using PowerShell interoperability:

```bash
# Install Snagit on Windows host from WSL
powershell.exe -Command "choco install snagit -y"
```

Or using winget:

```bash
powershell.exe -Command "winget install --id TechSmith.Snagit.2025 --silent --accept-package-agreements --accept-source-agreements"
```

#### Accessing Snagit Files from WSL

After installing Snagit on Windows, access Windows files from WSL:

```bash
# Access Documents folder where Snagit captures are typically saved
ls /mnt/c/Users/<your-username>/Documents/Snagit/
```

#### Verification

Check if Snagit is installed on the Windows host:

```bash
powershell.exe -Command "Test-Path 'C:\Program Files\TechSmith\Snagit*'"
```

#### Alternative: Linux Screen Capture Tools

For screen capture within WSL itself, install Linux alternatives:

```bash
# Flameshot
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y flameshot

# Ksnip
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ksnip
```

**Note**: Running GUI applications in WSL requires WSLg (Windows 11) or an X server (Windows 10).

---

### Git Bash (Manual/Portable)

Git Bash runs within Windows, so Snagit should be installed on the Windows host using Chocolatey or winget.

#### Prerequisites

- Windows 10 version 20H2 or later (64-bit)
- Git Bash installed (comes with Git for Windows)
- Administrator privileges in the Windows environment

#### Installation Steps

From Git Bash, invoke PowerShell to run the Chocolatey installation:

```bash
# Install using Chocolatey via PowerShell (preferred)
powershell.exe -Command "choco install snagit -y"
```

Or using winget:

```bash
# Install using winget via PowerShell
powershell.exe -Command "winget install --id TechSmith.Snagit.2025 --silent --accept-package-agreements --accept-source-agreements"
```

#### Alternative: Direct Download Installation

Download and install Snagit directly using the silent installer:

```bash
# Download the installer
curl -L -o /tmp/snagit.exe "https://download.techsmith.com/snagit/releases/snagit.exe"

# Run silent installation via PowerShell
powershell.exe -Command "Start-Process -FilePath '/tmp/snagit.exe' -ArgumentList '/install /quiet /norestart' -Wait"

# Cleanup
rm -f /tmp/snagit.exe
```

The installer switches ensure completely silent installation:
- `/install` - Perform installation
- `/quiet` - No UI shown during installation
- `/norestart` - Do not restart computer after installation

#### Installation with License Key

For automated deployments with a license key, use the MSI installer:

```bash
# Download the MSI installer
curl -L -o /tmp/snagit.msi "https://download.techsmith.com/snagit/releases/snagit.msi"

# Run silent MSI installation via PowerShell
powershell.exe -Command "msiexec /i '/tmp/snagit.msi' TSC_SOFTWARE_KEY=XXXXX-XXXXX-XXXXX-XXXXX-XXXXX /qn /norestart"

# Cleanup
rm -f /tmp/snagit.msi
```

#### Verification

Verify Snagit is accessible from Git Bash:

```bash
# Check if Snagit is installed
if [[ -d "/c/Program Files/TechSmith/Snagit 2025" ]] || [[ -d "/c/Program Files/TechSmith/Snagit 2026" ]]; then
    echo "Snagit is installed"
else
    echo "Snagit is NOT installed"
fi
```

List installed TechSmith applications:

```bash
ls "/c/Program Files/TechSmith/"
```

#### Troubleshooting

**Problem**: PowerShell execution fails from Git Bash

**Solution**: Ensure PowerShell is in your PATH and try using the full path:

```bash
/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -Command "choco install snagit -y"
```

**Problem**: Permission denied errors

**Solution**: Run Git Bash as Administrator (right-click Git Bash and select "Run as administrator").

**Problem**: Silent installer exits but Snagit is not installed

**Solution**: The silent installer requires Administrator privileges. Open Git Bash as Administrator.

**Problem**: Download URL fails

**Solution**: TechSmith may update their download URL. Visit [techsmith.com/download/snagit](https://www.techsmith.com/download/snagit/) to get the current download link.

---

## Post-Installation Configuration

After installing Snagit on supported platforms (macOS and Windows), complete these steps:

### 1. Activate Your License

Launch Snagit and either:
- Sign in with your TechSmith account (if you have a subscription or registered license)
- Enter your license key manually via **Help > Enter Software Key**
- Continue with the trial

### 2. Configure Capture Settings

Before your first capture session:

1. Open Snagit
2. Configure capture presets (region, window, scrolling, full screen)
3. Set up hotkeys for quick capture
4. Configure output destination (Editor, Clipboard, File, or direct to application)

### 3. Set Default Editor Options

Configure default editor settings:

1. Go to **Edit > Editor Preferences** (Windows) or **Snagit > Preferences** (macOS)
2. Set default image format (PNG recommended for quality)
3. Configure auto-save options
4. Set default annotation styles (arrow colors, text fonts, etc.)

### 4. Configure Video Recording (Optional)

If using Snagit for video recording:

1. Go to video capture mode
2. Select audio sources (system audio, microphone)
3. Configure webcam settings if needed
4. Set recording quality and frame rate

---

## Common Issues

### Cross-Platform Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| License activation fails | Network or firewall blocking | Ensure access to `*.techsmith.com` domains |
| Trial expired notification | Trial period ended | Enter a valid license key or purchase a license |
| Capture hotkey conflicts | Another application using the same hotkey | Change Snagit's hotkey in preferences |
| Scrolling capture fails | Complex web page or application | Try manual scrolling capture or full-page screenshot |
| Image quality poor | Compression settings too aggressive | Use PNG format for lossless captures |

### macOS-Specific Issues

| Issue | Solution |
|-------|----------|
| Screen recording permission denied | Grant Screen Recording permission in System Settings > Privacy & Security |
| Microphone not detected | Grant Microphone permission in System Settings > Privacy & Security |
| Accessibility features not working | Enable Snagit and SnagitHelper in Accessibility permissions |
| Cask installation fails | Run `brew update && brew cleanup` then retry |
| App damaged or cannot be opened | Run `xattr -cr /Applications/Snagit*.app` |
| Monthly permission prompt (Sequoia) | Select "Allow For One Month" - this is an Apple platform requirement |

### Windows-Specific Issues

| Issue | Solution |
|-------|----------|
| Capture shows black screen | Disable hardware acceleration in Snagit preferences |
| Windows Defender blocks installation | Add exclusion for TechSmith folder or temporarily disable real-time protection |
| Silent install shows progress window | This is expected; no user interaction is required |
| Snagit Printer not available on ARM | This feature is not supported on Windows on ARM devices |
| Crashes on startup | Update graphics drivers and ensure .NET 4.7.2 is installed |

---

## Uninstallation

### macOS

```bash
brew uninstall --cask snagit
```

To remove user data and preferences:

```bash
rm -rf ~/Library/Preferences/com.TechSmith.Snagit*
rm -rf ~/Library/Application\ Support/TechSmith/Snagit*
rm -rf ~/Library/Caches/com.TechSmith.Snagit*
```

### Windows (Chocolatey)

```powershell
choco uninstall snagit -y
```

### Windows (winget)

```powershell
winget uninstall --id TechSmith.Snagit --silent
```

### Windows (Silent MSI Uninstall)

For direct MSI uninstallation:

```powershell
# Find and uninstall Snagit
$app = Get-WmiObject -Class Win32_Product | Where-Object { $_.Name -like "*Snagit*" }
if ($app) {
    $app.Uninstall()
}
```

Or using msiexec with the product GUID:

```powershell
msiexec.exe /x {PRODUCT-GUID} /qn /norestart
```

---

## Enterprise Deployment

For enterprise environments requiring fully automated, silent deployments:

### TechSmith Deployment Tool

TechSmith provides a dedicated deployment tool for enterprise installations:

1. Download from: `https://download.techsmith.com/tscdeploymenttool/TechSmith_Deployment_Tool.exe`
2. Run the tool to create customized MST transform files
3. Deploy via SCCM, Intune, or other enterprise deployment tools

### MSI Silent Installation

For MSI-based deployment:

```powershell
msiexec.exe /i "snagit.msi" /qn /norestart TSC_SOFTWARE_KEY="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" REBOOT=ReallySuppress
```

MSI Properties:
- `TSC_SOFTWARE_KEY` - License key
- `TSC_EVALEMAIL` - Show the Tips and Tricks email signup window (0 to disable)
- `TSC_EMAIL_SIGNUP` - Sign up for Snagit Tips and Tricks (0 to disable)
- `TSC_START_AUTO` - Run Snagit when Windows starts (0 to disable)
- `START_NOW` - Run Snagit when the installation finishes (0 to disable)
- `TSC_DESKTOP_LINK` - Create a shortcut to Snagit on the desktop (0 to disable)
- `TSC_DATA_STORE` - During uninstall: 1 to remove user library, 0 to keep it

Example with multiple properties:

```powershell
msiexec.exe /i "\\server\install\snagit.msi" TRANSFORMS="\\server\install\snagit.mst" /qn /norestart TSC_SOFTWARE_KEY="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" TSC_START_AUTO=0 START_NOW=0
```

### GPO Deployment

For Group Policy deployment, create an MST transform file using the TechSmith Deployment Tool and deploy via Software Installation policy.

### macOS Enterprise Deployment (MDM)

For MDM deployments on macOS, create a PPPC (Privacy Preferences Policy Control) profile to pre-approve permissions:

1. Grant Screen Recording permission to Snagit
2. Grant Accessibility permission to Snagit and SnagitHelper (located in `/Applications/Snagit 2026.app/Contents/Library/LoginItems/`)
3. Grant Microphone and Camera permissions as needed

Refer to TechSmith's enterprise documentation:
- [Snagit MSI Installation Guide (PDF)](https://assets.techsmith.com/Docs/Snagit-2025-MSI-Installation-Guide.pdf)
- [Enterprise Install Guidelines for macOS](https://support.techsmith.com/hc/en-us/articles/115007344888-Enterprise-Install-Guidelines-for-Snagit-on-MacOS)

---

## References

- [TechSmith Snagit Official Website](https://www.techsmith.com/snagit/)
- [Snagit Download Page](https://www.techsmith.com/download/snagit/)
- [Snagit System Requirements](https://www.techsmith.com/snagit/system-requirements/)
- [Snagit Homebrew Cask](https://formulae.brew.sh/cask/snagit)
- [Snagit Chocolatey Package](https://community.chocolatey.org/packages/snagit)
- [Snagit winget Package](https://winget.run/pkg/TechSmith/Snagit)
- [TechSmith Support - macOS Requirements](https://support.techsmith.com/hc/en-us/articles/219910027-What-Version-of-macOS-Is-Required-for-TechSmith-Products)
- [TechSmith Support - Windows Requirements](https://support.techsmith.com/hc/en-us/articles/219908907-What-Version-of-Windows-Is-Required-for-TechSmith-Products)
- [TechSmith Support - macOS Permissions](https://support.techsmith.com/hc/en-us/articles/360046984312-Mac-OS-Permissions)
- [TechSmith Support - MSI Installation](https://support.techsmith.com/hc/en-us/articles/203731128-Installing-Snagit-with-MSI-Installer)
- [TechSmith Enterprise Resources](https://www.techsmith.com/resources/enterprise-resources/)
- [Snagit MSI Installation Guide (PDF)](https://assets.techsmith.com/Docs/Snagit-2025-MSI-Installation-Guide.pdf)
- [Flameshot - Linux Alternative](https://flameshot.org/)
