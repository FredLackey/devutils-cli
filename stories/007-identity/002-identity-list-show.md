# Story 002: Identity List and Show

## Goal
Implement `dev identity list` and `dev identity show` -- the read-only commands that let you see what identities exist and drill into the details of any one of them. These are the "where am I?" commands that help you understand your current setup before making changes.

## Prerequisites
- 007-identity/001 (identity add/remove -- there need to be identities in config before you can list or show them)

## Background
Once you've created a few identities with `dev identity add`, you need a way to see them at a glance and inspect their details. These two commands are the answer:

- `dev identity list` gives you the overview: a table of all identities with their name, email, and how many folders are linked to each one.
- `dev identity show <name>` gives you the full picture for one identity: email, SSH key path (and whether the file exists), GPG key ID, and every linked folder.

Both commands are read-only. They don't change any config. They use `context.output` for formatting so the output works in table format (for humans) and JSON format (for scripts and AI callers).

The data comes from `context.config.get('identities')`, which returns an array of identity objects as defined in story 001.

## Technique

### Step 1: Implement `src/commands/identity/list.js`

Fill in the `meta` object:

```javascript
const meta = {
  description: 'List all configured identities',
  arguments: [],
  flags: [
    { name: '--json', description: 'Output as JSON instead of a table' }
  ]
};
```

The `run` function should:

1. **Load identities from config:**

```javascript
const identities = context.config.get('identities') || [];
```

2. **Handle the empty case.** If the array is empty, print a helpful message and return:

```
No identities configured.

Create one with:
  dev identity add <name> --email <email>

Example:
  dev identity add personal --email fred@example.com
```

Don't just print "No identities." -- give the user a next step.

3. **Build the table data.** For each identity, create a row:

```javascript
const rows = identities.map(id => ({
  Name: id.name,
  Email: id.email,
  'SSH Key': id.sshKey ? 'yes' : 'no',
  'GPG Key': id.gpgKey ? 'yes' : 'no',
  'Linked Folders': (id.folders || []).length
}));
```

4. **Output the table:**

```javascript
if (hasFlag(args, '--json')) {
  context.output.json(identities);
} else {
  context.output.table(rows);
}
```

5. **Print a count at the bottom:** `"3 identities configured."` (or `"1 identity configured."` for singular).

### Step 2: Implement `src/commands/identity/show.js`

```javascript
const meta = {
  description: 'Show details of a specific identity',
  arguments: [
    { name: 'name', description: 'Name of the identity to show', required: true }
  ],
  flags: [
    { name: '--json', description: 'Output as JSON instead of formatted text' }
  ]
};
```

The `run` function should:

1. **Get the identity name from args[0].** Error if missing.

2. **Look up the identity.** Load identities from config and find the one matching the name (case-insensitive). If not found, error: "Identity 'whatever' not found. Run 'dev identity list' to see available identities."

3. **If `--json`, output the raw identity object** and return:

```javascript
if (hasFlag(args, '--json')) {
  context.output.json(identity);
  return;
}
```

4. **Format a detailed display.** Print each field with a label:

```
Identity: personal

  Email:         fred@example.com
  SSH Key:       ~/.ssh/id_ed25519_personal (exists)
  GPG Key:       ABC123DEF456
  Linked Folders (2):
    /Users/fred/Source/Personal/FredLackey
    /Users/fred/Source/Personal/FredLackeyOfficial
```

Here's the formatting logic:

- **SSH Key:** Show the path. Check if the file exists using `fs.existsSync()` and add `(exists)` or `(missing!)` after the path. If `sshKey` is null, print `(not configured)`.
- **GPG Key:** Show the key ID or `(not configured)` if null.
- **Linked Folders:** Show the count in the header and list each path indented below. If no folders are linked, print `(none)`.

```javascript
const fs = require('fs');

function formatSshKey(sshKey) {
  if (!sshKey) return '(not configured)';
  const exists = fs.existsSync(sshKey);
  return `${sshKey} ${exists ? '(exists)' : '(missing!)'}`;
}

function formatGpgKey(gpgKey) {
  if (!gpgKey) return '(not configured)';
  return gpgKey;
}
```

