# Installing OpenSSH

## Overview

OpenSSH (Open Secure Shell) is the premier suite of secure networking utilities based on the Secure Shell (SSH) protocol. Originally developed by the OpenBSD project, OpenSSH provides encrypted communication over unsecured networks, replacing insecure protocols like telnet, rlogin, and rsh.

OpenSSH includes:

- **ssh** - The SSH client for connecting to remote servers
- **sshd** - The SSH server daemon that accepts incoming connections
- **ssh-keygen** - Tool for generating SSH key pairs
- **ssh-agent** - Authentication agent for managing private keys
- **ssh-add** - Adds private keys to the authentication agent
- **scp** - Secure file copy utility
- **sftp** - Secure file transfer program
- **ssh-copy-id** - Tool for installing public keys on remote servers

This guide documents OpenSSH installation procedures for all platforms supported by DevUtils CLI.

## Prerequisites

Before installing OpenSSH on any platform, ensure:

1. **Internet connectivity** - Required to download OpenSSH packages
2. **Administrative privileges** - Required for system-wide installation (especially for the server component)
3. **Terminal access** - Required to run installation commands

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma or later recommended)
- Homebrew package manager installed
- Command line access via Terminal.app or iTerm2

macOS includes a pre-installed version of OpenSSH. However, Apple's bundled version may be older than the latest release. Homebrew provides a more recent version with additional features like FIDO2/U2F hardware key support.

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install OpenSSH:

```bash
brew install --quiet openssh
```

The `--quiet` flag suppresses non-essential output, making the installation suitable for automation and scripts.

After installation, the Homebrew version of OpenSSH will be available. The macOS system SSH remains intact at `/usr/bin/ssh`.

**Note**: To use the Homebrew version by default, ensure Homebrew's bin directory is first in your PATH. Add the following to your `~/.zshrc`:

For Apple Silicon Macs:
```bash
export PATH="/opt/homebrew/bin:$PATH"
```

For Intel Macs:
```bash
export PATH="/usr/local/bin:$PATH"
```

#### Verification

Confirm the installation succeeded:

```bash
ssh -V
```

Expected output (version numbers may vary):

```
OpenSSH_10.2p1, OpenSSL 3.6.0 10 Jun 2025
```

Verify you are using the Homebrew version:

```bash
which ssh
```

Expected output for Apple Silicon Macs:

```
/opt/homebrew/bin/ssh
```

Expected output for Intel Macs:

```
/usr/local/bin/ssh
```

#### Troubleshooting

**Problem**: `ssh -V` shows the older macOS version

**Solution**: The system version of SSH is being used instead of Homebrew's version. Ensure Homebrew's bin directory is in your PATH before `/usr/bin`:

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

**Problem**: Permission errors during installation

**Solution**: Homebrew should not require sudo. If you encounter permission errors, fix Homebrew permissions:

```bash
sudo chown -R $(whoami) /opt/homebrew
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- Internet connectivity

Ubuntu and Debian include OpenSSH in their default repositories. The SSH client is typically pre-installed on desktop systems, but the server component requires manual installation.

#### Installation Steps

**Step 1: Install OpenSSH client and server**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y openssh-client openssh-server
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures no interactive prompts appear during installation, making this suitable for scripts and automation.

**Step 2: Enable and start the SSH service**

```bash
sudo systemctl enable ssh --now
```

The `--now` flag enables the service for automatic startup and starts it immediately.

**Step 3: Configure firewall (if enabled)**

If UFW (Uncomplicated Firewall) is active, allow SSH connections:

```bash
sudo ufw allow ssh
```

#### Verification

Confirm the installation succeeded:

```bash
ssh -V
```

Expected output (version numbers may vary):

```
OpenSSH_9.6p1 Ubuntu-3ubuntu13, OpenSSL 3.0.13 30 Jan 2024
```

Verify the SSH service is running:

```bash
sudo systemctl status ssh
```

Expected output includes `Active: active (running)`.

Test local SSH connection (optional):

```bash
ssh localhost
```

This will prompt for your password and connect to your own machine, confirming the server is working.

#### Troubleshooting

**Problem**: `E: Unable to locate package openssh-server`

**Solution**: Update your package lists:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: SSH service fails to start

**Solution**: Check the service status and logs:

```bash
sudo systemctl status ssh
sudo journalctl -xeu ssh
```

Common causes include port 22 already in use or missing host keys. Regenerate host keys if needed:

```bash
sudo rm /etc/ssh/ssh_host_*
sudo dpkg-reconfigure openssh-server
```

**Problem**: Connection refused when connecting remotely

**Solution**: Verify the firewall allows SSH:

```bash
sudo ufw status
sudo ufw allow ssh
```

**Problem**: Ubuntu 24.04+ shows ssh.service as inactive

**Solution**: Ubuntu 24.04 and later use socket-based activation. The service appears inactive until the first connection. This is expected behavior. The socket should be active:

```bash
sudo systemctl status ssh.socket
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (Bookworm or Bullseye recommended)
- Raspberry Pi 3B+ or later (any model supported by Raspberry Pi OS)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so OpenSSH installation follows the Debian/APT method. OpenSSH works on both 32-bit (armhf) and 64-bit (arm64) architectures.

