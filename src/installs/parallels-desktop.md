# Installing Parallels Desktop

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
  - macOS 13 (Ventura) or later
  - Apple Silicon (M-series) or Intel processor
- **Optional:**
  - Parallels license key (required for activation; can be activated after installation)
- **Auto-installed:** None (Parallels Desktop is a complete standalone application)

### Ubuntu (APT/Snap)
- **Not Supported** - Parallels Desktop is a macOS-only application. It cannot be installed on Ubuntu or any Linux distribution as a host operating system.

### Raspberry Pi OS (APT/Snap)
- **Not Supported** - Parallels Desktop is a macOS-only application. It cannot be installed on Raspberry Pi OS.

### Amazon Linux (DNF/YUM)
- **Not Supported** - Parallels Desktop is a macOS-only application. It cannot be installed on Amazon Linux.

### Windows (Chocolatey/winget)
- **Not Supported** - Parallels Desktop is a macOS-only application. Parallels previously offered "Parallels Workstation" for Windows, but this product was discontinued in 2013.

### Git Bash (Manual/Portable)
- **Not Supported** - Parallels Desktop is a macOS-only application. Git Bash runs on Windows, where Parallels Desktop is not available.

## Overview

Parallels Desktop is a desktop virtualization software exclusively designed for macOS. It enables Mac users to run Windows, Linux, and other operating systems as virtual machines (VMs) alongside macOS without rebooting. Parallels Desktop provides hardware virtualization that allows near-native performance for guest operating systems.

Key features include:

- **Seamless Integration**: Run Windows applications directly from the macOS Dock, open files with Windows apps, and copy/paste between operating systems
- **Coherence Mode**: Windows applications appear as native macOS windows without showing the Windows desktop
- **Apple Silicon Support**: Full native support for M-series Macs running ARM-based guest operating systems
- **Performance Optimization**: Hardware-accelerated graphics, USB device passthrough, and shared folders
- **Developer Tools**: Command-line interface (CLI) for managing VMs programmatically, support for Docker containers, and integration with development workflows

**Important Note**: Parallels Desktop is commercial software requiring a paid license for continued use after the trial period. A valid license key is required for activation.

## Prerequisites

Before installing Parallels Desktop:

1. **macOS Version**: macOS 13 (Ventura) or later is required for Parallels Desktop 26
2. **Hardware**: Apple Silicon (M1/M2/M3/M4) or Intel Core i5/i7/i9/Xeon processor
3. **RAM**: Minimum 4 GB (16 GB or more recommended for optimal performance)
4. **Disk Space**: At least 600 MB for the application, plus 16 GB minimum for each guest operating system
5. **Internet Connection**: Required for product activation and updates
6. **Administrative Privileges**: Required during installation to install system extensions

**Architecture Considerations**:
- On Apple Silicon Macs, only ARM-compatible guest operating systems can run natively (Windows 11 ARM, ARM Linux distributions, macOS)
- On Intel Macs, x86/x64 guest operating systems are supported
- Parallels Desktop does not emulate x86 on Apple Silicon (some experimental x86 emulation is available in recent versions)

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 13 (Ventura) or later
- Homebrew package manager installed
- At least 4 GB RAM (16 GB recommended)
- At least 20 GB free disk space (600 MB for app + space for VMs)
- Apple Silicon (M-series) or Intel processor
- Internet connection for activation

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Parallels Desktop:

```bash
brew install --quiet --cask parallels
```

The `--quiet` flag suppresses non-essential output, and `--cask` specifies the graphical application version.

**Note**: The first time you run Parallels Desktop, it will request permission to install system extensions. Grant this permission in System Settings > Privacy & Security.

After installation, launch Parallels Desktop:

```bash
open -a "Parallels Desktop"
```

On first launch, you will be prompted to:
1. Accept the license agreement
2. Sign in or create a Parallels account
3. Activate your license or start a trial

#### License Activation via CLI (Pro/Business Editions)

If you have a Pro or Business Edition license and want to activate via command line:

```bash
# Sign in to your Parallels account first
prlsrvctl web-portal signin <your-email@example.com>

# Install and activate the license
prlsrvctl install-license -k <your-license-key>
```

**Note**: CLI license management is only available in Pro and Business editions. Standard edition requires GUI activation.

#### Verification

Confirm the installation succeeded by checking the version:

```bash
prlctl --version
```

Expected output (version numbers may vary):

```
prlctl version 26.2.1 (57371)
```

Verify Parallels Desktop is running:

```bash
prlsrvctl info
```

This displays information about the Parallels Desktop installation, including license status and version.

