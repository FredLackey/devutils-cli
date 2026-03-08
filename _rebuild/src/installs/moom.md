# Installing Moom

## Dependencies

### macOS (Homebrew)
- **Required:**
  - `Homebrew` - Install via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` or run `dev install homebrew`
- **Optional:** None
- **Auto-installed:** None

### Ubuntu (APT/Snap)
- **Required:** None (installation not supported)
- **Optional:** None
- **Auto-installed:** None

**Note:** Moom is a macOS-exclusive application developed by Many Tricks. It is not available for Linux platforms. See the Ubuntu section below for alternative window management tools.

### Raspberry Pi OS (APT/Snap)
- **Required:** None (installation not supported)
- **Optional:** None
- **Auto-installed:** None

**Note:** Moom is a macOS-exclusive application. See the Raspberry Pi OS section below for alternative window management tools.

### Amazon Linux (DNF/YUM)
- **Required:** None (installation not supported)
- **Optional:** None
- **Auto-installed:** None

**Note:** Amazon Linux is a server operating system without a desktop environment by default. Window management tools are not applicable. Moom is also macOS-exclusive.

### Windows (Chocolatey/winget)
- **Required:** None (installation not supported)
- **Optional:** None
- **Auto-installed:** None

**Note:** Moom is a macOS-exclusive application. See the Windows section below for alternative window management tools.

### Git Bash (Manual/Portable)
- **Required:** None (installation not supported)
- **Optional:** None
- **Auto-installed:** None

**Note:** Git Bash runs on Windows where Moom is not available. See the Git Bash section below for alternative window management tools.

## Overview

Moom is a powerful and intuitive window management utility for macOS developed by Many Tricks. It enables users to move, resize, and arrange application windows with precision using mouse interactions, keyboard shortcuts, or custom-defined layouts. Moom is widely regarded as one of the best window management tools available for macOS, offering a balance of simplicity and power that appeals to both casual users and power users.

Key capabilities include:

- **Mouse-Based Control**: Hover over any window's green (or configurable red/yellow) button to reveal a pop-up palette with quick resize and move options
- **Snap to Edges**: Drag windows to screen edges to snap them into predefined positions (half screen, quarter screen, etc.)
- **Custom Grids**: Define custom grids for precise window positioning and sizing
- **Saved Layouts**: Create and restore complete window arrangements across multiple applications, especially useful for multi-monitor setups
- **Keyboard Control**: Comprehensive keyboard shortcuts for moving, resizing, centering, and arranging windows without touching the mouse
- **Hover Feature**: Move and resize background windows by holding modifier keys while moving the mouse
- **Multi-Display Support**: Seamlessly manage windows across multiple monitors with display-aware features

**Important Platform Limitation:** Moom is a **macOS-only** application. Many Tricks develops Moom exclusively for macOS, and the application is not available for Windows, Linux, or any other operating system. Moom 4 (the current version) is available only from the Many Tricks website; it is not available on the Mac App Store due to sandboxing requirements.

| Platform | Tool | Description |
|----------|------|-------------|
| macOS | Moom | Many Tricks' window management utility |
| Windows | PowerToys FancyZones | Microsoft's free window management utility |
| Linux | i3 / bspwm / xfwm4 | Tiling and floating window managers |

## Prerequisites

Before installing Moom, ensure:

1. **macOS 10.15 (Catalina) or later** - Required for Moom 4.x
2. **Internet connectivity** - Required to download the package
3. **Administrative privileges** - Required for Homebrew cask installation
4. **Sufficient disk space** - At least 50 MB for installation

---

## Platform-Specific Installation

### macOS (Homebrew)

Moom is the native macOS window management solution and is available as a Homebrew cask.

#### Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew package manager installed
- 64-bit processor (Intel or Apple Silicon natively supported)
- Valid license for full functionality (trial available)

Verify Homebrew is installed:

```bash
brew --version
```

If Homebrew is not installed, install it first using `dev install homebrew` or run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Moom:

```bash
brew install --cask --quiet moom
```

**Explanation of flags:**
- `--cask`: Indicates this is a macOS application (not a CLI formula)
- `--quiet`: Suppresses non-essential output for non-interactive installation

The installation downloads Moom and installs it to `/Applications/Moom.app`.

#### Verification

Confirm the installation succeeded:

```bash
ls -la "/Applications/Moom.app" && echo "Moom is installed"
```

You can also verify by checking the Homebrew list:

```bash
brew list --cask | grep moom
```

#### Troubleshooting

**Installation fails with permission errors:**

```bash
# Reset Homebrew cask cache and retry
brew cleanup
brew install --cask --quiet moom
```

**Moom fails to open with "cannot be opened" error:**

This occurs when macOS Gatekeeper blocks the application:

```bash
xattr -cr "/Applications/Moom.app"
```

**Moom requires Accessibility permissions:**

On first launch, Moom will request Accessibility permissions. This is required for the application to move and resize windows. Grant access via:

1. Open System Settings (or System Preferences on older macOS)
2. Navigate to Privacy & Security > Accessibility
3. Enable the toggle for Moom

**Moom does not appear in menu bar:**

Moom runs as a menu bar application. If it does not appear:

```bash
# Force quit and relaunch
killall Moom 2>/dev/null
open -a "Moom"
```

**Upgrading from a previous version:**

```bash
brew upgrade --cask moom
```

**Older macOS versions (10.13 - 10.14):**

If you are running macOS 10.13 (High Sierra) or 10.14 (Mojave), you may need to install an older version of Moom. Check the Many Tricks website for version compatibility.

---

### Ubuntu/Debian (APT)

**Moom is NOT available on Ubuntu or Debian.** It is a macOS-only application developed by Many Tricks.

For window management on Ubuntu/Debian, use one of the following alternatives:

#### Alternative: gTile (GNOME Extension)

gTile is a GNOME Shell extension that provides grid-based window tiling similar to Moom's grid feature.

**Prerequisites:**
- Ubuntu 20.04 LTS or later with GNOME desktop
- GNOME Shell Extensions support

**Installation Steps:**

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gnome-shell-extension-manager
```

