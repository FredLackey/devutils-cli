# Installing yum-utils

## Overview

yum-utils is a collection of utilities and plugins that extend and supplement the YUM (Yellowdog Updater Modified) package manager on Red Hat-based Linux distributions. It provides essential tools for repository management, package debugging, and system administration tasks.

**Key utilities included in yum-utils:**

| Utility | Description |
|---------|-------------|
| `yum-config-manager` | Manage yum repository configuration and enable/disable repos |
| `repoquery` | Query yum repositories for package information |
| `yumdownloader` | Download RPM packages without installing them |
| `package-cleanup` | Clean up duplicate, orphaned, or old packages |
| `needs-restarting` | Report processes that need restarting after updates |
| `yum-builddep` | Install build dependencies for source RPMs |
| `reposync` | Synchronize a remote yum repository to a local directory |
| `yum-complete-transaction` | Complete interrupted yum transactions |
| `debuginfo-install` | Install debuginfo packages for debugging |
| `repomanage` | Manage RPM packages in a repository directory |

**Important Note on Naming:**
- **RHEL 7, CentOS 7, Amazon Linux 2**: Use `yum-utils`
- **RHEL 8+, CentOS Stream 8+, Fedora 22+, Amazon Linux 2023**: Use `dnf-utils` (the `yum-utils` package name still works as an alias on most systems)

The yum-utils project has been deprecated upstream in favor of DNF's built-in functionality and dnf-utils. However, the package remains essential for systems running RHEL 7 / CentOS 7 / Amazon Linux 2 and is still available (via compatibility packages) on newer systems.

## Platform Support Summary

| Platform | Support Level | Package Manager |
|----------|---------------|-----------------|
| macOS | Not Supported | N/A |
| Ubuntu/Debian | Not Supported | N/A |
| Raspberry Pi OS | Not Supported | N/A |
| Amazon Linux 2 | Fully Supported | YUM |
| Amazon Linux 2023 | Supported (via dnf-utils) | DNF |
| RHEL 7 / CentOS 7 | Fully Supported | YUM |
| RHEL 8+ / CentOS Stream | Supported (via yum-utils/dnf-utils) | DNF |
| Windows | Not Supported | N/A |
| Git Bash | Not Supported | N/A |

**Why yum-utils is not available on some platforms:** yum-utils is specifically designed for Red Hat-based package management (RPM/YUM/DNF). Debian-based systems (Ubuntu, Raspberry Pi OS) use APT, macOS uses Homebrew, and Windows uses Chocolatey/winget. There are no equivalents or ports of yum-utils for these platforms because the underlying package management systems are fundamentally different.

## Dependencies

### Amazon Linux 2 (YUM)

- **Required:**
  - `sudo` - Pre-installed on Amazon Linux for privilege escalation
  - `yum` - Pre-installed package manager on Amazon Linux 2
- **Optional:** None
- **Auto-installed:** The `yum-utils` package may pull in dependencies like `python`, `yum-plugin-fastestmirror`, etc.

**Note**: All required dependencies are pre-installed on Amazon Linux 2. No additional packages need to be installed before running this installer.

### Amazon Linux 2023 (DNF)

- **Required:**
  - `sudo` - Pre-installed on Amazon Linux for privilege escalation
  - `dnf` - Pre-installed package manager on Amazon Linux 2023
- **Optional:** None
- **Auto-installed:** The `dnf-utils` package (which provides yum-utils functionality) may pull in Python and DNF plugin dependencies.

**Note**: All required dependencies are pre-installed on Amazon Linux 2023. No additional packages need to be installed before running this installer.

### RHEL / CentOS (DNF/YUM)

- **Required:**
  - `sudo` - Pre-installed for privilege escalation
  - `dnf` (RHEL 8+) OR `yum` (RHEL 7) - Pre-installed package manager
- **Optional:** None
- **Auto-installed:** Various Python and plugin dependencies

**Note**: All required dependencies are pre-installed on RHEL and CentOS systems.

## Prerequisites

Before installing yum-utils, ensure:

