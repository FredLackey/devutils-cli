'use strict';

/**
 * help command.
 * Lists all services and top-level commands, or shows detailed help
 * for a specific service or command when given arguments.
 *
 * Examples:
 *   dev help              - List all services and top-level commands
 *   dev help config       - List all commands in the config service
 *   dev help config set   - Show detailed help for config set
 *   dev help version      - Show help for the version command
 */

const path = require('path');

const meta = {
  description: 'Show usage information',
  arguments: [
    { name: 'command', description: 'Command path to get help for (e.g., config set)', required: false, variadic: true }
  ],
  flags: []
};

/**
 * Known service directory names. Each one has an index.js that exports
 * name, description, and a commands map.
 * @type {string[]}
 */
const SERVICE_NAMES = [
  'config', 'machine', 'identity', 'tools', 'ignore',
  'util', 'alias', 'auth', 'api', 'ai', 'search'
];

/**
 * Top-level commands (not inside a service folder). Each entry has a
 * name and a description. Descriptions are read from the command's
 * meta export when available, with fallbacks for stubs that haven't
 * been filled in yet.
 * @type {Array<{ name: string, fallback: string }>}
 */
const TOP_LEVEL_COMMANDS = [
  { name: 'status',  fallback: 'Overall health check' },
  { name: 'update',  fallback: 'Update DevUtils CLI' },
  { name: 'version', fallback: 'Show the current installed version' },
  { name: 'schema',  fallback: 'Show or validate config schema' },
  { name: 'help',    fallback: 'Show usage information' },
];

/**
 * Loads a service index.js and returns { name, description, commands }.
 * Returns null if the service cannot be loaded.
 *
 * @param {string} serviceName - The service directory name (e.g., 'config').
 * @returns {object|null}
 */
function loadService(serviceName) {
  try {
    return require(path.join(__dirname, serviceName, 'index'));
  } catch {
    return null;
  }
}

/**
 * Loads a top-level command module and returns it.
 * Returns null if the module cannot be loaded.
 *
 * @param {string} commandName - The command file name (e.g., 'version').
 * @returns {object|null}
 */
function loadTopLevelCommand(commandName) {
  try {
    return require(path.join(__dirname, commandName));
  } catch {
    return null;
  }
}

/**
 * Gets the description for a top-level command. Reads from the command's
 * meta.description if available, otherwise uses the fallback.
 *
 * @param {{ name: string, fallback: string }} entry - The top-level command entry.
 * @returns {string}
 */
function getTopLevelDescription(entry) {
  const cmd = loadTopLevelCommand(entry.name);
  if (cmd && cmd.meta && cmd.meta.description) {
    return cmd.meta.description;
  }
  return entry.fallback;
}

/**
 * Builds a list of all services with their names and descriptions.
 *
 * @returns {Array<{ name: string, description: string }>}
 */
function buildServiceList() {
  const services = [];
  for (const name of SERVICE_NAMES) {
    const svc = loadService(name);
    if (svc) {
      services.push({ name: svc.name, description: svc.description });
    }
  }
  return services;
}

/**
 * Builds a list of all top-level commands with their names and descriptions.
 *
 * @returns {Array<{ name: string, description: string }>}
 */
function buildTopLevelCommandList() {
  return TOP_LEVEL_COMMANDS.map(entry => ({
    name: entry.name,
    description: getTopLevelDescription(entry),
  }));
}

/**
 * Pads a string to the given width with trailing spaces.
 *
 * @param {string} str - The string to pad.
 * @param {number} width - The target width.
 * @returns {string}
 */
function pad(str, width) {
  return str + ' '.repeat(Math.max(0, width - str.length));
}

/**
 * Shows the top-level help listing: all services and top-level commands.
 *
 * @param {object} context - The CLI context object.
 */
function showTopLevelHelp(context) {
  const services = buildServiceList();
  const commands = buildTopLevelCommandList();

  if (context.flags.format === 'json') {
    context.output.out({ services, commands });
    return;
  }

  // Find the longest name for alignment
  const allNames = [...services.map(s => s.name), ...commands.map(c => c.name)];
  const maxLen = Math.max(...allNames.map(n => n.length));
  const colWidth = maxLen + 4;

  context.output.info('Usage: dev <service> <command> [arguments] [flags]');
  context.output.info('');
  context.output.info('Services:');
  for (const svc of services) {
    context.output.info(`  ${pad(svc.name, colWidth)}${svc.description}`);
  }
  context.output.info('');
  context.output.info('Commands:');
  for (const cmd of commands) {
    context.output.info(`  ${pad(cmd.name, colWidth)}${cmd.description}`);
  }
  context.output.info('');
  context.output.info('Run "dev help <service>" to see commands within a service.');
  context.output.info('Run "dev help <service> <command>" for detailed command help.');
}

