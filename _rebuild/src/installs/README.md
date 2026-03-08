# Installs

This folder contains platform-specific installation scripts for the `dev install <name>` command.

## Purpose

Each file implements the logic to install a specific development tool across multiple operating systems. The install command detects the current platform and executes the appropriate installation method.

## Supported Platforms

| Platform | Detection | Package Manager |
|----------|-----------|-----------------|
| macOS | `darwin` | Homebrew (`brew`) |
| Ubuntu / Debian | `linux` + apt | APT (`apt-get`) |
| Raspberry Pi OS | `linux` + apt | APT (`apt-get`) |
| Amazon Linux | `linux` + yum/dnf | YUM/DNF |
| Windows (WSL) | `linux` + WSL detection | APT or native |
| Windows (PowerShell) | `win32` | Chocolatey / winget |

## Script Structure

Each install script **must** follow this pattern:

1. A main `install()` function that detects the OS and dispatches to the appropriate installer
2. Dedicated `install_<platform>()` functions for each supported operating system

### Required Functions

| Function | Platform | Description |
|----------|----------|-------------|
| `install()` | All | Entry point - detects OS and calls appropriate installer |
| `install_macos()` | macOS | Installation via Homebrew |
| `install_ubuntu()` | Ubuntu/Debian | Installation via APT |
| `install_ubuntu_wsl()` | Ubuntu on WSL | WSL-specific installation |
| `install_raspbian()` | Raspberry Pi OS | Installation via APT (ARM) |
| `install_amazon_linux()` | Amazon Linux | Installation via YUM/DNF |
| `install_windows()` | Windows | Installation via Chocolatey/winget |

### Template

```javascript
#!/usr/bin/env node

/**
 * @fileoverview Install Visual Studio Code.
 * @module installs/vscode
 */

const os = require('../utils/common/os');
const shell = require('../utils/shell');

// -----------------------------------------------------------------------------
// Platform-specific installers
// -----------------------------------------------------------------------------

/**
 * Install on macOS via Homebrew.
 * @returns {Promise<void>}
 */
async function install_macos() {
  await shell.exec('brew install --cask visual-studio-code');
}

/**
 * Install on Ubuntu/Debian via APT.
 * @returns {Promise<void>}
 */
async function install_ubuntu() {
  // Add Microsoft GPG key and repository
  await shell.exec('wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg');
  await shell.exec('sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/');
  await shell.exec('sudo sh -c \'echo "deb [arch=amd64] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list\'');
  await shell.exec('sudo apt-get update');
  await shell.exec('sudo apt-get install -y code');
}

/**
 * Install on Ubuntu running in WSL.
 * @returns {Promise<void>}
 */
async function install_ubuntu_wsl() {
  // WSL can use Windows VS Code with Remote WSL extension
  console.log('For WSL, install VS Code on Windows and use the Remote - WSL extension.');
  console.log('Run: winget install Microsoft.VisualStudioCode');
}

/**
 * Install on Raspberry Pi OS via APT.
 * @returns {Promise<void>}
 */
async function install_raspbian() {
  // VS Code is available for ARM via code-oss or official builds
  await shell.exec('sudo apt-get update');
  await shell.exec('sudo apt-get install -y code');
}

/**
 * Install on Amazon Linux via YUM/DNF.
 * @returns {Promise<void>}
 */
async function install_amazon_linux() {
  await shell.exec('sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc');
  await shell.exec('sudo sh -c \'echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo\'');
  await shell.exec('sudo dnf install -y code');
}

/**
 * Install on Windows via Chocolatey or winget.
 * @returns {Promise<void>}
 */
async function install_windows() {
  // Prefer winget if available, fall back to chocolatey
  try {
    await shell.exec('winget install Microsoft.VisualStudioCode');
  } catch {
    await shell.exec('choco install vscode -y');
  }
}

// -----------------------------------------------------------------------------
// Main entry point
// -----------------------------------------------------------------------------

/**
 * Detect the operating system and run the appropriate installer.
 * @returns {Promise<void>}
 */
async function install() {
  const platform = os.detect();

  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,
    'ubuntu-wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon-linux': install_amazon_linux,
    'rhel': install_amazon_linux,
    'windows': install_windows,
  };

  const installer = installers[platform.type];

  if (!installer) {
    console.error(`Unsupported platform: ${platform.type}`);
    process.exit(1);
  }

  console.log(`Installing Visual Studio Code on ${platform.type}...`);
  await installer();
  console.log('Installation complete.');
}

module.exports = {
  install,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
};

if (require.main === module) {
  install();
}
```

### Using Utility Modules

Install scripts **must** use the shared utilities in `src/utils/` rather than implementing their own shell execution, OS detection, or package manager logic. This ensures consistency and reduces code duplication.

