# Installing CA Certificates

## Overview

CA certificates (Certificate Authority certificates) are digital certificates that establish a chain of trust for SSL/TLS connections. They are used by web browsers, command-line tools like cURL and wget, programming languages, and other applications to verify that secure connections to remote servers are legitimate and not being intercepted by malicious actors.

When you connect to a website using HTTPS, your system checks the server's SSL certificate against its collection of trusted CA certificates. If the server's certificate was issued by a trusted CA (or a chain leading back to one), the connection is considered secure.

CA certificates are essential for:
- Secure web browsing (HTTPS)
- Package manager operations (downloading from secure repositories)
- API calls from applications
- Git operations over HTTPS
- Email encryption (TLS)
- VPN connections

## Dependencies

### macOS (Homebrew)
- **Required:** Homebrew - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None (macOS uses the system Keychain for CA certificates; Homebrew package provides Mozilla CA bundle for command-line tools)

### Ubuntu (APT/Snap)
- **Required:** None (APT is built into Ubuntu/Debian)
- **Optional:** None
- **Auto-installed:** OpenSSL (installed automatically by APT as a dependency)

### Raspberry Pi OS (APT/Snap)
- **Required:** None (APT is built into Raspberry Pi OS)
- **Optional:** None
- **Auto-installed:** OpenSSL (installed automatically by APT as a dependency)

### Amazon Linux (DNF/YUM)
- **Required:** None (DNF/YUM is built into Amazon Linux)
- **Optional:** None
- **Auto-installed:** p11-kit-trust, OpenSSL (installed automatically by DNF/YUM as dependencies)

### Windows (Chocolatey/winget)
- **Required:** None (Windows manages CA certificates through the Windows Certificate Store, which is built into the operating system)
- **Optional:** None
- **Auto-installed:** None (Windows Update automatically maintains root CA certificates)

### Git Bash (Manual/Portable)
- **Required:** Git for Windows - Download from https://git-scm.com/download/win or install via `choco install git -y`
- **Optional:** None
- **Auto-installed:** None (Git for Windows includes its own CA certificate bundle for Git and cURL operations)

## Prerequisites

Before managing CA certificates on any platform, ensure:

1. **Internet connectivity** - Required to download packages and certificate updates
2. **Administrative privileges** - Required on all platforms for system-wide certificate store modifications
3. **Understanding of security implications** - Adding untrusted CA certificates can compromise system security

**Important Security Note**: Only add CA certificates from sources you explicitly trust. Adding a malicious CA certificate to your system's trust store allows attackers to intercept all your encrypted traffic (man-in-the-middle attacks).

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.15 (Catalina) or later (macOS 14 Sonoma+ recommended)
- Homebrew package manager installed
- Terminal access

macOS maintains CA certificates in two locations:
1. **System Keychain** - Used by Safari, native macOS applications, and system services
2. **Homebrew ca-certificates** - Used by Homebrew-installed tools like cURL, OpenSSL, and Python

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install the Mozilla CA certificate bundle via Homebrew:

```bash
brew install --quiet ca-certificates
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts.

After installation, Homebrew-installed tools automatically use this certificate bundle. The certificate bundle is sourced from Mozilla (via https://curl.se/docs/caextract.html) and is regularly updated.

#### Verification

Confirm the installation succeeded:

```bash
brew list ca-certificates
```

Expected output (file list showing certificate locations):

```
/opt/homebrew/Cellar/ca-certificates/2024-11-26/share/ca-certificates/cacert.pem
```

Verify SSL connections work with the updated certificates:

```bash
curl -s -o /dev/null -w "%{http_code}" https://www.google.com
```

Expected output: `200`

Check the certificate file location:

```bash
brew --prefix ca-certificates
```

Expected output: `/opt/homebrew/opt/ca-certificates` (Apple Silicon) or `/usr/local/opt/ca-certificates` (Intel).

#### Troubleshooting

**Problem**: SSL errors persist after installing ca-certificates

**Solution**: Run the post-install script to regenerate certificate symlinks:

```bash
brew postinstall ca-certificates
```

**Problem**: Homebrew tools still report certificate errors in corporate environments with SSL inspection

**Solution**: Your organization uses a proxy that intercepts SSL traffic. You need to add your organization's CA certificate to the Homebrew trust store:

```bash
# Export your organization's CA certificate from Keychain Access as a .pem file
# Then add it to Homebrew's certificate bundle
cat /path/to/corporate-ca.pem >> "$(brew --prefix)/etc/ca-certificates/cert.pem"
brew postinstall ca-certificates
```

**Problem**: System tools (Safari, Mail) show certificate errors

**Solution**: System applications use the macOS Keychain, not Homebrew's ca-certificates. Use Keychain Access to manage system-wide certificates, or install certificates via command line:

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /path/to/certificate.crt
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 18.04 LTS or later, or Debian 10 (Buster) or later
- sudo privileges
- Internet connectivity

The `ca-certificates` package is typically pre-installed on Ubuntu and Debian systems. The steps below ensure it is installed and up to date.

#### Installation Steps

Run the following commands to update package lists and install/update the CA certificates package:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

After installing or updating the package, regenerate the certificate bundle:

```bash
sudo update-ca-certificates
```

This command:
1. Reads certificate configuration from `/etc/ca-certificates.conf`
2. Processes certificates from `/usr/share/ca-certificates/` and `/usr/local/share/ca-certificates/`
3. Generates the unified bundle at `/etc/ssl/certs/ca-certificates.crt`
4. Creates individual certificate symlinks in `/etc/ssl/certs/`

#### Verification

Confirm the package is installed:

```bash
dpkg -l | grep ca-certificates
```

Expected output (version numbers may vary):

```
ii  ca-certificates                    20230311ubuntu0.22.04.1           all          Common CA certificates
```

Verify the certificate bundle exists:

```bash
ls -la /etc/ssl/certs/ca-certificates.crt
```

Test SSL connectivity:

```bash
curl -s -o /dev/null -w "%{http_code}" https://www.google.com
```

Expected output: `200`

#### Troubleshooting

**Problem**: `E: Unable to locate package ca-certificates`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: SSL errors after fresh install with message about `/etc/ssl/certs/ca-certificates.crt`

**Solution**: The certificate bundle may not have been generated. Run:

```bash
sudo update-ca-certificates --fresh
```

The `--fresh` flag removes existing symlinks and regenerates everything from scratch.

**Problem**: Custom/corporate CA certificate not being recognized

**Solution**: Ensure the certificate:
1. Has a `.crt` extension (required)
2. Is in PEM format (text format starting with `-----BEGIN CERTIFICATE-----`)
3. Is placed in `/usr/local/share/ca-certificates/`

Then run:

```bash
sudo update-ca-certificates
```

**Problem**: Need to convert DER format certificate to PEM

**Solution**: Use OpenSSL to convert:

```bash
sudo openssl x509 -inform der -outform pem -in certificate.der -out /usr/local/share/ca-certificates/certificate.crt
sudo update-ca-certificates
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (32-bit or 64-bit)
- Raspberry Pi 2 or later (Raspberry Pi 3B+ or later recommended for 64-bit)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so CA certificates management follows the same process as Ubuntu/Debian. The `ca-certificates` package is typically pre-installed.

#### Installation Steps

Run the following commands to update package lists and install/update the CA certificates package:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

After installing or updating the package, regenerate the certificate bundle:

```bash
sudo update-ca-certificates
```

**ARM Architecture Note**: The ca-certificates package is architecture-independent (it contains only certificate data files, no compiled binaries), so there is no difference between ARM and x86 installations.

#### Verification

Confirm the package is installed:

```bash
dpkg -l | grep ca-certificates
```

Expected output (version numbers may vary):

```
ii  ca-certificates                    20230311                           all          Common CA certificates
```

Verify the certificate bundle exists and check its size:

```bash
ls -la /etc/ssl/certs/ca-certificates.crt
```

Expected output shows a file of approximately 200-250KB containing all trusted CA certificates.

Test SSL connectivity:

```bash
curl -s -o /dev/null -w "%{http_code}" https://www.google.com
```

Expected output: `200`

#### Troubleshooting

**Problem**: `apt-get update` fails with 404 errors

**Solution**: Package mirrors may be outdated. Use the `--fix-missing` flag:

```bash
sudo apt-get update --fix-missing && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates
```

**Problem**: `server certificate verification failed` errors

**Solution**: The CA certificate bundle may be outdated or corrupted. Reinstall and regenerate:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --reinstall ca-certificates
sudo update-ca-certificates --fresh
```

**Problem**: Slow download speeds during installation

**Solution**: Raspberry Pi may have limited bandwidth, especially over WiFi. Use a wired Ethernet connection if available, or wait for the installation to complete.

**Problem**: Disk space errors during installation

**Solution**: Check available space and clean up:

```bash
df -h
sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y
sudo DEBIAN_FRONTEND=noninteractive apt-get clean
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- Internet connectivity

