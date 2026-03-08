# Command Structure Research

> **Terminology:** This document covers **Commands** — the `dev <action> [subcommand]` CLI structure. Commands are implemented in `src/commands/`. For standalone global utilities (Scripts), see [SCRIPTS_REFERENCE.md](./SCRIPTS_REFERENCE.md).

## Goal

Research and document how to build a Node.js CLI with hierarchical subcommand structure and shell tab completion, similar to the AWS CLI.

## Research Questions

### 1. Hierarchical Subcommand Structure

**Objective**: Implement a command structure like:
```
dev <section> <command> [options]
```

**Examples**:
```bash
dev configure          # Configure developer profile
dev install vscode     # Install VS Code
dev identity add       # Add a new identity profile
dev identity link      # Link identity to a source folder
dev ignore node        # Append Node.js patterns to .gitignore
```

**Questions to Answer**:
- How do we structure this inside an npm package so it's available as a global command named `dev`?
- What's the best pattern for organizing nested subcommands in Node.js?
- Which CLI framework(s) support this pattern natively (Commander.js, Yargs, oclif, etc.)?
- How should the file/folder structure map to the command hierarchy?

### 2. Tab Completion Support

**Objective**: Enable shell tab completion so users can discover commands interactively.

**Example Behavior**:
```bash
$ dev <TAB>
configure  identity  ignore  install  status

$ dev install <TAB>
claude-code  docker  node  vscode  zim

$ dev identity <TAB>
add  link  remove

$ dev ignore <TAB>
node  python  rust  go  java  macos  windows  linux
```

**Questions to Answer**:
- Is it possible to implement tab completion for a Node.js CLI?
- How does AWS CLI (and similar tools) detect and respond to the TAB key?
- What shell integration is required (bash, zsh, fish, PowerShell)?
- Can completion be dynamic (context-aware based on prior arguments)?
- What are the tradeoffs between different approaches?

## Success Criteria

- [x] Document how to register `dev` as a global command via npm
- [x] Identify the recommended CLI framework for hierarchical commands
- [x] Determine if tab completion is possible in Node.js
- [x] If possible, document the implementation approach for tab completion
- [x] Provide code examples or references for both features

---

## Research Findings

### Answer 1: Registering `dev` as a Global Command

**Yes, this is straightforward using npm's `bin` field.**

#### How It Works

The `package.json` `bin` field maps command names to executable files. When installed globally (`npm install -g`), npm creates symlinks in the system PATH.

#### Implementation

**package.json:**
```json
{
  "name": "@fredlackey/devutils",
  "version": "1.0.0",
  "bin": {
    "dev": "./bin/dev.js"
  }
}
```

**bin/dev.js** (must include shebang):
```javascript
#!/usr/bin/env node

// CLI entry point
const { program } = require('commander');
// ... rest of CLI code
```

#### Key Requirements

1. **Shebang line**: The entry file MUST start with `#!/usr/bin/env node`
2. **File permissions**: On Unix, ensure the file is executable (`chmod +x bin/dev.js`)
3. **Testing locally**: Use `npm link` to test before publishing

#### Installation Paths

| Platform | Global Install Location |
|----------|------------------------|
| macOS/Linux | `/usr/local/bin/dev` (symlink) |
| Windows | `C:\Users\<User>\AppData\Roaming\npm\dev.cmd` |

