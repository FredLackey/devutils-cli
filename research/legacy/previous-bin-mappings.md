# Previous Bin Mappings

How global command registration worked in v0.0.18 and what it installed into the user's PATH.

---

## How It Worked

The `package.json` `bin` field maps command names to script files. When a user runs `npm install -g @fredlackey/devutils`, npm creates a symlink in the global `bin` directory for **every entry** in the `bin` object. This means a single `npm install -g` created **84 global commands** on the user's machine.

### The Core Command

```json
"dev": "./bin/dev.js"
```

This is the primary CLI entry point. All `dev <action>` subcommands route through this. This is the one intentional global command.

### The 83 Script Commands

Every script in `src/scripts/` was registered as its own global command. These went directly into the user's PATH as top-level executables — not subcommands of `dev`, but standalone commands.

---

## Full Bin Map (v0.0.18)

| Global Command | Source File | Collision Risk |
|---|---|---|
| `dev` | `./bin/dev.js` | Low — unique name |
| `afk` | `./src/scripts/afk.js` | Low |
| `backup-all` | `./src/scripts/backup-all.js` | Low |
| `backup-source` | `./src/scripts/backup-source.js` | Low |
| `brewd` | `./src/scripts/brewd.js` | Low |
| `brewi` | `./src/scripts/brewi.js` | Low |
| `brewr` | `./src/scripts/brewr.js` | Low |
| `brews` | `./src/scripts/brews.js` | Low |
| `brewu` | `./src/scripts/brewu.js` | Low |
| `c` | `./src/scripts/c.js` | **High** — single letter |
| `ccurl` | `./src/scripts/ccurl.js` | Low |
| `certbot-crontab-init` | `./src/scripts/certbot-crontab-init.js` | Low |
| `certbot-init` | `./src/scripts/certbot-init.js` | Low |
| `ch` | `./src/scripts/ch.js` | Medium — short name |
| `claude-danger` | `./src/scripts/claude-danger.js` | Low |
| `clean-dev` | `./src/scripts/clean-dev.js` | Low |
| `clear-dns-cache` | `./src/scripts/clear-dns-cache.js` | Low |
| `clone` | `./src/scripts/clone.js` | **High** — common term |
| `code-all` | `./src/scripts/code-all.js` | Low |
| `count` | `./src/scripts/count.js` | **High** — common term |
| `count-files` | `./src/scripts/count-files.js` | Medium |
| `count-folders` | `./src/scripts/count-folders.js` | Medium |
| `d` | `./src/scripts/d.js` | **High** — single letter |
| `datauri` | `./src/scripts/datauri.js` | Low |
| `delete-files` | `./src/scripts/delete-files.js` | Medium |
| `docker-clean` | `./src/scripts/docker-clean.js` | Medium |
| `dp` | `./src/scripts/dp.js` | Medium — short name |
| `e` | `./src/scripts/e.js` | **High** — single letter |
| `empty-trash` | `./src/scripts/empty-trash.js` | Low |
| `evm` | `./src/scripts/evm.js` | Medium — Ethereum VM confusion |
| `fetch-github-repos` | `./src/scripts/fetch-github-repos.js` | Low |
| `get-channel` | `./src/scripts/get-channel.js` | Low |
| `get-course` | `./src/scripts/get-course.js` | Low |
| `get-dependencies` | `./src/scripts/get-dependencies.js` | Low |
| `get-folder` | `./src/scripts/get-folder.js` | Low |
| `get-tunes` | `./src/scripts/get-tunes.js` | Low |
| `get-video` | `./src/scripts/get-video.js` | Low |
| `git-backup` | `./src/scripts/git-backup.js` | Medium |
| `git-clone` | `./src/scripts/git-clone.js` | **High** — shadows git subcommand pattern |
| `git-pup` | `./src/scripts/git-pup.js` | Medium — looks like git subcommand |
| `git-push` | `./src/scripts/git-push.js` | **High** — shadows git subcommand pattern |
| `h` | `./src/scripts/h.js` | **High** — single letter |
| `hide-desktop-icons` | `./src/scripts/hide-desktop-icons.js` | Low |
| `hide-hidden-files` | `./src/scripts/hide-hidden-files.js` | Low |
| `install-dependencies-from` | `./src/scripts/install-dependencies-from.js` | Low |
| `ips` | `./src/scripts/ips.js` | Medium |
| `iso` | `./src/scripts/iso.js` | Medium |
| `killni` | `./src/scripts/killni.js` | Low |
| `ll` | `./src/scripts/ll.js` | **High** — common alias |
| `local-ip` | `./src/scripts/local-ip.js` | Low |
| `m` | `./src/scripts/m.js` | **High** — single letter |
| `map` | `./src/scripts/map.js` | **High** — common term |
| `mkd` | `./src/scripts/mkd.js` | Medium |
| `ncu-update-all` | `./src/scripts/ncu-update-all.js` | Low |
| `nginx-init` | `./src/scripts/nginx-init.js` | Low |
| `npmi` | `./src/scripts/npmi.js` | Medium |
| `o` | `./src/scripts/o.js` | **High** — single letter |
| `org-by-date` | `./src/scripts/org-by-date.js` | Low |
| `p` | `./src/scripts/p.js` | **High** — single letter |
| `packages` | `./src/scripts/packages.js` | **High** — common term |
| `path` | `./src/scripts/path.js` | **High** — common term, system command on Windows |
| `ports` | `./src/scripts/ports.js` | Medium |
| `q` | `./src/scripts/q.js` | **High** — single letter, conflicts with Amazon Q CLI |
| `refresh-files` | `./src/scripts/refresh-files.js` | Low |
| `remove-smaller-files` | `./src/scripts/remove-smaller-files.js` | Low |
| `rename-files-with-date` | `./src/scripts/rename-files-with-date.js` | Low |
| `resize-image` | `./src/scripts/resize-image.js` | Low |
| `rm-safe` | `./src/scripts/rm-safe.js` | Medium |
| `s` | `./src/scripts/s.js` | **High** — single letter |
| `set-git-public` | `./src/scripts/set-git-public.js` | Low |
| `show-desktop-icons` | `./src/scripts/show-desktop-icons.js` | Low |
| `show-hidden-files` | `./src/scripts/show-hidden-files.js` | Low |
| `tpa` | `./src/scripts/tpa.js` | Low |
| `tpo` | `./src/scripts/tpo.js` | Low |
| `u` | `./src/scripts/u.js` | **High** — single letter |
| `vpush` | `./src/scripts/vpush.js` | Low |
| `y` | `./src/scripts/y.js` | **High** — single letter |

