# Feature: `dev system` Command

## Overview

The `dev system` command provides an OS-agnostic interface for querying and modifying system-level and OS-level settings on the running environment. It intelligently detects the current environment and gracefully handles cases where requested operations are not supported.

## Goals

1. Provide a unified interface for common system operations across all supported platforms
2. Detect environment capabilities before attempting operations
3. Provide clear, helpful feedback when operations are not possible
4. Follow the existing project patterns for cross-platform support
5. Leverage and extend existing utilities in `src/utils/` rather than duplicating OS-specific logic

## Command Structure

```
dev system <verb> <target> [value] [options]
```

| Component | Description | Examples |
|-----------|-------------|----------|
| `verb` | The action to perform | `get`, `set`, `add`, `remove`, `has`, `unset` |
| `target` | The system setting to query or modify | `bash`, `zsh`, `name`, `path`, `proxy`, `timezone` |
| `value` | Optional value for set/add operations | `/usr/local/bin`, `America/New_York` |
| `options` | Optional flags | `--public` (for `get ip`) |

### Verbs

| Verb | Description |
|------|-------------|
| `get` | Retrieve the current value of a setting |
| `set` | Change a setting to a specified value |
| `add` | Add an entry to a list-based setting (e.g., PATH) |
| `remove` | Remove an entry from a list-based setting |
| `has` | Check if an entry exists in a list-based setting |
| `unset` | Clear or remove a setting entirely |

## Phase 1 Commands

Phase 1 establishes the core architecture and implements essential shell and system information commands.

### Shell Commands

| Command | Description |
|---------|-------------|
| `dev system set bash` | Set the user's default shell to Bash |
| `dev system set zsh` | Set the user's default shell to Zsh |

### Information Commands

| Command | Description |
|---------|-------------|
| `dev system get name` | Get the computer/hostname |
| `dev system get version` | Get the OS version |
| `dev system get os` | Get the full OS name and version |

---

## Phase 2 Commands

Phase 2 extends the system command with additional utilities for shell configuration, system information, network settings, PATH management, and more.

### Shell & Terminal

| Command | Description |
|---------|-------------|
| `dev system get shell` | Get current default shell |
| `dev system get history` | Get shell history file path |
| `dev system set editor <vim\|nano\|code>` | Set default CLI editor (`$EDITOR` and `$VISUAL`) |
| `dev system get editor` | Get current default editor |

### System Information

| Command | Description |
|---------|-------------|
| `dev system get arch` | Get CPU architecture (arm64, x86_64, etc.) |
| `dev system get memory` | Get total and available RAM |
| `dev system get disk` | Get disk space usage |
| `dev system get uptime` | Get system uptime |
| `dev system get user` | Get current username |
| `dev system get home` | Get home directory path |
| `dev system get temp` | Get temp directory path |

### Network

| Command | Description |
|---------|-------------|
| `dev system get ip` | Get local IP address |
| `dev system get ip --public` | Get public IP address |
| `dev system get dns` | Get configured DNS servers |
| `dev system get proxy` | Get HTTP/HTTPS proxy settings |
| `dev system set proxy <url>` | Set HTTP/HTTPS proxy |
| `dev system unset proxy` | Clear proxy settings |

### PATH Management

| Command | Description |
|---------|-------------|
| `dev system get path` | List all PATH entries (one per line) |
| `dev system add path <dir>` | Add directory to PATH |
| `dev system remove path <dir>` | Remove directory from PATH |
| `dev system has path <dir>` | Check if directory is in PATH |

### Display & Desktop

| Command | Description |
|---------|-------------|
| `dev system get desktop` | Check if desktop environment exists and return type |
| `dev system get resolution` | Get screen resolution |
| `dev system get darkmode` | Check if dark mode is enabled |
| `dev system set darkmode <on\|off>` | Toggle dark mode (macOS/Windows) |

### SSH

| Command | Description |
|---------|-------------|
| `dev system get ssh-keys` | List SSH key files in ~/.ssh |
| `dev system get ssh-agent` | Check if SSH agent is running |

### Locale & Time

| Command | Description |
|---------|-------------|
| `dev system get timezone` | Get current timezone |
| `dev system set timezone <tz>` | Set timezone |
| `dev system get locale` | Get current locale |
| `dev system set locale <locale>` | Set locale |

### Permissions

| Command | Description |
|---------|-------------|
| `dev system get sudo` | Check if current user has sudo privileges |
| `dev system get groups` | List groups the current user belongs to |

## Architecture

### Folder Structure

```
src/
├── commands/
│   └── system.js          # Command entry point (dev system)
└── system/
    ├── index.js           # Environment detection and function dispatcher
    ├── bash.js            # Shell: Bash operations
    ├── zsh.js             # Shell: Zsh operations
    ├── name.js            # System: Computer name operations
    ├── version.js         # System: OS version operations
    └── os.js              # System: Full OS info operations
```