#### Troubleshooting

**Problem**: Installation fails with "Permission denied" or "Operation not permitted"

**Solution**: Grant Terminal (or your terminal application) Full Disk Access:

1. Open System Settings > Privacy & Security > Full Disk Access
2. Click the lock icon and authenticate
3. Add Terminal (or your terminal app) to the list
4. Restart Terminal and retry the installation:

```bash
brew uninstall --cask parallels
brew install --quiet --cask parallels
```

**Problem**: "System Extension Blocked" message on first launch

**Solution**: Allow the Parallels system extension:

1. Open System Settings > Privacy & Security
2. Scroll down to find the blocked extension message
3. Click "Allow" next to Parallels
4. Restart your Mac if prompted

**Problem**: `prlctl: command not found` after installation

**Solution**: Parallels Desktop may not have added its CLI tools to PATH. Add them manually:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Or for bash:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bash_profile
source ~/.bash_profile
```

**Problem**: Activation fails with network errors

**Solution**: Check your internet connection and firewall settings. Parallels requires access to activation servers. If behind a corporate firewall, contact your IT department to allow access to `*.parallels.com`.

**Problem**: Poor performance on Apple Silicon

**Solution**: Ensure you are running ARM-compatible guest operating systems. Running x86 guests through emulation will be significantly slower. Use Windows 11 ARM or ARM Linux distributions for best performance.

---

### Ubuntu/Debian (APT)

#### Platform Not Supported

Parallels Desktop is exclusively developed for macOS and cannot be installed on Ubuntu, Debian, or any other Linux distribution as a host operating system.

#### Alternative Virtualization Solutions for Ubuntu

If you need virtualization on Ubuntu, consider these alternatives:

- **KVM/QEMU with virt-manager**: Native Linux virtualization with excellent performance
- **VirtualBox**: Cross-platform virtualization software (free, open-source)
- **VMware Workstation**: Commercial virtualization for Linux and Windows hosts

---

### Raspberry Pi OS (APT)

#### Platform Not Supported

Parallels Desktop is exclusively developed for macOS and cannot be installed on Raspberry Pi OS. The ARM architecture of Raspberry Pi is not a limiting factor - Parallels simply does not develop software for any Linux distribution.

#### Alternative Virtualization Solutions for Raspberry Pi

Due to the limited resources of Raspberry Pi hardware, full virtualization is typically not practical. Consider:

- **Docker**: Lightweight containerization that works well on Raspberry Pi
- **QEMU**: Can emulate other architectures, though with significant performance overhead

---

### Amazon Linux (DNF/YUM)

#### Platform Not Supported

Parallels Desktop is exclusively developed for macOS and cannot be installed on Amazon Linux or any other Linux distribution.

#### Alternative Virtualization Solutions for Amazon Linux

For virtualization on Amazon Linux (typically running on AWS EC2):

- **AWS EC2 Nested Virtualization**: Available on certain instance types (metal instances)
- **Docker/Podman**: Container-based isolation
- **KVM**: If running on bare metal or supported EC2 instances

---

### Windows (Chocolatey/winget)

#### Platform Not Supported

Parallels Desktop is exclusively developed for macOS and cannot be installed on Windows.

**Historical Note**: Parallels previously offered "Parallels Workstation" for Windows and Linux hosts, but this product was discontinued in 2013. There is no current Parallels product for Windows.

#### Alternative Virtualization Solutions for Windows

- **Hyper-V**: Built-in Windows virtualization (Windows 10/11 Pro, Enterprise, Education)
- **VMware Workstation**: Commercial virtualization software
- **VirtualBox**: Cross-platform virtualization software (free, open-source)
- **WSL 2**: Windows Subsystem for Linux for running Linux distributions

---

### WSL (Ubuntu)

#### Platform Not Supported

Parallels Desktop cannot be installed within WSL. WSL is a Linux compatibility layer running on Windows, and Parallels Desktop only runs on macOS.

#### Note About Virtualization in WSL

WSL 2 itself uses virtualization technology (Hyper-V) to run Linux. Running additional virtualization software within WSL is not supported and would require nested virtualization, which is not available in WSL.

---

### Git Bash (Manual/Portable)

#### Platform Not Supported

Parallels Desktop cannot be installed in Git Bash or any Windows environment. Git Bash is a terminal emulator for Windows, and Parallels Desktop is exclusively available for macOS.

---

## Post-Installation Configuration

These configurations apply only to macOS installations.

### Creating Your First Virtual Machine

After activating Parallels Desktop, create a virtual machine:

```bash
# List available OS templates
prlctl create-template --list

