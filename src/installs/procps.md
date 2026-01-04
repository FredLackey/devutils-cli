# Installing procps

## Dependencies

### macOS (Homebrew)
- **Required:** None
- **Optional:** None
- **Auto-installed:** None
- **Note:** procps is a Linux-specific package that relies on the `/proc` filesystem which does not exist on macOS. macOS provides equivalent functionality through built-in commands (`ps`, `top`, `vm_stat`) and Activity Monitor. See the macOS section below for details on native alternatives.

### Ubuntu (APT/Snap)
- **Required:** None (APT is built into Ubuntu/Debian)
- **Optional:** None
- **Auto-installed:** `libncursesw6`, `libproc2-0` (or `libprocps8` on older versions), `libtinfo6` (installed automatically by APT as procps dependencies)

### Raspberry Pi OS (APT/Snap)
- **Required:** None (APT is built into Raspberry Pi OS)
- **Optional:** None
- **Auto-installed:** `libncursesw6`, `libproc2-0` (or `libprocps8` on older versions), `libtinfo6` (installed automatically by APT as procps dependencies)

### Amazon Linux (DNF/YUM)
- **Required:** None (DNF/YUM is built into Amazon Linux)
- **Optional:** None
- **Auto-installed:** `ncurses-libs` (installed automatically by DNF/YUM as procps-ng dependencies)
- **Note:** On RHEL-based systems (including Amazon Linux), the package is named `procps-ng` rather than `procps`

### Windows (Chocolatey/winget)
- **Required:** None
- **Optional:** None
- **Auto-installed:** None
- **Note:** procps is a Linux-specific package. Windows provides equivalent functionality through built-in PowerShell cmdlets (`Get-Process`, `Get-Counter`) and Task Manager. For command-line alternatives, see the Windows section below which covers Sysinternals PsTools.

### Git Bash (Manual/Portable)
- **Required:** None
- **Optional:** None
- **Auto-installed:** None
- **Note:** procps is a Linux-specific package. Git Bash on Windows does not support procps. Use Windows native tools or WSL for Linux-compatible process utilities.

## Overview

procps (or procps-ng, the "next generation" fork) is a collection of command-line utilities for monitoring system processes and resources on Linux systems. These utilities read information from the `/proc` pseudo-filesystem, which the Linux kernel dynamically generates to expose process and system information.

The procps package is essential for system administration and includes these core utilities:

| Utility | Description |
|---------|-------------|
| `ps` | Display a snapshot of current processes |
| `top` | Interactive real-time process viewer |
| `free` | Display memory usage (total, used, free, shared, buffers, cache) |
| `vmstat` | Report virtual memory statistics |
| `pgrep` | Find processes by name or attributes |
| `pkill` | Send signals to processes by name or attributes |
| `pmap` | Display memory map of a process |
| `pwdx` | Print working directory of a process |
| `slabtop` | Display kernel slab cache information in real time |
| `sysctl` | Read and modify kernel parameters at runtime |
| `tload` | Graphical representation of system load average |
| `uptime` | Show how long the system has been running |
| `w` | Show who is logged in and what they are doing |
| `watch` | Execute a command periodically and display output |
| `pidof` | Find the process ID of a running program |
| `kill` | Send signals to processes by PID |
| `skill` | Send signals to processes by name (obsolete, use `pkill`) |
| `snice` | Adjust process priority by name (obsolete, use `pkill`) |

**Important**: procps is Linux-specific and requires the `/proc` filesystem. It is not available on macOS or Windows. These platforms have their own native process monitoring tools, documented in their respective sections below.

## Prerequisites

Before installing procps on Linux platforms, ensure:

1. **Internet connectivity** - Required to download packages from repositories
2. **Administrative privileges** - Required for system-wide installation via `sudo`
3. **Linux operating system** - procps only works on Linux; it will not function on macOS, Windows, or BSD systems

**Note**: procps is typically pre-installed on most Linux distributions as it contains essential system utilities. The installation steps below ensure procps is installed or update it to the latest version.

## Platform-Specific Installation

### macOS (Homebrew)

#### Platform Compatibility Notice

procps is **not available on macOS**. The procps utilities are designed specifically for Linux and rely on the `/proc` filesystem, which does not exist on macOS. macOS uses a different kernel architecture (XNU/Darwin) that exposes process information through different mechanisms.

