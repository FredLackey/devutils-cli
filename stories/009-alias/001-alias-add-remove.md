# Story 001: Alias Add and Remove

## Goal
Implement the `dev alias add` and `dev alias remove` commands. `add` takes a short name and a command string, writes the mapping to `~/.devutils/aliases.json`, and generates a thin wrapper script in `~/.devutils/bin/`. The wrapper script format depends on the platform -- a shell script with `#!/bin/sh` and `exec dev ... "$@"` on Unix, or a `.cmd` file with `@dev ... %*` on Windows. `remove` deletes the wrapper script and removes the entry from `aliases.json`. Before creating an alias, the command checks for conflicts with existing system commands (using `which`/`where`) and warns the user.

## Prerequisites
- 001-foundation/008 (CLI router -- context object and command dispatch)
- 002-config/001 (config init -- `~/.devutils/` directory and `bin/` subdirectory must exist)

## Background
In v0.0.18, all 83 scripts were registered globally through `package.json` bin mappings. That created collisions with system commands and gave users no control. The rebuild replaces this with opt-in aliases: users decide which shortcuts they want in their PATH.

An alias is just a mapping from a short name (like `gs`) to a full `dev` command (like `dev util run git-status`). When you create an alias, DevUtils writes a tiny wrapper script into `~/.devutils/bin/`. Since the user added `~/.devutils/bin/` to their PATH during `dev config init`, the alias becomes available as a global command immediately.

The `aliases.json` file is the source of truth. It stores all alias definitions as a flat object:

```json
{
  "gs": "dev util run git-status",
  "clone": "dev util run clone",
  "claude-danger": "dev ai launch claude",
  "ignore-node": "dev ignore add node"
}
```

The wrapper scripts are generated from this file. They are disposable -- `dev alias sync` can regenerate them at any time from `aliases.json`.

Reference: `research/proposed/proposed-command-structure.md` lines 128-181 for how aliases work. `research/proposed/proposed-package-structure.md` lines 482-486 for the bin directory layout.

## Technique

### Step 1: Implement `src/commands/alias/add.js`

Fill in the `meta` object:

```javascript
const meta = {
  description: 'Create a global shorthand command that maps to any dev command.',
  arguments: [
    { name: 'name', required: true, description: 'The alias name (what the user will type)' },
    { name: 'command', required: true, description: 'The full command to run (quoted string)' }
  ],
  flags: [
    { name: 'force', type: 'boolean', description: 'Overwrite an existing alias without prompting' }
  ]
};
```

The `run` function:

1. **Parse arguments.** The first positional arg is the alias name. The second is the command string. The command string may be quoted or may span multiple args if the user forgot quotes.

```javascript
const name = args.positional[0];
const command = args.positional.slice(1).join(' ');

if (!name || !command) {
  context.output.error('Usage: dev alias add <name> "<command>"');
  context.output.error('');
  context.output.error('Examples:');
  context.output.error('  dev alias add gs "dev util run git-status"');
  context.output.error('  dev alias add clone "dev util run clone"');
  context.output.error('  dev alias add claude-danger "dev ai launch claude"');
  return;
}
```

2. **Validate the alias name.** Must be a simple identifier: lowercase letters, numbers, and hyphens. No spaces, no dots, no slashes.

```javascript
if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
  context.output.error('Alias names must be lowercase letters, numbers, and hyphens only.');
  return;
}
```

3. **Check for system command conflicts.** Use `lib/shell.js` to see if the name matches an existing command on the system PATH. If it does, warn the user and ask for confirmation.

```javascript
const shell = require('../../lib/shell');

// Check if this name conflicts with an existing system command
// Exclude our own bin directory from the check
const existingPath = shell.which(name);
const binDir = path.join(os.homedir(), '.devutils', 'bin');

if (existingPath && !existingPath.startsWith(binDir)) {
  context.output.error(`Warning: "${name}" already exists on your system at ${existingPath}`);
  context.output.error('Creating this alias will shadow the existing command.');

  if (!args.flags.force) {
    const proceed = await context.prompt.confirm(
      'Create the alias anyway?',
      { default: false }
    );
    if (!proceed) {
      context.output.print('Cancelled.');
      return;
    }
  }
}
```

