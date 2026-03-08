# Story 006: Config Manager

## Goal
Build the module that manages the `~/.devutils/` directory and all the JSON config files inside it. This is where user preferences, aliases, plugin registrations, and sync timestamps live. Every command that needs to read or write user configuration goes through this module. It handles creating the directory, reading files, writing files, and checking if files exist -- all in one consistent place.

## Prerequisites
- None. This is a standalone module with no dependencies on other foundation stories.

## Background
DevUtils stores all user data in `~/.devutils/`. This directory gets created during first-run onboarding (`dev config init`) but the config module needs to handle the case where it doesn't exist yet. The directory contains several JSON files:

- `config.json` - User preferences (name, email, defaults)
- `aliases.json` - Registered alias mappings
- `ai.json` - AI tool configurations
- `plugins.json` - Installed API plugin registry
- `sync.json` - Last backup sync timestamp and remote location

The config module doesn't know the schema of these files. It's a generic JSON file manager for a specific directory. The schema enforcement happens in the command files that use config.js (like `dev config init` or `dev config set`).

Reference: `research/proposed/proposed-package-structure.md` lines 403-405 and 449-490.

## Technique

### Step 1: Define the config directory path

```javascript
const os = require('os');
const path = require('path');
const fs = require('fs');

const CONFIG_DIR = path.join(os.homedir(), '.devutils');
```

Use `os.homedir()` to get the home directory. This works on all platforms:
- macOS: `/Users/username`
- Linux: `/home/username`
- Windows: `C:\Users\username`

### Step 2: Implement `ensureDir()`

Creates the `~/.devutils/` directory if it doesn't exist. Must be idempotent -- calling it 10 times in a row should have the same effect as calling it once.

```javascript
function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  return CONFIG_DIR;
}
```

The `{ recursive: true }` option means `mkdirSync` won't throw if the directory already exists, and it will create parent directories if needed. But we still check with `existsSync` first to make the intent clear -- this is an idempotent operation.

Returns the directory path so callers can chain: `const dir = config.ensureDir()`.

### Step 3: Implement `getPath(filename)`

Returns the full path to a file inside `~/.devutils/`. Does not check if the file exists.

```javascript
function getPath(filename) {
  return path.join(CONFIG_DIR, filename);
}
```

Simple but useful. Commands that need to pass a file path to other modules (like shell.js) use this instead of constructing the path themselves.

### Step 4: Implement `exists(filename)`

Checks if a file exists in `~/.devutils/`.

```javascript
function exists(filename) {
  return fs.existsSync(getPath(filename));
}
```

### Step 5: Implement `read(filename)`

Reads a JSON file from `~/.devutils/` and returns the parsed object. Returns `null` if the file doesn't exist or can't be parsed.

```javascript
function read(filename) {
  const filePath = getPath(filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}
```

Key decisions:
- Returns `null` on failure, not `undefined` or an empty object. This lets callers distinguish between "file doesn't exist" and "file exists but is empty" (which would parse as whatever the file contains).
- Catches JSON parse errors silently. If the user manually edited a config file and broke the JSON, we return `null` rather than crashing. The calling command can then decide whether to show an error, offer to reset, etc.
- Uses `'utf8'` encoding explicitly.

### Step 6: Implement `write(filename, data)`

Writes a JavaScript object to a JSON file in `~/.devutils/`. Creates the directory if it doesn't exist.

```javascript
function write(filename, data) {
  ensureDir();
  const filePath = getPath(filename);
  const content = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}
```

Key decisions:
- Calls `ensureDir()` first. This means any write operation is safe even if the directory hasn't been created yet. Idempotent.
- Uses 2-space indentation for pretty JSON. Config files should be human-readable because users will sometimes open them in an editor.
- Adds a trailing newline. This is a convention for text files -- many editors and diff tools expect it.
- Returns the file path so callers can confirm or log where the file was written.

### Step 7: Implement `remove(filename)`

Deletes a file from `~/.devutils/`. Idempotent -- doesn't throw if the file doesn't exist.

```javascript
function remove(filename) {
  const filePath = getPath(filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  return filePath;
}
```

### Step 8: Implement `list()`

Lists all files in `~/.devutils/`. Returns an array of filenames (not full paths). Returns an empty array if the directory doesn't exist.

```javascript
function list() {
  if (!fs.existsSync(CONFIG_DIR)) {
    return [];
  }
  return fs.readdirSync(CONFIG_DIR).filter(entry => {
    const fullPath = path.join(CONFIG_DIR, entry);
    return fs.statSync(fullPath).isFile();
  });
}
```

