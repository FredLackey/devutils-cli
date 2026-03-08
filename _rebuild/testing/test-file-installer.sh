#!/bin/bash
# Test script for the file installer
# This script tests the file installer in the current environment

set -e

echo "===================================================================="
echo "Testing file installer"
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

# Show initial state - check if file is already installed
echo "Checking initial state..."
if command -v file &> /dev/null; then
    echo "file is already installed (before test):"
    file --version
    echo ""
fi

# Run the file installer
echo "Running: dev install file --force"
echo ""
dev install file --force

echo ""
echo "Installation command completed"
echo ""

# Verify file is installed
echo "Verifying installation..."
if ! command -v file &> /dev/null; then
    echo "ERROR: file command not found after installation"
    exit 1
fi

echo "file command found"
echo ""

# Show version
echo "file version:"
file --version
echo ""

# Test file detection
echo "Testing file detection on /bin/ls:"
file /bin/ls
echo ""

# Test idempotency - run installer again
echo "Testing idempotency - running installer again..."
echo ""
dev install file --force

echo ""
echo "Second installation command completed"
echo ""

# Verify file is still installed
echo "Verifying file is still working..."
if ! command -v file &> /dev/null; then
    echo "ERROR: file command not found after second installation"
    exit 1
fi

echo "file command still works"
echo ""

echo "===================================================================="
echo "file installer test PASSED"
echo "===================================================================="
