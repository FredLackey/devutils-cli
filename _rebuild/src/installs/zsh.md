# Installing Zsh

## Overview

Zsh (Z Shell) is a powerful Unix shell and command interpreter designed for interactive use and scripting. It combines features from Bash, ksh, and tcsh while adding many original features. Zsh is renowned for its advanced tab completion, spelling correction, themeable prompts, and extensive plugin ecosystem.

Key features of Zsh:

- **Advanced tab completion** - Context-aware completions for commands, arguments, file paths, and more
- **Spelling correction** - Automatic correction of typos in commands and paths
- **Themeable prompts** - Highly customizable prompt with support for git status, colors, and special characters
- **Plugin ecosystem** - Extensive plugins available through frameworks like Oh My Zsh
- **Improved globbing** - Extended pattern matching and recursive globbing (`**/*.js`)
- **Array and associative array support** - First-class support for complex data structures
- **Shared history** - Command history shared across multiple terminal sessions

Since macOS Catalina (10.15), Zsh has been the default shell on macOS. On Linux systems, Bash typically remains the default, but Zsh is readily available through standard package managers.

**Platform Support Summary**:

| Platform | Support Level | Package Manager | Default Shell |
|----------|---------------|-----------------|---------------|
| macOS (Intel/Apple Silicon) | Full | Homebrew / Pre-installed | Yes (Catalina+) |
| Ubuntu/Debian (x86_64) | Full | APT | No (Bash default) |
| Raspberry Pi OS (ARM) | Full | APT | No (Bash default) |
| Amazon Linux / RHEL / Fedora | Full | DNF/YUM | No (Bash default) |
| WSL (Ubuntu on Windows) | Full | APT | No (Bash default) |
| Windows (Native) | Not Supported | N/A | N/A |
| Git Bash | Not Supported | N/A | N/A |

**Note**: Windows native environments and Git Bash do not support Zsh. Windows users should use WSL (Windows Subsystem for Linux) to run Zsh.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew package manager - Install via `dev install homebrew` or directly from https://brew.sh (only needed for updating to a newer Zsh version)
  - Administrative privileges (sudo access) - Required for changing the default shell
- **Optional:** None
- **Auto-installed:**
  - Zsh is pre-installed on macOS Catalina (10.15) and later as the default shell
  - Homebrew handles Zsh dependencies (ncurses, pcre) transparently when installing via brew

### Ubuntu/Debian (APT)
- **Required:**
  - APT package manager - Pre-installed on Ubuntu/Debian systems
  - sudo privileges - Required for package installation and changing the default shell
  - Internet connectivity - Required to download packages from APT repositories
- **Optional:** None
- **Auto-installed:**
  - Zsh dependencies (libc6, libcap2, libtinfo6, libgdbm6) - APT handles these transparently

### Raspberry Pi OS (APT)
- **Required:**
  - APT package manager - Pre-installed on Raspberry Pi OS
  - sudo privileges - Required for package installation and changing the default shell
  - Internet connectivity - Required to download packages from APT repositories
- **Optional:** None
- **Auto-installed:**
  - Zsh dependencies - APT handles these for ARM architecture transparently

### Amazon Linux / RHEL / Fedora (DNF/YUM)
- **Required:**
  - DNF (Amazon Linux 2023, RHEL 8+, Fedora) or YUM (Amazon Linux 2, RHEL 7) package manager - Pre-installed
  - sudo privileges - Required for package installation and changing the default shell
  - Internet connectivity - Required to download packages from distribution repositories
- **Optional:** None
- **Auto-installed:**
  - Zsh dependencies (glibc, ncurses-libs) - DNF/YUM handles these transparently

### WSL (Ubuntu)
- **Required:**
  - WSL 2 with Ubuntu distribution installed
  - APT package manager - Pre-installed within WSL Ubuntu
  - sudo privileges within WSL - Required for package installation
- **Optional:** None
- **Auto-installed:**
  - Zsh dependencies - APT handles these transparently

### Windows (Native) / Git Bash
- **Not Supported** - Zsh does not run on native Windows or Git Bash
- **Alternative:** Use WSL (Windows Subsystem for Linux) with Ubuntu to run Zsh

## Prerequisites

Before installing Zsh on any platform, ensure:

1. **Administrative/sudo privileges** - Required for package installation and shell registration
2. **Internet connectivity** - Required to download packages from repositories
3. **Existing shell access** - You need a working terminal to run installation commands

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Terminal access via Terminal.app, iTerm2, or another terminal emulator