# Create a Windows 11 ARM VM (Apple Silicon)
prlctl create "Windows 11" --ostype win-11-arm

# Start the VM
prlctl start "Windows 11"
```

**Note**: Creating VMs typically requires downloading the guest OS installation media. Parallels Desktop can automatically download Windows 11 ARM for Apple Silicon Macs.

### Configuring VM Resources via CLI

Adjust VM resources using the command line:

```bash
# Stop the VM first
prlctl stop "Windows 11"

# Set CPU count
prlctl set "Windows 11" --cpus 4

# Set RAM (in MB)
prlctl set "Windows 11" --memsize 8192

# Start the VM
prlctl start "Windows 11"
```

### Enabling Shared Folders

Share folders between macOS and your VM:

```bash
prlctl set "Windows 11" --shf-host on
prlctl set "Windows 11" --shf-host-defined ~/Documents
```

### Configuring Network Mode

Set the VM network mode:

```bash
# Shared networking (NAT) - default
prlctl set "Windows 11" --device-set net0 --type shared

# Bridged networking - VM gets its own IP on your network
prlctl set "Windows 11" --device-set net0 --type bridged
```

### Checking License Status

View current license information:

```bash
prlsrvctl info --license
```

---

## Common Issues

### Issue: "Parallels Desktop cannot be opened because it is from an unidentified developer"

**Symptoms**: macOS Gatekeeper blocks the application from opening.

**Solution**: Right-click on Parallels Desktop in Applications and select "Open", then click "Open" in the dialog. Alternatively, allow the app in System Settings > Privacy & Security.

### Issue: VM Performance is Slow

**Symptoms**: Virtual machines run sluggishly, applications within VMs lag.

**Solutions**:

1. Allocate more RAM and CPU cores to the VM:

```bash
prlctl stop "VM Name"
prlctl set "VM Name" --cpus 4 --memsize 8192
prlctl start "VM Name"
```

2. Ensure Parallels Tools are installed in the guest OS (provides driver optimization)

3. Use an SSD for VM storage

4. Close unnecessary applications on the Mac host

### Issue: Cannot Start VM - "Not enough disk space"

**Symptoms**: VM fails to start with disk space error.

**Solution**: Free up disk space on your Mac or move VM files to an external drive:

```bash
# Check VM disk usage
prlctl list -a --info | grep -A 5 "Disk"

# Move VM to external drive (VM must be stopped)
mv ~/Parallels/*.pvm /Volumes/ExternalDrive/Parallels/
```

### Issue: Network Not Working in VM

**Symptoms**: VM cannot access internet or local network.

**Solutions**:

1. Reset VM network adapter:

```bash
prlctl set "VM Name" --device-del net0
prlctl set "VM Name" --device-add net --type shared
```

2. Restart Parallels networking service:

```bash
sudo launchctl unload /Library/LaunchDaemons/com.parallels.vm.prl_naptd.plist
sudo launchctl load /Library/LaunchDaemons/com.parallels.vm.prl_naptd.plist
```

### Issue: USB Device Not Recognized by VM

**Symptoms**: USB devices connected to Mac are not visible in VM.

**Solution**: Manually connect the device to the VM:

1. Go to Devices menu in Parallels Desktop
2. Select USB & Bluetooth
3. Choose the device to connect to the VM

Or via CLI (requires knowing the device ID):

```bash
prlctl usb list
prlctl usb connect "VM Name" <device-id>
```

### Issue: Parallels Desktop License Expired

**Symptoms**: Application prompts for license renewal or features are restricted.

**Solution**: Renew your license at parallels.com or enter a new license key:

```bash
# Check current license status
prlsrvctl info --license

# Install new license (Pro/Business editions)
prlsrvctl install-license -k <new-license-key>
```

---

## References

- [Parallels Desktop Official Website](https://www.parallels.com/products/desktop/)
- [Parallels Desktop System Requirements](https://kb.parallels.com/124223)
- [Parallels Desktop and macOS Compatibility](https://kb.parallels.com/114381)
- [Parallels Desktop Command-Line Interface Guide](https://docs.parallels.com/parallels-desktop-developers-guide/command-line-interface-utility)
- [Parallels Desktop Homebrew Cask](https://formulae.brew.sh/cask/parallels)
- [Parallels Desktop on Apple Silicon](https://kb.parallels.com/125343)
- [Parallels Desktop Resources and System Requirements](https://www.parallels.com/products/desktop/resources/)
- [Parallels Knowledge Base](https://kb.parallels.com/)