### Module Pattern

Each target file in `src/system/` exposes platform-specific functions following this naming convention:

```
<verb>_<target>_<environment>()
```

**Examples:**
- `set_bash_ubuntu()` - Set shell to Bash on Ubuntu
- `set_zsh_macos()` - Set shell to Zsh on macOS
- `get_name_windows()` - Get computer name on Windows
- `get_version_amazon_linux()` - Get OS version on Amazon Linux

### Dispatcher Logic (`src/system/index.js`)

1. Detect the current environment using `src/utils/os.js`
2. Determine if running in a desktop environment (where applicable)
3. Load the appropriate target module (e.g., `bash.js`)
4. Check if the required function exists (e.g., `set_bash_gitbash`)
5. If function exists: Execute it and return the result
6. If function does not exist: Return a message indicating the operation is not supported

## Utility Requirements

### Leverage Existing Utilities

**All implementations MUST use existing utilities from `src/utils/` whenever possible.** Do not implement OS-specific logic directly in `src/system/` modules if equivalent functionality exists or can be added to the utilities layer.

#### Existing Utilities to Use

| Utility | Location | Purpose |
|---------|----------|---------|
| OS Detection | `src/utils/os.js` | Detect platform type and environment |
| Shell Commands | `src/utils/common/shell.js` | Execute commands, check command existence |
| Package Managers | `src/utils/macos/brew.js`, `src/utils/ubuntu/apt.js`, etc. | Package installation checks |

#### When to Extend Utilities

If a required capability does not exist in `src/utils/`, add it there rather than implementing it directly in `src/system/`:

1. **General-purpose functions** → Add to `src/utils/common/`
2. **macOS-specific functions** → Add to `src/utils/macos/`
3. **Ubuntu/Debian-specific functions** → Add to `src/utils/ubuntu/`
4. **Windows-specific functions** → Add to `src/utils/windows/`
5. **Amazon Linux-specific functions** → Add to `src/utils/amazon_linux/`
6. **Raspberry Pi OS-specific functions** → Add to `src/utils/raspbian/`
7. **Git Bash-specific functions** → Add to `src/utils/gitbash/`

#### Example: Adding Shell Utilities

If `src/utils/common/shell.js` does not have a function to change the user's default shell, add it there:

```javascript
// src/utils/common/shell.js

/**
 * Change the user's default login shell
 * @param {string} shellPath - Full path to the shell (e.g., /bin/zsh)
 * @returns {Promise<boolean>} True if successful
 */
async function setDefaultShell(shellPath) {
  // Implementation here
}

module.exports = { ..., setDefaultShell };
```

Then use it in `src/system/zsh.js`:

```javascript
// src/system/zsh.js
const shell = require('../utils/common/shell');

async function set_zsh_ubuntu() {
  const zshPath = '/usr/bin/zsh';
  if (!shell.commandExists('zsh')) {
    return { success: false, message: 'Zsh is not installed.' };
  }
  return await shell.setDefaultShell(zshPath);
}
```

#### Benefits of This Approach

1. **Reusability**: Other commands and installers can use the same utilities
2. **Consistency**: OS-specific logic is centralized in one location
3. **Testability**: Utilities can be unit tested independently
4. **Maintainability**: Bug fixes in utilities benefit all consumers

## Environment Detection Requirements

### Supported Environments

| Environment | Detection Method | Desktop Available |
|-------------|------------------|-------------------|
| macOS | `process.platform === 'darwin'` | Yes |
| Ubuntu | `/etc/os-release` contains "Ubuntu" | Depends on `$DISPLAY` |
| Debian | `/etc/os-release` contains "Debian" | Depends on `$DISPLAY` |
| Raspberry Pi OS | `/etc/os-release` contains "Raspbian" | Depends on `$DISPLAY` |
| Amazon Linux | `/etc/os-release` contains "Amazon Linux" | Typically No |
| RHEL/Fedora | `/etc/os-release` detection | Depends on `$DISPLAY` |
| Windows | `process.platform === 'win32'` | Yes |
| WSL | `process.platform === 'linux'` + `/proc/version` contains "microsoft" | Via WSLg |
| Git Bash | `process.platform === 'win32'` + `$MSYSTEM` env var | Yes (Windows) |
| PowerShell | `process.platform === 'win32'` + detection | Yes (Windows) |

### Desktop Environment Detection

For operations that require or interact with desktop settings:

1. Check if `$DISPLAY` or `$WAYLAND_DISPLAY` environment variables are set (Linux)
2. Check if running in a terminal vs. GUI context
3. Inform user appropriately if desktop is not available

## Behavior Requirements

### Shell Change Operations (`set bash`, `set zsh`)

#### Pre-flight Checks

1. **Environment Support**: Verify the operation is possible on the current environment
   - Windows CMD/PowerShell: Not supported (return helpful message)
   - Git Bash: Not supported (return helpful message)
   - WSL: Supported (treat as Linux)
   - macOS/Linux: Supported

