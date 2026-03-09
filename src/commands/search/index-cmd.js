'use strict';

const shell = require('../../lib/shell');
const { checkQmd } = require('./qmd');

const meta = {
  description: 'Rebuild or update the search index and generate embeddings',
  arguments: [],
  flags: [
    { name: 'force', type: 'boolean', description: 'Re-index everything from scratch (ignores incremental updates)' }
  ]
};

/**
 * Rebuilds or updates the QMD search index.
 * Triggers re-indexing of all collections and embedding generation.
 * Use --force to ignore incremental updates and rebuild from scratch.
 *
 * @param {object} args - Parsed CLI arguments { positional, flags }.
 * @param {object} context - CLI context { output, errors }.
 */
async function run(args, context) {
  // Check for QMD availability first
  const qmd = checkQmd();
  if (!qmd.available) {
    context.errors.throwError(1, qmd.message, 'search');
    return;
  }

  // Build the command
  let cmd = 'qmd index';
  if (args.flags.force) {
    cmd += ' --force';
  }

  // Print progress messages before starting
  context.output.info('Updating search index...');
  if (args.flags.force) {
    context.output.info('Force flag set -- re-indexing all documents from scratch.');
  }

  // Execute the index command
  const result = await shell.exec(cmd);

  if (result.exitCode !== 0) {
    context.errors.throwError(1, result.stderr || 'Index update failed.', 'search');
    return;
  }

  // Pass through QMD's output (informational, not structured data)
  context.output.info(result.stdout || 'Index updated successfully.');
}

module.exports = { meta, run };
