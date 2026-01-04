# Installing LaTeX (TeX Live)

## Overview

LaTeX is a document preparation system widely used for scientific, technical, and academic writing. It excels at producing high-quality typeset documents, particularly those containing complex mathematical equations, tables, and cross-references. TeX Live is the standard, cross-platform distribution of LaTeX maintained by the TeX Users Group (TUG).

Key components included in TeX Live:

- **TeX/LaTeX engines**: pdfTeX, XeTeX, LuaTeX for document compilation
- **Macro packages**: Thousands of style files and document classes
- **Fonts**: Comprehensive font collections for professional typography
- **Utilities**: BibTeX for bibliographies, dvips, makeindex, and more
- **tlmgr**: TeX Live Manager for installing/updating packages

This guide documents TeX Live installation across all supported platforms.

## Prerequisites

Before installing LaTeX on any platform, ensure:

1. **Internet connectivity** - Required to download TeX Live packages (several gigabytes for full installation)
2. **Administrative privileges** - Required for system-wide installation on most platforms
3. **Sufficient disk space** - Full installation requires 7+ GB; basic installation requires approximately 300 MB
4. **Time** - Full installation can take 30-60 minutes depending on network speed

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 10.14 (Mojave) or later
- Homebrew package manager installed
- At least 8 GB free disk space for full installation (300 MB for BasicTeX)
- Apple Silicon (M1/M2/M3/M4) or Intel processor

If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install the full MacTeX distribution (recommended):

```bash
brew install --cask mactex-no-gui
```

This installs the complete TeX Live distribution without GUI applications (TeXShop, BibDesk, etc.), which is ideal for command-line workflows and automation. The `--cask` flag specifies the graphical application installer format used for MacTeX.

**Note**: The installation takes 20-40 minutes and downloads approximately 4 GB of data. The `mactex-no-gui` cask runs non-interactively by default through Homebrew.

After installation completes, restart your terminal to update your PATH, or manually add the TeX binaries:

```bash
eval "$(/usr/libexec/path_helper)"
```

#### Verification

Confirm the installation succeeded:

```bash
latex --version
```

Expected output (version numbers may vary):

```
pdfTeX 3.141592653-2.6-1.40.26 (TeX Live 2025)
kpathsea version 6.4.0
...
```

Test the installation by compiling a simple document:

```bash
echo '\documentclass{article}\begin{document}Hello, LaTeX!\end{document}' > /tmp/test.tex
pdflatex -interaction=nonstopmode -output-directory=/tmp /tmp/test.tex
```

If successful, a file `/tmp/test.pdf` will be created.

#### Troubleshooting

**Problem**: `latex: command not found` after installation

**Solution**: The PATH may not be updated. Either restart your terminal or run:

```bash
eval "$(/usr/libexec/path_helper)"
```

Verify the TeX binaries are in your PATH:

```bash
ls /Library/TeX/texbin/
```

If the directory exists, add it to your PATH manually:

```bash
export PATH="/Library/TeX/texbin:$PATH"
```

Add this line to your `~/.zshrc` or `~/.bash_profile` for persistence.

**Problem**: Installation fails with disk space error

**Solution**: MacTeX requires approximately 8 GB of free space. Free up disk space or use BasicTeX instead:

```bash
brew install --cask basictex
```

BasicTeX is a minimal distribution (~300 MB) that includes core LaTeX functionality. You can add packages later using `tlmgr`.

**Problem**: Permission denied errors during installation

**Solution**: Homebrew cask installations require your user password. Run the command in an interactive terminal. For fully automated scenarios, ensure your user has sudo privileges without password prompts for the installer.

---

### Ubuntu/Debian (APT)

#### Prerequisites

- Ubuntu 20.04 LTS or later, or Debian 11 (Bullseye) or later
- sudo privileges
- At least 6 GB free disk space for full installation (300 MB for basic installation)

#### Installation Steps

Run the following commands to install the full TeX Live distribution:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-full
```

The `DEBIAN_FRONTEND=noninteractive` environment variable ensures the installation proceeds without prompts, and the `-y` flag automatically confirms package installation.

**Note**: The `texlive-full` metapackage installs the complete TeX Live distribution including all fonts, language support, and documentation. This can take 30-60 minutes and downloads several gigabytes of data.

For a smaller installation with core LaTeX functionality:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-latex-recommended texlive-fonts-recommended texlive-latex-extra
```

