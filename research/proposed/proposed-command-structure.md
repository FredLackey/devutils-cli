# Proposed Command Structure

Command hierarchy for the DevUtils CLI rebuild, modeled after the `gws` pattern documented in `cli-structure-reference.md`. Prioritized by value to the new config-driven architecture.

**Pattern**: `dev <service> [resource] <method> [arguments] [flags]`

**Single global command**: `dev` is the only entry in the user's PATH.

---

## Command Hierarchy

```
dev
│
├── config                        # User configuration and onboarding
│   ├── init                      #   First-run onboarding wizard
│   ├── show                      #   Display current configuration
│   ├── get                       #   Read a specific config value
│   ├── set                       #   Write a specific config value
│   ├── reset                     #   Reset config to defaults
│   ├── export                    #   Export config to file (portable)
│   └── import                    #   Import config from file
│
├── machine                       # Machine profiles and detection
│   ├── detect                    #   Detect current machine info (OS, arch, capabilities)
│   ├── show                      #   Display current machine profile
│   ├── set                       #   Set a machine profile value
│   └── list                      #   List known machine profiles
│
├── identity                      # Git identities, SSH keys, GPG signing
│   ├── add                       #   Create a new identity profile
│   ├── remove                    #   Remove an identity profile
│   ├── list                      #   List all identities
│   ├── show                      #   Show details of one identity
│   ├── link                      #   Bind identity to a folder or remote
│   ├── unlink                    #   Remove a folder/remote binding
│   └── sync                      #   Regenerate SSH configs from identities
│
├── tools                         # Tool installation and management
│   ├── install                   #   Install a tool (cross-platform)
│   ├── check                     #   Check if a tool is installed
│   ├── list                      #   List available tools
│   └── search                    #   Search tools by name or keyword
│
├── ignore                        # .gitignore pattern management
│   ├── add                       #   Append patterns for a technology
│   ├── remove                    #   Remove a managed pattern section
│   ├── list                      #   List available technologies
│   └── show                      #   Show managed sections in current .gitignore
│
├── util                          # Complex utility functions (platform-aware)
│   ├── run                       #   Execute a utility by name
│   ├── list                      #   List available utilities
│   ├── show                      #   Show details and usage for a utility
│   ├── add                       #   Register a custom utility
│   └── remove                    #   Unregister a utility
│
├── alias                         # Shorthand bin entries (user-controlled)
│   ├── add                       #   Create a global shorthand for any dev command or utility
│   ├── remove                    #   Remove a shorthand
│   ├── list                      #   List all registered aliases
│   └── sync                      #   Rebuild all alias symlinks from config
│
├── auth                          # OAuth and credential management
│   ├── login                     #   Authenticate with a service (opens browser for OAuth)
│   ├── logout                    #   Revoke credentials for a service
│   ├── list                      #   List connected services and token status
│   ├── status                    #   Show detailed auth state for one service
│   └── refresh                   #   Force token refresh for a service
│
├── api                           # API plugin system (see proposed-api-plugin-architecture.md)
│   ├── list                      #   List installed and available API plugins
│   ├── enable                    #   Install an API plugin (from npm or git)
│   ├── disable                   #   Remove an installed API plugin
│   ├── update                    #   Update an installed plugin
│   └── <plugin>                  #   Plugin commands (loaded at runtime from ~/.devutils/plugins/)
│       └── ...                   #   Each plugin registers its own resources and methods
│
├── ai                            # AI coding assistant launcher and session management
│   ├── launch                    #   Start an AI tool with configured mode and flags
│   ├── resume                    #   Resume a previous session by ID
│   ├── list                      #   List available/configured AI tools
│   ├── sessions                  #   List recent sessions for a tool
│   ├── show                      #   Show current config for a tool
│   └── set                       #   Set default launch config for a tool (mode, flags, etc.)
│
├── search                        # Markdown search via QMD (requires separate install)
│   ├── query                     #   Hybrid search (BM25 + vector + LLM re-ranking)
│   ├── keyword                   #   Fast BM25 keyword search
│   ├── semantic                  #   Vector similarity search
│   ├── get                       #   Retrieve a document by path or ID
│   ├── collections               #   Manage searchable collections
│   │   ├── add                   #     Register a directory as a collection
│   │   ├── remove                #     Remove a collection
│   │   └── list                  #     List all collections
│   ├── index                     #   Rebuild or update the search index
│   └── status                    #   Show index health and collection info
│
├── status                        # Overall health check
├── update                        # Self-update to latest version
├── version                       # Show current version
├── schema                        # Introspect available commands and their shapes
└── help                          # Usage information
```

