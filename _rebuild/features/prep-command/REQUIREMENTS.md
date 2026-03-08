# Feature: Bootstrap Scripts (`setup.sh` / `setup.ps1`)

## Overview

Bootstrap scripts are standalone shell scripts that prepare a fresh machine for development by installing Node.js and its prerequisites. These scripts live in the repository root and are executed directly from GitHub—before Node.js or DevUtils CLI are available.

**The Problem:** DevUtils CLI requires Node.js, but on a fresh machine Node.js isn't installed. Users need a way to bootstrap their system first.

**The Solution:** A single curl command that downloads and runs the bootstrap script:

```bash
bash -c "$(curl -LsS https://raw.github.com/fredlackey/devutils-cli/main/setup.sh)"
```

After the script completes, DevUtils CLI is installed and ready to use:

```bash
dev setup
```

## Goals

1. Provide a one-liner to bootstrap any supported Unix-like system
2. Detect the operating system and install all required dependencies
3. Install Node Version Manager (nvm) for managing Node.js versions
4. Install Node.js LTS via nvm
5. Install DevUtils CLI globally via npm
6. Ensure the script is completely idempotent—safe to run multiple times
7. Write clear, well-commented code that a junior developer can understand

---

## Critical Requirements

### 1. Idempotency

**The script MUST be idempotent.** Every step must check if the action is needed before executing. Running the script multiple times must produce the same result as running it once, with no errors or duplicated work.

| Step | Check Before Executing |
|------|------------------------|
| Xcode CLI Tools (macOS) | Skip if `xcode-select -p` exits 0 |
| APT packages | Skip if `dpkg -s <package>` shows installed |
| DNF/YUM packages | Skip if `rpm -q <package>` exits 0 |
| nvm | Skip if `$HOME/.nvm` directory exists |
| Node.js | Skip if `nvm ls <version>` shows installed |
| DevUtils CLI | Skip if `command -v dev` exits 0 |

### 2. Step Execution Workflow

**Every step MUST follow a strict 4-phase execution workflow.** The script must not proceed to the next step until the current step is fully verified. This ensures reliability and makes debugging easier when something fails.

**The 4 phases are:**

| Phase | Description | Purpose |
|-------|-------------|---------|
| 1. Check | Determine if the step is needed | Skip unnecessary work (idempotency) |
| 2. Execute | Run the installation or configuration | Perform the actual work |
| 3. Wait | Block until the operation completes | Ensure async operations finish |
| 4. Verify | Confirm the step succeeded | Catch failures before proceeding |

**Why this matters:**

- **Check first** — Prevents redundant work and supports idempotent execution
- **Wait for completion** — Some operations (like `xcode-select --install`) are asynchronous; the script must wait for them to finish
- **Verify before continuing** — Catching a failure immediately is easier to debug than discovering it 3 steps later when something else breaks

**Pattern:** Each installation function must follow this structure:

```bash
install_something() {
  # ─────────────────────────────────────────────────────────────────────────────
  # PHASE 1: CHECK — Is this step needed?
  # ─────────────────────────────────────────────────────────────────────────────
  if something_is_installed; then
    echo "✓ Something is already installed"
    return 0
  fi

  # ─────────────────────────────────────────────────────────────────────────────
  # PHASE 2: EXECUTE — Perform the installation
  # ─────────────────────────────────────────────────────────────────────────────
  echo "Installing something..."
  run_installation_command

  # ─────────────────────────────────────────────────────────────────────────────
  # PHASE 3: WAIT — Block until the operation completes
  # ─────────────────────────────────────────────────────────────────────────────
  # For synchronous commands, this phase is implicit (the command blocks).
  # For asynchronous operations (GUI installers, background processes),
  # explicitly wait or poll until completion:
  wait_for_installation_to_complete

  # ─────────────────────────────────────────────────────────────────────────────
  # PHASE 4: VERIFY — Confirm the step succeeded
  # ─────────────────────────────────────────────────────────────────────────────
  if ! something_is_installed; then
    echo "Error: Something installation failed."
    exit 1
  fi

  echo "✓ Something installed successfully"
}
```

**Real-world example (Xcode Command Line Tools):**

