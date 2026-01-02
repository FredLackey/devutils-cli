# Utils Reference

This document outlines the utility functions needed to support cross-platform application installation (using VS Code as a reference example). These utilities live in `src/utils/` and are organized into common utilities and OS-specific subfolders.

## Important: Platform-Agnostic Utilities vs Platform-Specific Commands

The utilities in `src/utils/common/` (such as `shell.js`) are **platform-agnostic at the utility level** — they use Node.js APIs like `child_process` that work identically on all operating systems.

However, there is a critical distinction:

- **The utility functions themselves** are cross-platform (e.g., `exec()`, `which()`)
- **The commands passed to them** are often platform-specific (e.g., `ls` vs `dir`)

For example, `shell.exec('brew install node')` uses a universal utility to execute a macOS-specific command. This is why OS-specific utilities exist — `macos/brew.js` knows to call Homebrew commands, while `windows/choco.js` knows to call Chocolatey commands.

Functions like `which()` and `commandExists()` should be implemented in pure Node.js (iterating through `process.env.PATH` and checking file existence) rather than shelling out to the Unix `which` command, which does not exist on Windows.

---

## Installation Flow Analysis

Before defining utilities, consider what happens when installing VS Code on each platform:

### macOS Flow
1. Detect OS → macOS
2. Check if Homebrew is available
3. Check if VS Code is already installed
4. Install via `brew install --cask visual-studio-code`

### Ubuntu Flow
1. Detect OS → Ubuntu/Debian
2. Verify a desktop environment exists (VS Code requires GUI)
3. Determine available package manager (apt vs snap)
4. If apt: add Microsoft repository, import GPG key, update sources, install
5. If snap: install via snap with classic confinement
6. Check if VS Code is already installed

### Windows Flow
1. Detect OS → Windows
2. Detect shell environment (PowerShell vs CMD)
3. Verify administrator privileges
4. Determine available package manager (winget vs chocolatey)
5. Install via appropriate package manager
6. Check if VS Code is already installed

---

## Common Utilities (`src/utils/common/`)

These utilities work cross-platform and provide foundational functionality.

### `os.js` — Operating System Detection

| Function | Description |
|----------|-------------|
| `detect()` | Returns an object with `type` (macos, ubuntu, windows, etc.) and `packageManager` (brew, apt, choco, etc.) |
| `isWindows()` | Returns true if running on Windows (native, not WSL) |
| `isMacOS()` | Returns true if running on macOS |
| `isLinux()` | Returns true if running on any Linux distribution |
| `isWSL()` | Returns true if running inside Windows Subsystem for Linux |
| `getArch()` | Returns CPU architecture (x64, arm64, etc.) |
| `getDistro()` | For Linux, returns specific distribution name (ubuntu, debian, fedora, etc.) |

### `shell.js` — Shell Command Execution

| Function | Description |
|----------|-------------|
| `exec(command, options)` | Async execution of shell command; returns stdout, stderr, exit code |
| `execSync(command, options)` | Synchronous execution; returns stdout as string |
| `which(executable)` | Locates an executable in PATH; returns full path or null |
| `commandExists(command)` | Returns true if command is available in PATH |

### `network.js` — Network Connectivity

| Function | Description |
|----------|-------------|
| `isOnline()` | Checks if machine has internet connectivity |
| `canReach(hostname)` | Tests if a specific hostname is reachable |

### `privileges.js` — Permission and Elevation Checking

| Function | Description |
|----------|-------------|
| `isElevated()` | Returns true if running with elevated privileges (root on Unix, admin on Windows) |
| `requiresElevation(operation)` | Determines if a given operation type requires elevation |

### `display.js` — Display and GUI Detection

| Function | Description |
|----------|-------------|
| `hasDisplay()` | Returns true if a display server (X11, Wayland, or Windows desktop) is available |
| `isHeadless()` | Returns true if running in a headless/server environment with no GUI |

### `apps.js` — Generic Application Detection

