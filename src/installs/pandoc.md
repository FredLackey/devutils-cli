# Installing Pandoc

## Overview

Pandoc is a universal document converter that can convert files between a wide variety of markup formats. Often called the "Swiss Army knife" of document conversion, Pandoc supports input formats including Markdown, reStructuredText, HTML, LaTeX, DOCX, EPUB, and many others, with equally diverse output options including PDF, HTML, DOCX, ODT, and presentation formats.

Pandoc is essential for developers, technical writers, and anyone who works with documentation. Common use cases include:

- Converting Markdown documentation to PDF or HTML
- Generating DOCX files from Markdown for non-technical collaborators
- Creating presentations from plain text (reveal.js, Beamer, PowerPoint)
- Publishing EPUB books from Markdown sources
- Converting between wiki formats
- Automating documentation pipelines in CI/CD systems

Pandoc is written in Haskell and distributed as a statically linked binary, meaning it has no runtime dependencies on external libraries.

## Prerequisites

Before installing Pandoc on any platform, ensure:

1. **Internet connectivity** - Required to download packages
2. **Administrative privileges** - Required on most platforms for system-wide installation
3. **Package manager installed** - Each platform requires its respective package manager (Homebrew, APT, DNF/YUM, Chocolatey, etc.)

**Optional but Recommended for PDF Output**: Pandoc requires a LaTeX engine to generate PDF files. If you need PDF output, install a TeX distribution (BasicTeX, TeX Live, or MiKTeX) after installing Pandoc. Without LaTeX, Pandoc can still convert to HTML, DOCX, and most other formats.

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

Run the following command to install Pandoc via Homebrew:

```bash
brew install --quiet pandoc
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts and CI/CD pipelines.

**Note**: Homebrew will automatically install the dependency `gmp` (GNU multiple precision arithmetic library) if it is not already present.

**Optional - Install LaTeX for PDF generation**:

If you need PDF output, install BasicTeX (a minimal LaTeX distribution):

```bash
brew install --quiet --cask basictex
```

After installation, add the TeX binaries to your PATH by restarting your terminal or running:

```bash
eval "$(/usr/libexec/path_helper)"
```

#### Verification

Confirm the installation succeeded:

```bash
pandoc --version
```

Expected output (version numbers may vary):

```
pandoc 3.8.3
Features: +server +lua
Scripting engine: Lua 5.4
User data directory: /Users/<username>/.local/share/pandoc
```

Verify the installation path:

```bash
which pandoc
```

Expected output: `/opt/homebrew/bin/pandoc` (Apple Silicon) or `/usr/local/bin/pandoc` (Intel).

#### Troubleshooting

**Problem**: `pandoc: command not found` after installation

**Solution**: Homebrew may not be in your PATH. For Apple Silicon Macs, add Homebrew to your PATH:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For a permanent fix, add this to your shell configuration:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc && source ~/.zshrc
```

**Problem**: `brew install pandoc` fails with permission errors

**Solution**: Fix Homebrew directory ownership:

```bash
sudo chown -R $(whoami) $(brew --prefix)/*
```

**Problem**: PDF generation fails with "pdflatex not found"

**Solution**: Install BasicTeX and ensure it is in your PATH:

```bash
brew install --quiet --cask basictex
eval "$(/usr/libexec/path_helper)"
```

On Apple Silicon, the TeX binaries are located at `/Library/TeX/texbin`. Verify they are in your PATH:

```bash
echo $PATH | grep -q texbin && echo "TeX in PATH" || echo "TeX NOT in PATH"
```

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- Internet connectivity

Pandoc is available in the default Ubuntu and Debian repositories. However, repository versions may be older than the latest release. This guide uses the repository version for simplicity and stability.

#### Installation Steps

Run the following command to update package lists and install Pandoc:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pandoc
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

**Optional - Install LaTeX for PDF generation**:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive texlive-latex-extra texlive-fonts-recommended
```

For a minimal LaTeX installation (smaller download):

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-latex-base
```

