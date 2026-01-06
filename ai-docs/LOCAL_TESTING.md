# Local Testing with Docker Containers

This document describes how to test the `devutils-cli` package in isolated Docker containers without executing anything on your local machine.

## Overview

Since `devutils-cli` installs software and modifies system configuration, testing directly on your machine is risky. Docker containers provide:

- **Isolation**: No changes to your host system
- **Reproducibility**: Consistent test environments
- **Multi-platform testing**: Test on Ubuntu, Raspberry Pi OS, Amazon Linux, etc.
- **Fast reset**: Destroy and recreate containers instantly

## Directory Structure

```
devutils-cli/
├── testing/
│   ├── README.md                  # Testing documentation
│   ├── test.sh                    # Main test runner (host script)
│   ├── docker-compose.yml         # Orchestration for all containers
│   ├── Dockerfile.ubuntu          # Ubuntu 22.04 LTS test image (headless)
│   ├── Dockerfile.ubuntu-desktop  # Ubuntu 22.04 with Xvfb + GNOME desktop
│   ├── Dockerfile.debian          # Debian 12 test image (headless)
│   ├── Dockerfile.amazonlinux     # Amazon Linux 2023 test image (headless)
│   ├── Dockerfile.fedora          # Fedora 39 test image (headless)
│   ├── Dockerfile.raspbian        # Raspberry Pi OS test image
│   ├── scripts/
│   │   ├── run-tests.sh           # Main test runner (container script)
│   │   ├── test-cli.sh            # CLI command tests
│   │   ├── test-configure.sh      # Configure command tests
│   │   ├── test-ignore.sh         # Ignore command tests
│   │   ├── test-identity.sh       # Identity command tests
│   │   ├── test-install.sh        # Install script tests
│   │   ├── clean-env.sh           # Clean test environment
│   │   └── refresh.sh             # Rebuild containers
│   └── fixtures/
│       ├── devutils-minimal.json  # Minimal valid config
│       ├── devutils-full.json     # Full config with identities
│       ├── devutils-invalid.json  # Invalid JSON for error testing
│       └── gitignore-existing.txt # Pre-existing .gitignore content
└── ...
```

## Platform Coverage

| Platform | Container Image | Package Manager | Desktop | Test Priority |
|----------|-----------------|-----------------|---------|---------------|
| Ubuntu 22.04 | `ubuntu:22.04` | APT / Snap | No (headless) | High |
| Ubuntu Desktop 22.04 | `ubuntu:22.04` | APT / Snap | Yes (Xvfb + GNOME) | High |
| Debian 12 | `debian:12` | APT / Snap | No (headless) | High |
| Fedora 39 | `fedora:39` | DNF | No (headless) | Medium |
| Amazon Linux 2023 | `amazonlinux:2023` | DNF | No (headless) | Medium |
| Raspberry Pi OS | `balenalib/raspberrypi3-debian` | APT / Snap | No | Medium |

### Platform Limitations

| Platform | Docker Support | Notes |
|----------|----------------|-------|
| **macOS** | Not possible | macOS cannot run in Docker; test on actual Mac hardware |
| **Windows** | Limited | Windows containers require Windows host with Hyper-V |
| **Git Bash** | Via Windows | Test Git Bash commands on Windows host or VM |
| **WSL** | Via Ubuntu | Ubuntu container simulates WSL environment; test WSL-specific code paths on actual WSL |

## Container Setup

### Base Dockerfile Pattern

Each Dockerfile follows this pattern:

```dockerfile
# testing/Dockerfile.ubuntu
FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install base dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (LTS version)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Create non-root test user (simulates real usage)
RUN useradd -m -s /bin/bash testuser \
    && echo "testuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Switch to test user
USER testuser

# Default command
CMD ["/bin/bash"]
```

### Docker Compose Configuration

