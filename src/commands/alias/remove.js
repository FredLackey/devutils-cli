'use strict';

const { loadAliases, saveAliases, deleteWrapper, BIN_DIR } = require('./helpers');

const meta = {
  description: 'Remove an alias and delete its wrapper script from ~/.devutils/bin/.',
  arguments: [
    { name: 'name', required: true, description: 'The alias name to remove' }
  ],
  flags: [
    { name: 'confirm', type: 'boolean', description: 'Skip the confirmation prompt' }
  ]
};

/**
 * Removes an alias by deleting its entry from aliases.json and removing
 * the wrapper script from ~/.devutils/bin/.
 *
 * @param {object} args - Parsed command arguments (positional and flags).
 * @param {object} context - The command context (output, prompt, errors).
 */
async function run(args, context) {
  // Step 1: Validate the name and check it exists
  const name = args.positional[0];
  if (!name) {
    context.output.error('Usage: dev alias remove <name>');
    return;
  }

  const aliases = loadAliases();

  if (!aliases[name]) {
    context.output.error(`Alias "${name}" is not registered.`);
    context.output.error('Run "dev alias list" to see all aliases.');
    return;
  }

  // Step 2: Confirm removal unless --confirm flag is set
  if (!args.flags.confirm) {
    const ok = await context.prompt.confirm(
      `Remove alias "${name}" (${aliases[name]})?`,
      true
    );
    if (!ok) {
      context.output.info('Cancelled.');
      return;
    }
  }

  // Step 3: Delete the wrapper script (both Unix and Windows formats)
  const binDir = BIN_DIR;
  deleteWrapper(name, binDir);

  // Step 4: Remove from aliases.json
  delete aliases[name];
  saveAliases(aliases);

  // Step 5: Print confirmation
  context.output.info(`Alias "${name}" removed.`);
}

module.exports = { meta, run };
