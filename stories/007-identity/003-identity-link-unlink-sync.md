# Story 003: Identity Link, Unlink, and Sync

## Goal
Implement `dev identity link`, `dev identity unlink`, and `dev identity sync`. These are the commands that tie everything together. `link` binds an identity to a folder so git operations in that folder use the right email and SSH key. `unlink` removes that binding. `sync` regenerates `~/.ssh/config` entries and per-folder `.gitconfig` includes from all identity definitions. This is the core value of the identity service: one command to keep git configuration consistent across dozens of repos.

## Prerequisites
- 007-identity/002 (identity list/show -- link/unlink/sync depend on being able to read identity data, and the identity data model needs to be established)

## Background
Here's the problem `sync` solves. Say you have three git identities: personal (GitHub personal account), work (GitHub work account), and client (GitHub client account). You have 50 repos scattered across your machine. Each repo needs to use the right identity -- the right email for commits, the right SSH key for push/pull, and optionally the right GPG key for signing.

Normally you'd do this by hand:
- Edit `~/.ssh/config` to map hostnames to SSH keys
- Run `git config user.email` in each repo
- Add `includeIf` directives to `~/.gitconfig` for path-based identity switching

That's fragile. One wrong edit to `~/.ssh/config` and you can't push to any repo. `sync` automates all of it.

The data flow:
1. `dev identity add` creates the profile (story 001).
2. `dev identity link` binds folders to the profile (this story).
3. `dev identity sync` reads all profiles and folder bindings and writes out the SSH config and git config (this story).

### How SSH config identity switching works

The `~/.ssh/config` file maps hostnames to SSH keys. The trick is to use host aliases:

```
# DevUtils managed - personal
Host github.com-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_personal
  IdentitiesOnly yes

# DevUtils managed - work
Host github.com-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_work
  IdentitiesOnly yes
```

Then in a repo's git config, the remote URL uses the alias instead of `github.com`:

```
[remote "origin"]
  url = git@github.com-personal:FredLackey/devutils-cli.git
```

### How git config identity switching works

Git supports path-based conditional includes in `~/.gitconfig`:

```
[includeIf "gitdir:~/Source/Personal/"]
  path = ~/.gitconfig-personal

[includeIf "gitdir:~/Source/Corporate/"]
  path = ~/.gitconfig-work
```

Each included file sets the identity:

```
# ~/.gitconfig-personal
[user]
  email = fred@example.com
  signingkey = ABC123
```

This way, any repo under `~/Source/Personal/` automatically uses the personal email.

## Technique

### Step 1: Implement `src/commands/identity/link.js`

```javascript
const meta = {
  description: 'Link an identity to a folder path',
  arguments: [
    { name: 'name', description: 'Identity name', required: true },
    { name: 'folder', description: 'Folder path to link (absolute or relative)', required: true }
  ],
  flags: [
    { name: '--remote', description: 'Git remote hostname (default: github.com)' }
  ]
};
```

The `run` function should:

1. **Get the identity name and folder path from args.** Both required.

2. **Resolve the folder path to an absolute path.** Use `path.resolve()` to handle relative paths. Verify the folder exists with `fs.existsSync()`. If it doesn't, print an error.

3. **Look up the identity** in config. Error if not found.

4. **Check for duplicate links.** If this folder is already linked to this identity, print a message and return (idempotent). If the folder is linked to a different identity, print a warning: "Folder '/path/to/folder' is currently linked to identity 'work'. Re-linking to 'personal'." Then update the link. A folder should only be linked to one identity at a time.

5. **Get the remote hostname.** Default to `'github.com'`. If `--remote` is provided, use that instead. This supports other git hosts (GitLab, Bitbucket, etc.).

6. **Store the link.** Add the folder to the identity's `folders` array. Each folder entry is an object, not just a string, so we can store the remote hostname alongside it:

```javascript
const folderEntry = {
  path: absolutePath,
  remote: remote || 'github.com'
};
```