**Sources:**
- [npm package.json docs](https://docs.npmjs.com/cli/v9/configuring-npm/package-json/)
- [Understanding NPM bin field](https://codingshower.com/understanding-npm-package-json-bin-field/)

---

### Answer 2: Recommended CLI Framework

**Recommendation: Commander.js** for this project's needs.

#### Framework Comparison

| Framework | Weekly Downloads | Best For | Complexity |
|-----------|-----------------|----------|------------|
| **Commander.js** | ~238M | Hierarchical CLIs (like git, npm) | Low |
| **Yargs** | ~138M | Complex validation, option-heavy CLIs | Medium |
| **oclif** | ~2M | Enterprise CLIs with plugins | High |

#### Why Commander.js?

1. **Designed for hierarchical commands** - Models CLI as a tree of commands
2. **Lightweight** - Minimal dependencies, fast startup
3. **Intuitive API** - Declarative syntax matching our use case
4. **Mature & popular** - 27k+ GitHub stars, battle-tested

#### Commander.js Nested Subcommand Patterns

**Pattern 1: Inline Nested Commands (Recommended for smaller CLIs)**

```javascript
#!/usr/bin/env node
const { program } = require('commander');

// Top-level commands
program
  .command('configure')
  .description('Configure developer profile')
  .action(() => { /* ... */ });

program
  .command('status')
  .description('Show current configuration')
  .action(() => { /* ... */ });

// Nested: dev identity <action>
const identity = program
  .command('identity')
  .description('Manage identity profiles');

identity
  .command('add')
  .description('Add a new identity profile')
  .action(() => { /* ... */ });

identity
  .command('remove')
  .description('Remove an identity profile')
  .action(() => { /* ... */ });

identity
  .command('link')
  .description('Link identity to a source folder')
  .action(() => { /* ... */ });

program.parse(process.argv);
```

**Pattern 2: Separate Executable Files (For larger CLIs)**

File structure:
```
bin/
  dev           # Main entry
  dev-identity  # Handles 'dev identity' subcommands
  dev-install   # Handles 'dev install' subcommands
```

**bin/dev:**
```javascript
#!/usr/bin/env node
const { program } = require('commander');

program
  .command('configure', 'Configure developer profile')
  .command('identity', 'Manage identity profiles')  // Delegates to dev-identity
  .command('install', 'Install a dev tool');        // Delegates to dev-install

program.parse(process.argv);
```

When `.command()` is called with a description (2nd argument), Commander looks for a separate executable named `<program>-<command>`.

**Pattern 3: Using `.addCommand()` for Modular Code**

```javascript
// commands/identity.js
const { Command } = require('commander');

const identity = new Command('identity')
  .description('Manage identity profiles');

identity.command('add')
  .description('Add a new identity profile')
  .action(() => { /* ... */ });

identity.command('remove')
  .description('Remove an identity profile')
  .action(() => { /* ... */ });

identity.command('link')
  .description('Link identity to a source folder')
  .action(() => { /* ... */ });

module.exports = identity;

// bin/dev.js
const { program } = require('commander');
const identityCommand = require('../commands/identity');

program.addCommand(identityCommand);
program.parse(process.argv);
```

#### Alternative: Yargs with commandDir

Yargs offers automatic command discovery from directory structure:

```javascript
// cli.js
const yargs = require('yargs');

yargs
  .commandDir('commands')
  .demandCommand()
  .help()
  .argv;
```

```
commands/
  configure.js
  status.js
  install.js
  install_cmds/
    vscode.js
    claude-code.js
  identity.js
  identity_cmds/
    add.js
    remove.js
    link.js
```

Each command file exports `command`, `describe`, `builder`, and `handler`.

**Sources:**
- [Commander.js nested subcommands](https://maxschmitt.me/posts/nested-subcommands-commander-node-js)
- [Commander.js official examples](https://github.com/tj/commander.js/blob/HEAD/examples/nestedCommands.js)
- [Yargs advanced docs](https://github.com/yargs/yargs/blob/main/docs/advanced.md)

---

### Answer 3: Tab Completion - Is It Possible?

**Yes, tab completion is absolutely possible in Node.js CLIs.**

#### How Shell Tab Completion Works

When you press TAB in a shell, the shell doesn't call your program directly in the normal way. Instead:

1. Shell checks its "completion registry" for your command
2. If registered, shell sets special environment variables:
   - `COMP_LINE` - The entire command line typed so far
   - `COMP_WORDS` - Array of words on the command line
   - `COMP_CWORD` - Index of the word being completed
   - `COMP_POINT` - Cursor position
3. Shell invokes the registered completion function/script
4. Function returns possible completions via `COMPREPLY` array
5. Shell displays the options to the user

#### Node.js Completion Libraries

| Library | Shells Supported | Maintenance | Approach |
|---------|-----------------|-------------|----------|
| **tabtab** | Bash, Zsh, Fish | Active (pnpm fork) | Event-based |
| **omelette** | Bash, Zsh, Fish | Active | Template literals |
| **@oclif/plugin-autocomplete** | Bash, Zsh | Active | Plugin for oclif |

#### Recommended: tabtab (or @pnpm/tabtab)

**Installation:**
```bash
npm install tabtab
# or the pnpm fork with additional features
npm install @pnpm/tabtab
```

**Implementation requires two steps:**

**Step 1: Installation (one-time setup by user)**

```javascript
// In your CLI, add a command like: dev completion install
const tabtab = require('tabtab');

async function installCompletion() {
  await tabtab.install({
    name: 'dev',
    completer: 'dev'  // The command to run for completions
  });
  console.log('Completion installed! Restart your shell.');
}
```

This adds a line to the user's `~/.bashrc`, `~/.zshrc`, or `~/.config/fish/config.fish`.

**Step 2: Completion Handler (runs on every TAB)**

```javascript
const tabtab = require('tabtab');

// Check if we're being invoked for completion
if (process.argv.includes('--get-yargs-completions') ||
    process.env.COMP_LINE) {

  const env = tabtab.parseEnv(process.env);

  // env.prev - previous word
  // env.line - full command line
  // env.words - number of words
  // env.lastPartial - partial word being completed

  if (env.prev === 'dev') {
    // Completing first subcommand
    return tabtab.log(['configure', 'identity', 'install', 'status']);
  }

  if (env.prev === 'install') {
    // Completing install target
    return tabtab.log(['claude-code', 'docker', 'node', 'vscode', 'zim']);
  }

  if (env.prev === 'identity') {
    // Completing identity action
    return tabtab.log(['add', 'link', 'remove']);
  }

  // Default: show all top-level commands
  return tabtab.log(['configure', 'identity', 'install', 'status']);
}

// Normal CLI execution continues here...
```

**With descriptions (Zsh/Fish only):**
```javascript
tabtab.log([
  { name: 'configure', description: 'Configure developer profile' },
  { name: 'identity', description: 'Manage identity profiles' },
  { name: 'install', description: 'Install development tools' },
  { name: 'status', description: 'Show current configuration' }
]);
```

#### Alternative: Omelette (Simpler API)

```javascript
const omelette = require('omelette');

const completion = omelette('dev <command> [subcommand]');

completion.on('command', ({ reply }) => {
  reply(['configure', 'identity', 'install', 'status']);
});

completion.on('subcommand', ({ before, reply }) => {
  if (before === 'install') {
    reply(['claude-code', 'docker', 'node', 'vscode', 'zim']);
  } else if (before === 'identity') {
    reply(['add', 'link', 'remove']);
  }
});

completion.init();

// Check if we need to set up shell integration
if (process.argv.includes('--setup-completion')) {
  completion.setupShellInitFile();
}
```

#### For oclif Users

If using oclif framework, use the official plugin:

```bash
npm install @oclif/plugin-autocomplete
```

Then users run:
```bash
dev autocomplete bash  # or zsh
```

**Sources:**
- [tabtab GitHub](https://github.com/mklabs/tabtab)
- [@pnpm/tabtab](https://github.com/pnpm/tabtab)
- [omelette GitHub](https://github.com/f/omelette)
- [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete)

---

### Answer 4: Dynamic/Context-Aware Completion

**Yes, completions can be fully dynamic.**

Since your Node.js program runs on each TAB press, you can:

1. **Read configuration files** to suggest user-specific values
2. **Query APIs** for remote data (async supported)
3. **Inspect the filesystem** for project-specific completions
4. **Parse previous arguments** to narrow down options

**Example: Dynamic completions based on context**

```javascript
const tabtab = require('tabtab');
const fs = require('fs');
const path = require('path');

async function getCompletions(env) {
  const { line, prev } = env;

  // Context-aware: if in a git repo, show different options
  if (prev === 'status') {
    try {
      fs.accessSync('.git');
      return ['--verbose', '--git', '--all'];
    } catch {
      return ['--verbose', '--all'];
    }
  }

  // Dynamic: fetch identities from config file for 'dev identity link'
  if (prev === 'link') {
    const config = JSON.parse(fs.readFileSync('~/.devutils', 'utf8'));
    return Object.keys(config.identities || {});
  }

  return ['configure', 'identity', 'install', 'status'];
}
```

---

## Recommended Implementation for devutils-cli

### Proposed Structure

```
devutils-cli/
├── package.json
├── bin/
│   └── dev.js              # Main entry point with shebang
├── src/
│   ├── cli.js              # Commander.js setup
│   ├── completion.js       # Tab completion logic
│   ├── commands/           # Command implementations (dev <action>)
│   │   ├── configure.js
│   │   ├── status.js
│   │   ├── identity.js
│   │   ├── ignore.js
│   │   └── install.js
│   ├── installs/            # One file per tool (vscode.js, docker.js, etc.)
│   │   ├── vscode.js
│   │   ├── claude-code.js
│   │   └── docker.js
│   ├── scripts/            # Standalone global utilities (afk, clone, etc.)
│   │   └── ...
│   └── utils/              # Internal shared utilities with OS-specific subfolders
│       ├── os.js
│       ├── shell.js
│       ├── macos/
│       ├── ubuntu/
│       └── windows/
└── files/
```

### package.json Configuration

```json
{
  "name": "@fredlackey/devutils",
  "version": "1.0.0",
  "bin": {
    "dev": "./bin/dev.js"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "tabtab": "^3.0.0"
  }
}
```

### Entry Point (bin/dev.js)

```javascript
#!/usr/bin/env node

const tabtab = require('tabtab');

// Handle tab completion before loading the full CLI
if (process.env.COMP_LINE) {
  require('../src/completion').handleCompletion();
  return;
}

// Normal CLI execution
require('../src/cli').run();
```

### CLI Setup (src/cli.js)

```javascript
const { program } = require('commander');
const configureCommand = require('./commands/configure');
const statusCommand = require('./commands/status');
const identityCommand = require('./commands/identity');
const ignoreCommand = require('./commands/ignore');
const installCommand = require('./commands/install');
const { installCompletion, uninstallCompletion } = require('./completion');

function run() {
  program
    .name('dev')
    .description('CLI toolkit for bootstrapping development environments')
    .version('1.0.0');

  // Add all commands
  program.addCommand(configureCommand);
  program.addCommand(statusCommand);
  program.addCommand(identityCommand);
  program.addCommand(ignoreCommand);
  program.addCommand(installCommand);

  // Completion management
  program
    .command('completion')
    .description('Manage shell tab completion')
    .command('install')
    .description('Install tab completion for your shell')
    .action(installCompletion);

  program
    .command('completion')
    .command('uninstall')
    .description('Remove tab completion')
    .action(uninstallCompletion);

  program.parse(process.argv);
}

module.exports = { run };
```

### Completion Handler (src/completion.js)

```javascript
const tabtab = require('tabtab');

const COMMANDS = {
  '': ['configure', 'identity', 'ignore', 'install', 'status', 'completion'],
  'identity': ['add', 'link', 'remove'],
  'ignore': ['node', 'python', 'rust', 'go', 'java', 'macos', 'windows', 'linux'],
  'install': ['claude-code', 'docker', 'node', 'vscode', 'zim'],
  'completion': ['install', 'uninstall']
};

function handleCompletion() {
  const env = tabtab.parseEnv(process.env);
  const completions = COMMANDS[env.prev] || COMMANDS[''];

  tabtab.log(completions.map(cmd => ({
    name: cmd,
    description: getDescription(env.prev, cmd)
  })));
}

function getDescription(parent, cmd) {
  const descriptions = {
    'configure': 'Interactive configuration wizard',
    'status': 'Display current configuration',
    'identity': 'Manage identity profiles',
    'ignore': 'Append patterns to .gitignore',
    'install': 'Install development tools',
    'completion': 'Manage shell completion',
    // ... more descriptions
  };
  return descriptions[cmd] || '';
}

async function installCompletion() {
  try {
    await tabtab.install({
      name: 'dev',
      completer: 'dev'
    });
    console.log('Tab completion installed! Restart your shell or run:');
    console.log('  source ~/.bashrc  # or ~/.zshrc');
  } catch (err) {
    console.error('Failed to install completion:', err.message);
  }
}

async function uninstallCompletion() {
  try {
    await tabtab.uninstall({ name: 'dev' });
    console.log('Tab completion removed.');
  } catch (err) {
    console.error('Failed to uninstall completion:', err.message);
  }
}

module.exports = { handleCompletion, installCompletion, uninstallCompletion };
```

---

## Summary

| Question | Answer |
|----------|--------|
| Can we register `dev` as a global command? | **Yes** - Use `bin` field in package.json |
| Best framework for hierarchical commands? | **Commander.js** - Lightweight, intuitive, designed for this |
| Is tab completion possible? | **Yes** - Using tabtab, omelette, or oclif plugin |
| Can completion be dynamic/context-aware? | **Yes** - Full Node.js runtime available on each TAB |
| Shell support? | Bash, Zsh, Fish (PowerShell requires different approach) |

## Next Steps

1. Set up basic Commander.js CLI structure
2. Implement core commands (configure, status, identity, install)
3. Create platform-agnostic install scripts in `src/installs/`
4. Integrate tabtab for shell completion
5. Test on bash and zsh
6. Document user setup for tab completion in README
