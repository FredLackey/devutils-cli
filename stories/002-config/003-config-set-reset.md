# Story 003: Config Set and Config Reset

## Goal

Implement `src/commands/config/set.js` and `src/commands/config/reset.js`. `set` writes a single value to config.json by dot-notation key, and `reset` restores the entire config to a clean default state. Together with `show` and `get` from the previous story, these four commands give users full read/write control over their configuration. Both commands must be idempotent — running them multiple times with the same input produces the same result without errors.

## Prerequisites

- 002-config/002 (config show/get — the read commands should work before we build the write commands, so you can verify what `set` and `reset` actually changed)

## Background

The config file at `~/.devutils/config.json` is a JSON object. Users need to be able to change individual values without editing the file by hand. For example, `dev config set user.email new@example.com` should update just the email field without touching anything else.

For structured values (objects, arrays), the command accepts a `--json` flag so the user can pass a JSON string instead of a simple scalar value.

`reset` is the escape hatch. If the config gets into a bad state, `dev config reset` wipes it back to defaults. Since this is destructive, it asks for confirmation unless `--confirm` is passed.

For command syntax, see `research/proposed/proposed-command-syntax.md` lines 244-254.

## Technique

### config/set.js

#### Step 1: Fill in the meta object

```javascript
const meta = {
  description: 'Write a config value by dot-notation key.',
  arguments: [
    { name: 'key', required: true, description: 'Dot-notation path to the config value (e.g., user.email)' },
    { name: 'value', required: false, description: 'The value to set. Omit if using --json.' }
  ],
  flags: [
    { name: 'json', type: 'string', description: 'Set a structured value using a JSON string' }
  ]
};
```

#### Step 2: Validate arguments

The user must provide a key. They must also provide either a positional value or the `--json` flag, but not both.

```javascript
async function run(args, context) {
  const key = args.positional[0];
  const rawValue = args.positional[1];
  const jsonValue = args.flags.json;

  if (!key) {
    return context.errors.exit('Missing required argument: <key>. Example: dev config set user.email fred@example.com', { code: 1 });
  }

  if (!rawValue && !jsonValue) {
    return context.errors.exit('Missing value. Provide a value or use --json for structured data.', { code: 1 });
  }

  if (rawValue && jsonValue) {
    return context.errors.exit('Provide either a positional value or --json, not both.', { code: 1 });
  }
```

#### Step 3: Parse the value

If `--json` was used, parse the JSON string. If a positional value was given, try to interpret it as the right type: `"true"` and `"false"` become booleans, numeric strings become numbers, everything else stays a string.

```javascript
  let value;

  if (jsonValue) {
    try {
      value = JSON.parse(jsonValue);
    } catch (err) {
      return context.errors.exit(`Invalid JSON: ${err.message}`, { code: 1 });
    }
  } else {
    // Coerce simple types
    if (rawValue === 'true') {
      value = true;
    } else if (rawValue === 'false') {
      value = false;
    } else if (rawValue === 'null') {
      value = null;
    } else if (!isNaN(rawValue) && rawValue.trim() !== '') {
      value = Number(rawValue);
    } else {
      value = rawValue;
    }
  }
```

#### Step 4: Read the existing config

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

#### Step 5: Set the value by dot-notation key

Split the key, walk the object, and set the value at the final segment. Create intermediate objects if they do not exist (so `dev config set some.new.key hello` works even if `some` and `new` are not already in the config).

```javascript
  const parts = key.split('.');
  let target = config;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in target) || typeof target[part] !== 'object' || target[part] === null) {
      target[part] = {};
    }
    target = target[part];
  }

  const lastPart = parts[parts.length - 1];
  target[lastPart] = value;
```

#### Step 6: Write the config back

```javascript
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
  context.output.print({ key: key, value: value });
}
```

Print the key and value that was set so the user gets confirmation.

### config/reset.js

#### Step 1: Fill in the meta object

```javascript
const meta = {
  description: 'Reset configuration to defaults. Clears user info and restores default settings.',
  arguments: [],
  flags: [
    { name: 'confirm', type: 'boolean', description: 'Skip the confirmation prompt' }
  ]
};
```

#### Step 2: Check if config exists

```javascript
async function run(args, context) {
  const fs = require('fs');
  const path = require('path');
  const CONFIG_FILE = path.join(require('os').homedir(), '.devutils', 'config.json');

  if (!fs.existsSync(CONFIG_FILE)) {
    return context.errors.exit('Config not found. Nothing to reset.', { code: 1 });
  }
```

