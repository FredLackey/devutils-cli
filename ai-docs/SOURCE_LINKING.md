# Source Linking: Git Identity Management

This document explains how to configure Git to automatically use specific SSH keys and GPG keys based on folder structure and/or remote server. This eliminates manual identity switching and prevents accidental commits with wrong credentials.

## Overview

Git provides three native mechanisms for automatic identity management:

1. **Conditional Includes (`includeIf`)** - Load different config files based on directory or remote URL
2. **SSH Config Host Aliases** - Map different SSH keys to different Git servers
3. **URL Rewriting (`insteadOf`)** - Automatically convert URLs to route through specific SSH identities

These can be combined to create a robust multi-identity system without third-party tools.

---

## Method 1: Directory-Based Configuration (`gitdir:`)

The most common approach uses Git's `includeIf` directive with `gitdir:` to apply settings based on repository location.

### Global `.gitconfig` Setup

```gitconfig
# ~/.gitconfig

[user]
    name = Your Name
    useConfigOnly = true    # Prevents Git from guessing email

[commit]
    gpgsign = true          # Sign all commits

[init]
    defaultBranch = main

# Personal projects (default)
[includeIf "gitdir:~/personal/"]
    path = ~/.gitconfig-personal

# Work projects
[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work

# Client projects
[includeIf "gitdir:~/clients/acme/"]
    path = ~/.gitconfig-acme
```

**Critical:** The trailing slash (`/`) is required. Without it, Git only matches the exact folder, not subdirectories.

### Profile-Specific Config Files

**Personal profile** (`~/.gitconfig-personal`):
```gitconfig
[user]
    email = personal@example.com
    signingkey = ABCD1234           # GPG key ID

[core]
    sshCommand = ssh -i ~/.ssh/id_ed25519_personal
```

**Work profile** (`~/.gitconfig-work`):
```gitconfig
[user]
    email = you@company.com
    signingkey = EFGH5678           # Different GPG key

[core]
    sshCommand = ssh -i ~/.ssh/id_ed25519_work

# Optionally rewrite URLs to use SSH host alias
[url "git@github.com-work"]
    insteadOf = git@github.com
```

### Recommended Folder Structure

```
~/
├── personal/           # → ~/.gitconfig-personal
│   ├── blog/
│   └── side-projects/
├── work/               # → ~/.gitconfig-work
│   ├── internal/
│   └── products/
├── clients/
│   └── acme/           # → ~/.gitconfig-acme
└── opensource/         # → default config
```

---

## Method 2: Remote URL-Based Configuration (`hasconfig:remote`)

Git 2.36+ supports including config based on the repository's remote URL. This is useful when you can't control folder structure.

```gitconfig
# ~/.gitconfig

[user]
    name = Your Name
    email = default@example.com

# GitHub work organization
[includeIf "hasconfig:remote.*.url:https://github.com/work-org/**"]
    path = ~/.gitconfig-work

[includeIf "hasconfig:remote.*.url:git@github.com:work-org/**"]
    path = ~/.gitconfig-work

# GitLab personal
[includeIf "hasconfig:remote.*.url:https://gitlab.com/**"]
    path = ~/.gitconfig-gitlab
```

**Important:** Place `includeIf` sections after the default `[user]` section to ensure overrides take effect.

---

## SSH Key Configuration

### SSH Config with Host Aliases

The SSH config file allows mapping different keys to different "virtual hosts":

```ssh
# ~/.ssh/config

# Personal GitHub
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
    IdentitiesOnly yes

# Work GitHub (aliased hostname)
Host github.com-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
    IdentitiesOnly yes

# Client GitLab
Host gitlab.acme.com
    HostName gitlab.acme.com
    User git
    IdentityFile ~/.ssh/id_ed25519_acme
    IdentitiesOnly yes

# Defaults
Host *
    AddKeysToAgent yes
    IdentitiesOnly yes
    PreferredAuthentications publickey
```

**Key points:**
- `IdentitiesOnly yes` - Only use the specified key, don't try others
- `AddKeysToAgent yes` - Automatically add key to ssh-agent
- Place specific hosts before the wildcard `Host *`

### Using Host Aliases in Git

SSH host aliases are used internally by Git's URL rewriting. Configure URL rewriting in `.gitconfig` to automatically route connections through the correct host alias:

```gitconfig
[url "git@github.com-work:work-org/"]
    insteadOf = git@github.com:work-org/
```