**Note**: SSH is disabled by default on Raspberry Pi OS for security reasons. This guide covers enabling it via the command line.

#### Installation Steps

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit ARM
- `armv7l` = 32-bit ARM

**Step 1: Install OpenSSH client and server**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y openssh-client openssh-server
```

**Step 2: Enable and start the SSH service**

```bash
sudo systemctl enable ssh --now
```

**Alternative method for headless setup**: Create an empty file named `ssh` on the boot partition of the SD card before first boot:

```bash
# On the SD card boot partition (from another computer)
touch /Volumes/boot/ssh   # macOS
# OR
touch /media/$USER/boot/ssh   # Linux
```

This enables SSH on first boot without requiring keyboard/monitor access.

#### Verification

Confirm the installation succeeded:

```bash
ssh -V
```

Expected output (version numbers may vary):

```
OpenSSH_9.2p1 Debian-2+deb12u3, OpenSSL 3.0.14 4 Jun 2024
```

Verify the SSH service is running:

```bash
sudo systemctl status ssh
```

Test SSH is accessible from another machine:

```bash
# From another computer on the same network
ssh pi@<raspberry-pi-ip-address>
```

Find your Raspberry Pi's IP address:

```bash
hostname -I
```

#### Troubleshooting

**Problem**: SSH connection refused

**Solution**: Verify the SSH service is enabled and running:

```bash
sudo systemctl enable ssh --now
sudo systemctl status ssh
```

**Problem**: Host key verification failed after reinstalling OS

**Solution**: Remove the old host key from your local machine:

```bash
ssh-keygen -R <raspberry-pi-ip-address>
```

**Problem**: SSH service fails with host key errors

**Solution**: Regenerate host keys:

```bash
sudo rm /etc/ssh/ssh_host_*
sudo dpkg-reconfigure openssh-server
```

**Problem**: Cannot connect on first boot

**Solution**: Ensure the `ssh` file exists on the boot partition. On newer Raspberry Pi OS versions, you may also need to create a `userconf.txt` file with username and password hash.

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- EC2 instance or compatible environment

Amazon Linux 2023 uses DNF as the default package manager. Amazon Linux 2 uses YUM. OpenSSH is typically pre-installed on Amazon Linux, but you may need to update it or install the server component.

**Note**: Amazon Linux EC2 instances come with SSH enabled by default (it is how you access the instance). The commands below ensure the latest version is installed.

#### Installation Steps

**For Amazon Linux 2023 (AL2023):**

```bash
sudo dnf install -y openssh-server openssh-clients
sudo systemctl enable sshd --now
```

**For Amazon Linux 2 (AL2):**

```bash
sudo yum install -y openssh-server openssh-clients
sudo systemctl enable sshd --now
```

The `-y` flag automatically confirms installation, enabling non-interactive execution.

**Note**: On Amazon Linux, the SSH service is named `sshd`, not `ssh`.

#### Verification

Confirm the installation succeeded:

```bash
ssh -V
```

Expected output for AL2023 (version numbers may vary):

```
OpenSSH_8.7p1, OpenSSL 3.0.8 7 Feb 2023
```

Verify the SSH service is running:

```bash
sudo systemctl status sshd
```

Check OpenSSH is listening on port 22:

```bash
sudo ss -tlnp | grep :22
```

#### Troubleshooting

**Problem**: `No match for argument: openssh-server` on Amazon Linux 2

**Solution**: Update the yum cache and retry:

```bash
sudo yum makecache
sudo yum install -y openssh-server openssh-clients
```

**Problem**: Cannot connect to EC2 instance

**Solution**: Verify the EC2 security group allows inbound SSH (port 22) from your IP address. Check in the AWS Console under EC2 > Security Groups.

**Problem**: Host key changed warning after instance replacement

**Solution**: Amazon Linux instances generate new host keys on first boot. Remove the old key from your known_hosts:

```bash
ssh-keygen -R <instance-ip-or-hostname>
```

**Problem**: SSH version is older than expected

**Solution**: Amazon's repositories prioritize stability. AL2023 includes OpenSSH 8.7. The `ssh-rsa` key exchange algorithm is disabled by default in OpenSSH 8.7+. Use Ed25519 keys for compatibility.

---

### Windows (PowerShell / winget)

#### Prerequisites

- Windows 10 version 1809 or later, or Windows 11
- Windows Server 2019 or later
- Administrator PowerShell
- Internet connectivity

Windows 10 (1809+) and Windows 11 include OpenSSH as an optional feature. Windows Server 2025 has OpenSSH installed by default.

#### Installation Steps

Open PowerShell as Administrator (right-click PowerShell and select "Run as administrator").

**Step 1: Install OpenSSH Client**

```powershell
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