Only returns files, not subdirectories. The `~/.devutils/` directory has subdirectories like `plugins/`, `auth/`, `utils/`, and `bin/`, but `list()` is for config files specifically.

### Step 9: Exports

```javascript
module.exports = {
  CONFIG_DIR,
  ensureDir,
  getPath,
  exists,
  read,
  write,
  remove,
  list
};
```

Export `CONFIG_DIR` as a constant so other modules can reference it without importing `os` and `path` themselves.

## Files to Create or Modify
- `src/lib/config.js` - All config management functions

## Acceptance Criteria
- [ ] `CONFIG_DIR` is `~/.devutils/` (using the correct home directory for the platform)
- [ ] `ensureDir()` creates `~/.devutils/` if it doesn't exist
- [ ] `ensureDir()` is idempotent -- calling it multiple times doesn't error
- [ ] `ensureDir()` returns the directory path
- [ ] `getPath('config.json')` returns the full path `~/.devutils/config.json`
- [ ] `exists('config.json')` returns `true` if the file exists, `false` otherwise
- [ ] `read('config.json')` returns the parsed JSON object
- [ ] `read('nonexistent.json')` returns `null`
- [ ] `read()` returns `null` for files with invalid JSON (doesn't crash)
- [ ] `write('test.json', { foo: 'bar' })` creates the file with pretty-printed JSON
- [ ] `write()` creates the directory if it doesn't exist
- [ ] `write()` returns the file path
- [ ] `remove('test.json')` deletes the file
- [ ] `remove('nonexistent.json')` doesn't throw
- [ ] `list()` returns an array of filenames in `~/.devutils/`
- [ ] `list()` returns only files, not directories
- [ ] `list()` returns an empty array if `~/.devutils/` doesn't exist
- [ ] No external dependencies are added to package.json

## Testing

Run from the project root:

```bash
# Test ensureDir (idempotent)
node -e "
  const c = require('./src/lib/config');
  console.log(c.ensureDir());
  console.log(c.ensureDir());  // second call should not error
"
# Expected: /Users/<you>/.devutils (printed twice, no errors)

# Test getPath
node -e "
  const c = require('./src/lib/config');
  console.log(c.getPath('config.json'));
"
# Expected: /Users/<you>/.devutils/config.json

# Test write and read
node -e "
  const c = require('./src/lib/config');
  c.write('_test_story006.json', { hello: 'world', count: 42 });
  const data = c.read('_test_story006.json');
  console.log(data);
  console.log('hello:', data.hello);
  console.log('count:', data.count);
"
# Expected:
# { hello: 'world', count: 42 }
# hello: world
# count: 42

# Test exists
node -e "
  const c = require('./src/lib/config');
  console.log(c.exists('_test_story006.json'));
  console.log(c.exists('nonexistent_xyz.json'));
"
# Expected:
# true
# false

# Test read nonexistent file
node -e "
  const c = require('./src/lib/config');
  console.log(c.read('does_not_exist_xyz.json'));
"
# Expected: null

# Test list
node -e "
  const c = require('./src/lib/config');
  console.log(c.list());
"
# Expected: array of filenames (includes '_test_story006.json' if previous test ran)

# Test remove
node -e "
  const c = require('./src/lib/config');
  c.remove('_test_story006.json');
  console.log(c.exists('_test_story006.json'));
"
# Expected: false

# Test remove nonexistent (should not throw)
node -e "
  const c = require('./src/lib/config');
  c.remove('nonexistent_xyz.json');
  console.log('did not throw');
"
# Expected: did not throw

# Test CONFIG_DIR constant
node -e "
  const c = require('./src/lib/config');
  console.log(c.CONFIG_DIR);
"
# Expected: /Users/<you>/.devutils
```

## Notes
- The config module is intentionally "dumb." It reads and writes JSON files. It does not validate schemas, enforce required fields, or provide default values. That's the job of the commands that use it (like `dev config init`). Keeping the config module schema-free means it works for any JSON file we add in the future.
- All operations are synchronous. Config files are small (a few KB at most) and are read/written infrequently (typically once per command invocation). There's no performance benefit to making these async, and sync code is much simpler to reason about.
- The `read()` function returns `null` for broken JSON files. This is a deliberate choice. In a CLI tool, crashing because someone hand-edited a config file is a bad experience. The calling command should check for `null` and offer a helpful recovery path (like "Your config file appears to be corrupted. Run `dev config reset` to start fresh.").
- Don't add file locking. DevUtils is a CLI tool that runs one command at a time. There's no concurrent access to worry about.
- The test commands above create and clean up a `_test_story006.json` file in `~/.devutils/`. The underscore prefix makes it obvious it's a test artifact. Clean it up if the remove test doesn't run.
