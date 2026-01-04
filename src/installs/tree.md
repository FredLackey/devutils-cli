# Installing Tree

## Overview

Tree is a recursive directory listing command-line utility that produces a depth-indented listing of files and directories in a tree-like format. It provides a visual representation of a directory structure, making it easy to understand folder hierarchies at a glance. Tree is invaluable for developers, system administrators, and anyone who works with complex directory structures.

Tree displays:
- Directory hierarchy with indentation showing parent-child relationships
- File and directory counts at the end of output
- Optional colorized output when the `LS_COLORS` environment variable is set
- Optional HTML output for documentation purposes

Common use cases include:
- Documenting project structures for README files
- Understanding unfamiliar codebases
- Verifying deployment directory layouts
- Debugging file organization issues
- Generating visual documentation of folder structures

The original Unix tree command was written by Steve Baker and is licensed under the GNU General Public License v2 (GPL-2.0).

## Prerequisites

Before installing tree on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required on most platforms for system-wide installation
3. **Package manager installed** - Each platform requires its respective package manager (Homebrew, APT, DNF/YUM, Chocolatey, etc.)

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma or later recommended)
- Homebrew package manager installed
- Terminal access

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install tree via Homebrew:

```bash
brew install --quiet tree
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts and CI/CD pipelines.

#### Verification

Confirm the installation succeeded:

```bash
tree --version
```

Expected output (version numbers may vary):

```
tree v2.2.1 (c) 1996 - 2024 by Steve Baker, Thomas Moore, Francesc Rocher, Florian Sesser, Kyosuke Tokoro
```

Verify the installation path:

```bash
which tree
```

Expected output: `/opt/homebrew/bin/tree` (Apple Silicon) or `/usr/local/bin/tree` (Intel).

Test the command on a directory:

```bash
tree -L 1 --dirsfirst .
```

This displays the current directory structure limited to one level deep, with directories listed before files.

#### Troubleshooting

**Problem**: `tree: command not found` after installation

**Solution**: Homebrew may not be in your PATH. For Apple Silicon Macs, add Homebrew to your PATH:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For a permanent fix, add this to your shell configuration:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc && source ~/.zshrc
```

**Problem**: `brew install tree` fails with permission errors

**Solution**: Fix Homebrew directory ownership:

```bash
sudo chown -R $(whoami) $(brew --prefix)/*
```

**Problem**: Installation fails with network errors

**Solution**: Check your internet connection and try again. If behind a corporate proxy, configure Homebrew to use it:

```bash
export ALL_PROXY=http://proxy.example.com:8080
brew install --quiet tree
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 LTS or later, or Debian 10 (Buster) or later
- sudo privileges
- Internet connectivity

Tree is available in the default Ubuntu and Debian repositories and does not require adding external PPAs.

#### Installation Steps

Run the following command to update package lists and install tree:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tree
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
tree --version
```

Expected output (version numbers may vary depending on your distribution version):

```
tree v2.1.0 (c) 1996 - 2022 by Steve Baker, Thomas Moore, Francesc Rocher, Florian Sesser, Kyosuke Tokoro
```

Verify the installation path:

```bash
which tree
```

Expected output: `/usr/bin/tree`

Check the installed package version:

```bash
dpkg -l tree
```

#### Troubleshooting

**Problem**: `E: Unable to locate package tree`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: `Permission denied` errors

**Solution**: Ensure you are using `sudo` with the installation command.

**Problem**: Older tree version than expected

**Solution**: Ubuntu/Debian repositories prioritize stability over bleeding-edge releases. The repository version is sufficient for most use cases. For the latest version, you can build from source (see Common Issues section).

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 2 or later (Raspberry Pi 3B+ or later recommended for 64-bit)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so tree installation follows the same APT-based process. The package is available for both ARM architectures (armhf for 32-bit and arm64 for 64-bit).

#### Installation Steps

