# Proposed Package Structure

Directory layout for the DevUtils CLI rebuild. Designed to mirror the command structure
so that a junior developer can find the code for any command by following the same path
they'd type in the terminal.

**Guiding rule**: If you can type `dev config init`, you can find the code at
`src/commands/config/init.js`. No hunting.

---

## Top-Level Layout

```
devutils-cli/
│
├── src/
│   ├── cli.js                        # CLI entry point and command router (registered in package.json bin)
│   ├── commands/                     # One folder per service, one file per method
│   ├── api/                          # API plugin loader, registry, and management commands
│   ├── installers/                   # Tool installation scripts (per-tool, per-platform)
│   ├── utils/                        # Utility function library (dev util run <name>)
│   ├── lib/                          # Shared internal modules (not user-facing)
│   └── patterns/                     # Pattern files organized by type (gitignore, etc.)
│
├── research/                         # Design docs (this folder)
├── _rebuild/                         # Legacy v0.0.18 code (reference only)
│
├── package.json
├── CLAUDE.md
└── README.md
```

---

## `src/cli.js` — Entry Point and Command Router

Registered directly in `package.json` `bin` as the `dev` command. No separate
`bin/` folder needed. This single file parses arguments, resolves the service and
method, applies global flags, runs output format detection, and dispatches to the
right command file.

Responsibilities:

- Parse `dev <service> [resource] <method> [arguments] [flags]`
- Apply global flags (`--format`, `--dry-run`, `--verbose`, `--quiet`, `--json`)
- Call `lib/detect.js` to resolve the default output format
- Load the matching command from `commands/<service>/<method>.js`
- Handle unknown commands with helpful suggestions
- Handle `--version` and `--help` at the top level

This file should not contain business logic. It's routing only.

---

## `src/commands/` — Service Commands

One folder per service. One file per method. Every folder has an `index.js` that
registers the service's commands and their metadata (description, arguments, flags).

```
commands/
│
├── config/
│   ├── index.js                      # Registers: init, show, get, set, reset, export, import
│   ├── init.js
│   ├── show.js
│   ├── get.js
│   ├── set.js
│   ├── reset.js
│   ├── export.js
│   └── import.js
│
├── machine/
│   ├── index.js                      # Registers: detect, show, set, list
│   ├── detect.js
│   ├── show.js
│   ├── set.js
│   └── list.js
│
├── identity/
│   ├── index.js                      # Registers: add, remove, list, show, link, unlink, sync
│   ├── add.js
│   ├── remove.js
│   ├── list.js
│   ├── show.js
│   ├── link.js
│   ├── unlink.js
│   └── sync.js
│
├── tools/
│   ├── index.js                      # Registers: install, check, list, search
│   ├── install.js
│   ├── check.js
│   ├── list.js
│   └── search.js
│
├── ignore/
│   ├── index.js                      # Registers: add, remove, list, show
│   ├── add.js
│   ├── remove.js
│   ├── list.js
│   └── show.js
│
│
├── util/
│   ├── index.js                      # Registers: run, list, show, add, remove
│   ├── run.js
│   ├── list.js
│   ├── show.js
│   ├── add.js
│   └── remove.js
│
├── alias/
│   ├── index.js                      # Registers: add, remove, list, sync
│   ├── add.js
│   ├── remove.js
│   ├── list.js
│   └── sync.js
│
├── auth/
│   ├── index.js                      # Registers: login, logout, list, status, refresh
│   ├── login.js
│   ├── logout.js
│   ├── list.js
│   ├── status.js
│   └── refresh.js
│
├── api/
│   ├── index.js                      # Registers: list, enable, disable, update + plugin loading
│   ├── list.js
│   ├── enable.js
│   ├── disable.js
│   └── update.js
│
├── ai/
│   ├── index.js                      # Registers: launch, resume, list, sessions, show, set
│   ├── launch.js
│   ├── resume.js
│   ├── list.js
│   ├── sessions.js
│   ├── show.js
│   └── set.js
│
├── search/
│   ├── index.js                      # Registers: query, keyword, semantic, get, collections, index, status
│   ├── query.js                      # Hybrid search (BM25 + vector + LLM re-ranking)
│   ├── keyword.js                    # Fast BM25 keyword search
│   ├── semantic.js                   # Vector similarity search
│   ├── get.js                        # Retrieve a document by path or ID
│   ├── collections.js                # Manage collections (add, remove, list)
│   ├── index-cmd.js                  # Rebuild or update the search index (named to avoid shadowing index.js)
│   └── status.js                     # Show index health and collection info
│
├── status.js                         # Top-level command (no subfolder needed)
├── update.js                         # Top-level command
├── version.js                        # Top-level command
├── schema.js                         # Top-level command
└── help.js                           # Top-level command
```

