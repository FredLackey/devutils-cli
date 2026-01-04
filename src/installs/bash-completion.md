# Installing Bash Completion 2

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew package manager - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
  - Bash 4.2 or later - Install via `brew install bash` (macOS ships with Bash 3.2 which is incompatible)
- **Optional:** None
- **Auto-installed:** None

### Ubuntu (APT/Snap)
- **Required:**
  - APT package manager (built-in on Ubuntu/Debian systems)
  - Bash 4.2 or later (typically pre-installed on modern Ubuntu/Debian)
- **Optional:** None
- **Auto-installed:** All runtime dependencies are handled automatically by APT

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - APT package manager (built-in on Raspberry Pi OS)
  - Bash 4.2 or later (typically pre-installed on Raspberry Pi OS)
- **Optional:** None
- **Auto-installed:** All runtime dependencies are handled automatically by APT

### Amazon Linux (DNF/YUM)
- **Required:**
  - DNF (Amazon Linux 2023) or YUM (Amazon Linux 2) package manager (built-in)
  - rpm command for verification (built-in)
  - Bash 4.2 or later (typically pre-installed on Amazon Linux)
- **Optional:** None
- **Auto-installed:** All runtime dependencies are handled automatically by DNF/YUM

### Windows (Chocolatey/winget)
- **Required:** None (bash-completion is not natively supported on Windows)
- **Optional:**
  - Clink (for Bash-style line editing in cmd.exe) - Install via `choco install clink -y` (Note: This is NOT the same as bash-completion)
- **Auto-installed:** None
- **Note:** For actual bash-completion support on Windows, use WSL (see WSL section) or Git Bash (see Git Bash section)

### Git Bash (Manual/Portable)
- **Required:**
  - Git for Windows (includes Git Bash/MINGW64 environment) - Download from https://git-scm.com/download/win
  - curl command (included with Git for Windows) for downloading completion scripts
- **Optional:** None
- **Auto-installed:** Git completion scripts are typically bundled with Git for Windows installation
- **Note:** Git Bash provides limited bash-completion support. For full functionality, use WSL instead.

## Overview

Bash Completion (bash-completion) is a collection of shell functions that take advantage of the programmable completion feature of Bash. It provides intelligent auto-completion for commands, file paths, options, and arguments when you press the Tab key. Version 2 (bash-completion@2) is designed for Bash 4.2 and later, offering improved performance and more comprehensive completion support compared to version 1.

Key benefits include:
- Faster command entry through Tab-triggered auto-completion
- Reduced typing errors by suggesting valid options and arguments
- Discovery of command options without consulting documentation
- Support for hundreds of common commands out of the box

## Prerequisites

Before installing bash-completion on any platform, ensure:

1. **Bash 4.2 or later** - Version 2 of bash-completion requires Bash 4.2+. Check your version with `bash --version`.
2. **Terminal access** - You need access to a terminal or command-line interface.
3. **Administrative privileges** - Required on most platforms for system-wide installation.

**Important**: bash-completion version 1 and version 2 conflict with each other. If you have version 1 installed, remove it before installing version 2.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager installed
- Bash 4.2 or later installed (macOS ships with Bash 3.2 by default)

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Critical**: macOS ships with Bash 3.2 (from 2007) due to licensing. You must install a modern version of Bash before using bash-completion@2:

```bash
brew install --quiet bash
```

Add the new Bash to allowed shells and set it as default:

```bash
echo '/opt/homebrew/bin/bash' | sudo tee -a /etc/shells
chsh -s /opt/homebrew/bin/bash
```

#### Installation Steps

Run the following command to install bash-completion@2:

