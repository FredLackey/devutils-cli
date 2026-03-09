'use strict';

const meta = {
  description: 'Show details, supported platforms, and accepted arguments for a utility.',
  arguments: [
    { name: 'name', required: true, description: 'Name of the utility to inspect' },
  ],
  flags: [],
};

async function run(args, context) {
  const name = args.positional[0];
  if (!name) {
    context.errors.throwError(400, 'Usage: dev util show <name>', 'util');
    return;
  }

  const { findUtility } = require('./run');
  const util = findUtility(name);

  if (!util) {
    context.output.error(`Utility "${name}" not found.`);
    context.output.info('Run "dev util list" to see available utilities.');
    return;
  }

  const utilModule = require(util.path);
  const utilMeta = utilModule.meta || {};

  const info = {
    name: utilMeta.name || name,
    description: utilMeta.description || '(no description)',
    type: util.type,
    platforms: utilMeta.platforms || [],
    arguments: utilMeta.arguments || [],
    flags: utilMeta.flags || [],
  };

  if (context.flags.format === 'json') {
    context.output.out(info);
    return;
  }

  context.output.info(`Utility: ${info.name}`);
  context.output.info('');
  context.output.info(`  Description: ${info.description}`);
  context.output.info(`  Type:        ${info.type}`);
  context.output.info(`  Platforms:   ${info.platforms.length > 0 ? info.platforms.join(', ') : '(all)'}`);

  if (info.arguments.length > 0) {
    context.output.info('');
    context.output.info('  Arguments:');
    for (const arg of info.arguments) {
      const req = arg.required ? '(required)' : '(optional)';
      context.output.info(`    ${arg.name} ${req} - ${arg.description || ''}`);
    }
  }

  if (info.flags.length > 0) {
    context.output.info('');
    context.output.info('  Flags:');
    for (const flag of info.flags) {
      context.output.info(`    --${flag.name} - ${flag.description || ''}`);
    }
  }
}

module.exports = { meta, run };
