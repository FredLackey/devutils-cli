'use strict';

const shell = require('../../lib/shell');
const { checkQmd, parseSearchResults } = require('./qmd');

const meta = {
  description: 'Show search index health, collection count, and document count',
  arguments: [],
  flags: []
};

/**
 * Shows the health and status of the QMD search index.
 * Displays collection count, document count, last update time, and health.
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

  // Run qmd status and capture the output
  const result = await shell.exec('qmd status');

  if (result.exitCode !== 0) {
    context.errors.throwError(1, result.stderr || 'Failed to get search index status.', 'search');
    return;
  }

  // Try to parse the output as JSON for structured data
  const output = result.stdout;
  try {
    const parsed = JSON.parse(output);
    context.output.out(parsed);
  } catch (err) {
    // QMD returned non-JSON output, pass it through as-is
    context.output.info(output || 'No status information available.');
  }
}

module.exports = { meta, run };