#### Native Alternatives

macOS provides equivalent functionality through built-in commands. No installation is required:

| procps Utility | macOS Equivalent | Description |
|----------------|------------------|-------------|
| `ps` | `ps` | Process status (BSD variant, slightly different options) |
| `top` | `top` | Interactive process viewer (press `q` to quit) |
| `free` | `vm_stat` | Virtual memory statistics (different output format) |
| `vmstat` | `vm_stat` | Virtual memory statistics |
| `pgrep` | `pgrep` | Find processes by name |
| `pkill` | `pkill` | Kill processes by name |
| `uptime` | `uptime` | System uptime |
| `w` | `w` | Who is logged in |
| `watch` | Install via `brew install --quiet watch` | Periodic command execution |
| `kill` | `kill` | Send signals to processes |

#### Installation Steps (watch utility only)

The only procps utility not natively available on macOS is `watch`. Install it via Homebrew:

```bash
brew install --quiet watch
```

The `--quiet` flag suppresses non-essential output for automation compatibility.

#### Verification

Verify native macOS utilities are available:

```bash
ps --version 2>&1 | head -1 || ps aux | head -1
```

Check the `watch` utility if installed:

```bash
watch --version
```

Expected output (version numbers may vary):

```
watch from procps-ng 4.0.4
```

#### Alternative: Activity Monitor

For graphical process monitoring, use Activity Monitor:

```bash
open -a "Activity Monitor"
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 LTS or later, or Debian 10 (Buster) or later
- sudo privileges
- Internet connectivity

procps is typically pre-installed on Ubuntu and Debian systems. The steps below ensure it is installed or update it to the latest version.

#### Installation Steps

Run the following command to install procps:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y procps
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded by checking multiple utilities:

```bash
ps --version
```

Expected output (version numbers may vary):

```
ps from procps-ng 4.0.4
```

Verify other key utilities:

```bash
free --version
```

Expected output:

```
free from procps-ng 4.0.4
```

Test the utilities work correctly:

```bash
# Show process list
ps aux | head -5

# Show memory usage
free -h

# Show system uptime
uptime
```

#### Troubleshooting

**Problem**: `E: Unable to locate package procps`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: `ps: command not found` after installation

**Solution**: The PATH may not include `/usr/bin`. Verify the installation location:

```bash
which ps
dpkg -L procps | grep bin
```

**Problem**: Old version of procps

**Solution**: Ubuntu and Debian repositories maintain stable versions. The installed version depends on your distribution release. To check your version:

```bash
apt-cache policy procps
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit) - Bookworm or Bullseye
- Raspberry Pi 2 or later
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so procps installation follows the same process as Ubuntu/Debian. procps is typically pre-installed on Raspberry Pi OS.

#### Installation Steps

Run the following command to install procps:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y procps
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
ps --version
```

Expected output for ARM (version numbers may vary):

```
ps from procps-ng 4.0.4
```

Verify your architecture:

```bash
uname -m
```

Expected output: `aarch64` (64-bit) or `armv7l` (32-bit).

Test key utilities work correctly:

```bash
# Show memory usage (useful for monitoring Pi resources)
free -h

# Show top processes by CPU
top -bn1 | head -15

# Show system load
uptime
```

#### Troubleshooting

**Problem**: `top` shows incorrect CPU count on multi-core Pi

**Solution**: This is expected behavior. Verify CPU count with:

```bash
nproc
```

**Problem**: `free` shows very little available memory

**Solution**: On Raspberry Pi with limited RAM, this is normal. The kernel uses available memory for caching. Check the "available" column for actual usable memory:

```bash
free -h
```

**Problem**: Installation fails with disk space errors

**Solution**: Check available disk space and clean up if needed:

```bash
df -h
sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y
sudo DEBIAN_FRONTEND=noninteractive apt-get clean
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- Internet connectivity

**Important**: On RHEL-based systems including Amazon Linux, the package is named `procps-ng` (next generation) rather than `procps`. Amazon Linux 2023 uses `dnf` as the package manager, while Amazon Linux 2 uses `yum`. AWS creates a symlink so `yum` commands also work on AL2023.

procps-ng is typically pre-installed on Amazon Linux.

