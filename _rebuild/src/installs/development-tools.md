# Installing Development Tools

## Overview

Development tools are the foundational compilation utilities required to build software from source code. These packages provide compilers (GCC, Clang, MSVC), build automation utilities (Make, nmake), linkers, and development headers. Having these tools installed is a prerequisite for:

- Compiling open-source software from source
- Installing native Node.js modules (via node-gyp)
- Building Python packages with C extensions
- Developing C/C++ applications
- Working with most software development toolchains

The exact package name and contents vary by platform:

| Platform | Package/Tool Name | Primary Compiler |
|----------|-------------------|------------------|
| macOS | Xcode Command Line Tools | Clang (Apple LLVM) |
| Ubuntu/Debian | build-essential | GCC |
| Raspberry Pi OS | build-essential | GCC (ARM) |
| Amazon Linux/RHEL | "Development Tools" group | GCC |
| Windows | Visual Studio Build Tools | MSVC |
| Git Bash | MSYS2/MinGW or VS Build Tools | GCC or MSVC |

## Dependencies

### macOS

- **Required:**
  - `softwareupdate` - Pre-installed system utility for managing macOS software updates
  - `xcode-select` - Pre-installed utility for managing Xcode developer tools
  - `touch` - Pre-installed Unix utility (part of coreutils)
  - `grep` - Pre-installed text search utility
  - `tail` - Pre-installed text processing utility
  - `sed` - Pre-installed stream editor utility
  - `rm` - Pre-installed file deletion utility
- **Optional:** None
- **Auto-installed:** Xcode Command Line Tools includes clang, clang++, make, git, and other utilities

**Note**: All required dependencies are pre-installed on macOS. No additional packages need to be installed before running this installer.

### Ubuntu (APT)

- **Required:**
  - `sudo` - Pre-installed on Ubuntu for privilege escalation
  - `apt-get` - Pre-installed APT package manager
  - `dpkg` - Pre-installed Debian package manager
- **Optional:** None
- **Auto-installed:** The `build-essential` package automatically installs:
  - `gcc` (GNU C Compiler)
  - `g++` (GNU C++ Compiler)
  - `make` (GNU Make build automation)
  - `libc6-dev` (C library development headers)
  - `dpkg-dev` (Debian package development tools)

**Note**: All required dependencies are pre-installed on Ubuntu. No additional packages need to be installed before running this installer.

### Raspberry Pi OS (APT)

- **Required:**
  - `sudo` - Pre-installed on Raspberry Pi OS for privilege escalation
  - `apt-get` - Pre-installed APT package manager
  - `dpkg` - Pre-installed Debian package manager
- **Optional:** None
- **Auto-installed:** The `build-essential` package automatically installs:
  - `gcc` (GNU C Compiler, ARM-compatible)
  - `g++` (GNU C++ Compiler, ARM-compatible)
  - `make` (GNU Make build automation)
  - `libc6-dev` (C library development headers)
  - `dpkg-dev` (Debian package development tools)

**Note**: All required dependencies are pre-installed on Raspberry Pi OS. Installation may take 5-10 minutes on older Raspberry Pi models due to slower I/O and processing speeds.

### Amazon Linux (DNF/YUM)

- **Required:**
  - `sudo` - Pre-installed on Amazon Linux for privilege escalation
  - `dnf` (Amazon Linux 2023) OR `yum` (Amazon Linux 2) - Pre-installed package manager
- **Optional:** None
- **Auto-installed:** The "Development Tools" group automatically installs:
  - `gcc` (GNU C Compiler)
  - `gcc-c++` (GNU C++ Compiler)
  - `make` (GNU Make build automation)
  - `autoconf` (Configure script generator)
  - `automake` (Makefile generator)
  - `patch` (File patching utility)
  - `rpm-build` (RPM package building tools)

**Note**: All required dependencies are pre-installed on Amazon Linux. The installer automatically detects whether to use `dnf` (AL2023) or `yum` (AL2).

### Windows (Chocolatey)

- **Required:**
  - Chocolatey package manager - Install from https://chocolatey.org/install
  - Administrator privileges - Required to run Chocolatey commands
- **Optional:** None
- **Auto-installed:** The Visual Studio Build Tools packages automatically install:
  - MSVC compiler (`cl.exe`)
  - Microsoft Linker (`link.exe`)
  - Windows SDK headers and libraries
  - `nmake` (Microsoft Program Maintenance Utility)
  - Visual C++ runtime libraries
  - CMake (build system generator)

