#!/bin/bash

# Test yq installer in Docker containers
# This script tests the yq installer across all supported platforms

set -e

PLATFORM=$1

if [ -z "$PLATFORM" ]; then
  echo "Usage: $0 <platform>"
  echo "Available platforms: ubuntu, debian, amazonlinux, fedora"
  exit 1
fi

echo "Testing yq installer on $PLATFORM..."

# Run the test in a fresh container
docker compose -f testing/docker-compose.yml run --rm $PLATFORM /bin/bash -c '
  set -e

  echo "========================================="
  echo "Testing yq installer on '"$PLATFORM"'"
  echo "========================================="

  # Show environment info
  echo ""
  echo "--- Environment Info ---"
  cat /etc/os-release | head -n 5
  echo ""

  # Test 1: Check that yq is not installed initially
  echo "--- Test 1: Verify yq not installed initially ---"
  if command -v yq &> /dev/null; then
    echo "FAIL: yq is already installed"
    yq --version
  else
    echo "PASS: yq is not installed"
  fi
  echo ""

  # Test 2: Run the yq installer
  echo "--- Test 2: Run yq installer ---"
  cd /app
  node src/installs/yq.js
  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo "FAIL: yq installer exited with code $EXIT_CODE"
    exit 1
  fi
  echo "PASS: yq installer completed successfully"
  echo ""

  # Test 3: Verify yq is now installed
  echo "--- Test 3: Verify yq is installed ---"
  if command -v yq &> /dev/null; then
    echo "PASS: yq command found"
    yq --version
  else
    echo "FAIL: yq command not found after installation"
    exit 1
  fi
  echo ""

  # Test 4: Test yq functionality
  echo "--- Test 4: Test yq functionality ---"
  echo "name: yq
version: 4.50.1" | yq ".name"
  if [ $? -eq 0 ]; then
    echo "PASS: yq can parse YAML"
  else
    echo "FAIL: yq cannot parse YAML"
    exit 1
  fi
  echo ""

  # Test 5: Run installer again (idempotency test)
  echo "--- Test 5: Test idempotency (run installer again) ---"
  node src/installs/yq.js
  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo "FAIL: yq installer failed on second run (not idempotent)"
    exit 1
  fi
  echo "PASS: yq installer is idempotent"
  echo ""

  # Test 6: Verify yq is still working
  echo "--- Test 6: Verify yq still works after second run ---"
  if command -v yq &> /dev/null; then
    echo "PASS: yq command still found"
    yq --version
  else
    echo "FAIL: yq command not found after second run"
    exit 1
  fi
  echo ""

  echo "========================================="
  echo "ALL TESTS PASSED for '"$PLATFORM"'"
  echo "========================================="
'

echo ""
echo "yq installer test completed successfully on $PLATFORM"
