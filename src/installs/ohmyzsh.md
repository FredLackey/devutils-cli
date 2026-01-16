# Installing Oh My Zsh

## Overview

Oh My Zsh is an open-source, community-driven framework for managing your Zsh configuration. It comes bundled with thousands of helpful functions, plugins, themes, and features that make working in the terminal more efficient and enjoyable. With over 2,400 contributors and 300+ plugins, Oh My Zsh has become the most popular Zsh configuration framework.

Oh My Zsh provides:

- **300+ plugins** for common tools (git, docker, npm, kubectl, aws, and many more)
- **140+ themes** for customizing your terminal prompt appearance
- **Auto-update mechanism** to keep your installation current
- **Plugin management** for easy addition and removal of functionality
- **Aliases and functions** for common commands and workflows

This guide documents Oh My Zsh installation procedures for all platforms supported by DevUtils CLI. Because Oh My Zsh is a Zsh configuration framework, Zsh must be installed as a prerequisite on all platforms.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `zsh` - Pre-installed on macOS 10.15 (Catalina) and later as the default shell. For older macOS versions, install via `brew install --quiet zsh`
  - `curl` - Pre-installed on macOS. For the latest version, install via `brew install --quiet curl` or run `dev install curl`
  - `git` - Pre-installed via Xcode Command Line Tools or install via `brew install --quiet git` or run `dev install git`
- **Optional:** None
- **Auto-installed:**
  - Oh My Zsh plugins directory structure
  - Default `.zshrc` configuration file (backs up existing `.zshrc` to `.zshrc.pre-oh-my-zsh`)

### Ubuntu/Debian (APT)
- **Required:**
  - `zsh` - Install via `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y zsh`
  - `curl` - Install via `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl` or run `dev install curl`
  - `git` - Install via `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git` or run `dev install git`
- **Optional:** None
- **Auto-installed:**
  - Oh My Zsh plugins directory structure
  - Default `.zshrc` configuration file

### Raspberry Pi OS (APT)
- **Required:**
  - `zsh` - Install via `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y zsh`
  - `curl` - Install via `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl` or run `dev install curl`
  - `git` - Install via `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git` or run `dev install git`
- **Optional:** None
- **Auto-installed:**
  - Oh My Zsh plugins directory structure
  - Default `.zshrc` configuration file

### Amazon Linux/RHEL/Fedora (DNF/YUM)
- **Required:**
  - `zsh` - Install via `sudo dnf install -y zsh` (AL2023/RHEL 8+/Fedora) or `sudo yum install -y zsh` (AL2/RHEL 7)
  - `curl` - Install via `sudo dnf install -y curl` or `sudo yum install -y curl` or run `dev install curl`
  - `git` - Install via `sudo dnf install -y git` or `sudo yum install -y git` or run `dev install git`
- **Optional:** None
- **Auto-installed:**
  - Oh My Zsh plugins directory structure
  - Default `.zshrc` configuration file

### WSL (Ubuntu)
- **Required:**
  - `zsh` - Install via `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y zsh`
  - `curl` - Install via `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl` or run `dev install curl`
  - `git` - Install via `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git` or run `dev install git`
- **Optional:** None
- **Auto-installed:**
  - Oh My Zsh plugins directory structure
  - Default `.zshrc` configuration file

**Note**: Oh My Zsh is not supported on native Windows (PowerShell, Command Prompt) or Git Bash environments. For Windows users, install Oh My Zsh within WSL (Windows Subsystem for Linux) instead.

## Prerequisites

Before installing Oh My Zsh on any platform, ensure:

1. **Internet connectivity** - Required to download Oh My Zsh from GitHub
2. **Terminal access** - Command line interface to run installation commands
3. **sudo privileges** - Required for installing Zsh if not already present (Linux platforms)
4. **Zsh shell** - Must be installed before Oh My Zsh (installation steps provided below)
5. **curl or wget** - Required for downloading the installation script
6. **git** - Required for cloning the Oh My Zsh repository

