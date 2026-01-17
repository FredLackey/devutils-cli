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
  echo -n "Do you want to proceed? [y/N] "
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

  # Start a new login shell so nvm and dev are in PATH immediately.
  # This replaces the current subshell with a fresh shell that sources
  # the user's profile (~/.zshrc, ~/.bashrc, etc.).
  exec "$SHELL" -l
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
#
# Note: When run via `bash -c "$(curl ...)"`, BASH_SOURCE is empty/unset.
# We use ${BASH_SOURCE[0]:-} to provide a default empty value, and also
# check if it's empty (which means we're being piped to bash).

if [[ -z "${BASH_SOURCE[0]:-}" ]] || [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
