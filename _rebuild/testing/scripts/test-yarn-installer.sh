#!/usr/bin/env bash
#
# Test the yarn installer in a Docker container
# This script runs inside the container to test the yarn installation
#

set -e  # Exit on error

echo "========================================"
echo "Testing Yarn Installer"
echo "========================================"
echo ""

# Show platform information
echo "Platform Information:"
echo "  OS: $(uname -s)"
echo "  Kernel: $(uname -r)"
echo "  Architecture: $(uname -m)"
if [ -f /etc/os-release ]; then
  . /etc/os-release
  echo "  Distribution: $NAME $VERSION"
fi
echo ""

# Ensure we're in the app directory
cd /app

# Run the yarn installer
echo "Running yarn installer..."
node src/installs/yarn.js

# Check if installation succeeded
echo ""
echo "Verifying installation..."

# Check if yarn command exists
if ! command -v yarn &> /dev/null; then
  echo "FAIL: yarn command not found after installation"
  exit 1
fi

# Get yarn version
YARN_VERSION=$(yarn --version 2>&1 || echo "FAILED")
if [ "$YARN_VERSION" = "FAILED" ]; then
  echo "FAIL: yarn --version command failed"
  exit 1
fi

echo "SUCCESS: Yarn installed successfully"
echo "  Version: $YARN_VERSION"
echo ""

# Test yarn functionality
echo "Testing yarn functionality..."
mkdir -p /tmp/yarn-test
cd /tmp/yarn-test

# Initialize a test project
yarn init -y > /dev/null 2>&1

# Try to install a simple package
echo "Installing test package (lodash)..."
yarn add lodash > /dev/null 2>&1

# Verify the package was installed
if [ ! -d "node_modules/lodash" ]; then
  echo "FAIL: Test package installation failed"
  exit 1
fi

echo "SUCCESS: Yarn is working correctly"
echo ""
echo "========================================"
echo "All Tests Passed!"
echo "========================================"