4. **Check for existing aliases.** If an alias with this name already exists in `aliases.json`, warn the user. With `--force`, overwrite silently.

```javascript
const aliasesPath = path.join(os.homedir(), '.devutils', 'aliases.json');
let aliases = {};

if (fs.existsSync(aliasesPath)) {
  aliases = JSON.parse(fs.readFileSync(aliasesPath, 'utf8'));
}

if (aliases[name] && !args.flags.force) {
  context.output.error(`Alias "${name}" already exists: ${aliases[name]}`);
  context.output.error('Use --force to overwrite it.');
  return;
}
```

5. **Write the alias to aliases.json.**

```javascript
aliases[name] = command;
fs.writeFileSync(aliasesPath, JSON.stringify(aliases, null, 2) + '\n');
```

6. **Generate the wrapper script.** Detect the platform and write the appropriate script format.

```javascript
const platform = require('../../lib/platform').detect();

function generateWrapper(name, command, binDir, platformType) {
  if (platformType === 'windows') {
    // Windows .cmd file
    const scriptPath = path.join(binDir, name + '.cmd');
    const content = `@${command} %*\r\n`;
    fs.writeFileSync(scriptPath, content);
  } else {
    // Unix shell script (macOS, Linux, Git Bash)
    const scriptPath = path.join(binDir, name);
    const content = `#!/bin/sh\nexec ${command} "$@"\n`;
    fs.writeFileSync(scriptPath, content, { mode: 0o755 });
  }
}

generateWrapper(name, command, binDir, platform.type);
```

The `mode: 0o755` on Unix makes the script executable. On Windows, the `.cmd` extension makes it runnable without needing execute permissions.

7. **Print confirmation.**

```javascript
context.output.print(`Alias "${name}" created.`);
context.output.print(`  ${name} -> ${command}`);
context.output.print('');
context.output.print(`You can now run: ${name}`);
```

### Step 2: Implement `src/commands/alias/remove.js`

Fill in the `meta` object:

```javascript
const meta = {
  description: 'Remove an alias and delete its wrapper script from ~/.devutils/bin/.',
  arguments: [
    { name: 'name', required: true, description: 'The alias name to remove' }
  ],
  flags: [
    { name: 'confirm', type: 'boolean', description: 'Skip the confirmation prompt' }
  ]
};
```

The `run` function:

1. **Validate the name and check it exists.** Read `aliases.json` and confirm the alias is registered.

```javascript
const name = args.positional[0];
if (!name) {
  context.output.error('Usage: dev alias remove <name>');
  return;
}

const aliasesPath = path.join(os.homedir(), '.devutils', 'aliases.json');
let aliases = {};

if (fs.existsSync(aliasesPath)) {
  aliases = JSON.parse(fs.readFileSync(aliasesPath, 'utf8'));
}

if (!aliases[name]) {
  context.output.error(`Alias "${name}" is not registered.`);
  context.output.error('Run "dev alias list" to see all aliases.');
  return;
}
```

2. **Confirm removal.** Unless `--confirm` is set, ask the user.

```javascript
if (!args.flags.confirm) {
  const ok = await context.prompt.confirm(
    `Remove alias "${name}" (${aliases[name]})?`,
    { default: true }
  );
  if (!ok) {
    context.output.print('Cancelled.');
    return;
  }
}
```

3. **Delete the wrapper script.** Check for both Unix (no extension) and Windows (`.cmd`) formats.

```javascript
const binDir = path.join(os.homedir(), '.devutils', 'bin');
const unixPath = path.join(binDir, name);
const windowsPath = path.join(binDir, name + '.cmd');