```yaml
# testing/docker-compose.yml
version: '3.8'

services:
  ubuntu:
    build:
      context: ..
      dockerfile: testing/Dockerfile.ubuntu
    volumes:
      - ..:/app:ro                    # Mount source read-only
      - test-results:/results         # Persist test results
    environment:
      - TEST_PLATFORM=ubuntu
    command: ["./testing/scripts/run-tests.sh"]

  ubuntu-desktop:
    build:
      context: ..
      dockerfile: testing/Dockerfile.ubuntu-desktop
    volumes:
      - ..:/app:ro
      - test-results:/results
    environment:
      - TEST_PLATFORM=ubuntu-desktop
      - DISPLAY=:99
      - XDG_RUNTIME_DIR=/tmp/runtime-testuser
    # Start Xvfb virtual display before running tests
    command: ["/bin/bash", "-c", "mkdir -p /tmp/runtime-testuser && chmod 700 /tmp/runtime-testuser && Xvfb :99 -screen 0 1920x1080x24 & sleep 2 && ./testing/scripts/run-tests.sh"]

  debian:
    build:
      context: ..
      dockerfile: testing/Dockerfile.debian
    volumes:
      - ..:/app:ro
      - test-results:/results
    environment:
      - TEST_PLATFORM=debian
    command: ["./testing/scripts/run-tests.sh"]

  amazonlinux:
    build:
      context: ..
      dockerfile: testing/Dockerfile.amazonlinux
    volumes:
      - ..:/app:ro
      - test-results:/results
    environment:
      - TEST_PLATFORM=amazon_linux
    command: ["./testing/scripts/run-tests.sh"]

  fedora:
    build:
      context: ..
      dockerfile: testing/Dockerfile.fedora
    volumes:
      - ..:/app:ro
      - test-results:/results
    environment:
      - TEST_PLATFORM=fedora
    command: ["./testing/scripts/run-tests.sh"]

  raspbian:
    build:
      context: ..
      dockerfile: testing/Dockerfile.raspbian
    volumes:
      - ..:/app:ro
      - test-results:/results
    environment:
      - TEST_PLATFORM=raspbian
    command: ["./testing/scripts/run-tests.sh"]

volumes:
  test-results:
```

## Test Categories

### 1. CLI Command Tests

Test that all commands parse correctly and produce expected output.

```bash
# testing/scripts/test-cli.sh

#!/bin/bash
set -e

echo "=== CLI Command Tests ==="

# Test help output
dev --help
dev configure --help
dev status --help
dev install --help
dev ignore --help
dev identity --help

# Test version
dev --version

# Test status (should work without config)
dev status

# Test ignore --list
dev ignore --list

# Test install --list
dev install --list
```

### 2. Configuration Tests

Test the configure command and config file handling.

```bash
# Test non-interactive configure
echo -e "Test User\ntest@example.com\nhttps://example.com\nMIT\nnpm" | dev configure

# Verify config file created
cat ~/.devutils

# Test dev status with config
dev status

# Test configure --show
dev configure --show
```

### 3. Ignore Command Tests

Test the gitignore pattern functionality.

```bash
# testing/scripts/test-ignore.sh

#!/bin/bash
set -e

echo "=== Ignore Command Tests ==="

# Create a test git repository
mkdir -p /tmp/test-repo
cd /tmp/test-repo
git init

# Test adding node patterns
dev ignore node
cat .gitignore
grep "node_modules" .gitignore || exit 1

# Test duplicate detection
dev ignore node  # Should skip with message

# Test --force flag
dev ignore node --force

# Test --dry-run
dev ignore docker --dry-run

# Test multiple technologies
dev ignore macos
dev ignore vscode

# Verify section markers
grep "=== @fredlackey/devutils: node ===" .gitignore || exit 1
grep "=== end: node ===" .gitignore || exit 1
```

### 4. Identity Command Tests

Test identity management (SSH key generation, etc.).

```bash
# testing/scripts/test-identity.sh

#!/bin/bash
set -e

echo "=== Identity Command Tests ==="

# Test identity list (empty)
dev identity list

# Test identity add (non-interactive simulation)
# Note: SSH key generation requires user input for passphrase
# Use --no-ssh for automated testing
echo -e "work\nWork User\nwork@company.com\n" | dev identity add --no-ssh --no-gpg

# Verify identity created
dev identity list
grep "work" ~/.devutils || exit 1

# Test identity in git repo
mkdir -p /tmp/test-identity
cd /tmp/test-identity
git init
dev identity link .
git config user.email  # Should show work@company.com
```