Then install gTile via the GNOME Extensions website or run:

```bash
# Install gTile via command line
gnome-extensions install gtile@vibou
gnome-extensions enable gtile@vibou
```

**Verification:**

```bash
gnome-extensions list | grep gtile && echo "gTile is installed"
```

#### Alternative: Tiling Window Manager (i3)

For power users who want comprehensive window management, i3 is a popular tiling window manager:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y i3
```

**Note:** Switching to i3 replaces the default GNOME/KDE desktop experience with a keyboard-driven tiling workflow.

---

### Raspberry Pi OS (APT)

**Moom is NOT available on Raspberry Pi OS.** It is a macOS-only application.

For window management on Raspberry Pi OS, the options are limited due to the lightweight desktop environment.

#### Alternative: xfwm4 Window Snapping

Raspberry Pi OS uses the LXDE/LXQt desktop environment by default. The built-in window manager (openbox) has basic window snapping capabilities.

For more advanced tiling, install the i3 window manager:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y i3
```

**Verification:**

```bash
i3 --version
```

**Note on ARM Architecture:** i3 is available pre-compiled for ARM architecture in the Raspberry Pi OS repositories. No special configuration is required.

---

### Amazon Linux/RHEL (YUM/DNF)

**Moom is NOT available on Amazon Linux or RHEL.** It is a macOS-only application.

Amazon Linux and RHEL are primarily server operating systems without desktop environments by default. Window management tools like Moom are not applicable to these platforms in typical server use cases.

#### Installation Steps

**Not applicable.** Window management tools require a graphical desktop environment, which is not standard on Amazon Linux or RHEL servers.

If you have installed a desktop environment (such as GNOME Workstation), you can use GNOME's built-in window tiling features or install i3:

```bash
sudo dnf install -y i3
```

**Verification:**

```bash
i3 --version
```

---

### Windows (Chocolatey/winget)

**Moom is NOT available on Windows.** It is a macOS-only application developed by Many Tricks.

Use **Microsoft PowerToys FancyZones** as the equivalent window management tool for Windows. FancyZones is a free, open-source utility from Microsoft that provides advanced window snapping, custom zones, and multi-monitor support similar to Moom.

#### Prerequisites

- Windows 10 version 1903 or later, or Windows 11
- Administrator PowerShell or Command Prompt
- Chocolatey or winget package manager installed

Verify winget is installed (comes pre-installed on Windows 10/11):

```powershell
winget --version
```

Or verify Chocolatey:

```powershell
choco --version
```

#### Installation Steps

**Install using winget (Recommended):**

Open PowerShell or Command Prompt and run:

```powershell
winget install --id Microsoft.PowerToys --silent --accept-package-agreements --accept-source-agreements
```

**Explanation of flags:**
- `--id Microsoft.PowerToys`: Specifies the exact package identifier
- `--silent`: Suppresses the installer UI completely
- `--accept-package-agreements`: Automatically accepts the package license
- `--accept-source-agreements`: Automatically accepts the source terms

**Install using Chocolatey:**

Open PowerShell or Command Prompt as Administrator and run:

```powershell
choco install powertoys -y
```

**Explanation of flags:**
- `-y`: Automatically confirms all prompts for non-interactive installation

#### Verification

Open a new PowerShell or Command Prompt window (to refresh PATH), then verify:

```powershell
winget list --id Microsoft.PowerToys
```

Or check via Chocolatey:

```powershell
choco list powertoys
```

Verify PowerToys is running:

```powershell
Get-Process PowerToys* -ErrorAction SilentlyContinue | Select-Object Name
```

#### Troubleshooting

**Problem**: FancyZones is not active after installation

**Solution**: Launch PowerToys from the Start menu. FancyZones is a module within PowerToys that must be enabled:

1. Open PowerToys Settings from the system tray
2. Navigate to FancyZones in the left sidebar
3. Enable the "Enable FancyZones" toggle

**Problem**: FancyZones does not snap windows

**Solution**: Hold the Shift key while dragging a window to activate FancyZones snapping (default behavior).

**Problem**: winget installation fails

**Solution**: Update the winget source and retry:

```powershell
winget source update
winget install --id Microsoft.PowerToys --silent --accept-package-agreements --accept-source-agreements
```

---

### WSL (Ubuntu)

**Moom cannot run in WSL.** WSL runs a Linux environment where macOS applications are not compatible.

Window management in WSL is not applicable because WSL GUI applications (via WSLg) are managed by the Windows window manager, not a Linux one.

#### Recommended Approach

For window management needs when using WSL:

1. **Install PowerToys FancyZones on the Windows host** - This will manage all windows including WSLg applications

#### Installation Steps

**Install PowerToys on the Windows host from within WSL:**

```bash
powershell.exe -Command "winget install --id Microsoft.PowerToys --silent --accept-package-agreements --accept-source-agreements"
```

Or using Chocolatey:

```bash
powershell.exe -Command "choco install powertoys -y"
```

#### Verification

Verify PowerToys is installed on the Windows host:

```bash
powershell.exe -Command "winget list --id Microsoft.PowerToys"
```

#### Troubleshooting

**Problem**: PowerShell command fails from WSL

**Solution**: Use the full path to PowerShell:

```bash
/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -Command "winget install --id Microsoft.PowerToys --silent --accept-package-agreements --accept-source-agreements"
```

---

### Git Bash (Manual/Portable)

Git Bash runs within Windows, so use **Microsoft PowerToys FancyZones** for window management. The installation is identical to the Windows (Chocolatey/winget) section.

#### Prerequisites

- Windows 10 version 1903 or later, or Windows 11
- Git Bash installed (comes with Git for Windows)
- winget (pre-installed on Windows 10/11) or Chocolatey installed

#### Installation Steps

**Install via winget from Git Bash:**

```bash
powershell.exe -Command "winget install --id Microsoft.PowerToys --silent --accept-package-agreements --accept-source-agreements"
```

**Install via Chocolatey from Git Bash:**

```bash
powershell.exe -Command "choco install powertoys -y"
```

#### Verification

Verify PowerToys is installed:

```bash
powershell.exe -Command "winget list --id Microsoft.PowerToys"
```

Check if PowerToys is running:

```bash
powershell.exe -Command "Get-Process PowerToys* -ErrorAction SilentlyContinue | Select-Object Name"
```

#### Troubleshooting

**Problem**: PowerShell command not found

**Solution**: Use the full path:

```bash
/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -Command "choco install powertoys -y"
```

**Problem**: Chocolatey not installed

**Solution**: Install Chocolatey first:

```bash
powershell.exe -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
```

---

## Post-Installation Configuration

### macOS (Moom)

After installing Moom on macOS:

1. **Grant Accessibility Permissions**: On first launch, Moom will request Accessibility permissions in System Settings > Privacy & Security > Accessibility. This is required for Moom to control window positions and sizes.

2. **Configure the Pop-Up Palette**: Open Moom preferences to customize what actions appear in the green button pop-up palette. You can add up to 61 separate actions including folders, layouts, and grids.

3. **Set Up Keyboard Shortcuts**: Enable keyboard control in Moom preferences and configure your preferred trigger key combination for keyboard-based window management.

4. **Create Saved Layouts**: If you work with a consistent set of applications, create saved layouts that restore all windows to specific positions. This is especially useful for users who frequently connect and disconnect external displays.

5. **Configure Snap Behavior**: Enable the Snap feature to quickly move windows by dragging them to screen edges. Customize which edges trigger which actions.

6. **License Activation**: Moom costs $15 from the Many Tricks website. The license is valid forever, with updates included for one year. After one year, you can continue using the existing version or upgrade at a reduced price.

### Windows (PowerToys FancyZones)

After installing PowerToys on Windows:

1. **Launch PowerToys**: Open PowerToys from the Start menu. It runs as a system tray application.

2. **Enable FancyZones**: In PowerToys Settings, navigate to FancyZones and ensure it is enabled.

3. **Configure Zones**: Click "Launch layout editor" to create custom zones for your displays. Pre-built templates include columns, rows, grids, and priority grid.

4. **Set Activation Key**: By default, hold Shift while dragging a window to activate FancyZones. You can change this in settings.

5. **Multi-Monitor Setup**: FancyZones supports different layouts per monitor. Configure each display independently.

---

## Common Issues

### macOS-Specific Issues (Moom)

| Issue | Solution |
|-------|----------|
| Moom pop-up does not appear on green button | Grant Accessibility permissions in System Settings > Privacy & Security |
| Windows do not move to correct positions | Ensure the target display is connected; layouts are display-specific |
| Keyboard shortcuts do not work | Enable keyboard control in Moom preferences and set a trigger key |
| Moom not available in Mac App Store | Moom 4 is only available from Many Tricks directly due to sandboxing requirements |
| Moom slows down when many windows open | Reduce the number of actions in the pop-up palette |
| Homebrew cask outdated | Run `brew update && brew upgrade --cask moom` |

### Windows-Specific Issues (PowerToys FancyZones)

| Issue | Solution |
|-------|----------|
| FancyZones does not activate | Ensure PowerToys is running; check the system tray |
| Shift+drag does not show zones | Enable "Hold Shift key to activate zones" in FancyZones settings |
| Zones disappear on monitor reconnect | Re-apply layouts after reconnecting displays |
| PowerToys crashes on startup | Update to the latest version via winget or Chocolatey |

---

## Feature Comparison

| Feature | Moom (macOS) | PowerToys FancyZones (Windows) |
|---------|--------------|-------------------------------|
| Mouse-Based Snapping | Yes (green button pop-up) | Yes (Shift+drag to zones) |
| Keyboard Shortcuts | Yes (comprehensive) | Yes (via PowerToys Run) |
| Custom Grids/Zones | Yes | Yes |
| Saved Layouts | Yes (per display configuration) | Yes (per display configuration) |
| Multi-Monitor Support | Yes | Yes |
| Hover to Move | Yes (modifier key + mouse) | No |
| Price | $15 (one-time) | Free (open source) |

---

## References

### macOS (Moom)

- [Moom Official Website](https://manytricks.com/moom/)
- [Moom Homebrew Cask](https://formulae.brew.sh/cask/moom)
- [Many Tricks Blog - Moom 4 Announcement](https://manytricks.com/blog/?p=6385)
- [Many Tricks Software](https://manytricks.com/)

### Windows (PowerToys FancyZones)

- [Microsoft PowerToys Official Website](https://learn.microsoft.com/en-us/windows/powertoys/)
- [PowerToys GitHub Repository](https://github.com/microsoft/PowerToys)
- [FancyZones Documentation](https://learn.microsoft.com/en-us/windows/powertoys/fancyzones)
- [PowerToys Chocolatey Package](https://community.chocolatey.org/packages/powertoys)

### Linux Alternatives

- [i3 Window Manager](https://i3wm.org/)
- [gTile GNOME Extension](https://extensions.gnome.org/extension/28/gtile/)
