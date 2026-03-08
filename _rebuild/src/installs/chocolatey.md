# Installing Chocolatey

## Overview

Chocolatey is a machine-level package manager for Windows that automates the software installation, configuration, upgrade, and uninstallation process. It uses NuGet infrastructure and PowerShell to wrap installers, executables, zips, and scripts into compiled packages. Chocolatey provides a unified interface for managing software across Windows systems, similar to how APT works on Debian/Ubuntu or Homebrew works on macOS.

Key features of Chocolatey:

- **Simple installation**: Install software with a single command (`choco install <package>`)
- **Silent installations**: All packages install non-interactively by default with the `-y` flag
- **Dependency management**: Automatically handles package dependencies
- **Enterprise ready**: Integrates with SCCM, Puppet, Chef, Ansible, and other configuration management tools
- **Large package repository**: Access to thousands of community-maintained packages at chocolatey.org

**Platform Support Summary**:

| Platform | Support Level | Notes |
|----------|---------------|-------|
| Windows 7+ / Server 2003+ | Full | Primary and only supported platform |
| macOS | Not Supported | Windows-only tool; use Homebrew instead |
| Ubuntu/Debian | Not Supported | Windows-only tool; use APT instead |
| Raspberry Pi OS | Not Supported | Windows-only tool; use APT instead |
| Amazon Linux | Not Supported | Windows-only tool; use DNF/YUM instead |
| WSL (Ubuntu) | Not Supported | Use APT within WSL; Chocolatey runs on Windows host |
| Git Bash | Partial | Can invoke Chocolatey from Git Bash terminal on Windows |

## Dependencies

### macOS (Homebrew)
- **Required:** Not applicable - Chocolatey is a Windows-only package manager
- **Optional:** None
- **Auto-installed:** None
- **Note:** Chocolatey does not run on macOS. Use Homebrew (`brew`) as the package manager for macOS.

### Ubuntu (APT/Snap)
- **Required:** Not applicable - Chocolatey is a Windows-only package manager
- **Optional:** None
- **Auto-installed:** None
- **Note:** Chocolatey does not run on Linux. Use APT (`apt-get`) or Snap as the package manager for Ubuntu/Debian.

### Raspberry Pi OS (APT/Snap)
- **Required:** Not applicable - Chocolatey is a Windows-only package manager
- **Optional:** None
- **Auto-installed:** None
- **Note:** Chocolatey does not run on Linux. Use APT (`apt-get`) as the package manager for Raspberry Pi OS.

### Amazon Linux (DNF/YUM)
- **Required:** Not applicable - Chocolatey is a Windows-only package manager
- **Optional:** None
- **Auto-installed:** None
- **Note:** Chocolatey does not run on Linux. Use DNF (Amazon Linux 2023) or YUM (Amazon Linux 2) as the package manager.

### Windows (Chocolatey/winget)
- **Required:**
  - Windows 7 SP1 / Windows Server 2003 or later
  - PowerShell v2 or later (v3+ required for TLS 1.2 support)
  - .NET Framework 4.8 (installer attempts automatic installation if missing)
  - Administrator privileges for installation
- **Optional:** None
- **Auto-installed:**
  - .NET Framework 4.8 (if not present, installer attempts to install it)

### Git Bash (Manual/Portable)
- **Required:**
  - Windows operating system with Chocolatey installed (see Windows section)
  - PowerShell available on the Windows host
  - Administrator privileges (run Git Bash as Administrator)
- **Optional:** None
- **Auto-installed:** None
- **Note:** Git Bash can invoke Chocolatey commands, but Chocolatey must first be installed on the Windows host via PowerShell or Command Prompt.

## Prerequisites

Before installing Chocolatey, ensure:

1. **Windows operating system** - Chocolatey is Windows-only software
2. **Administrator privileges** - Required for installation and most package operations
3. **PowerShell v3 or later** - Required for secure HTTPS downloads (TLS 1.2)
4. **Internet connectivity** - Required to download the installer and packages
5. **Sufficient disk space** - At least 500 MB free for Chocolatey and package cache

**Important**: Chocolatey is designed exclusively for Windows. For other operating systems, use the native package manager for that platform (Homebrew for macOS, APT for Debian/Ubuntu, DNF/YUM for RHEL/Amazon Linux).

## Platform-Specific Installation

### macOS (Homebrew)

#### Platform Note

**Chocolatey does not run on macOS.** Chocolatey is a Windows-specific package manager built on PowerShell and the Windows ecosystem.

For macOS package management, use Homebrew instead:

```bash
# Install Homebrew (if not already installed)
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Example: Install a package with Homebrew
brew install --quiet wget
```

See the Homebrew installation documentation in this project for complete instructions.

