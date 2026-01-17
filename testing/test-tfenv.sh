#!/bin/bash
# ##############################################################################
# TFENV INSTALLER TEST SCRIPT
# ##############################################################################
#
# Tests the tfenv installer across all Docker environments.
# This script runs inside Docker containers and tests:
# 1. isEligible() - whether the installer should run on this platform
# 2. install() - whether the installation succeeds
# 3. isInstalled() - whether tfenv is properly installed
#
# ##############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "======================================================================"
echo "Testing tfenv installer"
echo "======================================================================"
echo ""

# Detect the platform we're running on
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS_NAME="$ID"
  OS_VERSION="$VERSION_ID"
else
  OS_NAME="unknown"
  OS_VERSION="unknown"
fi

echo "Platform: $OS_NAME $OS_VERSION"
echo ""

# Test the installer
cd "$PROJECT_DIR"

echo "Step 1: Testing isEligible()"
echo "----------------------------------------------------------------------"
ELIGIBLE=$(node -e "
  const installer = require('./src/installs/tfenv.js');
  console.log(installer.isEligible());
")

echo "isEligible() returned: $ELIGIBLE"
echo ""

if [ "$ELIGIBLE" = "false" ]; then
  echo -e "${YELLOW}Result: not_eligible${NC}"
  echo "This platform is not eligible for tfenv installation."
  exit 0
fi

echo "Step 2: Testing install()"
echo "----------------------------------------------------------------------"
if node -e "
  const installer = require('./src/installs/tfenv.js');
  installer.install().catch(err => {
    console.error('Installation failed:', err.message);
    process.exit(1);
  });
"; then
  echo -e "${GREEN}Installation completed successfully${NC}"
else
  echo -e "${RED}Installation failed${NC}"
  echo -e "${RED}Result: fail${NC}"
  exit 1
fi
echo ""

echo "Step 3: Testing isInstalled()"
echo "----------------------------------------------------------------------"
INSTALLED=$(node -e "
  const installer = require('./src/installs/tfenv.js');
  installer.isInstalled().then(result => {
    console.log(result);
  });
")

echo "isInstalled() returned: $INSTALLED"
echo ""

if [ "$INSTALLED" = "true" ]; then
  echo -e "${GREEN}Result: pass${NC}"
  echo ""
  echo "Step 4: Verifying tfenv functionality"
  echo "----------------------------------------------------------------------"

  # Source the shell config to get tfenv in PATH
  if [ -f ~/.bashrc ]; then
    source ~/.bashrc
  fi

  # Try to run tfenv --version
  if command -v tfenv &> /dev/null; then
    echo "tfenv command found in PATH"
    tfenv --version || echo "Warning: tfenv --version failed, but command exists"
  elif [ -f ~/.tfenv/bin/tfenv ]; then
    echo "tfenv installed at ~/.tfenv/bin/tfenv"
    ~/.tfenv/bin/tfenv --version || echo "Warning: tfenv --version failed, but binary exists"
  else
    echo -e "${YELLOW}Warning: tfenv binary exists but may not be in PATH yet${NC}"
    echo "This is expected - PATH changes require a new shell session"
  fi

  exit 0
else
  echo -e "${RED}Result: fail${NC}"
  echo "tfenv was not detected after installation"
  exit 1
fi