| Function | Description |
|----------|-------------|
| `isInstalled(appName)` | Cross-platform check if an application is installed; delegates to OS-specific implementations |
| `getVersion(appName)` | Retrieves installed version of an application |
| `getInstallPath(appName)` | Returns the installation path of an application |

### `package-manager.js` — Package Manager Abstraction

| Function | Description |
|----------|-------------|
| `getAvailable()` | Returns list of available package managers on current system |
| `getPreferred()` | Returns the preferred/recommended package manager for current platform |
| `install(packageName, options)` | Installs a package using the best available package manager |

---

## macOS Utilities (`src/utils/macos/`)

### `brew.js` — Homebrew Package Manager

| Function | Description |
|----------|-------------|
| `isInstalled()` | Returns true if Homebrew is installed and functional |
| `getVersion()` | Returns installed Homebrew version |
| `install(formula)` | Installs a Homebrew formula (CLI tool) |
| `installCask(cask)` | Installs a Homebrew cask (GUI application) |
| `uninstall(formula)` | Removes a Homebrew formula |
| `uninstallCask(cask)` | Removes a Homebrew cask |
| `isFormulaInstalled(formula)` | Checks if a specific formula is installed |
| `isCaskInstalled(cask)` | Checks if a specific cask is installed |
| `update()` | Updates Homebrew itself and package lists |
| `upgrade(formula)` | Upgrades a specific formula or all outdated formulas |
| `tap(repository)` | Adds a third-party Homebrew tap |
| `search(query)` | Searches for formulas/casks matching query |

### `apps.js` — macOS Application Detection

| Function | Description |
|----------|-------------|
| `isAppInstalled(appName)` | Checks if app exists in /Applications or ~/Applications |
| `getAppBundlePath(appName)` | Returns full path to .app bundle |
| `getAppVersion(appName)` | Reads version from app's Info.plist |
| `listInstalledApps()` | Returns list of installed GUI applications |

---

## Ubuntu Utilities (`src/utils/ubuntu/`)

### `apt.js` — APT Package Manager

| Function | Description |
|----------|-------------|
| `isInstalled()` | Returns true if apt is available |
| `install(package)` | Installs a package via apt-get |
| `remove(package)` | Removes an installed package |
| `update()` | Runs apt-get update to refresh package lists |
| `upgrade(package)` | Upgrades a specific package or all packages |
| `isPackageInstalled(package)` | Queries dpkg to check if package is installed |
| `getPackageVersion(package)` | Returns installed version of a package |
| `addRepository(repo)` | Adds an APT repository to sources |
| `removeRepository(repo)` | Removes an APT repository |
| `addKey(keyUrl)` | Imports a GPG key for package verification |
| `addKeyFromKeyserver(keyId, keyserver)` | Imports a GPG key from a keyserver |
| `search(query)` | Searches apt cache for packages |

### `snap.js` — Snap Package Manager

| Function | Description |
|----------|-------------|
| `isInstalled()` | Returns true if snapd is installed and running |
| `install(snap, options)` | Installs a snap package; options include classic confinement |
| `remove(snap)` | Removes an installed snap |
| `isSnapInstalled(snap)` | Checks if a specific snap is installed |
| `getSnapVersion(snap)` | Returns installed version of a snap |
| `refresh(snap)` | Updates a snap to latest version |
| `list()` | Lists all installed snaps |

### `desktop.js` — Desktop Environment Detection

These functions address a Linux-specific concern: Linux has multiple display servers (X11, Wayland) and desktop environments (GNOME, KDE, XFCE, etc.). macOS always uses Aqua/Quartz, and Windows always uses the Windows Desktop — no detection needed.

| Function | Description |
|----------|-------------|
| `hasDesktop()` | Returns true if a desktop environment is installed and running |
| `getDesktopEnvironment()` | Returns desktop name (gnome, kde, xfce, etc.) |
| `getDisplayServer()` | Returns display server type (x11, wayland) |
| `isX11()` | Returns true if running under X11 |
| `isWayland()` | Returns true if running under Wayland |
| `getDisplayVariable()` | Returns the DISPLAY or WAYLAND_DISPLAY environment value |