---

## How `util` and `alias` Work Together

These two services replace the old approach of dumping 83 scripts into the global PATH.
They split the problem into two halves: the functions themselves, and the shorthand to
call them.

### Utilities: The Function Library

`dev util` is where complex, multi-step functions live. These are things like the 212-line
`git-status` that scans multiple repos and outputs a color-coded summary, or `clone` that
clones a repo and auto-detects whether to run yarn, pnpm, or npm install.

Utilities ship with the package or can be user-added. They can have platform-specific
implementations (bash on macOS/Linux, PowerShell on Windows). They are always callable
through `dev util run <name>`, but they are never automatically added to the user's PATH.

Think of `dev util` as the library. It holds everything. You browse it with `dev util list`,
inspect something with `dev util show git-status`, and run it with `dev util run git-status`.

### Aliases: The Shorthand Layer

`dev alias` creates thin global bin entries that point to any `dev` command. These are what
actually show up in the user's PATH, and the user has full control over which ones exist.

An alias is just a mapping: a short name and the command it runs. When you create one,
DevUtils generates a tiny wrapper script in `~/.devutils/bin/`. On macOS and Linux, it's
a shell script (`#!/bin/sh` + `exec dev ... "$@"`). On Windows, it's a `.cmd` batch file
(`@dev ... %*`). When you remove one, the wrapper script is deleted.

The user adds `~/.devutils/bin` to their PATH once during `dev config init`. The
onboarding wizard handles this per-platform (appending to `.zshrc`, `.bashrc`,
PowerShell `$PROFILE`, or the Windows system PATH). After that, creating and removing
aliases is fully dynamic — no shell config edits needed.

Aliases are stored in `aliases.json`, which travels with the user's config backup.
Running `dev alias sync` on a new machine regenerates all wrapper scripts from the
stored config.

### The Flow

Here's how it comes together in practice:

**Step 1: A utility exists in the library.**
A function like `git-status` ships with DevUtils or the user adds their own via
`dev util add`.

**Step 2: The user runs it through `dev util`.**
`dev util run git-status` works immediately. No setup needed. But typing that every
time is verbose.

**Step 3: The user creates a shorthand alias.**
`dev alias add gs "dev util run git-status"` creates a global `gs` command. Now the
user just types `gs`.

**This also works for non-utility commands.** Aliases can point to any `dev` command:

- `dev alias add claude-danger "dev ai launch claude"` — launches Claude in danger mode
- `dev alias add gemini-yolo "dev ai launch gemini"` — launches Gemini in YOLO mode
- `dev alias add ignore-node "dev ignore add node"` — shorthand for a common ignore operation

**The user controls their PATH.** Only `dev` is installed globally by default. Everything
else is opt-in. No collisions, no surprises, no namespace pollution.

### What Ships vs. What's Custom

DevUtils ships with a set of built-in utilities (carried forward from the `_rebuild/`
scripts that proved useful). Users can also register their own functions as utilities.
Both kinds are callable the same way and can have aliases pointed at them.

The config stores which aliases exist on each machine, so `dev config export` and
`dev config import` carry the alias definitions to a new machine. Running `dev alias sync`
after import regenerates all the wrapper scripts.

---

## Global Flags

Available on every command.

```
--format <json|table|yaml|csv>    # Output format (default: json)
--dry-run                         # Show what would happen without doing it
--verbose                         # Increase output detail
--quiet                           # Suppress non-essential output
--json <data>                     # Pass structured input as JSON string
```

---

## Output Format Detection

Every command must know whether to return human-friendly output or structured JSON.
The `--format` flag always wins when provided, but when it's not, DevUtils needs to
figure out the right default automatically.

