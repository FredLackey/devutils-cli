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
- **Rule-driven**: Users define rules for folders, tools, and workflows; DevUtils enforces them
- **Managed workspace**: Temporary and config files live in `~/.devutils/`, not scattered across the system

### Legacy Code

The `_rebuild/` directory contains the full v0.0.18 codebase (commands, scripts, installers, utilities). Useful patterns should be pulled forward as needed, but the architecture is not carried over.

## Commands

```bash
npm install -g @fredlackey/devutils    # Install globally
npm test                               # No tests configured yet
```

## Architecture

### Project Structure

```
_rebuild/           # Legacy v0.0.18 code (reference only)
bin/                # CLI entry point (to be created)
src/                # New source code (to be created)
```

### Configuration

User configuration will live in `~/.devutils/` as a directory (replacing the old single `~/.devutils` JSON file):

- `~/.devutils/config.json` — User preferences, identity, defaults
- `~/.devutils/machines/` — Per-machine profiles
- `~/.devutils/rules/` — User-defined rules for folders, tools, workflows
- `~/.devutils/cache/` — Temporary/staging data

## Code Style

- CommonJS modules (`require`/`module.exports`)
- 2-space indentation, LF line endings
- Async/await for all async operations
- JSDoc comments for all functions
- Shebang `#!/usr/bin/env node` on executable files

## Supported Platforms

macOS (Homebrew), Ubuntu (APT/Snap), Raspberry Pi OS (APT/Snap), Amazon Linux (DNF/YUM), Windows (Chocolatey/winget), Git Bash (Manual/Portable)