The `ca-certificates` package is pre-installed on all Amazon Linux versions. Amazon Linux 2023 uses `dnf` as the package manager, while Amazon Linux 2 uses `yum`.

**Note**: Unlike Debian-based systems that use `update-ca-certificates`, Red Hat-based systems (including Amazon Linux) use `update-ca-trust` to manage the certificate trust store.

#### Installation Steps

**For Amazon Linux 2023:**

Run the following command to ensure ca-certificates is installed and up to date:

```bash
sudo dnf install -y ca-certificates && sudo update-ca-trust
```

**For Amazon Linux 2:**

Run the following command to ensure ca-certificates is installed and up to date:

```bash
sudo yum install -y ca-certificates && sudo update-ca-trust
```

The `-y` flag automatically confirms installation prompts, enabling non-interactive execution.

The `update-ca-trust` command:
1. Reads certificates from `/etc/pki/ca-trust/source/anchors/` and `/usr/share/pki/ca-trust-source/`
2. Generates the unified bundle at `/etc/pki/tls/certs/ca-bundle.crt`
3. Updates OpenSSL-compatible certificate directory at `/etc/pki/tls/certs/`

#### Verification

Confirm the package is installed:

```bash
rpm -q ca-certificates
```

Expected output (version numbers may vary):

```
ca-certificates-2023.2.60_v7.0.306-1.0.amzn2023.0.1.noarch
```

Verify the certificate bundle exists:

```bash
ls -la /etc/pki/tls/certs/ca-bundle.crt
```

Test SSL connectivity:

```bash
curl -s -o /dev/null -w "%{http_code}" https://www.google.com
```

Expected output: `200`

#### Troubleshooting

**Problem**: Custom CA certificate not being recognized

**Solution**: Ensure the certificate is placed in the correct location and update the trust store:

```bash
sudo cp /path/to/custom-ca.crt /etc/pki/ca-trust/source/anchors/
sudo update-ca-trust
```

**Problem**: `update-ca-trust: command not found`

**Solution**: The `p11-kit-trust` package may be missing. Install it:

```bash
# Amazon Linux 2023
sudo dnf install -y p11-kit-trust

# Amazon Linux 2
sudo yum install -y p11-kit-trust
```

**Problem**: SSL errors with Let's Encrypt certificates

**Solution**: Older Amazon Linux instances may have outdated CA certificates that don't include newer Let's Encrypt root certificates. Update the package:

```bash
# Amazon Linux 2023
sudo dnf update -y ca-certificates

# Amazon Linux 2
sudo yum update -y ca-certificates
```

**Problem**: `dnf: command not found` on Amazon Linux 2

**Solution**: Amazon Linux 2 uses `yum` instead of `dnf`. Use `yum` for all package operations:

```bash
sudo yum install -y ca-certificates
```

---

### Windows (Chocolatey/winget)

#### Prerequisites

- Windows 10 or Windows 11
- Administrator PowerShell or Command Prompt
- Internet connectivity

**Important**: Windows handles CA certificates differently from Linux and macOS. There is no "ca-certificates" package to install. Instead, Windows maintains a Certificate Trust List (CTL) that is automatically updated through Windows Update.

Windows stores certificates in the Windows Certificate Store, accessible via:
- Certificate Manager (`certmgr.msc`) for current user certificates
- Certificate Manager (`certlm.msc`) for local machine certificates
- `certutil` command-line tool
- PowerShell certificate provider

#### Installation Steps

Windows automatically updates root CA certificates through Windows Update. To manually trigger an update or verify the certificate store is current, run the following commands in an Administrator PowerShell:

```powershell
# Download the latest root certificate list from Microsoft
certutil -generateSSTFromWU C:\Windows\Temp\roots.sst

# Import the certificates to the Trusted Root store
certutil -addstore -f Root C:\Windows\Temp\roots.sst

# Clean up the temporary file
Remove-Item C:\Windows\Temp\roots.sst -Force
```

This downloads the current Certificate Trust List from Microsoft's Windows Update servers and imports all root certificates into the local machine's Trusted Root Certification Authorities store.