Note: For basic "is a GUI available" checks, use `common/display.js` instead.

### `systemd.js` — Systemd Service Management

| Function | Description |
|----------|-------------|
| `isServiceRunning(service)` | Checks if a systemd service is active |
| `startService(service)` | Starts a systemd service |
| `enableService(service)` | Enables a service to start on boot |
| `isSystemdAvailable()` | Returns true if systemd is the init system |

---

## Windows Utilities (`src/utils/windows/`)

### `choco.js` — Chocolatey Package Manager

| Function | Description |
|----------|-------------|
| `isInstalled()` | Returns true if Chocolatey is installed |
| `getVersion()` | Returns installed Chocolatey version |
| `install(package)` | Installs a Chocolatey package |
| `uninstall(package)` | Removes a Chocolatey package |
| `isPackageInstalled(package)` | Checks if a package is installed via Chocolatey |
| `getPackageVersion(package)` | Returns installed version of a package |
| `upgrade(package)` | Upgrades a package or all packages |
| `search(query)` | Searches Chocolatey repository |

### `winget.js` — Windows Package Manager (winget)

| Function | Description |
|----------|-------------|
| `isInstalled()` | Returns true if winget is available |
| `getVersion()` | Returns installed winget version |
| `install(package)` | Installs a package via winget |
| `uninstall(package)` | Removes a package via winget |
| `isPackageInstalled(package)` | Checks if a package is installed |
| `getPackageVersion(package)` | Returns installed version of a package |
| `upgrade(package)` | Upgrades a package |
| `search(query)` | Searches winget repository |
| `list()` | Lists installed packages |

### `shell.js` — Windows Shell Environment Detection

These functions address a Windows-specific concern: CMD and PowerShell have fundamentally different syntax and capabilities. Unix shells (bash, zsh, sh) are interchangeable for command execution purposes.

| Function | Description |
|----------|-------------|
| `isPowerShell()` | Returns true if running inside PowerShell |
| `isCmd()` | Returns true if running inside CMD |
| `isWindowsTerminal()` | Returns true if running inside Windows Terminal |
| `getPowerShellVersion()` | Returns PowerShell version (5.x or 7.x) |
| `getShellName()` | Returns current shell name (powershell, pwsh, cmd) |

Note: For admin/elevation checking, use `common/privileges.js` instead.

### `registry.js` — Windows Registry Access

| Function | Description |
|----------|-------------|
| `isAppInstalled(appName)` | Checks Windows registry uninstall keys for application |
| `getInstallPath(appName)` | Retrieves installation path from registry |
| `getAppVersion(appName)` | Retrieves version from registry |
| `keyExists(path)` | Checks if a registry key exists |
| `getValue(path, valueName)` | Reads a value from the registry |

### `env.js` — Windows Environment Variables

| Function | Description |
|----------|-------------|
| `getPath()` | Returns system PATH as array |
| `addToPath(directory)` | Adds a directory to user PATH |
| `removeFromPath(directory)` | Removes a directory from user PATH |
| `get(varName)` | Gets an environment variable value |
| `set(varName, value)` | Sets a user environment variable |

---

## Package Manager Selection Strategy

When multiple package managers are available, install scripts should follow these guidelines to choose the best option.

### macOS

**Homebrew is the only option.** Use `brew install` for CLI tools (formulas) and `brew install --cask` for GUI applications (casks).

### Ubuntu/Debian

APT and Snap serve different purposes:

| Aspect | APT | Snap |
|--------|-----|------|
| Package size | Smaller (shared libraries) | Larger (self-contained) |
| Startup time | Faster | Slower (especially first launch) |
| Package freshness | Tied to Ubuntu release cycle | Usually latest stable |
| Updates | Manual via apt upgrade | Automatic in background |
| Sandboxing | None (full system access) | Sandboxed (may cause permission issues) |
| System integration | Native | Isolated |

**Selection guidelines:**

1. **Prefer APT when a vendor provides an official repository**
   - VS Code → Add Microsoft's apt repository
   - Docker → Add Docker's official repository
   - Chrome → Add Google's repository
   - These repos provide the latest versions with proper system integration