This allows you to clone using standard URLs while Git automatically routes through the aliased host:

```bash
git clone git@github.com:work-org/repo.git
# Automatically becomes: git@github.com-work:work-org/repo.git
```

**Note:** The `dev identity link` command generates these URL rewrites automatically. Manual configuration is not required.

### Using `core.sshCommand` in Git Config

Alternatively, specify the SSH key directly in gitconfig:

```gitconfig
[core]
    sshCommand = ssh -i ~/.ssh/id_ed25519_work -o IdentitiesOnly=yes
```

This is useful with `includeIf` for per-directory SSH key selection.

---

## URL Rewriting with `insteadOf`

Git can automatically rewrite URLs before connecting, allowing you to:
- Convert HTTPS URLs to SSH (routing through a specific SSH host alias)
- Map specific repositories or organizations to specific identities
- Use familiar HTTPS URLs while actually connecting via SSH with the correct key

### Basic Syntax

```gitconfig
[url "<replacement>"]
    insteadOf = <original>
```

Git replaces `<original>` with `<replacement>` at the start of any matching URL.

### Converting HTTPS to SSH with Host Alias

This is the most powerful pattern—clone with HTTPS URLs but automatically route through a specific SSH identity:

```gitconfig
# Route all FredLackey repos through the "fred" SSH identity
[url "git@github.com-fred:FredLackey/"]
    insteadOf = https://github.com/FredLackey/
    insteadOf = git@github.com:FredLackey/
```

Now both of these commands use the SSH key defined for `github.com-fred`:
```bash
git clone https://github.com/FredLackey/dotfiles
git clone git@github.com:FredLackey/dotfiles
# Both internally become: git@github.com-fred:FredLackey/dotfiles
```

### Scope Patterns

| Pattern | Matches |
|---------|---------|
| `https://github.com/` | All GitHub repos via HTTPS |
| `https://github.com/FredLackey/` | Only FredLackey's repos via HTTPS |
| `git@github.com:` | All GitHub repos via SSH |
| `git@github.com:my-company/` | Only my-company org repos via SSH |
| `https://gitlab.acme.com/` | All repos on a specific GitLab instance |

### Multiple `insteadOf` Values

A single `[url]` block can have multiple `insteadOf` entries to catch different URL formats:

```gitconfig
[url "git@github.com-work:my-company/"]
    insteadOf = https://github.com/my-company/
    insteadOf = git@github.com:my-company/
    insteadOf = ssh://git@github.com/my-company/
```

### Combining with `includeIf`

Place URL rewrites in profile-specific gitconfigs to apply them only in certain directories:

**`~/.gitconfig-work`:**
```gitconfig
[user]
    email = you@company.com
    signingkey = ~/.ssh/id_ed25519_work.pub

[core]
    sshCommand = ssh -i ~/.ssh/id_ed25519_work -o IdentitiesOnly=yes

# Rewrite company repos to use work SSH identity
[url "git@github.com-work:my-company/"]
    insteadOf = https://github.com/my-company/
    insteadOf = git@github.com:my-company/

[commit]
    gpgsign = true
```

When working in `~/work/`, any clone or fetch of `my-company` repos automatically uses the work SSH key.

### Verifying URL Rewriting

```bash
# Check what a URL will be rewritten to
git config --get-urlmatch url.insteadOf https://github.com/FredLackey/dotfiles

# Clone with verbose output to see the rewrite
GIT_TRACE=1 git clone https://github.com/FredLackey/dotfiles

# List all URL rewrites
git config --global --get-regexp 'url\..*\.insteadof'
```

### Push-Only Rewrites

Use `pushInsteadOf` to rewrite URLs only for push operations (useful for read-only mirrors):

```gitconfig
[url "git@github.com-work:"]
    pushInsteadOf = https://github.com/
```

This allows anonymous HTTPS pulls but authenticated SSH pushes.

---

## GPG Signing Configuration

### Option A: Traditional GPG Keys

**Generate a GPG key:**
```bash
gpg --full-generate-key
# Choose: RSA (sign only), 4096 bits, no expiration
```

**List keys to get the ID:**
```bash
gpg --list-secret-keys --keyid-format SHORT
# Output shows key ID like "ABCD1234"
```

**Configure Git:**
```gitconfig
[user]
    signingkey = ABCD1234

[commit]
    gpgsign = true

[gpg]
    program = gpg
```

**Export public key for GitHub/GitLab:**
```bash
gpg --armor --export ABCD1234
```