#### Installation Steps

**For Amazon Linux 2023:**

Run the following command to install procps-ng:

```bash
sudo dnf install -y procps-ng
```

**For Amazon Linux 2:**

Run the following command to install procps-ng:

```bash
sudo yum install -y procps-ng
```

The `-y` flag automatically confirms installation prompts, enabling non-interactive execution.

#### Verification

Confirm the installation succeeded:

```bash
ps --version
```

Expected output (version numbers may vary):

```
ps from procps-ng 3.3.17
```

Verify other utilities:

```bash
free --version
vmstat --version
```

Check which package provides the utilities:

```bash
rpm -qf /usr/bin/ps
```

Expected output: `procps-ng-<version>`

Test the utilities work correctly:

```bash
# Show memory in human-readable format
free -h

# Show virtual memory statistics
vmstat 1 3

# Show system uptime and load average
uptime
```

#### Troubleshooting

**Problem**: `No match for argument: procps`

**Solution**: On Amazon Linux, the package is named `procps-ng`, not `procps`:

```bash
sudo dnf install -y procps-ng
```

**Problem**: `dnf: command not found` on Amazon Linux 2

**Solution**: Use `yum` instead of `dnf` on Amazon Linux 2:

```bash
sudo yum install -y procps-ng
```

**Problem**: Utilities are available but `--version` flag not recognized

**Solution**: Some older versions may not support `--version`. Test functionality directly:

```bash
ps aux | head -5
free -m
```

---

### Windows (Chocolatey/winget)

#### Platform Compatibility Notice

procps is **not available on Windows**. The procps utilities are designed specifically for Linux and require the `/proc` filesystem, which does not exist on Windows. Windows uses a completely different process and memory management architecture.

#### Native Alternatives

Windows provides equivalent functionality through built-in tools and Microsoft Sysinternals utilities:

| procps Utility | Windows Equivalent | Description |
|----------------|-------------------|-------------|
| `ps` | `Get-Process` (PowerShell) or `tasklist` (CMD) | List running processes |
| `top` | Task Manager or `Get-Process \| Sort-Object CPU -Descending` | Interactive process viewer |
| `free` | `systeminfo` or `Get-CimInstance Win32_OperatingSystem` | Memory information |
| `vmstat` | `typeperf` or Performance Monitor | System statistics |
| `pgrep` | `Get-Process -Name <name>` | Find processes by name |
| `pkill` | `Stop-Process -Name <name>` | Kill processes by name |
| `uptime` | `systeminfo \| findstr "Boot Time"` or `(Get-CimInstance Win32_OperatingSystem).LastBootUpTime` | System uptime |
| `kill` | `taskkill /PID <pid>` or `Stop-Process -Id <pid>` | Kill process by PID |

#### Installation Steps (Sysinternals PsTools)

For command-line utilities similar to procps, install Microsoft Sysinternals PsTools:

```powershell
choco install pstools -y
```

The `-y` flag automatically confirms all prompts for non-interactive installation.

PsTools includes:

| Utility | Description |
|---------|-------------|
| `PsList` | List detailed process information (similar to `ps`) |
| `PsKill` | Kill processes by name or PID |
| `PsInfo` | List system information |
| `PsService` | View and control services |
| `PsExec` | Execute processes remotely |

#### Verification

Verify PsTools installation:

```powershell
pslist -?
```

Test native Windows process commands in PowerShell:

```powershell
# List all processes (similar to ps aux)
Get-Process | Select-Object -First 10

# Show memory information (similar to free)
Get-CimInstance Win32_OperatingSystem | Select-Object TotalVisibleMemorySize, FreePhysicalMemory

# Show system uptime
(Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
```

Test native Windows process commands in Command Prompt:

```cmd
:: List all processes
tasklist

:: Show system information including memory
systeminfo | findstr /C:"Total Physical Memory" /C:"Available Physical Memory"
```

#### Troubleshooting

**Problem**: `choco` command not found

**Solution**: Install Chocolatey first. Run in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**Problem**: PsTools commands not found after installation

**Solution**: Open a new Command Prompt or PowerShell window for PATH updates to take effect.

**Problem**: Need full Linux procps compatibility

