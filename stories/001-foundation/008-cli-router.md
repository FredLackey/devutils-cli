# Story 008: CLI Router

## Goal
Build the main entry point for DevUtils: `src/cli.js`. This is the file that runs when someone types `dev` in their terminal. It parses the command line arguments, figures out which service and method the user wants, loads the right command file, builds a context object with all the foundation modules, and calls the command's `run()` function. It's the glue that connects everything from Stories 001-007 into a working CLI tool.

## Prerequisites
- Story 001: Platform Detection
- Story 002: Shell Utilities
- Story 003: Output Detection
- Story 004: Output Formatting
- Story 005: Error Handling
- Story 006: Config Manager
- Story 007: Interactive Prompts

All seven foundation stories must be completed before this one. The router depends on every foundation module.

## Background
The DevUtils CLI follows the pattern `dev <service> [resource] <method> [arguments] [flags]`. For example:

- `dev tools install node` -- service=tools, method=install, argument=node
- `dev config show` -- service=config, method=show
- `dev api gmail messages list` -- service=api, resource=gmail, more routing follows
- `dev status` -- top-level command (no service/method split)

The router's job is pure dispatching. It figures out where to send the command, builds the context, and gets out of the way. It does not contain business logic. Think of it as a receptionist: it greets you, figures out who you need to talk to, and walks you to the right office.

Service commands live in `src/commands/<service>/index.js`. Each index file registers the service's methods. Top-level commands (status, version, help, update, schema) live directly in `src/commands/` as single files.

Reference: `research/proposed/proposed-package-structure.md` lines 36-52 and `research/proposed/proposed-command-structure.md`.

## Technique

### Step 1: Keep the shebang and add strict mode

The file already has `#!/usr/bin/env node` at the top. Keep it. Add `'use strict';` on the next line. The shebang tells the OS to run this file with Node.js when it's executed directly.

### Step 2: Parse arguments manually (no commander.js for now)

The `package.json` lists `commander` as a dependency, but for the initial router, we'll parse args manually. This gives us full control over the routing logic and avoids coupling the router to a third-party library's API. We can add commander later if the argument parsing gets complex enough to justify it.

```javascript
const args = process.argv.slice(2);
```

`process.argv[0]` is the node binary, `process.argv[1]` is the script path. Everything from index 2 onward is what the user typed.

### Step 3: Extract global flags

Before routing, pull out the global flags. These can appear anywhere in the argument list:

```javascript
function parseGlobalFlags(args) {
  const flags = {
    format: null,     // --format <value> or --json (shorthand for --format json)
    dryRun: false,    // --dry-run
    verbose: false,   // --verbose
    quiet: false,     // --quiet
    help: false,      // --help or -h
    version: false,   // --version or -v
    jsonInput: null,  // --json <data>
  };

  const remaining = [];
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    if (arg === '--format' && i + 1 < args.length) {
      flags.format = args[i + 1];
      i += 2;
    } else if (arg === '--dry-run') {
      flags.dryRun = true;
      i++;
    } else if (arg === '--verbose') {
      flags.verbose = true;
      i++;
    } else if (arg === '--quiet') {
      flags.quiet = true;
      i++;
    } else if (arg === '--help' || arg === '-h') {
      flags.help = true;
      i++;
    } else if (arg === '--version' || arg === '-v') {
      flags.version = true;
      i++;
    } else if (arg === '--json' && i + 1 < args.length) {
      flags.jsonInput = args[i + 1];
      i += 2;
    } else {
      remaining.push(arg);
      i++;
    }
  }

  return { flags, remaining };
}
```

The `remaining` array is the arguments with global flags stripped out. This is what gets passed to the command.

### Step 4: Handle top-level commands

Some commands don't follow the service/method pattern. Handle these first:

```javascript
const TOP_LEVEL_COMMANDS = ['status', 'update', 'version', 'schema', 'help'];
```

If the first remaining argument is one of these, load the command directly from `src/commands/<name>.js`.

Also handle the `--version` and `--help` flags at this level:

```javascript
if (flags.version || (remaining.length > 0 && remaining[0] === 'version')) {
  const pkg = require('../package.json');
  console.log(pkg.version);
  process.exit(0);
}

if (flags.help || remaining.length === 0) {
  showHelp();
  process.exit(0);
}
```

When no arguments are given (`dev` with nothing else), show help.

### Step 5: Write the `showHelp()` function

A simple help display. List available services and top-level commands.

