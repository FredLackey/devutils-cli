# Installing Microsoft Office 365

## Overview

Microsoft Office 365 (now branded as Microsoft 365) is a subscription-based productivity suite that includes applications such as Word, Excel, PowerPoint, Outlook, OneNote, and OneDrive. It provides both desktop applications and cloud-based services for document creation, collaboration, and communication.

**Important Platform Availability Note**: Microsoft Office 365 is **only officially supported** on Windows, macOS, iOS, and Android. There is **no native Linux version** of Microsoft Office. This document provides installation instructions for supported platforms and alternative approaches for Linux-based systems.

## Prerequisites

Before installing Microsoft Office 365 on any platform, ensure:

1. **Internet connectivity** - Required to download installation packages and activate the license
2. **Microsoft Account** - Required to activate and use Microsoft 365 (personal or organizational account)
3. **Valid Microsoft 365 subscription** - A license is required after installation
4. **Administrative privileges** - Required for system-wide installation

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew package manager - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None (all Microsoft Office applications are bundled in the microsoft-office cask)

### Ubuntu (APT/Snap)
- **Required:** Installation not supported on this platform
- **Optional:** N/A
- **Auto-installed:** N/A

**Note:** Microsoft Office 365 is not available natively on Ubuntu. See alternative approaches in the platform-specific section below.

### Raspberry Pi OS (APT/Snap)
- **Required:** Installation not supported on this platform
- **Optional:** N/A
- **Auto-installed:** N/A

**Note:** Microsoft Office 365 is not available on Raspberry Pi OS due to ARM architecture incompatibility. See alternative approaches in the platform-specific section below.

### Amazon Linux (DNF/YUM)
- **Required:** Installation not supported on this platform
- **Optional:** N/A
- **Auto-installed:** N/A

**Note:** Microsoft Office 365 is not available natively on Amazon Linux. See alternative approaches in the platform-specific section below.

### Windows (Chocolatey/winget)
- **Required:**
  - Chocolatey package manager - Install via PowerShell (Administrator): `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
  - Or winget (built into Windows 10 1809+ and Windows 11)
- **Optional:** None
- **Auto-installed:** None (all Microsoft Office applications are bundled in the office365proplus package)

### Git Bash (Manual/Portable)
- **Required:**
  - PowerShell - Pre-installed on Windows 10 and Windows 11
  - Chocolatey on Windows host - Install via PowerShell (Administrator): `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
