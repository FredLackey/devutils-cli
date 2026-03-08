# Story 002: Machine Set and Machine List

## Goal

Implement `src/commands/machine/set.js` and `src/commands/machine/list.js`. `set` updates a single value in the current machine profile (`current.json`) by dot-notation key — the same pattern used by `dev config set`. `list` shows all known machine profiles. Since backup/sync is not built yet, `list` will only show the current machine for now, but the command structure is in place for when multiple machines become visible through config backup storage.

## Prerequisites

- 003-machine/001 (machine detect/show — `current.json` must exist before you can set values in it or list machine profiles)

## Background

After running `dev machine detect`, the user has a machine profile at `~/.devutils/machines/current.json`. Sometimes the auto-detected values are not quite right, or the user wants to add custom metadata (like a friendly nickname for the machine, or a note about its purpose). `dev machine set` lets them do that without editing the JSON file by hand.

`dev machine list` is about seeing all machines associated with the user's DevUtils configuration. Right now, that is just the current machine. When the backup/sync system is built (story group 010-config-backup), the backup storage will contain machine profiles from every computer the user has set up DevUtils on. At that point, `list` will read from the backup and show them all. For now, it reads the local `machines/` directory and lists what it finds.

For command syntax, see `research/proposed/proposed-command-syntax.md` lines 282-290.

## Technique

### machine/set.js

#### Step 1: Fill in the meta object

```javascript
const meta = {
  description: 'Set a value in the current machine profile.',
  arguments: [
    { name: 'key', required: true, description: 'Dot-notation path to the value (e.g., nickname, os.version)' },
    { name: 'value', required: false, description: 'The value to set. Omit if using --json.' }
  ],
  flags: [
    { name: 'json', type: 'string', description: 'Set a structured value using a JSON string' }
  ]
};
```

#### Step 2: Implement the run function

This follows the exact same pattern as `config/set.js`. The only difference is the file being modified — instead of `~/.devutils/config.json`, it is `~/.devutils/machines/current.json`.

```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');

async function run(args, context) {
  const key = args.positional[0];
  const rawValue = args.positional[1];
  const jsonValue = args.flags.json;

  if (!key) {
    return context.errors.exit('Missing required argument: <key>. Example: dev machine set nickname "my-laptop"', { code: 1 });
  }

  if (!rawValue && !jsonValue) {
    return context.errors.exit('Missing value. Provide a value or use --json for structured data.', { code: 1 });
  }

  if (rawValue && jsonValue) {
    return context.errors.exit('Provide either a positional value or --json, not both.', { code: 1 });
  }
```

#### Step 3: Parse the value

Same type coercion logic as `config/set.js`: `"true"` becomes boolean `true`, numeric strings become numbers, everything else stays a string. Parse `--json` values with `JSON.parse()`.

```javascript
  let value;

  if (jsonValue) {
    try {
      value = JSON.parse(jsonValue);
    } catch (err) {
      return context.errors.exit(`Invalid JSON: ${err.message}`, { code: 1 });
    }
  } else {
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

#### Step 4: Read, modify, and write the machine profile

```javascript
  const CURRENT_FILE = path.join(os.homedir(), '.devutils', 'machines', 'current.json');

  if (!fs.existsSync(CURRENT_FILE)) {
    return context.errors.exit('No machine profile found. Run "dev machine detect" first.', { code: 1 });
  }

  const raw = fs.readFileSync(CURRENT_FILE, 'utf8');
  const profile = JSON.parse(raw);

  // Walk the dot-notation path and set the value
  const parts = key.split('.');
  let target = profile;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in target) || typeof target[part] !== 'object' || target[part] === null) {
      target[part] = {};
    }
    target = target[part];
  }

  const lastPart = parts[parts.length - 1];
  target[lastPart] = value;

  fs.writeFileSync(CURRENT_FILE, JSON.stringify(profile, null, 2) + '\n');
  context.output.print({ key: key, value: value });
}
```

The code for the dot-notation walk is identical to what `config/set.js` uses. If you find yourself copying this exact block, that is a sign it could be extracted into a shared helper in `src/lib/` later. But for now, keep it inline in each command so the stories stay self-contained and each file is easy to understand on its own.

### machine/list.js

#### Step 1: Fill in the meta object

```javascript
const meta = {
  description: 'List all known machine profiles.',
  arguments: [],
  flags: []
};
```

#### Step 2: Read the machines directory

Look at every `.json` file in `~/.devutils/machines/`. Right now there will only be `current.json`, but the code should handle multiple files for when backup/sync adds more.

```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');