#### Verification

Confirm the installation succeeded:

```bash
latex --version
```

Expected output (version numbers may vary):

```
pdfTeX 3.141592653-2.6-1.40.24 (TeX Live 2023/Debian)
kpathsea version 6.3.5
...
```

Test the installation:

```bash
echo '\documentclass{article}\begin{document}Hello, LaTeX!\end{document}' > /tmp/test.tex
pdflatex -interaction=nonstopmode -output-directory=/tmp /tmp/test.tex
```

If successful, a file `/tmp/test.pdf` will be created.

#### Troubleshooting

**Problem**: `E: Unable to locate package texlive-full`

**Solution**: Update the package lists:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

If the problem persists, check that the universe repository is enabled:

```bash
sudo add-apt-repository universe -y
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
```

**Problem**: Installation fails with "no space left on device"

**Solution**: The full TeX Live installation requires approximately 6 GB. Free up disk space or use a smaller installation:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-latex-base
```

**Problem**: Missing LaTeX packages when compiling documents

**Solution**: The base installation may not include all packages. Install additional packages:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-latex-extra texlive-fonts-extra texlive-science
```

**Problem**: Old TeX Live version in repository

**Solution**: Ubuntu and Debian repositories contain TeX Live versions that may be a few years behind the current release. For the latest version, use the native TeX Live installer from TUG (see the manual installation section in Git Bash).

---

### Raspberry Pi OS (APT)

#### Prerequisites

- Raspberry Pi OS (64-bit recommended) - Bookworm or Bullseye
- Raspberry Pi 3B+ or later (64-bit capable hardware recommended)
- At least 6 GB free disk space for full installation (300 MB for basic installation)
- At least 2 GB RAM (4 GB recommended for compiling complex documents)
- sudo privileges

First, verify your architecture:

```bash
uname -m
```

- `aarch64` = 64-bit (recommended)
- `armv7l` = 32-bit (supported but limited)

#### Installation Steps

Run the following commands to install the full TeX Live distribution:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-full
```

The installation is identical to Ubuntu/Debian since Raspberry Pi OS is Debian-based. The ARM architecture is fully supported.

**Note**: Installation on Raspberry Pi can be significantly slower than on desktop systems, especially when using an SD card. Expect 1-2 hours for the full installation. Using a high-quality SD card (Class 10 or faster) or an SSD/USB storage will improve performance.

For a faster installation with core LaTeX functionality:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-latex-recommended texlive-fonts-recommended
```

#### Verification

Confirm the installation succeeded:

```bash
latex --version
```

Expected output (version numbers may vary):

```
pdfTeX 3.141592653-2.6-1.40.24 (TeX Live 2023/Debian)
kpathsea version 6.3.5
...
```

Test the installation:

```bash
echo '\documentclass{article}\begin{document}Hello, LaTeX!\end{document}' > /tmp/test.tex
pdflatex -interaction=nonstopmode -output-directory=/tmp /tmp/test.tex
```

If successful, a file `/tmp/test.pdf` will be created.

#### Troubleshooting

**Problem**: Installation extremely slow

**Solution**: Raspberry Pi SD cards can be slow for large installations. Consider:

1. Using a faster SD card (Class 10 or UHS-I)
2. Booting from USB/SSD instead of SD card
3. Installing the minimal TeX Live package first:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-latex-base
```

**Problem**: Out of memory errors during document compilation

**Solution**: Add swap space to handle memory-intensive compilations:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Problem**: "no space left on device" error

**Solution**: The full installation requires approximately 6 GB. Check available space:

```bash
df -h /
```

Free up space or use a minimal installation:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-latex-base
```

**Problem**: ARM-specific font rendering issues

