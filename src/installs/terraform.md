# Installing Terraform

## Overview

Terraform is an open-source infrastructure as code (IaC) tool created by HashiCorp. It enables you to define, provision, and manage cloud infrastructure across multiple providers (AWS, Azure, GCP, and many others) using declarative configuration files written in HashiCorp Configuration Language (HCL). Terraform tracks infrastructure state, enabling safe and predictable changes through its plan-and-apply workflow.

Key capabilities include:

- **Multi-cloud provisioning**: Manage resources across AWS, Azure, GCP, Kubernetes, and 3,000+ providers
- **State management**: Track infrastructure state to detect drift and enable safe updates
- **Dependency resolution**: Automatically determine the order of resource creation and destruction
- **Module ecosystem**: Reuse infrastructure patterns through the Terraform Registry

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- **Optional:** None
- **Auto-installed:** None (Homebrew handles its own dependencies)

### Ubuntu (APT/Snap)
- **Required:**
  - `gnupg` - Install via `sudo apt-get install -y gnupg`
  - `software-properties-common` - Install via `sudo apt-get install -y software-properties-common`
  - `wget` - Install via `sudo apt-get install -y wget`
- **Optional:**
  - `lsb-release` - Install via `sudo apt-get install -y lsb-release` (fallback for distribution codename detection)
- **Auto-installed:** Dependencies of the `terraform` APT package

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `wget` - Install via `sudo apt-get install -y wget` (usually pre-installed)
  - `unzip` - Install via `sudo apt-get install -y unzip`
- **Optional:**
  - `ca-certificates` - Install via `sudo apt-get install -y ca-certificates` (for SSL certificate validation, usually pre-installed)
- **Auto-installed:** None (manual binary installation)

### Amazon Linux (DNF/YUM)
- **Required:**
  - `yum-utils` - Install via `sudo yum install -y yum-utils`
- **Optional:** None
- **Auto-installed:** Dependencies of the `terraform` YUM package

### Windows (Chocolatey/winget)
- **Required:**
  - Chocolatey - Install via PowerShell (Administrator): `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
- **Optional:** None
- **Auto-installed:** None (Chocolatey handles its own dependencies)

### Git Bash (Manual/Portable)
- **Required (for Chocolatey method):**
  - Chocolatey on Windows - See Windows section above for installation
- **Required (for manual installation):**
  - `curl` or `wget` - Usually available in Git Bash
  - `unzip` - Usually available in Git Bash, or install via `choco install unzip -y` from PowerShell
- **Optional:** None
- **Auto-installed:** None

## Prerequisites

Before installing Terraform on any platform, ensure:

1. **Internet connectivity** - Required to download Terraform packages and providers
2. **Administrative privileges** - Required for system-wide installation on most platforms
3. **64-bit operating system** - Terraform binaries are available for 64-bit systems (and 32-bit on some platforms)

**Important**: If you have older Terraform installations, they will be upgraded or replaced during package manager installation. Manual installations should be removed to avoid PATH conflicts.

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

**Step 1: Add the HashiCorp tap**

First, install the HashiCorp tap, which is HashiCorp's official Homebrew repository:

```bash
brew tap hashicorp/tap
```

**Step 2: Install Terraform**

Run the following command to install Terraform:

```bash
brew install --quiet hashicorp/tap/terraform
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts. Using the HashiCorp tap ensures you receive official releases directly from HashiCorp.

#### Verification

Confirm the installation succeeded:

```bash
terraform --version
```

Expected output (version numbers may vary):

```
Terraform v1.14.3
on darwin_arm64
```

Test that Terraform can initialize:

```bash
terraform -help
```

This should display the list of available Terraform commands.

#### Troubleshooting

**Problem**: `terraform: command not found` after installation

**Solution**: Homebrew may not be in your PATH. Add it by running:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For permanent fix, add the above line to your `~/.zshrc` or `~/.bash_profile`.

