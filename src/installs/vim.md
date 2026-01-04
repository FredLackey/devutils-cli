# Installing Vim

## Overview

Vim (Vi IMproved) is a highly configurable, open-source text editor built to make creating and changing any kind of text very efficient. Originally released by Bram Moolenaar in 1991 as an improved version of the classic Unix Vi editor, Vim has become one of the most popular text editors among developers and system administrators.

Vim provides:

- Modal editing with distinct modes for inserting text and executing commands
- Extensive customization through configuration files and plugins
- Powerful search and replace with regular expression support
- Multi-window and multi-buffer editing
- Built-in scripting language (Vimscript) and support for external languages (Python, Lua, Ruby)
- Cross-platform availability on virtually every operating system

This guide documents Vim installation procedures for all platforms supported by DevUtils CLI.

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `Homebrew` - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None

### Ubuntu (APT/Snap)
- **Required:**
  - `apt` - Pre-installed on Ubuntu/Debian systems
  - `sudo` - Pre-installed, required for package installation
- **Optional:** None
- **Auto-installed:**
  - `vim-runtime` - Runtime files, automatically installed by APT as a dependency
  - `vim-common` - Common files shared between vim variants, automatically installed by APT

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `apt` - Pre-installed on Raspberry Pi OS (Debian-based)
  - `sudo` - Pre-installed, required for package installation
- **Optional:** None
- **Auto-installed:**
  - `vim-runtime` - Runtime files, automatically installed by APT as a dependency
  - `vim-common` - Common files shared between vim variants, automatically installed by APT

### Amazon Linux (DNF/YUM)
- **Required:**
  - `dnf` (Amazon Linux 2023) or `yum` (Amazon Linux 2) - Pre-installed package manager
  - `sudo` - Pre-installed, required for package installation
- **Optional:** None
- **Auto-installed:**
  - `vim-common` - Common files, automatically installed as a dependency of vim-enhanced
  - `vim-filesystem` - Filesystem layout, automatically installed as a dependency

### Windows (Chocolatey/winget)
- **Required:**
  - `Chocolatey` - Install via PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))` or run `dev install chocolatey`
  - Administrator privileges - Required to run Chocolatey commands
- **Optional:** None
- **Auto-installed:**
  - Runtime libraries - Chocolatey handles all runtime dependencies automatically

### Git Bash (Manual/Portable)
- **Required:**
  - `Chocolatey` - Must be installed on Windows host (see Windows section above) or run `dev install chocolatey`
  - `PowerShell` - Pre-installed on Windows, required to execute Chocolatey commands from Git Bash
  - Windows Vim installation - Installed via `choco install vim -y` in PowerShell
- **Optional:** None
- **Auto-installed:** None (Git Bash inherits the Windows installation via PATH)

## Prerequisites

Before installing Vim on any platform, ensure:

1. **Internet connectivity** - Required to download Vim packages
2. **Administrative privileges** - Required for system-wide installation
3. **Terminal access** - Required to run installation commands

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma or later recommended)
- Homebrew package manager installed
- Command line access via Terminal.app or iTerm2

macOS includes a pre-installed version of Vim (accessible as `vi` or `vim`), but it is typically an older version with limited features. The Homebrew version provides the latest release with full feature support including Python, Lua, and Ruby integration.

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Vim:

```bash
brew install --quiet vim
```

The `--quiet` flag suppresses non-essential output, making the installation suitable for automation and scripts.

#### Verification

Confirm the installation succeeded:

```bash
vim --version | head -1
```

Expected output (version numbers may vary):

```
VIM - Vi IMproved 9.1 (2024 Jan 02, compiled Dec 27 2025 12:00:00)
```

Verify the Homebrew version is being used (not the system version):

```bash
which vim
```

Expected output for Apple Silicon Macs:

```
/opt/homebrew/bin/vim
```

Expected output for Intel Macs:

```
/usr/local/bin/vim
```

#### Troubleshooting

**Problem**: `vim --version` shows an older version after installation

**Solution**: The system version of Vim may be taking precedence. Ensure Homebrew's bin directory is in your PATH before `/usr/bin`:

```bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

For Intel Macs, use `/usr/local/bin` instead of `/opt/homebrew/bin`.