2. **Prefer Snap when APT version is significantly outdated and no vendor repo exists**
   - NeoVim → Snap has latest; APT version often old
   - Some developer tools without official repos

3. **Prefer neither when better alternatives exist**
   - Node.js → Use nvm (version manager)
   - Rust → Use rustup
   - Python → Use pyenv
   - Go → Use official tarball or goenv

4. **Consider the application type**
   - CLI tools: APT preferred (faster, simpler)
   - GUI apps: Either works, but Snap sandboxing may cause file access issues

### Windows

Winget and Chocolatey have different strengths:

| Aspect | Winget | Chocolatey |
|--------|--------|------------|
| Built-in | Yes (Windows 10/11) | No (requires install) |
| Package count | Growing | Larger, more mature |
| Corporate use | Microsoft-supported | Community-driven |
| Silent install | Native | Native |

**Selection guidelines:**

1. **Prefer Winget when available** — it's built into modern Windows and Microsoft-supported
2. **Fall back to Chocolatey** when:
   - Winget is not available (older Windows)
   - Package doesn't exist in Winget
   - Chocolatey package is better maintained

3. **Prefer neither when better alternatives exist**
   - Node.js → Use nvm-windows
   - Rust → Use rustup
   - Python → Use pyenv-win

### Version Managers vs Package Managers

For language runtimes, version managers are often preferable:

| Tool | Instead of Package Manager | Reason |
|------|---------------------------|--------|
| nvm / nvm-windows | Node.js via brew/apt/choco | Multiple Node versions per project |
| rustup | Rust via package manager | Official installer, toolchain management |
| pyenv / pyenv-win | Python via package manager | Multiple Python versions, avoids system Python |
| goenv | Go via package manager | Multiple Go versions |
| rbenv / rvm | Ruby via package manager | Multiple Ruby versions |

Install scripts should detect if a version manager is already in use and respect it rather than installing via package manager.

---

## Summary by Category

### Detection Utilities
| Concern | Common | OS-Specific | Rationale |
|---------|--------|-------------|-----------|
| OS Type | `os.js` | — | Node.js `process.platform` works everywhere |
| Architecture | `os.js` | — | Node.js `process.arch` works everywhere |
| Privileges | `privileges.js` | — | `isElevated()` checks root (Unix) or admin (Windows) internally |
| GUI Available | `display.js` | — | `hasDisplay()` checks for any display server |
| Desktop Environment | — | `ubuntu/desktop.js` | Linux-only: X11 vs Wayland, GNOME vs KDE, etc. (macOS/Windows have single desktop systems) |
| Shell Type | — | `windows/shell.js` | Windows-only: CMD vs PowerShell have fundamentally different syntax (Unix shells are interchangeable for our purposes) |

### Package Manager Utilities
| Platform | Primary | Secondary |
|----------|---------|-----------|
| macOS | `brew.js` | — |
| Ubuntu | `apt.js` | `snap.js` |
| Windows | `winget.js` | `choco.js` |

### Application Detection Utilities
| Platform | Utility | Method |
|----------|---------|--------|
| Common | `apps.js` | Delegates to OS-specific |
| macOS | `apps.js` | Checks /Applications folder |
| Ubuntu | `apt.js`, `snap.js` | Queries dpkg/snap |
| Windows | `registry.js` | Queries uninstall registry keys |

---

## Usage Pattern

When an install script (e.g., `src/installs/vscode.js`) runs:

1. **Detect platform** via `common/os.js`
2. **Check prerequisites** using OS-specific utilities:
   - macOS: Homebrew availability via `macos/brew.js`
   - Ubuntu: Desktop environment via `ubuntu/desktop.js`
   - Windows: Admin privileges via `windows/shell.js`
3. **Check if already installed** using appropriate detection utility
4. **Install** using the platform's package manager utility
5. **Verify installation** succeeded

This layered approach keeps install scripts clean while utilities handle platform-specific complexity.
