# Development Plan: `setup.sh` Bootstrap Script

This document provides a step-by-step implementation plan for building the `setup.sh` bootstrap script. Follow these steps in order. Each step builds on the previous one.

> **For Junior Developers:** This plan is designed to be followed sequentially. Complete each step fully before moving to the next. If you get stuck, re-read the step and check the REQUIREMENTS.md file for additional context.

---

## Table of Contents

1. [Prerequisites](#step-1-prerequisites)
2. [Create the Script File](#step-2-create-the-script-file)
3. [Add Script Header and Usage](#step-3-add-script-header-and-usage)
4. [Implement Utility Functions](#step-4-implement-utility-functions)
5. [Implement Command-Line Argument Parsing](#step-5-implement-command-line-argument-parsing)
6. [Implement OS Detection](#step-6-implement-os-detection)
7. [Implement Privilege Detection](#step-7-implement-privilege-detection)
8. [Implement Pre-Flight Checks](#step-8-implement-pre-flight-checks)
9. [Implement User Confirmation Prompt](#step-9-implement-user-confirmation-prompt)
10. [Implement macOS: Xcode CLI Tools Installation](#step-10-implement-macos-xcode-cli-tools-installation)
11. [Implement APT Package Installation](#step-11-implement-apt-package-installation)
12. [Implement DNF Package Installation](#step-12-implement-dnf-package-installation)
13. [Implement YUM Package Installation](#step-13-implement-yum-package-installation)
14. [Implement nvm Installation](#step-14-implement-nvm-installation)
15. [Implement Node.js Installation](#step-15-implement-nodejs-installation)
16. [Implement DevUtils CLI Installation](#step-16-implement-devutils-cli-installation)
17. [Implement Main Function](#step-17-implement-main-function)
18. [Testing](#step-18-testing)

---

## Step 1: Prerequisites

**Goal:** Understand what you're building and why.

### What to Do

1. Read `features/prep-command/REQUIREMENTS.md` completely
2. Understand the 4-phase execution workflow (Check → Execute → Wait → Verify)
3. Understand what "idempotent" means: running the script twice produces the same result as running it once

### Key Concepts

| Concept | Meaning |
|---------|---------|
| Bootstrap | Prepare a system from scratch before the main tool can be installed |
| Idempotent | Safe to run multiple times without causing errors or duplicating work |
| LTS | Long Term Support — stable Node.js versions with extended support |
| nvm | Node Version Manager — manages multiple Node.js versions |

### Files You'll Reference

- `features/prep-command/REQUIREMENTS.md` — Full requirements specification
- `CLAUDE.md` — Project coding standards

---

## Step 2: Create the Script File

**Goal:** Create the script file with proper permissions.

### What to Do

1. Create a new file at the repository root: `setup.sh`
2. Make it executable

### Commands

```bash
# From the repository root
touch setup.sh
chmod +x setup.sh
```

### Verification

```bash
# Should show executable permissions (x)
ls -la setup.sh
# Expected output includes: -rwxr-xr-x
```

---

## Step 3: Add Script Header and Usage

**Goal:** Set up the script shell, strict mode, and help text.

### What to Do

Add the following to `setup.sh`:

```bash
#!/usr/bin/env bash
#
# setup.sh — Bootstrap script for DevUtils CLI
#
# This script prepares a fresh machine for development by installing:
#   - OS-specific build tools (Xcode CLI Tools, build-essential, etc.)
#   - nvm (Node Version Manager)
#   - Node.js LTS
#   - DevUtils CLI
#
# Usage:
#   ./setup.sh              # Interactive mode (prompts for confirmation)
#   ./setup.sh --no-prompt  # Non-interactive mode (no prompts)
#   ./setup.sh --dry-run    # Show what would be done without making changes
#   ./setup.sh --help       # Show this help message
#
# After running this script, DevUtils CLI is ready to use:
#   dev setup
#

# ─────────────────────────────────────────────────────────────────────────────
# STRICT MODE
# ─────────────────────────────────────────────────────────────────────────────
# These settings make the script fail fast on errors instead of continuing
# with unexpected state.
#
#   -e  Exit immediately if any command exits with a non-zero status
#   -u  Treat unset variables as an error
#   -o pipefail  Return the exit status of the last command in a pipeline that failed
#
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# SCRIPT VERSION
# ─────────────────────────────────────────────────────────────────────────────
SCRIPT_VERSION="1.0.0"

# ─────────────────────────────────────────────────────────────────────────────
# DEFAULT CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────
# These can be overridden by command-line arguments
NO_PROMPT=false       # If true, skip confirmation prompts
SKIP_NODE=false       # If true, install nvm but not Node.js
DRY_RUN=false         # If true, show what would be done without doing it
VERBOSE=false         # If true, show detailed output

# Pinned version of nvm to install (for reproducibility)
NVM_VERSION="v0.40.3"
```

### Why Strict Mode?

Without strict mode, a script can fail silently and continue running with broken state. For example:

```bash
# WITHOUT strict mode — dangerous!
cd /nonexistent/directory    # This fails silently
rm -rf *                     # This runs in the WRONG directory!

# WITH strict mode — safe!
cd /nonexistent/directory    # Script stops here with an error
rm -rf *                     # Never runs
```

### Verification

```bash
# Run the script — should exit cleanly with no output
./setup.sh

# Should show bash as the interpreter
head -1 setup.sh
# Expected: #!/usr/bin/env bash
```

---

## Step 4: Implement Utility Functions

**Goal:** Create reusable helper functions for common operations.

### What to Do

Add these utility functions after the configuration section:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# UTILITY FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

# Print a section header
# Usage: print_header "Section Title"
print_header() {
  local title="$1"
  echo ""
  echo "================================================================================"
  echo "  $title"
  echo "================================================================================"
  echo ""
}

# Print a step header
# Usage: print_step 1 "Installing dependencies"
print_step() {
  local step_number="$1"
  local step_title="$2"
  echo ""
  echo "Step $step_number: $step_title"
  echo "────────────────────────────────────────"
}

# Print a success message with checkmark
# Usage: print_success "Operation completed"
print_success() {
  echo "  ✓ $1"
}

# Print an info message with arrow
# Usage: print_info "Doing something..."
print_info() {
  echo "  → $1"
}

# Print a skip message
# Usage: print_skip "Already installed"
print_skip() {
  echo "  ✓ $1 (skipped)"
}

# Print an error message and exit
# Usage: print_error "Something went wrong" [exit_code]
print_error() {
  local message="$1"
  local exit_code="${2:-1}"
  echo ""
  echo "Error: $message" >&2
  exit "$exit_code"
}

# Print a warning message (does not exit)
# Usage: print_warning "Something might be wrong"
print_warning() {
  echo "  ⚠ Warning: $1" >&2
}

# Check if a command exists
# Usage: if command_exists git; then ...
command_exists() {
  command -v "$1" &>/dev/null
}

# Print verbose output (only if VERBOSE=true)
# Usage: verbose "Detailed information"
verbose() {
  if [ "$VERBOSE" = true ]; then
    echo "  [verbose] $1"
  fi
}

# Print what would be done in dry-run mode
# Usage: dry_run_msg "Would install package X"
dry_run_msg() {
  if [ "$DRY_RUN" = true ]; then
    echo "  [dry-run] $1"
  fi
}
```

### Why These Functions?

- **Consistent output** — All messages look the same throughout the script
- **DRY (Don't Repeat Yourself)** — Write the formatting logic once, use it everywhere
- **Easy to modify** — Change the checkmark symbol in one place, it updates everywhere

### Verification

```bash
# Add a test at the bottom of the script temporarily:
print_header "Test Header"
print_step 1 "Test Step"
print_success "Success message"
print_info "Info message"
print_skip "Skipped item"

# Run and verify output looks correct
./setup.sh

# Remove the test lines after verification
```

---

## Step 5: Implement Command-Line Argument Parsing

**Goal:** Parse command-line arguments like `--no-prompt`, `--dry-run`, etc.

### What to Do

Add argument parsing after the utility functions:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# HELP TEXT
# ─────────────────────────────────────────────────────────────────────────────
show_help() {
  cat << 'EOF'
DevUtils CLI - Bootstrap Script

USAGE:
    setup.sh [OPTIONS]

OPTIONS:
    --no-prompt     Skip confirmation prompt (for CI/CD or scripted use)
    --skip-node     Install nvm but skip Node.js installation
    --dry-run       Show what would be done without making changes
    --verbose       Enable verbose output for debugging
    --help          Show this help message
    --version       Show script version

EXAMPLES:
    # Interactive mode (default) - prompts for confirmation
    ./setup.sh

    # Non-interactive mode - no prompts
    ./setup.sh --no-prompt

    # See what would happen without making changes
    ./setup.sh --dry-run

    # Run directly from GitHub
    bash -c "$(curl -LsS https://raw.github.com/fredlackey/devutils-cli/main/setup.sh)"

    # Run from GitHub in non-interactive mode
    bash -c "$(curl -LsS https://raw.github.com/fredlackey/devutils-cli/main/setup.sh)" -- --no-prompt

AFTER RUNNING:
    dev setup

EOF
}

# ─────────────────────────────────────────────────────────────────────────────
# ARGUMENT PARSING
# ─────────────────────────────────────────────────────────────────────────────
parse_arguments() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --no-prompt)
        NO_PROMPT=true
        shift
        ;;
      --skip-node)
        SKIP_NODE=true
        shift
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --verbose)
        VERBOSE=true
        shift
        ;;
      --help|-h)
        show_help
        exit 0
        ;;
      --version|-v)
        echo "setup.sh version $SCRIPT_VERSION"
        exit 0
        ;;
      *)
        print_error "Unknown option: $1\nRun './setup.sh --help' for usage."
        ;;
    esac
  done
}
```

### How Argument Parsing Works

The `while` loop processes arguments one at a time:

1. `$#` is the number of arguments remaining
2. `$1` is the current argument
3. `shift` removes the current argument and moves to the next
4. The loop continues until no arguments remain (`$# -gt 0` is false)

### Verification

```bash
# Test help
./setup.sh --help

# Test version
./setup.sh --version

# Test unknown argument (should error)
./setup.sh --unknown

# Test that flags are set (add temporary debug output)
# Add after parse_arguments function:
# echo "NO_PROMPT=$NO_PROMPT, DRY_RUN=$DRY_RUN, VERBOSE=$VERBOSE"

./setup.sh --dry-run --verbose
# Expected: NO_PROMPT=false, DRY_RUN=true, VERBOSE=true
```

---

## Step 6: Implement OS Detection

**Goal:** Detect the operating system and distribution to install correct packages.

### What to Do

Add OS detection functions:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# OS DETECTION
# ─────────────────────────────────────────────────────────────────────────────

# Global variables set by detect_os()
OS_TYPE=""          # darwin, linux
OS_DISTRO=""        # macos, ubuntu, debian, raspbian, amzn, rhel, fedora, rocky, almalinux, centos
OS_VERSION=""       # e.g., "14.2", "22.04", "2023"
OS_NAME=""          # Human-readable name, e.g., "macOS Sonoma", "Ubuntu 22.04"
OS_PACKAGE_MANAGER="" # brew, apt, dnf, yum

# Detect the operating system and set global variables
detect_os() {
  # Step 1: Detect the kernel/platform
  local platform
  platform="$(uname -s)"

  case "$platform" in
    Darwin)
      OS_TYPE="darwin"
      OS_DISTRO="macos"
      OS_PACKAGE_MANAGER="brew"

      # Get macOS version (e.g., "14.2")
      OS_VERSION="$(sw_vers -productVersion)"

      # Get macOS name (e.g., "Sonoma")
      # macOS 14.x = Sonoma, 13.x = Ventura, 12.x = Monterey, etc.
      local major_version
      major_version="$(echo "$OS_VERSION" | cut -d. -f1)"
      case "$major_version" in
        15) OS_NAME="macOS Sequoia" ;;
        14) OS_NAME="macOS Sonoma" ;;
        13) OS_NAME="macOS Ventura" ;;
        12) OS_NAME="macOS Monterey" ;;
        11) OS_NAME="macOS Big Sur" ;;
        *)  OS_NAME="macOS $OS_VERSION" ;;
      esac
      ;;

    Linux)
      OS_TYPE="linux"

      # Read distribution info from /etc/os-release
      if [ -f /etc/os-release ]; then
        # Source the file to get variables like ID, VERSION_ID, PRETTY_NAME
        # shellcheck source=/dev/null
        . /etc/os-release

        OS_DISTRO="${ID:-unknown}"
        OS_VERSION="${VERSION_ID:-unknown}"
        OS_NAME="${PRETTY_NAME:-Linux}"

        # Determine package manager based on distribution
        case "$OS_DISTRO" in
          ubuntu|debian|raspbian)
            OS_PACKAGE_MANAGER="apt"
            ;;
          amzn)
            # Amazon Linux 2023 uses dnf, Amazon Linux 2 uses yum
            if [ "${OS_VERSION%%.*}" -ge 2023 ] 2>/dev/null; then
              OS_PACKAGE_MANAGER="dnf"
            else
              OS_PACKAGE_MANAGER="yum"
            fi
            ;;
          rhel|rocky|almalinux|centos)
            # RHEL 8+ and derivatives use dnf, older versions use yum
            if [ "${OS_VERSION%%.*}" -ge 8 ] 2>/dev/null; then
              OS_PACKAGE_MANAGER="dnf"
            else
              OS_PACKAGE_MANAGER="yum"
            fi
            ;;
          fedora)
            OS_PACKAGE_MANAGER="dnf"
            ;;
          *)
            OS_PACKAGE_MANAGER="unknown"
            ;;
        esac
      else
        OS_DISTRO="unknown"
        OS_VERSION="unknown"
        OS_NAME="Linux (unknown distribution)"
        OS_PACKAGE_MANAGER="unknown"
      fi
      ;;

    *)
      OS_TYPE="unsupported"
      OS_DISTRO="unknown"
      OS_VERSION="unknown"
      OS_NAME="$platform"
      OS_PACKAGE_MANAGER="unknown"
      ;;
  esac

  verbose "Detected OS: type=$OS_TYPE, distro=$OS_DISTRO, version=$OS_VERSION, pkg_manager=$OS_PACKAGE_MANAGER"
}

# Check if the detected OS is supported
check_os_supported() {
  case "$OS_DISTRO" in
    macos|ubuntu|debian|raspbian|amzn|rhel|rocky|almalinux|fedora|centos)
      return 0  # Supported
      ;;
    *)
      echo ""
      echo "Error: Unsupported operating system."
      echo ""
      echo "This script supports:"
      echo "  - macOS"
      echo "  - Ubuntu / Debian"
      echo "  - Raspberry Pi OS"
      echo "  - Amazon Linux"
      echo "  - RHEL / Rocky Linux / AlmaLinux / Fedora / CentOS"
      echo ""
      echo "For Windows, download and run setup.ps1 instead:"
      echo "  https://raw.github.com/fredlackey/devutils-cli/main/setup.ps1"
      echo ""
      echo "Detected: $OS_NAME"
      exit 1
      ;;
  esac
}
```

### How OS Detection Works

1. **macOS:** `uname -s` returns "Darwin". Use `sw_vers` to get the version.
2. **Linux:** `uname -s` returns "Linux". Read `/etc/os-release` for distribution details.
3. **Package manager:** Determined by distribution (apt for Debian-based, dnf/yum for Red Hat-based).

### Verification

```bash
# Add temporary test at end of script:
detect_os
echo "OS_TYPE: $OS_TYPE"
echo "OS_DISTRO: $OS_DISTRO"
echo "OS_VERSION: $OS_VERSION"
echo "OS_NAME: $OS_NAME"
echo "OS_PACKAGE_MANAGER: $OS_PACKAGE_MANAGER"
check_os_supported && echo "OS is supported!"

# Run and verify
./setup.sh

# Remove test lines after verification
```

---

## Step 7: Implement Privilege Detection

**Goal:** Detect if we're running as root or have sudo access.

### What to Do

Add privilege detection functions:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# PRIVILEGE DETECTION
# ─────────────────────────────────────────────────────────────────────────────

# Global variable for sudo command (empty if running as root)
SUDO=""

# Check if running as root user
is_root() {
  [ "$(id -u)" -eq 0 ]
}

# Check if sudo is available and the user has sudo privileges
can_sudo() {
  # First check if sudo command exists
  if ! command_exists sudo; then
    return 1
  fi

  # Check if user can run sudo (may prompt for password)
  # The -v flag validates credentials without running a command
  # The -n flag prevents prompting (non-interactive check)
  if sudo -n true 2>/dev/null; then
    return 0  # Already has valid sudo credentials
  fi

  # Try with potential password prompt
  # This may prompt the user for their password
  if sudo -v 2>/dev/null; then
    return 0
  fi

  return 1
}

# Check and configure sudo access
# This should be called early, so password is entered before installation starts
check_sudo_access() {
  # Skip check on macOS if only installing Xcode CLI tools (doesn't need sudo)
  # But we'll check anyway for consistency

  if is_root; then
    verbose "Running as root user — no sudo needed"
    SUDO=""
    return 0
  fi

  # Check if this distro needs sudo for package installation
  local needs_sudo=false
  case "$OS_PACKAGE_MANAGER" in
    apt|dnf|yum)
      needs_sudo=true
      ;;
    brew)
      # Homebrew shouldn't be run with sudo
      needs_sudo=false
      ;;
  esac

  if [ "$needs_sudo" = true ]; then
    if can_sudo; then
      SUDO="sudo"
      verbose "User has sudo access"

      # Prompt for password early so it's cached for later commands
      if [ "$NO_PROMPT" = false ] && [ "$DRY_RUN" = false ]; then
        echo ""
        echo "This script requires sudo access to install system packages."
        echo "You may be prompted for your password."
        echo ""
        sudo -v || print_error "Failed to obtain sudo access." 3
      fi
    else
      echo ""
      echo "Error: This script requires sudo access to install system packages."
      echo ""
      echo "Please either:"
      echo "  1. Run this script with sudo: sudo ./setup.sh"
      echo "  2. Ensure your user has sudo privileges"
      echo ""
      exit 3
    fi
  else
    SUDO=""
    verbose "sudo not required for $OS_PACKAGE_MANAGER"
  fi
}
```

### Why Early Password Prompt?

If we wait until mid-installation to prompt for the password, the user might not be watching the terminal. By prompting early, we ensure:

1. The user confirms they want to proceed
2. The password is cached before any long-running operations
3. The script won't hang waiting for input during installation

### Verification

```bash
# Test as normal user
./setup.sh --verbose --dry-run
# Should show: "User has sudo access" or error if no sudo

# Test the is_root function
sudo ./setup.sh --verbose --dry-run
# Should show: "Running as root user — no sudo needed"
```

---

## Step 8: Implement Pre-Flight Checks

**Goal:** Determine what needs to be installed before showing the confirmation prompt.

### What to Do

Add pre-flight check functions:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# PRE-FLIGHT CHECKS
# ─────────────────────────────────────────────────────────────────────────────

# Arrays to track what will be installed vs skipped
# (Bash 3.x compatible — using strings instead of arrays for macOS)
WILL_INSTALL=""
WILL_SKIP=""

# Add an item to the "will install" list
add_to_install() {
  if [ -z "$WILL_INSTALL" ]; then
    WILL_INSTALL="$1"
  else
    WILL_INSTALL="$WILL_INSTALL|$1"
  fi
}

# Add an item to the "will skip" list
add_to_skip() {
  if [ -z "$WILL_SKIP" ]; then
    WILL_SKIP="$1"
  else
    WILL_SKIP="$WILL_SKIP|$1"
  fi
}

# Check if Xcode CLI Tools are installed (macOS only)
check_xcode_cli_tools() {
  if xcode-select -p &>/dev/null; then
    return 0  # Installed
  fi
  return 1  # Not installed
}

# Check if a package is installed via dpkg (Debian/Ubuntu)
check_dpkg_package() {
  local package="$1"
  dpkg -s "$package" &>/dev/null
}

# Check if a package is installed via rpm (RHEL/Fedora)
check_rpm_package() {
  local package="$1"
  rpm -q "$package" &>/dev/null
}

# Check if the Development Tools group is installed
check_dev_tools_group() {
  # Check for gcc as a proxy for Development Tools
  command_exists gcc
}

# Check if nvm is installed
check_nvm_installed() {
  [ -d "$HOME/.nvm" ]
}

# Check if Node.js is installed via nvm
check_node_installed() {
  # Source nvm if available
  export NVM_DIR="$HOME/.nvm"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"

    # Check if any Node.js version is installed
    if nvm ls --no-colors 2>/dev/null | grep -q "v[0-9]"; then
      return 0  # Node.js is installed
    fi
  fi
  return 1  # Not installed
}

# Check if DevUtils CLI is installed
check_devutils_installed() {
  command_exists dev
}

# Run all pre-flight checks and populate WILL_INSTALL and WILL_SKIP
run_preflight_checks() {
  verbose "Running pre-flight checks..."

  # Reset lists
  WILL_INSTALL=""
  WILL_SKIP=""

  # ─────────────────────────────────────────────────────────────────────────
  # Check 1: OS-specific build tools
  # ─────────────────────────────────────────────────────────────────────────
  case "$OS_DISTRO" in
    macos)
      if check_xcode_cli_tools; then
        add_to_skip "Xcode Command Line Tools"
      else
        add_to_install "Xcode Command Line Tools"
      fi
      ;;

    ubuntu|debian|raspbian)
      local apt_packages="build-essential curl git ca-certificates"
      local apt_missing=""
      local apt_present=""

      for pkg in $apt_packages; do
        if check_dpkg_package "$pkg"; then
          apt_present="$apt_present $pkg"
        else
          apt_missing="$apt_missing $pkg"
        fi
      done

      if [ -n "$apt_missing" ]; then
        add_to_install "APT packages:$apt_missing"
      fi
      if [ -n "$apt_present" ]; then
        add_to_skip "APT packages:$apt_present"
      fi
      ;;

    amzn|rhel|rocky|almalinux|fedora|centos)
      # Check Development Tools group
      if check_dev_tools_group; then
        add_to_skip "Development Tools"
      else
        add_to_install "Development Tools"
      fi

      # Check individual packages
      local rpm_packages="curl git ca-certificates"
      local rpm_missing=""
      local rpm_present=""

      for pkg in $rpm_packages; do
        if check_rpm_package "$pkg"; then
          rpm_present="$rpm_present $pkg"
        else
          rpm_missing="$rpm_missing $pkg"
        fi
      done

      if [ -n "$rpm_missing" ]; then
        add_to_install "Packages:$rpm_missing"
      fi
      if [ -n "$rpm_present" ]; then
        add_to_skip "Packages:$rpm_present"
      fi
      ;;
  esac

  # ─────────────────────────────────────────────────────────────────────────
  # Check 2: nvm
  # ─────────────────────────────────────────────────────────────────────────
  if check_nvm_installed; then
    add_to_skip "nvm (Node Version Manager)"
  else
    add_to_install "nvm $NVM_VERSION (Node Version Manager)"
  fi

  # ─────────────────────────────────────────────────────────────────────────
  # Check 3: Node.js (unless --skip-node)
  # ─────────────────────────────────────────────────────────────────────────
  if [ "$SKIP_NODE" = true ]; then
    verbose "Skipping Node.js check (--skip-node flag)"
  else
    if check_node_installed; then
      add_to_skip "Node.js"
    else
      add_to_install "Node.js LTS"
    fi
  fi

  # ─────────────────────────────────────────────────────────────────────────
  # Check 4: DevUtils CLI (unless --skip-node, since it requires Node.js)
  # ─────────────────────────────────────────────────────────────────────────
  if [ "$SKIP_NODE" = true ]; then
    verbose "Skipping DevUtils CLI check (--skip-node flag)"
  else
    if check_devutils_installed; then
      add_to_skip "DevUtils CLI"
    else
      add_to_install "DevUtils CLI"
    fi
  fi

  verbose "Pre-flight checks complete"
}
```

### How Pre-Flight Checks Work

Before showing the user what will be installed, we check each component:

1. **Build tools:** Xcode CLI on macOS, build-essential on Debian, Development Tools on RHEL
2. **nvm:** Check if `~/.nvm` directory exists
3. **Node.js:** Source nvm and check if any version is installed

This information is used in the confirmation prompt and to skip unnecessary work.

### Verification

```bash
# Add temporary test:
detect_os
run_preflight_checks
echo "Will install: $WILL_INSTALL"
echo "Will skip: $WILL_SKIP"

