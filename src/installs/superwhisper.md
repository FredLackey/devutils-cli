# Installing Superwhisper

## Overview

Superwhisper is an AI-powered voice-to-text application that enables fast and accurate speech transcription using advanced Whisper-based AI models. It allows you to dictate text up to 5x faster than typing, with intelligent punctuation, formatting, and optional AI post-processing to refine your spoken words into polished text.

Key features include:
- **Offline transcription** - Local AI models process speech entirely on your device for privacy
- **100+ language support** - Transcribe and translate speech in over 100 languages
- **AI formatting modes** - Transform casual speech into professional emails, notes, or any format
- **Cloud and local models** - Choose between local models (Nano, Fast, Pro, Ultra) or cloud-based options
- **System-wide dictation** - Works in any application where you can type

**Platform Availability**: Superwhisper is a commercial application available for macOS, iOS, and Windows. It is **not available** for Linux distributions including Ubuntu, Raspberry Pi OS, or Amazon Linux.

## Prerequisites

Before installing Superwhisper, ensure:

1. **Internet connectivity** - Required for initial download and cloud AI features
2. **Sufficient RAM** - Minimum 8 GB RAM; 16 GB recommended for larger AI models
3. **Microphone** - A working microphone for voice input
4. **Supported platform** - macOS 13+, Windows 10+, or iOS 16+

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 13 (Ventura) or later
- Homebrew package manager installed
- Apple Silicon (M1/M2/M3/M4) recommended for best offline model performance
- Intel Macs supported but work best with cloud models
- At least 8 GB RAM (16 GB recommended for larger models)

Apple Silicon Macs provide significantly better performance for local AI models. Intel Macs can run smaller local models but are recommended to use cloud-based transcription for optimal accuracy.

If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Superwhisper via Homebrew:

```bash
brew install --cask --quiet superwhisper
```

The `--cask` flag indicates this is a macOS application, and `--quiet` suppresses non-essential output for automation compatibility.

After installation, Superwhisper is available in `/Applications/superwhisper.app`. Launch it from Spotlight, the Applications folder, or via command line:

```bash
open -a superwhisper
```

On first launch, Superwhisper will:
1. Request microphone permissions (required for voice input)
2. Request accessibility permissions (required for system-wide dictation)
3. Guide you through AI model selection based on your hardware

Grant all requested permissions for full functionality.

#### Verification

Confirm the installation succeeded by verifying the application exists:

```bash
ls /Applications/superwhisper.app
```

Expected output:

```
/Applications/superwhisper.app
```

Launch the application to verify it opens correctly:

```bash
open -a superwhisper
```

Superwhisper runs as a menu bar application. Look for its icon in the macOS menu bar after launching.

#### Troubleshooting

**Problem**: `brew: command not found`

**Solution**: Homebrew is not installed or not in PATH. For Apple Silicon Macs:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For Intel Macs:

```bash
eval "$(/usr/local/bin/brew shellenv)"
```

**Problem**: Installation fails with "Cask 'superwhisper' is unavailable"

**Solution**: Update Homebrew to get the latest cask definitions:

```bash
brew update && brew install --cask --quiet superwhisper
```

**Problem**: "superwhisper can't be opened because Apple cannot check it for malicious software"

**Solution**: Right-click the app in Applications and select "Open", then click "Open" in the dialog. Alternatively, clear the quarantine flag:

```bash
xattr -cr /Applications/superwhisper.app
```

**Problem**: Microphone permission denied or not working

**Solution**: Grant microphone access in System Preferences > Privacy & Security > Microphone. Enable the toggle for Superwhisper. If the app does not appear in the list, remove and reinstall:

```bash
brew uninstall --cask superwhisper && brew install --cask --quiet superwhisper
```

**Problem**: Dictation does not insert text into applications

**Solution**: Grant accessibility permissions in System Preferences > Privacy & Security > Accessibility. Enable the toggle for Superwhisper. Restart Superwhisper after granting permissions.

**Problem**: Slow transcription on Intel Mac

