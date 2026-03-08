# Previous Commands and Functions Inventory

Catalog of all commands, scripts, utilities, and supporting structures from the v0.0.18 codebase, now located in `_rebuild/`. Data sourced from the actual source files and `_rebuild/ai-docs/` reference docs.

---

## CLI Entry Point

**`bin/dev.js`** is the main entry point. It checks for tab completion mode (`process.env.COMP_LINE`) and delegates to either `src/completion.js` or `src/cli.js`.

---

## Commands (`src/commands/`)

These are the `dev <action>` subcommands. There are 8 total.

### configure (`configure.js`)

Interactive configuration wizard for the developer profile.

| Flag | Description |
|---|---|
| `--name <name>` | Developer name |
| `--email <email>` | Developer email |
| `--url <url>` | Developer URL (optional) |
| `--force` | Overwrite config without prompting |
| `-s, --show` | Display current configuration |

Creates/updates `~/.devutils` JSON config file. Detects existing config and prompts for update unless `--force` is used.

### setup (`setup.js`)

Install essential tools required for DevUtils CLI to function (git, ssh-keygen, gpg, curl, plus Homebrew on macOS).

| Flag | Description |
|---|---|
| `--force` | Install without prompting |
| `--check` | Check tool status without installing |

Checks which tools are missing, prompts user, installs via the appropriate installer. Skips tools already present.

### status (`status.js`)

Display current configuration and environment health check.

| Flag | Description |
|---|---|
| `--verbose` | Show detailed information |

Shows: config file status and content, OS/Node/npm versions, current working directory, git repo info, available tools (git, docker, VS Code, Homebrew, Chocolatey, winget), configured identities, and warnings about missing configuration.

### install (`install.js`)

Platform-agnostic installation of development tools.

**Usage**: `dev install <name>`

Features:
- Automatic dependency resolution (recursive)
- Idempotency via `isInstalled()` — skips if already installed
- Platform eligibility checking via `isEligible()`
- Priority-ordered installation of dependencies
- Deduplication of transitive dependencies
- Loads dependency metadata from `src/installs/installers.json`

### ignore (`ignore.js`)

Append technology-specific patterns to `.gitignore`.

**Usage**: `dev ignore <technology> [folder]`

| Flag | Description |
|---|---|
| `--list` | Show available technologies |
| `--dry-run` | Preview changes without modifying files |
| `--force` | Re-add patterns even if section already exists |
| `--verbose` | Show patterns being added |

Reads patterns from `src/ignore/*.txt` files. Uses section markers (`# === @fredlackey/devutils: {technology} ===`) to prevent duplicates.

### identity (`identity.js`)

Manage identity profiles for git config, SSH keys, and GPG signing.

**Subcommands**:
- `dev identity add` — Add new identity profile
- `dev identity remove` — Remove identity profile
- `dev identity link` — Link identity to source folder

Parses remote URLs (supports `git@host:`, `ssh://`, `https://`). Manages SSH keys and GPG signatures. Configurable via `~/.devutils` identity section.

### update (`update.js`)

Update the package to the latest version. Queries NPM registry, compares semantic versions, runs `npm install -g @fredlackey/devutils@latest`.

### version (`version.js`)

Display current version and check for updates. Shows current version, latest available version, and update instructions. Does not install anything.

---

## Scripts (`src/scripts/`)

80 standalone global utilities that replace shell aliases. Each is a direct command (e.g., `afk`, `clone`, `ll`). All follow the same module pattern:

```javascript
#!/usr/bin/env node
async function main(args) { /* args = process.argv.slice(2) */ }
module.exports = { main };
if (require.main === module) { main(process.argv.slice(2)); }
```

### Navigation & Shell

| Script | Description |
|---|---|
| `c.js` | Clear terminal |
| `d.js` | Go to Desktop |
| `e.js` | Open vim |
| `h.js` | Search command history |
| `ll.js` | Long directory listing (platform-aware) |
| `m.js` | Open man pages |
| `o.js` | Open file/folder in Finder (macOS) |
| `p.js` | Go to projects folder |
| `q.js` | Exit shell |
| `s.js` | Search text in current directory |
| `ch.js` | Clear bash history |
| `path.js` | Display PATH entries one per line |

### Git Operations

| Script | Description |
|---|---|
| `clone.js` | Clone repo and install dependencies (auto-detects yarn/pnpm/npm) |
| `git-clone.js` | Copy repo structure without .git |
| `git-pup.js` | Pull and update submodules |
| `git-push.js` | Add, commit, and push in one command |
| `git-backup.js` | Create timestamped zip backup |
| `set-git-public.js` | Set git user to public identity |
| `vpush.js` | Commit with package.json version as message |
| `fetch-github-repos.js` | Clone all repos from GitHub org |

### Homebrew (macOS)

