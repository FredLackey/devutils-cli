# Scripts Reference

This document catalogs **Scripts** — standalone global utilities that replace shell aliases and functions from dotfiles.

> **Terminology:** Scripts are single-command utilities implemented in `src/scripts/`. For the `dev <action>` CLI structure, see [Commands](../docs/COMMANDS.md).

**Source:** Aliases and functions from `~/projects/dotfiles/`.

## Target Systems

This analysis covers the following platforms:

| Platform | Base | Notes |
|----------|------|-------|
| **Ubuntu Linux** | Debian | Desktop and server variants |
| **Raspberry Pi OS** | Debian | ARM-based, similar to Ubuntu |
| **Amazon Linux** | RHEL/CentOS | EC2 instances, AL2 and AL2023 |
| **macOS** | BSD/Darwin | Includes BSD utilities |
| **Git Bash** | MinGW | Windows; minimal Unix utilities |

## npm Global Command Feasibility

**How PATH priority works:**
- npm's global bin directory (`/usr/local/bin` or `~/.npm-global/bin`) typically comes *before* system directories (`/usr/bin`, `/bin`) in PATH
- This means npm global commands **can shadow system commands**
- Shell builtins (`cd`, `exit`, `source`) cannot be overridden by PATH

**Legend for "npm Global" column:**
| Value | Meaning |
|-------|---------|
| Yes | Safe - no conflicts on target systems |
| No - Syntax | Invalid npm command name (dots, colons, etc.) |
| No - OS | Would shadow critical OS utility |
| No - Tool | Conflicts with commonly installed dev tool |
| Caution | Low risk but worth noting |

---

## Aliases

### Navigation
| Alias | npm Global | Description |
|-------|------------|-------------|
| `..` | No - Syntax | Go up one directory |
| `...` | No - Syntax | Go up two directories |
| `....` | No - Syntax | Go up three directories |
| `d` | Yes | Go to Desktop |
| `p` | Yes | Go to projects folder |

> **Notes:** No conflicts. None of the target systems have `d` or `p` as default commands.

### File Operations
| Alias | npm Global | Description |
|-------|------------|-------------|
| `cp` | No - OS | Copy with interactive/verbose mode |
| `mv` | No - OS | Move with interactive/verbose mode |
| `rm` | No - OS | Remove (wrapped by `rm_safe`) |
| `mkdir` | No - OS | Make directory with parents/verbose |
| `ll` | Yes | Long listing |

### Shortcuts
| Alias | npm Global | Description |
|-------|------------|-------------|
| `c` | Yes | Clear terminal |
| `e` | Yes | Open vim |
| `m` | Yes | Open man pages |
| `n` | No - Tool | npm shortcut |
| `y` | Yes | yarn shortcut |
| `q` | Yes | Exit shell |
| `:q` | No - Syntax | Exit shell (vim style) |
| `ch` | Yes | Clear bash history |

