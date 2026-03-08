# Installing Docker

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- **Optional:** None
- **Auto-installed:** None (Docker Desktop includes all components)

### Ubuntu (APT/Snap)
- **Required:**
  - `ca-certificates` - Install via `sudo apt install ca-certificates`
  - `curl` - Install via `sudo apt install curl`
- **Optional:** None
- **Auto-installed:**
  - `docker-ce` (Docker Engine)
  - `docker-ce-cli` (Docker CLI)
  - `containerd.io` (Container runtime)
  - `docker-buildx-plugin` (BuildKit plugin)
  - `docker-compose-plugin` (Compose v2)

### Raspberry Pi OS (APT/Snap)
- **Required:**
  - `ca-certificates` - Install via `sudo apt install ca-certificates`
  - `curl` - Install via `sudo apt install curl`
- **Optional:** None
- **Auto-installed:**
  - `docker-ce` (Docker Engine)
  - `docker-ce-cli` (Docker CLI)
  - `containerd.io` (Container runtime)
  - `docker-buildx-plugin` (BuildKit plugin)
  - `docker-compose-plugin` (Compose v2)

### Amazon Linux (DNF/YUM)
- **Required:** None (DNF/YUM are pre-installed on Amazon Linux)
- **Optional:**
  - `docker-compose-plugin` - Install via `sudo dnf install docker-compose-plugin` (AL2023 only, for AL2 manual installation required)
- **Auto-installed:**
  - `docker` (main package includes Docker Engine)

### Windows (Chocolatey/winget)
- **Required:**
  - Chocolatey - Install via PowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
  - WSL 2 - Install via `wsl --install` (recommended) or Hyper-V enabled via PowerShell
- **Optional:** None
- **Auto-installed:** None (Docker Desktop is a complete package)

### Git Bash (Manual/Portable)
- **Required:**
  - Docker Desktop on Windows host - Install via `choco install docker-desktop -y` from Administrator PowerShell
  - Chocolatey on Windows host - Install via PowerShell (see Windows section above)
- **Optional:**
  - `winpty` - Typically pre-installed with Git Bash, used for interactive containers with `winpty docker run -it <image>`