| Script | Description |
|---|---|
| `brewd.js` | Homebrew doctor |
| `brewi.js` | Homebrew install |
| `brewr.js` | Homebrew remove |
| `brews.js` | Homebrew search |
| `brewu.js` | Homebrew update |

### Docker

| Script | Description |
|---|---|
| `dp.js` | Display running containers (formatted) |
| `docker-clean.js` | Remove all containers, images, volumes |

### Node.js / npm

| Script | Description |
|---|---|
| `npmi.js` | Remove node_modules and reinstall |
| `clean-dev.js` | Remove node_modules/bower_components recursively |
| `ncu-update-all.js` | Update all package.json dependencies |
| `get-dependencies.js` | Extract dependency names from package.json |
| `install-dependencies-from.js` | Install deps from another package.json |
| `y.js` | Yarn shortcut |

### File Management

| Script | Description |
|---|---|
| `mkd.js` | Create directory and cd into it |
| `delete-files.js` | Delete files matching pattern |
| `refresh-files.js` | Copy matching files from source to target |
| `get-folder.js` | Copy files with size comparison (rsync/robocopy) |
| `remove-smaller-files.js` | Compare dirs, remove smaller duplicates |
| `org-by-date.js` | Organize files into date-based folders |
| `rename-files-with-date.js` | Normalize date-based filenames |
| `rm-safe.js` | Wrapper preventing dangerous rm operations |
| `count.js` | Count files and folders in current directory |
| `count-files.js` | Count only files |
| `count-folders.js` | Count only folders |

### Media & Downloads

| Script | Description |
|---|---|
| `get-tunes.js` | Download audio/video from URL (yt-dlp) |
| `get-video.js` | Download video only |
| `get-channel.js` | Download YouTube channel videos |
| `get-course.js` | Download Pluralsight course |
| `datauri.js` | Convert file to base64 data URI |
| `resize-image.js` | Resize image using ImageMagick |

### Network & Server

| Script | Description |
|---|---|
| `ips.js` | Scan local network for active IPs (nmap) |
| `ccurl.js` | Curl JSON endpoint with pretty output |
| `local-ip.js` | Get local network IP |
| `ports.js` | List open ports |
| `nginx-init.js` | Create nginx config from template |
| `certbot-init.js` | Install SSL certificates via certbot |
| `certbot-crontab-init.js` | Add certbot renewal cron job |

### macOS-Specific

| Script | Description |
|---|---|
| `afk.js` | Lock screen / sleep |
| `u.js` | Update macOS and Homebrew |
| `clear-dns-cache.js` | Flush DNS cache |
| `empty-trash.js` | Empty trash and system logs |
| `hide-desktop-icons.js` | Hide Finder desktop icons |
| `show-desktop-icons.js` | Show Finder desktop icons |
| `hide-hidden-files.js` | Hide dotfiles in Finder |
| `show-hidden-files.js` | Show dotfiles in Finder |
| `code-all.js` | Open all subdirectories in VS Code |
| `iso.js` | Print ISO timestamp (LA timezone) |
| `packages.js` | Find all package.json files with dates |

### Terraform

| Script | Description |
|---|---|
| `tpo.js` | Terraform plan with output file |
| `tpa.js` | Terraform apply from plan file |

### Backup

| Script | Description |
|---|---|
| `backup-source.js` | Backup ~/Source directory |
| `backup-all.js` | Backup multiple user directories |

### Miscellaneous

| Script | Description |
|---|---|
| `map.js` | xargs with one argument per line |
| `evm.js` | Execute vim macro on files |
| `killni.js` | Kill Node Inspector processes |
| `claude-danger.js` | Launch Claude CLI skipping permissions |

---

## Utilities (`src/utils/`)

Internal shared code. Not user-facing. Organized by platform with a `common/` folder for cross-platform modules.

### Common (`src/utils/common/`)

| Module | Key Exports |
|---|---|
| `os.js` | `detect()` returns `{ type, packageManager }`. Also: `isWindows()`, `isMacOS()`, `isLinux()`, `isWSL()`, `getArch()`, `getDistro()` |
| `shell.js` | `exec(command, options)` (async), `execSync(command, options)`, `which(executable)`, `commandExists(command)` |
| `network.js` | `isOnline()`, `canReach(hostname)` |
| `privileges.js` | `isElevated()`, `requiresElevation(operation)` |
| `display.js` | `hasDisplay()` (X11, Wayland, Windows desktop check), `isHeadless()` |
| `apps.js` | `isInstalled(appName)`, `getVersion(appName)`, `getInstallPath(appName)` |
| `package-manager.js` | `getAvailable()`, `getPreferred()`, `install(packageName, options)` |

### macOS (`src/utils/macos/`)

| Module | Key Exports |
|---|---|
| `brew.js` | `isInstalled()`, `install(formula)`, `installCask(cask)`, `uninstall()`, `isFormulaInstalled()`, `isCaskInstalled()`, `update()`, `upgrade()`, `tap()`, `search()` |
| `apps.js` | `isAppInstalled(appName)`, `getAppBundlePath()`, `getAppVersion()`, `listInstalledApps()` |

