#!/usr/bin/env node
'use strict';

/**
 * Command router. Parses arguments, resolves the service and method, applies
 * global flags, runs output format detection, and dispatches to the right
 * command file.
 *
 * This file should not contain business logic. It's routing only.
 */

const TOP_LEVEL_COMMANDS = ['status', 'update', 'version', 'schema', 'help'];

/**
 * Extracts global flags from the argument list and returns the remaining args.
 * Global flags can appear anywhere in the argument list.
 *
 * @param {string[]} args - Raw arguments from process.argv.slice(2).
 * @returns {{ flags: object, remaining: string[] }}
 */
function parseGlobalFlags(args) {
  const flags = {
    format: null,
    dryRun: false,
    verbose: false,
    quiet: false,
    help: false,
    version: false,
    jsonInput: null,
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

/**
 * Parses remaining command arguments into a structured object.
 * --key value pairs go into flags, everything else into positional.
 *
 * @param {string[]} rawArgs - Arguments after service/method have been stripped.
 * @returns {{ positional: string[], flags: object }}
 */
function parseCommandArgs(rawArgs) {
  const positional = [];
  const flags = {};
  let i = 0;

  while (i < rawArgs.length) {
    const arg = rawArgs[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);

      // Check if next arg exists and is not itself a flag
      if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('--')) {
        flags[key] = rawArgs[i + 1];
        i += 2;
      } else {
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

/**
 * Displays the CLI help message listing all services, commands, and global flags.
 */
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

/**
 * Resolves a command from the remaining arguments.
 * Checks top-level commands first, then service/method routing.
 *
 * @param {string[]} remaining - Arguments with global flags stripped.
 * @returns {object|null} The resolved command, args, and optional service.
 */
function resolveCommand(remaining) {
  const serviceName = remaining[0];
  const methodName = remaining[1];
  const commandArgs = remaining.slice(2);

  // Check for top-level command first
  if (TOP_LEVEL_COMMANDS.includes(serviceName)) {
    try {
      const cmd = require(`./commands/${serviceName}`);
      return { command: cmd, args: parseCommandArgs(remaining.slice(1)) };
    } catch {
      return null;
    }
  }

  // Try to load the service index
  let service;
  try {
    service = require(`./commands/${serviceName}/index`);
  } catch {
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

/**
 * Builds the context object that every command receives.
 * Contains all foundation modules pre-configured for the current invocation.
 *
 * @param {object} flags - The parsed global flags.
 * @returns {object} The context object.
 */
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

  let jsonInput = null;
  if (flags.jsonInput) {
    try {
      jsonInput = JSON.parse(flags.jsonInput);
    } catch {
      jsonInput = null;
    }
  }

  return {
    platform,
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
      jsonInput,
    },
  };
}

/**
 * Main entry point. Parses args, resolves the command, builds context, and runs.
 */
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

main().catch(err => {
  console.error(err);
  process.exit(1);
});