### What goes in each method file

Every method file exports a single async function and a metadata object. The function
receives parsed arguments and a context object (config, output formatter, platform info).
It does one thing: execute the command and return structured output.

```javascript
const meta = {
  description: 'What this command does',
  arguments: [ /* ... */ ],
  flags: [ /* ... */ ]
};

async function run(args, context) {
  // do the thing
  // return structured result
}

module.exports = { meta, run };
```

### What goes in each index.js

The index file registers the service. It lists the available methods, their metadata,
and how to load them. It does not contain logic.

```javascript
module.exports = {
  name: 'config',
  description: 'User configuration and onboarding',
  commands: {
    init:   () => require('./init'),
    show:   () => require('./show'),
    get:    () => require('./get'),
    set:    () => require('./set'),
    reset:  () => require('./reset'),
    export: () => require('./export'),
    import: () => require('./import'),
  }
};
```

Lazy loading (the `() => require()` pattern) means the CLI only loads the code for
the command being run, not every service on every invocation.

---

## `src/api/` — API Plugin System

The core CLI does not contain any API service implementations. API wrappers are
installed as plugins into `~/.devutils/plugins/`. This directory contains only the
plugin management code and the registry of known plugins.

```
api/
│
├── registry.json                     # Known plugins (name, npm package, description, auth service)
└── loader.js                         # Plugin discovery, loading, and command registration
```

### How `dev api gmail messages list` resolves

1. `src/cli.js` sees `api` → loads `src/commands/api/index.js`
2. `commands/api/index.js` sees `gmail` → calls `src/api/loader.js`
3. `loader.js` reads `~/.devutils/plugins.json`, finds `gmail`
4. Loads `~/.devutils/plugins/node_modules/@fredlackey/devutils-api-gmail`
5. Plugin's `resources.messages.commands.list` resolves to the command file
6. Core CLI builds the context object (auth, output, errors, config) and calls `run()`
7. Returns a flat JSON array to the caller

If `gmail` is not in `plugins.json`, the CLI returns an error:
`API plugin "gmail" is not installed. Run "dev api enable gmail" to install it.`

### Adding a new API service

1. Create an npm package following the plugin contract (see `proposed-api-plugin-architecture.md`)
2. Add it to `registry.json` so `dev api list` shows it as available
3. Users install it with `dev api enable <name>`
4. No changes to the core CLI code

### Plugin packages (separate repos)

Each API service lives in its own repo and npm package:

```
@fredlackey/devutils-api-gmail
@fredlackey/devutils-api-drive
@fredlackey/devutils-api-sheets
@fredlackey/devutils-api-docs
@fredlackey/devutils-api-aws
@fredlackey/devutils-api-cloudflare
@fredlackey/devutils-api-dokploy
@fredlackey/devutils-api-namecheap
@fredlackey/devutils-api-flowroute
@fredlackey/devutils-api-mailu
```

See `proposed-api-plugin-architecture.md` for the plugin contract, directory
structure, and context object that the core CLI provides to plugins.

---

## `src/installers/` — Tool Installation Scripts

One file per tool. Each file contains platform-specific install functions and the
standard `isInstalled` / `isEligible` / `install` interface.

```
installers/
│
├── registry.json                     # Metadata: dependencies, platforms, desktop flag, status
│
├── docker.js
├── node.js
├── vscode.js
├── git.js
├── homebrew.js
├── claude-code.js
├── ... (93 installers carried forward from _rebuild as needed)
```

The `commands/tools/install.js` command reads `registry.json` for dependency resolution,
then calls the matching installer file.

This is the same pattern from v0.0.18. It worked well and doesn't need to change.

---

## `src/utils/` — Utility Function Library

Where the complex, platform-aware functions live. Called by `dev util run <name>`.