**Solution**: Install additional font packages:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-fonts-extra fonts-liberation
```

---

### Amazon Linux/RHEL (DNF/YUM)

#### Prerequisites

- Amazon Linux 2023 (AL2023), Amazon Linux 2 (AL2), RHEL 8/9, or CentOS Stream
- sudo privileges
- At least 6 GB free disk space for full installation

**Note**: Amazon Linux 2023 and RHEL 9 use DNF as the package manager. Amazon Linux 2 and RHEL 7/8 use YUM. The commands below use DNF; for older systems, replace `dnf` with `yum`.

#### Installation Steps

**For Amazon Linux 2023 and RHEL 9:**

Run the following commands to install TeX Live:

```bash
sudo dnf install -y texlive-scheme-full
```

This installs the full TeX Live distribution. The `-y` flag automatically confirms the installation without prompts.

**Note**: The `texlive-scheme-full` package may not be available in all repositories. If unavailable, install the available TeX Live packages:

```bash
sudo dnf install -y texlive texlive-latex texlive-xetex texlive-collection-latexrecommended texlive-collection-fontsrecommended
```

**For Amazon Linux 2:**

```bash
sudo yum install -y texlive texlive-latex texlive-xetex
```

Amazon Linux 2 has a more limited TeX Live package selection. For additional packages:

```bash
sudo yum install -y texlive-collection-latexrecommended texlive-collection-fontsrecommended
```

#### Verification

Confirm the installation succeeded:

```bash
latex --version
```

Expected output (version numbers may vary):

```
pdfTeX 3.141592653-2.6-1.40.25 (TeX Live 2024)
kpathsea version 6.3.5
...
```

Test the installation:

```bash
echo '\documentclass{article}\begin{document}Hello, LaTeX!\end{document}' > /tmp/test.tex
pdflatex -interaction=nonstopmode -output-directory=/tmp /tmp/test.tex
```

If successful, a file `/tmp/test.pdf` will be created.

#### Troubleshooting

**Problem**: `No match for argument: texlive-scheme-full`

**Solution**: The full scheme may not be available. Install core packages individually:

```bash
sudo dnf install -y texlive texlive-latex texlive-xetex texlive-collection-latex texlive-collection-latexrecommended
```

**Problem**: Missing LaTeX packages when compiling documents

**Solution**: Install additional collections as needed:

```bash
sudo dnf install -y texlive-collection-latexextra texlive-collection-fontsextra texlive-collection-science
```

Or use `tlmgr` to install specific packages (if native TeX Live is installed):

```bash
sudo tlmgr install <package-name>
```

**Problem**: TeX Live version is older than expected

**Solution**: Amazon Linux and RHEL prioritize stability over currency. For the latest TeX Live version, use the native installer from TUG:

```bash
cd /tmp
curl -L -o install-tl-unx.tar.gz https://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz
tar -xzf install-tl-unx.tar.gz
cd install-tl-*/
perl ./install-tl --no-interaction --scheme=full
```

Then add to PATH:

```bash
echo 'export PATH="/usr/local/texlive/2025/bin/x86_64-linux:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Perl dependencies missing for native installer

**Solution**: Install Perl and required modules:

```bash
sudo dnf install -y perl perl-Digest-MD5
```

---

### Windows (Chocolatey)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Administrator PowerShell or Command Prompt
- Chocolatey package manager installed
- At least 8 GB free disk space for full installation
- Stable internet connection (installation downloads several gigabytes)

If Chocolatey is not installed, install it first by running this command in an Administrator PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Installation Steps

Run the following command in an Administrator PowerShell or Command Prompt to install TeX Live:

```powershell
choco install texlive -y --params="'/scheme:full'"
```

The `-y` flag automatically confirms all prompts. The `/scheme:full` parameter installs the complete TeX Live distribution.

**Note**: The full installation takes 45-90 minutes depending on network speed and system performance. TeX Live installs to `C:\texlive\<year>` by default.

For a smaller, faster installation with basic LaTeX functionality:

```powershell
choco install texlive -y --params="'/scheme:basic'"
```

After installation completes, restart your terminal or PowerShell to update the PATH.

#### Verification

Open a new Command Prompt or PowerShell window, then run:

```powershell
latex --version
```

Expected output (version numbers may vary):

```
pdfTeX 3.141592653-2.6-1.40.26 (TeX Live 2025/W32TeX)
kpathsea version 6.4.0
...
```

Test the installation:

```powershell
echo \documentclass{article}\begin{document}Hello, LaTeX!\end{document} > %TEMP%\test.tex
pdflatex -interaction=nonstopmode -output-directory=%TEMP% %TEMP%\test.tex
```

If successful, a file `%TEMP%\test.pdf` will be created.