**Solution**: Intel Macs perform best with cloud-based models. Open Superwhisper preferences and switch to a cloud model (requires internet connection and may require Pro subscription).

---

### Ubuntu/Debian (APT)

#### Platform Limitation

**Superwhisper is not available for Ubuntu, Debian, or any Linux distribution.**

Superwhisper is developed exclusively for macOS, iOS, and Windows. There is no official Linux version, and the application cannot be installed on Ubuntu or Debian systems.

#### Alternative Solutions

For Linux users requiring similar voice-to-text functionality, consider these open-source alternatives that provide Whisper-based transcription:

**SoupaWhisper** - Open-source local voice dictation for Linux using Whisper AI:
- Hold a key, speak, release - text appears in the active window
- Runs entirely locally via faster-whisper
- Works on Debian, Ubuntu, Fedora, Arch, and most derivatives
- Requires X11 (not compatible with Wayland)
- GitHub: https://github.com/ksred/soupawhisper

**WhisperTrigger** - Open-source Linux speech-to-text application inspired by Superwhisper:
- Built with OpenAI's Whisper model
- Available as AppImage with all dependencies included
- Automatically detects NVIDIA GPU for faster processing
- GitHub: https://github.com/RetroTrigger/whispertrigger

**OpenAI Whisper CLI** - The underlying Whisper model can be installed directly:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg python3 python3-venv python3-pip
python3 -m venv ~/whisper-env
source ~/whisper-env/bin/activate
pip install openai-whisper
```

This provides file-based transcription but not real-time dictation.

---

### Raspberry Pi OS (APT)

#### Platform Limitation

**Superwhisper is not available for Raspberry Pi OS or any ARM-based Linux distribution.**

Superwhisper is developed exclusively for macOS, iOS, and Windows. There is no official Linux version, including ARM Linux variants.

#### Alternative Solutions

For Raspberry Pi users requiring voice-to-text functionality, the OpenAI Whisper model can be installed, though performance will be limited due to hardware constraints:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg python3 python3-venv python3-pip
python3 -m venv ~/whisper-env
source ~/whisper-env/bin/activate
pip install openai-whisper
```

**Note**: Raspberry Pi hardware is not recommended for Whisper transcription due to limited CPU and memory resources. Transcription will be significantly slower than on desktop hardware.

---

### Amazon Linux/RHEL (DNF/YUM)

#### Platform Limitation

**Superwhisper is not available for Amazon Linux, RHEL, or any Linux distribution.**

Superwhisper is developed exclusively for macOS, iOS, and Windows. There is no official Linux version.

#### Alternative Solutions

For Amazon Linux or RHEL users requiring voice-to-text functionality, consider the OpenAI Whisper CLI:

**For Amazon Linux 2023 and RHEL 8+:**

```bash
sudo dnf install -y python3 python3-pip ffmpeg-free
python3 -m venv ~/whisper-env
source ~/whisper-env/bin/activate
pip install openai-whisper
```

**For Amazon Linux 2:**

```bash
sudo yum install -y python3 python3-pip
sudo amazon-linux-extras install -y epel
sudo yum install -y ffmpeg
python3 -m venv ~/whisper-env
source ~/whisper-env/bin/activate
pip install openai-whisper
```

This provides file-based transcription. For real-time dictation on Linux, see the SoupaWhisper or WhisperTrigger alternatives mentioned in the Ubuntu section.

---

### Windows (Direct Download)

#### Prerequisites

- Windows 10 or later (Windows 11 supported)
- Both x64 (Intel/AMD) and ARM64 architectures supported
- At least 8 GB RAM (16 GB recommended for larger models)
- Administrator privileges for installation
- Active internet connection for download

**Note**: Superwhisper for Windows is a relatively new release (December 2025). While functional, some features may differ from the macOS version.

#### Package Manager Availability

Superwhisper is **not available** in Chocolatey or winget package repositories. Installation must be performed via direct download from the official website.

#### Installation Steps

**Step 1: Download the Installer**

Download the appropriate installer for your system architecture using PowerShell:

**For x64 (Intel/AMD) systems:**

```powershell
Invoke-WebRequest -Uri "https://fresh.superwhisper.com/download/installer/windows/x64" -OutFile "$env:TEMP\superwhisper-setup.exe"
```

**For ARM64 systems (Surface Pro X, Windows on ARM):**

```powershell
Invoke-WebRequest -Uri "https://fresh.superwhisper.com/download/installer/windows/aarch64" -OutFile "$env:TEMP\superwhisper-setup.exe"
```

**Step 2: Run the Installer**

Run the installer silently:

```powershell
Start-Process -FilePath "$env:TEMP\superwhisper-setup.exe" -ArgumentList "/S" -Wait
```

**Note**: The `/S` flag attempts silent installation. If the installer does not support silent mode, it will launch the GUI installer which requires manual interaction. In this case, run:

```powershell
Start-Process -FilePath "$env:TEMP\superwhisper-setup.exe" -Wait
```

Follow the on-screen prompts to complete installation.

**Step 3: Clean Up**

Remove the downloaded installer:

```powershell
Remove-Item "$env:TEMP\superwhisper-setup.exe" -Force
```

**Step 4: Launch Superwhisper**

After installation, launch Superwhisper from the Start Menu or via PowerShell:

```powershell
Start-Process "superwhisper"
```

Superwhisper runs in the system tray. The default keyboard shortcut for voice input is `Ctrl+Space`.

#### Verification

Verify the installation by checking for the application:

```powershell
Get-Command superwhisper -ErrorAction SilentlyContinue
```

Or verify the installation directory exists:

```powershell
Test-Path "$env:LOCALAPPDATA\Programs\superwhisper"
```

Expected output:

```
True
```

Launch the application to confirm it runs:

```powershell
Start-Process "superwhisper"
```

Look for the Superwhisper icon in the system tray.

#### Troubleshooting

**Problem**: Download fails with SSL/TLS error

**Solution**: Ensure TLS 1.2 is enabled:

```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri "https://fresh.superwhisper.com/download/installer/windows/x64" -OutFile "$env:TEMP\superwhisper-setup.exe"
```

**Problem**: Installer fails or hangs

**Solution**: Download manually from https://superwhisper.com/windows using a web browser, then run the downloaded installer.

**Problem**: Windows Defender SmartScreen blocks the installer

**Solution**: Superwhisper is a legitimate application. Click "More info" and then "Run anyway". For enterprise environments, contact your IT administrator to whitelist the installer.

**Problem**: `Ctrl+Space` shortcut does not work

**Solution**: The shortcut may conflict with other applications. Open Superwhisper settings from the system tray icon and configure a different keyboard shortcut.

**Problem**: Microphone not detected

**Solution**: Ensure your microphone is connected and working. Check Windows Settings > System > Sound > Input to verify your microphone is selected. Grant Superwhisper permission to access the microphone when prompted.

**Problem**: Some features missing compared to macOS version

**Solution**: The Windows version is newer and may not have feature parity with macOS. Check https://superwhisper.com for the latest updates on Windows features.

---

### WSL (Ubuntu)

#### Platform Limitation

**Superwhisper cannot run in WSL (Windows Subsystem for Linux).**

Superwhisper is a graphical application that requires direct access to audio hardware and a native windowing system. WSL does not provide the necessary audio infrastructure or GUI support for Superwhisper.

#### Recommended Approach

Install Superwhisper on Windows (see the Windows section above) and use it alongside your WSL environment. Superwhisper runs in the Windows system tray and can insert text into any application, including terminals running WSL sessions.

**Step 1: Install Superwhisper on Windows**

From PowerShell (as Administrator):

```powershell
Invoke-WebRequest -Uri "https://fresh.superwhisper.com/download/installer/windows/x64" -OutFile "$env:TEMP\superwhisper-setup.exe"
Start-Process -FilePath "$env:TEMP\superwhisper-setup.exe" -Wait
Remove-Item "$env:TEMP\superwhisper-setup.exe" -Force
```

