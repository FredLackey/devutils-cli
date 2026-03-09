'use strict';

const meta = {
  description: 'Introspect a command by dot-notation path. Returns description, arguments, and flags.',
  arguments: [
    { name: 'path', required: false, description: 'Dot-notation path (e.g., config.set, api.gmail.messages.list)' },
  ],
  flags: [],
};

async function run(args, context) {
  const schema = require('../lib/schema');
  const dotPath = args.positional[0];

  if (!dotPath) {
    // No path given: show top-level listing
    const registry = schema.getRegistry();
    const entries = [];

    for (const [name, entry] of Object.entries(registry)) {
      entries.push({
        Name: name,
        Type: entry.type || 'unknown',
        Description: entry.description || '',
      });
    }

    if (entries.length === 0) {
      context.output.info('No commands found in registry.');
      return;
    }

    context.output.out(entries);
    context.output.info(`\nUse "dev schema <path>" to inspect a specific command.`);
    context.output.info('Example: dev schema config.set');
    return;
  }

  const result = schema.resolve(dotPath);

  if (!result) {
    // Try to find suggestions by resolving the parent path
    const parts = dotPath.split('.');
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('.');
      const parent = schema.resolve(parentPath);
      if (parent) {
        const children = parent.commands
          ? Object.keys(parent.commands)
          : parent.resources
            ? Object.keys(parent.resources)
            : [];
        if (children.length > 0) {
          context.output.error(`No command found at "${dotPath}".`);
          context.output.info(`Available under "${parentPath}": ${children.join(', ')}`);
          return;
        }
      }
    }

    context.output.error(`No command found at "${dotPath}".`);
    context.output.info('Run "dev schema" to see all available paths.');
    return;
  }

  // Display the result
  if (result.type === 'service') {
    const cmds = Object.keys(result.commands || {});
    if (context.flags.format === 'json') {
      context.output.out(result);
      return;
    }
    context.output.info(`Service: ${result.name}`);
    context.output.info(`Description: ${result.description}`);
    context.output.info('');
    context.output.info(`Commands (${cmds.length}):`);
    for (const cmdName of cmds) {
      const cmd = result.commands[cmdName];
      context.output.info(`  ${cmdName.padEnd(20)} ${cmd.description || ''}`);
    }
    return;
  }

  if (result.type === 'plugin') {
    const resources = Object.keys(result.resources || {});
    if (context.flags.format === 'json') {
      context.output.out(result);
      return;
    }
    context.output.info(`Plugin: ${result.name} (v${result.version})`);
    context.output.info(`Description: ${result.description}`);
    context.output.info(`Auth: ${result.auth || 'none'}`);
    context.output.info('');
    context.output.info(`Resources (${resources.length}):`);
    for (const resName of resources) {
      const res = result.resources[resName];
      context.output.info(`  ${resName.padEnd(20)} ${res.description || ''}`);
    }
    return;
  }

  if (result.type === 'resource') {
    const cmds = Object.keys(result.commands || {});
    if (context.flags.format === 'json') {
      context.output.out(result);
      return;
    }
    context.output.info(`Resource: ${result.name}`);
    context.output.info(`Description: ${result.description}`);
    context.output.info('');
    context.output.info(`Commands (${cmds.length}):`);
    for (const cmdName of cmds) {
      const cmd = result.commands[cmdName];
      context.output.info(`  ${cmdName.padEnd(20)} ${cmd.description || ''}`);
    }
    return;
  }

  if (result.type === 'command') {
    if (context.flags.format === 'json') {
      context.output.out(result);
      return;
    }
    context.output.info(`Command: ${result.name}`);
    context.output.info(`Description: ${result.description}`);

    const cmdArgs = result.arguments || [];
    if (cmdArgs.length > 0) {
      context.output.info('');
      context.output.info('Arguments:');
      for (const arg of cmdArgs) {
        const req = arg.required ? '(required)' : '(optional)';
        context.output.info(`  ${(arg.name || '').padEnd(20)} ${req} ${arg.description || ''}`);
      }
    }

    const cmdFlags = result.flags || [];
    if (cmdFlags.length > 0) {
      context.output.info('');
      context.output.info('Flags:');
      for (const flag of cmdFlags) {
        context.output.info(`  --${(flag.name || '').padEnd(18)} ${flag.description || ''}`);
      }
    }
    return;
  }

  // Fallback: just output the result
  context.output.out(result);
}

module.exports = { meta, run };
