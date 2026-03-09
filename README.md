# DevUtils CLI

> **Work in Progress** -- This project is under active development and has not been fully tested in real-world environments. Commands may change, break, or behave unexpectedly. Use at your own risk. The stable, production-ready release will ship as **v1.0**. Until then, versions in the `0.x` range should be considered pre-release.

A config-driven CLI toolkit for bootstrapping and managing development environments across any machine.

DevUtils replaces scattered dotfiles, setup scripts, and manual configuration with a single `dev` command. You tell it what you need, and it handles the rest -- whether you're setting up a new laptop, syncing git identities across machines, or managing tool installations.

## Installation

```bash
npm install -g @fredlackey/devutils
```

Requires Node.js 18 or later.

## Quick Start

Once installed, the `dev` command is available globally:

```bash
dev help               # Show all available services and commands
dev version            # Print the current version
dev config init        # Walk through first-time setup
dev status             # Check the health of your environment
dev ignore node        # Add Node.js patterns to .gitignore
dev tools list         # See what tools are installed
dev identity list      # List your configured git identities
dev util list          # Browse available utility functions
```

## Command Reference

DevUtils organizes commands by service. The general pattern is:

```
dev <service> <method> [arguments] [flags]
```

### Services

#### config -- User configuration and onboarding

| Method   | Description                                  |
|----------|----------------------------------------------|
| `init`   | Run first-time setup and create config files |
| `show`   | Display the current configuration            |
| `get`    | Read a specific config value                 |
| `set`    | Update a specific config value               |
| `reset`  | Reset configuration to defaults              |
| `export` | Export config to a file                       |
| `import` | Import config from a file                    |

#### machine -- Machine profiles and detection

| Method   | Description                         |
|----------|-------------------------------------|
| `detect` | Auto-detect the current machine     |
| `show`   | Show the active machine profile     |
| `set`    | Set a machine profile value         |
| `list`   | List all known machine profiles     |

#### identity -- Git identities, SSH keys, GPG signing

| Method   | Description                                 |
|----------|---------------------------------------------|
| `add`    | Register a new git identity                 |
| `remove` | Remove a registered identity                |
| `list`   | List all identities                         |
| `show`   | Show details for a specific identity        |
| `link`   | Link an identity to a folder or repo        |
| `unlink` | Remove a folder/repo identity link          |
| `sync`   | Sync identity configs to git and SSH        |

#### tools -- Tool installation and management

| Method    | Description                              |
|-----------|------------------------------------------|
| `install` | Install a tool using the platform's package manager |
| `check`   | Check if a tool is installed             |
| `list`    | List available or installed tools        |
| `search`  | Search for tools by name                 |

#### ignore -- .gitignore pattern management

| Method   | Description                                  |
|----------|----------------------------------------------|
| `add`    | Add technology patterns to .gitignore        |
| `remove` | Remove a technology's patterns               |
| `list`   | List available technologies                  |
| `show`   | Show patterns for a specific technology      |

#### util -- Utility functions

| Method   | Description                           |
|----------|---------------------------------------|
| `add`    | Register a custom utility             |
| `remove` | Unregister a utility                  |
| `list`   | List all available utilities          |
| `show`   | Show details for a specific utility   |
| `run`    | Execute a utility                     |

#### alias -- Shorthand bin entries

| Method   | Description                              |
|----------|------------------------------------------|
| `add`    | Create a new alias                       |
| `remove` | Delete an alias                          |
| `list`   | List all registered aliases              |
| `sync`   | Regenerate alias wrapper scripts         |

#### auth -- OAuth and credential management

| Method    | Description                          |
|-----------|--------------------------------------|
| `login`   | Authenticate with a service          |
| `logout`  | Revoke credentials for a service     |
| `list`    | List authenticated services          |
| `status`  | Show current auth status             |
| `refresh` | Refresh an expired token             |

#### api -- API plugin system

| Method    | Description                         |
|-----------|-------------------------------------|
| `list`    | List installed API plugins          |
| `enable`  | Enable a plugin                     |
| `disable` | Disable a plugin                    |
| `update`  | Update a plugin to latest version   |

#### ai -- AI coding assistant launcher

| Method     | Description                             |
|------------|-----------------------------------------|
| `launch`   | Start an AI coding session              |
| `resume`   | Resume a previous session               |
| `list`     | List configured AI tools                |
| `sessions` | List past sessions                      |
| `show`     | Show details for a session or AI tool   |
| `set`      | Update AI tool settings                 |