This is handled by a single reusable function that every command calls before producing
output. The function checks three layers in order and returns the resolved format.

### Detection Order

**1. Check for known AI tool environments.**

AI coding assistants set environment variables in subprocesses they spawn. We cannot
control what each tool will use, so this check must be a scan against a maintained
list of known variables. When any of them are detected, the caller is an AI agent
and the default format switches to compact JSON.

Known variables as of now:

- `CLAUDECODE=1` (Claude Code)
- `GEMINI_CLI=1` (Gemini CLI)

This list will grow as new tools emerge. It should be stored in a single place
(an array in the detection function) so adding a new variable is a one-line change.
The function does not need to know which tool is calling — only that the environment
indicates a non-human caller.

**2. Check for CI/CD environments.**

If no AI tool variable is found, check for common CI signals. CI environments are
also non-interactive and should receive structured JSON.

Known variables:

- `CI=true` (GitHub Actions, Travis, CircleCI, and most CI providers)
- `BUILD_NUMBER` (Jenkins)
- `TF_BUILD=True` (Azure Pipelines)

Same approach: a maintained list, checked in order. If any match, default to
compact JSON.

**3. Fall back to TTY detection.**

If no environment variables matched, check whether stdout is connected to a
terminal using `process.stdout.isTTY`.

- If `true`: the caller is a human at a terminal. Default to pretty-printed,
  human-readable output (table or formatted text, depending on the command).
- If `false` or `undefined`: stdout is piped or redirected. Default to compact JSON.

### The Override

The `--format` flag overrides all detection. If the user passes `--format json`,
`--format table`, `--format yaml`, or `--format csv`, that's what they get regardless
of environment.

### Why This Order Matters

AI tool detection comes first because an AI agent might be running inside a terminal
emulator where `isTTY` would return `true`. The environment variable is the more
specific signal.

CI detection comes second for the same reason — CI runners sometimes allocate a
pseudo-TTY.

TTY detection is the broadest and least specific signal, so it's the fallback.

### Implementation Note

This is a single function in the shared utilities. Every command imports it and calls
it once at the start of output formatting. The function signature is something like:

```
detectOutputMode() → { format, caller }
```

Where `format` is the resolved default (`json`, `table`, etc.) and `caller` is the
detected context (`ai`, `ci`, `tty`, `pipe`). Commands can use `caller` for
additional behavior decisions (e.g., skipping interactive prompts when the caller
is `ai` or `ci`).

The list of known AI and CI environment variables should be easy to update without
touching the detection logic itself.

---

## Service Priority

| Tier | Service | Rationale |
|---|---|---|
| 1 | config | Foundation of the config-driven approach. Nothing works without it. |
| 1 | machine | Core to machine-aware profiles. Required for platform-specific behavior. |
| 1 | status | Essential feedback loop. User needs to see what's configured and what's wrong. |
| 2 | tools | Most-used feature from v0.0.18. Cross-platform tool installation is the killer feature. |
| 2 | identity | High value for multi-org developers. Git identity + SSH key management is a real pain point. |
| 2 | ignore | Simple, proven, and useful. Low effort to carry forward. |
| 2 | ai | Daily-driver for launching and resuming AI coding assistants with per-tool configs. |
| 2 | util | Houses complex multi-step functions (git-status, clone, git-push, etc.) that need platform-aware implementations. |
| 2 | alias | Replaces the 83 hardcoded bin entries with user-defined shorthand. Opt-in, per-machine. |
| 3 | auth | Required before any API plugin can function. Centralized OAuth and credential management. |
| 3 | api | Plugin system for API wrappers. Core commands (list, enable, disable, update) ship with the CLI. Individual services are installed as plugins. See `proposed-api-plugin-architecture.md`. |
| 3 | search | Markdown search via QMD. Requires QMD installed separately. Wraps QMD commands with the standard `dev` interface and guides users through installation if missing. |
| 4 | schema | Self-documenting commands. Important for AI agent consumption but not day-one critical. |
| 4 | update, version, help | Standard CLI infrastructure. Low effort, build whenever. |

---

## Excluded from Command Structure

### 83 Global Script Registrations