### Option B: SSH Key Signing (Git 2.34+)

Modern Git can use SSH keys for signing (no GPG required):

```gitconfig
[user]
    signingkey = ~/.ssh/id_ed25519.pub

[commit]
    gpgsign = true

[gpg]
    format = ssh

[gpg "ssh"]
    allowedSignersFile = ~/.ssh/allowed_signers
```

**Create allowed signers file** (`~/.ssh/allowed_signers`):
```
your@email.com ssh-ed25519 AAAAC3NzaC1... your-key-comment
```

---

## Complete Example Setup

### File Structure

```
~/.gitconfig                    # Main config with includeIf rules
~/.gitconfig-personal           # Personal identity
~/.gitconfig-work               # Work identity
~/.ssh/config                   # SSH key mappings
~/.ssh/id_ed25519_personal      # Personal SSH key
~/.ssh/id_ed25519_work          # Work SSH key
```

### Main Config (`~/.gitconfig`)

```gitconfig
[user]
    name = Your Name
    useConfigOnly = true

[commit]
    gpgsign = true

[gpg]
    format = ssh

[init]
    defaultBranch = main

[pull]
    rebase = true

# Personal (default for ~/personal/)
[includeIf "gitdir:~/personal/"]
    path = ~/.gitconfig-personal

# Work (for ~/work/)
[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work

# Work org on GitHub (URL-based fallback)
[includeIf "hasconfig:remote.*.url:git@github.com:my-company/**"]
    path = ~/.gitconfig-work
```

### Personal Config (`~/.gitconfig-personal`)

```gitconfig
[user]
    email = you@personal.com
    signingkey = ~/.ssh/id_ed25519_personal.pub

[core]
    sshCommand = ssh -i ~/.ssh/id_ed25519_personal -o IdentitiesOnly=yes
```

### Work Config (`~/.gitconfig-work`)

```gitconfig
[user]
    email = you@company.com
    signingkey = ~/.ssh/id_ed25519_work.pub

[core]
    sshCommand = ssh -i ~/.ssh/id_ed25519_work -o IdentitiesOnly=yes
```

---

## Verification

### Check Active Configuration

```bash
cd ~/work/some-repo
git config user.email        # Should show work email
git config user.signingkey   # Should show work key

cd ~/personal/blog
git config user.email        # Should show personal email
```

### View All Applied Config

```bash
git config --list --show-origin
```

### Test SSH Key

```bash
ssh -T git@github.com           # Tests default key
ssh -T git@github.com-work      # Tests aliased key
```

### Test Commit Signing

```bash
git commit --allow-empty -m "Test signed commit"
git log --show-signature -1
```

---

## Troubleshooting

### SSH Connection Multiplexing

When switching between accounts on the same server, existing SSH connections may use the old key. Terminate the connection:

```bash
ssh -O exit git@github.com
```

### Config Not Taking Effect

1. Verify `includeIf` path ends with `/`
2. Check file paths are correct (use absolute paths)
3. Ensure `includeIf` comes after default `[user]` section
4. Verify Git version: `git --version` (need 2.13+ for `gitdir:`, 2.36+ for `hasconfig:`)

### GPG Agent Issues

```bash
# Restart GPG agent
gpgconf --kill gpg-agent
gpg-agent --daemon
```

### Verify Key Loading

```bash
ssh-add -l                    # List loaded keys
ssh-add ~/.ssh/id_ed25519_work  # Manually add if needed
```

---

## Reference: How gitego Works