#### Required Utilities

| Module | Purpose | Example Usage |
|--------|---------|---------------|
| `../utils/os` | OS/platform detection | `os.detect()`, `os.isMacOS()`, `os.isWSL()` |
| `../utils/shell` | Shell command execution | `shell.exec()`, `shell.execSudo()` |
| `../utils/brew` | Homebrew operations (macOS) | `brew.install()`, `brew.installCask()` |
| `../utils/apt` | APT operations (Debian/Ubuntu) | `apt.install()`, `apt.update()` |
| `../utils/yum` | YUM/DNF operations (RHEL/Amazon) | `yum.install()`, `dnf.install()` |
| `../utils/choco` | Chocolatey operations (Windows) | `choco.install()` |
| `../utils/winget` | Winget operations (Windows) | `winget.install()` |
| `../utils/logger` | Consistent logging | `logger.info()`, `logger.success()`, `logger.error()` |

#### Example Using Utilities

```javascript
const os = require('../utils/common/os');
const shell = require('../utils/shell');
const brew = require('../utils/brew');
const apt = require('../utils/apt');
const logger = require('../utils/logger');

async function install_macos() {
  logger.info('Installing via Homebrew...');
  await brew.installCask('visual-studio-code');
  logger.success('VS Code installed');
}

async function install_ubuntu() {
  logger.info('Adding Microsoft repository...');
  await apt.addKey('https://packages.microsoft.com/keys/microsoft.asc');
  await apt.addRepository('https://packages.microsoft.com/repos/code', 'stable', 'main');
  await apt.update();
  await apt.install('code');
  logger.success('VS Code installed');
}
```

### Guidelines

1. **Use utility modules** — Always use `src/utils/` for shell execution, package managers, and logging
2. **Always export all functions** — Export both `install()` and each `install_<platform>()` function for testing and direct invocation
3. **Use async/await** — All install functions should be async for shell command execution
4. **Handle errors gracefully** — Catch errors and provide helpful messages
5. **Log progress** — Use `../utils/logger` for consistent output formatting
6. **Check prerequisites** — Use utility functions to verify package managers are installed
7. **Idempotent** — Running the installer twice should not cause errors

## Available Installs

### Core Tools
| File | Command | Description |
|------|---------|-------------|
| `xcode.js` | `dev install xcode` | Xcode Command Line Tools |
| `homebrew.js` | `dev install homebrew` | Homebrew package manager |
| `build-essential.js` | `dev install build-essential` | GCC, make, and build tools |

### Shell
| File | Command | Description |
|------|---------|-------------|
| `bash.js` | `dev install bash` | Bash shell |
| `bash-completion.js` | `dev install bash-completion` | Bash completion |
| `tmux.js` | `dev install tmux` | Terminal multiplexer |

### Version Control
| File | Command | Description |
|------|---------|-------------|
| `git.js` | `dev install git` | Git version control |
| `gitego.js` | `dev install gitego` | Git productivity tool |

### JavaScript / Node.js
| File | Command | Description |
|------|---------|-------------|
| `nvm.js` | `dev install nvm` | Node Version Manager |
| `node.js` | `dev install node` | Node.js runtime |
| `yarn.js` | `dev install yarn` | Yarn package manager |

### Programming Languages
| File | Command | Description |
|------|---------|-------------|
| `go.js` | `dev install go` | Go programming language |

### Editors
| File | Command | Description |
|------|---------|-------------|
| `vim.js` | `dev install vim` | Vim editor |
| `vscode.js` | `dev install vscode` | Visual Studio Code |
| `sublime-text.js` | `dev install sublime-text` | Sublime Text |
| `cursor.js` | `dev install cursor` | Cursor AI editor |

### AI Tools
| File | Command | Description |
|------|---------|-------------|
| `claude-code.js` | `dev install claude-code` | Claude Code CLI |
| `gemini-cli.js` | `dev install gemini-cli` | Google Gemini CLI |
| `chatgpt.js` | `dev install chatgpt` | ChatGPT desktop app |
| `superwhisper.js` | `dev install superwhisper` | AI voice transcription |

### Containers
| File | Command | Description |
|------|---------|-------------|
| `docker.js` | `dev install docker` | Docker container runtime |

### Browsers
| File | Command | Description |
|------|---------|-------------|
| `google-chrome.js` | `dev install google-chrome` | Google Chrome |
| `chrome-canary.js` | `dev install chrome-canary` | Chrome Canary |
| `safari-tech-preview.js` | `dev install safari-tech-preview` | Safari Technology Preview |
| `chromium.js` | `dev install chromium` | Chromium browser |