### Ubuntu (`src/utils/ubuntu/`)

| Module | Key Exports |
|---|---|
| `apt.js` | `isInstalled()`, `install()`, `remove()`, `update()`, `upgrade()`, `isPackageInstalled()`, `getPackageVersion()`, `addRepository()`, `addKey()`, `addKeyFromKeyserver()` |
| `snap.js` | `isInstalled()`, `install(snap, options)` (supports classic confinement), `remove()`, `isSnapInstalled()`, `getSnapVersion()`, `refresh()`, `list()` |
| `desktop.js` | `hasDesktop()`, `getDesktopEnvironment()`, `getDisplayServer()`, `isX11()`, `isWayland()`, `getDisplayVariable()` |
| `systemd.js` | `isServiceRunning()`, `startService()`, `enableService()`, `isSystemdAvailable()` |

### Raspberry Pi OS (`src/utils/raspbian/`)

Shares APT/Snap utilities with Ubuntu. ARM architecture considerations.

### Amazon Linux (`src/utils/amazon_linux/`)

| Module | Key Exports |
|---|---|
| `dnf.js` | Same interface as `apt.js` but uses DNF commands (AL2023+) |
| `yum.js` | Same interface as `dnf.js` for older Amazon Linux 2 |

### Windows (`src/utils/windows/`)

| Module | Key Exports |
|---|---|
| `choco.js` | `isInstalled()`, `install()`, `uninstall()`, `isPackageInstalled()`, `getPackageVersion()`, `upgrade()`, `search()` |
| `winget.js` | `isInstalled()`, `install()`, `uninstall()`, `isPackageInstalled()`, `getPackageVersion()`, `upgrade()`, `search()`, `list()` |
| `shell.js` | `isPowerShell()`, `isCmd()`, `isWindowsTerminal()`, `getPowerShellVersion()`, `getShellName()` |
| `registry.js` | `isAppInstalled()`, `getInstallPath()`, `getAppVersion()`, `keyExists()`, `getValue()` |
| `env.js` | `getPath()`, `addToPath()`, `removeFromPath()`, `get()`, `set()` |

### Git Bash (`src/utils/gitbash/`)

Minimal utilities for Git Bash on Windows.

---

## Ignore Patterns (`src/ignore/`)

8 pattern files for `.gitignore` management:

| File | Technology |
|---|---|
| `claude-code.txt` | Claude Code editor |
| `docker.txt` | Docker |
| `linux.txt` | Linux |
| `macos.txt` | macOS (.DS_Store, .AppleDouble, etc.) |
| `node.txt` | Node.js / npm (node_modules, dist, etc.) |
| `terraform.txt` | Terraform (.tfstate, plans, etc.) |
| `vscode.txt` | VS Code |
| `windows.txt` | Windows (Thumbs.db, etc.) |

---

## Template Files (`files/`)

| Path | Content |
|---|---|
| `files/claude/` | Claude-related template/reference files |
| `files/monorepos/` | Monorepo templates and structure docs (subdirs: research, docs, scripts, packages, apps, _archive, _legacy) |

---

## Configuration (`~/.devutils`)

Single JSON file storing user preferences:

```json
{
  "user": {
    "name": "Developer Name",
    "email": "dev@example.com",
    "url": "https://example.com"
  },
  "identities": {
    "identity-name": {
      "email": "email@host.com"
    }
  },
  "defaults": {
    "license": "MIT",
    "package_manager": "npm"
  },
  "created": "2024-01-01T00:00:00.000Z",
  "updated": "2024-01-01T00:00:00.000Z"
}
```

---

## Reference Documentation (`_rebuild/ai-docs/`)

| File | Description |
|---|---|
| `COMMAND_STRUCTURE.md` | CLI command hierarchy and tab completion |
| `SCRIPTS_REFERENCE.md` | Script utilities guide |
| `UTILS_REFERENCE.md` | Utility modules documentation |
| `INSTALLS_REFERENCE.md` | Installer functions and dependency orchestration |
| `COMMAND_AGENT_USAGE.md` | Command agent patterns |
| `LOCAL_TESTING.md` | Testing instructions |
| `SOURCE_LINKING.md` | Source code linking |
| `TEMP_DESKTOPAPPS.md` | Desktop app installation notes |

---

## Summary

| Category | Count | Location |
|---|---|---|
| Commands | 8 | `src/commands/` |
| Scripts | 80 | `src/scripts/` |
| Installers | 93 | `src/installs/` |
| Ignore patterns | 8 | `src/ignore/` |
| Utility modules | ~23 | `src/utils/` |
| Template dirs | 2 | `files/` |
| Platforms | 7 | macOS, Ubuntu, Raspberry Pi OS, Amazon Linux, Windows, Git Bash, WSL |
