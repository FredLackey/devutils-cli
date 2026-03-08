# Config Backup and Sync

How DevUtils CLI handles backing up and restoring user configuration across machines.

---

## The Problem

A user configures DevUtils on one machine: identities, aliases, auth tokens,
tool preferences. They get a new machine or rebuild an existing one. They need that
config to follow them, either exactly as-is or adapted for the new environment.

---

## Storage Backends

Two options. The user chooses during initial setup.

### Private Git Repo

A private GitHub repository dedicated to DevUtils configuration.

Pros:

- Truly private. Only the authenticated user (or explicit collaborators) can access it.
- Full version history. Every backup is a commit. You can roll back.
- Supports multiple files and directories naturally.
- Can hold multiple profiles as separate paths within the same repo.
- Familiar workflow for developers (clone, pull, push).

Cons:

- Requires creating a repo (one-time setup, but more than a gist).
- Slightly heavier for users who only have one machine and minimal config.

### Secret Gist

A secret GitHub gist containing the configuration as one or more files.

Pros:

- Fast to create. No repo setup needed.
- Lightweight. Good for simple, single-profile configs.
- Not searchable or discoverable on GitHub.

Cons:

- Not truly private. Anyone with the URL can view it. No access control beyond
  URL obscurity.
- No directory structure. Everything is flat files.
- Limited version history (gist revisions exist but are less visible).
- Not ideal if the config contains sensitive data (auth tokens, paths, identity info).

---

## Profiles

Configuration is organized by **profile name**, not by machine name. A profile is a
named collection of settings that represents a complete DevUtils configuration. The
user picks the name. It could be anything: `default`, `work`, `personal`, `server`,
`freelance`.

Profiles are how configurations are identified in the backup storage. The actual
machine hostname, OS, or hardware details are not part of the profile identity. This
keeps things simple and portable. A profile called `work` could be used on a MacBook
today and a Linux desktop tomorrow.

### Multiple Profiles

A user can have multiple profiles in their backup storage. Each one is independent.
Different machines can use different profiles, or multiple machines can share the
same profile.

In a private repo:

```
devutils-config/
├── profiles/
│   ├── default/
│   │   ├── config.json
│   │   ├── aliases.json
│   │   ├── plugins.json
│   │   └── auth/
│   ├── work/
│   │   ├── config.json
│   │   ├── aliases.json
│   │   ├── plugins.json
│   │   └── auth/
│   └── personal/
│       ├── config.json
│       ├── aliases.json
│       └── plugins.json
```

In a secret gist, each profile is a separate file (e.g., `default.json`, `work.json`,
`personal.json`).

### Single Profile

If the user only needs one configuration across all their machines, they just create
one profile (e.g., `default`) and every machine uses it. No extra complexity.

### Profile Assignment

Each machine tracks which profile it's using. This is stored locally in the machine's
`~/.devutils/` directory — not in the backup itself. The backup only contains the
profiles. Which profile a particular machine points to is a local decision.

---

## Change Detection and Sync

Each machine tracks when it last synced with the remote backup. This is a timestamp
stored locally.

When the user runs DevUtils (any command), it can check the remote for changes. If
another machine has pushed an update to the active profile since this machine last
synced, DevUtils notifies the user:

- What changed (high-level summary)
- When it was pushed
- Asks whether to pull the updated config

This is not automatic. DevUtils never silently overwrites the local config. The user
always decides whether to pull.

### Conflict Handling

If the local config has also been modified since the last sync, both sides have
diverged. In this case, DevUtils reports both the local and remote changes and asks
the user what to do:

- Pull the remote config (discards local changes)
- Push the local config (overwrites remote)
- Skip for now (do nothing, ask again next time)

There is no merge. Configs are replaced wholesale per profile. Merging JSON configs
across machines gets complicated fast and is not worth the complexity for this use
case.

---

## Initial Setup Flow

The first time a user sets up backup, DevUtils walks them through these decisions.
This happens during `dev config init` or the first time they run a backup command.

### Step 1: GitHub Authentication

DevUtils checks for an active `gh` login. If not authenticated, it prompts the user
to log in first. This is required for both repo and gist access.

### Step 2: Storage Backend

Do you have an existing backup, or do you want to create one?

- **I have an existing private repo** — provide the repo name or URL, or DevUtils
  can list the user's repos and let them pick
- **I have an existing secret gist** — provide the gist ID or URL, or DevUtils
  can list the user's gists and let them pick
- **Create a new private repo** — DevUtils creates it via `gh`
- **Create a new secret gist** — DevUtils creates it via `gh`

The prompt explains the trade-offs: private repos are recommended when the config
contains identity information, auth credentials, or anything personal. Secret gists
are fine for minimal configs with no sensitive data.

### Step 3: Profile Name

What do you want to call this profile?

- Suggests `default` as a starting point
- User can type any name: `work`, `personal`, `server`, etc.
- If restoring from an existing backup that has profiles, lists the available
  profiles and lets the user pick one to use on this machine

### Step 4: Confirmation

Shows a summary of what was set up and where the backup lives. Done.

These choices are stored locally so they're only asked once. They can be changed
later through `dev config`.

---

## What Gets Backed Up

The backup includes everything under `~/.devutils/` that defines the user's setup:

- User configuration (name, email, preferences, defaults)
- Identities (git identities, SSH key references, folder links)
- Aliases (all registered shorthand mappings)
- AI tool configurations (per-tool launch modes and defaults)
- API plugin list (which plugins are installed, not the plugin code itself)
- Utility registrations (custom user-added utilities)
- Auth credentials (OAuth tokens, API keys — encrypted or excluded based on user choice)

Auth credentials are sensitive. The backup prompt should ask whether to include them.
If excluded, the user will need to re-authenticate on a new machine. If included, they
should be encrypted or the user should understand the risk.

---

## Restore Flow

On a new machine after installing DevUtils:

1. User runs `dev config init` or the restore command
2. Chooses "I have an existing backup"
3. DevUtils asks for the storage location (repo or gist), or searches for it
4. Lists available profiles
5. User picks a profile to use on this machine
6. Config is pulled and applied locally
7. `dev alias sync` runs to rebuild symlinks
8. Reports what was restored and what needs manual action (re-auth, tool installation, etc.)

---

## Ongoing Sync

After initial setup, the day-to-day cycle is:

- User changes config on Machine A (adds an alias, updates a setting, etc.)
- User runs backup on Machine A — config is pushed to the remote profile
- User opens DevUtils on Machine B — DevUtils sees the remote profile has been
  updated since Machine B last synced, notifies the user, asks if they want to pull
- User says yes — Machine B's config is updated

The timestamp comparison is lightweight. It checks the last commit date (repo) or
last revision date (gist) against the locally stored sync timestamp. No heavy diffing
or API calls needed for the check itself.