```
utils/
│
├── registry.json                     # Metadata: name, description, platforms, arguments
│
├── git-push/
│   ├── index.js                      # Entry point, argument parsing, delegates to platform
│   ├── unix.sh                       # Bash implementation (macOS, Linux)
│   └── windows.ps1                   # PowerShell implementation (Windows)
│
├── git-status/
│   ├── index.js
│   ├── unix.sh
│   └── windows.ps1
│
├── clone/
│   ├── index.js
│   ├── unix.sh
│   └── windows.ps1
│
├── docker-clean/
│   ├── index.js
│   └── unix.sh                       # No Windows equivalent needed
│
├── ... (additional utilities)
```

### Why folders instead of single files

Some utilities are simple enough to be a single `.js` file. Others (like `git-status`
at 212 lines of bash) are genuinely better implemented as shell scripts that get
called by a thin Node.js wrapper. The folder structure supports both:

- **Simple utility**: A single `index.js` with all logic in JavaScript
- **Complex utility with platform variants**: An `index.js` that detects the platform
  and shells out to the right script

The `index.js` in each folder always exports the same interface:

```javascript
const meta = {
  name: 'git-status',
  description: 'Multi-repo git status with color-coded summary',
  platforms: ['macos', 'ubuntu', 'raspbian', 'amazon_linux', 'windows'],
  arguments: [ /* ... */ ]
};

async function run(args, context) {
  // detect platform, call the right script, return structured result
}

module.exports = { meta, run };
```

### User-added utilities

When a user runs `dev util add`, DevUtils registers the utility in `~/.devutils/utils/`
(not in the package directory). The `dev util list` and `dev util run` commands check
both the built-in `src/utils/` and the user's `~/.devutils/utils/` directory.

---

## `src/lib/` — Shared Internal Modules

Code that multiple commands or services need. Not user-facing. Junior developers
should think of this as "the toolbox that commands reach into."

```
lib/
│
├── detect.js                         # Output mode detection (AI env, CI env, TTY fallback)
├── output.js                         # Output formatting (json, table, yaml, csv)
├── errors.js                         # Structured error formatting (JSON to stderr)
├── platform.js                       # OS and platform detection (type, arch, package manager)
├── shell.js                          # Shell command execution (exec, execSync, which, commandExists)
├── config.js                         # Config file read/write (~/.devutils/ directory)
├── prompt.js                         # Interactive prompts (respects non-interactive detection)
├── github.js                         # GitHub helpers (gh CLI wrapper for repos, gists, auth)
├── schema.js                         # Schema registry (command introspection for dev schema)
│
└── platforms/                        # Platform-specific helpers
    ├── macos.js                      # Homebrew, macOS app detection, system preferences
    ├── ubuntu.js                     # APT, Snap, systemd, desktop detection
    ├── raspbian.js                   # APT, Snap, ARM considerations
    ├── amazon-linux.js               # DNF, YUM
    ├── windows.js                    # Chocolatey, winget, registry, environment variables
    └── gitbash.js                    # Git Bash on Windows
```

### What goes in each file

**`detect.js`** — The reusable output detection function described in the proposed
command structure. Checks AI env vars, CI env vars, then TTY. Returns `{ format, caller }`.
Every command calls this once.

**`output.js`** — Takes structured data and a format (`json`, `table`, `yaml`, `csv`)
and produces the formatted output string. Handles pretty vs. compact JSON, table column
sizing, CSV escaping. Also handles writing errors to stderr as structured JSON.

**`errors.js`** — Creates structured error objects (`{ error: { code, message, service } }`)
and writes them to stderr. Consistent format across every command.

**`platform.js`** — Detects the current OS, architecture, and available package managers.
Returns `{ type, arch, packageManager }`. Replaces the old `src/utils/common/os.js`.

**`shell.js`** — Wraps `child_process.exec` and `child_process.execSync` with consistent
error handling. Provides `which()` and `commandExists()`. Every installer and utility
that needs to run a shell command uses this instead of calling `child_process` directly.

**`config.js`** — Reads and writes the `~/.devutils/` directory structure. Knows the
schema for `config.json`, `aliases.json`, etc. Handles the sync timestamp
for backup change detection.

**`prompt.js`** — Interactive prompts for user input. Automatically skips prompts and
returns defaults when `detect.js` reports a non-interactive caller (`ai`, `ci`, `pipe`).