Update the identity in config:

```javascript
const identities = context.config.get('identities') || [];
const identity = identities.find(id => id.name.toLowerCase() === name.toLowerCase());
identity.folders = identity.folders || [];

// Remove existing link to this path if present (from any identity)
for (const id of identities) {
  id.folders = (id.folders || []).filter(f => f.path !== absolutePath);
}

// Add the new link
identity.folders.push(folderEntry);
context.config.set('identities', identities);
```

7. **Print success:** "Linked '/Users/fred/Source/Personal' to identity 'personal' (remote: github.com)."

8. **Suggest running sync:** "Run 'dev identity sync' to apply changes to SSH and git config."

### Step 2: Implement `src/commands/identity/unlink.js`

```javascript
const meta = {
  description: 'Remove a folder link from an identity',
  arguments: [
    { name: 'name', description: 'Identity name', required: true },
    { name: 'folder', description: 'Folder path to unlink', required: true }
  ],
  flags: []
};
```

The `run` function should:

1. **Get identity name and folder path.** Resolve the folder to absolute.

2. **Look up the identity.** Error if not found.

3. **Find and remove the folder** from the identity's folders array. Match by path (use the resolved absolute path). If the folder isn't linked, print an info message: "Folder '/path' is not linked to identity 'personal'. Nothing to do."

4. **Save the updated config.**

5. **Print success:** "Unlinked '/Users/fred/Source/Personal' from identity 'personal'."

6. **Suggest running sync:** "Run 'dev identity sync' to update SSH and git config."

### Step 3: Implement `src/commands/identity/sync.js`

This is the big one. It reads all identities and their folder links, then writes out configuration files.

```javascript
const meta = {
  description: 'Regenerate SSH config and git config from identity definitions',
  arguments: [],
  flags: [
    { name: '--dry-run', description: 'Show what would be written without making changes' }
  ]
};
```

The `run` function should:

1. **Load all identities** from config.

2. **Validate.** Skip identities with no SSH key (they can't have SSH config entries). Warn about identities with no linked folders.

3. **Generate SSH config entries.** For each identity that has an SSH key, create a host alias block:

```javascript
function buildSshConfigBlock(identity) {
  const blocks = [];
  // Get unique remote hostnames from this identity's folders
  const remotes = [...new Set((identity.folders || []).map(f => f.remote || 'github.com'))];

  for (const remote of remotes) {
    blocks.push([
      `# DevUtils managed - ${identity.name}`,
      `Host ${remote}-${identity.name}`,
      `  HostName ${remote}`,
      `  User git`,
      `  IdentityFile ${identity.sshKey}`,
      `  IdentitiesOnly yes`,
      '',
    ].join('\n'));
  }

  return blocks.join('\n');
}
```

4. **Write the SSH config.** Read `~/.ssh/config`. Find the DevUtils-managed section (delimited by markers). Replace it with the new content. If no markers exist, append the section.

Use clear markers so the sync command knows what it owns:

```
# >>> DevUtils Managed SSH Config - DO NOT EDIT BETWEEN MARKERS >>>
...generated entries...
# <<< DevUtils Managed SSH Config <<<
```

Here's the logic:

```javascript
const START_MARKER = '# >>> DevUtils Managed SSH Config - DO NOT EDIT BETWEEN MARKERS >>>';
const END_MARKER = '# <<< DevUtils Managed SSH Config <<<';

