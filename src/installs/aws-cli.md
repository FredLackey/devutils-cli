# Installing AWS CLI

## Overview

The AWS Command Line Interface (AWS CLI) is a unified tool that provides a consistent interface for interacting with all parts of Amazon Web Services. With the AWS CLI, you can control multiple AWS services from the command line and automate them through scripts. AWS CLI v2 is the current major version and includes several improvements over v1, including improved installers, AWS Single Sign-On (SSO) support, and various interactive features. AWS CLI v2 bundles its own Python runtime, so no separate Python installation is required.

## Prerequisites

Before installing AWS CLI on any platform, ensure:

1. **Internet connectivity** - Required to download the installer
2. **Administrative privileges** - Required on most platforms for system-wide installation
3. **64-bit operating system** - AWS CLI v2 requires a 64-bit system on all platforms

**Important**: AWS CLI v1 and v2 use the same `aws` command. If you have v1 installed, uninstall it before installing v2 to avoid conflicts.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager installed
- Terminal access

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install AWS CLI:

```bash
brew install --quiet awscli
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts.

#### Verification

Confirm the installation succeeded:

```bash
aws --version
```

Expected output (version numbers may vary):

```
aws-cli/2.32.28 Python/3.11.6 Darwin/23.3.0 source/arm64
```

#### Troubleshooting

**Problem**: `aws: command not found` after installation

**Solution**: Homebrew may not be in your PATH. Add it by running:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For permanent fix, add the above line to your `~/.zshrc` or `~/.bash_profile`.

**Problem**: Permission denied errors

**Solution**: Run `brew doctor` to diagnose Homebrew permission issues, then fix ownership:

```bash
sudo chown -R $(whoami) /opt/homebrew
```

---

### Ubuntu/Debian (Snap)

#### Prerequisites

- Ubuntu 18.04 or later, or Debian 10 or later (64-bit)
- snapd service installed and running (pre-installed on Ubuntu 16.04+)
- sudo privileges

**Important**: Do not use `apt install awscli` on Ubuntu/Debian. The APT repositories contain outdated AWS CLI v1 packages that AWS does not maintain. Use the official Snap package instead.

#### Installation Steps

Run the following command to install AWS CLI:

```bash
sudo snap install aws-cli --classic
```

The `--classic` flag is required because AWS CLI needs access to system files and resources outside the typical snap sandbox.

**Note**: After installation, you may need to log out and log back in, or restart your terminal, for the PATH to update correctly.

#### Verification

Confirm the installation succeeded:

```bash
aws --version
```

Expected output (version numbers may vary):

```
aws-cli/2.32.28 Python/3.11.6 Linux/5.15.0-generic source/x86_64
```

#### Troubleshooting

**Problem**: `snap: command not found`

**Solution**: Install snapd first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
```

**Problem**: `aws: command not found` after installation

**Solution**: The snap bin directory may not be in your PATH. Add it:

```bash
export PATH=$PATH:/snap/bin
```

For permanent fix, add the above line to your `~/.bashrc` or `~/.profile`.

**Problem**: Classic snap installation fails

**Solution**: Ensure snapd is fully initialized:

```bash
sudo systemctl enable --now snapd.socket
sudo ln -s /var/lib/snapd/snap /snap
```

---

### Raspberry Pi OS (Snap)

#### Prerequisites

- Raspberry Pi OS (64-bit) - ARM64/aarch64 architecture required
- Raspberry Pi 3B+ or later recommended (64-bit capable hardware)
- snapd service installed
- sudo privileges

**Important**: AWS CLI v2 requires a full 64-bit (aarch64) operating system. The 32-bit version of Raspberry Pi OS is not supported. Verify your architecture:

```bash
uname -m
```

This must output `aarch64`. If it outputs `armv7l`, you need to install the 64-bit version of Raspberry Pi OS.

#### Installation Steps

First, install snapd if not already present:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
```

Reboot to complete snapd initialization:

```bash
sudo reboot
```

After reboot, install AWS CLI:

```bash
sudo snap install aws-cli --classic
```

#### Verification

Confirm the installation succeeded:

```bash
aws --version
```

Expected output (version numbers may vary):

```
aws-cli/2.32.28 Python/3.11.6 Linux/5.15.0-rpi source/aarch64
```

#### Troubleshooting

**Problem**: Installation fails with architecture error

**Solution**: You are running 32-bit Raspberry Pi OS. Download and install the 64-bit version from https://www.raspberrypi.com/software/operating-systems/

**Problem**: `aws: command not found` after installation

**Solution**: Log out and log back in, or add the snap bin directory to PATH:

```bash
export PATH=$PATH:/snap/bin
```

**Problem**: Slow installation or timeout

**Solution**: Raspberry Pi may have limited bandwidth. Allow extra time or use a wired ethernet connection for faster downloads.

---

### Amazon Linux (DNF)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges

**Note**: Amazon Linux 2023 includes AWS CLI v2 pre-installed. Amazon Linux 2 includes AWS CLI v1 pre-installed. The steps below ensure you have the latest v2 version.

#### Installation Steps

**For Amazon Linux 2023 (AWS CLI v2 pre-installed):**

Update to the latest version:

```bash
sudo dnf upgrade -y awscli
```

**For Amazon Linux 2 (Upgrade from v1 to v2):**

First, remove the pre-installed AWS CLI v1:

```bash
sudo yum remove -y awscli
```

Then install AWS CLI v2 using the official installer:

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
unzip -o -q /tmp/awscliv2.zip -d /tmp
sudo /tmp/aws/install
rm -rf /tmp/awscliv2.zip /tmp/aws
```