#### Verification

Confirm the installation succeeded:

```bash
pandoc --version
```

Expected output (version numbers vary by distribution):

- Ubuntu 24.04 (Noble): `pandoc 3.1.3`
- Ubuntu 22.04 (Jammy): `pandoc 2.9.2.1`
- Debian 12 (Bookworm): `pandoc 2.17.1.1`

**Note**: Ubuntu and Debian repositories prioritize stability over bleeding-edge releases. For the latest version, see the "Installing Latest Version from GitHub" section below.

Verify the installation path:

```bash
which pandoc
```

Expected output: `/usr/bin/pandoc`

#### Installing Latest Version from GitHub

To install the latest Pandoc version directly from GitHub releases:

```bash
# Download the latest .deb package for amd64
curl -L -o /tmp/pandoc-latest.deb https://github.com/jgm/pandoc/releases/download/3.8.3/pandoc-3.8.3-1-amd64.deb

# Install the package
sudo DEBIAN_FRONTEND=noninteractive dpkg -i /tmp/pandoc-latest.deb

# Clean up
rm /tmp/pandoc-latest.deb
```

#### Troubleshooting

**Problem**: `E: Unable to locate package pandoc`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: `Permission denied` errors

**Solution**: Ensure you are using `sudo` with the installation command.

**Problem**: Older Pandoc version than expected

**Solution**: Ubuntu/Debian repositories prioritize stability. Install the latest version directly from GitHub using the commands in the "Installing Latest Version from GitHub" section above.

**Problem**: PDF generation fails with LaTeX errors

**Solution**: Install additional LaTeX packages:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-xetex texlive-luatex texlive-fonts-extra
```

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit recommended, 32-bit supported)
- Raspberry Pi 3B+ or later (64-bit capable hardware recommended)
- sudo privileges
- Internet connectivity

Raspberry Pi OS is based on Debian, so Pandoc installation follows the APT-based process. The official Pandoc GitHub releases include ARM64 binaries for 64-bit Raspberry Pi OS.

#### Installation Steps

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit (recommended)
- `armv7l` = 32-bit

**For Raspberry Pi OS (repository version)**:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pandoc
```

**For the latest version on 64-bit Raspberry Pi OS (aarch64)**:

```bash
# Download the latest ARM64 .deb package
curl -L -o /tmp/pandoc-latest.deb https://github.com/jgm/pandoc/releases/download/3.8.3/pandoc-3.8.3-1-arm64.deb

# Install the package
sudo DEBIAN_FRONTEND=noninteractive dpkg -i /tmp/pandoc-latest.deb

# Clean up
rm /tmp/pandoc-latest.deb
```

**For 32-bit Raspberry Pi OS (armv7l)**:

Official Pandoc releases do not include 32-bit ARM binaries. Use the repository version:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pandoc
```

**Optional - Install LaTeX for PDF generation**:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive texlive-latex-extra
```

**Note**: TeX Live is large (several GB). On Raspberry Pi with limited storage, consider using `texlive-latex-base` for a minimal installation.

#### Verification

Confirm the installation succeeded:

```bash
pandoc --version
```

Expected output (version numbers may vary):

```
pandoc 3.8.3
```

Or for repository version:

```
pandoc 2.17.1.1
```

Verify your architecture:

```bash
uname -m
```

Expected output: `aarch64` (64-bit) or `armv7l` (32-bit).

#### Troubleshooting

**Problem**: `E: Unable to locate package pandoc`

**Solution**: Update the package list first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Installation very slow

**Solution**: Raspberry Pi SD cards can be slow. Use a high-quality SD card (Class 10 or faster) or boot from USB/SSD for better performance.

**Problem**: Out of disk space

**Solution**: Pandoc itself is small, but LaTeX is large. Check available space and clean up:

```bash
df -h
sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y
sudo DEBIAN_FRONTEND=noninteractive apt-get clean
```

**Problem**: 32-bit Raspberry Pi needs latest Pandoc

**Solution**: For 32-bit ARM, you must either use the repository version or build from source. Building from source requires significant time and memory (swap space recommended):

```bash
# Not recommended due to build time - use repository version instead
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pandoc
```

---

### Amazon Linux (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023) or Amazon Linux 2 (AL2)
- sudo privileges
- Internet connectivity

**Important**: Pandoc is NOT available in the default Amazon Linux repositories. This section documents installing Pandoc from the official GitHub releases using the Linux tarball.

Amazon Linux 2023 uses `dnf` as the package manager, while Amazon Linux 2 uses `yum`. The installation process below works for both versions.

#### Installation Steps

Run the following commands to download and install Pandoc from the official GitHub releases:

```bash
# Download the latest Linux amd64 tarball
curl -L -o /tmp/pandoc.tar.gz https://github.com/jgm/pandoc/releases/download/3.8.3/pandoc-3.8.3-linux-amd64.tar.gz

# Extract to /usr/local
sudo tar xvzf /tmp/pandoc.tar.gz --strip-components 1 -C /usr/local

# Clean up
rm /tmp/pandoc.tar.gz
```

**For ARM-based instances (Graviton)**:

```bash
# Download the latest Linux ARM64 tarball
curl -L -o /tmp/pandoc.tar.gz https://github.com/jgm/pandoc/releases/download/3.8.3/pandoc-3.8.3-linux-arm64.tar.gz

# Extract to /usr/local
sudo tar xvzf /tmp/pandoc.tar.gz --strip-components 1 -C /usr/local

# Clean up
rm /tmp/pandoc.tar.gz
```

**Optional - Install LaTeX for PDF generation**:

**For Amazon Linux 2023**:

```bash
sudo dnf install -y texlive texlive-latex texlive-xetex
```

**For Amazon Linux 2**:

```bash
sudo yum install -y texlive texlive-latex texlive-xetex
```

#### Verification

Confirm the installation succeeded:

```bash
pandoc --version
```

Expected output:

```
pandoc 3.8.3
Features: +server +lua
Scripting engine: Lua 5.4
User data directory: /home/ec2-user/.local/share/pandoc
```

Verify the installation path:

```bash
which pandoc
```

Expected output: `/usr/local/bin/pandoc`

#### Troubleshooting

**Problem**: `pandoc: command not found` after installation

**Solution**: Ensure `/usr/local/bin` is in your PATH:

```bash
echo $PATH | grep -q '/usr/local/bin' && echo "In PATH" || echo "NOT in PATH"
```

If not in PATH, add it:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

**Problem**: Permission denied when extracting

**Solution**: Ensure you are using `sudo` with the `tar` command.

**Problem**: SSL certificate errors during download

**Solution**: Update CA certificates:

**For Amazon Linux 2023**:

```bash
sudo dnf install -y ca-certificates
```

**For Amazon Linux 2**:

```bash
sudo yum install -y ca-certificates
```

**Problem**: Need to automate Pandoc updates

**Solution**: Create a script that checks for new versions and updates automatically. The installation is idempotent - running the same commands will simply overwrite the existing installation.

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 (version 1803+) or Windows 11
- Chocolatey package manager installed
- Administrator PowerShell or Command Prompt

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt:

```powershell
choco install pandoc -y
```

The `-y` flag automatically confirms all prompts, enabling fully non-interactive installation.

**Note**: By default, Chocolatey installs Pandoc for the current user. To install for all users, use:

```powershell
choco install pandoc -y --install-arguments="ALLUSERS=1"
```

**Optional - Install MiKTeX for PDF generation**:

```powershell
choco install miktex -y
```

MiKTeX is a Windows-native LaTeX distribution that integrates well with Pandoc.

#### Verification

Open a **new** Command Prompt or PowerShell window (required for PATH to update), then run:

```powershell
pandoc --version
```

Expected output (version numbers may vary):

```
pandoc 3.8.3
Features: +server +lua
Scripting engine: Lua 5.4
User data directory: C:\Users\<username>\AppData\Roaming\pandoc
```

Verify the installation path:

```powershell
where pandoc
```

Expected output: `C:\Users\<username>\AppData\Local\Pandoc\pandoc.exe` or `C:\Program Files\Pandoc\pandoc.exe` (if installed for all users).

#### Troubleshooting

**Problem**: `pandoc` command not found after installation

**Solution**: Close all terminal windows and open a new Command Prompt or PowerShell. The PATH update requires a fresh terminal session. If the issue persists, verify Pandoc's directory is in your PATH:

```powershell
$env:PATH -split ';' | Select-String -Pattern "pandoc"
```

**Problem**: `choco` command not found

**Solution**: Chocolatey may not be in PATH. Close all terminal windows, open a new Administrator PowerShell, and try again. If the issue persists, reinstall Chocolatey.

**Problem**: Installation fails with access denied

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click and select "Run as administrator".

**Problem**: PDF generation fails

**Solution**: Install MiKTeX and ensure it completed the first-time setup:

```powershell
choco install miktex -y
```

After installation, run any MiKTeX tool (like `pdflatex --version`) to trigger the initial configuration.

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
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y pandoc
```

The `DEBIAN_FRONTEND=noninteractive` environment variable and `-y` flag ensure fully automated installation without prompts.

**For the latest Pandoc version**:

```bash
# Download the latest .deb package for amd64
curl -L -o /tmp/pandoc-latest.deb https://github.com/jgm/pandoc/releases/download/3.8.3/pandoc-3.8.3-1-amd64.deb

# Install the package
sudo DEBIAN_FRONTEND=noninteractive dpkg -i /tmp/pandoc-latest.deb

# Clean up
rm /tmp/pandoc-latest.deb
```

**Optional - Install LaTeX for PDF generation**:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive texlive-latex-extra texlive-fonts-recommended
```

#### Verification

Confirm the installation succeeded:

```bash
pandoc --version
```

Expected output (version numbers may vary):

```
pandoc 3.8.3
```

Or for repository version:

```
pandoc 2.9.2.1
```

Verify the installation path:

```bash
which pandoc
```

Expected output: `/usr/bin/pandoc`

#### Troubleshooting

**Problem**: `E: Unable to locate package pandoc`

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

**Problem**: Accessing Windows files from Pandoc in WSL

**Solution**: Windows drives are mounted under `/mnt/`. Access your Windows files at:

```bash
# Access C: drive
ls /mnt/c/Users/<username>/Documents

# Convert a file from Windows path
pandoc /mnt/c/Users/<username>/Documents/readme.md -o /mnt/c/Users/<username>/Documents/readme.pdf
```

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or Windows 11
- Git for Windows installed (includes Git Bash)
- Internet connectivity

Git Bash does not include a package manager. Pandoc must be installed on Windows first (via Chocolatey, winget, or the MSI installer), and it will then be available in Git Bash through the Windows PATH.

#### Installation Steps

**Step 1: Install Pandoc on Windows**

The recommended approach is to install Pandoc using Chocolatey from an Administrator PowerShell:

```powershell
choco install pandoc -y
```

Alternatively, download and run the MSI installer silently from PowerShell:

```powershell
# Download the MSI installer
Invoke-WebRequest -Uri "https://github.com/jgm/pandoc/releases/download/3.8.3/pandoc-3.8.3-windows-x86_64.msi" -OutFile "$env:TEMP\pandoc-installer.msi"

# Install silently
Start-Process msiexec.exe -ArgumentList "/i", "$env:TEMP\pandoc-installer.msi", "/quiet", "/norestart" -Wait

# Clean up
Remove-Item "$env:TEMP\pandoc-installer.msi"
```