**Solution**: Use WSL (Windows Subsystem for Linux) to run actual procps utilities. See the WSL section below.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- Windows Subsystem for Linux (WSL) with Ubuntu installed
- WSL 2 recommended for best performance
- sudo privileges within WSL

WSL provides a full Linux environment where procps works exactly as it does on native Linux, including access to the `/proc` filesystem.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y procps
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
ps --version
```

Expected output (version numbers may vary):

```
ps from procps-ng 4.0.4
```

Verify the `/proc` filesystem is available (it should be in WSL 2):

```bash
ls /proc | head -10
```

Test key utilities:

```bash
# Show memory usage
free -h

# Show process list
ps aux | head -5

# Show virtual memory statistics
vmstat 1 3

# Show system uptime
uptime
```

#### Troubleshooting

**Problem**: `E: Unable to locate package procps`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: WSL itself is not installed

**Solution**: Install WSL from an Administrator PowerShell on Windows:

```powershell
wsl --install
```

Restart your computer after installation.

**Problem**: `/proc` filesystem shows limited information

**Solution**: WSL 2 provides better `/proc` compatibility than WSL 1. Check your WSL version:

```bash
# From WSL
cat /proc/version
```

Upgrade to WSL 2 if needed (from Windows PowerShell):

```powershell
wsl --set-version Ubuntu 2
```

**Problem**: `top` shows incorrect CPU/memory for Windows host

**Solution**: In WSL, procps utilities show information about the WSL virtual machine, not the Windows host. This is expected behavior. For Windows host information, use native Windows tools.

---

### Git Bash (Manual/Portable)

#### Platform Compatibility Notice

procps is **not available for Git Bash**. Git Bash provides a minimal Unix-like environment on Windows but does not include a `/proc` filesystem or Linux process management capabilities. procps utilities cannot function without `/proc`.

#### Native Alternatives

Git Bash can access Windows native commands. Use these alternatives:

| procps Utility | Git Bash Workaround | Notes |
|----------------|---------------------|-------|
| `ps` | `ps` (limited) or `tasklist.exe` | Git Bash includes a basic `ps` that shows bash processes |
| `top` | `tasklist.exe /V` | No interactive equivalent; use Task Manager |
| `free` | `systeminfo.exe \| grep Memory` | Different output format |
| `kill` | `kill` or `taskkill.exe` | Git Bash `kill` works for bash processes |
| `uptime` | No equivalent | Use `systeminfo.exe \| grep "Boot Time"` |

#### Installation Steps

No installation is possible. For full procps functionality on Windows, use one of these alternatives:

**Option 1: Use WSL (Recommended)**

WSL provides full Linux compatibility including procps. See the WSL section above.

**Option 2: Use Windows native tools**

Access Windows commands directly from Git Bash:

```bash
# List processes
tasklist.exe

# Kill a process by name
taskkill.exe /IM notepad.exe /F

# Show system information
systeminfo.exe
```

**Option 3: Install Sysinternals PsTools on Windows**

Install PsTools via Chocolatey (see Windows section), then access from Git Bash:

```bash
pslist.exe
```

#### Verification

Verify the limited `ps` available in Git Bash:

```bash
ps
```

This shows only processes running within the Git Bash session.

For Windows process information, use:

```bash
tasklist.exe | head -10
```

#### Troubleshooting

**Problem**: `ps aux` returns empty or limited output

**Solution**: This is expected. Git Bash's `ps` only shows processes in the current bash session. Use `tasklist.exe` for all Windows processes.

**Problem**: Need full Linux process utilities

**Solution**: Use WSL instead of Git Bash. WSL provides a complete Linux environment with full procps support.

---

## Post-Installation Configuration

procps utilities work out of the box with sensible defaults. The following optional configurations may be useful:

### Customize top Display

Create a configuration file for `top` to remember your preferred settings:

```bash
# Run top, configure as desired (press 'W' to write config)
top
# Press 'z' for color
# Press 'c' for full command line
# Press '1' to show individual CPUs
# Press 'Shift+W' to save configuration
```

The configuration is saved to `~/.config/procps/toprc` or `~/.toprc`.

### Create Aliases for Common Commands

Add useful aliases to your shell configuration (`~/.bashrc` or `~/.zshrc`):

```bash
# Memory usage in human-readable format
alias mem='free -h'