5. **Use `context.output.info()` or similar** to print each line. Don't use raw `console.log()`.

### Step 3: Code style

- CommonJS modules, 2-space indentation, LF line endings
- `'use strict';` at the top
- JSDoc on `meta` and `run`
- Keep the files short. List and show are simple read-only commands. If you find yourself writing a lot of code, you're probably overcomplicating it.

## Files to Create or Modify
- `src/commands/identity/list.js` -- Implement the list command
- `src/commands/identity/show.js` -- Implement the show command

## Acceptance Criteria
- [ ] `dev identity list` shows a table with Name, Email, SSH Key (yes/no), GPG Key (yes/no), Linked Folders (count)
- [ ] `dev identity list` with no identities prints a helpful message with an example command
- [ ] `dev identity list --json` outputs the identities array as JSON
- [ ] `dev identity list` shows a count at the bottom ("N identities configured.")
- [ ] `dev identity show personal` displays full details for the "personal" identity
- [ ] `dev identity show personal --json` outputs the identity object as JSON
- [ ] Show displays SSH key path with `(exists)` or `(missing!)` status
- [ ] Show displays GPG key ID or `(not configured)`
- [ ] Show lists all linked folders or `(none)` if no folders linked
- [ ] `dev identity show nonexistent` prints a clear error with a suggestion to run list
- [ ] Both commands use `context.output` for all formatting (no raw `console.log`)
- [ ] Name lookup is case-insensitive

## Testing

```bash
# First, create some test identities
dev identity add personal --email fred@example.com
dev identity add work --email fred@company.com --ssh-key ~/.ssh/id_ed25519

# List all identities
dev identity list
# Expected:
# Name      Email               SSH Key  GPG Key  Linked Folders
# personal  fred@example.com    no       no       0
# work      fred@company.com    yes      no       0
#
# 2 identities configured.

# List as JSON
dev identity list --json
# Expected: JSON array of identity objects

# Show one identity
dev identity show personal
# Expected:
# Identity: personal
#
#   Email:         fred@example.com
#   SSH Key:       (not configured)
#   GPG Key:       (not configured)
#   Linked Folders (0):
#     (none)

# Show with SSH key
dev identity show work
# Expected:
# Identity: work
#
#   Email:         fred@company.com
#   SSH Key:       ~/.ssh/id_ed25519 (exists)
#   GPG Key:       (not configured)
#   Linked Folders (0):
#     (none)

# Show as JSON
dev identity show work --json
# Expected: JSON object for the work identity

# Show nonexistent identity
dev identity show nope
# Expected: Error "Identity 'nope' not found. Run 'dev identity list' to see available identities."

# List with no identities (after removing all)
dev identity remove personal --confirm
dev identity remove work --confirm
dev identity list
# Expected: "No identities configured." with example command

# Clean up
dev identity remove personal --confirm 2>/dev/null
dev identity remove work --confirm 2>/dev/null
```

## Notes
- **The SSH key path validation in `show` is informational only.** It tells you whether the key file exists on disk, which is useful for debugging. It doesn't mean the key is valid or registered on GitHub. A key could exist but be corrupted, or could be registered on one GitHub account but not another.
- **The `folders` array on an identity might be undefined** if the identity was created before the folders feature was added, or if someone hand-edited the config file. Always default to an empty array: `id.folders || []`.
- **The empty-state message in `list` is important.** New users will run `dev identity list` as their first command to see what's there. Seeing "No identities." with no guidance is a dead end. Always include a next-step suggestion.
- **Table column widths.** The `context.output.table()` function should handle column sizing. If it doesn't yet, that's okay -- the output module from story 001-foundation/004 will handle it. For now, pass the rows and let the output module do its thing.
- **Case-insensitive lookup.** Both list and show should work with any casing of the identity name. If someone adds "Personal" and then runs `dev identity show personal`, it should work. Always compare with `.toLowerCase()`.
- **Folder entries are objects, not strings.** Story 003 (identity link) defines each folder entry as `{ path, remote }`, not a plain string. When displaying folder paths in `show` or counting folders in `list`, access the path with `f.path` (e.g., `id.folders.map(f => f.path)`). If you treat them as strings, you will get `[object Object]` in your output and have to refactor later.