**Problem**: Tap already exists error

**Solution**: Update the existing tap:

```bash
brew update
brew upgrade hashicorp/tap/terraform
```

**Problem**: Permission denied errors

**Solution**: Fix Homebrew permissions:

```bash
sudo chown -R $(whoami) /opt/homebrew
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 or later, or Debian 10 (Buster) or later (64-bit)
- sudo privileges
- `wget`, `gnupg`, and `software-properties-common` packages

**Important**: Do not use `snap install terraform`. The Snap package is maintained by the community, not HashiCorp. Use the official HashiCorp APT repository for production environments.

#### Installation Steps

**Step 1: Install prerequisite packages**

Ensure your system has the required packages for GPG key management:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnupg software-properties-common wget
```

**Step 2: Add HashiCorp's GPG key**

Download and install HashiCorp's GPG key for package verification:

```bash
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
```

**Step 3: Add the HashiCorp repository**

Add the official HashiCorp repository to your APT sources:

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release || lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
```

**Step 4: Install Terraform**

Update the package list and install Terraform:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y terraform
```

#### Verification

Confirm the installation succeeded:

```bash
terraform --version
```

Expected output (version numbers may vary):

```
Terraform v1.14.3
on linux_amd64
```

#### Troubleshooting

**Problem**: `E: Unable to locate package terraform`

**Solution**: The repository was not added correctly. Verify the hashicorp.list file exists and contains valid content:

```bash
cat /etc/apt/sources.list.d/hashicorp.list
```

If empty or missing, repeat Steps 2 and 3.

**Problem**: GPG key import fails

**Solution**: Ensure wget is installed and you have network connectivity:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget ca-certificates
```

**Problem**: `lsb_release: command not found`

**Solution**: Install the lsb-release package:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y lsb-release
```

Alternatively, the command uses a fallback to `/etc/os-release` which should work on most systems.

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit strongly recommended) - Bookworm or Bullseye
- Raspberry Pi 3B+ or later (64-bit capable hardware)
- sudo privileges

**Important Architecture Note**: The HashiCorp APT repository provides packages only for AMD64 (x86_64) architecture. For ARM-based Raspberry Pi systems, you must use manual binary installation with the Linux ARM64 binary.

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM (use manual installation below)
- `armv7l` = 32-bit ARM (use manual installation below, 32-bit binary)
- `x86_64` = 64-bit Intel/AMD (can use APT repository)

#### Installation Steps

**For ARM64 Raspberry Pi OS (aarch64) - Manual Binary Installation:**

```bash
# Download the latest Terraform ARM64 binary
TERRAFORM_VERSION="1.14.3"
wget -q "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_arm64.zip" -O /tmp/terraform.zip

# Install unzip if not present
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y unzip

# Extract and install
unzip -o -q /tmp/terraform.zip -d /tmp
sudo mv /tmp/terraform /usr/local/bin/
sudo chmod +x /usr/local/bin/terraform

# Clean up
rm -f /tmp/terraform.zip
```

**For 32-bit Raspberry Pi OS (armv7l):**

```bash
# Download the 32-bit ARM binary
TERRAFORM_VERSION="1.14.3"
wget -q "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_arm.zip" -O /tmp/terraform.zip

# Install unzip if not present
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y unzip

# Extract and install
unzip -o -q /tmp/terraform.zip -d /tmp
sudo mv /tmp/terraform /usr/local/bin/
sudo chmod +x /usr/local/bin/terraform

# Clean up
rm -f /tmp/terraform.zip
```

#### Verification

Confirm the installation succeeded:

```bash
terraform --version
```

Expected output for ARM64 (version numbers may vary):

```
Terraform v1.14.3
on linux_arm64
```

#### Troubleshooting

**Problem**: `terraform: command not found` after installation

**Solution**: Ensure `/usr/local/bin` is in your PATH:

```bash
echo $PATH | grep -q "/usr/local/bin" || export PATH=$PATH:/usr/local/bin
```

For permanent fix, add to `~/.bashrc`:

```bash
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: `unzip: command not found`

**Solution**: Install unzip:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y unzip
```

**Problem**: Download fails with certificate error

**Solution**: Install CA certificates:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates
```

**Problem**: Slow download speeds

**Solution**: Raspberry Pi SD cards and network can be slow. Use a wired ethernet connection and a high-quality SD card (Class 10 or faster), or boot from USB/SSD.

---

### Amazon Linux/RHEL (YUM/DNF)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), or RHEL 7/8/9
- sudo privileges
- `yum-utils` package (for repository management)

**Note**: Amazon Linux 2023 uses DNF as the default package manager. Amazon Linux 2 and older RHEL versions use YUM. The commands below use YUM which works on both.

#### Installation Steps

**Step 1: Install yum-utils**

Install the yum-utils package for repository management:

```bash
sudo yum install -y yum-utils
```

**Step 2: Add the HashiCorp repository**

**For Amazon Linux:**

```bash
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/AmazonLinux/hashicorp.repo
```

**For RHEL/CentOS:**

```bash
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo
```

**Step 3: Install Terraform**

```bash
sudo yum install -y terraform
```

#### Verification

Confirm the installation succeeded:

```bash
terraform --version
```

Expected output (version numbers may vary):

```
Terraform v1.14.3
on linux_amd64
```

Verify the repository is configured:

```bash
yum repolist | grep hashicorp
```

#### Troubleshooting

**Problem**: `No package terraform available`

**Solution**: The repository was not added correctly. Verify it exists:

```bash
ls /etc/yum.repos.d/ | grep hashicorp
```

If missing, repeat Step 2.

**Problem**: Repository GPG key verification fails

**Solution**: Import the HashiCorp GPG key manually:

```bash
sudo rpm --import https://rpm.releases.hashicorp.com/gpg
```

**Problem**: DNF vs YUM confusion on Amazon Linux 2023

**Solution**: Both `yum` and `dnf` work on AL2023 as `yum` is aliased to `dnf`. The commands above work on both AL2 and AL2023.

**Problem**: Package conflicts with previous installation

**Solution**: Remove any manually installed Terraform first:

```bash
sudo rm -f /usr/local/bin/terraform
hash -r
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

**Note**: HashiCorp does not maintain the Chocolatey package directly. For production environments requiring the absolute latest version on release day, consider manual installation. However, Chocolatey is regularly updated and provides a convenient installation method.

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install terraform -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

#### Verification

Open a new Command Prompt or PowerShell window (required for PATH to update), then run:

```powershell
terraform --version
```

Expected output (version numbers may vary):

```
Terraform v1.14.3
on windows_amd64
```

#### Troubleshooting

**Problem**: `terraform: The term 'terraform' is not recognized`

**Solution**: Open a new terminal window. The PATH is updated during installation but existing windows do not reflect this. Alternatively, refresh the environment:

```powershell
refreshenv
```

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: Chocolatey installs an older version

**Solution**: Check for updates:

```powershell
choco upgrade terraform -y
```

**Problem**: Need to install a specific version

**Solution**: Specify the version number:

```powershell
choco install terraform --version=1.14.3 -y
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows Subsystem for Linux with Ubuntu installed
- WSL 2 recommended for best performance
- sudo privileges within WSL

WSL Ubuntu installations follow the same process as native Ubuntu, using the HashiCorp APT repository. Because WSL provides a full Linux environment, you install Terraform inside WSL, not on Windows.

#### Installation Steps

Run these commands in your WSL Ubuntu terminal:

**Step 1: Install prerequisite packages**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnupg software-properties-common wget
```

**Step 2: Add HashiCorp's GPG key**

```bash
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
```