```bash
brew install --quiet bash-completion@2
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts.

#### Configuration

After installation, you must configure your shell to load bash-completion. Add the following to your `~/.bash_profile`:

```bash
# Enable bash-completion@2
[[ -r "${HOMEBREW_PREFIX}/etc/profile.d/bash_completion.sh" ]] && . "${HOMEBREW_PREFIX}/etc/profile.d/bash_completion.sh"
```

For Intel Macs, `HOMEBREW_PREFIX` is `/usr/local`. For Apple Silicon Macs (M1/M2/M3/M4), it is `/opt/homebrew`. If `HOMEBREW_PREFIX` is not set in your environment, use the explicit path:

For Apple Silicon:
```bash
[[ -r "/opt/homebrew/etc/profile.d/bash_completion.sh" ]] && . "/opt/homebrew/etc/profile.d/bash_completion.sh"
```

For Intel:
```bash
[[ -r "/usr/local/etc/profile.d/bash_completion.sh" ]] && . "/usr/local/etc/profile.d/bash_completion.sh"
```

Apply the changes:

```bash
source ~/.bash_profile
```

#### Verification

Confirm the installation succeeded:

```bash
type _init_completion
```

Expected output:

```
_init_completion is a function
```

Test completion by typing `git ` followed by pressing Tab twice. You should see a list of Git subcommands.

#### Troubleshooting

**Problem**: `bash: _init_completion: command not found`

**Solution**: The completion script is not being sourced. Verify the path exists and add the source line to `~/.bash_profile`:

```bash
ls -la "${HOMEBREW_PREFIX}/etc/profile.d/bash_completion.sh"
```

**Problem**: Completion not working despite configuration

**Solution**: Ensure you are running Bash 4.2+ and not the system default Bash 3.2:

```bash
echo $BASH_VERSION
```

If it shows 3.x, restart your terminal or ensure the new Bash is your default shell.

**Problem**: Conflicts with bash-completion version 1

**Solution**: Uninstall version 1 first:

```bash
brew uninstall bash-completion
brew install --quiet bash-completion@2
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 or later (64-bit)
- sudo privileges
- Bash 4.2 or later (default on modern Ubuntu/Debian)

**Note**: On Ubuntu/Debian, the APT package `bash-completion` provides version 2.x functionality. The `@2` version suffix is specific to Homebrew on macOS.

#### Installation Steps

Run the following commands to install bash-completion:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y bash-completion
```

The `DEBIAN_FRONTEND=noninteractive` and `-y` flags ensure fully non-interactive installation suitable for scripts and automation.

#### Configuration

Ubuntu and Debian typically enable bash-completion by default. The installer places a script at `/etc/profile.d/bash_completion.sh` that is automatically sourced for login shells.

Verify that `/etc/bash.bashrc` or `~/.bashrc` contains the completion loading logic:

```bash
grep -q bash_completion /etc/bash.bashrc && echo "System-wide completion configured" || echo "Check configuration"
```

If completion is not enabled, add the following to your `~/.bashrc`:

```bash
# Enable bash-completion
if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi
```

Apply changes:

```bash
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
type _init_completion
```

Expected output:

```
_init_completion is a function
```

Check the installed version:

```bash
apt show bash-completion 2>/dev/null | grep Version
```

Expected output (version may vary):

```
Version: 1:2.11-8
```

#### Troubleshooting

**Problem**: Completion not working after installation

**Solution**: Source the completion script manually or restart your terminal:

```bash
source /etc/profile.d/bash_completion.sh
```

**Problem**: `apt show bash-completion` returns "N: Unable to locate package"

**Solution**: Update the package list:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Tab completion works for some commands but not others

**Solution**: Individual command completions are stored in `/usr/share/bash-completion/completions/`. Check if the completion file exists for your command:

```bash
ls /usr/share/bash-completion/completions/
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 3, 4, 5, or Zero 2 W (any model with sufficient resources)
- sudo privileges
- Bash 4.2 or later (default on Raspberry Pi OS)

**Note**: Raspberry Pi OS is based on Debian, so the installation process is nearly identical to Ubuntu/Debian.

#### Installation Steps