**Note**: These commands must be run in an Administrator PowerShell window. Right-click PowerShell and select "Run as administrator".

#### Verification

Verify the root certificate store contains certificates:

```powershell
# Count certificates in the Trusted Root store
(Get-ChildItem Cert:\LocalMachine\Root).Count
```

Expected output: A number greater than 100 (typically 150-300 certificates).

Check the last sync time for automatic certificate updates:

```powershell
certutil -verifyctl AuthRoot | Select-String "LastSyncTime"
```

Test SSL connectivity (use `curl.exe` to avoid PowerShell alias):

```powershell
curl.exe -s -o NUL -w "%{http_code}" https://www.google.com
```

Expected output: `200`

List certificates expiring within 60 days:

```powershell
Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.NotAfter -lt (Get-Date).AddDays(60) } | Select-Object Subject, NotAfter
```

#### Troubleshooting

**Problem**: Certificate updates fail with "Unable to connect to Windows Update"

**Solution**: The server may not have internet access or Windows Update is blocked. Download the certificates from a machine with access and import manually:

```powershell
# On a machine with internet access:
certutil -generateSSTFromWU roots.sst

# Copy roots.sst to the target machine, then:
certutil -addstore -f Root C:\path\to\roots.sst
```

**Problem**: Automatic root certificate updates are disabled

**Solution**: Check the registry setting and enable automatic updates:

```powershell
# Check if auto-update is disabled
Get-ItemProperty -Path 'HKLM:\Software\Policies\Microsoft\SystemCertificates\AuthRoot' -Name DisableRootAutoUpdate -ErrorAction SilentlyContinue

# If DisableRootAutoUpdate is 1, remove it to enable auto-updates
Remove-ItemProperty -Path 'HKLM:\Software\Policies\Microsoft\SystemCertificates\AuthRoot' -Name DisableRootAutoUpdate -ErrorAction SilentlyContinue
```

**Problem**: Application still reports certificate errors after update

**Solution**: Some applications (Firefox, Java) maintain their own certificate stores. You need to add certificates to those application-specific stores separately.

**Problem**: Need to add a custom/corporate CA certificate

**Solution**: Import the certificate to the Trusted Root store:

```powershell
certutil -addstore -f Root C:\path\to\corporate-ca.crt
```

Or using PowerShell:

```powershell
Import-Certificate -FilePath C:\path\to\corporate-ca.crt -CertStoreLocation Cert:\LocalMachine\Root
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004+ or Windows 11
- Windows Subsystem for Linux (WSL) with Ubuntu installed
- WSL 2 recommended for best performance
- sudo privileges within WSL

WSL Ubuntu installations follow the same process as native Ubuntu, using APT. The certificate store is separate from the Windows host.

#### Installation Steps

Open your WSL Ubuntu terminal and run:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates && sudo update-ca-certificates
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

#### Verification

Confirm the package is installed:

```bash
dpkg -l | grep ca-certificates
```

Expected output (version numbers may vary):

```
ii  ca-certificates                    20230311ubuntu0.22.04.1           all          Common CA certificates
```

Verify the certificate bundle exists:

```bash
ls -la /etc/ssl/certs/ca-certificates.crt
```

Test SSL connectivity:

```bash
curl -s -o /dev/null -w "%{http_code}" https://www.google.com
```

Expected output: `200`

#### Troubleshooting

**Problem**: `E: Unable to locate package ca-certificates`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: SSL errors in WSL but not in Windows

**Solution**: WSL has its own certificate store separate from Windows. Certificates added to Windows Certificate Store are not automatically available in WSL. Add certificates to the WSL store:

```bash
sudo cp /path/to/certificate.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

**Problem**: WSL cannot resolve DNS or reach package repositories

**Solution**: WSL may have DNS resolution issues. Try restarting WSL:

```powershell
# From Windows PowerShell (not WSL)
wsl --shutdown
wsl
```

If DNS issues persist, manually configure DNS in WSL:

```bash
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null
```

**Problem**: Corporate proxy SSL interception causes certificate errors

**Solution**: Export your corporate CA certificate from Windows and add it to WSL:

```powershell
# From Windows PowerShell - export certificate to file
certutil -store -user Root "Corporate CA Name" C:\temp\corporate-ca.cer
```