#### Verification

Confirm the installation succeeded:

```bash
aws --version
```

Expected output (version numbers may vary):

```
aws-cli/2.32.28 Python/3.11.6 Linux/5.10.205-195.807.amzn2.x86_64 exe/x86_64.amzn.2
```

#### Troubleshooting

**Problem**: `aws` command runs old v1 version after installing v2

**Solution**: The old v1 may still be in PATH. Remove it and refresh your shell:

```bash
sudo yum remove -y awscli
hash -r
```

**Problem**: `unzip: command not found`

**Solution**: Install unzip first:

```bash
sudo yum install -y unzip
```

**Problem**: Permission denied during installation

**Solution**: Ensure you have sudo privileges. If running in a container, the installer may need to be run as root:

```bash
sudo /tmp/aws/install --bin-dir /usr/local/bin --install-dir /usr/local/aws-cli
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Chocolatey package manager installed
- Administrator PowerShell or Command Prompt

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install awscli -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

#### Verification

Open a new Command Prompt or PowerShell window (required for PATH to update), then run:

```powershell
aws --version
```

Expected output (version numbers may vary):

```
aws-cli/2.32.28 Python/3.11.6 Windows/10 exe/AMD64
```

#### Troubleshooting

**Problem**: `aws: The term 'aws' is not recognized`

**Solution**: Open a new terminal window. The PATH is updated during installation but existing windows do not reflect this. Alternatively, refresh the environment:

```powershell
refreshenv
```

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: Chocolatey command not found

**Solution**: Chocolatey may not be in PATH. Close all terminal windows, open a new Administrator PowerShell, and try again.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows Subsystem for Linux with Ubuntu installed
- WSL 2 recommended for best performance
- sudo privileges within WSL

WSL Ubuntu installations follow the same process as native Ubuntu, using Snap.

#### Installation Steps

First, ensure snapd is installed and running:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd
```

Start the snapd service:

```bash
sudo systemctl enable --now snapd.socket
sudo ln -s /var/lib/snapd/snap /snap 2>/dev/null || true
```

Install AWS CLI:

```bash
sudo snap install aws-cli --classic
```

**Note**: You may need to restart your WSL session for the PATH to update. Close the terminal and run `wsl` again.

#### Verification

Confirm the installation succeeded:

```bash
aws --version
```

Expected output (version numbers may vary):

```
aws-cli/2.32.28 Python/3.11.6 Linux/5.15.90.1-microsoft-standard-WSL2 source/x86_64
```

#### Troubleshooting

**Problem**: systemd commands fail (e.g., `systemctl: command not found`)

**Solution**: WSL 1 does not support systemd. Upgrade to WSL 2 or use the manual installer method:

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
unzip -o -q /tmp/awscliv2.zip -d /tmp
sudo /tmp/aws/install
rm -rf /tmp/awscliv2.zip /tmp/aws
```

**Problem**: Snap hangs during installation

**Solution**: WSL may have issues with snap's systemd integration. Use the manual installer method shown above.

**Problem**: `aws: command not found` after installation

**Solution**: Add the installation directory to PATH:

```bash
export PATH=$PATH:/snap/bin:/usr/local/bin
```

Add this line to `~/.bashrc` for persistence.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- AWS CLI installed on Windows (see Windows section above)

**Note**: Git Bash on Windows does not require a separate AWS CLI installation. Git Bash inherits the Windows PATH, so once AWS CLI is installed on Windows, it is automatically available in Git Bash.

#### Installation Steps

Install AWS CLI on Windows using the MSI installer with silent flags:

```bash
# Download the installer
curl -o /tmp/AWSCLIV2.msi "https://awscli.amazonaws.com/AWSCLIV2.msi"

