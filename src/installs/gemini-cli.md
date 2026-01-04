# Installing Gemini CLI

## Overview

Gemini CLI is an open-source AI agent developed by Google that brings the power of Gemini directly into your terminal. It provides a lightweight, direct path from your prompts to Google's Gemini AI models, enabling interactive conversations, code assistance, file operations, shell command execution, and web search directly from the command line. The CLI runs a ReAct (reason and act) agent loop that can decide when to use built-in tools versus when to respond directly.

Gemini CLI is distinct from Google's web-based Gemini interface. It is a command-line tool designed for developers who prefer terminal-based workflows, offering system integration capabilities that allow it to read/edit files, run commands, and interact with your local development environment.

## Prerequisites

Before installing Gemini CLI on any platform, ensure the following:

1. **Google Account** - Required for authentication. A personal Google account provides free tier access (no special subscription needed).

2. **Node.js Version 20 or Higher** - Gemini CLI is distributed as an npm package and requires a modern Node.js runtime. Version 20+ is required.

3. **Internet Connection** - Required for authentication and all AI processing (Gemini CLI communicates with Google's servers).

4. **Terminal Access** - Gemini CLI runs in a terminal environment (Bash, Zsh, Fish, PowerShell, or CMD).

**Free Tier Benefits**:
- 60 requests per minute
- 1,000 requests per day
- Access to Gemini 2.5 Pro with 1 million token context window
- No credit card or paid subscription required

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

Run the following command to install Gemini CLI via Homebrew:

```bash
brew install --quiet gemini-cli
```

The `--quiet` flag suppresses non-essential output for automation compatibility. Homebrew automatically installs the Node.js dependency.

After installation, reload your shell or open a new terminal window:

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
gemini --version
```

Expected output (version number will vary):

```
0.22.5
```

Run Gemini CLI to verify it launches:

```bash
gemini
```

On first launch, you will be prompted to authenticate with your Google account.

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

**Problem**: `gemini: command not found` after installation

**Solution**: The binary is installed but not in PATH. Open a new terminal window or add the Homebrew bin directory to your PATH:

```bash
export PATH="/opt/homebrew/bin:$PATH"
```

**Problem**: Version mismatch warning when using both Homebrew and npm installations

**Solution**: Choose one installation method. If you have both, uninstall the npm version:

```bash
npm uninstall -g @google/gemini-cli
```

**Problem**: Authentication fails with browser not opening

**Solution**: Ensure your default browser is configured. If running in a headless environment, use API key authentication instead (see Post-Installation Configuration).

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

**Step 3**: Install Gemini CLI via npm:

```bash
npm install -g @google/gemini-cli
```

**Important**: Do NOT use `sudo npm install -g` as this causes permission issues. The npm global directory configuration above prevents the need for sudo.

#### Verification

Confirm the installation succeeded:

```bash
gemini --version
```

Expected output (version number will vary):

```
0.22.5
```

Run Gemini CLI to verify it launches:

```bash
gemini
```

#### Troubleshooting

**Problem**: `curl: command not found`

**Solution**: Install curl:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
```

**Problem**: `gemini: command not found` after installation

**Solution**: The binary was installed but your shell has not reloaded. Run:

```bash
source ~/.bashrc
```

Or open a new terminal window. If the problem persists, verify the npm global bin path is in your PATH:

```bash
echo $PATH | grep -q ".npm-global/bin" || echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc && source ~/.bashrc
```

**Problem**: Node.js version is too old

**Solution**: Check your Node.js version:

```bash
node --version
```

If below v20, update Node.js using the NodeSource repository:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

**Problem**: Permission errors with npm install

**Solution**: Never use `sudo npm install -g`. Instead, configure npm to use a user directory as shown in the installation steps above.

**Problem**: `EACCES` permission denied errors

**Solution**: Reset npm global directory configuration:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
source ~/.bashrc
npm install -g @google/gemini-cli
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit) - ARM64/aarch64 architecture **required**
- Raspberry Pi 4 or later with 4 GB or more RAM recommended
- sudo privileges
- curl installed
- Node.js 20 or later