# Run and verify the lists make sense for your system
./setup.sh
```

---

## Step 9: Implement User Confirmation Prompt

**Goal:** Show the user what will happen and ask for confirmation.

### What to Do

Add the confirmation prompt function:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# USER CONFIRMATION
# ─────────────────────────────────────────────────────────────────────────────

# Display the summary and ask for confirmation
# Returns 0 if user confirms, exits if user declines
show_confirmation_prompt() {
  print_header "DevUtils CLI - Bootstrap Script"

  echo "Detected: $OS_NAME"
  echo ""

  # Show what will be installed
  if [ -n "$WILL_INSTALL" ]; then
    echo "The following will be installed:"
    # Split by | delimiter and print each item
    echo "$WILL_INSTALL" | tr '|' '\n' | while read -r item; do
      [ -n "$item" ] && echo "  • $item"
    done
    echo ""
  fi

  # Show what will be skipped
  if [ -n "$WILL_SKIP" ]; then
    echo "The following are already installed (will be skipped):"
    echo "$WILL_SKIP" | tr '|' '\n' | while read -r item; do
      [ -n "$item" ] && echo "  • $item"
    done
    echo ""
  fi

  # Check if there's nothing to do
  if [ -z "$WILL_INSTALL" ]; then
    echo "Everything is already installed! Nothing to do."
    echo ""
    echo "DevUtils CLI is ready. Run:"
    echo "  dev setup"
    exit 0
  fi

  # Dry run mode — show what would be done and exit
  if [ "$DRY_RUN" = true ]; then
    echo "[Dry run mode — no changes will be made]"
    exit 0
  fi

  # Non-interactive mode — proceed without prompting
  if [ "$NO_PROMPT" = true ]; then
    verbose "Non-interactive mode — proceeding without confirmation"
    return 0
  fi

  # Interactive mode — ask for confirmation
  echo "Do you want to proceed? [y/N] "
  read -r response

  case "$response" in
    [yY]|[yY][eE][sS])
      return 0  # User confirmed
      ;;
    *)
      echo ""
      echo "Installation cancelled."
      exit 0
      ;;
  esac
}
```