Every script in `src/scripts/` was registered as a standalone global command via `package.json`
bin mappings. Installing the package created 84 symlinks in the user's PATH.

Excluded because of namespace pollution, collision risk (18 high-risk names), all-or-nothing
registration, no platform filtering, and no user control.
See `../legacy/previous-bin-mappings.md` for the full analysis.

Replaced by `dev util` (for the functions themselves) and `dev alias` (for the shorthand
bin entries). Users explicitly choose which commands get global symlinks via `dev alias add`.

---

### setup Command

Installed a hardcoded list of essential tools (git, ssh, gpg, curl, Homebrew).

Excluded because it was too opinionated. The specific tools a machine needs should come from
the user's config, not a built-in list.

Absorbed into `dev config init` (onboarding). The onboarding flow can recommend
essentials, but the user decides.

---

### configure Command

Interactive wizard that wrote name, email, and URL to a single `~/.devutils` JSON file.

Excluded because it's been replaced by the broader `dev config` service, which handles the
same data plus machine profiles and export/import.

`dev config init` covers the onboarding wizard.
`dev config set` and `dev config show` cover the rest.

---

### Single-Letter Commands

`c`, `d`, `e`, `h`, `m`, `o`, `p`, `q`, `s`, `u`, `y`

Shell shortcuts for clear, desktop, vim, history, man, open, projects, quit, search,
update, and yarn.

Excluded because they carry the highest collision risk of anything in the package.
Single-letter names conflict with system commands, other tools, and user aliases.
These are personal workflow preferences, not general-purpose tools.

Available as utilities a user can opt into via `dev alias add`,
but never auto-registered.

---

### Homebrew Wrappers

`brewd`, `brewi`, `brewr`, `brews`, `brewu`

Thin wrappers around `brew doctor`, `brew install`, `brew remove`, `brew search`,
and `brew update`.

Excluded because they add no meaningful value over typing `brew` directly.
Tightly coupled to one platform. Not worth carrying into a config-driven tool.

---

### Server Administration Scripts

`nginx-init`, `certbot-init`, `certbot-crontab-init`

Scripts to configure nginx and install/renew SSL certificates via certbot.

Excluded because these are niche server-admin tasks, not relevant to the primary audience
of developer workstation setup. Infrastructure-as-code tools handle this better.

---

### Media Download Scripts

`get-tunes`, `get-video`, `get-channel`, `get-course`

Wrappers around yt-dlp for downloading audio and video from various sources.

Excluded because they are personal utility scripts, not developer environment tooling.
Available as opt-in scripts if a user wants them, but not part of the command hierarchy.

---

### AI Launch Scripts

`claude-danger`

Launched Claude Code with `--dangerously-skip-permissions` and supported passing a session
ID to resume from.

Excluded as a standalone script because it's now part of the `dev ai` service.
`dev ai launch claude` handles mode configuration, and `dev ai resume claude` handles
session recovery. Per-tool defaults (like always launching in danger mode) are stored
in config via `dev ai set`.

Users who still want a global `claude-danger` command can create one with
`dev alias add claude-danger "dev ai launch claude"`. Same for `gemini-yolo`
or any other shorthand.

---

### Backup Scripts

`backup-source`, `backup-all`

Scripts to create archives of source directories.

Excluded because backup strategy is highly personal and machine-specific.
Better handled through config than hardcoded scripts.

---

## Future Improvements

### Shell Tab Completion

Since `dev config init` already modifies the shell profile to add `~/.devutils/bin`
to PATH, it could also set up tab completion at the same time. Each shell has its
own mechanism: a completion script sourced in `.bashrc`, a completion function for
zsh's `fpath`, or `Register-ArgumentCompleter` in the PowerShell `$PROFILE`.

The completion script would call back into the CLI itself (e.g.,
`dev --completions "dev config "`) to get valid options at each position. This keeps
completions dynamic — new aliases, installed API plugins, and registered utilities
show up automatically without regenerating anything.

What it could complete: service names, methods, API plugin names, flag names, and
utility names. Alias commands in `~/.devutils/bin/` get PATH completion for free
from the shell itself.

Not needed for day one, but a natural addition once the alias and plugin systems
are working.