**Important**: The Oh My Zsh installer will:
- Back up your existing `~/.zshrc` to `~/.zshrc.pre-oh-my-zsh`
- Create a new `~/.zshrc` with Oh My Zsh configuration
- Clone the Oh My Zsh repository to `~/.oh-my-zsh`

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma or later recommended)
- Homebrew package manager installed
- Terminal access via Terminal.app or iTerm2

macOS 10.15 (Catalina) and later include Zsh as the default shell. You can verify this by running `echo $SHELL`. If it shows `/bin/zsh`, Zsh is already your default shell.

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

**Step 1: Verify Zsh is installed and set as default shell**

```bash
zsh --version
```

Expected output (version numbers may vary):

```
zsh 5.9 (x86_64-apple-darwin23.0)
```

If Zsh is not installed (older macOS versions), install it:

```bash
brew install --quiet zsh
```

**Step 2: Ensure curl and git are available**

These are typically pre-installed on macOS. Verify:

```bash
curl --version && git --version
```

If either is missing, install via Homebrew:

```bash
brew install --quiet curl git
```

**Step 3: Install Oh My Zsh non-interactively**

Run the following command for a fully unattended installation:

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
```

The `--unattended` flag:
- Prevents the installer from changing your default shell automatically
- Does not launch Zsh after installation
- Enables fully non-interactive execution suitable for scripts and automation

**Step 4: Set Zsh as your default shell (if not already)**

Check your current default shell:

```bash
echo $SHELL
```

If it does not show `/bin/zsh`, set Zsh as your default:

```bash
sudo chsh -s /bin/zsh $(whoami)
```

**Step 5: Apply the configuration**

Start a new Zsh session or source the configuration:

```bash
source ~/.zshrc
```

#### Verification

Confirm Oh My Zsh is installed correctly:

```bash
ls ~/.oh-my-zsh
```

Expected output should show directories including `plugins`, `themes`, `lib`, `templates`, and others.

Verify the Oh My Zsh configuration is loaded:

```bash
echo $ZSH
```

Expected output:

```
/Users/<your-username>/.oh-my-zsh
```

Check that plugins and themes are available:

```bash
ls ~/.oh-my-zsh/plugins | head -10
```

This should list plugin directories like `git`, `docker`, `npm`, etc.

#### Troubleshooting

**Problem**: `zsh: command not found: omz` after installation

**Solution**: Oh My Zsh does not provide an `omz` command by default in older versions. Source your configuration:

```bash
source ~/.zshrc
```

**Problem**: Existing `.zshrc` customizations are lost

**Solution**: Oh My Zsh backs up your original configuration. Restore customizations from the backup:

```bash
cat ~/.zshrc.pre-oh-my-zsh
```

Copy any custom settings from the backup into your new `~/.zshrc` file.

**Problem**: Oh My Zsh installation fails with "git clone failed"

**Solution**: Ensure git is installed and you have internet connectivity:

```bash
brew install --quiet git
ping -c 3 github.com
```

**Problem**: Themes or prompts do not display correctly (missing symbols)

**Solution**: Install a Nerd Font or Powerline-compatible font. Many Oh My Zsh themes require special font glyphs. Install a compatible font:

```bash
brew tap homebrew/cask-fonts
brew install --cask font-meslo-lg-nerd-font
```

Then configure your terminal to use the installed font.

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- Internet connectivity

Ubuntu and Debian use Bash as the default shell. You must install Zsh before installing Oh My Zsh.

#### Installation Steps

**Step 1: Update package lists and install Zsh**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y zsh
```

Verify Zsh installation:

```bash
zsh --version
```

Expected output (version numbers may vary):

```
zsh 5.9 (x86_64-ubuntu-linux-gnu)
```

**Step 2: Install curl and git**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl git
```

**Step 3: Install Oh My Zsh non-interactively**

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
```

**Step 4: Set Zsh as your default shell**

```bash
sudo chsh -s $(which zsh) $(whoami)
```

**Step 5: Start a new Zsh session**

Log out and log back in, or start a new terminal session. Alternatively, start Zsh manually:

```bash
zsh
```

Then source the configuration:

```bash
source ~/.zshrc
```

#### Verification

Confirm Oh My Zsh is installed:

```bash
ls ~/.oh-my-zsh
```

Expected output should show directories including `plugins`, `themes`, `lib`, `templates`.