**Problem**: `brew: command not found`

**Solution**: Homebrew is not installed or not in PATH. Install Homebrew first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Problem**: Homebrew reports conflicts with `ex-vi` or `macvim`

**Solution**: The Vim formula conflicts with these packages. Uninstall the conflicting package first:

```bash
brew uninstall ex-vi
# or
brew uninstall macvim
```

Then install Vim:

```bash
brew install --quiet vim
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- Internet connectivity

Ubuntu and Debian include Vim in their default repositories. The `vim` package provides the standard feature set, while `vim-gtk3` or `vim-nox` provide additional features.

#### Installation Steps

Run the following commands to update package lists and install Vim:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures no interactive prompts appear during installation, making this suitable for scripts and automation.

**For a more full-featured version** (includes Python, Perl, Ruby support without GUI):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim-nox
```

#### Verification

Confirm the installation succeeded:

```bash
vim --version | head -1
```

Expected output (version numbers may vary):

```
VIM - Vi IMproved 9.0 (2022 Jun 28, compiled Sep 30 2024 10:24:13)
```

Verify the installation location:

```bash
which vim
```

Expected output:

```
/usr/bin/vim
```

#### Troubleshooting

**Problem**: `E: Unable to locate package vim`

**Solution**: Update your package lists:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Only `vi` is available, not `vim`

**Solution**: The minimal `vim-tiny` package may be installed. Install the full Vim package:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim
```

**Problem**: Vim is installed but lacks Python support

**Solution**: Install the `vim-nox` package for scripting language support:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim-nox
```

**Problem**: Permission errors during installation

**Solution**: Ensure you are using sudo:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye recommended)
- Raspberry Pi 3B+ or later (any model supported by Raspberry Pi OS)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so Vim installation follows the APT method. Vim is available in the default repositories and works on both 32-bit (armhf) and 64-bit (arm64) architectures.

**Note**: Vim is not installed by default on Raspberry Pi OS and must be installed manually.

#### Installation Steps

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM
- `armv7l` = 32-bit ARM

Install Vim using APT:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim
```

The installation command is identical for both 32-bit and 64-bit Raspberry Pi OS. Vim requires approximately 30MB of storage space.

#### Verification

Confirm the installation succeeded:

```bash
vim --version | head -1
```

Expected output (version numbers may vary):

```
VIM - Vi IMproved 9.0 (2022 Jun 28, compiled Sep 30 2024 10:24:13)
```

Verify the installation location:

```bash
which vim
```

Expected output:

```
/usr/bin/vim
```

Test the built-in tutorial:

```bash
vimtutor
```

This launches the interactive Vim tutorial, confirming Vim is working correctly.

#### Troubleshooting

**Problem**: Installation is slow

**Solution**: Raspberry Pi SD cards can be slow. Use a high-quality SD card (Class 10 or A1/A2 rated) or boot from USB/SSD for better performance.

**Problem**: `E: Unable to fetch some archives`

**Solution**: Network connectivity issues. Check your internet connection and retry:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim
```

**Problem**: Package conflicts or broken dependencies

**Solution**: This can occur during repository updates. Fix broken packages before installing:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -f
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim
```

If the issue persists, wait a few hours and try again. Repository synchronization can cause temporary inconsistencies.

**Problem**: `vim-runtime` dependency issues

**Solution**: Install vim-runtime first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim-runtime
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- EC2 instance or compatible environment

Amazon Linux 2023 uses DNF as the default package manager. Amazon Linux 2 uses YUM. Vim is available in the default repositories, though you should install `vim-enhanced` for the full-featured version.

**Note**: The default `vim-minimal` package provides only basic functionality in `/bin/vi`. Install `vim-enhanced` for the complete Vim experience.

#### Installation Steps

**For Amazon Linux 2023 (AL2023):**

```bash
sudo dnf install -y vim-enhanced
```

**For Amazon Linux 2 (AL2):**

```bash
sudo yum install -y vim-enhanced
```

The `-y` flag automatically confirms installation, enabling non-interactive execution.

**Note**: The `vim-enhanced` package provides the full Vim editor with Python, Perl, and other scripting language support. The `vim-minimal` package (often pre-installed) only includes basic vi functionality.

#### Verification

Confirm the installation succeeded:

```bash
vim --version | head -1
```

Expected output (version numbers may vary):

```
VIM - Vi IMproved 9.0 (2022 Jun 28, compiled Oct 01 2024 00:00:00)
```

Verify the installation location:

```bash
which vim
```

Expected output:

```
/usr/bin/vim
```

Check that the full version is installed (not vim-minimal):

```bash
rpm -q vim-enhanced
```

Expected output:

```
vim-enhanced-9.0.xxx-1.amzn2023.x86_64
```

#### Troubleshooting

**Problem**: `vim` command runs but has limited features

**Solution**: You may have `vim-minimal` instead of `vim-enhanced`. Install the full package:

```bash
# For AL2023
sudo dnf install -y vim-enhanced