- **Auto-installed:** None (Git Bash uses the Windows host's Docker installation)

## Overview

Docker is a containerization platform that enables developers to package applications and their dependencies into standardized units called containers. These containers run consistently across different environments, solving the "it works on my machine" problem. Docker provides two main products:

- **Docker Engine**: The core runtime for building and running containers, ideal for servers and CI/CD pipelines
- **Docker Desktop**: A GUI application that includes Docker Engine plus additional tools like Docker Compose, Kubernetes, and a visual dashboard, ideal for desktop development environments

This guide documents Docker Desktop installation for desktop platforms (macOS, Windows) and Docker Engine for server platforms (Ubuntu, Raspberry Pi OS, Amazon Linux).

## Prerequisites

Before installing Docker on any platform, ensure:

1. **Internet connectivity** - Required to download Docker packages
2. **Administrative privileges** - Required for system-wide installation
3. **Virtualization support** - Required on Windows and macOS (Docker Desktop uses a VM)
4. **Sufficient resources** - Minimum 4 GB RAM and 10 GB free disk space recommended

**Important**: If you have older Docker installations (docker, docker-engine, docker.io, or docker-ce), remove them before installing to avoid conflicts.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 14 (Sonoma) or later (Docker Desktop supports the current and two previous major macOS releases)
- Homebrew package manager installed
- At least 4 GB RAM
- Apple Silicon (M1/M2/M3) or Intel processor

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Docker Desktop:

```bash
brew install --quiet --cask docker
```

The `--quiet` flag suppresses non-essential output, and `--cask` specifies the graphical application version (Docker Desktop) rather than just the CLI tools.

After installation, start Docker Desktop from the Applications folder or via command line:

```bash
open -a Docker
```

**Note**: On first launch, Docker Desktop will require your password to install privileged helper components. This is a one-time requirement.

#### Verification

Confirm the installation succeeded:

```bash
docker --version
```

Expected output (version numbers may vary):

```
Docker version 27.4.1, build b9d17ea
```

Test Docker is running correctly:

```bash
docker run hello-world
```

This downloads a test image and runs it. If successful, you will see a message beginning with "Hello from Docker!"

#### Troubleshooting

**Problem**: `docker: command not found` after installation

**Solution**: Docker Desktop may not be running. Start it from Applications:

```bash
open -a Docker
```

Wait for the Docker icon in the menu bar to show "Docker Desktop is running" before running commands.

**Problem**: "Cannot connect to the Docker daemon"

**Solution**: Docker Desktop is not running. Start it and wait for initialization:

```bash
open -a Docker
sleep 30
docker ps
```

**Problem**: Slow performance on Apple Silicon

**Solution**: Ensure you are using the native Apple Silicon version. Reinstall with:

```bash
brew uninstall --cask docker
brew install --quiet --cask docker
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 22.04 (Jammy) or later, or Debian 11 (Bullseye) or later (64-bit)
- sudo privileges
- At least 4 GB RAM recommended

**Important**: Do not use `apt install docker.io` or `snap install docker`. These packages are maintained by third parties and may be outdated. Use Docker's official repository instead.

First, remove any conflicting packages:

```bash
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
  sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y $pkg 2>/dev/null || true
done
```

#### Installation Steps

**Step 1: Set up Docker's APT repository**

Add Docker's official GPG key and repository:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

Add the repository to APT sources:

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Note for Debian**: Replace `ubuntu` with `debian` in the URL above:

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

**Step 2: Install Docker Engine**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**Step 3: Configure Docker to start on boot and add user to docker group**

```bash
sudo systemctl enable docker.service
sudo systemctl enable containerd.service
sudo usermod -aG docker $USER
```

**Important**: Log out and log back in for the group membership to take effect, or run:

```bash
newgrp docker
```

#### Verification

Confirm the installation succeeded:

```bash
docker --version
```

Expected output (version numbers may vary):

```
Docker version 27.4.1, build b9d17ea
```

Verify Docker Engine is running:

```bash
sudo systemctl status docker
```

Test Docker works without sudo (after re-logging in):

```bash
docker run hello-world
```

#### Troubleshooting

**Problem**: `E: Unable to locate package docker-ce`

**Solution**: The repository was not added correctly. Verify the docker.list file exists:

```bash
cat /etc/apt/sources.list.d/docker.list
```

If empty or missing, repeat Step 1.

**Problem**: `Cannot connect to the Docker daemon`

**Solution**: Start the Docker service:

```bash
sudo systemctl start docker
```

**Problem**: Permission denied when running docker commands

**Solution**: Either use sudo, or ensure your user is in the docker group:

```bash
groups
```

If `docker` is not listed, add yourself and log out/in:

```bash
sudo usermod -aG docker $USER
```

**Problem**: GPG key import fails

**Solution**: Ensure curl and ca-certificates are installed:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl gnupg
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
- Raspberry Pi 3B+ or later (64-bit capable hardware)
- At least 2 GB RAM (4 GB recommended for multi-container workloads)
- sudo privileges

**Important Deprecation Notice**: Docker Engine v28 will be the last major version to support Raspberry Pi OS 32-bit (armhf). For long-term support, use 64-bit Raspberry Pi OS.

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit (recommended)
- `armv7l` = 32-bit (limited support)

Remove any conflicting packages:

```bash
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
  sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y $pkg 2>/dev/null || true
done
```

#### Installation Steps

**For 64-bit Raspberry Pi OS (aarch64):**

Use the Debian arm64 packages:

```bash
# Add Docker's GPG key
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y

# Install Docker
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**For 32-bit Raspberry Pi OS (armv7l):**

Use the Raspbian-specific packages:

```bash
# Add Docker's GPG key
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/raspbian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/raspbian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y

# Install Docker
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**Post-installation (both architectures):**

```bash
sudo systemctl enable docker.service
sudo systemctl enable containerd.service
sudo usermod -aG docker $USER
```

Log out and log back in for group membership to take effect.

#### Verification

Confirm the installation succeeded:

```bash
docker --version
```

Expected output (version numbers may vary):

```
Docker version 27.4.1, build b9d17ea
```

Test Docker works:

```bash
docker run hello-world
```

**Note**: On ARM architecture, not all Docker images are available. Use images with `arm64` or `arm/v7` tags, or multi-architecture images.

#### Troubleshooting

**Problem**: "no matching manifest for linux/arm/v7" or "no matching manifest for linux/arm64"

**Solution**: The image does not support ARM architecture. Look for ARM-compatible images or use official images which typically support multiple architectures.

**Problem**: Installation very slow

**Solution**: Raspberry Pi SD cards can be slow. Use a high-quality SD card (Class 10 or faster) or boot from USB/SSD.

**Problem**: Docker daemon fails to start with cgroup errors

**Solution**: Add cgroup options to boot config:

```bash
echo ' cgroup_memory=1 cgroup_enable=memory' | sudo tee -a /boot/cmdline.txt
sudo reboot
```

**Problem**: Out of memory errors

**Solution**: Add swap space or reduce container memory limits. Create a swap file:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- EC2 instance or compatible environment

**Note**: Amazon Linux 2023 uses DNF as the package manager. Amazon Linux 2 uses YUM. The commands below use DNF for AL2023; for AL2, replace `dnf` with `yum`.

#### Installation Steps

**For Amazon Linux 2023:**

```bash
# Update system packages
sudo dnf update -y

# Install Docker from Amazon's repository
sudo dnf install -y docker

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

**For Amazon Linux 2:**

```bash
# Update system packages
sudo yum update -y

# Install Docker using amazon-linux-extras
sudo amazon-linux-extras install -y docker

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

Log out and log back in for group membership to take effect.

**Installing Docker Compose:**

Docker Compose v2 is installed as a plugin. On Amazon Linux, install it separately:

```bash
# For AL2023
sudo dnf install -y docker-compose-plugin

# For AL2 (manual installation)
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | cut -d'"' -f4)
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Verification

