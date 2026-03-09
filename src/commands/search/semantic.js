'use strict';

const { checkQmd, runQmdSearch } = require('./qmd');

const meta = {
  description: 'Vector cosine similarity search for conceptually related content',
  arguments: [
    { name: 'query', description: 'Search query text', required: true }
  ],
  flags: [
    { name: 'collection', type: 'string', description: 'Restrict search to a specific collection' },
    { name: 'limit', type: 'number', description: 'Maximum number of results to return (default: 10)' }
  ]
};

/**
 * Runs a vector cosine similarity search via QMD.
 * Finds conceptually similar content even when the exact words don't match.
 * Requires embeddings to be generated first (via dev search index).
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

  const query = args.positional[0];

  if (!query) {
    context.errors.throwError(400, 'Missing required argument: <query>. Example: dev search semantic "remote server access"', 'search');
    return;
  }

  // Build the QMD command
  let cmd = `qmd semantic "${query}"`;

  if (args.flags.collection) {
    cmd += ` --collection "${args.flags.collection}"`;
  }
  if (args.flags.limit) {
    cmd += ` --limit ${args.flags.limit}`;
  }

  // Execute and parse results
  const results = await runQmdSearch(cmd, context);
  if (results === null) return; // error already reported

  if (results.length === 0) {
    // Check if this might be an embeddings issue
    context.output.info('No results found. If embeddings have not been generated, run "dev search index" first.');
    return;
  }

  context.output.out(results);
}

module.exports = { meta, run };