macOS Catalina and later include Zsh as the default shell. Newly created user accounts automatically use Zsh. Existing user accounts upgraded from older macOS versions may still use Bash and need to be switched manually.

**Zsh Versions by macOS Release**:
- macOS Sonoma (14.x): Zsh 5.9
- macOS Ventura (13.x): Zsh 5.8.1 - 5.9
- macOS Monterey (12.x): Zsh 5.8
- macOS Big Sur (11.x): Zsh 5.8
- macOS Catalina (10.15): Zsh 5.7.1

#### Installation Steps

**Step 1: Check if Zsh is already installed and its version**

```bash
zsh --version
```

Expected output (version numbers may vary):

```
zsh 5.9 (x86_64-apple-darwin23.0)
```

If Zsh is already installed and you are satisfied with the version, skip to Step 3 to verify or change your default shell.

**Step 2: Install or update Zsh via Homebrew (optional)**

To install the latest Zsh version from Homebrew (which may be newer than the system version):

```bash
brew install --quiet zsh
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts.

After installation, register the Homebrew Zsh as an allowed shell:

```bash
# Add Homebrew Zsh to the list of allowed shells
BREW_ZSH="$(brew --prefix)/bin/zsh"
echo "$BREW_ZSH" | sudo tee -a /etc/shells >/dev/null
```

**Note**: On Apple Silicon Macs (M1/M2/M3/M4), the path is `/opt/homebrew/bin/zsh`. On Intel Macs, the path is `/usr/local/bin/zsh`. The command above automatically detects the correct path.

**Step 3: Set Zsh as your default shell (if not already)**

Check your current default shell:

```bash
echo "$SHELL"
```

If the output is not `/bin/zsh` (or the Homebrew path), set Zsh as your default:

```bash
# For system Zsh (recommended for most users)
sudo chsh -s /bin/zsh "$USER"

# Or for Homebrew Zsh (if you installed it in Step 2)
sudo chsh -s "$(brew --prefix)/bin/zsh" "$USER"
```

**Step 4: Suppress the Bash deprecation warning (for users switching from Bash)**

If you occasionally use Bash and want to suppress the deprecation warning, add this line to your `~/.bash_profile`:

```bash
echo 'export BASH_SILENCE_DEPRECATION_WARNING=1' >> ~/.bash_profile
```

#### Verification

Confirm Zsh is installed and configured correctly:

```bash
# Check the installed version
zsh --version

# Verify the default shell
echo "$SHELL"

# Check if Zsh is in the allowed shells list
grep zsh /etc/shells
```

Expected output for the default shell (on Apple Silicon):

```
/bin/zsh
```

Or if using Homebrew Zsh:

```
/opt/homebrew/bin/zsh
```

#### Troubleshooting

**Problem**: `chsh: /opt/homebrew/bin/zsh: non-standard shell`

**Solution**: The Homebrew Zsh was not added to `/etc/shells`. Add it manually:

```bash
echo "$(brew --prefix)/bin/zsh" | sudo tee -a /etc/shells >/dev/null
```

**Problem**: Terminal still uses Bash after changing default shell

**Solution**: Close all terminal windows and open a new one. The shell change only takes effect in new sessions. You may also need to log out and log back in.

**Problem**: Homebrew Zsh not found after installation

**Solution**: Homebrew may not be in your PATH. Add it by running:

```bash
# For Apple Silicon Macs
eval "$(/opt/homebrew/bin/brew shellenv)"

# For Intel Macs
eval "$(/usr/local/bin/brew shellenv)"
```

**Problem**: System shows "The default interactive shell is now zsh" message

**Solution**: This informational message appears for existing Bash users. To suppress it, either switch to Zsh as your default shell or add `export BASH_SILENCE_DEPRECATION_WARNING=1` to your `~/.bash_profile`.

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 (Buster) or later (64-bit)
- sudo privileges
- Terminal access

**Zsh Versions by Distribution**:
- Ubuntu 24.04 LTS: Zsh 5.9
- Ubuntu 22.04 LTS: Zsh 5.8.1
- Ubuntu 20.04 LTS: Zsh 5.8
- Debian 12 (Bookworm): Zsh 5.9
- Debian 11 (Bullseye): Zsh 5.8

#### Installation Steps

**Step 1: Update package lists and install Zsh**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y zsh
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully non-interactive installation suitable for automation scripts.

**Step 2: Verify Zsh installation**

```bash
zsh --version
```

Expected output (version numbers may vary):

```
zsh 5.9 (x86_64-debian-linux-gnu)
```

**Step 3: Set Zsh as your default shell**

```bash
sudo chsh -s $(which zsh) "$USER"
```

**Note**: The `chsh` command may prompt for your password. For fully non-interactive automation in scripts (where you have sudo access without a password), you can modify `/etc/passwd` directly:

```bash
sudo usermod --shell $(which zsh) "$USER"
```

**Step 4: Apply the change**

Log out and log back in, or start a new terminal session. Alternatively, start Zsh manually:

```bash
exec zsh
```

#### Verification

Confirm Zsh is installed and configured:

```bash
# Check the installed version
zsh --version