---

### Ubuntu/Debian (APT)

#### Platform Note

**Chocolatey does not run on Linux.** Chocolatey is a Windows-specific package manager built on PowerShell and the Windows ecosystem.

For Ubuntu/Debian package management, use APT instead:

```bash
# Update package lists
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y

# Example: Install a package with APT
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget
```

APT is the native package manager for Debian-based Linux distributions and provides similar functionality to Chocolatey.

---

### Raspberry Pi OS (APT)

#### Platform Note

**Chocolatey does not run on Linux.** Chocolatey is a Windows-specific package manager built on PowerShell and the Windows ecosystem.

For Raspberry Pi OS package management, use APT instead:

```bash
# Update package lists
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y

# Example: Install a package with APT
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget
```

APT is the native package manager for Raspberry Pi OS and provides similar functionality to Chocolatey.

---

### Amazon Linux (DNF/YUM)

#### Platform Note

**Chocolatey does not run on Linux.** Chocolatey is a Windows-specific package manager built on PowerShell and the Windows ecosystem.

For Amazon Linux package management, use DNF (AL2023) or YUM (AL2) instead:

```bash
# Amazon Linux 2023 - Install a package with DNF
sudo dnf install -y wget

# Amazon Linux 2 - Install a package with YUM
sudo yum install -y wget
```

DNF and YUM are the native package managers for RHEL-based Linux distributions and provide similar functionality to Chocolatey.

---

### Windows (PowerShell)

#### Prerequisites

- Windows 7 SP1 or later (Windows 10/11 recommended)
- Windows Server 2003 or later (Windows Server 2016+ recommended)
- PowerShell v3 or later (comes pre-installed on Windows 10/11)
- .NET Framework 4.8 (installer handles this automatically if missing)
- Administrative PowerShell session

**Verify PowerShell Version**:

Open PowerShell and run:

```powershell
$PSVersionTable.PSVersion
```

The Major version should be 3 or higher. Windows 10/11 includes PowerShell 5.1 by default.

**Verify Execution Policy**:

Check the current execution policy:

```powershell
Get-ExecutionPolicy
```

If it returns `Restricted`, you will need to change it during installation (the installation command handles this).

#### Installation Steps

**Step 1: Open Administrator PowerShell**

Right-click the Start button and select "Windows Terminal (Admin)" or "Windows PowerShell (Admin)". Alternatively, search for "PowerShell" in the Start menu, right-click it, and select "Run as administrator".

**Step 2: Run the Installation Command**

Copy and paste the following command into the Administrator PowerShell window:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

This single command performs the following operations:

1. `Set-ExecutionPolicy Bypass -Scope Process -Force` - Temporarily allows script execution for the current session only (does not permanently change system policy)
2. `[System.Net.ServicePointManager]::SecurityProtocol = ... -bor 3072` - Enables TLS 1.2 for secure HTTPS downloads
3. `iex ((New-Object System.Net.WebClient).DownloadString(...))` - Downloads and executes the official Chocolatey installation script

The installation is fully non-interactive and requires no user input. The installer will:

1. Create the `C:\ProgramData\chocolatey` directory
2. Download and extract the Chocolatey NuGet package
3. Set the `ChocolateyInstall` environment variable
4. Add Chocolatey to the system PATH
5. Install the `choco` command

**Alternative: Installation via Command Prompt (cmd.exe)**

If you prefer Command Prompt over PowerShell, run the following command in an Administrator Command Prompt:

```cmd
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "[System.Net.ServicePointManager]::SecurityProtocol = 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"
```

This command invokes PowerShell from Command Prompt to run the same installation script.

#### Verification

Close and reopen your terminal (PowerShell or Command Prompt) to refresh the PATH, then verify the installation:

```powershell
choco --version
```

Expected output (version numbers may vary):

```
2.4.1
```

Run the help command to confirm Chocolatey is working:

```powershell
choco -?
```

This displays the Chocolatey help text with available commands.

Test installing a package:

```powershell
choco install notepadplusplus -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

#### Troubleshooting

**Problem**: `choco: The term 'choco' is not recognized`

**Solution**: The PATH environment variable was not updated. Close all terminal windows and open a new Administrator PowerShell. If the problem persists, manually add Chocolatey to PATH:

```powershell
$env:Path += ";C:\ProgramData\chocolatey\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::Machine)
```

**Problem**: `Unable to resolve dependency` errors

**Solution**: Update Chocolatey to the latest version:

```powershell
choco upgrade chocolatey -y
```

**Problem**: `Access to the path is denied` errors

**Solution**: Ensure you are running PowerShell as Administrator. Right-click PowerShell and select "Run as administrator".

**Problem**: SSL/TLS errors during installation

**Solution**: Your system may not support TLS 1.2 by default. Ensure .NET Framework 4.5 or later is installed. Run Windows Update to get the latest security patches.

**Problem**: `Execution of scripts is disabled on this system`

**Solution**: The execution policy is blocking the installation script. The installation command already handles this with `Set-ExecutionPolicy Bypass -Scope Process -Force`, but if you see this error, run the following first:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
```