```javascript
function showHelp() {
  const pkg = require('../package.json');
  console.log(`DevUtils CLI v${pkg.version}`);
  console.log('');
  console.log('Usage: dev <service> <method> [arguments] [flags]');
  console.log('');
  console.log('Services:');
  console.log('  config      User configuration and onboarding');
  console.log('  machine     Machine profiles and detection');
  console.log('  identity    Git identities, SSH keys, GPG signing');
  console.log('  tools       Tool installation and management');
  console.log('  ignore      .gitignore pattern management');
  console.log('  util        Utility functions');
  console.log('  alias       Shorthand bin entries');
  console.log('  auth        OAuth and credential management');
  console.log('  api         API plugin system');
  console.log('  ai          AI coding assistant launcher');
  console.log('  search      Markdown search');
  console.log('');
  console.log('Commands:');
  console.log('  status      Overall health check');
  console.log('  version     Show current version');
  console.log('  help        Show this help message');
  console.log('');
  console.log('Global Flags:');
  console.log('  --format <json|table|yaml|csv>  Output format');
  console.log('  --dry-run                       Show what would happen');
  console.log('  --verbose                       Increase output detail');
  console.log('  --quiet                         Suppress non-essential output');
  console.log('  --json <data>                   Pass structured input as JSON');
  console.log('  --help, -h                      Show help');
  console.log('  --version, -v                   Show version');
}
```

### Step 6: Parse remaining arguments into a structured object

After global flags are stripped and the service/method are identified, the leftover arguments need to be parsed into a structured object that commands can work with easily. Many command stories access `args.positional` and `args.flags` instead of working with a raw array.

```javascript
function parseCommandArgs(rawArgs) {
  const positional = [];
  const flags = {};
  let i = 0;

  while (i < rawArgs.length) {
    const arg = rawArgs[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);  // strip the '--' prefix

      // Check if next arg exists and is not itself a flag
      if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('--')) {
        flags[key] = rawArgs[i + 1];
        i += 2;
      } else {
        // Boolean flag (no value follows)
        flags[key] = true;
        i++;
      }
    } else {
      positional.push(arg);
      i++;
    }
  }

  return { positional, flags };
}
```

The parsing logic:
- Anything starting with `--` goes into `flags`. Strip the `--` prefix to get the key.
- If the next argument exists and doesn't start with `--`, it's the flag's value (`--flag value` form).
- If the next argument is missing or starts with `--`, the flag is boolean (`--flag` form, value is `true`).
- Everything else goes into `positional`.

This structured object is what gets passed to `run(args, context)`. Commands access it like `args.positional[0]` or `args.flags.name`.

### Step 7: Route to service commands

For service commands, the first remaining argument is the service name and the second is the method:

```javascript
function resolveCommand(remaining) {
  const serviceName = remaining[0];
  const methodName = remaining[1];
  const commandArgs = remaining.slice(2);

  // Check for top-level command first
  if (TOP_LEVEL_COMMANDS.includes(serviceName)) {
    try {
      const cmd = require(`./commands/${serviceName}`);
      return { command: cmd, args: parseCommandArgs(remaining.slice(1)) };
    } catch (err) {
      return null;
    }
  }

  // Try to load the service index
  let service;
  try {
    service = require(`./commands/${serviceName}/index`);
  } catch (err) {
    return null;
  }

  // If no method specified, show service help
  if (!methodName) {
    return { service, command: null, args: parseCommandArgs([]) };
  }

  // Look up the method in the service's commands
  if (!service.commands || !service.commands[methodName]) {
    return { service, command: null, unknownMethod: methodName, args: parseCommandArgs(commandArgs) };
  }

  // Lazy-load the command
  const command = service.commands[methodName]();
  return { command, args: parseCommandArgs(commandArgs), service };
}
```

The service index files use lazy loading (`() => require('./init')`), so calling `service.commands[methodName]()` loads the command file on demand. The `args` returned is now a structured `{ positional, flags }` object instead of a raw array.

### Step 8: Build the context object

Every command's `run(args, context)` function receives a context object. This is how commands access all the foundation modules without importing them directly.

