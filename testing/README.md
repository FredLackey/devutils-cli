# Testing

This directory contains Docker-based testing infrastructure for devutils-cli.
All tests run in isolated containers to prevent any changes to your local machine.

## Quick Start

```bash
# Run all tests on all platforms
./testing/test.sh

# Run tests on specific platform
./testing/test.sh ubuntu

# Run specific test suite on platform
./testing/test.sh ubuntu cli

# Open interactive shell for debugging
./testing/test.sh --shell ubuntu
```

## Directory Structure

```
testing/
├── README.md                    # This file
├── test.sh                      # Main test runner (host script)
├── docker-compose.yml           # Container orchestration
├── Dockerfile.ubuntu            # Ubuntu 22.04 test image
├── Dockerfile.debian            # Debian 12 test image
├── Dockerfile.amazonlinux       # Amazon Linux 2023 test image
├── Dockerfile.fedora            # Fedora 39 test image
├── scripts/
│   ├── run-tests.sh             # Main test runner (container script)
│   ├── test-cli.sh              # CLI command tests
│   ├── test-configure.sh        # Configure command tests
│   ├── test-ignore.sh           # Ignore command tests
│   ├── test-identity.sh         # Identity command tests
│   ├── test-install.sh          # Install command tests
│   ├── clean-env.sh             # Clean test environment
│   └── refresh.sh               # Rebuild containers from scratch
└── fixtures/
    ├── devutils-minimal.json    # Minimal valid config
    ├── devutils-full.json       # Full config with identities
    ├── devutils-invalid.json    # Invalid JSON for error testing
    └── gitignore-existing.txt   # Pre-existing .gitignore content
```

## Commands

### Running Tests

| Command | Description |
|---------|-------------|
| `./testing/test.sh` | Run all tests on all platforms |
| `./testing/test.sh ubuntu` | Run all tests on Ubuntu |
| `./testing/test.sh ubuntu cli` | Run CLI tests on Ubuntu |
| `./testing/test.sh debian ignore` | Run ignore tests on Debian |

### Managing Containers

| Command | Description |
|---------|-------------|
| `./testing/test.sh --shell ubuntu` | Open interactive shell |
| `./testing/test.sh --build` | Build images without running tests |
| `./testing/test.sh --clean` | Remove all containers and images |
| `./testing/test.sh --rebuild` | Clean and rebuild everything |

### Refreshing Environments

```bash
# Rebuild single platform from scratch
./testing/scripts/refresh.sh ubuntu

# Rebuild all platforms
./testing/scripts/refresh.sh --all
```

## Test Suites

| Suite | Description | Script |
|-------|-------------|--------|
| `cli` | Command parsing and help output | `test-cli.sh` |
| `configure` | Config file creation and updates | `test-configure.sh` |
| `ignore` | Gitignore pattern management | `test-ignore.sh` |
| `identity` | Identity profiles and SSH keys | `test-identity.sh` |
| `install` | Install scripts (dry-run only) | `test-install.sh` |

## Platforms

| Platform | Image | Package Manager |
|----------|-------|-----------------|
| Ubuntu 22.04 | `ubuntu:22.04` | APT |
| Debian 12 | `debian:12` | APT |
| Amazon Linux 2023 | `amazonlinux:2023` | DNF |
| Fedora 39 | `fedora:39` | DNF |

## Fixtures

Test fixtures in `testing/fixtures/` can be used to set up specific test scenarios:

```bash
# Inside container, use a fixture
cp /app/testing/fixtures/devutils-minimal.json ~/.devutils
dev status
```

## Debugging

### Interactive Shell

```bash
# Open shell in Ubuntu container
./testing/test.sh --shell ubuntu

# Inside container, you can:
dev --help
dev configure
dev status
cat ~/.devutils
```

### Viewing Logs

```bash
# View logs from docker compose
docker compose -f testing/docker-compose.yml logs

# Follow logs in real-time
docker compose -f testing/docker-compose.yml logs -f
```

### Inspecting Failed Containers

```bash
# Run without --rm to keep container after exit
docker compose -f testing/docker-compose.yml run ubuntu /bin/bash

# After exit, restart the container
docker start -ai testing-ubuntu-1

# Copy files from container
docker cp testing-ubuntu-1:/home/testuser/.devutils ./debug-config.json
```

## Clean Up

```bash
# Remove containers and volumes
./testing/test.sh --clean

# Full cleanup including build cache
docker compose -f testing/docker-compose.yml down --volumes --rmi all
docker builder prune -f
```
