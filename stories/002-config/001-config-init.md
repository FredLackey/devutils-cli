# Story 001: Config Init (Onboarding Wizard)

## Goal

Implement `src/commands/config/init.js`, the first-run onboarding wizard that sets up a new user's DevUtils environment. This is the very first command most users will ever run, and it creates the `~/.devutils/` directory, writes the initial `config.json`, and walks the user through basic questions about who they are and how they want to back up their settings. Without this command, nothing else in DevUtils works because there is no config file to read from.

## Prerequisites

- 001-foundation/008 (CLI router — `src/cli.js` must be able to parse arguments, build the context object, and dispatch to command files)

## Background

When a user installs DevUtils and runs any `dev` command for the first time, the CLI needs to know a few things: their name, email, and optionally a URL (for git commits, license headers, etc.). It also needs to know where they want to store configuration backups — either a private GitHub repo or a secret gist. And it needs a profile name so their config can be identified in backup storage.

The onboarding wizard collects all of this interactively using `context.prompt` (the prompt.js lib module). It then creates the `~/.devutils/` directory structure and writes `config.json`.

For reference on the init syntax and flags, see `research/proposed/proposed-command-syntax.md` lines 228-233. For the backup storage choices and profile concept, see `research/proposed/config-backup-sync.md` lines 142-183.

The `~/.devutils/` directory structure is documented in `research/proposed/proposed-package-structure.md` (the "User Data Directory" section). At minimum, `config init` needs to create:

```
~/.devutils/
  config.json
  machines/
  bin/
```

The `machines/` folder will be used by `dev machine detect` later. The `bin/` folder is where alias wrapper scripts go, and the init command needs to offer to add it to the user's PATH.

## Technique

### Step 1: Fill in the meta object

Update the `meta` export in `src/commands/config/init.js` with a clear description, no arguments, and two flags:

```javascript
const meta = {
  description: 'First-run onboarding wizard. Sets up ~/.devutils/ and creates config.json.',
  arguments: [],
  flags: [
    { name: 'force', type: 'boolean', description: 'Re-run setup even if already configured' },
    { name: 'profile', type: 'string', description: 'Set the profile name (skip the prompt)' }
  ]
};
```

### Step 2: Check if already configured (idempotency)

At the top of `run()`, use `context.config` to check whether `~/.devutils/config.json` already exists and has content. If it does and `--force` is not set, print a message saying DevUtils is already configured and exit cleanly. This makes the command safe to run multiple times.

```javascript
const fs = require('fs');
const path = require('path');

const DEVUTILS_DIR = path.join(require('os').homedir(), '.devutils');
const CONFIG_FILE = path.join(DEVUTILS_DIR, 'config.json');
```

Check for existing config:

```javascript
if (fs.existsSync(CONFIG_FILE) && !args.flags.force) {
  context.output.print('DevUtils is already configured. Use --force to re-run setup.');
  return;
}
```

### Step 3: Create the directory structure

Use `fs.mkdirSync` with `{ recursive: true }` to create the directories. The `recursive` option means it won't throw if the directory already exists.

```javascript
fs.mkdirSync(path.join(DEVUTILS_DIR, 'machines'), { recursive: true });
fs.mkdirSync(path.join(DEVUTILS_DIR, 'bin'), { recursive: true });
fs.mkdirSync(path.join(DEVUTILS_DIR, 'auth'), { recursive: true });
```

### Step 4: Prompt for user info

Use `context.prompt` to ask the user three questions. Remember that `prompt.js` automatically skips prompts in non-interactive environments (AI, CI, piped) and returns defaults.

```javascript
const name = await context.prompt.input('Your full name:', { default: '' });
const email = await context.prompt.input('Your email address:', { default: '' });
const url = await context.prompt.input('Your URL (optional):', { default: '' });
```

### Step 5: Prompt for backup storage backend

Present two choices: private repo or secret gist. Explain the trade-off briefly. Just store the choice for now — the actual backup functionality is built in a later story (010-config-backup).

```javascript
const backupBackend = await context.prompt.select(
  'Where should DevUtils store configuration backups?',
  [
    { value: 'repo', label: 'Private GitHub repository (recommended — truly private, version history)' },
    { value: 'gist', label: 'Secret GitHub gist (simpler — but not truly private, anyone with URL can see it)' }
  ]
);
```

### Step 6: Prompt for profile name

If `--profile` was passed as a flag, use that value. Otherwise, ask the user. Default to `'default'`.