/**
 * Shows help for a specific service, listing all its commands.
 *
 * @param {object} service - The service module (with name, description, commands).
 * @param {object} context - The CLI context object.
 */
function showServiceHelp(service, context) {
  const commandNames = Object.keys(service.commands || {});
  const commandList = [];

  for (const name of commandNames) {
    let description = '';
    try {
      const cmd = service.commands[name]();
      if (cmd && cmd.meta && cmd.meta.description) {
        description = cmd.meta.description;
      }
    } catch {
      // Command module may not be fully implemented yet
    }
    commandList.push({ name, description });
  }

  if (context.flags.format === 'json') {
    context.output.out({
      service: service.name,
      description: service.description,
      commands: commandList,
    });
    return;
  }

  const maxLen = Math.max(...commandList.map(c => c.name.length));
  const colWidth = maxLen + 4;

  context.output.info(`${service.name}: ${service.description}`);
  context.output.info('');
  context.output.info('Commands:');
  for (const cmd of commandList) {
    const desc = cmd.description ? `${pad(cmd.name, colWidth)}${cmd.description}` : cmd.name;
    context.output.info(`  dev ${service.name} ${desc}`);
  }
  context.output.info('');
  context.output.info(`Run "dev help ${service.name} <command>" for detailed help.`);
}

/**
 * Shows detailed help for a specific command, including its description,
 * arguments, and flags.
 *
 * @param {object} command - The command module (with meta.description, meta.arguments, meta.flags).
 * @param {string} commandPath - The full command path for display (e.g., "config set").
 * @param {object} context - The CLI context object.
 */
function showCommandHelp(command, commandPath, context) {
  const m = command.meta || {};
  const args = m.arguments || [];
  const flags = m.flags || [];

  if (context.flags.format === 'json') {
    context.output.out({
      command: commandPath,
      description: m.description || '',
      arguments: args,
      flags: flags,
    });
    return;
  }

  context.output.info(`dev ${commandPath}`);
  context.output.info('');
  if (m.description) {
    context.output.info(`  ${m.description}`);
    context.output.info('');
  }

  if (args.length > 0) {
    context.output.info('Arguments:');
    const maxLen = Math.max(...args.map(a => a.name.length));
    const colWidth = maxLen + 4;
    for (const arg of args) {
      const req = arg.required ? '(required)' : '(optional)';
      context.output.info(`  ${pad(arg.name, colWidth)}${arg.description || ''} ${req}`);
    }
    context.output.info('');
  }

  if (flags.length > 0) {
    context.output.info('Flags:');
    const maxLen = Math.max(...flags.map(f => `--${f.name}`.length));
    const colWidth = maxLen + 4;
    for (const flag of flags) {
      const name = `--${flag.name}`;
      const parts = [flag.description || ''];
      if (flag.type) {
        parts.push(`(${flag.type})`);
      }
      if (flag.default !== undefined) {
        parts.push(`[default: ${flag.default}]`);
      }
      context.output.info(`  ${pad(name, colWidth)}${parts.join(' ')}`);
    }
    context.output.info('');
  }
}

/**
 * Main entry point for the help command.
 *
 * @param {object} args - Parsed command arguments. Positional args are the command path.
 * @param {object} context - The CLI context object.
 */
async function run(args, context) {
  const positional = args.positional || [];

  // No arguments: show top-level help
  if (positional.length === 0) {
    showTopLevelHelp(context);
    return;
  }

  const firstName = positional[0];
  const secondName = positional[1];

  // Check if the first argument is a service name
  const service = loadService(firstName);
  if (service) {
    if (!secondName) {
      // Show service-level help (list all commands in the service)
      showServiceHelp(service, context);
      return;
    }

    // Show help for a specific command within the service
    if (service.commands && service.commands[secondName]) {
      try {
        const cmd = service.commands[secondName]();
        showCommandHelp(cmd, `${firstName} ${secondName}`, context);
        return;
      } catch {
        // Fall through to unknown command error
      }
    }

    // Unknown command within the service
    const methods = Object.keys(service.commands || {}).join(', ');
    context.errors.throwError(
      404,
      `Unknown command "${secondName}" for service "${firstName}". Available commands: ${methods}`,
      'help'
    );
    return;
  }

  // Check if the first argument is a top-level command
  const topCmd = loadTopLevelCommand(firstName);
  if (topCmd) {
    showCommandHelp(topCmd, firstName, context);
    return;
  }

  // Unknown command
  context.errors.throwError(
    404,
    `Unknown command "${firstName}". Run "dev help" to see available commands.`,
    'help'
  );
}

module.exports = { meta, run };