# For AL2
sudo yum install -y vim-enhanced
```

**Problem**: `No match for argument: vim-enhanced` on Amazon Linux 2

**Solution**: Update the yum cache and retry:

```bash
sudo yum makecache
sudo yum install -y vim-enhanced
```

**Problem**: `Cannot find a valid baseurl for repo`

**Solution**: Network or repository configuration issue. Check connectivity:

```bash
# For AL2023
sudo dnf check-update

# For AL2
sudo yum check-update
```

**Problem**: Multiple Vim versions installed

**Solution**: List installed Vim packages and remove duplicates:

```bash
# For AL2023
sudo dnf list installed | grep vim
sudo dnf remove -y vim-minimal

# For AL2
sudo yum list installed | grep vim
sudo yum remove -y vim-minimal
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 1903 or higher (64-bit), or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install vim -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation suitable for automation and scripts.

This installs:

- **vim.exe** - Terminal-based Vim editor
- **gvim.exe** - Graphical Vim application (GVim)
- **Context menu integration** - "Edit with Vim" option in Windows Explorer
- **Batch files** - `vim.bat`, `gvim.bat`, `view.bat`, and related commands in PATH

**Optional parameters** for customization:

```powershell
# Install without desktop shortcuts and context menu
choco install vim -y --params "'/NoDesktopShortcuts /NoContextmenu'"
```

After installation, close and reopen your terminal to ensure PATH changes take effect.

#### Verification

Open a new Command Prompt or PowerShell window, then run:

```powershell
vim --version
```

Expected output (version numbers may vary):

```
VIM - Vi IMproved 9.1 (2024 Jan 02, compiled Dec 27 2025 00:00:00)
```

Verify the installation location:

```powershell
where vim
```

Expected output:

```
C:\tools\vim\vim91\vim.exe
```

Test GVim (graphical version):

```powershell
gvim
```

This should open the GVim window.

#### Troubleshooting

**Problem**: `'vim' is not recognized as an internal or external command`

**Solution**: Close and reopen your terminal window. If the problem persists, verify Vim is in your PATH:

```powershell
$env:PATH -split ';' | Select-String -Pattern 'vim'
```

If Vim is not listed, add it manually:

```powershell
$env:PATH += ";C:\tools\vim\vim91"
```

**Problem**: Antivirus flags Vim files

**Solution**: This is a known false positive. The official Vim builds are safe. Add an exception for the Vim installation directory in your antivirus software, or download from the official vim-win32-installer repository.

**Problem**: Chocolatey installation fails

**Solution**: Ensure you are running PowerShell as Administrator. Right-click PowerShell and select "Run as administrator".

**Problem**: "Edit with Vim" context menu not appearing

**Solution**: Reinstall with the RestartExplorer parameter:

```powershell
choco uninstall vim -y
choco install vim -y --params "'/RestartExplorer'"
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

WSL runs Ubuntu (or another Linux distribution) within Windows. Vim must be installed separately within WSL, as it does not share binaries with Windows.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim
```

The `DEBIAN_FRONTEND=noninteractive` environment variable prevents any interactive prompts during installation.

