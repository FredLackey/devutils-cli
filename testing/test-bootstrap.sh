#!/usr/bin/env bash
#
# test-bootstrap.sh — Test the setup.sh bootstrap script in Docker containers
#
# Usage:
#   ./testing/test-bootstrap.sh                    # Test all platforms
#   ./testing/test-bootstrap.sh ubuntu             # Test Ubuntu only
#   ./testing/test-bootstrap.sh amazonlinux        # Test Amazon Linux only
#   ./testing/test-bootstrap.sh --local            # Test local setup.sh (not from GitHub)
#   ./testing/test-bootstrap.sh --shell ubuntu     # Open interactive shell for debugging
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Platforms to test
PLATFORMS=("ubuntu" "amazonlinux")

# Options
USE_LOCAL=false
SHELL_MODE=false
TARGET_PLATFORM=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --local)
      USE_LOCAL=true
      shift
      ;;
    --shell)
      SHELL_MODE=true
      shift
      if [[ $# -gt 0 && ! "$1" =~ ^-- ]]; then
        TARGET_PLATFORM="$1"
        shift
      fi
      ;;
    ubuntu|amazonlinux)
      TARGET_PLATFORM="$1"
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS] [PLATFORM]"
      echo ""
      echo "Options:"
      echo "  --local      Test local setup.sh instead of GitHub version"
      echo "  --shell      Open interactive shell for debugging"
      echo "  --help       Show this help message"
      echo ""
      echo "Platforms:"
      echo "  ubuntu       Test on Ubuntu 22.04"
      echo "  amazonlinux  Test on Amazon Linux 2023"
      echo ""
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Print colored output
print_header() {
  echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}→ $1${NC}"
}

# Build Docker image for a platform
build_image() {
  local platform="$1"
  local dockerfile="$SCRIPT_DIR/Dockerfile.bootstrap-$platform"
  local image_name="devutils-bootstrap-test-$platform"

  if [[ ! -f "$dockerfile" ]]; then
    print_error "Dockerfile not found: $dockerfile"
    return 1
  fi

  print_info "Building Docker image for $platform..."
  docker build -t "$image_name" -f "$dockerfile" "$SCRIPT_DIR" > /dev/null 2>&1
  print_success "Image built: $image_name"
}

# Run bootstrap test for a platform
run_test() {
  local platform="$1"
  local image_name="devutils-bootstrap-test-$platform"

  print_header "Testing Bootstrap on $platform"

  # Build the image
  build_image "$platform"

  # Determine the bootstrap command
  local bootstrap_cmd
  if [[ "$USE_LOCAL" == "true" ]]; then
    # Mount the local setup.sh and run it
    print_info "Using LOCAL setup.sh"
    bootstrap_cmd="bash /app/setup.sh --no-prompt"
  else
    # Run from GitHub
    print_info "Using GitHub setup.sh"
    bootstrap_cmd="bash -c \"\$(curl -LsS https://raw.githubusercontent.com/fredlackey/devutils-cli/main/setup.sh)\" -- --no-prompt"
  fi

  # Create the test script to run inside the container
  local test_script=$(cat << 'INNERSCRIPT'
#!/bin/bash
set -e

echo "=== PRE-BOOTSTRAP STATE ==="
echo "Node.js installed: $(command -v node &>/dev/null && echo 'YES' || echo 'NO')"
echo "npm installed: $(command -v npm &>/dev/null && echo 'YES' || echo 'NO')"
echo "nvm installed: $([ -d "$HOME/.nvm" ] && echo 'YES' || echo 'NO')"
echo "dev installed: $(command -v dev &>/dev/null && echo 'YES' || echo 'NO')"
echo ""

echo "=== RUNNING BOOTSTRAP ==="
BOOTSTRAP_CMD

echo ""
echo "=== POST-BOOTSTRAP STATE ==="

# Source nvm to make node/npm available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Check results
ERRORS=0

if [ -d "$HOME/.nvm" ]; then
  echo "✓ nvm directory exists"
else
  echo "✗ nvm directory NOT found"
  ERRORS=$((ERRORS + 1))
fi

if command -v node &>/dev/null; then
  echo "✓ Node.js installed: $(node --version)"
else
  echo "✗ Node.js NOT installed"
  ERRORS=$((ERRORS + 1))
fi

if command -v npm &>/dev/null; then
  echo "✓ npm installed: $(npm --version)"
else
  echo "✗ npm NOT installed"
  ERRORS=$((ERRORS + 1))
fi

if command -v dev &>/dev/null; then
  echo "✓ DevUtils CLI installed: $(dev --version 2>/dev/null || echo 'version unknown')"
else
  echo "✗ DevUtils CLI NOT installed"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "=== ALL TESTS PASSED ==="
  exit 0
else
  echo "=== $ERRORS TEST(S) FAILED ==="
  exit 1
fi
INNERSCRIPT
)

  # Replace the placeholder with the actual bootstrap command
  test_script="${test_script/BOOTSTRAP_CMD/$bootstrap_cmd}"

  # Run the test
  local docker_args="-i --rm"
  if [[ "$USE_LOCAL" == "true" ]]; then
    docker_args="$docker_args -v $PROJECT_DIR:/app:ro"
  fi

  if echo "$test_script" | docker run $docker_args "$image_name" bash; then
    print_success "Bootstrap test PASSED for $platform"
    return 0
  else
    print_error "Bootstrap test FAILED for $platform"
    return 1
  fi
}

# Open interactive shell for debugging
open_shell() {
  local platform="${1:-ubuntu}"
  local image_name="devutils-bootstrap-test-$platform"

  print_header "Opening shell on $platform"

  build_image "$platform"

  local docker_args="-it --rm"
  if [[ "$USE_LOCAL" == "true" ]]; then
    docker_args="$docker_args -v $PROJECT_DIR:/app:ro"
  fi

  print_info "To test bootstrap manually, run:"
  if [[ "$USE_LOCAL" == "true" ]]; then
    echo "  bash /app/setup.sh --no-prompt"
  else
    echo "  bash -c \"\$(curl -LsS https://raw.githubusercontent.com/fredlackey/devutils-cli/main/setup.sh)\""
  fi
  echo ""

  docker run $docker_args "$image_name" bash
}

# Main
main() {
  print_header "DevUtils CLI Bootstrap Test"

  if [[ "$SHELL_MODE" == "true" ]]; then
    open_shell "$TARGET_PLATFORM"
    exit 0
  fi

  # Determine which platforms to test
  local platforms_to_test=()
  if [[ -n "$TARGET_PLATFORM" ]]; then
    platforms_to_test=("$TARGET_PLATFORM")
  else
    platforms_to_test=("${PLATFORMS[@]}")
  fi

  # Run tests
  local failed=0
  for platform in "${platforms_to_test[@]}"; do
    if ! run_test "$platform"; then
      failed=$((failed + 1))
    fi
  done

  # Summary
  echo ""
  print_header "Test Summary"

  local total=${#platforms_to_test[@]}
  local passed=$((total - failed))

  echo "Passed: $passed / $total"

  if [[ $failed -gt 0 ]]; then
    print_error "$failed test(s) failed"
    exit 1
  else
    print_success "All tests passed!"
    exit 0
  fi
}

main