### Why Default to "No"?

The prompt says `[y/N]` where the capital N indicates the default. If the user just presses Enter without typing anything, the script exits safely. This follows the principle of least surprise — doing nothing is safer than installing software unexpectedly.

### Verification

```bash
# Test interactive mode
./setup.sh
# Should show summary and prompt, type 'n' to cancel

# Test non-interactive mode
./setup.sh --no-prompt --dry-run
# Should show summary without prompting

# Test when everything is installed
# (depends on your system state)
```

---

## Step 10: Implement macOS: Xcode CLI Tools Installation

**Goal:** Install Xcode Command Line Tools following the 4-phase workflow.

### What to Do

Add the Xcode installation function:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# MACOS: XCODE COMMAND LINE TOOLS
# ─────────────────────────────────────────────────────────────────────────────

install_xcode_cli_tools() {
  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 1: CHECK — Is this step needed?
  # ─────────────────────────────────────────────────────────────────────────
  if check_xcode_cli_tools; then
    print_skip "Xcode Command Line Tools already installed"
    return 0
  fi

  # Dry run mode
  if [ "$DRY_RUN" = true ]; then
    dry_run_msg "Would install Xcode Command Line Tools"
    return 0
  fi

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 2: EXECUTE — Trigger the installation
  # ─────────────────────────────────────────────────────────────────────────
  print_info "Installing Xcode Command Line Tools..."

  # This command triggers a macOS GUI dialog
  xcode-select --install 2>/dev/null || true

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 3: WAIT — Wait for the GUI installation to complete
  # ─────────────────────────────────────────────────────────────────────────
  # The xcode-select --install command returns immediately after triggering
  # the GUI dialog. We must wait for the user to complete the installation.
  echo ""
  echo "  A dialog box should appear asking to install the Command Line Tools."
  echo "  Click 'Install' and wait for it to complete."
  echo ""
  echo "  Press Enter after the installation finishes..."
  read -r

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 4: VERIFY — Confirm the installation succeeded
  # ─────────────────────────────────────────────────────────────────────────
  if ! check_xcode_cli_tools; then
    print_error "Xcode Command Line Tools installation failed." 3
  fi

  print_success "Xcode Command Line Tools installed successfully"
}
```

### Why the Manual Wait?

`xcode-select --install` launches a GUI installer and returns immediately. The script can't detect when the GUI finishes, so we ask the user to press Enter when done. This is the standard pattern for GUI-based installers in terminal scripts.

### Verification

On a macOS system without Xcode CLI Tools:

```bash
./setup.sh --dry-run
# Should show: "Would install Xcode Command Line Tools"

