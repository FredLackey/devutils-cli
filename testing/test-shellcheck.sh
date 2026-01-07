#!/bin/bash
# Test script for the shellcheck installer
# This script tests the shellcheck installer in the current environment

set -e

echo "===================================================================="
echo "Testing shellcheck installer"
echo "===================================================================="
echo ""

# Show platform information
echo "Platform information:"
uname -a
echo ""

# Check if dev command is available
if ! command -v dev &> /dev/null; then
    echo "ERROR: dev command not found"
    exit 1
fi

echo "dev command found"
echo ""

# Show initial state - check if shellcheck is already installed
echo "Checking initial state..."
if command -v shellcheck &> /dev/null; then
    echo "shellcheck is already installed (before test):"
    shellcheck --version
    echo ""
fi

# Run the shellcheck installer
echo "Running: dev install shellcheck --force"
echo ""
dev install shellcheck --force

echo ""
echo "Installation command completed"
echo ""

# Verify shellcheck is installed
echo "Verifying installation..."
if ! command -v shellcheck &> /dev/null; then
    echo "ERROR: shellcheck command not found after installation"
    exit 1
fi

echo "shellcheck command found"
echo ""

# Show version
echo "shellcheck version:"
shellcheck --version
echo ""

# Test shellcheck on a sample script with errors
echo "Testing shellcheck on a sample script with errors:"
echo '#!/bin/bash
for f in $(ls *.txt); do
  echo $f
done' | shellcheck - || true
echo ""

# Test idempotency - run installer again
echo "Testing idempotency - running installer again..."
echo ""
dev install shellcheck --force

echo ""
echo "Second installation command completed"
echo ""

# Verify shellcheck is still installed
echo "Verifying shellcheck is still working..."
if ! command -v shellcheck &> /dev/null; then
    echo "ERROR: shellcheck command not found after second installation"
    exit 1
fi

echo "shellcheck command still works"
echo ""

echo "===================================================================="
echo "shellcheck installer test PASSED"
echo "===================================================================="
