# Utils

This folder contains internal shared utilities used by Commands, Scripts, and Installs.

## Purpose

Utils provide common functionality that is reused across the package. These are **not** directly invokable by users — they are internal helpers.

## Planned Utilities

| File | Description |
|------|-------------|
| `os.js` | Operating system detection (macOS, Debian, RHEL, Windows, WSL) |
| `shell.js` | Shell command execution wrappers |
| `config.js` | Read/write `~/.devutils` configuration file |
| `prompts.js` | Interactive user prompts and wizards |
| `logger.js` | Consistent logging and output formatting |
| `paths.js` | Path resolution and home directory helpers |
| `git.js` | Git repository detection and operations |
| `npm.js` | npm/package.json utilities |

## Example: OS Detection

```javascript
// utils/os.js

function detect() {
  const platform = process.platform;

  if (platform === 'darwin') {
    return { type: 'macos', packageManager: 'brew' };
  }

  if (platform === 'linux') {
    // Check for WSL
    if (process.env.WSL_DISTRO_NAME) {
      return { type: 'windows-wsl', packageManager: 'apt' };
    }
    // Check for Debian-based (apt)
    if (fs.existsSync('/etc/debian_version')) {
      return { type: 'debian', packageManager: 'apt' };
    }
    // Check for RHEL-based (yum/dnf)
    if (fs.existsSync('/etc/redhat-release')) {
      return { type: 'rhel', packageManager: 'dnf' };
    }
  }

  if (platform === 'win32') {
    return { type: 'windows', packageManager: 'choco' };
  }

  return { type: 'unknown', packageManager: null };
}

module.exports = { detect };
```

## Example: Config Helper

```javascript
// utils/config.js
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.devutils');

function read() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function write(config) {
  config.updated = new Date().toISOString();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

module.exports = { read, write, CONFIG_PATH };
```

## Guidelines

1. **Single responsibility** — Each util should do one thing well
2. **No side effects** — Avoid global state; return values instead
3. **Error handling** — Throw descriptive errors; let callers handle them
4. **Platform-aware** — Consider cross-platform compatibility

## Related

- **Commands** (`../commands/`) — Use utils for common operations
- **Scripts** (`../scripts/`) — Use utils for OS detection, shell execution
- **Installs** (`../installs/`) — Use `os.js` for platform detection