./setup.sh
# Should trigger the GUI installer and wait for confirmation
```

---

## Step 11: Implement APT Package Installation

**Goal:** Install packages via APT (Ubuntu/Debian/Raspbian) following the 4-phase workflow.

### What to Do

Add the APT installation function:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# LINUX: APT PACKAGES (Ubuntu/Debian/Raspbian)
# ─────────────────────────────────────────────────────────────────────────────

install_apt_packages() {
  local packages="build-essential curl git ca-certificates"

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 1: CHECK — Which packages are missing?
  # ─────────────────────────────────────────────────────────────────────────
  local missing=""
  for pkg in $packages; do
    if ! check_dpkg_package "$pkg"; then
      missing="$missing $pkg"
    fi
  done

  # Remove leading space
  missing="${missing# }"

  if [ -z "$missing" ]; then
    print_skip "All APT packages already installed"
    return 0
  fi

  # Dry run mode
  if [ "$DRY_RUN" = true ]; then
    dry_run_msg "Would install APT packages: $missing"
    return 0
  fi

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 2: EXECUTE — Install the missing packages
  # ─────────────────────────────────────────────────────────────────────────
  print_info "Installing APT packages: $missing"

  verbose "Running: apt-get update"
  $SUDO apt-get update -qq

  verbose "Running: apt-get install -y $missing"
  $SUDO apt-get install -y $missing

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 3: WAIT — apt-get is synchronous, so no explicit wait needed
  # ─────────────────────────────────────────────────────────────────────────
  # The apt-get command blocks until installation is complete.

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 4: VERIFY — Confirm all packages were installed
  # ─────────────────────────────────────────────────────────────────────────
  local failed=""
  for pkg in $missing; do
    if ! check_dpkg_package "$pkg"; then
      failed="$failed $pkg"
    fi
  done

  if [ -n "$failed" ]; then
    print_error "Failed to install APT packages:$failed" 3
  fi

  print_success "APT packages installed successfully"
}
```

