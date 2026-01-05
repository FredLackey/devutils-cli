# @fredlackey/devutils (devutils-cli)

**Context for Gemini Agents**

This document provides a comprehensive overview of the `devutils-cli` project to guide interactions and code modifications.

## 1. Project Overview

`devutils-cli` is a cross-platform CLI tool designed to simplify developer environment setup. It replaces fragmented scripts and manual configuration with a unified interface (`dev`) that works consistently across macOS, Linux, and Windows.

*   **Primary Goal:** "One command, any platform, ready to code."
*   **Key Features:**
    *   **Unified Installation:** `dev install <tool>` (wraps brew, apt, choco, etc.)
    *   **Identity Management:** Manage multiple Git identities (work, personal) with automatic SSH key handling.
    *   **Configuration:** portable `~/.devutils` config file.
    *   **Git Ignore:** Smart management of `.gitignore` patterns.

## 2. Architecture & Structure

The project follows a modular structure where core logic is separated from platform-specific implementation details.

### Directory Layout

*   **`bin/`**: CLI entry point (`dev.js`).
*   **`src/commands/`**: Handlers for top-level commands (e.g., `dev install`, `dev configure`).
*   **`src/installs/`**: Platform-specific installation scripts for individual tools.
    *   `installers.json`: Metadata and dependency definitions for installers.
*   **`src/scripts/`**: Standalone utility scripts (e.g., `git-push`, `clone`).
*   **`src/utils/`**: Shared helpers (OS detection, file ops, etc.).
*   **`testing/`**: Docker-based testing infrastructure.

### Core Concepts

*   **Commands:** Multi-word operations (e.g., `dev identity add`). Located in `src/commands/`.
*   **Installs:** Self-contained modules in `src/installs/` responsible for installing a specific tool on various platforms. Each module exports `install`, `isInstalled`, and `isEligible` functions.
*   **Dependency Resolution:** Handled by `src/commands/install.js` using metadata from `src/installs/installers.json`.

## 3. Development Workflow

### Adding a New Tool Installer
1.  Create `src/installs/<tool-name>.js`.
2.  Implement platform-specific install functions (e.g., `install_macos`, `install_ubuntu`).
3.  Export standard functions: `install`, `isInstalled` (optional), `isEligible` (optional).
4.  Add metadata to `src/installs/installers.json` (dependencies, display name).

### Testing
**Crucial:** Do not test destructive commands on the local machine unless strictly necessary. Use the Docker-based test harness.

*   **Run All Tests:** `./testing/test.sh`
*   **Run Specific Platform:** `./testing/test.sh ubuntu`
*   **Run Specific Suite:** `./testing/test.sh ubuntu cli`
*   **Debug Shell:** `./testing/test.sh --shell ubuntu`

Refer to `ai-docs/LOCAL_TESTING.md` and `testing/README.md` for details.

## 4. Coding Conventions

*   **Language:** Node.js (CommonJS).
*   **Async/Await:** Use for all asynchronous operations.
*   **Idempotency:** **Critical.** All scripts must be idempotent (safe to run multiple times without side effects). Always check state before modifying.
*   **Error Handling:** Fail gracefully with informative error messages.
*   **Style:** Standard JS style, 2-space indentation.
*   **Documentation:** JSDoc for all functions.

## 5. Key File Locations

| File/Dir | Description |
| :--- | :--- |
| `package.json` | Project metadata and dependencies. |
| `bin/dev.js` | CLI entry point. |
| `src/commands/install.js` | Core logic for the install command and dependency resolution. |
| `src/installs/installers.json` | Registry of available installers and their dependencies. |
| `CLAUDE.md` | Context instructions for Claude (useful reference for conventions). |
| `testing/docker-compose.yml` | Definition of test environments. |

## 6. Supported Platforms

*   **macOS** (Homebrew)
*   **Ubuntu** (APT/Snap)
*   **Raspberry Pi OS** (APT/Snap)
*   **Amazon Linux** (DNF/YUM)
*   **Windows** (Chocolatey/winget)
*   **Git Bash** (Manual/Portable)
