# Installing WSL 2 (Windows Subsystem for Linux 2)

## Dependencies

### macOS (Homebrew)
- **Not Applicable**: WSL 2 is a Windows-only technology. It cannot be installed on macOS. macOS users should use native virtualization solutions such as Docker Desktop for Mac, UTM, or Parallels Desktop to run Linux environments.

### Ubuntu (APT/Snap)
- **Not Applicable**: WSL 2 is a Windows-only technology designed to run Linux on Windows. Ubuntu is already a Linux distribution. WSL 2 cannot and does not need to be installed on native Linux systems.

### Raspberry Pi OS (APT/Snap)
- **Not Applicable**: WSL 2 is a Windows-only technology. Raspberry Pi OS is a Linux distribution and does not support WSL 2. The Raspberry Pi runs Linux natively.

### Amazon Linux (DNF/YUM)
- **Not Applicable**: WSL 2 is a Windows-only technology. Amazon Linux is already a Linux distribution running natively on AWS infrastructure. WSL 2 is not available for Linux systems.

### Windows (Chocolatey/winget)
- **Required:**
  - Windows 10 version 1903 or later (Build 18362+) for x64 systems, or Windows 10 version 2004+ (Build 19041+) for ARM64 systems
  - Windows 11 (any version)
  - CPU with virtualization support (Intel VT-x or AMD-V)
  - Virtualization enabled in BIOS/UEFI
  - Administrator privileges
- **Optional:**
  - Chocolatey - Install via PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
- **Auto-installed:**
  - Virtual Machine Platform Windows feature
  - Windows Subsystem for Linux feature
  - WSL 2 Linux kernel
  - Ubuntu distribution (default, can be changed)

### Git Bash (Manual/Portable)
- **Required:**
  - WSL 2 installed on the Windows host system (see Windows section)
  - Windows 10 version 1903+ or Windows 11
