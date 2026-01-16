# Installs Reference

Packages and applications installed via devutils-cli install scripts.

**Source:** `src/installs/`

## Legend

| Symbol | Meaning |
|--------|---------|
| :white_check_mark: | Installed |
| :x: | Not installed |
| - | Not applicable |

## Operating Systems

| Column | Description |
|--------|-------------|
| **macOS** | macOS workstation (Homebrew) |
| **Ubuntu** | Ubuntu desktop/server (APT/Snap) |
| **RPi** | Raspberry Pi OS (APT/Snap) |
| **Amazon** | Amazon Linux (DNF/YUM) |
| **Windows** | Windows (Chocolatey/winget) |
| **GitBash** | Git Bash on Windows (Manual/Portable) |

---

## Common Installer Functions

Every installer file in `src/installs/` follows a consistent pattern with standard functions. These functions enable the CLI to check availability, verify installations, and dispatch to platform-specific installers.

### Core Functions

#### `isInstalled()` - Check if Tool is Installed

**Purpose:** Determines if a tool is currently installed on the system.

**Signature:** `async function isInstalled(): Promise<boolean>`

**Behavior:**
- Returns `true` if the tool is installed, `false` otherwise
- Uses platform-appropriate detection methods:
  - **macOS**: Checks Homebrew formula/cask with `brew.isFormulaInstalled()` or `brew.isCaskInstalled()`
  - **Ubuntu/Debian/RPi**: Checks with `apt.isPackageInstalled()` or `shell.commandExists()`
  - **Amazon Linux/RHEL/Fedora**: Checks with `dnf.isPackageInstalled()` or `shell.commandExists()`
  - **Windows**: Checks Chocolatey package with `choco.isPackageInstalled()`
  - **GitBash**: Falls back to `shell.commandExists()`

**Example (from `node.js`):**
```javascript
async function isInstalled() {
  const platform = os.detect();

  if (platform.type === 'macos') {
    return brew.isFormulaInstalled(HOMEBREW_FORMULA_NAME);
  }

  if (platform.type === 'windows') {
    return choco.isPackageInstalled(CHOCO_PACKAGE_NAME);
  }

  // Linux and Git Bash: Check if node command exists
  return shell.commandExists('node');
}
```

---

#### `isEligible()` - Check Platform Eligibility

**Purpose:** Checks if installation is supported on the current platform.

**Signature:** `function isEligible(): boolean`

**Behavior:**
- Returns `true` if the tool can be installed on this platform, `false` otherwise
- Synchronous function (no async/await needed)
- May include additional checks beyond platform type (e.g., desktop environment required)

**Example (basic eligibility from `node.js`):**
```javascript
function isEligible() {
  const platform = os.detect();
  return ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel', 'windows', 'gitbash'].includes(platform.type);
}
```

**Example (with desktop check from `vscode.js`):**
```javascript
function isEligible() {
  const platform = os.detect();

  // First check if the platform is supported
  const supportedPlatforms = ['macos', 'ubuntu', 'debian', 'wsl', 'raspbian', 'amazon_linux', 'fedora', 'rhel', 'windows', 'gitbash'];
  if (!supportedPlatforms.includes(platform.type)) {
    return false;
  }

  // This installer requires a desktop environment
  if (REQUIRES_DESKTOP && !os.isDesktopAvailable()) {
    return false;
  }

  return true;
}
```

---

#### `install()` - Main Installation Dispatcher

**Purpose:** Entry point that detects platform and dispatches to the appropriate platform-specific installer.

**Signature:** `async function install(): Promise<void>`

**Behavior:**
- Detects platform with `os.detect()`
- Maps platform types to installer functions
- Calls the appropriate `install_<platform>()` function
- Gracefully reports if platform is not supported

**Example (from `node.js`):**
```javascript
async function install() {
  const platform = os.detect();

  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'debian': install_ubuntu,
    'wsl': install_ubuntu_wsl,
    'raspbian': install_raspbian,
    'amazon_linux': install_amazon_linux,
    'fedora': install_amazon_linux,
    'rhel': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  const installer = installers[platform.type];

  if (!installer) {
    console.log(`Node.js is not available for ${platform.type}.`);
    return;
  }

  await installer();
}
```

---

### Platform-Specific Installer Functions

Each installer exports platform-specific functions that contain the actual installation logic.