Run the following command to update package lists and install tree:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tree
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
tree --version
```

Expected output (version numbers may vary):

```
tree v2.1.0 (c) 1996 - 2022 by Steve Baker, Thomas Moore, Francesc Rocher, Florian Sesser, Kyosuke Tokoro
```

Verify your architecture:

```bash
uname -m
```

Expected output: `aarch64` (64-bit) or `armv7l` (32-bit).

Verify the installation path:

```bash
which tree
```

Expected output: `/usr/bin/tree`

#### Troubleshooting

**Problem**: `E: Unable to locate package tree`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Very slow download speeds

**Solution**: Raspberry Pi may have limited bandwidth. Use a wired ethernet connection for faster downloads, or wait for the installation to complete.

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

Tree is available in the default Amazon Linux repositories. Amazon Linux 2023 uses `dnf` as the package manager, while Amazon Linux 2 uses `yum`. On AL2023, `yum` is aliased to `dnf` for backward compatibility.

#### Installation Steps

**For Amazon Linux 2023:**

Run the following command to install tree:

```bash
sudo dnf install -y tree
```

**For Amazon Linux 2:**

Run the following command to install tree:

```bash
sudo yum install -y tree
```

The `-y` flag automatically confirms installation prompts, enabling non-interactive execution.

#### Verification

Confirm the installation succeeded:

```bash
tree --version
```

Expected output (version numbers may vary):

```
tree v2.1.0 (c) 1996 - 2022 by Steve Baker, Thomas Moore, Francesc Rocher, Florian Sesser, Kyosuke Tokoro
```

Check which tree package is installed:

```bash
rpm -q tree
```

Expected output: `tree-2.1.0-2.amzn2023.x86_64` or similar.

#### Troubleshooting

**Problem**: `No match for argument: tree`

**Solution**: Refresh the repository cache:

```bash
sudo dnf makecache
```

Or for Amazon Linux 2:

```bash
sudo yum makecache
```

**Problem**: `dnf: command not found` on Amazon Linux 2

**Solution**: Use `yum` instead of `dnf` on Amazon Linux 2:

```bash
sudo yum install -y tree
```

**Problem**: Permission denied when running tree

**Solution**: This is unusual for tree. Check that the binary has execute permissions:

```bash
ls -la /usr/bin/tree
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 (version 1803+) or Windows 11
- Chocolatey package manager installed
- Administrator PowerShell or Command Prompt

**Note**: Windows includes a built-in `tree` command that displays directory structure in ASCII format. The steps below install the GnuWin32 tree, which provides additional features like colorized output and extended options matching the Unix version.

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install tree -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

Chocolatey installs the GnuWin32 version of tree (version 1.5.2.2), which provides Unix-compatible options and colorized output support.

#### Verification

Open a **new** Command Prompt or PowerShell window (required for PATH to update), then run:

```powershell
tree --version
```

Expected output:

```
tree v1.5.2.2 (c) 2004-2009 by Steve Baker, Thomas Moore, Francesc Rocher, Florian Sesser
```

Verify the installation path:

```powershell
where tree
```

Expected output should include: `C:\ProgramData\chocolatey\bin\tree.exe`

**Note**: You may also see `C:\Windows\System32\tree.com` listed, which is the built-in Windows tree command. The Chocolatey-installed version takes precedence due to PATH ordering.

#### Troubleshooting

**Problem**: `tree --version` shows "Invalid switch" error

**Solution**: The built-in Windows tree command is being invoked instead of the GnuWin32 version. Use the full path:

```powershell
"C:\ProgramData\chocolatey\bin\tree.exe" --version
```

Or ensure Chocolatey's bin directory appears before System32 in your PATH.

**Problem**: `choco` command not found

**Solution**: Chocolatey may not be in PATH. Close all terminal windows, open a new Administrator PowerShell, and try again. If the issue persists, reinstall Chocolatey.

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: Prefer using winget instead of Chocolatey

**Solution**: winget is also supported. Run the following in PowerShell or Command Prompt:

```powershell
winget install --id GnuWin32.Tree --silent --accept-package-agreements --accept-source-agreements
```

The `--silent` flag ensures non-interactive installation.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004+ or Windows 11
- Windows Subsystem for Linux (WSL) with Ubuntu installed
- WSL 2 recommended for best performance
- sudo privileges within WSL