function updateSshConfig(newContent, dryRun) {
  const sshConfigPath = path.join(os.homedir(), '.ssh', 'config');
  const fs = require('fs');

  let existing = '';
  if (fs.existsSync(sshConfigPath)) {
    existing = fs.readFileSync(sshConfigPath, 'utf8');
  }

  const startIdx = existing.indexOf(START_MARKER);
  const endIdx = existing.indexOf(END_MARKER);

  let updated;
  if (startIdx !== -1 && endIdx !== -1) {
    // Replace existing managed section
    updated = existing.substring(0, startIdx) +
      START_MARKER + '\n' + newContent + '\n' + END_MARKER +
      existing.substring(endIdx + END_MARKER.length);
  } else {
    // Append new managed section
    updated = existing.trimEnd() + '\n\n' +
      START_MARKER + '\n' + newContent + '\n' + END_MARKER + '\n';
  }

  if (dryRun) {
    return updated;
  }

  // Ensure ~/.ssh exists
  const sshDir = path.dirname(sshConfigPath);
  if (!fs.existsSync(sshDir)) {
    fs.mkdirSync(sshDir, { mode: 0o700 });
  }

  fs.writeFileSync(sshConfigPath, updated, { mode: 0o600 });
  return updated;
}
```

5. **Generate git config includes.** For each identity with linked folders, create an `includeIf` entry in `~/.gitconfig` and a corresponding identity-specific git config file.

First, create the per-identity gitconfig files (e.g., `~/.gitconfig-personal`):

```javascript
function writeIdentityGitConfig(identity, dryRun) {
  const configPath = path.join(os.homedir(), `.gitconfig-${identity.name}`);
  const lines = ['[user]', `  email = ${identity.email}`];

  if (identity.gpgKey) {
    lines.push(`  signingkey = ${identity.gpgKey}`);
    lines.push('[commit]');
    lines.push('  gpgsign = true');
  }

  const content = lines.join('\n') + '\n';

  if (!dryRun) {
    fs.writeFileSync(configPath, content);
  }

  return { path: configPath, content };
}
```

Then, add `includeIf` directives to `~/.gitconfig`. Use the same marker pattern:

```
# >>> DevUtils Managed Git Config - DO NOT EDIT BETWEEN MARKERS >>>
[includeIf "gitdir:~/Source/Personal/"]
  path = ~/.gitconfig-personal
[includeIf "gitdir:~/Source/Corporate/"]
  path = ~/.gitconfig-work
# <<< DevUtils Managed Git Config <<<
```

The `includeIf` directive uses `gitdir:` which matches any repo located under that path. The trailing `/` is important -- it means "this directory and all subdirectories."

6. **Print a summary.** Show what was written:

```
SSH config updated: ~/.ssh/config
  - github.com-personal (fred@example.com)
  - github.com-work (fred@company.com)

Git config updated: ~/.gitconfig
  - ~/Source/Personal/ -> ~/.gitconfig-personal
  - ~/Source/Corporate/ -> ~/.gitconfig-work
```

If `--dry-run`, prefix with "Would write:" and show the content without actually writing.

7. **Idempotency.** Running sync twice should produce the same result. The marker-based replacement ensures we don't keep appending entries.

## Files to Create or Modify
- `src/commands/identity/link.js` -- Implement the link command
- `src/commands/identity/unlink.js` -- Implement the unlink command
- `src/commands/identity/sync.js` -- Implement the sync command

## Acceptance Criteria
- [ ] `dev identity link personal ~/Source/Personal` stores the folder link in config
- [ ] Link resolves relative paths to absolute paths
- [ ] Link validates that the folder exists on disk
- [ ] Link with `--remote gitlab.com` stores the custom remote hostname
- [ ] Linking a folder that's already linked to the same identity is idempotent (no error, no duplicate)
- [ ] Linking a folder currently linked to a different identity moves the link and warns the user
- [ ] `dev identity unlink personal ~/Source/Personal` removes the folder from the identity
- [ ] Unlinking a folder that isn't linked prints an info message (not an error)
- [ ] `dev identity sync` generates SSH config entries with host aliases
- [ ] SSH config entries are wrapped in DevUtils markers
- [ ] Running sync twice produces the same `~/.ssh/config` content (idempotent)
- [ ] Sync creates per-identity gitconfig files (`~/.gitconfig-personal`, etc.)
- [ ] Sync adds `includeIf` directives to `~/.gitconfig` wrapped in markers
- [ ] Sync skips identities with no SSH key (for SSH config) and warns
- [ ] `dev identity sync --dry-run` shows what would be written without making changes
- [ ] All three commands suggest running sync after link/unlink changes
- [ ] All commands use `context.output` for formatting

## Testing

```bash
# Set up test identities
dev identity add personal --email fred@example.com --ssh-key ~/.ssh/id_ed25519
dev identity add work --email fred@company.com --ssh-key ~/.ssh/id_ed25519_work