### 5. Install Command Tests (Dry Run)

Test install scripts without actually installing software.

```bash
# testing/scripts/test-install.sh

#!/bin/bash
set -e

echo "=== Install Command Tests (Dry Run) ==="

# List available installs
dev install --list

# Test dry-run mode for each install script
for script in $(dev install --list | grep -v "^Available" | grep -v "^─" | grep -v "^Usage" | tr -d ' '); do
    if [ -n "$script" ]; then
        echo "Testing: dev install $script --dry-run"
        dev install "$script" --dry-run --force || echo "Warning: $script dry-run failed"
    fi
done
```

### 6. Full Install Tests (Destructive)

Actually install software in the container. Run these selectively.

```bash
# Only run in containers - NEVER on host
# testing/scripts/test-install-full.sh

#!/bin/bash
set -e

echo "=== Full Install Tests ==="
echo "WARNING: This will install software in the container"

# Ensure we're in a container
if [ ! -f /.dockerenv ]; then
    echo "ERROR: This script must run inside a Docker container"
    exit 1
fi

# Test actual installations
dev install node --force
node --version

# Test Docker installation (if Docker-in-Docker is configured)
# dev install docker --force
```

## Running Tests

### Quick Start

```bash
# Build and run all tests
cd devutils-cli
docker compose -f testing/docker-compose.yml up --build

# Run tests on specific platform
docker compose -f testing/docker-compose.yml up --build ubuntu

# Run interactively (for debugging)
docker compose -f testing/docker-compose.yml run --rm ubuntu /bin/bash
```

### Individual Container Testing

```bash
# Build Ubuntu test image
docker build -t devutils-cli-test-ubuntu -f testing/Dockerfile.ubuntu .

# Run interactive shell
docker run -it --rm \
    -v $(pwd):/app:ro \
    devutils-cli-test-ubuntu \
    /bin/bash

# Inside container:
cd /app
npm link
dev --help
```

### Test Matrix Script

```bash
#!/bin/bash
# testing/scripts/run-all-platforms.sh

PLATFORMS=(ubuntu ubuntu-desktop debian amazonlinux fedora raspbian)
RESULTS=()

for platform in "${PLATFORMS[@]}"; do
    echo "=========================================="
    echo "Testing on: $platform"
    echo "=========================================="

    if docker compose -f testing/docker-compose.yml run --rm "$platform"; then
        RESULTS+=("$platform: PASS")
    else
        RESULTS+=("$platform: FAIL")
    fi
done

echo ""
echo "=========================================="
echo "Test Results Summary"
echo "=========================================="
for result in "${RESULTS[@]}"; do
    echo "$result"
done
```

## Debugging in Containers

### Interactive Debugging

```bash
# Start container with bash
docker run -it --rm \
    -v $(pwd):/app \
    -w /app \
    ubuntu:22.04 \
    /bin/bash

# Inside container, install Node.js and test
apt-get update && apt-get install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git
npm install
npm link
dev configure  # Interactive test
```

### Inspecting Failed Containers

```bash
# Don't use --rm, so container persists after exit
docker run -it \
    -v $(pwd):/app \
    --name debug-container \
    ubuntu:22.04 \
    /bin/bash

# After exit, inspect the container
docker start -ai debug-container

# Or copy files out
docker cp debug-container:/home/testuser/.devutils ./debug-config.json

# Cleanup when done
docker rm debug-container
```

### Viewing Container Logs

```bash
# View logs from docker compose run
docker compose -f testing/docker-compose.yml logs ubuntu

# Follow logs in real-time
docker compose -f testing/docker-compose.yml logs -f
```

## Test Data and Fixtures

### Mock Configuration Files

Create test fixtures that can be mounted into containers:

```
testing/
├── fixtures/
│   ├── devutils-minimal.json      # Minimal valid config
│   ├── devutils-full.json         # Full config with identities
│   ├── devutils-invalid.json      # Invalid JSON for error testing
│   └── gitignore-existing.txt     # Pre-existing .gitignore content
```