[gitego](https://github.com/bgreenwell/gitego) is a third-party tool that automates this setup. Under the hood, it:

1. Creates profile-specific config files
2. Adds `includeIf` rules to global `.gitconfig`
3. Acts as a Git credential helper for HTTPS PATs
4. Stores secrets in the OS keychain

The native Git mechanisms described above achieve the same result without external dependencies.

---

## DevUtils CLI Implementation: `dev identity link`

The `dev identity link` command automates the configuration described above, linking an existing identity to a source folder path and/or remote git server.

### Command Syntax

```bash
dev identity link [identity] [path] [remote]
```

Arguments can be provided in **any order**—the command auto-detects each type:

| Argument | Detection Pattern |
|----------|-------------------|
| **Identity** | Matches a known identity name from `~/.devutils` |
| **Remote URL** | Contains `http://`, `https://`, `ssh://`, or matches `git@host:` pattern |
| **Folder path** | Starts with `/`, `~/`, `./`, `../`, or Windows drive letter (e.g., `C:\`) |

**Supported remote URL formats:**
- `https://github.com/FredLackey` - HTTPS format
- `https://gitlab.company.com:8443/my-org` - HTTPS with custom port
- `git@github.com:FredLackey` - SSH format (note the colon before the path)
- `ssh://git@gitlab.company.com:2222/my-org` - SSH with custom port (ssh:// scheme required for ports)

**Note:** Regardless of which format the user provides, the command generates `insteadOf` rules for **both** HTTPS and SSH formats. When a custom port is specified, it is preserved in the generated rules. This ensures all clone/fetch operations are routed correctly.

All arguments are optional. If not provided, the command will interactively prompt for each value.

### Prerequisites

An identity must already exist in `~/.devutils`. Identities are created via `dev identity add` and contain:
- `name` - Display name for commits
- `email` - Email address for commits
- `sshKey` - Path to SSH private key (e.g., `~/.ssh/id_ed25519_work`)
- `gpgKey` - GPG key ID or SSH public key path for signing (optional)

### Validation Rules

Before creating a link, the command validates:

1. **Identity must exist** in `~/.devutils`
2. **Folder path must exist or be created** - If the specified path does not exist:
   - Prompt the user: `Folder ~/work/client-a does not exist. Create it? (Y/n)`
   - If confirmed, create the entire folder structure (equivalent to `mkdir -p`)
   - If declined, abort the link operation
3. **No overlapping folder paths** - The specified path cannot be:
   - A parent folder of an already-linked path (e.g., can't link `~/work` if `~/work/project` is linked)
   - A child folder of an already-linked path (e.g., can't link `~/work/project` if `~/work` is linked)
   - The same path linked to a different identity

This prevents conflicting `gitdir:` rules in `.gitconfig` where nested paths would create ambiguous identity resolution.

**Multiple paths to one identity is allowed:** You can link many non-overlapping paths to the same identity. For example:
```bash
dev identity link work ~/Source/ClientA
dev identity link work ~/Source/ClientB
dev identity link work ~/Consulting/ProjectX
```
All three paths will use the "work" identity. The restriction only applies to overlapping (nested) paths.

**Example error:**
```bash
$ dev identity link work ~/projects
✗ Error: Cannot link ~/projects - child path ~/projects/client-a is already linked to identity "client"
```

### What the Command Does

1. **Validates the identity and path** (see validation rules above)
2. **Stores the link in `~/.devutils`** under the identity's `links` array (source of truth)
3. **Creates/updates `~/.ssh/config`** with a host entry for the identity's SSH key
4. **Creates a profile-specific gitconfig** (e.g., `~/.gitconfig-{identity}`) containing:
   - `[user]` email and signingkey
   - `[core]` sshCommand pointing to the identity's SSH key
   - `[url]` rewrites to route remote URLs through the SSH host alias (if remote provided)
   - `[commit]` gpgsign = true (if signing key configured)
5. **Updates `~/.gitconfig`** with appropriate `includeIf` rules:
   - `gitdir:` rule if folder path is provided
   - `hasconfig:remote.*.url:` rule if remote URL is provided

### Data Structure in `~/.devutils`

Links are stored within each identity, making `~/.devutils` the single source of truth:

```json
{
  "identities": {
    "work": {
      "name": "Your Name",
      "email": "you@company.com",
      "sshKey": "~/.ssh/id_ed25519_work",
      "gpgKey": "~/.ssh/id_ed25519_work.pub",
      "links": [
        {
          "path": "~/work",
          "remote": "https://github.com/my-company"
        },
        {
          "remote": "https://gitlab.internal.company.com"
        }
      ]
    },
    "personal": {
      "name": "Your Name",
      "email": "personal@example.com",
      "sshKey": "~/.ssh/id_ed25519_personal",
      "links": [
        {
          "path": "~/personal"
        }
      ]
    }
  }
}
```

This structure allows:
- Multiple links per identity (different paths and/or remotes)
- Links with only a path, only a remote, or both
- Easy listing, updating, and removal of links
- Regeneration of `.ssh/config` and `.gitconfig` files from this source

### Example Usage

**Interactive mode:**
```bash
$ dev identity link
? Select identity: work
? Source folder path (optional): ~/work
? Remote server (optional): https://github.com/my-company
✓ Updated ~/.ssh/config
✓ Created ~/.gitconfig-work
✓ Added includeIf rules to ~/.gitconfig
```

**With arguments (any order):**
```bash
# All of these are equivalent:
dev identity link work ~/work https://github.com/my-company
dev identity link ~/work work https://github.com/my-company
dev identity link https://github.com/my-company work ~/work

# Link by folder path only
dev identity link work ~/work

# Link by remote server only (HTTPS format)
dev identity link work https://github.com/my-company

# Link by remote server only (SSH format)
dev identity link work git@github.com:my-company

# Link by both (belt and suspenders)
dev identity link work ~/work https://github.com/my-company
dev identity link personal ~/personal git@github.com:FredLackey
```

### Generated Configuration

**SSH Config entry** (`~/.ssh/config`):
```ssh
# Added by dev identity link (work)
Host github.com-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
    IdentitiesOnly yes
```

**SSH Config with custom port** (e.g., for `ssh://git@gitlab.company.com:2222/my-org`):
```ssh
# Added by dev identity link (work)
Host gitlab.company.com-work
    HostName gitlab.company.com
    Port 2222
    User git
    IdentityFile ~/.ssh/id_ed25519_work
    IdentitiesOnly yes
```

**Profile gitconfig** (`~/.gitconfig-work`):
```gitconfig
# Generated by dev identity link
[user]
    email = you@company.com
    signingkey = ~/.ssh/id_ed25519_work.pub

[core]
    sshCommand = ssh -i ~/.ssh/id_ed25519_work -o IdentitiesOnly=yes

# URL rewriting (routes both HTTPS and SSH URLs through the host alias)
[url "git@github.com-work:my-company/"]
    insteadOf = https://github.com/my-company/
    insteadOf = git@github.com:my-company/

[commit]
    gpgsign = true

[gpg]
    format = ssh
```

This URL rewriting ensures that both URL formats are handled:
- `https://github.com/my-company/repo.git` → `git@github.com-work:my-company/repo.git`
- `git@github.com:my-company/repo.git` → `git@github.com-work:my-company/repo.git`

Git automatically routes the connection through `github.com-work`, which uses the correct SSH key from `~/.ssh/config`.

**Main gitconfig additions** (`~/.gitconfig`):
```gitconfig
# work identity (added by dev identity link)
[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work

[includeIf "hasconfig:remote.*.url:git@github.com:my-company/**"]
    path = ~/.gitconfig-work
```

### Idempotency

**All devutils-cli commands must be idempotent.** Running `dev identity link` multiple times with the same parameters produces the same result as running it once:

- **`~/.devutils`** - Link is added only if not already present; no duplicates
- **`~/.ssh/config`** - Host entry is updated in place if exists; created if not
- **`~/.gitconfig-{identity}`** - File is updated/regenerated; not duplicated
- **`~/.gitconfig`** - `includeIf` rules are updated in place; no duplicate entries

**Behavior guarantees:**
- Safe to run repeatedly (e.g., in setup scripts, CI/CD, or dotfile bootstrapping)
- No duplicate entries created in any config file
- Existing entries are updated to match current identity settings
- Running with identical parameters shows success (not an error)

### Related Commands

| Command | Description |
|---------|-------------|
| `dev identity add` | Create a new identity with SSH/GPG keys |
| `dev identity list` | List all configured identities and their links |
| `dev identity link` | Link an identity to a folder path and/or remote |
| `dev identity unlink` | Remove a folder/remote link from an identity |
| `dev identity sync` | Regenerate `.ssh/config` and `.gitconfig` from `~/.devutils` |
| `dev identity status` | Show which identity is active for current directory |

---

## Sources

- [Git Documentation - git-config](https://git-scm.com/docs/git-config)
- [Managing Multiple Git Identities with Conditional Includes](https://kothar.net/blog/2025/directory-targeted-git-config)
- [Using git with multiple profiles and GPG+SSH keys](https://markentier.tech/posts/2021/02/github-with-multiple-profiles-gpg-ssh-keys/)
- [Setup GPG + SSH keys for multiple git profiles](https://fourco.nl/blogs/setup-gpg-ssh-keys-for-multiple-git-profiles/)
- [Configuring Git Commit Signing for Multiple Environments](https://asciijungle.com/posts/2025-04-24-git-commit-signing-for-multiple-environments.html)
- [gitego - Git Identity Manager](https://github.com/bgreenwell/gitego)
- [GitHub Docs - Telling Git about your signing key](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key)