### Why `-qq` Flag?

The `-qq` flag makes `apt-get update` quieter, reducing noise in the output. We only show essential information to keep the output clean and readable.

### Verification

On an Ubuntu/Debian system:

```bash
./setup.sh --dry-run
# Should show which packages would be installed

./setup.sh --verbose
# Should show detailed output of apt-get commands
```

---

## Step 12: Implement DNF Package Installation

**Goal:** Install packages via DNF (Fedora/RHEL 8+/Amazon Linux 2023) following the 4-phase workflow.

### What to Do

Add the DNF installation function:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# LINUX: DNF PACKAGES (Fedora/RHEL 8+/Amazon Linux 2023)
# ─────────────────────────────────────────────────────────────────────────────

install_dnf_packages() {
  local packages="curl git ca-certificates"

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 1: CHECK — What needs to be installed?
  # ─────────────────────────────────────────────────────────────────────────
  local need_dev_tools=false
  local missing_packages=""

  # Check Development Tools group
  if ! check_dev_tools_group; then
    need_dev_tools=true
  fi

  # Check individual packages
  for pkg in $packages; do
    if ! check_rpm_package "$pkg"; then
      missing_packages="$missing_packages $pkg"
    fi
  done
  missing_packages="${missing_packages# }"

  if [ "$need_dev_tools" = false ] && [ -z "$missing_packages" ]; then
    print_skip "All DNF packages already installed"
    return 0
  fi

  # Dry run mode
  if [ "$DRY_RUN" = true ]; then
    [ "$need_dev_tools" = true ] && dry_run_msg "Would install Development Tools group"
    [ -n "$missing_packages" ] && dry_run_msg "Would install DNF packages: $missing_packages"
    return 0
  fi

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 2: EXECUTE — Install packages
  # ─────────────────────────────────────────────────────────────────────────

  # Install Development Tools group if needed
  if [ "$need_dev_tools" = true ]; then
    print_info "Installing Development Tools group..."
    verbose "Running: dnf groupinstall -y 'Development Tools'"
    $SUDO dnf groupinstall -y "Development Tools"
  fi

  # Install individual packages if needed
  if [ -n "$missing_packages" ]; then
    print_info "Installing DNF packages: $missing_packages"
    verbose "Running: dnf install -y $missing_packages"
    $SUDO dnf install -y $missing_packages
  fi

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 3: WAIT — dnf is synchronous, so no explicit wait needed
  # ─────────────────────────────────────────────────────────────────────────

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 4: VERIFY — Confirm installation succeeded
  # ─────────────────────────────────────────────────────────────────────────

  # Verify Development Tools (check for gcc as proxy)
  if [ "$need_dev_tools" = true ] && ! check_dev_tools_group; then
    print_error "Failed to install Development Tools group" 3
  fi

  # Verify individual packages
  local failed=""
  for pkg in $missing_packages; do
    if ! check_rpm_package "$pkg"; then
      failed="$failed $pkg"
    fi
  done

  if [ -n "$failed" ]; then
    print_error "Failed to install DNF packages:$failed" 3
  fi

  print_success "DNF packages installed successfully"
}
```

### What Are "Development Tools"?

"Development Tools" is a package group that includes compilers and build tools (gcc, g++, make, etc.). It's the RHEL/Fedora equivalent of Ubuntu's `build-essential`.

---

## Step 13: Implement YUM Package Installation

**Goal:** Install packages via YUM (Amazon Linux 2/RHEL 7) following the 4-phase workflow.

### What to Do

Add the YUM installation function:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# LINUX: YUM PACKAGES (Amazon Linux 2/RHEL 7)
# ─────────────────────────────────────────────────────────────────────────────

install_yum_packages() {
  local packages="curl git ca-certificates"

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 1: CHECK — What needs to be installed?
  # ─────────────────────────────────────────────────────────────────────────
  local need_dev_tools=false
  local missing_packages=""

  # Check Development Tools group
  if ! check_dev_tools_group; then
    need_dev_tools=true
  fi

  # Check individual packages
  for pkg in $packages; do
    if ! check_rpm_package "$pkg"; then
      missing_packages="$missing_packages $pkg"
    fi
  done
  missing_packages="${missing_packages# }"

  if [ "$need_dev_tools" = false ] && [ -z "$missing_packages" ]; then
    print_skip "All YUM packages already installed"
    return 0
  fi

  # Dry run mode
  if [ "$DRY_RUN" = true ]; then
    [ "$need_dev_tools" = true ] && dry_run_msg "Would install Development Tools group"
    [ -n "$missing_packages" ] && dry_run_msg "Would install YUM packages: $missing_packages"
    return 0
  fi

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 2: EXECUTE — Install packages
  # ─────────────────────────────────────────────────────────────────────────

  # Install Development Tools group if needed
  if [ "$need_dev_tools" = true ]; then
    print_info "Installing Development Tools group..."
    verbose "Running: yum groupinstall -y 'Development Tools'"
    $SUDO yum groupinstall -y "Development Tools"
  fi

  # Install individual packages if needed
  if [ -n "$missing_packages" ]; then
    print_info "Installing YUM packages: $missing_packages"
    verbose "Running: yum install -y $missing_packages"
    $SUDO yum install -y $missing_packages
  fi

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 3: WAIT — yum is synchronous, so no explicit wait needed
  # ─────────────────────────────────────────────────────────────────────────

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 4: VERIFY — Confirm installation succeeded
  # ─────────────────────────────────────────────────────────────────────────

  # Verify Development Tools (check for gcc as proxy)
  if [ "$need_dev_tools" = true ] && ! check_dev_tools_group; then
    print_error "Failed to install Development Tools group" 3
  fi

  # Verify individual packages
  local failed=""
  for pkg in $missing_packages; do
    if ! check_rpm_package "$pkg"; then
      failed="$failed $pkg"
    fi
  done

  if [ -n "$failed" ]; then
    print_error "Failed to install YUM packages:$failed" 3
  fi

  print_success "YUM packages installed successfully"
}
```