**Step 2: Install OpenSSH Server (optional)**

Install only if you need to accept incoming SSH connections:

```powershell
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
```

**Step 3: Start and configure the SSH server (if installed)**

```powershell
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'
```

**Step 4: Configure firewall rule for SSH server (if installed)**

```powershell
if (!(Get-NetFirewallRule -Name "OpenSSH-Server-In-TCP" -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
}
```

**Alternative: Using winget**

For the latest beta/preview version with additional features:

```powershell
winget install Microsoft.OpenSSH.Beta --silent --accept-source-agreements --accept-package-agreements
```

#### Verification

Confirm the OpenSSH Client installation:

```powershell
ssh -V
```

Expected output (version numbers may vary):

```
OpenSSH_for_Windows_9.5p1, LibreSSL 3.8.2
```

Check the OpenSSH Server status (if installed):

```powershell
Get-Service sshd
```

Expected output includes `Status: Running`.

Verify the installation status:

```powershell
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'
```

Expected output shows `State: Installed` for installed components.

#### Troubleshooting

**Problem**: `Add-WindowsCapability` fails with error

**Solution**: Windows Update must be accessible. This command downloads components from Windows Update. Verify internet connectivity and that Windows Update is not disabled.

**Problem**: SSH server fails to start

**Solution**: Check the event log for errors:

```powershell
Get-EventLog -LogName Application -Source sshd -Newest 10
```

Regenerate host keys if corrupted:

```powershell
cd $env:ProgramData\ssh
Remove-Item ssh_host_* -Force
ssh-keygen -A
Start-Service sshd
```

**Problem**: Firewall blocking SSH connections

**Solution**: Verify the firewall rule exists and is enabled:

```powershell
Get-NetFirewallRule -Name "OpenSSH-Server-In-TCP"
```

**Problem**: `ssh` command not found after installation

**Solution**: Close and reopen PowerShell to refresh the PATH. If still not working, verify installation:

```powershell
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Client*'
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL

WSL runs Ubuntu (or another Linux distribution) within Windows. The SSH client is typically pre-installed. The SSH server requires additional configuration for external access.

**Important**: WSL SSH server is separate from Windows SSH server. They can run simultaneously on different ports.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

**Step 1: Install OpenSSH client and server**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y openssh-client openssh-server
```

**Step 2: Configure SSH for WSL (if running SSH server)**

Edit the SSH configuration to use a different port (to avoid conflict with Windows SSH):

```bash
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
sudo sed -i 's/#ListenAddress 0.0.0.0/ListenAddress 0.0.0.0/' /etc/ssh/sshd_config
```

**Step 3: Start the SSH service**

WSL does not use systemd by default, so start SSH manually:

```bash
sudo service ssh start
```

To start SSH automatically when WSL launches, add to your `~/.bashrc`:

```bash
echo 'if [ -z "$(pgrep -x sshd)" ]; then sudo service ssh start > /dev/null 2>&1; fi' >> ~/.bashrc
```

Configure passwordless sudo for the ssh service (optional):