1. **Administrative privileges** - Root or sudo access
2. **Internet connectivity** - Required to download packages from repositories
3. **Valid repository configuration** - The base repository must be enabled and accessible

## Platform-Specific Installation

### macOS (Homebrew)

#### Not Supported

yum-utils is not available for macOS. The package is specifically designed for Red Hat-based Linux distributions that use the RPM package format and YUM/DNF package managers.

**Why it is not supported:** macOS uses a completely different package management system. Homebrew is the de facto package manager for macOS and uses its own formula-based approach rather than RPM packages.

**Alternative approaches:** If you need to manage RPM-based systems from macOS, consider:

1. **SSH into the target system** - Connect to your Amazon Linux/RHEL server directly and run yum-utils commands there
2. **Use Docker** - Run an Amazon Linux or CentOS container on macOS for testing
3. **Use Vagrant** - Create a virtual machine running Amazon Linux or CentOS

```bash
# Example: Run Amazon Linux 2023 container on macOS
docker run -it --rm amazonlinux:2023 /bin/bash

# Inside the container, install and use yum-utils
dnf install -y dnf-utils
yum-config-manager --help
```

---

### Ubuntu/Debian (APT)

#### Not Supported

yum-utils is not available for Ubuntu or Debian. These distributions use APT (Advanced Package Tool) with DEB packages, not YUM/DNF with RPM packages.

**Why it is not supported:** Ubuntu and Debian are based on a completely different package management architecture. While a `yum-utils` package exists in some Debian/Ubuntu repositories for creating YUM repositories, it does not provide the same functionality and is known to have issues (segfaults, no configured repositories).

**Alternative approaches:** Ubuntu/Debian have native equivalents for yum-utils functionality:

| yum-utils Tool | APT/Debian Equivalent |
|----------------|----------------------|
| `yum-config-manager` | Edit `/etc/apt/sources.list` or use `add-apt-repository` |
| `repoquery` | `apt-cache show`, `apt-cache depends`, `dpkg -L` |
| `yumdownloader` | `apt-get download` |
| `package-cleanup` | `apt-get autoremove`, `apt-get autoclean` |
| `needs-restarting` | `needrestart` package |

```bash
# Example: Download a package without installing (Ubuntu equivalent of yumdownloader)
apt-get download nginx

# Example: Check package dependencies (Ubuntu equivalent of repoquery --requires)
apt-cache depends nginx

# Example: Clean up orphaned packages (Ubuntu equivalent of package-cleanup)
sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y
```

---

### Raspberry Pi OS (APT)

#### Not Supported

yum-utils is not available for Raspberry Pi OS. Like Ubuntu, Raspberry Pi OS is Debian-based and uses APT with DEB packages.

**Why it is not supported:** Raspberry Pi OS uses the same APT-based package management as Debian and Ubuntu. YUM/DNF and RPM packages are not part of the Raspberry Pi ecosystem.

**Alternative approaches:** Use the same APT equivalents described in the Ubuntu/Debian section above.

If you need to run yum-utils on Raspberry Pi hardware, you would need to install a Red Hat-based operating system. CentOS previously offered ARM builds, but these are no longer maintained. Consider:

1. **Use Docker on Raspberry Pi** - Run an Amazon Linux 2023 ARM container (if available for ARM64)
2. **Use the APT equivalents** - Most functionality has native APT counterparts

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- Internet connectivity to Amazon Linux repositories

This is the primary use case for yum-utils. Amazon Linux is a Red Hat-based distribution that fully supports yum-utils.

#### Installation Steps

**For Amazon Linux 2023:**

Amazon Linux 2023 uses DNF as its package manager. Install `dnf-utils`, which provides the same functionality as yum-utils:

```bash
sudo dnf install -y dnf-utils
```

**Note:** On AL2023, `yum` is an alias for `dnf`, so `yum` commands still work. However, using `dnf` is recommended for forward compatibility.

**For Amazon Linux 2:**

Amazon Linux 2 uses YUM as its package manager:

```bash
sudo yum install -y yum-utils
```

**Why the `-y` flag:** The `-y` flag automatically confirms the installation, making the command non-interactive and suitable for automation scripts and CI/CD pipelines.