WSL Ubuntu installations follow the same process as native Ubuntu, using APT.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tree
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the installation succeeded:

```bash
tree --version
```

Expected output (version numbers may vary):

```
tree v2.1.0 (c) 1996 - 2022 by Steve Baker, Thomas Moore, Francesc Rocher, Florian Sesser, Kyosuke Tokoro
```

Verify the installation path:

```bash
which tree
```

Expected output: `/usr/bin/tree`

#### Troubleshooting

**Problem**: `E: Unable to locate package tree`

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

**Problem**: Network connectivity issues in WSL

**Solution**: WSL may have DNS resolution issues. Try restarting WSL:

```powershell
# From Windows PowerShell
wsl --shutdown
wsl
```

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or Windows 11
- Git for Windows installed (includes Git Bash)
- Internet connectivity

Git Bash does not include tree by default. You must download the Windows binary and place it in a directory included in Git Bash's PATH.

#### Installation Steps

Open Git Bash and run the following commands:

**Step 1: Create the local bin directory (if it does not exist)**

```bash
mkdir -p /usr/local/bin
```

**Step 2: Download the tree binary from GnuWin32**

First, download the zip file and extract tree.exe:

```bash
curl -L -o /tmp/tree.zip https://downloads.sourceforge.net/gnuwin32/tree-1.5.2.2-bin.zip && unzip -o -j /tmp/tree.zip bin/tree.exe -d /usr/local/bin && rm /tmp/tree.zip
```

This command:
1. Downloads the GnuWin32 tree binary package to a temporary location
2. Extracts only the `tree.exe` file to `/usr/local/bin`
3. Cleans up the temporary zip file

**Alternative: Copy from Chocolatey installation**

If you have already installed tree via Chocolatey on Windows, you can copy the binary to Git Bash:

```bash
cp "/c/ProgramData/chocolatey/bin/tree.exe" /usr/local/bin/
```

**Alternative: Use Windows CMD tree command**

If you prefer not to install anything, you can use the built-in Windows tree command from Git Bash:

```bash
cmd //c tree
```

Note: This uses the Windows version, which has different options than the Unix version.

#### Verification

Confirm the installation succeeded:

```bash
tree --version
```

Expected output:

```
tree v1.5.2.2 (c) 2004-2009 by Steve Baker, Thomas Moore, Francesc Rocher, Florian Sesser
```

Verify tree is accessible:

```bash
which tree
```

Expected output: `/usr/local/bin/tree`

Test the command:

```bash
tree -L 1 .
```

#### Troubleshooting

**Problem**: `tree: command not found`

**Solution**: The `/usr/local/bin` directory may not be in Git Bash's PATH. Add it manually:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

**Problem**: Permission denied when downloading

**Solution**: Run Git Bash as Administrator. Press Windows key, type "Git Bash", then press Ctrl+Shift+Enter.

**Problem**: SSL certificate errors during download

**Solution**: Update the CA certificates or use the `-k` flag (not recommended for production):

```bash
curl -k -L -o /tmp/tree.zip https://downloads.sourceforge.net/gnuwin32/tree-1.5.2.2-bin.zip
```

**Problem**: `unzip: command not found`

**Solution**: Git Bash includes unzip by default in recent versions. If missing, download and extract manually on Windows, then copy tree.exe to the Git Bash bin directory.

**Problem**: Want to install to Git's built-in bin directory

**Solution**: Alternatively, copy to Git's usr/bin directory (requires running Git Bash as Administrator):

```bash
curl -L -o /tmp/tree.zip https://downloads.sourceforge.net/gnuwin32/tree-1.5.2.2-bin.zip && unzip -o -j /tmp/tree.zip bin/tree.exe -d /usr/bin && rm /tmp/tree.zip
```

---

## Post-Installation Configuration

Tree works out of the box for most use cases. The following optional tips may be useful:

### Shell Aliases

Create convenient aliases for common tree operations. Add to your shell configuration file (`~/.bashrc`, `~/.zshrc`, or `~/.bash_profile`):

