# Installing Claude Code

## Overview

Claude Code is an agentic coding tool developed by Anthropic that runs in your terminal, understands your codebase, and helps you code faster by executing routine tasks, explaining complex code, and handling git workflows through natural language commands. It supports macOS, Linux, and Windows, and integrates with popular development environments including VS Code, JetBrains IDEs, and terminal-based workflows.

Claude Code is distinct from the Claude Desktop application. Claude Code is a command-line interface (CLI) tool designed for developers to interact with Claude directly within their terminal and codebase, while Claude Desktop is a standalone GUI application for general-purpose AI conversations.

## Prerequisites

Before installing Claude Code on any platform, ensure the following:

1. **Anthropic Account with Billing** - You need an Anthropic account with one of these:
   - Active billing enabled in the [Anthropic Console](https://console.anthropic.com/)
   - A Claude Pro or Max subscription at [claude.ai](https://claude.ai/)
   - Enterprise access through Amazon Bedrock, Google Vertex AI, or Microsoft Foundry

2. **Internet Connection** - Required for authentication and all AI processing (Claude Code communicates with Anthropic servers)

3. **Terminal Access** - Claude Code runs in a terminal environment (Bash, Zsh, Fish, PowerShell, or CMD)

4. **Supported Architecture** - x86_64 (Intel/AMD 64-bit) or ARM64 (Apple Silicon, AWS Graviton, etc.)

**Hardware Recommendations**:
- 4 GB or more RAM
- Stable internet connection

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- Terminal access (Terminal.app, iTerm2, etc.)

Homebrew supports both Apple Silicon (M1/M2/M3/M4) and Intel Macs. If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Claude Code via Homebrew:

```bash
brew install --cask --quiet claude-code
```

The `--cask` flag indicates this is a macOS application (not a command-line formula), and `--quiet` suppresses non-essential output for automation compatibility.

**Alternative Method - Native Installer**:

If you prefer the native installer from Anthropic (which includes automatic updates):

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

After installation, reload your shell configuration:

```bash
source ~/.zshrc
```

For Bash users:

```bash
source ~/.bashrc
```

#### Verification

Confirm the installation succeeded by checking the version:

```bash
claude --version
```

Expected output (version number will vary):

```
claude v2.0.76 (native)
```

Run the built-in diagnostic tool to verify the installation is healthy:

```bash
claude doctor
```

This displays diagnostic information including the installation type, executable path, auto-update status, and configuration.

#### Troubleshooting

**Problem**: `brew: command not found`

**Solution**: Homebrew is not installed or not in PATH. Install Homebrew or add it to your PATH:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For Intel Macs, use:

```bash
eval "$(/usr/local/bin/brew shellenv)"
```

**Problem**: Installation fails with "Cask 'claude-code' is not available"

**Solution**: Update Homebrew to get the latest cask definitions:

```bash
brew update
brew install --cask --quiet claude-code
```

**Problem**: `claude: command not found` after installation

**Solution**: The binary is installed but not in PATH. For Homebrew cask installations, ensure `/usr/local/bin` (Intel) or `/opt/homebrew/bin` (Apple Silicon) is in your PATH. Open a new terminal window or run:

```bash
export PATH="/opt/homebrew/bin:$PATH"
```

**Problem**: Authentication fails after launching Claude Code

**Solution**: Ensure you have an active Anthropic account with billing enabled. Run `/login` within Claude Code to re-authenticate.

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 or later, or Debian 10 or later (64-bit)
- sudo privileges
- curl installed (pre-installed on most systems)
- Active internet connection

Verify curl is installed:

```bash
which curl || sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
```

#### Installation Steps

Run the following command to install Claude Code using the native installer:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

This downloads and installs the Claude Code binary to `~/.local/bin/claude`. The installer automatically adds the binary to your PATH.

After installation, reload your shell configuration:

```bash
source ~/.bashrc
```

For Zsh users:

```bash
source ~/.zshrc
```

**Alternative Method - npm Installation**:

If you prefer using npm (requires Node.js 18 or later):

First, ensure Node.js 18+ is installed:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

Then install Claude Code globally:

```bash
npm install -g @anthropic-ai/claude-code
```

**Important**: Do NOT use `sudo npm install -g` as this causes permission issues. If you encounter permission errors, configure npm to use a user directory:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g @anthropic-ai/claude-code
```

#### Verification

Confirm the installation succeeded:

```bash
claude --version
```

Expected output (version number will vary):

```
claude v2.0.76 (native)
```

Run the diagnostic tool:

```bash
claude doctor
```

#### Troubleshooting

**Problem**: `curl: command not found`

**Solution**: Install curl:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
```

**Problem**: `claude: command not found` after installation

**Solution**: The binary was installed but your shell has not reloaded. Run:

```bash
source ~/.bashrc
```

Or open a new terminal window. If the problem persists, manually add the binary to PATH:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Node.js version is too old for npm installation

**Solution**: Check your Node.js version:

```bash
node --version
```

If below v18, update Node.js using the NodeSource repository:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

**Problem**: Permission errors with npm install

**Solution**: Never use `sudo npm install -g`. Instead, configure npm to use a user directory as shown in the installation steps above.

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit) - ARM64/aarch64 architecture **required**
- Raspberry Pi 4 or later with 4 GB or more RAM recommended
- sudo privileges
- curl installed
- Node.js 18 or later (for npm installation method)

**Critical Architecture Requirement**: Claude Code requires a 64-bit operating system. Verify your architecture:

```bash
uname -m
```

This must output `aarch64`. If it outputs `armv7l`, you are running 32-bit Raspberry Pi OS and must install the 64-bit version from the [Raspberry Pi Imager](https://www.raspberrypi.com/software/).

#### Installation Steps

**Important Note**: The native Claude Code installer has had compatibility issues with Raspberry Pi ARM64 architecture in certain versions. The npm installation method is recommended for Raspberry Pi to avoid architecture detection bugs.

**Step 1**: Install Node.js 22 (LTS) from the NodeSource repository:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

**Step 2**: Configure npm to use a user directory (prevents permission issues):

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Step 3**: Install Claude Code via npm:

```bash
npm install -g @anthropic-ai/claude-code
```

**Alternative - Native Installer** (may have compatibility issues):

You can try the native installer, which may work on recent versions:

```bash
curl -fsSL https://claude.ai/install.sh | bash
source ~/.bashrc
```

If the native installer fails with "Unsupported architecture: arm", use the npm method above.

#### Verification

Confirm the installation succeeded:

```bash
claude --version
```

Expected output (version number will vary):

```
claude v2.0.76 (npm)
```

Run the diagnostic tool:

```bash
claude doctor
```

#### Troubleshooting

**Problem**: Native installer fails with "Unsupported architecture: arm"

**Solution**: This is a known bug in certain versions of the native installer where aarch64 is incorrectly rejected. Use the npm installation method instead:

```bash
npm install -g @anthropic-ai/claude-code
```

**Problem**: Claude Code crashes on launch with memory errors

**Solution**: Some ARM64-specific bugs exist in certain Claude Code versions. If you experience crashes, you can install a known working version:

```bash
npm uninstall -g @anthropic-ai/claude-code
npm install -g @anthropic-ai/claude-code@0.2.114
```

Note that this older version may lack newer features but provides stability on ARM64.

**Problem**: `uname -m` shows `armv7l` instead of `aarch64`

**Solution**: You are running 32-bit Raspberry Pi OS. Claude Code requires 64-bit. Download and install the 64-bit Raspberry Pi OS image from https://www.raspberrypi.com/software/.

**Problem**: Node.js version below 18

**Solution**: Remove the old Node.js and install version 22:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y nodejs
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

**Problem**: Slow performance or high memory usage

**Solution**: Raspberry Pi has limited resources. Close other applications, ensure you have at least 4 GB RAM, and consider using swap:

```bash
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8+, or CentOS Stream 8+
- sudo privileges
- curl installed
- Active internet connection

Amazon Linux is typically used as a server operating system. Claude Code works well in headless server environments for AI-assisted development tasks.

#### Installation Steps

Run the following command to install Claude Code using the native installer:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

After installation, reload your shell configuration:

```bash
source ~/.bashrc
```

**Alternative Method - npm Installation**:

If you prefer npm (requires Node.js 18+):

**For Amazon Linux 2023**:

```bash
sudo dnf install -y nodejs
```

**For Amazon Linux 2**:

```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs
```

Configure npm to use a user directory:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

Install Claude Code:

```bash
npm install -g @anthropic-ai/claude-code
```

#### Verification

Confirm the installation succeeded:

```bash
claude --version
```

Expected output (version number will vary):

```
claude v2.0.76 (native)
```

Run the diagnostic tool:

```bash
claude doctor
```

#### Troubleshooting

**Problem**: `curl: command not found`

**Solution**: Install curl:

For Amazon Linux 2023:

```bash
sudo dnf install -y curl
```

For Amazon Linux 2:

```bash
sudo yum install -y curl
```

**Problem**: `claude: command not found` after installation

**Solution**: The binary was installed but your shell has not reloaded. Run:

```bash
source ~/.bashrc
```

Or manually add to PATH:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Node.js version too old for npm installation

**Solution**: Use the NodeSource repository:

```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
```

Or for yum-based systems:

```bash
sudo yum install -y nodejs
```

**Problem**: SELinux blocking execution

**Solution**: If SELinux is enforcing and blocking Claude Code, you can check the audit log:

```bash
sudo ausearch -m avc -ts recent
```

You may need to create a custom SELinux policy or set the binary to permissive for testing:

```bash
sudo setenforce 0
```

Note: This is temporary. For production, create a proper SELinux policy.

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 version 1809 or later, or Windows 11
- Administrator privileges for installation
- PowerShell 5.1 or later (pre-installed on Windows 10/11)
- Active internet connection

Choose one of these package managers. Winget is pre-installed on Windows 10/11; Chocolatey requires installation.

#### Installation Steps

**Method 1 - Using winget (Recommended)**:

Open PowerShell or Command Prompt as Administrator and run:

```powershell
winget install --id Anthropic.ClaudeCode --silent --accept-package-agreements --accept-source-agreements
```

This command:
- `--id Anthropic.ClaudeCode` - Specifies the Claude Code package
- `--silent` - Runs without user prompts
- `--accept-package-agreements` - Automatically accepts license agreements
- `--accept-source-agreements` - Automatically accepts source agreements

**Method 2 - Using Chocolatey**:

If Chocolatey is not installed, install it first (run in Administrator PowerShell):

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Then install Claude Code:

```powershell
choco install claude-code -y
```

The `-y` flag automatically confirms the installation without prompts.

**Method 3 - Using Native PowerShell Installer**:

```powershell
irm https://claude.ai/install.ps1 | iex
```

This downloads and runs Anthropic's official installer script, which installs the native binary with automatic updates.

After installation, close and reopen your terminal for PATH updates to take effect.

#### Verification

Open a new PowerShell or Command Prompt window (required for PATH to update), then run:

```powershell
claude --version
```

Expected output (version number will vary):

```
claude v2.0.76 (native)
```

Run the diagnostic tool:

```powershell
claude doctor
```

#### Troubleshooting

**Problem**: `winget: The term 'winget' is not recognized`

**Solution**: Winget may not be installed. Install App Installer from the Microsoft Store:

```powershell
start ms-windows-store://pdp/?productid=9NBLGGH4NNS1
```

After installation, open a new terminal window.

**Problem**: `choco: The term 'choco' is not recognized`

**Solution**: Chocolatey is not installed. Install it using the command in the installation steps above.

**Problem**: `claude: The term 'claude' is not recognized` after installation

**Solution**: The PATH has not been updated. Close and reopen your terminal. If the problem persists, manually add Claude Code to your PATH:

For native installer:

```powershell
$env:PATH += ";$env:LOCALAPPDATA\Programs\claude-code"
```

**Problem**: Installation fails with "Administrator privileges required"

**Solution**: Right-click PowerShell or Command Prompt and select "Run as administrator", then retry the installation command.

**Problem**: Windows Defender SmartScreen blocks the installer

**Solution**: The native installer from Anthropic is signed and safe. Click "More info" and then "Run anyway". For enterprise environments, contact your IT administrator to whitelist the Anthropic installer.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- Windows Subsystem for Linux installed with Ubuntu distribution
- WSL 2 recommended for best performance
- sudo privileges within WSL

**Important**: Claude Code runs natively within WSL. There is no need to install it on both Windows and WSL - install only within the WSL environment for the best experience.

Verify WSL is installed and running Ubuntu:

```bash
wsl --list --verbose
```

#### Installation Steps

Open your WSL Ubuntu terminal and run the native installer:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

After installation, reload your shell configuration:

```bash
source ~/.bashrc
```

For Zsh users:

```bash
source ~/.zshrc
```

**Alternative Method - npm Installation**:

If you prefer npm (requires Node.js 18+):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

Configure npm to use a user directory:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

Install Claude Code:

```bash
npm install -g @anthropic-ai/claude-code
```

#### Verification

Confirm the installation succeeded:

```bash
claude --version
```

Expected output (version number will vary):

```
claude v2.0.76 (native)
```

Run the diagnostic tool:

```bash
claude doctor
```

#### Troubleshooting

**Problem**: WSL is not installed

**Solution**: Install WSL from PowerShell (as Administrator):

```powershell
wsl --install -d Ubuntu
```

Restart your computer after installation.

**Problem**: `claude: command not found` after installation

**Solution**: Reload your shell configuration:

```bash
source ~/.bashrc
```

Or add the binary to PATH manually:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Authentication issues between WSL and Windows browser

**Solution**: When Claude Code opens a browser for OAuth, it may open in Windows. Ensure your default Windows browser is configured. If authentication callbacks fail, copy the authentication URL manually into your Windows browser.

**Problem**: Slow file access when working with Windows files

**Solution**: WSL has slower performance when accessing files on the Windows filesystem (`/mnt/c/`). For best performance, keep your projects within the WSL filesystem (`~/projects/` or similar).

**Problem**: Network connectivity issues within WSL

**Solution**: If Claude Code cannot reach Anthropic servers, check your WSL network configuration:

```bash
cat /etc/resolv.conf
```

For persistent DNS issues, add to `/etc/wsl.conf`:

```bash
sudo tee -a /etc/wsl.conf > /dev/null << 'EOF'
[network]
generateResolvConf = false
EOF
```

Then restart WSL from PowerShell:

```powershell
wsl --shutdown
```

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or later
- Git for Windows installed (provides Git Bash)
- PowerShell available (for initial installation)

Git Bash provides a Unix-compatible environment on Windows, making it ideal for Claude Code. The tool translates Unix paths and commands automatically.

Download Git for Windows from https://git-scm.com/downloads/win if not already installed.

#### Installation Steps

Git Bash can execute Windows commands, so use the PowerShell installer from within Git Bash:

**Method 1 - Using PowerShell from Git Bash**:

```bash
powershell.exe -Command "irm https://claude.ai/install.ps1 | iex"
```

**Method 2 - Using winget from Git Bash**:

```bash
winget.exe install --id Anthropic.ClaudeCode --silent --accept-package-agreements --accept-source-agreements
```

**Method 3 - Using Chocolatey from Git Bash**:

```bash
choco.exe install claude-code -y
```

After installation, close and reopen Git Bash for PATH updates to take effect.

**Configure Git Bash Path (if needed)**:

If Claude Code has trouble locating Git Bash, set the environment variable in PowerShell before running Claude Code:

```powershell
$env:CLAUDE_CODE_GIT_BASH_PATH="C:\Program Files\Git\bin\bash.exe"
```

For portable Git installations, adjust the path accordingly.

#### Verification

Open a new Git Bash window and run:

```bash
claude --version
```

Expected output (version number will vary):

```
claude v2.0.76 (native)
```

Run the diagnostic tool:

```bash
claude doctor
```

#### Troubleshooting

**Problem**: `winget.exe: command not found`

**Solution**: Winget may not be in the Git Bash PATH. Use the full path:

```bash
/c/Users/$USER/AppData/Local/Microsoft/WindowsApps/winget.exe install --id Anthropic.ClaudeCode --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: `claude: command not found` after installation

**Solution**: The PATH in Git Bash may not include the Claude Code binary. Add it manually:

```bash
echo 'export PATH="$PATH:/c/Users/$USER/AppData/Local/Programs/claude-code"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: PowerShell command fails from Git Bash

**Solution**: Ensure PowerShell is accessible. Try using the full path:

```bash
/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -Command "irm https://claude.ai/install.ps1 | iex"
```

**Problem**: Path translation issues between Git Bash and Windows

**Solution**: Git Bash automatically translates paths, but some edge cases may require explicit Windows paths. Use `cygpath` to convert:

```bash
cygpath -w ~/.local/bin/claude
```

**Problem**: Claude Code cannot execute shell commands

**Solution**: Ensure Git Bash's bash.exe is properly configured. Set the environment variable:

```bash
export CLAUDE_CODE_GIT_BASH_PATH="/c/Program Files/Git/bin/bash.exe"
```

Add this to `~/.bashrc` for persistence.

---

## Post-Installation Configuration

### First-Time Setup

After installing Claude Code on any platform:

1. **Launch Claude Code** - Open a terminal and run:

   ```bash
   claude
   ```

2. **Authenticate** - On first launch, Claude Code guides you through OAuth authentication:
   - A browser window opens automatically
   - Sign in with your Anthropic account (or Claude.ai account for Pro/Max subscribers)
   - Authorize Claude Code to access your account
   - Return to the terminal after authorization completes

3. **Select Terminal Style** - Choose your preferred interface mode when prompted

4. **Verify Authentication** - Run `/status` within Claude Code to confirm you are authenticated

### Authentication Methods

Claude Code supports multiple authentication methods:

**OAuth (Recommended)**:
- Default method for most users
- Works with Claude Console accounts and Claude Pro/Max subscriptions
- Credentials stored securely (macOS Keychain, system keyring on Linux, Windows Credential Manager)

**API Key**:
- For programmatic or CI/CD use
- Set the `ANTHROPIC_API_KEY` environment variable:

  ```bash
  export ANTHROPIC_API_KEY="sk-ant-..."
  ```

- API key usage incurs pay-as-you-go charges regardless of subscription status

**Enterprise Providers**:
- Configure Claude Code for Amazon Bedrock, Google Vertex AI, or Microsoft Foundry
- See the [Claude Code IAM documentation](https://code.claude.com/docs/en/iam) for enterprise setup

### Configuration Files

Claude Code stores configuration in these locations:

| Platform | Configuration Location |
|----------|----------------------|
| macOS/Linux | `~/.claude/` and `~/.claude.json` |
| Windows | `%USERPROFILE%\.claude\` and `%USERPROFILE%\.claude.json` |

Project-specific settings can be placed in `.claude/` within your project directory.

### Auto-Updates

Claude Code automatically keeps itself up to date. Updates download and install in the background without interrupting your work.

To disable auto-updates (not recommended):

```bash
export DISABLE_AUTOUPDATER=1
```

To manually trigger an update (native installations only):

```bash
claude update
```

Note: The `claude update` command is only available for native installations, not npm installations.

---

## Common Issues

### Issue: "Not authenticated" or 403 Forbidden Errors

**Symptoms**: Claude Code refuses to process requests, showing authentication errors.

**Solution**:
1. Run `/login` within Claude Code to re-authenticate
2. Ensure your Anthropic account has active billing or a valid subscription
3. Check if an API key is overriding OAuth: run `/status` to see which authentication method is active
4. If using an API key, verify it is valid at https://console.anthropic.com/

### Issue: Slow Response Times

**Symptoms**: Claude Code takes a long time to respond to prompts.

**Solution**:
1. Check your internet connection stability
2. Verify Anthropic services are operational at https://status.anthropic.com/
3. Large codebases may take longer to analyze - consider using `.claudeignore` to exclude unnecessary files
4. Close unnecessary applications consuming system resources

### Issue: "Unable to connect" Network Errors

**Symptoms**: Claude Code cannot communicate with Anthropic servers.

**Solution**:
1. Verify internet connectivity
2. Check if a firewall or proxy is blocking outbound connections to `*.anthropic.com` and `*.claude.ai`
3. For corporate networks, contact IT to whitelist Anthropic domains
4. Try using a different network to isolate the issue

### Issue: High Memory or CPU Usage

**Symptoms**: Claude Code consumes excessive system resources.

**Solution**:
1. Large codebases increase memory usage - use `.claudeignore` to exclude large directories
2. Restart Claude Code to clear cached data
3. Check `claude doctor` for diagnostic information
4. On resource-constrained systems (like Raspberry Pi), close other applications

### Issue: Multiple Installations Detected

**Symptoms**: `claude doctor` reports multiple Claude Code installations or configuration mismatches.

**Solution**:
1. Uninstall duplicate installations:

   For npm:
   ```bash
   npm uninstall -g @anthropic-ai/claude-code
   ```

   For Homebrew:
   ```bash
   brew uninstall --cask claude-code
   ```

   For native (macOS/Linux):
   ```bash
   rm -f ~/.local/bin/claude
   rm -rf ~/.claude-code
   ```

2. Reinstall using a single method (native installer recommended)
3. Run `claude doctor` to verify the configuration

### Issue: Shell Commands Fail Inside Claude Code

**Symptoms**: Claude Code cannot execute shell commands or reports permission errors.

**Solution**:
1. Verify your shell is supported (Bash, Zsh, Fish, PowerShell)
2. On Windows, ensure Git Bash is properly configured with `CLAUDE_CODE_GIT_BASH_PATH`
3. Check file permissions in your project directory
4. On macOS, grant Terminal full disk access in System Preferences > Privacy & Security

---

## Uninstallation

### Native Installation (macOS/Linux/WSL)

```bash
rm -f ~/.local/bin/claude
rm -rf ~/.claude-code
```

### Homebrew (macOS)

```bash
brew uninstall --cask claude-code
```

### npm (All Platforms)

```bash
npm uninstall -g @anthropic-ai/claude-code
```

### Windows Native

PowerShell:

```powershell
Remove-Item -Path "$env:LOCALAPPDATA\Programs\claude-code" -Recurse -Force
Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\WindowsApps\claude.exe" -Force
```

### Chocolatey (Windows)

```powershell
choco uninstall claude-code -y
```

### winget (Windows)

```powershell
winget uninstall --id Anthropic.ClaudeCode --silent
```

### Clean Up Configuration Files (Optional)

macOS/Linux/WSL:

```bash
rm -rf ~/.claude
rm -f ~/.claude.json
```

Windows PowerShell:

```powershell
Remove-Item -Path "$env:USERPROFILE\.claude" -Recurse -Force
Remove-Item -Path "$env:USERPROFILE\.claude.json" -Force
```

---

## References

- [Claude Code Official Documentation](https://code.claude.com/docs/en/overview)
- [Claude Code Setup Guide](https://code.claude.com/docs/en/setup)
- [Claude Code GitHub Repository](https://github.com/anthropics/claude-code)
- [Anthropic Console](https://console.anthropic.com/)
- [Claude Code npm Package](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- [Claude Code Homebrew Cask](https://formulae.brew.sh/cask/claude-code)
- [Claude Code Chocolatey Package](https://community.chocolatey.org/packages/claude-code)
- [Claude Code winget Package](https://winstall.app/apps/Anthropic.ClaudeCode)
- [Claude Code Troubleshooting](https://docs.claude.com/en/docs/claude-code/troubleshooting)
- [Anthropic Status Page](https://status.anthropic.com/)
