'use strict';

const { checkQmd, runQmdSearch } = require('./qmd');

const meta = {
  description: 'Hybrid search combining BM25 keyword matching, vector similarity, and LLM re-ranking',
  arguments: [
    { name: 'query', description: 'Search query text', required: true }
  ],
  flags: [
    { name: 'collection', type: 'string', description: 'Restrict search to a specific collection' },
    { name: 'limit', type: 'number', description: 'Maximum number of results to return (default: 10)' },
    { name: 'min-score', type: 'number', description: 'Minimum relevance score between 0.0 and 1.0' }
  ]
};

/**
 * Runs a hybrid search (BM25 + vector + LLM re-ranking) via QMD.
 * Provides the highest quality results at the cost of speed.
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
    context.errors.throwError(400, 'Missing required argument: <query>. Example: dev search query "how to configure SSH"', 'search');
    return;
  }

  // Build the QMD command
  let cmd = `qmd query "${query}"`;

  if (args.flags.collection) {
    cmd += ` --collection "${args.flags.collection}"`;
  }
  if (args.flags.limit) {
    cmd += ` --limit ${args.flags.limit}`;
  }
  if (args.flags['min-score']) {
    cmd += ` --min-score ${args.flags['min-score']}`;
  }

  // Execute and parse results
  const results = await runQmdSearch(cmd, context);
  if (results === null) return; // error already reported

  if (results.length === 0) {
    context.output.info('No results found.');
    return;
  }

  context.output.out(results);
}

module.exports = { meta, run };
