# Story 001: Identity Add and Remove

## Goal
Implement `dev identity add` and `dev identity remove` -- the commands that create and delete git identity profiles. An identity profile is a named collection of settings (email, SSH key, optional GPG key) that DevUtils uses to configure git for specific repos or folders. Without this, there's no way to manage multiple git identities from the CLI.

## Prerequisites
- 001-foundation/008 (CLI router -- commands need to be routable)
- 002-config/001 (config service init -- identities are stored in the config file)

## Background
If you work with multiple GitHub accounts (personal, work, client), you need different git identities for each. That means different email addresses, different SSH keys, and sometimes different GPG signing keys. Without a tool to manage this, you end up manually editing `~/.gitconfig`, `~/.ssh/config`, and per-repo `.git/config` files every time you switch contexts. It's tedious and error-prone.

DevUtils stores identity profiles in `~/.devutils/config.json` under an `identities` key. Each identity is an object with:

```json
{
  "name": "personal",
  "email": "fred@example.com",
  "sshKey": "/Users/fred/.ssh/id_ed25519_personal",
  "gpgKey": "ABC123DEF456",
  "folders": []
}
```

- `name` -- A short label for this identity (e.g., "personal", "work", "client-acme"). Used as the lookup key.
- `email` -- The git author email for this identity. Required.
- `sshKey` -- Absolute path to the SSH private key file. Optional (can be added later or generated).
- `gpgKey` -- GPG key ID for commit signing. Optional.
- `folders` -- Array of folder paths linked to this identity. Starts empty. The `link` command (story 003) populates this.

The `identities` array starts as an empty array in config.json. If the key doesn't exist yet, the `add` command creates it.

## Technique

### Step 1: Implement `src/commands/identity/add.js`

Fill in the `meta` object:

```javascript
const meta = {
  description: 'Create a new identity profile',
  arguments: [
    { name: 'name', description: 'Short name for this identity (e.g., personal, work)', required: true }
  ],
  flags: [
    { name: '--email', description: 'Git author email (required)', required: true },
    { name: '--ssh-key', description: 'Path to SSH private key file' },
    { name: '--gpg-key', description: 'GPG key ID for commit signing' },
    { name: '--generate-key', description: 'Generate a new SSH key pair for this identity' }
  ]
};
```

The `run` function should:

1. **Get the identity name from args[0].** If missing, print a usage error and return.

2. **Get the email from flags.** `--email` is required. If missing, print an error: "Email is required. Use --email your@email.com."

3. **Check for duplicate names.** Load the current config with `context.config.get('identities')` (returns an array or undefined). If an identity with this name already exists, print an error: "Identity 'personal' already exists. Use a different name or remove it first." Name comparison should be case-insensitive.

4. **Handle the SSH key.** Three paths here:
   - If `--ssh-key` is provided, validate that the file exists using `fs.existsSync()`. If it doesn't, print an error and return.
   - If `--generate-key` is provided, generate a new ED25519 key pair. More on this below.
   - If neither is provided, that's fine -- store `null` for sshKey. The user can add it later.

5. **Handle GPG key.** If `--gpg-key` is provided, store it. No validation needed (the user is responsible for having the key in their GPG keyring). If not provided, store `null`.

6. **Build the identity object** and append it to the identities array:

```javascript
const identity = {
  name: identityName,
  email: email,
  sshKey: sshKeyPath || null,
  gpgKey: gpgKeyId || null,
  folders: []
};
```

7. **Save to config:**

```javascript
const identities = context.config.get('identities') || [];
identities.push(identity);
context.config.set('identities', identities);
```

8. **Print a success message** with the identity details.

### Step 2: SSH key generation

When `--generate-key` is used, generate an ED25519 SSH key pair. Here's the logic:

```javascript
const path = require('path');
const os = require('os');
const fs = require('fs');

async function generateSshKey(name, email, context) {
  const sshDir = path.join(os.homedir(), '.ssh');

  // Create ~/.ssh if it doesn't exist (with correct permissions)
  if (!fs.existsSync(sshDir)) {
    fs.mkdirSync(sshDir, { mode: 0o700 });
  }

  // Build the key filename based on the identity name
  const keyPath = path.join(sshDir, `id_ed25519_${name}`);

  // Don't overwrite an existing key
  if (fs.existsSync(keyPath)) {
    throw new Error(
      `SSH key already exists at ${keyPath}. Use --ssh-key ${keyPath} to reference it, or choose a different identity name.`
    );
  }

  // Generate the key pair
  // -t ed25519: key type (modern, secure, fast)
  // -C: comment (email, so you can identify the key later)
  // -f: output file path
  // -N "": empty passphrase (no password prompt)
  await context.shell.exec(
    `ssh-keygen -t ed25519 -C "${email}" -f "${keyPath}" -N ""`
  );

  context.output.info(`SSH key generated: ${keyPath}`);
  context.output.info(`Public key: ${keyPath}.pub`);
  context.output.info('Add the public key to your GitHub account at https://github.com/settings/keys');

  return keyPath;
}
```

Key decisions:
- **ED25519** is the recommended key type. It's more secure than RSA, faster, and produces shorter keys.
- **Empty passphrase** (`-N ""`). For automated tooling, a passphrase-protected key would require user input every time it's used. Users who want a passphrase can generate the key manually and pass it with `--ssh-key`.
- **Filename includes the identity name** (`id_ed25519_personal`). This avoids collisions when you have multiple identities.

### Step 3: Implement `src/commands/identity/remove.js`

```javascript
const meta = {
  description: 'Remove an identity profile',
  arguments: [
    { name: 'name', description: 'Name of the identity to remove', required: true }
  ],
  flags: [
    { name: '--confirm', description: 'Skip the confirmation prompt' },
    { name: '--force', description: 'Remove even if the identity has linked folders' }
  ]
};
```