# Show top 10 processes by CPU usage
alias topcpu='ps aux --sort=-%cpu | head -11'

# Show top 10 processes by memory usage
alias topmem='ps aux --sort=-%mem | head -11'

# Quick system overview
alias sysinfo='echo "=== Uptime ===" && uptime && echo "=== Memory ===" && free -h && echo "=== Load ===" && vmstat 1 1'
```

Reload your shell configuration:

```bash
source ~/.bashrc
```

### Configure sysctl Parameters (Advanced)

The `sysctl` utility (part of procps) can configure kernel parameters. Common configurations:

```bash
# View all current settings
sysctl -a 2>/dev/null | head -20

# View a specific setting
sysctl vm.swappiness

# Temporarily change a setting (until reboot)
sudo sysctl -w vm.swappiness=10
```

For permanent changes, create a file in `/etc/sysctl.d/`:

```bash
# Example: reduce swappiness
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-custom.conf
sudo sysctl --system
```

---

## Common Issues

### Issue: "ps: command not found"

**Symptoms**: Running `ps` returns "command not found" even on Linux.

**Solution**: procps may not be installed (rare on standard installations). Install it:

```bash
# Ubuntu/Debian/Raspberry Pi OS/WSL
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y procps

# Amazon Linux
sudo dnf install -y procps-ng
```

### Issue: "free" Shows Different Values Than Expected

**Symptoms**: The `free` command shows low "free" memory even with no applications running.

**Explanation**: This is normal Linux behavior. Linux uses available memory for disk caching to improve performance. Look at the "available" column (not "free") to see memory actually available for applications:

```bash
free -h
```

The "available" column shows memory that can be allocated to applications (including reclaimable cache).

### Issue: "top" Consumes High CPU

**Symptoms**: The `top` command itself uses significant CPU.

**Solution**: Increase the update interval to reduce CPU usage:

```bash
# Update every 5 seconds instead of default 3
top -d 5
```

Or set a permanent default in `~/.toprc`.

### Issue: "vmstat" Shows Zeros for All Values

**Symptoms**: Running `vmstat` shows all zeros.

**Solution**: Run `vmstat` with an interval to see live statistics:

```bash
# Show statistics every 1 second, 5 times
vmstat 1 5
```

The first line shows averages since boot; subsequent lines show current activity.

### Issue: "pgrep" or "pkill" Not Matching Processes

**Symptoms**: `pgrep processname` returns nothing even though the process is running.

**Solution**: pgrep matches against the process name (the executable name), not the full command line. To match against the full command line, use `-f`:

```bash
# Match executable name only
pgrep nginx

# Match full command line
pgrep -f "nginx -c /etc/nginx/nginx.conf"
```

### Issue: Permission Denied Reading /proc Files

**Symptoms**: Some utilities show "Permission denied" or incomplete information.

**Solution**: Certain `/proc` entries require root privileges. Run with `sudo`:

```bash
sudo slabtop
sudo vmstat -m
```

---

## References

- [procps-ng Official GitLab Repository](https://gitlab.com/procps-ng/procps)
- [procps-ng Releases](https://gitlab.com/procps-ng/procps/-/releases)
- [Ubuntu procps Package](https://packages.ubuntu.com/search?keywords=procps)
- [Debian procps Package](https://packages.debian.org/sid/procps)
- [Fedora procps-ng Package](https://packages.fedoraproject.org/pkgs/procps-ng/procps-ng/)
- [Red Hat procps Documentation](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/6/html/6.6_technical_notes/procps)
- [Linux /proc Filesystem Documentation](https://www.kernel.org/doc/html/latest/filesystems/proc.html)
- [ps(1) Manual Page](https://man7.org/linux/man-pages/man1/ps.1.html)
- [top(1) Manual Page](https://man7.org/linux/man-pages/man1/top.1.html)
- [free(1) Manual Page](https://man7.org/linux/man-pages/man1/free.1.html)
- [vmstat(8) Manual Page](https://man7.org/linux/man-pages/man8/vmstat.8.html)
- [Microsoft Sysinternals PsTools](https://learn.microsoft.com/en-us/sysinternals/downloads/pstools)
- [Microsoft Process Explorer](https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer)
- [Homebrew watch Formula](https://formulae.brew.sh/formula/watch)