```bash
install_xcode_cli_tools() {
  # PHASE 1: CHECK
  if xcode-select -p &>/dev/null; then
    echo "✓ Xcode Command Line Tools already installed"
    return 0
  fi

  # PHASE 2: EXECUTE
  echo "Installing Xcode Command Line Tools..."
  xcode-select --install

  # PHASE 3: WAIT
  # xcode-select --install triggers a GUI dialog and returns immediately.
  # We must wait for the user to complete the installation.
  echo ""
  echo "A dialog box should appear asking to install the tools."
  echo "Click 'Install' and wait for it to complete."
  echo ""
  read -p "Press Enter after the installation finishes..."

  # PHASE 4: VERIFY
  if ! xcode-select -p &>/dev/null; then
    echo "Error: Xcode Command Line Tools installation failed."
    exit 1
  fi

  echo "✓ Xcode Command Line Tools installed successfully"
}
```

**Real-world example (APT packages):**

```bash
install_apt_packages() {
  local packages="build-essential curl git ca-certificates"

  # PHASE 1: CHECK
  local missing=""
  for pkg in $packages; do
    if ! dpkg -s "$pkg" &>/dev/null; then
      missing="$missing $pkg"
    fi
  done

  if [ -z "$missing" ]; then
    echo "✓ All APT packages already installed"
    return 0
  fi

  # PHASE 2: EXECUTE
  echo "Installing APT packages:$missing"
  $SUDO apt-get update
  $SUDO apt-get install -y $missing

  # PHASE 3: WAIT
  # apt-get install is synchronous — it blocks until complete.
  # No additional waiting needed.

  # PHASE 4: VERIFY
  for pkg in $missing; do
    if ! dpkg -s "$pkg" &>/dev/null; then
      echo "Error: Failed to install package: $pkg"
      exit 1
    fi
  done

  echo "✓ APT packages installed successfully"
}
```

### 3. User Confirmation (Interactive Mode)

**By default, the script MUST prompt the user for confirmation before making changes.** This gives users a chance to review what will be installed and abort if needed.

**Confirmation flow:**

1. Detect the operating system
2. Determine what needs to be installed (skip items already present)
3. Display a summary of planned actions
4. Ask user to confirm before proceeding
5. Only proceed if user confirms

**Example output:**

```
================================================================================
  DevUtils CLI - Bootstrap Script
================================================================================

Detected: macOS 14.2 (Sonoma)

The following will be installed:
  • Xcode Command Line Tools (required for native modules)
  • nvm v0.40.3 (Node Version Manager)
  • Node.js LTS (Long Term Support)
  • DevUtils CLI (this toolkit)

The following are already installed (will be skipped):
  • curl

Do you want to proceed? [y/N]
```

### 4. Non-Interactive Mode (`--no-prompt`)

**The script MUST support a `--no-prompt` flag for automated/scripted execution.** When this flag is provided:

- Skip the confirmation prompt
- Proceed directly with installation
- Useful for CI/CD pipelines, automated provisioning, and scripted setups

**Usage:**

```bash
# Interactive (default) - will prompt for confirmation
./setup.sh

# Non-interactive - no prompts, proceeds automatically
./setup.sh --no-prompt

# Non-interactive via curl
bash -c "$(curl -LsS https://raw.github.com/fredlackey/devutils-cli/main/setup.sh)" -- --no-prompt
```

### 5. Privilege Escalation (sudo)

**The script MUST detect if elevated privileges are required and handle sudo appropriately.** System package installation (apt, dnf, yum) requires root access, but nvm and Node.js should be installed as the normal user.

**Detection logic:**

```bash
# Check if running as root
is_root() {
  [ "$(id -u)" -eq 0 ]
}

# Check if sudo is available and user has sudo privileges
can_sudo() {
  command -v sudo &>/dev/null && sudo -v 2>/dev/null
}
```

**Behavior:**

| Scenario | Action |
|----------|--------|
| Running as root | Proceed without sudo for system packages |
| Running as normal user with sudo access | Use `sudo` for system package commands |
| Running as normal user without sudo | Exit with error and instructions |

**What requires sudo:**