#### Troubleshooting

**Problem**: `latex is not recognized as an internal or external command`

**Solution**: The PATH may not be updated. Restart your terminal. If the problem persists, add TeX Live to PATH manually:

1. Find your TeX Live installation (usually `C:\texlive\2025\bin\windows`)
2. Add to PATH in System Properties > Environment Variables

Or run from PowerShell:

```powershell
$env:Path += ";C:\texlive\2025\bin\windows"
```

**Problem**: Installation times out

**Solution**: TeX Live installation can take over an hour. Increase the Chocolatey timeout:

```powershell
choco install texlive -y --params="'/scheme:full'" --execution-timeout=7200
```

**Problem**: Installation fails with network errors

**Solution**: TeX Live downloads packages from CTAN mirrors. If mirrors are slow:

1. Retry the installation
2. Use a different network
3. Consider installing during off-peak hours

**Problem**: "Access denied" errors during installation

**Solution**: Ensure you are running PowerShell or Command Prompt as Administrator. Right-click the application and select "Run as administrator".

**Problem**: Disk space issues

**Solution**: The full TeX Live installation requires approximately 8 GB. Check available space:

```powershell
Get-PSDrive C | Select-Object Used,Free
```

Use the basic scheme if space is limited:

```powershell
choco install texlive -y --params="'/scheme:basic'"
```

---

### WSL (Ubuntu)

#### Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- WSL 2 enabled with Ubuntu distribution installed
- sudo privileges within WSL
- At least 6 GB free disk space in WSL

#### Installation Steps

Run these commands in your WSL Ubuntu terminal:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-full
```

The installation is identical to native Ubuntu since WSL runs a full Ubuntu userspace.

**Note**: The installation downloads and extracts several gigabytes of data. Ensure your WSL has sufficient disk space. By default, WSL uses a virtual disk that can grow, but you may need to compact it periodically.

For a smaller installation:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-latex-recommended texlive-fonts-recommended texlive-latex-extra
```

#### Verification

Confirm the installation succeeded:

```bash
latex --version
```

Expected output (version numbers may vary):

```
pdfTeX 3.141592653-2.6-1.40.24 (TeX Live 2023/Debian)
kpathsea version 6.3.5
...
```

Test the installation:

```bash
echo '\documentclass{article}\begin{document}Hello, LaTeX!\end{document}' > /tmp/test.tex
pdflatex -interaction=nonstopmode -output-directory=/tmp /tmp/test.tex
```

If successful, a file `/tmp/test.pdf` will be created.

To view the PDF from WSL, copy it to a Windows-accessible location:

```bash
cp /tmp/test.pdf /mnt/c/Users/$USER/Desktop/
```

#### Troubleshooting

**Problem**: Installation very slow

**Solution**: WSL disk I/O can be slower than native Linux. The TeX Live installation involves many small files. Be patient, or use a minimal installation first.

**Problem**: "no space left on device" error

**Solution**: WSL virtual disks have limited default sizes. Check available space:

```bash
df -h /
```

Compact the WSL virtual disk from Windows PowerShell (run as Administrator):

```powershell
wsl --shutdown
Optimize-VHD -Path "$env:LOCALAPPDATA\Packages\CanonicalGroupLimited.Ubuntu*\LocalState\ext4.vhdx" -Mode Full
```

**Problem**: PDF viewers not available in WSL

**Solution**: WSL is primarily a command-line environment. View PDFs using Windows applications:

```bash
# Copy to Windows and open with default viewer
cp /tmp/test.pdf /mnt/c/Users/$USER/Desktop/
cmd.exe /c start "" "C:\\Users\\$USER\\Desktop\\test.pdf"
```

Or install a WSL-compatible PDF viewer with X server support.

**Problem**: Missing fonts in compiled documents