async function run(args, context) {
  const MACHINES_DIR = path.join(os.homedir(), '.devutils', 'machines');

  if (!fs.existsSync(MACHINES_DIR)) {
    return context.errors.exit('No machine profiles found. Run "dev machine detect" first.', { code: 1 });
  }

  const files = fs.readdirSync(MACHINES_DIR).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    return context.errors.exit('No machine profiles found. Run "dev machine detect" first.', { code: 1 });
  }
```

#### Step 3: Load each profile and build a summary

Read each JSON file and pull out the key fields for a summary view. Mark which one is the current machine.

```javascript
  const machines = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(MACHINES_DIR, file), 'utf8');
      const profile = JSON.parse(raw);

      machines.push({
        file: file,
        current: file === 'current.json',
        hostname: profile.hostname || 'unknown',
        os: profile.os ? `${profile.os.name} ${profile.os.version}` : 'unknown',
        arch: profile.arch || 'unknown',
        detectedAt: profile.detectedAt || 'unknown'
      });
    } catch (err) {
      // Skip files that can't be parsed
      machines.push({
        file: file,
        current: file === 'current.json',
        hostname: 'error',
        os: `Failed to read: ${err.message}`,
        arch: 'unknown',
        detectedAt: 'unknown'
      });
    }
  }
```

#### Step 4: Output the list

```javascript
  context.output.print(machines);
}
```

The output module will format this as a table, JSON array, or whatever the current format is.

## Files to Create or Modify

- `src/commands/machine/set.js` — Replace the stub with the full implementation
- `src/commands/machine/list.js` — Replace the stub with the full implementation

## Acceptance Criteria

- [ ] `dev machine set nickname "my-laptop"` adds a `nickname` field to `current.json`
- [ ] `dev machine set os.customNote "Upgraded from Ventura"` sets a nested value inside the existing `os` object
- [ ] `dev machine set tags --json '["dev","primary"]'` sets an array value
- [ ] `dev machine set` (no key) prints a clear error about the missing argument
- [ ] `dev machine set nickname` (no value and no --json) prints a clear error about the missing value
- [ ] `dev machine set` on a machine with no `current.json` tells the user to run `dev machine detect`
- [ ] Setting a value preserves all other existing fields in `current.json`
- [ ] `dev machine list` shows at least one entry: the current machine
- [ ] The list output includes hostname, OS summary, architecture, and detection timestamp
- [ ] The current machine is marked in the list output
- [ ] `dev machine list` on a machine with no `machines/` directory prints a clear error
- [ ] Both commands respect the `--format` global flag
- [ ] Both commands are idempotent — `set` with the same key/value twice produces the same file

## Testing

```bash
# Make sure a machine profile exists
dev machine detect

# Set a simple value
dev machine set nickname "my-laptop"
dev machine show --format json | grep nickname
# Expected: "nickname": "my-laptop"

# Set a nested value
dev machine set os.notes "Fresh install"
dev machine show --format json | grep notes
# Expected: "notes": "Fresh install" inside the os object

# Set a structured value
dev machine set tags --json '["dev", "primary"]'
dev machine show --format json | grep tags
# Expected: "tags": ["dev", "primary"]

# Verify existing fields were not removed
dev machine show --format json | grep hostname
# Expected: Still has the hostname from detect

# Error cases
dev machine set
# Expected: Error about missing key

dev machine set nickname
# Expected: Error about missing value

# List machines
dev machine list
# Expected: One entry showing current machine with hostname, OS, arch, timestamp

dev machine list --format json
# Expected: JSON array with one machine object

# Test list with no machines directory
rm -rf ~/.devutils/machines
dev machine list
# Expected: Error — "No machine profiles found. Run dev machine detect first."
```

## Notes

- The dot-notation set logic is duplicated between `config/set.js` and `machine/set.js`. This is intentional for now. Both stories are self-contained, and a junior developer can understand each file without jumping between shared helpers. If a third command needs the same logic, that is the right time to extract it into a shared utility in `src/lib/`.
- The `machine list` command reads from the local `~/.devutils/machines/` directory, not from any remote backup. When the backup/sync system is built, this command will be extended to also show machines from the backup storage. The structure is ready for that — the `current` field in the output marks which machine is local.
- Do not sort the machine list by hostname or any other field. Just list them in the order `fs.readdirSync` returns them. Sorting can be added later if it matters.
- When `set` creates intermediate objects for a new deep key, it follows the same rules as `config set`: only creates plain objects, not arrays. Use `--json` for arrays.
- Corrupted JSON files in the `machines/` directory should not crash the `list` command. The try/catch around file reading handles this — corrupted files show up as error entries in the list so the user knows something is wrong.