#### Verification

Confirm the installation succeeded by checking for key utilities:

**For Amazon Linux 2023:**

```bash
# Check that yum-config-manager is available
yum-config-manager --help

# Check that repoquery is available
repoquery --version

# List all files installed by dnf-utils
rpm -ql dnf-utils
```

**For Amazon Linux 2:**

```bash
# Check that yum-config-manager is available
yum-config-manager --help

# Check that repoquery is available
repoquery --version

# List all files installed by yum-utils
rpm -ql yum-utils
```

Expected output for `yum-config-manager --help`:

```
usage: yum-config-manager [-h] [--save] [--setopt SETOPTS]
                          [--add-repo ADDREPO] [--dump-variables]
                          [--enable | --disable] [--version] [--installroot INSTALLROOT]
...
```

#### Troubleshooting

**Problem**: `No package yum-utils available` (on AL2023)

**Solution**: On Amazon Linux 2023, use `dnf-utils` instead:

```bash
sudo dnf install -y dnf-utils
```

The `yum-utils` package name may not be available as an alias on all AL2023 versions.

**Problem**: `Cannot find a valid baseurl for repo`

**Solution**: Check your network connectivity and ensure the Amazon Linux repositories are accessible:

```bash
# Test connectivity to Amazon Linux repos
curl -I https://cdn.amazonlinux.com/

# Update repository metadata
sudo dnf makecache   # AL2023
sudo yum makecache   # AL2
```

**Problem**: `yum-config-manager: command not found` after installation

**Solution**: The package may have installed but the shell does not see the new commands. Verify installation and refresh your PATH:

```bash
# Verify package is installed
rpm -q yum-utils dnf-utils

# The commands are in /usr/bin which should be in PATH
which yum-config-manager

# If not found, check the package file list
rpm -ql yum-utils 2>/dev/null || rpm -ql dnf-utils
```

**Problem**: Permissions error when running yum-utils commands

**Solution**: Most yum-utils commands that modify system configuration require root privileges:

```bash
# Use sudo for commands that modify the system
sudo yum-config-manager --add-repo https://example.com/repo

# Some read-only commands work without sudo
repoquery --list httpd
```

---

### RHEL / CentOS (DNF/YUM)

#### Prerequisites

- RHEL 7/8/9, CentOS 7, CentOS Stream 8/9, Rocky Linux, or AlmaLinux
- sudo privileges
- Internet connectivity to package repositories (or configured local repositories)

#### Installation Steps

**For RHEL 8+, CentOS Stream 8+, Rocky Linux, AlmaLinux:**

```bash
sudo dnf install -y yum-utils
```

Note: On these systems, `yum-utils` is a compatibility package that pulls in `dnf-utils`. Either package name works.

**For RHEL 7 / CentOS 7:**

```bash
sudo yum install -y yum-utils
```

#### Verification

```bash
# Check yum-config-manager
yum-config-manager --help

# Check repoquery
repoquery --version

# Check package-cleanup
package-cleanup --help

# List installed package contents
rpm -ql yum-utils 2>/dev/null || rpm -ql dnf-utils
```

#### Troubleshooting

**Problem**: On RHEL 8/9, `yum-utils` shows as deprecated

**Solution**: This is expected. The functionality has been integrated into DNF and dnf-utils. The commands still work:

```bash
# These commands work the same way
yum-config-manager --enable some-repo
dnf config-manager --enable some-repo  # DNF equivalent
```

**Problem**: `repoquery` gives different output on RHEL 8+ vs RHEL 7

**Solution**: On RHEL 8+, `repoquery` is actually `dnf repoquery` which has slightly different options. Check the help:

```bash
repoquery --help
# or
dnf repoquery --help
```

---

### Windows (Chocolatey/winget)

#### Not Supported

yum-utils is not available for Windows. It is a Linux-specific tool for managing RPM packages and YUM/DNF repositories.

**Why it is not supported:** Windows uses completely different package management systems (Chocolatey, winget, or MSI installers). There is no concept of RPM packages or YUM repositories on Windows.

**Alternative approaches:**