Verify the ZSH variable is set:

```bash
echo $ZSH
```

Expected output:

```
/home/<your-username>/.oh-my-zsh
```

Verify Zsh is your default shell:

```bash
echo $SHELL
```

Expected output:

```
/usr/bin/zsh
```

#### Troubleshooting

**Problem**: `chsh: PAM: Authentication failure`

**Solution**: The `chsh` command requires your password. For automated scripts, you can modify `/etc/passwd` directly with sudo:

```bash
sudo sed -i "s|$(whoami):/bin/bash|$(whoami):$(which zsh)|" /etc/passwd
```

**Problem**: Oh My Zsh is not loaded in new sessions

**Solution**: Ensure Zsh is your default shell and `.zshrc` exists:

```bash
cat ~/.zshrc | head -5
```

The file should contain `export ZSH="$HOME/.oh-my-zsh"` near the top.

**Problem**: `E: Unable to locate package zsh`

**Solution**: Update your package lists:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Slow shell startup after installing Oh My Zsh

**Solution**: Disable plugins you do not use. Edit `~/.zshrc` and reduce the plugins list:

```bash
# In ~/.zshrc, change:
plugins=(git)
# Instead of:
plugins=(git docker npm node kubectl aws gcloud ...)
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm, Bullseye, or Buster) - 32-bit or 64-bit
- Raspberry Pi 2 or later (Raspberry Pi 3B+ or later recommended)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so the installation follows the same APT-based process.

#### Installation Steps

**Step 1: Verify your architecture**

```bash
uname -m
```

- `aarch64` = 64-bit ARM (Raspberry Pi 3/4/5 with 64-bit OS)
- `armv7l` = 32-bit ARM (Raspberry Pi 2/3/4 with 32-bit OS)
- `armv6l` = 32-bit ARM (Raspberry Pi Zero/1)

All architectures are supported for Oh My Zsh.

**Step 2: Update package lists and install Zsh**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y zsh
```

Verify Zsh installation:

```bash
zsh --version
```

**Step 3: Install curl and git**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl git
```

**Step 4: Install Oh My Zsh non-interactively**

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
```

**Step 5: Set Zsh as your default shell**

```bash
sudo chsh -s $(which zsh) $(whoami)
```

**Step 6: Apply the configuration**

Log out and log back in, or start Zsh manually:

```bash
zsh
source ~/.zshrc
```

#### Verification

Confirm Oh My Zsh is installed:

```bash
ls ~/.oh-my-zsh
```

Verify the ZSH variable is set:

```bash
echo $ZSH
```

Expected output:

```
/home/pi/.oh-my-zsh
```

(Replace `pi` with your username if different.)

#### Troubleshooting

**Problem**: Installation is very slow

**Solution**: Raspberry Pi SD cards can be slow. Use a high-quality SD card (Class 10 or A1/A2 rated) or boot from USB/SSD for better performance.

**Problem**: Oh My Zsh themes cause slow prompt rendering

**Solution**: Some complex themes (like Powerlevel10k) can be slow on older Raspberry Pi models. Use a simpler theme:

```bash
# Edit ~/.zshrc and change ZSH_THEME
ZSH_THEME="robbyrussell"
```

**Problem**: Fonts do not display correctly over SSH

**Solution**: Terminal fonts are rendered by your local machine, not the Raspberry Pi. Install a Nerd Font on your local machine and configure your SSH client to use it.

**Problem**: `git clone` fails during installation

**Solution**: Check your internet connection. If using WiFi, consider using Ethernet for more stable connectivity:

```bash
ping -c 3 github.com
```

---

### Amazon Linux/RHEL/Fedora (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8+, or Fedora 38+
- sudo privileges
- Internet connectivity

Amazon Linux 2023 and RHEL 8+ use DNF. Amazon Linux 2 and RHEL 7 use YUM.

**Important**: Amazon Linux 2 reaches end of support on June 30, 2026. Consider migrating to Amazon Linux 2023.

#### Installation Steps

**Step 1: Install Zsh**

For Amazon Linux 2023 / RHEL 8+ / Fedora:

```bash
sudo dnf install -y zsh
```

