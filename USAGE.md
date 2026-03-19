# DevUtils CLI — Developer Usage Guide

This document explains how to install, configure, and use `devutils-cli` as it stands today. The README covers available services and commands at a high level. This guide focuses on what you actually run and in what order.

## Installation

```bash
npm install -g @fredlackey/devutils
```

Requires Node.js 18 or later. After install, the `dev` command is available globally.

To verify:

```bash
dev version
```

## First Run

The first thing to do on any machine is initialize your configuration:

```bash
dev config init
```

This walks you through a short setup and creates `~/.devutils/` with the following structure:

```
~/.devutils/
  config.json       # main config (name, email, backup backend, profile)
  aliases.json      # registered alias mappings
  ai.json           # AI tool configurations
  plugins.json      # installed API plugin registry
  sync.json         # last backup timestamp
  machines/         # machine profiles
  auth/             # OAuth tokens and API credentials
  plugins/          # installed API plugin packages
  utils/            # user-added custom utilities
  bin/              # generated alias wrapper scripts
  cache/            # temporary data
```

You'll be prompted for:

- Your name and email
- An optional URL
- Backup backend (`repo` or `gist`)
- A profile name for this machine (defaults to `default`)
- Whether to add `~/.devutils/bin` to your PATH

The PATH addition is optional but recommended if you plan to use the `alias` or `util` features. It appends one line to your shell config (`.zshrc`, `.bashrc`, or `config.fish`) and is idempotent — running init again won't add it twice.

## Checking Status

```bash
dev status
```

Shows a dashboard of what's configured on this machine: config health, machine detection, auth services, aliases, plugins, and last sync time. Run this after init and again after `machine detect` to confirm everything looks right.

## Detecting Your Machine

```bash
dev machine detect
```

Probes the current machine and writes a profile to `~/.devutils/machines/current.json`. Captures OS, architecture, CPU, memory, and which package managers are installed (brew, apt, npm, etc.). Most other commands rely on this data to know what tools to use.

## Reading and Writing Config

```bash
dev config show                         # print full config.json
dev config get user.email               # read a value by dot path
dev config set user.email me@example.com
dev config set defaults.packageManager yarn
dev config reset --confirm              # wipe config back to defaults
```

Config is stored as JSON in `~/.devutils/config.json`. Get and set use dot notation for nested keys. The `--confirm` flag is required for reset to prevent accidents.

## Output Formatting

Most commands support a `--format` flag:

```bash
dev config show --format json
dev config show --format yaml
dev machine show --format table
```

Format defaults to `table` in a terminal and `json` when output is piped or when called from a CI environment or AI tool (Claude Code, Gemini, etc.). You rarely need to set this explicitly.

## Global Flags

These work on any command:

| Flag | Description |
|---|---|
| `--format json\|table\|yaml\|csv` | Override output format |
| `--dry-run` | Show what would happen without doing it |
| `--verbose` | More detailed output |
| `--quiet` | Suppress informational output |
| `--json <data>` | Pass structured input via stdin or inline |
| `--help` / `-h` | Show help for any command |
| `--version` / `-v` | Print version |

## Typical First Session

```bash
# Install
npm install -g @fredlackey/devutils

# Init config
dev config init

# Detect this machine
dev machine detect

# Check everything looks right
dev status

# Explore what's available
dev help
```

After that, which services you use depends on what you need. The most commonly used ones after initial setup are `identity` (managing git identities across machines), `tools` (installing dev tools), and `ignore` (generating `.gitignore` files).

## Project Layout (for contributors)

```
src/
  cli.js            # command router — parses args, loads service/method files
  commands/         # one folder per service (config, machine, identity, tools, etc.)
  lib/              # internal shared modules (not user-facing)
  api/              # plugin loader and registry
  installers/       # per-tool install functions
  utils/            # complex multi-step utilities (clone, git-push, git-status)
  patterns/         # static pattern files (gitignore templates)
_rebuild/           # legacy v0.0.18 code — kept as reference, not active
stories/            # user story definitions used during development
```

The router in `cli.js` lazy-loads command files. Each command receives a shared `context` object with pre-configured modules: `platform`, `shell`, `config`, `prompt`, `output`, `errors`, and `flags`. Commands call `context.output.out(data)` and the formatter handles the rest.

All state lives in `~/.devutils/`. Nothing is written to the project directory or to global system paths except the optional PATH addition to your shell config during `config init`.