**Step 2: Use with WSL**

1. Launch Superwhisper on Windows (it runs in the system tray)
2. Open your WSL terminal (Windows Terminal, cmd, or any terminal emulator)
3. Press the Superwhisper shortcut (default: `Ctrl+Space`) to start dictation
4. Speak your text - it will be inserted into the WSL terminal

Superwhisper works with any application that accepts keyboard input, including WSL terminals.

---

### Git Bash (Windows)

#### Prerequisites

- Windows 10 or later
- Git for Windows installed (provides Git Bash)
- Superwhisper installed on Windows (see Windows section)

Git Bash is a terminal emulator that runs on Windows. Since Superwhisper is a Windows application, it works with Git Bash just like any other Windows application.

#### Installation Steps

Install Superwhisper on Windows using PowerShell. You can execute PowerShell commands from Git Bash:

```bash
powershell.exe -Command "Invoke-WebRequest -Uri 'https://fresh.superwhisper.com/download/installer/windows/x64' -OutFile \"\$env:TEMP\\superwhisper-setup.exe\"; Start-Process -FilePath \"\$env:TEMP\\superwhisper-setup.exe\" -Wait; Remove-Item \"\$env:TEMP\\superwhisper-setup.exe\" -Force"
```

Alternatively, open PowerShell directly and run the Windows installation commands from the Windows section above.

#### Verification

Verify Superwhisper is installed by checking for its executable:

```bash
ls "/c/Users/$USER/AppData/Local/Programs/superwhisper" 2>/dev/null || echo "Superwhisper not found in default location"
```

Launch Superwhisper via Windows:

```bash
cmd.exe /c start "" "superwhisper"
```

#### Using Superwhisper with Git Bash

1. Launch Superwhisper on Windows (it runs in the system tray)
2. Open Git Bash
3. Press the Superwhisper shortcut (default: `Ctrl+Space`) to start dictation
4. Speak your text - it will be inserted into the Git Bash terminal

Superwhisper inserts text as keyboard input, so it works with any application that accepts text input, including Git Bash.

#### Troubleshooting

**Problem**: `Ctrl+Space` shortcut does not work in Git Bash

**Solution**: Some terminal emulators may intercept keyboard shortcuts. Try configuring a different shortcut in Superwhisper settings, or use a different terminal emulator like Windows Terminal.

**Problem**: Superwhisper inserts text incorrectly in Git Bash

**Solution**: Git Bash uses mintty which may have compatibility issues with rapid keyboard input. Try using Windows Terminal with Git Bash profile instead:

```bash
# Open Windows Terminal
cmd.exe /c start "" "wt" "-p" "Git Bash"
```

---

## Post-Installation Configuration

### First-Time Setup

After installing and launching Superwhisper on any platform:

1. **Grant Permissions** - Allow microphone access and any other requested system permissions
2. **Select AI Model** - Choose an AI model based on your hardware:
   - **Nano/Fast** - Smaller models suitable for most hardware
   - **Pro/Ultra** - Larger models requiring Apple Silicon or powerful hardware
   - **Cloud models** - Offload processing to servers (requires internet, may require Pro subscription)
3. **Configure Keyboard Shortcut** - Set your preferred shortcut for activating dictation (default varies by platform)
4. **Test Dictation** - Perform a test dictation to verify everything works

### Model Selection Guide

| Model | Size | Requirements | Best For |
|-------|------|--------------|----------|
| Nano | Smallest | Any hardware | Quick notes, basic dictation |
| Fast | Small | 8 GB RAM | General dictation |
| Pro | Large | Apple Silicon, 16 GB RAM | Professional use, high accuracy |
| Ultra | Largest | Apple Silicon, 16+ GB RAM | Maximum accuracy, complex vocabulary |
| Cloud | N/A | Internet connection | Intel Macs, Windows, or when traveling |

### Privacy Considerations

Superwhisper offers both local and cloud processing:

