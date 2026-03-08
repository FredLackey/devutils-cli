# Claude Code Commands and Agents

This document explains the custom Claude Code CLI commands and agents used in the DevUtils CLI project. These tools automate the research, documentation, and creation of cross-platform installer scripts.

## Table of Contents

- [Overview](#overview)
- [Commands vs Agents: What's the Difference?](#commands-vs-agents-whats-the-difference)
- [Commands Reference](#commands-reference)
  - [/setup-context](#setup-context)
  - [/build-installer](#build-installer)
  - [/identify-installer-dependencies](#identify-installer-dependencies)
  - [/add-isinstalled-functions](#add-isinstalled-functions)
  - [/test-installers](#test-installers)
  - [/create-alias-scripts](#create-alias-scripts)
- [Agents Reference](#agents-reference)
  - [install-research-docs](#install-research-docs)
  - [devops-installer-builder](#devops-installer-builder)
  - [install-deps-analyzer](#install-deps-analyzer)
  - [installer-status-validator](#installer-status-validator)
  - [install-tester](#install-tester)
  - [dotfiles-script-migrator](#dotfiles-script-migrator)
- [The Installer Pipeline](#the-installer-pipeline)
- [Status Workflow](#status-workflow)
- [Examples](#examples)

---

## Overview

This project uses **Claude Code CLI** (the AI-powered command-line tool) to automate repetitive DevOps tasks. Instead of manually researching how to install Docker on six different operating systems, we use AI agents to:

1. Research official installation methods
2. Write comprehensive documentation
3. Generate cross-platform installer scripts
4. Validate and test the installers

All custom commands and agents live in the `.claude/` folder:

```
.claude/
├── commands/     # User-invocable slash commands
│   ├── setup-context.md
│   ├── build-installer.md
│   ├── identify-installer-dependencies.md
│   ├── add-isinstalled-functions.md
│   ├── test-insallers.md
│   └── create-alias-scripts.md
└── agents/       # Specialized AI agents (called by commands or manually)
    ├── install-research-docs.md
    ├── devops-installer-builder.md
    ├── install-deps-analyzer.md
    ├── installer-status-validator.md
    ├── install-tester.md
    └── dotfiles-script-migrator.md
```

---

## Commands vs Agents: What's the Difference?

Understanding this distinction is crucial:

### Commands (Slash Commands)

- **Location:** `.claude/commands/`
- **How to use:** Type `/command-name` in Claude Code CLI
- **Purpose:** Entry points that orchestrate work across multiple technologies or agents
- **Analogy:** Like a manager who assigns tasks to workers

**Example:** `/build-installer` processes ALL pending technologies in the queue, calling agents for each one.

### Agents (Specialized Workers)

- **Location:** `.claude/agents/`
- **How to use:** Called automatically by commands OR manually via the Task tool
- **Purpose:** Focused specialists that do ONE specific job well
- **Analogy:** Like skilled workers who each have a specialty

**Example:** The `install-research-docs` agent researches and documents installation procedures for ONE technology.

### The Relationship

```
┌─────────────────────────────────────────────────────────┐
│  You type: /build-installer                             │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Command reads installers.json, finds pending items     │
│  For EACH pending technology:                           │
│    1. Spawns install-research-docs agent                │
│    2. Waits for completion                              │
│    3. Spawns devops-installer-builder agent             │
│    4. Waits for completion                              │
│    5. Updates status to "test-pending"                  │
│    6. Repeats for next technology                       │
└─────────────────────────────────────────────────────────┘
```

---

## Commands Reference

### /add-installer

**File:** `.claude/commands/add-installer.md`

**Purpose:** Adds a new technology to the installer queue after researching and confirming platform support with the user.

**What it does:**
1. Takes a technology name as input (handles typos and abbreviations)
2. Researches the technology via web search to determine:
   - Official name
   - Type (CLI tool, desktop app, etc.)
   - Platform availability
   - Installation methods
3. Checks for duplicates in `installers.json`
4. Asks the user to confirm the findings
5. Creates a properly structured entry in `src/installs/installers.json`
6. Provides next steps for completing the installer

**Arguments:** Technology name (e.g., "redis", "postman", "vscod")

**Output:**
- Adds entry to `src/installs/installers.json` with status `"pending"`

**When to use:** When you want to add support for installing a new tool or application.

**Example:**
```
> /add-installer redis
> /add-installer terraform
> /add-installer vscode  # handles abbreviations
```

**What happens next:** After adding, run these commands in order:
1. `/build-installer` - Creates documentation and installer script
2. `/identify-installer-dependencies` - Documents dependencies
3. `/add-isinstalled-functions` - Adds verification functions
4. `/test-installers` - Tests in Docker containers

---

### /setup-context

**File:** `.claude/commands/setup-context.md`

**Purpose:** Loads essential project context files into the conversation so Claude understands the project structure.

**What it does:**
- Reads `README.md` and `CLAUDE.md`
- Establishes baseline understanding of the project

**When to use:** At the start of a new conversation when you want Claude to understand the DevUtils CLI project.

**Example:**
```
> /setup-context
```

---

### /build-installer

**File:** `.claude/commands/build-installer.md`

**Purpose:** Processes ALL technologies with `"status": "pending"` in `src/installs/installers.json`, creating documentation and installer scripts for each.

**What it does:**
1. Reads `installers.json` to find pending technologies
2. For EACH pending technology (one at a time):
   - Calls the `install-research-docs` agent to create documentation
   - Calls the `devops-installer-builder` agent to create the installer script
   - Updates status from `"pending"` to `"test-pending"`
3. Repeats until no pending technologies remain
4. Provides a final summary

**Agents it uses:**
- `install-research-docs` (creates `{technology}.md`)
- `devops-installer-builder` (creates `{technology}.js`)

**Output files:**
- `src/installs/{technology}.md` - Installation documentation
- `src/installs/{technology}.js` - Installer script

**When to use:** When you have added new technologies to `installers.json` with `"status": "pending"` and want to generate their documentation and installers.

**Example:**
```
> /build-installer
```

**Important rules:**
- Processes ONE technology at a time (no batching)
- Must complete both agents before moving to the next technology
- Continues until ALL pending items are processed

---

### /identify-installer-dependencies

**File:** `.claude/commands/identify-installer-dependencies.md`

**Purpose:** Analyzes ALL technologies with `"status": "test-pending"` to document their dependencies in the markdown files.

**What it does:**
1. Reads `installers.json` to find test-pending technologies
2. Filters out technologies that already have a `## Dependencies` section
3. Spawns up to 5 `install-deps-analyzer` agents IN PARALLEL
4. Each agent analyzes one technology and updates its markdown file
5. Updates `src/installs/dependencies.md` with a summary

**Agents it uses:**
- `install-deps-analyzer` (up to 5 in parallel)

**Output files:**
- Updates `src/installs/{technology}.md` with `## Dependencies` section
- Creates/updates `src/installs/dependencies.md` summary

**When to use:** After running `/build-installer` to ensure all installer documentation includes dependency information.

**Example:**
```
> /identify-installer-dependencies
```

**Important rules:**
- Runs UP TO 5 agents in parallel (for efficiency)
- Skips technologies that already have dependencies documented
- Does NOT change the status in `installers.json`

---

### /add-isinstalled-functions

**File:** `.claude/commands/add-isinstalled-functions.md`

**Purpose:** Validates and adds missing `isInstalled` functions to ALL test-pending installer scripts.

**What it does:**
1. Reads `installers.json` to find test-pending technologies
2. For each technology, spawns an `installer-status-validator` agent
3. The agent checks if the script has all required `isInstalled` functions:
   - `isInstalled()` (main dispatcher)
   - `isInstalled_macos()`
   - `isInstalled_ubuntu()`
   - `isInstalled_raspbian()`
   - `isInstalled_amazon_linux()`
   - `isInstalled_windows()`
   - `isInstalled_gitbash()`
4. If functions are missing, the agent researches and implements them
5. Provides a summary of what was added

**Agents it uses:**
- `installer-status-validator` (up to 5 in parallel)

**Output:**
- Updates `src/installs/{technology}.js` with missing `isInstalled` functions

**When to use:** After running `/build-installer` to ensure all installer scripts can verify if the software is already installed.

**Example:**
```
> /add-isinstalled-functions
```

---

### /test-installers

**File:** `.claude/commands/test-insallers.md` (note: filename has a typo)

**Purpose:** Tests ALL technologies with `"status": "test-pending"` using Docker test harnesses.

**What it does:**
1. Reads `installers.json` to find test-pending technologies
2. For EACH technology (one at a time):
   - Calls the `install-tester` agent
   - The agent runs the installer in fresh Docker containers
   - Tests on: Ubuntu, Ubuntu Desktop, Debian, Amazon Linux, Fedora
   - If tests FAIL, the agent fixes the installer and re-tests
   - Records results in the `test_results` array
   - Updates status from `"test-pending"` to `"ready"`
3. Provides a final summary

**Agents it uses:**
- `install-tester` (one at a time, sequential)

**Docker environments tested:**
| Environment | Desktop | Package Manager |
|-------------|---------|-----------------|
| Ubuntu 22.04 | No (headless) | APT |
| Ubuntu Desktop 22.04 | Yes (Xvfb) | APT |
| Debian 12 | No (headless) | APT |
| Amazon Linux 2023 | No (headless) | DNF |
| Fedora 39 | No (headless) | DNF |

**Platforms NOT tested (no Docker support):**
- macOS
- Windows
- Git Bash
- Raspberry Pi OS

**When to use:** After running `/build-installer` and `/add-isinstalled-functions` to validate that installers actually work.

**Example:**
```
> /test-installers
```

**Important rules:**
- Processes ONE technology at a time (no parallel testing)
- Agent must FIX failures and re-test until passing
- Desktop apps return `"not_eligible"` in headless environments (this is correct)

---

### /create-alias-scripts

**File:** `.claude/commands/create-alias-scripts.md`

**Purpose:** Migrates shell aliases from legacy dotfiles to cross-platform Node.js scripts.

**What it does:**
1. Scans all `*.js` files in `src/scripts/`
2. Checks each for the required pattern (9 exported functions)
3. Identifies incomplete scripts
4. For each incomplete script, spawns a `dotfiles-script-migrator` agent
5. Updates `src/scripts/STATUS.md` with progress

**Required pattern for a complete script:**
```javascript
do_{alias}              // Main entry point
do_{alias}_nodejs       // Pure Node.js implementation
do_{alias}_macos
do_{alias}_ubuntu
do_{alias}_raspbian
do_{alias}_amazon_linux
do_{alias}_cmd          // Windows Command Prompt
do_{alias}_powershell   // Windows PowerShell
do_{alias}_gitbash      // Git Bash
```

**Agents it uses:**
- `dotfiles-script-migrator` (up to 5 in parallel)

**Output:**
- Updates `src/scripts/{alias}.js` with full cross-platform implementation
- Updates `src/scripts/STATUS.md` with migration status

**When to use:** When migrating shell aliases to cross-platform Node.js scripts.

**Example:**
```
> /create-alias-scripts
```

---

## Agents Reference

### install-research-docs

**File:** `.claude/agents/install-research-docs.md`

**Model:** Opus (high-quality, thorough)

**Purpose:** Researches and documents installation procedures for a single technology across all supported platforms.

**What it produces:**
A comprehensive markdown file (`src/installs/{technology}.md`) with:
- Overview of the tool
- Prerequisites
- Platform-specific installation steps for:
  - macOS (Homebrew)
  - Ubuntu/Debian (APT)
  - Raspberry Pi OS (APT)
  - Amazon Linux (YUM/DNF)
  - Windows (Chocolatey/winget)
  - WSL
  - Git Bash
- Verification steps
- Troubleshooting

**Key rules:**
- All commands must be **non-interactive** (use `-y`, `--silent`, etc.)
- Pick ONE definitive approach per platform (no alternatives)
- Write for junior developers

**Example prompt:**
```
Research and document the installation procedures for docker across all supported platforms.
```

---

### devops-installer-builder

**File:** `.claude/agents/devops-installer-builder.md`

**Model:** Opus (high-quality, thorough)

**Purpose:** Builds the actual installer script (`{technology}.js`) based on the documentation.

**What it produces:**
A Node.js installer script with:
- `install_macos()`
- `install_ubuntu()`
- `install_ubuntu_wsl()`
- `install_raspbian()`
- `install_amazon_linux()`
- `install_windows()`
- Main `install()` function with platform routing

**Key rules:**
- Must be **idempotent** (check before install)
- Use utilities from `src/utils/`
- **Never throw errors** for unsupported platforms (return gracefully)
- Follow existing patterns in `src/installs/`

**Example prompt:**
```
Build the installer script for docker.
```

---

### install-deps-analyzer

**File:** `.claude/agents/install-deps-analyzer.md`

**Model:** Sonnet (fast, efficient)

**Purpose:** Analyzes an installer script to identify and document dependencies.

**What it produces:**
Updates the markdown file with a `## Dependencies` section listing:
- **Required** dependencies (must be present)
- **Optional** dependencies (enhance functionality)
- **Auto-installed** dependencies (handled by package managers)

For each dependency, includes the command to install it.

**Example prompt:**
```
Analyze the dependencies for the docker installer.
```

---

### installer-status-validator

**File:** `.claude/agents/installer-status-validator.md`

**Model:** Sonnet (fast, efficient)

**Purpose:** Validates that an installer has the required `isInstalled` functions and implements missing ones.

**What it checks:**
- `isInstalled()` main function exists
- All 6 platform-specific `isInstalled_{platform}()` functions exist
- Functions properly use `os.detect()` for platform routing
- Functions return boolean values

**If functions are missing:**
1. Reads the markdown documentation
2. Analyzes the installer script
3. Uses web search if needed
4. Implements the missing functions using `src/utils/` utilities

**Example prompt:**
```
Validate and implement isInstalled functions for Docker
```

---

### install-tester

**File:** `.claude/agents/install-tester.md`

**Model:** Sonnet (fast, efficient)

**Purpose:** Tests an installer script using Docker containers and fixes any issues found.

**What it does:**
1. Reads `testing/README.md` for test harness instructions
2. Reads the installer script and documentation
3. For each Docker-supported platform:
   - Starts a fresh container
   - Calls `isEligible()` first
   - If eligible, calls `install()`
   - Verifies installation succeeded
   - Records result: `pass`, `fail`, or `not_eligible`
4. If any test fails:
   - Diagnoses the error
   - Fixes the installer code
   - Re-tests until passing

**Example prompt:**
```
Test the docker installer following docs/TESTING_REQUIREMENTS.md.
```

---

### dotfiles-script-migrator

**File:** `.claude/agents/dotfiles-script-migrator.md`

**Model:** Opus (high-quality, thorough)

**Purpose:** Migrates a shell alias from legacy dotfiles to a cross-platform Node.js script.

**What it does:**
1. Searches `research/dotfiles/` for the alias definition
2. Analyzes what the alias does
3. Creates a Node.js script with:
   - `do_{alias}_nodejs()` - Pure Node.js implementation
   - 7 platform-specific functions
   - Main `do_{alias}()` dispatcher

**Key philosophy:**
- **Prefer pure Node.js** for file I/O, JSON, HTTP, paths
- **Use native tools when superior** (rsync, git, tar, ffmpeg)
- Platform functions should delegate to `_nodejs` when no OS-specific code is needed

**Example prompt:**
```
Migrate the 'afk' script to the full cross-platform pattern.
```

---

## The Installer Pipeline

Here's how the commands and agents work together to create a complete installer:

```
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: Add technology to installers.json with "status": "pending"
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: Run /build-installer                                      │
│   └─ install-research-docs agent → creates {tech}.md             │
│   └─ devops-installer-builder agent → creates {tech}.js          │
│   └─ Status changes: "pending" → "test-pending"                  │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: Run /identify-installer-dependencies                      │
│   └─ install-deps-analyzer agent → updates {tech}.md             │
│   └─ Adds ## Dependencies section                                │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 4: Run /add-isinstalled-functions                            │
│   └─ installer-status-validator agent → updates {tech}.js        │
│   └─ Adds isInstalled functions if missing                       │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 5: Run /test-installers                                      │
│   └─ install-tester agent → tests in Docker                      │
│   └─ Fixes any issues and re-tests                               │
│   └─ Status changes: "test-pending" → "ready"                    │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ DONE: Technology is ready for use!                                │
│   - src/installs/{tech}.md (documentation)                       │
│   - src/installs/{tech}.js (installer script)                    │
│   - Status: "ready"                                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Status Workflow

Technologies in `installers.json` move through these statuses:

| Status | Meaning | Next Step |
|--------|---------|-----------|
| `pending` | Not yet processed | Run `/build-installer` |
| `test-pending` | Documentation and installer created | Run `/test-installers` |
| `fixes-pending` | Testing found issues | Agent fixes and re-tests |
| `ready` | Fully tested and production-ready | Deploy! |

---

## Examples

### Example 1: Add a new installer for Redis

```bash
# 1. Add Redis to the installer queue
> /add-installer redis

# Claude will:
# - Research Redis to verify the technology
# - Determine platform support (macOS, Ubuntu, etc.)
# - Ask you to confirm the details
# - Add entry to src/installs/installers.json with status "pending"

# 2. Run the build command to create docs and installer
> /build-installer

# Output:
# - Created src/installs/redis.md
# - Created src/installs/redis.js
# - Status updated to "test-pending"

# 3. Run dependency analysis
> /identify-installer-dependencies

# 4. Add isInstalled functions
> /add-isinstalled-functions

# 5. Test the installer
> /test-installers

# Output:
# - Tested on Ubuntu, Debian, Amazon Linux, Fedora
# - Status updated to "ready"
```

### Example 2: Migrate a shell alias to cross-platform script

```bash
# Run the migration command
> /create-alias-scripts

# Or manually migrate a specific alias:
# Use Task tool with dotfiles-script-migrator agent
# Prompt: "Migrate the 'git-push' script to the full cross-platform pattern."
```

### Example 3: Test a specific installer manually

```bash
# Use Task tool with install-tester agent
# Prompt: "Test the docker installer following docs/TESTING_REQUIREMENTS.md."
```

---

## Quick Reference Table

| Command | What it does | Agents used | Parallelism |
|---------|--------------|-------------|-------------|
| `/add-installer` | Adds new technology to queue | None (uses web search) | N/A |
| `/setup-context` | Loads project context | None | N/A |
| `/build-installer` | Creates docs + installers | install-research-docs, devops-installer-builder | Sequential |
| `/identify-installer-dependencies` | Documents dependencies | install-deps-analyzer | Up to 5 parallel |
| `/add-isinstalled-functions` | Adds isInstalled functions | installer-status-validator | Up to 5 parallel |
| `/test-installers` | Tests in Docker containers | install-tester | Sequential |
| `/create-alias-scripts` | Migrates shell aliases | dotfiles-script-migrator | Up to 5 parallel |

---

## Troubleshooting

### "No pending technologies found"
Check `src/installs/installers.json` - ensure you've added entries with `"status": "pending"`.

### Agent seems stuck
Some agents (especially install-research-docs and devops-installer-builder) use the Opus model which is thorough but slower. Be patient.

### Docker tests fail
- Ensure Docker is running
- Check `testing/README.md` for setup instructions
- Remember: macOS, Windows, and Raspberry Pi OS cannot be tested in Docker

### Script missing functions after migration
Run `/add-isinstalled-functions` to add missing `isInstalled` functions, or manually trigger the `installer-status-validator` agent.
