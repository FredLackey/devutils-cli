# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Critical Rules

1. **Every script and command must be idempotent.** Running the same operation multiple times must produce the same result as running it once, with no errors or duplicated work. Always check current state before making changes.

2. **Syntax and documentation must be written for a junior developer to understand.** Use clear variable names, simple logic flow, plain language, and concrete examples. Explain "why" not just "what."

## Project Overview

DevUtils CLI is a globally-installable Node.js CLI toolkit for bootstrapping and managing development environments. It is being rebuilt from a rigid, opinionated tool into a config-driven, user-driven system.

### Design Philosophy (v0.0.19+)

The previous version (v0.0.18, preserved in `_rebuild/`) shipped hardcoded behaviors and dozens of global scripts. The new approach is:

- **Config-based**: Behavior is defined by user configuration, not baked-in opinions
- **User onboarding**: First run walks the user through setup, learning their preferences
- **Machine-aware**: Each machine gets its own profile, so a laptop and a server don't conflict
- **Plugin-extensible**: API wrappers ship as separate installable plugins, not bundled code
- **Managed workspace**: Temporary and config files live in `~/.devutils/`, not scattered across the system

### Legacy Code

The `_rebuild/` directory contains the full v0.0.18 codebase (commands, scripts, installers, utilities). Useful patterns should be pulled forward as needed, but the architecture is not carried over.

## Commands

```bash
npm install -g @fredlackey/devutils    # Install globally
npm test                               # No tests configured yet
```

## Architecture

### Terminology

| Term | Description | Location | Invocation |
|------|-------------|----------|------------|
| **Command** | CLI operations organized by service | `src/commands/` | `dev <service> <method>` |
| **Installer** | Platform-specific tool installation | `src/installers/` | `dev tools install <name>` |
| **Utility** | Complex multi-step functions | `src/utils/` | `dev util run <name>` |
| **Lib** | Internal shared modules (not user-facing) | `src/lib/` | Imported by other modules |
| **Plugin** | API wrapper packages (separate repos) | `~/.devutils/plugins/` | `dev api <service> ...` |

### Project Structure

```
src/
├── cli.js                  # CLI entry point and command router (package.json bin)
├── commands/               # One folder per service, one file per method
│   ├── config/             #   init, show, get, set, reset, export, import
│   ├── machine/            #   detect, show, set, list
│   ├── identity/           #   add, remove, list, show, link, unlink, sync
│   ├── tools/              #   install, check, list, search
│   ├── ignore/             #   add, remove, list, show
│   ├── util/               #   run, list, show, add, remove
│   ├── alias/              #   add, remove, list, sync
│   ├── auth/               #   login, logout, list, status, refresh
│   ├── api/                #   list, enable, disable, update
│   ├── ai/                 #   launch, resume, list, sessions, show, set
│   ├── search/             #   query, keyword, semantic, get, collections, index, status
│   └── *.js                #   Top-level: status, update, version, schema, help
├── api/                    # Plugin loader and registry (no API code itself)
├── installers/             # One file per tool, per-platform install functions
├── utils/                  # Built-in utility functions (git-status, clone, etc.)
├── lib/                    # Shared internal modules
│   ├── platform.js         #   OS/arch detection
│   ├── shell.js            #   Command execution wrappers
│   ├── detect.js           #   Output mode detection (AI/CI/TTY)
│   ├── output.js           #   Output formatting (json, table, yaml, csv)
│   ├── errors.js           #   Structured error handling
│   ├── config.js           #   ~/.devutils/ file management
│   ├── prompt.js           #   Interactive prompts
│   ├── github.js           #   gh CLI wrapper
│   ├── schema.js           #   Command introspection
│   └── platforms/          #   Per-platform helpers
└── patterns/               # Static pattern files (gitignore/, etc.)

research/                   # Design docs (not published to npm)
stories/                    # User stories for implementation (not published)
_rebuild/                   # Legacy v0.0.18 code (reference only)
```

### Configuration

User data lives in `~/.devutils/` (created during `dev config init`):

- `config.json` — User preferences, profile name, backup location
- `aliases.json` — Registered alias mappings
- `ai.json` — AI tool configurations
- `plugins.json` — Installed API plugin registry
- `machines/` — Machine profiles
- `auth/` — OAuth tokens and API credentials
- `plugins/` — Installed API plugin packages
- `utils/` — User-added custom utilities
- `bin/` — Generated alias wrapper scripts (added to PATH)
- `cache/` — Temporary data

## Code Style

- CommonJS modules (`require`/`module.exports`)
- 2-space indentation, LF line endings
- Async/await for all async operations
- JSDoc comments for all functions
- Shebang `#!/usr/bin/env node` on executable files

## Supported Platforms

macOS (Homebrew), Ubuntu (APT/Snap), Raspberry Pi OS (APT/Snap), Amazon Linux (DNF/YUM), Windows (Chocolatey/winget), Git Bash (Manual/Portable)