### DNF vs YUM

DNF (Dandified YUM) is the modern replacement for YUM. They have similar syntax, but DNF is faster and handles dependencies better. Amazon Linux 2023 and RHEL 8+ use DNF; older versions use YUM.

---

## Step 14: Implement nvm Installation

**Goal:** Install nvm (Node Version Manager) following the 4-phase workflow.

### What to Do

Add the nvm installation function:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# NVM INSTALLATION
# ─────────────────────────────────────────────────────────────────────────────

install_nvm() {
  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 1: CHECK — Is nvm already installed?
  # ─────────────────────────────────────────────────────────────────────────
  if check_nvm_installed; then
    print_skip "nvm already installed"

    # Even if installed, we need to source it for subsequent commands
    export NVM_DIR="$HOME/.nvm"
    # shellcheck source=/dev/null
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    return 0
  fi

  # Dry run mode
  if [ "$DRY_RUN" = true ]; then
    dry_run_msg "Would install nvm $NVM_VERSION"
    return 0
  fi

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 2: EXECUTE — Download and run the nvm install script
  # ─────────────────────────────────────────────────────────────────────────
  print_info "Installing nvm $NVM_VERSION..."

  # The nvm install script uses curl or wget to download and install nvm
  # We've already ensured curl is installed in the OS dependencies step
  verbose "Downloading nvm install script from GitHub..."

  curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 3: WAIT — The curl | bash is synchronous, but we need to source nvm
  # ─────────────────────────────────────────────────────────────────────────
  # The install script modifies shell profiles (~/.bashrc, ~/.zshrc, etc.)
  # but those changes don't take effect until we source them.
  # We manually source nvm to make it available in this script session.

  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 4: VERIFY — Confirm nvm is installed and working
  # ─────────────────────────────────────────────────────────────────────────
  if ! check_nvm_installed; then
    print_error "nvm installation failed — ~/.nvm directory not found" 4
  fi

  # Verify nvm command is available
  if ! command_exists nvm; then
    print_error "nvm installation failed — nvm command not available" 4
  fi

  # Show installed version
  local installed_version
  installed_version="$(nvm --version)"
  print_success "nvm $installed_version installed successfully"
}
```

### Why `curl | bash`?

This is the standard nvm installation method from the official repository. The script:

1. Downloads nvm to `~/.nvm`
2. Adds nvm initialization to shell profiles (~/.bashrc, ~/.zshrc)
3. Sets appropriate permissions

### Verification

```bash
./setup.sh --dry-run
# Should show: "Would install nvm v0.40.3"