> **Notes:**
> - `c`, `e`, `m`, `y`, `q` - No conflicts. None of the target systems have these as default commands.
> - `n` - Conflicts with [`n`](https://github.com/tj/n), a popular Node.js version manager installed via `npm install -g n`. Using `n` would shadow it.

### Utilities
| Alias | npm Global | Description |
|-------|------------|-------------|
| `ip` | No - OS | Get public IP |
| `path` | Yes | Display PATH entries one per line |
| `map` | Yes | xargs with one argument per line |
| `count` | Yes | Count files and folders in current directory |
| `count-files` | Yes | Count only files |
| `count-folders` | Yes | Count only folders |

> **Notes:**
> - `ip` - Conflicts with Linux `ip` command (network configuration utility) on Ubuntu, Raspberry Pi OS, and Amazon Linux. Not present on macOS or Git Bash.
> - `path`, `map` - No conflicts. Not default commands on any target system.

### Terraform
| Alias | npm Global | Description |
|-------|------------|-------------|
| `tpo` | Yes | Terraform plan with output file |
| `tpa` | Yes | Terraform apply from plan file |

### macOS Specific
| Alias | npm Global | Description |
|-------|------------|-------------|
| `afk` | Yes | Lock screen / sleep |
| `o` | Yes | Open file/folder in Finder |
| `u` | Yes | Update macOS and Homebrew |
| `brewd` | Yes | Homebrew doctor |
| `brewi` | Yes | Homebrew install |
| `brewr` | Yes | Homebrew uninstall |
| `brews` | Yes | Homebrew search |
| `brewu` | Yes | Homebrew update/upgrade/cleanup |
| `clear-dns-cache` | Yes | Flush DNS cache |
| `empty-trash` | Yes | Empty all trash and system logs |
| `hide-desktop-icons` | Yes | Hide Finder desktop icons |
| `show-desktop-icons` | Yes | Show Finder desktop icons |
| `hide-hidden-files` | Yes | Hide dotfiles in Finder |
| `show-hidden-files` | Yes | Show dotfiles in Finder |
| `local-ip` | Yes | Get local network IP |
| `ports` | Yes | List open ports |
| `iso` | Yes | Print ISO timestamp (LA timezone) |
| `code-all` | Yes | Open all subdirectories in VS Code |
| `packages` | Yes | Find all package.json files with dates |

> **Notes:**
> - `o`, `u` - No conflicts. Not default commands on any target system.

---

## Functions

### Git
| Function | npm Global | Description |
|----------|------------|-------------|
| `clone` | Yes | Clone repo and install dependencies |
| `git-clone` | Yes | Copy repo structure without .git folder |
| `git-pup` | Yes | Pull and update submodules |
| `git-push` | Yes | Add, commit, and push in one command |
| `git-backup` | Yes | Create timestamped zip backup of repo |
| `set-git-public` | Yes | Set git user to public identity |
| `vpush` | Yes | Commit with package.json version as message |
| `fetch-github-repos` | Yes | Clone all repos from a GitHub org |

> **Notes:** No conflicts. `clone` is not a system command (users invoke `git clone`, not `clone` directly).

### Docker
| Function | npm Global | Description |
|----------|------------|-------------|
| `dp` | Yes | Display running containers (formatted) |
| `docker-clean` | Yes | Remove all containers, images, volumes |

### Node/npm
| Function | npm Global | Description |
|----------|------------|-------------|
| `npmi` | Yes | Remove node_modules and reinstall (Node 18) |
| `clean-dev` | Yes | Remove node_modules/bower_components recursively |
| `ncu-update-all` | Yes | Update all package.json dependencies |
| `get-dependencies` | Yes | Extract dependency names from package.json |
| `install-dependencies-from` | Yes | Install deps from another package.json |

### File Management
| Function | npm Global | Description |
|----------|------------|-------------|
| `mkd` | Yes | Create directory and cd into it |
| `delete-files` | Yes | Delete files matching pattern |
| `refresh-files` | Yes | Copy matching files from source to target |
| `get-folder` | Yes | Copy files with size comparison (rsync/robocopy) |
| `remove-smaller-files` | Yes | Compare directories, remove smaller duplicates |
| `org-by-date` | Yes | Organize files into date-based folders |
| `rename-files-with-date` | Yes | Normalize date-based filenames |
| `rm-safe` | Yes | Wrapper preventing dangerous rm operations |

### Media/Downloads
| Function | npm Global | Description |
|----------|------------|-------------|
| `get-tunes` | Yes | Download audio/video from URL (yt-dlp) |
| `get-video` | Yes | Download video only (yt-dlp) |
| `get-channel` | Yes | Download YouTube channel videos |
| `get-course` | Yes | Download Pluralsight course |
| `datauri` | Yes | Convert file to base64 data URI |
| `resize-image` | Yes | Resize image using ImageMagick |

### Search
| Function | npm Global | Description |
|----------|------------|-------------|
| `h` | Yes | Search command history |
| `s` | Yes | Search text in current directory |

> **Notes:** No conflicts. `h` and `s` are not default commands on any target system.

### Backup
| Function | npm Global | Description |
|----------|------------|-------------|
| `backup-source` | Yes | Backup ~/Source directory |
| `backup-all` | Yes | Backup multiple user directories |

### Network
| Function | npm Global | Description |
|----------|------------|-------------|
| `ips` | Yes | Scan local network for active IPs (nmap) |
| `ccurl` | Yes | Curl JSON endpoint with pretty output |

### Server/Nginx
| Function | npm Global | Description |
|----------|------------|-------------|
| `nginx-init` | Yes | Create nginx config from template |
| `certbot-init` | Yes | Install SSL certificates via certbot |
| `certbot-crontab-init` | Yes | Add certbot renewal cron job |

### Misc
| Function | npm Global | Description |
|----------|------------|-------------|
| `evm` | Yes | Execute vim macro on files |
| `killni` | Yes | Kill Node Inspector processes |
| `talk` | Caution | Text-to-speech from selection |
| `claude-danger` | Yes | Launch Claude CLI skipping permissions |

> **Notes:**
> - `talk` - macOS has `/usr/bin/talk` (user-to-user chat utility) installed by default. Linux systems (Ubuntu, Raspberry Pi OS, Amazon Linux) do NOT have it by default—requires `apt install talk`. Low risk but worth noting for macOS users.

---

## Summary

| Category | Count | Examples |
|----------|-------|----------|
| **Safe (Yes)** | ~60 | Most commands have no conflicts |
| **Cannot use - Syntax** | 4 | `..`, `...`, `....`, `:q` |
| **Cannot use - OS** | 5 | `cp`, `mv`, `rm`, `mkdir`, `ip` |
| **Cannot use - Tool** | 1 | `n` (node version manager) |
| **Caution** | 1 | `talk` (macOS only conflict) |

**Key Findings:**
- Most single-letter commands (`c`, `d`, `e`, `h`, `m`, `o`, `p`, `q`, `s`, `u`, `y`) are safe—they don't exist as default commands on any target system
- Core OS utilities (`cp`, `mv`, `rm`, `mkdir`, `ip`) must be avoided
- The `n` command conflicts with the popular Node.js version manager
- `talk` only conflicts on macOS (pre-installed chat utility)