Run the following commands to install bash-completion:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y bash-completion
```

#### Configuration

Raspberry Pi OS typically enables bash-completion by default after installation. Verify the configuration exists in `/etc/bash.bashrc`:

```bash
grep -q bash_completion /etc/bash.bashrc && echo "System-wide completion configured" || echo "Check configuration"
```

If completion is not enabled, add the following to your `~/.bashrc`:

```bash
# Enable bash-completion
if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi
```

Apply changes:

```bash
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
type _init_completion
```

Expected output:

```
_init_completion is a function
```

Test ARM-specific functionality by ensuring completions work:

```bash
# Type 'sudo apt-get install ' and press Tab twice
# You should see package name suggestions
```

#### Troubleshooting

**Problem**: Installation is slow or times out

**Solution**: Raspberry Pi may have limited bandwidth. Use a wired ethernet connection or wait for the download to complete. Avoid interrupting the installation.

**Problem**: Completion not working after reboot

**Solution**: Ensure `~/.bashrc` is sourced by `~/.bash_profile`. Add to `~/.bash_profile` if needed:

```bash
if [ -f ~/.bashrc ]; then
    . ~/.bashrc
fi
```

**Problem**: Completion works for user but not for root

**Solution**: Root may have a different shell configuration. Source completion in root's profile:

```bash
sudo bash -c 'echo "source /etc/profile.d/bash_completion.sh" >> /root/.bashrc'
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (uses DNF) or Amazon Linux 2 (uses YUM)
- sudo privileges
- Bash 4.2 or later (default on Amazon Linux)

#### Installation Steps

**For Amazon Linux 2023:**

```bash
sudo dnf install -y bash-completion
```

**For Amazon Linux 2:**

```bash
sudo yum install -y bash-completion
```

Both commands use the `-y` flag for non-interactive installation.

#### Configuration

After installation, the completion script is placed at `/etc/profile.d/bash_completion.sh` and is typically sourced automatically for login shells.

To ensure completion is available in all sessions, verify your `~/.bashrc` sources the profile scripts:

```bash
grep -q bash_completion /etc/bashrc && echo "System-wide completion configured" || echo "Manual configuration may be needed"
```

If needed, add the following to your `~/.bashrc`:

```bash
# Enable bash-completion
[[ $PS1 && -f /etc/profile.d/bash_completion.sh ]] && . /etc/profile.d/bash_completion.sh
```

Apply changes:

```bash
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
type _init_completion
```

Expected output:

```
_init_completion is a function
```

Verify the package installation:

```bash
# Amazon Linux 2023
rpm -q bash-completion

# Amazon Linux 2
rpm -q bash-completion
```

Expected output (version may vary):

```
bash-completion-2.11-3.amzn2023.noarch
```

#### Troubleshooting

**Problem**: `dnf: command not found` on Amazon Linux 2

**Solution**: Amazon Linux 2 uses YUM, not DNF. Use `yum` instead:

```bash
sudo yum install -y bash-completion
```

**Problem**: Completion not loading in SSH sessions

**Solution**: SSH sessions may not source `/etc/profile.d/` scripts. Add explicit sourcing to `~/.bashrc`:

```bash
[[ -f /etc/profile.d/bash_completion.sh ]] && . /etc/profile.d/bash_completion.sh
```

**Problem**: EPEL repository required for some completions

**Solution**: Install EPEL for additional packages:

```bash
# Amazon Linux 2
sudo amazon-linux-extras install epel -y

# Amazon Linux 2023 (EPEL not typically needed)
```

---

### Windows (Not Natively Supported)

#### Overview

Bash Completion is a Linux/Unix tool that does not run natively on Windows. Windows uses PowerShell or Command Prompt, which have their own completion mechanisms.

For Bash functionality on Windows, use one of these alternatives:

1. **WSL (Windows Subsystem for Linux)** - Recommended. See the WSL section below.
2. **Git Bash** - Limited Bash environment. See the Git Bash section below.
3. **Clink** - Provides Bash-style completion for Command Prompt (not actual bash-completion).

#### Clink (Bash-Style Completion for cmd.exe)

If you want Bash-style command-line editing in the native Windows Command Prompt, install Clink:

```powershell
choco install clink -y
```

**Note**: Clink provides Bash-like line editing features for `cmd.exe`, but it is not the same as bash-completion and does not provide the same completion functionality.

#### Verification

Clink enhances Command Prompt automatically after installation. Open a new `cmd.exe` window and look for the Clink banner on startup.

#### Troubleshooting

**Problem**: Want actual bash-completion on Windows