**Critical Architecture Requirement**: Gemini CLI and modern Node.js versions require a 64-bit operating system. Verify your architecture:

```bash
uname -m
```

This must output `aarch64`. If it outputs `armv7l`, you are running 32-bit Raspberry Pi OS and must install the 64-bit version from the [Raspberry Pi Imager](https://www.raspberrypi.com/software/).

#### Installation Steps

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

**Step 3**: Install Gemini CLI via npm:

```bash
npm install -g @google/gemini-cli
```

#### Verification

Confirm the installation succeeded:

```bash
gemini --version
```

Expected output (version number will vary):

```
0.22.5
```

Run Gemini CLI to verify it launches:

```bash
gemini
```

#### Troubleshooting

**Problem**: `uname -m` shows `armv7l` instead of `aarch64`

**Solution**: You are running 32-bit Raspberry Pi OS. Gemini CLI requires 64-bit. Download and install the 64-bit Raspberry Pi OS image from https://www.raspberrypi.com/software/.

**Problem**: Node.js installation fails or version below 20

**Solution**: Remove the old Node.js and install version 22:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y nodejs
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

**Problem**: `gemini: command not found` after installation

**Solution**: Reload your shell configuration:

```bash
source ~/.bashrc
```

**Problem**: Slow performance or high memory usage

**Solution**: Raspberry Pi has limited resources. Close other applications, ensure you have at least 4 GB RAM, and consider using swap:

```bash
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

**Problem**: npm install hangs or times out

**Solution**: Raspberry Pi may have slower network or limited memory. Increase the npm timeout:

```bash
npm config set fetch-timeout 120000
npm install -g @google/gemini-cli
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8+, CentOS Stream 8+, or Fedora
- sudo privileges
- curl installed
- Active internet connection

Amazon Linux is typically used as a server operating system. Gemini CLI works well in headless server environments for AI-assisted development tasks.

#### Installation Steps

**For Amazon Linux 2023 / RHEL 8+ / Fedora**:

**Step 1**: Install Node.js via DNF:

```bash
sudo dnf install -y nodejs npm
```

Verify Node.js version is 20 or higher:

```bash
node --version
```

If the version is below 20, install from NodeSource:

```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
```

**Step 2**: Configure npm to use a user directory:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Step 3**: Install Gemini CLI:

```bash
npm install -g @google/gemini-cli
```

**For Amazon Linux 2 (older)**:

**Step 1**: Install Node.js from NodeSource (AL2 has older Node.js by default):

```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs
```

**Step 2**: Configure npm to use a user directory:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Step 3**: Install Gemini CLI:

```bash
npm install -g @google/gemini-cli
```

#### Verification

Confirm the installation succeeded:

```bash
gemini --version
```

Expected output (version number will vary):

```
0.22.5
```

Run Gemini CLI to verify it launches:

```bash
gemini
```

#### Troubleshooting

**Problem**: `curl: command not found`

**Solution**: Install curl:

For Amazon Linux 2023 / RHEL 8+:

```bash
sudo dnf install -y curl
```

For Amazon Linux 2:

```bash
sudo yum install -y curl
```

**Problem**: `gemini: command not found` after installation

**Solution**: Reload your shell configuration:

```bash
source ~/.bashrc
```

Or manually add to PATH:

```bash
echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Node.js version too old

**Solution**: Use the NodeSource repository:

```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
```

**Problem**: SELinux blocking execution

**Solution**: If SELinux is enforcing and blocking Gemini CLI, check the audit log:

```bash
sudo ausearch -m avc -ts recent
```

For testing, temporarily set permissive mode:

```bash
sudo setenforce 0
```

Note: This is temporary. For production, create a proper SELinux policy.

**Problem**: Authentication fails in headless/SSH environment

**Solution**: Use API key authentication instead of browser-based OAuth. See Post-Installation Configuration for API key setup.

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 version 1809 or later, or Windows 11
- Administrator privileges for installation
- PowerShell 5.1 or later (pre-installed on Windows 10/11)
- Active internet connection

#### Installation Steps

Open PowerShell as Administrator and run the following commands.

**Step 1**: Install Node.js via winget:

```powershell
winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
```

Close and reopen PowerShell as Administrator after Node.js installation to update PATH.

**Step 2**: Install Gemini CLI via npm:

```powershell
npm install -g @google/gemini-cli
```

**Alternative - Using Chocolatey**:

If Chocolatey is not installed, install it first (run in Administrator PowerShell):

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Then install Node.js and Gemini CLI:

```powershell
choco install nodejs-lts -y
refreshenv
npm install -g @google/gemini-cli
```

After installation, close and reopen your terminal for PATH updates to take effect.

#### Verification

Open a new PowerShell or Command Prompt window (required for PATH to update), then run:

```powershell
gemini --version
```

Expected output (version number will vary):

```
0.22.5
```

Run Gemini CLI to verify it launches:

```powershell
gemini
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

**Problem**: `gemini: The term 'gemini' is not recognized` after installation

**Solution**: The PATH has not been updated. Close and reopen your terminal. If the problem persists, manually add npm global to your PATH:

```powershell
$env:PATH += ";$env:APPDATA\npm"
```

To make this permanent, add the path to your system environment variables.

**Problem**: Installation fails with "Administrator privileges required"

**Solution**: Right-click PowerShell or Command Prompt and select "Run as administrator", then retry the installation command.

**Problem**: Node.js version is too old

**Solution**: Update Node.js:

```powershell
winget upgrade --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: Authentication callback fails

**Solution**: If VPN is active, disable split-tunneling or use global mode. Alternatively, use API key authentication.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- Windows Subsystem for Linux installed with Ubuntu distribution
- WSL 2 recommended for best performance
- sudo privileges within WSL

**Important**: Gemini CLI runs natively within WSL. Install only within the WSL environment for the best experience.

Verify WSL is installed and running Ubuntu:

```bash
wsl --list --verbose
```

#### Installation Steps

Open your WSL Ubuntu terminal and follow these steps.

**Step 1**: Update package lists:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Step 2**: Install Node.js 22 (LTS) from the NodeSource repository:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
```

**Step 3**: Configure npm to use a user directory:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Step 4**: Install Gemini CLI:

```bash
npm install -g @google/gemini-cli
```

#### Verification

Confirm the installation succeeded:

```bash
gemini --version
```

Expected output (version number will vary):

```
0.22.5
```

Run Gemini CLI to verify it launches:

```bash
gemini
```

#### Troubleshooting

**Problem**: WSL is not installed

**Solution**: Install WSL from PowerShell (as Administrator on Windows):

```powershell
wsl --install -d Ubuntu
```

Restart your computer after installation.

**Problem**: `gemini: command not found` after installation

**Solution**: Reload your shell configuration:

```bash
source ~/.bashrc
```

Or add the binary to PATH manually:

```bash
echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Authentication issues between WSL and Windows browser

**Solution**: When Gemini CLI opens a browser for OAuth, it opens in Windows. Ensure your default Windows browser is configured. If authentication callbacks fail, copy the authentication URL manually into your Windows browser.

**Problem**: Slow file access when working with Windows files

**Solution**: WSL has slower performance when accessing files on the Windows filesystem (`/mnt/c/`). For best performance, keep your projects within the WSL filesystem (`~/projects/` or similar).

**Problem**: Network connectivity issues within WSL

**Solution**: If Gemini CLI cannot reach Google servers, check your WSL network configuration:

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
- Node.js installed on Windows
- PowerShell available (for package management)

Git Bash provides a Unix-compatible environment on Windows. Gemini CLI works within Git Bash once Node.js and npm are configured on the Windows system.

Download Git for Windows from https://git-scm.com/downloads/win if not already installed.

#### Installation Steps

**Step 1**: Install Node.js on Windows (from PowerShell as Administrator):

```bash
winget.exe install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
```

Close and reopen Git Bash after Node.js installation.

**Step 2**: Install Gemini CLI via npm (in Git Bash):

```bash
npm install -g @google/gemini-cli
```

**Step 3**: Configure PATH for Git Bash (if needed):

Add the npm global bin directory to your Git Bash PATH:

```bash
echo 'export PATH="$PATH:$APPDATA/npm"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Open a new Git Bash window and run:

```bash
gemini --version
```

Expected output (version number will vary):

```
0.22.5
```

Run Gemini CLI to verify it launches:

```bash
gemini
```

#### Troubleshooting

**Problem**: `winget.exe: command not found`

**Solution**: Winget may not be in the Git Bash PATH. Use the full path:

```bash
/c/Users/$USER/AppData/Local/Microsoft/WindowsApps/winget.exe install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
```

**Problem**: `gemini: command not found` after installation

**Solution**: The PATH in Git Bash may not include the npm global bin directory. Add it manually:

```bash
echo 'export PATH="$PATH:$APPDATA/npm"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Node.js or npm not found

**Solution**: Ensure Node.js is installed on Windows and Git Bash can access Windows executables. Verify by running:

```bash
node.exe --version
npm.exe --version
```

If these work but `node` and `npm` do not, create aliases:

```bash
echo 'alias node="node.exe"' >> ~/.bashrc
echo 'alias npm="npm.exe"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Authentication browser does not open

**Solution**: Git Bash may have trouble opening the Windows browser. Run the authentication command and manually copy the URL to your browser, or use API key authentication.

**Problem**: Path translation issues between Git Bash and Windows

**Solution**: Git Bash automatically translates paths, but some edge cases may require explicit Windows paths. Use `cygpath` to convert:

```bash
cygpath -w ~/.npm-global
```

---

## Post-Installation Configuration

### First-Time Setup

After installing Gemini CLI on any platform:

1. **Launch Gemini CLI** - Open a terminal and run:

   ```bash
   gemini
   ```

2. **Configure Terminal Appearance** - On first launch, you will be asked to set up the terminal appearance preferences.

3. **Authenticate** - Choose your authentication method when prompted:
   - Select "Login with Google" for free tier access
   - A browser window opens automatically
   - Sign in with your Google account
   - Authorize Gemini CLI to access your account
   - Return to the terminal after authorization completes

4. **Verify Authentication** - After authentication, Gemini CLI is ready to use. Your credentials are cached locally for future sessions.

### Authentication Methods

Gemini CLI supports multiple authentication methods:

**Google Account Login (Recommended)**:
- Default method for most users
- Works with any Google account (personal or workspace)
- Provides free tier access (60 req/min, 1,000 req/day)
- Credentials cached locally for future sessions

**API Key**:
- For programmatic, headless, or CI/CD use
- Obtain an API key from [Google AI Studio](https://aistudio.google.com/)
- Set the `GEMINI_API_KEY` environment variable:

  ```bash
  export GEMINI_API_KEY="YOUR_API_KEY_HERE"
  ```

  For Windows PowerShell:

  ```powershell
  $env:GEMINI_API_KEY="YOUR_API_KEY_HERE"
  ```

  To make permanent on Windows:

  ```powershell
  setx GEMINI_API_KEY "YOUR_API_KEY_HERE"
  ```

**Vertex AI (Enterprise)**:
- Requires Google Cloud project with Vertex AI API enabled
- Set environment variables:

  ```bash
  export GOOGLE_CLOUD_PROJECT="your-project-id"
  export GOOGLE_CLOUD_LOCATION="us-central1"
  ```

- Authenticate via gcloud:

  ```bash
  gcloud auth application-default login
  ```

### Environment Variables Reference

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | API key from Google AI Studio |
| `GOOGLE_API_KEY` | Alternative API key variable |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project ID for Vertex AI |
| `GOOGLE_CLOUD_LOCATION` | Google Cloud region for Vertex AI |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON key |

### Configuration Files

Gemini CLI stores configuration in these locations:

| Platform | Configuration Location |
|----------|----------------------|
| macOS/Linux/WSL | `~/.gemini/` |
| Windows | `%USERPROFILE%\.gemini\` |

You can also create a `.gemini/.env` file in your project directory for project-specific settings.

### Persisting Environment Variables

Add export commands to your shell startup file for persistence:

**Bash** (`~/.bashrc`):
```bash
echo 'export GEMINI_API_KEY="YOUR_API_KEY_HERE"' >> ~/.bashrc
source ~/.bashrc
```

**Zsh** (`~/.zshrc`):
```bash
echo 'export GEMINI_API_KEY="YOUR_API_KEY_HERE"' >> ~/.zshrc
source ~/.zshrc
```

---

## Common Issues

### Issue: "gemini: command not found" After Installation

**Symptoms**: The `gemini` command is not recognized after successful npm installation.

**Solution**:
1. Open a new terminal window (PATH updates require a new session)
2. Verify npm global bin is in PATH:
   ```bash
   npm config get prefix
   ```
3. Add the bin directory to PATH if missing:
   ```bash
   echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

### Issue: Authentication Fails or Browser Does Not Open

**Symptoms**: Gemini CLI cannot complete OAuth authentication.

**Solution**:
1. Ensure you have a working internet connection
2. Check if a firewall or proxy is blocking outbound connections to Google
3. For headless environments, use API key authentication instead
4. If VPN is active, try disabling split-tunneling or use global mode
5. Manually copy the authentication URL to your browser if it does not open automatically

### Issue: Node.js Version Too Old

**Symptoms**: Installation fails or Gemini CLI crashes with runtime errors.

**Solution**:
1. Check your Node.js version:
   ```bash
   node --version
   ```
2. If below v20, update using the platform-specific instructions above
3. Consider using nvm (Node Version Manager) for easier version management:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
   source ~/.bashrc
   nvm install 22
   nvm use 22
   ```

### Issue: Permission Denied Errors During Installation

**Symptoms**: npm install fails with `EACCES` permission errors.

**Solution**:
1. Never use `sudo npm install -g`
2. Configure npm to use a user directory:
   ```bash
   mkdir -p ~/.npm-global
   npm config set prefix ~/.npm-global
   echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```
3. Retry installation:
   ```bash
   npm install -g @google/gemini-cli
   ```

### Issue: Slow Response Times or Timeouts

**Symptoms**: Gemini CLI takes a long time to respond or times out.

**Solution**:
1. Check your internet connection stability
2. Verify Google services are operational
3. For resource-constrained systems (Raspberry Pi), close other applications
4. Check if you have exceeded free tier rate limits (60 req/min, 1,000 req/day)

### Issue: Multiple Versions Installed

**Symptoms**: Unexpected behavior or version mismatch warnings.

**Solution**:
1. Check for multiple installations:
   ```bash
   which -a gemini
   npm list -g @google/gemini-cli
   brew list gemini-cli 2>/dev/null
   ```
2. Uninstall duplicates and keep only one:
   ```bash
   # Remove npm version
   npm uninstall -g @google/gemini-cli

   # Or remove Homebrew version
   brew uninstall gemini-cli
   ```

---

## Uninstallation

### npm (All Platforms)

```bash
npm uninstall -g @google/gemini-cli
```

### Homebrew (macOS)

```bash
brew uninstall gemini-cli
```

### Clean Up Configuration Files (Optional)

macOS/Linux/WSL:

```bash
rm -rf ~/.gemini
```

Windows PowerShell:

```powershell
Remove-Item -Path "$env:USERPROFILE\.gemini" -Recurse -Force
```

---

## References

- [Gemini CLI GitHub Repository](https://github.com/google-gemini/gemini-cli)
- [Gemini CLI Official Documentation](https://geminicli.com/docs/get-started/installation/)
- [Gemini CLI npm Package](https://www.npmjs.com/package/@google/gemini-cli)
- [Gemini CLI Homebrew Formula](https://formulae.brew.sh/formula/gemini-cli)
- [Gemini CLI Authentication Guide](https://geminicli.com/docs/get-started/authentication/)
- [Google AI Studio (API Keys)](https://aistudio.google.com/)
- [Google Gemini Code Assist Documentation](https://developers.google.com/gemini-code-assist/docs/gemini-cli)
- [NodeSource Node.js Distributions](https://github.com/nodesource/distributions)