---

## Collision Risk Summary

| Risk Level | Count | Examples |
|---|---|---|
| **High** | 18 | `c`, `d`, `e`, `h`, `m`, `o`, `p`, `q`, `s`, `u`, `y`, `clone`, `count`, `ll`, `map`, `packages`, `path`, `git-push` |
| **Medium** | 13 | `ch`, `dp`, `evm`, `ips`, `iso`, `mkd`, `npmi`, `ports`, `rm-safe`, `docker-clean`, `count-files`, `count-folders`, `delete-files` |
| **Low** | 52 | Everything else |

18 commands had high collision risk — they could shadow existing system commands, common aliases, or other tools. The single-letter commands (`c`, `d`, `e`, `h`, `m`, `o`, `p`, `q`, `s`, `u`, `y`) were especially problematic because they could conflict with anything.

---

## What npm Actually Did on Install

When a user ran `npm install -g @fredlackey/devutils`:

1. npm downloaded the package to the global `node_modules` directory
2. npm created **84 symlinks** in the global bin directory (e.g., `/usr/local/bin/` on macOS, `%APPDATA%\npm\` on Windows)
3. Each symlink pointed to the corresponding script file inside the package
4. All 84 commands immediately became available in the user's PATH

On uninstall (`npm uninstall -g @fredlackey/devutils`), npm removed all 84 symlinks.

---

## Problems With This Approach

1. **Namespace pollution**: 83 commands dumped into the global PATH with no namespace prefix
2. **Collision risk**: Single-letter commands and common terms could shadow existing tools
3. **All-or-nothing**: No way to opt in to specific scripts — you got all 83 or none
4. **Discovery**: No way to know which commands came from DevUtils vs. other tools
5. **Platform mismatch**: macOS-only scripts (like `brewd`, `afk`) were registered on all platforms, even where they'd fail
6. **Package size**: All 83 scripts shipped to every user, even if they'd never use most of them

---

## Considerations for the Rebuild

The new architecture should address these by:

- Making script registration **opt-in** through user configuration
- Namespacing scripts under `dev` (e.g., `dev run afk`) or letting users choose their own aliases
- Only registering scripts that are relevant to the user's platform
- Allowing users to define which scripts they want as global commands
- Keeping the `dev` command as the single guaranteed global entry point