**`github.js`** — Thin wrapper around `gh` CLI commands. Creates repos, creates gists,
lists user repos/gists, checks auth status. Used by `dev auth`, `dev config export/import`,
and backup/restore flows.

**`schema.js`** — Builds the schema registry from all `index.js` and `meta` exports
across commands, API services, and utilities. Powers `dev schema <path>`.

**`platforms/`** — One file per supported platform. Each exports helpers for that
platform's package manager, app detection, and system-specific operations. Installers
and utilities import these through `platform.js`, which selects the right one.

---

## `src/patterns/` — Pattern Files

Static pattern files organized by type. Lives inside `src/` to keep all package
content together, with non-package files (research, docs) outside.

```
patterns/
├── gitignore/                        # .gitignore patterns, one file per technology
│   ├── claude-code.txt
│   ├── docker.txt
│   ├── linux.txt
│   ├── macos.txt
│   ├── node.txt
│   ├── terraform.txt
│   ├── vscode.txt
│   └── windows.txt
└── ...                               # Future pattern types go here as new subfolders
```

The `gitignore/` subfolder is used by `dev ignore add`. Adding a new technology is
just adding a new `.txt` file. The folder-per-type structure allows this same pattern
to be reused for other technologies in the future without restructuring.

---

## `~/.devutils/` — User Data Directory

Not part of the package. Created on the user's machine during `dev config init`.
Included here to show the full picture.

```
~/.devutils/
│
├── config.json                       # User preferences, profile name, backup location
├── aliases.json                      # Registered alias mappings
├── ai.json                           # AI tool configurations (launch modes, defaults)
├── plugins.json                      # Installed API plugin registry
│
├── plugins/                          # Installed API plugin packages
│   ├── package.json                  # Managed by the CLI (npm install target)
│   └── node_modules/
│       ├── @fredlackey/devutils-api-gmail/
│       └── @fredlackey/devutils-api-cloudflare/
│
├── machines/                         # Machine profile data (detected state)
│   └── current.json
│
├── auth/                             # OAuth tokens and credentials
│   ├── clients/
│   │   ├── google.json               # Google OAuth client credentials
│   │   └── aws.json                  # AWS credential config
│   ├── gmail.json                    # Service tokens
│   ├── drive.json
│   └── aws.json
│
├── utils/                            # User-added custom utilities
│   └── my-custom-util/
│       └── index.js
│
├── bin/                              # Generated alias wrapper scripts (added to PATH)
│   ├── gs                            # Tiny script: exec dev util run git-status "$@"
│   ├── claude-danger                 # Tiny script: exec dev ai launch claude "$@"
│   └── gemini-yolo                   # Tiny script: exec dev ai launch gemini "$@"
│
├── sync.json                         # Last backup sync timestamp, remote location
│
└── cache/                            # Temporary data, staging, downloaded files
```

---

## How It All Connects

A visual map of how a command flows through the package:

```
User types: dev api gmail messages list --format table

  src/cli.js                               (parse args, detect output mode)
    ├── src/lib/detect.js                  (AI? CI? TTY? → resolve default format)
    ├── src/commands/api/index.js           (route to plugin loader)
    │     └── src/api/loader.js            (read plugins.json, find "gmail")
    │           └── ~/.devutils/plugins/node_modules/
    │                 └── @fredlackey/devutils-api-gmail/
    │                       └── commands/messages/list.js  (call run())
    └── src/lib/output.js                  (format result as table, write to stdout)
```

```
User types: dev util run git-status

  src/cli.js                               (parse args, detect output mode)
    ├── src/lib/detect.js                  (resolve default format)
    ├── src/commands/util/run.js            (find "git-status" utility)
    │     └── src/utils/git-status/index.js  (detect platform)
    │           ├── src/lib/platform.js       (what OS are we on?)
    │           └── src/utils/git-status/unix.sh  (execute the script)
    └── src/lib/output.js                  (format and write result)
```

```
User types: gs  (alias)

  ~/.devutils/bin/gs                       (wrapper script: exec dev util run git-status "$@")
    └── dev util run git-status            (calls the real command)
          └── (same flow as above)

On Windows, the wrapper is ~/.devutils/bin/gs.cmd containing: @dev util run git-status %*
```