```javascript
function buildContext(flags) {
  const detect = require('./lib/detect');
  const output = require('./lib/output');
  const errors = require('./lib/errors');
  const platform = require('./lib/platform');
  const shell = require('./lib/shell');
  const config = require('./lib/config');
  const prompt = require('./lib/prompt');

  // Determine output format: flag override > detection
  const detected = detect.detectOutputMode();
  const format = flags.format || detected.format;
  const caller = detected.caller;

  // Create pre-configured formatter
  const formatter = output.createFormatter({ format, caller });

  return {
    platform: platform,
    shell,
    config,
    prompt,
    errors,
    output: formatter,
    flags: {
      format,
      caller,
      dryRun: flags.dryRun,
      verbose: flags.verbose,
      quiet: flags.quiet,
      jsonInput: flags.jsonInput ? JSON.parse(flags.jsonInput) : null,
    }
  };
}
```

**Important**: `context.platform` is the full platform module, not just the detection result. This lets commands call `context.platform.detect()` when they need the current platform info, and also access any other helpers the platform module exports. If a command just needs the platform type, it calls `context.platform.detect().type`.

The `context.flags` object includes the global flags `dryRun`, `verbose`, and `quiet` so commands can check them without re-parsing. For example, a command can check `context.flags.dryRun` to decide whether to actually execute a shell command or just print what it would do.

The `--format` flag overrides the auto-detected format. This is where the detection from Story 003 meets the override from the command line.

### Step 9: Wire it all together in a `main()` function

```javascript
async function main() {
  const { flags, remaining } = parseGlobalFlags(process.argv.slice(2));

  // Handle --version
  if (flags.version) {
    const pkg = require('../package.json');
    console.log(pkg.version);
    return;
  }

  // Handle --help or no arguments
  if (flags.help || remaining.length === 0) {
    showHelp();
    return;
  }

  // Resolve the command
  const resolved = resolveCommand(remaining);

  if (!resolved || !resolved.command) {
    const errors = require('./lib/errors');
    if (resolved && resolved.unknownMethod) {
      const methods = Object.keys(resolved.service.commands || {}).join(', ');
      errors.throwError(
        404,
        `Unknown method "${resolved.unknownMethod}" for service "${resolved.service.name}". Available methods: ${methods}`,
        resolved.service.name
      );
    } else if (resolved && resolved.service && !resolved.command) {
      // Service exists but no method given -- show service commands
      const methods = Object.keys(resolved.service.commands || {});
      console.log(`${resolved.service.name}: ${resolved.service.description}`);
      console.log('');
      console.log('Methods:');
      for (const method of methods) {
        console.log(`  dev ${resolved.service.name} ${method}`);
      }
      return;
    } else {
      const serviceName = remaining[0];
      errors.throwError(
        404,
        `Unknown command "${serviceName}". Run "dev help" to see available commands.`,
        'cli'
      );
    }
    return;
  }

  // Build context and run
  const context = buildContext(flags);
  try {
    await resolved.command.run(resolved.args, context);
  } catch (err) {
    const errors = require('./lib/errors');
    if (errors.isDevUtilsError(err)) {
      context.output.err(err);
    } else {
      errors.throwError(500, err.message || 'An unexpected error occurred', 'cli');
    }
  }
}

main();
```

### Step 10: Handle service help (no method given)

When someone types `dev config` without a method, show the available methods for that service. This is handled in the `resolved.service && !resolved.command` branch above. It lists all registered methods so the user knows what's available.

### Step 11: Handle unknown commands with suggestions

When someone types `dev conifg` (typo), the error message should be helpful: "Unknown command 'conifg'. Run 'dev help' to see available commands." You could add fuzzy matching later to suggest "Did you mean 'config'?", but for now a clear error with directions to help is enough.

## Files to Create or Modify
- `src/cli.js` - The complete CLI router

## Acceptance Criteria
- [ ] `dev --version` prints the version from package.json and exits
- [ ] `dev -v` also prints the version
- [ ] `dev --help` prints the help message listing all services and global flags
- [ ] `dev` (no arguments) prints the help message
- [ ] `dev version` prints the version (top-level command)
- [ ] `dev config` (service with no method) lists available methods for the config service
- [ ] `dev <service> <method>` loads the command from `src/commands/<service>/<method>.js` and calls `run()`
- [ ] The `run()` function receives `(args, context)` where `args` is `{ positional: [...], flags: { key: value } }` and context contains platform, shell, config, prompt, errors, output, and flags
- [ ] Remaining arguments after service/method are parsed: `--key value` goes into `args.flags`, everything else into `args.positional`
- [ ] Boolean flags (`--verbose` with no following value) are set to `true` in `args.flags`
- [ ] `context.platform` is the full platform module (not just the detection result), so commands can call `context.platform.detect()`
- [ ] `context.flags` includes global flags: `dryRun`, `verbose`, `quiet`, `format`, `caller`, `jsonInput`
- [ ] `--format` flag overrides the auto-detected output format
- [ ] `--dry-run`, `--verbose`, `--quiet` flags are passed through in `context.flags`
- [ ] `--json <data>` parses the JSON string and makes it available in `context.flags.jsonInput`
- [ ] Unknown service names produce a helpful error message
- [ ] Unknown method names produce a helpful error listing valid methods
- [ ] Global flags can appear anywhere in the argument list (before or after the command)
- [ ] The router does not contain business logic -- it's routing only
- [ ] Unhandled exceptions in commands are caught and formatted as structured errors