**Step 3: Add the HashiCorp repository**

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release || lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
```

**Step 4: Install Terraform**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y terraform
```

#### Verification

Confirm the installation succeeded:

```bash
terraform --version
```

Expected output (version numbers may vary):

```
Terraform v1.14.3
on linux_amd64
```

#### Troubleshooting

**Problem**: GPG key import fails with network error

**Solution**: WSL may have DNS issues. Try using Google's DNS:

```bash
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null
```

**Problem**: `lsb_release: command not found`

**Solution**: Install the lsb-release package:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y lsb-release
```

**Problem**: Terraform works in WSL but not in Windows PowerShell

**Solution**: WSL and Windows have separate PATH environments. Terraform installed in WSL is only available within WSL. If you need Terraform in Windows, install it separately using Chocolatey (see Windows section).

**Problem**: File permission issues when working with Windows files

**Solution**: When accessing files in `/mnt/c/` (Windows filesystem), you may encounter permission issues. Store Terraform configurations in your WSL home directory (`~/`) for best compatibility, or configure WSL mount options in `/etc/wsl.conf`.

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Terraform installed on Windows (see Windows section) OR manual installation

**Note**: Git Bash on Windows does not require a separate Terraform installation. Git Bash inherits the Windows PATH, so once Terraform is installed on Windows via Chocolatey, winget, or manual installation, the `terraform` command is automatically available in Git Bash.

#### Installation Steps

**Recommended Method: Use Chocolatey (see Windows section)**

Install Terraform on Windows using Chocolatey from an Administrator PowerShell:

```powershell
choco install terraform -y
```

Then open Git Bash - the `terraform` command will be available.

**Alternative: Manual Installation for Git Bash**

If you prefer not to use a package manager, download and configure Terraform manually:

**Step 1: Download Terraform**

Open Git Bash and download the Windows AMD64 binary:

```bash
TERRAFORM_VERSION="1.14.3"
curl -Lo /tmp/terraform.zip "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_windows_amd64.zip"
```

**Step 2: Extract and install**

```bash
# Create a directory for Terraform
mkdir -p ~/bin

# Extract the binary
unzip -o -q /tmp/terraform.zip -d ~/bin

# Clean up
rm -f /tmp/terraform.zip
```

**Step 3: Add to PATH**

Add the bin directory to your PATH in `~/.bashrc`:

```bash
echo 'export PATH=$PATH:$HOME/bin' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

In Git Bash, confirm Terraform is accessible:

```bash
terraform --version
```

Expected output (version numbers may vary):

```
Terraform v1.14.3
on windows_amd64
```

#### Troubleshooting

**Problem**: `terraform: command not found` in Git Bash after Chocolatey installation

**Solution**: Close and reopen Git Bash to inherit the updated Windows PATH. If it still does not work, verify Terraform is in the Windows PATH:

```bash
echo $PATH | tr ':' '\n' | grep -i terraform
```

If not found, add the Chocolatey bin directory:

```bash
echo 'export PATH=$PATH:/c/ProgramData/chocolatey/bin' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: PATH not persisting across Git Bash sessions

**Solution**: Ensure changes are in `~/.bashrc`, not `~/.bash_profile`. Git Bash sources `~/.bashrc` by default.

**Problem**: `unzip: command not found`

**Solution**: Git Bash includes unzip. If missing, use Git for Windows' built-in extraction or install unzip via Chocolatey:

```powershell
choco install unzip -y
```

**Problem**: curl SSL certificate errors

**Solution**: Update Git for Windows to the latest version, or use wget:

```bash
wget -q "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_windows_amd64.zip" -O /tmp/terraform.zip
```

---

## Post-Installation Configuration

After installing Terraform on any platform, consider these optional but recommended configurations.

### Enable Tab Completion

Terraform supports tab completion for Bash and Zsh. Install the completion script:

**For Bash:**

```bash
terraform -install-autocomplete
```

This adds the completion configuration to your `~/.bashrc`. Restart your shell or run:

```bash
source ~/.bashrc
```

**For Zsh:**

```bash
terraform -install-autocomplete
```

This adds the completion configuration to your `~/.zshrc`. Restart your shell or run:

```bash
source ~/.zshrc
```

### Verify Provider Plugin Cache (Optional)

For faster provider downloads across multiple projects, configure a shared plugin cache:

```bash
mkdir -p ~/.terraform.d/plugin-cache