```bash
echo "$USER ALL=(ALL) NOPASSWD: /usr/sbin/service ssh *" | sudo tee /etc/sudoers.d/ssh-service
```

**Step 4: Configure Windows firewall for external access (optional)**

From an Administrator PowerShell on Windows:

```powershell
New-NetFirewallRule -Name sshd-wsl -DisplayName 'OpenSSH Server (sshd) for WSL' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 2222
```

#### Verification

Confirm the installation succeeded:

```bash
ssh -V
```

Expected output (version numbers may vary):

```
OpenSSH_9.6p1 Ubuntu-3ubuntu13, OpenSSL 3.0.13 30 Jan 2024
```

Verify the SSH service is running (if server installed):

```bash
sudo service ssh status
```

Test local connection:

```bash
ssh -p 2222 localhost
```

#### Troubleshooting

**Problem**: SSH service fails to start with dependency error

**Solution**: Disable the ssh.socket if it conflicts:

```bash
sudo systemctl disable ssh.socket
sudo service ssh restart
```

**Problem**: Cannot connect to WSL from external machine

**Solution**: WSL 2 uses a virtual network. Port forwarding is required:

```powershell
# Run in Administrator PowerShell on Windows
netsh interface portproxy add v4tov4 listenport=2222 listenaddress=0.0.0.0 connectport=2222 connectaddress=$(wsl hostname -I | ForEach-Object { $_.Trim() })
```

**Problem**: WSL IP address changes on restart

**Solution**: WSL 2 assigns a new IP on each restart. Update port forwarding rules accordingly or use a script to automate this.

**Problem**: `service ssh start` requires password every time

**Solution**: Add the sudoers rule documented above to enable passwordless sudo for the ssh service.

---

### Git Bash (Bundled OpenSSH)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit or ARM64)
- Git for Windows installed
- No additional installation required

Git Bash includes a bundled version of OpenSSH. When you install Git for Windows, OpenSSH client tools (ssh, ssh-keygen, ssh-agent, scp, sftp) are automatically included.

**Note**: Git Bash provides only the SSH client, not the SSH server. For SSH server functionality on Windows, use the Windows OpenSSH Server (see Windows section).

#### Installation Steps

Git Bash automatically includes OpenSSH when Git for Windows is installed:

```powershell
choco install git -y
```

After installation, close and reopen your terminal. Open Git Bash from the Start Menu.

**Using Windows OpenSSH instead of bundled version (optional)**:

During Git for Windows installation, you can choose to use an external OpenSSH client. If you prefer the Windows-native OpenSSH:

1. Install OpenSSH on Windows (see Windows section above)
2. Configure Git to use the Windows SSH:

```bash
git config --global core.sshCommand "C:/Windows/System32/OpenSSH/ssh.exe"
```

#### Verification

Open Git Bash and run:

```bash
ssh -V
```

Expected output (version numbers may vary):

```
OpenSSH_9.6p1, OpenSSL 3.2.1 30 Jan 2024
```

Verify ssh-agent is available:

```bash
eval $(ssh-agent -s)
```

Expected output:

```
Agent pid 12345
```

Test SSH key generation:

```bash
ssh-keygen -t ed25519 -C "test@example.com" -f /tmp/test_key -N ""
ls -la /tmp/test_key*
rm /tmp/test_key*
```

#### Troubleshooting

**Problem**: SSH commands are slow or hang

**Solution**: Git Bash's SSH may conflict with Windows OpenSSH. Use one consistently:

```bash
# Check which ssh is being used
which ssh
```

If `/usr/bin/ssh` (Git Bash bundled), ensure ssh-agent is running properly.

**Problem**: Permission denied (publickey) errors

**Solution**: Ensure your SSH key is added to the agent:

```bash
eval $(ssh-agent -s)
ssh-add ~/.ssh/id_ed25519
```

**Problem**: SSH agent not persisting between sessions

**Solution**: Add to your `~/.bashrc`:

```bash
env=~/.ssh/agent.env

agent_load_env () { test -f "$env" && . "$env" >| /dev/null ; }

agent_start () {
    (umask 077; ssh-agent >| "$env")
    . "$env" >| /dev/null ; }

agent_load_env

agent_run_state=$(ssh-add -l >| /dev/null 2>&1; echo $?)

if [ ! "$SSH_AUTH_SOCK" ] || [ $agent_run_state = 2 ]; then
    agent_start
    ssh-add
elif [ "$SSH_AUTH_SOCK" ] && [ $agent_run_state = 1 ]; then
    ssh-add
fi

unset env
```