**For a more full-featured version** (includes Python, Perl, Ruby support):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim-nox
```

#### Verification

Confirm the installation succeeded:

```bash
vim --version | head -1
```

Expected output (version numbers may vary):

```
VIM - Vi IMproved 9.0 (2022 Jun 28, compiled Sep 30 2024 10:24:13)
```

Verify the installation location:

```bash
which vim
```

Expected output:

```
/usr/bin/vim
```

#### Troubleshooting

**Problem**: Vim version differs between WSL and Windows

**Solution**: This is expected behavior. WSL and Windows maintain separate installations. Use the appropriate Vim for each environment:

- Inside WSL terminal: Use Linux Vim (`/usr/bin/vim`)
- In Windows PowerShell/CMD: Use Windows Vim (if installed via Chocolatey)

**Problem**: Clipboard not shared between WSL Vim and Windows

**Solution**: Install a Vim version with clipboard support and configure it to use Windows clipboard:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim-gtk3
```

Add to your `~/.vimrc`:

```vim
set clipboard=unnamedplus
```

**Problem**: Arrow keys produce letters (A, B, C, D) instead of moving cursor

**Solution**: This occurs when Vim is in compatible mode. Add to your `~/.vimrc`:

```vim
set nocompatible
```

**Problem**: Backspace key does not work as expected

**Solution**: Configure backspace behavior in `~/.vimrc`:

```vim
set backspace=indent,eol,start
```

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git for Windows installed (includes Git Bash)
- Vim installed on Windows (via Chocolatey, as documented above)

Git Bash is a terminal emulator for Windows that provides a Bash shell environment. Git for Windows includes a minimal version of Vim, but for full functionality, install Vim separately on Windows.

**Note**: Git Bash inherits the Windows PATH, so once Vim is installed on Windows via Chocolatey, the `vim` and `gvim` commands are available in Git Bash.

#### Installation Steps

**Step 1: Install Vim on Windows**

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install vim -y
```

**Step 2: Restart Git Bash**

Close and reopen Git Bash to pick up the updated PATH.

**Step 3: Verify Vim is accessible**

In Git Bash, run:

```bash
vim --version | head -1
```

If Vim is not found, add it to your PATH in `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/c/tools/vim/vim91"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

In Git Bash, confirm Vim is accessible:

```bash
vim --version | head -1
```

Expected output (version numbers may vary):

```
VIM - Vi IMproved 9.1 (2024 Jan 02, compiled Dec 27 2025 00:00:00)
```

Verify which Vim is being used:

```bash
which vim
```

Expected output:

```
/c/tools/vim/vim91/vim
```

Test GVim:

```bash
gvim
```

This should open the GVim window.

#### Troubleshooting

**Problem**: `vim: command not found` in Git Bash

**Solution**: Vim may not be in the PATH. Add it to your `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/c/tools/vim/vim91"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Git Bash uses the minimal Vim from Git for Windows instead of full Vim

**Solution**: The Chocolatey Vim should take precedence if PATH is correct. Verify by checking which vim is found first:

```bash
which -a vim
```

If the Git version appears first, reorder your PATH in `~/.bashrc`:

```bash
export PATH="/c/tools/vim/vim91:$PATH"
```

**Problem**: Interactive prompts hang or display incorrectly

**Solution**: Git Bash's mintty terminal has TTY compatibility issues. For interactive Vim sessions requiring special terminal features, use Windows Terminal or PowerShell instead.

**Problem**: Vim configuration file not found

**Solution**: Git Bash uses Windows home directory. Create your Vim configuration at the correct location:

```bash
# Check home directory
echo $HOME

# Create _vimrc in Windows home (Vim on Windows uses _vimrc, not .vimrc)
touch ~/_vimrc
```

---

## Post-Installation Configuration

After installing Vim on any platform, consider these optional but recommended configurations.

### Create a Basic Configuration File

Create a minimal `.vimrc` (Linux/macOS) or `_vimrc` (Windows) file:

**Linux/macOS** (`~/.vimrc`):

```bash
cat > ~/.vimrc << 'EOF'
" Disable compatibility mode with legacy vi
set nocompatible

" Enable syntax highlighting
syntax on

" Show line numbers
set number

" Enable mouse support
set mouse=a

" Set tab width to 4 spaces
set tabstop=4
set shiftwidth=4
set expandtab

" Enable auto-indentation
set autoindent

" Highlight search results
set hlsearch
set incsearch

" Show matching brackets
set showmatch

" Enable file type detection
filetype plugin indent on