| Operation | Requires sudo |
|-----------|---------------|
| `apt-get install` | Yes |
| `dnf install` | Yes |
| `yum install` | Yes |
| `xcode-select --install` | No (triggers GUI prompt) |
| nvm installation | No (installs to `~/.nvm`) |
| Node.js via nvm | No (installs to `~/.nvm`) |

**Implementation pattern:**

```bash
# Early in script: verify sudo access if needed
check_sudo_access() {
  if is_root; then
    SUDO=""
    return 0
  fi

  if can_sudo; then
    SUDO="sudo"
    # Prompt for password early to avoid mid-script prompts
    echo "This script requires sudo access to install system packages."
    sudo -v || {
      echo "Error: Failed to obtain sudo access."
      exit 1
    }
    return 0
  fi

  echo "Error: This script requires sudo access to install system packages."
  echo ""
  echo "Please either:"
  echo "  1. Run this script with sudo: sudo ./setup.sh"
  echo "  2. Ensure your user has sudo privileges"
  exit 1
}

# Usage in package installation
install_apt_packages() {
  $SUDO apt-get update
  $SUDO apt-get install -y build-essential curl git ca-certificates
}
```

**Important:** The script should request sudo credentials early (during confirmation phase) rather than mid-installation. This provides a better user experience and ensures the script won't hang waiting for a password in the middle of execution.

---

## Scope

### Phase 1: `setup.sh` (Bash)

Location: `/setup.sh` (repository root)

Supported platforms:
- macOS
- Ubuntu / Debian
- Raspberry Pi OS (Raspbian)
- Amazon Linux 2 / Amazon Linux 2023
- RHEL / Rocky Linux / AlmaLinux
- Fedora

### Phase 2: `setup.ps1` (PowerShell) — Future

Location: `/setup.ps1` (repository root)

Supported platforms:
- Windows 10 / 11
- Windows Server 2019+

> **Note:** PowerShell script is documented here for reference but will be implemented in a future phase.

---

## Script: `setup.sh`

### Location

```
devutils-cli/
├── setup.sh              ← Bootstrap script (this feature)
├── setup.ps1             ← PowerShell bootstrap (future)
├── package.json
├── src/
│   └── ...
└── ...
```

### Invocation

```bash
# Primary method: Run directly from GitHub
bash -c "$(curl -LsS https://raw.github.com/fredlackey/devutils-cli/main/setup.sh)"

# Alternative: Download first, then run
curl -LsS https://raw.github.com/fredlackey/devutils-cli/main/setup.sh -o setup.sh
chmod +x setup.sh
./setup.sh

# Non-interactive (for CI/CD or scripted use)
bash -c "$(curl -LsS https://raw.github.com/fredlackey/devutils-cli/main/setup.sh)" -- --no-prompt
```

### Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--no-prompt` | Skip confirmation prompt, proceed automatically (for scripted/CI use) | `false` |
| `--skip-node` | Install nvm but skip Node.js installation | `false` |
| `--dry-run` | Print what would be done without making changes | `false` |
| `--verbose` | Enable verbose output for debugging | `false` |
| `--help` | Display usage information | - |

---

## OS Detection

The script must detect the operating system to install the correct dependencies.

### Detection Logic

```bash
# Step 1: Detect kernel/platform
PLATFORM="$(uname -s)"  # Darwin, Linux

# Step 2: For Linux, detect distribution from /etc/os-release
if [ -f /etc/os-release ]; then
  . /etc/os-release
  DISTRO="$ID"              # ubuntu, debian, raspbian, amzn, rhel, fedora, rocky, almalinux
  DISTRO_VERSION="$VERSION_ID"
fi
```

### Supported Platforms

| Platform | Detection | Package Manager |
|----------|-----------|-----------------|
| macOS | `uname -s` = "Darwin" | Homebrew (installed if missing) |
| Ubuntu | `ID` = "ubuntu" | APT |
| Debian | `ID` = "debian" | APT |
| Raspberry Pi OS | `ID` = "raspbian" | APT |
| Amazon Linux 2023 | `ID` = "amzn", `VERSION_ID` >= "2023" | DNF |
| Amazon Linux 2 | `ID` = "amzn", `VERSION_ID` = "2" | YUM |
| RHEL 9+ | `ID` = "rhel", `VERSION_ID` >= "9" | DNF |
| RHEL 7-8 | `ID` = "rhel", `VERSION_ID` < "9" | YUM |
| Rocky Linux | `ID` = "rocky" | DNF |
| AlmaLinux | `ID` = "almalinux" | DNF |
| Fedora | `ID` = "fedora" | DNF |
| CentOS Stream | `ID` = "centos" | DNF |