```bash
# From WSL - convert and install
openssl x509 -inform der -in /mnt/c/temp/corporate-ca.cer -out /tmp/corporate-ca.crt
sudo cp /tmp/corporate-ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

---

### Git Bash (Windows)

#### Prerequisites

- Windows 10 or Windows 11
- Git for Windows installed (includes Git Bash)

Git for Windows includes its own CA certificate bundle that is used by Git and the bundled cURL. This bundle is separate from both the Windows Certificate Store and any WSL certificate stores.

#### Installation Steps

Git for Windows automatically includes and manages its CA certificate bundle. No separate installation is required.

To update Git for Windows (and its certificate bundle) via Chocolatey:

```powershell
choco upgrade git -y
```

The CA certificate bundle is located at:
- `C:\Program Files\Git\mingw64\etc\ssl\certs\ca-bundle.crt` (Git commands)
- `C:\Program Files\Git\mingw64\ssl\certs\ca-bundle.crt` (cURL/OpenSSL)

To manually update just the CA bundle without upgrading Git, download the latest bundle from Mozilla:

```bash
# Run in Git Bash
curl -o /mingw64/etc/ssl/certs/ca-bundle.crt https://curl.se/ca/cacert.pem
```

**Note**: The above command requires running Git Bash as Administrator if Git is installed in Program Files.

#### Verification

Open Git Bash and verify the certificate bundle exists:

```bash
ls -la /mingw64/etc/ssl/certs/ca-bundle.crt
```

Expected output: A file of approximately 200-250KB.

Test SSL connectivity:

```bash
curl -s -o /dev/null -w "%{http_code}" https://www.google.com
```

Expected output: `200`

Test Git can connect to HTTPS remotes:

```bash
git ls-remote https://github.com/git/git.git HEAD
```

Expected output: SHA hash followed by `HEAD`.

#### Troubleshooting

**Problem**: `SSL certificate problem: unable to get local issuer certificate`

**Solution**: The CA bundle may be outdated or missing. Update it:

```bash
# Download latest CA bundle
curl -o /tmp/cacert.pem https://curl.se/ca/cacert.pem

# Copy to Git's SSL directory (run Git Bash as Administrator)
cp /tmp/cacert.pem /mingw64/etc/ssl/certs/ca-bundle.crt
```

**Problem**: Corporate proxy SSL interception causes Git errors

**Solution**: Add your corporate CA certificate to Git's bundle:

```bash
# Append corporate CA to the bundle (run as Administrator)
cat /path/to/corporate-ca.pem >> /mingw64/etc/ssl/certs/ca-bundle.crt
```

Or configure Git to use a custom CA bundle:

```bash
git config --global http.sslCAInfo /path/to/custom-ca-bundle.crt
```

**Problem**: Want Git Bash to use Windows Certificate Store instead of its own bundle

**Solution**: Configure Git to use the Windows SChannel backend:

```bash
git config --global http.sslBackend schannel
```

This tells Git to use the Windows Certificate Store, which is automatically updated through Windows Update.

**Problem**: cURL in Git Bash has SSL errors but Git works fine

**Solution**: Git and cURL may use different SSL configurations. Ensure cURL uses the correct CA bundle:

```bash
export CURL_CA_BUNDLE=/mingw64/etc/ssl/certs/ca-bundle.crt
```

Add this to your `~/.bashrc` for persistence:

```bash
echo 'export CURL_CA_BUNDLE=/mingw64/etc/ssl/certs/ca-bundle.crt' >> ~/.bashrc
```

---

## Post-Installation Configuration

### Adding Custom CA Certificates

Organizations often need to add custom CA certificates for internal services, corporate proxies, or development environments.

**Linux (Ubuntu/Debian/Raspberry Pi OS):**

```bash
# Copy certificate (must have .crt extension and be in PEM format)
sudo cp /path/to/custom-ca.crt /usr/local/share/ca-certificates/

# Update the trust store
sudo update-ca-certificates
```

**Linux (Amazon Linux/RHEL):**

```bash
# Copy certificate to anchors directory
sudo cp /path/to/custom-ca.crt /etc/pki/ca-trust/source/anchors/

# Update the trust store
sudo update-ca-trust
```

**macOS:**

```bash
# Add to system keychain (requires admin password)
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /path/to/custom-ca.crt