if (fs.existsSync(unixPath)) {
  fs.unlinkSync(unixPath);
}
if (fs.existsSync(windowsPath)) {
  fs.unlinkSync(windowsPath);
}
```

4. **Remove from aliases.json.**

```javascript
delete aliases[name];
fs.writeFileSync(aliasesPath, JSON.stringify(aliases, null, 2) + '\n');
```

5. **Print confirmation.**

```javascript
context.output.print(`Alias "${name}" removed.`);
```

### Step 3: Extract the wrapper generation into a shared helper

Both `add.js` and the `sync.js` command (next story) need to generate wrapper scripts. Extract `generateWrapper` into a shared module so both can use it. Create a small helper file at `src/commands/alias/helpers.js` or include it in the alias index. Export:

- `generateWrapper(name, command, binDir, platformType)` -- writes the wrapper script
- `deleteWrapper(name, binDir)` -- removes both Unix and Windows wrapper files
- `loadAliases()` -- reads and parses `aliases.json`, returns `{}` if missing
- `saveAliases(aliases)` -- writes `aliases.json`

This avoids duplicating the logic in multiple files.

## Files to Create or Modify
- `src/commands/alias/add.js` -- Replace the stub with the full implementation
- `src/commands/alias/remove.js` -- Replace the stub with the full implementation
- `src/commands/alias/helpers.js` -- New shared helper for alias operations (optional but recommended)

## Acceptance Criteria
- [ ] `dev alias add gs "dev util run git-status"` creates `~/.devutils/bin/gs` and adds the entry to `aliases.json`
- [ ] On Unix, the generated wrapper is a shell script with `#!/bin/sh` and `exec dev util run git-status "$@"`
- [ ] On Windows, the generated wrapper is a `.cmd` file with `@dev util run git-status %*`
- [ ] The generated wrapper script is executable on Unix (mode 755)
- [ ] `dev alias add` warns if the name conflicts with an existing system command
- [ ] `dev alias add --force` overwrites an existing alias without prompting
- [ ] `dev alias add` rejects invalid names (uppercase, spaces, dots)
- [ ] `dev alias remove gs` deletes the wrapper script and removes the entry from `aliases.json`
- [ ] `dev alias remove` asks for confirmation in interactive mode
- [ ] `dev alias remove --confirm` skips the confirmation prompt
- [ ] `dev alias remove nonexistent` prints a clear error
- [ ] `aliases.json` is valid JSON after every add and remove operation
- [ ] Running the generated alias script actually invokes the mapped command

## Testing

```bash
# Create an alias
dev alias add gs "dev util run git-status"
# Expected: Alias "gs" created.

# Verify the wrapper was generated
cat ~/.devutils/bin/gs
# Expected on Unix:
# #!/bin/sh
# exec dev util run git-status "$@"

# Verify aliases.json was updated
cat ~/.devutils/aliases.json
# Expected: { "gs": "dev util run git-status" }

# Run the alias (requires ~/.devutils/bin in PATH)
gs
# Expected: Same output as dev util run git-status

# Try creating an alias that conflicts with a system command
dev alias add ls "dev util run something"
# Expected: Warning that ls already exists at /bin/ls

# Remove an alias
dev alias remove gs --confirm
# Expected: Alias "gs" removed.

# Verify the wrapper was deleted
ls ~/.devutils/bin/gs
# Expected: No such file

# Verify aliases.json was updated
cat ~/.devutils/aliases.json
# Expected: {} (empty object, or missing the gs entry)

# Try removing a non-existent alias
dev alias remove nonexistent
# Expected: Error -- not registered

# Test invalid name
dev alias add "My Alias" "dev status"
# Expected: Error about invalid name format
```

## Notes
- The wrapper script uses `exec` on Unix. This replaces the shell process with the `dev` process, so there is no leftover shell process consuming resources. It is a common pattern for wrapper scripts.
- The `"$@"` in the Unix script and `%*` in the Windows script forward all arguments from the user to the underlying command. If someone types `gs ~/Source`, the `~/Source` part gets passed through to `dev util run git-status ~/Source`.
- The system command conflict check uses `shell.which(name)`. This finds binaries on the PATH. But it will also find our own wrapper scripts in `~/.devutils/bin/` if that directory is already on the PATH. The check excludes matches inside the `~/.devutils/bin/` directory so that re-creating an existing alias does not count as a conflict with itself.
- `aliases.json` starts as an empty object `{}`. The file is created by `dev config init` (or by the first `alias add` if it does not exist yet). Make sure `add.js` creates the file if it is missing.
- On Windows, the `.cmd` extension is required for the file to be runnable from the command prompt. Git Bash can run files without extensions (like Unix), but it also recognizes `.cmd` files. For Git Bash users, generate both formats to be safe -- or just the Unix format since Git Bash handles it. For now, use the platform detection: `gitbash` generates Unix scripts, `windows` generates `.cmd` files.