# Verify Zsh is your default shell
echo "$SHELL"

# Check the shell entry in /etc/passwd
grep "$USER" /etc/passwd | cut -d: -f7
```

Expected output for the default shell:

```
/usr/bin/zsh
```

#### Troubleshooting

**Problem**: `chsh: PAM: Authentication failure`

**Solution**: The `chsh` command requires password authentication. Use `usermod` with sudo instead:

```bash
sudo usermod --shell $(which zsh) "$USER"
```

**Problem**: Zsh not loading configuration on login

**Solution**: Ensure `~/.zshrc` exists. Create a minimal one if missing:

```bash
touch ~/.zshrc
```

**Problem**: `E: Unable to locate package zsh`

**Solution**: Update your package lists:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: New Zsh session shows configuration wizard on first run

**Solution**: The Zsh configuration wizard (`zsh-newuser-install`) runs when no `.zshrc` exists. Press `q` to quit and create your own configuration, or press `0` to create an empty `.zshrc` file. For non-interactive setup, create the file before first run:

```bash
touch ~/.zshrc
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm, Bullseye, or Buster) - 32-bit or 64-bit
- Raspberry Pi 2 or later (Raspberry Pi 3B+ or later recommended for adequate performance)
- sudo privileges
- Terminal access (via local monitor/keyboard or SSH)

Raspberry Pi OS is based on Debian, so Zsh installation follows the same APT-based process.

**Zsh Versions by Raspberry Pi OS Release**:
- Raspberry Pi OS Bookworm: Zsh 5.9
- Raspberry Pi OS Bullseye: Zsh 5.8
- Raspberry Pi OS Buster: Zsh 5.7.1

#### Installation Steps

**Step 1: Verify your architecture**

```bash
uname -m
```

- `aarch64` = 64-bit ARM (Raspberry Pi 3/4/5 with 64-bit OS)
- `armv7l` = 32-bit ARM (Raspberry Pi 2/3/4 with 32-bit OS)
- `armv6l` = 32-bit ARM (Raspberry Pi Zero/1)

All ARM architectures are supported for Zsh.

**Step 2: Update package lists and install Zsh**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y zsh
```

**Step 3: Verify Zsh installation**

```bash
zsh --version
```

Expected output on 64-bit Raspberry Pi OS:

```
zsh 5.9 (aarch64-unknown-linux-gnu)
```

Or on 32-bit:

```
zsh 5.8 (arm-unknown-linux-gnueabihf)
```

**Step 4: Set Zsh as your default shell**

```bash
sudo usermod --shell $(which zsh) "$USER"
```

**Step 5: Apply the change**

Log out and log back in, or start Zsh manually:

```bash
exec zsh
```

#### Verification

Confirm Zsh is installed and configured:

```bash
# Check the installed version
zsh --version

# Verify Zsh is your default shell
echo "$SHELL"
```

Expected output:

```
/usr/bin/zsh
```

#### Troubleshooting

**Problem**: Installation is very slow

**Solution**: Raspberry Pi SD cards can be slow. Use a high-quality SD card (Class 10 or A1/A2 rated) or boot from USB/SSD for better performance. For headless installations over slow networks, be patient with package downloads.

**Problem**: Package manager lock file errors

**Solution**: Another process may be using apt. Wait for it to complete or remove stale lock files:

```bash
sudo rm -f /var/lib/apt/lists/lock /var/cache/apt/archives/lock /var/lib/dpkg/lock*
sudo dpkg --configure -a
```

**Problem**: Zsh prompts are slow to render

**Solution**: Complex Zsh prompts (especially those with git status) can be slow on older Raspberry Pi models. Use a simpler prompt configuration:

```bash
# Add to ~/.zshrc for a minimal prompt
PROMPT='%n@%m:%~%# '
```

---

### Amazon Linux / RHEL / Fedora (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8+, or Fedora 38+
- sudo privileges
- Terminal access

**Zsh Versions by Distribution**:
- Amazon Linux 2023: Zsh 5.9
- Amazon Linux 2: Zsh 5.8.1
- RHEL 9: Zsh 5.8
- RHEL 8: Zsh 5.5.1
- Fedora 39/40: Zsh 5.9

**Package Manager Notes**:
- Amazon Linux 2023, RHEL 8+, and Fedora use DNF
- Amazon Linux 2 and RHEL 7 use YUM
- Amazon Linux 2023 provides a `yum` symlink that points to `dnf` for compatibility

#### Installation Steps

**Step 1: Install Zsh**

For Amazon Linux 2023 / RHEL 8+ / Fedora (DNF):

```bash
sudo dnf install -y zsh
```

For Amazon Linux 2 / RHEL 7 (YUM):

```bash
sudo yum install -y zsh
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Step 2: Verify Zsh installation**