Confirm the installation succeeded:

```bash
docker --version
```

Expected output (version numbers may vary):

```
Docker version 25.0.3, build 4debf41
```

**Note**: Amazon's repository may have a slightly older version than Docker's official repository. This is intentional for stability.

Verify Docker is running:

```bash
sudo systemctl status docker
```

Test Docker works:

```bash
docker run hello-world
```

#### Troubleshooting

**Problem**: `No match for argument: docker` on Amazon Linux 2

**Solution**: Use amazon-linux-extras:

```bash
sudo amazon-linux-extras install -y docker
```

**Problem**: Docker version is older than expected

**Solution**: Amazon's repository prioritizes stability. If you need the latest version, use Docker's official CentOS repository (compatible with Amazon Linux):

```bash
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo sed -i 's/$releasever/9/g' /etc/yum.repos.d/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**Problem**: `Cannot connect to the Docker daemon`

**Solution**: Start the Docker service:

```bash
sudo systemctl start docker
```

**Problem**: Permission denied

**Solution**: Ensure Docker service is running and you are in the docker group:

```bash
sudo systemctl status docker
groups
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 version 21H2 or higher (64-bit), or Windows 11
- BIOS-level virtualization enabled (Intel VT-x or AMD-V)
- WSL 2 backend (recommended) or Hyper-V enabled
- At least 4 GB RAM
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install docker-desktop -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Note**: A system restart may be required after installation to complete the setup.

After restart, Docker Desktop will launch automatically. If not, start it from the Start Menu.

#### Verification

Open a new Command Prompt or PowerShell window, then run:

```powershell
docker --version
```

Expected output (version numbers may vary):

```
Docker version 27.4.1, build b9d17ea
```

Test Docker works:

```powershell
docker run hello-world
```

#### Troubleshooting

**Problem**: "WSL 2 installation is incomplete" error

**Solution**: Install WSL 2 before Docker Desktop:

```powershell
wsl --install
```

Restart your computer and then retry Docker Desktop installation.

**Problem**: "Virtualization must be enabled" error

**Solution**: Enable virtualization in your BIOS/UEFI settings. The exact steps vary by manufacturer. Look for settings named "Intel VT-x", "Intel Virtualization Technology", "AMD-V", or "SVM Mode".

**Problem**: Docker Desktop fails to start with Hyper-V error

**Solution**: Enable Hyper-V from an Administrator PowerShell:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All -NoRestart
Enable-WindowsOptionalFeature -Online -FeatureName Containers -All -NoRestart
Restart-Computer
```

**Problem**: `docker: command not found` in terminal

**Solution**: Docker Desktop may not be running. Start it from the Start Menu and wait for initialization (look for the whale icon in the system tray).

**Problem**: Slow performance

**Solution**: Use WSL 2 backend (recommended) instead of Hyper-V. In Docker Desktop settings, ensure "Use the WSL 2 based engine" is checked.

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

**Recommended Approach**: Install Docker Desktop on Windows (see Windows section) and enable WSL 2 integration. Docker Desktop automatically provides Docker access within WSL distributions without separate installation.

**Alternative Approach**: Install Docker Engine directly within WSL (documented below). Use this approach if you prefer not to use Docker Desktop or need Docker only within WSL.

#### Installation Steps

**Option A: Docker Desktop Integration (Recommended)**

1. Install Docker Desktop on Windows (see Windows section)
2. Open Docker Desktop settings
3. Navigate to Resources > WSL Integration
4. Enable integration for your Ubuntu distribution
5. Docker commands will now work in your WSL Ubuntu terminal

**Option B: Docker Engine in WSL (Without Docker Desktop)**

Run these commands in your WSL Ubuntu terminal:

```bash
# Remove any conflicting packages
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
  sudo DEBIAN_FRONTEND=noninteractive apt-get remove -y $pkg 2>/dev/null || true