#### Step 3: Ask for confirmation

Unless `--confirm` is passed, prompt the user. This is destructive — it wipes their settings.

```javascript
  if (!args.flags.confirm) {
    const proceed = await context.prompt.confirm(
      'This will reset all configuration to defaults. Your user info will be cleared. Continue?',
      { default: false }
    );
    if (!proceed) {
      context.output.print('Reset cancelled.');
      return;
    }
  }
```

Note: `default: false` means if the user just hits Enter, the answer is "no". This is a safety measure.

#### Step 4: Write the default config

The default config has the same shape as what `config init` creates, but with empty user fields and standard defaults.

```javascript
  const defaults = {
    user: {
      name: '',
      email: '',
      url: ''
    },
    defaults: {
      license: 'MIT',
      packageManager: 'npm'
    },
    backup: {
      backend: null,
      location: null
    },
    profile: 'default'
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaults, null, 2) + '\n');
  context.output.print('Configuration reset to defaults.');
}
```

Notice that `backup.backend` is set to `null` (not `'repo'` or `'gist'`), since the user has not made that choice yet in this reset state. The profile goes back to `'default'`.

## Files to Create or Modify

- `src/commands/config/set.js` — Replace the stub with the full implementation
- `src/commands/config/reset.js` — Replace the stub with the full implementation

## Acceptance Criteria

- [ ] `dev config set user.email new@example.com` updates only the email field in config.json
- [ ] `dev config get user.email` returns `new@example.com` after the set
- [ ] `dev config set defaults.license ISC` changes the license to "ISC"
- [ ] `dev config set user --json '{"name":"Test","email":"t@t.com","url":""}'` replaces the entire user object
- [ ] `dev config set some.new.key hello` creates intermediate objects and sets the value
- [ ] `dev config set count 42` stores the number 42, not the string "42"
- [ ] `dev config set enabled true` stores the boolean `true`, not the string "true"
- [ ] `dev config set` (no key) prints a clear error about the missing argument
- [ ] `dev config set user.email` (no value and no --json) prints a clear error about the missing value
- [ ] `dev config set user.email x --json '{}'` prints an error about providing both
- [ ] `dev config reset` prompts for confirmation and writes defaults if confirmed
- [ ] `dev config reset` does nothing if the user declines confirmation
- [ ] `dev config reset --confirm` skips the prompt and resets immediately
- [ ] After reset, config.json has empty user fields and default values for `defaults`
- [ ] Both commands are idempotent — running set with the same key/value twice produces the same file

## Testing

```bash
# Set a simple string value
dev config set user.email test@example.com
dev config get user.email
# Expected: test@example.com

# Set a number
dev config set retryCount 3
dev config get retryCount
# Expected: 3 (as a number, not "3")

# Set a boolean
dev config set verbose true
dev config get verbose
# Expected: true (as a boolean)

# Set a structured value with --json
dev config set user --json '{"name": "Test User", "email": "test@test.com", "url": ""}'
dev config get user.name
# Expected: Test User

# Set a new nested key that doesn't exist yet
dev config set custom.setting.deep value
dev config get custom.setting.deep
# Expected: value

# Error cases
dev config set
# Expected: Error about missing key

dev config set user.email
# Expected: Error about missing value

# Reset
dev config reset --confirm
dev config show
# Expected: Default config with empty user fields

# Reset with prompt (interactive)
dev config set user.name "Someone"
dev config reset
# Expected: Confirmation prompt — answer "n" to cancel, "y" to reset
```

## Notes

- The type coercion in `set` (turning `"true"` to `true`, `"42"` to `42`) is a convenience, but it can surprise users. If someone wants to literally store the string `"true"`, they would need to use `--json '"true"'`. This is an acceptable trade-off — the common case is that `true` means the boolean, and `--json` is the escape hatch for edge cases.
- When creating intermediate objects for a new deep key, only create plain objects (`{}`). Do not try to create arrays. If the user needs to set an array, they should use `--json`.
- The `reset` command does not delete the `~/.devutils/` directory or any subdirectories. It only resets `config.json`. Machine profiles, auth tokens, and other files are untouched. This is intentional — reset is about config, not about wiping the entire DevUtils installation.
- Make sure `set` preserves all existing keys in config.json that are not being changed. Read the full file, modify the one key, write the full file back. Do not construct a new object from scratch.
