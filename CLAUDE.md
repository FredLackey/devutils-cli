# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevUtils CLI is a globally-installable Node.js CLI toolkit for bootstrapping and configuring development environments. It replaces fragmented dotfiles and setup scripts with a unified `dev` command that works across macOS, Linux, and Windows.

## Commands

```bash
npm install -g @fredlackey/devutils    # Install globally
npm test                       # No tests configured yet
```

## Architecture

### Terminology (Critical Distinction)

| Term | Description | Location | Invocation |
|------|-------------|----------|------------|
| **Command** | Multi-word CLI operations | `src/commands/` | `dev <action>` (e.g., `dev configure`) |
| **Script** | Standalone global utilities replacing shell aliases | `src/scripts/` | Direct command (e.g., `afk`, `clone`) |
| **Install** | Platform-specific installation logic | `src/installs/` | `dev install <name>` |
| **Util** | Internal shared code (not user-facing) | `src/utils/` | Imported by other modules |

### Project Structure

```
src/
├── commands/       # dev configure, dev status, dev identity, dev install
├── scripts/        # afk, clone, git-push, ll (~80 scripts)
├── installs/       # One file per tool (vscode.js, docker.js, node.js, etc.)
│                   # Each file contains install_<platform>() functions
└── utils/          # Shared utilities with OS-specific subfolders
    ├── os.js, shell.js, config.js, logger.js, etc.
    ├── macos/
    ├── ubuntu/
    ├── amazon_linux/
    ├── raspbian/
    ├── gitbash/
    └── windows/
files/              # Template files
```

### Configuration

User preferences stored in `~/.devutils` (JSON):
- `user`: name, email, URL
- `defaults`: license, package_manager
- `identities`, `containers`, `sourceFolders`

## Code Patterns

### Script Pattern

```javascript
#!/usr/bin/env node
async function main(args) {
  // args = process.argv.slice(2)
}
module.exports = { main };
if (require.main === module) {
  main(process.argv.slice(2));
}
```

### Install Pattern

```javascript
#!/usr/bin/env node
const os = require('../utils/os');

async function install_macos() { /* ... */ }
async function install_ubuntu() { /* ... */ }
async function install_windows() { /* ... */ }

async function install() {
  const platform = os.detect();
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    // ...
  };
  await installers[platform.type]();
}

module.exports = { install, install_macos, install_ubuntu, install_windows };
if (require.main === module) { install(); }
```

### Platform Detection

```javascript
const os = require('../utils/os');
const platform = os.detect();
// Returns: { type: 'macos'|'debian'|'rhel'|'windows'|'windows-wsl', packageManager: 'brew'|'apt'|'dnf'|'choco' }
```

## Code Style

- CommonJS modules (`require`/`module.exports`)
- 2-space indentation, LF line endings
- Async/await for all async operations
- JSDoc comments for all functions
- Shebang `#!/usr/bin/env node` on executable files
- Use utility modules from `src/utils/` (never implement shell execution, OS detection, or package manager logic directly)

## Supported Platforms

macOS (Homebrew), Ubuntu/Debian (APT), Raspberry Pi OS (APT), Amazon Linux/RHEL (YUM/DNF), Windows (Chocolatey/winget), WSL