The `run` function should:

1. **Get the identity name from args[0].** Error if missing.

2. **Look up the identity.** Load identities from config. Find the one matching the name (case-insensitive). If not found, error: "Identity 'whatever' not found."

3. **Check for linked folders.** If the identity has entries in its `folders` array AND `--force` is not set, print an error:

   ```
   Cannot remove identity 'work' because it has 3 linked folders:
     /Users/fred/Source/Corporate/AppRegistry
     /Users/fred/Source/Corporate/Briskhaven
     /Users/fred/Source/Corporate/BriskhavenLabs
   Use --force to remove anyway, or unlink the folders first with:
     dev identity unlink work /path/to/folder
   ```

4. **Confirm the removal.** Unless `--confirm` is set, use `context.prompt.confirm()` to ask: "Remove identity 'personal'? This cannot be undone." If the prompt returns false, print "Cancelled." and return.

5. **Remove the identity** from the array and save:

```javascript
const identities = context.config.get('identities') || [];
const filtered = identities.filter(id => id.name.toLowerCase() !== name.toLowerCase());
context.config.set('identities', filtered);
```

6. **Print success:** "Identity 'personal' removed."

**Important:** The remove command does NOT delete the SSH key file or GPG key. It only removes the identity profile from DevUtils config. The user's key files stay on disk. This is safer -- accidentally deleting an SSH private key is a much bigger problem than having an orphaned key file. If you want to mention it, add an info message: "Note: SSH key at /path/to/key was not deleted. Remove it manually if no longer needed."

### Step 4: Parse flags from args

Commands receive `args` as a raw array of strings (e.g., `['personal', '--email', 'fred@example.com', '--generate-key']`). You need to parse flags out of this array. Write a small helper at the top of each file (or use a shared utility if one exists):

```javascript
function parseFlag(args, flagName) {
  const index = args.indexOf(flagName);
  if (index === -1) return undefined;
  // Boolean flags (no value after them)
  if (flagName === '--confirm' || flagName === '--force' || flagName === '--generate-key') {
    return true;
  }
  // Value flags (take the next argument)
  return args[index + 1] || undefined;
}

function hasFlag(args, flagName) {
  return args.includes(flagName);
}
```

Check whether the context object or another lib module already provides flag parsing. If so, use that instead of writing your own.

## Files to Create or Modify
- `src/commands/identity/add.js` -- Implement the add command
- `src/commands/identity/remove.js` -- Implement the remove command

## Acceptance Criteria
- [ ] `dev identity add personal --email fred@example.com` creates an identity in config
- [ ] The identity is stored in `~/.devutils/config.json` under the `identities` key
- [ ] `dev identity add personal --email fred@example.com --ssh-key ~/.ssh/id_ed25519` stores the SSH key path
- [ ] `--ssh-key` validates that the file exists before saving
- [ ] `dev identity add personal --email fred@example.com --generate-key` generates an ED25519 key pair
- [ ] Generated key is saved to `~/.ssh/id_ed25519_personal`
- [ ] Key generation doesn't overwrite existing key files
- [ ] `--gpg-key` stores the GPG key ID if provided
- [ ] Adding a duplicate name prints an error (case-insensitive check)
- [ ] `dev identity remove personal` removes the identity from config
- [ ] Remove prompts for confirmation unless `--confirm` is passed
- [ ] Remove refuses to delete an identity with linked folders unless `--force` is used
- [ ] Remove does NOT delete the SSH key file from disk
- [ ] Missing `--email` on add prints a clear error
- [ ] Missing identity name on both commands prints a usage error

## Testing

```bash
# Add a test identity
dev identity add test-id --email test@example.com
# Expected: "Identity 'test-id' created."

# Try to add a duplicate
dev identity add test-id --email other@example.com
# Expected: Error "Identity 'test-id' already exists."

# Verify it's in config
dev config get identities
# Expected: JSON array with the test-id entry

# Add with SSH key (use a key file that exists)
dev identity add test-ssh --email test@example.com --ssh-key ~/.ssh/id_ed25519
# Expected: Success (assuming that key file exists)

# Add with SSH key that doesn't exist
dev identity add test-bad --email test@example.com --ssh-key /nonexistent/key
# Expected: Error about file not found

# Remove with confirmation prompt
dev identity remove test-id
# Expected: "Remove identity 'test-id'? This cannot be undone." then removal on confirm

# Remove with --confirm flag (skip prompt)
dev identity remove test-ssh --confirm
# Expected: "Identity 'test-ssh' removed." (no prompt)

# Remove nonexistent identity
dev identity remove nonexistent
# Expected: Error "Identity 'nonexistent' not found."
```

## Notes
- **Identity names should be simple.** Stick to lowercase letters, numbers, and hyphens. Don't allow spaces or special characters in names -- they'll cause problems in file paths (the SSH key filename includes the identity name). Consider adding validation: `/^[a-z0-9][a-z0-9-]*$/.test(name)`.
- **The `folders` array on each identity starts empty.** It gets populated by `dev identity link` in story 003. Don't skip creating it -- other code depends on it being there.
- **SSH key generation uses an empty passphrase.** This is a deliberate trade-off. Passphrase-protected keys are more secure but require user input (or an ssh-agent) every time they're used. For a CLI tool that manages multiple identities, the friction of passphrase entry would be a dealbreaker. Document this trade-off.
- **Don't delete SSH keys on remove.** An SSH key might be registered on GitHub, GitLab, or other services. Deleting the private key would lock the user out of those services until they re-register a new key. Always err on the side of caution with key material.
- **The `identities` key might not exist in config yet.** Always default to an empty array: `context.config.get('identities') || []`. Don't assume the config schema has been pre-populated.