2. **Shell Availability**: Verify the requested shell is installed
   - Check if shell binary exists (e.g., `/bin/zsh`, `/bin/bash`)
   - If not installed: Recommend `dev install zsh` or `dev install bash`

3. **Shell in `/etc/shells`**: Verify the shell is listed as a valid login shell
   - If not listed: Provide instructions or offer to add it

#### Execution

1. Use `chsh -s <shell_path>` on Unix-like systems
2. May require user password (inform user beforehand)
3. Verify the change was successful
4. Inform user they may need to log out/in for changes to take effect

### Information Operations (`get name`, `get version`, `get os`)

These are read-only operations and should work on all environments:

| Operation | macOS | Linux | Windows | Git Bash | WSL |
|-----------|-------|-------|---------|----------|-----|
| `get name` | `scutil --get ComputerName` | `hostname` | `hostname` | `hostname` | `hostname` |
| `get version` | `sw_vers -productVersion` | `/etc/os-release` | `ver` or registry | `uname -r` | `/etc/os-release` |
| `get os` | `sw_vers` | `/etc/os-release` | `systeminfo` | Combined | `/etc/os-release` |

## Error Handling

### User-Friendly Messages

All error messages must be clear and actionable:

```
Operation not supported:
  "Setting the default shell is not possible in Git Bash.
   This operation requires a native Linux or macOS environment."

Shell not installed:
  "Zsh is not installed on this system.
   Run 'dev install zsh' to install it first."

Shell not in /etc/shells:
  "Zsh is installed but not listed in /etc/shells.
   You may need to add it manually: sudo sh -c 'echo /usr/bin/zsh >> /etc/shells'"

Permission denied:
  "Changing the default shell requires your user password.
   Run the command again and enter your password when prompted."
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Operation not supported on this environment |
| 2 | Prerequisite not met (shell not installed, etc.) |
| 3 | Operation failed (permission denied, etc.) |

## Command Entry Point (`src/commands/system.js`)

The command should be registered in `src/cli.js` and support:

```javascript
const system = new Command('system')
  .description('Query and modify system-level settings')
  .argument('<verb>', 'Action to perform (get, set)')
  .argument('<target>', 'Setting to query or modify')
  .action(runSystem);
```

## Future Expansion (Phase 3+)

The architecture should support adding new targets easily. Potential future commands beyond Phase 2:

| Command | Description |
|---------|-------------|
| `dev system set hostname <name>` | Set the computer hostname (requires elevated privileges) |
| `dev system get cpu` | Get CPU model and core count |
| `dev system get processes` | List running processes |
| `dev system get services` | List system services and their status |
| `dev system restart service <name>` | Restart a system service |

## Implementation Checklist

### Utilities (implement first)

- [ ] Review existing utilities in `src/utils/` for reusable functions
- [ ] Add `setDefaultShell()` to `src/utils/common/shell.js` (if not present)
- [ ] Add `getHostname()` to `src/utils/common/` or platform-specific utils
- [ ] Add `getOsVersion()` to `src/utils/common/` or platform-specific utils
- [ ] Add any other required utility functions to appropriate `src/utils/` locations

### System Modules

- [ ] Create `src/system/index.js` dispatcher (uses `src/utils/os.js`)
- [ ] Create `src/system/bash.js` with platform functions (uses shell utilities)
- [ ] Create `src/system/zsh.js` with platform functions (uses shell utilities)
- [ ] Create `src/system/name.js` with platform functions (uses hostname utilities)
- [ ] Create `src/system/version.js` with platform functions (uses OS utilities)
- [ ] Create `src/system/os.js` with platform functions (uses OS utilities)

### Command Integration

- [ ] Create `src/commands/system.js` command entry point
- [ ] Register command in `src/cli.js`
- [ ] Add tab completion support in `src/completion.js`

### Quality Assurance

- [ ] Write tests for new utility functions
- [ ] Write tests for each platform function in `src/system/`
- [ ] Document in README.md

## References

### Existing Utilities (leverage these)

| Location | Contents |
|----------|----------|
| `src/utils/os.js` | OS/environment detection |
| `src/utils/common/shell.js` | Shell command execution, command existence checks |
| `src/utils/common/` | Cross-platform utilities |
| `src/utils/macos/` | macOS-specific utilities (brew, system commands) |
| `src/utils/ubuntu/` | Ubuntu/Debian utilities (apt, dpkg) |
| `src/utils/amazon_linux/` | Amazon Linux utilities (dnf, yum) |
| `src/utils/windows/` | Windows utilities (choco, winget, registry) |
| `src/utils/raspbian/` | Raspberry Pi OS utilities |
| `src/utils/gitbash/` | Git Bash utilities |

### Existing Patterns

- Installer pattern: `src/installs/` folder structure
- Script pattern: `src/scripts/` folder structure