### Security / Encryption
| File | Command | Description |
|------|---------|-------------|
| `gpg.js` | `dev install gpg` | GNU Privacy Guard |
| `pinentry.js` | `dev install pinentry` | GPG PIN entry |
| `nordpass.js` | `dev install nordpass` | Nord Pass password manager |
| `tailscale.js` | `dev install tailscale` | Tailscale mesh VPN |

### Cloud / Infrastructure
| File | Command | Description |
|------|---------|-------------|
| `aws-cli.js` | `dev install aws-cli` | AWS CLI |
| `terraform.js` | `dev install terraform` | Terraform (via tfenv) |

### Databases
| File | Command | Description |
|------|---------|-------------|
| `dbschema.js` | `dev install dbschema` | Database diagram designer |
| `studio-3t.js` | `dev install studio-3t` | MongoDB GUI |

### API / Network
| File | Command | Description |
|------|---------|-------------|
| `postman.js` | `dev install postman` | API testing platform |
| `curl.js` | `dev install curl` | HTTP client |
| `lftp.js` | `dev install lftp` | FTP/SFTP client |

### Media / Video
| File | Command | Description |
|------|---------|-------------|
| `vlc.js` | `dev install vlc` | VLC media player |
| `ffmpeg.js` | `dev install ffmpeg` | Video/audio processing |
| `atomicparsley.js` | `dev install atomicparsley` | MP4 metadata editor |
| `yt-dlp.js` | `dev install yt-dlp` | YouTube downloader |
| `elmedia-player.js` | `dev install elmedia-player` | Elmedia Player |
| `spotify.js` | `dev install spotify` | Spotify |
| `tidal.js` | `dev install tidal` | Tidal music streaming |

### Image Tools
| File | Command | Description |
|------|---------|-------------|
| `imageoptim.js` | `dev install imageoptim` | Image compression |
| `pngyu.js` | `dev install pngyu` | PNG compression |

### Productivity
| File | Command | Description |
|------|---------|-------------|
| `microsoft-office.js` | `dev install microsoft-office` | Microsoft Office 365 |
| `microsoft-teams.js` | `dev install microsoft-teams` | Microsoft Teams |
| `slack.js` | `dev install slack` | Slack |
| `zoom.js` | `dev install zoom` | Zoom video conferencing |
| `keyboard-maestro.js` | `dev install keyboard-maestro` | macOS automation |
| `caffeine.js` | `dev install caffeine` | Prevent sleep |

### Messaging
| File | Command | Description |
|------|---------|-------------|
| `whatsapp.js` | `dev install whatsapp` | WhatsApp |
| `messenger.js` | `dev install messenger` | Facebook Messenger |

### Screen Capture
| File | Command | Description |
|------|---------|-------------|
| `snagit.js` | `dev install snagit` | Screen capture |
| `camtasia.js` | `dev install camtasia` | Screen recording |

### Design
| File | Command | Description |
|------|---------|-------------|
| `adobe-creative-cloud.js` | `dev install adobe-creative-cloud` | Adobe Creative Cloud |
| `drawio.js` | `dev install drawio` | Diagram editor |

### Utilities
| File | Command | Description |
|------|---------|-------------|
| `jq.js` | `dev install jq` | JSON processor |
| `yq.js` | `dev install yq` | YAML processor |
| `shellcheck.js` | `dev install shellcheck` | Shell script linter |
| `tree.js` | `dev install tree` | Directory tree viewer |
| `appcleaner.js` | `dev install appcleaner` | macOS app uninstaller |
| `beyond-compare.js` | `dev install beyond-compare` | File comparison |
| `balena-etcher.js` | `dev install balena-etcher` | Flash OS images |
| `termius.js` | `dev install termius` | SSH client |

### Documents
| File | Command | Description |
|------|---------|-------------|
| `pandoc.js` | `dev install pandoc` | Document converter |
| `latex.js` | `dev install latex` | LaTeX typesetting |

### Web Font Tools
| File | Command | Description |
|------|---------|-------------|
| `sfnt2woff.js` | `dev install sfnt2woff` | TTF/OTF to WOFF |
| `woff2.js` | `dev install woff2` | WOFF2 encoder/decoder |

### 3D Printing
| File | Command | Description |
|------|---------|-------------|
| `bambu-studio.js` | `dev install bambu-studio` | Bambu 3D printer slicer |

## Adding New Install Scripts

1. Create `<name>.js` in this folder
2. Import the OS detection utility from `../utils/os`
3. Implement platform-specific installation logic
4. Export an `install()` function

## Related

- **Commands** (`../commands/`) — The `install.js` command handler
- **Utils** (`../utils/`) — OS detection and shell execution helpers

## Documentation

See [docs/COMMANDS.md](../../docs/COMMANDS.md) for the `dev install` command specification.