| Function | Platform |
|----------|----------|
| `install_macos()` | macOS (Homebrew) |
| `install_ubuntu()` | Ubuntu/Debian (APT) |
| `install_ubuntu_wsl()` | WSL Ubuntu (APT with WSL considerations) |
| `install_raspbian()` | Raspberry Pi OS (APT) |
| `install_amazon_linux()` | Amazon Linux/RHEL/Fedora (DNF/YUM) |
| `install_windows()` | Windows (Chocolatey/winget) |
| `install_gitbash()` | Git Bash (Manual/Portable) |

**Standard Pattern for Platform Installers:**
1. Check if already installed (idempotency)
2. Check platform-specific prerequisites
3. Perform installation
4. Verify installation succeeded
5. Display version info and next steps

---

### Helper Functions

Installers often include additional helper functions:

#### Version Check Functions

| Pattern | Purpose | Returns |
|---------|---------|---------|
| `get<Tool>Version()` | Get installed version | `Promise<string\|null>` |
| `is<Tool>CommandAvailable()` | Check if command exists | `boolean` |

**Example:**
```javascript
function isNodeCommandAvailable() {
  return shell.commandExists('node');
}

async function getNodeVersion() {
  if (!isNodeCommandAvailable()) {
    return null;
  }
  const result = await shell.exec('node --version');
  if (result.code === 0 && result.stdout) {
    const version = result.stdout.trim();
    return version.startsWith('v') ? version.substring(1) : version;
  }
  return null;
}
```

#### Setup Functions

| Pattern | Purpose |
|---------|---------|
| `setup<Type>Repository()` | Configure package manager repositories |
| `remove<Type>Packages()` | Clean conflicting packages |
| `install<Type>Dependencies()` | Install prerequisites |
| `configure<Tool>()` | Post-installation configuration |

---

### Standard Module Exports

Every installer exports these functions:

```javascript
module.exports = {
  install,
  isInstalled,
  isEligible,
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash,
};

// Allow direct execution
if (require.main === module) {
  install().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
```

---

### Utility Dependencies

Installers use shared utilities from `src/utils/`:

| Utility | Import | Purpose |
|---------|--------|---------|
| `os` | `require('../utils/os')` | Platform detection |
| `shell` | `require('../utils/shell')` | Command execution, `commandExists()` |
| `brew` | `require('../utils/brew')` | Homebrew operations |
| `apt` | `require('../utils/apt')` | APT package operations |
| `dnf` | `require('../utils/dnf')` | DNF/YUM package operations |
| `choco` | `require('../utils/choco')` | Chocolatey operations |

---

## Dependency Orchestration System

The `dev install` command includes a sophisticated dependency management system that automatically resolves and installs prerequisites before installing the requested tool.

### Dependency Declaration

Dependencies are declared in `src/installs/installers.json`. Each installer entry includes a `depends_on` array:

```json
{
  "filename": "ohmyzsh.js",
  "name": "Oh My Zsh",
  "status": "test-pending",
  "environments": ["macos", "ubuntu", "debian", "wsl", "raspbian", "amazon_linux", "rhel", "fedora"],
  "depends_on": [
    { "name": "zsh.js", "priority": 0 },
    { "name": "curl.js", "priority": 0 },
    { "name": "git.js", "priority": 0 }
  ]
}
```

**Dependency Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Filename of the dependency installer (e.g., `zsh.js`) |
| `priority` | integer | Installation order - lower numbers install first |
| `platforms` | array (optional) | Restrict dependency to specific platforms |

### Platform-Specific Dependencies

Dependencies can be limited to specific platforms:

```json
"depends_on": [
  { "name": "homebrew.js", "priority": 0, "platforms": ["macos"] },
  { "name": "chocolatey.js", "priority": 0, "platforms": ["windows", "gitbash"] },
  { "name": "curl.js", "priority": 0, "platforms": ["ubuntu", "debian", "wsl", "raspbian"] }
]
```

### Dependency Resolution Algorithm

The `resolveDependencies()` function in `src/commands/install.js` handles dependency resolution:

1. **Circular Detection**: Tracks dependencies being resolved to prevent infinite loops
2. **Platform Filtering**: Skips dependencies not applicable to the current platform
3. **Eligibility Check**: Verifies each dependency is eligible for installation via `isEligible()`
4. **Installation Check**: Checks if dependency is already installed via `isInstalled()`
5. **Recursive Resolution**: Recursively resolves transitive dependencies (A→B→C)
6. **Priority Ordering**: Sorts dependencies by priority (lower = install first)
7. **Deduplication**: Removes duplicate dependencies while preserving order

### Installation Flow

When a user runs `dev install <tool>`:

```
1. Load installer metadata from installers.json
2. Check if tool is eligible for current platform (isEligible)
3. Resolve all dependencies recursively
4. Build ordered installation list: [dependencies..., tool]
5. For each item in list:
   a. Check if already installed (isInstalled)
   b. If not installed, run the installer
   c. Verify installation succeeded
6. Report success or failure
```

### Best Practices for Installers

Installers should NOT install their own dependencies. Instead:

1. **Declare dependencies** in `installers.json`
2. **Check prerequisites** with a simple guard function:

```javascript
function checkPrerequisites() {
  if (!shell.commandExists('zsh')) {
    console.log('Zsh is required but not installed.');
    console.log('Run: dev install zsh');
    return false;
  }
  return true;
}
```

3. **Trust the dependency system** - prerequisites will be installed before your installer runs
4. **Keep installers focused** - each installer handles only its specific tool

### Common Dependencies

These installers are frequently declared as dependencies:

| Installer | Used By | Description |
|-----------|---------|-------------|
| `homebrew.js` | ~40 installers | Package manager for macOS |
| `chocolatey.js` | ~40 installers | Package manager for Windows |
| `curl.js` | 15+ installers | HTTP client for downloads |
| `git.js` | 10+ installers | Required for cloning repositories |
| `node.js` | claude-code, gemini-cli | Required for npm global installs |
| `ca-certificates.js` | 10+ installers | SSL certificate bundle |

---

## Core Tools

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Xcode | :white_check_mark: | - | - | - | - | - | Apple development tools and SDKs |
| Xcode Command Line Tools | :white_check_mark: | - | - | - | - | - | Compilers, Git, and CLI dev tools |
| Homebrew | :white_check_mark: | - | - | - | - | - | Package manager for macOS |
| build-essential | - | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | - | GCC, make, and build tools |
| Visual Studio Build Tools | - | - | - | - | :white_check_mark: | - | Windows C++ build tools |

## Shell

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Bash | :white_check_mark: | :x: | :x: | :x: | - | :white_check_mark: | Updated Bash shell |
| Bash Completion 2 | :white_check_mark: | :x: | :x: | :x: | - | - | Programmable completion for Bash |
| tmux | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | - | Terminal multiplexer |
| reattach-to-user-namespace | :white_check_mark: | - | - | - | - | - | macOS clipboard access in tmux |

## Version Control

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Git | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Distributed version control |
| gitego | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | Git productivity tool (Go) |

## JavaScript / Node.js

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| nvm | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Node Version Manager |
| Node.js 22 | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | JavaScript runtime |
| npm | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Node package manager |
| Yarn | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Alternative package manager |

## Programming Languages

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Go | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | Go programming language |

## Editors

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Vim | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | Text editor with plugins (minpac) |
| Visual Studio Code | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Code editor with extensions |
| Sublime Text | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Lightweight text editor |
| Cursor | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | AI-powered code editor |

## AI Tools

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Claude Code | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Anthropic CLI for Claude |
| Gemini CLI | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Google Gemini CLI (npm) |
| ChatGPT | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | OpenAI ChatGPT desktop app |
| GitHub Copilot | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | AI pair programmer (VS Code) |
| Superwhisper | :white_check_mark: | - | - | - | - | - | AI voice transcription (macOS only) |

## Containers

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Docker | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | Container runtime |
| Docker Compose | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | Multi-container orchestration |
| containerd.io | - | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | - | Container runtime |

## Browsers

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Google Chrome | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Web browser |
| Google Chrome Canary | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Chrome dev/beta channel |
| Safari Technology Preview | :white_check_mark: | - | - | - | - | - | Safari beta features |
| Chromium | :x: | :white_check_mark: | :white_check_mark: | :x: | :x: | - | Open-source browser |