1. **Use WSL (Windows Subsystem for Linux)** - Install Amazon Linux 2 or a RHEL-compatible distribution in WSL, then install yum-utils there

2. **Use Docker Desktop for Windows** - Run an Amazon Linux container:

```powershell
# Run Amazon Linux 2023 container
docker run -it --rm amazonlinux:2023 /bin/bash

# Inside the container
dnf install -y dnf-utils
```

3. **Use a virtual machine** - Install Amazon Linux or CentOS in VirtualBox, VMware, or Hyper-V

---

### WSL (Windows Subsystem for Linux)

#### Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- WSL 2 enabled
- A Red Hat-based distribution installed in WSL (not Ubuntu)

**Important:** The default WSL distribution is Ubuntu, which does not support yum-utils. You need to install a Red Hat-based distribution.

#### Installation Steps

WSL does not officially support Amazon Linux or RHEL. However, you can import a Red Hat-based distribution or use Docker within WSL.

**Option 1: Use Docker within WSL Ubuntu**

This is the recommended approach. Install Docker in WSL Ubuntu and run an Amazon Linux container:

```bash
# First, ensure Docker is installed in WSL
# Then run Amazon Linux container
docker run -it --rm amazonlinux:2023 /bin/bash

# Inside the container, install dnf-utils
dnf install -y dnf-utils
```

**Option 2: Import an OracleLinux or similar distro**

OracleLinux (which is RHEL-compatible) can be imported into WSL:

```powershell
# In PowerShell, download and import OracleLinux
# (Check Oracle's documentation for current WSL images)
wsl --import OracleLinux C:\WSL\OracleLinux .\OracleLinux.tar
```

After importing a RHEL-compatible distro, install yum-utils:

```bash
# For Oracle Linux 8+ / RHEL 8+
sudo dnf install -y yum-utils

# For Oracle Linux 7 / CentOS 7
sudo yum install -y yum-utils
```

#### Verification

```bash
# Verify installation
yum-config-manager --help
repoquery --version
```

#### Troubleshooting

**Problem**: Running yum-utils commands in WSL Ubuntu gives "command not found"

**Solution**: WSL Ubuntu is Debian-based and does not support yum-utils. Use Docker or import a RHEL-based distribution as described above.

---

### Git Bash (Manual/Portable)

#### Not Supported

yum-utils is not available for Git Bash. Git Bash is a terminal emulator for Windows that provides a Unix-like command-line experience, but it does not include Linux package management systems.

**Why it is not supported:** Git Bash runs on Windows and does not have access to YUM, DNF, or RPM infrastructure. The yum-utils package requires a full Linux environment with RPM database support.

**Alternative approaches:**

1. **Use Docker from Git Bash** - If Docker Desktop is installed:

```bash
# From Git Bash, run Amazon Linux container
docker run -it --rm amazonlinux:2023 /bin/bash

# Inside the container
dnf install -y dnf-utils
```

2. **SSH to a Linux server** - Connect to an Amazon Linux or RHEL server:

```bash
# From Git Bash
ssh user@your-amazon-linux-server

# On the remote server
sudo dnf install -y dnf-utils
```

---

## Post-Installation Configuration

### Adding Third-Party Repositories

One of the most common uses of yum-utils is adding third-party repositories. Here is how to add a repository using `yum-config-manager`:

```bash
# Add a repository from a URL
sudo yum-config-manager --add-repo https://example.com/repo/example.repo

# Example: Add the Docker CE repository on Amazon Linux 2
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Example: Add the HashiCorp repository for Terraform
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/AmazonLinux/hashicorp.repo
```

### Enabling and Disabling Repositories

```bash
# List all repositories
yum repolist all

# Enable a disabled repository
sudo yum-config-manager --enable epel

# Disable a repository
sudo yum-config-manager --disable epel-testing

# Enable a repository for a single transaction
sudo dnf install --enablerepo=epel-testing some-package -y
```

### Downloading Packages Without Installing

Use `yumdownloader` to download RPM packages for offline installation or inspection:

```bash
# Download a package to the current directory
yumdownloader httpd

# Download a package and its dependencies
yumdownloader --resolve httpd

# Download to a specific directory
yumdownloader --destdir=/tmp/packages httpd

# Download source RPMs
yumdownloader --source httpd
```