**Solution**: Install WSL and follow the WSL installation instructions below. This provides a full Linux environment with proper bash-completion support.

---

### WSL (Windows Subsystem for Linux - Ubuntu)

#### Prerequisites

- Windows 10 version 1903 or later, or Windows 11
- WSL 2 installed and configured (WSL 1 also works but WSL 2 is recommended)
- Ubuntu distribution installed via WSL
- sudo privileges within the WSL environment

To check if WSL is installed:

```powershell
wsl --version
```

If WSL is not installed, install it from PowerShell (Administrator):

```powershell
wsl --install
```

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y bash-completion
```

#### Configuration

WSL Ubuntu typically enables bash-completion by default. Verify the configuration:

```bash
grep -q bash_completion /etc/bash.bashrc && echo "System-wide completion configured" || echo "Check configuration"
```

If completion is not enabled, add the following to your `~/.bashrc`:

```bash
# Enable bash-completion
if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi
```

Apply changes:

```bash
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded:

```bash
type _init_completion
```

Expected output:

```
_init_completion is a function
```

#### Troubleshooting

**Problem**: Completion not working after WSL restart

**Solution**: Ensure `~/.bashrc` is being sourced. WSL may use `~/.profile` for login shells. Add to `~/.profile`:

```bash
if [ -f ~/.bashrc ]; then
    . ~/.bashrc
fi
```

**Problem**: systemd-related errors when installing packages

**Solution**: Enable systemd in WSL if needed. Add to `/etc/wsl.conf`:

```ini
[boot]
systemd=true
```

Then restart WSL from PowerShell:

```powershell
wsl --shutdown
```

**Problem**: PATH conflicts between Windows and Linux

**Solution**: Windows paths may interfere with Linux commands. You can disable Windows path interop by adding to `/etc/wsl.conf`:

```ini
[interop]
appendWindowsPath=false
```

---

### Git Bash (Manual Installation)

#### Prerequisites

- Windows 10 or Windows 11
- Git for Windows installed (includes Git Bash/MINGW64)
- Write access to your home directory

**Important**: Git Bash provides a minimal Bash environment. While it includes Git-specific completions, general bash-completion is limited. For full bash-completion support, use WSL instead.

#### Installation Steps

Git Bash includes Git command completion by default. To verify and enable it:

1. Create a directory for completion scripts:

```bash
mkdir -p ~/bash_completion.d
```

2. Download the official Git completion script:

```bash
curl -fsSL -o ~/bash_completion.d/git-completion.bash https://raw.githubusercontent.com/git/git/master/contrib/completion/git-completion.bash
```

3. Add the following to your `~/.bashrc` (create the file if it does not exist):

```bash
# Enable Git completion
if [ -f ~/bash_completion.d/git-completion.bash ]; then
    . ~/bash_completion.d/git-completion.bash
fi
```

4. Apply changes by restarting Git Bash or running:

```bash
source ~/.bashrc
```

#### Adding Additional Completions

To add completion for other commands, download their completion scripts to `~/bash_completion.d/` and source them in `~/.bashrc`:

```bash
# Example: Download Docker completion
curl -fsSL -o ~/bash_completion.d/docker-completion.bash https://raw.githubusercontent.com/docker/cli/master/contrib/completion/bash/docker

# Add to ~/.bashrc
echo '[ -f ~/bash_completion.d/docker-completion.bash ] && . ~/bash_completion.d/docker-completion.bash' >> ~/.bashrc
```

#### Verification

Confirm Git completion is working:

```bash
# Type 'git chec' and press Tab
# Should complete to 'git checkout'
git chec<TAB>
```

Test branch completion:

```bash
# In a Git repository, type 'git checkout ' and press Tab
# Should show available branches
```

#### Troubleshooting

**Problem**: Tab completion does not work

**Solution**: Ensure the completion script is sourced. Check that `~/.bashrc` exists and contains the source line:

```bash
cat ~/.bashrc | grep git-completion
```

**Problem**: Completion script not found at the expected location

**Solution**: Git for Windows may include completion scripts in a different location. Check:

```bash
ls "/c/Program Files/Git/mingw64/share/git/completion/"
```