" Use system clipboard
set clipboard=unnamedplus
EOF
```

**Windows** (`~/_vimrc` or `C:\Users\<username>\_vimrc`):

```powershell
@"
" Disable compatibility mode with legacy vi
set nocompatible

" Enable syntax highlighting
syntax on

" Show line numbers
set number

" Enable mouse support
set mouse=a

" Set tab width to 4 spaces
set tabstop=4
set shiftwidth=4
set expandtab

" Enable auto-indentation
set autoindent

" Highlight search results
set hlsearch
set incsearch

" Show matching brackets
set showmatch

" Enable file type detection
filetype plugin indent on

" Use system clipboard
set clipboard=unnamed
"@ | Out-File -FilePath "$env:USERPROFILE\_vimrc" -Encoding utf8
```

### Learn Vim Basics

Launch the built-in tutorial to learn essential Vim commands:

```bash
vimtutor
```

This interactive tutorial takes approximately 30 minutes and covers:

- Basic navigation (h, j, k, l)
- Editing commands (i, a, o, d, y, p)
- Saving and quitting (:w, :q, :wq)
- Search and replace

### Set Vim as Default Editor

**For Git:**

```bash
git config --global core.editor "vim"
```

**For shell (Linux/macOS):**

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export EDITOR=vim
export VISUAL=vim
```

---

## Common Issues

### Issue: Arrow Keys Produce Letters (A, B, C, D)

**Symptoms**: Pressing arrow keys in insert mode types letters instead of moving the cursor

**Solution**: Enable nocompatible mode. Add to your `.vimrc`:

```vim
set nocompatible
```

### Issue: Backspace Does Not Delete Characters

**Symptoms**: Backspace key moves cursor but does not delete text

**Solution**: Configure backspace behavior. Add to your `.vimrc`:

```vim
set backspace=indent,eol,start
```

### Issue: Colors Look Wrong or Missing

**Symptoms**: Syntax highlighting has incorrect colors or no colors

**Solution**: Enable true color support. Add to your `.vimrc`:

```vim
set termguicolors
```

If colors still look wrong, your terminal may not support true color. Try:

```vim
set t_Co=256
```

### Issue: Cannot Exit Vim

**Symptoms**: New users get stuck in Vim and cannot exit

**Solution**: To exit Vim:

1. Press `Esc` to ensure you are in normal mode
2. Type `:q` and press `Enter` to quit (if no changes were made)
3. Type `:q!` and press `Enter` to quit without saving changes
4. Type `:wq` and press `Enter` to save and quit

### Issue: Clipboard Not Working

**Symptoms**: Yanking and pasting does not work with system clipboard

**Solution**: Verify Vim was compiled with clipboard support:

```bash
vim --version | grep clipboard
```

Look for `+clipboard`. If you see `-clipboard`, install a version with clipboard support:

**Ubuntu/Debian:**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y vim-gtk3
```

**macOS (Homebrew):**

```bash
brew install --quiet vim
```

(Homebrew Vim includes clipboard support by default)

Then add to `.vimrc`:

```vim
set clipboard=unnamedplus
```

### Issue: Slow Startup Time

**Symptoms**: Vim takes several seconds to start

**Solution**: Profile your startup time:

```bash
vim --startuptime vim.log
cat vim.log
```

Common causes:

- Too many plugins (consider lazy loading)
- Network file systems (NFS, CIFS)
- Complex `.vimrc` configurations

---

## References

- [Vim Official Website](https://www.vim.org/)
- [Vim Official Documentation](https://www.vim.org/docs.php)
- [Vim Download Page](https://www.vim.org/download.php)
- [Vim GitHub Repository](https://github.com/vim/vim)
- [Vim Win32 Installer](https://github.com/vim/vim-win32-installer)
- [Homebrew Vim Formula](https://formulae.brew.sh/formula/vim)
- [Chocolatey Vim Package](https://community.chocolatey.org/packages/vim)
- [Vim on Ubuntu](https://packages.ubuntu.com/search?keywords=vim)
- [Vim on Debian](https://packages.debian.org/search?keywords=vim)
- [Vim Tutorial (vimtutor)](https://vimhelp.org/usr_01.txt.html)