For Amazon Linux 2 / RHEL 7:

```bash
sudo yum install -y zsh
```

Verify Zsh installation:

```bash
zsh --version
```

Expected output (version numbers may vary):

```
zsh 5.9 (x86_64-redhat-linux-gnu)
```

**Step 2: Install curl and git**

For DNF-based systems:

```bash
sudo dnf install -y curl git
```

For YUM-based systems:

```bash
sudo yum install -y curl git
```

**Step 3: Install Oh My Zsh non-interactively**

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
```

**Step 4: Set Zsh as your default shell**

For Fedora (recent versions use `lchsh`):

```bash
sudo lchsh $(whoami)
```

When prompted, enter `/usr/bin/zsh`.

For Amazon Linux / RHEL:

```bash
sudo chsh -s $(which zsh) $(whoami)
```

**Step 5: Apply the configuration**

Log out and log back in, or start Zsh manually:

```bash
zsh
source ~/.zshrc
```

#### Verification

Confirm Oh My Zsh is installed:

```bash
ls ~/.oh-my-zsh
```

Verify the ZSH variable is set:

```bash
echo $ZSH
```

Expected output:

```
/home/ec2-user/.oh-my-zsh
```

(Username varies: `ec2-user` on EC2, `fedora` on Fedora Cloud, or your custom username.)

Verify Zsh is your default shell:

```bash
echo $SHELL
```

Expected output:

```
/usr/bin/zsh
```

#### Troubleshooting

**Problem**: `lchsh: command not found` on older Fedora

**Solution**: Use `chsh` instead:

```bash
sudo chsh -s $(which zsh) $(whoami)
```

**Problem**: `chsh` requires password in automation scripts

**Solution**: Modify `/etc/passwd` directly:

```bash
sudo sed -i "s|$(whoami):/bin/bash|$(whoami):$(which zsh)|" /etc/passwd
```

**Problem**: `No match for argument: zsh` on Amazon Linux 2

**Solution**: Update the yum cache:

```bash
sudo yum makecache
sudo yum install -y zsh
```

**Problem**: Oh My Zsh not loaded in new SSH sessions on EC2

**Solution**: Ensure `.bashrc` or `.bash_profile` is not overriding the shell. Verify your default shell:

```bash
grep $(whoami) /etc/passwd
```

The last field should be `/usr/bin/zsh` or `/bin/zsh`.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

WSL runs a full Linux environment. The installation follows the Ubuntu/Debian process.

#### Installation Steps

**Step 1: Update package lists and install Zsh**

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y zsh
```

Verify Zsh installation:

```bash
zsh --version
```

**Step 2: Install curl and git**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl git
```

**Step 3: Install Oh My Zsh non-interactively**

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
```

**Step 4: Set Zsh as your default shell**

```bash
sudo chsh -s $(which zsh) $(whoami)
```

**Step 5: Configure Windows Terminal (optional but recommended)**

To have WSL launch Zsh by default in Windows Terminal, you can add this to the end of your `~/.bashrc`:

```bash
# Auto-launch Zsh in WSL
if [ -t 1 ] && [ -x /usr/bin/zsh ]; then
    exec /usr/bin/zsh
fi
```

Alternatively, close and reopen WSL. The new default shell should be Zsh.

**Step 6: Apply the configuration**

```bash
zsh
source ~/.zshrc
```

#### Verification

Confirm Oh My Zsh is installed:

```bash
ls ~/.oh-my-zsh
```

Verify the ZSH variable is set:

```bash
echo $ZSH
```

Expected output:

```
/home/<your-wsl-username>/.oh-my-zsh
```

Verify Zsh is running:

```bash
echo $0
```

Expected output:

```
zsh
```

#### Troubleshooting

**Problem**: `chsh` does not work in WSL

**Solution**: WSL may not respect `chsh` changes. Add the auto-launch snippet to `~/.bashrc`:

```bash
cat >> ~/.bashrc << 'EOF'

# Auto-launch Zsh in WSL
if [ -t 1 ] && [ -x /usr/bin/zsh ]; then
    exec /usr/bin/zsh
fi
EOF
```

**Problem**: Windows Terminal still shows Bash prompt

