'use strict';

const fs = require('fs');
const path = require('path');
const { loadAliases, BIN_DIR } = require('./helpers');

const meta = {
  description: 'List all registered aliases and the commands they map to.',
  arguments: [],
  flags: []
};

/**
 * Lists all registered aliases from aliases.json, sorted alphabetically.
 * Shows a status indicator for aliases that are missing their wrapper script.
 *
 * @param {object} args - Parsed command arguments (positional and flags).
 * @param {object} context - The command context (output).
 */
async function run(args, context) {
  // Step 1: Load aliases.json
  const aliases = loadAliases();
  const entries = Object.entries(aliases);

  // Step 2: Handle the empty case
  if (entries.length === 0) {
    context.output.info('No aliases registered.');
    context.output.info('');
    context.output.info('Create one with: dev alias add <name> "<command>"');
    context.output.info('Example: dev alias add gs "dev util run git-status"');
    return;
  }

  // Step 3: Sort alphabetically by name
  entries.sort((a, b) => a[0].localeCompare(b[0]));

  // Step 4: Display the aliases
  const binDir = BIN_DIR;

  context.output.info(`Aliases (${entries.length}):`);
  context.output.info('');

  for (const [name, command] of entries) {
    // Check if the wrapper script exists (either Unix or Windows format)
    const scriptExists = fs.existsSync(path.join(binDir, name))
      || fs.existsSync(path.join(binDir, name + '.cmd'));
    const status = scriptExists ? '' : ' (no script -- run dev alias sync)';
    const nameCol = name.padEnd(25);
    context.output.info(`  ${nameCol} -> ${command}${status}`);
  }

  context.output.info('');
}

module.exports = { meta, run };