```bash
zsh --version
```

Expected output (version numbers may vary):

```
zsh 5.9 (x86_64-redhat-linux-gnu)
```

**Step 3: Set Zsh as your default shell**

For Amazon Linux / RHEL:

```bash
sudo usermod --shell $(which zsh) "$USER"
```

For Fedora (recent versions may require `lchsh`):

```bash
sudo usermod --shell $(which zsh) "$USER"
```

**Note**: Some Fedora versions use `lchsh` instead of `chsh`. If `chsh` prompts for a password in automation scripts, use `usermod` with sudo as shown above.

**Step 4: Apply the change**

Log out and log back in, or start Zsh manually:

```bash
exec zsh
```

#### Verification

Confirm Zsh is installed and configured:

```bash
# Check the installed version
zsh --version

# Verify Zsh is your default shell
echo "$SHELL"

# Check the shell entry for your user
grep "$USER" /etc/passwd | cut -d: -f7
```

Expected output for the default shell:

```
/usr/bin/zsh
```

#### Troubleshooting

**Problem**: `No match for argument: zsh` on Amazon Linux 2

**Solution**: Update the yum cache and retry:

```bash
sudo yum makecache
sudo yum install -y zsh
```

**Problem**: `chsh: command not found` on some minimal installations

**Solution**: Install the `util-linux-user` package which provides `chsh`:

```bash
# DNF-based systems
sudo dnf install -y util-linux-user

# YUM-based systems
sudo yum install -y util-linux-user
```

Alternatively, use `usermod` which is always available:

```bash
sudo usermod --shell $(which zsh) "$USER"
```

**Problem**: `lchsh: command not found` on Fedora

**Solution**: Use `chsh` or `usermod` instead:

```bash
sudo usermod --shell $(which zsh) "$USER"
```

**Problem**: EC2 default user (ec2-user) cannot change shell

**Solution**: On EC2 instances, you may need to set a password for the user first, or use `usermod` with sudo:

```bash
sudo usermod --shell $(which zsh) ec2-user
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within the WSL distribution

WSL provides a full Linux environment where Zsh runs natively. The installation follows the Ubuntu/Debian process.

#### Installation Steps

**Step 1: Open WSL Ubuntu terminal**

From Windows, open PowerShell or Command Prompt and run:

```powershell
wsl
```

Or open the Ubuntu app from the Start menu.

**Step 2: Update package lists and install Zsh**

Within WSL Ubuntu:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y zsh
```

**Step 3: Verify Zsh installation**

```bash
zsh --version
```

Expected output (version numbers may vary):

```
zsh 5.9 (x86_64-ubuntu-linux-gnu)
```

**Step 4: Set Zsh as your default shell**

```bash
sudo usermod --shell $(which zsh) "$USER"
```

**Step 5: Configure WSL to start Zsh automatically**

WSL may not always respect the default shell setting. Add the following to the end of your `~/.bashrc` to ensure Zsh starts:

```bash
cat >> ~/.bashrc << 'EOF'

# Auto-launch Zsh in WSL
if [ -t 1 ] && [ -x /usr/bin/zsh ]; then
    exec /usr/bin/zsh
fi
EOF
```

This snippet checks if the session is interactive (`-t 1`) and if Zsh is executable, then replaces Bash with Zsh.

**Step 6: Restart WSL**

Close all WSL terminals and restart WSL from PowerShell:

```powershell
wsl --shutdown
wsl
```

#### Verification

Confirm Zsh is installed and running:

```bash
# Check the Zsh version
zsh --version

# Verify the current shell
echo $0

# Check the configured default shell
echo "$SHELL"
```

Expected output for `echo $0`:

```
zsh
```

#### Troubleshooting

**Problem**: WSL still starts Bash instead of Zsh

**Solution**: Add the auto-launch snippet to `~/.bashrc` as shown in Step 5. WSL sometimes ignores the system default shell setting.

**Problem**: Windows Terminal shows Bash prompt briefly before Zsh

**Solution**: This is expected behavior when using the `~/.bashrc` auto-launch method. The brief Bash initialization is normal.

**Problem**: Zsh configuration not loading

**Solution**: Create a `~/.zshrc` file if it does not exist:

```bash
touch ~/.zshrc
```

**Problem**: `apt-get update` fails inside WSL

**Solution**: DNS resolution may be failing. Create or modify `/etc/wsl.conf`:

```bash
sudo tee /etc/wsl.conf > /dev/null << 'EOF'
[network]
generateResolvConf = false
EOF

sudo rm -f /etc/resolv.conf
sudo tee /etc/resolv.conf > /dev/null << 'EOF'
nameserver 8.8.8.8
nameserver 8.8.4.4
EOF
```

Restart WSL from PowerShell:

```powershell
wsl --shutdown
```

---

### Windows (Native) - Not Supported

#### Platform Status

Zsh is **not supported** on native Windows environments (PowerShell, Command Prompt).

Zsh is a Unix shell that requires a POSIX-compatible environment. Windows does not natively provide this environment.

#### Recommended Alternative

Use WSL (Windows Subsystem for Linux) to run Zsh on Windows. WSL provides a full Linux environment where Zsh runs natively.

To install WSL from an Administrator PowerShell:

```powershell
wsl --install
```

After installation and reboot, follow the WSL (Ubuntu) installation steps above.

---

### Git Bash - Not Supported

#### Platform Status

Zsh is **not supported** in Git Bash on Windows.

Git Bash uses a MinGW-based environment that provides Bash, not Zsh. While Git Bash includes many Unix utilities, it does not support alternative shells like Zsh.

#### Recommended Alternatives

**Option 1: Use WSL (Windows Subsystem for Linux)**

WSL provides a full Linux environment where you can install and use Zsh. See the WSL installation section above.

```powershell
wsl --install
```

**Option 2: Continue using Bash with enhancements**

If you prefer to stay in Git Bash, consider enhancing it with:

- [Oh My Bash](https://github.com/ohmybash/oh-my-bash) - A framework similar to Oh My Zsh but for Bash:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/ohmybash/oh-my-bash/master/tools/install.sh)"
```

**Option 3: Use PowerShell with Oh My Posh**

For a modern Windows shell experience, consider [Oh My Posh](https://ohmyposh.dev/) with PowerShell:

```powershell
winget install --id JanDeDobbeleer.OhMyPosh --silent --accept-package-agreements --accept-source-agreements
```

---

## Post-Installation Configuration

After installing Zsh on any platform, consider these common configuration steps.

### Create Shell Configuration Files

Zsh reads configuration files in a specific order. Create these files if they do not exist:

```bash
# Main configuration file (loaded for interactive shells)
touch ~/.zshrc

# Environment variables (loaded for all shells, including scripts)
touch ~/.zshenv

# Login shell configuration
touch ~/.zprofile
```

### Set Common Environment Variables

Add useful environment variables to your `~/.zshrc`:

```bash
cat >> ~/.zshrc << 'EOF'

# History configuration
export HISTSIZE=10000
export HISTFILESIZE=20000
export SAVEHIST=10000
export HISTFILE=~/.zsh_history
setopt SHARE_HISTORY          # Share history between sessions
setopt HIST_IGNORE_DUPS       # Ignore duplicate commands
setopt HIST_IGNORE_SPACE      # Ignore commands starting with space

# Better defaults
export EDITOR=vim
export VISUAL=vim
export PAGER=less

# Enable colors
autoload -U colors && colors
EOF
```

### Enable Zsh Completion System

Zsh has a powerful completion system. Enable it by adding to `~/.zshrc`:

```bash
cat >> ~/.zshrc << 'EOF'

# Enable completion system
autoload -Uz compinit && compinit

# Case-insensitive completion
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'

# Menu-style completion
zstyle ':completion:*' menu select
EOF
```

### Install Oh My Zsh (Optional)

Oh My Zsh is a popular framework that provides themes, plugins, and helpful defaults:

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
```

The `--unattended` flag enables non-interactive installation suitable for automation.

For detailed Oh My Zsh configuration, see the [Oh My Zsh documentation](https://github.com/ohmyzsh/ohmyzsh/wiki).

### Verify Configuration

After making changes, reload your configuration:

```bash
source ~/.zshrc
```

Check that your settings are applied:

```bash
echo "HISTSIZE: $HISTSIZE"
echo "EDITOR: $EDITOR"
```

---

## Common Issues

### Issue: Scripts Written for Bash Fail in Zsh

**Symptoms**: Shell scripts with `#!/bin/bash` work, but scripts with `#!/bin/sh` or no shebang fail with syntax errors.

**Solution**: Zsh is not fully compatible with Bash or POSIX sh. Ensure scripts have the correct shebang:

```bash
#!/bin/bash
# For Bash scripts

#!/bin/zsh
# For Zsh scripts

#!/bin/sh
# For POSIX-compliant scripts
```

Running scripts with an explicit interpreter bypasses the shell:

```bash
bash ./script.sh
zsh ./script.zsh
```

### Issue: Zsh Completion Not Working

**Symptoms**: Tab completion does not work or shows errors.

**Solution**: Initialize the completion system in your `~/.zshrc`:

```bash
autoload -Uz compinit && compinit
```

If you see "insecure directories" warnings:

```bash
compaudit | xargs chmod g-w,o-w
```

### Issue: Arrow Keys Print Escape Codes

**Symptoms**: Arrow keys print `^[[A`, `^[[B`, etc. instead of navigating history.

**Solution**: Add key bindings to `~/.zshrc`:

```bash
# Use Emacs-style key bindings
bindkey -e

# Or explicitly bind arrow keys
bindkey '^[[A' up-line-or-history
bindkey '^[[B' down-line-or-history
bindkey '^[[C' forward-char
bindkey '^[[D' backward-char
```

### Issue: Environment Variables from Bash Not Available

**Symptoms**: Variables set in `~/.bashrc` or `~/.bash_profile` are not available in Zsh.

**Solution**: Zsh uses different configuration files. Move or copy your environment variable exports to `~/.zshrc` or `~/.zshenv`:

```bash
# Copy relevant exports from Bash config to Zsh config
grep '^export' ~/.bashrc >> ~/.zshrc
```

### Issue: PATH Differs Between Bash and Zsh

**Symptoms**: Commands available in Bash are not found in Zsh.

**Solution**: Check and update your PATH in `~/.zshrc`:

```bash
# Add common paths
export PATH="$HOME/bin:/usr/local/bin:$PATH"

# For Homebrew on Apple Silicon
export PATH="/opt/homebrew/bin:$PATH"
```

### Issue: Shell Prompt Is Plain or Missing Colors

**Symptoms**: Zsh prompt shows `%` without colors or customization.

**Solution**: Configure a prompt in `~/.zshrc`:

```bash
# Simple colorful prompt
PROMPT='%F{green}%n@%m%f:%F{blue}%~%f%# '

# Or enable colors first
autoload -U colors && colors
PROMPT="%{$fg[green]%}%n@%m%{$reset_color%}:%{$fg[blue]%}%~%{$reset_color%}%# "
```

Or install Oh My Zsh for pre-configured themes.

---

## References

- [Zsh Official Website](https://www.zsh.org/)
- [Zsh Official Manual](https://zsh.sourceforge.io/Doc/Release/index.html)
- [Zsh SourceForge Project](https://zsh.sourceforge.io/)
- [Oh My Zsh Wiki - Installing Zsh](https://github.com/ohmyzsh/ohmyzsh/wiki/Installing-ZSH)
- [Arch Wiki - Zsh](https://wiki.archlinux.org/title/Zsh)
- [Apple Terminal - Change Default Shell](https://support.apple.com/guide/terminal/change-the-default-shell-trml113/mac)
- [Homebrew Zsh Formula](https://formulae.brew.sh/formula/zsh)
- [Ubuntu Zsh Package](https://packages.ubuntu.com/zsh)
- [Fedora Magazine - Set Up Zsh](https://fedoramagazine.org/set-zsh-fedora-system/)
- [Amazon Linux Package Management](https://docs.aws.amazon.com/linux/al2023/ug/package-management.html)
- [Microsoft WSL Documentation](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Oh My Zsh](https://ohmyz.sh/)
- [Zsh Users - GitHub Organization](https://github.com/zsh-users)