Then re-run the installation command.

**Problem**: Installation hangs behind corporate proxy

**Solution**: Configure proxy settings before installation:

```powershell
$env:chocolateyProxyLocation = "http://proxy.example.com:8080"
$env:chocolateyProxyUser = "username"
$env:chocolateyProxyPassword = "password"
```

Then run the installation command.

---

### WSL (Ubuntu)

#### Platform Note

**Chocolatey does not run within WSL.** WSL provides a Linux environment, and Chocolatey is Windows-only software.

Within WSL, use APT for package management:

```bash
# Update package lists
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y

# Example: Install a package with APT
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget
```

**Note**: If you have Chocolatey installed on your Windows host (outside WSL), you can invoke it from WSL by calling the Windows executable:

```bash
# Call Windows Chocolatey from within WSL (not recommended for most use cases)
/mnt/c/ProgramData/chocolatey/bin/choco.exe --version
```

However, packages installed via Chocolatey on Windows are not accessible within the WSL Linux environment. Use APT for software needed within WSL.

---

### Git Bash (Windows)

#### Prerequisites

- Windows operating system with Git Bash installed
- Chocolatey installed on the Windows host (see Windows section above)
- Administrator privileges (run Git Bash as Administrator for package operations)

Git Bash is a terminal emulator for Windows that provides a bash-like shell. Since Git Bash runs on Windows, it can invoke Chocolatey commands directly.

#### Installation Steps

Chocolatey must be installed on the Windows host first. You cannot install Chocolatey from within Git Bash because the installation requires PowerShell.

**Step 1: Install Chocolatey via PowerShell**

Open an Administrator PowerShell window (not Git Bash) and run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**Step 2: Verify from Git Bash**

After installation, open a new Git Bash window (close and reopen if already open) and verify Chocolatey is accessible:

```bash
choco --version
```

#### Using Chocolatey from Git Bash

Once installed, you can run Chocolatey commands from Git Bash. Note that package installation typically requires Administrator privileges.

To run Git Bash as Administrator:
1. Right-click the Git Bash shortcut
2. Select "Run as administrator"

Then run Chocolatey commands as normal:

```bash
# List installed packages
choco list

# Install a package (requires Administrator)
choco install wget -y

# Upgrade all packages (requires Administrator)
choco upgrade all -y
```

#### Verification

Confirm Chocolatey is accessible from Git Bash:

```bash
choco --version
```

Expected output (version numbers may vary):

```
2.4.1
```

Test installing a package (run Git Bash as Administrator):

```bash
choco install curl -y
```

#### Troubleshooting

**Problem**: `choco: command not found`

**Solution**: Git Bash may not have inherited the updated PATH. Close Git Bash completely and reopen it. If the problem persists, verify the PATH includes Chocolatey:

```bash
echo $PATH | tr ':' '\n' | grep -i choco
```

If Chocolatey is not in the PATH, add it to your `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/c/ProgramData/chocolatey/bin"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Package installation fails with access denied

**Solution**: You must run Git Bash as Administrator to install packages. Right-click Git Bash and select "Run as administrator".

**Problem**: Chocolatey commands hang or timeout

**Solution**: Some Chocolatey commands may not work well in Git Bash's mintty terminal. Try running the command in PowerShell or Command Prompt instead, or use `winpty`:

```bash
winpty choco install wget -y
```

---

## Post-Installation Configuration

After installing Chocolatey on Windows, consider these optional but recommended configurations.

### Enable Global Confirmation

To avoid typing `-y` on every command, enable global confirmation:

```powershell
choco feature enable -n allowGlobalConfirmation
```

With this setting, all `choco install`, `choco upgrade`, and `choco uninstall` commands will run non-interactively without requiring the `-y` flag.

### Configure Package Cache Location

By default, Chocolatey caches packages in `C:\ProgramData\chocolatey\lib`. To change the cache location:

```powershell
choco config set cacheLocation "D:\ChocolateyCache"
```

### Configure Proxy Settings

If you are behind a corporate proxy, configure Chocolatey to use it:

```powershell
choco config set proxy "http://proxy.example.com:8080"
choco config set proxyUser "username"
choco config set proxyPassword "password"
```

### Disable Telemetry

Chocolatey does not collect telemetry by default in the open-source version. If using Chocolatey for Business, consult the documentation for telemetry settings.

### Common Chocolatey Commands

| Command | Description |
|---------|-------------|
| `choco install <package> -y` | Install a package silently |
| `choco uninstall <package> -y` | Remove a package silently |
| `choco upgrade <package> -y` | Upgrade a specific package |
| `choco upgrade all -y` | Upgrade all installed packages |
| `choco list` | List installed packages |
| `choco search <term>` | Search for packages |
| `choco info <package>` | Show package information |
| `choco outdated` | List packages with available updates |
| `choco pin add -n <package>` | Prevent a package from being upgraded |
| `choco source list` | List configured package sources |

---

## Common Issues

### Issue: Package Installation Fails Silently

**Symptoms**: `choco install` completes but the software is not installed

**Solutions**:

Check the Chocolatey log for errors:

```powershell
Get-Content C:\ProgramData\chocolatey\logs\chocolatey.log -Tail 100
```

Some packages have underlying installers that may fail. Try reinstalling with verbose output:

```powershell
choco install <package> -y --verbose
```

### Issue: Checksum Verification Failed

**Symptoms**: `ERROR - The remote file either doesn't exist, is unauthorized, or is forbidden for url`