**Step 2: Verify in Git Bash**

Open Git Bash (close and reopen if already open) and verify Pandoc is accessible:

```bash
pandoc --version
```

Git Bash inherits the Windows PATH, so Pandoc installed on Windows is automatically available.

#### Verification

In Git Bash, confirm the installation succeeded:

```bash
pandoc --version
```

Expected output:

```
pandoc 3.8.3
Features: +server +lua
Scripting engine: Lua 5.4
User data directory: C:\Users\<username>\AppData\Roaming\pandoc
```

Verify Pandoc is accessible:

```bash
which pandoc
```

Expected output: `/c/Users/<username>/AppData/Local/Pandoc/pandoc` or similar Windows path in Unix format.

#### Troubleshooting

**Problem**: `pandoc: command not found` in Git Bash

**Solution**: Pandoc may not be in the inherited PATH. First, verify Pandoc is installed on Windows by opening Command Prompt and running `pandoc --version`. If installed, close and reopen Git Bash. If still not found, add Pandoc to Git Bash's PATH manually:

```bash
echo 'export PATH="$PATH:/c/Users/$(whoami)/AppData/Local/Pandoc"' >> ~/.bashrc && source ~/.bashrc
```

**Problem**: Path issues when converting files

**Solution**: Git Bash automatically converts Unix-style paths to Windows paths. For most Pandoc operations, this works correctly. If you encounter path issues, use Windows-style paths or double slashes:

```bash
# These should all work
pandoc readme.md -o readme.pdf
pandoc ./readme.md -o ./readme.pdf
pandoc /c/Users/username/readme.md -o /c/Users/username/readme.pdf
```

**Problem**: PDF generation fails

**Solution**: Install MiKTeX on Windows using Chocolatey:

```powershell
# From Administrator PowerShell
choco install miktex -y
```

Then restart Git Bash for PATH changes to take effect.

**Problem**: Unicode/encoding issues

**Solution**: Git Bash uses UTF-8 by default, which is compatible with Pandoc. If you encounter encoding issues with input files, specify the encoding explicitly:

```bash
pandoc --from=markdown --to=pdf -V mainfont="DejaVu Sans" input.md -o output.pdf
```

---

## Post-Installation Configuration

Pandoc works out of the box for most use cases. No additional configuration is typically required. The following optional configurations may be useful:

### Setting Default Output Format

Create a defaults file at `~/.pandoc/defaults.yaml` (Linux/macOS) or `%APPDATA%\pandoc\defaults.yaml` (Windows):

```yaml
# ~/.pandoc/defaults.yaml
from: markdown
to: html5
standalone: true
toc: true
```

Then use it with:

```bash
pandoc --defaults=defaults input.md -o output.html
```

### Configuring PDF Engine

Pandoc supports multiple PDF engines. Set your preferred engine:

```bash
# Using pdflatex (default)
pandoc input.md -o output.pdf --pdf-engine=pdflatex

# Using xelatex (better Unicode support)
pandoc input.md -o output.pdf --pdf-engine=xelatex

# Using lualatex
pandoc input.md -o output.pdf --pdf-engine=lualatex
```

### Installing Pandoc Filters

Pandoc supports filters for extending its capabilities. Popular filters include:

- `pandoc-citeproc` - Citation processing (now built into Pandoc as `--citeproc`)
- `pandoc-crossref` - Cross-referencing figures, tables, and sections
- `mermaid-filter` - Mermaid diagram support

Install filters via your system's package manager or using the Haskell package manager (cabal).

### Shell Aliases

Create convenient aliases for common Pandoc operations. Add to your shell configuration file (`~/.bashrc`, `~/.zshrc`, or `~/.bash_profile`):

```bash
# Convert Markdown to PDF
alias md2pdf='pandoc -f markdown -t pdf'

# Convert Markdown to HTML (standalone with CSS)
alias md2html='pandoc -f markdown -t html5 -s'

# Convert Markdown to DOCX
alias md2docx='pandoc -f markdown -t docx'
```

