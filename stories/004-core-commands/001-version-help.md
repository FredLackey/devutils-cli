# Story 001: Implement version and help Commands

## Goal
Implement `src/commands/version.js` and `src/commands/help.js` so users can check what version of DevUtils they have installed and get usage guidance. These are the simplest commands in the system. `version` reads the version string from `package.json` and prints it. `help` shows either a top-level overview of all services or, when given a command path like `dev help config set`, shows the help text for that specific command by reading its `meta` export. Both commands are thin -- they exist mostly to round out the CLI's standard interface.

## Prerequisites
- 001-foundation/008 (CLI router)

## Background
Every CLI tool ships with `--version` and `--help`. In DevUtils, these are also available as standalone commands: `dev version` and `dev help [command...]`. The CLI router (built in story 001-foundation/008) already handles `--version` and `--help` flags at the top level, but these command files are what it delegates to. Both files follow the standard command pattern: export `{ meta, run }`.

The `help` command needs to know about every registered service and its commands. It does this by reading the `index.js` files from each service folder under `src/commands/`. Each `index.js` exports a `name`, `description`, and a `commands` map. That's all `help` needs for the top-level listing. For command-specific help, it loads the target command module and reads its `meta` object (description, arguments, flags).

## Technique

### version.js

1. Open `src/commands/version.js`. The stub already has the `{ meta, run }` skeleton.

2. Fill in the `meta` object:
   ```javascript
   const meta = {
     description: 'Show the current installed version',
     arguments: [],
     flags: []
   };
   ```

3. In the `run` function:
   - Use `require('../../package.json')` to load the project's `package.json`. This works because `version.js` lives at `src/commands/version.js`, so `../../package.json` resolves to the repo root.
   - Pull out the `version` property.
   - Use `context.output` to format and print it. For human-friendly output, print the version string by itself (e.g., `0.0.19`). For JSON output, return `{ version: '0.0.19' }`.

4. Watch out: `require()` caches the module, so this will always return the version from the installed package. That's correct behavior -- the user wants to know what they have installed, not what's in some working directory.

### help.js

1. Open `src/commands/help.js`.

2. Fill in the `meta` object:
   ```javascript
   const meta = {
     description: 'Show usage information',
     arguments: [
       { name: 'command', description: 'Command path to get help for (e.g., config set)', required: false, variadic: true }
     ],
     flags: []
   };
   ```

3. Create a helper function that builds the service registry. It needs to find all service `index.js` files and the top-level command files. Here is the approach:
   - Define an array of known service names: `['config', 'machine', 'identity', 'tools', 'ignore', 'util', 'alias', 'auth', 'api', 'ai', 'search']`.
   - For each service name, `require` its `index.js` (e.g., `require('./config/index')`) and grab the `name` and `description`.
   - Also include the top-level commands: `status`, `update`, `version`, `schema`, `help`. These don't have service folders, so list them with hardcoded descriptions.

4. When `run` is called with no arguments (bare `dev help`):
   - Build the service list.
   - Output a formatted listing. For human-friendly output, show something like:
     ```
     Usage: dev <service> <command> [arguments] [flags]

     Services:
       config      User configuration and onboarding
       machine     Machine profiles and detection
       identity    Git identities, SSH keys, GPG signing
       ...

     Commands:
       status      Overall health check
       version     Show the current installed version
       help        Show usage information
       ...

     Run "dev help <service>" to see commands within a service.
     Run "dev help <service> <command>" for detailed command help.
     ```
   - For JSON output, return the full structure: `{ services: [...], commands: [...] }`.

5. When `run` is called with arguments (e.g., `dev help config` or `dev help config set`):
   - The first argument is the service or top-level command name.
   - If it matches a service name, load that service's `index.js`.
     - If only the service name was given (e.g., `dev help config`), list all commands in that service with their descriptions (pulled from each command's `meta.description`).
     - If a second argument is given (e.g., `dev help config set`), load that specific command module and display its full `meta`: description, arguments (name, description, required), and flags (name, description, type, default).
   - If the first argument matches a top-level command (e.g., `dev help version`), load that command's `meta` and display it.
   - If nothing matches, use `context.errors` to report an unknown command and suggest running `dev help` to see available options.

6. Keep the help formatting simple. Use `context.output` for all printing. Don't try to build a fancy layout. A clean, readable, left-aligned listing is fine. Remember that this output also needs to work as JSON for AI agents, so always have a structured data object that you pass to the output formatter.

7. Important: don't hardcode service descriptions in `help.js`. Read them from the service `index.js` files. That way, if a description changes, `help` automatically picks it up.

## Files to Create or Modify
- `src/commands/version.js` (modify existing stub)
- `src/commands/help.js` (modify existing stub)

## Acceptance Criteria
- [ ] `dev version` prints the version from `package.json` (e.g., `0.0.19`)
- [ ] `dev version --format json` outputs `{ "version": "0.0.19" }`
- [ ] `dev help` (no arguments) lists all services with descriptions and all top-level commands
- [ ] `dev help config` lists all commands in the config service with descriptions
- [ ] `dev help config set` shows full help for `config set` including arguments and flags
- [ ] `dev help nonexistent` shows an error message and suggests running `dev help`
- [ ] Both commands export `{ meta, run }`
- [ ] The `meta` objects have accurate descriptions, arguments, and flags
- [ ] Both commands respect the `--format` flag passed through `context`

## Testing
```bash
# Version
dev version
# Expected: 0.0.19

dev version --format json
# Expected: { "version": "0.0.19" }

# Help - bare
dev help
# Expected: List of services (config, machine, identity, etc.) and top-level commands

# Help - service level
dev help ignore
# Expected: List of ignore commands (add, remove, list, show) with descriptions

# Help - command level
dev help config set
# Expected: Description, arguments (<key>, <value>), and flags for config set

# Help - unknown command
dev help foobar
# Expected: Error message like 'Unknown command "foobar". Run "dev help" to see available commands.'
```

## Notes
- `version.js` is one of the simplest files in the project. If you're new to the codebase, this is a good one to start with to learn the command pattern.
- The `help` command lazy-loads service modules using `require()`. It doesn't load every command's full implementation -- just the `meta` export. The `() => require()` pattern in each service's `index.js` means the actual command code only runs when someone calls that specific command, not when `help` lists it.
- Don't import `commander` or any argument parsing library in these files. Argument parsing is handled by the CLI router. By the time `run()` is called, `args` is already parsed.
- The `context` object passed to `run` contains `output`, `errors`, `config`, `platform`, and `shell` modules. For these two commands, you only need `output` and `errors`.