**Solutions**:

The package may have an outdated checksum. You can skip checksum verification (use with caution):

```powershell
choco install <package> -y --ignore-checksums
```

Better: Report the issue to the package maintainer on chocolatey.org.

### Issue: Conflicting Software Versions

**Symptoms**: Multiple versions of the same software installed

**Solutions**:

List installed packages and their versions:

```powershell
choco list
```

Uninstall the conflicting version:

```powershell
choco uninstall <package> -y
```

Then install the desired version:

```powershell
choco install <package> --version=<version> -y
```

### Issue: Chocolatey Commands Require Administrator

**Symptoms**: `Access denied` or `requires elevation` errors

**Solutions**:

Most Chocolatey operations require Administrator privileges. Always run PowerShell or Command Prompt as Administrator for package operations.

For listing installed packages (read-only), Administrator privileges are not required:

```powershell
choco list
```

### Issue: Network Timeout During Installation

**Symptoms**: Downloads timeout or fail intermittently

**Solutions**:

Increase the command execution timeout:

```powershell
choco config set commandExecutionTimeoutSeconds 14400
```

If behind a proxy, ensure proxy settings are configured correctly (see Post-Installation Configuration).

### Issue: PATH Not Updated After Package Installation

**Symptoms**: Installed program not found in PATH

**Solutions**:

Close and reopen your terminal to refresh the PATH. If the problem persists, the package may install to a non-standard location. Check the package documentation or run:

```powershell
choco info <package>
```

Some packages require a system restart to update PATH correctly.

---

## Upgrading Chocolatey

To upgrade Chocolatey to the latest version:

```powershell
choco upgrade chocolatey -y
```

Verify the upgrade:

```powershell
choco --version
```

---

## Uninstalling Chocolatey

To completely remove Chocolatey from your system:

**Step 1: Uninstall All Packages**

```powershell
choco uninstall all -y
```

**Step 2: Remove Chocolatey Directory**

Run the following in Administrator PowerShell:

```powershell
Remove-Item -Recurse -Force C:\ProgramData\chocolatey
```

**Step 3: Remove Environment Variables**

```powershell
[Environment]::SetEnvironmentVariable("ChocolateyInstall", $null, [EnvironmentVariableTarget]::Machine)
[Environment]::SetEnvironmentVariable("ChocolateyToolsLocation", $null, [EnvironmentVariableTarget]::Machine)
```

**Step 4: Remove from PATH**

Manually edit the system PATH environment variable to remove the Chocolatey bin directory:

1. Open System Properties (Win+Pause or search "Environment Variables")
2. Click "Environment Variables"
3. Under "System variables", find "Path" and click "Edit"
4. Remove the entry for `C:\ProgramData\chocolatey\bin`
5. Click OK to save

---

## References

- [Chocolatey Official Website](https://chocolatey.org/)
- [Chocolatey Installation Documentation](https://chocolatey.org/install)
- [Chocolatey Setup/Install Documentation](https://docs.chocolatey.org/en-us/choco/setup/)
- [Chocolatey Commands Reference](https://docs.chocolatey.org/en-us/choco/commands/)
- [Chocolatey Package Repository](https://community.chocolatey.org/packages)
- [Chocolatey GitHub Repository](https://github.com/chocolatey/choco)
- [Chocolatey Getting Started Guide](https://docs.chocolatey.org/en-us/getting-started/)
- [Chocolatey FAQ](https://docs.chocolatey.org/en-us/faqs/)