### Test Your Installation

Verify Pandoc can convert a simple document:

```bash
echo "# Hello World" | pandoc -f markdown -t html
```

Expected output:

```html
<h1 id="hello-world">Hello World</h1>
```

---

## Common Issues

### Issue: "pdflatex not found" or "xelatex not found"

**Symptoms**: Pandoc fails to generate PDF with engine not found errors.

**Solution**: Install a LaTeX distribution:

- **macOS**: `brew install --quiet --cask basictex`
- **Ubuntu/Debian**: `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-latex-base`
- **Windows**: `choco install miktex -y`

After installation, restart your terminal for PATH changes to take effect.

### Issue: "Missing LaTeX packages" During PDF Generation

**Symptoms**: PDF generation fails with errors about missing `.sty` files.

**Solution**: Install the required LaTeX packages. On Debian/Ubuntu:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-latex-extra texlive-fonts-recommended
```

On macOS with BasicTeX, use `tlmgr`:

```bash
sudo tlmgr update --self
sudo tlmgr install collection-fontsrecommended
```

On Windows with MiKTeX, the package manager usually installs missing packages automatically on first use.

### Issue: Unicode Characters Not Rendering in PDF

**Symptoms**: Non-ASCII characters appear as boxes or question marks in PDF output.

**Solution**: Use XeLaTeX or LuaLaTeX instead of pdflatex:

```bash
pandoc input.md -o output.pdf --pdf-engine=xelatex
```

Or specify a Unicode-compatible font:

```bash
pandoc input.md -o output.pdf -V mainfont="DejaVu Sans"
```

### Issue: Large Documents Cause Memory Errors

**Symptoms**: Pandoc crashes or hangs on large documents.

**Solution**: Split the document into smaller parts and combine, or increase available memory. For very large documents, consider using `--incremental` flag or processing in chunks.

### Issue: DOCX Output Missing Styles

**Symptoms**: Converted DOCX files have incorrect or missing formatting.

**Solution**: Create a reference document with your desired styles:

```bash
pandoc --print-default-data-file reference.docx > custom-reference.docx
```

Edit `custom-reference.docx` in Word to set your preferred styles, then use it:

```bash
pandoc input.md --reference-doc=custom-reference.docx -o output.docx
```

### Issue: HTML Output Missing Images

**Symptoms**: Images referenced in Markdown do not appear in HTML output.

**Solution**: Ensure image paths are correct relative to the output location. Use `--extract-media` to copy images:

```bash
pandoc input.md --extract-media=./media -o output.html
```

Or use `--self-contained` to embed images as base64:

```bash
pandoc input.md --self-contained -o output.html
```

### Issue: Pandoc Version Too Old

**Symptoms**: Features documented in Pandoc manual are not available.

**Solution**: Install the latest version from GitHub releases instead of the system package manager. See the platform-specific sections above for commands to download directly from GitHub.

---

## References

- [Pandoc Official Website](https://pandoc.org/)
- [Pandoc User's Guide](https://pandoc.org/MANUAL.html)
- [Pandoc Installation Guide](https://pandoc.org/installing.html)
- [Pandoc GitHub Repository](https://github.com/jgm/pandoc)
- [Pandoc GitHub Releases](https://github.com/jgm/pandoc/releases)
- [Pandoc Homebrew Formula](https://formulae.brew.sh/formula/pandoc)
- [Pandoc Chocolatey Package](https://community.chocolatey.org/packages/pandoc)
- [Pandoc Demos](https://pandoc.org/demos.html)
- [Pandoc FAQ](https://pandoc.org/faqs.html)
- [TeX Live Documentation](https://www.tug.org/texlive/)
- [BasicTeX for macOS](https://www.tug.org/mactex/morepackages.html)
- [MiKTeX for Windows](https://miktex.org/)