**Problem**: `the input device is not a TTY` error with interactive SSH

**Solution**: Use `winpty` prefix for interactive commands:

```bash
winpty ssh user@host
```

Or add an alias to `~/.bashrc`:

```bash
alias ssh="winpty ssh"
```

---

## Post-Installation Configuration

After installing OpenSSH on any platform, consider these common configurations.

### Generate SSH Key Pair

Create an Ed25519 key (recommended for modern systems):

```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```

For legacy systems requiring RSA:

```bash
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"
```

### Add Key to SSH Agent

Start the SSH agent and add your key:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### Copy Public Key to Remote Server

```bash
ssh-copy-id user@remote-host
```

On Windows (where ssh-copy-id is not available):

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh user@remote-host "cat >> .ssh/authorized_keys"
```

### Configure SSH Client

Create or edit `~/.ssh/config` to define connection shortcuts:

```
Host myserver
    HostName server.example.com
    User username
    IdentityFile ~/.ssh/id_ed25519
    Port 22

Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github
```

Usage:

```bash
ssh myserver   # Connects to server.example.com as username
```

### Secure SSH Server Configuration

On systems running an SSH server, edit `/etc/ssh/sshd_config`:

```bash
# Disable root login
PermitRootLogin no

# Disable password authentication (key-only)
PasswordAuthentication no

# Use only SSH protocol 2
Protocol 2
```

Restart SSH after changes:

```bash
# Linux
sudo systemctl restart sshd

# Windows (PowerShell)
Restart-Service sshd
```

---

## Common Issues

### Issue: Connection Timed Out

**Symptoms**: `ssh: connect to host example.com port 22: Connection timed out`

**Solutions**:

- Verify the remote host is reachable: `ping example.com`
- Check if SSH server is running on the remote host
- Verify firewall allows port 22 (or custom SSH port)
- Check security groups (cloud environments)

### Issue: Permission Denied (publickey)

**Symptoms**: `Permission denied (publickey)`

**Solutions**:

- Ensure your public key is on the server: `cat ~/.ssh/authorized_keys`
- Verify correct permissions:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

- Ensure ssh-agent has your key: `ssh-add -l`

### Issue: Host Key Verification Failed

**Symptoms**: `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!`

**Solutions**:

If the host was legitimately reinstalled or changed:

```bash
ssh-keygen -R hostname
```

If unexpected, this could indicate a man-in-the-middle attack. Verify with the system administrator.

### Issue: Too Many Authentication Failures

**Symptoms**: `Received disconnect from host: Too many authentication failures`

**Solutions**:

Limit which keys SSH tries:

```bash
ssh -o IdentitiesOnly=yes -i ~/.ssh/specific_key user@host
```

Or configure in `~/.ssh/config`:

```
Host example.com
    IdentitiesOnly yes
    IdentityFile ~/.ssh/specific_key
```

### Issue: SSH Slow to Connect

**Symptoms**: SSH connection takes 10+ seconds to establish

**Solutions**:

- Disable DNS lookup on server (edit `/etc/ssh/sshd_config`):
  ```
  UseDNS no
  ```

- Disable GSSAPI authentication:
  ```bash
  ssh -o GSSAPIAuthentication=no user@host
  ```

---

## References

- [OpenSSH Official Website](https://www.openssh.com/)
- [OpenSSH Manual Pages](https://man.openbsd.org/ssh)
- [Homebrew OpenSSH Formula](https://formulae.brew.sh/formula/openssh)
- [Ubuntu OpenSSH Server Documentation](https://documentation.ubuntu.com/server/how-to/security/openssh-server/)
- [Microsoft Learn: OpenSSH for Windows](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse)
- [Git for Windows SSH](https://gitforwindows.org/using-an-external-openssh-client.html)
- [Raspberry Pi SSH Documentation](https://www.raspberrypi.org/documentation/remote-access/ssh/)
- [Amazon Linux 2023 User Guide](https://docs.aws.amazon.com/linux/al2023/ug/)
- [Chocolatey OpenSSH Package](https://community.chocolatey.org/packages/openssh)
- [WSL OpenSSH Guide](https://learn.microsoft.com/en-us/windows/wsl/tutorials/ssh)
