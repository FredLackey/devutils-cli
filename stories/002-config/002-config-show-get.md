# Story 002: Config Show and Config Get

## Goal

Implement `src/commands/config/show.js` and `src/commands/config/get.js`. These two commands let users see what is in their configuration — `show` dumps the entire config as formatted output, and `get` retrieves a single value by dot-notation key (like `user.email` or `defaults.license`). These are the primary way users inspect their settings, and they are the first commands that use `context.output` for structured formatting.

## Prerequisites

- 002-config/001 (config init — `~/.devutils/config.json` must exist before you can show or get values from it)

## Background

After running `dev config init`, the user has a `config.json` file at `~/.devutils/config.json`. It looks something like this:

```json
{
  "user": {
    "name": "Fred Lackey",
    "email": "fred@example.com",
    "url": "https://fredlackey.com"
  },
  "defaults": {
    "license": "MIT",
    "packageManager": "npm"
  },
  "backup": {
    "backend": "repo",
    "location": null
  },
  "profile": "default"
}
```

`dev config show` displays this entire object. `dev config get user.email` returns just `fred@example.com`. Both commands respect the global `--format` flag (json, table, yaml, csv) through `context.output`.

For the command syntax, see `research/proposed/proposed-command-syntax.md` lines 234-243.

## Technique

### config/show.js

#### Step 1: Fill in the meta object

```javascript
const meta = {
  description: 'Display the current configuration.',
  arguments: [],
  flags: [
    { name: 'profile', type: 'string', description: 'Show a specific profile instead of the active one' }
  ]
};
```

#### Step 2: Read the config

In the `run()` function, read `config.json` using `context.config`. If the config file does not exist, use `context.errors` to return a structured error telling the user to run `dev config init` first.

```javascript
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(require('os').homedir(), '.devutils', 'config.json');
```

```javascript
async function run(args, context) {
  if (!fs.existsSync(CONFIG_FILE)) {
    return context.errors.exit('Config not found. Run "dev config init" first.', { code: 1 });
  }

  const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
  const config = JSON.parse(raw);
```

#### Step 3: Handle the --profile flag

The `--profile` flag is a placeholder for future multi-profile support. For now, if the user passes `--profile` and it does not match the current config's profile name, return an error saying that profile was not found. If it matches (or no flag was passed), show the current config.

```javascript
  if (args.flags.profile && args.flags.profile !== config.profile) {
    return context.errors.exit(`Profile "${args.flags.profile}" not found. Current profile is "${config.profile}".`, { code: 1 });
  }
```

#### Step 4: Output the config

Pass the config object to `context.output` for formatting. The output module handles json, table, yaml, csv based on the detected or requested format.

```javascript
  context.output.print(config);
}
```

That is it for show. It is intentionally simple.

### config/get.js

#### Step 1: Fill in the meta object

```javascript
const meta = {
  description: 'Read a specific config value by dot-notation key.',
  arguments: [
    { name: 'key', required: true, description: 'Dot-notation path to the config value (e.g., user.email, defaults.license)' }
  ],
  flags: []
};
```

#### Step 2: Validate the key argument

The user must provide exactly one positional argument: the key. If it is missing, return an error.

```javascript
async function run(args, context) {
  const key = args.positional[0];

  if (!key) {
    return context.errors.exit('Missing required argument: <key>. Example: dev config get user.email', { code: 1 });
  }
```

#### Step 3: Read the config

Same as show — read the file, parse it, handle missing file.

```javascript
  const fs = require('fs');
  const path = require('path');
  const CONFIG_FILE = path.join(require('os').homedir(), '.devutils', 'config.json');

  if (!fs.existsSync(CONFIG_FILE)) {
    return context.errors.exit('Config not found. Run "dev config init" first.', { code: 1 });
  }

  const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
  const config = JSON.parse(raw);
```

#### Step 4: Resolve the dot-notation key

Split the key by `.` and walk the config object one level at a time. If any segment does not exist, return a clear error.

```javascript
  const parts = key.split('.');
  let value = config;

  for (const part of parts) {
    if (value === null || value === undefined || typeof value !== 'object') {
      return context.errors.exit(`Key "${key}" not found in config.`, { code: 1 });
    }
    if (!(part in value)) {
      return context.errors.exit(`Key "${key}" not found in config.`, { code: 1 });
    }
    value = value[part];
  }
```

#### Step 5: Output the value

If the resolved value is a primitive (string, number, boolean, null), print it directly. If it is an object or array, pass it through `context.output` for structured formatting.

```javascript
  if (typeof value === 'object' && value !== null) {
    context.output.print(value);
  } else {
    context.output.print(value);
  }
}
```

The output module should handle both cases. If the value is a simple string like `"fred@example.com"`, it prints that string. If it is an object like the entire `user` block, it formats it as json/table/etc.

## Files to Create or Modify

- `src/commands/config/show.js` — Replace the stub with the full implementation
- `src/commands/config/get.js` — Replace the stub with the full implementation

## Acceptance Criteria

- [ ] `dev config show` prints the entire config.json contents as formatted output
- [ ] `dev config show --format json` prints the config as JSON
- [ ] `dev config show` on a machine with no config prints an error telling the user to run `dev config init`
- [ ] `dev config show --profile default` works when the current profile is "default"
- [ ] `dev config show --profile nonexistent` prints an error saying that profile was not found
- [ ] `dev config get user.email` prints just the email value
- [ ] `dev config get user` prints the entire user object (name, email, url)
- [ ] `dev config get defaults.license` prints "MIT"
- [ ] `dev config get nonexistent.key` prints a clear error: "Key not found in config"
- [ ] `dev config get` (no key argument) prints a clear error about the missing argument
- [ ] Both commands work correctly with `--format json`, `--format table`, and other format flags

## Testing

```bash
# Make sure config exists first
dev config init --force

# Show full config
dev config show
# Expected: Entire config.json formatted for the terminal

dev config show --format json
# Expected: JSON output of the full config

# Get specific values
dev config get user.email
# Expected: The email address string

dev config get user
# Expected: The entire user object { name, email, url }

dev config get defaults.license
# Expected: "MIT"

dev config get profile
# Expected: "default" (or whatever was set during init)

# Error cases
dev config get fake.key
# Expected: Error — "Key "fake.key" not found in config."

dev config get
# Expected: Error — "Missing required argument: <key>"

# Test with no config file
rm ~/.devutils/config.json
dev config show
# Expected: Error — "Config not found. Run dev config init first."
```

## Notes

- The dot-notation resolver is a simple loop, not a library. Do not pull in lodash or any other dependency for this. It is about 10 lines of code.
- Be careful with `null` values. `config.backup.location` starts as `null`. `dev config get backup.location` should print `null`, not throw an error. The error should only happen when the key path itself does not exist.
- The `--profile` flag on `show` is mostly a placeholder right now. Real multi-profile support comes with the backup/sync stories (010-config-backup). But the flag should be accepted and handled gracefully now so the CLI syntax is stable from the start.
- Both commands should use `context.output.print()` for all output. Do not use `console.log` directly. The output module is what handles format detection and the `--format` flag.