#### search -- Markdown search

| Method        | Description                              |
|---------------|------------------------------------------|
| `query`       | Run a general search                     |
| `keyword`     | Search by keyword                        |
| `semantic`    | Search by meaning (requires AI plugin)   |
| `get`         | Retrieve a specific search result        |
| `collections` | List indexed collections                 |
| `index`       | Build or rebuild the search index        |
| `status`      | Show indexing status                     |

### Top-Level Commands

These commands don't belong to a service and are called directly:

| Command   | Description                        |
|-----------|------------------------------------|
| `status`  | Overall health check               |
| `version` | Show current version               |
| `help`    | Show the help message              |
| `schema`  | Introspect available commands      |
| `update`  | Update DevUtils to latest version  |

### Global Flags

These flags work with any command:

| Flag                              | Description                        |
|-----------------------------------|------------------------------------|
| `--format <json\|table\|yaml\|csv>` | Set the output format             |
| `--dry-run`                       | Show what would happen without doing it |
| `--verbose`                       | Increase output detail             |
| `--quiet`                         | Suppress non-essential output      |
| `--json <data>`                   | Pass structured input as JSON      |
| `--help`, `-h`                    | Show help                          |
| `--version`, `-v`                 | Show version                       |

## API Plugin System

DevUtils doesn't bundle API integrations directly. Instead, API wrappers are installed as separate plugin packages and managed through the `dev api` service.

Plugins live in `~/.devutils/plugins/` and are registered in `~/.devutils/plugins.json`. Each plugin is a standard npm package that exports a defined interface. This keeps the core CLI small and lets you add only the integrations you actually use.

```bash
dev api list               # See what's installed
dev api enable <plugin>    # Enable a plugin
dev api disable <plugin>   # Disable a plugin
dev api update <plugin>    # Update to latest version
```

## Configuration

All user data lives in `~/.devutils/`, created during `dev config init`:

- `config.json` -- User preferences, profile name, backup location
- `aliases.json` -- Registered alias mappings
- `ai.json` -- AI tool configurations
- `plugins.json` -- Installed API plugin registry
- `machines/` -- Machine profiles
- `auth/` -- OAuth tokens and API credentials
- `plugins/` -- Installed API plugin packages
- `utils/` -- User-added custom utilities
- `bin/` -- Generated alias wrapper scripts (added to PATH)
- `cache/` -- Temporary data

## Supported Platforms

| Platform          | Package Manager     |
|-------------------|---------------------|
| macOS             | Homebrew            |
| Ubuntu            | APT, Snap           |
| Raspberry Pi OS   | APT, Snap           |
| Amazon Linux      | DNF, YUM            |
| Windows           | Chocolatey, winget  |
| Git Bash          | Manual / Portable   |

## Current Status

DevUtils is in **pre-release** (`0.1.x`). The core framework, command routing, and service structure are in place. Basic smoke tests pass on Ubuntu 24.04 in Docker, but deeper integration testing -- real Git operations, SSH key workflows, GitHub auth, tool installation, and interactive prompts -- has not been completed yet.

What's working:
- Command routing and service discovery across all 11 services
- Config init, show, get, set, reset, file-based export/import
- Machine detection and profile management
- Gitignore pattern management (add, remove, list, show)
- Tool check, list, search, and dry-run install
- Identity CRUD (add, list, show, remove)
- Alias management and wrapper generation
- AI tool configuration
- Schema introspection
- Platform detection (macOS, Ubuntu, Raspberry Pi OS, Amazon Linux, Windows, Git Bash)

What still needs real-world testing:
- SSH key generation and GitHub integration
- Git identity sync to actual repositories
- Config backup/restore via remote Git repo
- OAuth login flows
- Tool installation on each supported platform
- API plugin installation and lifecycle
- AI session launch and resume
- QMD search indexing and queries

Patch versions (`0.1.1`, `0.1.2`, etc.) will ship as issues are found and fixed during hands-on use. Minor version bumps (`0.2.0`) are reserved for breaking changes. The first stable release will be **v1.0.0**.

## Contact

**Fred Lackey**
- Email: [fred.lackey@gmail.com](mailto:fred.lackey@gmail.com)
- Website: [fredlackey.com](https://fredlackey.com)
- GitHub: [@FredLackey](https://github.com/FredLackey)

## License

Apache-2.0