# Link folders
dev identity link personal ~/Source/Personal
# Expected: "Linked '/Users/fred/Source/Personal' to identity 'personal' (remote: github.com)."

dev identity link work ~/Source/Corporate --remote github.com
# Expected: "Linked '/Users/fred/Source/Corporate' to identity 'work' (remote: github.com)."

# Verify links
dev identity show personal
# Expected: Linked Folders section shows /Users/fred/Source/Personal

# Dry run sync
dev identity sync --dry-run
# Expected: Shows SSH config and git config content without writing

# Real sync
dev identity sync
# Expected: "SSH config updated: ~/.ssh/config" and "Git config updated: ~/.gitconfig"

# Verify SSH config has the markers and entries
cat ~/.ssh/config
# Expected: Contains "# >>> DevUtils Managed SSH Config" section

# Verify per-identity gitconfig
cat ~/.gitconfig-personal
# Expected: [user] email = fred@example.com

# Run sync again (idempotent check)
dev identity sync
# Expected: Same output, no duplicated entries

# Unlink a folder
dev identity unlink personal ~/Source/Personal
# Expected: "Unlinked '/Users/fred/Source/Personal' from identity 'personal'."

# Unlink something that isn't linked
dev identity unlink personal ~/Source/Personal
# Expected: "Folder '/Users/fred/Source/Personal' is not linked to identity 'personal'. Nothing to do."

# Re-link to different identity (tests the "move" behavior)
dev identity link personal ~/Source/Corporate
# Expected: Warning about moving from 'work', then success

# Clean up test identities
dev identity remove personal --confirm --force
dev identity remove work --confirm --force
```

## Notes
- **Markers are the key to idempotency.** Without them, every sync would append new entries instead of replacing old ones. The marker strings must be unique enough that they won't appear in someone's hand-written SSH config. The `>>>` / `<<<` pattern with "DO NOT EDIT" makes it clear what's going on.
- **Never touch content outside the markers.** Users may have their own SSH config entries for non-DevUtils things. The sync command must only modify the content between its markers. If a user edits the managed section by hand, sync will overwrite their changes on the next run -- that's expected and documented.
- **The `IdentitiesOnly yes` directive** in SSH config is important. Without it, SSH will try every key in the agent before using the one specified by `IdentityFile`. With multiple identities, that can cause authentication failures because SSH might try the wrong key first and get rejected.
- **Folder paths in `includeIf` need a trailing slash.** `gitdir:~/Source/Personal/` matches any repo under that path. `gitdir:~/Source/Personal` (no slash) only matches a repo AT that exact path. Always add the trailing slash.
- **The per-identity gitconfig files are simple.** They only contain the `[user]` section (email, signing key). They don't contain aliases, merge strategies, or other git settings. Those belong in the user's main `~/.gitconfig`.
- **File permissions matter.** `~/.ssh/config` should be `0600` (owner read/write only). SSH will refuse to use a config file with overly permissive permissions. Use `fs.writeFileSync()` with the `mode` option.
- **Sync doesn't update remote URLs in existing repos.** It sets up the SSH config aliases and git identity config, but it doesn't go into each repo and change the remote URL from `github.com` to `github.com-personal`. That's a separate concern (and could be a future enhancement). For now, the user needs to update remote URLs manually or when cloning new repos.
- **Link stores folder entries as objects, not strings.** This was a design decision to allow the `--remote` flag. If we used plain strings, we'd have no place to store the remote hostname. Even if `--remote` isn't used, store the default `'github.com'` so the data structure is consistent.