### Querying Repository Information

Use `repoquery` to get detailed package information:

```bash
# List all packages in a repository
repoquery --repoid=amzn2-core '*'

# Show package dependencies
repoquery --requires httpd

# Show what packages depend on a package
repoquery --whatrequires openssl

# List files in a package (not installed)
repoquery --list httpd

# Show package information
repoquery --info httpd
```

### Cleaning Up Old Packages

Use `package-cleanup` to maintain system cleanliness:

```bash
# Remove orphaned packages (packages not in any repository)
sudo package-cleanup --orphans

# Remove old kernels (keep only the 2 most recent)
sudo package-cleanup --oldkernels --count=2

# Find duplicate packages
package-cleanup --dupes

# Find packages with dependency problems
package-cleanup --problems
```

---

## Common Issues

### Issue: Commands Work Differently on DNF vs YUM Systems

**Symptoms:** Same command gives different output or options on RHEL 7 vs RHEL 8+.

**Solution:** On RHEL 8+ / Amazon Linux 2023, yum-utils commands are actually DNF commands. Check documentation for any differences:

```bash
# On RHEL 8+ / AL2023, these are equivalent:
yum-config-manager --help
dnf config-manager --help

# repoquery on RHEL 8+ is actually:
dnf repoquery --help
```

### Issue: "yum-config-manager: command not found" After System Update

**Symptoms:** After a system update, yum-config-manager stops working.

**Solution:** The package may have been removed during updates. Reinstall:

```bash
# Amazon Linux 2023 / RHEL 8+
sudo dnf install -y dnf-utils

# Amazon Linux 2 / RHEL 7
sudo yum install -y yum-utils
```

### Issue: Repository URL Returns 404

**Symptoms:** `yum-config-manager --add-repo` succeeds but packages cannot be found.

**Solution:** Verify the repository URL is correct and accessible:

```bash
# Test the repository URL
curl -I https://example.com/repo/repodata/repomd.xml

# If 404, the URL may be incorrect or the repo may have moved
# Remove the bad repo file
sudo rm /etc/yum.repos.d/example.repo
```

### Issue: GPG Key Errors When Installing from Third-Party Repo

**Symptoms:** "GPG key retrieval failed" or "Public key not installed"

**Solution:** Import the GPG key or disable GPG checking (not recommended for production):

```bash
# Import the repository GPG key
sudo rpm --import https://example.com/repo/RPM-GPG-KEY-example

# Or temporarily disable GPG check (use with caution)
sudo dnf install --nogpgcheck some-package -y
```

### Issue: Slow Repository Operations

**Symptoms:** yumdownloader, repoquery, or reposync commands are very slow.

**Solution:** Update repository metadata cache:

```bash
# Refresh metadata cache
sudo dnf makecache   # AL2023 / RHEL 8+
sudo yum makecache   # AL2 / RHEL 7

# Use fastest mirror plugin (if available)
sudo dnf install -y dnf-plugins-core
```

---

## References

- [yum-utils Linux Manual Page](https://man7.org/linux/man-pages/man1/yum-utils.1.html)
- [GitHub - yum-utils (Deprecated)](https://github.com/rpm-software-management/yum-utils)
- [Amazon Linux 2023 Package Management](https://docs.aws.amazon.com/linux/al2023/ug/package-management.html)
- [Amazon Linux 2 Package Management](https://docs.aws.amazon.com/linux/al2/ug/find-install-software.html)
- [Red Hat - Managing Software with DNF](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/9/html-single/managing_software_with_the_dnf_tool/index)
- [DNF vs YUM Comparison](https://phoenixnap.com/kb/dnf-vs-yum)
- [Fedora - Yum to DNF Cheatsheet](https://fedoraproject.org/wiki/Yum_to_DNF_Cheatsheet)
- [TecMint - yum-utils Guide](https://www.tecmint.com/linux-yum-package-management-with-yum-utils/)
- [pkgs.org - dnf-utils Package](https://pkgs.org/download/dnf-utils)