- **Optional:** None
- **Auto-installed:** None (Git Bash uses the Windows host's WSL installation)

## Overview

WSL 2 (Windows Subsystem for Linux 2) is Microsoft's virtualization technology that allows developers to run a full Linux kernel and Linux distributions natively on Windows 10 and Windows 11. Unlike WSL 1, which used a translation layer to convert Linux system calls to Windows calls, WSL 2 runs an actual Linux kernel in a lightweight virtual machine, providing:

- **Full Linux kernel compatibility**: Run any Linux software without modification, including Docker, systemd-dependent applications, and kernel modules
- **Significantly faster file system performance**: Up to 20x faster than WSL 1 for Linux file operations
- **Full system call compatibility**: Supports applications that were incompatible with WSL 1
- **Seamless Windows integration**: Access Windows files from Linux and vice versa, run Linux commands from Windows terminals

WSL 2 is essential for developers who need Linux development tools while working in a Windows environment, particularly for running Docker, developing with Linux-native toolchains, or testing on Linux before deployment.

**Important**: WSL 2 is exclusively a Windows technology. It cannot be installed on macOS, Linux, or any other operating system. This documentation covers the Windows installation in detail and explicitly notes the inapplicability for other platforms.

## Prerequisites

Before installing WSL 2 on Windows, ensure your system meets these requirements:

1. **Operating System Version**:
   - **Windows 10**: Version 1903 (Build 18362) or later for x64 systems; Version 2004 (Build 19041) or later for ARM64 systems
   - **Windows 11**: All versions supported

2. **Hardware Requirements**:
   - 64-bit processor with Second Level Address Translation (SLAT) support
   - Intel: Core i3/i5/i7/i9 (1st generation or later) with Intel VT-x
   - AMD: Ryzen or later with AMD-V (SVM)
   - At least 4 GB RAM (8 GB recommended)
   - At least 10 GB free disk space

3. **BIOS/UEFI Settings**:
   - Hardware virtualization must be enabled (Intel VT-x, AMD-V, or SVM)

4. **Administrative Privileges**: Required for enabling Windows features

To check your Windows version, press `Win + R`, type `winver`, and press Enter. The dialog will display your Windows version and build number.

## Platform-Specific Installation

### macOS (Homebrew)

#### Platform Status

**WSL 2 is not available for macOS.** WSL (Windows Subsystem for Linux) is a Microsoft Windows feature that enables running Linux distributions on Windows. It is not designed for, nor compatible with, macOS.

#### Alternative Solutions for macOS

macOS users who need Linux environments should use one of these alternatives:

1. **Docker Desktop for Mac**: Run Linux containers natively on macOS
2. **UTM**: Free, open-source virtualization for macOS (supports Apple Silicon)
3. **Parallels Desktop**: Commercial virtualization software for macOS
4. **VMware Fusion**: Commercial virtualization software for macOS
5. **Multipass**: Ubuntu-optimized VM manager from Canonical

Install Docker Desktop on macOS (the most common alternative):

```bash
brew install --quiet --cask docker
```

---

### Ubuntu/Debian (APT)

#### Platform Status

**WSL 2 is not available for Ubuntu or Debian.** WSL 2 is designed to run Linux on Windows, not on Linux itself. Ubuntu and Debian are native Linux distributions and do not require or support WSL 2.

#### Why WSL 2 Does Not Apply

Ubuntu users already have a native Linux environment. WSL 2 exists specifically to bring Linux capabilities to Windows. Installing WSL 2 on Ubuntu would be circular and nonsensical, as Ubuntu is already the Linux environment that WSL 2 provides on Windows.

If you are running Ubuntu inside WSL 2 on a Windows machine, no additional installation is needed within the Ubuntu environment itself. WSL 2 is managed from the Windows host, not from within the Linux distribution.

---

### Raspberry Pi OS (APT)

#### Platform Status

**WSL 2 is not available for Raspberry Pi OS.** Raspberry Pi OS is a Linux distribution based on Debian that runs natively on Raspberry Pi hardware. WSL 2 is a Windows-only technology.

#### Why WSL 2 Does Not Apply

Raspberry Pi devices run Linux natively. There is no need for a Linux subsystem because the operating system is already Linux. WSL 2 provides Linux compatibility for Windows users, which is unnecessary when running a native Linux distribution.

---

### Amazon Linux (DNF/YUM)

#### Platform Status

**WSL 2 is not available for Amazon Linux.** Amazon Linux is a Linux distribution designed for AWS infrastructure. WSL 2 is a Windows-only technology that cannot run on Linux systems.

#### Why WSL 2 Does Not Apply

Amazon Linux EC2 instances and other AWS compute resources run Linux natively. WSL 2 exists to provide Linux functionality on Windows, which is unnecessary when the operating system is already Linux.

---

### Windows (PowerShell)

#### Prerequisites

- Windows 10 version 1903 or later (x64), or Windows 10 version 2004 or later (ARM64)
- Windows 11 (any version)
- Administrator privileges
- Virtualization enabled in BIOS/UEFI
- Internet connectivity for downloading components

**Verify your Windows version** by pressing `Win + R`, typing `winver`, and pressing Enter. Your build number must be 18362 or higher for x64 systems, or 19041 or higher for ARM64 systems.

**Verify virtualization is enabled** by opening Task Manager (`Ctrl + Shift + Esc`), clicking the "Performance" tab, selecting "CPU", and confirming "Virtualization: Enabled" appears in the details.

#### Installation Steps

**Step 1: Open PowerShell as Administrator**

Press `Win + X` and select "Windows Terminal (Admin)" or "PowerShell (Admin)". Alternatively, search for "PowerShell" in the Start menu, right-click it, and select "Run as administrator".

**Step 2: Install WSL 2 with Default Ubuntu Distribution**

Run the following command to install WSL 2 with Ubuntu (the default distribution):

```powershell
wsl --install
```

This single command performs all necessary actions:
- Enables the "Virtual Machine Platform" Windows feature
- Enables the "Windows Subsystem for Linux" Windows feature
- Downloads and installs the WSL 2 Linux kernel
- Downloads and installs the Ubuntu distribution
- Sets WSL 2 as the default version for new installations

**Step 3: Restart Your Computer**

A restart is required to complete the installation. Save your work and restart:

```powershell
Restart-Computer
```

**Step 4: Complete Ubuntu Setup**

After restarting, the Ubuntu installation will continue automatically. A terminal window will open prompting you to create a Linux username and password. Enter your desired credentials when prompted.

**Alternative: Install WSL 2 Without a Distribution**

If you want to install only the WSL 2 infrastructure without any Linux distribution:

```powershell
wsl --install --no-distribution
```

After installation and restart, you can install a specific distribution:

```powershell
wsl --install -d Debian
```

**Alternative: Install a Different Distribution**

To see available distributions:

```powershell
wsl --list --online
```

To install a specific distribution instead of Ubuntu:

```powershell
wsl --install -d Debian
```

Common distribution options include: Ubuntu, Ubuntu-24.04, Ubuntu-22.04, Debian, kali-linux, openSUSE-Leap-15.6, and SLES-15-SP6.

#### Verification

After installation and restart, verify WSL 2 is installed correctly.

**Check WSL version and status:**

```powershell
wsl --version
```

Expected output (version numbers may vary):

```
WSL version: 2.3.26.0
Kernel version: 5.15.167.4-1
WSLg version: 1.0.65
MSRDC version: 1.2.5620
Direct3D version: 1.611.1-81528511
DXCore version: 10.0.26100.1-240331-1435.ge-release
Windows version: 10.0.22631.4460
```

**Check installed distributions:**

```powershell
wsl --list --verbose
```

Expected output:

```
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

The asterisk (*) indicates the default distribution. The VERSION column should show "2" for WSL 2.

**Test the Linux environment:**

```powershell
wsl echo "WSL 2 is working correctly"
```

Expected output:

```
WSL 2 is working correctly
```

#### Troubleshooting

**Problem**: "WSL 2 requires an update to its kernel component"

**Solution**: Update the WSL kernel:

```powershell
wsl --update
```

Restart your computer after the update completes.

**Problem**: Error 0x80370102 - "The virtual machine could not be started because a required feature is not installed"

**Solution**: Virtualization is not enabled in BIOS. Restart your computer and enter BIOS/UEFI settings (usually by pressing F2, F10, F12, Del, or Esc during startup). Enable the virtualization setting:
- Intel systems: Enable "Intel VT-x", "Intel Virtualization Technology", or "VT-x"
- AMD systems: Enable "AMD-V", "SVM", or "Secure Virtual Machine"

Save and exit BIOS, then retry the installation.

**Problem**: Error 0x8007019e - "Windows Subsystem for Linux has no installed distributions"

**Solution**: WSL features are enabled but no distribution is installed. Install a distribution:

```powershell
wsl --install -d Ubuntu
```

**Problem**: Error 0x80370114 - "The operation could not be started because a required feature is not installed"

**Solution**: Enable the Virtual Machine Platform feature manually:

```powershell
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

Restart your computer and retry.

**Problem**: `wsl --install` shows help text instead of installing

**Solution**: WSL may already be partially installed. Enable features manually and update:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

Restart your computer, then run:

```powershell
wsl --update
wsl --install -d Ubuntu
```

**Problem**: Installation stuck or very slow

**Solution**: Use the web download option:

```powershell
wsl --install --web-download
```

**Problem**: WSL distribution shows VERSION 1 instead of 2

**Solution**: Convert the distribution to WSL 2:

```powershell
wsl --set-version Ubuntu 2
```

Set WSL 2 as the default for future installations:

```powershell
wsl --set-default-version 2
```

**Problem**: "Catastrophic failure" or unexpected errors

**Solution**: Reset WSL completely:

```powershell
wsl --shutdown
wsl --unregister Ubuntu
wsl --install -d Ubuntu
```

Note: This will delete all data in the Ubuntu distribution. Back up important files first.

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 1903 or later, or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed
- Virtualization enabled in BIOS/UEFI

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install wsl2 -y --params "/Version:2 /Retry:true"
```

**Parameter explanation**:
- `-y`: Automatically confirm all prompts (non-interactive)
- `/Version:2`: Install WSL version 2 (default)
- `/Retry:true`: Automatically retry installation after reboot if WSL 1 was not previously installed

**Important**: A system restart is required. After running the command, restart your computer:

```powershell
Restart-Computer
```

If you used `/Retry:true`, the installation will automatically continue after reboot. Otherwise, run the install command again after restarting.

After WSL 2 is installed, install a Linux distribution:

```powershell
wsl --install -d Ubuntu
```

#### Verification

Verify the installation using the same commands as the PowerShell method:

```powershell
wsl --version
wsl --list --verbose
```

#### Troubleshooting

See the PowerShell section above for common troubleshooting steps. The Chocolatey installation uses the same underlying WSL infrastructure.

**Problem**: Chocolatey installation fails with "WSL 1 not detected" message

**Solution**: The Chocolatey package requires a reboot between enabling WSL 1 features and installing WSL 2. Use `/Retry:true` parameter or manually reboot and re-run the command.

---

### WSL (Ubuntu)

#### Platform Status

**This section does not apply.** If you are reading this while running Ubuntu inside WSL, you are already using WSL 2. WSL 2 is managed from the Windows host system, not from within the Linux distribution.

To manage WSL 2 settings, open a Windows PowerShell or Command Prompt (not the WSL terminal) and use commands like `wsl --version`, `wsl --update`, or `wsl --shutdown`.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 version 1903 or later, or Windows 11
- Git Bash installed (comes with Git for Windows)
- WSL 2 installed on Windows (see Windows section above)

**Note**: Git Bash does not require a separate WSL 2 installation. Git Bash inherits access to Windows commands, so once WSL 2 is installed via PowerShell or Chocolatey, the `wsl` command is automatically available in Git Bash.

#### Installation Steps

1. Install WSL 2 on Windows using PowerShell (see Windows section above):

```bash
# Run from Administrator PowerShell, not Git Bash
wsl --install
```

2. Restart your computer

3. Open Git Bash - the `wsl` command will be available

#### Verification

In Git Bash, verify WSL is accessible:

```bash
wsl --version
```

Expected output shows WSL version information.

List installed distributions:

```bash
wsl --list --verbose
```

Enter the default Linux distribution:

```bash
wsl
```

This opens an interactive Linux shell. Type `exit` to return to Git Bash.

#### Troubleshooting

**Problem**: `wsl: command not found` in Git Bash

**Solution**: WSL is not installed on Windows. Install it using PowerShell as Administrator (see Windows section), then restart Git Bash.

**Problem**: Git Bash PATH does not include WSL

**Solution**: Add WSL to your Git Bash PATH by editing `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/mnt/c/Windows/System32"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Path conversion issues when passing arguments to WSL

**Solution**: Git Bash automatically converts Unix-style paths to Windows paths, which can break WSL commands. Use the `MSYS_NO_PATHCONV` environment variable:

```bash
MSYS_NO_PATHCONV=1 wsl ls /home
```

---

## Post-Installation Configuration

After installing WSL 2 on Windows, consider these optional but recommended configurations.

### Setting WSL 2 as the Default Version

Ensure all new distributions use WSL 2:

```powershell
wsl --set-default-version 2
```

### Updating WSL

Keep WSL and the Linux kernel updated:

```powershell
wsl --update
```

### Configuring WSL Settings

Create a `.wslconfig` file in your Windows user profile directory (`C:\Users\<username>\.wslconfig`) to configure global WSL 2 settings:

```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
localhostForwarding=true
```

**Configuration options**:
- `memory`: Maximum memory allocation for WSL 2 VM (default: 50% of host RAM)
- `processors`: Number of processors to allocate (default: all)
- `swap`: Swap file size (default: 25% of host RAM)
- `localhostForwarding`: Allow localhost to forward between Windows and WSL

After creating or modifying `.wslconfig`, restart WSL:

```powershell
wsl --shutdown
```

### Accessing Windows Files from Linux

Windows drives are mounted under `/mnt/` in WSL. Access your Windows files:

```bash
# Access C: drive
ls /mnt/c/Users/

# Access D: drive
ls /mnt/d/
```

### Accessing Linux Files from Windows

Access your WSL Linux files from Windows Explorer by navigating to:

```
\\wsl$\Ubuntu\home\<username>
```

Or from PowerShell:

```powershell
explorer.exe \\wsl$\Ubuntu\home
```

### Running Windows Commands from Linux

Execute Windows commands from within WSL:

```bash
# Open Windows Explorer in current directory
explorer.exe .

# Run a Windows executable
cmd.exe /c dir

# Open VS Code in current directory
code .
```

### Running Linux Commands from Windows

Execute Linux commands from PowerShell or Command Prompt:

```powershell
# Run a single command
wsl ls -la

# Run a command in a specific distribution
wsl -d Ubuntu cat /etc/os-release
```

---

## Common Issues

### Issue: WSL Uses Too Much Memory

**Symptoms**: Windows becomes slow; WSL 2 VM consumes excessive RAM

**Solution**: Limit memory allocation in `.wslconfig`:

Create `C:\Users\<username>\.wslconfig`:

```ini
[wsl2]
memory=4GB
```

Then restart WSL:

```powershell
wsl --shutdown
```

### Issue: Slow File Performance When Accessing Windows Files

**Symptoms**: Operations on `/mnt/c/` are slow

**Solution**: Store project files inside the Linux file system (`/home/username/`) rather than on Windows drives. Linux file operations within WSL are significantly faster than cross-filesystem operations.

```bash
# Move project to Linux filesystem
cp -r /mnt/c/Users/me/project ~/project
cd ~/project
```

### Issue: Network Connectivity Problems

**Symptoms**: Cannot access internet from within WSL

**Solution**: Reset the WSL network configuration:

```powershell
wsl --shutdown
netsh winsock reset
netsh int ip reset all
ipconfig /release
ipconfig /renew
ipconfig /flushdns
```

Restart your computer and start WSL again.

### Issue: Clock/Time Drift

**Symptoms**: Time inside WSL is incorrect or drifts from Windows time

**Solution**: Sync the WSL clock with Windows:

```bash
sudo hwclock -s
```

Or from Windows:

```powershell
wsl --shutdown
wsl
```

### Issue: GUI Applications Not Working (WSLg)

**Symptoms**: Linux GUI applications fail to launch or display

**Solution**: Ensure you are running Windows 11 or Windows 10 Build 21364+ with WSLg support. Update WSL:

```powershell
wsl --update
wsl --shutdown
```

### Issue: Docker Not Working in WSL 2

**Symptoms**: Docker commands fail or Docker daemon not running

**Solution**: Install Docker Desktop for Windows and enable WSL 2 integration:

1. Install Docker Desktop
2. Open Docker Desktop settings
3. Navigate to Resources > WSL Integration
4. Enable integration for your WSL distribution

Alternatively, install Docker Engine directly inside WSL 2 (see the Docker installation documentation).

---

## References

- [Microsoft Learn: Install WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Microsoft Learn: Manual Installation Steps for Older Versions of WSL](https://learn.microsoft.com/en-us/windows/wsl/install-manual)
- [Microsoft Learn: Basic Commands for WSL](https://learn.microsoft.com/en-us/windows/wsl/basic-commands)
- [Microsoft Learn: Comparing WSL Versions](https://learn.microsoft.com/en-us/windows/wsl/compare-versions)
- [Microsoft Learn: Troubleshooting WSL](https://learn.microsoft.com/en-us/windows/wsl/troubleshooting)
- [Microsoft Learn: WSL FAQ](https://learn.microsoft.com/en-us/windows/wsl/faq)
- [Microsoft WSL GitHub Repository](https://github.com/microsoft/WSL)
- [Chocolatey WSL2 Package](https://community.chocolatey.org/packages/wsl2)
- [Ubuntu on WSL Documentation](https://documentation.ubuntu.com/wsl/stable/)