cat >> ~/.terraformrc << 'EOF'
plugin_cache_dir = "$HOME/.terraform.d/plugin-cache"
EOF
```

### Configure Credentials for Cloud Providers

Terraform needs credentials to interact with cloud providers. Configure them according to your target platform:

**AWS:**

```bash
aws configure
# Or set environment variables:
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

**Azure:**

```bash
az login
```

**Google Cloud:**

```bash
gcloud auth application-default login
```

---

## Common Issues

### Issue: "Terraform version X required, but version Y installed"

**Symptoms**: Error message indicating version mismatch when running `terraform init`.

**Solution**: Some projects require specific Terraform versions. Check the project's `required_version` constraint in `terraform` block. Install the required version or use a version manager like `tfenv`.

### Issue: Provider Plugin Download Failures

**Symptoms**: `terraform init` fails with network errors or timeouts.

**Solutions**:

- Check internet connectivity
- Configure proxy settings if behind a corporate firewall:

```bash
export HTTP_PROXY="http://proxy.example.com:8080"
export HTTPS_PROXY="http://proxy.example.com:8080"
```

- Use a provider mirror or network mirror (for air-gapped environments)

### Issue: State File Locking Errors

**Symptoms**: `Error acquiring the state lock` when running Terraform commands.

**Solutions**:

- Wait for other Terraform operations to complete
- If the lock is stale (previous operation crashed), force unlock:

```bash
terraform force-unlock LOCK_ID
```

**Warning**: Only use `force-unlock` when you are certain no other operation is running.

### Issue: "Permission denied" When Creating Resources

**Symptoms**: Cloud provider returns authorization or permission errors.

**Solution**: Verify your credentials have the necessary permissions:

```bash
# For AWS
aws sts get-caller-identity

# For Azure
az account show

# For GCP
gcloud auth list
```

### Issue: Large State Files Causing Slow Operations

**Symptoms**: `terraform plan` and `terraform apply` take a long time.

**Solutions**:

- Use remote state backends (S3, Azure Blob, GCS) instead of local state
- Split large configurations into smaller, focused modules
- Use `-target` flag sparingly to operate on specific resources

### Issue: "Backend configuration changed"

**Symptoms**: Error when switching between backend configurations.

**Solution**: Migrate state to the new backend:

```bash
terraform init -migrate-state
```

Or reconfigure without migrating (use with caution):

```bash
terraform init -reconfigure
```

---

## References

- [Terraform Official Installation Documentation](https://developer.hashicorp.com/terraform/install)
- [Terraform CLI Install Tutorial](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli)
- [Terraform APT Packages (Ubuntu/Debian)](https://developer.hashicorp.com/terraform/cli/install/apt)
- [Terraform YUM Packages (RHEL/Amazon Linux)](https://developer.hashicorp.com/terraform/cli/install/yum)
- [Terraform Releases Page](https://releases.hashicorp.com/terraform/)
- [Terraform GitHub Repository](https://github.com/hashicorp/terraform)
- [HashiCorp Homebrew Tap](https://github.com/hashicorp/homebrew-tap)
- [Terraform Chocolatey Package](https://community.chocolatey.org/packages/terraform)
- [Microsoft Learn: Install Terraform on Windows with Bash](https://learn.microsoft.com/en-us/azure/developer/terraform/get-started-windows-bash)
- [Terraform Registry (Providers and Modules)](https://registry.terraform.io/)