**Solution**: Close all WSL terminals and restart WSL:

```powershell
# In Windows PowerShell
wsl --shutdown
wsl
```

**Problem**: Oh My Zsh themes display incorrectly in Windows Terminal

**Solution**: Install a Nerd Font on Windows and configure Windows Terminal to use it:

1. Download a Nerd Font from https://www.nerdfonts.com/font-downloads (MesloLGS NF recommended)
2. Install the font on Windows by double-clicking the .ttf file
3. Open Windows Terminal settings (Ctrl+,)
4. Select your Ubuntu profile
5. Under "Appearance", set "Font face" to your installed Nerd Font

**Problem**: Slow startup in WSL

**Solution**: Windows Defender scanning can slow WSL. Add exclusions for WSL directories:

```powershell
# Run in Windows PowerShell as Administrator
Add-MpPreference -ExclusionPath "\\wsl$\Ubuntu"
Add-MpPreference -ExclusionPath "$env:LOCALAPPDATA\Packages\*Ubuntu*"
```

---

### Git Bash (Not Supported)

#### Platform Status

Oh My Zsh is **not supported** on Git Bash (Windows).

Oh My Zsh is a framework specifically designed for the Zsh shell, which is not available on native Windows environments. Git Bash uses a MinGW-based Bash shell and does not support Zsh.

#### Recommended Alternatives

**Option 1: Use WSL (Windows Subsystem for Linux)**

WSL provides a full Linux environment where you can install and use Oh My Zsh. See the WSL installation section above.

To install WSL from an Administrator PowerShell:

```powershell
wsl --install
```

After installation and reboot, follow the WSL (Ubuntu) installation steps.

**Option 2: Use Oh My Bash**