- **Local models** - Audio is processed entirely on your device. No data is sent to external servers.
- **Cloud models** - Audio is sent to third-party servers (OpenAI, Anthropic, Deepgram, etc.) for processing. Review the privacy policies of these services before use.

For sensitive content, use local models exclusively.

### Subscription Tiers

- **Free Tier** - 15 minutes of Pro feature trial, then limited to basic features forever
- **Pro Subscription** - Unlimited access to larger models, AI formatting modes, and cloud processing (~$8.49/month or $84.99/year)

Your Pro license covers macOS, iOS, and Windows at no additional cost.

---

## Common Issues

### Issue: High CPU Usage During Dictation

**Symptoms**: System becomes slow during voice transcription, fans spin up.

**Solution**:
1. Use a smaller AI model (Nano or Fast instead of Pro/Ultra)
2. Close other resource-intensive applications during dictation
3. On Intel Macs, use cloud models instead of local models

### Issue: Transcription Accuracy Issues

**Symptoms**: Words are frequently misheard or transcribed incorrectly.

**Solution**:
1. Speak clearly and at a moderate pace
2. Use a higher-quality microphone or reduce background noise
3. Switch to a larger AI model (Pro or Ultra) for better accuracy
4. Add custom vocabulary for domain-specific terms in Superwhisper settings

### Issue: Application Not Responding to Keyboard Shortcut

**Symptoms**: Pressing the dictation shortcut does nothing.

**Solution**:
1. Verify Superwhisper is running (check menu bar on macOS or system tray on Windows)
2. Check that the shortcut is not conflicting with another application
3. Try a different keyboard shortcut in Superwhisper settings
4. Restart Superwhisper

### Issue: No Audio Input Detected

**Symptoms**: Superwhisper does not hear any voice input.

**Solution**:
1. Check microphone permissions in system settings
2. Verify your microphone is selected in Superwhisper preferences
3. Test your microphone in another application to confirm it works
4. Try a different microphone

### Issue: License Not Activating on Multiple Devices

**Symptoms**: Pro features not available after purchasing subscription.

**Solution**:
1. Sign in with the same account on all devices
2. Verify your subscription is active at https://superwhisper.com/account
3. Check that you are not exceeding device limits
4. Contact Superwhisper support if issues persist

---

## Uninstallation

### macOS

Remove Superwhisper and its associated data:

```bash
brew uninstall --cask superwhisper
rm -rf ~/Library/Application\ Support/superwhisper
rm -rf ~/Library/Caches/superwhisper
rm -rf ~/Library/Preferences/com.superultra.superwhisper.plist
```

### Windows

Remove Superwhisper via PowerShell:

```powershell
# Uninstall via Windows Settings/Apps
Get-AppxPackage *superwhisper* | Remove-AppxPackage

# Or use the uninstaller
Start-Process "$env:LOCALAPPDATA\Programs\superwhisper\Uninstall superwhisper.exe" -Wait

# Remove user data
Remove-Item -Path "$env:APPDATA\superwhisper" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\superwhisper" -Recurse -Force -ErrorAction SilentlyContinue
```

---

## References

- [Superwhisper Official Website](https://superwhisper.com/)
- [Superwhisper Documentation](https://superwhisper.com/docs/get-started/introduction)
- [Superwhisper Windows Download](https://superwhisper.com/windows)
- [Superwhisper macOS Download (DMG)](https://builds.superwhisper.com/latest/superwhisper.dmg)
- [Superwhisper GitHub Downloads](https://github.com/superultrainc/superwhisper-download)
- [Superwhisper Homebrew Cask](https://formulae.brew.sh/cask/superwhisper)
- [Superwhisper iOS App Store](https://apps.apple.com/us/app/superwhisper/id6471464415)
- [Superwhisper Feature Requests](https://feedback.superwhisper.com)
- [OpenAI Whisper (underlying technology)](https://github.com/openai/whisper)
- [SoupaWhisper (Linux alternative)](https://github.com/ksred/soupawhisper)
- [WhisperTrigger (Linux alternative)](https://github.com/RetroTrigger/whispertrigger)