## Security / Encryption

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| GPG | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | GNU Privacy Guard |
| pinentry-mac | :white_check_mark: | - | - | - | - | - | GPG PIN entry for macOS |
| pinentry-tty | - | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | - | GPG PIN entry for terminal |
| Nord Pass | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Password manager |
| Tailscale | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | Mesh VPN |

## Cloud / Infrastructure

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| AWS CLI | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | :white_check_mark: | :x: | Amazon Web Services CLI |
| Terraform (tfenv) | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | :white_check_mark: | :x: | Infrastructure as code |

## Databases

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| DbSchema | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Database diagram designer |
| Studio 3T | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | MongoDB GUI |

## API / Network Tools

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Postman | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | API testing platform |
| cURL | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Command-line HTTP client |
| LFTP | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | FTP/SFTP client |

## Media / Video

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| VLC | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | - | Media player |
| FFmpeg | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | Video/audio processing |
| AtomicParsley | :white_check_mark: | :x: | :x: | :x: | :x: | - | MP4/M4A metadata editor |
| yt-dlp | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | YouTube/video downloader |
| Elmedia Player | :white_check_mark: | - | - | - | - | - | macOS media player |
| Spotify | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Music streaming |
| Tidal | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Hi-fi music streaming |

## Image Tools

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| ImageOptim | :white_check_mark: | - | - | - | - | - | Image compression (macOS) |
| Pngyu | :white_check_mark: | - | - | - | - | - | PNG compression (macOS) |

## Productivity

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Microsoft Office 365 | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Office suite |
| Microsoft Teams | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Team collaboration |
| Slack | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Team messaging |
| Zoom | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Video conferencing |
| Keyboard Maestro | :white_check_mark: | - | - | - | - | - | macOS automation |
| Caffeine | :white_check_mark: | - | - | - | - | - | Prevent sleep (macOS) |

## Messaging

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| WhatsApp | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Messaging app |
| Messenger | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Facebook Messenger |

## Screen Capture

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Snagit | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Screen capture |
| Camtasia | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Screen recording |

## Design / Diagrams

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Adobe Creative Cloud | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Creative suite |
| Draw.IO | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Diagram editor |

## Utilities

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| jq | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | JSON processor |
| yq | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | YAML processor |
| ShellCheck | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | Shell script linter |
| Tree | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | Directory tree viewer |
| AppCleaner | :white_check_mark: | - | - | - | - | - | macOS app uninstaller |
| Beyond Compare | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | File/folder comparison |
| Balena Etcher | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Flash OS images to SD/USB |
| Termius | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | SSH client |

## Documents

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Pandoc | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | Document converter |
| LaTeX | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | Typesetting system |

## Web Font Tools

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| sfnt2woff-zopfli | :white_check_mark: | :x: | :x: | :x: | :x: | - | TTF/OTF to WOFF (Zopfli) |
| sfnt2woff | :white_check_mark: | :x: | :x: | :x: | :x: | - | TTF/OTF to WOFF |
| woff2 | :white_check_mark: | :x: | :x: | :x: | :x: | - | WOFF2 encoder/decoder |

## 3D Printing

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Bambu Studio | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | 3D printer slicer |

---

## VS Code Extensions (macOS only)

| Extension | Description |
|-----------|-------------|
| Better Align | Code alignment |
| Color Picker | Color selection tool |
| Dracula Theme | Dark theme |
| Docker | Docker integration |
| EditorConfig | EditorConfig support |
| ES7 React Snippets | React code snippets |
| File Icons | File icon theme |
| Fold/Unfold All Icons | Code folding icons |
| GitHub Copilot | AI pair programmer |
| GitHub Copilot Chat | AI chat assistant |
| Git Ignore | .gitignore support |
| Go | Go language support |
| JavaScript & TypeScript Nightly | Latest TS/JS features |
| Kubernetes YAML Formatter | K8s YAML formatting |
| Live Server | Local development server |
| Makefile Tools | Makefile support |
| MarkdownLint | Markdown linting |
| Next.js Snippets | Next.js code snippets |
| NGINX Configuration | NGINX syntax support |
| Prettier | Code formatter |
| React Snippets | React code snippets |
| REST Client | HTTP request testing |
| shell-format | Shell script formatting |
| Tailwind CSS IntelliSense | Tailwind autocomplete |
| Tailwind Shades | Tailwind color shades |
| vscode-icons | File icons |
| YAML | YAML language support |