If you prefer to stay in Git Bash, consider [Oh My Bash](https://github.com/ohmybash/oh-my-bash), which provides similar functionality for Bash:

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

After installing Oh My Zsh on any platform, consider these common configurations.

### Changing the Theme

Oh My Zsh includes 140+ themes. View available themes:

```bash
ls ~/.oh-my-zsh/themes
```

Change your theme by editing `~/.zshrc`:

```bash
# Edit ~/.zshrc and change ZSH_THEME
ZSH_THEME="agnoster"
```

Popular themes include:
- `robbyrussell` (default) - Simple and clean
- `agnoster` - Informative with git status (requires Powerline font)
- `avit` - Minimal two-line prompt
- `bira` - Colorful with user/host info

Apply the change:

```bash
source ~/.zshrc
```

### Enabling Plugins

Oh My Zsh includes 300+ plugins. View available plugins:

```bash
ls ~/.oh-my-zsh/plugins
```

Enable plugins by editing the `plugins` line in `~/.zshrc`:

```bash
plugins=(git docker npm node kubectl aws)
```

Commonly used plugins:
- `git` - Git aliases and functions (enabled by default)
- `docker` - Docker command completion
- `npm` / `yarn` - Node.js package manager completions
- `kubectl` - Kubernetes command completion
- `aws` - AWS CLI completions
- `z` - Directory jumping based on frecency
- `history` - History search shortcuts

Apply the change:

```bash
source ~/.zshrc
```

### Installing Custom Plugins

Install third-party plugins to the custom plugins directory:

**zsh-autosuggestions** (suggests commands as you type):

```bash
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

**zsh-syntax-highlighting** (highlights valid commands in green):

```bash
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

Then add them to your plugins list in `~/.zshrc`:

```bash
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)
```

### Updating Oh My Zsh

Oh My Zsh can update itself. Run:

```bash
omz update
```

Or for unattended updates, call the upgrade script directly:

```bash
$ZSH/tools/upgrade.sh
```

To enable automatic updates, ensure this line is in your `~/.zshrc`:

```bash
zstyle ':omz:update' mode auto
```

### Uninstalling Oh My Zsh

To completely remove Oh My Zsh:

```bash
uninstall_oh_my_zsh
```

This will:
- Remove the `~/.oh-my-zsh` directory
- Restore your original `~/.zshrc` from the backup

---

## Common Issues

### Issue: "zsh: command not found" for Various Commands

**Symptoms**: Commands that work in Bash do not work in Zsh.

**Solution**: Your PATH may not be configured correctly. Ensure your PATH includes standard directories:

```bash
export PATH="$HOME/bin:/usr/local/bin:$PATH"
```

Add this line to the top of your `~/.zshrc` if missing.

### Issue: "compinit: insecure directories" Warning

**Symptoms**: Warning message about insecure directories on shell startup.

**Solution**: Fix directory permissions:

```bash
compaudit | xargs chmod g-w,o-w
```

Or suppress the warning by adding this before `source $ZSH/oh-my-zsh.sh` in `~/.zshrc`:

```bash
ZSH_DISABLE_COMPFIX=true
```

### Issue: Slow Shell Startup

**Symptoms**: New terminal windows take several seconds to load.

**Solutions**:

1. **Reduce plugins**: Disable unused plugins in `~/.zshrc`

2. **Use a simpler theme**: Complex themes like Powerlevel10k with extensive git status checks can be slow

3. **Profile startup time**:

```bash
time zsh -i -c exit
```

4. **Lazy-load NVM and similar tools**: See the NVM documentation for lazy-loading configuration

### Issue: Oh My Zsh Not Loading in SSH Sessions

**Symptoms**: SSH sessions start with plain Zsh, not Oh My Zsh.

**Solution**: Ensure your default shell is set correctly:

```bash
grep $(whoami) /etc/passwd
```

The line should end with `/bin/zsh` or `/usr/bin/zsh`.

Also verify `~/.zshrc` is being sourced. For non-login shells, create `~/.zshenv` with:

```bash
source ~/.zshrc
```

### Issue: Themes Display Broken Characters

**Symptoms**: Prompt shows boxes, question marks, or garbled characters.

**Solution**: Install a Nerd Font or Powerline-compatible font:

**On macOS:**

```bash
brew tap homebrew/cask-fonts
brew install --cask font-meslo-lg-nerd-font
```

**On Linux:**

```bash
mkdir -p ~/.local/share/fonts
cd ~/.local/share/fonts
curl -fLo "MesloLGS NF Regular.ttf" https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20Regular.ttf
fc-cache -fv
```

Then configure your terminal emulator to use the installed font.

### Issue: Git Plugin Shows Wrong Branch or Status

**Symptoms**: Git information in prompt is incorrect or outdated.

**Solution**: The git plugin caches information for performance. Force a refresh:

```bash
source ~/.zshrc
```

Or check if you are in a git repository:

```bash
git rev-parse --is-inside-work-tree
```

### Issue: Arrow Keys Not Working in Terminal

**Symptoms**: Arrow keys print escape sequences instead of navigating.

**Solution**: Your terminal may not be set up correctly. Add to `~/.zshrc`:

```bash
bindkey -e  # Use Emacs key bindings
# Or for vi mode:
# bindkey -v
```

---

## References

- [Oh My Zsh Official Website](https://ohmyz.sh/)
- [Oh My Zsh GitHub Repository](https://github.com/ohmyzsh/ohmyzsh)
- [Oh My Zsh Wiki - Installing ZSH](https://github.com/ohmyzsh/ohmyzsh/wiki/Installing-ZSH)
- [Oh My Zsh Wiki - Plugins](https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins)
- [Oh My Zsh Wiki - Themes](https://github.com/ohmyzsh/ohmyzsh/wiki/Themes)
- [Zsh Official Website](https://www.zsh.org/)
- [Zsh Documentation](https://zsh.sourceforge.io/Doc/)
- [Homebrew Zsh Formula](https://formulae.brew.sh/formula/zsh)
- [Nerd Fonts](https://www.nerdfonts.com/)
- [zsh-autosuggestions Plugin](https://github.com/zsh-users/zsh-autosuggestions)
- [zsh-syntax-highlighting Plugin](https://github.com/zsh-users/zsh-syntax-highlighting)
- [Powerlevel10k Theme](https://github.com/romkatv/powerlevel10k)
- [Oh My Bash (Alternative for Bash)](https://github.com/ohmybash/oh-my-bash)
- [Oh My Posh (Alternative for PowerShell)](https://ohmyposh.dev/)
