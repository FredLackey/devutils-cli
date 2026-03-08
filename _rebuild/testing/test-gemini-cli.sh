#!/bin/bash

# Test gemini-cli installer across all Docker-supported platforms
# This script tests the installer from src/installs/gemini-cli.js

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Platforms to test (Docker-testable only)
PLATFORMS=("ubuntu" "debian" "amazonlinux" "fedora")

# Track results
PASSED=()
FAILED=()

echo "========================================"
echo "Testing gemini-cli Installer"
echo "========================================"
echo ""

# Function to test a single platform
test_platform() {
    local platform=$1
    echo "----------------------------------------"
    echo "Testing platform: $platform"
    echo "----------------------------------------"

    # Start fresh container
    echo "Starting fresh $platform container..."
    docker compose -f "$SCRIPT_DIR/docker-compose.yml" run --rm "$platform" /bin/bash -c "
        set -e
        echo '=== Testing gemini-cli installation on $platform ==='

        # Run the installer
        echo 'Running gemini-cli installer...'
        node /app/src/installs/gemini-cli.js

        echo ''
        echo '=== Verification Phase ==='

        # Update PATH to include npm global bin directory
        export PATH=\"\$HOME/.npm-global/bin:\$PATH\"

        # Check if gemini command exists
        if command -v gemini >/dev/null 2>&1; then
            echo 'SUCCESS: gemini command is available in PATH'
        else
            echo 'ERROR: gemini command not found in PATH'
            exit 1
        fi

        # Check gemini version
        echo 'Checking gemini version...'
        gemini --version

        echo ''
        echo '=== Idempotency Test ==='

        # Run installer again to test idempotency
        echo 'Running installer a second time (idempotency test)...'
        node /app/src/installs/gemini-cli.js

        # Verify it still works
        if command -v gemini >/dev/null 2>&1; then
            echo 'SUCCESS: gemini command still available after second run'
            gemini --version
        else
            echo 'ERROR: gemini command not found after second run'
            exit 1
        fi

        echo ''
        echo '=== All tests passed for $platform ==='
    "

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}PASSED: $platform${NC}"
        PASSED+=("$platform")
    else
        echo -e "${RED}FAILED: $platform${NC}"
        FAILED+=("$platform")
    fi

    echo ""
}

# Test each platform
for platform in "${PLATFORMS[@]}"; do
    test_platform "$platform"
done

# Print summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo ""

if [ ${#PASSED[@]} -gt 0 ]; then
    echo -e "${GREEN}Passed (${#PASSED[@]}):${NC}"
    for p in "${PASSED[@]}"; do
        echo "  - $p"
    done
    echo ""
fi

if [ ${#FAILED[@]} -gt 0 ]; then
    echo -e "${RED}Failed (${#FAILED[@]}):${NC}"
    for p in "${FAILED[@]}"; do
        echo "  - $p"
    done
    echo ""
    exit 1
else
    echo -e "${GREEN}All platforms passed!${NC}"
    exit 0
fi
