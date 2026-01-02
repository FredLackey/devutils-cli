# DevUtils CLI Commands

This document defines the **command** structure for the `dev` CLI utility.

> **Note:** This document covers **Commands** — multi-word CLI operations that start with `dev`. For standalone global utilities (like `afk`, `clone`, `git-push`), see [Scripts](../ai-docs/LOCAL_EXAMPLE_ENVIRONMENT.md).

## Command Structure Overview

```
dev <action> [subcommand] [arguments] [options]
```

All commands follow a consistent pattern:
- **Two-word commands**: `dev configure`, `dev status`
- **Three-word commands**: `dev init claude`, `dev add identity`

Command logic is implemented in `src/commands/`.

---

## Core Commands

### `dev configure`

Interactive wizard to collect developer information and create the configuration file.

**Usage:**
```bash
dev configure
```

**Behavior:**
1. Prompts for user information:
   - Name (required)
   - Email (required)
   - URL (optional)
2. Creates `~/.devutils` configuration file in the user's home directory
3. If `~/.devutils` already exists, prompts to update or overwrite

**Configuration File (`~/.devutils`):**
```json
{
  "user": {
    "name": "Jane Developer",
    "email": "jane@example.com",
    "url": "https://janedev.io"
  },
  "defaults": {
    "license": "MIT",
    "package_manager": "npm"
  },
  "created": "2025-01-15T10:30:00Z",
  "updated": "2025-01-15T10:30:00Z"
}
```

**Options:**
| Flag | Description |
|------|-------------|
| `--force` | Overwrite existing config without prompting |
| `--show` | Display current configuration (alias: `-s`) |

---

### `dev status`

Display current configuration and environment health.

**Usage:**
```bash
dev status
```

**Output includes:**
- Whether `~/.devutils` exists and is valid
- Current user configuration summary
- Detected environment (git repo, Node.js version, etc.)
- Any warnings or issues

---

## Installation Commands

### `dev install <name>`

Platform-agnostic installation of common development tools and packages.

**Usage:**
```bash
dev install <name>
```

**Examples:**
```bash
dev install vscode        # Install Visual Studio Code
dev install claude-code   # Install Claude Code CLI
dev install zim           # Install Zim wiki
dev install docker        # Install Docker
```

**How It Works:**

1. Locates the install script at `src/installs/<name>.js`
2. Detects the current operating system using `src/utils/os.js`
3. Executes the platform-specific installation commands

**Supported Platforms:**

| Platform | Detection | Package Manager |
|----------|-----------|-----------------|
| macOS | `darwin` | Homebrew (`brew`) |
| Ubuntu / Debian | `linux` + apt | APT (`apt-get`) |
| Raspberry Pi OS | `linux` + apt | APT (`apt-get`) |
| Amazon Linux | `linux` + yum/dnf | YUM/DNF |
| Windows (WSL) | `linux` + WSL detection | APT or native |
| Windows (PowerShell) | `win32` | Chocolatey / winget |

**Install Script Structure:**

Each install script in `src/installs/` follows this pattern:

```javascript
// src/installs/vscode.js
const os = require('../utils/os');

async function install() {
  const platform = os.detect();

  switch (platform.type) {
    case 'macos':
      // brew install --cask visual-studio-code
      break;
    case 'debian':
      // apt-get install code
      break;
    case 'rhel':
      // yum install code
      break;
    case 'windows-wsl':
      // Windows-specific WSL handling
      break;
    case 'windows':
      // choco install vscode OR winget install vscode
      break;
  }
}

module.exports = { install };
```

**Available Installs:**

| Name | Description |
|------|-------------|
| `vscode` | Visual Studio Code editor |
| `claude-code` | Claude Code CLI tool |
| `docker` | Docker container runtime |
| `node` | Node.js runtime |
| `zim` | Zim desktop wiki |

> **Note:** Run `dev install --list` to see all available install scripts.

**Options:**
| Flag | Description |
|------|-------------|
| `--list` | List all available install scripts |
| `--dry-run` | Show what commands would be executed without running them |
| `--force` | Skip confirmation prompts |
| `--verbose` | Show detailed output during installation |

**Adding New Install Scripts:**

To add support for a new package:

1. Create `src/installs/<name>.js`
2. Import the OS detection utility
3. Implement platform-specific installation logic
4. Export an `install()` function

---

## Ignore Commands

### `dev ignore <technology>`

Append technology-specific patterns to the `.gitignore` file in the current git repository.

**Usage:**
```bash
dev ignore <technology>
```

**Examples:**
```bash
dev ignore node        # Append Node.js patterns (node_modules, etc.)
dev ignore python      # Append Python patterns (__pycache__, .venv, etc.)
dev ignore macos       # Append macOS patterns (.DS_Store, etc.)
```

**How It Works:**

1. **Validate technology**: Checks if `src/ignore/<technology>.txt` exists
2. **Find git root**: Starting from the current directory, walks up the directory tree until it finds a `.git` folder
3. **Locate or create .gitignore**: In the git root directory, looks for an existing `.gitignore` file or creates one if it doesn't exist
4. **Check for duplicates**: Scans the existing `.gitignore` for a section marker indicating these patterns were already added
5. **Append patterns**: If not already present, appends the patterns from the source file with a section header