# After running (on a system without nvm):
./setup.sh
# Should install nvm and show success message
```

---

## Step 15: Implement Node.js Installation

**Goal:** Install Node.js LTS via nvm following the 4-phase workflow.

### What to Do

Add the Node.js installation function:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# NODE.JS INSTALLATION
# ─────────────────────────────────────────────────────────────────────────────

install_nodejs() {
  # Skip if --skip-node flag was provided
  if [ "$SKIP_NODE" = true ]; then
    print_skip "Node.js installation (--skip-node flag)"
    return 0
  fi

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 1: CHECK — Is Node.js already installed via nvm?
  # ─────────────────────────────────────────────────────────────────────────

  # Ensure nvm is sourced (it should be from the previous step)
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

  if check_node_installed; then
    local current_version
    current_version="$(node --version 2>/dev/null || echo 'unknown')"
    print_skip "Node.js already installed ($current_version)"
    return 0
  fi

  # Dry run mode
  if [ "$DRY_RUN" = true ]; then
    dry_run_msg "Would install Node.js LTS via nvm"
    return 0
  fi

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 2: EXECUTE — Install Node.js LTS
  # ─────────────────────────────────────────────────────────────────────────
  print_info "Installing Node.js LTS..."

  verbose "Running: nvm install --lts"
  nvm install --lts

  # Set LTS as the default version
  verbose "Running: nvm alias default 'lts/*'"
  nvm alias default 'lts/*'

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 3: WAIT — nvm install is synchronous
  # ─────────────────────────────────────────────────────────────────────────
  # The nvm install command downloads and compiles/extracts Node.js,
  # then sets it as the current version. This is all synchronous.

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 4: VERIFY — Confirm Node.js and npm are working
  # ─────────────────────────────────────────────────────────────────────────
  if ! command_exists node; then
    print_error "Node.js installation failed — node command not available" 5
  fi

  if ! command_exists npm; then
    print_error "Node.js installation failed — npm command not available" 5
  fi

  # Get versions for display
  local node_version npm_version
  node_version="$(node --version)"
  npm_version="$(npm --version)"

  print_success "Node.js $node_version installed"
  print_success "npm $npm_version installed"
}
```

### Why LTS?

LTS (Long Term Support) versions:
- Receive security updates for 30 months
- Are well-tested and stable
- Are recommended for most development workflows
- Are what most production environments use

### Verification

```bash
./setup.sh --skip-node --dry-run
# Should skip Node.js installation

./setup.sh --dry-run
# Should show: "Would install Node.js LTS via nvm"

# After running (on a system without Node.js):
node --version  # Should show version
npm --version   # Should show version
```

---

## Step 16: Implement DevUtils CLI Installation

**Goal:** Install DevUtils CLI globally via npm following the 4-phase workflow.

### What to Do

Add the DevUtils CLI installation function:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# DEVUTILS CLI INSTALLATION
# ─────────────────────────────────────────────────────────────────────────────

install_devutils_cli() {
  # Skip if --skip-node flag was provided (DevUtils CLI requires Node.js)
  if [ "$SKIP_NODE" = true ]; then
    print_skip "DevUtils CLI installation (--skip-node flag)"
    return 0
  fi

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 1: CHECK — Is DevUtils CLI already installed?
  # ─────────────────────────────────────────────────────────────────────────
  if check_devutils_installed; then
    local current_version
    current_version="$(dev --version 2>/dev/null || echo 'unknown')"
    print_skip "DevUtils CLI already installed ($current_version)"
    return 0
  fi

  # Dry run mode
  if [ "$DRY_RUN" = true ]; then
    dry_run_msg "Would install DevUtils CLI via npm"
    return 0
  fi

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 2: EXECUTE — Install DevUtils CLI globally
  # ─────────────────────────────────────────────────────────────────────────
  print_info "Installing DevUtils CLI..."

  verbose "Running: npm install -g @fredlackey/devutils"
  npm install -g @fredlackey/devutils

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 3: WAIT — npm install is synchronous
  # ─────────────────────────────────────────────────────────────────────────
  # The npm install command blocks until installation is complete.

  # ─────────────────────────────────────────────────────────────────────────
  # PHASE 4: VERIFY — Confirm DevUtils CLI is working
  # ─────────────────────────────────────────────────────────────────────────
  if ! check_devutils_installed; then
    print_error "DevUtils CLI installation failed — dev command not available" 6
  fi

  # Get version for display
  local devutils_version
  devutils_version="$(dev --version 2>/dev/null || echo 'unknown')"

  print_success "DevUtils CLI $devutils_version installed"
}
```

### Why Install DevUtils CLI Automatically?

Installing DevUtils CLI as the final step provides a seamless experience:

1. **One command does everything** — The user runs `setup.sh` once and gets a fully functional development environment
2. **No manual follow-up steps** — Users can immediately run `dev setup` after the script completes
3. **Reduces friction** — New users don't need to remember additional npm install commands

### Verification

```bash
./setup.sh --skip-node --dry-run
# Should skip DevUtils CLI installation (requires Node.js)

./setup.sh --dry-run
# Should show: "Would install DevUtils CLI via npm"