done

# Add Docker's GPG key
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y

# Install Docker
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
```

**Starting Docker in WSL:**

WSL does not use systemd by default, so Docker must be started manually:

```bash
sudo service docker start
```

To start Docker automatically when WSL launches, add to your `~/.bashrc`:

```bash
echo 'if [ -z "$(pgrep -x dockerd)" ]; then sudo service docker start > /dev/null 2>&1; fi' >> ~/.bashrc
```

Configure passwordless sudo for the docker service (optional):

```bash
echo "$USER ALL=(ALL) NOPASSWD: /usr/sbin/service docker *" | sudo tee /etc/sudoers.d/docker-service
```

#### Verification

Confirm the installation succeeded:

```bash
docker --version
```

Expected output (version numbers may vary):

```
Docker version 27.4.1, build b9d17ea
```

Test Docker works:

```bash
docker run hello-world
```

#### Troubleshooting

**Problem**: `Cannot connect to the Docker daemon` in WSL

**Solution**: Start the Docker service:

```bash
sudo service docker start
```

**Problem**: iptables errors when starting Docker

**Solution**: Switch to iptables-legacy:

```bash
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy
sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy
sudo service docker restart
```

**Problem**: Docker works in WSL but not in Windows terminal

**Solution**: If using Docker Desktop, ensure WSL integration is enabled. If using Docker Engine in WSL only, Docker commands will only work from within WSL.

**Problem**: "permission denied" errors after adding user to docker group

**Solution**: Close and restart your WSL terminal, or run:

```bash
newgrp docker
```

---

### Git Bash (Windows Installation)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Docker Desktop installed on Windows (see Windows section)

**Note**: Git Bash on Windows does not require a separate Docker installation. Git Bash inherits the Windows PATH, so once Docker Desktop is installed on Windows, the `docker` command is automatically available in Git Bash.

#### Installation Steps

1. Install Docker Desktop on Windows using Chocolatey (see Windows section):

```bash
# Run from Administrator PowerShell or Command Prompt
choco install docker-desktop -y
```

2. Restart your computer if prompted

3. Launch Docker Desktop from the Start Menu and wait for it to initialize

4. Open Git Bash - the `docker` command will be available

#### Verification

In Git Bash, confirm Docker is accessible:

```bash
docker --version
```

Expected output (version numbers may vary):

```
Docker version 27.4.1, build b9d17ea
```

Test Docker works:

```bash
docker run hello-world
```

#### Troubleshooting

**Problem**: `docker: command not found` in Git Bash

**Solution**: Docker Desktop may not be running or PATH may not be inherited. First, ensure Docker Desktop is running (check for whale icon in system tray). Then verify the PATH includes Docker:

```bash
echo $PATH | tr ':' '\n' | grep -i docker
```

If Docker is not in PATH, add it to your `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/c/Program Files/Docker/Docker/resources/bin"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: `the input device is not a TTY` error

**Solution**: Git Bash's mintty terminal has TTY compatibility issues with Docker. Use `winpty` prefix:

```bash
winpty docker run -it ubuntu bash
```

Or add an alias to your `~/.bashrc`:

```bash
echo 'alias docker="winpty docker"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Volume mount paths not working

**Solution**: Git Bash automatically converts Unix-style paths. For volume mounts, prefix with double slash or use Windows-style paths:

```bash
# Use double leading slash
docker run -v //c/Users/me/project:/app ubuntu ls /app