**Source Files:**

Pattern files are stored in `src/ignore/` as plain text files:

```
src/ignore/
├── node.txt          # Node.js patterns
├── python.txt        # Python patterns
├── rust.txt          # Rust patterns
├── go.txt            # Go patterns
├── java.txt          # Java patterns
├── macos.txt         # macOS system files
├── windows.txt       # Windows system files
└── linux.txt         # Linux system files
```

**Example Source File (`src/ignore/node.txt`):**
```
# Node.js
node_modules/
npm-debug.log*
yarn-error.log
.npm
.yarn
.pnpm-store/
```

**Resulting .gitignore:**

When `dev ignore node` is run, the following is appended to `.gitignore`:

```gitignore
# === devutils-cli: node ===
# Node.js
node_modules/
npm-debug.log*
yarn-error.log
.npm
.yarn
.pnpm-store/
# === end: node ===
```

The section markers (`# === devutils-cli: node ===` and `# === end: node ===`) allow the command to detect if patterns were already added, preventing duplicates.

**Behavior Details:**

| Scenario | Action |
|----------|--------|
| Technology not supported | Error: "Unknown technology: {name}. Run `dev ignore --list` to see available options." |
| Not in a git repository | Error: "No git repository found. Initialize with `git init` first." |
| .gitignore doesn't exist | Creates new .gitignore with the patterns |
| .gitignore exists, patterns not present | Appends patterns to existing file |
| .gitignore exists, patterns already present | Skips with message: "Patterns for {technology} already present in .gitignore" |

**Options:**
| Flag | Description |
|------|-------------|
| `--list` | List all available technologies |
| `--dry-run` | Show what would be added without modifying files |
| `--force` | Re-add patterns even if section already exists (replaces existing section) |

**Adding New Technologies:**

To add support for a new technology:

1. Create `src/ignore/<name>.txt` with the gitignore patterns
2. The technology is automatically available as `dev ignore <name>`

---

## Identity Commands

Manage identity profiles for git configuration, SSH keys, and GPG signing.

### `dev identity add`

Add a new identity profile with associated cryptographic keys.

**Usage:**
```bash
dev identity add
```

**Prompts for:**
- Identity name/alias (e.g., "work", "personal", "opensource")
- Name
- Email
- URL (optional)
- SSH key passphrase (optional, recommended)
- GPG key passphrase (optional, recommended)

**Behavior:**
1. Collects identity information
2. Generates SSH key pair:
   - Private key: `~/.ssh/id_ed25519_{alias}`
   - Public key: `~/.ssh/id_ed25519_{alias}.pub`
3. Generates GPG key pair for commit signing
4. Stores references in `~/.devutils`

**Generated Files:**
```
~/.ssh/
├── id_ed25519_work
├── id_ed25519_work.pub
├── id_ed25519_personal
└── id_ed25519_personal.pub
```

**Result in `~/.devutils`:**
```json
{
  "identities": {
    "work": {
      "name": "Jane Smith",
      "email": "jane.smith@company.com",
      "ssh": {
        "privateKey": "~/.ssh/id_ed25519_work",
        "publicKey": "~/.ssh/id_ed25519_work.pub"
      },
      "gpg": {
        "keyId": "ABC123DEF456"
      }
    }
  }
}
```

**Options:**
| Flag | Description |
|------|-------------|
| `--no-ssh` | Skip SSH key generation |
| `--no-gpg` | Skip GPG key generation |
| `--ssh-type <type>` | SSH key type: `ed25519` (default), `rsa` |

---

### `dev identity remove`

Remove an identity profile from the configuration.

**Usage:**
```bash
dev identity remove [name]
```

If `[name]` is not provided, lists available identities and prompts for selection.

**Options:**
| Flag | Description |
|------|-------------|
| `--force` | Delete without confirmation |

---

### `dev identity link`

Link an identity to a source folder or file, so git operations in that location use the specified identity.

**Usage:**
```bash
dev identity link <source-folder|file>
```

---

## Global Options

These options are available on all commands:

| Flag | Description |
|------|-------------|
| `--help`, `-h` | Show help for the command |
| `--version`, `-v` | Show version number |
| `--verbose` | Enable verbose output |
| `--quiet`, `-q` | Suppress non-essential output |
| `--no-color` | Disable colored output |

---

## Command Summary

| Command | Description |
|---------|-------------|
| `dev configure` | Set up developer profile and create ~/.devutils |
| `dev status` | Show current configuration and environment |
| `dev install <name>` | Install a development tool (platform-agnostic) |
| `dev ignore <technology>` | Append technology patterns to .gitignore |
| `dev identity add` | Add a new identity profile |
| `dev identity remove` | Remove an identity profile |
| `dev identity link` | Link an identity to a source folder or file |

---

## Tab Completion

After installing tab completion (`dev completion install`), users can:

```bash
dev <TAB>
# Shows: configure  identity  ignore  install  status

dev install <TAB>
# Shows: claude-code  docker  node  vscode  zim  ...

dev ignore <TAB>
# Shows: node  python  rust  go  java  macos  windows  linux  ...

dev identity <TAB>
# Shows: add  link  remove
```