```bash
# Show directory tree with directories first, limited depth
alias t='tree -L 2 --dirsfirst'

# Show hidden files
alias ta='tree -a -L 2 --dirsfirst'

# Show only directories
alias td='tree -d -L 2'

# Show with file sizes
alias ts='tree -sh --dirsfirst'

# Show with permissions and ownership (Unix-like systems)
alias tl='tree -pughD --dirsfirst'
```

### Colorized Output

Tree supports colorized output when the `LS_COLORS` environment variable is set. Most modern Linux and macOS terminals have this configured by default.

To verify colorized output is working:

```bash
tree -C .
```

The `-C` flag forces color output even when piping to another command.

### Ignoring Directories

To exclude specific directories from tree output (useful for large projects):

```bash
# Exclude node_modules and .git directories
tree -I 'node_modules|.git' -L 3 --dirsfirst
```

### Output to File

Generate a tree structure for documentation:

```bash
# Plain text output
tree -L 3 --dirsfirst > directory_structure.txt

# With charset for universal compatibility
tree -L 3 --dirsfirst --charset=ascii > directory_structure.txt
```

---

## Common Issues

### Issue: Tree Output Truncated in Terminal

**Symptoms**: Large directory trees are cut off or difficult to read.

**Solution**: Pipe tree output to a pager:

```bash
tree -L 3 | less -R
```

The `-R` flag preserves colors in less.

### Issue: Character Encoding Problems

**Symptoms**: Tree lines appear as question marks or garbled characters.

**Solution**: Use ASCII character set for maximum compatibility:

```bash
tree --charset=ascii
```

Or ensure your terminal supports UTF-8:

```bash
export LANG=en_US.UTF-8
tree
```

### Issue: Permission Denied on Some Directories

**Symptoms**: Tree shows "Permission denied" errors for certain directories.

**Solution**: This is expected behavior for directories you do not have read access to. To suppress these errors:

```bash
tree 2>/dev/null
```

Or run with elevated privileges if appropriate:

```bash
sudo tree /path/to/restricted
```

### Issue: Tree Command Not Found After Reboot

**Symptoms**: Tree works in the current session but not after restarting the terminal.

**Solution**: The PATH modification was not persisted. Add the appropriate PATH export to your shell configuration:

For Bash:
```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
```

For Zsh:
```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
```

### Issue: Slow Performance on Large Directories

**Symptoms**: Tree takes a long time to run on directories with many files.

**Solution**: Limit the depth and exclude large directories:

```bash
tree -L 2 -I 'node_modules|.git|vendor|__pycache__' --dirsfirst
```

### Issue: Building from Source

**Symptoms**: Need to build tree from source for the latest version or custom configuration.

**Solution**: Clone the repository and build:

```bash
# Install build dependencies (Ubuntu/Debian)
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential

# Clone and build
git clone https://github.com/Old-Man-Programmer/tree.git
cd tree
make
sudo make install
```

**Note**: On macOS, the Makefile needs adjustment for System Integrity Protection. The binary cannot be installed to `/usr/bin`. Install to `/usr/local/bin` instead:

```bash
make
sudo make PREFIX=/usr/local install
```

---

## References

- [Tree Official Source Code](https://oldmanprogrammer.net/source.php?dir=projects/tree)
- [Tree GitHub Repository](https://github.com/Old-Man-Programmer/tree)
- [Tree GitLab Mirror](https://gitlab.com/OldManProgrammer/unix-tree)
- [Tree Homebrew Formula](https://formulae.brew.sh/formula/tree)
- [Tree Chocolatey Package](https://community.chocolatey.org/packages/tree)
- [GnuWin32 Tree for Windows](https://gnuwin32.sourceforge.net/packages/tree.htm)
- [GnuWin32 Tree winget Package](https://winget.run/pkg/GnuWin32/Tree)
- [Tree Linux Man Page](https://linux.die.net/man/1/tree)
- [Tree Command Wikipedia](https://en.wikipedia.org/wiki/Tree_(command))
- [Git Bash Tree Installation Guide](https://dev.to/flyingduck92/add-tree-to-git-bash-on-windows-10-1eb1)