# Or use MSYS_NO_PATHCONV
MSYS_NO_PATHCONV=1 docker run -v /c/Users/me/project:/app ubuntu ls /app
```

**Problem**: Docker Compose commands fail

**Solution**: Docker Compose v2 is integrated as `docker compose` (with a space). The old `docker-compose` command may not work in Git Bash. Use:

```bash
docker compose up
```

Instead of:

```bash
docker-compose up
```

---

## Post-Installation Configuration

After installing Docker on any platform, consider these optional but recommended configurations.

### Running Docker Without sudo (Linux)

On Linux systems, Docker requires root privileges by default. To run Docker commands without `sudo`:

1. Create the docker group (if it does not exist):

```bash
sudo groupadd docker
```

2. Add your user to the docker group:

```bash
sudo usermod -aG docker $USER
```

3. Log out and log back in for the change to take effect, or run:

```bash
newgrp docker
```

4. Verify you can run Docker without sudo:

```bash
docker run hello-world
```

**Security Warning**: The docker group grants root-equivalent privileges. Only add trusted users to this group.

### Configuring Docker to Start on Boot (Linux)

On systems using systemd:

```bash
sudo systemctl enable docker.service
sudo systemctl enable containerd.service
```

### Configuring Default Registry Mirror

To use a custom registry mirror (useful for corporate environments or improving pull speeds), create or edit `/etc/docker/daemon.json`:

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "registry-mirrors": ["https://mirror.example.com"]
}
EOF
sudo systemctl restart docker
```

### Configuring Log Rotation

By default, Docker container logs can grow unbounded. Configure log rotation:

```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
sudo systemctl restart docker
```

### Verifying Docker Compose

Docker Compose v2 is included with Docker Engine and Docker Desktop. Verify it is available:

```bash
docker compose version
```

Expected output (version numbers may vary):

```
Docker Compose version v2.32.1
```

---

## Common Issues

### Issue: "Cannot connect to the Docker daemon"

**Symptoms**: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

**Solutions**:

- **Linux**: Start the Docker service:

```bash
sudo systemctl start docker
```

- **macOS/Windows**: Ensure Docker Desktop is running (check for icon in menu bar/system tray)

- **WSL**: Start Docker manually:

```bash
sudo service docker start
```

### Issue: Permission Denied

**Symptoms**: `Got permission denied while trying to connect to the Docker daemon socket`

**Solutions**:

- Add your user to the docker group:

```bash
sudo usermod -aG docker $USER
```

- Log out and log back in
- As a temporary workaround, use sudo:

```bash
sudo docker run hello-world
```

### Issue: Disk Space Full

**Symptoms**: Docker operations fail with "no space left on device"

**Solutions**:

Remove unused Docker objects:

```bash
# Remove unused containers, networks, images, and volumes
docker system prune -af --volumes
```

Check Docker disk usage:

```bash
docker system df
```

### Issue: Network Conflicts

**Symptoms**: Containers cannot access the internet or conflict with host network

**Solutions**:

Restart Docker to reset networking:

```bash
# Linux
sudo systemctl restart docker

# macOS/Windows
# Restart Docker Desktop from the menu
```

Check if Docker networks conflict with your host network:

```bash
docker network ls
docker network inspect bridge
```

### Issue: Container DNS Resolution Failures

**Symptoms**: Containers cannot resolve hostnames

**Solutions**:

Configure custom DNS in `/etc/docker/daemon.json`:

```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
EOF
sudo systemctl restart docker
```

### Issue: Slow Image Pulls

**Symptoms**: `docker pull` takes very long or times out

**Solutions**:

- Check your internet connection
- Use a registry mirror (see Post-Installation Configuration)
- For corporate networks, configure proxy settings:

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf > /dev/null <<'EOF'
[Service]
Environment="HTTP_PROXY=http://proxy.example.com:8080"
Environment="HTTPS_PROXY=http://proxy.example.com:8080"
Environment="NO_PROXY=localhost,127.0.0.1"
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

---

## References

- [Docker Official Installation Documentation](https://docs.docker.com/engine/install/)
- [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Engine on Debian](https://docs.docker.com/engine/install/debian/)
- [Docker Engine on Raspberry Pi OS](https://docs.docker.com/engine/install/raspberry-pi-os/)
- [Docker Desktop WSL 2 Backend](https://docs.docker.com/desktop/features/wsl/)
- [Docker Post-Installation Steps for Linux](https://docs.docker.com/engine/install/linux-postinstall/)
- [Docker Desktop Homebrew Cask](https://formulae.brew.sh/cask/docker)
- [Docker Desktop Chocolatey Package](https://community.chocolatey.org/packages/docker-desktop)
- [AWS Documentation: Installing Docker on Amazon Linux](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-docker.html)
- [Microsoft Learn: Docker on WSL](https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-containers)