```javascript
const profile = args.flags.profile || await context.prompt.input(
  'Profile name for this machine:',
  { default: 'default' }
);
```

### Step 7: Build and write config.json

Construct the config object and write it using `context.config.write()` (or directly with `fs.writeFileSync` if the config lib isn't fully built yet — but prefer the lib).

The config structure should look like this:

```javascript
const config = {
  user: {
    name: name,
    email: email,
    url: url
  },
  defaults: {
    license: 'MIT',
    packageManager: 'npm'
  },
  backup: {
    backend: backupBackend,  // 'repo' or 'gist'
    location: null           // will be set by config export later
  },
  profile: profile
};
```

Write it:

```javascript
fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
```

### Step 8: Offer to add ~/.devutils/bin to PATH

Detect the user's shell by checking `process.env.SHELL` or using `context.platform`. Then tell the user what line to add and to which file. For idempotency, check if the PATH entry already exists in the shell config file before appending.

- **zsh**: Append `export PATH="$HOME/.devutils/bin:$PATH"` to `~/.zshrc`
- **bash**: Append to `~/.bashrc`
- **fish**: Use `fish_add_path` in `~/.config/fish/config.fish`
- **PowerShell**: Append to `$PROFILE`

Ask the user if they want DevUtils to add it automatically:

```javascript
const addToPath = await context.prompt.confirm(
  'Add ~/.devutils/bin to your PATH? (required for aliases to work)',
  { default: true }
);
```

If yes, read the shell config file, check if the line is already there (idempotency!), and append it if missing. Print a message telling the user to restart their terminal or `source` the file.

### Step 9: Print a summary

Show the user what was created:

```javascript
context.output.print('');
context.output.print('DevUtils configured successfully!');
context.output.print('');
context.output.print(`  Name:     ${name || '(not set)'}`);
context.output.print(`  Email:    ${email || '(not set)'}`);
context.output.print(`  Profile:  ${profile}`);
context.output.print(`  Backup:   ${backupBackend}`);
context.output.print(`  Config:   ${CONFIG_FILE}`);
context.output.print('');
```

## Files to Create or Modify

- `src/commands/config/init.js` — Replace the stub with the full implementation. This is the only file this story touches.

## Acceptance Criteria

- [ ] Running `dev config init` on a machine with no `~/.devutils/` directory creates the directory, `config.json`, `machines/`, `bin/`, and `auth/` subdirectories
- [ ] The wizard prompts for name, email, URL, backup backend, and profile name
- [ ] `config.json` is valid JSON containing `user`, `defaults`, `backup`, and `profile` fields
- [ ] Running `dev config init` a second time prints "already configured" and does nothing
- [ ] Running `dev config init --force` re-runs the wizard even if already configured
- [ ] Running `dev config init --profile work` skips the profile name prompt and uses "work"
- [ ] The PATH addition check is idempotent (does not add the line twice if already present)
- [ ] Non-interactive environments (piped input, CI) skip prompts and use defaults

## Testing

```bash
# Clean slate test (remove existing config first)
rm -rf ~/.devutils
dev config init

# Verify the directory was created
ls -la ~/.devutils/
# Expected: config.json, machines/, bin/, auth/

# Verify config.json content
cat ~/.devutils/config.json
# Expected: JSON with user, defaults, backup, profile fields

# Test idempotency
dev config init
# Expected: "DevUtils is already configured. Use --force to re-run setup."

# Test force flag
dev config init --force
# Expected: Wizard runs again, overwrites config.json

# Test profile flag
dev config init --force --profile work
# Expected: Wizard runs, profile is "work" without prompting
```

## Notes

- The backup backend choice (`repo` or `gist`) is just stored as a string in config.json for now. The actual backup/restore logic is built in the 010-config-backup story group. Do not try to create repos or gists here.
- When checking if the PATH line already exists in a shell config file, do a string search for `.devutils/bin`. Don't be too strict with the match — the user might have added it manually with slightly different formatting.
- If the shell config file doesn't exist (e.g., a fresh machine with no `.zshrc`), create it. But be careful: create only if the user said yes to the PATH prompt.
- The `defaults.license` and `defaults.packageManager` values are hardcoded defaults for now. Future stories may add prompts for these.
- If `context.config.write()` is available from the config lib, prefer it over raw `fs.writeFileSync`. But if the lib isn't ready yet, raw fs is fine — the config lib story (001-foundation/006) should be done first, and this story lists it as a transitive dependency through 001-foundation/008.