**Solution**: Install additional font packages:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-fonts-extra fonts-liberation fonts-dejavu
```

---

### Git Bash (Manual/Portable)

#### Prerequisites

- Windows 10 or Windows 11 (64-bit)
- Git Bash installed (comes with Git for Windows)
- Administrator privileges for system-wide installation, or write access to installation directory for portable installation
- At least 8 GB free disk space for full installation

**Note**: Git Bash on Windows shares the Windows PATH, so installing TeX Live on Windows makes it available in Git Bash automatically. The recommended approach is to use the Chocolatey installation method (see Windows section). This section documents accessing TeX Live from Git Bash after Windows installation.

#### Installation Steps

**Recommended: Install TeX Live via Chocolatey (see Windows section)**

After installing TeX Live on Windows using Chocolatey, the `latex` command will be available in Git Bash once you restart the terminal.

**Alternative: Manual PATH Configuration**

If TeX Live was installed manually or the PATH is not configured automatically, add TeX Live to your Git Bash PATH.

Create or edit `~/.bashrc`:

```bash
echo 'export PATH="/c/texlive/2025/bin/windows:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Adjust the path according to your TeX Live installation location. Common locations:

- `C:\texlive\2025\bin\windows` (Chocolatey installation)
- `C:\texlive\2025\bin\win64` (Manual installation)

**Portable Installation for Git Bash:**

For a truly portable setup (e.g., on a USB drive), download and install TeX Live with the portable option:

1. Download the TeX Live installer from a Windows Command Prompt or PowerShell:

```powershell
curl -L -o "%TEMP%\install-tl.zip" https://mirror.ctan.org/systems/texlive/tlnet/install-tl.zip
cd %TEMP%
tar -xf install-tl.zip
cd install-tl-*
```

2. Run the installer with portable flag:

```powershell
perl install-tl -no-gui -portable -scheme full
```

3. Configure Git Bash to use the portable installation by adding to `~/.bashrc`:

```bash
echo 'export PATH="/c/path/to/portable/texlive/bin/windows:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Verification

Open Git Bash and confirm the installation:

```bash
latex --version
```

Expected output (version numbers may vary):

```
pdfTeX 3.141592653-2.6-1.40.26 (TeX Live 2025)
kpathsea version 6.4.0
...
```

Test the installation:

```bash
echo '\documentclass{article}\begin{document}Hello, LaTeX!\end{document}' > /tmp/test.tex
pdflatex -interaction=nonstopmode -output-directory=/tmp /tmp/test.tex
```

If successful, a file `/tmp/test.pdf` will be created.

#### Troubleshooting

**Problem**: `latex: command not found` in Git Bash

**Solution**: The PATH may not include TeX Live. Check if TeX Live is installed on Windows:

```bash
ls "/c/texlive/"
```

If the directory exists, add it to your PATH:

```bash
export PATH="/c/texlive/2025/bin/windows:$PATH"
```

Add this line to `~/.bashrc` for persistence.

**Problem**: Path conversion issues with Git Bash

**Solution**: Git Bash automatically converts Unix-style paths to Windows paths, which can sometimes cause issues. Use Windows-style paths with forward slashes:

```bash
pdflatex -output-directory=C:/Users/$USER/Documents C:/Users/$USER/Documents/test.tex
```

Or disable path conversion temporarily:

```bash
MSYS_NO_PATHCONV=1 pdflatex -output-directory=/c/Users/$USER/Documents /c/Users/$USER/Documents/test.tex
```

**Problem**: TeX Live commands work in Command Prompt but not Git Bash

**Solution**: Git Bash may not inherit the Windows PATH correctly. Verify PATH includes TeX Live:

```bash
echo $PATH | tr ':' '\n' | grep -i texlive
```

If not found, add manually to `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/c/texlive/2025/bin/windows"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: `kpathsea` database not found errors

**Solution**: Run the TeX Live font map update:

```bash
mktexlsr
updmap-sys
```

---

## Post-Installation Configuration

After installing TeX Live on any platform, consider these optional but recommended configurations.

### Updating TeX Live Packages

TeX Live includes `tlmgr` (TeX Live Manager) for updating packages:

```bash
# Update tlmgr itself first (Linux/macOS may require sudo)
sudo tlmgr update --self

# Update all packages
sudo tlmgr update --all
```

On macOS with Homebrew-installed MacTeX, use:

```bash
sudo tlmgr update --self --all
```

**Note**: Distribution-packaged TeX Live (apt, dnf) may not include a functional `tlmgr`. Use the distribution's package manager for updates instead, or install TeX Live directly from TUG.

### Installing Additional Packages

Install specific LaTeX packages using `tlmgr`:

```bash
# Install a single package
sudo tlmgr install <package-name>

# Install multiple packages
sudo tlmgr install package1 package2 package3

# Search for packages
tlmgr search <search-term>
```

For distribution-packaged TeX Live, use the system package manager:

```bash
# Ubuntu/Debian
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-<package-collection>

# Amazon Linux/RHEL
sudo dnf install -y texlive-<package-collection>
```

### Configuring Default Paper Size

Set the default paper size (letter or a4):

```bash
# For US Letter (8.5" x 11")
sudo tlmgr paper letter

# For A4 (210mm x 297mm)
sudo tlmgr paper a4
```

### Setting Up Editor Integration

Popular LaTeX editors and their integration methods:

- **VS Code**: Install the "LaTeX Workshop" extension
- **Sublime Text**: Install the "LaTeXTools" package
- **Vim**: Use "vimtex" plugin
- **Emacs**: Use AUCTeX package

Verify your editor can find the LaTeX binaries by ensuring the PATH is correctly set.

---

## Common Issues

### Issue: "LaTeX Error: File `<package>.sty' not found"

**Symptoms**: Compilation fails because a required style file is missing.

**Solutions**:

Find and install the missing package:

```bash
# Search for the package
tlmgr search --global --file <package>.sty

# Install the package
sudo tlmgr install <package-name>
```

For distribution-packaged TeX Live:

```bash
# Ubuntu/Debian
apt-cache search <package>
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y <texlive-package>
```

### Issue: Font-Related Errors

**Symptoms**: "Font ... not found" or poor-quality fonts in output.

**Solutions**:

Update the font maps:

```bash
sudo updmap-sys
```

Install additional font packages:

```bash
# With tlmgr
sudo tlmgr install collection-fontsrecommended collection-fontsextra

# Ubuntu/Debian
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y texlive-fonts-recommended texlive-fonts-extra
```

### Issue: Compilation Hangs or Takes Forever

**Symptoms**: `pdflatex` or `latex` command hangs without producing output.

**Solutions**:

Use non-interactive mode to prevent prompts:

```bash
pdflatex -interaction=nonstopmode document.tex
```

Or use batchmode for even less output:

```bash
pdflatex -interaction=batchmode document.tex
```

### Issue: "I can't write on file" Errors

**Symptoms**: TeX cannot create output files.

**Solutions**:

Ensure you have write permissions to the output directory:

```bash
# Specify output directory explicitly
pdflatex -output-directory=/path/to/writable/dir document.tex
```

Check disk space:

```bash
df -h .
```

### Issue: BibTeX/Bibliography Not Working

**Symptoms**: Citations show as "[?]" or bibliography is missing.

**Solutions**:

Run the full compilation sequence:

```bash
pdflatex document.tex
bibtex document
pdflatex document.tex
pdflatex document.tex
```

Or use `latexmk` for automatic compilation:

```bash
latexmk -pdf document.tex
```

### Issue: Special Characters or Unicode Not Rendering

**Symptoms**: Non-ASCII characters appear as boxes or cause errors.

**Solutions**:

Use XeLaTeX or LuaLaTeX instead of pdfLaTeX for better Unicode support:

```bash
xelatex document.tex
# or
lualatex document.tex
```

Add these packages to your document preamble:

```latex
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
```

---

## References

- [TeX Live Official Documentation](https://www.tug.org/texlive/doc.html)
- [TeX Live Quick Install Guide](https://www.tug.org/texlive/quickinstall.html)
- [TeX Users Group (TUG)](https://www.tug.org/)
- [CTAN - Comprehensive TeX Archive Network](https://ctan.org/)
- [MacTeX Distribution](https://www.tug.org/mactex/)
- [MacTeX Homebrew Cask](https://formulae.brew.sh/cask/mactex)
- [BasicTeX Homebrew Cask](https://formulae.brew.sh/cask/basictex)
- [Ubuntu LaTeX Community Wiki](https://help.ubuntu.com/community/LaTeX)
- [TeX Live Chocolatey Package](https://community.chocolatey.org/packages/texlive)
- [tlmgr - TeX Live Manager Documentation](https://www.tug.org/texlive/tlmgr.html)
- [LaTeX Project](https://www.latex-project.org/)
- [TeX Live Portable Installation](https://www.tug.org/texlive/portable.html)