```json
// testing/fixtures/devutils-minimal.json
{
  "user": {
    "name": "Test User",
    "email": "test@example.com"
  },
  "defaults": {
    "license": "MIT",
    "package_manager": "npm"
  },
  "created": "2024-01-01T00:00:00.000Z",
  "updated": "2024-01-01T00:00:00.000Z"
}
```

### Using Fixtures in Tests

```bash
# Copy fixture to expected location before testing
cp /app/testing/fixtures/devutils-minimal.json ~/.devutils

# Test that status reads it correctly
dev status
```

## Safety Guardrails

### Container-Only Enforcement

Add checks to destructive test scripts:

```bash
#!/bin/bash
# Refuse to run outside a container

if [ ! -f /.dockerenv ] && [ -z "$DOCKER_CONTAINER" ]; then
    echo "ERROR: This script must run inside a Docker container"
    echo "Run with: docker compose run --rm ubuntu ./testing/scripts/test-install-full.sh"
    exit 1
fi
```

### Read-Only Source Mount

Always mount the source directory as read-only to prevent accidental modifications:

```yaml
volumes:
  - ..:/app:ro  # Read-only mount
```

### Non-Root User

Run tests as a non-root user to simulate real-world usage:

```dockerfile
RUN useradd -m -s /bin/bash testuser
USER testuser
```

## Quick Reference

| Task | Command |
|------|---------|
| Build all images | `docker compose -f testing/docker-compose.yml build` |
| Run all tests | `docker compose -f testing/docker-compose.yml up` |
| Test on Ubuntu only | `docker compose -f testing/docker-compose.yml run --rm ubuntu` |
| Test desktop apps | `docker compose -f testing/docker-compose.yml run --rm ubuntu-desktop` |
| Interactive shell | `docker run -it --rm -v $(pwd):/app ubuntu:22.04 bash` |
| Clean up | `docker compose -f testing/docker-compose.yml down -v` |
| View logs | `docker compose -f testing/docker-compose.yml logs` |

## Next Steps

1. Create the `testing/` directory structure
2. Write Dockerfiles for each target platform
3. Implement test scripts in `testing/scripts/`
4. Create test fixtures in `testing/fixtures/`
5. Document platform-specific test requirements

## Appendix: Platform-Specific Notes

### Ubuntu

- Use `apt-get` for package installation
- Node.js via NodeSource repository
- Most straightforward testing environment
- Can simulate WSL environment for testing `isWSL()` detection
- **Headless only** — no GUI support, desktop apps return `"not_eligible"`

### Ubuntu Desktop

- Same as Ubuntu but with full GNOME desktop environment
- Uses **Xvfb** (X virtual framebuffer) for headless GUI testing
- Includes `ubuntu-desktop-minimal` package
- Display configured at `:99` with resolution `1920x1080x24`
- Use for testing desktop applications (VS Code, browsers, etc.)
- Desktop apps should return `"pass"` in this environment
- XDG directories properly configured for desktop integration

```bash
# Run tests for GUI applications
docker compose -f testing/docker-compose.yml run --rm ubuntu-desktop

# Interactive shell for debugging GUI apps
./testing/test.sh --shell ubuntu-desktop
```

### Raspberry Pi OS

- Use `apt-get` for package installation (same as Ubuntu)
- ARM architecture — use `balenalib/raspberrypi3-debian` or similar ARM images
- Some packages may not be available for ARM
- Test on actual Raspberry Pi hardware for complete coverage

### Amazon Linux

- Use `dnf` for package installation (AL2023) or `yum` (AL2)
- Node.js via `dnf module install nodejs:20`
- SELinux may affect some operations
- Primarily server-focused — no GUI testing needed

### macOS Testing

Since macOS cannot run in Docker:

1. **Local VM**: Use UTM or Parallels with macOS VM
2. **Physical hardware**: Test on actual Mac when available
3. **Remote access**: Use a Mac mini or cloud Mac service for testing

### Windows / Git Bash Testing

Windows containers have limitations:

1. **Windows Docker**: Requires Windows host with Hyper-V enabled
2. **Local VM**: Use VirtualBox, VMware, or Hyper-V with Windows VM
3. **Git Bash**: Test Git Bash scripts on Windows host with Git for Windows installed
4. **Physical hardware**: Test on actual Windows machine when available