# For Homebrew tools, also add to the Homebrew bundle
cat /path/to/custom-ca.crt >> "$(brew --prefix)/etc/ca-certificates/cert.pem"
brew postinstall ca-certificates
```

**Windows:**

```powershell
# Import to Trusted Root store (run as Administrator)
Import-Certificate -FilePath C:\path\to\custom-ca.crt -CertStoreLocation Cert:\LocalMachine\Root
```

### Verifying SSL Connections

Test that SSL connections work correctly after modifying certificates:

```bash
# Linux/macOS/Git Bash
curl -v https://your-internal-server.example.com 2>&1 | grep "SSL certificate verify ok"

# Windows PowerShell
curl.exe -v https://your-internal-server.example.com 2>&1 | Select-String "SSL certificate verify ok"
```

---

## Common Issues

### Issue: SSL Certificate Errors After System Update

**Symptoms**: Applications that previously worked start showing certificate errors.

**Solution**: The certificate bundle may have been overwritten during update. Regenerate it:

```bash
# Ubuntu/Debian/Raspberry Pi OS
sudo update-ca-certificates --fresh

# Amazon Linux/RHEL
sudo update-ca-trust

# macOS
brew postinstall ca-certificates
```

### Issue: Application-Specific Certificate Stores

**Symptoms**: System tools work but specific applications (Firefox, Java, Node.js) show certificate errors.

**Solution**: Some applications maintain their own certificate stores:

- **Firefox/Thunderbird**: Use `certutil` from NSS tools or the browser's certificate manager
- **Java**: Use `keytool` to add certificates to the Java truststore
- **Node.js**: Set `NODE_EXTRA_CA_CERTS` environment variable
- **Python**: May need `REQUESTS_CA_BUNDLE` or `SSL_CERT_FILE` environment variables

### Issue: Certificate Chain Incomplete

**Symptoms**: SSL errors mentioning "unable to get local issuer certificate" or "certificate chain incomplete".

**Solution**: Ensure intermediate certificates are included. Request the full certificate chain from the server administrator, or fetch it:

```bash
# Download certificate chain from a server
openssl s_client -connect server.example.com:443 -showcerts </dev/null 2>/dev/null | openssl x509 -outform PEM > chain.pem
```

### Issue: Expired Certificates in Trust Store

**Symptoms**: Warnings about expired certificates or connections failing to older servers.

**Solution**: Update the CA certificate package to get the latest trust list:

```bash
# Ubuntu/Debian/Raspberry Pi OS
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y ca-certificates

# Amazon Linux 2023
sudo dnf update -y ca-certificates

# Amazon Linux 2
sudo yum update -y ca-certificates

# macOS
brew upgrade ca-certificates

# Windows (run as Administrator)
certutil -generateSSTFromWU C:\Windows\Temp\roots.sst
certutil -addstore -f Root C:\Windows\Temp\roots.sst
```

### Issue: Self-Signed Certificates Not Trusted

**Symptoms**: Development servers with self-signed certificates show SSL errors.

**Solution**: Add the self-signed certificate to the trust store following the platform-specific instructions in Post-Installation Configuration above. For development only, you can also disable certificate verification (NOT recommended for production):

```bash
# cURL (temporary, for testing only)
curl -k https://dev-server.local

# Git (temporary, for testing only)
GIT_SSL_NO_VERIFY=1 git clone https://dev-server.local/repo.git
```

---

## References

- [Mozilla CA Certificate Store](https://wiki.mozilla.org/CA) - Source for most CA certificate bundles
- [cURL CA Bundle](https://curl.se/docs/caextract.html) - Mozilla certificates extracted for cURL
- [Ubuntu CA Certificates Documentation](https://ubuntu.com/server/docs/install-a-root-ca-certificate-in-the-trust-store) - Official Ubuntu guide
- [Debian ca-certificates Package](https://packages.debian.org/sid/ca-certificates) - Debian package details
- [Red Hat Certificate Management](https://www.redhat.com/en/blog/ca-certificates-cli) - Red Hat/CentOS/Amazon Linux guide
- [Homebrew ca-certificates Formula](https://formulae.brew.sh/formula/ca-certificates) - Homebrew package information
- [Microsoft Certutil Documentation](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/certutil) - Windows certificate utility
- [Microsoft Certificate Trust Configuration](https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/configure-trusted-roots-disallowed-certificates) - Windows trust store management
- [Git SSL Configuration](https://git-scm.com/book/en/v2/Git-Internals-Environment-Variables#_networking) - Git SSL/TLS settings
- [OpenSSL Certificate Operations](https://www.openssl.org/docs/man1.1.1/man1/x509.html) - OpenSSL certificate commands