## Testing

Since most commands aren't implemented yet (just stubs), focus on testing the routing, flags, and error handling.

```bash
# Test version
node src/cli.js --version
# Expected: 0.0.19

node src/cli.js -v
# Expected: 0.0.19

node src/cli.js version
# Expected: 0.0.19

# Test help
node src/cli.js --help
# Expected: DevUtils CLI v0.0.19 followed by service list and flags

node src/cli.js
# Expected: Same help output (no arguments = show help)

node src/cli.js -h
# Expected: Same help output

# Test service listing (no method given)
node src/cli.js config
# Expected: Lists config service methods (init, show, get, set, reset, export, import)

node src/cli.js tools
# Expected: Lists tools service methods (install, check, list, search)

# Test unknown service
node src/cli.js notaservice
# Expected on stderr: error about unknown command "notaservice"
# Expected exit code: 1

# Test unknown method
node src/cli.js config notamethod
# Expected on stderr: error about unknown method "notamethod" for service "config" with available methods listed
# Expected exit code: 1

# Test global flags are parsed
node src/cli.js --verbose --dry-run config show
# Expected: attempts to run config show (may fail since command is a stub, but the routing should work)

# Test --format flag
node src/cli.js --format yaml config show
# Expected: routes to config show with format set to yaml in context

# Test flags anywhere in args
node src/cli.js config show --verbose
# Expected: same as node src/cli.js --verbose config show

# Verify exit code on unknown command
node src/cli.js badcmd; echo "Exit: $?"
# Expected: Exit: 1

# Test that --format overrides detection
CLAUDECODE=1 node src/cli.js --format table config
# Expected: lists config methods (would be JSON without --format override)

# Test parseCommandArgs (internal function, test via a command that echoes its args)
# When a command receives args, it should see a structured object:
# dev tools install node --global
# → args = { positional: ['node'], flags: { global: true } }
#
# dev identity add --name "work" --email "fred@example.com"
# → args = { positional: [], flags: { name: 'work', email: 'fred@example.com' } }
#
# dev util run myscript --dry-run
# → args = { positional: ['myscript'], flags: { 'dry-run': true } }
#   (note: command-level --dry-run is distinct from global --dry-run which is stripped earlier)

# Test context.platform is the full module (not just detection result)
# A command should be able to call context.platform.detect() rather than context.platform.type
```

## Notes
- The router uses `require()` with template strings for dynamic loading (`require(\`./commands/${serviceName}/index\`)` ). This is a common pattern in Node.js CLI tools. It's fine for this use case, but be aware that bundlers (like webpack or esbuild) can't follow dynamic requires. Since DevUtils is a CLI tool installed globally from npm (not bundled for the browser), this isn't a problem.
- commander.js is in `package.json` as a dependency but we're not using it in this initial implementation. The manual argument parsing gives us more control and is easier to understand. If the argument parsing gets complex enough later, we can refactor to use commander. For now, don't remove it from package.json -- other future commands might want it.
- The context object is built fresh for every command invocation. Don't cache it across commands. Each command gets its own context.
- The `main()` function is async and calls `main()` at the bottom of the file without `.catch()`. If `main` throws and nothing catches it, Node.js will print an unhandled rejection warning. The try/catch inside `main()` should catch everything, but if you're seeing mysterious crashes, check for unhandled promise rejections. You can add a `.catch()` as a safety net: `main().catch(err => { console.error(err); process.exit(1); })`.
- The router catches exceptions from command `run()` functions and converts them to structured errors. This is important -- if a command throws an unstructured error (like a TypeError from a bug), the router wraps it in the standard error format so the output is still machine-readable.
- Don't worry about tab completion, aliases, or plugin routing in this story. Those are separate features that build on top of this foundation. This story just needs to route to the service index files that already exist in `src/commands/`.