### Unsupported Platform Handling

If the script cannot detect a supported platform, it should exit with a clear message:

```
Error: Unsupported operating system.

This script supports:
  - macOS
  - Ubuntu / Debian
  - Raspberry Pi OS
  - Amazon Linux
  - RHEL / Rocky Linux / AlmaLinux / Fedora

For Windows, download and run setup.ps1 instead:
  https://raw.github.com/fredlackey/devutils-cli/main/setup.ps1

Detected: Linux (unknown distribution)
```

---

## OS-Specific Dependencies

### macOS

**Xcode Command Line Tools** — Required. Provides `git`, `make`, `clang`, and other build tools needed for native Node.js modules.

```bash
# Check if already installed
if xcode-select -p &>/dev/null; then
  echo "✓ Xcode Command Line Tools already installed"
else
  echo "Installing Xcode Command Line Tools..."
  xcode-select --install

  # Wait for user to complete the GUI installation
  echo ""
  echo "A dialog box should appear asking to install the tools."
  echo "Click 'Install' and wait for it to complete."
  echo ""
  read -p "Press Enter after the installation finishes..."

  # Verify installation succeeded
  if ! xcode-select -p &>/dev/null; then
    echo "Error: Xcode Command Line Tools installation failed."
    exit 1
  fi
fi
```

**Note:** On macOS, curl is pre-installed, so no additional packages are needed beyond Xcode CLI Tools.

### Ubuntu / Debian / Raspberry Pi OS

**Required packages:**

| Package | Purpose |
|---------|---------|
| `build-essential` | Compiler toolchain (gcc, g++, make) for native modules |
| `curl` | Download nvm installation script |
| `git` | Version control, used by nvm |
| `ca-certificates` | SSL certificate verification |

```bash
echo "Installing dependencies via apt..."
sudo apt-get update
sudo apt-get install -y build-essential curl git ca-certificates
```

### Amazon Linux 2023 / RHEL 9+ / Fedora / Rocky / AlmaLinux

**Required packages:**

| Package/Group | Purpose |
|---------------|---------|
| "Development Tools" | Compiler toolchain (gcc, g++, make) |
| `curl` | Download nvm installation script |
| `git` | Version control, used by nvm |
| `ca-certificates` | SSL certificate verification |

```bash
echo "Installing dependencies via dnf..."
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y curl git ca-certificates
```

### Amazon Linux 2 / RHEL 7-8 / CentOS 7

**Required packages:** Same as above, but using YUM.

```bash
echo "Installing dependencies via yum..."
sudo yum groupinstall -y "Development Tools"
sudo yum install -y curl git ca-certificates
```

---

## nvm Installation

The script installs [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm) to manage Node.js versions.

### Why nvm?

1. **No sudo required** — Installs to user's home directory (`~/.nvm`)
2. **Version flexibility** — Easily switch Node.js versions per project
3. **Clean uninstall** — Remove `~/.nvm` directory to uninstall completely
4. **Industry standard** — Widely used, well-documented, actively maintained

### Installation

```bash
# Pin to a specific version for reproducibility
NVM_VERSION="v0.40.3"

# Check if nvm is already installed
if [ -d "$HOME/.nvm" ]; then
  echo "✓ nvm is already installed"
else
  echo "Installing nvm ${NVM_VERSION}..."
  curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
fi

# Load nvm into current shell session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Verify nvm is available
if ! command -v nvm &>/dev/null; then
  echo "Error: nvm installation failed."
  exit 1
fi
```

### Shell Configuration

The nvm install script automatically adds these lines to the user's shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

---

## Node.js Installation

After nvm is installed, the script installs the current **LTS (Long Term Support)** version of Node.js. The LTS version is always used to ensure stability and long-term support.

```bash
echo "Installing Node.js LTS..."
nvm install --lts
nvm alias default 'lts/*'

# Verify installation
echo ""
echo "Verifying installation..."
echo "  Node.js: $(node --version)"
echo "  npm:     $(npm --version)"
```