# After running (on a system without DevUtils CLI):
dev --version  # Should show version
```

---

## Step 17: Implement Main Function

**Goal:** Tie everything together in a main function that orchestrates the installation.

### What to Do

Add the main function and entry point:

```bash
# ─────────────────────────────────────────────────────────────────────────────
# INSTALL OS DEPENDENCIES (dispatcher)
# ─────────────────────────────────────────────────────────────────────────────

# Call the appropriate OS-specific package installer
install_os_dependencies() {
  print_step 1 "Installing OS dependencies"

  case "$OS_DISTRO" in
    macos)
      install_xcode_cli_tools
      ;;
    ubuntu|debian|raspbian)
      install_apt_packages
      ;;
    amzn|rhel|rocky|almalinux|fedora|centos)
      if [ "$OS_PACKAGE_MANAGER" = "dnf" ]; then
        install_dnf_packages
      else
        install_yum_packages
      fi
      ;;
    *)
      print_error "No package installer for $OS_DISTRO" 1
      ;;
  esac
}

# ─────────────────────────────────────────────────────────────────────────────
# COMPLETION MESSAGE
# ─────────────────────────────────────────────────────────────────────────────

show_completion_message() {
  print_header "Bootstrap Complete!"

  echo "DevUtils CLI is ready to use. Run:"
  echo "  dev setup"
  echo ""
}

# ─────────────────────────────────────────────────────────────────────────────
# MAIN FUNCTION
# ─────────────────────────────────────────────────────────────────────────────

main() {
  # Step 1: Parse command-line arguments
  parse_arguments "$@"

  # Step 2: Detect the operating system
  detect_os

  # Step 3: Verify the OS is supported
  check_os_supported

  # Step 4: Check sudo access (prompts for password if needed)
  check_sudo_access

  # Step 5: Run pre-flight checks to determine what needs to be installed
  run_preflight_checks

  # Step 6: Show confirmation prompt (or skip if --no-prompt)
  show_confirmation_prompt

  # Step 7: Install OS-specific dependencies
  install_os_dependencies

  # Step 8: Install nvm
  print_step 2 "Installing nvm (Node Version Manager)"
  install_nvm

  # Step 9: Install Node.js (unless --skip-node)
  print_step 3 "Installing Node.js"
  install_nodejs

  # Step 10: Install DevUtils CLI (unless --skip-node)
  print_step 4 "Installing DevUtils CLI"
  install_devutils_cli

  # Step 11: Show completion message
  show_completion_message
}

# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────
# Only run main() if this script is being executed directly (not sourced)
# This allows the script to be sourced for testing individual functions

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  main "$@"
fi
```

### How the Entry Point Works

The `if [ "${BASH_SOURCE[0]}" = "$0" ]` check allows the script to be:

1. **Executed directly:** `./setup.sh` — runs `main()`
2. **Sourced for testing:** `source setup.sh` — defines functions without running them

This pattern is useful for testing individual functions in isolation.

### Verification

```bash
# Test full flow in dry-run mode
./setup.sh --dry-run

# Test full flow with verbose output
./setup.sh --dry-run --verbose

# Test non-interactive mode
./setup.sh --no-prompt --dry-run

# Test help
./setup.sh --help
```

---

## Step 18: Testing

**Goal:** Verify the script works on all supported platforms.

### Testing Checklist

Use this checklist to test the script on each platform:

#### Test 1: Help and Version

```bash
./setup.sh --help      # Should show help text
./setup.sh --version   # Should show version number
```

#### Test 2: Dry Run

```bash
./setup.sh --dry-run
# Should show what would be installed without making changes
```

#### Test 3: Idempotent Run

```bash
# Run once to install everything
./setup.sh

# Run again — should report everything as already installed
./setup.sh
```

#### Test 4: Interactive Mode

```bash
# Run without flags, should prompt for confirmation
./setup.sh
# Type 'n' to cancel, verify script exits cleanly
```

#### Test 5: Non-Interactive Mode

```bash
./setup.sh --no-prompt
# Should proceed without prompting
```

#### Test 6: Verbose Mode

```bash
./setup.sh --verbose --dry-run
# Should show detailed output
```

#### Test 7: Skip Node

```bash
./setup.sh --skip-node --dry-run
# Should not include Node.js or DevUtils CLI in the installation plan
```

#### Test 8: DevUtils CLI Verification

```bash
# After full installation completes:
dev --version  # Should show version
dev --help     # Should show help text
```

### Platform Testing Matrix

Test on as many platforms as you have access to:

| Platform | Status | Notes |
|----------|--------|-------|
| macOS Sonoma (14.x) | ⬜ | |
| macOS Ventura (13.x) | ⬜ | |
| Ubuntu 24.04 LTS | ⬜ | |
| Ubuntu 22.04 LTS | ⬜ | |
| Debian 12 | ⬜ | |
| Raspberry Pi OS | ⬜ | |
| Amazon Linux 2023 | ⬜ | |
| Amazon Linux 2 | ⬜ | |
| Fedora 40+ | ⬜ | |
| Rocky Linux 9 | ⬜ | |

### Using Docker for Testing

If you don't have access to all platforms, use Docker:

```bash
# Test Ubuntu
docker run -it --rm ubuntu:22.04 bash
# Inside container: apt-get update && apt-get install -y curl
# Then run the setup script

# Test Amazon Linux 2023
docker run -it --rm amazonlinux:2023 bash

# Test Fedora
docker run -it --rm fedora:40 bash
```

---

## Summary

You've now implemented a complete bootstrap script that:

1. Parses command-line arguments
2. Detects the operating system
3. Checks what needs to be installed (pre-flight checks)
4. Prompts for user confirmation
5. Installs OS-specific build tools
6. Installs nvm
7. Installs Node.js LTS
8. Installs DevUtils CLI

Every installation step follows the 4-phase workflow:
- **Check** — Is this needed?
- **Execute** — Perform the installation
- **Wait** — Block until complete
- **Verify** — Confirm success before proceeding

The script is idempotent — safe to run multiple times without errors.

---

## Appendix: Complete File Structure

After completing all steps, your `setup.sh` should have this structure:

```
1. Shebang and header comments
2. Strict mode (set -euo pipefail)
3. Configuration variables
4. Utility functions (print_*, command_exists, etc.)
5. Help text and argument parsing
6. OS detection functions
7. Privilege detection functions
8. Pre-flight check functions
9. User confirmation function
10. Installation functions:
    - install_xcode_cli_tools
    - install_apt_packages
    - install_dnf_packages
    - install_yum_packages
    - install_nvm
    - install_nodejs
    - install_devutils_cli
11. Main function
12. Entry point
```

Total: approximately 550-650 lines of well-commented bash code.