# Run silent installation (requires Administrator privileges)
# Open a separate Administrator Command Prompt and run:
# msiexec.exe /i C:\path\to\AWSCLIV2.msi /qn
```

Alternatively, if Chocolatey is available in your Windows environment, install from Git Bash by calling the Windows Chocolatey:

```bash
/c/ProgramData/chocolatey/bin/choco.exe install awscli -y
```

After installation, close and reopen Git Bash for PATH changes to take effect.

#### Verification

Confirm AWS CLI is accessible from Git Bash:

```bash
aws --version
```

Expected output (version numbers may vary):

```
aws-cli/2.32.28 Python/3.11.6 Windows/10 exe/AMD64
```

#### Troubleshooting

**Problem**: `aws: command not found` in Git Bash

**Solution**: The Windows PATH may not be fully inherited. Add the AWS CLI directory explicitly:

```bash
export PATH=$PATH:"/c/Program Files/Amazon/AWSCLIV2"
```

Add this line to `~/.bashrc` in your Git Bash home directory for persistence.

**Problem**: Command works in Command Prompt but not Git Bash

**Solution**: Restart Git Bash. If the issue persists, check that the AWS CLI installation directory is in the Windows System PATH:

1. Open Windows System Properties > Environment Variables
2. Under System variables, find PATH
3. Ensure it contains `C:\Program Files\Amazon\AWSCLIV2`

**Problem**: Git Bash shows garbled output from AWS CLI

**Solution**: Some AWS CLI commands may have output formatting issues in Git Bash. Use the `--no-cli-pager` flag to disable the pager:

```bash
aws s3 ls --no-cli-pager
```

Or set this permanently:

```bash
export AWS_PAGER=""
```

---

## Post-Installation Configuration

After installing AWS CLI on any platform, configure it with your AWS credentials.

### Quick Configuration

Run the interactive configuration command:

```bash
aws configure
```

You will be prompted for:

- **AWS Access Key ID**: Your IAM user access key
- **AWS Secret Access Key**: Your IAM user secret key
- **Default region name**: e.g., `us-east-1`, `eu-west-1`
- **Default output format**: `json` (recommended), `yaml`, `text`, or `table`

### Non-Interactive Configuration

For automation scripts, set credentials using environment variables:

```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_DEFAULT_REGION="us-east-1"
```

Or create the credentials file directly:

```bash
mkdir -p ~/.aws

cat > ~/.aws/credentials << 'EOF'
[default]
aws_access_key_id = your-access-key-id
aws_secret_access_key = your-secret-access-key
EOF

cat > ~/.aws/config << 'EOF'
[default]
region = us-east-1
output = json
EOF

chmod 600 ~/.aws/credentials
```

### Verify Configuration

Test that your credentials work:

```bash
aws sts get-caller-identity
```

Expected output:

```json
{
    "UserId": "AIDAEXAMPLEUSERID",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

---

## Common Issues

### Issue: Multiple AWS CLI Versions Installed

**Symptoms**: Unexpected behavior, version mismatch between `aws --version` and actual functionality.

**Solution**: Check for multiple installations:

```bash
which -a aws
```

Remove older versions and ensure only one `aws` binary is in PATH.

### Issue: SSL Certificate Errors

**Symptoms**: `SSL: CERTIFICATE_VERIFY_FAILED` errors when running commands.

**Solution**: Update your system's CA certificates:

```bash
# Ubuntu/Debian
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates

# Amazon Linux
sudo yum install -y ca-certificates

# macOS
brew install --quiet ca-certificates
```

### Issue: Command Output Pager Causes Issues in Scripts

**Symptoms**: AWS CLI commands hang or require manual intervention when run in scripts.

**Solution**: Disable the pager:

```bash
export AWS_PAGER=""
```

Or pass `--no-cli-pager` to individual commands.

### Issue: Slow Command Execution

**Symptoms**: AWS CLI commands take several seconds to start.

**Solution**: This is often caused by IPv6 DNS resolution issues. Force IPv4:

```bash
export AWS_EC2_METADATA_DISABLED=true
```

### Issue: Credentials Not Found

**Symptoms**: `Unable to locate credentials` error.

**Solution**: Verify credentials are configured:

```bash
aws configure list
```

Ensure credentials file exists and has correct permissions:

```bash
ls -la ~/.aws/credentials
# Should show: -rw------- (600 permissions)
```

---

## References

- [AWS CLI Official Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [AWS CLI User Guide](https://docs.aws.amazon.com/cli/latest/userguide/)
- [AWS CLI v2 on Amazon Linux 2023](https://docs.aws.amazon.com/linux/al2023/ug/awscli2.html)
- [AWS CLI Snap Package](https://snapcraft.io/aws-cli)
- [AWS CLI Homebrew Formula](https://formulae.brew.sh/formula/awscli)
- [AWS CLI Chocolatey Package](https://community.chocolatey.org/packages/awscli)
- [AWS CLI v2 Announcement for Linux ARM](https://aws.amazon.com/blogs/developer/aws-cli-v2-now-available-for-linux-arm/)
- [AWS CLI GitHub Repository](https://github.com/aws/aws-cli)