**Why LTS?**
- LTS versions receive security updates and bug fixes for 30 months
- Recommended for production use and most development workflows
- Provides a stable, well-tested foundation for DevUtils CLI

---

## DevUtils CLI Installation

After Node.js is installed, the script installs DevUtils CLI globally as the final step.

```bash
# Check if DevUtils CLI is already installed
if command -v dev &>/dev/null; then
  echo "✓ DevUtils CLI is already installed"
else
  echo "Installing DevUtils CLI..."
  npm install -g @fredlackey/devutils

  # Verify installation
  if ! command -v dev &>/dev/null; then
    echo "Error: DevUtils CLI installation failed."
    exit 6
  fi

  echo "✓ DevUtils CLI installed successfully"
fi
```

**Why install automatically?**
- Completes the bootstrap in a single command—no additional steps required
- Users can immediately run `dev setup` after the script finishes
- The `dev` command becomes available in the current shell session

---

## Output Format

The script should provide clear, user-friendly output:

```
================================================================================
  DevUtils CLI - Bootstrap Script
================================================================================

Detecting operating system...
  → macOS 14.2 (Sonoma)

Step 1: Installing OS dependencies
  ✓ Xcode Command Line Tools already installed

Step 2: Installing nvm (Node Version Manager)
  → Installing nvm v0.40.3...
  ✓ nvm installed successfully

Step 3: Installing Node.js
  → Installing Node.js LTS...
  ✓ Node.js v20.11.0 installed
  ✓ npm v10.2.4 installed

Step 4: Installing DevUtils CLI
  → Installing @fredlackey/devutils...
  ✓ DevUtils CLI installed successfully

================================================================================
  Bootstrap Complete!
================================================================================

DevUtils CLI is ready to use. Run:
  dev setup
```

---

## Error Handling

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Unsupported operating system |
| 2 | Missing required tool (curl) |
| 3 | Dependency installation failed |
| 4 | nvm installation failed |
| 5 | Node.js installation failed |
| 6 | DevUtils CLI installation failed |

### Error Messages

Error messages must be clear and actionable:

```bash
# Example: sudo not available
if [ "$(id -u)" -ne 0 ] && ! sudo -v 2>/dev/null; then
  echo "Error: This script requires sudo access to install system packages."
  echo ""
  echo "Please either:"
  echo "  1. Run this script as root, OR"
  echo "  2. Ensure your user has sudo privileges"
  exit 2
fi

# Example: curl not available (rare, but possible)
if ! command_exists curl; then
  echo "Error: curl is required but not installed."
  echo ""
  echo "Please install curl first:"
  echo "  macOS:  Should be pre-installed"
  echo "  Ubuntu: sudo apt-get install curl"
  echo "  RHEL:   sudo yum install curl"
  exit 2
fi
```

---

## Script: `setup.ps1` (PowerShell) — Future Phase

> **Note:** This section documents the planned PowerShell script for Windows. Implementation is deferred to Phase 2.

### Invocation

```powershell
# Run directly from GitHub
iex (iwr -useb https://raw.github.com/fredlackey/devutils-cli/main/setup.ps1)

# Or download first
Invoke-WebRequest -Uri https://raw.github.com/fredlackey/devutils-cli/main/setup.ps1 -OutFile setup.ps1
.\setup.ps1
```

### Windows Dependencies

| Dependency | Purpose | Installation |
|------------|---------|--------------|
| Visual Studio Build Tools | Native module compilation | winget / manual |
| Git for Windows | Version control | winget |
| nvm-windows | Node.js version management | GitHub release |

### Key Differences from Bash Script

1. Uses **nvm-windows** (separate project from Unix nvm)
2. Requires **Visual Studio Build Tools** instead of Xcode/build-essential
3. Modifies **Windows PATH** via registry or setx
4. Must handle **execution policy** restrictions

---

## Security Considerations

1. **HTTPS only** — All downloads use HTTPS
2. **Pinned versions** — nvm version is pinned, not "latest"
3. **Minimal sudo** — Only use sudo for package installation, not nvm/node
4. **No secrets** — Script contains no credentials or sensitive data
5. **Reviewable** — Users can download and inspect before running