**Installation requirements:**
- At least 5-8 GB of free disk space
- Installation takes 10-20 minutes
- May require system reboot after installation

**Note**: Chocolatey must be installed before running this installer.

### Git Bash

- **Required:**
  - Git Bash (comes with Git for Windows) - Install from https://git-scm.com/download/win
  - MSYS2 - Install from https://www.msys2.org/
- **Optional:** None
- **Auto-installed:** The MinGW-w64 toolchain includes:
  - `gcc` (MinGW GCC)
  - `g++` (MinGW G++)
  - `make` (GNU Make)

**Note**: Git Bash itself does not include compilers. MSYS2/MinGW provides a GCC-based toolchain that integrates well with Git Bash.

## Prerequisites

Before installing development tools on any platform, ensure:

1. **Administrative privileges** - Root or sudo access on Unix-like systems, Administrator on Windows
2. **Internet connectivity** - Required to download packages and dependencies
3. **Sufficient disk space** - At least 2-5 GB depending on platform (Windows requires the most at 5-8 GB)

## Platform-Specific Installation

### macOS (Xcode Command Line Tools)

#### Prerequisites

- macOS 11 (Big Sur) or later recommended
- Terminal access
- Internet connectivity

On macOS, the Xcode Command Line Tools provide Clang (Apple's LLVM-based C/C++ compiler), Make, and other essential build utilities. This is the standard and official way to get compilation tools on macOS.

#### Installation Steps

Run the following script to install Xcode Command Line Tools non-interactively. This method avoids the GUI dialog that `xcode-select --install` would trigger:

```bash
# Check if already installed
if ! xcode-select -p &> /dev/null; then
    echo "Installing Xcode Command Line Tools..."

    # Create a placeholder file that triggers softwareupdate to list CLI tools
    touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress

    # Find the latest Command Line Tools package
    PROD=$(softwareupdate -l 2>/dev/null | grep -o '.*Command Line Tools.*' | tail -n 1 | sed 's/^[[:space:]]*//' | sed 's/^Label: //')

    # Install the package silently
    softwareupdate -i "$PROD" --verbose

    # Clean up the placeholder file
    rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
else
    echo "Xcode Command Line Tools already installed."
fi
```

**Why this approach**: The standard `xcode-select --install` command opens a GUI dialog that requires user interaction. The script above uses Apple's `softwareupdate` command-line tool to perform a fully non-interactive installation, making it suitable for automation scripts and CI/CD pipelines.

**Note**: The `softwareupdate` command may take 5-15 minutes depending on your internet connection.

#### Verification

Confirm the installation succeeded by checking for the compiler and make utility:

```bash
# Check compiler version
gcc --version

# Check make version
make --version

# Verify installation path
xcode-select -p
```

Expected output (version numbers may vary):

```
Apple clang version 15.0.0 (clang-1500.3.9.4)
Target: arm64-apple-darwin23.3.0
Thread model: posix
InstalledDir: /Library/Developer/CommandLineTools/usr/bin

GNU Make 3.81
Copyright (C) 2006  Free Software Foundation, Inc.
...

/Library/Developer/CommandLineTools
```

#### Troubleshooting

**Problem**: `softwareupdate` does not find Command Line Tools

**Solution**: The placeholder file may not have triggered the listing. Ensure the file exists and retry:

```bash
touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
softwareupdate -l
```

If still not found, download directly from Apple Developer portal: https://developer.apple.com/download/all/?q=command%20line%20tools

**Problem**: Installation hangs or fails with network error

**Solution**: Check your internet connection. Apple's software update servers may be temporarily unavailable. Wait a few minutes and retry.

**Problem**: `xcode-select: error: command line tools are already installed`

**Solution**: The tools are already installed. Use `xcode-select -p` to verify the installation path.

**Problem**: Need to reinstall or reset Command Line Tools

**Solution**: Remove and reinstall:

```bash
sudo rm -rf /Library/Developer/CommandLineTools
# Then run the installation script above
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 or later
- sudo privileges
- APT package manager (pre-installed)

The `build-essential` package is a meta-package that installs GCC, G++, Make, libc development headers, and dpkg-dev.

#### Installation Steps

Run the following commands to update the package index and install build-essential:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential
```

**Why these flags**:
- `DEBIAN_FRONTEND=noninteractive` - Prevents any interactive prompts or dialogs
- `-y` - Automatically answers "yes" to confirmation prompts

#### Verification

Confirm the installation succeeded:

```bash
# Check GCC version
gcc --version

# Check G++ version
g++ --version

# Check Make version
make --version

# List build-essential dependencies
apt-cache depends build-essential
```

Expected output (version numbers may vary):

```
gcc (Ubuntu 13.2.0-23ubuntu4) 13.2.0
Copyright (C) 2023 Free Software Foundation, Inc.
...

g++ (Ubuntu 13.2.0-23ubuntu4) 13.2.0
Copyright (C) 2023 Free Software Foundation, Inc.
...

GNU Make 4.3
Built for x86_64-pc-linux-gnu
...
```

#### Troubleshooting

**Problem**: `E: Unable to locate package build-essential`

**Solution**: Update the package index first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: `E: Could not get lock /var/lib/dpkg/lock`

**Solution**: Another process is using APT. Wait for it to finish or clear stuck processes:

```bash
sudo killall apt apt-get 2>/dev/null
sudo rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/cache/apt/archives/lock
sudo dpkg --configure -a
```

**Problem**: Dependency errors during installation

**Solution**: Fix broken packages and retry:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -f
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential
```

**Problem**: Old GCC version installed

**Solution**: For a newer GCC version, use the Ubuntu Toolchain PPA (Ubuntu only):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:ubuntu-toolchain-r/test
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gcc-13 g++-13
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 3, 4, 5, or Zero 2 W recommended
- sudo privileges
- APT package manager (pre-installed)

Raspberry Pi OS is based on Debian, so the `build-essential` package works identically. The package includes ARM-compatible versions of GCC, G++, and Make.

#### Installation Steps

Run the following commands to update the package index and install build-essential:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential
```

**Note**: Installation may take longer on Raspberry Pi compared to desktop systems due to slower I/O and processor speeds. Allow 5-10 minutes on older Pi models (Pi 3, Zero 2 W).

#### Verification

Confirm the installation succeeded:

```bash
# Check GCC version
gcc --version

# Check G++ version
g++ --version

# Check Make version
make --version

# Verify target architecture
gcc -dumpmachine
```

Expected output for 64-bit Raspberry Pi OS:

```
gcc (Debian 12.2.0-14) 12.2.0
...

g++ (Debian 12.2.0-14) 12.2.0
...

GNU Make 4.3
...

aarch64-linux-gnu
```

For 32-bit Raspberry Pi OS, the architecture output will be `arm-linux-gnueabihf`.

#### Troubleshooting

**Problem**: Installation is extremely slow

**Solution**: Raspberry Pi SD cards have limited I/O speed. Ensure you are using a Class 10 or UHS-I SD card. Consider using a USB 3.0 SSD on Pi 4/5 for better performance.

**Problem**: Out of disk space during installation

**Solution**: Check available space and clean up:

```bash
df -h
sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y
sudo DEBIAN_FRONTEND=noninteractive apt-get clean
```

**Problem**: `apt-get update` fails with hash sum mismatch

**Solution**: Clear the APT cache and retry:

```bash
sudo rm -rf /var/lib/apt/lists/*
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Need cross-compilation toolchain

**Solution**: For cross-compiling from 64-bit to 32-bit:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gcc-arm-linux-gnueabihf g++-arm-linux-gnueabihf
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), or RHEL 8+
- sudo privileges
- DNF (AL2023, RHEL 8+) or YUM (AL2) package manager

Amazon Linux and RHEL use the "Development Tools" package group, which includes GCC, G++, Make, autoconf, automake, and related build utilities.

#### Installation Steps

**For Amazon Linux 2023 or RHEL 8+:**

```bash
sudo dnf groupinstall -y "Development Tools"
```

**For Amazon Linux 2 or RHEL 7:**

```bash
sudo yum groupinstall -y "Development Tools"
```

**Why the `-y` flag**: The `-y` flag automatically confirms the installation, making the command non-interactive and suitable for automation.

**Note**: In Docker containers running AL2023, you may see a warning about the `grub2-common` package during installation. This warning can be safely ignored as the development tools are still installed correctly.

#### Verification

Confirm the installation succeeded:

```bash
# Check GCC version
gcc --version

# Check G++ version
g++ --version

# Check Make version
make --version

# List installed packages in the group (AL2023)
dnf group info "Development Tools"

# List installed packages in the group (AL2)
yum group info "Development Tools"
```

Expected output (version numbers may vary):

```
gcc (GCC) 11.4.1 20231218 (Red Hat 11.4.1-3)
...

g++ (GCC) 11.4.1 20231218 (Red Hat 11.4.1-3)
...

GNU Make 4.3
...
```

#### Troubleshooting

**Problem**: `No match for group: Development Tools`

**Solution**: Ensure the group name is exact (case-sensitive with quotes):

```bash
# List available groups
sudo dnf group list
```

**Problem**: Individual packages are outdated

**Solution**: Update packages after group install:

```bash
# AL2023
sudo dnf upgrade -y gcc gcc-c++ make

# AL2
sudo yum update -y gcc gcc-c++ make
```

**Problem**: Need a newer GCC version on AL2023

**Solution**: AL2023 provides multiple GCC versions:

```bash
sudo dnf install -y gcc13 gcc13-c++
```

**Problem**: Docker container shows grub2-common error

**Solution**: This is a known issue in AL2023 Docker images. The error only affects bootloader configuration, which is not relevant in containers. The development tools are still installed correctly.

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed
- At least 5 GB free disk space

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

On Windows, development tools are provided by Visual Studio Build Tools with the Visual C++ workload. This includes the MSVC compiler, linker, libraries, and Windows SDK.

#### Installation Steps

Run the following commands in an Administrator PowerShell or Command Prompt:

```powershell
choco install visualstudio2022buildtools -y
choco install visualstudio2022-workload-vctools -y --package-parameters "--includeRecommended"
```

**What these commands do**:
1. The first command installs the base Visual Studio 2022 Build Tools framework
2. The second command adds the C++ build tools workload with all recommended components (MSVC compiler, Windows SDK, CMake, etc.)

**Note**: Installation typically takes 10-20 minutes and requires approximately 5-8 GB of disk space. A system reboot may be required after installation.

#### Verification

Open a new **Developer Command Prompt for VS 2022** (search for it in the Start menu) or **Developer PowerShell for VS 2022**, then run:

```cmd
:: Check MSVC compiler
cl

:: Check linker
link

:: Check nmake
nmake
```

Expected output for `cl`:

```
Microsoft (R) C/C++ Optimizing Compiler Version 19.38.33135 for x64
Copyright (C) Microsoft Corporation.  All rights reserved.

usage: cl [ option... ] filename... [ /link linkoption... ]
```

**Important**: You must use the Developer Command Prompt or Developer PowerShell, not a regular terminal. These specialized prompts set up the necessary environment variables for MSVC tools.

#### Troubleshooting

**Problem**: `cl` is not recognized as a command

**Solution**: You must use the Developer Command Prompt or Developer PowerShell. Alternatively, run the vcvars batch file to set up the environment:

```cmd
"C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
```

**Problem**: Installation hangs or appears stuck

**Solution**: Visual Studio installations can take a long time. Check Task Manager for `vs_installer.exe` or `setup.exe` processes. If truly stuck, cancel and retry:

```powershell
choco uninstall visualstudio2022buildtools -y
choco install visualstudio2022buildtools -y
```

**Problem**: Not enough disk space

**Solution**: Free up at least 8 GB on your system drive. The Build Tools install to `C:\Program Files\Microsoft Visual Studio\2022\BuildTools` by default.

**Problem**: Need to add additional workloads or components

**Solution**: Install additional workload packages:

```powershell
# Add Windows 10 SDK
choco install windows-sdk-10.0 -y
```

**Problem**: Chocolatey command not found

**Solution**: Close all terminal windows, open a new Administrator PowerShell, and verify Chocolatey is installed:

```powershell
choco --version
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- Windows Subsystem for Linux with Ubuntu installed
- WSL 2 recommended for best performance
- sudo privileges within WSL

WSL Ubuntu installations follow the same process as native Ubuntu, using APT.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential
```

#### Verification

Confirm the installation succeeded:

```bash
# Check GCC version
gcc --version

# Check G++ version
g++ --version

# Check Make version
make --version
```

Expected output (version numbers may vary):

```
gcc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0
...

g++ (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0
...

GNU Make 4.3
...
```

#### Troubleshooting

**Problem**: `sudo: unable to resolve host` warnings

**Solution**: Add your hostname to `/etc/hosts`:

```bash
echo "127.0.0.1 $(hostname)" | sudo tee -a /etc/hosts
```

**Problem**: Extremely slow `apt-get update`

**Solution**: WSL 1 has slower file system performance. Upgrade to WSL 2:

```powershell
# In Windows PowerShell (Administrator)
wsl --set-version Ubuntu 2
```

**Problem**: Cannot install packages, permission denied

**Solution**: Ensure you are using `sudo` and your user is in the sudo group:

```bash
groups
# Should include: sudo
```

**Problem**: Compilation works but cannot execute binaries

**Solution**: Ensure you are compiling in the WSL file system, not in `/mnt/c/`. Linux binaries should be compiled within the Linux environment:

```bash
cd ~
mkdir -p projects
cd projects
# Compile here, not in /mnt/c/Users/...
```

---

### Git Bash (MSYS2/MinGW)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Administrator access for MSYS2 installation

**Important**: Git Bash is a terminal emulator that provides a Unix-like command-line experience on Windows. It does not include its own compiler. To get GCC and Make that work seamlessly with Git Bash, install the full MSYS2 environment with the MinGW-w64 toolchain.

#### Installation Steps

**Step 1**: Download and install MSYS2. Run this in an Administrator Command Prompt:

```cmd
:: Download MSYS2 installer
curl -L -o %TEMP%\msys2-x86_64-latest.exe https://github.com/msys2/msys2-installer/releases/download/nightly-x86_64/msys2-x86_64-latest.exe

:: Install silently to default location
%TEMP%\msys2-x86_64-latest.exe install --root C:\msys64 --confirm-command
```

**Step 2**: Open "MSYS2 MINGW64" from the Start menu and install the toolchain:

```bash
# Update MSYS2 packages (terminal may close - reopen and run again)
pacman -Syu --noconfirm

# Install MinGW-w64 GCC toolchain
pacman -S --noconfirm --needed mingw-w64-x86_64-toolchain
```

**Why `--noconfirm`**: This flag prevents pacman from prompting for confirmation, making the command non-interactive.

**Step 3**: Add MSYS2 MinGW64 to your Git Bash PATH. Run this in Git Bash:

```bash
echo 'export PATH="/c/msys64/mingw64/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Open Git Bash and confirm the installation:

```bash
# Check GCC version
gcc --version

# Check G++ version
g++ --version

# Check Make version
make --version
```

Expected output (version numbers may vary):

```
gcc.exe (Rev3, Built by MSYS2 project) 14.2.0
...

g++.exe (Rev3, Built by MSYS2 project) 14.2.0
...

GNU Make 4.4.1
...
```

#### Troubleshooting

**Problem**: `gcc: command not found` in Git Bash

**Solution**: Ensure MSYS2 MinGW64 bin directory is in PATH:

```bash
export PATH="/c/msys64/mingw64/bin:$PATH"
```

Add this line to `~/.bashrc` for persistence.

**Problem**: `pacman: command not found`

**Solution**: The `pacman` command only works in the MSYS2 terminal, not Git Bash. Open "MSYS2 MINGW64" from the Start menu to run pacman commands.

**Problem**: Compiled executables do not run or show DLL errors

**Solution**: Programs compiled with MinGW may require MinGW DLLs. Either:

1. Distribute the required DLLs with your executable
2. Use static linking: `gcc -static program.c -o program.exe`

**Problem**: Need Visual Studio Build Tools instead of MinGW

**Solution**: If you prefer MSVC, install Visual Studio Build Tools (see Windows section) and access MSVC from Git Bash by adding this function to `~/.bashrc`:

```bash
# Load Visual Studio environment in Git Bash
vs_env() {
    eval "$(cmd //c 'C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat' \&\& bash -c 'env')"
}
```

Then run `vs_env` when you need MSVC tools.

**Problem**: Conflicts between MinGW and MSVC

**Solution**: Do not mix MinGW-compiled and MSVC-compiled object files or libraries. Choose one toolchain per project.

---

## Post-Installation Configuration

### Setting Default Compiler (Linux/macOS)

If you have multiple compiler versions installed, set the default:

```bash
# Ubuntu/Debian - use update-alternatives
sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-13 100
sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-13 100

# Select the default version
sudo update-alternatives --config gcc
sudo update-alternatives --config g++
```

### Verifying Compiler Functionality

Test that the compiler works correctly with a simple program:

```bash
# Create test file
echo 'int main() { return 0; }' > /tmp/test.c

# Compile
gcc /tmp/test.c -o /tmp/test

# Run and verify
/tmp/test && echo "Compiler works correctly"

# Clean up
rm -f /tmp/test.c /tmp/test
```

On Windows (from Developer Command Prompt):

```cmd
:: Create test file
echo int main() { return 0; } > %TEMP%\test.c

:: Compile
cl %TEMP%\test.c /Fe:%TEMP%\test.exe

:: Run and verify
%TEMP%\test.exe && echo Compiler works correctly

:: Clean up
del %TEMP%\test.c %TEMP%\test.exe %TEMP%\test.obj
```

---

## Common Issues

### Issue: Native Node.js Modules Fail to Compile

**Symptoms**: `npm install` fails with `node-gyp` errors, missing compiler or make.

**Solution**: Ensure development tools are installed. For Node.js native modules, you also need Python:

```bash
# Ubuntu/Debian/Raspberry Pi/WSL
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential python3

# macOS (verify Xcode CLT installed)
xcode-select -p || (touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress && softwareupdate -i "$(softwareupdate -l | grep -o '.*Command Line Tools.*' | tail -n 1 | sed 's/^[[:space:]]*//' | sed 's/^Label: //')" --verbose)

# Amazon Linux
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3
```

### Issue: Python Packages with C Extensions Fail to Install

**Symptoms**: `pip install` fails with "error: command 'gcc' failed" or similar.

**Solution**: Install development tools and Python development headers:

```bash
# Ubuntu/Debian/Raspberry Pi/WSL
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential python3-dev

# Amazon Linux
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3-devel
```

### Issue: Linker Cannot Find Standard Libraries

**Symptoms**: `ld: cannot find -lc` or similar linker errors.

**Solution**: Install libc development headers:

```bash
# Ubuntu/Debian/Raspberry Pi/WSL
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libc6-dev

# Amazon Linux
sudo dnf install -y glibc-devel
```

### Issue: Header Files Not Found

**Symptoms**: Compilation fails with "fatal error: stdio.h: No such file or directory" or similar.

**Solution**: Install or reinstall development headers:

```bash
# Ubuntu/Debian/Raspberry Pi/WSL
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --reinstall libc6-dev linux-libc-dev

# Amazon Linux
sudo dnf reinstall -y glibc-devel kernel-headers

# macOS
sudo rm -rf /Library/Developer/CommandLineTools
touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
softwareupdate -i "$(softwareupdate -l | grep -o '.*Command Line Tools.*' | tail -n 1 | sed 's/^[[:space:]]*//' | sed 's/^Label: //')" --verbose
```

### Issue: 32-bit vs 64-bit Compilation Issues

**Symptoms**: Linker errors about architecture mismatch.

**Solution**: Install multilib support or specify the correct architecture:

```bash
# Ubuntu/Debian - install 32-bit libraries
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gcc-multilib g++-multilib

# Compile as 32-bit
gcc -m32 program.c -o program

# Compile as 64-bit (default on 64-bit systems)
gcc -m64 program.c -o program
```

---

## References

- [Apple Xcode Command Line Tools](https://developer.apple.com/xcode/resources/)
- [Ubuntu build-essential Package](https://packages.ubuntu.com/build-essential)
- [Debian build-essential Package](https://packages.debian.org/build-essential)
- [Raspberry Pi Documentation](https://www.raspberrypi.com/documentation/computers/os.html)
- [Amazon Linux 2023 Package Management](https://docs.aws.amazon.com/linux/al2023/ug/package-management.html)
- [Amazon Linux 2 Software Compilation Guide](https://docs.aws.amazon.com/linux/al2/ug/compile-software.html)
- [Visual Studio Build Tools Chocolatey Package](https://community.chocolatey.org/packages/visualstudio2022buildtools)
- [Visual C++ Build Tools Workload Chocolatey Package](https://community.chocolatey.org/packages/visualstudio2022-workload-vctools)
- [MSYS2 Official Website](https://www.msys2.org/)
- [GCC Documentation](https://gcc.gnu.org/onlinedocs/)
- [GNU Make Manual](https://www.gnu.org/software/make/manual/)
- [Microsoft C++ Documentation](https://docs.microsoft.com/en-us/cpp/)