- **Optional:** None
- **Auto-installed:** None (installation uses Windows host's package manager)

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 14 (Sonoma) or later (Microsoft 365 supports the current and two previous major macOS releases)
- Homebrew package manager installed
- At least 10 GB free disk space
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Microsoft Office 365:

```bash
brew install --quiet --cask microsoft-office
```

The `--quiet` flag suppresses non-essential output, and `--cask` specifies the graphical application version.

This installs the complete Microsoft Office suite including:
- Microsoft Word
- Microsoft Excel
- Microsoft PowerPoint
- Microsoft Outlook
- Microsoft OneNote
- OneDrive

**Note**: On first launch, each application will require you to sign in with your Microsoft account to activate the license.

#### Verification

Confirm the installation succeeded by checking if the applications exist:

```bash
ls /Applications/ | grep -i microsoft
```

Expected output:

```
Microsoft Excel.app
Microsoft OneNote.app
Microsoft Outlook.app
Microsoft PowerPoint.app
Microsoft Word.app
```

Verify Word can launch:

```bash
open -a "Microsoft Word"
```

#### Troubleshooting

**Problem**: `Error: Cask microsoft-office requires macOS >= 13`

**Solution**: Your macOS version is too old. Microsoft Office 365 requires macOS 13 (Ventura) or later. Upgrade your operating system before installing.

**Problem**: Installation conflicts with existing Microsoft apps

**Solution**: The microsoft-office cask conflicts with individual Microsoft app casks. Remove conflicting casks first:

```bash
brew uninstall --cask microsoft-word microsoft-excel microsoft-powerpoint microsoft-outlook microsoft-onenote 2>/dev/null || true
brew install --quiet --cask microsoft-office
```

**Problem**: "Microsoft Office is damaged and can't be opened" error

**Solution**: Clear the quarantine attribute:

```bash
xattr -cr /Applications/Microsoft\ Word.app
xattr -cr /Applications/Microsoft\ Excel.app
xattr -cr /Applications/Microsoft\ PowerPoint.app
xattr -cr /Applications/Microsoft\ Outlook.app
xattr -cr /Applications/Microsoft\ OneNote.app
```

**Problem**: License activation fails

**Solution**: Ensure you have a valid Microsoft 365 subscription and are signed in with the correct Microsoft account. Open any Office app and go to the account settings to verify your subscription status.

---

### Ubuntu/Debian (APT)

#### Platform Limitation

**Microsoft Office 365 is not available natively on Linux.** Microsoft does not provide desktop Office applications for any Linux distribution including Ubuntu and Debian.

#### Alternative Approaches

Since native installation is not possible, use Microsoft 365 for the web (browser-based) as the primary solution:

**Step 1: Ensure a modern web browser is installed**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y chromium-browser
```

**Step 2: Access Microsoft 365 Online**

Navigate to https://www.office.com in your browser and sign in with your Microsoft account. All Office applications (Word, Excel, PowerPoint, OneNote) are available through the web interface with full document editing capabilities.

**Alternative: Install Office 365 Web Desktop App (Snap)**

A community-maintained Snap package provides a dedicated desktop wrapper for Microsoft 365 web applications:

```bash
sudo snap install office365webdesktop --beta
```

**Note**: This is a third-party wrapper around the web version, not an official Microsoft product. It provides a standalone window experience but requires internet connectivity and uses the web-based Office features.

#### Verification

For the web-based approach, verify browser installation:

```bash
chromium-browser --version
```

For the Snap package:

```bash
snap list | grep office365
```

#### Troubleshooting

**Problem**: Web version has limited features compared to desktop

**Solution**: This is expected behavior. Microsoft 365 for the web provides core editing functionality but lacks some advanced features available in desktop applications. For full functionality on Linux, consider running Windows in a virtual machine.

**Problem**: Snap package fails to connect

**Solution**: Ensure you have an active internet connection and valid Microsoft 365 subscription. The Snap package is a web wrapper and requires network access.

---

### Raspberry Pi OS (APT)

#### Platform Limitation

**Microsoft Office 365 is not available on Raspberry Pi.** Microsoft Office is designed for x86/x64 architectures (Intel/AMD processors), not ARM architecture. Even if Wine were used, Office would not function properly due to the ARM architecture.

#### Alternative Approaches

Use Microsoft 365 for the web as the primary solution:

**Step 1: Install a web browser**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y chromium-browser
```

**Step 2: Access Microsoft 365 Online**

Navigate to https://www.office.com in Chromium and sign in with your Microsoft account.

**Note on Performance**: Microsoft 365 web applications are JavaScript-heavy and may perform slowly on Raspberry Pi models with limited RAM. For better performance:
- Use a Raspberry Pi 4 or 5 with at least 4 GB RAM
- Close other applications while using Office
- Consider using the 64-bit version of Raspberry Pi OS

**Alternative: LibreOffice**

For offline document editing with Microsoft Office file format compatibility, use LibreOffice:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libreoffice
```

LibreOffice can open and edit .docx, .xlsx, and .pptx files, though some advanced formatting may differ from Microsoft Office.

#### Verification

For the browser-based approach:

```bash
chromium-browser --version
```

For LibreOffice:

```bash
libreoffice --version
```

#### Troubleshooting

**Problem**: Microsoft 365 web is very slow

**Solution**: Web applications are resource-intensive. Use a Raspberry Pi 4 or newer with at least 4 GB RAM, enable hardware acceleration in Chromium settings, and consider using the 64-bit version of Raspberry Pi OS.

**Problem**: Complex documents do not render correctly in LibreOffice

**Solution**: This is a limitation of format conversion between office suites. For critical documents requiring exact Microsoft Office formatting, use Microsoft 365 for the web or access Office through a Windows computer.

---

### Amazon Linux/RHEL (DNF/YUM)

#### Platform Limitation

**Microsoft Office 365 is not available on Amazon Linux or RHEL.** Microsoft does not provide desktop Office applications for any Linux distribution.

#### Alternative Approaches

Use Microsoft 365 for the web as the primary solution:

**For Amazon Linux 2023:**

```bash
# Install Firefox browser
sudo dnf install -y firefox

# Or install a Chromium-based browser
sudo dnf install -y chromium
```

**For Amazon Linux 2:**

```bash
# Install Firefox browser
sudo yum install -y firefox

# Or install Chromium
sudo amazon-linux-extras install -y epel
sudo yum install -y chromium
```

**Access Microsoft 365 Online:**

Navigate to https://www.office.com in your browser and sign in with your Microsoft account.

**Note for EC2 Instances**: If running on a headless EC2 instance without a GUI, Microsoft 365 cannot be used directly. Consider:
- Using Windows EC2 instances with Microsoft Office installed
- Processing documents programmatically using tools like LibreOffice headless mode
- Using Microsoft Graph API for automated document operations

**Alternative: LibreOffice for Command-Line Document Processing**

For headless servers that need to process Office documents:

```bash
# Amazon Linux 2023
sudo dnf install -y libreoffice-headless libreoffice-writer libreoffice-calc libreoffice-impress

# Amazon Linux 2
sudo yum install -y libreoffice-headless libreoffice-writer libreoffice-calc libreoffice-impress
```

Example: Convert a Word document to PDF:

```bash
libreoffice --headless --convert-to pdf document.docx
```

#### Verification

For browser installation:

```bash
firefox --version
```

For LibreOffice headless:

```bash
libreoffice --headless --version
```

#### Troubleshooting

**Problem**: Cannot install Chromium on Amazon Linux 2

**Solution**: Chromium requires EPEL repository:

```bash
sudo amazon-linux-extras install -y epel
sudo yum install -y chromium
```

**Problem**: Need Microsoft Office on server for automated document processing

**Solution**: Use LibreOffice headless for format conversion, or use Microsoft Graph API for cloud-based document operations. For complex workflows requiring exact Microsoft Office compatibility, consider Windows-based infrastructure.

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 version 1903 or later (64-bit), or Windows 11
- At least 4 GB RAM and 10 GB free disk space
- Administrator PowerShell or Command Prompt
- Valid Microsoft 365 subscription

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

**Using Chocolatey (Recommended):**

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install office365proplus -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

This installs Microsoft 365 Apps (formerly Office 365 ProPlus) including Word, Excel, PowerPoint, Outlook, OneNote, Access, and Publisher.

**Customization Options:**

To specify a different language:

```powershell
choco install office365proplus -y --params "'/Language:de-de'"
```

**Alternative Using winget:**

If you prefer winget over Chocolatey:

```powershell
winget install --id Microsoft.Office --silent --accept-package-agreements --accept-source-agreements
```

The flags ensure non-interactive installation:
- `--silent` suppresses the installer UI
- `--accept-package-agreements` auto-accepts license agreements
- `--accept-source-agreements` accepts source repository terms

**Note**: After installation, launch any Office application and sign in with your Microsoft account to activate the license.

#### Verification

Open a new Command Prompt or PowerShell window, then verify the installation:

```powershell
# Check if Word is installed
Get-Command winword.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
```

Expected output:

```
C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE
```

Or launch an Office application:

```powershell
Start-Process winword
```

#### Troubleshooting

**Problem**: Installation fails with "Office is already installed"

**Solution**: Remove the existing Office installation first:

```powershell
choco uninstall office365proplus -y
# Or use the Office Removal Tool from Microsoft
```

**Problem**: License activation fails

**Solution**: Open any Office app, go to File > Account, and sign in with your Microsoft account that has an active Microsoft 365 subscription.

**Problem**: "Package not found" error with winget

**Solution**: Update winget sources and retry:

```powershell
winget source update
winget install --id Microsoft.Office --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: Installation requires a restart

**Solution**: Restart your computer after installation completes:

```powershell
Restart-Computer -Force
```

---

### WSL (Ubuntu)

#### Platform Limitation

**Microsoft Office 365 cannot be installed within WSL (Windows Subsystem for Linux).** WSL runs a Linux environment, and Microsoft Office does not support Linux.

#### Recommended Approach

Install Microsoft Office on the Windows host (see Windows section above), then access Office applications from WSL by launching Windows executables.

**Step 1: Install Microsoft Office on Windows**

From a Windows Administrator PowerShell:

```powershell
choco install office365proplus -y
```

**Step 2: Access Office from WSL**

From within your WSL terminal, you can launch Windows Office applications:

```bash
# Launch Microsoft Word from WSL
"/mnt/c/Program Files/Microsoft Office/root/Office16/WINWORD.EXE" &
```

**Step 3: Create convenient aliases (optional)**

Add to your `~/.bashrc`:

```bash
alias word='"/mnt/c/Program Files/Microsoft Office/root/Office16/WINWORD.EXE" &'
alias excel='"/mnt/c/Program Files/Microsoft Office/root/Office16/EXCEL.EXE" &'
alias powerpoint='"/mnt/c/Program Files/Microsoft Office/root/Office16/POWERPNT.EXE" &'
alias outlook='"/mnt/c/Program Files/Microsoft Office/root/Office16/OUTLOOK.EXE" &'
```

Then reload:

```bash
source ~/.bashrc
```

#### Verification

From WSL, verify you can access the Windows Office installation:

```bash
ls "/mnt/c/Program Files/Microsoft Office/root/Office16/"
```

Expected output includes files like:

```
WINWORD.EXE
EXCEL.EXE
POWERPNT.EXE
OUTLOOK.EXE
```

#### Troubleshooting

**Problem**: "Permission denied" when launching Office from WSL

**Solution**: Ensure Office is properly installed on Windows. The permission error usually indicates the path is incorrect.

**Problem**: Office opens but cannot access WSL files

**Solution**: When launching Office from WSL, use Windows-style paths. Convert Linux paths:

```bash
# Instead of /home/user/document.docx, use:
wslpath -w ~/document.docx
# Output: \\wsl$\Ubuntu\home\user\document.docx
```

Then open with that path:

```bash
"/mnt/c/Program Files/Microsoft Office/root/Office16/WINWORD.EXE" "$(wslpath -w ~/document.docx)" &
```

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Administrator access for installation

#### Installation Steps

Git Bash runs on Windows, so Microsoft Office is installed on the Windows host and accessible from Git Bash.

**Step 1: Install Microsoft Office on Windows**

From an Administrator Command Prompt or PowerShell (not Git Bash):

```powershell
choco install office365proplus -y
```

**Step 2: Restart your computer if prompted**

**Step 3: Access Office from Git Bash**

After installation, Office executables are in your Windows PATH. From Git Bash:

```bash
# Launch Microsoft Word
start winword
```

Or use full paths:

```bash
"/c/Program Files/Microsoft Office/root/Office16/WINWORD.EXE" &
```

#### Verification

From Git Bash, verify Office is accessible:

```bash
which winword || ls "/c/Program Files/Microsoft Office/root/Office16/WINWORD.EXE"
```

Launch Word:

```bash
start winword
```

#### Troubleshooting

**Problem**: `winword: command not found`

**Solution**: Office may not be in the Git Bash PATH. Use the full path:

```bash
"/c/Program Files/Microsoft Office/root/Office16/WINWORD.EXE"
```

Or add to PATH in your `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/c/Program Files/Microsoft Office/root/Office16"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Files open in wrong application

**Solution**: Use `start` command with specific application:

```bash
start winword "C:/Users/myuser/Documents/file.docx"
```

---

## Post-Installation Configuration

After installing Microsoft Office 365 on supported platforms (Windows, macOS), consider these configuration steps.

### Activating Your License

1. Open any Office application (Word, Excel, etc.)
2. Sign in with your Microsoft account that has an active Microsoft 365 subscription
3. Follow the activation prompts to complete setup

### Configuring Default File Formats

By default, Microsoft Office uses modern formats (.docx, .xlsx, .pptx). To ensure compatibility:

1. Open any Office application
2. Go to File > Options > Save (Windows) or Preferences > Save (macOS)
3. Set default file formats as needed

### Enabling Cloud Storage Integration

Microsoft 365 integrates with OneDrive for cloud storage:

1. Open any Office application
2. Go to File > Account
3. Ensure OneDrive is connected under "Connected Services"

### Installing Office Updates

**macOS:**

```bash
# Microsoft AutoUpdate handles Office updates
open -a "Microsoft AutoUpdate"
```

**Windows:**

```powershell
# Office updates through Windows Update or the application itself
# Open any Office app, go to File > Account > Update Options > Update Now
```

---

## Common Issues

### Issue: "Unlicensed Product" Warning

**Symptoms**: Office applications show "Unlicensed Product" or limited functionality

**Solutions**:

- Verify your Microsoft 365 subscription is active at https://account.microsoft.com/services
- Sign out and sign back in with your Microsoft account
- On macOS, reset Office license:

```bash
# Remove Office license files
rm -rf ~/Library/Group\ Containers/UBF8T346G9.Office/Licenses
```

### Issue: Sync Conflicts with OneDrive

**Symptoms**: Documents show sync errors or multiple versions

**Solutions**:

- Check OneDrive sync status in the system tray/menu bar
- Resolve conflicts by opening the conflicting files and merging changes manually
- Ensure stable internet connection

### Issue: Office Crashes on Launch

**Symptoms**: Applications crash immediately or shortly after opening

**Solutions**:

**macOS:**

```bash
# Reset Office preferences
rm -rf ~/Library/Containers/com.microsoft.*
rm -rf ~/Library/Group\ Containers/UBF8T346G9.*
```

**Windows:**

```powershell
# Run Office repair
# Open Control Panel > Programs > Programs and Features
# Select Microsoft 365, click Change, select Quick Repair
```

### Issue: Cannot Open Files from Network Locations

**Symptoms**: Office shows security warnings or blocks network files

**Solutions**:

- Add the network location to Trusted Locations in Office settings
- File > Options > Trust Center > Trust Center Settings > Trusted Locations

---

## Summary Table

| Platform | Native Support | Installation Method | Notes |
|----------|---------------|---------------------|-------|
| macOS | Yes | `brew install --quiet --cask microsoft-office` | Requires macOS 13+ |
| Windows | Yes | `choco install office365proplus -y` | Primary supported platform |
| Ubuntu | No | Browser: https://www.office.com | Web version only |
| Raspberry Pi | No | Browser: https://www.office.com | Web version only, may be slow |
| Amazon Linux | No | Browser or LibreOffice headless | Web version or format conversion |
| WSL | No | Install on Windows host, access from WSL | Uses Windows installation |
| Git Bash | N/A | Uses Windows installation | Inherits Windows Office |

---

## References

- [Microsoft 365 Official Website](https://www.microsoft.com/en-us/microsoft-365)
- [Microsoft 365 System Requirements](https://www.microsoft.com/en-us/microsoft-365/microsoft-365-and-office-resources)
- [Microsoft Office Homebrew Cask](https://formulae.brew.sh/cask/microsoft-office)
- [Office 365 ProPlus Chocolatey Package](https://community.chocolatey.org/packages/office365proplus)
- [Microsoft Office winget Package](https://winget.run/pkg/Microsoft/Office)
- [Microsoft 365 for the Web](https://www.office.com)
- [macOS Version Requirements for Office](https://support.microsoft.com/en-us/office/upgrade-macos-to-continue-receiving-microsoft-365-and-office-for-mac-updates-16b8414f-08ec-4b24-8c91-10a918f649f8)
- [winget install Command Documentation](https://learn.microsoft.com/en-us/windows/package-manager/winget/install)