---

## Testing Requirements

### Manual Testing Matrix

| OS | Version | Required |
|----|---------|----------|
| macOS | Sonoma (14.x) | Yes |
| macOS | Ventura (13.x) | Yes |
| Ubuntu | 24.04 LTS | Yes |
| Ubuntu | 22.04 LTS | Yes |
| Debian | 12 (Bookworm) | Yes |
| Raspberry Pi OS | Bookworm (64-bit) | Yes |
| Amazon Linux | 2023 | Yes |
| Amazon Linux | 2 | Yes |
| Fedora | 40+ | Nice to have |
| Rocky Linux | 9 | Nice to have |

### Test Scenarios

1. **Fresh install** — Run on clean system with no Node.js
2. **Idempotent run** — Run twice, verify no errors on second run
3. **Partial state** — nvm installed but no Node.js
4. **Partial state** — Node.js installed but no DevUtils CLI
5. **Dry run** — Verify `--dry-run` makes no changes
6. **Interactive mode** — Run without `--no-prompt`, verify confirmation prompt appears
7. **Non-interactive mode** — Run with `--no-prompt`, verify no prompts and installation proceeds
8. **User cancellation** — Run interactively, answer "n" to confirmation, verify script exits cleanly
9. **Sudo access** — Run as normal user with sudo, verify password prompt appears early
10. **No sudo access** — Run as normal user without sudo, verify helpful error message
11. **Run as root** — Run with `sudo ./setup.sh`, verify script works without additional prompts
12. **Skip node** — Run with `--skip-node`, verify nvm installed but Node.js and DevUtils CLI not installed
13. **DevUtils CLI available** — After completion, verify `dev --version` works in current shell

---

## Implementation Checklist

### Phase 1: setup.sh

- [ ] Create `/setup.sh` in repository root
- [ ] Add shebang and script header with usage documentation
- [ ] Implement command-line argument parsing (including `--no-prompt`)
- [ ] Implement OS detection (platform and distribution)
- [ ] Implement privilege detection (root vs. normal user)
- [ ] Implement sudo access verification (early password prompt)
- [ ] Implement pre-flight checks (determine what needs to be installed)
- [ ] Implement user confirmation prompt (interactive mode)
- [ ] Implement `--no-prompt` mode (skip confirmation)
- [ ] Implement macOS: Xcode CLI Tools installation (with idempotency check)
- [ ] Implement Ubuntu/Debian/Raspbian: apt package installation (with idempotency check)
- [ ] Implement Amazon Linux 2023/Fedora/RHEL 9+: dnf package installation (with idempotency check)
- [ ] Implement Amazon Linux 2/RHEL 7-8: yum package installation (with idempotency check)
- [ ] Implement nvm installation with version pinning (with idempotency check)
- [ ] Implement Node.js installation via nvm (with idempotency check)
- [ ] Implement DevUtils CLI installation via npm (with idempotency check)
- [ ] Implement `--dry-run` mode
- [ ] Implement `--verbose` mode
- [ ] Verify all operations have idempotency checks
- [ ] Add clear output formatting with status indicators
- [ ] Add error handling with helpful messages
- [ ] Test on all required platforms
- [ ] Update README.md with bootstrap instructions

### Phase 2: setup.ps1 (Future)

- [ ] Create `/setup.ps1` in repository root
- [ ] Research nvm-windows installation process
- [ ] Implement Windows version detection
- [ ] Implement Visual Studio Build Tools installation
- [ ] Implement Git for Windows installation
- [ ] Implement nvm-windows installation
- [ ] Implement Node.js installation via nvm-windows
- [ ] Handle execution policy restrictions
- [ ] Test on Windows 10 and Windows 11

---

## References

### External

- [nvm - Node Version Manager](https://github.com/nvm-sh/nvm)
- [nvm-windows](https://github.com/coreybutler/nvm-windows)
- [Xcode Command Line Tools](https://developer.apple.com/xcode/resources/)
- [Node.js Release Schedule](https://nodejs.org/en/about/releases/)

### Project Files

- README.md — Update with bootstrap instructions after implementation
- CLAUDE.md — Project patterns and conventions