If found, source from that location instead:

```bash
if [ -f "/c/Program Files/Git/mingw64/share/git/completion/git-completion.bash" ]; then
    . "/c/Program Files/Git/mingw64/share/git/completion/git-completion.bash"
fi
```

**Problem**: `~/.bashrc` is not being sourced

**Solution**: Git Bash may source `~/.bash_profile` instead. Add to `~/.bash_profile`:

```bash
if [ -f ~/.bashrc ]; then
    . ~/.bashrc
fi
```

---

## Post-Installation Configuration

### Adding Completions for Homebrew Packages (macOS)

After installing tools via Homebrew, link their completions:

```bash
brew completions link
```

This makes completions for Homebrew-installed tools available to bash-completion.

### Adding Custom Completions

Place custom completion scripts in the appropriate directory:

| Platform | Completion Directory |
|----------|---------------------|
| macOS (Homebrew) | `${HOMEBREW_PREFIX}/etc/bash_completion.d/` |
| Ubuntu/Debian | `/usr/share/bash-completion/completions/` |
| Amazon Linux | `/usr/share/bash-completion/completions/` |
| Git Bash | `~/bash_completion.d/` |

### Verifying Completion is Active

Test completion functionality with any command that supports it:

```bash
# Type a partial command and press Tab twice
git <TAB><TAB>       # Shows Git subcommands
ssh <TAB><TAB>       # Shows known hosts
cd <TAB><TAB>        # Shows directories
```

---

## Common Issues

### Issue: Completion Works for Some Commands but Not Others

**Cause**: Not all commands ship with completion scripts. Completions must be installed separately or provided by the package.

**Solution**: Check if a completion script exists for the command:

```bash
# On Ubuntu/Debian/Amazon Linux
ls /usr/share/bash-completion/completions/ | grep <command>

# On macOS
ls ${HOMEBREW_PREFIX}/etc/bash_completion.d/ | grep <command>
```

### Issue: Slow Completion Performance

**Cause**: Large completion lists or slow disk access.

**Solution**: bash-completion@2 includes lazy loading to improve performance. Ensure you are using version 2.x:

```bash
# Check the bash_completion script version
grep -m1 "BASH_COMPLETION_VERSINFO" /usr/share/bash-completion/bash_completion 2>/dev/null || \
grep -m1 "BASH_COMPLETION_VERSINFO" ${HOMEBREW_PREFIX}/etc/profile.d/bash_completion.sh 2>/dev/null
```

### Issue: Completion Breaks After System Update

**Cause**: Configuration files may be overwritten or package updates may change paths.

**Solution**: Re-source your configuration and verify paths:

```bash
source ~/.bashrc
type _init_completion
```

### Issue: "bash: _init_completion: command not found" After Installation

**Cause**: The completion script is not being sourced by your shell configuration.

**Solution**: Manually add the source line to your `~/.bashrc` or `~/.bash_profile` as documented in the platform-specific sections above.

---

## References

- [bash-completion GitHub Repository](https://github.com/scop/bash-completion)
- [bash-completion@2 Homebrew Formula](https://formulae.brew.sh/formula/bash-completion@2)
- [Homebrew Shell Completion Documentation](https://docs.brew.sh/Shell-Completion)
- [Ubuntu bash-completion Package](https://launchpad.net/ubuntu/+source/bash-completion)
- [Debian Wiki - Add Bash Completion](https://wiki.debian.org/Add%20Bash%20Completion)
- [nixCraft - How to Add Bash Auto Completion in Ubuntu Linux](https://www.cyberciti.biz/faq/add-bash-auto-completion-in-ubuntu-linux/)
- [nixCraft - RHEL/CentOS Install and Activate Bash Completion](https://www.cyberciti.biz/faq/fedora-redhat-scientific-linuxenable-bash-completion/)
- [Git Completion Script (Official)](https://github.com/git/git/blob/master/contrib/completion/git-completion.bash)
- [Microsoft - Install WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Microsoft - Use systemd to manage Linux services with WSL](https://learn.microsoft.com/en-us/windows/wsl/systemd)
